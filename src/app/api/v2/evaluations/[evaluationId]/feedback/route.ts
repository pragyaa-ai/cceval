import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/v2/evaluations/[evaluationId]/feedback - Get all feedback for an evaluation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ evaluationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { evaluationId } = await params;

    const feedbacks = await prisma.evaluatorFeedback.findMany({
      where: { evaluationId },
      include: {
        evaluator: {
          select: { id: true, name: true, email: true, image: true },
        },
        score: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(feedbacks);
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/v2/evaluations/[evaluationId]/feedback - Add new feedback
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ evaluationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { evaluationId } = await params;
    const body = await request.json();

    const {
      feedbackType, // "score" or "voice_quality"
      scoreId,      // For score feedback - the specific Score record ID
      parameterId,  // Alternative: find Score by parameterId
      voiceMetric,  // For voice_quality: "clarity", "volume", "tone", "pace", "overall"
      originalScore,
      adjustedScore,
      comment,
    } = body;

    if (!feedbackType) {
      return NextResponse.json({ error: "feedbackType is required" }, { status: 400 });
    }

    if (!comment || comment.trim() === "") {
      return NextResponse.json({ error: "Comment is required" }, { status: 400 });
    }

    // Verify evaluation exists
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      include: { scores: true },
    });

    if (!evaluation) {
      return NextResponse.json({ error: "Evaluation not found" }, { status: 404 });
    }

    // Build feedback data
    const feedbackData: {
      evaluationId: string;
      evaluatorId: string;
      feedbackType: string;
      scoreId?: string;
      voiceMetric?: string;
      originalScore?: number;
      adjustedScore?: number;
      comment: string;
    } = {
      evaluationId,
      evaluatorId: session.user.id,
      feedbackType,
      comment: comment.trim(),
    };

    // Handle score feedback
    if (feedbackType === "score") {
      let resolvedScoreId = scoreId;
      
      // If parameterId is provided instead of scoreId, find the score
      if (!resolvedScoreId && parameterId) {
        const score = evaluation.scores.find((s) => s.parameterId === parameterId);
        if (score) {
          resolvedScoreId = score.id;
        }
      }

      if (resolvedScoreId) {
        feedbackData.scoreId = resolvedScoreId;
      }
    }

    // Handle voice quality feedback
    if (feedbackType === "voice_quality" && voiceMetric) {
      feedbackData.voiceMetric = voiceMetric;
    }

    // Set scores
    if (originalScore !== undefined) feedbackData.originalScore = originalScore;
    if (adjustedScore !== undefined) feedbackData.adjustedScore = adjustedScore;

    // Create feedback
    const feedback = await prisma.evaluatorFeedback.create({
      data: feedbackData,
      include: {
        evaluator: {
          select: { id: true, name: true, email: true, image: true },
        },
        score: true,
      },
    });

    // If there's an adjusted score for a scoring parameter, update or create the score record
    if (feedbackType === "score" && adjustedScore !== undefined && parameterId) {
      if (feedbackData.scoreId) {
        // Update existing score
        await prisma.score.update({
          where: { id: feedbackData.scoreId },
          data: { 
            score: adjustedScore,
            notes: `[Evaluator adjusted] ${comment.trim().substring(0, 200)}`,
          },
        });
      } else {
        // Create new score if it doesn't exist
        const newScore = await prisma.score.create({
          data: {
            evaluationId,
            parameterId,
            score: adjustedScore,
            notes: `[Evaluator created] ${comment.trim().substring(0, 200)}`,
          },
        });
        console.log(`[Feedback API] Created missing score for ${parameterId}: ${newScore.id}`);
        
        // Update the feedback record with the new scoreId
        await prisma.evaluatorFeedback.update({
          where: { id: feedback.id },
          data: { scoreId: newScore.id },
        });
      }
    }

    // If there's an adjusted score for voice quality, we need to update the voiceAnalysisData
    if (feedbackType === "voice_quality" && adjustedScore !== undefined && voiceMetric) {
      try {
        let voiceData = evaluation.voiceAnalysisData 
          ? JSON.parse(evaluation.voiceAnalysisData) 
          : {};
        
        // Map metric name to field in voiceAnalysisData
        const metricFieldMap: Record<string, string> = {
          clarity: "clarityScore",
          volume: "volumeScore",
          tone: "toneScore",
          pace: "paceScore",
          overall: "overallScore",
        };

        const fieldName = metricFieldMap[voiceMetric];
        if (fieldName) {
          voiceData[fieldName] = adjustedScore;
          
          // Recalculate overall score if a component metric was adjusted
          if (voiceMetric !== "overall") {
            const clarityScore = voiceMetric === "clarity" ? adjustedScore : (voiceData.clarityScore || 0);
            const volumeScore = voiceMetric === "volume" ? adjustedScore : (voiceData.volumeScore || 0);
            const paceScore = voiceMetric === "pace" ? adjustedScore : (voiceData.paceScore || 0);
            const toneScore = voiceMetric === "tone" ? adjustedScore : (voiceData.toneScore || 0);
            
            voiceData.overallScore = Math.round(
              (clarityScore * 0.35) + (volumeScore * 0.25) + (paceScore * 0.25) + (toneScore * 0.15)
            );
          }

          await prisma.evaluation.update({
            where: { id: evaluationId },
            data: { voiceAnalysisData: JSON.stringify(voiceData) },
          });
        }
      } catch (error) {
        console.error("Error updating voice analysis data:", error);
        // Continue - the feedback is already saved
      }
    }

    console.log(`[Feedback API] Created feedback: ${feedback.id} by ${session.user.email}`);

    // Auto-calibration: Check if we've reached the threshold (every 10 feedbacks)
    const AUTO_CALIBRATION_THRESHOLD = 10;
    try {
      // Count feedbacks since last calibration
      const lastCalibration = await prisma.calibrationHistory.findFirst({
        orderBy: { createdAt: "desc" },
      });

      const feedbacksSinceLastCalibration = await prisma.evaluatorFeedback.count({
        where: lastCalibration ? {
          createdAt: { gt: lastCalibration.createdAt },
        } : {},
      });

      if (feedbacksSinceLastCalibration >= AUTO_CALIBRATION_THRESHOLD) {
        console.log(`[Feedback API] 🔄 Auto-calibration triggered (${feedbacksSinceLastCalibration} feedbacks since last calibration)`);
        
        // Trigger calibration in the background (don't await to not slow down response)
        runAutoCalibration(session.user.id).catch((err) => {
          console.error("[Auto-Calibration] Error:", err);
        });
      }
    } catch (calibrationError) {
      // Don't fail the request if calibration check fails
      console.error("[Feedback API] Error checking auto-calibration:", calibrationError);
    }

    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    console.error("Error creating feedback:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Auto-calibration function (runs in background)
async function runAutoCalibration(triggeredById: string) {
  try {
    const periodDays = 7; // Analyze last 7 days
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - periodDays);

    // Get all recent feedbacks with score adjustments
    const feedbacks = await prisma.evaluatorFeedback.findMany({
      where: {
        createdAt: { gte: periodStart },
        adjustedScore: { not: null },
        feedbackType: "score",
      },
      include: {
        score: true,
        evaluator: { select: { id: true, name: true, email: true } },
      },
    });

    if (feedbacks.length === 0) {
      console.log("[Auto-Calibration] No feedbacks with adjustments found");
      return;
    }

    // Group feedbacks by parameterId
    const feedbacksByParam: Record<string, typeof feedbacks> = {};
    for (const fb of feedbacks) {
      const paramId = fb.score?.parameterId;
      if (!paramId) continue;
      if (!feedbacksByParam[paramId]) feedbacksByParam[paramId] = [];
      feedbacksByParam[paramId].push(fb);
    }

    // Calculate adjustments for each parameter
    for (const [parameterId, paramFeedbacks] of Object.entries(feedbacksByParam)) {
      if (paramFeedbacks.length < 2) continue; // Need at least 2 feedbacks

      // Calculate average adjustment
      const adjustments = paramFeedbacks
        .filter((f) => f.originalScore !== null && f.adjustedScore !== null)
        .map((f) => (f.adjustedScore as number) - (f.originalScore as number));

      if (adjustments.length === 0) continue;

      const avgAdjustment = adjustments.reduce((a, b) => a + b, 0) / adjustments.length;

      // Get common themes from comments
      const comments = paramFeedbacks.map((f) => f.comment).filter(Boolean);
      const newGuidance = comments.length > 0 
        ? `Evaluator feedback themes: ${comments.slice(0, 3).join("; ").substring(0, 200)}`
        : "";

      // Upsert calibration
      const existing = await prisma.agentCalibration.findUnique({
        where: { parameterId },
      });

      const previousAdjustment = existing?.avgAdjustment || 0;
      const previousGuidance = existing?.guidance || "";

      const calibration = await prisma.agentCalibration.upsert({
        where: { parameterId },
        update: {
          adjustment: avgAdjustment,
          avgAdjustment,
          totalFeedbacks: paramFeedbacks.length,
          guidance: newGuidance,
          lastAnalyzedAt: new Date(),
        },
        create: {
          parameterId,
          adjustment: avgAdjustment,
          avgAdjustment,
          totalFeedbacks: paramFeedbacks.length,
          guidance: newGuidance,
          lastAnalyzedAt: new Date(),
        },
      });

      // Collect evaluator IDs
      const evaluatorIds = [...new Set(paramFeedbacks.map(f => f.evaluatorId))];

      // Log history
      await prisma.calibrationHistory.create({
        data: {
          calibrationId: calibration.id,
          previousAdjustment,
          previousGuidance,
          newAdjustment: avgAdjustment,
          newGuidance,
          feedbackCount: paramFeedbacks.length,
          periodStart,
          periodEnd: new Date(),
          analysisSummary: `Auto-calibration: ${paramFeedbacks.length} feedbacks analyzed`,
          evaluatorIds: JSON.stringify(evaluatorIds),
        },
      });
    }

    console.log(`[Auto-Calibration] ✅ Complete - updated ${Object.keys(feedbacksByParam).length} parameters`);
  } catch (error) {
    console.error("[Auto-Calibration] Failed:", error);
    throw error;
  }
}

// DELETE /api/v2/evaluations/[evaluationId]/feedback - Delete a specific feedback
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ evaluationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { evaluationId } = await params;
    const { searchParams } = new URL(request.url);
    const feedbackId = searchParams.get("feedbackId");

    if (!feedbackId) {
      return NextResponse.json({ error: "feedbackId is required" }, { status: 400 });
    }

    // Verify feedback belongs to this evaluation and user owns it (or is admin)
    const feedback = await prisma.evaluatorFeedback.findUnique({
      where: { id: feedbackId },
      include: { evaluator: true },
    });

    if (!feedback) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }

    if (feedback.evaluationId !== evaluationId) {
      return NextResponse.json({ error: "Feedback does not belong to this evaluation" }, { status: 400 });
    }

    // Check if user is the feedback owner or admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (feedback.evaluatorId !== session.user.id && user?.role !== "admin") {
      return NextResponse.json({ error: "Not authorized to delete this feedback" }, { status: 403 });
    }

    await prisma.evaluatorFeedback.delete({
      where: { id: feedbackId },
    });

    console.log(`[Feedback API] Deleted feedback: ${feedbackId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

