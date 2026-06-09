"use client";

/**
 * Holiday Gifting — recipient list, address confirmation, gift assignment.
 * Internal team rewards & milestone communications (CLAUDE.md §7 culture, §63.5).
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Printer,
  Gift,
  MapPin,
  Users,
  Package as PackageIcon,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ShipStatus = "Not Shipped" | "Picking" | "Shipped" | "Delivered" | "Returned";

type Recipient = {
  id: string;
  name: string;
  department: string;
  role: string;
  addressConfirmed: boolean;
  lastYearGift: string;
  thisYearGift: string;
  status: ShipStatus;
};

const HOLIDAYS = [
  "Year-End 2026",
  "Thanksgiving 2026",
  "Diwali 2026",
  "Summer Appreciation 2026",
];

const DEPARTMENTS = ["All", "Recruiting", "Onboarding", "Account Mgmt", "Engineering", "Finance", "Leadership"];

const RECIPIENTS: Recipient[] = [
  { id: "p1", name: "Aisha Patel", department: "Recruiting", role: "Senior Recruiter", addressConfirmed: true, lastYearGift: "Yeti Tumbler", thisYearGift: "Leather Notebook Set", status: "Shipped" },
  { id: "p2", name: "Marcus Chen", department: "Recruiting", role: "Recruiter", addressConfirmed: true, lastYearGift: "Wireless Earbuds", thisYearGift: "Leather Notebook Set", status: "Shipped" },
  { id: "p3", name: "Priya Sharma", department: "Onboarding", role: "Onboarder", addressConfirmed: true, lastYearGift: "Yeti Tumbler", thisYearGift: "Cuisine Gift Box", status: "Delivered" },
  { id: "p4", name: "Daniel Reyes", department: "Onboarding", role: "Onboarder", addressConfirmed: false, lastYearGift: "Wireless Earbuds", thisYearGift: "Leather Notebook Set", status: "Not Shipped" },
  { id: "p5", name: "Sophia Nguyen", department: "Onboarding", role: "Senior Onboarder", addressConfirmed: true, lastYearGift: "Cuisine Gift Box", thisYearGift: "Premium Coffee Set", status: "Picking" },
  { id: "p6", name: "James O'Brien", department: "Account Mgmt", role: "Account Manager", addressConfirmed: true, lastYearGift: "Premium Coffee Set", thisYearGift: "Whiskey Tasting Box", status: "Shipped" },
  { id: "p7", name: "Olivia Martins", department: "Account Mgmt", role: "Account Manager", addressConfirmed: false, lastYearGift: "Yeti Tumbler", thisYearGift: "Whiskey Tasting Box", status: "Not Shipped" },
  { id: "p8", name: "Kenji Tanaka", department: "Engineering", role: "Staff Engineer", addressConfirmed: true, lastYearGift: "Mechanical Keyboard", thisYearGift: "Standing Desk Mat", status: "Delivered" },
  { id: "p9", name: "Hannah Goldberg", department: "Engineering", role: "Engineering Mgr", addressConfirmed: true, lastYearGift: "Mechanical Keyboard", thisYearGift: "Standing Desk Mat", status: "Shipped" },
  { id: "p10", name: "Lucas Romano", department: "Engineering", role: "Engineer", addressConfirmed: true, lastYearGift: "Wireless Earbuds", thisYearGift: "Standing Desk Mat", status: "Picking" },
  { id: "p11", name: "Mei Lin", department: "Engineering", role: "Engineer", addressConfirmed: false, lastYearGift: "New Hire", thisYearGift: "Standing Desk Mat", status: "Not Shipped" },
  { id: "p12", name: "Tariq Hassan", department: "Engineering", role: "Engineer", addressConfirmed: true, lastYearGift: "Mechanical Keyboard", thisYearGift: "Standing Desk Mat", status: "Shipped" },
  { id: "p13", name: "Isabella Cruz", department: "Finance", role: "Controller", addressConfirmed: true, lastYearGift: "Premium Coffee Set", thisYearGift: "Cuisine Gift Box", status: "Delivered" },
  { id: "p14", name: "Noah Whitman", department: "Finance", role: "AP Specialist", addressConfirmed: true, lastYearGift: "Yeti Tumbler", thisYearGift: "Cuisine Gift Box", status: "Shipped" },
  { id: "p15", name: "Amara Okonkwo", department: "Finance", role: "Payroll Lead", addressConfirmed: false, lastYearGift: "Wireless Earbuds", thisYearGift: "Cuisine Gift Box", status: "Not Shipped" },
  { id: "p16", name: "Ravi Krishnan", department: "Recruiting", role: "Recruiting Mgr", addressConfirmed: true, lastYearGift: "Whiskey Tasting Box", thisYearGift: "Executive Watch Box", status: "Picking" },
  { id: "p17", name: "Chloe Bennett", department: "Account Mgmt", role: "Sr Account Mgr", addressConfirmed: true, lastYearGift: "Whiskey Tasting Box", thisYearGift: "Executive Watch Box", status: "Shipped" },
  { id: "p18", name: "Diego Alvarez", department: "Recruiting", role: "Recruiter", addressConfirmed: true, lastYearGift: "Yeti Tumbler", thisYearGift: "Leather Notebook Set", status: "Delivered" },
  { id: "p19", name: "Fatima Rahman", department: "Onboarding", role: "Onboarder", addressConfirmed: true, lastYearGift: "Cuisine Gift Box", thisYearGift: "Premium Coffee Set", status: "Shipped" },
  { id: "p20", name: "Ethan Kim", department: "Engineering", role: "Senior Engineer", addressConfirmed: true, lastYearGift: "Mechanical Keyboard", thisYearGift: "Standing Desk Mat", status: "Delivered" },
  { id: "p21", name: "Grace Liu", department: "Leadership", role: "VP Operations", addressConfirmed: true, lastYearGift: "Executive Watch Box", thisYearGift: "Concierge Travel Gift", status: "Shipped" },
  { id: "p22", name: "Benjamin Foster", department: "Leadership", role: "VP Sales", addressConfirmed: true, lastYearGift: "Executive Watch Box", thisYearGift: "Concierge Travel Gift", status: "Delivered" },
  { id: "p23", name: "Yuki Watanabe", department: "Leadership", role: "CFO", addressConfirmed: true, lastYearGift: "Concierge Travel Gift", thisYearGift: "Concierge Travel Gift", status: "Shipped" },
  { id: "p24", name: "Sara Mendez", department: "Recruiting", role: "Recruiter", addressConfirmed: false, lastYearGift: "Wireless Earbuds", thisYearGift: "Leather Notebook Set", status: "Not Shipped" },
  { id: "p25", name: "Vikram Joshi", department: "Onboarding", role: "Onboarder", addressConfirmed: true, lastYearGift: "Yeti Tumbler", thisYearGift: "Premium Coffee Set", status: "Picking" },
];

export default function HolidayGiftingPage() {
  const [holiday, setHoliday] = useState(HOLIDAYS[0]);
  const [department, setDepartment] = useState("All");
  const [confirmedOnly, setConfirmedOnly] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return RECIPIENTS.filter((r) => {
      if (department !== "All" && r.department !== department) return false;
      if (confirmedOnly && !r.addressConfirmed) return false;
      return true;
    });
  }, [department, confirmedOnly]);

  const stats = useMemo(() => {
    return {
      total: RECIPIENTS.length,
      confirmed: RECIPIENTS.filter((r) => r.addressConfirmed).length,
      pending: RECIPIENTS.filter((r) => !r.addressConfirmed).length,
      shipped: RECIPIENTS.filter(
        (r) => r.status === "Shipped" || r.status === "Delivered",
      ).length,
    };
  }, []);

  function trigger(label: string) {
    console.log(`[holiday-gifting] ${label} triggered (mock)`);
    setLastAction(`${label} (mock)`);
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
          title="Holiday Gifting"
          description="Recipient list, addresses, holiday assignment workflow."
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => trigger("Address confirmation email sent")}
              >
                <Mail className="size-4" /> Send confirmation
              </Button>
              <Button variant="outline" size="sm" onClick={() => trigger("Labels exported")}>
                <Printer className="size-4" /> Export labels
              </Button>
            </>
          }
        />
      </div>

      {lastAction && (
        <div className="bg-primary/10 text-primary border-primary/20 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
          <CheckCircle2 className="size-4" /> {lastAction}
        </div>
      )}

      {/* Stat tiles */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile icon={Users} label="Total Recipients" value={stats.total.toString()} />
        <StatTile
          icon={CheckCircle2}
          label="Confirmed Address"
          value={stats.confirmed.toString()}
          tone="ok"
        />
        <StatTile
          icon={AlertTriangle}
          label="Pending Address"
          value={stats.pending.toString()}
          tone="warn"
        />
        <StatTile
          icon={PackageIcon}
          label="Shipped This Holiday"
          value={stats.shipped.toString()}
          sub={holiday}
        />
      </section>

      {/* Filter row */}
      <section className="bg-card flex flex-wrap items-end gap-3 rounded-xl border px-4 py-3 shadow-xs">
        <div>
          <label className="text-data-label mb-1.5 block">Holiday</label>
          <select
            value={holiday}
            onChange={(e) => setHoliday(e.target.value)}
            className="bg-background h-8 rounded-md border px-2 text-sm"
          >
            {HOLIDAYS.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-data-label mb-1.5 block">Department</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="bg-background h-8 rounded-md border px-2 text-sm"
          >
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={confirmedOnly}
            onChange={(e) => setConfirmedOnly(e.target.checked)}
            className="accent-primary size-4"
          />
          Confirmed address only
        </label>
        <span className="text-muted-foreground ml-auto text-xs">
          {filtered.length} of {RECIPIENTS.length} recipients
        </span>
      </section>

      {/* Recipient table */}
      <section className="bg-card overflow-hidden rounded-xl border shadow-xs">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Gift className="text-muted-foreground size-4" />
            <h2 className="text-section-heading">Recipients · {holiday}</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-data-label bg-muted/40 border-b">
                <th className="px-4 py-2 text-left font-medium">Recipient</th>
                <th className="px-4 py-2 text-left font-medium">Department</th>
                <th className="px-4 py-2 text-left font-medium">Role</th>
                <th className="px-4 py-2 text-center font-medium">Address</th>
                <th className="px-4 py-2 text-left font-medium">Last Year</th>
                <th className="px-4 py-2 text-left font-medium">This Year</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30 border-b last:border-0">
                  <td className="px-4 py-2.5 font-medium">{r.name}</td>
                  <td className="text-muted-foreground px-4 py-2.5">{r.department}</td>
                  <td className="text-muted-foreground px-4 py-2.5">{r.role}</td>
                  <td className="px-4 py-2.5 text-center">
                    {r.addressConfirmed ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-3.5" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="size-3.5" />
                      </span>
                    )}
                  </td>
                  <td className="text-muted-foreground px-4 py-2.5 text-xs">{r.lastYearGift}</td>
                  <td className="px-4 py-2.5 text-xs">{r.thisYearGift}</td>
                  <td className="px-4 py-2.5">
                    <ShipBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-muted-foreground flex flex-col items-center justify-center py-10 text-sm">
            <MapPin className="mb-2 size-5 opacity-60" />
            No recipients match the current filter.
          </div>
        )}
      </section>
    </PageContainer>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  tone?: "ok" | "warn";
}) {
  return (
    <div className="bg-card rounded-xl border p-4 shadow-xs">
      <div className="flex items-center justify-between">
        <p className="text-data-label">{label}</p>
        <Icon
          className={cn(
            "text-muted-foreground size-4",
            tone === "ok" && "text-emerald-500",
            tone === "warn" && "text-amber-500",
          )}
        />
      </div>
      <p
        className={cn(
          "mt-1 text-2xl font-semibold tracking-tight tabular-nums",
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

function ShipBadge({ status }: { status: ShipStatus }) {
  switch (status) {
    case "Delivered":
      return (
        <Badge variant="outline" className="border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="size-3" /> Delivered
        </Badge>
      );
    case "Shipped":
      return (
        <Badge variant="outline" className="border-sky-500/30 text-sky-700 dark:text-sky-400">
          Shipped
        </Badge>
      );
    case "Picking":
      return (
        <Badge variant="outline" className="border-violet-500/30 text-violet-700 dark:text-violet-400">
          Picking
        </Badge>
      );
    case "Returned":
      return (
        <Badge variant="outline" className="border-destructive/30 text-destructive">
          Returned
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Not shipped
        </Badge>
      );
  }
}
