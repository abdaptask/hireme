"use client";

import { useState } from "react";
import {
  BarChart3,
  LineChart,
  PieChart,
  Table2,
  Filter,
  ArrowUpDown,
  Save,
  Share2,
  Download,
  ChevronDown,
  Check,
  Plus,
  Search,
  TrendingUp,
  LayoutGrid,
  Eye,
  EyeOff,
  X,
  Funnel,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type VizType = "table" | "bar" | "line" | "pie" | "funnel" | "kpi";

type DataSource =
  | "candidates"
  | "consultants"
  | "clients"
  | "packages"
  | "exceptions"
  | "screening"
  | "training"
  | "integrations"
  | "audit";

const DATA_SOURCES: { id: DataSource; label: string }[] = [
  { id: "candidates", label: "Candidates" },
  { id: "consultants", label: "Consultants" },
  { id: "clients", label: "Clients" },
  { id: "packages", label: "Packages" },
  { id: "exceptions", label: "Exceptions" },
  { id: "screening", label: "Screening" },
  { id: "training", label: "Training" },
  { id: "integrations", label: "Integrations" },
  { id: "audit", label: "Audit Events" },
];

const SOURCE_FIELDS: Partial<Record<DataSource, string[]>> = {
  candidates: [
    "Name",
    "Status",
    "Stage",
    "Client",
    "Start Date",
    "Risk Level",
    "Progress %",
    "Employment Type",
    "Recruiter",
    "Onboarder",
    "Days in Stage",
    "Completion Rate",
  ],
  exceptions: [
    "Category",
    "Severity",
    "Status",
    "Owner",
    "Age (days)",
    "Client",
    "Start Date Impact",
    "Root Cause",
  ],
};

// ---------------------------------------------------------------------------
// Mock preview data per source
// ---------------------------------------------------------------------------

const PREVIEW_ROWS: Partial<Record<DataSource, Record<string, string>[]>> = {
  candidates: [
    { Name: "Priya Mehta", Status: "Active", Stage: "Document Review", Client: "Accenture", "Start Date": "Jun 16 2026", "Risk Level": "Low", "Progress %": "72%", "Employment Type": "W-2", Recruiter: "Jordan Lee", Onboarder: "Sam Torres", "Days in Stage": "2", "Completion Rate": "72%" },
    { Name: "Carlos Reyes", Status: "Active", Stage: "Background Check", Client: "TechCorp", "Start Date": "Jun 20 2026", "Risk Level": "Medium", "Progress %": "55%", "Employment Type": "C2C", Recruiter: "Alex Kim", Onboarder: "Sam Torres", "Days in Stage": "5", "Completion Rate": "55%" },
    { Name: "Dana Walsh", Status: "At Risk", Stage: "Tax & Payroll", Client: "Vertex", "Start Date": "Jun 14 2026", "Risk Level": "High", "Progress %": "40%", "Employment Type": "1099", Recruiter: "Morgan Chase", Onboarder: "Riley Park", "Days in Stage": "8", "Completion Rate": "40%" },
    { Name: "Tomás Vega", Status: "Active", Stage: "Client Requirements", Client: "Nexus Group", "Start Date": "Jun 23 2026", "Risk Level": "Low", "Progress %": "88%", "Employment Type": "W-2", Recruiter: "Jordan Lee", Onboarder: "Riley Park", "Days in Stage": "1", "Completion Rate": "88%" },
    { Name: "Aisha Nkrumah", Status: "Active", Stage: "Profile Setup", Client: "Meridian LLC", "Start Date": "Jun 30 2026", "Risk Level": "Low", "Progress %": "20%", "Employment Type": "W-2", Recruiter: "Taylor Brooks", Onboarder: "Sam Torres", "Days in Stage": "0", "Completion Rate": "20%" },
    { Name: "David Park", Status: "Needs Attention", Stage: "IT Provisioning", Client: "IntelliSys", "Start Date": "Jun 13 2026", "Risk Level": "High", "Progress %": "91%", "Employment Type": "C2C", Recruiter: "Alex Kim", Onboarder: "Riley Park", "Days in Stage": "3", "Completion Rate": "91%" },
  ],
  exceptions: [
    { Category: "Missing Document", Severity: "High", Status: "Open", Owner: "Sam Torres", "Age (days)": "3", Client: "Accenture", "Start Date Impact": "Jun 16 2026", "Root Cause": "Candidate Unresponsive" },
    { Category: "Background Check Delay", Severity: "Medium", Status: "In Progress", Owner: "Riley Park", "Age (days)": "5", Client: "TechCorp", "Start Date Impact": "Jun 20 2026", "Root Cause": "Vendor Delay" },
    { Category: "Invalid Bank Info", Severity: "High", Status: "Open", Owner: "Sam Torres", "Age (days)": "1", Client: "Vertex", "Start Date Impact": "Jun 14 2026", "Root Cause": "Data Entry Error" },
    { Category: "Duplicate Profile", Severity: "Low", Status: "Resolved", Owner: "Riley Park", "Age (days)": "0", Client: "Nexus Group", "Start Date Impact": "Jun 23 2026", "Root Cause": "ATS Sync" },
    { Category: "Expired ID", Severity: "Critical", Status: "Open", Owner: "Jordan Lee", "Age (days)": "7", Client: "Meridian LLC", "Start Date Impact": "Jun 30 2026", "Root Cause": "ID Expired" },
  ],
};

// ---------------------------------------------------------------------------
// Colour scheme presets
// ---------------------------------------------------------------------------

const COLOR_SCHEMES = [
  { id: "blue", label: "Ocean", colors: ["#3b82f6", "#60a5fa", "#93c5fd", "#dbeafe"] },
  { id: "green", label: "Forest", colors: ["#22c55e", "#4ade80", "#86efac", "#dcfce7"] },
  { id: "violet", label: "Iris", colors: ["#8b5cf6", "#a78bfa", "#c4b5fd", "#ede9fe"] },
  { id: "amber", label: "Ember", colors: ["#f59e0b", "#fbbf24", "#fcd34d", "#fef3c7"] },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PanelHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </div>
  );
}

