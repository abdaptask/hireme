"use client";

/**
 * Onboarding pipeline workspace (CLAUDE.md §5.3 Onboarder Workspace,
 * §14 Day -14 → Day 30 lifecycle, §41.1 Next Best Action,
 * §41.4 AI Morning Briefing, §98 dashboard architecture).
 *
 * This is the central pipeline view: a kanban-style read-only board across
 * the 8 onboarding stages, an AI summary banner, vitals tiles, a filter
 * chip bar, and a Day -14 → Day +30 horizontal timeline placing every
 * candidate by their start date.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertOctagon,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  ClipboardList,
  Search,
  Sparkles,
  TimerReset,
  TriangleAlert,
  X,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { StatTile } from "@/components/workspace/stat-tile";
import { RiskBadge } from "@/components/status-badge";
import { InitiateOnboardingSheet } from "@/components/onboarding/initiate-sheet";
import { CANDIDATES, type CandidateSummary } from "@/lib/candidates";
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

const STAGE_ACCENT: Record<Stage, string> = {
  "Profile Setup": "bg-info",
  "Document Submission": "bg-warning",
  "Background Check": "bg-primary",
  "Tax & Payroll": "bg-success",
  "Client Requirements": "bg-ai",
  "IT Provisioning": "bg-info",
  Training: "bg-warning",
  "Day 1 Prep": "bg-success",
};

const STAGE_ALIASES: Record<string, Stage> = {
  "Profile Setup": "Profile Setup",
  "Document Submission": "Document Submission",
  "Background Check": "Background Check",
  "Tax & Payroll": "Tax & Payroll",
  "Client Requirements": "Client Requirements",
  "IT Provisioning": "IT Provisioning",
  Training: "Training",
  "Day 1 Prep": "Day 1 Prep",
  "Day 1 Preparation": "Day 1 Prep",
  "Pre-Onboarding": "Profile Setup",
};

function normalizeStage(raw: string): Stage {
  return STAGE_ALIASES[raw] ?? "Profile Setup";
}

// ---------------------------------------------------------------------------
// Extra mock candidates so every stage has a few cards (CLAUDE.md §98 — a
// pipeline view that's mostly empty defeats the purpose). Real data comes
// from CANDIDATES; these supplement empty stages to demo the kanban.
// ---------------------------------------------------------------------------

const EXTRA_CANDIDATES: CandidateSummary[] = [
  {
    id: "harper-quinn",
    name: "Harper Quinn",
    role: "Backend Engineer",
    client: "Cobalt Systems",
    employmentType: "W-2",
    location: "Remote · Boston, MA",
    stage: "Profile Setup",
    status: "on-track",
    risk: "on-track",
    startDateLabel: "Jul 08",
    startInDays: 26,
    recruiter: "Devon Hughes",
    onboarder: "Riya Kim",
    progress: 12,
    lastActivity: "20m ago",
    email: "harper.quinn@example.com",
    phone: "+1 (617) 555-0181",
    tags: ["Just accepted"],
  },
  {
    id: "isaac-yamada",
    name: "Isaac Yamada",
    role: "Product Designer",
    client: "Atlas Manufacturing",
    employmentType: "W-2",
    location: "Hybrid · Portland, OR",
    stage: "Profile Setup",
    status: "needs-attention",
    risk: "needs-attention",
    startDateLabel: "Jun 27",
    startInDays: 15,
    recruiter: "Aaron Flores",
    onboarder: "Sasha Patel",
    progress: 18,
    lastActivity: "1d ago",
    email: "isaac.yamada@example.com",
    phone: "+1 (503) 555-0102",
    tags: ["Awaiting profile completion"],
  },
  {
    id: "priya-shah",
    name: "Priya Shah",
    role: "QA Engineer",
    client: "Vertex Financial",
    employmentType: "W-2",
    location: "Onsite · Dallas, TX",
    stage: "IT Provisioning",
    status: "on-track",
    risk: "on-track",
    startDateLabel: "Jun 16",
    startInDays: 4,
    recruiter: "Lena Ortiz",
    onboarder: "Riya Kim",
    progress: 78,
    lastActivity: "2h ago",
    email: "priya.shah@example.com",
    phone: "+1 (214) 555-0151",
    tags: ["Laptop shipped"],
  },
  {
    id: "marco-ferreira",
    name: "Marco Ferreira",
    role: "Data Engineer",
    client: "Northwind Logistics",
    employmentType: "C2C",
    location: "Remote · São Paulo",
    stage: "IT Provisioning",
    status: "waiting-external",
    risk: "needs-attention",
    startDateLabel: "Jun 19",
    startInDays: 7,
    recruiter: "Devon Hughes",
    onboarder: "Sasha Patel",
    progress: 71,
    lastActivity: "6h ago",
    email: "marco.ferreira@example.com",
    phone: "+55 (11) 5555-0144",
    tags: ["Shipping delayed"],
    vendor: "Apex Staffing Partners",
  },
  {
    id: "evelyn-mwangi",
    name: "Evelyn Mwangi",
    role: "Clinical Coordinator",
    client: "Meridian Health",
    employmentType: "W-2",
    location: "Onsite · Houston, TX",
    stage: "Day 1 Prep",
    status: "on-track",
    risk: "on-track",
    startDateLabel: "Jun 13",
    startInDays: 1,
    recruiter: "Lena Ortiz",
    onboarder: "Riya Kim",
    progress: 96,
    lastActivity: "15m ago",
    email: "evelyn.mwangi@example.com",
    phone: "+1 (713) 555-0166",
    tags: ["Ready"],
  },
  {
    id: "tom-aldridge",
    name: "Tom Aldridge",
    role: "Solutions Architect",
    client: "Cobalt Systems",
    employmentType: "C2C",
    location: "Remote · London",
    stage: "Day 1 Prep",
    status: "in-review",
    risk: "on-track",
    startDateLabel: "Jun 14",
    startInDays: 2,
    recruiter: "Aaron Flores",
    onboarder: "Sasha Patel",
    progress: 92,
    lastActivity: "45m ago",
    email: "tom.aldridge@example.com",
    phone: "+44 20 5555 0177",
    tags: ["Final check"],
    vendor: "Apex Staffing Partners",
  },
  {
    id: "kira-andersen",
    name: "Kira Andersen",
    role: "Pharmacy Technician",
    client: "Meridian Health",
    employmentType: "W-2",
    location: "Onsite · Houston, TX",
    stage: "Training",
    status: "on-track",
    risk: "on-track",
    startDateLabel: "Jul 02",
    startInDays: 20,
    recruiter: "Lena Ortiz",
    onboarder: "Riya Kim",
    progress: 81,
    lastActivity: "3h ago",
    email: "kira.andersen@example.com",
    phone: "+1 (713) 555-0192",
    tags: [],
  },
];

const ALL_CANDIDATES: CandidateSummary[] = [...CANDIDATES, ...EXTRA_CANDIDATES];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Days the candidate has been parked in their current stage (mock). */
function daysInStage(c: CandidateSummary): number {
  // Derive deterministically from id length + progress so it's stable per row.
  const base = (c.id.length * 3 + (100 - c.progress)) % 12;
  return Math.max(0, base);
}

