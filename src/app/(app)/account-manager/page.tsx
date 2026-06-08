"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Building2,
  CalendarCheck2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Clock,
  MessageSquare,
  ShieldAlert,
  Star,
  TrendingUp,
  TriangleAlert,
  Users,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { LaunchpadSection } from "@/components/launchpad/launchpad-section";
import { LAUNCHPADS } from "@/lib/launchpad";
import { StatTile } from "@/components/workspace/stat-tile";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import type { StatusTone } from "@/lib/types";

/* ─────────────────────────────────────────────────────────────
   STATIC MOCK DATA  (§5.6 Account Manager / Client Readiness)
───────────────────────────────────────────────────────────────*/

type RiskLevel = "at-risk" | "on-track" | "needs-attention" | "clear";

type ConsultantRow = {
  name: string;
  stage: string;
  startDate: string;
  risk: RiskLevel;
  compliance: boolean;
  payroll: boolean;
  equipment: boolean;
};

type ClientApproval = {
  candidate: string;
  package: string;
  dueDate: string;
};

type ClientData = {
  id: string;
  name: string;
  initials: string;
  color: string;
  onboarding: number;
  compliance: number;
  atRisk: number;
  note: string;
  noteUrgent: boolean;
  consultants: ConsultantRow[];
  openApprovals: ClientApproval[];
  complianceText: string;
  contact: string;
  lastContacted: string;
  satisfaction: number;
  satisfactionTrend: "up" | "down" | "flat";
};

