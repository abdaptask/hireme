-- CreateEnum
CREATE TYPE "CandidateStatus" AS ENUM ('NEW', 'ACTIVE', 'OFFER_ACCEPTED', 'ONBOARDING', 'ON_HOLD', 'WITHDRAWN', 'PLACED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('ON_TRACK', 'NEEDS_ATTENTION', 'AT_RISK', 'UNLIKELY');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('W2', 'C2C', 'INDEPENDENT_1099', 'FULL_TIME', 'CONTRACT_TO_HIRE', 'INTERN');

-- CreateEnum
CREATE TYPE "ConsultantStatus" AS ENUM ('ACTIVE', 'BENCH', 'EXTENSION_PENDING', 'OFFBOARDING', 'CONVERTED', 'FORMER', 'INELIGIBLE');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'AT_RISK', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "PackageStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'RETIRED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "PackageItemStatus" AS ENUM ('INCLUDED', 'WAIVED', 'PENDING', 'REJECTED');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'SUBMITTED', 'AI_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED', 'CORRECTION_REQUIRED');

-- CreateEnum
CREATE TYPE "ScreeningStatus" AS ENUM ('ORDERED', 'INVITED', 'CONSENTED', 'IN_PROGRESS', 'INFO_REQUIRED', 'VENDOR_DELAYED', 'CLEAR', 'REVIEW_REQUIRED', 'ADVERSE_PENDING');

-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('REQUESTED', 'APPROVED', 'ASSIGNED', 'SHIPPED', 'DELIVERED', 'ENROLLED', 'READY', 'DELAYED', 'RETURN_REQUIRED', 'RETURNED', 'LOST', 'DAMAGED');

-- CreateEnum
CREATE TYPE "ReadinessStatus" AS ENUM ('READY', 'NOT_READY', 'PENDING');

-- CreateEnum
CREATE TYPE "TrainingStatus" AS ENUM ('ASSIGNED', 'STARTED', 'COMPLETED', 'FAILED', 'EXPIRING', 'WAIVED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "CommunicationChannel" AS ENUM ('EMAIL', 'SMS', 'PORTAL', 'VOICE', 'INTERNAL');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATED', 'UPDATED', 'APPROVED', 'REJECTED', 'ESCALATED', 'OVERRIDDEN', 'EXPORTED', 'AI_ACTION', 'INTEGRATION_EVENT', 'DELETED');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('CONNECTED', 'DEGRADED', 'ERROR', 'DISCONNECTED', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "IntegrationCategory" AS ENUM ('ATS', 'VMS', 'HRIS', 'PAYROLL', 'SCREENING', 'ESIGN', 'COMMUNICATION', 'IDENTITY', 'ASSET', 'LMS', 'SHIPPING', 'ACCOUNTING', 'CRM', 'ANALYTICS', 'BENEFITS');

-- CreateEnum
CREATE TYPE "ExceptionSeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "ExceptionStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED');

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "status" "CandidateStatus" NOT NULL DEFAULT 'NEW',
    "risk" "RiskLevel" NOT NULL DEFAULT 'ON_TRACK',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "stage" TEXT,
    "employmentType" "EmploymentType",
    "workLocation" TEXT,
    "startDate" TIMESTAMP(3),
    "clientName" TEXT,
    "recruiter" TEXT,
    "onboarder" TEXT,
    "vendor" TEXT,
    "tags" TEXT[],
    "notes" TEXT,
    "lastContact" TIMESTAMP(3),
    "street" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "skillFamily" TEXT,
    "skills" TEXT[],
    "skillConfidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consultant" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "status" "ConsultantStatus" NOT NULL DEFAULT 'ACTIVE',
    "title" TEXT,
    "clientName" TEXT,
    "recruiter" TEXT,
    "onboarder" TEXT,
    "accountManager" TEXT,
    "vendor" TEXT,
    "employmentType" "EmploymentType",
    "billRate" DOUBLE PRECISION,
    "payRate" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "location" TEXT,
    "skills" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consultant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "hq" TEXT NOT NULL,
    "accountManager" TEXT NOT NULL,
    "programs" TEXT[],
    "msp" TEXT,
    "employmentTypesAllowed" TEXT[],
    "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "website" TEXT,
    "invoiceFrequency" TEXT,
    "paymentTermsDays" INTEGER NOT NULL DEFAULT 30,
    "vmsPlatform" TEXT,
    "workerIdPrefix" TEXT,
    "activeConsultants" INTEGER NOT NULL DEFAULT 0,
    "avgOnboardingDays" INTEGER NOT NULL DEFAULT 14,
    "compliancePassRate" DOUBLE PRECISION NOT NULL DEFAULT 90,
    "startDateSuccessRate" DOUBLE PRECISION NOT NULL DEFAULT 90,
    "since" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientContact" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "type" TEXT NOT NULL,

    CONSTRAINT "ClientContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientPromise" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "promisedDate" TEXT NOT NULL,
    "actualDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'on-track',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientPromise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceRule" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "label" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "condition" TEXT,
    "policyId" TEXT,

    CONSTRAINT "ComplianceRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT,
    "consultantId" TEXT,
    "clientId" TEXT,
    "jobTitle" TEXT,
    "jobId" TEXT,
    "jobCategory" TEXT,
    "employmentType" "EmploymentType",
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "billRate" DOUBLE PRECISION,
    "payRate" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "workLocation" TEXT,
    "workState" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "vendorId" TEXT,
    "msp" TEXT,
    "program" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "status" "PackageStatus" NOT NULL DEFAULT 'DRAFT',
    "clientId" TEXT,
    "employmentType" TEXT,
    "workLocation" TEXT,
    "jobCategory" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "expirationDate" TIMESTAMP(3),
    "owner" TEXT,
    "approver" TEXT,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "completionPct" INTEGER NOT NULL DEFAULT 0,
    "aiReviewStatus" TEXT NOT NULL DEFAULT 'not-run',
    "consultant" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageItem" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "conditional" TEXT,
    "owner" TEXT,
    "dueOffset" INTEGER NOT NULL DEFAULT 0,
    "status" "PackageItemStatus" NOT NULL DEFAULT 'INCLUDED',
    "aiRecommended" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PackageItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageRule" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "applies" BOOLEAN NOT NULL DEFAULT true,
    "reason" TEXT NOT NULL,
    "category" TEXT NOT NULL,

    CONSTRAINT "PackageRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageApproval" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "approver" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "PackageApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageDispatch" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'delivered',

    CONSTRAINT "PackageDispatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "fileUrl" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "aiScore" INTEGER,
    "aiFlags" TEXT[],
    "rejectedReason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "uploadedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Screening" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT,
    "vendor" TEXT NOT NULL,
    "packageType" TEXT,
    "status" "ScreeningStatus" NOT NULL DEFAULT 'ORDERED',
    "orderedAt" TIMESTAMP(3),
    "consentedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "estimatedCompletion" TIMESTAMP(3),
    "cost" DOUBLE PRECISION,
    "adjudicator" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Screening_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT,
    "assetType" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" "EquipmentStatus" NOT NULL DEFAULT 'REQUESTED',
    "serialNumber" TEXT,
    "trackingNumber" TEXT,
    "carrier" TEXT,
    "shippedAt" TIMESTAMP(3),
    "estimatedDelivery" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "returnRequired" BOOLEAN NOT NULL DEFAULT false,
    "returnedAt" TIMESTAMP(3),
    "emailProvisioned" BOOLEAN NOT NULL DEFAULT false,
    "vpnProvisioned" BOOLEAN NOT NULL DEFAULT false,
    "clientCredentials" BOOLEAN NOT NULL DEFAULT false,
    "deviceEnrolled" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollReadiness" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "status" "ReadinessStatus" NOT NULL DEFAULT 'NOT_READY',
    "classification" BOOLEAN NOT NULL DEFAULT false,
    "payRate" BOOLEAN NOT NULL DEFAULT false,
    "overtimeRules" BOOLEAN NOT NULL DEFAULT false,
    "taxJurisdiction" BOOLEAN NOT NULL DEFAULT false,
    "directDeposit" BOOLEAN NOT NULL DEFAULT false,
    "w4" BOOLEAN NOT NULL DEFAULT false,
    "stateTax" BOOLEAN NOT NULL DEFAULT false,
    "i9" BOOLEAN NOT NULL DEFAULT false,
    "benefitsEligibility" BOOLEAN NOT NULL DEFAULT false,
    "payrollEntity" BOOLEAN NOT NULL DEFAULT false,
    "startDateSet" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollReadiness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingReadiness" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "status" "ReadinessStatus" NOT NULL DEFAULT 'NOT_READY',
    "billRate" BOOLEAN NOT NULL DEFAULT false,
    "markup" BOOLEAN NOT NULL DEFAULT false,
    "purchaseOrder" BOOLEAN NOT NULL DEFAULT false,
    "costCenter" BOOLEAN NOT NULL DEFAULT false,
    "clientWorkerId" BOOLEAN NOT NULL DEFAULT false,
    "vmsId" BOOLEAN NOT NULL DEFAULT false,
    "invoiceFrequency" BOOLEAN NOT NULL DEFAULT false,
    "timesheetMethod" BOOLEAN NOT NULL DEFAULT false,
    "expensePolicy" BOOLEAN NOT NULL DEFAULT false,
    "billingEntity" BOOLEAN NOT NULL DEFAULT false,
    "approvedStartDate" BOOLEAN NOT NULL DEFAULT false,
    "poNumber" TEXT,
    "clientWorkerId2" TEXT,
    "vmsWorkerId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingReadiness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Training" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" "TrainingStatus" NOT NULL DEFAULT 'ASSIGNED',
    "score" INTEGER,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "required" BOOLEAN NOT NULL DEFAULT true,
    "waivedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Training_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Communication" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT,
    "channel" "CommunicationChannel" NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'outbound',
    "subject" TEXT,
    "body" TEXT,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "nudgeLevel" INTEGER,
    "sentAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "sentBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Communication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exception" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT,
    "category" TEXT NOT NULL,
    "severity" "ExceptionSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "ExceptionStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "owner" TEXT,
    "resolver" TEXT,
    "resolutionDeadline" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "startDateImpact" BOOLEAN NOT NULL DEFAULT false,
    "clientVisible" BOOLEAN NOT NULL DEFAULT false,
    "clientNote" TEXT,
    "internalNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exception_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "category" "IntegrationCategory" NOT NULL,
    "description" TEXT,
    "status" "IntegrationStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "lastSync" TIMESTAMP(3),
    "lastSuccess" TIMESTAMP(3),
    "failedRecords" INTEGER NOT NULL DEFAULT 0,
    "successRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgLatencyMs" INTEGER NOT NULL DEFAULT 0,
    "queueDepth" INTEGER NOT NULL DEFAULT 0,
    "authExpires" TIMESTAMP(3),
    "authType" TEXT,
    "owner" TEXT,
    "criticality" TEXT NOT NULL DEFAULT 'medium',
    "syncDirection" TEXT NOT NULL DEFAULT 'bidirectional',
    "syncFrequency" TEXT NOT NULL DEFAULT 'hourly',
    "environment" TEXT NOT NULL DEFAULT 'production',
    "dataExchanged" TEXT[],
    "totalRecordsToday" INTEGER NOT NULL DEFAULT 0,
    "totalErrorsToday" INTEGER NOT NULL DEFAULT 0,
    "uptime30d" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "website" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationEvent" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "direction" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'success',
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "correlationId" TEXT,

    CONSTRAINT "IntegrationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "entityLabel" TEXT,
    "actor" TEXT NOT NULL,
    "actorRole" TEXT,
    "previousValue" TEXT,
    "newValue" TEXT,
    "reason" TEXT,
    "ipAddress" TEXT,
    "device" TEXT,
    "aiInvolved" BOOLEAN NOT NULL DEFAULT false,
    "sourceSystem" TEXT,
    "critical" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "candidateId" TEXT,
    "consultantId" TEXT,
    "packageId" TEXT,
    "documentId" TEXT,
    "exceptionId" TEXT,
    "integrationId" TEXT,
    "clientId" TEXT,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_email_key" ON "Candidate"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Consultant_email_key" ON "Consultant"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Client_name_key" ON "Client"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollReadiness_candidateId_key" ON "PayrollReadiness"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingReadiness_candidateId_key" ON "BillingReadiness"("candidateId");

-- AddForeignKey
ALTER TABLE "ClientContact" ADD CONSTRAINT "ClientContact_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientPromise" ADD CONSTRAINT "ClientPromise_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceRule" ADD CONSTRAINT "ComplianceRule_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_consultantId_fkey" FOREIGN KEY ("consultantId") REFERENCES "Consultant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageItem" ADD CONSTRAINT "PackageItem_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageRule" ADD CONSTRAINT "PackageRule_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageApproval" ADD CONSTRAINT "PackageApproval_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageDispatch" ADD CONSTRAINT "PackageDispatch_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Screening" ADD CONSTRAINT "Screening_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollReadiness" ADD CONSTRAINT "PayrollReadiness_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingReadiness" ADD CONSTRAINT "BillingReadiness_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Training" ADD CONSTRAINT "Training_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exception" ADD CONSTRAINT "Exception_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationEvent" ADD CONSTRAINT "IntegrationEvent_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_consultantId_fkey" FOREIGN KEY ("consultantId") REFERENCES "Consultant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_exceptionId_fkey" FOREIGN KEY ("exceptionId") REFERENCES "Exception"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