function daysInStageTone(d: number): "success" | "warning" | "danger" {
  if (d <= 3) return "success";
  if (d <= 7) return "warning";
  return "danger";
}

/** Short next-action label inferred from status + tags (§41.1). */
function miniNextAction(c: CandidateSummary): string {
  if (c.tags.includes("Rejected ID")) return "Doc rejected — review";
  if (c.tags.includes("Missing direct deposit")) return "Awaiting direct deposit";
  if (c.tags.includes("Payroll sync failed")) return "Retry payroll sync";
  if (c.tags.includes("Awaiting vendor MSA")) return "Awaiting vendor MSA";
  if (c.tags.includes("Package awaiting client approval"))
    return "Awaiting client approval";
  if (c.tags.includes("Shipping delayed")) return "Equipment delayed";
  if (c.stage === "Background Check") return "Awaiting BG check";
  switch (c.status) {
    case "needs-attention":
      return "Needs your review";
    case "at-risk":
      return "Escalated — at risk";
    case "waiting-external":
      return "Waiting on external";
    case "in-review":
      return "In review";
    case "ai-pending":
      return "AI recommendation";
    default:
      return "On track";
  }
}

type FilterChip = "all" | "at-risk" | "starting-soon" | "stalled";

function matchesChip(c: CandidateSummary, chip: FilterChip): boolean {
  switch (chip) {
    case "at-risk":
      return c.risk === "at-risk" || c.risk === "unlikely";
    case "starting-soon":
      return c.startInDays <= 7;
    case "stalled":
      return daysInStage(c) > 7;
    default:
      return true;
  }
}

