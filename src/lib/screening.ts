/**
 * Background Check & Screening data (CLAUDE.md §22, §58).
 * Deterministic mock covering 12 candidates across multiple vendors.
 */
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
    orderedDate: "May 27, 2026",
    estimatedCompletion: "Jun 5, 2026",
    actualCompletion: "Jun 4, 2026",
    status: "clear",
    ageDays: 11,
    jurisdictionDelays: false,
    drugTest: "completed",
    drugTestDate: "May 29, 2026",
    cost: 129,
  },
  {
    id: "SCR-1002",
    candidateId: "aisha-bello",
    candidateName: "Aisha Bello",
    client: "Vertex Financial",
    vendor: "Sterling",
    packageType: "Standard 7yr",
    orderedDate: "May 29, 2026",
    estimatedCompletion: "Jun 7, 2026",
    status: "vendor-delayed",
    ageDays: 9,
    jurisdictionDelays: true,
    drugTest: "completed",
    drugTestDate: "May 31, 2026",
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
    orderedDate: "Jun 1, 2026",
    estimatedCompletion: "Jun 10, 2026",
    status: "in-progress",
    ageDays: 6,
    jurisdictionDelays: false,
    drugTest: "scheduled",
    drugTestDate: "Jun 9, 2026",
    cost: 79,
  },
  {
    id: "SCR-1004",
    candidateId: "noah-klein",
    candidateName: "Noah Klein",
    client: "Vertex Financial",
    vendor: "Sterling",
    packageType: "Standard 7yr",
    orderedDate: "Jun 3, 2026",
    estimatedCompletion: "Jun 14, 2026",
    status: "consented",
    ageDays: 4,
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
    orderedDate: "May 20, 2026",
    estimatedCompletion: "May 30, 2026",
    actualCompletion: "May 28, 2026",
    status: "clear",
    ageDays: 18,
    jurisdictionDelays: false,
    drugTest: "completed",
    drugTestDate: "May 22, 2026",
    cost: 129,
  },
  {
    id: "SCR-1006",
    candidateId: "ravi-menon",
    candidateName: "Ravi Menon",
    client: "Cobalt Systems",
    vendor: "Checkr",
    packageType: "Basic 5yr",
    orderedDate: "Jun 4, 2026",
    estimatedCompletion: "Jun 11, 2026",
    status: "info-required",
    ageDays: 3,
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
    orderedDate: "May 22, 2026",
    estimatedCompletion: "Jun 1, 2026",
    actualCompletion: "May 31, 2026",
    status: "clear",
    ageDays: 16,
    jurisdictionDelays: false,
    drugTest: "completed",
    drugTestDate: "May 24, 2026",
    cost: 99,
  },
  {
    id: "SCR-1008",
    candidateId: "diego-santos",
    candidateName: "Diego Santos",
    client: "Cobalt Systems",
    vendor: "First Advantage",
    packageType: "Standard 7yr",
    orderedDate: "May 31, 2026",
    estimatedCompletion: "Jun 9, 2026",
    status: "review-required",
    ageDays: 7,
    jurisdictionDelays: false,
    drugTest: "completed",
    drugTestDate: "Jun 2, 2026",
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
    orderedDate: "May 19, 2026",
    estimatedCompletion: "May 29, 2026",
    actualCompletion: "May 27, 2026",
    status: "clear",
    ageDays: 19,
    jurisdictionDelays: false,
    drugTest: "completed",
    drugTestDate: "May 21, 2026",
    cost: 149,
  },
  {
    id: "SCR-1010",
    candidateId: "sofia-marin",
    candidateName: "Sofia Marin",
    client: "Atlas Manufacturing",
    vendor: "Checkr",
    packageType: "Basic 5yr",
    orderedDate: "Jun 2, 2026",
    estimatedCompletion: "Jun 12, 2026",
    status: "vendor-delayed",
    ageDays: 5,
    jurisdictionDelays: true,
    drugTest: "rescheduled",
    drugTestDate: "Jun 10, 2026",
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
    orderedDate: "May 28, 2026",
    estimatedCompletion: "Jun 7, 2026",
    status: "in-progress",
    ageDays: 10,
    jurisdictionDelays: false,
    drugTest: "missed",
    drugTestDate: "Jun 3, 2026",
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
    orderedDate: "May 30, 2026",
    estimatedCompletion: "Jun 8, 2026",
    status: "adverse-pending",
    ageDays: 8,
    jurisdictionDelays: false,
    drugTest: "completed",
    drugTestDate: "Jun 1, 2026",
    cost: 79,
    notes: "Pre-adverse action notice sent Jun 5; candidate response period ends Jun 12",
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
