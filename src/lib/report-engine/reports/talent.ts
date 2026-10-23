/**
 * Talent intelligence (§15, §20, §69): what expertise the firm has placed and
 * is onboarding, built from resume-extracted skills profiles (candidates) and
 * consultant skill records. Grows richer as every NHR adds two resumes.
 */

import type { ReportDef, Row } from "../types";
import { avg, countBy, fullName, monthlyTrend, pct, points, round, title } from "../helpers";
import type { Dataset } from "../dataset";
import { SKILL_FAMILIES } from "@/lib/talent/taxonomy";

const PERSONAS = ["super-admin", "executive", "recruiting-manager", "recruiter", "account-manager"] as const;

/** Legacy / AI spellings folded into the taxonomy's family names. */
const FAMILY_ALIAS: Record<string, string> = {
  "DevOps & Cloud": "Cloud & DevOps",
  "Healthcare IT": "Health IT",
  "Financial Technology": "Finance & Accounting",
};

const SKILL_FAMILY = new Map<string, string>(
  Object.entries(SKILL_FAMILIES).flatMap(([family, defs]) => defs.map((d) => [d.name.toLowerCase(), family] as [string, string])),
);

const SENIORITY_ORDER = ["Entry", "Mid", "Senior", "Lead", "Principal / Architect", "Manager / Director", "Unknown"];

type Talent = {
  name: string;
  pool: "Consultant" | "Candidate";
  status: string;
  family: string;
  title: string | null;
  seniority: string;
  years: number | null;
  skills: string[];
  certifications: string[];
  client: string | null;
  analyzed: boolean;
  createdAt: Date;
};

