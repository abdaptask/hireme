"use client";

/* ---------------------------------------------------------------------------
   New Hire Request (NHR) — Recruiting Manager intake (§9 step 1, §112 forms).
   Mirrors the ApTask NHR sections; dropdowns wherever a list exists; client
   selection drives contacts, account executive, and work location; a live
   checklist preview shows what the candidate will be asked for.
   --------------------------------------------------------------------------- */

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import {
  AlertCircle,
  Check,
  ClipboardList,
  ExternalLink,
  FileText,
  GraduationCap,
  Laptop,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { US_STATES } from "@/lib/onboarding-form";
import { buildChecklist } from "@/lib/onboarding/checklist";
import {
  PAYMENT_TERM_OPTIONS,
  RATE_TYPE_OPTIONS,
  SOURCED_FROM_OPTIONS,
  STATUS_OPTIONS,
  SUB_STATUS_OPTIONS,
  TAX_TERM_OPTIONS,
  TERM_OPTIONS,
  TIME_TEMPLATE_OPTIONS,
  WORK_AUTH_OPTIONS,
  WORK_MODE_OPTIONS,
  emptyNhr,
  nhrExceptions,
  employmentFromNhr,
  isC2C,
  isFullTime,
  validateNhr,
  workAuthKey,
  type NhrErrors,
  type NhrForm,
} from "@/lib/onboarding/nhr";
import { createNhrAction } from "@/lib/actions/onboarding";
import type { NhrOptions } from "@/lib/onboarding/service";

const DRAFT_KEY = "hireme.nhr.draft";
const OTHER = "__other__";

const inputCls =
  "bg-background h-9 w-full rounded-md border px-2.5 text-sm outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/20 placeholder:text-muted-foreground/60";

// ── Field primitives ─────────────────────────────────────

function Field({
  label,
  required,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("flex min-w-0 flex-col gap-1", className)}>
      <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
        {label}
        {required && <span className="text-danger-muted-foreground"> *</span>}
      </span>
      {children}
      {error ? (
        <span className="text-danger-muted-foreground text-xs">{error}</span>
      ) : hint ? (
        <span className="text-muted-foreground text-xs">{hint}</span>
      ) : null}
    </label>
  );
}

function Select({
  value,
  onChange,
  options,
  placeholder = "Select…",
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  options: (string | { value: string; label: string })[];
  placeholder?: string;
  invalid?: boolean;
}) {
  return (
    <select
      className={inputCls}
      value={value}
      aria-invalid={invalid || undefined}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((o) =>
        typeof o === "string" ? (
          <option key={o}>{o}</option>
        ) : (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ),
      )}
    </select>
  );
}

/** Dropdown of known values with an "Other…" escape hatch for free text. */
function PickOrType({
  value,
  onChange,
  options,
  placeholder,
  otherLabel = "Other (type it)…",
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  otherLabel?: string;
}) {
  const known = options.some((o) => o.value === value);
  const [typing, setTyping] = useState(!!value && !known);
  if (typing) {
    return (
      <div className="flex gap-1.5">
        <input
          className={inputCls}
          value={value}
          autoFocus
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type a name"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setTyping(false);
            onChange("");
          }}
        >
          List
        </Button>
      </div>
    );
  }
  return (
    <select
      className={inputCls}
      value={known ? value : ""}
      onChange={(e) => {
        if (e.target.value === OTHER) {
          setTyping(true);
          onChange("");
        } else onChange(e.target.value);
      }}
    >
      <option value="">{placeholder ?? "Select…"}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
      <option value={OTHER}>{otherLabel}</option>
    </select>
  );
}

function Section({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card rounded-xl border shadow-xs">
      <div className="bg-primary/[0.04] flex items-center gap-2 border-b px-4 py-2.5">
        <h2 className="text-card-heading">{title}</h2>
        {aside && <div className="ml-auto">{aside}</div>}
      </div>
      <div className="grid grid-cols-1 gap-x-4 gap-y-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        {children}
      </div>
    </section>
  );
}

const states = US_STATES.map((s) => ({
  value: s.value,
  label: `${s.label} (${s.value})`,
}));

