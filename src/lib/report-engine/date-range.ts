/**
 * Report date-range presets (§50.3 global date filter, §49 time-period
 * comparison). Pure — shared by the server page and the client filter bar.
 */

import type { DateRange } from "./types";

export const RANGE_PRESETS: { value: string; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "mtd", label: "This month" },
  { value: "last-month", label: "Last month" },
  { value: "qtd", label: "This quarter" },
  { value: "last-quarter", label: "Last quarter" },
  { value: "ytd", label: "Year to date" },
  { value: "12m", label: "Last 12 months" },
  { value: "custom", label: "Custom range…" },
];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/** Parse "YYYY-MM-DD" as a local date. */
function parseDay(s: string | undefined): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Resolve a preset (or custom from/to) to an inclusive range; undefined = all time. */
export function resolveRange(preset: string | undefined, from?: string, to?: string, now = new Date()): DateRange | undefined {
  const today = endOfDay(now);
  const q = Math.floor(now.getMonth() / 3) * 3;
  const daysBack = (n: number) => startOfDay(new Date(now.getTime() - (n - 1) * 86_400_000));
  let r: { from: Date; to: Date } | null = null;
  switch (preset) {
    case "7d":
      r = { from: daysBack(7), to: today };
      break;
    case "30d":
      r = { from: daysBack(30), to: today };
      break;
    case "90d":
      r = { from: daysBack(90), to: today };
      break;
    case "mtd":
      r = { from: new Date(now.getFullYear(), now.getMonth(), 1), to: today };
      break;
    case "last-month":
      r = { from: new Date(now.getFullYear(), now.getMonth() - 1, 1), to: endOfDay(new Date(now.getFullYear(), now.getMonth(), 0)) };
      break;
    case "qtd":
      r = { from: new Date(now.getFullYear(), q, 1), to: today };
      break;
    case "last-quarter":
      r = { from: new Date(now.getFullYear(), q - 3, 1), to: endOfDay(new Date(now.getFullYear(), q, 0)) };
      break;
    case "ytd":
      r = { from: new Date(now.getFullYear(), 0, 1), to: today };
      break;
    case "12m":
      r = { from: new Date(now.getFullYear(), now.getMonth() - 11, 1), to: today };
      break;
    case "custom": {
      const f = parseDay(from);
      const t = parseDay(to);
      if (f || t) r = { from: f ? startOfDay(f) : new Date(2000, 0, 1), to: t ? endOfDay(t) : today };
      break;
    }
  }
  if (!r) return undefined;
  if (r.from > r.to) r = { from: startOfDay(r.to), to: endOfDay(r.from) };
  const presetLabel = RANGE_PRESETS.find((p) => p.value === preset)?.label;
  const span = `${fmt(r.from)} – ${fmt(r.to)}`;
  return { ...r, label: preset === "custom" || !presetLabel ? span : `${presetLabel} (${span})` };
}
