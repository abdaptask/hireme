/**
 * Candidate Portal — Task Detail (§101.2, §28, §20)
 * Rich per-task flow: document upload, form fill, e-sign, etc.
 * Each task type renders its own guided sub-experience.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  Camera,
  Check,
  ChevronRight,
  Clock,
  FileText,
  HelpCircle,
  ImageUp,
  Info,
  ShieldCheck,
  Upload,
  ZoomIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PORTAL_TASKS } from "@/lib/portal-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const task = PORTAL_TASKS.find((t) => t.id === id);
  return { title: task ? `${task.title} | HireMe` : "Task" };
}

// ─── sub-components by task type ────────────────────────────

/** Government ID / document upload flow (§28, §101.3, §20) */
function UploadIDTask() {
  return (
    <div className="flex flex-col gap-4">
      {/* Rejection alert */}
      <div className="border-destructive/30 bg-destructive/8 rounded-2xl border p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-destructive mt-0.5 size-4.5 shrink-0" />
          <div>
            <p className="text-destructive text-sm font-semibold">Document rejected</p>
            <p className="text-destructive/70 mt-0.5 text-xs leading-relaxed">
              Your photo was too blurry — the expiration date wasn&apos;t readable. Please
              retake in good lighting with all four corners visible.
            </p>
          </div>
        </div>
      </div>

      {/* Before / After example */}
      <section className="bg-card rounded-2xl border p-5">
        <h2 className="text-card-heading mb-3">What a good photo looks like</h2>
        <div className="grid grid-cols-2 gap-3">
          {/* Bad example */}
          <div className="flex flex-col gap-1.5">
            <div className="bg-muted rounded-xl aspect-[3/2] flex items-center justify-center overflow-hidden relative">
              <div className="absolute inset-0 backdrop-blur-md bg-muted/60 flex items-center justify-center">
                <div className="text-center">
                  <AlertTriangle className="text-destructive mx-auto size-8 mb-1" />
                  <p className="text-destructive text-xs font-medium">Too blurry</p>
                </div>
              </div>
              <div className="w-full h-full bg-gradient-to-br from-slate-300 to-slate-500 opacity-30" />
            </div>
            <p className="text-muted-foreground text-center text-[11px]">❌ Blurry or dark</p>
          </div>
          {/* Good example */}
          <div className="flex flex-col gap-1.5">
            <div className="bg-muted rounded-xl aspect-[3/2] flex items-center justify-center border-2 border-success/40 overflow-hidden relative">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                <div className="rounded-lg border-2 border-success/60 bg-white/10 w-3/4 h-3/4 flex items-center justify-center">
                  <ShieldCheck className="text-success size-8" />
                </div>
              </div>
            </div>
            <p className="text-success text-center text-[11px] font-medium">✓ Clear all corners</p>
          </div>
        </div>
      </section>

      {/* Tips */}
      <section className="bg-card rounded-2xl border p-5">
        <h2 className="text-card-heading mb-3">Photo tips</h2>
        <ul className="flex flex-col gap-2.5">
          {[
            { icon: "☀️", tip: "Use natural or bright overhead light — avoid shadows" },
            { icon: "📐", tip: "Lay your ID flat on a dark, contrasting surface" },
            { icon: "📱", tip: "Hold your phone steady, tap the screen to focus" },
            { icon: "🔲", tip: "All four corners must be visible in the frame" },
            { icon: "📁", tip: "File must be under 10 MB (JPG, PNG, or HEIC)" },
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="text-base leading-none">{item.icon}</span>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.tip}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Upload zone */}
      <section className="bg-card rounded-2xl border p-5">
        <h2 className="text-card-heading mb-3">Upload your ID</h2>
        <div className="border-primary/30 bg-primary/5 hover:bg-primary/10 cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-colors">
          <div className="flex flex-col items-center gap-3">
            <span className="bg-primary/10 flex size-14 items-center justify-center rounded-full">
              <ImageUp className="text-primary size-7" />
            </span>
            <div>
              <p className="text-sm font-medium">Drop your photo here</p>
              <p className="text-muted-foreground mt-0.5 text-xs">or tap to browse files</p>
            </div>
          </div>
        </div>

        {/* Mobile camera + upload buttons */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Button variant="outline" className="flex-1 h-12 flex-col gap-1" size="lg">
            <Camera className="size-5" />
            <span className="text-xs">Take photo</span>
          </Button>
          <Button variant="outline" className="flex-1 h-12 flex-col gap-1" size="lg">
            <Upload className="size-5" />
            <span className="text-xs">Upload file</span>
          </Button>
        </div>

        {/* AI quality scan notice */}
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-violet-500/8 p-3">
          <Bot className="text-violet-500 size-4 shrink-0" />
          <p className="text-violet-600 dark:text-violet-400 text-xs leading-relaxed">
            AI Concierge will automatically check photo quality before submitting — no manual review needed if it passes.
          </p>
        </div>
      </section>

      {/* Accepted IDs */}
      <section className="bg-card rounded-2xl border p-5">
        <h2 className="text-card-heading mb-2">Accepted documents</h2>
        <p className="text-muted-foreground text-xs mb-3">Any one of the following:</p>
        <ul className="flex flex-col gap-2">
          {[
            "U.S. Passport or Passport Card",
            "State Driver's License or ID card",
            "U.S. Military ID card",
            "Permanent Resident Card (Green Card)",
            "Employment Authorization Document",
          ].map((doc, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <Check className="text-success size-4 shrink-0" />
              {doc}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/** I-9 Section 1 form (§20 — federal work authorization) */
function I9Task() {
  return (
    <div className="flex flex-col gap-4">
      {/* What this is */}
      <section className="bg-card rounded-2xl border p-5">
        <div className="flex items-start gap-3">
          <span className="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-full">
            <ShieldCheck className="text-primary size-4.5" />
          </span>
          <div>
            <p className="text-sm font-semibold">What is an I-9?</p>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              The Employment Eligibility Verification form (I-9) is required by federal law for
              every person hired to work in the United States. It verifies your identity and
              authorization to work here.
            </p>
          </div>
        </div>
      </section>

      {/* What you need */}
      <section className="bg-card rounded-2xl border p-5">
        <h2 className="text-card-heading mb-3">What you&apos;ll need</h2>
        <ul className="flex flex-col gap-2.5">
          {[
            { label: "Legal full name", note: "Exactly as it appears on your ID" },
            { label: "Social Security Number", note: "For identity verification" },
            { label: "Date of birth", note: "Must match your ID" },
            { label: "Address", note: "Current residential address" },
            { label: "Citizenship status", note: "U.S. citizen, national, or authorization type" },
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="bg-primary/10 text-primary mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-muted-foreground text-xs">{item.note}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-500/8 p-2.5">
          <Info className="text-amber-500 mt-0.5 size-3.5 shrink-0" />
          <p className="text-amber-600 dark:text-amber-400 text-xs leading-relaxed">
            Your Social Security Number is encrypted in transit and stored with AES-256 encryption. It is never shared with your client.
          </p>
        </div>
      </section>

      {/* Form fields */}
      <section className="bg-card rounded-2xl border p-5">
        <h2 className="text-card-heading mb-4">I-9 Section 1</h2>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium">First name *</label>
              <input
                type="text"
                defaultValue="Sarah"
                className="bg-muted/40 focus:ring-primary/50 rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium">Last name *</label>
              <input
                type="text"
                defaultValue="Chen"
                className="bg-muted/40 focus:ring-primary/50 rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium">Middle name (optional)</label>
            <input
              type="text"
              placeholder="Enter middle name"
              className="bg-muted/40 focus:ring-primary/50 rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium">Date of birth *</label>
            <input
              type="date"
              className="bg-muted/40 focus:ring-primary/50 rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium">Social Security Number *</label>
            <input
              type="text"
              placeholder="XXX-XX-XXXX"
              className="bg-muted/40 focus:ring-primary/50 rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2"
            />
            <p className="text-muted-foreground text-xs">Encrypted and protected by FIPS-140-2 standards.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium">Citizenship / immigration status *</label>
            <select className="bg-muted/40 focus:ring-primary/50 rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2">
              <option value="">Select status…</option>
              <option>U.S. Citizen</option>
              <option>U.S. National</option>
              <option>Lawful Permanent Resident</option>
              <option>Alien authorized to work</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-lg bg-muted/50 p-3">
          <Bot className="text-violet-500 mt-0.5 size-3.5 shrink-0" />
          <p className="text-muted-foreground text-xs leading-relaxed">
            AI Concierge pre-filled your name from your profile. Verify all fields before submitting.
          </p>
        </div>
      </section>

      <Button size="lg" className="w-full h-12">
        Submit I-9 Section 1
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}

/** Client NDA e-sign (§20 — e-signature) */
function NDATask() {
  return (
    <div className="flex flex-col gap-4">
      {/* Client info */}
      <section className="bg-card rounded-2xl border p-5">
        <div className="flex items-center gap-3 mb-3">
          <span className="bg-primary/10 flex size-9 shrink-0 items-center justify-center rounded-full">
            <FileText className="text-primary size-4.5" />
          </span>
          <div>
            <p className="text-sm font-semibold">Meridian Health — Mutual NDA</p>
            <p className="text-muted-foreground text-xs">Version 2.1 · Effective Jun 2026</p>
          </div>
        </div>
        <div className="bg-muted/40 rounded-xl p-4">
          <p className="text-muted-foreground text-xs leading-relaxed">
            This Mutual Non-Disclosure Agreement (&quot;Agreement&quot;) is entered into as of the date
            of signature between Meridian Health Systems, Inc. (&quot;Meridian&quot;) and you, the
            contractor (&quot;Contractor&quot;), placed through ApTask Workforce Solutions.
          </p>
          <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
            <strong className="text-foreground">Scope:</strong> Covers any confidential information, including patient data, clinical
            systems, financial information, and proprietary processes you may encounter during your
            assignment. Patient data is additionally protected under HIPAA.
          </p>
          <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
            <strong className="text-foreground">Duration:</strong> 2 years following the end of assignment.
          </p>
          <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
            <strong className="text-foreground">Exclusions:</strong> Information in the public domain or received from a third party
            not bound by confidentiality obligations.
          </p>
          <Button variant="outline" size="sm" className="mt-3 w-full flex gap-2">
            <ZoomIn className="size-4" /> View full document (PDF)
          </Button>
        </div>
      </section>

      {/* AI summary */}
      <div className="flex items-start gap-3 rounded-2xl bg-violet-500/8 border border-violet-500/20 p-4">
        <Bot className="text-violet-500 mt-0.5 size-4.5 shrink-0" />
        <div>
          <p className="text-violet-700 dark:text-violet-300 text-sm font-medium">AI Concierge summary</p>
          <p className="text-violet-600/80 dark:text-violet-400/80 mt-1 text-xs leading-relaxed">
            This is a standard mutual NDA — both you and Meridian agree to keep each other&apos;s information
            confidential. It lasts 2 years after your assignment ends and includes HIPAA protections for any
            patient data you encounter. This is not unusual for healthcare clients.
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="bg-success/20 text-success rounded px-1.5 py-0.5 text-[10px] font-medium">
              Low risk
            </span>
            <span className="text-violet-500/60 text-[10px]">Confidence: 97%</span>
          </div>
        </div>
      </div>

      {/* Signature */}
      <section className="bg-card rounded-2xl border p-5">
        <h2 className="text-card-heading mb-3">Your e-signature</h2>
        <div className="bg-muted/40 rounded-xl border border-dashed p-6 text-center">
          <p className="text-muted-foreground text-sm">Sign here</p>
          <div className="mt-3 border-b border-border/60 pb-2">
            <span className="font-signature text-foreground/40 text-3xl italic select-none">
              Sarah Chen
            </span>
          </div>
          <p className="text-muted-foreground mt-2 text-xs">Tap to sign using your full legal name</p>
        </div>

        <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="size-3.5 shrink-0 mt-0.5" />
          <p>
            By signing, you confirm you have read the full agreement. Your signature is legally
            binding and will be added to an audit trail including timestamp, IP address, and device info.
          </p>
        </div>
      </section>

      <Button size="lg" className="w-full h-12">
        Sign Document
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}

/** Direct deposit setup */
function DirectDepositTask() {
  return (
    <div className="flex flex-col gap-4">
      <section className="bg-card rounded-2xl border p-5">
        <div className="flex items-start gap-3 mb-4">
          <span className="bg-success/10 flex size-9 shrink-0 items-center justify-center rounded-full">
            <ShieldCheck className="text-success size-4.5" />
          </span>
          <div>
            <p className="text-sm font-semibold">Direct deposit setup</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              Secure bank connection via 256-bit encryption. ApTask will never store your full account number in plain text.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium">Bank name *</label>
            <input
              type="text"
              placeholder="e.g. Chase, Bank of America…"
              className="bg-muted/40 focus:ring-primary/50 rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium">Routing number (9 digits) *</label>
            <input
              type="text"
              placeholder="e.g. 021000021"
              maxLength={9}
              className="bg-muted/40 focus:ring-primary/50 rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 font-mono"
            />
            <p className="text-muted-foreground text-xs">Found at the bottom-left of a check or in your banking app.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium">Account number *</label>
            <input
              type="text"
              placeholder="Enter account number"
              className="bg-muted/40 focus:ring-primary/50 rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 font-mono"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium">Account type *</label>
            <div className="grid grid-cols-2 gap-2">
              <button className="bg-primary/10 border-primary text-primary rounded-lg border py-2.5 text-sm font-medium">
                Checking
              </button>
              <button className="bg-muted/40 rounded-lg border py-2.5 text-sm text-muted-foreground">
                Savings
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-start gap-2 rounded-xl bg-amber-500/8 p-3">
        <Info className="text-amber-500 size-3.5 shrink-0 mt-0.5" />
        <p className="text-amber-600 dark:text-amber-400 text-xs leading-relaxed">
          A micro-deposit of $0.01 will verify your account within 1–2 business days. Your payroll won&apos;t activate until verification is complete.
        </p>
      </div>

      <Button size="lg" className="w-full h-12">
        Save bank information
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}

/** Generic task detail (for tasks without a dedicated flow) */
function GenericTask({ taskId }: { taskId: string }) {
  const task = PORTAL_TASKS.find((t) => t.id === taskId);
  if (!task) return notFound();

  return (
    <div className="flex flex-col gap-4">
      <section className="bg-card rounded-2xl border p-5">
        <div className="flex items-start gap-3">
          <span className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full",
            task.status === "completed" ? "bg-success/10" : "bg-primary/10",
          )}>
            {task.status === "completed" ? (
              <Check className="text-success size-4.5" />
            ) : (
              <FileText className="text-primary size-4.5" />
            )}
          </span>
          <div>
            <p className="text-sm font-semibold">{task.title}</p>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{task.why}</p>
          </div>
        </div>
        {task.impact && (
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted/50 p-3">
            <Info className="text-muted-foreground size-3.5 shrink-0 mt-0.5" />
            <p className="text-muted-foreground text-xs leading-relaxed">{task.impact}</p>
          </div>
        )}
      </section>

      <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
        <Clock className="text-muted-foreground size-4 shrink-0" />
        <span className="text-sm">{task.estimate}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground text-sm">{task.due}</span>
      </div>

      {task.status === "completed" && (
        <div className="flex items-center gap-3 rounded-xl bg-success/8 border border-success/20 p-4">
          <Check className="text-success size-5 shrink-0" />
          <p className="text-success text-sm font-medium">This task is complete</p>
        </div>
      )}

      {task.aiHint && task.status !== "completed" && (
        <div className="flex items-start gap-3 rounded-2xl bg-violet-500/8 border border-violet-500/20 p-4">
          <Bot className="text-violet-500 mt-0.5 size-4.5 shrink-0" />
          <p className="text-violet-600 dark:text-violet-400 text-sm leading-relaxed">{task.aiHint}</p>
        </div>
      )}

      {(task.status === "pending" || task.status === "rejected") && (
        <Button size="lg" className="w-full h-12">
          {task.ctaLabel ?? "Start task"}
          <ChevronRight className="size-4" />
        </Button>
      )}
    </div>
  );
}

// ─── page ────────────────────────────────────────────────────

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const task = PORTAL_TASKS.find((t) => t.id === id);
  if (!task) notFound();

  const isCompleted = task.status === "completed";
  const isInReview = task.status === "in-review";

  return (
    <div className="flex flex-col gap-4">
      {/* Back */}
      <Link
        href="/portal"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
      >
        <ArrowLeft className="size-4" /> Back to onboarding
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-page-title">{task.title}</h1>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" /> {task.estimate}
          </span>
          <span>·</span>
          <span>{task.due}</span>
          {isCompleted && (
            <>
              <span>·</span>
              <span className="text-success font-medium flex items-center gap-1">
                <Check className="size-3" /> Completed
              </span>
            </>
          )}
          {isInReview && (
            <>
              <span>·</span>
              <span className="text-blue-500 font-medium">In review</span>
            </>
          )}
        </div>
      </div>

      {/* In review notice */}
      {isInReview && (
        <div className="flex items-start gap-3 rounded-2xl bg-blue-500/8 border border-blue-500/20 p-4">
          <HelpCircle className="text-blue-500 mt-0.5 size-4.5 shrink-0" />
          <div>
            <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Currently in review</p>
            <p className="text-blue-500/80 mt-0.5 text-xs leading-relaxed">
              Your submission is being reviewed by your onboarding specialist. No action needed — we&apos;ll notify you if anything requires attention. Typical review time is 1–2 business days.
            </p>
          </div>
        </div>
      )}

      {/* Task-specific content */}
      {id === "id-upload" && <UploadIDTask />}
      {id === "i9" && <I9Task />}
      {id === "nda" && <NDATask />}
      {id === "direct-deposit" && <DirectDepositTask />}
      {id !== "id-upload" && id !== "i9" && id !== "nda" && id !== "direct-deposit" && (
        <GenericTask taskId={id} />
      )}

      {/* Help footer */}
      <div className="bg-card rounded-2xl border p-4 flex items-center gap-3">
        <Bot className="text-violet-500 size-4.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Have a question?</p>
          <p className="text-muted-foreground text-xs">AI Concierge can explain anything about this step.</p>
        </div>
        <Button variant="outline" size="sm">Ask AI</Button>
      </div>
    </div>
  );
}
