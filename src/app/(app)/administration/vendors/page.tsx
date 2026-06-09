"use client";

/**
 * Administration → Vendors (§75.2 VMS/MSP, §93 integration governance).
 *
 * Directory of staffing partners, sub-vendors, and MSP/VMS programs that feed
 * candidates and consultants into the platform. Mock data only; actions are
 * stubs that emit a toast. Real wiring lands alongside the vendor portal and
 * the integration management module.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CheckCircle2,
  Network,
  Search,
  Users as UsersIcon,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/workspace/stat-tile";
import { daysAgo, formatDate } from "@/lib/clock";
import { cn } from "@/lib/utils";

/* ---------------------------------- Data ---------------------------------- */

type VendorType = "MSP" | "VMS Vendor" | "Sub-vendor" | "Staffing Partner";
type VendorStatus = "Active" | "On Hold" | "Inactive";

type Vendor = {
  name: string;
  type: VendorType;
  contactName: string;
  contactEmail: string;
  programs: number;
  activeConsultants: number;
  status: VendorStatus;
  onboardedDaysAgo: number;
  compliance: number; // %
};

const VENDORS: Vendor[] = [
  {
    name: "Magnit",
    type: "MSP",
    contactName: "Hannah Mercer",
    contactEmail: "hannah.mercer@magnit.com",
    programs: 7,
    activeConsultants: 142,
    status: "Active",
    onboardedDaysAgo: 920,
    compliance: 98,
  },
  {
    name: "Beeline Solutions",
    type: "VMS Vendor",
    contactName: "Carlos Mendes",
    contactEmail: "cmendes@beeline.com",
    programs: 4,
    activeConsultants: 88,
    status: "Active",
    onboardedDaysAgo: 1240,
    compliance: 95,
  },
  {
    name: "SAP Fieldglass",
    type: "VMS Vendor",
    contactName: "Lindsey Park",
    contactEmail: "lindsey.park@sap.com",
    programs: 5,
    activeConsultants: 64,
    status: "Active",
    onboardedDaysAgo: 1480,
    compliance: 96,
  },
  {
    name: "TalentBurst",
    type: "Sub-vendor",
    contactName: "Rohan Mehta",
    contactEmail: "rohan@talentburst.com",
    programs: 3,
    activeConsultants: 22,
    status: "Active",
    onboardedDaysAgo: 540,
    compliance: 88,
  },
  {
    name: "Insight Global",
    type: "Staffing Partner",
    contactName: "Megan Rowe",
    contactEmail: "megan.rowe@insightglobal.com",
    programs: 2,
    activeConsultants: 31,
    status: "Active",
    onboardedDaysAgo: 720,
    compliance: 92,
  },
  {
    name: "Apex Systems",
    type: "Staffing Partner",
    contactName: "Daniel Cho",
    contactEmail: "dcho@apexsystems.com",
    programs: 3,
    activeConsultants: 27,
    status: "Active",
    onboardedDaysAgo: 410,
    compliance: 90,
  },
  {
    name: "Kforce",
    type: "Staffing Partner",
    contactName: "Sandra Williams",
    contactEmail: "swilliams@kforce.com",
    programs: 1,
    activeConsultants: 9,
    status: "On Hold",
    onboardedDaysAgo: 260,
    compliance: 71,
  },
  {
    name: "Collabera",
    type: "Sub-vendor",
    contactName: "Anand Iyer",
    contactEmail: "anand.iyer@collabera.com",
    programs: 2,
    activeConsultants: 14,
    status: "Active",
    onboardedDaysAgo: 330,
    compliance: 86,
  },
  {
    name: "Mastech Digital",
    type: "Sub-vendor",
    contactName: "Priya Nair",
    contactEmail: "pnair@mastechdigital.com",
    programs: 2,
    activeConsultants: 11,
    status: "Active",
    onboardedDaysAgo: 195,
    compliance: 83,
  },
  {
    name: "Vndly (Workday)",
    type: "VMS Vendor",
    contactName: "Erin Walsh",
    contactEmail: "erin.walsh@workday.com",
    programs: 2,
    activeConsultants: 18,
    status: "Active",
    onboardedDaysAgo: 150,
    compliance: 94,
  },
  {
    name: "Spherion",
    type: "Staffing Partner",
    contactName: "Greg Halloran",
    contactEmail: "ghalloran@spherion.com",
    programs: 1,
    activeConsultants: 0,
    status: "Inactive",
    onboardedDaysAgo: 1100,
    compliance: 60,
  },
  {
    name: "Tech Mahindra Staffing",
    type: "Sub-vendor",
    contactName: "Vikram Joshi",
    contactEmail: "vikram.joshi@techmahindra.com",
    programs: 1,
    activeConsultants: 6,
    status: "On Hold",
    onboardedDaysAgo: 95,
    compliance: 74,
  },
];

