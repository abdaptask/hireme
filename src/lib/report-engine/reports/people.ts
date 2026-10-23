/**
 * Team reports: Onboarder (§53), Recruiter (§54), Recruiting Manager (§55).
 */

import type { ReportDef, Row } from "../types";
import {
  AGING_BUCKETS,
  AGING_ORDER,
  DROPPED_STATUSES,
  ageDays,
  avg,
  bucket,
  countBy,
  daysBetween,
  daysUntil,
  employment,
  forwardWeeks,
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
  recommendedAction,
  round,
  sum,
  title,
} from "../helpers";
import type { Dataset, DsCandidate } from "../dataset";
import { OPEN_EXC, dropReason, slaState } from "./operational";

const ON = "onboarder" as const;
const RC = "recruiter" as const;
const RM = "recruiting-manager" as const;
const SA = "super-admin" as const;

/** Complexity weight for weighted workload (§36): C2C/1099 + risk + open items. */
function weight(ds: Dataset, c: DsCandidate): number {
  let w = 1;
  if (c.employmentType === "C2C" || c.employmentType === "INDEPENDENT_1099") w += 0.3;
  if (c.risk === "AT_RISK" || c.risk === "UNLIKELY") w += 0.5;
  else if (c.risk === "NEEDS_ATTENTION") w += 0.25;
  w += Math.min(1, readiness(ds, c).openDocs.length * 0.1);
  return w;
}

function staff(ds: Dataset, key: "recruiter" | "onboarder"): string[] {
  return [...new Set(ds.candidates.map((c) => c[key]).filter((x): x is string => !!x))].sort();
}

/** Funnel stage a candidate has reached (§54.1). */
function funnelStage(ds: Dataset, c: DsCandidate): string {
  if (DROPPED_STATUSES.has(c.status)) return "Dropped Off";
  if (c.status === "PLACED") return "Fully Onboarded";
  if (c.status === "NEW") return "Offer Accepted";
  const r = readiness(ds, c);
  if (r.compliance && r.payroll && r.billing) return "Ready to Start";
  if (r.screening === "Clear") return "Client Approved";
  if (r.screening !== "Not ordered") return "Screening Started";
  if (r.docs.length && r.docs.some((d) => d.uploadedAt)) return "Documents Submitted";
  if (c.status === "ONBOARDING") return "Onboarding Started";
  return "Offer Accepted";
}

const FUNNEL = ["Offer Accepted", "Onboarding Started", "Documents Submitted", "Screening Started", "Client Approved", "Ready to Start", "Fully Onboarded"];
const REACHED = (stage: string) => (stage === "Dropped Off" ? -1 : FUNNEL.indexOf(stage));

function timeToOnboard(c: DsCandidate): number | null {
  return c.status === "PLACED" && c.startDate ? Math.max(1, daysBetween(c.createdAt, c.startDate)) : null;
}

