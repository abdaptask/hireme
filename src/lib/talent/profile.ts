/**
 * Talent profile extracted from a resume (§20 document intelligence, §10.3).
 * One shape for both extractors (built-in heuristics and Claude). Pure.
 */

export type ResumeSkill = { name: string; family: string; mentions: number };

export type ResumeProfile = {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedin: string | null;
  currentTitle: string | null;
  titles: string[];
  yearsExperience: number | null;
  seniority: "Entry" | "Mid" | "Senior" | "Lead" | "Principal / Architect" | "Manager / Director" | null;
  skillFamily: string | null;
  skills: ResumeSkill[];
  certifications: string[];
  education: string[];
  summary: string | null;
  /** 0–1: how much signal the extractor found. */
  confidence: number;
  /** Things a reviewer should check (e.g. name or email differs from the NHR). */
  warnings: string[];
};

export type ParserId = "builtin" | "claude-opus-5-5";

export const PARSER_LABEL: Record<ParserId, string> = {
  builtin: "Built-in extractor",
  "claude-opus-5-5": "Claude Opus 5.5",
};

/** Seniority from years of experience and the current (most recent) title. */
export function inferSeniority(years: number | null, titles: string[]): ResumeProfile["seniority"] {
  const t = (titles[0] ?? "").toLowerCase();
  if (/\b(director|vp|vice president|head of|manager)\b/.test(t)) return "Manager / Director";
  if (/\b(principal|architect|distinguished|staff)\b/.test(t)) return "Principal / Architect";
  if (/\b(lead|team lead|tech lead)\b/.test(t)) return "Lead";
  // An explicit "Senior" title outranks a years-based guess.
  if (/\b(senior|sr\.?)\b/.test(t)) return "Senior";
  if (years === null) return /\bsenior|sr\.?\b/.test(t) ? "Senior" : null;
  if (years >= 12) return "Principal / Architect";
  if (years >= 7 || /\bsenior|sr\.?\b/.test(t)) return "Senior";
  if (years >= 3) return "Mid";
  return "Entry";
}
