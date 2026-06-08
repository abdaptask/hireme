"use client";

/**
 * Approval Center — unified inbox for all pending approvals (§25, §108).
 *
 * Approval types tracked here:
 *   - Package approval
 *   - Compliance waiver
 *   - Rate change
 *   - Document exception
 *   - AI action (bulk)
 *   - Screening adjudication
 *
 * Each approval card supports:
 *   - Inline expand with full context, evidence, approval chain
 *   - Inline Approve / Reject with comment + confirmation
 *   - Delegate / Request Changes / More actions
 */

import { useState } from "react";
import {
  CheckCircle,
  XCircle,
  MessageSquare,
  UserPlus,
  MoreHorizontal,
  Clock,
  Shield,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FileText,
  AlertTriangle,
  RefreshCw,
  Package,
  UserCheck,
  DollarSign,
  CheckCircle2,
} from "lucide-react";
import { PageContainer, PageHeader, EmptyState } from "@/components/page";
import { StatTile } from "@/components/workspace/stat-tile";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

type ApprovalType =
  | "Package"
  | "Compliance Waiver"
  | "Rate Change"
  | "Document"
  | "Screening"
  | "AI Action";

type RiskLevel = "High" | "Medium" | "Low";
type SlaStatus = "overdue" | "urgent" | "today" | "upcoming";
type CardStatus = "pending" | "approved" | "rejected";

interface ApprovalChainStep {
  role: string;
  name: string;
  status: "pending" | "approved" | "required";
}

interface Approval {
  id: string;
  type: ApprovalType;
  title: string;
  requestor: string;
  candidate: string;
  client: string;
  reason: string;
  context: string;
  evidence?: string;
  risk: RiskLevel;
  slaLabel: string;
  slaStatus: SlaStatus;
  approvalChain: ApprovalChainStep[];
  aiGenerated?: boolean;
  restricted?: boolean;
}

// ─────────────────────────────────────────────────────────
// Mock data (§108)
// ─────────────────────────────────────────────────────────

