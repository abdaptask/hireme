/**
 * Onboarding service — the first end-to-end, persisted onboarding loop
 * (§9 package creation → §5.2 candidate concierge → §5.3 onboarder review →
 * §16 readiness gates → §26 audit).
 *
 * Every mutation writes an audit event, updates the affected record, and
 * recomputes the candidate's progress, stage, and start-date risk (§33).
 *
 * Server-only — never import in client components.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { db } from "@/lib/db";
import { emptyFormData, type OnboardingFormData } from "@/lib/onboarding-form";
import { isC2C, isFullTime, money, nhrExceptions, validateNhr, workAuthKey, type NhrException, type NhrForm } from "./nhr";
import {
  STAGES,
  buildChecklist,
  templateFor,
  type ChecklistInput,
} from "./checklist";

export type Actor = { name: string; role: string };

export class OnboardingError extends Error {}

const DAY = 86_400_000;
const STORAGE_ROOT = path.join(process.cwd(), "storage", "uploads");

const EMPLOYEE_TYPES = new Set(["W2", "FULL_TIME", "CONTRACT_TO_HIRE"]);
const DOC_DONE = new Set(["APPROVED"]);
const DOC_NEEDS_CANDIDATE = new Set([
  "PENDING",
  "REJECTED",
  "CORRECTION_REQUIRED",
  "EXPIRED",
]);
const EQUIP_DONE = new Set(["DELIVERED", "ENROLLED", "READY"]);
/** Submitted but not yet reviewed — the candidate may still edit or replace it. */
const DOC_EDITABLE = new Set(["SUBMITTED", "AI_REVIEW"]);

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseDay(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d, 9);
}

/** Convert a rate to hourly (§16.2 pay rate validation). */
function hourly(rate: string, type: string): number | null {
  const n = Number(rate);
  if (!rate || !Number.isFinite(n) || n <= 0) return null;
  const per: Record<string, number> = {
    Hourly: 1,
    Daily: 8,
    Weekly: 40,
    Monthly: 2080 / 12,
    Annual: 2080,
  };
  return Math.round((n / (per[type] ?? 1)) * 100) / 100;
}

function employmentFrom(
  data: OnboardingFormData,
): ChecklistInput["employmentType"] {
  if (data.payTerms === "c2c") return "C2C";
  if (data.payTerms === "1099") return "INDEPENDENT_1099";
  if (data.employmentType === "full-time") return "FULL_TIME";
  return "W2";
}

function workModeFrom(s: string): ChecklistInput["workMode"] {
  return s === "Remote" ? "Remote" : s === "Hybrid" ? "Hybrid" : "Onsite";
}

function mask(v: string): string {
  const s = String(v ?? "");
  return s.length <= 4 ? "••••" : `••••${s.slice(-4)}`;
}

async function audit(data: {
  action:
    "CREATED" | "UPDATED" | "APPROVED" | "REJECTED" | "AI_ACTION" | "ESCALATED" | "OVERRIDDEN";
  entityType: string;
  entityId?: string;
  entityLabel?: string;
  actor: Actor;
  previousValue?: string | null;
  newValue?: string | null;
  reason?: string | null;
  candidateId: string;
  documentId?: string;
  packageId?: string;
  clientId?: string | null;
  sourceSystem?: string;
  aiInvolved?: boolean;
}) {
  await db.auditEvent.create({
    data: {
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      entityLabel: data.entityLabel,
      actor: data.actor.name,
      actorRole: data.actor.role,
      previousValue: data.previousValue ?? null,
      newValue: data.newValue ?? null,
      reason: data.reason ?? null,
      candidateId: data.candidateId,
      documentId: data.documentId,
      packageId: data.packageId,
      clientId: data.clientId ?? undefined,
      sourceSystem: data.sourceSystem ?? "hireme",
      aiInvolved: data.aiInvolved ?? false,
    },
  });
}

async function saveFile(
  candidateId: string,
  fileName: string,
  bytes: Uint8Array,
): Promise<number> {
  const dir = path.join(STORAGE_ROOT, candidateId);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, fileName), bytes);
  return bytes.byteLength;
}

/** Stored file for a document (portal download / reviewer preview). */
export async function readDocumentFile(
  docId: string,
): Promise<{
  bytes: Buffer;
  mimeType: string;
  name: string;
  candidateId: string;
} | null> {
  const d = await db.document.findUnique({ where: { id: docId } });
  if (!d?.candidateId || !d.fileUrl) return null;
  const dir = path.join(STORAGE_ROOT, d.candidateId);
  let files: string[] = [];
  try {
    files = await fs.readdir(dir);
  } catch {
    return null;
  }
  const file = files
    .filter((f) => f.startsWith(`${docId}-`))
    .sort()
    .pop();
  if (!file) return null;
  return {
    bytes: await fs.readFile(path.join(dir, file)),
    mimeType: d.mimeType ?? "application/octet-stream",
    name: file.slice(docId.length + 1),
    candidateId: d.candidateId,
  };
}

// ─────────────────────────────────────────────────────────
// Options for the Initiate Onboarding form (live clients & staff)
// ─────────────────────────────────────────────────────────

export async function onboardingOptions() {
  const [clients, cands, consultants] = await Promise.all([
    db.client.findMany({
      select: { name: true, accountManager: true },
      orderBy: { name: "asc" },
    }),
    db.candidate.findMany({
      select: { recruiter: true, onboarder: true, vendor: true },
    }),
    db.consultant.findMany({ select: { vendor: true } }),
  ]);
  const uniq = (xs: (string | null)[]) =>
    [...new Set(xs.filter((x): x is string => !!x))].sort();
  return {
    clients: clients.map((c) => c.name),
    vendors: uniq([
      ...cands.map((c) => c.vendor),
      ...consultants.map((c) => c.vendor),
    ]),
    team: [
      ...uniq(cands.map((c) => c.recruiter)).map((name) => ({
        name,
        role: "Recruiter",
      })),
      ...uniq(cands.map((c) => c.onboarder)).map((name) => ({
        name,
        role: "Onboarder",
      })),
      ...uniq(clients.map((c) => c.accountManager)).map((name) => ({
        name,
        role: "Account Manager",
      })),
    ],
  };
}

// ─────────────────────────────────────────────────────────
// Create — Initiate Onboarding (§9 steps 1–3, §8.2 package assembly)
// ─────────────────────────────────────────────────────────

export async function createOnboarding(
  data: OnboardingFormData,
  opts: { draft: boolean; actor: Actor; pendingApproval?: boolean },
): Promise<{ id: string; items: number }> {
  const first = data.firstName.trim();
  const last = data.lastName.trim();
  const email = data.candidateEmail.trim().toLowerCase();
  const missing = [
    !first && "first name",
    !last && "last name",
    !/^\S+@\S+\.\S+$/.test(email) && "a valid email",
    !opts.draft && !data.client && "client",
    !opts.draft && !parseDay(data.startDate) && "start date",
  ].filter(Boolean);
  if (missing.length)
    throw new OnboardingError(`Please provide ${missing.join(", ")}.`);
  if (await db.candidate.findUnique({ where: { email } }))
    throw new OnboardingError(`A candidate with ${email} already exists.`);

  const client = data.client
    ? await db.client.findUnique({
        where: { name: data.client },
        include: { rules: true },
      })
    : null;
  if (data.client && !client)
    throw new OnboardingError(`Client "${data.client}" was not found.`);

  const employmentType = employmentFrom(data);
  const workMode = workModeFrom(data.workStatus);
  const workState =
    (data.workState || data.liveInState || data.state || "")
      .toUpperCase()
      .slice(0, 2) || null;
  const startDate = parseDay(data.startDate);
  const endDate = parseDay(data.tentativeEnd);
  const member = (role: string) =>
    data.assignedMembers.find((m) => m.role === role)?.user ?? null;

  // Default onboarder: the one with the lightest active load (§36 weighted workload).
  let onboarder = member("Onboarder");
  if (!onboarder) {
    const loads = await db.candidate.groupBy({
      by: ["onboarder"],
      where: {
        status: { in: ["OFFER_ACCEPTED", "ONBOARDING"] },
        onboarder: { not: null },
      },
      _count: true,
    });
    onboarder = loads.sort((a, b) => a._count - b._count)[0]?.onboarder ?? null;
  }

  const id = `cand-${slug(`${first}-${last}`)}-${Date.now().toString(36).slice(-4)}`;
  const workCity = data.workCity || data.city;
  const payRate = hourly(data.payRate, data.payRateType);
  const billRate = hourly(data.billRate, data.billRateType);

  await db.candidate.create({
    data: {
      id,
      firstName: first,
      lastName: last,
      email,
      phone: data.mobile || null,
      status: opts.draft || opts.pendingApproval ? "NEW" : "OFFER_ACCEPTED",
      risk: "ON_TRACK",
      progress: 0,
      stage: opts.pendingApproval ? "Awaiting approval" : opts.draft ? "Profile Setup" : "Document Submission",
      employmentType,
      workLocation: workState
        ? `${workCity ? `${workCity}, ` : ""}${workState} (${workMode})`
        : workMode,
      startDate,
      clientName: client?.name ?? null,
      recruiter: member("Recruiter"),
      onboarder,
      vendor: employmentType === "C2C" ? data.vendorName || null : null,
      tags: ["new-hire", ...(opts.draft ? ["draft"] : []), ...(opts.pendingApproval ? ["pending-approval"] : [])],
      notes: data.remarks || null,
      lastContact: new Date(),
      street:
        [data.address, data.addressLine2].filter(Boolean).join(", ") || null,
      city: data.city || null,
      state: data.state || null,
      zip: data.zipCode || null,
      skillFamily: data.jobCategory || null,
      skills: [],
    },
  });

  await db.assignment.create({
    data: {
      candidateId: id,
      clientId: client?.id,
      jobTitle: data.jobTitle || null,
      jobId: data.jobId || null,
      jobCategory: data.jobCategory || null,
      employmentType,
      startDate,
      endDate,
      billRate,
      payRate,
      workLocation: data.workAddress || null,
      workState,
      status: "pending",
      msp: client?.msp ?? null,
      vendorId: data.vendorName ? slug(data.vendorName) : null,
      remarks: data.remarks || null,
    },
  });

  await audit({
    action: "CREATED",
    entityType: "Candidate",
    entityId: id,
    entityLabel: `${first} ${last}`,
    actor: opts.actor,
    newValue: opts.pendingApproval ? "NHR submitted — held for Super Admin approval" : opts.draft ? "Draft saved" : "Onboarding initiated",
    candidateId: id,
    clientId: client?.id,
  });
  if (opts.draft || opts.pendingApproval) return { id, items: 0 };

  const items = await assemblePackage(id, data, opts.actor);
  return { id, items };
}

