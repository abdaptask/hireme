"use client";

import { AlertTriangle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { RecommendationCard } from "@/components/ai/recommendation-card";
import type { AiRecommendation, CandidateAiSummary } from "@/lib/ai";

const CONFIDENCE_DOT: Record<CandidateAiSummary["confidence"], string> = {
  high: "bg-success",
  medium: "bg-warning",
  low: "bg-danger",
};

const CONFIDENCE_TEXT: Record<CandidateAiSummary["confidence"], string> = {
  high: "text-success-muted-foreground",
  medium: "text-warning-muted-foreground",
  low: "text-danger-muted-foreground",
};

type CandidateAiPanelProps = {
  summary: CandidateAiSummary;
  recommendations: AiRecommendation[];
};

/**
 * Right-panel AI section for Candidate 360 (§100.1 right context panel).
 * Client component so RecommendationCard state (expand/collapse) works.
 */
export function CandidateAiPanel({
  summary,
  recommendations,
}: CandidateAiPanelProps) {
  return (
    <>
      {/* AI Summary card */}
      <div className="bg-card rounded-xl border p-4 shadow-xs">
        <h3 className="text-card-heading mb-2 flex items-center gap-1.5">
          <Sparkles className="text-ai size-4" />
          AI Summary
        </h3>

        {/* Confidence + readiness */}
        <div className="mb-3 flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs">
            <span
              className={cn(
                "inline-block size-1.5 rounded-full",
                CONFIDENCE_DOT[summary.confidence],
              )}
            />
            <span className={cn("capitalize", CONFIDENCE_TEXT[summary.confidence])}>
              {summary.confidence} confidence
            </span>
          </span>
          <span className="text-metadata">
            {summary.estimatedStartReadiness}% start-ready
          </span>
        </div>

        {/* Progress bar */}
        <div className="bg-muted mb-3 h-1.5 overflow-hidden rounded-full">
          <span
            className={cn(
              "block h-full rounded-full transition-all",
              summary.estimatedStartReadiness >= 80
                ? "bg-success"
                : summary.estimatedStartReadiness >= 50
                  ? "bg-warning"
                  : "bg-danger",
            )}
            style={{ width: `${summary.estimatedStartReadiness}%` }}
          />
        </div>

        <p className="text-muted-foreground text-sm leading-relaxed">
          {summary.summary}
        </p>

        {/* Risk factors */}
        {summary.riskFactors.length > 0 && (
          <div className="mt-3">
            <p className="text-data-label mb-1.5">Risk factors</p>
            <div className="flex flex-col gap-1.5">
              {summary.riskFactors.map((rf) => (
                <span
                  key={rf}
                  className="bg-danger-muted text-danger-muted-foreground flex items-start gap-1.5 rounded-md px-2 py-1 text-xs leading-relaxed"
                >
                  <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                  {rf}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Next best action */}
        <div className="border-ai/20 bg-ai/5 mt-3 rounded-lg border px-3 py-2">
          <p className="text-data-label text-ai mb-0.5">Next best action</p>
          <p className="text-ai text-xs leading-relaxed">{summary.nextBestAction}</p>
        </div>
      </div>

      {/* Candidate-specific AI recommendations */}
      {recommendations.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-card-heading flex items-center gap-1.5">
            <Sparkles className="text-ai size-3.5" />
            AI Recommendations
          </h3>
          {recommendations.map((rec) => (
            <RecommendationCard key={rec.id} recommendation={rec} compact />
          ))}
        </div>
      )}
    </>
  );
}
