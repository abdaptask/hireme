"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Banknote,
  CalendarClock,
  CircleDollarSign,
  Clock,
  Download,
  FileText,
  TriangleAlert,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { WidgetCard } from "@/components/dashboard/widgets";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { StatTile } from "@/components/workspace/stat-tile";
import {
  DrillDownSheet,
  type DrillDownColumn,
} from "@/components/reports/drill-down-sheet";
import {
  FilterBar,
  FilterSelect,
  formatUsdCompact,
  formatUsdValue,
} from "@/components/reports/report-ui";
import type { StatusTone } from "@/lib/types";
import { cn } from "@/lib/utils";

type InvoiceStatus = "Paid" | "Open" | "Overdue";

type Invoice = {
  id: string;
  client: string;
  date: string;
  due: string;
  amount: number;
  status: InvoiceStatus;
  daysOutstanding: number;
};

const STATUS_META: Record<InvoiceStatus, { tone: StatusTone; label: string }> = {
  Paid: { tone: "success", label: "Paid" },
  Open: { tone: "info", label: "Open" },
  Overdue: { tone: "danger", label: "Overdue" },
};

const CLIENTS = [
  "Meridian Health",
  "Cobalt Systems",
  "Vertex Financial",
  "Northwind Logistics",
  "Atlas Manufacturing",
];

function buildInvoices(): Invoice[] {
  const seeds: Array<Omit<Invoice, "id"> & { i: number }> = [
    { i: 4821, client: "Meridian Health", date: "May 02", due: "Jun 01", amount: 84_500, status: "Paid", daysOutstanding: 0 },
    { i: 4822, client: "Cobalt Systems", date: "May 02", due: "Jun 01", amount: 112_000, status: "Paid", daysOutstanding: 0 },
    { i: 4823, client: "Vertex Financial", date: "May 02", due: "Jun 01", amount: 68_900, status: "Paid", daysOutstanding: 0 },
    { i: 4824, client: "Atlas Manufacturing", date: "May 09", due: "Jun 08", amount: 41_200, status: "Paid", daysOutstanding: 0 },
    { i: 4825, client: "Northwind Logistics", date: "May 09", due: "Jun 08", amount: 36_800, status: "Open", daysOutstanding: 4 },
    { i: 4826, client: "Meridian Health", date: "May 16", due: "Jun 15", amount: 92_300, status: "Open", daysOutstanding: 11 },
    { i: 4827, client: "Cobalt Systems", date: "May 16", due: "Jun 15", amount: 124_500, status: "Open", daysOutstanding: 11 },
    { i: 4828, client: "Vertex Financial", date: "May 23", due: "Jun 22", amount: 72_100, status: "Open", daysOutstanding: 18 },
    { i: 4829, client: "Atlas Manufacturing", date: "May 23", due: "Jun 22", amount: 38_900, status: "Open", daysOutstanding: 18 },
    { i: 4830, client: "Northwind Logistics", date: "May 30", due: "Jun 29", amount: 41_700, status: "Open", daysOutstanding: 25 },
    { i: 4831, client: "Meridian Health", date: "Jun 06", due: "Jul 06", amount: 88_900, status: "Open", daysOutstanding: 32 },
    { i: 4832, client: "Cobalt Systems", date: "Jun 06", due: "Jul 06", amount: 118_200, status: "Open", daysOutstanding: 32 },
    { i: 4833, client: "Vertex Financial", date: "Jun 13", due: "Jul 13", amount: 64_800, status: "Open", daysOutstanding: 39 },
    { i: 4834, client: "Atlas Manufacturing", date: "Jun 13", due: "Jul 13", amount: 36_400, status: "Open", daysOutstanding: 39 },
    { i: 4835, client: "Northwind Logistics", date: "Jun 20", due: "Jul 20", amount: 39_900, status: "Open", daysOutstanding: 46 },
    { i: 4836, client: "Meridian Health", date: "Jun 20", due: "Jul 20", amount: 89_100, status: "Open", daysOutstanding: 46 },
    { i: 4798, client: "Cobalt Systems", date: "Mar 28", due: "Apr 27", amount: 96_400, status: "Overdue", daysOutstanding: 67 },
    { i: 4799, client: "Northwind Logistics", date: "Mar 28", due: "Apr 27", amount: 32_800, status: "Overdue", daysOutstanding: 67 },
    { i: 4801, client: "Atlas Manufacturing", date: "Apr 04", due: "May 04", amount: 28_100, status: "Overdue", daysOutstanding: 61 },
    { i: 4807, client: "Vertex Financial", date: "Apr 18", due: "May 18", amount: 57_900, status: "Overdue", daysOutstanding: 50 },
    { i: 4808, client: "Northwind Logistics", date: "Apr 18", due: "May 18", amount: 34_200, status: "Overdue", daysOutstanding: 50 },
    { i: 4811, client: "Meridian Health", date: "Apr 25", due: "May 25", amount: 88_500, status: "Overdue", daysOutstanding: 43 },
    { i: 4812, client: "Cobalt Systems", date: "Apr 25", due: "May 25", amount: 104_300, status: "Overdue", daysOutstanding: 43 },
    { i: 4815, client: "Atlas Manufacturing", date: "May 02", due: "Jun 01", amount: 41_200, status: "Open", daysOutstanding: 7 },
    { i: 4760, client: "Vertex Financial", date: "Feb 21", due: "Mar 23", amount: 21_900, status: "Overdue", daysOutstanding: 95 },
    { i: 4761, client: "Cobalt Systems", date: "Feb 21", due: "Mar 23", amount: 14_300, status: "Overdue", daysOutstanding: 95 },
    { i: 4845, client: "Meridian Health", date: "Jun 27", due: "Jul 27", amount: 91_800, status: "Open", daysOutstanding: 53 },
    { i: 4846, client: "Cobalt Systems", date: "Jun 27", due: "Jul 27", amount: 121_400, status: "Open", daysOutstanding: 53 },
    { i: 4847, client: "Northwind Logistics", date: "Jun 27", due: "Jul 27", amount: 43_500, status: "Open", daysOutstanding: 53 },
    { i: 4850, client: "Atlas Manufacturing", date: "Jul 04", due: "Aug 03", amount: 39_600, status: "Open", daysOutstanding: 60 },
    { i: 4851, client: "Vertex Financial", date: "Jul 04", due: "Aug 03", amount: 66_400, status: "Open", daysOutstanding: 60 },
    { i: 4852, client: "Meridian Health", date: "Jul 04", due: "Aug 03", amount: 90_200, status: "Open", daysOutstanding: 60 },
  ];
  return seeds.map(({ i, ...rest }) => ({ id: `INV-${i}`, ...rest }));
}

