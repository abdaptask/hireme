/**
 * Master Data registry — the central lookup tables that populate every
 * configurable dropdown across the platform (CLAUDE.md §2.4, §30, §120,
 * §121.1). Mirrors the persistence shape of saved-views.ts: frozen seed
 * data + a localStorage layer for user overrides + a snapshot cache so
 * useSyncExternalStore consumers don't re-trigger.
 *
 * Storage strategy: one key per category (`hireme.master-data.<id>`) to
 * keep individual writes small. The stored payload contains ONLY user
 * deltas — new values, overrides of presets, and tombstones for soft
 * deletes — merged with `SEED_VALUES` at read time.
 */

/* ---------------------------------------------------------------------------
   Public types
   --------------------------------------------------------------------------- */

export type MasterValue = {
  id: string;
  label: string;
  code?: string;
  active: boolean;
  order: number;
  isPreset: boolean;
  createdAt: number;
  updatedAt: number;
  meta?: Record<string, string>;
};

export type MasterCategory = {
  id: string;
  label: string;
  groupId: string;
  description: string;
  usedIn: string[];
};

export type MasterGroup = {
  id: string;
  label: string;
  description: string;
};

/* ---------------------------------------------------------------------------
   Groups
   --------------------------------------------------------------------------- */

export const MASTER_GROUPS: MasterGroup[] = [
  {
    id: "account-org",
    label: "Account & Org",
    description:
      "Internal organizational structure — owners, departments, divisions, company codes.",
  },
  {
    id: "workforce-status",
    label: "Workforce Status",
    description:
      "Lifecycle status enums that drive pipeline color-coding and filters.",
  },
  {
    id: "payroll-adp",
    label: "Payroll & ADP",
    description:
      "Rate types, pay terms, payment modes, and ADP-specific configuration.",
  },
  {
    id: "compliance-tax",
    label: "Compliance & Tax",
    description:
      "EEO codes, employee classification, filing statuses, work authorization.",
  },
  {
    id: "benefits-insurance",
    label: "Benefits & Insurance",
    description: "Insurance plans, payroll-deduction types, dependent tiers.",
  },
  {
    id: "geography",
    label: "Geography",
    description:
      "Countries, states, currencies, localities, work-site classifications.",
  },
  {
    id: "recruiting",
    label: "Recruiting & Sourcing",
    description:
      "Sourcing channels, job-board accounts, requisition origin, event types.",
  },
  {
    id: "documents",
    label: "Documents & Equipment",
    description:
      "Document reminder cadence, equipment catalog, timesheet templates.",
  },
  {
    id: "reasons",
    label: "Reasons & Justifications",
    description:
      "Reason codes for disable, dropout, termination, start confirmation.",
  },
  {
    id: "vendor-vms",
    label: "Vendor & VMS",
    description: "Approved VMS platforms used by clients and MSP programs.",
  },
];

/* ---------------------------------------------------------------------------
   Categories — exactly 61.
   --------------------------------------------------------------------------- */

