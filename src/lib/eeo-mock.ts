/**
 * EEO/EEOC mock demographics (§57, §66). The real schema doesn't capture
 * race / ethnicity / sex / veteran / disability yet — these are collected via
 * voluntary EEO Self-ID forms during onboarding (planned module). Until then,
 * we synthesize deterministic demographics from existing CANDIDATES and
 * CONSULTANTS so the reports are visually complete.
 *
 * Everything here is intentionally hash-derived from names so the numbers are
 * stable across renders. When real Self-ID data lands, only this file changes
 * — the report UIs stay identical.
 */
import { CANDIDATES } from "@/lib/candidates";
import { CONSULTANTS } from "@/lib/consultants";

export const EEO_JOB_CATEGORIES = [
  "1.1 Executive/Senior Level Officials and Managers",
  "1.2 First/Mid-Level Officials and Managers",
  "2 Professionals",
  "3 Technicians",
  "4 Sales Workers",
  "5 Administrative Support Workers",
  "6 Craft Workers",
  "7 Operatives",
  "8 Laborers and Helpers",
  "9 Service Workers",
] as const;

export type EeoJobCategory = (typeof EEO_JOB_CATEGORIES)[number];

export const RACE_ETHNICITY_GROUPS = [
  "Hispanic/Latino",
  "White",
  "Black or African American",
  "Native Hawaiian/Pacific Islander",
  "Asian",
  "American Indian/Alaska Native",
  "Two or More Races",
] as const;

export type RaceEthnicity = (typeof RACE_ETHNICITY_GROUPS)[number];
export type Sex = "M" | "F";

/* ------------------------------- Hash helper ------------------------------ */

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(arr: readonly T[], n: number): T {
  // JS `%` preserves sign — coerce to unsigned 32-bit so a negative seed
  // (e.g. h >> 3 can be negative) never indexes out of range.
  const idx = (n >>> 0) % arr.length;
  return arr[idx];
}

/* --------------------------- Per-person mapping --------------------------- */

export type EeoRecord = {
  id: string;
  name: string;
  jobCategory: EeoJobCategory;
  raceEthnicity: RaceEthnicity;
  sex: Sex;
  veteran: boolean;
  disability: boolean;
  source: "candidate" | "consultant";
  role: string;
  client: string;
};

const ROLE_TO_CATEGORY: Record<string, EeoJobCategory> = {
  "Senior Data Analyst": "2 Professionals",
  "Data Engineer": "2 Professionals",
  "Financial Analyst": "2 Professionals",
  Accountant: "2 Professionals",
  "DevOps Engineer": "2 Professionals",
  "Backend Engineer": "2 Professionals",
  "Solutions Architect": "1.2 First/Mid-Level Officials and Managers",
  "QA Engineer": "3 Technicians",
  "Product Designer": "2 Professionals",
  "RN — ICU": "2 Professionals",
  "Clinical Coordinator": "1.2 First/Mid-Level Officials and Managers",
  "Care Navigator": "5 Administrative Support Workers",
  "Pharmacy Technician": "3 Technicians",
  "Field Technician": "3 Technicians",
};

function categoryFor(role: string, h: number): EeoJobCategory {
  return ROLE_TO_CATEGORY[role] ?? pick(EEO_JOB_CATEGORIES, h);
}

function buildRecord(
  id: string,
  name: string,
  role: string,
  client: string,
  source: "candidate" | "consultant",
): EeoRecord {
  const h = hash(name);
  return {
    id,
    name,
    source,
    role,
    client,
    jobCategory: categoryFor(role, h),
    raceEthnicity: pick(RACE_ETHNICITY_GROUPS, h >> 3),
    sex: h % 2 === 0 ? "F" : "M",
    veteran: h % 11 === 0, // ~9% — realistic for US workforce
    disability: h % 17 === 0,
  };
}

/** Synthesized EEO record set covering active workforce + onboarding pipeline. */
export const EEO_RECORDS: EeoRecord[] = [
  ...CONSULTANTS.map((c) =>
    buildRecord(c.id, c.name, c.role, c.client, "consultant"),
  ),
  ...CANDIDATES.map((c) =>
    buildRecord(c.id, c.name, c.role, c.client, "candidate"),
  ),
];

/* ------------------------- Synthetic applicant pool ------------------------ */

/**
 * Applicant pool — much larger than active workforce. Real applicant flow
 * tracks every offer-not-yet-accepted candidate plus historical rejects.
 * Here we extend the visible CANDIDATES with deterministic synthetic
 * applicants so the funnel and adverse-impact math is meaningful.
 */
export type Applicant = {
  id: string;
  raceEthnicity: RaceEthnicity;
  sex: Sex;
  jobCategory: EeoJobCategory;
  stage: "Applied" | "Screened" | "Interviewed" | "Offered" | "Hired";
};

const STAGE_ORDER: Applicant["stage"][] = [
  "Applied",
  "Screened",
  "Interviewed",
  "Offered",
  "Hired",
];

