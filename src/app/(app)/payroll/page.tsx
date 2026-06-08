/**
 * Payroll Readiness page (CLAUDE.md §16 — Payroll and Billing Readiness).
 * Server component — fetches from Neon via Prisma, merges with mock data,
 * then hands off to the client view for filters + row expansion.
 */

import { PageContainer, PageHeader } from "@/components/page";
import { PayrollClient } from "@/components/payroll/payroll-client";
import { getDbPayrollRecords } from "@/lib/db-payroll";
import { PAYROLL_RECORDS } from "@/lib/payroll";

export const dynamic = "force-dynamic"; // always fresh — no stale cache

export default async function PayrollReadinessPage() {
  // 1. Fetch from DB — gracefully degrade to empty if connection fails
  const dbRecords = await getDbPayrollRecords().catch((err) => {
    console.error("[payroll] DB fetch failed:", err?.message);
    return [];
  });

  // 2. Merge: DB rows are source of truth; mock fills gaps for any candidate
  //    whose id doesn't exist in the DB yet.
  const dbIds = new Set(dbRecords.map((r) => r.candidateId));
  const records = [
    ...dbRecords,
    ...PAYROLL_RECORDS.filter((r) => !dbIds.has(r.candidateId)),
  ];

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="Payroll Readiness"
        description="Gate-check every active consultant against §16.2 payroll requirements before their start date."
      />

      <PayrollClient records={records} dbIdSet={Array.from(dbIds)} />
    </PageContainer>
  );
}
