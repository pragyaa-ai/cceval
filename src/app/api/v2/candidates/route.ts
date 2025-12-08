import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Generate a unique 4-digit access code
function generateAccessCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// POST /api/v2/candidates - Add candidate(s) to a batch
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { batchId, candidates } = body;

    if (!batchId) {
      return NextResponse.json({ error: "Batch ID is required" }, { status: 400 });
    }

    // Verify batch ownership
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    if (session.user.role !== "admin" && batch.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Handle single or bulk candidate creation
    const candidateList = Array.isArray(candidates) ? candidates : [candidates];

    const createdCandidates = await Promise.all(
      candidateList.map(async (c: { name: string; email?: string; phone?: string; selectedPassage?: string; selectedScenario?: string }) => {
        // Generate unique access code
        let accessCode = generateAccessCode();
        let attempts = 0;
        while (attempts < 10) {
          const existing = await prisma.candidate.findUnique({
            where: { accessCode },
          });
          if (!existing) break;
          accessCode = generateAccessCode();
          attempts++;
        }

        return prisma.candidate.create({
          data: {
            name: c.name,
            email: c.email || null,
            phone: c.phone || null,
            accessCode,
            batchId,
            selectedPassage: c.selectedPassage || "safety_adas",
            selectedScenario: c.selectedScenario || "beginner",
          },
        });
      })
    );

    return NextResponse.json(createdCandidates, { status: 201 });
  } catch (error) {
    console.error("Error creating candidates:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/v2/candidates - Get candidate by access code (for candidate app)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accessCode = searchParams.get("accessCode");

    if (!accessCode) {
      return NextResponse.json({ error: "Access code is required" }, { status: 400 });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { accessCode },
      include: {
        batch: {
          select: { id: true, name: true, status: true },
        },
        evaluation: true,
      },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    // Don't allow access if batch is archived
    if (candidate.batch.status === "archived") {
      return NextResponse.json({ error: "This evaluation batch has been archived" }, { status: 403 });
    }

    return NextResponse.json(candidate);
  } catch (error) {
    console.error("Error fetching candidate:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