/**
 * Package assembly (§8.2): checklist items, package with explanations,
 * readiness gates, welcome message. Runs at submission — or later, when a
 * held NHR exception is approved by a Super Admin.
 */
export async function assemblePackage(id: string, data: OnboardingFormData, actor: Actor): Promise<number> {
  const opts = { actor };
  const c = await db.candidate.findUnique({ where: { id } });
  if (!c) throw new OnboardingError("Candidate not found.");
  const first = c.firstName;
  const last = c.lastName;
  const onboarder = c.onboarder;
  const client = data.client ? await db.client.findUnique({ where: { name: data.client }, include: { rules: true } }) : null;
  const employmentType = employmentFrom(data);
  const workMode = workModeFrom(data.workStatus);
  const workState = (data.workState || data.liveInState || data.state || "").toUpperCase().slice(0, 2) || null;
  const startDate = parseDay(data.startDate);
  const payRate = hourly(data.payRate, data.payRateType);
  const billRate = hourly(data.billRate, data.billRateType);

  // ── Package assembly (§8.2) ────────────────────────────
  const plan = buildChecklist({
    employmentType,
    workAuthorization: data.workAuthorization,
    workState,
    workMode,
    client: client
      ? {
          name: client.name,
          rules: client.rules.map((r) => ({
            label: r.label,
            category: r.category,
          })),
        }
      : null,
  });
  const employee = EMPLOYEE_TYPES.has(employmentType);
  const due = startDate
    ? new Date(Math.max(Date.now() + 2 * DAY, startDate.getTime() - 3 * DAY))
    : new Date(Date.now() + 7 * DAY);
  const pkgId = `pkg-${id}`;

  await db.package.create({
    data: {
      id: pkgId,
      name: `${client?.name ?? "Onboarding"} — ${first} ${last}`,
      status: "PUBLISHED",
      clientId: client?.id,
      employmentType: {
        W2: "W-2",
        C2C: "C2C",
        INDEPENDENT_1099: "1099",
        FULL_TIME: "Full-time",
        CONTRACT_TO_HIRE: "Contract-to-hire",
      }[employmentType],
      workLocation: workState ?? undefined,
      jobCategory: data.jobCategory || undefined,
      effectiveDate: new Date(),
      owner: onboarder ?? opts.actor.name,
      approver: "Rules Engine",
      consultant: `${first} ${last}`,
      aiReviewStatus: "approved",
      notes: `Auto-assembled from ${plan.length} rules for ${first} ${last}.`,
      items: {
        create: plan.map((p) => ({
          section:
            p.type === "document"
              ? p.template!.category === "tax" ||
                p.template!.category === "payroll"
                ? "tax-payroll"
                : "required-documents"
              : p.type === "screening"
                ? "screening"
                : p.type === "training"
                  ? "training"
                  : "it-provisioning",
          type: p.type === "equipment" ? "provisioning" : p.type,
          label: p.label,
          required: true,
          owner:
            p.type === "document" || p.type === "training"
              ? "Candidate"
              : p.type === "screening"
                ? "Screening vendor"
                : "IT",
          notes: p.reason,
        })),
      },
      rules: {
        create: plan.map((p) => ({
          condition: p.ruleCategory,
          applies: true,
          reason: p.reason,
          category: p.ruleCategory.toLowerCase(),
        })),
      },
    },
  });

  for (const p of plan) {
    if (p.type === "document") {
      await db.document.create({
        data: {
          candidateId: id,
          name: p.label,
          category: p.template!.category,
          status: "PENDING",
        },
      });
    } else if (p.type === "screening") {
      await db.screening.create({
        data: {
          candidateId: id,
          vendor: p.meta!.vendor,
          packageType: p.meta!.packageType,
          status: "INVITED",
          orderedAt: new Date(),
          estimatedCompletion: new Date(Date.now() + 5 * DAY),
          cost: p.meta!.vendor === "Quest Diagnostics" ? 45 : 89,
        },
      });
    } else if (p.type === "training") {
      await db.training.create({
        data: {
          candidateId: id,
          title: p.label,
          category: p.meta!.category,
          status: "ASSIGNED",
          dueDate: due,
          required: true,
        },
      });
    } else {
      await db.equipment.create({
        data: {
          candidateId: id,
          assetType: p.meta!.assetType,
          label: p.label,
          status: "REQUESTED",
          returnRequired: true,
        },
      });
    }
  }

  // Readiness gates (§16) — data-derived checks set now; document checks sync on approval.
  await db.payrollReadiness.create({
    data: {
      candidateId: id,
      classification: true,
      payRate: payRate !== null,
      overtimeRules: true,
      taxJurisdiction: !!workState,
      directDeposit: !employee,
      w4: !employee,
      stateTax: !employee,
      i9: !employee,
      benefitsEligibility: !employee,
      payrollEntity: true,
      startDateSet: !!startDate,
    },
  });
  await db.billingReadiness.create({
    data: {
      candidateId: id,
      billRate: billRate !== null,
      markup: billRate !== null && payRate !== null && billRate > payRate,
      invoiceFrequency: !!client?.invoiceFrequency,
      billingEntity: true,
      expensePolicy: true,
      approvedStartDate: !!startDate,
      vmsId: !client?.msp,
    },
  });

  // Welcome message (§12, §24) — recorded; real delivery needs an email provider.
  await db.communication.create({
    data: {
      candidateId: id,
      channel: "EMAIL",
      direction: "outbound",
      subject: `Welcome to ApTask, ${first} — your onboarding portal is ready`,
      body: `Hi ${first}, welcome aboard! Your onboarding checklist for ${client?.name ?? "your assignment"} is ready (${plan.length} items, about ${plan.reduce((n, p) => n + (p.template?.estimateMin ?? 10), 0)} minutes). Open your portal to get started.`,
      status: data.blockEmails ? "scheduled" : "sent",
      sentAt: new Date(),
      sentBy: "Automation",
    },
  });
  await audit({
    action: "AI_ACTION",
    entityType: "Package",
    entityId: pkgId,
    entityLabel: `${client?.name ?? "Onboarding"} package`,
    actor: { name: "Rules Engine", role: "system" },
    newValue: `Generated ${plan.length} items`,
    reason: plan
      .map((p) => `${p.label}: ${p.reason}`)
      .join(" · ")
      .slice(0, 900),
    candidateId: id,
    packageId: pkgId,
    clientId: client?.id,
    sourceSystem: "package-engine",
  });

  await recompute(id);
  return plan.length;
}

// ─────────────────────────────────────────────────────────
// Recompute — progress, stage, readiness, risk (§16, §33)
// ─────────────────────────────────────────────────────────

