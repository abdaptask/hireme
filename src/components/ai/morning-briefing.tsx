"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getMorningBriefing } from "@/lib/ai";

type MorningBriefingProps = {
  className?: string;
};

/**
 * Highlights the numbers in a briefing summary by wrapping them in <strong>.
 * Keeps surrounding text as plain strings.
 */
function HighlightedSummary({ text }: { text: string }) {
  const parts = text.split(/(\d+)/g);
  return (
    <span>
      {parts.map((part, i) =>
        /^\d+$/.test(part) ? (
          <strong key={i} className="text-foreground">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
}

const HIGHLIGHT_TONE: Record<
  "danger" | "warning" | "info" | "success" | "ai",
  { pill: string; text: string }
> = {
  danger: {
    pill: "bg-danger-muted text-danger-muted-foreground",
    text: "text-danger-muted-foreground",
  },
  warning: {
    pill: "bg-warning-muted text-warning-muted-foreground",
    text: "text-warning-muted-foreground",
  },
  info: {
    pill: "bg-info-muted text-info-muted-foreground",
    text: "text-info-muted-foreground",
  },
  success: {
    pill: "bg-success-muted text-success-muted-foreground",
    text: "text-success-muted-foreground",
  },
  ai: {
    pill: "bg-ai-muted text-ai-muted-foreground",
    text: "text-ai-muted-foreground",
  },
};

export function MorningBriefing({ className }: MorningBriefingProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const briefing = getMorningBriefing();

  const formattedDate = new Date(briefing.date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className={cn(
        "bg-card relative overflow-hidden rounded-xl border shadow-xs",
        className,
      )}
    >
      {/* Left border accent — AI purple gradient */}
      <span
        aria-hidden
        className="from-ai to-ai/40 absolute top-0 left-0 h-full w-1 bg-gradient-to-b"
      />

      {/* Header */}
      <div className="from-ai/5 to-transparent flex items-start justify-between gap-3 border-b bg-gradient-to-r px-4 py-3 pl-5">
        <div className="flex items-center gap-2">
          <span className="bg-ai-muted text-ai flex size-7 items-center justify-center rounded-lg">
            <Sparkles className="size-3.5" />
          </span>
          <div>
            <h2 className="text-card-heading text-ai">AI Morning Briefing</h2>
            <p className="text-metadata">{formattedDate}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground rounded-md p-1 transition-colors"
          aria-label="Dismiss morning briefing"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Summary */}
      <div className="px-5 py-3">
        <p className="text-muted-foreground text-sm leading-relaxed">
          <HighlightedSummary text={briefing.summary} />
        </p>
      </div>

      {/* Highlights row */}
      <div className="flex gap-2 overflow-x-auto px-5 pb-3 pt-0">
        {briefing.highlights.map((h) => {
          const tone = HIGHLIGHT_TONE[h.tone];
          const pill = (
            <span
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap transition-opacity hover:opacity-80",
                tone.pill,
              )}
            >
              <span className="tabular-nums font-semibold">{h.count}</span>
              {h.label}
            </span>
          );

          return h.href ? (
            <Link key={h.label} href={h.href}>
              {pill}
            </Link>
          ) : (
            <span key={h.label}>{pill}</span>
          );
        })}
      </div>

      {/* Footer — Ask AI input */}
      <div className="border-t px-4 py-3 pl-5">
        <div className="bg-muted/50 flex items-center gap-2 rounded-lg border px-3 py-2">
          <Sparkles className="text-ai size-3.5 shrink-0" />
          <input
            type="text"
            placeholder="Ask a follow-up question…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            readOnly
            tabIndex={-1}
          />
          <button
            type="button"
            className="bg-ai text-ai-foreground rounded-md px-2.5 py-1 text-xs font-medium transition-opacity hover:opacity-90"
          >
            Ask AI
          </button>
        </div>
      </div>
    </div>
  );
}
