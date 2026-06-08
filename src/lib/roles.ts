/**
 * Roles & navigation entitlements (CLAUDE.md §42 RBAC/ABAC, §121.7 Role Preview).
 *
 * v0.2 (front half): roles map 1:1 to the six personas. The logged-in user is
 * treated as Super Admin (the platform admin) until real auth lands; the admin
 * can preview the app *as* any role and control which nav items each role sees.
 * Entitlements persist client-side now and become DB-backed when auth is wired.
 */
import { ALL_NAV_ITEMS } from "@/lib/nav";
import type { PersonaId } from "@/lib/types";

export type RoleId = PersonaId;

export type Role = {
  id: RoleId;
  label: string;
  /** Whether this role administers the platform (manages entitlements). */
  isAdmin: boolean;
};

export const ROLES: Role[] = [
  { id: "super-admin", label: "Super Admin", isAdmin: true },
  { id: "onboarder", label: "Onboarder", isAdmin: false },
  { id: "recruiter", label: "Recruiter", isAdmin: false },
  { id: "recruiting-manager", label: "Recruiting Manager", isAdmin: false },
  { id: "team-lead", label: "Team Lead", isAdmin: false },
  { id: "account-manager", label: "Account Manager", isAdmin: false },
  { id: "candidate", label: "Candidate", isAdmin: false },
  { id: "vendor", label: "Vendor", isAdmin: false },
  { id: "client", label: "Client", isAdmin: false },
];

/** External roles use a dedicated, scoped portal rather than the operational
 *  app shell (§27). They never see internal navigation. */
export const EXTERNAL_ROLES: RoleId[] = ["candidate", "vendor", "client"];

export function isExternalRole(id: RoleId): boolean {
  return EXTERNAL_ROLES.includes(id);
}

export const ADMIN_ROLE: RoleId = "super-admin";

export function getRole(id: RoleId): Role {
  return ROLES.find((r) => r.id === id) ?? ROLES[0];
}

/**
 * Default nav-item visibility per role (by nav item id). Super Admin sees
 * everything; other roles get a sensible operational subset. The Candidate
 * works in the dedicated portal, so it sees no operational nav by default.
 * Admins can override all of this in Administration → Navigation Visibility.
 */
const DEFAULT_ALLOWED: Record<RoleId, string[] | "all"> = {
  "super-admin": "all",
  onboarder: [
    "home",
    "my-work",
    "candidates",
    "consultants",
    "onboarding",
    "lifecycle",
    "packages",
    "exceptions",
    "clients",
    "documents",
    "screening",
    "payroll",
    "billing",
    "equipment",
    "communications",
    "training",
    "reports",
  ],
  recruiter: [
    "home",
    "my-work",
    "candidates",
    "onboarding",
    "lifecycle",
    "documents",
    "communications",
    "reports",
  ],
  "recruiting-manager": [
    "home",
    "my-work",
    "candidates",
    "consultants",
    "onboarding",
    "lifecycle",
    "exceptions",
    "reports",
  ],
  "team-lead": [
    "home",
    "my-work",
    "candidates",
    "onboarding",
    "lifecycle",
    "exceptions",
    "communications",
    "reports",
  ],
  "account-manager": [
    "home",
    "my-work",
    "consultants",
    "clients",
    "onboarding",
    "lifecycle",
    "exceptions",
    "communications",
    "reports",
  ],
  candidate: [],
  vendor: [],
  client: [],
};

export type VisibilityMap = Record<RoleId, Record<string, boolean>>;

/** Build the full role × item boolean matrix from the allowed lists. */
export function defaultVisibility(): VisibilityMap {
  const ids = ALL_NAV_ITEMS.map((i) => i.id);
  const map = {} as VisibilityMap;
  for (const role of ROLES) {
    const allowed = DEFAULT_ALLOWED[role.id];
    const row: Record<string, boolean> = {};
    for (const id of ids) {
      row[id] = allowed === "all" ? true : allowed.includes(id);
    }
    map[role.id] = row;
  }
  return map;
}