export async function recompute(candidateId: string): Promise<void> {
  const c = await db.candidate.findUnique({
    where: { id: candidateId },
    include: {
      documents: true,
      screenings: true,
      training: true,
      equipment: true,
      payroll: true,
      billing: true,
    },
  });
  if (!c || c.status === "NEW") return;

  const employee = EMPLOYEE_TYPES.has(c.employmentType ?? "W2");
  const approved = (name: string) =>
    c.documents.some((d) => d.name === name && d.status === "APPROVED");
  const present = (name: string) => c.documents.some((d) => d.name === name);

  if (c.payroll) {
    const p = c.payroll;
    const checks = {
      w4: employee ? approved("Federal W-4") : true,
      stateTax: employee
        ? !present("State Tax Withholding") || approved("State Tax Withholding")
        : true,
      i9: employee
        ? approved("I-9 Section 1") && approved("Government Photo ID")
        : true,
      directDeposit: employee ? approved("Direct Deposit Authorization") : true,
      benefitsEligibility: employee ? approved("Benefits Election") : true,
    };
    const merged = { ...p, ...checks };
    const n = [
      merged.classification,
      merged.payRate,
      merged.overtimeRules,
      merged.taxJurisdiction,
      merged.directDeposit,
      merged.w4,
      merged.stateTax,
      merged.i9,
      merged.benefitsEligibility,
      merged.payrollEntity,
      merged.startDateSet,
    ].filter(Boolean).length;
    await db.payrollReadiness.update({
      where: { id: p.id },
      data: {
        ...checks,
        status: n === 11 ? "READY" : n >= 8 ? "PENDING" : "NOT_READY",
      },
    });
    c.payroll.status = n === 11 ? "READY" : n >= 8 ? "PENDING" : "NOT_READY";
  }
  if (c.billing) {
    const b = c.billing;
    const n = [
      b.billRate,
      b.markup,
      b.purchaseOrder,
      b.costCenter,
      b.clientWorkerId,
      b.vmsId,
      b.invoiceFrequency,
      b.timesheetMethod,
      b.expensePolicy,
      b.billingEntity,
      b.approvedStartDate,
    ].filter(Boolean).length;
    const status = n === 11 ? "READY" : n >= 8 ? "PENDING" : "NOT_READY";
    if (b.status !== status)
      await db.billingReadiness.update({
        where: { id: b.id },
        data: { status },
      });
    c.billing.status = status;
  }

  const units = [
    ...c.documents.map((d) => DOC_DONE.has(d.status)),
    ...c.screenings.map((s) => s.status === "CLEAR"),
    ...c.training.map((t) => t.status === "COMPLETED" || t.status === "WAIVED"),
    ...c.equipment.map((e) => EQUIP_DONE.has(e.status)),
    c.payroll ? c.payroll.status === "READY" : true,
    c.billing ? c.billing.status === "READY" : true,
  ];
  const done = units.filter(Boolean).length;
  const progress = units.length ? Math.round((done / units.length) * 100) : 0;

  const stage = c.documents.some((d) => !DOC_DONE.has(d.status))
    ? "Document Submission"
    : c.screenings.some((s) => s.status !== "CLEAR")
      ? "Background Check"
      : c.payroll && c.payroll.status !== "READY"
        ? "Tax & Payroll"
        : c.billing && c.billing.status !== "READY"
          ? "Client Requirements"
          : c.equipment.some((e) => !EQUIP_DONE.has(e.status))
            ? "IT Provisioning"
            : c.training.some(
                  (t) => t.status !== "COMPLETED" && t.status !== "WAIVED",
                )
              ? "Training"
              : "Day 1 Prep";

  // Start-date risk (§33): progress against time remaining.
  let risk: "ON_TRACK" | "NEEDS_ATTENTION" | "AT_RISK" | "UNLIKELY" =
    "ON_TRACK";
  if (c.status !== "PLACED" && progress < 100) {
    const days = c.startDate
      ? Math.ceil((c.startDate.getTime() - Date.now()) / DAY)
      : 30;
    // ~2-week onboarding window: little progress expected until ~12 days out.
    const expected = Math.max(0, Math.min(100, 100 - days * 8));
    const gap = expected - progress;
    if (gap > 40 && days <= 5) risk = "UNLIKELY";
    else if (gap > 20) risk = "AT_RISK";
    else if (gap > 0) risk = "NEEDS_ATTENTION";
    if (
      risk === "ON_TRACK" &&
      c.documents.some(
        (d) => d.status === "REJECTED" || d.status === "CORRECTION_REQUIRED",
      )
    )
      risk = "NEEDS_ATTENTION";
  }

  await db.candidate.update({
    where: { id: candidateId },
    data: { progress, stage, risk },
  });
}

// ─────────────────────────────────────────────────────────
// Candidate actions (portal — §5.2, §101.2)
// ─────────────────────────────────────────────────────────

async function ownedDoc(candidateId: string, docId: string) {
  const d = await db.document.findUnique({ where: { id: docId } });
  if (!d || d.candidateId !== candidateId)
    throw new OnboardingError("That item isn't part of your checklist.");
  if (!DOC_NEEDS_CANDIDATE.has(d.status) && !DOC_EDITABLE.has(d.status))
    throw new OnboardingError("This item was already approved — contact your onboarding specialist to change it.");
  return d;
}

async function candidateActor(candidateId: string): Promise<Actor> {
  const c = await db.candidate.findUnique({
    where: { id: candidateId },
    select: { firstName: true, lastName: true, status: true },
  });
  if (!c) throw new OnboardingError("Candidate not found.");
  if (c.status === "OFFER_ACCEPTED")
    await db.candidate.update({
      where: { id: candidateId },
      data: { status: "ONBOARDING" },
    });
  await db.candidate.update({
    where: { id: candidateId },
    data: { lastContact: new Date() },
  });
  return { name: `${c.firstName} ${c.lastName}`, role: "candidate" };
}

export async function submitForm(
  candidateId: string,
  docId: string,
  values: Record<string, string>,
  signature: string,
  confirmed = false,
): Promise<void> {
  const d = await ownedDoc(candidateId, docId);
  if (!confirmed) throw new OnboardingError("Please confirm the details are correct before signing.");
  const t = templateFor(d.name);
  if (t.kind !== "form")
    throw new OnboardingError("This item needs a file upload.");
  const missing = (t.fields ?? [])
    .filter((f) => f.required && !String(values[f.key] ?? "").trim())
    .map((f) => f.label);
  if (missing.length)
    throw new OnboardingError(`Please complete: ${missing.join(", ")}.`);
  const actor = await candidateActor(candidateId);
  if (signature.trim().toLowerCase() !== actor.name.toLowerCase())
    throw new OnboardingError(
      `Type your full legal name exactly ("${actor.name}") to sign.`,
    );

  const when = new Date();
  const lines = [
    `${d.name} — electronic submission`,
    `Signed by: ${actor.name}`,
    `Signed at: ${when.toISOString()}`,
    "",
    ...(t.fields ?? []).map(
      (f) =>
        `${f.label}: ${f.sensitive ? mask(values[f.key]) : values[f.key] || "—"}`,
    ),
    "",
    "I certify that the information provided is true and correct, and I agree to sign electronically.",
  ];
  const bytes = new TextEncoder().encode(lines.join("\n"));
  const size = await saveFile(
    candidateId,
    `${docId}-${slug(d.name)}.txt`,
    bytes,
  );
  await db.document.update({
    where: { id: docId },
    data: {
      status: "SUBMITTED",
      uploadedAt: when,
      fileUrl: `/api/files/${docId}`,
      fileSize: size,
      mimeType: "text/plain",
      aiScore: 100,
      aiFlags: [],
      rejectedReason: null,
      // Keep non-sensitive answers so the candidate can edit before review.
      formData: Object.fromEntries((t.fields ?? []).filter((f) => !f.sensitive).map((f) => [f.key, values[f.key] ?? ""])),
    },
  });
  await audit({
    action: "UPDATED",
    entityType: "Document",
    entityId: docId,
    entityLabel: d.name,
    actor,
    previousValue: d.status,
    newValue: DOC_EDITABLE.has(d.status) ? "RESUBMITTED (edited before review)" : "SUBMITTED (e-signed)",
    candidateId,
    documentId: docId,
    sourceSystem: "candidate-portal",
  });
  await recompute(candidateId);
}

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/webp",
]);
const MAX_BYTES = 10 * 1024 * 1024;

export async function uploadDocument(
  candidateId: string,
  docId: string,
  file: { name: string; type: string; bytes: Uint8Array },
  expiresAt?: string,
): Promise<{ aiScore: number; flags: string[] }> {
  const d = await ownedDoc(candidateId, docId);
  if (templateFor(d.name).kind !== "upload")
    throw new OnboardingError("This item is completed by filling in a form.");
  if (!ALLOWED_TYPES.has(file.type))
    throw new OnboardingError(
      "Please upload a PDF, JPG, PNG, HEIC, or WEBP file.",
    );
  if (file.bytes.byteLength > MAX_BYTES)
    throw new OnboardingError("Files must be 10 MB or smaller.");
  if (file.bytes.byteLength < 1024)
    throw new OnboardingError(
      "That file looks empty — please choose the actual document.",
    );
  const actor = await candidateActor(candidateId);

  // Image-quality pre-check (§20, §101.3) — explainable heuristics until OCR is wired.
  const flags: string[] = [];
  if (file.type.startsWith("image/") && file.bytes.byteLength < 60 * 1024)
    flags.push("low-resolution");
  const exp = expiresAt ? parseDay(expiresAt) : null;
  if (exp && exp.getTime() < Date.now()) flags.push("expired-document");
  const aiScore = Math.max(40, 96 - flags.length * 25);

  const safe = slug(file.name.replace(/\.[^.]+$/, "")) || "upload";
  const ext = (file.name.match(/\.[a-z0-9]+$/i)?.[0] ?? "").toLowerCase();
  const size = await saveFile(
    candidateId,
    `${docId}-${safe}${ext}`,
    file.bytes,
  );
  await db.document.update({
    where: { id: docId },
    data: {
      status: "SUBMITTED",
      uploadedAt: new Date(),
      fileUrl: `/api/files/${docId}`,
      fileSize: size,
      mimeType: file.type,
      aiScore,
      aiFlags: flags,
      expiresAt: exp,
      rejectedReason: null,
    },
  });
  await audit({
    action: "UPDATED",
    entityType: "Document",
    entityId: docId,
    entityLabel: d.name,
    actor,
    previousValue: d.status,
    newValue: `${DOC_EDITABLE.has(d.status) ? "REPLACED" : "SUBMITTED"} (${file.name}, ${Math.round(size / 1024)} KB)`,
    candidateId,
    documentId: docId,
    sourceSystem: "candidate-portal",
  });
  if (flags.length) {
    await audit({
      action: "AI_ACTION",
      entityType: "Document",
      entityId: docId,
      entityLabel: d.name,
      actor: { name: "Document Intelligence", role: "ai" },
      newValue: `Quality score ${aiScore}`,
      reason: `Flags: ${flags.join(", ")} — reviewer should check before approving.`,
      candidateId,
      documentId: docId,
      sourceSystem: "document-intelligence",
      aiInvolved: true,
    });
  }
  await recompute(candidateId);
  return { aiScore, flags };
}

