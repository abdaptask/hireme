/**
 * Candidate self-service (§52), communications (§63), AI & automation (§64),
 * integrations (§65), and audit / security (§66) reports.
 */

import type { ReportDef, ReportResult } from "../types";
import {
  ageDays,
  avg,
  countBy,
  daysUntil,
  fullName,
  idx,
  isActive,
  iso,
  monthlyTrend,
  nameOf,
  clientOf,
  pct,
  points,
  readiness,
  recommendedAction,
  round,
  sum,
  title,
  weeklyTrend,
} from "../helpers";
import type { Dataset, DsCandidate } from "../dataset";
import { SYSTEM_ROLES } from "./operational";

const SA = "super-admin" as const;
const ON = "onboarder" as const;
const RC = "recruiter" as const;
const EX = "executive" as const;
const CA = "candidate" as const;

const FAILED = new Set(["failed", "bounced"]);

// ─────────────────────────────────────────────────────────
// Candidate-scoped reports (§52) — only the selected candidate's data
// ─────────────────────────────────────────────────────────

const CANDIDATE_STAGES = ["Profile Setup", "Document Submission", "Background Check", "Tax & Payroll", "Client Requirements", "IT Provisioning", "Training", "Day 1 Prep"];

function subjectFor(ds: Dataset, id?: string): { c: DsCandidate; subject: NonNullable<ReportResult["subject"]> } {
  const pool = ds.candidates.filter(isActive).sort((a, b) => fullName(a).localeCompare(fullName(b)));
  // Default to the active candidate with the richest record for demo clarity.
  const richness = (x: DsCandidate) =>
    ["docs", "trainings", "equipment", "screenings", "comms"].reduce((n, k) => n + (idx(ds)[k as "docs"].get(x.id)?.length ?? 0), 0);
  const richest = [...pool].sort((a, b) => richness(b) - richness(a))[0];
  const c = (id && ds.candById.get(id)) || richest || ds.candidates[0];
  return {
    c,
    subject: { label: "Viewing as candidate", selected: c.id, options: pool.map((x) => ({ id: x.id, label: `${fullName(x)} — ${x.clientName ?? "Unassigned"}` })) },
  };
}

/** Candidate-safe document status wording (§52.2, §101). */
const CAND_DOC_STATUS: Record<string, string> = {
  PENDING: "To do",
  SUBMITTED: "Submitted",
  AI_REVIEW: "In review",
  APPROVED: "Approved",
  REJECTED: "Needs correction",
  CORRECTION_REQUIRED: "Needs correction",
  EXPIRED: "Expired",
};

/** Candidate-permitted screening states only (§52.3) — no result details. */
const CAND_SCREEN_STATUS: Record<string, string> = {
  ORDERED: "Invitation sent",
  INVITED: "Invitation sent",
  CONSENTED: "Consent complete",
  IN_PROGRESS: "In progress",
  INFO_REQUIRED: "Additional information needed",
  VENDOR_DELAYED: "In progress",
  CLEAR: "Complete",
  REVIEW_REQUIRED: "In progress",
  ADVERSE_PENDING: "In progress",
};

