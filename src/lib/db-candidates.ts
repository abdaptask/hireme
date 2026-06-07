/**
 * DB query helpers — maps Prisma Candidate rows to the UI's CandidateSummary
 * and CandidateDetail types so the rest of the app stays type-stable.
 *
 * These functions are server-only (they import `db` which uses pg).
 * Do NOT import in client components.
 */

import { db } from "@/lib/db";
import type { CandidateSummary } from "@/lib/candidates";
import type { PipelineStatus, RiskLevel } from "@/lib/types";

// ─────────────────────────────────────────────────────────
// Enum mapping helpers
// ─────────────────────────────────────────────────────────

export function mapEmploymentType(et: string | null): "W-2" | "1099" | "C2C" {
  if (et === "C2C") return "C2C";
  if (et === "INDEPENDENT_1099") return "1099";
  return "W-2";
}

export function mapStatus(dbStatus: string, dbRisk: string): PipelineStatus {
  if (dbStatus === "WITHDRAWN") return "waiting-external"; // no "withdrawn" in PipelineStatus
  if (dbStatus === "PLACED") return "on-track";
  if (dbStatus === "ON_HOLD") return "waiting-external";
  if (dbStatus === "OFFER_ACCEPTED") return "on-track";
  // ONBOARDING / ACTIVE / NEW — derive from risk
  if (dbRisk === "AT_RISK") return "at-risk";
  if (dbRisk === "NEEDS_ATTENTION") return "needs-attention";
  if (dbRisk === "UNLIKELY") return "at-risk";
  return "on-track";
}

export function mapRisk(dbRisk: string): RiskLevel {
  if (dbRisk === "AT_RISK") return "at-risk";
  if (dbRisk === "NEEDS_ATTENTION") return "needs-attention";
  if (dbRisk === "UNLIKELY") return "unlikely";
  return "on-track";
}

export function mapDocStatus(
  s: string,
): "approved" | "in-review" | "rejected" | "pending" {
  if (s === "APPROVED") return "approved";
  if (s === "REJECTED" || s === "CORRECTION_REQUIRED") return "rejected";
  if (s === "SUBMITTED" || s === "AI_REVIEW") return "in-review";
  return "pending";
}

// ─────────────────────────────────────────────────────────
// Date / time helpers
// ─────────────────────────────────────────────────────────

function formatStartDate(date: Date | null): string {
  if (!date) return "TBD";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function daysUntilStart(date: Date | null): number {
  if (!date) return 999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / 86_400_000);
}

export function relativeTime(date: Date | null, fallback?: Date): string {
  const ref = date ?? fallback ?? new Date();
  const now = new Date();
  const diffMs = Math.max(now.getTime() - ref.getTime(), 0);
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 60) return `${Math.max(diffMin, 1)}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}

// ─────────────────────────────────────────────────────────
// List query
// ─────────────────────────────────────────────────────────

type CandidateRow = Awaited<ReturnType<typeof fetchCandidateRows>>[number];

async function fetchCandidateRows() {
  return db.candidate.findMany({
    orderBy: [{ startDate: "asc" }, { updatedAt: "desc" }],
    include: {
      assignments: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: { jobTitle: true },
      },
    },
  });
}

function rowToSummary(c: CandidateRow): CandidateSummary {
  const role =
    c.assignments[0]?.jobTitle ?? c.skillFamily ?? "Consultant";

  const location =
    c.workLocation ??
    (c.city
      ? `${c.city}${c.state ? ", " + c.state : ""}`
      : "Remote");

  return {
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
    role,
    client: c.clientName ?? "Unassigned",
    employmentType: mapEmploymentType(c.employmentType),
    location,
    stage: c.stage ?? "Pre-Onboarding",
    status: mapStatus(c.status, c.risk),
    risk: mapRisk(c.risk),
    startDateLabel: formatStartDate(c.startDate),
    startInDays: daysUntilStart(c.startDate),
    recruiter: c.recruiter ?? "Unassigned",
    onboarder: c.onboarder ?? "Unassigned",
    progress: c.progress,
    lastActivity: relativeTime(c.lastContact, c.updatedAt),
    email: c.email,
    phone: c.phone ?? "",
    tags: c.tags,
    vendor: c.vendor ?? undefined,
  };
}

/** Returns all candidates from the DB as CandidateSummary[]. */
export async function getDbCandidates(): Promise<CandidateSummary[]> {
  const rows = await fetchCandidateRows();
  return rows.map(rowToSummary);
}

// ─────────────────────────────────────────────────────────
// Detail query (for the 360 page)
// ─────────────────────────────────────────────────────────

export type DbCandidateFull = NonNullable<
  Awaited<ReturnType<typeof getDbCandidateFull>>
>;

export async function getDbCandidateFull(id: string) {
  return db.candidate.findUnique({
    where: { id },
    include: {
      assignments: {
        take: 1,
        orderBy: { createdAt: "desc" },
      },
      documents: {
        orderBy: { uploadedAt: "desc" },
      },
      screenings: {
        orderBy: { orderedAt: "desc" },
        take: 5,
      },
      equipment: {
        orderBy: { createdAt: "desc" },
      },
      exceptions: {
        where: { status: { notIn: ["RESOLVED", "CLOSED"] } },
        orderBy: { severity: "asc" },
      },
      payroll: true,
      billing: true,
      training: {
        orderBy: { dueDate: "asc" },
      },
      communications: {
        orderBy: { sentAt: "desc" },
        take: 20,
      },
      auditEvents: {
        orderBy: { timestamp: "desc" },
        take: 30,
      },
    },
  });
}

/** Maps a DB candidate to a CandidateSummary (for use on the 360 page header). */
export function dbToSummary(c: DbCandidateFull): CandidateSummary {
  const role =
    c.assignments[0]?.jobTitle ?? c.skillFamily ?? "Consultant";
  const location =
    c.workLocation ??
    (c.city ? `${c.city}${c.state ? ", " + c.state : ""}` : "Remote");

  return {
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
    role,
    client: c.clientName ?? "Unassigned",
    employmentType: mapEmploymentType(c.employmentType),
    location,
    stage: c.stage ?? "Pre-Onboarding",
    status: mapStatus(c.status, c.risk),
    risk: mapRisk(c.risk),
    startDateLabel: formatStartDate(c.startDate),
    startInDays: daysUntilStart(c.startDate),
    recruiter: c.recruiter ?? "Unassigned",
    onboarder: c.onboarder ?? "Unassigned",
    progress: c.progress,
    lastActivity: relativeTime(c.lastContact, c.updatedAt),
    email: c.email,
    phone: c.phone ?? "",
    tags: c.tags,
    vendor: c.vendor ?? undefined,
  };
}
