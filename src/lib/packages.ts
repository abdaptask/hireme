/**
 * Onboarding Packages data (CLAUDE.md §8, §9, §102).
 * Client-mapped package definitions with versioning, items, rules,
 * dispatch history, and approval chains.
 */
import type { StatusTone } from "@/lib/types";

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

export type PackageStatus =
  | "draft"
  | "in-review"
  | "approved"
  | "published"
  | "retired";

export type PackageSection =
  | "required-documents"
  | "optional-documents"
  | "approvals"
  | "training"
  | "screening"
  | "it-provisioning"
  | "tax-payroll";

export type PackageItemStatus = "included" | "waived" | "pending" | "rejected";

export type PackageItem = {
  id: string;
  section: PackageSection;
  type:
    | "document"
    | "task"
    | "approval"
    | "training"
    | "screening"
    | "provisioning";
  label: string;
  required: boolean;
  conditional?: string; // e.g. "W-2 only" or "CA state residents"
  owner: string; // "Candidate" | "Onboarder" | "IT" | "HR" | etc.
  dueOffset: number; // days before start date
  status: PackageItemStatus;
  aiRecommended?: boolean; // AI added this based on rules
  notes?: string;
};

export type PackageRule = {
  id: string;
  condition: string; // natural language, e.g. "Employment type is W-2"
  applies: boolean;
  reason: string; // AI explanation of why this rule applies/doesn't
  category:
    | "client"
    | "state"
    | "employment"
    | "job"
    | "security"
    | "training";
};

export type PackageDispatch = {
  id: string;
  channel: "email" | "sms" | "portal";
  sentAt: string;
  status:
    | "delivered"
    | "opened"
    | "started"
    | "completed"
    | "awaiting-review"
    | "expired";
};

export type PackageApproval = {
  id: string;
  approver: string;
  role: string;
  status: "pending" | "approved" | "rejected";
  approvedAt?: string;
  notes?: string;
};

export type OnboardingPackage = {
  id: string;
  name: string;
  version: string;
  client: string;
  employmentType: string;
  workLocation: string;
  jobCategory: string;
  status: PackageStatus;
  createdBy: string;
  approvedBy?: string;
  effectiveDate: string;
  expiryDate?: string;
  /** Legacy summary counts — kept for list-page stat tiles. */
  itemCount: number;
  requiredCount: number;
  completionRate: number;
  candidatesUsing: number;
  lastModified: string;
  description: string;
  consultant?: string;

  // Rich data
  riskScore: number; // 0–100
  completionPct: number; // 0–100, derived from items
  aiReviewStatus: "not-run" | "clean" | "warnings" | "errors";
  aiWarnings?: {
    id: string;
    severity: "info" | "warning" | "error";
    message: string;
    fix?: string;
  }[];
  items: PackageItem[];
  rules: PackageRule[];
  dispatches: PackageDispatch[];
  approvals: PackageApproval[];
};

// ---------------------------------------------------------------------------
// Metadata helpers
// ---------------------------------------------------------------------------

export const PACKAGE_STATUS_META: Record<
  PackageStatus,
  { label: string; tone: StatusTone }
> = {
  draft: { label: "Draft", tone: "neutral" },
  "in-review": { label: "In Review", tone: "info" },
  approved: { label: "Approved", tone: "success" },
  published: { label: "Published", tone: "success" },
  retired: { label: "Retired", tone: "neutral" },
};

export const SECTION_META: Record<
  PackageSection,
  { label: string; icon: string }
> = {
  "required-documents": { label: "Required Documents", icon: "FileText" },
  "optional-documents": { label: "Optional Documents", icon: "File" },
  approvals: { label: "Approvals", icon: "CheckSquare" },
  training: { label: "Training", icon: "GraduationCap" },
  screening: { label: "Screening", icon: "ShieldCheck" },
  "it-provisioning": { label: "IT Provisioning", icon: "Monitor" },
  "tax-payroll": { label: "Tax & Payroll", icon: "DollarSign" },
};

// ---------------------------------------------------------------------------
// Package 1 — Meridian Health W-2 Standard
// ---------------------------------------------------------------------------

const PKG_001_ITEMS: PackageItem[] = [
  // Required Documents
  {
    id: "p1-i01",
    section: "required-documents",
    type: "document",
    label: "Meridian Health NDA",
    required: true,
    owner: "Candidate",
    dueOffset: 10,
    status: "included",
  },
  {
    id: "p1-i02",
    section: "required-documents",
    type: "document",
    label: "I-9 Employment Eligibility",
    required: true,
    owner: "Onboarder",
    dueOffset: 3,
    status: "included",
  },
  {
    id: "p1-i03",
    section: "required-documents",
    type: "document",
    label: "Flu Vaccination Record or Waiver",
    required: true,
    conditional: "Healthcare workers",
    owner: "Candidate",
    dueOffset: 7,
    status: "included",
    aiRecommended: true,
    notes: "Required for all clinical and patient-facing roles at Meridian.",
  },
  {
    id: "p1-i04",
    section: "required-documents",
    type: "document",
    label: "Direct Deposit Authorization",
    required: true,
    owner: "Candidate",
    dueOffset: 8,
    status: "included",
  },
  // Tax & Payroll
  {
    id: "p1-i05",
    section: "tax-payroll",
    type: "document",
    label: "Federal W-4",
    required: true,
    owner: "Candidate",
    dueOffset: 8,
    status: "included",
  },
  {
    id: "p1-i06",
    section: "tax-payroll",
    type: "document",
    label: "Tennessee State Tax Form (IT-40)",
    required: true,
    conditional: "TN residents",
    owner: "Candidate",
    dueOffset: 8,
    status: "included",
    aiRecommended: true,
  },
  // Screening
  {
    id: "p1-i07",
    section: "screening",
    type: "screening",
    label: "Background Check — 7-Year",
    required: true,
    owner: "HR",
    dueOffset: 12,
    status: "included",
  },
  {
    id: "p1-i08",
    section: "screening",
    type: "screening",
    label: "10-Panel Drug Screen",
    required: true,
    owner: "HR",
    dueOffset: 12,
    status: "included",
  },
  // Training
  {
    id: "p1-i09",
    section: "training",
    type: "training",
    label: "HIPAA Privacy & Security Training",
    required: true,
    owner: "Candidate",
    dueOffset: 5,
    status: "included",
  },
  {
    id: "p1-i10",
    section: "training",
    type: "training",
    label: "Safety Orientation",
    required: true,
    owner: "Candidate",
    dueOffset: 5,
    status: "included",
  },
  {
    id: "p1-i11",
    section: "training",
    type: "training",
    label: "Cybersecurity Awareness",
    required: true,
    owner: "Candidate",
    dueOffset: 5,
    status: "included",
  },
  // IT Provisioning
  {
    id: "p1-i12",
    section: "it-provisioning",
    type: "provisioning",
    label: "Corporate Email Account Setup",
    required: true,
    owner: "IT",
    dueOffset: 2,
    status: "included",
  },
  {
    id: "p1-i13",
    section: "it-provisioning",
    type: "provisioning",
    label: "VPN Access Grant",
    required: true,
    owner: "IT",
    dueOffset: 2,
    status: "included",
  },
  {
    id: "p1-i14",
    section: "it-provisioning",
    type: "provisioning",
    label: "Badge / Access Card Request",
    required: true,
    owner: "Facilities",
    dueOffset: 3,
    status: "included",
  },
  // Approvals
  {
    id: "p1-i15",
    section: "approvals",
    type: "approval",
    label: "HR Director Sign-Off",
    required: true,
    owner: "HR",
    dueOffset: 4,
    status: "included",
  },
  {
    id: "p1-i16",
    section: "approvals",
    type: "approval",
    label: "Account Manager Approval",
    required: true,
    owner: "Account Manager",
    dueOffset: 5,
    status: "included",
  },
  // Optional
  {
    id: "p1-i17",
    section: "optional-documents",
    type: "training",
    label: "ISO 27001 Security Awareness (Optional)",
    required: false,
    owner: "Candidate",
    dueOffset: 5,
    status: "included",
  },
  {
    id: "p1-i18",
    section: "optional-documents",
    type: "document",
    label: "Professional License Copy",
    required: false,
    conditional: "Licensed clinical roles",
    owner: "Candidate",
    dueOffset: 10,
    status: "included",
    aiRecommended: true,
  },
];

