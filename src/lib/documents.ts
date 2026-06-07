/**
 * Document Intelligence data (CLAUDE.md §20, §113).
 * 20 documents across 14 candidates — mixes of approved, pending, rejected,
 * AI review in progress, and expired.
 */
import type { StatusTone } from "@/lib/types";

export type DocumentStatus =
  | "pending"
  | "submitted"
  | "ai-review"
  | "approved"
  | "rejected"
  | "expired"
  | "correction-required";

export type DocumentCategory =
  | "identity"
  | "tax"
  | "employment"
  | "client"
  | "compliance"
  | "screening"
  | "payroll";

export type Document = {
  id: string;
  candidateId: string;
  candidateName: string;
  client: string;
  docType: string;
  category: DocumentCategory;
  status: DocumentStatus;
  submittedDate?: string;
  reviewedDate?: string;
  reviewer?: string;
  aiScore?: number;
  aiFlags?: string[];
  expiresDate?: string;
  version: number;
  fileSize?: string;
  rejectionReason?: string;
};

export const DOCUMENT_STATUS_META: Record<
  DocumentStatus,
  { label: string; tone: StatusTone }
> = {
  pending:              { label: "Pending",             tone: "neutral" },
  submitted:            { label: "Submitted",           tone: "info" },
  "ai-review":          { label: "AI Review",           tone: "ai" },
  approved:             { label: "Approved",            tone: "success" },
  rejected:             { label: "Rejected",            tone: "danger" },
  expired:              { label: "Expired",             tone: "warning" },
  "correction-required":{ label: "Correction Required", tone: "warning" },
};

export const DOCUMENT_CATEGORY_META: Record<
  DocumentCategory,
  { label: string; color: string }
