import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, BarChart3, Construction } from "lucide-react";
import { PageContainer } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCatalogReport } from "@/lib/report-catalog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const r = getCatalogReport(slug);
  return { title: r ? r.name : "Report" };
}

export default async function ReportPlaceholderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
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
