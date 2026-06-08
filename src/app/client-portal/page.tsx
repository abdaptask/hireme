"use client";

import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Clock,
  Download,
  FileText,
  Lock,
  MessageSquare,
  Send,
  ShieldCheck,
  Tag,
  Users,
  Zap,
} from "lucide-react";
import {
  StatusBadge,
  StatusDot,
} from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StatusTone } from "@/lib/types";

// ---------------------------------------------------------------------------
// Static mock data — Meridian Health client view (§27)
// No pay rates, no internal notes, no other clients, no internal AI analysis
// ---------------------------------------------------------------------------

const CLIENT_NAME = "Meridian Health";
const USER_NAME = "Laura";

const ONBOARDING_PIPELINE = [
  {
    id: "james-rivera",
    name: "James Rivera",
    role: "IT Consultant",
    location: "Remote · Austin, TX",
    startDateLabel: "Jun 12",
    startInDays: 5,
    stage: "Background Check",
    status: "needs-attention" as const,
    risk: "needs-attention" as const,
    progress: 62,
    employmentType: "W-2",
    compliance: { done: true, label: "Complete" },
    screening: { done: false, label: "In Progress" },
    equipment: { done: false, label: "Pending" },
    clientApproval: { done: false, label: "Awaiting You" },
    approvalNeeded: true,
    approvalDeadline: "Jun 10",
    workerIdNeeded: false,
    clientWorkerId: "MH-JAR-204",
  },
  {
    id: "grace-okafor",
    name: "Grace Okafor",
    role: "Data Analyst",
    location: "Onsite · Houston, TX",
    startDateLabel: "Jun 08",
    startInDays: 1,
    stage: "Day 1 Prep",
    status: "on-track" as const,
    risk: "on-track" as const,
    progress: 91,
    employmentType: "W-2",
    compliance: { done: true, label: "Complete" },
    screening: { done: true, label: "Clear" },
    equipment: { done: true, label: "Delivered" },
    clientApproval: { done: true, label: "Approved" },
    approvalNeeded: false,
    approvalDeadline: null,
    workerIdNeeded: false,
    clientWorkerId: "MH-GOK-205",
  },
  {
    id: "sarah-chen",
    name: "Sarah Chen",
    role: "Senior Data Analyst",
    location: "Remote · Seattle, WA",
    startDateLabel: "Jun 15",
    startInDays: 8,
    stage: "Document Submission",
    status: "at-risk" as const,
    risk: "at-risk" as const,
    progress: 38,
    employmentType: "W-2",
    compliance: { done: false, label: "Incomplete" },
    screening: { done: false, label: "Not Started" },
    equipment: { done: false, label: "Not Started" },
    clientApproval: { done: false, label: "Blocked" },
    approvalNeeded: false,
    approvalDeadline: null,
    workerIdNeeded: true,
    clientWorkerId: null,
  },
];

const START_FORECAST = [
  {
    date: "Jun 8",
    name: "Grace Okafor",
    role: "Data Analyst",
    confirmed: true,
    risk: "on-track" as const,
  },
  {
    date: "Jun 12",
    name: "James Rivera",
    role: "IT Consultant",
    confirmed: false,
    risk: "needs-attention" as const,
  },
  {
    date: "Jun 15",
    name: "Sarah Chen",
    role: "Senior Data Analyst",
    confirmed: false,
    risk: "at-risk" as const,
  },
];

const ACTIVE_CONSULTANTS = [
  {
    id: "c1",
    name: "Dr. Maria Santos",
    role: "Clinical Director",
    started: "Jan 15, 2025",
    endDate: "Dec 31, 2025",
    status: "Active",
    timesheetStatus: "Submitted",
    contactEmail: "m.santos@meridian.com",
  },
  {
    id: "c2",
    name: "Kevin Zhao",
    role: "EHR Specialist",
    started: "Mar 3, 2025",
    endDate: "Sep 3, 2025",
    status: "Active",
    timesheetStatus: "Approved",
    contactEmail: "k.zhao@meridian.com",
  },
  {
    id: "c3",
    name: "Priya Nair",
    role: "Health IT Analyst",
    started: "Apr 21, 2025",
    endDate: "Oct 21, 2025",
    status: "Active",
    timesheetStatus: "Pending",
    contactEmail: "p.nair@meridian.com",
  },
  {
    id: "c4",
    name: "Carlos Mendez",
    role: "Compliance Auditor",
    started: "Feb 10, 2025",
    endDate: "Aug 10, 2025",
    status: "Active",
    timesheetStatus: "Approved",
    contactEmail: "c.mendez@meridian.com",
  },
];

