/**
 * Onboarding checklist rules (§8 dynamic client-mapped packages, §9 step 2
 * rule evaluation). Pure — decides *what* a new hire must complete from
 * their employment type, work authorization, work location, and the client's
 * own compliance rules, and explains why each item is included.
 */

/** How the candidate completes a document item in the portal. */
export type ItemKind = "upload" | "form";

export type FormField = {
  key: string;
  label: string;
  type?: "text" | "select" | "date" | "number";
  options?: string[];
  /** Sensitive values are stored masked (last 4) in the submission record. */
  sensitive?: boolean;
  required?: boolean;
  placeholder?: string;
};

export type DocTemplate = {
  name: string;
  category: "identity" | "authorization" | "tax" | "payroll" | "client" | "agreement" | "certification";
  kind: ItemKind;
  why: string;
  estimateMin: number;
  /** Form fields (kind = "form"); every form ends with a typed e-signature. */
  fields?: FormField[];
  /** Upload guidance (kind = "upload"). */
  hint?: string;
  /** Uploaded documents that carry an expiry (IDs, authorizations, licenses). */
  expires?: boolean;
};

const T = (t: DocTemplate) => t;

export const TEMPLATES: Record<string, DocTemplate> = {
  "Offer Letter": T({ name: "Offer Letter", category: "agreement", kind: "form", why: "Confirms your role, rate, and start date.", estimateMin: 2, fields: [] }),
  "Federal W-4": T({
    name: "Federal W-4", category: "tax", kind: "form", why: "Tells payroll how much federal tax to withhold.", estimateMin: 5,
    fields: [
      { key: "filingStatus", label: "Filing status", type: "select", options: ["Single or married filing separately", "Married filing jointly", "Head of household"], required: true },
      { key: "dependents", label: "Dependents amount ($)", type: "number", placeholder: "0" },
      { key: "extraWithholding", label: "Extra withholding per pay period ($)", type: "number", placeholder: "0" },
    ],
  }),
  "State Tax Withholding": T({
    name: "State Tax Withholding", category: "tax", kind: "form", why: "Your work state requires its own withholding certificate.", estimateMin: 3,
    fields: [{ key: "allowances", label: "Allowances claimed", type: "number", placeholder: "0", required: true }],
  }),
  "I-9 Section 1": T({
    name: "I-9 Section 1", category: "authorization", kind: "form", why: "Federal law requires every W-2 employee to verify identity and work eligibility.", estimateMin: 4,
    fields: [
      { key: "citizenship", label: "Citizenship / immigration status", type: "select", options: ["U.S. citizen", "Noncitizen national", "Lawful permanent resident", "Noncitizen authorized to work"], required: true },
      { key: "ssn", label: "Social Security number", sensitive: true, required: true, placeholder: "123-45-6789" },
      { key: "dob", label: "Date of birth", type: "date", required: true },
    ],
  }),
  "Government Photo ID": T({ name: "Government Photo ID", category: "identity", kind: "upload", why: "Verifies your identity (I-9 List A, or List B with List C).", estimateMin: 2, hint: "Passport, driver's license, or state ID — all four corners visible, no glare.", expires: true }),
  "Direct Deposit Authorization": T({
    name: "Direct Deposit Authorization", category: "payroll", kind: "form", why: "So your pay lands in your account on day one.", estimateMin: 3,
    fields: [
      { key: "bank", label: "Bank name", required: true },
      { key: "routing", label: "Routing number", sensitive: true, required: true, placeholder: "9 digits" },
      { key: "account", label: "Account number", sensitive: true, required: true },
      { key: "accountType", label: "Account type", type: "select", options: ["Checking", "Savings"], required: true },
    ],
  }),
  "Benefits Election": T({
    name: "Benefits Election", category: "payroll", kind: "form", why: "Enroll in or waive medical, dental, and vision coverage.", estimateMin: 4,
    fields: [{ key: "election", label: "Election", type: "select", options: ["Enroll — employee only", "Enroll — employee + family", "Waive coverage"], required: true }],
  }),
  "Work Authorization Document": T({ name: "Work Authorization Document", category: "authorization", kind: "upload", why: "Your visa / EAD must be on file and current for the assignment.", estimateMin: 2, hint: "Upload the front of your EAD card or visa approval notice (I-797).", expires: true }),
  "W-9 (Taxpayer ID)": T({
    name: "W-9 (Taxpayer ID)", category: "tax", kind: "form", why: "Required to pay contractors and report 1099 income.", estimateMin: 3,
    fields: [
      { key: "legalName", label: "Legal / business name", required: true },
      { key: "tin", label: "SSN or EIN", sensitive: true, required: true },
      { key: "classification", label: "Tax classification", type: "select", options: ["Individual / sole proprietor", "LLC", "S corporation", "C corporation"], required: true },
    ],
  }),
  "Independent Contractor Agreement": T({ name: "Independent Contractor Agreement", category: "agreement", kind: "form", why: "Defines the 1099 engagement terms.", estimateMin: 3, fields: [] }),
  "Vendor Master Services Agreement": T({ name: "Vendor Master Services Agreement", category: "agreement", kind: "form", why: "Your vendor must have a signed MSA before a C2C placement.", estimateMin: 3, fields: [{ key: "vendorSignatory", label: "Vendor signatory name", required: true }] }),
  "Certificate of Insurance": T({ name: "Certificate of Insurance", category: "certification", kind: "upload", why: "C2C vendors must carry general and professional liability coverage.", estimateMin: 2, hint: "PDF certificate naming ApTask as certificate holder.", expires: true }),
  "Professional License": T({ name: "Professional License", category: "certification", kind: "upload", why: "The client requires license verification for this role.", estimateMin: 2, hint: "Upload your current license showing number and expiry.", expires: true }),
};

