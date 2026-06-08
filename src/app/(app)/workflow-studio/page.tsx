"use client";

import { useMemo, useState } from "react";
import {
  ChevronRight,
  CircleDot,
  ClipboardCheck,
  Clock,
  FileDiff,
  GitBranch,
  History,
  Mail,
  Play,
  Plug,
  Plus,
  Redo2,
  Search,
  Sparkles,
  TriangleAlert,
  Undo2,
  UserCheck,
  Workflow,
  X,
  Zap,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { StatusBadge, StatusDot } from "@/components/status-badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { StatusTone } from "@/lib/types";

// ─── Workflow list ────────────────────────────────────────────────────────────

type WorkflowStatus = "published" | "draft" | "archived";

type WorkflowEntry = {
  id: string;
  name: string;
  status: WorkflowStatus;
  version: string;
  usedBy: number;
  lastEdited: string;
};

const SAMPLE_WORKFLOWS: WorkflowEntry[] = [
  {
    id: "wf-001",
    name: "Standard Onboarding — W-2",
    status: "published",
    version: "v3.2",
    usedBy: 24,
    lastEdited: "2 min ago",
  },
  {
    id: "wf-002",
    name: "Healthcare — Meridian Health",
    status: "published",
    version: "v2.1",
    usedBy: 6,
    lastEdited: "yesterday",
  },
  {
    id: "wf-003",
    name: "C2C Contractor Flow",
    status: "published",
    version: "v1.8",
    usedBy: 12,
    lastEdited: "3 days ago",
  },
  {
    id: "wf-004",
    name: "Delta Re-onboarding",
    status: "published",
    version: "v1.0",
    usedBy: 3,
    lastEdited: "1 week ago",
  },
  {
    id: "wf-005",
    name: "Offboarding Workflow",
    status: "published",
    version: "v2.0",
    usedBy: 8,
    lastEdited: "2 weeks ago",
  },
  {
    id: "wf-006",
    name: "Apex Dynamics — Custom",
    status: "draft",
    version: "v0.4",
    usedBy: 0,
    lastEdited: "4 hours ago",
  },
  {
    id: "wf-007",
    name: "Federal Contract Workflow",
    status: "draft",
    version: "v0.7",
    usedBy: 0,
    lastEdited: "yesterday",
  },
  {
    id: "wf-008",
    name: "Field Worker Onboarding",
    status: "archived",
    version: "v1.2",
    usedBy: 0,
    lastEdited: "3 months ago",
  },
];

const WORKFLOW_STATUS_META: Record<
  WorkflowStatus,
  { tone: StatusTone; label: string }
> = {
  published: { tone: "success", label: "Published" },
  draft: { tone: "warning", label: "Draft" },
  archived: { tone: "neutral", label: "Archived" },
};

// ─── Node types ───────────────────────────────────────────────────────────────

type NodeKind =
  | "start"
  | "task"
  | "decision"
  | "approval"
  | "wait"
  | "integration"
  | "ai-review"
  | "communication"
  | "escalation"
  | "end";

type NodeKindMeta = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Soft badge color used inside the node card icon chip. */
  chip: string;
  /** Border applied to the node card. */
  border: string;
  /** Ring color used when selected. */
  ring: string;
  /** Dot tone for legend. */
  tone: StatusTone;
};

const NODE_KIND_META: Record<NodeKind, NodeKindMeta> = {
  start: {
    label: "Start",
    icon: Zap,
    chip: "bg-success-muted text-success-muted-foreground",
    border: "border-success/60",
    ring: "ring-success/40",
    tone: "success",
  },
  task: {
    label: "Task",
    icon: ClipboardCheck,
    chip: "bg-info-muted text-info-muted-foreground",
    border: "border-info/60",
    ring: "ring-info/40",
    tone: "info",
  },
  decision: {
    label: "Decision",
    icon: GitBranch,
    chip: "bg-warning-muted text-warning-muted-foreground",
    border: "border-warning/60",
    ring: "ring-warning/40",
    tone: "warning",
  },
  approval: {
    label: "Approval",
    icon: UserCheck,
    chip: "bg-ai-muted text-ai-muted-foreground",
    border: "border-ai/60",
    ring: "ring-ai/40",
    tone: "ai",
  },
  wait: {
    label: "Wait",
    icon: Clock,
    chip: "bg-neutral-muted text-neutral-muted-foreground",
    border: "border-neutral/60",
    ring: "ring-neutral/40",
    tone: "neutral",
  },
  integration: {
    label: "Integration",
    icon: Plug,
    chip: "bg-info-muted text-info-muted-foreground",
    border: "border-info/60",
    ring: "ring-info/40",
    tone: "info",
  },
  "ai-review": {
    label: "AI Review",
    icon: Sparkles,
    chip: "bg-ai-muted text-ai-muted-foreground",
    border: "border-ai/60",
    ring: "ring-ai/40",
    tone: "ai",
  },
  communication: {
    label: "Communication",
    icon: Mail,
    chip: "bg-info-muted text-info-muted-foreground",
    border: "border-info/60",
    ring: "ring-info/40",
    tone: "info",
  },
  escalation: {
    label: "Escalation",
    icon: TriangleAlert,
    chip: "bg-danger-muted text-danger-muted-foreground",
    border: "border-danger/60",
    ring: "ring-danger/40",
    tone: "danger",
  },
  end: {
    label: "End",
    icon: CircleDot,
    chip: "bg-neutral-muted text-neutral-muted-foreground",
    border: "border-neutral/60",
    ring: "ring-neutral/40",
    tone: "neutral",
  },
};

