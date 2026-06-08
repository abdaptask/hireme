/**
 * DB query helpers for the Audit Center (§26, §66).
 *
 * Maps Prisma `AuditEvent` rows (AuditAction enum) onto the local
 * `AuditEvent` UI type from `@/lib/audit`, so the rest of the app keeps a
 * single, stable type contract.
 *
 * Server-only — imports `db` (pg adapter). Never import in a client component.
 */

import { db } from "@/lib/db";
import type { AuditEvent, AuditEventType } from "@/lib/audit";

// ─────────────────────────────────────────────────────────
// Enum mapping — Prisma AuditAction → local AuditEventType
// ─────────────────────────────────────────────────────────

/**
 * The Prisma enum is coarser than the UI taxonomy (the UI splits things like
 * record-view, login, document-download, permission-change). We map every
 * known enum value to the closest UI event type and fall back to
 * `record-edit` for anything unrecognized.
 */
function mapAuditAction(action: string): AuditEventType {
  switch (action) {
    case "CREATED":
    case "UPDATED":
      return "record-edit";
    case "APPROVED":
    case "REJECTED":
      return "approval";
    case "OVERRIDDEN":
      return "override";
    case "EXPORTED":
      return "export";
    case "AI_ACTION":
      return "ai-action";
    case "INTEGRATION_EVENT":
      return "integration-event";
    case "ESCALATED":
      return "record-edit";
    case "DELETED":
      return "permission-change";
    default:
      return "record-edit";
  }
}

/**
 * Map a Prisma action + flags onto the UI severity bucket.
 * Critical wins; overrides/exports surface as warnings; everything else info.
 */
function mapSeverity(
  action: string,
  critical: boolean,
): AuditEvent["severity"] {
  if (critical) return "critical";
  if (action === "OVERRIDDEN" || action === "EXPORTED" || action === "DELETED") {
    return "warning";
  }
  return "info";
}

function formatTimestamp(d: Date): string {
  // Match the mock-data shape: "YYYY-MM-DD HH:mm:ss"
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

function actionLabel(action: string): string {
  // Friendly title-case label for the table's "Action" column.
  return action
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ─────────────────────────────────────────────────────────
// Query
// ─────────────────────────────────────────────────────────

type DbAuditRow = Awaited<ReturnType<typeof fetchRows>>[number];

async function fetchRows(limit: number) {
  return db.auditEvent.findMany({
    orderBy: { timestamp: "desc" },
    take: limit,
    // The Prisma model stores `actor` as a string (not a relation), so we
    // request it via select alongside the rest of the fields the UI needs.
    select: {
      id: true,
      timestamp: true,
      action: true,
      entityType: true,
      entityLabel: true,
      entityId: true,
      actor: true,
      actorRole: true,
      previousValue: true,
      newValue: true,
      reason: true,
      ipAddress: true,
      aiInvolved: true,
      sourceSystem: true,
      critical: true,
    },
  });
}

function rowToAuditEvent(row: DbAuditRow): AuditEvent & { live: true } {
  const eventType = mapAuditAction(row.action);
  const target =
    row.entityLabel ??
    (row.entityId ? `${row.entityType} / ${row.entityId}` : row.entityType);

  // Surface source-system or reason in the notes column when available,
  // mirroring the mock dataset's behavior.
  const noteParts: string[] = [];
  if (row.reason) noteParts.push(row.reason);
  if (row.sourceSystem) noteParts.push(`Source: ${row.sourceSystem}`);
  const notes = noteParts.length > 0 ? noteParts.join(" · ") : undefined;

  return {
    id: row.id,
    timestamp: formatTimestamp(row.timestamp),
    eventType,
    actor: row.actor,
    actorRole: row.actorRole ?? "—",
    target,
    targetType: row.entityType,
    action: actionLabel(row.action),
    previousValue: row.previousValue ?? undefined,
    newValue: row.newValue ?? undefined,
    ipAddress: row.ipAddress ?? "internal",
    aiInvolved: row.aiInvolved,
    severity: mapSeverity(row.action, row.critical),
    notes,
    live: true,
  };
}

/**
 * Returns recent audit events from the DB mapped to the UI `AuditEvent`
 * shape. Each row is tagged `live: true` so the client component can render
 * a "live" indicator next to DB-sourced rows.
 */
export async function getDbAuditEvents(
  limit: number = 200,
): Promise<(AuditEvent & { live: true })[]> {
  const rows = await fetchRows(limit);
  return rows.map(rowToAuditEvent);
}
