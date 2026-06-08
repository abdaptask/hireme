"use client";

/**
 * HR Operations Command Center — Onboarder Workspace (§5.3).
 *
 * Primary question: "What needs my attention right now and what is each
 * candidate's status?"
 *
 * Architecture:
 *  1. AI Morning Briefing (§41.4) — gradient card with quick-action chips
 *  2. Vitals Bar — 8 stat tiles
 *  3. Tabbed Work Area — Needs Attention | All Onboardings | Document Review
 *  4. Right Rail — Readiness Radar, Stage Pipeline, Upcoming Starts, Exceptions
 */

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bell,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Clock,
  FileSearch,
  FileText,
  MessageSquare,
  MoreHorizontal,
  Send,
  Shield,
  TriangleAlert,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import {
  PipelineStatusBadge,
  RiskBadge,
  StatusBadge,
  StatusDot,
} from "@/components/status-badge";
import { BarList, WidgetCard } from "@/components/dashboard/widgets";
import { StatTile } from "@/components/workspace/stat-tile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CURRENT_ONBOARDER,
  getOnboarderCandidates,
  getStageCounts,
  getStartDateRisks,
  type CandidateSummary,
} from "@/lib/candidates";

// ─────────────────────────────────────────────────────────────────────────────
// Extended mock data for needs-attention items beyond what candidates.ts yields
// ─────────────────────────────────────────────────────────────────────────────

type UrgencyBand = "critical" | "sla" | "waiting" | "in-review";

type AttentionItem = {
  id: string;
  band: UrgencyBand;
  candidateName: string;
  candidateId: string;
  client: string;
  stage: string;
  needed: string;
  startDateLabel: string;
  startInDays: number;
  recruiter: string;
  startedLabel: string;
  slaLabel?: string; // e.g. "4h 22m"
};

