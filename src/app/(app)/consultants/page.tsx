/**
 * Consultants roster — server component.
 * Fetches from Neon, merges with mock for full coverage.
 * (CLAUDE.md §15, §38 lifecycle)
 */
import type { Metadata } from "next";
import { Activity, Clock, Star, Users } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { StatTile } from "@/components/workspace/stat-tile";
import { Badge } from "@/components/ui/badge";
import { ConsultantsTable } from "@/components/consultants/consultants-table";
import { CONSULTANTS } from "@/lib/consultants";
import { getDbConsultants } from "@/lib/db-consultants";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Consultants" };

export default async function ConsultantsPage() {
  // 1. Fetch from DB — graceful degradation
  const dbConsultants = await getDbConsultants().catch((err) => {
    console.error("[consultants] DB fetch failed:", err?.message);
    return [];
  });

  // 2. Merge: DB rows first, mock fills gaps by ID
  const dbIdSet = new Set(dbConsultants.map((c) => c.id));
  const mockOnly = CONSULTANTS.filter((c) => !dbIdSet.has(c.id));
  const merged = [...dbConsultants, ...mockOnly];

  // 3. Stats
  const active = merged.filter((c) => c.status === "Active").length;
  const extensionPending = merged.filter(
    (c) => c.status === "Extension Pending",
  ).length;
  const offboarding = merged.filter((c) => c.status === "Offboarding").length;
  const avgSatisfaction =
    merged.length === 0
      ? "—"
      : (
          merged.reduce((s, c) => s + c.satisfactionScore, 0) / merged.length
        ).toFixed(1);

  const dbCount = dbConsultants.length;

  return (
    <PageContainer className="flex flex-col gap-5">
      <PageHeader
        title="Consultants"
        description="Active workforce members across all lifecycle stages."
        actions={
          <Badge variant="outline" className="tabular-nums">
            {merged.length} total
            {dbCount > 0 && (
              <span className="text-success ml-1">· {dbCount} live</span>
            )}
          </Badge>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={Users} label="Active" value={active} tone="success" />
        <StatTile
          icon={Clock}
          label="Extension Pending"
          value={extensionPending}
          tone="warning"
        />
        <StatTile
          icon={Activity}
          label="Offboarding"
          value={offboarding}
          tone="danger"
        />
        <StatTile
          icon={Star}
          label="Avg Satisfaction"
          value={avgSatisfaction}
          suffix="/ 5"
          tone="info"
        />
      </div>

      <ConsultantsTable consultants={merged} dbIds={dbIdSet} />
    </PageContainer>
  );
}
