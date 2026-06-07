"use client";

import { useState } from "react";
import {
  ChevronRight,
  ClipboardCheck,
  Eye,
  FilePen,
  PlusCircle,
  Redo2,
  Send,
  ShieldCheck,
  Undo2,
  UserCheck,
  Workflow,
  Zap,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import type { StatusTone } from "@/lib/types";

// ─── Workflow list (sidebar) ──────────────────────────────────────────────────

type WorkflowEntry = {
  id: string;
  name: string;
  status: "published" | "draft";
};

const SAMPLE_WORKFLOWS: WorkflowEntry[] = [
  { id: "wf-001", name: "Standard Onboarding — W-2", status: "published" },
  { id: "wf-002", name: "Healthcare Client — Meridian", status: "published" },
  { id: "wf-003", name: "C2C Contractor Flow", status: "published" },
  { id: "wf-004", name: "Delta Re-onboarding", status: "published" },
  { id: "wf-005", name: "Offboarding Workflow", status: "published" },
  { id: "wf-006", name: "New — Draft", status: "draft" },
];

const WORKFLOW_STATUS: Record<
  WorkflowEntry["status"],
  { tone: StatusTone; label: string }
> = {
  published: { tone: "success", label: "Published" },
  draft: { tone: "neutral", label: "Draft" },
};

// ─── Canvas nodes ─────────────────────────────────────────────────────────────

type NodeType =
  | "start"
  | "profile-setup"
  | "document-review"
  | "approval-gate"
  | "screening"
  | "day1-ready";

type CanvasNode = {
  id: NodeType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
  ring: string;
};

const NODES: CanvasNode[] = [
  {
    id: "start",
    label: "Start",
    icon: Zap,
    description: "Offer accepted trigger",
    color: "bg-success-muted text-success-muted-foreground",
    ring: "ring-success/40",
  },
  {
    id: "profile-setup",
    label: "Profile Setup",
    icon: FilePen,
    description: "Candidate profile & info",
    color: "bg-info-muted text-info-muted-foreground",
    ring: "ring-info/40",
  },
  {
    id: "document-review",
    label: "Document Review",
    icon: ClipboardCheck,
    description: "Upload & verify documents",
    color: "bg-info-muted text-info-muted-foreground",
    ring: "ring-info/40",
  },
  {
    id: "approval-gate",
    label: "Approval Gate",
    icon: ShieldCheck,
    description: "Onboarder / AM approval",
    color: "bg-warning-muted text-warning-muted-foreground",
    ring: "ring-warning/40",
  },
  {
    id: "screening",
    label: "Screening",
    icon: UserCheck,
    description: "Background & drug check",
    color: "bg-ai-muted text-ai-muted-foreground",
    ring: "ring-ai/40",
  },
  {
    id: "day1-ready",
    label: "Day 1 Ready",
    icon: Send,
    description: "Payroll, IT, equipment",
    color: "bg-success-muted text-success-muted-foreground",
    ring: "ring-success/40",
  },
];

// ─── Inspector fields for the selected node ───────────────────────────────────

type InspectorData = {
  nodeType: string;
  ownerRole: string;
  sla: string;
  documents: string[];
  conditions: string[];
};

const NODE_INSPECTOR: Record<NodeType, InspectorData> = {
  start: {
    nodeType: "Trigger",
    ownerRole: "System",
    sla: "Auto — no SLA",
    documents: [],
    conditions: ["Offer status = Accepted", "Assignment created"],
  },
  "profile-setup": {
    nodeType: "Candidate Task",
    ownerRole: "Candidate",
    sla: "48 hours from invite",
    documents: ["Legal name confirmation", "Contact details form"],
    conditions: ["Candidate portal activated"],
  },
  "document-review": {
    nodeType: "Onboarder Task",
    ownerRole: "Onboarder",
    sla: "24 hours from submission",
    documents: [
      "Government-issued ID",
      "Social Security card",
      "I-9 form",
      "Client NDA",
      "Direct deposit form",
    ],
    conditions: [
      "All required forms submitted",
      "AI quality check passed",
    ],
  },
  "approval-gate": {
    nodeType: "Approval",
    ownerRole: "Senior Onboarder / Account Manager",
    sla: "4 business hours",
    documents: ["Package summary", "Compliance checklist"],
    conditions: [
      "Document review complete",
      "No open exceptions",
      "Screening ordered",
    ],
  },
  screening: {
    nodeType: "Integration Task",
    ownerRole: "System (HireRight)",
    sla: "3–5 business days",
    documents: ["Screening consent", "Drug test appointment"],
    conditions: ["Candidate consent received", "Screening package selected"],
  },
  "day1-ready": {
    nodeType: "Readiness Gate",
    ownerRole: "System + IT Ops",
    sla: "72 hours before start",
    documents: ["Day 1 instructions", "Equipment acknowledgment"],
    conditions: [
      "Screening clear",
      "Payroll setup complete",
      "Equipment shipped",
      "IT access provisioned",
    ],
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function WorkflowStudioPage() {
  const [activeWorkflow, setActiveWorkflow] = useState<string>("wf-001");
  const [selectedNode, setSelectedNode] = useState<NodeType>("document-review");

  const inspector = NODE_INSPECTOR[selectedNode];

  return (
    <PageContainer className="flex flex-col gap-0 p-0 max-w-none! px-0! py-0!">
      {/* Page header (outside the three-panel layout) */}
      <div className="border-b px-6 py-4">
        <PageHeader
          title="Workflow Studio"
          description="Visual no-code workflow designer — configure stages, tasks, conditions, approvals, and automation rules (§19, §103)."
        />
      </div>

      {/* Three-panel layout */}
      <div className="flex h-[calc(100vh-12rem)] overflow-hidden">

        {/* ── Left sidebar: workflow list ──────────────────────────────────── */}
        <aside className="flex w-56 shrink-0 flex-col border-r">
          <div className="flex items-center justify-between border-b px-3 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Workflows
            </span>
            <button
              className="text-muted-foreground hover:text-foreground"
              aria-label="New workflow"
            >
              <PlusCircle className="size-4" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto py-1">
            {SAMPLE_WORKFLOWS.map((wf) => {
              const statusMeta = WORKFLOW_STATUS[wf.status];
              return (
                <button
                  key={wf.id}
                  onClick={() => setActiveWorkflow(wf.id)}
                  className={cn(
                    "flex w-full flex-col items-start gap-1 px-3 py-2.5 text-left transition-colors",
                    activeWorkflow === wf.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <span className="flex items-center gap-1.5 text-sm font-medium leading-tight">
                    <Workflow className="size-3.5 shrink-0" />
                    {wf.name}
                  </span>
                  <StatusBadge tone={statusMeta.tone}>
                    {statusMeta.label}
                  </StatusBadge>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ── Center: canvas ───────────────────────────────────────────────── */}
        <main className="bg-muted/30 relative flex flex-1 flex-col overflow-hidden">
          {/* Canvas label */}
          <div className="flex items-center justify-between border-b bg-card px-4 py-2">
            <span className="text-sm font-medium">
              {SAMPLE_WORKFLOWS.find((w) => w.id === activeWorkflow)?.name}
            </span>
            <span className="text-muted-foreground text-xs">
              Click any node to inspect
            </span>
          </div>

          {/* Node flow */}
          <div className="flex flex-1 items-center justify-center overflow-auto p-8">
            <div className="flex items-center gap-0">
              {NODES.map((node, idx) => {
                const Icon = node.icon;
                const isSelected = selectedNode === node.id;
                const isLast = idx === NODES.length - 1;

                return (
                  <div key={node.id} className="flex items-center">
                    {/* Node card */}
                    <button
                      onClick={() => setSelectedNode(node.id)}
                      className={cn(
                        "group flex w-32 flex-col items-center gap-2 rounded-xl border-2 bg-card p-3 text-center shadow-xs transition-all",
                        isSelected
                          ? `border-primary ring-2 ${node.ring} shadow-sm`
                          : "border-border hover:border-primary/50 hover:shadow-sm",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-9 items-center justify-center rounded-lg",
                          node.color,
                        )}
                      >
                        <Icon className="size-4.5" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold leading-tight">
                          {node.label}
                        </p>
                        <p className="text-metadata mt-0.5 text-[10px] leading-tight">
                          {node.description}
                        </p>
                      </div>
                    </button>

                    {/* Arrow connector */}
                    {!isLast && (
                      <ChevronRight className="text-muted-foreground mx-1 size-5 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom toolbar */}
          <div className="flex items-center gap-1.5 border-t bg-card px-4 py-2.5">
            <button className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium hover:bg-muted">
              <PlusCircle className="size-3.5" />
              Add Node
            </button>
            <span className="text-border">|</span>
            <button className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium hover:bg-muted">
              <Undo2 className="size-3.5" />
              Undo
            </button>
            <button className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium hover:bg-muted">
              <Redo2 className="size-3.5" />
              Redo
            </button>
            <span className="text-border">|</span>
            <button className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium hover:bg-muted">
              <ShieldCheck className="size-3.5" />
              Validate
            </button>
            <button className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium hover:bg-muted">
              <Eye className="size-3.5" />
              Preview
            </button>
            <button className="bg-primary text-primary-foreground hover:bg-primary/90 ml-auto inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors">
              <Send className="size-3.5" />
              Publish
            </button>
          </div>
        </main>

        {/* ── Right: inspector panel ───────────────────────────────────────── */}
        <aside className="flex w-72 shrink-0 flex-col overflow-y-auto border-l bg-card">
          <div className="border-b px-4 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Node Inspector
            </span>
          </div>

          <div className="flex flex-col gap-4 px-4 py-4">
            {/* Selected node label */}
            <div>
              <p className="text-section-heading">
                {NODES.find((n) => n.id === selectedNode)?.label}
              </p>
              <p className="text-metadata mt-0.5">
                {NODES.find((n) => n.id === selectedNode)?.description}
              </p>
            </div>

            {/* Node Type */}
            <div>
              <label className="text-data-label block">Node Type</label>
              <p className="mt-1 text-sm font-medium">{inspector.nodeType}</p>
            </div>

            {/* Owner Role */}
            <div>
              <label className="text-data-label block">Owner Role</label>
              <p className="mt-1 text-sm font-medium">{inspector.ownerRole}</p>
            </div>

            {/* SLA */}
            <div>
              <label className="text-data-label block">SLA</label>
              <p className="mt-1 text-sm font-medium">{inspector.sla}</p>
            </div>

            {/* Required Documents */}
            {inspector.documents.length > 0 && (
              <div>
                <label className="text-data-label block">
                  Required Documents
                </label>
                <ul className="mt-1.5 flex flex-col gap-1">
                  {inspector.documents.map((doc) => (
                    <li
                      key={doc}
                      className="flex items-start gap-1.5 text-sm"
                    >
                      <span className="bg-primary mt-1.5 size-1.5 shrink-0 rounded-full" />
                      {doc}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Conditions */}
            {inspector.conditions.length > 0 && (
              <div>
                <label className="text-data-label block">Conditions</label>
                <ul className="mt-1.5 flex flex-col gap-1">
                  {inspector.conditions.map((cond) => (
                    <li
                      key={cond}
                      className="bg-muted/60 rounded-md px-2.5 py-1.5 text-xs leading-snug"
                    >
                      {cond}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}
