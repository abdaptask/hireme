"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Lock,
  RefreshCw,
  FlaskConical,
  CalendarClock,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { StatTile } from "@/components/workspace/stat-tile";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import { SCREENING_STATUS_META } from "@/lib/screening";
import type {
  DrugTestStatus,
  ScreeningRecord,
  ScreeningStatus,
} from "@/lib/screening";

// ---------------------------------------------------------------------------
// Types for new mock data
// ---------------------------------------------------------------------------

type AdjudicationStep =
  | "pre-adverse-sent"
  | "awaiting-response"
  | "final-decision-required";

type AdjudicationCase = {
  id: string;
  initials: string;
  client: string;
  screeningType: string;
  findingSummary: string;
  responsePeriodStatus: string;
  daysRemaining: number;
  step: AdjudicationStep;
};

type DrugTestRecord = {
  id: string;
  candidateName: string;
  candidateId: string;
  testType: string;
  collectionSite: string;
  appointmentDate: string;
  appointmentTime: string;
  status: "scheduled" | "completed" | "no-show" | "rescheduled" | "results-pending";
  collector: string;
  result: "negative" | "positive" | "dilute" | "pending" | "—";
};

type ExpiringRecord = {
  id: string;
  candidateName: string;
  candidateId: string;
  client: string;
  screeningType: string;
  completionDate: string;
  expirationDate: string;
  daysUntilExpiry: number;
  expiryStatus: "active" | "expiring" | "expired";
};

// ---------------------------------------------------------------------------
// Mock data — Adjudication queue
// ---------------------------------------------------------------------------

const ADJUDICATION_CASES: AdjudicationCase[] = [
  {
    id: "ADJ-001",
    initials: "DS",
    client: "Cobalt Systems",
    screeningType: "Criminal — Standard 7yr",
    findingSummary: "Review required — 1 item",
    responsePeriodStatus: "Not yet initiated",
    daysRemaining: 0,
    step: "final-decision-required",
  },
  {
    id: "ADJ-002",
    initials: "FI",
    client: "Cobalt Systems",
    screeningType: "Criminal — Standard 7yr",
    findingSummary: "Review required — 1 item",
    responsePeriodStatus: "Pre-adverse notice sent Jun 5",
    daysRemaining: 5,
    step: "awaiting-response",
  },
];

// ---------------------------------------------------------------------------
// Mock data — Drug test tracker
// ---------------------------------------------------------------------------

const DRUG_TEST_RECORDS: DrugTestRecord[] = [
  {
    id: "DT-001",
    candidateName: "Grace Okafor",
    candidateId: "grace-okafor",
    testType: "10-panel",
    collectionSite: "LabCorp — Midtown NY",
    appointmentDate: "May 21, 2026",
    appointmentTime: "9:00 AM",
    status: "completed",
    collector: "LabCorp",
    result: "negative",
  },
  {
    id: "DT-002",
    candidateName: "James Rivera",
    candidateId: "james-rivera",
    testType: "5-panel",
    collectionSite: "Quest — Union Square",
    appointmentDate: "Jun 9, 2026",
    appointmentTime: "10:30 AM",
    status: "scheduled",
    collector: "Quest Diagnostics",
    result: "pending",
  },
  {
    id: "DT-003",
    candidateName: "Sarah Chen",
    candidateId: "sarah-chen",
    testType: "10-panel",
    collectionSite: "LabCorp — Brooklyn",
    appointmentDate: "Jun 10, 2026",
    appointmentTime: "8:30 AM",
    status: "rescheduled",
    collector: "LabCorp",
    result: "pending",
  },
  {
    id: "DT-004",
    candidateName: "Marcus Webb",
    candidateId: "marcus-webb",
    testType: "5-panel",
    collectionSite: "Quest — Jersey City",
    appointmentDate: "Jun 9, 2026",
    appointmentTime: "2:00 PM",
    status: "scheduled",
    collector: "Quest Diagnostics",
    result: "pending",
  },
  {
    id: "DT-005",
    candidateName: "Tara Voss",
    candidateId: "tara-voss",
    testType: "10-panel",
    collectionSite: "LabCorp — Midtown NY",
    appointmentDate: "Jun 3, 2026",
    appointmentTime: "11:00 AM",
    status: "no-show",
    collector: "LabCorp",
    result: "—",
  },
];

