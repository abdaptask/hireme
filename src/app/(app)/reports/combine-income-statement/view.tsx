"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  CalendarClock,
  Download,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { WidgetCard, BarList } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Period = "Month" | "Quarter" | "Year";

/** Each line item carries values per source (in USD). */
type Line = {
  key: string;
  label: string;
  /** Indent level for visual nesting. */
  indent?: 0 | 1;
  /** Subtotal/total rows are emphasized. */
  emphasize?: "subtotal" | "total";
  /** Whether positive deltas should be considered "good" (revenue) or bad (cost). */
  positiveIsGood?: boolean;
  entityA: number;
  entityB: number;
  eliminations: number;
  /** Prior period consolidated value, for YoY %. */
  priorConsolidated: number;
};

// All figures shown for the selected period (e.g. Q4 2025). Eliminations are
// intercompany transactions removed at consolidation.
const LINES: Line[] = [
  { key: "rev", label: "Revenue", entityA: 14_200_000, entityB: 11_800_000, eliminations: -1_200_000, priorConsolidated: 22_400_000, positiveIsGood: true },
  { key: "cogs", label: "Cost of goods sold", entityA: -5_100_000, entityB: -4_300_000, eliminations: 600_000, priorConsolidated: -8_600_000, positiveIsGood: false },
  { key: "gp", label: "Gross profit", emphasize: "subtotal", entityA: 9_100_000, entityB: 7_500_000, eliminations: -600_000, priorConsolidated: 13_800_000, positiveIsGood: true },
  { key: "opex_header", label: "Operating expenses", entityA: 0, entityB: 0, eliminations: 0, priorConsolidated: 0, positiveIsGood: false },
  { key: "sga", label: "Selling, general & admin", indent: 1, entityA: -2_900_000, entityB: -2_400_000, eliminations: 100_000, priorConsolidated: -4_900_000, positiveIsGood: false },
  { key: "rd", label: "Research & development", indent: 1, entityA: -1_400_000, entityB: -900_000, eliminations: 0, priorConsolidated: -2_100_000, positiveIsGood: false },
  { key: "mktg", label: "Marketing", indent: 1, entityA: -800_000, entityB: -600_000, eliminations: 50_000, priorConsolidated: -1_300_000, positiveIsGood: false },
  { key: "opex", label: "Total operating expenses", emphasize: "subtotal", indent: 0, entityA: -5_100_000, entityB: -3_900_000, eliminations: 150_000, priorConsolidated: -8_300_000, positiveIsGood: false },
  { key: "opinc", label: "Operating income", emphasize: "subtotal", entityA: 4_000_000, entityB: 3_600_000, eliminations: -450_000, priorConsolidated: 5_500_000, positiveIsGood: true },
  { key: "other", label: "Other income / (expense)", entityA: 180_000, entityB: -240_000, eliminations: 0, priorConsolidated: -50_000, positiveIsGood: true },
  { key: "pretax", label: "Income before tax", emphasize: "subtotal", entityA: 4_180_000, entityB: 3_360_000, eliminations: -450_000, priorConsolidated: 5_450_000, positiveIsGood: true },
  { key: "tax", label: "Income tax expense", entityA: -1_050_000, entityB: -840_000, eliminations: 110_000, priorConsolidated: -1_350_000, positiveIsGood: false },
  { key: "ni", label: "Net income", emphasize: "total", entityA: 3_130_000, entityB: 2_520_000, eliminations: -340_000, priorConsolidated: 4_100_000, positiveIsGood: true },
];

