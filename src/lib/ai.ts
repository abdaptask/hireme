/**
 * AI Copilot data layer (CLAUDE.md §10, §11 — Explainable AI & AI Governance).
 * Every recommendation exposes what, why, confidence, data used, and approval
 * requirement so AI never operates as an invisible black box.
 */
import type { PersonaId } from "@/lib/types";

export type AiConfidence = "high" | "medium" | "low";

export type AiRecommendationType =
  | "action"   // something that needs to be done
  | "alert"    // urgent issue detected
  | "insight"  // analytical observation
  | "risk";    // risk prediction

export type AiRecommendationStatus =
  | "pending"        // awaiting human decision
  | "accepted"       // human accepted
  | "rejected"       // human rejected
  | "auto-executed"; // low-risk, auto-run

export type AiRecommendation = {
  id: string;
  type: AiRecommendationType;
  title: string;
  summary: string;
  what: string;                  // what was detected
  why: string;                   // why it matters
  confidence: AiConfidence;
  dataUsed: string[];            // e.g. ["Candidate profile", "Client rules"]
  recommendedAction: string;     // the specific action to take
  approvalRequired: boolean;     // high-risk actions require human approval
  status: AiRecommendationStatus;
  persona: PersonaId[];          // which personas see this
  candidateId?: string;
  clientId?: string;
  createdAt: string;             // ISO date string
  urgency: "critical" | "high" | "medium" | "low";
};

export type MorningBriefingHighlight = {
  label: string;
  count: number;
  tone: "danger" | "warning" | "info" | "success" | "ai";
  href?: string;
};

export type MorningBriefing = {
  date: string;
  activeOnboardings: number;
  startDatesAtRisk: number;
  docsRequiringReview: number;
  backgroundChecksOverSla: number;
  unresponsiveCandidates: number;
  aiActionsAwaiting: number;
  summary: string;               // full narrative text
  highlights: MorningBriefingHighlight[];
};

export type CandidateAiSummary = {
  candidateId: string;
  summary: string;
  riskFactors: string[];
  nextBestAction: string;
  confidence: AiConfidence;
  estimatedStartReadiness: number; // 0-100
};

// ---------------------------------------------------------------------------
// Mock recommendations (12-15 entries, mix of types/urgency/personas)
// ---------------------------------------------------------------------------

