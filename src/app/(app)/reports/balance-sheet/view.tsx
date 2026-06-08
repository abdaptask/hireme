"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Banknote,
  Building2,
  CalendarClock,
  Coins,
  Download,
  Scale,
  Wallet,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatTile } from "@/components/workspace/stat-tile";
import { cn } from "@/lib/utils";

type Line = {
  label: string;
  current: number;
  prior: number;
};

type Group = {
  id: string;
  label: string;
  lines: Line[];
};

const ASSETS_CURRENT: Group = {
  id: "current-assets",
  label: "Current assets",
  lines: [
    { label: "Cash & equivalents", current: 18_400_000, prior: 15_200_000 },
    { label: "Accounts receivable", current: 12_900_000, prior: 11_800_000 },
    { label: "Inventory", current: 7_800_000, prior: 8_400_000 },
    { label: "Prepaid expenses", current: 1_300_000, prior: 1_100_000 },
  ],
};

const ASSETS_NONCURRENT: Group = {
  id: "noncurrent-assets",
  label: "Non-current assets",
  lines: [
    { label: "Property, plant & equipment", current: 24_600_000, prior: 22_900_000 },
    { label: "Intangible assets", current: 6_800_000, prior: 7_100_000 },
    { label: "Goodwill", current: 9_400_000, prior: 9_400_000 },
    { label: "Other long-term assets", current: 2_100_000, prior: 1_900_000 },
  ],
};

const LIABILITIES_CURRENT: Group = {
  id: "current-liab",
  label: "Current liabilities",
  lines: [
    { label: "Accounts payable", current: 8_600_000, prior: 7_900_000 },
    { label: "Accrued expenses", current: 4_200_000, prior: 3_800_000 },
    { label: "Short-term debt", current: 3_400_000, prior: 4_100_000 },
    { label: "Deferred revenue", current: 2_100_000, prior: 1_700_000 },
  ],
};

const LIABILITIES_LONGTERM: Group = {
  id: "lt-liab",
  label: "Long-term liabilities",
  lines: [
    { label: "Long-term debt", current: 18_900_000, prior: 21_400_000 },
    { label: "Deferred tax liabilities", current: 2_700_000, prior: 2_500_000 },
    { label: "Other long-term liabilities", current: 1_400_000, prior: 1_300_000 },
  ],
};

const EQUITY: Group = {
  id: "equity",
  label: "Stockholders' equity",
  lines: [
    { label: "Common stock", current: 3_000_000, prior: 3_000_000 },
    { label: "Additional paid-in capital", current: 14_800_000, prior: 14_400_000 },
    { label: "Retained earnings", current: 21_900_000, prior: 17_700_000 },
    { label: "Other comprehensive income", current: 1_100_000, prior: 900_000 },
  ],
};

