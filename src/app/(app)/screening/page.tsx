"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { StatTile } from "@/components/workspace/stat-tile";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import {
  SCREENING_RECORDS,
  SCREENING_STATUS_META,
  screeningStats,
} from "@/lib/screening";
import type { DrugTestStatus, ScreeningStatus } from "@/lib/screening";

const DRUG_TEST_LABELS: Record<DrugTestStatus, { label: string; className: string }> = {
  "not-ordered": { label: "Not Ordered", className: "text-muted-foreground/60" },
  scheduled:     { label: "Scheduled",   className: "text-info-muted-foreground" },
  completed:     { label: "Completed",   className: "text-success-muted-foreground" },
  missed:        { label: "Missed",      className: "text-danger-muted-foreground" },
  rescheduled:   { label: "Rescheduled", className: "text-warning-muted-foreground" },
};

const SENSITIVE_STATUSES: ScreeningStatus[] = ["review-required", "adverse-pending"];

function isHighAlert(status: ScreeningStatus): boolean {
  return SENSITIVE_STATUSES.includes(status);
}

export default function ScreeningPage() {
  const stats = screeningStats();

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="Background Check & Screening"
        description="Full pipeline visibility for background checks, drug screens, and adjudication — role-restricted sensitive details (§22, §58)."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          icon={Clock}
          label="In progress"
          value={stats.inProgress}
          tone="info"
        />
        <StatTile
          icon={CheckCircle2}
          label="Clear"
          value={stats.clear}
          tone="success"
        />
        <StatTile
          icon={ShieldAlert}
          label="Review required"
          value={stats.reviewRequired}
          tone="danger"
        />
        <StatTile
          icon={AlertTriangle}
          label="Vendor delayed"
          value={stats.vendorDelayed}
          tone="warning"
        />
      </div>

      <section className="bg-card overflow-hidden rounded-xl border shadow-xs">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <h2 className="text-card-heading">Screening Records</h2>
          <span className="text-muted-foreground text-xs tabular-nums">
            {SCREENING_RECORDS.length} total · sorted by age
          </span>
        </div>

        <div className="overflow-x-auto">
          <table
            className="w-full border-collapse text-left"
            style={{ fontSize: "var(--table-font)" }}
          >
            <thead className="text-muted-foreground border-b">
              <tr>
                <th className="px-3 py-2 font-medium">Candidate</th>
                <th className="px-3 py-2 font-medium">Client</th>
                <th className="px-3 py-2 font-medium">Vendor</th>
                <th className="px-3 py-2 font-medium">Package</th>
                <th className="px-3 py-2 font-medium">Ordered</th>
                <th className="px-3 py-2 font-medium">Est. Completion</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Drug Test</th>
                <th className="px-3 py-2 font-medium">Age</th>
                <th className="px-3 py-2 font-medium">Cost</th>
              </tr>
            </thead>
            <tbody>
              {[...SCREENING_RECORDS]
                .sort((a, b) => b.ageDays - a.ageDays)
                .map((record) => {
                  const alert = isHighAlert(record.status);
                  const drugMeta = DRUG_TEST_LABELS[record.drugTest];

                  return (
                    <tr
                      key={record.id}
                      className={cn(
                        "border-b last:border-0 transition-colors",
                        alert
                          ? "bg-danger-muted/20 hover:bg-danger-muted/30"
                          : "hover:bg-muted/50",
                      )}
                    >
                      <td className="px-3 py-2 whitespace-nowrap">
                        <Link
                          href={`/candidates/${record.candidateId}`}
                          className="hover:text-primary font-medium"
                        >
                          {record.candidateName}
                        </Link>
                        {record.jurisdictionDelays && (
                          <span
                            title="Jurisdiction delay"
                            className="text-warning-muted-foreground ml-1.5 inline-flex items-center text-xs"
                          >
                            <AlertTriangle className="size-3" />
                          </span>
                        )}
                      </td>
                      <td className="text-muted-foreground px-3 py-2 whitespace-nowrap">
                        {record.client}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {record.vendor}
                      </td>
                      <td className="text-muted-foreground px-3 py-2 whitespace-nowrap">
                        {record.packageType}
                      </td>
                      <td className="text-muted-foreground px-3 py-2 tabular-nums whitespace-nowrap">
                        {record.orderedDate}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {record.actualCompletion ? (
                          <span className="text-success-muted-foreground font-medium">
                            {record.actualCompletion}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            {record.estimatedCompletion}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge
                          tone={SCREENING_STATUS_META[record.status].tone}
                        >
                          {SCREENING_STATUS_META[record.status].label}
                        </StatusBadge>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={cn("text-xs font-medium", drugMeta.className)}>
                          {drugMeta.label}
                        </span>
                        {record.drugTestDate && (
                          <span className="text-muted-foreground ml-1 text-xs">
                            {record.drugTestDate}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        <span
                          className={cn(
                            "text-xs font-medium",
                            record.ageDays >= 10
                              ? "text-warning-muted-foreground"
                              : "text-muted-foreground",
                          )}
                        >
                          {record.ageDays}d
                        </span>
                      </td>
                      <td className="text-muted-foreground px-3 py-2 tabular-nums">
                        ${record.cost}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="text-muted-foreground border-t px-4 py-2 text-xs">
          Rows highlighted in red indicate records requiring adjudication or with adverse action pending (§22). Sensitive result details require elevated role access.
        </div>
      </section>
    </PageContainer>
  );
}
