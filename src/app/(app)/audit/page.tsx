"use client";

import { useMemo, useState } from "react";
import {
  AlertOctagon,
  History,
  Search,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { StatTile } from "@/components/workspace/stat-tile";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import {
  AUDIT_EVENTS,
  EVENT_TYPE_META,
  auditStats,
} from "@/lib/audit";
import type { AuditEventType } from "@/lib/audit";

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

export default function AuditPage() {
  const stats = auditStats();
  const [query, setQuery] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState<AuditEventType | "all">("all");

  const rows = useMemo(() => {
    let result = AUDIT_EVENTS;

    if (eventTypeFilter !== "all") {
      result = result.filter((e) => e.eventType === eventTypeFilter);
    }

    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter((e) =>
        [e.actor, e.actorRole, e.target, e.action, e.targetType, e.notes ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }

    return result;
  }, [query, eventTypeFilter]);

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="Audit Center"
        description="Immutable record of every important action, override, AI event, and permission change (§26, §66)."
      />

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

      {/* Audit log table */}
      <section className="bg-card overflow-hidden rounded-xl border shadow-xs">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2.5">
          <h2 className="text-card-heading">Audit Log</h2>

          {/* Search */}
          <div className="bg-muted/60 focus-within:ring-ring flex h-8 w-full items-center gap-2 rounded-md border px-2.5 sm:w-64 focus-within:ring-2">
            <Search className="text-muted-foreground size-3.5 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search actor, action, target…"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
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
                return (
                  <tr
                    key={event.id}
                    className={cn(
                      "hover:bg-muted/50 border-b last:border-0",
                      event.severity === "critical" && "bg-danger-muted/15",
                    )}
                  >
                    {/* Timestamp */}
                    <td
                      className="text-muted-foreground px-3 font-mono text-xs whitespace-nowrap"
                      style={{ height: "var(--row-h)" }}
                    >
                      {event.timestamp}
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
                        <span className="text-muted-foreground text-xs">—</span>
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
            </tbody>
          </table>
        </div>
      </section>
    </PageContainer>
  );
}
