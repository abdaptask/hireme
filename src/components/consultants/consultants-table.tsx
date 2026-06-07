"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Search, Star, X } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import type { Consultant } from "@/lib/consultants";
import { CONSULTANT_STATUS_META } from "@/lib/consultants";

interface Props {
  consultants: Consultant[];
  dbIds: Set<string>;
}

function fmt(rate: number): string {
  return `$${rate}/hr`;
}

export function ConsultantsTable({ consultants, dbIds }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return consultants;
    return consultants.filter((c) =>
      [c.name, c.role, c.client, c.recruiter, c.accountManager, c.status]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [query, consultants]);

  return (
    <div className="bg-card flex flex-col rounded-xl border shadow-xs">
      {/* Toolbar */}
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

      {/* Table */}
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
              const isLive = dbIds.has(c.id);
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
                        <span className="flex items-center gap-1">
                          <Link
                            href={`/consultants/${c.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-primary truncate font-medium"
                          >
                            {c.name}
                          </Link>
                          {isLive && (
                            <span className="text-success text-[10px] font-medium">
                              ●
                            </span>
                          )}
                        </span>
                        <span className="text-metadata truncate">{c.role}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-3 whitespace-nowrap">{c.client}</td>
                  <td className="text-muted-foreground px-3">{c.employmentType}</td>
                  <td className="px-3">
                    <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                  </td>
                  <td className="px-3 tabular-nums whitespace-nowrap">
                    <span className="font-medium">{fmt(c.billRate)}</span>
                  </td>
                  <td className="text-muted-foreground px-3 tabular-nums whitespace-nowrap">
                    {fmt(c.payRate)}
                  </td>
                  <td className="text-muted-foreground px-3 whitespace-nowrap">
                    {c.startDate}
                  </td>
                  <td className="px-3 tabular-nums text-center">
                    {c.assignments}
                  </td>
                  <td className="px-3 tabular-nums whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      <Star className="text-warning size-3.5 fill-current" />
                      {c.satisfactionScore.toFixed(1)}
                    </span>
                  </td>
                  <td className="text-muted-foreground px-3 whitespace-nowrap">
                    {c.accountManager}
                  </td>
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
  );
}
