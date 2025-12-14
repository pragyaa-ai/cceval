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
    
    // Validate evaluationId
    if (!evaluationId) {
      console.error("[PATCH Evaluation] Missing evaluationId");
      return NextResponse.json({ error: "Evaluation ID is required" }, { status: 400 });
    }
    
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("[PATCH Evaluation] Failed to parse request body:", parseError);
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }
    
    const { currentPhase, recordingUrl, recordingDuration, endSession, voiceAnalysisData, endTime } = body;

    console.log(`[PATCH Evaluation] ${evaluationId}:`, {
      currentPhase: currentPhase || null,
      hasVoiceAnalysisData: !!voiceAnalysisData,
      voiceAnalysisDataType: typeof voiceAnalysisData,
      voiceAnalysisDataLength: voiceAnalysisData ? String(voiceAnalysisData).length : 0,
      endSession: !!endSession,
    });

    const updateData: {
      currentPhase?: string;
      recordingUrl?: string;
      recordingDuration?: number;
      endTime?: Date;
      scorerId?: string;
      voiceAnalysisData?: string;
    } = {};

    if (currentPhase) updateData.currentPhase = currentPhase;
    if (recordingUrl) updateData.recordingUrl = recordingUrl;
    if (recordingDuration !== undefined) updateData.recordingDuration = recordingDuration;
    
    // Handle voiceAnalysisData - ensure it's a valid JSON string
    if (voiceAnalysisData !== undefined && voiceAnalysisData !== null) {
      try {
        // If it's already a string, verify it's valid JSON
        if (typeof voiceAnalysisData === 'string') {
          // Try to parse to verify it's valid JSON
          JSON.parse(voiceAnalysisData);
          updateData.voiceAnalysisData = voiceAnalysisData;
          console.log(`[PATCH Evaluation] Voice analysis data is valid JSON string, length: ${voiceAnalysisData.length}`);
        } else {
          // If it's an object, stringify it
          updateData.voiceAnalysisData = JSON.stringify(voiceAnalysisData);
          console.log(`[PATCH Evaluation] Voice analysis data stringified from object, length: ${updateData.voiceAnalysisData.length}`);
        }
      } catch (jsonError) {
        console.error("[PATCH Evaluation] Invalid voiceAnalysisData JSON:", jsonError);
        // Store as-is if it's a string (might not be JSON but still valid text)
        if (typeof voiceAnalysisData === 'string') {
          updateData.voiceAnalysisData = voiceAnalysisData;
        }
      }
    }
    
    if (endTime) updateData.endTime = new Date(endTime);
    
    if (endSession) {
      updateData.endTime = new Date();
      updateData.currentPhase = "completed";
      if (session?.user?.id) {
        updateData.scorerId = session.user.id;
      }
    }

    console.log(`[PATCH Evaluation] Update data keys:`, Object.keys(updateData));

    const evaluation = await prisma.evaluation.update({
      where: { id: evaluationId },
      data: updateData,
    });

    console.log(`[PATCH Evaluation] ✅ Successfully updated evaluation ${evaluationId}`);

    // Update candidate status if completed
    if (endSession) {
      await prisma.candidate.update({
        where: { id: evaluation.candidateId },
        data: { status: "completed" },
      });
      console.log(`[PATCH Evaluation] ✅ Candidate status updated to completed`);
    }

    return NextResponse.json(evaluation);
  } catch (error: any) {
    console.error("[PATCH Evaluation] ❌ Error updating evaluation:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack?.split('\n').slice(0, 5).join('\n'),
    });
    
    // Provide more specific error messages for Prisma errors
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: "Evaluation not found" }, { status: 404 });
    }
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: "Unique constraint violation" }, { status: 409 });
    }
    
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error?.message || "Unknown error"
    }, { status: 500 });
  }
}



