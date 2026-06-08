"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  Shield,
  Bot,
  Database,
  Zap,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SupportingRecord {
  label: string;
  value: string;
  tone?: "danger" | "warning" | "success" | "info" | "neutral";
}

interface MockAiResponse {
  answer: string;
  supportingRecords: SupportingRecord[];
  confidence: number;
  dataSources: string[];
  recommendedAction: string;
  actionLabel: string;
  requiresApproval: boolean;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  response?: MockAiResponse;
  timestamp: Date;
}

// ---------------------------------------------------------------------------
// Mock response library
// ---------------------------------------------------------------------------

const SCREENING_RESPONSE: MockAiResponse = {
  answer:
    "Found 7 candidates whose background checks have been pending for more than 5 days. 3 are flagged as At Risk due to start dates within the next 7 days.",
  supportingRecords: [
    { label: "James Rivera", value: "8 days pending · Starts Jun 10", tone: "danger" },
    { label: "Priya Nair", value: "6 days pending · Starts Jun 12", tone: "danger" },
    { label: "Marcus Webb", value: "5 days pending · Starts Jun 15", tone: "warning" },
    { label: "+4 more candidates", value: "View all →", tone: "neutral" },
  ],
  confidence: 97,
  dataSources: ["Screening API · HireRight", "Candidate DB", "Start-Date Risk Engine"],
  recommendedAction: "Escalate the 3 at-risk candidates to your screening vendor and notify the Account Manager.",
  actionLabel: "Escalate 3 Candidates",
  requiresApproval: false,
};

const RISK_RESPONSE: MockAiResponse = {
  answer:
    "6 candidates have a start-date confidence score below 70% this week. The primary risk factors are: pending I-9 (3), undelivered equipment (2), and outstanding client approval (1).",
  supportingRecords: [
    { label: "Aaliyah Brooks", value: "Confidence 42% · Missing I-9", tone: "danger" },
    { label: "Devon Okafor", value: "Confidence 55% · Equipment delayed", tone: "danger" },
    { label: "Sofia Herrera", value: "Confidence 61% · Client approval pending", tone: "warning" },
    { label: "+3 more candidates", value: "View all →", tone: "neutral" },
  ],
  confidence: 91,
  dataSources: ["Start-Date Risk Engine", "Equipment System", "Client Approval API", "Candidate DB"],
  recommendedAction: "Send priority nudge to the 3 I-9 candidates and request equipment status update from IT.",
  actionLabel: "Send Priority Nudge",
  requiresApproval: false,
};

const PAYROLL_RESPONSE: MockAiResponse = {
  answer:
    "12 candidates are missing payroll information required before their start date. Most common gaps: direct deposit not submitted (8), W-4 incomplete (5), state tax form missing (4).",
  supportingRecords: [
    { label: "Direct deposit missing", value: "8 candidates", tone: "danger" },
    { label: "W-4 incomplete", value: "5 candidates", tone: "warning" },
    { label: "State tax form missing", value: "4 candidates", tone: "warning" },
    { label: "Payroll entity mismatch", value: "2 candidates", tone: "danger" },
  ],
  confidence: 99,
  dataSources: ["Payroll Readiness Engine", "Candidate DB", "ADP Integration"],
  recommendedAction: "Dispatch a targeted nudge to the 12 candidates with a direct link to the payroll setup task.",
  actionLabel: "Dispatch Payroll Nudge",
  requiresApproval: false,
};

const INTEGRATION_RESPONSE: MockAiResponse = {
  answer:
    "17 integration failures occurred in the last 24 hours across 3 connectors. HireRight (screening) had 9 webhook delivery failures due to an authentication token expiry at 02:14 UTC.",
  supportingRecords: [
    { label: "HireRight Webhook", value: "9 failures · Auth expired", tone: "danger" },
    { label: "ADP Payroll Sync", value: "5 failures · Rate limit hit", tone: "warning" },
    { label: "Fieldglass VMS", value: "3 failures · Timeout", tone: "warning" },
  ],
  confidence: 100,
  dataSources: ["Integration Health Monitor", "Dead-Letter Queue", "API Gateway Logs"],
  recommendedAction: "Rotate the HireRight OAuth token and replay the 9 failed webhook events. ADP will self-recover after rate-limit reset at 06:00 UTC.",
  actionLabel: "Rotate Token & Replay",
  requiresApproval: true,
};

const DROPOFF_RESPONSE: MockAiResponse = {
  answer:
    "Client A's onboarding package has a 23% drop-off rate — the highest in your portfolio. The primary friction point is the 14-page security policy PDF that requires manual e-signature with no save-and-resume.",
  supportingRecords: [
    { label: "Client A (Acme Corp)", value: "23% drop-off · 14 candidates affected", tone: "danger" },
    { label: "Client B (Global Tech)", value: "11% drop-off", tone: "warning" },
    { label: "Client C (FinServ LLC)", value: "6% drop-off", tone: "success" },
  ],
  confidence: 86,
  dataSources: ["Package Performance DB", "Candidate Journey Analytics", "Form Friction Engine"],
  recommendedAction: "Break the Client A security policy into 3 short sections with inline signing and enable save-and-resume.",
  actionLabel: "Open Package Editor",
  requiresApproval: false,
};

