"use client";

/**
 * Build Package Sheet — 8-step slide-over for assembling a new onboarding
 * package (CLAUDE.md §9, §102). Follows the same structure and style as
 * src/components/onboarding/initiate-sheet.tsx.
 *
 * Usage:
 *   <BuildPackageSheet />
 *   <BuildPackageSheet trigger={<Button>Build Package</Button>} />
 */

import * as React from "react";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  ChevronRight,
  GripVertical,
  Lock,
  Package,
  Sparkles,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CONSULTANTS } from "@/lib/consultants";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOTAL_STEPS = 8;
const STEP_LABELS = [
  "Consultant Assignment",
  "Rule Evaluation",
  "Package Preview",
  "Modify Package",
  "AI Review",
  "Approval",
  "Dispatch",
  "Tracking",
];

type EmploymentType = "W-2" | "1099" | "C2C";

// ---------------------------------------------------------------------------
// Shared field primitives (mirroring initiate-sheet style)
// ---------------------------------------------------------------------------

const inputCls =
  "h-8 w-full rounded-md border border-input bg-background px-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-muted-foreground/60";

const selectCls = cn(
  inputCls,
  "appearance-none cursor-pointer",
);

function Lbl({
  children,
  required,
  htmlFor,
}: {
  children: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
    >
      {children}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Lbl required={required}>{label}</Lbl>
      {children}
    </div>
  );
}

function ReadOnlyChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">
        {value}
      </span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="col-span-full mb-1 border-b pb-1.5 text-xs font-semibold text-foreground/80">
      {children}
    </h3>
  );
}

