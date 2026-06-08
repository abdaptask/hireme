import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import { Placeholder } from "./placeholder";

export type PayrollRow = {
  status: string;
  classification: boolean;
  payRate: boolean;
  overtimeRules: boolean;
  taxJurisdiction: boolean;
  directDeposit: boolean;
  w4: boolean;
  stateTax: boolean;
  i9: boolean;
  benefitsEligibility: boolean;
  payrollEntity: boolean;
  startDateSet: boolean;
};

export function DbPayroll({ payroll }: { payroll: PayrollRow | null }) {
  if (!payroll) return <Placeholder module="Payroll readiness" version="v0.5" />;

  const checks: { label: string; done: boolean }[] = [
    { label: "Employment classification", done: payroll.classification },
    { label: "Pay rate", done: payroll.payRate },
    { label: "Overtime rules", done: payroll.overtimeRules },
    { label: "Tax jurisdiction", done: payroll.taxJurisdiction },
    { label: "Direct deposit", done: payroll.directDeposit },
    { label: "Federal W-4", done: payroll.w4 },
    { label: "State tax form", done: payroll.stateTax },
    { label: "I-9", done: payroll.i9 },
    { label: "Benefits eligibility", done: payroll.benefitsEligibility },
    { label: "Payroll entity", done: payroll.payrollEntity },
    { label: "Start date confirmed", done: payroll.startDateSet },
  ];
  const readyCount = checks.filter((c) => c.done).length;
  const pct = Math.round((readyCount / checks.length) * 100);

  return (
    <div className="bg-card rounded-xl border p-4 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-card-heading">Payroll Readiness</h3>
        <StatusBadge tone={payroll.status === "READY" ? "success" : "warning"}>
          {pct}% · {payroll.status === "READY" ? "Ready" : "Not ready"}
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
    </div>
  );
}