const PKG_001_RULES: PackageRule[] = [
  {
    id: "r1-01",
    condition: "Client is Meridian Health",
    applies: true,
    reason:
      "Meridian Health requires NDA, HIPAA training, and flu vaccination policy for all engagements.",
    category: "client",
  },
  {
    id: "r1-02",
    condition: "Employment type is W-2",
    applies: true,
    reason:
      "W-2 classification triggers federal W-4, direct deposit, and state tax withholding requirements.",
    category: "employment",
  },
  {
    id: "r1-03",
    condition: "Work location is Tennessee",
    applies: true,
    reason:
      "Tennessee residents must complete IT-40 state tax form. Nashville HQ triggers TN withholding.",
    category: "state",
  },
  {
    id: "r1-04",
    condition: "Job category is Healthcare",
    applies: true,
    reason:
      "Healthcare workers at Meridian require HIPAA training, flu vaccination record, and 10-panel drug screen.",
    category: "job",
  },
  {
    id: "r1-05",
    condition: "Security clearance required",
    applies: false,
    reason:
      "This role does not require federal security clearance. No additional clearance forms added.",
    category: "security",
  },
  {
    id: "r1-06",
    condition: "Employment type is C2C",
    applies: false,
    reason:
      "C2C rules (liability certificate, vendor MSA) do not apply because employment type is W-2.",
    category: "employment",
  },
  {
    id: "r1-07",
    condition: "Union membership required",
    applies: false,
    reason:
      "This engagement is not covered by a union agreement. Union acknowledgment form is not included.",
    category: "client",
  },
  {
    id: "r1-08",
    condition: "Training: Cybersecurity Awareness",
    applies: true,
    reason:
      "Meridian Health requires all contractors to complete cybersecurity awareness training before Day 1.",
    category: "training",
  },
];

// ---------------------------------------------------------------------------
// Package 2 — Apex Financial W-2 Compliance
// ---------------------------------------------------------------------------

const PKG_002_ITEMS: PackageItem[] = [
  {
    id: "p2-i01",
    section: "required-documents",
    type: "document",
    label: "Apex Financial NDA + IP Agreement",
    required: true,
    owner: "Candidate",
    dueOffset: 10,
    status: "included",
  },
  {
    id: "p2-i02",
    section: "required-documents",
    type: "document",
    label: "I-9 Employment Eligibility",
    required: true,
    owner: "Onboarder",
    dueOffset: 3,
    status: "included",
  },
  {
    id: "p2-i03",
    section: "required-documents",
    type: "document",
    label: "FINRA Disclosure Form U4",
    required: true,
    conditional: "Finance roles",
    owner: "Candidate",
    dueOffset: 10,
    status: "included",
    aiRecommended: true,
  },
  {
    id: "p2-i04",
    section: "required-documents",
    type: "document",
    label: "Insider Trading Policy Acknowledgment",
    required: true,
    owner: "Candidate",
    dueOffset: 8,
    status: "included",
  },
  {
    id: "p2-i05",
    section: "required-documents",
    type: "document",
    label: "Direct Deposit Authorization",
    required: true,
    owner: "Candidate",
    dueOffset: 8,
    status: "included",
  },
  {
    id: "p2-i06",
    section: "required-documents",
    type: "document",
    label: "Information Security Policy Acknowledgment",
    required: true,
    owner: "Candidate",
    dueOffset: 7,
    status: "included",
  },
  {
    id: "p2-i07",
    section: "tax-payroll",
    type: "document",
    label: "Federal W-4",
    required: true,
    owner: "Candidate",
    dueOffset: 8,
    status: "included",
  },
  {
    id: "p2-i08",
    section: "tax-payroll",
    type: "document",
    label: "New York State IT-2104",
    required: true,
    conditional: "NY residents",
    owner: "Candidate",
    dueOffset: 8,
    status: "included",
    aiRecommended: true,
  },
  {
    id: "p2-i09",
    section: "screening",
    type: "screening",
    label: "Background Check — 10-Year + Credit",
    required: true,
    owner: "HR",
    dueOffset: 14,
    status: "included",
  },
  {
    id: "p2-i10",
    section: "screening",
    type: "screening",
    label: "10-Panel Drug Screen",
    required: true,
    owner: "HR",
    dueOffset: 12,
    status: "included",
  },
  {
    id: "p2-i11",
    section: "training",
    type: "training",
    label: "AML & BSA Compliance Training",
    required: true,
    conditional: "Finance roles",
    owner: "Candidate",
    dueOffset: 5,
    status: "included",
    aiRecommended: true,
  },
  {
    id: "p2-i12",
    section: "training",
    type: "training",
    label: "Data Privacy & GLBA Training",
    required: true,
    owner: "Candidate",
    dueOffset: 5,
    status: "included",
  },
  {
    id: "p2-i13",
    section: "training",
    type: "training",
    label: "Cybersecurity Awareness",
    required: true,
    owner: "Candidate",
    dueOffset: 5,
    status: "included",
  },
  {
    id: "p2-i14",
    section: "it-provisioning",
    type: "provisioning",
    label: "Corporate Email Account Setup",
    required: true,
    owner: "IT",
    dueOffset: 2,
    status: "included",
  },
  {
    id: "p2-i15",
    section: "it-provisioning",
    type: "provisioning",
    label: "MFA Enrollment",
    required: true,
    owner: "Candidate",
    dueOffset: 2,
    status: "included",
    aiRecommended: true,
  },
  {
    id: "p2-i16",
    section: "approvals",
    type: "approval",
    label: "Compliance Officer Review",
    required: true,
    owner: "Compliance",
    dueOffset: 5,
    status: "included",
  },
  {
    id: "p2-i17",
    section: "approvals",
    type: "approval",
    label: "Account Manager Approval",
    required: true,
    owner: "Account Manager",
    dueOffset: 5,
    status: "included",
  },
  {
    id: "p2-i18",
    section: "optional-documents",
    type: "document",
    label: "Series 7 / Series 63 License Copy",
    required: false,
    conditional: "Registered representatives",
    owner: "Candidate",
    dueOffset: 10,
    status: "included",
  },
  {
    id: "p2-i19",
    section: "optional-documents",
    type: "training",
    label: "Apex Financial Ethics Module",
    required: false,
    owner: "Candidate",
    dueOffset: 5,
    status: "included",
  },
  {
    id: "p2-i20",
    section: "optional-documents",
    type: "document",
    label: "Expense Policy Acknowledgment",
    required: false,
    owner: "Candidate",
    dueOffset: 7,
    status: "included",
  },
  {
    id: "p2-i21",
    section: "it-provisioning",
    type: "provisioning",
    label: "VPN Access Grant",
    required: true,
    owner: "IT",
    dueOffset: 2,
    status: "included",
  },
  {
    id: "p2-i22",
    section: "it-provisioning",
    type: "provisioning",
    label: "Bloomberg Terminal Access Request",
    required: false,
    conditional: "Trading desk roles",
    owner: "IT",
    dueOffset: 3,
    status: "included",
    aiRecommended: true,
  },
];