// ---------------------------------------------------------------------------
// Day -14 → Day +30 timeline math
// ---------------------------------------------------------------------------

const TIMELINE_MIN = -14;
const TIMELINE_MAX = 30;
const TIMELINE_SPAN = TIMELINE_MAX - TIMELINE_MIN;

function timelinePct(startInDays: number): number {
  const clamped = Math.max(TIMELINE_MIN, Math.min(TIMELINE_MAX, startInDays));
  return ((clamped - TIMELINE_MIN) / TIMELINE_SPAN) * 100;
}

const TIMELINE_TICKS = [-14, -7, 0, 7, 14, 21, 30];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function OnboardingPage() {
  const [query, setQuery] = useState("");
  const [chip, setChip] = useState<FilterChip>("all");

  // Active onboardings = everything except already-completed offer-accepted-only
  const active = useMemo(
    () =>
      ALL_CANDIDATES.filter(
        (c) => !["offer-accepted"].includes(c.status ?? ""),
      ),
    [],
  );

  // ── Vitals ─────────────────────────────────────────────────────────────
  const startingSoon = active.filter((c) => c.startInDays <= 7).length;
  const atRisk = active.filter(
    (c) => c.risk === "at-risk" || c.risk === "unlikely",
  ).length;
  const startingThisMonth = active.filter(
    (c) => c.startInDays >= 0 && c.startInDays <= 30,
  ).length;
  // Mock: "completed this week" — derive from very high progress.
  const completedThisWeek = active.filter((c) => c.progress >= 90).length;

  // ── Filter ─────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return active.filter((c) => {
      if (!matchesChip(c, chip)) return false;
      if (!q) return true;
      return [c.name, c.role, c.client, c.stage, c.recruiter, c.onboarder]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [active, chip, query]);

  // ── Per-stage buckets ──────────────────────────────────────────────────
  const byStage = useMemo(() => {
    const map = new Map<Stage, CandidateSummary[]>();
    for (const s of PIPELINE_STAGES) map.set(s, []);
    for (const c of filtered) {
      const s = normalizeStage(c.stage);
      map.get(s)!.push(c);
    }
    // Within each column, surface most urgent first.
    for (const list of map.values()) {
      list.sort((a, b) => {
        const riskRank: Record<string, number> = {
          unlikely: 3,
          "at-risk": 2,
          "needs-attention": 1,
          "on-track": 0,
        };
        const rd = (riskRank[b.risk] ?? 0) - (riskRank[a.risk] ?? 0);
        if (rd !== 0) return rd;
        return a.startInDays - b.startInDays;
      });
    }
    return map;
  }, [filtered]);

  const avgDaysByStage = useMemo(() => {
    const out = new Map<Stage, number>();
    for (const s of PIPELINE_STAGES) {
      const list = byStage.get(s) ?? [];
      if (list.length === 0) {
        out.set(s, 0);
        continue;
      }
      const sum = list.reduce((acc, c) => acc + daysInStage(c), 0);
      out.set(s, Math.round(sum / list.length));
    }
    return out;
  }, [byStage]);

  // ── AI summary (§41.4) ─────────────────────────────────────────────────
  const stagesWithPeople = PIPELINE_STAGES.filter(
    (s) => (byStage.get(s) ?? []).length > 0,
  ).length;

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="Onboarding Pipeline"
        description="Active onboardings from Day -14 through Day 1 readiness (§14)."
        actions={<InitiateOnboardingSheet />}
      />

      {/* ── AI summary banner (§41.4) ─────────────────────────────────── */}
      <section className="from-ai-muted/40 via-ai-muted/20 relative overflow-hidden rounded-xl border bg-gradient-to-r to-transparent p-4 shadow-xs">
        <div className="flex items-start gap-3">
          <span className="bg-ai-muted text-ai-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
            <Sparkles className="size-4.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-card-heading">AI pipeline briefing</p>
            <p className="text-muted-foreground mt-0.5 text-sm leading-relaxed">
              Pipeline has{" "}
              <span className="text-foreground font-semibold tabular-nums">
                {active.length}
              </span>{" "}
              candidates across{" "}
              <span className="text-foreground font-semibold tabular-nums">
                {stagesWithPeople}
              </span>{" "}
              stages.{" "}
              <span className="text-foreground font-semibold tabular-nums">
                {startingSoon}
              </span>{" "}
              start this week, and{" "}
              <span
                className={cn(
                  "font-semibold tabular-nums",
                  atRisk > 0 ? "text-danger" : "text-foreground",
                )}
              >
                {atRisk}
              </span>{" "}
              {atRisk === 1 ? "is" : "are"} at risk.{" "}
              {atRisk > 0
                ? "Review the at-risk column first — start dates are exposed."
                : "Pipeline is healthy. Focus reviews on stages with the longest avg time."}
            </p>
          </div>
        </div>
      </section>

      {/* ── Vitals tiles ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile
          icon={ClipboardList}
          label="Active"
          value={active.length}
        />
        <StatTile
          icon={CalendarClock}
          label="Starting ≤7d"
          value={startingSoon}
          tone="info"
        />
        <StatTile
          icon={TriangleAlert}
          label="At risk"
          value={atRisk}
          tone="danger"
        />
        <StatTile
          icon={CalendarClock}
          label="Starting this month"
          value={startingThisMonth}
        />
        <StatTile
          icon={CheckCircle2}
          label="Completed this week"
          value={completedThisWeek}
          tone="success"
        />
      </div>

      {/* ── Filters bar ───────────────────────────────────────────────── */}
      <section className="bg-card flex flex-wrap items-center gap-2 rounded-xl border p-2.5 shadow-xs">
        <div className="bg-muted/60 focus-within:ring-ring flex h-8 w-full items-center gap-2 rounded-md border px-2.5 sm:w-72 focus-within:ring-2">
          <Search className="text-muted-foreground size-3.5" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search candidate, client, role…"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear search">
              <X className="text-muted-foreground hover:text-foreground size-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <FilterChipButton
            active={chip === "all"}
            onClick={() => setChip("all")}
            count={active.length}
          >
            All
          </FilterChipButton>
          <FilterChipButton
            active={chip === "at-risk"}
            onClick={() => setChip("at-risk")}
            count={atRisk}
            icon={TriangleAlert}
            tone="danger"
          >
            At risk
          </FilterChipButton>
          <FilterChipButton
            active={chip === "starting-soon"}
            onClick={() => setChip("starting-soon")}
            count={startingSoon}
            icon={CalendarClock}
            tone="info"
          >
            Starting soon
          </FilterChipButton>
          <FilterChipButton
            active={chip === "stalled"}
            onClick={() => setChip("stalled")}
            count={active.filter((c) => daysInStage(c) > 7).length}
            icon={TimerReset}
            tone="warning"
          >
            Stalled &gt;7d
          </FilterChipButton>
        </div>

        <span className="text-muted-foreground ml-auto whitespace-nowrap text-xs tabular-nums">
          {filtered.length} shown
        </span>
      </section>

      {/* ── Kanban pipeline ───────────────────────────────────────────── */}
      <section className="flex flex-col gap-2">
        <div className="flex items-end justify-between">
          <h2 className="text-section-heading">Pipeline by stage</h2>
          <p className="text-muted-foreground text-xs">
            Cards sorted by risk, then start date. Scroll horizontally for all 8
            stages.
          </p>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {PIPELINE_STAGES.map((stage) => {
            const rows = byStage.get(stage) ?? [];
            const avg = avgDaysByStage.get(stage) ?? 0;
            return (
              <div
                key={stage}
                className="bg-muted/30 flex w-72 shrink-0 flex-col gap-2 rounded-lg p-3"
              >
                {/* Column header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        aria-hidden
                        className={cn(
                          "inline-block size-2 shrink-0 rounded-full",
                          STAGE_ACCENT[stage],
                        )}
                      />
                      <span className="text-card-heading truncate">
                        {stage}
                      </span>
                    </div>
                    <p className="text-metadata mt-0.5">
                      {rows.length === 0
                        ? "Empty"
                        : `avg ${avg}d in stage`}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "bg-card flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full border px-1.5 text-xs font-semibold tabular-nums",
                      rows.length === 0 && "text-muted-foreground/60",
                    )}
                  >
                    {rows.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2">
                  {rows.length === 0 && (
                    <div className="text-muted-foreground/70 flex flex-col items-center gap-1.5 rounded-md border border-dashed py-6 text-center text-xs">
                      <CircleDashed className="size-4 opacity-70" />
                      No candidates
                    </div>
                  )}
                  {rows.map((c) => (
                    <CandidateCard key={c.id} candidate={c} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Day -14 → Day +30 timeline (§14) ──────────────────────────── */}
      <section className="bg-card flex flex-col gap-4 rounded-xl border p-4 shadow-xs">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-section-heading">Lifecycle timeline</h2>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Day -14 (pre-boarding) → Day 0 (start) → Day +30 (ramp-up).
              Each dot is a candidate positioned by their start date.
            </p>
          </div>
          <div className="text-muted-foreground flex items-center gap-3 text-xs">
            <LegendDot tone="success" label="On track" />
            <LegendDot tone="warning" label="Needs attention" />
            <LegendDot tone="danger" label="At risk" />
          </div>
        </div>

        <LifecycleTimeline candidates={filtered} />
      </section>
    </PageContainer>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CandidateCard({ candidate: c }: { candidate: CandidateSummary }) {
  const days = daysInStage(c);
  const tone = daysInStageTone(days);
  const action = miniNextAction(c);
  const initials = c.name
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <Link
      href={`/candidates/${c.id}`}
      className="group bg-card hover:border-primary/40 hover:bg-card relative flex flex-col gap-2 rounded-lg border p-2.5 shadow-xs transition-colors"
    >
      {/* Top: name + risk */}
      <div className="flex items-start gap-2">
        <span className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="group-hover:text-primary truncate text-sm font-medium leading-tight">
            {c.name}
          </p>
          <p className="text-metadata truncate">{c.role}</p>
        </div>
        <ChevronRight className="text-muted-foreground/60 group-hover:text-primary mt-0.5 size-3.5 shrink-0" />
      </div>

      {/* Client */}
      <p className="text-muted-foreground truncate text-xs">{c.client}</p>

      {/* Mini action */}
      <p className="text-foreground/80 truncate text-xs leading-snug">
        {action}
      </p>

      {/* Footer: days in stage + risk badge */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
            tone === "success" &&
              "bg-success-muted text-success-muted-foreground",
            tone === "warning" &&
              "bg-warning-muted text-warning-muted-foreground",
            tone === "danger" &&
              "bg-danger-muted text-danger-muted-foreground",
          )}
        >
          <TimerReset className="size-3" />
          {days}d in stage
        </span>
        <RiskBadge level={c.risk} className="px-1.5 py-0 text-[10px]" />
      </div>
    </Link>
  );
}

function FilterChipButton({
  active,
  onClick,
  children,
  count,
  icon: Icon,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count: number;
  icon?: typeof TriangleAlert;
  tone?: "danger" | "warning" | "info";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors",
        active
          ? "bg-primary/10 border-primary/30 text-primary"
          : "bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground",
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            "size-3.5",
            !active && tone === "danger" && "text-danger",
            !active && tone === "warning" && "text-warning",
            !active && tone === "info" && "text-info",
          )}
        />
      )}
      <span>{children}</span>
      <span
        className={cn(
          "tabular-nums",
          active ? "text-primary" : "text-muted-foreground/80",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function LegendDot({
  tone,
  label,
}: {
  tone: "success" | "warning" | "danger";
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden
        className={cn(
          "inline-block size-2 rounded-full",
          tone === "success" && "bg-success",
          tone === "warning" && "bg-warning",
          tone === "danger" && "bg-danger",
        )}
      />
      {label}
    </span>
  );
}

function LifecycleTimeline({
  candidates,
}: {
  candidates: CandidateSummary[];
}) {
  // Bucket candidates into rough vertical lanes so dots don't overlap when
  // multiple share the same start date.
  const positioned = useMemo(() => {
    // Group by clamped day, then within a group assign lane indices.
    const groups = new Map<number, CandidateSummary[]>();
    for (const c of candidates) {
      const k = Math.max(TIMELINE_MIN, Math.min(TIMELINE_MAX, c.startInDays));
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(c);
    }
    const out: { c: CandidateSummary; left: number; lane: number }[] = [];
    for (const [k, list] of groups) {
      list.forEach((c, i) => {
        out.push({
          c,
          left: ((k - TIMELINE_MIN) / TIMELINE_SPAN) * 100,
          lane: i,
        });
      });
    }
    return out;
  }, [candidates]);

  const maxLane = positioned.reduce((m, p) => Math.max(m, p.lane), 0);
  // Reserve enough vertical space for stacked dots (each ~22px tall).
  const trackHeight = 56 + maxLane * 22;

  return (
    <div className="select-none">
      {/* Track */}
      <div
        className="relative"
        style={{ height: trackHeight }}
      >
        {/* Tick lines */}
        {TIMELINE_TICKS.map((t) => {
          const left = timelinePct(t);
          const isToday = t === 0;
          return (
            <div
              key={t}
              className={cn(
                "absolute top-0 bottom-6 w-px",
                isToday ? "bg-primary/60" : "bg-border",
              )}
              style={{ left: `${left}%` }}
            />
          );
        })}

        {/* "Today" highlight column */}
        <div
          className="bg-primary/5 absolute top-0 bottom-6 rounded-sm"
          style={{
            left: `${timelinePct(-0.5)}%`,
            width: `${timelinePct(0.5) - timelinePct(-0.5)}%`,
          }}
        />

        {/* Candidate dots */}
        {positioned.map(({ c, left, lane }) => {
          const tone =
            c.risk === "at-risk" || c.risk === "unlikely"
              ? "danger"
              : c.risk === "needs-attention"
                ? "warning"
                : "success";
          const top = 8 + lane * 22;
          return (
            <Link
              key={c.id}
              href={`/candidates/${c.id}`}
              className="group absolute -translate-x-1/2"
              style={{ left: `${left}%`, top }}
              title={`${c.name} · ${c.client} · starts ${c.startDateLabel} (${
                c.startInDays >= 0 ? `+${c.startInDays}` : c.startInDays
              }d)`}
            >
              <span
                className={cn(
                  "ring-card hover:ring-primary/40 block size-3 rounded-full ring-2 transition-all hover:scale-150",
                  tone === "success" && "bg-success",
                  tone === "warning" && "bg-warning",
                  tone === "danger" && "bg-danger",
                )}
              />
              <span className="bg-popover text-popover-foreground pointer-events-none absolute top-5 left-1/2 z-10 hidden -translate-x-1/2 rounded-md border px-2 py-1 text-xs shadow-md group-hover:block whitespace-nowrap">
                <span className="font-medium">{c.name}</span>
                <span className="text-muted-foreground"> · {c.client}</span>
                <span className="text-muted-foreground">
                  {" "}
                  · {c.startDateLabel}
                </span>
              </span>
            </Link>
          );
        })}

        {/* Tick labels */}
        <div className="absolute right-0 bottom-0 left-0 h-5">
          {TIMELINE_TICKS.map((t) => {
            const left = timelinePct(t);
            const label =
              t === 0 ? "Today" : t > 0 ? `Day +${t}` : `Day ${t}`;
            return (
              <span
                key={t}
                className={cn(
                  "text-metadata absolute -translate-x-1/2 whitespace-nowrap",
                  t === 0 && "text-primary font-semibold",
                )}
                style={{ left: `${left}%` }}
              >
                {label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Footer summary */}
      {candidates.length === 0 ? (
        <div className="text-muted-foreground mt-4 flex items-center justify-center gap-2 rounded-md border border-dashed py-6 text-sm">
          <AlertOctagon className="size-4" />
          No candidates match the current filters.
        </div>
      ) : (
        <p className="text-muted-foreground mt-3 text-xs">
          Showing{" "}
          <span className="text-foreground font-medium tabular-nums">
            {candidates.length}
          </span>{" "}
          candidate{candidates.length === 1 ? "" : "s"} on the timeline. Dots
          before Day 0 are pre-boarding; after Day 0 are ramp-up.
        </p>
      )}
    </div>
  );
}
