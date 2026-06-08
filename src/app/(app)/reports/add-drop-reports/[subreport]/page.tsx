import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SubReportView, SUB_REPORT_CONFIG } from "./view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subreport: string }>;
}): Promise<Metadata> {
  const { subreport } = await params;
  const cfg = SUB_REPORT_CONFIG[subreport];
  return { title: cfg ? `Add Drop · ${cfg.title}` : "Add Drop Sub-report" };
}

export default async function AddDropSubReportPage({
  params,
}: {
  params: Promise<{ subreport: string }>;
}) {
  const { subreport } = await params;
  const cfg = SUB_REPORT_CONFIG[subreport];
  if (!cfg) notFound();

  return <SubReportView slug={subreport} />;
}
