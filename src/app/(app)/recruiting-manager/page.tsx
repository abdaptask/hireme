"use client";

import { useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Clock,
  Gauge,
  MessageSquarePlus,
  Minus,
  TrendingDown,
  TrendingUp,
  Users,
  UsersRound,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { LaunchpadSection } from "@/components/launchpad/launchpad-section";
import { LAUNCHPADS } from "@/lib/launchpad";
import { StatTile } from "@/components/workspace/stat-tile";
import { WidgetCard, BarList } from "@/components/dashboard/widgets";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/* ─── Static data ─────────────────────────────────────────────────────────── */

type WorkloadStatus = "green" | "amber" | "red";

type RecruiterRow = {
  name: string;
  initials: string;
  active: number;
  startingSoon: number;
  atRisk: number;
  avgProgress: number;
  satisfaction: number;
  status: WorkloadStatus;
};

const RECRUITERS: RecruiterRow[] = [
  {
    name: "Devon Hughes",
    initials: "DH",
    active: 7,
    startingSoon: 2,
    atRisk: 2,
    avgProgress: 65,
    satisfaction: 4.6,
    status: "amber",
  },
  {
    name: "Marcus Chen",
    initials: "MC",
    active: 6,
    startingSoon: 1,
    atRisk: 1,
    avgProgress: 72,
    satisfaction: 4.8,
    status: "green",
  },
  {
    name: "Priya Kapoor",
    initials: "PK",
    active: 9,
    startingSoon: 3,
    atRisk: 2,
    avgProgress: 55,
    satisfaction: 4.2,
    status: "red",
  },
  {
    name: "Tyler Brooks",
    initials: "TB",
    active: 4,
    startingSoon: 0,
    atRisk: 0,
    avgProgress: 81,
    satisfaction: 4.9,
    status: "green",
  },
  {
    name: "Aisha Crawford",
    initials: "AC",
    active: 5,
    startingSoon: 2,
    atRisk: 1,
    avgProgress: 68,
    satisfaction: 4.5,
    status: "green",
  },
];

type BottleneckRow = {
  stage: string;
  count: number;
  avgDays: number;
  slaDays: number;
};

const BOTTLENECKS: BottleneckRow[] = [
  { stage: "Document Submission", count: 8, avgDays: 4.2, slaDays: 5 },
  { stage: "Background Check", count: 5, avgDays: 7.8, slaDays: 5 },
  { stage: "Client Requirements", count: 4, avgDays: 2.1, slaDays: 4 },
  { stage: "Tax & Payroll", count: 3, avgDays: 1.9, slaDays: 3 },
  { stage: "IT Provisioning", count: 4, avgDays: 3.2, slaDays: 4 },
  { stage: "Day 1 Prep", count: 2, avgDays: 0.8, slaDays: 2 },
];

type PipelineCandidate = {
  name: string;
  client: string;
  recruiter: string;
  stage: string;
  risk: "critical" | "at-risk" | "needs-attention" | "on-track";
  startDate: string;
  daysRemaining: number;
};

const PIPELINE: PipelineCandidate[] = [
  {
    name: "Sarah Okafor",
    client: "TechNova",
    recruiter: "Priya Kapoor",
    stage: "Background Check",
    risk: "critical",
    startDate: "Jun 10",
    daysRemaining: 3,
  },
  {
    name: "James Whitfield",
    client: "Apex Systems",
    recruiter: "Devon Hughes",
    stage: "Document Submission",
    risk: "critical",
    startDate: "Jun 11",
    daysRemaining: 4,
  },
  {
    name: "Lena Torres",
    client: "GlobalCorp",
    recruiter: "Devon Hughes",
    stage: "Client Requirements",
    risk: "at-risk",
    startDate: "Jun 13",
    daysRemaining: 6,
  },
  {
    name: "Raj Mehta",
    client: "TechNova",
    recruiter: "Priya Kapoor",
    stage: "IT Provisioning",
    risk: "at-risk",
    startDate: "Jun 14",
    daysRemaining: 7,
  },
  {
    name: "Chloe Benson",
    client: "NovaTech",
    recruiter: "Aisha Crawford",
    stage: "Tax & Payroll",
    risk: "at-risk",
    startDate: "Jun 15",
    daysRemaining: 8,
  },
  {
    name: "Marcus Owens",
    client: "Apex Systems",
    recruiter: "Marcus Chen",
    stage: "Document Submission",
    risk: "needs-attention",
    startDate: "Jun 17",
    daysRemaining: 10,
  },
  {
    name: "Diana Patel",
    client: "GlobalCorp",
    recruiter: "Priya Kapoor",
    stage: "Background Check",
    risk: "needs-attention",
    startDate: "Jun 18",
    daysRemaining: 11,
  },
  {
    name: "Ethan Ko",
    client: "TechNova",
    recruiter: "Tyler Brooks",
    stage: "Training",
    risk: "on-track",
    startDate: "Jun 20",
    daysRemaining: 13,
  },
  {
    name: "Fatima Hassan",
    client: "NovaTech",
    recruiter: "Marcus Chen",
    stage: "Day 1 Prep",
    risk: "on-track",
    startDate: "Jun 21",
    daysRemaining: 14,
  },
  {
    name: "Omar Yusuf",
    client: "Apex Systems",
    recruiter: "Tyler Brooks",
    stage: "IT Provisioning",
    risk: "on-track",
    startDate: "Jun 22",
    daysRemaining: 15,
  },
];

type ScorecardData = RecruiterRow & {
  completed: number;
  avgTimeToOnboard: number;
  dropOffRate: number;
  startDateSuccess: number;
  handoffQuality: number;
  coachingFlag?: string;
};

const SCORECARDS: ScorecardData[] = [
  {
    ...RECRUITERS[0],
    completed: 18,
    avgTimeToOnboard: 10.2,
    dropOffRate: 5.6,
    startDateSuccess: 92,
    handoffQuality: 94,
    coachingFlag: "2 at-risk candidates this week — follow up recommended",
  },
  {
    ...RECRUITERS[1],
    completed: 22,
    avgTimeToOnboard: 10.8,
    dropOffRate: 6.1,
    startDateSuccess: 89,
    handoffQuality: 96,
  },
  {
    ...RECRUITERS[2],
    completed: 15,
    avgTimeToOnboard: 13.1,
    dropOffRate: 12.4,
    startDateSuccess: 81,
    handoffQuality: 87,
    coachingFlag:
      "Drop-off rate 12.4% — above threshold. 2-month trend upward.",
  },
  {
    ...RECRUITERS[3],
    completed: 24,
    avgTimeToOnboard: 9.6,
    dropOffRate: 4.2,
    startDateSuccess: 96,
    handoffQuality: 98,
  },
  {
    ...RECRUITERS[4],
    completed: 19,
    avgTimeToOnboard: 11.9,
    dropOffRate: 7.8,
    startDateSuccess: 85,
    handoffQuality: 91,
  },
];

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

const TEAM_AVG = {
  avgTimeToOnboard: 11.4,
  dropOffRate: 8.2,
  satisfaction: 4.4,
  startDateSuccess: 87,
};

const CAPACITY_MAX = 10;

const workloadBadge: Record<
  WorkloadStatus,
  { label: string; classes: string }
> = {
  green: {
    label: "Healthy",
    classes: "bg-success/10 text-success-muted-foreground",
  },
  amber: {
    label: "Approaching Limit",
    classes: "bg-warning/10 text-warning-muted-foreground",
  },
  red: {
    label: "Overloaded",
    classes: "bg-danger/10 text-danger-muted-foreground",
  },
};

const riskConfig: Record<
  PipelineCandidate["risk"],
  { label: string; rowClass: string; badgeClass: string }
> = {
  critical: {
    label: "Critical",
    rowClass: "bg-danger/5 border-l-2 border-danger",
    badgeClass: "bg-danger/10 text-danger-muted-foreground",
  },
  "at-risk": {
    label: "At Risk",
    rowClass: "bg-warning/5 border-l-2 border-warning",
    badgeClass: "bg-warning/10 text-warning-muted-foreground",
  },
  "needs-attention": {
    label: "Needs Attention",
    rowClass: "",
    badgeClass: "bg-info/10 text-info-muted-foreground",
  },
  "on-track": {
    label: "On Track",
    rowClass: "",
    badgeClass: "bg-success/10 text-success-muted-foreground",
  },
};

type CompareArrowProps = {
  value: number;
  avg: number;
  lowerIsBetter?: boolean;
};

function CompareArrow({ value, avg, lowerIsBetter = false }: CompareArrowProps) {
  const diff = value - avg;
  if (Math.abs(diff) < 0.01)
    return <Minus className="size-3 text-muted-foreground inline" />;
  const isBetter = lowerIsBetter ? diff < 0 : diff > 0;
  return isBetter ? (
    <ChevronDown className="size-3 text-success-muted-foreground inline" />
  ) : (
    <ChevronUp className="size-3 text-danger-muted-foreground inline" />
  );
}

/* ─── Sub-components ──────────────────────────────────────────────────────── */

function AISummaryBanner() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-ai/20 bg-ai/5 px-4 py-3">
      <Bot className="mt-0.5 size-4 shrink-0 text-ai-muted-foreground" />
      <p className="text-sm text-foreground/80">
        <span className="font-medium text-foreground">AI Briefing —</span>{" "}
        Team throughput is up{" "}
        <span className="font-medium text-success-muted-foreground">15%</span>{" "}
        vs last week. Drop-off rate improved to{" "}
        <span className="font-medium">8.2%</span>. Devon Hughes has{" "}
        <span className="font-medium text-warning-muted-foreground">
          2 at-risk candidates
        </span>{" "}
        — review recommended.{" "}
        <span className="font-medium text-danger-muted-foreground">
          3 start dates at risk
        </span>{" "}
        across the team.
      </p>
    </div>
  );
}