/** Client selection fills the account executive and work location when empty. */
function withClientDefaults(
  f: NhrForm,
  c?: NhrOptions["clients"][number],
): NhrForm {
  if (!c) return f;
  const [hqCity, hqState] = c.hq.split(", ");
  return {
    ...f,
    accountExecutive: f.accountExecutive || c.accountManager,
    workCity: f.workCity || hqCity || "",
    workState: f.workState || hqState || "",
  };
}

// ── Draft (per-browser convenience, §112 draft recovery) ─

const subscribeNoop = () => () => {};
function readDraft(): string | null {
  try {
    return localStorage.getItem(DRAFT_KEY);
  } catch {
    return null;
  }
}

// ── Form ─────────────────────────────────────────────────

export function NhrFormView({
  options,
  prefill,
  defaultManager,
}: {
  options: NhrOptions;
  prefill?: Partial<NhrForm>;
  defaultManager: string;
}) {
  const [f, setF] = useState<NhrForm>(() => {
    const base = emptyNhr({ recruitingManager: defaultManager, ...prefill });
    return withClientDefaults(
      base,
      options.clients.find((c) => c.name === base.client),
    );
  });
  const [errors, setErrors] = useState<NhrErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [created, setCreated] = useState<{
    id: string;
    items: number;
    onboarder: string | null;
    pendingApproval: boolean;
  } | null>(null);
  const [today] = useState(() => new Date());
  const [pending, start] = useTransition();
  const hasDraft = useSyncExternalStore(
    subscribeNoop,
    () => !!readDraft(),
    () => false,
  );
  const [draftDismissed, setDraftDismissed] = useState(false);

  // Autosave the draft locally as the RM types.
  useEffect(() => {
    if (created) return;
    const t = setTimeout(() => {
      try {
        if (f.firstName || f.lastName || f.email || f.client)
          localStorage.setItem(DRAFT_KEY, JSON.stringify(f));
      } catch {}
    }, 600);
    return () => clearTimeout(t);
  }, [f, created]);

  const set = <K extends keyof NhrForm>(k: K, v: NhrForm[K]) => {
    setF((prev) => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const client = options.clients.find((c) => c.name === f.client);

  function chooseClient(name: string) {
    const c = options.clients.find((x) => x.name === name);
    setF((prev) =>
      withClientDefaults(
        { ...prev, client: name, directManager: "", invoicingContact: "" },
        c,
      ),
    );
    setErrors((e) => ({ ...e, client: undefined }));
  }

  function chooseStatus(v: string) {
    setF((prev) => ({
      ...prev,
      status: v as NhrForm["status"],
      termOfProject:
        v === "Full-Time"
          ? "Permanent (Full-Time)"
          : v === "Contract-to-Hire"
            ? "Contract-to-Hire"
            : prev.termOfProject === "Permanent (Full-Time)"
              ? ""
              : prev.termOfProject || (v ? "Contract" : ""),
      taxTerms: v === "Full-Time" ? "" : prev.taxTerms,
    }));
    setErrors((e) => ({ ...e, status: undefined }));
  }

  // Live checklist preview (§9 step 2 rule evaluation, explained).
  const preview = useMemo(() => {
    if (!f.status) return null;
    return buildChecklist({
      employmentType: employmentFromNhr(f),
      workAuthorization: workAuthKey(f.workAuthorization),
      workState: f.workState || f.liveInState || null,
      workMode: f.workMode,
      client: client ? { name: client.name, rules: client.rules } : null,
    });
  }, [f, client]);

  // Bypassable exceptions (§25): allowed only with a reason, then Super Admin approval.
  const exceptions = nhrExceptions(f, today);

  function submit() {
    const errs = validateNhr(f);
    if (exceptions.length && !f.exceptionReason.trim())
      errs.exceptionReason =
        "Explain why this should proceed, or correct the dates";
    setErrors(errs);
    setServerError(null);
    if (Object.keys(errs).length) {
      requestAnimationFrame(() =>
        document
          .querySelector('[aria-invalid="true"]')
          ?.scrollIntoView({ behavior: "smooth", block: "center" }),
      );
      return;
    }
    start(async () => {
      const res = await createNhrAction(f);
      if (!res.ok) setServerError(res.error);
      else {
        setCreated(res.data!);
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {}
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  if (created) {
    return (
      <div className="bg-card mx-auto mt-6 flex max-w-xl flex-col items-center gap-3 rounded-2xl border p-8 text-center shadow-xs">
        <span className="bg-success-muted text-success-muted-foreground flex size-12 items-center justify-center rounded-full">
          <Check className="size-6" />
        </span>
        <h2 className="text-section-heading">
          {created.pendingApproval
            ? "Sent to Super Admin for approval"
            : "New hire request submitted"}
        </h2>
        {created.pendingApproval ? (
          <p className="text-muted-foreground text-sm leading-relaxed">
            {f.firstName} {f.lastName}&apos;s NHR is saved and waiting for a
            Super Admin to approve the exception. The checklist and candidate
            invite go out as soon as it&apos;s approved.
          </p>
        ) : (
          <p className="text-muted-foreground text-sm leading-relaxed">
            {f.firstName} {f.lastName}&apos;s onboarding has started.{" "}
            {created.items} checklist items were generated from {f.client} rules
            {created.onboarder ? (
              <>
                {" "}
                and the case was assigned to{" "}
                <strong className="text-foreground">
                  {created.onboarder}
                </strong>{" "}
                (Onboarder)
              </>
            ) : null}
            . A welcome message with the portal link was recorded.
          </p>
        )}
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <Button
            nativeButton={false}
            render={<Link href={`/candidates/${created.id}`} />}
          >
            Open candidate record
          </Button>
          {!created.pendingApproval && (
            <Button
              variant="outline"
              nativeButton={false}
              render={
                <a
                  href={`/portal/start?c=${created.id}`}
                  target="_blank"
                  rel="noreferrer"
                />
              }
            >
              <ExternalLink className="size-4" /> Open candidate portal
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => {
              setCreated(null);
              setF(emptyNhr({ recruitingManager: defaultManager }));
            }}
          >
            Start another NHR
          </Button>
        </div>
      </div>
    );
  }

  const errorCount = Object.values(errors).filter(Boolean).length;
  const ft = isFullTime(f);
  const c2c = isC2C(f);

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
      <form
        className="flex min-w-0 flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        noValidate
      >
        {hasDraft && !draftDismissed && (
          <div className="bg-info-muted text-info-muted-foreground flex flex-wrap items-center gap-2 rounded-lg px-3 py-2 text-sm">
            <RotateCcw className="size-4" /> You have an unsent NHR draft in
            this browser.
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="ml-auto"
              onClick={() => {
                try {
                  const d = readDraft();
                  if (d) setF({ ...emptyNhr(), ...JSON.parse(d) });
                } catch {}
                setDraftDismissed(true);
              }}
            >
              Restore draft
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                try {
                  localStorage.removeItem(DRAFT_KEY);
                } catch {}
                setDraftDismissed(true);
              }}
            >
              Discard
            </Button>
          </div>
        )}

        {(errorCount > 0 || serverError) && (
          <p
            role="alert"
            className="bg-danger-muted text-danger-muted-foreground flex items-start gap-2 rounded-lg px-3 py-2 text-sm"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            {serverError ??
              `${errorCount} field${errorCount > 1 ? "s need" : " needs"} attention before this NHR can be submitted.`}
          </p>
        )}

        <Section title="General Details">
          <Field
            label="Account Executive"
            required
            error={errors.accountExecutive}
            hint={
              client
                ? `Defaults to ${client.name}'s account manager`
                : undefined
            }
          >
            <Select
              value={f.accountExecutive}
              onChange={(v) => set("accountExecutive", v)}
              options={options.accountExecutives}
              invalid={!!errors.accountExecutive}
            />
          </Field>
          <Field label="Recruiter" required error={errors.recruiter}>
            <Select
              value={f.recruiter}
              onChange={(v) => set("recruiter", v)}
              options={options.recruiters}
              invalid={!!errors.recruiter}
            />
          </Field>
          <Field
            label="Recruiting Manager"
            required
            error={errors.recruitingManager}
          >
            <Select
              value={f.recruitingManager}
              onChange={(v) => set("recruitingManager", v)}
              options={options.recruitingManagers}
              invalid={!!errors.recruitingManager}
            />
          </Field>
        </Section>

        <Section title="Consultant Details">
          <Field label="Status" required error={errors.status}>
            <Select
              value={f.status}
              onChange={chooseStatus}
              options={STATUS_OPTIONS}
              invalid={!!errors.status}
            />
          </Field>
          <Field label="Sub Status">
            <Select
              value={f.subStatus}
              onChange={(v) => set("subStatus", v)}
              options={SUB_STATUS_OPTIONS}
            />
          </Field>
          <div className="hidden lg:block" />
          <div className="hidden lg:block" />
          <Field label="First Name" required error={errors.firstName}>
            <input
              className={inputCls}
              value={f.firstName}
              aria-invalid={!!errors.firstName || undefined}
              onChange={(e) => set("firstName", e.target.value)}
              autoComplete="off"
            />
          </Field>
          <Field label="Middle Name / Initial">
            <input
              className={inputCls}
              value={f.middleName}
              onChange={(e) => set("middleName", e.target.value)}
            />
          </Field>
          <Field
            label="Last Name"
            required
            error={errors.lastName}
            className="lg:col-span-2"
          >
            <input
              className={inputCls}
              value={f.lastName}
              aria-invalid={!!errors.lastName || undefined}
              onChange={(e) => set("lastName", e.target.value)}
            />
          </Field>
          <Field
            label="Home Address"
            required
            error={errors.street}
            className="sm:col-span-2"
          >
            <input
              className={inputCls}
              value={f.street}
              aria-invalid={!!errors.street || undefined}
              onChange={(e) => set("street", e.target.value)}
              placeholder="Street"
            />
          </Field>
          <Field label="Apt / Suite">
            <input
              className={inputCls}
              value={f.aptSuite}
              onChange={(e) => set("aptSuite", e.target.value)}
            />
          </Field>
          <Field label="City" required error={errors.city}>
            <input
              className={inputCls}
              value={f.city}
              aria-invalid={!!errors.city || undefined}
              onChange={(e) => set("city", e.target.value)}
            />
          </Field>
          <Field label="State" required error={errors.state}>
            <Select
              value={f.state}
              onChange={(v) => set("state", v)}
              options={states}
              invalid={!!errors.state}
            />
          </Field>
          <Field label="Zip">
            <input
              className={inputCls}
              value={f.zip}
              inputMode="numeric"
              onChange={(e) => set("zip", e.target.value)}
            />
          </Field>
          <Field label="Cell #" required error={errors.cellPhone}>
            <input
              className={inputCls}
              type="tel"
              value={f.cellPhone}
              aria-invalid={!!errors.cellPhone || undefined}
              onChange={(e) => set("cellPhone", e.target.value)}
              placeholder="561-900-6432"
            />
          </Field>
          <Field label="Home #">
            <input
              className={inputCls}
              type="tel"
              value={f.homePhone}
              onChange={(e) => set("homePhone", e.target.value)}
            />
          </Field>
          <Field label="Emergency Contact">
            <input
              className={inputCls}
              value={f.emergencyName}
              onChange={(e) => set("emergencyName", e.target.value)}
              placeholder="Name"
            />
          </Field>
          <Field label="Emergency #">
            <input
              className={inputCls}
              type="tel"
              value={f.emergencyPhone}
              onChange={(e) => set("emergencyPhone", e.target.value)}
            />
          </Field>
          <Field
            label="SSN (last 4)"
            error={errors.ssnLast4}
            hint="Full SSN is collected securely in the candidate's I-9 step"
          >
            <input
              className={inputCls}
              value={f.ssnLast4}
              inputMode="numeric"
              maxLength={4}
              aria-invalid={!!errors.ssnLast4 || undefined}
              onChange={(e) =>
                set("ssnLast4", e.target.value.replace(/\D/g, ""))
              }
              placeholder="••••"
            />
          </Field>
          <Field label="Date of Birth">
            <input
              className={inputCls}
              type="date"
              value={f.dateOfBirth}
              onChange={(e) => set("dateOfBirth", e.target.value)}
            />
          </Field>
          <Field label="GEID">
            <input
              className={inputCls}
              value={f.geid}
              onChange={(e) => set("geid", e.target.value)}
            />
          </Field>
          <Field label="Email Address" required error={errors.email}>
            <input
              className={inputCls}
              type="email"
              value={f.email}
              aria-invalid={!!errors.email || undefined}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>
          <Field label="If Referred">
            <Select
              value={f.referred ? "Yes" : "No"}
              onChange={(v) => set("referred", v === "Yes")}
              options={["No", "Yes"]}
              placeholder="—"
            />
          </Field>
          {f.referred && (
            <>
              <Field label="Referrer Name" required error={errors.referrerName}>
                <input
                  className={inputCls}
                  value={f.referrerName}
                  aria-invalid={!!errors.referrerName || undefined}
                  onChange={(e) => set("referrerName", e.target.value)}
                />
              </Field>
              <Field label="Referrer Amount ($)" error={errors.referrerAmount}>
                <input
                  className={inputCls}
                  inputMode="decimal"
                  value={f.referrerAmount}
                  onChange={(e) => set("referrerAmount", e.target.value)}
                />
              </Field>
            </>
          )}
          <Field label="Sourced From" required error={errors.sourcedFrom}>
            <Select
              value={f.sourcedFrom}
              onChange={(v) => set("sourcedFrom", v)}
              options={SOURCED_FROM_OPTIONS}
              invalid={!!errors.sourcedFrom}
            />
          </Field>
          {f.sourcedFrom === "Other" && (
            <Field label="Other Source" required error={errors.sourcedOther}>
              <input
                className={inputCls}
                value={f.sourcedOther}
                aria-invalid={!!errors.sourcedOther || undefined}
                onChange={(e) => set("sourcedOther", e.target.value)}
              />
            </Field>
          )}
          <Field
            label="Work Authorization"
            required
            error={errors.workAuthorization}
          >
            <Select
              value={f.workAuthorization}
              onChange={(v) => set("workAuthorization", v)}
              options={WORK_AUTH_OPTIONS}
              invalid={!!errors.workAuthorization}
            />
          </Field>
          {f.workAuthorization === "Other" && (
            <Field
              label="Other Authorization"
              required
              error={errors.workAuthOther}
            >
              <input
                className={inputCls}
                value={f.workAuthOther}
                onChange={(e) => set("workAuthOther", e.target.value)}
              />
            </Field>
          )}
          {f.workAuthorization &&
            !["Citizen", "Green Card"].includes(f.workAuthorization) && (
              <Field label="Authorization Expires">
                <input
                  className={inputCls}
                  type="date"
                  value={f.authExpiry}
                  onChange={(e) => set("authExpiry", e.target.value)}
                />
              </Field>
            )}
          <Field label="Live in State" required error={errors.liveInState}>
            <Select
              value={f.liveInState}
              onChange={(v) => set("liveInState", v)}
              options={states}
              invalid={!!errors.liveInState}
            />
          </Field>
        </Section>

        <Section title="Project Details">
          <Field
            label="Client Name"
            required
            error={errors.client}
            className="sm:col-span-2"
          >
            <Select
              value={f.client}
              onChange={chooseClient}
              options={options.clients.map((c) => c.name)}
              invalid={!!errors.client}
            />
          </Field>
          <Field label="Job Name" required error={errors.jobTitle}>
            <input
              className={inputCls}
              value={f.jobTitle}
              aria-invalid={!!errors.jobTitle || undefined}
              onChange={(e) => set("jobTitle", e.target.value)}
              placeholder="Embedded Software Engineer"
            />
          </Field>
          <Field label="Job Id #">
            <input
              className={inputCls}
              value={f.jobId}
              onChange={(e) => set("jobId", e.target.value)}
              placeholder="24-02630"
            />
          </Field>
          <Field label="Work Location — City">
            <input
              className={inputCls}
              value={f.workCity}
              onChange={(e) => set("workCity", e.target.value)}
            />
          </Field>
          <Field
            label="Work Location — State"
            required
            error={errors.workState}
          >
            <Select
              value={f.workState}
              onChange={(v) => set("workState", v)}
              options={states}
              invalid={!!errors.workState}
            />
          </Field>
          <Field label="Work Arrangement">
            <Select
              value={f.workMode}
              onChange={(v) =>
                set("workMode", (v || "Onsite") as NhrForm["workMode"])
              }
              options={[...WORK_MODE_OPTIONS]}
              placeholder="Onsite"
            />
          </Field>
          <Field label="Time Template">
            <Select
              value={f.timeTemplate}
              onChange={(v) => set("timeTemplate", v)}
              options={TIME_TEMPLATE_OPTIONS}
            />
          </Field>
          <Field
            label="Direct Manager / HR Contact"
            className="sm:col-span-2"
            hint={
              f.client && !client?.contacts.length
                ? "No contacts on file for this client — choose Other to type one"
                : undefined
            }
          >
            <PickOrType
              key={`dm-${f.client}`}
              value={f.directManager}
              onChange={(v) => set("directManager", v)}
              options={(client?.contacts ?? []).map((k) => ({
                value: k.name,
                label: `${k.name} — ${k.title}`,
              }))}
              placeholder={
                f.client ? "Select a client contact…" : "Choose a client first"
              }
            />
          </Field>
          <Field label="Invoicing Contact" className="sm:col-span-2">
            <PickOrType
              key={`inv-${f.client}`}
              value={f.invoicingContact}
              onChange={(v) => set("invoicingContact", v)}
              options={(client?.contacts ?? [])
                .filter((k) => k.type === "billing" || k.type === "primary")
                .map((k) => ({
                  value: k.name,
                  label: `${k.name} — ${k.title}`,
                }))}
              placeholder={
                f.client ? "Select billing contact…" : "Choose a client first"
              }
            />
          </Field>
          <Field
            label="Start Date"
            required
            error={errors.startDate}
            hint={
              exceptions.some((x) => x.code === "start-in-past")
                ? "In the past — needs Super Admin approval"
                : undefined
            }
          >
            <input
              className={inputCls}
              type="date"
              value={f.startDate}
              aria-invalid={!!errors.startDate || undefined}
              onChange={(e) => set("startDate", e.target.value)}
            />
          </Field>
          <Field label="Est. End Date" error={errors.endDate}>
            <input
              className={inputCls}
              type="date"
              value={f.endDate}
              onChange={(e) => set("endDate", e.target.value)}
            />
          </Field>
          <Field label="Term of Project" required error={errors.termOfProject}>
            <Select
              value={f.termOfProject}
              onChange={(v) => set("termOfProject", v)}
              options={TERM_OPTIONS}
              invalid={!!errors.termOfProject}
            />
          </Field>
        </Section>

        <Section
          title="Vendor Details"
          aside={
            !c2c ? (
              <span className="text-muted-foreground text-xs">
                Only for C2C — NA for{" "}
                {ft ? "Full-Time" : f.taxTerms || "W-2 / 1099"}
              </span>
            ) : null
          }
        >
          {c2c ? (
            <>
              <Field
                label="Vendor Company Name"
                required
                error={errors.vendorName}
                className="sm:col-span-2"
              >
                <PickOrType
                  value={f.vendorName}
                  onChange={(v) => set("vendorName", v)}
                  options={options.vendors.map((v) => ({ value: v, label: v }))}
                  otherLabel="New vendor (type it)…"
                />
              </Field>
              <Field
                label="Contact Person"
                required
                error={errors.vendorContact}
              >
                <input
                  className={inputCls}
                  value={f.vendorContact}
                  aria-invalid={!!errors.vendorContact || undefined}
                  onChange={(e) => set("vendorContact", e.target.value)}
                />
              </Field>
              <Field
                label="Federal ID (EIN)"
                required
                error={errors.vendorFederalId}
              >
                <input
                  className={inputCls}
                  value={f.vendorFederalId}
                  aria-invalid={!!errors.vendorFederalId || undefined}
                  onChange={(e) => set("vendorFederalId", e.target.value)}
                  placeholder="12-3456789"
                />
              </Field>
              <Field label="Address" className="sm:col-span-2">
                <input
                  className={inputCls}
                  value={f.vendorAddress}
                  onChange={(e) => set("vendorAddress", e.target.value)}
                />
              </Field>
              <Field label="Contact #">
                <input
                  className={inputCls}
                  type="tel"
                  value={f.vendorPhone}
                  onChange={(e) => set("vendorPhone", e.target.value)}
                />
              </Field>
              <Field label="Email ID">
                <input
                  className={inputCls}
                  type="email"
                  value={f.vendorEmail}
                  onChange={(e) => set("vendorEmail", e.target.value)}
                />
              </Field>
            </>
          ) : (
            <p className="text-muted-foreground text-sm sm:col-span-2 lg:col-span-4">
              Vendor details are NA — set Candidate Payment Terms to C2C to add
              a vendor.
            </p>
          )}
        </Section>

        {ft ? (
          <Section title="Pay Details — Full Time">
            <Field label="Salary ($ / year)" required error={errors.salary}>
              <input
                className={inputCls}
                inputMode="decimal"
                value={f.salary}
                aria-invalid={!!errors.salary || undefined}
                onChange={(e) => set("salary", e.target.value)}
                placeholder="85,000"
              />
            </Field>
            <Field
              label="Fee %"
              required
              error={errors.feePct}
              hint="Placement fee — FT GP = fee ÷ 960 h in Add / Drop"
            >
              <input
                className={inputCls}
                inputMode="decimal"
                value={f.feePct}
                aria-invalid={!!errors.feePct || undefined}
                onChange={(e) => set("feePct", e.target.value)}
                placeholder="20"
              />
            </Field>
            <Field label="Other Cost ($)">
              <input
                className={inputCls}
                inputMode="decimal"
                value={f.otherCost}
                onChange={(e) => set("otherCost", e.target.value)}
              />
            </Field>
            <Field label="Est. Placement Fee">
              <p className="h-9 py-2 text-sm font-semibold tabular-nums">
                {Number(f.salary.replace(/[$,]/g, "")) > 0 &&
                Number(f.feePct) > 0
                  ? `$${Math.round((Number(f.salary.replace(/[$,]/g, "")) * Number(f.feePct)) / 100).toLocaleString("en-US")}`
                  : "—"}
              </p>
            </Field>
          </Section>
        ) : (
          <Section title="Pay Details — Contract">
            <Field label="Bill Rate ($)" required error={errors.billRate}>
              <input
                className={inputCls}
                inputMode="decimal"
                value={f.billRate}
                aria-invalid={!!errors.billRate || undefined}
                onChange={(e) => set("billRate", e.target.value)}
                placeholder="95.00"
              />
            </Field>
            <Field label="Pay Rate ($)" required error={errors.payRate}>
              <input
                className={inputCls}
                inputMode="decimal"
                value={f.payRate}
                aria-invalid={!!errors.payRate || undefined}
                onChange={(e) => set("payRate", e.target.value)}
                placeholder="65.00"
              />
            </Field>
            <Field label="Rate Type">
              <Select
                value={f.rateType}
                onChange={(v) => set("rateType", v || "Hourly")}
                options={RATE_TYPE_OPTIONS}
                placeholder="Hourly"
              />
            </Field>
            <Field label="Margin">
              <p className="h-9 py-2 text-sm font-semibold tabular-nums">
                {Number(f.billRate) > 0 && Number(f.payRate) > 0
                  ? `$${(Number(f.billRate) - Number(f.payRate)).toFixed(2)} · ${Math.round(((Number(f.billRate) - Number(f.payRate)) / Number(f.billRate)) * 100)}%`
                  : "—"}
              </p>
            </Field>
            <Field
              label="Candidate Payment Terms"
              required
              error={errors.taxTerms}
            >
              <Select
                value={f.taxTerms}
                onChange={(v) => set("taxTerms", v)}
                options={TAX_TERM_OPTIONS}
                invalid={!!errors.taxTerms}
              />
            </Field>
            <Field
              label="Payment Schedule"
              required
              error={errors.paymentTerms}
            >
              <Select
                value={f.paymentTerms}
                onChange={(v) => set("paymentTerms", v)}
                options={PAYMENT_TERM_OPTIONS}
                invalid={!!errors.paymentTerms}
              />
            </Field>
            {f.paymentTerms === "Other (specify)" && (
              <Field
                label="Other (Specify)"
                required
                error={errors.paymentTermsOther}
                className="sm:col-span-2"
              >
                <input
                  className={inputCls}
                  value={f.paymentTermsOther}
                  onChange={(e) => set("paymentTermsOther", e.target.value)}
                />
              </Field>
            )}
          </Section>
        )}

        {exceptions.length > 0 && (
          <section className="border-warning/40 bg-warning-muted/40 rounded-xl border p-4">
            <h2 className="text-card-heading text-warning-muted-foreground flex items-center gap-1.5">
              <AlertCircle className="size-4" /> Needs Super Admin approval
            </h2>
            <ul className="text-warning-muted-foreground mt-1 list-disc pl-5 text-sm">
              {exceptions.map((x) => (
                <li key={x.code}>{x.message}</li>
              ))}
            </ul>
            <p className="text-muted-foreground mt-2 text-xs">
              Correct the dates above, or explain why this hire should proceed.
              The request is held — no checklist or candidate invite — until a
              Super Admin approves it.
            </p>
            <Field
              label="Reason for exception"
              required
              error={errors.exceptionReason}
              className="mt-3"
            >
              <textarea
                className={cn(inputCls, "h-20 py-2")}
                value={f.exceptionReason}
                aria-invalid={!!errors.exceptionReason || undefined}
                onChange={(e) => set("exceptionReason", e.target.value)}
                placeholder="e.g. Candidate started on the client's emergency request; paperwork is catching up."
              />
            </Field>
          </section>
        )}

        <section className="bg-card grid gap-4 rounded-xl border p-4 shadow-xs sm:grid-cols-2">
          <Field label="Remarks">
            <textarea
              className={cn(inputCls, "h-24 py-2")}
              value={f.remarks}
              onChange={(e) => set("remarks", e.target.value)}
            />
          </Field>
          <Field label="Special Terms / Exceptions">
            <textarea
              className={cn(inputCls, "h-24 py-2")}
              value={f.specialTerms}
              onChange={(e) => set("specialTerms", e.target.value)}
            />
          </Field>
        </section>

        <div className="bg-background/90 sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center gap-3 border-t px-1 py-3 backdrop-blur">
          <label className="text-muted-foreground inline-flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              className="accent-primary size-3.5"
              checked={f.blockEmails}
              onChange={(e) => set("blockEmails", e.target.checked)}
            />
            Don&apos;t send the welcome email yet
          </label>
          <span className="text-muted-foreground ml-auto hidden text-xs sm:inline">
            Draft is saved in this browser as you type.
          </span>
          <Button type="submit" disabled={pending}>
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}{" "}
            {exceptions.length
              ? "Submit for Super Admin approval"
              : "Submit NHR & start onboarding"}
          </Button>
        </div>
      </form>

      {/* Live checklist preview */}
      <aside className="xl:sticky xl:top-4 xl:self-start">
        <div className="bg-card rounded-xl border shadow-xs">
          <div className="flex items-center gap-2 border-b px-4 py-2.5">
            <ClipboardList className="text-primary size-4" />
            <h2 className="text-card-heading">Checklist preview</h2>
            {preview && (
              <span className="text-muted-foreground ml-auto text-xs tabular-nums">
                {preview.length} items
              </span>
            )}
          </div>
          {!preview ? (
            <p className="text-muted-foreground p-4 text-sm">
              Choose a Status, Client, and Work Location to see what the
              candidate will be asked to complete.
            </p>
          ) : (
            <ul className="divide-y">
              {preview.map((p) => {
                const Icon =
                  p.type === "document"
                    ? FileText
                    : p.type === "screening"
                      ? ShieldCheck
                      : p.type === "training"
                        ? GraduationCap
                        : Laptop;
                return (
                  <li key={p.label} className="flex gap-2.5 px-4 py-2">
                    <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{p.label}</p>
                      <p className="text-muted-foreground text-[11px] leading-snug">
                        <span
                          className={cn(
                            "mr-1 rounded px-1 py-px text-[10px] font-semibold",
                            p.ruleCategory === "Client"
                              ? "bg-ai-muted text-ai-muted-foreground"
                              : "bg-muted",
                          )}
                        >
                          {p.ruleCategory}
                        </span>
                        {p.reason}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="text-muted-foreground flex items-center gap-1.5 border-t px-4 py-2 text-[11px]">
            <Sparkles className="size-3" /> Generated from employment type,
            location, work authorization, and client rules.
          </p>
        </div>
      </aside>
    </div>
  );
}
