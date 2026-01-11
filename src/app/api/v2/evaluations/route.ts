import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Generate session ID
function generateSessionId(): string {
  return `MHCE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// POST /api/v2/evaluations - Start a new evaluation session or resume existing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidateId, forceNew = false } = body;

    if (!candidateId) {
      return NextResponse.json({ error: "Candidate ID is required" }, { status: 400 });
    }

    // Check if evaluation already exists
    const existing = await prisma.evaluation.findUnique({
      where: { candidateId },
      include: {
        scores: true,
        transcriptItems: true,
      },
    });

    if (existing) {
      const isCompleted = existing.currentPhase === "completed" || existing.endTime;
      
      // If not completed, allow resuming the existing evaluation
      if (!isCompleted) {
        console.log(`[Evaluations API] Resuming existing evaluation ${existing.id} for candidate ${candidateId}`);
        
        // Update candidate status to in_progress (in case it was changed)
        await prisma.candidate.update({
          where: { id: candidateId },
          data: { status: "in_progress" },
        });
        
        return NextResponse.json({
          ...existing,
          resumed: true,
          message: "Resuming existing evaluation session"
        }, { status: 200 });
      }
      
      // If completed and forceNew is requested, reset the evaluation
      if (isCompleted && forceNew) {
        console.log(`[Evaluations API] Resetting completed evaluation ${existing.id} for candidate ${candidateId}`);
        
        // Delete existing scores, transcript items, and phase results
        await prisma.$transaction([
          prisma.score.deleteMany({ where: { evaluationId: existing.id } }),
          prisma.transcriptItem.deleteMany({ where: { evaluationId: existing.id } }),
          prisma.phaseResult.deleteMany({ where: { evaluationId: existing.id } }),
          prisma.evaluation.update({
            where: { id: existing.id },
            data: {
              sessionId: generateSessionId(),
              currentPhase: "personal_questions",
              startTime: new Date(),
              endTime: null,
              voiceAnalysisData: null,
              recordingUrl: null,
              recordingDuration: 0,
            },
          }),
          prisma.candidate.update({
            where: { id: candidateId },
            data: { status: "in_progress" },
          }),
        ]);
        
        // Fetch the updated evaluation
        const resetEvaluation = await prisma.evaluation.findUnique({
          where: { id: existing.id },
        });
        
        return NextResponse.json({
          ...resetEvaluation,
          reset: true,
          message: "Evaluation has been reset for a new attempt"
        }, { status: 200 });
      }
      
      // If completed and no forceNew, return error with option to retry
      if (isCompleted) {
        return NextResponse.json({ 
          error: "Evaluation already completed for this candidate",
          evaluationId: existing.id,
          canRetry: true,
          message: "Pass forceNew: true to start a fresh evaluation"
        }, { status: 400 });
      }
    }

    // Create new evaluation and update candidate status
    const [evaluation] = await prisma.$transaction([
      prisma.evaluation.create({
        data: {
          sessionId: generateSessionId(),
          candidateId,
          currentPhase: "personal_questions",
          startTime: new Date(),
        },
      }),
      prisma.candidate.update({
        where: { id: candidateId },
        data: { status: "in_progress" },
      }),
    ]);

    return NextResponse.json(evaluation, { status: 201 });
  } catch (error) {
    console.error("Error creating evaluation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/v2/evaluations - Get evaluations with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get("batchId");
    const status = searchParams.get("status");

    const whereClause: {
      candidate?: { batchId: string };
      currentPhase?: string;
    } = {};

    if (batchId) {
      whereClause.candidate = { batchId };
    }

    if (status) {
      whereClause.currentPhase = status;
    }

    const evaluations = await prisma.evaluation.findMany({
      where: whereClause,
      include: {
        candidate: {
          include: {
            batch: true,
          },
        },
        scores: true,
        scorer: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(evaluations);
  } catch (error) {
    console.error("Error fetching evaluations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}



