import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BarChart3,
  DollarSign,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ReportCard = {
  id: string;
  title: string;
  description: string;
  icon: typeof BarChart3;
  href?: string;
  spec: string;
  roadmap?: string;
};

const REPORTS: ReportCard[] = [
  {
    id: "financial",
    title: "Financial performance",
    description:
      "Revenue, margin and cost-per-onboarding — historical trends and period-over-period comparison.",
    icon: DollarSign,
    href: "/reports/financial",
    spec: "§67.4",
  },
  {
    id: "specialty",
    title: "Skills & specialty strengths",
    description:
      "Where we win: top skills placed, success rates, time-to-fill, and geographical strength.",
    icon: GraduationCap,
    href: "/reports/specialty",
    spec: "§49",
  },
  {
    id: "operational",
    title: "Operational health",
    description: "SLA, exceptions, vendor turnaround, and throughput.",
    icon: TrendingUp,
    spec: "§34.6",
    roadmap: "v0.7.0",
  },
  {
    id: "workforce",
    title: "Workforce & experience",
    description: "Candidate, consultant and client satisfaction and effort.",
    icon: Users,
    spec: "§67.5",
    roadmap: "v0.7.0",
  },
  {
    id: "compliance",
    title: "Compliance & screening",
    description: "Readiness, expirations, adjudication and audit packets.",
    icon: ShieldCheck,
    spec: "§57",
    roadmap: "v0.7.0",
  },
  {
    id: "ai",
    title: "AI & automation",
    description: "Recommendation accuracy, automation coverage, AI cost.",
    icon: Sparkles,
    spec: "§64",
    roadmap: "v0.9.0",
  },
];

export const metadata: Metadata = { title: "Reports" };

function Card({ r }: { r: ReportCard }) {
  const live = !!r.href;
  const inner = (
    <div
      className={cn(
        "bg-card flex h-full flex-col gap-3 rounded-xl border p-4 shadow-xs transition-colors",
        live ? "hover:border-primary/40" : "opacity-70",
      )}
    >
      <div className="flex items-start justify-between">
        <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
          <r.icon className="size-4.5" />
        </span>
        {live ? (
          <ArrowRight className="text-muted-foreground size-4" />
        ) : (
          <Badge variant="secondary" className="text-[10px]">
            {r.roadmap}
          </Badge>
        )}
      </div>
      <div>
        <p className="text-card-heading">{r.title}</p>
        <p className="text-muted-foreground mt-1 text-sm">{r.description}</p>
      </div>
      <span className="text-metadata mt-auto">Spec {r.spec}</span>
    </div>
  );
  return live ? (
    <Link href={r.href!} className="focus-visible:ring-ring rounded-xl focus-visible:ring-2 focus-visible:outline-none">
      {inner}
    </Link>
  ) : (
    inner
  );
}

export default function ReportsHubPage() {
  return (
    <PageContainer className="flex flex-col gap-6">
      <PageHeader
        title="Reports"
        description="Enterprise reporting catalog — financial, specialty, operational, and more."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((r) => (
          <Card key={r.id} r={r} />
        ))}
      </div>
    </PageContainer>
  );
}
