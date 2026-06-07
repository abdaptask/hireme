/**
 * Billing Readiness mock data (CLAUDE.md §16 — Payroll and Billing Readiness).
 * One BillingRecord per candidate; checks mirror the §16.3 gate list.
 */

export type BillingReadinessStatus = "ready" | "not-ready" | "pending";

export type BillingCheck = {
  label: string;
  status: "pass" | "fail" | "pending";
  note?: string;
};

export type BillingRecord = {
  candidateId: string;
  candidateName: string;
  client: string;
  employmentType: "W-2" | "1099" | "C2C";
  startDate: string;
  startInDays: number;
  overallStatus: BillingReadinessStatus;
  billRate: number;
  markup: number;
  billRateCurrency: "USD";
  billRateType: "Hourly";
  purchaseOrder?: string;
  costCenter?: string;
  clientWorkerId?: string;
  vmsId?: string;
  invoiceFrequency: string;
  timesheetMethod: string;
  checks: BillingCheck[];
};

export const BILLING_STATUS_META: Record<
  BillingReadinessStatus,
  { label: string; tone: "success" | "warning" | "danger" }
> = {
  ready: { label: "Ready", tone: "success" },
  pending: { label: "Pending", tone: "warning" },
  "not-ready": { label: "Not Ready", tone: "danger" },
};

// ---------------------------------------------------------------------------
// Helper builders
// ---------------------------------------------------------------------------

function pass(label: string, note?: string): BillingCheck {
  return { label, status: "pass", note };
}
function fail(label: string, note: string): BillingCheck {
  return { label, status: "fail", note };
}
function pending(label: string, note: string): BillingCheck {
  return { label, status: "pending", note };
}

// ---------------------------------------------------------------------------
// 14 records — one per candidate (same order as CANDIDATES array)
// ---------------------------------------------------------------------------

