import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatTone = "default" | "success" | "warning" | "danger" | "info" | "ai";

const TONE: Record<StatTone, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-success-muted text-success-muted-foreground",
  warning: "bg-warning-muted text-warning-muted-foreground",
  danger: "bg-danger-muted text-danger-muted-foreground",
  info: "bg-info-muted text-info-muted-foreground",
  ai: "bg-ai-muted text-ai-muted-foreground",
};

/** Compact KPI tile shared across persona workspaces. */
export function StatTile({
  icon: Icon,
  label,
  value,
  tone = "default",
  suffix,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone?: StatTone;
  suffix?: string;
}) {
  return (
    <div className="bg-card flex items-center gap-3 rounded-xl border p-3.5 shadow-xs">
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", TONE[tone])}>
        <Icon className="size-4.5" />
      </span>
      <div className="min-w-0">
        <p className="text-xl font-semibold tabular-nums">
          {value}
          {suffix && (
            <span className="text-muted-foreground ml-1 text-sm font-normal">
              {suffix}
            </span>
          )}
        </p>
        <p className="text-metadata leading-tight">{label}</p>
      </div>
    </div>
  );
}
