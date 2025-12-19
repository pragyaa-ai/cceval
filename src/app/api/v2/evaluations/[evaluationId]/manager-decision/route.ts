import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/v2/evaluations/[evaluationId]/manager-decision
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

    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      select: {
        id: true,
        managerDecision: true,
        managerComments: true,
        managerName: true,
        managerDesignation: true,
        managerDecisionAt: true,
      },
    });

    if (!evaluation) {
      return NextResponse.json({ error: "Evaluation not found" }, { status: 404 });
    }

    return NextResponse.json({
      decision: evaluation.managerDecision,
      comments: evaluation.managerComments,
      name: evaluation.managerName,
      designation: evaluation.managerDesignation,
      decidedAt: evaluation.managerDecisionAt,
    });
  } catch (error) {
    console.error("[Manager Decision API] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/v2/evaluations/[evaluationId]/manager-decision
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
    const { decision, comments, name, designation } = body;

    if (!decision || !["hire", "dont_hire", "improvement_needed"].includes(decision)) {
      return NextResponse.json({ 
        error: "Invalid decision. Must be 'hire', 'dont_hire', or 'improvement_needed'" 
      }, { status: 400 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Manager name is required" }, { status: 400 });
    }

    const evaluation = await prisma.evaluation.update({
      where: { id: evaluationId },
      data: {
        managerDecision: decision,
        managerComments: comments || "",
        managerName: name.trim(),
        managerDesignation: designation || "",
        managerDecisionAt: new Date(),
      },
    });

    console.log(`[Manager Decision API] Decision saved: ${evaluationId} - ${decision} by ${name}`);

    return NextResponse.json({
      success: true,
      decision: evaluation.managerDecision,
      comments: evaluation.managerComments,
      name: evaluation.managerName,
      designation: evaluation.managerDesignation,
      decidedAt: evaluation.managerDecisionAt,
    });
  } catch (error) {
    console.error("[Manager Decision API] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