export const MASTER_CATEGORIES: MasterCategory[] = [
  // ── Account & Org (14) ─────────────────────────────────────────────────
  {
    id: "account-owner",
    label: "Account Owner",
    groupId: "account-org",
    description: "Internal owner accountable for a client relationship.",
    usedIn: ["Client 360 header", "Pipeline owner filter", "Account routing"],
  },
  {
    id: "account-types",
    label: "Account Types",
    groupId: "account-org",
    description: "Commercial relationship type with the end client.",
    usedIn: ["Client setup wizard", "Assignment classification"],
  },
  {
    id: "class",
    label: "Class",
    groupId: "account-org",
    description: "Strategic tier used for SLA and routing rules.",
    usedIn: ["Client list class column", "SLA matrix"],
  },
  {
    id: "client-roles",
    label: "Client Roles",
    groupId: "account-org",
    description: "Role of a contact within the client organization.",
    usedIn: ["Client contact form", "Communications routing"],
  },
  {
    id: "client-type",
    label: "Client Type",
    groupId: "account-org",
    description: "Whether the client is the end employer, MSP, or vendor.",
    usedIn: ["Client setup", "Package rule evaluation"],
  },
  {
    id: "commission-role",
    label: "Commission Role",
    groupId: "account-org",
    description: "Role used to allocate commission on a placement.",
    usedIn: ["Placement commission split", "Recruiter scorecard"],
  },
  {
    id: "company-code",
    label: "Company Code",
    groupId: "account-org",
    description: "Legal-entity code passed to payroll and accounting.",
    usedIn: ["Payroll setup", "Invoice header", "ADP sync"],
  },
  {
    id: "company-name",
    label: "Company Name",
    groupId: "account-org",
    description: "Legal entity that employs the consultant.",
    usedIn: ["Offer letter", "Employment contract", "W-2 generation"],
  },
  {
    id: "customer-type",
    label: "Customer Type",
    groupId: "account-org",
    description: "Segment used for pricing and reporting cuts.",
    usedIn: ["Client setup", "Executive scorecard segments"],
  },
  {
    id: "department",
    label: "Department",
    groupId: "account-org",
    description: "Internal department a user or consultant belongs to.",
    usedIn: ["User profile", "Consultant 360 header", "Capacity report"],
  },
  {
    id: "division",
    label: "Division",
    groupId: "account-org",
    description: "Practice line or business unit running the assignment.",
    usedIn: ["Recruiter assignment", "Revenue reports"],
  },
  {
    id: "home-department",
    label: "Home Department",
    groupId: "account-org",
    description: "Default department for payroll allocation.",
    usedIn: ["Payroll setup", "GL coding"],
  },
  {
    id: "primary-user-department",
    label: "Primary User Department",
    groupId: "account-org",
    description: "Department a user reports to for access provisioning.",
    usedIn: ["User provisioning", "Role assignment"],
  },
  {
    id: "support-department",
    label: "Support Department",
    groupId: "account-org",
    description: "Routing target for support tickets and escalations.",
    usedIn: ["Help center routing", "Exception escalation"],
  },

  // ── Workforce Status (8) ───────────────────────────────────────────────
  {
    id: "consultant-main-status",
    label: "Consultant Main Status",
    groupId: "workforce-status",
    description: "Top-level lifecycle bucket for a consultant.",
    usedIn: ["Consultant 360 header", "Workforce filter"],
  },
  {
    id: "consultant-sub-status",
    label: "Consultant Sub-Status",
    groupId: "workforce-status",
    description: "Detailed sub-state inside a main lifecycle bucket.",
    usedIn: ["Consultant 360 status pill", "Pipeline drill-down"],
  },
  {
    id: "job-statuses",
    label: "Job Statuses",
    groupId: "workforce-status",
    description: "High-level requisition state.",
    usedIn: ["Jobs board", "Recruiter funnel"],
  },
  {
    id: "job-sub-statuses",
    label: "Job Sub-Statuses",
    groupId: "workforce-status",
    description: "Sub-stage of a requisition.",
    usedIn: ["Recruiter pipeline", "Submission drill-down"],
  },
  {
    id: "user-status",
    label: "User Status",
    groupId: "workforce-status",
    description: "Account state for internal and external users.",
    usedIn: ["Admin user list", "Login gate"],
  },
  {
    id: "user-type",
    label: "User Type",
    groupId: "workforce-status",
    description: "Type of system user — internal, client, vendor, service.",
    usedIn: ["Admin user list", "Permission matrix"],
  },
  {
    id: "work-status",
    label: "Work Status",
    groupId: "workforce-status",
    description: "Active working state used by payroll and time tracking.",
    usedIn: ["Timesheet eligibility", "Payroll readiness"],
  },
  {
    id: "zeal-state-status",
    label: "Zeal State Status",
    groupId: "workforce-status",
    description: "Per-state Zeal payroll registration eligibility.",
    usedIn: ["Payroll readiness gate", "State expansion checklist"],
  },

  // ── Payroll & ADP (11) ─────────────────────────────────────────────────
  {
    id: "adp-configuration",
    label: "ADP Configuration",
    groupId: "payroll-adp",
    description: "ADP platform variant the company is wired to.",
    usedIn: ["Payroll setup wizard", "Integration health"],
  },
  {
    id: "adp-departments",
    label: "ADP Departments",
    groupId: "payroll-adp",
    description: "Department codes synced to ADP for GL allocation.",
    usedIn: ["Payroll department mapping", "ADP sync"],
  },
  {
    id: "bill-rate-types",
    label: "Bill Rate Types",
    groupId: "payroll-adp",
    description: "Unit basis on which the client is billed.",
    usedIn: ["Assignment setup", "Invoice calculation"],
  },
  {
    id: "calculator",
    label: "Calculator",
    groupId: "payroll-adp",
    description: "Pay/bill calculator profile applied to a placement.",
    usedIn: ["Rate sheet", "Margin calculator"],
  },
  {
    id: "pay-rate-types",
    label: "Pay Rate Types",
    groupId: "payroll-adp",
    description: "Unit basis on which the consultant is paid.",
    usedIn: ["Offer letter", "Payroll setup"],
  },
  {
    id: "pay-terms",
    label: "Pay Terms",
    groupId: "payroll-adp",
    description: "Payment-cycle terms for consultants and vendors.",
    usedIn: ["Vendor agreement", "Payroll setup"],
  },
  {
    id: "payment-modes",
    label: "Payment Modes",
    groupId: "payroll-adp",
    description: "How a consultant receives wages.",
    usedIn: ["Direct deposit form", "Payroll readiness"],
  },
  {
    id: "payment-terms",
    label: "Payment Terms",
    groupId: "payroll-adp",
    description: "Client-side invoice payment terms.",
    usedIn: ["Client billing setup", "AR aging"],
  },
  {
    id: "salary-base",
    label: "Salary Base",
    groupId: "payroll-adp",
    description: "Base period used to quote compensation.",
    usedIn: ["Offer letter", "Rate sheet"],
  },
  {
    id: "ot-eligible",
    label: "OT Eligible",
    groupId: "payroll-adp",
    description: "Overtime eligibility flag (FLSA classification).",
    usedIn: ["Offer letter", "Timesheet rules"],
  },
  {
    id: "we-day",
    label: "Week Ending Day",
    groupId: "payroll-adp",
    description: "Day of the week timesheets close.",
    usedIn: ["Timesheet template", "Payroll cycle"],
  },

  // ── Compliance & Tax (6) ───────────────────────────────────────────────
  {
    id: "eeo-answer",
    label: "EEO Answer",
    groupId: "compliance-tax",
    description: "EEO-1 self-identification responses.",
    usedIn: ["Onboarding profile form", "EEO-1 report"],
  },
  {
    id: "employee-type",
    label: "Employee Type",
    groupId: "compliance-tax",
    description: "Tax/employment classification for the worker.",
    usedIn: ["Assignment setup", "Package generation"],
  },
  {
    id: "federal-filing-status",
    label: "Federal Filing Status",
    groupId: "compliance-tax",
    description: "W-4 federal filing status options.",
    usedIn: ["W-4 form", "Payroll setup"],
  },
  {
    id: "state-filing-status",
    label: "State Filing Status",
    groupId: "compliance-tax",
    description: "State withholding filing status options.",
    usedIn: ["State withholding forms", "Payroll setup"],
  },
  {
    id: "naics-workers-comp",
    label: "NAICS / Workers' Comp",
    groupId: "compliance-tax",
    description: "NAICS code used for workers' compensation classification.",
    usedIn: ["Client setup", "Workers' comp filing"],
  },
  {
    id: "work-authorisation",
    label: "Work Authorisation",
    groupId: "compliance-tax",
    description: "Worker visa / authorization status.",
    usedIn: ["Candidate profile", "Package rules", "I-9 / E-Verify"],
  },

  // ── Benefits & Insurance (4) ───────────────────────────────────────────
  {
    id: "insurance-payroll-type",
    label: "Insurance Payroll Type",
    groupId: "benefits-insurance",
    description: "Tax treatment of an insurance payroll deduction.",
    usedIn: ["Deduction setup", "Payroll ledger"],
  },
  {
    id: "insurance-plan",
    label: "Insurance Plan",
    groupId: "benefits-insurance",
    description: "Benefits plans available for enrollment.",
    usedIn: ["Benefits enrollment", "Open enrollment workflow"],
  },
  {
    id: "insurance-plan-for",
    label: "Insurance Plan For",
    groupId: "benefits-insurance",
    description: "Dependent coverage tier.",
    usedIn: ["Benefits enrollment", "Premium calculation"],
  },
  {
    id: "pipl-plans",
    label: "PIPL Plans",
    groupId: "benefits-insurance",
    description: "Privacy/insurance plan variants by jurisdiction.",
    usedIn: ["Plan assignment", "State compliance"],
  },

  // ── Geography (6) ──────────────────────────────────────────────────────
  {
    id: "countries",
    label: "Countries",
    groupId: "geography",
    description: "ISO countries used for addresses and tax jurisdiction.",
    usedIn: ["Address forms", "Tax setup", "Compliance rules"],
  },
  {
    id: "currencies",
    label: "Currencies",
    groupId: "geography",
    description: "ISO currency codes used for billing.",
    usedIn: ["Rate sheet", "Invoice generation"],
  },
  {
    id: "states",
    label: "States (US)",
    groupId: "geography",
    description: "US states used for tax and compliance.",
    usedIn: ["Address forms", "State tax setup", "Compliance rules"],
  },
  {
    id: "locality",
    label: "Locality",
    groupId: "geography",
    description: "Metro market the assignment sits in.",
    usedIn: ["Assignment setup", "Locality pay rules"],
  },
  {
    id: "locations",
    label: "Locations",
    groupId: "geography",
    description: "Internal office and hub locations.",
    usedIn: ["User profile", "Equipment shipping"],
  },
  {
    id: "work-site",
    label: "Work Site",
    groupId: "geography",
    description: "Work arrangement — onsite, remote, hybrid pattern.",
    usedIn: ["Assignment setup", "Package rules", "Equipment"],
  },

  // ── Recruiting (4) ─────────────────────────────────────────────────────
  {
    id: "contact-sources",
    label: "Contact Sources",
    groupId: "recruiting",
    description: "Where a candidate originated from.",
    usedIn: ["Candidate profile", "Source-of-hire report"],
  },
  {
    id: "job-portal-account-name",
    label: "Job Portal Account Name",
    groupId: "recruiting",
    description: "Mailbox/account used to post jobs externally.",
    usedIn: ["Job posting workflow", "ATS integration"],
  },
  {
    id: "job-sources",
    label: "Job Sources",
    groupId: "recruiting",
    description: "Origin channel for a requisition.",
    usedIn: ["Job intake form", "Client funnel report"],
  },
  {
    id: "event-types",
    label: "Event Types",
    groupId: "recruiting",
    description: "Recruiting event categories used for tracking spend.",
    usedIn: ["Events calendar", "Source-of-hire report"],
  },

  // ── Documents & Equipment (3) ──────────────────────────────────────────
  {
    id: "doc-reminders",
    label: "Document Reminders",
    groupId: "documents",
    description: "Cadence options for expiration reminders.",
    usedIn: ["Document setup", "Compliance reminders"],
  },
  {
    id: "equipment",
    label: "Equipment Catalog",
    groupId: "documents",
    description: "Catalog of equipment that can be provisioned.",
    usedIn: ["Equipment request", "IT provisioning"],
  },
  {
    id: "timesheet-template-options",
    label: "Timesheet Template Options",
    groupId: "documents",
    description: "Pre-built timesheet templates to assign to assignments.",
    usedIn: ["Assignment setup", "Timesheet engine"],
  },

  // ── Reasons (4) ────────────────────────────────────────────────────────
  {
    id: "reasons-for-disable",
    label: "Reasons for Disable",
    groupId: "reasons",
    description: "Justification codes when disabling an account.",
    usedIn: ["User deactivation modal", "Audit log"],
  },
  {
    id: "reasons-for-dropout",
    label: "Reasons for Dropout",
    groupId: "reasons",
    description: "Reason a candidate dropped out of onboarding.",
    usedIn: ["Drop-off form", "Recruiter scorecard", "Dropout report"],
  },
  {
    id: "reasons-for-termination",
    label: "Reasons for Termination",
    groupId: "reasons",
    description: "Reason an assignment ended.",
    usedIn: ["Offboarding workflow", "Retention report"],
  },
  {
    id: "start-confirm-reason",
    label: "Start Confirm Reason",
    groupId: "reasons",
    description: "How a Day-1 start was confirmed.",
    usedIn: ["Day-1 confirmation task", "Start success report"],
  },

  // ── Vendor / VMS (1) ───────────────────────────────────────────────────
  {
    id: "vms-names",
    label: "VMS Names",
    groupId: "vendor-vms",
    description: "Approved VMS platforms used by clients.",
    usedIn: ["Client setup", "Integration setup"],
  },
];

