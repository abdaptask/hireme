import type { Metadata } from "next";
import {
  ArrowRight,
  Calendar,
  Check,
  CircleAlert,
  Clock,
  Headset,
  MessageSquare,
} from "lucide-react";
import { ProgressRing } from "@/components/portal/progress-ring";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { StatusTone } from "@/lib/types";
import {
  CANDIDATE,
  DAY1_CHECKLIST,
  NEXT_BEST_ACTION,
  PORTAL_STAGES,
  PORTAL_TASKS,
  type PortalTask,
} from "@/lib/portal-data";

export const metadata: Metadata = { title: "Your Onboarding" };

const TASK_STATUS: Record<
  PortalTask["status"],
  { tone: StatusTone; label: string }
> = {
  completed: { tone: "success", label: "Completed" },
  pending: { tone: "info", label: "To do" },
  "in-review": { tone: "info", label: "In review" },
  rejected: { tone: "danger", label: "Needs fix" },
};

function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("bg-card rounded-2xl border p-5 shadow-xs", className)}>
      {children}
    </section>
  );
}

function StageTimeline() {
  return (
    <ol className="flex flex-col">
      {PORTAL_STAGES.map((s, i) => {
        const last = i === PORTAL_STAGES.length - 1;
        return (
          <li key={s.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-semibold",
                  s.state === "completed" &&
                    "bg-primary border-primary text-primary-foreground",
                  s.state === "current" &&
                    "border-primary text-primary ring-primary/20 ring-4",
                  s.state === "upcoming" &&
                    "border-border text-muted-foreground",
                )}
              >
                {s.state === "completed" ? (
                  <Check className="size-3.5" />
                ) : (
                  i + 1
                )}
              </span>
              {!last && (
                <span
                  className={cn(
                    "my-0.5 w-0.5 flex-1",
                    s.state === "completed" ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </div>
            <div className={cn("pb-4", last && "pb-0")}>
              <p
                className={cn(
                  "text-sm leading-6",
                  s.state === "current"
                    ? "font-semibold"
                    : s.state === "upcoming"
                      ? "text-muted-foreground"
                      : "font-medium",
                )}
              >
                {s.label}
              </p>
              {s.state === "current" && (
                <p className="text-primary text-xs">In progress</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function TaskItem({ task }: { task: PortalTask }) {
  const meta = TASK_STATUS[task.status];
  const isActionable = task.status === "pending" || task.status === "rejected";
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        task.status === "rejected"
          ? "border-danger/30 bg-danger-muted/30"
          : "bg-card",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">{task.title}</p>
          <p className="text-muted-foreground mt-0.5 text-xs">{task.why}</p>
        </div>
        <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
      </div>

      {task.rejectionReason && (
        <div className="text-danger-muted-foreground mt-3 flex items-start gap-2 text-xs">
          <CircleAlert className="mt-0.5 size-3.5 shrink-0" />
          <p>{task.rejectionReason}</p>
        </div>
      )}

      <div className="text-muted-foreground mt-3 flex items-center gap-3 text-xs">
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5" /> {task.estimate}
        </span>
        <span>·</span>
        <span>{task.due}</span>
        {isActionable && (
          <Button size="sm" className="ml-auto h-7">
            {task.status === "rejected" ? "Fix now" : "Start"}
            <ArrowRight className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default function PortalPage() {
  const remaining = PORTAL_TASKS.filter(
    (t) => t.status === "pending" || t.status === "rejected",
  ).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Welcome + progress */}
      <Card>
        <div className="flex items-center gap-4">
          <ProgressRing value={CANDIDATE.progress} label="complete" />
          <div className="min-w-0">
            <p className="text-page-title">Welcome, {CANDIDATE.firstName} 👋</p>
            <p className="text-muted-foreground mt-1 text-sm">
              You&apos;re onboarding for{" "}
              <span className="text-foreground font-medium">
                {CANDIDATE.role}
              </span>{" "}
              at{" "}
              <span className="text-foreground font-medium">
                {CANDIDATE.client}
              </span>
              .
            </p>
            <p className="text-metadata mt-1">{CANDIDATE.estimatedCompletion}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-data-label flex items-center gap-1">
              <Calendar className="size-3" /> Start date
            </p>
            <p className="mt-1 text-sm font-semibold">
              {CANDIDATE.startDateLabel}
            </p>
            <p className="text-metadata">in {CANDIDATE.startInDays} days</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-data-label">Current stage</p>
            <p className="mt-1 text-sm font-semibold">
              {CANDIDATE.currentStage}
            </p>
            <p className="text-metadata">{remaining} tasks to go</p>
          </div>
          <div className="bg-muted/50 col-span-2 rounded-lg p-3 sm:col-span-1">
            <p className="text-data-label">Your contacts</p>
            <p className="mt-1 truncate text-sm font-semibold">
              {CANDIDATE.recruiter.name}
            </p>
            <p className="text-metadata truncate">
              {CANDIDATE.onboarder.name} · Onboarding
            </p>
          </div>
        </div>
      </Card>

      {/* Next Best Action (§41.1) */}
      <section className="border-primary/30 bg-primary/5 rounded-2xl border p-5">
        <p className="text-data-label text-primary">Next best action</p>
        <div className="mt-1.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-base font-semibold">{NEXT_BEST_ACTION.title}</p>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {NEXT_BEST_ACTION.detail}
            </p>
          </div>
          <Button className="shrink-0">
            {NEXT_BEST_ACTION.cta}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-[1fr_240px]">
        {/* Tasks */}
        <div className="flex flex-col gap-3">
          <h2 className="text-section-heading">Your tasks</h2>
          {PORTAL_TASKS.map((t) => (
            <TaskItem key={t.id} task={t} />
          ))}
        </div>

        {/* Right rail: stages + day 1 */}
        <div className="flex flex-col gap-4">
          <Card>
            <h2 className="text-card-heading mb-3">Your progress</h2>
            <StageTimeline />
          </Card>

          <Card>
            <h2 className="text-card-heading mb-3">Day 1 readiness</h2>
            <ul className="flex flex-col gap-2.5">
              {DAY1_CHECKLIST.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="text-sm">{d.label}</span>
                  <StatusBadge tone={d.tone} withDot={false}>
                    {d.status}
                  </StatusBadge>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {/* Help (§101.4) */}
      <Card className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="bg-ai-muted text-ai-muted-foreground flex size-10 items-center justify-center rounded-full">
            <Headset className="size-5" />
          </span>
          <div>
            <p className="text-sm font-medium">Need a hand?</p>
            <p className="text-muted-foreground text-xs">
              Ask the AI Concierge or reach your recruiter and onboarder.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <MessageSquare className="size-4" /> Message team
          </Button>
          <Button variant="secondary" size="sm">
            Ask AI
          </Button>
        </div>
      </Card>
    </div>
  );
}
