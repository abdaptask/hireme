import { InboxIcon } from "lucide-react";

/**
 * Neutral empty state for a 360 record tab when the underlying data is
 * legitimately empty (the feature is built, this specific person just has
 * no records of that kind). Distinct from <Placeholder /> which signals
 * "module coming in v0.X" — that message is misleading once a module ships.
 */
export function EmptyRecord({ message }: { message: string }) {
  return (
    <div className="text-muted-foreground flex flex-col items-center justify-center rounded-xl border border-dashed py-10 text-center text-sm">
      <InboxIcon className="mb-2 size-5 opacity-60" />
      <p>{message}</p>
    </div>
  );
}
