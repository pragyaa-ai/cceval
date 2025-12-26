import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ scenarioId: string }>;
}

// GET /api/v2/scenarios/[scenarioId]/criteria - List all criteria for a scenario
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { scenarioId } = await params;
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    const whereClause: Record<string, unknown> = { scenarioId };
    if (!includeInactive) {
      whereClause.isActive = true;
    }

    const criteria = await prisma.scoringCriteria.findMany({
      where: whereClause,
      orderBy: [
        { category: "asc" },
        { displayOrder: "asc" },
      ],
    });

    return NextResponse.json(criteria);
  } catch (error) {
    console.error("Error fetching criteria:", error);
    return NextResponse.json(
      { error: "Failed to fetch criteria" },
      { status: 500 }
    );
  }
}

// POST /api/v2/scenarios/[scenarioId]/criteria - Add new criteria to a scenario
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { scenarioId } = await params;
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify scenario exists and user has access
    const scenario = await prisma.evaluationScenario.findUnique({
      where: { id: scenarioId },
      select: { organizationId: true },
    });

    if (!scenario) {
      return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    if (scenario.organizationId !== user?.organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    
    // Support bulk creation
    const criteriaList = Array.isArray(body) ? body : [body];

    const createdCriteria = await Promise.all(
      criteriaList.map(async (criteriaData, index) => {
        const {
          parameterId,
          label,
          description,
          minScore,
          maxScore,
          weight,
          scoringGuidance,
          scoreExamples,
          category,
          displayOrder,
          isRequired,
          isSuggested,
        } = criteriaData;

        if (!parameterId || !label || !description) {
          throw new Error(`Criteria at index ${index}: parameterId, label, and description are required`);
        }

        // Get max display order if not provided
        let order = displayOrder;
        if (order === undefined) {
          const maxOrder = await prisma.scoringCriteria.aggregate({
            where: { scenarioId },
            _max: { displayOrder: true },
          });
          order = (maxOrder._max.displayOrder || 0) + 1;
        }

        return prisma.scoringCriteria.upsert({
          where: {
            scenarioId_parameterId: {
              scenarioId,
              parameterId,
            },
          },
          create: {
            scenarioId,
            parameterId,
            label,
            description,
            minScore: minScore || 1,
            maxScore: maxScore || 5,
            weight: weight || 1.0,
            scoringGuidance: scoringGuidance || "",
            scoreExamples: JSON.stringify(scoreExamples || []),
            category: category || "general",
            displayOrder: order,
            isRequired: isRequired !== false,
            isSuggested: isSuggested || false,
          },
          update: {
            label,
            description,
            minScore: minScore || 1,
            maxScore: maxScore || 5,
            weight: weight || 1.0,
            scoringGuidance: scoringGuidance || "",
            scoreExamples: JSON.stringify(scoreExamples || []),
            category: category || "general",
            displayOrder: order,
            isRequired: isRequired !== false,
            isActive: true,
          },
        });
      })
    );

    return NextResponse.json(
      Array.isArray(body) ? createdCriteria : createdCriteria[0],
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating criteria:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create criteria" },
      { status: 500 }
    );
  }
}

// PATCH /api/v2/scenarios/[scenarioId]/criteria - Bulk update criteria (for reordering)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { scenarioId } = await params;
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { updates } = body; // Array of { id, displayOrder, isActive, etc. }

    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: "Updates array is required" },
        { status: 400 }
      );
    }

    await Promise.all(
      updates.map((update: { id: string; displayOrder?: number; isActive?: boolean }) =>
        prisma.scoringCriteria.update({
          where: { id: update.id },
          data: {
            ...(update.displayOrder !== undefined && { displayOrder: update.displayOrder }),
            ...(update.isActive !== undefined && { isActive: update.isActive }),
          },
        })
      )
    );

    const criteria = await prisma.scoringCriteria.findMany({
      where: { scenarioId },
      orderBy: { displayOrder: "asc" },
    });

    return NextResponse.json(criteria);
  } catch (error) {
    console.error("Error updating criteria:", error);
    return NextResponse.json(
      { error: "Failed to update criteria" },
      { status: 500 }
    );
  }
}




