"use client";

/**
 * Thin client wrapper that brings the InitiateOnboardingSheet trigger
 * into the server-rendered Candidate 360 page (§100, §9).
 */

import { InitiateOnboardingSheet } from "@/components/onboarding/initiate-sheet";
import type { InitiateOnboardingPrefill } from "@/components/onboarding/initiate-sheet";

export function InitiateOnboardingButton({
  prefill,
}: {
  prefill: InitiateOnboardingPrefill;
}) {
  return <InitiateOnboardingSheet prefill={prefill} />;
}