function fmtUsd(n: number): string {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

function sum(g: Group, key: "current" | "prior") {
  return g.lines.reduce((acc, l) => acc + l[key], 0);
}

export default function BalanceSheetView() {
  const [asOf, setAsOf] = useState("2025-12-31");

  const totals = useMemo(() => {
    const currentAssets = sum(ASSETS_CURRENT, "current");
    const nonCurrentAssets = sum(ASSETS_NONCURRENT, "current");
    const totalAssets = currentAssets + nonCurrentAssets;

    const currentLiab = sum(LIABILITIES_CURRENT, "current");
    const longTermLiab = sum(LIABILITIES_LONGTERM, "current");
    const totalLiab = currentLiab + longTermLiab;

    const totalEquity = sum(EQUITY, "current");

    const priorCurrentAssets = sum(ASSETS_CURRENT, "prior");
    const priorCurrentLiab = sum(LIABILITIES_CURRENT, "prior");

    const workingCapital = currentAssets - currentLiab;
    const currentRatio = Math.round((currentAssets / currentLiab) * 100) / 100;
    const debtToEquity = Math.round((totalLiab / totalEquity) * 100) / 100;

    const priorWorkingCapital = priorCurrentAssets - priorCurrentLiab;
    const priorCurrentRatio = Math.round((priorCurrentAssets / priorCurrentLiab) * 100) / 100;

    return {
      currentAssets,
      nonCurrentAssets,
      totalAssets,
      currentLiab,
      longTermLiab,
      totalLiab,
      totalEquity,
      workingCapital,
      currentRatio,
      debtToEquity,
      priorWorkingCapital,
      priorCurrentRatio,
    };
  }, []);

  return (
    <PageContainer className="flex flex-col gap-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-1"
          nativeButton={false}
          render={<Link href="/reports" />}
        >
          <ArrowLeft className="size-4" /> Reports
        </Button>
        <PageHeader
          title="Balance Sheet"
          description="As-of consolidated balance sheet · assets, liabilities, and equity with prior-period comparison."
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="size-3.5" /> Export CSV
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" disabled title="Scheduled delivery lands in v0.9">
                <CalendarClock className="size-3.5" /> Schedule report
              </Button>
            </div>
          }
        />
      </div>

      {/* Filter bar */}
      <section className="bg-card flex flex-wrap items-center gap-3 rounded-xl border p-3 shadow-xs">
        <label className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground font-medium">As of</span>
          <input
            type="date"
            value={asOf}
            onChange={(e) => setAsOf(e.target.value)}
            className="bg-background hover:bg-muted h-7 cursor-pointer rounded-md border px-2 text-xs font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          />
        </label>
        <Badge variant="secondary" className="ml-auto text-[10px]">
          Compare to prior year: 2024-12-31
        </Badge>
      </section>

      {/* Health ratios */}
      <section>
        <h2 className="text-section-heading mb-2.5">Financial health</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            icon={Wallet}
            label="Working capital"
            value={fmtUsd(totals.workingCapital)}
            tone={totals.workingCapital > 0 ? "success" : "danger"}
          />
          <StatTile
            icon={Scale}
            label="Current ratio"
            value={totals.currentRatio.toFixed(2)}
            tone={totals.currentRatio >= 1.5 ? "success" : totals.currentRatio >= 1 ? "warning" : "danger"}
          />
          <StatTile
            icon={Coins}
            label="Debt-to-equity"
            value={totals.debtToEquity.toFixed(2)}
            tone={totals.debtToEquity < 1 ? "success" : totals.debtToEquity < 1.5 ? "warning" : "danger"}
          />
          <StatTile
            icon={Banknote}
            label="Total assets"
            value={fmtUsd(totals.totalAssets)}
            tone="info"
          />
        </div>
      </section>

      {/* Three-column layout */}
      <section className="grid gap-5 xl:grid-cols-3">
        <SectionCard
          icon={Building2}
          title="Assets"
          total={totals.totalAssets}
          tone="info"
          groups={[ASSETS_CURRENT, ASSETS_NONCURRENT]}
          groupTotals={[
            { label: "Total current assets", current: totals.currentAssets, prior: sum(ASSETS_CURRENT, "prior") },
            { label: "Total non-current assets", current: totals.nonCurrentAssets, prior: sum(ASSETS_NONCURRENT, "prior") },
          ]}
        />
        <SectionCard
          icon={Coins}
          title="Liabilities"
          total={totals.totalLiab}
          tone="warning"
          groups={[LIABILITIES_CURRENT, LIABILITIES_LONGTERM]}
          groupTotals={[
            { label: "Total current liabilities", current: totals.currentLiab, prior: sum(LIABILITIES_CURRENT, "prior") },
            { label: "Total long-term liabilities", current: totals.longTermLiab, prior: sum(LIABILITIES_LONGTERM, "prior") },
          ]}
        />
        <SectionCard
          icon={Wallet}
          title="Equity"
          total={totals.totalEquity}
          tone="success"
          groups={[EQUITY]}
          groupTotals={[
            { label: "Total equity", current: totals.totalEquity, prior: sum(EQUITY, "prior") },
          ]}
        />
      </section>

      {/* Balance check */}
      <section
        className={cn(
          "rounded-xl border p-4 text-sm",
          totals.totalAssets === totals.totalLiab + totals.totalEquity
            ? "border-success/30 bg-success-muted/30 text-success-muted-foreground"
            : "border-warning/30 bg-warning-muted/30 text-warning-muted-foreground",
        )}
      >
        <p className="font-medium">Balance check</p>
        <p className="mt-1 tabular-nums">
          Total assets {fmtUsd(totals.totalAssets)} = Total liabilities {fmtUsd(totals.totalLiab)} + Total equity{" "}
          {fmtUsd(totals.totalEquity)}
          {totals.totalAssets !== totals.totalLiab + totals.totalEquity && (
            <span> · variance {fmtUsd(totals.totalAssets - totals.totalLiab - totals.totalEquity)}</span>
          )}
        </p>
      </section>
    </PageContainer>
  );
}

function SectionCard({
  icon: Icon,
  title,
  total,
  tone,
  groups,
  groupTotals,
}: {
  icon: typeof Banknote;
  title: string;
  total: number;
  tone: "info" | "warning" | "success";
  groups: Group[];
  groupTotals: { label: string; current: number; prior: number }[];
}) {
  const toneBg: Record<typeof tone, string> = {
    info: "bg-info-muted text-info-muted-foreground",
    warning: "bg-warning-muted text-warning-muted-foreground",
    success: "bg-success-muted text-success-muted-foreground",
  };
  return (
    <section className="bg-card flex flex-col rounded-xl border shadow-xs">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <span className={cn("flex size-8 items-center justify-center rounded-lg", toneBg[tone])}>
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-card-heading">{title}</h2>
          <p className="text-metadata">Total {fmtUsd(total)}</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4">
        {groups.map((g, gi) => {
          const sub = groupTotals[gi];
          return (
            <div key={g.id}>
              <p className="text-data-label mb-2">{g.label}</p>
              <ul className="flex flex-col">
                {g.lines.map((l) => {
                  const delta = l.current - l.prior;
                  const positive = delta >= 0;
                  return (
                    <li
                      key={l.label}
                      className="hover:bg-muted/40 flex items-center justify-between gap-2 rounded px-1 py-1.5 text-sm"
                    >
                      <span className="truncate">{l.label}</span>
                      <span className="flex items-baseline gap-2">
                        <span className="tabular-nums">{fmtUsd(l.current)}</span>
                        <span
                          className={cn(
                            "inline-flex w-14 items-center justify-end gap-0.5 text-xs tabular-nums",
                            positive ? "text-success-muted-foreground" : "text-danger-muted-foreground",
                          )}
                        >
                          {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                          {fmtUsd(Math.abs(delta))}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
              {sub && (
                <div className="bg-muted/40 mt-1 flex items-center justify-between rounded px-1 py-1.5 text-sm font-semibold">
                  <span>{sub.label}</span>
                  <span className="tabular-nums">{fmtUsd(sub.current)}</span>
                </div>
              )}
            </div>
          );
        })}
        <div
          className={cn(
            "mt-auto flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold",
            toneBg[tone],
          )}
        >
          <span>Total {title.toLowerCase()}</span>
          <span className="tabular-nums">{fmtUsd(total)}</span>
        </div>
      </div>
    </section>
  );
}