function FieldItem({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      onClick={onToggle}
      className={cn(
        "flex cursor-pointer items-center gap-2 px-4 py-2 text-sm transition-colors",
        selected
          ? "border-l-2 border-primary bg-primary/5 text-foreground"
          : "hover:bg-muted/50 text-foreground/80",
      )}
    >
      <div
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded border",
          selected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border",
        )}
      >
        {selected && <Check className="size-3" />}
      </div>
      <span className="flex-1 truncate">{label}</span>
    </div>
  );
}

function VizButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        "flex flex-col items-center gap-1 rounded-lg border p-2.5 text-xs transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border hover:bg-muted text-muted-foreground",
      )}
    >
      <Icon className="size-4" />
      <span className="hidden sm:block">{label}</span>
    </button>
  );
}

function StatusBadge({ value }: { value: string }) {
  const map: Record<string, string> = {
    Active: "bg-success/10 text-success-muted-foreground",
    "At Risk": "bg-danger/10 text-danger-muted-foreground",
    "Needs Attention": "bg-warning/10 text-warning-muted-foreground",
    Open: "bg-danger/10 text-danger-muted-foreground",
    "In Progress": "bg-info/10 text-info-muted-foreground",
    Resolved: "bg-success/10 text-success-muted-foreground",
    High: "bg-danger/10 text-danger-muted-foreground",
    Medium: "bg-warning/10 text-warning-muted-foreground",
    Low: "bg-success/10 text-success-muted-foreground",
    Critical: "bg-danger/20 text-danger-muted-foreground font-semibold",
  };
  const cls = map[value];
  if (!cls) return <span>{value}</span>;
  return (
    <span className={cn("rounded-md px-1.5 py-0.5 text-xs font-medium", cls)}>
      {value}
    </span>
  );
}