const candidateReports: ReportDef[] = [
  {
    slug: "my-onboarding-progress",
    name: "My Onboarding Progress",
    description: "Overall completion, stage progress, completed and pending tasks, rejected items, and expected start date.",
    section: "candidate",
    spec: "§52.1",
    personas: [CA],
    owner: "Candidate Experience",
    dateScope: "none",
    load(ds, ctx) {
      const { c, subject } = subjectFor(ds, ctx.subjectId);
      const r = readiness(ds, c);
      const tr = idx(ds).trainings.get(c.id) ?? [];
      const at = Math.max(0, CANDIDATE_STAGES.indexOf(c.stage ?? ""));
      const rows = [
        ...r.docs.map((d) => ({ task: d.name, type: "Document", status: CAND_DOC_STATUS[d.status] ?? title(d.status), note: d.rejectedReason ?? "—" })),
        ...tr.map((t) => ({ task: t.title, type: "Training", status: ["COMPLETED", "WAIVED"].includes(t.status) ? "Approved" : t.status === "OVERDUE" ? "Overdue" : "To do", note: t.dueDate ? `Due ${iso(t.dueDate)}` : "—" })),
      ];
      const done = rows.filter((x) => x.status === "Approved").length;
      return {
        subject,
        kpis: [
          { label: "Overall progress", value: c.progress, format: "percent", tone: "success" },
          { label: "Completed tasks", value: done, tone: "success" },
          { label: "Pending tasks", value: rows.length - done, tone: "info" },
          { label: "Needs correction", value: rows.filter((x) => x.status === "Needs correction").length, tone: "danger" },
          { label: "Expected start", value: iso(c.startDate) ?? "TBD" },
          { label: "Est. time remaining", value: `${Math.max(10, (rows.length - done) * 12)} min` },
        ],
        charts: [
          { kind: "funnel", title: "Your onboarding stages", points: CANDIDATE_STAGES.map((s, i) => ({ label: s, value: i < at ? 100 : i === at ? Math.max(10, c.progress % 12.5 * 8) : 0, tone: i < at ? ("success" as const) : i === at ? ("info" as const) : ("neutral" as const) })), format: "percent" },
          { kind: "bar", title: "Your tasks by status", drillKey: "status", points: points(countBy(rows, (x) => x.status), { tones: { Approved: "success", Submitted: "info", "In review": "info", "To do": "neutral", "Needs correction": "danger", Overdue: "danger", Expired: "danger" } }) },
        ],
        table: { columns: [{ key: "task", label: "Task" }, { key: "type", label: "Type" }, { key: "status", label: "Status", type: "status" }, { key: "note", label: "What to do" }], rows },
        notes: [`Next step: ${recommendedAction(ds, c).replace("Review submitted documents", "Wait for your documents to be reviewed")}. Questions? Contact ${c.onboarder ?? "your onboarding specialist"}.`],
      };
    },
  },
  {
    slug: "my-documents",
    name: "My Document Status",
    description: "Required, submitted, approved, rejected, and expiring documents with correction instructions and due dates.",
    section: "candidate",
    spec: "§52.2",
    personas: [CA],
    owner: "Candidate Experience",
    dateScope: "none",
    load(ds, ctx) {
      const { c, subject } = subjectFor(ds, ctx.subjectId);
      const docs = idx(ds).docs.get(c.id) ?? [];
      const due = c.startDate ? new Date(c.startDate.getTime() - 5 * 86_400_000) : null;
      const rows = docs.map((d) => ({ document: d.name, status: CAND_DOC_STATUS[d.status] ?? title(d.status), submitted: iso(d.uploadedAt), due: d.status === "APPROVED" ? null : iso(due), expires: iso(d.expiresAt), instructions: d.rejectedReason ? `Please re-upload: ${d.rejectedReason}` : d.status === "PENDING" ? "Upload from your phone or computer" : "—" }));
      return {
        subject,
        kpis: [
          { label: "Required documents", value: rows.length },
          { label: "Approved", value: rows.filter((r) => r.status === "Approved").length, tone: "success" },
          { label: "Waiting on you", value: rows.filter((r) => ["To do", "Needs correction"].includes(r.status)).length, tone: "warning" },
          { label: "Expiring soon", value: docs.filter((d) => d.expiresAt && (daysUntil(ds, d.expiresAt) ?? 999) <= 60).length, tone: "info" },
        ],
        charts: [{ kind: "bar", title: "Document status", drillKey: "status", points: points(countBy(rows, (r) => r.status), { tones: { Approved: "success", Submitted: "info", "In review": "info", "To do": "neutral", "Needs correction": "danger", Expired: "danger" } }) }],
        table: { columns: [{ key: "document", label: "Document" }, { key: "status", label: "Status", type: "status" }, { key: "submitted", label: "Submitted", type: "date" }, { key: "due", label: "Due", type: "date" }, { key: "expires", label: "Expires", type: "date" }, { key: "instructions", label: "Instructions" }], rows },
      };
    },
  },
  {
    slug: "my-screening",
    name: "My Screening Status",
    description: "Permitted screening status only — invitation, consent, in progress, information needed, complete.",
    section: "candidate",
    spec: "§52.3",
    personas: [CA],
    owner: "Candidate Experience",
    dateScope: "none",
    load(ds, ctx) {
      const { c, subject } = subjectFor(ds, ctx.subjectId);
      const scr = idx(ds).screenings.get(c.id) ?? [];
      const rows = scr.map((s) => ({ screening: /drug|panel/i.test(s.packageType ?? "") ? "Drug screening" : "Background check", provider: s.vendor, status: CAND_SCREEN_STATUS[s.status] ?? "In progress", started: iso(s.orderedAt), estimated: s.completedAt ? null : iso(s.estimatedCompletion) }));
      return {
        subject,
        kpis: [
          { label: "Screenings", value: rows.length },
          { label: "Complete", value: rows.filter((r) => r.status === "Complete").length, tone: "success" },
          { label: "Action needed", value: rows.filter((r) => r.status === "Additional information needed").length, tone: "warning" },
        ],
        charts: [],
        table: { columns: [{ key: "screening", label: "Screening" }, { key: "provider", label: "Provider" }, { key: "status", label: "Status", type: "status" }, { key: "started", label: "Started", type: "date" }, { key: "estimated", label: "Estimated completion", type: "date" }], rows },
        notes: ["For your privacy, detailed results are never shown here. Your onboarding specialist will contact you if anything is needed."],
      };
    },
  },
  {
    slug: "my-day1-readiness",
    name: "My Day 1 Readiness",
    description: "Client approval, payroll, equipment, and training readiness with start instructions and contacts.",
    section: "candidate",
    spec: "§52.4",
    personas: [CA],
    owner: "Candidate Experience",
    dateScope: "none",
    load(ds, ctx) {
      const { c, subject } = subjectFor(ds, ctx.subjectId);
      const r = readiness(ds, c);
      const rows = [
        { item: "Documents & compliance", status: r.compliance ? "Ready" : "In progress", detail: r.openDocs.length ? `${r.openDocs.length} item(s) remaining` : "All approved" },
        { item: "Background screening", status: r.screening === "Clear" ? "Ready" : "In progress", detail: r.screening === "Clear" ? "Complete" : "In progress" },
        { item: "Payroll setup", status: r.payroll ? "Ready" : "In progress", detail: r.payroll ? "You'll be paid on schedule" : "Tax or direct deposit info pending" },
        { item: "Equipment", status: r.equipment === "Ready" || r.equipment === "None required" ? "Ready" : r.equipment === "Delayed" ? "Delayed" : "In progress", detail: r.equipment },
        { item: "Training", status: r.trainingComplete ? "Ready" : "In progress", detail: `${r.training} courses complete` },
        { item: "Start instructions", status: (daysUntil(ds, c.startDate) ?? 99) <= 5 ? "Ready" : "Coming soon", detail: "Sent 5 days before your start date" },
      ];
      return {
        subject,
        kpis: [
          { label: "Start date", value: iso(c.startDate) ?? "TBD" },
          { label: "Days to go", value: Math.max(0, daysUntil(ds, c.startDate) ?? 0), format: "days" },
          { label: "Ready items", value: `${rows.filter((x) => x.status === "Ready").length} / ${rows.length}`, tone: "success" },
          { label: "Your contact", value: c.onboarder ?? "Onboarding team" },
        ],
        charts: [],
        table: { columns: [{ key: "item", label: "Item" }, { key: "status", label: "Status", type: "status" }, { key: "detail", label: "Detail" }], rows },
      };
    },
  },
  {
    slug: "my-communications",
    name: "My Communication History",
    description: "Messages sent and received, reminders, announcements, support responses, and delivery status.",
    section: "candidate",
    spec: "§52.5",
    personas: [CA],
    owner: "Candidate Experience",
    dateScope: "none",
    load(ds, ctx) {
      const { c, subject } = subjectFor(ds, ctx.subjectId);
      const comms = (idx(ds).comms.get(c.id) ?? []).filter((m) => m.channel !== "INTERNAL");
      const rows = comms.map((m) => ({ date: iso(m.sentAt ?? m.createdAt), direction: m.direction === "inbound" ? "From you" : "To you", channel: title(m.channel), subject: m.subject ?? "(no subject)", type: m.nudgeLevel !== null && m.nudgeLevel !== undefined ? "Reminder" : "Message", status: title(m.status) }));
      return {
        subject,
        kpis: [
          { label: "Messages", value: rows.length },
          { label: "Reminders", value: rows.filter((r) => r.type === "Reminder").length, tone: "info" },
          { label: "Sent by you", value: rows.filter((r) => r.direction === "From you").length },
        ],
        charts: [{ kind: "bar", title: "By channel", drillKey: "channel", points: points(countBy(rows, (r) => r.channel)) }],
        table: { columns: [{ key: "date", label: "Date", type: "date" }, { key: "direction", label: "Direction" }, { key: "channel", label: "Channel" }, { key: "subject", label: "Subject" }, { key: "type", label: "Type" }, { key: "status", label: "Delivery", type: "status" }], rows, sort: { key: "date", dir: "desc" } },
      };
    },
  },
  {
    slug: "my-equipment",
    name: "My Equipment Status",
    description: "Assigned equipment, shipment tracking, delivery, required acknowledgments, and support contact.",
    section: "candidate",
    spec: "§52.6",
    personas: [CA],
    owner: "Candidate Experience",
    dateScope: "none",
    load(ds, ctx) {
      const { c, subject } = subjectFor(ds, ctx.subjectId);
      const eq = idx(ds).equipment.get(c.id) ?? [];
      const rows = eq.map((e) => ({ item: e.label, status: title(e.status), carrier: e.carrier ?? "—", tracking: e.trackingNumber ?? "—", eta: iso(e.estimatedDelivery), delivered: iso(e.deliveredAt), acknowledgment: e.deliveredAt ? (["ENROLLED", "READY"].includes(e.status) ? "Acknowledged" : "Please confirm receipt") : "—" }));
      return {
        subject,
        kpis: [
          { label: "Items", value: rows.length },
          { label: "Delivered", value: rows.filter((r) => r.delivered).length, tone: "success" },
          { label: "On the way", value: rows.filter((r) => r.status === "Shipped").length, tone: "info" },
          { label: "Support", value: "IT Help Desk" },
        ],
        charts: [],
        table: { columns: [{ key: "item", label: "Item" }, { key: "status", label: "Status", type: "status" }, { key: "carrier", label: "Carrier" }, { key: "tracking", label: "Tracking #" }, { key: "eta", label: "ETA", type: "date" }, { key: "delivered", label: "Delivered", type: "date" }, { key: "acknowledgment", label: "Acknowledgment", type: "status" }], rows },
      };
    },
  },
  {
    slug: "my-training",
    name: "My Training Status",
    description: "Assigned courses, completion, due dates, scores, and required retraining.",
    section: "candidate",
    spec: "§52.7",
    personas: [CA],
    owner: "Candidate Experience",
    dateScope: "none",
    load(ds, ctx) {
      const { c, subject } = subjectFor(ds, ctx.subjectId);
      const tr = idx(ds).trainings.get(c.id) ?? [];
      const rows = tr.map((t) => ({ course: t.title, status: title(t.status), due: iso(t.dueDate), completed: iso(t.completedAt), score: t.score, retraining: t.status === "FAILED" || t.status === "EXPIRING" ? "Required" : "—" }));
      return {
        subject,
        kpis: [
          { label: "Courses", value: rows.length },
          { label: "Completed", value: rows.filter((r) => r.status === "Completed").length, tone: "success" },
          { label: "Overdue", value: rows.filter((r) => r.status === "Overdue").length, tone: "danger" },
          { label: "Avg score", value: round(avg(rows.map((r) => r.score ?? 0).filter(Boolean))) },
        ],
        charts: [],
        table: { columns: [{ key: "course", label: "Course" }, { key: "status", label: "Status", type: "status" }, { key: "due", label: "Due", type: "date" }, { key: "completed", label: "Completed", type: "date" }, { key: "score", label: "Score", type: "number" }, { key: "retraining", label: "Retraining", type: "status" }], rows },
      };
    },
  },
];