const APPROVALS: Approval[] = [
  {
    id: "APR-001",
    type: "Package",
    title: "NovaTech Solutions W-2 Package v2.1 — Aisha Bello",
    requestor: "Riya Kim",
    candidate: "Aisha Bello",
    client: "NovaTech Solutions",
    reason:
      "Package requires Compliance Manager and Account Manager sign-off before dispatch. Client NDA and state-specific wage notice have been updated in v2.1.",
    context:
      "Aisha starts in 3 days. Package includes 9 required items across compliance, payroll, and client-specific forms. Two items flagged by AI for review.",
    evidence: "Package v2.1 diff · AI review summary · Client NDA v7",
    risk: "High",
    slaLabel: "Due in 2h",
    slaStatus: "urgent",
    approvalChain: [
      { role: "Compliance Manager", name: "Dana Powell", status: "approved" },
      { role: "Account Manager", name: "Riya Kim", status: "pending" },
    ],
  },
  {
    id: "APR-002",
    type: "Compliance Waiver",
    title: "Drug screening waiver — Lena Park",
    requestor: "Marcus Owens",
    candidate: "Lena Park",
    client: "Apex Digital",
    reason:
      "Client Apex Digital has requested a drug screening waiver for this role. Position is fully remote with no client site access. Client submitted waiver request in VMS.",
    context:
      "Lena Park is a contractor engagement, W-2 classification. Role: UX Designer. No equipment provisioning required. Client waiver approval attached.",
    evidence: "Client waiver email · VMS approval event · Role classification doc",
    risk: "Medium",
    slaLabel: "Due tomorrow",
    slaStatus: "today",
    approvalChain: [
      { role: "Compliance Manager", name: "Dana Powell", status: "pending" },
    ],
  },
  {
    id: "APR-003",
    type: "Rate Change",
    title: "Pay rate increase — James Rivera $82/hr → $88/hr",
    requestor: "Sophie Lane",
    candidate: "James Rivera",
    client: "Meridian Health",
    reason:
      "Retroactive rate change effective 2 weeks ago per client renegotiation. Bill rate has already been updated in VMS. Pay rate adjustment requires CFO and Account Manager dual approval per policy §25.",
    context:
      "This change affects 2 pending timesheets and triggers payroll re-calculation. Finance impact: +$768 gross. Retro period: 05/24–06/07.",
    evidence: "Rate change form · VMS rate confirmation · Finance impact analysis",
    risk: "High",
    slaLabel: "Overdue 1h",
    slaStatus: "overdue",
    approvalChain: [
      { role: "Account Manager", name: "Sophie Lane", status: "approved" },
      { role: "CFO", name: "Richard Tate", status: "pending" },
    ],
  },
  {
    id: "APR-004",
    type: "Document",
    title: "Expired passport override — Sarah Chen",
    requestor: "Onboarder System",
    candidate: "Sarah Chen",
    client: "Vertex Partners",
    reason:
      "Sarah's passport expired 30 days ago. USCIS Form I-551 (Green Card) is on order with USCIS — receipt notice available. Exception is needed to proceed with I-9 completion using receipt notice as List A document.",
    context:
      "This override is permitted under USCIS interim guidance for pending renewals. Start date is in 6 days. Alternative documentation verified by Compliance team.",
    evidence: "USCIS receipt notice I-551 · Compliance memo · Prior I-9 review",
    risk: "Medium",
    slaLabel: "Due today",
    slaStatus: "today",
    approvalChain: [
      { role: "I-9 Compliance Officer", name: "Dana Powell", status: "pending" },
    ],
  },
  {
    id: "APR-005",
    type: "AI Action",
    title: "Bulk nudge campaign — 6 unresponsive candidates",
    requestor: "AI Copilot",
    candidate: "6 candidates",
    client: "Multiple clients",
    reason:
      "AI identified 6 candidates who have not responded in 48+ hours and are at risk of missing start dates. AI drafted personalized omnichannel messages per Gentle Nudge Protocol (§13). Human approval required before dispatch (§11).",
    context:
      "Messages are personalized by stage, urgency, and communication preference. Channels: Email + SMS. Tone adjusted for urgency level. Quiet hours respected.",
    evidence: "Drafted messages (6) · Candidate inactivity log · Risk scores",
    risk: "Low",
    slaLabel: "Due today",
    slaStatus: "today",
    aiGenerated: true,
    approvalChain: [
      { role: "Onboarder", name: "Marcus Owens", status: "pending" },
    ],
  },
  {
    id: "APR-006",
    type: "Screening",
    title: "Adverse finding review — candidate identity restricted",
    requestor: "HireRight Integration",
    candidate: "Identity restricted",
    client: "Vertex Partners",
    reason:
      "Background screening returned a result requiring adjudication. Pre-adverse action notice period applies. Restricted to authorized reviewers only per FCRA guidelines.",
    context:
      "Screening vendor: HireRight. Package: Comprehensive 7-year. Result received 06/06. Candidate response period: 5 business days. Case manager notified.",
    evidence: "Screening report (restricted) · FCRA compliance checklist",
    risk: "High",
    slaLabel: "Due in 4h",
    slaStatus: "urgent",
    restricted: true,
    approvalChain: [
      { role: "Screening Adjudicator", name: "Dana Powell", status: "pending" },
      { role: "Legal Counsel", name: "Required if adverse", status: "required" },
    ],
  },
  {
    id: "APR-007",
    type: "Package",
    title: "Meridian Health Healthcare Package v3.0 — Grace Okafor",
    requestor: "Riya Kim",
    candidate: "Grace Okafor",
    client: "Meridian Health",
    reason:
      "Client Meridian Health added 2 new requirements to their standard package effective 06/01: HIPAA training certification and client badge request form. Package v3.0 reflects these changes.",
    context:
      "Grace starts in 2 days. Existing requirements (I-9, W-4, Direct Deposit, Background Check) are complete. Only the 2 new client items are outstanding.",
    evidence: "Package v3.0 vs v2.5 diff · Client requirement notification",
    risk: "Low",
    slaLabel: "Due in 2 days",
    slaStatus: "upcoming",
    approvalChain: [
      { role: "Account Manager", name: "Riya Kim", status: "pending" },
    ],
  },
  {
    id: "APR-008",
    type: "Compliance Waiver",
    title: "California wage notice waiver — remote worker",
    requestor: "Onboarder System",
    candidate: "Priya Menon",
    client: "CloudBase Inc.",
    reason:
      "Candidate Priya Menon is physically located in Washington state but the client is California-based. California wage notice (DLSE NTE) is not applicable to Washington-based employees. Override reason submitted: WA state employee, CA form not applicable.",
    context:
      "Override reason already documented. WA state wage notice has been substituted. Legal review completed 06/05. No start-date risk.",
    evidence: "WA wage notice · Legal memo 06/05 · Override reason log",
    risk: "Low",
    slaLabel: "Override submitted",
    slaStatus: "upcoming",
    approvalChain: [
      { role: "Compliance Manager", name: "Dana Powell", status: "approved" },
      { role: "Legal", name: "Completed 06/05", status: "approved" },
    ],
  },
];

