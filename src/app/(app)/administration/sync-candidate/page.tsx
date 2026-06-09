"use client";

/**
 * Sync Candidate — ATS sync admin page.
 * Push/pull candidates to JobDiva ATS. (CLAUDE.md §75.1, §82, §84)
 */
import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  AlertCircle,
  Clock,
  Database,
  RefreshCw,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { hoursAgo, minutesAgo, relativeTime } from "@/lib/clock";
import { cn } from "@/lib/utils";

type SyncRun = {
  id: string;
  type: "push" | "pull";
  records: number;
  status: "success" | "partial" | "failed";
  durationMs: number;
  at: Date;
};

const RECENT_RUNS: SyncRun[] = [
  { id: "r1", type: "push", records: 47, status: "success", durationMs: 18200, at: hoursAgo(3) },
  { id: "r2", type: "pull", records: 89, status: "success", durationMs: 24800, at: hoursAgo(3.1) },
  { id: "r3", type: "push", records: 32, status: "partial", durationMs: 16100, at: hoursAgo(7) },
  { id: "r4", type: "pull", records: 124, status: "success", durationMs: 31400, at: hoursAgo(11) },
  { id: "r5", type: "push", records: 51, status: "success", durationMs: 19900, at: hoursAgo(15) },
  { id: "r6", type: "pull", records: 76, status: "failed", durationMs: 4200, at: hoursAgo(22) },
  { id: "r7", type: "push", records: 28, status: "success", durationMs: 14100, at: hoursAgo(27) },
  { id: "r8", type: "pull", records: 142, status: "success", durationMs: 29800, at: hoursAgo(31) },
  { id: "r9", type: "push", records: 63, status: "success", durationMs: 21400, at: hoursAgo(39) },
  { id: "r10", type: "pull", records: 91, status: "partial", durationMs: 26100, at: hoursAgo(47) },
];

