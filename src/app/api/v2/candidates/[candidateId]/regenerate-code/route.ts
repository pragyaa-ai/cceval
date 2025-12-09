import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Generate a unique 4-digit access code
function generateAccessCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// POST /api/v2/candidates/[candidateId]/regenerate-code
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { candidateId } = await params;

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

    const candidate = await prisma.candidate.update({
      where: { id: candidateId },
      data: { accessCode },
    });

    return NextResponse.json({ accessCode: candidate.accessCode });
  } catch (error) {
    console.error("Error regenerating access code:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}



