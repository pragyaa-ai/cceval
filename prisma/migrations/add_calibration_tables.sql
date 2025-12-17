-- Migration: Add Agent Calibration and Calibration History tables
-- Run this on the production database

-- Agent Calibration table - stores AI scoring adjustments based on evaluator feedback
CREATE TABLE IF NOT EXISTS "AgentCalibration" (
    "id" TEXT NOT NULL,
    "parameterId" TEXT NOT NULL,
    "adjustment" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "guidance" TEXT NOT NULL DEFAULT '',
    "totalFeedbacks" INTEGER NOT NULL DEFAULT 0,
    "avgAdjustment" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastAnalyzedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentCalibration_pkey" PRIMARY KEY ("id")
);

-- Unique constraint on parameterId
CREATE UNIQUE INDEX IF NOT EXISTS "AgentCalibration_parameterId_key" ON "AgentCalibration"("parameterId");

-- Calibration History table - tracks all changes to calibrations over time
CREATE TABLE IF NOT EXISTS "CalibrationHistory" (
    "id" TEXT NOT NULL,
    "calibrationId" TEXT NOT NULL,
    "previousAdjustment" DOUBLE PRECISION NOT NULL,
    "previousGuidance" TEXT NOT NULL,
    "newAdjustment" DOUBLE PRECISION NOT NULL,
    "newGuidance" TEXT NOT NULL,
    "feedbackCount" INTEGER NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "analysisSummary" TEXT NOT NULL,
    "evaluatorIds" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalibrationHistory_pkey" PRIMARY KEY ("id")
);

-- Foreign key constraint
ALTER TABLE "CalibrationHistory" 
ADD CONSTRAINT "CalibrationHistory_calibrationId_fkey" 
FOREIGN KEY ("calibrationId") REFERENCES "AgentCalibration"("id") 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS "CalibrationHistory_calibrationId_idx" ON "CalibrationHistory"("calibrationId");
CREATE INDEX IF NOT EXISTS "CalibrationHistory_createdAt_idx" ON "CalibrationHistory"("createdAt" DESC);
