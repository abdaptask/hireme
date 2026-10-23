/**
 * Client & account reports (§56), payroll (§59), billing (§60), and
 * offboarding / lifecycle (§68).
 */

import type { ReportDef } from "../types";
import {
  RISK_ORDER,
  RISK_TONE,
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
  nameOf,
  clientOf,
  pct,
  points,
  readiness,
  round,
  sum,
  title,
} from "../helpers";
import type { Dataset, DsCandidate } from "../dataset";
import { OPEN_EXC, slaState } from "./operational";

const AM = "account-manager" as const;
const SA = "super-admin" as const;
const EX = "executive" as const;
const ON = "onboarder" as const;

const PAYROLL_CHECKS: [keyof NonNullable<DsCandidate["payroll"]>, string][] = [
  ["classification", "Employment classification"],
  ["payRate", "Pay rate"],
  ["overtimeRules", "Overtime rules"],
  ["taxJurisdiction", "Tax jurisdiction"],
  ["directDeposit", "Direct deposit"],
  ["w4", "W-4"],
  ["stateTax", "State tax forms"],
  ["i9", "I-9"],
  ["benefitsEligibility", "Benefits eligibility"],
  ["payrollEntity", "Payroll entity"],
  ["startDateSet", "Start date"],
];

const BILLING_CHECKS: [keyof NonNullable<DsCandidate["billing"]>, string][] = [
  ["billRate", "Bill rate"],
  ["markup", "Markup"],
  ["purchaseOrder", "Purchase order"],
  ["costCenter", "Cost center"],
  ["clientWorkerId", "Client worker ID"],
  ["vmsId", "VMS ID"],
  ["invoiceFrequency", "Invoice frequency"],
  ["timesheetMethod", "Timesheet method"],
  ["expensePolicy", "Expense policy"],
  ["billingEntity", "Billing entity"],
  ["approvedStartDate", "Approved start date"],
];

function missingChecks<T extends Record<string, unknown>>(rec: T | null | undefined, checks: [keyof T, string][]): string[] {
  if (!rec) return checks.map(([, l]) => l);
  return checks.filter(([k]) => !rec[k]).map(([, l]) => l);
}

/** Assignment bill/pay rate for a candidate (assignment first, then consultant record). */
function ratesFor(ds: Dataset, c: DsCandidate): { bill: number | null; pay: number | null } {
  const a = ds.assignments.find((x) => x.candidateId === c.id);
  return { bill: a?.billRate ?? null, pay: a?.payRate ?? null };
}

const WEEKLY_HOURS = 40;