const PKG_002_RULES: PackageRule[] = [
  {
    id: "r2-01",
    condition: "Client is Apex Financial",
    applies: true,
    reason:
      "Apex Financial requires NDA+IP agreement, FINRA disclosure, insider trading policy, and security training for all engagements.",
    category: "client",
  },
  {
    id: "r2-02",
    condition: "Employment type is W-2",
    applies: true,
    reason:
      "W-2 triggers payroll tax withholding, direct deposit, state tax forms, and GLBA-applicable privacy training.",
    category: "employment",
  },
  {
    id: "r2-03",
    condition: "Work location is New York",
    applies: true,
    reason:
      "New York State requires IT-2104 withholding form. NYC-based workers may also require additional NYC withholding.",
    category: "state",
  },
  {
    id: "r2-04",
    condition: "Job category is Finance & Accounting",
    applies: true,
    reason:
      "Finance roles at Apex require FINRA Form U4, AML/BSA training, and 10-year background check with credit check.",
    category: "job",
  },
  {
    id: "r2-05",
    condition: "Security level: Information Security Policy required",
    applies: true,
    reason:
      "All Apex Financial workers handle sensitive financial data and must acknowledge the information security policy.",
    category: "security",
  },
  {
    id: "r2-06",
    condition: "MFA enrollment required",
    applies: true,
    reason:
      "Apex Financial mandates MFA for all system access effective Q1 2026. Added automatically by AI rules engine.",
    category: "security",
  },
  {
    id: "r2-07",
    condition: "Employment type is C2C",
    applies: false,
    reason:
      "C2C rules (E&O insurance, vendor MSA) do not apply — employment type is W-2.",
    category: "employment",
  },
  {
    id: "r2-08",
    condition: "Federal contract applicability",
    applies: false,
    reason:
      "Apex Financial is not a federal contractor. FAR and federal contractor requirements are excluded.",
    category: "client",
  },
];

// ---------------------------------------------------------------------------
// Package 3 — Northwind Logistics W-2 Field Ops
// ---------------------------------------------------------------------------

const PKG_003_ITEMS: PackageItem[] = [
  {
    id: "p3-i01",
    section: "required-documents",
    type: "document",
    label: "Northwind Confidentiality Agreement",
    required: true,
    owner: "Candidate",
    dueOffset: 10,
    status: "included",
  },
  {
    id: "p3-i02",
    section: "required-documents",
    type: "document",
    label: "I-9 Employment Eligibility",
    required: true,
    owner: "Onboarder",
    dueOffset: 3,
    status: "included",
  },
  {
    id: "p3-i03",
    section: "required-documents",
    type: "document",
    label: "SAP Fieldglass Worker Profile",
    required: true,
    owner: "Onboarder",
    dueOffset: 8,
    status: "included",
    aiRecommended: true,
  },
  {
    id: "p3-i04",
    section: "required-documents",
    type: "document",
    label: "Direct Deposit Authorization",
    required: true,
    owner: "Candidate",
    dueOffset: 8,
    status: "included",
  },
  {
    id: "p3-i05",
    section: "tax-payroll",
    type: "document",
    label: "Federal W-4",
    required: true,
    owner: "Candidate",
    dueOffset: 8,
    status: "included",
  },
  {
    id: "p3-i06",
    section: "tax-payroll",
    type: "document",
    label: "Illinois State W-4",
    required: true,
    conditional: "IL residents",
    owner: "Candidate",
    dueOffset: 8,
    status: "included",
    aiRecommended: true,
  },
  {
    id: "p3-i07",
    section: "screening",
    type: "screening",
    label: "Background Check — 5-Year",
    required: true,
    owner: "HR",
    dueOffset: 12,
    status: "included",
  },
  {
    id: "p3-i08",
    section: "screening",
    type: "screening",
    label: "5-Panel Drug Screen",
    required: true,
    owner: "HR",
    dueOffset: 12,
    status: "included",
  },
  {
    id: "p3-i09",
    section: "training",
    type: "training",
    label: "DOT Safety Training",
    required: true,
    conditional: "Operations roles",
    owner: "Candidate",
    dueOffset: 5,
    status: "included",
    aiRecommended: true,
  },
  {
    id: "p3-i10",
    section: "training",
    type: "training",
    label: "Cybersecurity Awareness",
    required: true,
    owner: "Candidate",
    dueOffset: 5,
    status: "included",
  },
  {
    id: "p3-i11",
    section: "training",
    type: "training",
    label: "Forklift / Equipment Safety (if applicable)",
    required: false,
    conditional: "Warehouse / Field ops roles",
    owner: "Candidate",
    dueOffset: 5,
    status: "included",
  },
  {
    id: "p3-i12",
    section: "it-provisioning",
    type: "provisioning",
    label: "Corporate Email Account Setup",
    required: true,
    owner: "IT",
    dueOffset: 2,
    status: "included",
  },
  {
    id: "p3-i13",
    section: "it-provisioning",
    type: "provisioning",
    label: "Badge / Access Card Request",
    required: true,
    owner: "Facilities",
    dueOffset: 3,
    status: "included",
  },
  {
    id: "p3-i14",
    section: "approvals",
    type: "approval",
    label: "Fieldglass MSP Approval",
    required: true,
    owner: "MSP",
    dueOffset: 6,
    status: "included",
    aiRecommended: true,
  },
  {
    id: "p3-i15",
    section: "approvals",
    type: "approval",
    label: "Account Manager Sign-Off",
    required: true,
    owner: "Account Manager",
    dueOffset: 5,
    status: "included",
  },
  {
    id: "p3-i16",
    section: "optional-documents",
    type: "document",
    label: "Vehicle / CDL License Copy",
    required: false,
    conditional: "Driving roles",
    owner: "Candidate",
    dueOffset: 10,
    status: "included",
    aiRecommended: true,
  },
];

