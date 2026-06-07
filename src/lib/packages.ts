/**
 * Onboarding Packages data (CLAUDE.md §8, §9).
 * Client-mapped package definitions with versioning and completion tracking.
 */
import type { StatusTone } from "@/lib/types";

export type PackageStatus =
  | "draft"
  | "in-review"
  | "approved"
  | "published"
  | "retired";

export type PackageItem = {
  id: string;
  label: string;
  category: string;
  required: boolean;
  status: "pending" | "complete" | "rejected" | "waived";
};

export type OnboardingPackage = {
  id: string;
  name: string;
  version: string;
  client: string;
  employmentType: string;
  status: PackageStatus;
  createdBy: string;
  approvedBy?: string;
  effectiveDate: string;
  expiryDate?: string;
  itemCount: number;
  requiredCount: number;
  completionRate: number;
  candidatesUsing: number;
  lastModified: string;
  description: string;
};

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

export const PACKAGES: OnboardingPackage[] = [
  {
    id: "pkg-001",
    name: "Meridian Health — W-2 Standard",
    version: "v3.2",
    client: "Meridian Health",
    employmentType: "W-2",
    status: "published",
    createdBy: "Riya Kim",
    approvedBy: "Jordan Lee",
    effectiveDate: "2026-01-01",
    expiryDate: "2026-12-31",
    itemCount: 18,
    requiredCount: 14,
    completionRate: 87,
    candidatesUsing: 6,
    lastModified: "2026-05-15",
    description:
      "Full onboarding package for W-2 employees at Meridian Health. Includes HIPAA, I-9, direct deposit, client NDA, and clinical compliance requirements.",
  },
  {
    id: "pkg-002",
    name: "Apex Financial — W-2 Compliance",
    version: "v2.1",
    client: "Apex Financial",
    employmentType: "W-2",
    status: "published",
    createdBy: "Sasha Patel",
    approvedBy: "Jordan Lee",
    effectiveDate: "2026-01-15",
    itemCount: 22,
    requiredCount: 18,
    completionRate: 91,
    candidatesUsing: 4,
    lastModified: "2026-04-20",
    description:
      "Comprehensive package for regulated financial roles. Covers AML, FINRA acknowledgments, data privacy, and Apex-specific security training.",
  },
  {
    id: "pkg-003",
    name: "Northwind Logistics — W-2 Field Ops",
    version: "v1.4",
    client: "Northwind Logistics",
    employmentType: "W-2",
    status: "published",
    createdBy: "Riya Kim",
    approvedBy: "Sasha Patel",
    effectiveDate: "2026-02-01",
    itemCount: 16,
    requiredCount: 13,
    completionRate: 74,
    candidatesUsing: 5,
    lastModified: "2026-05-01",
    description:
      "Field operations onboarding for Northwind Logistics. Safety certifications, equipment acknowledgments, and logistics-specific compliance are required.",
  },
  {
    id: "pkg-004",
    name: "SkyBridge Tech — C2C Contractor",
    version: "v1.1",
    client: "SkyBridge Tech",
    employmentType: "C2C",
    status: "published",
    createdBy: "Jordan Lee",
    approvedBy: "Jordan Lee",
    effectiveDate: "2026-03-01",
    itemCount: 12,
    requiredCount: 9,
    completionRate: 83,
    candidatesUsing: 3,
    lastModified: "2026-04-10",
    description:
      "Contractor engagement package for C2C workers at SkyBridge Tech. Covers SOW acknowledgment, acceptable-use policy, cloud security training, and timesheet setup.",
  },
  {
    id: "pkg-005",
    name: "Apex Financial — 1099 Specialist",
    version: "v1.0",
    client: "Apex Financial",
    employmentType: "1099",
    status: "in-review",
    createdBy: "Sasha Patel",
    effectiveDate: "2026-07-01",
    itemCount: 10,
    requiredCount: 8,
    completionRate: 0,
    candidatesUsing: 0,
    lastModified: "2026-06-04",
    description:
      "Draft package for independent 1099 specialists engaged by Apex Financial. Under legal review for compliance with new contractor classification rules.",
  },
  {
    id: "pkg-006",
    name: "Northwind Logistics — C2C Transport",
    version: "v0.2",
    client: "Northwind Logistics",
    employmentType: "C2C",
    status: "draft",
    createdBy: "Riya Kim",
    effectiveDate: "2026-08-01",
    itemCount: 9,
    requiredCount: 7,
    completionRate: 0,
    candidatesUsing: 0,
    lastModified: "2026-06-06",
    description:
      "Early draft for C2C transportation contractors. Needs legal sign-off and DOT compliance requirements. Not yet submitted for review.",
  },
  {
    id: "pkg-007",
    name: "Meridian Health — W-2 Legacy (2025)",
    version: "v2.9",
    client: "Meridian Health",
    employmentType: "W-2",
    status: "retired",
    createdBy: "Jordan Lee",
    approvedBy: "Jordan Lee",
    effectiveDate: "2025-01-01",
    expiryDate: "2025-12-31",
    itemCount: 17,
    requiredCount: 13,
    completionRate: 100,
    candidatesUsing: 0,
    lastModified: "2026-01-02",
    description:
      "Retired 2025 package for Meridian Health W-2 employees. Superseded by v3.2 effective 2026-01-01. Retained for audit and compliance evidence.",
  },
  {
    id: "pkg-008",
    name: "SkyBridge Tech — W-2 Engineering",
    version: "v2.0",
    client: "SkyBridge Tech",
    employmentType: "W-2",
    status: "approved",
    createdBy: "Sasha Patel",
    approvedBy: "Jordan Lee",
    effectiveDate: "2026-06-15",
    itemCount: 14,
    requiredCount: 11,
    completionRate: 0,
    candidatesUsing: 0,
    lastModified: "2026-06-05",
    description:
      "Approved and ready for publish. Full W-2 engineering package for SkyBridge Tech including DevSecOps training, cloud credential setup, and MFA enrollment.",
  },
];

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
