"use client";

/* ---------------------------------------------------------------------------
   Generic report viewer (§49–§50, §34.7, §72).
   Renders any engine report: governance header, KPI row, drill-down charts,
   and a searchable / sortable / exportable data table.
   --------------------------------------------------------------------------- */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpDown,
  BadgeCheck,
  CalendarRange,
  Clock,
  Database,
  Download,
  Filter,
  Info,
  Lock,
  Printer,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { PageContainer } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RANGE_PRESETS } from "@/lib/report-engine/date-range";
import type {
  Cell,
  Chart,
  Column,
  Kpi,
  ReportControl,
  ReportMeta,
  ReportResult,
  ReportTable,
  Row,
  Tone,
  ValueFormat,
} from "@/lib/report-engine/types";

// ─────────────────────────────────────────────────────────
// Formatting & tone
// ─────────────────────────────────────────────────────────

function fmtValue(v: number | string, format?: ValueFormat): string {
  if (typeof v === "string") return v;
  switch (format) {
    case "currency": {
      const sign = v < 0 ? "-" : "";
      const a = Math.abs(v);
      return a >= 100_000
        ? `${sign}$${(a / 1000).toLocaleString("en-US", { maximumFractionDigits: 0 })}K`
        : `${sign}$${a.toLocaleString("en-US", { maximumFractionDigits: a < 1000 ? 2 : 0 })}`;
    }
    case "percent":
      return `${v.toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;
    case "days":
      return `${v.toLocaleString("en-US", { maximumFractionDigits: 1 })}d`;
    default:
      return v.toLocaleString("en-US", { maximumFractionDigits: 1 });
  }
}

function fmtCell(v: Cell, type: Column["type"]): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "string") {
    if (type === "date" && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
      return new Date(`${v}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    return v;
  }
  switch (type) {
    case "currency":
      return `${v < 0 ? "-" : ""}$${Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
    case "percent":
      return `${v.toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;
    case "days":
      return `${v.toLocaleString("en-US", { maximumFractionDigits: 1 })}d`;
    default:
      return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }
}

const BAR: Record<Tone, string> = {
  default: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  ai: "bg-ai",
  neutral: "bg-neutral",
};

const PILL: Record<Tone, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-success-muted text-success-muted-foreground",
  warning: "bg-warning-muted text-warning-muted-foreground",
  danger: "bg-danger-muted text-danger-muted-foreground",
  info: "bg-info-muted text-info-muted-foreground",
  ai: "bg-ai-muted text-ai-muted-foreground",
  neutral: "bg-muted text-muted-foreground",
};

const TEXT: Record<Tone, string> = {
  default: "text-foreground",
  success: "text-success-muted-foreground",
  warning: "text-warning-muted-foreground",
  danger: "text-danger-muted-foreground",
  info: "text-info-muted-foreground",
  ai: "text-ai-muted-foreground",
  neutral: "text-muted-foreground",
};

/** Status vocabulary → tone (§5.3 status language, color-independent text kept). */
function statusTone(v: string): Tone {
  const s = v.toLowerCase();
  if (/(^|\s)(not ready|missing|failed|error|rejected|breached|overdue|lost|damaged|critical|at risk|unlikely|expired|lapsed|missed|adverse|ineligible|high|will miss|delayed|canceled|over capacity|violation|dropped|bounced|sensitive|after hours|escalate|correction|duplicate)/.test(s)) return "danger";
  if (/(pending|needs|attention|approaching|due soon|warning|watch|medium|in transit|shipped|near capacity|conditional|expiring|requested|incomplete|to do|not started|coaching|rescheduled|partial|retrying|update owed|repeat|low balance|setup)/.test(s)) return "warning";
  if (/(review|in progress|submitted|scheduled|started|assigned|ordered|invited|consented|sent|initiated|in review|ai)/.test(s)) return "info";
  if (/(ready|clear|approved|complete|completed|on track|within sla|connected|active|healthy|delivered|validated|verified|acknowledged|received|passed|eligible|ok|yes|done|linked|successful|met|top performer|solid|agreed|low|available|faster|on schedule|placed|confirmed|standard|business hours|internal)/.test(s)) return "success";
  return "neutral";
}

// ─────────────────────────────────────────────────────────
// KPI tiles
// ─────────────────────────────────────────────────────────

