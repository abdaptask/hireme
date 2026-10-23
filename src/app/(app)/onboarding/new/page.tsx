import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { NhrFormView } from "@/components/onboarding/nhr-form";
import { nhrOptions } from "@/lib/onboarding/service";
import { staffActor, viewerRole } from "@/lib/onboarding/session";
import { can } from "@/lib/onboarding/permissions";
import { getRole } from "@/lib/roles";

export const metadata: Metadata = { title: "New Hire Request" };
export const dynamic = "force-dynamic";

export default async function NewHireRequestPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const role = await viewerRole();

  // Onboarding is started by the Recruiting Manager (§5, §25).
  if (!can(role, "initiate")) {
    return (
      <PageContainer>
        <div className="mx-auto mt-10 max-w-lg rounded-2xl border p-8 text-center shadow-xs">
          <span className="bg-warning-muted text-warning-muted-foreground mx-auto flex size-12 items-center justify-center rounded-xl">
            <Lock className="size-6" />
          </span>
          <h1 className="text-section-heading mt-4">New hire requests come from the Recruiting Manager</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            You&apos;re signed in as <strong className="text-foreground">{getRole(role).label}</strong>. Once a Recruiting Manager submits the NHR, the
            onboarding case appears in your queue.
          </p>
          <Button className="mt-6" variant="outline" nativeButton={false} render={<Link href="/candidates" />}>
            <ArrowLeft className="size-4" /> Candidates
          </Button>
        </div>
      </PageContainer>
    );
  }

  const [options, actor] = await Promise.all([nhrOptions(), staffActor()]);
  const defaultManager = role === "recruiting-manager" && actor ? actor.name : "";

  return (
    <PageContainer className="flex flex-col gap-4">
      <Button variant="ghost" size="sm" className="-ml-2 self-start" nativeButton={false} render={<Link href="/candidates" />}>
        <ArrowLeft className="size-4" /> Candidates
      </Button>
      <PageHeader
        title="New Hire Request"
        description="Submitting the NHR creates the candidate, generates their onboarding checklist from client rules, and hands the case to an onboarder."
      />
      <NhrFormView
        options={options}
        defaultManager={defaultManager}
        prefill={{
          firstName: sp.first ?? "",
          lastName: sp.last ?? "",
          email: sp.email ?? "",
          cellPhone: sp.phone ?? "",
          client: options.clients.some((c) => c.name === sp.client) ? (sp.client ?? "") : "",
          jobTitle: sp.job ?? "",
        }}
      />
    </PageContainer>
  );
}
