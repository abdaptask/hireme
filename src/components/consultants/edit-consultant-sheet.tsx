"use client";

/**
 * Consultant 360 — inline edit affordance.
 *
 * Opens a right-side Sheet pre-populated with the consultant's current values,
 * sends only changed fields to the server action, and lets revalidatePath
 * refresh the page on success (§9 inline editing, §15 360 record, §100).
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
  updateConsultantAction,
  type UpdateConsultantInput,
} from "@/lib/actions/update-consultant";
import type {
  ConsultantStatus,
  EmploymentType,
} from "@/generated/prisma/enums";

// ─── Types ───────────────────────────────────────────────────

/** Minimal shape the sheet needs — matches DbConsultantFull's relevant fields. */
type EditableConsultant = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  title: string | null;
  status: ConsultantStatus;
  employmentType: EmploymentType | null;
  billRate: number | null;
  payRate: number | null;
  startDate: Date | null;
  endDate: Date | null;
  location: string | null;
  notes: string | null;
};

// ─── Constants ───────────────────────────────────────────────

const STATUS_OPTIONS: { value: ConsultantStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "BENCH", label: "Bench" },
  { value: "EXTENSION_PENDING", label: "Extension Pending" },
  { value: "OFFBOARDING", label: "Offboarding" },
  { value: "CONVERTED", label: "Converted" },
  { value: "FORMER", label: "Former" },
  { value: "INELIGIBLE", label: "Ineligible" },
];

const EMPLOYMENT_OPTIONS: { value: EmploymentType; label: string }[] = [
  { value: "W2", label: "W-2" },
  { value: "INDEPENDENT_1099", label: "1099" },
  { value: "C2C", label: "C2C" },
];

// Native <select> styled to match Input.
const SELECT_CLASS =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30";

// ─── Helpers ─────────────────────────────────────────────────

function dateToInputValue(d: Date | null | undefined): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

// ─── Component ───────────────────────────────────────────────

type Props = {
  consultant: EditableConsultant;
};

export function EditConsultantSheet({ consultant }: Props) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  // Form state — initialised from the consultant prop. Reset whenever the
  // sheet opens by re-keying the inner form component below.
  const [form, setForm] = React.useState(() => initialForm(consultant));

  const set = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleOpenChange = (next: boolean) => {
    if (next) {
      // Re-snapshot from the latest prop every time the user opens the sheet.
      setForm(initialForm(consultant));
      setError(null);
    }
    setOpen(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload: UpdateConsultantInput = { id: consultant.id };
    // Only include fields that changed.
    if (form.firstName !== consultant.firstName)
      payload.firstName = form.firstName;
    if (form.lastName !== consultant.lastName)
      payload.lastName = form.lastName;
    if (form.email !== consultant.email) payload.email = form.email;
    if (form.phone !== (consultant.phone ?? ""))
      payload.phone = form.phone || null;
    if (form.title !== (consultant.title ?? ""))
      payload.title = form.title || null;
    if (form.status !== consultant.status) payload.status = form.status;
    if (form.employmentType !== (consultant.employmentType ?? "")) {
      payload.employmentType =
        form.employmentType === ""
          ? null
          : (form.employmentType as EmploymentType);
    }
    if (form.location !== (consultant.location ?? ""))
      payload.location = form.location || null;
    if (form.notes !== (consultant.notes ?? ""))
      payload.notes = form.notes || null;

    const billRateNum = form.billRate === "" ? null : Number(form.billRate);
    if (billRateNum !== consultant.billRate) payload.billRate = billRateNum;
    const payRateNum = form.payRate === "" ? null : Number(form.payRate);
    if (payRateNum !== consultant.payRate) payload.payRate = payRateNum;

    const startDateInitial = dateToInputValue(consultant.startDate);
    if (form.startDate !== startDateInitial)
      payload.startDate = form.startDate || null;
    const endDateInitial = dateToInputValue(consultant.endDate);
    if (form.endDate !== endDateInitial)
      payload.endDate = form.endDate || null;

    startTransition(async () => {
      const result = await updateConsultantAction(payload);
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
          <SheetTitle>Edit consultant</SheetTitle>
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
                <Field label="Location" span2>
                  <Input
                    value={form.location}
                    onChange={(e) => set("location", e.target.value)}
                    placeholder="City, state or remote"
                  />
                </Field>
              </Grid2>
            </Section>

            {/* Assignment */}
            <Section title="Assignment">
              <Grid2>
                <Field label="Title / Role" span2>
                  <Input
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                  />
                </Field>
                <Field label="Status">
                  <select
                    className={SELECT_CLASS}
                    value={form.status}
                    onChange={(e) =>
                      set("status", e.target.value as ConsultantStatus)
                    }
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
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
                <Field label="Start date">
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => set("startDate", e.target.value)}
                  />
                </Field>
                <Field label="End date">
                  <Input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => set("endDate", e.target.value)}
                  />
                </Field>
              </Grid2>
            </Section>

            {/* Rates */}
            <Section title="Rates">
              <Grid2>
                <Field label="Bill rate ($/hr)">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.billRate}
                    onChange={(e) => set("billRate", e.target.value)}
                  />
                </Field>
                <Field label="Pay rate ($/hr)">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.payRate}
                    onChange={(e) => set("payRate", e.target.value)}
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
                placeholder="Add internal notes about this consultant…"
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

function initialForm(c: EditableConsultant) {
  return {
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    phone: c.phone ?? "",
    title: c.title ?? "",
    status: c.status,
    employmentType: (c.employmentType ?? "") as "" | EmploymentType,
    billRate: c.billRate === null ? "" : String(c.billRate),
    payRate: c.payRate === null ? "" : String(c.payRate),
    startDate: dateToInputValue(c.startDate),
    endDate: dateToInputValue(c.endDate),
    location: c.location ?? "",
    notes: c.notes ?? "",
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
  span2,
}: {
  label: string;
  children: React.ReactNode;
  span2?: boolean;
}) {
  return (
    <label className={cn("flex flex-col gap-1", span2 && "col-span-2")}>
      <span className="text-muted-foreground text-xs font-medium">{label}</span>
      {children}
    </label>
  );
}
