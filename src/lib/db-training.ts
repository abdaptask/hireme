/**
 * DB query helpers for Training records (§37).
 *
 * Maps Prisma Training rows (joined with their Candidate) into the UI's
 * TrainingRecord shape so the Training page can merge live + mock data.
 *
 * Server-only — do NOT import in client components.
 */

import { db } from "@/lib/db";
import type { TrainingRecord, TrainingStatus } from "@/lib/training";

// ─────────────────────────────────────────────────────────
// Enum mapping
// ─────────────────────────────────────────────────────────

/**
 * Map Prisma TrainingStatus enum to the UI TrainingStatus union.
 * Note: the DB enum has EXPIRING which the UI type doesn't model;
 * we surface it as "started" (treat as still-active) so the row still renders.
 */
export function mapTrainingStatus(
  s: "ASSIGNED" | "STARTED" | "COMPLETED" | "FAILED" | "EXPIRING" | "WAIVED" | "OVERDUE",
): TrainingStatus {
  switch (s) {
    case "ASSIGNED":
      return "assigned";
    case "STARTED":
      return "started";
    case "COMPLETED":
      return "completed";
    case "FAILED":
      return "failed";
    case "OVERDUE":
      return "overdue";
    case "WAIVED":
      return "waived";
    case "EXPIRING":
      // No first-class "expiring" tone in the UI yet — treat as in-progress so
      // it surfaces in the "In progress" KPI rather than being silently hidden.
      return "started";
    default:
      return "assigned";
  }
}

// ─────────────────────────────────────────────────────────
// Date helpers
// ─────────────────────────────────────────────────────────

function isoDate(d: Date | null | undefined): string | undefined {
  if (!d) return undefined;
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

// ─────────────────────────────────────────────────────────
// Query
// ─────────────────────────────────────────────────────────

/** Returns all training rows from the DB, mapped to the UI TrainingRecord shape. */
export async function getDbTrainings(): Promise<TrainingRecord[]> {
  const rows = await db.training.findMany({
    orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
    include: {
      candidate: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          clientName: true,
        },
      },
    },
  });

  return rows.map((t): TrainingRecord => {
    const candidateName = t.candidate
      ? `${t.candidate.firstName} ${t.candidate.lastName}`
      : "Unassigned";

    return {
      id: t.id,
      candidateId: t.candidate?.id ?? t.candidateId ?? "unassigned",
      candidateName,
      client: t.candidate?.clientName ?? "Unassigned",
      courseName: t.title,
      category: t.category,
      dueDate: isoDate(t.dueDate) ?? "TBD",
      completedDate: isoDate(t.completedAt),
      status: mapTrainingStatus(t.status),
      score: t.score ?? undefined,
      attempts: 0, // not modelled in DB yet
      required: t.required,
      // expiresDate / lmsLink not modelled in DB yet
    };
  });
}
