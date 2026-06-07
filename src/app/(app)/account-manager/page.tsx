import type { Metadata } from "next";
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  TriangleAlert,
  Users,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { StatTile } from "@/components/workspace/stat-tile";
import { WidgetCard } from "@/components/dashboard/widgets";
import { cn } from "@/lib/utils";
import { clientReadiness } from "@/lib/ops-data";

export const metadata: Metadata = { title: "Client Readiness" };

const PROMISES = [
  { client: "Meridian Health", promise: "Clearance by Jun 13", status: "On track", tone: "success" as const },
  { client: "Northwind Logistics", promise: "Start by Jun 14", status: "At risk", tone: "danger" as const },
  { client: "Vertex Financial", promise: "Equipment by Jun 18", status: "On track", tone: "success" as const },
  { client: "Atlas Manufacturing", promise: "Screening by Jun 20", status: "Watch", tone: "warning" as const },
];

const TONE_TEXT = {
  success: "text-success-muted-foreground",
  warning: "text-warning-muted-foreground",
  danger: "text-danger-muted-foreground",
};

export default function AccountManagerWorkspacePage() {
  const clients = clientReadiness();
  const totalConsultants = clients.reduce((s, c) => s + c.consultants, 0);
  const totalAtRisk = clients.reduce((s, c) => s + c.atRisk, 0);
  const totalApproval = clients.reduce((s, c) => s + c.awaitingApproval, 0);

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="Client Readiness"
        description="Onboarding pipelines and promises across your client portfolio."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={Building2} label="Clients" value={clients.length} />
        <StatTile icon={Users} label="Consultants onboarding" value={totalConsultants} />
        <StatTile icon={ClipboardCheck} label="Awaiting client approval" value={totalApproval} tone="warning" />
        <StatTile icon={TriangleAlert} label="At risk" value={totalAtRisk} tone="danger" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <WidgetCard title="Client portfolio">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left" style={{ fontSize: "var(--table-font)" }}>
              <thead className="text-muted-foreground border-b">
                <tr>
                  <th className="px-2 py-2 font-medium">Client</th>
                  <th className="px-2 py-2 font-medium text-right">Consultants</th>
                  <th className="px-2 py-2 font-medium text-right">Starting ≤14d</th>
                  <th className="px-2 py-2 font-medium text-right">Awaiting approval</th>
                  <th className="px-2 py-2 font-medium text-right">At risk</th>
                  <th className="px-2 py-2 font-medium">Readiness</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.client} className="hover:bg-muted/50 border-b last:border-0">
                    <td className="px-2 py-2 font-medium whitespace-nowrap">{c.client}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{c.consultants}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{c.startingSoon}</td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {c.awaitingApproval > 0 ? (
                        <span className="text-warning-muted-foreground font-medium">{c.awaitingApproval}</span>
                      ) : (
                        <span className="text-muted-foreground/50">0</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {c.atRisk > 0 ? (
                        <span className="text-danger-muted-foreground font-medium">{c.atRisk}</span>
                      ) : (
                        <span className="text-muted-foreground/50">0</span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-muted h-1.5 w-24 overflow-hidden rounded-full">
                          <span
                            className={cn(
                              "block h-full rounded-full",
                              c.avgProgress >= 75 ? "bg-success" : c.avgProgress >= 50 ? "bg-info" : "bg-warning",
                            )}
                            style={{ width: `${c.avgProgress}%` }}
                          />
                        </div>
                        <span className="text-muted-foreground text-xs tabular-nums">{c.avgProgress}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </WidgetCard>

        <div className="flex flex-col gap-5">
          <WidgetCard title="Client promise tracker" description="Commitments vs. progress (§41.5)">
            <ul className="flex flex-col gap-3">
              {PROMISES.map((p) => (
                <li key={p.client} className="flex items-center gap-2">
                  <CalendarClock className="text-muted-foreground size-4 shrink-0" />
                  <span className="flex min-w-0 flex-1 flex-col leading-tight">
                    <span className="truncate text-sm font-medium">{p.client}</span>
                    <span className="text-metadata truncate">{p.promise}</span>
                  </span>
                  <span className={cn("text-xs font-medium whitespace-nowrap", TONE_TEXT[p.tone])}>
                    {p.tone === "success" && <CheckCircle2 className="mr-0.5 inline size-3" />}
                    {p.status}
                  </span>
                </li>
              ))}
            </ul>
          </WidgetCard>

          <WidgetCard title="Upcoming start forecast">
            <ul className="flex flex-col gap-2 text-sm">
              <li className="flex items-center justify-between">
                <span>Starting within 14 days</span>
                <span className="text-muted-foreground tabular-nums">
                  {clients.reduce((s, c) => s + c.startingSoon, 0)}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span>Total in pipeline</span>
                <span className="text-muted-foreground tabular-nums">{totalConsultants}</span>
              </li>
            </ul>
          </WidgetCard>
        </div>
      </div>
    </PageContainer>
  );
}
