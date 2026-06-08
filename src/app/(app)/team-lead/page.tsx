"use client";

/**
 * Team Lead — Pod Performance workspace (CLAUDE.md §5, §36, §55).
 * Answers: "How is my pod performing today and what coaching does my team need?"
 *
 * The team lead sits between the Recruiting Manager (org-wide) and Recruiters
 * (individual). They own a pod of 2–4 recruiters and their candidates.
 */

import Link from "next/link";
import { useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CalendarCheck2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  GraduationCap,
  MessageSquare,
  TriangleAlert,
  Users,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { StatTile } from "@/components/workspace/stat-tile";
import { WidgetCard } from "@/components/dashboard/widgets";
import { BarList } from "@/components/dashboard/widgets";
import { StatusBadge, StatusDot } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  coachingFlags,
  getPodCandidates,
  podMemberWorkload,
  POD_MEMBERS,
  TEAM_LEAD,
  type OwnerWorkload,
} from "@/lib/ops-data";
import { formatDate, now } from "@/lib/clock";
import type { StatusTone } from "@/lib/types";

/* ─── Static mock data for rich Team Lead workspace ─── */

// Computed at render — keeps the workspace's "as of" line current daily.
const TODAY = formatDate(now(), { withYear: true });

type Priority = "Critical" | "High" | "Medium";

type PriorityItem = {
  id: string;
  priority: Priority;
  type: string;
  candidate: string;
  candidateId: string;
  recruiter: string;
  detail: string;
  due: string;
  action: string;
  actionTone: StatusTone;
};

const PRIORITY_ITEMS: PriorityItem[] = [
  {
    id: "p1",
    priority: "Critical",
    type: "No candidate response",
    candidate: "James Rivera",
    candidateId: "james-rivera",
    recruiter: "Devon Hughes",
    detail: "Not responded in 72h — Jun 15 start date is 8 days away",
    due: "8d to start",
    action: "Send escalation",
    actionTone: "danger",
  },
  {
    id: "p2",
    priority: "Critical",
    type: "Rejected document",
    candidate: "Owen Bradley",
    candidateId: "owen-bradley",
    recruiter: "Devon Hughes",
    detail: "ID rejected — start date Jun 14 is 2 days away",
    due: "2d to start",
    action: "Contact Devon",
    actionTone: "danger",
  },
  {
    id: "p3",
    priority: "High",
    type: "Background check SLA",
    candidate: "Marcus Webb",
    candidateId: "marcus-webb",
    recruiter: "Devon Hughes",
    detail: "HireRight has exceeded 5-day SLA — Jun 18 start at risk",
    due: "6d to start",
    action: "Review exception",
    actionTone: "warning",
  },
  {
    id: "p4",
    priority: "High",
    type: "Client approval needed",
    candidate: "Tara Voss",
    candidateId: "tara-voss",
    recruiter: "Lena Ortiz",
    detail: "Meridian Health package awaiting approval — Jun 24 start",
    due: "12d to start",
    action: "Ping AM",
    actionTone: "warning",
  },
  {
    id: "p5",
    priority: "Medium",
    type: "Portal not opened",
    candidate: "Aisha Bello",
    candidateId: "aisha-bello",
    recruiter: "Lena Ortiz",
    detail: "Portal link sent 2 days ago — no activity recorded",
    due: "10d to start",
    action: "Send nudge",
    actionTone: "info",
  },
  {
    id: "p6",
    priority: "Medium",
    type: "Missing start confirmation",
    candidate: "Noah Klein",
    candidateId: "noah-klein",
    recruiter: "Lena Ortiz",
    detail: "Direct deposit missing — start date not yet confirmed",
    due: "7d to start",
    action: "Confirm",
    actionTone: "info",
  },
];

const PRIORITY_DOT: Record<Priority, string> = {
  Critical: "bg-danger",
  High: "bg-warning",
  Medium: "bg-info",
};