/* ---------------------------------------------------------------------------
   Seed values — raw (label / optional code / optional meta).
   Frozen at module load. getMasterValues() merges with persisted overrides.
   --------------------------------------------------------------------------- */

type SeedValue = {
  label: string;
  code?: string;
  meta?: Record<string, string>;
};

const SEED_RAW: Record<string, SeedValue[]> = {
  // ── Account & Org ───────────────────────────────────────────────────────
  "account-owner": [
    { label: "Devon Hughes" },
    { label: "Priya Shah" },
    { label: "Alex Castellanos" },
    { label: "Sarah Mendes" },
    { label: "Jordan Reed" },
  ],
  "account-types": [
    { label: "Direct Hire" },
    { label: "Contract" },
    { label: "Contract-to-Hire" },
    { label: "Staffing Augmentation" },
  ],
  class: [
    { label: "Standard" },
    { label: "Strategic" },
    { label: "Pilot" },
    { label: "Legacy" },
  ],
  "client-roles": [
    { label: "Primary Contact" },
    { label: "Technical Contact" },
    { label: "Billing Contact" },
    { label: "HR Contact" },
    { label: "Executive Sponsor" },
    { label: "Procurement" },
  ],
  "client-type": [
    { label: "End Client" },
    { label: "MSP" },
    { label: "Vendor" },
    { label: "Partner" },
    { label: "Subsidiary" },
  ],
  "commission-role": [
    { label: "Account Manager" },
    { label: "Recruiter" },
    { label: "Sourcer" },
    { label: "Sales Director" },
    { label: "BD Manager" },
  ],
  "company-code": [
    { label: "ApTask LLC (US)", code: "APT-US-01" },
    { label: "ApTask Canada Inc.", code: "APT-CA-01" },
    { label: "ApTask India Pvt Ltd", code: "APT-IN-01" },
  ],
  "company-name": [
    { label: "ApTask LLC" },
    { label: "ApTask Canada Inc." },
    { label: "ApTask India Pvt Ltd" },
  ],
  "customer-type": [
    { label: "Enterprise" },
    { label: "Mid-Market" },
    { label: "SMB" },
    { label: "Government" },
    { label: "Non-Profit" },
  ],
  department: [
    { label: "Engineering" },
    { label: "Data" },
    { label: "Product" },
    { label: "Sales" },
    { label: "Operations" },
    { label: "Finance" },
    { label: "HR" },
    { label: "Legal" },
    { label: "Marketing" },
    { label: "Customer Success" },
  ],
  division: [
    { label: "Tech Staffing" },
    { label: "Healthcare Staffing" },
    { label: "Finance Staffing" },
    { label: "Engineering Staffing" },
    { label: "Direct Hire" },
    { label: "Conversion" },
  ],
  "home-department": [
    { label: "HQ Operations" },
    { label: "Field Operations" },
    { label: "Remote Workforce" },
    { label: "Client-Site" },
  ],
  "primary-user-department": [
    { label: "Engineering" },
    { label: "Data" },
    { label: "Product" },
    { label: "Sales" },
    { label: "Operations" },
    { label: "Finance" },
    { label: "HR" },
    { label: "Legal" },
    { label: "Marketing" },
    { label: "Customer Success" },
  ],
  "support-department": [
    { label: "IT Support" },
    { label: "HR Support" },
    { label: "Payroll Support" },
    { label: "Compliance Support" },
    { label: "Account Management" },
  ],

  // ── Workforce Status ────────────────────────────────────────────────────
  "consultant-main-status": [
    { label: "Active" },
    { label: "Bench" },
    { label: "Extension Pending" },
    { label: "Offboarding" },
    { label: "Converted" },
    { label: "Former" },
    { label: "Ineligible" },
  ],
  "consultant-sub-status": [
    { label: "On Assignment" },
    { label: "Pending Start" },
    { label: "Awaiting Approval" },
    { label: "Documentation" },
    { label: "Standby" },
    { label: "Resigned" },
    { label: "Terminated" },
  ],
  "job-statuses": [
    { label: "Open" },
    { label: "In Progress" },
    { label: "Filled" },
    { label: "On Hold" },
    { label: "Cancelled" },
    { label: "Closed" },
  ],
  "job-sub-statuses": [
    { label: "Sourcing" },
    { label: "Submitting" },
    { label: "Interviewing" },
    { label: "Offer Pending" },
    { label: "Background" },
    { label: "Onboarding" },
    { label: "Started" },
  ],
  "user-status": [
    { label: "Active" },
    { label: "Inactive" },
    { label: "Suspended" },
    { label: "Locked" },
    { label: "Pending Activation" },
  ],
  "user-type": [
    { label: "Internal" },
    { label: "Contractor" },
    { label: "Consultant" },
    { label: "Client User" },
    { label: "Vendor User" },
    { label: "System" },
  ],
  "work-status": [
    { label: "Working" },
    { label: "On Leave" },
    { label: "PTO" },
    { label: "Sick" },
    { label: "Terminated" },
    { label: "Pending Start" },
  ],
  "zeal-state-status": [
    { label: "Eligible" },
    { label: "Not Eligible" },
    { label: "Pending Review" },
    { label: "Approved" },
    { label: "Rejected" },
  ],

  // ── Payroll & ADP ───────────────────────────────────────────────────────
  "adp-configuration": [
    { label: "WFN Standard" },
    { label: "WFN Custom" },
    { label: "RUN Powered by ADP" },
    { label: "ADP Vantage" },
  ],
  "adp-departments": [
    { label: "Engineering", code: "Eng-100" },
    { label: "Sales", code: "Sales-200" },
    { label: "Operations", code: "Ops-300" },
    { label: "HR", code: "HR-400" },
    { label: "Finance", code: "Finance-500" },
  ],
  "bill-rate-types": [
    { label: "Hourly" },
    { label: "Daily" },
    { label: "Weekly" },
    { label: "Monthly" },
    { label: "Per Diem" },
    { label: "Fixed Project" },
  ],
  calculator: [
    { label: "Standard W-2" },
    { label: "C2C Markup" },
    { label: "1099 Pass-through" },
    { label: "Fixed-bid" },
  ],
  "pay-rate-types": [
    { label: "Hourly" },
    { label: "Daily" },
    { label: "Weekly" },
    { label: "Bi-weekly" },
    { label: "Monthly" },
    { label: "Annual" },
  ],
  "pay-terms": [
    { label: "Net 7" },
    { label: "Net 15" },
    { label: "Net 30" },
    { label: "Net 45" },
    { label: "Net 60" },
  ],
  "payment-modes": [
    { label: "Direct Deposit" },
    { label: "Pay Card" },
    { label: "Check" },
    { label: "Wire Transfer" },
    { label: "ACH" },
  ],
  "payment-terms": [
    { label: "Net 30 Standard" },
    { label: "Net 45 Extended" },
    { label: "2/10 Net 30" },
    { label: "Due on Receipt" },
    { label: "Net 60 Strategic" },
  ],
  "salary-base": [
    { label: "Annual" },
    { label: "Monthly" },
    { label: "Hourly" },
  ],
  "ot-eligible": [
    { label: "Yes" },
    { label: "No" },
    { label: "Conditional" },
  ],
  "we-day": [
    { label: "Friday", code: "5" },
    { label: "Saturday", code: "6" },
    { label: "Sunday", code: "0" },
  ],

  // ── Compliance & Tax ────────────────────────────────────────────────────
  "eeo-answer": [
    { label: "Decline to Self-Identify" },
    { label: "Hispanic or Latino" },
    { label: "White (Not Hispanic or Latino)" },
    { label: "Black or African American (Not Hispanic or Latino)" },
    { label: "Native Hawaiian or Other Pacific Islander" },
    { label: "Asian" },
    { label: "American Indian or Alaska Native" },
    { label: "Two or More Races" },
  ],
  "employee-type": [
    { label: "W-2 Full-time" },
    { label: "W-2 Part-time" },
    { label: "1099 Independent Contractor" },
    { label: "C2C (Corp-to-Corp)" },
    { label: "Intern" },
    { label: "Temporary" },
  ],
  "federal-filing-status": [
    { label: "Single" },
    { label: "Married Filing Jointly" },
    { label: "Married Filing Separately" },
    { label: "Head of Household" },
    { label: "Qualifying Widow(er)" },
  ],
  "state-filing-status": [
    { label: "Single" },
    { label: "Married" },
    { label: "Married Filing Separately" },
    { label: "Head of Household" },
  ],
  "naics-workers-comp": [
    { label: "Computer Systems Design", code: "541512" },
    { label: "Custom Programming", code: "541511" },
    { label: "Engineering Services", code: "541330" },
    { label: "Healthcare Practitioners", code: "621399" },
    { label: "Commercial Banking", code: "522110" },
  ],
  "work-authorisation": [
    { label: "US Citizen" },
    { label: "Green Card" },
    { label: "H-1B" },
    { label: "H-1B Transfer" },
    { label: "L-1" },
    { label: "TN" },
    { label: "OPT" },
    { label: "OPT STEM Extension" },
    { label: "GC EAD" },
    { label: "H-4 EAD" },
    { label: "Other" },
  ],

  // ── Benefits & Insurance ────────────────────────────────────────────────
  "insurance-payroll-type": [
    { label: "Pre-Tax" },
    { label: "Post-Tax" },
    { label: "FSA" },
    { label: "HSA" },
    { label: "Section 125" },
  ],
  "insurance-plan": [
    { label: "PPO Premium" },
    { label: "PPO Standard" },
    { label: "HMO" },
    { label: "HDHP with HSA" },
    { label: "Dental Premium" },
    { label: "Dental Standard" },
    { label: "Vision" },
    { label: "Short-Term Disability" },
    { label: "Long-Term Disability" },
    { label: "Life Insurance" },
  ],
  "insurance-plan-for": [
    { label: "Employee Only" },
    { label: "Employee + Spouse" },
    { label: "Employee + Children" },
    { label: "Family" },
    { label: "Domestic Partner" },
  ],
  "pipl-plans": [
    { label: "California PIPL Compliant" },
    { label: "Texas Standard" },
    { label: "New York Compliant" },
    { label: "Federal Default" },
  ],

  // ── Geography ───────────────────────────────────────────────────────────
  countries: [
    { label: "United States", code: "US" },
    { label: "Canada", code: "CA" },
    { label: "United Kingdom", code: "GB" },
    { label: "India", code: "IN" },
    { label: "Mexico", code: "MX" },
    { label: "Germany", code: "DE" },
    { label: "France", code: "FR" },
    { label: "Spain", code: "ES" },
    { label: "Brazil", code: "BR" },
    { label: "Australia", code: "AU" },
    { label: "Japan", code: "JP" },
    { label: "China", code: "CN" },
    { label: "Singapore", code: "SG" },
    { label: "United Arab Emirates", code: "AE" },
    { label: "Netherlands", code: "NL" },
    { label: "Ireland", code: "IE" },
    { label: "Poland", code: "PL" },
    { label: "Philippines", code: "PH" },
    { label: "South Africa", code: "ZA" },
    { label: "Argentina", code: "AR" },
  ],
  currencies: [
    { label: "US Dollar", code: "USD" },
    { label: "Canadian Dollar", code: "CAD" },
    { label: "British Pound", code: "GBP" },
    { label: "Euro", code: "EUR" },
    { label: "Indian Rupee", code: "INR" },
    { label: "Australian Dollar", code: "AUD" },
    { label: "Japanese Yen", code: "JPY" },
    { label: "Chinese Yuan", code: "CNY" },
    { label: "Mexican Peso", code: "MXN" },
    { label: "Brazilian Real", code: "BRL" },
    { label: "Singapore Dollar", code: "SGD" },
    { label: "UAE Dirham", code: "AED" },
  ],
  states: [
    { label: "Alabama", code: "AL" },
    { label: "Alaska", code: "AK" },
    { label: "Arizona", code: "AZ" },
    { label: "Arkansas", code: "AR" },
    { label: "California", code: "CA" },
    { label: "Colorado", code: "CO" },
    { label: "Connecticut", code: "CT" },
    { label: "Delaware", code: "DE" },
    { label: "Florida", code: "FL" },
    { label: "Georgia", code: "GA" },
    { label: "Hawaii", code: "HI" },
    { label: "Idaho", code: "ID" },
    { label: "Illinois", code: "IL" },
    { label: "Indiana", code: "IN" },
    { label: "Iowa", code: "IA" },
    { label: "Kansas", code: "KS" },
    { label: "Kentucky", code: "KY" },
    { label: "Louisiana", code: "LA" },
    { label: "Maine", code: "ME" },
    { label: "Maryland", code: "MD" },
    { label: "Massachusetts", code: "MA" },
    { label: "Michigan", code: "MI" },
    { label: "Minnesota", code: "MN" },
    { label: "Mississippi", code: "MS" },
    { label: "Missouri", code: "MO" },
    { label: "Montana", code: "MT" },
    { label: "Nebraska", code: "NE" },
    { label: "Nevada", code: "NV" },
    { label: "New Hampshire", code: "NH" },
    { label: "New Jersey", code: "NJ" },
    { label: "New Mexico", code: "NM" },
    { label: "New York", code: "NY" },
    { label: "North Carolina", code: "NC" },
    { label: "North Dakota", code: "ND" },
    { label: "Ohio", code: "OH" },
    { label: "Oklahoma", code: "OK" },
    { label: "Oregon", code: "OR" },
    { label: "Pennsylvania", code: "PA" },
    { label: "Rhode Island", code: "RI" },
    { label: "South Carolina", code: "SC" },
    { label: "South Dakota", code: "SD" },
    { label: "Tennessee", code: "TN" },
    { label: "Texas", code: "TX" },
    { label: "Utah", code: "UT" },
    { label: "Vermont", code: "VT" },
    { label: "Virginia", code: "VA" },
    { label: "Washington", code: "WA" },
    { label: "West Virginia", code: "WV" },
    { label: "Wisconsin", code: "WI" },
    { label: "Wyoming", code: "WY" },
  ],
  locality: [
    { label: "NYC Metro" },
    { label: "Bay Area" },
    { label: "DC Metro" },
    { label: "Chicagoland" },
    { label: "DFW Metro" },
    { label: "LA Metro" },
    { label: "Boston Metro" },
    { label: "Seattle Metro" },
    { label: "Atlanta Metro" },
    { label: "Houston Metro" },
    { label: "Denver Metro" },
    { label: "Austin Metro" },
    { label: "Philly Metro" },
    { label: "Phoenix Metro" },
    { label: "Toronto Metro" },
  ],
  locations: [
    { label: "HQ - New York" },
    { label: "Hub - Austin" },
    { label: "Hub - Chicago" },
    { label: "Remote-US" },
    { label: "Remote-International" },
  ],
  "work-site": [
    { label: "On-site at Client" },
    { label: "Remote" },
    { label: "Hybrid 2-day" },
    { label: "Hybrid 3-day" },
    { label: "Onsite at HQ" },
  ],

  // ── Recruiting ──────────────────────────────────────────────────────────
  "contact-sources": [
    { label: "LinkedIn" },
    { label: "Referral - Employee" },
    { label: "Referral - Client" },
    { label: "Indeed" },
    { label: "Dice" },
    { label: "Monster" },
    { label: "Direct Application" },
    { label: "Recruiter Outreach" },
    { label: "Job Fair" },
    { label: "Career Site" },
  ],
  "job-portal-account-name": [
    { label: "jobs@aptask.com" },
    { label: "careers@aptask.com" },
    { label: "recruiting@aptask.com" },
  ],
  "job-sources": [
    { label: "Direct Client" },
    { label: "MSP - Beeline" },
    { label: "MSP - Fieldglass" },
    { label: "MSP - Magnit" },
    { label: "VMS - VectorVMS" },
    { label: "Partner Referral" },
    { label: "Internal Conversion" },
  ],
  "event-types": [
    { label: "Job Fair" },
    { label: "Hackathon" },
    { label: "Campus Recruiting" },
    { label: "Networking Event" },
    { label: "Industry Conference" },
    { label: "Open House" },
    { label: "Webinar" },
  ],

  // ── Documents & Equipment ───────────────────────────────────────────────
  "doc-reminders": [
    { label: "30 days before expiration" },
    { label: "60 days before expiration" },
    { label: "90 days before expiration" },
    { label: "Day of expiration" },
    { label: "Custom" },
  ],
  equipment: [
    { label: "Laptop - Standard" },
    { label: "Laptop - Engineering" },
    { label: 'Monitor - 27"' },
    { label: 'Monitor - 32"' },
    { label: "Headset" },
    { label: "Mobile Phone" },
    { label: "Security Token" },
    { label: "Keyboard" },
    { label: "Mouse" },
    { label: "Docking Station" },
    { label: "Webcam" },
  ],
  "timesheet-template-options": [
    { label: "Bi-weekly Standard" },
    { label: "Weekly Standard" },
    { label: "Monthly Project" },
    { label: "Daily Approval" },
    { label: "Custom Project" },
  ],

  // ── Reasons ─────────────────────────────────────────────────────────────
  "reasons-for-disable": [
    { label: "No longer employed" },
    { label: "Privacy request (GDPR)" },
    { label: "Compliance hold" },
    { label: "Duplicate account" },
    { label: "Test account" },
    { label: "User requested deactivation" },
  ],
  "reasons-for-dropout": [
    { label: "Counter-offer accepted" },
    { label: "Backed out — compensation" },
    { label: "Backed out — relocation" },
    { label: "Background check failed" },
    { label: "Drug test failed" },
    { label: "Document fraud detected" },
    { label: "Personal/family" },
    { label: "Unresponsive" },
    { label: "Better opportunity" },
  ],
  "reasons-for-termination": [
    { label: "End of Contract" },
    { label: "Mutual Agreement" },
    { label: "Performance" },
    { label: "Reduction in Force" },
    { label: "Resignation" },
    { label: "Client Termination" },
    { label: "Misconduct" },
    { label: "Job Abandonment" },
    { label: "Conversion to FTE" },
    { label: "Health/Personal" },
  ],
  "start-confirm-reason": [
    { label: "Day-1 attendance confirmed" },
    { label: "Manager confirmed" },
    { label: "Self-confirmed via portal" },
    { label: "Equipment delivered + acknowledged" },
    { label: "Badge + access verified" },
    { label: "Manual override" },
  ],

  // ── Vendor / VMS ────────────────────────────────────────────────────────
  "vms-names": [
    { label: "SAP Fieldglass" },
    { label: "Beeline" },
    { label: "Magnit" },
    { label: "Vndly" },
    { label: "VectorVMS" },
    { label: "Wand" },
    { label: "Stafftrack" },
  ],
};

