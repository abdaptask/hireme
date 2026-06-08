/**
 * Extended Compliance Policy Center data (CLAUDE.md §21, §57).
 * Additional policies supplementing /lib/compliance.ts for the enhanced grid.
 */

import type { CompliancePolicy } from "@/lib/compliance";

/** Extended status type — adds "expiring-soon" for UI display purposes. */
export type ExtendedPolicyStatus =
  | "active"
  | "draft"
  | "expired"
  | "under-review"
  | "expiring-soon";

/** Category filter tabs */
export const POLICY_CATEGORIES = [
  "All",
  "Federal",
  "State-Specific",
  "Client-Specific",
  "Employment Type",
  "Industry",
] as const;

export type PolicyCategoryFilter = (typeof POLICY_CATEGORIES)[number];

/** Category tag meta for display */
export const CATEGORY_META: Record<
  string,
  { label: string; color: string }
> = {
  federal: {
    label: "Federal",
    color:
      "bg-info-muted text-info-muted-foreground",
  },
  state: {
    label: "State",
    color:
      "bg-ai-muted text-ai-muted-foreground",
  },
  client: {
    label: "Client-Specific",
    color:
      "bg-warning-muted text-warning-muted-foreground",
  },
  employment: {
    label: "Employment",
    color:
      "bg-neutral-muted text-neutral-muted-foreground",
  },
  privacy: {
    label: "Privacy",
    color:
      "bg-info-muted text-info-muted-foreground",
  },
  security: {
    label: "Security",
    color:
      "bg-danger-muted text-danger-muted-foreground",
  },
  financial: {
    label: "Financial",
    color:
      "bg-success-muted text-success-muted-foreground",
  },
  safety: {
    label: "Safety",
    color:
      "bg-warning-muted text-warning-muted-foreground",
  },
  industry: {
    label: "Industry",
    color:
      "bg-ai-muted text-ai-muted-foreground",
  },
};

/** Change history entry for policy detail slide-over */
export type PolicyChange = {
  date: string;
  actor: string;
  description: string;
};

/** Extended policy type with additional detail fields */
export type ExtendedCompliancePolicy = CompliancePolicy & {
  /** Normalized category key for filtering (federal | state | client | employment | privacy | security | financial | safety | industry) */
  categoryKey: string;
  /** State code(s) this applies to, e.g. ["CA"] or [] for federal */
  stateApplicability: string[];
  /** Employment types this applies to */
  employmentTypes: string[];
  /** Job categories */
  jobCategories: string[];
  /** Related workflow name */
  relatedWorkflow?: string;
  /** Change history (most recent first) */
  changeHistory: PolicyChange[];
  /** Acknowledgment form name if requiresAck */
  ackFormName?: string;
  /** Impacted candidate count (mock) */
  impactedCandidates: number;
};

/** TODAY used consistently for "expiring soon" calculation */
const TODAY = new Date("2026-06-07");
const THIRTY_DAYS = new Date(TODAY);
THIRTY_DAYS.setDate(THIRTY_DAYS.getDate() + 30);

export function getDisplayStatus(policy: ExtendedCompliancePolicy): ExtendedPolicyStatus {
  if (policy.status === "expired" || policy.status === "draft" || policy.status === "under-review") {
    return policy.status as ExtendedPolicyStatus;
  }
  if (policy.expirationDate) {
    const exp = new Date(policy.expirationDate);
    if (exp <= TODAY) return "expired";
    if (exp <= THIRTY_DAYS) return "expiring-soon";
  }
  return "active";
}

export const EXTENDED_STATUS_META: Record<
  ExtendedPolicyStatus,
  { label: string; tone: "success" | "warning" | "danger" | "neutral" | "info" }
> = {
  active: { label: "Active", tone: "success" },
  "expiring-soon": { label: "Expiring Soon", tone: "warning" },
  expired: { label: "Expired", tone: "danger" },
  draft: { label: "Draft", tone: "neutral" },
  "under-review": { label: "Under Review", tone: "info" },
};

