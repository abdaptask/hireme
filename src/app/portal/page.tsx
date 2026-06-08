/**
 * Candidate Portal — Guided Concierge (§5.2, §101, §28, §96)
 * Mobile-first, premium-grade onboarding experience.
 */
import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  FileText,
  Mail,
  MessageSquare,
  ShieldCheck,
  User,
} from "lucide-react";
import { LaunchpadSection } from "@/components/launchpad/launchpad-section";
import { ProgressRing } from "@/components/portal/progress-ring";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { LAUNCHPADS } from "@/lib/launchpad";
import { cn } from "@/lib/utils";
import type { StatusTone } from "@/lib/types";
import {
  AI_SUGGESTED_QUESTIONS,
  CANDIDATE,
  COMMS,
  DAY1_CHECKLIST,
  NEXT_BEST_ACTION,
  PORTAL_STAGES,
  PORTAL_TASKS,
  TEAM,
  type PortalTask,
} from "@/lib/portal-data";

export const metadata: Metadata = { title: "Your Onboarding | HireMe" };

// ─── helpers ────────────────────────────────────────────────

function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("bg-card rounded-2xl border p-4 shadow-xs sm:p-5", className)}
    >
      {children}
    </section>
  );
}

const CATEGORY_ICON: Record<PortalTask["category"], React.FC<{ className?: string }>> = {
  identity: ({ className }) => <ShieldCheck className={className} />,
  tax: ({ className }) => <FileText className={className} />,
  legal: ({ className }) => <FileText className={className} />,
  payroll: ({ className }) => <FileText className={className} />,
  screening: ({ className }) => <ShieldCheck className={className} />,
  training: ({ className }) => <FileText className={className} />,
  profile: ({ className }) => <User className={className} />,
};

// ─── stage timeline ─────────────────────────────────────────

