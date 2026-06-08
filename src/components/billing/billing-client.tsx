"use client";

/**
 * Interactive billing readiness table (client component).
 * Server page (/billing) fetches DB + mock and hands the merged set here.
 *
 * DB-sourced rows are marked with a "● live" indicator via `dbIdSet`.
 */

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Receipt,
  XCircle,
} from "lucide-react";
import { StatTile } from "@/components/workspace/stat-tile";
import { StatusBadge } from "@/components/status-badge";
import { BILLING_STATUS_META } from "@/lib/billing";
import type { BillingRecord, BillingReadinessStatus } from "@/lib/billing";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Filter = "all" | "not-ready" | "pending";

type Props = {
  records: BillingRecord[];
  dbIdSet: Set<string>;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function checksPassedCount(record: BillingRecord): {
  passed: number;
  total: number;
} {
  const total = record.checks.length;
  const passed = record.checks.filter((c) => c.status === "pass").length;
  return { passed, total };
}

function checksColor(passed: number, total: number): string {
  const ratio = total > 0 ? passed / total : 1;
  if (ratio === 1) return "text-success-muted-foreground";
  if (ratio >= 0.7) return "text-warning-muted-foreground";
  return "text-danger-muted-foreground";
}

function CheckIcon({ status }: { status: "pass" | "fail" | "pending" }) {
  if (status === "pass")
    return <CheckCircle2 className="size-3.5 text-success-muted-foreground shrink-0" />;
  if (status === "fail")
    return <XCircle className="size-3.5 text-danger-muted-foreground shrink-0" />;
  return <Clock className="size-3.5 text-warning-muted-foreground shrink-0" />;
}

function computeStats(records: BillingRecord[]): {
  ready: number;
  notReady: number;
  pending: number;
  criticalGaps: number;
} {
  let ready = 0;
  let notReady = 0;
  let pending = 0;
  let criticalGaps = 0;

  for (const r of records) {
    if (r.overallStatus === "ready") ready++;
    else if (r.overallStatus === "not-ready") notReady++;
    else pending++;

    if (r.overallStatus === "not-ready" && r.startInDays <= 7) criticalGaps++;
  }

  return { ready, notReady, pending, criticalGaps };
}

// ---------------------------------------------------------------------------
// Row component (expandable)
// ---------------------------------------------------------------------------

function BillingRow({
  record,
  isLive,
}: {
  record: BillingRecord;
  isLive: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const { passed, total } = checksPassedCount(record);
  const meta = BILLING_STATUS_META[record.overallStatus];

  return (
    <>
      <tr
        className={cn(
          "hover:bg-muted/50 border-b transition-colors cursor-pointer",
          expanded && "bg-muted/30",
        )}
        style={{ height: "var(--row-h)" }}
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        {/* Candidate */}
        <td className="px-3">
          <div className="flex items-center gap-2.5">
            <span className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold select-none">
              {record.candidateName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="flex items-center gap-1.5">
                <Link
                  href={`/candidates/${record.candidateId}`}
                  className="hover:text-primary truncate font-medium"
                  onClick={(e) => e.stopPropagation()}
                >
                  {record.candidateName}
                </Link>
                {isLive && (
                  <span
                    className="text-success text-[10px] font-medium leading-none"
                    title="Live DB record"
                  >
                    ● live
                  </span>
                )}
              </span>
              <span className="text-metadata truncate">
                {record.startDate} · {record.startInDays}d
              </span>
            </span>
          </div>
        </td>

        {/* Client */}
        <td className="px-3 whitespace-nowrap">
          <span className="font-medium">{record.client}</span>
        </td>

        {/* Bill Rate */}
        <td className="px-3 whitespace-nowrap tabular-nums">
          <span className="font-medium">
            ${record.billRate}
            <span className="text-muted-foreground font-normal">/hr</span>
          </span>
        </td>

        {/* Markup */}
        <td className="text-muted-foreground px-3 whitespace-nowrap tabular-nums">
          {record.markup}%
        </td>

        {/* PO */}
        <td className="px-3 whitespace-nowrap">
          {record.purchaseOrder ? (
            <span className="font-mono text-xs">{record.purchaseOrder}</span>
          ) : (
            <span className="text-danger-muted-foreground text-xs font-medium">Missing</span>
          )}
        </td>

        {/* Timesheet */}
        <td className="text-muted-foreground px-3 whitespace-nowrap">
          {record.timesheetMethod}
        </td>

        {/* Checks */}
        <td className="px-3 whitespace-nowrap">
          <span className={cn("text-xs font-medium tabular-nums", checksColor(passed, total))}>
            {passed}/{total} passed
          </span>
        </td>

        {/* Status */}
        <td className="px-3">
          <StatusBadge
            tone={
              meta.tone === "success"
                ? "success"
                : meta.tone === "warning"
                  ? "warning"
                  : "danger"
            }
          >
            {meta.label}
          </StatusBadge>
        </td>

        {/* Actions */}
        <td className="px-3">
          <div className="flex items-center gap-1">
            <Link
              href={`/candidates/${record.candidateId}`}
              className="text-muted-foreground hover:text-primary"
              onClick={(e) => e.stopPropagation()}
              aria-label={`Open ${record.candidateName}`}
            >
              <ChevronRight className="size-4" />
            </Link>
            <button
              type="button"
              aria-label={expanded ? "Collapse checks" : "Expand checks"}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronDown
                className={cn(
                  "size-4 transition-transform duration-150",
                  expanded && "rotate-180",
                )}
              />
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded checks panel */}
      {expanded && (
        <tr className="bg-muted/20 border-b">
          <td colSpan={9} className="px-4 pb-3 pt-2">
            <p className="text-metadata mb-2 font-medium uppercase tracking-wide">
              Billing checks — {record.candidateName}
            </p>
            {(record.purchaseOrder ||
              record.costCenter ||
              record.clientWorkerId ||
              record.vmsId) && (
              <div className="mb-2 flex flex-wrap gap-2">
                {record.purchaseOrder && (
                  <span className="bg-muted text-muted-foreground rounded px-2 py-0.5 font-mono text-[11px]">
                    {record.purchaseOrder}
                  </span>
                )}
                {record.costCenter && (
                  <span className="bg-muted text-muted-foreground rounded px-2 py-0.5 font-mono text-[11px]">
                    {record.costCenter}
                  </span>
                )}
                {record.clientWorkerId && (
                  <span className="bg-muted text-muted-foreground rounded px-2 py-0.5 font-mono text-[11px]">
                    Worker: {record.clientWorkerId}
                  </span>
                )}
                {record.vmsId && (
                  <span className="bg-muted text-muted-foreground rounded px-2 py-0.5 font-mono text-[11px]">
                    VMS: {record.vmsId}
                  </span>
                )}
              </div>
            )}
            <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
              {record.checks.map((c) => (
                <div
                  key={c.label}
                  className={cn(
                    "flex items-start gap-2 rounded-lg border px-3 py-2",
                    c.status === "pass" && "bg-success-muted/30 border-success-muted",
                    c.status === "fail" && "bg-danger-muted/30 border-danger-muted",
                    c.status === "pending" && "bg-warning-muted/30 border-warning-muted",
                  )}
                >
                  <span className="mt-0.5">
                    <CheckIcon status={c.status} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-medium leading-snug">
                      {c.label}
                    </span>
                    {c.note && (
                      <span className="text-muted-foreground block text-[11px] leading-snug">
                        {c.note}
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------

export function BillingClient({ records, dbIdSet }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const stats = computeStats(records);

  const filtered = records.filter((r) => {
    if (filter === "all") return true;
    return r.overallStatus === (filter as BillingReadinessStatus);
  });

  const filterButtons: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "All", count: records.length },
    { id: "not-ready", label: "Not Ready", count: stats.notReady },
    { id: "pending", label: "Pending", count: stats.pending },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={FileText} label="Ready" value={stats.ready} tone="success" />
        <StatTile icon={XCircle} label="Not Ready" value={stats.notReady} tone="danger" />
        <StatTile icon={Clock} label="Pending" value={stats.pending} tone="warning" />
        <StatTile
          icon={AlertTriangle}
          label="Revenue at Risk (≤7d)"
          value={stats.criticalGaps}
          tone="danger"
        />
      </div>

      {/* Table section */}
      <section className="bg-card overflow-hidden rounded-xl border shadow-xs">
        {/* Filter bar */}
        <div className="flex items-center gap-2 border-b px-3 py-2.5">
          <Receipt className="text-muted-foreground size-4 shrink-0" />
          <span className="text-card-heading mr-2">Billing Records</span>
          <div className="flex items-center gap-1">
            {filterButtons.map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setFilter(btn.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  filter === btn.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground",
                )}
              >
                {btn.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                    filter === btn.id
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {btn.count}
                </span>
              </button>
            ))}
          </div>
          <span className="text-muted-foreground ml-auto text-xs tabular-nums">
            {filtered.length} shown
          </span>
        </div>

        <div className="overflow-x-auto">
          <table
            className="w-full border-collapse text-left"
            style={{ fontSize: "var(--table-font)" }}
          >
            <thead>
              <tr
                className="text-muted-foreground border-b"
                style={{ height: "var(--row-h)" }}
              >
                {[
                  "Candidate",
                  "Client",
                  "Bill Rate",
                  "Markup",
                  "PO",
                  "Timesheet",
                  "Checks",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th key={h} className="px-3 font-medium whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((record) => (
                <BillingRow
                  key={record.candidateId}
                  record={record}
                  isLive={dbIdSet.has(record.candidateId)}
                />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="text-muted-foreground px-4 py-10 text-center text-sm"
                  >
                    No records match the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="text-muted-foreground border-t px-4 py-2 text-xs">
          Click any row to expand billing checks. All 11 gate checks are validated per §16.3.
        </div>
      </section>
    </div>
  );
}
