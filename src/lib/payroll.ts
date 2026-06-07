/**
 * Payroll Readiness mock data (CLAUDE.md §16 — Payroll and Billing Readiness).
 * One PayrollRecord per candidate; checks mirror the §16.2 gate list.
 */

export type PayrollReadinessStatus = "ready" | "not-ready" | "pending";

export type PayrollCheck = {
  label: string;
  status: "pass" | "fail" | "pending";
  note?: string;
};

export type PayrollRecord = {
  candidateId: string;
  candidateName: string;
  client: string;
  employmentType: "W-2" | "1099" | "C2C";
  startDate: string;
  startInDays: number;
  overallStatus: PayrollReadinessStatus;
  payRate: number;
  payRateCurrency: "USD";
  payRateType: "Hourly";
  payrollEntity: string;
  timekeepingMethod: string;
  checks: PayrollCheck[];
};

export const PAYROLL_STATUS_META: Record<
  PayrollReadinessStatus,
  { label: string; tone: "success" | "warning" | "danger" }
> = {
  ready: { label: "Ready", tone: "success" },
  pending: { label: "Pending", tone: "warning" },
  "not-ready": { label: "Not Ready", tone: "danger" },
};

// ---------------------------------------------------------------------------
// Helper builders
// ---------------------------------------------------------------------------

function pass(label: string, note?: string): PayrollCheck {
  return { label, status: "pass", note };
}
function fail(label: string, note: string): PayrollCheck {
  return { label, status: "fail", note };
}
function pending(label: string, note: string): PayrollCheck {
  return { label, status: "pending", note };
}

// ---------------------------------------------------------------------------
// 14 records — one per candidate (same order as CANDIDATES array)
// ---------------------------------------------------------------------------

