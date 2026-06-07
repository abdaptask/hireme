import { cn } from "@/lib/utils";
import type { PipelineStatus, RiskLevel, StatusTone } from "@/lib/types";

/**
 * Status language (§5.3) rendered color-independently (§3.6): every badge pairs
 * a colored dot with a text label so meaning never relies on hue alone.
 */

const toneClasses: Record<StatusTone, string> = {
  success: "bg-success-muted text-success-muted-foreground",
  warning: "bg-warning-muted text-warning-muted-foreground",
  danger: "bg-danger-muted text-danger-muted-foreground",
  info: "bg-info-muted text-info-muted-foreground",
  ai: "bg-ai-muted text-ai-muted-foreground",
  neutral: "bg-neutral-muted text-neutral-muted-foreground",
};

const dotClasses: Record<StatusTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  ai: "bg-ai",
  neutral: "bg-neutral",
};

/** Maps the spec's pipeline statuses (§5.3) to a tone + human label. */
export const PIPELINE_STATUS_META: Record<
  PipelineStatus,
  { tone: StatusTone; label: string }
> = {
  "on-track": { tone: "success", label: "On Track" },
  "needs-attention": { tone: "warning", label: "Needs Attention" },
  "at-risk": { tone: "danger", label: "At Risk" },
  "waiting-external": { tone: "neutral", label: "Waiting on External" },
  "in-review": { tone: "info", label: "In Review" },
  "ai-pending": { tone: "ai", label: "AI Recommendation" },
};

/** Start-Date Risk Engine levels (§33). */
export const RISK_LEVEL_META: Record<
  RiskLevel,
  { tone: StatusTone; label: string }
> = {
  "on-track": { tone: "success", label: "On Track" },
  "needs-attention": { tone: "warning", label: "Needs Attention" },
  "at-risk": { tone: "danger", label: "At Risk" },
  unlikely: { tone: "danger", label: "Start Unlikely" },
};

export function StatusDot({
  tone,
  className,
}: {
  tone: StatusTone;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-2 shrink-0 rounded-full",
        dotClasses[tone],
        className,
      )}
    />
  );
}

export function StatusBadge({
  tone,
  children,
  className,
  withDot = true,
}: {
  tone: StatusTone;
  children: React.ReactNode;
  className?: string;
  withDot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        toneClasses[tone],
        className,
      )}
    >
      {withDot && <StatusDot tone={tone} />}
      {children}
    </span>
  );
}

export function PipelineStatusBadge({
  status,
  className,
}: {
  status: PipelineStatus;
  className?: string;
}) {
  const meta = PIPELINE_STATUS_META[status];
  return (
    <StatusBadge tone={meta.tone} className={className}>
      {meta.label}
    </StatusBadge>
  );
}

export function RiskBadge({
  level,
  className,
}: {
  level: RiskLevel;
  className?: string;
}) {
  const meta = RISK_LEVEL_META[level];
  return (
    <StatusBadge tone={meta.tone} className={className}>
      {meta.label}
    </StatusBadge>
  );
}
