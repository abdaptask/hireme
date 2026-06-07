"use client";

import { Send, Sparkles } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const SAMPLE_PROMPTS = [
  "Show all background checks delayed by more than five days.",
  "Which client package causes the highest drop-off?",
  "Summarize integration failures from the last 24 hours.",
  "Which start dates are likely to be missed?",
];

/**
 * AI Copilot entry point (§10, §105). The orchestration layer is wired in
 * v0.9 (see docs/ROADMAP.md); this panel previews the explainable-AI surface
 * and the safety framing (§11) so the entry point exists from day one.
 */
export function AiCopilotPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className="bg-ai-muted text-ai-muted-foreground flex size-7 items-center justify-center rounded-md">
              <Sparkles className="size-4" />
            </span>
            AI Copilot
            <Badge variant="secondary" className="ml-1 text-[10px]">
              Preview · v0.9
            </Badge>
          </SheetTitle>
          <SheetDescription>
            Ask questions in plain language across candidates, packages,
            screening, and integrations. Every answer will show its sources,
            confidence, and recommended action.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-3 overflow-auto px-4">
          <p className="text-data-label">Try asking</p>
          {SAMPLE_PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              disabled
              className="bg-muted/60 text-muted-foreground w-full cursor-not-allowed rounded-lg border px-3 py-2 text-left text-sm"
            >
              {p}
            </button>
          ))}

          <div className="border-ai/30 bg-ai-muted/40 mt-4 rounded-lg border border-dashed p-3">
            <p className="text-ai-muted-foreground flex items-center gap-1.5 text-xs font-medium">
              <Sparkles className="size-3.5" /> Explainable & governed by design
            </p>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              High-risk actions always require human approval (§11). Responses
              will display what was detected, why it matters, confidence, data
              used, and whether approval is required.
            </p>
          </div>
        </div>

        <div className="border-t p-4">
          <div className="bg-muted/50 text-muted-foreground flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
            <input
              disabled
              placeholder="Ask the Copilot… (available in v0.9)"
              className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground/70"
            />
            <Button size="icon-sm" variant="ghost" disabled aria-label="Send">
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
