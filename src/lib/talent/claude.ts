/**
 * Claude resume extractor (§10.3 form data extraction, §44 provider-agnostic
 * AI layer). Used when ANTHROPIC_API_KEY is configured; otherwise the built-in
 * extractor runs. Structured output guarantees a schema-valid profile.
 *
 * Server-only — never import in client components.
 */

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { SKILL_FAMILIES } from "./taxonomy";
import { inferSeniority, type ResumeProfile } from "./profile";

export const CLAUDE_MODEL = "claude-opus-5-5";

const FAMILIES = Object.keys(SKILL_FAMILIES);

const ProfileSchema = z.object({
  fullName: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  location: z.string().nullable().describe("City, ST"),
  linkedin: z.string().nullable(),
  currentTitle: z.string().nullable(),
  titles: z.array(z.string()).describe("Job titles held, most recent first (max 5)"),
  yearsExperience: z.number().int().nullable().describe("Total years of professional experience"),
  skillFamily: z.string().nullable().describe(`Primary specialty. Prefer one of: ${FAMILIES.join("; ")}`),
  skills: z
    .array(z.object({ name: z.string(), family: z.string(), evidence: z.enum(["primary", "secondary", "mentioned"]) }))
    .describe("Concrete technical / domain skills with the family each belongs to (max 30)"),
  certifications: z.array(z.string()),
  education: z.array(z.string()).describe('Degrees, e.g. "Master\'s — Computer Science"'),
  summary: z.string().nullable().describe("Two-sentence professional summary"),
  warnings: z.array(z.string()).describe("Anything a recruiter should double-check (gaps, inconsistencies)"),
});

const SYSTEM = `You extract structured talent profiles from resumes for a staffing firm's talent intelligence database.
Only use facts stated in the resume; use null or an empty list when something isn't there. Normalise skill names to their common form (e.g. "ReactJS" → "React"). Group each skill into a specialty family, reusing these family names where they fit: ${FAMILIES.join("; ")}.`;

let client: Anthropic | null = null;

export function claudeEnabled(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

/** Returns a profile, or null when Claude declines or the response can't be used (caller falls back). */
export async function claudeExtract(text: string): Promise<ResumeProfile | null> {
  client ??= new Anthropic();
  const response = await client.beta.messages.parse({
    model: CLAUDE_MODEL,
    max_tokens: 16000,
    // On a policy decline the API retries on a fallback model in the same call.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(ProfileSchema) },
    system: SYSTEM,
    messages: [{ role: "user", content: `<resume>\n${text}\n</resume>` }],
  });

  if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens" || !response.parsed_output) return null;
  const p = response.parsed_output;
  const weight = { primary: 3, secondary: 2, mentioned: 1 } as const;
  const skills = p.skills.slice(0, 30).map((s) => ({ name: s.name, family: s.family, mentions: weight[s.evidence] }));
  return {
    fullName: p.fullName,
    email: p.email,
    phone: p.phone,
    location: p.location,
    linkedin: p.linkedin,
    currentTitle: p.currentTitle,
    titles: p.titles.slice(0, 5),
    yearsExperience: p.yearsExperience,
    seniority: inferSeniority(p.yearsExperience, p.titles),
    skillFamily: p.skillFamily,
    skills,
    certifications: p.certifications,
    education: p.education,
    summary: p.summary,
    confidence: 0.95,
    warnings: p.warnings,
  };
}