const PKG_003_RULES: PackageRule[] = [
  {
    id: "r3-01",
    condition: "Client is Northwind Logistics",
    applies: true,
    reason:
      "Northwind requires confidentiality agreement, Fieldglass worker profile, and DOT safety training for field operations.",
    category: "client",
  },
  {
    id: "r3-02",
    condition: "MSP: SAP Fieldglass",
    applies: true,
    reason:
      "Northwind uses Fieldglass for VMS. All workers must have a Fieldglass worker profile created before engagement start.",
    category: "client",
  },
  {
    id: "r3-03",
    condition: "Employment type is W-2",
    applies: true,
    reason:
      "W-2 triggers state/federal tax withholding, direct deposit setup, and payroll entity registration.",
    category: "employment",
  },
  {
    id: "r3-04",
    condition: "Work location is Illinois",
    applies: true,
    reason:
      "Illinois requires its own W-4 withholding form for state income tax. Added to package automatically.",
    category: "state",
  },
  {
    id: "r3-05",
    condition: "Job category is Field & Operations",
    applies: true,
    reason:
      "Field operations roles require DOT safety training, 5-panel drug screen, and potential CDL verification.",
    category: "job",
  },
  {
    id: "r3-06",
    condition: "Security clearance required",
    applies: false,
    reason:
      "Field operations at Northwind do not require federal security clearance. Clearance forms excluded.",
    category: "security",
  },
  {
    id: "r3-07",
    condition: "Employment type is C2C",
    applies: false,
    reason:
      "C2C liability insurance and vendor MSA requirements do not apply. Employment type is W-2.",
    category: "employment",
  },
  {
    id: "r3-08",
    condition: "Union agreement applicable",
    applies: false,
    reason:
      "This Northwind program does not fall under a collective bargaining agreement. Union forms excluded.",
    category: "client",
  },
];

// ---------------------------------------------------------------------------
// Package 4 — SkyBridge Tech C2C Contractor
// ---------------------------------------------------------------------------

const PKG_004_ITEMS: PackageItem[] = [
  {
    id: "p4-i01",
    section: "required-documents",
    type: "document",
    label: "SkyBridge IP & Confidentiality Agreement",
    required: true,
    owner: "Candidate",
    dueOffset: 10,
    status: "included",
  },
  {
    id: "p4-i02",
    section: "required-documents",
    type: "document",
    label: "Statement of Work (SOW) Acknowledgment",
    required: true,
    owner: "Candidate",
    dueOffset: 8,
    status: "included",
    aiRecommended: true,
  },
  {
    id: "p4-i03",
    section: "required-documents",
    type: "document",
    label: "General Liability Certificate (C2C)",
    required: true,
    conditional: "C2C only",
    owner: "Vendor",
    dueOffset: 10,
    status: "included",
    aiRecommended: true,
  },
  {
    id: "p4-i04",
    section: "required-documents",
    type: "document",
    label: "Acceptable Use Policy Acknowledgment",
    required: true,
    owner: "Candidate",
    dueOffset: 7,
    status: "included",
  },
  {
    id: "p4-i05",
    section: "required-documents",
    type: "document",
    label: "Vendor MSA / Work Order",
    required: true,
    conditional: "C2C — vendor-supplied",
    owner: "Vendor",
    dueOffset: 12,
    status: "included",
    aiRecommended: true,
  },
  {
    id: "p4-i06",
    section: "screening",
    type: "screening",
    label: "Background Check — 7-Year",
    required: true,
    owner: "HR",
    dueOffset: 12,
    status: "included",
  },
  {
    id: "p4-i07",
    section: "training",
    type: "training",
    label: "Cloud Security Training",
    required: true,
    conditional: "DevOps / Cloud roles",
    owner: "Candidate",
    dueOffset: 5,
    status: "included",
    aiRecommended: true,
  },
  {
    id: "p4-i08",
    section: "training",
    type: "training",
    label: "Acceptable Use & Data Handling",
    required: true,
    owner: "Candidate",
    dueOffset: 5,
    status: "included",
  },
  {
    id: "p4-i09",
    section: "it-provisioning",
    type: "provisioning",
    label: "Contractor Email / Alias Setup",
    required: true,
    owner: "IT",
    dueOffset: 2,
    status: "included",
  },
  {
    id: "p4-i10",
    section: "it-provisioning",
    type: "provisioning",
    label: "VPN Contractor Access",
    required: true,
    owner: "IT",
    dueOffset: 2,
    status: "included",
  },
  {
    id: "p4-i11",
    section: "it-provisioning",
    type: "provisioning",
    label: "Timesheet System Access",
    required: true,
    owner: "IT",
    dueOffset: 3,
    status: "included",
  },
  {
    id: "p4-i12",
    section: "approvals",
    type: "approval",
    label: "Account Manager Approval",
    required: true,
    owner: "Account Manager",
    dueOffset: 5,
    status: "included",
  },
];

const PKG_004_RULES: PackageRule[] = [
  {
    id: "r4-01",
    condition: "Client is SkyBridge Tech",
    applies: true,
    reason:
      "SkyBridge requires IP/confidentiality agreement, SOW acknowledgment, and cloud security training for all contractors.",
    category: "client",
  },
  {
    id: "r4-02",
    condition: "Employment type is C2C",
    applies: true,
    reason:
      "C2C engagement requires general liability certificate, vendor MSA, and SOW acknowledgment from the supplying vendor.",
    category: "employment",
  },
  {
    id: "r4-03",
    condition: "Job category is Software & Cloud",
    applies: true,
    reason:
      "Cloud/DevOps roles at SkyBridge require cloud security training and acceptable use acknowledgment.",
    category: "job",
  },
  {
    id: "r4-04",
    condition: "Drug screen required",
    applies: false,
    reason:
      "SkyBridge Tech does not require drug screening for remote C2C contractors unless client-requested.",
    category: "client",
  },
  {
    id: "r4-05",
    condition: "Employment type is W-2",
    applies: false,
    reason:
      "W-2 payroll forms (W-4, direct deposit, state tax) do not apply — employment type is C2C.",
    category: "employment",
  },
  {
    id: "r4-06",
    condition: "Security clearance required",
    applies: false,
    reason:
      "This SkyBridge contractor role does not require federal security clearance.",
    category: "security",
  },
  {
    id: "r4-07",
    condition: "MSP platform applicable",
    applies: false,
    reason: "SkyBridge Tech does not use a VMS/MSP platform for this program.",
    category: "client",
  },
  {
    id: "r4-08",
    condition: "Union membership applicable",
    applies: false,
    reason:
      "No collective bargaining agreement governs this engagement. Union forms excluded.",
    category: "client",
  },
];

// ---------------------------------------------------------------------------
// Package 5 — Apex Financial 1099 Specialist (In Review)
// ---------------------------------------------------------------------------

