"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { EeoDemoNotice } from "@/components/reports/eeo-demo-notice";
import { cn } from "@/lib/utils";
import {
  EEO_JOB_CATEGORIES,
  EEO_RECORDS,
  RACE_ETHNICITY_GROUPS,
  categoryTotals,
  workforceMatrix,
  workforceTotals,
  type EeoJobCategory,
} from "@/lib/eeo-mock";

const PERIODS = [
  "Calendar Year 2026",
  "Calendar Year 2025",
  "Calendar Year 2024",
];
const ESTABLISHMENTS = [
  "Consolidated (all establishments)",
  "Headquarters — Dallas, TX",
  "Houston Operations",
  "Remote workforce",
];

export default function WorkforceCompositionReport() {
  const [period, setPeriod] = useState(PERIODS[0]);
  const [establishment, setEstablishment] = useState(ESTABLISHMENTS[0]);

  const matrix = workforceMatrix();
  const totals = workforceTotals();

  return (
    <PageContainer className="flex flex-col gap-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-1"
          nativeButton={false}
          render={<Link href="/reports/eeo" />}
        >
          <ArrowLeft className="size-4" /> EEOC Reports
        </Button>
        <PageHeader
          title="EEO-1 Workforce Composition"
          description="EEOC Component 1 — annual workforce composition by job category, race/ethnicity, and sex (§57, §66)."
          actions={
            <>
              <Button variant="outline" size="sm">
                <Download className="size-4" /> Export EEO-1 CSV
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="size-4" /> Download EEOC-formatted XML
              </Button>
            </>
          }
        />
      </div>

      <EeoDemoNotice />

      {/* Filter row */}
      <section className="bg-card flex flex-col gap-3 rounded-xl border p-3 shadow-xs sm:flex-row sm:items-center sm:gap-4">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs">
            <span className="text-data-label">Reporting period</span>
            <select
              className="bg-background h-8 rounded-md border px-2 text-xs"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              {PERIODS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs">
            <span className="text-data-label">Establishment</span>
            <select
              className="bg-background h-8 rounded-md border px-2 text-xs"
              value={establishment}
              onChange={(e) => setEstablishment(e.target.value)}
            >
              {ESTABLISHMENTS.map((e) => (
                <option key={e}>{e}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Total workforce" value={totals.total.toLocaleString()} />
        <Kpi
          label="Female"
          value={`${totals.femalePct}%`}
          subtext={`${totals.totalF.toLocaleString()} workers`}
        />
        <Kpi
          label="Male"
          value={`${totals.malePct}%`}
          subtext={`${totals.totalM.toLocaleString()} workers`}
        />
        <Kpi
          label="Underrepresented minorities"
          value={`${totals.minorityPct}%`}
          subtext={`${totals.minority.toLocaleString()} workers`}
          tone="info"
        />
      </div>

      {/* The big EEO-1 grid */}
      <section className="bg-card overflow-hidden rounded-xl border shadow-xs">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <div className="min-w-0">
            <h2 className="text-card-heading">
              EEO-1 Component 1 — Workforce composition
            </h2>
            <p className="text-metadata">
              Job category × race/ethnicity × sex. {period.toLowerCase()} ·{" "}
              {establishment.toLowerCase()}.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table
            className="w-full min-w-[1400px] border-collapse text-left"
            style={{ fontSize: "var(--table-font)" }}
          >
            <thead className="bg-muted/40 text-muted-foreground text-xs">
              <tr className="border-b">
                <th
                  scope="col"
                  rowSpan={2}
                  className="sticky left-0 z-10 bg-inherit px-2 py-2 font-medium align-bottom"
                >
                  Job category
                </th>
                {RACE_ETHNICITY_GROUPS.map((re) => (
                  <th
                    key={re}
                    scope="col"
                    colSpan={2}
                    className="border-l px-2 py-1.5 text-center font-medium"
                  >
                    {re}
                  </th>
                ))}
                <th
                  scope="col"
                  colSpan={3}
                  className="border-l px-2 py-1.5 text-center font-medium"
                >
                  Overall
                </th>
              </tr>
              <tr className="border-b">
                {RACE_ETHNICITY_GROUPS.map((re) => (
                  <Hcols key={re} />
                ))}
                <th scope="col" className="border-l px-2 py-1.5 text-right font-medium">
                  M
                </th>
                <th scope="col" className="px-2 py-1.5 text-right font-medium">
                  F
                </th>
                <th scope="col" className="px-2 py-1.5 text-right font-medium">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {EEO_JOB_CATEGORIES.map((cat) => {
                const ct = categoryTotals(cat);
                return (
                  <tr key={cat} className="hover:bg-muted/30 border-b last:border-0">
                    <td className="bg-card sticky left-0 z-10 px-2 py-2 font-medium whitespace-nowrap">
                      {cat}
                    </td>
                    {RACE_ETHNICITY_GROUPS.map((re) => {
                      const cell = matrix[cat][re];
                      return (
                        <RaceCells
                          key={re}
                          m={cell.M}
                          f={cell.F}
                        />
                      );
                    })}
                    <td className="border-l px-2 py-2 text-right tabular-nums">
                      {ct.m}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">{ct.f}</td>
                    <td className="px-2 py-2 text-right font-semibold tabular-nums">
                      {ct.total}
                    </td>
                  </tr>
                );
              })}
              <TotalsRow matrix={matrix} totals={totals} />
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-muted-foreground text-xs leading-relaxed">
        Aggregated from {EEO_RECORDS.length} active workforce records. Includes
        consultants, internal employees, and active onboarding candidates.
        EEO-1 filing window for prior calendar year typically opens in April
        (EEOC). Filing required for private employers with 100+ employees and
        federal contractors with 50+ employees.
      </p>
    </PageContainer>
  );
}

/* --------------------------------- Pieces --------------------------------- */

function Hcols() {
  return (
    <>
      <th
        scope="col"
        className="border-l px-2 py-1.5 text-right font-medium"
      >
        M
      </th>
      <th scope="col" className="px-2 py-1.5 text-right font-medium">
        F
      </th>
    </>
  );
}

function RaceCells({ m, f }: { m: number; f: number }) {
  return (
    <>
      <td className="border-l px-2 py-2 text-right tabular-nums">
        {m === 0 ? <span className="text-muted-foreground/50">—</span> : m}
      </td>
      <td className="px-2 py-2 text-right tabular-nums">
        {f === 0 ? <span className="text-muted-foreground/50">—</span> : f}
      </td>
    </>
  );
}

function TotalsRow({
  matrix,
  totals,
}: {
  matrix: ReturnType<typeof workforceMatrix>;
  totals: ReturnType<typeof workforceTotals>;
}) {
  const reSums = RACE_ETHNICITY_GROUPS.map((re) => {
    let m = 0;
    let f = 0;
    for (const cat of EEO_JOB_CATEGORIES) {
      m += matrix[cat][re].M;
      f += matrix[cat][re].F;
    }
    return { re, m, f };
  });
  return (
    <tr className="bg-muted/40 border-t-2">
      <td className="bg-muted/40 sticky left-0 z-10 px-2 py-2 font-semibold whitespace-nowrap">
        Totals
      </td>
      {reSums.map((c) => (
        <RaceCells key={c.re} m={c.m} f={c.f} />
      ))}
      <td className="border-l px-2 py-2 text-right font-semibold tabular-nums">
        {totals.totalM}
      </td>
      <td className="px-2 py-2 text-right font-semibold tabular-nums">
        {totals.totalF}
      </td>
      <td className="px-2 py-2 text-right font-bold tabular-nums">
        {totals.total}
      </td>
    </tr>
  );
}

function Kpi({
  label,
  value,
  subtext,
  tone = "neutral",
}: {
  label: string;
  value: string;
  subtext?: string;
  tone?: "info" | "success" | "neutral";
}) {
  return (
    <div className="bg-card flex flex-col gap-1 rounded-xl border p-3.5 shadow-xs">
      <span className="text-data-label">{label}</span>
      <span
        className={cn(
          "text-2xl font-semibold tabular-nums tracking-tight",
          tone === "info" && "text-info-muted-foreground",
          tone === "success" && "text-success-muted-foreground",
        )}
      >
        {value}
      </span>
      {subtext && (
        <span className="text-muted-foreground text-xs tabular-nums">
          {subtext}
        </span>
      )}
    </div>
  );
}