> = {
  identity:   { label: "Identity",   color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
  tax:        { label: "Tax",        color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  employment: { label: "Employment", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  client:     { label: "Client",     color: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300" },
  compliance: { label: "Compliance", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
  screening:  { label: "Screening",  color: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" },
  payroll:    { label: "Payroll",    color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
};

export const DOCUMENTS: Document[] = [
  {
    id: "DOC-2001",
    candidateId: "james-rivera",
    candidateName: "James Rivera",
    client: "Meridian Health",
    docType: "Government ID",
    category: "identity",
    status: "rejected",
    submittedDate: "Jun 2, 2026",
    reviewedDate: "Jun 2, 2026",
    reviewer: "AI Copilot",
    aiScore: 31,
    aiFlags: ["Blurry image", "Expiration date unreadable"],
    version: 1,
    fileSize: "1.2 MB",
    rejectionReason: "Image quality too low to verify expiration date. Please retake with mobile camera in good lighting.",
  },
  {
    id: "DOC-2002",
    candidateId: "james-rivera",
    candidateName: "James Rivera",
    client: "Meridian Health",
    docType: "I-9 Form",
    category: "employment",
    status: "ai-review",
    submittedDate: "Jun 3, 2026",
    aiScore: 88,
    aiFlags: ["Section 2 incomplete"],
    version: 1,
    fileSize: "0.8 MB",
  },
  {
    id: "DOC-2003",
    candidateId: "aisha-bello",
    candidateName: "Aisha Bello",
    client: "Vertex Financial",
    docType: "W-4 (Federal)",
    category: "tax",
    status: "approved",
    submittedDate: "May 30, 2026",
    reviewedDate: "May 31, 2026",
    reviewer: "Sasha Patel",
    aiScore: 97,
    aiFlags: [],
    version: 1,
    fileSize: "0.4 MB",
  },
  {
    id: "DOC-2004",
    candidateId: "aisha-bello",
    candidateName: "Aisha Bello",
    client: "Vertex Financial",
    docType: "Client NDA",
    category: "client",
    status: "approved",
    submittedDate: "May 31, 2026",
    reviewedDate: "Jun 1, 2026",
    reviewer: "Riya Kim",
    aiScore: 99,
    aiFlags: [],
    version: 2,
    fileSize: "1.1 MB",
  },
  {
    id: "DOC-2005",
    candidateId: "marcus-webb",
    candidateName: "Marcus Webb",
    client: "Northwind Logistics",
    docType: "Direct Deposit Form",
    category: "payroll",
    status: "correction-required",
    submittedDate: "Jun 1, 2026",
    reviewedDate: "Jun 2, 2026",
    reviewer: "AI Copilot",
    aiScore: 62,
    aiFlags: ["Routing number mismatch", "Bank name illegible"],
    version: 1,
    fileSize: "0.6 MB",
    rejectionReason: "Routing number does not match bank name provided. Please resubmit with correct banking details.",
  },
  {
    id: "DOC-2006",
    candidateId: "marcus-webb",
    candidateName: "Marcus Webb",
    client: "Northwind Logistics",
    docType: "Employment Agreement",
    category: "employment",
    status: "approved",
    submittedDate: "May 28, 2026",
    reviewedDate: "May 29, 2026",
    reviewer: "Sasha Patel",
    aiScore: 98,
    aiFlags: [],
    version: 1,
    fileSize: "2.1 MB",
  },
  {
    id: "DOC-2007",
    candidateId: "noah-klein",
    candidateName: "Noah Klein",
    client: "Vertex Financial",
    docType: "W-4 (Federal)",
    category: "tax",
    status: "pending",
    version: 1,
  },
  {
    id: "DOC-2008",
    candidateId: "noah-klein",
    candidateName: "Noah Klein",
    client: "Vertex Financial",
    docType: "Background Check Consent",
    category: "screening",
    status: "approved",
    submittedDate: "Jun 3, 2026",
    reviewedDate: "Jun 3, 2026",
    reviewer: "AI Copilot",
    aiScore: 100,
    aiFlags: [],
    version: 1,
    fileSize: "0.3 MB",
  },
  {
    id: "DOC-2009",
    candidateId: "sarah-chen",
    candidateName: "Sarah Chen",
    client: "Atlas Manufacturing",
    docType: "CA Wage Notice",
    category: "compliance",
    status: "approved",
    submittedDate: "May 21, 2026",
    reviewedDate: "May 22, 2026",
    reviewer: "Lena Ortiz",
    aiScore: 95,
    aiFlags: [],
    version: 1,
    fileSize: "0.5 MB",
  },
  {
    id: "DOC-2010",
    candidateId: "ravi-menon",
    candidateName: "Ravi Menon",
    client: "Cobalt Systems",
    docType: "Client NDA",
    category: "client",
    status: "ai-review",
    submittedDate: "Jun 4, 2026",
    aiScore: 74,
    aiFlags: ["Signature page missing", "Date field blank"],
    version: 1,
    fileSize: "1.4 MB",
  },
  {
    id: "DOC-2011",
    candidateId: "ravi-menon",
    candidateName: "Ravi Menon",
    client: "Cobalt Systems",
    docType: "Acceptable Use Policy",
    category: "compliance",
    status: "submitted",
    submittedDate: "Jun 4, 2026",
    version: 1,
    fileSize: "0.7 MB",
  },
  {
    id: "DOC-2012",
    candidateId: "mei-lin",
    candidateName: "Mei Lin",
    client: "Atlas Manufacturing",
    docType: "I-9 Form",
    category: "employment",
    status: "approved",
    submittedDate: "May 23, 2026",
    reviewedDate: "May 24, 2026",
    reviewer: "Riya Kim",
    aiScore: 96,
    aiFlags: [],
    version: 1,
    fileSize: "0.9 MB",
  },
  {
    id: "DOC-2013",
    candidateId: "diego-santos",
    candidateName: "Diego Santos",
    client: "Cobalt Systems",
    docType: "Passport",
    category: "identity",
    status: "expired",
    submittedDate: "May 31, 2026",
    reviewedDate: "Jun 1, 2026",
    reviewer: "AI Copilot",
    aiScore: 41,
    aiFlags: ["Document expired"],
    expiresDate: "Apr 12, 2026",
    version: 1,
    fileSize: "2.8 MB",
    rejectionReason: "Passport expired April 12, 2026. A valid, unexpired document is required for I-9 verification.",
  },
  {
    id: "DOC-2014",
    candidateId: "grace-okafor",
    candidateName: "Grace Okafor",
    client: "Meridian Health",
    docType: "Employment Agreement",
    category: "employment",
    status: "approved",
    submittedDate: "May 20, 2026",
    reviewedDate: "May 21, 2026",
    reviewer: "Aaron Flores",
    aiScore: 99,
    aiFlags: [],
    version: 1,
    fileSize: "1.8 MB",
  },
  {
    id: "DOC-2015",
    candidateId: "sofia-marin",
    candidateName: "Sofia Marin",
    client: "Atlas Manufacturing",
    docType: "CO State Tax Form",
    category: "tax",
    status: "pending",
    version: 1,
  },
  {
    id: "DOC-2016",
    candidateId: "tara-voss",
    candidateName: "Tara Voss",
    client: "Meridian Health",
    docType: "Drug Screen Consent",
    category: "screening",
    status: "approved",
    submittedDate: "May 29, 2026",
    reviewedDate: "May 29, 2026",
    reviewer: "AI Copilot",
    aiScore: 100,
    aiFlags: [],
    version: 1,
    fileSize: "0.2 MB",
  },
  {
    id: "DOC-2017",
    candidateId: "fatima-idris",
    candidateName: "Fatima Idris",
    client: "Cobalt Systems",
    docType: "W-4 (Federal)",
    category: "tax",
    status: "approved",
    submittedDate: "May 30, 2026",
    reviewedDate: "May 31, 2026",
    reviewer: "Sasha Patel",
    aiScore: 98,
    aiFlags: [],
    version: 1,
    fileSize: "0.4 MB",
  },
  {
    id: "DOC-2018",
    candidateId: "owen-bradley",
    candidateName: "Owen Bradley",
    client: "Northwind Logistics",
    docType: "Client NDA",
    category: "client",
    status: "rejected",
    submittedDate: "Jun 1, 2026",
    reviewedDate: "Jun 2, 2026",
    reviewer: "Lena Ortiz",
    aiScore: 55,
    aiFlags: ["Wrong document version", "Missing initialed pages"],
    version: 1,
    fileSize: "1.3 MB",
    rejectionReason: "Document uses outdated NDA template (v2.1). Please obtain and sign the current version (v3.0) from the portal.",
  },
  {
    id: "DOC-2019",
    candidateId: "priya-sharma",
    candidateName: "Priya Sharma",
    client: "Vertex Financial",
    docType: "Government ID",
    category: "identity",
    status: "approved",
    submittedDate: "Jun 2, 2026",
    reviewedDate: "Jun 3, 2026",
    reviewer: "AI Copilot",
    aiScore: 94,
    aiFlags: [],
    expiresDate: "Mar 15, 2029",
    version: 1,
    fileSize: "2.2 MB",
  },
  {
    id: "DOC-2020",
    candidateId: "tara-voss",
    candidateName: "Tara Voss",
    client: "Meridian Health",
    docType: "HIPAA Acknowledgment",
    category: "compliance",
    status: "ai-review",
    submittedDate: "Jun 3, 2026",
    aiScore: 81,
    aiFlags: ["Witness signature missing"],
    version: 1,
    fileSize: "0.6 MB",
  },
];

export function documentStats(): {
  pending: number;
  awaitingReview: number;
  approved: number;
  rejected: number;
} {
  return {
    pending: DOCUMENTS.filter(
      (d) => d.status === "pending" || d.status === "submitted",
    ).length,
    awaitingReview: DOCUMENTS.filter((d) => d.status === "ai-review").length,
    approved: DOCUMENTS.filter((d) => d.status === "approved").length,
    rejected: DOCUMENTS.filter(
      (d) =>
        d.status === "rejected" ||
        d.status === "correction-required" ||
        d.status === "expired",
    ).length,
  };
}