const INVOICES: Invoice[] = buildInvoices();

const KPIS = {
  openInvoices: INVOICES.filter((i) => i.status !== "Paid").length,
  totalOutstanding: 487_000,
  avgDpo: 38,
  overdueOver60: 52_000,
  paidThisWeek: 234_000,
};

const AGING_BUCKETS: { label: string; min: number; max: number; tone: string }[] = [
  { label: "0–30", min: 0, max: 30, tone: "bg-success" },
  { label: "31–60", min: 31, max: 60, tone: "bg-info" },
  { label: "61–90", min: 61, max: 90, tone: "bg-warning" },
  { label: "90+", min: 91, max: 9999, tone: "bg-danger" },
];

const CLIENT_FILTER = ["All", ...CLIENTS];
const STATUS_FILTER: ("All" | InvoiceStatus)[] = ["All", "Paid", "Open", "Overdue"];
const BUCKET_FILTER = ["All", ...AGING_BUCKETS.map((b) => b.label)];

const DRILL_COLUMNS: DrillDownColumn<Invoice>[] = [
  { key: "id", label: "Invoice #", accessor: (r) => r.id },
  { key: "client", label: "Client", accessor: (r) => r.client },
  { key: "date", label: "Date", accessor: (r) => r.date },
  { key: "due", label: "Due", accessor: (r) => r.due },
  {
    key: "amount",
    label: "Amount",
    accessor: (r) => formatUsdValue(r.amount),
    sortValue: (r) => r.amount,
    align: "right",
  },
  { key: "status", label: "Status", accessor: (r) => r.status },
  {
    key: "days",
    label: "Days Out",
    accessor: (r) => r.daysOutstanding,
    sortValue: (r) => r.daysOutstanding,
    align: "right",
  },
];