// ---------------------------------------------------------------------------
// Mock data — Expiring screenings
// ---------------------------------------------------------------------------

const EXPIRING_RECORDS: ExpiringRecord[] = [
  {
    id: "EXP-001",
    candidateName: "Grace Okafor",
    candidateId: "grace-okafor",
    client: "Meridian Health",
    screeningType: "Enhanced 10yr Background Check",
    completionDate: "May 27, 2026",
    expirationDate: "Jun 26, 2026",
    daysUntilExpiry: 19,
    expiryStatus: "expiring",
  },
  {
    id: "EXP-002",
    candidateName: "Mei Lin",
    candidateId: "mei-lin",
    client: "Atlas Manufacturing",
    screeningType: "Standard 7yr Background Check",
    completionDate: "May 31, 2026",
    expirationDate: "Jun 14, 2026",
    daysUntilExpiry: 7,
    expiryStatus: "expiring",
  },
  {
    id: "EXP-003",
    candidateName: "James Rivera",
    candidateId: "james-rivera",
    client: "Meridian Health",
    screeningType: "Enhanced 10yr Background Check",
    completionDate: "Jun 4, 2026",
    expirationDate: "Jul 4, 2026",
    daysUntilExpiry: 27,
    expiryStatus: "active",
  },
  {
    id: "EXP-004",
    candidateName: "Sarah Chen",
    candidateId: "sarah-chen",
    client: "Atlas Manufacturing",
    screeningType: "Enhanced 10yr Background Check",
    completionDate: "Apr 10, 2026",
    expirationDate: "Jun 1, 2026",
    daysUntilExpiry: -6,
    expiryStatus: "expired",
  },
  {
    id: "EXP-005",
    candidateName: "Diego Santos",
    candidateId: "diego-santos",
    client: "Cobalt Systems",
    screeningType: "Standard 7yr Background Check",
    completionDate: "Mar 20, 2026",
    expirationDate: "Jun 4, 2026",
    daysUntilExpiry: -3,
    expiryStatus: "expired",
  },
];

// ---------------------------------------------------------------------------
// Label maps
// ---------------------------------------------------------------------------

const DRUG_TEST_LABELS: Record<DrugTestStatus, { label: string; className: string }> = {
  "not-ordered": { label: "Not Ordered",  className: "text-muted-foreground/60" },
  scheduled:     { label: "Scheduled",    className: "text-info-muted-foreground" },
  completed:     { label: "Completed",    className: "text-success-muted-foreground" },
  missed:        { label: "Missed",       className: "text-danger-muted-foreground" },
  rescheduled:   { label: "Rescheduled",  className: "text-warning-muted-foreground" },
};

const DRUG_TEST_STATUS_META: Record<
  DrugTestRecord["status"],
  { label: string; tone: "success" | "info" | "warning" | "danger" | "neutral" }
> = {
  completed:        { label: "Completed",        tone: "success" },
  scheduled:        { label: "Scheduled",        tone: "info" },
  rescheduled:      { label: "Rescheduled",      tone: "warning" },
  "no-show":        { label: "No-Show",          tone: "danger" },
  "results-pending":{ label: "Results Pending",  tone: "neutral" },
};

const DRUG_RESULT_META: Record<
  DrugTestRecord["result"],
  { label: string; className: string }
> = {
  negative: { label: "Negative",  className: "text-success-muted-foreground font-medium" },
  positive: { label: "Positive",  className: "text-danger-muted-foreground font-medium" },
  dilute:   { label: "Dilute",    className: "text-warning-muted-foreground font-medium" },
  pending:  { label: "Pending",   className: "text-muted-foreground" },
  "—":      { label: "—",         className: "text-muted-foreground/50" },
};

const ADJUDICATION_STEP_META: Record<
  AdjudicationStep,
  { label: string; tone: "warning" | "danger" | "info" }
> = {
  "pre-adverse-sent":       { label: "Pre-Adverse Notice Sent",  tone: "warning" },
  "awaiting-response":      { label: "Awaiting Response",        tone: "info" },
  "final-decision-required":{ label: "Final Decision Required",  tone: "danger" },
};

const EXPIRY_STATUS_META: Record<
  ExpiringRecord["expiryStatus"],
  { tone: "success" | "warning" | "danger" }
