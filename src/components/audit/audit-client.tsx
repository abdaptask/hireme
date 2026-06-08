"use client";

/**
 * Audit Center interactive surface (§26, §66).
 *
 * Renders the KPI tiles, filter toolbar, dense audit table, a right-side
 * event detail Sheet, and the "Generate Audit Packet" modal. DB-sourced
 * events are flagged with a live indicator (green dot) so reviewers can
 * tell at a glance which rows came from Neon vs. the mock seed.
 */

import { useMemo, useState } from "react";
import {
  AlertOctagon,
  CheckCircle2,
  FileArchive,
  FileCheck2,
  History,
  Mail,
  RadioTower,
  RefreshCcw,
  Search,
  Shield,
  Signature,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";
import { StatTile } from "@/components/workspace/stat-tile";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { EVENT_TYPE_META } from "@/lib/audit";
import type { AuditEvent, AuditEventType } from "@/lib/audit";

// ─────────────────────────────────────────────────────────
// Types and constants
// ─────────────────────────────────────────────────────────

/** An AuditEvent enriched with a `live` flag (DB-sourced) and source label. */
export type AuditRow = AuditEvent & {
  live?: boolean;
  /** "live" | "mock" — used for the data freshness footer + row dot. */
  source?: "live" | "mock";
};

const SEVERITY_TONE = {
  info: "neutral",
  warning: "warning",
  critical: "danger",
} as const;

const EVENT_TYPE_OPTIONS: { key: AuditEventType | "all"; label: string }[] = [
  { key: "all", label: "All Types" },
  { key: "login", label: "Login" },
  { key: "record-view", label: "Record View" },
  { key: "record-edit", label: "Record Edit" },
  { key: "approval", label: "Approval" },
  { key: "override", label: "Override" },
  { key: "ai-action", label: "AI Action" },
  { key: "export", label: "Export" },
  { key: "permission-change", label: "Permission Change" },
  { key: "document-download", label: "Doc Download" },
  { key: "integration-event", label: "Integration" },
];

// Mock evidence shown inside the audit-packet preview modal. Each section
// matches one of the items the spec calls out (§26 audit packet contents).
const PACKET_SECTIONS: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  detail: string;
}[] = [
  {
    icon: FileCheck2,
    title: "Completed forms",
    detail: "12 forms (I-9, W-4, state withholding, client NDA, …)",
  },
  {
    icon: Signature,
    title: "Signature evidence",
    detail: "8 e-sign envelopes with timestamp + IP + certificate",
  },
  {
    icon: Mail,
    title: "Communication history",
    detail: "37 messages — email, SMS, portal, internal notes",
  },
  {
    icon: CheckCircle2,
    title: "Approval history",
    detail: "6 approvals — package, waivers, rate change, start date",
  },
  {
    icon: Shield,
    title: "Screening status",
    detail: "Background + drug screen — vendor, status, completion date",
  },
  {
    icon: FileArchive,
    title: "Accepted policy version",
    detail: "Acceptable Use v3.2, Privacy Notice v2.0, Client A NDA v2.1",
  },
  {
    icon: TriangleAlert,
    title: "Override explanations",
    detail: "2 overrides with approver, reason, expiration, evidence",
  },
  {
    icon: RadioTower,
    title: "Integration logs",
    detail: "ADP / Bullhorn / HireRight payloads + correlation IDs",
  },
];

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

type Stats = {
  total: number;
  critical: number;
  aiActions: number;
  overrides: number;
};

function computeStats(rows: AuditRow[]): Stats {
  return {
    total: rows.length,
    critical: rows.filter((e) => e.severity === "critical").length,
    aiActions: rows.filter((e) => e.aiInvolved).length,
    overrides: rows.filter((e) => e.eventType === "override").length,
  };
}

// ─────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────

export type AuditClientProps = {
  /** Full merged dataset (DB rows first, mock rows second). */
  events: AuditRow[];
  /** ISO timestamp of when the server rendered this page. */
  fetchedAt: string;
  /** Count of DB-sourced rows in the dataset. */
  liveCount: number;
  /** Approximate total events in the underlying system (for the freshness line). */
  totalUniverse: number;
};

