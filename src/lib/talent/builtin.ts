/**
 * Built-in resume extractor — no external service. Deterministic heuristics:
 * taxonomy skill matching, years from stated experience or employment date
 * ranges, titles, certifications, degrees, and contact details. Pure.
 */

import { CERTIFICATIONS, DEGREES, SKILL_FAMILIES } from "./taxonomy";
import { inferSeniority, type ResumeProfile, type ResumeSkill } from "./profile";

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Short all-caps tokens (SOC, RN, ML, SAP) match case-sensitively to avoid false hits. */
function matcher(token: string): RegExp {
  const caseSensitive = token.length <= 5 && token === token.toUpperCase() && /[A-Z]/.test(token);
  return new RegExp(`(?<![A-Za-z0-9])${esc(token)}(?![A-Za-z0-9&])`, caseSensitive ? "g" : "gi");
}

const SKILL_MATCHERS = Object.entries(SKILL_FAMILIES).flatMap(([family, defs]) =>
  defs.map((d) => ({
    name: d.name,
    family,
    patterns: [...(d.aliasOnly ? [] : [d.name]), ...(d.aliases ?? [])].map(matcher),
  })),
);

const TITLE_WORDS =
  /\b(engineer|developer|architect|analyst|manager|consultant|administrator|specialist|scientist|designer|lead|director|nurse|technician|coordinator|accountant|tester|programmer|officer|associate|scrum master|product owner)\b/i;

const MONTHS: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11 };

/** Months covered by "Jan 2018 – Mar 2021", "2015 - Present", "06/2019 – 12/2022" ranges (overlaps merged). */
function employmentMonths(text: string, now: Date): number {
  const m = "(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?";
  const point = `(?:${m}\\s+(\\d{4})|(\\d{1,2})/(\\d{4})|(\\d{4}))`;
  const re = new RegExp(`${point}\\s*(?:-|–|—|to)\\s*(?:${point}|(present|current|now|till date|date))`, "gi");
  const spans: [number, number][] = [];
  const toIdx = (mon: string | undefined, y1: string | undefined, mm: string | undefined, y2: string | undefined, y3: string | undefined, end: boolean): number | null => {
    if (y1) return Number(y1) * 12 + (MONTHS[mon!.slice(0, 4).toLowerCase().replace(/\.$/, "")] ?? MONTHS[mon!.slice(0, 3).toLowerCase()] ?? 0);
    if (y2) return Number(y2) * 12 + Math.max(0, Math.min(11, Number(mm) - 1));
    if (y3) return Number(y3) * 12 + (end ? 11 : 0);
    return null;
  };
  for (const g of text.matchAll(re)) {
    const start = toIdx(g[1], g[2], g[3], g[4], g[5], false);
    const end = g[11] ? now.getFullYear() * 12 + now.getMonth() : toIdx(g[6], g[7], g[8], g[9], g[10], true);
    if (start === null || end === null) continue;
    const y = Math.floor(start / 12);
    if (y < 1960 || end < start || end - start > 600) continue;
    spans.push([start, end]);
  }
  spans.sort((a, b) => a[0] - b[0]);
  let total = 0;
  let cur: [number, number] | null = null;
  for (const s of spans) {
    if (!cur || s[0] > cur[1]) {
      if (cur) total += cur[1] - cur[0];
      cur = [s[0], s[1]];
    } else cur[1] = Math.max(cur[1], s[1]);
  }
  if (cur) total += cur[1] - cur[0];
  return total;
}