// ─── Sample workflow graph ────────────────────────────────────────────────────

/**
 * Each node sits at (row, col) on a logical grid. The canvas renders nodes
 * absolutely positioned so SVG connection paths can be drawn between them.
 */
type GraphNode = {
  id: string;
  kind: NodeKind;
  label: string;
  description: string;
  row: number;
  col: number;
};

type GraphEdge = {
  from: string;
  to: string;
  /** Optional branch label (used by Decision nodes). */
  label?: string;
};

const NODE_W = 220;
const NODE_H = 80;
const COL_W = 260;
const ROW_H = 120;
const GUTTER_X = 40;
const GUTTER_Y = 32;

const GRAPH_NODES: GraphNode[] = [
  { id: "n-start", kind: "start", label: "Start", description: "Offer accepted trigger", row: 0, col: 1 },
  { id: "n-gen", kind: "task", label: "Generate Package", description: "Rule-based assembly", row: 1, col: 1 },
  { id: "n-ai-comp", kind: "ai-review", label: "Compliance Check", description: "AI rule validation", row: 2, col: 1 },
  { id: "n-welcome", kind: "communication", label: "Send Welcome Email", description: "Portal + email", row: 3, col: 1 },
  { id: "n-docs", kind: "task", label: "Document Submission", description: "Candidate uploads", row: 4, col: 1 },
  // Parallel sub-tasks fan out
  { id: "n-doc-id", kind: "task", label: "Upload ID", description: "Govt ID + selfie", row: 5, col: 0 },
  { id: "n-doc-i9", kind: "task", label: "I-9 Section 1", description: "Work authorization", row: 5, col: 1 },
  { id: "n-doc-tax", kind: "task", label: "Tax Forms", description: "W-4 + state forms", row: 5, col: 2 },
  // Rejoin
  { id: "n-dec-docs", kind: "decision", label: "Documents Complete?", description: "All required submitted", row: 6, col: 1 },
  { id: "n-review", kind: "approval", label: "Onboarder Review", description: "First-pass approval", row: 7, col: 1 },
  { id: "n-bg-order", kind: "integration", label: "Order Background Check", description: "HireRight API", row: 8, col: 1 },
  { id: "n-wait-bg", kind: "wait", label: "BG Check (avg 3 days)", description: "External vendor SLA", row: 9, col: 1 },
  { id: "n-dec-clear", kind: "decision", label: "Clear?", description: "Adjudication outcome", row: 10, col: 1 },
  { id: "n-escalate", kind: "escalation", label: "Adjudication Review", description: "Manual review required", row: 10, col: 2 },
  { id: "n-client", kind: "task", label: "Client Approval Request", description: "Account Manager push", row: 11, col: 1 },
  { id: "n-am", kind: "approval", label: "Account Manager Sign-off", description: "Client-side gate", row: 12, col: 1 },
  { id: "n-equip", kind: "task", label: "Equipment Provisioning", description: "Laptop, badge, access", row: 13, col: 1 },
  { id: "n-day1", kind: "communication", label: "Day 1 Welcome", description: "Personalized SMS + email", row: 14, col: 1 },
  { id: "n-end", kind: "end", label: "End", description: "Onboarding complete", row: 15, col: 1 },
];

const GRAPH_EDGES: GraphEdge[] = [
  { from: "n-start", to: "n-gen" },
  { from: "n-gen", to: "n-ai-comp" },
  { from: "n-ai-comp", to: "n-welcome" },
  { from: "n-welcome", to: "n-docs" },
  { from: "n-docs", to: "n-doc-id" },
  { from: "n-docs", to: "n-doc-i9" },
  { from: "n-docs", to: "n-doc-tax" },
  { from: "n-doc-id", to: "n-dec-docs" },
  { from: "n-doc-i9", to: "n-dec-docs" },
  { from: "n-doc-tax", to: "n-dec-docs" },
  { from: "n-dec-docs", to: "n-review", label: "Yes" },
  { from: "n-review", to: "n-bg-order" },
  { from: "n-bg-order", to: "n-wait-bg" },
  { from: "n-wait-bg", to: "n-dec-clear" },
  { from: "n-dec-clear", to: "n-client", label: "Clear" },
  { from: "n-dec-clear", to: "n-escalate", label: "Review" },
  { from: "n-client", to: "n-am" },
  { from: "n-am", to: "n-equip" },
  { from: "n-equip", to: "n-day1" },
  { from: "n-day1", to: "n-end" },
];

// Compute geometry: total canvas size and per-node positions
const GRID_COLS = 3;
const GRID_ROWS = 16;
const CANVAS_W = GRID_COLS * COL_W + GUTTER_X * 2;
const CANVAS_H = GRID_ROWS * ROW_H + GUTTER_Y * 2;

function nodeRect(node: GraphNode) {
  // Center the node within its column slot
  const slotX = GUTTER_X + node.col * COL_W;
  const x = slotX + (COL_W - NODE_W) / 2;
  const y = GUTTER_Y + node.row * ROW_H;
  return { x, y, w: NODE_W, h: NODE_H, cx: x + NODE_W / 2, cy: y + NODE_H / 2 };
}

// ─── Inspector data (per-node config) ─────────────────────────────────────────

type InspectorTab = "properties" | "conditions" | "sla" | "integrations";