const COMPLIANCE_ITEMS = [
  { label: "HIPAA Training", done: true },
  { label: "Background Check", done: true },
  { label: "Drug Screen", done: true },
  { label: "Professional License", done: true },
  { label: "NDA Signed", done: true },
  { label: "State Credential Verification", expiringDays: 14, done: false },
];

const MESSAGES = [
  {
    id: "m1",
    from: "Riya Kim",
    role: "Onboarding Specialist",
    time: "Today, 9:41 AM",
    text: "Grace Okafor is fully confirmed for her Jun 8 start. Her equipment was delivered and IT access activated yesterday. Please reach out to your IT contact to ensure her workstation is ready.",
    initials: "RK",
  },
  {
    id: "m2",
    from: "Devon Hughes",
    role: "Recruiter",
    time: "Yesterday, 4:15 PM",
    text: "James Rivera's background check is still in progress — we're tracking it closely and expect results by Jun 10. We'll need your approval on his onboarding package before then. Let us know if you have any questions.",
    initials: "DH",
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  tone = "default",
  sub,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  suffix?: string;
  tone?: "default" | "warning" | "success" | "danger";
  sub?: string;
}) {
  return (
    <div className="bg-card flex flex-col gap-1 rounded-xl border p-4 shadow-xs">
      <span
        className={cn(
          "mb-1 flex size-8 items-center justify-center rounded-lg",
          tone === "warning"
            ? "bg-warning-muted text-warning-muted-foreground"
            : tone === "success"
              ? "bg-success-muted text-success-muted-foreground"
              : tone === "danger"
                ? "bg-danger-muted text-danger-muted-foreground"
                : "bg-primary/10 text-primary",
        )}
      >
        <Icon className="size-4" />
      </span>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold tabular-nums tracking-tight">
          {value}
        </span>
        {suffix && (
          <span className="text-muted-foreground text-sm">{suffix}</span>
        )}
      </div>
      <p className="text-data-label leading-none">{label}</p>
      {sub && <p className="text-metadata mt-0.5">{sub}</p>}
    </div>
  );
}


function ReadinessChip({
  label,
  done,
  partial,
  blocked,
}: {
  label: string;
  done: boolean;
  partial?: boolean;
  blocked?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        done
          ? "bg-success-muted text-success-muted-foreground"
          : blocked
            ? "bg-danger-muted text-danger-muted-foreground"
            : partial
              ? "bg-warning-muted text-warning-muted-foreground"
              : "bg-muted text-muted-foreground",
      )}
    >
      {done ? (
        <CheckCircle2 className="size-3 shrink-0" />
      ) : blocked ? (
        <AlertCircle className="size-3 shrink-0" />
      ) : partial ? (
        <Clock className="size-3 shrink-0" />
      ) : (
        <CircleDashed className="size-3 shrink-0" />
      )}
      {label}
    </span>
  );
}

