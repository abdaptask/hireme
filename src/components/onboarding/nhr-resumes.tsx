"use client";

/* ---------------------------------------------------------------------------
   NHR resumes (§20 document intelligence, §10.3 form data extraction).
   The Recruiting Manager attaches the raw and formatted resumes; the raw one
   is parsed straight away to pre-fill empty NHR fields and show the skills
   that will go into the talent pool.
   --------------------------------------------------------------------------- */

import { useRef, useState } from "react";
import { AlertCircle, FileText, Loader2, Sparkles, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResumeProfile } from "@/lib/talent/profile";

export type ResumeFiles = { raw: File | null; formatted: File | null };

const ACCEPT =
  ".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";

function size(n: number) {
  return n > 1024 * 1024
    ? `${(n / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(n / 1024))} KB`;
}

function Picker({
  label,
  hint,
  file,
  error,
  onChange,
}: {
  label: string;
  hint: string;
  file: File | null;
  error?: string;
  onChange: (f: File | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
        {label}
        <span className="text-danger-muted-foreground"> *</span>
      </span>
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          onChange(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
      {file ? (
        <div className="bg-background flex h-9 items-center gap-2 rounded-md border px-2.5 text-sm">
          <FileText className="text-muted-foreground size-4 shrink-0" />
          <span className="truncate">{file.name}</span>
          <span className="text-muted-foreground shrink-0 text-xs">
            {size(file.size)}
          </span>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground ml-auto rounded p-0.5"
            aria-label={`Remove ${label.toLowerCase()}`}
            onClick={() => onChange(null)}
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          aria-label={`Choose ${label.toLowerCase()}`}
          data-invalid={!!error || undefined}
          className="text-muted-foreground hover:bg-muted/60 data-[invalid=true]:border-danger flex h-9 items-center gap-2 rounded-md border border-dashed px-2.5 text-sm transition-colors"
        >
          <Upload className="size-4" /> Choose file…
        </button>
      )}
      {error ? (
        <span className="text-danger-muted-foreground text-xs">{error}</span>
      ) : (
        <span className="text-muted-foreground text-xs">{hint}</span>
      )}
    </div>
  );
}

export function NhrResumes({
  files,
  onFiles,
  errors,
  onParsed,
}: {
  files: ResumeFiles;
  onFiles: (f: ResumeFiles) => void;
  errors: { raw?: string; formatted?: string };
  /** Called with the parsed raw resume; returns the NHR fields it filled. */
  onParsed: (p: ResumeProfile) => string[];
}) {
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<{
    profile: ResumeProfile;
    parser: string;
    note: string | null;
    filled: string[];
  } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  async function chooseRaw(file: File | null) {
    onFiles({ ...files, raw: file });
    setResult(null);
    setParseError(null);
    if (!file) return;
    setParsing(true);
    try {
      const body = new FormData();
      body.set("file", file);
      const json = await (
        await fetch("/api/resumes/parse", { method: "POST", body })
      ).json();
      if (!json.ok) setParseError(json.error);
      else
        setResult({
          profile: json.profile,
          parser: json.parser,
          note: json.note,
          filled: onParsed(json.profile),
        });
    } catch {
      setParseError(
        "Couldn't read the resume right now — you can still submit; it's analyzed again on save.",
      );
    } finally {
      setParsing(false);
    }
  }

  const p = result?.profile;
  return (
    <section className="bg-card rounded-xl border shadow-xs">
      <div className="bg-primary/[0.04] flex items-center gap-2 border-b px-4 py-2.5">
        <h2 className="text-card-heading">Resumes</h2>
        <span className="text-muted-foreground ml-auto text-xs">
          PDF, Word (.docx) or text · up to 10 MB
        </span>
      </div>
      <div className="grid grid-cols-1 gap-x-4 gap-y-3 p-4 sm:grid-cols-2">
        <Picker
          label="Raw resume"
          hint="As the candidate sent it — builds their skills profile"
          file={files.raw}
          error={errors.raw}
          onChange={chooseRaw}
        />
        <Picker
          label="Formatted resume"
          hint="The formatted version submitted to the client"
          file={files.formatted}
          error={errors.formatted}
          onChange={(f) => onFiles({ ...files, formatted: f })}
        />

        {parsing && (
          <p
            className="text-muted-foreground flex items-center gap-2 text-sm sm:col-span-2"
            aria-live="polite"
          >
            <Loader2 className="size-4 animate-spin" /> Reading the resume…
          </p>
        )}
        {parseError && (
          <p
            role="alert"
            className="bg-warning-muted text-warning-muted-foreground flex items-start gap-2 rounded-lg px-3 py-2 text-sm sm:col-span-2"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" /> {parseError}
          </p>
        )}
        {p && result && (
          <div
            className="bg-muted/40 flex flex-col gap-2 rounded-lg border p-3 text-sm sm:col-span-2"
            aria-live="polite"
          >
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Sparkles className="text-primary size-4" />
              <strong>{p.skillFamily ?? "No primary specialty found"}</strong>
              {p.currentTitle && (
                <span className="text-muted-foreground">{p.currentTitle}</span>
              )}
              {p.yearsExperience !== null && (
                <span className="text-muted-foreground">
                  · {p.yearsExperience} yrs
                </span>
              )}
              {p.seniority && (
                <span className="text-muted-foreground">· {p.seniority}</span>
              )}
              <span className="text-muted-foreground ml-auto text-xs">
                {result.parser} · {Math.round(p.confidence * 100)}% signal
              </span>
            </div>
            {p.skills.length > 0 && (
              <ul className="flex flex-wrap gap-1.5" aria-label="Skills found">
                {p.skills.slice(0, 15).map((s) => (
                  <li
                    key={s.name}
                    className="bg-background rounded-full border px-2 py-0.5 text-xs"
                  >
                    {s.name}
                  </li>
                ))}
              </ul>
            )}
            {p.certifications.length > 0 && (
              <p className="text-muted-foreground text-xs">
                Certifications: {p.certifications.join(", ")}
              </p>
            )}
            <p
              className={cn(
                "text-xs",
                result.filled.length
                  ? "text-success-muted-foreground"
                  : "text-muted-foreground",
              )}
            >
              {result.filled.length
                ? `Pre-filled from the resume: ${result.filled.join(", ")}. Check them before submitting.`
                : "Nothing pre-filled — the fields the resume covers were already entered."}
            </p>
            {[...p.warnings, ...(result.note ? [result.note] : [])].map((w) => (
              <p key={w} className="text-warning-muted-foreground text-xs">
                {w}
              </p>
            ))}
          </div>
        )}
        {!files.raw && !p && (
          <p className="text-muted-foreground text-xs sm:col-span-2">
            Add the raw resume first — name, email, phone and location are
            pre-filled from it wherever the NHR is still blank.
          </p>
        )}
      </div>
    </section>
  );
}

/** Fill blank NHR fields from a parsed resume; returns the labels of fields filled. */
export function resumeAutofill<T extends object>(
  f: T,
  p: ResumeProfile,
): { next: T; filled: string[] } {
  const next = { ...f } as Record<string, unknown>;
  const filled: string[] = [];
  const put = (key: string, label: string, v: string | null | undefined) => {
    if (v && !String(next[key] ?? "").trim()) {
      next[key] = v;
      filled.push(label);
    }
  };
  const parts = (p.fullName ?? "").split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    put("firstName", "first name", parts[0]);
    put("lastName", "last name", parts[parts.length - 1]);
  }
  put("email", "email", p.email);
  const digits = (p.phone ?? "").replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  if (digits.length === 10)
    put("cellPhone", "cell #", `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`);
  const loc = p.location?.match(/^(.+?),\s*([A-Z]{2})(?:\s+(\d{5}))?$/);
  if (loc) {
    put("city", "city", loc[1]);
    put("state", "state", loc[2]);
    put("zip", "zip", loc[3]);
  }
  return { next: next as T, filled };
}