const PRIORITY_BADGE_TONE: Record<Priority, StatusTone> = {
  Critical: "danger",
  High: "warning",
  Medium: "info",
};

type GateName = "Compliance" | "Payroll" | "Screening" | "Equipment" | "Client";
type GateTone = "success" | "warning" | "danger";

type SprintCandidate = {
  id: string;
  name: string;
  startDate: string;
  daysOut: number;
  recruiter: string;
  gates: Record<GateName, GateTone>;
};

const SPRINT_CANDIDATES: SprintCandidate[] = [
  {
    id: "owen-bradley",
    name: "Owen Bradley",
    startDate: "Jun 14",
    daysOut: 2,
    recruiter: "Devon Hughes",
    gates: {
      Compliance: "danger",
      Payroll: "warning",
      Screening: "success",
      Equipment: "warning",
      Client: "danger",
    },
  },
  {
    id: "james-rivera",
    name: "James Rivera",
    startDate: "Jun 15",
    daysOut: 3,
    recruiter: "Devon Hughes",
    gates: {
      Compliance: "danger",
      Payroll: "warning",
      Screening: "success",
      Equipment: "warning",
      Client: "warning",
    },
  },
  {
    id: "leo-park",
    name: "Leo Park",
    startDate: "Jun 17",
    daysOut: 5,
    recruiter: "Lena Ortiz",
    gates: {
      Compliance: "success",
      Payroll: "success",
      Screening: "success",
      Equipment: "success",
      Client: "success",
    },
  },
];

const GATE_NAMES: GateName[] = [
  "Compliance",
  "Payroll",
  "Screening",
  "Equipment",
  "Client",
];

const GATE_DOT: Record<GateTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

const GATE_LABEL: Record<GateTone, string> = {
  success: "Ready",
  warning: "Pending",
  danger: "Missing",
};

type CoachingFlag = {
  id: string;
  recruiter: string;
  initials: string;
  reason: string;
  recommendation: string;
};

const COACHING_FLAGS: CoachingFlag[] = [
  {
    id: "cf1",
    recruiter: "Devon Hughes",
    initials: "DH",
    reason: "2 at-risk candidates this week — consider workload reduction",
    recommendation:
      "Review Owen Bradley and James Rivera cases — both are approaching start with blockers.",
  },
  {
    id: "cf2",
    recruiter: "Lena Ortiz",
    initials: "LO",
    reason: "Average response time to candidates: 6.2h — above 4h target",
    recommendation:
      "Check queue depth on Monday mornings — response lag correlates with 9–11 AM inflow.",
  },
];

type PodMemberDetail = {
  name: string;
  role: string;
  qualityScore: string;
  lastActivity: string;
  onTrack: number;
  atRisk: number;
  startingSoon: number;
  topCandidates: { id: string; name: string; startDate: string; risk: string }[];
};

const POD_MEMBER_DETAILS: Record<string, PodMemberDetail> = {
  "Devon Hughes": {
    name: "Devon Hughes",
    role: "Recruiter",
    qualityScore: "88%",
    lastActivity: "Jun 7, 10:23 AM",
    onTrack: 1,
    atRisk: 2,
    startingSoon: 2,
    topCandidates: [
      { id: "owen-bradley", name: "Owen Bradley", startDate: "Jun 14", risk: "at-risk" },
      { id: "james-rivera", name: "James Rivera", startDate: "Jun 15", risk: "at-risk" },
      { id: "marcus-webb", name: "Marcus Webb", startDate: "Jun 18", risk: "needs-attention" },
    ],
  },
  "Lena Ortiz": {
    name: "Lena Ortiz",
    role: "Recruiter",
    qualityScore: "94%",
    lastActivity: "Jun 7, 9:48 AM",
    onTrack: 3,
    atRisk: 1,
    startingSoon: 1,
    topCandidates: [
      { id: "tara-voss", name: "Tara Voss", startDate: "Jun 24", risk: "needs-attention" },
      { id: "noah-klein", name: "Noah Klein", startDate: "Jun 19", risk: "needs-attention" },
      { id: "leo-park", name: "Leo Park", startDate: "Jun 17", risk: "on-track" },
    ],
  },
};

