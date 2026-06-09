/**
 * Operational Counts report (§49 reporting catalog, §99 dense data grid).
 *
 * Mirrors the JobDiva-style workload-counts sidebar: 19 live pipeline +
 * lifecycle counts grouped by category. Every row drills into the underlying
 * records so the user can move from "what is the state" to "act on it" in one
 * click (§5.3 status visual language, §6 universal action center).
 *
 * Counts are derived deterministically from CANDIDATES + CONSULTANTS via the
 * helpers in lib/clock.ts — no hardcoded values. A few rows (DOB / benefits)
 * are flagged with a small "Demo: …" note because their source fields haven't
 * been modeled yet (v0.2 persistence will add them).
 */
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { CANDIDATES } from "@/lib/candidates";
import { CONSULTANTS } from "@/lib/consultants";
import { daysUntil } from "@/lib/clock";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Operational Counts" };

type Tone = "danger" | "warning" | "default";

type CountRow = {
  label: string;
  count: number;
  href: string;
  tone?: Tone;
  /** Small inline note (e.g. for fields not yet modeled). */
  note?: string;
};

type CountGroup = {
  label: string;
  rows: CountRow[];
};

/* --------------------------------------------------------------------------
   Group 1 — Onboarding Pipeline
   Every CANDIDATES record is, by construction, currently being onboarded
   (the dataset only carries in-pipeline people). We map the spec's nominal
   ATS statuses ("new" / "offer-accepted" / "onboarding") onto stage + progress
   so the counts stay meaningful against the mock data shape.
   -------------------------------------------------------------------------- */

const pendingOb = CANDIDATES.length;

// "Offer accepted but no firm start" — early-stage candidates with low progress.
const pendingStart = CANDIDATES.filter(
  (c) =>
    (c.stage === "Profile Setup" || c.stage === "Document Submission") &&
    c.progress < 50,
).length;

const pendingExt = CONSULTANTS.filter(
  (c) => c.status === "Extension Pending",
).length;

// Payroll readiness < 100% — proxied via stage (anything before Tax & Payroll
// has not started payroll setup; Tax & Payroll itself is still in flight) and
// the explicit "Missing direct deposit" / payroll-fail tags.
const pendingPayroll = CANDIDATES.filter((c) => {
  const preTax = ["Profile Setup", "Document Submission", "Background Check"];
  if (preTax.includes(c.stage)) return true;
  if (c.stage === "Tax & Payroll") return true;
  return c.tags.some((t) => /payroll|direct deposit/i.test(t));
}).length;

// Consultants without an active assignment (Bench / Former / Ineligible).
const noStarts = CONSULTANTS.filter(
  (c) => c.status === "Bench" || c.status === "Former" || c.status === "Ineligible",
).length;

/* --------------------------------------------------------------------------
   Group 2 — Starts & Ends
   -------------------------------------------------------------------------- */

// Starts this week / month — candidate startInDays is already "from now".
// For consultants we parse startDate; the 7- and 30-day windows include the
// current day and exclude past dates.
const candStartsWeek = CANDIDATES.filter(
  (c) => c.startInDays >= 0 && c.startInDays <= 7,
).length;
const candStartsMonth = CANDIDATES.filter(
  (c) => c.startInDays >= 0 && c.startInDays <= 30,
).length;
const consStartsWeek = CONSULTANTS.filter((c) => {
  const d = daysUntil(new Date(c.startDate));
  return d >= 0 && d <= 7;
}).length;
const consStartsMonth = CONSULTANTS.filter((c) => {
  const d = daysUntil(new Date(c.startDate));
  return d >= 0 && d <= 30;
}).length;
const startsWeek = candStartsWeek + consStartsWeek;
const startsMonth = candStartsMonth + consStartsMonth;

const endsWeek = CONSULTANTS.filter((c) => {
  if (!c.endDate) return false;
  const d = daysUntil(new Date(c.endDate));
  return d >= 0 && d <= 7;
}).length;
const endsMonth = CONSULTANTS.filter((c) => {
  if (!c.endDate) return false;
  const d = daysUntil(new Date(c.endDate));
  return d >= 0 && d <= 30;
}).length;

// Has an endDate but not yet locked into Offboarding — i.e. could renew or roll.
const tentativeEnd = CONSULTANTS.filter(
  (c) => !!c.endDate && c.status !== "Offboarding" && c.status !== "Former",
).length;

/* --------------------------------------------------------------------------
   Group 3 — Workforce Status
   -------------------------------------------------------------------------- */

const allActive = CONSULTANTS.filter(
  (c) => c.status === "Active" || c.status === "Extension Pending",
).length;

const allPast = CONSULTANTS.filter(
  (c) => c.status === "Former" || c.status === "Converted",
).length;

// "Fulltime" here mirrors ApTask's usage: W-2 (employer-of-record) — the
// closest analog in the staffing world to a salaried fulltime hire.
const fulltimePending = CANDIDATES.filter(
  (c) => c.employmentType === "W-2",
).length;

const fulltimeStarted = CONSULTANTS.filter(
  (c) => c.employmentType === "W-2" && c.status === "Active",
).length;

/* --------------------------------------------------------------------------
   Group 4 — HR & Benefits
   DOB and benefits-eligibility fields are not in the mock data shape yet
   (v0.2 persistence). We surface placeholder counts with a clear "Demo: …"
   note so the row is honest about its source.
   -------------------------------------------------------------------------- */

// Stable mock counts derived from totals so they look plausible against the
// rest of the dashboard rather than pulled from thin air.
const totalPeople = CANDIDATES.length + CONSULTANTS.length;
const birthdayThisMonth = Math.round(totalPeople / 12); // ~uniform over months
const blankBirthDate = Math.round(totalPeople * 0.15); // realistic data-quality gap
const benefitsUndecided = CANDIDATES.filter(
  (c) => c.employmentType === "W-2",
).length;

