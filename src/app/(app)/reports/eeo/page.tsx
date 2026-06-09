import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardCheck,
  Scale,
  ShieldCheck,
  Users,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { EeoDemoNotice } from "@/components/reports/eeo-demo-notice";

export const metadata: Metadata = { title: "EEOC Compliance Reports" };

const TILES = [
  {
    href: "/reports/eeo/workforce-composition",
    name: "EEO-1 Workforce Composition",
    description:
      "Annual EEOC Component 1 report — workforce counts by job category, race / ethnicity, and sex.",
    icon: Users,
  },
  {
    href: "/reports/eeo/applicant-flow",
    name: "Applicant Flow Log",
    description:
      "OFCCP-required tracking of applicants through screening, interview, offer, and hire — with demographic breakdown.",
    icon: ClipboardCheck,
  },
  {
    href: "/reports/eeo/adverse-impact",
    name: "Adverse Impact Analysis",
    description:
      "EEOC 4/5ths rule analysis of selection rates across demographic groups for hiring, promotion, and termination.",
    icon: Scale,
  },
  {
    href: "/reports/eeo/vets-4212",
    name: "VETS-4212 Veteran Report",
    description:
      "Annual Department of Labor report on protected veteran workforce composition and new-hire activity.",
    icon: ShieldCheck,
  },
] as const;

export default function EeoReportsIndexPage() {
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
          title="EEOC Compliance Reports"
          description="Federal reporting suite for EEO-1, OFCCP, VETS-4212, and pay equity audits."
        />
      </div>

      <EeoDemoNotice />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {TILES.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className="bg-card hover:border-primary/40 focus-visible:ring-ring group flex items-start gap-3 rounded-xl border p-4 shadow-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                <Icon className="size-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-card-heading">{t.name}</p>
                <p className="text-muted-foreground mt-1 text-sm leading-snug">
                  {t.description}
                </p>
              </div>
              <ArrowRight className="text-muted-foreground mt-1 size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </Link>
          );
        })}
      </section>

      <p className="text-muted-foreground text-xs">
        Pay equity analysis and EEO Self-ID completion reports will be added
        once the Self-ID capture module ships.
      </p>
    </PageContainer>
  );
}
