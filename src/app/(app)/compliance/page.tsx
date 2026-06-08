import type { Metadata } from "next";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { StatTile } from "@/components/workspace/stat-tile";
import { Button } from "@/components/ui/button";
import { CompliancePoliciesGrid } from "@/components/compliance/compliance-policies-grid";
import { ALL_COMPLIANCE_POLICIES, computeComplianceStats } from "@/lib/compliance-data";

export const metadata: Metadata = { title: "Compliance Policies" };

export default function CompliancePage() {
  const stats = computeComplianceStats();

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="Compliance Policies"
        description="Jurisdiction and category policy governance — organized by jurisdiction, employment type, and client applicability (§21, §57)."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Export
            </Button>
            <Button size="sm">
              + New Policy
            </Button>
          </div>
        }
      />

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          icon={CheckCircle2}
          label="Active policies"
          value={stats.active}
          tone="success"
        />
        <StatTile
          icon={AlertTriangle}
          label="Expiring within 30 days"
          value={stats.expiringSoon}
          tone="warning"
        />
        <StatTile
          icon={Clock}
          label="Pending acknowledgment"
          value={stats.pendingAck}
          tone="info"
        />
        <StatTile
          icon={ShieldCheck}
          label="Compliance coverage"
          value={stats.coverage}
          suffix="%"
          tone="success"
        />
      </div>

      {/* Client component — handles search, filter tabs, cards, and slide-over */}
      <CompliancePoliciesGrid policies={ALL_COMPLIANCE_POLICIES} />
    </PageContainer>
  );
}
