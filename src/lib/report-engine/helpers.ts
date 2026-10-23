/**
 * Aggregation helpers shared by report definitions (§69 calculated fields).
 * Pure functions — no I/O.
 */

import type { ChartPoint, Tone } from "./types";
import type { Dataset, DsCandidate } from "./dataset";

export const DAY_MS = 86_400_000;

/** Whole days from `a` to `b` (positive when b is later). */
export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

/** Days until `d` from the dataset snapshot time; null when no date. */
export function daysUntil(ds: Dataset, d: Date | null | undefined): number | null {
  return d ? daysBetween(ds.now, d) : null;
}

/** Days since `d`; null when no date. */
export function ageDays(ds: Dataset, d: Date | null | undefined): number | null {
  return d ? daysBetween(d, ds.now) : null;
}

/** ISO date (YYYY-MM-DD) or null. */
export function iso(d: Date | null | undefined): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

/** "ON_TRACK" → "On Track", "INDEPENDENT_1099" → "Independent 1099". */
export function title(v: string | null | undefined): string {
  if (!v) return "—";
  return v
    .toLowerCase()
    .split(/[_\s-]+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

const EMPLOYMENT_LABEL: Record<string, string> = {
  W2: "W-2",
  C2C: "C2C",
  INDEPENDENT_1099: "1099",
  FULL_TIME: "Full-time",
  CONTRACT_TO_HIRE: "Contract-to-hire",
  INTERN: "Intern",
};

export function employment(v: string | null | undefined): string {
  return v ? (EMPLOYMENT_LABEL[v] ?? title(v)) : "—";
}

export function fullName(p: { firstName: string; lastName: string }): string {
  return `${p.firstName} ${p.lastName}`;
}

export function pct(n: number, d: number, digits = 1): number {
  if (!d) return 0;
  const f = 10 ** digits;
  return Math.round((n / d) * 100 * f) / f;
}

export function round(n: number, digits = 1): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

export function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0);
}

export function avg(xs: number[]): number {
  return xs.length ? sum(xs) / xs.length : 0;
}

export function percentile(xs: number[], p: number): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const i = Math.min(s.length - 1, Math.max(0, Math.ceil((p / 100) * s.length) - 1));
  return s[i];
}

export const median = (xs: number[]) => percentile(xs, 50);

/** Count items by key, preserving first-seen order. */
export function countBy<T>(xs: T[], key: (x: T) => string | null | undefined): Map<string, number> {
  const m = new Map<string, number>();
  for (const x of xs) {
    const k = key(x) ?? "Unassigned";
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

export function groupBy<T>(xs: T[], key: (x: T) => string | null | undefined): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const x of xs) {
    const k = key(x) ?? "Unassigned";
    const arr = m.get(k);
    if (arr) arr.push(x);
    else m.set(k, [x]);
  }
  return m;
}

/** Map → chart points, sorted descending (or in `order` when given). */
export function points(
  m: Map<string, number>,
  opts: { limit?: number; order?: string[]; tone?: Tone; tones?: Record<string, Tone> } = {},
): ChartPoint[] {
  let entries = [...m.entries()];
  if (opts.order) {
    entries = opts.order.map((k) => [k, m.get(k) ?? 0] as [string, number]);
  } else {
    entries.sort((a, b) => b[1] - a[1]);
  }
  if (opts.limit) entries = entries.slice(0, opts.limit);
  return entries.map(([label, value]) => ({
    label,
    value: round(value, 1),
    tone: opts.tones?.[label] ?? opts.tone,
  }));
}

/** Labels for the trailing N calendar months, oldest first ("May '26"). */
export function lastMonths(ds: Dataset, n: number): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  let anchor = ds.now;
  if (ds.range) {
    anchor = ds.range.to < ds.now ? ds.range.to : ds.now;
    const f = ds.range.from;
    n = Math.max(1, Math.min(24, (anchor.getFullYear() - f.getFullYear()) * 12 + anchor.getMonth() - f.getMonth() + 1));
  }
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1);
    out.push({ key: monthKey(d), label: d.toLocaleString("en-US", { month: "short" }) + ` '${String(d.getFullYear()).slice(2)}` });
  }
  return out;
}