export const RECOMMENDATIONS: AiRecommendation[] = [
  {
    id: "ai-001",
    type: "alert",
    title: "James Rivera's I-9 upload overdue — start date in 3 days",
    summary: "James Rivera has not submitted his I-9. His start date with Meridian Health is June 14. Without this document, payroll cannot be configured and compliance will be blocked.",
    what: "No I-9 record has been submitted by James Rivera (candidate ID: james-rivera). The document was due 2 days ago. Portal activity shows the candidate last logged in 48 hours ago but did not complete the upload.",
    why: "I-9 is a federal requirement that must be completed before Day 1. Meridian Health's package mandates E-Verify completion after I-9. Missing this will block payroll readiness and client approval, making the June 14 start date unlikely.",
    confidence: "high",
    dataUsed: ["Candidate portal activity log", "Meridian Health package rules", "I-9 task SLA config", "Payroll readiness gate"],
    recommendedAction: "Send an escalating SMS + email reminder immediately, then assign the recruiter Devon Hughes an urgent task if no response within 2 hours.",
    approvalRequired: false,
    status: "pending",
    persona: ["super-admin", "onboarder", "recruiter"],
    candidateId: "james-rivera",
    clientId: "meridian-health",
    createdAt: "2026-06-07T08:12:00Z",
    urgency: "critical",
  },
  {
    id: "ai-002",
    type: "risk",
    title: "Marcus Webb's background check pending 8 days — vendor-delayed",
    summary: "Sterling has not returned results for Marcus Webb after 8 days. The average turnaround for this screening package is 3.2 days. His Northwind Logistics start date is June 18.",
    what: "Background check ordered June 1 via Sterling for Marcus Webb (DevOps Engineer, Northwind Logistics). Current status: In Progress — Vendor Delayed. Illinois jurisdiction checks are averaging 9 days this month due to court system backlogs.",
    why: "If Sterling does not return results by June 15, Northwind Logistics cannot complete client approval before the June 18 start date. This directly impacts billing readiness and the client's project timeline.",
    confidence: "medium",
    dataUsed: ["Sterling API status feed", "Northwind Logistics SLA rules", "IL jurisdiction delay report", "Historical BGC turnaround data"],
    recommendedAction: "Contact Sterling account manager to expedite the Illinois county check. Notify Sasha Patel (Onboarder) and flag the start date risk score for Marcus Webb.",
    approvalRequired: false,
    status: "pending",
    persona: ["super-admin", "onboarder", "account-manager"],
    candidateId: "marcus-webb",
    clientId: "northwind-logistics",
    createdAt: "2026-06-07T07:45:00Z",
    urgency: "high",
  },
  {
    id: "ai-003",
    type: "action",
    title: "Grace Okafor's equipment hasn't shipped — start date at risk",
    summary: "Grace Okafor starts at Meridian Health on June 23. Her laptop and badge were approved June 3 but have not been shipped. IT provisioning typically takes 5-7 business days.",
    what: "Equipment request #EQ-2041 (laptop, security token, badge) was approved on June 3. As of June 7, no shipment label has been generated. Grace's onsite role at Houston requires equipment arrival before Day 1.",
    why: "Grace's role is onsite — she cannot work remotely. Equipment arriving after June 23 will prevent her from starting, damaging the Meridian Health relationship and creating a billing gap.",
    confidence: "high",
    dataUsed: ["Equipment provisioning system", "Meridian Health client requirements", "Shipping lead time model", "Grace Okafor candidate record"],
    recommendedAction: "Escalate equipment order to IT manager immediately. Request expedited shipping and update Grace Okafor's Day 1 readiness score.",
    approvalRequired: false,
    status: "pending",
    persona: ["super-admin", "onboarder"],
    candidateId: "grace-okafor",
    clientId: "meridian-health",
    createdAt: "2026-06-07T09:00:00Z",
    urgency: "high",
  },
  {
    id: "ai-004",
    type: "insight",
    title: "Northwind Logistics packages take 2.3× longer than portfolio average",
    summary: "Onboarding candidates for Northwind Logistics averages 18.4 days versus a portfolio average of 8.1 days. The bottleneck is concentrated in the Client Requirements stage.",
    what: "Analysis of last 90 days: 12 Northwind candidates onboarded. Average time: 18.4 days. Portfolio average: 8.1 days. Stage-level breakdown shows Client Requirements stage alone averages 6.2 days — 3× other clients at 2.1 days.",
    why: "This bottleneck is reducing recruiter efficiency, increasing candidate drop-off risk, and creating reputational risk with Northwind Logistics. The primary cause appears to be the Fieldglass Worker Profile step which requires manual data entry from the client's MSP coordinator.",
    confidence: "high",
    dataUsed: ["Onboarding completion timestamps (90-day window)", "Stage duration analytics", "Northwind Logistics client config", "Fieldglass integration logs", "Drop-off event log"],
    recommendedAction: "Schedule a package review meeting with the Northwind Logistics account team to streamline the Fieldglass Worker Profile step. Consider auto-populating from ATS data.",
    approvalRequired: false,
    status: "pending",
    persona: ["super-admin", "recruiting-manager", "account-manager"],
    clientId: "northwind-logistics",
    createdAt: "2026-06-06T16:00:00Z",
    urgency: "medium",
  },
  {
    id: "ai-005",
    type: "action",
    title: "Aisha Bello's payroll setup missing direct deposit",
    summary: "Aisha Bello's payroll file is missing direct deposit information. Her start date is June 22 — only 15 days away. Without this, first payroll will be delayed.",
    what: "Payroll readiness check run June 7 at 08:00 UTC: Aisha Bello (RN – ICU, Vertex Financial) has W-4 and state tax forms complete, but the direct deposit step was skipped in the portal. Status: Pending candidate action.",
    why: "Payroll cannot be processed on Day 1 without direct deposit information. Late payroll creates significant candidate dissatisfaction and may violate payroll timing laws in Texas.",
    confidence: "high",
    dataUsed: ["Payroll readiness gate check", "Aisha Bello portal session logs", "Vertex Financial payroll rules", "Texas payroll timing statutes"],
    recommendedAction: "Send Aisha Bello a targeted portal reminder with a direct link to the direct deposit form. Set a 24-hour escalation to recruiter Lena Ortiz.",
    approvalRequired: false,
    status: "pending",
    persona: ["super-admin", "onboarder", "recruiter"],
    candidateId: "aisha-bello",
    clientId: "vertex-financial",
    createdAt: "2026-06-07T08:05:00Z",
    urgency: "medium",
  },
  {
    id: "ai-006",
    type: "alert",
    title: "Owen Bradley's start date passed — 2 days overdue, escalation required",
    summary: "Owen Bradley was scheduled to start June 5 at Northwind Logistics. It is now June 7 and he has not started. Client contact has not been informed. Account Manager intervention required.",
    what: "Candidate Owen Bradley (Field Technician, Northwind Logistics, Detroit MI) had a confirmed start date of June 5. As of June 7, the candidate record shows status: At Risk, progress 38%. Key blockers: client approval pending, no-show confirmation not recorded.",
    why: "A missed start date without a client communication is a high-priority service failure. Northwind Logistics SLA requires notification within 24 hours of a missed start. Billing cannot be initiated and the client project is delayed.",
    confidence: "high",
    dataUsed: ["Owen Bradley candidate record", "Northwind Logistics SLA agreement", "Client communication log", "Account Manager assignment"],
    recommendedAction: "Immediately notify Account Manager and Northwind Logistics client contact. Determine if Owen has withdrawn and update billing team. Record outcome in audit trail.",
    approvalRequired: true,
    status: "pending",
    persona: ["super-admin", "onboarder", "account-manager"],
    candidateId: "owen-bradley",
    clientId: "northwind-logistics",
    createdAt: "2026-06-07T06:30:00Z",
    urgency: "critical",
  },
  {
    id: "ai-007",
    type: "risk",
    title: "3 candidates have unread portal messages for over 48 hours",
    summary: "James Rivera, Owen Bradley, and Ravi Menon have not read portal messages sent more than 48 hours ago. All three have upcoming or overdue start dates.",
    what: "Portal message delivery confirmed for all three. Read receipts: none. Last portal login: James Rivera 48h, Owen Bradley 72h, Ravi Menon 36h. Gentle Nudge sequence has sent Day 0 and Day 1 reminders; Day 2 SMS nudge has not been triggered yet.",
    why: "Candidate unresponsiveness at this proximity to start dates is the highest predictor of drop-off in the platform's historical data (83% correlation). Escalating now can recover an estimated 60% of these situations.",
    confidence: "medium",
    dataUsed: ["Portal message delivery log", "Read receipt tracking", "Historical drop-off prediction model", "Gentle Nudge protocol config", "Candidate start date data"],
    recommendedAction: "Trigger Day 2 SMS nudge for all three candidates immediately. Create recruiter tasks for personal outreach if no response within 4 hours.",
    approvalRequired: false,
    status: "pending",
    persona: ["super-admin", "onboarder", "recruiter"],
    createdAt: "2026-06-07T07:00:00Z",
    urgency: "high",
  },
  {
    id: "ai-008",
    type: "insight",
    title: "HireRight IL jurisdiction averaging 9 days — above SLA threshold",
    summary: "HireRight background checks in Illinois are averaging 9.1 days this month versus a 5-day SLA threshold. 3 active candidates are in the Illinois queue.",
    what: "HireRight API data (last 30 days): 7 Illinois checks submitted. Average completion: 9.1 days. SLA threshold: 5 days. Current active checks in IL queue: Marcus Webb, and 2 candidates not in this dashboard view. IL Cook County records office has a documented backlog.",
    why: "Three candidates with Illinois checks are at risk of start-date delays if not proactively managed. Clients expect the screening step to complete within 5 days per our SLA agreement.",
    confidence: "high",
    dataUsed: ["HireRight API completion data", "SLA configuration", "Illinois court record office status", "Active candidate screening queue"],
    recommendedAction: "Contact HireRight to flag Illinois delays. Proactively notify affected account managers and consider setting temporary SLA override for IL jurisdiction with client approval.",
    approvalRequired: true,
    status: "pending",
    persona: ["super-admin", "account-manager"],
    createdAt: "2026-06-06T14:00:00Z",
    urgency: "medium",
  },
  {
    id: "ai-009",
    type: "action",
    title: "Diego Santos's client NDA needs counter-signature from Cobalt Systems",
    summary: "Diego Santos signed the Cobalt Systems NDA on June 4. The counter-signature from the Cobalt client contact has not been received. Diego's start date is June 30.",
    what: "DocuSign envelope #DS-20463 was completed by Diego Santos on June 4. Cobalt Systems counter-signature from Jennifer Walsh (VP Engineering) is pending. Envelope expires June 18 without action. Last reminder sent June 5.",
    why: "The counter-signed NDA is required before Diego Santos can be given access to Cobalt Systems internal systems. Without it, IT provisioning and client credential setup cannot proceed, blocking Day 1 readiness.",
    confidence: "high",
    dataUsed: ["DocuSign API status", "Diego Santos candidate record", "Cobalt Systems contact directory", "Package requirements config"],
    recommendedAction: "Send an escalation email to Cobalt Systems account contact with the DocuSign completion link. Copy the Account Manager on the communication.",
    approvalRequired: false,
    status: "pending",
    persona: ["super-admin", "onboarder", "account-manager"],
    candidateId: "diego-santos",
    clientId: "cobalt-systems",
    createdAt: "2026-06-07T09:30:00Z",
    urgency: "medium",
  },
  {
    id: "ai-010",
    type: "alert",
    title: "Ravi Menon's client credentials not provisioned — IT ticket overdue",
    summary: "Ravi Menon starts at Cobalt Systems on June 21. An IT provisioning ticket was opened June 3. It is 4 days past SLA. Without credentials, Ravi cannot access Cobalt Systems infrastructure on Day 1.",
    what: "IT ticket #IT-8832 (Cobalt Systems VPN + repository access for Ravi Menon) was opened June 3. SLA: 3 business days. Current status: Pending. Cobalt Systems IT contact has not responded to automated follow-up.",
    why: "Ravi's role as Backend Engineer requires immediate code repository and VPN access on Day 1. A delayed IT setup will prevent him from starting work and will create a billing hold.",
    confidence: "high",
    dataUsed: ["IT provisioning ticket system", "Cobalt Systems SLA agreement", "Ravi Menon candidate record", "Day 1 readiness checklist"],
    recommendedAction: "Escalate IT ticket #IT-8832 to Cobalt Systems IT manager. Notify Account Manager and update Day 1 readiness status to At Risk.",
    approvalRequired: false,
    status: "pending",
    persona: ["super-admin", "onboarder", "account-manager"],
    candidateId: "ravi-menon",
    clientId: "cobalt-systems",
    createdAt: "2026-06-07T08:45:00Z",
    urgency: "high",
  },
  {
    id: "ai-011",
    type: "risk",
    title: "Noah Klein's FINRA disclosure review pending — Vertex Financial at risk",
    summary: "Noah Klein's FINRA disclosure form has been under compliance review for 5 days. Vertex Financial requires clearance before the June 19 start date. The review is assigned but no decision has been made.",
    what: "FINRA disclosure form submitted June 2. Compliance reviewer assigned June 3. Status: Under Review. No adjudication decision logged in system. Vertex Financial's client rules require FINRA clearance before any start date confirmation is issued.",
    why: "If FINRA review is not completed by June 17, Vertex Financial cannot legally onboard Noah Klein before June 19. This is a hard compliance gate — not waivable.",
    confidence: "medium",
    dataUsed: ["Compliance review queue", "Vertex Financial package rules", "FINRA disclosure form data", "Historical adjudication turnaround times"],
    recommendedAction: "Follow up with the compliance reviewer immediately. If no response within 24 hours, escalate to the Compliance Manager. Notify Vertex Financial Account Manager of the risk.",
    approvalRequired: true,
    status: "pending",
    persona: ["super-admin", "onboarder"],
    candidateId: "noah-klein",
    clientId: "vertex-financial",
    createdAt: "2026-06-07T09:15:00Z",
    urgency: "high",
  },
  {
    id: "ai-012",
    type: "insight",
    title: "Documents with AI quality score below 70 are rejected 3× more often",
    summary: "Platform analysis shows that documents receiving an AI quality score below 70 (out of 100) at upload are rejected by onboarders at a rate of 63% versus 21% for scores above 70.",
    what: "Analysis of 847 document submissions over the last 60 days. Documents with AI quality score <70: 212 submissions, 134 rejected (63%). Documents with AI quality score ≥70: 635 submissions, 134 rejected (21%). Correlated with blur detection and edge detection failures.",
    why: "Improving upload guidance at the point of capture (especially for mobile users) could reduce document rework by an estimated 40%, saving 0.8 days per candidate in the onboarding timeline.",
    confidence: "high",
    dataUsed: ["Document AI quality scores", "Onboarder rejection decisions", "Mobile upload session data", "Image quality metadata"],
    recommendedAction: "Add real-time quality score feedback to the mobile document capture flow. Show candidates a minimum quality indicator before they submit. Pilot with 5 clients.",
    approvalRequired: false,
    status: "pending",
    persona: ["super-admin", "recruiting-manager"],
    createdAt: "2026-06-06T12:00:00Z",
    urgency: "low",
  },
  {
    id: "ai-013",
    type: "action",
    title: "Sofia Marin's billing setup missing PO number — billing readiness blocked",
    summary: "Sofia Marin's billing profile for Atlas Manufacturing is missing a valid Purchase Order number. Her start date is June 28. Without a PO, invoices cannot be generated for her placement.",
    what: "Billing readiness check for Sofia Marin (Data Engineer, Atlas Manufacturing) run June 7. All fields complete except: Purchase Order number — empty. Atlas Manufacturing's billing rules require PO before billing can be initiated.",
    why: "Without a PO number, the first timesheet period cannot be invoiced. This creates a revenue gap and may trigger a billing hold. Atlas Manufacturing typically takes 3-5 days to issue a PO.",
    confidence: "high",
    dataUsed: ["Billing readiness gate", "Atlas Manufacturing client billing rules", "Sofia Marin candidate record", "AP cycle time data for Atlas"],
    recommendedAction: "Request the Atlas Manufacturing Account Manager to obtain the PO number from the client's procurement team immediately. Allow 3 business days buffer before start date.",
    approvalRequired: false,
    status: "pending",
    persona: ["super-admin", "account-manager"],
    candidateId: "sofia-marin",
    clientId: "atlas-manufacturing",
    createdAt: "2026-06-07T10:00:00Z",
    urgency: "medium",
  },
  {
    id: "ai-014",
    type: "alert",
    title: "Cobalt Systems promise tracker: credential setup at risk (promised Jun 17)",
    summary: "The Account Manager promised Cobalt Systems that Diego Santos would have full credential access by June 17. Current IT provisioning status does not support meeting this commitment.",
    what: "Client Promise record #CP-114: Account Manager committed to Cobalt Systems (Jennifer Walsh, VP Engineering) that Diego Santos would have all credentials and system access by June 17. Current status: DocuSign counter-signature pending (blocks IT provisioning). Estimated credential setup: June 20-21.",
    why: "Missing a client promise damages the relationship and creates a trust deficit. Cobalt Systems has flagged this placement as critical to their Q3 project timeline.",
    confidence: "medium",
    dataUsed: ["Client Promise Tracker", "DocuSign status", "IT provisioning timeline estimate", "Cobalt Systems account notes"],
    recommendedAction: "Notify Account Manager of the gap between commitment and current trajectory. Draft a client communication with a revised timeline and mitigation plan.",
    approvalRequired: true,
    status: "pending",
    persona: ["super-admin", "account-manager"],
    clientId: "cobalt-systems",
    createdAt: "2026-06-07T10:30:00Z",
    urgency: "high",
  },
];

