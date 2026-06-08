"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Banknote,
  CalendarClock,
  Download,
  Laptop,
  PackageX,
  Truck,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { WidgetCard, BarList } from "@/components/dashboard/widgets";
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
} from "@/components/reports/report-ui";
import type { StatusTone } from "@/lib/types";
import { cn } from "@/lib/utils";

const KPIS = {
  activeAssets: 312,
  pendingDelivery: 18,
  inRepair: 6,
  returnsDue: 9,
  totalValue: 487_000,
};

type AssetTypeRow = {
  type: string;
  count: number;
  assigned: number;
  available: number;
  inTransit: number;
  inRepair: number;
  lost: number;
};

const ASSET_TYPES: AssetTypeRow[] = [
  { type: "Laptops", count: 187, assigned: 168, available: 9, inTransit: 6, inRepair: 3, lost: 1 },
  { type: "Monitors", count: 95, assigned: 84, available: 8, inTransit: 2, inRepair: 1, lost: 0 },
  { type: "Phones", count: 67, assigned: 59, available: 4, inTransit: 3, inRepair: 1, lost: 0 },
  { type: "Headsets", count: 124, assigned: 108, available: 10, inTransit: 5, inRepair: 1, lost: 0 },
  { type: "Security tokens", count: 38, assigned: 35, available: 2, inTransit: 1, inRepair: 0, lost: 0 },
];

const STATUSES: { label: string; count: number; tone: StatusTone }[] = [
  { label: "Assigned", count: 454, tone: "success" },
  { label: "Available", count: 33, tone: "info" },
  { label: "In Transit", count: 17, tone: "warning" },
  { label: "In Repair", count: 6, tone: "danger" },
  { label: "Lost", count: 1, tone: "danger" },
];

type Shipment = {
  id: string;
  asset: string;
  consultant: string;
  client: string;
  carrier: string;
  trackingNo: string;
  expected: string;
  delayDays: number;
  startInDays: number;
};

const SHIPMENT_EXCEPTIONS: Shipment[] = [
  { id: "SH-1142", asset: "MacBook Pro 14", consultant: "Marcus Webb", client: "Northwind Logistics", carrier: "FedEx", trackingNo: "7714 8830 2199", expected: "Jun 11", delayDays: 5, startInDays: 1 },
  { id: "SH-1148", asset: "Dell UltraSharp 27", consultant: "Ravi Menon", client: "Cobalt Systems", carrier: "UPS", trackingNo: "1Z 999 AA 1023 4567", expected: "Jun 09", delayDays: 7, startInDays: 3 },
  { id: "SH-1155", asset: "iPhone 15", consultant: "Owen Bradley", client: "Northwind Logistics", carrier: "USPS", trackingNo: "9400 1112 3456 7890", expected: "Jun 10", delayDays: 4, startInDays: 2 },
  { id: "SH-1163", asset: "MacBook Air 13", consultant: "Sarah Chen", client: "Atlas Manufacturing", carrier: "FedEx", trackingNo: "7714 9001 8843", expected: "Jun 12", delayDays: 3, startInDays: 4 },
];

const BY_CLIENT: { client: string; count: number }[] = [
  { client: "Meridian Health", count: 78 },
  { client: "Cobalt Systems", count: 68 },
  { client: "Vertex Financial", count: 55 },
  { client: "Northwind Logistics", count: 42 },
  { client: "Atlas Manufacturing", count: 38 },
  { client: "Other", count: 31 },
];

const BY_LOCATION: { location: string; count: number }[] = [
  { location: "New York, NY", count: 71 },
  { location: "Dallas / Austin, TX", count: 64 },
  { location: "Chicago, IL", count: 32 },
  { location: "Remote (shipped)", count: 89 },
  { location: "San Francisco / SJ", count: 56 },
];

const TYPE_FILTER = ["All", ...ASSET_TYPES.map((t) => t.type)];
const STATUS_FILTER = ["All", ...STATUSES.map((s) => s.label)];

const SHIPMENT_COLUMNS: DrillDownColumn<Shipment>[] = [
  { key: "id", label: "Shipment", accessor: (r) => r.id },
  { key: "asset", label: "Asset", accessor: (r) => r.asset },
  { key: "consultant", label: "Consultant", accessor: (r) => r.consultant },
  { key: "client", label: "Client", accessor: (r) => r.client },
  { key: "carrier", label: "Carrier", accessor: (r) => r.carrier },
  {
    key: "delayDays",
    label: "Delay",
    accessor: (r) => `${r.delayDays}d`,
    sortValue: (r) => r.delayDays,
    align: "right",
  },
];

