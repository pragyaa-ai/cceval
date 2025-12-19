import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/v2/evaluations/[evaluationId]/scores - Add or update a score
// This endpoint allows both:
// 1. Authenticated evaluators adding scores (session required)
// 2. AI agent during candidate evaluation (no session, but evaluation must be active)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ evaluationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { evaluationId } = await params;
    const body = await request.json();
    const { parameterId, score, notes } = body;

    if (!parameterId || score === undefined) {
      return NextResponse.json({ error: "Parameter ID and score are required" }, { status: 400 });
    }

    if (score < 1 || score > 5) {
      return NextResponse.json({ error: "Score must be between 1 and 5" }, { status: 400 });
    }

    // Verify evaluation exists and is valid
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      include: { candidate: true },
    });

    if (!evaluation) {
      return NextResponse.json({ error: "Evaluation not found" }, { status: 404 });
    }

    // Allow unauthenticated access ONLY if evaluation is in progress (candidate session)
    // Or authenticated access for evaluators
    const isEvaluationInProgress = evaluation.currentPhase !== "completed" && !evaluation.endTime;
    
    if (!session?.user?.id && !isEvaluationInProgress) {
      console.log(`[Scores API] Unauthorized: no session and evaluation not in progress (phase: ${evaluation.currentPhase})`);
      return NextResponse.json({ error: "Unauthorized - evaluation not active" }, { status: 401 });
    }

    console.log(`[Scores API] Adding score: evaluationId=${evaluationId}, parameterId=${parameterId}, score=${score}, session=${session?.user?.email || 'none (candidate)'}`);

    // Upsert the score
    const scoreEntry = await prisma.score.upsert({
      where: {
        evaluationId_parameterId: {
          evaluationId,
          parameterId,
        },
      },
      update: {
        score,
        notes: notes || "",
      },
      create: {
        evaluationId,
        parameterId,
        score,
        notes: notes || "",
      },
    });

    // Update the scorer on the evaluation (only if we have an authenticated user)
    if (session?.user?.id) {
      await prisma.evaluation.update({
        where: { id: evaluationId },
        data: { scorerId: session.user.id },
      });
    }

    return NextResponse.json(scoreEntry);
  } catch (error) {
    console.error("Error adding score:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/v2/evaluations/[evaluationId]/scores - Get all scores for an evaluation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ evaluationId: string }> }
) {
  try {
    const { evaluationId } = await params;

    const scores = await prisma.score.findMany({
      where: { evaluationId },
      orderBy: { parameterId: "asc" },
    });

    return NextResponse.json(scores);
  } catch (error) {
    console.error("Error fetching scores:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}



