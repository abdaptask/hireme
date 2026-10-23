"use client";

/* ---------------------------------------------------------------------------
   Candidate task flows (§101.2 task flow, §101.3 mobile capture, §28).
   Each completes one checklist item and returns to the portal home.
   --------------------------------------------------------------------------- */

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  AlertCircle,
  Camera,
  Check,
  FileUp,
  Loader2,
  PenLine,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  completeTrainingAction,
  confirmEquipmentAction,
  consentScreeningAction,
  submitFormAction,
  type ActionResult,
} from "@/lib/actions/onboarding";
import type { FormField } from "@/lib/onboarding/checklist";

const inputCls =
  "bg-background focus-visible:ring-ring h-11 w-full rounded-lg border px-3 text-base focus-visible:ring-2 focus-visible:outline-none sm:h-10 sm:text-sm";

function ErrorNote({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p
      role="alert"
      className="bg-danger-muted text-danger-muted-foreground flex items-start gap-2 rounded-lg px-3 py-2 text-sm"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}
    </p>
  );
}

function useSubmit() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const submit = (fn: () => Promise<ActionResult<unknown>>) => {
    setError(null);
    start(async () => {
      const res = await fn();
      if (res.ok) router.push("/portal");
      else setError(res.error);
    });
  };
  return { pending, error, submit, setError };
}

function SignatureBox({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-sm font-medium">
        <PenLine className="size-4" /> Sign by typing your full legal name
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={name}
        autoComplete="name"
        className={cn(inputCls, "font-serif text-lg italic")}
      />
      <span className="text-muted-foreground text-xs">
        Typing your name is your electronic signature. We record the date and
        time.
      </span>
    </label>
  );
}

// ── Form + e-signature ─────────────────────────────────────

export function FormTask({
  docId,
  fields,
  candidateName,
  title,
  prefill = {},
  prefillSource = null,
}: {
  docId: string;
  fields: FormField[];
  candidateName: string;
  title: string;
  /** Values from the NHR (confirm before signing) or the candidate's earlier submission. */
  prefill?: Record<string, string>;
  prefillSource?: "nhr" | "previous" | null;
}) {
  const [values, setValues] = useState<Record<string, string>>(prefill);
  const [confirmed, setConfirmed] = useState(false);
  const hasSensitive = fields.some((f) => f.sensitive);
  const [signature, setSignature] = useState("");
  const { pending, error, submit } = useSubmit();

  return (
    <form
      className="bg-card flex flex-col gap-4 rounded-2xl border p-4 sm:p-5"
      onSubmit={(e) => {
        e.preventDefault();
        submit(() => submitFormAction(docId, values, signature, confirmed));
      }}
    >
      {prefillSource === "nhr" && (
        <p className="bg-info-muted text-info-muted-foreground rounded-xl px-3 py-2 text-sm">
          Some answers are pre-filled from your offer details. Please check each
          one and correct anything that&apos;s wrong.
        </p>
      )}
      {prefillSource === "previous" && (
        <p className="bg-info-muted text-info-muted-foreground rounded-xl px-3 py-2 text-sm">
          You&apos;re editing what you submitted earlier.
          {hasSensitive
            ? " For your security, re-enter numbers like SSN and bank details."
            : ""}
        </p>
      )}
      {fields.length === 0 && (
        <div className="bg-muted/50 rounded-xl p-4 text-sm leading-relaxed">
          Please read the <strong>{title}</strong>. By signing below you confirm
          you have read, understood, and agree to its terms.
        </div>
      )}
      {fields.map((f) => (
        <label key={f.key} className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">
            {f.label}
            {f.required && (
              <span className="text-danger-muted-foreground"> *</span>
            )}
          </span>
          {f.type === "select" ? (
            <select
              className={inputCls}
              value={values[f.key] ?? ""}
              onChange={(e) =>
                setValues({ ...values, [f.key]: e.target.value })
              }
            >
              <option value="">Select…</option>
              {f.options?.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          ) : (
            <input
              className={inputCls}
              type={
                f.type === "date"
                  ? "date"
                  : f.type === "number"
                    ? "number"
                    : f.sensitive
                      ? "password"
                      : "text"
              }
              inputMode={
                f.type === "number" || f.sensitive ? "numeric" : undefined
              }
              autoComplete={f.sensitive ? "off" : undefined}
              placeholder={f.placeholder}
              value={values[f.key] ?? ""}
              onChange={(e) =>
                setValues({ ...values, [f.key]: e.target.value })
              }
            />
          )}
          {f.sensitive && (
            <span className="text-muted-foreground text-xs">
              Encrypted in transit. Only the last 4 digits are shown to
              reviewers.
            </span>
          )}
        </label>
      ))}
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="accent-primary mt-1 size-4"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
        />
        I confirm the details above are correct and complete.
      </label>
      <SignatureBox
        name={candidateName}
        value={signature}
        onChange={setSignature}
      />
      <ErrorNote error={error} />
      <Button
        type="submit"
        size="lg"
        disabled={pending || !confirmed}
        className="w-full sm:w-auto"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Check className="size-4" />
        )}{" "}
        Sign & submit
      </Button>
    </form>
  );
}

