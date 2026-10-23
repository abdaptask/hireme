/**
 * HireMe — Bulk mock-data generator
 *
 * Runs after the hand-written seed (prisma/seed.ts) and fills the database
 * with a large, internally-consistent dataset so every workspace, dashboard
 * and report (§7, §34, §49–§73) has realistic volume and history.
 *
 * - Deterministic: a seeded PRNG (mulberry32) drives every choice, so two
 *   runs on the same day produce the same rows.
 * - Fresh: every date is relative to `new Date()` at run time.
 * - Fast: rows are built in memory with explicit ids and inserted with
 *   chunked `createMany`.
 */

import type { PrismaClient, Prisma } from "../src/generated/prisma/client";

// ─────────────────────────────────────────────────────────
// PRNG + helpers
// ─────────────────────────────────────────────────────────

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rnd = mulberry32(20261023);
const DAY = 86_400_000;
const HOUR = 3_600_000;
const MIN = 60_000;

const int = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;
const float = (min: number, max: number) => rnd() * (max - min) + min;
const chance = (p: number) => rnd() < p;
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)];
function weighted<T>(pairs: readonly (readonly [T, number])[]): T {
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  let r = rnd() * total;
  for (const [v, w] of pairs) {
    r -= w;
    if (r <= 0) return v;
  }
  return pairs[pairs.length - 1][0];
}
function sample<T>(arr: readonly T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}
const pad = (n: number, w: number) => String(n).padStart(w, "0");
const digits = (n: number) => Array.from({ length: n }, () => int(0, 9)).join("");
const hex = (n: number) => Array.from({ length: n }, () => int(0, 15).toString(16)).join("");
const alnum = (n: number) =>
  Array.from({ length: n }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789"[int(0, 33)]).join("");
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

let NOW = new Date();
let TODAY = new Date();

/** Date `offset` days from today at a random business hour (local time). */
function dayAt(offset: number, h0 = 8, h1 = 18): Date {
  const d = new Date(TODAY.getTime() + offset * DAY);
  d.setHours(int(h0, h1 - 1), int(0, 59), int(0, 59), 0);
  return d;
}
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY);
const addMs = (d: Date, ms: number) => new Date(d.getTime() + ms);
const between = (a: Date, b: Date) =>
  b.getTime() <= a.getTime() ? new Date(a) : new Date(a.getTime() + rnd() * (b.getTime() - a.getTime()));