/** Frozen, fully-shaped seed values per category. */
const SEED_VALUES: Readonly<Record<string, readonly MasterValue[]>> = (() => {
  const out: Record<string, MasterValue[]> = {};
  for (const cat of MASTER_CATEGORIES) {
    const raw = SEED_RAW[cat.id] ?? [];
    out[cat.id] = raw.map((v, i) => ({
      id: `preset:${cat.id}:${i}`,
      label: v.label,
      code: v.code,
      active: true,
      order: i,
      isPreset: true,
      createdAt: 0,
      updatedAt: 0,
      meta: v.meta,
    }));
    Object.freeze(out[cat.id]);
  }
  return Object.freeze(out);
})();

/* ---------------------------------------------------------------------------
   Persistence — one localStorage key per category. The stored payload holds
   ONLY user deltas: overrides of preset rows (same id, modified fields),
   new user rows, and tombstones for hard-deleted user rows. Soft-deletes
   are represented as overrides with active=false.
   --------------------------------------------------------------------------- */

const STORAGE_PREFIX = "hireme.master-data.";

function storageKey(categoryId: string): string {
  return `${STORAGE_PREFIX}${categoryId}`;
}

type StoredDelta = {
  // Overrides keyed by id (covers preset overrides + user values).
  // A user-added row is just an override whose id isn't a preset id.
  overrides: Record<string, MasterValue>;
  // Ids of user values that have been hard-deleted (so we don't re-emit them).
  // Presets cannot be hard-deleted, only soft-deleted via an override row.
  tombstones: string[];
};

