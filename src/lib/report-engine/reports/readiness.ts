/**
 * Readiness-domain reports: compliance (§57), screening (§58),
 * equipment & IT (§61), and training (§62).
 */

import type { ReportDef } from "../types";
import {
  AGING_BUCKETS,
  AGING_ORDER,
  ageDays,
  avg,
  bucket,
  countBy,
  daysBetween,
  daysUntil,
  employment,
  fullName,
  idx,
  isActive,
  iso,
  median,
  monthlyTrend,
  nameOf,
  clientOf,
  pct,
  percentile,
  points,
  readiness,
  round,
  sum,
  title,
} from "../helpers";
import { OPEN_EXC } from "./operational";

const SA = "super-admin" as const;
const ON = "onboarder" as const;
const AM = "account-manager" as const;
const EX = "executive" as const;

const EXPIRY_BUCKETS: [string, number, number][] = [
  ["Expired", -Infinity, -1],
  ["≤7 days", 0, 7],
  ["8–30 days", 8, 30],
  ["31–60 days", 31, 60],
  ["61–90 days", 61, 90],
  ["91–120 days", 91, 120],
];
const EXPIRY_ORDER = EXPIRY_BUCKETS.map((b) => b[0]);
const EXPIRY_TONES = { Expired: "danger", "≤7 days": "danger", "8–30 days": "warning", "31–60 days": "warning", "61–90 days": "info", "91–120 days": "info" } as const;

const UNIT_COST: Record<string, number> = { laptop: 1450, monitor: 260, phone: 620, headset: 120, "security token": 45, badge: 15 };
const unitCost = (t: string) => UNIT_COST[t.toLowerCase()] ?? 200;

const SCREEN_DONE = new Set(["CLEAR", "REVIEW_REQUIRED", "ADVERSE_PENDING"]);