function RecruiterHeatmapRow({ r }: { r: RecruiterRow }) {
  const badge = workloadBadge[r.status];
  const pct = (r.active / CAPACITY_MAX) * 100;
  return (
    <tr className="group border-b last:border-0">
      <td className="py-2.5 pr-4">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
              r.status === "red"
                ? "bg-danger/10 text-danger-muted-foreground"
                : r.status === "amber"
                  ? "bg-warning/10 text-warning-muted-foreground"
                  : "bg-success/10 text-success-muted-foreground",
            )}
          >
            {r.initials}
          </span>
          <span className="text-sm font-medium whitespace-nowrap">
            {r.name}
          </span>
        </div>
      </td>
      <td className="py-2.5 pr-4">
        <div className="flex items-center gap-2">
          <div className="bg-muted relative h-1.5 w-20 overflow-hidden rounded-full">
            <div
              className={cn(
                "absolute inset-y-0 left-0 rounded-full",
                r.status === "red"
                  ? "bg-danger"
                  : r.status === "amber"
                    ? "bg-warning"
                    : "bg-success",
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-sm tabular-nums">{r.active}</span>
        </div>
      </td>
      <td className="py-2.5 pr-4 text-center text-sm tabular-nums">
        {r.startingSoon > 0 ? (
          <span className="text-warning-muted-foreground font-medium">
            {r.startingSoon}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="py-2.5 pr-4 text-center text-sm tabular-nums">
        {r.atRisk > 0 ? (
          <span className="text-danger-muted-foreground font-medium">
            {r.atRisk}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="py-2.5 pr-4">
        <div className="flex items-center gap-2">
          <div className="bg-muted relative h-1.5 w-16 overflow-hidden rounded-full">
            <div
              className="bg-info absolute inset-y-0 left-0 rounded-full"
              style={{ width: `${r.avgProgress}%` }}
            />
          </div>
          <span className="text-muted-foreground text-xs tabular-nums">
            {r.avgProgress}%
          </span>
        </div>
      </td>
      <td className="py-2.5 pr-4 text-center text-sm tabular-nums">
        {r.satisfaction}
        <span className="text-muted-foreground text-xs">/5</span>
      </td>
      <td className="py-2.5 pr-4">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
            badge.classes,
          )}
        >
          {badge.label}
        </span>
      </td>
      <td className="py-2.5">
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button variant="ghost" size="xs">
            View roster
          </Button>
          <Button variant="ghost" size="xs">
            <MessageSquarePlus className="size-3" />
            Coach
          </Button>
        </div>
      </td>
    </tr>
  );
}

function BottleneckRow({ b }: { b: BottleneckRow }) {
  const overSLA = b.avgDays > b.slaDays;
  const maxCount = Math.max(...BOTTLENECKS.map((x) => x.count), 1);
  return (
    <li className="flex items-center gap-3 py-1.5">
      <span className="w-40 shrink-0 truncate text-sm">{b.stage}</span>
      <div className="bg-muted relative h-2 flex-1 overflow-hidden rounded-full">
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full",
            overSLA ? "bg-danger" : "bg-info",
          )}
          style={{ width: `${Math.max((b.count / maxCount) * 100, 4)}%` }}
        />
      </div>
      <span className="text-muted-foreground w-6 shrink-0 text-right text-xs tabular-nums">
        {b.count}
      </span>
      <span
        className={cn(
          "w-28 shrink-0 text-right text-xs tabular-nums",
          overSLA
            ? "text-danger-muted-foreground font-medium"
            : "text-muted-foreground",
        )}
      >
        avg {b.avgDays}d
        {overSLA && (
          <span className="ml-1 rounded bg-danger/10 px-1 py-px text-[10px] font-semibold">
            SLA
          </span>
        )}
      </span>
    </li>
  );
}