export async function completeTraining(
  candidateId: string,
  trainingId: string,
  score: number,
): Promise<void> {
  const t = await db.training.findUnique({ where: { id: trainingId } });
  if (!t || t.candidateId !== candidateId)
    throw new OnboardingError("That course isn't assigned to you.");
  if (t.status === "COMPLETED") return;
  const actor = await candidateActor(candidateId);
  const passed = score >= 70;
  await db.training.update({
    where: { id: trainingId },
    data: {
      status: passed ? "COMPLETED" : "FAILED",
      score,
      completedAt: passed ? new Date() : null,
    },
  });
  await audit({
    action: "UPDATED",
    entityType: "Training",
    entityId: trainingId,
    entityLabel: t.title,
    actor,
    previousValue: t.status,
    newValue: passed
      ? `COMPLETED (${score}%)`
      : `FAILED (${score}%) — retake required`,
    candidateId,
    sourceSystem: "candidate-portal",
  });
  await recompute(candidateId);
}

export async function consentScreening(
  candidateId: string,
  screeningId: string,
  signature: string,
): Promise<void> {
  const s = await db.screening.findUnique({ where: { id: screeningId } });
  if (!s || s.candidateId !== candidateId)
    throw new OnboardingError("That screening isn't yours.");
  const actor = await candidateActor(candidateId);
  if (signature.trim().toLowerCase() !== actor.name.toLowerCase())
    throw new OnboardingError(
      `Type your full legal name exactly ("${actor.name}") to authorize.`,
    );
  await db.screening.update({
    where: { id: screeningId },
    data: { status: "IN_PROGRESS", consentedAt: new Date() },
  });
  await audit({
    action: "UPDATED",
    entityType: "Screening",
    entityId: screeningId,
    entityLabel: s.packageType ?? "Screening",
    actor,
    previousValue: s.status,
    newValue: "Consent signed — in progress with vendor",
    candidateId,
    sourceSystem: "candidate-portal",
  });
  await recompute(candidateId);
}

export async function confirmEquipment(
  candidateId: string,
  equipmentId: string,
): Promise<void> {
  const e = await db.equipment.findUnique({ where: { id: equipmentId } });
  if (!e || e.candidateId !== candidateId)
    throw new OnboardingError("That item isn't assigned to you.");
  if (e.status !== "DELIVERED" && e.status !== "SHIPPED")
    throw new OnboardingError("This item hasn't shipped yet.");
  const actor = await candidateActor(candidateId);
  await db.equipment.update({
    where: { id: equipmentId },
    data: {
      status: "ENROLLED",
      deliveredAt: e.deliveredAt ?? new Date(),
      deviceEnrolled: true,
    },
  });
  await audit({
    action: "UPDATED",
    entityType: "Equipment",
    entityId: equipmentId,
    entityLabel: e.label,
    actor,
    previousValue: e.status,
    newValue: "Receipt confirmed",
    candidateId,
    sourceSystem: "candidate-portal",
  });
  await recompute(candidateId);
}

// ─────────────────────────────────────────────────────────
// Onboarder actions (§5.3 review, §16 gates, §17 provisioning)
// ─────────────────────────────────────────────────────────

export async function reviewDocument(
  docId: string,
  decision: "approve" | "reject" | "correction",
  reason: string,
  actor: Actor,
): Promise<void> {
  const d = await db.document.findUnique({ where: { id: docId } });
  if (!d?.candidateId) throw new OnboardingError("Document not found.");
  if (decision !== "approve" && !reason.trim())
    throw new OnboardingError(
      "Tell the candidate what to fix — a reason is required.",
    );
  if (d.status !== "SUBMITTED" && d.status !== "AI_REVIEW")
    throw new OnboardingError("Only submitted documents can be reviewed.");
  const status =
    decision === "approve"
      ? "APPROVED"
      : decision === "reject"
        ? "REJECTED"
        : "CORRECTION_REQUIRED";
  await db.document.update({
    where: { id: docId },
    data: {
      status,
      reviewedBy: actor.name,
      reviewedAt: new Date(),
      rejectedReason: decision === "approve" ? null : reason.trim(),
    },
  });
  await audit({
    action: decision === "approve" ? "APPROVED" : "REJECTED",
    entityType: "Document",
    entityId: docId,
    entityLabel: d.name,
    actor,
    previousValue: d.status,
    newValue: status,
    reason: reason || null,
    candidateId: d.candidateId,
    documentId: docId,
  });
  if (decision !== "approve") {
    await db.communication.create({
      data: {
        candidateId: d.candidateId,
        channel: "PORTAL",
        direction: "outbound",
        subject: `Action needed: ${d.name}`,
        body: `Please resubmit your ${d.name}. Reason: ${reason.trim()}`,
        status: "sent",
        sentAt: new Date(),
        sentBy: actor.name,
        nudgeLevel: 0,
      },
    });
  }
  await recompute(d.candidateId);
}

export async function recordScreening(
  screeningId: string,
  result: "CLEAR" | "REVIEW_REQUIRED",
  actor: Actor,
): Promise<void> {
  const s = await db.screening.findUnique({ where: { id: screeningId } });
  if (!s?.candidateId) throw new OnboardingError("Screening not found.");
  if (!s.consentedAt)
    throw new OnboardingError(
      "The candidate hasn't signed the screening consent yet.",
    );
  await db.screening.update({
    where: { id: screeningId },
    data: {
      status: result,
      completedAt: new Date(),
      adjudicator: result === "REVIEW_REQUIRED" ? actor.name : s.adjudicator,
    },
  });
  await audit({
    action: result === "CLEAR" ? "APPROVED" : "ESCALATED",
    entityType: "Screening",
    entityId: screeningId,
    entityLabel: s.packageType ?? "Screening",
    actor,
    previousValue: s.status,
    newValue:
      result === "CLEAR"
        ? "Clear"
        : "Review required — routed to adjudication (human decision, §11)",
    candidateId: s.candidateId,
    sourceSystem: `${slug(s.vendor)}-integration`,
  });
  await recompute(s.candidateId);
}

const EQUIP_NEXT: Record<string, "APPROVED" | "SHIPPED" | "DELIVERED"> = {
  REQUESTED: "APPROVED",
  APPROVED: "SHIPPED",
  ASSIGNED: "SHIPPED",
  SHIPPED: "DELIVERED",
};

export async function advanceEquipment(
  equipmentId: string,
  actor: Actor,
): Promise<void> {
  const e = await db.equipment.findUnique({ where: { id: equipmentId } });
  if (!e?.candidateId) throw new OnboardingError("Equipment not found.");
  const next = EQUIP_NEXT[e.status];
  if (!next)
    throw new OnboardingError(
      "Nothing left to do for this item from IT's side.",
    );
  const data: Record<string, unknown> = { status: next };
  if (next === "SHIPPED") {
    data.carrier = "FedEx";
    data.trackingNumber = `7${String(Date.now()).slice(-11)}`;
    data.shippedAt = new Date();
    data.estimatedDelivery = new Date(Date.now() + 2 * DAY);
    data.serialNumber =
      e.serialNumber ?? `SN-${Date.now().toString(36).toUpperCase()}`;
    data.emailProvisioned = true;
    data.vpnProvisioned = true;
    data.clientCredentials = true;
  }
  if (next === "DELIVERED") data.deliveredAt = new Date();
  await db.equipment.update({ where: { id: equipmentId }, data });
  await audit({
    action: "UPDATED",
    entityType: "Equipment",
    entityId: equipmentId,
    entityLabel: e.label,
    actor,
    previousValue: e.status,
    newValue: next,
    candidateId: e.candidateId,
    sourceSystem: "asset-management",
  });
  await recompute(e.candidateId);
}

export async function completeBillingSetup(
  candidateId: string,
  input: {
    poNumber: string;
    costCenter: string;
    clientWorkerId: string;
    vmsWorkerId: string;
  },
  actor: Actor,
): Promise<void> {
  const b = await db.billingReadiness.findUnique({ where: { candidateId } });
  if (!b) throw new OnboardingError("No billing setup for this candidate.");
  await db.billingReadiness.update({
    where: { candidateId },
    data: {
      poNumber: input.poNumber || b.poNumber,
      purchaseOrder: !!(input.poNumber || b.poNumber),
      costCenter: !!input.costCenter || b.costCenter,
      clientWorkerId2: input.clientWorkerId || b.clientWorkerId2,
      clientWorkerId: !!(input.clientWorkerId || b.clientWorkerId2),
      vmsWorkerId: input.vmsWorkerId || b.vmsWorkerId,
      vmsId: b.vmsId || !!input.vmsWorkerId,
      timesheetMethod: true,
    },
  });
  await audit({
    action: "UPDATED",
    entityType: "BillingReadiness",
    entityId: b.id,
    entityLabel: "Billing setup",
    actor,
    newValue: [
      input.poNumber && `PO ${input.poNumber}`,
      input.costCenter && `Cost center ${input.costCenter}`,
      input.clientWorkerId && `Worker ID ${input.clientWorkerId}`,
      input.vmsWorkerId && `VMS ID ${input.vmsWorkerId}`,
    ]
      .filter(Boolean)
      .join(", "),
    candidateId,
  });
  await recompute(candidateId);
}

export async function confirmStart(
  candidateId: string,
  actor: Actor,
): Promise<void> {
  const c = await db.candidate.findUnique({ where: { id: candidateId } });
  if (!c) throw new OnboardingError("Candidate not found.");
  if (c.progress < 100)
    throw new OnboardingError(
      `Can't mark fully onboarded yet — checklist is ${c.progress}% complete. Compliance, payroll, and billing must all be ready (§16).`,
    );
  await db.candidate.update({
    where: { id: candidateId },
    data: { status: "PLACED", stage: "Day 1 Prep", risk: "ON_TRACK" },
  });
  await db.assignment.updateMany({
    where: { candidateId, status: "pending" },
    data: { status: "active" },
  });
  await audit({
    action: "APPROVED",
    entityType: "Candidate",
    entityId: candidateId,
    entityLabel: `${c.firstName} ${c.lastName}`,
    actor,
    previousValue: c.status,
    newValue: "PLACED — Day 1 confirmed",
    candidateId,
  });
  await db.communication.create({
    data: {
      candidateId,
      channel: "EMAIL",
      direction: "outbound",
      subject: `You're all set for Day 1, ${c.firstName}!`,
      body: "Everything is complete. Your manager and IT access are ready — welcome to the team.",
      status: "sent",
      sentAt: new Date(),
      sentBy: "Automation",
    },
  });
}