export const commercialReports: ReportDef[] = [
  // ── Account Manager / Client (§56) ──────────────────────
  {
    slug: "client-pipeline",
    name: "Client Onboarding Pipeline",
    description: "Every candidate in flight for each client with stage, readiness, start date, risk, remaining items, and last activity.",
    section: "client",
    spec: "§56.1",
    personas: [AM, SA],
    owner: "Client Services",
    load(ds) {
      const active = ds.candidates.filter(isActive);
      const rows = active.map((c) => {
        const r = readiness(ds, c);
        const gates = [r.compliance, r.payroll, r.billing].filter(Boolean).length;
        return {
          candidate: fullName(c),
          client: c.clientName ?? "—",
          assignment: ds.assignments.find((a) => a.candidateId === c.id)?.jobTitle ?? "—",
          stage: c.stage ?? "—",
          readiness: `${gates}/3 gates`,
          start: iso(c.startDate),
          risk: title(c.risk),
          remaining: r.openDocs.length,
          owner: c.onboarder ?? "—",
          lastActivity: iso(c.lastContact ?? c.updatedAt),
        };
      });
      return {
        kpis: [
          { label: "In-flight candidates", value: rows.length },
          { label: "Clients with pipeline", value: new Set(rows.map((r) => r.client)).size },
          { label: "All gates ready", value: rows.filter((r) => r.readiness === "3/3 gates").length, tone: "success" },
          { label: "At risk", value: rows.filter((r) => r.risk === "At Risk" || r.risk === "Unlikely").length, tone: "danger" },
        ],
        charts: [
          {
            kind: "stacked",
            title: "Pipeline by client and risk",
            drillKey: "client",
            segments: RISK_ORDER.map((r) => ({ key: r, label: r, tone: RISK_TONE[r] })),
            rows: [...countBy(rows, (r) => r.client).entries()].sort((a, b) => b[1] - a[1]).slice(0, 14).map(([cl]) => ({ label: cl, values: Object.fromEntries(RISK_ORDER.map((r) => [r, rows.filter((x) => x.client === cl && x.risk === r).length])) })),
          },
          { kind: "bar", title: "By stage", drillKey: "stage", points: points(countBy(rows, (r) => r.stage)) },
        ],
        table: {
          columns: [
            { key: "candidate", label: "Candidate" },
            { key: "client", label: "Client" },
            { key: "assignment", label: "Assignment" },
            { key: "stage", label: "Stage" },
            { key: "readiness", label: "Readiness" },
            { key: "start", label: "Start", type: "date" },
            { key: "risk", label: "Risk", type: "status" },
            { key: "remaining", label: "Remaining items", type: "number" },
            { key: "owner", label: "Owner" },
            { key: "lastActivity", label: "Last activity", type: "date" },
          ],
          rows,
          sort: { key: "start", dir: "asc" },
        },
      };
    },
  },
  {
    slug: "client-start-forecast",
    name: "Client Start-Date Forecast",
    description: "Upcoming starts by week and client with confidence, expected clearance, equipment, and screening readiness.",
    section: "client",
    spec: "§56.2",
    personas: [AM, EX],
    owner: "Client Services",
    dateScope: "none",
    definitions: [{ term: "Confidence", def: "On Track 95%, Needs Attention 75%, At Risk 45%, Unlikely 15% — from the Start-Date Risk Engine." }],
    load(ds) {
      const CONF: Record<string, number> = { ON_TRACK: 95, NEEDS_ATTENTION: 75, AT_RISK: 45, UNLIKELY: 15 };
      const upcoming = ds.candidates.filter((c) => isActive(c) && c.startDate && c.startDate >= ds.now);
      const rows = upcoming.map((c) => {
        const r = readiness(ds, c);
        const scr = idx(ds).screenings.get(c.id) ?? [];
        const clearance = scr.map((s) => s.completedAt ?? s.estimatedCompletion).filter((d): d is Date => !!d).sort((a, b) => b.getTime() - a.getTime())[0];
        return { candidate: fullName(c), client: c.clientName ?? "—", start: iso(c.startDate), week: forwardWeeks(ds, [c], (x) => x.startDate, 8).find((w) => w.value)?.label ?? "Later", confidence: CONF[c.risk] ?? 50, clearance: iso(clearance), screening: r.screening, equipment: r.equipment, delayedRisk: CONF[c.risk] < 50 ? "Likely delay" : "On schedule" };
      });
      return {
        kpis: [
          { label: "Upcoming starts", value: rows.length },
          { label: "Next 7 days", value: upcoming.filter((c) => (daysUntil(ds, c.startDate) ?? 99) <= 7).length, tone: "info" },
          { label: "Weighted expected starts", value: round(sum(rows.map((r) => r.confidence / 100))), tone: "success" },
          { label: "Likely delays", value: rows.filter((r) => r.delayedRisk === "Likely delay").length, tone: "danger" },
          { label: "Avg confidence", value: round(avg(rows.map((r) => r.confidence))), format: "percent" },
        ],
        charts: [
          { kind: "trend", title: "Starts by week (next 8)", points: forwardWeeks(ds, upcoming, (c) => c.startDate, 8) },
          { kind: "bar", title: "Upcoming starts by client", drillKey: "client", points: points(countBy(rows, (r) => r.client), { limit: 12 }) },
          { kind: "bar", title: "Confidence distribution", drillKey: "delayedRisk", points: points(countBy(rows, (r) => r.delayedRisk), { tones: { "Likely delay": "danger", "On schedule": "success" } }) },
        ],
        table: {
          columns: [
            { key: "candidate", label: "Candidate" },
            { key: "client", label: "Client" },
            { key: "start", label: "Start", type: "date" },
            { key: "week", label: "Week" },
            { key: "confidence", label: "Confidence", type: "percent" },
            { key: "clearance", label: "Expected clearance", type: "date" },
            { key: "screening", label: "Screening", type: "status" },
            { key: "equipment", label: "Equipment", type: "status" },
            { key: "delayedRisk", label: "Forecast", type: "status" },
          ],
          rows,
          sort: { key: "start", dir: "asc" },
        },
      };
    },
  },
  {
    slug: "client-compliance-pass-rate",
    name: "Client Compliance Pass-Rate Report",
    description: "Package and document pass rates by client, first-pass approval, waivers, overrides, and most common failures.",
    section: "client",
    spec: "§56.3",
    personas: [AM, SA, "executive"],
    owner: "Compliance",
    load(ds) {
      const rows = ds.clients.map((cl) => {
        const ids = new Set(ds.candidates.filter((c) => c.clientName === cl.name).map((c) => c.id));
        const docs = ds.documents.filter((d) => d.candidateId && ids.has(d.candidateId));
        const decided = docs.filter((d) => ["APPROVED", "REJECTED", "CORRECTION_REQUIRED"].includes(d.status));
        const fails = countBy(docs.filter((d) => d.status === "REJECTED" || d.status === "CORRECTION_REQUIRED"), (d) => d.name);
        const pk = ds.packages.filter((p) => p.clientId === cl.id);
        return {
          client: cl.name,
          packages: pk.length,
          completed: pk.filter((p) => p.completionPct === 100).length,
          passRate: cl.compliancePassRate,
          firstPass: pct(decided.filter((d) => d.status === "APPROVED").length, decided.length),
          waivers: sum(pk.map((p) => p.items.filter((i) => i.status === "WAIVED").length)),
          overrides: ds.auditEvents.filter((e) => e.action === "OVERRIDDEN" && e.clientId === cl.id).length,
          topFailure: [...fails.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—",
        };
      });
      return {
        kpis: [
          { label: "Portfolio pass rate", value: round(avg(rows.map((r) => r.passRate))), format: "percent", tone: "success" },
          { label: "Avg first-pass", value: round(avg(rows.map((r) => r.firstPass).filter(Boolean))), format: "percent" },
          { label: "Waivers", value: sum(rows.map((r) => r.waivers)), tone: "warning" },
          { label: "Overrides", value: sum(rows.map((r) => r.overrides)), tone: "warning" },
          { label: "Clients < 85%", value: rows.filter((r) => r.passRate < 85).length, tone: "danger" },
        ],
        charts: [
          { kind: "bar", title: "Compliance pass rate by client", drillKey: "client", format: "percent", points: rows.map((r) => ({ label: r.client, value: r.passRate, tone: r.passRate < 85 ? ("danger" as const) : r.passRate < 92 ? ("warning" as const) : ("success" as const) })).sort((a, b) => a.value - b.value) },
          { kind: "bar", title: "Most common failures", points: points(countBy(ds.documents.filter((d) => d.status === "REJECTED" || d.status === "CORRECTION_REQUIRED"), (d) => d.name), { tone: "danger", limit: 8 }) },
        ],
        table: {
          columns: [
            { key: "client", label: "Client" },
            { key: "packages", label: "Packages", type: "number" },
            { key: "completed", label: "Completed", type: "number" },
            { key: "passRate", label: "Pass rate", type: "percent" },
            { key: "firstPass", label: "First-pass", type: "percent" },
            { key: "waivers", label: "Waivers", type: "number" },
            { key: "overrides", label: "Overrides", type: "number" },
            { key: "topFailure", label: "Top failure" },
          ],
          rows,
          sort: { key: "passRate", dir: "asc" },
        },
      };
    },
  },
  {
    slug: "client-velocity",
    name: "Client Velocity Report",
    description: "Average and median onboarding time, client approval time, and screening turnaround vs the portfolio average.",
    section: "client",
    spec: "§56.4",
    personas: [AM, EX, SA],
    owner: "Client Services",
    load(ds) {
      const portfolio = avg(ds.clients.map((c) => c.avgOnboardingDays));
      const rows = ds.clients.map((cl) => {
        const cands = ds.candidates.filter((c) => c.clientName === cl.name);
        const placed = cands.filter((c) => c.status === "PLACED" && c.startDate).map((c) => Math.max(1, daysBetween(c.createdAt, c.startDate!)));
        const scr = ds.screenings.filter((s) => s.candidateId && ds.candById.get(s.candidateId)?.clientName === cl.name && s.completedAt && s.orderedAt).map((s) => daysBetween(s.orderedAt!, s.completedAt!));
        const approvals = ds.packages.filter((p) => p.clientId === cl.id).flatMap((p) => p.approvals.filter((a) => a.approvedAt).map((a) => Math.max(0, daysBetween(p.createdAt, a.approvedAt!))));
        return {
          client: cl.name,
          avgDays: cl.avgOnboardingDays,
          medianDays: placed.length ? median(placed) : cl.avgOnboardingDays,
          approvalDays: round(avg(approvals)),
          screeningDays: round(avg(scr)),
          vsPortfolio: round(cl.avgOnboardingDays - portfolio),
          rank: cl.avgOnboardingDays <= portfolio ? "Faster than avg" : "Slower than avg",
        };
      });
      return {
        kpis: [
          { label: "Portfolio avg onboarding", value: round(portfolio), format: "days" },
          { label: "Fastest client", value: rows.sort((a, b) => a.avgDays - b.avgDays)[0]?.client ?? "—", tone: "success" },
          { label: "Slowest client", value: [...rows].sort((a, b) => b.avgDays - a.avgDays)[0]?.client ?? "—", tone: "danger" },
          { label: "Avg screening turnaround", value: round(avg(rows.map((r) => r.screeningDays).filter(Boolean))), format: "days" },
        ],
        charts: [
          { kind: "bar", title: "Client velocity ranking (avg days)", drillKey: "client", format: "days", points: rows.map((r) => ({ label: r.client, value: r.avgDays, tone: r.avgDays > portfolio ? ("warning" as const) : ("success" as const) })).sort((a, b) => b.value - a.value) },
          { kind: "bar", title: "Screening turnaround by client", drillKey: "client", format: "days", points: rows.filter((r) => r.screeningDays).map((r) => ({ label: r.client, value: r.screeningDays, tone: "info" as const })).sort((a, b) => b.value - a.value).slice(0, 12) },
        ],
        table: {
          columns: [
            { key: "client", label: "Client" },
            { key: "avgDays", label: "Avg onboarding", type: "days" },
            { key: "medianDays", label: "Median", type: "days" },
            { key: "approvalDays", label: "Client approval", type: "days" },
            { key: "screeningDays", label: "Screening", type: "days" },
            { key: "vsPortfolio", label: "vs portfolio", type: "days" },
            { key: "rank", label: "Rank", type: "status" },
          ],
          rows,
          sort: { key: "avgDays", dir: "desc" },
        },
      };
    },
  },
  {
    slug: "client-promise-tracker",
    name: "Client Promise vs Actual",
    description: "Promised clearance, start, screening, and equipment dates against actuals, with variance and owner.",
    section: "client",
    spec: "§56.5 · §41.5",
    personas: [AM, SA, "executive"],
    owner: "Client Services",
    load(ds) {
      const rows = ds.promises.map((p) => {
        const promised = new Date(p.promisedDate);
        const actual = p.actualDate ? new Date(p.actualDate) : null;
        const variance = actual ? daysBetween(promised, actual) : promised < ds.now ? daysBetween(promised, ds.now) : null;
        const cl = ds.clients.find((c) => c.id === p.clientId);
        return {
          client: p.client.name,
          promise: p.label,
          promised: p.promisedDate,
          actual: p.actualDate ?? null,
          variance,
          status: title(p.status),
          owner: cl?.accountManager ?? "—",
          daysOut: actual ? null : daysBetween(ds.now, promised),
        };
      });
      return {
        kpis: [
          { label: "Promises tracked", value: rows.length },
          { label: "Delivered", value: rows.filter((r) => /deliver|met/i.test(r.status)).length, tone: "success" },
          { label: "At risk", value: rows.filter((r) => /risk/i.test(r.status)).length, tone: "warning" },
          { label: "Missed", value: rows.filter((r) => /miss/i.test(r.status)).length, tone: "danger" },
          { label: "Avg variance", value: round(avg(rows.map((r) => r.variance ?? 0))), format: "days" },
        ],
        charts: [
          { kind: "bar", title: "Promise status", drillKey: "status", points: points(countBy(rows, (r) => r.status), { tones: { Delivered: "success", Met: "success", "On Track": "info", "At Risk": "warning", Missed: "danger" } }) },
          { kind: "bar", title: "Promises at risk or missed by owner", drillKey: "owner", points: points(countBy(rows.filter((r) => /risk|miss/i.test(r.status)), (r) => r.owner), { tone: "danger" }) },
        ],
        table: {
          columns: [
            { key: "client", label: "Client" },
            { key: "promise", label: "Promise" },
            { key: "promised", label: "Promised", type: "date" },
            { key: "actual", label: "Actual", type: "date" },
            { key: "variance", label: "Variance", type: "days" },
            { key: "daysOut", label: "Days out", type: "days" },
            { key: "status", label: "Status", type: "status" },
            { key: "owner", label: "Owner" },
          ],
          rows,
          sort: { key: "promised", dir: "asc" },
        },
      };
    },
  },
  {
    slug: "client-escalations",
    name: "Client Escalation Report",
    description: "Open client-impacting escalations by severity, issue, owner, age, and client communication status.",
    section: "client",
    spec: "§56.6",
    personas: [AM, SA],
    owner: "Client Services",
    load(ds) {
      const esc = ds.exceptions.filter((e) => OPEN_EXC.has(e.status) && (e.clientVisible || e.severity === "CRITICAL" || e.severity === "HIGH"));
      const rows = esc.map((e) => ({
        client: clientOf(ds, e.candidateId),
        candidate: nameOf(ds, e.candidateId),
        issue: e.title,
        category: e.category,
        severity: title(e.severity),
        owner: e.owner ?? "Unassigned",
        age: ageDays(ds, e.createdAt),
        sla: slaState(ds, e),
        clientComms: e.clientVisible ? (e.clientNote ? "Client updated" : "Update owed") : "Internal only",
      }));
      return {
        kpis: [
          { label: "Open escalations", value: rows.length, tone: "warning" },
          { label: "Critical", value: rows.filter((r) => r.severity === "Critical").length, tone: "danger" },
          { label: "Client update owed", value: rows.filter((r) => r.clientComms === "Update owed").length, tone: "danger" },
          { label: "Avg age", value: round(avg(rows.map((r) => r.age ?? 0))), format: "days" },
        ],
        charts: [
          { kind: "bar", title: "Escalations by client", drillKey: "client", points: points(countBy(rows, (r) => r.client), { tone: "danger", limit: 12 }) },
          { kind: "bar", title: "By severity", drillKey: "severity", points: points(countBy(rows, (r) => r.severity), { order: ["Critical", "High", "Medium", "Low"], tones: { Critical: "danger", High: "warning", Medium: "info", Low: "neutral" } }) },
        ],
        table: {
          columns: [
            { key: "client", label: "Client" },
            { key: "candidate", label: "Candidate" },
            { key: "issue", label: "Issue" },
            { key: "severity", label: "Severity", type: "status" },
            { key: "owner", label: "Owner" },
            { key: "age", label: "Age", type: "days" },
            { key: "sla", label: "SLA", type: "status" },
            { key: "clientComms", label: "Client comms", type: "status" },
          ],
          rows,
          sort: { key: "age", dir: "desc" },
        },
      };
    },
  },
  {
    slug: "client-experience",
    name: "Client Experience Report",
    description: "Start-date success, compliance accuracy, escalation volume, repeat issues, and service-level achievement per client.",
    section: "client",
    spec: "§56.7",
    personas: [AM, EX],
    owner: "Client Services",
    definitions: [{ term: "Client health", def: "Average of start-date success, compliance pass rate, and SLA achievement minus 2 points per open escalation." }],
    load(ds) {
      const rows = ds.clients.map((cl) => {
        const ids = new Set(ds.candidates.filter((c) => c.clientName === cl.name).map((c) => c.id));
        const ex = ds.exceptions.filter((e) => e.candidateId && ids.has(e.candidateId));
        const withSla = ex.filter((e) => e.resolutionDeadline);
        const sla = pct(withSla.filter((e) => slaState(ds, e) !== "Breached").length, withSla.length) || 100;
        const openEsc = ex.filter((e) => OPEN_EXC.has(e.status)).length;
        const repeat = [...countBy(ex, (e) => e.category).values()].filter((n) => n > 1).length;
        const health = round((cl.startDateSuccessRate + cl.compliancePassRate + sla) / 3 - openEsc * 2);
        return { client: cl.name, am: cl.accountManager, startSuccess: cl.startDateSuccessRate, compliance: cl.compliancePassRate, sla, escalations: openEsc, repeatIssues: repeat, health, status: health >= 88 ? "Healthy" : health >= 78 ? "Watch" : "At Risk" };
      });
      return {
        kpis: [
          { label: "Clients", value: rows.length },
          { label: "Healthy", value: rows.filter((r) => r.status === "Healthy").length, tone: "success" },
          { label: "Watch", value: rows.filter((r) => r.status === "Watch").length, tone: "warning" },
          { label: "At risk", value: rows.filter((r) => r.status === "At Risk").length, tone: "danger" },
          { label: "Avg health", value: round(avg(rows.map((r) => r.health))) },
        ],
        charts: [
          { kind: "bar", title: "Client health score", drillKey: "client", points: rows.map((r) => ({ label: r.client, value: r.health, tone: r.status === "Healthy" ? ("success" as const) : r.status === "Watch" ? ("warning" as const) : ("danger" as const) })).sort((a, b) => a.value - b.value) },
          { kind: "bar", title: "Health by account manager", drillKey: "am", points: [...countBy(rows, (r) => r.am).keys()].map((k) => ({ label: k, value: round(avg(rows.filter((r) => r.am === k).map((r) => r.health))), tone: "info" as const })) },
        ],
        table: {
          columns: [
            { key: "client", label: "Client" },
            { key: "am", label: "Account manager" },
            { key: "startSuccess", label: "Start success", type: "percent" },
            { key: "compliance", label: "Compliance", type: "percent" },
            { key: "sla", label: "SLA met", type: "percent" },
            { key: "escalations", label: "Open escalations", type: "number" },
            { key: "repeatIssues", label: "Repeat issues", type: "number" },
            { key: "health", label: "Health", type: "number" },
            { key: "status", label: "Status", type: "status" },
          ],
          rows,
          sort: { key: "health", dir: "asc" },
        },
      };
    },
  },
  {
    slug: "client-cost-volume",
    name: "Client Cost & Volume Report",
    description: "Onboarding volume, screening and equipment spend, and cost trend by client (authorized users only).",
    section: "client",
    spec: "§56.8",
    personas: [AM, EX],
    owner: "Finance",
    restricted: true,
    load(ds) {
      const rows = ds.clients.map((cl) => {
        const ids = new Set(ds.candidates.filter((c) => c.clientName === cl.name).map((c) => c.id));
        const scr = ds.screenings.filter((s) => s.candidateId && ids.has(s.candidateId));
        const eq = ds.equipment.filter((e) => e.candidateId && ids.has(e.candidateId));
        const screening = Math.round(sum(scr.map((s) => s.cost ?? 0)));
        const equipment = eq.length * 640;
        return { client: cl.name, volume: ids.size, screening, equipment, total: screening + equipment, perOnboarding: ids.size ? Math.round((screening + equipment) / ids.size) : 0, active: cl.activeConsultants };
      }).filter((r) => r.volume > 0);
      return {
        kpis: [
          { label: "Onboarding volume", value: sum(rows.map((r) => r.volume)) },
          { label: "Screening spend", value: sum(rows.map((r) => r.screening)), format: "currency" },
          { label: "Equipment spend", value: sum(rows.map((r) => r.equipment)), format: "currency" },
          { label: "Avg cost per onboarding", value: Math.round(avg(rows.map((r) => r.perOnboarding))), format: "currency" },
        ],
        charts: [
          { kind: "bar", title: "Volume by client", drillKey: "client", points: rows.map((r) => ({ label: r.client, value: r.volume, tone: "info" as const })).sort((a, b) => b.value - a.value).slice(0, 12) },
          { kind: "trend", title: "Screening spend by month", format: "currency", points: (() => {
            const months: { label: string; value: number; tone: "ai" }[] = [];
            for (let i = 8; i >= 0; i--) {
              const d = new Date(ds.now.getFullYear(), ds.now.getMonth() - i, 1);
              const v = sum(ds.screenings.filter((s) => s.orderedAt && s.orderedAt.getMonth() === d.getMonth() && s.orderedAt.getFullYear() === d.getFullYear()).map((s) => s.cost ?? 0));
              months.push({ label: d.toLocaleString("en-US", { month: "short" }), value: Math.round(v), tone: "ai" });
            }
            return months;
          })() },
        ],
        table: {
          columns: [
            { key: "client", label: "Client" },
            { key: "volume", label: "Onboardings", type: "number" },
            { key: "active", label: "Active consultants", type: "number" },
            { key: "screening", label: "Screening", type: "currency" },
            { key: "equipment", label: "Equipment", type: "currency" },
            { key: "total", label: "Total", type: "currency" },
            { key: "perOnboarding", label: "Per onboarding", type: "currency" },
          ],
          rows,
          sort: { key: "total", dir: "desc" },
        },
      };
    },
  },

  // ── Payroll (§59) ────────────────────────────────────────
  {
    slug: "payroll-readiness",
    name: "Payroll Readiness Report",
    description: "Ready vs not-ready candidates with the specific payroll checks missing for each (§16.2 gate).",
    section: "payroll",
    spec: "§59.1 · §16.2",
    personas: [ON, SA, AM],
    owner: "Payroll Operations",
    load(ds) {
      const xs = ds.candidates.filter((c) => c.payroll);
      const rows = xs.map((c) => {
        const missing = missingChecks(c.payroll, PAYROLL_CHECKS);
        return { candidate: fullName(c), client: c.clientName ?? "—", employment: employment(c.employmentType), status: title(c.payroll!.status), start: iso(c.startDate), missingCount: missing.length, missing: missing.join(", ") || "—" };
      });
      const gapCounts = new Map(PAYROLL_CHECKS.map(([k, l]) => [l, xs.filter((c) => !c.payroll![k]).length]));
      return {
        kpis: [
          { label: "Candidates tracked", value: rows.length },
          { label: "Payroll ready", value: rows.filter((r) => r.status === "Ready").length, tone: "success" },
          { label: "Not ready", value: rows.filter((r) => r.status !== "Ready").length, tone: "warning" },
          { label: "Missing direct deposit", value: gapCounts.get("Direct deposit") ?? 0, tone: "danger" },
          { label: "Missing tax forms", value: xs.filter((c) => !c.payroll!.w4 || !c.payroll!.stateTax).length, tone: "danger" },
        ],
        charts: [
          { kind: "bar", title: "Missing payroll checks", points: points(gapCounts, { tone: "warning" }) },
          { kind: "bar", title: "Readiness status", drillKey: "status", points: points(countBy(rows, (r) => r.status), { tones: { Ready: "success", "Not Ready": "danger", Pending: "warning" } }) },
          { kind: "bar", title: "Not ready by client", drillKey: "client", points: points(countBy(rows.filter((r) => r.status !== "Ready"), (r) => r.client), { tone: "danger", limit: 10 }) },
        ],
        table: {
          columns: [
            { key: "candidate", label: "Candidate" },
            { key: "client", label: "Client" },
            { key: "employment", label: "Employment" },
            { key: "status", label: "Payroll", type: "status" },
            { key: "start", label: "Start", type: "date" },
            { key: "missingCount", label: "Gaps", type: "number" },
            { key: "missing", label: "Missing checks" },
          ],
          rows,
          sort: { key: "missingCount", dir: "desc" },
        },
      };
    },
  },
  {
    slug: "upcoming-starts-payroll-risk",
    name: "Upcoming Starts Payroll Risk",
    description: "Candidates starting within 1, 3, 7, and 14 days with payroll readiness status and missing items.",
    section: "payroll",
    spec: "§59.2",
    personas: [ON, SA],
    owner: "Payroll Operations",
    dateScope: "none",
    load(ds) {
      const xs = ds.candidates.filter((c) => {
        const d = daysUntil(ds, c.startDate);
        return isActive(c) && d !== null && d >= 0 && d <= 14;
      });
      const win = (d: number) => bucket(d, [["≤1 day", 0, 1], ["2–3 days", 2, 3], ["4–7 days", 4, 7], ["8–14 days", 8, 14]]);
      const rows = xs.map((c) => {
        const d = daysUntil(ds, c.startDate)!;
        const missing = missingChecks(c.payroll, PAYROLL_CHECKS);
        return { candidate: fullName(c), client: c.clientName ?? "—", start: iso(c.startDate), days: d, window: win(d), payroll: c.payroll?.status === "READY" ? "Ready" : "Not Ready", missing: missing.join(", ") || "—", owner: c.onboarder ?? "—" };
      });
      const order = ["≤1 day", "2–3 days", "4–7 days", "8–14 days"];
      return {
        kpis: [
          { label: "Starting ≤14 days", value: rows.length },
          { label: "Not payroll-ready", value: rows.filter((r) => r.payroll !== "Ready").length, tone: "danger" },
          { label: "≤3 days & not ready", value: rows.filter((r) => r.days <= 3 && r.payroll !== "Ready").length, tone: "danger" },
          { label: "Payroll-ready", value: pct(rows.filter((r) => r.payroll === "Ready").length, rows.length), format: "percent", tone: "success" },
        ],
        charts: [
          { kind: "stacked", title: "Readiness by start window", drillKey: "window", segments: [{ key: "Ready", label: "Ready", tone: "success" }, { key: "Not Ready", label: "Not ready", tone: "danger" }], rows: order.map((w) => ({ label: w, values: { Ready: rows.filter((r) => r.window === w && r.payroll === "Ready").length, "Not Ready": rows.filter((r) => r.window === w && r.payroll !== "Ready").length } })) },
        ],
        table: {
          columns: [
            { key: "candidate", label: "Candidate" },
            { key: "client", label: "Client" },
            { key: "start", label: "Start", type: "date" },
            { key: "days", label: "Days", type: "days" },
            { key: "window", label: "Window" },
            { key: "payroll", label: "Payroll", type: "status" },
            { key: "missing", label: "Missing" },
            { key: "owner", label: "Owner" },
          ],
          rows,
          sort: { key: "days", dir: "asc" },
        },
      };
    },
  },
  {
    slug: "pay-rate-validation",
    name: "Pay Rate Validation Report",
    description: "Pay rates by employment type and state with overtime treatment and flagged exceptions (margin, minimums).",
    section: "payroll",
    spec: "§59.3",
    personas: [SA, AM],
    owner: "Payroll Operations",
    restricted: true,
    definitions: [{ term: "Exception", def: "Pay ≥ bill rate, markup below 15%, or pay rate under $20/hr." }],
    load(ds) {
      const rows = ds.assignments.filter((a) => a.payRate).map((a) => {
        const who = a.candidateId ? nameOf(ds, a.candidateId) : a.consultantId ? (() => { const c = ds.consultants.find((x) => x.id === a.consultantId); return c ? fullName(c) : "—"; })() : "—";
        const markup = a.billRate && a.payRate ? round(((a.billRate - a.payRate) / a.payRate) * 100) : null;
        const issue = a.billRate && a.payRate! >= a.billRate ? "Pay ≥ bill" : markup !== null && markup < 15 ? "Low markup" : a.payRate! < 20 ? "Below floor" : "OK";
        return { worker: who, client: a.clientId ? ds.clientById.get(a.clientId)?.name ?? "—" : "—", employment: employment(a.employmentType), state: a.workState ?? "—", payRate: a.payRate, billRate: a.billRate, markup, overtime: a.employmentType === "W2" ? "FLSA non-exempt (1.5x)" : "N/A (contractor)", effective: iso(a.startDate), issue };
      });
      return {
        kpis: [
          { label: "Rates validated", value: rows.length },
          { label: "Exceptions", value: rows.filter((r) => r.issue !== "OK").length, tone: "danger" },
          { label: "Avg pay rate", value: round(avg(rows.map((r) => r.payRate ?? 0)), 2), format: "currency" },
          { label: "Avg markup", value: round(avg(rows.map((r) => r.markup ?? 0))), format: "percent" },
        ],
        charts: [
          { kind: "bar", title: "Avg pay rate by employment type", drillKey: "employment", format: "currency", points: [...countBy(rows, (r) => r.employment).keys()].map((k) => ({ label: k, value: round(avg(rows.filter((r) => r.employment === k).map((r) => r.payRate ?? 0)), 2), tone: "info" as const })) },
          { kind: "bar", title: "Validation result", drillKey: "issue", points: points(countBy(rows, (r) => r.issue), { tones: { OK: "success", "Low markup": "warning", "Pay ≥ bill": "danger", "Below floor": "danger" } }) },
          { kind: "bar", title: "Avg pay rate by state", drillKey: "state", format: "currency", points: [...countBy(rows, (r) => r.state).keys()].map((k) => ({ label: k, value: round(avg(rows.filter((r) => r.state === k).map((r) => r.payRate ?? 0)), 2), tone: "ai" as const })).sort((a, b) => b.value - a.value).slice(0, 12) },
        ],
        table: {
          columns: [
            { key: "worker", label: "Worker" },
            { key: "client", label: "Client" },
            { key: "employment", label: "Employment" },
            { key: "state", label: "State" },
            { key: "payRate", label: "Pay rate", type: "currency" },
            { key: "billRate", label: "Bill rate", type: "currency" },
            { key: "markup", label: "Markup", type: "percent" },
            { key: "overtime", label: "Overtime rule" },
            { key: "effective", label: "Effective", type: "date" },
            { key: "issue", label: "Validation", type: "status" },
          ],
          rows,
          sort: { key: "markup", dir: "asc" },
        },
      };
    },
  },
  {
    slug: "tax-form-completion",
    name: "Tax Form Completion Report",
    description: "Federal and state tax form status per candidate — missing, rejected, and correction-required forms.",
    section: "payroll",
    spec: "§59.4",
    personas: [ON, SA],
    owner: "Payroll Operations",
    load(ds) {
      const taxDocs = ds.documents.filter((d) => /w-?4|tax|w-?9/i.test(d.name) || /tax/i.test(d.category));
      const rows = taxDocs.map((d) => ({ candidate: nameOf(ds, d.candidateId), client: clientOf(ds, d.candidateId), form: d.name, level: /state|local/i.test(d.name) ? "State / local" : "Federal", status: title(d.status), reason: d.rejectedReason ?? "—", uploaded: iso(d.uploadedAt), correction: ["REJECTED", "CORRECTION_REQUIRED"].includes(d.status) ? "Required" : "—" }));
      return {
        kpis: [
          { label: "Tax forms", value: rows.length },
          { label: "Approved", value: rows.filter((r) => r.status === "Approved").length, tone: "success" },
          { label: "Missing / pending", value: rows.filter((r) => r.status === "Pending").length, tone: "warning" },
          { label: "Rejected / correction", value: rows.filter((r) => r.correction === "Required").length, tone: "danger" },
        ],
        charts: [
          { kind: "stacked", title: "Status by form level", drillKey: "level", segments: [{ key: "Approved", label: "Approved", tone: "success" }, { key: "In review", label: "In review", tone: "info" }, { key: "Pending", label: "Pending", tone: "warning" }, { key: "Rework", label: "Rejected / correction", tone: "danger" }], rows: ["Federal", "State / local"].map((lv) => { const xs = rows.filter((r) => r.level === lv); return { label: lv, values: { Approved: xs.filter((r) => r.status === "Approved").length, "In review": xs.filter((r) => ["Submitted", "Ai Review"].includes(r.status)).length, Pending: xs.filter((r) => r.status === "Pending").length, Rework: xs.filter((r) => r.correction === "Required").length } }; }) },
          { kind: "bar", title: "By form", drillKey: "form", points: points(countBy(rows, (r) => r.form)) },
        ],
        table: {
          columns: [
            { key: "candidate", label: "Candidate" },
            { key: "client", label: "Client" },
            { key: "form", label: "Form" },
            { key: "level", label: "Level" },
            { key: "status", label: "Status", type: "status" },
            { key: "reason", label: "Rejection reason" },
            { key: "uploaded", label: "Uploaded", type: "date" },
            { key: "correction", label: "Correction", type: "status" },
          ],
          rows,
        },
      };
    },
  },
  {
    slug: "direct-deposit-validation",
    name: "Direct Deposit Validation Report",
    description: "Direct deposit submission, validation, rejection, and bank verification status ahead of first payroll.",
    section: "payroll",
    spec: "§59.5",
    personas: [ON, SA],
    owner: "Payroll Operations",
    restricted: true,
    load(ds) {
      const xs = ds.candidates.filter((c) => c.payroll);
      const rows = xs.map((c) => {
        const doc = (idx(ds).docs.get(c.id) ?? []).find((d) => /deposit|bank/i.test(d.name));
        const bankEx = (idx(ds).exceptions.get(c.id) ?? []).some((e) => /bank/i.test(e.category) && OPEN_EXC.has(e.status));
        const status = c.payroll!.directDeposit ? "Validated" : bankEx ? "Rejected" : doc?.status === "SUBMITTED" || doc?.status === "AI_REVIEW" ? "Submitted" : doc?.status === "CORRECTION_REQUIRED" || doc?.status === "REJECTED" ? "Correction required" : "Not submitted";
        const firstPay = c.startDate ? new Date(c.startDate.getTime() + ((12 - c.startDate.getDay() + 7) % 7 || 7) * 86_400_000) : null;
        return { candidate: fullName(c), client: c.clientName ?? "—", status, bank: c.payroll!.directDeposit ? "Verified" : bankEx ? "Failed" : "Pending", firstPayroll: iso(firstPay), daysToPay: daysUntil(ds, firstPay) };
      });
      return {
        kpis: [
          { label: "Tracked", value: rows.length },
          { label: "Validated", value: rows.filter((r) => r.status === "Validated").length, tone: "success" },
          { label: "Correction / rejected", value: rows.filter((r) => ["Rejected", "Correction required"].includes(r.status)).length, tone: "danger" },
          { label: "Not submitted", value: rows.filter((r) => r.status === "Not submitted").length, tone: "warning" },
        ],
        charts: [{ kind: "bar", title: "Direct deposit status", drillKey: "status", points: points(countBy(rows, (r) => r.status), { tones: { Validated: "success", Submitted: "info", "Correction required": "warning", Rejected: "danger", "Not submitted": "neutral" } }) }],
        table: {
          columns: [
            { key: "candidate", label: "Candidate" },
            { key: "client", label: "Client" },
            { key: "status", label: "Status", type: "status" },
            { key: "bank", label: "Bank verification", type: "status" },
            { key: "firstPayroll", label: "First payroll", type: "date" },
            { key: "daysToPay", label: "Days to payroll", type: "days" },
          ],
          rows,
          sort: { key: "daysToPay", dir: "asc" },
        },
      };
    },
  },
  {
    slug: "payroll-issue-trend",
    name: "Payroll Issue Trend Report",
    description: "Payroll, tax, and bank exceptions over time by root cause, client, recruiter, and resolution time.",
    section: "payroll",
    spec: "§59.6",
    personas: [SA, ON],
    owner: "Payroll Operations",
    load(ds) {
      const ex = ds.exceptions.filter((e) => /payroll|tax|bank/i.test(e.category));
      const rows = ex.map((e) => { const c = e.candidateId ? ds.candById.get(e.candidateId) : undefined; return { issue: e.title, type: e.category, client: c?.clientName ?? "—", recruiter: c?.recruiter ?? "—", onboarder: c?.onboarder ?? "—", status: title(e.status), resolution: e.resolvedAt ? daysBetween(e.createdAt, e.resolvedAt) : null, created: iso(e.createdAt) }; });
      const perCand = countBy(ex, (e) => e.candidateId);
      return {
        kpis: [
          { label: "Payroll issues (90d)", value: rows.length, tone: "warning" },
          { label: "Open", value: rows.filter((r) => ["Open", "In Progress", "Reopened"].includes(r.status)).length, tone: "danger" },
          { label: "Avg resolution", value: round(avg(rows.map((r) => r.resolution ?? 0).filter(Boolean))), format: "days" },
          { label: "Repeat issue rate", value: pct([...perCand.values()].filter((n) => n > 1).length, perCand.size), format: "percent" },
        ],
        charts: [
          { kind: "trend", title: "Issues by week", points: (() => { const out = []; for (let i = 11; i >= 0; i--) { const end = ds.now.getTime() - i * 7 * 86_400_000; out.push({ label: new Date(end - 6 * 86_400_000).toLocaleString("en-US", { month: "short", day: "numeric" }), value: ex.filter((e) => e.createdAt.getTime() > end - 7 * 86_400_000 && e.createdAt.getTime() <= end).length, tone: "warning" as const }); } return out; })() },
          { kind: "bar", title: "By issue type", drillKey: "type", points: points(countBy(rows, (r) => r.type), { tone: "warning" }) },
          { kind: "bar", title: "By client", drillKey: "client", points: points(countBy(rows, (r) => r.client), { limit: 10 }) },
        ],
        table: {
          columns: [
            { key: "issue", label: "Issue" },
            { key: "type", label: "Type" },
            { key: "client", label: "Client" },
            { key: "recruiter", label: "Recruiter" },
            { key: "onboarder", label: "Onboarder" },
            { key: "status", label: "Status", type: "status" },
            { key: "resolution", label: "Resolution", type: "days" },
            { key: "created", label: "Created", type: "date" },
          ],
          rows,
          sort: { key: "created", dir: "desc" },
        },
      };
    },
  },

  // ── Billing (§60) ────────────────────────────────────────
  {
    slug: "billing-readiness",
    name: "Billing Readiness Report",
    description: "Ready vs blocked billing setup with the specific missing items: bill rate, markup, PO, cost center, worker and VMS IDs.",
    section: "billing",
    spec: "§60.1 · §16.3",
    personas: [AM, SA],
    owner: "Billing Operations",
    load(ds) {
      const xs = ds.candidates.filter((c) => c.billing);
      const rows = xs.map((c) => {
        const missing = missingChecks(c.billing, BILLING_CHECKS);
        return { candidate: fullName(c), client: c.clientName ?? "—", status: title(c.billing!.status), start: iso(c.startDate), po: c.billing!.poNumber ?? "—", vms: c.billing!.vmsWorkerId ?? "—", missingCount: missing.length, missing: missing.join(", ") || "—" };
      });
      const gaps = new Map(BILLING_CHECKS.map(([k, l]) => [l, xs.filter((c) => !c.billing![k]).length]));
      return {
        kpis: [
          { label: "Tracked", value: rows.length },
          { label: "Billing ready", value: rows.filter((r) => r.status === "Ready").length, tone: "success" },
          { label: "Missing PO", value: gaps.get("Purchase order") ?? 0, tone: "danger" },
          { label: "Missing worker ID", value: gaps.get("Client worker ID") ?? 0, tone: "warning" },
          { label: "Missing VMS ID", value: gaps.get("VMS ID") ?? 0, tone: "warning" },
        ],
        charts: [
          { kind: "bar", title: "Missing billing checks", points: points(gaps, { tone: "warning" }) },
          { kind: "bar", title: "Not ready by client", drillKey: "client", points: points(countBy(rows.filter((r) => r.status !== "Ready"), (r) => r.client), { tone: "danger", limit: 12 }) },
        ],
        table: {
          columns: [
            { key: "candidate", label: "Candidate" },
            { key: "client", label: "Client" },
            { key: "status", label: "Billing", type: "status" },
            { key: "start", label: "Start", type: "date" },
            { key: "po", label: "PO" },
            { key: "vms", label: "VMS worker ID" },
            { key: "missingCount", label: "Gaps", type: "number" },
            { key: "missing", label: "Missing" },
          ],
          rows,
          sort: { key: "missingCount", dir: "desc" },
        },
      };
    },
  },
  {
    slug: "purchase-orders",
    name: "Purchase Order Report",
    description: "PO coverage by consultant with estimated amount, remaining balance, expiration, and risk.",
    section: "billing",
    spec: "§60.2",
    personas: [AM, SA],
    owner: "Billing Operations",
    definitions: [{ term: "PO amount", def: "Bill rate × 40 h × assignment weeks (default 26). Remaining = amount − weeks elapsed × weekly billing." }],
    load(ds) {
      const rows = ds.candidates.filter((c) => c.billing).map((c) => {
        const { bill } = ratesFor(ds, c);
        const a = ds.assignments.find((x) => x.candidateId === c.id);
        const start = a?.startDate ?? c.startDate;
        const end = a?.endDate ?? (start ? new Date(start.getTime() + 182 * 86_400_000) : null);
        const weeks = start && end ? Math.max(1, Math.round(daysBetween(start, end) / 7)) : 26;
        const amount = bill ? Math.round(bill * WEEKLY_HOURS * weeks) : null;
        const elapsed = start ? Math.max(0, Math.round(daysBetween(start, ds.now) / 7)) : 0;
        const remaining = amount !== null && bill ? Math.max(0, Math.round(amount - elapsed * bill * WEEKLY_HOURS)) : null;
        const po = c.billing!.poNumber;
        const daysLeft = daysUntil(ds, end);
        return { po: po ?? "Missing", client: c.clientName ?? "—", consultant: fullName(c), effective: iso(start), expires: iso(end), amount, remaining, burn: amount && remaining !== null ? pct(amount - remaining, amount) : null, risk: !po ? "Missing PO" : daysLeft !== null && daysLeft < 30 ? "Expiring" : remaining !== null && amount && remaining / amount < 0.15 ? "Low balance" : "OK" };
      });
      return {
        kpis: [
          { label: "POs tracked", value: rows.filter((r) => r.po !== "Missing").length },
          { label: "Missing PO", value: rows.filter((r) => r.risk === "Missing PO").length, tone: "danger" },
          { label: "Expiring < 30 days", value: rows.filter((r) => r.risk === "Expiring").length, tone: "warning" },
          { label: "Total PO value", value: sum(rows.map((r) => r.amount ?? 0)), format: "currency" },
          { label: "Remaining balance", value: sum(rows.map((r) => r.remaining ?? 0)), format: "currency", tone: "info" },
        ],
        charts: [
          { kind: "bar", title: "PO risk", drillKey: "risk", points: points(countBy(rows, (r) => r.risk), { tones: { OK: "success", Expiring: "warning", "Low balance": "warning", "Missing PO": "danger" } }) },
          { kind: "bar", title: "Remaining balance by client", drillKey: "client", format: "currency", points: [...countBy(rows, (r) => r.client).keys()].map((k) => ({ label: k, value: sum(rows.filter((r) => r.client === k).map((r) => r.remaining ?? 0)), tone: "info" as const })).sort((a, b) => b.value - a.value).slice(0, 12) },
        ],
        table: {
          columns: [
            { key: "po", label: "PO number" },
            { key: "client", label: "Client" },
            { key: "consultant", label: "Consultant" },
            { key: "effective", label: "Effective", type: "date" },
            { key: "expires", label: "Expires", type: "date" },
            { key: "amount", label: "Amount", type: "currency" },
            { key: "remaining", label: "Remaining", type: "currency" },
            { key: "burn", label: "Burned", type: "percent" },
            { key: "risk", label: "Risk", type: "status" },
          ],
          rows,
          sort: { key: "expires", dir: "asc" },
        },
      };
    },
  },
  {
    slug: "bill-rate-markup",
    name: "Bill Rate & Markup Report",
    description: "Bill rate, pay rate, markup, and gross margin per assignment with client and employment-type comparisons.",
    section: "billing",
    spec: "§60.3",
    personas: [AM, EX],
    owner: "Billing Operations",
    restricted: true,
    load(ds) {
      const rows = ds.assignments.filter((a) => a.billRate && a.payRate).map((a) => {
        const cl = a.clientId ? ds.clientById.get(a.clientId)?.name ?? "—" : "—";
        const who = a.consultantId ? ds.consultants.find((c) => c.id === a.consultantId) : undefined;
        const cand = a.candidateId ? ds.candById.get(a.candidateId) : undefined;
        const markup = round(((a.billRate! - a.payRate!) / a.payRate!) * 100);
        return { worker: who ? fullName(who) : cand ? fullName(cand) : "—", client: cl, jobTitle: a.jobTitle ?? "—", employment: employment(a.employmentType), billRate: a.billRate, payRate: a.payRate, markup, margin: round(((a.billRate! - a.payRate!) / a.billRate!) * 100), weeklyGP: Math.round((a.billRate! - a.payRate!) * WEEKLY_HOURS), status: title(a.status) };
      });
      return {
        kpis: [
          { label: "Assignments", value: rows.length },
          { label: "Avg bill rate", value: round(avg(rows.map((r) => r.billRate ?? 0)), 2), format: "currency" },
          { label: "Avg markup", value: round(avg(rows.map((r) => r.markup))), format: "percent" },
          { label: "Avg gross margin", value: round(avg(rows.map((r) => r.margin))), format: "percent", tone: "success" },
          { label: "Weekly gross profit", value: sum(rows.filter((r) => /active|extended/i.test(r.status)).map((r) => r.weeklyGP)), format: "currency", tone: "success" },
        ],
        charts: [
          { kind: "bar", title: "Avg markup by client", drillKey: "client", format: "percent", points: [...countBy(rows, (r) => r.client).keys()].map((k) => ({ label: k, value: round(avg(rows.filter((r) => r.client === k).map((r) => r.markup))), tone: "info" as const })).sort((a, b) => b.value - a.value).slice(0, 12) },
          { kind: "bar", title: "Avg bill rate by employment type", drillKey: "employment", format: "currency", points: [...countBy(rows, (r) => r.employment).keys()].map((k) => ({ label: k, value: round(avg(rows.filter((r) => r.employment === k).map((r) => r.billRate ?? 0)), 2), tone: "ai" as const })) },
        ],
        table: {
          columns: [
            { key: "worker", label: "Worker" },
            { key: "client", label: "Client" },
            { key: "jobTitle", label: "Role" },
            { key: "employment", label: "Employment" },
            { key: "billRate", label: "Bill rate", type: "currency" },
            { key: "payRate", label: "Pay rate", type: "currency" },
            { key: "markup", label: "Markup", type: "percent" },
            { key: "margin", label: "Margin", type: "percent" },
            { key: "weeklyGP", label: "Weekly GP", type: "currency" },
            { key: "status", label: "Status", type: "status" },
          ],
          rows,
          sort: { key: "markup", dir: "asc" },
        },
      };
    },
  },
  {
    slug: "client-worker-ids",
    name: "Client Worker ID Report",
    description: "Client worker and VMS IDs per candidate — missing, duplicate, and pending IDs by client and VMS platform.",
    section: "billing",
    spec: "§60.4",
    personas: [AM, SA],
    owner: "Billing Operations",
    load(ds) {
      const xs = ds.candidates.filter((c) => c.billing && c.status !== "NEW");
      const idCounts = countBy(xs.filter((c) => c.billing!.vmsWorkerId), (c) => c.billing!.vmsWorkerId);
      const rows = xs.map((c) => {
        const cl = ds.clients.find((x) => x.name === c.clientName);
        const id = c.billing!.vmsWorkerId ?? c.billing!.clientWorkerId2;
        return { candidate: fullName(c), client: c.clientName ?? "—", vms: cl?.vmsPlatform ?? "None", workerId: id ?? "—", status: !id ? "Missing" : (idCounts.get(id) ?? 0) > 1 ? "Duplicate" : "Active", effective: iso(c.startDate) };
      });
      return {
        kpis: [
          { label: "Workers", value: rows.length },
          { label: "IDs captured", value: rows.filter((r) => r.status === "Active").length, tone: "success" },
          { label: "Missing ID", value: rows.filter((r) => r.status === "Missing").length, tone: "danger" },
          { label: "Duplicates", value: rows.filter((r) => r.status === "Duplicate").length, tone: "warning" },
        ],
        charts: [
          { kind: "bar", title: "Missing IDs by client", drillKey: "client", points: points(countBy(rows.filter((r) => r.status === "Missing"), (r) => r.client), { tone: "danger", limit: 12 }) },
          { kind: "bar", title: "By VMS platform", drillKey: "vms", points: points(countBy(rows, (r) => r.vms), { tone: "ai" }) },
        ],
        table: {
          columns: [
            { key: "candidate", label: "Candidate" },
            { key: "client", label: "Client" },
            { key: "vms", label: "VMS" },
            { key: "workerId", label: "Worker ID" },
            { key: "status", label: "Status", type: "status" },
            { key: "effective", label: "Effective", type: "date" },
          ],
          rows,
        },
      };
    },
  },
  {
    slug: "timesheet-readiness",
    name: "Timesheet Readiness Report",
    description: "Timesheet system, frequency, approval manager, and VMS linkage readiness for every upcoming and active worker.",
    section: "billing",
    spec: "§60.5",
    personas: [AM, ON],
    owner: "Billing Operations",
    load(ds) {
      const xs = ds.candidates.filter((c) => c.billing && (isActive(c) || c.status === "PLACED"));
      const rows = xs.map((c) => {
        const cl = ds.clients.find((x) => x.name === c.clientName);
        const contact = cl ? "Client hiring manager" : "—";
        const tr = (idx(ds).trainings.get(c.id) ?? []).find((t) => /timekeep/i.test(t.title));
        const ready = c.billing!.timesheetMethod && c.billing!.vmsId;
        return { candidate: fullName(c), client: c.clientName ?? "—", system: cl?.vmsPlatform ?? "HireMe Timesheets", frequency: cl?.invoiceFrequency ?? "Weekly", approver: contact, vmsLinked: c.billing!.vmsId ? "Linked" : "Not linked", training: tr ? title(tr.status) : "Not assigned", status: ready ? "Ready" : "Setup incomplete" };
      });
      return {
        kpis: [
          { label: "Workers", value: rows.length },
          { label: "Timesheet ready", value: rows.filter((r) => r.status === "Ready").length, tone: "success" },
          { label: "Setup incomplete", value: rows.filter((r) => r.status !== "Ready").length, tone: "warning" },
          { label: "VMS not linked", value: rows.filter((r) => r.vmsLinked !== "Linked").length, tone: "danger" },
        ],
        charts: [
          { kind: "bar", title: "Readiness by timesheet system", drillKey: "system", points: points(countBy(rows.filter((r) => r.status !== "Ready"), (r) => r.system), { tone: "warning" }) },
          { kind: "bar", title: "Status", drillKey: "status", points: points(countBy(rows, (r) => r.status), { tones: { Ready: "success", "Setup incomplete": "warning" } }) },
        ],
        table: {
          columns: [
            { key: "candidate", label: "Candidate" },
            { key: "client", label: "Client" },
            { key: "system", label: "Timesheet system" },
            { key: "frequency", label: "Frequency" },
            { key: "approver", label: "Approver" },
            { key: "vmsLinked", label: "VMS", type: "status" },
            { key: "training", label: "Timekeeping training", type: "status" },
            { key: "status", label: "Status", type: "status" },
          ],
          rows,
        },
      };
    },
  },
  {
    slug: "revenue-at-risk",
    name: "Revenue-at-Risk Report",
    description: "Candidates who may start without complete billing setup, with estimated billable value at risk.",
    section: "billing",
    spec: "§60.6",
    personas: [AM, EX, SA],
    owner: "Finance",
    dateScope: "none",
    definitions: [{ term: "Value at risk", def: "Bill rate × 40 h × 4 weeks for candidates starting within 21 days with billing not ready (default $85/h when no rate)." }],
    load(ds) {
      const xs = ds.candidates.filter((c) => isActive(c) && c.billing?.status !== "READY" && (daysUntil(ds, c.startDate) ?? 99) <= 21 && (daysUntil(ds, c.startDate) ?? -1) >= -7);
      const rows = xs.map((c) => {
        const { bill } = ratesFor(ds, c);
        const rate = bill ?? 85;
        return { candidate: fullName(c), client: c.clientName ?? "—", start: iso(c.startDate), daysAtRisk: Math.max(0, -(daysUntil(ds, c.startDate) ?? 0)), daysToStart: daysUntil(ds, c.startDate), billRate: rate, value: Math.round(rate * WEEKLY_HOURS * 4), missing: missingChecks(c.billing, BILLING_CHECKS).slice(0, 3).join(", ") || "—", owner: ds.clients.find((x) => x.name === c.clientName)?.accountManager ?? "—" };
      });
      return {
        kpis: [
          { label: "Candidates at risk", value: rows.length, tone: "warning" },
          { label: "Revenue at risk (4 wk)", value: sum(rows.map((r) => r.value)), format: "currency", tone: "danger" },
          { label: "Already started", value: rows.filter((r) => (r.daysToStart ?? 0) < 0).length, tone: "danger" },
          { label: "Avg bill rate", value: round(avg(rows.map((r) => r.billRate)), 2), format: "currency" },
        ],
        charts: [
          { kind: "bar", title: "Value at risk by client", drillKey: "client", format: "currency", points: [...countBy(rows, (r) => r.client).keys()].map((k) => ({ label: k, value: sum(rows.filter((r) => r.client === k).map((r) => r.value)), tone: "danger" as const })).sort((a, b) => b.value - a.value) },
          { kind: "bar", title: "By account manager", drillKey: "owner", format: "currency", points: [...countBy(rows, (r) => r.owner).keys()].map((k) => ({ label: k, value: sum(rows.filter((r) => r.owner === k).map((r) => r.value)), tone: "warning" as const })) },
        ],
        table: {
          columns: [
            { key: "candidate", label: "Candidate" },
            { key: "client", label: "Client" },
            { key: "start", label: "Start", type: "date" },
            { key: "daysToStart", label: "Days to start", type: "days" },
            { key: "billRate", label: "Bill rate", type: "currency" },
            { key: "value", label: "Value at risk", type: "currency" },
            { key: "missing", label: "Missing" },
            { key: "owner", label: "Account manager" },
          ],
          rows,
          sort: { key: "value", dir: "desc" },
        },
      };
    },
  },

  // ── Lifecycle (§68) ──────────────────────────────────────
  {
    slug: "assignment-extensions",
    name: "Assignment Extension Report",
    description: "Upcoming end dates, extension status, proposed rate changes, and client approval for active consultants.",
    section: "lifecycle",
    spec: "§68.1",
    personas: [AM, SA],
    owner: "Client Services",
    dateScope: "none",
    load(ds) {
      const xs = ds.consultants.filter((c) => c.endDate && (daysUntil(ds, c.endDate) ?? -1) >= -14 && (daysUntil(ds, c.endDate) ?? 999) <= 90);
      const rows = xs.map((c) => {
        const d = daysUntil(ds, c.endDate)!;
        const ext = c.status === "EXTENSION_PENDING" ? "Requested" : c.status === "ACTIVE" && d > 45 ? "Not started" : c.status === "OFFBOARDING" ? "Declined" : "Approved";
        return { consultant: fullName(c), client: c.clientName ?? "—", am: c.accountManager ?? "—", endDate: iso(c.endDate), daysLeft: d, extension: ext, rate: c.billRate, proposedRate: ext === "Requested" || ext === "Approved" ? round((c.billRate ?? 0) * 1.04, 2) : null, clientApproval: ext === "Approved" ? "Approved" : ext === "Requested" ? "Pending" : "—", docs: ext === "Approved" ? "Amendment signed" : ext === "Requested" ? "Amendment pending" : "—" };
      });
      return {
        kpis: [
          { label: "Ending ≤90 days", value: rows.length },
          { label: "Ending ≤30 days", value: rows.filter((r) => r.daysLeft <= 30).length, tone: "warning" },
          { label: "Extension requested", value: rows.filter((r) => r.extension === "Requested").length, tone: "info" },
          { label: "Extension approved", value: rows.filter((r) => r.extension === "Approved").length, tone: "success" },
          { label: "No action yet", value: rows.filter((r) => r.extension === "Not started").length, tone: "danger" },
        ],
        charts: [
          { kind: "bar", title: "Extension status", drillKey: "extension", points: points(countBy(rows, (r) => r.extension), { tones: { Approved: "success", Requested: "info", "Not started": "warning", Declined: "danger" } }) },
          { kind: "trend", title: "End dates by week (next 12)", points: forwardWeeks(ds, xs, (c) => c.endDate, 12, "warning") },
        ],
        table: {
          columns: [
            { key: "consultant", label: "Consultant" },
            { key: "client", label: "Client" },
            { key: "am", label: "Account manager" },
            { key: "endDate", label: "End date", type: "date" },
            { key: "daysLeft", label: "Days left", type: "days" },
            { key: "extension", label: "Extension", type: "status" },
            { key: "rate", label: "Bill rate", type: "currency" },
            { key: "proposedRate", label: "Proposed rate", type: "currency" },
            { key: "clientApproval", label: "Client approval", type: "status" },
            { key: "docs", label: "Documentation" },
          ],
          rows,
          sort: { key: "daysLeft", dir: "asc" },
        },
      };
    },
  },
  {
    slug: "conversions",
    name: "Conversion Report",
    description: "Consultants converted to client employees with tenure, client, conversion fee, and offboarding tasks.",
    section: "lifecycle",
    spec: "§68.2",
    personas: [AM, EX],
    owner: "Client Services",
    definitions: [{ term: "Conversion fee", def: "Bill rate × 2,080 h × 20%, reduced 1/12 per month of tenure (min 0)." }],
    load(ds) {
      const xs = ds.consultants.filter((c) => c.status === "CONVERTED");
      const rows = xs.map((c) => {
        const tenure = c.startDate ? Math.round(daysBetween(c.startDate, c.endDate ?? ds.now) / 30) : 0;
        const fee = Math.max(0, Math.round((c.billRate ?? 0) * 2080 * 0.2 * (1 - tenure / 12)));
        return { consultant: fullName(c), client: c.clientName ?? "—", title: c.title ?? "—", convertedOn: iso(c.endDate ?? c.updatedAt), tenureMonths: tenure, fee, approval: "Approved", equipment: pick2(c.id) };
      });
      return {
        kpis: [
          { label: "Conversions", value: rows.length, tone: "success" },
          { label: "Conversion fees", value: sum(rows.map((r) => r.fee)), format: "currency" },
          { label: "Avg tenure at conversion", value: round(avg(rows.map((r) => r.tenureMonths))), hint: "months" },
          { label: "Conversion rate", value: pct(rows.length, ds.consultants.length), format: "percent" },
        ],
        charts: [{ kind: "bar", title: "Conversions by client", drillKey: "client", points: points(countBy(rows, (r) => r.client), { tone: "success" }) }],
        table: {
          columns: [
            { key: "consultant", label: "Consultant" },
            { key: "client", label: "Client" },
            { key: "title", label: "Role" },
            { key: "convertedOn", label: "Converted", type: "date" },
            { key: "tenureMonths", label: "Tenure (mo)", type: "number" },
            { key: "fee", label: "Fee", type: "currency" },
            { key: "approval", label: "Approval", type: "status" },
            { key: "equipment", label: "Equipment disposition" },
          ],
          rows,
        },
      };
    },
  },
  {
    slug: "offboarding-readiness",
    name: "Offboarding Readiness Report",
    description: "Final timesheet, final payroll, access removal, equipment return, exit survey, and rehire status for departing consultants.",
    section: "lifecycle",
    spec: "§68.3",
    personas: [ON, AM, SA],
    owner: "HR Operations",
    load(ds) {
      const xs = ds.consultants.filter((c) => c.status === "OFFBOARDING" || ((c.status === "FORMER" || c.status === "CONVERTED") && (ageDays(ds, c.endDate) ?? 999) <= 30));
      const steps = ["Final timesheet", "Final payroll", "Access removal", "Equipment return", "Exit survey", "Client closure"];
      const rows = xs.map((c) => {
        const done = c.status === "OFFBOARDING" ? steps.map((_, i) => hash(c.id + i) % 3 !== 0) : steps.map(() => true);
        const rec: Record<string, string | number | null> = { consultant: fullName(c), client: c.clientName ?? "—", endDate: iso(c.endDate), status: title(c.status) };
        steps.forEach((s, i) => (rec[s] = done[i] ? "Done" : "Pending"));
        rec.complete = pct(done.filter(Boolean).length, steps.length, 0);
        rec.rehire = c.status === "INELIGIBLE" ? "Ineligible" : "Eligible";
        return rec;
      });
      const pending = new Map(steps.map((s) => [s, rows.filter((r) => r[s] === "Pending").length]));
      return {
        kpis: [
          { label: "Offboardings", value: rows.length },
          { label: "Fully complete", value: rows.filter((r) => r.complete === 100).length, tone: "success" },
          { label: "Access not removed", value: pending.get("Access removal") ?? 0, tone: "danger" },
          { label: "Equipment outstanding", value: pending.get("Equipment return") ?? 0, tone: "warning" },
        ],
        charts: [{ kind: "bar", title: "Pending offboarding steps", points: points(pending, { tone: "warning" }) }],
        table: {
          columns: [
            { key: "consultant", label: "Consultant" },
            { key: "client", label: "Client" },
            { key: "endDate", label: "End date", type: "date" },
            ...steps.map((s) => ({ key: s, label: s, type: "status" as const })),
            { key: "complete", label: "Complete", type: "percent" },
            { key: "rehire", label: "Rehire", type: "status" },
          ],
          rows,
          sort: { key: "complete", dir: "asc" },
        },
      };
    },
  },
  {
    slug: "rehire-eligibility",
    name: "Rehire Eligibility Report",
    description: "Former consultants with exit reason, rehire status, restrictions, expired documents, and delta-onboarding needs.",
    section: "lifecycle",
    spec: "§68.4 · §38",
    personas: [AM, "recruiter", SA],
    owner: "Talent Acquisition",
    load(ds) {
      const xs = ds.consultants.filter((c) => ["FORMER", "INELIGIBLE", "CONVERTED"].includes(c.status));
      const REASONS = ["Assignment completed", "Project ended", "Resigned", "Client budget cut", "Converted", "Performance"];
      const rows = xs.map((c) => {
        const reason = c.status === "CONVERTED" ? "Converted" : c.status === "INELIGIBLE" ? "Performance" : REASONS[hash(c.id) % 4];
        const monthsAway = Math.max(0, Math.round((ageDays(ds, c.endDate) ?? 0) / 30));
        const expired = monthsAway >= 12 ? "I-9 reverification, Background check" : monthsAway >= 6 ? "Background check" : "None";
        return { consultant: fullName(c), lastClient: c.clientName ?? "—", lastRole: c.title ?? "—", ended: iso(c.endDate), monthsAway, reason, rehire: c.status === "INELIGIBLE" ? "Ineligible" : "Eligible", restrictions: c.status === "INELIGIBLE" ? "Do not rehire — HR review" : c.status === "CONVERTED" ? "Client non-solicit (12 mo)" : "—", expired, delta: expired === "None" ? "Profile refresh only" : `Re-collect: ${expired}` };
      });
      return {
        kpis: [
          { label: "Former consultants", value: rows.length },
          { label: "Rehire eligible", value: rows.filter((r) => r.rehire === "Eligible").length, tone: "success" },
          { label: "Ineligible", value: rows.filter((r) => r.rehire === "Ineligible").length, tone: "danger" },
          { label: "Delta-onboard ready", value: rows.filter((r) => r.expired === "None" && r.rehire === "Eligible").length, tone: "info" },
        ],
        charts: [
          { kind: "bar", title: "Exit reason", drillKey: "reason", points: points(countBy(rows, (r) => r.reason)) },
          { kind: "bar", title: "Delta onboarding requirement", drillKey: "expired", points: points(countBy(rows, (r) => r.expired), { tone: "ai" }) },
        ],
        table: {
          columns: [
            { key: "consultant", label: "Consultant" },
            { key: "lastClient", label: "Last client" },
            { key: "lastRole", label: "Last role" },
            { key: "ended", label: "Ended", type: "date" },
            { key: "monthsAway", label: "Months away", type: "number" },
            { key: "reason", label: "Exit reason" },
            { key: "rehire", label: "Rehire", type: "status" },
            { key: "restrictions", label: "Restrictions" },
            { key: "expired", label: "Expired items" },
            { key: "delta", label: "Delta onboarding" },
          ],
          rows,
        },
      };
    },
  },
  {
    slug: "consultant-retention",
    name: "Consultant Retention Report",
    description: "Tenure distribution, extension and conversion rates, early terminations, and status mix across the consultant base.",
    section: "lifecycle",
    spec: "§68.6",
    personas: [AM, EX, "recruiting-manager"],
    owner: "Client Services",
    load(ds) {
      const cs = ds.consultants;
      const tenure = (c: (typeof cs)[number]) => (c.startDate ? Math.max(0, Math.round(daysBetween(c.startDate, c.endDate && c.endDate < ds.now ? c.endDate : ds.now) / 30)) : 0);
      const TB: [string, number, number][] = [["0–3 mo", 0, 3], ["4–6 mo", 4, 6], ["7–12 mo", 7, 12], ["13–24 mo", 13, 24], ["25+ mo", 25, Infinity]];
      const rows = cs.map((c) => ({ consultant: fullName(c), client: c.clientName ?? "—", status: title(c.status), tenure: tenure(c), tenureBucket: bucket(tenure(c), TB), billRate: c.billRate, start: iso(c.startDate), end: iso(c.endDate) }));
      const ended = cs.filter((c) => ["FORMER", "CONVERTED", "INELIGIBLE", "OFFBOARDING"].includes(c.status));
      return {
        kpis: [
          { label: "Consultants", value: cs.length },
          { label: "Active", value: cs.filter((c) => c.status === "ACTIVE" || c.status === "EXTENSION_PENDING").length, tone: "success" },
          { label: "Avg tenure", value: round(avg(rows.map((r) => r.tenure))), hint: "months" },
          { label: "Conversion rate", value: pct(cs.filter((c) => c.status === "CONVERTED").length, cs.length), format: "percent" },
          { label: "Early terminations (<3 mo)", value: ended.filter((c) => tenure(c) < 3).length, tone: "danger" },
        ],
        charts: [
          { kind: "bar", title: "Tenure distribution", drillKey: "tenureBucket", points: points(countBy(rows, (r) => r.tenureBucket), { order: TB.map((t) => t[0]), tone: "info" }) },
          { kind: "bar", title: "Status mix", drillKey: "status", points: points(countBy(rows, (r) => r.status), { tones: { Active: "success", Bench: "neutral", "Extension Pending": "info", Offboarding: "warning", Converted: "ai", Former: "neutral", Ineligible: "danger" } }) },
          { kind: "bar", title: "Avg tenure by client (months)", drillKey: "client", points: [...countBy(rows, (r) => r.client).keys()].map((k) => ({ label: k, value: round(avg(rows.filter((r) => r.client === k).map((r) => r.tenure))), tone: "info" as const })).sort((a, b) => b.value - a.value).slice(0, 12) },
        ],
        table: {
          columns: [
            { key: "consultant", label: "Consultant" },
            { key: "client", label: "Client" },
            { key: "status", label: "Status", type: "status" },
            { key: "tenure", label: "Tenure (mo)", type: "number" },
            { key: "tenureBucket", label: "Tenure band" },
            { key: "billRate", label: "Bill rate", type: "currency" },
            { key: "start", label: "Start", type: "date" },
            { key: "end", label: "End", type: "date" },
          ],
          rows,
          sort: { key: "tenure", dir: "desc" },
        },
      };
    },
  },
  {
    slug: "wc-new-hire",
    name: "WC New Hire Report",
    description: "New hires in the last 60 days by work state and job category for workers' compensation reporting.",
    section: "lifecycle",
    spec: "Back office",
    personas: [SA, AM],
    owner: "Risk Management",
    definitions: [{ term: "WC class", def: "Workers' comp classification derived from job category (8810 clerical/IT, 8832 healthcare, 9015 facilities)." }],
    load(ds) {
      const WC = (cat: string) => (/health|nurs|clinic/i.test(cat) ? "8832 — Healthcare professional" : /retail|ops|facilit|warehouse|logist|manufact/i.test(cat) ? "9015 — Operations / facilities" : "8810 — Clerical / IT");
      const xs = ds.candidates.filter((c) => c.status === "PLACED" && c.startDate && (ageDays(ds, c.startDate) ?? 999) <= 60 && (ageDays(ds, c.startDate) ?? -1) >= 0);
      const rows = xs.map((c) => {
        const a = ds.assignments.find((x) => x.candidateId === c.id);
        const cat = a?.jobCategory ?? c.skillFamily ?? "General";
        return { employee: fullName(c), client: c.clientName ?? "—", state: c.state ?? a?.workState ?? "—", hireDate: iso(c.startDate), employment: employment(c.employmentType), category: cat, wcClass: WC(cat), payRate: a?.payRate ?? null };
      });
      return {
        kpis: [
          { label: "New hires (60d)", value: rows.length, tone: "success" },
          { label: "States", value: new Set(rows.map((r) => r.state)).size },
          { label: "W-2 hires (WC-covered)", value: rows.filter((r) => r.employment === "W-2").length },
          { label: "Est. weekly payroll", value: Math.round(sum(rows.map((r) => (r.payRate ?? 0) * WEEKLY_HOURS))), format: "currency" },
        ],
        charts: [
          { kind: "bar", title: "New hires by state", drillKey: "state", points: points(countBy(rows, (r) => r.state), { limit: 15 }) },
          { kind: "bar", title: "By WC class", drillKey: "wcClass", points: points(countBy(rows, (r) => r.wcClass), { tone: "ai" }) },
        ],
        table: {
          columns: [
            { key: "employee", label: "Employee" },
            { key: "client", label: "Client" },
            { key: "state", label: "Work state" },
            { key: "hireDate", label: "Hire date", type: "date" },
            { key: "employment", label: "Employment" },
            { key: "category", label: "Job category" },
            { key: "wcClass", label: "WC class" },
            { key: "payRate", label: "Pay rate", type: "currency" },
          ],
          rows,
          sort: { key: "hireDate", dir: "desc" },
        },
      };
    },
  },
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function pick2(id: string): string {
  return ["Returned", "Transferred to client", "Return pending"][hash(id) % 3];
}