const CLIENTS: ClientData[] = [
  {
    id: "meridian",
    name: "Meridian Health",
    initials: "MH",
    color: "bg-info-muted text-info-muted-foreground",
    onboarding: 6,
    compliance: 97,
    atRisk: 1,
    note: "Client approval pending",
    noteUrgent: false,
    consultants: [
      { name: "Grace Okafor", stage: "Day 1 Preparation", startDate: "Jun 8", risk: "on-track", compliance: true, payroll: true, equipment: true },
      { name: "Sarah Chen", stage: "Background Check", startDate: "Jun 15", risk: "at-risk", compliance: false, payroll: true, equipment: true },
      { name: "Marcus Webb", stage: "Client Requirements", startDate: "Jun 18", risk: "on-track", compliance: true, payroll: true, equipment: false },
      { name: "Priya Nair", stage: "Document Submission", startDate: "Jun 22", risk: "needs-attention", compliance: false, payroll: false, equipment: false },
      { name: "James Liu", stage: "Tax & Payroll", startDate: "Jun 28", risk: "on-track", compliance: true, payroll: true, equipment: false },
      { name: "Ava Torres", stage: "Profile Setup", startDate: "Jul 3", risk: "on-track", compliance: true, payroll: false, equipment: false },
    ],
    openApprovals: [
      { candidate: "Sarah Chen", package: "Background Authorization", dueDate: "Jun 10" },
    ],
    complianceText: "5/6 requirements met — Sarah Chen: ID re-upload pending",
    contact: "Linda Marsh",
    lastContacted: "Jun 5",
    satisfaction: 4.5,
    satisfactionTrend: "up",
  },
  {
    id: "apex",
    name: "Apex Dynamics",
    initials: "AD",
    color: "bg-success-muted text-success-muted-foreground",
    onboarding: 4,
    compliance: 100,
    atRisk: 0,
    note: "All clear",
    noteUrgent: false,
    consultants: [
      { name: "Raj Patel", stage: "Day 1 Preparation", startDate: "Jun 10", risk: "on-track", compliance: true, payroll: true, equipment: true },
      { name: "Femi Oladele", stage: "Training", startDate: "Jun 17", risk: "on-track", compliance: true, payroll: true, equipment: true },
      { name: "Dana Brooks", stage: "Client Requirements", startDate: "Jun 24", risk: "on-track", compliance: true, payroll: true, equipment: false },
      { name: "Omar Sharif", stage: "Document Submission", startDate: "Jul 1", risk: "on-track", compliance: true, payroll: false, equipment: false },
    ],
    openApprovals: [],
    complianceText: "4/4 requirements met — all clear",
    contact: "Kevin Strauss",
    lastContacted: "Jun 4",
    satisfaction: 4.8,
    satisfactionTrend: "up",
  },
  {
    id: "novatech",
    name: "NovaTech Solutions",
    initials: "NT",
    color: "bg-warning-muted text-warning-muted-foreground",
    onboarding: 5,
    compliance: 88,
    atRisk: 2,
    note: "2 docs missing",
    noteUrgent: false,
    consultants: [
      { name: "Aisha Bello", stage: "Client Requirements", startDate: "Jun 22", risk: "on-track", compliance: true, payroll: true, equipment: false },
      { name: "Marcus Webb", stage: "Background Check", startDate: "Jun 22", risk: "at-risk", compliance: false, payroll: false, equipment: false },
      { name: "Lily Chang", stage: "Document Submission", startDate: "Jun 25", risk: "needs-attention", compliance: false, payroll: false, equipment: false },
      { name: "Sam Jourdain", stage: "Tax & Payroll", startDate: "Jun 29", risk: "on-track", compliance: true, payroll: true, equipment: false },
      { name: "Tara Osei", stage: "Profile Setup", startDate: "Jul 5", risk: "on-track", compliance: true, payroll: false, equipment: false },
    ],
    openApprovals: [
      { candidate: "Marcus Webb", package: "W-9 Re-submission", dueDate: "Jun 9" },
      { candidate: "Lily Chang", package: "NDA Countersignature", dueDate: "Jun 11" },
    ],
    complianceText: "3/5 requirements met — drug screen + I-9 Review missing",
    contact: "Priya Anand",
    lastContacted: "Jun 3",
    satisfaction: 3.9,
    satisfactionTrend: "down",
  },
  {
    id: "globalfin",
    name: "Global Finance Corp",
    initials: "GF",
    color: "bg-info-muted text-info-muted-foreground",
    onboarding: 3,
    compliance: 95,
    atRisk: 0,
    note: "Start date confirmed",
    noteUrgent: false,
    consultants: [
      { name: "Carlos Mendez", stage: "Day 1 Preparation", startDate: "Jun 18", risk: "on-track", compliance: true, payroll: true, equipment: true },
      { name: "Nina Kowalski", stage: "Training", startDate: "Jun 24", risk: "on-track", compliance: true, payroll: true, equipment: true },
      { name: "Yusuf Diallo", stage: "Background Check", startDate: "Jul 2", risk: "needs-attention", compliance: true, payroll: false, equipment: false },
    ],
    openApprovals: [],
    complianceText: "4/4 requirements met — start confirmed Jun 18",
    contact: "Rachel Moore",
    lastContacted: "Jun 6",
    satisfaction: 4.2,
    satisfactionTrend: "flat",
  },
  {
    id: "northwind",
    name: "Northwind Logistics",
    initials: "NL",
    color: "bg-danger-muted text-danger-muted-foreground",
    onboarding: 2,
    compliance: 72,
    atRisk: 1,
    note: "URGENT: promise at risk",
    noteUrgent: true,
    consultants: [
      { name: "James Rivera", stage: "Background Check", startDate: "Jun 14", risk: "at-risk", compliance: false, payroll: true, equipment: true },
      { name: "Elena Voss", stage: "Document Submission", startDate: "Jul 8", risk: "on-track", compliance: true, payroll: false, equipment: false },
    ],
    openApprovals: [
      { candidate: "James Rivera", package: "Background Auth + Client NDA", dueDate: "Jun 8" },
    ],
    complianceText: "2/4 requirements met — background check + drug screen outstanding",
    contact: "Tom Bauer",
    lastContacted: "Jun 2",
    satisfaction: 3.5,
    satisfactionTrend: "down",
  },
  {
    id: "skyline",
    name: "Skyline Retail",
    initials: "SR",
    color: "bg-success-muted text-success-muted-foreground",
    onboarding: 2,
    compliance: 91,
    atRisk: 0,
    note: "Starting soon",
    noteUrgent: false,
    consultants: [
      { name: "Carlos Mendez", stage: "Day 1 Preparation", startDate: "Jun 20", risk: "on-track", compliance: true, payroll: true, equipment: true },
      { name: "Bianca Reyes", stage: "Training", startDate: "Jun 27", risk: "on-track", compliance: true, payroll: true, equipment: false },
    ],
    openApprovals: [],
    complianceText: "4/4 requirements met — starts confirmed",
    contact: "Sophie Allan",
    lastContacted: "Jun 5",
    satisfaction: 4.4,
    satisfactionTrend: "flat",
  },
  {
    id: "vertex",
    name: "Vertex Financial",
    initials: "VF",
    color: "bg-info-muted text-info-muted-foreground",
    onboarding: 1,
    compliance: 100,
    atRisk: 0,
    note: "Equipment pending",
    noteUrgent: false,
    consultants: [
      { name: "Derek Holt", stage: "IT Provisioning", startDate: "Jun 25", risk: "needs-attention", compliance: true, payroll: true, equipment: false },
    ],
    openApprovals: [],
    complianceText: "3/3 requirements met — equipment delivery in transit",
    contact: "Janet Wu",
    lastContacted: "Jun 6",
    satisfaction: 4.7,
    satisfactionTrend: "up",
  },
  {
    id: "atlas",
    name: "Atlas Manufacturing",
    initials: "AM",
    color: "bg-warning-muted text-warning-muted-foreground",
    onboarding: 1,
    compliance: 83,
    atRisk: 1,
    note: "Screening delayed",
    noteUrgent: false,
    consultants: [
      { name: "Kwame Asante", stage: "Background Check", startDate: "Jun 28", risk: "at-risk", compliance: false, payroll: true, equipment: false },
    ],
    openApprovals: [],
    complianceText: "2/4 requirements met — screening jurisdiction delay reported",
    contact: "Brian Ford",
    lastContacted: "Jun 4",
    satisfaction: 3.8,
    satisfactionTrend: "flat",
  },
];

