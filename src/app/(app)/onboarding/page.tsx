"use client";

/**
 * Onboarding pipeline page (CLAUDE.md §14 — Day -14 to Day 30,  §5.3 Onboarder
 * Workspace, §9 Package Creation). Shows the live onboarding pipeline grouped
 * by stage, key stats, and surfaces the "Initiate Onboarding" action.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  ChevronRight,
  ClipboardList,
  Search,
  TriangleAlert,
  X,
  Zap,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { StatTile } from "@/components/workspace/stat-tile";
import { PipelineStatusBadge, RiskBadge } from "@/components/status-badge";
import { InitiateOnboardingSheet } from "@/components/onboarding/initiate-sheet";
import { CANDIDATES } from "@/lib/candidates";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Pipeline stages — spec §5.2 and §14
// ---------------------------------------------------------------------------

const PIPELINE_STAGES = [
  "Profile Setup",
  "Document Submission",
  "Background Check",
  "Tax & Payroll",
  "Client Requirements",
  "IT Provisioning",
  "Training",
  "Day 1 Prep",
] as const;

type Stage = (typeof PIPELINE_STAGES)[number];

const STAGE_COLOR: Record<Stage, string> = {
  "Profile Setup": "bg-info",
  "Document Submission": "bg-warning",
  "Background Check": "bg-primary",
  "Tax & Payroll": "bg-success",
  "Client Requirements": "bg-ai",
  "IT Provisioning": "bg-info",
  Training: "bg-warning",
  "Day 1 Prep": "bg-success",
};

// Normalize candidate stages to our pipeline stages
function normalizeStage(raw: string): Stage {
  const map: Record<string, Stage> = {
    "Profile Setup": "Profile Setup",
    "Document Submission": "Document Submission",
    "Background Check": "Background Check",
    "Tax & Payroll": "Tax & Payroll",
    "Client Requirements": "Client Requirements",
    "IT Provisioning": "IT Provisioning",
    Training: "Training",
    "Day 1 Prep": "Day 1 Prep",
  };
  return map[raw] ?? "Profile Setup";
}

export default function OnboardingPage() {
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<Stage | "all">("all");

  // Use all active (non-completed, non-offer-accepted) candidates
  const active = useMemo(
    () =>
      CANDIDATES.filter((c) => !["offer-accepted"].includes(c.status ?? "")),
    [],
  );

  // Stage distribution
  const stageCounts = useMemo(() => {
    const counts = new Map<Stage, number>();
    for (const stage of PIPELINE_STAGES) counts.set(stage, 0);
    for (const c of active) {
      const s = normalizeStage(c.stage);
      counts.set(s, (counts.get(s) ?? 0) + 1);
    }
    return counts;
  }, [active]);

  // Stats
  const startingThisWeek = active.filter((c) => c.startInDays <= 7).length;
  const atRisk = active.filter(
    (c) => c.risk === "at-risk" || c.risk === "unlikely",
  ).length;
  const needsAction = active.filter(
    (c) => c.status === "needs-attention" || c.status === "waiting-external",
  ).length;

  // Filtered rows
  const rows = useMemo(() => {
    let list = active;
    if (stageFilter !== "all") {
      list = list.filter((c) => normalizeStage(c.stage) === stageFilter);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((c) =>
        [c.name, c.role, c.client, c.stage, c.recruiter, c.onboarder]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }
    return list;
  }, [active, stageFilter, query]);

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="Onboarding Pipeline"
        description="Active onboardings from Day -14 through Day 1 readiness (§14)."
        actions={<InitiateOnboardingSheet />}
      />

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          icon={ClipboardList}
          label="Active onboardings"
          value={active.length}
        />
        <StatTile
          icon={CalendarClock}
          label="Starting this week"
          value={startingThisWeek}
          tone="info"
        />
        <StatTile
          icon={TriangleAlert}
          label="At risk"
          value={atRisk}
          tone="danger"
        />
        <StatTile
          icon={Zap}
          label="Needs action"
          value={needsAction}
          tone="warning"
        />
      </div>

      {/* ── Stage pipeline bar ────────────────────────────────────────── */}
      <section className="bg-card rounded-xl border p-4 shadow-xs">
        <h2 className="text-card-heading mb-3">Pipeline by stage</h2>
        <div className="flex flex-col gap-2">
          {PIPELINE_STAGES.map((stage) => {
            const count = stageCounts.get(stage) ?? 0;
            const pct = active.length > 0 ? (count / active.length) * 100 : 0;
            const isActive = stageFilter === stage;
            return (
              <button
                key={stage}
                type="button"
                onClick={() =>
                  setStageFilter(isActive ? "all" : stage)
                }
                className={cn(
                  "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                  isActive
                    ? "bg-primary/8 ring-1 ring-primary/20"
                    : "hover:bg-muted/50",
                )}
              >
                <span className="w-36 shrink-0 text-xs font-medium leading-none">
                  {stage}
                </span>
                <div className="flex-1">
                  <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                    <span
                      className={cn(
                        "block h-full rounded-full transition-all",
                        STAGE_COLOR[stage],
                      )}
                      style={{ width: `${Math.max(pct, count > 0 ? 3 : 0)}%` }}
                    />
                  </div>
                </div>
                <span
                  className={cn(
                    "w-5 text-right text-xs tabular-nums font-medium",
                    count === 0
                      ? "text-muted-foreground/40"
                      : "text-foreground",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        {stageFilter !== "all" && (
          <button
            type="button"
            onClick={() => setStageFilter("all")}
            className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <X className="size-3" />
            Clear filter — show all stages
          </button>
        )}
      </section>

      {/* ── Onboardings table ─────────────────────────────────────────── */}
      <section className="bg-card overflow-hidden rounded-xl border shadow-xs">
        <div className="flex items-center gap-2 border-b px-3 py-2.5">
          <div className="bg-muted/60 focus-within:ring-ring flex h-8 w-full items-center gap-2 rounded-md border px-2.5 sm:w-72 focus-within:ring-2">
            <Search className="text-muted-foreground size-3.5" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                stageFilter === "all"
                  ? "Search onboardings…"
                  : `Search in ${stageFilter}…`
              }
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="Clear search">
                <X className="text-muted-foreground hover:text-foreground size-3.5" />
              </button>
            )}
          </div>
          <span className="text-muted-foreground ml-auto whitespace-nowrap text-xs tabular-nums">
            {rows.length} shown
            {stageFilter !== "all" && (
              <span className="text-primary ml-1">· {stageFilter}</span>
            )}
          </span>
          {/* Inline trigger from table header too */}
          <InitiateOnboardingSheet
            trigger={
              <button
                type="button"
                className="text-primary hover:underline text-xs whitespace-nowrap"
              >
                + New
              </button>
            }
          />
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
                  "Type",
                  "Stage",
                  "Status",
                  "Risk",
                  "Start",
                  "Progress",
                  "Owners",
                  "Actions",
                ].map((h) => (
                  <th key={h} className="px-3 font-medium whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-muted/50 border-b transition-colors last:border-0"
                  style={{ height: "var(--row-h)" }}
                >
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
                    <span className="block text-xs">{c.recruiter}</span>
                    <span className="text-metadata block">{c.onboarder}</span>
                  </td>
                  <td className="px-3">
                    <div className="flex items-center gap-1">
                      <InitiateOnboardingSheet
                        prefill={{
                          firstName: c.name.split(" ")[0],
                          lastName: c.name.split(" ").slice(1).join(" "),
                          candidateEmail: c.email,
                          mobile: c.phone,
                          client: c.client,
                          jobTitle: c.role,
                          employmentType:
                            c.employmentType === "C2C"
                              ? "contract"
                              : c.employmentType === "1099"
                                ? "contract"
                                : "full-time",
                        }}
                        trigger={
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-primary text-xs whitespace-nowrap transition-colors"
                          >
                            Start
                          </button>
                        }
                      />
                      <Link
                        href={`/candidates/${c.id}`}
                        className="text-muted-foreground hover:text-primary"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ChevronRight className="size-4" />
                      </Link>
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
                    No onboardings match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </PageContainer>
  );
}
