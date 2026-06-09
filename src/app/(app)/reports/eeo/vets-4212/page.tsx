"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, ShieldCheck } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { EeoDemoNotice } from "@/components/reports/eeo-demo-notice";
import { cn } from "@/lib/utils";
import {
  EEO_JOB_CATEGORIES,
  vetsMatrix,
  vetsNewHires,
} from "@/lib/eeo-mock";

const PERIODS = [
  "Fiscal Year 2026 (Oct 2025 – Sep 2026)",
  "Fiscal Year 2025 (Oct 2024 – Sep 2025)",
  "Fiscal Year 2024 (Oct 2023 – Sep 2024)",
];

export default function Vets4212Report() {
  const [period, setPeriod] = useState(PERIODS[0]);
  const [subjectToReport, setSubjectToReport] = useState(true);

  const matrix = vetsMatrix();
  const newHires = vetsNewHires();

  const totalWorkforce = EEO_JOB_CATEGORIES.reduce(
    (s, cat) => s + matrix[cat].total,
    0,
  );
  const totalVeterans = EEO_JOB_CATEGORIES.reduce(
    (s, cat) => s + matrix[cat].veterans,
    0,
  );
  const totalNewHires = EEO_JOB_CATEGORIES.reduce(
    (s, cat) => s + newHires[cat].total,
    0,
  );
  const totalVetNewHires = EEO_JOB_CATEGORIES.reduce(
    (s, cat) => s + newHires[cat].veterans,
    0,
  );

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
          title="VETS-4212 Veteran Report"
          description="Federal Contractor Veterans' Employment Report — annual filing required by the U.S. Department of Labor VETS division."
          actions={
            <Button variant="outline" size="sm">
              <Download className="size-4" /> Download VETS-4212 CSV
            </Button>
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
          <label className="ml-auto flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={subjectToReport}
              onChange={(e) => setSubjectToReport(e.target.checked)}
              className="size-3.5"
            />
            <span>Federal contractor (subject to VETS-4212)</span>
          </label>
        </div>
      </section>

      {/* Compliance banner */}
      {subjectToReport ? (
        <section className="bg-info/10 border-info/30 flex items-start gap-3 rounded-xl border p-4">
          <span className="bg-info/20 text-info-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <p className="text-card-heading">
              Subject to VETS-4212 reporting
            </p>
            <p className="text-muted-foreground mt-0.5 text-sm">
              Federal contractors and subcontractors with a contract of
              $150,000 or more must file annually with the U.S. Department of
              Labor VETS division by September 30.
            </p>
          </div>
        </section>
      ) : (
        <section className="bg-muted/40 flex items-start gap-3 rounded-xl border p-4">
          <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <p className="text-card-heading">Not subject to VETS-4212</p>
            <p className="text-muted-foreground mt-0.5 text-sm">
              No federal contract ≥ $150,000 currently flagged. Reports below
              are still produced for internal review.
            </p>
          </div>
        </section>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Total workforce" value={totalWorkforce.toLocaleString()} />
        <Kpi
          label="Protected veterans"
          value={totalVeterans.toLocaleString()}
          subtext={`${
            totalWorkforce > 0
              ? Math.round((totalVeterans / totalWorkforce) * 1000) / 10
              : 0
          }% of workforce`}
          tone="info"
        />
        <Kpi label="Total new hires" value={totalNewHires.toLocaleString()} />
        <Kpi
          label="Veteran new hires"
          value={totalVetNewHires.toLocaleString()}
          subtext={`${
            totalNewHires > 0
              ? Math.round((totalVetNewHires / totalNewHires) * 1000) / 10
              : 0
          }% of new hires`}
          tone="success"
        />
      </div>

      {/* Table 1: workforce at end of period */}
      <section className="bg-card overflow-hidden rounded-xl border shadow-xs">
        <div className="border-b px-4 py-2.5">
          <h2 className="text-card-heading">
            Workforce at end of reporting period
          </h2>
          <p className="text-metadata">
            Total employees and protected veterans by EEO-1 job category as of
            the reporting period close.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table
            className="w-full border-collapse text-left"
            style={{ fontSize: "var(--table-font)" }}
          >
            <thead className="text-muted-foreground border-b">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">
                  Job category
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Total employees
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Protected veterans
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Veteran %
                </th>
              </tr>
            </thead>
            <tbody>
              {EEO_JOB_CATEGORIES.map((cat) => {
                const m = matrix[cat];
                const pct =
                  m.total > 0
                    ? Math.round((m.veterans / m.total) * 1000) / 10
                    : 0;
                return (
                  <tr key={cat} className="hover:bg-muted/40 border-b last:border-0">
                    <td className="px-3 py-2 whitespace-nowrap">{cat}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {m.total}
                    </td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums">
                      {m.veterans}
                    </td>
                    <td className="text-muted-foreground px-3 py-2 text-right tabular-nums">
                      {pct}%
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-muted/40 border-t-2">
                <td className="px-3 py-2 font-semibold">Totals</td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">
                  {totalWorkforce}
                </td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">
                  {totalVeterans}
                </td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">
                  {totalWorkforce > 0
                    ? Math.round((totalVeterans / totalWorkforce) * 1000) / 10
                    : 0}
                  %
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Table 2: new hires during the period */}
      <section className="bg-card overflow-hidden rounded-xl border shadow-xs">
        <div className="border-b px-4 py-2.5">
          <h2 className="text-card-heading">
            New hires during the reporting period
          </h2>
          <p className="text-metadata">
            Employees hired between the period start and end dates by job
            category, with veteran new-hire counts.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table
            className="w-full border-collapse text-left"
            style={{ fontSize: "var(--table-font)" }}
          >
            <thead className="text-muted-foreground border-b">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">
                  Job category
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Total new hires
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Veteran new hires
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Veteran %
                </th>
              </tr>
            </thead>
            <tbody>
              {EEO_JOB_CATEGORIES.map((cat) => {
                const m = newHires[cat];
                const pct =
                  m.total > 0
                    ? Math.round((m.veterans / m.total) * 1000) / 10
                    : 0;
                return (
                  <tr key={cat} className="hover:bg-muted/40 border-b last:border-0">
                    <td className="px-3 py-2 whitespace-nowrap">{cat}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {m.total}
                    </td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums">
                      {m.veterans}
                    </td>
                    <td className="text-muted-foreground px-3 py-2 text-right tabular-nums">
                      {pct}%
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-muted/40 border-t-2">
                <td className="px-3 py-2 font-semibold">Totals</td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">
                  {totalNewHires}
                </td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">
                  {totalVetNewHires}
                </td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">
                  {totalNewHires > 0
                    ? Math.round((totalVetNewHires / totalNewHires) * 1000) /
                      10
                    : 0}
                  %
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-muted-foreground text-xs leading-relaxed">
        Annual submission deadline: <strong>September 30</strong>. Records
        retained for <strong>2 years</strong>. Filed via the VETS-4212
        Reporting Application at{" "}
        <span className="font-mono">vets4212.dol.gov</span>. Protected veteran
        categories include disabled veterans, recently separated veterans,
        active-duty wartime / campaign-badge veterans, and Armed Forces
        service-medal veterans (38 U.S.C. § 4212).
      </p>
    </PageContainer>
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
        <span className="text-muted-foreground text-xs">{subtext}</span>
      )}
    </div>
  );
}
