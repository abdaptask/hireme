import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import { EmptyRecord } from "./empty-record";

export type BillingRow = {
  status: string;
  billRate: boolean;
  markup: boolean;
  purchaseOrder: boolean;
  costCenter: boolean;
  clientWorkerId: boolean;
  vmsId: boolean;
  invoiceFrequency: boolean;
  timesheetMethod: boolean;
  expensePolicy: boolean;
  billingEntity: boolean;
  approvedStartDate: boolean;
  clientWorkerId2: string | null;
};

export function DbBilling({ billing }: { billing: BillingRow | null }) {
  if (!billing)
    return <EmptyRecord message="No billing readiness record on file for this person." />;

  const checks: { label: string; done: boolean }[] = [
    { label: "Bill rate", done: billing.billRate },
    { label: "Markup", done: billing.markup },
    { label: "Purchase order", done: billing.purchaseOrder },
    { label: "Cost center", done: billing.costCenter },
    { label: "Client worker ID", done: billing.clientWorkerId },
    { label: "VMS ID", done: billing.vmsId },
    { label: "Invoice frequency", done: billing.invoiceFrequency },
    { label: "Timesheet method", done: billing.timesheetMethod },
    { label: "Expense policy", done: billing.expensePolicy },
    { label: "Billing entity", done: billing.billingEntity },
    { label: "Approved start date", done: billing.approvedStartDate },
  ];
  const readyCount = checks.filter((c) => c.done).length;
  const pct = Math.round((readyCount / checks.length) * 100);

  return (
    <div className="bg-card rounded-xl border p-4 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-card-heading">Billing / Client Readiness</h3>
        <StatusBadge tone={billing.status === "READY" ? "success" : "warning"}>
          {pct}% · {billing.status === "READY" ? "Ready" : "Not ready"}
        </StatusBadge>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {checks.map((c) => (
          <li key={c.label} className="flex items-center gap-2 text-sm">
            <span
              className={cn(
                "size-2 shrink-0 rounded-full",
                c.done ? "bg-success" : "bg-danger",
              )}
            />
            <span className={c.done ? "" : "text-muted-foreground"}>{c.label}</span>
          </li>
        ))}
      </ul>
      {billing.clientWorkerId2 && (
        <p className="text-muted-foreground mt-3 text-xs">
          Client worker ID:{" "}
          <span className="font-mono text-foreground">{billing.clientWorkerId2}</span>
        </p>
      )}
    </div>
  );
}