export function builtinExtract(text: string, now = new Date()): ResumeProfile {
  const clean = text.replace(/\r/g, "").replace(/[ \t]+/g, " ");
  const lines = clean.split("\n").map((l) => l.trim()).filter(Boolean);

  // Skills
  const skills: ResumeSkill[] = [];
  for (const s of SKILL_MATCHERS) {
    const mentions = s.patterns.reduce((n, p) => n + (clean.match(p)?.length ?? 0), 0);
    if (mentions) skills.push({ name: s.name, family: s.family, mentions });
  }
  skills.sort((a, b) => b.mentions - a.mentions || a.name.localeCompare(b.name));
  const famScore = new Map<string, number>();
  for (const s of skills) famScore.set(s.family, (famScore.get(s.family) ?? 0) + s.mentions + 1);
  const skillFamily = [...famScore.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Experience
  const stated = [...clean.matchAll(/(\d{1,2})\s*\+?\s*(?:years|yrs)(?:\s+of)?(?:\s+\w+){0,3}\s+experience/gi)].map((m) => Number(m[1])).filter((n) => n > 0 && n < 50);
  const months = employmentMonths(clean, now);
  const fromDates = months >= 6 ? Math.round(months / 12) : null;
  const yearsExperience = stated.length ? Math.max(...stated) : fromDates;

  // Titles: short lines carrying a role word, in document order
  // e.g. "Senior Embedded Software Engineer | Bosch Automotive | Jan 2016 – Present" → the first segment
  const titles = [
    ...new Set(
      lines
        .filter((l) => !/@|https?:|\d{3}[-.)\s]\d{3}/.test(l) && !/^[-•·*]/.test(l) && !/\bcertifi/i.test(l))
        .map((l) => l.split(/\s[|–—]\s|\s-\s|,\s/)[0].replace(/[•·*]/g, "").trim())
        .filter((l) => l.length <= 60 && TITLE_WORDS.test(l) && l.split(" ").length <= 7 && !/\b(with|years|experience)\b/i.test(l)),
    ),
  ].slice(0, 5);

  // Certifications & education
  const found = CERTIFICATIONS.filter((c) => matcher(c).test(clean));
  // Collapse abbreviations that duplicate a spelled-out certification.
  const SAME: Record<string, string> = { CSM: "Certified ScrumMaster" };
  const certifications = found.filter((c) => !(SAME[c] && found.includes(SAME[c])));
  const education = [...new Set(DEGREES.filter(([re]) => re.test(clean)).map(([, label]) => label))];

  // Contact
  const email = clean.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null;
  const phone = clean.match(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/)?.[0] ?? null;
  const linkedin = clean.match(/linkedin\.com\/in\/[A-Za-z0-9_-]+/i)?.[0] ?? null;
  const location = clean.match(/\b([A-Z][a-zA-Z.]+(?: [A-Z][a-zA-Z.]+)*), ?([A-Z]{2})\b(?: \d{5})?/)?.[0] ?? null;
  const nameLine = lines.slice(0, 4).find((l) => /^[A-Z][a-zA-Z'’-]+(\s[A-Z]\.?)?(\s[A-Z][a-zA-Z'’-]+){1,2}$/.test(l) && !TITLE_WORDS.test(l));
  const summaryIdx = lines.findIndex((l) => /^(professional\s+)?(summary|profile|objective)\b/i.test(l));
  const isHeading = (l: string) => l.length < 40 && l === l.toUpperCase() && /[A-Z]{3}/.test(l);
  const summaryLines: string[] = [];
  for (const l of summaryIdx >= 0 ? lines.slice(summaryIdx + 1) : []) {
    if (isHeading(l) || summaryLines.length === 3) break;
    summaryLines.push(l);
  }
  const summary = summaryLines.join(" ").slice(0, 400) || null;

  const signal = Math.min(1, skills.length / 12) * 0.5 + (yearsExperience !== null ? 0.2 : 0) + (titles.length ? 0.15 : 0) + (email ? 0.1 : 0) + (education.length ? 0.05 : 0);
  const warnings: string[] = [];
  if (clean.length < 400) warnings.push("Very little text was found — the file may be a scanned image.");
  if (!skills.length) warnings.push("No known skills were recognised.");

  return {
    fullName: nameLine ?? null,
    email,
    phone,
    location,
    linkedin,
    currentTitle: titles[0] ?? null,
    titles,
    yearsExperience,
    seniority: inferSeniority(yearsExperience, titles),
    skillFamily,
    skills: skills.slice(0, 30),
    certifications,
    education,
    summary,
    confidence: Math.round(signal * 100) / 100,
    warnings,
  };
}
