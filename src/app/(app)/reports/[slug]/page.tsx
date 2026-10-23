import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, BarChart3, Construction } from "lucide-react";
import { PageContainer } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReportView } from "@/components/reports/engine/report-view";
import { getCatalogReport } from "@/lib/report-catalog";
import { getReport, reportMeta, resolveControls, sectionLabel } from "@/lib/report-engine/registry";
import { loadDataset, scopeDataset } from "@/lib/report-engine/dataset";
import { resolveRange } from "@/lib/report-engine/date-range";

export const dynamic = "force-dynamic"; // reports always reflect live data (§72 freshness)

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const r = getReport(slug) ?? getCatalogReport(slug);
  return { title: r ? r.name : "Report" };
}

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]?.[0] : sp[k]) as string | undefined;

  // Live engine report (§49–§73).
  const def = getReport(slug);
  if (def) {
    const full = await loadDataset();
    const scope = def.dateScope ?? "activity";
    const range = scope === "none" ? undefined : resolveRange(one("range"), one("from"), one("to"), full.now);
    const ds = range && scope === "activity" ? scopeDataset(full, range.from, range.to) : full;

    const controls = resolveControls(def, full);
    const values = Object.fromEntries(controls.map((c) => [c.key, one(c.key) ?? c.default]));
    const result = def.load(ds, { subjectId: one("subject"), range, params: values });

    return (
      <ReportView
        meta={reportMeta(def)}
        section={sectionLabel(def.section)}
        result={result}
        refreshedAt={full.now.toISOString()}
        filters={{
          dateEnabled: scope !== "none",
          dateBasis: def.dateBasis ?? (scope === "activity" ? "Records created or active in the range" : undefined),
          range: one("range") ?? "all",
          from: one("from") ?? "",
          to: one("to") ?? "",
          rangeLabel: range?.label ?? null,
          controls,
          values,
        }}
      />
    );
  }

  // Legacy catalog entry not yet built.
  const report = getCatalogReport(slug);
  if (!report) notFound();

  return (
    <PageContainer>
      <Button variant="ghost" size="sm" className="-ml-2" nativeButton={false} render={<Link href="/reports" />}>
        <ArrowLeft className="size-4" /> Reports
      </Button>

      <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-dashed p-8 text-center sm:p-12">
        <span className="bg-muted text-muted-foreground mx-auto flex size-14 items-center justify-center rounded-2xl">
          <Construction className="size-7" />
        </span>
        <h1 className="text-page-title mt-5">{report.name}</h1>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <Badge variant="secondary">{report.category}</Badge>
          {report.hasSubReports && <Badge variant="outline">Has sub-reports</Badge>}
        </div>
        <p className="text-muted-foreground mx-auto mt-4 max-w-md text-sm leading-relaxed">
          This report is part of the catalog and will be built out individually.
          The placeholder reserves its place in the Reports area so navigation
          reflects the full catalog today.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button variant="outline" render={<Link href="/reports" />} nativeButton={false}>
            <BarChart3 className="size-4" /> Back to Reports
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
