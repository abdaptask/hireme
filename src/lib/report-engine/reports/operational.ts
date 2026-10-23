/**
 * Super Admin operational reports (§51) and executive scorecards (§67).
 */

import type { ReportDef } from "../types";
import {
  AGING_BUCKETS,
  AGING_ORDER,
  DROPPED_STATUSES,
  RISK_ORDER,
  RISK_TONE,
  ageDays,
  avg,
  bucket,
  clientOf,
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
  pct,
  pick,
  points,
  readiness,
  recommendedAction,
  riskFactors,
  round,
  sum,
  title,
  weeklyTrend,
} from "../helpers";
import type { Dataset } from "../dataset";

const SA = "super-admin" as const;
const EX = "executive" as const;

const OPEN_EXC = new Set(["OPEN", "IN_PROGRESS", "REOPENED"]);

/** Non-human audit actors (AI, integrations, schedulers). */
export const SYSTEM_ROLES = new Set(["ai", "integration", "system"]);

/** Exception SLA state (§51.5). */
export function slaState(ds: Dataset, e: Dataset["exceptions"][number]): "Breached" | "Approaching" | "Within SLA" | "No SLA" {
  if (!e.resolutionDeadline) return "No SLA";
  const end = e.resolvedAt ?? (OPEN_EXC.has(e.status) ? ds.now : e.updatedAt);
  if (end > e.resolutionDeadline) return "Breached";
  if (OPEN_EXC.has(e.status) && e.resolutionDeadline.getTime() - ds.now.getTime() < 2 * 86_400_000) return "Approaching";
  return "Within SLA";
}

const DROP_REASONS = [
  "Candidate withdrawal",
  "Compensation issue",
  "Candidate unresponsive",
  "Documentation friction",
  "Client cancellation",
  "Screening failure",
  "Start-date change",
  "Accepted competing offer",
];

const PREVENTABLE = new Set(["Candidate unresponsive", "Documentation friction", "Compensation issue", "Start-date change"]);

/** Drop-off reason for a candidate — attributed from its latest exception, else stable mock (§51.4). */
export function dropReason(ds: Dataset, id: string): string {
  const ex = (idx(ds).exceptions.get(id) ?? []).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  if (ex) {
    if (/unresponsive/i.test(ex.category)) return "Candidate unresponsive";
    if (/screen|background|drug/i.test(ex.category)) return "Screening failure";
    if (/document|tax|bank|signature/i.test(ex.category)) return "Documentation friction";
    if (/start/i.test(ex.category)) return "Start-date change";
    if (/client/i.test(ex.category)) return "Client cancellation";
  }
  return pick(id, DROP_REASONS);
}

