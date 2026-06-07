/**
 * Onboarding form types & reference data (§9 Client Package Creation UI,
 * §14 Full Lifecycle Timeline, §43 Core Data Entities).
 *
 * Maps directly to the fields in the ApTask "New Consultant" form:
 *   Personal Info → Step 1
 *   Project Details → Step 2
 *   Work Location + Rates → Step 3
 *   Screening & Team → Step 4
 *   Review → Step 5
 */

export type EmploymentType = "contract" | "full-time" | "employee";

export type WorkAuthType =
  | "us-citizen"
  | "green-card"
  | "h1b"
  | "opt"
  | "cpt"
  | "tn"
  | "e3"
  | "l1"
  | "h4-ead"
  | "gc-ead"
  | "other";

export const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
];

export const WORK_AUTH_OPTIONS: { value: string; label: string }[] = [
  { value: "us-citizen", label: "US Citizen" },
  { value: "green-card", label: "Green Card (LPR)" },
  { value: "h1b", label: "H-1B" },
  { value: "opt", label: "OPT" },
  { value: "cpt", label: "CPT" },
  { value: "tn", label: "TN Visa" },
  { value: "e3", label: "E-3" },
  { value: "l1", label: "L-1" },
  { value: "h4-ead", label: "H-4 EAD" },
  { value: "gc-ead", label: "GC EAD" },
  { value: "other", label: "Other" },
];

export const PAY_TERM_OPTIONS = [
  { value: "w2", label: "W-2" },
  { value: "1099", label: "1099" },
  { value: "c2c", label: "Corp-to-Corp (C2C)" },
];

export const SOURCED_FROM_OPTIONS = [
  "LinkedIn",
  "Indeed",
  "Dice",
  "ZipRecruiter",
  "Referral",
  "Job Board",
  "Direct",
  "ATS",
  "Campus Recruiting",
  "Cold Outreach",
  "Other",
];

export const JOB_CATEGORIES = [
  "Software Engineering",
  "Data & Analytics",
  "DevOps & Cloud",
  "Project Management",
  "Business Analysis",
  "QA & Testing",
  "Cybersecurity",
  "Network Engineering",
  "Healthcare IT",
  "Finance & Accounting",
  "Human Resources",
  "Sales & Marketing",
  "Operations",
  "Administrative",
  "Other",
];

export const ONBOARDING_STATUSES = [
  "New",
  "Active",
  "In Progress",
  "On Hold",
  "Pending Approval",
  "Completed",
];

export const ONBOARDING_SUB_STATUSES = [
  "Profile Setup",
  "Document Submission",
  "Background Check",
  "Tax & Payroll",
  "Client Requirements",
  "IT Provisioning",
  "Training",
  "Day 1 Prep",
  "Fully Onboarded",
];

export const WORK_STATUSES = ["On-site", "Remote", "Hybrid"];

export const GENDER_OPTIONS = [
  "Male",
  "Female",
  "Non-binary",
  "Prefer not to say",
];

export const CURRENCY_OPTIONS = ["USD", "CAD", "EUR", "GBP"];
export const RATE_TYPE_OPTIONS = ["Hourly", "Daily", "Weekly", "Monthly", "Annual"];

/** Mock client options (will come from DB in persistence phase). */
export const CLIENT_OPTIONS = [
  "Meridian Health",
  "Northwind Logistics",
  "Vertex Financial",
  "Atlas Manufacturing",
  "Cobalt Systems",
  "TechCorp Inc",
  "Global Dynamics",
  "Pacific Solutions",
];

/** Mock vendor options for C2C arrangements (§27). */
export const VENDOR_OPTIONS = [
  "Apex Staffing Partners",
  "TechStaff Solutions",
  "Global IT Services",
  "Nexus Consulting",
];

/** Assign-members: team roles available (§36). */
export const ASSIGN_ROLES = [
  "Recruiter",
  "Onboarder",
  "Account Manager",
  "Team Lead",
  "Recruiting Manager",
];

/** Mock team members for assignment (§36). */
export const TEAM_MEMBERS = [
  { name: "Devon Hughes", role: "Team Lead" },
  { name: "Lena Ortiz", role: "Recruiter" },
  { name: "Aaron Flores", role: "Recruiter" },
  { name: "Riya Kim", role: "Onboarder" },
  { name: "Sasha Patel", role: "Onboarder" },
  { name: "Priya Anand", role: "Recruiting Manager" },
  { name: "Marcus Reed", role: "Recruiting Manager" },
];

// ---------------------------------------------------------------------------
// Form data shape
// ---------------------------------------------------------------------------

export type AssignedMember = { role: string; user: string };

export type OnboardingFormData = {
  // Step 1 — Candidate Info
  employmentType: EmploymentType;
  candidateEmail: string;
  alternateEmail: string;
  company: string;
  firstName: string;
  lastName: string;
  mobile: string;
  homePhone: string;
  country: string;
  address: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  ssn: string;
  dateOfBirth: string;
  sourcedFrom: string;
  otherSource: string;
  workAuthorization: string;
  otherAuthorization: string;
  authorizationExpiry: string;
  payTerms: string;
  gender: string;

  // Step 2 — Assignment
  client: string;
  jobId: string;
  jobTitle: string;
  startDate: string;
  tentativeEnd: string;
  isVerified: boolean;
  status: string;
  subStatus: string;
  jobCategory: string;
  vendorName: string;

  // Step 3 — Work Location & Rates
  liveInState: string;
  workStatus: string;
  workAddress: string;
  workCity: string;
  workState: string;
  workZip: string;
  billRate: string;
  billRateCurrency: string;
  billRateType: string;
  payRate: string;
  payRateCurrency: string;
  payRateType: string;

  // Step 4 — Screening & Team
  assignedMembers: AssignedMember[];
  hirerightId: string;
  reportingManager: string;
  backgroundEmail: string;
  remarks: string;

  // Footer option
  blockEmails: boolean;
};

export function emptyFormData(prefill?: Partial<OnboardingFormData>): OnboardingFormData {
  return {
    employmentType: "contract",
    candidateEmail: "",
    alternateEmail: "",
    company: "ApTask Inc.",
    firstName: "",
    lastName: "",
    mobile: "",
    homePhone: "",
    country: "USA",
    address: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    ssn: "",
    dateOfBirth: "",
    sourcedFrom: "",
    otherSource: "",
    workAuthorization: "",
    otherAuthorization: "",
    authorizationExpiry: "",
    payTerms: "",
    gender: "",
    client: "",
    jobId: "",
    jobTitle: "",
    startDate: "",
    tentativeEnd: "",
    isVerified: false,
    status: "New",
    subStatus: "Profile Setup",
    jobCategory: "",
    vendorName: "",
    liveInState: "",
    workStatus: "On-site",
    workAddress: "",
    workCity: "",
    workState: "",
    workZip: "",
    billRate: "",
    billRateCurrency: "USD",
    billRateType: "Hourly",
    payRate: "",
    payRateCurrency: "USD",
    payRateType: "Hourly",
    assignedMembers: [],
    hirerightId: "",
    reportingManager: "",
    backgroundEmail: "",
    remarks: "",
    blockEmails: false,
    ...prefill,
  };
}

export const STEP_LABELS = [
  "Candidate Info",
  "Assignment",
  "Rates & Location",
  "Team & Screening",
  "Review",
] as const;

export const TOTAL_STEPS = STEP_LABELS.length;
