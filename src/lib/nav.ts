/**
 * Navigation & persona configuration.
 * - Primary navigation mirrors CLAUDE.md §4 (all 21 sections) and §97.1.
 * - Personas mirror §5 (six workspaces).
 *
 * Each item is tagged `live` (built in this version) or `planned` (with the
 * roadmap version + spec section it will arrive in — see docs/ROADMAP.md), so
 * the navigation never over-promises. Planned items route to /planned/<id>.
 */
import {
  BarChart3,
  Building2,
  ClipboardList,
  FileText,
  GraduationCap,
  Handshake,
  History,
  Home,
  Inbox,
  Laptop,
  type LucideIcon,
  MessageSquare,
  Package,
  Plug,
  Receipt,
  Scale,
  Settings,
  ShieldCheck,
  TriangleAlert,
  UserCheck,
  Users,
  UsersRound,
  Wallet,
  Workflow,
} from "lucide-react";
import type { PersonaId } from "@/lib/types";

export type NavStatus = "live" | "planned";

export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  status: NavStatus;
  /** Roadmap version this lands in, e.g. "v0.3.0" (planned items). */
  roadmap?: string;
  /** Spec section reference, e.g. "§6". */
  spec: string;
  /** One-line purpose, shown on planned placeholder pages. */
  description: string;
};

export type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
};

export type Persona = {
  id: PersonaId;
  label: string;
  workspace: string;
  home: string;
  icon: LucideIcon;
  status: NavStatus;
  roadmap?: string;
  description: string;
};

/** §5 — six primary persona workspaces. */
export const PERSONAS: Persona[] = [
  {
    id: "super-admin",
    label: "Super Admin",
    workspace: "Command Center",
    home: "/command-center",
    icon: ShieldCheck,
    status: "live",
    description: "Maximum-density operational & system administration workspace.",
  },
  {
    id: "candidate",
    label: "Candidate",
    workspace: "Guided Concierge",
    home: "/portal",
    icon: UserCheck,
    status: "live",
    description: "Hyper-clear, guided onboarding experience.",
  },
  {
    id: "onboarder",
    label: "Onboarder",
    workspace: "HR Operations",
    home: "/onboarder",
    icon: ClipboardList,
    status: "live",
    description: "Manage all active new hires and exceptions.",
  },
  {
    id: "recruiter",
    label: "Recruiter",
    workspace: "Candidate Handoff",
    home: "/recruiter",
    icon: Users,
    status: "live",
    description: "Track recruiter-owned candidates from offer to fully onboarded.",
  },
  {
    id: "recruiting-manager",
    label: "Recruiting Manager",
    workspace: "Team Performance",
    home: "/recruiting-manager",
    icon: BarChart3,
    status: "live",
    description: "Monitor team workload, throughput, and bottlenecks.",
  },
  {
    id: "team-lead",
    label: "Team Lead",
    workspace: "Pod Performance",
    home: "/team-lead",
    icon: UsersRound,
    status: "live",
    description: "Tactical view of your pod — daily priorities and coaching.",
  },
  {
    id: "account-manager",
    label: "Account Manager",
    workspace: "Client Readiness",
    home: "/account-manager",
    icon: Building2,
    status: "live",
    description: "Client-centric view of onboarding pipelines.",
  },
  {
    id: "vendor",
    label: "Vendor",
    workspace: "Vendor Portal",
    home: "/vendor",
    icon: Handshake,
    status: "live",
    description:
      "External subcontractor (C2C) — scoped access to their own submitted candidates.",
  },
  {
    id: "client",
    label: "Client",
    workspace: "Client Portal",
    home: "/client-portal",
    icon: Building2,
    status: "live",
    description:
      "External end-client user — scoped readiness view of their own incoming consultants.",
  },
];

export const DEFAULT_PERSONA: Persona = PERSONAS[0];

export function getPersona(id: PersonaId): Persona {
  return PERSONAS.find((p) => p.id === id) ?? DEFAULT_PERSONA;
}