function buildApplicants(): Applicant[] {
  const out: Applicant[] = [];
  // Generate 600 deterministic applicants.
  for (let i = 0; i < 600; i++) {
    const h = hash(`applicant-${i}`);
    const re = pick(RACE_ETHNICITY_GROUPS, h);
    const sex: Sex = (h >> 2) % 2 === 0 ? "F" : "M";
    const cat = pick(EEO_JOB_CATEGORIES, h >> 5);

    // Distribute through funnel — most drop early; small % reach Hired.
    const r = (h >> 7) % 100;
    let stage: Applicant["stage"];
    if (r < 40) stage = "Applied";
    else if (r < 70) stage = "Screened";
    else if (r < 88) stage = "Interviewed";
    else if (r < 96) stage = "Offered";
    else stage = "Hired";

    out.push({ id: `APL-${i}`, raceEthnicity: re, sex, jobCategory: cat, stage });
  }
  return out;
}

export const APPLICANTS: Applicant[] = buildApplicants();

/** Cumulative count reaching a given stage or further. */
export function applicantsAtStage(
  stage: Applicant["stage"],
  filter?: (a: Applicant) => boolean,
): number {
  const idx = STAGE_ORDER.indexOf(stage);
  return APPLICANTS.filter(
    (a) => STAGE_ORDER.indexOf(a.stage) >= idx && (!filter || filter(a)),
  ).length;
}

/* ------------------------------- Aggregations ----------------------------- */

/** Build the EEO-1 grid: counts by [jobCategory][raceEthnicity][sex]. */
export function workforceMatrix(): Record<
  EeoJobCategory,
  Record<RaceEthnicity, { M: number; F: number }>
> {
  const matrix = {} as Record<
    EeoJobCategory,
    Record<RaceEthnicity, { M: number; F: number }>
  >;
  for (const cat of EEO_JOB_CATEGORIES) {
    matrix[cat] = {} as Record<RaceEthnicity, { M: number; F: number }>;
    for (const re of RACE_ETHNICITY_GROUPS) {
      matrix[cat][re] = { M: 0, F: 0 };
    }
  }
  // Multiply each real record to plausible scale (~400 total workforce).
  const SCALE_PER_RECORD = 14;
  for (const r of EEO_RECORDS) {
    const h = hash(r.id);
    const count = SCALE_PER_RECORD + (h % 6); // 14–19 per seed
    matrix[r.jobCategory][r.raceEthnicity][r.sex] += count;
  }
  return matrix;
}

/** Compute totals from the matrix. */
export function workforceTotals() {
  const matrix = workforceMatrix();
  let totalM = 0;
  let totalF = 0;
  let total = 0;
  let minority = 0;
  for (const cat of EEO_JOB_CATEGORIES) {
    for (const re of RACE_ETHNICITY_GROUPS) {
      const cell = matrix[cat][re];
      totalM += cell.M;
      totalF += cell.F;
      total += cell.M + cell.F;
      if (re !== "White") minority += cell.M + cell.F;
    }
  }
  return {
    total,
    totalM,
    totalF,
    minority,
    femalePct: total ? Math.round((totalF / total) * 1000) / 10 : 0,
    malePct: total ? Math.round((totalM / total) * 1000) / 10 : 0,
    minorityPct: total ? Math.round((minority / total) * 1000) / 10 : 0,
  };
}

/** Per-category totals. */
export function categoryTotals(cat: EeoJobCategory) {
  const matrix = workforceMatrix();
  let m = 0;
  let f = 0;
  for (const re of RACE_ETHNICITY_GROUPS) {
    m += matrix[cat][re].M;
    f += matrix[cat][re].F;
  }
  return { m, f, total: m + f };
}

/* --------------------------- VETS-4212 aggregation ------------------------ */

export function vetsMatrix() {
  const out = {} as Record<EeoJobCategory, { total: number; veterans: number }>;
  for (const cat of EEO_JOB_CATEGORIES) out[cat] = { total: 0, veterans: 0 };
  const totals = categoryTotalsAll();
  for (const cat of EEO_JOB_CATEGORIES) {
    const recordsInCat = EEO_RECORDS.filter((r) => r.jobCategory === cat);
    const vetRate =
      recordsInCat.length > 0
        ? recordsInCat.filter((r) => r.veteran).length / recordsInCat.length
        : 0.08;
    out[cat] = {
      total: totals[cat],
      veterans: Math.max(0, Math.round(totals[cat] * vetRate)),
    };
  }
  return out;
}

function categoryTotalsAll(): Record<EeoJobCategory, number> {
  const out = {} as Record<EeoJobCategory, number>;
  for (const cat of EEO_JOB_CATEGORIES) out[cat] = categoryTotals(cat).total;
  return out;
}

/** New hires within the reporting period — scaled subset of total workforce. */
export function vetsNewHires() {
  const out = {} as Record<EeoJobCategory, { total: number; veterans: number }>;
  const matrix = vetsMatrix();
  for (const cat of EEO_JOB_CATEGORIES) {
    const newHires = Math.round(matrix[cat].total * 0.18); // ~18% turnover/new
    const vetNewHires = Math.round(matrix[cat].veterans * 0.22);
    out[cat] = { total: newHires, veterans: vetNewHires };
  }
  return out;
}
