/**
 * Background Check & Screening data (CLAUDE.md §22, §58).
 * Deterministic mock covering 12 candidates across multiple vendors.
 */
import { daysAgo, daysFromNow, formatDate } from "@/lib/clock";
import type { StatusTone } from "@/lib/types";

export type ScreeningStatus =
  | "ordered"
  | "invited"
  | "consented"
  | "in-progress"
  | "info-required"
  | "vendor-delayed"
  | "clear"
  | "review-required"
  | "adverse-pending";

export type DrugTestStatus =
  | "not-ordered"
  | "scheduled"
  | "completed"
  | "missed"
  | "rescheduled";

export type ScreeningRecord = {
  id: string;
  candidateId: string;
  candidateName: string;
  client: string;
  vendor: string;
  packageType: string;
  orderedDate: string;
  estimatedCompletion: string;
  actualCompletion?: string;
  status: ScreeningStatus;
  ageDays: number;
  jurisdictionDelays: boolean;
  drugTest: DrugTestStatus;
  drugTestDate?: string;
  cost: number;
  notes?: string;
};

export const SCREENING_STATUS_META: Record<
  ScreeningStatus,
  { label: string; tone: StatusTone }
> = {
  ordered:          { label: "Ordered",           tone: "neutral" },
  invited:          { label: "Invited",            tone: "neutral" },
  consented:        { label: "Consented",          tone: "info" },
  "in-progress":    { label: "In Progress",        tone: "info" },
  "info-required":  { label: "Info Required",      tone: "warning" },
  "vendor-delayed": { label: "Vendor Delayed",     tone: "warning" },
  clear:            { label: "Clear",              tone: "success" },
  "review-required":{ label: "Review Required",    tone: "danger" },
  "adverse-pending":{ label: "Adverse Pending",    tone: "danger" },
};