/** A document item from a client rule (NDA, AUP, code of conduct…) — acknowledge & sign. */
function clientDoc(label: string): DocTemplate {
  if (/licen/i.test(label)) return TEMPLATES["Professional License"];
  return { name: label, category: "client", kind: "form", why: "Required by the client for everyone on this assignment.", estimateMin: 2, fields: [] };
}

export function templateFor(name: string): DocTemplate {
  return TEMPLATES[name] ?? clientDoc(name);
}

// ─────────────────────────────────────────────────────────
// Checklist assembly
// ─────────────────────────────────────────────────────────

export type ChecklistInput = {
  employmentType: "W2" | "C2C" | "INDEPENDENT_1099" | "FULL_TIME" | "CONTRACT_TO_HIRE";
  workAuthorization: string; // onboarding-form value: us-citizen, green-card, h1b, …
  workState: string | null;
  workMode: "Onsite" | "Remote" | "Hybrid";
  client: { name: string; rules: { label: string; category: string }[] } | null;
};

export type PlannedItem = {
  type: "document" | "screening" | "training" | "equipment";
  label: string;
  template?: DocTemplate;
  /** Explainable inclusion (§2.3, §9 step 2). */
  reason: string;
  ruleCategory: "Employment" | "Location" | "Client" | "Authorization" | "Standard";
  /** Screening vendor / package, training category, equipment type. */
  meta?: Record<string, string>;
};

/** States with no personal income tax — no state withholding certificate needed. */
const NO_INCOME_TAX = new Set(["AK", "FL", "NV", "NH", "SD", "TN", "TX", "WA", "WY"]);

