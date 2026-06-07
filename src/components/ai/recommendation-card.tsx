"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  TrendingUp,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AiRecommendation } from "@/lib/ai";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const URGENCY_BAR: Record<AiRecommendation["urgency"], string> = {
  critical: "bg-danger",
  high: "bg-warning",
  medium: "bg-info",
  low: "bg-neutral",
};

const URGENCY_BADGE_TONE: Record<
  AiRecommendation["urgency"],
  string
> = {
  critical: "bg-danger-muted text-danger-muted-foreground",
  high: "bg-warning-muted text-warning-muted-foreground",
  medium: "bg-info-muted text-info-muted-foreground",
  low: "bg-neutral-muted text-neutral-muted-foreground",
};

const CONFIDENCE_DOT: Record<AiRecommendation["confidence"], string> = {
  high: "bg-success",
  medium: "bg-warning",
  low: "bg-danger",
};

const TYPE_ICON = {
  action: Zap,
  alert: AlertTriangle,
  insight: TrendingUp,
  risk: ShieldAlert,
};

const STATUS_LABEL: Record<AiRecommendation["status"], string> = {
  pending: "Awaiting decision",
  accepted: "Accepted",
  rejected: "Rejected",
  "auto-executed": "Auto-executed",
};

const STATUS_BADGE_TONE: Record<AiRecommendation["status"], string> = {
  pending: "bg-ai-muted text-ai-muted-foreground",
  accepted: "bg-success-muted text-success-muted-foreground",
  rejected: "bg-neutral-muted text-neutral-muted-foreground",
  "auto-executed": "bg-info-muted text-info-muted-foreground",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type RecommendationCardProps = {
  recommendation: AiRecommendation;
  defaultExpanded?: boolean;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  compact?: boolean;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RecommendationCard({
  recommendation: r,
  defaultExpanded = false,
  onAccept,
  onReject,
  compact = false,
}: RecommendationCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const Icon = TYPE_ICON[r.type];

  return (
    <div
      className={cn(
        "bg-card relative overflow-hidden rounded-xl border shadow-xs transition-all duration-200",
        compact ? "rounded-lg" : "rounded-xl",
      )}
    >
      {/* Urgency accent bar */}
      <span
        aria-hidden
        className={cn(
          "absolute top-0 left-0 h-full w-1 shrink-0",
          URGENCY_BAR[r.urgency],
        )}
      />

      {/* Collapsed / always-visible header */}
      <div
        className={cn(
          "flex items-start gap-3 pl-4",
          compact ? "px-3 py-2.5" : "px-4 py-3",
        )}
      >
        {/* Type icon */}
        <span className="bg-ai-muted text-ai mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg">
          <Icon className="size-3.5" />
        </span>

        {/* Title + meta */}
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "font-medium leading-snug",
              compact ? "text-sm" : "text-[0.875rem]",
            )}
          >
            {r.title}
          </p>
          {!compact && (
            <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed line-clamp-2">
              {r.summary}
            </p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {/* Confidence indicator */}
            <span className="flex items-center gap-1 text-xs">
              <span
                className={cn(
                  "inline-block size-1.5 rounded-full",
                  CONFIDENCE_DOT[r.confidence],
                )}
              />
              <span className="text-muted-foreground capitalize">
                {r.confidence} confidence
              </span>
            </span>
            {/* Urgency badge */}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize",
                URGENCY_BADGE_TONE[r.urgency],
              )}
            >
              {r.urgency}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1.5">
          {r.status === "pending" && (
            <>
              <button
                type="button"
                onClick={() => onAccept?.(r.id)}
                className="rounded-md bg-success-muted px-2 py-1 text-[11px] font-medium text-success-muted-foreground transition-colors hover:opacity-80"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => onReject?.(r.id)}
                className="rounded-md border px-2 py-1 text-[11px] font-medium transition-colors hover:bg-muted"
              >
                Reject
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setExpanded((x) => !x)}
            className="text-muted-foreground hover:text-foreground flex items-center gap-0.5 rounded px-1 py-0.5 text-xs transition-colors"
            aria-expanded={expanded}
          >
            Details
            {expanded ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 pl-5">
          {/* What was detected */}
          <div className="bg-muted/50 mb-3 rounded-lg p-3">
            <p className="text-data-label mb-1">What was detected</p>
            <p className="text-sm leading-relaxed">{r.what}</p>
          </div>

          {/* Why it matters */}
          <div className="mb-3">
            <p className="text-data-label mb-1">Why it matters</p>
            <p className="text-muted-foreground text-sm leading-relaxed">{r.why}</p>
          </div>

          {/* Data used */}
          <div className="mb-3">
            <p className="text-data-label mb-1.5">Data used</p>
            <div className="flex flex-wrap gap-1.5">
              {r.dataUsed.map((d) => (
                <span
                  key={d}
                  className="bg-muted rounded-full px-2 py-0.5 text-[11px] font-medium"
                >
                  {d}
                </span>
              ))}
            </div>
          </div>

          {/* Recommended action */}
          <div className="mb-3">
            <p className="text-data-label mb-1.5">Recommended action</p>
            <div className="border-ai/20 bg-ai/5 rounded-lg border px-3 py-2">
              <p className="text-ai text-sm font-medium">{r.recommendedAction}</p>
            </div>
          </div>

          {/* Approval required warning */}
          {r.approvalRequired && (
            <div className="bg-warning-muted text-warning-muted-foreground mb-3 flex items-start gap-2 rounded-lg px-3 py-2 text-sm">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>Human approval required before executing this action.</span>
            </div>
          )}

          {/* Status footer */}
          <div className="flex items-center justify-between">
            <span className="text-metadata">
              {new Date(r.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-medium",
                STATUS_BADGE_TONE[r.status],
              )}
            >
              {STATUS_LABEL[r.status]}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