const PKG_005_ITEMS: PackageItem[] = [
  {
    id: "p5-i01",
    section: "required-documents",
    type: "document",
    label: "Apex Financial Independent Contractor Agreement",
    required: true,
    owner: "Candidate",
    dueOffset: 10,
    status: "pending",
  },
  {
    id: "p5-i02",
    section: "required-documents",
    type: "document",
    label: "IRS Form W-9",
    required: true,
    conditional: "1099 workers",
    owner: "Candidate",
    dueOffset: 8,
    status: "pending",
    aiRecommended: true,
  },
  {
    id: "p5-i03",
    section: "required-documents",
    type: "document",
    label: "Insider Trading Policy Acknowledgment",
    required: true,
    owner: "Candidate",
    dueOffset: 8,
    status: "pending",
  },
  {
    id: "p5-i04",
    section: "required-documents",
    type: "document",
    label: "General Liability Insurance Certificate",
    required: true,
    conditional: "1099 — independent contractors",
    owner: "Candidate",
    dueOffset: 10,
    status: "pending",
    aiRecommended: true,
  },
  {
    id: "p5-i05",
    section: "screening",
    type: "screening",
    label: "Background Check — 10-Year + Credit",
    required: true,
    owner: "HR",
    dueOffset: 14,
    status: "pending",
  },
  {
    id: "p5-i06",
    section: "training",
    type: "training",
    label: "AML & BSA Compliance Training",
    required: true,
    conditional: "Finance roles",
    owner: "Candidate",
    dueOffset: 5,
    status: "pending",
  },
  {
    id: "p5-i07",
    section: "training",
    type: "training",
    label: "Information Security Awareness",
    required: true,
    owner: "Candidate",
    dueOffset: 5,
    status: "pending",
  },
  {
    id: "p5-i08",
    section: "approvals",
    type: "approval",
    label: "Legal Review — Contractor Classification",
    required: true,
    owner: "Legal",
    dueOffset: 7,
    status: "pending",
    aiRecommended: true,
  },
  {
    id: "p5-i09",
    section: "optional-documents",
    type: "document",
    label: "FINRA Form U4 (if applicable)",
    required: false,
    conditional: "Registered representatives",
    owner: "Candidate",
    dueOffset: 10,
    status: "pending",
  },
  {
    id: "p5-i10",
    section: "optional-documents",
    type: "document",
    label: "Expense Reimbursement Policy",
    required: false,
    owner: "Candidate",
    dueOffset: 7,
    status: "pending",
  },
];

const PKG_005_RULES: PackageRule[] = [
  {
    id: "r5-01",
    condition: "Client is Apex Financial",
    applies: true,
    reason:
      "Apex requires NDA, insider trading acknowledgment, and security training regardless of employment type.",
    category: "client",
  },
  {
    id: "r5-02",
    condition: "Employment type is 1099",
    applies: true,
    reason:
      "1099 classification requires IRS W-9, independent contractor agreement, and liability insurance in lieu of W-4.",
    category: "employment",
  },
  {
    id: "r5-03",
    condition: "Legal review: contractor classification",
    applies: true,
    reason:
      "New contractor classification rules (effective Q3 2026) require legal review of all 1099 engagements at Apex Financial.",
    category: "employment",
  },
  {
    id: "r5-04",
    condition: "W-2 payroll forms required",
    applies: false,
    reason:
      "W-2 tax forms (W-4, state withholding) do not apply — employment type is 1099 independent contractor.",
    category: "employment",
  },
  {
    id: "r5-05",
    condition: "Drug screen required",
    applies: false,
    reason:
      "Apex Financial does not require drug screening for 1099 independent contractors.",
    category: "client",
  },
  {
    id: "r5-06",
    condition: "MSP platform applicable",
    applies: false,
    reason: "Apex Financial does not use a VMS platform for 1099 engagements.",
    category: "client",
  },
];

// ---------------------------------------------------------------------------
// Package 6 — Northwind Logistics C2C Transport (Draft)
// ---------------------------------------------------------------------------

const PKG_006_ITEMS: PackageItem[] = [
  {
    id: "p6-i01",
    section: "required-documents",
    type: "document",
    label: "Northwind Confidentiality Agreement",
    required: true,
    owner: "Candidate",
    dueOffset: 10,
    status: "pending",
  },
  {
    id: "p6-i02",
    section: "required-documents",
    type: "document",
    label: "Vendor MSA / Work Order",
    required: true,
    conditional: "C2C — vendor-supplied",
    owner: "Vendor",
    dueOffset: 12,
    status: "pending",
  },
  {
    id: "p6-i03",
    section: "required-documents",
    type: "document",
    label: "General Liability Certificate (C2C)",
    required: true,
    conditional: "C2C only",
    owner: "Vendor",
    dueOffset: 10,
    status: "pending",
    aiRecommended: true,
  },
  {
    id: "p6-i04",
    section: "required-documents",
    type: "document",
    label: "SAP Fieldglass Worker Profile",
    required: true,
    owner: "Onboarder",
    dueOffset: 8,
    status: "pending",
  },
  {
    id: "p6-i05",
    section: "screening",
    type: "screening",
    label: "Background Check — 5-Year",
    required: true,
    owner: "HR",
    dueOffset: 12,
    status: "pending",
  },
  {
    id: "p6-i06",
    section: "training",
    type: "training",
    label: "DOT Safety Training",
    required: true,
    conditional: "Transport roles",
    owner: "Candidate",
    dueOffset: 5,
    status: "pending",
  },
  {
    id: "p6-i07",
    section: "approvals",
    type: "approval",
    label: "Fieldglass MSP Approval",
    required: true,
    owner: "MSP",
    dueOffset: 6,
    status: "pending",
  },
  {
    id: "p6-i08",
    section: "optional-documents",
    type: "document",
    label: "CDL License Copy",
    required: false,
    conditional: "Driving roles",
    owner: "Candidate",
    dueOffset: 10,
    status: "pending",
    aiRecommended: true,
  },
  {
    id: "p6-i09",
    section: "optional-documents",
    type: "document",
    label: "DOT Physical Examination Certificate",
    required: false,
    conditional: "Commercial vehicle operators",
    owner: "Candidate",
    dueOffset: 10,
    status: "pending",
  },
];

const PKG_006_RULES: PackageRule[] = [
  {
    id: "r6-01",
    condition: "Client is Northwind Logistics",
    applies: true,
    reason:
      "Northwind confidentiality agreement and Fieldglass worker profile are required for all engagements.",
    category: "client",
  },
  {
    id: "r6-02",
    condition: "Employment type is C2C",
    applies: true,
    reason:
      "C2C transport contractors require vendor MSA, liability certificate, and Fieldglass worker profile.",
    category: "employment",
  },
  {
    id: "r6-03",
    condition: "Legal sign-off pending",
    applies: true,
    reason:
      "This draft package has not received legal review. DOT compliance requirements are under validation.",
    category: "client",
  },
  {
    id: "r6-04",
    condition: "W-2 payroll forms required",
    applies: false,
    reason:
      "W-2 tax and payroll forms do not apply — employment type is C2C.",
    category: "employment",
  },
  {
    id: "r6-05",
    condition: "Drug screen (5-panel)",
    applies: false,
    reason:
      "Draft status — drug screen requirement pending legal review for C2C transport roles.",
    category: "client",
  },
];

// ---------------------------------------------------------------------------
// Package 7 — Meridian Health W-2 Legacy 2025 (Retired)
// ---------------------------------------------------------------------------

