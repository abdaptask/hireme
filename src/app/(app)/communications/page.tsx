/**
 * Communications Command Center — server component (§24).
 * Fetches from Neon via Prisma; merges with mock data for records not yet in
 * the DB so the list stays populated during the migration.
 */
import { PageContainer, PageHeader } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { CommunicationsClient } from "@/components/communications/communications-client";
import { COMMUNICATIONS } from "@/lib/communications";
import { getDbCommunications } from "@/lib/db-communications";

export const dynamic = "force-dynamic"; // always fresh — no stale cache

export default async function CommunicationsPage() {
  // 1. Fetch from DB — gracefully degrade to empty if connection fails
  const dbComms = await getDbCommunications().catch((err) => {
    console.error("[communications] DB fetch failed:", err?.message);
    return [];
  });

  // 2. Merge: DB rows are the source of truth; mock rows fill gaps for any
  //    communication whose id doesn't exist in the DB yet.
  const dbIds = new Set(dbComms.map((c) => c.id));
  const mockOnly = COMMUNICATIONS.filter((c) => !dbIds.has(c.id));
  const merged = [...dbComms, ...mockOnly];

  const dbCount = dbComms.length;
  const totalCount = merged.length;

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="Communications Command Center"
        description="Unified email, SMS, portal, and voice channel tracking with nudge escalation protocol (§24, §13)."
        actions={
          <Badge variant="outline" className="tabular-nums">
            {totalCount} records
            {dbCount > 0 && (
              <span className="text-success ml-1">· {dbCount} live</span>
            )}
          </Badge>
        }
      />

      <CommunicationsClient communications={merged} />
    </PageContainer>
  );
}