const ATTENTION_ITEMS: AttentionItem[] = [
  {
    id: "att-1",
    band: "critical",
    candidateName: "Sarah Chen",
    candidateId: "sarah-chen",
    client: "Atlas Manufacturing",
    stage: "Document Submission",
    needed: "Government ID rejected — awaiting re-upload",
    startDateLabel: "Jun 15",
    startInDays: 8,
    recruiter: "Aaron Flores",
    startedLabel: "Jun 3",
    slaLabel: "4h 22m",
  },
  {
    id: "att-2",
    band: "critical",
    candidateName: "James Rivera",
    candidateId: "james-rivera",
    client: "Meridian Health",
    stage: "Background Check",
    needed: "Background check consent not submitted — start Jun 12",
    startDateLabel: "Jun 12",
    startInDays: 5,
    recruiter: "Devon Hughes",
    startedLabel: "Jun 1",
    slaLabel: "1h 55m",
  },
  {
    id: "att-3",
    band: "sla",
    candidateName: "Marcus Webb",
    candidateId: "marcus-webb",
    client: "Northwind Logistics",
    stage: "Tax & Payroll",
    needed: "W-9 rejected — payroll processing blocked until corrected",
    startDateLabel: "Jun 18",
    startInDays: 6,
    recruiter: "Devon Hughes",
    startedLabel: "Jun 4",
    slaLabel: "6h 0m",
  },
  {
    id: "att-4",
    band: "sla",
    candidateName: "Raj Patel",
    candidateId: "ravi-menon",
    client: "Cobalt Systems",
    stage: "Client Requirements",
    needed: "Client NDA awaiting account manager approval",
    startDateLabel: "Jun 10",
    startInDays: 3,
    recruiter: "Aaron Flores",
    startedLabel: "Jun 2",
    slaLabel: "2h 10m",
  },
  {
    id: "att-5",
    band: "waiting",
    candidateName: "Aisha Bello",
    candidateId: "aisha-bello",
    client: "Vertex Financial",
    stage: "Profile Setup",
    needed: "Candidate has not completed profile — 12 days to start",
    startDateLabel: "Jun 22",
    startInDays: 12,
    recruiter: "Lena Ortiz",
    startedLabel: "Jun 5",
  },
  {
    id: "att-6",
    band: "in-review",
    candidateName: "Grace Okafor",
    candidateId: "grace-okafor",
    client: "Meridian Health",
    stage: "Background Check",
    needed: "Screening in progress — estimated 2 more days",
    startDateLabel: "Jun 23",
    startInDays: 11,
    recruiter: "Lena Ortiz",
    startedLabel: "Jun 4",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Mock doc review data (extended with AI quality scores)
// ─────────────────────────────────────────────────────────────────────────────

type DocReviewItem = {
  id: string;
  candidateName: string;
  candidateId: string;
  docType: string;
  docName: string;
  submittedLabel: string;
  aiScore: number;
  aiNotes: string;
  status: "awaiting" | "flagged";
};

const DOC_REVIEW_ITEMS: DocReviewItem[] = [
  {
    id: "doc-1",
    candidateName: "Sarah Chen",
    candidateId: "sarah-chen",
    docType: "Identity",
    docName: "Government ID (Driver's License)",
    submittedLabel: "12m ago",
    aiScore: 61,
    aiNotes:
      "Image quality: 61/100 · Blurry bottom-right corner · Text partially unreadable · Expiration date not visible",
    status: "flagged",
  },
  {
    id: "doc-2",
    candidateName: "James Rivera",
    candidateId: "james-rivera",
    docType: "Work Authorization",
    docName: "I-9 Section 1",
    submittedLabel: "1h ago",
    aiScore: 87,
    aiNotes:
      "Image quality: 87/100 · All 4 corners visible · Text readable · Signature present · Missing middle initial",
    status: "awaiting",
  },
  {
    id: "doc-3",
    candidateName: "Grace Okafor",
    candidateId: "grace-okafor",
    docType: "Tax",
    docName: "Federal W-4",
    submittedLabel: "3h ago",
    aiScore: 94,
    aiNotes:
      "Image quality: 94/100 · All fields complete · Signature detected · Filing status: Single · No issues detected",
    status: "awaiting",
  },
  {
    id: "doc-4",
    candidateName: "Noah Klein",
    candidateId: "noah-klein",
    docType: "Payroll",
    docName: "Direct Deposit Authorization",
    submittedLabel: "5h ago",
    aiScore: 78,
    aiNotes:
      "Image quality: 78/100 · Bank routing number detected · Account number partially obscured · Signature present",
    status: "awaiting",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Mock upcoming starts (next 14 days)
// ─────────────────────────────────────────────────────────────────────────────

const UPCOMING_STARTS = [
  { name: "James Rivera", date: "Jun 12", daysOut: 5, risk: "at-risk" as const, id: "james-rivera" },
  { name: "Leo Park", date: "Jun 17", daysOut: 5, risk: "on-track" as const, id: "leo-park" },
  { name: "Marcus Webb", date: "Jun 18", daysOut: 6, risk: "needs-attention" as const, id: "marcus-webb" },
  { name: "Noah Klein", date: "Jun 19", daysOut: 7, risk: "needs-attention" as const, id: "noah-klein" },
  { name: "Owen Bradley", date: "Jun 14", daysOut: 2, risk: "unlikely" as const, id: "owen-bradley" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Mock exceptions
// ─────────────────────────────────────────────────────────────────────────────

const OPEN_EXCEPTIONS = [
  { id: "EXC-114", title: "Rejected identity document", severity: "High", age: "2d", tone: "danger" as const, candidateId: "sarah-chen" },
  { id: "EXC-112", title: "Background check SLA breach", severity: "High", age: "4d", tone: "danger" as const, candidateId: "james-rivera" },
  { id: "EXC-110", title: "Missing direct deposit info", severity: "Medium", age: "1d", tone: "warning" as const, candidateId: "noah-klein" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Readiness Radar data (§41.2)
// ─────────────────────────────────────────────────────────────────────────────

import type { StatusTone } from "@/lib/types";

const READINESS_DIMENSIONS: { label: string; pct: number; note: string; tone: StatusTone }[] = [
  { label: "Compliance", pct: 62, note: "4 items outstanding", tone: "warning" },
  { label: "Payroll", pct: 48, note: "3 candidates not ready", tone: "danger" },
  { label: "Client Approval", pct: 71, note: "2 awaiting sign-off", tone: "warning" },
  { label: "IT Provisioning", pct: 55, note: "Equipment ordered", tone: "info" },
  { label: "Training", pct: 80, note: "1 course overdue", tone: "success" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Band config
// ─────────────────────────────────────────────────────────────────────────────

const BAND_META: Record<
  UrgencyBand,
  { label: string; borderCls: string; headerCls: string }
> = {
  critical: {
    label: "CRITICAL — Action Today",
    borderCls: "border-l-2 border-danger",
    headerCls: "text-danger-muted-foreground",
  },
  sla: {
    label: "SLA APPROACHING",
    borderCls: "border-l-2 border-warning",
    headerCls: "text-warning-muted-foreground",
  },
  waiting: {
    label: "WAITING ON CANDIDATE",
    borderCls: "border-l-2 border-info",
    headerCls: "text-info-muted-foreground",
  },
  "in-review": {
    label: "IN REVIEW",
    borderCls: "border-l-2 border-neutral",
    headerCls: "text-muted-foreground",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Inline action state type
// ─────────────────────────────────────────────────────────────────────────────

type ActionState =
  | { type: "idle" }
  | { type: "confirming"; action: "approve" | "reject" }
  | { type: "done"; action: "approve" | "reject" }
  | { type: "reminded" };

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function SlaCountdown({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-warning-muted px-1.5 py-0.5 text-xs font-semibold tabular-nums text-warning-muted-foreground">
      <Clock className="size-3" />
      {label}
    </span>
  );
}

function AttentionCard({ item }: { item: AttentionItem }) {
  const [state, setState] = useState<ActionState>({ type: "idle" });
  const [comment, setComment] = useState("");
  const meta = BAND_META[item.band];

  const handleRemind = () => {
    setState({ type: "reminded" });
    setTimeout(() => setState({ type: "idle" }), 3000);
  };

  return (
    <div
      className={cn(
        "bg-card rounded-r-xl border border-l-0 p-3.5 shadow-xs transition-shadow hover:shadow-sm",
        meta.borderCls,
      )}
    >
      <div className="flex flex-col gap-2">
        {/* Row 1: name + stage + SLA */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex size-2 shrink-0 rounded-full bg-danger" aria-hidden />
          <Link
            href={`/candidates/${item.candidateId}`}
            className="hover:text-primary text-sm font-semibold"
          >
            {item.candidateName}
          </Link>
          <Badge variant="outline" className="text-xs">
            {item.stage}
          </Badge>
          {item.slaLabel && <SlaCountdown label={`SLA: ${item.slaLabel}`} />}
          <span className="text-metadata ml-auto whitespace-nowrap">
            Start {item.startDateLabel} · {item.startInDays}d away
          </span>
        </div>

        {/* Row 2: issue description */}
        <p className="text-muted-foreground text-sm">{item.needed}</p>

        {/* Row 3: meta */}
        <div className="text-metadata flex flex-wrap gap-x-3 gap-y-0.5">
          <span>{item.client}</span>
          <span>Recruiter: {item.recruiter}</span>
          <span>Started: {item.startedLabel}</span>
        </div>

        {/* Row 4: inline actions or confirmation */}
        {state.type === "idle" && (
          <div className="mt-0.5 flex flex-wrap gap-1">
            <Button
              size="xs"
              variant="ghost"
              className="text-success-muted-foreground hover:bg-success-muted"
              onClick={() => setState({ type: "confirming", action: "approve" })}
            >
              Approve
            </Button>
            <Button
              size="xs"
              variant="ghost"
              className="text-danger-muted-foreground hover:bg-danger-muted"
              onClick={() => setState({ type: "confirming", action: "reject" })}
            >
              Reject
            </Button>
            <Button size="xs" variant="ghost" onClick={handleRemind}>
              <Send className="size-3" />
              Send Reminder
            </Button>
            <Button size="xs" variant="ghost" nativeButton={false} render={<Link href={`/candidates/${item.candidateId}`} />}>
              Open Record
            </Button>
            <Button
              size="xs"
              variant="ghost"
              className="text-danger-muted-foreground"
            >
              Escalate
            </Button>
            <Button size="xs" variant="ghost">
              <MessageSquare className="size-3" />
              Add Note
            </Button>
          </div>
        )}

        {state.type === "reminded" && (
          <div className="mt-0.5 flex items-center gap-2 text-xs text-success-muted-foreground">
            <CheckCircle2 className="size-3.5" />
            Reminder sent to {item.candidateName}
          </div>
        )}

        {state.type === "confirming" && (
          <div className="bg-muted mt-0.5 rounded-lg p-2.5">
            <p className="mb-2 text-xs font-medium">
              {state.action === "approve" ? "Confirm approval" : "Confirm rejection"} — add a note (optional)
            </p>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Document verified, all fields clear"
              className="border-border bg-background mb-2 w-full rounded-md border px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring/30"
            />
            <div className="flex gap-1.5">
              <Button
                size="xs"
                variant={state.action === "approve" ? "default" : "destructive"}
                onClick={() => setState({ type: "done", action: state.action })}
              >
                {state.action === "approve" ? "Confirm Approve" : "Confirm Reject"}
              </Button>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => { setState({ type: "idle" }); setComment(""); }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {state.type === "done" && (
          <div
            className={cn(
              "mt-0.5 flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium",
              state.action === "approve"
                ? "bg-success-muted text-success-muted-foreground"
                : "bg-danger-muted text-danger-muted-foreground",
            )}
          >
            {state.action === "approve" ? (
              <CheckCircle2 className="size-3.5" />
            ) : (
              <XCircle className="size-3.5" />
            )}
            {state.action === "approve" ? "Approved" : "Rejected"} — recorded in audit log
          </div>
        )}
      </div>
    </div>
  );
}

function BandGroup({
  band,
  items,
}: {
  band: UrgencyBand;
  items: AttentionItem[];
}) {
  if (items.length === 0) return null;
  const meta = BAND_META[band];
  return (
    <div className="flex flex-col gap-2">
      <p className={cn("text-xs font-semibold tracking-wider uppercase", meta.headerCls)}>
        {meta.label} ({items.length})
      </p>
      {items.map((item) => (
        <AttentionCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="bg-muted h-1.5 w-20 overflow-hidden rounded-full">
      <div
        className="bg-primary h-full rounded-full"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function AllOnboardingsTable({ candidates }: { candidates: CandidateSummary[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto">
      <table
        className="w-full border-collapse text-left"
        style={{ fontSize: "var(--table-font, 0.8125rem)" }}
      >
        <thead className="text-muted-foreground border-b">
          <tr>
            <th scope="col" className="px-2 py-2 font-medium">Candidate</th>
            <th scope="col" className="hidden px-2 py-2 font-medium sm:table-cell">Stage</th>
            <th scope="col" className="px-2 py-2 font-medium">Status</th>
            <th scope="col" className="hidden px-2 py-2 font-medium md:table-cell">Progress</th>
            <th scope="col" className="px-2 py-2 font-medium">Risk</th>
            <th scope="col" className="hidden px-2 py-2 font-medium sm:table-cell">Start</th>
            <th scope="col" className="hidden px-2 py-2 font-medium lg:table-cell">Recruiter</th>
            <th scope="col" className="px-2 py-2 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((c) => (
            <>
              <tr
                key={c.id}
                className="hover:bg-muted/50 cursor-pointer border-b last:border-0"
                onClick={() => setExpanded(expanded === c.id ? null : c.id)}
              >
                <td className="px-2 py-2">
                  <div className="flex items-center gap-1.5">
                    {expanded === c.id ? (
                      <ChevronUp className="text-muted-foreground size-3.5 shrink-0" />
                    ) : (
                      <ChevronDown className="text-muted-foreground size-3.5 shrink-0" />
                    )}
                    <span>
                      <Link
                        href={`/candidates/${c.id}`}
                        className="hover:text-primary block font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {c.name}
                      </Link>
                      <span className="text-metadata">{c.client}</span>
                    </span>
                  </div>
                </td>
                <td className="text-muted-foreground hidden px-2 py-2 whitespace-nowrap sm:table-cell">
                  {c.stage}
                </td>
                <td className="px-2 py-2">
                  <PipelineStatusBadge status={c.status} />
                </td>
                <td className="hidden px-2 py-2 md:table-cell">
                  <div className="flex items-center gap-2">
                    <ProgressBar value={c.progress} />
                    <span className="text-metadata tabular-nums">{c.progress}%</span>
                  </div>
                </td>
                <td className="px-2 py-2">
                  <RiskBadge level={c.risk} />
                </td>
                <td className="hidden px-2 py-2 whitespace-nowrap tabular-nums sm:table-cell">
                  {c.startDateLabel}
                  <span className="text-muted-foreground"> · {c.startInDays}d</span>
                </td>
                <td className="text-muted-foreground hidden px-2 py-2 whitespace-nowrap lg:table-cell">
                  {c.recruiter}
                </td>
                <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-1">
                    <Button size="xs" variant="ghost" nativeButton={false} render={<Link href={`/candidates/${c.id}`} />}>
                      Open
                    </Button>
                    <Button size="xs" variant="ghost">Remind</Button>
                    <Button size="xs" variant="ghost">
                      <MoreHorizontal className="size-3" />
                    </Button>
                  </div>
                </td>
              </tr>

              {expanded === c.id && (
                <tr key={`${c.id}-expand`} className="bg-muted/30 border-b">
                  <td colSpan={8} className="px-4 py-3">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="text-metadata mb-1">Contact</p>
                        <p className="text-sm">{c.email}</p>
                        <p className="text-sm">{c.phone}</p>
                      </div>
                      <div>
                        <p className="text-metadata mb-1">Assignment</p>
                        <p className="text-sm">{c.role}</p>
                        <p className="text-sm">{c.employmentType} · {c.location}</p>
                      </div>
                      <div>
                        <p className="text-metadata mb-1">Readiness</p>
                        <div className="flex gap-2">
                          <StatusBadge
                            tone={c.risk === "on-track" ? "success" : c.risk === "needs-attention" ? "warning" : "danger"}
                            withDot
                          >
                            {c.risk === "on-track" ? "Payroll OK" : "Payroll Pending"}
                          </StatusBadge>
                        </div>
                      </div>
                      <div>
                        <p className="text-metadata mb-1">Tags</p>
                        <div className="flex flex-wrap gap-1">
                          {c.tags.length === 0 ? (
                            <span className="text-muted-foreground text-xs">None</span>
                          ) : (
                            c.tags.map((t) => (
                              <Badge key={t} variant="outline" className="text-xs">
                                {t}
                              </Badge>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
          {candidates.length === 0 && (
            <tr>
              <td colSpan={8} className="text-muted-foreground px-2 py-10 text-center">
                <CheckCircle2 className="text-success mx-auto mb-2 size-5" />
                No candidates to show.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function DocReviewPanel() {
  const [selected, setSelected] = useState<DocReviewItem | null>(DOC_REVIEW_ITEMS[0]);
  const [actionStates, setActionStates] = useState<Record<string, "idle" | "approved" | "rejected" | "correction">>(
    Object.fromEntries(DOC_REVIEW_ITEMS.map((d) => [d.id, "idle"])),
  );
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const act = (id: string, action: "approved" | "rejected" | "correction") => {
    setActionStates((prev) => ({ ...prev, [id]: action }));
    setShowRejectInput(false);
    setRejectReason("");
  };

  const scoreColor = (score: number) =>
    score >= 85 ? "text-success-muted-foreground" : score >= 70 ? "text-warning-muted-foreground" : "text-danger-muted-foreground";

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      {/* Doc list */}
      <div className="flex flex-col gap-1">
        {DOC_REVIEW_ITEMS.map((doc) => {
          const docState = actionStates[doc.id];
          return (
            <button
              key={doc.id}
              onClick={() => setSelected(doc)}
              className={cn(
                "flex flex-col gap-0.5 rounded-lg px-3 py-2.5 text-left transition-colors",
                selected?.id === doc.id
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted",
              )}
            >
              <span className="text-sm font-medium leading-tight">{doc.candidateName}</span>
              <span className="text-metadata">{doc.docType}</span>
              {docState !== "idle" && (
                <span
                  className={cn(
                    "mt-0.5 text-xs font-medium",
                    docState === "approved"
                      ? "text-success-muted-foreground"
                      : docState === "rejected"
                        ? "text-danger-muted-foreground"
                        : "text-info-muted-foreground",
                  )}
                >
                  {docState === "approved" ? "Approved" : docState === "rejected" ? "Rejected" : "Correction requested"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Inspector panel */}
      {selected && (
        <div className="bg-muted/30 flex flex-col gap-3 rounded-xl border p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">{selected.docName}</p>
              <p className="text-metadata">{selected.docType} · Submitted {selected.submittedLabel}</p>
            </div>
            <Link href={`/candidates/${selected.candidateId}`} className="text-primary text-xs hover:underline">
              Open record
            </Link>
          </div>

          {/* AI Analysis */}
          <div className="bg-ai-muted rounded-lg p-3">
            <div className="mb-2 flex items-center gap-1.5">
              <Zap className="text-ai-muted-foreground size-3.5" />
              <span className="text-xs font-semibold text-ai-muted-foreground">AI Document Analysis</span>
              <span className={cn("ml-auto text-xs font-bold tabular-nums", scoreColor(selected.aiScore))}>
                {selected.aiScore}/100
              </span>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">{selected.aiNotes}</p>
          </div>

          {/* Document placeholder */}
          <div className="bg-muted flex h-32 items-center justify-center rounded-lg border border-dashed">
            <div className="flex flex-col items-center gap-1 text-center">
              <FileText className="text-muted-foreground size-7" />
              <p className="text-metadata">Document preview</p>
              <p className="text-metadata">PDF / image viewer (v0.3)</p>
            </div>
          </div>

          {/* Actions */}
          {actionStates[selected.id] === "idle" ? (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                className="bg-success text-success-foreground hover:bg-success/90"
                onClick={() => act(selected.id, "approved")}
              >
                <CheckCircle2 className="size-3.5" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowRejectInput(!showRejectInput)}
              >
                <XCircle className="size-3.5" />
                Reject with Reason
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => act(selected.id, "correction")}
              >
                Request Correction
              </Button>

              {showRejectInput && (
                <div className="w-full">
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Rejection reason (e.g. Image is blurry, re-upload required)"
                    className="border-border bg-background mb-2 w-full rounded-md border px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring/30"
                  />
                  <div className="flex gap-1.5">
                    <Button
                      size="xs"
                      variant="destructive"
                      onClick={() => act(selected.id, "rejected")}
                    >
                      Confirm Rejection
                    </Button>
                    <Button size="xs" variant="ghost" onClick={() => setShowRejectInput(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                actionStates[selected.id] === "approved"
                  ? "bg-success-muted text-success-muted-foreground"
                  : actionStates[selected.id] === "rejected"
                    ? "bg-danger-muted text-danger-muted-foreground"
                    : "bg-info-muted text-info-muted-foreground",
              )}
            >
              {actionStates[selected.id] === "approved" ? (
                <CheckCircle2 className="size-4" />
              ) : (
                <XCircle className="size-4" />
              )}
              {actionStates[selected.id] === "approved"
                ? "Document approved — candidate notified"
                : actionStates[selected.id] === "rejected"
                  ? "Document rejected — correction request sent"
                  : "Correction requested — candidate notified"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

type Tab = "attention" | "all" | "docs";

export default function OnboarderWorkspacePage() {
  const [activeTab, setActiveTab] = useState<Tab>("attention");
  const [reminderToast] = useState<string | null>(null);

  const mine = getOnboarderCandidates();
  const stageCounts = getStageCounts();
  const risks = getStartDateRisks();

  const startingSoon = mine.filter((c) => c.startInDays <= 7).length;
  const waitingExternal = mine.filter((c) => c.status === "waiting-external").length;
  const slaBreaches = 2; // mock
  const exceptions = OPEN_EXCEPTIONS.length;
  const todayTasks = 8; // mock
  const docReviewCount = DOC_REVIEW_ITEMS.length;

  // Group attention items by band
  const bands: UrgencyBand[] = ["critical", "sla", "waiting", "in-review"];

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "attention", label: "Needs Attention", badge: ATTENTION_ITEMS.length },
    { id: "all", label: "All Onboardings", badge: mine.length },
    { id: "docs", label: "Document Review", badge: docReviewCount },
  ];

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="HR Operations"
        description={`${CURRENT_ONBOARDER}'s command center · ${mine.length} active onboardings`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5">
              <Users className="size-3" /> {mine.length} active
            </Badge>
            <Button size="sm" variant="outline">
              <Bell className="size-3.5" />
              Alerts
            </Button>
          </div>
        }
      />

      {/* ── 1. AI MORNING BRIEFING (§41.4) ─────────────────────────────── */}
      <div className="from-primary/5 to-card relative overflow-hidden rounded-xl border bg-gradient-to-r p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <div className="bg-ai-muted text-ai-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
            <Bot className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="mb-1.5 flex items-center gap-2">
              <p className="text-sm font-semibold">AI Morning Briefing</p>
              <span className="text-metadata">Today, 8:47 AM</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              You have{" "}
              <span className="text-foreground font-medium">{mine.length} active onboardings</span>.{" "}
              <span className="text-danger font-medium">{risks.length} start dates are at risk</span> — the most
              urgent is{" "}
              <Link href="/candidates/james-rivera" className="text-danger underline underline-offset-2">
                James Rivera
              </Link>{" "}
              starting Jun 12.{" "}
              <span className="text-warning font-medium">{docReviewCount} documents await review</span>.{" "}
              <span className="text-warning font-medium">2 background checks have exceeded SLA</span>.{" "}
              <span className="text-foreground font-medium">3 candidates have not responded in 48+ hours</span>.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab("docs")}
                className="bg-warning-muted text-warning-muted-foreground hover:opacity-80 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-opacity"
              >
                <FileSearch className="size-3" />
                Review documents ({docReviewCount})
              </button>
              <button
                onClick={() => setActiveTab("attention")}
                className="bg-danger-muted text-danger-muted-foreground hover:opacity-80 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-opacity"
              >
                <TriangleAlert className="size-3" />
                View at-risk ({risks.length})
              </button>
              <button
                onClick={() => setActiveTab("attention")}
                className="bg-info-muted text-info-muted-foreground hover:opacity-80 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-opacity"
              >
                <Clock className="size-3" />
                See SLA breaches ({slaBreaches})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. VITALS BAR ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <StatTile icon={Users} label="Active" value={mine.length} tone="default" />
        <StatTile icon={TriangleAlert} label="At Risk" value={risks.length} tone="danger" />
        <StatTile icon={Clock} label="Starting ≤7d" value={startingSoon} tone="warning" />
        <StatTile icon={FileSearch} label="Doc Review" value={docReviewCount} tone="info" />
        <StatTile icon={Bell} label="Waiting External" value={waitingExternal} />
        <StatTile icon={AlertTriangle} label="SLA Breach" value={slaBreaches} tone="danger" />
        <StatTile icon={Shield} label="Exceptions" value={exceptions} tone="warning" />
        <StatTile icon={ClipboardCheck} label="Today's Tasks" value={todayTasks} tone="info" />
      </div>

      {/* ── 3. TABBED WORK AREA + RIGHT RAIL ───────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Left: tabs */}
        <div className="flex flex-col gap-4">
          {/* Tab bar */}
          <div className="flex gap-1 rounded-xl bg-muted p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  activeTab === t.id
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
                {t.badge !== undefined && t.badge > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-xs tabular-nums",
                      activeTab === t.id
                        ? "bg-primary/10 text-primary"
                        : "bg-muted-foreground/20 text-muted-foreground",
                    )}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab 1: Needs Attention */}
          {activeTab === "attention" && (
            <div className="flex flex-col gap-5">
              {bands.map((band) => {
                const items = ATTENTION_ITEMS.filter((i) => i.band === band);
                return <BandGroup key={band} band={band} items={items} />;
              })}
              {ATTENTION_ITEMS.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-14 text-center">
                  <CheckCircle2 className="text-success mx-auto mb-2 size-8" />
                  <p className="font-medium">Queue is clear</p>
                  <p className="text-muted-foreground mt-1 text-sm">All active onboardings are on track.</p>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: All Onboardings */}
          {activeTab === "all" && (
            <div className="bg-card rounded-xl border shadow-xs">
              <div className="flex items-center justify-between border-b px-4 py-2.5">
                <h2 className="text-card-heading">All Onboardings</h2>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {mine.length} candidates
                </span>
              </div>
              <div className="p-0">
                <AllOnboardingsTable candidates={mine} />
              </div>
            </div>
          )}

          {/* Tab 3: Document Review */}
          {activeTab === "docs" && (
            <div className="bg-card rounded-xl border shadow-xs">
              <div className="flex items-center justify-between border-b px-4 py-2.5">
                <h2 className="text-card-heading">Document Review</h2>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {docReviewCount} awaiting
                </span>
              </div>
              <div className="p-4">
                <DocReviewPanel />
              </div>
            </div>
          )}
        </div>

        {/* Right rail */}
        <div className="flex flex-col gap-4">
          {/* Readiness Radar (§41.2) */}
          <WidgetCard title="Readiness Radar">
            <div className="flex flex-col gap-3">
              {READINESS_DIMENSIONS.map((dim) => (
                <div key={dim.label} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <StatusDot tone={dim.tone} />
                      <span className="text-sm font-medium">{dim.label}</span>
                    </div>
                    <span className="text-metadata tabular-nums">{dim.pct}%</span>
                  </div>
                  <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        dim.tone === "success" ? "bg-success" :
                        dim.tone === "warning" ? "bg-warning" :
                        dim.tone === "danger" ? "bg-danger" :
                        dim.tone === "info" ? "bg-info" : "bg-neutral",
                      )}
                      style={{ width: `${dim.pct}%` }}
                    />
                  </div>
                  <p className="text-metadata">{dim.note}</p>
                </div>
              ))}
            </div>
          </WidgetCard>

          {/* Stage Pipeline */}
          <WidgetCard title="Stage Pipeline">
            <BarList
              rows={stageCounts.map((s) => ({ name: s.stage, value: s.count }))}
              tone="info"
            />
          </WidgetCard>

          {/* Upcoming Start Dates (next 14 days) */}
          <WidgetCard title="Upcoming Starts (14d)">
            <ul className="flex flex-col gap-2.5">
              {UPCOMING_STARTS.sort((a, b) => a.daysOut - b.daysOut).map((s) => {
                const riskTone =
                  s.risk === "on-track" ? "success" :
                  s.risk === "needs-attention" ? "warning" : "danger";
                return (
                  <li key={s.id} className="flex items-center gap-2">
                    <StatusDot tone={riskTone} />
                    <Link
                      href={`/candidates/${s.id}`}
                      className="hover:text-primary min-w-0 flex-1 truncate text-sm font-medium"
                    >
                      {s.name}
                    </Link>
                    <span className="text-metadata whitespace-nowrap tabular-nums">
                      {s.date}
                    </span>
                  </li>
                );
              })}
            </ul>
          </WidgetCard>

          {/* Exception Alerts */}
          <WidgetCard
            title="Open Exceptions"
            action={
              <Link href="/exceptions" className="text-primary text-xs hover:underline">
                View all
              </Link>
            }
          >
            <ul className="flex flex-col gap-2.5">
              {OPEN_EXCEPTIONS.map((exc) => (
                <li key={exc.id} className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <StatusDot tone={exc.tone} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {exc.title}
                    </span>
                  </div>
                  <div className="text-metadata ml-4 flex items-center gap-2">
                    <span>{exc.id}</span>
                    <span>·</span>
                    <span className={cn(
                      exc.severity === "High" ? "text-danger-muted-foreground" : "text-warning-muted-foreground",
                    )}>
                      {exc.severity}
                    </span>
                    <span>·</span>
                    <span>{exc.age} old</span>
                  </div>
                </li>
              ))}
            </ul>
          </WidgetCard>
        </div>
      </div>

      {/* Reminder toast */}
      {reminderToast && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm text-background shadow-lg">
          <CheckCircle2 className="size-4 text-success" />
          {reminderToast}
        </div>
      )}
    </PageContainer>
  );
}
