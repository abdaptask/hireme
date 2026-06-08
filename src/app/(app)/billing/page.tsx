/**
 * Billing Readiness — server component (CLAUDE.md §16).
 * Fetches DB rows via Prisma and merges with the mock catalog so the page
 * stays fully populated during the migration. DB rows are prepended and
 * tagged "● live" in the client UI.
 */

import { PageContainer, PageHeader } from "@/components/page";
import { BILLING_RECORDS } from "@/lib/billing";
import { getDbBillingRecords } from "@/lib/db-billing";
import { BillingClient } from "@/components/billing/billing-client";

export const dynamic = "force-dynamic"; // always fresh — no stale cache

export default async function BillingReadinessPage() {
  // 1. Fetch from DB — gracefully degrade to empty on connection failure.
  const dbRecords = await getDbBillingRecords().catch((err) => {
    console.error("[billing] DB fetch failed:", err?.message);
    return [];
  });

  // 2. Merge: DB rows are the source of truth; mock rows fill gaps for any
  //    candidate whose id doesn't exist in the DB yet.
  const dbIdSet = new Set(dbRecords.map((r) => r.candidateId));
  const mockOnly = BILLING_RECORDS.filter((r) => !dbIdSet.has(r.candidateId));
  const merged = [...dbRecords, ...mockOnly];

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="Billing Readiness"
        description="Gate-check every active consultant against §16.3 billing requirements before revenue can be recognized."
      />
      <BillingClient records={merged} dbIdSet={dbIdSet} />
    </PageContainer>
  );
}
