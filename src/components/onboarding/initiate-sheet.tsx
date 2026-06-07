"use client";

/**
 * Initiate Onboarding — multi-step slide-over sheet (§9 Package Creation,
 * §14 Full Lifecycle). Directly mirrors the ApTask "New Consultant" form fields
 * mapped into HireMe's design language across 5 structured steps.
 *
 * Usage:
 *   <InitiateOnboardingSheet prefill={{ firstName: "James", ... }} />
 *   <InitiateOnboardingSheet trigger={<Button>New Onboarding</Button>} />
 */

import * as React from "react";
import {
  Check,
  ChevronRight,
  Plus,
  Sparkles,
  Trash2,
  UserSearch,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type OnboardingFormData,
  type AssignedMember,
  emptyFormData,
  US_STATES,
  WORK_AUTH_OPTIONS,
  PAY_TERM_OPTIONS,
  SOURCED_FROM_OPTIONS,
  JOB_CATEGORIES,
  ONBOARDING_STATUSES,
  ONBOARDING_SUB_STATUSES,
  WORK_STATUSES,
  GENDER_OPTIONS,
  CLIENT_OPTIONS,
  VENDOR_OPTIONS,
  ASSIGN_ROLES,
  TEAM_MEMBERS,
  CURRENCY_OPTIONS,
  RATE_TYPE_OPTIONS,
  STEP_LABELS,
  TOTAL_STEPS,
} from "@/lib/onboarding-form";

// ---------------------------------------------------------------------------
// Shared field primitives
// ---------------------------------------------------------------------------

const inputCls =
  "h-8 w-full rounded-md border border-input bg-background px-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-muted-foreground/60";

const selectCls = cn(
  inputCls,
  "appearance-none cursor-pointer pr-6 bg-[image:none]",
);