type PromiseStatus = "complete" | "on-track" | "at-risk" | "watch";

type Promise = {
  id: string;
  client: string;
  commitment: string;
  promisedBy: string;
  promisedOn: string;
  status: PromiseStatus;
  blocking?: string;
};

const PROMISES: Promise[] = [
  {
    id: "p1",
    client: "Meridian Health",
    commitment: "2 starts confirmed by Jun 8",
    promisedBy: "Alex Johnson",
    promisedOn: "May 28",
    status: "complete",
  },
  {
    id: "p2",
    client: "Meridian Health",
    commitment: "All pipeline clear by Jun 12",
    promisedBy: "Alex Johnson",
    promisedOn: "Jun 1",
    status: "on-track",
  },
  {
    id: "p3",
    client: "Northwind Logistics",
    commitment: "James Rivera starts Jun 14",
    promisedBy: "Alex Johnson",
    promisedOn: "May 30",
    status: "at-risk",
    blocking: "Background check not started — 5 days behind schedule",
  },
  {
    id: "p4",
    client: "Vertex Financial",
    commitment: "Equipment delivered before Jun 18",
    promisedBy: "Alex Johnson",
    promisedOn: "Jun 2",
    status: "on-track",
  },
  {
    id: "p5",
    client: "Atlas Manufacturing",
    commitment: "Screening complete by Jun 20",
    promisedBy: "Alex Johnson",
    promisedOn: "Jun 3",
    status: "watch",
    blocking: "Screening vendor reported jurisdiction delay",
  },
  {
    id: "p6",
    client: "NovaTech Solutions",
    commitment: "3 starts by Jun 22",
    promisedBy: "Alex Johnson",
    promisedOn: "Jun 1",
    status: "on-track",
  },
];

type EscalationSeverity = "HIGH" | "MEDIUM" | "LOW";

