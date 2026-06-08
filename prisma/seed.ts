/**
 * HireMe — Database Seed
 * Seeds Neon/Postgres with a representative dataset derived from the
 * existing mock data layer (src/lib/*.ts).
 *
 * Run: npm run db:seed
 *      (or: npx prisma db seed)
 */

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

// For seeding we use the direct (non-pooled) URL to avoid pgBouncer limitations
// on transaction mode. Falls back to DATABASE_URL if UNPOOLED isn't set.
const connectionString =
  process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌  DATABASE_URL not found. Create .env.local with Neon credentials.");
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱  Starting seed…");

  // ─────────────────────────────────────────────────────────
  // CLEANUP — delete all rows in FK-safe order so the seed is
  // re-runnable against a non-empty database.
  // ─────────────────────────────────────────────────────────
  console.log("  → Cleaning existing data");

  await prisma.auditEvent.deleteMany({});
  await prisma.communication.deleteMany({});
  await prisma.training.deleteMany({});
  await prisma.equipment.deleteMany({});
  await prisma.screening.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.billingReadiness.deleteMany({});
  await prisma.payrollReadiness.deleteMany({});
  await prisma.exception.deleteMany({});
  await prisma.packageDispatch.deleteMany({});
  await prisma.packageApproval.deleteMany({});
  await prisma.packageRule.deleteMany({});
  await prisma.packageItem.deleteMany({});
  await prisma.package.deleteMany({});
  await prisma.clientPromise.deleteMany({});
  await prisma.complianceRule.deleteMany({});
  await prisma.clientContact.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.consultant.deleteMany({});
  await prisma.candidate.deleteMany({});
  await prisma.client.deleteMany({});

  // ─────────────────────────────────────────────────────────
  // CLIENTS
  // ─────────────────────────────────────────────────────────
  console.log("  → Clients");

  const meridian = await prisma.client.create({
    data: {
      name: "Meridian Health",
      industry: "Healthcare",
      hq: "Nashville, TN",
      accountManager: "Devon Hughes",
      programs: ["Nursing Staff", "Health IT", "Compliance"],
      employmentTypesAllowed: ["W-2", "1099"],
      status: "ACTIVE",
      invoiceFrequency: "Monthly",
      paymentTermsDays: 30,
      vmsPlatform: "Beeline",
      workerIdPrefix: "MH-",
      activeConsultants: 42,
      avgOnboardingDays: 11,
      compliancePassRate: 94,
      startDateSuccessRate: 91,
      since: "2021-03",
      notes: "Healthcare staffing; HIPAA-sensitive. Primary contacts are in HR and IT.",
      contacts: {
        create: [
          { name: "Laura Kim", title: "HR Director", email: "l.kim@meridianhealth.example", type: "primary" },
          { name: "Derek Osei", title: "IT Manager", email: "d.osei@meridianhealth.example", type: "technical" },
        ],
      },
      rules: {
        create: [
          { label: "Criminal Background Check", category: "background", required: true },
          { label: "Drug Screening (5-panel)", category: "drug", required: true },
          { label: "HIPAA Training", category: "training", required: true },
          { label: "Professional License Verification", category: "document", required: true, condition: "Licensed roles only" },
        ],
      },
      promises: {
        create: [
          { label: "Clearance by 2026-06-10", promisedDate: "2026-06-10", status: "on-track" },
          { label: "Screening complete", promisedDate: "2026-06-08", status: "at-risk" },
        ],
      },
    },
  });

  const apexDyn = await prisma.client.create({
    data: {
      name: "Apex Dynamics",
      industry: "Technology",
      hq: "Austin, TX",
      accountManager: "Priya Shah",
      programs: ["Engineering", "Product", "QA"],
      msp: "SAP Fieldglass",
      employmentTypesAllowed: ["W-2", "C2C", "1099"],
      status: "ACTIVE",
      invoiceFrequency: "Bi-weekly",
      paymentTermsDays: 45,
      vmsPlatform: "SAP Fieldglass",
      workerIdPrefix: "AD-",
      activeConsultants: 67,
      avgOnboardingDays: 9,
      compliancePassRate: 97,
      startDateSuccessRate: 95,
      since: "2020-01",
      notes: "High-volume tech client. C2C contractors common. Fieldglass integration is live.",
      contacts: {
        create: [
          { name: "Marcus Lee", title: "Vendor Manager", email: "m.lee@apexdyn.example", type: "primary" },
        ],
      },
      rules: {
        create: [
          { label: "Background Check", category: "background", required: true },
          { label: "Security Training", category: "training", required: true },
          { label: "Acceptable Use Policy", category: "document", required: true },
          { label: "NDA", category: "document", required: true },
        ],
      },
      promises: {
        create: [
          { label: "Start date confirmed", promisedDate: "2026-06-09", status: "on-track" },
        ],
      },
    },
  });

  const globalFin = await prisma.client.create({
    data: {
      name: "Global Finance Corp",
      industry: "Finance",
      hq: "New York, NY",
      accountManager: "Devon Hughes",
      programs: ["Risk & Compliance", "Technology", "Operations"],
      employmentTypesAllowed: ["W-2"],
      status: "AT_RISK",
      invoiceFrequency: "Monthly",
      paymentTermsDays: 60,
      activeConsultants: 29,
      avgOnboardingDays: 16,
      compliancePassRate: 82,
      startDateSuccessRate: 78,
      since: "2022-07",
      notes: "Strict compliance requirements. SOX-sensitive. Slow approval cycles.",
      contacts: {
        create: [
          { name: "Angela Torres", title: "Procurement Lead", email: "a.torres@gfc.example", type: "primary" },
        ],
      },
      rules: {
        create: [
          { label: "Enhanced Background Check (7-year)", category: "background", required: true },
          { label: "Credit Check", category: "background", required: true, condition: "Finance roles" },
          { label: "Drug Screening", category: "drug", required: true },
          { label: "SOX Compliance Training", category: "training", required: true },
        ],
      },
      promises: {
        create: [
          { label: "Background clearance by 2026-06-15", promisedDate: "2026-06-15", status: "at-risk" },
        ],
      },
    },
  });

  await prisma.client.create({
    data: {
      name: "Skyline Retail Group",
      industry: "Retail",
      hq: "Chicago, IL",
      accountManager: "Priya Shah",
      programs: ["Corporate", "Store Operations"],
      employmentTypesAllowed: ["W-2", "1099"],
      status: "ACTIVE",
      invoiceFrequency: "Monthly",
      paymentTermsDays: 30,
      activeConsultants: 18,
      avgOnboardingDays: 8,
      compliancePassRate: 91,
      startDateSuccessRate: 93,
      since: "2023-02",
      notes: "Seasonal volume spikes. Streamlined package.",
      contacts: {
        create: [
          { name: "James Ford", title: "HR Manager", email: "j.ford@skylineretail.example", type: "primary" },
        ],
      },
      rules: {
        create: [
          { label: "Background Check", category: "background", required: true },
          { label: "Retail Code of Conduct", category: "document", required: true },
        ],
      },
    },
  });

  await prisma.client.create({
    data: {
      name: "NovaTech Solutions",
      industry: "Technology",
      hq: "Seattle, WA",
      accountManager: "Priya Shah",
      programs: ["Cloud Engineering", "DevOps"],
      employmentTypesAllowed: ["W-2", "C2C"],
      status: "ACTIVE",
      invoiceFrequency: "Bi-weekly",
      paymentTermsDays: 30,
      activeConsultants: 24,
      avgOnboardingDays: 10,
      compliancePassRate: 96,
      startDateSuccessRate: 94,
      since: "2023-09",
      notes: "Fast-moving cloud team. C2C common for senior engineers.",
      contacts: {
        create: [
          { name: "Yuki Tanaka", title: "Engineering VP", email: "y.tanaka@novatech.example", type: "primary" },
        ],
      },
      rules: {
        create: [
          { label: "Background Check", category: "background", required: true },
          { label: "Security Awareness Training", category: "training", required: true },
          { label: "IP Agreement", category: "document", required: true },
        ],
      },
    },
  });

  // ─────────────────────────────────────────────────────────
  // CANDIDATES
  // ─────────────────────────────────────────────────────────
  console.log("  → Candidates");

  const candidateSeed = [
    {
      id: "james-rivera",
      firstName: "James",
      lastName: "Rivera",
      email: "james.rivera@example.com",
      phone: "(512) 555-0142",
      status: "ONBOARDING" as const,
      risk: "AT_RISK" as const,
      progress: 68,
      stage: "Background Check",
      employmentType: "W2" as const,
      workLocation: "Austin, TX (Hybrid)",
      startDate: new Date("2026-06-12"),
      clientName: "Apex Dynamics",
      recruiter: "Mia Thompson",
      onboarder: "Carlos Rivera",
      tags: ["priority", "engineering"],
      skills: ["React", "TypeScript", "Node.js", "AWS"],
      skillFamily: "Software Engineering",
      skillConfidence: 0.91,
      lastContact: new Date("2026-06-06"),
    },
    {
      id: "grace-okafor",
      firstName: "Grace",
      lastName: "Okafor",
      email: "grace.okafor@example.com",
      phone: "(615) 555-0289",
      status: "ONBOARDING" as const,
      risk: "ON_TRACK" as const,
      progress: 82,
      stage: "Document Review",
      employmentType: "W2" as const,
      workLocation: "Nashville, TN (Onsite)",
      startDate: new Date("2026-06-09"),
      clientName: "Meridian Health",
      recruiter: "Sandra Lee",
      onboarder: "Carlos Rivera",
      tags: ["healthcare"],
      skills: ["Epic EHR", "HIPAA Compliance", "Clinical Informatics"],
      skillFamily: "Healthcare IT",
      skillConfidence: 0.88,
      lastContact: new Date("2026-06-07"),
    },
    {
      id: "marcus-webb",
      firstName: "Marcus",
      lastName: "Webb",
      email: "marcus.webb@example.com",
      phone: "(332) 555-0371",
      status: "ONBOARDING" as const,
      risk: "NEEDS_ATTENTION" as const,
      progress: 45,
      stage: "Tax & Payroll",
      employmentType: "C2C" as const,
      workLocation: "New York, NY (Remote)",
      startDate: new Date("2026-06-16"),
      clientName: "Global Finance Corp",
      recruiter: "Mia Thompson",
      onboarder: "Aisha Ndiaye",
      vendor: "TechBridge LLC",
      tags: ["finance", "senior"],
      skills: ["Risk Analytics", "Python", "SQL", "Bloomberg Terminal"],
      skillFamily: "Financial Technology",
      skillConfidence: 0.85,
      lastContact: new Date("2026-06-05"),
    },
    {
      id: "aisha-bello",
      firstName: "Aisha",
      lastName: "Bello",
      email: "aisha.bello@example.com",
      phone: "(206) 555-0458",
      status: "OFFER_ACCEPTED" as const,
      risk: "ON_TRACK" as const,
      progress: 22,
      stage: "Profile Setup",
      employmentType: "W2" as const,
      workLocation: "Seattle, WA (Remote)",
      startDate: new Date("2026-06-23"),
      clientName: "NovaTech Solutions",
      recruiter: "Derek Okafor",
      onboarder: "Aisha Ndiaye",
      tags: ["cloud", "devops"],
      skills: ["Kubernetes", "Terraform", "AWS", "CI/CD"],
      skillFamily: "DevOps & Cloud",
      skillConfidence: 0.93,
      lastContact: new Date("2026-06-07"),
    },
    {
      id: "lena-park",
      firstName: "Lena",
      lastName: "Park",
      email: "lena.park@example.com",
      phone: "(312) 555-0537",
      status: "ONBOARDING" as const,
      risk: "ON_TRACK" as const,
      progress: 91,
      stage: "Day 1 Prep",
      employmentType: "W2" as const,
      workLocation: "Chicago, IL (Hybrid)",
      startDate: new Date("2026-06-08"),
      clientName: "Skyline Retail Group",
      recruiter: "Sandra Lee",
      onboarder: "Carlos Rivera",
      tags: ["retail"],
      skills: ["SAP Retail", "Merchandising Analytics"],
      skillFamily: "Retail Operations",
      skillConfidence: 0.80,
      lastContact: new Date("2026-06-07"),
    },
    {
      id: "raj-patel",
      firstName: "Raj",
      lastName: "Patel",
      email: "raj.patel@example.com",
      phone: "(512) 555-0612",
      status: "ONBOARDING" as const,
      risk: "AT_RISK" as const,
      progress: 55,
      stage: "Client Requirements",
      employmentType: "C2C" as const,
      workLocation: "Austin, TX (Onsite)",
      startDate: new Date("2026-06-10"),
      clientName: "Apex Dynamics",
      recruiter: "Derek Okafor",
      onboarder: "Aisha Ndiaye",
      vendor: "CodeBridge Partners",
      tags: ["engineering", "backend"],
      skills: ["Java", "Spring Boot", "Kafka", "AWS"],
      skillFamily: "Software Engineering",
      skillConfidence: 0.87,
      lastContact: new Date("2026-06-04"),
    },
  ];

  for (const c of candidateSeed) {
    await prisma.candidate.create({ data: c });
  }

  // ─────────────────────────────────────────────────────────
  // PACKAGES
  // ─────────────────────────────────────────────────────────
  console.log("  → Packages");

  const pkg1 = await prisma.package.create({
    data: {
      id: "pkg-meridian-nursing-001",
      name: "Meridian Health — Nursing Staff W-2",
      version: "2.1",
      status: "PUBLISHED",
      clientId: meridian.id,
      employmentType: "W-2",
      workLocation: "Nashville, TN (Onsite)",
      jobCategory: "Healthcare",
      owner: "Aisha Ndiaye",
      approver: "Devon Hughes",
      riskScore: 22,
      completionPct: 100,
      aiReviewStatus: "approved",
      consultant: "Grace Okafor",
      items: {
        create: [
          { section: "Identity & Authorization", type: "form", label: "I-9 Employment Eligibility", required: true },
          { section: "Identity & Authorization", type: "document", label: "E-Verify Submission", required: true },
          { section: "Tax & Payroll", type: "form", label: "Federal W-4", required: true },
          { section: "Tax & Payroll", type: "form", label: "Tennessee State Tax Form", required: true },
          { section: "Tax & Payroll", type: "form", label: "Direct Deposit Authorization", required: true },
          { section: "Client Requirements", type: "document", label: "Meridian Health NDA", required: true },
          { section: "Client Requirements", type: "document", label: "HIPAA Acknowledgment", required: true },
          { section: "Background & Screening", type: "screening", label: "Criminal Background Check", required: true },
          { section: "Background & Screening", type: "screening", label: "Drug Screen (5-panel)", required: true },
          { section: "Training", type: "training", label: "HIPAA Privacy Training", required: true },
          { section: "Training", type: "training", label: "OSHA Safety Training", required: true },
          { section: "Agreements", type: "document", label: "Employment Agreement", required: true },
        ],
      },
      rules: {
        create: [
          { condition: "Client = Meridian Health", applies: true, reason: "Client-specific NDA and HIPAA required", category: "client" },
          { condition: "Employment Type = W-2", applies: true, reason: "W-4 and state tax forms mandatory for W-2 workers", category: "employment" },
          { condition: "Industry = Healthcare", applies: true, reason: "HIPAA training required for all healthcare roles", category: "compliance" },
        ],
      },
      approvals: {
        create: [
          { approver: "Devon Hughes", role: "Account Manager", status: "approved", approvedAt: new Date("2026-05-15") },
          { approver: "Aisha Ndiaye", role: "HR Operations Lead", status: "approved", approvedAt: new Date("2026-05-16") },
        ],
      },
      dispatches: {
        create: [
          { channel: "portal", sentAt: new Date("2026-05-28"), status: "delivered" },
          { channel: "email", sentAt: new Date("2026-05-28"), status: "delivered" },
        ],
      },
    },
  });

  await prisma.package.create({
    data: {
      id: "pkg-apex-engineering-001",
      name: "Apex Dynamics — Engineering C2C",
      version: "1.3",
      status: "PUBLISHED",
      clientId: apexDyn.id,
      employmentType: "C2C",
      workLocation: "Austin, TX",
      jobCategory: "Technology",
      owner: "Carlos Rivera",
      approver: "Priya Shah",
      riskScore: 41,
      completionPct: 68,
      aiReviewStatus: "warnings",
      consultant: "James Rivera",
      items: {
        create: [
          { section: "Identity & Authorization", type: "form", label: "I-9 Employment Eligibility", required: true },
          { section: "Tax & Payroll", type: "form", label: "Federal W-9 (C2C)", required: true },
          { section: "Client Requirements", type: "document", label: "Apex Dynamics NDA", required: true },
          { section: "Client Requirements", type: "document", label: "Acceptable Use Policy", required: true },
          { section: "Client Requirements", type: "document", label: "Security Policy Acknowledgment", required: true },
          { section: "Background & Screening", type: "screening", label: "Criminal Background Check", required: true },
          { section: "Training", type: "training", label: "Security Awareness Training", required: true },
          { section: "Agreements", type: "document", label: "Vendor / Corp-to-Corp Agreement", required: true },
          { section: "Agreements", type: "document", label: "Business Associate Agreement", required: false, conditional: "If vendor handles PII" },
        ],
      },
      rules: {
        create: [
          { condition: "Client = Apex Dynamics", applies: true, reason: "Apex NDA and security policy required", category: "client" },
          { condition: "Employment Type = C2C", applies: true, reason: "W-9 and vendor agreement replace W-4 and employment agreement", category: "employment" },
          { condition: "VMS = SAP Fieldglass", applies: true, reason: "Fieldglass worker ID must be confirmed before start", category: "integration" },
        ],
      },
      approvals: {
        create: [
          { approver: "Priya Shah", role: "Account Manager", status: "pending" },
        ],
      },
      dispatches: {
        create: [
          { channel: "portal", sentAt: new Date("2026-06-01"), status: "delivered" },
        ],
      },
    },
  });

  await prisma.package.create({
    data: {
      id: "pkg-gfc-finance-001",
      name: "Global Finance Corp — Risk Analytics W-2",
      version: "1.0",
      status: "IN_REVIEW",
      clientId: globalFin.id,
      employmentType: "W-2",
      workLocation: "New York, NY (Remote)",
      jobCategory: "Finance",
      owner: "Aisha Ndiaye",
      approver: "Devon Hughes",
      riskScore: 67,
      completionPct: 45,
      aiReviewStatus: "errors",
      consultant: "Marcus Webb",
      items: {
        create: [
          { section: "Identity & Authorization", type: "form", label: "I-9 Employment Eligibility", required: true },
          { section: "Tax & Payroll", type: "form", label: "Federal W-4", required: true },
          { section: "Tax & Payroll", type: "form", label: "New York State Tax IT-2104", required: true },
          { section: "Client Requirements", type: "document", label: "GFC Confidentiality Agreement", required: true },
          { section: "Background & Screening", type: "screening", label: "Enhanced 7-Year Background Check", required: true },
          { section: "Background & Screening", type: "screening", label: "Credit Check", required: true },
          { section: "Training", type: "training", label: "SOX Compliance Training", required: true },
          { section: "Agreements", type: "document", label: "Employment Agreement", required: true },
        ],
      },
      rules: {
        create: [
          { condition: "Client = Global Finance Corp", applies: true, reason: "GFC requires enhanced 7-year background and credit check", category: "client" },
          { condition: "State = New York", applies: true, reason: "NY IT-2104 state tax form required", category: "location" },
          { condition: "Industry = Finance", applies: true, reason: "SOX compliance training required for financial services", category: "compliance" },
        ],
      },
      approvals: {
        create: [
          { approver: "Devon Hughes", role: "Account Manager", status: "pending" },
          { approver: "Legal Review", role: "Legal", status: "pending" },
        ],
      },
    },
  });

  // ─────────────────────────────────────────────────────────
  // DOCUMENTS — Grace Okafor (Document Review, 82%)
  // ─────────────────────────────────────────────────────────
  console.log("  → Documents");

  const graceCandidate = await prisma.candidate.findUnique({ where: { email: "grace.okafor@example.com" } });
  if (graceCandidate) {
    const docs = [
      { name: "Government-issued ID (Passport)", category: "identity", status: "APPROVED" as const, uploadedAt: new Date("2026-05-30") },
      { name: "Social Security Card", category: "identity", status: "APPROVED" as const, uploadedAt: new Date("2026-05-30") },
      { name: "I-9 Form", category: "authorization", status: "APPROVED" as const, uploadedAt: new Date("2026-05-31") },
      { name: "Federal W-4", category: "tax", status: "APPROVED" as const, uploadedAt: new Date("2026-05-31") },
      { name: "Tennessee State Tax Form", category: "tax", status: "APPROVED" as const, uploadedAt: new Date("2026-05-31") },
      { name: "Direct Deposit Authorization", category: "payroll", status: "APPROVED" as const, uploadedAt: new Date("2026-06-01") },
      { name: "Meridian Health NDA", category: "client", status: "APPROVED" as const, uploadedAt: new Date("2026-06-01") },
      { name: "HIPAA Acknowledgment", category: "compliance", status: "AI_REVIEW" as const, uploadedAt: new Date("2026-06-06") },
    ];
    for (const doc of docs) {
      await prisma.document.create({
        data: { candidateId: graceCandidate.id, ...doc },
      });
    }
  }

  // ─────────────────────────────────────────────────────────
  // DOCUMENTS — Lena Park (Day 1 Prep, 91%) — all approved
  // ─────────────────────────────────────────────────────────
  const lenaPark = await prisma.candidate.findUnique({ where: { email: "lena.park@example.com" } });
  if (lenaPark) {
    await prisma.document.create({ data: { candidateId: lenaPark.id, name: "Government-issued ID (Driver's License)", category: "identity", status: "APPROVED", uploadedAt: new Date("2026-05-26"), reviewedAt: new Date("2026-05-27"), reviewedBy: "Carlos Rivera", aiScore: 98 } });
    await prisma.document.create({ data: { candidateId: lenaPark.id, name: "Social Security Card", category: "identity", status: "APPROVED", uploadedAt: new Date("2026-05-26"), reviewedAt: new Date("2026-05-27"), reviewedBy: "Carlos Rivera", aiScore: 97 } });
    await prisma.document.create({ data: { candidateId: lenaPark.id, name: "I-9 Form", category: "authorization", status: "APPROVED", uploadedAt: new Date("2026-05-27"), reviewedAt: new Date("2026-05-28"), reviewedBy: "Carlos Rivera", aiScore: 99 } });
    await prisma.document.create({ data: { candidateId: lenaPark.id, name: "Federal W-4", category: "tax", status: "APPROVED", uploadedAt: new Date("2026-05-27"), reviewedAt: new Date("2026-05-28"), reviewedBy: "Carlos Rivera", aiScore: 100 } });
    await prisma.document.create({ data: { candidateId: lenaPark.id, name: "Illinois State Tax Form (IL-W-4)", category: "tax", status: "APPROVED", uploadedAt: new Date("2026-05-27"), reviewedAt: new Date("2026-05-28"), reviewedBy: "Carlos Rivera", aiScore: 100 } });
    await prisma.document.create({ data: { candidateId: lenaPark.id, name: "Direct Deposit Authorization", category: "payroll", status: "APPROVED", uploadedAt: new Date("2026-05-28"), reviewedAt: new Date("2026-05-29"), reviewedBy: "Carlos Rivera", aiScore: 99 } });
    await prisma.document.create({ data: { candidateId: lenaPark.id, name: "Skyline Retail Group NDA", category: "client", status: "APPROVED", uploadedAt: new Date("2026-05-29"), reviewedAt: new Date("2026-05-30"), reviewedBy: "Carlos Rivera", aiScore: 96 } });
    await prisma.document.create({ data: { candidateId: lenaPark.id, name: "SAP Retail Training Certificate", category: "certification", status: "APPROVED", uploadedAt: new Date("2026-06-02"), reviewedAt: new Date("2026-06-03"), reviewedBy: "Carlos Rivera", aiScore: 95 } });
  }

  // ─────────────────────────────────────────────────────────
  // DOCUMENTS — Marcus Webb (Tax & Payroll, 45%, C2C)
  // ─────────────────────────────────────────────────────────
  const marcusWebb = await prisma.candidate.findUnique({ where: { email: "marcus.webb@example.com" } });
  if (marcusWebb) {
    await prisma.document.create({ data: { candidateId: marcusWebb.id, name: "I-9 Form", category: "authorization", status: "APPROVED", uploadedAt: new Date("2026-06-02"), reviewedAt: new Date("2026-06-03"), reviewedBy: "Aisha Ndiaye", aiScore: 96 } });
    await prisma.document.create({ data: { candidateId: marcusWebb.id, name: "Federal W-9 (TechBridge LLC)", category: "tax", status: "REJECTED", uploadedAt: new Date("2026-06-03"), reviewedAt: new Date("2026-06-04"), reviewedBy: "Aisha Ndiaye", aiScore: 61, rejectedReason: "Entity name on W-9 does not match vendor agreement — shows 'TechBridge' instead of 'TechBridge LLC'. Please resubmit with the correct legal entity name." } });
    await prisma.document.create({ data: { candidateId: marcusWebb.id, name: "New York State Tax IT-2104", category: "tax", status: "PENDING", uploadedAt: new Date("2026-06-05") } });
    await prisma.document.create({ data: { candidateId: marcusWebb.id, name: "GFC Confidentiality Agreement", category: "client", status: "PENDING", uploadedAt: new Date("2026-06-05") } });
  }

  // ─────────────────────────────────────────────────────────
  // DOCUMENTS — Raj Patel (Client Requirements, 55%, C2C)
  // ─────────────────────────────────────────────────────────
  const rajPatel = await prisma.candidate.findUnique({ where: { email: "raj.patel@example.com" } });
  if (rajPatel) {
    await prisma.document.create({ data: { candidateId: rajPatel.id, name: "I-9 Form", category: "authorization", status: "APPROVED", uploadedAt: new Date("2026-06-01"), reviewedAt: new Date("2026-06-02"), reviewedBy: "Aisha Ndiaye", aiScore: 98 } });
    await prisma.document.create({ data: { candidateId: rajPatel.id, name: "Federal W-9 (CodeBridge Partners)", category: "tax", status: "APPROVED", uploadedAt: new Date("2026-06-01"), reviewedAt: new Date("2026-06-02"), reviewedBy: "Aisha Ndiaye", aiScore: 94 } });
    await prisma.document.create({ data: { candidateId: rajPatel.id, name: "Apex Dynamics NDA", category: "client", status: "AI_REVIEW", uploadedAt: new Date("2026-06-04"), aiScore: 82 } });
    await prisma.document.create({ data: { candidateId: rajPatel.id, name: "Apex Security Policy Acknowledgment", category: "client", status: "PENDING" } });
    await prisma.document.create({ data: { candidateId: rajPatel.id, name: "Acceptable Use Policy", category: "client", status: "PENDING" } });
  }

  // ─────────────────────────────────────────────────────────
  // DOCUMENTS — Aisha Bello (Profile Setup, 22%)
  // ─────────────────────────────────────────────────────────
  const aishaBello = await prisma.candidate.findUnique({ where: { email: "aisha.bello@example.com" } });
  if (aishaBello) {
    await prisma.document.create({ data: { candidateId: aishaBello.id, name: "Passport (US)", category: "identity", status: "APPROVED", uploadedAt: new Date("2026-06-07"), reviewedAt: new Date("2026-06-07"), reviewedBy: "Aisha Ndiaye", aiScore: 99 } });
    await prisma.document.create({ data: { candidateId: aishaBello.id, name: "I-9 Form", category: "authorization", status: "PENDING" } });
  }

  // ─────────────────────────────────────────────────────────
  // SCREENING
  // ─────────────────────────────────────────────────────────
  console.log("  → Screening");

  const jamesCandidate = await prisma.candidate.findUnique({ where: { email: "james.rivera@example.com" } });
  if (jamesCandidate) {
    await prisma.screening.create({
      data: {
        candidateId: jamesCandidate.id,
        vendor: "HireRight",
        packageType: "Standard Criminal + Drug",
        status: "VENDOR_DELAYED",
        orderedAt: new Date("2026-06-02"),
        consentedAt: new Date("2026-06-02"),
        estimatedCompletion: new Date("2026-06-10"),
        cost: 89.00,
        notes: "Travis County court records delay — 3–5 business days additional",
      },
    });
  }

  if (graceCandidate) {
    await prisma.screening.create({
      data: {
        candidateId: graceCandidate.id,
        vendor: "Sterling",
        packageType: "Healthcare Background",
        status: "IN_PROGRESS",
        orderedAt: new Date("2026-06-01"),
        consentedAt: new Date("2026-06-01"),
        estimatedCompletion: new Date("2026-06-09"),
        cost: 149.00,
      },
    });
  }

  // Lena Park — completed clear (Day 1 Prep, essentially done)
  if (lenaPark) {
    await prisma.screening.create({
      data: {
        candidateId: lenaPark.id,
        vendor: "Sterling",
        packageType: "Standard Criminal",
        status: "CLEAR",
        orderedAt: new Date("2026-06-01"),
        consentedAt: new Date("2026-06-01"),
        completedAt: new Date("2026-06-06"),
        estimatedCompletion: new Date("2026-06-07"),
        cost: 79.00,
        notes: "All checks passed. No adverse findings.",
      },
    });
  }

  // Marcus Webb — ordered, not yet consented
  if (marcusWebb) {
    await prisma.screening.create({
      data: {
        candidateId: marcusWebb.id,
        vendor: "HireRight",
        packageType: "Enhanced 7-Year + Credit Check",
        status: "ORDERED",
        orderedAt: new Date("2026-06-05"),
        estimatedCompletion: new Date("2026-06-13"),
        cost: 195.00,
        notes: "Candidate has not yet accepted screening invitation. Follow-up required.",
      },
    });
  }

  // Raj Patel — in progress, consented
  if (rajPatel) {
    await prisma.screening.create({
      data: {
        candidateId: rajPatel.id,
        vendor: "Sterling",
        packageType: "Standard Criminal",
        status: "IN_PROGRESS",
        orderedAt: new Date("2026-06-03"),
        consentedAt: new Date("2026-06-04"),
        estimatedCompletion: new Date("2026-06-10"),
        cost: 89.00,
      },
    });
  }

  // Aisha Bello — no screening yet (Profile Setup stage)

  // ─────────────────────────────────────────────────────────
  // EQUIPMENT
  // ─────────────────────────────────────────────────────────
  console.log("  → Equipment");

  if (jamesCandidate) {
    await prisma.equipment.create({
      data: {
        candidateId: jamesCandidate.id,
        assetType: "laptop",
        label: "MacBook Pro 16\" (M4)",
        status: "SHIPPED",
        trackingNumber: "1Z999AA10123456784",
        carrier: "UPS",
        shippedAt: new Date("2026-06-05"),
        estimatedDelivery: new Date("2026-06-09"),
        emailProvisioned: true,
        vpnProvisioned: false,
        clientCredentials: false,
        deviceEnrolled: false,
        returnRequired: false,
      },
    });
  }

  // Lena Park — laptop fully ready, all IT provisioned
  if (lenaPark) {
    await prisma.equipment.create({
      data: {
        candidateId: lenaPark.id,
        assetType: "laptop",
        label: "Dell Latitude 15",
        status: "READY",
        trackingNumber: "7489234710000192",
        carrier: "FedEx",
        shippedAt: new Date("2026-06-04"),
        estimatedDelivery: new Date("2026-06-07"),
        deliveredAt: new Date("2026-06-07"),
        emailProvisioned: true,
        vpnProvisioned: true,
        clientCredentials: true,
        deviceEnrolled: true,
        returnRequired: false,
        notes: "Device confirmed received and enrolled by candidate on Jun 7.",
      },
    });
  }

  // Marcus Webb, Raj Patel, Aisha Bello — no equipment yet

  // ─────────────────────────────────────────────────────────
  // EXCEPTIONS
  // ─────────────────────────────────────────────────────────
  console.log("  → Exceptions");

  if (jamesCandidate) {
    await prisma.exception.create({
      data: {
        candidateId: jamesCandidate.id,
        category: "Background Check Delay",
        severity: "HIGH",
        status: "OPEN",
        title: "Background check delayed — Travis County court records",
        description: "Travis County court records are taking 3–5 business days longer than estimated. Candidate start date is June 12.",
        owner: "Carlos Rivera",
        resolutionDeadline: new Date("2026-06-10"),
        startDateImpact: true,
        internalNote: "May need to request client approval for conditional start.",
      },
    });
  }

  if (graceCandidate) {
    await prisma.exception.create({
      data: {
        candidateId: graceCandidate.id,
        category: "Document Pending Review",
        severity: "LOW",
        status: "IN_PROGRESS",
        title: "HIPAA Acknowledgment under AI review",
        description: "AI detected possible signature missing on page 3. Awaiting human review.",
        owner: "Carlos Rivera",
        resolutionDeadline: new Date("2026-06-08"),
        startDateImpact: false,
        internalNote: "Grace uploaded at 4:15 PM — review queued.",
      },
    });
  }

  if (marcusWebb) {
    await prisma.exception.create({
      data: {
        candidateId: marcusWebb.id,
        category: "Missing Document",
        severity: "HIGH",
        status: "OPEN",
        title: "W-9 rejected — incorrect entity name",
        description: "W-9 submitted with entity name 'TechBridge' instead of the registered legal entity 'TechBridge LLC'. Candidate must resubmit corrected form before payroll can be configured.",
        owner: "Aisha Ndiaye",
        resolutionDeadline: new Date("2026-06-09"),
        startDateImpact: true,
        internalNote: "Recruiter Mia Thompson notified. Candidate acknowledged via SMS on Jun 5.",
      },
    });
    await prisma.exception.create({
      data: {
        candidateId: marcusWebb.id,
        category: "Screening Not Started",
        severity: "MEDIUM",
        status: "OPEN",
        title: "Screening invitation not accepted — start date June 16",
        description: "HireRight invitation was sent on June 5 but candidate has not consented. Enhanced 7-year check typically takes 7–10 business days. Risk of missing start date is increasing.",
        owner: "Aisha Ndiaye",
        resolutionDeadline: new Date("2026-06-07"),
        startDateImpact: true,
        internalNote: "Nudge sent via SMS Jun 6. Escalating to recruiter if no response by Jun 7 EOD.",
      },
    });
  }

  if (rajPatel) {
    await prisma.exception.create({
      data: {
        candidateId: rajPatel.id,
        category: "Document Pending Review",
        severity: "MEDIUM",
        status: "IN_PROGRESS",
        title: "Apex NDA pending — client requirements outstanding",
        description: "Security Policy Acknowledgment and Acceptable Use Policy are outstanding. Start date is June 10 — only 3 days away.",
        owner: "Aisha Ndiaye",
        resolutionDeadline: new Date("2026-06-09"),
        startDateImpact: true,
        internalNote: "AI nudge sent Jun 6. Account Manager Priya Shah alerted.",
      },
    });
  }

  // ─────────────────────────────────────────────────────────
  // PAYROLL & BILLING READINESS
  // ─────────────────────────────────────────────────────────
  console.log("  → Readiness Gates");

  if (graceCandidate) {
    await prisma.payrollReadiness.create({
      data: {
        candidateId: graceCandidate.id,
        status: "READY",
        classification: true, payRate: true, overtimeRules: true,
        taxJurisdiction: true, directDeposit: true, w4: true,
        stateTax: true, i9: true, benefitsEligibility: true,
        payrollEntity: true, startDateSet: true,
      },
    });
    await prisma.billingReadiness.create({
      data: {
        candidateId: graceCandidate.id,
        status: "READY",
        billRate: true, markup: true, purchaseOrder: true,
        costCenter: true, clientWorkerId: true, vmsId: true,
        invoiceFrequency: true, timesheetMethod: true, expensePolicy: true,
        billingEntity: true, approvedStartDate: true,
        clientWorkerId2: "MH-00421",
      },
    });
  }

  if (jamesCandidate) {
    await prisma.payrollReadiness.create({
      data: {
        candidateId: jamesCandidate.id,
        status: "NOT_READY",
        classification: true, payRate: true, overtimeRules: true,
        taxJurisdiction: true, directDeposit: false, w4: false,
        stateTax: false, i9: true, benefitsEligibility: true,
        payrollEntity: true, startDateSet: true,
      },
    });
    await prisma.billingReadiness.create({
      data: {
        candidateId: jamesCandidate.id,
        status: "NOT_READY",
        billRate: true, markup: true, purchaseOrder: false,
        costCenter: false, clientWorkerId: false, vmsId: false,
        invoiceFrequency: true, timesheetMethod: true, expensePolicy: true,
        billingEntity: true, approvedStartDate: false,
      },
    });
  }

  // Lena Park — fully ready (Day 1 Prep, 91%)
  if (lenaPark) {
    await prisma.payrollReadiness.create({
      data: {
        candidateId: lenaPark.id,
        status: "READY",
        classification: true, payRate: true, overtimeRules: true,
        taxJurisdiction: true, directDeposit: true, w4: true,
        stateTax: true, i9: true, benefitsEligibility: true,
        payrollEntity: true, startDateSet: true,
      },
    });
    await prisma.billingReadiness.create({
      data: {
        candidateId: lenaPark.id,
        status: "READY",
        billRate: true, markup: true, purchaseOrder: true,
        costCenter: true, clientWorkerId: true, vmsId: true,
        invoiceFrequency: true, timesheetMethod: true, expensePolicy: true,
        billingEntity: true, approvedStartDate: true,
        clientWorkerId2: "SRG-00892",
      },
    });
  }

  // Marcus Webb — not ready (W-9 rejected, C2C setup blocked)
  if (marcusWebb) {
    await prisma.payrollReadiness.create({
      data: {
        candidateId: marcusWebb.id,
        status: "NOT_READY",
        classification: true, payRate: true, overtimeRules: true,
        taxJurisdiction: true, directDeposit: false, w4: false,
        stateTax: false, i9: true, benefitsEligibility: false,
        payrollEntity: true, startDateSet: true,
      },
    });
    await prisma.billingReadiness.create({
      data: {
        candidateId: marcusWebb.id,
        status: "NOT_READY",
        billRate: true, markup: true, purchaseOrder: false,
        costCenter: false, clientWorkerId: false, vmsId: false,
        invoiceFrequency: true, timesheetMethod: true, expensePolicy: true,
        billingEntity: true, approvedStartDate: false,
      },
    });
  }

  // Raj Patel — partial (C2C, client docs outstanding, screening in progress)
  if (rajPatel) {
    await prisma.payrollReadiness.create({
      data: {
        candidateId: rajPatel.id,
        status: "PENDING",
        classification: true, payRate: true, overtimeRules: true,
        taxJurisdiction: true, directDeposit: false, w4: false,
        stateTax: false, i9: true, benefitsEligibility: false,
        payrollEntity: true, startDateSet: true,
      },
    });
    await prisma.billingReadiness.create({
      data: {
        candidateId: rajPatel.id,
        status: "NOT_READY",
        billRate: true, markup: true, purchaseOrder: false,
        costCenter: true, clientWorkerId: false, vmsId: false,
        invoiceFrequency: true, timesheetMethod: true, expensePolicy: true,
        billingEntity: true, approvedStartDate: false,
      },
    });
  }

  // Aisha Bello — not ready (just started, Profile Setup)
  if (aishaBello) {
    await prisma.payrollReadiness.create({
      data: {
        candidateId: aishaBello.id,
        status: "NOT_READY",
        classification: true, payRate: false, overtimeRules: false,
        taxJurisdiction: false, directDeposit: false, w4: false,
        stateTax: false, i9: false, benefitsEligibility: false,
        payrollEntity: false, startDateSet: true,
      },
    });
    await prisma.billingReadiness.create({
      data: {
        candidateId: aishaBello.id,
        status: "NOT_READY",
        billRate: true, markup: true, purchaseOrder: false,
        costCenter: false, clientWorkerId: false, vmsId: false,
        invoiceFrequency: true, timesheetMethod: true, expensePolicy: true,
        billingEntity: true, approvedStartDate: false,
      },
    });
  }

  // ─────────────────────────────────────────────────────────
  // TRAINING
  // ─────────────────────────────────────────────────────────
  console.log("  → Training");

  if (graceCandidate) {
    await prisma.training.createMany({
      data: [
        {
          candidateId: graceCandidate.id,
          title: "HIPAA Privacy & Security",
          category: "compliance",
          status: "COMPLETED",
          score: 94,
          completedAt: new Date("2026-06-03"),
          required: true,
        },
        {
          candidateId: graceCandidate.id,
          title: "OSHA Safety Fundamentals",
          category: "safety",
          status: "COMPLETED",
          score: 88,
          completedAt: new Date("2026-06-04"),
          required: true,
        },
      ],
    });
  }

  if (jamesCandidate) {
    await prisma.training.createMany({
      data: [
        {
          candidateId: jamesCandidate.id,
          title: "Security Awareness Training",
          category: "security",
          status: "STARTED",
          dueDate: new Date("2026-06-10"),
          required: true,
        },
        {
          candidateId: jamesCandidate.id,
          title: "Acceptable Use Policy Acknowledgment",
          category: "compliance",
          status: "ASSIGNED",
          dueDate: new Date("2026-06-10"),
          required: true,
        },
      ],
    });
  }

  // Lena Park — both completed (Day 1 Prep)
  if (lenaPark) {
    await prisma.training.createMany({
      data: [
        {
          candidateId: lenaPark.id,
          title: "SAP Retail System Orientation",
          category: "systems",
          status: "COMPLETED",
          score: 91,
          completedAt: new Date("2026-06-04"),
          required: true,
        },
        {
          candidateId: lenaPark.id,
          title: "Loss Prevention Training",
          category: "compliance",
          status: "COMPLETED",
          score: 89,
          completedAt: new Date("2026-06-05"),
          required: true,
        },
      ],
    });
  }

  // Marcus Webb — both assigned (Tax & Payroll stage, not yet at training)
  if (marcusWebb) {
    await prisma.training.createMany({
      data: [
        {
          candidateId: marcusWebb.id,
          title: "SOX Compliance Training",
          category: "compliance",
          status: "ASSIGNED",
          dueDate: new Date("2026-06-13"),
          required: true,
        },
        {
          candidateId: marcusWebb.id,
          title: "GFC Security Orientation",
          category: "security",
          status: "ASSIGNED",
          dueDate: new Date("2026-06-13"),
          required: true,
        },
      ],
    });
  }

  // Raj Patel — one started, one assigned
  if (rajPatel) {
    await prisma.training.createMany({
      data: [
        {
          candidateId: rajPatel.id,
          title: "Security Awareness Training",
          category: "security",
          status: "STARTED",
          dueDate: new Date("2026-06-09"),
          required: true,
        },
        {
          candidateId: rajPatel.id,
          title: "Apex Dynamics Acceptable Use Policy Acknowledgment",
          category: "compliance",
          status: "ASSIGNED",
          dueDate: new Date("2026-06-09"),
          required: true,
        },
      ],
    });
  }

  // Aisha Bello — both assigned (just started onboarding)
  if (aishaBello) {
    await prisma.training.createMany({
      data: [
        {
          candidateId: aishaBello.id,
          title: "Security Fundamentals",
          category: "security",
          status: "ASSIGNED",
          dueDate: new Date("2026-06-20"),
          required: true,
        },
        {
          candidateId: aishaBello.id,
          title: "AWS Acceptable Use Policy Training",
          category: "compliance",
          status: "ASSIGNED",
          dueDate: new Date("2026-06-20"),
          required: true,
        },
      ],
    });
  }

  // ─────────────────────────────────────────────────────────
  // COMMUNICATIONS
  // ─────────────────────────────────────────────────────────
  console.log("  → Communications");

  if (jamesCandidate) {
    await prisma.communication.createMany({
      data: [
        {
          candidateId: jamesCandidate.id,
          channel: "EMAIL",
          direction: "outbound",
          subject: "Your onboarding package is ready",
          status: "opened",
          sentAt: new Date("2026-06-01T09:00:00"),
          openedAt: new Date("2026-06-01T09:32:00"),
          sentBy: "system",
          nudgeLevel: 0,
        },
        {
          candidateId: jamesCandidate.id,
          channel: "SMS",
          direction: "outbound",
          body: "Hi James, your background check is in progress. We'll update you soon.",
          status: "delivered",
          sentAt: new Date("2026-06-04T14:00:00"),
          sentBy: "system",
          nudgeLevel: 1,
        },
      ],
    });
  }

  // Lena Park — 4 communications (package sent, screening clear, equipment delivered, day 1 instructions)
  if (lenaPark) {
    await prisma.communication.createMany({
      data: [
        {
          candidateId: lenaPark.id,
          channel: "EMAIL",
          direction: "outbound",
          subject: "Your Skyline Retail Group onboarding package is ready",
          body: "Hi Lena, your onboarding package has been dispatched. Please log in to the portal to complete your tasks.",
          status: "opened",
          sentAt: new Date("2026-05-28T09:00:00"),
          openedAt: new Date("2026-05-28T09:45:00"),
          sentBy: "system",
          nudgeLevel: 0,
        },
        {
          candidateId: lenaPark.id,
          channel: "EMAIL",
          direction: "outbound",
          subject: "Background screening complete — all clear!",
          body: "Great news, Lena! Your background screening with Sterling has been completed with no adverse findings. You're one step closer to your start date.",
          status: "opened",
          sentAt: new Date("2026-06-06T10:15:00"),
          openedAt: new Date("2026-06-06T11:02:00"),
          sentBy: "system",
          nudgeLevel: 0,
        },
        {
          candidateId: lenaPark.id,
          channel: "SMS",
          direction: "outbound",
          body: "Hi Lena! Your Dell Latitude has been delivered. Please confirm receipt in the portal and complete device enrollment. Your start date is June 8. - HireMe",
          status: "delivered",
          sentAt: new Date("2026-06-07T08:30:00"),
          sentBy: "system",
          nudgeLevel: 0,
        },
        {
          candidateId: lenaPark.id,
          channel: "EMAIL",
          direction: "outbound",
          subject: "Day 1 Instructions — Skyline Retail Group, June 8",
          body: "Hi Lena, you're almost there! Here are your Day 1 instructions for your start at Skyline Retail Group. Your manager James Ford will meet you at the Merchandise Center lobby at 9:00 AM. Your laptop is ready, your VPN is configured, and your Skyline credentials are in the portal.",
          status: "opened",
          sentAt: new Date("2026-06-07T14:00:00"),
          openedAt: new Date("2026-06-07T14:38:00"),
          sentBy: "Carlos Rivera",
          nudgeLevel: 0,
        },
      ],
    });
  }

  // Marcus Webb — 3 messages (package sent, W-9 rejection notice, nudge reminder)
  if (marcusWebb) {
    await prisma.communication.createMany({
      data: [
        {
          candidateId: marcusWebb.id,
          channel: "EMAIL",
          direction: "outbound",
          subject: "Your Global Finance Corp onboarding package is ready",
          body: "Hi Marcus, your onboarding package has been prepared. Please log in to the portal to begin completing your required documents.",
          status: "opened",
          sentAt: new Date("2026-06-03T09:00:00"),
          openedAt: new Date("2026-06-03T10:17:00"),
          sentBy: "system",
          nudgeLevel: 0,
        },
        {
          candidateId: marcusWebb.id,
          channel: "EMAIL",
          direction: "outbound",
          subject: "Action Required: W-9 correction needed",
          body: "Hi Marcus, your W-9 form was rejected because the entity name 'TechBridge' does not match the registered vendor name 'TechBridge LLC'. Please resubmit a corrected W-9 with the exact legal entity name. This is required before payroll can be configured.",
          status: "opened",
          sentAt: new Date("2026-06-04T11:30:00"),
          openedAt: new Date("2026-06-05T08:45:00"),
          sentBy: "Aisha Ndiaye",
          nudgeLevel: 1,
        },
        {
          candidateId: marcusWebb.id,
          channel: "SMS",
          direction: "outbound",
          body: "Hi Marcus, this is a reminder to accept your HireRight background screening invitation and resubmit your corrected W-9. Your start date is June 16. Please act today. - HireMe",
          status: "delivered",
          sentAt: new Date("2026-06-06T09:00:00"),
          sentBy: "system",
          nudgeLevel: 2,
        },
      ],
    });
  }

  // Raj Patel — 2 messages (package sent, nudge for missing client docs)
  if (rajPatel) {
    await prisma.communication.createMany({
      data: [
        {
          candidateId: rajPatel.id,
          channel: "EMAIL",
          direction: "outbound",
          subject: "Your Apex Dynamics onboarding package is ready",
          body: "Hi Raj, your onboarding package is ready. Please log in to the portal to complete your remaining client requirements. Your start date is June 10.",
          status: "opened",
          sentAt: new Date("2026-06-01T09:30:00"),
          openedAt: new Date("2026-06-01T10:05:00"),
          sentBy: "system",
          nudgeLevel: 0,
        },
        {
          candidateId: rajPatel.id,
          channel: "SMS",
          direction: "outbound",
          body: "Hi Raj, you have 2 outstanding client documents due before your June 10 start: Security Policy Acknowledgment and Acceptable Use Policy. Please complete them today. - HireMe",
          status: "delivered",
          sentAt: new Date("2026-06-06T09:00:00"),
          sentBy: "system",
          nudgeLevel: 1,
        },
      ],
    });
  }

  // Aisha Bello — 2 messages (welcome email, portal activation SMS)
  if (aishaBello) {
    await prisma.communication.createMany({
      data: [
        {
          candidateId: aishaBello.id,
          channel: "EMAIL",
          direction: "outbound",
          subject: "Welcome to NovaTech Solutions — Let's get you started!",
          body: "Hi Aisha, congratulations on your offer acceptance! We're excited to have you join the NovaTech Solutions team. This email contains your onboarding portal link and instructions for completing your profile. Your start date is June 23 — you have plenty of time, so let's get everything done right.",
          status: "opened",
          sentAt: new Date("2026-06-07T08:00:00"),
          openedAt: new Date("2026-06-07T08:22:00"),
          sentBy: "system",
          nudgeLevel: 0,
        },
        {
          candidateId: aishaBello.id,
          channel: "SMS",
          direction: "outbound",
          body: "Hi Aisha! Your HireMe onboarding portal is now active. Log in at hireme.app/portal to begin your profile setup. Questions? Reply to this message. - HireMe",
          status: "delivered",
          sentAt: new Date("2026-06-07T08:05:00"),
          sentBy: "system",
          nudgeLevel: 0,
        },
      ],
    });
  }

  // ─────────────────────────────────────────────────────────
  // AUDIT EVENTS
  // ─────────────────────────────────────────────────────────
  console.log("  → Audit Events");

  const pkg1Record = await prisma.package.findUnique({ where: { id: "pkg-meridian-nursing-001" } });

  // Core audit events (packages and existing candidates)
  await prisma.auditEvent.createMany({
    data: [
      {
        action: "CREATED",
        entityType: "Package",
        entityId: "pkg-meridian-nursing-001",
        entityLabel: "Meridian Health — Nursing Staff W-2",
        actor: "Aisha Ndiaye",
        actorRole: "onboarder",
        packageId: pkg1Record?.id,
        aiInvolved: false,
        sourceSystem: "hireme",
      },
      {
        action: "APPROVED",
        entityType: "Package",
        entityId: "pkg-meridian-nursing-001",
        entityLabel: "Meridian Health — Nursing Staff W-2 v2.1",
        actor: "Devon Hughes",
        actorRole: "account-manager",
        packageId: pkg1Record?.id,
        aiInvolved: false,
        sourceSystem: "hireme",
      },
      {
        action: "AI_ACTION",
        entityType: "Document",
        entityLabel: "HIPAA Acknowledgment — Grace Okafor",
        actor: "AI Copilot",
        actorRole: "system",
        candidateId: graceCandidate?.id,
        aiInvolved: true,
        sourceSystem: "document-intelligence",
        newValue: "Possible missing signature detected on page 3",
      },
      {
        action: "UPDATED",
        entityType: "Candidate",
        entityLabel: "James Rivera",
        actor: "Carlos Rivera",
        actorRole: "onboarder",
        candidateId: jamesCandidate?.id,
        aiInvolved: false,
        sourceSystem: "hireme",
        previousValue: "stage: Document Review",
        newValue: "stage: Background Check",
        reason: "Documents approved; advancing to screening stage",
      },
    ],
  });

  // Audit events — Lena Park (package dispatched, screening complete, equipment delivered)
  if (lenaPark) {
    await prisma.auditEvent.createMany({
      data: [
        {
          action: "UPDATED",
          entityType: "Package",
          entityLabel: "Skyline Retail Group — W-2 Onboarding Package",
          actor: "system",
          actorRole: "system",
          candidateId: lenaPark.id,
          aiInvolved: false,
          sourceSystem: "hireme",
          newValue: "status: dispatched via portal + email",
          reason: "Package approved and dispatched to candidate on May 28",
        },
        {
          action: "UPDATED",
          entityType: "Screening",
          entityLabel: "Sterling — Standard Criminal (Lena Park)",
          actor: "Sterling",
          actorRole: "integration",
          candidateId: lenaPark.id,
          aiInvolved: false,
          sourceSystem: "screening-vendor",
          previousValue: "status: IN_PROGRESS",
          newValue: "status: CLEAR — no adverse findings",
          reason: "All checks completed; candidate cleared for start",
        },
        {
          action: "UPDATED",
          entityType: "Equipment",
          entityLabel: "Dell Latitude 15 — Lena Park",
          actor: "system",
          actorRole: "system",
          candidateId: lenaPark.id,
          aiInvolved: false,
          sourceSystem: "shipping-integration",
          previousValue: "status: SHIPPED",
          newValue: "status: DELIVERED — confirmed Jun 7",
          reason: "FedEx delivery confirmed; device enrollment completed",
        },
      ],
    });
  }

  // Audit events — Marcus Webb (W-9 rejected, screening ordered)
  if (marcusWebb) {
    await prisma.auditEvent.createMany({
      data: [
        {
          action: "REJECTED",
          entityType: "Document",
          entityLabel: "Federal W-9 — Marcus Webb (TechBridge LLC)",
          actor: "Aisha Ndiaye",
          actorRole: "onboarder",
          candidateId: marcusWebb.id,
          aiInvolved: true,
          sourceSystem: "document-intelligence",
          previousValue: "status: AI_REVIEW",
          newValue: "status: REJECTED",
          reason: "Entity name 'TechBridge' does not match registered vendor 'TechBridge LLC'. AI flagged mismatch with confidence 0.94.",
        },
        {
          action: "INTEGRATION_EVENT",
          entityType: "Screening",
          entityLabel: "HireRight — Enhanced 7-Year + Credit Check (Marcus Webb)",
          actor: "system",
          actorRole: "system",
          candidateId: marcusWebb.id,
          aiInvolved: false,
          sourceSystem: "hireright-integration",
          newValue: "Screening order placed. Invitation sent to candidate. Status: ORDERED",
          reason: "Screening automatically triggered upon I-9 approval",
        },
      ],
    });
  }

  // Audit events — Raj Patel (package sent, screening ordered)
  if (rajPatel) {
    await prisma.auditEvent.createMany({
      data: [
        {
          action: "UPDATED",
          entityType: "Package",
          entityLabel: "Apex Dynamics — Engineering C2C (Raj Patel)",
          actor: "system",
          actorRole: "system",
          candidateId: rajPatel.id,
          aiInvolved: false,
          sourceSystem: "hireme",
          newValue: "status: dispatched via portal on Jun 1",
          reason: "Package approved and dispatched; candidate notified",
        },
        {
          action: "INTEGRATION_EVENT",
          entityType: "Screening",
          entityLabel: "Sterling — Standard Criminal (Raj Patel)",
          actor: "system",
          actorRole: "system",
          candidateId: rajPatel.id,
          aiInvolved: false,
          sourceSystem: "sterling-integration",
          newValue: "Screening in progress. Consented Jun 4. Est. completion Jun 10.",
          reason: "Screening triggered upon I-9 and W-9 approval",
        },
      ],
    });
  }

  // Audit events — Aisha Bello (candidate created, package generated)
  if (aishaBello) {
    await prisma.auditEvent.createMany({
      data: [
        {
          action: "CREATED",
          entityType: "Candidate",
          entityLabel: "Aisha Bello",
          actor: "Derek Okafor",
          actorRole: "recruiter",
          candidateId: aishaBello.id,
          aiInvolved: false,
          sourceSystem: "hireme",
          newValue: "status: OFFER_ACCEPTED — start date Jun 23",
          reason: "Offer accepted on Jun 7. Profile created by recruiter.",
        },
        {
          action: "AI_ACTION",
          entityType: "Package",
          entityLabel: "NovaTech Solutions — W-2 Onboarding Package (Aisha Bello)",
          actor: "AI Copilot",
          actorRole: "system",
          candidateId: aishaBello.id,
          aiInvolved: true,
          sourceSystem: "package-engine",
          newValue: "Package auto-assembled: 8 required items based on W-2, Seattle WA, Cloud Engineering role.",
          reason: "AI evaluated client rules, state jurisdiction, employment type, and job category to generate package",
        },
      ],
    });
  }

  // ─────────────────────────────────────────────────────────
  // CONSULTANTS (active workforce)
  // ─────────────────────────────────────────────────────────
  console.log("  → Consultants");

  const consultants = [
    {
      firstName: "Nina", lastName: "Cheng",
      email: "nina.cheng@example.com", phone: "(512) 555-1001",
      status: "ACTIVE" as const, title: "Senior Software Engineer",
      clientName: "Apex Dynamics", recruiter: "Mia Thompson",
      accountManager: "Priya Shah", employmentType: "W2" as const,
      billRate: 145, payRate: 95,
      startDate: new Date("2025-02-10"), endDate: new Date("2026-12-31"),
      location: "Austin, TX", skills: ["React", "TypeScript", "Node.js"],
    },
    {
      firstName: "Omar", lastName: "Hassan",
      email: "omar.hassan@example.com", phone: "(615) 555-1002",
      status: "ACTIVE" as const, title: "Health IT Analyst",
      clientName: "Meridian Health", recruiter: "Sandra Lee",
      accountManager: "Devon Hughes", employmentType: "W2" as const,
      billRate: 115, payRate: 78,
      startDate: new Date("2025-05-14"), endDate: new Date("2026-09-30"),
      location: "Nashville, TN", skills: ["Epic EHR", "HL7", "SQL"],
    },
    {
      firstName: "Keisha", lastName: "Williams",
      email: "keisha.williams@example.com", phone: "(206) 555-1003",
      status: "EXTENSION_PENDING" as const, title: "Cloud Architect",
      clientName: "NovaTech Solutions", recruiter: "Derek Okafor",
      accountManager: "Priya Shah", employmentType: "W2" as const,
      billRate: 185, payRate: 125,
      startDate: new Date("2024-10-01"), endDate: new Date("2026-06-30"),
      location: "Seattle, WA", skills: ["AWS", "Terraform", "Kubernetes"],
    },

    // ─── Bridge consultants — candidates who graduated to consultants ───
    // These share email with existing Candidate rows so the Consultant 360
    // page can surface their full onboarding-period history (documents,
    // screenings, payroll, billing, equipment, training, communications,
    // audit) via the email join in getDbConsultantFull().
    {
      firstName: "Lena", lastName: "Park",
      email: "lena.park@example.com", phone: "(312) 555-0537",
      status: "ACTIVE" as const, title: "Senior Retail Analyst",
      clientName: "Skyline Retail Group", recruiter: "Sandra Lee",
      onboarder: "Carlos Rivera", accountManager: "Devon Hughes",
      employmentType: "W2" as const,
      billRate: 125, payRate: 88,
      startDate: new Date("2026-06-08"), endDate: new Date("2027-06-08"),
      location: "Chicago, IL (Hybrid)",
      skills: ["SAP Retail", "Merchandising Analytics"],
      notes: "Graduated from candidate pipeline 2026-06-08. Full onboarding history retained.",
    },
    {
      firstName: "Grace", lastName: "Okafor",
      email: "grace.okafor@example.com", phone: "(615) 555-0289",
      status: "ACTIVE" as const, title: "Health IT Specialist",
      clientName: "Meridian Health", recruiter: "Sandra Lee",
      onboarder: "Riya Kim", accountManager: "Devon Hughes",
      employmentType: "W2" as const,
      billRate: 132, payRate: 91,
      startDate: new Date("2026-06-09"), endDate: new Date("2027-09-09"),
      location: "Nashville, TN (Onsite)",
      skills: ["Healthcare Compliance", "EHR Integration"],
      notes: "Graduated from candidate pipeline 2026-06-09. Onboarding ran clean — see Audit tab.",
    },
  ];

  for (const c of consultants) {
    await prisma.consultant.create({ data: c });
  }

  console.log("✅  Seed complete.");
}

main()
  .catch((e) => {
    console.error("❌  Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