// ---------------------------------------------------------------------------
// Morning Briefing
// ---------------------------------------------------------------------------

export function getMorningBriefing(): MorningBriefing {
  return {
    date: "2026-06-07",
    activeOnboardings: 18,
    startDatesAtRisk: 4,
    docsRequiringReview: 7,
    backgroundChecksOverSla: 2,
    unresponsiveCandidates: 3,
    aiActionsAwaiting: 5,
    summary:
      "You have 18 active onboardings. 4 start dates are at risk — James Rivera needs an I-9 upload within 24 hours, and Owen Bradley's start date has already passed. 7 documents are in your review queue, 2 background checks at HireRight and Sterling have exceeded SLA thresholds, and 3 candidates have not responded to portal messages in over 48 hours. 5 AI recommendations are awaiting your approval.",
    highlights: [
      { label: "Start dates at risk", count: 4, tone: "danger", href: "/onboarding" },
      { label: "Docs to review", count: 7, tone: "warning", href: "/documents" },
      { label: "BGC over SLA", count: 2, tone: "warning", href: "/screening" },
      { label: "Candidates unresponsive", count: 3, tone: "danger", href: "/communications" },
      { label: "AI actions pending", count: 5, tone: "ai", href: "/my-work" },
    ],
  };
}

// ---------------------------------------------------------------------------
// Candidate AI Summaries
// ---------------------------------------------------------------------------