// ─────────────────────────────────────────────────────────
// Communications (§63)
// ─────────────────────────────────────────────────────────

const commsReports: ReportDef[] = [
  {
    slug: "communication-delivery",
    name: "Communication Delivery Report",
    description: "Email, SMS, portal, and voice delivery — sent, delivered, opened, bounced, failed — by channel and day.",
    section: "communication",
    spec: "§63.1 · §24",
    personas: [SA, ON],
    owner: "Communications",
    load(ds) {
      const out = ds.communications.filter((m) => m.direction === "outbound" && m.channel !== "INTERNAL");
      const chans = [...countBy(out, (m) => title(m.channel)).keys()];
      const rows = chans.map((ch) => {
        const xs = out.filter((m) => title(m.channel) === ch);
        return { channel: ch, sent: xs.length, delivered: pct(xs.filter((m) => !FAILED.has(m.status) && m.status !== "scheduled").length, xs.length), opened: pct(xs.filter((m) => m.openedAt).length, xs.length), replied: pct(xs.filter((m) => m.respondedAt).length, xs.length), bounced: xs.filter((m) => m.status === "bounced").length, failed: xs.filter((m) => m.status === "failed").length, scheduled: xs.filter((m) => m.status === "scheduled").length };
      });
      return {
        kpis: [
          { label: "Messages sent (90d)", value: out.length },
          { label: "Delivery rate", value: pct(out.filter((m) => !FAILED.has(m.status)).length, out.length), format: "percent", tone: "success" },
          { label: "Open rate", value: pct(out.filter((m) => m.openedAt).length, out.length), format: "percent" },
          { label: "Bounced / failed", value: out.filter((m) => FAILED.has(m.status)).length, tone: "danger" },
          { label: "Scheduled", value: out.filter((m) => m.status === "scheduled").length, tone: "info" },
        ],
        charts: [
          { kind: "stacked", title: "Outcome by channel", drillKey: "channel", segments: [{ key: "ok", label: "Delivered", tone: "success" }, { key: "open", label: "Opened", tone: "info" }, { key: "fail", label: "Failed / bounced", tone: "danger" }], rows: chans.map((ch) => { const xs = out.filter((m) => title(m.channel) === ch); return { label: ch, values: { ok: xs.filter((m) => !FAILED.has(m.status) && !m.openedAt).length, open: xs.filter((m) => m.openedAt).length, fail: xs.filter((m) => FAILED.has(m.status)).length } }; }) },
          { kind: "trend", title: "Messages per week", points: weeklyTrend(ds, out, (m) => m.sentAt ?? m.createdAt, 12) },
        ],
        table: { columns: [{ key: "channel", label: "Channel" }, { key: "sent", label: "Sent", type: "number" }, { key: "delivered", label: "Delivered", type: "percent" }, { key: "opened", label: "Opened", type: "percent" }, { key: "replied", label: "Replied", type: "percent" }, { key: "bounced", label: "Bounced", type: "number" }, { key: "failed", label: "Failed", type: "number" }, { key: "scheduled", label: "Scheduled", type: "number" }], rows, sort: { key: "sent", dir: "desc" } },
      };
    },
  },
  {
    slug: "candidate-response",
    name: "Candidate Response Report",
    description: "Response rate and time by channel, inactive candidates, and recruiter / onboarder follow-up.",
    section: "communication",
    spec: "§63.2",
    personas: [RC, ON, SA],
    owner: "Communications",
    load(ds) {
      const out = ds.communications.filter((m) => m.direction === "outbound" && m.channel !== "INTERNAL");
      const resp = out.filter((m) => m.respondedAt);
      const hrs = (m: (typeof out)[number]) => (m.respondedAt!.getTime() - (m.sentAt ?? m.createdAt).getTime()) / 3_600_000;
      const senders = [...countBy(out.filter((m) => m.sentBy), (m) => m.sentBy).keys()];
      const rows = senders.map((s) => { const xs = out.filter((m) => m.sentBy === s); const rs = xs.filter((m) => m.respondedAt); return { sender: s, type: /AI|Automation/.test(s) ? "Automated" : "Staff", messages: xs.length, responses: rs.length, responseRate: pct(rs.length, xs.length), avgHours: round(avg(rs.map(hrs))) }; });
      const inactive = ds.candidates.filter((c) => isActive(c) && (ageDays(ds, c.lastContact ?? c.createdAt) ?? 0) >= 2).length;
      return {
        kpis: [
          { label: "Response rate", value: pct(resp.length, out.length), format: "percent", tone: "success" },
          { label: "Avg response time", value: `${round(avg(resp.map(hrs)))} h` },
          { label: "Inactive 48h+", value: inactive, tone: "warning" },
          { label: "Best channel", value: points(countBy(resp, (m) => title(m.channel)))[0]?.label ?? "—", tone: "info" },
        ],
        charts: [
          { kind: "bar", title: "Response rate by channel", format: "percent", points: [...countBy(out, (m) => title(m.channel)).keys()].map((ch) => { const xs = out.filter((m) => title(m.channel) === ch); return { label: ch, value: pct(xs.filter((m) => m.respondedAt).length, xs.length), tone: "success" as const }; }).sort((a, b) => b.value - a.value) },
          { kind: "bar", title: "Response rate by sender", drillKey: "sender", format: "percent", points: rows.map((r) => ({ label: r.sender, value: r.responseRate, tone: r.type === "Automated" ? ("ai" as const) : ("info" as const) })).sort((a, b) => b.value - a.value).slice(0, 14) },
        ],
        table: { columns: [{ key: "sender", label: "Sender" }, { key: "type", label: "Type" }, { key: "messages", label: "Messages", type: "number" }, { key: "responses", label: "Responses", type: "number" }, { key: "responseRate", label: "Response rate", type: "percent" }, { key: "avgHours", label: "Avg response (h)", type: "number" }], rows, sort: { key: "messages", dir: "desc" } },
      };
    },
  },
  {
    slug: "template-performance",
    name: "Template Performance Report",
    description: "Open, response, and failure rates by message template (subject) and channel — find the best-performing wording.",
    section: "communication",
    spec: "§63.3",
    personas: [SA, ON, RC],
    owner: "Communications",
    load(ds) {
      const out = ds.communications.filter((m) => m.direction === "outbound" && m.subject);
      const tpl = (s: string) => s.replace(/[,—:-]\s*[A-Z][a-z]+(\s[A-Z][a-z]+)?!?$/, "").replace(/\b(for|to)\s+[A-Z][a-z]+\b/, "").trim();
      const groups = countBy(out, (m) => `${tpl(m.subject!)}|${title(m.channel)}`);
      const rows = [...groups.keys()].map((k) => { const [t, ch] = k.split("|"); const xs = out.filter((m) => tpl(m.subject!) === t && title(m.channel) === ch); return { template: t, channel: ch, sent: xs.length, openRate: pct(xs.filter((m) => m.openedAt).length, xs.length), responseRate: pct(xs.filter((m) => m.respondedAt).length, xs.length), failRate: pct(xs.filter((m) => FAILED.has(m.status)).length, xs.length) }; }).filter((r) => r.sent >= 3);
      return {
        kpis: [
          { label: "Templates", value: new Set(rows.map((r) => r.template)).size },
          { label: "Avg open rate", value: round(avg(rows.map((r) => r.openRate))), format: "percent" },
          { label: "Avg response rate", value: round(avg(rows.map((r) => r.responseRate))), format: "percent", tone: "success" },
          { label: "Top template", value: [...rows].sort((a, b) => b.responseRate - a.responseRate)[0]?.template ?? "—", tone: "success" },
        ],
        charts: [{ kind: "bar", title: "Response rate by template", drillKey: "template", format: "percent", points: rows.map((r) => ({ label: r.template, value: r.responseRate, tone: "success" as const })).sort((a, b) => b.value - a.value).slice(0, 12) }],
        table: { columns: [{ key: "template", label: "Template" }, { key: "channel", label: "Channel" }, { key: "sent", label: "Sent", type: "number" }, { key: "openRate", label: "Open rate", type: "percent" }, { key: "responseRate", label: "Response rate", type: "percent" }, { key: "failRate", label: "Failure rate", type: "percent" }], rows, sort: { key: "responseRate", dir: "desc" } },
      };
    },
  },
  {
    slug: "communication-compliance",
    name: "Communication Compliance Report",
    description: "Quiet-hour violations, failed deliveries, restricted sends, and opt-out handling across all outbound messages.",
    section: "communication",
    spec: "§63.4 · §13",
    personas: [SA],
    owner: "Communications",
    definitions: [{ term: "Quiet hours", def: "SMS or voice sent before 08:00 or after 20:00 recipient local time." }],
    load(ds) {
      const out = ds.communications.filter((m) => m.direction === "outbound" && m.sentAt);
      const quiet = (m: (typeof out)[number]) => (m.channel === "SMS" || m.channel === "VOICE") && (m.sentAt!.getHours() < 8 || m.sentAt!.getHours() >= 20);
      const rows = out.filter((m) => quiet(m) || FAILED.has(m.status)).map((m) => ({ date: iso(m.sentAt), candidate: nameOf(ds, m.candidateId), channel: title(m.channel), subject: m.subject ?? "—", issue: quiet(m) ? "Quiet-hour send" : m.status === "bounced" ? "Bounced" : "Failed delivery", sentBy: m.sentBy ?? "—", action: quiet(m) ? "Review sequence timing" : "Verify contact info" }));
      return {
        kpis: [
          { label: "Outbound messages", value: out.length },
          { label: "Quiet-hour sends", value: rows.filter((r) => r.issue === "Quiet-hour send").length, tone: "danger" },
          { label: "Failed / bounced", value: rows.filter((r) => r.issue !== "Quiet-hour send").length, tone: "warning" },
          { label: "Compliance rate", value: pct(out.length - rows.filter((r) => r.issue === "Quiet-hour send").length, out.length), format: "percent", tone: "success" },
        ],
        charts: [{ kind: "bar", title: "Issues by type", drillKey: "issue", points: points(countBy(rows, (r) => r.issue), { tones: { "Quiet-hour send": "danger", Bounced: "warning", "Failed delivery": "warning" } }) }, { kind: "bar", title: "By sender", drillKey: "sentBy", points: points(countBy(rows, (r) => r.sentBy), { limit: 10 }) }],
        table: { columns: [{ key: "date", label: "Date", type: "date" }, { key: "candidate", label: "Recipient" }, { key: "channel", label: "Channel" }, { key: "subject", label: "Subject" }, { key: "issue", label: "Issue", type: "status" }, { key: "sentBy", label: "Sent by" }, { key: "action", label: "Action" }], rows, sort: { key: "date", dir: "desc" } },
      };
    },
  },
];

