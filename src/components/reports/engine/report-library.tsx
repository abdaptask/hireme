"use client";

/* ---------------------------------------------------------------------------
   Persona report library (§49, §50.1, §73.1) — every persona gets its own
   catalog; search spans name, description, and spec reference.
   --------------------------------------------------------------------------- */

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Lock, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ReportMeta,
  ReportPersona,
  ReportSectionId,
} from "@/lib/report-engine/types";

type Props = {
  reports: ReportMeta[];
  sections: { id: ReportSectionId; label: string }[];
  personas: { id: ReportPersona; label: string; description: string }[];
};

export function ReportLibrary({ reports, sections, personas }: Props) {
  const [persona, setPersona] = useState<ReportPersona | "all">("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports.filter(
      (r) =>
        (persona === "all" || r.personas.includes(persona)) &&
        (!q ||
          `${r.name} ${r.description} ${r.spec}`.toLowerCase().includes(q)),
    );
  }, [reports, persona, query]);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of reports)
      for (const p of r.personas) m.set(p, (m.get(p) ?? 0) + 1);
    return m;
  }, [reports]);

  const activePersona = personas.find((p) => p.id === persona);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-section-heading">Report library</h2>
          <p className="text-muted-foreground text-sm">
            {reports.length} live reports on real platform data · every chart
            drills into records · CSV export
          </p>
        </div>
        <label className="relative">
          <span className="sr-only">Search reports</span>
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reports…"
            className="bg-background hover:bg-muted/40 focus-visible:ring-ring h-9 w-72 rounded-md border pr-3 pl-8 text-sm focus-visible:ring-2 focus-visible:outline-none"
          />
        </label>
      </div>

      {personas.length > 0 && (
        <div
          role="tablist"
          aria-label="Report catalog by persona"
          className="flex flex-wrap gap-1.5"
        >
          {[{ id: "all" as const, label: "All reports" }, ...personas].map(
            (p) => {
              const active = persona === p.id;
              const n =
                p.id === "all" ? reports.length : (counts.get(p.id) ?? 0);
              return (
                <button
                  key={p.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setPersona(p.id)}
                  className={cn(
                    "focus-visible:ring-ring flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none",
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card hover:bg-muted",
                  )}
                >
                  {p.label}
                  <span
                    className={cn(
                      "text-xs tabular-nums",
                      active ? "opacity-80" : "text-muted-foreground",
                    )}
                  >
                    {n}
                  </span>
                </button>
              );
            },
          )}
        </div>
      )}
      {activePersona && (
        <p className="text-muted-foreground -mt-1 text-xs">
          {activePersona.description}
        </p>
      )}

      {visible.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
          No reports match “{query}”. Try a different term or switch persona.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sections.map((s) => {
            const items = visible.filter((r) => r.section === s.id);
            if (!items.length) return null;
            return (
              <section
                key={s.id}
                className="bg-card flex flex-col rounded-xl border shadow-xs"
              >
                <div className="flex items-center gap-2 border-b px-4 py-2.5">
                  <h3 className="text-card-heading">{s.label}</h3>
                  <span className="text-muted-foreground ml-auto text-xs tabular-nums">
                    {items.length}
                  </span>
                </div>
                <ul className="flex flex-col p-1.5">
                  {items.map((r) => (
                    <li key={r.slug}>
                      <Link
                        href={`/reports/${r.slug}`}
                        className="hover:bg-muted/60 focus-visible:ring-ring group flex items-start gap-2 rounded-md px-2.5 py-2 focus-visible:ring-2 focus-visible:outline-none"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5 text-sm font-medium">
                            <span className="truncate">{r.name}</span>
                            {r.restricted && (
                              <Lock
                                className="text-warning-muted-foreground size-3 shrink-0"
                                aria-label="Restricted"
                              />
                            )}
                          </span>
                          <span className="text-muted-foreground line-clamp-1 text-xs">
                            {r.description}
                          </span>
                        </span>
                        <span className="text-muted-foreground mt-0.5 shrink-0 text-[10px] tabular-nums">
                          {r.spec.split(" ")[0]}
                        </span>
                        <ChevronRight className="text-muted-foreground mt-0.5 size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}
