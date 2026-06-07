/**
 * Integration Hub — server component.
 * Fetches from Neon, merges with mock for full coverage.
 * (CLAUDE.md §29, §74–§95)
 */
import type { Metadata } from "next";
import { IntegrationsGrid } from "@/components/integrations/integrations-grid";
import { INTEGRATIONS } from "@/lib/integrations";
import { getDbIntegrations } from "@/lib/db-integrations";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Integration Hub" };

export default async function IntegrationsPage() {
  // 1. Fetch from DB — graceful degradation
  const dbIntegrations = await getDbIntegrations().catch((err) => {
    console.error("[integrations] DB fetch failed:", err?.message);
    return [];
  });

  // 2. Merge: DB rows first, mock fills gaps by ID
  const dbIdSet = new Set(dbIntegrations.map((i) => i.id));
  const mockOnly = INTEGRATIONS.filter((i) => !dbIdSet.has(i.id));
  const merged = [...dbIntegrations, ...mockOnly];

  return <IntegrationsGrid integrations={merged} dbIds={dbIdSet} />;
}