// ---------------------------------------------------------------------------
// Step dots
// ---------------------------------------------------------------------------

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {STEP_LABELS.map((label, i) => (
        <span
          key={label}
          title={label}
          className={cn(
            "size-1.5 rounded-full transition-colors",
            i + 1 < current
              ? "bg-primary/50"
              : i + 1 === current
                ? "bg-primary"
                : "bg-muted-foreground/25",
          )}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Employment type toggle
// ---------------------------------------------------------------------------

function EmploymentToggle({
  value,
  onChange,
}: {
  value: EmploymentType;
  onChange: (v: EmploymentType) => void;
}) {
  const opts: { v: EmploymentType; label: string }[] = [
    { v: "W-2", label: "W-2" },
    { v: "1099", label: "1099" },
    { v: "C2C", label: "C2C" },
  ];
  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-muted/60 p-0.5">
      {opts.map(({ v, label }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            "rounded-md px-3 py-1 text-xs font-medium transition-all",
            value === v
              ? "bg-background shadow-xs text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mock assembled items for Step 3/4
// ---------------------------------------------------------------------------

type AssembledItem = {
  id: string;
  label: string;
  section: string;
  type: string;
  required: boolean;
  owner: string;
  dueOffset: number;
};

const MOCK_ASSEMBLED: AssembledItem[] = [
  { id: "ai-01", label: "Client NDA", section: "Required Documents", type: "document", required: true, owner: "Candidate", dueOffset: 10 },
  { id: "ai-02", label: "I-9 Employment Eligibility", section: "Required Documents", type: "document", required: true, owner: "Onboarder", dueOffset: 3 },
  { id: "ai-03", label: "Direct Deposit Authorization", section: "Required Documents", type: "document", required: true, owner: "Candidate", dueOffset: 8 },
  { id: "ai-04", label: "Federal W-4", section: "Tax & Payroll", type: "document", required: true, owner: "Candidate", dueOffset: 8 },
  { id: "ai-05", label: "State Tax Form", section: "Tax & Payroll", type: "document", required: true, owner: "Candidate", dueOffset: 8 },
  { id: "ai-06", label: "Background Check — 7-Year", section: "Screening", type: "screening", required: true, owner: "HR", dueOffset: 12 },
  { id: "ai-07", label: "Drug Screen", section: "Screening", type: "screening", required: true, owner: "HR", dueOffset: 12 },
  { id: "ai-08", label: "Security Awareness Training", section: "Training", type: "training", required: true, owner: "Candidate", dueOffset: 5 },
  { id: "ai-09", label: "Client-Specific Orientation", section: "Training", type: "training", required: true, owner: "Candidate", dueOffset: 5 },
  { id: "ai-10", label: "Corporate Email Setup", section: "IT Provisioning", type: "provisioning", required: true, owner: "IT", dueOffset: 2 },
  { id: "ai-11", label: "VPN Access Grant", section: "IT Provisioning", type: "provisioning", required: true, owner: "IT", dueOffset: 2 },
  { id: "ai-12", label: "Account Manager Approval", section: "Approvals", type: "approval", required: true, owner: "Account Manager", dueOffset: 5 },
  { id: "ai-13", label: "Benefits Enrollment (Optional)", section: "Optional", type: "document", required: false, owner: "Candidate", dueOffset: 7 },
];

type AIFinding = {
  id: string;
  severity: "error" | "warning";
  message: string;
  resolved: boolean;
};

const MOCK_AI_FINDINGS: AIFinding[] = [
  {
    id: "f1",
    severity: "error",
    message: "Missing: California Wage Notice — Required for CA-based W-2 workers",
    resolved: false,
  },
  {
    id: "f2",
    severity: "warning",
    message: "Outdated: Client NDA v1.2 detected — v2.0 is the current version",
    resolved: false,
  },
  {
    id: "f3",
    severity: "warning",
    message: "Duplicate: Federal W-4 appears twice in the package",
    resolved: false,
  },
  {
    id: "f4",
    severity: "warning",
    message: "Candidate start date is 8 days away — dispatch urgently for sufficient completion time",
    resolved: false,
  },
];

// ---------------------------------------------------------------------------
// Step 1 — Consultant Assignment
// ---------------------------------------------------------------------------

function Step1({
  selectedId,
  onSelect,
  employmentType,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
  employmentType: EmploymentType;
}) {
  const consultant = CONSULTANTS.find((c) => c.id === selectedId);

  return (
    <div className="flex flex-col gap-4">
      <Field label="Select Consultant" required className="col-span-full">
        <select
          className={selectCls}
          value={selectedId}
          onChange={(e) => onSelect(e.target.value)}
        >
          <option value="">-- Select consultant --</option>
          {CONSULTANTS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} — {c.role} ({c.client})
            </option>
          ))}
        </select>
      </Field>

      {consultant ? (
        <div className="rounded-lg border bg-muted/20 p-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Auto-detected Assignment Details
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <ReadOnlyChip label="Client" value={consultant.client} />
            <ReadOnlyChip label="Employment Type" value={employmentType} />
            <ReadOnlyChip label="Work Location" value={consultant.location} />
            <ReadOnlyChip label="Start Date" value={consultant.startDate} />
            <ReadOnlyChip label="Recruiter" value={consultant.recruiter} />
            <ReadOnlyChip
              label="Account Manager"
              value={consultant.accountManager}
            />
            {consultant.vendor && (
              <ReadOnlyChip label="Vendor" value={consultant.vendor} />
            )}
          </div>

          {/* Risk Score */}
          <div className="mt-4 flex items-center gap-3">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Risk Score
            </span>
            <div className="flex items-center gap-2">
              <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full",
                    consultant.satisfactionScore >= 4.5
                      ? "bg-success"
                      : consultant.satisfactionScore >= 3.5
                        ? "bg-warning"
                        : "bg-danger",
                  )}
                  style={{
                    width: `${100 - (consultant.satisfactionScore / 5) * 60}%`,
                  }}
                />
              </div>
              <span
                className={cn(
                  "text-sm font-bold tabular-nums",
                  consultant.satisfactionScore >= 4.5
                    ? "text-success"
                    : consultant.satisfactionScore >= 3.5
                      ? "text-warning"
                      : "text-danger",
                )}
              >
                {Math.round(100 - (consultant.satisfactionScore / 5) * 60)}
              </span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center rounded-lg border border-dashed py-8 text-xs text-muted-foreground">
          Select a consultant to auto-detect assignment details
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Rule Evaluation
// ---------------------------------------------------------------------------

const RULE_CATEGORIES = [
  {
    id: "client",
    label: "Client Rules",
    applies: true,
    rules: [
      { applies: true, label: "Client NDA required", reason: "All engagements with this client require NDA signature." },
      { applies: true, label: "Client-specific orientation", reason: "Client mandates completion before Day 1." },
    ],
  },
  {
    id: "state",
    label: "State Rules",
    applies: true,
    rules: [
      { applies: true, label: "State income tax form", reason: "Work state requires withholding form." },
      { applies: false, label: "California Wage Notice", reason: "Work location is not California. CA rules excluded." },
    ],
  },
  {
    id: "employment",
    label: "Employment Type Rules",
    applies: true,
    rules: [
      { applies: true, label: "Federal W-4 required", reason: "W-2 classification triggers federal withholding." },
      { applies: true, label: "Direct deposit setup", reason: "Required for all W-2 workers." },
      { applies: false, label: "Vendor MSA (C2C)", reason: "Employment type is W-2, not C2C." },
    ],
  },
  {
    id: "job",
    label: "Job-Specific Rules",
    applies: true,
    rules: [
      { applies: true, label: "Background check 7-year", reason: "Standard for all professional roles." },
      { applies: true, label: "Drug screening", reason: "Required by client policy for this job category." },
    ],
  },
  {
    id: "security",
    label: "Security Rules",
    applies: true,
    rules: [
      { applies: true, label: "Security awareness training", reason: "All workers must complete before Day 1." },
      { applies: false, label: "Federal clearance form", reason: "Role does not require security clearance." },
    ],
  },
  {
    id: "training",
    label: "Training Rules",
    applies: true,
    rules: [
      { applies: true, label: "Client orientation module", reason: "Mandatory onboarding training." },
      { applies: false, label: "HIPAA training", reason: "Not applicable — not a healthcare role." },
    ],
  },
];

function Step2({ evaluated }: { evaluated: boolean }) {
  const [expanded, setExpanded] = React.useState<string | null>("client");

  const totalRequirements = RULE_CATEGORIES.flatMap((c) =>
    c.rules.filter((r) => r.applies),
  ).length;

  return (
    <div className="flex flex-col gap-3">
      {!evaluated ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border py-8 text-xs text-muted-foreground">
          <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Evaluating rules…
        </div>
      ) : (
        <>
          {RULE_CATEGORIES.map((cat) => (
            <div key={cat.id} className="rounded-lg border overflow-hidden">
              <button
                type="button"
                onClick={() =>
                  setExpanded(expanded === cat.id ? null : cat.id)
                }
                className="flex w-full items-center gap-2 px-3 py-2.5 hover:bg-muted/30 transition-colors text-left"
              >
                <span
                  className={cn(
                    "size-2 rounded-full shrink-0",
                    cat.applies ? "bg-success" : "bg-muted-foreground/30",
                  )}
                />
                <span className="flex-1 text-xs font-medium">{cat.label}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {cat.rules.filter((r) => r.applies).length} applying
                </span>
                <span className="text-muted-foreground text-xs">
                  {expanded === cat.id ? "▲" : "▼"}
                </span>
              </button>
              {expanded === cat.id && (
                <div className="border-t bg-muted/10 px-3 py-2">
                  {cat.rules.map((rule, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 py-1.5 border-b last:border-0"
                    >
                      <span
                        className={cn(
                          "mt-0.5 shrink-0 text-[11px] font-medium",
                          rule.applies ? "text-success" : "text-muted-foreground",
                        )}
                      >
                        {rule.applies ? "✓" : "✗"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "text-[11px] font-medium",
                            !rule.applies && "text-muted-foreground",
                          )}
                        >
                          {rule.label}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {rule.reason}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="rounded-md bg-muted/40 px-3 py-2.5 text-center">
            <p className="text-xs font-semibold">
              {totalRequirements} requirements will be included
            </p>
            <p className="text-[10px] text-muted-foreground">
              Based on client, state, employment type, and job-specific rules
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Package Preview
// ---------------------------------------------------------------------------

const PREVIEW_SECTIONS = [
  "Required Documents",
  "Tax & Payroll",
  "Screening",
  "Training",
  "IT Provisioning",
  "Approvals",
  "Optional",
];

function Step3({ items }: { items: AssembledItem[] }) {
  const grouped = PREVIEW_SECTIONS.reduce(
    (acc, section) => {
      acc[section] = items.filter((i) => i.section === section);
      return acc;
    },
    {} as Record<string, AssembledItem[]>,
  );

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        {items.length} items assembled from{" "}
        {RULE_CATEGORIES.filter((c) => c.applies).length} active rules
      </p>

      <div className="grid grid-cols-2 gap-3">
        {/* Left — assembled items */}
        <div className="flex flex-col gap-2">
          {PREVIEW_SECTIONS.map((section) => {
            const sectionItems = grouped[section] ?? [];
            if (sectionItems.length === 0) return null;
            return (
              <div key={section} className="rounded-md border">
                <div className="border-b bg-muted/30 px-2.5 py-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {section}
                  </p>
                </div>
                {sectionItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 border-b last:border-0"
                  >
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[9px] font-medium capitalize",
                        item.type === "document"
                          ? "bg-info-muted text-info-muted-foreground"
                          : item.type === "screening"
                            ? "bg-danger-muted text-danger-muted-foreground"
                            : item.type === "training"
                              ? "bg-success-muted text-success-muted-foreground"
                              : item.type === "provisioning"
                                ? "bg-ai-muted text-ai-muted-foreground"
                                : item.type === "approval"
                                  ? "bg-warning-muted text-warning-muted-foreground"
                                  : "bg-muted text-muted-foreground",
                      )}
                    >
                      {item.type}
                    </span>
                    <span className="flex-1 text-[11px]">{item.label}</span>
                    {item.required && (
                      <span className="text-[9px] text-danger-muted-foreground">
                        Req
                      </span>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Right — AI notes */}
        <div className="flex flex-col gap-2">
          <div className="rounded-md border bg-ai-muted/20 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="size-3.5 text-ai" />
              <p className="text-xs font-semibold">AI Package Notes</p>
            </div>
            <div className="space-y-1.5 text-[11px] text-muted-foreground">
              <p>• All required compliance rules satisfied for this client.</p>
              <p>• State tax form mapped to work location.</p>
              <p>• Drug screen: 5-panel (client standard).</p>
              <p className="text-warning-muted-foreground">
                • Verify effective date — package dispatched after June 15.
              </p>
            </div>
          </div>
          <div className="rounded-md border p-3 text-[11px] space-y-1 text-muted-foreground">
            <p className="font-semibold text-foreground/80">
              Client-Specific Notes
            </p>
            <p>Effective date: {new Date().toLocaleDateString()}</p>
            <p>Candidate language preference: English</p>
            <p>Dispatch method: Portal + Email</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4 — Modify Package
// ---------------------------------------------------------------------------

function Step4({
  items,
  setItems,
}: {
  items: AssembledItem[];
  setItems: (items: AssembledItem[]) => void;
}) {
  const [internalNote, setInternalNote] = React.useState("");
  const [candidateInstruction, setCandidateInstruction] = React.useState("");
  const [showAddSearch, setShowAddSearch] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  const SUGGESTIONS = [
    "Equipment acknowledgment form",
    "Expense policy acknowledgment",
    "ISO 27001 awareness training",
    "Emergency contact form",
    "Conflict of interest disclosure",
  ];

  const filtered = SUGGESTIONS.filter((s) =>
    s.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const addSuggestion = (label: string) => {
    const newItem: AssembledItem = {
      id: `custom-${Date.now()}`,
      label,
      section: "Optional",
      type: "document",
      required: false,
      owner: "Candidate",
      dueOffset: 7,
    };
    setItems([...items, newItem]);
    setShowAddSearch(false);
    setSearchTerm("");
  };

  const removeItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Items list */}
      <div className="rounded-lg border overflow-hidden">
        <div className="border-b bg-muted/30 px-3 py-2">
          <p className="text-xs font-semibold">Package Items</p>
        </div>
        <div className="divide-y max-h-64 overflow-y-auto">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 px-3 py-2 hover:bg-muted/20 transition-colors"
            >
              <GripVertical className="size-3.5 shrink-0 text-muted-foreground/40 cursor-grab" />
              <span className="flex-1 text-[11px] font-medium min-w-0 truncate">
                {item.label}
              </span>
              <span
                className={cn(
                  "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium",
                  item.required
                    ? "bg-danger-muted text-danger-muted-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {item.required ? "Required" : "Optional"}
              </span>
              <input
                type="number"
                min={1}
                max={30}
                defaultValue={item.dueOffset}
                className="h-6 w-14 rounded-md border bg-background px-1.5 text-[11px] text-center tabular-nums"
                title="Due offset (days before start)"
              />
              <span className="text-[10px] text-muted-foreground shrink-0">
                {item.owner}
              </span>
              {item.required ? (
                <Lock className="size-3 shrink-0 text-muted-foreground/40" />
              ) : (
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="shrink-0 text-muted-foreground/40 hover:text-danger transition-colors text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="border-t px-3 py-2">
          {showAddSearch ? (
            <div className="flex flex-col gap-1.5">
              <input
                autoFocus
                className={cn(inputCls, "h-7 text-xs")}
                placeholder="Search items to add…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="rounded-md border bg-background">
                {filtered.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addSuggestion(s)}
                    className="block w-full px-2.5 py-1.5 text-left text-[11px] hover:bg-muted transition-colors border-b last:border-0"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowAddSearch(false)}
                className="text-[10px] text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddSearch(true)}
              className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="text-base leading-none">+</span> Add Item
            </button>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Lbl>Internal Note</Lbl>
          <textarea
            rows={3}
            className={cn(inputCls, "h-auto resize-y py-1.5 text-xs leading-relaxed")}
            placeholder="Internal notes (not visible to candidate)…"
            value={internalNote}
            onChange={(e) => setInternalNote(e.target.value)}
          />
        </div>
        <div>
          <Lbl>Candidate Instruction</Lbl>
          <textarea
            rows={3}
            className={cn(inputCls, "h-auto resize-y py-1.5 text-xs leading-relaxed")}
            placeholder="Special instructions for the candidate…"
            value={candidateInstruction}
            onChange={(e) => setCandidateInstruction(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 5 — AI Review
// ---------------------------------------------------------------------------

function Step5() {
  const [reviewing, setReviewing] = React.useState(true);
  const [findings, setFindings] = React.useState<AIFinding[]>(
    MOCK_AI_FINDINGS.map((f) => ({ ...f })),
  );

  React.useEffect(() => {
    const t = setTimeout(() => setReviewing(false), 1500);
    return () => clearTimeout(t);
  }, []);

  const resolve = (id: string) => {
    setFindings((prev) =>
      prev.map((f) => (f.id === id ? { ...f, resolved: true } : f)),
    );
  };

  if (reviewing) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <span className="size-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm font-medium">AI is reviewing your package…</p>
        <p className="text-xs text-muted-foreground">
          Checking for missing requirements, duplicates, and outdated versions
        </p>
      </div>
    );
  }

  const unresolved = findings.filter((f) => !f.resolved);
  const resolved = findings.filter((f) => f.resolved);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 rounded-md bg-muted/30 px-3 py-2">
        <Sparkles className="size-3.5 text-ai" />
        <span className="text-xs font-medium">
          AI Review complete — {unresolved.length} finding
          {unresolved.length !== 1 ? "s" : ""} require attention
        </span>
      </div>

      <div className="space-y-2">
        {unresolved.map((f) => (
          <div
            key={f.id}
            className={cn(
              "rounded-lg border p-3",
              f.severity === "error"
                ? "border-danger/30 bg-danger-muted/20"
                : "border-warning/30 bg-warning-muted/20",
            )}
          >
            <div className="flex items-start gap-2">
              {f.severity === "error" ? (
                <AlertCircle className="size-4 shrink-0 text-danger mt-0.5" />
              ) : (
                <AlertTriangle className="size-4 shrink-0 text-warning mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <span
                  className={cn(
                    "mr-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium capitalize",
                    f.severity === "error"
                      ? "bg-danger-muted text-danger-muted-foreground"
                      : "bg-warning-muted text-warning-muted-foreground",
                  )}
                >
                  {f.severity}
                </span>
                <p className="mt-1 text-xs leading-relaxed">{f.message}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => resolve(f.id)}
                    className="rounded-md bg-background border px-2.5 py-1 text-[11px] font-medium hover:bg-muted transition-colors"
                  >
                    Fix
                  </button>
                  <button
                    type="button"
                    onClick={() => resolve(f.id)}
                    className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Ignore
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {resolved.map((f) => (
          <div
            key={f.id}
            className="rounded-lg border border-muted bg-muted/20 p-3 opacity-60"
          >
            <p className="text-xs line-through text-muted-foreground">
              {f.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 6 — Approval
// ---------------------------------------------------------------------------

const MOCK_APPROVERS = [
  { id: "ap1", name: "Tom Reid", role: "HR Director", approved: false },
  { id: "ap2", name: "Jordan Lee", role: "Compliance Lead", approved: false },
  { id: "ap3", name: "Devon Hughes", role: "Account Manager", approved: false },
];

function Step6() {
  const [approvers, setApprovers] = React.useState(MOCK_APPROVERS);

  const toggle = (id: string) => {
    setApprovers((prev) =>
      prev.map((a) => (a.id === id ? { ...a, approved: !a.approved } : a)),
    );
  };

  const allApproved = approvers.every((a) => a.approved);

  return (
    <div className="flex flex-col gap-4">
      {/* Readiness summary */}
      <div className="rounded-lg border">
        <div className="border-b bg-muted/30 px-3 py-2">
          <p className="text-xs font-semibold">Readiness Summary</p>
        </div>
        <div className="divide-y">
          {[
            { label: "Compliance Ready", ok: true, detail: "All required items included" },
            { label: "Payroll Impact", ok: true, detail: "W-4, direct deposit, state forms included" },
            { label: "Billing Impact", ok: true, detail: "Bill rate and cost center confirmed" },
            { label: "Candidate Impact", ok: true, detail: "13 tasks, est. 2 hrs" },
          ].map(({ label, ok, detail }) => (
            <div key={label} className="flex items-center gap-3 px-3 py-2">
              {ok ? (
                <Check className="size-3.5 shrink-0 text-success" />
              ) : (
                <AlertCircle className="size-3.5 shrink-0 text-danger" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{label}</p>
                <p className="text-[10px] text-muted-foreground">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Open warnings */}
      <div className="rounded-md border border-warning/30 bg-warning-muted/20 px-3 py-2">
        <p className="text-xs font-medium text-warning-muted-foreground">
          2 warnings from AI review remain open. You may still approve.
        </p>
      </div>

      {/* Required approvals */}
      <div className="rounded-lg border">
        <div className="border-b bg-muted/30 px-3 py-2">
          <p className="text-xs font-semibold">Required Approvals</p>
        </div>
        <div className="divide-y">
          {approvers.map((a) => (
            <label
              key={a.id}
              className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-muted/20 transition-colors"
            >
              <input
                type="checkbox"
                className="size-4 accent-primary cursor-pointer"
                checked={a.approved}
                onChange={() => toggle(a.id)}
              />
              <div className="flex-1">
                <p className="text-xs font-medium">{a.name}</p>
                <p className="text-[10px] text-muted-foreground">{a.role}</p>
              </div>
              {a.approved && (
                <span className="rounded-full bg-success-muted px-2 py-0.5 text-[9px] font-medium text-success-muted-foreground">
                  Approved
                </span>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        <Button
          size="sm"
          disabled={!allApproved}
          className="w-full"
        >
          <Check className="size-3.5 mr-1.5" />
          Approve &amp; Continue
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 text-xs">
            Return for Changes
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 text-xs">
            Request Legal Review
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 7 — Dispatch
// ---------------------------------------------------------------------------

function Step7({ blockEmails, setBlockEmails }: {
  blockEmails: boolean;
  setBlockEmails: (v: boolean) => void;
}) {
  const [channels, setChannels] = React.useState<Set<string>>(
    new Set(["email", "portal"]),
  );
  const [timing, setTiming] = React.useState<"immediate" | "scheduled">(
    "immediate",
  );
  const [scheduledAt, setScheduledAt] = React.useState("");

  const toggleChannel = (ch: string) => {
    setChannels((prev) => {
      const next = new Set(prev);
      if (next.has(ch)) next.delete(ch);
      else next.add(ch);
      return next;
    });
  };

  const channelOpts = ["email", "sms", "portal", "combined"];

  return (
    <div className="flex flex-col gap-4">
      {/* Channel selection */}
      <div>
        <Lbl>Delivery Channels</Lbl>
        <div className="flex gap-1.5 flex-wrap">
          {channelOpts.map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => toggleChannel(ch)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-medium capitalize transition-all",
                channels.has(ch)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground hover:text-foreground",
              )}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      {/* Timing */}
      <div>
        <Lbl>Send Timing</Lbl>
        <div className="flex gap-3">
          {(["immediate", "scheduled"] as const).map((t) => (
            <label key={t} className="flex cursor-pointer items-center gap-1.5 text-xs">
              <input
                type="radio"
                name="timing"
                value={t}
                checked={timing === t}
                onChange={() => setTiming(t)}
                className="accent-primary"
              />
              <span className="capitalize">{t}</span>
            </label>
          ))}
        </div>
        {timing === "scheduled" && (
          <input
            type="datetime-local"
            className={cn(inputCls, "mt-2")}
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
        )}
      </div>

      {/* Message preview */}
      <div>
        <Lbl>Message Preview</Lbl>
        <div className="rounded-md border bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
          <p className="mb-1.5 font-semibold text-foreground">
            Subject: Your Onboarding Package is Ready
          </p>
          <p>
            Hi [Candidate Name],
          </p>
          <p className="mt-1.5">
            Your onboarding package for [Client Name] has been prepared and is
            ready for your review. Please log into the HireMe portal to complete
            your required documents and tasks before your start date.
          </p>
          <p className="mt-1.5">
            You have 13 items to complete — estimated 2 hours total.
          </p>
        </div>
      </div>

      {/* Language note */}
      <div className="rounded-md bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
        Candidate&apos;s preferred language: <strong>English</strong>
      </div>

      {/* Block emails */}
      <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
        <input
          type="checkbox"
          className="size-3 cursor-pointer rounded accent-primary"
          checked={blockEmails}
          onChange={(e) => setBlockEmails(e.target.checked)}
        />
        Block sending emails
      </label>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 8 — Tracking / Success
// ---------------------------------------------------------------------------

function Step8({ onClose }: { onClose: () => void }) {
  const now = new Date().toLocaleString();

  return (
    <div className="flex flex-col gap-4">
      {/* Success state */}
      <div className="flex flex-col items-center gap-2 py-5">
        <span className="flex size-12 items-center justify-center rounded-full bg-success/15">
          <Check className="size-6 text-success" />
        </span>
        <p className="text-sm font-semibold">Package dispatched!</p>
        <p className="text-xs text-muted-foreground text-center">
          Sent via Email + Portal · {now}
        </p>
      </div>

      {/* Dispatch summary */}
      <div className="rounded-md bg-muted/30 px-3 py-2.5 text-xs">
        <div className="flex gap-6 flex-wrap">
          <div>
            <p className="text-[10px] text-muted-foreground">Channels</p>
            <p className="font-medium">Email, Portal</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Items Sent</p>
            <p className="font-medium tabular-nums">13</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Sent At</p>
            <p className="font-medium">{now}</p>
          </div>
        </div>
      </div>

      {/* Tracking preview */}
      <div className="rounded-lg border">
        <div className="border-b bg-muted/30 px-3 py-2">
          <p className="text-xs font-semibold">Tracking Preview</p>
        </div>
        <div className="divide-y">
          {MOCK_ASSEMBLED.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 px-3 py-2"
            >
              <span className="text-[11px] min-w-0 truncate">{item.label}</span>
              <span className="shrink-0 rounded-full bg-neutral-muted px-1.5 py-0.5 text-[9px] font-medium text-neutral-muted-foreground">
                Pending delivery
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onClose}
        >
          View Package
        </Button>
        <Button size="sm" className="flex-1" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export: BuildPackageSheet
// ---------------------------------------------------------------------------

export type BuildPackageSheetProps = {
  trigger?: React.ReactNode;
};

export function BuildPackageSheet({ trigger }: BuildPackageSheetProps) {
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState(1);
  const [employmentType, setEmploymentType] =
    React.useState<EmploymentType>("W-2");
  const [selectedConsultant, setSelectedConsultant] = React.useState("");
  const [rulesEvaluated, setRulesEvaluated] = React.useState(false);
  const [items, setItems] = React.useState<AssembledItem[]>([
    ...MOCK_ASSEMBLED,
  ]);
  const [blockEmails, setBlockEmails] = React.useState(false);

  // When entering step 2, start rule evaluation timer
  const handleNext = () => {
    if (step === 1) {
      setRulesEvaluated(false);
      setStep(2);
      setTimeout(() => setRulesEvaluated(true), 1000);
      return;
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleOpen = (v: boolean) => {
    setOpen(v);
    if (!v) {
      // Reset on close
      setStep(1);
      setSelectedConsultant("");
      setRulesEvaluated(false);
      setItems([...MOCK_ASSEMBLED]);
      setBlockEmails(false);
    }
  };

  const handleSaveDraft = () => {
    console.info("Saved as draft");
    setOpen(false);
  };

  const defaultTrigger = (
    <Button size="sm" className="gap-1.5">
      <Package className="size-3.5" />
      Build Package
    </Button>
  );

  const isLastStep = step === TOTAL_STEPS;

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <div
        onClick={() => setOpen(true)}
        className="contents cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setOpen(true)}
      >
        {trigger ?? defaultTrigger}
      </div>

      <SheetContent
        side="right"
        showCloseButton
        style={{ maxWidth: "680px", width: "100%" }}
        className="flex flex-col gap-0 p-0"
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <SheetHeader className="gap-2 border-b px-5 py-4">
          <div className="flex items-center justify-between">
            <SheetTitle>Build Package</SheetTitle>
            <StepDots current={step} />
          </div>
          <div className="flex items-center justify-between">
            <SheetDescription className="text-xs">
              Step {step} of {TOTAL_STEPS} — {STEP_LABELS[step - 1]}
            </SheetDescription>
            <EmploymentToggle
              value={employmentType}
              onChange={setEmploymentType}
            />
          </div>
        </SheetHeader>

        {/* ── Scrollable step content ─────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === 1 && (
            <Step1
              selectedId={selectedConsultant}
              onSelect={setSelectedConsultant}
              employmentType={employmentType}
            />
          )}
          {step === 2 && <Step2 evaluated={rulesEvaluated} />}
          {step === 3 && <Step3 items={items} />}
          {step === 4 && <Step4 items={items} setItems={setItems} />}
          {step === 5 && <Step5 />}
          {step === 6 && <Step6 />}
          {step === 7 && (
            <Step7
              blockEmails={blockEmails}
              setBlockEmails={setBlockEmails}
            />
          )}
          {step === 8 && <Step8 onClose={() => setOpen(false)} />}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        {step < TOTAL_STEPS && (
          <div className="flex flex-col gap-2 border-t px-5 py-3">
            <div className="flex items-center justify-between gap-2">
              {/* Block emails + save draft */}
              <div className="flex items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    className="size-3 cursor-pointer rounded accent-primary"
                    checked={blockEmails}
                    onChange={(e) => setBlockEmails(e.target.checked)}
                  />
                  Block emails
                </label>
              </div>

              <div className="flex gap-2">
                {step > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveDraft}
                >
                  Save as Draft
                </Button>
                {isLastStep ? (
                  <Button size="sm" onClick={() => setOpen(false)}>
                    Done
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="gap-1"
                    onClick={handleNext}
                  >
                    Next
                    <ChevronRight className="size-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