type NodeInspector = {
  owner: string;
  dueOffset: string;
  required: boolean;
  conditions: { field: string; op: string; value: string }[];
  sla: string;
  warningAt: string;
  escalation: string[];
  reminderCadence: string;
  integrations: { name: string; action: string }[];
  outputMapping: { from: string; to: string }[];
};

const DEFAULT_INSPECTOR: NodeInspector = {
  owner: "Onboarder",
  dueOffset: "+1 business day from previous step",
  required: true,
  conditions: [
    { field: "Employment Type", op: "is", value: "W-2" },
    { field: "Client", op: "is not", value: "Apex Dynamics" },
  ],
  sla: "24h",
  warningAt: "75% (18h)",
  escalation: ["Owner", "Team Lead", "Recruiting Manager"],
  reminderCadence: "Portal → Email +24h → SMS +48h",
  integrations: [{ name: "DocuSign", action: "Send envelope" }],
  outputMapping: [
    { from: "envelope.status", to: "task.status" },
    { from: "envelope.completedAt", to: "task.completedAt" },
  ],
};

const INSPECTOR_OVERRIDES: Partial<Record<string, Partial<NodeInspector>>> = {
  "n-bg-order": {
    owner: "System (HireRight)",
    dueOffset: "Immediate on document approval",
    sla: "48h vendor accept",
    integrations: [{ name: "HireRight", action: "Order screening package" }],
  },
  "n-ai-comp": {
    owner: "AI Copilot",
    dueOffset: "+15 min after package generation",
    sla: "30 min",
    integrations: [{ name: "Compliance Engine", action: "Run rule set" }],
  },
  "n-wait-bg": {
    owner: "System",
    dueOffset: "Driven by vendor callback",
    sla: "5 business days",
    integrations: [{ name: "HireRight", action: "Subscribe to status webhook" }],
  },
  "n-am": {
    owner: "Account Manager",
    dueOffset: "+4 business hours",
    sla: "4h",
    integrations: [],
  },
  "n-dec-docs": {
    owner: "System",
    dueOffset: "Immediate",
    sla: "—",
    integrations: [],
  },
};

function getInspector(nodeId: string): NodeInspector {
  return { ...DEFAULT_INSPECTOR, ...(INSPECTOR_OVERRIDES[nodeId] ?? {}) };
}

// ─── Validation issues (mock) ─────────────────────────────────────────────────

const VALIDATION_ISSUES = [
  {
    severity: "warning" as const,
    nodeId: "n-wait-bg",
    title: "Node 'BG Check (avg 3 days)' has no hard SLA defined",
    detail: "Wait nodes should declare a maximum duration so escalations can trigger.",
  },
  {
    severity: "warning" as const,
    nodeId: "n-dec-docs",
    title: "Decision node 'Documents Complete?' has unreachable path",
    detail: "The 'No' branch has no downstream node — candidates will be stuck.",
  },
];

// ─── Simulation steps (mock) ──────────────────────────────────────────────────

const SIM_STEPS = [
  { nodeId: "n-start", message: "Offer accepted by Sarah Chen — workflow initialized" },
  { nodeId: "n-gen", message: "Package generated: 14 items (3 client-specific)" },
  { nodeId: "n-ai-comp", message: "Compliance check passed — 0 conflicts" },
  { nodeId: "n-welcome", message: "Welcome email delivered (open rate pending)" },
  { nodeId: "n-docs", message: "Document submission stage opened" },
  { nodeId: "n-doc-id", message: "ID uploaded — AI quality 94%" },
  { nodeId: "n-doc-i9", message: "I-9 Section 1 submitted" },
  { nodeId: "n-doc-tax", message: "Tax forms submitted (W-4 + CA-DE-4)" },
  { nodeId: "n-dec-docs", message: "All required documents present → proceed" },
  { nodeId: "n-review", message: "Onboarder approval requested (Maya Patel)" },
];

// ─── Version compare diff (mock) ──────────────────────────────────────────────

const VERSION_DIFF = [
  { kind: "added" as const, label: "AI Review — Compliance Check (auto-trigger after Generate Package)" },
  { kind: "added" as const, label: "Escalation — Adjudication Review (branch off 'Clear?' decision)" },
  { kind: "modified" as const, label: "Approval — Onboarder Review: SLA reduced from 48h to 24h" },
  { kind: "modified" as const, label: "Wait — BG Check: warning threshold tightened to 75%" },
  { kind: "removed" as const, label: "Task — Manual NDA upload (replaced by DocuSign integration)" },
];

const VERSION_CHANGELOG = [
  { who: "Abdulla N.", when: "today, 14:22", what: "Tightened approval SLA + added adjudication escalation" },
  { who: "Maya Patel", when: "today, 11:08", what: "Added AI compliance check node" },
  { who: "Jordan R.", when: "yesterday, 17:45", what: "Replaced manual NDA upload with DocuSign integration" },
  { who: "Maya Patel", when: "yesterday, 09:12", what: "Drafted v3.2 from published v3.1" },
  { who: "Abdulla N.", when: "3 days ago", what: "Published v3.1 — initial Standard Onboarding flow" },
];

// ─── Page component ───────────────────────────────────────────────────────────

type FilterPill = "all" | "published" | "draft" | "archived";
type BottomMode = "none" | "validate" | "simulate";

