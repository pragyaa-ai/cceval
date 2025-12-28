import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/v2/scenarios/templates
// List all template scenarios (from the sample organization)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get templates - scenarios from the sample org or marked as templates
    const templates = await prisma.evaluationScenario.findMany({
      where: {
        OR: [
          {
            organization: {
              slug: "sample-org",
            },
          },
          {
            // Also include any default scenarios from other orgs
            isDefault: true,
            status: "active",
          },
        ],
      },
      include: {
        organization: {
          select: {
            name: true,
          },
        },
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
            readingPassages: true,
            rolePlayScenarios: true,
          },
        },
      },
      orderBy: [
        { industry: "asc" },
        { name: "asc" },
      ],
    });

    // Group templates by industry
    const grouped = templates.reduce((acc, template) => {
      const industry = template.industry || "General";
      if (!acc[industry]) {
        acc[industry] = [];
      }
      acc[industry].push(template);
      return acc;
    }, {} as Record<string, typeof templates>);

    return NextResponse.json({
      templates,
      grouped,
      count: templates.length,
    });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