// ─────────────────────────────────────────────────────────
// Lookup maps
// ─────────────────────────────────────────────────────────

const TYPE_FILTER_TABS = [
  "All",
  "Package",
  "Compliance Waiver",
  "Rate Change",
  "Document",
  "Screening",
  "AI Action",
] as const;

type FilterTab = (typeof TYPE_FILTER_TABS)[number];

const TYPE_BADGE: Record<ApprovalType, string> = {
  Package: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "Compliance Waiver": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "Rate Change": "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  Document: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  Screening: "bg-red-500/10 text-red-600 dark:text-red-400",
  "AI Action": "bg-violet-500/10 text-violet-600 dark:text-violet-400",
};

const TYPE_ICON: Record<ApprovalType, React.ElementType> = {
  Package: Package,
  "Compliance Waiver": Shield,
  "Rate Change": DollarSign,
  Document: FileText,
  Screening: UserCheck,
  "AI Action": Sparkles,
};

const RISK_DOT: Record<RiskLevel, string> = {
  High: "bg-danger",
  Medium: "bg-warning",
  Low: "bg-info",
};

const SLA_CHIP: Record<SlaStatus, string> = {
  overdue: "bg-danger-muted text-danger-muted-foreground",
  urgent: "bg-warning-muted text-warning-muted-foreground",
  today: "bg-info-muted text-info-muted-foreground",
  upcoming: "bg-muted text-muted-foreground",
};

const CHAIN_STATUS_STYLE: Record<ApprovalChainStep["status"], string> = {
  approved: "text-success-muted-foreground",
  pending: "text-warning-muted-foreground font-semibold",
  required: "text-muted-foreground italic",
};

// ─────────────────────────────────────────────────────────
// Inline action state types
// ─────────────────────────────────────────────────────────

type InlineAction = "approve" | "reject" | null;

interface CardState {
  expanded: boolean;
  inlineAction: InlineAction;
  comment: string;
  status: CardStatus;
}

// ─────────────────────────────────────────────────────────
// Approval Card
// ─────────────────────────────────────────────────────────

