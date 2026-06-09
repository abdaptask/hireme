"use client";

/**
 * Consultant Lifecycle Management — Extensions, Offboarding, Rehire, Delta Onboarding.
 * (CLAUDE.md §38, §68 — full lifecycle beyond onboarding)
 */

import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  FileCheck2,
  Handshake,
  RefreshCcw,
  RotateCcw,
  Send,
  Sparkles,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { StatTile } from "@/components/workspace/stat-tile";
import { StatusBadge } from "@/components/status-badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { daysFromNow, formatDate } from "@/lib/clock";
import type { StatusTone } from "@/lib/types";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

type ExtensionStatus = "Not Requested" | "Requested" | "Approved" | "Expired";
type OffboardStatus = "On Track" | "Delayed" | "Blocked" | "Complete";
type RehireStatus = "Eligible" | "Ineligible" | "Pending Review" | "Do-Not-Hire";

const EXTENSION_STATUS_META: Record<ExtensionStatus, { tone: StatusTone }> = {
  "Not Requested": { tone: "neutral" },
  Requested:       { tone: "info" },
  Approved:        { tone: "success" },
  Expired:         { tone: "danger" },
};

const OFFBOARD_STATUS_META: Record<OffboardStatus, { tone: StatusTone }> = {
  "On Track": { tone: "success" },
  Delayed:    { tone: "warning" },
  Blocked:    { tone: "danger" },
  Complete:   { tone: "neutral" },
};

const REHIRE_STATUS_META: Record<RehireStatus, { tone: StatusTone }> = {
  Eligible:       { tone: "success" },
  Ineligible:     { tone: "danger" },
  "Pending Review": { tone: "warning" },
  "Do-Not-Hire":  { tone: "danger" },
};

// ─────────────────────────────────────────────────────────
// Mock Data — Extensions
// ─────────────────────────────────────────────────────────

type ExtensionRow = {
  id: string;
  consultant: string;
  role: string;
  client: string;
  endDate: string;
  daysRemaining: number;
  status: ExtensionStatus;
  rateChange?: string;
  urgent?: boolean;
  critical?: boolean;
};

const EXTENSIONS: ExtensionRow[] = [
  {
    id: "nina-cheng",
    consultant: "Nina Cheng",
    role: "UX Researcher",
    client: "Apex Dynamics",
    endDate: formatDate(daysFromNow(207), { withYear: true }),
    daysRemaining: 207,
    status: "Not Requested",
  },
  {
    id: "omar-hassan",
    consultant: "Omar Hassan",
    role: "Clinical Data Manager",
    client: "Meridian Health",
    endDate: formatDate(daysFromNow(114), { withYear: true }),
    daysRemaining: 114,
    status: "Requested",
    rateChange: "No rate change",
  },
  {
    id: "keisha-williams",
    consultant: "Keisha Williams",
    role: "Software Engineer",
    client: "NovaTech Solutions",
    endDate: formatDate(daysFromNow(22), { withYear: true }),
    daysRemaining: 22,
    status: "Approved",
    rateChange: "+$5/hr",
    urgent: true,
  },
  {
    id: "tyler-brooks",
    consultant: "Tyler Brooks",
    role: "Financial Analyst",
    client: "Global Finance Corp",
    endDate: formatDate(daysFromNow(7), { withYear: true }),
    daysRemaining: 7,
    status: "Not Requested",
    critical: true,
  },
  {
    id: "amara-singh",
    consultant: "Amara Singh",
    role: "Supply Chain Analyst",
    client: "Skyline Retail",
    endDate: formatDate(daysFromNow(37), { withYear: true }),
    daysRemaining: 37,
    status: "Requested",
  },
  {
    id: "diego-morales",
    consultant: "Diego Morales",
    role: "Data Engineer",
    client: "Meridian Health",
    endDate: formatDate(daysFromNow(54), { withYear: true }),
    daysRemaining: 54,
    status: "Not Requested",
  },
];

// ─────────────────────────────────────────────────────────
// Mock Data — Offboarding
// ─────────────────────────────────────────────────────────

