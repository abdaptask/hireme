/**
 * Reports catalog mirroring the current ApTask reports menu (§49). Each report
 * is a placeholder for now — built out individually later. Two analytics
 * reports already exist and are surfaced as live previews.
 */

export type CatalogReport = {
  name: string;
  slug: string;
  /** Present once a report has further sub-reports (e.g. Add Drop Reports). */
  hasSubReports?: boolean;
};

export type ReportCategory = {
  id: string;
  label: string;
  reports: CatalogReport[];
};

export const REPORT_CATALOG: ReportCategory[] = [
  {
    id: "financial",
    label: "Financial Reports",
    reports: [
      { name: "Fintech Profit & Loss", slug: "fintech-profit-loss" },
      { name: "Combine Income Statement", slug: "combine-income-statement" },
      { name: "Balance Sheet", slug: "balance-sheet" },
      { name: "Profit & Loss Summary", slug: "profit-loss-summary" },
    ],
  },
  {
    id: "recruiters",
    label: "Recruiters",
    reports: [
      { name: "Recruiter Performance Report", slug: "recruiter-performance" },
    ],
  },
  {
    id: "back-office",
    label: "Back Office",
    reports: [
      { name: "Consultant Contact", slug: "consultant-contact" },
      { name: "WC New Hire Report", slug: "wc-new-hire" },
      { name: "Clients Invoice Report", slug: "clients-invoice" },
      { name: "Add Drop Reports", slug: "add-drop-reports", hasSubReports: true },
      { name: "Commission Report", slug: "commission" },
      { name: "Client Add Drop Summary", slug: "client-add-drop-summary" },
      { name: "Equipment Report", slug: "equipment" },
      { name: "Custom Report", slug: "custom" },
      { name: "AE/REC Summary Report", slug: "ae-rec-summary" },
      { name: "Add Drop Summary", slug: "add-drop-summary" },
      { name: "Consultant Report", slug: "consultant" },
      { name: "Headcount Report", slug: "headcount" },
      { name: "Consultant With PNL Data", slug: "consultant-pnl" },
    ],
  },
  {
    id: "compliance",
    label: "EEOC & Compliance Reports",
    reports: [
      { name: "EEO-1 Workforce Composition", slug: "eeo/workforce-composition" },
      { name: "Applicant Flow Log", slug: "eeo/applicant-flow" },
      { name: "Adverse Impact Analysis (4/5ths)", slug: "eeo/adverse-impact" },
      { name: "VETS-4212 Veteran Report", slug: "eeo/vets-4212" },
    ],
  },
];

/** Analytics reports already built in this app (live previews). */
export const PREVIEW_REPORTS: { name: string; href: string; note: string }[] = [
  {
    name: "Financial Performance",
    href: "/reports/financial",
    note: "Historical trend + month-over-month comparison",
  },
  {
    name: "Skills & Specialty",
    href: "/reports/specialty",
    note: "AI-extracted skill & geographical strengths",
  },
  {
    name: "Operational Counts",
    href: "/reports/operational-counts",
    note: "19 live pipeline + lifecycle counts",
  },
  {
    name: "EEOC Compliance Suite",
    href: "/reports/eeo",
    note: "EEO-1, applicant flow, adverse impact, VETS-4212",
  },
];

const BY_SLUG = new Map(
  REPORT_CATALOG.flatMap((c) =>
    c.reports.map((r) => [r.slug, { ...r, category: c.label }] as const),
  ),
);

export function getCatalogReport(slug: string) {
  return BY_SLUG.get(slug);
}
