"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AiConfidence } from "@/lib/ai";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
  actions?: { label: string; href?: string }[];
  sources?: string[];
  confidence?: AiConfidence;
};

export type CopilotPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
};

// ---------------------------------------------------------------------------
// Mocked AI responses
// ---------------------------------------------------------------------------

function getMockedResponse(
  query: string,
): Pick<Message, "content" | "actions" | "sources" | "confidence"> {
  const q = query.toLowerCase();

  if (q.includes("start date") || q.includes("at risk")) {
    return {
      content:
        "4 start dates are currently at risk:\n\n• James Rivera (Meridian Health) — start Jun 14, missing I-9.\n• Owen Bradley (Northwind Logistics) — start date Jun 13, already passed.\n• Grace Okafor (Meridian Health) — equipment not yet shipped.\n• Noah Klein (Vertex Financial) — FINRA review pending.",
      actions: [
        { label: "Open James Rivera", href: "/candidates/james-rivera" },
        { label: "View all at-risk", href: "/onboarding" },
      ],
      sources: ["Candidate records", "Start-date risk engine", "Package requirements"],
      confidence: "high",
    };
  }

  if (q.includes("reminder") || q.includes("james")) {
    return {
      content:
        "I've drafted a reminder for James Rivera:\n\n\"Hi James, your I-9 submission is needed before your June 14th start date. Please complete it in the portal today.\"\n\nShall I send this via email and SMS?",
      actions: [
        { label: "Send now" },
        { label: "Edit message" },
      ],
      sources: ["James Rivera candidate record", "Communication templates", "Gentle Nudge protocol"],
      confidence: "high",
    };
  }

  if (q.includes("integration") || q.includes("failure")) {
    return {
      content:
        "In the last 24 hours:\n\n• 3 Bullhorn sync failures (candidate status field mapping error on field \"employmentType\").\n• 1 Fieldglass authentication timeout — token expired at 06:14 UTC.\n\nAll records have been queued for retry. The Bullhorn mapping issue requires a configuration fix.",
      actions: [
        { label: "View integration health", href: "/integrations" },
      ],
      sources: ["Integration event log", "Bullhorn connector", "Fieldglass connector"],
      confidence: "high",
    };
  }

  if (q.includes("package") || q.includes("drop-off") || q.includes("drop off")) {
    return {
      content:
        "The Northwind Logistics Tech Staff package has a 24% candidate drop-off rate — the highest in your portfolio. The most-abandoned step is the Fieldglass Worker Profile form (68% abandonment).\n\nConsider simplifying the upload instructions or pre-populating fields from ATS data.",
      actions: [
        { label: "View package", href: "/packages" },
      ],
      sources: ["Package performance data (90 days)", "Drop-off event log", "Fieldglass integration logs"],
      confidence: "high",
    };
  }

  if (q.includes("unresponsive") || q.includes("responded") || q.includes("response")) {
    return {
      content:
        "3 candidates haven't responded to portal messages in over 48 hours:\n\n• James Rivera — last login 48h ago\n• Owen Bradley — last login 72h ago\n• Ravi Menon — last login 36h ago\n\nAll three have upcoming or overdue start dates. The Day 2 SMS nudge has been queued.",
      actions: [
        { label: "Open communications", href: "/communications" },
      ],
      sources: ["Portal activity log", "Message delivery receipts", "Gentle Nudge schedule"],
      confidence: "medium",
    };
  }

  // Fallback
  const resultCount = Math.floor(Math.random() * 8) + 3;
  return {
    content: `I found ${resultCount} results related to your query. Based on current data, the most relevant areas to investigate are the candidate pipeline and recent exception activity. Would you like me to drill into a specific area?`,
    actions: [
      { label: "View candidates", href: "/candidates" },
      { label: "View exceptions", href: "/exceptions" },
    ],
    sources: ["Global candidate index", "Exception log"],
    confidence: "medium",
  };
}

// ---------------------------------------------------------------------------
// Suggested prompts
// ---------------------------------------------------------------------------

