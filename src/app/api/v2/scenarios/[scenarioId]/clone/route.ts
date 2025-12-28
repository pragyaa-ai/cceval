import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ scenarioId: string }>;
}

// POST /api/v2/scenarios/[scenarioId]/clone
// Clone a scenario with selected criteria
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    if (!user?.organizationId) {
      return NextResponse.json(
        { error: "User must belong to an organization" },
        { status: 400 }
      );
    }

    // Get the source scenario with all related data
    const sourceScenario = await prisma.evaluationScenario.findUnique({
      where: { id: scenarioId },
      include: {
        criteria: true,
        readingPassages: true,
        rolePlayScenarios: true,
      },
    });

    if (!sourceScenario) {
      return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      description,
      industry,
      roleType,
      // Criteria to include (by parameterId)
      includeCriteria = [], // Array of parameterIds to include
      // Additional new criteria to add
      newCriteria = [], // Array of new criteria objects
      // Whether to include passages and role-plays
      includePassages = true,
      includeRolePlays = true,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required for cloned scenario" },
        { status: 400 }
      );
    }

    // Create the cloned scenario
    const clonedScenario = await prisma.evaluationScenario.create({
      data: {
        name,
        description: description || sourceScenario.description,
        industry: industry || sourceScenario.industry,
        roleType: roleType || sourceScenario.roleType,
        organizationId: user.organizationId,
        agentName: sourceScenario.agentName,
        agentVoice: sourceScenario.agentVoice,
        agentPersona: sourceScenario.agentPersona,
        status: "draft",
        isDefault: false,
        createdById: session.user.id,
      },
    });

    // Clone selected criteria
    const criteriaToClone = includeCriteria.length > 0
      ? sourceScenario.criteria.filter(c => includeCriteria.includes(c.parameterId))
      : sourceScenario.criteria;

    for (const criteria of criteriaToClone) {
      await prisma.scoringCriteria.create({
        data: {
          scenarioId: clonedScenario.id,
          parameterId: criteria.parameterId,
          label: criteria.label,
          description: criteria.description,
          minScore: criteria.minScore,
          maxScore: criteria.maxScore,
          weight: criteria.weight,
          scoringGuidance: criteria.scoringGuidance,
          scoreExamples: criteria.scoreExamples,
          category: criteria.category,
          displayOrder: criteria.displayOrder,
          isRequired: criteria.isRequired,
          isSuggested: false,
        },
      });
    }

    // Add new criteria
    for (let i = 0; i < newCriteria.length; i++) {
      const criteria = newCriteria[i];
      await prisma.scoringCriteria.create({
        data: {
          scenarioId: clonedScenario.id,
          parameterId: criteria.parameterId,
          label: criteria.label,
          description: criteria.description,
          minScore: criteria.minScore || 1,
          maxScore: criteria.maxScore || 5,
          weight: criteria.weight || 1.0,
          scoringGuidance: criteria.scoringGuidance || "",
          scoreExamples: JSON.stringify(criteria.scoreExamples || []),
          category: criteria.category || "general",
          displayOrder: criteriaToClone.length + i + 1,
          isRequired: criteria.isRequired !== false,
          isSuggested: false,
        },
      });
    }

    // Clone reading passages if requested
    if (includePassages && sourceScenario.readingPassages.length > 0) {
      for (const passage of sourceScenario.readingPassages) {
        await prisma.readingPassage.create({
          data: {
            scenarioId: clonedScenario.id,
            title: passage.title,
            text: passage.text,
            wordCount: passage.wordCount,
            context: passage.context,
            difficulty: passage.difficulty,
            isActive: passage.isActive,
            isDefault: passage.isDefault,
          },
        });
      }
    }

    // Clone role-play scenarios if requested
    if (includeRolePlays && sourceScenario.rolePlayScenarios.length > 0) {
      for (const rolePlay of sourceScenario.rolePlayScenarios) {
        await prisma.rolePlayScenario.create({
          data: {
            scenarioId: clonedScenario.id,
            title: rolePlay.title,
            description: rolePlay.description,
            customerName: rolePlay.customerName,
            customerPersona: rolePlay.customerPersona,
            customerMood: rolePlay.customerMood,
            openingLine: rolePlay.openingLine,
            context: rolePlay.context,
            expectedBehaviors: rolePlay.expectedBehaviors,
            escalationTriggers: rolePlay.escalationTriggers,
            difficulty: rolePlay.difficulty,
            isActive: rolePlay.isActive,
            displayOrder: rolePlay.displayOrder,
          },
        });
      }
    }

    // Fetch the complete cloned scenario
    const result = await prisma.evaluationScenario.findUnique({
      where: { id: clonedScenario.id },
      include: {
        criteria: {
          orderBy: { displayOrder: "asc" },
        },
        readingPassages: true,
        rolePlayScenarios: {
          orderBy: { displayOrder: "asc" },
        },
        _count: {
          select: {
            criteria: true,
            batches: true,
          },
        },
      },
    });

    return NextResponse.json({
      scenario: result,
      clonedFrom: {
        id: sourceScenario.id,
        name: sourceScenario.name,
      },
      stats: {
        criteriaCloned: criteriaToClone.length,
        newCriteriaAdded: newCriteria.length,
        passagesCloned: includePassages ? sourceScenario.readingPassages.length : 0,
        rolePlaysCloned: includeRolePlays ? sourceScenario.rolePlayScenarios.length : 0,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Error cloning scenario:", error);
    return NextResponse.json(
      { error: "Failed to clone scenario" },
      { status: 500 }
    );
  }
}

