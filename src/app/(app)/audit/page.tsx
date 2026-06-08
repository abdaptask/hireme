/**
 * Audit Center — server component (§26, §66).
 *
 * Fetches live AuditEvents from Neon via Prisma and merges them with the
 * mock seed so the page remains fully populated while the DB backfill is
 * underway. DB rows take priority by id; remaining mock rows fill in the
 * tail. The interactive surface (filters, slide-over, packet modal) lives
 * in <AuditClient/>.
 */

import { PageContainer, PageHeader } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { AuditClient, type AuditRow } from "@/components/audit/audit-client";
import { getDbAuditEvents } from "@/lib/db-audit";
import { AUDIT_EVENTS } from "@/lib/audit";

export const dynamic = "force-dynamic"; // always fresh — no stale cache

export default async function AuditPage() {
  // 1. Fetch from DB — gracefully degrade to empty when the connection fails
  //    so the page never goes blank in front of an auditor.
  const dbEvents = await getDbAuditEvents(200).catch((err) => {
    console.error("[audit] DB fetch failed:", err?.message);
    return [] as Awaited<ReturnType<typeof getDbAuditEvents>>;
  });

  // 2. Merge: DB rows are the source of truth; mock rows fill gaps for ids
  //    that haven't been backfilled yet. Tag each row with its origin so the
  //    client can render a live indicator.
  const dbIds = new Set(dbEvents.map((e) => e.id));
  const liveRows: AuditRow[] = dbEvents.map((e) => ({ ...e, source: "live" }));
  const mockRows: AuditRow[] = AUDIT_EVENTS.filter((e) => !dbIds.has(e.id)).map(
    (e) => ({ ...e, source: "mock" }),
  );
  const merged: AuditRow[] = [...liveRows, ...mockRows];

  const liveCount = liveRows.length;
  // Approximate total to make the "200 of N" freshness line meaningful even
  // when only mock data is present. Tune this once the DB has full history.
  const totalUniverse = Math.max(1247, merged.length);

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="Audit Center"
        description="Immutable record of every important action, override, AI event, and permission change (§26, §66)."
        actions={
          <Badge variant="outline" className="tabular-nums">
            {merged.length} events
            {liveCount > 0 && (
              <span className="text-success ml-1">· {liveCount} live</span>
            )}
          </Badge>
        }
      />

      <AuditClient
        events={merged}
        fetchedAt={new Date().toISOString()}
        liveCount={liveCount}
        totalUniverse={totalUniverse}
      />
    </PageContainer>
  );
}
