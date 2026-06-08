"use client";

/**
 * Candidate 360 — inline edit affordance.
 *
 * Opens a right-side Sheet pre-populated with the candidate's current values,
 * sends only changed fields to the server action, and lets revalidatePath
 * refresh the page on success (§9 inline editing, §100 candidate 360, §26 audit).
 */

import * as React from "react";
import { Pencil } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  updateCandidateAction,
  type UpdateCandidateInput,
} from "@/lib/actions/update-candidate";
import type {
  CandidateStatus,
  EmploymentType,
  RiskLevel,
} from "@/generated/prisma/enums";

// ─── Types ───────────────────────────────────────────────────

type EditableCandidate = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: CandidateStatus;
  risk: RiskLevel;
  stage: string | null;
  employmentType: EmploymentType | null;
  workLocation: string | null;
  startDate: Date | null;
  clientName: string | null;
  recruiter: string | null;
  onboarder: string | null;
  vendor: string | null;
  notes: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
};

// ─── Constants ───────────────────────────────────────────────

const STATUS_OPTIONS: { value: CandidateStatus; label: string }[] = [
  { value: "NEW", label: "New" },
  { value: "OFFER_ACCEPTED", label: "Offer accepted" },
  { value: "ONBOARDING", label: "Onboarding" },
  { value: "ACTIVE", label: "Active" },
  { value: "PLACED", label: "Placed" },
  { value: "ON_HOLD", label: "On hold" },
  { value: "WITHDRAWN", label: "Withdrawn" },
  { value: "ARCHIVED", label: "Archived" },
];

const RISK_OPTIONS: { value: RiskLevel; label: string }[] = [
  { value: "ON_TRACK", label: "On track" },
  { value: "NEEDS_ATTENTION", label: "Needs attention" },
  { value: "AT_RISK", label: "At risk" },
  { value: "UNLIKELY", label: "Start unlikely" },
];

const EMPLOYMENT_OPTIONS: { value: EmploymentType; label: string }[] = [
  { value: "W2", label: "W-2" },
  { value: "INDEPENDENT_1099", label: "1099" },
  { value: "C2C", label: "C2C" },
  { value: "FULL_TIME", label: "Full-time" },
  { value: "CONTRACT_TO_HIRE", label: "Contract to hire" },
  { value: "INTERN", label: "Intern" },
];

const SELECT_CLASS =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30";

// ─── Helpers ─────────────────────────────────────────────────

function dateToInputValue(d: Date | null | undefined): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

// ─── Component ───────────────────────────────────────────────

type Props = { candidate: EditableCandidate };