export const SCREENING_RECORDS: ScreeningRecord[] = [
  {
    id: "SCR-1001",
    candidateId: "james-rivera",
    candidateName: "James Rivera",
    client: "Meridian Health",
    vendor: "HireRight",
    packageType: "Enhanced 10yr",
    orderedDate: formatDate(daysAgo(12), { withYear: true }),
    estimatedCompletion: formatDate(daysAgo(3), { withYear: true }),
    actualCompletion: formatDate(daysAgo(4), { withYear: true }),
    status: "clear",
    ageDays: 12,
    jurisdictionDelays: false,
    drugTest: "completed",
    drugTestDate: formatDate(daysAgo(10), { withYear: true }),
    cost: 129,
  },
  {
    id: "SCR-1002",
    candidateId: "aisha-bello",
    candidateName: "Aisha Bello",
    client: "Vertex Financial",
    vendor: "Sterling",
    packageType: "Standard 7yr",
    orderedDate: formatDate(daysAgo(10), { withYear: true }),
    estimatedCompletion: formatDate(daysAgo(1), { withYear: true }),
    status: "vendor-delayed",
    ageDays: 10,
    jurisdictionDelays: true,
    drugTest: "completed",
    drugTestDate: formatDate(daysAgo(8), { withYear: true }),
    cost: 89,
    notes: "County court delay in Nassau County, NY — est. +3 business days",
  },
  {
    id: "SCR-1003",
    candidateId: "marcus-webb",
    candidateName: "Marcus Webb",
    client: "Northwind Logistics",
    vendor: "First Advantage",
    packageType: "Standard 7yr",
    orderedDate: formatDate(daysAgo(7), { withYear: true }),
    estimatedCompletion: formatDate(daysFromNow(2), { withYear: true }),
    status: "in-progress",
    ageDays: 7,
    jurisdictionDelays: false,
    drugTest: "scheduled",
    drugTestDate: formatDate(daysFromNow(1), { withYear: true }),
    cost: 79,
  },
  {
    id: "SCR-1004",
    candidateId: "noah-klein",
    candidateName: "Noah Klein",
    client: "Vertex Financial",
    vendor: "Sterling",
    packageType: "Standard 7yr",
    orderedDate: formatDate(daysAgo(5), { withYear: true }),
    estimatedCompletion: formatDate(daysFromNow(6), { withYear: true }),
    status: "consented",
    ageDays: 5,
    jurisdictionDelays: false,
    drugTest: "not-ordered",
    cost: 89,
  },
  {
    id: "SCR-1005",
    candidateId: "sarah-chen",
    candidateName: "Sarah Chen",
    client: "Atlas Manufacturing",
    vendor: "HireRight",
    packageType: "Enhanced 10yr",
    orderedDate: formatDate(daysAgo(19), { withYear: true }),
    estimatedCompletion: formatDate(daysAgo(9), { withYear: true }),
    actualCompletion: formatDate(daysAgo(11), { withYear: true }),
    status: "clear",
    ageDays: 19,
    jurisdictionDelays: false,
    drugTest: "completed",
    drugTestDate: formatDate(daysAgo(17), { withYear: true }),
    cost: 129,
  },
  {
    id: "SCR-1006",
    candidateId: "ravi-menon",
    candidateName: "Ravi Menon",
    client: "Cobalt Systems",
    vendor: "Checkr",
    packageType: "Basic 5yr",
    orderedDate: formatDate(daysAgo(4), { withYear: true }),
    estimatedCompletion: formatDate(daysFromNow(3), { withYear: true }),
    status: "info-required",
    ageDays: 4,
    jurisdictionDelays: false,
    drugTest: "not-ordered",
    cost: 49,
    notes: "Candidate has not provided address history for 2019-2021 period",
  },
  {
    id: "SCR-1007",
    candidateId: "mei-lin",
    candidateName: "Mei Lin",
    client: "Atlas Manufacturing",
    vendor: "HireRight",
    packageType: "Standard 7yr",
    orderedDate: formatDate(daysAgo(17), { withYear: true }),
    estimatedCompletion: formatDate(daysAgo(7), { withYear: true }),
    actualCompletion: formatDate(daysAgo(8), { withYear: true }),
    status: "clear",
    ageDays: 17,
    jurisdictionDelays: false,
    drugTest: "completed",
    drugTestDate: formatDate(daysAgo(15), { withYear: true }),
    cost: 99,
  },
  {
    id: "SCR-1008",
    candidateId: "diego-santos",
    candidateName: "Diego Santos",
    client: "Cobalt Systems",
    vendor: "First Advantage",
    packageType: "Standard 7yr",
    orderedDate: formatDate(daysAgo(8), { withYear: true }),
    estimatedCompletion: formatDate(daysFromNow(1), { withYear: true }),
    status: "review-required",
    ageDays: 8,
    jurisdictionDelays: false,
    drugTest: "completed",
    drugTestDate: formatDate(daysAgo(6), { withYear: true }),
    cost: 79,
    notes: "Criminal record found — requires adjudication by HR",
  },
  {
    id: "SCR-1009",
    candidateId: "grace-okafor",
    candidateName: "Grace Okafor",
    client: "Meridian Health",
    vendor: "Sterling",
    packageType: "Enhanced 10yr",
    orderedDate: formatDate(daysAgo(20), { withYear: true }),
    estimatedCompletion: formatDate(daysAgo(10), { withYear: true }),
    actualCompletion: formatDate(daysAgo(12), { withYear: true }),
    status: "clear",
    ageDays: 20,
    jurisdictionDelays: false,
    drugTest: "completed",
    drugTestDate: formatDate(daysAgo(18), { withYear: true }),
    cost: 149,
  },
  {
    id: "SCR-1010",
    candidateId: "sofia-marin",
    candidateName: "Sofia Marin",
    client: "Atlas Manufacturing",
    vendor: "Checkr",
    packageType: "Basic 5yr",
    orderedDate: formatDate(daysAgo(6), { withYear: true }),
    estimatedCompletion: formatDate(daysFromNow(4), { withYear: true }),
    status: "vendor-delayed",
    ageDays: 6,
    jurisdictionDelays: true,
    drugTest: "rescheduled",
    drugTestDate: formatDate(daysFromNow(2), { withYear: true }),
    cost: 49,
    notes: "Vendor system outage caused 2-day delay; drug test rescheduled after missed appointment",
  },
  {
    id: "SCR-1011",
    candidateId: "tara-voss",
    candidateName: "Tara Voss",
    client: "Meridian Health",
    vendor: "HireRight",
    packageType: "Enhanced 10yr",
    orderedDate: formatDate(daysAgo(11), { withYear: true }),
    estimatedCompletion: formatDate(daysAgo(1), { withYear: true }),
    status: "in-progress",
    ageDays: 11,
    jurisdictionDelays: false,
    drugTest: "missed",
    drugTestDate: formatDate(daysAgo(5), { withYear: true }),
    cost: 129,
    notes: "Candidate missed drug test appointment; rescheduling required",
  },
  {
    id: "SCR-1012",
    candidateId: "fatima-idris",
    candidateName: "Fatima Idris",
    client: "Cobalt Systems",
    vendor: "First Advantage",
    packageType: "Standard 7yr",
    orderedDate: formatDate(daysAgo(9), { withYear: true }),
    estimatedCompletion: formatDate(daysFromNow(0), { withYear: true }),
    status: "adverse-pending",
    ageDays: 9,
    jurisdictionDelays: false,
    drugTest: "completed",
    drugTestDate: formatDate(daysAgo(7), { withYear: true }),
    cost: 79,
    notes: `Pre-adverse action notice sent ${formatDate(daysAgo(3))}; candidate response period ends ${formatDate(daysFromNow(4))}`,
  },
];

export function screeningStats(): {
  inProgress: number;
  clear: number;
  reviewRequired: number;
  vendorDelayed: number;
} {
  return {
    inProgress: SCREENING_RECORDS.filter(
      (r) =>
        r.status === "in-progress" ||
        r.status === "ordered" ||
        r.status === "invited" ||
        r.status === "consented",
    ).length,
    clear: SCREENING_RECORDS.filter((r) => r.status === "clear").length,
    reviewRequired: SCREENING_RECORDS.filter(
      (r) => r.status === "review-required" || r.status === "adverse-pending",
    ).length,
    vendorDelayed: SCREENING_RECORDS.filter(
      (r) => r.status === "vendor-delayed",
    ).length,
  };
}
