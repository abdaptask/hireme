"use client";

/* ---------------------------------------------------------------------------
   Onboarder checklist & review (§5.3, §6 action center, §16 gates, §113).
   Every item from the auto-assembled package, grouped by who is on the hook,
   with the inline actions that move it forward.
   --------------------------------------------------------------------------- */

import { useState, useTransition } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ExternalLink,
  FileText,
  Laptop,
  Loader2,
  PartyPopper,
  ShieldCheck,
  Sparkles,
  Wallet,
  GraduationCap,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  advanceEquipmentAction,
  completeBillingAction,
  confirmStartAction,
  recordScreeningAction,
  reviewDocumentAction,
  type ActionResult,
} from "@/lib/actions/onboarding";
import type { ChecklistRow } from "@/lib/onboarding/service";

const KIND_ICON = {
  document: FileText,
  screening: ShieldCheck,
  training: GraduationCap,
  equipment: Laptop,
  payroll: Wallet,
  billing: Receipt,
} as const;

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Waiting on candidate",
  SUBMITTED: "Ready for review",
  AI_REVIEW: "Ready for review",
  APPROVED: "Approved",
  REJECTED: "Rejected — resubmission requested",
  CORRECTION_REQUIRED: "Correction requested",
  INVITED: "Awaiting consent",
  ORDERED: "Awaiting consent",
  IN_PROGRESS: "In progress with vendor",
  CLEAR: "Clear",
  REVIEW_REQUIRED: "Adjudication required",
  ASSIGNED: "Assigned",
  STARTED: "Started",
  COMPLETED: "Completed",
  FAILED: "Failed — retake",
  REQUESTED: "Requested",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered — awaiting confirmation",
  ENROLLED: "Received & enrolled",
  READY: "Ready",
  NOT_READY: "Not ready",
};

function tone(row: ChecklistRow): string {
  if (row.done) return "bg-success-muted text-success-muted-foreground";
  if (
    ["REJECTED", "CORRECTION_REQUIRED", "FAILED", "REVIEW_REQUIRED"].includes(
      row.status,
    )
  )
    return "bg-danger-muted text-danger-muted-foreground";
  if (row.actions.length) return "bg-info-muted text-info-muted-foreground";
  return "bg-warning-muted text-warning-muted-foreground";
}

const EQUIP_LABEL: Record<string, string> = {
  REQUESTED: "Approve request",
  APPROVED: "Mark shipped",
  ASSIGNED: "Mark shipped",
  SHIPPED: "Mark delivered",
};