export default function EquipmentView() {
  const [type, setType] = useState("All");
  const [status, setStatus] = useState("All");
  const [drillShipments, setDrillShipments] = useState(false);

  const filteredTypes = useMemo(
    () => ASSET_TYPES.filter((t) => type === "All" || t.type === type),
    [type],
  );
  // status filter is illustrative — kept for parity with the spec.
  void status;

  return (
    <PageContainer className="flex flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" className="-ml-2 mb-1" nativeButton={false} render={<Link href="/reports" />}>
          <ArrowLeft className="size-4" /> Reports
        </Button>
        <PageHeader
          title="Equipment Report"
          description="Provisioning, shipment and asset lifecycle status across the workforce."
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
        <StatTile icon={Laptop} label="Active Assets" value={KPIS.activeAssets} />
        <StatTile icon={Truck} label="Pending Delivery" value={KPIS.pendingDelivery} tone="info" />
        <StatTile icon={Wrench} label="In Repair" value={KPIS.inRepair} tone="warning" />
        <StatTile icon={PackageX} label="Returns Due" value={KPIS.returnsDue} tone="warning" />
        <StatTile icon={Banknote} label="Total Asset Value" value={formatUsdCompact(KPIS.totalValue)} tone="success" />
      </section>

      <FilterBar>
        <FilterSelect label="Asset Type" value={type} options={TYPE_FILTER} onChange={setType} />
        <FilterSelect label="Status" value={status} options={STATUS_FILTER} onChange={setStatus} />
      </FilterBar>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <WidgetCard title="By asset type" description="Status mix across the fleet">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left" style={{ fontSize: "var(--table-font)" }}>
              <thead className="text-muted-foreground border-b">
                <tr>
                  <th className="px-2 py-2 font-medium">Type</th>
                  <th className="px-2 py-2 text-right font-medium">Total</th>
                  <th className="px-2 py-2 text-right font-medium">Assigned</th>
                  <th className="px-2 py-2 text-right font-medium">Available</th>
                  <th className="px-2 py-2 text-right font-medium">In Transit</th>
                  <th className="px-2 py-2 text-right font-medium">In Repair</th>
                  <th className="px-2 py-2 text-right font-medium">Lost</th>
                </tr>
              </thead>
              <tbody>
                {filteredTypes.map((t) => (
                  <tr key={t.type} className="hover:bg-muted/50 border-b last:border-0">
                    <td className="px-2 py-2 font-medium whitespace-nowrap">{t.type}</td>
                    <td className="px-2 py-2 text-right font-semibold tabular-nums">{t.count}</td>
                    <td className="text-success-muted-foreground px-2 py-2 text-right tabular-nums">{t.assigned}</td>
                    <td className="text-info-muted-foreground px-2 py-2 text-right tabular-nums">{t.available}</td>
                    <td className="text-warning-muted-foreground px-2 py-2 text-right tabular-nums">{t.inTransit}</td>
                    <td className="text-muted-foreground px-2 py-2 text-right tabular-nums">{t.inRepair}</td>
                    <td
                      className={cn(
                        "px-2 py-2 text-right tabular-nums",
                        t.lost > 0 ? "text-danger-muted-foreground" : "text-muted-foreground",
                      )}
                    >
                      {t.lost}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </WidgetCard>

        <div className="flex flex-col gap-5">
          <WidgetCard title="By status" description="Across all asset types">
            <ul className="flex flex-col gap-2">
              {STATUSES.map((s) => (
                <li key={s.label} className="flex items-center justify-between text-sm">
                  <StatusBadge tone={s.tone}>{s.label}</StatusBadge>
                  <span className="text-muted-foreground tabular-nums">{s.count}</span>
                </li>
              ))}
            </ul>
          </WidgetCard>

          <section className="border-danger/30 bg-danger-muted/30 rounded-xl border p-4">
            <p className="text-danger-muted-foreground flex items-center gap-1.5 text-xs font-medium">
              <TriangleAlert className="size-3.5" /> Delivery exceptions
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{SHIPMENT_EXCEPTIONS.length}</p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Shipments delayed more than 3 days — start dates at risk.
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setDrillShipments(true)}>
              View shipments
            </Button>
          </section>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <WidgetCard title="By client" description="Asset distribution">
          <BarList
            rows={BY_CLIENT.map((c) => ({ name: c.client, value: c.count }))}
            tone="info"
          />
        </WidgetCard>
        <WidgetCard title="By location" description="Where assets live">
          <BarList
            rows={BY_LOCATION.map((l) => ({ name: l.location, value: l.count }))}
            tone="ai"
          />
        </WidgetCard>
      </div>

      <DrillDownSheet
        open={drillShipments}
        onOpenChange={setDrillShipments}
        title="Delayed shipments"
        description="Shipments delayed more than 3 days"
        columns={SHIPMENT_COLUMNS}
        rows={SHIPMENT_EXCEPTIONS}
      />
    </PageContainer>
  );
}