function Lbl({
  children,
  required,
  htmlFor,
}: {
  children: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
    >
      {children}
      {required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Lbl required={required}>{label}</Lbl>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="col-span-full mb-1 border-b pb-1.5 text-xs font-semibold text-foreground/80">
      {children}
    </h3>
  );
}

// ---------------------------------------------------------------------------
// Step-dot indicator
// ---------------------------------------------------------------------------

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {STEP_LABELS.map((label, i) => (
        <span
          key={label}
          title={label}
          className={cn(
            "size-1.5 rounded-full transition-colors",
            i + 1 < current
              ? "bg-primary/50"
              : i + 1 === current
                ? "bg-primary"
                : "bg-muted-foreground/25",
          )}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Employment-type toggle (persists across all steps in header)
// ---------------------------------------------------------------------------

function EmploymentToggle({
  value,
  onChange,
}: {
  value: OnboardingFormData["employmentType"];
  onChange: (v: OnboardingFormData["employmentType"]) => void;
}) {
  const opts: { v: OnboardingFormData["employmentType"]; label: string }[] = [
    { v: "contract", label: "Contract" },
    { v: "full-time", label: "Full Time" },
    { v: "employee", label: "Employee" },
  ];
  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-muted/60 p-0.5">
      {opts.map(({ v, label }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            "rounded-md px-3 py-1 text-xs font-medium transition-all",
            value === v
              ? "bg-background shadow-xs text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Candidate Info
// ---------------------------------------------------------------------------

function Step1({
  data,
  set,
}: {
  data: OnboardingFormData;
  set: (k: keyof OnboardingFormData, v: unknown) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-3">
      {/* Email row */}
      <Field label="Candidate Email" required className="sm:col-span-2">
        <div className="flex gap-1.5">
          <input
            type="email"
            className={cn(inputCls, "flex-1")}
            placeholder="candidate@email.com"
            value={data.candidateEmail}
            onChange={(e) => set("candidateEmail", e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 gap-1 text-xs"
          >
            <UserSearch className="size-3.5" />
            Fetch
          </Button>
        </div>
      </Field>
      <Field label="Alternate Email">
        <input
          type="email"
          className={inputCls}
          placeholder="alt@email.com"
          value={data.alternateEmail}
          onChange={(e) => set("alternateEmail", e.target.value)}
        />
      </Field>

      {/* Name */}
      <Field label="First Name" required>
        <input
          className={inputCls}
          placeholder="First"
          value={data.firstName}
          onChange={(e) => set("firstName", e.target.value)}
        />
      </Field>
      <Field label="Last Name" required>
        <input
          className={inputCls}
          placeholder="Last"
          value={data.lastName}
          onChange={(e) => set("lastName", e.target.value)}
        />
      </Field>
      <Field label="Company" required>
        <input
          className={inputCls}
          value={data.company}
          onChange={(e) => set("company", e.target.value)}
        />
      </Field>

      {/* Phone */}
      <Field label="Mobile" required>
        <input
          type="tel"
          className={inputCls}
          placeholder="(555) 000-0000"
          value={data.mobile}
          onChange={(e) => set("mobile", e.target.value)}
        />
      </Field>
      <Field label="Home Phone">
        <input
          type="tel"
          className={inputCls}
          placeholder="(555) 000-0000"
          value={data.homePhone}
          onChange={(e) => set("homePhone", e.target.value)}
        />
      </Field>
      <Field label="Country">
        <input
          className={inputCls}
          value={data.country}
          onChange={(e) => set("country", e.target.value)}
        />
      </Field>

      {/* Address */}
      <Field label="Address" required className="sm:col-span-2">
        <input
          className={inputCls}
          placeholder="Street address"
          value={data.address}
          onChange={(e) => set("address", e.target.value)}
        />
      </Field>
      <Field label="Address Line 2">
        <input
          className={inputCls}
          placeholder="Apt, suite, etc."
          value={data.addressLine2}
          onChange={(e) => set("addressLine2", e.target.value)}
        />
      </Field>

      <Field label="City" required>
        <input
          className={inputCls}
          placeholder="City"
          value={data.city}
          onChange={(e) => set("city", e.target.value)}
        />
      </Field>
      <Field label="State" required>
        <select
          className={selectCls}
          value={data.state}
          onChange={(e) => set("state", e.target.value)}
        >
          <option value="">-- Select --</option>
          {US_STATES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Zip Code">
        <input
          className={inputCls}
          placeholder="00000"
          value={data.zipCode}
          onChange={(e) => set("zipCode", e.target.value)}
        />
      </Field>

      {/* Identity */}
      <SectionTitle>Identity & Authorization</SectionTitle>
      <Field label="SSN">
        <input
          type="password"
          className={inputCls}
          placeholder="XXX-XX-XXXX"
          value={data.ssn}
          onChange={(e) => set("ssn", e.target.value)}
        />
      </Field>
      <Field label="Date of Birth">
        <input
          type="date"
          className={inputCls}
          value={data.dateOfBirth}
          onChange={(e) => set("dateOfBirth", e.target.value)}
        />
      </Field>
      <Field label="Sourced From" required>
        <select
          className={selectCls}
          value={data.sourcedFrom}
          onChange={(e) => set("sourcedFrom", e.target.value)}
        >
          <option value="">-- Select --</option>
          {SOURCED_FROM_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Work Authorization" required>
        <select
          className={selectCls}
          value={data.workAuthorization}
          onChange={(e) => set("workAuthorization", e.target.value)}
        >
          <option value="">-- Select --</option>
          {WORK_AUTH_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Auth Expiration">
        <input
          type="date"
          className={inputCls}
          value={data.authorizationExpiry}
          onChange={(e) => set("authorizationExpiry", e.target.value)}
        />
      </Field>
      <Field label="Other Authorization">
        <input
          className={inputCls}
          placeholder="e.g. EAD Card"
          value={data.otherAuthorization}
          onChange={(e) => set("otherAuthorization", e.target.value)}
        />
      </Field>

      <Field label="Pay Terms" required>
        <select
          className={selectCls}
          value={data.payTerms}
          onChange={(e) => set("payTerms", e.target.value)}
        >
          <option value="">-- Select --</option>
          {PAY_TERM_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Gender" required>
        <select
          className={selectCls}
          value={data.gender}
          onChange={(e) => set("gender", e.target.value)}
        >
          <option value="">-- Select --</option>
          {GENDER_OPTIONS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Assignment
// ---------------------------------------------------------------------------

function Step2({
  data,
  set,
}: {
  data: OnboardingFormData;
  set: (k: keyof OnboardingFormData, v: unknown) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-3">
      <SectionTitle>Project Details</SectionTitle>

      <Field label="Client" required className="sm:col-span-2">
        <select
          className={selectCls}
          value={data.client}
          onChange={(e) => set("client", e.target.value)}
        >
          <option value="">-- Select client --</option>
          {CLIENT_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Job ID">
        <input
          className={inputCls}
          placeholder="JOB-00000"
          value={data.jobId}
          onChange={(e) => set("jobId", e.target.value)}
        />
      </Field>

      <Field label="Job Title" className="sm:col-span-3">
        <input
          className={inputCls}
          placeholder="e.g. Senior Software Engineer"
          value={data.jobTitle}
          onChange={(e) => set("jobTitle", e.target.value)}
        />
      </Field>

      <Field label="Start Date">
        <input
          type="date"
          className={inputCls}
          value={data.startDate}
          onChange={(e) => set("startDate", e.target.value)}
        />
      </Field>
      <Field label="Tentative End Date">
        <input
          type="date"
          className={inputCls}
          value={data.tentativeEnd}
          onChange={(e) => set("tentativeEnd", e.target.value)}
        />
      </Field>
      <div className="flex flex-col justify-end pb-0.5">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-3.5 cursor-pointer rounded accent-primary"
            checked={data.isVerified}
            onChange={(e) => set("isVerified", e.target.checked)}
          />
          <span className="text-muted-foreground text-xs">Is Verified</span>
        </label>
      </div>

      <Field label="Status" required>
        <select
          className={selectCls}
          value={data.status}
          onChange={(e) => set("status", e.target.value)}
        >
          {ONBOARDING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Sub Status" required>
        <select
          className={selectCls}
          value={data.subStatus}
          onChange={(e) => set("subStatus", e.target.value)}
        >
          {ONBOARDING_SUB_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Job Category" required>
        <select
          className={selectCls}
          value={data.jobCategory}
          onChange={(e) => set("jobCategory", e.target.value)}
        >
          <option value="">-- Select --</option>
          {JOB_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>

      {(data.employmentType === "contract" || data.payTerms === "c2c") && (
        <Field label="Vendor Name" className="sm:col-span-3">
          <select
            className={selectCls}
            value={data.vendorName}
            onChange={(e) => set("vendorName", e.target.value)}
          >
            <option value="">-- Select vendor --</option>
            {VENDOR_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </Field>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Rates & Location
// ---------------------------------------------------------------------------

function Step3({
  data,
  set,
}: {
  data: OnboardingFormData;
  set: (k: keyof OnboardingFormData, v: unknown) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-3">
      <SectionTitle>Work Location</SectionTitle>

      <Field label="Lives In State" required>
        <select
          className={selectCls}
          value={data.liveInState}
          onChange={(e) => set("liveInState", e.target.value)}
        >
          <option value="">-- Select --</option>
          {US_STATES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Work Status" required>
        <select
          className={selectCls}
          value={data.workStatus}
          onChange={(e) => set("workStatus", e.target.value)}
        >
          {WORK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Work Address" required className="sm:col-span-3">
        <input
          className={inputCls}
          placeholder="Client work address"
          value={data.workAddress}
          onChange={(e) => set("workAddress", e.target.value)}
        />
      </Field>

      <Field label="Work City" required>
        <input
          className={inputCls}
          placeholder="City"
          value={data.workCity}
          onChange={(e) => set("workCity", e.target.value)}
        />
      </Field>
      <Field label="Work State" required>
        <select
          className={selectCls}
          value={data.workState}
          onChange={(e) => set("workState", e.target.value)}
        >
          <option value="">-- Select --</option>
          {US_STATES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Work Zip Code" required>
        <input
          className={inputCls}
          placeholder="00000"
          value={data.workZip}
          onChange={(e) => set("workZip", e.target.value)}
        />
      </Field>

      <SectionTitle>Bill Rate</SectionTitle>
      <Field label="Bill Rate" required>
        <input
          type="number"
          min="0"
          step="0.01"
          className={inputCls}
          placeholder="0.00"
          value={data.billRate}
          onChange={(e) => set("billRate", e.target.value)}
        />
      </Field>
      <Field label="Currency" required>
        <select
          className={selectCls}
          value={data.billRateCurrency}
          onChange={(e) => set("billRateCurrency", e.target.value)}
        >
          {CURRENCY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Rate Type" required>
        <select
          className={selectCls}
          value={data.billRateType}
          onChange={(e) => set("billRateType", e.target.value)}
        >
          {RATE_TYPE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </Field>

      <SectionTitle>Pay Rate</SectionTitle>
      <Field label="Pay Rate" required>
        <input
          type="number"
          min="0"
          step="0.01"
          className={inputCls}
          placeholder="0.00"
          value={data.payRate}
          onChange={(e) => set("payRate", e.target.value)}
        />
      </Field>
      <Field label="Currency" required>
        <select
          className={selectCls}
          value={data.payRateCurrency}
          onChange={(e) => set("payRateCurrency", e.target.value)}
        >
          {CURRENCY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Rate Type" required>
        <select
          className={selectCls}
          value={data.payRateType}
          onChange={(e) => set("payRateType", e.target.value)}
        >
          {RATE_TYPE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Team & Screening
// ---------------------------------------------------------------------------

function Step4({
  data,
  set,
}: {
  data: OnboardingFormData;
  set: (k: keyof OnboardingFormData, v: unknown) => void;
}) {
  const [addRole, setAddRole] = React.useState(ASSIGN_ROLES[0]);
  const [addUser, setAddUser] = React.useState("");

  const addMember = () => {
    if (!addUser) return;
    const updated: AssignedMember[] = [
      ...data.assignedMembers,
      { role: addRole, user: addUser },
    ];
    set("assignedMembers", updated);
    setAddUser("");
  };

  const removeMember = (i: number) => {
    set(
      "assignedMembers",
      data.assignedMembers.filter((_, idx) => idx !== i),
    );
  };

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-3">
      {/* Assign Members */}
      <SectionTitle>Assign Members</SectionTitle>
      <div className="col-span-full">
        <div className="flex items-end gap-2">
          <div className="w-36">
            <Lbl>Role</Lbl>
            <select
              className={selectCls}
              value={addRole}
              onChange={(e) => setAddRole(e.target.value)}
            >
              {ASSIGN_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <Lbl>User</Lbl>
            <select
              className={selectCls}
              value={addUser}
              onChange={(e) => setAddUser(e.target.value)}
            >
              <option value="">Select User</option>
              {TEAM_MEMBERS.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name} ({m.role})
                </option>
              ))}
            </select>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={addMember}
            disabled={!addUser}
            className="shrink-0"
          >
            <Plus className="size-3.5" />
          </Button>
        </div>

        {/* Members table */}
        <div className="mt-2 overflow-hidden rounded-md border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">
                  Role
                </th>
                <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">
                  User
                </th>
                <th className="w-8 px-2 py-1.5" />
              </tr>
            </thead>
            <tbody>
              {data.assignedMembers.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-3 text-center text-muted-foreground"
                  >
                    No members assigned. At least 1 required.
                  </td>
                </tr>
              ) : (
                data.assignedMembers.map((m, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-3 py-1.5">{m.role}</td>
                    <td className="px-3 py-1.5 font-medium">{m.user}</td>
                    <td className="px-2 py-1.5">
                      <button
                        type="button"
                        onClick={() => removeMember(i)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Background Check */}
      <SectionTitle>Background Check</SectionTitle>
      <Field label="HireRight ID">
        <input
          className={inputCls}
          placeholder="HR-000000"
          value={data.hirerightId}
          onChange={(e) => set("hirerightId", e.target.value)}
        />
      </Field>
      <Field label="Reporting Manager">
        <input
          className={inputCls}
          placeholder="Manager name"
          value={data.reportingManager}
          onChange={(e) => set("reportingManager", e.target.value)}
        />
      </Field>
      <Field label="Background Email">
        <input
          type="email"
          className={inputCls}
          placeholder="background@client.com"
          value={data.backgroundEmail}
          onChange={(e) => set("backgroundEmail", e.target.value)}
        />
      </Field>

      <Field label="Remarks" className="sm:col-span-3">
        <textarea
          rows={3}
          className={cn(
            inputCls,
            "h-auto resize-y py-1.5 leading-relaxed",
          )}
          placeholder="Internal notes, special requirements…"
          value={data.remarks}
          onChange={(e) => set("remarks", e.target.value)}
        />
      </Field>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 5: Review
// ---------------------------------------------------------------------------

function ReviewRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 py-0.5">
      <span className="w-36 shrink-0 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="flex-1 text-sm">{value}</span>
    </div>
  );
}

function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border p-3">
      <h4 className="mb-2 text-xs font-semibold text-foreground/80">{title}</h4>
      {children}
    </div>
  );
}

function Step5({ data }: { data: OnboardingFormData }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 rounded-lg bg-info/10 px-3 py-2 text-xs text-info-foreground">
        <Sparkles className="size-3.5 shrink-0 text-ai" />
        <span>
          AI will auto-generate the compliance package after submission based on
          client rules, state, employment type, and job category.
        </span>
      </div>

      <ReviewSection title="Candidate Info">
        <ReviewRow
          label="Name"
          value={[data.firstName, data.lastName].filter(Boolean).join(" ")}
        />
        <ReviewRow label="Email" value={data.candidateEmail} />
        <ReviewRow label="Mobile" value={data.mobile} />
        <ReviewRow label="Location" value={[data.city, data.state].filter(Boolean).join(", ")} />
        <ReviewRow label="Employment" value={data.employmentType} />
        <ReviewRow label="Work Auth" value={data.workAuthorization} />
        <ReviewRow label="Pay Terms" value={data.payTerms} />
        <ReviewRow label="Sourced From" value={data.sourcedFrom} />
      </ReviewSection>

      <ReviewSection title="Assignment">
        <ReviewRow label="Client" value={data.client} />
        <ReviewRow label="Job Title" value={data.jobTitle} />
        <ReviewRow label="Job ID" value={data.jobId} />
        <ReviewRow label="Category" value={data.jobCategory} />
        <ReviewRow label="Start Date" value={data.startDate} />
        <ReviewRow label="End Date" value={data.tentativeEnd} />
        <ReviewRow label="Status" value={data.status} />
        <ReviewRow label="Sub Status" value={data.subStatus} />
        {data.vendorName && <ReviewRow label="Vendor" value={data.vendorName} />}
      </ReviewSection>

      <ReviewSection title="Rates & Location">
        <ReviewRow
          label="Bill Rate"
          value={
            data.billRate
              ? `${data.billRateCurrency} ${data.billRate} / ${data.billRateType}`
              : ""
          }
        />
        <ReviewRow
          label="Pay Rate"
          value={
            data.payRate
              ? `${data.payRateCurrency} ${data.payRate} / ${data.payRateType}`
              : ""
          }
        />
        <ReviewRow label="Work Status" value={data.workStatus} />
        <ReviewRow
          label="Work Location"
          value={[data.workCity, data.workState].filter(Boolean).join(", ")}
        />
      </ReviewSection>

      <ReviewSection title="Team">
        {data.assignedMembers.length === 0 ? (
          <p className="text-xs text-warning-muted-foreground">
            No members assigned yet.
          </p>
        ) : (
          data.assignedMembers.map((m, i) => (
            <ReviewRow key={i} label={m.role} value={m.user} />
          ))
        )}
      </ReviewSection>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export: InitiateOnboardingSheet
// ---------------------------------------------------------------------------

export type InitiateOnboardingPrefill = Partial<
  Pick<
    OnboardingFormData,
    | "firstName"
    | "lastName"
    | "candidateEmail"
    | "mobile"
    | "employmentType"
    | "client"
    | "jobTitle"
  >
>;

type Props = {
  /** Slot for a custom trigger element (defaults to a primary Button). */
  trigger?: React.ReactNode;
  /** Pre-fill form from a known candidate / assignment. */
  prefill?: InitiateOnboardingPrefill;
};

export function InitiateOnboardingSheet({ trigger, prefill }: Props) {
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState(1);
  const [submitted, setSubmitted] = React.useState(false);
  const [data, setData] = React.useState<OnboardingFormData>(() =>
    emptyFormData(prefill),
  );

  function set(key: keyof OnboardingFormData, value: unknown) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function handleOpen(v: boolean) {
    setOpen(v);
    if (!v) {
      // Reset on close unless submitted
      if (!submitted) {
        setStep(1);
        setData(emptyFormData(prefill));
      }
    }
  }

  function handleSubmit(draft = false) {
    // In a real app: POST to /api/onboarding
    console.info(draft ? "Saved as draft:" : "Submitted:", data);
    setSubmitted(true);
    setTimeout(() => {
      setOpen(false);
      setSubmitted(false);
      setStep(1);
      setData(emptyFormData(prefill));
    }, 1200);
  }

  const defaultTrigger = (
    <Button size="sm" className="gap-1.5">
      <Plus className="size-3.5" />
      Initiate Onboarding
    </Button>
  );

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <div
        onClick={() => setOpen(true)}
        className="contents cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setOpen(true)}
      >
        {trigger ?? defaultTrigger}
      </div>

      <SheetContent
        side="right"
        showCloseButton={true}
        style={{ maxWidth: "680px", width: "100%" }}
        className="flex flex-col gap-0 p-0"
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <SheetHeader className="gap-2 border-b px-5 py-4">
          <div className="flex items-center justify-between">
            <SheetTitle>
              {submitted ? "Submitting…" : "Initiate Onboarding"}
            </SheetTitle>
            <StepDots current={step} />
          </div>
          <div className="flex items-center justify-between">
            <SheetDescription className="text-xs">
              Step {step} of {TOTAL_STEPS} — {STEP_LABELS[step - 1]}
            </SheetDescription>
            <EmploymentToggle
              value={data.employmentType}
              onChange={(v) => set("employmentType", v)}
            />
          </div>
        </SheetHeader>

        {/* ── Scrollable step content ─────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {submitted ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <span className="flex size-12 items-center justify-center rounded-full bg-success/15">
                <Check className="size-6 text-success" />
              </span>
              <p className="text-sm font-medium">Onboarding record created!</p>
              <p className="text-muted-foreground text-center text-xs">
                The compliance package will be auto-generated based on client
                rules and employment type.
              </p>
            </div>
          ) : step === 1 ? (
            <Step1 data={data} set={set} />
          ) : step === 2 ? (
            <Step2 data={data} set={set} />
          ) : step === 3 ? (
            <Step3 data={data} set={set} />
          ) : step === 4 ? (
            <Step4 data={data} set={set} />
          ) : (
            <Step5 data={data} />
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        {!submitted && (
          <div className="flex flex-col gap-2 border-t px-5 py-3">
            <div className="flex items-center justify-between gap-2">
              {/* Block emails */}
              <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  className="size-3 cursor-pointer rounded accent-primary"
                  checked={data.blockEmails}
                  onChange={(e) => set("blockEmails", e.target.checked)}
                />
                Block sending emails
              </label>

              <div className="flex gap-2">
                {step > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStep((s) => s - 1)}
                  >
                    Back
                  </Button>
                )}
                {step === TOTAL_STEPS ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSubmit(true)}
                    >
                      Save as Draft
                    </Button>
                    <Button size="sm" onClick={() => handleSubmit(false)}>
                      Submit
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSubmit(true)}
                    >
                      Save as Draft
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1"
                      onClick={() => setStep((s) => s + 1)}
                    >
                      Next
                      <ChevronRight className="size-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
