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

    // If there's an adjusted score for a scoring parameter, update the score record
    if (feedbackType === "score" && adjustedScore !== undefined && feedbackData.scoreId) {
      await prisma.score.update({
        where: { id: feedbackData.scoreId },
        data: { score: adjustedScore },
      });
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

    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    console.error("Error creating feedback:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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

