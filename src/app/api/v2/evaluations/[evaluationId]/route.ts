import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/v2/evaluations/[evaluationId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ evaluationId: string }> }
) {
  try {
    const { evaluationId } = await params;

    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      include: {
        candidate: {
          include: { batch: true },
        },
        scores: true,
        transcriptItems: {
          orderBy: { createdAt: "asc" },
        },
        phaseResults: true,
        scorer: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!evaluation) {
      return NextResponse.json({ error: "Evaluation not found" }, { status: 404 });
    }

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error("Error fetching evaluation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/v2/evaluations/[evaluationId] - Update evaluation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ evaluationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { evaluationId } = await params;
    const body = await request.json();
    const { currentPhase, recordingUrl, recordingDuration, endSession } = body;

    const updateData: {
      currentPhase?: string;
      recordingUrl?: string;
      recordingDuration?: number;
      endTime?: Date;
      scorerId?: string;
    } = {};

    if (currentPhase) updateData.currentPhase = currentPhase;
    if (recordingUrl) updateData.recordingUrl = recordingUrl;
    if (recordingDuration !== undefined) updateData.recordingDuration = recordingDuration;
    
    if (endSession) {
      updateData.endTime = new Date();
      updateData.currentPhase = "completed";
      if (session?.user?.id) {
        updateData.scorerId = session.user.id;
      }
    }

    const evaluation = await prisma.evaluation.update({
      where: { id: evaluationId },
      data: updateData,
    });

    // Update candidate status if completed
    if (endSession) {
      await prisma.candidate.update({
        where: { id: evaluation.candidateId },
        data: { status: "completed" },
      });
    }

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error("Error updating evaluation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