function StageTimeline() {
  return (
    <ol className="flex flex-col">
      {PORTAL_STAGES.map((s, i) => {
        const last = i === PORTAL_STAGES.length - 1;
        const pct = s.state === "completed" ? 100 : s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
        return (
          <li key={s.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-semibold",
                  s.state === "completed" && "bg-primary border-primary text-primary-foreground",
                  s.state === "current" && "border-primary text-primary ring-primary/20 ring-4",
                  s.state === "upcoming" && "border-border text-muted-foreground",
                )}
              >
                {s.state === "completed" ? <Check className="size-3.5" /> : i + 1}
              </span>
              {!last && (
                <span
                  className={cn(
                    "my-0.5 w-0.5 flex-1 min-h-[16px]",
                    s.state === "completed" ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </div>
            <div className={cn("pb-3.5", last && "pb-0")}>
              <p
                className={cn(
                  "text-sm leading-6",
                  s.state === "current" ? "font-semibold" : s.state === "upcoming" ? "text-muted-foreground" : "font-medium",
                )}
              >
                {s.label}
              </p>
              {s.state === "current" && (
                <div className="mt-0.5 flex items-center gap-2">
                  <div className="bg-border h-1 flex-1 rounded-full overflow-hidden max-w-[80px]">
                    <div
                      className="bg-primary h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-primary text-[11px] font-medium">
                    {s.done}/{s.total}
                  </span>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// ─── day 1 readiness ─────────────────────────────────────────

function Day1Readiness() {
  return (
    <ul className="flex flex-col gap-2.5">
      {DAY1_CHECKLIST.map((d) => (
        <li key={d.id} className="flex items-center justify-between gap-2">
          <span className="text-sm">{d.label}</span>
          <StatusBadge tone={d.tone as StatusTone} withDot={false}>
            {d.status}
          </StatusBadge>
        </li>
      ))}
    </ul>
  );
}

// ─── task card ───────────────────────────────────────────────

function TaskCard({ task }: { task: PortalTask }) {
  const isActionable = task.status === "pending" || task.status === "rejected";
  const isRejected = task.status === "rejected";
  const isCompleted = task.status === "completed";
  const isInReview = task.status === "in-review";
  const Icon = CATEGORY_ICON[task.category];

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-colors",
        isRejected && "border-destructive/30 bg-destructive/5",
        isCompleted && "bg-muted/30 opacity-75",
        isInReview && "border-blue-500/20 bg-blue-500/5",
        !isRejected && !isCompleted && !isInReview && "bg-card",
      )}
    >
      <div className="flex items-start gap-3">
        {/* icon */}
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg",
            isCompleted && "bg-success/10 text-success",
            isRejected && "bg-destructive/10 text-destructive",
            isInReview && "bg-blue-500/10 text-blue-500",
            !isRejected && !isCompleted && !isInReview && "bg-muted text-muted-foreground",
          )}
        >
          {isCompleted ? (
            <Check className="size-4" />
          ) : (
            <Icon className="size-4" />
          )}
        </span>

        {/* content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className={cn("text-sm font-medium", isCompleted && "text-muted-foreground")}>
              {task.title}
            </p>
            {isInReview && (
              <StatusBadge tone="info">In review</StatusBadge>
            )}
            {isCompleted && (
              <StatusBadge tone="success">Done</StatusBadge>
            )}
          </div>
          <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
            {task.why}
          </p>

          {/* rejection detail */}
          {isRejected && task.rejectionReason && (
            <div className="mt-3 rounded-lg bg-destructive/10 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="text-destructive mt-0.5 size-3.5 shrink-0" />
                <div>
                  <p className="text-destructive text-xs font-medium mb-1">Why it was rejected</p>
                  <p className="text-destructive/80 text-xs leading-relaxed">{task.rejectionReason}</p>
                </div>
              </div>
              {task.fixSteps && (
                <ul className="mt-2 space-y-0.5 pl-5">
                  {task.fixSteps.map((step, i) => (
                    <li key={i} className="text-destructive/70 text-xs list-disc">{step}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* impact */}
          {task.impact && !isCompleted && !isInReview && (
            <p className="text-muted-foreground mt-1.5 text-xs">
              <span className="font-medium">Why it matters:</span> {task.impact}
            </p>
          )}

          {/* AI hint */}
          {task.aiHint && isActionable && (
            <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-violet-500/8 p-2.5">
              <Bot className="text-violet-500 mt-0.5 size-3.5 shrink-0" />
              <p className="text-violet-600 dark:text-violet-400 text-xs leading-relaxed">
                {task.aiHint}
              </p>
            </div>
          )}

          {/* footer */}
          {!isCompleted && (
            <div className="mt-3 flex items-center gap-3">
              <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                <Clock className="size-3" /> {task.estimate}
              </span>
              <span className="text-muted-foreground text-xs">·</span>
              <span className={cn("text-xs", isRejected ? "text-destructive font-medium" : "text-muted-foreground")}>
                {task.due}
              </span>
              {isActionable && (
                <Link href={`/portal/tasks/${task.id}`} className="ml-auto">
                  <Button
                    size="sm"
                    className={cn("h-7", isRejected && "bg-destructive hover:bg-destructive/90")}
                  >
                    {task.ctaLabel ?? "Start"}
                    <ArrowRight className="size-3.5" />
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── task group ──────────────────────────────────────────────

function TaskGroup({
  title,
  badge,
  badgeTone,
  tasks,
  collapsible,
}: {
  title: string;
  badge?: string | number;
  badgeTone?: StatusTone;
  tasks: PortalTask[];
  collapsible?: boolean;
}) {
  if (tasks.length === 0) return null;
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <h2 className="text-section-heading">{title}</h2>
        {badge !== undefined && (
          <StatusBadge tone={badgeTone ?? "neutral"} withDot={false}>
            {badge}
          </StatusBadge>
        )}
        {collapsible && (
          <ChevronDown className="text-muted-foreground ml-auto size-4" />
        )}
      </div>
      {tasks.map((t) => (
        <TaskCard key={t.id} task={t} />
      ))}
    </div>
  );
}

// ─── communications mini-feed ─────────────────────────────────

function CommsFeed() {
  return (
    <div className="flex flex-col gap-3">
      {COMMS.map((c) => (
        <div key={c.id} className="flex items-start gap-3">
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
              c.type === "ai" || c.type === "reminder"
                ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                : c.type === "system"
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary/10 text-primary",
            )}
          >
            {c.type === "ai" || c.type === "reminder" ? (
              <Bot className="size-3.5" />
            ) : (
              c.from.split(" ").map((n) => n[0]).join("")
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium">{c.from}</span>
              <span className="text-muted-foreground text-[11px]">· {c.time}</span>
            </div>
            <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">{c.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── main page ───────────────────────────────────────────────

export default function PortalPage() {
  const actionRequired = PORTAL_TASKS.filter((t) => t.group === "action-required");
  const upNext = PORTAL_TASKS.filter((t) => t.group === "up-next");
  const inReview = PORTAL_TASKS.filter((t) => t.group === "in-review");
  const done = PORTAL_TASKS.filter((t) => t.group === "completed");
  const remaining = actionRequired.length + upNext.length;

  return (
    <div className="flex flex-col gap-4">
      {/* ── Urgency Banner (when action-required items exist) ── */}
      {actionRequired.length > 0 && (
        <div className="border-destructive/30 bg-destructive/8 rounded-2xl border p-4">
          <div className="flex items-start gap-3">
            <span className="bg-destructive/15 flex size-9 shrink-0 items-center justify-center rounded-full">
              <AlertTriangle className="text-destructive size-4.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-destructive text-sm font-semibold">
                {actionRequired.length === 1
                  ? "1 item needs your attention"
                  : `${actionRequired.length} items need your attention`}
              </p>
              <p className="text-destructive/70 mt-0.5 text-xs leading-relaxed">
                {NEXT_BEST_ACTION.detail}
              </p>
            </div>
          </div>
          <Link href={`/portal/tasks/${NEXT_BEST_ACTION.taskId}`} className="mt-3 block">
            <Button
              size="sm"
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground h-8 w-full sm:w-auto"
            >
              {NEXT_BEST_ACTION.cta} <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* ── Hero ── */}
      <Card>
        <div className="flex items-center gap-4">
          <ProgressRing value={CANDIDATE.progress} label="complete" />
          <div className="min-w-0">
            <p className="text-page-title">Welcome, {CANDIDATE.firstName} 👋</p>
            <p className="text-muted-foreground mt-0.5 text-sm">
              Onboarding for{" "}
              <span className="text-foreground font-medium">{CANDIDATE.role}</span>
              {" "}at{" "}
              <span className="text-foreground font-medium">{CANDIDATE.client}</span>
            </p>
            <p className="text-metadata mt-1">{CANDIDATE.estimatedCompletion}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {/* Start date */}
          <div className="bg-muted/50 rounded-xl p-3">
            <p className="text-data-label flex items-center gap-1">
              <Calendar className="size-3" /> Start date
            </p>
            <p className="mt-1 text-sm font-semibold">{CANDIDATE.startDateLabel}</p>
            <p className="text-metadata">in {CANDIDATE.startInDays} days</p>
          </div>

          {/* Stage */}
          <div className="bg-muted/50 rounded-xl p-3">
            <p className="text-data-label">Stage</p>
            <p className="mt-1 text-sm font-semibold">{CANDIDATE.currentStage}</p>
            <p className="text-metadata">{remaining} left</p>
          </div>

          {/* Contacts */}
          <div className="bg-muted/50 rounded-xl p-3">
            <p className="text-data-label">Your team</p>
            <p className="mt-1 truncate text-sm font-semibold">{CANDIDATE.recruiter.name}</p>
            <p className="text-metadata truncate">{CANDIDATE.onboarder.name}</p>
          </div>
        </div>
      </Card>

      {/* ── Quick Actions launchpad ── */}
      <LaunchpadSection config={LAUNCHPADS.candidate} />

      {/* ── Task feed + right rail ── */}
      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
        {/* Tasks */}
        <div className="flex flex-col gap-5">
          <TaskGroup
            title="Needs your attention"
            badge={actionRequired.length}
            badgeTone="danger"
            tasks={actionRequired}
          />
          <TaskGroup
            title="Up next"
            badge={upNext.length}
            badgeTone="info"
            tasks={upNext}
          />
          <TaskGroup
            title="In review"
            badge={inReview.length}
            badgeTone="neutral"
            tasks={inReview}
          />
          <TaskGroup
            title="Completed"
            badge={done.length}
            badgeTone="success"
            tasks={done}
            collapsible
          />
        </div>

        {/* Right rail */}
        <div className="flex flex-col gap-4">
          {/* Stage progress */}
          <Card>
            <h2 className="text-card-heading mb-3">Your journey</h2>
            <StageTimeline />
          </Card>

          {/* Day 1 readiness */}
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-card-heading">Day 1 readiness</h2>
              <span className="text-muted-foreground text-xs">Jun 15</span>
            </div>
            <Day1Readiness />
            <div className="bg-muted/50 mt-3 rounded-lg px-3 py-2">
              <p className="text-muted-foreground text-xs">
                2 of 5 items ready · On track if tasks completed by Jun 12
              </p>
            </div>
          </Card>

          {/* Your team */}
          <Card>
            <h2 className="text-card-heading mb-3">Your team</h2>
            <div className="flex flex-col gap-3">
              {TEAM.map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                    {m.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-muted-foreground text-xs">{m.role}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="size-7" aria-label="Email">
                      <Mail className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-7" aria-label="Message">
                      <MessageSquare className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ── AI Concierge ── */}
      <Card>
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-500/10">
            <Bot className="text-violet-500 size-4.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">AI Concierge</p>
            <p className="text-muted-foreground text-xs">
              Ask anything about your onboarding, benefits, or start date.
            </p>
          </div>
          <Button variant="outline" size="sm" className="shrink-0">
            Ask AI
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {AI_SUGGESTED_QUESTIONS.map((q, i) => (
            <button
              key={i}
              className="bg-muted hover:bg-muted/70 text-muted-foreground rounded-full px-3 py-1.5 text-xs transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </Card>

      {/* ── Communications ── */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-card-heading">Recent messages</h2>
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            View all
          </Button>
        </div>
        <CommsFeed />
      </Card>
    </div>
  );
}