export const operationalReports: ReportDef[] = [
  {
    slug: "global-onboarding-volume",
    name: "Global Onboarding Volume",
    description: "Active, new, and completed onboardings with monthly trend and volume by client, employment type, and owner.",
    section: "operational",
    spec: "§51.1",
    personas: [SA, EX],
    owner: "Operations Excellence",
    definitions: [
      { term: "Active onboarding", def: "Candidate in Offer Accepted or Onboarding status." },
      { term: "Completed", def: "Candidate in Placed status." },
    ],
    load(ds) {
      const c = ds.candidates;
      const active = c.filter(isActive);
      const placed = c.filter((x) => x.status === "PLACED");
      const new30 = c.filter((x) => (ageDays(ds, x.createdAt) ?? 99) <= 30);
      const startsNext30 = active.filter((x) => {
        const d = daysUntil(ds, x.startDate);
        return d !== null && d >= 0 && d <= 30;
      });
      const byClient = countBy(c, (x) => x.clientName);
      return {
        kpis: [
          { label: "Active onboardings", value: active.length, tone: "info" },
          { label: "New (last 30 days)", value: new30.length },
          { label: "Completed (placed)", value: placed.length, tone: "success" },
          { label: "Starts next 30 days", value: startsNext30.length },
          { label: "Dropped off", value: c.filter((x) => DROPPED_STATUSES.has(x.status)).length, tone: "danger" },
          { label: "Avg daily new (30d)", value: round(new30.length / 30, 1) },
        ],
        charts: [
          { kind: "trend", title: "New onboardings by month", points: monthlyTrend(ds, c, (x) => x.createdAt, 9) },
          { kind: "bar", title: "Volume by client", drillKey: "client", points: points(byClient, { limit: 12 }) },
          { kind: "bar", title: "By employment type", drillKey: "employment", points: points(countBy(c, (x) => employment(x.employmentType))) },
          { kind: "bar", title: "By onboarder", drillKey: "onboarder", points: points(countBy(active, (x) => x.onboarder), { tone: "ai" }) },
        ],
        table: {
          columns: [
            { key: "candidate", label: "Candidate" },
            { key: "client", label: "Client" },
            { key: "status", label: "Status", type: "status" },
            { key: "stage", label: "Stage" },
            { key: "employment", label: "Employment" },
            { key: "location", label: "Location" },
            { key: "onboarder", label: "Onboarder" },
            { key: "created", label: "Created", type: "date" },
            { key: "start", label: "Start date", type: "date" },
          ],
          rows: c.map((x) => ({
            candidate: fullName(x),
            client: x.clientName ?? "—",
            status: title(x.status),
            stage: x.stage ?? "—",
            employment: employment(x.employmentType),
            location: x.workLocation ?? "—",
            onboarder: x.onboarder ?? "—",
            created: iso(x.createdAt),
            start: iso(x.startDate),
          })),
          sort: { key: "created", dir: "desc" },
        },
      };
    },
  },
  {
    slug: "pipeline-stage",
    name: "Global Pipeline Stage Report",
    description: "Candidate count, time in stage, oldest record, and SLA exposure for every workflow stage.",
    section: "operational",
    spec: "§51.2",
    personas: [SA, "recruiting-manager"],
    owner: "Operations Excellence",
    definitions: [{ term: "Days in stage", def: "Days since the record was last updated (proxy for stage entry)." }],
    load(ds) {
      const STAGES = ["Profile Setup", "Document Submission", "Document Review", "Background Check", "Tax & Payroll", "Client Requirements", "IT Provisioning", "Training", "Day 1 Prep"];
      const active = ds.candidates.filter(isActive);
      const byStage = new Map<string, typeof active>();
      for (const c of active) {
        const s = c.stage ?? "Unassigned";
        byStage.set(s, [...(byStage.get(s) ?? []), c]);
      }
      const order = [...STAGES.filter((s) => byStage.has(s)), ...[...byStage.keys()].filter((s) => !STAGES.includes(s))];
      const rows = order.map((s) => {
        const xs = byStage.get(s) ?? [];
        const days = xs.map((x) => ageDays(ds, x.updatedAt) ?? 0);
        const breaches = xs.filter((x) => (idx(ds).exceptions.get(x.id) ?? []).some((e) => slaState(ds, e) === "Breached")).length;
        const owners = countBy(xs, (x) => x.onboarder);
        const topOwner = [...owners.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
        return {
          stage: s,
          count: xs.length,
          avgDays: round(avg(days)),
          medianDays: median(days),
          oldest: Math.max(0, ...days),
          atRisk: xs.filter((x) => x.risk === "AT_RISK" || x.risk === "UNLIKELY").length,
          breaches,
          owner: topOwner,
        };
      });
      return {
        kpis: [
          { label: "Active in pipeline", value: active.length, tone: "info" },
          { label: "Stages in use", value: rows.length },
          { label: "Avg days in stage", value: round(avg(rows.map((r) => r.avgDays))), format: "days" },
          { label: "Oldest record (days)", value: Math.max(0, ...rows.map((r) => r.oldest)), tone: "warning" },
          { label: "Records with SLA breach", value: sum(rows.map((r) => r.breaches)), tone: "danger" },
        ],
        charts: [
          { kind: "funnel", title: "Pipeline by stage", drillKey: "stage", points: rows.map((r) => ({ label: r.stage, value: r.count, tone: "info" })) },
          { kind: "bar", title: "Average days in stage", drillKey: "stage", format: "days", points: rows.map((r) => ({ label: r.stage, value: r.avgDays, tone: r.avgDays > 7 ? "warning" : "success" })) },
        ],
        table: {
          columns: [
            { key: "stage", label: "Stage" },
            { key: "count", label: "Candidates", type: "number" },
            { key: "avgDays", label: "Avg days", type: "days" },
            { key: "medianDays", label: "Median days", type: "days" },
            { key: "oldest", label: "Oldest", type: "days" },
            { key: "atRisk", label: "At risk", type: "number" },
            { key: "breaches", label: "SLA breaches", type: "number" },
            { key: "owner", label: "Primary owner" },
          ],
          rows,
        },
      };
    },
  },
  {
    slug: "start-date-risk",
    name: "Start-Date Risk Report",
    description: "Every active candidate scored by start-date confidence, with the factors behind the score and the recommended intervention.",
    section: "operational",
    spec: "§51.3 · §33",
    personas: [SA, "onboarder", "account-manager", "recruiting-manager"],
    owner: "Risk Engine",
    definitions: [
      { term: "Risk level", def: "Start-Date Risk Engine output: On Track, Needs Attention, At Risk, Unlikely." },
      { term: "Risk factors", def: "Open documents, screening state, payroll/billing gates, equipment and training status." },
    ],
    load(ds) {
      const active = ds.candidates.filter(isActive);
      const rows = active.map((c) => ({
        candidate: fullName(c),
        client: c.clientName ?? "—",
        risk: title(c.risk),
        start: iso(c.startDate),
        daysToStart: daysUntil(ds, c.startDate),
        progress: c.progress,
        factors: riskFactors(ds, c).join("; ") || "None",
        remaining: readiness(ds, c).openDocs.length,
        owner: c.onboarder ?? "—",
        action: recommendedAction(ds, c),
      }));
      const riskCount = countBy(rows, (r) => r.risk);
      const factorCount = new Map<string, number>();
      for (const c of active) for (const f of riskFactors(ds, c)) {
        const k = f.replace(/^\d+ documents? open$/, "Documents open");
        factorCount.set(k, (factorCount.get(k) ?? 0) + 1);
      }
      return {
        kpis: [
          { label: "Active candidates", value: rows.length },
          { label: "On track", value: riskCount.get("On Track") ?? 0, tone: "success" },
          { label: "Needs attention", value: riskCount.get("Needs Attention") ?? 0, tone: "warning" },
          { label: "At risk / unlikely", value: (riskCount.get("At Risk") ?? 0) + (riskCount.get("Unlikely") ?? 0), tone: "danger" },
          { label: "Starting ≤7 days at risk", value: rows.filter((r) => r.daysToStart !== null && r.daysToStart <= 7 && r.daysToStart >= 0 && r.risk !== "On Track").length, tone: "danger" },
        ],
        charts: [
          { kind: "bar", title: "Candidates by risk level", drillKey: "risk", points: points(riskCount, { order: RISK_ORDER, tones: RISK_TONE }) },
          { kind: "bar", title: "Most common risk factors", points: points(factorCount, { tone: "warning", limit: 8 }) },
          { kind: "bar", title: "At-risk candidates by client", drillKey: "client", points: points(countBy(rows.filter((r) => r.risk !== "On Track"), (r) => r.client), { tone: "danger", limit: 10 }) },
        ],
        table: {
          columns: [
            { key: "candidate", label: "Candidate" },
            { key: "client", label: "Client" },
            { key: "risk", label: "Risk", type: "status" },
            { key: "start", label: "Start", type: "date" },
            { key: "daysToStart", label: "Days to start", type: "days" },
            { key: "progress", label: "Progress", type: "percent" },
            { key: "factors", label: "Risk factors" },
            { key: "owner", label: "Owner" },
            { key: "action", label: "Recommended intervention" },
          ],
          rows,
          sort: { key: "daysToStart", dir: "asc" },
        },
      };
    },
  },
  {
    slug: "drop-off",
    name: "Drop-Off Report",
    description: "Withdrawn, archived, and on-hold candidates by reason, stage, client, and owner — split by preventability.",
    section: "operational",
    spec: "§51.4",
    personas: [SA, "recruiting-manager", EX],
    owner: "Talent Operations",
    definitions: [
      { term: "Drop-off", def: "Candidate moved to Withdrawn or Archived before starting." },
      { term: "Preventable", def: "Reasons the team could influence: unresponsiveness, documentation friction, compensation, start-date changes." },
    ],
    load(ds) {
      const dropped = ds.candidates.filter((c) => DROPPED_STATUSES.has(c.status));
      const rows = dropped.map((c) => {
        const reason = dropReason(ds, c.id);
        return {
          candidate: fullName(c),
          client: c.clientName ?? "—",
          reason,
          preventable: PREVENTABLE.has(reason) ? "Preventable" : "Non-preventable",
          stage: c.stage ?? "—",
          recruiter: c.recruiter ?? "—",
          onboarder: c.onboarder ?? "—",
          daysToDrop: daysBetween(c.createdAt, c.updatedAt),
          date: iso(c.updatedAt),
        };
      });
      const total = ds.candidates.length;
      return {
        kpis: [
          { label: "Drop-offs", value: rows.length, tone: "danger" },
          { label: "Drop-off rate", value: pct(rows.length, total), format: "percent" },
          { label: "Preventable", value: rows.filter((r) => r.preventable === "Preventable").length, tone: "warning" },
          { label: "Avg days to drop", value: round(avg(rows.map((r) => r.daysToDrop))), format: "days" },
          { label: "On hold (watch)", value: ds.candidates.filter((c) => c.status === "ON_HOLD").length, tone: "warning" },
        ],
        charts: [
          { kind: "bar", title: "Drop-off reason", drillKey: "reason", points: points(countBy(rows, (r) => r.reason), { tone: "danger" }) },
          { kind: "bar", title: "Stage of drop-off", drillKey: "stage", points: points(countBy(rows, (r) => r.stage), { tone: "warning" }) },
          { kind: "bar", title: "By recruiter", drillKey: "recruiter", points: points(countBy(rows, (r) => r.recruiter)) },
          { kind: "trend", title: "Drop-offs by month", points: monthlyTrend(ds, dropped, (c) => c.updatedAt, 9, "danger") },
        ],
        table: {
          columns: [
            { key: "candidate", label: "Candidate" },
            { key: "client", label: "Client" },
            { key: "reason", label: "Reason" },
            { key: "preventable", label: "Preventability", type: "status" },
            { key: "stage", label: "Stage" },
            { key: "recruiter", label: "Recruiter" },
            { key: "onboarder", label: "Onboarder" },
            { key: "daysToDrop", label: "Days to drop", type: "days" },
            { key: "date", label: "Date", type: "date" },
          ],
          rows,
          sort: { key: "date", dir: "desc" },
        },
      };
    },
  },
  {
    slug: "sla-performance",
    name: "SLA Performance Report",
    description: "Exceptions within SLA, approaching, and breached — by owner, client, and category with weekly trend.",
    section: "operational",
    spec: "§51.5",
    personas: [SA, "onboarder", "recruiting-manager"],
    owner: "Operations Excellence",
    definitions: [
      { term: "Breached", def: "Resolved after, or still open past, the resolution deadline." },
      { term: "Approaching", def: "Open with less than 48 hours to the deadline." },
    ],
    load(ds) {
      const rows = ds.exceptions.map((e) => {
        const state = slaState(ds, e);
        const end = e.resolvedAt ?? ds.now;
        return {
          title: e.title,
          category: e.category,
          severity: title(e.severity),
          owner: e.owner ?? "Unassigned",
          client: clientOf(ds, e.candidateId),
          sla: state,
          deadline: iso(e.resolutionDeadline),
          breachDays: state === "Breached" && e.resolutionDeadline ? Math.max(0, daysBetween(e.resolutionDeadline, end)) : 0,
          status: title(e.status),
        };
      });
      const withSla = rows.filter((r) => r.sla !== "No SLA");
      const breached = rows.filter((r) => r.sla === "Breached");
      return {
        kpis: [
          { label: "Tracked items", value: withSla.length },
          { label: "SLA compliance", value: pct(withSla.length - breached.length, withSla.length), format: "percent", tone: "success" },
          { label: "Breaches", value: breached.length, tone: "danger" },
          { label: "Approaching", value: rows.filter((r) => r.sla === "Approaching").length, tone: "warning" },
          { label: "Avg breach duration", value: round(avg(breached.map((r) => r.breachDays))), format: "days" },
        ],
        charts: [
          { kind: "bar", title: "SLA status", drillKey: "sla", points: points(countBy(rows, (r) => r.sla), { tones: { Breached: "danger", Approaching: "warning", "Within SLA": "success", "No SLA": "neutral" } }) },
          { kind: "bar", title: "Breaches by owner", drillKey: "owner", points: points(countBy(breached, (r) => r.owner), { tone: "danger" }) },
          { kind: "bar", title: "Breaches by category", drillKey: "category", points: points(countBy(breached, (r) => r.category), { tone: "warning", limit: 10 }) },
          { kind: "trend", title: "Breaches by week created", points: weeklyTrend(ds, ds.exceptions.filter((e) => slaState(ds, e) === "Breached"), (e) => e.createdAt, 12, "danger") },
        ],
        table: {
          columns: [
            { key: "title", label: "Item" },
            { key: "category", label: "Category" },
            { key: "severity", label: "Severity", type: "status" },
            { key: "owner", label: "Owner" },
            { key: "client", label: "Client" },
            { key: "sla", label: "SLA", type: "status" },
            { key: "deadline", label: "Deadline", type: "date" },
            { key: "breachDays", label: "Breach days", type: "days" },
            { key: "status", label: "Status", type: "status" },
          ],
          rows,
          sort: { key: "breachDays", dir: "desc" },
        },
      };
    },
  },
  {
    slug: "global-exceptions",
    name: "Global Exception Report",
    description: "Exception volume by category and severity, open age, owners, root causes, client and start-date impact.",
    section: "operational",
    spec: "§51.6 · §18",
    personas: [SA, "onboarder"],
    owner: "Exception Control Tower",
    load(ds) {
      const ex = ds.exceptions;
      const open = ex.filter((e) => OPEN_EXC.has(e.status));
      const resolved = ex.filter((e) => e.resolvedAt);
      const rows = ex.map((e) => ({
        title: e.title,
        category: e.category,
        severity: title(e.severity),
        status: title(e.status),
        candidate: e.candidateId ? fullName(ds.candById.get(e.candidateId) ?? { firstName: "—", lastName: "" }) : "—",
        client: clientOf(ds, e.candidateId),
        owner: e.owner ?? "Unassigned",
        age: OPEN_EXC.has(e.status) ? ageDays(ds, e.createdAt) : null,
        resolutionDays: e.resolvedAt ? daysBetween(e.createdAt, e.resolvedAt) : null,
        startImpact: e.startDateImpact ? "Yes" : "No",
        clientVisible: e.clientVisible ? "Yes" : "No",
      }));
      return {
        kpis: [
          { label: "Total exceptions", value: ex.length },
          { label: "Open", value: open.length, tone: "warning" },
          { label: "Critical open", value: open.filter((e) => e.severity === "CRITICAL").length, tone: "danger" },
          { label: "Reopened", value: ex.filter((e) => e.status === "REOPENED").length, tone: "warning" },
          { label: "Avg resolution", value: round(avg(resolved.map((e) => daysBetween(e.createdAt, e.resolvedAt as Date)))), format: "days" },
          { label: "Start-date impact", value: open.filter((e) => e.startDateImpact).length, tone: "danger" },
        ],
        charts: [
          { kind: "bar", title: "Root-cause Pareto (by category)", drillKey: "category", points: points(countBy(ex, (e) => e.category), { tone: "warning", limit: 12 }) },
          {
            kind: "stacked",
            title: "Open exceptions by severity and owner",
            drillKey: "owner",
            segments: [
              { key: "CRITICAL", label: "Critical", tone: "danger" },
              { key: "HIGH", label: "High", tone: "warning" },
              { key: "MEDIUM", label: "Medium", tone: "info" },
              { key: "LOW", label: "Low", tone: "neutral" },
            ],
            rows: [...countBy(open, (e) => e.owner).keys()].map((o) => ({
              label: o,
              values: Object.fromEntries(["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((s) => [s, open.filter((e) => (e.owner ?? "Unassigned") === o && e.severity === s).length])),
            })),
          },
          { kind: "bar", title: "Open age", drillKey: "ageBucket", points: points(countBy(open, (e) => bucket(ageDays(ds, e.createdAt) ?? 0, AGING_BUCKETS)), { order: AGING_ORDER, tone: "info" }) },
          { kind: "trend", title: "Exceptions created per week", points: weeklyTrend(ds, ex, (e) => e.createdAt, 12, "warning") },
        ],
        table: {
          columns: [
            { key: "title", label: "Exception" },
            { key: "category", label: "Category" },
            { key: "severity", label: "Severity", type: "status" },
            { key: "status", label: "Status", type: "status" },
            { key: "candidate", label: "Candidate" },
            { key: "client", label: "Client" },
            { key: "owner", label: "Owner" },
            { key: "age", label: "Open age", type: "days" },
            { key: "ageBucket", label: "Age bucket" },
            { key: "resolutionDays", label: "Resolution", type: "days" },
            { key: "startImpact", label: "Start impact", type: "status" },
          ],
          rows: rows.map((r) => ({ ...r, ageBucket: r.age === null ? "Closed" : bucket(r.age, AGING_BUCKETS) })),
          sort: { key: "age", dir: "desc" },
        },
      };
    },
  },
  {
    slug: "package-performance",
    name: "Package Performance Report",
    description: "Generated vs completed packages, completion and correction rates, version performance, and the forms causing delays.",
    section: "operational",
    spec: "§51.7",
    personas: [SA, "onboarder", "account-manager"],
    owner: "Package Governance",
    load(ds) {
      const pk = ds.packages;
      const docRejectByClient = new Map<string, { total: number; rejected: number }>();
      for (const d of ds.documents) {
        const cl = clientOf(ds, d.candidateId);
        const v = docRejectByClient.get(cl) ?? { total: 0, rejected: 0 };
        v.total++;
        if (d.status === "REJECTED" || d.status === "CORRECTION_REQUIRED") v.rejected++;
        docRejectByClient.set(cl, v);
      }
      const rows = pk.map((p) => {
        const cl = p.client?.name ?? "—";
        const rr = docRejectByClient.get(cl);
        return {
          package: p.name,
          version: `v${p.version}`,
          client: cl,
          status: title(p.status),
          items: p.items.length,
          required: p.items.filter((i) => i.required).length,
          waived: p.items.filter((i) => i.status === "WAIVED").length,
          completion: p.completionPct,
          rework: rr ? pct(rr.rejected, rr.total) : 0,
          risk: p.riskScore,
          ai: title(p.aiReviewStatus),
          dispatches: p.dispatches.length,
        };
      });
      const slowForms = countBy(ds.documents.filter((d) => ["REJECTED", "CORRECTION_REQUIRED", "PENDING"].includes(d.status)), (d) => d.name);
      return {
        kpis: [
          { label: "Packages", value: pk.length },
          { label: "Published", value: pk.filter((p) => p.status === "PUBLISHED").length, tone: "success" },
          { label: "In review / draft", value: pk.filter((p) => p.status === "IN_REVIEW" || p.status === "DRAFT").length, tone: "info" },
          { label: "Avg completion", value: round(avg(pk.map((p) => p.completionPct))), format: "percent" },
          { label: "Avg items / package", value: round(avg(pk.map((p) => p.items.length))) },
          { label: "Dispatches", value: sum(pk.map((p) => p.dispatches.length)) },
        ],
        charts: [
          { kind: "bar", title: "Packages by status", drillKey: "status", points: points(countBy(rows, (r) => r.status)) },
          { kind: "bar", title: "Forms causing delays", points: points(slowForms, { tone: "warning", limit: 10 }) },
          { kind: "bar", title: "Rework rate by client", drillKey: "client", format: "percent", points: [...docRejectByClient.entries()].filter(([k]) => k !== "—").map(([k, v]) => ({ label: k, value: pct(v.rejected, v.total), tone: "danger" as const })).sort((a, b) => b.value - a.value).slice(0, 12) },
        ],
        table: {
          columns: [
            { key: "package", label: "Package" },
            { key: "version", label: "Version" },
            { key: "client", label: "Client" },
            { key: "status", label: "Status", type: "status" },
            { key: "items", label: "Items", type: "number" },
            { key: "required", label: "Required", type: "number" },
            { key: "waived", label: "Waived", type: "number" },
            { key: "completion", label: "Completion", type: "percent" },
            { key: "rework", label: "Client rework rate", type: "percent" },
            { key: "risk", label: "Risk score", type: "number" },
            { key: "ai", label: "AI review", type: "status" },
          ],
          rows,
          sort: { key: "completion", dir: "asc" },
        },
      };
    },
  },
  {
    slug: "workflow-efficiency",
    name: "Workflow Efficiency Report",
    description: "Automation rate, manual interventions, and overrides across workflow activity, by entity and actor type.",
    section: "operational",
    spec: "§51.8 · §64.4",
    personas: [SA, EX],
    owner: "Workflow Studio",
    definitions: [
      { term: "Automated step", def: "Audit event performed by AI, automation, or an integration (no human actor)." },
      { term: "Manual intervention", def: "Override, escalation, or manual update by a person." },
    ],
    load(ds) {
      const ev = ds.auditEvents;
      const isAuto = (e: (typeof ev)[number]) => e.aiInvolved || e.action === "AI_ACTION" || e.action === "INTEGRATION_EVENT" || SYSTEM_ROLES.has(e.actorRole ?? "");
      const byEntity = new Map<string, { total: number; auto: number; overrides: number; escalations: number }>();
      for (const e of ev) {
        const v = byEntity.get(e.entityType) ?? { total: 0, auto: 0, overrides: 0, escalations: 0 };
        v.total++;
        if (isAuto(e)) v.auto++;
        if (e.action === "OVERRIDDEN") v.overrides++;
        if (e.action === "ESCALATED") v.escalations++;
        byEntity.set(e.entityType, v);
      }
      const auto = ev.filter(isAuto);
      const rows = [...byEntity.entries()].map(([entity, v]) => ({
        entity,
        steps: v.total,
        automated: v.auto,
        manual: v.total - v.auto,
        automationRate: pct(v.auto, v.total),
        overrides: v.overrides,
        escalations: v.escalations,
        hoursSaved: round((v.auto * 6) / 60, 1),
      }));
      return {
        kpis: [
          { label: "Workflow steps (90d)", value: ev.length },
          { label: "Automation rate", value: pct(auto.length, ev.length), format: "percent", tone: "ai" },
          { label: "Manual interventions", value: ev.length - auto.length },
          { label: "Overrides", value: ev.filter((e) => e.action === "OVERRIDDEN").length, tone: "warning" },
          { label: "Est. hours saved", value: round((auto.length * 6) / 60), hint: "6 min per automated step" },
        ],
        charts: [
          { kind: "bar", title: "Automation rate by entity", drillKey: "entity", format: "percent", points: rows.map((r) => ({ label: r.entity, value: r.automationRate, tone: "ai" as const })).sort((a, b) => b.value - a.value) },
          { kind: "trend", title: "Automated steps per week", points: weeklyTrend(ds, auto, (e) => e.timestamp, 12, "ai") },
          { kind: "bar", title: "Actions by type", points: points(countBy(ev, (e) => title(e.action))) },
        ],
        table: {
          columns: [
            { key: "entity", label: "Entity" },
            { key: "steps", label: "Steps", type: "number" },
            { key: "automated", label: "Automated", type: "number" },
            { key: "manual", label: "Manual", type: "number" },
            { key: "automationRate", label: "Automation rate", type: "percent" },
            { key: "overrides", label: "Overrides", type: "number" },
            { key: "escalations", label: "Escalations", type: "number" },
            { key: "hoursSaved", label: "Hours saved", type: "number" },
          ],
          rows,
          sort: { key: "steps", dir: "desc" },
        },
      };
    },
  },
  {
    slug: "system-health",
    name: "System Health Report",
    description: "Connector availability, latency, queue backlog, error rate, and delivery health across the platform.",
    section: "operational",
    spec: "§51.9",
    personas: [SA],
    owner: "Platform Engineering",
    load(ds) {
      const it = ds.integrations;
      const ev = ds.integrationEvents;
      const failed = ev.filter((e) => e.status !== "success");
      const comms = ds.communications;
      const commFail = comms.filter((c) => ["failed", "bounced"].includes(c.status));
      return {
        kpis: [
          { label: "Avg uptime (30d)", value: round(avg(it.map((i) => i.uptime30d)), 2), format: "percent", tone: "success" },
          { label: "Avg API latency", value: `${Math.round(avg(ev.map((e) => e.latencyMs)))} ms` },
          { label: "Queue backlog", value: sum(it.map((i) => i.queueDepth)), tone: "warning" },
          { label: "Error rate (14d)", value: pct(failed.length, ev.length, 2), format: "percent", tone: "danger" },
          { label: "Message delivery", value: pct(comms.length - commFail.length, comms.length), format: "percent", tone: "info" },
          { label: "Degraded / error", value: it.filter((i) => i.status === "DEGRADED" || i.status === "ERROR").length, tone: "danger" },
        ],
        charts: [
          { kind: "bar", title: "Connector status", drillKey: "status", points: points(countBy(it, (i) => title(i.status)), { tones: { Connected: "success", Degraded: "warning", Error: "danger", Disconnected: "neutral", Scheduled: "info" } }) },
          { kind: "bar", title: "Average latency by connector (ms)", drillKey: "connector", points: it.map((i) => ({ label: i.name, value: i.avgLatencyMs, tone: i.avgLatencyMs > 800 ? ("warning" as const) : ("info" as const) })).sort((a, b) => b.value - a.value).slice(0, 12) },
          { kind: "trend", title: "Failed transactions per day (14d)", points: Array.from({ length: 14 }, (_, k) => {
            const day = new Date(ds.now.getTime() - (13 - k) * 86_400_000);
            const key = iso(day);
            return { label: day.toLocaleString("en-US", { month: "short", day: "numeric" }), value: failed.filter((e) => iso(e.timestamp) === key).length, tone: "danger" as const };
          }) },
        ],
        table: {
          columns: [
            { key: "connector", label: "Connector" },
            { key: "category", label: "Category" },
            { key: "status", label: "Status", type: "status" },
            { key: "uptime", label: "Uptime 30d", type: "percent" },
            { key: "latency", label: "Latency (ms)", type: "number" },
            { key: "queue", label: "Queue", type: "number" },
            { key: "success", label: "Success rate", type: "percent" },
            { key: "errorsToday", label: "Errors today", type: "number" },
            { key: "lastSync", label: "Last sync", type: "date" },
          ],
          rows: it.map((i) => ({
            connector: i.name,
            category: i.category,
            status: title(i.status),
            uptime: i.uptime30d,
            latency: i.avgLatencyMs,
            queue: i.queueDepth,
            success: i.successRate,
            errorsToday: i.totalErrorsToday,
            lastSync: iso(i.lastSync),
          })),
          sort: { key: "uptime", dir: "asc" },
        },
      };
    },
  },
  {
    slug: "user-activity",
    name: "User Activity Report",
    description: "Actions, approvals, overrides, exports, and after-hours activity for every platform user.",
    section: "operational",
    spec: "§51.10",
    personas: [SA],
    owner: "Security & Compliance",
    definitions: [{ term: "After hours", def: "Activity before 7:00 or after 19:00 local, or on weekends." }],
    load(ds) {
      const ev = ds.auditEvents.filter((e) => !SYSTEM_ROLES.has(e.actorRole ?? ""));
      const afterHours = (d: Date) => d.getHours() < 7 || d.getHours() >= 19 || d.getDay() === 0 || d.getDay() === 6;
      const byActor = new Map<string, typeof ev>();
      for (const e of ev) byActor.set(e.actor, [...(byActor.get(e.actor) ?? []), e]);
      const rows = [...byActor.entries()].map(([actor, xs]) => ({
        user: actor,
        role: xs[0].actorRole ?? "—",
        actions: xs.length,
        approvals: xs.filter((e) => e.action === "APPROVED").length,
        rejections: xs.filter((e) => e.action === "REJECTED").length,
        overrides: xs.filter((e) => e.action === "OVERRIDDEN").length,
        exports: xs.filter((e) => e.action === "EXPORTED").length,
        afterHours: xs.filter((e) => afterHours(e.timestamp)).length,
        lastActive: iso(xs.reduce((a, b) => (a.timestamp > b.timestamp ? a : b)).timestamp),
        status: (ageDays(ds, xs.reduce((a, b) => (a.timestamp > b.timestamp ? a : b)).timestamp) ?? 0) > 14 ? "Inactive" : "Active",
      }));
      return {
        kpis: [
          { label: "Active users", value: rows.filter((r) => r.status === "Active").length, tone: "success" },
          { label: "Inactive (14d+)", value: rows.filter((r) => r.status === "Inactive").length, tone: "warning" },
          { label: "Actions (90d)", value: ev.length },
          { label: "Overrides", value: sum(rows.map((r) => r.overrides)), tone: "warning" },
          { label: "Exports", value: sum(rows.map((r) => r.exports)) },
          { label: "After-hours actions", value: sum(rows.map((r) => r.afterHours)), tone: "danger" },
        ],
        charts: [
          { kind: "bar", title: "Most active users", drillKey: "user", points: rows.map((r) => ({ label: r.user, value: r.actions, tone: "info" as const })).sort((a, b) => b.value - a.value).slice(0, 12) },
          { kind: "bar", title: "Actions by role", drillKey: "role", points: points(countBy(ev, (e) => e.actorRole)) },
          { kind: "trend", title: "User actions per week", points: weeklyTrend(ds, ev, (e) => e.timestamp, 12) },
        ],
        table: {
          columns: [
            { key: "user", label: "User" },
            { key: "role", label: "Role" },
            { key: "actions", label: "Actions", type: "number" },
            { key: "approvals", label: "Approvals", type: "number" },
            { key: "rejections", label: "Rejections", type: "number" },
            { key: "overrides", label: "Overrides", type: "number" },
            { key: "exports", label: "Exports", type: "number" },
            { key: "afterHours", label: "After hours", type: "number" },
            { key: "lastActive", label: "Last active", type: "date" },
            { key: "status", label: "Status", type: "status" },
          ],
          rows,
          sort: { key: "actions", dir: "desc" },
        },
      };
    },
  },

  // ── Executive (§67) ──────────────────────────────────────
  {
    slug: "executive-scorecard",
    name: "Executive Workforce Onboarding Scorecard",
    description: "Board-level view of volume, completion, start-date success, time-to-onboard, drop-off, compliance, automation, and revenue at risk.",
    section: "executive",
    spec: "§67.1",
    personas: [EX, SA],
    owner: "Executive Office",
    load(ds) {
      const c = ds.candidates;
      const placed = c.filter((x) => x.status === "PLACED");
      const dropped = c.filter((x) => DROPPED_STATUSES.has(x.status));
      const tto = placed.filter((x) => x.startDate).map((x) => Math.max(1, daysBetween(x.createdAt, x.startDate as Date)));
      const docsApproved = ds.documents.filter((d) => d.status === "APPROVED").length;
      const audit = ds.auditEvents;
      const autoRate = pct(audit.filter((e) => e.aiInvolved || e.action === "AI_ACTION" || e.action === "INTEGRATION_EVENT").length, audit.length);
      const revenueAtRisk = c.filter((x) => isActive(x) && x.billing?.status !== "READY" && (daysUntil(ds, x.startDate) ?? 99) <= 14).length * 85 * 40 * 4;
      const clientRows = ds.clients.map((cl) => ({
        client: cl.name,
        industry: cl.industry,
        active: c.filter((x) => x.clientName === cl.name && isActive(x)).length,
        placed: c.filter((x) => x.clientName === cl.name && x.status === "PLACED").length,
        onboardingDays: cl.avgOnboardingDays,
        compliance: cl.compliancePassRate,
        startSuccess: cl.startDateSuccessRate,
        status: title(cl.status),
      }));
      return {
        kpis: [
          { label: "Total onboardings", value: c.length },
          { label: "Completion rate", value: pct(placed.length, placed.length + dropped.length), format: "percent", tone: "success" },
          { label: "Start-date success", value: round(avg(ds.clients.map((x) => x.startDateSuccessRate))), format: "percent", tone: "success" },
          { label: "Avg time-to-onboard", value: round(avg(tto)), format: "days" },
          { label: "Drop-off rate", value: pct(dropped.length, c.length), format: "percent", tone: "danger" },
          { label: "Compliance pass rate", value: pct(docsApproved, ds.documents.length), format: "percent" },
          { label: "Automation rate", value: autoRate, format: "percent", tone: "ai" },
          { label: "Revenue at risk (4 wk)", value: revenueAtRisk, format: "currency", tone: "danger" },
        ],
        charts: [
          { kind: "trend", title: "Placements by start month", points: monthlyTrend(ds, placed, (x) => x.startDate, 9, "success") },
          { kind: "bar", title: "Start-date success by client", drillKey: "client", format: "percent", points: clientRows.map((r) => ({ label: r.client, value: r.startSuccess, tone: r.startSuccess < 85 ? ("danger" as const) : ("success" as const) })).sort((a, b) => a.value - b.value).slice(0, 12) },
          { kind: "bar", title: "Active onboardings by industry", points: points(countBy(c.filter(isActive), (x) => ds.clients.find((cl) => cl.name === x.clientName)?.industry ?? "Other")) },
        ],
        table: {
          title: "Client portfolio",
          columns: [
            { key: "client", label: "Client" },
            { key: "industry", label: "Industry" },
            { key: "active", label: "Active", type: "number" },
            { key: "placed", label: "Placed", type: "number" },
            { key: "onboardingDays", label: "Avg onboarding", type: "days" },
            { key: "compliance", label: "Compliance", type: "percent" },
            { key: "startSuccess", label: "Start success", type: "percent" },
            { key: "status", label: "Status", type: "status" },
          ],
          rows: clientRows,
          sort: { key: "active", dir: "desc" },
        },
      };
    },
  },
  {
    slug: "operational-efficiency",
    name: "Operational Efficiency Report",
    description: "Manual vs automated effort, rework, SLA performance, exception volume, and productivity trend.",
    section: "executive",
    spec: "§67.3",
    personas: [EX, SA, "recruiting-manager"],
    owner: "Executive Office",
    load(ds) {
      const months = monthlyTrend(ds, ds.candidates.filter((c) => c.status === "PLACED"), (c) => c.startDate, 9, "success");
      const ex = ds.exceptions;
      const withSla = ex.filter((e) => e.resolutionDeadline);
      const breached = withSla.filter((e) => slaState(ds, e) === "Breached");
      const docs = ds.documents;
      const rework = docs.filter((d) => d.status === "REJECTED" || d.status === "CORRECTION_REQUIRED");
      const owners = countBy(ds.candidates.filter(isActive), (c) => c.onboarder);
      return {
        kpis: [
          { label: "Placements (9 mo)", value: sum(months.map((m) => m.value)), tone: "success" },
          { label: "Rework rate", value: pct(rework.length, docs.length), format: "percent", tone: "warning" },
          { label: "SLA compliance", value: pct(withSla.length - breached.length, withSla.length), format: "percent" },
          { label: "Open exceptions", value: ex.filter((e) => OPEN_EXC.has(e.status)).length, tone: "warning" },
          { label: "Active per onboarder", value: round(avg([...owners.values()])) },
        ],
        charts: [
          { kind: "trend", title: "Productivity trend (placements per month)", points: months },
          { kind: "trend", title: "Rework per week", points: weeklyTrend(ds, rework, (d) => d.updatedAt, 12, "warning") },
          { kind: "bar", title: "Exceptions by category", drillKey: "category", points: points(countBy(ex, (e) => e.category), { tone: "warning", limit: 10 }) },
        ],
        table: {
          title: "Onboarder efficiency",
          columns: [
            { key: "onboarder", label: "Onboarder" },
            { key: "active", label: "Active", type: "number" },
            { key: "docsReviewed", label: "Docs reviewed", type: "number" },
            { key: "exceptions", label: "Open exceptions", type: "number" },
            { key: "breaches", label: "SLA breaches", type: "number" },
          ],
          rows: [...owners.entries()].map(([o, n]) => ({
            onboarder: o,
            active: n,
            docsReviewed: docs.filter((d) => d.reviewedBy === o).length,
            exceptions: ex.filter((e) => e.owner === o && OPEN_EXC.has(e.status)).length,
            breaches: breached.filter((e) => e.owner === o).length,
          })),
          sort: { key: "active", dir: "desc" },
        },
      };
    },
  },
  {
    slug: "financial-impact",
    name: "Financial Impact Report",
    description: "Cost per onboarding, screening and equipment spend, rework and drop-off cost, revenue at risk, and cost avoided through automation.",
    section: "executive",
    spec: "§67.4",
    personas: [EX, SA, "account-manager"],
    owner: "Finance",
    definitions: [
      { term: "Equipment cost", def: "Standard unit cost by asset type (laptop $1,450, monitor $260, phone $620, headset $120, token $45, badge $15)." },
      { term: "Rework cost", def: "$38 per rejected or corrected document (avg 45 min reviewer time)." },
      { term: "Drop-off cost", def: "$1,250 sunk cost per dropped candidate (screening, setup, recruiter time)." },
    ],
    load(ds) {
      const UNIT: Record<string, number> = { laptop: 1450, monitor: 260, phone: 620, headset: 120, "security token": 45, token: 45, badge: 15 };
      const eqCost = (t: string) => UNIT[t.toLowerCase()] ?? 200;
      const clients = ds.clients.map((cl) => {
        const cands = ds.candidates.filter((c) => c.clientName === cl.name);
        const ids = new Set(cands.map((c) => c.id));
        const screening = sum(ds.screenings.filter((s) => s.candidateId && ids.has(s.candidateId)).map((s) => s.cost ?? 0));
        const equipment = sum(ds.equipment.filter((e) => e.candidateId && ids.has(e.candidateId)).map((e) => eqCost(e.assetType)));
        const rework = ds.documents.filter((d) => d.candidateId && ids.has(d.candidateId) && ["REJECTED", "CORRECTION_REQUIRED"].includes(d.status)).length * 38;
        const dropoff = cands.filter((c) => DROPPED_STATUSES.has(c.status)).length * 1250;
        const total = screening + equipment + rework + dropoff;
        return { client: cl.name, onboardings: cands.length, screening: Math.round(screening), equipment, rework, dropoff, total: Math.round(total), perOnboarding: cands.length ? Math.round(total / cands.length) : 0 };
      }).filter((r) => r.onboardings > 0);
      const t = (k: "screening" | "equipment" | "rework" | "dropoff" | "total") => sum(clients.map((r) => r[k]));
      const auto = ds.auditEvents.filter((e) => e.aiInvolved || e.action === "AI_ACTION" || e.action === "INTEGRATION_EVENT").length;
      return {
        kpis: [
          { label: "Total onboarding cost", value: t("total"), format: "currency" },
          { label: "Cost per onboarding", value: Math.round(t("total") / Math.max(1, sum(clients.map((r) => r.onboardings)))), format: "currency" },
          { label: "Screening spend", value: t("screening"), format: "currency" },
          { label: "Equipment spend", value: t("equipment"), format: "currency" },
          { label: "Rework + drop-off cost", value: t("rework") + t("dropoff"), format: "currency", tone: "danger" },
          { label: "Cost avoided (automation)", value: auto * 6, format: "currency", tone: "success", hint: "$6 per automated step" },
        ],
        charts: [
          { kind: "bar", title: "Cost mix", format: "currency", points: [
            { label: "Screening", value: t("screening"), tone: "info" },
            { label: "Equipment", value: t("equipment"), tone: "ai" },
            { label: "Rework", value: t("rework"), tone: "warning" },
            { label: "Drop-off", value: t("dropoff"), tone: "danger" },
          ] },
          { kind: "bar", title: "Cost per onboarding by client", drillKey: "client", format: "currency", points: clients.map((r) => ({ label: r.client, value: r.perOnboarding, tone: "info" as const })).sort((a, b) => b.value - a.value).slice(0, 12) },
        ],
        table: {
          columns: [
            { key: "client", label: "Client" },
            { key: "onboardings", label: "Onboardings", type: "number" },
            { key: "screening", label: "Screening", type: "currency" },
            { key: "equipment", label: "Equipment", type: "currency" },
            { key: "rework", label: "Rework", type: "currency" },
            { key: "dropoff", label: "Drop-off", type: "currency" },
            { key: "total", label: "Total", type: "currency" },
            { key: "perOnboarding", label: "Per onboarding", type: "currency" },
          ],
          rows: clients,
          sort: { key: "total", dir: "desc" },
        },
      };
    },
  },
  {
    slug: "risk-compliance-executive",
    name: "Risk & Compliance Executive Report",
    description: "High-risk candidates, compliance exceptions, screening delays, expiring authorizations, and policy gaps in one view.",
    section: "executive",
    spec: "§67.6",
    personas: [EX, SA],
    owner: "Chief Compliance Officer",
    load(ds) {
      const highRisk = ds.candidates.filter((c) => isActive(c) && (c.risk === "AT_RISK" || c.risk === "UNLIKELY"));
      const compEx = ds.exceptions.filter((e) => OPEN_EXC.has(e.status) && /document|identity|expired|authorization|tax|bank|duplicate/i.test(e.category));
      const delayed = ds.screenings.filter((s) => s.status === "VENDOR_DELAYED" || (s.estimatedCompletion && s.estimatedCompletion < ds.now && !s.completedAt));
      const expiring = ds.documents.filter((d) => d.expiresAt && (daysUntil(ds, d.expiresAt) ?? 999) <= 90 && (daysUntil(ds, d.expiresAt) ?? -1) >= 0);
      const overrides = ds.auditEvents.filter((e) => e.action === "OVERRIDDEN");
      const rows = [
        ...highRisk.map((c) => ({ area: "Start-date risk", item: fullName(c), client: c.clientName ?? "—", detail: riskFactors(ds, c).join("; ") || "—", severity: title(c.risk), date: iso(c.startDate) })),
        ...compEx.map((e) => ({ area: "Compliance exception", item: e.title, client: clientOf(ds, e.candidateId), detail: e.category, severity: title(e.severity), date: iso(e.createdAt) })),
        ...delayed.map((s) => ({ area: "Screening delay", item: `${s.vendor} — ${s.packageType ?? "screening"}`, client: clientOf(ds, s.candidateId), detail: `Ordered ${iso(s.orderedAt) ?? "—"}`, severity: "Delayed", date: iso(s.estimatedCompletion) })),
        ...expiring.map((d) => ({ area: "Expiring authorization", item: `${d.name} — ${nameOf(ds, d.candidateId)}`, client: clientOf(ds, d.candidateId), detail: `${daysUntil(ds, d.expiresAt)} days left`, severity: (daysUntil(ds, d.expiresAt) ?? 99) <= 30 ? "High" : "Medium", date: iso(d.expiresAt) })),
      ];
      return {
        kpis: [
          { label: "High-risk candidates", value: highRisk.length, tone: "danger" },
          { label: "Compliance exceptions", value: compEx.length, tone: "warning" },
          { label: "Screening delays", value: delayed.length, tone: "warning" },
          { label: "Expiring ≤90 days", value: expiring.length, tone: "info" },
          { label: "Overrides (90d)", value: overrides.length },
        ],
        charts: [
          { kind: "bar", title: "Risk items by area", drillKey: "area", points: points(countBy(rows, (r) => r.area), { tone: "danger" }) },
          { kind: "bar", title: "Risk items by client", drillKey: "client", points: points(countBy(rows, (r) => r.client), { tone: "warning", limit: 12 }) },
        ],
        table: {
          columns: [
            { key: "area", label: "Area" },
            { key: "item", label: "Item" },
            { key: "client", label: "Client" },
            { key: "detail", label: "Detail" },
            { key: "severity", label: "Severity", type: "status" },
            { key: "date", label: "Date", type: "date" },
          ],
          rows,
        },
      };
    },
  },
  {
    slug: "workforce-experience",
    name: "Workforce Experience Report",
    description: "Candidate engagement and effort signals: response rates, portal activity, Day 1 readiness, and complaint trends.",
    section: "executive",
    spec: "§67.5 · §35",
    personas: [EX, "recruiting-manager"],
    owner: "Candidate Experience",
    definitions: [{ term: "Satisfaction (est.)", def: "Modeled from response rate, rework, and exceptions until survey data is connected (§35)." }],
    load(ds) {
      const rows = ds.candidates.filter((c) => c.status !== "NEW").map((c) => {
        const comms = idx(ds).comms.get(c.id) ?? [];
        const outbound = comms.filter((m) => m.direction === "outbound");
        const responded = outbound.filter((m) => m.respondedAt).length;
        const rework = (idx(ds).docs.get(c.id) ?? []).filter((d) => ["REJECTED", "CORRECTION_REQUIRED"].includes(d.status)).length;
        const exc = (idx(ds).exceptions.get(c.id) ?? []).length;
        const responseRate = pct(responded, outbound.length);
        const csat = Math.max(1, Math.min(5, round(4.6 - rework * 0.35 - exc * 0.25 + (responseRate - 50) / 200, 1)));
        return { candidate: fullName(c), client: c.clientName ?? "—", recruiter: c.recruiter ?? "—", messages: comms.length, responseRate, rework, exceptions: exc, csat, effort: rework + exc > 2 ? "High" : rework + exc > 0 ? "Medium" : "Low" };
      });
      return {
        kpis: [
          { label: "Est. satisfaction", value: `${round(avg(rows.map((r) => r.csat)))} / 5`, tone: "success" },
          { label: "Avg response rate", value: round(avg(rows.map((r) => r.responseRate))), format: "percent" },
          { label: "High-effort journeys", value: rows.filter((r) => r.effort === "High").length, tone: "warning" },
          { label: "Messages exchanged", value: sum(rows.map((r) => r.messages)) },
        ],
        charts: [
          { kind: "bar", title: "Candidate effort", drillKey: "effort", points: points(countBy(rows, (r) => r.effort), { order: ["Low", "Medium", "High"], tones: { Low: "success", Medium: "warning", High: "danger" } }) },
          { kind: "bar", title: "Avg satisfaction by client", drillKey: "client", points: [...countBy(rows, (r) => r.client).keys()].map((k) => ({ label: k, value: round(avg(rows.filter((r) => r.client === k).map((r) => r.csat))), tone: "success" as const })).sort((a, b) => a.value - b.value).slice(0, 12) },
        ],
        table: {
          columns: [
            { key: "candidate", label: "Candidate" },
            { key: "client", label: "Client" },
            { key: "recruiter", label: "Recruiter" },
            { key: "messages", label: "Messages", type: "number" },
            { key: "responseRate", label: "Response rate", type: "percent" },
            { key: "rework", label: "Rework", type: "number" },
            { key: "exceptions", label: "Exceptions", type: "number" },
            { key: "csat", label: "Est. CSAT", type: "number" },
            { key: "effort", label: "Effort", type: "status" },
          ],
          rows,
          sort: { key: "csat", dir: "asc" },
        },
      };
    },
  },
];

export { OPEN_EXC };
