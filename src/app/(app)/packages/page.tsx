/**
 * Onboarding Packages — server component.
 * Fetches from Neon, merges with mock for full coverage.
 * (CLAUDE.md §8, §9, §102)
 */
import type { Metadata } from "next";
import { PackagesGrid } from "@/components/packages/packages-grid";
import { PACKAGES } from "@/lib/packages";
import { getDbPackages } from "@/lib/db-packages";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Packages" };

export default async function PackagesPage() {
  // 1. Fetch from DB — graceful degradation
  const dbPackages = await getDbPackages().catch((err) => {
    console.error("[packages] DB fetch failed:", err?.message);
    return [];
  });

  // 2. Merge: DB rows first, mock fills gaps by ID
  const dbIdSet = new Set(dbPackages.map((p) => p.id));
  const mockOnly = PACKAGES.filter((p) => !dbIdSet.has(p.id));
  const merged = [...dbPackages, ...mockOnly];

  return <PackagesGrid packages={merged} dbIds={dbIdSet} />;
}
