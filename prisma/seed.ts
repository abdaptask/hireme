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
  // CLIENTS
  // ─────────────────────────────────────────────────────────
  console.log("  → Clients");

  const meridian = await prisma.client.upsert({
    where: { name: "Meridian Health" },
    update: {},
    create: {
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

  const apexDyn = await prisma.client.upsert({
    where: { name: "Apex Dynamics" },
    update: {},
    create: {
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

  const globalFin = await prisma.client.upsert({
    where: { name: "Global Finance Corp" },
    update: {},
    create: {
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

  await prisma.client.upsert({
    where: { name: "Skyline Retail Group" },
    update: {},
    create: {
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
      promises: { create: [] },
    },
  });

  await prisma.client.upsert({
    where: { name: "NovaTech Solutions" },
    update: {},
    create: {
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
      promises: { create: [] },
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
    await prisma.candidate.upsert({
      where: { email: c.email },
      update: {},
      create: c,
    });
  }

  // ─────────────────────────────────────────────────────────
  // PACKAGES (representative — pull from packages mock)
  // ─────────────────────────────────────────────────────────
  console.log("  → Packages");

  const pkg1 = await prisma.package.upsert({
    where: { id: "pkg-meridian-nursing-001" },
    update: {},
    create: {
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

  await prisma.package.upsert({
    where: { id: "pkg-apex-engineering-001" },
    update: {},
    create: {
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

  await prisma.package.upsert({
    where: { id: "pkg-gfc-finance-001" },
    update: {},
    create: {
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
      dispatches: { create: [] },
    },
  });

  // ─────────────────────────────────────────────────────────
  // DOCUMENTS (for Grace Okafor — most complete candidate)
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

  // ─────────────────────────────────────────────────────────
  // PAYROLL & BILLING READINESS
  // ─────────────────────────────────────────────────────────
  console.log("  → Readiness Gates");

  if (graceCandidate) {
    await prisma.payrollReadiness.upsert({
      where: { candidateId: graceCandidate.id },
      update: {},
      create: {
        candidateId: graceCandidate.id,
        status: "READY",
        classification: true, payRate: true, overtimeRules: true,
        taxJurisdiction: true, directDeposit: true, w4: true,
        stateTax: true, i9: true, benefitsEligibility: true,
        payrollEntity: true, startDateSet: true,
      },
    });
    await prisma.billingReadiness.upsert({
      where: { candidateId: graceCandidate.id },
      update: {},
      create: {
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
    await prisma.payrollReadiness.upsert({
      where: { candidateId: jamesCandidate.id },
      update: {},
      create: {
        candidateId: jamesCandidate.id,
        status: "NOT_READY",
        classification: true, payRate: true, overtimeRules: true,
        taxJurisdiction: true, directDeposit: false, w4: false,
        stateTax: false, i9: true, benefitsEligibility: true,
        payrollEntity: true, startDateSet: true,
      },
    });
    await prisma.billingReadiness.upsert({
      where: { candidateId: jamesCandidate.id },
      update: {},
      create: {
        candidateId: jamesCandidate.id,
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

  // ─────────────────────────────────────────────────────────
  // AUDIT EVENTS (sample)
  // ─────────────────────────────────────────────────────────
  console.log("  → Audit Events");

  const pkg1Record = await prisma.package.findUnique({ where: { id: "pkg-meridian-nursing-001" } });

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
  ];

  for (const c of consultants) {
    await prisma.consultant.upsert({
      where: { email: c.email },
      update: {},
      create: c,
    });
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