type ChecklistItem = { label: string; done: boolean };

type OffboardCard = {
  id: string;
  consultant: string;
  role: string;
  client: string;
  lastDay: string;
  daysAway: number;
  status: OffboardStatus;
  checklist: ChecklistItem[];
  note?: string;
};

const OFFBOARDS: OffboardCard[] = [
  {
    id: "keisha-ob",
    consultant: "Keisha Williams",
    role: "Software Engineer",
    client: "NovaTech Solutions",
    lastDay: formatDate(daysFromNow(22), { withYear: true }),
    daysAway: 22,
    status: "On Track",
    note: "Equipment return pending — shipping label not yet generated.",
    checklist: [
      { label: "Final timesheet submitted",      done: true },
      { label: "Exit survey sent",               done: true },
      { label: "Manager notified",               done: true },
      { label: "Equipment return initiated",     done: false },
      { label: "Equipment received",             done: false },
      { label: "Access removed",                 done: false },
      { label: "Final payroll processed",        done: false },
      { label: "Client offboard confirmation",   done: false },
      { label: "Rehire eligibility set",         done: false },
    ],
  },
  {
    id: "tyler-ob",
    consultant: "Tyler Brooks",
    role: "Financial Analyst",
    client: "Global Finance Corp",
    lastDay: formatDate(daysFromNow(7), { withYear: true }),
    daysAway: 7,
    status: "Delayed",
    note: "URGENT — 7 days to last day, only 3 of 9 tasks complete.",
    checklist: [
      { label: "Final timesheet submitted",      done: true },
      { label: "Exit survey sent",               done: true },
      { label: "Manager notified",               done: true },
      { label: "Equipment return initiated",     done: false },
      { label: "Equipment received",             done: false },
      { label: "Access removed",                 done: false },
      { label: "Final payroll processed",        done: false },
      { label: "Client offboard confirmation",   done: false },
      { label: "Rehire eligibility set",         done: false },
    ],
  },
  {
    id: "marcus-ob",
    consultant: "Marcus Reyes",
    role: "Network Engineer",
    client: "Meridian Health",
    lastDay: formatDate(daysFromNow(-7), { withYear: true }),
    daysAway: -7,
    status: "Complete",
    checklist: [
      { label: "Final timesheet submitted",      done: true },
      { label: "Exit survey sent",               done: true },
      { label: "Manager notified",               done: true },
      { label: "Equipment return initiated",     done: true },
      { label: "Equipment received",             done: true },
      { label: "Access removed",                 done: true },
      { label: "Final payroll processed",        done: true },
      { label: "Client offboard confirmation",   done: true },
      { label: "Rehire eligibility set",         done: true },
    ],
  },
];

// ─────────────────────────────────────────────────────────
// Mock Data — Rehire
// ─────────────────────────────────────────────────────────

type RehireRow = {
  id: string;
  name: string;
  role: string;
  lastClient: string;
  endDate: string;
  exitReason: string;
  rehireStatus: RehireStatus;
  deltaItems?: string;
};

const REHIRE_ROSTER: RehireRow[] = [
  {
    id: "diego-reyes",
    name: "Diego Reyes",
    role: "Data Scientist",
    lastClient: "Meridian Health",
    endDate: formatDate(daysFromNow(-90), { withYear: true }),
    exitReason: "Assignment complete",
    rehireStatus: "Eligible",
    deltaItems: "2 docs expired",
  },
  {
    id: "priya-nair",
    name: "Priya Nair",
    role: "Product Manager",
    lastClient: "Apex Dynamics",
    endDate: formatDate(daysFromNow(-150), { withYear: true }),
    exitReason: "Client conversion",
    rehireStatus: "Ineligible",
    deltaItems: "N/A",
  },
  {
    id: "james-park",
    name: "James Park",
    role: "Full-Stack Engineer",
    lastClient: "NovaTech Solutions",
    endDate: formatDate(daysFromNow(-210), { withYear: true }),
    exitReason: "Resignation",
    rehireStatus: "Eligible",
    deltaItems: "4 items changed",
  },
  {
    id: "maria-fernandez",
    name: "Maria Fernandez",
    role: "HR Consultant",
    lastClient: "Global Finance Corp",
    endDate: formatDate(daysFromNow(-270), { withYear: true }),
    exitReason: "Assignment complete",
    rehireStatus: "Eligible",
    deltaItems: "1 item changed",
  },
  {
    id: "kevin-obi",
    name: "Kevin Obi",
    role: "Network Architect",
    lastClient: "Meridian Health",
    endDate: formatDate(daysFromNow(-365), { withYear: true }),
    exitReason: "Early termination",
    rehireStatus: "Pending Review",
    deltaItems: "N/A",
  },
];

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