const NUDGE_RESPONSE: MockAiResponse = {
  answer:
    "Draft nudge message ready for James Rivera. Tone calibrated to Day 4 of the escalation sequence — personalized and direct, referencing the specific missing document.",
  supportingRecords: [
    { label: "Channel", value: "Email + SMS", tone: "info" },
    { label: "Missing item", value: "Client A NDA · Overdue 3 days", tone: "danger" },
    { label: "Start date", value: "Jun 10 · 3 days away", tone: "warning" },
  ],
  confidence: 88,
  dataSources: ["Gentle Nudge Protocol Engine", "Communication Preference DB", "Candidate Timeline"],
  recommendedAction:
    '"Hi James, just a quick reminder that your Client A NDA is still outstanding — your start date is in 3 days. Click here to sign in 2 minutes."',
  actionLabel: "Send Nudge",
  requiresApproval: false,
};

const GENERAL_RESPONSE: MockAiResponse = {
  answer:
    "I found relevant data across your platform. Here is a summary of the most actionable items based on your query.",
  supportingRecords: [
    { label: "Active onboardings", value: "47 total", tone: "info" },
    { label: "At risk", value: "6 candidates", tone: "danger" },
    { label: "SLA breaches", value: "3 open", tone: "warning" },
  ],
  confidence: 78,
  dataSources: ["Candidate DB", "Workflow Engine", "SLA Monitor"],
  recommendedAction: "Review the At Risk candidates in your My Work queue to prevent start-date misses.",
  actionLabel: "Open My Work",
  requiresApproval: false,
};

// ---------------------------------------------------------------------------
// Prompt → response mapping
// ---------------------------------------------------------------------------

const SAMPLE_PROMPTS = [
  "Show all background checks delayed by more than 5 days",
  "Which start dates are at risk this week?",
  "Find candidates with missing payroll information",
  "Summarize integration failures from the last 24 hours",
  "Which client package causes the highest drop-off?",
  "Draft a nudge message for James Rivera",
];

function pickResponse(prompt: string): MockAiResponse {
  const p = prompt.toLowerCase();
  if (p.includes("background") || p.includes("screening")) return SCREENING_RESPONSE;
  if (p.includes("risk") || p.includes("start date")) return RISK_RESPONSE;
  if (p.includes("payroll") || p.includes("missing payroll")) return PAYROLL_RESPONSE;
  if (p.includes("integration") || p.includes("failure")) return INTEGRATION_RESPONSE;
  if (p.includes("drop-off") || p.includes("drop off") || p.includes("package")) return DROPOFF_RESPONSE;
  if (p.includes("nudge") || p.includes("james") || p.includes("rivera") || p.includes("draft")) return NUDGE_RESPONSE;
  return GENERAL_RESPONSE;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <Bot className="text-muted-foreground mr-1 size-4 shrink-0" />
      <div className="bg-muted/50 flex items-center gap-1 rounded-2xl rounded-tl-sm px-3 py-2">
        <span
          className="bg-muted-foreground size-1.5 animate-bounce rounded-full"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="bg-muted-foreground size-1.5 animate-bounce rounded-full"
          style={{ animationDelay: "100ms" }}
        />
        <span
          className="bg-muted-foreground size-1.5 animate-bounce rounded-full"
          style={{ animationDelay: "200ms" }}
        />
      </div>
    </div>
  );
}

