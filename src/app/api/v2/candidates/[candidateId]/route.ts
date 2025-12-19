import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/v2/candidates/[candidateId] - Get candidate details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  try {
    const { candidateId } = await params;

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        batch: true,
        evaluation: {
          include: {
            scores: true,
            transcriptItems: {
              orderBy: { createdAt: "asc" },
            },
            phaseResults: true,
            scorer: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    return NextResponse.json(candidate);
  } catch (error) {
    console.error("Error fetching candidate:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/v2/candidates/[candidateId] - Update candidate
// Allows unauthenticated status updates to "completed" (for candidate session ending)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { candidateId } = await params;
    const body = await request.json();
    const { name, email, phone, status, selectedPassage, selectedScenario } = body;

    // Allow unauthenticated access ONLY for status update to "completed"
    // (This is how candidates end their evaluation session)
    const isCompletingEvaluation = status === "completed" && Object.keys(body).length === 1;
    
    if (!session?.user?.id && !isCompletingEvaluation) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // For completing evaluation, verify candidate has an active evaluation
    if (isCompletingEvaluation) {
      const candidate = await prisma.candidate.findUnique({
        where: { id: candidateId },
        include: { evaluation: true },
      });
      
      if (!candidate) {
        return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
      }
      
      // Only allow completing if there's an evaluation in progress
      if (!candidate.evaluation || candidate.status === "completed") {
        return NextResponse.json({ error: "No active evaluation to complete" }, { status: 400 });
      }
      
      console.log(`[Candidates API] Candidate ${candidateId} completing evaluation (unauthenticated)`);
    }

    // Build update data
    const updateData: {
      name?: string;
      email?: string | null;
      phone?: string | null;
      status?: string;
      selectedPassage?: string;
      selectedScenario?: string;
    } = {};
    
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (status !== undefined) updateData.status = status;
    if (selectedPassage !== undefined) updateData.selectedPassage = selectedPassage;
    if (selectedScenario !== undefined) updateData.selectedScenario = selectedScenario;

    const candidate = await prisma.candidate.update({
      where: { id: candidateId },
      data: updateData,
      include: {
        evaluation: true,
      },
    });

    return NextResponse.json(candidate);
  } catch (error) {
    console.error("Error updating candidate:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/v2/candidates/[candidateId] - Delete candidate
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { candidateId } = await params;

    await prisma.candidate.delete({
      where: { id: candidateId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting candidate:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}