const EMPTY_DELTA: StoredDelta = { overrides: {}, tombstones: [] };

function readDelta(categoryId: string): StoredDelta {
  if (typeof window === "undefined") return EMPTY_DELTA;
  try {
    const raw = localStorage.getItem(storageKey(categoryId));
    if (!raw) return EMPTY_DELTA;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return EMPTY_DELTA;
    return {
      overrides:
        parsed.overrides && typeof parsed.overrides === "object"
          ? (parsed.overrides as Record<string, MasterValue>)
          : {},
      tombstones: Array.isArray(parsed.tombstones)
        ? (parsed.tombstones as string[])
        : [],
    };
  } catch {
    return EMPTY_DELTA;
  }
}

function writeDelta(categoryId: string, delta: StoredDelta): void {
  if (typeof window === "undefined") return;
  try {
    // If the delta is empty, drop the key entirely.
    if (
      Object.keys(delta.overrides).length === 0 &&
      delta.tombstones.length === 0
    ) {
      localStorage.removeItem(storageKey(categoryId));
    } else {
      localStorage.setItem(storageKey(categoryId), JSON.stringify(delta));
    }
  } catch {
    /* storage unavailable — best effort */
  }
  invalidateSnapshotCache(categoryId);
  window.dispatchEvent(new Event(`ls:${storageKey(categoryId)}`));
}