function Row({
  row,
  candidateId,
  run,
}: {
  row: ChecklistRow;
  candidateId: string;
  run: (fn: () => Promise<ActionResult<unknown>>) => void;
}) {
  const [mode, setMode] = useState<"correction" | "reject" | "billing" | null>(
    null,
  );
  const [reason, setReason] = useState("");
  const [billing, setBilling] = useState({
    poNumber: "",
    costCenter: "",
    clientWorkerId: "",
    vmsWorkerId: "",
  });
  const Icon = KIND_ICON[row.kind];

  return (
    <li className="flex flex-col gap-2 px-4 py-3">
      <div className="flex flex-wrap items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
            row.done
              ? "bg-success-muted text-success-muted-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          {row.done ? (
            <Check className="size-4" />
          ) : (
            <Icon className="size-4" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{row.label}</p>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-medium",
                tone(row),
              )}
            >
              {STATUS_LABEL[row.status] ?? row.status}
            </span>
            {row.aiScore !== null && row.kind === "document" && (
              <span
                className={cn(
                  "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]",
                  row.aiFlags.length
                    ? "bg-warning-muted text-warning-muted-foreground"
                    : "bg-ai-muted text-ai-muted-foreground",
                )}
              >
                <Sparkles className="size-3" /> AI {row.aiScore}
                {row.aiFlags.length > 0 && ` · ${row.aiFlags.join(", ")}`}
              </span>
            )}
          </div>
          {row.detail && (
            <p className="text-muted-foreground mt-0.5 text-xs">{row.detail}</p>
          )}
          {row.reason && (
            <p className="text-muted-foreground/80 mt-0.5 text-[11px] italic">
              Why: {row.reason}
            </p>
          )}
        </div>
        <div className="flex basis-full flex-wrap items-center gap-1.5 pl-11 empty:hidden">
          {row.fileUrl && (
            <Button
              size="sm"
              variant="ghost"
              nativeButton={false}
              render={<a href={row.fileUrl} target="_blank" rel="noreferrer" />}
            >
              <ExternalLink className="size-3.5" /> View
            </Button>
          )}
          {row.actions.includes("approve") && (
            <Button
              size="sm"
              onClick={() =>
                run(() =>
                  reviewDocumentAction(candidateId, row.id, "approve", ""),
                )
              }
            >
              <Check className="size-3.5" /> Approve
            </Button>
          )}
          {row.actions.includes("correction") && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setMode(mode === "correction" ? null : "correction")
              }
            >
              Request correction
            </Button>
          )}
          {row.actions.includes("reject") && (
            <Button
              size="sm"
              variant="ghost"
              className="text-danger-muted-foreground"
              onClick={() => setMode(mode === "reject" ? null : "reject")}
            >
              Reject
            </Button>
          )}
          {row.actions.includes("clear") && (
            <Button
              size="sm"
              onClick={() =>
                run(() => recordScreeningAction(candidateId, row.id, "CLEAR"))
              }
            >
              Record result: Clear
            </Button>
          )}
          {row.actions.includes("review") && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                run(() =>
                  recordScreeningAction(candidateId, row.id, "REVIEW_REQUIRED"),
                )
              }
            >
              Needs adjudication
            </Button>
          )}
          {row.actions.includes("advance") && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                run(() => advanceEquipmentAction(candidateId, row.id))
              }
            >
              {EQUIP_LABEL[row.status] ?? "Advance"}
            </Button>
          )}
          {row.actions.includes("billing") && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setMode(mode === "billing" ? null : "billing")}
            >
              Complete billing setup
            </Button>
          )}
        </div>
      </div>

      {(mode === "correction" || mode === "reject") && (
        <form
          className="ml-11 flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => reviewDocumentAction(candidateId, row.id, mode, reason));
          }}
        >
          <input
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              mode === "reject"
                ? "Why is it rejected? The candidate sees this."
                : "What should the candidate fix?"
            }
            className="bg-background focus-visible:ring-ring h-8 min-w-72 flex-1 rounded-md border px-2.5 text-sm focus-visible:ring-2 focus-visible:outline-none"
          />
          <Button
            size="sm"
            type="submit"
            variant={mode === "reject" ? "destructive" : "default"}
          >
            {mode === "reject" ? "Reject & notify" : "Send back"}
          </Button>
        </form>
      )}

      {mode === "billing" && (
        <form
          className="ml-11 grid gap-2 sm:grid-cols-5"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => completeBillingAction(candidateId, billing));
          }}
        >
          {(
            [
              ["poNumber", "PO number"],
              ["costCenter", "Cost center"],
              ["clientWorkerId", "Client worker ID"],
              ["vmsWorkerId", "VMS worker ID"],
            ] as const
          ).map(([k, label]) => (
            <label key={k} className="flex flex-col gap-1 text-[11px]">
              <span className="text-muted-foreground">{label}</span>
              <input
                value={billing[k]}
                onChange={(e) =>
                  setBilling({ ...billing, [k]: e.target.value })
                }
                className="bg-background h-8 rounded-md border px-2 text-sm"
              />
            </label>
          ))}
          <Button size="sm" type="submit" className="self-end">
            Save billing setup
          </Button>
        </form>
      )}
    </li>
  );
}

