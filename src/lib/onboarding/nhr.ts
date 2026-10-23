/**
 * New Hire Request (NHR) — the Recruiting Manager's intake form, mirroring the
 * ApTask NHR sections (General, Consultant, Project, Vendor, Pay, Remarks,
 * Special Terms). Pure and client-safe: field model, dropdown lists, and
 * validation shared by the form and the server.
 */

export type NhrStatus = "Full-Time" | "Contract" | "Contract-to-Hire" | "Intern";

export type NhrForm = {
  // General details
  accountExecutive: string;
  recruiter: string;
  recruitingManager: string;
  // Consultant details
  status: NhrStatus | "";
  subStatus: string;
  firstName: string;
  middleName: string;
  lastName: string;
  street: string;
  aptSuite: string;
  city: string;
  state: string;
  zip: string;
  homePhone: string;
  cellPhone: string;
  emergencyName: string;
  emergencyPhone: string;
  ssnLast4: string;
  dateOfBirth: string;
  geid: string;
  email: string;
  referred: boolean;
  referrerName: string;
  referrerAmount: string;
  sourcedFrom: string;
  sourcedOther: string;
  workAuthorization: string;
  workAuthOther: string;
  authExpiry: string;
  liveInState: string;
  // Project details
  client: string;
  jobTitle: string;
  jobId: string;
  workCity: string;
  workState: string;
  workMode: "Onsite" | "Hybrid" | "Remote";
  directManager: string;
  invoicingContact: string;
  timeTemplate: string;
  startDate: string;
  endDate: string;
  termOfProject: string;
  // Vendor details
  vendorName: string;
  vendorContact: string;
  vendorAddress: string;
  vendorPhone: string;
  vendorFederalId: string;
  vendorEmail: string;
  // Pay — contract
  billRate: string;
  payRate: string;
  rateType: string;
  taxTerms: string;
  paymentTerms: string;
  paymentTermsOther: string;
  // Pay — full time
  salary: string;
  feePct: string;
  otherCost: string;
  remarks: string;
  specialTerms: string;
  blockEmails: boolean;
};

export function emptyNhr(prefill?: Partial<NhrForm>): NhrForm {
  return {
    accountExecutive: "", recruiter: "", recruitingManager: "",
    status: "", subStatus: "Full Time", firstName: "", middleName: "", lastName: "",
    street: "", aptSuite: "", city: "", state: "", zip: "",
    homePhone: "", cellPhone: "", emergencyName: "", emergencyPhone: "",
    ssnLast4: "", dateOfBirth: "", geid: "", email: "",
    referred: false, referrerName: "", referrerAmount: "",
    sourcedFrom: "", sourcedOther: "", workAuthorization: "", workAuthOther: "", authExpiry: "", liveInState: "",
    client: "", jobTitle: "", jobId: "", workCity: "", workState: "", workMode: "Onsite",
    directManager: "", invoicingContact: "", timeTemplate: "", startDate: "", endDate: "", termOfProject: "",
    vendorName: "", vendorContact: "", vendorAddress: "", vendorPhone: "", vendorFederalId: "", vendorEmail: "",
    billRate: "", payRate: "", rateType: "Hourly", taxTerms: "", paymentTerms: "", paymentTermsOther: "",
    salary: "", feePct: "", otherCost: "",
    remarks: "", specialTerms: "", blockEmails: false,
    ...prefill,
  };
}

// ─────────────────────────────────────────────────────────
// Dropdown lists
// ─────────────────────────────────────────────────────────

export const STATUS_OPTIONS: NhrStatus[] = ["Full-Time", "Contract", "Contract-to-Hire", "Intern"];
export const SUB_STATUS_OPTIONS = ["Full Time", "Part Time"];
export const SOURCED_FROM_OPTIONS = [
  "JobBoard - Monster",
  "JobBoard - Dice",
  "JobBoard - Indeed",
  "JobBoard - CareerBuilder",
  "JobBoard - ZipRecruiter",
  "LinkedIn",
  "Referral - Employee",
  "Referral - Consultant",
  "Internal Database / ATS",
  "Direct Application",
  "Social Media",
  "Campus / University",
  "Other",
];
export const WORK_AUTH_OPTIONS = ["Citizen", "Green Card", "GC EAD", "H-1B", "H-4 EAD", "L-2 EAD", "OPT EAD", "STEM OPT EAD", "CPT", "TN", "E-3", "Other"];
export const TERM_OPTIONS = ["Contract", "Contract-to-Hire", "Permanent (Full-Time)", "Temporary", "Project / SOW"];
export const TIME_TEMPLATE_OPTIONS = ["Weekly (Mon–Sun)", "Weekly (Sun–Sat)", "Bi-weekly", "Semi-monthly", "Monthly", "Client VMS timesheet"];
export const TAX_TERM_OPTIONS = ["W-2", "1099", "C2C"];
export const PAYMENT_TERM_OPTIONS = ["Weekly", "Bi-weekly", "Semi-monthly", "Net 15", "Net 30", "Net 45", "Net 60", "Other (specify)"];
export const RATE_TYPE_OPTIONS = ["Hourly", "Daily", "Weekly", "Monthly", "Annual"];
export const WORK_MODE_OPTIONS = ["Onsite", "Hybrid", "Remote"] as const;