/* ---------------------------------------------------------------------------
   Snapshot cache — keep stable references for useSyncExternalStore consumers.
   --------------------------------------------------------------------------- */

const valuesSnapshotCache = new Map<string, MasterValue[]>();
const activeSnapshotCache = new Map<string, MasterValue[]>();

function invalidateSnapshotCache(categoryId?: string) {
  if (categoryId) {
    valuesSnapshotCache.delete(categoryId);
    activeSnapshotCache.delete(categoryId);
  } else {
    valuesSnapshotCache.clear();
    activeSnapshotCache.clear();
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === null) {
      invalidateSnapshotCache();
      return;
    }
    if (e.key.startsWith(STORAGE_PREFIX)) {
      invalidateSnapshotCache(e.key.slice(STORAGE_PREFIX.length));
    }
  });
}

/* ---------------------------------------------------------------------------
   Public API
   --------------------------------------------------------------------------- */

/** Merged seed + user values for a category. Active first, then inactive,
 *  both sorted by `order` (then by label as tiebreaker). */
export function getMasterValues(categoryId: string): MasterValue[] {
  const cached = valuesSnapshotCache.get(categoryId);
  if (cached) return cached;

  const seeds = SEED_VALUES[categoryId] ?? [];
  const delta = readDelta(categoryId);
  const tombstoned = new Set(delta.tombstones);

  // Start with presets, applying overrides where present.
  const merged: MasterValue[] = [];
  for (const seed of seeds) {
    const override = delta.overrides[seed.id];
    if (override) {
      merged.push({ ...seed, ...override, isPreset: true, id: seed.id });
    } else {
      merged.push(seed);
    }
  }
  // Then user-added values (overrides whose id isn't a preset id).
  for (const [id, val] of Object.entries(delta.overrides)) {
    if (id.startsWith(`preset:${categoryId}:`)) continue;
    if (tombstoned.has(id)) continue;
    merged.push({ ...val, isPreset: false });
  }

  const sortFn = (a: MasterValue, b: MasterValue) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    if (a.order !== b.order) return a.order - b.order;
    return a.label.localeCompare(b.label);
  };
  merged.sort(sortFn);

  valuesSnapshotCache.set(categoryId, merged);
  return merged;
}

