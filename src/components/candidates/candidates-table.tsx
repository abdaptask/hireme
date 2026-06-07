"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Search, X } from "lucide-react";
import { PipelineStatusBadge, RiskBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { InitiateOnboardingSheet } from "@/components/onboarding/initiate-sheet";
import type { CandidateSummary } from "@/lib/candidates";
import { cn } from "@/lib/utils";

interface Props {
  candidates: CandidateSummary[];
}

export function CandidatesTable({ candidates }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((c) =>
      [c.name, c.role, c.client, c.recruiter, c.onboarder, c.stage]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [query, candidates]);

  return (
    <div className="bg-card flex flex-col rounded-xl border shadow-xs">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b px-3 py-2.5">
        <div className="bg-muted/60 focus-within:ring-ring flex h-8 w-full items-center gap-2 rounded-md border px-2.5 sm:w-72 focus-within:ring-2">
          <Search className="text-muted-foreground size-3.5" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search candidates…"
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
                "Candidate",
                "Client",
                "Type",
                "Stage",
                "Status",
                "Risk",
                "Start",
                "Progress",
                "Owner",
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
            {rows.map((c) => (
              <tr
                key={c.id}
                onClick={() => router.push(`/candidates/${c.id}`)}
                className="hover:bg-muted/50 cursor-pointer border-b transition-colors"
                style={{ height: "var(--row-h)" }}
              >
                {/* Candidate name + role */}
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
                        href={`/candidates/${c.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-primary truncate font-medium"
                      >
                        {c.name}
                      </Link>
                      <span className="text-metadata truncate">{c.role}</span>
                    </span>
                  </div>
                </td>

                <td className="px-3 whitespace-nowrap">{c.client}</td>
                <td className="text-muted-foreground px-3">{c.employmentType}</td>
                <td className="text-muted-foreground px-3 whitespace-nowrap">
                  {c.stage}
                </td>
                <td className="px-3">
                  <PipelineStatusBadge status={c.status} />
                </td>
                <td className="px-3">
                  <RiskBadge level={c.risk} />
                </td>
                <td className="px-3 whitespace-nowrap">
                  <span className="tabular-nums">{c.startDateLabel}</span>
                  <span className="text-muted-foreground"> · {c.startInDays}d</span>
                </td>
                <td className="px-3">
                  <div className="flex items-center gap-2">
                    <div className="bg-muted h-1.5 w-16 overflow-hidden rounded-full">
                      <span
                        className={cn(
                          "block h-full rounded-full",
                          c.progress >= 75
                            ? "bg-success"
                            : c.progress >= 50
                              ? "bg-info"
                              : "bg-warning",
                        )}
                        style={{ width: `${c.progress}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {c.progress}%
                    </span>
                  </div>
                </td>
                <td className="text-muted-foreground px-3 whitespace-nowrap">
                  {c.recruiter}
                </td>
                <td className="px-3">
                  <div className="flex items-center gap-2">
                    <InitiateOnboardingSheet
                      prefill={{
                        firstName: c.name.split(" ")[0],
                        lastName: c.name.split(" ").slice(1).join(" "),
                        candidateEmail: c.email,
                        mobile: c.phone,
                        client: c.client,
                        jobTitle: c.role,
                        employmentType:
                          c.employmentType === "C2C" ? "contract" : "full-time",
                      }}
                      trigger={
                        <button
                          type="button"
                          onClick={(e) => e.stopPropagation()}
                          className="text-muted-foreground hover:text-primary text-xs transition-colors"
                        >
                          Start
                        </button>
                      }
                    />
                    <ChevronRight className="text-muted-foreground size-4" />
                  </div>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={10}
                  className="text-muted-foreground px-4 py-10 text-center text-sm"
                >
                  No candidates match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
