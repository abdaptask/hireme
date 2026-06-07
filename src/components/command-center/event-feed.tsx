"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  MoreHorizontal,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { candidateIdByName } from "@/lib/candidates";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PipelineStatusBadge,
  StatusBadge,
} from "@/components/status-badge";
import { FEED_EVENTS, type FeedEvent } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type SortKey =
  | "time"
  | "eventType"
  | "candidate"
  | "client"
  | "stage"
  | "owner";

const COLUMNS: { key: SortKey; label: string; className?: string }[] = [
  { key: "time", label: "Time" },
  { key: "eventType", label: "Event" },
  { key: "candidate", label: "Candidate" },
  { key: "client", label: "Client" },
  { key: "stage", label: "Stage" },
  { key: "owner", label: "Owner" },
];

const ROW_ACTIONS = [
  "Open record",
  "Approve",
  "Reject",
  "Request correction",
  "Send reminder",
  "Retry integration",
  "Escalate",
  "Add note",
];

function StatusCell({ event }: { event: FeedEvent }) {
  if (event.status.kind === "pipeline") {
    return <PipelineStatusBadge status={event.status.status} />;
  }
  return <StatusBadge tone={event.status.tone}>{event.status.label}</StatusBadge>;
}

export function EventFeed() {
  const [query, setQuery] = useState("");
  const [aiOnly, setAiOnly] = useState(false);
  const [actionOnly, setActionOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("time");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = FEED_EVENTS.filter((e) => {
      if (aiOnly && !e.ai) return false;
      if (actionOnly && !e.actionRequired) return false;
      if (!q) return true;
      return (
        e.candidate.toLowerCase().includes(q) ||
        e.client.toLowerCase().includes(q) ||
        e.eventType.toLowerCase().includes(q) ||
        e.owner.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q)
      );
    });
    result = [...result].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [query, aiOnly, actionOnly, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  }
  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="bg-card flex flex-col rounded-xl border shadow-xs">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2.5">
        <h2 className="text-card-heading mr-1">Line-Item Event Feed</h2>
        <div className="bg-muted/60 focus-within:ring-ring flex h-8 w-full items-center gap-2 rounded-md border px-2.5 sm:w-64 focus-within:ring-2">
          <Search className="text-muted-foreground size-3.5" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events…"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <Button
          variant={aiOnly ? "secondary" : "outline"}
          size="sm"
          className="h-8 gap-1.5 font-normal"
          onClick={() => setAiOnly((v) => !v)}
        >
          <Sparkles className="size-3.5" /> AI involved
        </Button>
        <Button
          variant={actionOnly ? "secondary" : "outline"}
          size="sm"
          className="h-8 font-normal"
          onClick={() => setActionOnly((v) => !v)}
        >
          Action required
        </Button>
        <span className="text-muted-foreground ml-auto text-xs tabular-nums">
          {rows.length} events
        </span>
      </div>

      {/* Bulk action bar (§99.2) */}
      {selected.size > 0 && (
        <div className="bg-accent/60 text-accent-foreground flex items-center gap-2 border-b px-3 py-2 text-sm">
          <span className="font-medium tabular-nums">
            {selected.size} selected
          </span>
          <Separatorish />
          {["Assign", "Send reminder", "Approve", "Escalate", "Export"].map(
            (a) => (
              <Button key={a} variant="ghost" size="sm" className="h-7">
                {a}
              </Button>
            ),
          )}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-7"
            onClick={() => setSelected(new Set())}
          >
            Clear
          </Button>
        </div>
      )}

      {/* Grid */}
      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse text-left"
          style={{ fontSize: "var(--table-font)" }}
        >
          <thead>
            <tr className="text-muted-foreground border-b">
              <th
                className="sticky left-0 w-9 px-2"
                style={{ height: "var(--row-h)" }}
              >
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="accent-primary size-3.5 align-middle"
                />
              </th>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="px-2 font-medium whitespace-nowrap"
                  style={{ height: "var(--row-h)" }}
                >
                  <button
                    onClick={() => toggleSort(col.key)}
                    className="hover:text-foreground inline-flex items-center gap-1"
                  >
                    {col.label}
                    {sortKey === col.key ? (
                      sortDir === "asc" ? (
                        <ArrowUp className="size-3" />
                      ) : (
                        <ArrowDown className="size-3" />
                      )
                    ) : (
                      <ChevronsUpDown className="size-3 opacity-40" />
                    )}
                  </button>
                </th>
              ))}
              <th className="px-2 font-medium">Status</th>
              <th className="px-2 font-medium">SLA</th>
              <th className="px-2 font-medium">Integration</th>
              <th className="px-2 font-medium">Action Required</th>
              <th className="w-9 px-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => {
              const isSel = selected.has(e.id);
              return (
                <tr
                  key={e.id}
                  className={cn(
                    "hover:bg-muted/50 border-b transition-colors",
                    isSel && "bg-accent/40",
                  )}
                  style={{ height: "var(--row-h)" }}
                >
                  <td className="px-2">
                    <input
                      type="checkbox"
                      aria-label={`Select ${e.id}`}
                      checked={isSel}
                      onChange={() => toggleOne(e.id)}
                      className="accent-primary size-3.5 align-middle"
                    />
                  </td>
                  <td className="text-muted-foreground px-2 font-mono whitespace-nowrap tabular-nums">
                    {e.time}
                  </td>
                  <td className="px-2 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      {e.ai && <Sparkles className="text-ai size-3.5" />}
                      {e.eventType}
                    </span>
                  </td>
                  <td className="px-2 font-medium whitespace-nowrap">
                    {candidateIdByName(e.candidate) ? (
                      <Link
                        href={`/candidates/${candidateIdByName(e.candidate)}`}
                        className="hover:text-primary hover:underline"
                      >
                        {e.candidate}
                      </Link>
                    ) : (
                      e.candidate
                    )}
                  </td>
                  <td className="px-2 whitespace-nowrap">{e.client}</td>
                  <td className="text-muted-foreground px-2 whitespace-nowrap">
                    {e.stage}
                  </td>
                  <td className="text-muted-foreground px-2 whitespace-nowrap">
                    {e.owner}
                  </td>
                  <td className="px-2">
                    <StatusCell event={e} />
                  </td>
                  <td className="px-2 whitespace-nowrap">
                    <span
                      className={cn(
                        "text-xs font-medium",
                        e.sla.tone === "danger" && "text-danger-muted-foreground",
                        e.sla.tone === "warning" &&
                          "text-warning-muted-foreground",
                        e.sla.tone === "success" &&
                          "text-success-muted-foreground",
                        (e.sla.tone === "info" || e.sla.tone === "neutral") &&
                          "text-muted-foreground",
                      )}
                    >
                      {e.sla.label}
                    </span>
                  </td>
                  <td className="text-muted-foreground px-2 whitespace-nowrap">
                    {e.integration}
                  </td>
                  <td className="px-2 whitespace-nowrap">
                    {e.actionRequired ? (
                      <span className="text-foreground">{e.actionRequired}</span>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="px-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            aria-label={`Actions for ${e.id}`}
                          />
                        }
                      >
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {ROW_ACTIONS.map((a, i) => (
                          <div key={a}>
                            {i === 1 && <DropdownMenuSeparator />}
                            <DropdownMenuItem>{a}</DropdownMenuItem>
                          </div>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={COLUMNS.length + 5}
                  className="text-muted-foreground px-4 py-10 text-center text-sm"
                >
                  No events match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-muted-foreground flex items-center justify-between border-t px-3 py-2 text-xs">
        <span>
          Multi-column sort, saved views, pivoting & column pinning arrive with
          the full data-grid system (§99).
        </span>
      </div>
    </div>
  );
}

function Separatorish() {
  return <span className="bg-border h-4 w-px" />;
}