/* --------------------------------------------------------------------------
   Group 5 — Financial Setup
   -------------------------------------------------------------------------- */

const pendingPnl = CONSULTANTS.filter(
  (c) => !c.billRate || !c.payRate,
).length;
const pendingFtPnl = CONSULTANTS.filter(
  (c) => c.employmentType === "W-2" && (!c.billRate || !c.payRate),
).length;

/* --------------------------------------------------------------------------
   Group definitions
   -------------------------------------------------------------------------- */

const GROUPS: CountGroup[] = [
  {
    label: "Onboarding Pipeline",
    rows: [
      {
        label: "Pending OB",
        count: pendingOb,
        href: "/candidates?status=onboarding",
      },
      {
        label: "Pending Start",
        count: pendingStart,
        href: "/candidates?status=offer-accepted",
        tone: pendingStart > 0 ? "danger" : "default",
      },
      {
        label: "Pending EXT",
        count: pendingExt,
        href: "/lifecycle?tab=extensions&status=pending",
        tone: pendingExt > 0 ? "warning" : "default",
      },
      {
        label: "Pending Payroll",
        count: pendingPayroll,
        href: "/payroll",
      },
      {
        label: "No Starts",
        count: noStarts,
        href: "/consultants?filter=no-start",
      },
    ],
  },
  {
    label: "Starts & Ends",
    rows: [
      {
        label: "Starts this Week",
        count: startsWeek,
        href: "/onboarding?filter=starting-this-week",
      },
      {
        label: "Starts this Month",
        count: startsMonth,
        href: "/onboarding?filter=starting-this-month",
      },
      {
        label: "Ends this Week",
        count: endsWeek,
        href: "/lifecycle?tab=offboarding&window=week",
        tone: endsWeek > 0 ? "danger" : "default",
      },
      {
        label: "Ends this Month",
        count: endsMonth,
        href: "/lifecycle?tab=offboarding&window=month",
      },
      {
        label: "Tentative End",
        count: tentativeEnd,
        href: "/lifecycle?tab=offboarding&filter=tentative",
      },
    ],
  },
  {
    label: "Workforce Status",
    rows: [
      {
        label: "All Active",
        count: allActive,
        href: "/consultants?status=active",
      },
      {
        label: "All Past",
        count: allPast,
        href: "/consultants?status=past",
      },
      {
        label: "Fulltime Pending",
        count: fulltimePending,
        href: "/candidates?employmentType=W-2&status=onboarding",
      },
      {
        label: "Fulltime Started",
        count: fulltimeStarted,
        href: "/consultants?employmentType=W-2&status=active",
      },
    ],
  },
  {
    label: "HR & Benefits",
    rows: [
      {
        label: "Birthday this Month",
        count: birthdayThisMonth,
        href: "/candidates?filter=birthday-this-month",
        note: "Demo: DOB field pending",
      },
      {
        label: "Blank Birth Date",
        count: blankBirthDate,
        href: "/candidates?filter=missing-dob",
        tone: "default",
        note: "Demo: DOB field pending",
      },
      {
        label: "Benefits Undecided",
        count: benefitsUndecided,
        href: "/candidates?filter=benefits-undecided",
        note: "Benefits enrollment module pending",
      },
    ],
  },
  {
    label: "Financial Setup",
    rows: [
      {
        label: "Pending PNL",
        count: pendingPnl,
        href: "/reports/consultant-pnl?filter=missing",
      },
      {
        label: "Pending FT PNL",
        count: pendingFtPnl,
        href: "/reports/consultant-pnl?filter=missing&employmentType=W-2",
      },
    ],
  },
];

/* --------------------------------------------------------------------------
   Render
   -------------------------------------------------------------------------- */

function toneClass(tone: Tone | undefined, count: number): string {
  if (count === 0) return "text-muted-foreground";
  if (tone === "danger") return "text-danger-muted-foreground";
  if (tone === "warning") return "text-warning-muted-foreground";
  return "text-foreground";
}

function GroupCard({ group }: { group: CountGroup }) {
  return (
    <section className="bg-card flex flex-col rounded-xl border shadow-xs">
      <header className="border-b px-4 py-2.5">
        <h2 className="text-card-heading">{group.label}</h2>
      </header>
      <ul>
        {group.rows.map((row) => (
          <li
            key={row.label}
            className="hover:bg-muted/50 flex items-center justify-between border-b px-4 py-2.5 last:border-0"
          >
            <Link
              href={row.href}
              className="hover:text-primary focus-visible:ring-ring flex-1 rounded text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
            >
              {row.label}
              {row.note && (
                <span className="text-muted-foreground ml-1.5 text-[10px] font-normal">
                  ({row.note})
                </span>
              )}
            </Link>
            <span
              className={cn(
                "tabular-nums text-base font-semibold",
                toneClass(row.tone, row.count),
              )}
            >
              {row.count.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function OperationalCountsPage() {
  const totalRows = GROUPS.reduce((sum, g) => sum + g.rows.length, 0);

  return (
    <PageContainer className="flex flex-col gap-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-1"
          nativeButton={false}
          render={<Link href="/reports" />}
        >
          <ArrowLeft className="size-4" /> Reports
        </Button>
        <PageHeader
          title="Operational Counts"
          description="Live pipeline + lifecycle counts. Click any row to drill into the source records."
          actions={
            <span className="text-muted-foreground text-xs tabular-nums">
              {totalRows} metrics · derived from {CANDIDATES.length} candidates,{" "}
              {CONSULTANTS.length} consultants
            </span>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GROUPS.map((g) => (
          <GroupCard key={g.label} group={g} />
        ))}
      </div>
    </PageContainer>
  );
}
