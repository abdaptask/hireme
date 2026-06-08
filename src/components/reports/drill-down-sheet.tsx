"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Download, MessageSquarePlus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DrillDownColumn<R> = {
  /** Unique key — used for sort state and CSV header. */
  key: string;
  /** Visible header label. */
  label: string;
  /** Cell value used for rendering. */
  accessor: (row: R) => React.ReactNode;
  /** Sortable value — defaults to string of accessor when omitted. */
  sortValue?: (row: R) => string | number;
  /** Optional className for the cell. */
  className?: string;
  align?: "left" | "right";
};

export type DrillDownSheetProps<R> = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  columns: DrillDownColumn<R>[];
  rows: R[];
};

/**
 * Reusable side-drawer that opens an underlying records table when a user
 * clicks into a chart row (CLAUDE.md §50.2 "Add annotation" + §99 grid).
 * Sortable columns, CSV export, placeholder annotation action.
 */
export function DrillDownSheet<R>({
  open,
  onOpenChange,
  title,
  description,
  columns,
  rows,
}: DrillDownSheetProps<R>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return rows;
    const getVal = (r: R) =>
      col.sortValue ? col.sortValue(r) : String(col.accessor(r) ?? "");
    const next = [...rows].sort((a, b) => {
      const va = getVal(a);
      const vb = getVal(b);
      if (typeof va === "number" && typeof vb === "number") {
        return sortDir === "asc" ? va - vb : vb - va;
      }
      const sa = String(va);
      const sb = String(vb);
      return sortDir === "asc" ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
    return next;
  }, [rows, columns, sortKey, sortDir]);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function exportCsv() {
    const header = columns.map((c) => csvEscape(c.label)).join(",");
    const lines = sorted.map((row) =>
      columns
        .map((c) => {
          const raw = c.sortValue ? c.sortValue(row) : c.accessor(row);
          return csvEscape(stringifyForCsv(raw));
        })
        .join(","),
    );
    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug(title)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl"
      >
        <SheetHeader className="border-b">
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-muted-foreground text-xs tabular-nums">
              {rows.length} record{rows.length === 1 ? "" : "s"}
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 text-xs"
                onClick={exportCsv}
                disabled={rows.length === 0}
              >
                <Download className="size-3" /> Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 text-xs"
                title="Annotations land in v0.9"
                disabled
              >
                <MessageSquarePlus className="size-3" /> Add annotation
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-auto">
          {rows.length === 0 ? (
            <div className="text-muted-foreground p-8 text-center text-sm">
              No records match this dimension.
            </div>
          ) : (
            <table
              className="w-full border-collapse text-left"
              style={{ fontSize: "var(--table-font)" }}
            >
              <thead className="bg-card text-muted-foreground sticky top-0 z-10 border-b">
                <tr>
                  {columns.map((c) => {
                    const isActive = sortKey === c.key;
                    const Icon = isActive
                      ? sortDir === "asc"
                        ? ArrowUp
                        : ArrowDown
                      : ArrowUpDown;
                    return (
                      <th
                        key={c.key}
                        className={cn(
                          "px-3 py-2 font-medium",
                          c.align === "right" && "text-right",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => toggleSort(c.key)}
                          className={cn(
                            "hover:text-foreground inline-flex items-center gap-1 transition-colors",
                            isActive && "text-foreground",
                            c.align === "right" && "ml-auto",
                          )}
                        >
                          {c.label}
                          <Icon className="size-3 opacity-60" />
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {sorted.map((row, i) => (
                  <tr
                    key={i}
                    className="hover:bg-muted/40 border-b last:border-0"
                  >
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={cn(
                          "px-3 py-2",
                          c.align === "right" && "text-right tabular-nums",
                          c.className,
                        )}
                      >
                        {c.accessor(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function csvEscape(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function stringifyForCsv(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
    return String(v);
  }
  // React node fallback — best-effort
  return String(v);
}

function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
