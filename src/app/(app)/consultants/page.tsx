"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ChevronRight,
  Clock,
  Search,
  Star,
  Users,
  X,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { StatTile } from "@/components/workspace/stat-tile";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  CONSULTANTS,
  CONSULTANT_STATUS_META,
  consultantStats,
} from "@/lib/consultants";

function fmt(rate: number): string {
  return `$${rate}/hr`;
}

export default function ConsultantsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const stats = useMemo(() => consultantStats(), []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CONSULTANTS;
    return CONSULTANTS.filter((c) =>
      [c.name, c.role, c.client, c.recruiter, c.accountManager, c.status]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [query]);

  return (
    <PageContainer className="flex flex-col gap-5">
      <PageHeader
        title="Consultants"
        description="Active workforce members across all lifecycle stages."
        actions={
          <Badge variant="outline" className="tabular-nums">
            {CONSULTANTS.length} total
          </Badge>
        }
      />

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          icon={Users}
          label="Active"
          value={stats.active}
          tone="success"
        />
        <StatTile
          icon={Clock}
          label="Extension Pending"
          value={stats.extensionPending}
          tone="warning"
        />
        <StatTile
          icon={Activity}
          label="Offboarding"
          value={stats.offboarding}
          tone="danger"
        />
        <StatTile
          icon={Star}
          label="Avg Satisfaction"
          value={stats.avgSatisfaction}
          suffix="/ 5"
          tone="info"
        />
      </div>

      {/* Table card */}
      <div className="bg-card flex flex-col rounded-xl border shadow-xs">
        <div className="flex items-center gap-2 border-b px-3 py-2.5">
          <div className="bg-muted/60 focus-within:ring-ring flex h-8 w-full items-center gap-2 rounded-md border px-2.5 sm:w-72 focus-within:ring-2">
            <Search className="text-muted-foreground size-3.5" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search consultants…"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="Clear search">
                <X className="text-muted-foreground hover:text-foreground size-3.5" />
              </button>
            )}
          </div>
          <span className="text-muted-foreground ml-auto text-xs tabular-nums">
            {rows.length} shown
          </span>
        </div>

        <div className="overflow-x-auto">
          <table
            className="w-full border-collapse text-left"
            style={{ fontSize: "var(--table-font)" }}
          >
            <thead>
              <tr className="text-muted-foreground border-b">
                {[
                  "Name / Role",
                  "Client",
                  "Type",
                  "Status",
                  "Bill Rate",
                  "Pay Rate",
                  "Start Date",
                  "Assignments",
                  "Score",
                  "AM",
                  "",
                ].map((h, i) => (
                  <th
                    key={i}
                    className="px-3 font-medium whitespace-nowrap"
                    style={{ height: "var(--row-h)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const meta = CONSULTANT_STATUS_META[c.status];
                return (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/consultants/${c.id}`)}
                    className="hover:bg-muted/50 cursor-pointer border-b transition-colors last:border-0"
                    style={{ height: "var(--row-h)" }}
                  >
                    {/* Name + Role */}
                    <td className="px-3">
                      <div className="flex items-center gap-2.5">
                        <span className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold">
                          {c.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                        <span className="flex min-w-0 flex-col leading-tight">
                          <Link
                            href={`/consultants/${c.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-primary truncate font-medium"
                          >
                            {c.name}
                          </Link>
                          <span className="text-metadata truncate">
                            {c.role}
                          </span>
                        </span>
                      </div>
                    </td>

                    {/* Client */}
                    <td className="px-3 whitespace-nowrap">{c.client}</td>

                    {/* Employment type */}
                    <td className="text-muted-foreground px-3">
                      {c.employmentType}
                    </td>

                    {/* Status */}
                    <td className="px-3">
                      <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                    </td>

                    {/* Bill rate */}
                    <td className="px-3 tabular-nums whitespace-nowrap">
                      <span className="font-medium">{fmt(c.billRate)}</span>
                    </td>

                    {/* Pay rate */}
                    <td className="text-muted-foreground px-3 tabular-nums whitespace-nowrap">
                      {fmt(c.payRate)}
                    </td>

                    {/* Start date */}
                    <td className="text-muted-foreground px-3 whitespace-nowrap">
                      {c.startDate}
                    </td>

                    {/* Assignments */}
                    <td className="px-3 tabular-nums text-center">
                      {c.assignments}
                    </td>

                    {/* Satisfaction score */}
                    <td className="px-3 tabular-nums whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <Star className="text-warning size-3.5 fill-current" />
                        {c.satisfactionScore.toFixed(1)}
                      </span>
                    </td>

                    {/* Account manager */}
                    <td className="text-muted-foreground px-3 whitespace-nowrap">
                      {c.accountManager}
                    </td>

                    {/* Action */}
                    <td className="px-3">
                      <ChevronRight className="text-muted-foreground size-4" />
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={11}
                    className="text-muted-foreground px-4 py-10 text-center text-sm"
                  >
                    No consultants match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
}
