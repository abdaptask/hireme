"use client";

/* ---------------------------------------------------------------------------
   Candidate 360 — Resume & skills (§15, §20). Both resumes on file, plus the
   skills profile extracted from the raw one, with its source and confidence
   shown so the analysis is never a black box (§2.3).
   --------------------------------------------------------------------------- */

import { useState, useTransition } from "react";
import { AlertTriangle, Download, Eye, FileText, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reanalyzeResumeAction } from "@/lib/actions/talent";
import { PARSER_LABEL, type ParserId, type ResumeProfile } from "@/lib/talent/profile";

export type ResumeView = {
  files: { id: string; kind: "raw" | "formatted"; fileName: string; size: number; uploadedBy: string; uploadedAt: string }[];
  profile: ResumeProfile | null;
  parser: ParserId | null;
  parsedAt: string | null;
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="text-muted-foreground w-36 shrink-0">{label}</dt>
      <dd className="min-w-0 font-medium break-words">{children}</dd>
    </div>
  );
}

export function ResumePanel({
  candidateId,
  view,
  canRerun,
  claudeReady,
}: {
  candidateId: string;
  view: ResumeView;
  canRerun: boolean;
  claudeReady: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const p = view.profile;

  return (
    <div className="flex flex-col gap-3">
      <section className="bg-card rounded-xl border shadow-xs">
        <h3 className="text-card-heading bg-primary/[0.04] border-b px-4 py-2">Resumes on file</h3>
        <ul className="divide-y">
          {view.files.map((f) => (
            <li key={f.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm">
              <FileText className="text-muted-foreground size-4" />
              <span className="font-medium">{f.kind === "raw" ? "Raw resume" : "Formatted resume"}</span>
              <span className="text-muted-foreground truncate">{f.fileName}</span>
              <span className="text-muted-foreground text-xs">
                {Math.max(1, Math.round(f.size / 1024))} KB · {f.uploadedBy} · {fmtDate(f.uploadedAt)}
              </span>
              <span className="ml-auto flex gap-1">
                <Button size="sm" variant="ghost" nativeButton={false} render={<a href={`/api/resumes/${f.id}/file`} target="_blank" rel="noreferrer" />}>
                  <Eye className="size-4" /> View
                </Button>
                <Button size="sm" variant="ghost" nativeButton={false} render={<a href={`/api/resumes/${f.id}/file?download=1`} />}>
                  <Download className="size-4" /> Download
                </Button>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-card rounded-xl border shadow-xs">
        <div className="bg-primary/[0.04] flex flex-wrap items-center gap-2 border-b px-4 py-2">
          <h3 className="text-card-heading flex items-center gap-1.5">
            <Sparkles className="text-primary size-4" /> Skills profile
          </h3>
          {view.parser && (
            <span className="text-muted-foreground text-xs">
              {PARSER_LABEL[view.parser]} · {p ? `${Math.round(p.confidence * 100)}% signal` : ""}
              {view.parsedAt ? ` · ${fmtDate(view.parsedAt)}` : ""}
            </span>
          )}
          {canRerun && (
            <Button
              size="sm"
              variant="outline"
              className="ml-auto"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  setError(null);
                  const res = await reanalyzeResumeAction(candidateId);
                  if (!res.ok) setError(res.error);
                })
              }
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              Re-run analysis{claudeReady ? " with Claude" : ""}
            </Button>
          )}
        </div>
        {error && (
          <p role="alert" className="bg-danger-muted text-danger-muted-foreground mx-4 mt-3 rounded-lg px-3 py-2 text-sm">
            {error}
          </p>
        )}
        {!p ? (
          <p className="text-muted-foreground p-4 text-sm">The resume hasn&apos;t been analyzed yet.</p>
        ) : (
          <div className="flex flex-col gap-3 p-4 text-sm">
            <dl className="grid gap-x-6 gap-y-2 2xl:grid-cols-2">
              <Row label="Primary specialty">{p.skillFamily ?? "—"}</Row>
              <Row label="Current title">{p.currentTitle ?? "—"}</Row>
              <Row label="Experience">{p.yearsExperience !== null ? `${p.yearsExperience} years` : "—"}</Row>
              <Row label="Seniority">{p.seniority ?? "—"}</Row>
              <Row label="Location (resume)">{p.location ?? "—"}</Row>
              <Row label="Education">{p.education.length ? p.education.join("; ") : "—"}</Row>
              <Row label="Certifications">{p.certifications.length ? p.certifications.join(", ") : "—"}</Row>
              <Row label="Earlier titles">{p.titles.slice(1).join("; ") || "—"}</Row>
            </dl>
            {p.summary && <p className="text-muted-foreground leading-relaxed">{p.summary}</p>}
            {p.skills.length > 0 && (
              <div>
                <h4 className="text-muted-foreground mb-1.5 text-[11px] font-semibold tracking-wide uppercase">Skills ({p.skills.length})</h4>
                <ul className="flex flex-wrap gap-1.5">
                  {p.skills.map((s) => (
                    <li key={s.name} className="bg-muted/50 rounded-full border px-2 py-0.5 text-xs" title={`${s.family} · weight ${s.mentions}`}>
                      {s.name}
                      <span className="text-muted-foreground"> · {s.family}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {p.warnings.length > 0 && (
              <ul className="flex flex-col gap-1">
                {p.warnings.map((w) => (
                  <li key={w} className="text-warning-muted-foreground flex items-start gap-1.5 text-xs">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" /> {w}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-muted-foreground text-xs">
              {view.parser === "builtin"
                ? claudeReady
                  ? "Extracted with the built-in rules. Re-run to analyze with Claude."
                  : "Extracted with the built-in rules (no AI). Add an ANTHROPIC_API_KEY to analyze resumes with Claude."
                : "Extracted by Claude from the raw resume. Facts come only from the resume; check warnings before relying on them."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