/** §4 + §97.1 — primary navigation for the operational app shell. */
export const NAV_SECTIONS: NavSection[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      {
        id: "home",
        label: "Home",
        href: "/command-center",
        icon: Home,
        status: "live",
        spec: "§7",
        description: "Super Admin Vitals & Operations dashboard.",
      },
      {
        id: "my-work",
        label: "My Work",
        href: "/my-work",
        icon: Inbox,
        status: "live",
        spec: "§6",
        description: "Universal action inbox across every persona.",
      },
    ],
  },
  {
    id: "people",
    label: "People",
    items: [
      {
        id: "candidates",
        label: "Candidates",
        href: "/candidates",
        icon: Users,
        status: "live",
        spec: "§15",
        description: "Candidate 360 records and pipeline.",
      },
      {
        id: "consultants",
        label: "Consultants",
        href: "/planned/consultants",
        icon: UserCheck,
        status: "planned",
        roadmap: "v0.2.0",
        spec: "§15",
        description: "Persistent workforce records and lifecycle.",
      },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    items: [
      {
        id: "onboarding",
        label: "Onboarding",
        href: "/planned/onboarding",
        icon: ClipboardList,
        status: "planned",
        roadmap: "v0.3.0",
        spec: "§14",
        description: "Full lifecycle timeline from Day -14 to Day 30.",
      },
      {
        id: "packages",
        label: "Packages",
        href: "/planned/packages",
        icon: Package,
        status: "planned",
        roadmap: "v0.4.0",
        spec: "§8",
        description: "Dynamic client-mapped onboarding packages.",
      },
      {
        id: "exceptions",
        label: "Exceptions",
        href: "/planned/exceptions",
        icon: TriangleAlert,
        status: "planned",
        roadmap: "v0.5.0",
        spec: "§18",
        description: "Exception Management Control Tower.",
      },
      {
        id: "clients",
        label: "Clients",
        href: "/planned/clients",
        icon: Building2,
        status: "planned",
        roadmap: "v0.2.0",
        spec: "§30",
        description: "Clients, MSPs, vendors, programs and rules.",
      },
    ],
  },
  {
    id: "records",
    label: "Records",
    items: [
      {
        id: "documents",
        label: "Documents",
        href: "/planned/documents",
        icon: FileText,
        status: "planned",
        roadmap: "v0.6.0",
        spec: "§20",
        description: "Document intelligence and digital forms.",
      },
      {
        id: "screening",
        label: "Screening",
        href: "/planned/screening",
        icon: ShieldCheck,
        status: "planned",
        roadmap: "v0.5.0",
        spec: "§22",
        description: "Background check & screening adjudication.",
      },
      {
        id: "payroll",
        label: "Payroll Readiness",
        href: "/planned/payroll",
        icon: Wallet,
        status: "planned",
        roadmap: "v0.5.0",
        spec: "§16",
        description: "Payroll readiness gate and checks.",
      },
      {
        id: "billing",
        label: "Billing Readiness",
        href: "/planned/billing",
        icon: Receipt,
        status: "planned",
        roadmap: "v0.5.0",
        spec: "§16",
        description: "Client / billing readiness gate and checks.",
      },
      {
        id: "equipment",
        label: "Equipment & IT",
        href: "/planned/equipment",
        icon: Laptop,
        status: "planned",
        roadmap: "v0.5.0",
        spec: "§17",
        description: "Equipment and IT provisioning center.",
      },
    ],
  },
  {
    id: "engage",
    label: "Engage",
    items: [
      {
        id: "communications",
        label: "Communications",
        href: "/planned/communications",
        icon: MessageSquare,
        status: "planned",
        roadmap: "v0.6.0",
        spec: "§24",
        description: "Communications Command Center & Gentle Nudge protocol.",
      },
      {
        id: "training",
        label: "Training",
        href: "/planned/training",
        icon: GraduationCap,
        status: "planned",
        roadmap: "v0.6.0",
        spec: "§37",
        description: "Training and certification management.",
      },
    ],
  },
  {
    id: "insights",
    label: "Insights",
    items: [
      {
        id: "reports",
        label: "Reports",
        href: "/reports",
        icon: BarChart3,
        status: "live",
        spec: "§49",
        description: "Comprehensive enterprise reporting catalog.",
      },
    ],
  },
  {
    id: "configure",
    label: "Configure",
    items: [
      {
        id: "integrations",
        label: "Integrations",
        href: "/planned/integrations",
        icon: Plug,
        status: "planned",
        roadmap: "v0.8.0",
        spec: "§29",
        description: "Integration and automation hub.",
      },
      {
        id: "workflow-studio",
        label: "Workflow Studio",
        href: "/planned/workflow-studio",
        icon: Workflow,
        status: "planned",
        roadmap: "v0.4.0",
        spec: "§19",
        description: "Configurable visual workflow & rules designer.",
      },
      {
        id: "compliance",
        label: "Compliance Policies",
        href: "/planned/compliance",
        icon: Scale,
        status: "planned",
        roadmap: "v0.4.0",
        spec: "§21",
        description: "Compliance policy center.",
      },
      {
        id: "audit",
        label: "Audit Center",
        href: "/planned/audit",
        icon: History,
        status: "planned",
        roadmap: "v0.2.0",
        spec: "§26",
        description: "Audit and evidence center.",
      },
      {
        id: "administration",
        label: "Administration",
        href: "/administration",
        icon: Settings,
        status: "live",
        spec: "§42",
        description:
          "Users, roles, permissions and security — including navigation visibility per role.",
      },
    ],
  },
];

const NAV_BY_ID = new Map<string, NavItem>(
  NAV_SECTIONS.flatMap((s) => s.items).map((item) => [item.id, item]),
);

export function getNavItem(id: string): NavItem | undefined {
  return NAV_BY_ID.get(id);
}

export const ALL_NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);
