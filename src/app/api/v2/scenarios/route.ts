import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/v2/scenarios - List scenarios for user's organization
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const includeDetails = searchParams.get("include") === "details";

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      // Return empty array if user has no organization
      return NextResponse.json([]);
    }

    const whereClause: Record<string, unknown> = {
      organizationId: user.organizationId,
    };

    if (status) {
      whereClause.status = status;
    }

    const scenarios = await prisma.evaluationScenario.findMany({
      where: whereClause,
      orderBy: [
        { isDefault: "desc" },
        { updatedAt: "desc" },
      ],
      include: includeDetails
        ? {
            criteria: {
              where: { isActive: true },
              orderBy: { displayOrder: "asc" },
            },
            readingPassages: {
              where: { isActive: true },
            },
            rolePlayScenarios: {
              where: { isActive: true },
              orderBy: { displayOrder: "asc" },
            },
            _count: {
              select: {
                criteria: true,
                readingPassages: true,
                rolePlayScenarios: true,
                sampleRecordings: true,
                batches: true,
              },
            },
            createdBy: {
              select: { id: true, name: true, email: true },
            },
          }
        : {
            _count: {
              select: {
                criteria: true,
                batches: true,
              },
            },
          },
    });

    return NextResponse.json(scenarios);
  } catch (error) {
    console.error("Error fetching scenarios:", error);
    return NextResponse.json(
      { error: "Failed to fetch scenarios" },
      { status: 500 }
    );
  }
}

// POST /api/v2/scenarios - Create a new scenario
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true, role: true },
    });

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: "User must belong to an organization to create scenarios" },
        { status: 400 }
      );
    }

    // Check if user has permission (admin or org_admin)
    if (!["admin", "org_admin", "evaluator"].includes(user.role || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      industry,
      roleType,
      agentName,
      agentVoice,
      agentPersona,
      isDefault,
    } = body;

    if (!name || !description) {
      return NextResponse.json(
        { error: "Name and description are required" },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.evaluationScenario.updateMany({
        where: {
          organizationId: user.organizationId,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    const scenario = await prisma.evaluationScenario.create({
      data: {
        name,
        description,
        industry,
        roleType,
        agentName: agentName || "Eva",
        agentVoice: agentVoice || "coral",
        agentPersona: agentPersona || "",
        organizationId: user.organizationId,
        createdById: session.user.id,
        isDefault: isDefault || false,
        status: "draft",
      },
      include: {
        _count: {
          select: {
            criteria: true,
            batches: true,
          },
        },
      },
    });

    return NextResponse.json(scenario, { status: 201 });
  } catch (error) {
    console.error("Error creating scenario:", error);
    return NextResponse.json(
      { error: "Failed to create scenario" },
      { status: 500 }
    );
  }
}




