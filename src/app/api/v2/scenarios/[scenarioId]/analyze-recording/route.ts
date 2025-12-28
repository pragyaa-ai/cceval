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

// POST /api/v2/scenarios/[scenarioId]/analyze-recording
// Analyze a sample recording and suggest evaluation criteria
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { scenarioId } = await params;
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify scenario exists
    const scenario = await prisma.evaluationScenario.findUnique({
      where: { id: scenarioId },
      select: {
        id: true,
        name: true,
        description: true,
        industry: true,
        roleType: true,
        organizationId: true,
      },
    });

    if (!scenario) {
      return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
    }

    // Get the user's organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true },
    });

    // Allow access if:
    // 1. Scenario belongs to user's organization
    // 2. Scenario is from sample-org (templates are public)
    // 3. User doesn't have an org yet (for initial setup)
    const scenarioOrg = await prisma.organization.findUnique({
      where: { id: scenario.organizationId || '' },
      select: { slug: true },
    });

    const isOwnOrg = scenario.organizationId === user?.organizationId;
    const isSampleOrg = scenarioOrg?.slug === 'sample-org';
    
    if (!isOwnOrg && !isSampleOrg) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { transcript, recordingId, additionalContext } = body;

    if (!transcript && !recordingId) {
      return NextResponse.json(
        { error: "Either transcript or recordingId is required" },
        { status: 400 }
      );
    }

    let transcriptText = transcript;

    // If recordingId is provided, get transcript from the recording
    if (recordingId && !transcript) {
      const recording = await prisma.sampleRecording.findUnique({
        where: { id: recordingId },
        select: { transcript: true },
      });

      if (!recording?.transcript) {
        return NextResponse.json(
          { error: "Recording transcript not available" },
          { status: 400 }
        );
      }

      transcriptText = recording.transcript;
    }

    // Use GPT-4 to analyze the transcript and suggest criteria
    const systemPrompt = `You are an expert in call center evaluation and quality assurance. Your task is to analyze a sample call transcript and suggest evaluation criteria that should be used to assess agent performance.

Context about the evaluation scenario:
- Scenario Name: ${scenario.name}
- Description: ${scenario.description}
- Industry: ${scenario.industry || "General"}
- Role Type: ${scenario.roleType || "Customer Service"}
${additionalContext ? `- Additional Context: ${additionalContext}` : ""}

Based on the transcript, identify the key competencies and skills that should be evaluated. For each criteria, provide:
1. A unique parameterId (snake_case, e.g., "product_knowledge")
2. A display label
3. A description of what this criteria measures
4. Scoring guidance for the AI evaluator
5. The category (voice_quality, communication, domain_knowledge, soft_skills, process_compliance)
6. Score examples for levels 1-5

Focus on criteria that are:
- Specific to the industry and role
- Observable from the call transcript
- Actionable for training purposes
- Important for customer satisfaction and business outcomes

Return your response as a JSON object with the following structure:
{
  "suggestedCriteria": [
    {
      "parameterId": "string",
      "label": "string",
      "description": "string",
      "scoringGuidance": "string",
      "category": "string",
      "scoreExamples": [
        { "score": 1, "description": "...", "example": "..." },
        { "score": 3, "description": "...", "example": "..." },
        { "score": 5, "description": "...", "example": "..." }
      ]
    }
  ],
  "analysis": {
    "summary": "Brief summary of the call",
    "strengths": ["list of strengths observed"],
    "improvementAreas": ["list of areas for improvement"],
    "recommendedFocus": "Primary focus area for evaluation"
  }
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Please analyze this call transcript and suggest evaluation criteria:\n\n${transcriptText}` },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      return NextResponse.json(
        { error: "Failed to generate analysis" },
        { status: 500 }
      );
    }

    const analysisResult = JSON.parse(content);

    // If recordingId is provided, update the recording with analysis results
    if (recordingId) {
      await prisma.sampleRecording.update({
        where: { id: recordingId },
        data: {
          analysisResult: JSON.stringify(analysisResult.analysis),
          suggestedCriteria: JSON.stringify(analysisResult.suggestedCriteria),
          analysisStatus: "completed",
        },
      });
    }

    return NextResponse.json({
      suggestedCriteria: analysisResult.suggestedCriteria,
      analysis: analysisResult.analysis,
      scenarioId,
    });
  } catch (error) {
    console.error("Error analyzing recording:", error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { error: "OpenAI API key not configured" },
          { status: 500 }
        );
      }
      if (error.message.includes("rate limit")) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }
      console.error("Error details:", error.message);
    }
    
    return NextResponse.json(
      { error: "Failed to analyze recording. Check server logs for details." },
      { status: 500 }
    );
  }
}




