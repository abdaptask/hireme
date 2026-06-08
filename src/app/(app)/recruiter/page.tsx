"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock,
  MessageSquare,
  Phone,
  Star,
  TrendingUp,
  Users,
  Zap,
  CheckCircle2,
  XCircle,
  BarChart3,
  Activity,
} from "lucide-react";
import { PageContainer } from "@/components/page";
import { StatTile } from "@/components/workspace/stat-tile";
import { PipelineStatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CURRENT_RECRUITER } from "@/lib/ops-data";

// ─── Mock data ───────────────────────────────────────────────────────────────

type CandidateGroup = "action" | "monitor" | "on-track";

type RecruiterCandidate = {
  id: string;
  name: string;
  role: string;
  client: string;
  stage: string;
  startDateLabel: string;
  startInDays: number;
  progress: number;
  group: CandidateGroup;
  blocker?: string;
  lastContact: string;
  lastContactDaysAgo: number;
  satisfaction?: number;
  draftMessage: string;
  status: "at-risk" | "needs-attention" | "on-track";
};

const RECRUITER_CANDIDATES: RecruiterCandidate[] = [
  {
    id: "sarah-chen",
    name: "Sarah Chen",
    role: "Senior Data Analyst",
    client: "Meridian Health",
    stage: "Document Submission",
    startDateLabel: "Jun 15",
    startInDays: 8,
    progress: 42,
    group: "action",
    blocker: "Government ID rejected — awaiting re-upload",
    lastContact: "You messaged Jun 5 — no response",
    lastContactDaysAgo: 3,
    draftMessage:
      "Hi Sarah, we noticed your Government ID was flagged during our review. Could you please re-upload a clearer copy at your earliest convenience? Your start date of Jun 15 is approaching — we want to make sure everything is in order. Let us know if you need help.",
    status: "at-risk",
  },
  {
    id: "james-rivera",
    name: "James Rivera",
    role: "IT Consultant",
    client: "Meridian Health",
    stage: "Profile Setup",
    startDateLabel: "Jun 12",
    startInDays: 5,
    progress: 8,
    group: "action",
    blocker: "Has not opened portal in 3 days — no response to reminders",
    lastContact: "System reminder sent Jun 4 — no response",
    lastContactDaysAgo: 4,
    draftMessage:
      "Hi James, we haven't seen you log into the onboarding portal yet and your start date at Meridian Health is June 12. Please click the link below to get started — it should only take about 20 minutes to complete the first steps. Reach out if you have any questions.",
    status: "at-risk",
  },
  {
    id: "raj-patel",
    name: "Raj Patel",
    role: "Cloud Engineer",
    client: "Apex Dynamics",
    stage: "Client Requirements",
    startDateLabel: "Jun 10",
    startInDays: 3,
    progress: 75,
    group: "action",
    blocker: "NDA pending client signature — 4 days with no action",
    lastContact: "You called Jun 3",
    lastContactDaysAgo: 5,
    draftMessage:
      "Hi Raj, great news — your onboarding is almost complete! We're just waiting on Apex Dynamics to countersign your NDA. I'm following up with them directly today. No action needed from you right now — I'll keep you posted.",
    status: "needs-attention",
  },
  {
    id: "aisha-bello",
    name: "Aisha Bello",
    role: "Business Analyst",
    client: "NovaTech Solutions",
    stage: "Profile Setup",
    startDateLabel: "Jun 20",
    startInDays: 13,
    progress: 22,
    group: "monitor",
    lastContact: "Portal invite sent Jun 5",
    lastContactDaysAgo: 2,
    draftMessage:
      "Hi Aisha, just a friendly check-in on your onboarding. You're 22% complete — a few more steps and you'll be on track for your June 20 start at NovaTech. Let me know if anything is unclear.",
    status: "needs-attention",
  },
  {
    id: "grace-okafor",
    name: "Grace Okafor",
    role: "Data Analyst",
    client: "Meridian Health",
    stage: "IT Provisioning",
    startDateLabel: "Jun 8",
    startInDays: 1,
    progress: 91,
    group: "on-track",
    lastContact: "Confirmed via portal Jun 6",
    lastContactDaysAgo: 1,
    satisfaction: 4.9,
    draftMessage: "",
    status: "on-track",
  },
  {
    id: "marcus-webb",
    name: "Marcus Webb",
    role: "Backend Engineer",
    client: "NovaTech Solutions",
    stage: "Document Submission",
    startDateLabel: "Jun 22",
    startInDays: 15,
    progress: 45,
    group: "on-track",
    lastContact: "You messaged Jun 5",
    lastContactDaysAgo: 2,
    satisfaction: 4.4,
    draftMessage: "",
    status: "on-track",
  },
  {
    id: "carlos-mendez",
    name: "Carlos Mendez",
    role: "QA Lead",
    client: "Skyline Retail",
    stage: "Profile Setup",
    startDateLabel: "Jul 1",
    startInDays: 24,
    progress: 12,
    group: "on-track",
    lastContact: "Offer accepted Jun 4",
    lastContactDaysAgo: 3,
    satisfaction: 4.2,
    draftMessage: "",
    status: "on-track",
  },
];