const PKG_007_ITEMS: PackageItem[] = [
  {
    id: "p7-i01",
    section: "required-documents",
    type: "document",
    label: "Meridian Health NDA (v2.9)",
    required: true,
    owner: "Candidate",
    dueOffset: 10,
    status: "included",
  },
  {
    id: "p7-i02",
    section: "required-documents",
    type: "document",
    label: "I-9 Employment Eligibility",
    required: true,
    owner: "Onboarder",
    dueOffset: 3,
    status: "included",
  },
  {
    id: "p7-i03",
    section: "required-documents",
    type: "document",
    label: "Flu Vaccination Record or Waiver",
    required: true,
    owner: "Candidate",
    dueOffset: 7,
    status: "included",
  },
  {
    id: "p7-i04",
    section: "required-documents",
    type: "document",
    label: "Direct Deposit Authorization",
    required: true,
    owner: "Candidate",
    dueOffset: 8,
    status: "included",
  },
  {
    id: "p7-i05",
    section: "tax-payroll",
    type: "document",
    label: "Federal W-4",
    required: true,
    owner: "Candidate",
    dueOffset: 8,
    status: "included",
  },
  {
    id: "p7-i06",
    section: "tax-payroll",
    type: "document",
    label: "Tennessee State Tax Form",
    required: true,
    owner: "Candidate",
    dueOffset: 8,
    status: "included",
  },
  {
    id: "p7-i07",
    section: "screening",
    type: "screening",
    label: "Background Check — 7-Year",
    required: true,
    owner: "HR",
    dueOffset: 12,
    status: "included",
  },
  {
    id: "p7-i08",
    section: "screening",
    type: "screening",
    label: "10-Panel Drug Screen",
    required: true,
    owner: "HR",
    dueOffset: 12,
    status: "included",
  },
  {
    id: "p7-i09",
    section: "training",
    type: "training",
    label: "HIPAA Privacy Training (2025 Version)",
    required: true,
    owner: "Candidate",
    dueOffset: 5,
    status: "included",
  },
  {
    id: "p7-i10",
    section: "training",
    type: "training",
    label: "Safety Orientation",
    required: true,
    owner: "Candidate",
    dueOffset: 5,
    status: "included",
  },
  {
    id: "p7-i11",
    section: "it-provisioning",
    type: "provisioning",
    label: "Corporate Email Account Setup",
    required: true,
    owner: "IT",
    dueOffset: 2,
    status: "included",
  },
  {
    id: "p7-i12",
    section: "it-provisioning",
    type: "provisioning",
    label: "Badge / Access Card Request",
    required: true,
    owner: "Facilities",
    dueOffset: 3,
    status: "included",
  },
  {
    id: "p7-i13",
    section: "approvals",
    type: "approval",
    label: "HR Director Sign-Off",
    required: true,
    owner: "HR",
    dueOffset: 4,
    status: "included",
  },
  {
    id: "p7-i14",
    section: "optional-documents",
    type: "document",
    label: "Professional License Copy",
    required: false,
    owner: "Candidate",
    dueOffset: 10,
    status: "included",
  },
  {
    id: "p7-i15",
    section: "optional-documents",
    type: "training",
    label: "Infection Control Training (2025)",
    required: false,
    owner: "Candidate",
    dueOffset: 5,
    status: "included",
  },
  {
    id: "p7-i16",
    section: "optional-documents",
    type: "document",
    label: "Emergency Contact Form",
    required: false,
    owner: "Candidate",
    dueOffset: 7,
    status: "included",
  },
  {
    id: "p7-i17",
    section: "optional-documents",
    type: "training",
    label: "Cybersecurity Awareness (2025)",
    required: false,
    owner: "Candidate",
    dueOffset: 5,
    status: "included",
  },
];

const PKG_007_RULES: PackageRule[] = [
  {
    id: "r7-01",
    condition: "Client is Meridian Health",
    applies: true,
    reason: "Legacy 2025 package — superseded by v3.2 effective 2026-01-01.",
    category: "client",
  },
  {
    id: "r7-02",
    condition: "Employment type is W-2",
    applies: true,
    reason: "W-2 rules applied. Now governed by updated v3.2 package.",
    category: "employment",
  },
];

// ---------------------------------------------------------------------------
// Package 8 — SkyBridge Tech W-2 Engineering (Approved)
// ---------------------------------------------------------------------------

const PKG_008_ITEMS: PackageItem[] = [
  {
    id: "p8-i01",
    section: "required-documents",
    type: "document",
    label: "SkyBridge IP & Confidentiality Agreement",
    required: true,
    owner: "Candidate",
    dueOffset: 10,
    status: "included",
  },
  {
    id: "p8-i02",
    section: "required-documents",
    type: "document",
    label: "I-9 Employment Eligibility",
    required: true,
    owner: "Onboarder",
    dueOffset: 3,
    status: "included",
  },
  {
    id: "p8-i03",
    section: "required-documents",
    type: "document",
    label: "Acceptable Use Policy Acknowledgment",
    required: true,
    owner: "Candidate",
    dueOffset: 7,
    status: "included",
  },
  {
    id: "p8-i04",
    section: "required-documents",
    type: "document",
    label: "Direct Deposit Authorization",
    required: true,
    owner: "Candidate",
    dueOffset: 8,
    status: "included",
  },
  {
    id: "p8-i05",
    section: "tax-payroll",
    type: "document",
    label: "Federal W-4",
    required: true,
    owner: "Candidate",
    dueOffset: 8,
    status: "included",
  },
  {
    id: "p8-i06",
    section: "tax-payroll",
    type: "document",
    label: "Texas — No State Income Tax Notice",
    required: false,
    conditional: "TX residents",
    owner: "Candidate",
    dueOffset: 8,
    status: "included",
    aiRecommended: true,
    notes: "TX has no state income tax; candidate must be notified.",
  },
  {
    id: "p8-i07",
    section: "screening",
    type: "screening",
    label: "Background Check — 7-Year",
    required: true,
    owner: "HR",
    dueOffset: 12,
    status: "included",
  },
  {
    id: "p8-i08",
    section: "training",
    type: "training",
    label: "DevSecOps Security Training",
    required: true,
    conditional: "Engineering roles",
    owner: "Candidate",
    dueOffset: 5,
    status: "included",
    aiRecommended: true,
  },
  {
    id: "p8-i09",
    section: "training",
    type: "training",
    label: "Cloud Security Fundamentals",
    required: true,
    owner: "Candidate",
    dueOffset: 5,
    status: "included",
  },
  {
    id: "p8-i10",
    section: "training",
    type: "training",
    label: "Cybersecurity Awareness",
    required: true,
    owner: "Candidate",
    dueOffset: 5,
    status: "included",
  },
  {
    id: "p8-i11",
    section: "it-provisioning",
    type: "provisioning",
    label: "Corporate Email Account Setup",
    required: true,
    owner: "IT",
    dueOffset: 2,
    status: "included",
  },
  {
    id: "p8-i12",
    section: "it-provisioning",
    type: "provisioning",
    label: "Cloud Credential Provisioning (AWS/GCP/Azure)",
    required: true,
    owner: "IT",
    dueOffset: 2,
    status: "included",
    aiRecommended: true,
  },
  {
    id: "p8-i13",
    section: "it-provisioning",
    type: "provisioning",
    label: "MFA Enrollment",
    required: true,
    owner: "Candidate",
    dueOffset: 2,
    status: "included",
  },
  {
    id: "p8-i14",
    section: "approvals",
    type: "approval",
    label: "Engineering Lead Approval",
    required: true,
    owner: "Client",
    dueOffset: 5,
    status: "included",
  },
];

