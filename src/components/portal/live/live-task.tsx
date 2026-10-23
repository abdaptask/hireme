/**
 * Live portal task page (§101.2): why the item is required, its status, any
 * correction needed, and the right way to complete it.
 */

import Link from "next/link";
import { AlertTriangle, ArrowLeft, Check, Clock, ExternalLink, Info, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { getPortalTask } from "@/lib/onboarding/service";
import { ConsentTask, EquipmentTask, FormTask, TrainingTask, UploadTask } from "./task-forms";

type LiveTaskData = NonNullable<Awaited<ReturnType<typeof getPortalTask>>>;

function Notice({ tone, title, children }: { tone: "info" | "success" | "danger"; title: string; children?: React.ReactNode }) {
  const cls = { info: "bg-info-muted text-info-muted-foreground", success: "bg-success-muted text-success-muted-foreground", danger: "bg-danger-muted text-danger-muted-foreground" }[tone];
  const Icon = tone === "success" ? Check : tone === "danger" ? AlertTriangle : Info;
  return (
    <div className={`flex items-start gap-3 rounded-2xl p-4 ${cls}`}>
      <Icon className="mt-0.5 size-4.5 shrink-0" />
      <div className="text-sm">
        <p className="font-medium">{title}</p>
        {children && <div className="mt-0.5 opacity-90">{children}</div>}
      </div>
    </div>
  );
}

export function LiveTask({ task }: { task: LiveTaskData }) {
  let title = "";
  let why = "";
  let estimate = "";
  let body: React.ReactNode = null;

  if (task.kind === "document") {
    const { doc, template } = task;
    title = doc.name;
    why = template.why;
    estimate = `${template.estimateMin} min`;
    const needsMe = ["PENDING", "REJECTED", "CORRECTION_REQUIRED", "EXPIRED"].includes(doc.status);
    body = (
      <>
        {doc.rejectedReason && needsMe && (
          <Notice tone="danger" title="Your onboarding specialist asked for a correction">
            {doc.rejectedReason}
          </Notice>
        )}
        {doc.status === "APPROVED" && <Notice tone="success" title={`Approved${doc.reviewedBy ? ` by ${doc.reviewedBy}` : ""}`} />}
        {(doc.status === "SUBMITTED" || doc.status === "AI_REVIEW") && (
          <Notice tone="info" title="Submitted — in review">
            No action needed. Typical review time is under one business day; we&apos;ll message you if anything needs fixing.
          </Notice>
        )}
        {doc.fileUrl && !needsMe && (
          <Button variant="outline" nativeButton={false} render={<a href={`${doc.fileUrl}?as=candidate`} target="_blank" rel="noreferrer" />}>
            <ExternalLink className="size-4" /> View what you submitted
          </Button>
        )}
        {needsMe && (template.kind === "form" ? <FormTask docId={doc.id} fields={template.fields ?? []} candidateName={task.name} title={doc.name} /> : <UploadTask docId={doc.id} hint={template.hint} needsExpiry={!!template.expires} />)}
      </>
    );
  } else if (task.kind === "screening") {
    const s = task.screening;
    title = `${s.packageType ?? "Background check"} — consent`;
    why = "Your client requires this screening before your start date.";
    estimate = "2 min";
    body = s.consentedAt ? (
      <Notice tone={s.status === "CLEAR" ? "success" : "info"} title={s.status === "CLEAR" ? "Complete" : "In progress with the screening provider"}>
        {s.status === "CLEAR" ? "Your screening is complete." : "Most screenings finish in 2–5 business days. Results stay confidential."}
      </Notice>
    ) : (
      <ConsentTask screeningId={s.id} candidateName={task.name} vendor={s.vendor} packageType={s.packageType ?? "background check"} />
    );
  } else if (task.kind === "training") {
    const t = task.training;
    title = t.title;
    why = "Required before you get system access.";
    estimate = "10 min";
    body =
      t.status === "COMPLETED" ? (
        <Notice tone="success" title={`Completed — score ${t.score}%`} />
      ) : (
        <>
          {t.status === "FAILED" && <Notice tone="danger" title={`Last attempt scored ${t.score}% — 70% needed. Please try again.`} />}
          <TrainingTask trainingId={t.id} title={t.title} category={t.category} />
        </>
      );
  } else {
    const e = task.equipment;
    title = e.label;
    why = e.assetType === "Badge" ? "Your building badge for Day 1." : "Your work laptop, shipped to your address.";
    estimate = "1 min";
    body = (
      <>
        {e.trackingNumber && (
          <Notice tone="info" title={`${e.carrier} tracking ${e.trackingNumber}`}>
            <span className="inline-flex items-center gap-1">
              <Truck className="size-3.5" /> {e.status === "DELIVERED" ? "Delivered" : `Estimated delivery ${e.estimatedDelivery?.toLocaleDateString("en-US", { month: "short", day: "numeric" }) ?? "soon"}`}
            </span>
          </Notice>
        )}
        {["SHIPPED", "DELIVERED"].includes(e.status) ? (
          <EquipmentTask equipmentId={e.id} />
        ) : ["ENROLLED", "READY"].includes(e.status) ? (
          <Notice tone="success" title="Received — thanks for confirming" />
        ) : (
          <Notice tone="info" title="Being prepared">
            IT is setting this up. You&apos;ll get a tracking number here once it ships.
          </Notice>
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Link href="/portal" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm">
        <ArrowLeft className="size-4" /> Back to onboarding
      </Link>
      <div>
        <h1 className="text-page-title">{title}</h1>
        <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
          <Clock className="size-3" /> {estimate}
        </p>
      </div>
      <p className="bg-card rounded-2xl border p-4 text-sm">
        <span className="font-medium">Why this is needed: </span>
        {why}
      </p>
      {body}
    </div>
  );
}
