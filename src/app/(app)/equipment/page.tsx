/**
 * Equipment & IT Provisioning — server component.
 * Fetches Equipment rows from Neon via Prisma (§17, §43, §61) and merges with
 * mock data so coverage stays complete during the migration. DB-backed rows
 * render a "● live" badge in the table.
 */
import { Check, Laptop, Package, Truck } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { StatTile } from "@/components/workspace/stat-tile";
import { EquipmentTable } from "@/components/equipment/equipment-client";
import { Badge } from "@/components/ui/badge";
import { EQUIPMENT_RECORDS } from "@/lib/equipment";
import type { EquipmentRecord } from "@/lib/equipment";
import { getDbEquipment } from "@/lib/db-equipment";

export const dynamic = "force-dynamic"; // always fresh — no stale cache

function computeStats(records: EquipmentRecord[]) {
  return {
    ready: records.filter(
      (r) => r.overallStatus === "ready" || r.overallStatus === "enrolled",
    ).length,
    delayed: records.filter((r) => r.overallStatus === "delayed").length,
    inFlight: records.filter((r) => r.overallStatus === "shipped").length,
    itIncomplete: records.filter(
      (r) =>
        !r.itAccess.email ||
        !r.itAccess.vpn ||
        !r.itAccess.clientCredentials ||
        !r.itAccess.deviceEnrolled,
    ).length,
  };
}

export default async function EquipmentPage() {
  // 1. Fetch from DB — gracefully degrade to empty if connection fails
  const dbEquipment = await getDbEquipment().catch((err) => {
    console.error("[equipment] DB fetch failed:", err?.message);
    return [] as EquipmentRecord[];
  });

  // 2. Merge: DB rows are the source of truth, keyed by candidateId. Mock rows
  //    fill gaps for candidates not yet in the DB.
  const dbCandidateIds = new Set(dbEquipment.map((r) => r.candidateId));
  const mockOnly = EQUIPMENT_RECORDS.filter(
    (r) => !dbCandidateIds.has(r.candidateId),
  );
  const merged: EquipmentRecord[] = [...dbEquipment, ...mockOnly];

  // Sort merged by soonest start so the table reads chronologically
  merged.sort((a, b) => a.startInDays - b.startInDays);

  const liveIds = dbEquipment.map((r) => r.id);
  const stats = computeStats(merged);
  const dbCount = dbEquipment.length;

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="Equipment & IT Provisioning"
        description="Track hardware assignment, shipping, IT access, and Day 1 readiness for all consultants (§17, §61)."
        actions={
          <Badge variant="outline" className="tabular-nums">
            {merged.length} records
            {dbCount > 0 && (
              <span className="text-success ml-1">· {dbCount} live</span>
            )}
          </Badge>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          icon={Check}
          label="Device ready"
          value={stats.ready}
          tone="success"
        />
        <StatTile
          icon={Truck}
          label="In transit"
          value={stats.inFlight}
          tone="info"
        />
        <StatTile
          icon={Package}
          label="Delayed"
          value={stats.delayed}
          tone="danger"
        />
        <StatTile
          icon={Laptop}
          label="IT incomplete"
          value={stats.itIncomplete}
          tone="warning"
        />
      </div>

      <EquipmentTable records={merged} liveIds={liveIds} />
    </PageContainer>
  );
}
