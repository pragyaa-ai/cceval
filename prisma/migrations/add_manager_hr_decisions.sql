-- Migration: Add Manager Recommendation and HR Decision fields to Evaluation table
-- Run this on the production database

-- Manager Recommendation fields
ALTER TABLE "Evaluation" ADD COLUMN IF NOT EXISTS "managerDecision" TEXT;
ALTER TABLE "Evaluation" ADD COLUMN IF NOT EXISTS "managerComments" TEXT;
ALTER TABLE "Evaluation" ADD COLUMN IF NOT EXISTS "managerName" TEXT;
ALTER TABLE "Evaluation" ADD COLUMN IF NOT EXISTS "managerDesignation" TEXT;
ALTER TABLE "Evaluation" ADD COLUMN IF NOT EXISTS "managerDecisionAt" TIMESTAMP(3);

-- HR Decision fields
ALTER TABLE "Evaluation" ADD COLUMN IF NOT EXISTS "hrDecision" TEXT;
ALTER TABLE "Evaluation" ADD COLUMN IF NOT EXISTS "hrComments" TEXT;
ALTER TABLE "Evaluation" ADD COLUMN IF NOT EXISTS "hrName" TEXT;
ALTER TABLE "Evaluation" ADD COLUMN IF NOT EXISTS "hrDesignation" TEXT;
ALTER TABLE "Evaluation" ADD COLUMN IF NOT EXISTS "hrDecisionAt" TIMESTAMP(3);