export function EditCandidateSheet({ candidate }: Props) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const [form, setForm] = React.useState(() => initialForm(candidate));

  const set = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setForm(initialForm(candidate));
      setError(null);
    }
    setOpen(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload: UpdateCandidateInput = { id: candidate.id };

    if (form.firstName !== candidate.firstName)
      payload.firstName = form.firstName;
    if (form.lastName !== candidate.lastName)
      payload.lastName = form.lastName;
    if (form.email !== candidate.email) payload.email = form.email;
    if (form.phone !== (candidate.phone ?? ""))
      payload.phone = form.phone || null;
    if (form.status !== candidate.status) payload.status = form.status;
    if (form.risk !== candidate.risk) payload.risk = form.risk;
    if (form.stage !== (candidate.stage ?? ""))
      payload.stage = form.stage || null;
    if (form.employmentType !== (candidate.employmentType ?? "")) {
      payload.employmentType =
        form.employmentType === ""
          ? null
          : (form.employmentType as EmploymentType);
    }
    if (form.workLocation !== (candidate.workLocation ?? ""))
      payload.workLocation = form.workLocation || null;
    if (form.clientName !== (candidate.clientName ?? ""))
      payload.clientName = form.clientName || null;
    if (form.recruiter !== (candidate.recruiter ?? ""))
      payload.recruiter = form.recruiter || null;
    if (form.onboarder !== (candidate.onboarder ?? ""))
      payload.onboarder = form.onboarder || null;
    if (form.vendor !== (candidate.vendor ?? ""))
      payload.vendor = form.vendor || null;
    if (form.notes !== (candidate.notes ?? ""))
      payload.notes = form.notes || null;
    if (form.street !== (candidate.street ?? ""))
      payload.street = form.street || null;
    if (form.city !== (candidate.city ?? ""))
      payload.city = form.city || null;
    if (form.state !== (candidate.state ?? ""))
      payload.state = form.state || null;
    if (form.zip !== (candidate.zip ?? ""))
      payload.zip = form.zip || null;

    const startDateInitial = dateToInputValue(candidate.startDate);
    if (form.startDate !== startDateInitial)
      payload.startDate = form.startDate || null;

    startTransition(async () => {
      const result = await updateCandidateAction(payload);
      if (result.ok) {
        setOpen(false);
      } else {
        setError(result.error ?? "Failed to save changes");
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => handleOpenChange(true)}
      >
        <Pencil className="size-3.5" />
        Edit details
      </Button>

      <SheetContent
        side="right"
        showCloseButton
        style={{ maxWidth: "640px", width: "100%" }}
        className="flex flex-col gap-0 p-0"
      >
        <SheetHeader className="gap-1 border-b px-5 py-4">
          <SheetTitle>Edit candidate</SheetTitle>
          <SheetDescription className="text-xs">
            Changes are recorded in the audit log as field-level diffs.
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {error && (
              <div className="border-destructive/30 bg-destructive/10 text-destructive mb-4 rounded-lg border px-3 py-2 text-xs">
                {error}
              </div>
            )}

            {/* Person */}
            <Section title="Person">
              <Grid2>
                <Field label="First name">
                  <Input
                    value={form.firstName}
                    onChange={(e) => set("firstName", e.target.value)}
                  />
                </Field>
                <Field label="Last name">
                  <Input
                    value={form.lastName}
                    onChange={(e) => set("lastName", e.target.value)}
                  />
                </Field>
                <Field label="Email">
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                  />
                </Field>
                <Field label="Phone">
                  <Input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                  />
                </Field>
              </Grid2>
              <div className="mt-3 grid grid-cols-4 gap-3">
                <Field label="Street" colSpan={4}>
                  <Input
                    value={form.street}
                    onChange={(e) => set("street", e.target.value)}
                  />
                </Field>
                <Field label="City" colSpan={2}>
                  <Input
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                  />
                </Field>
                <Field label="State">
                  <Input
                    value={form.state}
                    onChange={(e) => set("state", e.target.value)}
                    maxLength={20}
                  />
                </Field>
                <Field label="ZIP">
                  <Input
                    value={form.zip}
                    onChange={(e) => set("zip", e.target.value)}
                    maxLength={10}
                  />
                </Field>
              </div>
            </Section>

            {/* Onboarding */}
            <Section title="Onboarding">
              <Grid2>
                <Field label="Status">
                  <select
                    className={SELECT_CLASS}
                    value={form.status}
                    onChange={(e) =>
                      set("status", e.target.value as CandidateStatus)
                    }
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Risk">
                  <select
                    className={SELECT_CLASS}
                    value={form.risk}
                    onChange={(e) =>
                      set("risk", e.target.value as RiskLevel)
                    }
                  >
                    {RISK_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Stage">
                  <Input
                    value={form.stage}
                    onChange={(e) => set("stage", e.target.value)}
                  />
                </Field>
                <Field label="Employment type">
                  <select
                    className={SELECT_CLASS}
                    value={form.employmentType}
                    onChange={(e) =>
                      set(
                        "employmentType",
                        e.target.value as "" | EmploymentType,
                      )
                    }
                  >
                    <option value="">—</option>
                    {EMPLOYMENT_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Work location">
                  <Input
                    value={form.workLocation}
                    onChange={(e) => set("workLocation", e.target.value)}
                  />
                </Field>
                <Field label="Start date">
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => set("startDate", e.target.value)}
                  />
                </Field>
              </Grid2>
            </Section>

            {/* Assignment */}
            <Section title="Assignment">
              <Grid2>
                <Field label="Client name">
                  <Input
                    value={form.clientName}
                    onChange={(e) => set("clientName", e.target.value)}
                  />
                </Field>
                <Field label="Vendor">
                  <Input
                    value={form.vendor}
                    onChange={(e) => set("vendor", e.target.value)}
                  />
                </Field>
                <Field label="Recruiter">
                  <Input
                    value={form.recruiter}
                    onChange={(e) => set("recruiter", e.target.value)}
                  />
                </Field>
                <Field label="Onboarder">
                  <Input
                    value={form.onboarder}
                    onChange={(e) => set("onboarder", e.target.value)}
                  />
                </Field>
              </Grid2>
            </Section>

            {/* Notes */}
            <Section title="Notes">
              <Textarea
                rows={4}
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Add internal notes about this candidate…"
              />
            </Section>
          </div>

          <div className="flex items-center justify-end gap-2 border-t px-5 py-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ─── Form shape helper ──────────────────────────────────────

function initialForm(c: EditableCandidate) {
  return {
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    phone: c.phone ?? "",
    status: c.status,
    risk: c.risk,
    stage: c.stage ?? "",
    employmentType: (c.employmentType ?? "") as "" | EmploymentType,
    workLocation: c.workLocation ?? "",
    startDate: dateToInputValue(c.startDate),
    clientName: c.clientName ?? "",
    recruiter: c.recruiter ?? "",
    onboarder: c.onboarder ?? "",
    vendor: c.vendor ?? "",
    notes: c.notes ?? "",
    street: c.street ?? "",
    city: c.city ?? "",
    state: c.state ?? "",
    zip: c.zip ?? "",
  };
}

// ─── Layout primitives ──────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-5">
      <h3 className="text-data-label mb-2 text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

function Field({
  label,
  children,
  colSpan,
}: {
  label: string;
  children: React.ReactNode;
  colSpan?: 2 | 3 | 4;
}) {
  return (
    <label
      className={cn(
        "flex flex-col gap-1",
        colSpan === 2 && "col-span-2",
        colSpan === 3 && "col-span-3",
        colSpan === 4 && "col-span-4",
      )}
    >
      <span className="text-muted-foreground text-xs font-medium">{label}</span>
      {children}
    </label>
  );
}
