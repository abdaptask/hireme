/**
 * DB query helpers — maps Prisma Equipment rows to the UI's EquipmentRecord
 * shape so the rest of the app stays type-stable.
 *
 * The schema stores one row per asset item (Equipment) linked to a Candidate.
 * The UI groups items by candidate into a single EquipmentRecord, so this
 * helper performs that grouping/aggregation.
 *
 * Server-only (imports `db` which uses pg). Do NOT import in client components.
 */

import { db } from "@/lib/db";
import type {
  AssetType,
  EquipmentItem,
  EquipmentRecord,
  EquipmentStatus,
} from "@/lib/equipment";

// ─────────────────────────────────────────────────────────
// Enum mapping helpers
// ─────────────────────────────────────────────────────────

/** Map Prisma EquipmentStatus -> UI EquipmentStatus. */
export function mapEquipmentStatus(s: string): EquipmentStatus {
  switch (s) {
    case "REQUESTED":
      return "requested";
    case "APPROVED":
      return "approved";
    case "ASSIGNED":
      return "assigned";
    case "SHIPPED":
      return "shipped";
    case "DELIVERED":
      return "delivered";
    case "ENROLLED":
      return "enrolled";
    case "READY":
      return "ready";
    case "DELAYED":
      return "delayed";
    case "RETURN_REQUIRED":
    case "RETURNED":
    case "LOST":
    case "DAMAGED":
      return "return-required";
    default:
      return "requested";
  }
}

/** Map a free-text DB asset type string to the UI's AssetType. */
function mapAssetType(raw: string | null | undefined): AssetType {
  const v = (raw ?? "").toLowerCase().replace(/[_\s]+/g, "-");
  if (v.includes("laptop")) return "laptop";
  if (v.includes("monitor") || v.includes("display")) return "monitor";
  if (v.includes("headset") || v.includes("headphone")) return "headset";
  if (v.includes("phone") || v.includes("mobile")) return "phone";
  if (v.includes("token") || v.includes("yubikey") || v.includes("rsa"))
    return "security-token";
  if (v.includes("badge") || v.includes("card")) return "badge";
  if (v.includes("license") || v.includes("software")) return "software-license";
  // Fallback — best-guess so the row still renders
  return "laptop";
}

// ─────────────────────────────────────────────────────────
// Date / location helpers
// ─────────────────────────────────────────────────────────

function formatStartDate(date: Date | null): string {
  if (!date) return "TBD";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysUntilStart(date: Date | null): number {
  if (!date) return 999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / 86_400_000);
}

function formatEta(date: Date | null | undefined): string | undefined {
  if (!date) return undefined;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function deriveShipTo(c: {
  workLocation: string | null;
  city: string | null;
  state: string | null;
}): string {
  const loc =
    c.workLocation ??
    (c.city ? `${c.city}${c.state ? ", " + c.state : ""}` : "Remote");
  // Heuristic: anything containing "Onsite" stays as-is; otherwise prefix Remote.
  if (/^onsite/i.test(loc) || /^remote/i.test(loc)) return loc;
  return `Remote — ${loc}`;
}

/** Choose a single overall status from item statuses (worst-wins). */
function deriveOverallStatus(items: EquipmentItem[]): EquipmentStatus {
  if (items.length === 0) return "requested";
  // Priority: delayed > return-required > requested > approved > assigned >
  //           shipped > delivered > enrolled > ready
  const order: EquipmentStatus[] = [
    "delayed",
    "return-required",
    "requested",
    "approved",
    "assigned",
    "shipped",
    "delivered",
    "enrolled",
    "ready",
  ];
  for (const s of order) {
    if (items.some((i) => i.status === s)) return s;
  }
  return items[0]!.status;
}

// ─────────────────────────────────────────────────────────
// List query
// ─────────────────────────────────────────────────────────

async function fetchEquipmentRows() {
  return db.equipment.findMany({
    orderBy: [{ updatedAt: "desc" }],
    include: {
      candidate: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          clientName: true,
          startDate: true,
          workLocation: true,
          city: true,
          state: true,
        },
      },
    },
  });
}

type EquipmentRow = Awaited<ReturnType<typeof fetchEquipmentRows>>[number];

/**
 * Returns equipment grouped by candidate as EquipmentRecord[].
 * Rows without a candidate are skipped (the UI keys off candidate).
 */
export async function getDbEquipment(): Promise<EquipmentRecord[]> {
  const rows = await fetchEquipmentRows();

  // Group by candidate
  const byCandidate = new Map<string, EquipmentRow[]>();
  for (const row of rows) {
    if (!row.candidate) continue;
    const key = row.candidate.id;
    const list = byCandidate.get(key) ?? [];
    list.push(row);
    byCandidate.set(key, list);
  }

  const records: EquipmentRecord[] = [];

  for (const [candidateId, rs] of byCandidate) {
    const cand = rs[0]!.candidate!;
    const candidateName = `${cand.firstName} ${cand.lastName}`;

    const items: EquipmentItem[] = rs.map((r) => ({
      assetType: mapAssetType(r.assetType),
      make: r.label,
      serialNumber: r.serialNumber ?? undefined,
      status: mapEquipmentStatus(r.status),
      trackingNumber: r.trackingNumber ?? undefined,
      carrier: r.carrier ?? undefined,
      estimatedDelivery: formatEta(r.estimatedDelivery),
      notes: r.notes ?? undefined,
    }));

    // IT-access flags are stored on each Equipment row. Treat as "granted if
    // any row says so" — the seeded data sets them at the candidate level.
    const itAccess = {
      email: rs.some((r) => r.emailProvisioned),
      vpn: rs.some((r) => r.vpnProvisioned),
      clientCredentials: rs.some((r) => r.clientCredentials),
      deviceEnrolled: rs.some((r) => r.deviceEnrolled),
    };

    records.push({
      id: `EQ-DB-${candidateId.slice(0, 8)}`,
      candidateId,
      candidateName,
      client: cand.clientName ?? "Unassigned",
      startDate: formatStartDate(cand.startDate),
      startInDays: daysUntilStart(cand.startDate),
      shipTo: deriveShipTo({
        workLocation: cand.workLocation,
        city: cand.city,
        state: cand.state,
      }),
      overallStatus: deriveOverallStatus(items),
      items,
      itAccess,
    });
  }

  // Sort by soonest start date (mirrors mock order intent)
  records.sort((a, b) => a.startInDays - b.startInDays);
  return records;
}
