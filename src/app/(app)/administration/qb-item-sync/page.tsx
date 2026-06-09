"use client";

/**
 * QB Item Sync — QuickBooks service items / bill rate / customer sync.
 * (CLAUDE.md §75.13, §82, §84)
 */
import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpFromLine,
  CheckCircle2,
  AlertCircle,
  Clock,
  Package,
  Building2,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { hoursAgo, minutesAgo, relativeTime } from "@/lib/clock";
import { cn } from "@/lib/utils";

type SyncRun = {
  id: string;
  type: "items" | "rates" | "customers";
  records: number;
  status: "success" | "partial" | "failed";
  durationMs: number;
  at: Date;
};

const RECENT_RUNS: SyncRun[] = [
  { id: "r1", type: "items", records: 47, status: "success", durationMs: 16400, at: minutesAgo(25) },
  { id: "r2", type: "rates", records: 47, status: "success", durationMs: 9100, at: hoursAgo(1.5) },
  { id: "r3", type: "customers", records: 8, status: "success", durationMs: 4200, at: hoursAgo(3) },
  { id: "r4", type: "items", records: 62, status: "success", durationMs: 18800, at: hoursAgo(7) },
  { id: "r5", type: "rates", records: 31, status: "partial", durationMs: 11200, at: hoursAgo(12) },
  { id: "r6", type: "customers", records: 12, status: "success", durationMs: 5800, at: hoursAgo(18) },
  { id: "r7", type: "items", records: 89, status: "success", durationMs: 24400, at: hoursAgo(24) },
  { id: "r8", type: "rates", records: 22, status: "success", durationMs: 8400, at: hoursAgo(29) },
  { id: "r9", type: "items", records: 51, status: "success", durationMs: 17800, at: hoursAgo(36) },
  { id: "r10", type: "customers", records: 6, status: "success", durationMs: 3400, at: hoursAgo(44) },
];

const ITEM_TYPES = [
  { label: "Service", count: 982, sub: "consulting, hourly billing" },
  { label: "Inventory", count: 134, sub: "tracked hardware" },
  { label: "Non-inventory", count: 218, sub: "shipping, license keys" },
  { label: "Other", count: 68, sub: "fees, discounts, adjustments" },
];

export default function QbItemSyncPage() {
  const [lastAction, setLastAction] = useState<string | null>(null);

  function trigger(label: string) {
    console.log(`[qb-item-sync] ${label} triggered (mock)`);
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
          title="QB Item Sync"
          description="QuickBooks invoice items, service codes, bill rates."
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
            <Package className="text-muted-foreground size-4" />
            <h2 className="text-section-heading">Last sync status</h2>
          </div>
          <Badge variant="secondary" className="gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500" /> QB Online · Connected
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-px md:grid-cols-4">
          <StatTile label="Service Items Synced" value="1,402" sub="active" />
          <StatTile label="Bill Rates Updated" value="47" sub="today" />
          <StatTile label="Customers Synced" value="89" sub="active" />
          <StatTile label="Last Sync" value="25m ago" sub={relativeTime(minutesAgo(25))} />
        </div>
      </section>

      {/* Item type table */}
      <section className="bg-card overflow-hidden rounded-xl border shadow-xs">
        <div className="border-b px-4 py-3">
          <h2 className="text-section-heading">Items by type</h2>
          <p className="text-muted-foreground mt-0.5 text-xs">
            QuickBooks item-type breakdown across all synced records.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-px md:grid-cols-4">
          {ITEM_TYPES.map((t) => (
            <div key={t.label} className="bg-card p-4">
              <p className="text-data-label">{t.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {t.count.toLocaleString()}
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs">{t.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Action panels */}
      <section className="grid gap-4 md:grid-cols-3">
        <ActionPanel
          title="All items"
          description="Full sync of service, inventory, and non-inventory items."
          onClick={() => trigger("Sync all items")}
        />
        <ActionPanel
          title="Bill rates only"
          description="Push updated per-item bill rates for active consultants."
          onClick={() => trigger("Sync bill rates")}
        />
        <ActionPanel
          title="Customer changes only"
          description="Sync new and modified customer (end-client) records."
          icon={Building2}
          onClick={() => trigger("Sync customers")}
        />
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
  icon: Icon = ArrowUpFromLine,
}: {
  title: string;
  description: string;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="bg-card flex flex-col rounded-xl border p-4 shadow-xs">
      <h3 className="text-card-heading">{title}</h3>
      <p className="text-muted-foreground mt-1 mb-3 grow text-xs">{description}</p>
      <Button size="sm" onClick={onClick}>
        <Icon className="size-4" /> Start sync
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
