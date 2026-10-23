/**
 * End-to-end smoke test of the live onboarding loop against the local DB.
 * Run: npx tsx --env-file=.env.local scripts/onboarding-smoke.ts
 * Creates a throwaway candidate, walks every step, asserts, then deletes it.
 */
import { db } from "@/lib/db";
import { emptyFormData } from "@/lib/onboarding-form";
import { emptyNhr } from "@/lib/onboarding/nhr";
import { templateFor } from "@/lib/onboarding/checklist";
import * as svc from "@/lib/onboarding/service";
import { removeCandidate } from "./remove-candidate";

const staff = { name: "Riya Kim", role: "onboarder" };

function check(cond: unknown, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`  ✓ ${msg}`);
}

async function expectErr(p: Promise<unknown>, msg: string) {
  try {
    await p;
  } catch (e) {
    if (e instanceof svc.OnboardingError) {
      console.log(`  ✓ ${msg} → "${e.message}"`);
      return;
    }
    throw e;
  }
  throw new Error(`FAIL: expected an error: ${msg}`);
}

const cleanup = removeCandidate;

async function main() {
  // Remove leftovers from any earlier failed run.
  for (const old of await db.candidate.findMany({ where: { email: { startsWith: "smoke." } }, select: { id: true } })) await cleanup(old.id);

  const start = new Date(Date.now() + 10 * 86_400_000).toISOString().slice(0, 10);
  const form = emptyFormData({
    firstName: "Smoke",
    lastName: "Tester",
    candidateEmail: `smoke.${Date.now()}@example.com`,
    mobile: "(555) 010-2000",
    client: "Meridian Health",
    jobTitle: "Clinical Data Analyst",
    startDate: start,
    employmentType: "employee",
    payTerms: "w2",
    workAuthorization: "h1b",
    workStatus: "Remote",
    workState: "TN",
    liveInState: "TN",
    city: "Nashville",
    state: "TN",
    billRate: "95",
    payRate: "62",
    assignedMembers: [
      { role: "Recruiter", user: "Mia Thompson" },
      { role: "Onboarder", user: "Riya Kim" },
    ],
  });

  console.log("1. Validation");
  await expectErr(svc.createOnboarding({ ...form, candidateEmail: "bad" }, { draft: false, actor: staff }), "rejects invalid email");
  await expectErr(svc.createOnboarding({ ...form, client: "" }, { draft: false, actor: staff }), "requires client on submit");

  console.log("2. Create + package assembly");
  const { id, items } = await svc.createOnboarding(form, { draft: false, actor: staff });
  const docs = await db.document.findMany({ where: { candidateId: id } });
  const names = docs.map((d) => d.name);
  check(items >= 10, `checklist generated (${items} items)`);
  check(names.includes("Federal W-4") && names.includes("I-9 Section 1"), "W-2 forms included");
  check(!names.includes("State Tax Withholding"), "no state tax form for TN (no income tax)");
  check(names.includes("Work Authorization Document"), "work authorization required for H-1B");
  check(names.includes("Professional License"), "Meridian client rule -> professional license");
  check((await db.screening.count({ where: { candidateId: id } })) === 2, "background + drug screening ordered (Meridian rules)");
  check((await db.training.findMany({ where: { candidateId: id } })).some((t) => /HIPAA/.test(t.title)), "HIPAA training assigned");
  check((await db.equipment.findFirst({ where: { candidateId: id } }))?.assetType === "Laptop", "laptop for remote worker");
  let c = await db.candidate.findUnique({ where: { id } });
  check(c?.status === "OFFER_ACCEPTED" && c.progress < 30, `status OFFER_ACCEPTED, progress ${c?.progress}%`);
  await expectErr(svc.createOnboarding(form, { draft: false, actor: staff }), "duplicate email blocked");

  console.log("3. Candidate completes forms");
  const w4 = docs.find((d) => d.name === "Federal W-4")!;
  await expectErr(svc.submitForm(id, w4.id, {}, "Smoke Tester"), "required fields enforced");
  await expectErr(svc.submitForm(id, w4.id, { filingStatus: "Single or married filing separately" }, "Someone Else"), "signature must match legal name");
  for (const d of docs) {
    const t = templateFor(d.name);
    if (t.kind !== "form") continue;
    const values = Object.fromEntries((t.fields ?? []).map((f) => [f.key, f.options?.[0] ?? (f.type === "date" ? "1990-01-01" : f.sensitive ? "123456789" : f.type === "number" ? "0" : "Test value")]));
    await svc.submitForm(id, d.id, values, "smoke tester");
  }
  const file = await svc.readDocumentFile(docs.find((d) => d.name === "Direct Deposit Authorization")!.id);
  const text = file?.bytes.toString() ?? "";
  check(text.includes("6789") && !text.includes("123456789"), "sensitive fields stored masked");

  console.log("4. Candidate uploads files");
  const big = new Uint8Array(200_000).fill(7);
  await expectErr(svc.uploadDocument(id, docs.find((d) => d.name === "Government Photo ID")!.id, { name: "id.exe", type: "application/x-msdownload", bytes: big }), "blocks unsafe file types");
  for (const d of docs.filter((x) => ["Government Photo ID", "Work Authorization Document", "Professional License"].includes(x.name))) {
    const r = await svc.uploadDocument(id, d.id, { name: `${d.name}.pdf`, type: "application/pdf", bytes: big }, "2030-01-01");
    check(r.aiScore > 80, `${d.name} uploaded (AI score ${r.aiScore})`);
  }
  c = await db.candidate.findUnique({ where: { id } });
  check(c?.status === "ONBOARDING", "status -> ONBOARDING after first submission");

  console.log("5. Onboarder reviews");
  const lic = docs.find((d) => d.name === "Professional License")!;
  await expectErr(svc.reviewDocument(lic.id, "reject", "", staff), "rejection needs a reason");
  await svc.reviewDocument(lic.id, "correction", "License image is cut off - include the expiry date.", staff);
  check((await db.communication.count({ where: { candidateId: id, subject: { contains: "Action needed" } } })) === 1, "candidate notified of correction");
  await svc.uploadDocument(id, lic.id, { name: "license-v2.pdf", type: "application/pdf", bytes: big }, "2029-06-30");
  for (const d of await db.document.findMany({ where: { candidateId: id, status: "SUBMITTED" } })) await svc.reviewDocument(d.id, "approve", "", staff);
  const pr = await db.payrollReadiness.findUnique({ where: { candidateId: id } });
  check(pr?.status === "READY", "payroll gate READY once W-4 / I-9 / ID / direct deposit / benefits approved");

  console.log("6. Screening, training, equipment, billing");
  for (const s of await db.screening.findMany({ where: { candidateId: id } })) {
    await expectErr(svc.recordScreening(s.id, "CLEAR", staff), "cannot clear before consent");
    await svc.consentScreening(id, s.id, "Smoke Tester");
    await svc.recordScreening(s.id, "CLEAR", staff);
  }
  for (const t of await db.training.findMany({ where: { candidateId: id } })) await svc.completeTraining(id, t.id, 92);
  const eq = (await db.equipment.findFirst({ where: { candidateId: id } }))!;
  for (let i = 0; i < 3; i++) await svc.advanceEquipment(eq.id, staff);
  await svc.confirmEquipment(id, eq.id);
  await expectErr(svc.confirmStart(id, staff), "cannot place before billing is ready");
  await svc.completeBillingSetup(id, { poNumber: "PO-77812", costCenter: "CC-410", clientWorkerId: "MH-55120", vmsWorkerId: "BL-90311" }, staff);

  console.log("7. Day 1");
  c = await db.candidate.findUnique({ where: { id } });
  check(c?.progress === 100 && c.stage === "Day 1 Prep", `progress 100%, stage ${c?.stage}`);
  await svc.confirmStart(id, staff);
  c = await db.candidate.findUnique({ where: { id } });
  check(c?.status === "PLACED", "candidate PLACED");
  const audits = await db.auditEvent.count({ where: { candidateId: id } });
  check(audits > 25, `${audits} audit events recorded`);
  const tl = await svc.getTimeline(id);
  check(tl.length > 25, `timeline has ${tl.length} entries`);

  await cleanup(id);

  console.log("8. New Hire Request (full-time) — Recruiting Manager intake");
  const rm = { name: "Victoria Chen", role: "recruiting-manager" };
  const nhr = emptyNhr({
    accountExecutive: "Priya Shah",
    recruiter: "Mia Thompson",
    recruitingManager: "Victoria Chen",
    status: "Full-Time",
    subStatus: "Full Time",
    firstName: "Konstantin",
    middleName: "G",
    lastName: "Smoketest",
    street: "720 North Dixie Hwy",
    aptSuite: "Apt #405",
    city: "Palm Beach",
    state: "FL",
    cellPhone: "561-900-6432",
    ssnLast4: "6789",
    dateOfBirth: "1966-04-28",
    email: `smoke.nhr.${Date.now()}@example.com`,
    sourcedFrom: "JobBoard - Monster",
    workAuthorization: "Citizen",
    liveInState: "FL",
    client: "Apex Dynamics",
    jobTitle: "Embedded Software Engineer",
    jobId: "24-02630",
    workCity: "Morrisville",
    workState: "NC",
    directManager: "Marcus Lee",
    startDate: start,
    termOfProject: "Permanent (Full-Time)",
    salary: "85,000",
    feePct: "",
  });
  await expectErr(svc.createFromNhr(nhr, rm), "NHR requires fee % for full-time");
  const r = await svc.createFromNhr({ ...nhr, feePct: "20" }, rm);
  const saved = await db.newHireRequest.findUnique({ where: { candidateId: r.id } });
  check(saved?.salary === 85000 && saved.feePct === 20 && saved.ssnLast4 === "6789", "NHR saved (salary, fee, SSN last 4 only)");
  check(saved?.sourcedFrom === "JobBoard - Monster" && saved.directManager === "Marcus Lee", "NHR keeps source and direct manager");
  const a = await db.assignment.findFirst({ where: { candidateId: r.id } });
  check(a?.remarks?.startsWith("Direct hire — 20% fee on $85,000 salary"), "FT fee recorded for Add / Drop (FT GP = fee / 960 h)");
  const ftDocs = (await db.document.findMany({ where: { candidateId: r.id } })).map((d) => d.name);
  check(ftDocs.includes("Offer Letter") && ftDocs.includes("State Tax Withholding") && !ftDocs.includes("Work Authorization Document"), "FT checklist: offer letter, NC state tax, no authorization upload for a citizen");
  check(!!r.onboarder, `case auto-assigned to onboarder ${r.onboarder}`);
  await cleanup(r.id);
  console.log("\nAll checks passed; smoke candidate removed.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
