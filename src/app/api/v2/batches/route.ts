import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/v2/batches - Get all batches for the current user or all batches for admin
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date"); // Filter by date (YYYY-MM-DD)
    const status = searchParams.get("status"); // Filter by status

    const whereClause: {
      creatorId?: string;
      status?: string;
      createdAt?: { gte: Date; lt: Date };
    } = {};

    // Admin can see all batches, evaluators see only their own
    if (session.user.role !== "admin") {
      whereClause.creatorId = session.user.id;
    }

    if (status) {
      whereClause.status = status;
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      whereClause.createdAt = {
        gte: startDate,
        lt: endDate,
      };
    }

    const batches = await prisma.batch.findMany({
      where: whereClause,
      include: {
        creator: {
          select: { id: true, name: true, email: true, image: true },
        },
        candidates: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        _count: {
          select: { candidates: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Add summary stats to each batch
    const batchesWithStats = batches.map((batch) => ({
      ...batch,
      totalCandidates: batch._count.candidates,
      completedCandidates: batch.candidates.filter((c) => c.status === "completed").length,
      inProgressCandidates: batch.candidates.filter((c) => c.status === "in_progress").length,
      pendingCandidates: batch.candidates.filter((c) => c.status === "pending").length,
    }));

    return NextResponse.json(batchesWithStats);
  } catch (error) {
    console.error("Error fetching batches:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/v2/batches - Create a new batch
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Batch name is required" }, { status: 400 });
    }

    const batch = await prisma.batch.create({
      data: {
        name,
        creatorId: session.user.id,
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    console.error("Error creating batch:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}



