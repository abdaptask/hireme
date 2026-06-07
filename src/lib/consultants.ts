/**
 * Consultant lifecycle mock data (CLAUDE.md §15 360 record, §38 lifecycle).
 * Consultants are active workforce members beyond onboarding — distinct from
 * Candidates who are still in the onboarding pipeline.
 */
import type { StatusTone } from "@/lib/types";

export type ConsultantStatus =
  | "Active"
  | "Bench"
  | "Extension Pending"
  | "Offboarding"
  | "Converted"
  | "Former"
  | "Ineligible";

export type Consultant = {
  id: string;
  name: string;
  role: string;
  client: string;
  employmentType: "W-2" | "1099" | "C2C";
  location: string;
  startDate: string;
  endDate?: string;
  status: ConsultantStatus;
  rateType: string;
  billRate: number;
  payRate: number;
  currency: string;
  recruiter: string;
  accountManager: string;
  vendor?: string;
  assignments: number;
  extensions: number;
  satisfactionScore: number;
  lastActivity: string;
  tags: string[];
  phone: string;
  email: string;
};

export const CONSULTANT_STATUS_META: Record<
  ConsultantStatus,
  { label: string; tone: StatusTone }
> = {
  Active: { label: "Active", tone: "success" },
  Bench: { label: "Bench", tone: "neutral" },
  "Extension Pending": { label: "Extension Pending", tone: "warning" },
  Offboarding: { label: "Offboarding", tone: "danger" },
  Converted: { label: "Converted", tone: "info" },
  Former: { label: "Former", tone: "neutral" },
  Ineligible: { label: "Ineligible", tone: "danger" },
};

