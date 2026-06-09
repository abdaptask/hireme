"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Cake,
  Check,
  ChevronDown,
  Download,
  Gift,
  PartyPopper,
  RefreshCw,
  Send,
  Sparkles,
  Trophy,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { FilterBar } from "@/components/command-center/filter-bar";
import { EventFeed } from "@/components/command-center/event-feed";
import {
  BarList,
  MiniBars,
  OpsTileCard,
  StatCard,
  WidgetCard,
} from "@/components/dashboard/widgets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MorningBriefing } from "@/components/ai/morning-briefing";
import { RecommendationCard } from "@/components/ai/recommendation-card";
import {
  DrillDownSheet,
  type DrillDownColumn,
} from "@/components/reports/drill-down-sheet";
import { getRecommendations } from "@/lib/ai";
import { CANDIDATES, type CandidateSummary } from "@/lib/candidates";
import {
  ANNIVERSARIES,
  BIRTHDAYS,
  CLIENT_BOTTLENECKS,
  CONFIDENCE_DISTRIBUTION,
  DROPOFF_TREND,
  MILESTONES,
  OPS_TILES,
  PIPELINE_BY_STAGE,
  VENDOR_TURNAROUND,
  VITALS,
  type EngagementItem,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

// ─── Static data ────────────────────────────────────────────────────────────

const TIME_TO_ONBOARD_TREND = [12.1, 11.8, 12.3, 11.5, 11.9, 11.2, 11.6, 11.4];

/** §7 — 12-card layout split: first 6 volume, last 6 risk/health */
const VITALS_ROW1 = VITALS.slice(0, 6);
const VITALS_ROW2 = VITALS.slice(6, 12);

type ExceptionItem = {
  id: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  type: string;
  candidate: string;
  age: string;
  assignee: string;
};

const EXCEPTIONS: ExceptionItem[] = [
  { id: "EXC-041", severity: "Critical", type: "Rejected identity document", candidate: "James Rivera", age: "2d", assignee: "Riya Kim" },
  { id: "EXC-042", severity: "Critical", type: "Start date at risk", candidate: "Owen Bradley", age: "1d", assignee: "Devon Hughes" },
  { id: "EXC-043", severity: "Critical", type: "Background check delayed >5d", candidate: "Tomás Vega", age: "5d", assignee: "Lena Ortiz" },
  { id: "EXC-044", severity: "High", type: "Payroll sync failed", candidate: "Marcus Webb", age: "18h", assignee: "Sasha Patel" },
  { id: "EXC-045", severity: "High", type: "Missing direct deposit", candidate: "Noah Klein", age: "3d", assignee: "Sasha Patel" },
  { id: "EXC-046", severity: "High", type: "Integration auth expiring", candidate: "—", age: "3d", assignee: "IT Ops" },
  { id: "EXC-047", severity: "High", type: "Client approval stalled", candidate: "Tara Voss", age: "4d", assignee: "Aaron Flores" },
  { id: "EXC-048", severity: "High", type: "Compliance rule conflict", candidate: "Zara Ahmed", age: "1d", assignee: "Compliance" },
  { id: "EXC-049", severity: "Medium", type: "Drug screen appointment missed", candidate: "Ivan Petrov", age: "2d", assignee: "Lena Ortiz" },
  { id: "EXC-050", severity: "Medium", type: "Equipment delayed", candidate: "Fatima Idris", age: "1d", assignee: "IT Ops" },
  { id: "EXC-051", severity: "Medium", type: "Tax form correction needed", candidate: "Mei Lin", age: "12h", assignee: "Riya Kim" },
  { id: "EXC-052", severity: "Medium", type: "Candidate unresponsive 48h", candidate: "Ravi Menon", age: "2d", assignee: "Devon Hughes" },
  { id: "EXC-053", severity: "Medium", type: "E-signature expired", candidate: "Sofia Marin", age: "6h", assignee: "Sasha Patel" },
  { id: "EXC-054", severity: "Medium", type: "Vendor MSA missing", candidate: "Diego Santos", age: "3d", assignee: "Aaron Flores" },
  { id: "EXC-055", severity: "Medium", type: "Duplicate profile detected", candidate: "Carlos Mendez", age: "5h", assignee: "AI Copilot" },
  { id: "EXC-056", severity: "Low", type: "Portal not activated", candidate: "Ben Carter", age: "1d", assignee: "Devon Hughes" },
  { id: "EXC-057", severity: "Low", type: "Training overdue", candidate: "Grace Okafor", age: "2d", assignee: "Riya Kim" },
  { id: "EXC-058", severity: "Low", type: "Address mismatch on W-4", candidate: "Leo Park", age: "4h", assignee: "Riya Kim" },
  { id: "EXC-059", severity: "Low", type: "Missing candidate preference", candidate: "Aisha Bello", age: "6h", assignee: "Lena Ortiz" },
  { id: "EXC-060", severity: "Low", type: "Old package version in use", candidate: "Elena Costa", age: "2d", assignee: "Admin" },
  { id: "EXC-061", severity: "Low", type: "Birthday message approval pending", candidate: "Sarah Chen", age: "1d", assignee: "AI Copilot" },
  { id: "EXC-062", severity: "Low", type: "Benefit enrollment window closing", candidate: "Hannah Park", age: "12h", assignee: "Sasha Patel" },
  { id: "EXC-063", severity: "Low", type: "Work authorization expiring 30d", candidate: "Yuki Tanaka", age: "30d", assignee: "Compliance" },
  { id: "EXC-064", severity: "Low", type: "Incomplete vendor onboarding form", candidate: "Liam Foster", age: "3d", assignee: "Aaron Flores" },
];

type IntegrationStatus = {
  id: string;
  name: string;
  category: string;
  status: "connected" | "warning" | "error";
  detail: string;
};

const INTEGRATIONS: IntegrationStatus[] = [
  { id: "sterling", name: "Sterling", category: "Background", status: "connected", detail: "Last sync 4m ago" },
  { id: "adp", name: "ADP", category: "Payroll", status: "connected", detail: "Last sync 12m ago" },
  { id: "beeline", name: "Beeline VMS", category: "VMS", status: "warning", detail: "3 failed records" },
  { id: "docusign", name: "DocuSign", category: "E-Signature", status: "connected", detail: "Last sync 2m ago" },
  { id: "sinch", name: "Sinch SMS", category: "Comms", status: "warning", detail: "Carrier filter on +1" },
  { id: "telnyx", name: "Telnyx Voice", category: "Comms", status: "connected", detail: "Last sync 1m ago" },
  { id: "jobdiva", name: "JobDiva ATS", category: "ATS", status: "warning", detail: "Auth expiring in 3d" },
];

type LiveEvent = {
  id: string;
  ago: string;
  chip: { label: string; variant: "info" | "danger" | "success" | "warning" | "ai" | "neutral" };
  description: string;
  candidate: string | null;
  action: string | null;
};

const LIVE_EVENTS: LiveEvent[] = [
  { id: "le-1", ago: "14m ago", chip: { label: "DocumentUploaded", variant: "info" }, description: "Government ID re-upload · AI quality check: pending", candidate: "Sarah Chen", action: "Review" },
  { id: "le-2", ago: "22m ago", chip: { label: "SLABreach", variant: "danger" }, description: "W-9 review exceeded 24h SLA · Assigned: Riya Kim", candidate: "Marcus Webb", action: "Escalate" },
  { id: "le-3", ago: "1h ago", chip: { label: "PackageApproved", variant: "success" }, description: "Apex Dynamics NDA approved by client", candidate: "Raj Patel", action: null },
  { id: "le-4", ago: "2h ago", chip: { label: "ScreeningUpdate", variant: "warning" }, description: "Sterling: additional info requested", candidate: "James Rivera", action: "View" },
  { id: "le-5", ago: "3h ago", chip: { label: "IntegrationFailed", variant: "warning" }, description: "Beeline VMS · 3 records failed to sync · Retry: pending", candidate: null, action: "Retry" },
  { id: "le-6", ago: "4h ago", chip: { label: "CandidateLogin", variant: "neutral" }, description: "First portal login · Session: mobile", candidate: "Aisha Bello", action: null },
  { id: "le-7", ago: "4h ago", chip: { label: "DocumentRejected", variant: "danger" }, description: "Government ID · Reason: image blur", candidate: "Sarah Chen", action: "Review" },
  { id: "le-8", ago: "5h ago", chip: { label: "PackageGenerated", variant: "success" }, description: "Skyline Retail package auto-generated", candidate: "Carlos Mendez", action: null },
  { id: "le-9", ago: "6h ago", chip: { label: "AIRecommendation", variant: "ai" }, description: "Start-date risk recalculated for 3 candidates", candidate: null, action: "Review" },
  { id: "le-10", ago: "7h ago", chip: { label: "EquipmentShipped", variant: "info" }, description: "Laptop shipped · FedEx tracking added", candidate: "Grace Okafor", action: null },
  { id: "le-11", ago: "8h ago", chip: { label: "BackgroundCheck", variant: "success" }, description: "Sterling returned clear", candidate: "Grace Okafor", action: null },
  { id: "le-12", ago: "1d ago", chip: { label: "CandidateStarted", variant: "success" }, description: "Day 1 confirmed · Meridian Health", candidate: "Lena Park", action: null },
];

type AiRec = {
  id: string;
  text: string;
  confidence: number;
  primaryAction: string;
};

const AI_RECS: AiRec[] = [
  { id: "ai-1", text: "Re-order drug screening for Carlos — vendor delay likely", confidence: 87, primaryAction: "Approve" },
  { id: "ai-2", text: "Send escalation nudge to Priya's 3 unresponsive candidates", confidence: 91, primaryAction: "Approve" },
  { id: "ai-3", text: "James Rivera's start date likely to miss — adjust to Jun 19?", confidence: 76, primaryAction: "Review" },
  { id: "ai-4", text: "4 packages have outdated drug screen vendor — update recommended", confidence: 88, primaryAction: "Approve" },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-section-heading mb-2.5">{children}</h2>;
}

function EngagementList({
  items,
  icon: Icon,
}: {
  items: EngagementItem[];
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((it) => (
        <li key={it.name} className="flex items-center gap-2.5">
          <span className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full">
            <Icon className="size-3.5" />
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-medium">{it.name}</span>
            <span className="text-metadata truncate">{it.detail}</span>
          </span>
          <Button variant="outline" size="sm" className="ml-auto h-6 shrink-0 px-2 text-[11px]">
            <Send className="size-2.5" /> Draft
          </Button>
        </li>
      ))}
    </ul>
  );
}

