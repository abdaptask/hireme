/**
 * DB query helpers — maps Prisma Screening rows to the UI's ScreeningRecord
 * type so the rest of the app stays type-stable.
 *
 * Server-only (imports `db` which uses pg). Do NOT import in client components.
 */

import { db } from "@/lib/db";
import type {
  DrugTestStatus,
  ScreeningRecord,
  ScreeningStatus,
} from "@/lib/screening";

// ─────────────────────────────────────────────────────────
// Enum mapping helpers
// ─────────────────────────────────────────────────────────

/**
 * Maps the Prisma ScreeningStatus enum to the UI's ScreeningStatus type.
 * Covers both the actual DB enum values (ORDERED, INVITED, CONSENTED,
 * IN_PROGRESS, INFO_REQUIRED, VENDOR_DELAYED, CLEAR, REVIEW_REQUIRED,
 * ADVERSE_PENDING) and the alternate naming variants noted in the
 * task spec (ADDITIONAL_INFO, PRE_ADVERSE, RESPONSE_PERIOD, FINAL_DECISION)
 * in case the schema evolves.
 */
export function mapScreeningStatus(dbStatus: string): ScreeningStatus {
  switch (dbStatus) {
    case "ORDERED":
      return "ordered";
    case "INVITED":
      return "invited";
    case "CONSENTED":
      return "consented";
    case "IN_PROGRESS":
      return "in-progress";
    case "INFO_REQUIRED":
    case "ADDITIONAL_INFO":
      return "info-required";
    case "VENDOR_DELAYED":
      return "vendor-delayed";
    case "CLEAR":
      return "clear";
    case "REVIEW_REQUIRED":
      return "review-required";
    case "ADVERSE_PENDING":
    case "PRE_ADVERSE":
    case "RESPONSE_PERIOD":
    case "FINAL_DECISION":
      return "adverse-pending";
    default:
      return "ordered";
  }
}

// ─────────────────────────────────────────────────────────
// Date / number helpers
// ─────────────────────────────────────────────────────────

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function ageDays(orderedAt: Date | null, completedAt: Date | null): number {
  const start = orderedAt?.getTime();
  if (!start) return 0;
  const end = (completedAt ?? new Date()).getTime();
  return Math.max(0, Math.floor((end - start) / 86_400_000));
}

// ─────────────────────────────────────────────────────────
// List query
// ─────────────────────────────────────────────────────────

type ScreeningRow = Awaited<ReturnType<typeof fetchScreeningRows>>[number];

async function fetchScreeningRows() {
  return db.screening.findMany({
    orderBy: [{ orderedAt: "desc" }, { updatedAt: "desc" }],
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
}

function rowToRecord(s: ScreeningRow): ScreeningRecord {
  const candidateName = s.candidate
    ? `${s.candidate.firstName} ${s.candidate.lastName}`.trim()
    : "Unassigned";

  const status = mapScreeningStatus(s.status as unknown as string);

  // DB schema doesn't have a dedicated drug-test column on Screening yet;
  // default to "not-ordered" until a drug-test relation is added.
  const drugTest: DrugTestStatus = "not-ordered";

  return {
    id: s.id,
    candidateId: s.candidate?.id ?? "",
    candidateName,
    client: s.candidate?.clientName ?? "Unassigned",
    vendor: s.vendor,
    packageType: s.packageType ?? "Standard",
    orderedDate: formatDate(s.orderedAt),
    estimatedCompletion: formatDate(s.estimatedCompletion),
    actualCompletion: s.completedAt ? formatDate(s.completedAt) : undefined,
    status,
    ageDays: ageDays(s.orderedAt, s.completedAt),
    jurisdictionDelays: status === "vendor-delayed",
    drugTest,
    cost: s.cost ?? 0,
    notes: s.notes ?? undefined,
  };
}

/** Returns all screenings from the DB as ScreeningRecord[]. */
export async function getDbScreenings(): Promise<ScreeningRecord[]> {
  const rows = await fetchScreeningRows();
  return rows.map(rowToRecord);
}