// ─────────────────────────────────────────────────────────
// AI & automation (§64)
// ─────────────────────────────────────────────────────────

const aiReports: ReportDef[] = [
  {
    slug: "ai-recommendations",
    name: "AI Recommendation Performance",
    description: "AI recommendations generated, accepted, rejected, and auto-executed — with human override rate by entity.",
    section: "ai",
    spec: "§64.1 · §51.13",
    personas: [SA, EX],
    owner: "AI Governance",
    definitions: [{ term: "Accepted", def: "AI-involved event later approved by a human (APPROVED action with AI involvement)." }],
    load(ds) {
      const ai = ds.auditEvents.filter((e) => e.aiInvolved || e.action === "AI_ACTION");
      const outcome = (e: (typeof ai)[number]) => (e.action === "APPROVED" ? "Accepted" : e.action === "REJECTED" ? "Rejected" : e.action === "OVERRIDDEN" ? "Overridden" : SYSTEM_ROLES.has(e.actorRole ?? "") ? "Auto-executed" : "Modified");
      const rows = ai.map((e) => ({ date: iso(e.timestamp), entity: e.entityType, label: e.entityLabel ?? "—", recommendation: e.newValue ?? e.reason ?? "—", actor: e.actor, outcome: outcome(e), critical: e.critical ? "High-risk" : "Standard" }));
      const decided = rows.filter((r) => ["Accepted", "Rejected", "Overridden"].includes(r.outcome));
      return {
        kpis: [
          { label: "AI recommendations (90d)", value: rows.length, tone: "ai" },
          { label: "Acceptance rate", value: pct(rows.filter((r) => r.outcome === "Accepted").length, decided.length), format: "percent", tone: "success" },
          { label: "Auto-executed", value: rows.filter((r) => r.outcome === "Auto-executed").length },
          { label: "Human overrides", value: rows.filter((r) => r.outcome === "Overridden").length, tone: "warning" },
          { label: "High-risk (human approved)", value: rows.filter((r) => r.critical === "High-risk").length, tone: "danger" },
        ],
        charts: [
          { kind: "bar", title: "Outcome", drillKey: "outcome", points: points(countBy(rows, (r) => r.outcome), { tones: { Accepted: "success", Rejected: "danger", Overridden: "warning", "Auto-executed": "ai", Modified: "info" } }) },
          { kind: "trend", title: "AI activity per week", points: weeklyTrend(ds, ai, (e) => e.timestamp, 12, "ai") },
          { kind: "bar", title: "By entity", drillKey: "entity", points: points(countBy(rows, (r) => r.entity), { tone: "ai" }) },
        ],
        table: { columns: [{ key: "date", label: "Date", type: "date" }, { key: "entity", label: "Entity" }, { key: "label", label: "Record" }, { key: "recommendation", label: "Recommendation / change" }, { key: "actor", label: "Actor" }, { key: "outcome", label: "Outcome", type: "status" }, { key: "critical", label: "Risk", type: "status" }], rows, sort: { key: "date", dir: "desc" } },
      };
    },
  },
  {
    slug: "ai-document-review",
    name: "AI Document Review Report",
    description: "Documents reviewed by Document Intelligence, issues detected, quality-score distribution, and human overrides.",
    section: "ai",
    spec: "§64.2 · §20",
    personas: [SA, ON],
    owner: "AI Governance",
    definitions: [{ term: "Possible false positive", def: "AI flagged an issue but a human approved the document." }],
    load(ds) {
      const reviewed = ds.documents.filter((d) => d.aiScore !== null && d.aiScore !== undefined);
      const flagged = reviewed.filter((d) => d.aiFlags.length);
      const rows = reviewed.map((d) => ({ document: d.name, candidate: nameOf(ds, d.candidateId), score: d.aiScore, band: (d.aiScore ?? 0) >= 90 ? "90–100" : (d.aiScore ?? 0) >= 75 ? "75–89" : (d.aiScore ?? 0) >= 60 ? "60–74" : "<60", flags: d.aiFlags.join(", ") || "—", finalStatus: title(d.status), agreement: d.aiFlags.length && d.status === "APPROVED" ? "Possible false positive" : !d.aiFlags.length && ["REJECTED", "CORRECTION_REQUIRED"].includes(d.status) ? "Possible false negative" : "Agreed" }));
      const flagCounts = new Map<string, number>();
      for (const d of flagged) for (const f of d.aiFlags) flagCounts.set(title(f), (flagCounts.get(title(f)) ?? 0) + 1);
      return {
        kpis: [
          { label: "Documents reviewed", value: reviewed.length, tone: "ai" },
          { label: "Issues detected", value: flagged.length, tone: "warning" },
          { label: "Avg quality score", value: round(avg(reviewed.map((d) => d.aiScore ?? 0))) },
          { label: "Human agreement", value: pct(rows.filter((r) => r.agreement === "Agreed").length, rows.length), format: "percent", tone: "success" },
          { label: "Est. hours saved", value: round((reviewed.length * 4) / 60), hint: "4 min per document" },
        ],
        charts: [
          { kind: "bar", title: "Issues detected", points: points(flagCounts, { tone: "ai" }) },
          { kind: "bar", title: "Quality score distribution", drillKey: "band", points: points(countBy(rows, (r) => r.band), { order: ["90–100", "75–89", "60–74", "<60"], tones: { "90–100": "success", "75–89": "info", "60–74": "warning", "<60": "danger" } }) },
          { kind: "bar", title: "AI vs human agreement", drillKey: "agreement", points: points(countBy(rows, (r) => r.agreement), { tones: { Agreed: "success", "Possible false positive": "warning", "Possible false negative": "danger" } }) },
        ],
        table: { columns: [{ key: "document", label: "Document" }, { key: "candidate", label: "Candidate" }, { key: "score", label: "AI score", type: "number" }, { key: "band", label: "Band" }, { key: "flags", label: "Flags" }, { key: "finalStatus", label: "Final status", type: "status" }, { key: "agreement", label: "Agreement", type: "status" }], rows, sort: { key: "score", dir: "asc" } },
      };
    },
  },
  {
    slug: "ai-nudge-performance",
    name: "AI Nudge Performance Report",
    description: "AI-generated nudges vs staff and automation: response, completion, escalation avoided, by channel.",
    section: "ai",
    spec: "§64.3",
    personas: [SA, ON],
    owner: "AI Governance",
    load(ds) {
      const nudges = ds.communications.filter((m) => m.nudgeLevel !== null && m.nudgeLevel !== undefined);
      const src = (m: (typeof nudges)[number]) => (m.sentBy === "AI Concierge" ? "AI Concierge" : m.sentBy === "Automation" ? "Automation" : "Staff");
      const rows = ["AI Concierge", "Automation", "Staff"].map((s) => { const xs = nudges.filter((m) => src(m) === s); const resp = xs.filter((m) => m.respondedAt); return { source: s, nudges: xs.length, responseRate: pct(resp.length, xs.length), avgLevel: round(avg(xs.map((m) => m.nudgeLevel ?? 0))), escalationAvoided: resp.filter((m) => (m.nudgeLevel ?? 0) <= 3).length, failed: xs.filter((m) => FAILED.has(m.status)).length }; });
      return {
        kpis: [
          { label: "AI nudges", value: rows[0].nudges, tone: "ai" },
          { label: "AI response rate", value: rows[0].responseRate, format: "percent", tone: "success" },
          { label: "Staff response rate", value: rows[2].responseRate, format: "percent" },
          { label: "Escalations avoided", value: sum(rows.map((r) => r.escalationAvoided)), tone: "success" },
        ],
        charts: [{ kind: "bar", title: "Response rate by source", drillKey: "source", format: "percent", points: rows.map((r) => ({ label: r.source, value: r.responseRate, tone: r.source === "AI Concierge" ? ("ai" as const) : ("info" as const) })) }],
        table: { columns: [{ key: "source", label: "Source" }, { key: "nudges", label: "Nudges", type: "number" }, { key: "responseRate", label: "Response rate", type: "percent" }, { key: "avgLevel", label: "Avg level", type: "number" }, { key: "escalationAvoided", label: "Escalation avoided", type: "number" }, { key: "failed", label: "Failed", type: "number" }], rows },
      };
    },
  },
  {
    slug: "ai-governance",
    name: "AI Risk & Governance Report",
    description: "High-risk AI activity, human approval rate, model and prompt events, and client-restricted AI usage.",
    section: "ai",
    spec: "§64.6 · §11",
    personas: [SA, EX],
    owner: "AI Governance",
    restricted: true,
    load(ds) {
      const ai = ds.auditEvents.filter((e) => e.aiInvolved || e.action === "AI_ACTION");
      const high = ai.filter((e) => e.critical);
      const humanApproved = high.filter((e) => !SYSTEM_ROLES.has(e.actorRole ?? ""));
      const rows = high.map((e) => ({ date: iso(e.timestamp), action: title(e.action), entity: e.entityType, record: e.entityLabel ?? "—", actor: e.actor, role: e.actorRole ?? "—", human: SYSTEM_ROLES.has(e.actorRole ?? "") ? "Missing" : "Approved", source: e.sourceSystem ?? "—" }));
      return {
        kpis: [
          { label: "AI events (90d)", value: ai.length, tone: "ai" },
          { label: "High-risk AI events", value: high.length, tone: "warning" },
          { label: "Human approval rate", value: pct(humanApproved.length, high.length), format: "percent", tone: "success" },
          { label: "Policy violations", value: rows.filter((r) => r.human === "Missing").length, tone: "danger" },
        ],
        charts: [{ kind: "bar", title: "High-risk AI events by entity", drillKey: "entity", points: points(countBy(rows, (r) => r.entity), { tone: "ai" }) }, { kind: "bar", title: "By source system", drillKey: "source", points: points(countBy(rows, (r) => r.source)) }],
        table: { columns: [{ key: "date", label: "Date", type: "date" }, { key: "action", label: "Action" }, { key: "entity", label: "Entity" }, { key: "record", label: "Record" }, { key: "actor", label: "Actor" }, { key: "role", label: "Role" }, { key: "human", label: "Human approval", type: "status" }, { key: "source", label: "Source" }], rows, sort: { key: "date", dir: "desc" } },
        notes: ["High-risk actions (eligibility, adverse action, waivers, rate changes) must never complete without a human approver (§11)."],
      };
    },
  },
];

