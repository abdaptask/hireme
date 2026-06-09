"use client";

/**
 * QB Sync — QuickBooks employee sync admin page.
 * Pay rates, deductions, direct deposit. (CLAUDE.md §75.4, §82, §84)
 */
import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpFromLine,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  Users,
  ArrowRight,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { hoursAgo, minutesAgo, relativeTime } from "@/lib/clock";
import { cn } from "@/lib/utils";

type SyncRun = {
  id: string;
  type: "employees" | "rates" | "deductions";
  records: number;
  status: "success" | "partial" | "failed";
  durationMs: number;
  at: Date;
};

const RECENT_RUNS: SyncRun[] = [
  { id: "r1", type: "employees", records: 12, status: "success", durationMs: 8400, at: minutesAgo(12) },
  { id: "r2", type: "rates", records: 12, status: "success", durationMs: 6100, at: hoursAgo(1) },
  { id: "r3", type: "deductions", records: 4, status: "success", durationMs: 3200, at: hoursAgo(2) },
  { id: "r4", type: "employees", records: 18, status: "success", durationMs: 11200, at: hoursAgo(6) },
  { id: "r5", type: "rates", records: 22, status: "partial", durationMs: 14800, at: hoursAgo(10) },
  { id: "r6", type: "employees", records: 31, status: "success", durationMs: 17600, at: hoursAgo(15) },
  { id: "r7", type: "deductions", records: 8, status: "success", durationMs: 4400, at: hoursAgo(20) },
  { id: "r8", type: "rates", records: 15, status: "success", durationMs: 9200, at: hoursAgo(26) },
  { id: "r9", type: "employees", records: 27, status: "success", durationMs: 16800, at: hoursAgo(33) },
  { id: "r10", type: "deductions", records: 6, status: "success", durationMs: 3900, at: hoursAgo(40) },
];

const FIELD_MAP: { qb: string; hireme: string; note?: string }[] = [
  { qb: "DisplayName", hireme: "consultant.legalName" },
  { qb: "PrimaryEmailAddr", hireme: "consultant.email" },
  { qb: "EmployeeNumber", hireme: "consultant.payrollWorkerId", note: "source of truth: QB" },
  { qb: "HiredDate", hireme: "consultant.startDate" },
  { qb: "PayRate.HourlyRate", hireme: "assignment.payRate" },
  { qb: "DirectDeposit.RoutingNumber", hireme: "payroll.routingNumber" },
  { qb: "DirectDeposit.AccountNumber", hireme: "payroll.accountNumber", note: "masked" },
  { qb: "Deduction.Type", hireme: "payroll.deductionType" },
  { qb: "TaxJurisdiction.State", hireme: "consultant.workState" },
];

export default function QbSyncPage() {
  const [lastAction, setLastAction] = useState<string | null>(null);

  function trigger(label: string) {
    console.log(`[qb-sync] ${label} triggered (mock)`);
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
          title="QB Sync"
          description="QuickBooks employee sync — pay, deductions, direct deposit."
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
            <Users className="text-muted-foreground size-4" />
            <h2 className="text-section-heading">Last sync status</h2>
          </div>
          <Badge variant="secondary" className="gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500" /> QB Online · Connected
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-px md:grid-cols-3 lg:grid-cols-6">
          <StatTile label="Connection" value="Connected" sub="QB Online" tone="ok" />
          <StatTile label="Last Sync" value="12m ago" sub={relativeTime(minutesAgo(12))} />
          <StatTile label="Employees Synced" value="384" sub="active" />
          <StatTile label="Pay Rate Updates" value="12" sub="today" />
          <StatTile label="Deduction Updates" value="4" sub="today" />
          <StatTile label="Errors" value="0" sub="today" tone="ok" />
        </div>
      </section>

      {/* Action panels */}
      <section className="grid gap-4 md:grid-cols-3">
        <ActionPanel
          title="Push employees"
          description="Send new and updated employee records to QuickBooks Online."
          onClick={() => trigger("Push employees")}
        />
        <ActionPanel
          title="Push pay rates"
          description="Sync hourly / salary changes from assignments to QB pay rates."
          onClick={() => trigger("Push pay rates")}
        />
        <ActionPanel
          title="Push deductions"
          description="Update benefit deductions, garnishments, and pre-tax items."
          onClick={() => trigger("Push deductions")}
        />
      </section>

      {/* Field map */}
      <section className="bg-card overflow-hidden rounded-xl border shadow-xs">
        <div className="border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <DollarSign className="text-muted-foreground size-4" />
            <h2 className="text-section-heading">Field translation map</h2>
          </div>
          <p className="text-muted-foreground mt-0.5 text-xs">
            QuickBooks field → HireMe field. Read-only. Edit in Workflow Studio.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-data-label bg-muted/40 border-b">
                <th className="px-4 py-2 text-left font-medium">QB Field</th>
                <th className="px-4 py-2 text-left font-medium"></th>
                <th className="px-4 py-2 text-left font-medium">HireMe Field</th>
                <th className="px-4 py-2 text-left font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {FIELD_MAP.map((m) => (
                <tr key={m.qb} className="hover:bg-muted/30 border-b last:border-0">
                  <td className="px-4 py-2 font-mono text-xs">{m.qb}</td>
                  <td className="text-muted-foreground px-2 py-2">
                    <ArrowRight className="size-3.5" />
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">{m.hireme}</td>
                  <td className="text-muted-foreground px-4 py-2 text-xs italic">
                    {m.note ?? ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

function ActionPanel({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <div className="bg-card flex flex-col rounded-xl border p-4 shadow-xs">
      <h3 className="text-card-heading">{title}</h3>
      <p className="text-muted-foreground mt-1 mb-3 grow text-xs">{description}</p>
      <Button size="sm" onClick={onClick}>
        <ArrowUpFromLine className="size-4" /> Start sync
      </Button>
    </div>
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
  tone?: "ok" | "warn";
}) {
  return (
    <div className="bg-card p-4">
      <p className="text-data-label">{label}</p>
      <p
        className={cn(
          "mt-1 text-xl font-semibold tracking-tight tabular-nums",
          tone === "ok" && "text-emerald-600 dark:text-emerald-400",
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