function fmtUsd(n: number): string {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  if (abs === 0) return "—";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

export default function CombineIncomeStatementView() {
  const [period, setPeriod] = useState<Period>("Quarter");
  const [compare, setCompare] = useState(true);

  const enriched = useMemo(
    () =>
      LINES.map((l) => {
        const combined = l.entityA + l.entityB;
        const consolidated = combined + l.eliminations;
        const yoyDelta = consolidated - l.priorConsolidated;
        const yoyPct = l.priorConsolidated
          ? Math.round((yoyDelta / Math.abs(l.priorConsolidated)) * 1000) / 10
          : 0;
        return { ...l, combined, consolidated, yoyDelta, yoyPct };
      }),
    [],
  );

  const consolidatedNi = enriched.find((l) => l.key === "ni")?.consolidated ?? 0;
  const consolidatedRev = enriched.find((l) => l.key === "rev")?.consolidated ?? 0;
  const entityARev = enriched.find((l) => l.key === "rev")?.entityA ?? 0;
  const entityBRev = enriched.find((l) => l.key === "rev")?.entityB ?? 0;

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
          title="Combine Income Statement"
          description="Consolidated income statement across entities · Entity A + Entity B with intercompany eliminations."
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
          <span className="text-muted-foreground font-medium">Period</span>
          <div className="bg-background flex rounded-md border p-0.5">
            {(["Month", "Quarter", "Year"] as Period[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={cn(
                  "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                  period === p
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </label>
        <label className="ml-2 flex cursor-pointer items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={compare}
            onChange={(e) => setCompare(e.target.checked)}
            className="size-3.5 accent-[color:var(--primary)]"
          />
          <span className="font-medium">Compare to prior period</span>
        </label>
        <Badge variant="secondary" className="ml-auto text-[10px]">
          {period === "Quarter" ? "Q4 2025 vs Q4 2024" : period === "Month" ? "Dec 2025 vs Dec 2024" : "FY 2025 vs FY 2024"}
        </Badge>
      </section>

      <WidgetCard title="Consolidated income statement" description="All figures in USD, millions">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left" style={{ fontSize: "var(--table-font)" }}>
            <thead className="bg-muted/40 text-muted-foreground border-b">
              <tr>
                <th className="px-3 py-2 font-medium">Line item</th>
                <th className="px-3 py-2 font-medium text-right">Entity A</th>
                <th className="px-3 py-2 font-medium text-right">Entity B</th>
                <th className="px-3 py-2 font-medium text-right">Combined</th>
                <th className="px-3 py-2 font-medium text-right">Eliminations</th>
                <th className="px-3 py-2 font-medium text-right">Consolidated</th>
                {compare && <th className="px-3 py-2 font-medium text-right">YoY %</th>}
              </tr>
            </thead>
            <tbody>
              {enriched.map((l) => {
                const isSubtotal = l.emphasize === "subtotal";
                const isTotal = l.emphasize === "total";
                const isHeader = l.key === "opex_header";
                const isGood = l.positiveIsGood ? l.yoyDelta >= 0 : l.yoyDelta <= 0;
                return (
                  <tr
                    key={l.key}
                    className={cn(
                      "border-b last:border-0",
                      isTotal && "bg-primary/5 font-semibold",
                      isSubtotal && "bg-muted/30 font-medium",
                      !isTotal && !isSubtotal && !isHeader && "hover:bg-muted/40",
                      isHeader && "text-muted-foreground text-xs uppercase tracking-wide",
                    )}
                  >
                    <td
                      className={cn(
                        "px-3 py-2",
                        l.indent === 1 && "pl-7",
                        isTotal && "font-semibold",
                      )}
                    >
                      {l.label}
                    </td>
                    {isHeader ? (
                      <>
                        <td colSpan={compare ? 6 : 5} />
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-2 text-right tabular-nums">{fmtUsd(l.entityA)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmtUsd(l.entityB)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmtUsd(l.combined)}</td>
                        <td className="text-muted-foreground px-3 py-2 text-right tabular-nums">
                          {fmtUsd(l.eliminations)}
                        </td>
                        <td className={cn("px-3 py-2 text-right tabular-nums", (isTotal || isSubtotal) && "font-semibold")}>
                          {fmtUsd(l.consolidated)}
                        </td>
                        {compare && (
                          <td
                            className={cn(
                              "px-3 py-2 text-right tabular-nums",
                              isGood ? "text-success-muted-foreground" : "text-danger-muted-foreground",
                            )}
                          >
                            <span className="inline-flex items-center gap-0.5">
                              {l.yoyDelta >= 0 ? (
                                <ArrowUpRight className="size-3" />
                              ) : (
                                <ArrowDownRight className="size-3" />
                              )}
                              {Math.abs(l.yoyPct)}%
                            </span>
                          </td>
                        )}
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </WidgetCard>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <WidgetCard title="Entity contribution" description="Share of consolidated revenue">
          <BarList
            rows={[
              { name: "Entity A", value: entityARev },
              { name: "Entity B", value: entityBRev },
              { name: "Eliminations", value: Math.abs(consolidatedRev - entityARev - entityBRev), tone: "neutral" },
            ]}
            tone="info"
            formatValue={(v) => fmtUsd(v)}
          />
          <p className="text-muted-foreground mt-3 text-xs">
            Entity A contributes{" "}
            <strong className="text-foreground">
              {Math.round((entityARev / (entityARev + entityBRev)) * 100)}%
            </strong>{" "}
            of gross revenue before eliminations.
          </p>
        </WidgetCard>

        <WidgetCard title="Key consolidated metrics" description={period === "Quarter" ? "Q4 2025" : period}>
          <ul className="flex flex-col gap-3">
            <Metric label="Revenue" value={fmtUsd(consolidatedRev)} delta={enriched.find((l) => l.key === "rev")!.yoyPct} good />
            <Metric label="Gross profit" value={fmtUsd(enriched.find((l) => l.key === "gp")!.consolidated)} delta={enriched.find((l) => l.key === "gp")!.yoyPct} good />
            <Metric label="Operating income" value={fmtUsd(enriched.find((l) => l.key === "opinc")!.consolidated)} delta={enriched.find((l) => l.key === "opinc")!.yoyPct} good />
            <Metric label="Net income" value={fmtUsd(consolidatedNi)} delta={enriched.find((l) => l.key === "ni")!.yoyPct} good emphasize />
          </ul>
        </WidgetCard>
      </div>
    </PageContainer>
  );
}

function Metric({
  label,
  value,
  delta,
  good,
  emphasize,
}: {
  label: string;
  value: string;
  delta: number;
  good: boolean;
  emphasize?: boolean;
}) {
  const positive = delta >= 0;
  const tone = (good ? positive : !positive) ? "text-success-muted-foreground" : "text-danger-muted-foreground";
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <li className="flex items-center justify-between gap-2">
      <span className={cn("text-sm", emphasize && "font-semibold")}>{label}</span>
      <span className="flex items-baseline gap-2">
        <span className={cn("tabular-nums", emphasize ? "text-lg font-semibold" : "text-sm font-medium")}>
          {value}
        </span>
        <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium tabular-nums", tone)}>
          <Icon className="size-3" />
          {Math.abs(delta)}%
        </span>
      </span>
    </li>
  );
}