const PKG_008_RULES: PackageRule[] = [
  {
    id: "r8-01",
    condition: "Client is SkyBridge Tech",
    applies: true,
    reason:
      "SkyBridge IP/confidentiality agreement, acceptable use policy, and DevSecOps training are required for all W-2 engineers.",
    category: "client",
  },
  {
    id: "r8-02",
    condition: "Employment type is W-2",
    applies: true,
    reason:
      "W-2 classification triggers federal W-4, direct deposit, state-specific notices, and payroll entity setup.",
    category: "employment",
  },
  {
    id: "r8-03",
    condition: "Work location is Texas",
    applies: true,
    reason:
      "Texas has no state income tax. Candidate must receive TX no-withholding notice. No state W-4 required.",
    category: "state",
  },
  {
    id: "r8-04",
    condition: "Job category is Software & Cloud",
    applies: true,
    reason:
      "Engineering roles require DevSecOps training, cloud credential provisioning, and MFA enrollment before Day 1.",
    category: "job",
  },
  {
    id: "r8-05",
    condition: "Drug screen required",
    applies: false,
    reason:
      "SkyBridge Tech does not require drug screening for W-2 engineering roles.",
    category: "client",
  },
  {
    id: "r8-06",
    condition: "Employment type is C2C",
    applies: false,
    reason:
      "C2C requirements (vendor MSA, liability certificate) do not apply. Employment type is W-2.",
    category: "employment",
  },
  {
    id: "r8-07",
    condition: "MSP platform applicable",
    applies: false,
    reason: "SkyBridge Tech does not use a VMS/MSP platform.",
    category: "client",
  },
  {
    id: "r8-08",
    condition: "Cloud credential provisioning required",
    applies: true,
    reason:
      "All SkyBridge engineering roles require cloud credentials (AWS, GCP, or Azure) provisioned before start date.",
    category: "security",
  },
];

// ---------------------------------------------------------------------------
// Main data array
// ---------------------------------------------------------------------------

