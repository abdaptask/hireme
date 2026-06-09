/**
 * Admin Hub configuration.
 *
 * Declarative registry of all administration sub-pages. The
 * `/administration` index page reads from this single source of truth —
 * to add a new admin destination we just append an entry here.
 *
 * Hrefs target live destinations where they exist; tiles flagged with
 * `redirect: true` route the operator out of the admin area to an
 * existing canonical page (e.g. `/clients`, `/reports/...`) and render
 * with a small redirect indicator.
 */

export type AdminTone = "blue" | "purple" | "orange" | "red" | "green" | "teal";

export type AdminEntry = {
  id: string;
  label: string;
  href: string;
  /** Single-line description shown beneath the label on the tile. */
  description: string;
  /** lucide-react icon NAME — resolved to a component by the renderer. */
  icon: string;
  tone: AdminTone;
  /** Optional small badge (e.g. "61 categories", "Sync needed"). */
  badge?: string;
  /** When true, the tile renders as "redirects to" with an arrow icon. */
  redirect?: boolean;
};

export type AdminSection = {
  id: string;
  label: string;
  description: string;
  entries: AdminEntry[];
};

export const ADMIN_SECTIONS: AdminSection[] = [
  {
    id: "configuration",
    label: "Configuration",
    description:
      "Platform-wide setup — lookup data, templates, roles, and the user directory.",
    entries: [
      {
        id: "master-data",
        label: "Master Data",
        href: "/administration/master-data",
        description:
          "Manage 61 lookup categories that feed dropdowns across the platform",
        icon: "Database",
        tone: "blue",
        badge: "61 categories",
      },
      {
        id: "templates",
        label: "Templates",
        href: "/administration/templates",
        description:
          "Email, document, communication, and workflow templates",
        icon: "FileText",
        tone: "purple",
      },
      {
        id: "roles",
        label: "Roles & Permissions",
        href: "/administration/roles",
        description:
          "Configure role-based access and persona entitlements",
        icon: "ShieldCheck",
        tone: "purple",
      },
      {
        id: "users",
        label: "Users",
        href: "/administration/users",
        description:
          "User directory, status, role assignment, last login",
        icon: "Users",
        tone: "blue",
      },
    ],
  },
  {
    id: "records",
    label: "Records & Entities",
    description:
      "Directories of the parties the platform serves and the benefits they receive.",
    entries: [
      {
        id: "clients",
        label: "Clients",
        href: "/clients",
        description: "Client directory (live)",
        icon: "Building2",
        tone: "teal",
        redirect: true,
      },
      {
        id: "vendors",
        label: "Vendors",
        href: "/administration/vendors",
        description: "Vendor / MSP / staffing partner directory",
        icon: "Handshake",
        tone: "teal",
      },
      {
        id: "benefits-master",
        label: "Benefits Master",
        href: "/administration/benefits-master",
        description:
          "Insurance plans, eligibility rules, contribution structures",
        icon: "HeartPulse",
        tone: "green",
      },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    description:
      "Day-to-day operational tools — company view, gifting, invoicing, and ATS / QuickBooks sync.",
    entries: [
      {
        id: "company-snapshot",
        label: "Company Snapshot",
        href: "/administration/company-snapshot",
        description:
          "High-level company stats, milestones, leadership view",
        icon: "LayoutDashboard",
        tone: "orange",
      },
      {
        id: "holiday-gifting",
        label: "Holiday Gifting",
        href: "/administration/holiday-gifting",
        description:
          "Recipient list, addresses, holiday assignment workflow",
        icon: "Gift",
        tone: "red",
      },
      {
        id: "invoice-report",
        label: "Invoice Report",
        href: "/reports/clients-invoice",
        description: "Client invoice aging and outstanding",
        icon: "Receipt",
        tone: "orange",
        redirect: true,
      },
      {
        id: "sync-candidate",
        label: "Sync Candidate",
        href: "/administration/sync-candidate",
        description:
          "ATS candidate sync controls, last-run status, dry-run",
        icon: "RefreshCw",
        tone: "blue",
      },
      {
        id: "qb-sync",
        label: "QB Sync",
        href: "/administration/qb-sync",
        description:
          "QuickBooks employee sync — pay, deductions, deposits",
        icon: "ArrowLeftRight",
        tone: "green",
      },
      {
        id: "qb-item-sync",
        label: "QB Item Sync",
        href: "/administration/qb-item-sync",
        description:
          "QuickBooks invoice item sync — bill rates, service codes",
        icon: "PackageOpen",
        tone: "green",
      },
    ],
  },
];

/** Flat list of every admin entry, in section order. */
export const ADMIN_ENTRIES: AdminEntry[] = ADMIN_SECTIONS.flatMap(
  (section) => section.entries,
);

/** Resolve an admin entry by id; returns undefined if not configured. */
export function getAdminEntry(id: string): AdminEntry | undefined {
  return ADMIN_ENTRIES.find((entry) => entry.id === id);
}
