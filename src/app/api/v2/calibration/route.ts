import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Scoring parameters that can be calibrated - must match V2EvaluationContext.tsx
const SCORING_PARAMETERS = [
  "clarity_pace",
  "product_knowledge", 
  "empathy",
  "customer_understanding",
  "handling_pressure",
  "confidence",
  "process_accuracy",
  "closure_quality",
];

// GET /api/v2/calibration - Get all calibration settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all calibrations
    const calibrations = await prisma.agentCalibration.findMany({
      where: { isActive: true },
      orderBy: { parameterId: "asc" },
    });

    // Create a map for easy lookup
    const calibrationMap: Record<string, {
      adjustment: number;
      guidance: string;
      totalFeedbacks: number;
      avgAdjustment: number;
      lastAnalyzedAt: Date | null;
    }> = {};

    for (const cal of calibrations) {
      calibrationMap[cal.parameterId] = {
        adjustment: cal.adjustment,
        guidance: cal.guidance,
        totalFeedbacks: cal.totalFeedbacks,
        avgAdjustment: cal.avgAdjustment,
        lastAnalyzedAt: cal.lastAnalyzedAt,
      };
    }

    // Ensure all parameters have entries (even if not yet calibrated)
    for (const param of SCORING_PARAMETERS) {
      if (!calibrationMap[param]) {
        calibrationMap[param] = {
          adjustment: 0,
          guidance: "",
          totalFeedbacks: 0,
          avgAdjustment: 0,
          lastAnalyzedAt: null,
        };
      }
    }

    return NextResponse.json({
      calibrations: calibrationMap,
      parameters: SCORING_PARAMETERS,
    });
  } catch (error) {
    console.error("[Calibration API] Error fetching calibrations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/v2/calibration/analyze - Run feedback analysis and update calibrations
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (user?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { periodDays = 7 } = body; // Default to last 7 days

    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - periodDays);
    const periodEnd = new Date();

    console.log(`[Calibration API] Running analysis for period: ${periodStart.toISOString()} to ${periodEnd.toISOString()}`);

    // Fetch all feedback from the period
    const feedbacks = await prisma.evaluatorFeedback.findMany({
      where: {
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
        feedbackType: "score",
        adjustedScore: { not: null },
      },
      include: {
        score: true,
        evaluator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    console.log(`[Calibration API] Found ${feedbacks.length} feedbacks to analyze`);

    // Group feedbacks by parameter
    const feedbacksByParam: Record<string, Array<{
      originalScore: number;
      adjustedScore: number;
      comment: string;
      evaluatorId: string;
      evaluatorName: string;
    }>> = {};

    for (const fb of feedbacks) {
      const parameterId = fb.score?.parameterId;
      if (!parameterId) continue;

      if (!feedbacksByParam[parameterId]) {
        feedbacksByParam[parameterId] = [];
      }

      feedbacksByParam[parameterId].push({
        originalScore: fb.originalScore || 0,
        adjustedScore: fb.adjustedScore!,
        comment: fb.comment,
        evaluatorId: fb.evaluatorId,
        evaluatorName: fb.evaluator.name || fb.evaluator.email || "Unknown",
      });
    }

    const results: Record<string, {
      feedbackCount: number;
      avgAdjustment: number;
      newGuidance: string;
      evaluators: string[];
    }> = {};

    // Analyze each parameter and update calibrations
    for (const parameterId of SCORING_PARAMETERS) {
      const paramFeedbacks = feedbacksByParam[parameterId] || [];
      
      if (paramFeedbacks.length === 0) {
        results[parameterId] = {
          feedbackCount: 0,
          avgAdjustment: 0,
          newGuidance: "",
          evaluators: [],
        };
        continue;
      }

      // Calculate average adjustment
      const adjustments = paramFeedbacks.map(f => f.adjustedScore - f.originalScore);
      const avgAdjustment = adjustments.reduce((a, b) => a + b, 0) / adjustments.length;

      // Collect unique evaluators
      const evaluatorIds = [...new Set(paramFeedbacks.map(f => f.evaluatorId))];
      const evaluatorNames = [...new Set(paramFeedbacks.map(f => f.evaluatorName))];

      // Generate guidance based on feedback patterns
      let guidance = "";
      const commonReasons = paramFeedbacks.map(f => f.comment).slice(0, 5).join("; ");
      
      if (avgAdjustment > 0.3) {
        guidance = `Evaluators tend to rate ${parameterId.replace("_", " ")} higher than AI. Consider being more generous. Common feedback: ${commonReasons}`;
      } else if (avgAdjustment < -0.3) {
        guidance = `Evaluators tend to rate ${parameterId.replace("_", " ")} lower than AI. Consider being more strict. Common feedback: ${commonReasons}`;
      } else if (paramFeedbacks.length >= 3) {
        guidance = `AI scoring is generally aligned with evaluators for ${parameterId.replace("_", " ")}. Recent feedback: ${commonReasons}`;
      }

      // Get or create calibration record
      let calibration = await prisma.agentCalibration.findUnique({
        where: { parameterId },
      });

      const previousAdjustment = calibration?.adjustment || 0;
      const previousGuidance = calibration?.guidance || "";

      // Calculate new adjustment (weighted average with existing)
      const newAdjustment = calibration 
        ? (previousAdjustment * 0.3 + avgAdjustment * 0.7) // Gradually shift
        : avgAdjustment;

      // Clamp adjustment to -2 to +2 range
      const clampedAdjustment = Math.max(-2, Math.min(2, newAdjustment));

      if (calibration) {
        // Update existing calibration
        await prisma.agentCalibration.update({
          where: { parameterId },
          data: {
            adjustment: clampedAdjustment,
            guidance: guidance || calibration.guidance,
            totalFeedbacks: calibration.totalFeedbacks + paramFeedbacks.length,
            avgAdjustment: avgAdjustment,
            lastAnalyzedAt: new Date(),
          },
        });
      } else {
        // Create new calibration
        calibration = await prisma.agentCalibration.create({
          data: {
            parameterId,
            adjustment: clampedAdjustment,
            guidance,
            totalFeedbacks: paramFeedbacks.length,
            avgAdjustment: avgAdjustment,
            lastAnalyzedAt: new Date(),
          },
        });
      }

      // Create history entry if there was a meaningful change
      if (Math.abs(clampedAdjustment - previousAdjustment) > 0.1 || guidance !== previousGuidance) {
        await prisma.calibrationHistory.create({
          data: {
            calibrationId: calibration.id,
            previousAdjustment,
            previousGuidance,
            newAdjustment: clampedAdjustment,
            newGuidance: guidance,
            feedbackCount: paramFeedbacks.length,
            periodStart,
            periodEnd,
            analysisSummary: `Analyzed ${paramFeedbacks.length} feedbacks. Average adjustment: ${avgAdjustment.toFixed(2)}. Evaluators: ${evaluatorNames.join(", ")}`,
            evaluatorIds: JSON.stringify(evaluatorIds),
          },
        });
      }

      results[parameterId] = {
        feedbackCount: paramFeedbacks.length,
        avgAdjustment,
        newGuidance: guidance,
        evaluators: evaluatorNames,
      };
    }

    console.log(`[Calibration API] Analysis complete. Results:`, results);

    return NextResponse.json({
      success: true,
      periodStart,
      periodEnd,
      totalFeedbacksAnalyzed: feedbacks.length,
      results,
    });
  } catch (error) {
    console.error("[Calibration API] Error running analysis:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


