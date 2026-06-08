"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Bot,
  Check,
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  FileText,
  FileX,
  History,
  Image as ImageIcon,
  Lock,
  Maximize2,
  MessageSquare,
  RotateCw,
  Search,
  Sparkles,
  Split,
  Tag,
  UserPlus,
  X,
  XCircle,
  ZoomIn,
  ZoomOut,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Edit3,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { StatTile } from "@/components/workspace/stat-tile";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import {
  DOCUMENT_CATEGORY_META,
  DOCUMENT_STATUS_META,
  DOCUMENTS,
  documentStats,
} from "@/lib/documents";
import type {
  Document,
  DocumentCategory,
  ExtractedField,
  ValidationCheck,
  SignatureCheck,
  CrossDocCheck,
} from "@/lib/documents";

const CATEGORIES: { value: "all" | DocumentCategory; label: string }[] = [
  { value: "all",        label: "All" },
  { value: "identity",   label: "Identity" },
  { value: "tax",        label: "Tax" },
  { value: "employment", label: "Employment" },
  { value: "client",     label: "Client" },
  { value: "compliance", label: "Compliance" },
  { value: "screening",  label: "Screening" },
  { value: "payroll",    label: "Payroll" },
];

type DetailTab = "fields" | "validation" | "signatures" | "crossdoc";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function AiScoreBar({ score }: { score: number }) {
  const color =
    score >= 90 ? "bg-success" : score >= 70 ? "bg-warning" : "bg-danger";
  return (
    <div className="flex items-center gap-2">
      <div className="bg-muted relative h-1.5 w-16 overflow-hidden rounded-full">
        <span
          className={cn("absolute inset-y-0 left-0 rounded-full", color)}
          style={{ width: `${score}%` }}
        />
      </div>
      <span
        className={cn(
          "text-xs font-medium tabular-nums",
          score >= 90
            ? "text-success-muted-foreground"
            : score >= 70
              ? "text-warning-muted-foreground"
              : "text-danger-muted-foreground",
        )}
      >
        {score}
      </span>
    </div>
  );
}

function confidenceTone(c: number): "success" | "warning" | "danger" {
  if (c >= 95) return "success";
  if (c >= 80) return "warning";
  return "danger";
}

function ConfidenceBadge({ value }: { value: number }) {
  const tone = confidenceTone(value);
  const cls =
    tone === "success"
      ? "bg-success/10 text-success-muted-foreground"
      : tone === "warning"
        ? "bg-warning/10 text-warning-muted-foreground"
        : "bg-danger/10 text-danger-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
        cls,
      )}
    >
      {value}%
    </span>
  );
}

function CheckIcon({ result }: { result: "pass" | "fail" | "warn" }) {
  if (result === "pass") {
    return (
      <span className="bg-success/15 text-success-muted-foreground flex size-5 shrink-0 items-center justify-center rounded-full">
        <Check className="size-3" />
      </span>
    );
  }
  if (result === "fail") {
    return (
      <span className="bg-danger/15 text-danger-muted-foreground flex size-5 shrink-0 items-center justify-center rounded-full">
        <X className="size-3" />
      </span>
    );
  }
  return (
    <span className="bg-warning/15 text-warning-muted-foreground flex size-5 shrink-0 items-center justify-center rounded-full">
      <AlertTriangle className="size-3" />
    </span>
  );
}

function FileTypeBadge({ type }: { type: string }) {
  const colorMap: Record<string, string> = {
    PDF:  "bg-rose-500/90 text-white",
    JPG:  "bg-blue-500/90 text-white",
    PNG:  "bg-blue-500/90 text-white",
    TIFF: "bg-purple-500/90 text-white",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider shadow-sm",
        colorMap[type] ?? "bg-muted text-foreground",
      )}
    >
      {type}
    </span>
  );
}