export function ChecklistPanel({
  candidateId,
  rows: allRows,
  progress,
  placed,
  canReview,
  canBilling,
}: {
  candidateId: string;
  rows: ChecklistRow[];
  progress: number;
  placed: boolean;
  /** Onboarder actions: review, screening, equipment, Day 1 (§25). */
  canReview: boolean;
  /** Billing setup (onboarder or account manager). */
  canBilling: boolean;
}) {
  // Only the actions this role may take; other roles see status read-only.
  const rows = allRows.map((r) => ({
    ...r,
    actions: r.actions.filter((a) =>
      a === "billing" ? canBilling : canReview,
    ),
  }));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<ActionResult<unknown>>) => {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error);
    });
  };

  // Bucket by whether staff action is pending at all — independent of this viewer's rights.
  const staffPending = new Set(
    allRows.filter((r) => r.actions.length).map((r) => r.id),
  );
  const groups: { title: string; hint: string; rows: ChecklistRow[] }[] = [
    {
      title:
        canReview || canBilling
          ? "Needs your action"
          : "Needs onboarder action",
      hint: "Review submissions, record results, move provisioning forward.",
      rows: rows.filter((r) => !r.done && staffPending.has(r.id)),
    },
    {
      title: "Waiting on candidate",
      hint: "They see these in their portal with instructions.",
      rows: rows.filter(
        (r) => !r.done && !staffPending.has(r.id) && r.owner === "Candidate",
      ),
    },
    {
      title: "Waiting on others",
      hint: "Vendors, IT, and readiness gates that follow from the items above.",
      rows: rows.filter(
        (r) => !r.done && !staffPending.has(r.id) && r.owner !== "Candidate",
      ),
    },
    { title: "Done", hint: "", rows: rows.filter((r) => r.done) },
  ];
  const done = rows.filter((r) => r.done).length;

  return (
    <div className="flex flex-col gap-4" aria-busy={pending}>
      <div className="bg-card flex flex-wrap items-center gap-3 rounded-xl border p-4 shadow-xs">
        <div className="min-w-0 flex-1">
          <p className="text-card-heading">
            {placed
              ? "Fully onboarded"
              : progress === 100
                ? "Everything is complete"
                : `${done} of ${rows.length} items complete`}
          </p>
          <p className="text-muted-foreground text-xs">
            {placed
              ? "Day 1 confirmed — the consultant is active."
              : progress === 100
                ? "Confirm the start to move them to active."
                : "Compliance, payroll, and billing must all be ready before Day 1 (§16)."}
          </p>
        </div>
        {pending && (
          <Loader2
            className="text-muted-foreground size-4 animate-spin"
            aria-label="Saving"
          />
        )}
        {!placed && canReview && (
          <Button
            disabled={progress < 100 || pending}
            onClick={() => run(() => confirmStartAction(candidateId))}
          >
            {progress === 100 ? (
              <PartyPopper className="size-4" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}{" "}
            Confirm Day 1 start
          </Button>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="bg-danger-muted text-danger-muted-foreground flex items-start gap-2 rounded-lg px-3 py-2 text-sm"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}
        </p>
      )}

      {groups.map((g) =>
        g.rows.length ? (
          <section
            key={g.title}
            className="bg-card rounded-xl border shadow-xs"
          >
            <div className="flex items-baseline gap-2 border-b px-4 py-2.5">
              <h3 className="text-card-heading">{g.title}</h3>
              <span className="text-muted-foreground text-xs tabular-nums">
                {g.rows.length}
              </span>
              {g.hint && (
                <span className="text-muted-foreground ml-auto hidden text-xs sm:inline">
                  {g.hint}
                </span>
              )}
            </div>
            <ul className={cn("divide-y", pending && "opacity-70")}>
              {g.rows.map((r) => (
                <Row key={r.id} row={r} candidateId={candidateId} run={run} />
              ))}
            </ul>
          </section>
        ) : null,
      )}
    </div>
  );
}
