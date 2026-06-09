import { Info } from "lucide-react";

/**
 * Standard "demo data" banner shown across every EEOC report (§57, §66).
 * EEO Self-ID demographic capture is a planned onboarding module — until it
 * lands these reports synthesize demographics from a deterministic hash so
 * the visual contract stays stable.
 */
export function EeoDemoNotice() {
  return (
    <div className="bg-warning/10 border-warning/30 flex items-start gap-2.5 rounded-xl border p-3">
      <span className="bg-warning/20 text-warning-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-md">
        <Info className="size-4" />
      </span>
      <div className="min-w-0 text-sm leading-snug">
        <p className="font-medium">Demo data — EEO Self-ID fields are mocked.</p>
        <p className="text-muted-foreground mt-0.5">
          Real demographic capture requires the EEO Self-ID form module
          (planned). All race / ethnicity / sex / veteran counts here are
          synthesized from a deterministic hash of existing records so the
          report structure can be reviewed today.
        </p>
      </div>
    </div>
  );
}
