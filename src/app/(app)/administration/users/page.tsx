"use client";

/**
 * Administration → Users (§51.10 User Activity, §42 RBAC/ABAC).
 *
 * Light directory of internal platform users. Mock data mirrors the names
 * already present elsewhere in the system (CURRENT_ONBOARDER, CURRENT_RECRUITER,
 * TEAM_LEAD, recruiters/onboarders from ops-data). Actions are stubs that emit
 * a toast — wiring to real RBAC/identity lands when auth is real.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  Search,
  ShieldCheck,
  UserPlus,
  Users as UsersIcon,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatTile } from "@/components/workspace/stat-tile";
import { ROLES, type RoleId } from "@/lib/roles";
import { daysAgo, relativeTime } from "@/lib/clock";
import { cn } from "@/lib/utils";

/* ---------------------------------- Data ---------------------------------- */

type UserStatus = "Active" | "Inactive" | "Suspended" | "Locked";

type MockUser = {
  name: string;
  email: string;
  role: RoleId;
  department: string;
  status: UserStatus;
  mfa: boolean;
  lastLoginDaysAgo: number;
};

const USERS: MockUser[] = [
  // Onboarding / HR Ops
  { name: "Riya Kim", email: "riya.kim@aptask.com", role: "onboarder", department: "HR Operations", status: "Active", mfa: true, lastLoginDaysAgo: 0 },
  { name: "Priya Anand", email: "priya.anand@aptask.com", role: "onboarder", department: "HR Operations", status: "Active", mfa: true, lastLoginDaysAgo: 1 },
  { name: "Mei Lin", email: "mei.lin@aptask.com", role: "onboarder", department: "HR Operations", status: "Active", mfa: true, lastLoginDaysAgo: 2 },
  { name: "Tara Voss", email: "tara.voss@aptask.com", role: "onboarder", department: "HR Operations", status: "Inactive", mfa: false, lastLoginDaysAgo: 47 },

  // Recruiting
  { name: "Devon Hughes", email: "devon.hughes@aptask.com", role: "team-lead", department: "Recruiting · East Pod", status: "Active", mfa: true, lastLoginDaysAgo: 0 },
  { name: "Aaron Flores", email: "aaron.flores@aptask.com", role: "recruiter", department: "Recruiting · East Pod", status: "Active", mfa: true, lastLoginDaysAgo: 0 },
  { name: "Lena Ortiz", email: "lena.ortiz@aptask.com", role: "recruiter", department: "Recruiting · East Pod", status: "Active", mfa: true, lastLoginDaysAgo: 1 },
  { name: "Priya Ramesh", email: "priya.ramesh@aptask.com", role: "recruiter", department: "Recruiting · West Pod", status: "Active", mfa: true, lastLoginDaysAgo: 3 },
  { name: "Jordan Pratt", email: "jordan.pratt@aptask.com", role: "recruiter", department: "Recruiting · West Pod", status: "Locked", mfa: true, lastLoginDaysAgo: 6 },
  { name: "Casey Wong", email: "casey.wong@aptask.com", role: "recruiter", department: "Recruiting · West Pod", status: "Active", mfa: false, lastLoginDaysAgo: 2 },
  { name: "Sasha Patel", email: "sasha.patel@aptask.com", role: "recruiter", department: "Recruiting · Central Pod", status: "Active", mfa: true, lastLoginDaysAgo: 4 },
  { name: "Marcus Webb", email: "marcus.webb@aptask.com", role: "recruiting-manager", department: "Recruiting · Leadership", status: "Active", mfa: true, lastLoginDaysAgo: 0 },

  // Account Management
  { name: "Sarah Chen", email: "sarah.chen@aptask.com", role: "account-manager", department: "Client Services", status: "Active", mfa: true, lastLoginDaysAgo: 1 },
  { name: "Diego Santos", email: "diego.santos@aptask.com", role: "account-manager", department: "Client Services", status: "Active", mfa: true, lastLoginDaysAgo: 0 },
  { name: "Owen Bradley", email: "owen.bradley@aptask.com", role: "account-manager", department: "Client Services", status: "Suspended", mfa: true, lastLoginDaysAgo: 12 },

  // Platform Admins
  { name: "Abdulla Karim", email: "abdulla@aptask.com", role: "super-admin", department: "Platform Engineering", status: "Active", mfa: true, lastLoginDaysAgo: 0 },
  { name: "Marcus Reed", email: "marcus.reed@aptask.com", role: "super-admin", department: "Platform Engineering", status: "Active", mfa: true, lastLoginDaysAgo: 5 },

  // Inactive / edge cases
  { name: "Noah Klein", email: "noah.klein@aptask.com", role: "recruiter", department: "Recruiting · Central Pod", status: "Inactive", mfa: false, lastLoginDaysAgo: 92 },
  { name: "Grace Okafor", email: "grace.okafor@aptask.com", role: "onboarder", department: "HR Operations", status: "Active", mfa: true, lastLoginDaysAgo: 8 },
  { name: "Leo Park", email: "leo.park@aptask.com", role: "recruiter", department: "Recruiting · East Pod", status: "Active", mfa: false, lastLoginDaysAgo: 14 },
];