export const PAYROLL_RECORDS: PayrollRecord[] = [
  // james-rivera — at-risk, start in 3d → not-ready (direct deposit fail, state tax fail)
  {
    candidateId: "james-rivera",
    candidateName: "James Rivera",
    client: "Meridian Health",
    employmentType: "W-2",
    startDate: "Jun 15",
    startInDays: 3,
    overallStatus: "not-ready",
    payRate: 58,
    payRateCurrency: "USD",
    payRateType: "Hourly",
    payrollEntity: "ApTask LLC",
    timekeepingMethod: "Portal",
    checks: [
      pass("Employment Classification", "W-2 confirmed"),
      pass("Pay Rate Configured", "$58/hr approved"),
      pass("Overtime Rules", "TX — no state OT add-on"),
      pass("Tax Jurisdiction", "Austin, TX resolved"),
      fail("Direct Deposit", "Bank account not yet submitted by candidate"),
      pending("W-4 / Federal Tax", "Form submitted; IRS verification pending"),
      fail("State Tax Form", "TX no state income tax — form not applicable but marked incorrectly"),
      pass("I-9 Verified", "Section 1 & 2 complete"),
      pass("Benefits Eligibility", "Enrolled — Meridian Health plan"),
      pass("Payroll Entity", "ApTask LLC"),
      pending("Timekeeping Setup", "Portal account creation queued"),
    ],
  },

  // aisha-bello — on-track, start in 10d → ready
  {
    candidateId: "aisha-bello",
    candidateName: "Aisha Bello",
    client: "Vertex Financial",
    employmentType: "W-2",
    startDate: "Jun 22",
    startInDays: 10,
    overallStatus: "ready",
    payRate: 72,
    payRateCurrency: "USD",
    payRateType: "Hourly",
    payrollEntity: "ApTask LLC",
    timekeepingMethod: "Portal",
    checks: [
      pass("Employment Classification", "W-2 confirmed"),
      pass("Pay Rate Configured", "$72/hr approved"),
      pass("Overtime Rules", "TX standard OT rules applied"),
      pass("Tax Jurisdiction", "Dallas, TX resolved"),
      pass("Direct Deposit", "Verified — Chase account on file"),
      pass("W-4 / Federal Tax", "2024 W-4 on file"),
      pass("State Tax Form", "TX — no state income tax; acknowledged"),
      pass("I-9 Verified", "Verified"),
      pass("Benefits Eligibility", "Enrolled — standard medical plan"),
      pass("Payroll Entity", "ApTask LLC"),
      pass("Timekeeping Setup", "Portal active"),
    ],
  },

  // marcus-webb — C2C, pending (payroll routed through vendor; some items pending)
  {
    candidateId: "marcus-webb",
    candidateName: "Marcus Webb",
    client: "Northwind Logistics",
    employmentType: "C2C",
    startDate: "Jun 18",
    startInDays: 6,
    overallStatus: "pending",
    payRate: 95,
    payRateCurrency: "USD",
    payRateType: "Hourly",
    payrollEntity: "Apex Staffing Partners",
    timekeepingMethod: "Client VMS",
    checks: [
      pass("Employment Classification", "C2C — corp entity verified"),
      pass("Pay Rate Configured", "$95/hr corp rate confirmed"),
      pass("Overtime Rules", "Exempt — C2C contractor"),
      pending("Tax Jurisdiction", "IL jurisdiction confirmation with vendor pending"),
      pass("Direct Deposit", "Vendor ACH on file"),
      pass("W-4 / Federal Tax", "Not applicable — C2C"),
      pass("State Tax Form", "Not applicable — C2C"),
      pending("I-9 Verified", "Vendor I-9 verification receipt awaited"),
      pass("Benefits Eligibility", "Not applicable — C2C"),
      pass("Payroll Entity", "Apex Staffing Partners"),
      pending("Timekeeping Setup", "Fieldglass account provisioning in progress"),
    ],
  },

  // sarah-chen — W-2, pending (CA state tax pending, benefits enrollment pending)
  {
    candidateId: "sarah-chen",
    candidateName: "Sarah Chen",
    client: "Atlas Manufacturing",
    employmentType: "W-2",
    startDate: "Jun 20",
    startInDays: 8,
    overallStatus: "pending",
    payRate: 65,
    payRateCurrency: "USD",
    payRateType: "Hourly",
    payrollEntity: "ApTask Corp",
    timekeepingMethod: "Portal",
    checks: [
      pass("Employment Classification", "W-2 confirmed"),
      pass("Pay Rate Configured", "$65/hr approved"),
      pass("Overtime Rules", "CA — daily and weekly OT rules applied"),
      pass("Tax Jurisdiction", "Seattle, WA resolved"),
      pass("Direct Deposit", "Verified — BofA account on file"),
      pass("W-4 / Federal Tax", "2024 W-4 on file"),
      pending("State Tax Form", "WA — no income tax; residency acknowledgment pending"),
      pass("I-9 Verified", "Verified"),
      pending("Benefits Eligibility", "Open enrollment window active — candidate deciding"),
      pass("Payroll Entity", "ApTask Corp"),
      pass("Timekeeping Setup", "Portal active"),
    ],
  },

  // owen-bradley — W-2, not-ready (multiple fails, start in 2d)
  {
    candidateId: "owen-bradley",
    candidateName: "Owen Bradley",
    client: "Northwind Logistics",
    employmentType: "W-2",
    startDate: "Jun 14",
    startInDays: 2,
    overallStatus: "not-ready",
    payRate: 42,
    payRateCurrency: "USD",
    payRateType: "Hourly",
    payrollEntity: "ApTask LLC",
    timekeepingMethod: "Paper",
    checks: [
      pass("Employment Classification", "W-2 confirmed"),
      pass("Pay Rate Configured", "$42/hr approved"),
      pass("Overtime Rules", "MI standard OT rules applied"),
      pass("Tax Jurisdiction", "Detroit, MI resolved"),
      fail("Direct Deposit", "Form returned — invalid routing number"),
      fail("W-4 / Federal Tax", "W-4 not yet submitted"),
      pending("State Tax Form", "MI-W4 sent; awaiting return"),
      fail("I-9 Verified", "Section 1 submitted; Section 2 incomplete — ID rejected"),
      pass("Benefits Eligibility", "Waived — opted out"),
      pass("Payroll Entity", "ApTask LLC"),
      fail("Timekeeping Setup", "Paper timesheets not configured with supervisor"),
    ],
  },

  // mei-lin — W-2, CA, ready
  {
    candidateId: "mei-lin",
    candidateName: "Mei Lin",
    client: "Atlas Manufacturing",
    employmentType: "W-2",
    startDate: "Jun 25",
    startInDays: 13,
    overallStatus: "ready",
    payRate: 68,
    payRateCurrency: "USD",
    payRateType: "Hourly",
    payrollEntity: "ApTask Corp",
    timekeepingMethod: "Portal",
    checks: [
      pass("Employment Classification", "W-2 confirmed"),
      pass("Pay Rate Configured", "$68/hr approved"),
      pass("Overtime Rules", "CA — daily and weekly OT applied"),
      pass("Tax Jurisdiction", "San Jose, CA resolved"),
      pass("Direct Deposit", "Verified — Wells Fargo on file"),
      pass("W-4 / Federal Tax", "2024 W-4 on file"),
      pass("State Tax Form", "DE-4 (CA) on file — CA wage notice issued"),
      pass("I-9 Verified", "Verified"),
      pass("Benefits Eligibility", "Enrolled — Atlas Manufacturing plan"),
      pass("Payroll Entity", "ApTask Corp"),
      pass("Timekeeping Setup", "Portal active"),
    ],
  },

  // diego-santos — C2C, ready
  {
    candidateId: "diego-santos",
    candidateName: "Diego Santos",
    client: "Cobalt Systems",
    employmentType: "C2C",
    startDate: "Jun 30",
    startInDays: 18,
    overallStatus: "ready",
    payRate: 115,
    payRateCurrency: "USD",
    payRateType: "Hourly",
    payrollEntity: "Apex Staffing Partners",
    timekeepingMethod: "Client VMS",
    checks: [
      pass("Employment Classification", "C2C — corp entity verified"),
      pass("Pay Rate Configured", "$115/hr corp rate confirmed"),
      pass("Overtime Rules", "Exempt — C2C contractor"),
      pass("Tax Jurisdiction", "Miami, FL resolved — no state income tax"),
      pass("Direct Deposit", "Vendor ACH on file"),
      pass("W-4 / Federal Tax", "Not applicable — C2C"),
      pass("State Tax Form", "Not applicable — C2C"),
      pass("I-9 Verified", "Vendor I-9 receipt confirmed"),
      pass("Benefits Eligibility", "Not applicable — C2C"),
      pass("Payroll Entity", "Apex Staffing Partners"),
      pass("Timekeeping Setup", "Fieldglass account active"),
    ],
  },

  // grace-okafor — W-2, pending
  {
    candidateId: "grace-okafor",
    candidateName: "Grace Okafor",
    client: "Meridian Health",
    employmentType: "W-2",
    startDate: "Jun 23",
    startInDays: 11,
    overallStatus: "pending",
    payRate: 55,
    payRateCurrency: "USD",
    payRateType: "Hourly",
    payrollEntity: "ApTask LLC",
    timekeepingMethod: "Portal",
    checks: [
      pass("Employment Classification", "W-2 confirmed"),
      pass("Pay Rate Configured", "$55/hr approved"),
      pass("Overtime Rules", "TX standard OT rules applied"),
      pass("Tax Jurisdiction", "Houston, TX resolved"),
      pass("Direct Deposit", "Verified — Citibank on file"),
      pass("W-4 / Federal Tax", "2024 W-4 on file"),
      pass("State Tax Form", "TX — no state income tax; acknowledged"),
      pending("I-9 Verified", "I-9 Section 1 complete; Section 2 scheduled Jun 13"),
      pending("Benefits Eligibility", "Enrollment window opens Jun 12"),
      pass("Payroll Entity", "ApTask LLC"),
      pending("Timekeeping Setup", "Portal invite sent; not yet activated"),
    ],
  },

  // noah-klein — W-2, not-ready (direct deposit missing — in tags)
  {
    candidateId: "noah-klein",
    candidateName: "Noah Klein",
    client: "Vertex Financial",
    employmentType: "W-2",
    startDate: "Jun 19",
    startInDays: 7,
    overallStatus: "not-ready",
    payRate: 62,
    payRateCurrency: "USD",
    payRateType: "Hourly",
    payrollEntity: "ApTask LLC",
    timekeepingMethod: "Portal",
    checks: [
      pass("Employment Classification", "W-2 confirmed"),
      pass("Pay Rate Configured", "$62/hr approved"),
      pass("Overtime Rules", "TX standard OT rules applied"),
      pass("Tax Jurisdiction", "Dallas, TX resolved"),
      fail("Direct Deposit", "Form submitted with mismatched account name — rejected"),
      pass("W-4 / Federal Tax", "2024 W-4 on file"),
      pass("State Tax Form", "TX — no state income tax; acknowledged"),
      pass("I-9 Verified", "Verified"),
      pending("Benefits Eligibility", "Awaiting election form return"),
      pass("Payroll Entity", "ApTask LLC"),
      pass("Timekeeping Setup", "Portal active"),
    ],
  },

  // fatima-idris — 1099, ready (most checks N/A for 1099)
  {
    candidateId: "fatima-idris",
    candidateName: "Fatima Idris",
    client: "Cobalt Systems",
    employmentType: "1099",
    startDate: "Jul 06",
    startInDays: 24,
    overallStatus: "ready",
    payRate: 88,
    payRateCurrency: "USD",
    payRateType: "Hourly",
    payrollEntity: "ApTask Corp",
    timekeepingMethod: "Portal",
    checks: [
      pass("Employment Classification", "1099 — W-9 on file"),
      pass("Pay Rate Configured", "$88/hr confirmed"),
      pass("Overtime Rules", "Not applicable — 1099 independent contractor"),
      pass("Tax Jurisdiction", "Phoenix, AZ confirmed"),
      pass("Direct Deposit", "ACH routing confirmed"),
      pass("W-4 / Federal Tax", "Not applicable — 1099; W-9 on file"),
      pass("State Tax Form", "AZ — no withholding for 1099"),
      pass("I-9 Verified", "Not required — 1099 contractor"),
      pass("Benefits Eligibility", "Not applicable — 1099"),
      pass("Payroll Entity", "ApTask Corp"),
      pass("Timekeeping Setup", "Portal active"),
    ],
  },

  // tara-voss — W-2, pending
  {
    candidateId: "tara-voss",
    candidateName: "Tara Voss",
    client: "Meridian Health",
    employmentType: "W-2",
    startDate: "Jun 24",
    startInDays: 12,
    overallStatus: "pending",
    payRate: 50,
    payRateCurrency: "USD",
    payRateType: "Hourly",
    payrollEntity: "ApTask LLC",
    timekeepingMethod: "Portal",
    checks: [
      pass("Employment Classification", "W-2 confirmed"),
      pass("Pay Rate Configured", "$50/hr approved"),
      pass("Overtime Rules", "TX standard OT rules applied"),
      pass("Tax Jurisdiction", "Houston, TX resolved"),
      pending("Direct Deposit", "Form emailed; awaiting submission"),
      pending("W-4 / Federal Tax", "Sent to candidate Jun 5"),
      pass("State Tax Form", "TX — no state income tax; acknowledged"),
      pass("I-9 Verified", "Verified"),
      pending("Benefits Eligibility", "Open enrollment window active"),
      pass("Payroll Entity", "ApTask LLC"),
      pass("Timekeeping Setup", "Portal active"),
    ],
  },

  // leo-park — W-2, ready
  {
    candidateId: "leo-park",
    candidateName: "Leo Park",
    client: "Meridian Health",
    employmentType: "W-2",
    startDate: "Jun 17",
    startInDays: 5,
    overallStatus: "ready",
    payRate: 48,
    payRateCurrency: "USD",
    payRateType: "Hourly",
    payrollEntity: "ApTask LLC",
    timekeepingMethod: "Portal",
    checks: [
      pass("Employment Classification", "W-2 confirmed"),
      pass("Pay Rate Configured", "$48/hr approved"),
      pass("Overtime Rules", "TX standard OT rules applied"),
      pass("Tax Jurisdiction", "Houston, TX resolved"),
      pass("Direct Deposit", "Verified — BOA on file"),
      pass("W-4 / Federal Tax", "2024 W-4 on file"),
      pass("State Tax Form", "TX — no state income tax; acknowledged"),
      pass("I-9 Verified", "Verified"),
      pass("Benefits Eligibility", "Enrolled — Meridian Health plan"),
      pass("Payroll Entity", "ApTask LLC"),
      pass("Timekeeping Setup", "Portal active"),
    ],
  },

  // ravi-menon — C2C, pending
  {
    candidateId: "ravi-menon",
    candidateName: "Ravi Menon",
    client: "Cobalt Systems",
    employmentType: "C2C",
    startDate: "Jun 21",
    startInDays: 9,
    overallStatus: "pending",
    payRate: 105,
    payRateCurrency: "USD",
    payRateType: "Hourly",
    payrollEntity: "Apex Staffing Partners",
    timekeepingMethod: "Client VMS",
    checks: [
      pass("Employment Classification", "C2C — corp entity verified"),
      pass("Pay Rate Configured", "$105/hr corp rate confirmed"),
      pass("Overtime Rules", "Exempt — C2C contractor"),
      pending("Tax Jurisdiction", "NC jurisdiction letter from vendor awaited"),
      pending("Direct Deposit", "Vendor bank details update in progress"),
      pass("W-4 / Federal Tax", "Not applicable — C2C"),
      pass("State Tax Form", "Not applicable — C2C"),
      pending("I-9 Verified", "Vendor MSA not yet returned — I-9 gated"),
      pass("Benefits Eligibility", "Not applicable — C2C"),
      pass("Payroll Entity", "Apex Staffing Partners"),
      pending("Timekeeping Setup", "VMS account provisioning queued"),
    ],
  },

  // sofia-marin — C2C, ready
  {
    candidateId: "sofia-marin",
    candidateName: "Sofia Marin",
    client: "Atlas Manufacturing",
    employmentType: "C2C",
    startDate: "Jun 28",
    startInDays: 16,
    overallStatus: "ready",
    payRate: 98,
    payRateCurrency: "USD",
    payRateType: "Hourly",
    payrollEntity: "Apex Staffing Partners",
    timekeepingMethod: "Client VMS",
    checks: [
      pass("Employment Classification", "C2C — corp entity verified"),
      pass("Pay Rate Configured", "$98/hr corp rate confirmed"),
      pass("Overtime Rules", "Exempt — C2C contractor"),
      pass("Tax Jurisdiction", "Denver, CO resolved — no C2C state withholding"),
      pass("Direct Deposit", "Vendor ACH on file"),
      pass("W-4 / Federal Tax", "Not applicable — C2C"),
      pass("State Tax Form", "Not applicable — C2C"),
      pass("I-9 Verified", "Vendor I-9 receipt confirmed"),
      pass("Benefits Eligibility", "Not applicable — C2C"),
      pass("Payroll Entity", "Apex Staffing Partners"),
      pass("Timekeeping Setup", "Fieldglass account active"),
    ],
  },
];

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export function payrollStats(): {
  ready: number;
  notReady: number;
  pending: number;
  criticalGaps: number;
} {
  let ready = 0;
  let notReady = 0;
  let pending = 0;
  let criticalGaps = 0;

  for (const r of PAYROLL_RECORDS) {
    if (r.overallStatus === "ready") ready++;
    else if (r.overallStatus === "not-ready") notReady++;
    else pending++;

    // Critical: not-ready AND starting within 7 days
    if (r.overallStatus === "not-ready" && r.startInDays <= 7) criticalGaps++;
  }

  return { ready, notReady, pending, criticalGaps };
}
