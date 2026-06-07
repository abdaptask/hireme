/**
 * Package Detail — 3-panel Package Builder UI (CLAUDE.md §102).
 * Server component: reads package data, renders sticky header + 3-column layout.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  Clock,
  DollarSign,
  File,
  FileText,
  GraduationCap,
  Info,
  Lock,
  Monitor,
  ShieldCheck,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import {
  getPackage,
  PACKAGE_STATUS_META,
  SECTION_META,
  type PackageItem,
  type PackageRule,
  type PackageSection,
} from "@/lib/packages";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sectionIcon(section: PackageSection) {
  const icons: Record<PackageSection, React.ReactNode> = {
    "required-documents": <FileText className="size-3.5" />,
    "optional-documents": <File className="size-3.5" />,
    approvals: <CheckSquare className="size-3.5" />,
    training: <GraduationCap className="size-3.5" />,
    screening: <ShieldCheck className="size-3.5" />,
    "it-provisioning": <Monitor className="size-3.5" />,
    "tax-payroll": <DollarSign className="size-3.5" />,
  };
  return icons[section];
}

function typeBadgeColor(
  type: PackageItem["type"],
): string {
  const map: Record<PackageItem["type"], string> = {
    document: "bg-info-muted text-info-muted-foreground",
    task: "bg-neutral-muted text-neutral-muted-foreground",
    approval: "bg-warning-muted text-warning-muted-foreground",
    training: "bg-success-muted text-success-muted-foreground",
    screening: "bg-danger-muted text-danger-muted-foreground",
    provisioning: "bg-ai-muted text-ai-muted-foreground",
  };
  return map[type];
}

function riskColor(score: number): string {
  if (score < 40) return "text-success";
  if (score < 70) return "text-warning";
  return "text-danger";
}

function riskLabel(score: number): string {
  if (score < 40) return "Low Risk";
  if (score < 70) return "Moderate Risk";
  return "High Risk";
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Chip({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground whitespace-nowrap">
        {label}
      </span>
      <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
        {value}
      </span>
    </div>
  );
}

function NextBestActionStrip({
  message,
  cta,
}: {
  message: string;
  cta: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-ai/30 bg-ai-muted/30 px-4 py-2.5">
      <Zap className="size-4 shrink-0 text-ai" />
      <span className="flex-1 text-xs">
        <span className="font-semibold text-ai">Next Best Action: </span>
        <span className="text-foreground/80">{message}</span>
      </span>
      <button className="shrink-0 rounded-md bg-ai px-3 py-1 text-xs font-medium text-white hover:opacity-90 transition-opacity">
        {cta}
      </button>
    </div>
  );
}

function SectionGroup({
  section,
  items,
}: {
  section: PackageSection;
  items: PackageItem[];
}) {
  if (items.length === 0) return null;
  const meta = SECTION_META[section];

  return (
    <div className="rounded-lg border overflow-hidden">
      {/* Section header */}
      <div className="flex items-center gap-2 bg-muted/40 px-3 py-2 border-b">
        <span className="text-muted-foreground">{sectionIcon(section)}</span>
        <span className="flex-1 text-xs font-semibold">{meta.label}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium tabular-nums">
          {items.length}
        </span>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </div>

      {/* Items */}
      <div className="divide-y">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2 px-3 py-2 hover:bg-muted/20 transition-colors"
          >
            {/* Drag handle placeholder */}
            <div className="flex shrink-0 flex-col gap-0.5 opacity-30">
              <div className="flex gap-0.5">
                <span className="size-1 rounded-full bg-muted-foreground" />
                <span className="size-1 rounded-full bg-muted-foreground" />
              </div>
              <div className="flex gap-0.5">
                <span className="size-1 rounded-full bg-muted-foreground" />
                <span className="size-1 rounded-full bg-muted-foreground" />
              </div>
              <div className="flex gap-0.5">
                <span className="size-1 rounded-full bg-muted-foreground" />
                <span className="size-1 rounded-full bg-muted-foreground" />
              </div>
            </div>

            {/* Label */}
            <div className="flex min-w-0 flex-1 items-center gap-1.5 flex-wrap">
              <span className="text-xs font-medium truncate">{item.label}</span>
              {item.aiRecommended && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-ai-muted px-1.5 py-0.5 text-[10px] font-medium text-ai-muted-foreground">
                  <Sparkles className="size-2.5" />
                  AI
                </span>
              )}
              {item.conditional && (
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {item.conditional}
                </span>
              )}
            </div>

            {/* Badges */}
            <div className="flex shrink-0 items-center gap-1.5">
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize",
                  typeBadgeColor(item.type),
                )}
              >
                {item.type}
              </span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                  item.required
                    ? "bg-danger-muted text-danger-muted-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {item.required ? "Required" : "Optional"}
              </span>
              <span className="flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                <User className="size-2.5" />
                {item.owner}
              </span>
              <span className="w-14 text-right text-[10px] text-muted-foreground tabular-nums">
                D-{item.dueOffset}
              </span>
            </div>

            {/* Status / Lock */}
            <div className="shrink-0 w-6 flex justify-end">
              {item.required ? (
                <Lock className="size-3 text-muted-foreground/50" />
              ) : (
                <button className="text-muted-foreground/40 hover:text-danger transition-colors">
                  <span className="text-[10px]">✕</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add item */}
      <div className="border-t px-3 py-2">
        <button className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors">
          <span className="text-sm leading-none">+</span>
          Add Item
        </button>
      </div>
    </div>
  );
}