function ProgressBar({
  value,
  risk,
}: {
  value: number;
  risk: "on-track" | "needs-attention" | "at-risk";
}) {
  return (
    <div className="bg-muted h-1.5 w-full rounded-full overflow-hidden">
      <div
        className={cn(
          "h-full rounded-full transition-all",
          risk === "on-track"
            ? "bg-success"
            : risk === "needs-attention"
              ? "bg-warning"
              : "bg-danger",
        )}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function OnboardingCard({
  c,
}: {
  c: (typeof ONBOARDING_PIPELINE)[number];
}) {
  const initials = c.name
    .split(" ")
    .map((n) => n[0])
    .join("");

  const riskTone: StatusTone =
    c.risk === "on-track"
      ? "success"
      : c.risk === "needs-attention"
        ? "warning"
        : "danger";

  return (
    <div
      className={cn(
        "bg-card flex flex-col gap-4 rounded-xl border p-5 shadow-xs transition-shadow hover:shadow-sm",
        c.approvalNeeded && "border-warning/40",
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
            c.risk === "on-track"
              ? "bg-success-muted text-success-muted-foreground"
              : c.risk === "needs-attention"
                ? "bg-warning-muted text-warning-muted-foreground"
                : "bg-danger-muted text-danger-muted-foreground",
          )}
        >
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="font-semibold">{c.name}</p>
            <StatusBadge tone={riskTone}>
              <StatusDot tone={riskTone} />
              {c.risk === "on-track"
                ? "On Track"
                : c.risk === "needs-attention"
                  ? "Needs Attention"
                  : "At Risk"}
            </StatusBadge>
          </div>
          <p className="text-muted-foreground text-sm">{c.role}</p>
          <p className="text-metadata mt-0.5">{c.location}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-data-label text-[11px]">START DATE</p>
          <p className="text-sm font-bold">{c.startDateLabel}</p>
          <p className="text-metadata">
            {c.startInDays === 1
              ? "Tomorrow"
              : `in ${c.startInDays} days`}
          </p>
        </div>
      </div>

      {/* Stage + progress */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Badge variant="secondary" className="text-[11px] font-medium">
              {c.stage}
            </Badge>
          </div>
          <span className="text-metadata">{c.progress}% complete</span>
        </div>
        <ProgressBar value={c.progress} risk={c.risk} />
      </div>

      {/* Readiness indicators */}
      <div className="flex flex-wrap gap-1.5">
        <ReadinessChip
          label={`Compliance · ${c.compliance.label}`}
          done={c.compliance.done}
        />
        <ReadinessChip
          label={`Screening · ${c.screening.label}`}
          done={c.screening.done}
          partial={c.screening.label === "In Progress"}
        />
        <ReadinessChip
          label={`Equipment · ${c.equipment.label}`}
          done={c.equipment.done}
        />
        <ReadinessChip
          label={`Client Approval · ${c.clientApproval.label}`}
          done={c.clientApproval.done}
          blocked={c.clientApproval.label === "Blocked" || c.clientApproval.label === "Awaiting You"}
          partial={c.clientApproval.label === "Awaiting You"}
        />
      </div>

      {/* Action banner */}
      {c.approvalNeeded && (
        <div className="bg-warning-muted/40 border-warning/30 flex items-start gap-2.5 rounded-lg border px-3 py-2.5">
          <AlertTriangle className="text-warning mt-0.5 size-4 shrink-0" />
          <div className="min-w-0 flex-1 text-sm">
            <p className="text-warning-muted-foreground font-medium">
              Your approval is needed
            </p>
            <p className="text-muted-foreground text-xs mt-0.5">
              Package approval required by {c.approvalDeadline} to keep the
              start date on track.
            </p>
          </div>
          <Button size="sm" className="shrink-0">
            <CheckCircle2 className="size-3.5" />
            Approve
          </Button>
        </div>
      )}

      {/* Worker ID prompt */}
      {c.workerIdNeeded && (
        <div className="bg-info-muted/30 border-info/20 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
          <Tag className="text-info size-3.5 shrink-0" />
          <span className="text-muted-foreground flex-1">
            Add a worker ID for this consultant to complete setup.
          </span>
          <Button size="sm" variant="outline">
            <Tag className="size-3.5" /> Add ID
          </Button>
        </div>
      )}

      {/* Footer actions */}
      <div className="flex flex-wrap items-center gap-2 border-t pt-3">
        {c.clientWorkerId && (
          <span className="text-metadata flex items-center gap-1">
            <Tag className="size-3" /> {c.clientWorkerId}
          </span>
        )}
        <div className="ml-auto flex gap-1.5">
          {!c.approvalNeeded && (
            <Button size="sm" variant="outline">
              <CheckCircle2 className="size-3.5" />
              Confirm start
            </Button>
          )}
          <Button size="sm" variant="ghost">
            <MessageSquare className="size-3.5" />
            Message
          </Button>
          <Button size="sm" variant="ghost">
            <FileText className="size-3.5" />
            View details
          </Button>
        </div>
      </div>
    </div>
  );
}

function ForecastRow({
  item,
}: {
  item: (typeof START_FORECAST)[number];
}) {
  const tone: StatusTone =
    item.risk === "on-track"
      ? "success"
      : item.risk === "needs-attention"
        ? "warning"
        : "danger";

  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="bg-muted flex h-10 w-14 shrink-0 flex-col items-center justify-center rounded-lg text-center">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground leading-none">
          {item.date.split(" ")[0]}
        </span>
        <span className="text-base font-bold leading-tight tabular-nums">
          {item.date.split(" ")[1]}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{item.name}</p>
        <p className="text-metadata">{item.role}</p>
      </div>
      {item.confirmed ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-success-muted px-2.5 py-1 text-xs font-medium text-success-muted-foreground">
          <CheckCircle2 className="size-3" /> Confirmed
        </span>
      ) : (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
            tone === "warning"
              ? "bg-warning-muted text-warning-muted-foreground"
              : "bg-danger-muted text-danger-muted-foreground",
          )}
        >
          {tone === "warning" ? (
            <AlertTriangle className="size-3" />
          ) : (
            <AlertCircle className="size-3" />
          )}
          {tone === "warning" ? "At Risk" : "Action Needed"}
        </span>
      )}
    </div>
  );
}

