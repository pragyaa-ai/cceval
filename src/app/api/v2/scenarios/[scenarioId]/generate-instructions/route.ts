import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import OpenAI from "openai";

interface RouteParams {
  params: Promise<{ scenarioId: string }>;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST /api/v2/scenarios/[scenarioId]/generate-instructions
// Generate AI agent instructions based on scenario configuration
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { scenarioId } = await params;
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get full scenario with all related data
    const scenario = await prisma.evaluationScenario.findUnique({
      where: { id: scenarioId },
      include: {
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
        organization: {
          select: { name: true },
        },
      },
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

    // Build the prompt for generating instructions
    const criteriaList = scenario.criteria.map((c, i) => 
      `${i + 1}. **${c.label}** (${c.parameterId}): ${c.description}\n   - Scoring Guidance: ${c.scoringGuidance || "Score 1-5 based on performance"}`
    ).join("\n");

    const passagesList = scenario.readingPassages.map((p, i) =>
      `${i + 1}. **${p.title}** (${p.wordCount} words): ${p.text.substring(0, 100)}...`
    ).join("\n");

    const rolePlayList = scenario.rolePlayScenarios.map((r, i) =>
      `${i + 1}. **${r.title}** (${r.difficulty}): ${r.description}\n   - Customer: ${r.customerName} (${r.customerMood})\n   - Opening: "${r.openingLine}"`
    ).join("\n");

    const systemPrompt = `You are an expert in designing AI evaluation agents for call centers. Your task is to generate comprehensive instructions for an AI agent that will evaluate candidates.

The instructions should:
1. Define the agent's identity and persona
2. Outline the complete evaluation flow
3. Provide detailed guidance for each evaluation phase
4. Include specific criteria for scoring
5. Define how to handle different scenarios
6. Be written in a clear, actionable format

The agent should be professional, encouraging, and thorough in its evaluation.`;

    const userPrompt = `Generate comprehensive AI agent instructions for the following evaluation scenario:

**Organization**: ${scenario.organization?.name || "Organization"}
**Scenario Name**: ${scenario.name}
**Description**: ${scenario.description}
**Industry**: ${scenario.industry || "General"}
**Role Type**: ${scenario.roleType || "Customer Service"}
**Agent Name**: ${scenario.agentName}
**Agent Persona**: ${scenario.agentPersona || "Professional and encouraging AI interviewer"}

**Evaluation Criteria**:
${criteriaList || "No specific criteria defined. Use standard call center evaluation metrics."}

**Reading Passages for Voice Assessment**:
${passagesList || "Use a standard industry-relevant paragraph for voice assessment."}

**Role-Play Scenarios**:
${rolePlayList || "Include basic customer inquiry, comparison scenario, and escalation handling."}

Generate detailed instructions that cover:
1. IDENTITY & PERSONA section
2. EVALUATION FLOW with all phases
3. SCORING PARAMETERS with guidance for each criteria
4. TOOL USAGE instructions
5. IMPORTANT RULES section

Format the output as a comprehensive instruction document that can be directly used as the AI agent's system prompt.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const instructions = response.choices[0]?.message?.content;
    
    if (!instructions) {
      return NextResponse.json(
        { error: "Failed to generate instructions" },
        { status: 500 }
      );
    }

    // Optionally save the generated instructions
    const body = await request.json().catch(() => ({}));
    if (body.save) {
      await prisma.evaluationScenario.update({
        where: { id: scenarioId },
        data: { agentInstructions: instructions },
      });
    }

    return NextResponse.json({
      instructions,
      scenarioId,
      saved: body.save || false,
    });
  } catch (error) {
    console.error("Error generating instructions:", error);
    return NextResponse.json(
      { error: "Failed to generate instructions" },
      { status: 500 }
    );
  }
}