export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Monthly trend points for dated items over the trailing N months. */
export function monthlyTrend<T>(ds: Dataset, xs: T[], date: (x: T) => Date | null | undefined, n = 9, tone: Tone = "info"): ChartPoint[] {
  const counts = countBy(
    xs.filter((x) => date(x)),
    (x) => monthKey(date(x) as Date),
  );
  return lastMonths(ds, n).map((m) => ({ label: m.label, value: counts.get(m.key) ?? 0, tone }));
}

/** Trend end date and span: the selected range when present, else trailing from now. */
function trendWindow(ds: Dataset, unitDays: number, n: number): { end: number; n: number } {
  if (!ds.range) return { end: ds.now.getTime(), n };
  const span = Math.ceil((ds.range.to.getTime() - ds.range.from.getTime()) / (unitDays * DAY_MS));
  return { end: Math.min(ds.range.to.getTime(), ds.now.getTime()), n: Math.max(2, Math.min(span, 26)) };
}

/** Weekly trend for the trailing N weeks (label = week start "Oct 6"). */
export function weeklyTrend<T>(ds: Dataset, xs: T[], date: (x: T) => Date | null | undefined, n = 12, tone: Tone = "info"): ChartPoint[] {
  const out: ChartPoint[] = [];
  const w = trendWindow(ds, 7, n);
  n = w.n;
  for (let i = n - 1; i >= 0; i--) {
    const end = w.end - i * 7 * DAY_MS;
    const start = end - 7 * DAY_MS;
    const value = xs.filter((x) => {
      const d = date(x);
      return d && d.getTime() > start && d.getTime() <= end;
    }).length;
    out.push({ label: new Date(start + DAY_MS).toLocaleString("en-US", { month: "short", day: "numeric" }), value, tone });
  }
  return out;
}

/** Forward-looking weekly buckets (next N weeks) for future dates. */
export function forwardWeeks<T>(ds: Dataset, xs: T[], date: (x: T) => Date | null | undefined, n = 8, tone: Tone = "info"): ChartPoint[] {
  const out: ChartPoint[] = [];
  for (let i = 0; i < n; i++) {
    const start = ds.now.getTime() + i * 7 * DAY_MS;
    const end = start + 7 * DAY_MS;
    const value = xs.filter((x) => {
      const d = date(x);
      return d && d.getTime() >= start && d.getTime() < end;
    }).length;
    out.push({ label: `Wk of ${new Date(start).toLocaleString("en-US", { month: "short", day: "numeric" })}`, value, tone });
  }
  return out;
}

/** Bucket a numeric value into labelled ranges ([min, max] inclusive). */
export function bucket(v: number, ranges: [string, number, number][]): string {
  for (const [label, lo, hi] of ranges) if (v >= lo && v <= hi) return label;
  return ranges[ranges.length - 1][0];
}

/** §53.3 aging buckets. */
export const AGING_BUCKETS: [string, number, number][] = [
  ["0–1 days", 0, 1],
  ["2–3 days", 2, 3],
  ["4–5 days", 4, 5],
  ["6–7 days", 6, 7],
  ["8–14 days", 8, 14],
  ["15+ days", 15, Infinity],
];

export const AGING_ORDER = AGING_BUCKETS.map((b) => b[0]);

/** Deterministic pick from a list keyed by a string (stable mock attribution). */
export function pick<T>(key: string, xs: T[]): T {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return xs[h % xs.length];
}

// ─────────────────────────────────────────────────────────
// Candidate-level derived facts (§33 risk engine inputs)
// ─────────────────────────────────────────────────────────

export const ACTIVE_STATUSES = new Set(["OFFER_ACCEPTED", "ONBOARDING"]);
export const DROPPED_STATUSES = new Set(["WITHDRAWN", "ARCHIVED"]);

export function isActive(c: DsCandidate): boolean {
  return ACTIVE_STATUSES.has(c.status);
}

export const RISK_TONE: Record<string, Tone> = {
  "On Track": "success",
  "Needs Attention": "warning",
  "At Risk": "danger",
  Unlikely: "danger",
};

export const RISK_ORDER = ["On Track", "Needs Attention", "At Risk", "Unlikely"];

/** Candidate client name — candidate field, falling back to assignment. */
export function clientOf(ds: Dataset, candidateId: string | null | undefined): string {
  if (!candidateId) return "—";
  const c = ds.candById.get(candidateId);
  return c?.clientName ?? "—";
}

