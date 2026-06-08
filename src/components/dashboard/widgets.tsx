import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { StatusDot } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import type { StatusTone } from "@/lib/types";

/** Card shell for dashboard widgets (§98 premium dashboard architecture). */
export function WidgetCard({
  title,
  description,
  action,
  className,
  children,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "bg-card flex flex-col rounded-xl border shadow-xs",
        className,
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
          <div className="min-w-0">
            {title && <h2 className="text-card-heading truncate">{title}</h2>}
            {description && (
              <p className="text-metadata truncate">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      <div className="flex-1 p-4">{children}</div>
    </section>
  );
}

const toneText: Record<StatusTone, string> = {
  success: "text-success-muted-foreground",
  warning: "text-warning-muted-foreground",
  danger: "text-danger-muted-foreground",
  info: "text-info-muted-foreground",
  ai: "text-ai-muted-foreground",
  neutral: "text-muted-foreground",
};

const toneBar: Record<StatusTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  ai: "bg-ai",
  neutral: "bg-neutral",
};

/** A single operational vital (§7.1) with click-through. */
export function StatCard({
  label,
  value,
  delta,
  goodDirection,
  tone,
  href,
}: {
  label: string;
  value: number;
  delta: number;
  goodDirection: "up" | "down";
  tone: StatusTone;
  href: string;
}) {
  const isFlat = delta === 0;
  const isGood = goodDirection === "up" ? delta > 0 : delta < 0;
  const DeltaIcon = isFlat ? ArrowRight : delta > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <Link
      href={href}
      className="bg-card hover:border-primary/40 group focus-visible:ring-ring relative flex flex-col gap-2 rounded-xl border p-3.5 shadow-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-data-label leading-tight">{label}</span>
        <StatusDot tone={tone} className="mt-0.5" />
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-2xl font-semibold tabular-nums tracking-tight">
          {value}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
            isFlat
              ? "text-muted-foreground"
              : isGood
                ? "text-success-muted-foreground"
                : "text-danger-muted-foreground",
          )}
        >
          <DeltaIcon className="size-3.5" />
          {isFlat ? "0" : Math.abs(delta)}
        </span>
      </div>
    </Link>
  );
}

/** Compact operations tile (§7 third row). */
export function OpsTileCard({
  label,
  value,
  tone,
  href,
}: {
  label: string;
  value: number;
  tone: StatusTone;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="bg-card hover:border-primary/40 focus-visible:ring-ring flex items-center gap-3 rounded-lg border p-3 shadow-xs transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <span className={cn("text-xl font-semibold tabular-nums", toneText[tone])}>
        {value}
      </span>
      <span className="text-sm leading-tight font-medium">{label}</span>
    </Link>
  );
}

/** Horizontal ranked bar list (§34.3 / §7.2). */
export function BarList({
  rows,
  tone = "info",
  formatValue,
  onRowClick,
}: {
  rows: { name: string; value: number; unit?: string; tone?: StatusTone }[];
  tone?: StatusTone;
  formatValue?: (v: number, unit?: string) => string;
  /** When provided, each row becomes a clickable drill-down trigger (§7.1). */
  onRowClick?: (name: string) => void;
}) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((r) => {
        const content = (
          <>
            <span className="w-32 shrink-0 truncate text-left text-sm">
              {r.name}
            </span>
            <div className="bg-muted relative h-2 flex-1 overflow-hidden rounded-full">
              <span
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full",
                  toneBar[r.tone ?? tone],
                )}
                style={{ width: `${Math.max((r.value / max) * 100, 4)}%` }}
              />
            </div>
            <span className="text-muted-foreground w-12 shrink-0 text-right text-xs tabular-nums">
              {formatValue
                ? formatValue(r.value, r.unit)
                : `${r.value}${r.unit ?? ""}`}
            </span>
          </>
        );
        return (
          <li key={r.name}>
            {onRowClick ? (
              <button
                type="button"
                onClick={() => onRowClick(r.name)}
                className="hover:bg-muted/50 focus-visible:ring-ring -mx-1.5 flex w-[calc(100%+0.75rem)] cursor-pointer items-center gap-3 rounded-md px-1.5 py-1 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
                aria-label={`Drill into ${r.name}`}
              >
                {content}
              </button>
            ) : (
              <div className="flex items-center gap-3">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Minimal CSS bar sparkline for trends (no chart dependency in v0.1). */
export function MiniBars({
  data,
  tone = "info",
}: {
  data: number[];
  tone?: StatusTone;
}) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex h-12 items-end gap-1">
      {data.map((v, i) => (
        <div
          key={i}
          className={cn("flex-1 rounded-sm", toneBar[tone], "opacity-70")}
          style={{ height: `${Math.max((v / max) * 100, 8)}%` }}
        />
      ))}
    </div>
  );
}
