"use client";

import { useMemo, useState } from "react";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import type { StatusTone } from "@/lib/types";
import {
  formatDate,
  formatDateTime,
  relativeTime,
  daysUntil,
} from "@/lib/clock";

/**
 * Shared row contract for the Documents tab on Candidate 360 and Consultant 360.
 *
 * DB callers pass actual Date objects (Prisma); mock callers pass ISO strings.
 * `toDate()` normalizes both safely.
 */
export type DocumentRow = {
  id: string;
  name: string;
  category: string;
  /** Prisma DocumentStatus enum value as a string. */
  status: string;
  uploadedAt?: Date | string | null;
  reviewedAt?: Date | string | null;
  reviewedBy?: string | null;
  expiresAt?: Date | string | null;
  aiScore?: number | null;
  rejectedReason?: string | null;
};

type Props = {
  documents: DocumentRow[];
  emptyLabel?: string;
};

// ─────────────────────────────────────────────────────────
// Status display
// ─────────────────────────────────────────────────────────

const STATUS_META: Record<string, { tone: StatusTone; label: string }> = {
  APPROVED: { tone: "success", label: "Approved" },
  REJECTED: { tone: "danger", label: "Rejected" },
  CORRECTION_REQUIRED: { tone: "danger", label: "Correction Required" },
  SUBMITTED: { tone: "info", label: "Submitted" },
  AI_REVIEW: { tone: "ai", label: "AI Review" },
  PENDING: { tone: "neutral", label: "Pending" },
  EXPIRED: { tone: "warning", label: "Expired" },
};

type FilterKey = "all" | "completed" | "pending" | "rejected" | "expiring";

const FILTER_LABEL: Record<FilterKey, string> = {
  all: "All",
  completed: "Completed",
  pending: "Pending",
  rejected: "Rejected",
  expiring: "Expiring",
};

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

function toDate(v: Date | string | null | undefined): Date | null {
  if (!v) return null;
  if (v instanceof Date) {
    return Number.isNaN(v.getTime()) ? null : v;
  }
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatTs(d: Date): { absolute: string; relative: string } {
  return { absolute: formatDateTime(d), relative: relativeTime(d) };
}

function isCompleted(status: string): boolean {
  return status === "APPROVED";
}

function isPending(status: string): boolean {
  return (
    status === "PENDING" ||
    status === "SUBMITTED" ||
    status === "AI_REVIEW" ||
    status === "CORRECTION_REQUIRED"
  );
}

function isRejected(status: string): boolean {
  return status === "REJECTED";
}

function isExpiring(row: DocumentRow): boolean {
  const expires = toDate(row.expiresAt);
  if (!expires) return false;
  const days = daysUntil(expires);
  return days <= 60 && days >= 0;
}

function categorize(row: DocumentRow): FilterKey[] {
  const tags: FilterKey[] = ["all"];
  if (isCompleted(row.status)) tags.push("completed");
  if (isPending(row.status)) tags.push("pending");
  if (isRejected(row.status)) tags.push("rejected");
  if (isExpiring(row)) tags.push("expiring");
  return tags;
}

function expiryTone(d: Date): string {
  const days = daysUntil(d);
  if (days <= 30) return "text-danger font-medium";
  if (days <= 60) return "text-warning font-medium";
  return "";
}

// ─────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────

export function DocumentsTable({ documents, emptyLabel }: Props) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const counts = useMemo(() => {
    const tally: Record<FilterKey, number> = {
      all: 0,
      completed: 0,
      pending: 0,
      rejected: 0,
      expiring: 0,
    };
    for (const row of documents) {
      for (const tag of categorize(row)) {
        tally[tag] += 1;
      }
    }
    return tally;
  }, [documents]);

  const visible = useMemo(() => {
    if (filter === "all") return documents;
    return documents.filter((row) => categorize(row).includes(filter));
  }, [documents, filter]);

  if (!documents.length) {
    return (
      <div className="text-muted-foreground rounded-xl border border-dashed py-10 text-center text-sm">
        {emptyLabel ?? "No documents on file yet."}
      </div>
    );
  }

  const filterPills: FilterKey[] = [
    "all",
    "completed",
    "pending",
    "rejected",
    "expiring",
  ];

  return (
    <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
      {/* Filter toolbar */}
      <div className="bg-muted/30 flex flex-wrap items-center gap-1.5 border-b px-3 py-2">
        {filterPills.map((key) => {
          const active = filter === key;
          const count = counts[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-card text-muted-foreground border-border hover:bg-muted",
              )}
              aria-pressed={active}
            >
              {FILTER_LABEL[key]}
              <span
                className={cn(
                  "tabular-nums",
                  active ? "text-primary/80" : "text-muted-foreground/70",
                )}
              >
                ({count})
              </span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="text-muted-foreground px-4 py-8 text-center text-sm">
          No documents match this filter.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="text-muted-foreground border-b">
              <tr>
                <th className="px-4 py-2 font-medium whitespace-nowrap">
                  Document
                </th>
                <th className="px-4 py-2 font-medium whitespace-nowrap">
                  Category
                </th>
                <th className="px-4 py-2 font-medium whitespace-nowrap">
                  Status
                </th>
                <th className="px-4 py-2 font-medium whitespace-nowrap">
                  Submitted
                </th>
                <th className="px-4 py-2 font-medium whitespace-nowrap">
                  Reviewed
                </th>
                <th className="px-4 py-2 font-medium whitespace-nowrap">
                  Reviewer
                </th>
                <th className="px-4 py-2 font-medium whitespace-nowrap">
                  Expires
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((d) => {
                const meta =
                  STATUS_META[d.status] ?? { tone: "neutral" as const, label: d.status };
                const uploaded = toDate(d.uploadedAt);
                const reviewed = toDate(d.reviewedAt);
                const expires = toDate(d.expiresAt);
                const uploadedTs = uploaded ? formatTs(uploaded) : null;
                const reviewedTs = reviewed ? formatTs(reviewed) : null;
                const isRej = isRejected(d.status);
                return (
                  <tr key={d.id} className="border-b align-top last:border-0">
                    <td className="px-4 py-2.5">
                      <div className="flex items-start gap-2">
                        <FileText className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium">{d.name}</p>
                          {isRej && d.rejectedReason && (
                            <p className="text-danger mt-0.5 text-xs leading-snug">
                              {d.rejectedReason}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-muted-foreground px-4 py-2.5 capitalize">
                      {d.category}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                        {d.aiScore != null && (
                          <span
                            className={cn(
                              "inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                              d.aiScore >= 95
                                ? "bg-success-muted text-success-muted-foreground"
                                : d.aiScore >= 80
                                  ? "bg-warning-muted text-warning-muted-foreground"
                                  : "bg-danger-muted text-danger-muted-foreground",
                            )}
                            title={`AI quality score: ${d.aiScore}`}
                          >
                            {d.aiScore}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {uploadedTs ? (
                        <>
                          <span className="font-medium tabular-nums">
                            {uploadedTs.absolute}
                          </span>
                          <span className="text-metadata block">
                            {uploadedTs.relative}
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {reviewedTs ? (
                        <>
                          <span className="font-medium tabular-nums">
                            {reviewedTs.absolute}
                          </span>
                          <span className="text-metadata block">
                            {reviewedTs.relative}
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {d.reviewedBy ? (
                        <span className="font-medium">{d.reviewedBy}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {expires ? (
                        <span
                          className={cn("tabular-nums", expiryTone(expires))}
                        >
                          {formatDate(expires, { withYear: true })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
