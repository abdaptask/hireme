"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  XCircle,
} from "lucide-react";
import { StatTile } from "@/components/workspace/stat-tile";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import {
  TRAINING_STATUS_META,
  type TrainingRecord,
} from "@/lib/training";

type FilterKey = "all" | "overdue" | "required";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "overdue", label: "Overdue" },
  { key: "required", label: "Required" },
];

export type TrainingClientProps = {
  records: TrainingRecord[];
};

export function TrainingClient({ records }: TrainingClientProps) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const stats = useMemo(() => {
    const completed = records.filter((r) => r.status === "completed").length;
    const inProgress = records.filter((r) =>
      ["assigned", "started"].includes(r.status),
    ).length;
    const overdue = records.filter((r) => r.status === "overdue").length;
    const failed = records.filter((r) => r.status === "failed").length;
    return { completed, inProgress, overdue, failed };
  }, [records]);

  const rows = useMemo(() => {
    switch (filter) {
      case "overdue":
        return records.filter((r) => r.status === "overdue");
      case "required":
        return records.filter((r) => r.required);
      default:
        return records;
    }
  }, [filter, records]);

  return (
    <>
      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          icon={CheckCircle2}
          label="Completed"
          value={stats.completed}
          tone="success"
        />
        <StatTile
          icon={BookOpen}
          label="In progress"
          value={stats.inProgress}
          tone="info"
        />
        <StatTile
          icon={Clock}
          label="Overdue"
          value={stats.overdue}
          tone="danger"
        />
        <StatTile
          icon={XCircle}
          label="Failed"
          value={stats.failed}
          tone="danger"
        />
      </div>

      {/* Table card */}
      <section className="bg-card overflow-hidden rounded-xl border shadow-xs">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2.5">
          <h2 className="text-card-heading mr-auto">Training Records</h2>
          <div className="flex items-center gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                  filter === f.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <span className="text-muted-foreground text-xs tabular-nums">
            {rows.length} records
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
                  "Course",
                  "Category",
                  "Candidate",
                  "Client",
                  "Due Date",
                  "Status",
                  "Score",
                  "Attempts",
                  "Required",
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
              {rows.map((record) => {
                const meta = TRAINING_STATUS_META[record.status];
                const isOverdue = record.status === "overdue";
                return (
                  <tr
                    key={record.id}
                    className={cn(
                      "hover:bg-muted/50 border-b last:border-0",
                      isOverdue && "bg-danger-muted/20",
                    )}
                  >
                    {/* Course */}
                    <td
                      className="px-3 whitespace-nowrap"
                      style={{ height: "var(--row-h)" }}
                    >
                      <span className="font-medium">{record.courseName}</span>
                    </td>

                    {/* Category */}
                    <td
                      className="text-muted-foreground px-3 whitespace-nowrap"
                      style={{ height: "var(--row-h)" }}
                    >
                      {record.category}
                    </td>

                    {/* Candidate */}
                    <td
                      className="px-3 whitespace-nowrap"
                      style={{ height: "var(--row-h)" }}
                    >
                      <Link
                        href={`/candidates/${record.candidateId}`}
                        className="text-primary hover:underline"
                      >
                        {record.candidateName}
                      </Link>
                    </td>

                    {/* Client */}
                    <td
                      className="text-muted-foreground px-3 whitespace-nowrap"
                      style={{ height: "var(--row-h)" }}
                    >
                      {record.client}
                    </td>

                    {/* Due Date */}
                    <td
                      className={cn(
                        "px-3 font-mono text-xs whitespace-nowrap",
                        isOverdue
                          ? "text-danger font-semibold"
                          : "text-muted-foreground",
                      )}
                      style={{ height: "var(--row-h)" }}
                    >
                      {record.dueDate}
                    </td>

                    {/* Status */}
                    <td className="px-3" style={{ height: "var(--row-h)" }}>
                      <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                    </td>

                    {/* Score */}
                    <td
                      className="px-3 tabular-nums whitespace-nowrap"
                      style={{ height: "var(--row-h)" }}
                    >
                      {record.score !== undefined ? (
                        <span
                          className={cn(
                            "font-medium",
                            record.score >= 80
                              ? "text-success-muted-foreground"
                              : record.score >= 60
                                ? "text-warning-muted-foreground"
                                : "text-danger-muted-foreground",
                          )}
                        >
                          {record.score}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Attempts */}
                    <td
                      className="text-muted-foreground px-3 tabular-nums"
                      style={{ height: "var(--row-h)" }}
                    >
                      {record.attempts}
                    </td>

                    {/* Required */}
                    <td className="px-3" style={{ height: "var(--row-h)" }}>
                      {record.required ? (
                        <GraduationCap className="text-primary size-4" />
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          Optional
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