/** Work-authorization label → checklist key (us-citizen / green-card skip the authorization upload). */
export function workAuthKey(v: string): string {
  if (v === "Citizen") return "us-citizen";
  if (v === "Green Card") return "green-card";
  return v.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

/** Employment type the checklist and payroll use. */
export function employmentFromNhr(f: Pick<NhrForm, "status" | "taxTerms">): "W2" | "C2C" | "INDEPENDENT_1099" | "FULL_TIME" | "CONTRACT_TO_HIRE" {
  if (f.status === "Full-Time") return "FULL_TIME";
  if (f.taxTerms === "C2C") return "C2C";
  if (f.taxTerms === "1099") return "INDEPENDENT_1099";
  if (f.status === "Contract-to-Hire") return "CONTRACT_TO_HIRE";
  return "W2";
}

export const isFullTime = (f: Pick<NhrForm, "status">) => f.status === "Full-Time";
export const isC2C = (f: Pick<NhrForm, "status" | "taxTerms">) => !isFullTime(f) && f.taxTerms === "C2C";

// ─────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────

export type NhrErrors = Partial<Record<keyof NhrForm, string>>;

const num = (s: string) => Number(String(s).replace(/[$,\s]/g, ""));
export const money = (s: string): number | null => {
  const n = num(s);
  return s.trim() && Number.isFinite(n) && n > 0 ? n : null;
};

export function validateNhr(f: NhrForm): NhrErrors {
  const e: NhrErrors = {};
  const need = (k: keyof NhrForm, label: string) => {
    if (!String(f[k] ?? "").trim()) e[k] = `${label} is required`;
  };
  need("recruiter", "Recruiter");
  need("recruitingManager", "Recruiting Manager");
  need("accountExecutive", "Account Executive");
  need("status", "Status");
  need("firstName", "First name");
  need("lastName", "Last name");
  need("street", "Home address");
  need("city", "City");
  need("state", "State");
  need("cellPhone", "Cell #");
  need("email", "Email");
  need("sourcedFrom", "Sourced from");
  need("workAuthorization", "Work authorization");
  need("liveInState", "Live in state");
  need("client", "Client");
  need("jobTitle", "Job name");
  need("workState", "Work location state");
  need("startDate", "Start date");
  need("termOfProject", "Term of project");

  if (f.email && !/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = "Enter a valid email";
  if (f.ssnLast4 && !/^\d{4}$/.test(f.ssnLast4)) e.ssnLast4 = "Last 4 digits only";
  if (f.sourcedFrom === "Other") need("sourcedOther", "Source");
  if (f.workAuthorization === "Other") need("workAuthOther", "Authorization");
  if (f.referred) {
    need("referrerName", "Referrer name");
    if (f.referrerAmount && money(f.referrerAmount) === null) e.referrerAmount = "Enter an amount";
  }
  if (f.startDate && f.endDate && f.endDate < f.startDate) e.endDate = "End date is before the start date";

  if (isFullTime(f)) {
    if (money(f.salary) === null) e.salary = "Salary is required";
    const fee = num(f.feePct);
    if (!f.feePct.trim() || !Number.isFinite(fee) || fee <= 0 || fee > 100) e.feePct = "Fee % between 0 and 100";
  } else if (f.status) {
    need("taxTerms", "Tax terms");
    need("paymentTerms", "Payment terms");
    if (f.paymentTerms === "Other (specify)") need("paymentTermsOther", "Payment terms");
    const bill = money(f.billRate);
    const pay = money(f.payRate);
    if (bill === null) e.billRate = "Bill rate is required";
    if (pay === null) e.payRate = "Pay rate is required";
    if (bill !== null && pay !== null && pay >= bill) e.payRate = "Pay rate must be below the bill rate";
  }
  if (isC2C(f)) {
    need("vendorName", "Vendor company");
    need("vendorContact", "Vendor contact");
    need("vendorFederalId", "Federal ID");
    if (f.vendorFederalId && !/^\d{2}-?\d{7}$/.test(f.vendorFederalId.trim())) e.vendorFederalId = "Format 12-3456789";
  }
  return e;
}