export const peopleReports: ReportDef[] = [
  // ── Onboarder (§53) ─────────────────────────────────────
  {
    slug: "onboarding-workload",
    name: "Active Onboarding Workload",
    description: "Active candidates, tasks due, overdue items, at-risk starts, and weighted workload for each onboarder.",
    section: "onboarder",
    spec: "§53.1 · §36",
    personas: [ON, RM, SA],
    owner: "HR Operations",
    definitions: [{ term: "Weighted workload", def: "Sum of case weights: base 1.0, +0.3 C2C/1099, +0.25–0.5 for risk, +0.1 per open document (max +1)." }],
    load(ds) {
      const active = ds.candidates.filter(isActive);
      const rows = staff(ds, "onboarder").map((o) => {
        const mine = active.filter((c) => c.onboarder === o);
        const docs = mine.flatMap((c) => readiness(ds, c).openDocs);
        return {
          onboarder: o,
          active: mine.length,
          dueToday: docs.filter((d) => d.status === "SUBMITTED" || d.status === "AI_REVIEW").length,
          overdue: ds.exceptions.filter((e) => e.owner === o && slaState(ds, e) === "Breached" && OPEN_EXC.has(e.status)).length,
          atRisk: mine.filter((c) => c.risk === "AT_RISK" || c.risk === "UNLIKELY").length,
          waitingReview: mine.filter((c) => readiness(ds, c).docs.some((d) => d.status === "SUBMITTED" || d.status === "AI_REVIEW")).length,
          waitingExternal: mine.filter((c) => ["In Progress", "Vendor Delayed"].includes(readiness(ds, c).screening)).length,
          weighted: round(sum(mine.map((c) => weight(ds, c)))),
        };
      });
      return {
        kpis: [
          { label: "Active candidates", value: active.length },
          { label: "Reviews waiting", value: sum(rows.map((r) => r.dueToday)), tone: "info" },
          { label: "Overdue items", value: sum(rows.map((r) => r.overdue)), tone: "danger" },
          { label: "At risk", value: sum(rows.map((r) => r.atRisk)), tone: "danger" },
          { label: "Avg weighted load", value: round(avg(rows.map((r) => r.weighted))) },
        ],
        charts: [
          { kind: "bar", title: "Weighted workload by onboarder", drillKey: "onboarder", points: rows.map((r) => ({ label: r.onboarder, value: r.weighted, tone: r.weighted > avg(rows.map((x) => x.weighted)) * 1.25 ? ("warning" as const) : ("info" as const) })).sort((a, b) => b.value - a.value) },
          {
            kind: "stacked",
            title: "Case mix by onboarder",
            drillKey: "onboarder",
            segments: [
              { key: "onTrack", label: "On track", tone: "success" },
              { key: "attention", label: "Needs attention", tone: "warning" },
              { key: "risk", label: "At risk", tone: "danger" },
            ],
            rows: rows.map((r) => {
              const mine = active.filter((c) => c.onboarder === r.onboarder);
              return { label: r.onboarder, values: { onTrack: mine.filter((c) => c.risk === "ON_TRACK").length, attention: mine.filter((c) => c.risk === "NEEDS_ATTENTION").length, risk: r.atRisk } };
            }),
          },
        ],
        table: {
          columns: [
            { key: "onboarder", label: "Onboarder" },
            { key: "active", label: "Active", type: "number" },
            { key: "dueToday", label: "Reviews due", type: "number" },
            { key: "overdue", label: "Overdue", type: "number" },
            { key: "atRisk", label: "At risk", type: "number" },
            { key: "waitingReview", label: "Waiting on review", type: "number" },
            { key: "waitingExternal", label: "Waiting external", type: "number" },
            { key: "weighted", label: "Weighted load", type: "number" },
          ],
          rows,
          sort: { key: "weighted", dir: "desc" },
        },
      };
    },
  },
  {
    slug: "document-review-queue",
    name: "Document Review Queue",
    description: "Every document awaiting review with SLA countdown, AI quality score, and assigned reviewer.",
    section: "onboarder",
    spec: "§53.2",
    personas: [ON, SA],
    owner: "HR Operations",
    definitions: [{ term: "Review SLA", def: "24 hours from upload for submitted documents." }],
    load(ds) {
      const q = ds.documents.filter((d) => ["SUBMITTED", "AI_REVIEW", "CORRECTION_REQUIRED"].includes(d.status));
      const rows = q.map((d) => {
        const up = d.uploadedAt ?? d.createdAt;
        const hoursLeft = Math.round((up.getTime() + 24 * 3_600_000 - ds.now.getTime()) / 3_600_000);
        const c = d.candidateId ? ds.candById.get(d.candidateId) : undefined;
        return {
          document: d.name,
          type: d.category,
          candidate: nameOf(ds, d.candidateId),
          client: clientOf(ds, d.candidateId),
          status: title(d.status),
          submitted: iso(up),
          slaHours: hoursLeft,
          sla: hoursLeft < 0 ? "Breached" : hoursLeft < 6 ? "Due soon" : "Within SLA",
          aiScore: d.aiScore,
          flags: d.aiFlags.join(", ") || "—",
          reviewer: c?.onboarder ?? "Unassigned",
        };
      });
      return {
        kpis: [
          { label: "Awaiting review", value: rows.length, tone: "info" },
          { label: "SLA breached", value: rows.filter((r) => r.sla === "Breached").length, tone: "danger" },
          { label: "Due < 6h", value: rows.filter((r) => r.sla === "Due soon").length, tone: "warning" },
          { label: "Avg AI score", value: round(avg(rows.map((r) => r.aiScore ?? 0).filter(Boolean))) },
          { label: "AI-flagged", value: rows.filter((r) => r.flags !== "—").length, tone: "ai" },
        ],
        charts: [
          { kind: "bar", title: "Queue by reviewer", drillKey: "reviewer", points: points(countBy(rows, (r) => r.reviewer)) },
          { kind: "bar", title: "Queue by document type", drillKey: "type", points: points(countBy(rows, (r) => r.type), { tone: "ai" }) },
          { kind: "bar", title: "SLA state", drillKey: "sla", points: points(countBy(rows, (r) => r.sla), { tones: { Breached: "danger", "Due soon": "warning", "Within SLA": "success" } }) },
        ],
        table: {
          columns: [
            { key: "document", label: "Document" },
            { key: "type", label: "Type" },
            { key: "candidate", label: "Candidate" },
            { key: "client", label: "Client" },
            { key: "status", label: "Status", type: "status" },
            { key: "submitted", label: "Submitted", type: "date" },
            { key: "slaHours", label: "SLA (hrs left)", type: "number" },
            { key: "sla", label: "SLA", type: "status" },
            { key: "aiScore", label: "AI score", type: "number" },
            { key: "flags", label: "AI flags" },
            { key: "reviewer", label: "Reviewer" },
          ],
          rows,
          sort: { key: "slaHours", dir: "asc" },
        },
      };
    },
  },
  {
    slug: "candidate-aging",
    name: "Candidate Aging Report",
    description: "Active candidates bucketed by days in process, broken down by stage, client, recruiter, onboarder, and employment type.",
    section: "onboarder",
    spec: "§53.3",
    personas: [ON, RM, SA],
    owner: "HR Operations",
    load(ds) {
      const active = ds.candidates.filter(isActive);
      const rows = active.map((c) => {
        const age = ageDays(ds, c.createdAt) ?? 0;
        return { candidate: fullName(c), bucket: bucket(age, AGING_BUCKETS), age, stage: c.stage ?? "—", client: c.clientName ?? "—", recruiter: c.recruiter ?? "—", onboarder: c.onboarder ?? "—", employment: employment(c.employmentType), risk: title(c.risk) };
      });
      const segs = AGING_ORDER.map((b, i) => ({ key: b, label: b, tone: (["success", "success", "info", "warning", "warning", "danger"] as const)[i] }));
      const stacked = (dim: "stage" | "onboarder") =>
        [...countBy(rows, (r) => r[dim]).keys()].map((k) => ({ label: k, values: Object.fromEntries(AGING_ORDER.map((b) => [b, rows.filter((r) => r[dim] === k && r.bucket === b).length])) }));
      return {
        kpis: [
          { label: "Active candidates", value: rows.length },
          { label: "Median age", value: median(rows.map((r) => r.age)), format: "days" },
          { label: "8–14 days", value: rows.filter((r) => r.bucket === "8–14 days").length, tone: "warning" },
          { label: "15+ days", value: rows.filter((r) => r.bucket === "15+ days").length, tone: "danger" },
        ],
        charts: [
          { kind: "bar", title: "Aging buckets", drillKey: "bucket", points: points(countBy(rows, (r) => r.bucket), { order: AGING_ORDER, tone: "info" }) },
          { kind: "stacked", title: "Aging by stage", drillKey: "stage", segments: segs, rows: stacked("stage") },
          { kind: "stacked", title: "Aging by onboarder", drillKey: "onboarder", segments: segs, rows: stacked("onboarder") },
        ],
        table: {
          columns: [
            { key: "candidate", label: "Candidate" },
            { key: "age", label: "Age", type: "days" },
            { key: "bucket", label: "Bucket" },
            { key: "stage", label: "Stage" },
            { key: "client", label: "Client" },
            { key: "recruiter", label: "Recruiter" },
            { key: "onboarder", label: "Onboarder" },
            { key: "employment", label: "Employment" },
            { key: "risk", label: "Risk", type: "status" },
          ],
          rows,
          sort: { key: "age", dir: "desc" },
        },
      };
    },
  },
  {
    slug: "onboarder-productivity",
    name: "Onboarder Productivity Report",
    description: "Completions, documents reviewed, first-pass approval, rework, SLA compliance, and escalations per onboarder.",
    section: "onboarder",
    spec: "§53.4",
    personas: [ON, RM, SA],
    owner: "HR Operations",
    definitions: [{ term: "First-pass approval", def: "Reviewed documents approved without a rejection or correction request." }],
    load(ds) {
      const rows = staff(ds, "onboarder").map((o) => {
        const reviewed = ds.documents.filter((d) => d.reviewedBy === o);
        const approved = reviewed.filter((d) => d.status === "APPROVED").length;
        const reworked = reviewed.filter((d) => ["REJECTED", "CORRECTION_REQUIRED"].includes(d.status)).length;
        const ex = ds.exceptions.filter((e) => e.owner === o && e.resolutionDeadline);
        const breached = ex.filter((e) => slaState(ds, e) === "Breached").length;
        const reviewHrs = reviewed.filter((d) => d.reviewedAt && d.uploadedAt).map((d) => (d.reviewedAt!.getTime() - d.uploadedAt!.getTime()) / 3_600_000);
        return {
          onboarder: o,
          completed: ds.candidates.filter((c) => c.onboarder === o && c.status === "PLACED").length,
          reviewed: reviewed.length,
          avgReviewHrs: round(avg(reviewHrs.filter((h) => h >= 0))),
          firstPass: pct(approved, reviewed.length),
          rework: pct(reworked, reviewed.length),
          sla: pct(ex.length - breached, ex.length),
          escalations: ds.auditEvents.filter((e) => e.actor === o && e.action === "ESCALATED").length,
        };
      });
      return {
        kpis: [
          { label: "Candidates completed", value: sum(rows.map((r) => r.completed)), tone: "success" },
          { label: "Documents reviewed", value: sum(rows.map((r) => r.reviewed)) },
          { label: "Avg first-pass approval", value: round(avg(rows.map((r) => r.firstPass))), format: "percent" },
          { label: "Avg review time", value: `${round(avg(rows.map((r) => r.avgReviewHrs)))} h` },
          { label: "Avg SLA compliance", value: round(avg(rows.map((r) => r.sla))), format: "percent" },
        ],
        charts: [
          { kind: "bar", title: "Completions by onboarder", drillKey: "onboarder", points: rows.map((r) => ({ label: r.onboarder, value: r.completed, tone: "success" as const })).sort((a, b) => b.value - a.value) },
          { kind: "bar", title: "First-pass approval rate", drillKey: "onboarder", format: "percent", points: rows.map((r) => ({ label: r.onboarder, value: r.firstPass, tone: "info" as const })).sort((a, b) => b.value - a.value) },
        ],
        table: {
          columns: [
            { key: "onboarder", label: "Onboarder" },
            { key: "completed", label: "Completed", type: "number" },
            { key: "reviewed", label: "Docs reviewed", type: "number" },
            { key: "avgReviewHrs", label: "Avg review (h)", type: "number" },
            { key: "firstPass", label: "First-pass", type: "percent" },
            { key: "rework", label: "Rework", type: "percent" },
            { key: "sla", label: "SLA compliance", type: "percent" },
            { key: "escalations", label: "Escalations", type: "number" },
          ],
          rows,
          sort: { key: "completed", dir: "desc" },
        },
      };
    },
  },
  {
    slug: "rejection-rework",
    name: "Rejection & Rework Report",
    description: "Rejected and corrected documents by reason, type, client, and reviewer — including repeat rejections and time lost.",
    section: "onboarder",
    spec: "§53.5",
    personas: [ON, RM, SA],
    owner: "HR Operations",
    definitions: [{ term: "Time lost", def: "Days between upload and the last update on a rejected document." }],
    load(ds) {
      const rej = ds.documents.filter((d) => ["REJECTED", "CORRECTION_REQUIRED"].includes(d.status));
      const perCand = countBy(rej, (d) => d.candidateId);
      const rows = rej.map((d) => ({
        document: d.name,
        type: d.category,
        candidate: nameOf(ds, d.candidateId),
        client: clientOf(ds, d.candidateId),
        reason: d.rejectedReason ?? (d.aiFlags[0] ? title(d.aiFlags[0]) : "Unspecified"),
        repeat: (perCand.get(d.candidateId ?? "") ?? 0) > 1 ? "Repeat" : "First",
        source: d.aiFlags.length ? "AI-detected" : "Human review",
        reviewer: d.reviewedBy ?? "—",
        timeLost: d.uploadedAt ? Math.max(0, daysBetween(d.uploadedAt, d.updatedAt)) : 0,
        status: title(d.status),
      }));
      return {
        kpis: [
          { label: "Rejected / correction", value: rows.length, tone: "danger" },
          { label: "Rejection rate", value: pct(rows.length, ds.documents.length), format: "percent" },
          { label: "Repeat rejections", value: rows.filter((r) => r.repeat === "Repeat").length, tone: "warning" },
          { label: "AI-detected", value: rows.filter((r) => r.source === "AI-detected").length, tone: "ai" },
          { label: "Days lost (total)", value: sum(rows.map((r) => r.timeLost)), format: "days" },
        ],
        charts: [
          { kind: "bar", title: "Top rejection reasons", drillKey: "reason", points: points(countBy(rows, (r) => r.reason), { tone: "danger", limit: 10 }) },
          { kind: "bar", title: "By document type", drillKey: "type", points: points(countBy(rows, (r) => r.type), { tone: "warning" }) },
          { kind: "bar", title: "AI vs human detection", drillKey: "source", points: points(countBy(rows, (r) => r.source), { tones: { "AI-detected": "ai", "Human review": "info" } }) },
        ],
        table: {
          columns: [
            { key: "document", label: "Document" },
            { key: "type", label: "Type" },
            { key: "candidate", label: "Candidate" },
            { key: "client", label: "Client" },
            { key: "reason", label: "Reason" },
            { key: "repeat", label: "Repeat", type: "status" },
            { key: "source", label: "Detected by" },
            { key: "reviewer", label: "Reviewer" },
            { key: "timeLost", label: "Days lost", type: "days" },
            { key: "status", label: "Status", type: "status" },
          ],
          rows,
          sort: { key: "timeLost", dir: "desc" },
        },
      };
    },
  },
  {
    slug: "nudge-effectiveness",
    name: "Nudge Effectiveness Report",
    description: "Gentle Nudge Protocol performance: response and completion after reminders by channel and escalation level.",
    section: "onboarder",
    spec: "§53.6 · §13",
    personas: [ON, RC, SA],
    owner: "Communications",
    load(ds) {
      const nudges = ds.communications.filter((m) => m.nudgeLevel !== null && m.nudgeLevel !== undefined);
      const levels = [...new Set(nudges.map((m) => m.nudgeLevel as number))].sort((a, b) => a - b);
      const byChannel = [...countBy(nudges, (m) => title(m.channel)).keys()];
      const rows = byChannel.flatMap((ch) =>
        levels.map((lv) => {
          const xs = nudges.filter((m) => title(m.channel) === ch && m.nudgeLevel === lv);
          const resp = xs.filter((m) => m.respondedAt);
          return {
            channel: ch,
            level: `Day ${lv}`,
            sent: xs.length,
            delivered: pct(xs.filter((m) => !["failed", "bounced"].includes(m.status)).length, xs.length),
            opened: pct(xs.filter((m) => m.openedAt).length, xs.length),
            responseRate: pct(resp.length, xs.length),
            avgResponseHrs: round(avg(resp.map((m) => (m.respondedAt!.getTime() - (m.sentAt ?? m.createdAt).getTime()) / 3_600_000))),
            failed: xs.filter((m) => ["failed", "bounced"].includes(m.status)).length,
          };
        }).filter((r) => r.sent > 0),
      );
      return {
        kpis: [
          { label: "Nudges sent", value: nudges.length },
          { label: "Response rate", value: pct(nudges.filter((m) => m.respondedAt).length, nudges.length), format: "percent", tone: "success" },
          { label: "Failed deliveries", value: nudges.filter((m) => ["failed", "bounced"].includes(m.status)).length, tone: "danger" },
          { label: "Reached Day 5+ escalation", value: nudges.filter((m) => (m.nudgeLevel ?? 0) >= 5).length, tone: "warning" },
        ],
        charts: [
          { kind: "bar", title: "Response rate by channel", drillKey: "channel", format: "percent", points: byChannel.map((ch) => { const xs = nudges.filter((m) => title(m.channel) === ch); return { label: ch, value: pct(xs.filter((m) => m.respondedAt).length, xs.length), tone: "success" as const }; }) },
          { kind: "trend", title: "Response rate by escalation level", format: "percent", points: levels.map((lv) => { const xs = nudges.filter((m) => m.nudgeLevel === lv); return { label: `Day ${lv}`, value: pct(xs.filter((m) => m.respondedAt).length, xs.length), tone: "info" as const }; }) },
        ],
        table: {
          columns: [
            { key: "channel", label: "Channel" },
            { key: "level", label: "Level" },
            { key: "sent", label: "Sent", type: "number" },
            { key: "delivered", label: "Delivered", type: "percent" },
            { key: "opened", label: "Opened", type: "percent" },
            { key: "responseRate", label: "Responded", type: "percent" },
            { key: "avgResponseHrs", label: "Avg response (h)", type: "number" },
            { key: "failed", label: "Failed", type: "number" },
          ],
          rows,
        },
      };
    },
  },
  {
    slug: "start-date-readiness",
    name: "Start-Date Readiness Report",
    description: "Candidates starting in the next 14 days with compliance, payroll, billing, screening, equipment, and training status.",
    section: "onboarder",
    spec: "§53.7",
    personas: [ON, "account-manager", SA],
    owner: "HR Operations",
    dateScope: "none",
    load(ds) {
      const soon = ds.candidates.filter((c) => {
        const d = daysUntil(ds, c.startDate);
        return isActive(c) && d !== null && d >= 0 && d <= 14;
      });
      const rows = soon.map((c) => {
        const r = readiness(ds, c);
        return {
          candidate: fullName(c),
          client: c.clientName ?? "—",
          start: iso(c.startDate),
          days: daysUntil(ds, c.startDate),
          compliance: r.compliance ? "Ready" : "Not Ready",
          payroll: r.payroll ? "Ready" : "Not Ready",
          billing: r.billing ? "Ready" : "Not Ready",
          screening: r.screening,
          equipment: r.equipment,
          training: r.training,
          risk: title(c.risk),
          missing: r.openDocs.map((d) => d.name).join(", ") || "—",
          fullyReady: r.compliance && r.payroll && r.billing && r.equipment !== "Delayed" ? "Yes" : "No",
        };
      });
      return {
        kpis: [
          { label: "Starting ≤14 days", value: rows.length },
          { label: "Fully ready", value: rows.filter((r) => r.fullyReady === "Yes").length, tone: "success" },
          { label: "Compliance gaps", value: rows.filter((r) => r.compliance !== "Ready").length, tone: "warning" },
          { label: "Payroll gaps", value: rows.filter((r) => r.payroll !== "Ready").length, tone: "warning" },
          { label: "Billing gaps", value: rows.filter((r) => r.billing !== "Ready").length, tone: "warning" },
          { label: "Equipment delayed", value: rows.filter((r) => r.equipment === "Delayed").length, tone: "danger" },
        ],
        charts: [
          { kind: "bar", title: "Gate gaps (count not ready)", points: [
            { label: "Compliance", value: rows.filter((r) => r.compliance !== "Ready").length, tone: "warning" },
            { label: "Payroll", value: rows.filter((r) => r.payroll !== "Ready").length, tone: "warning" },
            { label: "Billing", value: rows.filter((r) => r.billing !== "Ready").length, tone: "warning" },
            { label: "Screening", value: rows.filter((r) => r.screening !== "Clear").length, tone: "info" },
            { label: "Equipment", value: rows.filter((r) => !["Ready", "None required"].includes(r.equipment)).length, tone: "danger" },
          ] },
          { kind: "trend", title: "Starts by day (next 14)", points: Array.from({ length: 15 }, (_, k) => ({ label: new Date(ds.now.getTime() + k * 86_400_000).toLocaleString("en-US", { month: "short", day: "numeric" }), value: rows.filter((r) => r.days === k).length, tone: "info" as const })) },
        ],
        table: {
          columns: [
            { key: "candidate", label: "Candidate" },
            { key: "client", label: "Client" },
            { key: "start", label: "Start", type: "date" },
            { key: "days", label: "Days", type: "days" },
            { key: "compliance", label: "Compliance", type: "status" },
            { key: "payroll", label: "Payroll", type: "status" },
            { key: "billing", label: "Billing", type: "status" },
            { key: "screening", label: "Screening", type: "status" },
            { key: "equipment", label: "Equipment", type: "status" },
            { key: "training", label: "Training" },
            { key: "risk", label: "Risk", type: "status" },
            { key: "missing", label: "Missing items" },
          ],
          rows,
          sort: { key: "days", dir: "asc" },
        },
      };
    },
  },
  {
    slug: "exception-resolution",
    name: "Exception Resolution Report",
    description: "Exceptions assigned and resolved per owner, average resolution time, escalations, reopen rate, and client impact.",
    section: "onboarder",
    spec: "§53.8",
    personas: [ON, SA],
    owner: "Exception Control Tower",
    load(ds) {
      const owners = [...countBy(ds.exceptions, (e) => e.owner).keys()];
      const rows = owners.map((o) => {
        const xs = ds.exceptions.filter((e) => (e.owner ?? "Unassigned") === o);
        const res = xs.filter((e) => e.resolvedAt);
        const cats = countBy(xs, (e) => e.category);
        return {
          owner: o,
          assigned: xs.length,
          resolved: res.length,
          open: xs.filter((e) => OPEN_EXC.has(e.status)).length,
          avgDays: round(avg(res.map((e) => daysBetween(e.createdAt, e.resolvedAt!)))),
          reopened: xs.filter((e) => e.status === "REOPENED").length,
          clientImpact: xs.filter((e) => e.clientVisible).length,
          topCause: [...cats.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—",
        };
      });
      return {
        kpis: [
          { label: "Assigned", value: sum(rows.map((r) => r.assigned)) },
          { label: "Resolved", value: sum(rows.map((r) => r.resolved)), tone: "success" },
          { label: "Resolution rate", value: pct(sum(rows.map((r) => r.resolved)), sum(rows.map((r) => r.assigned))), format: "percent" },
          { label: "Avg resolution", value: round(avg(rows.map((r) => r.avgDays).filter(Boolean))), format: "days" },
          { label: "Reopened", value: sum(rows.map((r) => r.reopened)), tone: "warning" },
        ],
        charts: [
          { kind: "stacked", title: "Resolved vs open by owner", drillKey: "owner", segments: [{ key: "resolved", label: "Resolved", tone: "success" }, { key: "open", label: "Open", tone: "warning" }], rows: rows.map((r) => ({ label: r.owner, values: { resolved: r.resolved, open: r.open } })) },
          { kind: "bar", title: "Avg resolution days by owner", drillKey: "owner", format: "days", points: rows.map((r) => ({ label: r.owner, value: r.avgDays, tone: "info" as const })).sort((a, b) => b.value - a.value) },
        ],
        table: {
          columns: [
            { key: "owner", label: "Owner" },
            { key: "assigned", label: "Assigned", type: "number" },
            { key: "resolved", label: "Resolved", type: "number" },
            { key: "open", label: "Open", type: "number" },
            { key: "avgDays", label: "Avg resolution", type: "days" },
            { key: "reopened", label: "Reopened", type: "number" },
            { key: "clientImpact", label: "Client-visible", type: "number" },
            { key: "topCause", label: "Top root cause" },
          ],
          rows,
          sort: { key: "assigned", dir: "desc" },
        },
      };
    },
  },

  // ── Recruiter (§54) ─────────────────────────────────────
  {
    slug: "recruiter-funnel",
    name: "Recruiter Candidate Funnel",
    description: "Offer Accepted → Fully Onboarded funnel with stage conversion and drop-off, filterable by recruiter.",
    section: "recruiter",
    spec: "§54.1",
    personas: [RC, RM, SA],
    owner: "Talent Acquisition",
    load(ds) {
      const rows = ds.candidates.map((c) => ({ candidate: fullName(c), recruiter: c.recruiter ?? "—", client: c.clientName ?? "—", stage: funnelStage(ds, c), status: title(c.status), start: iso(c.startDate) }));
      const reached = (i: number) => rows.filter((r) => REACHED(r.stage) >= i).length;
      const funnel = FUNNEL.map((s, i) => ({ label: s, value: reached(i), tone: "info" as const }));
      return {
        kpis: [
          { label: "Candidates", value: rows.length },
          { label: "Fully onboarded", value: rows.filter((r) => r.stage === "Fully Onboarded").length, tone: "success" },
          { label: "In flight", value: rows.filter((r) => !["Fully Onboarded", "Dropped Off"].includes(r.stage)).length, tone: "info" },
          { label: "Dropped off", value: rows.filter((r) => r.stage === "Dropped Off").length, tone: "danger" },
          { label: "End-to-end conversion", value: pct(reached(FUNNEL.length - 1), rows.filter((r) => r.stage !== "Dropped Off").length + rows.filter((r) => r.stage === "Dropped Off").length), format: "percent" },
        ],
        charts: [
          { kind: "funnel", title: "Candidate funnel (reached stage)", points: funnel },
          { kind: "bar", title: "Current stage", drillKey: "stage", points: points(countBy(rows, (r) => r.stage), { order: [...FUNNEL, "Dropped Off"], tone: "info" }) },
          { kind: "bar", title: "Candidates by recruiter", drillKey: "recruiter", points: points(countBy(rows, (r) => r.recruiter)) },
        ],
        table: {
          columns: [
            { key: "candidate", label: "Candidate" },
            { key: "recruiter", label: "Recruiter" },
            { key: "client", label: "Client" },
            { key: "stage", label: "Funnel stage", type: "status" },
            { key: "status", label: "Status", type: "status" },
            { key: "start", label: "Start", type: "date" },
          ],
          rows,
        },
      };
    },
  },
  {
    slug: "recruiter-handoff",
    name: "Recruiter Handoff Report",
    description: "Offer-to-handoff timing, onboarder assignment, package dispatch, missing recruiter data, and handoff quality score.",
    section: "recruiter",
    spec: "§54.2",
    personas: [RC, RM],
    owner: "Talent Acquisition",
    definitions: [{ term: "Handoff quality", def: "100 minus 15 points per missing recruiter-owned field (phone, location, employment type, start date, client)." }],
    load(ds) {
      const rows = ds.candidates.filter((c) => c.status !== "NEW").map((c) => {
        const missing = [!c.phone && "Phone", !c.workLocation && "Location", !c.employmentType && "Employment type", !c.startDate && "Start date", !c.clientName && "Client"].filter(Boolean) as string[];
        const firstDoc = (idx(ds).docs.get(c.id) ?? []).map((d) => d.createdAt).sort((a, b) => a.getTime() - b.getTime())[0];
        const handoffDays = firstDoc ? Math.max(0, daysBetween(c.createdAt, firstDoc)) : null;
        return {
          candidate: fullName(c),
          recruiter: c.recruiter ?? "—",
          offerDate: iso(c.createdAt),
          handoffDate: iso(firstDoc),
          handoffDays,
          onboarder: c.onboarder ?? "Unassigned",
          packageSent: firstDoc ? "Sent" : "Not sent",
          missing: missing.join(", ") || "—",
          quality: Math.max(0, 100 - missing.length * 15),
        };
      });
      const byRec = [...countBy(rows, (r) => r.recruiter).keys()];
      return {
        kpis: [
          { label: "Handoffs", value: rows.length },
          { label: "Avg offer → handoff", value: round(avg(rows.map((r) => r.handoffDays ?? 0))), format: "days" },
          { label: "Avg handoff quality", value: round(avg(rows.map((r) => r.quality))), format: "percent", tone: "success" },
          { label: "With missing data", value: rows.filter((r) => r.missing !== "—").length, tone: "warning" },
          { label: "Unassigned onboarder", value: rows.filter((r) => r.onboarder === "Unassigned").length, tone: "danger" },
        ],
        charts: [
          { kind: "bar", title: "Avg handoff quality by recruiter", drillKey: "recruiter", format: "percent", points: byRec.map((k) => ({ label: k, value: round(avg(rows.filter((r) => r.recruiter === k).map((r) => r.quality))), tone: "success" as const })).sort((a, b) => a.value - b.value) },
          { kind: "bar", title: "Avg days to handoff by recruiter", drillKey: "recruiter", format: "days", points: byRec.map((k) => ({ label: k, value: round(avg(rows.filter((r) => r.recruiter === k).map((r) => r.handoffDays ?? 0))), tone: "info" as const })).sort((a, b) => b.value - a.value) },
        ],
        table: {
          columns: [
            { key: "candidate", label: "Candidate" },
            { key: "recruiter", label: "Recruiter" },
            { key: "offerDate", label: "Offer accepted", type: "date" },
            { key: "handoffDate", label: "Handoff", type: "date" },
            { key: "handoffDays", label: "Days", type: "days" },
            { key: "onboarder", label: "Onboarder" },
            { key: "packageSent", label: "Package", type: "status" },
            { key: "missing", label: "Missing data" },
            { key: "quality", label: "Quality", type: "percent" },
          ],
          rows,
          sort: { key: "quality", dir: "asc" },
        },
      };
    },
  },
  {
    slug: "time-to-onboard",
    name: "Recruiter Time-to-Onboard Report",
    description: "Average, median, best, and longest time-to-onboard by recruiter, client, and employment type with monthly trend.",
    section: "recruiter",
    spec: "§54.3",
    personas: [RC, RM, SA, "executive"],
    owner: "Talent Acquisition",
    definitions: [{ term: "Time-to-onboard", def: "Days from offer accepted (record creation) to start date, for placed candidates." }],
    load(ds) {
      const placed = ds.candidates.filter((c) => timeToOnboard(c) !== null);
      const rows: Row[] = placed.map((c) => ({ candidate: fullName(c), recruiter: c.recruiter ?? "—", client: c.clientName ?? "—", employment: employment(c.employmentType), start: iso(c.startDate), days: timeToOnboard(c) }));
      const all = placed.map((c) => timeToOnboard(c)!);
      const by = (k: string) => [...countBy(rows, (r) => String(r[k])).keys()].map((v) => ({ label: v, value: round(avg(rows.filter((r) => r[k] === v).map((r) => r.days as number))), tone: "info" as const })).sort((a, b) => a.value - b.value);
      const months = monthlyTrend(ds, placed, (c) => c.startDate, 9);
      return {
        kpis: [
          { label: "Placements", value: placed.length, tone: "success" },
          { label: "Average", value: round(avg(all)), format: "days" },
          { label: "Median", value: median(all), format: "days" },
          { label: "Best", value: all.length ? Math.min(...all) : 0, format: "days", tone: "success" },
          { label: "Longest", value: Math.max(0, ...all), format: "days", tone: "warning" },
          { label: "90th percentile", value: percentile(all, 90), format: "days" },
        ],
        charts: [
          { kind: "bar", title: "Avg days by recruiter", drillKey: "recruiter", format: "days", points: by("recruiter") },
          { kind: "bar", title: "Avg days by employment type", drillKey: "employment", format: "days", points: by("employment") },
          { kind: "trend", title: "Avg days by start month", format: "days", points: months.map((m, i) => {
            const key = new Date(ds.now.getFullYear(), ds.now.getMonth() - (months.length - 1 - i), 1);
            const xs = placed.filter((c) => c.startDate!.getMonth() === key.getMonth() && c.startDate!.getFullYear() === key.getFullYear()).map((c) => timeToOnboard(c)!);
            return { label: m.label, value: round(avg(xs)), tone: "info" as const };
          }) },
        ],
        table: {
          columns: [
            { key: "candidate", label: "Candidate" },
            { key: "recruiter", label: "Recruiter" },
            { key: "client", label: "Client" },
            { key: "employment", label: "Employment" },
            { key: "start", label: "Start", type: "date" },
            { key: "days", label: "Days to onboard", type: "days" },
          ],
          rows,
          sort: { key: "days", dir: "desc" },
        },
      };
    },
  },
  {
    slug: "recruiter-drop-off",
    name: "Recruiter Drop-Off Report",
    description: "Drop-off rate and reasons per recruiter with preventability, compensation, and documentation-related losses.",
    section: "recruiter",
    spec: "§54.4",
    personas: [RC, RM],
    owner: "Talent Acquisition",
    load(ds) {
      const recs = staff(ds, "recruiter");
      const rows = recs.map((r) => {
        const mine = ds.candidates.filter((c) => c.recruiter === r);
        const dropped = mine.filter((c) => DROPPED_STATUSES.has(c.status));
        const reasons = dropped.map((c) => dropReason(ds, c.id));
        return {
          recruiter: r,
          candidates: mine.length,
          dropped: dropped.length,
          rate: pct(dropped.length, mine.length),
          preventable: reasons.filter((x) => ["Candidate unresponsive", "Documentation friction", "Compensation issue", "Start-date change"].includes(x)).length,
          compensation: reasons.filter((x) => x === "Compensation issue").length,
          documentation: reasons.filter((x) => x === "Documentation friction").length,
          unresponsive: reasons.filter((x) => x === "Candidate unresponsive").length,
        };
      });
      return {
        kpis: [
          { label: "Drop-offs", value: sum(rows.map((r) => r.dropped)), tone: "danger" },
          { label: "Team drop-off rate", value: pct(sum(rows.map((r) => r.dropped)), sum(rows.map((r) => r.candidates))), format: "percent" },
          { label: "Preventable", value: sum(rows.map((r) => r.preventable)), tone: "warning" },
          { label: "Compensation losses", value: sum(rows.map((r) => r.compensation)) },
        ],
        charts: [
          { kind: "bar", title: "Drop-off rate by recruiter", drillKey: "recruiter", format: "percent", points: rows.map((r) => ({ label: r.recruiter, value: r.rate, tone: "danger" as const })).sort((a, b) => b.value - a.value) },
          { kind: "stacked", title: "Preventable vs other", drillKey: "recruiter", segments: [{ key: "p", label: "Preventable", tone: "warning" }, { key: "o", label: "Non-preventable", tone: "neutral" }], rows: rows.map((r) => ({ label: r.recruiter, values: { p: r.preventable, o: r.dropped - r.preventable } })) },
        ],
        table: {
          columns: [
            { key: "recruiter", label: "Recruiter" },
            { key: "candidates", label: "Candidates", type: "number" },
            { key: "dropped", label: "Dropped", type: "number" },
            { key: "rate", label: "Rate", type: "percent" },
            { key: "preventable", label: "Preventable", type: "number" },
            { key: "compensation", label: "Compensation", type: "number" },
            { key: "documentation", label: "Documentation", type: "number" },
            { key: "unresponsive", label: "Unresponsive", type: "number" },
          ],
          rows,
          sort: { key: "rate", dir: "desc" },
        },
      };
    },
  },
  {
    slug: "candidate-engagement",
    name: "Candidate Engagement Report",
    description: "Portal activation, message response, document completion, inactivity, and escalation need for each candidate.",
    section: "recruiter",
    spec: "§54.5",
    personas: [RC, ON, RM],
    owner: "Talent Acquisition",
    load(ds) {
      const rows = ds.candidates.filter(isActive).map((c) => {
        const comms = idx(ds).comms.get(c.id) ?? [];
        const out = comms.filter((m) => m.direction === "outbound");
        const docs = idx(ds).docs.get(c.id) ?? [];
        const lastInbound = comms.filter((m) => m.direction === "inbound").map((m) => m.sentAt ?? m.createdAt).sort((a, b) => b.getTime() - a.getTime())[0];
        const inactive = ageDays(ds, lastInbound ?? c.lastContact ?? c.createdAt) ?? 0;
        return {
          candidate: fullName(c),
          recruiter: c.recruiter ?? "—",
          client: c.clientName ?? "—",
          portal: comms.some((m) => m.channel === "PORTAL" && (m.openedAt || m.direction === "inbound")) ? "Activated" : "Not activated",
          responseRate: pct(out.filter((m) => m.respondedAt).length, out.length),
          docCompletion: pct(docs.filter((d) => d.uploadedAt).length, docs.length),
          inactiveDays: inactive,
          touches: out.length,
          escalation: inactive > 3 && (daysUntil(ds, c.startDate) ?? 99) < 10 ? "Escalate" : inactive > 2 ? "Watch" : "OK",
        };
      });
      return {
        kpis: [
          { label: "Active candidates", value: rows.length },
          { label: "Portal activated", value: pct(rows.filter((r) => r.portal === "Activated").length, rows.length), format: "percent", tone: "success" },
          { label: "Avg response rate", value: round(avg(rows.map((r) => r.responseRate))), format: "percent" },
          { label: "Inactive 48h+", value: rows.filter((r) => r.inactiveDays >= 2).length, tone: "warning" },
          { label: "Need escalation", value: rows.filter((r) => r.escalation === "Escalate").length, tone: "danger" },
        ],
        charts: [
          { kind: "bar", title: "Engagement status", drillKey: "escalation", points: points(countBy(rows, (r) => r.escalation), { order: ["OK", "Watch", "Escalate"], tones: { OK: "success", Watch: "warning", Escalate: "danger" } }) },
          { kind: "bar", title: "Avg response rate by recruiter", drillKey: "recruiter", format: "percent", points: [...countBy(rows, (r) => r.recruiter).keys()].map((k) => ({ label: k, value: round(avg(rows.filter((r) => r.recruiter === k).map((r) => r.responseRate))), tone: "info" as const })).sort((a, b) => a.value - b.value) },
        ],
        table: {
          columns: [
            { key: "candidate", label: "Candidate" },
            { key: "recruiter", label: "Recruiter" },
            { key: "client", label: "Client" },
            { key: "portal", label: "Portal", type: "status" },
            { key: "responseRate", label: "Response rate", type: "percent" },
            { key: "docCompletion", label: "Docs uploaded", type: "percent" },
            { key: "inactiveDays", label: "Inactive", type: "days" },
            { key: "touches", label: "Touches", type: "number" },
            { key: "escalation", label: "Escalation", type: "status" },
          ],
          rows,
          sort: { key: "inactiveDays", dir: "desc" },
        },
      };
    },
  },
  {
    slug: "start-date-success",
    name: "Recruiter Start-Date Success Report",
    description: "Planned vs successful, delayed, and canceled starts per recruiter with delay reasons.",
    section: "recruiter",
    spec: "§54.6",
    personas: [RC, RM, "account-manager"],
    owner: "Talent Acquisition",
    definitions: [
      { term: "Successful", def: "Placed with a start date in the past." },
      { term: "Delayed", def: "Start date passed while still onboarding / offer accepted." },
      { term: "Canceled", def: "Withdrawn or archived after a start date was set." },
    ],
    load(ds) {
      const withStart = ds.candidates.filter((c) => c.startDate && c.startDate <= ds.now);
      const outcome = (c: DsCandidate) => (c.status === "PLACED" ? "Successful" : DROPPED_STATUSES.has(c.status) ? "Canceled" : isActive(c) || c.status === "ON_HOLD" ? "Delayed" : "Other");
      const rows = withStart.map((c) => ({ candidate: fullName(c), recruiter: c.recruiter ?? "—", client: c.clientName ?? "—", planned: iso(c.startDate), outcome: outcome(c), reason: outcome(c) === "Delayed" ? recommendedAction(ds, c) : outcome(c) === "Canceled" ? dropReason(ds, c.id) : "—", type: employment(c.employmentType) }));
      const recs = [...countBy(rows, (r) => r.recruiter).keys()];
      return {
        kpis: [
          { label: "Planned starts (past)", value: rows.length },
          { label: "Successful", value: rows.filter((r) => r.outcome === "Successful").length, tone: "success" },
          { label: "Delayed", value: rows.filter((r) => r.outcome === "Delayed").length, tone: "warning" },
          { label: "Canceled", value: rows.filter((r) => r.outcome === "Canceled").length, tone: "danger" },
          { label: "Success rate", value: pct(rows.filter((r) => r.outcome === "Successful").length, rows.length), format: "percent" },
        ],
        charts: [
          { kind: "stacked", title: "Start outcomes by recruiter", drillKey: "recruiter", segments: [{ key: "Successful", label: "Successful", tone: "success" }, { key: "Delayed", label: "Delayed", tone: "warning" }, { key: "Canceled", label: "Canceled", tone: "danger" }], rows: recs.map((r) => ({ label: r, values: Object.fromEntries(["Successful", "Delayed", "Canceled"].map((o) => [o, rows.filter((x) => x.recruiter === r && x.outcome === o).length])) })) },
          { kind: "bar", title: "Delay / cancel reasons", drillKey: "reason", points: points(countBy(rows.filter((r) => r.reason !== "—"), (r) => r.reason), { tone: "warning", limit: 8 }) },
        ],
        table: {
          columns: [
            { key: "candidate", label: "Candidate" },
            { key: "recruiter", label: "Recruiter" },
            { key: "client", label: "Client" },
            { key: "planned", label: "Planned start", type: "date" },
            { key: "outcome", label: "Outcome", type: "status" },
            { key: "reason", label: "Reason" },
            { key: "type", label: "Assignment type" },
          ],
          rows,
          sort: { key: "planned", dir: "desc" },
        },
      };
    },
  },
  {
    slug: "recruiter-data-quality",
    name: "Recruiter Data Quality Report",
    description: "Missing or inaccurate legal name, contact, location, employment type, start date, client, and identifier fields by recruiter.",
    section: "recruiter",
    spec: "§54.7",
    personas: [RC, RM, SA],
    owner: "Data Governance",
    load(ds) {
      const checks: [string, (c: DsCandidate) => boolean][] = [
        ["Phone", (c) => !c.phone],
        ["Work location", (c) => !c.workLocation],
        ["Employment type", (c) => !c.employmentType],
        ["Start date", (c) => !c.startDate && c.status !== "NEW"],
        ["Client", (c) => !c.clientName],
        ["Address", (c) => !c.street || !c.zip],
        ["Vendor (C2C)", (c) => c.employmentType === "C2C" && !c.vendor],
      ];
      const rows = ds.candidates.map((c) => {
        const missing = checks.filter(([, f]) => f(c)).map(([k]) => k);
        return { candidate: fullName(c), recruiter: c.recruiter ?? "—", status: title(c.status), missing: missing.join(", ") || "—", issues: missing.length, score: Math.round(100 - (missing.length / checks.length) * 100) };
      });
      const fieldCounts = new Map(checks.map(([k, f]) => [k, ds.candidates.filter(f).length]));
      const recs = [...countBy(rows, (r) => r.recruiter).keys()];
      return {
        kpis: [
          { label: "Records checked", value: rows.length },
          { label: "Records with issues", value: rows.filter((r) => r.issues > 0).length, tone: "warning" },
          { label: "Avg data quality", value: round(avg(rows.map((r) => r.score))), format: "percent", tone: "success" },
          { label: "Total field gaps", value: sum(rows.map((r) => r.issues)), tone: "danger" },
        ],
        charts: [
          { kind: "bar", title: "Missing fields", points: points(fieldCounts, { tone: "warning" }) },
          { kind: "bar", title: "Data quality by recruiter", drillKey: "recruiter", format: "percent", points: recs.map((k) => ({ label: k, value: round(avg(rows.filter((r) => r.recruiter === k).map((r) => r.score))), tone: "success" as const })).sort((a, b) => a.value - b.value) },
        ],
        table: {
          columns: [
            { key: "candidate", label: "Candidate" },
            { key: "recruiter", label: "Recruiter" },
            { key: "status", label: "Status", type: "status" },
            { key: "missing", label: "Missing fields" },
            { key: "issues", label: "Issues", type: "number" },
            { key: "score", label: "Quality", type: "percent" },
          ],
          rows,
          sort: { key: "issues", dir: "desc" },
        },
      };
    },
  },

  // ── Recruiting Manager (§55) ─────────────────────────────
  {
    slug: "team-throughput",
    name: "Team Throughput Report",
    description: "Candidates onboarded by recruiter and onboarder, completion rate, and monthly trend with a forward forecast.",
    section: "manager",
    spec: "§55.1",
    personas: [RM, "executive"],
    owner: "Recruiting Leadership",
    load(ds) {
      const placed = ds.candidates.filter((c) => c.status === "PLACED");
      const months = monthlyTrend(ds, placed, (c) => c.startDate, 9, "success");
      const upcoming = ds.candidates.filter((c) => isActive(c) && c.startDate && c.startDate > ds.now);
      const rows = staff(ds, "recruiter").map((r) => {
        const mine = ds.candidates.filter((c) => c.recruiter === r);
        const done = mine.filter((c) => c.status === "PLACED");
        const closed = done.length + mine.filter((c) => DROPPED_STATUSES.has(c.status)).length;
        return { recruiter: r, total: mine.length, onboarded: done.length, inFlight: mine.filter(isActive).length, completion: pct(done.length, closed), last30: done.filter((c) => (ageDays(ds, c.startDate) ?? 99) <= 30 && (ageDays(ds, c.startDate) ?? -1) >= 0).length, forecast30: upcoming.filter((c) => c.recruiter === r && (daysUntil(ds, c.startDate) ?? 99) <= 30).length };
      });
      return {
        kpis: [
          { label: "Onboarded (all time)", value: placed.length, tone: "success" },
          { label: "Onboarded last 30d", value: sum(rows.map((r) => r.last30)) },
          { label: "Team completion rate", value: round(avg(rows.map((r) => r.completion))), format: "percent" },
          { label: "Forecast next 30d", value: sum(rows.map((r) => r.forecast30)), tone: "info" },
        ],
        charts: [
          { kind: "trend", title: "Onboarded per month", points: months },
          { kind: "trend", title: "Forecast starts (next 8 weeks)", points: forwardWeeks(ds, upcoming, (c) => c.startDate, 8, "ai") },
          { kind: "bar", title: "Onboarded by recruiter", drillKey: "recruiter", points: rows.map((r) => ({ label: r.recruiter, value: r.onboarded, tone: "success" as const })).sort((a, b) => b.value - a.value) },
          { kind: "bar", title: "Onboarded by onboarder", points: points(countBy(placed, (c) => c.onboarder), { tone: "info" }) },
        ],
        table: {
          columns: [
            { key: "recruiter", label: "Recruiter" },
            { key: "total", label: "Candidates", type: "number" },
            { key: "onboarded", label: "Onboarded", type: "number" },
            { key: "inFlight", label: "In flight", type: "number" },
            { key: "completion", label: "Completion", type: "percent" },
            { key: "last30", label: "Last 30d", type: "number" },
            { key: "forecast30", label: "Forecast 30d", type: "number" },
          ],
          rows,
          sort: { key: "onboarded", dir: "desc" },
        },
      };
    },
  },
  {
    slug: "team-workload",
    name: "Team Workload Distribution",
    description: "Active cases, weighted complexity, due tasks, at-risk candidates, capacity, and imbalance across recruiters and onboarders.",
    section: "manager",
    spec: "§55.2 · §36",
    personas: [RM, SA],
    owner: "Recruiting Leadership",
    definitions: [{ term: "Capacity", def: "Standard weighted capacity of 18 per onboarder and 22 per recruiter." }],
    load(ds) {
      const active = ds.candidates.filter(isActive);
      const mk = (role: "Recruiter" | "Onboarder", name: string, cap: number) => {
        const mine = active.filter((c) => (role === "Recruiter" ? c.recruiter : c.onboarder) === name);
        const w = round(sum(mine.map((c) => weight(ds, c))));
        return { owner: name, role, active: mine.length, weighted: w, due: mine.filter((c) => (daysUntil(ds, c.startDate) ?? 99) <= 7).length, atRisk: mine.filter((c) => c.risk === "AT_RISK" || c.risk === "UNLIKELY").length, capacity: cap, utilization: pct(w, cap), state: w / cap > 1 ? "Over capacity" : w / cap > 0.8 ? "Near capacity" : "Available" };
      };
      const rows = [...staff(ds, "recruiter").map((r) => mk("Recruiter", r, 22)), ...staff(ds, "onboarder").map((o) => mk("Onboarder", o, 18))];
      return {
        kpis: [
          { label: "Active cases", value: active.length },
          { label: "Unassigned onboarder", value: active.filter((c) => !c.onboarder).length, tone: "danger" },
          { label: "Over capacity", value: rows.filter((r) => r.state === "Over capacity").length, tone: "danger" },
          { label: "Near capacity", value: rows.filter((r) => r.state === "Near capacity").length, tone: "warning" },
          { label: "Avg utilization", value: round(avg(rows.map((r) => r.utilization))), format: "percent" },
        ],
        charts: [
          { kind: "bar", title: "Utilization (weighted / capacity)", drillKey: "owner", format: "percent", points: rows.map((r) => ({ label: r.owner, value: r.utilization, tone: r.utilization > 100 ? ("danger" as const) : r.utilization > 80 ? ("warning" as const) : ("success" as const) })).sort((a, b) => b.value - a.value) },
          { kind: "bar", title: "Capacity state", drillKey: "state", points: points(countBy(rows, (r) => r.state), { tones: { "Over capacity": "danger", "Near capacity": "warning", Available: "success" } }) },
        ],
        table: {
          columns: [
            { key: "owner", label: "Owner" },
            { key: "role", label: "Role" },
            { key: "active", label: "Active", type: "number" },
            { key: "weighted", label: "Weighted", type: "number" },
            { key: "due", label: "Starting ≤7d", type: "number" },
            { key: "atRisk", label: "At risk", type: "number" },
            { key: "capacity", label: "Capacity", type: "number" },
            { key: "utilization", label: "Utilization", type: "percent" },
            { key: "state", label: "State", type: "status" },
          ],
          rows,
          sort: { key: "utilization", dir: "desc" },
        },
      };
    },
  },
  {
    slug: "recruiter-scorecard",
    name: "Recruiter Performance Scorecard",
    description: "Volume, time-to-onboard, drop-off, start success, engagement, handoff and data quality — combined into one score.",
    section: "manager",
    spec: "§55.3 · §34.3",
    personas: [RM, RC, "executive"],
    owner: "Recruiting Leadership",
    definitions: [{ term: "Composite score", def: "Equal-weighted: completion %, start success %, data quality %, response %, and inverse drop-off %." }],
    load(ds) {
      const rows = staff(ds, "recruiter").map((r) => {
        const mine = ds.candidates.filter((c) => c.recruiter === r);
        const placed = mine.filter((c) => c.status === "PLACED");
        const dropped = mine.filter((c) => DROPPED_STATUSES.has(c.status));
        const tto = placed.map(timeToOnboard).filter((x): x is number => x !== null);
        const started = mine.filter((c) => c.startDate && c.startDate <= ds.now);
        const success = pct(started.filter((c) => c.status === "PLACED").length, started.length);
        const out = mine.flatMap((c) => (idx(ds).comms.get(c.id) ?? []).filter((m) => m.direction === "outbound"));
        const response = pct(out.filter((m) => m.respondedAt).length, out.length);
        const dq = round(avg(mine.map((c) => 100 - [!c.phone, !c.workLocation, !c.employmentType, !c.clientName].filter(Boolean).length * 25)));
        const dropRate = pct(dropped.length, mine.length);
        const completion = pct(placed.length, placed.length + dropped.length);
        const score = round((completion + success + dq + response + (100 - dropRate)) / 5);
        return { recruiter: r, volume: mine.length, placed: placed.length, tto: round(avg(tto)), dropRate, success, response, dataQuality: dq, score, tier: score >= 80 ? "Top performer" : score >= 65 ? "Solid" : "Coaching" };
      });
      return {
        kpis: [
          { label: "Recruiters", value: rows.length },
          { label: "Avg composite score", value: round(avg(rows.map((r) => r.score))) },
          { label: "Top performers", value: rows.filter((r) => r.tier === "Top performer").length, tone: "success" },
          { label: "Coaching candidates", value: rows.filter((r) => r.tier === "Coaching").length, tone: "warning" },
        ],
        charts: [
          { kind: "bar", title: "Composite score", drillKey: "recruiter", points: rows.map((r) => ({ label: r.recruiter, value: r.score, tone: r.tier === "Coaching" ? ("warning" as const) : ("success" as const) })).sort((a, b) => b.value - a.value) },
          { kind: "bar", title: "Volume", drillKey: "recruiter", points: rows.map((r) => ({ label: r.recruiter, value: r.volume, tone: "info" as const })).sort((a, b) => b.value - a.value) },
        ],
        table: {
          columns: [
            { key: "recruiter", label: "Recruiter" },
            { key: "volume", label: "Volume", type: "number" },
            { key: "placed", label: "Placed", type: "number" },
            { key: "tto", label: "Avg TTO", type: "days" },
            { key: "dropRate", label: "Drop-off", type: "percent" },
            { key: "success", label: "Start success", type: "percent" },
            { key: "response", label: "Response", type: "percent" },
            { key: "dataQuality", label: "Data quality", type: "percent" },
            { key: "score", label: "Score", type: "number" },
            { key: "tier", label: "Tier", type: "status" },
          ],
          rows,
          sort: { key: "score", dir: "desc" },
        },
      };
    },
  },
  {
    slug: "team-bottlenecks",
    name: "Team Bottleneck Report",
    description: "Where time is lost: stage, client, screening, package, candidate, internal review, equipment, and payroll delays.",
    section: "manager",
    spec: "§55.4",
    personas: [RM, SA],
    owner: "Recruiting Leadership",
    load(ds) {
      const active = ds.candidates.filter(isActive);
      const delays: { type: string; candidate: string; client: string; owner: string; detail: string; days: number }[] = [];
      for (const c of active) {
        const r = readiness(ds, c);
        const base = { candidate: fullName(c), client: c.clientName ?? "—", owner: c.onboarder ?? "—" };
        if (r.screening === "Vendor Delayed" || r.screening === "Review Required") delays.push({ ...base, type: "Screening", detail: r.screening, days: ageDays(ds, (idx(ds).screenings.get(c.id) ?? [])[0]?.orderedAt) ?? 0 });
        for (const d of r.openDocs.filter((d) => d.status === "SUBMITTED" || d.status === "AI_REVIEW")) delays.push({ ...base, type: "Internal review", detail: d.name, days: ageDays(ds, d.uploadedAt) ?? 0 });
        for (const d of r.openDocs.filter((d) => d.status === "PENDING" || d.status === "CORRECTION_REQUIRED" || d.status === "REJECTED")) delays.push({ ...base, type: "Candidate", detail: `${d.name} (${title(d.status)})`, days: ageDays(ds, d.createdAt) ?? 0 });
        if (r.equipment === "Delayed") delays.push({ ...base, type: "Equipment", detail: "Shipment delayed", days: 0 });
        if (!r.payroll && (daysUntil(ds, c.startDate) ?? 99) <= 7) delays.push({ ...base, type: "Payroll", detail: "Payroll setup incomplete", days: 0 });
      }
      for (const e of ds.exceptions.filter((e) => OPEN_EXC.has(e.status) && /client approval/i.test(e.category))) delays.push({ type: "Client", candidate: nameOf(ds, e.candidateId), client: clientOf(ds, e.candidateId), owner: e.owner ?? "—", detail: e.title, days: ageDays(ds, e.createdAt) ?? 0 });
      const types = [...countBy(delays, (d) => d.type).keys()];
      return {
        kpis: [
          { label: "Active bottlenecks", value: delays.length, tone: "warning" },
          { label: "Candidates affected", value: new Set(delays.map((d) => d.candidate)).size },
          { label: "Biggest bottleneck", value: points(countBy(delays, (d) => d.type))[0]?.label ?? "—", tone: "danger" },
          { label: "Avg age (days)", value: round(avg(delays.map((d) => d.days))), format: "days" },
        ],
        charts: [
          { kind: "bar", title: "Bottlenecks by type", drillKey: "type", points: points(countBy(delays, (d) => d.type), { tone: "warning" }) },
          { kind: "bar", title: "Avg age by type (days)", drillKey: "type", format: "days", points: types.map((t) => ({ label: t, value: round(avg(delays.filter((d) => d.type === t).map((d) => d.days))), tone: "danger" as const })).sort((a, b) => b.value - a.value) },
          { kind: "bar", title: "By client", drillKey: "client", points: points(countBy(delays, (d) => d.client), { limit: 10 }) },
        ],
        table: {
          columns: [
            { key: "type", label: "Bottleneck" },
            { key: "candidate", label: "Candidate" },
            { key: "client", label: "Client" },
            { key: "owner", label: "Owner" },
            { key: "detail", label: "Detail" },
            { key: "days", label: "Age", type: "days" },
          ],
          rows: delays,
          sort: { key: "days", dir: "desc" },
        },
      };
    },
  },
  {
    slug: "forecast-capacity",
    name: "Forecast & Capacity Report",
    description: "Expected starts and new onboardings by week, capacity demand vs supply, and recommended redistribution.",
    section: "manager",
    spec: "§55.5",
    personas: [RM, "executive"],
    owner: "Recruiting Leadership",
    dateScope: "none",
    definitions: [{ term: "Forecast", def: "Scheduled starts plus a trailing-8-week run rate of new onboardings." }],
    load(ds) {
      const upcoming = ds.candidates.filter((c) => isActive(c) && c.startDate && c.startDate > ds.now);
      const recentNew = ds.candidates.filter((c) => (ageDays(ds, c.createdAt) ?? 99) <= 56).length / 8;
      const weeks = forwardWeeks(ds, upcoming, (c) => c.startDate, 8, "info");
      const onboarders = staff(ds, "onboarder").length;
      const supply = onboarders * 6;
      const rows = weeks.map((w) => ({ week: w.label, scheduledStarts: w.value, expectedNew: Math.round(recentNew), demand: w.value + Math.round(recentNew), supply, gap: w.value + Math.round(recentNew) - supply, state: w.value + Math.round(recentNew) > supply ? "Staffing gap" : "Covered" }));
      const byClient = countBy(upcoming, (c) => c.clientName);
      return {
        kpis: [
          { label: "Scheduled starts (8 wk)", value: upcoming.filter((c) => (daysUntil(ds, c.startDate) ?? 99) <= 56).length, tone: "info" },
          { label: "Run-rate new / week", value: round(recentNew) },
          { label: "Weekly capacity", value: supply, hint: `${onboarders} onboarders × 6` },
          { label: "Weeks with gap", value: rows.filter((r) => r.gap > 0).length, tone: "danger" },
        ],
        charts: [
          { kind: "stacked", title: "Demand by week", segments: [{ key: "s", label: "Scheduled starts", tone: "info" }, { key: "n", label: "Expected new", tone: "ai" }], rows: rows.map((r) => ({ label: r.week, drill: r.week, values: { s: r.scheduledStarts, n: r.expectedNew } })), drillKey: "week" },
          { kind: "bar", title: "Upcoming demand by client", points: points(byClient, { limit: 10 }) },
        ],
        table: {
          columns: [
            { key: "week", label: "Week" },
            { key: "scheduledStarts", label: "Scheduled starts", type: "number" },
            { key: "expectedNew", label: "Expected new", type: "number" },
            { key: "demand", label: "Demand", type: "number" },
            { key: "supply", label: "Capacity", type: "number" },
            { key: "gap", label: "Gap", type: "number" },
            { key: "state", label: "State", type: "status" },
          ],
          rows,
        },
        notes: ["Recommended: rebalance new assignments toward the onboarder with the lowest utilization in the Team Workload Distribution report."],
      };
    },
  },
  {
    slug: "coaching-opportunities",
    name: "Coaching Opportunity Report",
    description: "Flags recruiters and onboarders with high rework, drop-off, late handoffs, incomplete data, or SLA misses.",
    section: "manager",
    spec: "§55.6",
    personas: [RM],
    owner: "Recruiting Leadership",
    load(ds) {
      const flags: { person: string; role: string; signal: string; value: number; benchmark: number; severity: string }[] = [];
      const recs = staff(ds, "recruiter");
      const teamDrop = pct(ds.candidates.filter((c) => DROPPED_STATUSES.has(c.status)).length, ds.candidates.length);
      for (const r of recs) {
        const mine = ds.candidates.filter((c) => c.recruiter === r);
        const drop = pct(mine.filter((c) => DROPPED_STATUSES.has(c.status)).length, mine.length);
        if (drop > teamDrop * 1.2) flags.push({ person: r, role: "Recruiter", signal: "High drop-off", value: drop, benchmark: teamDrop, severity: drop > teamDrop * 1.6 ? "High" : "Medium" });
        const missing = pct(mine.filter((c) => !c.phone || !c.workLocation || !c.employmentType).length, mine.length);
        if (missing > 10) flags.push({ person: r, role: "Recruiter", signal: "Incomplete data", value: missing, benchmark: 10, severity: missing > 25 ? "High" : "Medium" });
      }
      const teamRework = pct(ds.documents.filter((d) => ["REJECTED", "CORRECTION_REQUIRED"].includes(d.status)).length, ds.documents.length);
      for (const o of staff(ds, "onboarder")) {
        const docs = ds.documents.filter((d) => d.candidateId && ds.candById.get(d.candidateId)?.onboarder === o);
        const rw = pct(docs.filter((d) => ["REJECTED", "CORRECTION_REQUIRED"].includes(d.status)).length, docs.length);
        if (rw > teamRework * 1.15) flags.push({ person: o, role: "Onboarder", signal: "High rework", value: rw, benchmark: teamRework, severity: rw > teamRework * 1.5 ? "High" : "Medium" });
        const ex = ds.exceptions.filter((e) => e.owner === o && e.resolutionDeadline);
        const miss = pct(ex.filter((e) => slaState(ds, e) === "Breached").length, ex.length);
        if (miss > 20) flags.push({ person: o, role: "Onboarder", signal: "SLA misses", value: miss, benchmark: 20, severity: miss > 35 ? "High" : "Medium" });
      }
      return {
        kpis: [
          { label: "Coaching flags", value: flags.length, tone: "warning" },
          { label: "High severity", value: flags.filter((f) => f.severity === "High").length, tone: "danger" },
          { label: "People flagged", value: new Set(flags.map((f) => f.person)).size },
          { label: "Team drop-off benchmark", value: teamDrop, format: "percent" },
        ],
        charts: [
          { kind: "bar", title: "Flags by signal", drillKey: "signal", points: points(countBy(flags, (f) => f.signal), { tone: "warning" }) },
          { kind: "bar", title: "Flags by person", drillKey: "person", points: points(countBy(flags, (f) => f.person), { tone: "danger" }) },
        ],
        table: {
          columns: [
            { key: "person", label: "Person" },
            { key: "role", label: "Role" },
            { key: "signal", label: "Signal" },
            { key: "value", label: "Value", type: "percent" },
            { key: "benchmark", label: "Benchmark", type: "percent" },
            { key: "severity", label: "Severity", type: "status" },
          ],
          rows: flags,
          sort: { key: "value", dir: "desc" },
        },
      };
    },
  },
  {
    slug: "team-quality",
    name: "Team Quality Report",
    description: "First-pass approval, data correction, complaints, compliance errors, reopened cases, and incorrect package assignment.",
    section: "manager",
    spec: "§55.7",
    personas: [RM, SA],
    owner: "Recruiting Leadership",
    load(ds) {
      const rows = staff(ds, "onboarder").map((o) => {
        const cands = ds.candidates.filter((c) => c.onboarder === o);
        const ids = new Set(cands.map((c) => c.id));
        const docs = ds.documents.filter((d) => d.candidateId && ids.has(d.candidateId));
        const reviewed = docs.filter((d) => d.reviewedBy);
        const ex = ds.exceptions.filter((e) => e.candidateId && ids.has(e.candidateId));
        return {
          owner: o,
          cases: cands.length,
          firstPass: pct(reviewed.filter((d) => d.status === "APPROVED").length, reviewed.length),
          corrections: docs.filter((d) => d.status === "CORRECTION_REQUIRED").length,
          complianceErrors: ex.filter((e) => /identity|tax|bank|authorization|expired/i.test(e.category)).length,
          reopened: ex.filter((e) => e.status === "REOPENED").length,
          complaints: (cands.flatMap((c) => idx(ds).comms.get(c.id) ?? [])).filter((m) => m.direction === "inbound" && /complain|frustrat|issue|problem/i.test(`${m.subject ?? ""} ${m.body ?? ""}`)).length,
        };
      });
      return {
        kpis: [
          { label: "Avg first-pass approval", value: round(avg(rows.map((r) => r.firstPass))), format: "percent", tone: "success" },
          { label: "Corrections requested", value: sum(rows.map((r) => r.corrections)), tone: "warning" },
          { label: "Compliance errors", value: sum(rows.map((r) => r.complianceErrors)), tone: "danger" },
          { label: "Reopened cases", value: sum(rows.map((r) => r.reopened)) },
          { label: "Candidate complaints", value: sum(rows.map((r) => r.complaints)) },
        ],
        charts: [
          { kind: "bar", title: "First-pass approval by onboarder", drillKey: "owner", format: "percent", points: rows.map((r) => ({ label: r.owner, value: r.firstPass, tone: "success" as const })).sort((a, b) => a.value - b.value) },
          { kind: "stacked", title: "Quality issues by onboarder", drillKey: "owner", segments: [{ key: "c", label: "Corrections", tone: "warning" }, { key: "e", label: "Compliance errors", tone: "danger" }, { key: "r", label: "Reopened", tone: "info" }], rows: rows.map((r) => ({ label: r.owner, values: { c: r.corrections, e: r.complianceErrors, r: r.reopened } })) },
        ],
        table: {
          columns: [
            { key: "owner", label: "Onboarder" },
            { key: "cases", label: "Cases", type: "number" },
            { key: "firstPass", label: "First-pass", type: "percent" },
            { key: "corrections", label: "Corrections", type: "number" },
            { key: "complianceErrors", label: "Compliance errors", type: "number" },
            { key: "reopened", label: "Reopened", type: "number" },
            { key: "complaints", label: "Complaints", type: "number" },
          ],
          rows,
          sort: { key: "firstPass", dir: "asc" },
        },
      };
    },
  },
];
