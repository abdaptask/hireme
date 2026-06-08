/**
 * Screening page — server component.
 * Fetches from Neon via Prisma (§22, §58); merges with mock data for screenings
 * not yet in the DB so the list stays fully populated during the migration.
 *
 * Other tabs (Adjudication, Drug Tests, Expiring) continue to use illustrative
 * mock data inside the client component.
 */
import { ScreeningClient } from "@/components/screening/screening-client";
import { getDbScreenings } from "@/lib/db-screening";
import { SCREENING_RECORDS } from "@/lib/screening";

export const dynamic = "force-dynamic"; // always fresh — no stale cache

export default async function ScreeningPage() {
  // 1. Fetch from DB — gracefully degrade to empty if connection fails
  const dbScreenings = await getDbScreenings().catch((err) => {
    console.error("[screening] DB fetch failed:", err?.message);
    return [];
  });

  // 2. Merge: DB rows are the source of truth; mock rows fill gaps for any
  //    screening whose id doesn't exist in the DB yet.
  const dbIdSet = new Set(dbScreenings.map((s) => s.id));
  const mockOnly = SCREENING_RECORDS.filter((s) => !dbIdSet.has(s.id));
  const merged = [...dbScreenings, ...mockOnly];

  return <ScreeningClient records={merged} dbIdSet={dbIdSet} />;
}