/* -------------------------------- Helpers --------------------------------- */

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function roleLabel(id: RoleId): string {
  return ROLES.find((r) => r.id === id)?.label ?? id;
}

const STATUS_STYLES: Record<UserStatus, string> = {
  Active: "bg-success-muted text-success-muted-foreground",
  Inactive: "bg-muted text-muted-foreground",
  Suspended: "bg-warning-muted text-warning-muted-foreground",
  Locked: "bg-danger-muted text-danger-muted-foreground",
};

/* ---------------------------------- Page ---------------------------------- */

export default function UsersAdminPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleId | "all">("all");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
  const [inactiveOnly, setInactiveOnly] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function announce(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return USERS.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      if (inactiveOnly && u.lastLoginDaysAgo < 30) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q)
      );
    });
  }, [search, roleFilter, statusFilter, inactiveOnly]);

  const stats = useMemo(() => {
    const total = USERS.length;
    const active = USERS.filter((u) => u.status === "Active").length;
    const locked = USERS.filter((u) => u.status === "Locked").length;
    const mfaPct = Math.round(
      (USERS.filter((u) => u.mfa).length / total) * 100,
    );
    return { total, active, locked, mfaPct };
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
          title="Users"
          description="Internal user directory · roles · status · last login."
          actions={
            <Button
              variant="default"
              size="sm"
              onClick={() => announce("Invite user — flow stubbed for v0.2.")}
            >
              <UserPlus className="size-4" /> Invite user
            </Button>
          }
        />
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={UsersIcon} label="Total users" value={stats.total} />
        <StatTile
          icon={CheckCircle2}
          label="Active"
          value={stats.active}
          tone="success"
        />
        <StatTile
          icon={Lock}
          label="Locked"
          value={stats.locked}
          tone={stats.locked > 0 ? "danger" : "default"}
        />
        <StatTile
          icon={ShieldCheck}
          label="MFA enabled"
          value={`${stats.mfaPct}`}
          suffix="%"
          tone="info"
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
              placeholder="Search name, email, department…"
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring/40 focus-visible:border-ring h-9 w-full rounded-md border pr-3 pl-8 text-sm focus-visible:ring-2 focus-visible:outline-none"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as RoleId | "all")}
            className="border-input bg-background h-9 rounded-md border px-2.5 text-sm"
          >
            <option value="all">All roles</option>
            {ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as UserStatus | "all")
            }
            className="border-input bg-background h-9 rounded-md border px-2.5 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
            <option value="Locked">Locked</option>
          </select>
          <label className="text-muted-foreground hover:text-foreground flex h-9 cursor-pointer items-center gap-2 rounded-md border px-2.5 text-sm">
            <input
              type="checkbox"
              className="accent-primary size-3.5"
              checked={inactiveOnly}
              onChange={(e) => setInactiveOnly(e.target.checked)}
            />
            Inactive 30d+
          </label>
          <div className="text-muted-foreground ml-auto text-xs">
            {filtered.length} of {USERS.length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="text-muted-foreground border-b text-left">
              <tr>
                <th className="px-4 py-2.5 font-medium">User</th>
                <th className="px-3 py-2.5 font-medium">Email</th>
                <th className="px-3 py-2.5 font-medium">Role</th>
                <th className="px-3 py-2.5 font-medium">Department</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 text-center font-medium">MFA</th>
                <th className="px-3 py-2.5 font-medium">Last login</th>
                <th className="px-3 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr
                  key={u.email}
                  className="hover:bg-muted/40 border-b last:border-0"
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar size="sm">
                        <AvatarFallback>{initials(u.name)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{u.name}</span>
                    </div>
                  </td>
                  <td className="text-muted-foreground px-3 py-2.5">
                    {u.email}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {roleLabel(u.role)}
                  </td>
                  <td className="text-muted-foreground px-3 py-2.5 whitespace-nowrap">
                    {u.department}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        STATUS_STYLES[u.status],
                      )}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {u.mfa ? (
                      <ShieldCheck className="text-success-muted-foreground mx-auto size-4" />
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="text-muted-foreground px-3 py-2.5 whitespace-nowrap">
                    {relativeTime(daysAgo(u.lastLoginDaysAgo))}
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          announce(`Edit ${u.name} — form stubbed for v0.2.`)
                        }
                        className="text-muted-foreground hover:text-foreground rounded-md px-2 py-1 text-xs hover:underline"
                      >
                        Edit
                      </button>
                      <span className="text-border">·</span>
                      <button
                        type="button"
                        onClick={() =>
                          announce(`Password reset email sent to ${u.email}.`)
                        }
                        className="text-muted-foreground hover:text-foreground rounded-md px-2 py-1 text-xs hover:underline"
                      >
                        Reset password
                      </button>
                      <span className="text-border">·</span>
                      <button
                        type="button"
                        onClick={() =>
                          announce(`${u.name} marked deactivated (stub).`)
                        }
                        className="text-danger-muted-foreground rounded-md px-2 py-1 text-xs hover:underline"
                      >
                        Deactivate
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="text-muted-foreground px-4 py-10 text-center text-sm"
                  >
                    No users match the current filters.
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
