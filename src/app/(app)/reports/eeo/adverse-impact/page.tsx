"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Download,
  XCircle,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { EeoDemoNotice } from "@/components/reports/eeo-demo-notice";
import { cn } from "@/lib/utils";
import { APPLICANTS, applicantsAtStage } from "@/lib/eeo-mock";

const EVENTS = ["Hire", "Promotion", "Termination"] as const;
const DATE_RANGES = [
  "Last quarter",
  "Year to date",
  "Trailing 12 months",
  "Calendar Year 2025",
];
const COMPARISON = ["All groups", "Race / ethnicity only", "Sex only"];

type GroupRow = {
  group: string;
  applicants: number;
  selected: number;
};

/** Build the analysis rows for the chosen event. */
function buildRows(): GroupRow[] {
  const re = [
    "White",
    "Black or African American",
    "Hispanic/Latino",
    "Asian",
    "Two or More Races",
  ] as const;
  const fromRace: GroupRow[] = re.map((r) => ({
    group: r,
    applicants: APPLICANTS.filter((a) => a.raceEthnicity === r).length,
    selected: applicantsAtStage("Hired", (a) => a.raceEthnicity === r),
  }));
  const female: GroupRow = {
    group: "Female (overall)",
    applicants: APPLICANTS.filter((a) => a.sex === "F").length,
    selected: applicantsAtStage("Hired", (a) => a.sex === "F"),
  };
  return [...fromRace, female];
}