const FUNNEL_STAGES = [
  { label: "Offer Accepted", count: 8, pct: null },
  { label: "Documents Sent", count: 7, pct: 88 },
  { label: "Background Check", count: 5, pct: 71 },
  { label: "Client Approved", count: 4, pct: 80 },
  { label: "Ready to Start", count: 3, pct: 75 },
  { label: "Started (MTD)", count: 18, pct: null },
];

const ACTIVITY_FEED = [
  { id: "a1", text: "Sarah Chen re-uploaded her Government ID", time: "2h ago", tag: "AI quality check: pending", tone: "warning" as const },
  { id: "a2", text: "James Rivera has not opened the portal in 72h", time: "System alert", tag: "Action required", tone: "danger" as const },
  { id: "a3", text: "Grace Okafor completed I-9 Section 1", time: "1d ago", tag: "Document approved", tone: "success" as const },
  { id: "a4", text: "Raj Patel's NDA sent to Apex Dynamics for approval", time: "1d ago", tag: "Awaiting client", tone: "info" as const },
  { id: "a5", text: "Aisha Bello started profile setup", time: "2d ago", tag: "Progress: 22%", tone: "info" as const },
  { id: "a6", text: "Carlos Mendez accepted offer — portal invite sent", time: "3d ago", tag: "New hire", tone: "success" as const },
  { id: "a7", text: "Marcus Webb submitted tax forms", time: "3d ago", tag: "Reviewed", tone: "success" as const },
  { id: "a8", text: "Grace Okafor confirmed Day 1 instructions received", time: "4d ago", tag: "Ready", tone: "success" as const },
];

const START_CALENDAR = [
  { date: "Jun 8", name: "Grace Okafor", client: "Meridian Health", status: "confirmed" as const },
  { date: "Jun 10", name: "Raj Patel", client: "Apex Dynamics", status: "at-risk" as const },
  { date: "Jun 12", name: "James Rivera", client: "Meridian Health", status: "at-risk" as const },
  { date: "Jun 15", name: "Sarah Chen", client: "Meridian Health", status: "at-risk" as const },
  { date: "Jun 20", name: "Aisha Bello", client: "NovaTech Solutions", status: "on-track" as const },
  { date: "Jun 22", name: "Marcus Webb", client: "NovaTech Solutions", status: "on-track" as const },
  { date: "Jul 1", name: "Carlos Mendez", client: "Skyline Retail", status: "on-track" as const },
];

// ─── Helper components ────────────────────────────────────────────────────────

function StartCountdown({ days }: { days: number }) {
  const color =
    days <= 7
      ? "text-danger"
      : days <= 14
        ? "text-warning"
        : "text-success-muted-foreground";
  return (
    <div className="flex flex-col items-center">
      <span className={cn("text-2xl font-bold tabular-nums leading-none", color)}>
        {days}
      </span>
      <span className="text-metadata leading-tight">days</span>
    </div>
  );
}

function LastContactBadge({ daysAgo }: { daysAgo: number }) {
  const urgent = daysAgo >= 3;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        urgent
          ? "bg-warning-muted text-warning-muted-foreground"
          : "bg-muted text-muted-foreground",
      )}
    >
      <Clock className="size-3" />
      {daysAgo}d ago
    </span>
  );
}