export const ALL_COMPLIANCE_POLICIES: ExtendedCompliancePolicy[] = [
  // ─── Federal ──────────────────────────────────────────────────────────────
  {
    id: "pol-001",
    name: "Federal I-9 Employment Eligibility",
    description:
      "Mandates completion of USCIS Form I-9 for all new hires within 3 business days of start date. Covers document verification, E-Verify submission requirements, and remote hire alternative procedures under post-pandemic DHS guidance. Failure to complete within the prescribed window triggers civil monetary penalties.",
    owner: "Riya Kim",
    legalApprover: "Legal Counsel",
    jurisdiction: "Federal",
    category: "Employment",
    categoryKey: "federal",
    stateApplicability: [],
    employmentTypes: ["W-2", "C2C", "1099"],
    jobCategories: ["All"],
    effectiveDate: "2024-01-01",
    status: "active",
    version: "v4.1",
    requiresAck: true,
    ackFormName: "I-9 Completion Acknowledgment",
    relatedForms: ["I-9 Form", "E-Verify Authorization", "Remote I-9 Consent"],
    relatedWorkflow: "Federal Onboarding Compliance",
    clientApplicability: ["All"],
    lastReviewed: "2026-01-15",
    impactedCandidates: 142,
    changeHistory: [
      { date: "2026-01-15", actor: "Riya Kim", description: "Updated remote verification procedure per DHS 2026 guidance" },
      { date: "2025-06-01", actor: "Legal Counsel", description: "Added biometric I-9 guidance for E-Verify" },
      { date: "2024-01-01", actor: "Riya Kim", description: "Initial policy creation — v4.0" },
    ],
  },
  {
    id: "pol-007",
    name: "Anti-Harassment & Equal Opportunity (EEO)",
    description:
      "Federal EEO compliance policy prohibiting harassment, discrimination, and retaliation on the basis of race, color, religion, sex, national origin, age, disability, or genetic information. Mandatory annual acknowledgment and training for all workforce members.",
    owner: "Riya Kim",
    legalApprover: "Legal Counsel",
    jurisdiction: "Federal",
    category: "Employment",
    categoryKey: "federal",
    stateApplicability: [],
    employmentTypes: ["W-2", "C2C", "1099"],
    jobCategories: ["All"],
    effectiveDate: "2024-01-01",
    status: "active",
    version: "v2.2",
    requiresAck: true,
    ackFormName: "EEO Policy Acknowledgment",
    relatedForms: ["EEO Acknowledgment", "Harassment Reporting Form"],
    relatedWorkflow: "Annual Compliance Training",
    clientApplicability: ["All"],
    lastReviewed: "2026-02-01",
    impactedCandidates: 218,
    changeHistory: [
      { date: "2026-02-01", actor: "Riya Kim", description: "Added gender identity protections per updated EEOC guidance" },
      { date: "2025-01-10", actor: "Legal Counsel", description: "Expanded retaliation definition" },
      { date: "2024-01-01", actor: "Riya Kim", description: "Policy baseline established" },
    ],
  },
  {
    id: "pol-004",
    name: "HIPAA Privacy & Security Compliance",
    description:
      "Governs access to protected health information (PHI) for all workforce members engaged with covered entities and business associates. Requires annual training completion, BAA acknowledgment, and incident reporting procedures. Applies to all staff at Meridian Health and any other covered-entity clients.",
    owner: "Riya Kim",
    legalApprover: "CISO",
    jurisdiction: "Federal",
    category: "Privacy",
    categoryKey: "client",
    stateApplicability: [],
    employmentTypes: ["W-2", "C2C", "1099"],
    jobCategories: ["Healthcare", "IT", "Administrative"],
    effectiveDate: "2024-06-01",
    expirationDate: "2027-06-01",
    status: "active",
    version: "v3.0",
    requiresAck: true,
    ackFormName: "HIPAA Workforce Acknowledgment",
    relatedForms: ["HIPAA Acknowledgment", "BAA", "PHI Access Agreement"],
    relatedWorkflow: "Healthcare Client Onboarding",
    clientApplicability: ["Meridian Health"],
    lastReviewed: "2026-01-10",
    impactedCandidates: 34,
    changeHistory: [
      { date: "2026-01-10", actor: "CISO", description: "Updated breach notification timeline per OCR 2026 rule" },
      { date: "2025-06-01", actor: "Riya Kim", description: "Added telehealth workforce provisions" },
      { date: "2024-06-01", actor: "Legal Counsel", description: "Policy v3.0 published" },
    ],
  },
  {
    id: "pol-009",
    name: "Drug-Free Workplace Act Compliance",
    description:
      "Zero-tolerance policy for controlled substance use covering all safety-sensitive and federal-contractor roles. Requires pre-employment drug screening and written random-testing consent. Applies to Northwind Logistics (DOT-regulated) and Meridian Health (Joint Commission).",
    owner: "Sasha Patel",
    legalApprover: "Legal Counsel",
    jurisdiction: "Federal",
    category: "Safety",
    categoryKey: "federal",
    stateApplicability: [],
    employmentTypes: ["W-2", "1099"],
    jobCategories: ["Operations", "Healthcare", "Transportation"],
    effectiveDate: "2024-03-01",
    status: "active",
    version: "v2.1",
    requiresAck: true,
    ackFormName: "DFWP Acknowledgment",
    relatedForms: ["Drug Screen Consent", "DFWP Acknowledgment", "Random Testing Consent"],
    relatedWorkflow: "Pre-Employment Screening",
    clientApplicability: ["Northwind Logistics", "Meridian Health"],
    lastReviewed: "2026-01-20",
    impactedCandidates: 57,
    changeHistory: [
      { date: "2026-01-20", actor: "Sasha Patel", description: "Added oral fluid testing option per SAMHSA guidelines" },
      { date: "2025-03-01", actor: "Legal Counsel", description: "Extended to C2C safety-sensitive roles" },
      { date: "2024-03-01", actor: "Sasha Patel", description: "Policy created" },
    ],
  },
  {
    id: "pol-013",
    name: "Background Check FCRA Adverse Action Notice",
    description:
      "Mandates pre-adverse action and final adverse action notices under the Fair Credit Reporting Act before taking employment action based on a consumer report. Requires a 5-business-day candidate response window. Covers all background check vendors.",
    owner: "Jordan Lee",
    legalApprover: "Legal Counsel",
    jurisdiction: "Federal",
    category: "Employment",
    categoryKey: "federal",
    stateApplicability: [],
    employmentTypes: ["W-2", "C2C", "1099"],
    jobCategories: ["All"],
    effectiveDate: "2025-01-01",
    status: "active",
    version: "v2.0",
    requiresAck: false,
    relatedForms: ["FCRA Disclosure", "Pre-Adverse Action Notice", "Adverse Action Notice"],
    relatedWorkflow: "Screening Adjudication",
    clientApplicability: ["All"],
    lastReviewed: "2026-03-10",
    impactedCandidates: 89,
    changeHistory: [
      { date: "2026-03-10", actor: "Jordan Lee", description: "Extended candidate response window from 3 to 5 business days" },
      { date: "2025-01-01", actor: "Legal Counsel", description: "Policy v2.0 — added safe harbor provisions" },
      { date: "2024-06-15", actor: "Jordan Lee", description: "Initial draft" },
    ],
  },
  {
    id: "pol-020",
    name: "ITAR / Export Controls Policy",
    description:
      "Governs access to defense articles, technical data, and defense services covered under the International Traffic in Arms Regulations (ITAR) and Export Administration Regulations (EAR). Applies to all personnel with access to ITAR-controlled client environments or data. Requires citizenship verification and annual training.",
    owner: "Riya Kim",
    legalApprover: "Export Compliance Officer",
    jurisdiction: "Federal",
    category: "Security",
    categoryKey: "federal",
    stateApplicability: [],
    employmentTypes: ["W-2", "C2C"],
    jobCategories: ["Engineering", "IT", "Defense"],
    effectiveDate: "2025-03-01",
    status: "active",
    version: "v1.5",
    requiresAck: true,
    ackFormName: "ITAR Workforce Acknowledgment",
    relatedForms: ["ITAR Acknowledgment", "Citizenship Declaration", "Export Training Certificate"],
    relatedWorkflow: "Security Clearance Onboarding",
    clientApplicability: ["Defense Dynamics LLC"],
    lastReviewed: "2026-04-15",
    impactedCandidates: 18,
    changeHistory: [
      { date: "2026-04-15", actor: "Riya Kim", description: "Added deemed export provisions for foreign nationals" },
      { date: "2025-09-01", actor: "Export Compliance Officer", description: "Updated EAR classification list" },
      { date: "2025-03-01", actor: "Legal Counsel", description: "Policy created for defense-sector clients" },
    ],
  },
  {
    id: "pol-011",
    name: "FINRA Regulatory Compliance Disclosure",
    description:
      "Required FINRA conduct disclosures and background check consent for all financial services roles. Covers U4/U5 form requirements and ongoing reporting obligations. Applies to all placements at Apex Financial and other FINRA-registered entities.",
    owner: "Riya Kim",
    legalApprover: "Compliance Officer",
    jurisdiction: "Federal",
    category: "Financial",
    categoryKey: "financial",
    stateApplicability: [],
    employmentTypes: ["W-2", "C2C"],
    jobCategories: ["Finance", "Compliance", "Operations"],
    effectiveDate: "2025-01-01",
    status: "active",
    version: "v3.1",
    requiresAck: true,
    ackFormName: "FINRA Disclosure Consent",
    relatedForms: ["FINRA U4 Consent", "Regulatory Disclosure Form", "Annual Certification"],
    relatedWorkflow: "Financial Services Onboarding",
    clientApplicability: ["Apex Financial"],
    lastReviewed: "2026-04-01",
    impactedCandidates: 23,
    changeHistory: [
      { date: "2026-04-01", actor: "Riya Kim", description: "Added crypto asset disclosure section" },
      { date: "2025-07-15", actor: "Compliance Officer", description: "Updated for FINRA Rule 3110 amendments" },
      { date: "2025-01-01", actor: "Riya Kim", description: "Policy v3.0 published" },
    ],
  },

  // ─── State-Specific ───────────────────────────────────────────────────────
  {
    id: "pol-002",
    name: "California Wage Notice (WTPA)",
    description:
      "Requires written wage notice disclosing pay rate, pay day schedule, overtime status, and employer contact information for all W-2 employees in California at time of hire and whenever rates change. Non-compliance triggers a $50-per-employee-per-day penalty.",
    owner: "Sasha Patel",
    legalApprover: "Legal Counsel",
    jurisdiction: "California",
    category: "Employment",
    categoryKey: "state",
    stateApplicability: ["CA"],
    employmentTypes: ["W-2"],
    jobCategories: ["All"],
    effectiveDate: "2025-01-01",
    status: "active",
    version: "v2.3",
    requiresAck: true,
    ackFormName: "CA Wage Notice Acknowledgment",
    relatedForms: ["CA Wage Notice", "WTPA-2025", "Cal/OSHA Safety Notice"],
    relatedWorkflow: "California W-2 Onboarding",
    clientApplicability: ["Meridian Health", "SkyBridge Tech"],
    lastReviewed: "2026-02-10",
    impactedCandidates: 41,
    changeHistory: [
      { date: "2026-02-10", actor: "Sasha Patel", description: "Updated to 2026 minimum wage rates" },
      { date: "2025-07-01", actor: "Legal Counsel", description: "Added bi-weekly vs semi-monthly clarification" },
      { date: "2025-01-01", actor: "Sasha Patel", description: "v2.3 published with updated Labor Code references" },
    ],
  },
  {
    id: "pol-003",
    name: "New York Paid Family & Sick Leave Notice",
    description:
      "Mandates disclosure of NYPFL rights, payroll deduction rate, and PFL opt-out election for all New York employees. Must be delivered before first payroll run. Also covers NYC Paid Safe and Sick Leave Act (PSSL) requirements for NYC-based workers.",
    owner: "Jordan Lee",
    legalApprover: "Legal Counsel",
    jurisdiction: "New York",
    category: "Employment",
    categoryKey: "state",
    stateApplicability: ["NY"],
    employmentTypes: ["W-2"],
    jobCategories: ["All"],
    effectiveDate: "2025-07-01",
    status: "active",
    version: "v1.2",
    requiresAck: true,
    ackFormName: "NYPFL Election Notice",
    relatedForms: ["NYPFL Election Notice", "NYC PSSL Notice"],
    relatedWorkflow: "New York State Onboarding",
    clientApplicability: ["Apex Financial"],
    lastReviewed: "2026-03-01",
    impactedCandidates: 28,
    changeHistory: [
      { date: "2026-03-01", actor: "Jordan Lee", description: "Updated 2026 NYPFL deduction rate to 0.373%" },
      { date: "2025-07-01", actor: "Legal Counsel", description: "v1.2 published — NYC PSSL integration" },
      { date: "2025-01-15", actor: "Jordan Lee", description: "Initial draft combining PFL + PSSL requirements" },
    ],
  },
  {
    id: "pol-014",
    name: "Illinois Biometric Information Privacy Act (BIPA)",
    description:
      "Governs collection, use, storage, and destruction of biometric identifiers (fingerprints, face geometry, retina scans) in Illinois. Requires a written release before collection and a published retention schedule. Non-compliance exposes the company to $1,000–$5,000 liquidated damages per violation.",
    owner: "Jordan Lee",
    legalApprover: "DPO",
    jurisdiction: "Illinois",
    category: "Privacy",
    categoryKey: "state",
    stateApplicability: ["IL"],
    employmentTypes: ["W-2", "C2C", "1099"],
    jobCategories: ["All"],
    effectiveDate: "2025-05-01",
    status: "active",
    version: "v1.0",
    requiresAck: true,
    ackFormName: "BIPA Written Release",
    relatedForms: ["BIPA Written Release", "Biometric Retention Schedule"],
    relatedWorkflow: "Illinois Privacy Compliance",
    clientApplicability: ["All"],
    lastReviewed: "2026-02-20",
    impactedCandidates: 12,
    changeHistory: [
      { date: "2026-02-20", actor: "Jordan Lee", description: "Added face geometry guidance following IL Supreme Court ruling" },
      { date: "2025-05-01", actor: "DPO", description: "Policy created — first coverage of BIPA in IL placements" },
      { date: "2025-04-01", actor: "Jordan Lee", description: "Draft reviewed by Legal" },
    ],
  },
  {
    id: "pol-015",
    name: "Washington Paid Family & Medical Leave",
    description:
      "Requires employer and employee premium contributions to Washington's PFML program for all W-2 employees working in Washington state. Employers with fewer than 50 employees are exempt from the employer share. Quarterly premium reports required.",
    owner: "Sasha Patel",
    legalApprover: "Legal Counsel",
    jurisdiction: "Washington",
    category: "Employment",
    categoryKey: "state",
    stateApplicability: ["WA"],
    employmentTypes: ["W-2"],
    jobCategories: ["All"],
    effectiveDate: "2026-01-01",
    expirationDate: "2026-12-31",
    status: "active",
    version: "v1.1",
    requiresAck: true,
    ackFormName: "WA PFML Premium Consent",
    relatedForms: ["WA PFML Notice", "WA PFML Waiver (small employer)"],
    relatedWorkflow: "Washington State Onboarding",
    clientApplicability: ["SkyBridge Tech"],
    lastReviewed: "2026-01-05",
    impactedCandidates: 9,
    changeHistory: [
      { date: "2026-01-05", actor: "Sasha Patel", description: "Updated 2026 premium rate to 0.92%" },
      { date: "2025-09-15", actor: "Legal Counsel", description: "Added small-employer exemption workflow" },
      { date: "2025-06-01", actor: "Sasha Patel", description: "Initial policy v1.0" },
    ],
  },
  {
    id: "pol-006",
    name: "Texas Worker Classification Policy",
    description:
      "Covers independent contractor versus employee classification thresholds specific to Texas state requirements, aligned with TWC guidelines. Impacts 1099 and C2C engagements placed with Texas-based clients or remote workers engaged from Texas.",
    owner: "Jordan Lee",
    legalApprover: "Legal Counsel",
    jurisdiction: "Texas",
    category: "Employment",
    categoryKey: "employment",
    stateApplicability: ["TX"],
    employmentTypes: ["1099", "C2C"],
    jobCategories: ["All"],
    effectiveDate: "2025-09-01",
    status: "under-review",
    version: "v1.0",
    requiresAck: false,
    relatedForms: [],
    relatedWorkflow: "Worker Classification Review",
    clientApplicability: ["Northwind Logistics"],
    lastReviewed: "2026-05-20",
    impactedCandidates: 7,
    changeHistory: [
      { date: "2026-05-20", actor: "Jordan Lee", description: "Under review following TWC Q2 2026 guidance update" },
      { date: "2025-09-01", actor: "Legal Counsel", description: "Policy v1.0 drafted" },
      { date: "2025-08-15", actor: "Jordan Lee", description: "Initial classification matrix created" },
    ],
  },
  {
    id: "pol-010",
    name: "California Consumer Privacy Act (CCPA) — 2023",
    description:
      "Governed data subject rights for California residents including access, deletion, and opt-out rights. Superseded by CPRA v2024. Records retained for audit purposes only.",
    owner: "Jordan Lee",
    legalApprover: "DPO",
    jurisdiction: "California",
    category: "Privacy",
    categoryKey: "state",
    stateApplicability: ["CA"],
    employmentTypes: ["W-2", "C2C", "1099"],
    jobCategories: ["All"],
    effectiveDate: "2023-01-01",
    expirationDate: "2023-12-31",
    status: "expired",
    version: "v1.0",
    requiresAck: false,
    relatedForms: ["CCPA Notice"],
    relatedWorkflow: "Privacy Policy Archive",
    clientApplicability: ["All"],
    lastReviewed: "2024-01-05",
    impactedCandidates: 0,
    changeHistory: [
      { date: "2024-01-05", actor: "Jordan Lee", description: "Policy expired — superseded by CPRA v2024" },
      { date: "2023-01-01", actor: "DPO", description: "Policy v1.0 published" },
    ],
  },

  // ─── Client-Specific ──────────────────────────────────────────────────────
  {
    id: "pol-016",
    name: "SOX Internal Controls — Financial Reporting",
    description:
      "Establishes Sarbanes-Oxley compliance controls for all C2C and contractor engagements supporting financial reporting functions at Global Finance Corp. Requires segregation-of-duties acknowledgment and IT general controls training before system access is granted.",
    owner: "Riya Kim",
    legalApprover: "External Auditor",
    jurisdiction: "Client-Specific",
    category: "Financial",
    categoryKey: "client",
    stateApplicability: [],
    employmentTypes: ["C2C"],
    jobCategories: ["Finance", "IT", "Audit"],
    effectiveDate: "2025-04-01",
    status: "active",
    version: "v2.0",
    requiresAck: true,
    ackFormName: "SOX Controls Acknowledgment",
    relatedForms: ["SOX Controls Acknowledgment", "IT General Controls Training Certificate", "Segregation of Duties Form"],
    relatedWorkflow: "Financial Client Onboarding",
    clientApplicability: ["Global Finance Corp"],
    lastReviewed: "2026-05-01",
    impactedCandidates: 11,
    changeHistory: [
      { date: "2026-05-01", actor: "Riya Kim", description: "Updated for PCAOB AS 2201 amendments" },
      { date: "2025-10-15", actor: "External Auditor", description: "Added IT GC testing scope" },
      { date: "2025-04-01", actor: "Riya Kim", description: "Policy v2.0 published for Global Finance Corp" },
    ],
  },
  {
    id: "pol-005",
    name: "Information Security Acceptable Use Policy",
    description:
      "Defines acceptable use of corporate IT assets, networks, email, cloud services, and data. Applies to all employees and contractors with system access. Covers prohibited activities, password requirements, device security, and incident reporting obligations.",
    owner: "Sasha Patel",
    legalApprover: "CISO",
    jurisdiction: "Global",
    category: "Security",
    categoryKey: "security",
    stateApplicability: [],
    employmentTypes: ["W-2", "C2C", "1099"],
    jobCategories: ["All"],
    effectiveDate: "2025-01-01",
    status: "active",
    version: "v2.0",
    requiresAck: true,
    ackFormName: "AUP Acknowledgment",
    relatedForms: ["AUP Acknowledgment", "Password Policy Confirmation"],
    relatedWorkflow: "IT Provisioning",
    clientApplicability: ["All"],
    lastReviewed: "2026-01-15",
    impactedCandidates: 195,
    changeHistory: [
      { date: "2026-01-15", actor: "CISO", description: "Added AI tool usage restrictions" },
      { date: "2025-06-01", actor: "Sasha Patel", description: "Updated BYOD requirements" },
      { date: "2025-01-01", actor: "CISO", description: "Policy v2.0 — major revision" },
    ],
  },
  {
    id: "pol-008",
    name: "GDPR Data Processing Policy",
    description:
      "Governs collection, processing, storage, and cross-border transfer of personal data for EU data subjects under the General Data Protection Regulation. Applies to all global engagements where candidate or employee data of EU residents is handled.",
    owner: "Jordan Lee",
    legalApprover: "DPO",
    jurisdiction: "Global",
    category: "Privacy",
    categoryKey: "privacy",
    stateApplicability: [],
    employmentTypes: ["W-2", "C2C", "1099"],
    jobCategories: ["All"],
    effectiveDate: "2024-05-25",
    status: "active",
    version: "v1.5",
    requiresAck: true,
    ackFormName: "Data Processing Consent",
    relatedForms: ["Data Processing Consent", "EU SCCs", "ROT Record"],
    relatedWorkflow: "Global Privacy Compliance",
    clientApplicability: ["Apex Financial", "SkyBridge Tech"],
    lastReviewed: "2026-03-15",
    impactedCandidates: 31,
    changeHistory: [
      { date: "2026-03-15", actor: "DPO", description: "Added EU-US Data Privacy Framework provisions" },
      { date: "2025-05-25", actor: "Jordan Lee", description: "Annual review — no changes required" },
      { date: "2024-05-25", actor: "DPO", description: "Policy v1.5 published" },
    ],
  },
  {
    id: "pol-012",
    name: "Remote Work Security Standards",
    description:
      "Minimum security controls for remote and hybrid workforce including mandatory VPN use, full-disk endpoint encryption, secure home-network requirements, and clear-desk policy. Covers all remote placements regardless of employment type.",
    owner: "Sasha Patel",
    legalApprover: "CISO",
    jurisdiction: "Global",
    category: "Security",
    categoryKey: "security",
    stateApplicability: [],
    employmentTypes: ["W-2", "C2C", "1099"],
    jobCategories: ["All"],
    effectiveDate: "2025-06-01",
    status: "draft",
    version: "v0.8",
    requiresAck: false,
    relatedForms: [],
    relatedWorkflow: "Remote Work Compliance",
    clientApplicability: ["SkyBridge Tech", "Apex Financial"],
    lastReviewed: "2026-05-30",
    impactedCandidates: 0,
    changeHistory: [
      { date: "2026-05-30", actor: "CISO", description: "Draft revised with Zero Trust network requirements" },
      { date: "2026-03-01", actor: "Sasha Patel", description: "Peer review complete — awaiting legal sign-off" },
      { date: "2025-06-01", actor: "Sasha Patel", description: "Initial draft created" },
    ],
  },
];

/** Stats computed from the full policy set */
export function computeComplianceStats() {
  const today = new Date("2026-06-07");
  const thirtyDays = new Date(today);
  thirtyDays.setDate(thirtyDays.getDate() + 30);

  const active = ALL_COMPLIANCE_POLICIES.filter((p) => p.status === "active").length;
  const expiringSoon = ALL_COMPLIANCE_POLICIES.filter((p) => {
    if (!p.expirationDate || p.status !== "active") return false;
    const exp = new Date(p.expirationDate);
    return exp > today && exp <= thirtyDays;
  }).length;
  const pendingAck = ALL_COMPLIANCE_POLICIES.filter(
    (p) => p.requiresAck && p.status === "active",
  ).length;
  const coverage = 97;

  return { active, expiringSoon, pendingAck, coverage };
}
