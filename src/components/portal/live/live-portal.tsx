/**
 * Live candidate portal home (§5.2 Guided Concierge, §101.1) — rendered from
 * the candidate's real onboarding record. Mobile-first: one column, the next
 * action on top, plain-language statuses.
 */

import Link from "next/link";
import { AlertTriangle, ArrowRight, Calendar, Check, CheckCircle2, ChevronRight, Clock, Mail, PartyPopper, User } from "lucide-react";
import { ProgressRing } from "@/components/portal/progress-ring";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PortalView } from "@/lib/onboarding/service";

type Task = PortalView["tasks"][number];

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("bg-card rounded-2xl border p-4 shadow-xs sm:p-5", className)}>{children}</section>;
}

function TaskRow({ t }: { t: Task }) {
  const tone =
    t.status === "done" ? "bg-success-muted text-success-muted-foreground" : t.rejection ? "bg-danger-muted text-danger-muted-foreground" : t.status === "review" ? "bg-info-muted text-info-muted-foreground" : "bg-warning-muted text-warning-muted-foreground";
  return (
    <li>
      <Link href={t.href} className="hover:bg-muted/50 focus-visible:ring-ring flex items-center gap-3 rounded-xl px-2 py-2.5 focus-visible:ring-2 focus-visible:outline-none">
        <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", t.status === "done" ? "bg-success-muted text-success-muted-foreground" : "bg-muted text-muted-foreground")}>
          {t.status === "done" ? <Check className="size-4" /> : <Clock className="size-4" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{t.title}</span>
          {t.rejection ? (
            <span className="text-danger-muted-foreground block text-xs">Fix needed: {t.rejection}</span>
          ) : (
            <span className="text-muted-foreground block truncate text-xs">{t.status === "action" ? `${t.estimate} · ${t.why}` : t.why}</span>
          )}
        </span>
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", tone)}>{t.statusLabel}</span>
        <ChevronRight className="text-muted-foreground size-4 shrink-0" />
      </Link>
    </li>
  );
}

export function LivePortal({ view }: { view: PortalView }) {
  const todo = view.tasks.filter((t) => t.status === "action");
  const review = view.tasks.filter((t) => t.status === "review");
  const done = view.tasks.filter((t) => t.status === "done");
  const next = todo.find((t) => t.rejection) ?? todo[0];
  const days = view.daysToStart;
  const startLabel = view.startDate ? view.startDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "To be confirmed";

  return (
    <div className="flex flex-col gap-4">
      {view.placed ? (
        <Card className="border-success/30 bg-success-muted/40 text-center">
          <PartyPopper className="text-success-muted-foreground mx-auto size-8" />
          <h1 className="text-page-title mt-2">You&apos;re all set, {view.firstName}!</h1>
          <p className="text-muted-foreground mt-1 text-sm">Everything is complete. Welcome to {view.client} — see you on {startLabel}.</p>
        </Card>
      ) : (
        <Card>
          <div className="flex items-center gap-4">
            <ProgressRing value={view.progress} size={76} stroke={8} />
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs">Welcome, {view.firstName}</p>
              <h1 className="text-lg leading-tight font-semibold">{view.role}</h1>
              <p className="text-muted-foreground text-sm">{view.client}</p>
              <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="size-3.5" /> Starts {startLabel}
                  {days !== null && days >= 0 && ` · ${days} day${days === 1 ? "" : "s"}`}
                </span>
                {todo.length > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5" /> ~{view.minutesLeft} min left
                  </span>
                )}
              </p>
            </div>
          </div>
          {next ? (
            <div className={cn("mt-4 rounded-xl p-3", next.rejection ? "bg-danger-muted/60" : "bg-primary/5")}>
              <p className={cn("flex items-center gap-1.5 text-xs font-medium", next.rejection ? "text-danger-muted-foreground" : "text-primary")}>
                {next.rejection ? <AlertTriangle className="size-3.5" /> : <ArrowRight className="size-3.5" />}
                {next.rejection ? "Needs your attention" : "Your next step"}
              </p>
              <p className="mt-1 text-sm font-semibold">{next.title}</p>
              <p className="text-muted-foreground text-xs">{next.rejection ?? next.why}</p>
              <Button className="mt-3 w-full sm:w-auto" nativeButton={false} render={<Link href={next.href} />}>
                {next.rejection ? "Fix it now" : "Start"} <ArrowRight className="size-4" />
              </Button>
            </div>
          ) : (
            <div className="bg-info-muted/60 text-info-muted-foreground mt-4 rounded-xl p-3 text-sm">
              Nothing for you to do right now — your team is reviewing what you sent. We&apos;ll let you know if anything else is needed.
            </div>
          )}
        </Card>
      )}

      {todo.length > 0 && (
        <Card>
          <h2 className="text-section-heading mb-1">To do · {todo.length}</h2>
          <ul className="-mx-2">{todo.map((t) => <TaskRow key={t.id} t={t} />)}</ul>
        </Card>
      )}
      {review.length > 0 && (
        <Card>
          <h2 className="text-section-heading mb-1">In review · {review.length}</h2>
          <p className="text-muted-foreground mb-1 text-xs">No action needed — your onboarding specialist or our partners are on it.</p>
          <ul className="-mx-2">{review.map((t) => <TaskRow key={t.id} t={t} />)}</ul>
        </Card>
      )}

      <Card>
        <h2 className="text-section-heading mb-3">Your progress</h2>
        <ol className="flex flex-col gap-2">
          {view.stages.map((s) => (
            <li key={s.label} className="flex items-center gap-3 text-sm">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
                  s.state === "completed" && "bg-success border-success text-white",
                  s.state === "current" && "border-primary text-primary bg-primary/10",
                  s.state === "upcoming" && "text-muted-foreground",
                )}
              >
                {s.state === "completed" ? <Check className="size-3.5" /> : ""}
              </span>
              <span className={cn(s.state === "upcoming" && "text-muted-foreground", s.state === "current" && "font-semibold")}>{s.label}</span>
              {s.state === "current" && <span className="text-primary ml-auto text-xs">You are here</span>}
            </li>
          ))}
        </ol>
      </Card>

      <Card>
        <h2 className="text-section-heading mb-3">Day 1 readiness</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {view.day1.map((d) => (
            <li key={d.label} className="flex items-center gap-2 text-sm">
              {d.ok ? <CheckCircle2 className="text-success-muted-foreground size-4" /> : <Clock className="text-warning-muted-foreground size-4" />}
              <span className={cn(!d.ok && "text-muted-foreground")}>{d.label}</span>
              <span className="sr-only">{d.ok ? "done" : "pending"}</span>
            </li>
          ))}
        </ul>
      </Card>

      {done.length > 0 && (
        <Card>
          <details>
            <summary className="text-section-heading cursor-pointer">Completed · {done.length}</summary>
            <ul className="-mx-2 mt-2">{done.map((t) => <TaskRow key={t.id} t={t} />)}</ul>
          </details>
        </Card>
      )}

      {view.messages.length > 0 && (
        <Card>
          <h2 className="text-section-heading mb-3">Messages</h2>
          <ul className="flex flex-col gap-3">
            {view.messages.map((m) => (
              <li key={m.id} className="flex gap-3">
                <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full">
                  <Mail className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{m.subject}</p>
                  <p className="text-muted-foreground text-xs leading-relaxed">{m.body}</p>
                  <p className="text-muted-foreground/70 mt-0.5 text-[11px]">
                    {m.from} · {m.at.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {view.team.length > 0 && (
        <Card>
          <h2 className="text-section-heading mb-3">Your team</h2>
          <ul className="flex flex-col gap-2">
            {view.team.map((p) => (
              <li key={p.name} className="flex items-center gap-3 text-sm">
                <span className="bg-muted flex size-8 items-center justify-center rounded-full">
                  <User className="size-4" />
                </span>
                <span className="font-medium">{p.name}</span>
                <span className="text-muted-foreground text-xs">{p.role}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