// ─────────────────────────────────────────────────────────
// Integrations (§65)
// ─────────────────────────────────────────────────────────

const integrationReports: ReportDef[] = [
  {
    slug: "integration-health",
    name: "Integration Health Report",
    description: "Every connector's status, last sync, success and failure rate, latency, auth expiration, and queue backlog.",
    section: "integration",
    spec: "§65.1 · §84",
    personas: [SA],
    owner: "Integration Hub",
    dateScope: "none",
    load(ds) {
      const rows = ds.integrations.map((i) => { const ev = ds.integrationEvents.filter((e) => e.integrationId === i.id); return { connector: i.name, vendor: i.vendor, category: title(i.category), status: title(i.status), criticality: title(i.criticality), lastSync: iso(i.lastSync), successRate: i.successRate, failures14d: ev.filter((e) => e.status !== "success").length, latency: i.avgLatencyMs, queue: i.queueDepth, authExpires: iso(i.authExpires), authDays: daysUntil(ds, i.authExpires), owner: i.owner ?? "—" }; });
      return {
        kpis: [
          { label: "Connectors", value: rows.length },
          { label: "Healthy", value: rows.filter((r) => r.status === "Connected").length, tone: "success" },
          { label: "Degraded / error", value: rows.filter((r) => ["Degraded", "Error"].includes(r.status)).length, tone: "danger" },
          { label: "Auth expiring ≤14d", value: rows.filter((r) => r.authDays !== null && r.authDays <= 14).length, tone: "warning" },
          { label: "Queue backlog", value: sum(rows.map((r) => r.queue)), tone: "info" },
        ],
        charts: [{ kind: "bar", title: "Failures (14d) by connector", drillKey: "connector", points: rows.map((r) => ({ label: r.connector, value: r.failures14d, tone: "danger" as const })).sort((a, b) => b.value - a.value).slice(0, 12) }, { kind: "bar", title: "By category", drillKey: "category", points: points(countBy(rows, (r) => r.category), { tone: "ai" }) }],
        table: { columns: [{ key: "connector", label: "Connector" }, { key: "category", label: "Category" }, { key: "status", label: "Status", type: "status" }, { key: "criticality", label: "Criticality" }, { key: "lastSync", label: "Last sync", type: "date" }, { key: "successRate", label: "Success", type: "percent" }, { key: "failures14d", label: "Failures 14d", type: "number" }, { key: "latency", label: "Latency (ms)", type: "number" }, { key: "queue", label: "Queue", type: "number" }, { key: "authExpires", label: "Auth expires", type: "date" }, { key: "owner", label: "Owner" }], rows, sort: { key: "failures14d", dir: "desc" } },
      };
    },
  },
  {
    slug: "failed-records",
    name: "Failed Record Report",
    description: "Every failed or retrying integration transaction with error, retry count, age, correlation ID, and business impact.",
    section: "integration",
    spec: "§65.2 · §83",
    personas: [SA],
    owner: "Integration Hub",
    load(ds) {
      const failed = ds.integrationEvents.filter((e) => e.status === "failed" || e.status === "retrying" || e.status === "partial");
      const rows = failed.map((e) => ({ time: iso(e.timestamp), connector: e.integration.name, direction: title(e.direction), event: e.eventType, status: title(e.status), error: e.errorCode ?? "—", message: e.errorMessage ?? "—", retries: e.retryCount, records: e.recordCount, age: ageDays(ds, e.timestamp), correlation: e.correlationId ?? "—", impact: /PAYROLL|SCREENING|VMS/.test(e.integration.category) ? "High" : "Medium" }));
      return {
        kpis: [
          { label: "Failed / retrying", value: rows.length, tone: "danger" },
          { label: "Records affected", value: sum(rows.map((r) => r.records)), tone: "warning" },
          { label: "High-impact", value: rows.filter((r) => r.impact === "High").length, tone: "danger" },
          { label: "Avg retries", value: round(avg(rows.map((r) => r.retries))) },
        ],
        charts: [{ kind: "bar", title: "By error code", drillKey: "error", points: points(countBy(rows, (r) => r.error), { tone: "danger" }) }, { kind: "bar", title: "By connector", drillKey: "connector", points: points(countBy(rows, (r) => r.connector), { tone: "warning", limit: 12 }) }],
        table: { columns: [{ key: "time", label: "Time", type: "date" }, { key: "connector", label: "Connector" }, { key: "direction", label: "Direction" }, { key: "event", label: "Event" }, { key: "status", label: "Status", type: "status" }, { key: "error", label: "Error" }, { key: "message", label: "Message" }, { key: "retries", label: "Retries", type: "number" }, { key: "records", label: "Records", type: "number" }, { key: "correlation", label: "Correlation ID" }, { key: "impact", label: "Impact", type: "status" }], rows, sort: { key: "time", dir: "desc" } },
      };
    },
  },
  {
    slug: "api-usage",
    name: "API & Webhook Activity Report",
    description: "Integration calls by connector, event type, and day with success, failure, latency, and data volume.",
    section: "integration",
    spec: "§65.4 · §65.5",
    personas: [SA],
    owner: "Integration Hub",
    load(ds) {
      const ev = ds.integrationEvents;
      const keys = countBy(ev, (e) => `${e.integration.name}|${e.eventType}`);
      const rows = [...keys.keys()].map((k) => { const [conn, type] = k.split("|"); const xs = ev.filter((e) => e.integration.name === conn && e.eventType === type); return { connector: conn, event: type, calls: xs.length, success: pct(xs.filter((e) => e.status === "success").length, xs.length), avgLatency: Math.round(avg(xs.map((e) => e.latencyMs))), records: sum(xs.map((e) => e.recordCount)), rateLimited: xs.filter((e) => e.errorCode === "RATE_LIMIT_429").length }; });
      return {
        kpis: [
          { label: "Calls (14d)", value: ev.length },
          { label: "Success rate", value: pct(ev.filter((e) => e.status === "success").length, ev.length, 2), format: "percent", tone: "success" },
          { label: "Records moved", value: sum(ev.map((e) => e.recordCount)) },
          { label: "Rate-limited", value: ev.filter((e) => e.errorCode === "RATE_LIMIT_429").length, tone: "warning" },
          { label: "Avg latency", value: `${Math.round(avg(ev.map((e) => e.latencyMs)))} ms` },
        ],
        charts: [{ kind: "trend", title: "Calls per day", points: Array.from({ length: 14 }, (_, k) => { const day = new Date(ds.now.getTime() - (13 - k) * 86_400_000); const key = iso(day); return { label: day.toLocaleString("en-US", { month: "short", day: "numeric" }), value: ev.filter((e) => iso(e.timestamp) === key).length, tone: "info" as const }; }) }, { kind: "bar", title: "Calls by connector", drillKey: "connector", points: points(countBy(ev, (e) => e.integration.name), { limit: 12 }) }],
        table: { columns: [{ key: "connector", label: "Connector" }, { key: "event", label: "Event" }, { key: "calls", label: "Calls", type: "number" }, { key: "success", label: "Success", type: "percent" }, { key: "avgLatency", label: "Avg latency (ms)", type: "number" }, { key: "records", label: "Records", type: "number" }, { key: "rateLimited", label: "Rate-limited", type: "number" }], rows, sort: { key: "calls", dir: "desc" } },
      };
    },
  },
  {
    slug: "data-reconciliation",
    name: "Data Reconciliation & Duplicates",
    description: "Cross-system mismatches: duplicates, missing worker IDs, start-date and rate differences, and screening status drift.",
    section: "integration",
    spec: "§65.3 · §65.6 · §91",
    personas: [SA],
    owner: "Data Governance",
    load(ds) {
      const rows: { type: string; record: string; systems: string; detail: string; resolution: string }[] = [];
      for (const e of ds.integrationEvents.filter((e) => e.errorCode === "DUPLICATE_409" || e.errorCode === "MAPPING_ERR")) rows.push({ type: e.errorCode === "DUPLICATE_409" ? "Duplicate record" : "Field mapping conflict", record: e.correlationId ?? e.id, systems: `HireMe ↔ ${e.integration.name}`, detail: e.errorMessage ?? e.eventType, resolution: "Assign for review" });
      for (const e of ds.exceptions.filter((e) => /duplicate/i.test(e.category))) rows.push({ type: "Duplicate profile", record: nameOf(ds, e.candidateId), systems: "ATS ↔ HireMe", detail: e.title, resolution: e.resolvedAt ? "Merged" : "Merge pending" });
      for (const c of ds.candidates.filter((c) => c.status === "PLACED" && c.billing && !c.billing.vmsWorkerId && ds.clients.find((x) => x.name === c.clientName)?.msp)) rows.push({ type: "Missing VMS worker ID", record: fullName(c), systems: "HireMe ↔ VMS", detail: `${c.clientName} uses ${ds.clients.find((x) => x.name === c.clientName)?.msp}`, resolution: "Re-sync" });
      for (const a of ds.assignments.filter((a) => a.candidateId && a.startDate)) { const c = ds.candById.get(a.candidateId!); if (c?.startDate && Math.abs(c.startDate.getTime() - a.startDate!.getTime()) > 86_400_000) rows.push({ type: "Start-date mismatch", record: fullName(c), systems: "ATS ↔ HireMe", detail: `ATS ${iso(a.startDate)} vs HireMe ${iso(c.startDate)}`, resolution: "Accept source value" }); }
      return {
        kpis: [
          { label: "Mismatches", value: rows.length, tone: "warning" },
          { label: "Duplicates", value: rows.filter((r) => /duplicate/i.test(r.type)).length, tone: "danger" },
          { label: "Missing VMS IDs", value: rows.filter((r) => r.type === "Missing VMS worker ID").length },
          { label: "Mapping conflicts", value: rows.filter((r) => r.type === "Field mapping conflict").length },
        ],
        charts: [{ kind: "bar", title: "Mismatches by type", drillKey: "type", points: points(countBy(rows, (r) => r.type), { tone: "warning" }) }],
        table: { columns: [{ key: "type", label: "Type" }, { key: "record", label: "Record" }, { key: "systems", label: "Systems" }, { key: "detail", label: "Detail" }, { key: "resolution", label: "Suggested resolution" }], rows },
      };
    },
  },
];