export function nameOf(ds: Dataset, candidateId: string | null | undefined): string {
  if (!candidateId) return "—";
  const c = ds.candById.get(candidateId);
  return c ? fullName(c) : "—";
}

/** Indexes of child records by candidate, built lazily once per dataset. */
const indexCache = new WeakMap<Dataset, ReturnType<typeof buildIndex>>();

function buildIndex(ds: Dataset) {
  return {
    docs: groupBy(ds.documents, (d) => d.candidateId),
    screenings: groupBy(ds.screenings, (s) => s.candidateId),
    equipment: groupBy(ds.equipment, (e) => e.candidateId),
    trainings: groupBy(ds.trainings, (t) => t.candidateId),
    comms: groupBy(ds.communications, (m) => m.candidateId),
    exceptions: groupBy(ds.exceptions, (e) => e.candidateId),
  };
}

export function idx(ds: Dataset) {
  let i = indexCache.get(ds);
  if (!i) {
    i = buildIndex(ds);
    indexCache.set(ds, i);
  }
  return i;
}

/** Readiness facts for a candidate (§16, §41.2 readiness radar). */
export function readiness(ds: Dataset, c: DsCandidate) {
  const i = idx(ds);
  const docs = i.docs.get(c.id) ?? [];
  const scr = i.screenings.get(c.id) ?? [];
  const eq = i.equipment.get(c.id) ?? [];
  const tr = i.trainings.get(c.id) ?? [];
  const openDocs = docs.filter((d) => d.status !== "APPROVED");
  const compliance = docs.length > 0 && openDocs.length === 0 && scr.every((s) => s.status === "CLEAR");
  const screening = scr.length === 0 ? "Not ordered" : scr.every((s) => s.status === "CLEAR") ? "Clear" : scr.some((s) => ["REVIEW_REQUIRED", "ADVERSE_PENDING"].includes(s.status)) ? "Review Required" : scr.some((s) => s.status === "VENDOR_DELAYED") ? "Vendor Delayed" : "In Progress";
  const equipmentReady = eq.length === 0 ? "None required" : eq.every((e) => ["DELIVERED", "ENROLLED", "READY"].includes(e.status)) ? "Ready" : eq.some((e) => ["DELAYED", "LOST", "DAMAGED"].includes(e.status)) ? "Delayed" : "In Transit";
  const trainingDone = tr.filter((t) => ["COMPLETED", "WAIVED"].includes(t.status)).length;
  return {
    docs,
    openDocs,
    compliance,
    payroll: c.payroll?.status === "READY",
    billing: c.billing?.status === "READY",
    screening,
    equipment: equipmentReady,
    training: tr.length ? `${trainingDone}/${tr.length}` : "—",
    trainingComplete: tr.length === 0 || trainingDone === tr.length,
  };
}

/** Human-readable start-date risk factors (§33 "explain the score"). */
export function riskFactors(ds: Dataset, c: DsCandidate): string[] {
  const r = readiness(ds, c);
  const f: string[] = [];
  if (r.openDocs.length) f.push(`${r.openDocs.length} document${r.openDocs.length > 1 ? "s" : ""} open`);
  if (["Review Required", "Vendor Delayed", "In Progress", "Not ordered"].includes(r.screening)) f.push(`Screening: ${r.screening.toLowerCase()}`);
  if (!r.payroll) f.push("Payroll not ready");
  if (!r.billing) f.push("Billing not ready");
  if (r.equipment === "Delayed") f.push("Equipment delayed");
  if (!r.trainingComplete) f.push("Training incomplete");
  return f;
}

export function recommendedAction(ds: Dataset, c: DsCandidate): string {
  const r = readiness(ds, c);
  if (r.screening === "Review Required") return "Route screening for adjudication";
  if (r.screening === "Vendor Delayed") return "Escalate with screening vendor";
  if (r.openDocs.some((d) => d.status === "REJECTED" || d.status === "CORRECTION_REQUIRED")) return "Request document correction";
  if (r.openDocs.length) return "Review submitted documents";
  if (r.equipment === "Delayed") return "Expedite equipment shipment";
  if (!r.payroll) return "Complete payroll setup";
  if (!r.billing) return "Capture PO / worker ID";
  if (!r.trainingComplete) return "Nudge training completion";
  return "Confirm Day 1 logistics";
}
