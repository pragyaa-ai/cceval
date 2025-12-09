import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/v2/evaluations/[evaluationId]/scores - Add or update a score
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
    const { parameterId, score, notes } = body;

    if (!parameterId || score === undefined) {
      return NextResponse.json({ error: "Parameter ID and score are required" }, { status: 400 });
    }

    if (score < 1 || score > 5) {
      return NextResponse.json({ error: "Score must be between 1 and 5" }, { status: 400 });
    }

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

    // Update the scorer on the evaluation
    await prisma.evaluation.update({
      where: { id: evaluationId },
      data: { scorerId: session.user.id },
    });

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