// ── Upload with preview (§101.3) ──────────────────────────

export function UploadTask({
  docId,
  hint,
  needsExpiry,
  expiryPrefill = "",
  replacing = false,
}: {
  docId: string;
  hint?: string;
  needsExpiry: boolean;
  expiryPrefill?: string;
  replacing?: boolean;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState(expiryPrefill);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function choose(f: File | null) {
    setError(null);
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(
      f && f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
    );
  }

  async function upload() {
    if (!file) return setError("Choose a photo or file first.");
    setPending(true);
    setError(null);
    const body = new FormData();
    body.set("file", file);
    if (expiresAt) body.set("expiresAt", expiresAt);
    try {
      const res = await fetch(`/api/portal/upload/${docId}`, {
        method: "POST",
        body,
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!json.ok) setError(json.error ?? "Upload failed.");
      else {
        router.push("/portal");
        router.refresh();
      }
    } catch {
      setError(
        "Couldn't reach the server — check your connection and try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="bg-card flex flex-col gap-4 rounded-2xl border p-4 sm:p-5">
      {hint && <p className="bg-muted/50 rounded-xl p-3 text-sm">{hint}</p>}
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="border-primary/40 bg-primary/5 hover:bg-primary/10 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-5 text-center text-sm">
          <Camera className="text-primary size-6" />
          <span className="font-medium">Take a photo</span>
          <span className="text-muted-foreground text-xs">
            Opens your camera on a phone
          </span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => choose(e.target.files?.[0] ?? null)}
          />
        </label>
        <label className="hover:bg-muted/50 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-5 text-center text-sm">
          <FileUp className="text-muted-foreground size-6" />
          <span className="font-medium">Choose a file</span>
          <span className="text-muted-foreground text-xs">
            PDF, JPG, PNG, HEIC · up to 10 MB
          </span>
          <input
            type="file"
            accept="application/pdf,image/*"
            className="sr-only"
            onChange={(e) => choose(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>
      {file && (
        <div className="flex items-center gap-3 rounded-xl border p-3">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Preview of your upload"
              className="size-16 rounded-lg object-cover"
            />
          ) : (
            <span className="bg-muted flex size-16 items-center justify-center rounded-lg text-xs font-semibold">
              PDF
            </span>
          )}
          <div className="min-w-0 flex-1 text-sm">
            <p className="truncate font-medium">{file.name}</p>
            <p className="text-muted-foreground text-xs">
              {Math.max(1, Math.round(file.size / 1024))} KB
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => choose(null)}>
            Retake
          </Button>
        </div>
      )}
      {needsExpiry && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">
            Expiration date (if shown on the document)
          </span>
          <input
            type="date"
            className={inputCls}
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </label>
      )}
      <ErrorNote error={error} />
      <Button
        size="lg"
        disabled={!file || pending}
        onClick={upload}
        className="w-full sm:w-auto"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Upload className="size-4" />
        )}{" "}
        {replacing ? "Replace file" : "Upload & submit"}
      </Button>
    </div>
  );
}

// ── Screening consent ─────────────────────────────────────

export function ConsentTask({
  screeningId,
  candidateName,
  vendor,
  packageType,
}: {
  screeningId: string;
  candidateName: string;
  vendor: string;
  packageType: string;
}) {
  const [signature, setSignature] = useState("");
  const [agree, setAgree] = useState(false);
  const { pending, error, submit } = useSubmit();
  return (
    <form
      className="bg-card flex flex-col gap-4 rounded-2xl border p-4 sm:p-5"
      onSubmit={(e) => {
        e.preventDefault();
        submit(() => consentScreeningAction(screeningId, signature));
      }}
    >
      <div className="bg-muted/50 rounded-xl p-4 text-sm leading-relaxed">
        <p className="font-medium">
          Disclosure regarding background investigation
        </p>
        <p className="text-muted-foreground mt-1">
          ApTask may obtain a consumer report ({packageType}) from {vendor} for
          employment purposes. You have the right to request a copy of the
          report and a summary of your rights under the Fair Credit Reporting
          Act. Results are confidential and are only seen by authorized
          reviewers.
        </p>
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="accent-primary mt-1 size-4"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
        />
        I have read the disclosure and authorize the background check.
      </label>
      <SignatureBox
        name={candidateName}
        value={signature}
        onChange={setSignature}
      />
      <ErrorNote error={error} />
      <Button
        type="submit"
        size="lg"
        disabled={pending || !agree}
        className="w-full sm:w-auto"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Check className="size-4" />
        )}{" "}
        Authorize
      </Button>
    </form>
  );
}