> = {
  active:   { tone: "success" },
  expiring: { tone: "warning" },
  expired:  { tone: "danger" },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SENSITIVE_STATUSES: ScreeningStatus[] = ["review-required", "adverse-pending"];
function isHighAlert(status: ScreeningStatus): boolean {
  return SENSITIVE_STATUSES.includes(status);
}

function screeningStatsFor(records: ScreeningRecord[]) {
  return {
    inProgress: records.filter(
      (r) =>
        r.status === "in-progress" ||
        r.status === "ordered" ||
        r.status === "invited" ||
        r.status === "consented",
    ).length,
    clear: records.filter((r) => r.status === "clear").length,
    reviewRequired: records.filter(
      (r) => r.status === "review-required" || r.status === "adverse-pending",
    ).length,
    vendorDelayed: records.filter((r) => r.status === "vendor-delayed").length,
  };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TabButton({
  active,
  onClick,
  children,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-1.5 whitespace-nowrap border-b-2 pb-3 pt-1 text-sm font-medium transition-colors",
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span
          className={cn(
            "inline-flex h-4.5 min-w-[1.125rem] items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none",
            active
              ? "bg-primary/15 text-primary"
              : "bg-muted text-muted-foreground",
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function SectionCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("bg-card overflow-hidden rounded-xl border shadow-xs", className)}>
      {children}
    </div>
  );
}

function ActionButton({
  onClick,
  variant,
  children,
}: {
  onClick?: () => void;
  variant?: "default" | "danger" | "ghost";
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
        variant === "danger"
          ? "border-danger/30 bg-danger-muted/20 text-danger-muted-foreground hover:bg-danger-muted/40"
          : variant === "ghost"
          ? "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
          : "border-border bg-background text-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Adjudication Queue Tab
// ---------------------------------------------------------------------------

function AdjudicationQueueTab() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Restricted access banner */}
      <div className="flex items-start gap-3 rounded-xl border border-danger/25 bg-danger-muted/10 px-4 py-3">
        <Lock className="text-danger-muted-foreground mt-0.5 size-4 shrink-0" />
        <div className="min-w-0">
          <p className="text-danger-muted-foreground text-sm font-semibold">
            Restricted — Adjudication Queue
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
            Adjudication decisions require authorized reviewer access. All actions in this section
            create immutable audit records and may trigger legal notification workflows.
            Sensitive finding details are intentionally suppressed to protect candidate privacy
            and comply with FCRA.
          </p>
        </div>
      </div>

      <SectionCard>
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <h2 className="text-card-heading">Pending Adjudication</h2>
          <span className="text-muted-foreground text-xs tabular-nums">
            {ADJUDICATION_CASES.length} cases · role-restricted
          </span>
        </div>

        <div className="divide-y">
          {ADJUDICATION_CASES.map((c) => {
            const stepMeta = ADJUDICATION_STEP_META[c.step];
            const isExpanded = expandedId === c.id;

            return (
              <div key={c.id} className="px-4 py-4">
                {/* Main row */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    {/* Initials avatar — NO name displayed */}
                    <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold">
                      {c.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-muted-foreground text-xs font-mono">
                          {c.id}
                        </span>
                        <span className="text-muted-foreground text-xs">·</span>
                        <span className="text-foreground text-sm font-medium">
                          {c.client}
                        </span>
                        <span className="text-muted-foreground text-xs">·</span>
                        <span className="text-muted-foreground text-xs">
                          {c.screeningType}
                        </span>
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <StatusBadge tone={stepMeta.tone}>
                          {stepMeta.label}
                        </StatusBadge>

                        <span className="text-muted-foreground text-xs">
                          {c.findingSummary}
                        </span>

                        {c.daysRemaining > 0 && (
                          <span className="text-info-muted-foreground text-xs font-medium">
                            {c.daysRemaining}d remaining in response window
                          </span>
                        )}
                      </div>

                      <p className="text-muted-foreground mt-1.5 text-xs">
                        {c.responsePeriodStatus}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {c.step === "pre-adverse-sent" || c.step === "awaiting-response" ? (
                      <ActionButton>Send Pre-Adverse Notice</ActionButton>
                    ) : null}
                    {c.step === "awaiting-response" && (
                      <ActionButton>Record Response</ActionButton>
                    )}
                    <ActionButton
                      variant={c.step === "final-decision-required" ? "danger" : "default"}
                      onClick={() => toggleExpand(c.id)}
                    >
                      <span className="flex items-center gap-1">
                        Final Decision
                        {isExpanded ? (
                          <ChevronDown className="size-3" />
                        ) : (
                          <ChevronRight className="size-3" />
                        )}
                      </span>
                    </ActionButton>
                    <ActionButton variant="ghost">Request Legal Review</ActionButton>
                  </div>
                </div>

                {/* Adverse action workflow panel */}
                {isExpanded && (
                  <div className="mt-4 rounded-lg border border-warning/30 bg-warning-muted/10 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <AlertCircle className="text-warning-muted-foreground size-4 shrink-0" />
                      <span className="text-warning-muted-foreground text-sm font-semibold">
                        Adverse Action Decision Workflow
                      </span>
                    </div>

                    <ol className="flex flex-col gap-3 text-sm">
                      <li className="flex items-start gap-2.5">
                        <span className="bg-muted text-muted-foreground mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                          1
                        </span>
                        <span className="text-muted-foreground">
                          <span className="text-foreground font-medium">Review findings</span>
                          {" "}— Access full report via your authorized screening portal login.
                          Do not copy or share finding details in this system.
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="bg-muted text-muted-foreground mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                          2
                        </span>
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <input
                            type="checkbox"
                            className="accent-primary size-3.5 cursor-pointer"
                            id={`assessment-${c.id}`}
                          />
                          <label htmlFor={`assessment-${c.id}`} className="cursor-pointer">
                            <span className="text-foreground font-medium">
                              Individualized assessment completed
                            </span>
                            {" "}— Nature, time elapsed, and job relevance considered.
                          </label>
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="bg-muted text-muted-foreground mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                          3
                        </span>
                        <div className="flex flex-col gap-2">
                          <span className="text-foreground font-medium">Decision</span>
                          <div className="flex flex-wrap gap-2">
                            <ActionButton variant="danger">Adverse</ActionButton>
                            <ActionButton>Clear</ActionButton>
                            <ActionButton>Conditional</ActionButton>
                          </div>
                        </div>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="bg-muted text-muted-foreground mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                          4
                        </span>
                        <span className="text-muted-foreground">
                          <span className="text-foreground font-medium">If adverse:</span>
                          {" "}generate final adverse action notice and record reason in audit trail.
                        </span>
                      </li>
                    </ol>

                    <div className="mt-4 flex items-start gap-2 rounded-md border border-danger/20 bg-danger-muted/15 px-3 py-2.5">
                      <ShieldAlert className="text-danger-muted-foreground mt-0.5 size-4 shrink-0" />
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        <span className="text-danger-muted-foreground font-semibold">
                          Warning:
                        </span>{" "}
                        This action requires dual approval and creates an immutable audit record.
                        Adverse action decisions must comply with applicable FCRA and state-specific
                        fair chance ordinances. Consult legal counsel before proceeding.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-muted-foreground border-t px-4 py-2 text-xs">
          Candidate identities are suppressed in this view. Full record access requires HR
          Adjudicator or Legal role. All actions are logged to the Audit Center.
        </div>
      </SectionCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drug Test Tracker Tab
// ---------------------------------------------------------------------------

function DrugTestTrackerTab() {
  return (
    <SectionCard>
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <h2 className="text-card-heading">Drug Test Tracker</h2>
        <span className="text-muted-foreground text-xs tabular-nums">
          {DRUG_TEST_RECORDS.length} records
        </span>
      </div>

      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse text-left"
          style={{ fontSize: "var(--table-font)" }}
        >
          <thead className="text-muted-foreground border-b">
            <tr>
              <th className="px-3 py-2 font-medium">Candidate</th>
              <th className="px-3 py-2 font-medium">Test Type</th>
              <th className="px-3 py-2 font-medium">Collection Site</th>
              <th className="px-3 py-2 font-medium">Appointment</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Collector</th>
              <th className="px-3 py-2 font-medium">Result</th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {DRUG_TEST_RECORDS.map((dt) => {
              const statusMeta = DRUG_TEST_STATUS_META[dt.status];
              const resultMeta = DRUG_RESULT_META[dt.result];
              const isAlert = dt.status === "no-show";

              return (
                <tr
                  key={dt.id}
                  className={cn(
                    "border-b last:border-0 transition-colors",
                    isAlert
                      ? "bg-danger-muted/15 hover:bg-danger-muted/25"
                      : "hover:bg-muted/50",
                  )}
                >
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <Link
                      href={`/candidates/${dt.candidateId}`}
                      className="hover:text-primary font-medium"
                    >
                      {dt.candidateName}
                    </Link>
                  </td>
                  <td className="text-muted-foreground px-3 py-2.5 whitespace-nowrap">
                    {dt.testType}
                  </td>
                  <td className="text-muted-foreground px-3 py-2.5 whitespace-nowrap">
                    {dt.collectionSite}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">
                    <span className="text-foreground">{dt.appointmentDate}</span>
                    <span className="text-muted-foreground ml-1 text-xs">
                      {dt.appointmentTime}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge tone={statusMeta.tone}>
                      {statusMeta.label}
                    </StatusBadge>
                  </td>
                  <td className="text-muted-foreground px-3 py-2.5 whitespace-nowrap">
                    {dt.collector}
                  </td>
                  <td className={cn("px-3 py-2.5 whitespace-nowrap", resultMeta.className)}>
                    {resultMeta.label}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {(dt.status === "scheduled" || dt.status === "rescheduled") && (
                        <>
                          <ActionButton>Reschedule</ActionButton>
                          <ActionButton variant="ghost">Send Reminder</ActionButton>
                        </>
                      )}
                      {dt.status === "no-show" && (
                        <>
                          <ActionButton>Reschedule</ActionButton>
                          <ActionButton variant="ghost">Mark No-Show</ActionButton>
                        </>
                      )}
                      {dt.status === "completed" && (
                        <span className="text-muted-foreground text-xs">No action needed</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-muted-foreground border-t px-4 py-2 text-xs">
        Results show summary classification only (Negative / Positive / Dilute). Detailed
        laboratory reports are accessible only through the authorized screening vendor portal.
        Positive results must follow adjudication workflow.
      </div>
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Expiring Soon Tab
// ---------------------------------------------------------------------------

function ExpiringSoonTab() {
  const expiredCount = EXPIRING_RECORDS.filter((r) => r.expiryStatus === "expired").length;
  const expiringCount = EXPIRING_RECORDS.filter((r) => r.expiryStatus === "expiring").length;

  return (
    <div className="flex flex-col gap-4">
      {(expiredCount > 0 || expiringCount > 0) && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/25 bg-warning-muted/10 px-4 py-3">
          <CalendarClock className="text-warning-muted-foreground mt-0.5 size-4 shrink-0" />
          <p className="text-muted-foreground text-sm">
            <span className="text-warning-muted-foreground font-semibold">
              {expiredCount} expired
            </span>{" "}
            and{" "}
            <span className="text-warning-muted-foreground font-semibold">
              {expiringCount} expiring within 30 days.
            </span>{" "}
            Expired screenings may block assignments and client compliance checks. Initiate
            renewals promptly to avoid start-date risk.
          </p>
        </div>
      )}

      <SectionCard>
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <h2 className="text-card-heading">Screening Expirations</h2>
          <span className="text-muted-foreground text-xs tabular-nums">
            {EXPIRING_RECORDS.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table
            className="w-full border-collapse text-left"
            style={{ fontSize: "var(--table-font)" }}
          >
            <thead className="text-muted-foreground border-b">
              <tr>
                <th className="px-3 py-2 font-medium">Candidate</th>
                <th className="px-3 py-2 font-medium">Client</th>
                <th className="px-3 py-2 font-medium">Screening Type</th>
                <th className="px-3 py-2 font-medium">Completed</th>
                <th className="px-3 py-2 font-medium">Expires</th>
                <th className="px-3 py-2 font-medium">Days</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {[...EXPIRING_RECORDS]
                .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
                .map((r) => {
                  const expMeta = EXPIRY_STATUS_META[r.expiryStatus];
                  const daysLabel =
                    r.expiryStatus === "expired"
                      ? `${Math.abs(r.daysUntilExpiry)}d ago`
                      : `${r.daysUntilExpiry}d`;

                  return (
                    <tr
                      key={r.id}
                      className={cn(
                        "border-b last:border-0 transition-colors",
                        r.expiryStatus === "expired"
                          ? "bg-danger-muted/15 hover:bg-danger-muted/25"
                          : r.expiryStatus === "expiring"
                          ? "bg-warning-muted/10 hover:bg-warning-muted/20"
                          : "hover:bg-muted/50",
                      )}
                    >
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <Link
                          href={`/candidates/${r.candidateId}`}
                          className="hover:text-primary font-medium"
                        >
                          {r.candidateName}
                        </Link>
                      </td>
                      <td className="text-muted-foreground px-3 py-2.5 whitespace-nowrap">
                        {r.client}
                      </td>
                      <td className="text-muted-foreground px-3 py-2.5 whitespace-nowrap">
                        {r.screeningType}
                      </td>
                      <td className="text-muted-foreground px-3 py-2.5 tabular-nums whitespace-nowrap">
                        {r.completionDate}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums whitespace-nowrap">
                        <span
                          className={cn(
                            "font-medium",
                            r.expiryStatus === "expired"
                              ? "text-danger-muted-foreground"
                              : r.expiryStatus === "expiring"
                              ? "text-warning-muted-foreground"
                              : "text-foreground",
                          )}
                        >
                          {r.expirationDate}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">
                        <span
                          className={cn(
                            "text-xs font-medium tabular-nums",
                            r.expiryStatus === "expired"
                              ? "text-danger-muted-foreground"
                              : r.expiryStatus === "expiring"
                              ? "text-warning-muted-foreground"
                              : "text-muted-foreground",
                          )}
                        >
                          {daysLabel}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusBadge tone={expMeta.tone}>
                          {r.expiryStatus === "expired"
                            ? "Expired"
                            : r.expiryStatus === "expiring"
                            ? "Expiring Soon"
                            : "Active"}
                        </StatusBadge>
                      </td>
                      <td className="px-3 py-2.5">
                        <ActionButton>
                          <span className="flex items-center gap-1">
                            <RefreshCw className="size-3" />
                            Initiate Renewal
                          </span>
                        </ActionButton>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="text-muted-foreground border-t px-4 py-2 text-xs">
          Expiration dates are based on vendor completion date plus client or program-defined
          validity period. Renewal workflows will re-initiate background check with the same
          vendor and package unless overridden.
        </div>
      </SectionCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// All Screenings Tab — DB-aware
// ---------------------------------------------------------------------------

function AllScreeningsTab({
  records,
  dbIdSet,
}: {
  records: ScreeningRecord[];
  dbIdSet: Set<string>;
}) {
  const dbCount = dbIdSet.size;

  return (
    <SectionCard>
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <h2 className="text-card-heading">Screening Records</h2>
        <span className="text-muted-foreground text-xs tabular-nums">
          {records.length} total · sorted by age
          {dbCount > 0 && (
            <span className="text-success ml-1">· {dbCount} live</span>
          )}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse text-left"
          style={{ fontSize: "var(--table-font)" }}
        >
          <thead className="text-muted-foreground border-b">
            <tr>
              <th className="px-3 py-2 font-medium">Candidate</th>
              <th className="px-3 py-2 font-medium">Client</th>
              <th className="px-3 py-2 font-medium">Vendor</th>
              <th className="px-3 py-2 font-medium">Package</th>
              <th className="px-3 py-2 font-medium">Ordered</th>
              <th className="px-3 py-2 font-medium">Est. Completion</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Drug Test</th>
              <th className="px-3 py-2 font-medium">Age</th>
              <th className="px-3 py-2 font-medium">Cost</th>
            </tr>
          </thead>
          <tbody>
            {[...records]
              .sort((a, b) => b.ageDays - a.ageDays)
              .map((record) => {
                const alert = isHighAlert(record.status);
                const drugMeta = DRUG_TEST_LABELS[record.drugTest];
                const isLive = dbIdSet.has(record.id);

                return (
                  <tr
                    key={record.id}
                    className={cn(
                      "border-b last:border-0 transition-colors",
                      alert
                        ? "bg-danger-muted/20 hover:bg-danger-muted/30"
                        : "hover:bg-muted/50",
                    )}
                  >
                    <td className="px-3 py-2 whitespace-nowrap">
                      {isLive && (
                        <span
                          title="Live — sourced from database"
                          className="text-success mr-1.5 inline-block size-1.5 rounded-full bg-current align-middle"
                        />
                      )}
                      <Link
                        href={`/candidates/${record.candidateId}`}
                        className="hover:text-primary font-medium"
                      >
                        {record.candidateName}
                      </Link>
                      {record.jurisdictionDelays && (
                        <span
                          title="Jurisdiction delay"
                          className="text-warning-muted-foreground ml-1.5 inline-flex items-center text-xs"
                        >
                          <AlertTriangle className="size-3" />
                        </span>
                      )}
                    </td>
                    <td className="text-muted-foreground px-3 py-2 whitespace-nowrap">
                      {record.client}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">{record.vendor}</td>
                    <td className="text-muted-foreground px-3 py-2 whitespace-nowrap">
                      {record.packageType}
                    </td>
                    <td className="text-muted-foreground px-3 py-2 tabular-nums whitespace-nowrap">
                      {record.orderedDate}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {record.actualCompletion ? (
                        <span className="text-success-muted-foreground font-medium">
                          {record.actualCompletion}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          {record.estimatedCompletion}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge tone={SCREENING_STATUS_META[record.status].tone}>
                        {SCREENING_STATUS_META[record.status].label}
                      </StatusBadge>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={cn("text-xs font-medium", drugMeta.className)}>
                        {drugMeta.label}
                      </span>
                      {record.drugTestDate && (
                        <span className="text-muted-foreground ml-1 text-xs">
                          {record.drugTestDate}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      <span
                        className={cn(
                          "text-xs font-medium",
                          record.ageDays >= 10
                            ? "text-warning-muted-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {record.ageDays}d
                      </span>
                    </td>
                    <td className="text-muted-foreground px-3 py-2 tabular-nums">
                      ${record.cost}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <div className="text-muted-foreground border-t px-4 py-2 text-xs">
        Rows highlighted in red indicate records requiring adjudication or with adverse action
        pending (§22). Sensitive result details require elevated role access.
      </div>
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

type Tab = "all" | "adjudication" | "drug-tests" | "expiring";

const adjudicationCount = ADJUDICATION_CASES.length;
const drugTestAlertCount = DRUG_TEST_RECORDS.filter(
  (r) => r.status === "no-show",
).length;
const expiringAlertCount = EXPIRING_RECORDS.filter(
  (r) => r.expiryStatus === "expiring" || r.expiryStatus === "expired",
).length;

// ---------------------------------------------------------------------------
// Client root
// ---------------------------------------------------------------------------

export function ScreeningClient({
  records,
  dbIdSet,
}: {
  records: ScreeningRecord[];
  dbIdSet: Set<string>;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const stats = screeningStatsFor(records);

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="Background Check & Screening"
        description="Full pipeline visibility for background checks, drug screens, and adjudication — role-restricted sensitive details (§22, §58)."
      />

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={Clock}       label="In progress"      value={stats.inProgress}      tone="info" />
        <StatTile icon={CheckCircle2} label="Clear"           value={stats.clear}           tone="success" />
        <StatTile icon={ShieldAlert}  label="Review required" value={stats.reviewRequired}  tone="danger" />
        <StatTile icon={AlertTriangle} label="Vendor delayed" value={stats.vendorDelayed}   tone="warning" />
      </div>

      {/* Tab navigation */}
      <div className="border-b">
        <div className="-mb-px flex gap-6 overflow-x-auto">
          <TabButton active={activeTab === "all"} onClick={() => setActiveTab("all")}>
            All Screenings
          </TabButton>
          <TabButton
            active={activeTab === "adjudication"}
            onClick={() => setActiveTab("adjudication")}
            badge={adjudicationCount}
          >
            <Lock className="size-3.5" />
            Adjudication Queue
          </TabButton>
          <TabButton
            active={activeTab === "drug-tests"}
            onClick={() => setActiveTab("drug-tests")}
            badge={drugTestAlertCount > 0 ? drugTestAlertCount : undefined}
          >
            <FlaskConical className="size-3.5" />
            Drug Tests
          </TabButton>
          <TabButton
            active={activeTab === "expiring"}
            onClick={() => setActiveTab("expiring")}
            badge={expiringAlertCount}
          >
            <CalendarClock className="size-3.5" />
            Expiring Soon
          </TabButton>
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "all"          && <AllScreeningsTab records={records} dbIdSet={dbIdSet} />}
      {activeTab === "adjudication" && <AdjudicationQueueTab />}
      {activeTab === "drug-tests"   && <DrugTestTrackerTab />}
      {activeTab === "expiring"     && <ExpiringSoonTab />}
    </PageContainer>
  );
}
