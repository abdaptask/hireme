/**
 * DB query helpers — maps Prisma Communication rows to the UI's
 * CommunicationRecord type so the rest of the app stays type-stable.
 *
 * Server-only (imports `db` which uses pg). Do NOT import in client components.
 */

import { db } from "@/lib/db";
import type {
  CommChannel,
  CommStatus,
  CommunicationRecord,
  CommVisibility,
} from "@/lib/communications";

// ─────────────────────────────────────────────────────────
// Enum mapping helpers
// ─────────────────────────────────────────────────────────

function mapChannel(ch: string): CommChannel {
  switch (ch) {
    case "EMAIL":
      return "email";
    case "SMS":
      return "sms";
    case "PORTAL":
      return "portal";
    case "VOICE":
      return "voice";
    // INTERNAL maps to "portal" visually (closest UI bucket); visibility flag
    // below carries the "internal" semantic.
    case "INTERNAL":
      return "portal";
    default:
      return "email";
  }
}

const VALID_STATUSES = new Set<CommStatus>([
  "sent",
  "delivered",
  "opened",
  "replied",
  "bounced",
  "failed",
  "scheduled",
]);

function mapStatus(s: string | null | undefined): CommStatus {
  if (!s) return "sent";
  const lower = s.toLowerCase() as CommStatus;
  if (VALID_STATUSES.has(lower)) return lower;
  // Handle a few likely upstream variants
  switch (s.toUpperCase()) {
    case "DELIVERED":
      return "delivered";
    case "OPENED":
      return "opened";
    case "REPLIED":
    case "RESPONDED":
      return "replied";
    case "BOUNCED":
      return "bounced";
    case "FAILED":
      return "failed";
    case "SCHEDULED":
    case "QUEUED":
      return "scheduled";
    default:
      return "sent";
  }
}

function mapVisibility(channelEnum: string): CommVisibility {
  // INTERNAL channel implies internal-only visibility.
  if (channelEnum === "INTERNAL") return "internal";
  return "candidate";
}

// ─────────────────────────────────────────────────────────
// Date formatting
// ─────────────────────────────────────────────────────────

function fmtDateTime(d: Date | null | undefined): string | undefined {
  if (!d) return undefined;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

// ─────────────────────────────────────────────────────────
// List query
// ─────────────────────────────────────────────────────────

type CommRow = Awaited<ReturnType<typeof fetchRows>>[number];

async function fetchRows() {
  return db.communication.findMany({
    orderBy: [{ sentAt: "desc" }, { createdAt: "desc" }],
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

function rowToRecord(c: CommRow): CommunicationRecord {
  const channel = mapChannel(c.channel);
  const status = mapStatus(c.status);
  const sentAt = fmtDateTime(c.sentAt);
  // The mock model uses a single "subject" string; DB has subject + body.
  // Subject is the headline; fall back to a body excerpt if missing.
  const subject =
    c.subject ?? (c.body ? c.body.slice(0, 80) : "(no subject)");

  return {
    id: c.id,
    candidateId: c.candidate?.id ?? c.candidateId ?? "unknown",
    candidateName: c.candidate
      ? `${c.candidate.firstName} ${c.candidate.lastName}`
      : "Unknown candidate",
    client: c.candidate?.clientName ?? "Unassigned",
    channel,
    subject,
    templateName: undefined,
    status,
    sentAt,
    scheduledFor: status === "scheduled" ? sentAt : undefined,
    openedAt: fmtDateTime(c.openedAt),
    sentBy: c.sentBy ?? "System",
    visibility: mapVisibility(c.channel),
    isNudge: c.nudgeLevel !== null && c.nudgeLevel !== undefined,
    nudgeLevel: c.nudgeLevel ?? undefined,
  };
}

/** Returns all communications from the DB as CommunicationRecord[]. */
export async function getDbCommunications(): Promise<CommunicationRecord[]> {
  const rows = await fetchRows();
  return rows.map(rowToRecord);
}