function familyFromSkills(skills: string[]): string | null {
  const m = countBy(skills.map((s) => SKILL_FAMILY.get(s.toLowerCase())).filter(Boolean), (f) => f);
  return [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function talentPool(ds: Dataset, pool: string): Talent[] {
  const out: Talent[] = [];
  if (pool !== "consultants") {
    for (const c of ds.candidates) {
      if (!c.skills.length && !c.skillFamily) continue;
      const fam = c.skillFamily ? (FAMILY_ALIAS[c.skillFamily] ?? c.skillFamily) : familyFromSkills(c.skills);
      out.push({
        name: fullName(c),
        pool: "Candidate",
        status: title(c.status),
        family: fam ?? "Unclassified",
        title: c.currentTitle,
        seniority: c.seniority ?? "Unknown",
        years: c.yearsExperience,
        skills: c.skills,
        certifications: c.certifications,
        client: c.clientName,
        analyzed: c.yearsExperience !== null || c.certifications.length > 0 || !!c.currentTitle,
        createdAt: c.createdAt,
      });
    }
  }
  if (pool !== "candidates") {
    for (const c of ds.consultants) {
      if (!c.skills.length) continue;
      out.push({
        name: fullName(c),
        pool: "Consultant",
        status: title(c.status),
        family: familyFromSkills(c.skills) ?? "Unclassified",
        title: c.title,
        seniority: "Unknown",
        years: null,
        skills: c.skills,
        certifications: [],
        client: c.clientName,
        analyzed: false,
        createdAt: c.createdAt,
      });
    }
  }
  return out;
}

export const talentReports: ReportDef[] = [
  {
    slug: "talent-expertise",
    name: "Talent Expertise",
    description:
      "The firm's expertise across consultants and onboarding candidates — specialties, skills, seniority and certifications, built from resumes collected at NHR.",
    section: "talent",
    spec: "§15 · §20 · §69",
    personas: [...PERSONAS],
    owner: "Talent Intelligence",
    dateScope: "none",
    definitions: [
      { term: "Specialty", def: "Primary skill family: from resume analysis for candidates, or the most common family among a consultant's listed skills." },
      { term: "Resume-analyzed", def: "Profiles with experience, title or certifications extracted from an uploaded resume." },
      { term: "Depth", def: "People holding a skill. Bench depth counts consultants currently on the bench." },
    ],
    controls: [
      {
        key: "pool",
        label: "Talent pool",
        default: "all",
        options: [
          { value: "all", label: "Consultants + candidates" },
          { value: "consultants", label: "Consultants only" },
          { value: "candidates", label: "Candidates only" },
        ],
      },
    ],
    load: (ds, ctx) => {
      const people = talentPool(ds, ctx.params.pool ?? "all");
      const analyzed = people.filter((p) => p.analyzed);
      const years = analyzed.map((p) => p.years).filter((y): y is number => y !== null);

      // Skill inventory
      const bySkill = new Map<string, { people: number; consultants: number; candidates: number; bench: number; years: number[]; family: string }>();
      for (const p of people) {
        for (const s of new Set(p.skills)) {
          const e = bySkill.get(s) ?? { people: 0, consultants: 0, candidates: 0, bench: 0, years: [], family: SKILL_FAMILY.get(s.toLowerCase()) ?? p.family };
          e.people++;
          if (p.pool === "Consultant") e.consultants++;
          else e.candidates++;
          if (p.status === "Bench") e.bench++;
          if (p.years !== null) e.years.push(p.years);
          bySkill.set(s, e);
        }
      }
      const skillRows: Row[] = [...bySkill.entries()].map(([skill, e]) => ({
        skill,
        family: e.family,
        people: e.people,
        consultants: e.consultants,
        candidates: e.candidates,
        bench: e.bench,
        share: pct(e.people, people.length),
        avgYears: e.years.length ? round(avg(e.years)) : null,
      }));

      // Specialty summary
      const families = countBy(people, (p) => p.family);
      const familyRows: Row[] = [...families.entries()].map(([family, n]) => {
        const inFam = people.filter((p) => p.family === family);
        const fy = inFam.map((p) => p.years).filter((y): y is number => y !== null);
        const top = countBy(inFam.flatMap((p) => p.skills), (s) => s);
        return {
          family,
          people: n,
          consultants: inFam.filter((p) => p.pool === "Consultant").length,
          candidates: inFam.filter((p) => p.pool === "Candidate").length,
          senior: inFam.filter((p) => ["Senior", "Lead", "Principal / Architect", "Manager / Director"].includes(p.seniority)).length,
          avgYears: fy.length ? round(avg(fy)) : null,
          topSkills: [...top.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([s]) => s).join(", "),
        };
      });

      const certs = countBy(people.flatMap((p) => p.certifications), (c) => c);
      const known = people.filter((p) => p.seniority !== "Unknown");

      return {
        kpis: [
          { label: "Talent profiles", value: people.length },
          { label: "Resume-analyzed", value: analyzed.length, tone: "ai", hint: `${pct(analyzed.length, people.length)}% of profiles` },
          { label: "Specialties", value: families.size },
          { label: "Distinct skills", value: bySkill.size },
          { label: "Avg experience", value: years.length ? round(avg(years)) : "—", hint: years.length ? "years, resume-analyzed" : "Upload resumes at NHR to measure" },
          { label: "Certified", value: people.filter((p) => p.certifications.length).length, tone: "success" },
        ],
        charts: [
          { kind: "bar", title: "Talent by specialty", drillKey: "family", points: points(families, { limit: 15, tone: "info" }) },
          {
            kind: "bar",
            title: "Deepest skills",
            description: "People holding each skill",
            drillKey: "skill",
            points: points(new Map([...bySkill.entries()].map(([s, e]) => [s, e.people])), { limit: 15, tone: "ai" }),
          },
          ...(known.length
            ? [{ kind: "bar" as const, title: "Seniority mix (resume-analyzed)", points: points(countBy(known, (p) => p.seniority), { order: SENIORITY_ORDER.slice(0, -1) }) }]
            : []),
          ...(certs.size ? [{ kind: "bar" as const, title: "Certifications held", points: points(certs, { limit: 10, tone: "success" }) }] : []),
          { kind: "trend", title: "Talent profiles added", description: "By month first recorded", points: monthlyTrend(ds, people, (p) => p.createdAt) },
        ],
        table: {
          title: "Skill inventory",
          columns: [
            { key: "skill", label: "Skill" },
            { key: "family", label: "Specialty" },
            { key: "people", label: "People", type: "number" },
            { key: "consultants", label: "Consultants", type: "number" },
            { key: "candidates", label: "Candidates", type: "number" },
            { key: "bench", label: "On bench", type: "number" },
            { key: "share", label: "% of pool", type: "percent" },
            { key: "avgYears", label: "Avg yrs", type: "number" },
          ],
          rows: skillRows,
          sort: { key: "people", dir: "desc" },
        },
        extraTables: [
          {
            title: "Specialties",
            columns: [
              { key: "family", label: "Specialty" },
              { key: "people", label: "People", type: "number" },
              { key: "consultants", label: "Consultants", type: "number" },
              { key: "candidates", label: "Candidates", type: "number" },
              { key: "senior", label: "Senior+", type: "number" },
              { key: "avgYears", label: "Avg yrs", type: "number" },
              { key: "topSkills", label: "Top skills" },
            ],
            rows: familyRows,
            sort: { key: "people", dir: "desc" },
          },
          {
            title: "Talent directory",
            columns: [
              { key: "name", label: "Name" },
              { key: "pool", label: "Pool" },
              { key: "status", label: "Status", type: "status" },
              { key: "family", label: "Specialty" },
              { key: "title", label: "Title" },
              { key: "seniority", label: "Seniority" },
              { key: "years", label: "Yrs", type: "number" },
              { key: "skills", label: "Skills" },
              { key: "certifications", label: "Certifications" },
              { key: "client", label: "Client" },
            ],
            rows: people.map((p) => ({
              name: p.name,
              pool: p.pool,
              status: p.status,
              family: p.family,
              title: p.title ?? "—",
              seniority: p.seniority,
              years: p.years,
              skills: p.skills.slice(0, 8).join(", "),
              certifications: p.certifications.join(", ") || "—",
              client: p.client ?? "—",
            })),
            sort: { key: "name", dir: "asc" },
          },
        ],
        notes: [
          "Every New Hire Request now requires the raw and formatted resume; the raw resume is analyzed into a skills profile, so experience, seniority and certification coverage grow with each hire.",
          "Consultant specialties are inferred from their recorded skills until a resume is on file.",
        ],
      };
    },
  },
];