function daysRemainingColor(days: number): string {
  if (days > 30) return "text-success";
  if (days >= 7)  return "text-warning";
  return "text-danger";
}

function daysRemainingBg(days: number): string {
  if (days > 30) return "bg-success-muted text-success-muted-foreground";
  if (days >= 7)  return "bg-warning-muted text-warning-muted-foreground";
  return "bg-danger-muted text-danger-muted-foreground";
}

function progressPct(checklist: ChecklistItem[]): number {
  const done = checklist.filter((c) => c.done).length;
  return Math.round((done / checklist.length) * 100);
}

function progressBarColor(status: OffboardStatus): string {
  if (status === "Complete") return "bg-success";
  if (status === "Delayed")  return "bg-warning";
  if (status === "Blocked")  return "bg-danger";
  return "bg-primary";
}

// ─────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────

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

function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b px-4 py-2.5">
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Tab 1 — Extensions
// ─────────────────────────────────────────────────────────

function ExtensionsTab() {
  return (
    <div className="flex flex-col gap-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={Calendar}    label="Ending within 30 days"  value={8}  tone="warning" />
        <StatTile icon={Send}        label="Extension Requested"     value={4}  tone="info" />
        <StatTile icon={CheckCircle2} label="Extension Approved"    value={2}  tone="success" />
        <StatTile icon={XCircle}     label="Expired Today"           value={1}  tone="danger" />
      </div>

      {/* Table */}
      <SectionCard>
        <TableHeader>
          <h2 className="text-card-heading">Assignment Extensions</h2>
          <span className="text-muted-foreground text-xs">{EXTENSIONS.length} assignments</span>
        </TableHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-muted-foreground px-4 py-2.5 text-left text-xs font-medium">Consultant</th>
                <th className="text-muted-foreground px-4 py-2.5 text-left text-xs font-medium">Client</th>
                <th className="text-muted-foreground px-4 py-2.5 text-left text-xs font-medium">End Date</th>
                <th className="text-muted-foreground px-4 py-2.5 text-left text-xs font-medium">Days Remaining</th>
                <th className="text-muted-foreground px-4 py-2.5 text-left text-xs font-medium">Extension Status</th>
                <th className="text-muted-foreground px-4 py-2.5 text-left text-xs font-medium">Rate Change</th>
                <th className="text-muted-foreground px-4 py-2.5 text-left text-xs font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {EXTENSIONS.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    "transition-colors hover:bg-muted/40",
                    row.critical && "bg-danger-muted/30",
                    row.urgent && !row.critical && "bg-warning-muted/20",
                  )}
                >
                  {/* Consultant */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-muted flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                        {row.consultant.split(" ").map((n) => n[0]).join("")}
                      </span>
                      <div>
                        <p className="font-medium leading-tight">{row.consultant}</p>
                        <p className="text-muted-foreground text-xs">{row.role}</p>
                      </div>
                      {row.critical && (
                        <span className="bg-danger-muted text-danger-muted-foreground rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                          Critical
                        </span>
                      )}
                      {row.urgent && !row.critical && (
                        <span className="bg-warning-muted text-warning-muted-foreground rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                          Urgent
                        </span>
                      )}
                    </div>
                  </td>
                  {/* Client */}
                  <td className="px-4 py-3 text-sm">{row.client}</td>
                  {/* End Date */}
                  <td className="px-4 py-3 text-sm tabular-nums">{row.endDate}</td>
                  {/* Days Remaining */}
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums", daysRemainingBg(row.daysRemaining))}>
                      {row.daysRemaining}d
                    </span>
                  </td>
                  {/* Extension Status */}
                  <td className="px-4 py-3">
                    <StatusBadge tone={EXTENSION_STATUS_META[row.status].tone}>
                      {row.status}
                    </StatusBadge>
                  </td>
                  {/* Rate Change */}
                  <td className="px-4 py-3 text-sm">
                    {row.rateChange ? (
                      <span className={cn(
                        "font-medium",
                        row.rateChange.startsWith("+") ? "text-success" : "text-muted-foreground",
                      )}>
                        {row.rateChange}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {row.status === "Not Requested" && (
                        <Button size="xs" variant="outline">
                          Request Extension
                        </Button>
                      )}
                      {row.status === "Requested" && (
                        <Button size="xs" variant="default">
                          Approve Extension
                        </Button>
                      )}
                      <Button size="xs" variant="ghost">
                        View Details
                        <ChevronRight className="size-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Tab 2 — Offboarding
// ─────────────────────────────────────────────────────────

function OffboardingTab() {
  const active = OFFBOARDS.filter((o) => o.status !== "Complete");
  const complete = OFFBOARDS.filter((o) => o.status === "Complete");

  return (
    <div className="flex flex-col gap-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={Users}        label="Active Offboards"          value={3}  tone="danger" />
        <StatTile icon={RefreshCcw}   label="Equipment Returns Pending" value={2}  tone="warning" />
        <StatTile icon={AlertTriangle} label="Access Removal Pending"   value={1}  tone="warning" />
        <StatTile icon={CheckCircle2} label="Completed This Month"      value={4}  tone="success" />
      </div>

      {/* Active offboard cards */}
      <div>
        <h2 className="text-section-heading mb-3">Active Offboardings</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {active.map((ob) => {
            const done = ob.checklist.filter((c) => c.done).length;
            const total = ob.checklist.length;
            const pct = progressPct(ob.checklist);
            const isUrgent = ob.daysAway <= 14 && ob.daysAway > 0;
            const isCritical = ob.daysAway <= 8 && ob.daysAway > 0;

            return (
              <SectionCard key={ob.id}>
                {/* Card header */}
                <div className={cn(
                  "border-b px-4 py-3",
                  isCritical && "bg-danger-muted/30",
                  isUrgent && !isCritical && "bg-warning-muted/20",
                )}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{ob.consultant}</p>
                        {isCritical && (
                          <StatusBadge tone="danger">Critical — {ob.daysAway}d left</StatusBadge>
                        )}
                        {isUrgent && !isCritical && (
                          <StatusBadge tone="warning">Urgent — {ob.daysAway}d left</StatusBadge>
                        )}
                      </div>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {ob.role} · {ob.client} · Last day: {ob.lastDay}
                      </p>
                    </div>
                    <StatusBadge tone={OFFBOARD_STATUS_META[ob.status].tone}>
                      {ob.status}
                    </StatusBadge>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{done} of {total} tasks complete</span>
                      <span className="tabular-nums font-medium">{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full transition-all", progressBarColor(ob.status))}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Checklist */}
                <div className="divide-y px-4 py-1">
                  {ob.checklist.map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5 py-2">
                      {item.done ? (
                        <CheckCircle2 className="text-success size-3.5 shrink-0" />
                      ) : (
                        <Circle className="text-muted-foreground/40 size-3.5 shrink-0" />
                      )}
                      <span className={cn(
                        "text-xs",
                        item.done
                          ? "text-muted-foreground line-through"
                          : "text-foreground",
                      )}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Note */}
                {ob.note && (
                  <div className="border-t px-4 py-2.5">
                    <p className="text-warning text-xs">{ob.note}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 border-t px-4 py-2.5">
                  <Button size="xs" variant="outline">
                    <ArrowUpRight className="size-3" />
                    View full record
                  </Button>
                  <Button size="xs" variant="outline">
                    <Send className="size-3" />
                    Send reminder
                  </Button>
                  <Button size="xs" variant="default" className="ml-auto">
                    <CheckCircle2 className="size-3" />
                    Mark complete
                  </Button>
                </div>
              </SectionCard>
            );
          })}
        </div>
      </div>

      {/* Completed */}
      {complete.length > 0 && (
        <div>
          <h2 className="text-section-heading mb-3 opacity-60">Completed Offboardings</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {complete.map((ob) => {
              const done = ob.checklist.filter((c) => c.done).length;
              const total = ob.checklist.length;

              return (
                <SectionCard key={ob.id} className="opacity-60">
                  <div className="border-b px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{ob.consultant}</p>
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          {ob.role} · {ob.client} · Last day: {ob.lastDay}
                        </p>
                      </div>
                      <StatusBadge tone="neutral">Complete</StatusBadge>
                    </div>
                    <div className="mt-3">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{done} of {total} tasks complete</span>
                        <span className="tabular-nums font-medium">100%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className="bg-success h-full w-full rounded-full" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2.5">
                    <Button size="xs" variant="ghost">
                      <ArrowUpRight className="size-3" />
                      View record
                    </Button>
                  </div>
                </SectionCard>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Tab 3 — Rehire
// ─────────────────────────────────────────────────────────

function RehireTab() {
  return (
    <div className="flex flex-col gap-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={CheckCircle2} label="Eligible for Rehire" value={12} tone="success" />
        <StatTile icon={XCircle}      label="Ineligible"           value={2}  tone="danger" />
        <StatTile icon={Clock}        label="Pending Review"       value={3}  tone="warning" />
        <StatTile icon={TrendingUp}   label="Rehired This Year"    value={5}  tone="info" />
      </div>

      {/* Table */}
      <SectionCard>
        <TableHeader>
          <h2 className="text-card-heading">Former Consultant Roster</h2>
          <span className="text-muted-foreground text-xs">{REHIRE_ROSTER.length} shown</span>
        </TableHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-muted-foreground px-4 py-2.5 text-left text-xs font-medium">Name</th>
                <th className="text-muted-foreground px-4 py-2.5 text-left text-xs font-medium">Last Assignment</th>
                <th className="text-muted-foreground px-4 py-2.5 text-left text-xs font-medium">Client</th>
                <th className="text-muted-foreground px-4 py-2.5 text-left text-xs font-medium">End Date</th>
                <th className="text-muted-foreground px-4 py-2.5 text-left text-xs font-medium">Exit Reason</th>
                <th className="text-muted-foreground px-4 py-2.5 text-left text-xs font-medium">Rehire Status</th>
                <th className="text-muted-foreground px-4 py-2.5 text-left text-xs font-medium">Delta Onboarding</th>
                <th className="text-muted-foreground px-4 py-2.5 text-left text-xs font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {REHIRE_ROSTER.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-muted/40">
                  {/* Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-muted flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                        {row.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                      <div>
                        <p className="font-medium leading-tight">{row.name}</p>
                        <p className="text-muted-foreground text-xs">{row.role}</p>
                      </div>
                    </div>
                  </td>
                  {/* Last Assignment */}
                  <td className="px-4 py-3 text-sm">{row.role}</td>
                  {/* Client */}
                  <td className="px-4 py-3 text-sm">{row.lastClient}</td>
                  {/* End Date */}
                  <td className="px-4 py-3 text-sm tabular-nums">{row.endDate}</td>
                  {/* Exit Reason */}
                  <td className="px-4 py-3 text-sm text-muted-foreground">{row.exitReason}</td>
                  {/* Rehire Status */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <StatusBadge tone={REHIRE_STATUS_META[row.rehireStatus].tone}>
                        {row.rehireStatus}
                      </StatusBadge>
                    </div>
                  </td>
                  {/* Delta Onboarding */}
                  <td className="px-4 py-3">
                    {row.deltaItems && row.deltaItems !== "N/A" ? (
                      <span className="text-info bg-info-muted rounded-md px-2 py-0.5 text-xs font-medium">
                        {row.deltaItems}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {row.rehireStatus === "Eligible" && (
                        <Button size="xs" variant="default">
                          Initiate Rehire
                        </Button>
                      )}
                      {row.rehireStatus === "Pending Review" && (
                        <Button size="xs" variant="outline">
                          Review
                        </Button>
                      )}
                      <Button size="xs" variant="ghost">
                        History
                      </Button>
                      <Button size="xs" variant="ghost">
                        Update
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Tab 4 — Delta Onboarding
// ─────────────────────────────────────────────────────────

type DeltaItem = { label: string; detail?: string };

const ALREADY_HAVE: DeltaItem[] = [
  { label: "Profile & contact details",        detail: "verified on file" },
  { label: "Background check",                 detail: "valid until Dec 2026" },
  { label: "I-9 verification",                 detail: "on file" },
  { label: "Employment agreement",             detail: "signed Nov 2025" },
  { label: "Federal W-4",                      detail: "on file" },
];

const NEEDS_UPDATE: (DeltaItem & { reason: string; reasonTone: StatusTone })[] = [
  {
    label: "State tax form",
    detail: "WA → TX — state changed",
    reason: "Assignment location changed",
    reasonTone: "warning",
  },
  {
    label: "Drug screening",
    detail: "expired — last completed Nov 2025",
    reason: "12-month expiration policy",
    reasonTone: "danger",
  },
  {
    label: "NovaTech NDA v3.0",
    detail: "new version — was on v2.1",
    reason: "Client updated NDA in Jan 2026",
    reasonTone: "info",
  },
  {
    label: "Direct deposit",
    detail: "bank info changed — candidate requested update",
    reason: "Candidate flagged at exit interview",
    reasonTone: "warning",
  },
];

function DeltaOnboardingTab() {
  return (
    <div className="flex flex-col gap-5">
      {/* Concept banner */}
      <div className="bg-info-muted border-info/30 rounded-xl border px-5 py-4">
        <div className="flex items-start gap-3">
          <RotateCcw className="text-info mt-0.5 size-5 shrink-0" />
          <div>
            <p className="text-info-muted-foreground font-semibold">
              Delta Onboarding — James Park (returning)
            </p>
            <p className="text-info-muted-foreground/80 mt-0.5 text-sm">
              James is a returning consultant re-joining NovaTech Solutions. Rather than
              re-running a full onboarding package, the system has identified only the items
              that have changed, expired, or carry new requirements.
            </p>
          </div>
        </div>
      </div>

      {/* Returning consultant — only 4 items need attention */}
      <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 px-5 py-3 text-center">
        <p className="text-lg font-bold">
          Returning consultant —{" "}
          <span className="text-primary">4 items need attention</span>
        </p>
        <p className="text-muted-foreground mt-0.5 text-sm">
          5 items already on file · Full package skipped · Estimated completion: 45 min
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Already Have */}
        <SectionCard>
          <div className="border-b px-4 py-2.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-success size-4" />
              <h2 className="text-card-heading">Already Have</h2>
              <span className="text-muted-foreground ml-auto text-xs">No action needed</span>
            </div>
          </div>
          <div className="divide-y px-4">
            {ALREADY_HAVE.map((item, i) => (
              <div key={i} className="flex items-center gap-3 py-3">
                <CheckCircle2 className="text-success size-4 shrink-0" />
                <div className="min-w-0">
                  <p className="text-muted-foreground text-sm font-medium line-through">
                    {item.label}
                  </p>
                  {item.detail && (
                    <p className="text-muted-foreground/60 text-xs">{item.detail}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Need to Update */}
        <SectionCard>
          <div className="border-b px-4 py-2.5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-warning size-4" />
              <h2 className="text-card-heading">Need to Update</h2>
              <span className="bg-warning-muted text-warning-muted-foreground ml-auto rounded-full px-2 py-0.5 text-xs font-semibold">
                4 required
              </span>
            </div>
          </div>
          <div className="divide-y px-4">
            {NEEDS_UPDATE.map((item, i) => (
              <div key={i} className="flex items-start gap-3 py-3">
                <div className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                  item.reasonTone === "danger" ? "bg-danger-muted" :
                  item.reasonTone === "warning" ? "bg-warning-muted" : "bg-info-muted",
                )}>
                  <span className={cn(
                    "text-[10px] font-bold",
                    item.reasonTone === "danger" ? "text-danger-muted-foreground" :
                    item.reasonTone === "warning" ? "text-warning-muted-foreground" : "text-info-muted-foreground",
                  )}>
                    !
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="text-muted-foreground text-xs">{item.detail}</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <StatusBadge tone={item.reasonTone}>{item.reason}</StatusBadge>
                  </div>
                </div>
                <Button size="xs" variant="outline" className="shrink-0">
                  Action
                  <ArrowRight className="size-3" />
                </Button>
              </div>
            ))}
          </div>
          <div className="border-t px-4 py-2.5">
            <Button size="sm" variant="default" className="w-full">
              <Send className="size-3.5" />
              Send delta package to James Park
            </Button>
          </div>
        </SectionCard>
      </div>

      {/* AI Explanation Card */}
      <SectionCard>
        <div className="border-b px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Bot className="text-ai size-4" />
            <h2 className="text-card-heading">AI Analysis</h2>
            <span className="bg-ai-muted text-ai-muted-foreground ml-auto rounded-full px-2 py-0.5 text-xs font-medium">
              4 factors identified
            </span>
          </div>
        </div>
        <div className="px-4 py-4">
          <p className="text-muted-foreground mb-3 text-sm">
            AI identified 4 items requiring action based on the following:
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { icon: "📍", text: "Assignment location changed (WA → TX) — new state tax form required" },
              { icon: "⏱️", text: "Drug test expiration policy: 12 months — last completed Nov 2025" },
              { icon: "📄", text: "Client updated NDA to v3.0 in Jan 2026 — previous version v2.1 on file" },
              { icon: "🏦", text: "Candidate flagged bank account change during exit interview in Nov 2025" },
            ].map((f, i) => (
              <div
                key={i}
                className="bg-muted/50 flex items-start gap-2.5 rounded-lg px-3 py-2.5"
              >
                <span className="mt-0.5 text-sm">{f.icon}</span>
                <p className="text-sm leading-snug">{f.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-dashed px-3 py-2.5">
            <Sparkles className="text-ai size-4 shrink-0" />
            <p className="text-muted-foreground text-xs">
              Confidence: <strong className="text-foreground">98%</strong> · Source: assignment record, exit interview notes, drug screen log,
              client package changelog · Reviewed by AI before dispatch required.
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────

const TABS = [
  { id: "extensions",       label: "Extensions",       icon: Handshake,  count: 6  },
  { id: "offboarding",      label: "Offboarding",      icon: FileCheck2, count: 3  },
  { id: "rehire",           label: "Rehire",            icon: RotateCcw,  count: 17 },
  { id: "delta-onboarding", label: "Delta Onboarding",  icon: RefreshCcw, count: 1  },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function LifecyclePage() {
  const [activeTab, setActiveTab] = useState<TabId>("extensions");

  return (
    <PageContainer className="flex flex-col gap-5">
      <PageHeader
        title="Consultant Lifecycle"
        description="Manage assignment extensions, offboarding, rehire eligibility, and delta onboarding for returning consultants. (§38, §68)"
        actions={
          <Button variant="outline" size="sm">
            <FileCheck2 className="size-3.5" />
            Export report
          </Button>
        }
      />

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabId)}
        className="flex flex-col gap-5"
      >
        <TabsList className="h-auto w-full justify-start gap-1 rounded-xl bg-transparent p-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  "flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-all",
                  activeTab === tab.id
                    ? "bg-card border-border text-foreground shadow-xs"
                    : "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {tab.label}
                <span className={cn(
                  "rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground",
                )}>
                  {tab.count}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="extensions">
          <ExtensionsTab />
        </TabsContent>

        <TabsContent value="offboarding">
          <OffboardingTab />
        </TabsContent>

        <TabsContent value="rehire">
          <RehireTab />
        </TabsContent>

        <TabsContent value="delta-onboarding">
          <DeltaOnboardingTab />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