export const CONSULTANTS: Consultant[] = [
  {
    id: "elena-vasquez",
    name: "Elena Vasquez",
    role: "Senior Data Analyst",
    client: "Meridian Health",
    employmentType: "W-2",
    location: "Hybrid · Austin, TX",
    startDate: "2024-03-11",
    endDate: "2026-03-10",
    status: "Active",
    rateType: "Hourly",
    billRate: 115,
    payRate: 72,
    currency: "USD",
    recruiter: "Devon Hughes",
    accountManager: "Devon Hughes",
    assignments: 3,
    extensions: 1,
    satisfactionScore: 4.8,
    lastActivity: "1h ago",
    tags: ["Top performer", "Healthcare"],
    phone: "+1 (512) 555-0201",
    email: "elena.vasquez@example.com",
  },
  {
    id: "kai-nakamura",
    name: "Kai Nakamura",
    role: "DevOps Engineer",
    client: "Cobalt Systems",
    employmentType: "C2C",
    location: "Remote · Portland, OR",
    startDate: "2024-07-15",
    endDate: "2026-07-14",
    status: "Active",
    rateType: "Hourly",
    billRate: 145,
    payRate: 110,
    currency: "USD",
    recruiter: "Aaron Flores",
    accountManager: "Aaron Flores",
    vendor: "Apex Staffing Partners",
    assignments: 2,
    extensions: 1,
    satisfactionScore: 4.6,
    lastActivity: "3h ago",
    tags: ["Cloud", "Security cleared"],
    phone: "+1 (503) 555-0215",
    email: "kai.nakamura@example.com",
  },
  {
    id: "priya-sharma",
    name: "Priya Sharma",
    role: "Financial Analyst",
    client: "Vertex Financial",
    employmentType: "W-2",
    location: "Onsite · Dallas, TX",
    startDate: "2023-11-06",
    endDate: "2025-11-05",
    status: "Extension Pending",
    rateType: "Hourly",
    billRate: 98,
    payRate: 62,
    currency: "USD",
    recruiter: "Lena Ortiz",
    accountManager: "Devon Hughes",
    assignments: 4,
    extensions: 2,
    satisfactionScore: 4.5,
    lastActivity: "2h ago",
    tags: ["Finance", "Extension in review"],
    phone: "+1 (214) 555-0233",
    email: "priya.sharma@example.com",
  },
  {
    id: "derek-olsen",
    name: "Derek Olsen",
    role: "Solutions Architect",
    client: "Northwind Logistics",
    employmentType: "C2C",
    location: "Remote · Minneapolis, MN",
    startDate: "2024-01-08",
    endDate: "2025-12-31",
    status: "Active",
    rateType: "Hourly",
    billRate: 162,
    payRate: 125,
    currency: "USD",
    recruiter: "Devon Hughes",
    accountManager: "Aaron Flores",
    vendor: "Nexus Tech Solutions",
    assignments: 2,
    extensions: 0,
    satisfactionScore: 4.7,
    lastActivity: "Yesterday",
    tags: ["Architecture", "Priority client"],
    phone: "+1 (612) 555-0248",
    email: "derek.olsen@example.com",
  },
  {
    id: "amara-diallo",
    name: "Amara Diallo",
    role: "QA Engineer",
    client: "Atlas Manufacturing",
    employmentType: "1099",
    location: "Remote · Atlanta, GA",
    startDate: "2024-05-20",
    endDate: "2025-05-19",
    status: "Bench",
    rateType: "Hourly",
    billRate: 88,
    payRate: 70,
    currency: "USD",
    recruiter: "Lena Ortiz",
    accountManager: "Lena Ortiz",
    assignments: 3,
    extensions: 1,
    satisfactionScore: 4.3,
    lastActivity: "3 days ago",
    tags: ["Automation", "Available immediately"],
    phone: "+1 (404) 555-0261",
    email: "amara.diallo@example.com",
  },
  {
    id: "brendan-walsh",
    name: "Brendan Walsh",
    role: "Backend Engineer",
    client: "Cobalt Systems",
    employmentType: "W-2",
    location: "Hybrid · Boston, MA",
    startDate: "2023-09-04",
    endDate: "2025-09-03",
    status: "Extension Pending",
    rateType: "Hourly",
    billRate: 132,
    payRate: 84,
    currency: "USD",
    recruiter: "Aaron Flores",
    accountManager: "Aaron Flores",
    assignments: 3,
    extensions: 2,
    satisfactionScore: 4.4,
    lastActivity: "4h ago",
    tags: ["Node.js", "PostgreSQL"],
    phone: "+1 (617) 555-0279",
    email: "brendan.walsh@example.com",
  },
  {
    id: "nina-petrov",
    name: "Nina Petrov",
    role: "Data Engineer",
    client: "Meridian Health",
    employmentType: "W-2",
    location: "Remote · Denver, CO",
    startDate: "2024-02-26",
    endDate: "2025-08-25",
    status: "Offboarding",
    rateType: "Hourly",
    billRate: 125,
    payRate: 79,
    currency: "USD",
    recruiter: "Lena Ortiz",
    accountManager: "Devon Hughes",
    assignments: 2,
    extensions: 0,
    satisfactionScore: 4.2,
    lastActivity: "6h ago",
    tags: ["Assignment ending", "Exit survey sent"],
    phone: "+1 (720) 555-0284",
    email: "nina.petrov@example.com",
  },
  {
    id: "james-okonkwo",
    name: "James Okonkwo",
    role: "Clinical Coordinator",
    client: "Meridian Health",
    employmentType: "W-2",
    location: "Onsite · Houston, TX",
    startDate: "2023-06-12",
    endDate: "2025-06-11",
    status: "Offboarding",
    rateType: "Hourly",
    billRate: 92,
    payRate: 58,
    currency: "USD",
    recruiter: "Devon Hughes",
    accountManager: "Devon Hughes",
    assignments: 3,
    extensions: 1,
    satisfactionScore: 4.1,
    lastActivity: "Yesterday",
    tags: ["Healthcare", "Equipment return pending"],
    phone: "+1 (713) 555-0296",
    email: "james.okonkwo@example.com",
  },
  {
    id: "lucia-herrera",
    name: "Lucia Herrera",
    role: "Product Designer",
    client: "Atlas Manufacturing",
    employmentType: "W-2",
    location: "Remote · Chicago, IL",
    startDate: "2023-04-03",
    status: "Converted",
    rateType: "Hourly",
    billRate: 108,
    payRate: 68,
    currency: "USD",
    recruiter: "Aaron Flores",
    accountManager: "Lena Ortiz",
    assignments: 4,
    extensions: 2,
    satisfactionScore: 4.9,
    lastActivity: "2 days ago",
    tags: ["Converted to FTE", "Figma"],
    phone: "+1 (312) 555-0307",
    email: "lucia.herrera@example.com",
  },
  {
    id: "marcus-bell",
    name: "Marcus Bell",
    role: "Field Technician",
    client: "Northwind Logistics",
    employmentType: "W-2",
    location: "Onsite · Detroit, MI",
    startDate: "2022-08-15",
    endDate: "2024-08-14",
    status: "Active",
    rateType: "Hourly",
    billRate: 76,
    payRate: 48,
    currency: "USD",
    recruiter: "Devon Hughes",
    accountManager: "Aaron Flores",
    assignments: 5,
    extensions: 3,
    satisfactionScore: 4.0,
    lastActivity: "2h ago",
    tags: ["Logistics", "Veteran"],
    phone: "+1 (313) 555-0318",
    email: "marcus.bell@example.com",
  },
  {
    id: "chidi-eze",
    name: "Chidi Eze",
    role: "Accountant",
    client: "Vertex Financial",
    employmentType: "W-2",
    location: "Onsite · Dallas, TX",
    startDate: "2022-05-02",
    endDate: "2023-11-01",
    status: "Former",
    rateType: "Hourly",
    billRate: 85,
    payRate: 54,
    currency: "USD",
    recruiter: "Lena Ortiz",
    accountManager: "Devon Hughes",
    assignments: 2,
    extensions: 0,
    satisfactionScore: 3.8,
    lastActivity: "6 months ago",
    tags: ["GAAP", "Rehire eligible"],
    phone: "+1 (214) 555-0329",
    email: "chidi.eze@example.com",
  },
  {
    id: "rachel-stone",
    name: "Rachel Stone",
    role: "RN — ICU",
    client: "Meridian Health",
    employmentType: "W-2",
    location: "Onsite · Houston, TX",
    startDate: "2024-06-10",
    endDate: "2024-12-10",
    status: "Bench",
    rateType: "Hourly",
    billRate: 138,
    payRate: 88,
    currency: "USD",
    recruiter: "Lena Ortiz",
    accountManager: "Devon Hughes",
    assignments: 1,
    extensions: 0,
    satisfactionScore: 4.6,
    lastActivity: "1 day ago",
    tags: ["Healthcare", "ACLS certified", "Available"],
    phone: "+1 (713) 555-0341",
    email: "rachel.stone@example.com",
  },
];

export function getConsultant(id: string): Consultant | undefined {
  return CONSULTANTS.find((c) => c.id === id);
}

export function consultantStats(): {
  active: number;
  extensionPending: number;
  offboarding: number;
  avgSatisfaction: number;
} {
  const active = CONSULTANTS.filter((c) => c.status === "Active").length;
  const extensionPending = CONSULTANTS.filter(
    (c) => c.status === "Extension Pending",
  ).length;
  const offboarding = CONSULTANTS.filter(
    (c) => c.status === "Offboarding",
  ).length;
  const avgSatisfaction =
    CONSULTANTS.reduce((sum, c) => sum + c.satisfactionScore, 0) /
    CONSULTANTS.length;
  return {
    active,
    extensionPending,
    offboarding,
    avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
  };
}