export default function AdverseImpactReport() {
  const [event, setEvent] = useState<(typeof EVENTS)[number]>("Hire");
  const [dateRange, setDateRange] = useState(DATE_RANGES[0]);
  const [comparison, setComparison] = useState(COMPARISON[0]);
  const [explanationOpen, setExplanationOpen] = useState(false);

  const rows = buildRows();
  const withRate = rows.map((r) => ({
    ...r,
    rate: r.applicants > 0 ? r.selected / r.applicants : 0,
  }));
  const highest = withRate.reduce((m, r) => (r.rate > m ? r.rate : m), 0);
  const analyzed = withRate.map((r) => {
    const pct = highest > 0 ? r.rate / highest : 0;
    return {
      ...r,
      pctOfHighest: pct,
      pass: pct >= 0.8,
    };
  });
  const failed = analyzed.filter((r) => !r.pass);

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
          title="Adverse Impact Analysis"
          description="EEOC Uniform Guidelines 4/5ths (80%) rule analysis across demographic groups (§57)."
          actions={
            <Button variant="outline" size="sm">
              <Download className="size-4" /> Export
            </Button>
          }
        />
      </div>

      <EeoDemoNotice />

      {/* Filter bar */}
      <section className="bg-card flex flex-col gap-3 rounded-xl border p-3 shadow-xs sm:flex-row sm:items-center sm:gap-4">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs">
            <span className="text-data-label">Selection event</span>
            <select
              className="bg-background h-8 rounded-md border px-2 text-xs"
              value={event}
              onChange={(e) => setEvent(e.target.value as typeof event)}
            >
              {EVENTS.map((e) => (
                <option key={e}>{e}</option>
              ))}
            </select>
          </label>
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
            <span className="text-data-label">Comparison</span>
            <select
              className="bg-background h-8 rounded-md border px-2 text-xs"
              value={comparison}
              onChange={(e) => setComparison(e.target.value)}
            >
              {COMPARISON.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* Result banner */}
      {failed.length === 0 ? (
        <section className="bg-success/10 border-success/30 flex items-start gap-3 rounded-xl border p-4">
          <span className="bg-success/20 text-success-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
            <CheckCircle2 className="size-5" />
          </span>
          <div>
            <p className="text-card-heading">No adverse impact detected</p>
            <p className="text-muted-foreground mt-0.5 text-sm">
              All groups passed the 4/5ths threshold for the selected
              {" "}
              <strong>{event.toLowerCase()}</strong> event in{" "}
              {dateRange.toLowerCase()}.
            </p>
          </div>
        </section>
      ) : (
        <section className="bg-danger/10 border-danger/30 flex items-start gap-3 rounded-xl border p-4">
          <span className="bg-danger/20 text-danger-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
            <AlertTriangle className="size-5" />
          </span>
          <div>
            <p className="text-card-heading">
              Adverse impact flagged: {failed.length}{" "}
              {failed.length === 1 ? "group is" : "groups are"} below the
              4/5ths threshold
            </p>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {failed.map((f) => f.group).join(", ")} — selection rate falls
              below 80% of the highest-performing group for{" "}
              {event.toLowerCase()} in {dateRange.toLowerCase()}.
            </p>
          </div>
        </section>
      )}

      {/* Rule explanation */}
      <section className="bg-card overflow-hidden rounded-xl border shadow-xs">
        <button
          type="button"
          onClick={() => setExplanationOpen((v) => !v)}
          className="hover:bg-muted/40 flex w-full items-center gap-2 border-b px-4 py-2.5 text-left"
        >
          {explanationOpen ? (
            <ChevronDown className="text-muted-foreground size-4" />
          ) : (
            <ChevronRight className="text-muted-foreground size-4" />
          )}
          <span className="text-card-heading">How the 4/5ths rule works</span>
        </button>
        {explanationOpen && (
          <div className="text-muted-foreground space-y-2 px-4 py-3 text-sm leading-relaxed">
            <p>
              Under the EEOC&apos;s Uniform Guidelines on Employee Selection
              Procedures (29 CFR § 1607), a selection rate for any race, sex,
              or ethnic group that is less than four-fifths (80%) of the rate
              for the group with the highest rate is generally regarded as
              evidence of adverse impact.
            </p>
            <p>
              For each group: <strong>selection rate</strong> = selected ÷
              applicants. Then compute{" "}
              <strong>group rate ÷ highest group rate</strong>. If the ratio
              is below <strong>0.80</strong>, the group fails the 4/5ths
              test and the disparity warrants further investigation.
            </p>
            <p>
              Note: small sample sizes can produce statistically unreliable
              results. The 4/5ths rule is a screening heuristic — confirmatory
              analysis typically uses Fisher&apos;s exact test or standard
              deviation analysis.
            </p>
          </div>
        )}
      </section>

      {/* Selection rate table */}
      <section className="bg-card overflow-hidden rounded-xl border shadow-xs">
        <div className="border-b px-4 py-2.5">
          <h2 className="text-card-heading">Selection rate analysis</h2>
          <p className="text-metadata">
            {event} event · highest rate ={" "}
            {Math.round(highest * 1000) / 10}% (reference group)
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
                  Applicants
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Selected
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Selection rate
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  vs Highest
                </th>
                <th scope="col" className="px-3 py-2 text-center font-medium">
                  4/5ths
                </th>
              </tr>
            </thead>
            <tbody>
              {analyzed.map((r) => {
                const rate = Math.round(r.rate * 1000) / 10;
                const pct = Math.round(r.pctOfHighest * 1000) / 10;
                return (
                  <tr
                    key={r.group}
                    className="hover:bg-muted/40 border-b last:border-0"
                  >
                    <td className="px-3 py-2 font-medium whitespace-nowrap">
                      {r.group}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {r.applicants}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {r.selected}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {rate}%
                    </td>
                    <td
                      className={cn(
                        "px-3 py-2 text-right tabular-nums",
                        r.pass
                          ? "text-foreground"
                          : "text-danger-muted-foreground font-medium",
                      )}
                    >
                      {pct}%
                    </td>
                    <td className="px-3 py-2 text-center">
                      {r.pass ? (
                        <span className="text-success-muted-foreground inline-flex items-center gap-1 text-xs font-medium">
                          <CheckCircle2 className="size-3.5" /> Pass
                        </span>
                      ) : (
                        <span className="text-danger-muted-foreground inline-flex items-center gap-1 text-xs font-medium">
                          <XCircle className="size-3.5" /> Fail
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Action required */}
      {failed.length > 0 && (
        <section className="bg-card rounded-xl border p-4 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="bg-warning/20 text-warning-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
              <AlertTriangle className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-card-heading">Action required</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Disparities flagged above require investigation under OFCCP
                and Title VII compliance obligations. Recommended next steps:
              </p>
              <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-5 text-sm">
                <li>
                  Review selection criteria for the affected events — confirm
                  each is job-related and consistent with business necessity.
                </li>
                <li>
                  Audit recruiter and hiring manager decision patterns for
                  the flagged groups; check for inconsistent application of
                  screening criteria.
                </li>
                <li>
                  Run confirmatory statistical analysis (Fisher&apos;s exact
                  test, two standard deviations) to rule out small-sample
                  noise.
                </li>
                <li>
                  Document findings and any remediation in the OFCCP
                  Affirmative Action Plan (AAP) impact analysis section.
                </li>
                <li>
                  Engage Legal / Compliance before externalizing remediation
                  decisions.
                </li>
              </ul>
            </div>
          </div>
        </section>
      )}

      <p className="text-muted-foreground text-xs leading-relaxed">
        Reference: 29 CFR § 1607.4(D) — Uniform Guidelines on Employee
        Selection Procedures. Adverse impact analyses must be retained as
        part of the employer&apos;s Affirmative Action Plan documentation.
      </p>
    </PageContainer>
  );
}