export default function ClientsInvoiceView() {
  const [client, setClient] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"All" | InvoiceStatus>("All");
  const [bucket, setBucket] = useState("All");
  const [drillInvoice, setDrillInvoice] = useState<Invoice | null>(null);

  const filtered = useMemo(() => {
    return INVOICES.filter((i) => {
      if (client !== "All" && i.client !== client) return false;
      if (statusFilter !== "All" && i.status !== statusFilter) return false;
      if (bucket !== "All") {
        const b = AGING_BUCKETS.find((x) => x.label === bucket);
        if (b && (i.daysOutstanding < b.min || i.daysOutstanding > b.max)) return false;
      }
      return true;
    });
  }, [client, statusFilter, bucket]);

  const agingDistribution = AGING_BUCKETS.map((b) => {
    const matching = INVOICES.filter(
      (i) =>
        i.status !== "Paid" &&
        i.daysOutstanding >= b.min &&
        i.daysOutstanding <= b.max,
    );
    return {
      ...b,
      count: matching.length,
      amount: matching.reduce((s, i) => s + i.amount, 0),
    };
  });
  const maxBucketAmount = Math.max(...agingDistribution.map((b) => b.amount), 1);

  return (
    <PageContainer className="flex flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-1" nativeButton={false} render={<Link href="/reports" />}>
          <ArrowLeft className="size-4" /> Reports
        </Button>
        <PageHeader
          title="Clients Invoice Report"
          description="Receivables, aging buckets and days-payable across the client portfolio."
          actions={
            <>
              <Button variant="outline" size="sm">
                <Download className="size-3.5" /> Export CSV
              </Button>
              <Button variant="outline" size="sm">
                <CalendarClock className="size-3.5" /> Schedule
              </Button>
            </>
          }
        />
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile icon={FileText} label="Open Invoices" value={KPIS.openInvoices} tone="info" />
        <StatTile icon={CircleDollarSign} label="Total Outstanding" value={formatUsdCompact(KPIS.totalOutstanding)} tone="warning" />
        <StatTile icon={Clock} label="Avg DPO" value={KPIS.avgDpo} suffix="days" />
        <StatTile icon={TriangleAlert} label="Overdue > 60d" value={formatUsdCompact(KPIS.overdueOver60)} tone="danger" />
        <StatTile icon={Banknote} label="Paid This Week" value={formatUsdCompact(KPIS.paidThisWeek)} tone="success" />
      </section>

      <FilterBar>
        <FilterSelect label="Client" value={client} options={CLIENT_FILTER} onChange={setClient} />
        <FilterSelect
          label="Status"
          value={statusFilter}
          options={STATUS_FILTER as readonly string[]}
          onChange={(v) => setStatusFilter(v as "All" | InvoiceStatus)}
        />
        <FilterSelect label="Aging bucket" value={bucket} options={BUCKET_FILTER} onChange={setBucket} />
        <FilterSelect
          label="Date range"
          value="last-180d"
          options={["last-30d", "last-90d", "last-180d", "ytd"]}
          onChange={() => {}}
        />
        <span className="text-muted-foreground self-end text-xs">
          {filtered.length} of {INVOICES.length} invoices
        </span>
      </FilterBar>

      <WidgetCard title="Aging buckets" description="Open balance by days outstanding">
        <div className="flex items-end gap-3">
          {agingDistribution.map((b) => (
            <div key={b.label} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-sm font-semibold tabular-nums">{formatUsdCompact(b.amount)}</span>
              <div
                className={cn(b.tone, "w-full rounded-md")}
                style={{ height: `${Math.max((b.amount / maxBucketAmount) * 120, 8)}px` }}
              />
              <span className="text-metadata">
                {b.label} days · {b.count}
              </span>
            </div>
          ))}
        </div>
      </WidgetCard>

      <WidgetCard
        title="Invoices"
        description={`${filtered.length} invoice${filtered.length === 1 ? "" : "s"} — click a row to inspect`}
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left" style={{ fontSize: "var(--table-font)" }}>
            <thead className="text-muted-foreground border-b">
              <tr>
                <th className="px-2 py-2 font-medium">Invoice #</th>
                <th className="px-2 py-2 font-medium">Client</th>
                <th className="px-2 py-2 font-medium">Date</th>
                <th className="px-2 py-2 font-medium">Due</th>
                <th className="px-2 py-2 text-right font-medium">Amount</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2 text-right font-medium">Days Out</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => setDrillInvoice(inv)}
                  className="hover:bg-muted/50 cursor-pointer border-b last:border-0"
                >
                  <td className="px-2 py-2 font-medium whitespace-nowrap">{inv.id}</td>
                  <td className="px-2 py-2 whitespace-nowrap">{inv.client}</td>
                  <td className="text-muted-foreground px-2 py-2 tabular-nums whitespace-nowrap">{inv.date}</td>
                  <td className="text-muted-foreground px-2 py-2 tabular-nums whitespace-nowrap">{inv.due}</td>
                  <td className="px-2 py-2 text-right font-semibold tabular-nums">{formatUsdValue(inv.amount)}</td>
                  <td className="px-2 py-2">
                    <StatusBadge tone={STATUS_META[inv.status].tone}>
                      {STATUS_META[inv.status].label}
                    </StatusBadge>
                  </td>
                  <td
                    className={cn(
                      "px-2 py-2 text-right tabular-nums",
                      inv.daysOutstanding > 60
                        ? "text-danger-muted-foreground"
                        : inv.daysOutstanding > 30
                          ? "text-warning-muted-foreground"
                          : "text-muted-foreground",
                    )}
                  >
                    {inv.daysOutstanding === 0 ? "—" : inv.daysOutstanding}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </WidgetCard>

      <DrillDownSheet
        open={!!drillInvoice}
        onOpenChange={(o) => !o && setDrillInvoice(null)}
        title={drillInvoice ? `${drillInvoice.id} — ${drillInvoice.client}` : ""}
        description="Invoice line items (mock)"
        columns={DRILL_COLUMNS}
        rows={drillInvoice ? [drillInvoice] : []}
      />
    </PageContainer>
  );
}