const SEVERITY_TONE: Record<ExceptionItem["severity"], { badge: string; count: string }> = {
  Critical: { badge: "bg-danger/10 text-danger-muted-foreground", count: "text-danger-muted-foreground" },
  High:     { badge: "bg-warning/10 text-warning-muted-foreground", count: "text-warning-muted-foreground" },
  Medium:   { badge: "bg-info/10 text-info-muted-foreground", count: "text-info-muted-foreground" },
  Low:      { badge: "bg-neutral/10 text-muted-foreground", count: "text-muted-foreground" },
};

function ExceptionGroup({
  severity,
  items,
  onDrillDown,
}: {
  severity: ExceptionItem["severity"];
  items: ExceptionItem[];
  onDrillDown?: (severity: ExceptionItem["severity"]) => void;
}) {
  const [open, setOpen] = useState(severity === "Critical" || severity === "High");
  const t = SEVERITY_TONE[severity];
  return (
    <div>
      <div className="flex w-full items-center gap-2 py-1.5">
        <button
          type="button"
          onClick={() => onDrillDown?.(severity)}
          className="hover:opacity-80 focus-visible:ring-ring rounded-full transition-opacity focus-visible:ring-2 focus-visible:outline-none"
          aria-label={`Drill into ${severity} exceptions`}
        >
          <span className={cn("inline-block cursor-pointer rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", t.badge)}>
            {severity}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onDrillDown?.(severity)}
          className={cn(
            "hover:underline text-xs font-semibold tabular-nums cursor-pointer",
            t.count,
          )}
        >
          {items.length}
        </button>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="ml-auto"
          aria-expanded={open}
          aria-label={`Toggle ${severity} list`}
        >
          <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>
      </div>
      {open && (
        <ul className="mb-1 flex flex-col gap-1">
          {items.map((ex) => (
            <li key={ex.id} className="flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">{ex.type}</p>
                <p className="text-muted-foreground truncate text-[11px]">
                  {ex.candidate !== "—" ? ex.candidate : "—"} · {ex.age} · {ex.assignee}
                </p>
              </div>
              <Button variant="outline" size="sm" className="h-5 shrink-0 px-1.5 text-[10px]">
                View
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const CHIP_CLASSES: Record<LiveEvent["chip"]["variant"], string> = {
  info:    "bg-info/10 text-info-muted-foreground",
  danger:  "bg-danger/10 text-danger-muted-foreground",
  success: "bg-success/10 text-success-muted-foreground",
  warning: "bg-warning/10 text-warning-muted-foreground",
  ai:      "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  neutral: "bg-muted text-muted-foreground",
};

const INT_STATUS_CLASSES: Record<IntegrationStatus["status"], string> = {
  connected: "bg-success",
  warning:   "bg-warning",
  error:     "bg-danger",
};

// ─── Page ────────────────────────────────────────────────────────────────────

type DrillState =
  | { kind: "stage"; value: string }
  | { kind: "client"; value: string }
  | { kind: "severity"; value: ExceptionItem["severity"] }
  | null;

const CANDIDATE_COLUMNS: DrillDownColumn<CandidateSummary>[] = [
  {
    key: "name",
    label: "Candidate",
    accessor: (r) => <span className="font-medium">{r.name}</span>,
    sortValue: (r) => r.name,
  },
  { key: "role", label: "Role", accessor: (r) => r.role, sortValue: (r) => r.role },
  { key: "client", label: "Client", accessor: (r) => r.client, sortValue: (r) => r.client },
  { key: "stage", label: "Stage", accessor: (r) => r.stage, sortValue: (r) => r.stage },
  {
    key: "startDate",
    label: "Start",
    accessor: (r) => r.startDateLabel,
    sortValue: (r) => r.startInDays,
    align: "right",
  },
  {
    key: "owner",
    label: "Onboarder",
    accessor: (r) => r.onboarder,
    sortValue: (r) => r.onboarder,
  },
];

const EXCEPTION_COLUMNS: DrillDownColumn<ExceptionItem>[] = [
  { key: "id", label: "ID", accessor: (r) => r.id, sortValue: (r) => r.id },
  { key: "type", label: "Issue", accessor: (r) => r.type, sortValue: (r) => r.type },
  {
    key: "candidate",
    label: "Candidate",
    accessor: (r) => r.candidate,
    sortValue: (r) => r.candidate,
  },
  { key: "age", label: "Age", accessor: (r) => r.age, sortValue: (r) => r.age, align: "right" },
  {
    key: "assignee",
    label: "Assignee",
    accessor: (r) => r.assignee,
    sortValue: (r) => r.assignee,
  },
];

export default function CommandCenterPage() {
  const [liveExpanded, setLiveExpanded] = useState(true);
  const [dismissedRecs, setDismissedRecs] = useState<Set<string>>(new Set());
  const [drill, setDrill] = useState<DrillState>(null);
  const topRecommendations = getRecommendations("super-admin").slice(0, 3);

  // Group exceptions by severity
  const severities: ExceptionItem["severity"][] = ["Critical", "High", "Medium", "Low"];
  const excBySeverity = (s: ExceptionItem["severity"]) => EXCEPTIONS.filter((e) => e.severity === s);

  // Drill-down content resolves from the live dataset for the current dimension.
  const drillContent = (() => {
    if (!drill) return null;
    if (drill.kind === "stage") {
      const rows = CANDIDATES.filter((c) => c.stage === drill.value);
      return {
        title: `Stage: ${drill.value}`,
        description: `Candidates currently in the ${drill.value} stage.`,
        columns: CANDIDATE_COLUMNS,
        rows,
      };
    }
    if (drill.kind === "client") {
      const rows = CANDIDATES.filter((c) => c.client === drill.value);
      return {
        title: `Client: ${drill.value}`,
        description: `Active candidates assigned to ${drill.value}.`,
        columns: CANDIDATE_COLUMNS,
        rows,
      };
    }
    const rows = excBySeverity(drill.value);
    return {
      title: `${drill.value} exceptions`,
      description: `Open exceptions at ${drill.value.toLowerCase()} severity.`,
      columns: EXCEPTION_COLUMNS,
      rows,
    };
  })();

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="Command Center"
        description="Super Admin vitals & operations — drill into any line-item record."
        actions={
          <Badge variant="outline" className="gap-1.5">
            <span className="bg-success inline-block size-1.5 animate-pulse rounded-full" />
            Live · mock data
          </Badge>
        }
      />

      {/* AI Morning Briefing (§41.4) */}
      <MorningBriefing />

      {/* Filter Bar (§7.1 top header) */}
      <FilterBar />

      {/* ── SECTION 1: OPERATIONAL VITALS ── */}
      <section>
        <SectionLabel>Operational Vitals</SectionLabel>
        {/* Row 1 — Volume */}
        <div className="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {VITALS_ROW1.map((v) => (
            <StatCard key={v.id} {...v} />
          ))}
        </div>
        {/* Row 2 — Risk/Health (danger/warning tones get colored left border via StatCard's StatusDot) */}
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {VITALS_ROW2.map((v) => (
            <div
              key={v.id}
              className={cn(
                "rounded-xl",
                (v.tone === "danger" || v.tone === "warning") &&
                  "ring-1 ring-inset ring-current/10",
              )}
            >
              <StatCard {...v} />
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 2: PIPELINE + RISK ── */}
      <section>
        <SectionLabel>Pipeline & Risk</SectionLabel>
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Pipeline by Stage */}
          <WidgetCard title="Pipeline by Stage" description="Active candidates per stage · click a stage to drill in">
            <BarList
              rows={PIPELINE_BY_STAGE.map((s) => ({
                name: s.stage,
                value: s.count,
              }))}
              tone="info"
              onRowClick={(name) => setDrill({ kind: "stage", value: name })}
            />
          </WidgetCard>

          {/* Start-Date Confidence */}
          <WidgetCard title="Start-Date Confidence" description="Predictive risk distribution">
            <BarList
              rows={CONFIDENCE_DISTRIBUTION.map((c) => ({
                name: c.label,
                value: c.count,
                tone: c.tone,
              }))}
            />
            {/* Summary counts */}
            <div className="mt-3 flex items-center gap-3 border-t pt-3">
              {CONFIDENCE_DISTRIBUTION.map((c) => (
                <div key={c.level} className="flex flex-col items-center gap-0.5 text-center">
                  <span className="text-base font-semibold tabular-nums">{c.count}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">{c.label}</span>
                </div>
              ))}
            </div>
          </WidgetCard>

          {/* Client Bottleneck Ranking */}
          <WidgetCard
            title="Client Bottleneck Ranking"
            description="Avg days stalled per client · click a client to drill in"
          >
            <BarList
              rows={CLIENT_BOTTLENECKS}
              tone="danger"
              formatValue={(v, u) => `${v}${u ?? ""}`}
              onRowClick={(name) => setDrill({ kind: "client", value: name })}
            />
          </WidgetCard>

          {/* Avg Time-to-Onboard */}
          <WidgetCard title="Avg Time-to-Onboard" description="Rolling 8-week trend">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-3xl font-semibold tabular-nums tracking-tight">
                  11.4
                  <span className="text-muted-foreground ml-1 text-base font-normal">days</span>
                </p>
                <p className="text-success-muted-foreground text-xs font-medium">
                  ↓ 0.2d vs last month
                </p>
              </div>
              <div className="w-28">
                <MiniBars data={TIME_TO_ONBOARD_TREND} tone="success" />
              </div>
            </div>
          </WidgetCard>

          {/* Drop-Off Trend */}
          <WidgetCard title="Drop-Off Trend" description="Last 8 weeks">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-3xl font-semibold tabular-nums tracking-tight">
                  3
                  <span className="text-muted-foreground ml-1 text-base font-normal">this wk</span>
                </p>
                <p className="text-warning-muted-foreground text-xs font-medium">
                  ↑ 1 vs last week
                </p>
              </div>
              <div className="w-28">
                <MiniBars data={DROPOFF_TREND} tone="warning" />
              </div>
            </div>
          </WidgetCard>

          {/* Vendor Turnaround */}
          <WidgetCard title="Vendor Turnaround" description="Avg completion days">
            <BarList
              rows={VENDOR_TURNAROUND}
              tone="info"
              formatValue={(v, u) => `${v}${u ?? ""}`}
            />
          </WidgetCard>
        </div>
      </section>

      {/* ── SECTION 2b: PACKAGE & EXCEPTION OPS TILES ── */}
      <section>
        <SectionLabel>Package & Exception Operations</SectionLabel>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {OPS_TILES.map((t) => (
            <OpsTileCard key={t.id} {...t} />
          ))}
        </div>
      </section>

      {/* ── SECTION 3: EXCEPTIONS + AI RECS + INTEGRATIONS ── */}
      <section>
        <SectionLabel>Exceptions, AI & Integrations</SectionLabel>
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Open Exceptions */}
          <WidgetCard
            title={
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="size-3.5 text-warning-muted-foreground" />
                Open Exceptions
              </span>
            }
            description={`${EXCEPTIONS.length} total · grouped by severity`}
            action={
              <Link href="/planned/exceptions" className="text-muted-foreground hover:text-foreground text-xs transition-colors">
                View all →
              </Link>
            }
          >
            <div className="flex flex-col divide-y">
              {severities.map((s) => (
                <ExceptionGroup
                  key={s}
                  severity={s}
                  items={excBySeverity(s)}
                  onDrillDown={(sev) => setDrill({ kind: "severity", value: sev })}
                />
              ))}
            </div>
          </WidgetCard>

          {/* AI Recommendations */}
          <WidgetCard
            title={
              <span className="flex items-center gap-1.5">
                <Sparkles className="text-ai size-3.5" />
                AI Recommendations
              </span>
            }
            description="Pending actions awaiting approval"
            action={
              <Link href="/my-work" className="text-muted-foreground hover:text-foreground text-xs transition-colors">
                View all →
              </Link>
            }
          >
            {/* Inline AI recs first (custom compact style) */}
            <div className="mb-3 flex flex-col gap-2">
              {AI_RECS.filter((r) => !dismissedRecs.has(r.id)).map((rec) => (
                <div
                  key={rec.id}
                  className="border-ai/20 bg-ai/5 flex items-start gap-2 rounded-lg border px-2.5 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium leading-snug">{rec.text}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="inline-block size-1.5 rounded-full bg-success" />
                      <span className="text-muted-foreground text-[10px]">{rec.confidence}% confidence</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      className="rounded bg-success-muted px-1.5 py-0.5 text-[10px] font-medium text-success-muted-foreground hover:opacity-80"
                    >
                      {rec.primaryAction}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDismissedRecs((prev) => new Set([...prev, rec.id]))}
                      className="rounded border px-1.5 py-0.5 text-[10px] font-medium hover:bg-muted"
                      aria-label="Dismiss"
                    >
                      <X className="size-2.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {/* Full RecommendationCards below */}
            <div className="border-t pt-3">
              <p className="text-data-label mb-2">Detailed recommendations</p>
              <div className="flex flex-col gap-2">
                {topRecommendations.map((rec) => (
                  <RecommendationCard key={rec.id} recommendation={rec} compact />
                ))}
              </div>
            </div>
          </WidgetCard>

          {/* Integration Health */}
          <WidgetCard
            title={
              <span className="flex items-center gap-1.5">
                <Wifi className="size-3.5 text-info-muted-foreground" />
                Integration Health
              </span>
            }
            description="Connector status · real-time"
            action={
              <Link href="/planned/integrations" className="text-muted-foreground hover:text-foreground text-xs transition-colors">
                View all →
              </Link>
            }
          >
            <ul className="flex flex-col divide-y">
              {INTEGRATIONS.map((int) => (
                <li key={int.id} className="flex items-center gap-2.5 py-2">
                  <span
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      INT_STATUS_CLASSES[int.status],
                      int.status === "connected" && "animate-pulse",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-sm font-medium leading-tight">
                      {int.name}
                      <span className="text-muted-foreground text-[10px] font-normal">
                        {int.category}
                      </span>
                    </p>
                    <p
                      className={cn(
                        "text-[11px]",
                        int.status === "connected" ? "text-muted-foreground" : "text-warning-muted-foreground font-medium",
                      )}
                    >
                      {int.detail}
                    </p>
                  </div>
                  {int.status !== "connected" && (
                    <Button variant="outline" size="sm" className="h-5 shrink-0 px-1.5 text-[10px]">
                      {int.status === "warning" ? "Fix" : "Retry"}
                    </Button>
                  )}
                  {int.status !== "connected" && (
                    <WifiOff className="size-3.5 text-warning-muted-foreground shrink-0" />
                  )}
                </li>
              ))}
            </ul>
            {/* Compliance pass rate mini card */}
            <div className="mt-3 rounded-lg border p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-data-label">Compliance Pass Rate</span>
                <span className="text-success-muted-foreground text-xs font-semibold">92.4%</span>
              </div>
              <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                <span className="bg-success block h-full rounded-full" style={{ width: "92.4%" }} />
              </div>
              <p className="text-metadata mt-1">+1.8% vs last month</p>
            </div>
          </WidgetCard>
        </div>
      </section>

      {/* ── SECTION 4: CULTURE & ENGAGEMENT ── */}
      <section>
        <SectionLabel>Culture & Engagement</SectionLabel>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <WidgetCard title="Upcoming Birthdays">
            <EngagementList items={BIRTHDAYS} icon={Cake} />
          </WidgetCard>
          <WidgetCard title="Work Anniversaries">
            <EngagementList items={ANNIVERSARIES} icon={Trophy} />
          </WidgetCard>
          <WidgetCard title="Upcoming Milestones">
            <EngagementList items={MILESTONES} icon={Gift} />
          </WidgetCard>
          {/* New starts today */}
          <WidgetCard
            title="New Start Today"
            action={<Badge variant="secondary" className="gap-1 text-[10px]"><PartyPopper className="size-3" /> Day 1</Badge>}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <span className="bg-success-muted text-success-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                  GO
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">Grace Okafor</p>
                  <p className="text-metadata truncate">Meridian Health · Jun 8</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full gap-1.5">
                <Send className="size-3.5" /> Send Day 1 greeting
              </Button>
              <WidgetCard
                title="AI Celebration Drafts"
                action={<Badge variant="secondary" className="gap-1 text-[10px]">4 pending</Badge>}
              >
                <p className="text-muted-foreground mb-3 text-sm">
                  4 personalized messages drafted and awaiting approval.
                </p>
                <Button variant="outline" size="sm" className="w-full" disabled>
                  <PartyPopper className="size-3.5" /> Review & approve (v0.9)
                </Button>
              </WidgetCard>
            </div>
          </WidgetCard>
        </div>
      </section>

      {/* ── SECTION 5: LIVE EVENT FEED ── */}
      <section>
        <div className="bg-card rounded-xl border shadow-xs">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-3 border-b px-4 py-2.5">
            <h2 className="text-card-heading flex items-center gap-2">
              Live System Events
              <span className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
                <span className="bg-success size-1.5 animate-pulse rounded-full inline-block" />
                LIVE
              </span>
            </h2>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground h-7 gap-1.5 text-xs font-normal"
              >
                <RefreshCw className="size-3" /> Refresh
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs font-normal">
                Filter
              </Button>
              <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs font-normal">
                <Download className="size-3" /> Export
              </Button>
              <button
                type="button"
                onClick={() => setLiveExpanded((v) => !v)}
                className="text-muted-foreground hover:text-foreground ml-1 flex items-center gap-0.5 text-xs"
                aria-expanded={liveExpanded}
              >
                <ChevronDown className={cn("size-4 transition-transform", liveExpanded && "rotate-180")} />
              </button>
            </div>
          </div>

          {/* Event list */}
          {liveExpanded && (
            <div className="max-h-80 overflow-y-auto">
              <ul className="flex flex-col divide-y" style={{ fontSize: "var(--table-font)" }}>
                {LIVE_EVENTS.map((ev) => (
                  <li
                    key={ev.id}
                    className="flex items-center gap-3 px-4 hover:bg-muted/40 transition-colors"
                    style={{ height: "var(--row-h)" }}
                  >
                    {/* Chip */}
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase whitespace-nowrap",
                        CHIP_CLASSES[ev.chip.variant],
                      )}
                    >
                      {ev.chip.label}
                    </span>
                    {/* Timestamp */}
                    <span className="w-14 shrink-0 text-muted-foreground tabular-nums whitespace-nowrap">
                      {ev.ago}
                    </span>
                    {/* Description */}
                    <span className="min-w-0 flex-1 truncate text-sm">{ev.description}</span>
                    {/* Candidate */}
                    {ev.candidate && (
                      <span className="hidden text-muted-foreground whitespace-nowrap sm:inline text-xs">
                        {ev.candidate}
                      </span>
                    )}
                    {/* Action */}
                    {ev.action && (
                      <Button variant="outline" size="sm" className="h-6 shrink-0 px-2 text-[10px]">
                        {ev.action}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* ── BOTTOM: FULL GRANULAR LINE-ITEM FEED ── */}
      <EventFeed />

      {/* Drill-down sheet — opens when any chart row is clicked (§7.1, §50). */}
      {drillContent && (
        <DrillDownSheet
          open={drill !== null}
          onOpenChange={(o) => {
            if (!o) setDrill(null);
          }}
          title={drillContent.title}
          description={drillContent.description}
          columns={drillContent.columns as DrillDownColumn<unknown>[]}
          rows={drillContent.rows as unknown[]}
        />
      )}
    </PageContainer>
  );
}