type Escalation = {
  id: string;
  severity: EscalationSeverity;
  client: string;
  candidate: string;
  issue: string;
  ageDays: number;
  status: "Open" | "Monitoring";
  actionLabel: string;
};

const ESCALATIONS: Escalation[] = [
  {
    id: "e1",
    severity: "HIGH",
    client: "Northwind Logistics",
    candidate: "James Rivera",
    issue: "Background check stalled — 4 days with no update from vendor",
    ageDays: 4,
    status: "Open",
    actionLabel: "View details",
  },
  {
    id: "e2",
    severity: "MEDIUM",
    client: "NovaTech Solutions",
    candidate: "Marcus Webb",
    issue: "W-9 rejected by payroll team — payroll configuration blocked",
    ageDays: 2,
    status: "Open",
    actionLabel: "Contact payroll",
  },
  {
    id: "e3",
    severity: "MEDIUM",
    client: "Atlas Manufacturing",
    candidate: "Kwame Asante",
    issue: "Screening jurisdiction delay reported by vendor",
    ageDays: 3,
    status: "Monitoring",
    actionLabel: "View",
  },
  {
    id: "e4",
    severity: "LOW",
    client: "Meridian Health",
    candidate: "Sarah Chen",
    issue: "Government-issued ID re-upload pending from candidate",
    ageDays: 1,
    status: "Monitoring",
    actionLabel: "Send nudge",
  },
];

type ForecastEntry = {
  date: string;
  candidate: string;
  client: string;
  status: "confirmed" | "likely" | "at-risk" | "on-track";
  note?: string;
};

const FORECAST: ForecastEntry[] = [
  { date: "Jun 8", candidate: "Grace Okafor", client: "Meridian Health", status: "confirmed" },
  { date: "Jun 10", candidate: "Raj Patel", client: "Apex Dynamics", status: "likely", note: "1 item pending" },
  { date: "Jun 14", candidate: "James Rivera", client: "Northwind Logistics", status: "at-risk", note: "Background check stalled" },
  { date: "Jun 15", candidate: "Sarah Chen", client: "Meridian Health", status: "at-risk", note: "ID re-upload required" },
  { date: "Jun 20", candidate: "Carlos Mendez", client: "Skyline Retail", status: "on-track" },
  { date: "Jun 22", candidate: "Aisha Bello", client: "NovaTech Solutions", status: "on-track" },
];

/* ─────────────────────────────────────────────────────────────
   HELPER COMPONENTS
───────────────────────────────────────────────────────────────*/

const RISK_BADGE: Record<RiskLevel, { tone: StatusTone; label: string }> = {
  "at-risk": { tone: "danger", label: "At Risk" },
  "on-track": { tone: "success", label: "On Track" },
  "needs-attention": { tone: "warning", label: "Needs Attention" },
  clear: { tone: "success", label: "Clear" },
};

const PROMISE_STATUS: Record<PromiseStatus, { tone: StatusTone; label: string; icon: React.ReactNode }> = {
  complete: { tone: "success", label: "Complete", icon: <CheckCircle2 className="size-3.5" /> },
  "on-track": { tone: "success", label: "On Track", icon: <CheckCircle2 className="size-3.5" /> },
  "at-risk": { tone: "danger", label: "At Risk", icon: <TriangleAlert className="size-3.5" /> },
  watch: { tone: "warning", label: "Watch", icon: <Eye className="size-3.5" /> },
};

const FORECAST_STATUS: Record<ForecastEntry["status"], { tone: StatusTone; label: string }> = {
  confirmed: { tone: "success", label: "CONFIRMED ✓" },
  likely: { tone: "info", label: "LIKELY" },
  "at-risk": { tone: "danger", label: "AT RISK ⚠" },
  "on-track": { tone: "success", label: "ON TRACK" },
};

const SEVERITY_TONE: Record<EscalationSeverity, StatusTone> = {
  HIGH: "danger",
  MEDIUM: "warning",
  LOW: "neutral",
};

function ReadinessDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      title={label}
      className={cn(
        "inline-block size-2.5 rounded-full",
        ok ? "bg-success" : "bg-danger",
      )}
      aria-label={`${label}: ${ok ? "Ready" : "Not ready"}`}
    />
  );
}

function StarRating({ score }: { score: number }) {
  const full = Math.floor(score);
  const half = score % 1 >= 0.5;
  return (
    <span className="text-warning-muted-foreground text-sm font-medium">
      {"★".repeat(full)}
      {half ? "½" : ""}
      {"☆".repeat(5 - full - (half ? 1 : 0))}
      <span className="text-muted-foreground ml-1 text-xs">{score}/5</span>
    </span>
  );
}

function TrendArrow({ trend }: { trend: "up" | "down" | "flat" }) {
  if (trend === "up") return <span className="text-success-muted-foreground text-xs">▲</span>;
  if (trend === "down") return <span className="text-danger-muted-foreground text-xs">▼</span>;
  return <span className="text-muted-foreground text-xs">—</span>;
}

/* ─────────────────────────────────────────────────────────────
   TAB TYPES
───────────────────────────────────────────────────────────────*/

type Tab = "portfolio" | "promises" | "escalations" | "forecast";

const TABS: { key: Tab; label: string }[] = [
  { key: "portfolio", label: "Client Portfolio" },
  { key: "promises", label: "Promise Tracker" },
  { key: "escalations", label: "Escalations" },
  { key: "forecast", label: "Start Forecast" },
];

/* ─────────────────────────────────────────────────────────────
   CLIENT CARD (expandable)
───────────────────────────────────────────────────────────────*/

