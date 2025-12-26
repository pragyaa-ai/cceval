import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ scenarioId: string }>;
}

// GET /api/v2/scenarios/[scenarioId] - Get a single scenario with all details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { scenarioId } = await params;
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    const scenario = await prisma.evaluationScenario.findUnique({
      where: { id: scenarioId },
      include: {
        criteria: {
          orderBy: { displayOrder: "asc" },
        },
        readingPassages: {
          orderBy: { createdAt: "asc" },
        },
        rolePlayScenarios: {
          orderBy: { displayOrder: "asc" },
        },
        sampleRecordings: {
          orderBy: { createdAt: "desc" },
          include: {
            uploadedBy: {
              select: { id: true, name: true },
            },
          },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        organization: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: {
            batches: true,
          },
        },
      },
    });

    if (!scenario) {
      return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
    }

    // Check if user has access (same organization or admin)
    if (scenario.organizationId !== user?.organizationId && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(scenario);
  } catch (error) {
    console.error("Error fetching scenario:", error);
    return NextResponse.json(
      { error: "Failed to fetch scenario" },
      { status: 500 }
    );
  }
}

// PATCH /api/v2/scenarios/[scenarioId] - Update a scenario
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { scenarioId } = await params;
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true, role: true },
    });

    // Check if scenario exists and belongs to user's organization
    const existingScenario = await prisma.evaluationScenario.findUnique({
      where: { id: scenarioId },
    });

    if (!existingScenario) {
      return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
    }

    if (existingScenario.organizationId !== user?.organizationId && user?.role !== "admin") {
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
      agentInstructions,
      flowConfig,
      status,
      isDefault,
    } = body;

    // If setting as default, unset other defaults
    if (isDefault && !existingScenario.isDefault) {
      await prisma.evaluationScenario.updateMany({
        where: {
          organizationId: existingScenario.organizationId,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    const scenario = await prisma.evaluationScenario.update({
      where: { id: scenarioId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(industry !== undefined && { industry }),
        ...(roleType !== undefined && { roleType }),
        ...(agentName !== undefined && { agentName }),
        ...(agentVoice !== undefined && { agentVoice }),
        ...(agentPersona !== undefined && { agentPersona }),
        ...(agentInstructions !== undefined && { agentInstructions }),
        ...(flowConfig !== undefined && { flowConfig: JSON.stringify(flowConfig) }),
        ...(status !== undefined && { status }),
        ...(isDefault !== undefined && { isDefault }),
      },
      include: {
        criteria: {
          orderBy: { displayOrder: "asc" },
        },
        _count: {
          select: {
            batches: true,
          },
        },
      },
    });

    return NextResponse.json(scenario);
  } catch (error) {
    console.error("Error updating scenario:", error);
    return NextResponse.json(
      { error: "Failed to update scenario" },
      { status: 500 }
    );
  }
}

// DELETE /api/v2/scenarios/[scenarioId] - Delete a scenario
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { scenarioId } = await params;
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true, role: true },
    });

    // Check if scenario exists and belongs to user's organization
    const scenario = await prisma.evaluationScenario.findUnique({
      where: { id: scenarioId },
      include: {
        _count: {
          select: { batches: true },
        },
      },
    });

    if (!scenario) {
      return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
    }

    if (scenario.organizationId !== user?.organizationId && user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if scenario is in use
    if (scenario._count.batches > 0) {
      return NextResponse.json(
        { error: "Cannot delete scenario that is in use by batches" },
        { status: 400 }
      );
    }

    await prisma.evaluationScenario.delete({
      where: { id: scenarioId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting scenario:", error);
    return NextResponse.json(
      { error: "Failed to delete scenario" },
      { status: 500 }
    );
  }
}




