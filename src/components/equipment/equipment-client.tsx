"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, ChevronRight, X } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import {
  ASSET_TYPE_LABELS,
  EQUIPMENT_STATUS_META,
} from "@/lib/equipment";
import type { EquipmentRecord } from "@/lib/equipment";

function ItAccessIcon({ granted, label }: { granted: boolean; label: string }) {
  return (
    <span
      title={label}
      aria-label={`${label}: ${granted ? "granted" : "not granted"}`}
      className={cn(
        "inline-flex size-5 items-center justify-center rounded-full",
        granted
          ? "bg-success-muted text-success-muted-foreground"
          : "bg-muted text-muted-foreground/40",
      )}
    >
      {granted ? <Check className="size-3" /> : <X className="size-3" />}
    </span>
  );
}

function ItemStatusDot({
  status,
}: {
  status: EquipmentRecord["items"][number]["status"];
}) {
  const meta = EQUIPMENT_STATUS_META[status];
  const dotColor: Record<string, string> = {
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    info: "bg-info",
    neutral: "bg-neutral",
  };
  return (
    <span
      title={meta.label}
      aria-label={meta.label}
      className={cn("inline-block size-2 rounded-full", dotColor[meta.tone])}
    />
  );
}

function ExpandedItems({ record }: { record: EquipmentRecord }) {
  return (
    <tr>
      <td colSpan={8} className="bg-muted/30 border-b px-4 py-3">
        <div className="overflow-x-auto">
          <table
            className="w-full border-collapse text-left"
            style={{ fontSize: "var(--table-font)" }}
          >
            <thead className="text-muted-foreground">
              <tr>
                <th className="pb-1.5 pr-4 font-medium">Asset Type</th>
                <th className="pb-1.5 pr-4 font-medium">Make / Model</th>
                <th className="pb-1.5 pr-4 font-medium">Serial</th>
                <th className="pb-1.5 pr-4 font-medium">Status</th>
                <th className="pb-1.5 pr-4 font-medium">Tracking</th>
                <th className="pb-1.5 font-medium">ETA</th>
              </tr>
            </thead>
            <tbody>
              {record.items.map((item, i) => (
                <tr key={i} className="border-muted/50 border-t">
                  <td className="py-1.5 pr-4 font-medium">
                    {ASSET_TYPE_LABELS[item.assetType]}
                  </td>
                  <td className="py-1.5 pr-4">{item.make}</td>
                  <td className="text-muted-foreground py-1.5 pr-4 font-mono text-xs">
                    {item.serialNumber ?? "—"}
                  </td>
                  <td className="py-1.5 pr-4">
                    <StatusBadge tone={EQUIPMENT_STATUS_META[item.status].tone}>
                      {EQUIPMENT_STATUS_META[item.status].label}
                    </StatusBadge>
                  </td>
                  <td className="text-muted-foreground py-1.5 pr-4 font-mono text-xs">
                    {item.trackingNumber ? (
                      <span>
                        {item.carrier} · {item.trackingNumber}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="text-muted-foreground py-1.5 text-xs">
                    {item.estimatedDelivery ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {record.items.some((i) => i.notes) && (
            <div className="text-muted-foreground mt-2 space-y-0.5 text-xs">
              {record.items
                .filter((i) => i.notes)
                .map((i, idx) => (
                  <p key={idx}>
                    <span className="font-medium">
                      {ASSET_TYPE_LABELS[i.assetType]}:
                    </span>{" "}
                    {i.notes}
                  </p>
                ))}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

export function EquipmentTable({
  records,
  liveIds,
}: {
  records: EquipmentRecord[];
  liveIds: string[];
}) {
  const liveSet = new Set(liveIds);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section className="bg-card overflow-hidden rounded-xl border shadow-xs">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <h2 className="text-card-heading">Equipment Records</h2>
        <span className="text-muted-foreground text-xs tabular-nums">
          {records.length} total
        </span>
      </div>

      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse text-left"
          style={{ fontSize: "var(--table-font)" }}
        >
          <thead className="text-muted-foreground border-b">
            <tr>
              <th className="w-8 px-3 py-2" aria-label="Expand" />
              <th className="px-3 py-2 font-medium">Candidate</th>
              <th className="px-3 py-2 font-medium">Client</th>
              <th className="px-3 py-2 font-medium">Start</th>
              <th className="px-3 py-2 font-medium">Ship To</th>
              <th className="px-3 py-2 font-medium">Items</th>
              <th className="px-3 py-2 font-medium">
                <span title="Email / VPN / Client Creds / Enrolled">
                  IT Access
                </span>
              </th>
              <th className="px-3 py-2 font-medium">Overall Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => {
              const isOpen = expanded.has(record.id);
              const isDelayed = record.overallStatus === "delayed";
              const isLive = liveSet.has(record.id);

              return (
                <Fragment key={record.id}>
                  <tr
                    className={cn(
                      "hover:bg-muted/50 border-b last:border-0 cursor-pointer",
                      isDelayed && "bg-danger-muted/20",
                    )}
                    onClick={() => toggle(record.id)}
                    aria-expanded={isOpen}
                  >
                    <td className="px-3 py-2 text-center">
                      {isOpen ? (
                        <ChevronDown className="text-muted-foreground size-4" />
                      ) : (
                        <ChevronRight className="text-muted-foreground size-4" />
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/candidates/${record.candidateId}`}
                          className="hover:text-primary font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {record.candidateName}
                        </Link>
                        {isLive && (
                          <span
                            title="Loaded from database"
                            className="text-success inline-flex items-center gap-0.5 text-[10px] font-medium uppercase tracking-wide"
                          >
                            <span className="bg-success inline-block size-1.5 rounded-full" />
                            live
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-muted-foreground px-3 py-2 whitespace-nowrap">
                      {record.client}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="font-medium tabular-nums">
                        {record.startDate}
                      </span>
                      <span
                        className={cn(
                          "text-metadata ml-1.5",
                          record.startInDays <= 3
                            ? "text-danger-muted-foreground"
                            : record.startInDays <= 7
                              ? "text-warning-muted-foreground"
                              : "text-muted-foreground",
                        )}
                      >
                        {record.startInDays === 0
                          ? "Today"
                          : record.startInDays === 1
                            ? "Tomorrow"
                            : `${record.startInDays}d`}
                      </span>
                    </td>
                    <td className="text-muted-foreground px-3 py-2 whitespace-nowrap">
                      {record.shipTo}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        {record.items.map((item, i) => (
                          <ItemStatusDot key={i} status={item.status} />
                        ))}
                        <span className="text-muted-foreground ml-1 text-xs tabular-nums">
                          {record.items.length}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <ItAccessIcon
                          granted={record.itAccess.email}
                          label="Email"
                        />
                        <ItAccessIcon
                          granted={record.itAccess.vpn}
                          label="VPN"
                        />
                        <ItAccessIcon
                          granted={record.itAccess.clientCredentials}
                          label="Client Creds"
                        />
                        <ItAccessIcon
                          granted={record.itAccess.deviceEnrolled}
                          label="Device Enrolled"
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge
                        tone={EQUIPMENT_STATUS_META[record.overallStatus].tone}
                      >
                        {EQUIPMENT_STATUS_META[record.overallStatus].label}
                      </StatusBadge>
                    </td>
                  </tr>
                  {isOpen && <ExpandedItems record={record} />}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-muted-foreground border-t px-4 py-2 text-xs">
        Click any row to expand item details. IT Access icons: Email · VPN ·
        Client Credentials · Device Enrolled.
      </div>
    </section>
  );
}