/** Active subset — what dropdowns should render. */
export function getActiveMasterValues(categoryId: string): MasterValue[] {
  const cached = activeSnapshotCache.get(categoryId);
  if (cached) return cached;
  const result = getMasterValues(categoryId).filter((v) => v.active);
  activeSnapshotCache.set(categoryId, result);
  return result;
}

/**
 * Insert or update a value.
 * - For preset ids, we store an override (label / code / order / active / meta).
 *   The id and isPreset flag are preserved.
 * - For user ids, the full row is stored.
 * - If a write would equal the seed exactly, the override is dropped to
 *   keep the delta payload small.
 */
export function saveMasterValue(
  categoryId: string,
  value: MasterValue,
): MasterValue {
  const delta = readDelta(categoryId);
  const now = Date.now();
  const next: MasterValue = {
    ...value,
    isPreset: value.id.startsWith(`preset:${categoryId}:`),
    updatedAt: now,
    createdAt: value.createdAt || (value.isPreset ? 0 : now),
  };

  if (next.isPreset) {
    const seed = (SEED_VALUES[categoryId] ?? []).find((s) => s.id === next.id);
    if (
      seed &&
      seed.label === next.label &&
      seed.code === next.code &&
      seed.order === next.order &&
      seed.active === next.active &&
      JSON.stringify(seed.meta ?? null) === JSON.stringify(next.meta ?? null)
    ) {
      // Override is identical to seed — drop it.
      delete delta.overrides[next.id];
    } else {
      delta.overrides[next.id] = next;
    }
  } else {
    delta.overrides[next.id] = next;
    // If it was previously tombstoned, un-tombstone it.
    delta.tombstones = delta.tombstones.filter((t) => t !== next.id);
  }

  writeDelta(categoryId, delta);
  return next;
}