function ComplianceSnapshot() {
  const passCount = COMPLIANCE_ITEMS.filter((i) => i.done).length;
  const passRate = Math.round((passCount / COMPLIANCE_ITEMS.length) * 100);
  const expiring = COMPLIANCE_ITEMS.find((i) => i.expiringDays !== undefined);

  return (
    <div className="bg-card rounded-xl border p-5 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-success size-4" />
          <h3 className="font-semibold">Compliance Snapshot</h3>
        </div>
        <span className="text-success-muted-foreground bg-success-muted rounded-full px-2.5 py-0.5 text-xs font-semibold">
          {passRate}% pass rate
        </span>
      </div>

      {expiring && (
        <div className="bg-warning-muted/40 border-warning/20 mb-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs">
          <AlertTriangle className="text-warning size-3.5 shrink-0" />
          <span className="text-warning-muted-foreground font-medium">
            1 document expiring in {expiring.expiringDays} days
          </span>
          <span className="text-muted-foreground">— renewal in progress</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {COMPLIANCE_ITEMS.map((item) => (
          <span
            key={item.label}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
              item.done
                ? "bg-success-muted text-success-muted-foreground"
                : "bg-warning-muted text-warning-muted-foreground",
            )}
          >
            {item.done ? (
              <BadgeCheck className="size-3" />
            ) : (
              <AlertTriangle className="size-3" />
            )}
            {item.label}
          </span>
        ))}
      </div>

      <p className="text-metadata mt-3">
        Background checks: all current · Screening vendor: HireRight
      </p>
    </div>
  );
}

