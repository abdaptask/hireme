/**
 * Clients roster — server component.
 * Fetches from Neon via Prisma, merges with mock data for full coverage.
 * (CLAUDE.md §27, §30, §56)
 */
import type { Metadata } from "next";
import {
  Building2,
  ShieldCheck,
  TriangleAlert,
  Users,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { StatTile } from "@/components/workspace/stat-tile";
import { Badge } from "@/components/ui/badge";
import { InitiateOnboardingSheet } from "@/components/onboarding/initiate-sheet";
import { ClientsTable } from "@/components/clients/clients-table";
import { CLIENTS } from "@/lib/clients";
import { getDbClients } from "@/lib/db-clients";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage() {
  // 1. Fetch from DB — gracefully degrade to empty on failure
  const dbClients = await getDbClients().catch((err) => {
    console.error("[clients] DB fetch failed:", err?.message);
    return [];
  });

  // 2. Merge: DB clients are source of truth; mock fills any gaps
  const dbIdSet = new Set(dbClients.map((c) => c.id));
  const mockOnly = CLIENTS.filter((c) => !dbIdSet.has(c.id));
  const merged = [...dbClients, ...mockOnly];

  // 3. Portfolio stats
  const totalClients = merged.length;
  const dbCount = dbClients.length;
  const atRisk = merged.filter((c) => c.status === "at-risk").length;
  const avgCompliance = Math.round(
    merged.reduce((sum, c) => sum + c.compliancePassRate, 0) / (merged.length || 1),
  );
  const totalConsultants = merged.reduce((sum, c) => sum + c.activeConsultants, 0);

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="Clients"
        description="Client portfolio — compliance rules, onboarding pipeline, and promise tracking (§27, §30)."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="tabular-nums">
              {totalClients} clients
              {dbCount > 0 && (
                <span className="text-success ml-1">· {dbCount} live</span>
              )}
            </Badge>
            <InitiateOnboardingSheet />
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={Building2} label="Total clients" value={totalClients} />
        <StatTile
          icon={Users}
          label="Active consultants"
          value={totalConsultants}
          tone="info"
        />
        <StatTile
          icon={ShieldCheck}
          label="Avg compliance rate"
          value={`${avgCompliance}%`}
          tone="success"
        />
        <StatTile
          icon={TriangleAlert}
          label="At-risk clients"
          value={atRisk}
          tone={atRisk > 0 ? "danger" : "success"}
        />
      </div>

      <ClientsTable clients={merged} dbIds={dbIdSet} />
    </PageContainer>
  );
}
