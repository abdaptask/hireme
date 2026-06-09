/**
 * Company Snapshot (§67 executive reports, §51 super admin reports).
 *
 * Executive read-only view of the firm — workforce, financials, leadership,
 * milestones, and compliance posture. Designed as the "at-a-glance" briefing
 * surface for board reviews, new-exec onboarding, and quarterly business
 * reviews. All values are mock; the page is a server component because no
 * state or interactivity is required (§122 performance).
 */

import type { Metadata } from "next";
import {
  Award,
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  DollarSign,
  PercentCircle,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";

import { PageContainer, PageHeader } from "@/components/page";
import { StatTile } from "@/components/workspace/stat-tile";

export const metadata: Metadata = { title: "Company Snapshot" };

// ─────────────────────────────────────────────────────────
// Mock data
// ─────────────────────────────────────────────────────────

type Executive = {
  name: string;
  title: string;
  tenureYears: number;
  initials: string;
};

const LEADERSHIP: Executive[] = [
  {
    name: "Rajesh Menon",
    title: "Chief Executive Officer",
    tenureYears: 8,
    initials: "RM",
  },
  {
    name: "Diane Voss",
    title: "Chief Operating Officer",
    tenureYears: 5,
    initials: "DV",
  },
  {
    name: "Karim El-Sayed",
    title: "Chief Financial Officer",
    tenureYears: 4,
    initials: "KE",
  },
  {
    name: "Lena Park",
    title: "Chief Technology Officer",
    tenureYears: 3,
    initials: "LP",
  },
  {
    name: "Priya Iyer",
    title: "Chief Human Resources Officer",
    tenureYears: 6,
    initials: "PI",
  },
  {
    name: "Marcus Hill",
    title: "VP, Sales",
    tenureYears: 4,
    initials: "MH",
  },
];

type Milestone = {
  year: string;
  title: string;
  description: string;
};

const MILESTONES: Milestone[] = [
  {
    year: "2018",
    title: "Founded",
    description: "ApTask incorporated in New Jersey with a 6-person team.",
  },
  {
    year: "2020",
    title: "First MSP partnership",
    description:
      "Signed first VMS-driven program partnership with Fortune 500 client.",
  },
  {
    year: "2021",
    title: "$10M ARR",
    description:
      "Crossed $10M annual recurring revenue, opened second regional office.",
  },
  {
    year: "2022",
    title: "100 active consultants",
    description:
      "Achieved sustained pipeline of 100+ active consultant assignments.",
  },
  {
    year: "2024",
    title: "AI orchestration launched",
    description:
      "Released first AI-assisted onboarding orchestration on internal platform.",
  },
  {
    year: "2026",
    title: "Platform rewrite",
    description:
      "Launched next-generation workforce orchestration platform (this product).",
  },
];

type ComplianceIndicator = {
  label: string;
  detail: string;
  status: "current" | "due-soon" | "overdue";
};

const COMPLIANCE: ComplianceIndicator[] = [
  {
    label: "EEO-1 Filed",
    detail: "Component 1 report filed Feb 2026.",
    status: "current",
  },
  {
    label: "VETS-4212 Current",
    detail: "Federal contractor veteran report submitted Sep 2025.",
    status: "current",
  },
  {
    label: "OFCCP Audit",
    detail: "AAP plan current through Dec 2026.",
    status: "current",
  },
  {
    label: "Workers Comp",
    detail: "Active policies in all 38 operating states.",
    status: "current",
  },
];

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────

export default function CompanySnapshotPage() {
  return (
    <PageContainer className="flex flex-col gap-8">
      <PageHeader
        title="Company Snapshot"
        description="Executive view — workforce, revenue, leadership."
      />

      {/* KPI grid */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatTile
          icon={Users}
          label="Total Workforce"
          value="1,248"
          tone="info"
        />
        <StatTile
          icon={DollarSign}
          label="YTD Revenue"
          value="$87.4M"
          tone="success"
        />
        <StatTile
          icon={PercentCircle}
          label="YTD Margin"
          value="24.6%"
          suffix="gross"
          tone="default"
        />
        <StatTile
          icon={Briefcase}
          label="Active Clients"
          value={142}
          tone="ai"
        />
        <StatTile
          icon={TrendingUp}
          label="New Hires MTD"
          value={38}
          tone="warning"
        />
        <StatTile
          icon={UserCheck}
          label="Conversion Rate"
          value="6.4%"
          suffix="C2P"
          tone="success"
        />
      </section>

      {/* Body grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Leadership */}
        <section className="bg-card flex flex-col rounded-xl border shadow-xs lg:col-span-2">
          <header className="flex items-center gap-2 border-b px-5 py-3.5">
            <Award className="text-primary size-4" />
            <h2 className="text-section-heading">Leadership team</h2>
            <span className="text-muted-foreground ml-auto text-xs">
              {LEADERSHIP.length} executives
            </span>
          </header>
          <ul className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2">
            {LEADERSHIP.map((exec) => (
              <li
                key={exec.name}
                className="bg-card flex items-center gap-3 px-5 py-4"
              >
                <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                  {exec.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-card-heading">{exec.name}</p>
                  <p className="text-muted-foreground text-xs">{exec.title}</p>
                </div>
                <div className="text-muted-foreground text-right text-[11px]">
                  <p className="font-semibold tabular-nums">
                    {exec.tenureYears}y
                  </p>
                  <p>tenure</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Compliance */}
        <section className="bg-card flex flex-col rounded-xl border shadow-xs">
          <header className="flex items-center gap-2 border-b px-5 py-3.5">
            <ShieldCheck className="text-success-muted-foreground size-4" />
            <h2 className="text-section-heading">Compliance status</h2>
          </header>
          <ul className="divide-y">
            {COMPLIANCE.map((item) => (
              <li key={item.label} className="flex items-start gap-3 px-5 py-3.5">
                <span className="bg-success-muted text-success-muted-foreground mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full">
                  <CheckCircle2 className="size-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-muted-foreground text-xs">{item.detail}</p>
                </div>
                <BadgeCheck className="text-success-muted-foreground ml-auto size-4 shrink-0" />
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Milestones */}
      <section className="bg-card overflow-hidden rounded-xl border shadow-xs">
        <header className="flex items-center gap-2 border-b px-5 py-3.5">
          <Sparkles className="text-ai-muted-foreground size-4" />
          <h2 className="text-section-heading">Key milestones</h2>
          <span className="text-muted-foreground ml-auto text-xs">
            Last {MILESTONES.length} highlights
          </span>
        </header>
        <ol className="relative px-5 py-5">
          <span
            className="bg-border absolute top-6 bottom-6 left-[34px] w-px"
            aria-hidden
          />
          <div className="flex flex-col gap-5">
            {MILESTONES.map((m) => (
              <li key={m.year} className="relative flex gap-4">
                <span className="bg-card border-primary text-primary z-10 flex size-[34px] shrink-0 items-center justify-center rounded-full border-2">
                  <CalendarDays className="size-4" />
                </span>
                <div className="min-w-0 flex-1 pt-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <p className="text-card-heading">{m.title}</p>
                    <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums">
                      {m.year}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-sm">
                    {m.description}
                  </p>
                </div>
              </li>
            ))}
          </div>
        </ol>
      </section>

      <footer className="text-muted-foreground flex items-center gap-2 text-xs">
        <Building2 className="size-3.5" />
        Snapshot generated for executive review · figures are illustrative mock
        data
      </footer>
    </PageContainer>
  );
}