export const PACKAGES: OnboardingPackage[] = [
  {
    id: "pkg-001",
    name: "Meridian Health — W-2 Standard",
    version: "v3.2",
    client: "Meridian Health",
    employmentType: "W-2",
    workLocation: "Nashville, TN",
    jobCategory: "Healthcare",
    status: "published",
    createdBy: "Riya Kim",
    approvedBy: "Jordan Lee",
    effectiveDate: "2026-01-01",
    expiryDate: "2026-12-31",
    itemCount: 18,
    requiredCount: 14,
    completionRate: 87,
    completionPct: 87,
    candidatesUsing: 6,
    lastModified: "2026-05-15",
    description:
      "Full onboarding package for W-2 employees at Meridian Health. Includes HIPAA, I-9, direct deposit, client NDA, and clinical compliance requirements.",
    riskScore: 24,
    aiReviewStatus: "clean",
    items: PKG_001_ITEMS,
    rules: PKG_001_RULES,
    dispatches: [
      {
        id: "d1-01",
        channel: "email",
        sentAt: "2026-05-20 09:14",
        status: "completed",
      },
      {
        id: "d1-02",
        channel: "portal",
        sentAt: "2026-05-20 09:15",
        status: "completed",
      },
      {
        id: "d1-03",
        channel: "sms",
        sentAt: "2026-05-21 10:30",
        status: "delivered",
      },
    ],
    approvals: [
      {
        id: "a1-01",
        approver: "Tom Reid",
        role: "HR Director",
        status: "approved",
        approvedAt: "2026-05-18",
        notes: "Reviewed and approved. HIPAA training version confirmed.",
      },
      {
        id: "a1-02",
        approver: "Jordan Lee",
        role: "Compliance Lead",
        status: "approved",
        approvedAt: "2026-05-19",
      },
    ],
  },

  {
    id: "pkg-002",
    name: "Apex Financial — W-2 Compliance",
    version: "v2.1",
    client: "Apex Financial",
    employmentType: "W-2",
    workLocation: "New York, NY",
    jobCategory: "Finance & Accounting",
    status: "published",
    createdBy: "Sasha Patel",
    approvedBy: "Jordan Lee",
    effectiveDate: "2026-01-15",
    itemCount: 22,
    requiredCount: 18,
    completionRate: 91,
    completionPct: 91,
    candidatesUsing: 4,
    lastModified: "2026-04-20",
    description:
      "Comprehensive package for regulated financial roles. Covers AML, FINRA acknowledgments, data privacy, and Apex-specific security training.",
    riskScore: 18,
    aiReviewStatus: "warnings",
    aiWarnings: [
      {
        id: "w2-01",
        severity: "warning",
        message:
          "Bloomberg Terminal access form may not apply to all Finance roles — verify with Account Manager before dispatch.",
        fix: "Mark as optional or remove for non-trading-desk workers",
      },
      {
        id: "w2-02",
        severity: "info",
        message:
          "AML training version 3.1 is current; package references v3.0. Update recommended.",
        fix: "Replace AML & BSA Training v3.0 with v3.1",
      },
    ],
    items: PKG_002_ITEMS,
    rules: PKG_002_RULES,
    dispatches: [
      {
        id: "d2-01",
        channel: "email",
        sentAt: "2026-04-22 08:45",
        status: "completed",
      },
      {
        id: "d2-02",
        channel: "portal",
        sentAt: "2026-04-22 08:46",
        status: "started",
      },
    ],
    approvals: [
      {
        id: "a2-01",
        approver: "Amy Park",
        role: "HR Business Partner",
        status: "approved",
        approvedAt: "2026-04-19",
      },
      {
        id: "a2-02",
        approver: "Jordan Lee",
        role: "Compliance Lead",
        status: "approved",
        approvedAt: "2026-04-20",
      },
    ],
  },

  {
    id: "pkg-003",
    name: "Northwind Logistics — W-2 Field Ops",
    version: "v1.4",
    client: "Northwind Logistics",
    employmentType: "W-2",
    workLocation: "Chicago, IL",
    jobCategory: "Field & Operations",
    status: "published",
    createdBy: "Riya Kim",
    approvedBy: "Sasha Patel",
    effectiveDate: "2026-02-01",
    itemCount: 16,
    requiredCount: 13,
    completionRate: 74,
    completionPct: 74,
    candidatesUsing: 5,
    lastModified: "2026-05-01",
    description:
      "Field operations onboarding for Northwind Logistics. Safety certifications, equipment acknowledgments, and logistics-specific compliance are required.",
    riskScore: 52,
    aiReviewStatus: "warnings",
    aiWarnings: [
      {
        id: "w3-01",
        severity: "warning",
        message:
          "Start date success rate for Northwind is 76% — above-average risk. Fieldglass approval cycle averages 4-5 days; account for this.",
        fix: "Dispatch package 12+ days before target start date",
      },
      {
        id: "w3-02",
        severity: "error",
        message:
          "DOT Safety Training is marked conditional but Northwind Field Ops roles always require it. Should be required.",
        fix: "Change DOT Safety Training to required",
      },
    ],
    items: PKG_003_ITEMS,
    rules: PKG_003_RULES,
    dispatches: [
      {
        id: "d3-01",
        channel: "portal",
        sentAt: "2026-05-02 11:00",
        status: "opened",
      },
      {
        id: "d3-02",
        channel: "email",
        sentAt: "2026-05-02 11:01",
        status: "opened",
      },
    ],
    approvals: [
      {
        id: "a3-01",
        approver: "Patrick Cole",
        role: "Northwind Staffing Director",
        status: "approved",
        approvedAt: "2026-05-01",
      },
      {
        id: "a3-02",
        approver: "Sasha Patel",
        role: "Onboarding Lead",
        status: "approved",
        approvedAt: "2026-05-01",
      },
    ],
  },

  {
    id: "pkg-004",
    name: "SkyBridge Tech — C2C Contractor",
    version: "v1.1",
    client: "SkyBridge Tech",
    employmentType: "C2C",
    workLocation: "Austin, TX",
    jobCategory: "Software & Cloud",
    status: "published",
    createdBy: "Jordan Lee",
    approvedBy: "Jordan Lee",
    effectiveDate: "2026-03-01",
    itemCount: 12,
    requiredCount: 9,
    completionRate: 83,
    completionPct: 83,
    candidatesUsing: 3,
    lastModified: "2026-04-10",
    description:
      "Contractor engagement package for C2C workers at SkyBridge Tech. Covers SOW acknowledgment, acceptable-use policy, cloud security training, and timesheet setup.",
    riskScore: 31,
    aiReviewStatus: "clean",
    items: PKG_004_ITEMS,
    rules: PKG_004_RULES,
    dispatches: [
      {
        id: "d4-01",
        channel: "email",
        sentAt: "2026-03-05 09:00",
        status: "completed",
      },
    ],
    approvals: [
      {
        id: "a4-01",
        approver: "Jordan Lee",
        role: "Compliance Lead",
        status: "approved",
        approvedAt: "2026-03-04",
      },
    ],
  },

  {
    id: "pkg-005",
    name: "Apex Financial — 1099 Specialist",
    version: "v1.0",
    client: "Apex Financial",
    employmentType: "1099",
    workLocation: "New York, NY",
    jobCategory: "Finance & Accounting",
    status: "in-review",
    createdBy: "Sasha Patel",
    effectiveDate: "2026-07-01",
    itemCount: 10,
    requiredCount: 8,
    completionRate: 0,
    completionPct: 0,
    candidatesUsing: 0,
    lastModified: "2026-06-04",
    description:
      "Draft package for independent 1099 specialists engaged by Apex Financial. Under legal review for compliance with new contractor classification rules.",
    riskScore: 71,
    aiReviewStatus: "errors",
    aiWarnings: [
      {
        id: "w5-01",
        severity: "error",
        message:
          "Legal review for 1099 contractor classification is required per new Q3 2026 rules. Package must not be dispatched without legal sign-off.",
      },
      {
        id: "w5-02",
        severity: "warning",
        message:
          "IRS Form W-9 expiration rule: W-9 must be re-collected if contractor relationship exceeds 3 years.",
        fix: "Add W-9 renewal reminder trigger at 3 years",
      },
    ],
    items: PKG_005_ITEMS,
    rules: PKG_005_RULES,
    dispatches: [],
    approvals: [
      {
        id: "a5-01",
        approver: "Legal Team",
        role: "Legal Counsel",
        status: "pending",
        notes: "Under review — contractor classification rules update Q3 2026.",
      },
      {
        id: "a5-02",
        approver: "Jordan Lee",
        role: "Compliance Lead",
        status: "pending",
      },
    ],
  },

  {
    id: "pkg-006",
    name: "Northwind Logistics — C2C Transport",
    version: "v0.2",
    client: "Northwind Logistics",
    employmentType: "C2C",
    workLocation: "Chicago, IL",
    jobCategory: "Field & Operations",
    status: "draft",
    createdBy: "Riya Kim",
    effectiveDate: "2026-08-01",
    itemCount: 9,
    requiredCount: 7,
    completionRate: 0,
    completionPct: 0,
    candidatesUsing: 0,
    lastModified: "2026-06-06",
    description:
      "Early draft for C2C transportation contractors. Needs legal sign-off and DOT compliance requirements. Not yet submitted for review.",
    riskScore: 80,
    aiReviewStatus: "not-run",
    items: PKG_006_ITEMS,
    rules: PKG_006_RULES,
    dispatches: [],
    approvals: [],
  },

  {
    id: "pkg-007",
    name: "Meridian Health — W-2 Legacy (2025)",
    version: "v2.9",
    client: "Meridian Health",
    employmentType: "W-2",
    workLocation: "Nashville, TN",
    jobCategory: "Healthcare",
    status: "retired",
    createdBy: "Jordan Lee",
    approvedBy: "Jordan Lee",
    effectiveDate: "2025-01-01",
    expiryDate: "2025-12-31",
    itemCount: 17,
    requiredCount: 13,
    completionRate: 100,
    completionPct: 100,
    candidatesUsing: 0,
    lastModified: "2026-01-02",
    description:
      "Retired 2025 package for Meridian Health W-2 employees. Superseded by v3.2 effective 2026-01-01. Retained for audit and compliance evidence.",
    riskScore: 0,
    aiReviewStatus: "clean",
    items: PKG_007_ITEMS,
    rules: PKG_007_RULES,
    dispatches: [
      {
        id: "d7-01",
        channel: "portal",
        sentAt: "2025-01-05 08:00",
        status: "completed",
      },
    ],
    approvals: [
      {
        id: "a7-01",
        approver: "Jordan Lee",
        role: "Compliance Lead",
        status: "approved",
        approvedAt: "2025-01-03",
      },
    ],
  },

  {
    id: "pkg-008",
    name: "SkyBridge Tech — W-2 Engineering",
    version: "v2.0",
    client: "SkyBridge Tech",
    employmentType: "W-2",
    workLocation: "Austin, TX",
    jobCategory: "Software & Cloud",
    status: "approved",
    createdBy: "Sasha Patel",
    approvedBy: "Jordan Lee",
    effectiveDate: "2026-06-15",
    itemCount: 14,
    requiredCount: 11,
    completionRate: 0,
    completionPct: 0,
    candidatesUsing: 0,
    lastModified: "2026-06-05",
    description:
      "Approved and ready for publish. Full W-2 engineering package for SkyBridge Tech including DevSecOps training, cloud credential setup, and MFA enrollment.",
    riskScore: 22,
    aiReviewStatus: "clean",
    items: PKG_008_ITEMS,
    rules: PKG_008_RULES,
    dispatches: [],
    approvals: [
      {
        id: "a8-01",
        approver: "Naomi Reyes",
        role: "Head of Talent Ops, SkyBridge",
        status: "approved",
        approvedAt: "2026-06-04",
      },
      {
        id: "a8-02",
        approver: "Jordan Lee",
        role: "Compliance Lead",
        status: "approved",
        approvedAt: "2026-06-05",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getPackage(id: string): OnboardingPackage | undefined {
  return PACKAGES.find((p) => p.id === id);
}

export function getPackageItems(
  id: string,
  section?: PackageSection,
): PackageItem[] {
  const pkg = getPackage(id);
  if (!pkg) return [];
  if (!section) return pkg.items;
  return pkg.items.filter((item) => item.section === section);
}

export function getPackagesByClient(clientName: string): OnboardingPackage[] {
  return PACKAGES.filter((p) => p.client === clientName);
}

export function packageStats(): {
  published: number;
  inReview: number;
  draft: number;
  retired: number;
} {
  const published = PACKAGES.filter((p) =>
    ["published", "approved"].includes(p.status),
  ).length;
  const inReview = PACKAGES.filter((p) => p.status === "in-review").length;
  const draft = PACKAGES.filter((p) => p.status === "draft").length;
  const retired = PACKAGES.filter((p) => p.status === "retired").length;
  return { published, inReview, draft, retired };
}
