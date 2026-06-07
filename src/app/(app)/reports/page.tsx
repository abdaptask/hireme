import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Briefcase,
  ChevronRight,
  DollarSign,
  Sparkles,
  Users,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import {
  PREVIEW_REPORTS,
  REPORT_CATALOG,
  type ReportCategory,
} from "@/lib/report-catalog";

export const metadata: Metadata = { title: "Reports" };

const CATEGORY_ICON: Record<string, typeof DollarSign> = {
  financial: DollarSign,
  recruiters: Users,
  "back-office": Briefcase,
};

function CategoryCard({ category }: { category: ReportCategory }) {
  const Icon = CATEGORY_ICON[category.id] ?? Briefcase;
  return (
    <section className="bg-card flex flex-col rounded-xl border shadow-xs">
      <div className="flex items-center gap-2 border-b px-4 py-2.5">
        <span className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-md">
          <Icon className="size-4" />
        </span>
        <h2 className="text-card-heading">{category.label}</h2>
        <span className="text-muted-foreground ml-auto text-xs tabular-nums">
          {category.reports.length}
        </span>
      </div>
      <ul className="flex flex-col p-1.5">
        {category.reports.map((r) => (
          <li key={r.slug}>
            <Link
              href={`/reports/${r.slug}`}
              className="hover:bg-muted/60 focus-visible:ring-ring flex items-center gap-2 rounded-md px-2.5 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
            >
              <span className="flex-1 truncate">{r.name}</span>
              {r.hasSubReports && (
                <Badge variant="outline" className="text-[10px]">
                  sub-reports
                </Badge>
              )}
              <ChevronRight className="text-muted-foreground size-4" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function ReportsHubPage() {
  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="Reports"
        description="Enterprise reporting catalog. Each report is a placeholder — built out individually as we reach it."
      />

      {/* Live analytics previews already built in this app */}
      <section>
        <h2 className="text-section-heading mb-2.5 flex items-center gap-1.5">
          <Sparkles className="text-ai size-4" /> Available now
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PREVIEW_REPORTS.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="bg-card hover:border-primary/40 focus-visible:ring-ring flex items-center justify-between gap-3 rounded-xl border p-4 shadow-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <div className="min-w-0">
                <p className="text-card-heading">{r.name}</p>
                <p className="text-muted-foreground mt-0.5 text-sm">{r.note}</p>
              </div>
              <ArrowRight className="text-muted-foreground size-4 shrink-0" />
            </Link>
          ))}
        </div>
      </section>

      {/* Real ApTask report catalog — placeholders */}
      <section>
        <h2 className="text-section-heading mb-2.5">Report catalog</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {REPORT_CATALOG.map((c) => (
            <CategoryCard key={c.id} category={c} />
          ))}
        </div>
      </section>
    </PageContainer>
  );
}