function ProgressBar({ value, className }: { value: number; className?: string }) {
  const color =
    value >= 80
      ? "bg-success"
      : value >= 50
        ? "bg-info"
        : value >= 25
          ? "bg-warning"
          : "bg-danger";
  return (
    <div className={cn("bg-muted h-1.5 w-full overflow-hidden rounded-full", className)}>
      <div
        className={cn("h-full rounded-full transition-all", color)}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function GroupHeader({
  label,
  count,
  dot,
  expanded,
  onToggle,
}: {
  label: string;
  count: number;
  dot: "danger" | "warning" | "success";
  expanded: boolean;
  onToggle: () => void;
}) {
  const dotColor = {
    danger: "bg-danger",
    warning: "bg-warning",
    success: "bg-success",
  }[dot];

  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center gap-2.5 py-1 text-left transition-opacity hover:opacity-80"
    >
      <span className={cn("size-2 shrink-0 rounded-full", dotColor)} />
      <span className="text-xs font-semibold uppercase tracking-wide text-foreground">
        {label}
      </span>
      <Badge variant="outline" className="text-xs">
        {count}
      </Badge>
      <span className="ml-auto">
        {expanded ? (
          <ChevronDown className="text-muted-foreground size-3.5" />
        ) : (
          <ChevronRight className="text-muted-foreground size-3.5" />
        )}
      </span>
    </button>
  );
}

// ─── Candidate cards ──────────────────────────────────────────────────────────

function ActionCard({ c }: { c: RecruiterCandidate }) {
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [draft, setDraft] = useState(c.draftMessage);

  return (
    <div className="bg-card rounded-xl border p-4 transition-shadow hover:shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        {/* Left: countdown */}
        <div className="flex shrink-0 flex-col items-center justify-center rounded-lg border bg-muted/30 px-3 py-2">
          <StartCountdown days={c.startInDays} />
          <span className="text-metadata mt-0.5 whitespace-nowrap">{c.startDateLabel}</span>
        </div>

        {/* Center: details */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/candidates/${c.id}`}
              className="hover:text-primary text-sm font-semibold"
            >
              {c.name}
            </Link>
            <span className="text-muted-foreground text-xs">·</span>
            <span className="text-muted-foreground text-xs">{c.role}</span>
            <span className="text-muted-foreground text-xs">·</span>
            <span className="text-muted-foreground text-xs">{c.client}</span>
            <PipelineStatusBadge
              status={c.status === "at-risk" ? "at-risk" : "needs-attention"}
            />
          </div>

          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="shrink-0 font-medium text-muted-foreground">Stage:</span>
            <span className="text-foreground">{c.stage}</span>
          </div>

          {c.blocker && (
            <div className="mt-2 flex items-start gap-2 rounded-md bg-danger-muted px-2.5 py-1.5">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-danger" />
              <p className="text-xs font-medium text-danger-muted-foreground">
                {c.blocker}
              </p>
            </div>
          )}

          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{c.lastContact}</span>
            <LastContactBadge daysAgo={c.lastContactDaysAgo} />
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex shrink-0 flex-wrap gap-1.5 sm:flex-col sm:items-end">
          <Button
            size="xs"
            variant="default"
            className="gap-1"
            onClick={() => setMessageOpen((v) => !v)}
          >
            <MessageSquare className="size-3" />
            {messageOpen ? "Hide" : "Send reminder"}
          </Button>
          <Button size="xs" variant="outline" className="gap-1">
            <Phone className="size-3" />
            Call
          </Button>
          <Button size="xs" variant="outline" className="gap-1">
            <Bell className="size-3" />
            Escalate
          </Button>
          <Link href={`/candidates/${c.id}`}>
            <Button size="xs" variant="ghost">
              Open record
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick message composer */}
      {messageOpen && (
        <div className="mt-3 rounded-lg border bg-muted/20 p-3">
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            AI-drafted message — review before sending
          </p>
          {messageSent ? (
            <div className="flex items-center gap-2 text-success-muted-foreground text-sm">
              <CheckCircle2 className="size-4" />
              Message sent to {c.name}
            </div>
          ) : (
            <>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={4}
                className="w-full resize-none rounded-md border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">Via portal + SMS</span>
                <div className="flex gap-2">
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => setMessageOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="xs"
                    variant="default"
                    onClick={() => setMessageSent(true)}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function MonitorCard({ c }: { c: RecruiterCandidate }) {
  const [nudgeSent, setNudgeSent] = useState(false);
  return (
    <div className="bg-card flex items-center gap-3 rounded-xl border px-4 py-3 transition-shadow hover:shadow-sm">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/candidates/${c.id}`}
            className="hover:text-primary text-sm font-semibold"
          >
            {c.name}
          </Link>
          <span className="text-muted-foreground text-xs">{c.stage}</span>
          <LastContactBadge daysAgo={c.lastContactDaysAgo} />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <ProgressBar value={c.progress} className="max-w-[180px]" />
          <span className="text-xs tabular-nums text-muted-foreground">{c.progress}%</span>
          <span className="text-xs text-muted-foreground">· {c.startDateLabel} start</span>
        </div>
      </div>
      <Button
        size="xs"
        variant={nudgeSent ? "ghost" : "outline"}
        className="shrink-0 gap-1"
        onClick={() => setNudgeSent(true)}
        disabled={nudgeSent}
      >
        {nudgeSent ? (
          <>
            <CheckCircle2 className="size-3 text-success" /> Nudged
          </>
        ) : (
          <>
            <Zap className="size-3" /> Nudge
          </>
        )}
      </Button>
    </div>
  );
}

function OnTrackRow({ c }: { c: RecruiterCandidate }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <button
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/40"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="min-w-0 flex-1 grid grid-cols-[1fr_auto_auto_auto] items-center gap-3">
          <span className="truncate text-sm font-medium">{c.name}</span>
          <span className="text-xs text-muted-foreground hidden sm:block">{c.client}</span>
          <span className="text-xs text-muted-foreground hidden sm:block">{c.stage}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs tabular-nums text-muted-foreground">{c.startDateLabel}</span>
            {c.satisfaction && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-success-muted px-1.5 py-0.5 text-xs text-success-muted-foreground">
                <Star className="size-2.5" />
                {c.satisfaction}
              </span>
            )}
          </div>
        </div>
        {expanded ? (
          <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="mx-3 mb-2 rounded-lg border bg-muted/20 p-3">
          <div className="flex flex-wrap gap-4 text-xs">
            <div>
              <span className="text-muted-foreground">Role</span>
              <p className="font-medium">{c.role}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Client</span>
              <p className="font-medium">{c.client}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Progress</span>
              <div className="mt-1 flex items-center gap-2">
                <ProgressBar value={c.progress} className="w-24" />
                <span className="font-medium tabular-nums">{c.progress}%</span>
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Start</span>
              <p className="font-medium">
                {c.startDateLabel} · {c.startInDays}d
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Last contact</span>
              <p className="font-medium">{c.lastContact}</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Link href={`/candidates/${c.id}`}>
              <Button size="xs" variant="outline">
                Open record
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Handoff funnel ───────────────────────────────────────────────────────────

function HandoffFunnel() {
  const maxCount = Math.max(...FUNNEL_STAGES.map((s) => s.count));
  return (
    <div className="flex flex-col gap-2">
      {FUNNEL_STAGES.map((stage, i) => (
        <div key={stage.label}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium">{stage.label}</span>
            <span className="tabular-nums font-semibold">{stage.count}</span>
          </div>
          <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
            <div
              className="h-full rounded-full bg-info transition-all"
              style={{ width: `${(stage.count / maxCount) * 100}%` }}
            />
          </div>
          {stage.pct !== null && (
            <p className="mt-0.5 text-right text-xs text-muted-foreground">
              {stage.pct}% passed
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Activity feed ────────────────────────────────────────────────────────────

const toneTagClass = {
  success: "bg-success-muted text-success-muted-foreground",
  warning: "bg-warning-muted text-warning-muted-foreground",
  danger: "bg-danger-muted text-danger-muted-foreground",
  info: "bg-info-muted text-info-muted-foreground",
};

function ActivityFeed() {
  return (
    <ul className="flex flex-col divide-y">
      {ACTIVITY_FEED.map((item) => (
        <li key={item.id} className="flex items-start gap-3 py-2.5">
          <Activity className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium leading-snug">{item.text}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{item.time}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                  toneTagClass[item.tone],
                )}
              >
                {item.tag}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ─── Start calendar ───────────────────────────────────────────────────────────

function StartCalendar() {
  return (
    <ul className="flex flex-col gap-2">
      {START_CALENDAR.map((entry) => (
        <li
          key={entry.name}
          className="flex items-center gap-3 rounded-lg border px-3 py-2"
        >
          <div className="flex w-14 shrink-0 flex-col">
            <span className="text-xs font-semibold tabular-nums">{entry.date}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{entry.name}</p>
            <p className="truncate text-xs text-muted-foreground">{entry.client}</p>
          </div>
          {entry.status === "confirmed" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-success-muted px-2 py-0.5 text-xs text-success-muted-foreground whitespace-nowrap">
              <CheckCircle2 className="size-3" /> Confirmed
            </span>
          )}
          {entry.status === "at-risk" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-warning-muted px-2 py-0.5 text-xs text-warning-muted-foreground whitespace-nowrap">
              <AlertTriangle className="size-3" /> At Risk
            </span>
          )}
          {entry.status === "on-track" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground whitespace-nowrap">
              On Track
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RecruiterWorkspacePage() {
  const [groupExpanded, setGroupExpanded] = useState<
    Record<CandidateGroup, boolean>
  >({ action: true, monitor: true, "on-track": true });

  const toggle = (g: CandidateGroup) =>
    setGroupExpanded((prev) => ({ ...prev, [g]: !prev[g] }));

  const actionCandidates = RECRUITER_CANDIDATES.filter((c) => c.group === "action");
  const monitorCandidates = RECRUITER_CANDIDATES.filter((c) => c.group === "monitor");
  const onTrackCandidates = RECRUITER_CANDIDATES.filter((c) => c.group === "on-track");

  const total = RECRUITER_CANDIDATES.length;
  const actionCount = actionCandidates.length;
  const startingThisWeek = RECRUITER_CANDIDATES.filter((c) => c.startInDays <= 7).length;
  const readyToStart = RECRUITER_CANDIDATES.filter((c) => c.progress >= 85).length;

  return (
    <PageContainer className="flex flex-col gap-6">
      {/* ── Greeting ── */}
      <div className="bg-card flex flex-col gap-3 rounded-xl border p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-page-title">
            Good morning, {CURRENT_RECRUITER.split(" ")[0]} — here&apos;s your pipeline for Jun 7.
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {total} candidates active &middot; {startingThisWeek} starting this week &middot;{" "}
            <span className="font-medium text-warning-muted-foreground">
              {actionCount} need your attention
            </span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-full border bg-success-muted px-4 py-2">
          <Star className="size-4 text-success-muted-foreground" />
          <span className="text-sm font-semibold text-success-muted-foreground">
            4.6 / 5
          </span>
          <span className="text-xs text-success-muted-foreground">candidate satisfaction</span>
        </div>
      </div>


      {/* ── Vitals row ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatTile icon={Users} label="My Roster" value={total} />
        <StatTile icon={AlertTriangle} label="Action Required" value={actionCount} tone="danger" />
        <StatTile icon={CalendarDays} label="Starting This Week" value={startingThisWeek} tone="warning" />
        <StatTile icon={CheckCircle2} label="Ready to Start" value={readyToStart} tone="success" />
        <StatTile icon={XCircle} label="Drop-offs MTD" value={1} />
      </div>

      {/* ── Main content + right rail ── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left: candidate groups */}
        <div className="flex flex-col gap-4">
          {/* Group 1: Needs Action */}
          <div className="flex flex-col gap-2">
            <GroupHeader
              label="Needs Your Action"
              count={actionCandidates.length}
              dot="danger"
              expanded={groupExpanded.action}
              onToggle={() => toggle("action")}
            />
            {groupExpanded.action && (
              <div className="flex flex-col gap-3">
                {actionCandidates.map((c) => (
                  <ActionCard key={c.id} c={c} />
                ))}
              </div>
            )}
          </div>

          {/* Group 2: Monitor */}
          <div className="flex flex-col gap-2">
            <GroupHeader
              label="Monitor — Moving Slowly"
              count={monitorCandidates.length}
              dot="warning"
              expanded={groupExpanded.monitor}
              onToggle={() => toggle("monitor")}
            />
            {groupExpanded.monitor && (
              <div className="flex flex-col gap-2">
                {monitorCandidates.map((c) => (
                  <MonitorCard key={c.id} c={c} />
                ))}
              </div>
            )}
          </div>

          {/* Group 3: On Track */}
          <div className="flex flex-col gap-2">
            <GroupHeader
              label="On Track"
              count={onTrackCandidates.length}
              dot="success"
              expanded={groupExpanded["on-track"]}
              onToggle={() => toggle("on-track")}
            />
            {groupExpanded["on-track"] && (
              <div className="bg-card rounded-xl border divide-y overflow-hidden">
                {onTrackCandidates.map((c) => (
                  <OnTrackRow key={c.id} c={c} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right rail */}
        <div className="flex flex-col gap-5">
          {/* Handoff funnel */}
          <section className="bg-card rounded-xl border shadow-xs">
            <div className="flex items-center gap-2 border-b px-4 py-2.5">
              <BarChart3 className="size-4 text-muted-foreground" />
              <h2 className="text-card-heading">Handoff Funnel</h2>
            </div>
            <div className="p-4">
              <HandoffFunnel />
            </div>
          </section>

          {/* Start date calendar */}
          <section className="bg-card rounded-xl border shadow-xs">
            <div className="flex items-center gap-2 border-b px-4 py-2.5">
              <CalendarDays className="size-4 text-muted-foreground" />
              <h2 className="text-card-heading">Start Dates</h2>
            </div>
            <div className="p-4">
              <StartCalendar />
            </div>
          </section>

          {/* Activity feed */}
          <section className="bg-card rounded-xl border shadow-xs">
            <div className="flex items-center gap-2 border-b px-4 py-2.5">
              <TrendingUp className="size-4 text-muted-foreground" />
              <h2 className="text-card-heading">Recent Activity</h2>
            </div>
            <div className="p-4">
              <ActivityFeed />
            </div>
          </section>
        </div>
      </div>
    </PageContainer>
  );
}