export default function WorkflowStudioPage() {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("wf-001");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("n-review");
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("properties");
  const [bottomPanelMode, setBottomPanelMode] = useState<BottomMode>("none");
  const [compareOpen, setCompareOpen] = useState(false);
  const [filterPill, setFilterPill] = useState<FilterPill>("all");
  const [search, setSearch] = useState("");
  const [simStepIdx, setSimStepIdx] = useState(0);
  const [workflowName, setWorkflowName] = useState("Standard Onboarding — W-2");

  const selectedWorkflow = useMemo(
    () => SAMPLE_WORKFLOWS.find((w) => w.id === selectedWorkflowId) ?? SAMPLE_WORKFLOWS[0],
    [selectedWorkflowId],
  );

  const filteredWorkflows = useMemo(() => {
    return SAMPLE_WORKFLOWS.filter((w) => {
      if (filterPill !== "all" && w.status !== filterPill) return false;
      if (search && !w.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [filterPill, search]);

  const selectedNode = useMemo(
    () => GRAPH_NODES.find((n) => n.id === selectedNodeId) ?? null,
    [selectedNodeId],
  );

  const inspector = selectedNode ? getInspector(selectedNode.id) : null;

  const activeSimNodeId = SIM_STEPS[simStepIdx]?.nodeId ?? null;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-background">
      {/* ─── Top bar ────────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-3 border-b bg-card px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-md">
            <Workflow className="size-4" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <input
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="min-w-0 truncate bg-transparent text-sm font-semibold outline-none focus:bg-muted/60 focus:px-1.5 focus:py-0.5 focus:rounded"
              />
              <span className="text-muted-foreground shrink-0 text-xs">
                {selectedWorkflow.version} — Draft
              </span>
              <StatusBadge tone={WORKFLOW_STATUS_META[selectedWorkflow.status].tone}>
                {WORKFLOW_STATUS_META[selectedWorkflow.status].label}
              </StatusBadge>
            </div>
            <p className="text-metadata text-[11px]">
              Last saved 2 min ago · Auto-save on
            </p>
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <TopBarButton onClick={() => undefined}>Save Draft</TopBarButton>
          <TopBarButton
            onClick={() =>
              setBottomPanelMode((m) => (m === "validate" ? "none" : "validate"))
            }
            active={bottomPanelMode === "validate"}
            icon={TriangleAlert}
          >
            Validate
          </TopBarButton>
          <TopBarButton
            onClick={() =>
              setBottomPanelMode((m) => (m === "simulate" ? "none" : "simulate"))
            }
            active={bottomPanelMode === "simulate"}
            icon={Play}
          >
            Simulate
          </TopBarButton>
          <TopBarButton onClick={() => setCompareOpen(true)} icon={FileDiff}>
            Compare versions
          </TopBarButton>
          <TopBarButton onClick={() => undefined} icon={History}>
            Export
          </TopBarButton>
          <button
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-7 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors"
            type="button"
          >
            Publish
          </button>
        </div>
      </div>

      {/* ─── Three-panel split ─────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1">
        {/* ─── Left: workflow list ─────────────────────────────────────── */}
        <aside className="flex w-60 shrink-0 flex-col border-r bg-card">
          <div className="border-b p-3">
            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search workflows"
                className="bg-muted/50 focus:bg-background h-8 w-full rounded-md border border-transparent pl-7 pr-2 text-xs outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <button
              type="button"
              className="mt-2 flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-dashed text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              <Plus className="size-3.5" />
              New Workflow
            </button>

            <div className="mt-2 flex flex-wrap gap-1">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "published", label: "Published" },
                  { id: "draft", label: "Drafts" },
                  { id: "archived", label: "Archived" },
                ] as { id: FilterPill; label: string }[]
              ).map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setFilterPill(pill.id)}
                  className={cn(
                    "h-6 rounded-full px-2.5 text-[11px] font-medium transition-colors",
                    filterPill === pill.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted",
                  )}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto py-1">
            {filteredWorkflows.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                No workflows match your filter.
              </div>
            ) : (
              filteredWorkflows.map((wf) => {
                const meta = WORKFLOW_STATUS_META[wf.status];
                const isActive = selectedWorkflowId === wf.id;
                return (
                  <button
                    key={wf.id}
                    type="button"
                    onClick={() => setSelectedWorkflowId(wf.id)}
                    className={cn(
                      "group flex w-full items-start gap-2 px-3 py-2.5 text-left transition-colors",
                      isActive
                        ? "bg-primary/10"
                        : "hover:bg-muted/60",
                    )}
                  >
                    <StatusDot tone={meta.tone} className="mt-1.5" />
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "truncate text-xs font-medium leading-tight",
                          isActive ? "text-primary" : "text-foreground",
                        )}
                      >
                        {wf.name}
                      </p>
                      <p className="text-metadata mt-0.5 text-[11px] leading-tight">
                        {wf.version} ·{" "}
                        {wf.usedBy > 0
                          ? `used by ${wf.usedBy}`
                          : "no active uses"}
                      </p>
                    </div>
                    <ChevronRight
                      className={cn(
                        "size-3.5 shrink-0 self-center transition-opacity",
                        isActive
                          ? "text-primary opacity-100"
                          : "text-muted-foreground opacity-0 group-hover:opacity-100",
                      )}
                    />
                  </button>
                );
              })
            )}
          </nav>

          {/* Node-kind legend */}
          <div className="border-t p-3">
            <p className="text-data-label mb-2 text-[10px]">Node Types</p>
            <div className="grid grid-cols-2 gap-1.5">
              {(
                [
                  "start",
                  "task",
                  "decision",
                  "approval",
                  "wait",
                  "integration",
                  "ai-review",
                  "communication",
                  "escalation",
                  "end",
                ] as NodeKind[]
              ).map((kind) => {
                const meta = NODE_KIND_META[kind];
                const Icon = meta.icon;
                return (
                  <div
                    key={kind}
                    className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
                  >
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded",
                        meta.chip,
                      )}
                    >
                      <Icon className="size-2.5" />
                    </span>
                    <span className="truncate">{meta.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ─── Center: canvas ──────────────────────────────────────────── */}
        <main className="relative flex min-w-0 flex-1 flex-col bg-muted/30">
          {/* Floating toolbar (top-right) */}
          <div className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-lg border bg-card/95 p-1 shadow-sm backdrop-blur">
            <CanvasIconButton icon={Plus} label="Add node" />
            <CanvasDivider />
            <CanvasIconButton icon={ZoomIn} label="Zoom in" />
            <CanvasIconButton icon={ZoomOut} label="Zoom out" />
            <CanvasIconButton icon={History} label="Fit to screen" />
            <CanvasDivider />
            <CanvasIconButton icon={Undo2} label="Undo" />
            <CanvasIconButton icon={Redo2} label="Redo" />
          </div>

          {/* Mini-map placeholder (bottom-right) */}
          <div className="absolute bottom-4 right-4 z-10 hidden h-28 w-44 rounded-lg border bg-card/95 p-2 shadow-sm backdrop-blur lg:block">
            <p className="text-metadata mb-1 text-[10px] uppercase tracking-wide">
              Minimap
            </p>
            <div className="relative h-[80px] w-full overflow-hidden rounded bg-muted/50">
              {GRAPH_NODES.map((node) => {
                const left = (node.col / (GRID_COLS - 1)) * 100;
                const top = (node.row / (GRID_ROWS - 1)) * 100;
                return (
                  <span
                    key={node.id}
                    className={cn(
                      "absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full",
                      node.id === selectedNodeId ? "bg-primary" : "bg-foreground/30",
                    )}
                    style={{ left: `${left}%`, top: `${top}%` }}
                  />
                );
              })}
            </div>
          </div>

          {/* Scrollable canvas viewport */}
          <div className="flex-1 overflow-auto">
            <CanvasGraph
              selectedNodeId={selectedNodeId}
              onSelect={setSelectedNodeId}
              activeSimNodeId={
                bottomPanelMode === "simulate" ? activeSimNodeId : null
              }
            />
          </div>

          {/* Bottom panel: validate / simulate */}
          {bottomPanelMode !== "none" && (
            <BottomPanel
              mode={bottomPanelMode}
              onClose={() => setBottomPanelMode("none")}
              simStepIdx={simStepIdx}
              setSimStepIdx={setSimStepIdx}
              onSelectNode={setSelectedNodeId}
            />
          )}
        </main>

        {/* ─── Right: inspector ────────────────────────────────────────── */}
        <aside className="flex w-72 shrink-0 flex-col border-l bg-card">
          {selectedNode && inspector ? (
            <>
              {/* Inspector header */}
              <div className="border-b p-3">
                <div className="flex items-center gap-2">
                  {(() => {
                    const meta = NODE_KIND_META[selectedNode.kind];
                    const Icon = meta.icon;
                    return (
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-md",
                          meta.chip,
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                    );
                  })()}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold leading-tight">
                      {selectedNode.label}
                    </p>
                    <p className="text-metadata text-[11px] leading-tight">
                      {NODE_KIND_META[selectedNode.kind].label} ·{" "}
                      {selectedNode.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex shrink-0 border-b">
                {(
                  [
                    { id: "properties", label: "Properties" },
                    { id: "conditions", label: "Conditions" },
                    { id: "sla", label: "SLA" },
                    { id: "integrations", label: "Integrations" },
                  ] as { id: InspectorTab; label: string }[]
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setInspectorTab(tab.id)}
                    className={cn(
                      "flex-1 border-b-2 px-2 py-2 text-[11px] font-medium transition-colors",
                      inspectorTab === tab.id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto p-3">
                {inspectorTab === "properties" && (
                  <PropertiesTab
                    node={selectedNode}
                    inspector={inspector}
                  />
                )}
                {inspectorTab === "conditions" && (
                  <ConditionsTab inspector={inspector} />
                )}
                {inspectorTab === "sla" && <SlaTab inspector={inspector} />}
                {inspectorTab === "integrations" && (
                  <IntegrationsTab inspector={inspector} />
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <span className="bg-muted text-muted-foreground mb-3 flex size-10 items-center justify-center rounded-full">
                <Workflow className="size-5" />
              </span>
              <p className="text-sm font-medium">Select a node to configure</p>
              <p className="text-metadata mt-1 text-xs">
                Click any node on the canvas to inspect its properties,
                conditions, SLA, and integration bindings.
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* ─── Compare versions sheet ─────────────────────────────────────── */}
      <Sheet open={compareOpen} onOpenChange={setCompareOpen}>
        <SheetContent className="!max-w-3xl">
          <SheetHeader>
            <SheetTitle>Compare workflow versions</SheetTitle>
            <SheetDescription>
              Side-by-side diff of {workflowName}: published v3.1 vs current
              draft v3.2.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {/* Side-by-side header */}
            <div className="grid grid-cols-2 gap-3 pb-3">
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="text-data-label">Previous</p>
                <p className="text-sm font-semibold">v3.1 — Published</p>
                <p className="text-metadata text-[11px]">
                  Published 3 days ago · 24 active candidates
                </p>
              </div>
              <div className="rounded-md border border-primary/40 bg-primary/5 p-3">
                <p className="text-data-label">Current draft</p>
                <p className="text-sm font-semibold">v3.2 — Draft</p>
                <p className="text-metadata text-[11px]">
                  Last edit 2 min ago · 5 changes since v3.1
                </p>
              </div>
            </div>

            {/* Diff list */}
            <p className="text-data-label mt-2 mb-1.5">Changes</p>
            <ul className="flex flex-col gap-1.5">
              {VERSION_DIFF.map((diff, i) => (
                <li
                  key={i}
                  className={cn(
                    "flex items-start gap-2 rounded-md border p-2.5 text-xs",
                    diff.kind === "added" &&
                      "border-success/30 bg-success-muted/40",
                    diff.kind === "removed" &&
                      "border-danger/30 bg-danger-muted/40",
                    diff.kind === "modified" &&
                      "border-warning/30 bg-warning-muted/40",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 inline-flex h-4 w-12 shrink-0 items-center justify-center rounded text-[10px] font-semibold uppercase",
                      diff.kind === "added" &&
                        "bg-success text-white",
                      diff.kind === "removed" && "bg-danger text-white",
                      diff.kind === "modified" &&
                        "bg-warning text-warning-foreground",
                    )}
                  >
                    {diff.kind === "added"
                      ? "+ Added"
                      : diff.kind === "removed"
                      ? "− Removed"
                      : "~ Modified"}
                  </span>
                  <span className="leading-snug">{diff.label}</span>
                </li>
              ))}
            </ul>

            {/* Change log */}
            <p className="text-data-label mt-4 mb-1.5">Change log</p>
            <div className="overflow-hidden rounded-md border">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-2.5 py-1.5 font-medium">Who</th>
                    <th className="px-2.5 py-1.5 font-medium">When</th>
                    <th className="px-2.5 py-1.5 font-medium">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {VERSION_CHANGELOG.map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-2.5 py-1.5 font-medium">{row.who}</td>
                      <td className="px-2.5 py-1.5 text-muted-foreground">
                        {row.when}
                      </td>
                      <td className="px-2.5 py-1.5">{row.what}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ─── Canvas graph ─────────────────────────────────────────────────────────────

function CanvasGraph({
  selectedNodeId,
  onSelect,
  activeSimNodeId,
}: {
  selectedNodeId: string | null;
  onSelect: (id: string) => void;
  activeSimNodeId: string | null;
}) {
  return (
    <div
      className="relative mx-auto my-6"
      style={{ width: CANVAS_W, height: CANVAS_H }}
    >
      {/* Grid background dots */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle, color-mix(in srgb, var(--foreground) 12%, transparent) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Edges (SVG) */}
      <svg
        className="absolute inset-0"
        width={CANVAS_W}
        height={CANVAS_H}
        viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path
              d="M 0 0 L 10 5 L 0 10 z"
              className="fill-muted-foreground/60"
            />
          </marker>
        </defs>

        {GRAPH_EDGES.map((edge, i) => {
          const from = GRAPH_NODES.find((n) => n.id === edge.from);
          const to = GRAPH_NODES.find((n) => n.id === edge.to);
          if (!from || !to) return null;
          const a = nodeRect(from);
          const b = nodeRect(to);

          // Start at bottom-center of source, end at top-center of target.
          const x1 = a.cx;
          const y1 = a.y + a.h;
          const x2 = b.cx;
          const y2 = b.y;

          // Bezier control points for a gentle S-curve when columns differ
          const midY = (y1 + y2) / 2;
          const path = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;

          const isActiveSim =
            activeSimNodeId === edge.to || activeSimNodeId === edge.from;

          return (
            <g key={i}>
              <path
                d={path}
                fill="none"
                strokeWidth={isActiveSim ? 2 : 1.5}
                className={cn(
                  isActiveSim
                    ? "stroke-primary"
                    : "stroke-muted-foreground/40",
                )}
                markerEnd="url(#arrow)"
              />
              {edge.label && (
                <g>
                  <rect
                    x={(x1 + x2) / 2 - 22}
                    y={midY - 9}
                    width={44}
                    height={18}
                    rx={9}
                    className="fill-card stroke-border"
                    strokeWidth={1}
                  />
                  <text
                    x={(x1 + x2) / 2}
                    y={midY + 4}
                    textAnchor="middle"
                    className="fill-foreground text-[10px] font-medium"
                  >
                    {edge.label}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Nodes */}
      {GRAPH_NODES.map((node) => {
        const rect = nodeRect(node);
        const meta = NODE_KIND_META[node.kind];
        const Icon = meta.icon;
        const isSelected = selectedNodeId === node.id;
        const isActiveSim = activeSimNodeId === node.id;

        // Decision nodes get a rotated-diamond accent (kept rectangular for label legibility)
        const isDecision = node.kind === "decision";

        return (
          <button
            key={node.id}
            type="button"
            onClick={() => onSelect(node.id)}
            className={cn(
              "group absolute flex cursor-pointer flex-col items-start gap-1 rounded-xl border-2 bg-card p-3 text-left shadow-xs transition-all hover:shadow-md",
              meta.border,
              isSelected && cn("ring-4 shadow-md", meta.ring),
              isActiveSim && "ring-4 ring-primary/60 shadow-lg",
              isDecision && "rounded-lg",
            )}
            style={{
              left: rect.x,
              top: rect.y,
              width: rect.w,
              height: rect.h,
            }}
          >
            <div className="flex w-full items-center gap-2">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-md",
                  meta.chip,
                )}
              >
                <Icon className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {meta.label}
                </p>
                <p className="truncate text-sm font-semibold leading-tight">
                  {node.label}
                </p>
              </div>
            </div>
            <p className="text-metadata line-clamp-1 text-[11px]">
              {node.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}

// ─── Top bar button ───────────────────────────────────────────────────────────

function TopBarButton({
  children,
  onClick,
  icon: Icon,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors",
        active
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border bg-card text-foreground hover:bg-muted",
      )}
    >
      {Icon && <Icon className="size-3.5" />}
      {children}
    </button>
  );
}

// ─── Canvas toolbar bits ──────────────────────────────────────────────────────

function CanvasIconButton({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Icon className="size-3.5" />
    </button>
  );
}

function CanvasDivider() {
  return <span className="mx-0.5 h-4 w-px bg-border" />;
}

// ─── Inspector tabs ───────────────────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-data-label mb-1 block text-[10px]">{label}</label>
      {children}
    </div>
  );
}

function TextInput({
  defaultValue,
  placeholder,
}: {
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <input
      defaultValue={defaultValue}
      placeholder={placeholder}
      className="bg-muted/40 focus:bg-background h-7 w-full rounded-md border border-transparent px-2 text-xs outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
    />
  );
}

function SelectInput({
  defaultValue,
  options,
}: {
  defaultValue: string;
  options: string[];
}) {
  return (
    <select
      defaultValue={defaultValue}
      className="bg-muted/40 focus:bg-background h-7 w-full rounded-md border border-transparent px-2 text-xs outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function PropertiesTab({
  node,
  inspector,
}: {
  node: GraphNode;
  inspector: NodeInspector;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Field label="Node label">
        <TextInput defaultValue={node.label} />
      </Field>
      <Field label="Description">
        <textarea
          defaultValue={node.description}
          rows={2}
          className="bg-muted/40 focus:bg-background w-full rounded-md border border-transparent px-2 py-1.5 text-xs outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      </Field>
      <Field label="Assigned owner">
        <SelectInput
          defaultValue={inspector.owner}
          options={[
            "Candidate",
            "Onboarder",
            "Senior Onboarder",
            "Recruiter",
            "Recruiting Manager",
            "Account Manager",
            "AI Copilot",
            "System (HireRight)",
            "System",
          ]}
        />
      </Field>
      <Field label="Due date offset">
        <TextInput defaultValue={inspector.dueOffset} />
      </Field>
      <div className="flex items-center justify-between rounded-md border bg-muted/30 px-2.5 py-2">
        <div>
          <p className="text-xs font-medium">Required</p>
          <p className="text-metadata text-[10px]">
            Blocks downstream nodes if not complete
          </p>
        </div>
        <Toggle defaultChecked={inspector.required} />
      </div>
    </div>
  );
}

function Toggle({ defaultChecked }: { defaultChecked?: boolean }) {
  const [on, setOn] = useState(!!defaultChecked);
  return (
    <button
      type="button"
      onClick={() => setOn((v) => !v)}
      className={cn(
        "relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors",
        on ? "bg-primary" : "bg-muted-foreground/30",
      )}
      role="switch"
      aria-checked={on}
    >
      <span
        className={cn(
          "inline-block size-3 transform rounded-full bg-white shadow-sm transition-transform",
          on ? "translate-x-3.5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

function ConditionsTab({ inspector }: { inspector: NodeInspector }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-md border bg-muted/30 p-2.5">
        <p className="text-xs font-medium">Execute when</p>
        <p className="text-metadata text-[10px]">
          All conditions must be true for this node to run.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        {inspector.conditions.map((c, i) => (
          <div
            key={i}
            className="rounded-md border bg-card p-2 text-xs"
          >
            <div className="grid grid-cols-[1fr_auto_1fr] gap-1.5">
              <SelectInput
                defaultValue={c.field}
                options={[
                  c.field,
                  "Employment Type",
                  "Client",
                  "State",
                  "Job Category",
                  "Risk Level",
                ]}
              />
              <SelectInput
                defaultValue={c.op}
                options={["is", "is not", "contains", "in", "not in"]}
              />
              <TextInput defaultValue={c.value} />
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="flex h-7 w-full items-center justify-center gap-1.5 rounded-md border border-dashed text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
      >
        <Plus className="size-3.5" />
        Add condition
      </button>
    </div>
  );
}

function SlaTab({ inspector }: { inspector: NodeInspector }) {
  return (
    <div className="flex flex-col gap-3">
      <Field label="SLA target">
        <TextInput defaultValue={inspector.sla} />
      </Field>
      <Field label="Warning threshold">
        <TextInput defaultValue={inspector.warningAt} />
      </Field>
      <Field label="Reminder cadence">
        <TextInput defaultValue={inspector.reminderCadence} />
      </Field>
      <Field label="Escalation chain">
        <ol className="flex flex-col gap-1">
          {inspector.escalation.map((step, i) => (
            <li
              key={step}
              className="flex items-center gap-2 rounded-md border bg-muted/30 px-2 py-1.5 text-xs"
            >
              <span className="bg-primary/10 text-primary flex size-4 shrink-0 items-center justify-center rounded text-[10px] font-semibold">
                {i + 1}
              </span>
              <span className="flex-1 font-medium">{step}</span>
              <ChevronRight className="text-muted-foreground size-3" />
            </li>
          ))}
        </ol>
      </Field>
    </div>
  );
}

function IntegrationsTab({ inspector }: { inspector: NodeInspector }) {
  return (
    <div className="flex flex-col gap-3">
      <Field label="Connected integrations">
        {inspector.integrations.length === 0 ? (
          <div className="rounded-md border border-dashed bg-muted/20 px-2.5 py-3 text-center text-[11px] text-muted-foreground">
            No integrations bound to this node.
          </div>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {inspector.integrations.map((it, i) => (
              <li
                key={i}
                className="flex items-center gap-2 rounded-md border bg-card px-2 py-1.5 text-xs"
              >
                <Plug className="text-info size-3.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{it.name}</p>
                  <p className="text-metadata truncate text-[10px]">
                    {it.action}
                  </p>
                </div>
                <StatusBadge tone="success">Live</StatusBadge>
              </li>
            ))}
          </ul>
        )}
      </Field>

      <Field label="Output mapping">
        <ul className="flex flex-col gap-1">
          {inspector.outputMapping.map((m, i) => (
            <li
              key={i}
              className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 rounded-md border bg-muted/30 px-2 py-1.5 text-[11px]"
            >
              <code className="truncate font-mono text-[10px]">{m.from}</code>
              <ChevronRight className="text-muted-foreground size-3" />
              <code className="truncate font-mono text-[10px]">{m.to}</code>
            </li>
          ))}
        </ul>
      </Field>
    </div>
  );
}

// ─── Bottom panel (validate / simulate) ───────────────────────────────────────

function BottomPanel({
  mode,
  onClose,
  simStepIdx,
  setSimStepIdx,
  onSelectNode,
}: {
  mode: "validate" | "simulate";
  onClose: () => void;
  simStepIdx: number;
  setSimStepIdx: (n: number) => void;
  onSelectNode: (id: string) => void;
}) {
  if (mode === "validate") {
    return (
      <div className="shrink-0 border-t bg-card">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <div className="flex items-center gap-2">
            <TriangleAlert className="text-warning size-4" />
            <p className="text-sm font-semibold">Validation results</p>
            <span className="text-xs text-muted-foreground">
              2 warnings · 0 errors
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <ul className="max-h-44 overflow-y-auto p-3">
          {VALIDATION_ISSUES.map((issue, i) => (
            <li
              key={i}
              className="border-warning/30 bg-warning-muted/30 mb-1.5 flex items-start gap-2 rounded-md border p-2.5 text-xs last:mb-0"
            >
              <TriangleAlert className="text-warning size-3.5 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">{issue.title}</p>
                <p className="text-metadata mt-0.5 text-[11px]">
                  {issue.detail}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectNode(issue.nodeId)}
                className="text-primary hover:underline whitespace-nowrap text-[11px] font-medium"
              >
                Jump to node
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Simulate mode
  const currentStep = SIM_STEPS[simStepIdx];
  return (
    <div className="shrink-0 border-t bg-card">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <Play className="text-primary size-4" />
          <p className="text-sm font-semibold">Simulation</p>
          <span className="text-xs text-muted-foreground">
            Step {simStepIdx + 1} of {SIM_STEPS.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Run with</span>
          <select className="bg-muted/40 h-6 rounded-md border border-transparent px-2 text-xs">
            <option>Sample: Sarah Chen — Meridian Health (W-2)</option>
            <option>Sample: David Park — Apex Dynamics (C2C)</option>
            <option>Sample: Priya Anand — Federal Contract</option>
          </select>
          <button
            type="button"
            onClick={() => setSimStepIdx(Math.max(0, simStepIdx - 1))}
            disabled={simStepIdx === 0}
            className="inline-flex h-6 items-center gap-1 rounded border px-2 text-[11px] font-medium disabled:opacity-40 hover:bg-muted"
          >
            ◀ Prev
          </button>
          <button
            type="button"
            onClick={() =>
              setSimStepIdx(Math.min(SIM_STEPS.length - 1, simStepIdx + 1))
            }
            disabled={simStepIdx === SIM_STEPS.length - 1}
            className="inline-flex h-6 items-center gap-1 rounded border px-2 text-[11px] font-medium disabled:opacity-40 hover:bg-muted"
          >
            Next ▶
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
      <div className="max-h-44 overflow-y-auto p-3">
        <ul className="flex flex-col gap-1">
          {SIM_STEPS.map((step, i) => {
            const node = GRAPH_NODES.find((n) => n.id === step.nodeId);
            const isCurrent = i === simStepIdx;
            const isPast = i < simStepIdx;
            return (
              <li
                key={i}
                className={cn(
                  "flex items-start gap-2 rounded-md px-2 py-1.5 text-xs transition-colors",
                  isCurrent && "bg-primary/10 ring-1 ring-primary/30",
                  isPast && "opacity-60",
                )}
              >
                <span
                  className={cn(
                    "mt-1 inline-block size-2 shrink-0 rounded-full",
                    isCurrent
                      ? "bg-primary"
                      : isPast
                      ? "bg-success"
                      : "bg-muted-foreground/30",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate text-xs font-medium",
                      isCurrent && "text-primary",
                    )}
                  >
                    {node?.label ?? step.nodeId}
                  </p>
                  <p className="text-metadata truncate text-[11px]">
                    {step.message}
                  </p>
                </div>
                <span className="text-metadata shrink-0 text-[10px]">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      {currentStep && (
        <div className="border-t bg-muted/30 px-4 py-2 text-xs">
          <span className="text-muted-foreground">Current step output: </span>
          <span className="font-medium">{currentStep.message}</span>
        </div>
      )}
    </div>
  );
}
