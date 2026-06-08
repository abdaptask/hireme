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

/** OCR-extracted field with confidence + verification state (§20). */
export type ExtractedField = {
  label: string;
  /** Display value — pre-masked for sensitive fields (SSN, DOB). */
  value: string;
  /** 0–100. >=95 = high, 80–94 = medium, <80 = low. */
  confidence: number;
  /** Sensitive fields render with a lock and partial mask. */
  masked?: boolean;
  /** Reviewer state. */
  state: "verified" | "needs-review" | "auto-extracted";
};

/** Image / structural / tamper / malware validation check (§20). */
export type ValidationCheck = {
  label: string;
  result: "pass" | "fail" | "warn";
  detail?: string;
};

/** Signature, counter-signature, date stamp, watermark (§20). */
export type SignatureCheck = {
  label: string;
  result: "pass" | "fail" | "warn";
  detail?: string;
};

/** Cross-document consistency match (§20). */
export type CrossDocCheck = {
  source: string;
  field: string;
  value: string;
  match: "match" | "mismatch" | "missing";
};

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
  /** Mock file type for thumbnail badge. */
  fileType?: "PDF" | "JPG" | "PNG" | "TIFF";
  /** Mock page count for the document viewer (§113). */
  pageCount?: number;
  /** OCR + AI-extracted fields with per-field confidence (§20). */
  extractedFields?: ExtractedField[];
  /** Image quality, tamper, malware, format checks (§20). */
  validation?: ValidationCheck[];
  /** Signature detection results (§20). */
  signatures?: SignatureCheck[];
  /** Cross-document field consistency (§20). */
  crossDoc?: CrossDocCheck[];
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
    fileType: "JPG",
    pageCount: 1,
    rejectionReason: "Image quality too low to verify expiration date. Please retake with mobile camera in good lighting.",
    extractedFields: [
      { label: "Full Name",      value: "James M. Rivera",       confidence: 88, state: "needs-review" },
      { label: "Date of Birth",  value: "•••-••-1987",           confidence: 71, masked: true, state: "needs-review" },
      { label: "ID Number",      value: "D•••••4421",            confidence: 64, masked: true, state: "needs-review" },
      { label: "Expiration",     value: "Unreadable",            confidence: 22, state: "needs-review" },
      { label: "State",          value: "NY",                    confidence: 95, state: "auto-extracted" },
    ],
    validation: [
      { label: "Image quality score",     result: "fail", detail: "31 / 100 — heavy motion blur" },
      { label: "All 4 corners visible",   result: "warn", detail: "Bottom-right corner cropped" },
      { label: "Text readable",           result: "fail", detail: "Expiration date OCR failed" },
      { label: "Document type confirmed", result: "pass", detail: "US Driver License" },
      { label: "Tamper evidence check",   result: "pass", detail: "No artifacts detected" },
      { label: "Malware scan",            result: "pass" },
    ],
    signatures: [
      { label: "Holder signature",  result: "pass", detail: "Detected on front (confidence 91%)" },
      { label: "State seal",        result: "pass", detail: "Watermark present" },
      { label: "Hologram",          result: "warn", detail: "Partially obscured by glare" },
    ],
    crossDoc: [
      { source: "I-9 Form (DOC-2002)",        field: "Legal name",   value: "James Michael Rivera", match: "mismatch" },
      { source: "I-9 Form (DOC-2002)",        field: "Date of birth", value: "Mar 14, 1987",        match: "match" },
      { source: "Direct Deposit (DOC-2202)",  field: "Address",      value: "412 Hudson Ave, Bronx NY", match: "match" },
    ],
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
    fileType: "PDF",
    pageCount: 3,
    extractedFields: [
      { label: "Legal Name",        value: "James Michael Rivera", confidence: 98, state: "verified" },
      { label: "Date of Birth",     value: "•••-••-1987",          confidence: 95, masked: true, state: "verified" },
      { label: "Social Security",   value: "•••-••-4421",          confidence: 96, masked: true, state: "verified" },
      { label: "Address",           value: "412 Hudson Ave, Bronx NY 10451", confidence: 92, state: "auto-extracted" },
      { label: "Citizenship Status", value: "U.S. Citizen",         confidence: 99, state: "verified" },
      { label: "Email",             value: "j.rivera@email.com",    confidence: 99, state: "verified" },
    ],
    validation: [
      { label: "Image quality score",     result: "pass", detail: "94 / 100" },
      { label: "All pages present",       result: "pass", detail: "3 of 3 pages" },
      { label: "Text readable",           result: "pass" },
      { label: "Document type confirmed", result: "pass", detail: "USCIS Form I-9 (Rev. 08/01/2023)" },
      { label: "Section 2 complete",      result: "fail", detail: "Employer review fields blank" },
      { label: "Tamper evidence check",   result: "pass", detail: "No artifacts detected" },
      { label: "Malware scan",            result: "pass" },
    ],
    signatures: [
      { label: "Candidate signature", result: "pass", detail: "Detected on page 1 (confidence 96%)" },
      { label: "Counter-signature",   result: "fail", detail: "Missing — required for Section 2" },
      { label: "Date stamp",          result: "pass", detail: "Jun 3, 2026" },
      { label: "Witness signature",   result: "warn", detail: "Not required for this form" },
    ],
    crossDoc: [
      { source: "Government ID (DOC-2001)",  field: "Legal name",   value: "James M. Rivera (ID) vs James Michael Rivera (I-9)", match: "mismatch" },
      { source: "Government ID (DOC-2001)",  field: "Date of birth", value: "Mar 14, 1987",       match: "match" },
      { source: "W-4 Federal (DOC-2202)",     field: "Address",      value: "412 Hudson Ave, Bronx NY", match: "match" },
      { source: "W-4 Federal (DOC-2202)",     field: "SSN",          value: "•••-••-4421",         match: "match" },
    ],
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
    fileType: "PDF",
    pageCount: 2,
    extractedFields: [
      { label: "Legal Name",          value: "Aisha N. Bello",       confidence: 99, state: "verified" },
      { label: "Social Security",     value: "•••-••-8819",          confidence: 97, masked: true, state: "verified" },
      { label: "Filing Status",       value: "Single",                confidence: 99, state: "verified" },
      { label: "Dependents Claimed",  value: "0",                     confidence: 96, state: "verified" },
      { label: "Additional Withhold", value: "$0.00",                 confidence: 99, state: "verified" },
      { label: "Address",             value: "88 Bryant St, Boston MA 02118", confidence: 95, state: "verified" },
    ],
    validation: [
      { label: "Image quality score",     result: "pass", detail: "97 / 100" },
      { label: "Document type confirmed", result: "pass", detail: "IRS Form W-4 (2026)" },
      { label: "Required fields present", result: "pass" },
      { label: "Math validation",         result: "pass", detail: "Withholding calculations consistent" },
      { label: "Tamper evidence check",   result: "pass" },
      { label: "Malware scan",            result: "pass" },
    ],
    signatures: [
      { label: "Employee signature", result: "pass", detail: "Detected (confidence 98%)" },
      { label: "Date stamp",         result: "pass", detail: "May 30, 2026" },
    ],
    crossDoc: [
      { source: "Government ID (DOC-2104)", field: "Legal name", value: "Aisha N. Bello",          match: "match" },
      { source: "Client NDA (DOC-2004)",    field: "Legal name", value: "Aisha N. Bello",          match: "match" },
      { source: "Government ID (DOC-2104)", field: "Address",    value: "88 Bryant St, Boston MA", match: "match" },
    ],
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
    fileType: "PDF",
    pageCount: 1,
    rejectionReason: "Routing number does not match bank name provided. Please resubmit with correct banking details.",
    extractedFields: [
      { label: "Account Holder",  value: "Marcus T. Webb",      confidence: 96, state: "verified" },
      { label: "Bank Name",       value: "Illegible",            confidence: 41, state: "needs-review" },
      { label: "Routing Number",  value: "•••••0021",            confidence: 78, masked: true, state: "needs-review" },
      { label: "Account Number",  value: "•••••••4408",          confidence: 82, masked: true, state: "needs-review" },
      { label: "Account Type",    value: "Checking",             confidence: 94, state: "auto-extracted" },
      { label: "Address",         value: "210 Pinecrest Dr, Columbus OH 43215", confidence: 91, state: "verified" },
    ],
    validation: [
      { label: "Image quality score",        result: "warn", detail: "62 / 100 — partial glare on routing block" },
      { label: "Document type confirmed",    result: "pass", detail: "ACH Direct Deposit Authorization" },
      { label: "Routing number checksum",    result: "fail", detail: "0210•••21 does not pass ABA checksum" },
      { label: "Bank name <> routing match", result: "fail", detail: "Bank name unreadable — cannot verify" },
      { label: "Voided check attached",      result: "warn", detail: "Attached but blurry" },
      { label: "Tamper evidence check",      result: "pass" },
      { label: "Malware scan",               result: "pass" },
    ],
    signatures: [
      { label: "Employee signature", result: "pass", detail: "Detected (confidence 94%)" },
      { label: "Date stamp",         result: "pass", detail: "Jun 1, 2026" },
      { label: "Bank verification",  result: "fail", detail: "Penny-drop verification not yet attempted" },
    ],
    crossDoc: [
      { source: "W-4 Federal (DOC-2305)",  field: "Legal name",   value: "Marcus T. Webb",            match: "match" },
      { source: "W-4 Federal (DOC-2305)",  field: "Address",      value: "210 Pinecrest Dr, Columbus OH 43215", match: "match" },
      { source: "I-9 Form (DOC-2306)",     field: "SSN",          value: "•••-••-7732",               match: "match" },
    ],
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
    fileType: "JPG",
    pageCount: 1,
    rejectionReason: "Passport expired April 12, 2026. A valid, unexpired document is required for I-9 verification.",
    extractedFields: [
      { label: "Full Name",       value: "Diego Alejandro Santos", confidence: 97, state: "verified" },
      { label: "Date of Birth",   value: "•••-••-1992",            confidence: 96, masked: true, state: "verified" },
      { label: "Passport Number", value: "A•••••8221",             confidence: 94, masked: true, state: "verified" },
      { label: "Country",         value: "United States",          confidence: 99, state: "verified" },
      { label: "Issue Date",      value: "Apr 13, 2016",           confidence: 95, state: "verified" },
      { label: "Expiration",      value: "Apr 12, 2026",           confidence: 98, state: "needs-review" },
    ],
    validation: [
      { label: "Image quality score",     result: "pass", detail: "92 / 100" },
      { label: "All 4 corners visible",   result: "pass" },
      { label: "MRZ readable",            result: "pass", detail: "Machine-readable zone parsed" },
      { label: "Document type confirmed", result: "pass", detail: "US Passport Book" },
      { label: "Expiration check",        result: "fail", detail: "Expired 56 days ago (Apr 12, 2026)" },
      { label: "Tamper evidence check",   result: "pass", detail: "No artifacts detected" },
      { label: "Malware scan",            result: "pass" },
    ],
    signatures: [
      { label: "Holder signature", result: "pass", detail: "Detected on signature page (confidence 95%)" },
      { label: "Issuing seal",     result: "pass", detail: "US Department of State watermark present" },
      { label: "Hologram",         result: "pass", detail: "RFID chip readable" },
    ],
    crossDoc: [
      { source: "I-9 Form (DOC-2401)",  field: "Legal name",  value: "Diego Alejandro Santos", match: "match" },
      { source: "I-9 Form (DOC-2401)",  field: "Date of birth", value: "Jul 19, 1992",         match: "match" },
      { source: "W-4 Federal (DOC-2402)", field: "SSN",         value: "•••-••-3318",         match: "match" },
    ],
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
    fileType: "JPG",
    pageCount: 1,
    extractedFields: [
      { label: "Full Name",     value: "Priya Sharma",        confidence: 97, state: "verified" },
      { label: "Date of Birth", value: "•••-••-1994",         confidence: 96, masked: true, state: "verified" },
      { label: "ID Number",     value: "S•••••2207",          confidence: 94, masked: true, state: "verified" },
      { label: "Expiration",    value: "Mar 15, 2029",        confidence: 89, state: "verified" },
      { label: "State",         value: "MA",                  confidence: 99, state: "verified" },
      { label: "Address",       value: "12 Tremont St, Boston MA 02108", confidence: 93, state: "verified" },
    ],
    validation: [
      { label: "Image quality score",     result: "pass", detail: "94 / 100" },
      { label: "All 4 corners visible",   result: "pass" },
      { label: "Text readable",           result: "pass" },
      { label: "Expiration date detected", result: "pass", detail: "Mar 15, 2029 — valid for 33 more months" },
      { label: "Document type confirmed", result: "pass", detail: "MA Driver License (REAL ID)" },
      { label: "Tamper evidence check",   result: "pass", detail: "No artifacts detected" },
      { label: "Malware scan",            result: "pass" },
    ],
    signatures: [
      { label: "Holder signature", result: "pass", detail: "Detected (confidence 96%)" },
      { label: "State seal",       result: "pass", detail: "MA RMV watermark present" },
      { label: "Hologram",         result: "pass", detail: "Verified" },
      { label: "REAL ID star",     result: "pass", detail: "Compliant" },
    ],
    crossDoc: [
      { source: "W-4 Federal (DOC-2501)", field: "Legal name", value: "Priya Sharma",                match: "match" },
      { source: "W-4 Federal (DOC-2501)", field: "Address",    value: "12 Tremont St, Boston MA",    match: "match" },
      { source: "I-9 Form (DOC-2502)",    field: "Date of birth", value: "Aug 22, 1994",             match: "match" },
    ],
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