function RuleRow({ rule }: { rule: PackageRule }) {
  return (
    <div className="flex gap-2 py-1.5 border-b last:border-0">
      <div className="mt-0.5 shrink-0">
        {rule.applies ? (
          <CheckCircle2 className="size-3.5 text-success" />
        ) : (
          <span className="flex size-3.5 items-center justify-center rounded-full border border-muted-foreground/30">
            <span className="text-[8px] text-muted-foreground">✕</span>
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p
            className={cn(
              "text-[11px] font-medium",
              rule.applies ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {rule.condition}
          </p>
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[9px] font-medium",
              rule.category === "client"
                ? "bg-info-muted text-info-muted-foreground"
                : rule.category === "state"
                  ? "bg-warning-muted text-warning-muted-foreground"
                  : rule.category === "employment"
                    ? "bg-neutral-muted text-neutral-muted-foreground"
                    : rule.category === "security"
                      ? "bg-ai-muted text-ai-muted-foreground"
                      : rule.category === "training"
                        ? "bg-success-muted text-success-muted-foreground"
                        : "bg-muted text-muted-foreground",
            )}
          >
            {rule.category}
          </span>
          <span className="flex items-center gap-0.5 rounded-full bg-muted/60 px-1 py-0.5 text-[9px] text-muted-foreground">
            <Sparkles className="size-2" />
            AI
          </span>
        </div>
        <p className="mt-0.5 text-[10px] text-muted-foreground leading-relaxed">
          {rule.reason}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pkg = getPackage(id);

  if (!pkg) {
    notFound();
  }

  const meta = PACKAGE_STATUS_META[pkg.status];

  // Group items by section
  const sections: PackageSection[] = [
    "required-documents",
    "optional-documents",
    "tax-payroll",
    "screening",
    "training",
    "it-provisioning",
    "approvals",
  ];

  const itemsBySection = sections.reduce(
    (acc, section) => {
      acc[section] = pkg.items.filter((i) => i.section === section);
      return acc;
    },
    {} as Record<PackageSection, PackageItem[]>,
  );

  const totalItems = pkg.items.length;
  const requiredItems = pkg.items.filter((i) => i.required).length;
  const optionalItems = totalItems - requiredItems;

  // Next best action logic
  const nba =
    pkg.aiReviewStatus === "errors"
      ? {
          message:
            "AI found errors that must be resolved before this package can be dispatched.",
          cta: "View Errors",
        }
      : pkg.aiReviewStatus === "warnings"
        ? {
            message:
              "AI detected warnings — review before dispatching to candidates.",
            cta: "Review Warnings",
          }
        : pkg.status === "draft"
          ? { message: "Run AI Review to validate this package before submission.", cta: "Run AI Review" }
          : pkg.status === "in-review"
            ? { message: "Approve this package to make it available for dispatch.", cta: "Approve Package" }
            : pkg.status === "approved"
              ? { message: "Package is approved. Publish to make it available to Onboarders.", cta: "Publish Package" }
              : pkg.dispatches.length === 0
                ? {
                    message:
                      "Package is published but has not been dispatched to any candidates yet.",
                    cta: "Dispatch Now",
                  }
                : {
                    message: `${pkg.candidatesUsing} candidates are actively using this package.`,
                    cta: "View Candidates",
                  };

  return (
    <div className="flex flex-col h-full min-h-screen">
      {/* ── Sticky top header ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto max-w-[1600px] px-4 py-3 sm:px-6">
          {/* Breadcrumb */}
          <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/packages" className="hover:text-foreground transition-colors">
              Packages
            </Link>
            <span>/</span>
            <span className="text-foreground truncate">{pkg.name}</span>
          </div>

          {/* Title row */}
          <div className="flex flex-wrap items-start gap-3 sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-2.5 flex-wrap">
              <h1 className="text-lg font-bold tracking-tight truncate">
                {pkg.name}
              </h1>
              <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                {pkg.version}
              </span>
              <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
              <span className="text-muted-foreground text-xs hidden sm:inline">
                {pkg.client} · {pkg.employmentType} · Effective {pkg.effectiveDate}
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
                <Sparkles className="size-3.5 text-ai" />
                Run AI Review
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
                Edit Package
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity">
                Approve &amp; Dispatch
              </button>
            </div>
          </div>

          {/* NBA strip */}
          <div className="mt-3">
            <NextBestActionStrip
              message={nba.message}
              cta={nba.cta}
            />
          </div>
        </div>
      </div>

      {/* ── Main 3-column layout ───────────────────────────────────────────── */}
      <div className="mx-auto flex w-full max-w-[1600px] flex-1 gap-0 px-4 py-4 sm:px-6">

        {/* Left panel — rule inputs + rule evaluation */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-[180px] space-y-4 pr-4">
            {/* Rule Inputs */}
            <div className="rounded-lg border bg-card">
              <div className="border-b px-3 py-2">
                <h2 className="text-xs font-semibold">Rule Inputs</h2>
              </div>
              <div className="space-y-2 px-3 py-3">
                <Chip label="Client" value={pkg.client} />
                <Chip label="Employment" value={pkg.employmentType} />
                <Chip label="Location" value={pkg.workLocation} />
                <Chip label="Job Category" value={pkg.jobCategory} />
                <Chip label="Effective" value={pkg.effectiveDate} />
              </div>
            </div>

            {/* Rule Evaluation */}
            <div className="rounded-lg border bg-card">
              <div className="flex items-center justify-between border-b px-3 py-2">
                <h2 className="text-xs font-semibold">Rule Evaluation</h2>
                <span className="flex items-center gap-1 rounded-full bg-ai-muted px-1.5 py-0.5 text-[10px] font-medium text-ai-muted-foreground">
                  <Sparkles className="size-2.5" />
                  AI
                </span>
              </div>
              <div className="px-3 py-2">
                {pkg.rules.map((rule) => (
                  <RuleRow key={rule.id} rule={rule} />
                ))}
                <div className="mt-2 rounded-md bg-muted/40 px-2 py-1.5">
                  <p className="text-[10px] font-medium text-muted-foreground">
                    {pkg.rules.filter((r) => r.applies).length} of{" "}
                    {pkg.rules.length} rules apply
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Center panel — package structure */}
        <main className="min-w-0 flex-1 lg:px-4">
          {/* Progress bar */}
          <div className="mb-4 rounded-lg border bg-card px-4 py-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold">Package Completion</span>
              <span className="text-xs font-bold tabular-nums">
                {pkg.completionPct}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  pkg.completionPct >= 80
                    ? "bg-success"
                    : pkg.completionPct >= 50
                      ? "bg-warning"
                      : pkg.completionPct > 0
                        ? "bg-danger"
                        : "bg-muted-foreground/20",
                )}
                style={{ width: `${pkg.completionPct}%` }}
              />
            </div>
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              {totalItems} items total · {requiredItems} required · {optionalItems} optional
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-3">
            {sections.map((section) => (
              <SectionGroup
                key={section}
                section={section}
                items={itemsBySection[section]}
              />
            ))}
          </div>
        </main>

        {/* Right panel — AI review, stats, approvals, dispatches */}
        <aside className="hidden w-80 shrink-0 xl:block">
          <div className="sticky top-[180px] space-y-4 pl-4">

            {/* AI Review */}
            <div className="rounded-lg border bg-card">
              <div className="flex items-center gap-2 border-b px-3 py-2">
                <Sparkles className="size-3.5 text-ai" />
                <h2 className="text-xs font-semibold">AI Review</h2>
                {pkg.aiReviewStatus !== "not-run" && (
                  <span
                    className={cn(
                      "ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                      pkg.aiReviewStatus === "clean"
                        ? "bg-success-muted text-success-muted-foreground"
                        : pkg.aiReviewStatus === "warnings"
                          ? "bg-warning-muted text-warning-muted-foreground"
                          : "bg-danger-muted text-danger-muted-foreground",
                    )}
                  >
                    {pkg.aiReviewStatus === "clean"
                      ? "Clean"
                      : pkg.aiReviewStatus === "warnings"
                        ? "Warnings"
                        : "Errors"}
                  </span>
                )}
              </div>
              <div className="px-3 py-3">
                {pkg.aiReviewStatus === "not-run" && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="size-3.5" />
                    AI review has not been run yet.
                  </div>
                )}
                {pkg.aiReviewStatus === "clean" && (
                  <div className="flex items-center gap-2 text-xs text-success">
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span>Package looks good. No issues detected.</span>
                  </div>
                )}
                {(pkg.aiReviewStatus === "warnings" ||
                  pkg.aiReviewStatus === "errors") &&
                  pkg.aiWarnings?.map((w) => (
                    <div
                      key={w.id}
                      className={cn(
                        "mb-2 rounded-md border p-2.5 last:mb-0",
                        w.severity === "error"
                          ? "border-danger/30 bg-danger-muted/30"
                          : w.severity === "warning"
                            ? "border-warning/30 bg-warning-muted/30"
                            : "border-info/30 bg-info-muted/30",
                      )}
                    >
                      <div className="flex items-start gap-1.5">
                        {w.severity === "error" ? (
                          <AlertCircle className="size-3.5 shrink-0 text-danger mt-0.5" />
                        ) : w.severity === "warning" ? (
                          <AlertTriangle className="size-3.5 shrink-0 text-warning mt-0.5" />
                        ) : (
                          <Info className="size-3.5 shrink-0 text-info mt-0.5" />
                        )}
                        <div className="min-w-0 flex-1">
                          <span
                            className={cn(
                              "mr-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium capitalize",
                              w.severity === "error"
                                ? "bg-danger-muted text-danger-muted-foreground"
                                : w.severity === "warning"
                                  ? "bg-warning-muted text-warning-muted-foreground"
                                  : "bg-info-muted text-info-muted-foreground",
                            )}
                          >
                            {w.severity}
                          </span>
                          <p className="mt-1 text-[11px] leading-relaxed text-foreground/80">
                            {w.message}
                          </p>
                          {w.fix && (
                            <p className="mt-1 text-[10px] text-muted-foreground">
                              Fix: {w.fix}
                            </p>
                          )}
                          <div className="mt-1.5 flex gap-1.5">
                            <button className="rounded bg-background px-2 py-0.5 text-[10px] font-medium border hover:bg-muted transition-colors">
                              Fix
                            </button>
                            <button className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                              Ignore
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Package Stats */}
            <div className="rounded-lg border bg-card">
              <div className="border-b px-3 py-2">
                <h2 className="text-xs font-semibold">Package Stats</h2>
              </div>
              <div className="grid grid-cols-2 gap-px bg-border px-0 py-0 overflow-hidden rounded-b-lg">
                {[
                  { label: "Total Items", value: totalItems },
                  { label: "Required", value: requiredItems },
                  { label: "Optional", value: optionalItems },
                  {
                    label: "Completion",
                    value: `${pkg.completionPct}%`,
                  },
                  { label: "Candidates Using", value: pkg.candidatesUsing },
                  {
                    label: "Risk Score",
                    value: (
                      <span className={riskColor(pkg.riskScore)}>
                        {pkg.riskScore} — {riskLabel(pkg.riskScore)}
                      </span>
                    ),
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-card px-3 py-2">
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                    <p className="mt-0.5 text-sm font-semibold tabular-nums">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Approvals */}
            {pkg.approvals.length > 0 && (
              <div className="rounded-lg border bg-card">
                <div className="border-b px-3 py-2">
                  <h2 className="text-xs font-semibold">Approvals</h2>
                </div>
                <div className="divide-y px-0">
                  {pkg.approvals.map((approval) => (
                    <div key={approval.id} className="flex items-start gap-2 px-3 py-2.5">
                      <div className="mt-0.5 shrink-0">
                        {approval.status === "approved" ? (
                          <CheckCircle2 className="size-3.5 text-success" />
                        ) : approval.status === "rejected" ? (
                          <AlertCircle className="size-3.5 text-danger" />
                        ) : (
                          <Clock className="size-3.5 text-warning" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium">{approval.approver}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {approval.role}
                        </p>
                        {approval.approvedAt && (
                          <p className="text-[10px] text-muted-foreground">
                            {approval.approvedAt}
                          </p>
                        )}
                        {approval.notes && (
                          <p className="mt-0.5 text-[10px] italic text-muted-foreground">
                            "{approval.notes}"
                          </p>
                        )}
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium capitalize",
                          approval.status === "approved"
                            ? "bg-success-muted text-success-muted-foreground"
                            : approval.status === "rejected"
                              ? "bg-danger-muted text-danger-muted-foreground"
                              : "bg-warning-muted text-warning-muted-foreground",
                        )}
                      >
                        {approval.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dispatch History */}
            {pkg.dispatches.length > 0 && (
              <div className="rounded-lg border bg-card">
                <div className="border-b px-3 py-2">
                  <h2 className="text-xs font-semibold">Dispatch History</h2>
                </div>
                <div className="divide-y">
                  {pkg.dispatches.map((dispatch) => (
                    <div
                      key={dispatch.id}
                      className="flex items-center gap-2 px-3 py-2"
                    >
                      <span className="shrink-0 text-[11px]">
                        {dispatch.channel === "email"
                          ? "✉"
                          : dispatch.channel === "sms"
                            ? "📱"
                            : "🌐"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium capitalize">
                          {dispatch.channel}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {dispatch.sentAt}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium capitalize",
                          dispatch.status === "completed"
                            ? "bg-success-muted text-success-muted-foreground"
                            : dispatch.status === "started"
                              ? "bg-info-muted text-info-muted-foreground"
                              : dispatch.status === "opened"
                                ? "bg-info-muted text-info-muted-foreground"
                                : dispatch.status === "expired"
                                  ? "bg-danger-muted text-danger-muted-foreground"
                                  : "bg-neutral-muted text-neutral-muted-foreground",
                        )}
                      >
                        {dispatch.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </aside>
      </div>
    </div>
  );
}
