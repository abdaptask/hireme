"use client";

/**
 * Benefits Master (§57 compliance, §75.12 benefits platforms, §121 admin tools).
 *
 * Insurance plan catalog — carrier, eligibility waiting period, employer
 * contribution, employee monthly premium, plan tiers, and effective /
 * renewal windows. Acts as the configuration source for the Benefits
 * Enrollment module surfaced in the candidate portal (§5.2) and the
 * payroll-readiness gate (§16).
 */

import { useMemo, useState } from "react";
import {
  Activity,
  Building2,
  CalendarClock,
  CalendarDays,
  HeartPulse,
  Plus,
  Search,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

import { PageContainer, PageHeader } from "@/components/page";
import { StatTile } from "@/components/workspace/stat-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { daysAgo, daysFromNow, formatDate, daysUntil } from "@/lib/clock";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────
// Types & mock data
// ─────────────────────────────────────────────────────────

type PlanType =
  | "Medical"
  | "Dental"
  | "Vision"
  | "Disability"
  | "Life"
  | "Accident";

type Carrier =
  | "UnitedHealthcare"
  | "Cigna"
  | "Aetna"
  | "Delta Dental"
  | "VSP"
  | "Guardian"
  | "MetLife";

type PlanTier = "Employee" | "E+S" | "E+C" | "Family";

type BenefitPlan = {
  id: string;
  name: string;
  type: PlanType;
  carrier: Carrier;
  eligibilityWaitDays: 0 | 30 | 60 | 90;
  employerContribution: number; // %
  monthlyPremiumEmployee: number; // $
  planFor: PlanTier[];
  effectiveDate: Date;
  renewalDate: Date;
  active: boolean;
};

const PLAN_TYPE_META: Record<
  PlanType,
  { icon: React.ComponentType<{ className?: string }>; tone: string }
> = {
  Medical: { icon: Stethoscope, tone: "bg-info-muted text-info-muted-foreground" },
  Dental: { icon: HeartPulse, tone: "bg-success-muted text-success-muted-foreground" },
  Vision: { icon: Activity, tone: "bg-ai-muted text-ai-muted-foreground" },
  Disability: {
    icon: ShieldCheck,
    tone: "bg-warning-muted text-warning-muted-foreground",
  },
  Life: { icon: ShieldCheck, tone: "bg-primary/10 text-primary" },
  Accident: {
    icon: Activity,
    tone: "bg-danger-muted text-danger-muted-foreground",
  },
};

const PLANS: BenefitPlan[] = [
  {
    id: "plan-ppo-premium",
    name: "PPO Premium",
    type: "Medical",
    carrier: "UnitedHealthcare",
    eligibilityWaitDays: 30,
    employerContribution: 80,
    monthlyPremiumEmployee: 145,
    planFor: ["Employee", "E+S", "E+C", "Family"],
    effectiveDate: daysAgo(180),
    renewalDate: daysFromNow(185),
    active: true,
  },
  {
    id: "plan-ppo-standard",
    name: "PPO Standard",
    type: "Medical",
    carrier: "Cigna",
    eligibilityWaitDays: 30,
    employerContribution: 70,
    monthlyPremiumEmployee: 210,
    planFor: ["Employee", "E+S", "E+C", "Family"],
    effectiveDate: daysAgo(180),
    renewalDate: daysFromNow(185),
    active: true,
  },
  {
    id: "plan-hmo",
    name: "HMO",
    type: "Medical",
    carrier: "Aetna",
    eligibilityWaitDays: 60,
    employerContribution: 70,
    monthlyPremiumEmployee: 125,
    planFor: ["Employee", "E+S", "Family"],
    effectiveDate: daysAgo(180),
    renewalDate: daysFromNow(185),
    active: true,
  },
  {
    id: "plan-hdhp",
    name: "HDHP w/ HSA",
    type: "Medical",
    carrier: "UnitedHealthcare",
    eligibilityWaitDays: 30,
    employerContribution: 80,
    monthlyPremiumEmployee: 98,
    planFor: ["Employee", "E+S", "E+C", "Family"],
    effectiveDate: daysAgo(180),
    renewalDate: daysFromNow(185),
    active: true,
  },
  {
    id: "plan-dental-premium",
    name: "Dental Premium",
    type: "Dental",
    carrier: "Delta Dental",
    eligibilityWaitDays: 30,
    employerContribution: 70,
    monthlyPremiumEmployee: 42,
    planFor: ["Employee", "E+S", "E+C", "Family"],
    effectiveDate: daysAgo(180),
    renewalDate: daysFromNow(185),
    active: true,
  },
  {
    id: "plan-dental-standard",
    name: "Dental Standard",
    type: "Dental",
    carrier: "Delta Dental",
    eligibilityWaitDays: 30,
    employerContribution: 50,
    monthlyPremiumEmployee: 28,
    planFor: ["Employee", "E+S", "Family"],
    effectiveDate: daysAgo(180),
    renewalDate: daysFromNow(185),
    active: true,
  },
  {
    id: "plan-vision",
    name: "Vision",
    type: "Vision",
    carrier: "VSP",
    eligibilityWaitDays: 30,
    employerContribution: 50,
    monthlyPremiumEmployee: 12,
    planFor: ["Employee", "E+S", "E+C", "Family"],
    effectiveDate: daysAgo(180),
    renewalDate: daysFromNow(185),
    active: true,
  },
  {
    id: "plan-std",
    name: "STD",
    type: "Disability",
    carrier: "Guardian",
    eligibilityWaitDays: 90,
    employerContribution: 100,
    monthlyPremiumEmployee: 0,
    planFor: ["Employee"],
    effectiveDate: daysAgo(360),
    renewalDate: daysFromNow(5),
    active: true,
  },
  {
    id: "plan-ltd",
    name: "LTD",
    type: "Disability",
    carrier: "Guardian",
    eligibilityWaitDays: 90,
    employerContribution: 100,
    monthlyPremiumEmployee: 0,
    planFor: ["Employee"],
    effectiveDate: daysAgo(360),
    renewalDate: daysFromNow(5),
    active: true,
  },
  {
    id: "plan-life-1x",
    name: "Life - 1x",
    type: "Life",
    carrier: "MetLife",
    eligibilityWaitDays: 60,
    employerContribution: 100,
    monthlyPremiumEmployee: 0,
    planFor: ["Employee"],
    effectiveDate: daysAgo(360),
    renewalDate: daysFromNow(5),
    active: true,
  },
  {
    id: "plan-life-2x",
    name: "Life - 2x",
    type: "Life",
    carrier: "MetLife",
    eligibilityWaitDays: 60,
    employerContribution: 50,
    monthlyPremiumEmployee: 18,
    planFor: ["Employee"],
    effectiveDate: daysAgo(360),
    renewalDate: daysFromNow(5),
    active: true,
  },
  {
    id: "plan-vol-accident",
    name: "Voluntary Accident",
    type: "Accident",
    carrier: "Guardian",
    eligibilityWaitDays: 0,
    employerContribution: 0,
    monthlyPremiumEmployee: 14,
    planFor: ["Employee", "E+S", "E+C", "Family"],
    effectiveDate: daysAgo(90),
    renewalDate: daysFromNow(275),
    active: false,
  },
];

const PLAN_TYPES: ("All" | PlanType)[] = [
  "All",
  "Medical",
  "Dental",
  "Vision",
  "Disability",
  "Life",
  "Accident",
];

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────

export default function BenefitsMasterPage() {
  const [typeFilter, setTypeFilter] = useState<"All" | PlanType>("All");
  const [carrierFilter, setCarrierFilter] = useState<"All" | Carrier>("All");
  const [activeOnly, setActiveOnly] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return PLANS.filter((p) => {
      if (typeFilter !== "All" && p.type !== typeFilter) return false;
      if (carrierFilter !== "All" && p.carrier !== carrierFilter) return false;
      if (activeOnly && !p.active) return false;
      if (
        query &&
        !`${p.name} ${p.carrier} ${p.type}`
          .toLowerCase()
          .includes(query.toLowerCase())
      )
        return false;
      return true;
    });
  }, [typeFilter, carrierFilter, activeOnly, query]);

  const activeCount = PLANS.filter((p) => p.active).length;
  const carrierCount = new Set(PLANS.map((p) => p.carrier)).size;
  const effectiveToday = PLANS.filter(
    (p) => p.active && daysUntil(p.effectiveDate) <= 0,
  ).length;
  const renewalsThisQuarter = PLANS.filter((p) => {
    const d = daysUntil(p.renewalDate);
    return d >= 0 && d <= 90;
  }).length;

  const carriers = Array.from(new Set(PLANS.map((p) => p.carrier))).sort();

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="Benefits Master"
        description="Insurance plans, eligibility rules, contribution structures."
        actions={
          <Button size="sm">
            <Plus className="size-4" /> Add Plan
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          icon={ShieldCheck}
          label="Active Plans"
          value={activeCount}
          tone="success"
        />
        <StatTile
          icon={Building2}
          label="Carriers"
          value={carrierCount}
          tone="info"
        />
        <StatTile
          icon={CalendarDays}
          label="Effective Today"
          value={effectiveToday}
          tone="default"
        />
        <StatTile
          icon={CalendarClock}
          label="Renewals This Quarter"
          value={renewalsThisQuarter}
          tone="warning"
        />
      </div>

      {/* Filter bar */}
      <div className="bg-card flex flex-col gap-3 rounded-xl border p-3 shadow-xs lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-xs">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search plans or carriers…"
            className="pl-8"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-data-label">Type</span>
          {PLAN_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                typeFilter === t
                  ? "bg-primary text-primary-foreground border-primary"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          <span className="text-data-label">Carrier</span>
          <select
            value={carrierFilter}
            onChange={(e) =>
              setCarrierFilter(e.target.value as "All" | Carrier)
            }
            className="bg-background h-8 rounded-md border px-2 text-sm"
          >
            <option value="All">All</option>
            {carriers.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <label className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="accent-primary size-3.5"
            />
            Active only
          </label>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
        {filtered.length === 0 && (
          <p className="text-muted-foreground col-span-full py-10 text-center text-sm">
            No plans match the current filters.
          </p>
        )}
      </div>
    </PageContainer>
  );
}

// ─────────────────────────────────────────────────────────
// Plan card
// ─────────────────────────────────────────────────────────

function PlanCard({ plan }: { plan: BenefitPlan }) {
  const meta = PLAN_TYPE_META[plan.type];
  const Icon = meta.icon;
  const renewalDays = daysUntil(plan.renewalDate);
  const renewingSoon = renewalDays >= 0 && renewalDays <= 60;

  return (
    <article
      className={cn(
        "bg-card flex flex-col gap-3 rounded-xl border p-4 shadow-xs transition-shadow hover:shadow-sm",
        !plan.active && "opacity-70",
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              meta.tone,
            )}
          >
            <Icon className="size-4.5" />
          </span>
          <div className="min-w-0">
            <p className="text-card-heading">{plan.name}</p>
            <p className="text-muted-foreground text-xs">
              {plan.carrier} · {plan.type}
            </p>
          </div>
        </div>
        {plan.active ? (
          <Badge variant="secondary" className="text-[10px]">
            Active
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground text-[10px]">
            Inactive
          </Badge>
        )}
      </header>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <div>
          <dt className="text-data-label">Employer</dt>
          <dd className="text-foreground font-semibold tabular-nums">
            {plan.employerContribution}%
          </dd>
        </div>
        <div>
          <dt className="text-data-label">Employee Premium</dt>
          <dd className="text-foreground font-semibold tabular-nums">
            ${plan.monthlyPremiumEmployee}/mo
          </dd>
        </div>
        <div>
          <dt className="text-data-label">Waiting Period</dt>
          <dd className="text-foreground tabular-nums">
            {plan.eligibilityWaitDays === 0
              ? "Day 1"
              : `${plan.eligibilityWaitDays} days`}
          </dd>
        </div>
        <div>
          <dt className="text-data-label">Effective</dt>
          <dd className="text-foreground">{formatDate(plan.effectiveDate)}</dd>
        </div>
      </dl>

      <div>
        <p className="text-data-label mb-1">Plan tiers</p>
        <div className="flex flex-wrap gap-1">
          {plan.planFor.map((tier) => (
            <span
              key={tier}
              className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-medium"
            >
              {tier}
            </span>
          ))}
        </div>
      </div>

      <footer
        className={cn(
          "flex items-center justify-between border-t pt-2.5 text-xs",
          renewingSoon ? "text-warning-muted-foreground" : "text-muted-foreground",
        )}
      >
        <span className="inline-flex items-center gap-1">
          <CalendarClock className="size-3.5" />
          Renews {formatDate(plan.renewalDate, { withYear: true })}
        </span>
        {renewingSoon && (
          <span className="font-medium">in {renewalDays} days</span>
        )}
      </footer>
    </article>
  );
}