export function AuditClient({
  events,
  fetchedAt,
  liveCount,
  totalUniverse,
}: AuditClientProps) {
  const stats = useMemo(() => computeStats(events), [events]);

  const [query, setQuery] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState<
    AuditEventType | "all"
  >("all");
  const [selected, setSelected] = useState<AuditRow | null>(null);
  const [packetOpen, setPacketOpen] = useState(false);

  const rows = useMemo(() => {
    let result = events;

    if (eventTypeFilter !== "all") {
      result = result.filter((e) => e.eventType === eventTypeFilter);
    }

    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter((e) =>
        [
          e.actor,
          e.actorRole,
          e.target,
          e.action,
          e.targetType,
          e.notes ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }

    return result;
  }, [events, query, eventTypeFilter]);

  const freshness = useMemo(
    () => relativeTime(new Date(fetchedAt)),
    [fetchedAt],
  );

  return (
    <>
      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={History} label="Total events" value={stats.total} />
        <StatTile
          icon={AlertOctagon}
          label="Critical events"
          value={stats.critical}
          tone="danger"
        />
        <StatTile
          icon={Sparkles}
          label="AI actions"
          value={stats.aiActions}
          tone="ai"
        />
        <StatTile
          icon={TriangleAlert}
          label="Overrides"
          value={stats.overrides}
          tone="warning"
        />
      </div>

      {/* Freshness + packet action strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="text-muted-foreground flex flex-wrap items-center gap-2">
          <RefreshCcw className="size-3" />
          <span>
            Last refreshed{" "}
            <span className="text-foreground font-medium">{freshness}</span>
          </span>
          <span aria-hidden>·</span>
          <span>
            <span className="text-foreground tabular-nums">
              {events.length.toLocaleString()}
            </span>{" "}
            of{" "}
            <span className="tabular-nums">
              {totalUniverse.toLocaleString()}
            </span>{" "}
            events shown
          </span>
          {liveCount > 0 && (
            <>
              <span aria-hidden>·</span>
              <span className="text-success inline-flex items-center gap-1">
                <span className="bg-success size-1.5 animate-pulse rounded-full" />
                {liveCount} live from DB
              </span>
            </>
          )}
        </div>

        <Dialog open={packetOpen} onOpenChange={setPacketOpen}>
          <DialogTrigger
            render={
              <Button size="sm" variant="outline" className="h-7 gap-1.5">
                <FileArchive className="size-3.5" />
                Generate Audit Packet
              </Button>
            }
          />
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileArchive className="text-primary size-4" />
                Generate Audit Packet
              </DialogTitle>
              <DialogDescription>
                Preview of the evidence bundle that will be exported. All
                downloads are recorded in the audit log (§66.3).
              </DialogDescription>
            </DialogHeader>

            <ul className="divide-y rounded-lg border">
              {PACKET_SECTIONS.map(({ icon: Icon, title, detail }) => (
                <li
                  key={title}
                  className="flex items-start gap-3 px-3 py-2.5"
                >
                  <span className="bg-muted text-muted-foreground mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md">
                    <Icon className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{title}</div>
                    <div className="text-muted-foreground text-xs">
                      {detail}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPacketOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled
                title="Packet export lands in v0.9"
                className="gap-1.5"
              >
                <FileArchive className="size-3.5" />
                Export packet (PDF + ZIP)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Audit log table */}
      <section className="bg-card overflow-hidden rounded-xl border shadow-xs">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2.5">
          <h2 className="text-card-heading">Audit Log</h2>

          {/* Search */}
          <div className="bg-muted/60 focus-within:ring-ring flex h-8 w-full items-center gap-2 rounded-md border px-2.5 focus-within:ring-2 sm:w-64">
            <Search className="text-muted-foreground size-3.5 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search actor, action, target…"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="Clear search">
                <X className="text-muted-foreground hover:text-foreground size-3.5" />
              </button>
            )}
          </div>

          {/* Event type filter */}
          <div className="flex flex-wrap items-center gap-1">
            {EVENT_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() =>
                  setEventTypeFilter(opt.key as AuditEventType | "all")
                }
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  eventTypeFilter === opt.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <span className="text-muted-foreground ml-auto text-xs tabular-nums">
            {rows.length} events
          </span>
        </div>

        <div className="overflow-x-auto">
          <table
            className="w-full border-collapse text-left"
            style={{ fontSize: "var(--table-font)" }}
          >
            <thead className="text-muted-foreground border-b">
              <tr>
                {[
                  "Timestamp",
                  "Actor",
                  "Role",
                  "Action",
                  "Target",
                  "Type",
                  "Severity",
                  "AI",
                  "IP",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-3 font-medium whitespace-nowrap"
                    style={{ height: "var(--row-h)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((event) => {
                const typeMeta = EVENT_TYPE_META[event.eventType];
                const severityTone = SEVERITY_TONE[event.severity];
                const isLive = event.live === true || event.source === "live";
                return (
                  <tr
                    key={event.id}
                    onClick={() => setSelected(event)}
                    className={cn(
                      "hover:bg-muted/50 cursor-pointer border-b last:border-0",
                      event.severity === "critical" && "bg-danger-muted/15",
                    )}
                  >
                    {/* Timestamp */}
                    <td
                      className="text-muted-foreground px-3 font-mono text-xs whitespace-nowrap"
                      style={{ height: "var(--row-h)" }}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {isLive && (
                          <span
                            className="bg-success size-1.5 shrink-0 rounded-full"
                            title="Live · from DB"
                            aria-label="Live event from database"
                          />
                        )}
                        {event.timestamp}
                      </span>
                    </td>

                    {/* Actor */}
                    <td
                      className="px-3 font-medium whitespace-nowrap"
                      style={{ height: "var(--row-h)" }}
                    >
                      {event.actor}
                    </td>

                    {/* Role */}
                    <td
                      className="text-muted-foreground px-3 whitespace-nowrap"
                      style={{ height: "var(--row-h)" }}
                    >
                      {event.actorRole}
                    </td>

                    {/* Action */}
                    <td
                      className="max-w-[18rem] px-3"
                      style={{ height: "var(--row-h)" }}
                    >
                      <span className="block truncate">{event.action}</span>
                      {event.notes && (
                        <span className="text-metadata mt-0.5 block max-w-[18rem] truncate">
                          {event.notes}
                        </span>
                      )}
                    </td>

                    {/* Target */}
                    <td
                      className="text-muted-foreground max-w-[16rem] px-3"
                      style={{ height: "var(--row-h)" }}
                    >
                      <span className="block truncate">{event.target}</span>
                    </td>

                    {/* Event Type */}
                    <td className="px-3" style={{ height: "var(--row-h)" }}>
                      <StatusBadge tone={typeMeta.tone}>
                        {typeMeta.label}
                      </StatusBadge>
                    </td>

                    {/* Severity */}
                    <td className="px-3" style={{ height: "var(--row-h)" }}>
                      <StatusBadge tone={severityTone}>
                        {event.severity.charAt(0).toUpperCase() +
                          event.severity.slice(1)}
                      </StatusBadge>
                    </td>

                    {/* AI Involved */}
                    <td className="px-3" style={{ height: "var(--row-h)" }}>
                      {event.aiInvolved ? (
                        <Sparkles className="text-ai size-4" />
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          —
                        </span>
                      )}
                    </td>

                    {/* IP Address */}
                    <td
                      className="text-muted-foreground px-3 font-mono text-xs whitespace-nowrap"
                      style={{ height: "var(--row-h)" }}
                    >
                      {event.ipAddress}
                    </td>
                  </tr>
                );
              })}

              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="text-muted-foreground px-6 py-12 text-center text-sm"
                  >
                    No audit events match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Event detail slide-over */}
      <Sheet
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 p-0 sm:max-w-lg"
        >
          {selected && (
            <EventDetail event={selected} onClose={() => setSelected(null)} />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

// ─────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────

function EventDetail({
  event,
  onClose,
}: {
  event: AuditRow;
  onClose: () => void;
}) {
  const typeMeta = EVENT_TYPE_META[event.eventType];
  const severityTone = SEVERITY_TONE[event.severity];
  const isLive = event.live === true || event.source === "live";
  const sourceSystem = extractSourceSystem(event);

  return (
    <>
      <SheetHeader className="border-b">
        <div className="flex items-center gap-2">
          <SheetTitle className="text-base">Audit Event</SheetTitle>
          {isLive && (
            <span className="text-success inline-flex items-center gap-1 text-[11px] font-medium">
              <span className="bg-success size-1.5 animate-pulse rounded-full" />
              live
            </span>
          )}
        </div>
        <SheetDescription className="font-mono text-xs">
          {event.id}
        </SheetDescription>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <StatusBadge tone={typeMeta.tone}>{typeMeta.label}</StatusBadge>
          <StatusBadge tone={severityTone}>
            {event.severity.charAt(0).toUpperCase() + event.severity.slice(1)}
          </StatusBadge>
          {event.aiInvolved && (
            <StatusBadge tone="ai">
              <Sparkles className="size-3" /> AI involved
            </StatusBadge>
          )}
        </div>
      </SheetHeader>

      <div className="flex-1 overflow-auto px-4 py-3">
        <dl className="grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
          <DetailRow label="User" value={event.actor} sub={event.actorRole} />
          <DetailRow
            label="Timestamp"
            value={
              <span className="font-mono text-xs">{event.timestamp}</span>
            }
          />
          <DetailRow label="Action" value={event.action} />
          <DetailRow
            label="Entity"
            value={event.target}
            sub={event.targetType}
          />
          <DetailRow label="Source system" value={sourceSystem} />
          <DetailRow
            label="IP address"
            value={<span className="font-mono text-xs">{event.ipAddress}</span>}
          />
        </dl>

        {(event.previousValue || event.newValue) && (
          <div className="mt-5">
            <div className="text-muted-foreground mb-1.5 text-xs font-medium uppercase tracking-wide">
              Value change
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <ValueBlock
                label="Previous"
                value={event.previousValue ?? "—"}
                tone="muted"
              />
              <ValueBlock
                label="New"
                value={event.newValue ?? "—"}
                tone="info"
              />
            </div>
          </div>
        )}

        <div className="mt-5">
          <div className="text-muted-foreground mb-1.5 text-xs font-medium uppercase tracking-wide">
            Reason / notes
          </div>
          <div
            className={cn(
              "rounded-md border px-3 py-2 text-sm",
              event.notes
                ? "bg-muted/40"
                : "text-muted-foreground bg-muted/20 italic",
            )}
          >
            {event.notes ?? "No reason recorded."}
          </div>
        </div>
      </div>

      <div className="bg-muted/40 flex items-center justify-end gap-2 border-t p-3">
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
    </>
  );
}

function DetailRow({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
        {label}
      </dt>
      <dd className="text-foreground truncate">{value}</dd>
      {sub && (
        <dd className="text-muted-foreground truncate text-xs">{sub}</dd>
      )}
    </div>
  );
}

function ValueBlock({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "muted" | "info";
}) {
  return (
    <div
      className={cn(
        "rounded-md border px-3 py-2",
        tone === "muted" ? "bg-muted/40" : "bg-info-muted/30 border-info/30",
      )}
    >
      <div className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
        {label}
      </div>
      <div className="break-words text-sm">{value}</div>
    </div>
  );
}

// Try to surface a useful "source system" value. Live (DB) rows may have it
// in notes ("Source: …"); fall back to a sensible default based on actor.
function extractSourceSystem(event: AuditRow): string {
  if (event.notes) {
    const m = event.notes.match(/Source:\s*([^·]+)/i);
    if (m) return m[1].trim();
  }
  if (event.actorRole === "Integration") return event.target.split(" / ")[0];
  if (event.actor === "AI Copilot") return "AI Orchestrator";
  if (event.actor === "System") return "HireMe Platform";
  return "HireMe Platform";
}

function relativeTime(date: Date): string {
  const diffMs = Math.max(Date.now() - date.getTime(), 0);
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}