function MatchPill({ match }: { match: "match" | "mismatch" | "missing" }) {
  if (match === "match") {
    return (
      <span className="bg-success/10 text-success-muted-foreground inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium">
        <Check className="size-3" /> Match
      </span>
    );
  }
  if (match === "mismatch") {
    return (
      <span className="bg-danger/10 text-danger-muted-foreground inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium">
        <X className="size-3" /> Mismatch
      </span>
    );
  }
  return (
    <span className="bg-warning/10 text-warning-muted-foreground inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium">
      <AlertTriangle className="size-3" /> Missing
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Document Thumbnail (mock preview)
// ─────────────────────────────────────────────────────────────────────────────

function DocumentThumbnail({
  doc,
  size = "md",
}: {
  doc: Document;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "h-12 w-9",
    md: "h-20 w-14",
    lg: "h-full w-full min-h-[420px]",
  };
  const fileType = doc.fileType ?? (doc.docType.includes("ID") || doc.docType.includes("Passport") ? "JPG" : "PDF");
  // Gradient varies by category for visual variety
  const gradientByCat: Record<string, string> = {
    identity:   "from-purple-200/60 to-purple-100/30 dark:from-purple-900/40 dark:to-purple-950/20",
    tax:        "from-amber-200/60 to-amber-100/30 dark:from-amber-900/40 dark:to-amber-950/20",
    employment: "from-blue-200/60 to-blue-100/30 dark:from-blue-900/40 dark:to-blue-950/20",
    client:     "from-teal-200/60 to-teal-100/30 dark:from-teal-900/40 dark:to-teal-950/20",
    compliance: "from-orange-200/60 to-orange-100/30 dark:from-orange-900/40 dark:to-orange-950/20",
    screening:  "from-rose-200/60 to-rose-100/30 dark:from-rose-900/40 dark:to-rose-950/20",
    payroll:    "from-green-200/60 to-green-100/30 dark:from-green-900/40 dark:to-green-950/20",
  };
  const gradient = gradientByCat[doc.category] ?? "from-muted to-muted/30";
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-md border bg-gradient-to-br shadow-xs",
        gradient,
        sizes[size],
      )}
    >
      {/* Mock page lines */}
      <div className="absolute inset-0 flex flex-col gap-1 p-2">
        <div className="bg-foreground/10 h-1 w-3/4 rounded-full" />
        <div className="bg-foreground/10 h-1 w-1/2 rounded-full" />
        {size === "lg" && (
          <>
            <div className="bg-foreground/10 mt-2 h-1 w-5/6 rounded-full" />
            <div className="bg-foreground/10 h-1 w-2/3 rounded-full" />
            <div className="bg-foreground/10 h-1 w-3/4 rounded-full" />
            <div className="bg-foreground/10 mt-3 h-1 w-1/2 rounded-full" />
            <div className="bg-foreground/10 h-1 w-5/6 rounded-full" />
            <div className="bg-foreground/10 h-1 w-2/3 rounded-full" />
            <div className="bg-foreground/10 h-1 w-3/4 rounded-full" />
            <div className="bg-foreground/10 mt-3 h-1 w-3/5 rounded-full" />
            <div className="bg-foreground/10 h-1 w-4/5 rounded-full" />
          </>
        )}
      </div>
      {/* File type badge */}
      <div className={cn("absolute", size === "lg" ? "top-3 right-3" : "top-1 right-1")}>
        <FileTypeBadge type={fileType} />
      </div>
      {/* Doc-type label on large preview */}
      {size === "lg" && (
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 rounded-md bg-background/80 px-2 py-1.5 text-xs backdrop-blur-sm">
          {fileType === "JPG" || fileType === "PNG" ? (
            <ImageIcon className="size-3.5 shrink-0" />
          ) : (
            <FileText className="size-3.5 shrink-0" />
          )}
          <span className="truncate font-medium">{doc.docType}</span>
          <span className="text-muted-foreground tabular-nums">
            {doc.fileSize ?? "—"}
          </span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail Panel Tabs
// ─────────────────────────────────────────────────────────────────────────────

function FieldsPanel({ fields }: { fields?: ExtractedField[] }) {
  if (!fields || fields.length === 0) {
    return (
      <div className="text-muted-foreground p-4 text-sm">
        No AI-extracted fields available for this document yet.
      </div>
    );
  }
  return (
    <div className="divide-y">
      {fields.map((f) => {
        const stateMeta =
          f.state === "verified"
            ? { label: "Verified", cls: "bg-success-muted text-success-muted-foreground" }
            : f.state === "needs-review"
              ? { label: "Needs review", cls: "bg-warning-muted text-warning-muted-foreground" }
              : { label: "Auto-extracted", cls: "bg-ai-muted text-ai-muted-foreground" };
        return (
          <div
            key={f.label}
            className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/30"
          >
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
                {f.label}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 font-medium">
                {f.masked && (
                  <Lock className="text-muted-foreground size-3 shrink-0" />
                )}
                <span className="truncate">{f.value}</span>
              </p>
            </div>
            <ConfidenceBadge value={f.confidence} />
            <span
              className={cn(
                "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap",
                stateMeta.cls,
              )}
            >
              {stateMeta.label}
            </span>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground hover:bg-muted flex size-7 shrink-0 items-center justify-center rounded-md transition-colors"
              aria-label={`Edit ${f.label}`}
            >
              <Edit3 className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function ValidationPanel({ checks }: { checks?: ValidationCheck[] }) {
  if (!checks || checks.length === 0) {
    return (
      <div className="text-muted-foreground p-4 text-sm">
        Validation checks pending — AI review has not run yet.
      </div>
    );
  }
  const passCount = checks.filter((c) => c.result === "pass").length;
  const failCount = checks.filter((c) => c.result === "fail").length;
  const warnCount = checks.filter((c) => c.result === "warn").length;
  return (
    <div>
      <div className="bg-muted/40 flex items-center gap-3 border-b px-3 py-2 text-xs">
        <span className="text-success-muted-foreground inline-flex items-center gap-1">
          <Check className="size-3" /> {passCount} passed
        </span>
        {warnCount > 0 && (
          <span className="text-warning-muted-foreground inline-flex items-center gap-1">
            <AlertTriangle className="size-3" /> {warnCount} warnings
          </span>
        )}
        {failCount > 0 && (
          <span className="text-danger-muted-foreground inline-flex items-center gap-1">
            <X className="size-3" /> {failCount} failed
          </span>
        )}
      </div>
      <div className="divide-y">
        {checks.map((c, i) => (
          <div key={i} className="flex items-start gap-3 px-3 py-2.5">
            <CheckIcon result={c.result} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{c.label}</p>
              {c.detail && (
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {c.detail}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SignaturesPanel({ checks }: { checks?: SignatureCheck[] }) {
  if (!checks || checks.length === 0) {
    return (
      <div className="text-muted-foreground p-4 text-sm">
        No signature analysis available for this document yet.
      </div>
    );
  }
  return (
    <div className="divide-y">
      {checks.map((c, i) => (
        <div key={i} className="flex items-start gap-3 px-3 py-2.5">
          <CheckIcon result={c.result} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{c.label}</p>
            {c.detail && (
              <p className="text-muted-foreground mt-0.5 text-xs">{c.detail}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function CrossDocPanel({ checks }: { checks?: CrossDocCheck[] }) {
  if (!checks || checks.length === 0) {
    return (
      <div className="text-muted-foreground p-4 text-sm">
        No related documents available for cross-validation yet.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/40 text-muted-foreground text-[11px] tracking-wide uppercase">
          <tr>
            <th className="px-3 py-2 font-medium">Source document</th>
            <th className="px-3 py-2 font-medium">Field</th>
            <th className="px-3 py-2 font-medium">Value</th>
            <th className="px-3 py-2 font-medium">Match</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {checks.map((c, i) => (
            <tr key={i} className="hover:bg-muted/30">
              <td className="px-3 py-2 text-xs font-medium">{c.source}</td>
              <td className="text-muted-foreground px-3 py-2 text-xs">
                {c.field}
              </td>
              <td className="px-3 py-2 text-xs">{c.value}</td>
              <td className="px-3 py-2">
                <MatchPill match={c.match} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Document Viewer (right panel)
// ─────────────────────────────────────────────────────────────────────────────

function DocumentViewer({ doc }: { doc: Document }) {
  const [tab, setTab] = useState<DetailTab>("fields");
  const [zoom, setZoom] = useState(1);
  const [page, setPage] = useState(1);
  const [compare, setCompare] = useState(false);
  const [confirm, setConfirm] = useState<null | "approve" | "reject">(null);

  const catMeta = DOCUMENT_CATEGORY_META[doc.category];
  const statusMeta = DOCUMENT_STATUS_META[doc.status];
  const pageCount = doc.pageCount ?? 1;

  const tabs: { value: DetailTab; label: string; count?: number }[] = [
    { value: "fields",     label: "Fields",       count: doc.extractedFields?.length },
    { value: "validation", label: "Validation",   count: doc.validation?.length },
    { value: "signatures", label: "Signatures",   count: doc.signatures?.length },
    { value: "crossdoc",   label: "Cross-doc",    count: doc.crossDoc?.length },
  ];

  return (
    <div className="bg-card flex h-full min-h-[640px] flex-col overflow-hidden rounded-xl border shadow-xs">
      {/* Viewer header */}
      <header className="flex flex-col gap-2 border-b px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-base font-semibold">
                {doc.docType}
              </h3>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                  catMeta.color,
                )}
              >
                {catMeta.label}
              </span>
              <StatusBadge tone={statusMeta.tone}>{statusMeta.label}</StatusBadge>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              <Link
                href={`/candidates/${doc.candidateId}`}
                className="hover:text-foreground font-medium"
              >
                {doc.candidateName}
              </Link>
              {" · "}
              {doc.client}
              {" · "}
              v{doc.version}
              {doc.fileSize ? ` · ${doc.fileSize}` : ""}
              {doc.submittedDate ? ` · Submitted ${doc.submittedDate}` : ""}
            </p>
          </div>
          {doc.aiScore !== undefined && (
            <div className="shrink-0 text-right">
              <p className="text-muted-foreground text-[10px] tracking-wide uppercase">
                AI score
              </p>
              <AiScoreBar score={doc.aiScore} />
            </div>
          )}
        </div>
      </header>

      {/* Body: preview + analysis */}
      <div className="grid flex-1 grid-cols-1 lg:grid-cols-5">
        {/* Preview pane */}
        <div className="flex flex-col border-b lg:col-span-3 lg:border-r lg:border-b-0">
          {/* Preview toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-1.5">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                className="hover:bg-muted text-muted-foreground hover:text-foreground flex size-7 items-center justify-center rounded-md transition-colors"
                aria-label="Zoom out"
              >
                <ZoomOut className="size-3.5" />
              </button>
              <span className="text-muted-foreground w-10 text-center text-xs tabular-nums">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(2, z + 0.25))}
                className="hover:bg-muted text-muted-foreground hover:text-foreground flex size-7 items-center justify-center rounded-md transition-colors"
                aria-label="Zoom in"
              >
                <ZoomIn className="size-3.5" />
              </button>
              <span className="bg-border mx-1 h-4 w-px" />
              <button
                type="button"
                className="hover:bg-muted text-muted-foreground hover:text-foreground flex size-7 items-center justify-center rounded-md transition-colors"
                aria-label="Rotate"
              >
                <RotateCw className="size-3.5" />
              </button>
              <button
                type="button"
                className="hover:bg-muted text-muted-foreground hover:text-foreground flex size-7 items-center justify-center rounded-md transition-colors"
                aria-label="Fullscreen"
              >
                <Maximize2 className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCompare((c) => !c)}
                className={cn(
                  "ml-1 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                  compare
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                aria-pressed={compare}
                title="Compare against previous version"
              >
                <Split className="size-3.5" />
                Compare v{Math.max(1, doc.version - 1)}
              </button>
            </div>
            {pageCount > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="hover:bg-muted text-muted-foreground hover:text-foreground flex size-7 items-center justify-center rounded-md transition-colors disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="size-3.5" />
                </button>
                <span className="text-muted-foreground text-xs tabular-nums">
                  Page {page} / {pageCount}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={page === pageCount}
                  className="hover:bg-muted text-muted-foreground hover:text-foreground flex size-7 items-center justify-center rounded-md transition-colors disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Preview canvas */}
          <div className="bg-muted/40 flex flex-1 items-center justify-center overflow-auto p-6">
            <div
              className={cn(
                "grid w-full gap-4",
                compare ? "grid-cols-2" : "grid-cols-1",
              )}
              style={{
                maxWidth: compare ? "100%" : `${Math.round(420 * zoom)}px`,
              }}
            >
              <div className="flex flex-col gap-2">
                {compare && (
                  <p className="text-muted-foreground text-center text-[10px] tracking-wide uppercase">
                    Current — v{doc.version}
                  </p>
                )}
                <DocumentThumbnail doc={doc} size="lg" />
              </div>
              {compare && (
                <div className="flex flex-col gap-2">
                  <p className="text-muted-foreground text-center text-[10px] tracking-wide uppercase">
                    Previous — v{Math.max(1, doc.version - 1)}
                  </p>
                  <div className="opacity-70">
                    <DocumentThumbnail doc={doc} size="lg" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Extraction pane */}
        <div className="flex flex-col lg:col-span-2">
          {/* Tabs */}
          <div className="bg-muted/30 flex border-b px-1">
            {tabs.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTab(t.value)}
                className={cn(
                  "relative flex-1 px-2 py-2 text-xs font-medium transition-colors",
                  tab === t.value
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="inline-flex items-center gap-1">
                  {t.label}
                  {t.count !== undefined && t.count > 0 && (
                    <span className="bg-muted text-muted-foreground rounded-full px-1 py-px text-[9px] tabular-nums">
                      {t.count}
                    </span>
                  )}
                </span>
                {tab === t.value && (
                  <span className="bg-primary absolute right-0 bottom-0 left-0 h-0.5" />
                )}
              </button>
            ))}
          </div>

          {/* Panel */}
          <div className="max-h-[460px] flex-1 overflow-y-auto">
            {tab === "fields" && <FieldsPanel fields={doc.extractedFields} />}
            {tab === "validation" && (
              <ValidationPanel checks={doc.validation} />
            )}
            {tab === "signatures" && (
              <SignaturesPanel checks={doc.signatures} />
            )}
            {tab === "crossdoc" && <CrossDocPanel checks={doc.crossDoc} />}
          </div>
        </div>
      </div>

      {/* Action bar */}
      <footer className="flex flex-col gap-2 border-t bg-muted/20 px-4 py-2.5">
        {confirm && (
          <div
            className={cn(
              "flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm",
              confirm === "approve"
                ? "bg-success/10 border-success/30"
                : "bg-danger/10 border-danger/30",
            )}
          >
            <p>
              {confirm === "approve"
                ? `Approve ${doc.docType}? This will mark it complete in the candidate's package.`
                : `Reject ${doc.docType}? The candidate will be asked to resubmit.`}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                className="text-muted-foreground hover:text-foreground px-2 py-1 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setConfirm(null)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-semibold text-white",
                  confirm === "approve" ? "bg-success" : "bg-danger",
                )}
              >
                Confirm {confirm}
              </button>
            </div>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setConfirm("approve")}
              className="bg-success hover:bg-success/90 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-white transition-colors"
            >
              <CheckCircle2 className="size-3.5" /> Approve
            </button>
            <button
              type="button"
              onClick={() => setConfirm("reject")}
              className="bg-danger hover:bg-danger/90 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-white transition-colors"
            >
              <XCircle className="size-3.5" /> Reject
            </button>
            <button
              type="button"
              className="border-border hover:bg-muted inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium transition-colors"
            >
              <AlertTriangle className="size-3.5" /> Request correction
            </button>
            <button
              type="button"
              className="border-border hover:bg-muted inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium transition-colors"
            >
              <MessageSquare className="size-3.5" /> Add internal note
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors"
            >
              <History className="size-3.5" /> Audit trail
            </button>
            <button
              type="button"
              className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors"
            >
              <Download className="size-3.5" /> Download
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const stats = documentStats();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | DocumentCategory>("all");
  const [selectedId, setSelectedId] = useState<string>(DOCUMENTS[0]?.id ?? "");
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return DOCUMENTS.filter((doc) => {
      const matchesCategory =
        category === "all" || doc.category === category;
      const matchesQuery =
        !q ||
        doc.candidateName.toLowerCase().includes(q) ||
        doc.docType.toLowerCase().includes(q) ||
        doc.client.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  const selected =
    DOCUMENTS.find((d) => d.id === selectedId) ?? filtered[0] ?? DOCUMENTS[0];

  // Counts for AI insights banner
  const banner = useMemo(() => {
    const lowConfidence = DOCUMENTS.filter(
      (d) =>
        d.extractedFields?.some((f) => f.confidence < 80) ||
        (d.aiScore !== undefined && d.aiScore < 70),
    ).length;
    const crossDocMismatches = DOCUMENTS.reduce(
      (n, d) =>
        n + (d.crossDoc?.filter((c) => c.match === "mismatch").length ?? 0),
      0,
    );
    const expired = DOCUMENTS.filter((d) => d.status === "expired").length;
    return { lowConfidence, crossDocMismatches, expired };
  }, []);

  const toggleChecked = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <PageContainer className="flex flex-col gap-5">
      <PageHeader
        title="Document Intelligence"
        description="AI-assisted document review with OCR field extraction, cross-document validation, and signature detection (§20, §113)."
      />

      {/* AI Insights Banner */}
      <div className="bg-ai-muted/30 border-ai/30 flex flex-col gap-2 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
        <span className="bg-ai/15 text-ai-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
          <Sparkles className="size-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">
            AI reviewed {DOCUMENTS.length} documents this week.{" "}
            <span className="text-warning-muted-foreground font-semibold">
              {banner.lowConfidence} require manual review
            </span>{" "}
            (low confidence).{" "}
            <span className="text-danger-muted-foreground font-semibold">
              {banner.crossDocMismatches} cross-document mismatches
            </span>{" "}
            detected.{" "}
            <span className="text-warning-muted-foreground font-semibold">
              {banner.expired} expired ID
              {banner.expired === 1 ? "" : "s"}
            </span>
            .
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Average reviewer time saved per doc:{" "}
            <span className="font-semibold tabular-nums">8 minutes</span> · AI
            Copilot also drafted{" "}
            <span className="font-semibold tabular-nums">14</span> correction
            notices for candidates this week.
          </p>
        </div>
        <button
          type="button"
          className="border-ai/40 hover:bg-ai/10 text-ai-muted-foreground inline-flex shrink-0 items-center gap-1.5 rounded-md border bg-background px-2.5 py-1.5 text-xs font-medium transition-colors"
        >
          <Bot className="size-3.5" /> Ask AI about these docs
        </button>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={Clock} label="Pending / submitted" value={stats.pending} />
        <StatTile
          icon={Bot}
          label="AI review in progress"
          value={stats.awaitingReview}
          tone="info"
        />
        <StatTile
          icon={FileCheck}
          label="Approved"
          value={stats.approved}
          tone="success"
        />
        <StatTile
          icon={FileX}
          label="Rejected / correction"
          value={stats.rejected}
          tone="danger"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search candidate, doc type, client…"
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring h-8 w-64 rounded-md border py-1 pl-8 pr-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  category === cat.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
          {filtered.length} / {DOCUMENTS.length} documents
        </span>
      </div>

      {/* Split layout: list (left) + viewer (right) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Document list */}
        <div className="bg-card flex flex-col overflow-hidden rounded-xl border shadow-xs lg:col-span-1">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <h2 className="text-card-heading">Queue</h2>
            <span className="text-muted-foreground text-[11px] tabular-nums">
              Click a row to inspect
            </span>
          </div>
          <ul className="max-h-[720px] divide-y overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="text-muted-foreground px-4 py-8 text-center text-sm">
                No documents match your filters.
              </li>
            ) : (
              filtered.map((doc) => {
                const isSelected = doc.id === selected?.id;
                const isProblematic =
                  doc.status === "rejected" ||
                  doc.status === "correction-required" ||
                  doc.status === "expired";
                const statusMeta = DOCUMENT_STATUS_META[doc.status];
                const catMeta = DOCUMENT_CATEGORY_META[doc.category];
                return (
                  <li key={doc.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(doc.id)}
                      className={cn(
                        "flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors",
                        isSelected
                          ? "bg-primary/8 ring-primary/30 ring-1 ring-inset"
                          : isProblematic
                            ? "bg-danger-muted/10 hover:bg-danger-muted/20"
                            : "hover:bg-muted/50",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked.has(doc.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleChecked(doc.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-0.5 size-3.5 shrink-0 cursor-pointer"
                        aria-label={`Select ${doc.docType}`}
                      />
                      <DocumentThumbnail doc={doc} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-medium">
                            {doc.docType}
                          </p>
                          {doc.aiScore !== undefined && (
                            <span className="shrink-0">
                              <AiScoreBar score={doc.aiScore} />
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground truncate text-xs">
                          {doc.candidateName} · {doc.client}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-1.5 py-px text-[10px] font-medium",
                              catMeta.color,
                            )}
                          >
                            {catMeta.label}
                          </span>
                          <StatusBadge tone={statusMeta.tone}>
                            {statusMeta.label}
                          </StatusBadge>
                          {doc.aiFlags && doc.aiFlags.length > 0 && (
                            <span className="text-danger-muted-foreground inline-flex items-center gap-0.5 text-[10px] font-medium">
                              <AlertTriangle className="size-3" />
                              {doc.aiFlags.length}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        {/* Document viewer */}
        <div className="lg:col-span-2">
          {selected ? (
            <DocumentViewer doc={selected} />
          ) : (
            <div className="bg-card flex h-full min-h-[640px] items-center justify-center rounded-xl border shadow-xs">
              <p className="text-muted-foreground text-sm">
                Select a document to begin review.
              </p>
            </div>
          )}
        </div>
      </div>

      <p className="text-muted-foreground text-xs">
        AI Score reflects overall document quality (0–100). Per-field confidence
        is shown in the Fields tab. Sensitive values (SSN, DOB, account numbers)
        are masked per §42 field-level masking and decrypted only after explicit
        review action.
      </p>

      {/* Floating bulk actions */}
      {checked.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border bg-background px-3 py-2 shadow-lg">
          <span className="text-muted-foreground pl-1 text-xs font-medium">
            {checked.size} selected
          </span>
          <span className="bg-border h-5 w-px" />
          <button
            type="button"
            className="bg-success hover:bg-success/90 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white transition-colors"
          >
            <CheckCircle2 className="size-3" /> Approve {checked.size}
          </button>
          <button
            type="button"
            className="bg-danger hover:bg-danger/90 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-white transition-colors"
          >
            <XCircle className="size-3" /> Reject {checked.size}
          </button>
          <button
            type="button"
            className="hover:bg-muted text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
          >
            <UserPlus className="size-3" /> Reassign
          </button>
          <button
            type="button"
            className="hover:bg-muted text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
          >
            <Tag className="size-3" /> Tag
          </button>
          <button
            type="button"
            className="hover:bg-muted text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
          >
            <Download className="size-3" /> Export
          </button>
          <button
            type="button"
            onClick={() => setChecked(new Set())}
            className="hover:bg-muted text-muted-foreground hover:text-foreground ml-1 flex size-6 items-center justify-center rounded-full transition-colors"
            aria-label="Clear selection"
          >
            <X className="size-3" />
          </button>
        </div>
      )}
    </PageContainer>
  );
}
