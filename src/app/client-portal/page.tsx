import type { Metadata } from "next";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Laptop,
  Lock,
  MessageSquare,
  ShieldCheck,
  Tag,
  Users,
} from "lucide-react";
import { PipelineStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CURRENT_CLIENT,
  getClientCandidates,
  type ClientCandidateView,
} from "@/lib/candidates";

export const metadata: Metadata = { title: "Client Portal" };

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: typeof Users;
  label: string;
  value: number;
  tone?: "default" | "warning" | "success";
}) {
  return (
    <div className="bg-card flex items-center gap-3 rounded-xl border p-4 shadow-xs">
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-lg",
          tone === "warning"
            ? "bg-warning-muted text-warning-muted-foreground"
            : tone === "success"
              ? "bg-success-muted text-success-muted-foreground"
              : "bg-primary/10 text-primary",
        )}
      >
        <Icon className="size-4.5" />
      </span>
      <div>
        <p className="text-xl font-semibold tabular-nums">{value}</p>
        <p className="text-metadata">{label}</p>
      </div>
    </div>
  );
}

function ReadinessChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Laptop;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-muted/40 flex flex-col gap-0.5 rounded-lg px-2.5 py-1.5">
      <span className="text-data-label flex items-center gap-1">
        <Icon className="size-3" /> {label}
      </span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function ConsultantCard({ c }: { c: ClientCandidateView }) {
  const initials = c.name.split(" ").map((n) => n[0]).join("");
  return (
    <div className="bg-card flex flex-col gap-3 rounded-xl border p-4 shadow-xs">
      <div className="flex items-start gap-3">
        <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{c.name}</p>
            <PipelineStatusBadge status={c.status} />
          </div>
          <p className="text-muted-foreground text-sm">{c.role}</p>
          <p className="text-metadata">
            {c.employmentType} · {c.location}
          </p>
        </div>
        <div className="text-right">
          <p className="text-data-label">Start</p>
          <p className="text-sm font-semibold">{c.startDateLabel}</p>
          <p className="text-metadata">{c.startInDays}d</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <ReadinessChip icon={ShieldCheck} label="Screening" value={c.screeningStatus} />
        <ReadinessChip icon={Laptop} label="Equipment" value={c.equipmentStatus} />
        <ReadinessChip
          icon={Tag}
          label="Worker ID"
          value={c.clientWorkerId ?? "Add"}
        />
      </div>

      {c.approvalNeeded && (
        <div className="bg-info-muted/50 text-info-muted-foreground flex items-center gap-2 rounded-lg px-3 py-2 text-sm">
          <ClipboardCheck className="size-4 shrink-0" />
          A package is awaiting your approval.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {c.approvalNeeded && (
          <Button size="sm">
            <CheckCircle2 className="size-4" /> Approve package
          </Button>
        )}
        <Button size="sm" variant="outline">
          <CheckCircle2 className="size-4" /> Confirm start date
        </Button>
        {!c.clientWorkerId && (
          <Button size="sm" variant="outline">
            <Tag className="size-4" /> Add worker ID
          </Button>
        )}
        <Button size="sm" variant="ghost">
          <MessageSquare className="size-4" /> Message
        </Button>
      </div>
    </div>
  );
}

export default function ClientPortalPage() {
  const consultants = getClientCandidates(CURRENT_CLIENT);
  const startingSoon = consultants.filter((c) => c.startInDays <= 14).length;
  const awaitingApproval = consultants.filter((c) => c.approvalNeeded).length;
  const cleared = consultants.filter((c) => c.screeningStatus === "Clear").length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-page-title">Your incoming consultants</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Onboarding readiness for consultants assigned to {CURRENT_CLIENT}.
          </p>
        </div>
        <Button variant="outline">
          <Download className="size-4" /> Download report
        </Button>
      </div>

      {/* Scoping notice (§27) */}
      <div className="text-muted-foreground flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-xs">
        <Lock className="size-3.5 shrink-0" />
        You only see consultants assigned to your organization. Pay rates,
        markup, and internal notes are never shown.
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Users} label="Onboarding" value={consultants.length} />
        <StatCard
          icon={CalendarClock}
          label="Starting ≤ 14 days"
          value={startingSoon}
        />
        <StatCard
          icon={ClipboardCheck}
          label="Awaiting your approval"
          value={awaitingApproval}
          tone="warning"
        />
        <StatCard
          icon={ShieldCheck}
          label="Screening clear"
          value={cleared}
          tone="success"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {consultants.map((c) => (
          <ConsultantCard key={c.id} c={c} />
        ))}
      </div>

      {consultants.length === 0 && (
        <div className="text-muted-foreground rounded-xl border border-dashed py-12 text-center text-sm">
          No incoming consultants right now.
        </div>
      )}

      <p className="text-muted-foreground flex items-center justify-center gap-1.5 pt-2 text-xs">
        <Badge variant="secondary" className="text-[10px]">
          Client view
        </Badge>
        Add client requirements or worker IDs at any time — changes flow to the
        onboarding team automatically.
      </p>
    </div>
  );
}