const minDate = (...ds: Date[]) => new Date(Math.min(...ds.map((d) => d.getTime())));
const maxDate = (...ds: Date[]) => new Date(Math.max(...ds.map((d) => d.getTime())));
const daysUntil = (d: Date) => Math.round((d.getTime() - TODAY.getTime()) / DAY);
const ymd = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}-${pad(d.getDate(), 2)}`;
const shortDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
/** Clamp a date so it is never in the future. */
const past = (d: Date) => minDate(d, addMs(NOW, -int(5, 90) * MIN));

async function chunked<T>(rows: T[], fn: (chunk: T[]) => Promise<unknown>, size = 500) {
  for (let i = 0; i < rows.length; i += size) await fn(rows.slice(i, i + size));
}

// ─────────────────────────────────────────────────────────
// STAFF ROSTER — reused across every entity (string fields)
// ─────────────────────────────────────────────────────────

export const RECRUITERS = [
  "Mia Thompson", "Sandra Lee", "Derek Okafor", "Jordan Ellis",
  "Natalie Brooks", "Omar Haddad", "Kevin Tran", "Rachel Goldstein",
] as const;
export const ONBOARDERS = ["Carlos Rivera", "Aisha Ndiaye", "Riya Kim", "Marcus Bell", "Elena Petrova"] as const;
export const ACCOUNT_MANAGERS = ["Devon Hughes", "Priya Shah", "Tom Whitaker", "Lauren Mitchell", "Andre Coleman"] as const;
export const RECRUITING_MANAGERS = ["Victoria Chen", "Robert Alvarez"] as const;
export const SUPER_ADMINS = ["Hannah Wright", "Samuel Osei"] as const;

const ROLE_OF: Record<string, string> = {};
RECRUITERS.forEach((n) => (ROLE_OF[n] = "recruiter"));
ONBOARDERS.forEach((n) => (ROLE_OF[n] = "onboarder"));
ACCOUNT_MANAGERS.forEach((n) => (ROLE_OF[n] = "account-manager"));
RECRUITING_MANAGERS.forEach((n) => (ROLE_OF[n] = "recruiting-manager"));
SUPER_ADMINS.forEach((n) => (ROLE_OF[n] = "super-admin"));

// ─────────────────────────────────────────────────────────
// REFERENCE DATA
// ─────────────────────────────────────────────────────────

const FIRST = [
  "Olivia", "Liam", "Ava", "Noah", "Sophia", "Ethan", "Isabella", "Mateo", "Mia", "Lucas",
  "Amara", "Kwame", "Chloe", "Diego", "Priya", "Arjun", "Mei", "Wei", "Hana", "Kenji",
  "Fatima", "Omar", "Layla", "Yusuf", "Zara", "Malik", "Imani", "Jamal", "Aaliyah", "Darnell",
  "Sofia", "Alejandro", "Valentina", "Santiago", "Camila", "Gabriel", "Lucia", "Andres", "Elena", "Javier",
  "Hannah", "Benjamin", "Grace", "Samuel", "Emily", "Daniel", "Abigail", "Michael", "Natalie", "Christopher",
  "Aisha", "Tunde", "Ngozi", "Chidi", "Adaeze", "Kofi", "Abena", "Thandiwe", "Sipho", "Nia",
  "Anika", "Rohan", "Kavya", "Vikram", "Sanjay", "Deepa", "Neha", "Rahul", "Ananya", "Aditya",
  "Min-jun", "Seo-yeon", "Ji-woo", "Hyun", "Yuna", "Takeshi", "Sakura", "Haruto", "Linh", "Minh",
  "Tran", "Bao", "Mai", "Nikolai", "Katya", "Dmitri", "Anya", "Lars", "Ingrid", "Freya",
  "Connor", "Siobhan", "Declan", "Maeve", "Rory", "Isla", "Finn", "Ruby", "Owen", "Megan",
  "Jasmine", "Tyler", "Brianna", "Marcus", "Destiny", "Andre", "Keisha", "Terrence", "Jada", "Xavier",
  "Leah", "Ari", "Miriam", "Eli", "Noor", "Hamza", "Rania", "Karim", "Salma", "Tariq",
];
const LAST = [
  "Johnson", "Williams", "Brown", "Garcia", "Martinez", "Rodriguez", "Hernandez", "Lopez", "Gonzalez", "Perez",
  "Nguyen", "Tran", "Le", "Pham", "Kim", "Park", "Choi", "Lee", "Chen", "Wang",
  "Li", "Zhang", "Liu", "Yamamoto", "Tanaka", "Sato", "Patel", "Shah", "Singh", "Kumar",
  "Sharma", "Reddy", "Iyer", "Desai", "Okafor", "Adeyemi", "Mensah", "Owusu", "Diallo", "Ndlovu",
  "Abdi", "Hassan", "Khan", "Ali", "Rahman", "Haddad", "Nasser", "Farouk", "Cohen", "Levy",
  "Friedman", "Rossi", "Bianchi", "Romano", "Muller", "Schmidt", "Fischer", "Novak", "Kowalski", "Petrov",
  "Ivanova", "Larsen", "Johansson", "Olsen", "O'Brien", "Murphy", "Kelly", "Sullivan", "Walsh", "Byrne",
  "Smith", "Jones", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson",
  "White", "Harris", "Martin", "Thompson", "Robinson", "Clark", "Lewis", "Walker", "Hall", "Allen",
  "Young", "King", "Wright", "Scott", "Green", "Baker", "Adams", "Nelson", "Carter", "Mitchell",
  "Ramirez", "Torres", "Flores", "Rivera", "Gomez", "Diaz", "Morales", "Ortiz", "Castillo", "Vargas",
  "Washington", "Jefferson", "Banks", "Coleman", "Freeman", "Bishop", "Fleming", "Holloway", "Pierce", "Sutton",
];

// [city, state, zip, area code]
const CITIES: [string, string, string, string][] = [
  ["Austin", "TX", "78701", "512"], ["Dallas", "TX", "75201", "214"], ["Houston", "TX", "77002", "713"],
  ["San Antonio", "TX", "78205", "210"], ["New York", "NY", "10001", "212"], ["Brooklyn", "NY", "11201", "718"],
  ["Buffalo", "NY", "14202", "716"], ["Chicago", "IL", "60601", "312"], ["Naperville", "IL", "60540", "630"],
  ["Los Angeles", "CA", "90012", "213"], ["San Francisco", "CA", "94105", "415"], ["San Diego", "CA", "92101", "619"],
  ["San Jose", "CA", "95113", "408"], ["Seattle", "WA", "98101", "206"], ["Bellevue", "WA", "98004", "425"],
  ["Portland", "OR", "97204", "503"], ["Denver", "CO", "80202", "303"], ["Phoenix", "AZ", "85004", "602"],
  ["Atlanta", "GA", "30303", "404"], ["Miami", "FL", "33131", "305"], ["Tampa", "FL", "33602", "813"],
  ["Orlando", "FL", "32801", "407"], ["Charlotte", "NC", "28202", "704"], ["Raleigh", "NC", "27601", "919"],
  ["Nashville", "TN", "37203", "615"], ["Memphis", "TN", "38103", "901"], ["Boston", "MA", "02108", "617"],
  ["Cambridge", "MA", "02139", "617"], ["Philadelphia", "PA", "19103", "215"], ["Pittsburgh", "PA", "15222", "412"],
  ["Newark", "NJ", "07102", "973"], ["Princeton", "NJ", "08540", "609"], ["Columbus", "OH", "43215", "614"],
  ["Cleveland", "OH", "44114", "216"], ["Detroit", "MI", "48226", "313"], ["Minneapolis", "MN", "55401", "612"],
  ["Kansas City", "MO", "64105", "816"], ["St. Louis", "MO", "63101", "314"], ["Indianapolis", "IN", "46204", "317"],
  ["Louisville", "KY", "40202", "502"], ["Arlington", "VA", "22201", "703"], ["Richmond", "VA", "23219", "804"],
  ["Baltimore", "MD", "21202", "410"], ["Salt Lake City", "UT", "84101", "801"], ["Hartford", "CT", "06103", "860"],
];
const STREETS = [
  "Maple Ave", "Oak St", "Cedar Ln", "Pine St", "Elm St", "Washington Blvd", "Lakeview Dr", "Park Ave",
  "Main St", "Highland Ave", "Sunset Blvd", "River Rd", "Hillcrest Dr", "Willow Way", "Magnolia Ct", "2nd St",
];

const STATE_TAX_FORM: Record<string, string> = {
  CA: "California DE 4", NY: "New York IT-2104", IL: "Illinois IL-W-4", NJ: "New Jersey NJ-W4",
  PA: "Pennsylvania REV-419", OH: "Ohio IT 4", MI: "Michigan MI-W4", GA: "Georgia G-4",
  NC: "North Carolina NC-4", VA: "Virginia VA-4", MA: "Massachusetts M-4", MD: "Maryland MW507",
  MN: "Minnesota W-4MN", MO: "Missouri MO W-4", KY: "Kentucky K-4", CT: "Connecticut CT-W4",
  CO: "Colorado DR 0004", AZ: "Arizona A-4", OR: "Oregon OR-W-4", IN: "Indiana WH-4", UT: "Utah TC-40W",
};
const NO_INCOME_TAX = new Set(["TX", "FL", "WA", "TN", "NV"]);

const C2C_VENDORS = [
  "TechBridge LLC", "CodeBridge Partners", "Nimbus Consulting Inc.", "BlueOrbit Solutions",
  "Kestrel IT Group", "Silverline Staffing LLC", "Northstar Talent Partners", "Vantage Point Consulting",
];

type Family = { titles: string[]; skills: string[]; bill: [number, number] };
const FAMILIES: Record<string, Family> = {
  "Software Engineering": { titles: ["Senior Software Engineer", "Full Stack Developer", "Backend Engineer", "Frontend Engineer", "Java Developer"], skills: ["React", "TypeScript", "Node.js", "Java", "Spring Boot", "Python", "Go", "AWS", "PostgreSQL", "GraphQL"], bill: [95, 185] },
  "Cloud & DevOps": { titles: ["DevOps Engineer", "Cloud Architect", "Site Reliability Engineer", "Platform Engineer"], skills: ["AWS", "Azure", "Terraform", "Kubernetes", "Docker", "CI/CD", "Linux", "Ansible"], bill: [110, 210] },
  "Data & Analytics": { titles: ["Data Engineer", "Data Analyst", "BI Developer", "Data Scientist", "Analytics Engineer"], skills: ["SQL", "Python", "Snowflake", "dbt", "Tableau", "Power BI", "Spark", "Airflow"], bill: [85, 175] },
  "Nursing & Clinical": { titles: ["Registered Nurse", "ICU Nurse", "Clinical Coordinator", "Medical Technologist", "Charge Nurse"], skills: ["Patient Care", "Epic EHR", "BLS", "ACLS", "Triage", "HIPAA", "Telemetry"], bill: [62, 125] },
  "Health IT": { titles: ["Health IT Specialist", "EHR Analyst", "Clinical Informatics Analyst", "Epic Analyst"], skills: ["Epic", "Cerner", "HL7", "FHIR", "HIPAA", "EHR Integration"], bill: [90, 160] },
  "Finance & Accounting": { titles: ["Financial Analyst", "Senior Accountant", "Risk Analyst", "Compliance Analyst", "AML Investigator"], skills: ["SOX", "GAAP", "Excel", "SAP FICO", "Risk Modeling", "AML/KYC", "Reconciliation"], bill: [70, 150] },
  "Project Management": { titles: ["Project Manager", "Scrum Master", "Program Manager", "Business Analyst"], skills: ["Agile", "Jira", "Stakeholder Management", "PMP", "Confluence", "Requirements Gathering"], bill: [80, 165] },
  Cybersecurity: { titles: ["Security Analyst", "IAM Engineer", "SOC Analyst", "Security Engineer"], skills: ["SIEM", "Splunk", "Okta", "Zero Trust", "NIST 800-53", "Incident Response", "CrowdStrike"], bill: [100, 200] },
  "Engineering & Manufacturing": { titles: ["Manufacturing Engineer", "Quality Engineer", "Process Engineer", "Maintenance Technician"], skills: ["Lean Six Sigma", "AutoCAD", "PLC", "ISO 9001", "Root Cause Analysis", "SolidWorks"], bill: [60, 135] },
  "Supply Chain & Logistics": { titles: ["Logistics Coordinator", "Supply Chain Analyst", "Warehouse Supervisor", "Transportation Planner"], skills: ["SAP MM", "WMS", "Inventory Control", "TMS", "Forecasting", "Excel"], bill: [55, 110] },
  "Retail Operations": { titles: ["Merchandising Analyst", "Store Operations Manager", "Retail Analyst", "Category Analyst"], skills: ["Merchandising", "Inventory Planning", "POS", "Excel", "SAP Retail"], bill: [55, 115] },
  "Telecom Engineering": { titles: ["Network Engineer", "RF Engineer", "Field Technician", "NOC Engineer"], skills: ["Cisco", "5G", "LTE", "Fiber Optics", "Juniper", "BGP"], bill: [70, 160] },
  "Clinical Research": { titles: ["Clinical Research Associate", "Regulatory Affairs Specialist", "Lab Technician", "Validation Engineer"], skills: ["GCP", "GxP", "21 CFR Part 11", "CTMS", "Validation", "Veeva Vault"], bill: [75, 170] },
  "Energy Operations": { titles: ["Field Engineer", "Power Systems Engineer", "HSE Specialist", "SCADA Engineer"], skills: ["SCADA", "OSHA 30", "NERC CIP", "Electrical Systems", "AutoCAD Electrical"], bill: [75, 165] },
  "Insurance Operations": { titles: ["Claims Adjuster", "Underwriting Analyst", "Actuarial Analyst", "Policy Administrator"], skills: ["Guidewire", "Claims Processing", "Underwriting", "Actuarial Modeling", "Duck Creek"], bill: [60, 140] },
};

type IndustryMeta = { families: string[]; programs: string[]; extraTraining: [string, string][]; rules: [string, string, string?][] };
const INDUSTRIES: Record<string, IndustryMeta> = {
  Healthcare: { families: ["Nursing & Clinical", "Health IT", "Data & Analytics", "Project Management"], programs: ["Nursing Staff", "Health IT", "Revenue Cycle", "Allied Health"], extraTraining: [["HIPAA Privacy Training", "compliance"]], rules: [["Criminal Background Check", "background"], ["Drug Screening (10-panel)", "drug"], ["HIPAA Training", "training"], ["Professional License Verification", "document", "Licensed roles only"], ["TB Test / Immunization Records", "document", "Patient-facing roles"]] },
  Technology: { families: ["Software Engineering", "Cloud & DevOps", "Data & Analytics", "Cybersecurity", "Project Management"], programs: ["Engineering", "Cloud Platform", "Data Platform", "Product"], extraTraining: [["Secure Coding Fundamentals", "security"]], rules: [["Background Check", "background"], ["Security Awareness Training", "training"], ["IP Assignment Agreement", "document"], ["Acceptable Use Policy", "document"]] },
  Finance: { families: ["Finance & Accounting", "Software Engineering", "Data & Analytics", "Cybersecurity", "Project Management"], programs: ["Risk & Compliance", "Technology", "Operations", "Wealth Management"], extraTraining: [["SOX Compliance Training", "compliance"], ["AML Awareness", "compliance"]], rules: [["Enhanced Background Check (7-year)", "background"], ["Credit Check", "background", "Finance roles"], ["FINRA Fingerprinting", "background", "Registered roles"], ["SOX Compliance Training", "training"], ["Drug Screening", "drug"]] },
  Retail: { families: ["Retail Operations", "Supply Chain & Logistics", "Data & Analytics", "Software Engineering"], programs: ["Corporate", "Store Operations", "E-Commerce", "Distribution"], extraTraining: [["Loss Prevention Basics", "safety"]], rules: [["Background Check", "background"], ["Retail Code of Conduct", "document"], ["Drug Screening", "drug", "Distribution center roles"]] },
  Manufacturing: { families: ["Engineering & Manufacturing", "Supply Chain & Logistics", "Project Management"], programs: ["Plant Operations", "Quality", "Engineering"], extraTraining: [["OSHA Safety Training", "safety"]], rules: [["Background Check", "background"], ["Drug Screening (5-panel)", "drug"], ["OSHA 10 Certification", "training"], ["PPE Acknowledgment", "document"], ["ITAR Citizenship Verification", "document", "Defense programs"]] },
  Energy: { families: ["Energy Operations", "Engineering & Manufacturing", "Data & Analytics", "Project Management"], programs: ["Field Operations", "Grid Modernization", "Renewables"], extraTraining: [["OSHA Safety Training", "safety"], ["NERC CIP Awareness", "security"]], rules: [["Background Check", "background"], ["Drug & Alcohol Screening (DOT)", "drug"], ["NERC CIP Training", "training"], ["TWIC Card", "document", "Port / facility access"]] },
  "Government/Federal": { families: ["Cybersecurity", "Software Engineering", "Project Management", "Cloud & DevOps"], programs: ["Federal Civilian", "Defense", "State & Local"], extraTraining: [["Insider Threat Awareness", "security"], ["CUI Handling", "security"]], rules: [["Public Trust Background Investigation", "background"], ["US Citizenship Verification", "document"], ["Security Clearance Verification", "document", "Cleared roles"], ["Cyber Awareness Challenge", "training"], ["E-Verify (FAR 52.222-54)", "document"]] },
  Insurance: { families: ["Insurance Operations", "Data & Analytics", "Software Engineering", "Finance & Accounting"], programs: ["Claims", "Underwriting", "Digital"], extraTraining: [["SOX Compliance Training", "compliance"]], rules: [["Background Check (7-year)", "background"], ["Credit Check", "background", "Claims authority roles"], ["Privacy & GLBA Training", "training"], ["NDA", "document"]] },
  Telecom: { families: ["Telecom Engineering", "Cloud & DevOps", "Software Engineering", "Project Management"], programs: ["Network Build", "Field Services", "IT"], extraTraining: [["Tower Climbing Safety", "safety"]], rules: [["Background Check", "background"], ["Drug Screening", "drug"], ["MVR Check", "background", "Field roles with company vehicle"], ["CPNI Training", "training"]] },
  Pharma: { families: ["Clinical Research", "Data & Analytics", "Project Management", "Engineering & Manufacturing"], programs: ["Clinical Operations", "Quality & Validation", "R&D"], extraTraining: [["GxP Fundamentals", "compliance"], ["HIPAA Privacy Training", "compliance"]], rules: [["Background Check", "background"], ["Drug Screening", "drug"], ["GxP Training", "training"], ["Confidentiality Agreement", "document"], ["Education Verification", "background", "Scientific roles"]] },
  Logistics: { families: ["Supply Chain & Logistics", "Software Engineering", "Project Management"], programs: ["Warehouse Operations", "Transportation", "Technology"], extraTraining: [["OSHA Safety Training", "safety"], ["Forklift Certification", "safety"]], rules: [["Background Check", "background"], ["Drug Screening (DOT)", "drug"], ["MVR Check", "background", "Driving roles"], ["Safety Orientation", "training"]] },
};

// ─────────────────────────────────────────────────────────
// CLIENT CATALOG (§8.1, §56)
// ─────────────────────────────────────────────────────────

type NewClient = { name: string; industry: string; hq: string; msp: string | null; status?: "ACTIVE" | "AT_RISK" | "ON_HOLD"; prefix: string };
const NEW_CLIENTS: NewClient[] = [
  { name: "Cedar Valley Health System", industry: "Healthcare", hq: "Denver, CO", msp: "Beeline", prefix: "CV-" },
  { name: "Brightwater Medical Partners", industry: "Healthcare", hq: "Boston, MA", msp: null, prefix: "BW-" },
  { name: "Oakmont Senior Care", industry: "Healthcare", hq: "Phoenix, AZ", msp: "Vndly", status: "AT_RISK", prefix: "OSC-" },
  { name: "Lumina Software", industry: "Technology", hq: "San Francisco, CA", msp: "Vndly", prefix: "LUM-" },
  { name: "Quantum Ridge Systems", industry: "Technology", hq: "Raleigh, NC", msp: "SAP Fieldglass", prefix: "QRS-" },
  { name: "Ironclad Cloud Services", industry: "Technology", hq: "Dallas, TX", msp: "Magnit", prefix: "ICS-" },
  { name: "Harborview Capital", industry: "Finance", hq: "Charlotte, NC", msp: "SAP Fieldglass", prefix: "HVC-" },
  { name: "Sterling Point Bank", industry: "Finance", hq: "Chicago, IL", msp: "Beeline", prefix: "SPB-" },
  { name: "Granite State Credit Union", industry: "Finance", hq: "Manchester, NH", msp: null, status: "ON_HOLD", prefix: "GSCU-" },
  { name: "Northgate Markets", industry: "Retail", hq: "Minneapolis, MN", msp: null, prefix: "NGM-" },
  { name: "Coastline Apparel Co.", industry: "Retail", hq: "Los Angeles, CA", msp: "VectorVMS", prefix: "CAC-" },
  { name: "Titan Precision Manufacturing", industry: "Manufacturing", hq: "Detroit, MI", msp: "Magnit", prefix: "TPM-" },
  { name: "Keystone Industrial Works", industry: "Manufacturing", hq: "Pittsburgh, PA", msp: null, status: "AT_RISK", prefix: "KIW-" },
  { name: "Solaris Energy Partners", industry: "Energy", hq: "Houston, TX", msp: "SAP Fieldglass", prefix: "SEP-" },
  { name: "Bluegrass Power & Light", industry: "Energy", hq: "Louisville, KY", msp: "Beeline", prefix: "BPL-" },
  { name: "Federal Systems Integration Group", industry: "Government/Federal", hq: "Arlington, VA", msp: null, prefix: "FSIG-" },
  { name: "Patriot Federal Services", industry: "Government/Federal", hq: "Reston, VA", msp: "VectorVMS", prefix: "PFS-" },
  { name: "Evergreen Mutual Insurance", industry: "Insurance", hq: "Hartford, CT", msp: "Beeline", prefix: "EMI-" },
  { name: "Pinnacle Assurance Group", industry: "Insurance", hq: "Columbus, OH", msp: "Vndly", prefix: "PAG-" },
  { name: "ClearWave Communications", industry: "Telecom", hq: "Kansas City, MO", msp: "SAP Fieldglass", prefix: "CWC-" },
  { name: "Vertex Wireless", industry: "Telecom", hq: "Atlanta, GA", msp: "Magnit", status: "AT_RISK", prefix: "VXW-" },
  { name: "Helix BioPharma", industry: "Pharma", hq: "Princeton, NJ", msp: "SAP Fieldglass", prefix: "HBP-" },
  { name: "Aurora Therapeutics", industry: "Pharma", hq: "Cambridge, MA", msp: "Beeline", prefix: "AUR-" },
  { name: "Summit Freight Logistics", industry: "Logistics", hq: "Memphis, TN", msp: null, prefix: "SFL-" },
  { name: "RapidRoute Distribution", industry: "Logistics", hq: "Indianapolis, IN", msp: "VectorVMS", status: "ON_HOLD", prefix: "RRD-" },
];

const CANDIDATE_STAGES = [
  "Profile Setup", "Document Submission", "Background Check", "Tax & Payroll",
  "Client Requirements", "IT Provisioning", "Training", "Day 1 Prep",
] as const;
const stageIndex = (progress: number) => Math.min(7, Math.floor(progress / 12.5));

// §18 exception categories (Title Case, matching the hand-written seed)
export const EXCEPTION_CATEGORIES = [
  "Missing Document", "Rejected Document", "Identity Mismatch", "Expired ID", "Background Check Delay",
  "Drug Screen Delay", "Client Approval Delay", "Duplicate Profile", "Invalid Bank Information",
  "Invalid Tax Information", "E-Signature Failure", "Integration Failure", "Equipment Delay",
  "Start-Date Change", "Work Authorization Issue", "Payroll Issue", "Billing Issue",
  "Candidate Unresponsive", "Training Overdue",
] as const;

// ─────────────────────────────────────────────────────────
// Internal working types
// ─────────────────────────────────────────────────────────

type ClientRef = {
  id: string; name: string; industry: string; hq: string; msp: string | null;
  accountManager: string; programs: string[]; prefix: string;
};
type CandRef = {
  id: string; first: string; last: string; email: string; phone: string;
  status: string; risk: string; progress: number; stageIdx: number;
  empType: string; client: ClientRef; recruiter: string; onboarder: string;
  createdAt: Date; startDate: Date | null; city: string; state: string; workLocation: string;
  family: string; vendor: string | null;
};

const EMP_LABEL: Record<string, string> = {
  W2: "W-2", C2C: "C2C", INDEPENDENT_1099: "1099", FULL_TIME: "Full-Time", CONTRACT_TO_HIRE: "Contract-to-Hire", INTERN: "Intern",
};

// ═════════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════════

export async function seedBulk(prisma: PrismaClient) {
  NOW = new Date();
  TODAY = new Date(NOW);
  TODAY.setHours(0, 0, 0, 0);
  console.log("  → Bulk generation (deterministic PRNG, dates relative to today)");

  // Existing (hand-written) data we must stay consistent with
  const existingClients = await prisma.client.findMany();
  const usedEmails = new Set<string>([
    ...(await prisma.candidate.findMany({ select: { email: true } })).map((c) => c.email),
    ...(await prisma.consultant.findMany({ select: { email: true } })).map((c) => c.email),
  ]);
  const usedPhones = new Set<string>();

  const personName = () => [pick(FIRST), pick(LAST)] as const;
  const uniqueEmail = (first: string, last: string) => {
    const base = `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, "");
    const domains = ["example.com", "mail.example.com", "example.net"];
    for (let i = 0; ; i++) {
      const e = `${base}${i === 0 ? "" : i + 1}@${domains[i % domains.length]}`;
      if (!usedEmails.has(e)) {
        usedEmails.add(e);
        return e;
      }
    }
  };
  const phoneFor = (area: string) => {
    for (;;) {
      const p = `(${area}) 555-${pad(int(100, 9999), 4)}`;
      if (!usedPhones.has(p)) {
        usedPhones.add(p);
        return p;
      }
    }
  };

  // ───────────────────────────────────────────────────────
  // CLIENTS (+ contacts, compliance rules, promises)  §8.1 §41.5 §56
  // ───────────────────────────────────────────────────────
  console.log("    · Clients, contacts, rules, promises");
  const clients: ClientRef[] = existingClients.map((c) => ({
    id: c.id, name: c.name, industry: c.industry, hq: c.hq, msp: c.msp,
    accountManager: c.accountManager, programs: c.programs, prefix: c.workerIdPrefix ?? "WK-",
  }));

  const clientRows: Prisma.ClientCreateManyInput[] = [];
  const contactRows: Prisma.ClientContactCreateManyInput[] = [];
  const ruleRows: Prisma.ComplianceRuleCreateManyInput[] = [];
  const promiseRows: Prisma.ClientPromiseCreateManyInput[] = [];

  NEW_CLIENTS.forEach((nc, i) => {
    const id = `client-bk-${pad(i + 1, 3)}`;
    const meta = INDUSTRIES[nc.industry];
    const am = ACCOUNT_MANAGERS[i % ACCOUNT_MANAGERS.length];
    const status = nc.status ?? "ACTIVE";
    const atRisk = status !== "ACTIVE";
    const programs = sample(meta.programs, int(2, meta.programs.length));
    const allowed = nc.industry === "Government/Federal" ? ["W-2"] : sample(["W-2", "C2C", "1099"], int(1, 3)).sort();
    if (!allowed.includes("W-2")) allowed.unshift("W-2");
    const domain = slug(nc.name).replace(/-/g, "");
    clientRows.push({
      id, name: nc.name, industry: nc.industry, hq: nc.hq, accountManager: am, programs,
      msp: nc.msp, vmsPlatform: nc.msp, employmentTypesAllowed: allowed, status,
      website: `https://www.${domain}.example`,
      invoiceFrequency: pick(["Weekly", "Bi-weekly", "Monthly", "Monthly"]),
      paymentTermsDays: pick([30, 30, 45, 60]),
      workerIdPrefix: nc.prefix,
      activeConsultants: int(8, 95),
      avgOnboardingDays: atRisk ? int(14, 21) : int(6, 15),
      compliancePassRate: Math.round((atRisk ? float(75, 88) : float(86, 99)) * 10) / 10,
      startDateSuccessRate: Math.round((atRisk ? float(70, 84) : float(85, 99)) * 10) / 10,
      since: `${int(2018, 2025)}-${pad(int(1, 12), 2)}`,
      notes: atRisk
        ? pick(["Escalation open with client VMO over start-date slippage.", "Slow client approval cycles; weekly status call in place.", "Program paused pending budget approval — no new starts."])
        : pick(["Strategic account — quarterly business reviews.", "Steady volume; streamlined package.", "Growing program; expect volume increase next quarter.", "Client-branded portal enabled."]),
      createdAt: dayAt(-int(270, 720)),
    });
    clients.push({ id, name: nc.name, industry: nc.industry, hq: nc.hq, msp: nc.msp, accountManager: am, programs, prefix: nc.prefix });

    const contactTypes = ["primary", "billing", "hr", "technical"];
    const titles: Record<string, string[]> = {
      primary: ["Vendor Manager", "Director of Contingent Workforce", "VMO Lead", "Procurement Manager"],
      billing: ["AP Manager", "Billing Specialist", "Finance Operations Lead"],
      hr: ["HR Director", "HR Business Partner", "Talent Operations Manager"],
      technical: ["IT Manager", "Access Management Lead", "Service Desk Manager"],
    };
    const nContacts = int(1, 3);
    for (let k = 0; k < nContacts; k++) {
      const [f, l] = personName();
      const type = contactTypes[k];
      contactRows.push({
        clientId: id, name: `${f} ${l}`, title: pick(titles[type]), type,
        email: `${f[0].toLowerCase()}.${l.toLowerCase().replace(/[^a-z]/g, "")}@${domain}.example`,
        phone: chance(0.7) ? `(${pick(CITIES)[3]}) 555-${pad(int(100, 9999), 4)}` : null,
      });
    }

    const rules = sample(meta.rules, int(2, Math.min(6, meta.rules.length)));
    if (rules.length < 6 && chance(0.6)) rules.push([`${nc.name} NDA`, "document"]);
    rules.forEach(([label, category, condition], k) =>
      ruleRows.push({ clientId: id, label, category, required: true, condition: condition ?? null, policyId: `POL-${nc.prefix.replace("-", "")}-${pad(k + 1, 3)}` }),
    );

    const nPromises = int(1, 4);
    for (let k = 0; k < nPromises; k++) {
      const status = weighted([["on-track", 4], ["at-risk", 3], ["missed", 2], ["delivered", 3]] as const);
      const [f, l] = personName();
      const what = pick(["Background clearance", "Start date", "Equipment delivery", "Portal access", "Screening complete", "Badge issued"]);
      let promised: Date;
      let actual: Date | null = null;
      if (status === "on-track") promised = addDays(TODAY, int(3, 30));
      else if (status === "at-risk") promised = addDays(TODAY, int(1, 10));
      else if (status === "missed") {
        promised = addDays(TODAY, -int(1, 20));
        if (chance(0.5)) actual = minDate(addDays(promised, int(1, 6)), TODAY);
      } else {
        promised = addDays(TODAY, -int(3, 60));
        actual = addDays(promised, -int(0, 3));
      }
      promiseRows.push({
        clientId: id, label: `${what} (${f} ${l})`, promisedDate: ymd(promised),
        actualDate: actual ? ymd(actual) : null, status, createdAt: addDays(promised, -int(10, 30)),
      });
    }
  });

  await prisma.client.createMany({ data: clientRows });
  await prisma.clientContact.createMany({ data: contactRows });
  await prisma.complianceRule.createMany({ data: ruleRows });
  await prisma.clientPromise.createMany({ data: promiseRows });

  // ───────────────────────────────────────────────────────
  // CANDIDATES  §15 §5.2 §33
  // ───────────────────────────────────────────────────────
  console.log("    · Candidates");
  const TAGS = ["priority", "engineering", "healthcare", "rehire", "delta-onboarding", "high-touch", "remote", "relocation", "clearance-required", "bilingual", "executive-client", "fast-track", "union"];
  const cands: CandRef[] = [];
  const candRows: Prisma.CandidateCreateManyInput[] = [];

  for (let i = 0; i < 250; i++) {
    const id = `cand-bk-${pad(i + 1, 4)}`;
    const [first, last] = personName();
    const [city, st, zip, area] = pick(CITIES);
    const client = pick(clients);
    const meta = INDUSTRIES[client.industry] ?? INDUSTRIES.Technology;
    const family = pick(meta.families);
    const fam = FAMILIES[family];
    const status = weighted([["NEW", 10], ["OFFER_ACCEPTED", 15], ["ONBOARDING", 40], ["ON_HOLD", 5], ["WITHDRAWN", 8], ["PLACED", 17], ["ARCHIVED", 5]] as const);
    let empType = weighted([["W2", 55], ["C2C", 12], ["INDEPENDENT_1099", 8], ["CONTRACT_TO_HIRE", 12], ["FULL_TIME", 10], ["INTERN", 3]] as const) as string;
    if (client.industry === "Government/Federal" && (empType === "C2C" || empType === "INDEPENDENT_1099")) empType = "W2";

    let createdAt: Date;
    let startDate: Date | null;
    let progress: number;
    switch (status) {
      case "NEW":
        createdAt = past(dayAt(-int(0, 10)));
        startDate = chance(0.7) ? dayAt(int(20, 45), 9, 10) : null;
        progress = int(0, 8);
        break;
      case "OFFER_ACCEPTED":
        createdAt = past(dayAt(-int(2, 15)));
        startDate = dayAt(int(10, 45), 9, 10);
        progress = int(5, 22);
        break;
      case "ONBOARDING": {
        const dts = weighted([[int(0, 30), 85], [-int(1, 3), 5], [int(31, 45), 10]] as const);
        startDate = dayAt(dts, 9, 10);
        createdAt = past(addDays(startDate, -int(14, 40)));
        const expected = 100 - Math.max(0, dts) * 2.6;
        progress = Math.round(Math.max(18, Math.min(96, expected + float(-28, 12))));
        break;
      }
      case "ON_HOLD":
        startDate = dayAt(int(5, 40), 9, 10);
        createdAt = past(dayAt(-int(10, 60)));
        progress = int(15, 70);
        break;
      case "WITHDRAWN":
        createdAt = past(dayAt(-int(10, 270)));
        startDate = addDays(createdAt, int(20, 40));
        progress = int(5, 60);
        break;
      case "PLACED":
        // skewed toward recent starts but reaching back ~8 months so trend charts have history
        startDate = dayAt(-Math.round(1 + Math.pow(rnd(), 1.4) * 215), 9, 10);
        createdAt = addDays(startDate, -int(15, 40));
        progress = 100;
        break;
      default: // ARCHIVED
        createdAt = dayAt(-int(180, 270));
        startDate = addDays(createdAt, int(20, 40));
        progress = 100;
    }
    const sIdx = progress >= 100 ? 7 : stageIndex(progress);

    // §33 Start-Date Risk — progress vs. time remaining
    let risk = "ON_TRACK";
    if (["ONBOARDING", "OFFER_ACCEPTED", "ON_HOLD"].includes(status) && startDate) {
      const dts = daysUntil(startDate);
      const expected = Math.max(0, Math.min(100, 100 - dts * 3));
      const gap = expected - progress + float(-6, 6);
      if (gap > 28 && dts < 10) risk = "UNLIKELY";
      else if (gap > 15) risk = "AT_RISK";
      else if (gap > 0) risk = "NEEDS_ATTENTION";
      if (status === "ON_HOLD" && risk === "ON_TRACK") risk = "NEEDS_ATTENTION";
    } else if (status === "WITHDRAWN") risk = pick(["AT_RISK", "UNLIKELY", "NEEDS_ATTENTION"]);

    const mode = weighted([["Remote", 30], ["Hybrid", 40], ["Onsite", 30]] as const);
    const [hqCity, hqSt] = client.hq.split(", ");
    const workLocation = mode === "Remote" ? `${city}, ${st} (Remote)` : `${hqCity}, ${hqSt} (${mode})`;
    const vendor = empType === "C2C" ? pick(C2C_VENDORS) : null;
    const email = uniqueEmail(first, last);
    const phone = phoneFor(area);
    const recruiter = pick(RECRUITERS);
    const onboarder = pick(ONBOARDERS);
    const active = ["NEW", "OFFER_ACCEPTED", "ONBOARDING", "ON_HOLD"].includes(status);
    const lastContact = active
      ? past(dayAt(-int(0, risk === "AT_RISK" || risk === "UNLIKELY" ? 6 : 3)))
      : past(addDays(startDate ?? createdAt, int(-5, 5)));

    const tags = sample(TAGS, weighted([[0, 3], [1, 4], [2, 3], [3, 1]] as const));
    if (vendor) tags.push("c2c");
    candRows.push({
      id, firstName: first, lastName: last, email, phone,
      status: status as Prisma.CandidateCreateManyInput["status"],
      risk: risk as Prisma.CandidateCreateManyInput["risk"],
      progress, stage: CANDIDATE_STAGES[sIdx],
      employmentType: empType as Prisma.CandidateCreateManyInput["employmentType"],
      workLocation, startDate, clientName: client.name, recruiter, onboarder, vendor,
      tags,
      notes: chance(0.25)
        ? pick([
            "Prefers SMS over email.", "Relocating — confirm shipping address before equipment dispatch.",
            "Returning consultant — delta onboarding applies.", "Requested start-date flexibility of one week.",
            "Spanish-language communications preferred.", "Candidate on PTO until next Monday.",
            "Client requested expedited start.", "Needs accommodation for drug-screen appointment timing.",
          ])
        : null,
      lastContact,
      street: `${int(10, 9800)} ${pick(STREETS)}`, city, state: st, zip,
      skillFamily: family, skills: sample(fam.skills, int(3, 5)),
      skillConfidence: Math.round(float(0.62, 0.98) * 100) / 100,
      createdAt,
    });
    cands.push({
      id, first, last, email, phone, status, risk, progress, stageIdx: sIdx, empType, client,
      recruiter, onboarder, createdAt, startDate, city, state: st, workLocation, family, vendor,
    });
  }
  await chunked(candRows, (d) => prisma.candidate.createMany({ data: d }));

  // ───────────────────────────────────────────────────────
  // CONSULTANTS + ASSIGNMENTS  §15 §38
  // ───────────────────────────────────────────────────────
  console.log("    · Consultants & assignments");
  const consultantRows: Prisma.ConsultantCreateManyInput[] = [];
  const assignmentRows: Prisma.AssignmentCreateManyInput[] = [];
  const consultantIds: { id: string; name: string; client: ClientRef }[] = [];

  const rateFor = (family: string) => {
    const [lo, hi] = FAMILIES[family].bill;
    const bill = Math.round(float(Math.max(55, lo), Math.min(210, hi)));
    const pay = Math.round(bill * float(0.62, 0.78) * 100) / 100;
    return { bill, pay };
  };
  const jobId = (c: ClientRef) => `REQ-${c.prefix.replace("-", "")}${int(1000, 9999)}`;
  const assignmentBase = (c: ClientRef, family: string, empType: string, st: string, workLocation: string) => ({
    clientId: c.id, jobTitle: pick(FAMILIES[family].titles), jobId: jobId(c), jobCategory: family,
    employmentType: empType as Prisma.AssignmentCreateManyInput["employmentType"],
    workLocation, workState: st, msp: c.msp, program: pick(c.programs.length ? c.programs : ["General"]),
  });

  // Bridge consultants: placed candidates who graduated (shared email — see seed.ts note)
  const placed = cands.filter((c) => c.status === "PLACED");
  const bridged = new Set(placed.slice(0, 40).map((c) => c.id));
  let consIdx = 0;
  for (const c of placed.filter((p) => bridged.has(p.id))) {
    const id = `cons-bk-${pad(++consIdx, 4)}`;
    const { bill, pay } = rateFor(c.family);
    const base = assignmentBase(c.client, c.family, c.empType, c.state, c.workLocation);
    const endDate = addDays(c.startDate!, int(180, 540));
    consultantRows.push({
      id, firstName: c.first, lastName: c.last, email: c.email, phone: c.phone, status: "ACTIVE",
      title: base.jobTitle, clientName: c.client.name, recruiter: c.recruiter, onboarder: c.onboarder,
      accountManager: c.client.accountManager, vendor: c.vendor,
      employmentType: c.empType as Prisma.ConsultantCreateManyInput["employmentType"],
      billRate: bill, payRate: pay, startDate: c.startDate, endDate, location: c.workLocation,
      skills: sample(FAMILIES[c.family].skills, int(3, 5)),
      notes: `Graduated from candidate pipeline ${ymd(c.startDate!)}. Full onboarding history retained.`,
      createdAt: c.startDate!,
    });
    assignmentRows.push({
      ...base, candidateId: c.id, consultantId: id, startDate: c.startDate, endDate,
      billRate: bill, payRate: pay, status: "active", vendorId: c.vendor ? slug(c.vendor) : null,
      createdAt: c.createdAt,
    });
    consultantIds.push({ id, name: `${c.first} ${c.last}`, client: c.client });
  }

  while (consIdx < 150) {
    const id = `cons-bk-${pad(++consIdx, 4)}`;
    const [first, last] = personName();
    const [city, st, , area] = pick(CITIES);
    const client = pick(clients);
    const meta = INDUSTRIES[client.industry] ?? INDUSTRIES.Technology;
    const family = pick(meta.families);
    let empType = weighted([["W2", 60], ["C2C", 18], ["INDEPENDENT_1099", 8], ["CONTRACT_TO_HIRE", 10], ["FULL_TIME", 4]] as const) as string;
    if (client.industry === "Government/Federal") empType = "W2";
    const status = weighted([["ACTIVE", 55], ["BENCH", 8], ["EXTENSION_PENDING", 10], ["OFFBOARDING", 6], ["CONVERTED", 7], ["FORMER", 10], ["INELIGIBLE", 4]] as const);
    const startDate = dayAt(-int(30, 1095), 9, 10);
    let endDate: Date | null;
    let aStatus: string;
    let remarks: string | null = null;
    switch (status) {
      case "ACTIVE":
        endDate = chance(0.25) ? dayAt(int(5, 60), 17, 18) : chance(0.15) ? null : dayAt(int(61, 420), 17, 18);
        aStatus = chance(0.18) ? "extended" : "active";
        if (aStatus === "extended") remarks = "Extended per client amendment.";
        break;
      case "EXTENSION_PENDING":
        endDate = dayAt(int(3, 60), 17, 18);
        aStatus = "active";
        remarks = "Extension requested — awaiting client approval.";
        break;
      case "OFFBOARDING":
        endDate = dayAt(int(0, 14), 17, 18);
        aStatus = "active";
        remarks = pick(["Assignment completion — offboarding checklist in progress.", "Resignation received; final timesheet pending."]);
        break;
      case "CONVERTED":
        endDate = past(dayAt(-int(5, 300), 17, 18));
        aStatus = "completed";
        remarks = "Converted to client employee.";
        break;
      case "INELIGIBLE":
        endDate = past(dayAt(-int(5, 300), 17, 18));
        aStatus = "terminated";
        remarks = pick(["Terminated for cause — ineligible for rehire.", "Policy violation; client requested removal."]);
        break;
      default: // BENCH, FORMER
        endDate = past(dayAt(-int(5, 300), 17, 18));
        aStatus = chance(0.2) && status === "FORMER" ? "terminated" : "completed";
        remarks = status === "BENCH" ? "Assignment ended; available for redeployment." : null;
    }
    if (endDate && endDate <= startDate) endDate = addDays(startDate, int(30, 120));
    const { bill, pay } = rateFor(family);
    const vendor = empType === "C2C" ? pick(C2C_VENDORS) : null;
    const workLocation = `${chance(0.4) ? `${city}, ${st} (Remote)` : `${client.hq} (${pick(["Hybrid", "Onsite"])})`}`;
    const wState = workLocation.includes("Remote") ? st : client.hq.split(", ")[1];
    const base = assignmentBase(client, family, empType, wState, workLocation);
    consultantRows.push({
      id, firstName: first, lastName: last, email: uniqueEmail(first, last), phone: phoneFor(area),
      status: status as Prisma.ConsultantCreateManyInput["status"],
      title: base.jobTitle, clientName: client.name, recruiter: pick(RECRUITERS), onboarder: pick(ONBOARDERS),
      accountManager: client.accountManager, vendor,
      employmentType: empType as Prisma.ConsultantCreateManyInput["employmentType"],
      billRate: bill, payRate: pay, startDate, endDate, location: workLocation,
      skills: sample(FAMILIES[family].skills, int(3, 5)), notes: remarks, createdAt: addDays(startDate, -int(14, 30)),
    });
    // Prior completed assignment for ~20% (supports "Prior assignments", rehire, delta onboarding)
    if (chance(0.2)) {
      const prevClient = pick(clients);
      const prevStart = addDays(startDate, -int(200, 500));
      const prevEnd = addDays(startDate, -int(10, 60));
      const r = rateFor(family);
      assignmentRows.push({
        ...assignmentBase(prevClient, family, empType, wState, workLocation),
        consultantId: id, startDate: prevStart, endDate: prevEnd, billRate: r.bill, payRate: r.pay,
        status: "completed", vendorId: vendor ? slug(vendor) : null, remarks: "Assignment completed.", createdAt: addDays(prevStart, -20),
      });
    }
    assignmentRows.push({
      ...base, consultantId: id, startDate, endDate, billRate: bill, payRate: pay, status: aStatus,
      vendorId: vendor ? slug(vendor) : null, remarks, createdAt: addDays(startDate, -int(10, 25)),
    });
    consultantIds.push({ id, name: `${first} ${last}`, client });
  }

  // Assignments for in-flight / placed candidates that are not bridged
  for (const c of cands) {
    if (!["ONBOARDING", "OFFER_ACCEPTED", "PLACED"].includes(c.status) || bridged.has(c.id)) continue;
    const { bill, pay } = rateFor(c.family);
    assignmentRows.push({
      ...assignmentBase(c.client, c.family, c.empType, c.state, c.workLocation),
      candidateId: c.id, startDate: c.startDate, endDate: c.startDate ? addDays(c.startDate, int(180, 540)) : null,
      billRate: bill, payRate: pay, status: c.status === "PLACED" ? "active" : "pending",
      vendorId: c.vendor ? slug(c.vendor) : null, createdAt: c.createdAt,
    });
  }
  // Historical churn (§68) — short past assignments over the last ~18 months so
  // add / drop reporting has realistic weekly, monthly, and quarterly movement.
  const DROP_REASONS: [string, string][] = [
    ["completed", "Assignment completed — project ended."],
    ["completed", "Assignment completed — client budget cycle ended."],
    ["completed", "Assignment completed — converted scope to SOW."],
    ["completed", "Resigned — accepted another opportunity."],
    ["completed", "Resigned — relocation."],
    ["terminated", "Terminated — client requested early release."],
    ["terminated", "Terminated — attendance / performance."],
  ];
  for (let i = 0; i < 200; i++) {
    const owner = pick(consultantIds);
    const meta = INDUSTRIES[owner.client.industry] ?? INDUSTRIES.Technology;
    const family = pick(meta.families);
    const empType = weighted([["W2", 65], ["C2C", 20], ["INDEPENDENT_1099", 8], ["CONTRACT_TO_HIRE", 7]] as const) as string;
    // End dates spread evenly across the window; start precedes by 1–10 months.
    const end = dayAt(-int(1, 540), 17, 18);
    const start = addDays(end, -int(30, 300));
    const [aStatus, remarks] = pick(DROP_REASONS);
    const { bill, pay } = rateFor(family);
    const wState = owner.client.hq.split(", ")[1];
    assignmentRows.push({
      ...assignmentBase(owner.client, family, empType, wState, `${owner.client.hq} (${pick(["Hybrid", "Onsite", "Remote"])})`),
      consultantId: owner.id, startDate: start, endDate: end, billRate: bill, payRate: pay,
      status: aStatus, remarks, createdAt: addDays(start, -int(10, 25)),
    });
  }

  // Full-time / direct-hire placements (one-time placement fee) — feed the FT
  // columns of the add / drop report. Pay rate = salary ÷ 2,080; the fee % is
  // recorded in remarks ("Direct hire — 20% fee on $120,000 salary").
  const dhRows: Prisma.CandidateCreateManyInput[] = [];
  for (let i = 1; i <= 60; i++) {
    const id = `cand-dh-${pad(i, 3)}`;
    const [first, last] = personName();
    const [city, st, zip, area] = pick(CITIES);
    const client = pick(clients);
    const meta = INDUSTRIES[client.industry] ?? INDUSTRIES.Technology;
    const family = pick(meta.families);
    const start = dayAt(-int(1, 540), 9, 10);
    const salary = int(80, 190) * 1000;
    const feePct = pick([18, 20, 20, 22, 25]);
    dhRows.push({
      id, firstName: first, lastName: last, email: uniqueEmail(first, last), phone: phoneFor(area),
      status: "PLACED", risk: "ON_TRACK", progress: 100, stage: "Day 1 Prep", employmentType: "FULL_TIME",
      workLocation: `${client.hq} (${pick(["Hybrid", "Onsite"])})`, startDate: start, clientName: client.name,
      recruiter: pick(RECRUITERS), onboarder: pick(ONBOARDERS), tags: ["direct-hire"],
      lastContact: start, city, state: st, zip, skillFamily: family, skills: sample(FAMILIES[family].skills, 3),
      skillConfidence: 0.9, createdAt: addDays(start, -int(20, 45)),
    });
    assignmentRows.push({
      ...assignmentBase(client, family, "FULL_TIME", client.hq.split(", ")[1], `${client.hq} (Onsite)`),
      candidateId: id, startDate: start, endDate: null, billRate: null,
      payRate: Math.round((salary / 2080) * 100) / 100, status: "placed",
      remarks: `Direct hire — ${feePct}% fee on $${salary.toLocaleString("en-US")} salary`,
      createdAt: addDays(start, -int(5, 20)),
    });
  }
  await chunked(dhRows, (d) => prisma.candidate.createMany({ data: d }));

  await chunked(consultantRows, (d) => prisma.consultant.createMany({ data: d }));
  await chunked(assignmentRows, (d) => prisma.assignment.createMany({ data: d }));

  // ───────────────────────────────────────────────────────
  // PACKAGES  §8 §9 §102
  // ───────────────────────────────────────────────────────
  console.log("    · Packages");
  const pkgRows: Prisma.PackageCreateManyInput[] = [];
  const itemRows: Prisma.PackageItemCreateManyInput[] = [];
  const pkgRuleRows: Prisma.PackageRuleCreateManyInput[] = [];
  const approvalRows: Prisma.PackageApprovalCreateManyInput[] = [];
  const dispatchRows: Prisma.PackageDispatchCreateManyInput[] = [];
  const pkgRefs: { id: string; name: string; clientId: string; status: string }[] = [];

  const statusPool = [
    ...Array(14).fill("PUBLISHED"), ...Array(6).fill("APPROVED"), ...Array(7).fill("IN_REVIEW"),
    ...Array(6).fill("DRAFT"), ...Array(3).fill("RETIRED"), ...Array(4).fill("SUPERSEDED"),
  ] as string[];
  const famStatuses = sample(statusPool, statusPool.length);

  const buildItems = (pkgId: string, client: ClientRef, emp: string, state: string, pkgStatus: string) => {
    const industry = client.industry;
    const w9 = emp === "C2C" || emp === "1099";
    const items: Omit<Prisma.PackageItemCreateManyInput, "packageId">[] = [
      { section: "required-documents", type: "document", label: "I-9 Employment Eligibility", owner: "Candidate", dueOffset: 3 },
      { section: "required-documents", type: "document", label: "Government-issued ID", owner: "Candidate", dueOffset: 5 },
      { section: "required-documents", type: "document", label: `${client.name} NDA`, owner: "Candidate", dueOffset: 5 },
      { section: "tax-payroll", type: "document", label: w9 ? "Federal W-9" : "Federal W-4", owner: "Candidate", dueOffset: 4 },
      { section: "tax-payroll", type: "document", label: "Direct Deposit Authorization", owner: "Candidate", dueOffset: 4, required: !w9, conditional: w9 ? "Not required for C2C invoicing" : null },
      { section: "screening", type: "screening", label: "Criminal Background Check", owner: "Screening Vendor", dueOffset: 7 },
      { section: "training", type: "training", label: "Security Awareness Training", owner: "Candidate", dueOffset: 2 },
      { section: "approvals", type: "approval", label: "Client Approval", owner: "Account Manager", dueOffset: 2 },
    ];
    const optional: Omit<Prisma.PackageItemCreateManyInput, "packageId">[] = [
      { section: "required-documents", type: "task", label: "E-Verify Submission", owner: "Onboarder", dueOffset: 1 },
      { section: "required-documents", type: "document", label: w9 ? "Vendor / Corp-to-Corp Agreement" : "Employment Agreement", owner: "Candidate", dueOffset: 6 },
      { section: "required-documents", type: "document", label: "Acceptable Use Policy", owner: "Candidate", dueOffset: 3 },
      { section: "optional-documents", type: "document", label: "Emergency Contact Form", owner: "Candidate", dueOffset: 2, required: false },
      { section: "optional-documents", type: "document", label: "Remote Work Policy", owner: "Candidate", dueOffset: 2, required: false, conditional: "Remote / hybrid workers" },
      { section: "optional-documents", type: "document", label: "Benefits Enrollment", owner: "Candidate", dueOffset: 0, required: false, conditional: "W-2 / Full-Time only" },
      { section: "optional-documents", type: "document", label: "Expense Policy Acknowledgment", owner: "Candidate", dueOffset: 1, required: false },
      { section: "screening", type: "screening", label: "Drug Screen (5-panel)", owner: "Screening Vendor", dueOffset: 7 },
      { section: "training", type: "training", label: "Anti-Harassment Training", owner: "Candidate", dueOffset: 2 },
      { section: "training", type: "training", label: `${client.name} Client Orientation`, owner: "Candidate", dueOffset: 1 },
      { section: "it-provisioning", type: "provisioning", label: "Laptop Provisioning", owner: "IT", dueOffset: 5 },
      { section: "it-provisioning", type: "provisioning", label: "Email & VPN Setup", owner: "IT", dueOffset: 2 },
      { section: "it-provisioning", type: "provisioning", label: "Client System Credentials", owner: "Client", dueOffset: 1 },
      { section: "it-provisioning", type: "provisioning", label: "Badge Request", owner: "Onboarder", dueOffset: 3, conditional: "Onsite / hybrid workers" },
      { section: "approvals", type: "approval", label: "Account Manager Approval", owner: "Account Manager", dueOffset: 3 },
      { section: "approvals", type: "approval", label: "Legal Review", owner: "Legal", dueOffset: 4, required: false, conditional: "Non-standard terms" },
    ];
    if (!w9 && !NO_INCOME_TAX.has(state))
      optional.push({ section: "tax-payroll", type: "document", label: `${STATE_TAX_FORM[state] ?? `${state} State Withholding`} Form`.replace("Form Form", "Form"), owner: "Candidate", dueOffset: 4, conditional: `Work state = ${state}` });
    if (state === "CA" && !w9) optional.push({ section: "tax-payroll", type: "document", label: "California Wage Notice", owner: "Onboarder", dueOffset: 3, conditional: "W-2 in California" });
    if (["Healthcare", "Pharma"].includes(industry)) {
      optional.push({ section: "training", type: "training", label: "HIPAA Privacy Training", owner: "Candidate", dueOffset: 2 });
      optional.push({ section: "screening", type: "screening", label: "Professional License Verification", owner: "Onboarder", dueOffset: 6, conditional: "Licensed roles only" });
    }
    if (["Finance", "Insurance"].includes(industry)) {
      optional.push({ section: "screening", type: "screening", label: "Credit Check", owner: "Screening Vendor", dueOffset: 7 });
      optional.push({ section: "training", type: "training", label: "SOX Compliance Training", owner: "Candidate", dueOffset: 2 });
    }
    if (["Manufacturing", "Energy", "Logistics"].includes(industry))
      optional.push({ section: "training", type: "training", label: "OSHA Safety Training", owner: "Candidate", dueOffset: 2 });
    if (industry === "Government/Federal")
      optional.push({ section: "screening", type: "screening", label: "Public Trust Investigation", owner: "Screening Vendor", dueOffset: 14 });

    const all = [...items, ...sample(optional, int(0, 6))].slice(0, 14);
    for (const it of all) {
      const required = it.required ?? true;
      let status: string = "INCLUDED";
      if (!required && chance(0.25)) status = "WAIVED";
      else if (["DRAFT", "IN_REVIEW"].includes(pkgStatus) && chance(0.2)) status = "PENDING";
      else if (chance(0.03)) status = "REJECTED";
      itemRows.push({
        ...it, packageId: pkgId, required, conditional: it.conditional ?? null,
        status: status as Prisma.PackageItemCreateManyInput["status"],
        aiRecommended: chance(0.15),
        notes: status === "WAIVED" ? "Waived — not applicable to this assignment." : status === "REJECTED" ? "Rejected in AI review — outdated client version." : null,
      });
    }
    // Rules (§9 step 2 — the AI explains why each item is included)
    const rules: Omit<Prisma.PackageRuleCreateManyInput, "packageId">[] = [
      { condition: `Client = ${client.name}`, applies: true, reason: `${client.name} requires client NDA and client approval before start`, category: "client" },
      { condition: `Employment Type = ${emp}`, applies: true, reason: w9 ? "W-9 and vendor agreement replace W-4 and employment agreement" : "W-4, I-9 and state tax forms mandatory for W-2 workers", category: "employment" },
    ];
    if (!NO_INCOME_TAX.has(state)) rules.push({ condition: `State = ${state}`, applies: !w9, reason: w9 ? "State withholding not applicable to C2C/1099" : `${state} state withholding form required`, category: "state" });
    if (chance(0.6)) rules.push({ condition: "Role has access to client systems", applies: true, reason: "Security awareness training and AUP acknowledgment required", category: "security" });
    if (chance(0.5)) rules.push({ condition: `Industry = ${industry}`, applies: true, reason: `${industry} regulatory training requirements apply`, category: "training" });
    if (chance(0.3)) rules.push({ condition: "Job Category = Licensed professional", applies: chance(0.5), reason: "License verification applies only to licensed roles", category: "job" });
    rules.forEach((r) => pkgRuleRows.push({ ...r, packageId: pkgId }));
  };

  const famCandidates = (clientId: string) =>
    cands.filter((c) => c.client.id === clientId && ["ONBOARDING", "OFFER_ACCEPTED", "PLACED"].includes(c.status));

  const addPackage = (idx: number, client: ClientRef, status: string, version: string, program: string, emp: string, effective: Date, expiration: Date) => {
    const id = `pkg-bk-${pad(idx, 3)}`;
    const [hqCity, st] = client.hq.split(", ");
    const owner = pick(ONBOARDERS);
    const approver = client.accountManager;
    const pool = famCandidates(client.id);
    const cand = ["PUBLISHED", "APPROVED", "IN_REVIEW"].includes(status) && pool.length && chance(0.7) ? pick(pool) : null;
    const name = `${client.name} — ${program} ${emp}`;
    const aiReview = status === "DRAFT" ? pick(["not-run", "not-run", "warnings"]) : status === "IN_REVIEW" ? pick(["warnings", "errors", "approved"]) : "approved";
    pkgRows.push({
      id, name, version, status: status as Prisma.PackageCreateManyInput["status"], clientId: client.id,
      employmentType: emp, workLocation: `${hqCity}, ${st}`, jobCategory: client.industry,
      effectiveDate: effective, expirationDate: expiration, owner, approver,
      riskScore: status === "IN_REVIEW" && aiReview === "errors" ? int(55, 85) : int(5, 55),
      completionPct: cand ? cand.progress : ["DRAFT"].includes(status) ? int(20, 75) : status === "IN_REVIEW" ? int(80, 98) : 100,
      aiReviewStatus: aiReview, consultant: cand ? `${cand.first} ${cand.last}` : null,
      notes: status === "SUPERSEDED" ? "Superseded by newer version — retained for audit." : status === "RETIRED" ? "Program retired by client." : null,
      createdAt: addDays(effective, -int(5, 30)),
    });
    pkgRefs.push({ id, name, clientId: client.id, status });
    buildItems(id, client, emp, st, status);

    // Approvals (§9 step 6, §25)
    const chain = [
      { approver, role: "Account Manager" },
      { approver: owner, role: "HR Operations Lead" },
      ...(chance(0.35) ? [{ approver: "Legal Review", role: "Legal" }] : []),
      ...(chance(0.25) ? [{ approver: pick(SUPER_ADMINS), role: "Compliance" }] : []),
    ];
    chain.forEach((a, k) => {
      let st2 = "approved";
      if (status === "DRAFT") st2 = k === 0 && chance(0.3) ? "rejected" : "pending";
      else if (status === "IN_REVIEW") st2 = weighted([["approved", 4], ["pending", 5], ["rejected", 1]] as const);
      approvalRows.push({
        packageId: id, approver: a.approver, role: a.role, status: st2,
        approvedAt: st2 === "pending" ? null : past(addDays(effective, -int(1, 5))),
        notes: st2 === "rejected" ? pick(["Returned for changes — state tax form missing.", "Client NDA version is outdated.", "Remove duplicate AUP item."]) : null,
      });
    });
    // Dispatches (§9 step 7–8)
    if (status === "PUBLISHED") {
      const n = int(1, 4);
      for (let k = 0; k < n; k++)
        dispatchRows.push({
          packageId: id, channel: weighted([["email", 5], ["portal", 4], ["sms", 2]] as const),
          sentAt: past(dayAt(-int(0, 30))),
          status: weighted([["delivered", 3], ["opened", 3], ["started", 3], ["completed", 3], ["awaiting-review", 2], ["expired", 1]] as const),
        });
    }
  };

  let pkgIdx = 0;
  famStatuses.forEach((status) => {
    const client = pick(clients);
    const program = pick(client.programs.length ? client.programs : ["General"]);
    const emp = client.industry === "Government/Federal" ? "W-2" : weighted([["W-2", 6], ["C2C", 2], ["1099", 1]] as const);
    const major = int(1, 3);
    if (status === "SUPERSEDED") {
      const oldEff = dayAt(-int(250, 420));
      const newEff = dayAt(-int(20, 200));
      addPackage(++pkgIdx, client, "SUPERSEDED", `${major}.${int(0, 4)}`, program, emp, oldEff, newEff);
      addPackage(++pkgIdx, client, "PUBLISHED", `${major + 1}.0`, program, emp, newEff, addDays(newEff, 365));
    } else if (status === "RETIRED") {
      const eff = dayAt(-int(300, 500));
      addPackage(++pkgIdx, client, status, `${major}.${int(0, 3)}`, program, emp, eff, dayAt(-int(10, 90)));
    } else if (["DRAFT", "IN_REVIEW"].includes(status)) {
      const eff = dayAt(int(7, 45));
      addPackage(++pkgIdx, client, status, `${major}.${int(1, 5)}`, program, emp, eff, addDays(eff, 365));
    } else {
      const eff = dayAt(-int(10, 300));
      // a few expiring within 30 days to drive renewal warnings
      const exp = chance(0.15) ? dayAt(int(5, 30)) : addDays(eff, 365 + int(0, 180));
      addPackage(++pkgIdx, client, status, `${major}.${int(0, 4)}`, program, emp, eff, exp);
    }
  });
  await prisma.package.createMany({ data: pkgRows });
  await chunked(itemRows, (d) => prisma.packageItem.createMany({ data: d }));
  await prisma.packageRule.createMany({ data: pkgRuleRows });
  await prisma.packageApproval.createMany({ data: approvalRows });
  await prisma.packageDispatch.createMany({ data: dispatchRows });

  // ───────────────────────────────────────────────────────
  // DOCUMENTS  §20 §23
  // ───────────────────────────────────────────────────────
  console.log("    · Documents");
  const docRows: Prisma.DocumentCreateManyInput[] = [];
  const docRefs: { id: string; candId: string; name: string; status: string; at: Date; reviewer: string | null }[] = [];
  const FLAG_REASON: Record<string, string> = {
    "blurry-image": "Image is too blurry to read — please retake in good lighting.",
    "glare-detected": "Glare obscures key fields — please retake without flash.",
    "missing-signature": "Signature is missing on page 2 — please sign and resubmit.",
    "name-mismatch": "Legal name does not match the name on your government ID.",
    "expired-document": "Document is expired — please upload a current version.",
    "cropped-edges": "Document edges are cut off — all four corners must be visible.",
    "wrong-form-version": "Outdated form version uploaded — please use the current revision.",
    "date-mismatch": "Date of birth does not match other submitted documents.",
    "address-mismatch": "Address differs from the address on file — please confirm.",
  };
  let docIdx = 0;
  for (const c of cands) {
    if (c.status === "NEW") continue;
    const w9 = c.empType === "C2C" || c.empType === "INDEPENDENT_1099";
    const catalog: [string, string, boolean][] = [
      ["I-9 Form", "authorization", false],
      [chance(0.6) ? "Government-issued ID (Driver's License)" : "Passport (US)", "identity", true],
      [w9 ? `Federal W-9${c.vendor ? ` (${c.vendor})` : ""}` : "Federal W-4", "tax", false],
      [`${c.client.name} NDA`, "client", false],
      ["Offer Letter", "agreement", false],
    ];
    if (!w9) catalog.push(["Direct Deposit Authorization", "payroll", false]);
    if (!w9 && !NO_INCOME_TAX.has(c.state)) catalog.push([STATE_TAX_FORM[c.state] ?? `${c.state} State Tax Form`, "tax", false]);
    if (chance(0.4)) catalog.push(["Social Security Card", "identity", false]);
    if (chance(0.12)) catalog.push(["Employment Authorization Document (EAD)", "authorization", true]);
    if (["Nursing & Clinical", "Health IT", "Clinical Research"].includes(c.family)) catalog.push(["Professional License", "certification", true]);
    else if (chance(0.3)) catalog.push([`${pick(FAMILIES[c.family].skills)} Certification`, "certification", true]);
    if (chance(0.3)) catalog.push(["Acceptable Use Policy", "client", false]);

    const docs = catalog.slice(0, int(4, 8));
    const done = c.progress >= 100;
    for (const [name, category, expires] of docs) {
      const id = `doc-bk-${pad(++docIdx, 5)}`;
      let status: string;
      if (done) status = expires && chance(0.06) ? "EXPIRED" : "APPROVED";
      else if (rnd() < c.progress / 100 + 0.1) status = "APPROVED";
      else status = weighted([["PENDING", 4], ["SUBMITTED", 3], ["AI_REVIEW", 2], ["REJECTED", 1.4], ["CORRECTION_REQUIRED", 1.2]] as const);
      const uploaded = status === "PENDING" ? null : past(between(addDays(c.createdAt, 1), maxDate(addDays(c.createdAt, 2), done ? c.startDate! : NOW)));
      const reviewed = ["APPROVED", "REJECTED", "CORRECTION_REQUIRED", "EXPIRED"].includes(status) && uploaded ? past(addMs(uploaded, int(1, 48) * HOUR)) : null;
      const flags = ["REJECTED", "CORRECTION_REQUIRED"].includes(status) ? sample(Object.keys(FLAG_REASON), int(1, 2)) : status === "AI_REVIEW" && chance(0.4) ? [pick(Object.keys(FLAG_REASON))] : [];
      const aiScore = status === "PENDING" ? null
        : status === "APPROVED" ? int(88, 100)
        : status === "AI_REVIEW" ? int(70, 92)
        : status === "REJECTED" ? int(35, 70)
        : status === "CORRECTION_REQUIRED" ? int(50, 78)
        : status === "EXPIRED" ? int(85, 98) : chance(0.5) ? int(75, 95) : null;
      let expiresAt: Date | null = null;
      if (expires) {
        expiresAt = status === "EXPIRED" ? dayAt(-int(1, 40)) : chance(0.22) ? dayAt(int(7, 120)) : dayAt(int(121, 1500));
        if (name.startsWith("Employment Authorization")) expiresAt = dayAt(int(20, 300));
      }
      const isImg = category === "identity";
      docRows.push({
        id, candidateId: c.id, name, category, status: status as Prisma.DocumentCreateManyInput["status"],
        fileUrl: uploaded ? `/uploads/${c.id}/${slug(name)}.${isImg ? "jpg" : "pdf"}` : null,
        fileSize: uploaded ? int(80_000, 4_200_000) : null,
        mimeType: uploaded ? (isImg ? "image/jpeg" : "application/pdf") : null,
        aiScore, aiFlags: flags,
        rejectedReason: flags.length && status !== "AI_REVIEW" ? flags.map((f) => FLAG_REASON[f]).join(" ") : null,
        expiresAt, reviewedBy: reviewed ? c.onboarder : null, reviewedAt: reviewed, uploadedAt: uploaded,
        createdAt: uploaded ?? c.createdAt,
      });
      docRefs.push({ id, candId: c.id, name, status, at: reviewed ?? uploaded ?? c.createdAt, reviewer: reviewed ? c.onboarder : null });
    }
  }
  await chunked(docRows, (d) => prisma.document.createMany({ data: d }));

  // ───────────────────────────────────────────────────────
  // SCREENINGS  §22 §58
  // ───────────────────────────────────────────────────────
  console.log("    · Screenings");
  const scrRows: Prisma.ScreeningCreateManyInput[] = [];
  for (const c of cands) {
    if (c.status === "NEW" || c.stageIdx < 1) continue;
    const kinds: ("bg" | "drug")[] = ["bg"];
    if (chance(0.6)) kinds.push("drug");
    for (const kind of kinds) {
      const vendor = kind === "bg" ? pick(["HireRight", "Sterling", "First Advantage", "Checkr", "Accurate"]) : "Quest Diagnostics";
      const packageType = kind === "bg"
        ? pick(c.client.industry === "Finance" ? ["Enhanced 7-Year + Credit", "Criminal + Employment (7-year)"] : c.client.industry === "Government/Federal" ? ["Public Trust (Tier 1)", "Criminal + Education + Employment"] : ["Standard Criminal", "Criminal + Employment (7-year)", "Criminal + Education + Employment"])
        : pick(["5-Panel Drug Screen", "10-Panel Drug Screen", "DOT Drug & Alcohol"]);
      let status: string;
      if (c.progress >= 100) status = chance(0.95) ? "CLEAR" : "REVIEW_REQUIRED";
      else if (c.status === "WITHDRAWN") status = pick(["INVITED", "CONSENTED", "IN_PROGRESS", "INFO_REQUIRED", "ADVERSE_PENDING"]);
      else if (c.status === "ON_HOLD") status = pick(["INFO_REQUIRED", "VENDOR_DELAYED", "IN_PROGRESS"]);
      else if (c.stageIdx >= 3) status = weighted([["CLEAR", 12], ["REVIEW_REQUIRED", 1.5], ["ADVERSE_PENDING", 0.5], ["VENDOR_DELAYED", 1]] as const);
      else if (c.stageIdx === 2) status = weighted([["CONSENTED", 2], ["IN_PROGRESS", 5], ["INFO_REQUIRED", 2], ["VENDOR_DELAYED", 2]] as const);
      else status = weighted([["ORDERED", 3], ["INVITED", 3], ["CONSENTED", 2]] as const);
      const ordered = past(addDays(c.createdAt, int(1, 4)));
      const consented = ["ORDERED", "INVITED"].includes(status) ? null : past(addMs(ordered, int(2, 60) * HOUR));
      let estimated = addDays(ordered, kind === "bg" ? int(5, 10) : int(2, 5));
      if (status === "VENDOR_DELAYED") estimated = minDate(estimated, dayAt(-int(1, 6)));
      const completed = ["CLEAR", "REVIEW_REQUIRED", "ADVERSE_PENDING"].includes(status)
        ? past(addDays(ordered, int(2, 12))) : null;
      scrRows.push({
        candidateId: c.id, vendor, packageType, status: status as Prisma.ScreeningCreateManyInput["status"],
        orderedAt: ordered, consentedAt: consented, completedAt: completed, estimatedCompletion: estimated,
        cost: Math.round((kind === "bg" ? float(65, 180) : float(35, 75)) * 100) / 100,
        adjudicator: ["REVIEW_REQUIRED", "ADVERSE_PENDING"].includes(status) ? pick(SUPER_ADMINS) : null,
        notes: status === "VENDOR_DELAYED" ? pick(["County court records delay — Cook County, IL.", "Vendor backlog; jurisdiction search pending.", "Prior-employer verification unresponsive."])
          : status === "INFO_REQUIRED" ? pick(["Vendor requested prior address history.", "Candidate must confirm maiden name for records search."])
          : status === "REVIEW_REQUIRED" ? "Record found — individualized assessment required."
          : status === "ADVERSE_PENDING" ? "Pre-adverse notice sent; candidate response period open."
          : null,
        createdAt: ordered,
      });
    }
  }
  await chunked(scrRows, (d) => prisma.screening.createMany({ data: d }));

  // ───────────────────────────────────────────────────────
  // EQUIPMENT & IT  §17 §61
  // ───────────────────────────────────────────────────────
  console.log("    · Equipment");
  const eqRows: Prisma.EquipmentCreateManyInput[] = [];
  const EQUIP: Record<string, string[]> = {
    Laptop: ['MacBook Pro 14" M3', "Dell Latitude 7450", "Lenovo ThinkPad X1 Carbon Gen 12", "HP EliteBook 840 G11"],
    Monitor: ['Dell 27" P2723D Monitor', 'LG 27" UltraFine 4K'],
    Headset: ["Jabra Evolve2 65", "Poly Voyager Focus 2"],
    Phone: ["iPhone 15", "Samsung Galaxy S24"],
    "Security Token": ["YubiKey 5 NFC", "RSA SecurID Token"],
    Badge: ["Client Access Badge"],
  };
  const tracking = (carrier: string) =>
    carrier === "FedEx" ? digits(12) : carrier === "UPS" ? `1Z${alnum(16)}` : carrier === "USPS" ? `9400${digits(18)}` : digits(10);
  for (const c of cands) {
    if (!["ONBOARDING", "PLACED", "ARCHIVED"].includes(c.status)) continue;
    const types = ["Laptop", ...sample(["Monitor", "Headset", "Phone", "Security Token", "Badge"], int(0, 3))];
    const start = c.startDate!;
    for (const t of types) {
      let status: string;
      if (c.status === "ARCHIVED") status = weighted([["RETURNED", 6], ["RETURN_REQUIRED", 2], ["LOST", 1], ["DAMAGED", 1]] as const);
      else if (c.status === "PLACED") status = weighted([["READY", 10], ["ENROLLED", 4], ["DELIVERED", 3], ["RETURN_REQUIRED", 0.4], ["DAMAGED", 0.3]] as const);
      else if (c.stageIdx < 4) status = daysUntil(start) < 5 ? weighted([["DELAYED", 2], ["APPROVED", 2], ["REQUESTED", 1]] as const) : weighted([["REQUESTED", 3], ["APPROVED", 3]] as const);
      else if (c.stageIdx <= 5) status = weighted([["ASSIGNED", 3], ["SHIPPED", 4], ["DELAYED", 1.5]] as const);
      else status = weighted([["SHIPPED", 2], ["DELIVERED", 3], ["ENROLLED", 2], ["READY", 3]] as const);
      if (t === "Badge" && ["SHIPPED", "DELIVERED", "ENROLLED"].includes(status)) status = c.status === "PLACED" ? "READY" : "ASSIGNED";
      const shipStates = ["SHIPPED", "DELIVERED", "ENROLLED", "READY", "RETURN_REQUIRED", "RETURNED", "LOST", "DAMAGED"];
      const shipped = t !== "Badge" && (shipStates.includes(status) || (status === "DELAYED" && chance(0.5)));
      const carrier = shipped ? weighted([["FedEx", 5], ["UPS", 4], ["USPS", 1], ["DHL", 1]] as const) : null;
      const shippedAt = shipped ? past(addDays(start, -int(3, 9))) : null;
      let est = shippedAt ? addDays(shippedAt, int(2, 4)) : null;
      if (status === "DELAYED") est = addDays(start, int(1, 5));
      const delivered = ["DELIVERED", "ENROLLED", "READY", "RETURN_REQUIRED", "RETURNED", "LOST", "DAMAGED"].includes(status) && shippedAt
        ? past(addDays(shippedAt, int(1, 4))) : null;
      const placedish = c.status !== "ONBOARDING";
      eqRows.push({
        candidateId: c.id, assetType: t, label: pick(EQUIP[t]),
        status: status as Prisma.EquipmentCreateManyInput["status"],
        serialNumber: ["REQUESTED", "APPROVED"].includes(status) ? null : `${t === "Laptop" ? "C02" : t === "Phone" ? "F2L" : "SN"}${alnum(9)}`,
        trackingNumber: carrier ? tracking(carrier) : null, carrier, shippedAt, estimatedDelivery: est, deliveredAt: delivered,
        returnRequired: ["RETURN_REQUIRED", "RETURNED", "LOST", "DAMAGED"].includes(status) || (c.status === "ARCHIVED"),
        returnedAt: status === "RETURNED" ? past(addDays(start, int(30, 120))) : null,
        emailProvisioned: placedish || c.stageIdx >= 5,
        vpnProvisioned: placedish || c.stageIdx >= 6,
        clientCredentials: placedish || (c.stageIdx >= 6 && chance(0.7)),
        deviceEnrolled: ["ENROLLED", "READY"].includes(status) || (placedish && t === "Laptop" && status !== "LOST"),
        notes: status === "DELAYED" ? pick(["Carrier exception — weather delay.", "Backordered at depot; ETA after start date.", "Address verification failed — awaiting candidate confirmation."])
          : status === "LOST" ? "Carrier reports package lost; replacement + recovery claim filed."
          : status === "DAMAGED" ? "Screen damaged on return — repair quote requested." : null,
        createdAt: addDays(c.createdAt, int(1, 5)),
      });
    }
  }
  await chunked(eqRows, (d) => prisma.equipment.createMany({ data: d }));

  // ───────────────────────────────────────────────────────
  // PAYROLL + BILLING READINESS  §16
  // ───────────────────────────────────────────────────────
  console.log("    · Payroll & billing readiness");
  const payRows: Prisma.PayrollReadinessCreateManyInput[] = [];
  const billRows: Prisma.BillingReadinessCreateManyInput[] = [];
  const PAY_CHECKS = ["classification", "payRate", "startDateSet", "payrollEntity", "taxJurisdiction", "overtimeRules", "i9", "w4", "stateTax", "directDeposit", "benefitsEligibility"] as const;
  const BILL_CHECKS = ["billRate", "markup", "approvedStartDate", "billingEntity", "invoiceFrequency", "costCenter", "expensePolicy", "timesheetMethod", "purchaseOrder", "clientWorkerId", "vmsId"] as const;
  const readiness = <K extends string>(keys: readonly K[], c: CandRef) => {
    const out = {} as Record<K, boolean>;
    keys.forEach((k, idx) => {
      // earlier checks are set up first; later ones depend on candidate action
      const p = c.progress >= 100 ? 1 : Math.min(0.98, c.progress / 100 + 0.35 - idx * 0.04);
      out[k] = rnd() < p;
    });
    const n = keys.filter((k) => out[k]).length;
    const status = n === keys.length ? "READY" : n >= keys.length - 3 ? "PENDING" : "NOT_READY";
    return { out, status };
  };
  for (const c of cands) {
    if (!["ONBOARDING", "ON_HOLD", "PLACED", "ARCHIVED"].includes(c.status)) continue;
    const p = readiness(PAY_CHECKS, c);
    payRows.push({ candidateId: c.id, status: p.status as Prisma.PayrollReadinessCreateManyInput["status"], ...p.out });
    const b = readiness(BILL_CHECKS, c);
    billRows.push({
      candidateId: c.id, status: b.status as Prisma.BillingReadinessCreateManyInput["status"], ...b.out,
      poNumber: b.out.purchaseOrder ? `PO-${new Date().getFullYear()}-${digits(5)}` : null,
      clientWorkerId2: b.out.clientWorkerId ? `${c.client.prefix}${digits(6)}` : null,
      vmsWorkerId: b.out.vmsId && c.client.msp ? `${c.client.msp.replace(/[^A-Z]/g, "")}-${digits(7)}` : null,
    });
  }
  await chunked(payRows, (d) => prisma.payrollReadiness.createMany({ data: d }));
  await chunked(billRows, (d) => prisma.billingReadiness.createMany({ data: d }));

  // ───────────────────────────────────────────────────────
  // TRAINING  §37 §62
  // ───────────────────────────────────────────────────────
  console.log("    · Training");
  const trRows: Prisma.TrainingCreateManyInput[] = [];
  for (const c of cands) {
    if (c.status === "NEW") continue;
    const meta = INDUSTRIES[c.client.industry] ?? INDUSTRIES.Technology;
    const pool: [string, string][] = [
      ["Security Awareness Training", "security"], ["Anti-Harassment Training", "compliance"],
      ["Privacy & Data Protection", "privacy"], ["Timekeeping & Expense Submission", "systems"],
      [`${c.client.name} Client Orientation`, "client"], ...meta.extraTraining,
    ];
    const courses = [pool[0], ...sample(pool.slice(1), int(1, 4))];
    for (const [title, category] of courses) {
      const due = addDays(c.startDate ?? addDays(c.createdAt, 30), int(-2, 7));
      let status: string;
      if (c.progress >= 100) status = weighted([["COMPLETED", 18], ["EXPIRING", 1.5], ["WAIVED", 0.7]] as const);
      else if (c.stageIdx >= 6) status = weighted([["COMPLETED", 6], ["STARTED", 3], ["FAILED", 0.5]] as const);
      else status = weighted([["ASSIGNED", 5], ["STARTED", 3], ["COMPLETED", 1.5], ["FAILED", 0.3]] as const);
      if (["ASSIGNED", "STARTED"].includes(status) && due < NOW) status = "OVERDUE";
      const completedAt = ["COMPLETED", "EXPIRING"].includes(status) ? past(between(addDays(c.createdAt, 2), minDate(due, NOW))) : status === "FAILED" ? past(addDays(c.createdAt, int(3, 12))) : null;
      trRows.push({
        candidateId: c.id, title, category, status: status as Prisma.TrainingCreateManyInput["status"],
        score: ["COMPLETED", "EXPIRING"].includes(status) ? int(72, 100) : status === "FAILED" ? int(40, 69) : null,
        dueDate: due, completedAt, required: category !== "systems" || chance(0.5),
        waivedBy: status === "WAIVED" ? pick([...ONBOARDERS, ...SUPER_ADMINS]) : null,
        createdAt: addDays(c.createdAt, int(0, 3)),
      });
    }
  }
  await chunked(trRows, (d) => prisma.training.createMany({ data: d }));

  // ───────────────────────────────────────────────────────
  // COMMUNICATIONS  §13 §24 §63
  // ───────────────────────────────────────────────────────
  console.log("    · Communications");
  const commRows: Prisma.CommunicationCreateManyInput[] = [];
  const commPool = cands.filter((c) => !(["WITHDRAWN", "ARCHIVED"].includes(c.status) && c.createdAt < dayAt(-120)));
  const commWeight = (c: CandRef) => (["ONBOARDING", "OFFER_ACCEPTED"].includes(c.status) ? 4 : c.status === "ON_HOLD" ? 2 : 1);
  const weightedPool = commPool.flatMap((c) => Array(commWeight(c)).fill(c) as CandRef[]);
  // §13 Gentle Nudge Protocol channel ladder
  const NUDGE_CHANNEL = ["PORTAL", "EMAIL", "SMS", "EMAIL", "INTERNAL", "VOICE", "INTERNAL", "INTERNAL"] as const;
  const outboundStatus = (ch: string) =>
    ch === "EMAIL" ? weighted([["delivered", 30], ["opened", 35], ["replied", 12], ["bounced", 4], ["failed", 2], ["sent", 10]] as const)
    : ch === "SMS" ? weighted([["delivered", 55], ["replied", 20], ["failed", 6], ["sent", 15]] as const)
    : ch === "PORTAL" ? weighted([["delivered", 30], ["opened", 50], ["replied", 15]] as const)
    : ch === "VOICE" ? weighted([["delivered", 6], ["failed", 3], ["replied", 2]] as const)
    : weighted([["delivered", 5], ["opened", 5]] as const);

  for (let i = 0; i < 1500; i++) {
    const c = pick(weightedPool);
    const windowStart = maxDate(c.createdAt, dayAt(-90));
    const windowEnd = c.status === "PLACED" || c.status === "ARCHIVED" || c.status === "WITHDRAWN"
      ? minDate(NOW, addDays(c.startDate ?? NOW, 14)) : NOW;
    const sentAt = past(between(windowStart, maxDate(windowStart, windowEnd)));
    const staff = chance(0.5) ? c.recruiter : c.onboarder;
    const kind = weighted([["nudge", 30], ["package", 8], ["docReject", 8], ["screening", 8], ["equipment", 6], ["day1", 6], ["inbound", 18], ["internal", 8], ["welcome", 5], ["milestone", 3]] as const);
    let channel: string = "EMAIL";
    let direction = "outbound";
    let subject: string | null = null;
    let body: string | null = null;
    let nudgeLevel: number | null = null;
    let sentBy = "Automation";
    switch (kind) {
      case "nudge": {
        nudgeLevel = weighted([[0, 6], [1, 6], [2, 5], [3, 4], [4, 3], [5, 2], [6, 1.5], [7, 1]] as const);
        channel = NUDGE_CHANNEL[nudgeLevel];
        const item = pick(["Client NDA", "I-9 Section 1", "Direct Deposit form", "W-4", "background check consent", "Security Awareness Training", "ID upload"]);
        if (nudgeLevel <= 2) {
          subject = channel === "EMAIL" ? `Reminder: ${item} is due` : null;
          body = `Hi ${c.first}, a quick reminder that your ${item} is still outstanding. It only takes a few minutes in the portal.`;
          sentBy = "Automation";
        } else if (nudgeLevel === 3) {
          subject = `${c.first}, we're almost there`;
          body = `Hi ${c.first} — you're ${c.progress}% complete. Finishing your ${item} keeps your start date on track. Reply here if anything is blocking you.`;
          sentBy = "AI Concierge";
        } else if (nudgeLevel === 4) {
          subject = `Recruiter follow-up needed: ${c.first} ${c.last}`;
          body = `${c.first} has not completed ${item} after 4 reminders. Please reach out directly.`;
          sentBy = "Automation";
        } else if (nudgeLevel === 5) {
          subject = "Onboarder call";
          body = `Call to ${c.first} regarding ${item}. ${pick(["Left voicemail.", "Spoke with candidate — will complete tonight.", "No answer."])}`;
          sentBy = c.onboarder;
        } else {
          subject = nudgeLevel === 6 ? `Client promise warning — ${c.client.name}` : `Start date at risk — ${c.first} ${c.last}`;
          body = `${item} still outstanding for ${c.first} ${c.last}; start date ${c.startDate ? shortDate(c.startDate) : "TBD"} at risk.`;
          sentBy = "Automation";
        }
        break;
      }
      case "package":
        channel = pick(["EMAIL", "PORTAL", "SMS"]);
        subject = channel === "SMS" ? null : `Your ${c.client.name} onboarding package is ready`;
        body = `Welcome aboard, ${c.first}! Your onboarding package for ${c.client.name} is ready in the portal.`;
        nudgeLevel = 0;
        sentBy = pick(["Automation", c.onboarder]);
        break;
      case "docReject":
        channel = pick(["EMAIL", "PORTAL"]);
        subject = "Action needed: document correction";
        body = `Hi ${c.first}, one of your documents needs a correction. Open the portal to see what to fix.`;
        sentBy = pick([c.onboarder, "AI Concierge"]);
        break;
      case "screening":
        channel = pick(["SMS", "EMAIL"]);
        subject = channel === "EMAIL" ? "Background check update" : null;
        body = `Hi ${c.first}, your background check is in progress. We'll let you know as soon as it's complete.`;
        break;
      case "equipment":
        channel = pick(["EMAIL", "SMS"]);
        subject = channel === "EMAIL" ? "Your equipment has shipped" : null;
        body = `Hi ${c.first}, your laptop has shipped via ${pick(["FedEx", "UPS"])}. Tracking details are in the portal.`;
        break;
      case "day1":
        channel = "EMAIL";
        subject = "Day 1 instructions";
        body = `Hi ${c.first}, here is everything you need for Day 1 at ${c.client.name}: arrival time, manager contact, and login steps.`;
        sentBy = c.onboarder;
        break;
      case "welcome":
        channel = pick(["EMAIL", "PORTAL"]);
        subject = `Welcome to the team, ${c.first}!`;
        body = `Congratulations on accepting your offer with ${c.client.name}. Your recruiter ${c.recruiter} will guide you through next steps.`;
        sentBy = c.recruiter;
        break;
      case "milestone":
        channel = pick(["EMAIL", "SMS"]);
        subject = channel === "EMAIL" ? `Happy Birthday, ${c.first}!` : null;
        body = `Happy Birthday, ${c.first}! We hope you have a wonderful day. Our team is here if you need anything.`;
        sentBy = "AI Concierge";
        break;
      case "internal":
        channel = "INTERNAL";
        subject = "Internal note";
        body = pick([
          `Confirmed start date with ${c.client.name} hiring manager.`,
          "Candidate asked about benefits eligibility — routed to HR.",
          "Client requested updated resume for VMS submission.",
          "Escalated screening delay to vendor account rep.",
        ]);
        sentBy = staff;
        break;
      default: // inbound
        direction = "inbound";
        channel = weighted([["EMAIL", 4], ["SMS", 4], ["PORTAL", 3]] as const);
        subject = channel === "EMAIL" ? pick(["Re: Reminder", "Question about direct deposit", "Re: Day 1 instructions", "Upload issue"]) : null;
        body = pick([
          "Thanks — I'll finish this tonight.", "Can I use my passport instead of a driver's license?",
          "When will my laptop arrive?", "I uploaded the corrected form, please check.",
          "Is parking provided on Day 1?", "Do I need to complete the drug test before my start date?",
          "I'm having trouble signing the NDA on my phone.",
        ]);
        sentBy = `${c.first} ${c.last}`;
    }
    const status = direction === "inbound" ? "delivered" : outboundStatus(channel);
    const scheduled = direction === "outbound" && kind === "nudge" && chance(0.02);
    const sent = scheduled ? dayAt(int(1, 3)) : sentAt;
    const opened = ["opened", "replied"].includes(status) ? addMs(sent, int(2, 600) * MIN) : null;
    const responded = status === "replied" ? addMs(opened ?? sent, int(5, 1440) * MIN) : null;
    commRows.push({
      candidateId: c.id, channel: channel as Prisma.CommunicationCreateManyInput["channel"], direction, subject, body,
      status: scheduled ? "scheduled" : status, nudgeLevel, sentAt: sent,
      openedAt: opened ? past(opened) : null, respondedAt: responded ? past(responded) : null, sentBy,
      createdAt: scheduled ? NOW : sent,
    });
  }
  await chunked(commRows, (d) => prisma.communication.createMany({ data: d }));

  // ───────────────────────────────────────────────────────
  // EXCEPTIONS  §18 §104
  // ───────────────────────────────────────────────────────
  console.log("    · Exceptions");
  const excRows: Prisma.ExceptionCreateManyInput[] = [];
  const excRefs: { id: string; candId: string; title: string; status: string; createdAt: Date; severity: string; owner: string }[] = [];
  const SEV_FOR: Record<string, [string, number][]> = {
    default: [["CRITICAL", 1], ["HIGH", 3], ["MEDIUM", 4], ["LOW", 2]],
    "Work Authorization Issue": [["CRITICAL", 4], ["HIGH", 3]],
    "Identity Mismatch": [["CRITICAL", 2], ["HIGH", 3], ["MEDIUM", 1]],
    "Integration Failure": [["CRITICAL", 1], ["HIGH", 3], ["MEDIUM", 2]],
    "Training Overdue": [["MEDIUM", 3], ["LOW", 3]],
    "Candidate Unresponsive": [["HIGH", 2], ["MEDIUM", 3], ["LOW", 1]],
  };
  const SLA_DAYS: Record<string, number> = { CRITICAL: 1, HIGH: 2, MEDIUM: 4, LOW: 7 };
  const RESOLVERS: Record<string, string> = {
    "Invalid Bank Information": "Payroll Operations", "Invalid Tax Information": "Payroll Operations", "Payroll Issue": "Payroll Operations",
    "Billing Issue": "Billing Operations", "Equipment Delay": "IT Service Desk", "Integration Failure": "Integration Team",
    "Background Check Delay": "Screening Desk", "Drug Screen Delay": "Screening Desk", "Client Approval Delay": "Account Management",
  };
  const excPool = cands.filter((c) => c.status !== "NEW" && c.status !== "ARCHIVED");
  for (let i = 0; i < 120; i++) {
    const id = `exc-bk-${pad(i + 1, 4)}`;
    const c = pick(excPool.filter((x) => (i % 3 === 0 ? true : ["ONBOARDING", "ON_HOLD", "OFFER_ACCEPTED"].includes(x.status))));
    const category = pick(EXCEPTION_CATEGORIES);
    const severity = weighted((SEV_FOR[category] ?? SEV_FOR.default) as [string, number][]);
    const status = weighted([["OPEN", 30], ["IN_PROGRESS", 25], ["RESOLVED", 25], ["CLOSED", 12], ["REOPENED", 8]] as const);
    const open = ["OPEN", "IN_PROGRESS", "REOPENED"].includes(status);
    const earliest = maxDate(c.createdAt, dayAt(-90));
    const createdAt = past(between(open ? maxDate(earliest, dayAt(-30)) : earliest, NOW));
    const deadline = addMs(createdAt, SLA_DAYS[severity] * DAY);
    const resolvedAt = open ? null : past(addMs(createdAt, float(0.2, 1.5) * SLA_DAYS[severity] * DAY));
    const who = `${c.first} ${c.last}`;
    const titleMap: Record<string, string> = {
      "Missing Document": `${pick(["Client NDA", "I-9", "W-4", "Direct deposit form"])} not submitted — ${who}`,
      "Rejected Document": `${pick(["Driver's license", "W-4", "NDA"])} rejected twice — ${who}`,
      "Identity Mismatch": `Legal name mismatch between ID and I-9 — ${who}`,
      "Expired ID": `Government ID expired — ${who}`,
      "Background Check Delay": `Background check past SLA (${pick(["HireRight", "Sterling", "First Advantage"])}) — ${who}`,
      "Drug Screen Delay": `Drug screen appointment missed — ${who}`,
      "Client Approval Delay": `${c.client.name} approval pending > 3 days — ${who}`,
      "Duplicate Profile": `Possible duplicate candidate profile — ${who}`,
      "Invalid Bank Information": `Routing number failed validation — ${who}`,
      "Invalid Tax Information": `W-4 withholding data invalid — ${who}`,
      "E-Signature Failure": `DocuSign envelope failed to complete — ${who}`,
      "Integration Failure": `${pick(["ADP", "SAP Fieldglass", "Beeline", "Workday"])} sync failed for worker record — ${who}`,
      "Equipment Delay": `Laptop will not arrive before start date — ${who}`,
      "Start-Date Change": `Client moved start date — ${who}`,
      "Work Authorization Issue": `Work authorization requires reverification — ${who}`,
      "Payroll Issue": `Payroll entity not assigned — ${who}`,
      "Billing Issue": `Missing PO / cost center — ${who}`,
      "Candidate Unresponsive": `No response in 72 hours — ${who}`,
      "Training Overdue": `Required training overdue — ${who}`,
    };
    const startSoon = c.startDate ? daysUntil(c.startDate) <= 14 && daysUntil(c.startDate) >= -2 : false;
    const clientVisible = chance(0.3);
    excRows.push({
      id, candidateId: c.id, category, severity: severity as Prisma.ExceptionCreateManyInput["severity"],
      status: status as Prisma.ExceptionCreateManyInput["status"], title: titleMap[category],
      description: `${category} detected for ${who} (${c.client.name}). ${severity === "CRITICAL" || severity === "HIGH" ? "Blocks downstream readiness." : "Monitor and resolve within SLA."}`,
      owner: c.onboarder, resolver: open ? (chance(0.6) ? RESOLVERS[category] ?? c.onboarder : null) : RESOLVERS[category] ?? c.onboarder,
      resolutionDeadline: deadline, resolvedAt,
      startDateImpact: (severity === "CRITICAL" || severity === "HIGH") && (startSoon || chance(0.4)),
      clientVisible, clientNote: clientVisible ? pick(["We are actively resolving this item and will update by end of day.", "Start date may shift by 1–2 days; we will confirm.", "Resolved — no impact to start date."]) : null,
      internalNote: chance(0.6) ? pick(["Vendor ticket opened.", "Candidate contacted via SMS and email.", "Waiting on client HR.", "Root cause: outdated client form version.", "Retried integration — still failing with 422."]) : null,
      createdAt,
    });
    excRefs.push({ id, candId: c.id, title: titleMap[category], status, createdAt, severity, owner: c.onboarder });
  }
  await prisma.exception.createMany({ data: excRows });

  // ───────────────────────────────────────────────────────
  // INTEGRATIONS + EVENTS  §29 §65 §84
  // ───────────────────────────────────────────────────────
  console.log("    · Integrations & events");
  type IntDef = {
    name: string; vendor: string; category: string; status: string; authType: string; criticality: string;
    dir: string; freq: string; data: string[]; events: string[]; latency: [number, number]; weight: number;
    env?: string; authDays: number; desc: string; site: string; owner: string;
  };
  const INTS: IntDef[] = [
    { name: "JobDiva ATS", vendor: "JobDiva", category: "ATS", status: "CONNECTED", authType: "api-key", criticality: "critical", dir: "inbound", freq: "real-time", data: ["Candidate", "Offer", "Placement", "Recruiter"], events: ["offer.accepted", "candidate.updated", "placement.created"], latency: [180, 600], weight: 10, authDays: 210, desc: "Offer-accepted placements create candidates and trigger package generation.", site: "https://www.jobdiva.com", owner: "Talent Systems" },
    { name: "Bullhorn ATS", vendor: "Bullhorn", category: "ATS", status: "CONNECTED", authType: "oauth2", criticality: "high", dir: "bidirectional", freq: "5min", data: ["Candidate", "Placement", "Notes", "Attachments"], events: ["placement.sync", "candidate.sync", "note.created"], latency: [220, 900], weight: 8, authDays: 75, desc: "Secondary ATS for the healthcare division.", site: "https://www.bullhorn.com", owner: "Talent Systems" },
    { name: "SAP Fieldglass VMS", vendor: "SAP", category: "VMS", status: "CONNECTED", authType: "oauth2", criticality: "critical", dir: "bidirectional", freq: "hourly", data: ["Work Order", "Worker ID", "Bill Rate", "Timesheet Config"], events: ["workorder.received", "worker.updated", "worker.id.assigned"], latency: [400, 1600], weight: 7, authDays: 160, desc: "Work orders, worker IDs and readiness status for Fieldglass programs.", site: "https://www.fieldglass.com", owner: "Client Systems" },
    { name: "Beeline VMS", vendor: "Beeline", category: "VMS", status: "DEGRADED", authType: "oauth2", criticality: "high", dir: "bidirectional", freq: "hourly", data: ["Requisition", "Worker", "Start Date", "PO"], events: ["worker.onboarded", "startdate.changed", "requisition.sync"], latency: [600, 3200], weight: 6, authDays: 6, desc: "Beeline programs — elevated latency since vendor API upgrade.", site: "https://www.beeline.com", owner: "Client Systems" },
    { name: "Magnit VMS", vendor: "Magnit", category: "VMS", status: "DISCONNECTED", authType: "api-key", criticality: "medium", dir: "bidirectional", freq: "daily", data: ["Worker", "Assignment"], events: ["worker.sync"], latency: [500, 1500], weight: 0.4, env: "sandbox", authDays: 40, desc: "Sandbox connector pending production validation checklist (§85).", site: "https://magnitglobal.com", owner: "Client Systems" },
    { name: "Workday HCM", vendor: "Workday", category: "HRIS", status: "CONNECTED", authType: "oauth2", criticality: "critical", dir: "outbound", freq: "hourly", data: ["Worker Profile", "Legal Entity", "Manager", "Location"], events: ["worker.hire", "worker.update", "org.sync"], latency: [350, 1200], weight: 6, authDays: 300, desc: "Hire and worker-profile sync for W-2 and full-time workers.", site: "https://www.workday.com", owner: "HR Technology" },
    { name: "ADP Workforce Now", vendor: "ADP", category: "PAYROLL", status: "CONNECTED", authType: "mtls", criticality: "critical", dir: "bidirectional", freq: "hourly", data: ["Worker Setup", "Pay Rate", "Tax Jurisdiction", "Direct Deposit"], events: ["payroll.worker.created", "payrate.sent", "directdeposit.validated"], latency: [300, 1100], weight: 7, authDays: 12, desc: "Creates payroll workers once Payroll Ready gate passes (§92).", site: "https://www.adp.com", owner: "Payroll Operations" },
    { name: "HireRight Screening", vendor: "HireRight", category: "SCREENING", status: "CONNECTED", authType: "api-key", criticality: "high", dir: "bidirectional", freq: "real-time", data: ["Screening Order", "Status", "Adjudication"], events: ["order.created", "status.updated", "report.completed"], latency: [250, 900], weight: 6, authDays: 190, desc: "Background screening orders and status webhooks.", site: "https://www.hireright.com", owner: "Compliance" },
    { name: "Sterling Screening", vendor: "Sterling", category: "SCREENING", status: "ERROR", authType: "oauth2", criticality: "high", dir: "bidirectional", freq: "real-time", data: ["Screening Order", "Status"], events: ["order.created", "status.updated", "report.completed"], latency: [300, 2500], weight: 5, authDays: -1, desc: "OAuth client credentials expired — status webhooks failing.", site: "https://www.sterlingcheck.com", owner: "Compliance" },
    { name: "Quest Diagnostics", vendor: "Quest Diagnostics", category: "SCREENING", status: "CONNECTED", authType: "api-key", criticality: "medium", dir: "bidirectional", freq: "hourly", data: ["Drug Test Order", "Appointment", "Result Status"], events: ["appointment.scheduled", "result.available", "appointment.missed"], latency: [400, 1300], weight: 3, authDays: 120, desc: "Drug screen ordering and result status.", site: "https://www.questdiagnostics.com", owner: "Compliance" },
    { name: "DocuSign eSignature", vendor: "DocuSign", category: "ESIGN", status: "CONNECTED", authType: "oauth2", criticality: "high", dir: "bidirectional", freq: "real-time", data: ["Envelope", "Signature Status", "Signed Document"], events: ["envelope.sent", "envelope.completed", "envelope.declined"], latency: [200, 700], weight: 8, authDays: 95, desc: "E-signature envelopes for agreements and client forms.", site: "https://www.docusign.com", owner: "HR Technology" },
    { name: "Twilio SMS & Voice", vendor: "Twilio", category: "COMMUNICATION", status: "CONNECTED", authType: "api-key", criticality: "high", dir: "bidirectional", freq: "real-time", data: ["SMS", "Voice", "Delivery Event", "Opt-out"], events: ["sms.sent", "sms.delivered", "sms.inbound", "optout.received"], latency: [80, 350], weight: 10, authDays: 250, desc: "SMS nudges and voice call tasks (§13).", site: "https://www.twilio.com", owner: "Platform Team" },
    { name: "SendGrid Email", vendor: "Twilio SendGrid", category: "COMMUNICATION", status: "CONNECTED", authType: "api-key", criticality: "high", dir: "outbound", freq: "real-time", data: ["Email", "Bounce", "Open", "Click"], events: ["email.sent", "email.delivered", "email.opened", "email.bounced"], latency: [90, 400], weight: 10, authDays: 330, desc: "Transactional and reminder email delivery.", site: "https://sendgrid.com", owner: "Platform Team" },
    { name: "Okta SSO & Provisioning", vendor: "Okta", category: "IDENTITY", status: "CONNECTED", authType: "saml", criticality: "critical", dir: "outbound", freq: "real-time", data: ["User Provisioning", "Group Assignment", "Access Removal"], events: ["user.provisioned", "group.assigned", "user.deactivated"], latency: [150, 500], weight: 5, authDays: 365, desc: "Day 1 account activation and offboarding access removal.", site: "https://www.okta.com", owner: "IT Security" },
    { name: "Microsoft Intune", vendor: "Microsoft", category: "ASSET", status: "CONNECTED", authType: "oauth2", criticality: "medium", dir: "inbound", freq: "hourly", data: ["Device", "Enrollment", "Compliance Status"], events: ["device.enrolled", "device.compliance", "device.retired"], latency: [300, 900], weight: 4, authDays: 140, desc: "Device enrollment and compliance status for Day 1 readiness.", site: "https://www.microsoft.com/intune", owner: "IT Operations" },
    { name: "FedEx Ship Manager", vendor: "FedEx", category: "SHIPPING", status: "CONNECTED", authType: "oauth2", criticality: "medium", dir: "bidirectional", freq: "5min", data: ["Shipment", "Tracking", "Delivery Event", "Return Label"], events: ["shipment.created", "tracking.update", "delivery.confirmed"], latency: [200, 800], weight: 5, authDays: 60, desc: "Equipment shipments and return labels.", site: "https://www.fedex.com", owner: "IT Operations" },
    { name: "Cornerstone Learning", vendor: "Cornerstone OnDemand", category: "LMS", status: "SCHEDULED", authType: "api-key", criticality: "medium", dir: "bidirectional", freq: "daily", data: ["Course Assignment", "Completion", "Score"], events: ["batch.enrollments", "batch.completions"], latency: [2000, 9000], weight: 1, authDays: 180, desc: "Nightly training assignment and completion batch.", site: "https://www.cornerstoneondemand.com", owner: "Learning & Development" },
    { name: "NetSuite ERP", vendor: "Oracle NetSuite", category: "ACCOUNTING", status: "CONNECTED", authType: "oauth2", criticality: "high", dir: "outbound", freq: "hourly", data: ["Client", "Purchase Order", "Bill Rate", "Cost Center"], events: ["po.validated", "billing.setup", "customer.sync"], latency: [500, 1800], weight: 3, authDays: 220, desc: "Billing readiness — PO, cost center and invoice rules.", site: "https://www.netsuite.com", owner: "Finance Systems" },
    { name: "Salesforce CRM", vendor: "Salesforce", category: "CRM", status: "CONNECTED", authType: "oauth2", criticality: "medium", dir: "inbound", freq: "hourly", data: ["Client", "Contact", "Account Owner", "Contract"], events: ["account.sync", "contact.sync", "opportunity.closed"], latency: [300, 1000], weight: 3, authDays: 9, desc: "Client and contact master data from CRM.", site: "https://www.salesforce.com", owner: "Revenue Operations" },
    { name: "Snowflake Data Cloud", vendor: "Snowflake", category: "ANALYTICS", status: "SCHEDULED", authType: "basic", criticality: "low", dir: "outbound", freq: "daily", data: ["Operational Facts", "Audit Events", "Snapshots"], events: ["warehouse.export"], latency: [4000, 15000], weight: 1, authDays: 400, desc: "Nightly export of operational facts to the analytics warehouse.", site: "https://www.snowflake.com", owner: "Data Platform" },
    { name: "Employee Navigator", vendor: "Employee Navigator", category: "BENEFITS", status: "CONNECTED", authType: "api-key", criticality: "low", dir: "outbound", freq: "daily", data: ["Eligibility", "Enrollment Window", "Plan Selection"], events: ["eligibility.sent", "enrollment.completed"], latency: [600, 2000], weight: 1.5, authDays: 85, desc: "Benefits eligibility for W-2 and full-time workers.", site: "https://www.employeenavigator.com", owner: "Benefits Team" },
  ];
  const ERRORS: [string, string][] = [
    ["AUTH_401", "Unauthorized — access token expired or revoked"],
    ["RATE_LIMIT_429", "Rate limit exceeded — retry after backoff"],
    ["VALIDATION_422", "Unprocessable entity — required field missing: workLocation.state"],
    ["TIMEOUT_504", "Gateway timeout from upstream vendor API"],
    ["MAPPING_ERR", "Field mapping failed: employmentType 'Corp-to-Corp' has no enum match"],
    ["DUPLICATE_409", "Conflict — record already exists with same external ID"],
  ];
  const intRows: Prisma.IntegrationCreateManyInput[] = [];
  const evRows: Prisma.IntegrationEventCreateManyInput[] = [];
  const intRefs: { id: string; name: string; status: string }[] = [];
  const totalWeight = INTS.reduce((s, d) => s + d.weight, 0);
  INTS.forEach((d, i) => {
    const id = `int-bk-${pad(i + 1, 3)}`;
    intRefs.push({ id, name: d.name, status: d.status });
    const n = Math.max(3, Math.round((1500 * d.weight) / totalWeight));
    const failP = d.status === "ERROR" ? 0.4 : d.status === "DEGRADED" ? 0.1 : d.status === "DISCONNECTED" ? 0.3 : 0.032;
    const evs: Prisma.IntegrationEventCreateManyInput[] = [];
    for (let k = 0; k < n; k++) {
      let ts: Date;
      if (d.freq === "daily") ts = past(dayAt(-Math.floor((k / n) * 14) - 1, 1, 4));
      else if (d.status === "DISCONNECTED") ts = dayAt(-int(8, 14));
      else ts = past(addMs(NOW, -rnd() * 14 * DAY));
      // ERROR connector failures cluster in the last 36 hours
      const recentWindow = NOW.getTime() - ts.getTime() < 36 * HOUR;
      const p = d.status === "ERROR" ? (recentWindow ? 0.85 : 0.02) : failP;
      const failed = rnd() < p;
      const partial = !failed && chance(0.015);
      const err = failed ? (d.status === "ERROR" ? ERRORS[0] : d.status === "DEGRADED" ? pick([ERRORS[1], ERRORS[3], ERRORS[3]]) : pick(ERRORS)) : partial ? ERRORS[2] : null;
      const [lo, hi] = d.latency;
      evs.push({
        integrationId: id, timestamp: ts, direction: d.dir === "bidirectional" ? pick(["inbound", "outbound"]) : d.dir,
        eventType: pick(d.events),
        recordCount: d.freq === "daily" ? int(150, 2400) : weighted([[1, 8], [int(2, 25), 3], [int(26, 300), 1]] as const),
        status: failed ? (chance(0.15) ? "retrying" : "failed") : partial ? "partial" : "success",
        latencyMs: failed && err?.[0] === "TIMEOUT_504" ? int(30000, 60000) : int(lo, hi),
        errorCode: err?.[0] ?? null, errorMessage: err?.[1] ?? null,
        retryCount: failed ? int(1, 5) : partial ? int(0, 2) : 0,
        correlationId: `corr-${hex(8)}-${hex(4)}-${hex(4)}`,
      });
    }
    evRows.push(...evs);
    const sorted = [...evs].sort((a, b) => (b.timestamp as Date).getTime() - (a.timestamp as Date).getTime());
    const lastSync = sorted[0]?.timestamp as Date | undefined;
    const lastSuccess = sorted.find((e) => e.status === "success")?.timestamp as Date | undefined;
    const failedN = evs.filter((e) => e.status === "failed" || e.status === "retrying").length;
    const today = evs.filter((e) => (e.timestamp as Date) >= TODAY);
    intRows.push({
      id, name: d.name, vendor: d.vendor, category: d.category as Prisma.IntegrationCreateManyInput["category"], description: d.desc,
      status: d.status as Prisma.IntegrationCreateManyInput["status"], lastSync: lastSync ?? null, lastSuccess: lastSuccess ?? null,
      failedRecords: failedN, successRate: Math.round(((evs.length - failedN) / evs.length) * 1000) / 10,
      avgLatencyMs: Math.round(evs.reduce((s, e) => s + (e.latencyMs as number), 0) / evs.length),
      queueDepth: d.status === "ERROR" ? int(150, 600) : d.status === "DEGRADED" ? int(40, 140) : int(0, 12),
      authExpires: dayAt(d.authDays), authType: d.authType, owner: d.owner, criticality: d.criticality,
      syncDirection: d.dir, syncFrequency: d.freq, environment: d.env ?? "production", dataExchanged: d.data,
      totalRecordsToday: today.reduce((s, e) => s + (e.recordCount as number), 0),
      totalErrorsToday: today.filter((e) => e.status === "failed" || e.status === "retrying").length,
      uptime30d: d.status === "ERROR" ? 96.2 : d.status === "DEGRADED" ? 98.4 : d.status === "DISCONNECTED" ? 0 : Math.round(float(99.5, 99.99) * 100) / 100,
      website: d.site, createdAt: dayAt(-int(200, 700)),
    });
  });
  await prisma.integration.createMany({ data: intRows });
  await chunked(evRows, (d) => prisma.integrationEvent.createMany({ data: d }));

  // ───────────────────────────────────────────────────────
  // AUDIT EVENTS  §26 §66
  // ───────────────────────────────────────────────────────
  console.log("    · Audit events");
  const audRows: Prisma.AuditEventCreateManyInput[] = [];
  const STAFF_DEVICES = ["Chrome 130 / Windows 11", "Edge 130 / Windows 11", "Safari 18 / macOS 15", "Chrome 130 / macOS 15"];
  const CAND_DEVICES = ["Safari / iOS 18", "Chrome / Android 15", "Chrome 130 / Windows 11"];
  const staffIp = () => `10.${int(10, 40)}.${int(0, 255)}.${int(2, 254)}`;
  const publicIp = () => `${pick([73, 98, 24, 68, 174, 71, 108])}.${int(0, 255)}.${int(0, 255)}.${int(2, 254)}`;
  const auditTs = (from: Date) => {
    const t = past(between(maxDate(from, dayAt(-90)), NOW));
    if (chance(0.08)) t.setHours(pick([21, 22, 23, 0, 1, 2, 4, 5]), int(0, 59)); // after-hours activity
    else if (t.getHours() < 7 || t.getHours() > 19) t.setHours(int(8, 18));
    return past(t);
  };
  const cand90 = cands.filter((c) => c.createdAt > dayAt(-90) || ["ONBOARDING", "OFFER_ACCEPTED", "ON_HOLD", "PLACED"].includes(c.status));
  const pkgById = new Map(pkgRefs.map((p) => [p.id, p]));

  for (let i = 0; i < 2000; i++) {
    const kind = weighted([["candidate", 24], ["document", 22], ["package", 9], ["exception", 10], ["integration", 10], ["client", 5], ["consultant", 8], ["user", 5], ["report", 7]] as const);
    const staff = pick([...RECRUITERS, ...ONBOARDERS, ...ACCOUNT_MANAGERS]);
    let row: Prisma.AuditEventCreateManyInput;
    const base = { ipAddress: staffIp(), device: pick(STAFF_DEVICES), sourceSystem: "hireme", aiInvolved: false, critical: false };
    switch (kind) {
      case "candidate": {
        const c = pick(cand90);
        const action = weighted([["CREATED", 2], ["UPDATED", 8], ["ESCALATED", 1.5], ["AI_ACTION", 3], ["OVERRIDDEN", 0.4]] as const);
        const fields: [string, string, string][] = [
          ["startDate", c.startDate ? ymd(addDays(c.startDate, -int(3, 10))) : "—", c.startDate ? ymd(c.startDate) : "TBD"],
          ["stage", CANDIDATE_STAGES[Math.max(0, c.stageIdx - 1)], CANDIDATE_STAGES[c.stageIdx]],
          ["risk", "ON_TRACK", c.risk], ["phone", "(000) 555-0000", c.phone], ["onboarder", pick(ONBOARDERS), c.onboarder],
        ];
        const [field, prev, next] = pick(fields);
        row = {
          ...base, action, entityType: "Candidate", entityId: c.id, entityLabel: `${c.first} ${c.last}`, candidateId: c.id,
          actor: action === "AI_ACTION" ? "AI Orchestrator" : action === "CREATED" ? (chance(0.6) ? "JobDiva Sync" : c.recruiter) : action === "OVERRIDDEN" ? pick(SUPER_ADMINS) : pick([c.recruiter, c.onboarder]),
          previousValue: action === "UPDATED" || action === "AI_ACTION" || action === "OVERRIDDEN" ? `${field}: ${prev}` : null,
          newValue: action === "CREATED" ? `status: OFFER_ACCEPTED` : action === "ESCALATED" ? "escalation: Recruiting Manager" : `${field}: ${next}`,
          reason: action === "AI_ACTION" ? "Start-date risk recalculated from remaining tasks and vendor turnaround" : action === "OVERRIDDEN" ? "Start date override approved by client" : action === "ESCALATED" ? "Candidate unresponsive for 72 hours" : null,
          aiInvolved: action === "AI_ACTION" || chance(0.05),
          critical: action === "OVERRIDDEN",
          timestamp: auditTs(c.createdAt),
        };
        row.actorRole = row.actor === "AI Orchestrator" ? "ai" : row.actor === "JobDiva Sync" ? "integration" : ROLE_OF[row.actor] ?? "system";
        if (row.actor === "JobDiva Sync") { row.sourceSystem = "jobdiva-integration"; row.device = "API"; }
        if (row.actor === "AI Orchestrator") { row.sourceSystem = "ai-orchestrator"; row.device = "API"; row.ipAddress = null; }
        break;
      }
      case "document": {
        const d = pick(docRefs);
        const c = cands.find((x) => x.id === d.candId)!;
        const action = d.status === "APPROVED" ? weighted([["CREATED", 3], ["APPROVED", 4], ["AI_ACTION", 2], ["EXPORTED", 0.3]] as const)
          : ["REJECTED", "CORRECTION_REQUIRED"].includes(d.status) ? weighted([["CREATED", 2], ["REJECTED", 4], ["AI_ACTION", 3]] as const)
          : weighted([["CREATED", 4], ["AI_ACTION", 2], ["DELETED", 0.2]] as const);
        const candidateActor = action === "CREATED";
        row = {
          ...base, action, entityType: "Document", entityId: d.id, entityLabel: `${d.name} — ${c.first} ${c.last}`, documentId: d.id, candidateId: c.id,
          actor: candidateActor ? `${c.first} ${c.last}` : action === "AI_ACTION" ? "Document Intelligence" : action === "DELETED" ? pick(SUPER_ADMINS) : d.reviewer ?? c.onboarder,
          actorRole: candidateActor ? "candidate" : action === "AI_ACTION" ? "ai" : action === "DELETED" ? "super-admin" : "onboarder",
          previousValue: action === "APPROVED" || action === "REJECTED" ? "SUBMITTED" : null,
          newValue: action === "CREATED" ? "SUBMITTED" : action === "AI_ACTION" ? `aiScore: ${int(40, 100)}` : action === "DELETED" ? "deleted" : action === "EXPORTED" ? "downloaded" : action,
          reason: action === "REJECTED" ? "Failed quality / data validation" : action === "AI_ACTION" ? "Automated quality, signature and expiration check" : action === "DELETED" ? "Duplicate upload removed at candidate request" : null,
          aiInvolved: action === "AI_ACTION" || (action === "REJECTED" && chance(0.4)),
          critical: action === "DELETED" || action === "EXPORTED",
          sourceSystem: action === "AI_ACTION" ? "document-intelligence" : candidateActor ? "candidate-portal" : "hireme",
          ipAddress: candidateActor ? publicIp() : action === "AI_ACTION" ? null : staffIp(),
          device: candidateActor ? pick(CAND_DEVICES) : action === "AI_ACTION" ? "API" : pick(STAFF_DEVICES),
          timestamp: auditTs(addDays(d.at, -1)),
        };
        break;
      }
      case "package": {
        const p = pick(pkgRefs);
        const action = weighted([["CREATED", 2], ["UPDATED", 4], ["APPROVED", p.status === "DRAFT" ? 0.01 : 3], ["REJECTED", 0.8], ["OVERRIDDEN", 0.6], ["AI_ACTION", 2]] as const);
        row = {
          ...base, action, entityType: "Package", entityId: p.id, entityLabel: p.name, packageId: p.id, clientId: p.clientId,
          actor: action === "AI_ACTION" ? "AI Orchestrator" : action === "APPROVED" || action === "REJECTED" ? pick(ACCOUNT_MANAGERS) : action === "OVERRIDDEN" ? pick(SUPER_ADMINS) : pick(ONBOARDERS),
          previousValue: action === "UPDATED" ? `items: ${int(6, 10)}` : action === "OVERRIDDEN" ? "Drug Screen: required" : null,
          newValue: action === "UPDATED" ? `items: ${int(10, 14)}` : action === "OVERRIDDEN" ? "Drug Screen: waived" : action === "AI_ACTION" ? pick(["2 warnings: duplicate AUP, outdated NDA version", "No issues found", "1 error: missing state tax form"]) : pkgById.get(p.id)!.status,
          reason: action === "OVERRIDDEN" ? "Client waiver on file (evidence attached)" : action === "AI_ACTION" ? "Package AI review (§9 step 5)" : action === "REJECTED" ? "Returned for changes" : null,
          aiInvolved: action === "AI_ACTION",
          critical: action === "OVERRIDDEN",
          sourceSystem: action === "AI_ACTION" ? "ai-orchestrator" : "package-engine",
          timestamp: auditTs(dayAt(-90)),
        };
        row.actorRole = ROLE_OF[row.actor] ?? "ai";
        break;
      }
      case "exception": {
        const e = pick(excRefs);
        const action = weighted([["CREATED", 3], ["ESCALATED", 2], ["UPDATED", 3], ["AI_ACTION", 1]] as const);
        row = {
          ...base, action, entityType: "Exception", entityId: e.id, entityLabel: e.title, exceptionId: e.id, candidateId: e.candId,
          actor: action === "CREATED" ? "Rules Engine" : action === "AI_ACTION" ? "AI Orchestrator" : action === "ESCALATED" ? pick([e.owner, "SLA Monitor"]) : e.owner,
          previousValue: action === "UPDATED" ? "OPEN" : action === "ESCALATED" ? `severity: ${e.severity}` : null,
          newValue: action === "UPDATED" ? e.status : action === "ESCALATED" ? "escalation level 2 — Recruiting Manager" : action === "CREATED" ? "OPEN" : "Suggested resolver and next action",
          reason: action === "ESCALATED" ? "Resolution SLA breached" : null,
          aiInvolved: action === "AI_ACTION",
          sourceSystem: action === "CREATED" ? "rules-engine" : action === "AI_ACTION" ? "ai-orchestrator" : "hireme",
          timestamp: auditTs(e.createdAt),
        };
        row.actorRole = ROLE_OF[row.actor] ?? (row.actor === "AI Orchestrator" ? "ai" : "system");
        break;
      }
      case "integration": {
        const it = pick(intRefs);
        const action = weighted([["INTEGRATION_EVENT", 8], ["UPDATED", 1], ["OVERRIDDEN", 0.3]] as const);
        const failed = it.status === "ERROR" ? chance(0.7) : chance(0.08);
        row = {
          ...base, action, entityType: "Integration", entityId: it.id, entityLabel: it.name, integrationId: it.id,
          actor: action === "INTEGRATION_EVENT" ? "Integration Service" : pick(SUPER_ADMINS),
          actorRole: action === "INTEGRATION_EVENT" ? "integration" : "super-admin",
          previousValue: action === "UPDATED" ? "credential: ****a91f" : null,
          newValue: action === "INTEGRATION_EVENT" ? (failed ? `sync failed: ${pick(ERRORS)[0]}` : `sync ok: ${int(1, 300)} records`) : action === "UPDATED" ? "credential: ****c27e (rotated)" : "manual re-sync forced",
          reason: action === "UPDATED" ? "Scheduled credential rotation" : action === "OVERRIDDEN" ? "Bypassed failed mapping for 3 records" : null,
          critical: action !== "INTEGRATION_EVENT",
          sourceSystem: `${slug(it.name.split(" ")[0])}-integration`,
          device: action === "INTEGRATION_EVENT" ? "API" : pick(STAFF_DEVICES),
          ipAddress: action === "INTEGRATION_EVENT" ? null : staffIp(),
          timestamp: auditTs(dayAt(-90)),
        };
        break;
      }
      case "client": {
        const cl = pick(clients);
        const action = weighted([["UPDATED", 5], ["CREATED", 1.5], ["APPROVED", 1]] as const);
        row = {
          ...base, action, entityType: "Client", entityId: cl.id, entityLabel: cl.name, clientId: cl.id,
          actor: chance(0.7) ? cl.accountManager : pick(SUPER_ADMINS),
          previousValue: action === "UPDATED" ? pick(["paymentTermsDays: 30", "invoiceFrequency: Monthly", "compliance rule: Drug Screening optional"]) : null,
          newValue: action === "UPDATED" ? pick(["paymentTermsDays: 45", "invoiceFrequency: Bi-weekly", "compliance rule: Drug Screening required"]) : action === "CREATED" ? "compliance rule added" : "client promise confirmed",
          timestamp: auditTs(dayAt(-90)),
        };
        row.actorRole = ROLE_OF[row.actor];
        break;
      }
      case "consultant": {
        const cn = pick(consultantIds);
        const action = weighted([["UPDATED", 5], ["APPROVED", 2], ["OVERRIDDEN", 0.4], ["CREATED", 1]] as const);
        const bill = int(70, 200);
        row = {
          ...base, action, entityType: "Consultant", entityId: cn.id, entityLabel: cn.name, consultantId: cn.id, clientId: cn.client.id,
          actor: action === "OVERRIDDEN" ? pick(SUPER_ADMINS) : cn.client.accountManager,
          previousValue: action === "UPDATED" ? `billRate: ${bill}` : action === "APPROVED" ? "extension: requested" : action === "OVERRIDDEN" ? "rehireEligible: false" : null,
          newValue: action === "UPDATED" ? `billRate: ${bill + int(3, 15)}` : action === "APPROVED" ? `extension: approved through ${ymd(dayAt(int(60, 240)))}` : action === "OVERRIDDEN" ? "rehireEligible: true" : "consultant record created",
          reason: action === "UPDATED" ? "Annual rate increase per client amendment" : action === "OVERRIDDEN" ? "Rehire eligibility exception approved by HR" : null,
          critical: action === "OVERRIDDEN" || action === "UPDATED",
          timestamp: auditTs(dayAt(-90)),
        };
        row.actorRole = ROLE_OF[row.actor];
        break;
      }
      case "user": {
        const target = pick([...RECRUITERS, ...ONBOARDERS, ...ACCOUNT_MANAGERS, ...RECRUITING_MANAGERS]);
        const action = weighted([["UPDATED", 4], ["CREATED", 1], ["DELETED", 0.5]] as const);
        row = {
          ...base, action, entityType: "User", entityId: `user-${slug(target)}`, entityLabel: target,
          actor: pick(SUPER_ADMINS), actorRole: "super-admin",
          previousValue: action === "UPDATED" ? pick(["role: recruiter", "clients: 3", "mfa: disabled", "permission: export=false"]) : null,
          newValue: action === "UPDATED" ? pick(["role: recruiter, onboarder", "clients: 5", "mfa: enabled", "permission: export=true"]) : action === "CREATED" ? "user provisioned via Okta" : "user deactivated",
          reason: action === "DELETED" ? "Access review — role change" : action === "UPDATED" ? "Access request approved" : null,
          critical: true,
          timestamp: auditTs(dayAt(-90)),
        };
        break;
      }
      default: {
        const report = pick(["Start-Date Risk Report", "Payroll Readiness Report", "Billing Readiness Report", "Client Onboarding Pipeline Report", "Exception Resolution Report", "Screening Pipeline Report", "Executive Workforce Onboarding Scorecard", "Audit Activity Report", "Sensitive Data Access Report"]);
        const actor = pick([staff, ...RECRUITING_MANAGERS, ...SUPER_ADMINS]);
        row = {
          ...base, action: "EXPORTED", entityType: "Report", entityId: `rpt-${slug(report)}`, entityLabel: report,
          actor, actorRole: ROLE_OF[actor], newValue: `${pick(["CSV", "Excel", "PDF"])} — ${int(12, 900)} rows`,
          reason: pick(["Weekly client status call", "Leadership review", "Audit request", null]),
          aiInvolved: chance(0.12), critical: true,
          timestamp: auditTs(dayAt(-90)),
        };
      }
    }
    audRows.push(row);
  }
  await chunked(audRows, (d) => prisma.auditEvent.createMany({ data: d }));
  console.log("    · Bulk generation complete");
}