const STATUS_COLUMNS = new Set(["Status", "Risk Level", "Severity", "Start Date Impact"]);

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ReportBuilderPage() {
  const [reportName, setReportName] = useState("Untitled Report");
  const [editingName, setEditingName] = useState(false);
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [vizType, setVizType] = useState<VizType>("table");
  const [previewMode, setPreviewMode] = useState(false);
  const [fieldSearch, setFieldSearch] = useState("");
  const [colorScheme, setColorScheme] = useState("blue");
  const [showLegend, setShowLegend] = useState(true);
  const [showDataLabels, setShowDataLabels] = useState(false);
  const [accessLevel, setAccessLevel] = useState<"me" | "team" | "everyone">("me");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [groupBy, setGroupBy] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filters, setFilters] = useState([
    { id: "1", field: "Status", op: "=", value: "Active" },
    { id: "2", field: "Start Date", op: "=", value: "Last 30 days" },
  ]);
  const [description, setDescription] = useState("");

  const availableFields = selectedSource
    ? (SOURCE_FIELDS[selectedSource] ?? null)
    : null;

  const filteredFields = availableFields
    ? availableFields.filter((f) =>
        f.toLowerCase().includes(fieldSearch.toLowerCase()),
      )
    : [];

  const previewRows =
    selectedSource && PREVIEW_ROWS[selectedSource]
      ? PREVIEW_ROWS[selectedSource]!
      : [];

  const displayCols =
    selectedFields.length > 0
      ? selectedFields
      : selectedSource && SOURCE_FIELDS[selectedSource]
      ? SOURCE_FIELDS[selectedSource]!.slice(0, 5)
      : [];

  function toggleField(field: string) {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field],
    );
  }

  function removeFilter(id: string) {
    setFilters((prev) => prev.filter((f) => f.id !== id));
  }

  function addFilter() {
    const newId = String(Date.now());
    setFilters((prev) => [
      ...prev,
      { id: newId, field: displayCols[0] ?? "Status", op: "=", value: "" },
    ]);
  }

  const VIZ_OPTIONS: { id: VizType; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
    { id: "table", icon: Table2, label: "Table" },
    { id: "bar", icon: BarChart3, label: "Bar" },
    { id: "line", icon: LineChart, label: "Line" },
    { id: "pie", icon: PieChart, label: "Pie" },
    { id: "funnel", icon: Funnel, label: "Funnel" },
    { id: "kpi", icon: LayoutGrid, label: "KPI" },
  ];

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden">
      {/* ------------------------------------------------------------------ */}
      {/* Builder header */}
      {/* ------------------------------------------------------------------ */}
      <header className="flex shrink-0 items-center gap-3 border-b bg-background px-4 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="text-muted-foreground text-sm">Report Builder</span>
          <span className="text-muted-foreground/50">/</span>
          {editingName ? (
            <input
              autoFocus
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
              className="min-w-0 rounded border-0 bg-muted/50 px-2 py-0.5 text-sm font-medium outline-none ring-1 ring-primary/50"
            />
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="rounded px-1 text-sm font-medium hover:bg-muted/60"
            >
              {reportName}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPreviewMode((p) => !p)}
            className="gap-1.5"
          >
            {previewMode ? (
              <>
                <EyeOff className="size-4" /> Edit
              </>
            ) : (
              <>
                <Eye className="size-4" /> Preview
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Share2 className="size-4" /> Share
          </Button>
          <Button size="sm" className="gap-1.5">
            <Save className="size-4" /> Save
          </Button>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Three-panel body */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* ---------------------------------------------------------------- */}
        {/* LEFT: Data source + fields */}
        {/* ---------------------------------------------------------------- */}
        {!previewMode && (
          <aside className="flex w-64 shrink-0 flex-col overflow-y-auto border-r bg-background">
            <PanelHeader>Data Source</PanelHeader>

            <div className="flex flex-col gap-0.5 p-2">
              {DATA_SOURCES.map((ds) => (
                <button
                  key={ds.id}
                  onClick={() => {
                    setSelectedSource(ds.id);
                    setSelectedFields([]);
                    setFieldSearch("");
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm transition-colors",
                    selectedSource === ds.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted/60 text-foreground/80",
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      selectedSource === ds.id ? "bg-primary" : "bg-muted-foreground/40",
                    )}
                  />
                  {ds.label}
                </button>
              ))}
            </div>

            {selectedSource && (
              <>
                <div className="mt-1 border-t" />
                <PanelHeader>
                  Fields{" "}
                  {selectedFields.length > 0 && (
                    <span className="ml-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary normal-case tracking-normal">
                      {selectedFields.length} selected
                    </span>
                  )}
                </PanelHeader>

                {availableFields ? (
                  <>
                    <div className="border-b px-3 py-2">
                      <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-2 py-1">
                        <Search className="size-3.5 shrink-0 text-muted-foreground" />
                        <input
                          value={fieldSearch}
                          onChange={(e) => setFieldSearch(e.target.value)}
                          placeholder="Search fields…"
                          className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      {filteredFields.length === 0 ? (
                        <p className="px-4 py-3 text-xs text-muted-foreground">
                          No fields match "{fieldSearch}"
                        </p>
                      ) : (
                        filteredFields.map((field) => (
                          <FieldItem
                            key={field}
                            label={field}
                            selected={selectedFields.includes(field)}
                            onToggle={() => toggleField(field)}
                          />
                        ))
                      )}
                    </div>
                    {selectedFields.length > 0 && (
                      <div className="border-t p-2">
                        <button
                          onClick={() => setSelectedFields([])}
                          className="text-muted-foreground hover:text-foreground w-full rounded-md px-3 py-1 text-left text-xs transition-colors hover:bg-muted/60"
                        >
                          Clear selection
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="px-4 py-4 text-xs text-muted-foreground">
                    Select a source to see fields.
                  </p>
                )}
              </>
            )}

            {!selectedSource && (
              <p className="px-4 py-4 text-xs text-muted-foreground">
                Choose a data source to begin building your report.
              </p>
            )}
          </aside>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* CENTER: Canvas */}
        {/* ---------------------------------------------------------------- */}
        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-muted/20">
          {/* Viz type selector */}
          {!previewMode && (
            <div className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background px-4 py-2.5">
              <span className="text-xs font-medium text-muted-foreground mr-1">
                Visualization
              </span>
              <div className="flex items-center gap-1.5">
                {VIZ_OPTIONS.map(({ id, icon, label }) => (
                  <VizButton
                    key={id}
                    icon={icon}
                    label={label}
                    active={vizType === id}
                    onClick={() => setVizType(id)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 p-4 sm:p-6">
            {/* No source selected */}
            {!selectedSource && !previewMode && (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed py-20">
                <div className="text-center">
                  <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
                    <Table2 className="size-5 text-muted-foreground" />
                  </div>
                  <p className="text-section-heading">Start with a data source</p>
                  <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                    Select a source from the left panel, choose fields, and your
                    report preview will appear here.
                  </p>
                </div>
              </div>
            )}

            {/* Table preview */}
            {selectedSource && (vizType === "table" || previewMode) && (
              <div className="bg-card overflow-hidden rounded-xl border shadow-xs">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">{reportName}</p>
                    {description && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {previewRows.length} rows · Live preview
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table
                    className="w-full border-collapse text-left"
                    style={{ fontSize: "var(--table-font)" }}
                  >
                    <thead>
                      <tr className="border-b bg-muted/30">
                        {displayCols.map((col) => (
                          <th
                            key={col}
                            className="text-muted-foreground px-3 py-2.5 font-medium whitespace-nowrap"
                          >
                            <span className="flex items-center gap-1">
                              {col}
                              <ArrowUpDown className="size-3 opacity-50" />
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={displayCols.length || 1}
                            className="px-3 py-6 text-center text-sm text-muted-foreground"
                          >
                            No preview data for this source yet.
                          </td>
                        </tr>
                      ) : (
                        previewRows.map((row, ri) => (
                          <tr
                            key={ri}
                            className="hover:bg-muted/40 border-b last:border-0"
                          >
                            {displayCols.map((col) => (
                              <td
                                key={col}
                                className="px-3 py-2 whitespace-nowrap"
                              >
                                {STATUS_COLUMNS.has(col) ? (
                                  <StatusBadge value={row[col] ?? "—"} />
                                ) : (
                                  <span>{row[col] ?? "—"}</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="border-t px-3 py-2 text-xs text-muted-foreground">
                  Showing {Math.min(previewRows.length, 6)} of {previewRows.length} rows · Preview data
                </div>
              </div>
            )}

            {/* Bar chart placeholder */}
            {selectedSource && vizType === "bar" && !previewMode && (
              <div className="bg-card overflow-hidden rounded-xl border shadow-xs p-5">
                <p className="text-sm font-semibold mb-4">{reportName}</p>
                <div className="flex h-48 items-end gap-3 px-2">
                  {(previewRows.slice(0, 6)).map((row, i) => {
                    const heights = [65, 40, 85, 55, 75, 30];
                    const h = heights[i % heights.length];
                    const scheme = COLOR_SCHEMES.find((c) => c.id === colorScheme) ?? COLOR_SCHEMES[0];
                    return (
                      <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                        <div
                          className="w-full rounded-t-md transition-all"
                          style={{
                            height: `${h}%`,
                            background: scheme.colors[i % scheme.colors.length],
                          }}
                        />
                        <span className="truncate text-[10px] text-muted-foreground w-full text-center">
                          {row[displayCols[0]] ?? `Item ${i + 1}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {showLegend && (
                  <div className="mt-3 flex flex-wrap gap-3">
                    {(previewRows.slice(0, 4)).map((row, i) => {
                      const scheme = COLOR_SCHEMES.find((c) => c.id === colorScheme) ?? COLOR_SCHEMES[0];
                      return (
                        <span key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="size-2.5 rounded-sm" style={{ background: scheme.colors[i % scheme.colors.length] }} />
                          {row[displayCols[0]] ?? `Item ${i + 1}`}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Line chart placeholder */}
            {selectedSource && vizType === "line" && !previewMode && (
              <div className="bg-card overflow-hidden rounded-xl border shadow-xs p-5">
                <p className="text-sm font-semibold mb-4">{reportName}</p>
                <div className="relative h-48 border-b border-l px-2">
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 180" preserveAspectRatio="none">
                    {(() => {
                      const scheme = COLOR_SCHEMES.find((c) => c.id === colorScheme) ?? COLOR_SCHEMES[0];
                      const pts = [160, 95, 140, 60, 115, 80].map((y, i) => `${(i / 5) * 400},${y}`).join(" ");
                      return (
                        <>
                          <polyline points={pts} fill="none" stroke={scheme.colors[0]} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                          {[160, 95, 140, 60, 115, 80].map((y, i) => (
                            <circle key={i} cx={(i / 5) * 400} cy={y} r="4" fill={scheme.colors[0]} />
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                </div>
                <p className="mt-2 text-center text-xs text-muted-foreground">Trend · {displayCols[0] ?? "value"} over time</p>
              </div>
            )}

            {/* Pie chart placeholder */}
            {selectedSource && vizType === "pie" && !previewMode && (
              <div className="bg-card overflow-hidden rounded-xl border shadow-xs p-5">
                <p className="text-sm font-semibold mb-4">{reportName}</p>
                <div className="flex items-center gap-8">
                  <svg viewBox="0 0 100 100" className="size-40 shrink-0">
                    {(() => {
                      const scheme = COLOR_SCHEMES.find((c) => c.id === colorScheme) ?? COLOR_SCHEMES[0];
                      const slices = [35, 25, 20, 20];
                      let offset = 0;
                      return slices.map((pct, i) => {
                        const dash = (pct / 100) * Math.PI * 2 * 35;
                        const gap = (100 - pct) / 100 * Math.PI * 2 * 35;
                        const el = (
                          <circle
                            key={i}
                            cx="50" cy="50" r="35"
                            fill="transparent"
                            stroke={scheme.colors[i % scheme.colors.length]}
                            strokeWidth="30"
                            strokeDasharray={`${dash} ${gap}`}
                            strokeDashoffset={-offset}
                            style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
                          />
                        );
                        offset += dash;
                        return el;
                      });
                    })()}
                  </svg>
                  {showLegend && (
                    <div className="flex flex-col gap-2">
                      {(previewRows.slice(0, 4)).map((row, i) => {
                        const scheme = COLOR_SCHEMES.find((c) => c.id === colorScheme) ?? COLOR_SCHEMES[0];
                        return (
                          <span key={i} className="flex items-center gap-1.5 text-sm">
                            <span className="size-3 rounded-sm shrink-0" style={{ background: scheme.colors[i % scheme.colors.length] }} />
                            {row[displayCols[0]] ?? `Item ${i + 1}`}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Funnel placeholder */}
            {selectedSource && vizType === "funnel" && !previewMode && (
              <div className="bg-card overflow-hidden rounded-xl border shadow-xs p-5">
                <p className="text-sm font-semibold mb-4">{reportName}</p>
                <div className="flex flex-col items-center gap-1">
                  {[100, 78, 60, 45, 30].map((w, i) => {
                    const scheme = COLOR_SCHEMES.find((c) => c.id === colorScheme) ?? COLOR_SCHEMES[0];
                    const labels = ["Offer Accepted", "Onboarding Started", "Docs Submitted", "Client Approved", "Fully Onboarded"];
                    return (
                      <div key={i} className="flex w-full max-w-sm items-center gap-3">
                        <div
                          className="h-9 rounded-md flex items-center justify-center text-xs font-medium text-white transition-all"
                          style={{ width: `${w}%`, background: scheme.colors[Math.min(i, scheme.colors.length - 1)] }}
                        >
                          {w}%
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{labels[i]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* KPI Cards placeholder */}
            {selectedSource && vizType === "kpi" && !previewMode && (
              <div className="bg-card overflow-hidden rounded-xl border shadow-xs p-5">
                <p className="text-sm font-semibold mb-4">{reportName}</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    { label: "Total Records", value: "248", delta: "+12%", good: true },
                    { label: "Completion Rate", value: "74%", delta: "+3pp", good: true },
                    { label: "Avg. Days in Stage", value: "3.2", delta: "-0.8", good: true },
                    { label: "At Risk", value: "14", delta: "+2", good: false },
                    { label: "SLA Breaches", value: "6", delta: "-4", good: true },
                    { label: "Drop-offs", value: "9", delta: "+1", good: false },
                  ].map((kpi) => (
                    <div key={kpi.label} className="rounded-lg border bg-background p-3">
                      <p className="text-data-label">{kpi.label}</p>
                      <p className="mt-1 text-2xl font-semibold tabular-nums">{kpi.value}</p>
                      <p className={cn("mt-0.5 text-xs font-medium", kpi.good ? "text-success-muted-foreground" : "text-danger-muted-foreground")}>
                        {kpi.delta} vs last period
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom toolbar */}
          <div className="sticky bottom-0 flex items-center gap-2 border-t bg-background px-4 py-2.5">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Save className="size-4" /> Save draft
            </Button>
            <div className="flex items-center rounded-lg border overflow-hidden">
              {(["CSV", "Excel", "PDF"] as const).map((fmt, i) => (
                <button
                  key={fmt}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 h-8 text-sm hover:bg-muted transition-colors",
                    i > 0 && "border-l",
                  )}
                >
                  <Download className="size-3.5" />
                  {fmt}
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="gap-1.5 ml-auto">
              <Share2 className="size-4" /> Share link
            </Button>
          </div>
        </main>

        {/* ---------------------------------------------------------------- */}
        {/* RIGHT: Configuration */}
        {/* ---------------------------------------------------------------- */}
        {!previewMode && (
          <aside className="flex w-72 shrink-0 flex-col overflow-y-auto border-l bg-background">
            {/* Filters */}
            <PanelHeader>Filters</PanelHeader>
            <div className="flex flex-col gap-2 p-3">
              {filters.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-1.5 rounded-lg border bg-muted/20 px-2.5 py-2"
                >
                  <Filter className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="text-xs font-medium">{f.field}</span>
                  <span className="text-xs text-muted-foreground">{f.op}</span>
                  <span className="flex-1 truncate text-xs text-primary font-medium">
                    {f.value || "…"}
                  </span>
                  <button
                    onClick={() => removeFilter(f.id)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={addFilter}
                className="flex items-center gap-1.5 rounded-lg border border-dashed px-2.5 py-2 text-xs text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
              >
                <Plus className="size-3.5" /> Add filter
              </button>
            </div>

            {/* Group By */}
            <div className="border-t" />
            <PanelHeader>Group By</PanelHeader>
            <div className="px-3 py-2.5">
              <div className="relative">
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                  className="w-full appearance-none rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">None</option>
                  {displayCols.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            {/* Sort By */}
            <div className="border-t" />
            <PanelHeader>Sort By</PanelHeader>
            <div className="flex items-center gap-2 px-3 py-2.5">
              <div className="relative flex-1">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full appearance-none rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">None</option>
                  {displayCols.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>
              <button
                onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg border transition-colors",
                  sortBy ? "hover:bg-muted" : "opacity-40 cursor-not-allowed",
                )}
                disabled={!sortBy}
                title={sortDir === "asc" ? "Ascending" : "Descending"}
              >
                <ArrowUpDown className="size-3.5" />
              </button>
              {sortBy && (
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  {sortDir}
                </span>
              )}
            </div>

            {/* Chart settings (non-table) */}
            {vizType !== "table" && vizType !== "kpi" && (
              <>
                <div className="border-t" />
                <PanelHeader>Chart Settings</PanelHeader>
                <div className="flex flex-col gap-3 p-3">
                  <div>
                    <p className="mb-1.5 text-xs text-muted-foreground">Color scheme</p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {COLOR_SCHEMES.map((scheme) => (
                        <button
                          key={scheme.id}
                          onClick={() => setColorScheme(scheme.id)}
                          title={scheme.label}
                          className={cn(
                            "flex h-7 overflow-hidden rounded-md border transition-all",
                            colorScheme === scheme.id
                              ? "ring-2 ring-primary ring-offset-1"
                              : "hover:border-foreground/30",
                          )}
                        >
                          {scheme.colors.slice(0, 4).map((c, i) => (
                            <div
                              key={i}
                              className="flex-1"
                              style={{ background: c }}
                            />
                          ))}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex cursor-pointer items-center justify-between">
                    <span className="text-sm">Show legend</span>
                    <button
                      onClick={() => setShowLegend((v) => !v)}
                      className={cn(
                        "relative h-5 w-9 rounded-full transition-colors",
                        showLegend ? "bg-primary" : "bg-border",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform",
                          showLegend ? "translate-x-4" : "translate-x-0.5",
                        )}
                      />
                    </button>
                  </label>

                  <label className="flex cursor-pointer items-center justify-between">
                    <span className="text-sm">Show data labels</span>
                    <button
                      onClick={() => setShowDataLabels((v) => !v)}
                      className={cn(
                        "relative h-5 w-9 rounded-full transition-colors",
                        showDataLabels ? "bg-primary" : "bg-border",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform",
                          showDataLabels ? "translate-x-4" : "translate-x-0.5",
                        )}
                      />
                    </button>
                  </label>
                </div>
              </>
            )}

            {/* Report settings */}
            <div className="border-t" />
            <PanelHeader>Report Settings</PanelHeader>
            <div className="flex flex-col gap-3 p-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Report name
                </label>
                <input
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Optional description…"
                  className="w-full resize-none rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-muted-foreground">
                  Access level
                </label>
                <div className="flex overflow-hidden rounded-lg border">
                  {(
                    [
                      { id: "me", label: "Just me" },
                      { id: "team", label: "My team" },
                      { id: "everyone", label: "Everyone" },
                    ] as { id: typeof accessLevel; label: string }[]
                  ).map(({ id, label }, i) => (
                    <button
                      key={id}
                      onClick={() => setAccessLevel(id)}
                      className={cn(
                        "flex-1 py-1.5 text-xs transition-colors",
                        i > 0 && "border-l",
                        accessLevel === id
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted text-muted-foreground",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex cursor-pointer items-center justify-between">
                <div>
                  <p className="text-sm">Schedule delivery</p>
                  <p className="text-xs text-muted-foreground">Email this report on a cadence</p>
                </div>
                <button
                  onClick={() => setScheduleEnabled((v) => !v)}
                  className={cn(
                    "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                    scheduleEnabled ? "bg-primary" : "bg-border",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform",
                      scheduleEnabled ? "translate-x-4" : "translate-x-0.5",
                    )}
                  />
                </button>
              </label>

              {scheduleEnabled && (
                <div className="relative">
                  <select className="w-full appearance-none rounded-lg border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30">
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                    <option>Custom…</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Trend tip */}
            <div className="mt-auto border-t p-3">
              <div className="flex items-start gap-2 rounded-lg bg-muted/40 p-3">
                <TrendingUp className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Use the <strong>Ask AI</strong> button in the top bar to generate
                  this report from a natural-language question.
                </p>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