type RiskGroup = {
  label: string;
  risk: PipelineCandidate["risk"];
};

const RISK_GROUPS: RiskGroup[] = [
  { label: "Critical", risk: "critical" },
  { label: "At Risk", risk: "at-risk" },
  { label: "Needs Attention", risk: "needs-attention" },
  { label: "On Track", risk: "on-track" },
];

function PipelineTable() {
  return (
    <div className="flex flex-col gap-5">
      {RISK_GROUPS.map(({ label, risk }) => {
        const candidates = PIPELINE.filter((c) => c.risk === risk);
        if (candidates.length === 0) return null;
        const cfg = riskConfig[risk];
        return (
          <div key={risk}>
            <div className="mb-2 flex items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-semibold",
                  cfg.badgeClass,
                )}
              >
                {label}
              </span>
              <span className="text-muted-foreground text-xs">
                {candidates.length} candidate{candidates.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="bg-card overflow-hidden rounded-xl border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="text-data-label px-4 py-2 font-medium">
                      Candidate
                    </th>
                    <th className="text-data-label px-4 py-2 font-medium">
                      Client
                    </th>
                    <th className="text-data-label px-4 py-2 font-medium">
                      Recruiter
                    </th>
                    <th className="text-data-label px-4 py-2 font-medium">
                      Stage
                    </th>
                    <th className="text-data-label px-4 py-2 font-medium">
                      Start Date
                    </th>
                    <th className="text-data-label px-4 py-2 font-medium">
                      Days Left
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c) => (
                    <tr
                      key={c.name}
                      className={cn(
                        "border-b last:border-0 transition-colors hover:bg-muted/40",
                        cfg.rowClass,
                      )}
                    >
                      <td className="px-4 py-2.5 font-medium">{c.name}</td>
                      <td className="text-muted-foreground px-4 py-2.5">
                        {c.client}
                      </td>
                      <td className="text-muted-foreground px-4 py-2.5">
                        {c.recruiter}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-muted-foreground text-xs">
                          {c.stage}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">{c.startDate}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={cn(
                            "inline-flex h-5 items-center rounded-full px-2 text-xs font-semibold tabular-nums",
                            c.daysRemaining <= 5
                              ? "bg-danger/10 text-danger-muted-foreground"
                              : c.daysRemaining <= 10
                                ? "bg-warning/10 text-warning-muted-foreground"
                                : "bg-muted text-muted-foreground",
                          )}
                        >
                          {c.daysRemaining}d
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

type MetricDeltaProps = {
  label: string;
  value: string;
  avg: string;
  better: boolean;
};

function MetricDelta({ label, value, avg, better }: MetricDeltaProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-metadata">{label}</p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
      <p
        className={cn(
          "flex items-center gap-0.5 text-xs",
          better
            ? "text-success-muted-foreground"
            : "text-danger-muted-foreground",
        )}
      >
        {better ? (
          <TrendingDown className="size-3" />
        ) : (
          <TrendingUp className="size-3" />
        )}
        vs {avg} avg
      </p>
    </div>
  );
}

function ScorecardCard({ s }: { s: ScorecardData }) {
  const timeBetter = s.avgTimeToOnboard < TEAM_AVG.avgTimeToOnboard;
  const dropBetter = s.dropOffRate < TEAM_AVG.dropOffRate;
  const satBetter = s.satisfaction > TEAM_AVG.satisfaction;
  const startBetter = s.startDateSuccess > TEAM_AVG.startDateSuccess;
  const badge = workloadBadge[s.status];

  return (
    <div className="bg-card flex flex-col gap-4 rounded-xl border p-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
              s.status === "red"
                ? "bg-danger/10 text-danger-muted-foreground"
                : s.status === "amber"
                  ? "bg-warning/10 text-warning-muted-foreground"
                  : "bg-success/10 text-success-muted-foreground",
            )}
          >
            {s.initials}
          </span>
          <div>
            <p className="font-semibold">{s.name}</p>
            <p className="text-metadata">
              {s.active} active · {s.completed} completed MTD
            </p>
          </div>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            badge.classes,
          )}
        >
          {badge.label}
        </span>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
        <MetricDelta
          label="Avg time-to-onboard"
          value={`${s.avgTimeToOnboard}d`}
          avg={`${TEAM_AVG.avgTimeToOnboard}d`}
          better={timeBetter}
        />
        <MetricDelta
          label="Drop-off rate"
          value={`${s.dropOffRate}%`}
          avg={`${TEAM_AVG.dropOffRate}%`}
          better={dropBetter}
        />
        <MetricDelta
          label="Candidate satisfaction"
          value={`${s.satisfaction}/5`}
          avg={`${TEAM_AVG.satisfaction}/5`}
          better={satBetter}
        />
        <MetricDelta
          label="Start-date success"
          value={`${s.startDateSuccess}%`}
          avg={`${TEAM_AVG.startDateSuccess}%`}
          better={startBetter}
        />
        <MetricDelta
          label="Handoff quality"
          value={`${s.handoffQuality}%`}
          avg="90%"
          better={s.handoffQuality >= 90}
        />
        <div className="flex flex-col gap-0.5">
          <p className="text-metadata">At risk</p>
          <p
            className={cn(
              "text-sm font-semibold",
              s.atRisk > 0
                ? "text-danger-muted-foreground"
                : "text-muted-foreground",
            )}
          >
            {s.atRisk > 0 ? `${s.atRisk} candidates` : "None"}
          </p>
        </div>
      </div>

      {/* Coaching flag */}
      {s.coachingFlag && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning-muted-foreground" />
          <p className="text-xs text-warning-muted-foreground">
            {s.coachingFlag}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          View roster
        </Button>
        <Button variant="ghost" size="sm">
          <MessageSquarePlus className="size-3.5" />
          Coaching note
        </Button>
      </div>
    </div>
  );
}

