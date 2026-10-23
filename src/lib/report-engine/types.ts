/**
 * Report engine contracts (§49–§73).
 *
 * A report is a pure function from the live operational dataset to a
 * serializable result (KPIs, charts, drill-down table). One generic viewer
 * renders every report, so each definition only describes *what* to compute.
 */

import type { Dataset } from "./dataset";

/** Personas that own a report catalog (§73 criterion 1). */
export type ReportPersona =
  | "super-admin"
  | "onboarder"
  | "recruiter"
  | "recruiting-manager"
  | "account-manager"
  | "candidate"
  | "executive";

/** Report navigation sections (§50.1). */
export type ReportSectionId =
  | "operational"
  | "candidate"
  | "onboarder"
  | "recruiter"
  | "manager"
  | "client"
  | "compliance"
  | "screening"
  | "payroll"
  | "billing"
  | "equipment"
  | "training"
  | "communication"
  | "ai"
  | "integration"
  | "audit"
  | "executive"
  | "lifecycle";

export type Tone = "default" | "success" | "warning" | "danger" | "info" | "ai" | "neutral";

export type ValueFormat = "number" | "currency" | "percent" | "days";

export type Kpi = {
  label: string;
  value: number | string;
  format?: ValueFormat;
  tone?: Tone;
  hint?: string;
};

export type ColumnType = "text" | "number" | "currency" | "percent" | "date" | "days" | "status";

export type Column = {
  key: string;
  label: string;
  type?: ColumnType;
};

export type Cell = string | number | null;
export type Row = Record<string, Cell>;

export type ChartPoint = {
  label: string;
  value: number;
  tone?: Tone;
  /** Table value matched on drill-down when it differs from the label. */
  drill?: string;
};

type ChartBase = {
  title: string;
  description?: string;
  /** Table column key filtered when a chart element is clicked (§34.7). */
  drillKey?: string;
  format?: ValueFormat;
};

export type Chart =
  | (ChartBase & { kind: "bar"; points: ChartPoint[] })
  | (ChartBase & { kind: "trend"; points: ChartPoint[] })
  | (ChartBase & { kind: "funnel"; points: ChartPoint[] })
  | (ChartBase & {
      kind: "stacked";
      segments: { key: string; label: string; tone: Tone }[];
      rows: { label: string; drill?: string; values: Record<string, number> }[];
    });

export type ReportTable = {
  title?: string;
  columns: Column[];
  rows: Row[];
  sort?: { key: string; dir: "asc" | "desc" };
  /** Pinned summary row rendered at the bottom (e.g. totals). */
  totals?: Row;
};

export type ReportResult = {
  kpis: Kpi[];
  charts: Chart[];
  table: ReportTable;
  /** Additional tables rendered below the primary table (breakdowns, detail). */
  extraTables?: ReportTable[];
  notes?: string[];
  /** For record-scoped reports (§52): who the report is about. */
  subject?: { label: string; options: { id: string; label: string }[]; selected: string };
};

/** Inclusive reporting window (§50.3 global date filter). */
export type DateRange = { from: Date; to: Date; label: string };

export type ReportContext = {
  /** Selected record for candidate-scoped reports. */
  subjectId?: string;
  /** Active date range, if the user picked one. */
  range?: DateRange;
  /** Values of the report's own controls (e.g. period grouping). */
  params: Record<string, string>;
};

/** A report-specific select shown in the filter bar. */
export type ReportControl = {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  default: string;
};

export type ReportDef = {
  slug: string;
  name: string;
  description: string;
  section: ReportSectionId;
  /** Spec reference, e.g. "§51.3". */
  spec: string;
  personas: ReportPersona[];
  owner: string;
  /** Restricted reports (§58.5, §66) are flagged in the UI. */
  restricted?: boolean;
  definitions?: { term: string; def: string }[];
  /**
   * How the date filter applies (§50.3):
   * - "activity" (default): records are scoped to the range by their activity date
   * - "custom": the report reads `ctx.range` itself
   * - "none": forward-looking / current-state report; filter hidden
   */
  dateScope?: "activity" | "custom" | "none";
  /** Explains what the date range filters, shown beside the filter. */
  dateBasis?: string;
  /** Report-specific selects; a function when options depend on live data. */
  controls?: ReportControl[] | ((ds: Dataset) => ReportControl[]);
  load: (ds: Dataset, ctx: ReportContext) => ReportResult;
};

/** Serializable metadata for catalog listings (no load function). */
export type ReportMeta = Omit<ReportDef, "load" | "controls">;
