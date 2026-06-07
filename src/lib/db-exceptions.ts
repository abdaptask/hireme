/**
 * DB query helpers for the Exception Control Tower (§18, §104).
 * Maps Prisma Exception rows → the UI's Exception type from lib/exceptions.ts
 * so the page stays type-stable and can merge DB + mock data seamlessly.
 *
 * Server-only — never import in client components.
 */

import { db } from "@/lib/db";
import type { Exception, ExceptionSeverity, ExceptionStatus } from "@/lib/exceptions";

// ─────────────────────────────────────────────────────────
// Enum mapping
// ─────────────────────────────────────────────────────────

function mapSeverity(s: string): ExceptionSeverity {
  const m: Record<string, ExceptionSeverity> = {
    CRITICAL: "critical",
    HIGH: "high",
    MEDIUM: "medium",
    LOW: "low",
  };
  return m[s] ?? "medium";
}

function mapStatus(s: string): ExceptionStatus {
  const m: Record<string, ExceptionStatus> = {
    OPEN: "open",
    IN_PROGRESS: "in-progress",
    ESCALATED: "escalated",
    RESOLVED: "resolved",
    CLOSED: "resolved",
  };
  return m[s] ?? "open";
}

// ─────────────────────────────────────────────────────────
// SLA helpers
// ─────────────────────────────────────────────────────────

function slaLabel(deadline: Date | null, createdAt: Date): { label: string; breached: boolean } {
  if (!deadline) {
    const ageDays = Math.floor((Date.now() - createdAt.getTime()) / 86_400_000);
    const defaultSla = 5;
    const remaining = defaultSla - ageDays;
    if (remaining < 0) return { label: `${Math.abs(remaining)}d overdue`, breached: true };
    if (remaining === 0) return { label: "Due today", breached: false };
    return { label: `${remaining}d left`, breached: false };
  }
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  const diffH = Math.floor(diffMs / 3_600_000);
  if (diffMs < 0) {
    const overH = Math.abs(diffH);
    if (overH < 24) return { label: `${overH}h overdue`, breached: true };
    return { label: `${Math.floor(overH / 24)}d overdue`, breached: true };
  }
  if (diffH < 24) return { label: `${diffH}h left`, breached: false };
  return { label: `${Math.floor(diffH / 24)}d left`, breached: false };
}

// ─────────────────────────────────────────────────────────
// Row type
// ─────────────────────────────────────────────────────────

type ExceptionRow = Awaited<ReturnType<typeof fetchExceptionRows>>[number];

async function fetchExceptionRows() {
  return db.exception.findMany({
    orderBy: [{ severity: "asc" }, { createdAt: "asc" }],
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

function rowToException(e: ExceptionRow, index: number): Exception {
  const ageDays = Math.floor((Date.now() - e.createdAt.getTime()) / 86_400_000);
  const candidateName = e.candidate
    ? `${e.candidate.firstName} ${e.candidate.lastName}`
    : "Unknown";
  const clientName = e.candidate?.clientName ?? "Unknown";

  return {
    // Use short human-readable IDs for display
    id: `EXC-DB${String(index + 1).padStart(3, "0")}`,
    category: e.category,
    severity: mapSeverity(e.severity),
    candidate: candidateName,
    candidateId: e.candidateId ?? "",
    client: clientName,
    owner: e.owner ?? "Unassigned",
    resolver: e.resolver ?? "Unassigned",
    ageDays,
    sla: slaLabel(e.resolutionDeadline, e.createdAt),
    startDateImpact: e.startDateImpact,
    rootCause: e.description ?? e.title,
    businessImpact: e.internalNote ?? "Pending assessment",
    status: mapStatus(e.status),
    aiRecommendation: `Review ${e.category.toLowerCase()} for ${candidateName} and resolve within SLA.`,
  };
}

// ─────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────

/** Returns all exceptions from the DB mapped to the UI Exception type. */
export async function getDbExceptions(): Promise<Exception[]> {
  const rows = await fetchExceptionRows();
  return rows.map((row, i) => rowToException(row, i));
}

/** Stats computed over DB exceptions (mirrors the mock exceptionStats()). */
export function dbExceptionStats(exceptions: Exception[]) {
  const open = exceptions.filter((e) => e.status !== "resolved");
  return {
    open: open.length,
    critical: open.filter((e) => e.severity === "critical").length,
    slaBreaches: open.filter((e) => e.sla.breached).length,
    startImpact: open.filter((e) => e.startDateImpact).length,
  };
}