export function buildChecklist(input: ChecklistInput): PlannedItem[] {
  const items: PlannedItem[] = [];
  const doc = (name: string, reason: string, ruleCategory: PlannedItem["ruleCategory"]) => {
    const template = templateFor(name);
    // One item per template — a client rule can't duplicate a standard form.
    if (items.some((i) => i.label === template.name)) return;
    items.push({ type: "document", label: template.name, template, reason, ruleCategory });
  };

  const et = input.employmentType;
  const employee = et === "W2" || et === "FULL_TIME" || et === "CONTRACT_TO_HIRE";

  // Employment-type rules (§8.1)
  if (employee) {
    doc("Offer Letter", "All W-2 / full-time hires sign an offer letter.", "Employment");
    doc("Federal W-4", "W-2 employees need federal withholding on file.", "Employment");
    doc("I-9 Section 1", "Federal I-9 requirement for every employee.", "Employment");
    doc("Government Photo ID", "I-9 identity document.", "Employment");
    doc("Direct Deposit Authorization", "Payroll readiness gate (§16.2).", "Employment");
    doc("Benefits Election", "Benefits eligibility for W-2 / full-time.", "Employment");
  } else if (et === "C2C") {
    doc("Vendor Master Services Agreement", "Corp-to-corp placements require a vendor MSA.", "Employment");
    doc("Certificate of Insurance", "C2C vendors must show liability coverage.", "Employment");
    doc("Government Photo ID", "Identity verification for client access.", "Employment");
  } else {
    doc("Independent Contractor Agreement", "1099 engagement terms.", "Employment");
    doc("W-9 (Taxpayer ID)", "Required to issue a 1099.", "Employment");
    doc("Government Photo ID", "Identity verification for client access.", "Employment");
  }

  // Location rules
  if (employee && input.workState && !NO_INCOME_TAX.has(input.workState)) {
    doc("State Tax Withholding", `${input.workState} has state income tax.`, "Location");
  }

  // Work authorization
  if (!["us-citizen", "green-card", ""].includes(input.workAuthorization)) {
    doc("Work Authorization Document", "Candidate is not a U.S. citizen or permanent resident.", "Authorization");
  }

  // Client rules (§8.1 client-specific mapping)
  let hasBackground = false;
  let hasTraining = false;
  for (const r of input.client?.rules ?? []) {
    const why = `${input.client!.name} requires "${r.label}".`;
    if (r.category === "document") doc(r.label, why, "Client");
    else if (r.category === "background") {
      hasBackground = true;
      items.push({ type: "screening", label: r.label, reason: why, ruleCategory: "Client", meta: { vendor: "HireRight", packageType: r.label } });
    } else if (r.category === "drug") {
      items.push({ type: "screening", label: r.label, reason: why, ruleCategory: "Client", meta: { vendor: "Quest Diagnostics", packageType: r.label } });
    } else if (r.category === "training") {
      hasTraining = true;
      items.push({ type: "training", label: r.label, reason: why, ruleCategory: "Client", meta: { category: /hipaa|privacy/i.test(r.label) ? "privacy" : /sox|compliance/i.test(r.label) ? "compliance" : /safety/i.test(r.label) ? "safety" : "security" } });
    }
  }

  // Standard requirements
  if (!hasBackground) items.push({ type: "screening", label: "Standard Background Check", reason: "Every placement gets a standard background check.", ruleCategory: "Standard", meta: { vendor: "HireRight", packageType: "Standard Background" } });
  if (!hasTraining) items.push({ type: "training", label: "Security Awareness Training", reason: "Required for system access.", ruleCategory: "Standard", meta: { category: "security" } });
  items.push({ type: "training", label: "Timekeeping & Expenses", reason: "So hours and expenses are submitted correctly from week one.", ruleCategory: "Standard", meta: { category: "systems" } });

  if (input.workMode === "Onsite") {
    items.push({ type: "equipment", label: "Client Site Badge", reason: "Onsite work requires a building badge.", ruleCategory: "Location", meta: { assetType: "Badge" } });
  } else {
    items.push({ type: "equipment", label: "Laptop", reason: `${input.workMode} work — a company laptop is shipped to the candidate.`, ruleCategory: "Location", meta: { assetType: "Laptop" } });
  }

  return items;
}

/** Portal stage order (§5.2) and which checklist items belong to each. */
export const STAGES = ["Profile Setup", "Document Submission", "Background Check", "Tax & Payroll", "Client Requirements", "IT Provisioning", "Training", "Day 1 Prep"] as const;