function ClientCard({ client }: { client: ClientData }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn(
        "bg-card rounded-xl border shadow-xs transition-all",
        client.noteUrgent && "border-danger/30",
      )}
    >
      {/* ── Header row ── */}
      <button
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {/* Logo placeholder */}
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
            client.color,
          )}
        >
          {client.initials}
        </span>

        {/* Name + note */}
        <div className="min-w-0 flex-1">
          <p className="text-card-heading truncate">{client.name}</p>
          <p
            className={cn(
              "text-metadata truncate",
              client.noteUrgent && "text-danger-muted-foreground font-medium",
            )}
          >
            {client.noteUrgent && <TriangleAlert className="mr-1 inline size-3" />}
            {client.note}
          </p>
        </div>

        {/* Metrics */}
        <div className="hidden shrink-0 items-center gap-6 sm:flex">
          <div className="text-right">
            <p className="text-sm font-semibold tabular-nums">{client.onboarding}</p>
            <p className="text-metadata">Onboarding</p>
          </div>
          <div className="text-right">
            <p
              className={cn(
                "text-sm font-semibold tabular-nums",
                client.compliance < 85
                  ? "text-danger-muted-foreground"
                  : client.compliance < 95
                    ? "text-warning-muted-foreground"
                    : "text-success-muted-foreground",
              )}
            >
              {client.compliance}%
            </p>
            <p className="text-metadata">Compliance</p>
          </div>
          <div className="text-right">
            {client.atRisk > 0 ? (
              <p className="text-danger-muted-foreground text-sm font-semibold tabular-nums">
                {client.atRisk}
              </p>
            ) : (
              <p className="text-success-muted-foreground text-sm font-semibold tabular-nums">0</p>
            )}
            <p className="text-metadata">At Risk</p>
          </div>
        </div>

        {/* Expand icon */}
        <span className="text-muted-foreground ml-2 shrink-0">
          {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </span>
      </button>

      {/* ── Expanded body ── */}
      {open && (
        <div className="border-t px-4 pb-4 pt-3">
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Consultant pipeline mini-table */}
            <div className="lg:col-span-2">
              <p className="text-data-label mb-2 font-medium">Consultant Pipeline</p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left" style={{ fontSize: "var(--table-font, 0.8rem)" }}>
                  <thead>
                    <tr className="text-muted-foreground border-b">
                      <th className="pb-1.5 pr-3 font-medium">Name</th>
                      <th className="pb-1.5 pr-3 font-medium">Stage</th>
                      <th className="pb-1.5 pr-3 font-medium">Start</th>
                      <th className="pb-1.5 pr-3 font-medium">Risk</th>
                      <th className="pb-1.5 font-medium">
                        <span title="Compliance · Payroll · Equipment" className="cursor-help underline decoration-dotted">C·P·E</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {client.consultants.map((c) => {
                      const rb = RISK_BADGE[c.risk];
                      return (
                        <tr key={c.name} className="hover:bg-muted/40 border-b last:border-0">
                          <td className="py-1.5 pr-3 font-medium whitespace-nowrap">{c.name}</td>
                          <td className="text-muted-foreground py-1.5 pr-3 whitespace-nowrap">{c.stage}</td>
                          <td className="py-1.5 pr-3 tabular-nums whitespace-nowrap">{c.startDate}</td>
                          <td className="py-1.5 pr-3">
                            <StatusBadge tone={rb.tone}>{rb.label}</StatusBadge>
                          </td>
                          <td className="py-1.5">
                            <div className="flex items-center gap-1.5">
                              <ReadinessDot ok={c.compliance} label="Compliance" />
                              <ReadinessDot ok={c.payroll} label="Payroll" />
                              <ReadinessDot ok={c.equipment} label="Equipment" />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right column: approvals + compliance + contact + satisfaction */}
            <div className="flex flex-col gap-3">
              {/* Open approvals */}
              <div>
                <p className="text-data-label mb-1 font-medium">Open Client Approvals</p>
                {client.openApprovals.length === 0 ? (
                  <p className="text-muted-foreground text-xs">No approvals pending</p>
                ) : (
                  <ul className="flex flex-col gap-1">
                    {client.openApprovals.map((a) => (
                      <li key={a.candidate} className="bg-warning-muted/50 rounded-lg px-2.5 py-1.5 text-xs">
                        <span className="font-medium">{a.candidate}</span>
                        <span className="text-muted-foreground"> · {a.package}</span>
                        <span className="text-warning-muted-foreground ml-1">Due {a.dueDate}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Compliance summary */}
              <div>
                <p className="text-data-label mb-1 font-medium">Compliance Status</p>
                <p className="text-xs leading-relaxed">{client.complianceText}</p>
              </div>

              {/* Client contact */}
              <div>
                <p className="text-data-label mb-1 font-medium">Client Contact</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{client.contact}</p>
                    <p className="text-muted-foreground text-xs">Last contacted {client.lastContacted}</p>
                  </div>
                  <button className="border-border bg-card hover:bg-muted inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors">
                    <MessageSquare className="size-3" />
                    Message
                  </button>
                </div>
              </div>

              {/* Satisfaction */}
              <div>
                <p className="text-data-label mb-1 font-medium">Satisfaction</p>
                <div className="flex items-center gap-2">
                  <StarRating score={client.satisfaction} />
                  <TrendArrow trend={client.satisfactionTrend} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────────────*/

export default function AccountManagerWorkspacePage() {
  const [tab, setTab] = useState<Tab>("portfolio");

  const totalOnboarding = CLIENTS.reduce((s, c) => s + c.onboarding, 0);
  const totalAtRisk = CLIENTS.reduce((s, c) => s + c.atRisk, 0);
  const totalApprovals = CLIENTS.reduce((s, c) => s + c.openApprovals.length, 0);
  const avgSatisfaction =
    Math.round((CLIENTS.reduce((s, c) => s + c.satisfaction, 0) / CLIENTS.length) * 10) / 10;
  const promisesAtRisk = PROMISES.filter((p) => p.status === "at-risk").length;

  const northwindRisk = CLIENTS.find((c) => c.id === "northwind");
  const jamesRivera = northwindRisk?.consultants.find((c) => c.name === "James Rivera");

  return (
    <PageContainer className="flex flex-col gap-5">
      {/* ── Greeting ── */}
      <div>
        <PageHeader
          title="Good morning, Alex — your client portfolio"
          description="Client Readiness workspace · Jun 7, 2026"
        />
      </div>

      {/* Persona Launchpad */}
      <LaunchpadSection
        config={LAUNCHPADS["account-manager"]}
        badgeCounts={{
          myClients: CLIENTS.length,
          promises: PROMISES.length,
          escalations: 0,
          clientApprovals: totalApprovals,
        }}
      />

      {/* ── Promise-at-risk alert banner ── */}
      {promisesAtRisk > 0 && (
        <div className="bg-danger/10 border-danger/30 flex items-start gap-3 rounded-xl border p-3.5">
          <AlertTriangle className="text-danger-muted-foreground mt-0.5 size-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-danger-muted-foreground text-sm font-semibold">
              {promisesAtRisk} client commitment{promisesAtRisk > 1 ? "s" : ""} at risk today
            </p>
            <p className="text-danger-muted-foreground/80 mt-0.5 text-sm">
              Northwind Logistics — you promised a start by Jun 14. James Rivera is still at risk. 7 days to go.
              Background check has not been initiated.
            </p>
          </div>
          <button className="bg-danger/20 text-danger-muted-foreground hover:bg-danger/30 shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors">
            Escalate now
          </button>
        </div>
      )}

      {/* ── Vitals row ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile icon={Building2} label="Clients" value={CLIENTS.length} />
        <StatTile icon={Users} label="Consultants onboarding" value={totalOnboarding} />
        <StatTile icon={TriangleAlert} label="Promises at risk" value={promisesAtRisk} tone="danger" />
        <StatTile icon={ClipboardCheck} label="Client approvals needed" value={totalApprovals} tone="warning" />
        <StatTile icon={Star} label="Avg client satisfaction" value={`${avgSatisfaction}/5`} tone="success" />
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 rounded-xl border bg-card p-1 shadow-xs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              tab === t.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            {t.label}
            {t.key === "escalations" && ESCALATIONS.filter((e) => e.status === "Open").length > 0 && (
              <span className="bg-danger ml-1.5 inline-flex size-4 items-center justify-center rounded-full text-[10px] font-bold text-white">
                {ESCALATIONS.filter((e) => e.status === "Open").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─────────────────── TAB 1: CLIENT PORTFOLIO ─────────────────── */}
      {tab === "portfolio" && (
        <div className="flex flex-col gap-3">
          {CLIENTS.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}

      {/* ─────────────────── TAB 2: PROMISE TRACKER ─────────────────── */}
      {tab === "promises" && (
        <div className="bg-card rounded-xl border shadow-xs">
          <div className="border-b px-4 py-3">
            <h2 className="text-card-heading">Client Promise Tracker</h2>
            <p className="text-metadata mt-0.5">Commitments you have made — vs. current onboarding progress (§41.5)</p>
          </div>
          <div className="flex flex-col divide-y">
            {PROMISES.map((p) => {
              const meta = PROMISE_STATUS[p.status];
              return (
                <div
                  key={p.id}
                  className={cn(
                    "flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:gap-6",
                    p.status === "at-risk" && "bg-danger/5",
                  )}
                >
                  {/* Status badge (large) */}
                  <div className="shrink-0 pt-0.5">
                    <StatusBadge tone={meta.tone} className="text-xs font-semibold uppercase tracking-wide">
                      {meta.icon}
                      <span className="ml-0.5">{meta.label}</span>
                    </StatusBadge>
                  </div>

                  {/* Main content */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{p.client}</p>
                    <p className="mt-0.5 text-sm">{p.commitment}</p>
                    {p.blocking && (
                      <div className="mt-2 flex items-start gap-1.5">
                        <TriangleAlert className="text-danger-muted-foreground mt-0.5 size-3.5 shrink-0" />
                        <p className="text-danger-muted-foreground text-xs font-medium">{p.blocking}</p>
                      </div>
                    )}
                    <p className="text-muted-foreground mt-1 text-xs">
                      Promised {p.promisedOn} by {p.promisedBy}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button className="border-border bg-card hover:bg-muted rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors">
                      Update client
                    </button>
                    {(p.status === "at-risk" || p.status === "watch") && (
                      <button className="bg-danger/10 text-danger-muted-foreground hover:bg-danger/20 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors">
                        Escalate internally
                      </button>
                    )}
                    <button className="border-border bg-card hover:bg-muted rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors">
                      Adjust promise
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────── TAB 3: ESCALATIONS ─────────────────── */}
      {tab === "escalations" && (
        <div className="bg-card rounded-xl border shadow-xs">
          <div className="border-b px-4 py-3">
            <h2 className="text-card-heading">Open Escalations</h2>
            <p className="text-metadata mt-0.5">Active issues across your client portfolio requiring attention</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left" style={{ fontSize: "var(--table-font, 0.8rem)" }}>
              <thead className="text-muted-foreground border-b">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Severity</th>
                  <th className="px-4 py-2.5 font-medium">Client</th>
                  <th className="px-4 py-2.5 font-medium">Candidate</th>
                  <th className="px-4 py-2.5 font-medium">Issue</th>
                  <th className="px-4 py-2.5 font-medium text-right">Age</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {ESCALATIONS.map((e) => (
                  <tr
                    key={e.id}
                    className={cn(
                      "hover:bg-muted/40 border-b last:border-0 transition-colors",
                      e.severity === "HIGH" && "bg-danger/5",
                    )}
                  >
                    <td className="px-4 py-3">
                      <StatusBadge tone={SEVERITY_TONE[e.severity]}>{e.severity}</StatusBadge>
                    </td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{e.client}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{e.candidate}</td>
                    <td className="px-4 py-3 max-w-xs">{e.issue}</td>
                    <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                      <span className={cn(e.ageDays >= 3 ? "text-danger-muted-foreground font-medium" : "text-muted-foreground")}>
                        {e.ageDays}d
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={e.status === "Open" ? "danger" : "neutral"}>
                        {e.status}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3">
                      <button className="border-border bg-card hover:bg-muted rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap">
                        {e.actionLabel}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────── TAB 4: START FORECAST ─────────────────── */}
      {tab === "forecast" && (
        <div className="flex flex-col gap-4">
          <div className="bg-card rounded-xl border shadow-xs">
            <div className="border-b px-4 py-3">
              <h2 className="text-card-heading">14-Day Start Forecast</h2>
              <p className="text-metadata mt-0.5">Upcoming consultant starts across your client portfolio</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left" style={{ fontSize: "var(--table-font, 0.8rem)" }}>
                <thead className="text-muted-foreground border-b">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Date</th>
                    <th className="px-4 py-2.5 font-medium">Candidate</th>
                    <th className="px-4 py-2.5 font-medium">Client</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5 font-medium">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {FORECAST.map((f, i) => {
                    const meta = FORECAST_STATUS[f.status];
                    return (
                      <tr
                        key={i}
                        className={cn(
                          "hover:bg-muted/40 border-b last:border-0 transition-colors",
                          f.status === "at-risk" && "bg-danger/5",
                        )}
                      >
                        <td className="px-4 py-3 font-semibold tabular-nums whitespace-nowrap">{f.date}</td>
                        <td className="px-4 py-3 font-medium whitespace-nowrap">{f.candidate}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{f.client}</td>
                        <td className="px-4 py-3">
                          <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                        </td>
                        <td className="text-muted-foreground px-4 py-3 text-xs">{f.note ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Revenue at risk */}
          <div className="bg-card flex items-center justify-between gap-4 rounded-xl border px-4 py-3.5 shadow-xs">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-muted-foreground size-4" />
              <span className="text-sm font-medium">Revenue confidence</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <span>
                <span className="text-muted-foreground">Confirmed: </span>
                <span className="font-semibold">$0</span>
              </span>
              <span>
                <span className="text-muted-foreground">At-risk starts: </span>
                <span className="text-danger-muted-foreground font-semibold">$45K</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