export const BILLING_RECORDS: BillingRecord[] = [
  // james-rivera — not-ready (PO missing, client worker ID not issued)
  {
    candidateId: "james-rivera",
    candidateName: "James Rivera",
    client: "Meridian Health",
    employmentType: "W-2",
    startDate: "Jun 15",
    startInDays: 3,
    overallStatus: "not-ready",
    billRate: 87,
    markup: 50,
    billRateCurrency: "USD",
    billRateType: "Hourly",
    costCenter: "CC-MH-DATA-01",
    invoiceFrequency: "Weekly",
    timesheetMethod: "Portal",
    checks: [
      pass("Bill Rate Configured", "$87/hr approved"),
      pass("Markup Applied", "50% markup confirmed"),
      fail("Purchase Order", "PO request sent Jun 3 — Meridian procurement not yet responded"),
      pass("Cost Center", "CC-MH-DATA-01 confirmed"),
      fail("Client Worker ID", "Not issued — blocked on PO approval"),
      pass("VMS ID", "Not applicable — direct engagement"),
      pass("Invoice Frequency", "Weekly billing confirmed"),
      pass("Timesheet Method", "Portal timesheets configured"),
      pass("Expense Policy", "Standard Meridian expense policy attached"),
      pass("Billing Entity", "ApTask LLC"),
      fail("Approved Start Date", "Billing cannot approve start without active PO"),
    ],
  },

  // aisha-bello — ready
  {
    candidateId: "aisha-bello",
    candidateName: "Aisha Bello",
    client: "Vertex Financial",
    employmentType: "W-2",
    startDate: "Jun 22",
    startInDays: 10,
    overallStatus: "ready",
    billRate: 112,
    markup: 56,
    billRateCurrency: "USD",
    billRateType: "Hourly",
    purchaseOrder: "PO-2024-0451",
    costCenter: "CC-VF-HC-03",
    clientWorkerId: "VF-88201",
    invoiceFrequency: "Bi-weekly",
    timesheetMethod: "Portal",
    checks: [
      pass("Bill Rate Configured", "$112/hr approved"),
      pass("Markup Applied", "56% markup confirmed"),
      pass("Purchase Order", "PO-2024-0451 active — $89,600 balance"),
      pass("Cost Center", "CC-VF-HC-03 confirmed"),
      pass("Client Worker ID", "VF-88201 issued"),
      pass("VMS ID", "Not applicable — direct engagement"),
      pass("Invoice Frequency", "Bi-weekly billing confirmed"),
      pass("Timesheet Method", "Portal configured"),
      pass("Expense Policy", "Vertex standard expense policy attached"),
      pass("Billing Entity", "ApTask LLC"),
      pass("Approved Start Date", "Jun 22 approved by client"),
    ],
  },

  // marcus-webb — C2C, pending (VMS ID pending)
  {
    candidateId: "marcus-webb",
    candidateName: "Marcus Webb",
    client: "Northwind Logistics",
    employmentType: "C2C",
    startDate: "Jun 18",
    startInDays: 6,
    overallStatus: "pending",
    billRate: 148,
    markup: 56,
    billRateCurrency: "USD",
    billRateType: "Hourly",
    purchaseOrder: "PO-2024-0389",
    costCenter: "CC-NL-DEVOPS-02",
    clientWorkerId: "NL-40019",
    vmsId: undefined,
    invoiceFrequency: "Weekly",
    timesheetMethod: "Fieldglass",
    checks: [
      pass("Bill Rate Configured", "$148/hr approved"),
      pass("Markup Applied", "56% confirmed"),
      pass("Purchase Order", "PO-2024-0389 active"),
      pass("Cost Center", "CC-NL-DEVOPS-02 confirmed"),
      pass("Client Worker ID", "NL-40019 issued"),
      pending("VMS ID", "Fieldglass worker record creation in progress"),
      pass("Invoice Frequency", "Weekly via Fieldglass"),
      pending("Timesheet Method", "Fieldglass account provisioning queued"),
      pass("Expense Policy", "Northwind expense policy attached"),
      pass("Billing Entity", "Apex Staffing Partners"),
      pending("Approved Start Date", "Awaiting Fieldglass worker activation"),
    ],
  },

  // sarah-chen — W-2, pending
  {
    candidateId: "sarah-chen",
    candidateName: "Sarah Chen",
    client: "Atlas Manufacturing",
    employmentType: "W-2",
    startDate: "Jun 20",
    startInDays: 8,
    overallStatus: "pending",
    billRate: 98,
    markup: 51,
    billRateCurrency: "USD",
    billRateType: "Hourly",
    purchaseOrder: "PO-2024-0502",
    costCenter: "CC-AM-DESIGN-01",
    invoiceFrequency: "Bi-weekly",
    timesheetMethod: "Portal",
    checks: [
      pass("Bill Rate Configured", "$98/hr approved"),
      pass("Markup Applied", "51% markup confirmed"),
      pass("Purchase Order", "PO-2024-0502 active"),
      pass("Cost Center", "CC-AM-DESIGN-01 confirmed"),
      pending("Client Worker ID", "Atlas HR to issue worker ID after package approval"),
      pass("VMS ID", "Not applicable"),
      pass("Invoice Frequency", "Bi-weekly confirmed"),
      pass("Timesheet Method", "Portal configured"),
      pass("Expense Policy", "Atlas standard policy attached"),
      pass("Billing Entity", "ApTask Corp"),
      pending("Approved Start Date", "Awaiting client worker ID before billing approval"),
    ],
  },

  // owen-bradley — not-ready (no PO, no client worker ID, expense policy missing)
  {
    candidateId: "owen-bradley",
    candidateName: "Owen Bradley",
    client: "Northwind Logistics",
    employmentType: "W-2",
    startDate: "Jun 14",
    startInDays: 2,
    overallStatus: "not-ready",
    billRate: 62,
    markup: 48,
    billRateCurrency: "USD",
    billRateType: "Hourly",
    invoiceFrequency: "Weekly",
    timesheetMethod: "Paper",
    checks: [
      pass("Bill Rate Configured", "$62/hr approved"),
      pass("Markup Applied", "48% markup confirmed"),
      fail("Purchase Order", "No PO number on file — procurement escalation required"),
      fail("Cost Center", "Cost center not assigned by client"),
      fail("Client Worker ID", "Not issued — dependent on PO"),
      pass("VMS ID", "Not applicable — direct engagement"),
      pass("Invoice Frequency", "Weekly paper invoice"),
      pass("Timesheet Method", "Paper timesheets — supervisor confirmed"),
      fail("Expense Policy", "Northwind field expense policy not yet received"),
      pass("Billing Entity", "ApTask LLC"),
      fail("Approved Start Date", "Cannot approve billing start without active PO"),
    ],
  },

  // mei-lin — W-2, ready (CA)
  {
    candidateId: "mei-lin",
    candidateName: "Mei Lin",
    client: "Atlas Manufacturing",
    employmentType: "W-2",
    startDate: "Jun 25",
    startInDays: 13,
    overallStatus: "ready",
    billRate: 102,
    markup: 50,
    billRateCurrency: "USD",
    billRateType: "Hourly",
    purchaseOrder: "PO-2024-0488",
    costCenter: "CC-AM-FIN-02",
    clientWorkerId: "AM-90144",
    invoiceFrequency: "Bi-weekly",
    timesheetMethod: "Portal",
    checks: [
      pass("Bill Rate Configured", "$102/hr approved"),
      pass("Markup Applied", "50% markup confirmed"),
      pass("Purchase Order", "PO-2024-0488 active"),
      pass("Cost Center", "CC-AM-FIN-02 confirmed"),
      pass("Client Worker ID", "AM-90144 issued"),
      pass("VMS ID", "Not applicable"),
      pass("Invoice Frequency", "Bi-weekly confirmed"),
      pass("Timesheet Method", "Portal configured"),
      pass("Expense Policy", "Atlas standard expense policy attached"),
      pass("Billing Entity", "ApTask Corp"),
      pass("Approved Start Date", "Jun 25 confirmed by client"),
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
    billRate: 175,
    markup: 52,
    billRateCurrency: "USD",
    billRateType: "Hourly",
    purchaseOrder: "PO-2024-0411",
    costCenter: "CC-CB-ARCH-01",
    clientWorkerId: "CB-77302",
    vmsId: "FG-CB-20249",
    invoiceFrequency: "Weekly",
    timesheetMethod: "Fieldglass",
    checks: [
      pass("Bill Rate Configured", "$175/hr approved"),
      pass("Markup Applied", "52% markup confirmed"),
      pass("Purchase Order", "PO-2024-0411 active"),
      pass("Cost Center", "CC-CB-ARCH-01 confirmed"),
      pass("Client Worker ID", "CB-77302 issued"),
      pass("VMS ID", "FG-CB-20249 — Fieldglass active"),
      pass("Invoice Frequency", "Weekly via Fieldglass"),
      pass("Timesheet Method", "Fieldglass configured"),
      pass("Expense Policy", "Cobalt Systems expense policy attached"),
      pass("Billing Entity", "Apex Staffing Partners"),
      pass("Approved Start Date", "Jun 30 confirmed"),
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
    billRate: 82,
    markup: 49,
    billRateCurrency: "USD",
    billRateType: "Hourly",
    purchaseOrder: "PO-2024-0466",
    costCenter: "CC-MH-HC-04",
    invoiceFrequency: "Bi-weekly",
    timesheetMethod: "Portal",
    checks: [
      pass("Bill Rate Configured", "$82/hr approved"),
      pass("Markup Applied", "49% markup confirmed"),
      pass("Purchase Order", "PO-2024-0466 active"),
      pass("Cost Center", "CC-MH-HC-04 confirmed"),
      pending("Client Worker ID", "Meridian HR to issue after I-9 cleared"),
      pass("VMS ID", "Not applicable"),
      pass("Invoice Frequency", "Bi-weekly confirmed"),
      pass("Timesheet Method", "Portal configured"),
      pass("Expense Policy", "Standard Meridian expense policy attached"),
      pass("Billing Entity", "ApTask LLC"),
      pending("Approved Start Date", "Awaiting client worker ID issuance"),
    ],
  },

  // noah-klein — W-2, not-ready (PO expired, client worker ID stale)
  {
    candidateId: "noah-klein",
    candidateName: "Noah Klein",
    client: "Vertex Financial",
    employmentType: "W-2",
    startDate: "Jun 19",
    startInDays: 7,
    overallStatus: "not-ready",
    billRate: 94,
    markup: 52,
    billRateCurrency: "USD",
    billRateType: "Hourly",
    purchaseOrder: "PO-2023-1188",
    costCenter: "CC-VF-FIN-01",
    clientWorkerId: "VF-88119",
    invoiceFrequency: "Weekly",
    timesheetMethod: "Portal",
    checks: [
      pass("Bill Rate Configured", "$94/hr approved"),
      pass("Markup Applied", "52% markup confirmed"),
      fail("Purchase Order", "PO-2023-1188 expired Jun 1 — renewal request outstanding"),
      pass("Cost Center", "CC-VF-FIN-01 confirmed"),
      fail("Client Worker ID", "VF-88119 linked to expired PO — must re-issue"),
      pass("VMS ID", "Not applicable"),
      pass("Invoice Frequency", "Weekly confirmed"),
      pass("Timesheet Method", "Portal configured"),
      pass("Expense Policy", "Vertex standard expense policy attached"),
      pass("Billing Entity", "ApTask LLC"),
      fail("Approved Start Date", "Cannot approve billing start with expired PO"),
    ],
  },

  // fatima-idris — 1099, ready
  {
    candidateId: "fatima-idris",
    candidateName: "Fatima Idris",
    client: "Cobalt Systems",
    employmentType: "1099",
    startDate: "Jul 06",
    startInDays: 24,
    overallStatus: "ready",
    billRate: 132,
    markup: 50,
    billRateCurrency: "USD",
    billRateType: "Hourly",
    purchaseOrder: "PO-2024-0433",
    costCenter: "CC-CB-QA-02",
    clientWorkerId: "CB-77415",
    invoiceFrequency: "Monthly",
    timesheetMethod: "Portal",
    checks: [
      pass("Bill Rate Configured", "$132/hr approved"),
      pass("Markup Applied", "50% markup confirmed"),
      pass("Purchase Order", "PO-2024-0433 active"),
      pass("Cost Center", "CC-CB-QA-02 confirmed"),
      pass("Client Worker ID", "CB-77415 issued"),
      pass("VMS ID", "Not applicable"),
      pass("Invoice Frequency", "Monthly confirmed"),
      pass("Timesheet Method", "Portal configured"),
      pass("Expense Policy", "Cobalt Systems expense policy attached"),
      pass("Billing Entity", "ApTask Corp"),
      pass("Approved Start Date", "Jul 6 confirmed"),
    ],
  },

  // tara-voss — W-2, pending (client worker ID and start date pending)
  {
    candidateId: "tara-voss",
    candidateName: "Tara Voss",
    client: "Meridian Health",
    employmentType: "W-2",
    startDate: "Jun 24",
    startInDays: 12,
    overallStatus: "pending",
    billRate: 75,
    markup: 50,
    billRateCurrency: "USD",
    billRateType: "Hourly",
    purchaseOrder: "PO-2024-0471",
    costCenter: "CC-MH-CARE-03",
    invoiceFrequency: "Bi-weekly",
    timesheetMethod: "Portal",
    checks: [
      pass("Bill Rate Configured", "$75/hr approved"),
      pass("Markup Applied", "50% markup confirmed"),
      pass("Purchase Order", "PO-2024-0471 active"),
      pass("Cost Center", "CC-MH-CARE-03 confirmed"),
      pending("Client Worker ID", "Package awaiting client approval — ID not yet issued"),
      pass("VMS ID", "Not applicable"),
      pass("Invoice Frequency", "Bi-weekly confirmed"),
      pass("Timesheet Method", "Portal configured"),
      pass("Expense Policy", "Standard Meridian expense policy attached"),
      pass("Billing Entity", "ApTask LLC"),
      pending("Approved Start Date", "Client package approval required first"),
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
    billRate: 72,
    markup: 50,
    billRateCurrency: "USD",
    billRateType: "Hourly",
    purchaseOrder: "PO-2024-0419",
    costCenter: "CC-MH-PHARM-01",
    clientWorkerId: "MH-LP-204",
    invoiceFrequency: "Weekly",
    timesheetMethod: "Portal",
    checks: [
      pass("Bill Rate Configured", "$72/hr approved"),
      pass("Markup Applied", "50% markup confirmed"),
      pass("Purchase Order", "PO-2024-0419 active"),
      pass("Cost Center", "CC-MH-PHARM-01 confirmed"),
      pass("Client Worker ID", "MH-LP-204 issued"),
      pass("VMS ID", "Not applicable"),
      pass("Invoice Frequency", "Weekly confirmed"),
      pass("Timesheet Method", "Portal configured"),
      pass("Expense Policy", "Standard Meridian expense policy attached"),
      pass("Billing Entity", "ApTask LLC"),
      pass("Approved Start Date", "Jun 17 confirmed"),
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
    billRate: 158,
    markup: 50,
    billRateCurrency: "USD",
    billRateType: "Hourly",
    purchaseOrder: "PO-2024-0455",
    costCenter: "CC-CB-ENG-03",
    vmsId: undefined,
    invoiceFrequency: "Weekly",
    timesheetMethod: "Fieldglass",
    checks: [
      pass("Bill Rate Configured", "$158/hr approved"),
      pass("Markup Applied", "50% markup confirmed"),
      pass("Purchase Order", "PO-2024-0455 active"),
      pass("Cost Center", "CC-CB-ENG-03 confirmed"),
      pending("Client Worker ID", "Awaiting vendor MSA completion"),
      pending("VMS ID", "Fieldglass record pending MSA signature"),
      pass("Invoice Frequency", "Weekly via Fieldglass"),
      pending("Timesheet Method", "Fieldglass account pending MSA"),
      pass("Expense Policy", "Cobalt Systems expense policy attached"),
      pass("Billing Entity", "Apex Staffing Partners"),
      pending("Approved Start Date", "Billing start gated on MSA and Fieldglass activation"),
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
    billRate: 149,
    markup: 52,
    billRateCurrency: "USD",
    billRateType: "Hourly",
    purchaseOrder: "PO-2024-0495",
    costCenter: "CC-AM-DATA-02",
    clientWorkerId: "AM-90199",
    vmsId: "FG-AM-20251",
    invoiceFrequency: "Weekly",
    timesheetMethod: "Fieldglass",
    checks: [
      pass("Bill Rate Configured", "$149/hr approved"),
      pass("Markup Applied", "52% markup confirmed"),
      pass("Purchase Order", "PO-2024-0495 active"),
      pass("Cost Center", "CC-AM-DATA-02 confirmed"),
      pass("Client Worker ID", "AM-90199 issued"),
      pass("VMS ID", "FG-AM-20251 — Fieldglass active"),
      pass("Invoice Frequency", "Weekly via Fieldglass"),
      pass("Timesheet Method", "Fieldglass configured"),
      pass("Expense Policy", "Atlas standard expense policy attached"),
      pass("Billing Entity", "Apex Staffing Partners"),
      pass("Approved Start Date", "Jun 28 confirmed"),
    ],
  },
];

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export function billingStats(): {
  ready: number;
  notReady: number;
  pending: number;
  criticalGaps: number;
} {
  let ready = 0;
  let notReady = 0;
  let pending = 0;
  let criticalGaps = 0;

  for (const r of BILLING_RECORDS) {
    if (r.overallStatus === "ready") ready++;
    else if (r.overallStatus === "not-ready") notReady++;
    else pending++;

    if (r.overallStatus === "not-ready" && r.startInDays <= 7) criticalGaps++;
  }

  return { ready, notReady, pending, criticalGaps };
}