const CANDIDATE_SUMMARIES: Record<string, CandidateAiSummary> = {
  "james-rivera": {
    candidateId: "james-rivera",
    summary:
      "James Rivera is 3 days from his June 14 start date with Meridian Health and his onboarding is critically behind. His I-9 has not been submitted, which blocks E-Verify, payroll configuration, and client final approval. The candidate's last portal login was 48 hours ago with no document action taken.",
    riskFactors: [
      "I-9 not submitted — federal compliance block",
      "Start date in 3 days — insufficient time for E-Verify",
      "Candidate unresponsive for 48 hours",
      "Payroll readiness gate blocked by missing I-9",
    ],
    nextBestAction: "Send immediate SMS + email with direct I-9 upload link. Escalate to recruiter Devon Hughes for personal outreach within 2 hours.",
    confidence: "high",
    estimatedStartReadiness: 22,
  },
  "grace-okafor": {
    candidateId: "grace-okafor",
    summary:
      "Grace Okafor is progressing at a moderate pace toward her June 23 start date at Meridian Health. Documents are under review and her background check is proceeding normally. The primary risk is her equipment order — approved but not yet shipped, which is time-sensitive for her onsite role in Houston.",
    riskFactors: [
      "Equipment not shipped — 5-7 day lead time required",
      "Document review pending — government ID under examination",
      "Onsite role requires Day 1 equipment delivery",
    ],
    nextBestAction: "Escalate equipment order to IT manager immediately and request expedited shipping.",
    confidence: "high",
    estimatedStartReadiness: 64,
  },
  "marcus-webb": {
    candidateId: "marcus-webb",
    summary:
      "Marcus Webb's onboarding is stalled at the background check stage. Sterling has had his check for 8 days — more than double the average turnaround for his screening package. The Illinois jurisdiction delay is the primary blocker. His June 18 start date with Northwind Logistics is at moderate risk.",
    riskFactors: [
      "Sterling background check pending 8 days (avg: 3.2 days)",
      "Illinois jurisdiction courthouse backlog",
      "Start date June 18 — only 11 days for check to clear",
      "Northwind Logistics client approval requires cleared BGC",
    ],
    nextBestAction: "Contact Sterling account manager to expedite the Illinois county check and request a status update.",
    confidence: "medium",
    estimatedStartReadiness: 51,
  },
  "aisha-bello": {
    candidateId: "aisha-bello",
    summary:
      "Aisha Bello is generally on track for her June 22 start at Vertex Financial. Her background check is in progress and her documents are in good shape. The one remaining blocker is her direct deposit setup — the payroll portal step was skipped and must be completed for payroll to process on Day 1.",
    riskFactors: [
      "Direct deposit not set up — required for first payroll",
      "Background check still in progress (expected to clear by Jun 14)",
    ],
    nextBestAction: "Send a targeted portal reminder with a direct link to the direct deposit setup step.",
    confidence: "high",
    estimatedStartReadiness: 78,
  },
};

const GENERIC_SUMMARY: CandidateAiSummary = {
  candidateId: "unknown",
  summary:
    "This candidate's onboarding is progressing normally. All required documents have been submitted and the background check is underway. Continue monitoring for any outstanding items as the start date approaches.",
  riskFactors: [
    "Background check turnaround dependent on jurisdiction speed",
    "Client approval timing may vary",
  ],
  nextBestAction: "Monitor document review queue and confirm equipment provisioning is on track.",
  confidence: "medium",
  estimatedStartReadiness: 65,
};

export function getCandidateAiSummary(candidateId: string): CandidateAiSummary {
  return (
    CANDIDATE_SUMMARIES[candidateId] ?? {
      ...GENERIC_SUMMARY,
      candidateId,
    }
  );
}

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

export function getRecommendations(persona?: PersonaId): AiRecommendation[] {
  if (!persona) return RECOMMENDATIONS;
  return RECOMMENDATIONS.filter((r) => r.persona.includes(persona));
}
