"use client";

/**
 * Entry point to start onboarding (§9 step 1). Opens the full-page New Hire
 * Request form; prefill carries known candidate details. Shown only to roles
 * that may start onboarding — the Recruiting Manager (and Super Admin).
 *
 * Usage:
 *   <InitiateOnboardingSheet />
 *   <InitiateOnboardingSheet prefill={{ firstName: "James", client: "Apex Dynamics" }} />
 */

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEntitlements } from "@/components/providers/entitlements-provider";
import { can } from "@/lib/onboarding/permissions";
import type { OnboardingFormData } from "@/lib/onboarding-form";

export type InitiateOnboardingPrefill = Partial<Pick<OnboardingFormData, "firstName" | "lastName" | "candidateEmail" | "mobile" | "employmentType" | "client" | "jobTitle">>;

export function InitiateOnboardingSheet({ prefill, variant = "button" }: { prefill?: InitiateOnboardingPrefill; /** "link" = compact text action for table rows. */ variant?: "button" | "link" }) {
  const { viewAs } = useEntitlements();
  if (!can(viewAs, "initiate")) return null;

  const q = new URLSearchParams();
  const add = (k: string, v?: string) => v && q.set(k, v);
  add("first", prefill?.firstName);
  add("last", prefill?.lastName);
  add("email", prefill?.candidateEmail);
  add("phone", prefill?.mobile);
  add("client", prefill?.client);
  add("job", prefill?.jobTitle);
  const qs = q.toString();
  const href = `/onboarding/new${qs ? `?${qs}` : ""}`;

  if (variant === "link") {
    return (
      <Link href={href} onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-primary text-xs transition-colors">
        Start NHR
      </Link>
    );
  }

  return (
    <Button size="sm" className="gap-1.5" nativeButton={false} render={<Link href={href} />}>
      <Plus className="size-3.5" />
      New Hire Request
    </Button>
  );
}
