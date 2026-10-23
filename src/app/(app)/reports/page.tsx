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
import { ReportLibrary } from "@/components/reports/engine/report-library";
import {
  REPORTS,
  REPORT_PERSONAS,
  REPORT_SECTIONS,
  getReport,
  reportMeta,
} from "@/lib/report-engine/registry";
import {
  canViewLegacy,
  canViewReport,
  libraryPersonas,
  viewerScope,
} from "@/lib/report-engine/access";
import { getViewerRole } from "@/lib/report-engine/viewer";
import { getRole, type RoleId } from "@/lib/roles";

export const dynamic = "force-dynamic"; // catalog depends on the viewer's role

/** Whether a catalog link (engine report or legacy page) is open to the role. */
function canOpen(role: RoleId, slugOrHref: string): boolean {
  const slug = slugOrHref.replace(/^\/reports\//, "");
  const engine = getReport(slug);
  if (engine) return canViewReport(role, engine);
  return canViewLegacy(role, slug.split("/")[0]);
}

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

export default async function ReportsHubPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const { denied } = await searchParams;
  const role = await getViewerRole();
  const roleLabel = getRole(role).label;
  const scope = viewerScope(role);

  // Only the reports this role is entitled to (§73.1, §42).
  const reports = REPORTS.filter((r) => canViewReport(role, r)).map(reportMeta);
  const allowedPersonas = libraryPersonas(role);
  const personas = allowedPersonas === "all" ? REPORT_PERSONAS : [];
  const previews = PREVIEW_REPORTS.filter((r) => canOpen(role, r.href));
  const catalog = REPORT_CATALOG.map((c) => ({
    ...c,
    reports: c.reports.filter((r) => canOpen(role, r.slug)),
  })).filter((c) => c.reports.length);

  // Unique count — some reports appear in both the library and the catalog.
  const totalReports = new Set([
    ...reports.map((r) => r.slug),
    ...previews.map((r) => r.href.replace(/^\/reports\//, "")),
    ...catalog.flatMap((c) => c.reports.map((r) => r.slug)),
  ]).size;

  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="Reports"
        description={
          role === "super-admin"
            ? "Enterprise reporting for every persona — live on platform data, with drill-down, metric definitions, and export."
            : `Your ${roleLabel} report catalog — ${totalReports} reports you're entitled to.`
        }
      />

      {denied && (
        <p className="bg-warning-muted text-warning-muted-foreground rounded-lg px-3 py-2 text-sm">
          That report isn&apos;t part of the {roleLabel} catalog, so you were
          brought back here.
        </p>
      )}
      {scope.kind !== "all" && scope.kind !== "none" && (
        <p className="bg-info-muted text-info-muted-foreground rounded-lg px-3 py-2 text-sm">
          Data in every report is limited to{" "}
          {scope.label.replace(/^[^—]*— /, "")}.
        </p>
      )}

      {reports.length === 0 && previews.length === 0 && catalog.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
          The {roleLabel} role has no internal reports. External users see their
          status in their own portal.
        </p>
      ) : null}

      {reports.length > 0 && (
        <ReportLibrary
          reports={reports}
          sections={REPORT_SECTIONS}
          personas={personas}
        />
      )}

      {/* Live analytics previews already built in this app */}
      {previews.length > 0 && (
        <section>
          <h2 className="text-section-heading mb-2.5 flex items-center gap-1.5">
            <Sparkles className="text-ai size-4" /> Available now
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {previews.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="bg-card hover:border-primary/40 focus-visible:ring-ring flex items-center justify-between gap-3 rounded-xl border p-4 shadow-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <div className="min-w-0">
                  <p className="text-card-heading">{r.name}</p>
                  <p className="text-muted-foreground mt-0.5 text-sm">
                    {r.note}
                  </p>
                </div>
                <ArrowRight className="text-muted-foreground size-4 shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ApTask back-office report catalog */}
      {catalog.length > 0 && (
        <section>
          <h2 className="text-section-heading mb-2.5">Back-office catalog</h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {catalog.map((c) => (
              <CategoryCard key={c.id} category={c} />
            ))}
          </div>
        </section>
      )}
    </PageContainer>
  );
}