function ApprovalCard({
  approval,
  state,
  onToggleExpand,
  onStartAction,
  onCancelAction,
  onConfirmAction,
  onCommentChange,
}: {
  approval: Approval;
  state: CardState;
  onToggleExpand: () => void;
  onStartAction: (action: InlineAction) => void;
  onCancelAction: () => void;
  onConfirmAction: () => void;
  onCommentChange: (val: string) => void;
}) {
  const TypeIcon = TYPE_ICON[approval.type];
  const isSettled = state.status !== "pending";

  return (
    <div
      className={cn(
        "bg-card rounded-xl border transition-all duration-200",
        isSettled
          ? state.status === "approved"
            ? "border-success/40 opacity-70"
            : "border-danger/40 opacity-70"
          : "hover:shadow-sm",
        isSettled && "order-last",
      )}
    >
      {/* ── Card body ── */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Priority dot */}
          <span
            className={cn(
              "mt-1.5 size-2 shrink-0 rounded-full",
              RISK_DOT[approval.risk],
            )}
            title={`${approval.risk} risk`}
          />

          <div className="min-w-0 flex-1">
            {/* Top row: type badge + title + SLA */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
                  TYPE_BADGE[approval.type],
                )}
              >
                <TypeIcon className="size-3" />
                {approval.type}
              </span>

              {approval.aiGenerated && (
                <span className="bg-ai-muted text-ai-muted-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium">
                  <Sparkles className="size-3" />
                  AI drafted
                </span>
              )}

              {approval.restricted && (
                <span className="bg-danger-muted text-danger-muted-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium">
                  <Shield className="size-3" />
                  Restricted
                </span>
              )}

              <span
                className={cn(
                  "ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
                  SLA_CHIP[approval.slaStatus],
                )}
              >
                <Clock className="size-3" />
                {approval.slaLabel}
              </span>
            </div>

            {/* Title */}
            <p className="mt-1.5 text-sm font-semibold leading-snug">
              {approval.title}
            </p>

            {/* Requestor → candidate → client chain */}
            <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground/80">
                {approval.requestor}
              </span>
              <span>→</span>
              <span className="font-medium text-foreground/80">
                {approval.candidate}
              </span>
              <span>→</span>
              <span>{approval.client}</span>
            </div>

            {/* Reason (2 lines truncated) */}
            <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
              {approval.reason}
            </p>

            {/* Evidence snippet */}
            {approval.evidence && (
              <p className="mt-1 text-xs text-muted-foreground/70 italic truncate">
                Evidence: {approval.evidence}
              </p>
            )}

            {/* Risk badge */}
            <div className="mt-2">
              <StatusBadge
                tone={
                  approval.risk === "High"
                    ? "danger"
                    : approval.risk === "Medium"
                      ? "warning"
                      : "info"
                }
                withDot={false}
              >
                {approval.risk} risk
              </StatusBadge>
            </div>
          </div>
        </div>

        {/* ── Expand toggle ── */}
        <button
          onClick={onToggleExpand}
          className="mt-3 flex w-full items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          aria-expanded={state.expanded}
        >
          {state.expanded ? (
            <ChevronUp className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )}
          {state.expanded ? "Hide details" : "Show full context, evidence & approval chain"}
        </button>

        {/* ── Inline expanded detail ── */}
        {state.expanded && (
          <div className="bg-muted/30 mt-3 rounded-lg border p-3 space-y-3">
            {/* Full context */}
            <div>
              <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Context
              </p>
              <p className="text-xs leading-relaxed">{approval.context}</p>
            </div>

            {/* Evidence */}
            {approval.evidence && (
              <div>
                <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Evidence
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {approval.evidence.split(" · ").map((ev) => (
                    <span
                      key={ev}
                      className="inline-flex items-center gap-1 rounded-md bg-background border px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    >
                      <FileText className="size-3 shrink-0" />
                      {ev}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Approval chain */}
            <div>
              <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Approval chain
              </p>
              <div className="space-y-1">
                {approval.approvalChain.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    {step.status === "approved" ? (
                      <CheckCircle2 className="size-3.5 text-success shrink-0" />
                    ) : step.status === "pending" ? (
                      <Clock className="size-3.5 text-warning shrink-0" />
                    ) : (
                      <AlertTriangle className="size-3.5 text-muted-foreground shrink-0" />
                    )}
                    <span className="text-muted-foreground">{step.role}:</span>
                    <span className={CHAIN_STATUS_STYLE[step.status]}>
                      {step.name}
                    </span>
                    {step.status === "approved" && (
                      <span className="text-success-muted-foreground text-[10px]">
                        Approved
                      </span>
                    )}
                    {step.status === "pending" && (
                      <span className="text-warning-muted-foreground text-[10px]">
                        Awaiting
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ID */}
            <p className="text-[10px] text-muted-foreground/60 font-mono">
              {approval.id}
            </p>
          </div>
        )}

        {/* ── Inline action: confirm Approve or Reject ── */}
        {state.inlineAction && (
          <div
            className={cn(
              "mt-3 rounded-lg border p-3 space-y-2",
              state.inlineAction === "approve"
                ? "bg-success-muted border-success/30"
                : "bg-danger-muted border-danger/30",
            )}
          >
            <p className="text-xs font-semibold">
              {state.inlineAction === "approve"
                ? "Confirm approval"
                : "Confirm rejection"}{" "}
              — add an optional comment:
            </p>
            <textarea
              value={state.comment}
              onChange={(e) => onCommentChange(e.target.value)}
              placeholder="Optional comment…"
              rows={2}
              className="w-full resize-none rounded-md border bg-background px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring/50 placeholder:text-muted-foreground/60"
            />
            <div className="flex items-center gap-2">
              <Button
                size="xs"
                variant={
                  state.inlineAction === "approve" ? "default" : "destructive"
                }
                onClick={onConfirmAction}
              >
                {state.inlineAction === "approve" ? (
                  <>
                    <CheckCircle className="size-3" />
                    Confirm Approve
                  </>
                ) : (
                  <>
                    <XCircle className="size-3" />
                    Confirm Reject
                  </>
                )}
              </Button>
              <button
                onClick={onCancelAction}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Settled state indicator ── */}
        {isSettled && (
          <div
            className={cn(
              "mt-3 flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium",
              state.status === "approved"
                ? "bg-success-muted text-success-muted-foreground"
                : "bg-danger-muted text-danger-muted-foreground",
            )}
          >
            {state.status === "approved" ? (
              <CheckCircle2 className="size-3.5" />
            ) : (
              <XCircle className="size-3.5" />
            )}
            {state.status === "approved"
              ? "Approved — recorded in audit log"
              : "Rejected — recorded in audit log"}
          </div>
        )}

        {/* ── Bottom action bar (only while pending + no inline action active) ── */}
        {!isSettled && !state.inlineAction && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t pt-3">
            <Button
              size="xs"
              variant="default"
              onClick={() => onStartAction("approve")}
              className="bg-success/90 hover:bg-success/80 text-white border-transparent"
            >
              <CheckCircle className="size-3" />
              Approve
            </Button>
            <Button
              size="xs"
              variant="destructive"
              onClick={() => onStartAction("reject")}
            >
              <XCircle className="size-3" />
              Reject
            </Button>
            <Button size="xs" variant="outline">
              <RefreshCw className="size-3" />
              Request Changes
            </Button>
            <Button size="xs" variant="outline">
              <UserPlus className="size-3" />
              Delegate
            </Button>
            <Button size="xs" variant="outline">
              <MessageSquare className="size-3" />
              Comment
            </Button>
            <Button size="xs" variant="ghost" className="ml-auto px-1.5">
              <MoreHorizontal className="size-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────

export default function ApprovalsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All");

  // Per-card state
  const [cardStates, setCardStates] = useState<Record<string, CardState>>(
    () =>
      Object.fromEntries(
        APPROVALS.map((a) => [
          a.id,
          { expanded: false, inlineAction: null, comment: "", status: "pending" as CardStatus },
        ]),
      ),
  );

  function updateCard(id: string, patch: Partial<CardState>) {
    setCardStates((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  const filtered =
    activeFilter === "All"
      ? APPROVALS
      : APPROVALS.filter((a) => a.type === activeFilter);

  // Stats
  const pending = APPROVALS.filter(
    (a) => cardStates[a.id]?.status === "pending",
  ).length;
  const overdue = APPROVALS.filter(
    (a) => a.slaStatus === "overdue" && cardStates[a.id]?.status === "pending",
  ).length;
  const dueToday = APPROVALS.filter(
    (a) =>
      (a.slaStatus === "today" || a.slaStatus === "urgent") &&
      cardStates[a.id]?.status === "pending",
  ).length;

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="Approval Center"
        description="Unified inbox for all pending approvals requiring your review."
      />

      {/* ── Stat row ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={Clock} label="Pending" value={pending} />
        <StatTile
          icon={AlertTriangle}
          label="Overdue"
          value={overdue}
          tone="danger"
        />
        <StatTile
          icon={Clock}
          label="Due today"
          value={dueToday}
          tone="warning"
        />
        <StatTile
          icon={CheckCircle}
          label="Avg response"
          value="4.2"
          suffix="hrs"
          tone="info"
        />
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex flex-wrap gap-1.5">
        {TYPE_FILTER_TABS.map((tab) => {
          const count =
            tab === "All"
              ? APPROVALS.filter((a) => cardStates[a.id]?.status === "pending")
                  .length
              : APPROVALS.filter(
                  (a) =>
                    a.type === tab && cardStates[a.id]?.status === "pending",
                ).length;

          return (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                activeFilter === tab
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground border-border",
              )}
            >
              {tab}
              {count > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                    activeFilter === tab
                      ? "bg-white/20 text-white"
                      : "bg-muted-foreground/10 text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Approval card list ── */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No approvals in this category"
          description="All approvals here have been resolved, or none exist for this type."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((approval) => {
            const state = cardStates[approval.id];
            return (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                state={state}
                onToggleExpand={() =>
                  updateCard(approval.id, { expanded: !state.expanded })
                }
                onStartAction={(action) =>
                  updateCard(approval.id, {
                    inlineAction: action,
                    expanded: true,
                  })
                }
                onCancelAction={() =>
                  updateCard(approval.id, {
                    inlineAction: null,
                    comment: "",
                  })
                }
                onConfirmAction={() => {
                  updateCard(approval.id, {
                    status:
                      state.inlineAction === "approve" ? "approved" : "rejected",
                    inlineAction: null,
                    comment: "",
                    expanded: false,
                  });
                }}
                onCommentChange={(val) =>
                  updateCard(approval.id, { comment: val })
                }
              />
            );
          })}
        </div>
      )}

      {/* ── Footer note ── */}
      <div className="text-muted-foreground flex items-center gap-1.5 rounded-lg border border-dashed px-4 py-2.5 text-xs">
        <Sparkles className="text-ai size-3.5 shrink-0" />
        High-risk approvals (rate changes, screening adjudication, compliance
        overrides) always require human review — AI never auto-executes these
        actions (§11, §25).
      </div>
    </PageContainer>
  );
}
