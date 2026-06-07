import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Compass, Sparkles } from "lucide-react";
import { PageContainer } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getNavItem, PERSONAS } from "@/lib/nav";

type Planned = {
  label: string;
  spec?: string;
  roadmap?: string;
  description: string;
};

function resolve(module: string): Planned {
  const nav = getNavItem(module);
  if (nav) {
    return {
      label: nav.label,
      spec: nav.spec,
      roadmap: nav.roadmap,
      description: nav.description,
    };
  }
  const persona = PERSONAS.find((p) => p.id === module);
  if (persona) {
    return {
      label: `${persona.label} — ${persona.workspace}`,
      roadmap: persona.roadmap,
      description: persona.description,
    };
  }
  return {
    label: "Coming soon",
    description: "This area of the platform is on the roadmap.",
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ module: string }>;
}): Promise<Metadata> {
  const { module } = await params;
  return { title: resolve(module).label };
}

export default async function PlannedPage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = await params;
  const info = resolve(module);

  return (
    <PageContainer>
      <div className="mx-auto max-w-2xl">
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/command-center" />}
        >
          <ArrowLeft className="size-4" /> Command Center
        </Button>

        <div className="mt-6 rounded-2xl border border-dashed p-8 text-center sm:p-12">
          <span className="bg-ai-muted text-ai-muted-foreground mx-auto flex size-14 items-center justify-center rounded-2xl">
            <Compass className="size-7" />
          </span>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <h1 className="text-page-title">{info.label}</h1>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            {info.roadmap && (
              <Badge variant="secondary">Planned · {info.roadmap}</Badge>
            )}
            {info.spec && <Badge variant="outline">Spec {info.spec}</Badge>}
          </div>
          <p className="text-muted-foreground mx-auto mt-4 max-w-md text-sm leading-relaxed">
            {info.description}
          </p>
          <p className="text-muted-foreground mx-auto mt-3 flex items-center justify-center gap-1.5 text-xs">
            <Sparkles className="size-3.5" />
            This module is scheduled in a later version. See the roadmap for
            sequencing.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button variant="outline" render={<Link href="/command-center" />}>
              Back to Command Center
            </Button>
            <Button variant="ghost" render={<Link href="/portal" />}>
              View Candidate Portal
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
