/**
 * Candidates list — server component.
 * Fetches from Neon via Prisma (§43); merges with mock data for candidates
 * not yet in the DB so the list stays fully populated during the migration.
 */
import { PageContainer, PageHeader } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { InitiateOnboardingSheet } from "@/components/onboarding/initiate-sheet";
import { CandidatesTable } from "@/components/candidates/candidates-table";
import { getDbCandidates } from "@/lib/db-candidates";
import { CANDIDATES } from "@/lib/candidates";

export const dynamic = "force-dynamic"; // always fresh — no stale cache

export default async function CandidatesPage() {
  // 1. Fetch from DB — gracefully degrade to empty if connection fails
  const dbCandidates = await getDbCandidates().catch((err) => {
    console.error("[candidates] DB fetch failed:", err?.message);
    return [];
  });

  // 2. Merge: DB rows are the source of truth; mock rows fill gaps for any
  //    candidate whose id doesn't exist in the DB yet.
  const dbIds = new Set(dbCandidates.map((c) => c.id));
  const mockOnly = CANDIDATES.filter((c) => !dbIds.has(c.id));
  const merged = [...dbCandidates, ...mockOnly];

  const dbCount = dbCandidates.length;
  const totalCount = merged.length;

  return (
    <PageContainer className="flex flex-col gap-5">
      <PageHeader
        title="Candidates"
        description="Persistent workforce records — open any candidate's 360 view."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="tabular-nums">
              {totalCount} active
              {dbCount > 0 && (
                <span className="text-success ml-1">· {dbCount} live</span>
              )}
            </Badge>
            <InitiateOnboardingSheet />
          </div>
        }
      />

      <CandidatesTable candidates={merged} />
    </PageContainer>
  );
}
