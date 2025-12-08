import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Generate session ID
function generateSessionId(): string {
  return `MHCE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// POST /api/v2/evaluations - Start a new evaluation session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidateId } = body;

    if (!candidateId) {
      return NextResponse.json({ error: "Candidate ID is required" }, { status: 400 });
    }

    // Check if evaluation already exists
    const existing = await prisma.evaluation.findUnique({
      where: { candidateId },
    });

    if (existing) {
      return NextResponse.json({ error: "Evaluation already exists for this candidate" }, { status: 400 });
    }

    // Create evaluation and update candidate status
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


