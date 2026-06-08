"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Search, X } from "lucide-react";
import { PipelineStatusBadge, RiskBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { InitiateOnboardingSheet } from "@/components/onboarding/initiate-sheet";
import { SavedViewsMenu } from "@/components/saved-views/saved-views-menu";
import type { CandidateSummary } from "@/lib/candidates";
import type { SavedView, SavedViewFilters } from "@/lib/saved-views";
import { cn } from "@/lib/utils";

interface Props {
  candidates: CandidateSummary[];
}

const TABLE_ID = "candidates";

const ALL_COLUMNS = [
  "candidate",
  "client",
  "type",
  "stage",
  "status",
  "risk",
  "start",
  "progress",
  "owner",
] as const;
type ColumnId = (typeof ALL_COLUMNS)[number];
const DEFAULT_COLUMNS: ColumnId[] = [...ALL_COLUMNS];

const RISK_OPTIONS = [
  { id: "at-risk", label: "At Risk" },
  { id: "needs-attention", label: "Needs Attention" },
  { id: "on-track", label: "On Track" },
  { id: "unlikely", label: "Unlikely" },
];

const EMPLOYMENT_OPTIONS = [
  { id: "W-2", label: "W-2" },
  { id: "1099", label: "1099" },
  { id: "C2C", label: "C2C" },
];

type Filters = {
  risk?: string;
  employmentType?: string;
  startsThisWeek?: boolean;
};

export function CandidatesTable({ candidates }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({});
  const [columns, setColumns] = useState<ColumnId[]>(DEFAULT_COLUMNS);

  const isVisible = (col: ColumnId) => columns.includes(col);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return candidates.filter((c) => {
      if (q) {
        const hay = [c.name, c.role, c.client, c.recruiter, c.onboarder, c.stage]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filters.risk && c.risk !== filters.risk) return false;
      if (filters.employmentType && c.employmentType !== filters.employmentType)
        return false;
      if (filters.startsThisWeek && c.startInDays > 7) return false;
      return true;
    });
  }, [query, candidates, filters]);

  const applyView = (view: SavedView) => {
    // Cast through SavedViewFilters → Filters: we only consume keys we know.
    const f = view.filters as SavedViewFilters;
    setFilters({
      risk: typeof f.risk === "string" ? f.risk : undefined,
      employmentType:
        typeof f.employmentType === "string" ? f.employmentType : undefined,
      startsThisWeek: f.startsThisWeek === true ? true : undefined,
    });
    if (view.columns.length > 0) {
      const valid = view.columns.filter((c): c is ColumnId =>
        (ALL_COLUMNS as readonly string[]).includes(c),
      );
      setColumns(valid.length > 0 ? valid : DEFAULT_COLUMNS);
    } else {
      setColumns(DEFAULT_COLUMNS);
    }
  };

  const activeFilterCount =
    (filters.risk ? 1 : 0) +
    (filters.employmentType ? 1 : 0) +
    (filters.startsThisWeek ? 1 : 0);

  const currentFilters: SavedViewFilters = {
    ...(filters.risk ? { risk: filters.risk } : {}),
    ...(filters.employmentType
      ? { employmentType: filters.employmentType }
      : {}),
    ...(filters.startsThisWeek ? { startsThisWeek: true } : {}),
  };

  return (
    <div className="bg-card flex flex-col rounded-xl border shadow-xs">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2.5">
        <SavedViewsMenu
          tableId={TABLE_ID}
          currentFilters={currentFilters}
          currentColumns={columns}
          defaultColumns={DEFAULT_COLUMNS}
          onApply={applyView}
        />

        <div className="bg-muted/60 focus-within:ring-ring flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md border px-2.5 sm:w-72 sm:flex-initial focus-within:ring-2">
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

        {/* Risk filter */}
        <FilterChip
          label="Risk"
          value={filters.risk}
          options={RISK_OPTIONS}
          onChange={(v) => setFilters((f) => ({ ...f, risk: v }))}
        />

        {/* Employment type filter */}
        <FilterChip
          label="Type"
          value={filters.employmentType}
          options={EMPLOYMENT_OPTIONS}
          onChange={(v) => setFilters((f) => ({ ...f, employmentType: v }))}
        />

        {/* Starts-this-week toggle */}
        <button
          type="button"
          onClick={() =>
            setFilters((f) => ({
              ...f,
              startsThisWeek: f.startsThisWeek ? undefined : true,
            }))
          }
          className={cn(
            "h-7 rounded-md border px-2 text-xs transition-colors",
            filters.startsThisWeek
              ? "border-primary bg-primary/10 text-primary"
              : "bg-muted/60 text-muted-foreground hover:text-foreground",
          )}
        >
          Starts ≤ 7d
        </button>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={() => setFilters({})}
            className="text-muted-foreground hover:text-foreground text-xs underline-offset-2 hover:underline"
          >
            Clear filters
          </button>
        )}

        <span className="text-muted-foreground ml-auto text-xs tabular-nums">
          {rows.length} shown
          {activeFilterCount > 0 && (
            <Badge variant="outline" className="ml-2">
              {activeFilterCount} filter{activeFilterCount === 1 ? "" : "s"}
            </Badge>
          )}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table
          role="grid"
          className="w-full border-collapse text-left"
          style={{ fontSize: "var(--table-font)" }}
        >
          <thead>
            <tr className="text-muted-foreground border-b">
              {isVisible("candidate") && (
                <th scope="col" className="px-3 font-medium whitespace-nowrap" style={{ height: "var(--row-h)" }}>Candidate</th>
              )}
              {isVisible("client") && (
                <th scope="col" className="px-3 font-medium whitespace-nowrap" style={{ height: "var(--row-h)" }}>Client</th>
              )}
              {isVisible("type") && (
                <th scope="col" className="hidden px-3 font-medium whitespace-nowrap sm:table-cell" style={{ height: "var(--row-h)" }}>Type</th>
              )}
              {isVisible("stage") && (
                <th scope="col" className="hidden px-3 font-medium whitespace-nowrap sm:table-cell" style={{ height: "var(--row-h)" }}>Stage</th>
              )}
              {isVisible("status") && (
                <th scope="col" className="px-3 font-medium whitespace-nowrap" style={{ height: "var(--row-h)" }}>Status</th>
              )}
              {isVisible("risk") && (
                <th scope="col" className="px-3 font-medium whitespace-nowrap" style={{ height: "var(--row-h)" }}>Risk</th>
              )}
              {isVisible("start") && (
                <th scope="col" className="hidden px-3 font-medium whitespace-nowrap md:table-cell" style={{ height: "var(--row-h)" }}>Start</th>
              )}
              {isVisible("progress") && (
                <th scope="col" className="hidden px-3 font-medium whitespace-nowrap md:table-cell" style={{ height: "var(--row-h)" }}>Progress</th>
              )}
              {isVisible("owner") && (
                <th scope="col" className="hidden px-3 font-medium whitespace-nowrap lg:table-cell" style={{ height: "var(--row-h)" }}>Owner</th>
              )}
              <th scope="col" className="px-3 font-medium" style={{ height: "var(--row-h)" }}><span className="sr-only">Actions</span></th>
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
                {isVisible("candidate") && (
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
                )}

                {isVisible("client") && (
                  <td className="px-3 whitespace-nowrap">{c.client}</td>
                )}
                {isVisible("type") && (
                  <td className="hidden text-muted-foreground px-3 sm:table-cell">{c.employmentType}</td>
                )}
                {isVisible("stage") && (
                  <td className="hidden text-muted-foreground px-3 whitespace-nowrap sm:table-cell">
                    {c.stage}
                  </td>
                )}
                {isVisible("status") && (
                  <td className="px-3">
                    <PipelineStatusBadge status={c.status} />
                  </td>
                )}
                {isVisible("risk") && (
                  <td className="px-3">
                    <RiskBadge level={c.risk} />
                  </td>
                )}
                {isVisible("start") && (
                  <td className="hidden px-3 whitespace-nowrap md:table-cell">
                    <span className="tabular-nums">{c.startDateLabel}</span>
                    <span className="text-muted-foreground"> · {c.startInDays}d</span>
                  </td>
                )}
                {isVisible("progress") && (
                  <td className="hidden px-3 md:table-cell">
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
                )}
                {isVisible("owner") && (
                  <td className="hidden text-muted-foreground px-3 whitespace-nowrap lg:table-cell">
                    {c.recruiter}
                  </td>
                )}
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
                  colSpan={columns.length + 1}
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

/* ---------------------------------------------------------------------------
   Filter chip — a small select-like control rendered inline in the toolbar.
   Falls back to a native <select> for keyboard/screen-reader accessibility
   without pulling in another component primitive.
   --------------------------------------------------------------------------- */

function FilterChip({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | undefined;
  options: { id: string; label: string }[];
  onChange: (value: string | undefined) => void;
}) {
  const active = !!value;
  return (
    <label
      className={cn(
        "flex h-7 items-center gap-1 rounded-md border px-2 text-xs transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "bg-muted/60 text-muted-foreground hover:text-foreground",
      )}
    >
      <span>{label}:</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="bg-transparent text-xs outline-none"
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