/* -------------------------------- Helpers --------------------------------- */

const STATUS_STYLES: Record<VendorStatus, string> = {
  Active: "bg-success-muted text-success-muted-foreground",
  "On Hold": "bg-warning-muted text-warning-muted-foreground",
  Inactive: "bg-muted text-muted-foreground",
};

const TYPE_STYLES: Record<VendorType, string> = {
  MSP: "bg-info-muted text-info-muted-foreground",
  "VMS Vendor": "bg-primary/10 text-primary",
  "Sub-vendor": "bg-muted text-muted-foreground",
  "Staffing Partner": "bg-ai-muted text-ai-muted-foreground",
};

function complianceTone(pct: number): string {
  if (pct >= 90) return "text-success-muted-foreground";
  if (pct >= 75) return "text-warning-muted-foreground";
  return "text-danger-muted-foreground";
}

/* ---------------------------------- Page ---------------------------------- */

export default function VendorsAdminPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<VendorType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<VendorStatus | "all">("all");
  const [toast, setToast] = useState<string | null>(null);

  function announce(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return VENDORS.filter((v) => {
      if (typeFilter !== "all" && v.type !== typeFilter) return false;
      if (statusFilter !== "all" && v.status !== statusFilter) return false;
      if (!q) return true;
      return (
        v.name.toLowerCase().includes(q) ||
        v.contactName.toLowerCase().includes(q) ||
        v.contactEmail.toLowerCase().includes(q)
      );
    });
  }, [search, typeFilter, statusFilter]);

  const stats = useMemo(() => {
    const activeVendors = VENDORS.filter((v) => v.status === "Active").length;
    const subVendors = VENDORS.filter((v) => v.type === "Sub-vendor").length;
    const mspPartners = VENDORS.filter((v) => v.type === "MSP").length;
    const totalConsultants = VENDORS.filter((v) => v.status !== "Inactive")
      .reduce((s, v) => s + v.activeConsultants, 0);
    return { activeVendors, subVendors, mspPartners, totalConsultants };
  }, []);

  return (
    <PageContainer className="flex flex-col gap-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-1"
          nativeButton={false}
          render={<Link href="/administration" />}
        >
          <ArrowLeft className="size-4" /> Administration
        </Button>
        <PageHeader
          title="Vendors"
          description="Vendor, MSP, and staffing partner directory."
          actions={
            <Button
              variant="default"
              size="sm"
              onClick={() => announce("Add vendor — flow stubbed for v0.2.")}
            >
              <Building2 className="size-4" /> Add vendor
            </Button>
          }
        />
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          icon={Building2}
          label="Active vendors"
          value={stats.activeVendors}
          tone="success"
        />
        <StatTile
          icon={Network}
          label="Sub-vendors"
          value={stats.subVendors}
        />
        <StatTile
          icon={Briefcase}
          label="MSP partners"
          value={stats.mspPartners}
          tone="info"
        />
        <StatTile
          icon={UsersIcon}
          label="Consultants via vendors"
          value={stats.totalConsultants}
        />
      </div>

      {/* Filter bar */}
      <div className="bg-card rounded-xl border p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vendor or contact…"
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring/40 focus-visible:border-ring h-9 w-full rounded-md border pr-3 pl-8 text-sm focus-visible:ring-2 focus-visible:outline-none"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value as VendorType | "all")
            }
            className="border-input bg-background h-9 rounded-md border px-2.5 text-sm"
          >
            <option value="all">All types</option>
            <option value="MSP">MSP</option>
            <option value="VMS Vendor">VMS Vendor</option>
            <option value="Sub-vendor">Sub-vendor</option>
            <option value="Staffing Partner">Staffing Partner</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as VendorStatus | "all")
            }
            className="border-input bg-background h-9 rounded-md border px-2.5 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="Active">Active</option>
            <option value="On Hold">On Hold</option>
            <option value="Inactive">Inactive</option>
          </select>
          <div className="text-muted-foreground ml-auto text-xs">
            {filtered.length} of {VENDORS.length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="text-muted-foreground border-b text-left">
              <tr>
                <th className="px-4 py-2.5 font-medium">Vendor</th>
                <th className="px-3 py-2.5 font-medium">Type</th>
                <th className="px-3 py-2.5 font-medium">Primary contact</th>
                <th className="px-3 py-2.5 text-right font-medium">Programs</th>
                <th className="px-3 py-2.5 text-right font-medium">
                  Active consultants
                </th>
                <th className="px-3 py-2.5 text-right font-medium">
                  Compliance
                </th>
                <th className="px-3 py-2.5 font-medium">Onboarded</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr
                  key={v.name}
                  className="hover:bg-muted/40 border-b last:border-0"
                >
                  <td className="px-4 py-2.5 font-medium whitespace-nowrap">
                    {v.name}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
                        TYPE_STYLES[v.type],
                      )}
                    >
                      {v.type}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-col">
                      <span>{v.contactName}</span>
                      <span className="text-muted-foreground text-xs">
                        {v.contactEmail}
                      </span>
                    </div>
                  </td>
                  <td className="text-muted-foreground px-3 py-2.5 text-right tabular-nums">
                    {v.programs}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {v.activeConsultants}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-2.5 text-right font-medium tabular-nums",
                      complianceTone(v.compliance),
                    )}
                  >
                    {v.compliance}%
                  </td>
                  <td className="text-muted-foreground px-3 py-2.5 whitespace-nowrap">
                    {formatDate(daysAgo(v.onboardedDaysAgo), { withYear: true })}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
                        STATUS_STYLES[v.status],
                      )}
                    >
                      {v.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          announce(`View ${v.name} — detail page stubbed.`)
                        }
                        className="text-muted-foreground hover:text-foreground rounded-md px-2 py-1 text-xs hover:underline"
                      >
                        View
                      </button>
                      <span className="text-border">·</span>
                      <button
                        type="button"
                        onClick={() =>
                          announce(`Edit ${v.name} — form stubbed for v0.2.`)
                        }
                        className="text-muted-foreground hover:text-foreground rounded-md px-2 py-1 text-xs hover:underline"
                      >
                        Edit
                      </button>
                      <span className="text-border">·</span>
                      <button
                        type="button"
                        onClick={() =>
                          announce(`${v.name} marked suspended (stub).`)
                        }
                        className="text-danger-muted-foreground rounded-md px-2 py-1 text-xs hover:underline"
                      >
                        Suspend
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="text-muted-foreground px-4 py-10 text-center text-sm"
                  >
                    No vendors match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {toast && (
        <div className="bg-foreground text-background fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm shadow-lg">
          <CheckCircle2 className="text-success size-4" />
          {toast}
        </div>
      )}
    </PageContainer>
  );
}