export default function SyncCandidatePage() {
  const [pushLimit, setPushLimit] = useState("50");
  const [pushDryRun, setPushDryRun] = useState(true);
  const [pullModifiedOnly, setPullModifiedOnly] = useState(true);
  const [pullFrom, setPullFrom] = useState("2026-06-01");
  const [pullTo, setPullTo] = useState("2026-06-08");
  const [lastAction, setLastAction] = useState<string | null>(null);

  function trigger(label: string) {
    console.log(`[sync-candidate] ${label} triggered (mock)`);
    setLastAction(`${label} triggered (mock) at ${relativeTime(minutesAgo(0))}`);
    setTimeout(() => setLastAction(null), 4000);
  }

  return (
    <PageContainer className="flex flex-col gap-6">
      <div>
        <Link
          href="/administration"
          className="text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-1 text-xs"
        >
          <ArrowLeft className="size-3.5" /> Administration
        </Link>
        <PageHeader
          title="Sync Candidate"
          description="ATS candidate sync — push / pull from external systems."
          actions={
            <Button variant="outline" size="sm" onClick={() => trigger("Full reconciliation")}>
              <RefreshCw className="size-4" /> Full reconcile
            </Button>
          }
        />
      </div>

      {lastAction && (
        <div className="bg-primary/10 text-primary border-primary/20 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
          <CheckCircle2 className="size-4" /> {lastAction}
        </div>
      )}

      {/* Last sync status */}
      <section className="bg-card overflow-hidden rounded-xl border shadow-xs">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Database className="text-muted-foreground size-4" />
            <h2 className="text-section-heading">Last sync status</h2>
          </div>
          <Badge variant="secondary" className="gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Connected
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-px md:grid-cols-3 lg:grid-cols-6">
          <StatTile label="ATS Provider" value="JobDiva" />
          <StatTile label="Last Full Sync" value="3h ago" sub={relativeTime(hoursAgo(3))} />
          <StatTile label="Records Pushed" value="1,247" sub="today" />
          <StatTile label="Records Pulled" value="89" sub="today" />
          <StatTile label="Failures" value="3" sub="today" tone="warn" />
          <StatTile label="Avg Latency" value="340ms" sub="p50" />
        </div>
      </section>

      {/* Action panels */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
          <div className="border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <ArrowUpFromLine className="text-muted-foreground size-4" />
              <h3 className="text-section-heading">Push to ATS</h3>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Send updated candidate records from HireMe to JobDiva.
            </p>
          </div>
          <div className="space-y-3 px-4 py-4">
            <div>
              <label className="text-data-label mb-1.5 block">Candidate count limit</label>
              <Input
                type="number"
                min={1}
                max={1000}
                value={pushLimit}
                onChange={(e) => setPushLimit(e.target.value)}
                className="max-w-32"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={pushDryRun}
                onChange={(e) => setPushDryRun(e.target.checked)}
                className="accent-primary size-4"
              />
              Dry run (validate without writing)
            </label>
            <Button
              size="sm"
              className="mt-2"
              onClick={() => trigger(`Push ${pushLimit} candidates${pushDryRun ? " (dry run)" : ""}`)}
            >
              <ArrowUpFromLine className="size-4" /> Start Push
            </Button>
          </div>
        </div>

        <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
          <div className="border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <ArrowDownToLine className="text-muted-foreground size-4" />
              <h3 className="text-section-heading">Pull from ATS</h3>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              Import new and changed candidate records from JobDiva.
            </p>
          </div>
          <div className="space-y-3 px-4 py-4">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="text-data-label mb-1.5 block">From</label>
                <Input
                  type="date"
                  value={pullFrom}
                  onChange={(e) => setPullFrom(e.target.value)}
                  className="max-w-40"
                />
              </div>
              <div>
                <label className="text-data-label mb-1.5 block">To</label>
                <Input
                  type="date"
                  value={pullTo}
                  onChange={(e) => setPullTo(e.target.value)}
                  className="max-w-40"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={pullModifiedOnly}
                onChange={(e) => setPullModifiedOnly(e.target.checked)}
                className="accent-primary size-4"
              />
              Only modified records
            </label>
            <Button
              size="sm"
              className="mt-2"
              onClick={() =>
                trigger(
                  `Pull ${pullFrom} → ${pullTo}${pullModifiedOnly ? " (modified only)" : ""}`,
                )
              }
            >
              <ArrowDownToLine className="size-4" /> Start Pull
            </Button>
          </div>
        </div>
      </section>

      {/* Recent sync log */}
      <section className="bg-card overflow-hidden rounded-xl border shadow-xs">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Clock className="text-muted-foreground size-4" />
            <h2 className="text-section-heading">Recent sync log</h2>
          </div>
          <span className="text-muted-foreground text-xs">Last 10 runs</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-data-label bg-muted/40 border-b">
                <th className="px-4 py-2 text-left font-medium">Timestamp</th>
                <th className="px-4 py-2 text-left font-medium">Type</th>
                <th className="px-4 py-2 text-right font-medium">Records</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-right font-medium">Duration</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_RUNS.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30 border-b last:border-0">
                  <td className="px-4 py-2.5">{relativeTime(r.at)}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className="capitalize">
                      {r.type === "push" ? (
                        <ArrowUpFromLine className="size-3" />
                      ) : (
                        <ArrowDownToLine className="size-3" />
                      )}
                      {r.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">{r.records}</td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="text-muted-foreground px-4 py-2.5 text-right font-mono tabular-nums">
                    {(r.durationMs / 1000).toFixed(1)}s
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </PageContainer>
  );
}

function StatTile({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "warn";
}) {
  return (
    <div className="bg-card p-4">
      <p className="text-data-label">{label}</p>
      <p
        className={cn(
          "mt-1 text-xl font-semibold tracking-tight tabular-nums",
          tone === "warn" && "text-amber-600 dark:text-amber-400",
        )}
      >
        {value}
      </p>
      {sub && <p className="text-muted-foreground mt-0.5 text-xs">{sub}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: "success" | "partial" | "failed" }) {
  if (status === "success") {
    return (
      <Badge variant="outline" className="border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="size-3" /> Success
      </Badge>
    );
  }
  if (status === "partial") {
    return (
      <Badge variant="outline" className="border-amber-500/30 text-amber-700 dark:text-amber-400">
        <AlertCircle className="size-3" /> Partial
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-destructive/30 text-destructive">
      <AlertCircle className="size-3" /> Failed
    </Badge>
  );
}
