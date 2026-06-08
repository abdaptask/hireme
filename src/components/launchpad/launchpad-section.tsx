/**
 * Persona Launchpad section — a thin wrapper that pairs the launchpad title
 * block with the icon grid, designed to drop in at the top of any persona
 * workspace page (next to or above the existing `PageHeader`).
 */

import type { LaunchpadConfig } from "@/lib/launchpad";
import { cn } from "@/lib/utils";
import { LaunchpadGrid } from "./launchpad-grid";

export function LaunchpadSection({
  config,
  badgeCounts,
  className,
}: {
  config: LaunchpadConfig;
  badgeCounts?: Record<string, number>;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col gap-3", className)} aria-label={config.title}>
      <div className="min-w-0">
        <h2 className="text-section-heading">{config.title}</h2>
        <p className="text-muted-foreground mt-0.5 text-sm">{config.subtitle}</p>
      </div>
      <LaunchpadGrid config={config} badgeCounts={badgeCounts} />
    </section>
  );
}
