import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/v2/batches/[batchId] - Get a specific batch with all details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { batchId } = await params;

    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        creator: {
          select: { id: true, name: true, email: true, image: true },
        },
        candidates: {
          include: {
            evaluation: {
              include: {
                scores: true,
                scorer: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    // Check access - only creator or admin can view
    if (session.user.role !== "admin" && batch.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(batch);
  } catch (error) {
    console.error("Error fetching batch:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/v2/batches/[batchId] - Update batch
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { batchId } = await params;
    const body = await request.json();
    const { name, status } = body;

    // Verify ownership
    const existingBatch = await prisma.batch.findUnique({
      where: { id: batchId },
    });

    if (!existingBatch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    if (session.user.role !== "admin" && existingBatch.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: { name?: string; status?: string } = {};
    if (name) updateData.name = name;
    if (status) updateData.status = status;

    const batch = await prisma.batch.update({
      where: { id: batchId },
      data: updateData,
      include: {
        creator: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    return NextResponse.json(batch);
  } catch (error) {
    console.error("Error updating batch:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/v2/batches/[batchId] - Delete batch
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { batchId } = await params;

    // Verify ownership
    const existingBatch = await prisma.batch.findUnique({
      where: { id: batchId },
    });

    if (!existingBatch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    if (session.user.role !== "admin" && existingBatch.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.batch.delete({
      where: { id: batchId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting batch:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