// ── Training (short course + 3-question check) ────────────

const QUIZ: Record<string, { q: string; options: string[]; answer: number }[]> =
  {
    default: [
      {
        q: "You receive an unexpected email asking you to confirm your password. What do you do?",
        options: [
          "Reply with the password",
          "Report it as phishing and delete it",
          "Forward it to a coworker",
        ],
        answer: 1,
      },
      {
        q: "Where should client data be stored?",
        options: [
          "Personal cloud drive",
          "Approved company systems only",
          "USB stick",
        ],
        answer: 1,
      },
      {
        q: "You must lock your screen when…",
        options: [
          "Leaving your desk, even briefly",
          "Only at the end of the day",
          "Never",
        ],
        answer: 0,
      },
    ],
    privacy: [
      {
        q: "What is PHI?",
        options: [
          "Public health information",
          "Protected health information about an individual",
          "A payroll code",
        ],
        answer: 1,
      },
      {
        q: "Who may you share patient information with?",
        options: [
          "Anyone on the team",
          "Only those who need it for their job",
          "Friends, if anonymized",
        ],
        answer: 1,
      },
      {
        q: "You notice a possible privacy breach. You…",
        options: [
          "Report it immediately",
          "Wait to see if it happens again",
          "Fix it quietly",
        ],
        answer: 0,
      },
    ],
    systems: [
      {
        q: "When should you submit your timesheet?",
        options: [
          "Weekly, by the deadline",
          "Whenever you remember",
          "Only at month end",
        ],
        answer: 0,
      },
      {
        q: "Expenses need…",
        options: [
          "No documentation",
          "A receipt and business purpose",
          "Manager's verbal OK only",
        ],
        answer: 1,
      },
      {
        q: "Overtime must be…",
        options: [
          "Pre-approved by your manager",
          "Logged without approval",
          "Avoided at all costs",
        ],
        answer: 0,
      },
    ],
  };

export function TrainingTask({
  trainingId,
  title,
  category,
}: {
  trainingId: string;
  title: string;
  category: string;
}) {
  const quiz = QUIZ[category] ?? QUIZ.default;
  const [answers, setAnswers] = useState<number[]>(Array(quiz.length).fill(-1));
  const { pending, error, submit } = useSubmit();
  const complete = answers.every((a) => a >= 0);
  const score = Math.round(
    (answers.filter((a, i) => a === quiz[i].answer).length / quiz.length) * 100,
  );
  return (
    <form
      className="bg-card flex flex-col gap-4 rounded-2xl border p-4 sm:p-5"
      onSubmit={(e) => {
        e.preventDefault();
        submit(() => completeTrainingAction(trainingId, score));
      }}
    >
      <div className="bg-muted/50 rounded-xl p-4 text-sm leading-relaxed">
        <p className="font-medium">{title} — key points</p>
        <ul className="text-muted-foreground mt-1 list-disc pl-5">
          <li>
            Protect credentials and report anything suspicious right away.
          </li>
          <li>Keep client and personal data only in approved systems.</li>
          <li>
            Follow your client&apos;s policies for access, devices, and time
            reporting.
          </li>
        </ul>
      </div>
      {quiz.map((q, i) => (
        <fieldset key={q.q} className="flex flex-col gap-1.5">
          <legend className="mb-1 text-sm font-medium">
            {i + 1}. {q.q}
          </legend>
          {q.options.map((o, j) => (
            <label
              key={o}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                answers[i] === j && "border-primary bg-primary/5",
              )}
            >
              <input
                type="radio"
                name={`q${i}`}
                className="accent-primary"
                checked={answers[i] === j}
                onChange={() =>
                  setAnswers(answers.map((a, k) => (k === i ? j : a)))
                }
              />
              {o}
            </label>
          ))}
        </fieldset>
      ))}
      <p className="text-muted-foreground text-xs">
        A score of 70% or higher completes the course.
      </p>
      <ErrorNote error={error} />
      <Button
        type="submit"
        size="lg"
        disabled={!complete || pending}
        className="w-full sm:w-auto"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Check className="size-4" />
        )}{" "}
        Submit answers
      </Button>
    </form>
  );
}

// ── Equipment receipt ─────────────────────────────────────

export function EquipmentTask({ equipmentId }: { equipmentId: string }) {
  const { pending, error, submit } = useSubmit();
  return (
    <div className="bg-card flex flex-col gap-3 rounded-2xl border p-4 sm:p-5">
      <ErrorNote error={error} />
      <Button
        size="lg"
        disabled={pending}
        onClick={() => submit(() => confirmEquipmentAction(equipmentId))}
        className="w-full sm:w-auto"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Check className="size-4" />
        )}{" "}
        I received it
      </Button>
    </div>
  );
}
