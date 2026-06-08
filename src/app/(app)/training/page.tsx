/**
 * Training & Certifications — server component (§37).
 * Fetches live training rows from Neon via Prisma and merges with mock data
 * for any record whose id doesn't exist in the DB yet, so the page stays
 * fully populated during the migration.
 */
import { PageContainer, PageHeader } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { TrainingClient } from "@/components/training/training-client";
import { getDbTrainings } from "@/lib/db-training";
import { TRAINING_RECORDS } from "@/lib/training";

export const dynamic = "force-dynamic"; // always fresh — no stale cache

export default async function TrainingPage() {
  // 1. Fetch from DB — gracefully degrade to empty if connection fails
  const dbTrainings = await getDbTrainings().catch((err) => {
    console.error("[training] DB fetch failed:", err?.message);
    return [];
  });

  // 2. Merge: DB rows are the source of truth; mock rows fill gaps for any
  //    training id not yet in the DB.
  const dbIds = new Set(dbTrainings.map((t) => t.id));
  const mockOnly = TRAINING_RECORDS.filter((t) => !dbIds.has(t.id));
  const merged = [...dbTrainings, ...mockOnly];

  const dbCount = dbTrainings.length;
  const totalCount = merged.length;

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="Training & Certifications"
        description="Track course assignments, completion, scores, and certification expiry for all candidates (§37)."
        actions={
          <Badge variant="outline" className="tabular-nums">
            {totalCount} records
            {dbCount > 0 && (
              <span className="text-success ml-1">· {dbCount} live</span>
            )}
          </Badge>
        }
      />

      <TrainingClient records={merged} />
    </PageContainer>
  );
}
