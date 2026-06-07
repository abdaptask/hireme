import type { Metadata } from "next";
import {
  CalendarClock,
  CheckCircle2,
  FileUp,
  Lock,
  MessageSquare,
  TriangleAlert,
  UserPlus,
  Users,
} from "lucide-react";
import { PipelineStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CURRENT_VENDOR,
  getVendorCandidates,
  type VendorCandidateView,
} from "@/lib/candidates";

export const metadata: Metadata = { title: "Vendor Portal" };

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: typeof Users;
  label: string;
  value: number;
  tone?: "default" | "warning";
}) {
  return (
    <div className="bg-card flex items-center gap-3 rounded-xl border p-4 shadow-xs">
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-lg",
          tone === "warning"
            ? "bg-warning-muted text-warning-muted-foreground"
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

function CandidateCard({ c }: { c: VendorCandidateView }) {
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
          <p className="text-muted-foreground text-sm">
            {c.role} · {c.client}
          </p>
          <p className="text-metadata">
            {c.employmentType} · {c.location}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-muted/40 rounded-lg py-2">
          <p className="text-data-label">Start</p>
          <p className="text-sm font-medium">{c.startDateLabel}</p>
          <p className="text-metadata">{c.startInDays}d</p>
        </div>
        <div className="bg-muted/40 rounded-lg py-2">
          <p className="text-data-label">Stage</p>
          <p className="truncate px-1 text-sm font-medium">{c.stage}</p>
        </div>
        <div className="bg-muted/40 rounded-lg py-2">
          <p className="text-data-label">Screening</p>
          <p className="text-sm font-medium">{c.screeningStatus}</p>
        </div>
      </div>

      {c.actionNeeded && (
        <div className="bg-warning-muted/50 text-warning-muted-foreground flex items-center gap-2 rounded-lg px-3 py-2 text-sm">
          <TriangleAlert className="size-4 shrink-0" />
          {c.actionNeeded}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline">
          <FileUp className="size-4" /> Submit documents
        </Button>
        <Button size="sm" variant="outline">
          <CheckCircle2 className="size-4" /> Confirm start date
        </Button>
        <Button size="sm" variant="ghost">
          <MessageSquare className="size-4" /> Message
        </Button>
      </div>
    </div>
  );
}

export default function VendorPortalPage() {
  const candidates = getVendorCandidates(CURRENT_VENDOR);
  const startingSoon = candidates.filter((c) => c.startInDays <= 14).length;
  const actionNeeded = candidates.filter((c) => c.actionNeeded).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-page-title">Your consultants</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Candidates {CURRENT_VENDOR} has submitted for client assignments.
          </p>
        </div>
        <Button>
          <UserPlus className="size-4" /> Submit a candidate
        </Button>
      </div>

      {/* Scoping notice (§27) */}
      <div className="text-muted-foreground flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-xs">
        <Lock className="size-3.5 shrink-0" />
        You only see consultants your firm has submitted. Pay rates, billing,
        markup, and internal notes are never shown.
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard icon={Users} label="Active consultants" value={candidates.length} />
        <StatCard
          icon={CalendarClock}
          label="Starting within 14 days"
          value={startingSoon}
        />
        <StatCard
          icon={TriangleAlert}
          label="Need your action"
          value={actionNeeded}
          tone="warning"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {candidates.map((c) => (
          <CandidateCard key={c.id} c={c} />
        ))}
      </div>

      {candidates.length === 0 && (
        <div className="text-muted-foreground rounded-xl border border-dashed py-12 text-center text-sm">
          No active consultants. Submit a candidate to get started.
        </div>
      )}

      <p className="text-muted-foreground flex items-center justify-center gap-1.5 pt-2 text-xs">
        <Badge variant="secondary" className="text-[10px]">
          C2C
        </Badge>
        Vendor-supplied consultants are tracked against your firm across all
        client assignments.
      </p>
    </div>
  );
}
