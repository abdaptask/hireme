import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import { EmptyRecord } from "./empty-record";

export type EquipmentRow = {
  id: string;
  label: string;
  assetType: string;
  status: string;
  trackingNumber: string | null;
  carrier: string | null;
  estimatedDelivery: Date | null;
  emailProvisioned: boolean;
  vpnProvisioned: boolean;
  clientCredentials: boolean;
  deviceEnrolled: boolean;
};

const EQUIP_STATUS_META: Record<
  string,
  { tone: "success" | "warning" | "danger" | "info" | "neutral"; label: string }
> = {
  REQUESTED: { tone: "neutral", label: "Requested" },
  APPROVED: { tone: "info", label: "Approved" },
  ASSIGNED: { tone: "info", label: "Assigned" },
  SHIPPED: { tone: "info", label: "Shipped" },
  DELIVERED: { tone: "success", label: "Delivered" },
  ENROLLED: { tone: "success", label: "Enrolled" },
  READY: { tone: "success", label: "Ready" },
  DELAYED: { tone: "warning", label: "Delayed" },
  RETURN_REQUIRED: { tone: "warning", label: "Return required" },
  RETURNED: { tone: "neutral", label: "Returned" },
  LOST: { tone: "danger", label: "Lost" },
  DAMAGED: { tone: "danger", label: "Damaged" },
};

export function DbEquipment({ equipment }: { equipment: EquipmentRow[] }) {
  if (!equipment.length)
    return <EmptyRecord message="No equipment or IT provisioning records for this person." />;
  return (
    <div className="flex flex-col gap-3">
      {equipment.map((e) => {
        const meta =
          EQUIP_STATUS_META[e.status] ?? { tone: "neutral" as const, label: e.status };
        return (
          <div key={e.id} className="bg-card rounded-xl border p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{e.label}</p>
                <p className="text-muted-foreground text-xs capitalize">{e.assetType}</p>
              </div>
              <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
            </div>
            {e.trackingNumber && (
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-data-label">Tracking</p>
                  <p className="font-medium font-mono text-xs">{e.trackingNumber}</p>
                </div>
                {e.carrier && (
                  <div>
                    <p className="text-data-label">Carrier</p>
                    <p className="font-medium">{e.carrier}</p>
                  </div>
                )}
                {e.estimatedDelivery && (
                  <div>
                    <p className="text-data-label">Est. delivery</p>
                    <p className="font-medium">{e.estimatedDelivery.toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            )}
            {/* IT access flags */}
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { label: "Email", ready: e.emailProvisioned },
                { label: "VPN", ready: e.vpnProvisioned },
                { label: "Client access", ready: e.clientCredentials },
                { label: "Enrolled", ready: e.deviceEnrolled },
              ].map(({ label, ready }) => (
                <span
                  key={label}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                    ready
                      ? "bg-success-muted text-success-muted-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      ready ? "bg-success" : "bg-muted-foreground/40",
                    )}
                  />
                  {label}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
