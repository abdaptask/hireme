import { StatusBadge } from "@/components/status-badge";
import { Placeholder } from "./placeholder";

export type ScreeningRow = {
  id: string;
  vendor: string;
  packageType: string | null;
  status: string;
  orderedAt: Date | null;
  estimatedCompletion: Date | null;
  cost: number | null;
  notes: string | null;
};

const SCREENING_STATUS_META: Record<
  string,
  { tone: "success" | "warning" | "danger" | "info" | "neutral"; label: string }
> = {
  ORDERED: { tone: "neutral", label: "Ordered" },
  INVITED: { tone: "info", label: "Invited" },
  CONSENTED: { tone: "info", label: "Consented" },
  IN_PROGRESS: { tone: "info", label: "In progress" },
  INFO_REQUIRED: { tone: "warning", label: "Info required" },
  VENDOR_DELAYED: { tone: "warning", label: "Vendor delayed" },
  CLEAR: { tone: "success", label: "Clear" },
  REVIEW_REQUIRED: { tone: "danger", label: "Review required" },
  ADVERSE_PENDING: { tone: "danger", label: "Adverse pending" },
};

export function DbScreening({ screenings }: { screenings: ScreeningRow[] }) {
  if (!screenings.length)
    return <Placeholder module="Background check & screening" version="v0.5" />;
  return (
    <div className="flex flex-col gap-3">
      {screenings.map((s) => {
        const meta =
          SCREENING_STATUS_META[s.status] ?? { tone: "neutral" as const, label: s.status };
        return (
          <div key={s.id} className="bg-card rounded-xl border p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{s.packageType ?? "Background Check"}</p>
                <p className="text-muted-foreground text-xs">Vendor: {s.vendor}</p>
              </div>
              <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
            </div>
            {s.notes && (
              <p className="text-muted-foreground mt-2 rounded-lg bg-muted/50 px-3 py-2 text-xs">
                {s.notes}
              </p>
            )}
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              {s.orderedAt && (
                <div>
                  <p className="text-data-label">Ordered</p>
                  <p className="font-medium">{s.orderedAt.toLocaleDateString()}</p>
                </div>
              )}
              {s.estimatedCompletion && (
                <div>
                  <p className="text-data-label">Est. completion</p>
                  <p className="font-medium">{s.estimatedCompletion.toLocaleDateString()}</p>
                </div>
              )}
              {s.cost != null && (
                <div>
                  <p className="text-data-label">Cost</p>
                  <p className="font-medium">${s.cost.toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
