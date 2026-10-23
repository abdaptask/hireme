-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "formData" JSONB;

-- AlterTable
ALTER TABLE "NewHireRequest" ADD COLUMN     "approvalAt" TIMESTAMP(3),
ADD COLUMN     "approvalBy" TEXT,
ADD COLUMN     "approvalNote" TEXT,
ADD COLUMN     "approvalStatus" TEXT NOT NULL DEFAULT 'not-required',
ADD COLUMN     "exceptionReason" TEXT,
ADD COLUMN     "exceptions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "formData" JSONB;
