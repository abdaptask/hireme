"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { WidgetCard, BarList } from "@/components/dashboard/widgets";
import { EeoDemoNotice } from "@/components/reports/eeo-demo-notice";
import { cn } from "@/lib/utils";
import {
  APPLICANTS,
  EEO_JOB_CATEGORIES,
  RACE_ETHNICITY_GROUPS,
  applicantsAtStage,
} from "@/lib/eeo-mock";

const DATE_RANGES = [
  "Last quarter",
  "Last 30 days",
  "Year to date",
  "Trailing 12 months",
];
const CLIENTS = [
  "All clients",
  "Meridian Health",
  "Cobalt Systems",
  "Vertex Financial",
  "Atlas Manufacturing",
  "Northwind Logistics",
];

export default function ApplicantFlowReport() {
  const [dateRange, setDateRange] = useState(DATE_RANGES[0]);
  const [jobCategory, setJobCategory] = useState("All categories");
  const [client, setClient] = useState(CLIENTS[0]);

  const total = APPLICANTS.length;
  const screened = applicantsAtStage("Screened");
  const interviewed = applicantsAtStage("Interviewed");
  const offered = applicantsAtStage("Offered");
  const hired = applicantsAtStage("Hired");
  const selectionRatio = total > 0 ? Math.round((hired / total) * 1000) / 10 : 0;

  /* Funnel data for BarList. */
  const funnel = [
    { name: "Applied", value: total },
    { name: "Screened", value: screened },
    { name: "Interviewed", value: interviewed },
    { name: "Offered", value: offered },
    { name: "Hired", value: hired },
  ];

  /* Per-demographic stage counts. */
  type DemoRow = {
    group: string;
    applied: number;
    interviewed: number;
    hired: number;
  };
  const demographicRows: DemoRow[] = RACE_ETHNICITY_GROUPS.map((re) => {
    const filter = (a: { raceEthnicity: string }) => a.raceEthnicity === re;
    return {
      group: re,
      applied: APPLICANTS.filter(filter).length,
      interviewed: applicantsAtStage("Interviewed", filter),
      hired: applicantsAtStage("Hired", filter),
    };
  });

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
          title="Applicant Flow Log"
          description="OFCCP-required applicant tracking with demographic flow through the selection funnel (§57)."
          actions={
            <Button variant="outline" size="sm">
              <Download className="size-4" /> Export CSV
            </Button>
          }
        />
      </div>

      <EeoDemoNotice />

      {/* Filter bar */}
      <section className="bg-card flex flex-col gap-3 rounded-xl border p-3 shadow-xs sm:flex-row sm:items-center sm:gap-4">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs">
            <span className="text-data-label">Date range</span>
            <select
              className="bg-background h-8 rounded-md border px-2 text-xs"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              {DATE_RANGES.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs">
            <span className="text-data-label">Job category</span>
            <select
              className="bg-background h-8 rounded-md border px-2 text-xs"
              value={jobCategory}
              onChange={(e) => setJobCategory(e.target.value)}
            >
              <option>All categories</option>
              {EEO_JOB_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs">
            <span className="text-data-label">Client</span>
            <select
              className="bg-background h-8 rounded-md border px-2 text-xs"
              value={client}
              onChange={(e) => setClient(e.target.value)}
            >
              {CLIENTS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Total applicants" value={total.toLocaleString()} />
        <Kpi label="Reached interview" value={interviewed.toLocaleString()} />
        <Kpi label="Hired" value={hired.toLocaleString()} tone="success" />
        <Kpi
          label="Selection ratio"
          value={`${selectionRatio}%`}
          subtext="hired / applied"
        />
      </div>

      {/* Funnel + demographics */}
      <div className="grid gap-4 lg:grid-cols-2">
        <WidgetCard
          title="Selection funnel"
          description="Cumulative count reaching each stage"
        >
          <BarList rows={funnel} tone="info" />
        </WidgetCard>

        <WidgetCard
          title="Hired by race / ethnicity"
          description="Distribution of selected applicants"
        >
          <BarList
            rows={demographicRows.map((r) => ({
              name: r.group,
              value: r.hired,
            }))}
            tone="success"
          />
        </WidgetCard>
      </div>

      {/* Demographic breakdown table */}
      <section className="bg-card overflow-hidden rounded-xl border shadow-xs">
        <div className="border-b px-4 py-2.5">
          <h2 className="text-card-heading">
            Demographic flow — by race / ethnicity
          </h2>
          <p className="text-metadata">
            Counts at each stage with the resulting selection rate (hired /
            applied) per group.
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
                  Group
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Applied
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Interviewed
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Hired
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Selection rate
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Interview rate
                </th>
              </tr>
            </thead>
            <tbody>
              {demographicRows.map((r) => {
                const sel =
                  r.applied > 0
                    ? Math.round((r.hired / r.applied) * 1000) / 10
                    : 0;
                const interview =
                  r.applied > 0
                    ? Math.round((r.interviewed / r.applied) * 1000) / 10
                    : 0;
                return (
                  <tr key={r.group} className="hover:bg-muted/40 border-b last:border-0">
                    <td className="px-3 py-2 font-medium whitespace-nowrap">
                      {r.group}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {r.applied}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {r.interviewed}
                    </td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums">
                      {r.hired}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {sel}%
                    </td>
                    <td className="text-muted-foreground px-3 py-2 text-right tabular-nums">
                      {interview}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-muted-foreground text-xs leading-relaxed">
        Required EEO record retention: <strong>2 years</strong> for federal
        contractors (or 3 years for contractors with 150+ employees and
        government contracts ≥ $150,000). Applicant flow logs are the first
        artifact reviewed in OFCCP compliance evaluations.
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
  tone?: "success" | "neutral";
}) {
  return (
    <div className="bg-card flex flex-col gap-1 rounded-xl border p-3.5 shadow-xs">
      <span className="text-data-label">{label}</span>
      <span
        className={cn(
          "text-2xl font-semibold tabular-nums tracking-tight",
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
