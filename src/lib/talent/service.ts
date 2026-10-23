/**
 * Resume storage and talent intelligence (§15 candidate record, §20 document
 * intelligence). Raw and formatted resumes are kept on file; the raw resume
 * (or the formatted one, if that's all there is) feeds the candidate's skills
 * profile, which in turn feeds the Talent Expertise report.
 *
 * Server-only — never import in client components.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { db } from "@/lib/db";
import { analyzeResume } from "./analyze";
import { RESUME_TYPES, ResumeFileError, resumeText } from "./extract-text";
import { PARSER_LABEL, type ParserId, type ResumeProfile } from "./profile";

export type ResumeKind = "raw" | "formatted";
export type ResumeUpload = { name: string; type: string; bytes: Uint8Array };
type Actor = { name: string; role: string };

const ROOT = path.join(process.cwd(), "storage", "resumes");
const MAX_BYTES = 10 * 1024 * 1024;

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/(^-|-$)/g, "") || "resume";
}

/** Validate and read a resume file; throws ResumeFileError with a clear message. */
export async function readResume(file: ResumeUpload, label: string): Promise<string> {
  if (!file.bytes.byteLength) throw new ResumeFileError(`The ${label} is empty.`);
  if (file.bytes.byteLength > MAX_BYTES) throw new ResumeFileError(`The ${label} is over 10 MB.`);
  const text = (await resumeText(file.bytes, file.type, file.name)).trim();
  if (text.length < 80) throw new ResumeFileError(`No readable text found in the ${label} — if it's a scan, upload a text-based PDF or Word file.`);
  return text;
}

/** Parse without storing — used to pre-fill the NHR form as soon as a resume is chosen. */
export async function previewResume(file: ResumeUpload) {
  const text = await readResume(file, "resume");
  return analyzeResume(text);
}

function mismatchWarnings(p: ResumeProfile, c: { firstName: string; lastName: string; email: string }): string[] {
  const w: string[] = [];
  if (p.email && p.email.toLowerCase() !== c.email.toLowerCase()) w.push(`Resume email (${p.email}) differs from the NHR email (${c.email}).`);
  if (p.fullName && !p.fullName.toLowerCase().includes(c.lastName.toLowerCase())) w.push(`Resume name (${p.fullName}) doesn't match ${c.firstName} ${c.lastName}.`);
  return w;
}

/** Copy the extracted profile onto the candidate's talent fields. */
async function applyProfile(candidateId: string, profile: ResumeProfile) {
  await db.candidate.update({
    where: { id: candidateId },
    data: {
      skills: profile.skills.slice(0, 15).map((s) => s.name),
      skillFamily: profile.skillFamily,
      skillConfidence: profile.confidence,
      yearsExperience: profile.yearsExperience,
      seniority: profile.seniority,
      currentTitle: profile.currentTitle,
      certifications: profile.certifications,
      education: profile.education,
    },
  });
}

/** Store one resume, extract its text, and (for the profile source) analyze it. */
export async function storeResume(candidateId: string, kind: ResumeKind, file: ResumeUpload, actor: Actor, preread?: string) {
  const c = await db.candidate.findUnique({ where: { id: candidateId }, select: { firstName: true, lastName: true, email: true } });
  if (!c) throw new ResumeFileError("Candidate not found.");
  const text = preread ?? (await readResume(file, `${kind} resume`));

  const created = await db.resume.create({ data: { candidateId, kind, fileName: file.name, mimeType: file.type || "application/octet-stream", fileSize: file.bytes.byteLength, uploadedBy: actor.name, text } });
  const dir = path.join(ROOT, candidateId);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, `${created.id}-${slug(file.name)}`), file.bytes);

  // The raw resume is the source of truth for the talent profile.
  const hasRaw = kind === "raw" || (await db.resume.count({ where: { candidateId, kind: "raw" } })) > 0;
  if (kind === "raw" || !hasRaw) await analyzeAndApply(created.id, actor, c);
  return created.id;
}

async function analyzeAndApply(resumeId: string, actor: Actor, c: { firstName: string; lastName: string; email: string }) {
  const r = await db.resume.findUnique({ where: { id: resumeId } });
  if (!r?.text) return;
  const { profile, parser, note } = await analyzeResume(r.text);
  profile.warnings = [...profile.warnings, ...mismatchWarnings(profile, c), ...(note ? [note] : [])];
  await db.resume.update({ where: { id: resumeId }, data: { profile: profile as object, parser, parsedAt: new Date() } });
  await applyProfile(r.candidateId, profile);
  await db.auditEvent.create({
    data: {
      action: parser === "builtin" ? "UPDATED" : "AI_ACTION",
      entityType: "Resume",
      entityId: resumeId,
      entityLabel: `Resume analysis — ${c.firstName} ${c.lastName}`,
      actor: parser === "builtin" ? "Resume Intelligence" : PARSER_LABEL[parser],
      actorRole: parser === "builtin" ? "system" : "ai",
      newValue: `${profile.skillFamily ?? "No primary specialty"} · ${profile.skills.length} skills · ${profile.yearsExperience ?? "?"} yrs · ${profile.seniority ?? "seniority unknown"}`,
      reason: profile.warnings.join(" ") || null,
      aiInvolved: parser !== "builtin",
      sourceSystem: "resume-intelligence",
      candidateId: r.candidateId,
    },
  });
  void actor;
}

/** Re-run analysis on the profile-source resume (e.g. after adding an API key). */
export async function reanalyzeResume(candidateId: string, actor: Actor) {
  const c = await db.candidate.findUnique({ where: { id: candidateId }, select: { firstName: true, lastName: true, email: true } });
  const r = (await db.resume.findFirst({ where: { candidateId, kind: "raw" }, orderBy: { uploadedAt: "desc" } })) ?? (await db.resume.findFirst({ where: { candidateId }, orderBy: { uploadedAt: "desc" } }));
  if (!c || !r) throw new ResumeFileError("There's no resume on file to analyze.");
  await analyzeAndApply(r.id, actor, c);
}

export async function readResumeFile(resumeId: string) {
  const r = await db.resume.findUnique({ where: { id: resumeId } });
  if (!r) return null;
  const file = path.join(ROOT, r.candidateId, `${r.id}-${slug(r.fileName)}`);
  try {
    return { bytes: await fs.readFile(file), mimeType: r.mimeType, name: r.fileName };
  } catch {
    return null;
  }
}

/** Resumes + extracted profile for the Candidate 360. */
export async function getResumeView(candidateId: string) {
  const resumes = await db.resume.findMany({ where: { candidateId }, orderBy: { uploadedAt: "desc" } });
  if (!resumes.length) return null;
  const source = resumes.find((r) => r.kind === "raw" && r.profile) ?? resumes.find((r) => r.profile);
  return {
    files: resumes.map((r) => ({ id: r.id, kind: r.kind as ResumeKind, fileName: r.fileName, size: r.fileSize, uploadedBy: r.uploadedBy, uploadedAt: r.uploadedAt.toISOString() })),
    profile: (source?.profile as unknown as ResumeProfile | null) ?? null,
    parser: (source?.parser as ParserId | null) ?? null,
    parsedAt: source?.parsedAt?.toISOString() ?? null,
  };
}

export { RESUME_TYPES, ResumeFileError };
