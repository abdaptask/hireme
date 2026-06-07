import type { Metadata } from "next";
import { AlertTriangle, CheckCircle2, Clock, FileText } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { StatTile } from "@/components/workspace/stat-tile";
import { StatusBadge } from "@/components/status-badge";
import {
  COMPLIANCE_POLICIES,
  POLICY_STATUS_META,
  complianceStats,
} from "@/lib/compliance";

export const metadata: Metadata = { title: "Compliance Policies" };

export default function CompliancePage() {
  const stats = complianceStats();

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="Compliance Policies"
        description="Jurisdiction and category policy governance — organized by jurisdiction, employment type, and client applicability (§21)."
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
          icon={Clock}
          label="Draft / under review"
          value={stats.draft}
          tone="info"
        />
        <StatTile
          icon={AlertTriangle}
          label="Expiring soon"
          value={stats.expiringSoon}
          tone="warning"
        />
        <StatTile
          icon={FileText}
          label="Expired"
          value={stats.expired}
          tone="danger"
        />
      </div>

      {/* Policy table */}
      <section className="bg-card overflow-hidden rounded-xl border shadow-xs">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <h2 className="text-card-heading">Compliance Policies</h2>
          <span className="text-muted-foreground text-xs tabular-nums">
            {COMPLIANCE_POLICIES.length} policies
          </span>
        </div>

        <div className="overflow-x-auto">
          <table
            className="w-full border-collapse text-left"
            style={{ fontSize: "var(--table-font)" }}
          >
            <thead className="text-muted-foreground border-b">
              <tr>
                {[
                  "Policy Name",
                  "Jurisdiction",
                  "Category",
                  "Owner",
                  "Effective Date",
                  "Status",
                  "Version",
                  "Requires Ack",
                  "Clients",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-3 font-medium whitespace-nowrap"
                    style={{ height: "var(--row-h)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPLIANCE_POLICIES.map((policy) => {
                const meta = POLICY_STATUS_META[policy.status];
                const isExpired = policy.status === "expired";
                return (
                  <tr
                    key={policy.id}
                    className={`hover:bg-muted/50 border-b last:border-0 ${
                      isExpired ? "opacity-60" : ""
                    }`}
                  >
                    {/* Policy Name */}
                    <td
                      className="px-3 whitespace-nowrap"
                      style={{ height: "var(--row-h)" }}
                    >
                      <span className="font-medium">{policy.name}</span>
                      <span className="text-metadata mt-0.5 block max-w-[22rem] truncate">
                        {policy.description}
                      </span>
                    </td>

                    {/* Jurisdiction */}
                    <td
                      className="px-3 whitespace-nowrap"
                      style={{ height: "var(--row-h)" }}
                    >
                      <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium">
                        {policy.jurisdiction}
                      </span>
                    </td>

                    {/* Category */}
                    <td
                      className="text-muted-foreground px-3 whitespace-nowrap"
                      style={{ height: "var(--row-h)" }}
                    >
                      {policy.category}
                    </td>

                    {/* Owner */}
                    <td
                      className="text-muted-foreground px-3 whitespace-nowrap"
                      style={{ height: "var(--row-h)" }}
                    >
                      {policy.owner}
                    </td>

                    {/* Effective Date */}
                    <td
                      className="text-muted-foreground px-3 font-mono text-xs whitespace-nowrap"
                      style={{ height: "var(--row-h)" }}
                    >
                      {policy.effectiveDate}
                    </td>

                    {/* Status */}
                    <td className="px-3" style={{ height: "var(--row-h)" }}>
                      <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                    </td>

                    {/* Version */}
                    <td
                      className="text-muted-foreground px-3 font-mono text-xs"
                      style={{ height: "var(--row-h)" }}
                    >
                      {policy.version}
                    </td>

                    {/* Requires Ack */}
                    <td className="px-3" style={{ height: "var(--row-h)" }}>
                      {policy.requiresAck ? (
                        <CheckCircle2 className="text-success size-4" />
                      ) : (
                        <span className="text-muted-foreground text-xs">No</span>
                      )}
                    </td>

                    {/* Client Applicability */}
                    <td
                      className="max-w-[14rem] px-3"
                      style={{ height: "var(--row-h)" }}
                    >
                      <span className="text-muted-foreground block truncate text-xs">
                        {policy.clientApplicability.join(", ")}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </PageContainer>
  );
}