function AiResponseCard({ response }: { response: MockAiResponse }) {
  const confidenceTone =
    response.confidence >= 80 ? "success" : response.confidence >= 60 ? "warning" : "danger";

  return (
    <div className="bg-card rounded-xl border p-3 space-y-3">
      {/* Answer */}
      <p className="text-sm leading-relaxed">{response.answer}</p>

      {/* Supporting records */}
      <div className="space-y-1.5">
        <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
          Supporting Records
        </p>
        <div className="divide-y rounded-lg border overflow-hidden">
          {response.supportingRecords.map((rec) => (
            <div
              key={rec.label}
              className="bg-muted/30 flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs"
            >
              <span className="font-medium truncate">{rec.label}</span>
              <span
                className={
                  rec.tone === "danger"
                    ? "text-danger font-medium shrink-0"
                    : rec.tone === "warning"
                    ? "text-warning font-medium shrink-0"
                    : rec.tone === "success"
                    ? "text-success font-medium shrink-0"
                    : "text-muted-foreground shrink-0"
                }
              >
                {rec.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Confidence + data sources row */}
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge tone={confidenceTone}>
          {response.confidence}% confidence
        </StatusBadge>
        <div className="text-muted-foreground flex items-center gap-1 text-[10px]">
          <Database className="size-3 shrink-0" />
          <span className="truncate">{response.dataSources.join(" · ")}</span>
        </div>
      </div>

      {/* Recommended action */}
      <div className="bg-ai-muted/40 border-ai/20 rounded-lg border p-2.5 space-y-2">
        <p className="text-ai-muted-foreground flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider">
          <Zap className="size-3" />
          Recommended Action
        </p>
        <p className="text-xs leading-relaxed">{response.recommendedAction}</p>
        <div className="flex items-center gap-2">
          <Button size="sm" className="h-7 text-xs gap-1">
            {response.actionLabel}
            <ChevronRight className="size-3" />
          </Button>
          {response.requiresApproval && (
            <StatusBadge tone="danger" withDot={false}>
              <AlertTriangle className="size-3 mr-0.5" />
              Requires approval
            </StatusBadge>
          )}
        </div>
      </div>

      {/* Audit footer */}
      <p className="text-muted-foreground/60 text-[10px] flex items-center gap-1">
        <Shield className="size-2.5" />
        Audit logged · AI Copilot v0.9 · {new Date().toLocaleTimeString()}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

/**
 * AI Copilot panel — full interactive assistant (§10, §105).
 * Every response shows answer, supporting records, confidence, data sources,
 * recommended action, safety warnings, and audit footer.
 */
export function AiCopilotPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        response: pickResponse(trimmed),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const hasMessages = messages.length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md p-0 gap-0">
        {/* Header */}
        <SheetHeader className="border-b px-4 pt-4 pb-3 shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <span className="bg-ai-muted text-ai flex size-7 items-center justify-center rounded-md shrink-0">
              <Sparkles className="size-4" />
            </span>
            AI Copilot
            <Badge variant="secondary" className="ml-1 text-[10px]">
              v0.9
            </Badge>
            {/* Context chip */}
            <Badge
              variant="outline"
              className="ml-auto text-[10px] font-normal text-muted-foreground"
            >
              Context: Global
            </Badge>
          </SheetTitle>
          <SheetDescription className="text-xs">
            Ask questions across candidates, packages, screening, and integrations.
          </SheetDescription>

          {/* Safety banner (§11) */}
          <div className="bg-danger-muted/60 border-danger/20 mt-2 flex items-start gap-2 rounded-lg border px-2.5 py-2 text-xs">
            <Shield className="text-danger mt-0.5 size-3.5 shrink-0" />
            <span className="text-danger-muted-foreground leading-snug">
              <strong>High-risk actions require human approval.</strong> AI decisions for
              adverse action, rate changes, and deletions are never auto-executed.
            </span>
          </div>
        </SheetHeader>

        {/* Message area */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {!hasMessages && (
            <>
              <p className="text-muted-foreground text-xs font-medium mt-1 mb-2">
                Try asking
              </p>
              {SAMPLE_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => sendMessage(p)}
                  disabled={isTyping}
                  className="bg-muted/50 hover:bg-muted text-foreground w-full cursor-pointer rounded-lg border px-3 py-2 text-left text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {p}
                </button>
              ))}

              <div className="border-ai/20 bg-ai-muted/30 mt-3 rounded-lg border border-dashed p-3">
                <p className="text-ai flex items-center gap-1.5 text-xs font-medium">
                  <Sparkles className="size-3.5" />
                  Explainable AI — §10, §105
                </p>
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                  Every response shows what was detected, why it matters, confidence,
                  data sources, and whether human approval is required.
                </p>
              </div>
            </>
          )}

          {messages.map((msg) =>
            msg.role === "user" ? (
              /* User bubble */
              <div key={msg.id} className="flex justify-end">
                <div className="bg-primary/10 text-foreground max-w-[80%] rounded-2xl rounded-tr-sm px-3 py-2 text-sm">
                  {msg.content}
                </div>
              </div>
            ) : (
              /* AI structured card */
              <div key={msg.id} className="flex items-start gap-2">
                <div className="bg-ai-muted text-ai mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full">
                  <Bot className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  {msg.response && <AiResponseCard response={msg.response} />}
                </div>
              </div>
            )
          )}

          {isTyping && (
            <div className="flex items-start gap-2">
              <div className="bg-ai-muted text-ai mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full">
                <Bot className="size-3.5" />
              </div>
              <TypingIndicator />
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="border-t px-4 py-3 shrink-0">
          <div className="bg-muted/50 flex items-center gap-2 rounded-lg border px-3 py-2 focus-within:ring-2 focus-within:ring-ring/50 transition-shadow">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the Copilot…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
              disabled={isTyping}
              aria-label="Message AI Copilot"
            />
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              aria-label="Send message"
            >
              <Send className="size-4" />
            </Button>
          </div>
          <p className="text-muted-foreground/50 mt-1.5 text-center text-[10px]">
            AI outputs are advisory. Every action is audit logged.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
