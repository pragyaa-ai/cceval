import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/v2/calibration/history - Get calibration history with optional filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parameterId = searchParams.get("parameterId");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build query
    const whereClause: { calibration?: { parameterId: string } } = {};
    if (parameterId) {
      whereClause.calibration = { parameterId };
    }

    const history = await prisma.calibrationHistory.findMany({
      where: whereClause,
      include: {
        calibration: {
          select: {
            parameterId: true,
            adjustment: true,
            guidance: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Parse evaluator IDs and fetch evaluator names
    const historyWithEvaluators = await Promise.all(
      history.map(async (h) => {
        let evaluatorNames: string[] = [];
        try {
          const evaluatorIds = JSON.parse(h.evaluatorIds) as string[];
          if (evaluatorIds.length > 0) {
            const evaluators = await prisma.user.findMany({
              where: { id: { in: evaluatorIds } },
              select: { id: true, name: true, email: true },
            });
            evaluatorNames = evaluators.map(e => e.name || e.email || "Unknown");
          }
        } catch {
          // Ignore parse errors
        }

        return {
          id: h.id,
          parameterId: h.calibration.parameterId,
          previousAdjustment: h.previousAdjustment,
          newAdjustment: h.newAdjustment,
          previousGuidance: h.previousGuidance,
          newGuidance: h.newGuidance,
          feedbackCount: h.feedbackCount,
          periodStart: h.periodStart,
          periodEnd: h.periodEnd,
          analysisSummary: h.analysisSummary,
          evaluators: evaluatorNames,
          createdAt: h.createdAt,
        };
      })
    );

    return NextResponse.json({
      history: historyWithEvaluators,
      total: historyWithEvaluators.length,
    });
  } catch (error) {
    console.error("[Calibration History API] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


