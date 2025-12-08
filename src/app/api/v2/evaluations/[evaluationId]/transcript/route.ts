import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/v2/evaluations/[evaluationId]/transcript - Add transcript item
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ evaluationId: string }> }
) {
  try {
    const { evaluationId } = await params;
    const body = await request.json();
    const { role, content, phase } = body;

    if (!role || !content) {
      return NextResponse.json({ error: "Role and content are required" }, { status: 400 });
    }

    const transcriptItem = await prisma.transcriptItem.create({
      data: {
        evaluationId,
        role,
        content,
        phase: phase || "unknown",
      },
    });

    return NextResponse.json(transcriptItem, { status: 201 });
  } catch (error) {
    console.error("Error adding transcript item:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/v2/evaluations/[evaluationId]/transcript - Get transcript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ evaluationId: string }> }
) {
  try {
    const { evaluationId } = await params;

    const transcriptItems = await prisma.transcriptItem.findMany({
      where: { evaluationId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(transcriptItems);
  } catch (error) {
    console.error("Error fetching transcript:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