// ─────────────────────────────────────────────────────────
// Audit, security & privacy (§66)
// ─────────────────────────────────────────────────────────

const afterHours = (d: Date) => d.getHours() < 7 || d.getHours() >= 19 || d.getDay() === 0 || d.getDay() === 6;

const auditReports: ReportDef[] = [
  {
    slug: "audit-activity",
    name: "Audit Activity Report",
    description: "Changes by user and entity: overrides, deletions, exports, permission changes, AI actions, and integration writes.",
    section: "audit",
    spec: "§51.12 · §26",
    personas: [SA],
    owner: "Security & Compliance",
    load(ds) {
      const ev = ds.auditEvents;
      const rows = ev.map((e) => ({ time: iso(e.timestamp), action: title(e.action), entity: e.entityType, record: e.entityLabel ?? e.entityId ?? "—", actor: e.actor, role: e.actorRole ?? "—", previous: e.previousValue ?? "—", next: e.newValue ?? "—", reason: e.reason ?? "—", ai: e.aiInvolved ? "Yes" : "No", critical: e.critical ? "Critical" : "Standard", source: e.sourceSystem ?? "—" }));
      return {
        kpis: [
          { label: "Audit events (90d)", value: ev.length },
          { label: "Critical", value: ev.filter((e) => e.critical).length, tone: "danger" },
          { label: "Overrides", value: ev.filter((e) => e.action === "OVERRIDDEN").length, tone: "warning" },
          { label: "Deletions", value: ev.filter((e) => e.action === "DELETED").length, tone: "danger" },
          { label: "AI-involved", value: ev.filter((e) => e.aiInvolved).length, tone: "ai" },
          { label: "After hours", value: ev.filter((e) => afterHours(e.timestamp)).length },
        ],
        charts: [
          { kind: "bar", title: "By action", drillKey: "action", points: points(countBy(rows, (r) => r.action)) },
          { kind: "bar", title: "By entity", drillKey: "entity", points: points(countBy(rows, (r) => r.entity), { tone: "ai" }) },
          { kind: "trend", title: "Events per week", points: weeklyTrend(ds, ev, (e) => e.timestamp, 12) },
        ],
        table: { columns: [{ key: "time", label: "Date", type: "date" }, { key: "action", label: "Action" }, { key: "entity", label: "Entity" }, { key: "record", label: "Record" }, { key: "actor", label: "Actor" }, { key: "role", label: "Role" }, { key: "previous", label: "Previous" }, { key: "next", label: "New" }, { key: "reason", label: "Reason" }, { key: "ai", label: "AI" }, { key: "critical", label: "Severity", type: "status" }], rows, sort: { key: "time", dir: "desc" } },
      };
    },
  },
  {
    slug: "privileged-activity",
    name: "Privileged Activity Report",
    description: "Admin actions, permission changes, overrides, exports, deletions, and after-hours privileged activity.",
    section: "audit",
    spec: "§66.1",
    personas: [SA],
    owner: "Security & Compliance",
    restricted: true,
    load(ds) {
      const ev = ds.auditEvents.filter((e) => e.critical || e.actorRole === "super-admin" || e.entityType === "User");
      const rows = ev.map((e) => ({ time: iso(e.timestamp), actor: e.actor, role: e.actorRole ?? "—", action: title(e.action), entity: e.entityType, record: e.entityLabel ?? "—", change: e.newValue ?? "—", afterHours: afterHours(e.timestamp) ? "After hours" : "Business hours", ip: e.ipAddress ?? "—" }));
      return {
        kpis: [
          { label: "Privileged events", value: rows.length },
          { label: "After hours", value: rows.filter((r) => r.afterHours === "After hours").length, tone: "danger" },
          { label: "Permission changes", value: rows.filter((r) => r.entity === "User").length, tone: "warning" },
          { label: "Distinct actors", value: new Set(rows.map((r) => r.actor)).size },
        ],
        charts: [{ kind: "bar", title: "By actor", drillKey: "actor", points: points(countBy(rows, (r) => r.actor), { limit: 12 }) }, { kind: "bar", title: "Business vs after hours", drillKey: "afterHours", points: points(countBy(rows, (r) => r.afterHours), { tones: { "After hours": "danger", "Business hours": "success" } }) }],
        table: { columns: [{ key: "time", label: "Date", type: "date" }, { key: "actor", label: "Actor" }, { key: "role", label: "Role" }, { key: "action", label: "Action" }, { key: "entity", label: "Entity" }, { key: "record", label: "Record" }, { key: "change", label: "Change" }, { key: "afterHours", label: "Timing", type: "status" }, { key: "ip", label: "IP" }], rows, sort: { key: "time", dir: "desc" } },
      };
    },
  },
  {
    slug: "data-exports",
    name: "Data Export Report",
    description: "Every export: user, report, record count, sensitivity, approval, and destination.",
    section: "audit",
    spec: "§66.3",
    personas: [SA],
    owner: "Security & Compliance",
    restricted: true,
    load(ds) {
      const ex = ds.auditEvents.filter((e) => e.action === "EXPORTED");
      const rows = ex.map((e) => ({ time: iso(e.timestamp), user: e.actor, role: e.actorRole ?? "—", report: e.entityLabel ?? e.entityType, records: Number((e.newValue ?? "").match(/\d+/)?.[0] ?? 0) || null, sensitivity: /ssn|pay|bank|screen|salary|rate/i.test(`${e.entityLabel ?? ""} ${e.newValue ?? ""}`) ? "Sensitive" : "Internal", approval: e.reason ? "Approved" : "Not required", destination: e.sourceSystem === "hireme" ? "Download (CSV)" : (e.sourceSystem ?? "Download") }));
      return {
        kpis: [
          { label: "Exports (90d)", value: rows.length },
          { label: "Sensitive exports", value: rows.filter((r) => r.sensitivity === "Sensitive").length, tone: "danger" },
          { label: "Exporting users", value: new Set(rows.map((r) => r.user)).size },
          { label: "Records exported", value: sum(rows.map((r) => r.records ?? 0)) },
        ],
        charts: [{ kind: "bar", title: "Exports by user", drillKey: "user", points: points(countBy(rows, (r) => r.user)) }, { kind: "trend", title: "Exports per month", points: monthlyTrend(ds, ex, (e) => e.timestamp, 4) }],
        table: { columns: [{ key: "time", label: "Date", type: "date" }, { key: "user", label: "User" }, { key: "role", label: "Role" }, { key: "report", label: "Report / dataset" }, { key: "records", label: "Records", type: "number" }, { key: "sensitivity", label: "Sensitivity", type: "status" }, { key: "approval", label: "Approval", type: "status" }, { key: "destination", label: "Destination" }], rows, sort: { key: "time", dir: "desc" } },
      };
    },
  },
  {
    slug: "sensitive-data-access",
    name: "Sensitive Data Access Report",
    description: "Access and changes to screening, payroll, identity, and document records by user, with reason and client.",
    section: "audit",
    spec: "§66.2",
    personas: [SA],
    owner: "Security & Compliance",
    restricted: true,
    load(ds) {
      const ev = ds.auditEvents.filter((e) => e.documentId || /screen|payroll|bank|ssn|i-9|identity|rate/i.test(`${e.entityType} ${e.entityLabel ?? ""} ${e.newValue ?? ""}`));
      const rows = ev.map((e) => ({ time: iso(e.timestamp), user: e.actor, role: e.actorRole ?? "—", record: e.entityLabel ?? e.entityType, field: e.entityType, action: title(e.action), reason: e.reason ?? "—", client: e.clientId ? ds.clientById.get(e.clientId)?.name ?? "—" : clientOf(ds, e.candidateId) }));
      return {
        kpis: [
          { label: "Sensitive accesses", value: rows.length },
          { label: "Without reason", value: rows.filter((r) => r.reason === "—").length, tone: "warning" },
          { label: "Users", value: new Set(rows.map((r) => r.user)).size },
        ],
        charts: [{ kind: "bar", title: "By user", drillKey: "user", points: points(countBy(rows, (r) => r.user), { limit: 12 }) }],
        table: { columns: [{ key: "time", label: "Date", type: "date" }, { key: "user", label: "User" }, { key: "role", label: "Role" }, { key: "record", label: "Record" }, { key: "field", label: "Entity" }, { key: "action", label: "Action" }, { key: "reason", label: "Reason" }, { key: "client", label: "Client" }], rows, sort: { key: "time", dir: "desc" } },
      };
    },
  },
];

export const platformReports: ReportDef[] = [...candidateReports, ...commsReports, ...aiReports, ...integrationReports, ...auditReports];
