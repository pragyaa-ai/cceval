-- Migration: Add Scenarios and Multi-tenancy
-- This migration adds support for:
-- 1. Multi-tenant organizations
-- 2. Custom evaluation scenarios
-- 3. Custom scoring criteria
-- 4. Reading passages and role-play scenarios
-- 5. Sample recordings for AI analysis

-- ==========================================
-- ORGANIZATION TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "description" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#7c3aed',
    "secondaryColor" TEXT NOT NULL DEFAULT '#8b5cf6',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "settings" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Organization_slug_key" ON "Organization"("slug");

-- ==========================================
-- EVALUATION SCENARIO TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS "EvaluationScenario" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "industry" TEXT,
    "roleType" TEXT,
    "organizationId" TEXT NOT NULL,
    "agentName" TEXT NOT NULL DEFAULT 'Eva',
    "agentVoice" TEXT NOT NULL DEFAULT 'coral',
    "agentPersona" TEXT NOT NULL DEFAULT '',
    "agentInstructions" TEXT NOT NULL DEFAULT '',
    "flowConfig" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvaluationScenario_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "EvaluationScenario_organizationId_idx" ON "EvaluationScenario"("organizationId");

-- ==========================================
-- SCORING CRITERIA TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS "ScoringCriteria" (
    "id" TEXT NOT NULL,
    "parameterId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "minScore" INTEGER NOT NULL DEFAULT 1,
    "maxScore" INTEGER NOT NULL DEFAULT 5,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "scoringGuidance" TEXT NOT NULL DEFAULT '',
    "scoreExamples" TEXT NOT NULL DEFAULT '[]',
    "category" TEXT NOT NULL DEFAULT 'general',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSuggested" BOOLEAN NOT NULL DEFAULT false,
    "scenarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoringCriteria_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ScoringCriteria_scenarioId_parameterId_key" ON "ScoringCriteria"("scenarioId", "parameterId");
CREATE INDEX IF NOT EXISTS "ScoringCriteria_scenarioId_idx" ON "ScoringCriteria"("scenarioId");

-- ==========================================
-- READING PASSAGE TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS "ReadingPassage" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "context" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "scenarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingPassage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ReadingPassage_scenarioId_idx" ON "ReadingPassage"("scenarioId");

-- ==========================================
-- ROLE PLAY SCENARIO TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS "RolePlayScenario" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "customerName" TEXT NOT NULL DEFAULT 'Customer',
    "customerPersona" TEXT NOT NULL,
    "customerMood" TEXT NOT NULL DEFAULT 'neutral',
    "openingLine" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "expectedBehaviors" TEXT NOT NULL DEFAULT '[]',
    "escalationTriggers" TEXT NOT NULL DEFAULT '[]',
    "difficulty" TEXT NOT NULL DEFAULT 'beginner',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "scenarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolePlayScenario_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "RolePlayScenario_scenarioId_idx" ON "RolePlayScenario"("scenarioId");

-- ==========================================
-- SAMPLE RECORDING TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS "SampleRecording" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "mimeType" TEXT NOT NULL DEFAULT 'audio/webm',
    "transcript" TEXT,
    "analysisResult" TEXT,
    "suggestedCriteria" TEXT,
    "analysisStatus" TEXT NOT NULL DEFAULT 'pending',
    "qualityLabel" TEXT,
    "scenarioId" TEXT NOT NULL,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SampleRecording_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SampleRecording_scenarioId_idx" ON "SampleRecording"("scenarioId");

-- ==========================================
-- ORGANIZATION CALIBRATION TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS "OrganizationCalibration" (
    "id" TEXT NOT NULL,
    "parameterId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "adjustment" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "guidance" TEXT NOT NULL DEFAULT '',
    "totalFeedbacks" INTEGER NOT NULL DEFAULT 0,
    "avgAdjustment" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastAnalyzedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationCalibration_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "OrganizationCalibration_organizationId_parameterId_key" ON "OrganizationCalibration"("organizationId", "parameterId");
CREATE INDEX IF NOT EXISTS "OrganizationCalibration_organizationId_idx" ON "OrganizationCalibration"("organizationId");

-- ==========================================
-- UPDATE USER TABLE
-- ==========================================
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
CREATE INDEX IF NOT EXISTS "User_organizationId_idx" ON "User"("organizationId");

-- ==========================================
-- UPDATE BATCH TABLE
-- ==========================================
ALTER TABLE "Batch" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "Batch" ADD COLUMN IF NOT EXISTS "scenarioId" TEXT;
CREATE INDEX IF NOT EXISTS "Batch_organizationId_idx" ON "Batch"("organizationId");
CREATE INDEX IF NOT EXISTS "Batch_scenarioId_idx" ON "Batch"("scenarioId");

-- ==========================================
-- ADD FOREIGN KEY CONSTRAINTS
-- ==========================================
ALTER TABLE "EvaluationScenario" ADD CONSTRAINT "EvaluationScenario_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EvaluationScenario" ADD CONSTRAINT "EvaluationScenario_createdById_fkey" 
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ScoringCriteria" ADD CONSTRAINT "ScoringCriteria_scenarioId_fkey" 
    FOREIGN KEY ("scenarioId") REFERENCES "EvaluationScenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReadingPassage" ADD CONSTRAINT "ReadingPassage_scenarioId_fkey" 
    FOREIGN KEY ("scenarioId") REFERENCES "EvaluationScenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RolePlayScenario" ADD CONSTRAINT "RolePlayScenario_scenarioId_fkey" 
    FOREIGN KEY ("scenarioId") REFERENCES "EvaluationScenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SampleRecording" ADD CONSTRAINT "SampleRecording_scenarioId_fkey" 
    FOREIGN KEY ("scenarioId") REFERENCES "EvaluationScenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SampleRecording" ADD CONSTRAINT "SampleRecording_uploadedById_fkey" 
    FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OrganizationCalibration" ADD CONSTRAINT "OrganizationCalibration_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Batch" ADD CONSTRAINT "Batch_organizationId_fkey" 
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Batch" ADD CONSTRAINT "Batch_scenarioId_fkey" 
    FOREIGN KEY ("scenarioId") REFERENCES "EvaluationScenario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ==========================================
-- SEED DEFAULT ORGANIZATION (Optional)
-- ==========================================
-- INSERT INTO "Organization" ("id", "name", "slug", "description", "updatedAt")
-- VALUES ('default-org', 'Default Organization', 'default', 'Default organization for existing users', NOW())
-- ON CONFLICT ("slug") DO NOTHING;




