import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/v2/feedback - Get all feedback with filters (by date, evaluator, parameter)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Filter parameters
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const evaluatorId = searchParams.get("evaluatorId");
    const parameterId = searchParams.get("parameterId");
    const feedbackType = searchParams.get("feedbackType"); // score, voice_quality
    const limit = parseInt(searchParams.get("limit") || "100");
    const page = parseInt(searchParams.get("page") || "1");

    // Build query conditions
    const whereClause: {
      createdAt?: { gte?: Date; lte?: Date };
      evaluatorId?: string;
      feedbackType?: string;
      score?: { parameterId: string };
    } = {};

    if (startDate) {
      whereClause.createdAt = { ...whereClause.createdAt, gte: new Date(startDate) };
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      whereClause.createdAt = { ...whereClause.createdAt, lte: endDateTime };
    }
    if (evaluatorId) {
      whereClause.evaluatorId = evaluatorId;
    }
    if (feedbackType) {
      whereClause.feedbackType = feedbackType;
    }
    if (parameterId) {
      whereClause.score = { parameterId };
    }

    // Get total count for pagination
    const totalCount = await prisma.evaluatorFeedback.count({ where: whereClause });

    // Fetch feedback with related data
    const feedbacks = await prisma.evaluatorFeedback.findMany({
      where: whereClause,
      include: {
        evaluator: {
          select: { id: true, name: true, email: true, image: true },
        },
        score: {
          select: { parameterId: true, score: true },
        },
        evaluation: {
          select: {
            id: true,
            sessionId: true,
            candidate: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get summary statistics
    const stats = await prisma.evaluatorFeedback.groupBy({
      by: ["evaluatorId"],
      where: whereClause,
      _count: { id: true },
    });

    // Get evaluator details for stats
    const evaluatorIds = stats.map(s => s.evaluatorId);
    const evaluators = await prisma.user.findMany({
      where: { id: { in: evaluatorIds } },
      select: { id: true, name: true, email: true },
    });

    const evaluatorStats = stats.map(s => {
      const evaluator = evaluators.find(e => e.id === s.evaluatorId);
      return {
        evaluatorId: s.evaluatorId,
        evaluatorName: evaluator?.name || evaluator?.email || "Unknown",
        feedbackCount: s._count.id,
      };
    });

    // Parameter distribution
    const parameterStats = await prisma.evaluatorFeedback.groupBy({
      by: ["feedbackType"],
      where: { ...whereClause, feedbackType: "score" },
      _count: { id: true },
      _avg: { originalScore: true, adjustedScore: true },
    });

    return NextResponse.json({
      feedbacks: feedbacks.map(f => ({
        id: f.id,
        feedbackType: f.feedbackType,
        parameterId: f.score?.parameterId || f.voiceMetric,
        originalScore: f.originalScore,
        adjustedScore: f.adjustedScore,
        adjustment: f.adjustedScore && f.originalScore ? f.adjustedScore - f.originalScore : null,
        comment: f.comment,
        evaluator: f.evaluator,
        candidate: f.evaluation.candidate,
        sessionId: f.evaluation.sessionId,
        evaluationId: f.evaluationId,
        createdAt: f.createdAt,
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      stats: {
        byEvaluator: evaluatorStats,
        byType: parameterStats,
      },
    });
  } catch (error) {
    console.error("[Feedback API] Error fetching feedback:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
