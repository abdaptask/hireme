/**
 * Reporting datasets & helpers (CLAUDE.md §49 reporting catalog, §51 super-admin
 * reports, §64.5 / §67.4 financial, §56.8 client cost).
 *
 * Historical/financial figures are a deterministic synthetic dataset (12-month
 * history) — the live pipeline (CANDIDATES) is far too small to express
 * historical strengths. Replaced by warehouse queries once persistence lands.
 */
import { CANDIDATES, extractedSkills } from "@/lib/candidates";
import type { SkillFamily } from "@/lib/types";

/* --------------------------- Skill & geo mapping --------------------------- */

/** Two-letter state from a "City, ST" style location. */
export function stateFromLocation(location: string): string {
  const m = location.match(/\b([A-Z]{2})\b/);
  return m ? m[1] : "—";
}

/** Live pipeline distribution by AI-classified skill family (§10, §20). */
export function livePipelineBySkill(): { name: string; value: number }[] {
  const counts = new Map<string, number>();
  for (const c of CANDIDATES) {
    const s = extractedSkills(c).family;
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

/** Top granular skills across the live pipeline, from AI résumé extraction. */
export function topPipelineSkills(): { name: string; value: number }[] {
  const counts = new Map<string, number>();
  for (const c of CANDIDATES) {
    for (const skill of extractedSkills(c).skills) {
      counts.set(skill, (counts.get(skill) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
}

/** Number of résumés AI-parsed (one per live candidate, in this mock). */
export const RESUMES_PARSED = CANDIDATES.length;

/* ---------------------------- Skill strengths ------------------------------ */

export type SkillStrength = {
  skill: SkillFamily;
  placements: number; // trailing 12 months
  successRate: number; // % started successfully
  avgTimeToFill: number; // days
  satisfaction: number; // /5
  trend: number[]; // last 6 months placements
};

/** Historical specialty strengths — the data-backed "what are you good at". */
export const SKILL_STRENGTHS: SkillStrength[] = [
  { skill: "Software & Cloud", placements: 342, successRate: 94, avgTimeToFill: 9.1, satisfaction: 4.7, trend: [22, 26, 25, 30, 33, 38] },
  { skill: "Data & Analytics", placements: 287, successRate: 92, avgTimeToFill: 10.4, satisfaction: 4.6, trend: [18, 21, 24, 23, 27, 29] },
  { skill: "Healthcare", placements: 198, successRate: 96, avgTimeToFill: 12.8, satisfaction: 4.8, trend: [12, 14, 15, 17, 18, 21] },
  { skill: "Finance & Accounting", placements: 156, successRate: 90, avgTimeToFill: 11.2, satisfaction: 4.4, trend: [10, 11, 13, 12, 14, 16] },
  { skill: "Design & Product", placements: 88, successRate: 89, avgTimeToFill: 13.5, satisfaction: 4.5, trend: [6, 7, 6, 8, 9, 9] },
  { skill: "Field & Operations", placements: 64, successRate: 87, avgTimeToFill: 8.7, satisfaction: 4.2, trend: [4, 5, 5, 6, 6, 7] },
];

export type GeoStrength = {
  state: string;
  region: string;
  placements: number;
  successRate: number;
};

/** Historical geographical strengths. */
export const GEO_STRENGTHS: GeoStrength[] = [
  { state: "TX", region: "South", placements: 268, successRate: 93 },
  { state: "CA", region: "West", placements: 154, successRate: 91 },
  { state: "IL", region: "Midwest", placements: 132, successRate: 90 },
  { state: "NY", region: "Northeast", placements: 98, successRate: 92 },
  { state: "AZ", region: "West", placements: 76, successRate: 89 },
  { state: "CO", region: "West", placements: 54, successRate: 88 },
  { state: "NC", region: "South", placements: 48, successRate: 90 },
  { state: "MI", region: "Midwest", placements: 41, successRate: 87 },
];

/* ------------------------------- Financials -------------------------------- */

export type MonthlyFinance = {
  period: string;
  revenue: number;
  cost: number;
  onboardings: number;
};

/** Trailing 12 months of financial performance (synthetic, deterministic). */
export const FINANCIAL_MONTHLY: MonthlyFinance[] = [
  { period: "Jul", revenue: 1_820_000, cost: 1_460_000, onboardings: 61 },
  { period: "Aug", revenue: 1_910_000, cost: 1_510_000, onboardings: 64 },
  { period: "Sep", revenue: 1_980_000, cost: 1_560_000, onboardings: 67 },
  { period: "Oct", revenue: 2_040_000, cost: 1_600_000, onboardings: 70 },
  { period: "Nov", revenue: 2_120_000, cost: 1_650_000, onboardings: 72 },
  { period: "Dec", revenue: 2_060_000, cost: 1_640_000, onboardings: 69 },
  { period: "Jan", revenue: 2_210_000, cost: 1_700_000, onboardings: 75 },
  { period: "Feb", revenue: 2_280_000, cost: 1_730_000, onboardings: 78 },
  { period: "Mar", revenue: 2_360_000, cost: 1_780_000, onboardings: 81 },
  { period: "Apr", revenue: 2_420_000, cost: 1_810_000, onboardings: 84 },
  { period: "May", revenue: 2_540_000, cost: 1_870_000, onboardings: 88 },
  { period: "Jun", revenue: 2_610_000, cost: 1_900_000, onboardings: 92 },
];

export type ClientFinance = {
  client: string;
  revenue: number;
  cost: number;
  onboardings: number;
};

export const CLIENT_FINANCIALS: ClientFinance[] = [
  { client: "Meridian Health", revenue: 6_820_000, cost: 5_180_000, onboardings: 214 },
  { client: "Vertex Financial", revenue: 5_140_000, cost: 4_010_000, onboardings: 168 },
  { client: "Northwind Logistics", revenue: 4_360_000, cost: 3_520_000, onboardings: 152 },
  { client: "Atlas Manufacturing", revenue: 3_720_000, cost: 2_980_000, onboardings: 121 },
  { client: "Cobalt Systems", revenue: 2_910_000, cost: 2_240_000, onboardings: 96 },
];

export const COST_BREAKDOWN: { category: string; amount: number }[] = [
  { category: "Payroll operations", amount: 9_640_000 },
  { category: "Background screening", amount: 1_280_000 },
  { category: "Equipment & IT", amount: 940_000 },
  { category: "Rework & corrections", amount: 410_000 },
  { category: "Drop-off cost", amount: 320_000 },
  { category: "Platform & tooling", amount: 280_000 },
];

export const REVENUE_AT_RISK = 1_240_000;

/* ------------------------------- Helpers ----------------------------------- */

export const margin = (f: { revenue: number; cost: number }) =>
  f.revenue - f.cost;

export const marginPct = (f: { revenue: number; cost: number }) =>
  f.revenue ? Math.round(((f.revenue - f.cost) / f.revenue) * 1000) / 10 : 0;

export const costPerOnboarding = (f: { cost: number; onboardings: number }) =>
  f.onboardings ? Math.round(f.cost / f.onboardings) : 0;

/** Percentage change a→b, rounded to 1 dp. */
export function pctChange(prev: number, curr: number): number {
  if (!prev) return 0;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

/** Compact USD: $2.6M, $48K, $920. */
export function formatUsd(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

export type FinanceComparison = {
  label: string;
  current: number;
  previous: number;
  change: number;
  format: "usd" | "pct" | "num";
  goodDirection: "up" | "down";
};

/** Compare the latest month vs the prior month across headline metrics. */
export function monthOverMonth(): FinanceComparison[] {
  const n = FINANCIAL_MONTHLY.length;
  const curr = FINANCIAL_MONTHLY[n - 1];
  const prev = FINANCIAL_MONTHLY[n - 2];
  return [
    {
      label: "Revenue",
      current: curr.revenue,
      previous: prev.revenue,
      change: pctChange(prev.revenue, curr.revenue),
      format: "usd",
      goodDirection: "up",
    },
    {
      label: "Gross margin",
      current: margin(curr),
      previous: margin(prev),
      change: pctChange(margin(prev), margin(curr)),
      format: "usd",
      goodDirection: "up",
    },
    {
      label: "Margin %",
      current: marginPct(curr),
      previous: marginPct(prev),
      change: Math.round((marginPct(curr) - marginPct(prev)) * 10) / 10,
      format: "pct",
      goodDirection: "up",
    },
    {
      label: "Cost / onboarding",
      current: costPerOnboarding(curr),
      previous: costPerOnboarding(prev),
      change: pctChange(costPerOnboarding(prev), costPerOnboarding(curr)),
      format: "usd",
      goodDirection: "down",
    },
    {
      label: "Onboardings",
      current: curr.onboardings,
      previous: prev.onboardings,
      change: pctChange(prev.onboardings, curr.onboardings),
      format: "num",
      goodDirection: "up",
    },
  ];
}
