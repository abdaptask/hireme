/**
 * Compliance Policy Center data (CLAUDE.md §21).
 * Organized by jurisdiction, category, and client applicability.
 */
import type { StatusTone } from "@/lib/types";

export type PolicyStatus = "active" | "draft" | "expired" | "under-review";

export type CompliancePolicy = {
  id: string;
  name: string;
  description: string;
  owner: string;
  legalApprover: string;
  jurisdiction: string;
  category: string;
  effectiveDate: string;
  expirationDate?: string;
  status: PolicyStatus;
  version: string;
  requiresAck: boolean;
  relatedForms: string[];
  clientApplicability: string[];
  lastReviewed: string;
};

export const POLICY_STATUS_META: Record<
  PolicyStatus,
  { label: string; tone: StatusTone }
> = {
  active: { label: "Active", tone: "success" },
  draft: { label: "Draft", tone: "neutral" },
  expired: { label: "Expired", tone: "danger" },
  "under-review": { label: "Under Review", tone: "warning" },
};

export const COMPLIANCE_POLICIES: CompliancePolicy[] = [
  {
    id: "pol-001",
    name: "Federal I-9 Employment Eligibility",
    description:
      "Mandates completion of USCIS Form I-9 for all new hires within 3 business days of start. Covers document verification and E-Verify submission requirements.",
    owner: "Riya Kim",
    legalApprover: "Legal Counsel",
    jurisdiction: "Federal",
    category: "Employment",
    effectiveDate: "2024-01-01",
    status: "active",
    version: "v4.1",
    requiresAck: true,
    relatedForms: ["I-9", "E-Verify Authorization"],
    clientApplicability: ["All"],
    lastReviewed: "2026-01-15",
  },
  {
    id: "pol-002",
    name: "California Wage Notice (WTPA)",
    description:
      "Requires written wage notice disclosing pay rate, pay day schedule, and employer contact information for all W-2 employees in California.",
    owner: "Sasha Patel",
    legalApprover: "Legal Counsel",
    jurisdiction: "California",
    category: "Employment",
    effectiveDate: "2025-01-01",
    status: "active",
    version: "v2.3",
    requiresAck: true,
    relatedForms: ["CA Wage Notice", "WTPA-2025"],
    clientApplicability: ["Meridian Health", "SkyBridge Tech"],
    lastReviewed: "2026-02-10",
  },
  {
    id: "pol-003",
    name: "New York Paid Family Leave Notice",
    description:
      "Mandates disclosure of NYPFL rights and deduction consent for all employees based in New York state. Must be delivered before first payroll.",
    owner: "Jordan Lee",
    legalApprover: "Legal Counsel",
    jurisdiction: "New York",
    category: "Employment",
    effectiveDate: "2025-07-01",
    status: "active",
    version: "v1.2",
    requiresAck: true,
    relatedForms: ["NYPFL Election Notice"],
    clientApplicability: ["Apex Financial"],
    lastReviewed: "2026-03-01",
  },
  {
    id: "pol-004",
    name: "HIPAA Privacy & Security Compliance",
    description:
      "Governs access to protected health information (PHI) for all workforce members engaged with covered entities. Requires annual training and BAA acknowledgment.",
    owner: "Riya Kim",
    legalApprover: "CISO",
    jurisdiction: "Federal",
    category: "Privacy",
    effectiveDate: "2024-06-01",
    expirationDate: "2027-06-01",
    status: "active",
    version: "v3.0",
    requiresAck: true,
    relatedForms: ["HIPAA Acknowledgment", "BAA"],
    clientApplicability: ["Meridian Health"],
    lastReviewed: "2026-01-10",
  },
  {
    id: "pol-005",
    name: "Information Security Acceptable Use",
    description:
      "Defines acceptable use of corporate IT assets, networks, and data. Applies to all employees and contractors with system access.",
    owner: "Sasha Patel",
    legalApprover: "CISO",
    jurisdiction: "Global",
    category: "Security",
    effectiveDate: "2025-01-01",
    status: "active",
    version: "v2.0",
    requiresAck: true,
    relatedForms: ["AUP Acknowledgment"],
    clientApplicability: ["All"],
    lastReviewed: "2026-01-15",
  },
  {
    id: "pol-006",
    name: "Texas Worker Classification Policy",
    description:
      "Covers independent contractor versus employee classification thresholds specific to Texas state requirements. Impacts 1099 and C2C engagements.",
    owner: "Jordan Lee",
    legalApprover: "Legal Counsel",
    jurisdiction: "Texas",
    category: "Employment",
    effectiveDate: "2025-09-01",
    status: "under-review",
    version: "v1.0",
    requiresAck: false,
    relatedForms: [],
    clientApplicability: ["Northwind Logistics"],
    lastReviewed: "2026-05-20",
  },
  {
    id: "pol-007",
    name: "Anti-Harassment & Equal Opportunity",
    description:
      "Federal EEO compliance policy prohibiting harassment, discrimination, and retaliation. Mandatory acknowledgment and annual training for all staff.",
    owner: "Riya Kim",
    legalApprover: "Legal Counsel",
    jurisdiction: "Federal",
    category: "Employment",
    effectiveDate: "2024-01-01",
    status: "active",
    version: "v2.2",
    requiresAck: true,
    relatedForms: ["EEO Acknowledgment"],
    clientApplicability: ["All"],
    lastReviewed: "2026-02-01",
  },
  {
    id: "pol-008",
    name: "GDPR Data Processing Policy",
    description:
      "Governs collection, processing, storage, and cross-border transfer of personal data for EU data subjects. Applies to all global engagements with EU operations.",
    owner: "Jordan Lee",
    legalApprover: "DPO",
    jurisdiction: "Global",
    category: "Privacy",
    effectiveDate: "2024-05-25",
    status: "active",
    version: "v1.5",
    requiresAck: true,
    relatedForms: ["Data Processing Consent"],
    clientApplicability: ["Apex Financial", "SkyBridge Tech"],
    lastReviewed: "2026-03-15",
  },
  {
    id: "pol-009",
    name: "Drug & Alcohol-Free Workplace",
    description:
      "Zero-tolerance policy for controlled substance use in safety-sensitive roles. Requires pre-employment drug screening and random testing consent.",
    owner: "Sasha Patel",
    legalApprover: "Legal Counsel",
    jurisdiction: "Federal",
    category: "Safety",
    effectiveDate: "2024-03-01",
    status: "active",
    version: "v2.1",
    requiresAck: true,
    relatedForms: ["Drug Screen Consent", "DFWP Acknowledgment"],
    clientApplicability: ["Northwind Logistics", "Meridian Health"],
    lastReviewed: "2026-01-20",
  },
  {
    id: "pol-010",
    name: "California Consumer Privacy Act (CCPA)",
    description:
      "Governs data subject rights for California residents including access, deletion, and opt-out rights. Applies to all workforce records of CA-based candidates.",
    owner: "Jordan Lee",
    legalApprover: "DPO",
    jurisdiction: "California",
    category: "Privacy",
    effectiveDate: "2023-01-01",
    expirationDate: "2023-12-31",
    status: "expired",
    version: "v1.0",
    requiresAck: false,
    relatedForms: ["CCPA Notice"],
    clientApplicability: ["All"],
    lastReviewed: "2024-01-05",
  },
  {
    id: "pol-011",
    name: "Financial Industry Regulatory (FINRA) Compliance",
    description:
      "Required FINRA conduct disclosures and background check consent for all financial services roles. Covers U4/U5 form requirements.",
    owner: "Riya Kim",
    legalApprover: "Compliance Officer",
    jurisdiction: "Federal",
    category: "Financial",
    effectiveDate: "2025-01-01",
    status: "active",
    version: "v3.1",
    requiresAck: true,
    relatedForms: ["FINRA U4 Consent", "Regulatory Disclosure Form"],
    clientApplicability: ["Apex Financial"],
    lastReviewed: "2026-04-01",
  },
  {
    id: "pol-012",
    name: "Remote Work Security Standards",
    description:
      "Minimum security controls for remote and hybrid workforce including VPN use, endpoint encryption, and secure workspace requirements.",
    owner: "Sasha Patel",
    legalApprover: "CISO",
    jurisdiction: "Global",
    category: "Security",
    effectiveDate: "2025-06-01",
    status: "draft",
    version: "v0.8",
    requiresAck: false,
    relatedForms: [],
    clientApplicability: ["SkyBridge Tech", "Apex Financial"],
    lastReviewed: "2026-05-30",
  },
];

export function complianceStats(): {
  active: number;
  draft: number;
  expiringSoon: number;
  expired: number;
} {
  const now = new Date("2026-06-07");
  const ninetyDays = new Date(now);
  ninetyDays.setDate(ninetyDays.getDate() + 90);

  const active = COMPLIANCE_POLICIES.filter((p) => p.status === "active").length;
  const draft = COMPLIANCE_POLICIES.filter((p) =>
    ["draft", "under-review"].includes(p.status),
  ).length;
  const expired = COMPLIANCE_POLICIES.filter((p) => p.status === "expired").length;
  const expiringSoon = COMPLIANCE_POLICIES.filter((p) => {
    if (!p.expirationDate || p.status !== "active") return false;
    const exp = new Date(p.expirationDate);
    return exp <= ninetyDays && exp > now;
  }).length;

  return { active, draft, expiringSoon, expired };
}
