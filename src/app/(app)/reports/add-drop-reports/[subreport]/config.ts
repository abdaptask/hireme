/**
 * Add/Drop sub-report configuration (shared by the server page and client view —
 * kept out of the "use client" module so the server can read it).
 */

/* ---------------------------- Config & datasets --------------------------- */

export type SubReportRow = {
  dimension: string;
  adds: number;
  drops: number;
  net: number;
  active: number;
};

export type SubReportConfig = {
  title: string;
  dimensionLabel: string;
  description: string;
  data: SubReportRow[];
};

export const SUB_REPORT_CONFIG: Record<string, SubReportConfig> = {
  weekly: {
    title: "Weekly Add/Drop",
    dimensionLabel: "Week",
    description: "Trailing 13 weeks of workforce movement.",
    data: [
      { dimension: "W23 · Jun 2", adds: 5, drops: 1, net: 4, active: 184 },
      { dimension: "W22 · May 26", adds: 4, drops: 2, net: 2, active: 180 },
      { dimension: "W21 · May 19", adds: 6, drops: 1, net: 5, active: 178 },
      { dimension: "W20 · May 12", adds: 3, drops: 2, net: 1, active: 173 },
      { dimension: "W19 · May 5", adds: 4, drops: 3, net: 1, active: 172 },
      { dimension: "W18 · Apr 28", adds: 5, drops: 1, net: 4, active: 171 },
      { dimension: "W17 · Apr 21", adds: 2, drops: 2, net: 0, active: 167 },
      { dimension: "W16 · Apr 14", adds: 6, drops: 2, net: 4, active: 167 },
      { dimension: "W15 · Apr 7", adds: 3, drops: 1, net: 2, active: 163 },
      { dimension: "W14 · Mar 31", adds: 4, drops: 3, net: 1, active: 161 },
      { dimension: "W13 · Mar 24", adds: 5, drops: 2, net: 3, active: 160 },
      { dimension: "W12 · Mar 17", adds: 4, drops: 2, net: 2, active: 157 },
      { dimension: "W11 · Mar 10", adds: 3, drops: 1, net: 2, active: 155 },
    ],
  },
  monthly: {
    title: "Monthly Add/Drop",
    dimensionLabel: "Month",
    description: "Monthly trend across the trailing 12 months.",
    data: [
      { dimension: "Jun 2026", adds: 18, drops: 6, net: 12, active: 184 },
      { dimension: "May 2026", adds: 16, drops: 4, net: 12, active: 172 },
      { dimension: "Apr 2026", adds: 13, drops: 7, net: 6, active: 160 },
      { dimension: "Mar 2026", adds: 17, drops: 8, net: 9, active: 154 },
      { dimension: "Feb 2026", adds: 11, drops: 5, net: 6, active: 145 },
      { dimension: "Jan 2026", adds: 14, drops: 9, net: 5, active: 139 },
      { dimension: "Dec 2025", adds: 9, drops: 7, net: 2, active: 134 },
      { dimension: "Nov 2025", adds: 12, drops: 6, net: 6, active: 132 },
      { dimension: "Oct 2025", adds: 15, drops: 5, net: 10, active: 126 },
      { dimension: "Sep 2025", adds: 11, drops: 8, net: 3, active: 116 },
      { dimension: "Aug 2025", adds: 13, drops: 6, net: 7, active: 113 },
      { dimension: "Jul 2025", adds: 10, drops: 4, net: 6, active: 106 },
    ],
  },
  "by-client": {
    title: "By Client",
    dimensionLabel: "Client",
    description: "Per-client adds, drops, net, and active headcount this month.",
    data: [
      { dimension: "Meridian Health", adds: 6, drops: 1, net: 5, active: 42 },
      { dimension: "Cobalt Systems", adds: 4, drops: 1, net: 3, active: 35 },
      { dimension: "Vertex Financial", adds: 3, drops: 2, net: 1, active: 28 },
      { dimension: "Northwind Logistics", adds: 2, drops: 1, net: 1, active: 24 },
      { dimension: "Atlas Manufacturing", adds: 3, drops: 1, net: 2, active: 31 },
      { dimension: "Other", adds: 0, drops: 0, net: 0, active: 24 },
    ],
  },
  "by-recruiter": {
    title: "By Recruiter",
    dimensionLabel: "Recruiter",
    description: "Recruiter-attributed adds and drops this month.",
    data: [
      { dimension: "Devon Hughes", adds: 6, drops: 1, net: 5, active: 38 },
      { dimension: "Aaron Flores", adds: 5, drops: 2, net: 3, active: 32 },
      { dimension: "Lena Ortiz", adds: 4, drops: 2, net: 2, active: 29 },
      { dimension: "Priya Ramesh", adds: 2, drops: 1, net: 1, active: 19 },
      { dimension: "Jordan Pratt", adds: 1, drops: 0, net: 1, active: 14 },
    ],
  },
  "by-reason": {
    title: "By Reason",
    dimensionLabel: "Drop reason",
    description: "Root-cause classification across drops this month.",
    data: [
      { dimension: "End of assignment", adds: 0, drops: 2, net: -2, active: 0 },
      { dimension: "Voluntary resignation", adds: 0, drops: 1, net: -1, active: 0 },
      { dimension: "Performance", adds: 0, drops: 1, net: -1, active: 0 },
      { dimension: "Converted to FTE", adds: 0, drops: 1, net: -1, active: 0 },
      { dimension: "Client cancellation", adds: 0, drops: 1, net: -1, active: 0 },
    ],
  },
};