const QUALITY_METRICS = [
  { label: "First-pass approval", value: "91%", tone: "success" as StatusTone },
  { label: "Candidate satisfaction", value: "4.5 / 5", tone: "success" as StatusTone },
  { label: "SLA compliance", value: "88%", tone: "warning" as StatusTone },
  { label: "Drop-off rate", value: "9.1%", tone: "warning" as StatusTone },
];

/* ─── Sub-components ─── */

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function workloadBarColor(pct: number): string {
  if (pct >= 80) return "bg-danger";
  if (pct >= 60) return "bg-warning";
  return "bg-success";
}

function PriorityRow({ item }: { item: PriorityItem }) {
  return (
    <li className="flex flex-wrap items-start gap-3 border-b py-3 last:border-0">
      {/* Priority dot */}
      <span
        className={cn("mt-1.5 size-2 shrink-0 rounded-full", PRIORITY_DOT[item.priority])}
        aria-label={item.priority}
      />

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={PRIORITY_BADGE_TONE[item.priority]} withDot={false}>
            {item.priority}
          </StatusBadge>
          <span className="text-sm font-medium">{item.type}</span>
        </div>
        <p className="mt-0.5 text-sm">
          <Link
            href={`/candidates/${item.candidateId}`}
            className="hover:text-primary font-medium transition-colors"
          >
            {item.candidate}
          </Link>
          <span className="text-muted-foreground"> · {item.recruiter} · {item.due}</span>
        </p>
        <p className="text-metadata mt-0.5">{item.detail}</p>
      </div>

      {/* Action */}
      <Button size="xs" variant="outline" className="shrink-0 self-start">
        {item.action}
      </Button>
    </li>
  );
}

function GateDot({ tone, gate }: { tone: GateTone; gate: GateName }) {
  return (
    <span
      className="group/gate relative inline-flex"
      aria-label={`${gate}: ${GATE_LABEL[tone]}`}
    >
      <span className={cn("size-2.5 rounded-full", GATE_DOT[tone])} />
      {/* Tooltip */}
      <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-md transition-opacity group-hover/gate:opacity-100 whitespace-nowrap border">
        {gate}: {GATE_LABEL[tone]}
      </span>
    </span>
  );
}

function SprintRow({ c }: { c: SprintCandidate }) {
  const allGreen = Object.values(c.gates).every((g) => g === "success");
  const hasDanger = Object.values(c.gates).some((g) => g === "danger");

  return (
    <li className="flex flex-wrap items-center gap-3 border-b py-3 last:border-0">
      {/* Countdown badge */}
      <span
        className={cn(
          "flex h-9 w-11 shrink-0 flex-col items-center justify-center rounded-lg text-center text-xs font-semibold tabular-nums",
          hasDanger
            ? "bg-danger-muted text-danger-muted-foreground"
            : c.daysOut <= 3
              ? "bg-warning-muted text-warning-muted-foreground"
              : "bg-success-muted text-success-muted-foreground",
        )}
      >
        <span className="text-base leading-none">{c.daysOut}</span>
        <span className="text-[10px] font-normal">days</span>
      </span>

      {/* Name + recruiter */}
      <div className="min-w-0 flex-1">
        <Link
          href={`/candidates/${c.id}`}
          className="hover:text-primary text-sm font-medium transition-colors"
        >
          {c.name}
        </Link>
        <p className="text-metadata">
          Starts {c.startDate} · {c.recruiter}
        </p>
      </div>

      {/* Readiness gates */}
      <div className="flex items-center gap-2">
        {GATE_NAMES.map((gate) => (
          <GateDot key={gate} tone={c.gates[gate]} gate={gate} />
        ))}
        {allGreen && (
          <span className="ml-1 flex items-center gap-1 text-xs text-success-muted-foreground">
            <CheckCircle2 className="size-3.5" /> Ready
          </span>
        )}
      </div>
    </li>
  );
}