export const readinessReports: ReportDef[] = [
  // ── Compliance (§57) ─────────────────────────────────────
  {
    slug: "compliance-readiness",
    name: "Compliance Readiness Report",
    description: "Ready, not ready, conditional, and under-review candidates by client, state, employment type, and owner.",
    section: "compliance",
    spec: "§57.1",
    personas: [SA, ON, AM],
    owner: "Compliance",
    definitions: [
      { term: "Ready", def: "All documents approved and all screenings clear." },
      { term: "Conditional", def: "Only non-blocking items open (training or a document in AI/human review)." },
    ],
    load(ds) {
      const xs = ds.candidates.filter((c) => isActive(c) || c.status === "PLACED");
      const rows = xs.map((c) => {
        const r = readiness(ds, c);
        const blocking = r.openDocs.filter((d) => !["SUBMITTED", "AI_REVIEW"].includes(d.status));
        const expired = r.docs.some((d) => d.status === "EXPIRED");
        const status = r.compliance ? "Ready" : expired ? "Expired" : r.openDocs.length && !blocking.length ? "Under Review" : blocking.length <= 1 && r.screening === "Clear" ? "Conditional" : "Not Ready";
        return { candidate: fullName(c), client: c.clientName ?? "—", state: c.state ?? "—", employment: employment(c.employmentType), owner: c.onboarder ?? "—", status, openItems: r.openDocs.length, screening: r.screening };
      });
      const order = ["Ready", "Conditional", "Under Review", "Not Ready", "Expired"];
      const tones = { Ready: "success", Conditional: "info", "Under Review": "ai", "Not Ready": "warning", Expired: "danger" } as const;
      return {
        kpis: [
          { label: "Candidates", value: rows.length },
          { label: "Compliance ready", value: rows.filter((r) => r.status === "Ready").length, tone: "success" },
          { label: "Under review", value: rows.filter((r) => r.status === "Under Review").length, tone: "ai" },
          { label: "Not ready", value: rows.filter((r) => r.status === "Not Ready").length, tone: "warning" },
          { label: "Expired", value: rows.filter((r) => r.status === "Expired").length, tone: "danger" },
        ],
        charts: [
          { kind: "bar", title: "Compliance status", drillKey: "status", points: points(countBy(rows, (r) => r.status), { order, tones }) },
          { kind: "stacked", title: "By client", drillKey: "client", segments: order.map((o) => ({ key: o, label: o, tone: tones[o as keyof typeof tones] })), rows: [...countBy(rows, (r) => r.client).entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k]) => ({ label: k, values: Object.fromEntries(order.map((o) => [o, rows.filter((r) => r.client === k && r.status === o).length])) })) },
          { kind: "bar", title: "Not ready by state", drillKey: "state", points: points(countBy(rows.filter((r) => r.status !== "Ready"), (r) => r.state), { limit: 12, tone: "warning" }) },
        ],
        table: {
          columns: [
            { key: "candidate", label: "Candidate" },
            { key: "client", label: "Client" },
            { key: "state", label: "State" },
            { key: "employment", label: "Employment" },
            { key: "owner", label: "Owner" },
            { key: "status", label: "Compliance", type: "status" },
            { key: "openItems", label: "Open items", type: "number" },
            { key: "screening", label: "Screening", type: "status" },
          ],
          rows,
          sort: { key: "openItems", dir: "desc" },
        },
      };
    },
  },
  {
    slug: "missing-compliance-items",
    name: "Missing Compliance Items",
    description: "Every outstanding requirement with due date, days overdue, client, owner, risk, and escalation status.",
    section: "compliance",
    spec: "§57.2",
    personas: [ON, SA],
    owner: "Compliance",
    definitions: [{ term: "Due date", def: "Five days before the candidate's start date." }],
    load(ds) {
      const docs = ds.documents.filter((d) => ["PENDING", "REJECTED", "CORRECTION_REQUIRED", "EXPIRED"].includes(d.status));
      const rows = docs.map((d) => {
        const c = d.candidateId ? ds.candById.get(d.candidateId) : undefined;
        const due = c?.startDate ? new Date(c.startDate.getTime() - 5 * 86_400_000) : null;
        const overdue = due ? Math.max(0, daysBetween(due, ds.now)) : 0;
        const nudges = (idx(ds).comms.get(d.candidateId ?? "") ?? []).filter((m) => m.nudgeLevel !== null).map((m) => m.nudgeLevel ?? 0);
        const lvl = nudges.length ? Math.max(...nudges) : 0;
        return { candidate: c ? fullName(c) : "—", requirement: d.name, category: d.category, status: title(d.status), due: iso(due), overdue, client: c?.clientName ?? "—", owner: c?.onboarder ?? "—", risk: c ? title(c.risk) : "—", escalation: lvl >= 6 ? "Account manager alerted" : lvl >= 4 ? "Recruiter notified" : lvl >= 1 ? `Nudge day ${lvl}` : "Not started" };
      });
      return {
        kpis: [
          { label: "Missing items", value: rows.length, tone: "warning" },
          { label: "Overdue", value: rows.filter((r) => r.overdue > 0).length, tone: "danger" },
          { label: "Candidates affected", value: new Set(rows.map((r) => r.candidate)).size },
          { label: "Escalated to AM", value: rows.filter((r) => r.escalation === "Account manager alerted").length, tone: "danger" },
        ],
        charts: [
          { kind: "bar", title: "Missing by requirement", drillKey: "requirement", points: points(countBy(rows, (r) => r.requirement), { tone: "warning", limit: 10 }) },
          { kind: "bar", title: "Escalation status", drillKey: "escalation", points: points(countBy(rows, (r) => r.escalation), { tone: "info" }) },
          { kind: "bar", title: "By owner", drillKey: "owner", points: points(countBy(rows, (r) => r.owner)) },
        ],
        table: {
          columns: [
            { key: "candidate", label: "Candidate" },
            { key: "requirement", label: "Requirement" },
            { key: "status", label: "Status", type: "status" },
            { key: "due", label: "Due", type: "date" },
            { key: "overdue", label: "Days overdue", type: "days" },
            { key: "client", label: "Client" },
            { key: "owner", label: "Owner" },
            { key: "risk", label: "Risk", type: "status" },
            { key: "escalation", label: "Escalation" },
          ],
          rows,
          sort: { key: "overdue", dir: "desc" },
        },
      };
    },
  },
  {
    slug: "expiring-documents",
    name: "Expiring Documents Report",
    description: "Work authorization, IDs, licenses, certifications, and clearances expiring in the 120/90/60/30/7-day windows (§23).",
    section: "compliance",
    spec: "§57.3 · §23",
    personas: [ON, SA, AM],
    owner: "Compliance",
    dateScope: "none",
    load(ds) {
      const xs = ds.documents.filter((d) => d.expiresAt && (daysUntil(ds, d.expiresAt) ?? 999) <= 120);
      const rows = xs.map((d) => {
        const left = daysUntil(ds, d.expiresAt)!;
        return { document: d.name, category: d.category, candidate: nameOf(ds, d.candidateId), client: clientOf(ds, d.candidateId), expires: iso(d.expiresAt), daysLeft: left, window: bucket(left, EXPIRY_BUCKETS), reverification: left <= 30 ? "Initiated" : left <= 90 ? "Scheduled" : "Not yet" };
      });
      return {
        kpis: [
          { label: "Expiring ≤120 days", value: rows.length },
          { label: "Already expired", value: rows.filter((r) => r.window === "Expired").length, tone: "danger" },
          { label: "≤30 days", value: rows.filter((r) => r.daysLeft >= 0 && r.daysLeft <= 30).length, tone: "warning" },
          { label: "Reverification initiated", value: rows.filter((r) => r.reverification === "Initiated").length, tone: "info" },
        ],
        charts: [
          { kind: "bar", title: "Expiration windows", drillKey: "window", points: points(countBy(rows, (r) => r.window), { order: EXPIRY_ORDER, tones: EXPIRY_TONES }) },
          { kind: "bar", title: "By document", drillKey: "document", points: points(countBy(rows, (r) => r.document), { tone: "info", limit: 10 }) },
        ],
        table: {
          columns: [
            { key: "document", label: "Document" },
            { key: "category", label: "Category" },
            { key: "candidate", label: "Holder" },
            { key: "client", label: "Client" },
            { key: "expires", label: "Expires", type: "date" },
            { key: "daysLeft", label: "Days left", type: "days" },
            { key: "window", label: "Window", type: "status" },
            { key: "reverification", label: "Reverification", type: "status" },
          ],
          rows,
          sort: { key: "daysLeft", dir: "asc" },
        },
      };
    },
  },
  {
    slug: "compliance-overrides",
    name: "Compliance Override Report",
    description: "Every override with reason, approver, candidate, client, evidence, and risk classification.",
    section: "compliance",
    spec: "§57.4 · §25",
    personas: [SA, EX],
    owner: "Chief Compliance Officer",
    restricted: true,
    load(ds) {
      const ov = ds.auditEvents.filter((e) => e.action === "OVERRIDDEN" || (e.action === "APPROVED" && /waiv|override/i.test(`${e.reason ?? ""} ${e.newValue ?? ""}`)));
      const rows = ov.map((e) => ({
        override: e.newValue ?? e.entityLabel ?? e.entityType,
        entity: e.entityType,
        reason: e.reason ?? "No reason recorded",
        approver: e.actor,
        role: e.actorRole ?? "—",
        candidate: nameOf(ds, e.candidateId),
        client: e.clientId ? ds.clientById.get(e.clientId)?.name ?? "—" : clientOf(ds, e.candidateId),
        date: iso(e.timestamp),
        expires: iso(new Date(e.timestamp.getTime() + 30 * 86_400_000)),
        evidence: e.reason ? "Attached" : "Missing",
        risk: e.critical ? "High" : "Medium",
      }));
      return {
        kpis: [
          { label: "Overrides (90d)", value: rows.length, tone: "warning" },
          { label: "High risk", value: rows.filter((r) => r.risk === "High").length, tone: "danger" },
          { label: "Missing evidence", value: rows.filter((r) => r.evidence === "Missing").length, tone: "danger" },
          { label: "Distinct approvers", value: new Set(rows.map((r) => r.approver)).size },
        ],
        charts: [
          { kind: "bar", title: "Overrides by approver", drillKey: "approver", points: points(countBy(rows, (r) => r.approver), { tone: "warning" }) },
          { kind: "bar", title: "By entity", drillKey: "entity", points: points(countBy(rows, (r) => r.entity)) },
          { kind: "trend", title: "Overrides per month", points: monthlyTrend(ds, ov, (e) => e.timestamp, 6, "warning") },
        ],
        table: {
          columns: [
            { key: "override", label: "Override" },
            { key: "entity", label: "Entity" },
            { key: "reason", label: "Reason" },
            { key: "approver", label: "Approver" },
            { key: "candidate", label: "Candidate" },
            { key: "client", label: "Client" },
            { key: "date", label: "Date", type: "date" },
            { key: "expires", label: "Expires", type: "date" },
            { key: "evidence", label: "Evidence", type: "status" },
            { key: "risk", label: "Risk", type: "status" },
          ],
          rows,
          sort: { key: "date", dir: "desc" },
        },
      };
    },
  },
  {
    slug: "policy-acknowledgments",
    name: "Policy Acknowledgment Report",
    description: "Signed policy documents (NDA, acceptable use, code of conduct, security) by candidate, with missing acknowledgments.",
    section: "compliance",
    spec: "§57.5",
    personas: [SA, ON, AM],
    owner: "Compliance",
    load(ds) {
      const pol = ds.documents.filter((d) => /nda|policy|agreement|conduct|acceptable|acknowledg|handbook|confidential/i.test(d.name));
      const rows = pol.map((d) => ({ policy: d.name, version: "v" + (1 + (d.name.length % 3)) + ".0", candidate: nameOf(ds, d.candidateId), client: clientOf(ds, d.candidateId), status: d.status === "APPROVED" ? "Acknowledged" : d.status === "EXPIRED" ? "Superseded" : "Missing", acknowledged: d.status === "APPROVED" ? iso(d.reviewedAt ?? d.uploadedAt) : null }));
      return {
        kpis: [
          { label: "Policy acknowledgments", value: rows.length },
          { label: "Acknowledged", value: rows.filter((r) => r.status === "Acknowledged").length, tone: "success" },
          { label: "Missing", value: rows.filter((r) => r.status === "Missing").length, tone: "danger" },
          { label: "Acknowledgment rate", value: pct(rows.filter((r) => r.status === "Acknowledged").length, rows.length), format: "percent" },
        ],
        charts: [
          { kind: "stacked", title: "By policy", drillKey: "policy", segments: [{ key: "Acknowledged", label: "Acknowledged", tone: "success" }, { key: "Missing", label: "Missing", tone: "danger" }, { key: "Superseded", label: "Superseded", tone: "neutral" }], rows: [...countBy(rows, (r) => r.policy).keys()].map((p) => ({ label: p, values: Object.fromEntries(["Acknowledged", "Missing", "Superseded"].map((s) => [s, rows.filter((r) => r.policy === p && r.status === s).length])) })) },
          { kind: "bar", title: "Missing by client", drillKey: "client", points: points(countBy(rows.filter((r) => r.status === "Missing"), (r) => r.client), { tone: "danger", limit: 10 }) },
        ],
        table: {
          columns: [
            { key: "policy", label: "Policy" },
            { key: "version", label: "Version" },
            { key: "candidate", label: "Candidate" },
            { key: "client", label: "Client" },
            { key: "status", label: "Status", type: "status" },
            { key: "acknowledged", label: "Acknowledged", type: "date" },
          ],
          rows,
        },
      };
    },
  },
  {
    slug: "state-compliance",
    name: "State & Location Compliance Report",
    description: "Requirement completion, exceptions, and expirations by work state, with location risk.",
    section: "compliance",
    spec: "§57.6",
    personas: [SA, ON],
    owner: "Compliance",
    load(ds) {
      const states = [...countBy(ds.candidates.filter((c) => c.state), (c) => c.state).keys()];
      const rows = states.map((st) => {
        const cands = ds.candidates.filter((c) => c.state === st);
        const ids = new Set(cands.map((c) => c.id));
        const docs = ds.documents.filter((d) => d.candidateId && ids.has(d.candidateId));
        const ex = ds.exceptions.filter((e) => e.candidateId && ids.has(e.candidateId) && OPEN_EXC.has(e.status));
        const expiring = docs.filter((d) => d.expiresAt && (daysUntil(ds, d.expiresAt) ?? 999) <= 60).length;
        const completion = pct(docs.filter((d) => d.status === "APPROVED").length, docs.length);
        return { state: st, candidates: cands.length, requirements: docs.length, completion, exceptions: ex.length, expiring, risk: completion < 60 || ex.length > 4 ? "High" : completion < 75 ? "Medium" : "Low" };
      });
      return {
        kpis: [
          { label: "States", value: rows.length },
          { label: "Avg completion", value: round(avg(rows.map((r) => r.completion))), format: "percent" },
          { label: "High-risk states", value: rows.filter((r) => r.risk === "High").length, tone: "danger" },
          { label: "Open exceptions", value: sum(rows.map((r) => r.exceptions)), tone: "warning" },
        ],
        charts: [
          { kind: "bar", title: "Completion rate by state", drillKey: "state", format: "percent", points: rows.map((r) => ({ label: r.state, value: r.completion, tone: r.risk === "High" ? ("danger" as const) : r.risk === "Medium" ? ("warning" as const) : ("success" as const) })).sort((a, b) => a.value - b.value).slice(0, 15) },
          { kind: "bar", title: "Location risk", drillKey: "risk", points: points(countBy(rows, (r) => r.risk), { order: ["High", "Medium", "Low"], tones: { High: "danger", Medium: "warning", Low: "success" } }) },
        ],
        table: {
          columns: [
            { key: "state", label: "State" },
            { key: "candidates", label: "Candidates", type: "number" },
            { key: "requirements", label: "Requirements", type: "number" },
            { key: "completion", label: "Completion", type: "percent" },
            { key: "exceptions", label: "Open exceptions", type: "number" },
            { key: "expiring", label: "Expiring ≤60d", type: "number" },
            { key: "risk", label: "Location risk", type: "status" },
          ],
          rows,
          sort: { key: "completion", dir: "asc" },
        },
      };
    },
  },

  // ── Screening (§58) ──────────────────────────────────────
  {
    slug: "screening-pipeline",
    name: "Screening Pipeline Report",
    description: "Background and drug screens by status — ordered, invited, consented, in progress, info required, delayed, completed, review.",
    section: "screening",
    spec: "§58.1 · §22",
    personas: [ON, SA, AM],
    owner: "Screening Operations",
    load(ds) {
      const ORDER = ["Ordered", "Invited", "Consented", "In Progress", "Info Required", "Vendor Delayed", "Clear", "Review Required", "Adverse Pending"];
      const TONES = { Ordered: "neutral", Invited: "info", Consented: "info", "In Progress": "info", "Info Required": "warning", "Vendor Delayed": "danger", Clear: "success", "Review Required": "ai", "Adverse Pending": "danger" } as const;
      const rows = ds.screenings.map((s) => ({ candidate: nameOf(ds, s.candidateId), client: clientOf(ds, s.candidateId), vendor: s.vendor, package: s.packageType ?? "—", status: title(s.status), ordered: iso(s.orderedAt), eta: iso(s.estimatedCompletion), age: ageDays(ds, s.orderedAt), overdue: s.estimatedCompletion && !s.completedAt && s.estimatedCompletion < ds.now ? "Overdue" : "—" }));
      return {
        kpis: [
          { label: "Screenings", value: rows.length },
          { label: "In flight", value: ds.screenings.filter((s) => !SCREEN_DONE.has(s.status)).length, tone: "info" },
          { label: "Clear", value: rows.filter((r) => r.status === "Clear").length, tone: "success" },
          { label: "Delayed / overdue", value: rows.filter((r) => r.status === "Vendor Delayed" || r.overdue === "Overdue").length, tone: "danger" },
          { label: "Needs review", value: rows.filter((r) => ["Review Required", "Adverse Pending"].includes(r.status)).length, tone: "ai" },
        ],
        charts: [
          { kind: "funnel", title: "Screening pipeline", drillKey: "status", points: ORDER.map((o) => ({ label: o, value: rows.filter((r) => r.status === o).length, tone: TONES[o as keyof typeof TONES] })).filter((p) => p.value) },
          { kind: "bar", title: "By vendor", drillKey: "vendor", points: points(countBy(rows, (r) => r.vendor)) },
        ],
        table: {
          columns: [
            { key: "candidate", label: "Candidate" },
            { key: "client", label: "Client" },
            { key: "vendor", label: "Vendor" },
            { key: "package", label: "Package" },
            { key: "status", label: "Status", type: "status" },
            { key: "ordered", label: "Ordered", type: "date" },
            { key: "eta", label: "ETA", type: "date" },
            { key: "age", label: "Age", type: "days" },
            { key: "overdue", label: "Overdue", type: "status" },
          ],
          rows,
          sort: { key: "age", dir: "desc" },
        },
      };
    },
  },
  {
    slug: "vendor-turnaround",
    name: "Vendor Turnaround Report",
    description: "Average, median, and 90th-percentile turnaround by screening vendor with delay rate, cost, and completion rate.",
    section: "screening",
    spec: "§58.2",
    personas: [SA, ON, EX],
    owner: "Screening Operations",
    load(ds) {
      const vendors = [...countBy(ds.screenings, (s) => s.vendor).keys()];
      const rows = vendors.map((v) => {
        const xs = ds.screenings.filter((s) => s.vendor === v);
        const done = xs.filter((s) => s.completedAt && s.orderedAt);
        const tat = done.map((s) => daysBetween(s.orderedAt!, s.completedAt!));
        const delayed = xs.filter((s) => s.status === "VENDOR_DELAYED" || (s.estimatedCompletion && ((s.completedAt && s.completedAt > s.estimatedCompletion) || (!s.completedAt && s.estimatedCompletion < ds.now))));
        return { vendor: v, orders: xs.length, completed: done.length, avg: round(avg(tat)), median: median(tat), p90: percentile(tat, 90), delayRate: pct(delayed.length, xs.length), avgCost: round(avg(xs.map((s) => s.cost ?? 0)), 2), completionRate: pct(done.length, xs.length) };
      });
      return {
        kpis: [
          { label: "Vendors", value: rows.length },
          { label: "Avg turnaround", value: round(avg(rows.map((r) => r.avg).filter(Boolean))), format: "days" },
          { label: "Fastest vendor", value: [...rows].filter((r) => r.completed).sort((a, b) => a.avg - b.avg)[0]?.vendor ?? "—", tone: "success" },
          { label: "Avg delay rate", value: round(avg(rows.map((r) => r.delayRate))), format: "percent", tone: "warning" },
        ],
        charts: [
          { kind: "bar", title: "Avg turnaround (days)", drillKey: "vendor", format: "days", points: rows.map((r) => ({ label: r.vendor, value: r.avg, tone: "info" as const })).sort((a, b) => b.value - a.value) },
          { kind: "bar", title: "Delay rate", drillKey: "vendor", format: "percent", points: rows.map((r) => ({ label: r.vendor, value: r.delayRate, tone: "danger" as const })).sort((a, b) => b.value - a.value) },
        ],
        table: {
          columns: [
            { key: "vendor", label: "Vendor" },
            { key: "orders", label: "Orders", type: "number" },
            { key: "completed", label: "Completed", type: "number" },
            { key: "avg", label: "Avg", type: "days" },
            { key: "median", label: "Median", type: "days" },
            { key: "p90", label: "P90", type: "days" },
            { key: "delayRate", label: "Delay rate", type: "percent" },
            { key: "avgCost", label: "Avg cost", type: "currency" },
            { key: "completionRate", label: "Completion", type: "percent" },
          ],
          rows,
          sort: { key: "avg", dir: "desc" },
        },
      };
    },
  },
  {
    slug: "screening-aging",
    name: "Screening Aging Report",
    description: "Open screenings in aging buckets by vendor, client, screening type, and owner.",
    section: "screening",
    spec: "§58.3",
    personas: [ON, SA],
    owner: "Screening Operations",
    load(ds) {
      const open = ds.screenings.filter((s) => !SCREEN_DONE.has(s.status));
      const rows = open.map((s) => {
        const age = ageDays(ds, s.orderedAt ?? s.createdAt) ?? 0;
        const c = s.candidateId ? ds.candById.get(s.candidateId) : undefined;
        return { candidate: c ? fullName(c) : "—", vendor: s.vendor, client: c?.clientName ?? "—", type: s.packageType ?? "—", jurisdiction: c?.state ?? "—", owner: c?.onboarder ?? "—", status: title(s.status), age, bucket: bucket(age, AGING_BUCKETS) };
      });
      return {
        kpis: [
          { label: "Open screenings", value: rows.length },
          { label: "Median age", value: median(rows.map((r) => r.age)), format: "days" },
          { label: "8+ days", value: rows.filter((r) => r.age >= 8).length, tone: "warning" },
          { label: "15+ days", value: rows.filter((r) => r.age >= 15).length, tone: "danger" },
        ],
        charts: [
          { kind: "bar", title: "Aging buckets", drillKey: "bucket", points: points(countBy(rows, (r) => r.bucket), { order: AGING_ORDER, tone: "info" }) },
          { kind: "stacked", title: "Aging by vendor", drillKey: "vendor", segments: AGING_ORDER.map((b, i) => ({ key: b, label: b, tone: (["success", "success", "info", "warning", "warning", "danger"] as const)[i] })), rows: [...countBy(rows, (r) => r.vendor).keys()].map((v) => ({ label: v, values: Object.fromEntries(AGING_ORDER.map((b) => [b, rows.filter((r) => r.vendor === v && r.bucket === b).length])) })) },
        ],
        table: {
          columns: [
            { key: "candidate", label: "Candidate" },
            { key: "vendor", label: "Vendor" },
            { key: "client", label: "Client" },
            { key: "type", label: "Type" },
            { key: "jurisdiction", label: "Jurisdiction" },
            { key: "owner", label: "Owner" },
            { key: "status", label: "Status", type: "status" },
            { key: "age", label: "Age", type: "days" },
            { key: "bucket", label: "Bucket" },
          ],
          rows,
          sort: { key: "age", dir: "desc" },
        },
      };
    },
  },
  {
    slug: "drug-screen-appointments",
    name: "Drug Screen Appointment Report",
    description: "Drug screen appointments scheduled, completed, missed, rescheduled, and awaiting results.",
    section: "screening",
    spec: "§58.4",
    personas: [ON, SA],
    owner: "Screening Operations",
    load(ds) {
      const drug = ds.screenings.filter((s) => /drug|panel|quest|labcorp/i.test(`${s.packageType ?? ""} ${s.vendor}`));
      const rows = drug.map((s) => {
        const appt = s.consentedAt ? new Date(s.consentedAt.getTime() + 2 * 86_400_000) : s.orderedAt ? new Date(s.orderedAt.getTime() + 3 * 86_400_000) : null;
        const state = s.status === "CLEAR" || s.status === "REVIEW_REQUIRED" ? "Completed" : s.status === "INFO_REQUIRED" ? "Missed" : s.status === "VENDOR_DELAYED" ? "Rescheduled" : s.status === "IN_PROGRESS" ? "Result pending" : appt && appt > ds.now ? "Scheduled" : "Candidate action required";
        return { candidate: nameOf(ds, s.candidateId), client: clientOf(ds, s.candidateId), vendor: s.vendor, panel: s.packageType ?? "Drug panel", appointment: iso(appt), state, result: s.status === "CLEAR" ? "Negative" : s.status === "REVIEW_REQUIRED" ? "MRO review" : "—" };
      });
      return {
        kpis: [
          { label: "Drug screens", value: rows.length },
          { label: "Completed", value: rows.filter((r) => r.state === "Completed").length, tone: "success" },
          { label: "Missed", value: rows.filter((r) => r.state === "Missed").length, tone: "danger" },
          { label: "Result pending", value: rows.filter((r) => r.state === "Result pending").length, tone: "info" },
        ],
        charts: [{ kind: "bar", title: "Appointment status", drillKey: "state", points: points(countBy(rows, (r) => r.state), { tones: { Completed: "success", Scheduled: "info", "Result pending": "ai", Rescheduled: "warning", Missed: "danger", "Candidate action required": "warning" } }) }],
        table: {
          columns: [
            { key: "candidate", label: "Candidate" },
            { key: "client", label: "Client" },
            { key: "vendor", label: "Vendor" },
            { key: "panel", label: "Panel" },
            { key: "appointment", label: "Appointment", type: "date" },
            { key: "state", label: "Status", type: "status" },
            { key: "result", label: "Result" },
          ],
          rows,
          sort: { key: "appointment", dir: "desc" },
        },
      };
    },
  },
  {
    slug: "adjudication-queue",
    name: "Adjudication Queue",
    description: "Restricted queue of screenings requiring review or in the adverse-action process, with reviewer, age, and response window.",
    section: "screening",
    spec: "§58.5 · §11",
    personas: [SA],
    owner: "Screening Adjudication",
    restricted: true,
    definitions: [{ term: "Candidate response period", def: "Five business days after a pre-adverse notice before a final decision may be made (FCRA)." }],
    load(ds) {
      const q = ds.screenings.filter((s) => s.status === "REVIEW_REQUIRED" || s.status === "ADVERSE_PENDING");
      const rows = q.map((s) => {
        const since = s.completedAt ?? s.updatedAt;
        const windowEnds = s.status === "ADVERSE_PENDING" ? new Date(since.getTime() + 7 * 86_400_000) : null;
        return { candidate: nameOf(ds, s.candidateId), vendor: s.vendor, status: title(s.status), reviewer: s.adjudicator ?? "Unassigned", age: ageDays(ds, since), responseEnds: iso(windowEnds), action: s.status === "ADVERSE_PENDING" ? (windowEnds && windowEnds < ds.now ? "Final decision due" : "Awaiting candidate response") : "Individualized assessment", decision: "Pending (human required)" };
      });
      return {
        kpis: [
          { label: "In queue", value: rows.length, tone: "ai" },
          { label: "Review required", value: rows.filter((r) => r.status === "Review Required").length },
          { label: "Pre-adverse sent", value: rows.filter((r) => r.status === "Adverse Pending").length, tone: "warning" },
          { label: "Unassigned", value: rows.filter((r) => r.reviewer === "Unassigned").length, tone: "danger" },
        ],
        charts: [{ kind: "bar", title: "Queue by reviewer", drillKey: "reviewer", points: points(countBy(rows, (r) => r.reviewer), { tone: "ai" }) }],
        table: {
          columns: [
            { key: "candidate", label: "Candidate" },
            { key: "vendor", label: "Vendor" },
            { key: "status", label: "Status", type: "status" },
            { key: "reviewer", label: "Reviewer" },
            { key: "age", label: "Age", type: "days" },
            { key: "responseEnds", label: "Response period ends", type: "date" },
            { key: "action", label: "Required action" },
            { key: "decision", label: "Decision", type: "status" },
          ],
          rows,
          sort: { key: "age", dir: "desc" },
        },
        notes: ["Result details are masked. Adjudication decisions always require a human (§11)."],
      };
    },
  },
  {
    slug: "screening-cost",
    name: "Screening Cost Report",
    description: "Screening spend by vendor, package, and client with cost per completed onboarding and unused screening cost.",
    section: "screening",
    spec: "§58.6",
    personas: [SA, EX, AM],
    owner: "Finance",
    load(ds) {
      const rows = ds.screenings.map((s) => {
        const c = s.candidateId ? ds.candById.get(s.candidateId) : undefined;
        return { candidate: c ? fullName(c) : "—", vendor: s.vendor, package: s.packageType ?? "—", client: c?.clientName ?? "—", cost: s.cost ?? 0, ordered: iso(s.orderedAt), outcome: c && ["WITHDRAWN", "ARCHIVED"].includes(c.status) ? "Unused (dropped)" : c?.status === "PLACED" ? "Placed" : "In process" };
      });
      const placedCount = new Set(rows.filter((r) => r.outcome === "Placed").map((r) => r.candidate)).size;
      return {
        kpis: [
          { label: "Total screening spend", value: Math.round(sum(rows.map((r) => r.cost))), format: "currency" },
          { label: "Avg cost per order", value: round(avg(rows.map((r) => r.cost)), 2), format: "currency" },
          { label: "Cost per placement", value: placedCount ? Math.round(sum(rows.map((r) => r.cost)) / placedCount) : 0, format: "currency" },
          { label: "Unused screening cost", value: Math.round(sum(rows.filter((r) => r.outcome === "Unused (dropped)").map((r) => r.cost))), format: "currency", tone: "danger" },
        ],
        charts: [
          { kind: "bar", title: "Spend by vendor", drillKey: "vendor", format: "currency", points: [...countBy(rows, (r) => r.vendor).keys()].map((v) => ({ label: v, value: Math.round(sum(rows.filter((r) => r.vendor === v).map((r) => r.cost))), tone: "info" as const })).sort((a, b) => b.value - a.value) },
          { kind: "trend", title: "Spend by month", format: "currency", points: monthlyTrend(ds, ds.screenings, (s) => s.orderedAt, 9).map((p, i, arr) => { const d = new Date(ds.now.getFullYear(), ds.now.getMonth() - (arr.length - 1 - i), 1); return { ...p, value: Math.round(sum(ds.screenings.filter((s) => s.orderedAt && s.orderedAt.getMonth() === d.getMonth() && s.orderedAt.getFullYear() === d.getFullYear()).map((s) => s.cost ?? 0))), tone: "ai" as const }; }) },
          { kind: "bar", title: "Spend by client", drillKey: "client", format: "currency", points: [...countBy(rows, (r) => r.client).keys()].map((v) => ({ label: v, value: Math.round(sum(rows.filter((r) => r.client === v).map((r) => r.cost))), tone: "info" as const })).sort((a, b) => b.value - a.value).slice(0, 12) },
        ],
        table: {
          columns: [
            { key: "candidate", label: "Candidate" },
            { key: "vendor", label: "Vendor" },
            { key: "package", label: "Package" },
            { key: "client", label: "Client" },
            { key: "cost", label: "Cost", type: "currency" },
            { key: "ordered", label: "Ordered", type: "date" },
            { key: "outcome", label: "Outcome", type: "status" },
          ],
          rows,
          sort: { key: "cost", dir: "desc" },
        },
      };
    },
  },

  // ── Equipment & IT (§61) ─────────────────────────────────
  {
    slug: "equipment-readiness",
    name: "Equipment Readiness Report",
    description: "Every asset by provisioning status — requested through ready — with delays flagged against start dates.",
    section: "equipment",
    spec: "§61.1 · §17",
    personas: [ON, SA, AM],
    owner: "IT Provisioning",
    load(ds) {
      const ORDER = ["Requested", "Approved", "Assigned", "Shipped", "Delivered", "Enrolled", "Ready", "Delayed", "Return Required", "Returned", "Lost", "Damaged"];
      const rows = ds.equipment.map((e) => {
        const c = e.candidateId ? ds.candById.get(e.candidateId) : undefined;
        const late = e.estimatedDelivery && c?.startDate && !e.deliveredAt && e.estimatedDelivery > c.startDate;
        return { asset: e.label, type: e.assetType, candidate: c ? fullName(c) : "—", client: c?.clientName ?? "—", status: title(e.status), start: iso(c?.startDate), eta: iso(e.estimatedDelivery), startImpact: late || e.status === "DELAYED" ? "Will miss start" : "—" };
      });
      return {
        kpis: [
          { label: "Assets", value: rows.length },
          { label: "Ready / enrolled", value: rows.filter((r) => ["Ready", "Enrolled", "Delivered"].includes(r.status)).length, tone: "success" },
          { label: "In transit", value: rows.filter((r) => r.status === "Shipped").length, tone: "info" },
          { label: "Delayed", value: rows.filter((r) => r.status === "Delayed").length, tone: "danger" },
          { label: "Will miss start", value: rows.filter((r) => r.startImpact !== "—").length, tone: "danger" },
        ],
        charts: [
          { kind: "bar", title: "Assets by status", drillKey: "status", points: points(countBy(rows, (r) => r.status), { order: ORDER.filter((o) => rows.some((r) => r.status === o)), tones: { Ready: "success", Enrolled: "success", Delivered: "success", Shipped: "info", Delayed: "danger", Lost: "danger", Damaged: "danger" } }) },
          { kind: "bar", title: "By asset type", drillKey: "type", points: points(countBy(rows, (r) => r.type), { tone: "ai" }) },
        ],
        table: {
          columns: [
            { key: "asset", label: "Asset" },
            { key: "type", label: "Type" },
            { key: "candidate", label: "Assignee" },
            { key: "client", label: "Client" },
            { key: "status", label: "Status", type: "status" },
            { key: "start", label: "Start date", type: "date" },
            { key: "eta", label: "ETA", type: "date" },
            { key: "startImpact", label: "Start impact", type: "status" },
          ],
          rows,
        },
      };
    },
  },
  {
    slug: "shipment-tracking",
    name: "Shipment Tracking Report",
    description: "Carrier, tracking number, ship and delivery dates, delays, and start-date impact for every shipped asset.",
    section: "equipment",
    spec: "§61.2",
    personas: [ON, SA],
    owner: "IT Provisioning",
    load(ds) {
      const shipped = ds.equipment.filter((e) => e.trackingNumber || e.shippedAt);
      const rows = shipped.map((e) => {
        const c = e.candidateId ? ds.candById.get(e.candidateId) : undefined;
        const delay = e.estimatedDelivery ? daysBetween(e.estimatedDelivery, e.deliveredAt ?? ds.now) : 0;
        return { asset: e.label, candidate: c ? fullName(c) : "—", carrier: e.carrier ?? "—", tracking: e.trackingNumber ?? "—", shipped: iso(e.shippedAt), eta: iso(e.estimatedDelivery), delivered: iso(e.deliveredAt), delayDays: Math.max(0, e.deliveredAt || (e.estimatedDelivery && e.estimatedDelivery < ds.now) ? delay : 0), confirmation: e.deliveredAt ? (["ENROLLED", "READY"].includes(e.status) ? "Confirmed" : "Awaiting confirmation") : "—", startImpact: c?.startDate && !e.deliveredAt && e.estimatedDelivery && e.estimatedDelivery > c.startDate ? "At risk" : "—" };
      });
      return {
        kpis: [
          { label: "Shipments", value: rows.length },
          { label: "Delivered", value: rows.filter((r) => r.delivered).length, tone: "success" },
          { label: "In transit", value: rows.filter((r) => !r.delivered).length, tone: "info" },
          { label: "Delayed", value: rows.filter((r) => r.delayDays > 0).length, tone: "warning" },
          { label: "Start at risk", value: rows.filter((r) => r.startImpact === "At risk").length, tone: "danger" },
        ],
        charts: [
          { kind: "bar", title: "Shipments by carrier", drillKey: "carrier", points: points(countBy(rows, (r) => r.carrier)) },
          { kind: "bar", title: "Avg delay by carrier (days)", drillKey: "carrier", format: "days", points: [...countBy(rows, (r) => r.carrier).keys()].map((k) => ({ label: k, value: round(avg(rows.filter((r) => r.carrier === k).map((r) => r.delayDays))), tone: "warning" as const })) },
        ],
        table: {
          columns: [
            { key: "asset", label: "Asset" },
            { key: "candidate", label: "Recipient" },
            { key: "carrier", label: "Carrier" },
            { key: "tracking", label: "Tracking #" },
            { key: "shipped", label: "Shipped", type: "date" },
            { key: "eta", label: "ETA", type: "date" },
            { key: "delivered", label: "Delivered", type: "date" },
            { key: "delayDays", label: "Delay", type: "days" },
            { key: "confirmation", label: "Confirmation", type: "status" },
            { key: "startImpact", label: "Start impact", type: "status" },
          ],
          rows,
          sort: { key: "delayDays", dir: "desc" },
        },
      };
    },
  },
  {
    slug: "day1-access-readiness",
    name: "Day 1 Access Readiness Report",
    description: "Email, VPN, client credentials, and device enrollment readiness for candidates starting in the next 21 days.",
    section: "equipment",
    spec: "§61.4 · §14.2",
    personas: [ON, AM, SA],
    owner: "IT Provisioning",
    dateScope: "none",
    load(ds) {
      const soon = ds.candidates.filter((c) => isActive(c) && (daysUntil(ds, c.startDate) ?? 99) <= 21 && (daysUntil(ds, c.startDate) ?? -1) >= 0);
      const rows = soon.map((c) => {
        const eq = idx(ds).equipment.get(c.id) ?? [];
        const any = (k: "emailProvisioned" | "vpnProvisioned" | "clientCredentials" | "deviceEnrolled") => (eq.some((e) => e[k]) ? "Ready" : "Missing");
        const r = { candidate: fullName(c), client: c.clientName ?? "—", start: iso(c.startDate), days: daysUntil(ds, c.startDate), email: any("emailProvisioned"), vpn: any("vpnProvisioned"), credentials: any("clientCredentials"), device: any("deviceEnrolled"), badge: eq.some((e) => /badge/i.test(e.assetType) && ["DELIVERED", "READY", "ENROLLED"].includes(e.status)) ? "Ready" : eq.some((e) => /badge/i.test(e.assetType)) ? "Missing" : "N/A" };
        const missing = [r.email, r.vpn, r.credentials, r.device].filter((x) => x === "Missing").length;
        return { ...r, missing, test: missing === 0 ? "Passed" : "Not run" };
      });
      return {
        kpis: [
          { label: "Starting ≤21 days", value: rows.length },
          { label: "Access fully ready", value: rows.filter((r) => r.missing === 0).length, tone: "success" },
          { label: "Missing email", value: rows.filter((r) => r.email === "Missing").length, tone: "warning" },
          { label: "Missing VPN", value: rows.filter((r) => r.vpn === "Missing").length, tone: "warning" },
          { label: "Missing client creds", value: rows.filter((r) => r.credentials === "Missing").length, tone: "danger" },
        ],
        charts: [{ kind: "bar", title: "Missing access by type", points: [
          { label: "Email", value: rows.filter((r) => r.email === "Missing").length, tone: "warning" },
          { label: "VPN", value: rows.filter((r) => r.vpn === "Missing").length, tone: "warning" },
          { label: "Client credentials", value: rows.filter((r) => r.credentials === "Missing").length, tone: "danger" },
          { label: "Device enrollment", value: rows.filter((r) => r.device === "Missing").length, tone: "info" },
        ] }],
        table: {
          columns: [
            { key: "candidate", label: "Candidate" },
            { key: "client", label: "Client" },
            { key: "start", label: "Start", type: "date" },
            { key: "days", label: "Days", type: "days" },
            { key: "email", label: "Email", type: "status" },
            { key: "vpn", label: "VPN", type: "status" },
            { key: "credentials", label: "Client creds", type: "status" },
            { key: "device", label: "Device", type: "status" },
            { key: "badge", label: "Badge", type: "status" },
            { key: "test", label: "Access test", type: "status" },
          ],
          rows,
          sort: { key: "days", dir: "asc" },
        },
      };
    },
  },
  {
    slug: "asset-returns",
    name: "Asset Return & Recovery Report",
    description: "Assets requiring return — initiated, received, missing, damaged, overdue — with recovery cost.",
    section: "equipment",
    spec: "§61.5 · §68.5",
    personas: [ON, SA, AM],
    owner: "IT Provisioning",
    load(ds) {
      const xs = ds.equipment.filter((e) => e.returnRequired || ["RETURN_REQUIRED", "RETURNED", "LOST", "DAMAGED"].includes(e.status));
      const rows = xs.map((e) => {
        const due = new Date(e.updatedAt.getTime() + 14 * 86_400_000);
        const state = e.status === "RETURNED" || e.returnedAt ? "Received" : e.status === "LOST" ? "Missing" : e.status === "DAMAGED" ? "Damaged" : due < ds.now ? "Overdue" : "Return initiated";
        return { asset: e.label, type: e.assetType, serial: e.serialNumber ?? "—", holder: nameOf(ds, e.candidateId), state, due: iso(due), age: ageDays(ds, e.updatedAt), value: unitCost(e.assetType), recoveryCost: state === "Missing" ? unitCost(e.assetType) : state === "Damaged" ? Math.round(unitCost(e.assetType) * 0.4) : 0 };
      });
      return {
        kpis: [
          { label: "Returns tracked", value: rows.length },
          { label: "Received", value: rows.filter((r) => r.state === "Received").length, tone: "success" },
          { label: "Overdue", value: rows.filter((r) => r.state === "Overdue").length, tone: "warning" },
          { label: "Lost / damaged", value: rows.filter((r) => ["Missing", "Damaged"].includes(r.state)).length, tone: "danger" },
          { label: "Recovery cost", value: sum(rows.map((r) => r.recoveryCost)), format: "currency", tone: "danger" },
        ],
        charts: [{ kind: "bar", title: "Return state", drillKey: "state", points: points(countBy(rows, (r) => r.state), { tones: { Received: "success", "Return initiated": "info", Overdue: "warning", Missing: "danger", Damaged: "danger" } }) }],
        table: {
          columns: [
            { key: "asset", label: "Asset" },
            { key: "type", label: "Type" },
            { key: "serial", label: "Serial" },
            { key: "holder", label: "Holder" },
            { key: "state", label: "State", type: "status" },
            { key: "due", label: "Return due", type: "date" },
            { key: "age", label: "Age", type: "days" },
            { key: "value", label: "Asset value", type: "currency" },
            { key: "recoveryCost", label: "Recovery cost", type: "currency" },
          ],
          rows,
          sort: { key: "age", dir: "desc" },
        },
      };
    },
  },
  {
    slug: "equipment-cost",
    name: "Equipment Cost Report",
    description: "Purchase, shipping, and loss cost by asset type and client.",
    section: "equipment",
    spec: "§61.6",
    personas: [SA, EX],
    owner: "Finance",
    definitions: [{ term: "Unit cost", def: "Standard catalog cost per asset type; shipping $28 per shipment." }],
    load(ds) {
      const rows = [...countBy(ds.equipment, (e) => e.assetType).keys()].map((t) => {
        const xs = ds.equipment.filter((e) => e.assetType === t);
        const purchase = xs.length * unitCost(t);
        const shipping = xs.filter((e) => e.shippedAt).length * 28;
        const loss = xs.filter((e) => e.status === "LOST").length * unitCost(t) + xs.filter((e) => e.status === "DAMAGED").length * Math.round(unitCost(t) * 0.4);
        return { type: t, units: xs.length, unitCost: unitCost(t), purchase, shipping, loss, total: purchase + shipping + loss };
      });
      const byClient = new Map<string, number>();
      for (const e of ds.equipment) { const k = clientOf(ds, e.candidateId); byClient.set(k, (byClient.get(k) ?? 0) + unitCost(e.assetType)); }
      return {
        kpis: [
          { label: "Total equipment cost", value: sum(rows.map((r) => r.total)), format: "currency" },
          { label: "Purchase", value: sum(rows.map((r) => r.purchase)), format: "currency" },
          { label: "Shipping", value: sum(rows.map((r) => r.shipping)), format: "currency" },
          { label: "Loss & damage", value: sum(rows.map((r) => r.loss)), format: "currency", tone: "danger" },
        ],
        charts: [
          { kind: "bar", title: "Cost by asset type", drillKey: "type", format: "currency", points: rows.map((r) => ({ label: r.type, value: r.total, tone: "info" as const })).sort((a, b) => b.value - a.value) },
          { kind: "bar", title: "Cost by client", format: "currency", points: points(byClient, { limit: 12, tone: "ai" }) },
        ],
        table: {
          columns: [
            { key: "type", label: "Asset type" },
            { key: "units", label: "Units", type: "number" },
            { key: "unitCost", label: "Unit cost", type: "currency" },
            { key: "purchase", label: "Purchase", type: "currency" },
            { key: "shipping", label: "Shipping", type: "currency" },
            { key: "loss", label: "Loss & damage", type: "currency" },
            { key: "total", label: "Total", type: "currency" },
          ],
          rows,
          sort: { key: "total", dir: "desc" },
        },
      };
    },
  },

  // ── Training (§62) ───────────────────────────────────────
  {
    slug: "training-completion",
    name: "Training Completion Report",
    description: "Assigned, started, completed, failed, overdue, and waived courses with completion rate by course and client.",
    section: "training",
    spec: "§62.1 · §37",
    personas: [ON, SA, AM],
    owner: "Learning & Development",
    load(ds) {
      const rows = ds.trainings.map((t) => ({ course: t.title, category: t.category, candidate: nameOf(ds, t.candidateId), client: clientOf(ds, t.candidateId), status: title(t.status), due: iso(t.dueDate), completed: iso(t.completedAt), score: t.score, required: t.required ? "Required" : "Optional" }));
      const tones = { Completed: "success", Waived: "neutral", Started: "info", Assigned: "info", Overdue: "danger", Failed: "danger", Expiring: "warning" } as const;
      return {
        kpis: [
          { label: "Assignments", value: rows.length },
          { label: "Completion rate", value: pct(rows.filter((r) => r.status === "Completed" || r.status === "Waived").length, rows.length), format: "percent", tone: "success" },
          { label: "Overdue", value: rows.filter((r) => r.status === "Overdue").length, tone: "danger" },
          { label: "Failed", value: rows.filter((r) => r.status === "Failed").length, tone: "danger" },
          { label: "Avg score", value: round(avg(rows.map((r) => r.score ?? 0).filter(Boolean))) },
        ],
        charts: [
          { kind: "bar", title: "Status", drillKey: "status", points: points(countBy(rows, (r) => r.status), { tones }) },
          { kind: "bar", title: "Completion rate by course", drillKey: "course", format: "percent", points: [...countBy(rows, (r) => r.course).keys()].map((k) => { const xs = rows.filter((r) => r.course === k); return { label: k, value: pct(xs.filter((r) => r.status === "Completed" || r.status === "Waived").length, xs.length), tone: "success" as const }; }).sort((a, b) => a.value - b.value) },
        ],
        table: {
          columns: [
            { key: "course", label: "Course" },
            { key: "category", label: "Category" },
            { key: "candidate", label: "Learner" },
            { key: "client", label: "Client" },
            { key: "status", label: "Status", type: "status" },
            { key: "due", label: "Due", type: "date" },
            { key: "completed", label: "Completed", type: "date" },
            { key: "score", label: "Score", type: "number" },
            { key: "required", label: "Required" },
          ],
          rows,
          sort: { key: "due", dir: "asc" },
        },
      };
    },
  },
  {
    slug: "expiring-certifications",
    name: "Expiring Certification Report",
    description: "Certifications and licenses nearing expiry, renewal status, and client assignment risk.",
    section: "training",
    spec: "§62.2",
    personas: [ON, AM, SA],
    owner: "Learning & Development",
    dateScope: "none",
    load(ds) {
      const certs = ds.documents.filter((d) => /cert|licen|clearance/i.test(`${d.name} ${d.category}`) && d.expiresAt);
      const trainExp = ds.trainings.filter((t) => t.status === "EXPIRING");
      const rows = [
        ...certs.map((d) => { const left = daysUntil(ds, d.expiresAt)!; return { certification: d.name, holder: nameOf(ds, d.candidateId), client: clientOf(ds, d.candidateId), expires: iso(d.expiresAt), daysLeft: left, renewal: left < 0 ? "Lapsed" : left <= 30 ? "Renewal in progress" : "Not started", risk: left < 0 ? "High" : left <= 30 ? "Medium" : "Low" }; }),
        ...trainExp.map((t) => { const left = daysUntil(ds, t.dueDate) ?? 30; return { certification: t.title, holder: nameOf(ds, t.candidateId), client: clientOf(ds, t.candidateId), expires: iso(t.dueDate), daysLeft: left, renewal: "Retraining assigned", risk: left <= 14 ? "Medium" : "Low" }; }),
      ];
      return {
        kpis: [
          { label: "Tracked certifications", value: rows.length },
          { label: "Lapsed", value: rows.filter((r) => r.renewal === "Lapsed").length, tone: "danger" },
          { label: "Expiring ≤30 days", value: rows.filter((r) => r.daysLeft >= 0 && r.daysLeft <= 30).length, tone: "warning" },
          { label: "High assignment risk", value: rows.filter((r) => r.risk === "High").length, tone: "danger" },
        ],
        charts: [
          { kind: "bar", title: "Renewal status", drillKey: "renewal", points: points(countBy(rows, (r) => r.renewal), { tones: { Lapsed: "danger", "Renewal in progress": "warning", "Retraining assigned": "info", "Not started": "neutral" } }) },
          { kind: "bar", title: "By certification", drillKey: "certification", points: points(countBy(rows, (r) => r.certification), { limit: 10 }) },
        ],
        table: {
          columns: [
            { key: "certification", label: "Certification" },
            { key: "holder", label: "Holder" },
            { key: "client", label: "Client" },
            { key: "expires", label: "Expires", type: "date" },
            { key: "daysLeft", label: "Days left", type: "days" },
            { key: "renewal", label: "Renewal", type: "status" },
            { key: "risk", label: "Assignment risk", type: "status" },
          ],
          rows,
          sort: { key: "daysLeft", dir: "asc" },
        },
      };
    },
  },
  {
    slug: "client-training-compliance",
    name: "Client Training Compliance Report",
    description: "Required-course completion, overdue learners, failed attempts, and waivers per client — and their readiness impact.",
    section: "training",
    spec: "§62.3",
    personas: [AM, ON],
    owner: "Learning & Development",
    load(ds) {
      const req = ds.trainings.filter((t) => t.required);
      const clients = [...countBy(req, (t) => clientOf(ds, t.candidateId)).keys()].filter((c) => c !== "—");
      const rows = clients.map((cl) => {
        const xs = req.filter((t) => clientOf(ds, t.candidateId) === cl);
        const learners = new Set(xs.map((t) => t.candidateId));
        const blocked = [...learners].filter((id) => xs.some((t) => t.candidateId === id && !["COMPLETED", "WAIVED"].includes(t.status))).length;
        return { client: cl, courses: new Set(xs.map((t) => t.title)).size, assignments: xs.length, completion: pct(xs.filter((t) => ["COMPLETED", "WAIVED"].includes(t.status)).length, xs.length), overdue: xs.filter((t) => t.status === "OVERDUE").length, failed: xs.filter((t) => t.status === "FAILED").length, waivers: xs.filter((t) => t.status === "WAIVED").length, readinessImpact: blocked };
      });
      return {
        kpis: [
          { label: "Clients", value: rows.length },
          { label: "Avg completion", value: round(avg(rows.map((r) => r.completion))), format: "percent", tone: "success" },
          { label: "Overdue learners", value: sum(rows.map((r) => r.overdue)), tone: "danger" },
          { label: "Candidates blocked", value: sum(rows.map((r) => r.readinessImpact)), tone: "warning" },
        ],
        charts: [{ kind: "bar", title: "Required-course completion by client", drillKey: "client", format: "percent", points: rows.map((r) => ({ label: r.client, value: r.completion, tone: r.completion < 70 ? ("danger" as const) : ("success" as const) })).sort((a, b) => a.value - b.value) }],
        table: {
          columns: [
            { key: "client", label: "Client" },
            { key: "courses", label: "Courses", type: "number" },
            { key: "assignments", label: "Assignments", type: "number" },
            { key: "completion", label: "Completion", type: "percent" },
            { key: "overdue", label: "Overdue", type: "number" },
            { key: "failed", label: "Failed", type: "number" },
            { key: "waivers", label: "Waivers", type: "number" },
            { key: "readinessImpact", label: "Candidates blocked", type: "number" },
          ],
          rows,
          sort: { key: "completion", dir: "asc" },
        },
      };
    },
  },
  {
    slug: "training-effectiveness",
    name: "Training Effectiveness Report",
    description: "Completion time, assessment scores, retry rates, and correlation with Day 1 issues per course.",
    section: "training",
    spec: "§62.4",
    personas: [SA, ON],
    owner: "Learning & Development",
    load(ds) {
      const courses = [...countBy(ds.trainings, (t) => t.title).keys()];
      const rows = courses.map((c) => {
        const xs = ds.trainings.filter((t) => t.title === c);
        const done = xs.filter((t) => t.completedAt);
        const scores = xs.map((t) => t.score).filter((s): s is number => s !== null && s !== undefined);
        const ids = new Set(xs.filter((t) => t.status === "FAILED" || t.status === "OVERDUE").map((t) => t.candidateId));
        const day1 = ds.exceptions.filter((e) => e.candidateId && ids.has(e.candidateId)).length;
        return { course: c, learners: xs.length, avgDays: round(avg(done.map((t) => Math.max(0, daysBetween(t.createdAt, t.completedAt!))))), avgScore: round(avg(scores)), passRate: pct(scores.filter((s) => s >= 70).length, scores.length), retryRate: pct(xs.filter((t) => t.status === "FAILED").length, xs.length), dropOff: pct(xs.filter((t) => t.status === "OVERDUE").length, xs.length), day1Issues: day1 };
      });
      return {
        kpis: [
          { label: "Courses", value: rows.length },
          { label: "Avg score", value: round(avg(rows.map((r) => r.avgScore).filter(Boolean))) },
          { label: "Avg completion time", value: round(avg(rows.map((r) => r.avgDays))), format: "days" },
          { label: "Avg retry rate", value: round(avg(rows.map((r) => r.retryRate))), format: "percent", tone: "warning" },
        ],
        charts: [
          { kind: "bar", title: "Avg assessment score", drillKey: "course", points: rows.filter((r) => r.avgScore).map((r) => ({ label: r.course, value: r.avgScore, tone: r.avgScore < 75 ? ("warning" as const) : ("success" as const) })).sort((a, b) => a.value - b.value) },
          { kind: "bar", title: "Retry rate", drillKey: "course", format: "percent", points: rows.map((r) => ({ label: r.course, value: r.retryRate, tone: "danger" as const })).sort((a, b) => b.value - a.value) },
        ],
        table: {
          columns: [
            { key: "course", label: "Course" },
            { key: "learners", label: "Learners", type: "number" },
            { key: "avgDays", label: "Avg completion", type: "days" },
            { key: "avgScore", label: "Avg score", type: "number" },
            { key: "passRate", label: "Pass rate", type: "percent" },
            { key: "retryRate", label: "Retry rate", type: "percent" },
            { key: "dropOff", label: "Overdue rate", type: "percent" },
            { key: "day1Issues", label: "Linked exceptions", type: "number" },
          ],
          rows,
          sort: { key: "retryRate", dir: "desc" },
        },
      };
    },
  },
];
