"use client";

/* ---------------------------------------------------------------------------
   New Hire Request on the Candidate 360 (§9, §25):
   - NhrApprovalBanner — exception held for Super Admin approval
   - NhrEditSheet — Recruiting Manager edits team / contacts / job after submit
   --------------------------------------------------------------------------- */

import { useState, useTransition } from "react";
import {
  AlertCircle,
  Check,
  Loader2,
  Pencil,
  ShieldAlert,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  decideNhrExceptionAction,
  updateNhrAction,
} from "@/lib/actions/onboarding";
import { TIME_TEMPLATE_OPTIONS } from "@/lib/onboarding/nhr";

const inputCls =
  "bg-background h-9 w-full rounded-md border px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

// ── Approval banner ──────────────────────────────────────

export type NhrApprovalInfo = {
  status: "pending" | "approved" | "rejected" | "not-required";
  exceptions: string[];
  reason: string | null;
  submittedBy: string;
  decidedBy: string | null;
  decidedAt: string | null;
  note: string | null;
};

export function NhrApprovalBanner({
  candidateId,
  info,
  canApprove,
}: {
  candidateId: string;
  info: NhrApprovalInfo;
  canApprove: boolean;
}) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (info.status === "not-required") return null;

  const decide = (decision: "approve" | "reject") => {
    setError(null);
    start(async () => {
      const res = await decideNhrExceptionAction(candidateId, decision, note);
      if (!res.ok) setError(res.error);
    });
  };

  if (info.status !== "pending") {
    const ok = info.status === "approved";
    return (
      <section
        className={cn(
          "mt-5 rounded-xl border p-4 text-sm",
          ok
            ? "bg-success-muted/40 border-success/30"
            : "bg-danger-muted/40 border-danger/30",
        )}
      >
        <p className="font-medium">
          {ok ? "NHR exception approved" : "NHR rejected"} by {info.decidedBy}
          {info.decidedAt ? ` · ${info.decidedAt}` : ""}
        </p>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {info.exceptions.join("; ")}
          {info.note ? ` — "${info.note}"` : ""}
        </p>
      </section>
    );
  }

  return (
    <section className="border-warning/40 bg-warning-muted/40 mt-5 rounded-xl border p-4">
      <div className="flex items-start gap-3">
        <ShieldAlert className="text-warning-muted-foreground mt-0.5 size-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-card-heading">Waiting for Super Admin approval</p>
          <ul className="text-warning-muted-foreground mt-1 list-disc pl-5 text-sm">
            {info.exceptions.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <p className="mt-2 text-sm">
            <span className="text-muted-foreground">
              Reason from {info.submittedBy}:{" "}
            </span>
            {info.reason}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            No checklist or candidate invite goes out until this is approved.
          </p>
          {canApprove ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                className={cn(inputCls, "max-w-md flex-1")}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Note (required to reject)"
              />
              <Button
                size="sm"
                disabled={pending}
                onClick={() => decide("approve")}
              >
                {pending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}{" "}
                Approve & release onboarding
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={pending}
                onClick={() => decide("reject")}
              >
                <X className="size-3.5" /> Reject
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground mt-2 text-xs">
              Only a Super Admin can approve this exception.
            </p>
          )}
          {error && (
            <p
              role="alert"
              className="text-danger-muted-foreground mt-2 flex items-center gap-1.5 text-xs"
            >
              <AlertCircle className="size-3.5" /> {error}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Edit sheet ───────────────────────────────────────────

export type NhrEditValues = {
  accountExecutive: string;
  recruiter: string;
  recruitingManager: string;
  onboarder: string;
  jobTitle: string;
  jobId: string;
  directManager: string;
  invoicingContact: string;
  timeTemplate: string;
  endDate: string;
  remarks: string;
  specialTerms: string;
};

export type NhrEditOptions = {
  accountExecutives: string[];
  recruiters: string[];
  recruitingManagers: string[];
  onboarders: string[];
  contacts: { name: string; title: string }[];
};

function withCurrent(list: string[], current: string) {
  return current && !list.includes(current) ? [current, ...list] : list;
}

export function NhrEditSheet({
  candidateId,
  values,
  options,
}: {
  candidateId: string;
  values: NhrEditValues;
  options: NhrEditOptions;
}) {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState(values);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<number | null>(null);
  const [pending, start] = useTransition();
  const set = (k: keyof NhrEditValues, val: string) =>
    setV((p) => ({ ...p, [k]: val }));

  const select = (k: keyof NhrEditValues, label: string, list: string[]) => (
    <label className="flex flex-col gap-1">
      <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
        {label}
      </span>
      <select
        className={inputCls}
        value={v[k]}
        onChange={(e) => set(k, e.target.value)}
      >
        <option value="">Select…</option>
        {withCurrent(list, v[k]).map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
  const text = (k: keyof NhrEditValues, label: string, type = "text") => (
    <label className="flex flex-col gap-1">
      <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
        {label}
      </span>
      <input
        className={inputCls}
        type={type}
        value={v[k]}
        onChange={(e) => set(k, e.target.value)}
      />
    </label>
  );
  const contactNames = options.contacts.map((c) => c.name);

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setV(values);
          setError(null);
          setSaved(null);
        }
      }}
    >
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setOpen(true)}
      >
        <Pencil className="size-3.5" /> Edit NHR
      </Button>
      <SheetContent
        side="right"
        showCloseButton
        style={{ maxWidth: "560px", width: "100%" }}
        className="flex flex-col gap-0 p-0"
      >
        <SheetHeader className="gap-1 border-b px-5 py-4">
          <SheetTitle>Edit New Hire Request</SheetTitle>
          <SheetDescription className="text-xs">
            Every change is recorded in the audit log with the previous and new
            value. Rates and start date changes go through approval and
            aren&apos;t edited here.
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            start(async () => {
              const res = await updateNhrAction(candidateId, v);
              if (!res.ok) setError(res.error);
              else setSaved(res.data?.changed ?? 0);
            });
          }}
        >
          <div className="grid flex-1 grid-cols-1 content-start gap-3 overflow-y-auto px-5 py-4 sm:grid-cols-2">
            <p className="text-card-heading sm:col-span-2">Team</p>
            {select(
              "accountExecutive",
              "Account Executive",
              options.accountExecutives,
            )}
            {select("recruiter", "Recruiter", options.recruiters)}
            {select(
              "recruitingManager",
              "Recruiting Manager",
              options.recruitingManagers,
            )}
            {select("onboarder", "Onboarder", options.onboarders)}
            <p className="text-card-heading mt-2 sm:col-span-2">Project</p>
            {text("jobTitle", "Job Name")}
            {text("jobId", "Job Id #")}
            {select(
              "directManager",
              "Direct Manager / HR Contact",
              contactNames,
            )}
            {select("invoicingContact", "Invoicing Contact", contactNames)}
            {select("timeTemplate", "Time Template", TIME_TEMPLATE_OPTIONS)}
            {text("endDate", "Est. End Date", "date")}
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
                Remarks
              </span>
              <textarea
                className={cn(inputCls, "h-20 py-2")}
                value={v.remarks}
                onChange={(e) => set("remarks", e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
                Special Terms / Exceptions
              </span>
              <textarea
                className={cn(inputCls, "h-20 py-2")}
                value={v.specialTerms}
                onChange={(e) => set("specialTerms", e.target.value)}
              />
            </label>
          </div>
          <div className="flex flex-col gap-2 border-t px-5 py-3">
            {error && (
              <p
                role="alert"
                className="bg-danger-muted text-danger-muted-foreground rounded-md px-3 py-2 text-xs"
              >
                {error}
              </p>
            )}
            {saved !== null && (
              <p className="bg-success-muted text-success-muted-foreground rounded-md px-3 py-2 text-xs">
                {saved
                  ? `Saved ${saved} change${saved > 1 ? "s" : ""} — recorded in the audit log.`
                  : "No changes to save."}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}{" "}
                Save changes
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