// ─────────────────────────────────────────────────────────
// Read models
// ─────────────────────────────────────────────────────────

export type ChecklistRow = {
  id: string;
  kind:
    "document" | "screening" | "training" | "equipment" | "payroll" | "billing";
  label: string;
  status: string;
  owner:
    "Candidate" | "Onboarder" | "Screening vendor" | "IT" | "Account manager";
  reason: string | null;
  detail: string | null;
  fileUrl: string | null;
  aiScore: number | null;
  aiFlags: string[];
  done: boolean;
  /** What the onboarder can do now. */
  actions: (
    | "approve"
    | "reject"
    | "correction"
    | "clear"
    | "review"
    | "advance"
    | "billing"
  )[];
};

export async function getChecklist(
  candidateId: string,
): Promise<ChecklistRow[] | null> {
  const c = await db.candidate.findUnique({
    where: { id: candidateId },
    include: {
      documents: { orderBy: { createdAt: "asc" } },
      screenings: true,
      training: true,
      equipment: true,
      payroll: true,
      billing: true,
    },
  });
  if (!c) return null;
  const pkg = await db.package.findUnique({
    where: { id: `pkg-${candidateId}` },
    include: { items: true },
  });
  if (!pkg) return null; // not created through the live flow
  const reasonFor = (label: string) =>
    pkg.items.find((i) => i.label === label)?.notes ?? null;

  const rows: ChecklistRow[] = [];
  for (const d of c.documents) {
    rows.push({
      id: d.id,
      kind: "document",
      label: d.name,
      status: d.status,
      owner: ["SUBMITTED", "AI_REVIEW"].includes(d.status)
        ? "Onboarder"
        : "Candidate",
      reason: reasonFor(d.name),
      detail: d.rejectedReason
        ? `Returned: ${d.rejectedReason}`
        : d.uploadedAt
          ? `Submitted ${d.uploadedAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}${d.reviewedBy ? ` · reviewed by ${d.reviewedBy}` : ""}`
          : "Waiting on candidate",
      fileUrl: d.fileUrl,
      aiScore: d.aiScore,
      aiFlags: d.aiFlags,
      done: d.status === "APPROVED",
      actions: ["SUBMITTED", "AI_REVIEW"].includes(d.status)
        ? ["approve", "correction", "reject"]
        : [],
    });
  }
  for (const s of c.screenings) {
    rows.push({
      id: s.id,
      kind: "screening",
      label: s.packageType ?? "Screening",
      status: s.status,
      owner: s.consentedAt ? "Screening vendor" : "Candidate",
      reason: reasonFor(s.packageType ?? ""),
      detail: `${s.vendor} · ${s.consentedAt ? "consent signed" : "awaiting candidate consent"}`,
      fileUrl: null,
      aiScore: null,
      aiFlags: [],
      done: s.status === "CLEAR",
      actions:
        s.consentedAt && !["CLEAR", "REVIEW_REQUIRED"].includes(s.status)
          ? ["clear", "review"]
          : [],
    });
  }
  for (const t of c.training) {
    rows.push({
      id: t.id,
      kind: "training",
      label: t.title,
      status: t.status,
      owner: "Candidate",
      reason: reasonFor(t.title),
      detail: t.completedAt
        ? `Completed · score ${t.score}%`
        : t.dueDate
          ? `Due ${t.dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
          : null,
      fileUrl: null,
      aiScore: null,
      aiFlags: [],
      done: t.status === "COMPLETED" || t.status === "WAIVED",
      actions: [],
    });
  }
  for (const e of c.equipment) {
    rows.push({
      id: e.id,
      kind: "equipment",
      label: e.label,
      status: e.status,
      owner: e.status === "DELIVERED" ? "Candidate" : "IT",
      reason: reasonFor(e.label),
      detail: e.trackingNumber ? `${e.carrier} ${e.trackingNumber}` : null,
      fileUrl: null,
      aiScore: null,
      aiFlags: [],
      done: EQUIP_DONE.has(e.status),
      actions: EQUIP_NEXT[e.status] ? ["advance"] : [],
    });
  }
  if (c.payroll) {
    const p = c.payroll;
    const miss = (
      [
        ["classification", "classification"],
        ["payRate", "pay rate"],
        ["taxJurisdiction", "tax jurisdiction"],
        ["directDeposit", "direct deposit"],
        ["w4", "W-4"],
        ["stateTax", "state tax"],
        ["i9", "I-9"],
        ["benefitsEligibility", "benefits"],
        ["startDateSet", "start date"],
      ] as const
    )
      .filter(([k]) => !p[k])
      .map(([, l]) => l);
    rows.push({
      id: p.id,
      kind: "payroll",
      label: "Payroll readiness",
      status: p.status,
      owner: "Onboarder",
      reason:
        "Gate: a consultant can't be fully onboarded until payroll is ready (§16).",
      detail: miss.length
        ? `Waiting on: ${miss.join(", ")}`
        : "All payroll checks complete",
      fileUrl: null,
      aiScore: null,
      aiFlags: [],
      done: p.status === "READY",
      actions: [],
    });
  }
  if (c.billing) {
    const b = c.billing;
    const miss = (
      [
        ["billRate", "bill rate"],
        ["markup", "markup"],
        ["purchaseOrder", "PO"],
        ["costCenter", "cost center"],
        ["clientWorkerId", "client worker ID"],
        ["vmsId", "VMS ID"],
        ["timesheetMethod", "timesheet setup"],
      ] as const
    )
      .filter(([k]) => !b[k])
      .map(([, l]) => l);
    rows.push({
      id: b.id,
      kind: "billing",
      label: "Billing readiness",
      status: b.status,
      owner: "Account manager",
      reason: "Gate: billing must be set up before the start date (§16).",
      detail: miss.length
        ? `Missing: ${miss.join(", ")}`
        : "All billing checks complete",
      fileUrl: null,
      aiScore: null,
      aiFlags: [],
      done: b.status === "READY",
      actions: b.status === "READY" ? [] : ["billing"],
    });
  }
  return rows;
}

/** Activity timeline (§100.3, §41.3 process replay) from audit + communications. */
export async function getTimeline(candidateId: string) {
  const [ev, comms] = await Promise.all([
    db.auditEvent.findMany({
      where: { candidateId },
      orderBy: { timestamp: "desc" },
      take: 60,
    }),
    db.communication.findMany({
      where: { candidateId },
      orderBy: { sentAt: "desc" },
      take: 30,
    }),
  ]);
  const kindOf = (
    role: string | null,
    action: string,
  ): "candidate" | "human" | "ai" | "integration" | "document" | "approval" =>
    role === "candidate"
      ? "candidate"
      : role === "ai" || action === "AI_ACTION"
        ? "ai"
        : role === "system" || role === "integration"
          ? "integration"
          : action === "APPROVED"
            ? "approval"
            : "human";
  return [
    ...ev.map((e) => ({
      at: e.timestamp,
      id: e.id,
      kind: kindOf(e.actorRole, e.action),
      title: `${e.entityLabel ?? e.entityType}: ${e.newValue ?? e.action.toLowerCase()}`,
      detail: [e.actor, e.reason].filter(Boolean).join(" — ").slice(0, 240),
    })),
    ...comms.map((m) => ({
      at: m.sentAt ?? m.createdAt,
      id: m.id,
      kind: "integration" as const,
      title: `${m.channel === "PORTAL" ? "Portal message" : m.channel === "EMAIL" ? "Email" : m.channel} ${m.status === "scheduled" ? "scheduled" : "sent"}: ${m.subject ?? ""}`,
      detail: m.sentBy ?? undefined,
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .map((e) => ({
      id: e.id,
      time: e.at.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
      kind: e.kind,
      title: e.title,
      detail: e.detail || undefined,
    }));
}

/** Everything the live candidate portal renders (§5.2, §101.1). */
export async function getPortalView(candidateId: string) {
  const c = await db.candidate.findUnique({
    where: { id: candidateId },
    include: {
      documents: { orderBy: { createdAt: "asc" } },
      screenings: true,
      training: { orderBy: { dueDate: "asc" } },
      equipment: true,
      payroll: true,
      billing: true,
      assignments: { orderBy: { createdAt: "desc" }, take: 1 },
      communications: {
        where: { channel: { not: "INTERNAL" } },
        orderBy: { sentAt: "desc" },
        take: 12,
      },
    },
  });
  if (!c) return null;

  type Task = {
    id: string;
    kind: "document" | "training" | "screening" | "equipment";
    title: string;
    why: string;
    estimate: string;
    status: "action" | "review" | "done";
    statusLabel: string;
    rejection?: string;
    href: string;
  };
  const tasks: Task[] = [];
  for (const d of c.documents) {
    const t = templateFor(d.name);
    const status = DOC_NEEDS_CANDIDATE.has(d.status)
      ? "action"
      : d.status === "APPROVED"
        ? "done"
        : "review";
    tasks.push({
      id: d.id,
      kind: "document",
      title: d.name,
      why: t.why,
      estimate: `${t.estimateMin} min`,
      status,
      statusLabel:
        {
          PENDING: "To do",
          SUBMITTED: "In review",
          AI_REVIEW: "In review",
          APPROVED: "Approved",
          REJECTED: "Needs correction",
          CORRECTION_REQUIRED: "Needs correction",
          EXPIRED: "Expired — upload new",
        }[d.status] ?? d.status,
      rejection: d.rejectedReason ?? undefined,
      href: `/portal/tasks/${d.id}`,
    });
  }
  for (const s of c.screenings) {
    tasks.push({
      id: s.id,
      kind: "screening",
      title: `${s.packageType ?? "Background check"} — consent`,
      why: "Authorize the screening your client requires. Results are confidential.",
      estimate: "2 min",
      status: s.consentedAt
        ? s.status === "CLEAR"
          ? "done"
          : "review"
        : "action",
      statusLabel: s.consentedAt
        ? s.status === "CLEAR"
          ? "Complete"
          : "In progress"
        : "To do",
      href: `/portal/tasks/${s.id}`,
    });
  }
  for (const t of c.training) {
    tasks.push({
      id: t.id,
      kind: "training",
      title: t.title,
      why: "Required before you get system access.",
      estimate: "10 min",
      status:
        t.status === "COMPLETED" || t.status === "WAIVED" ? "done" : "action",
      statusLabel:
        t.status === "FAILED"
          ? "Retake needed"
          : t.status === "COMPLETED"
            ? `Completed · ${t.score}%`
            : "To do",
      href: `/portal/tasks/${t.id}`,
    });
  }
  for (const e of c.equipment) {
    const needsMe = e.status === "DELIVERED" || e.status === "SHIPPED";
    tasks.push({
      id: e.id,
      kind: "equipment",
      title: e.label,
      why:
        e.assetType === "Badge"
          ? "Your building badge for Day 1."
          : "Your work laptop, shipped to you.",
      estimate: "1 min",
      status:
        EQUIP_DONE.has(e.status) && e.status !== "DELIVERED"
          ? "done"
          : needsMe
            ? "action"
            : "review",
      statusLabel:
        (
          {
            REQUESTED: "Being prepared",
            APPROVED: "Being prepared",
            SHIPPED: "On its way — confirm when it arrives",
            DELIVERED: "Delivered — confirm receipt",
            ENROLLED: "Received",
            READY: "Ready",
          } as Record<string, string>
        )[e.status] ?? e.status,
      href: `/portal/tasks/${e.id}`,
    });
  }

  const stageIdx = Math.max(
    0,
    STAGES.indexOf(
      (c.stage ?? "Document Submission") as (typeof STAGES)[number],
    ),
  );
  return {
    id: c.id,
    firstName: c.firstName,
    fullName: `${c.firstName} ${c.lastName}`,
    role: c.assignments[0]?.jobTitle ?? "Consultant",
    client: c.clientName ?? "—",
    employmentType: c.employmentType,
    location: c.workLocation ?? "—",
    startDate: c.startDate,
    daysToStart: c.startDate
      ? Math.ceil((c.startDate.getTime() - Date.now()) / DAY)
      : null,
    progress: c.progress,
    stage: c.stage ?? "Document Submission",
    placed: c.status === "PLACED",
    stages: STAGES.map((label, i) => ({
      label,
      state:
        c.status === "PLACED" || i < stageIdx
          ? "completed"
          : i === stageIdx
            ? "current"
            : "upcoming",
    })),
    tasks,
    minutesLeft: tasks
      .filter((t) => t.status === "action")
      .reduce((n, t) => n + parseInt(t.estimate, 10), 0),
    day1: [
      {
        label: "Documents approved",
        ok: c.documents.every((d) => d.status === "APPROVED"),
      },
      {
        label: "Background screening complete",
        ok: c.screenings.every((s) => s.status === "CLEAR"),
      },
      { label: "Payroll set up", ok: c.payroll?.status === "READY" },
      { label: "Client setup complete", ok: c.billing?.status === "READY" },
      {
        label: "Equipment received",
        ok: c.equipment.every(
          (e) => EQUIP_DONE.has(e.status) && e.status !== "DELIVERED",
        ),
      },
      {
        label: "Training complete",
        ok: c.training.every(
          (t) => t.status === "COMPLETED" || t.status === "WAIVED",
        ),
      },
    ],
    messages: c.communications.map((m) => ({
      id: m.id,
      subject: m.subject ?? "",
      body: m.body ?? "",
      from: m.sentBy ?? "ApTask",
      at: m.sentAt ?? m.createdAt,
    })),
    team: [
      c.recruiter && { name: c.recruiter, role: "Recruiter" },
      c.onboarder && { name: c.onboarder, role: "Onboarding specialist" },
    ].filter((x): x is { name: string; role: string } => !!x),
  };
}

export type PortalView = NonNullable<Awaited<ReturnType<typeof getPortalView>>>;

/** One portal task with what's needed to complete it. */
export async function getPortalTask(candidateId: string, taskId: string) {
  const [d, s, t, e] = await Promise.all([
    db.document.findUnique({ where: { id: taskId } }),
    db.screening.findUnique({ where: { id: taskId } }),
    db.training.findUnique({ where: { id: taskId } }),
    db.equipment.findUnique({ where: { id: taskId } }),
  ]);
  const c = await db.candidate.findUnique({
    where: { id: candidateId },
    select: { firstName: true, lastName: true, newHireRequest: { select: { formData: true } } },
  });
  const name = c ? `${c.firstName} ${c.lastName}` : "";
  if (d?.candidateId === candidateId) {
    const nhr = (c?.newHireRequest?.formData as unknown as Partial<NhrForm> | null) ?? null;
    // Edit an earlier submission with its previous answers; otherwise pre-fill from the NHR.
    const previous = (d.formData as Record<string, string> | null) ?? null;
    const prefill = previous ?? portalPrefill(d.name, nhr, name);
    return {
      kind: "document" as const,
      name,
      doc: d,
      template: templateFor(d.name),
      prefill,
      prefillSource: previous ? ("previous" as const) : Object.values(prefill).some(Boolean) ? ("nhr" as const) : null,
      expiryPrefill: d.name === "Work Authorization Document" ? (nhr?.authExpiry ?? "") : "",
    };
  }
  if (s?.candidateId === candidateId)
    return { kind: "screening" as const, name, screening: s };
  if (t?.candidateId === candidateId)
    return { kind: "training" as const, name, training: t };
  if (e?.candidateId === candidateId)
    return { kind: "equipment" as const, name, equipment: e };
  return null;
}

// ─────────────────────────────────────────────────────────
// New Hire Request (NHR) intake — Recruiting Manager (§9 step 1)
// ─────────────────────────────────────────────────────────

export async function createFromNhr(f: NhrForm, actor: Actor): Promise<{ id: string; items: number; onboarder: string | null; pendingApproval: boolean }> {
  const errors = validateNhr(f);
  const first = Object.values(errors)[0];
  if (first) throw new OnboardingError(`${first}${Object.keys(errors).length > 1 ? ` (and ${Object.keys(errors).length - 1} more)` : ""}.`);

  // Bypassable exceptions need a reason; the request is then held for Super Admin approval (§25).
  const exceptions = nhrExceptions(f);
  if (exceptions.length && !f.exceptionReason.trim()) {
    throw new OnboardingError(`${exceptions.map((x) => x.message).join("; ")}. Correct it, or give a reason to request Super Admin approval.`);
  }
  const pendingApproval = exceptions.length > 0;

  const fullTime = isFullTime(f);
  const salary = money(f.salary);
  const feePct = Number(f.feePct.replace(/[%\s]/g, ""));
  const fd = nhrToFormData(f);

  const { id, items } = await createOnboarding(fd, { draft: false, actor, pendingApproval });
  try {
    await recordNhr(id, f, actor, fullTime, salary, feePct, exceptions);
  } catch (e) {
    // All-or-nothing: never leave a half-created onboarding case behind.
    await deleteCandidateCascade(id);
    throw e;
  }
  const c = await db.candidate.findUnique({ where: { id }, select: { onboarder: true } });
  return { id, items, onboarder: c?.onboarder ?? null, pendingApproval };
}

/** Map an NHR onto the onboarding form model the package engine consumes. */
function nhrToFormData(f: NhrForm): OnboardingFormData {
  const fullTime = isFullTime(f);
  const salary = money(f.salary);
  return emptyFormData({
    employmentType: fullTime ? "full-time" : "employee",
    payTerms: fullTime ? "w2" : f.taxTerms === "C2C" ? "c2c" : f.taxTerms === "1099" ? "1099" : "w2",
    candidateEmail: f.email,
    firstName: f.firstName,
    lastName: f.lastName,
    mobile: f.cellPhone,
    homePhone: f.homePhone,
    address: f.street,
    addressLine2: f.aptSuite,
    city: f.city,
    state: f.state,
    zipCode: f.zip,
    dateOfBirth: f.dateOfBirth,
    sourcedFrom: f.sourcedFrom === "Other" ? f.sourcedOther : f.sourcedFrom,
    workAuthorization: workAuthKey(f.workAuthorization),
    authorizationExpiry: f.authExpiry,
    client: f.client,
    jobId: f.jobId,
    jobTitle: f.jobTitle,
    startDate: f.startDate,
    tentativeEnd: f.endDate,
    jobCategory: "",
    vendorName: isC2C(f) ? f.vendorName : "",
    liveInState: f.liveInState,
    workStatus: f.workMode === "Onsite" ? "On-site" : f.workMode,
    workCity: f.workCity,
    workState: f.workState,
    billRate: fullTime ? "" : f.billRate,
    billRateType: f.rateType,
    payRate: fullTime ? String(salary ?? "") : f.payRate,
    payRateType: fullTime ? "Annual" : f.rateType,
    assignedMembers: [
      { role: "Recruiter", user: f.recruiter },
      { role: "Account Manager", user: f.accountExecutive },
    ],
    remarks: f.remarks,
    blockEmails: f.blockEmails,
  });

}

async function recordNhr(id: string, f: NhrForm, actor: Actor, fullTime: boolean, salary: number | null, feePct: number, exceptions: NhrException[]): Promise<void> {
  // Full-time: record the placement fee where the Add / Drop report reads it (FT GP = fee ÷ 960 h).
  if (fullTime && salary) {
    await db.assignment.updateMany({
      where: { candidateId: id },
      data: { billRate: null, remarks: [`Direct hire — ${feePct}% fee on $${Math.round(salary).toLocaleString("en-US")} salary`, f.remarks].filter(Boolean).join(" · ") },
    });
  }

  const day = (s: string) => (/^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T12:00:00`) : null);
  await db.newHireRequest.create({
    data: {
      candidateId: id,
      accountExecutive: f.accountExecutive || null,
      recruiter: f.recruiter || null,
      recruitingManager: f.recruitingManager || null,
      status: f.status,
      subStatus: f.subStatus || null,
      middleName: f.middleName || null,
      homePhone: f.homePhone || null,
      cellPhone: f.cellPhone || null,
      emergencyName: f.emergencyName || null,
      emergencyPhone: f.emergencyPhone || null,
      ssnLast4: f.ssnLast4 || null,
      dateOfBirth: day(f.dateOfBirth),
      geid: f.geid || null,
      referred: f.referred,
      referrerName: f.referred ? f.referrerName || null : null,
      referrerAmount: f.referred ? money(f.referrerAmount) : null,
      sourcedFrom: f.sourcedFrom || null,
      sourcedOther: f.sourcedFrom === "Other" ? f.sourcedOther : null,
      workAuthorization: f.workAuthorization || null,
      workAuthOther: f.workAuthorization === "Other" ? f.workAuthOther : null,
      liveInState: f.liveInState || null,
      clientName: f.client || null,
      jobTitle: f.jobTitle || null,
      jobId: f.jobId || null,
      workCity: f.workCity || null,
      workState: f.workState || null,
      directManager: f.directManager || null,
      invoicingContact: f.invoicingContact || null,
      timeTemplate: f.timeTemplate || null,
      startDate: day(f.startDate),
      termOfProject: f.termOfProject || null,
      vendorName: isC2C(f) ? f.vendorName : null,
      vendorContact: isC2C(f) ? f.vendorContact || null : null,
      vendorAddress: isC2C(f) ? f.vendorAddress || null : null,
      vendorPhone: isC2C(f) ? f.vendorPhone || null : null,
      vendorFederalId: isC2C(f) ? f.vendorFederalId || null : null,
      vendorEmail: isC2C(f) ? f.vendorEmail || null : null,
      billRate: fullTime ? null : money(f.billRate),
      payRate: fullTime ? null : money(f.payRate),
      rateType: fullTime ? null : f.rateType,
      taxTerms: fullTime ? "W-2" : f.taxTerms || null,
      paymentTerms: fullTime ? null : f.paymentTerms === "Other (specify)" ? f.paymentTermsOther : f.paymentTerms || null,
      salary: fullTime ? salary : null,
      feePct: fullTime ? feePct : null,
      otherCost: fullTime ? money(f.otherCost) : null,
      remarks: f.remarks || null,
      specialTerms: f.specialTerms || null,
      submittedBy: actor.name,
      formData: { ...f, exceptionReason: f.exceptionReason.trim() },
      exceptions: exceptions.map((x) => x.message),
      exceptionReason: exceptions.length ? f.exceptionReason.trim() : null,
      approvalStatus: exceptions.length ? "pending" : "not-required",
    },
  });
  await audit({ action: "CREATED", entityType: "NewHireRequest", entityId: id, entityLabel: `NHR — ${f.firstName} ${f.lastName}`, actor, newValue: `${f.status} · ${f.client} · start ${f.startDate}`, candidateId: id });
  if (exceptions.length) {
    await audit({ action: "ESCALATED", entityType: "NewHireRequest", entityId: id, entityLabel: `NHR exception — ${f.firstName} ${f.lastName}`, actor, newValue: "Awaiting Super Admin approval", reason: `${exceptions.map((x) => x.message).join("; ")}. Reason: ${f.exceptionReason.trim()}`, candidateId: id });
  }
}

// ─────────────────────────────────────────────────────────
// NHR exception approval (Super Admin, §25 emergency override)
// ─────────────────────────────────────────────────────────

export async function decideNhrException(candidateId: string, decision: "approve" | "reject", note: string, actor: Actor): Promise<{ items: number }> {
  const nhr = await db.newHireRequest.findUnique({ where: { candidateId } });
  if (!nhr || nhr.approvalStatus !== "pending") throw new OnboardingError("There's no pending approval for this new hire request.");
  if (decision === "reject" && !note.trim()) throw new OnboardingError("Add a note so the Recruiting Manager knows why it was rejected.");
  const c = await db.candidate.findUnique({ where: { id: candidateId } });
  if (!c) throw new OnboardingError("Candidate not found.");

  await db.newHireRequest.update({ where: { candidateId }, data: { approvalStatus: decision === "approve" ? "approved" : "rejected", approvalBy: actor.name, approvalAt: new Date(), approvalNote: note.trim() || null } });
  await audit({ action: decision === "approve" ? "OVERRIDDEN" : "REJECTED", entityType: "NewHireRequest", entityId: candidateId, entityLabel: `NHR exception — ${c.firstName} ${c.lastName}`, actor, previousValue: "pending", newValue: decision === "approve" ? "Exception approved — onboarding released" : "Exception rejected", reason: [nhr.exceptions.join("; "), note.trim()].filter(Boolean).join(" — "), candidateId });

  if (decision === "reject") {
    await db.candidate.update({ where: { id: candidateId }, data: { status: "ARCHIVED", stage: "NHR rejected", tags: c.tags.filter((t) => t !== "pending-approval").concat("nhr-rejected") } });
    return { items: 0 };
  }
  await db.candidate.update({ where: { id: candidateId }, data: { status: "OFFER_ACCEPTED", stage: "Document Submission", tags: c.tags.filter((t) => t !== "pending-approval") } });
  const form = nhr.formData as unknown as NhrForm | null;
  if (!form) throw new OnboardingError("The original NHR details are missing — resubmit the request.");
  const items = await assemblePackage(candidateId, nhrToFormData(form), actor);
  await recompute(candidateId);
  return { items };
}

// ─────────────────────────────────────────────────────────
// Edit an NHR after submission (Recruiting Manager / Super Admin)
// ─────────────────────────────────────────────────────────

export const NHR_EDITABLE = ["accountExecutive", "recruiter", "recruitingManager", "onboarder", "jobTitle", "jobId", "directManager", "invoicingContact", "timeTemplate", "endDate", "remarks", "specialTerms"] as const;
export type NhrEdit = Partial<Record<(typeof NHR_EDITABLE)[number], string>>;

const EDIT_LABEL: Record<(typeof NHR_EDITABLE)[number], string> = {
  accountExecutive: "Account Executive", recruiter: "Recruiter", recruitingManager: "Recruiting Manager", onboarder: "Onboarder",
  jobTitle: "Job name", jobId: "Job Id", directManager: "Direct Manager / HR Contact", invoicingContact: "Invoicing Contact",
  timeTemplate: "Time Template", endDate: "Est. end date", remarks: "Remarks", specialTerms: "Special Terms / Exceptions",
};

export async function updateNhr(candidateId: string, patch: NhrEdit, actor: Actor): Promise<{ changed: number }> {
  const [nhr, c, a] = await Promise.all([
    db.newHireRequest.findUnique({ where: { candidateId } }),
    db.candidate.findUnique({ where: { id: candidateId } }),
    db.assignment.findFirst({ where: { candidateId }, orderBy: { createdAt: "desc" } }),
  ]);
  if (!nhr || !c) throw new OnboardingError("This candidate has no New Hire Request to edit.");
  const form = { ...((nhr.formData as unknown as Partial<NhrForm>) ?? {}) };
  const current: Record<string, string> = {
    accountExecutive: nhr.accountExecutive ?? "", recruiter: nhr.recruiter ?? c.recruiter ?? "", recruitingManager: nhr.recruitingManager ?? "",
    onboarder: c.onboarder ?? "", jobTitle: nhr.jobTitle ?? "", jobId: nhr.jobId ?? "", directManager: nhr.directManager ?? "",
    invoicingContact: nhr.invoicingContact ?? "", timeTemplate: nhr.timeTemplate ?? "", endDate: form.endDate ?? "", remarks: nhr.remarks ?? "", specialTerms: nhr.specialTerms ?? "",
  };
  const changes = NHR_EDITABLE.filter((k) => patch[k] !== undefined && (patch[k] ?? "").trim() !== current[k]);
  if (!changes.length) return { changed: 0 };
  if (changes.includes("endDate") && patch.endDate && c.startDate && new Date(`${patch.endDate}T12:00:00`) < c.startDate) throw new OnboardingError("End date can't be before the start date.");
  for (const k of ["accountExecutive", "recruiter", "recruitingManager", "onboarder"] as const) {
    if (changes.includes(k) && !(patch[k] ?? "").trim()) throw new OnboardingError(`${EDIT_LABEL[k]} can't be empty.`);
  }

  const v = (k: (typeof NHR_EDITABLE)[number]) => ((patch[k] ?? "").trim() || null);
  const nhrData: Record<string, unknown> = {};
  for (const k of changes) {
    if (k === "onboarder" || k === "endDate") continue;
    nhrData[k] = v(k);
    (form as Record<string, unknown>)[k] = patch[k];
  }
  if (changes.includes("endDate")) form.endDate = patch.endDate ?? "";
  await db.newHireRequest.update({ where: { candidateId }, data: { ...nhrData, formData: form } });
  if (changes.includes("recruiter") || changes.includes("onboarder")) {
    await db.candidate.update({ where: { id: candidateId }, data: { ...(changes.includes("recruiter") ? { recruiter: v("recruiter") } : {}), ...(changes.includes("onboarder") ? { onboarder: v("onboarder") } : {}) } });
  }
  if (a && (changes.includes("jobTitle") || changes.includes("jobId") || changes.includes("endDate"))) {
    await db.assignment.update({ where: { id: a.id }, data: { ...(changes.includes("jobTitle") ? { jobTitle: v("jobTitle") } : {}), ...(changes.includes("jobId") ? { jobId: v("jobId") } : {}), ...(changes.includes("endDate") ? { endDate: v("endDate") ? new Date(`${patch.endDate}T12:00:00`) : null } : {}) } });
  }
  for (const k of changes) {
    await audit({ action: "UPDATED", entityType: "NewHireRequest", entityId: candidateId, entityLabel: `${EDIT_LABEL[k]} — ${c.firstName} ${c.lastName}`, actor, previousValue: current[k] || "—", newValue: (patch[k] ?? "").trim() || "—", candidateId });
  }
  return { changed: changes.length };
}

/** NHR values the candidate's forms are pre-filled from (they confirm before signing). */
export function portalPrefill(docName: string, nhr: Partial<NhrForm> | null, fullName: string): Record<string, string> {
  if (!nhr) return {};
  const citizenship: Record<string, string> = { Citizen: "U.S. citizen", "Green Card": "Lawful permanent resident" };
  switch (docName) {
    case "I-9 Section 1":
      return { citizenship: nhr.workAuthorization ? citizenship[nhr.workAuthorization] ?? "Noncitizen authorized to work" : "", dob: nhr.dateOfBirth ?? "" };
    case "W-9 (Taxpayer ID)":
      return { legalName: [nhr.firstName, nhr.middleName, nhr.lastName].filter(Boolean).join(" ") || fullName, classification: "Individual / sole proprietor" };
    case "Vendor Master Services Agreement":
      return { vendorSignatory: nhr.vendorContact ?? "" };
    default:
      return {};
  }
}

/** Remove a candidate and every row that references it (several relations are SetNull, not cascade). */
export async function deleteCandidateCascade(id: string): Promise<void> {
  const where = { candidateId: id };
  await db.auditEvent.deleteMany({ where });
  await db.document.deleteMany({ where });
  await db.screening.deleteMany({ where });
  await db.training.deleteMany({ where });
  await db.equipment.deleteMany({ where });
  await db.communication.deleteMany({ where });
  await db.exception.deleteMany({ where });
  await db.assignment.deleteMany({ where });
  await db.package.deleteMany({ where: { id: `pkg-${id}` } });
  await db.candidate.deleteMany({ where: { id } }); // readiness + NHR cascade
  await fs.rm(path.join(STORAGE_ROOT, id), { recursive: true, force: true });
}

/** Dropdown data for the NHR form: staff, clients with contacts and rules, vendors. */
export async function nhrOptions() {
  const [clients, cands, consultants] = await Promise.all([
    db.client.findMany({ include: { contacts: true, rules: true }, orderBy: { name: "asc" } }),
    db.candidate.findMany({ select: { recruiter: true, vendor: true } }),
    db.consultant.findMany({ select: { vendor: true, accountManager: true } }),
  ]);
  const uniq = (xs: (string | null | undefined)[]) => [...new Set(xs.filter((x): x is string => !!x))].sort();
  return {
    accountExecutives: uniq([...clients.map((c) => c.accountManager), ...consultants.map((c) => c.accountManager)]),
    recruiters: uniq(cands.map((c) => c.recruiter)),
    recruitingManagers: ["Robert Alvarez", "Victoria Chen"],
    onboarders: uniq((await db.candidate.findMany({ select: { onboarder: true }, distinct: ["onboarder"] })).map((c) => c.onboarder)),
    vendors: uniq([...cands.map((c) => c.vendor), ...consultants.map((c) => c.vendor)]),
    clients: clients.map((c) => ({
      name: c.name,
      accountManager: c.accountManager,
      hq: c.hq,
      contacts: c.contacts.map((k) => ({ name: k.name, title: k.title, type: k.type })),
      rules: c.rules.map((r) => ({ label: r.label, category: r.category })),
    })),
  };
}

export type NhrOptions = Awaited<ReturnType<typeof nhrOptions>>;

/** NHR as shown on the Candidate 360: details, approval state, and editable values. */
export async function getNhrView(candidateId: string) {
  const nhr = await db.newHireRequest.findUnique({ where: { candidateId }, include: { candidate: { select: { onboarder: true, recruiter: true } } } });
  if (!nhr) return null;
  const form = (nhr.formData as unknown as Partial<NhrForm> | null) ?? {};
  const client = nhr.clientName ? await db.client.findUnique({ where: { name: nhr.clientName }, include: { contacts: true } }) : null;
  const fmt = (d: Date | null) => (d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—");
  const usd = (n: number | null) => (n === null ? "—" : `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`);
  return {
    approval: {
      status: nhr.approvalStatus as "pending" | "approved" | "rejected" | "not-required",
      exceptions: nhr.exceptions,
      reason: nhr.exceptionReason,
      submittedBy: nhr.submittedBy,
      decidedBy: nhr.approvalBy,
      decidedAt: nhr.approvalAt ? nhr.approvalAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : null,
      note: nhr.approvalNote,
    },
    contacts: (client?.contacts ?? []).map((c) => ({ name: c.name, title: c.title })),
    values: {
      accountExecutive: nhr.accountExecutive ?? "",
      recruiter: nhr.recruiter ?? nhr.candidate.recruiter ?? "",
      recruitingManager: nhr.recruitingManager ?? "",
      onboarder: nhr.candidate.onboarder ?? "",
      jobTitle: nhr.jobTitle ?? "",
      jobId: nhr.jobId ?? "",
      directManager: nhr.directManager ?? "",
      invoicingContact: nhr.invoicingContact ?? "",
      timeTemplate: nhr.timeTemplate ?? "",
      endDate: form.endDate ?? "",
      remarks: nhr.remarks ?? "",
      specialTerms: nhr.specialTerms ?? "",
    },
    sections: [
      { title: "General Details", rows: [["Account Executive", nhr.accountExecutive], ["Recruiter", nhr.recruiter], ["Recruiting Manager", nhr.recruitingManager], ["Submitted by", `${nhr.submittedBy} · ${fmt(nhr.submittedAt)}`]] },
      { title: "Consultant Details", rows: [["Status", [nhr.status, nhr.subStatus].filter(Boolean).join(" · ")], ["Middle name", nhr.middleName], ["Cell #", nhr.cellPhone], ["Home #", nhr.homePhone], ["Emergency", [nhr.emergencyName, nhr.emergencyPhone].filter(Boolean).join(" · ")], ["SSN", nhr.ssnLast4 ? `•••-••-${nhr.ssnLast4}` : null], ["DOB", fmt(nhr.dateOfBirth)], ["GEID", nhr.geid], ["Referred", nhr.referred ? `${nhr.referrerName ?? ""}${nhr.referrerAmount ? ` · ${usd(nhr.referrerAmount)}` : ""}` : "No"], ["Sourced from", nhr.sourcedOther ?? nhr.sourcedFrom], ["Work authorization", nhr.workAuthOther ?? nhr.workAuthorization], ["Live in state", nhr.liveInState]] },
      { title: "Project Details", rows: [["Client", nhr.clientName], ["Job", [nhr.jobTitle, nhr.jobId].filter(Boolean).join(" / ")], ["Work location", [nhr.workCity, nhr.workState].filter(Boolean).join(", ")], ["Direct manager / HR", nhr.directManager], ["Invoicing contact", nhr.invoicingContact], ["Time template", nhr.timeTemplate], ["Start date", fmt(nhr.startDate)], ["Term of project", nhr.termOfProject]] },
      { title: "Vendor Details", rows: nhr.vendorName ? [["Vendor", nhr.vendorName], ["Contact", nhr.vendorContact], ["Federal ID", nhr.vendorFederalId], ["Phone", nhr.vendorPhone], ["Email", nhr.vendorEmail], ["Address", nhr.vendorAddress]] : [["Vendor", "NA"]] },
      { title: nhr.salary !== null ? "Pay Details — Full Time" : "Pay Details — Contract", rows: nhr.salary !== null ? [["Salary", usd(nhr.salary)], ["Fee %", nhr.feePct !== null ? `${nhr.feePct}%` : null], ["Other cost", usd(nhr.otherCost)]] : [["Bill rate", `${usd(nhr.billRate)} ${nhr.rateType ?? ""}`], ["Pay rate", `${usd(nhr.payRate)} ${nhr.rateType ?? ""}`], ["Payment terms", [nhr.taxTerms, nhr.paymentTerms].filter(Boolean).join(" · ")]] },
      { title: "Remarks & Special Terms", rows: [["Remarks", nhr.remarks], ["Special terms / exceptions", nhr.specialTerms]] },
    ].map((s) => ({ title: s.title, rows: s.rows.map(([k, v]) => ({ label: k as string, value: (v as string | null) || "—" })) })),
  };
}
