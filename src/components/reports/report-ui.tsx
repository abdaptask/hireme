"use client";

/* ---------------------------------------------------------------------------
   Shared filter controls for back-office reports (§50.3 global filters).
   KPI tiles use the canonical `StatTile` from @/components/workspace/stat-tile.
   --------------------------------------------------------------------------- */

/** Row of filter controls (§50.3). */
export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <section className="bg-card flex flex-wrap items-end gap-3 rounded-xl border p-3 shadow-xs">
      {children}
    </section>
  );
}

/** A labelled native select for filtering. */
export function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[] | string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-background hover:bg-muted h-8 min-w-36 rounded-md border px-2 text-sm"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Search input for tables (§109 universal search). */
export function FilterSearch({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-background hover:bg-muted h-8 min-w-48 rounded-md border px-2 text-sm"
      />
    </label>
  );
}

/** Format a number as USD with thousands separators. */
export function formatUsdValue(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

/** Format a number compactly (e.g. $1.6M, $487K). */
export function formatUsdCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}