type RiskLabel = "on-track" | "needs-attention" | "at-risk";

const RISK_TONE: Record<RiskLabel, StatusTone> = {
  "on-track": "success",
  "needs-attention": "warning",
  "at-risk": "danger",
};

function PodMemberCard({ workload }: { workload: OwnerWorkload }) {
  const [expanded, setExpanded] = useState(false);
  const detail = POD_MEMBER_DETAILS[workload.name];
  const MAX = 10;
  const pct = Math.min((workload.active / MAX) * 100, 100);
  const barColor = workloadBarColor(pct);

  return (
    <li className="bg-card rounded-xl border shadow-xs">
      {/* Header row */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 rounded-xl p-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-expanded={expanded}
      >
        {/* Avatar */}
        <Avatar size="default">
          <AvatarFallback>{initials(workload.name)}</AvatarFallback>
        </Avatar>

        {/* Identity */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{workload.name}</span>
            {detail && (
              <span className="text-metadata">{detail.role}</span>
            )}
          </div>

          {/* Workload bar */}
          <div className="mt-1.5 flex items-center gap-2">
            <div className="bg-muted relative h-1.5 flex-1 overflow-hidden rounded-full">
              <span
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full transition-all",
                  barColor,
                )}
                style={{ width: `${Math.max(pct, 4)}%` }}
              />
            </div>
            <span className="text-metadata tabular-nums">{workload.active}/10</span>
          </div>
        </div>

        {/* Stats cluster */}
        <div className="hidden shrink-0 items-center gap-3 sm:flex">
          {workload.atRisk > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-danger-muted-foreground">
              <TriangleAlert className="size-3" />
              {workload.atRisk} at-risk
            </span>
          )}
          {detail && (
            <span className="text-metadata">Quality: {detail.qualityScore}</span>
          )}
        </div>

        {/* Expand chevron */}
        {expanded ? (
          <ChevronDown className="text-muted-foreground size-4 shrink-0" />
        ) : (
          <ChevronRight className="text-muted-foreground size-4 shrink-0" />
        )}
      </button>

      {/* Expanded detail */}
      {expanded && detail && (
        <div className="border-t px-4 pb-4 pt-3">
          {/* Mini stat strip */}
          <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <span className="flex items-center gap-1.5 text-success-muted-foreground">
              <StatusDot tone="success" /> {detail.onTrack} on track
            </span>
            <span className="flex items-center gap-1.5 text-warning-muted-foreground">
              <StatusDot tone="warning" /> {detail.startingSoon} starting soon
            </span>
            {detail.atRisk > 0 && (
              <span className="flex items-center gap-1.5 text-danger-muted-foreground">
                <StatusDot tone="danger" /> {detail.atRisk} at-risk
              </span>
            )}
            <span className="text-muted-foreground">
              Last active: {detail.lastActivity}
            </span>
          </div>

          {/* Top 3 candidates */}
          <p className="text-metadata mb-1.5 font-medium">Most urgent candidates</p>
          <ul className="mb-3 flex flex-col gap-1.5">
            {detail.topCandidates.map((tc) => (
              <li key={tc.id} className="flex items-center gap-2">
                <StatusDot
                  tone={RISK_TONE[tc.risk as RiskLabel] ?? "neutral"}
                />
                <Link
                  href={`/candidates/${tc.id}`}
                  className="hover:text-primary text-sm font-medium transition-colors"
                >
                  {tc.name}
                </Link>
                <span className="text-metadata">— starts {tc.startDate}</span>
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Link href={`/candidates?recruiter=${encodeURIComponent(workload.name)}`}>
              <Button size="xs" variant="outline">
                <Users className="size-3" /> View roster
              </Button>
            </Link>
            <Button size="xs" variant="outline">
              <MessageSquare className="size-3" /> Message
            </Button>
            <Button size="xs" variant="outline">
              <BookOpen className="size-3" /> Add note
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

function CoachingCard({ flag }: { flag: CoachingFlag }) {
  return (
    <li className="bg-card rounded-xl border shadow-xs p-4">
      <div className="flex items-start gap-3">
        {/* Initials avatar */}
        <Avatar size="default">
          <AvatarFallback className="bg-warning-muted text-warning-muted-foreground text-xs font-semibold">
            {flag.initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{flag.recruiter}</span>
            <GraduationCap className="size-3.5 text-warning-muted-foreground" />
          </div>
          <p className="mt-1 text-sm">{flag.reason}</p>
          <p className="text-metadata mt-1 flex items-start gap-1">
            <AlertCircle className="mt-0.5 size-3 shrink-0 text-info" />
            {flag.recommendation}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="xs" variant="outline">
          <CalendarCheck2 className="size-3" /> Schedule 1:1
        </Button>
        <Button size="xs" variant="outline">
          <BookOpen className="size-3" /> Add note
        </Button>
        <Button size="xs" variant="ghost" className="text-muted-foreground">
          Dismiss
        </Button>
      </div>
    </li>
  );
}

/* ─── Page ─── */

export default function TeamLeadWorkspacePage() {
  const pod = getPodCandidates();
  const members = podMemberWorkload();
  const flags = coachingFlags();

  const atRisk = pod.filter(
    (c) => c.risk === "at-risk" || c.risk === "unlikely",
  ).length;
  const startingSoon = pod.filter((c) => c.startInDays <= 7).length;
  const avgProgress = Math.round(
    pod.reduce((s, c) => s + c.progress, 0) / (pod.length || 1),
  );

  // Pipeline by stage for the right rail BarList
  const stageMap = new Map<string, number>();
  for (const c of pod) {
    stageMap.set(c.stage, (stageMap.get(c.stage) ?? 0) + 1);
  }
  const stageRows = [...stageMap.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <PageContainer className="flex flex-col gap-6">
      {/* Page header */}
      <PageHeader
        title="Pod Performance"
        description={`${TEAM_LEAD}'s pod · ${TODAY}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5">
              <Users className="size-3" />
              {members.length} recruiters · {pod.length} candidates
            </Badge>
            {atRisk > 0 && (
              <Badge className="gap-1 bg-danger-muted text-danger-muted-foreground border-danger-muted hover:bg-danger-muted">
                <TriangleAlert className="size-3" />
                {atRisk} at-risk
              </Badge>
            )}
          </div>
        }
      />

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={Users} label="Pod pipeline" value={pod.length} />
        <StatTile
          icon={Clock}
          label="Starting this week"
          value={startingSoon}
          tone="warning"
        />
        <StatTile
          icon={TriangleAlert}
          label="Pod at-risk"
          value={atRisk}
          tone="danger"
        />
        <StatTile
          icon={CheckCircle2}
          label="Avg progress"
          value={avgProgress}
          tone="info"
          suffix="%"
        />
      </div>

      {/* Main 2-column grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
        {/* ── Left column ── */}
        <div className="flex flex-col gap-6">

          {/* Today's priorities */}
          <WidgetCard
            title="Today's priorities"
            description="Sorted by urgency · click a candidate to open their record"
            action={
              <Badge variant="outline" className="tabular-nums">
                {PRIORITY_ITEMS.length}
              </Badge>
            }
          >
            <ul className="flex flex-col">
              {PRIORITY_ITEMS.map((item) => (
                <PriorityRow key={item.id} item={item} />
              ))}
            </ul>
          </WidgetCard>

          {/* Pod member cards */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-section-heading">Pod members</h2>
              <span className="text-metadata">Click a card to expand roster</span>
            </div>
            <ul className="flex flex-col gap-3">
              {members.map((m) => (
                <PodMemberCard key={m.name} workload={m} />
              ))}
            </ul>
          </div>

          {/* Sprint view — starts within 7 days */}
          <WidgetCard
            title="Sprint view"
            description="Candidates starting within 7 days — readiness gates"
            action={
              <div className="flex items-center gap-3">
                {GATE_NAMES.map((g) => (
                  <span key={g} className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
                    <span className="inline-block size-2 rounded-full bg-muted-foreground/40" />
                    {g}
                  </span>
                ))}
              </div>
            }
          >
            {SPRINT_CANDIDATES.length === 0 ? (
              <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="text-success size-4" /> No starts this week.
              </p>
            ) : (
              <>
                {/* Gate legend */}
                <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground border-b pb-2">
                  <span className="font-medium">Gates:</span>
                  {GATE_NAMES.map((g) => (
                    <span key={g}>{g}</span>
                  ))}
                  <span className="ml-auto flex items-center gap-3">
                    <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-success inline-block" /> Ready</span>
                    <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-warning inline-block" /> Pending</span>
                    <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-danger inline-block" /> Missing</span>
                  </span>
                </div>
                <ul className="flex flex-col">
                  {SPRINT_CANDIDATES.map((c) => (
                    <SprintRow key={c.id} c={c} />
                  ))}
                </ul>
              </>
            )}
          </WidgetCard>

          {/* Coaching flags */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-section-heading flex items-center gap-2">
                <GraduationCap className="size-4 text-warning-muted-foreground" />
                Coaching flags
              </h2>
              <Badge variant="outline">{COACHING_FLAGS.length} flagged</Badge>
            </div>
            {COACHING_FLAGS.length === 0 ? (
              <div className="flex items-center gap-2 rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                <CheckCircle2 className="size-4 text-success" />
                No coaching flags — pod is performing well.
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {COACHING_FLAGS.map((f) => (
                  <CoachingCard key={f.id} flag={f} />
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ── Right rail ── */}
        <div className="flex flex-col gap-5">

          {/* Pipeline by stage */}
          <WidgetCard title="Pipeline by stage">
            <BarList rows={stageRows} tone="info" />
          </WidgetCard>

          {/* Quality metrics */}
          <WidgetCard title="This week's quality" description="Pod-level averages">
            <ul className="flex flex-col gap-3">
              {QUALITY_METRICS.map((m) => (
                <li key={m.label} className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground leading-tight">{m.label}</span>
                  <StatusBadge tone={m.tone} withDot={false} className="tabular-nums font-semibold">
                    {m.value}
                  </StatusBadge>
                </li>
              ))}
            </ul>
          </WidgetCard>

          {/* Quick coaching summary */}
          <WidgetCard title="Pod health" description="Live from candidate data">
            <ul className="flex flex-col gap-2.5">
              {members.map((m) => {
                const MAX = 10;
                const pct = Math.min((m.active / MAX) * 100, 100);
                const color = workloadBarColor(pct);
                return (
                  <li key={m.name} className="flex items-center gap-2">
                    <span className="w-24 shrink-0 truncate text-xs font-medium">
                      {m.name.split(" ")[0]}
                    </span>
                    <div className="bg-muted relative h-1.5 flex-1 overflow-hidden rounded-full">
                      <span
                        className={cn(
                          "absolute inset-y-0 left-0 rounded-full",
                          color,
                        )}
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                    <span
                      className={cn(
                        "w-8 shrink-0 text-right text-xs tabular-nums",
                        m.atRisk > 0
                          ? "text-danger-muted-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {m.active}
                    </span>
                  </li>
                );
              })}
            </ul>
          </WidgetCard>
        </div>
      </div>
    </PageContainer>
  );
}