const SUGGESTED_PROMPTS = [
  "Show start dates at risk",
  "Which candidates haven't responded?",
  "Draft a reminder for James Rivera",
  "Summarize integration failures today",
  "Which package has the most drop-offs?",
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ConfidenceDot({ confidence }: { confidence: AiConfidence }) {
  const cls =
    confidence === "high"
      ? "bg-success"
      : confidence === "medium"
        ? "bg-warning"
        : "bg-danger";
  return (
    <span
      className={cn("inline-block size-1.5 rounded-full", cls)}
      aria-label={`${confidence} confidence`}
    />
  );
}

function MessageBubble({ message }: { message: Message }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-primary/10 text-foreground max-w-[80%] rounded-2xl rounded-tr-sm px-3 py-2 text-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2">
      <span className="bg-ai-muted text-ai mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full">
        <Sparkles className="size-3" />
      </span>
      <div className="flex min-w-0 flex-col gap-2">
        <div className="bg-muted max-w-[85%] rounded-2xl rounded-tl-sm px-3 py-2 text-sm leading-relaxed whitespace-pre-line">
          {message.content}
        </div>
        {message.confidence && (
          <div className="flex items-center gap-1.5 px-1">
            <ConfidenceDot confidence={message.confidence} />
            <span className="text-muted-foreground text-[11px] capitalize">
              {message.confidence} confidence
            </span>
          </div>
        )}
        {message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap gap-1 px-1">
            <span className="text-muted-foreground text-[11px]">Sources:</span>
            {message.sources.map((s) => (
              <span
                key={s}
                className="bg-muted rounded-full px-2 py-0.5 text-[11px] font-medium"
              >
                {s}
              </span>
            ))}
          </div>
        )}
        {message.actions && message.actions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-1">
            {message.actions.map((a) => (
              <button
                key={a.label}
                type="button"
                className="border-ai/40 text-ai rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors hover:bg-ai-muted"
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function CopilotPanel({
  isOpen,
  onClose,
  initialPrompt = "",
}: CopilotPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasHandledInitialPrompt = useRef(false);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Handle initial prompt (from openCopilot call)
  useEffect(() => {
    if (isOpen && initialPrompt && !hasHandledInitialPrompt.current && messages.length === 0) {
      hasHandledInitialPrompt.current = true;
      handleSend(initialPrompt);
    }
    if (!isOpen) {
      hasHandledInitialPrompt.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialPrompt]);

  function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const response = getMockedResponse(trimmed);
      const aiMsg: Message = {
        id: `msg-${Date.now()}-ai`,
        role: "ai",
        ...response,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 800);
  }

  const showSuggestions = messages.length === 0 || (!isTyping && messages.at(-1)?.role === "ai");

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <aside
        className={cn(
          "fixed top-0 right-0 z-50 flex h-full w-96 flex-col border-l bg-card shadow-2xl transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
        aria-label="AI Copilot"
        role="complementary"
      >
        {/* Header */}
        <div className="from-ai/8 to-transparent flex items-center gap-3 border-b bg-gradient-to-r px-4 py-3">
          <span className="bg-ai-muted text-ai flex size-7 items-center justify-center rounded-lg">
            <Sparkles className="size-4" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-card-heading text-ai">AI Copilot</p>
          </div>
          <span className="bg-ai-muted text-ai-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-medium">
            Super Admin
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-md p-1 transition-colors"
            aria-label="Close AI Copilot"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <span className="bg-ai-muted text-ai flex size-12 items-center justify-center rounded-2xl">
                <Sparkles className="size-5" />
              </span>
              <div>
                <p className="font-medium">Ask anything</p>
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                  Query your onboarding operations in plain language. Every
                  answer shows sources, confidence, and recommended actions.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}

            {isTyping && (
              <div className="flex items-start gap-2">
                <span className="bg-ai-muted text-ai mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full">
                  <Sparkles className="size-3" />
                </span>
                <div className="bg-muted flex items-center gap-1 rounded-2xl rounded-tl-sm px-3 py-2.5">
                  <span className="bg-muted-foreground/60 size-1.5 animate-bounce rounded-full [animation-delay:-0.3s]" />
                  <span className="bg-muted-foreground/60 size-1.5 animate-bounce rounded-full [animation-delay:-0.15s]" />
                  <span className="bg-muted-foreground/60 size-1.5 animate-bounce rounded-full" />
                </div>
              </div>
            )}
          </div>

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested prompts */}
        {showSuggestions && (
          <div className="border-t px-4 py-2">
            <p className="text-data-label mb-2">Try asking</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleSend(p)}
                  className="border-ai/30 text-ai-muted-foreground hover:bg-ai-muted shrink-0 rounded-full border px-2.5 py-1 text-[11px] whitespace-nowrap transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input bar */}
        <div className="border-t p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your onboarding operations…"
              className="bg-muted/50 flex-1 rounded-lg border px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-ai/30"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="bg-ai text-ai-foreground flex size-8 items-center justify-center rounded-lg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send"
            >
              <Send className="size-3.5" />
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