/**
 * Delete a value.
 * - Presets: only soft-delete (sets active=false via an override). Hard-deleting
 *   a preset is a no-op so seeds remain restorable via resetMasterCategory().
 * - User values: soft-delete by default; pass `hard=true` to remove entirely.
 */
export function deleteMasterValue(
  categoryId: string,
  id: string,
  hard: boolean = false,
): void {
  const isPreset = id.startsWith(`preset:${categoryId}:`);
  const delta = readDelta(categoryId);

  if (isPreset) {
    const seed = (SEED_VALUES[categoryId] ?? []).find((s) => s.id === id);
    if (!seed) return;
    delta.overrides[id] = {
      ...seed,
      ...delta.overrides[id],
      active: false,
      updatedAt: Date.now(),
    };
    writeDelta(categoryId, delta);
    return;
  }

  if (hard) {
    delete delta.overrides[id];
    if (!delta.tombstones.includes(id)) delta.tombstones.push(id);
  } else {
    const existing = delta.overrides[id];
    if (!existing) return;
    delta.overrides[id] = {
      ...existing,
      active: false,
      updatedAt: Date.now(),
    };
  }
  writeDelta(categoryId, delta);
}

/** Reset a category back to its seed state (drops all overrides + tombstones). */
export function resetMasterCategory(categoryId: string): void {
  writeDelta(categoryId, { overrides: {}, tombstones: [] });
}

/** Stable id generator for new user values. */
export function newMasterValueId(categoryId: string): string {
  return `${categoryId}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;
}