function ActiveConsultantsTable() {
  return (
    <div className="bg-card rounded-xl border shadow-xs">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div className="flex items-center gap-2">
          <Users className="text-muted-foreground size-4" />
          <h3 className="font-semibold">Active Consultants</h3>
          <Badge variant="secondary" className="text-[11px]">
            {ACTIVE_CONSULTANTS.length}
          </Badge>
        </div>
        <Button variant="ghost" size="sm">
          <Download className="size-3.5" />
          Export
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Name
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Role
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Started
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                End Date
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Timesheet
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {ACTIVE_CONSULTANTS.map((c, i) => (
              <tr
                key={c.id}
                className={cn(
                  "group transition-colors hover:bg-muted/30",
                  i !== ACTIVE_CONSULTANTS.length - 1 && "border-b",
                )}
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold">
                      {c.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                    <span className="font-medium">{c.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{c.role}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.started}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.endDate}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                      c.timesheetStatus === "Approved"
                        ? "bg-success-muted text-success-muted-foreground"
                        : c.timesheetStatus === "Submitted"
                          ? "bg-info-muted text-info-muted-foreground"
                          : "bg-warning-muted text-warning-muted-foreground",
                    )}
                  >
                    {c.timesheetStatus === "Approved" ? (
                      <CheckCircle2 className="size-3" />
                    ) : c.timesheetStatus === "Submitted" ? (
                      <Clock className="size-3" />
                    ) : (
                      <CircleDashed className="size-3" />
                    )}
                    {c.timesheetStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 h-7"
                  >
                    <ChevronRight className="size-3.5" />
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SecureMessaging() {
  const [message, setMessage] = useState("");

  return (
    <div className="bg-card rounded-xl border shadow-xs">
      <div className="flex items-center gap-2 border-b px-5 py-4">
        <MessageSquare className="text-muted-foreground size-4" />
        <h3 className="font-semibold">Secure Messages</h3>
        <Badge
          variant="secondary"
          className="bg-primary/10 text-primary text-[11px]"
        >
          2 unread
        </Badge>
        <div className="ml-auto flex items-center gap-1 text-muted-foreground">
          <Lock className="size-3" />
          <span className="text-xs">End-to-end secure</span>
        </div>
      </div>

      <div className="flex flex-col gap-0 divide-y">
        {MESSAGES.map((msg) => (
          <div key={msg.id} className="px-5 py-4">
            <div className="flex items-start gap-3">
              <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                {msg.initials}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <p className="text-sm font-semibold">{msg.from}</p>
                  <p className="text-metadata">{msg.role}</p>
                  <p className="text-metadata ml-auto">{msg.time}</p>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {msg.text}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message your staffing team…"
            rows={2}
            className="bg-muted/50 border-muted focus:border-primary flex-1 resize-none rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:ring-1 focus:ring-primary/30"
          />
          <Button
            size="icon"
            className="h-auto self-end px-3 py-2.5"
            disabled={!message.trim()}
            onClick={() => setMessage("")}
          >
            <Send className="size-4" />
          </Button>
        </div>
        <p className="text-metadata mt-2">
          Messages are delivered to your assigned staffing team and are not
          shared externally.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ClientPortalPage() {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const onboardingCount = ONBOARDING_PIPELINE.length;
  const startingThisWeek = ONBOARDING_PIPELINE.filter(
    (c) => c.startInDays <= 7,
  ).length;
  const needsAttention = ONBOARDING_PIPELINE.filter(
    (c) => c.approvalNeeded,
  ).length;
  const actionItem = ONBOARDING_PIPELINE.find((c) => c.approvalNeeded);

  return (
    <div className="flex flex-col gap-6">
      {/* ---- Greeting header ---- */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-page-title">
            {greeting}, {USER_NAME} —{" "}
            <span className="text-muted-foreground font-normal">
              {CLIENT_NAME}
            </span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            You have {onboardingCount} consultants onboarding,{" "}
            {startingThisWeek} starting this week
            {needsAttention > 0 &&
              `, and ${needsAttention} item requiring your attention`}
            .
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="size-4" />
          Download report
        </Button>
      </div>

      {/* ---- Action alert ---- */}
      {actionItem && (
        <div className="bg-warning-muted/30 border-warning/30 flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3">
          <Zap className="text-warning size-4 shrink-0" />
          <div className="flex-1 text-sm">
            <span className="font-semibold">Action required: </span>
            <span className="text-muted-foreground">
              Approve {actionItem.name}&apos;s onboarding package — needed by{" "}
              {actionItem.approvalDeadline}
            </span>
          </div>
          <Button size="sm">
            <CheckCircle2 className="size-3.5" />
            Review &amp; Approve
          </Button>
        </div>
      )}

      {/* ---- Privacy notice ---- */}
      <div className="text-muted-foreground flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-xs">
        <Lock className="size-3.5 shrink-0" />
        You only see consultants assigned to {CLIENT_NAME}. Pay rates, internal
        notes, and screening results are never shown.
      </div>

      {/* ---- Stats row ---- */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={Users}
          label="Active Consultants"
          value={ACTIVE_CONSULTANTS.length}
          sub="currently placed"
        />
        <StatCard
          icon={CalendarDays}
          label="Onboarding Now"
          value={onboardingCount}
          sub="in progress"
          tone="default"
        />
        <StatCard
          icon={Zap}
          label="Starting This Week"
          value={startingThisWeek}
          sub="next 7 days"
          tone="warning"
        />
        <StatCard
          icon={ShieldCheck}
          label="Compliance Rate"
          value="97"
          suffix="%"
          sub="all consultants"
          tone="success"
        />
      </div>

      {/* ---- Onboarding pipeline ---- */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-section-heading">Onboarding Pipeline</h2>
          <Badge variant="secondary" className="text-[11px]">
            {onboardingCount} consultants
          </Badge>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ONBOARDING_PIPELINE.map((c) => (
            <OnboardingCard key={c.id} c={c} />
          ))}
        </div>
      </section>

      {/* ---- Start date forecast + compliance (side by side on wide screens) ---- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Forecast */}
        <div className="bg-card rounded-xl border p-5 shadow-xs">
          <div className="mb-1 flex items-center gap-2">
            <CalendarDays className="text-muted-foreground size-4" />
            <h3 className="font-semibold">Start Date Forecast</h3>
            <span className="text-muted-foreground ml-auto text-xs">
              Next 14 days
            </span>
          </div>
          <p className="text-metadata mb-4">
            Confirmed starts are locked in. At-risk dates require action.
          </p>
          <div className="divide-y">
            {START_FORECAST.map((item) => (
              <ForecastRow key={item.name} item={item} />
            ))}
          </div>
        </div>

        {/* Compliance snapshot */}
        <ComplianceSnapshot />
      </div>

      {/* ---- Active consultants table ---- */}
      <ActiveConsultantsTable />

      {/* ---- Secure messaging ---- */}
      <SecureMessaging />

      {/* ---- Footer note ---- */}
      <p className="text-muted-foreground flex items-center justify-center gap-1.5 py-2 text-xs">
        <Badge variant="secondary" className="text-[10px]">
          Client view
        </Badge>
        Changes you make — worker IDs, approvals, start confirmations — are
        delivered to the staffing team automatically.
      </p>
    </div>
  );
}
