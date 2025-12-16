import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/v2/evaluations/[evaluationId]/transcript - Add or update transcript item
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ evaluationId: string }> }
) {
  try {
    const { evaluationId } = await params;
    const body = await request.json();
    const { role, content, phase, itemId } = body;

    if (!role || !content) {
      return NextResponse.json({ error: "Role and content are required" }, { status: 400 });
    }

    // If itemId provided, check if we already have a shorter version of this message
    // and update it instead of creating a duplicate
    if (itemId) {
      // Look for recent messages from same role that this might be updating
      const recentItems = await prisma.transcriptItem.findMany({
        where: {
          evaluationId,
          role,
          createdAt: {
            gte: new Date(Date.now() - 60000), // Within last 60 seconds
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      // Check if any recent message is a prefix of the new content (partial that grew)
      for (const item of recentItems) {
        if (content.startsWith(item.content.substring(0, 20)) && content.length > item.content.length) {
          // Update the existing item with the longer content
          const updated = await prisma.transcriptItem.update({
            where: { id: item.id },
            data: { content, phase: phase || item.phase },
          });
          return NextResponse.json(updated, { status: 200 });
        }
      }
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

// PUT /api/v2/evaluations/[evaluationId]/transcript - Update transcript item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ evaluationId: string }> }
) {
  try {
    const { evaluationId } = await params;
    const body = await request.json();
    const { role, content, phase, itemId } = body;

    if (!role || !content) {
      return NextResponse.json({ error: "Role and content are required" }, { status: 400 });
    }

    // Find recent message from same role that might be a partial version
    const recentItems = await prisma.transcriptItem.findMany({
      where: {
        evaluationId,
        role,
        createdAt: {
          gte: new Date(Date.now() - 120000), // Within last 2 minutes
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Find the item that this content is an update of
    for (const item of recentItems) {
      // Check if new content starts with same prefix as existing (it's an update)
      if (content.startsWith(item.content.substring(0, Math.min(20, item.content.length)))) {
        const updated = await prisma.transcriptItem.update({
          where: { id: item.id },
          data: { content, phase: phase || item.phase },
        });
        return NextResponse.json(updated, { status: 200 });
      }
    }

    // If no match found, create new (fallback)
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
    console.error("Error updating transcript item:", error);
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