function ForecastTab() {
  return (
    <div className="flex flex-col gap-5">
      {/* Week 1 */}
      <WidgetCard
        title="Week 1 — Jun 8–14"
        description="4 starts planned"
        action={<CalendarClock className="text-muted-foreground size-4" />}
      >
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center rounded-lg bg-success/10 p-3">
            <p className="text-2xl font-bold text-success-muted-foreground">
              2
            </p>
            <p className="text-metadata mt-0.5 text-center">Confirmed</p>
          </div>
          <div className="flex flex-col items-center rounded-lg bg-danger/10 p-3">
            <p className="text-2xl font-bold text-danger-muted-foreground">
              2
            </p>
            <p className="text-metadata mt-0.5 text-center">At Risk</p>
          </div>
          <div className="flex flex-col items-center rounded-lg bg-muted p-3">
            <p className="text-2xl font-bold">4</p>
            <p className="text-metadata mt-0.5 text-center">Total Planned</p>
          </div>
        </div>
      </WidgetCard>

      {/* Week 2 */}
      <WidgetCard
        title="Week 2 — Jun 15–21"
        description="6 starts planned"
        action={<CalendarClock className="text-muted-foreground size-4" />}
      >
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center rounded-lg bg-success/10 p-3">
            <p className="text-2xl font-bold text-success-muted-foreground">
              3
            </p>
            <p className="text-metadata mt-0.5 text-center">Confirmed</p>
          </div>
          <div className="flex flex-col items-center rounded-lg bg-warning/10 p-3">
            <p className="text-2xl font-bold text-warning-muted-foreground">
              3
            </p>
            <p className="text-metadata mt-0.5 text-center">Uncertain</p>
          </div>
          <div className="flex flex-col items-center rounded-lg bg-muted p-3">
            <p className="text-2xl font-bold">6</p>
            <p className="text-metadata mt-0.5 text-center">Total Planned</p>
          </div>
        </div>
      </WidgetCard>

      {/* Capacity forecast */}
      <WidgetCard
        title="Capacity forecast — July"
        description="Based on current pipeline velocity"
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3">
              <p className="text-metadata">Projected volume</p>
              <p className="mt-0.5 text-2xl font-bold tabular-nums">32</p>
              <p className="text-metadata mt-0.5">candidates next month</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-metadata">Team capacity</p>
              <p className="mt-0.5 text-2xl font-bold tabular-nums text-success-muted-foreground">
                35
              </p>
              <p className="text-metadata mt-0.5">max supported</p>
            </div>
          </div>
          <div className="rounded-lg border border-success/20 bg-success/5 px-3 py-2.5">
            <p className="text-sm text-success-muted-foreground">
              At current pipeline, team will process ~32 candidates next month.
              Current team capacity supports ~35. Comfortable headroom.
            </p>
          </div>
        </div>
      </WidgetCard>

      {/* Drop-off analysis */}
      <WidgetCard
        title="Drop-off analysis — June MTD"
        description="3 drop-offs this month"
      >
        <ul className="flex flex-col divide-y">
          <li className="flex items-start justify-between gap-4 py-3">
            <div>
              <p className="text-sm font-medium">
                Compensation — below expectation
              </p>
              <p className="text-metadata mt-0.5">
                2 candidates withdrew after offer review
              </p>
            </div>
            <StatusBadge tone="warning">Preventable</StatusBadge>
          </li>
          <li className="flex items-start justify-between gap-4 py-3">
            <div>
              <p className="text-sm font-medium">Background check failure</p>
              <p className="text-metadata mt-0.5">
                1 candidate disqualified by screening result
              </p>
            </div>
            <StatusBadge tone="neutral">Non-preventable</StatusBadge>
          </li>
        </ul>
      </WidgetCard>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function RecruitingManagerPage() {
  const [tab, setTab] = useState("overview");

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="Team Performance"
        description="Workload, throughput, and bottlenecks across your recruiting team."
        actions={
          <Button variant="outline" size="sm">
            <BarChart3 className="size-4" />
            Export report
          </Button>
        }
      />

      {/* Persona Launchpad */}
      <LaunchpadSection config={LAUNCHPADS["recruiting-manager"]} />

      {/* Vitals row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile icon={Users} label="Total pipeline" value={28} />
        <StatTile
          icon={Clock}
          label="Avg time-to-board"
          value={11.4}
          suffix="d"
          tone="info"
        />
        <StatTile
          icon={Gauge}
          label="Start-date success"
          value="87%"
          tone="success"
        />
        <StatTile
          icon={TrendingDown}
          label="Drop-off rate"
          value="8.2%"
          tone="warning"
        />
        <StatTile
          icon={AlertTriangle}
          label="At risk right now"
          value={5}
          tone="danger"
        />
        <StatTile
          icon={UsersRound}
          label="Team capacity"
          value="78%"
        />
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="scorecards">Recruiter Scorecards</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Overview ── */}
        <TabsContent value="overview" className="flex flex-col gap-5 pt-2">
          <AISummaryBanner />

          {/* Workload heatmap */}
          <WidgetCard
            title="Recruiter workload"
            description="Active pipeline per recruiter — max capacity 10"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="border-b">
                    <th className="text-data-label pb-2 pr-4 font-medium">
                      Recruiter
                    </th>
                    <th className="text-data-label pb-2 pr-4 font-medium">
                      Active
                    </th>
                    <th className="text-data-label pb-2 pr-4 text-center font-medium">
                      Starting Soon
                    </th>
                    <th className="text-data-label pb-2 pr-4 text-center font-medium">
                      At Risk
                    </th>
                    <th className="text-data-label pb-2 pr-4 font-medium">
                      Avg Progress
                    </th>
                    <th className="text-data-label pb-2 pr-4 text-center font-medium">
                      Satisfaction
                    </th>
                    <th className="text-data-label pb-2 pr-4 font-medium">
                      Status
                    </th>
                    <th className="text-data-label pb-2 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {RECRUITERS.map((r) => (
                    <RecruiterHeatmapRow key={r.name} r={r} />
                  ))}
                </tbody>
              </table>
            </div>
          </WidgetCard>

          {/* Bottleneck analysis */}
          <div className="grid gap-5 lg:grid-cols-2">
            <WidgetCard
              title="Stage bottlenecks"
              description="Where candidates are currently stuck — red = above SLA"
            >
              <ul className="flex flex-col">
                {BOTTLENECKS.map((b) => (
                  <BottleneckRow key={b.stage} b={b} />
                ))}
              </ul>
            </WidgetCard>

            <WidgetCard
              title="Throughput trend"
              description="Onboardings completed per week"
            >
              <BarList
                rows={[
                  { name: "5 wks ago", value: 14 },
                  { name: "4 wks ago", value: 17 },
                  { name: "3 wks ago", value: 15 },
                  { name: "2 wks ago", value: 19 },
                  { name: "Last week", value: 22 },
                ]}
                tone="success"
              />
              <div className="mt-4 rounded-lg border border-success/20 bg-success/5 px-3 py-2">
                <p className="text-xs text-success-muted-foreground">
                  Throughput up 15% week-over-week. Strongest week this quarter.
                </p>
              </div>
            </WidgetCard>
          </div>
        </TabsContent>

        {/* ── Tab 2: Recruiter Scorecards ── */}
        <TabsContent value="scorecards" className="pt-2">
          <div className="flex flex-col gap-4">
            {SCORECARDS.map((s) => (
              <ScorecardCard key={s.name} s={s} />
            ))}
          </div>
        </TabsContent>

        {/* ── Tab 3: Pipeline ── */}
        <TabsContent value="pipeline" className="pt-2">
          <PipelineTable />
        </TabsContent>

        {/* ── Tab 4: Forecast ── */}
        <TabsContent value="forecast" className="pt-2">
          <ForecastTab />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