function KpiTile({ kpi }: { kpi: Kpi }) {
  const tone = kpi.tone ?? "default";
  return (
    <div className="bg-card flex min-w-0 flex-col gap-1 rounded-xl border p-3.5 shadow-xs">
      <span className="text-metadata flex items-center gap-1.5 leading-tight">
        <span className={cn("size-1.5 shrink-0 rounded-full", BAR[tone])} aria-hidden />
        <span className="truncate">{kpi.label}</span>
      </span>
      <span className={cn("truncate text-xl font-semibold tabular-nums tracking-tight", tone !== "default" && TEXT[tone])} title={String(kpi.value)}>
        {fmtValue(kpi.value, kpi.format)}
      </span>
      {kpi.hint && <span className="text-muted-foreground truncate text-[11px]">{kpi.hint}</span>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Charts (CSS-rendered; every element drills into the table — §34.7)
// ─────────────────────────────────────────────────────────

type DrillFn = (key: string, value: string, label: string) => void;

function ChartCard({ chart, onDrill }: { chart: Chart; onDrill: DrillFn }) {
  return (
    <section className="bg-card flex min-w-0 flex-col rounded-xl border shadow-xs">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
        <div className="min-w-0">
          <h2 className="text-card-heading truncate">{chart.title}</h2>
          {chart.description && <p className="text-metadata truncate">{chart.description}</p>}
        </div>
        {chart.drillKey && (
          <span className="text-muted-foreground flex shrink-0 items-center gap-1 text-[11px]">
            <Filter className="size-3" /> Click to drill
          </span>
        )}
      </div>
      <div className="flex-1 p-4">
        {chart.kind === "bar" && <Bars chart={chart} onDrill={onDrill} />}
        {chart.kind === "funnel" && <Funnel chart={chart} onDrill={onDrill} />}
        {chart.kind === "trend" && <Trend chart={chart} />}
        {chart.kind === "stacked" && <Stacked chart={chart} onDrill={onDrill} />}
      </div>
    </section>
  );
}

function Empty() {
  return <p className="text-muted-foreground py-6 text-center text-sm">No data for this view.</p>;
}

function Bars({ chart, onDrill }: { chart: Extract<Chart, { kind: "bar" }>; onDrill: DrillFn }) {
  const pts = chart.points.filter((p) => p.value !== 0 || chart.points.length <= 6);
  if (!pts.length) return <Empty />;
  const max = Math.max(...pts.map((p) => Math.abs(p.value)), 1);
  return (
    <ul className="flex flex-col gap-1.5">
      {pts.map((p) => {
        const inner = (
          <>
            <span className="w-36 shrink-0 truncate text-left text-sm" title={p.label}>
              {p.label}
            </span>
            <span className="bg-muted relative h-2 flex-1 overflow-hidden rounded-full">
              <span
                className={cn("absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 motion-reduce:transition-none", BAR[p.tone ?? "info"])}
                style={{ width: `${Math.max((Math.abs(p.value) / max) * 100, p.value ? 3 : 0)}%` }}
              />
            </span>
            <span className="text-muted-foreground w-16 shrink-0 text-right text-xs tabular-nums">{fmtValue(p.value, chart.format)}</span>
          </>
        );
        return (
          <li key={p.label}>
            {chart.drillKey ? (
              <button
                type="button"
                onClick={() => onDrill(chart.drillKey!, p.drill ?? p.label, p.label)}
                className="hover:bg-muted/60 focus-visible:ring-ring -mx-1.5 flex w-[calc(100%+0.75rem)] items-center gap-3 rounded-md px-1.5 py-1 focus-visible:ring-2 focus-visible:outline-none"
                aria-label={`Filter table to ${p.label}`}
              >
                {inner}
              </button>
            ) : (
              <div className="flex items-center gap-3 py-1">{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Funnel({ chart, onDrill }: { chart: Extract<Chart, { kind: "funnel" }>; onDrill: DrillFn }) {
  if (!chart.points.length) return <Empty />;
  const max = Math.max(...chart.points.map((p) => p.value), 1);
  return (
    <ol className="flex flex-col gap-1">
      {chart.points.map((p, i) => {
        const prev = i > 0 ? chart.points[i - 1].value : null;
        const conv = prev ? Math.round((p.value / prev) * 100) : null;
        const body = (
          <>
            <span className="w-40 shrink-0 truncate text-left text-sm">{p.label}</span>
            <span className="flex flex-1 justify-center">
              <span
                className={cn("flex h-6 items-center justify-center rounded-md text-xs font-medium text-white tabular-nums", BAR[p.tone ?? "info"])}
                style={{ width: `${Math.max((p.value / max) * 100, 8)}%` }}
              >
                {fmtValue(p.value, chart.format)}
              </span>
            </span>
            <span className="text-muted-foreground w-12 shrink-0 text-right text-[11px] tabular-nums">{conv !== null && chart.format !== "percent" ? `${conv}%` : ""}</span>
          </>
        );
        return (
          <li key={p.label}>
            {chart.drillKey ? (
              <button type="button" onClick={() => onDrill(chart.drillKey!, p.drill ?? p.label, p.label)} className="hover:bg-muted/60 focus-visible:ring-ring flex w-full items-center gap-3 rounded-md px-1 py-0.5 focus-visible:ring-2 focus-visible:outline-none">
                {body}
              </button>
            ) : (
              <div className="flex items-center gap-3 px-1 py-0.5">{body}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function Trend({ chart }: { chart: Extract<Chart, { kind: "trend" }> }) {
  if (!chart.points.length) return <Empty />;
  const max = Math.max(...chart.points.map((p) => p.value), 1);
  const total = chart.points.reduce((a, b) => a + b.value, 0);
  return (
    <div>
      <div className="flex h-36 items-end gap-1.5" role="img" aria-label={`${chart.title}: ${chart.points.map((p) => `${p.label} ${fmtValue(p.value, chart.format)}`).join(", ")}`}>
        {chart.points.map((p) => (
          <div key={p.label} className="group flex h-full min-w-0 flex-1 flex-col justify-end" title={`${p.label}: ${fmtValue(p.value, chart.format)}`}>
            <span className="text-muted-foreground mb-0.5 truncate text-center text-[10px] tabular-nums opacity-0 transition-opacity group-hover:opacity-100">{fmtValue(p.value, chart.format)}</span>
            <div className={cn("w-full rounded-t-sm opacity-80 transition-opacity group-hover:opacity-100", BAR[p.tone ?? "info"])} style={{ height: `${Math.max((p.value / max) * 100, p.value ? 3 : 1)}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {chart.points.map((p, i) => (
          <span key={p.label} className="text-muted-foreground min-w-0 flex-1 truncate text-center text-[10px]">
            {chart.points.length > 10 && i % 2 ? "" : p.label}
          </span>
        ))}
      </div>
      {chart.format !== "percent" && chart.format !== "days" && (
        <p className="text-muted-foreground mt-2 text-xs">
          Total <span className="text-foreground font-medium tabular-nums">{fmtValue(total, chart.format)}</span>
        </p>
      )}
    </div>
  );
}

function Stacked({ chart, onDrill }: { chart: Extract<Chart, { kind: "stacked" }>; onDrill: DrillFn }) {
  const rows = chart.rows.filter((r) => Object.values(r.values).some((v) => v > 0));
  if (!rows.length) return <Empty />;
  const max = Math.max(...rows.map((r) => Object.values(r.values).reduce((a, b) => a + b, 0)), 1);
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1">
        {chart.segments.map((s) => (
          <span key={s.key} className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <span className={cn("size-2 rounded-sm", BAR[s.tone])} /> {s.label}
          </span>
        ))}
      </div>
      <ul className="flex flex-col gap-1.5">
        {rows.map((r) => {
          const total = Object.values(r.values).reduce((a, b) => a + b, 0);
          const body = (
            <>
              <span className="w-36 shrink-0 truncate text-left text-sm" title={r.label}>{r.label}</span>
              <span className="flex h-2.5 flex-1 overflow-hidden rounded-full">
                <span className="flex h-full" style={{ width: `${(total / max) * 100}%` }}>
                  {chart.segments.map((s) =>
                    r.values[s.key] ? (
                      <span key={s.key} className={cn("h-full", BAR[s.tone])} style={{ width: `${(r.values[s.key] / total) * 100}%` }} title={`${s.label}: ${r.values[s.key]}`} />
                    ) : null,
                  )}
                </span>
                <span className="bg-muted h-full flex-1" />
              </span>
              <span className="text-muted-foreground w-12 shrink-0 text-right text-xs tabular-nums">{fmtValue(total, chart.format)}</span>
            </>
          );
          return (
            <li key={r.label}>
              {chart.drillKey ? (
                <button type="button" onClick={() => onDrill(chart.drillKey!, r.drill ?? r.label, r.label)} className="hover:bg-muted/60 focus-visible:ring-ring -mx-1.5 flex w-[calc(100%+0.75rem)] items-center gap-3 rounded-md px-1.5 py-1 focus-visible:ring-2 focus-visible:outline-none" aria-label={`Filter table to ${r.label}`}>
                  {body}
                </button>
              ) : (
                <div className="flex items-center gap-3 py-1">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Data table (§99: sort, search, paginate, export)
// ─────────────────────────────────────────────────────────

const PAGE = 50;

/* Subtle column-group tints (add / drop / net / FT families) — color reinforces
   the header text, never replaces it (§3.6 color-independent status). */
type ColGroup = "add" | "drop" | "net" | "ft";

function columnGroup(key: string): ColGroup | null {
  if (/^add/i.test(key)) return "add";
  if (/^drop/i.test(key)) return "drop";
  if (/^(diff|net)/i.test(key)) return "net";
  if (/^ft/i.test(key)) return "ft";
  return null;
}

const GROUP_HEAD: Record<ColGroup, string> = {
  add: "border-t-success/50 bg-success-muted/40",
  drop: "border-t-danger/50 bg-danger-muted/40",
  net: "border-t-info/50 bg-info-muted/40",
  ft: "border-t-ai/50 bg-ai-muted/40",
};

const GROUP_CELL: Record<ColGroup, string> = {
  add: "bg-success-muted/15",
  drop: "bg-danger-muted/15",
  net: "bg-info-muted/15",
  ft: "bg-ai-muted/15",
};

/** Negative numbers read red; positive movement (diff / net / change / growth) reads green. */
function signTone(key: string, v: Cell): string | false {
  if (typeof v !== "number" || v === 0) return false;
  if (v < 0) return "text-danger-muted-foreground";
  return /^(diff|net|change|growth)/i.test(key) && "text-success-muted-foreground";
}

function csvEscape(v: Cell): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCsv(name: string, columns: Column[], rows: Row[], totals?: Row) {
  const all = totals ? [...rows, totals] : rows;
  const lines = [columns.map((c) => csvEscape(c.label)).join(","), ...all.map((r) => columns.map((c) => csvEscape(r[c.key])).join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function DataTable({
  name,
  table,
  drill,
  onClearDrill,
}: {
  name: string;
  table: ReportTable;
  drill: { key: string; value: string; label: string } | null;
  onClearDrill: () => void;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(table.sort ?? null);
  const [page, setPage] = useState(0);

  // A drill-down only applies to tables that have the drilled column.
  const activeDrill = drill && table.columns.some((c) => c.key === drill.key) ? drill : null;

  const filtered = useMemo(() => {
    let rows = table.rows;
    if (activeDrill) rows = rows.filter((r) => String(r[activeDrill.key] ?? "") === activeDrill.value);
    const q = query.trim().toLowerCase();
    if (q) rows = rows.filter((r) => table.columns.some((c) => String(r[c.key] ?? "").toLowerCase().includes(q)));
    if (sort) {
      rows = [...rows].sort((a, b) => {
        const va = a[sort.key];
        const vb = b[sort.key];
        if (va === null || va === undefined) return 1;
        if (vb === null || vb === undefined) return -1;
        const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), undefined, { numeric: true });
        return sort.dir === "asc" ? cmp : -cmp;
      });
    }
    return rows;
  }, [table, activeDrill, query, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const current = Math.min(page, pages - 1);
  const visible = filtered.slice(current * PAGE, current * PAGE + PAGE);

  function toggle(key: string) {
    setPage(0);
    setSort((s) => (s?.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  return (
    <section className="bg-card flex min-w-0 flex-col rounded-xl border shadow-xs">
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2.5">
        <h2 className="text-card-heading mr-auto">
          {table.title ?? "Records"}{" "}
          <span className="text-muted-foreground text-xs font-normal tabular-nums">
            {filtered.length.toLocaleString()} of {table.rows.length.toLocaleString()}
          </span>
        </h2>
        {activeDrill && (
          <button type="button" onClick={onClearDrill} className="bg-primary/10 text-primary hover:bg-primary/15 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium">
            <Filter className="size-3" /> {activeDrill.label}
            <X className="size-3" aria-label="Clear drill-down filter" />
          </button>
        )}
        <label className="relative">
          <span className="sr-only">Search records</span>
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search records…"
            className="bg-background hover:bg-muted/40 focus-visible:ring-ring h-8 w-56 rounded-md border pr-2 pl-7 text-sm focus-visible:ring-2 focus-visible:outline-none"
          />
        </label>
        <Button variant="outline" size="sm" onClick={() => downloadCsv(table.title ? `${name} ${table.title}` : name, table.columns, filtered, table.totals)}>
          <Download className="size-3.5" /> CSV
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-primary/[0.06] sticky top-0 z-10 backdrop-blur-sm">
            <tr className="border-primary/15 border-b">
              {table.columns.map((c) => {
                const numeric = c.type && ["number", "currency", "percent", "days"].includes(c.type);
                const SortIcon = sort?.key === c.key ? (sort.dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
                const g = columnGroup(c.key);
                return (
                  <th key={c.key} scope="col" aria-sort={sort?.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : "none"} className={cn("text-foreground/70 border-t-2 border-transparent px-3 py-2 text-[11px] font-semibold tracking-wide whitespace-nowrap uppercase", numeric ? "text-right" : "text-left", g && GROUP_HEAD[g])}>
                    <button type="button" onClick={() => toggle(c.key)} className={cn("hover:text-foreground inline-flex items-center gap-1", numeric && "flex-row-reverse")}>
                      {c.label}
                      <SortIcon className={cn("size-3", sort?.key !== c.key && "opacity-40")} />
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr key={i} className="even:bg-muted/25 hover:bg-primary/[0.04] border-border/60 border-t transition-colors">
                {table.columns.map((c) => {
                  const v = r[c.key];
                  const numeric = c.type && ["number", "currency", "percent", "days"].includes(c.type);
                  const g = columnGroup(c.key);
                  if (c.type === "status" && v !== null && v !== "" && v !== "—") {
                    return (
                      <td key={c.key} className="px-3 py-1.5 whitespace-nowrap">
                        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", PILL[statusTone(String(v))])}>{String(v)}</span>
                      </td>
                    );
                  }
                  return (
                    <td key={c.key} className={cn("max-w-[22rem] truncate px-3 py-1.5", numeric ? "text-right tabular-nums" : "", c.type === "date" && "whitespace-nowrap", g && GROUP_CELL[g], numeric && signTone(c.key, v))} title={typeof v === "string" && v.length > 40 ? v : undefined}>
                      {fmtCell(v, c.type)}
                    </td>
                  );
                })}
              </tr>
            ))}
            {!visible.length && (
              <tr>
                <td colSpan={table.columns.length} className="text-muted-foreground px-3 py-10 text-center">
                  No records match. {activeDrill || query ? "Clear the filter or search to see all records." : ""}
                </td>
              </tr>
            )}
          </tbody>
          {table.totals && (
            <tfoot>
              <tr className="bg-primary/[0.08] border-primary/30 text-foreground border-t-2 font-semibold">
                {table.columns.map((c) => {
                  const numeric = c.type && ["number", "currency", "percent", "days"].includes(c.type);
                  const v = table.totals![c.key];
                  return (
                    <td key={c.key} className={cn("px-3 py-2 whitespace-nowrap", numeric && "text-right tabular-nums", numeric && signTone(c.key, v))}>
                      {v === undefined ? "" : fmtCell(v, c.type === "status" ? "text" : c.type)}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {pages > 1 && (
        <div className="text-muted-foreground flex items-center justify-between border-t px-4 py-2 text-xs">
          <span className="tabular-nums">
            {current * PAGE + 1}–{Math.min(filtered.length, (current + 1) * PAGE)} of {filtered.length.toLocaleString()}
          </span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={current === 0} onClick={() => setPage(current - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────
// Filter bar (§50.3 global filters) — state lives in the URL so views are
// shareable and bookmarkable.
// ─────────────────────────────────────────────────────────

export type ReportFilters = {
  dateEnabled: boolean;
  dateBasis?: string;
  range: string;
  from: string;
  to: string;
  rangeLabel: string | null;
  controls: ReportControl[];
  values: Record<string, string>;
};

function useParamNav() {
  const router = useRouter();
  const sp = useSearchParams();
  return (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    router.push(qs ? `?${qs}` : "?", { scroll: false });
  };
}

function FilterBar({ filters }: { filters: ReportFilters }) {
  const nav = useParamNav();
  const [from, setFrom] = useState(filters.from);
  const [to, setTo] = useState(filters.to);
  if (!filters.dateEnabled && !filters.controls.length) return null;

  const select = "bg-background hover:bg-muted focus-visible:ring-ring h-8 rounded-md border px-2 text-sm focus-visible:ring-2 focus-visible:outline-none";

  return (
    <section className="bg-card flex flex-wrap items-end gap-3 rounded-xl border p-3 shadow-xs print:hidden" aria-label="Report filters">
      {filters.dateEnabled && (
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground flex items-center gap-1">
            <CalendarRange className="size-3.5" /> Date range
          </span>
          <select
            value={filters.range}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "custom") nav({ range: "custom" });
              else nav({ range: v === "all" ? null : v, from: null, to: null });
            }}
            className={cn(select, "min-w-44")}
          >
            {RANGE_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      )}
      {filters.dateEnabled && filters.range === "custom" && (
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            nav({ range: "custom", from: from || null, to: to || null });
          }}
        >
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">From</span>
            <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={select} />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">To</span>
            <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={select} />
          </label>
          <Button type="submit" size="sm">
            Apply
          </Button>
        </form>
      )}
      {filters.controls.map((c) => (
        <label key={c.key} className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">{c.label}</span>
          <select value={filters.values[c.key] ?? c.default} onChange={(e) => nav({ [c.key]: e.target.value === c.default ? null : e.target.value })} className={cn(select, "min-w-32")}>
            {c.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      ))}
      <div className="text-muted-foreground ml-auto flex flex-col items-end gap-0.5 text-xs">
        {filters.dateEnabled ? (
          <>
            <span className="text-foreground font-medium">{filters.rangeLabel ?? "All time"}</span>
            {filters.dateBasis && <span>Filters: {filters.dateBasis.toLowerCase()}</span>}
          </>
        ) : null}
        {(filters.range !== "all" || Object.entries(filters.values).some(([k, v]) => filters.controls.find((c) => c.key === k)?.default !== v)) && (
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => nav({ range: null, from: null, to: null, ...Object.fromEntries(filters.controls.map((c) => [c.key, null])) })}
          >
            Reset filters
          </button>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────

const PERSONA_LABEL: Record<string, string> = {
  "super-admin": "Super Admin",
  executive: "Executive",
  onboarder: "Onboarder",
  recruiter: "Recruiter",
  "recruiting-manager": "Recruiting Manager",
  "account-manager": "Account Manager",
  candidate: "Candidate",
};

export function ReportView({
  meta,
  section,
  result,
  refreshedAt,
  filters,
}: {
  meta: ReportMeta;
  section: string;
  result: ReportResult;
  refreshedAt: string;
  filters: ReportFilters;
}) {
  const nav = useParamNav();
  const [drill, setDrill] = useState<{ key: string; value: string; label: string } | null>(null);

  const onDrill: DrillFn = (key, value, label) => {
    setDrill({ key, value, label: `${result.table.columns.find((c) => c.key === key)?.label ?? key}: ${label}` });
    document.getElementById("report-table")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const refreshed = new Date(refreshedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <PageContainer className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <Button variant="ghost" size="sm" className="-ml-2" nativeButton={false} render={<Link href="/reports" />}>
          <ArrowLeft className="size-4" /> Reports
        </Button>
        <span className="text-muted-foreground text-xs">/ {section}</span>
      </div>

      {/* Report header (§50.2) */}
      <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-page-title">{meta.name}</h1>
            <Badge variant="outline" className="gap-1 text-[11px]">
              <BadgeCheck className="size-3" /> Certified
            </Badge>
            {meta.restricted && (
              <Badge variant="outline" className="border-warning/40 text-warning-muted-foreground gap-1 text-[11px]">
                <Lock className="size-3" /> Restricted
              </Badge>
            )}
            <Badge variant="secondary" className="text-[11px]">{meta.spec}</Badge>
          </div>
          <p className="text-muted-foreground mt-1 max-w-3xl text-sm">{meta.description}</p>
          <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span className="flex items-center gap-1"><Database className="size-3.5" /> HireMe operational DB · live</span>
            <span className="flex items-center gap-1"><Clock className="size-3.5" /> Refreshed {refreshed}</span>
            <span className="flex items-center gap-1"><UserRound className="size-3.5" /> Owner: {meta.owner}</span>
            <span>For: {meta.personas.map((p) => PERSONA_LABEL[p] ?? p).join(", ")}</span>
          </div>
        </div>
        <div className="flex shrink-0 gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="size-3.5" /> Print / PDF
          </Button>
          <Button size="sm" onClick={() => downloadCsv(meta.name, result.table.columns, result.table.rows)}>
            <Download className="size-3.5" /> Export CSV
          </Button>
        </div>
      </header>

      {result.subject && (
        <label className="bg-card flex flex-wrap items-center gap-2 rounded-xl border p-3 text-sm shadow-xs print:hidden">
          <UserRound className="text-primary size-4" />
          <span className="text-muted-foreground">{result.subject.label}:</span>
          <select
            value={result.subject.selected}
            onChange={(e) => nav({ subject: e.target.value })}
            className="bg-background hover:bg-muted h-8 min-w-64 rounded-md border px-2 text-sm"
          >
            {result.subject.options.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
          <span className="text-muted-foreground text-xs">Candidates only ever see their own records (§52).</span>
        </label>
      )}

      <FilterBar key={`${filters.from}|${filters.to}`} filters={filters} />

      {result.kpis.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {result.kpis.map((k) => (
            <KpiTile key={k.label} kpi={k} />
          ))}
        </div>
      )}

      {result.notes?.map((n) => (
        <p key={n} className="bg-info-muted text-info-muted-foreground flex items-start gap-2 rounded-lg px-3 py-2 text-sm">
          <Info className="mt-0.5 size-4 shrink-0" /> {n}
        </p>
      ))}

      {result.charts.length > 0 && (
        <div className={cn("grid grid-cols-1 gap-4", result.charts.length > 1 && "lg:grid-cols-2")}>
          {result.charts.map((c) => (
            <ChartCard key={c.title} chart={c} onDrill={onDrill} />
          ))}
        </div>
      )}

      <div id="report-table" className="scroll-mt-20">
        <DataTable name={meta.name} table={result.table} drill={drill} onClearDrill={() => setDrill(null)} />
      </div>

      {result.extraTables?.map((t) => (
        <DataTable key={t.title} name={meta.name} table={t} drill={drill} onClearDrill={() => setDrill(null)} />
      ))}

      {/* Metric definitions & governance (§72) */}
      <details className="bg-card rounded-xl border shadow-xs">
        <summary className="text-card-heading cursor-pointer px-4 py-2.5">Metric definitions & data governance</summary>
        <dl className="grid gap-x-6 gap-y-3 border-t px-4 py-3 text-sm sm:grid-cols-2">
          {(meta.definitions ?? []).map((d) => (
            <div key={d.term}>
              <dt className="font-medium">{d.term}</dt>
              <dd className="text-muted-foreground">{d.def}</dd>
            </div>
          ))}
          <div>
            <dt className="font-medium">Data source & freshness</dt>
            <dd className="text-muted-foreground">Live query of the HireMe operational database at {refreshed}. No caching.</dd>
          </div>
          <div>
            <dt className="font-medium">Access level</dt>
            <dd className="text-muted-foreground">
              {meta.restricted ? "Restricted — sensitive fields masked; exports are audited and may require approval (§72)." : "Role-based — row-level security applies to client and candidate users (§42)."}
            </dd>
          </div>
          <div>
            <dt className="font-medium">Report owner · certification</dt>
            <dd className="text-muted-foreground">{meta.owner} · Certified (spec {meta.spec})</dd>
          </div>
        </dl>
      </details>
    </PageContainer>
  );
}
