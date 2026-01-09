import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import OpenAI from "openai";
import { readFile } from "fs/promises";
import path from "path";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Scoring parameters by use case - must match V2EvaluationContext.tsx
const SCORE_PARAMETERS_BY_USE_CASE: Record<string, Array<{ id: string; label: string; description: string }>> = {
  exits: [
    { id: "enthusiasm", label: "Enthusiasm", description: "Energy and genuine interest in the conversation" },
    { id: "listening", label: "Listening", description: "Active listening and understanding responses" },
    { id: "language", label: "Language", description: "Professional and empathetic language use" },
    { id: "probing", label: "Probing", description: "Effective questioning to uncover insights" },
    { id: "convincing", label: "Convincing", description: "Ability to retain or gather honest feedback" },
    { id: "start_conversation", label: "Start of Conversation", description: "Professional and warm opening" },
    { id: "end_conversation", label: "End of Conversation", description: "Proper closure and next steps" }
  ],
  nhe: [
    { id: "enthusiasm", label: "Enthusiasm", description: "Welcoming energy and genuine interest" },
    { id: "tone_language", label: "Tone & Language", description: "Supportive and encouraging communication" },
    { id: "listening", label: "Listening", description: "Active listening to new hire concerns" },
    { id: "start_conversation", label: "Start of Conversation", description: "Warm and reassuring opening" },
    { id: "end_conversation", label: "End of Conversation", description: "Clear next steps and support offered" },
    { id: "probing_dissatisfaction", label: "Probing to Identify Dissatisfaction", description: "Skill in uncovering hidden concerns" },
    { id: "convincing", label: "Convincing Skills", description: "Ability to reassure and build confidence" }
  ],
  ce: [
    { id: "opening", label: "Opening", description: "Professional and engaging call opening" },
    { id: "selling_benefits", label: "Selling Client Benefits", description: "Articulating value of engagement" },
    { id: "objection_handling", label: "Objection Handling", description: "Addressing concerns effectively" },
    { id: "probing", label: "Asking Questions/Probing", description: "Effective discovery questions" },
    { id: "taking_feedback", label: "Taking Feedback", description: "Receptive to employee input" },
    { id: "solving_queries", label: "Solving Queries", description: "Providing helpful responses" },
    { id: "conversational_skills", label: "Conversational Skills", description: "Natural flow and rapport building" },
    { id: "taking_ownership", label: "Taking Ownership on the Call", description: "Accountability and follow-through" },
    { id: "enthusiasm", label: "Enthusiasm", description: "Energy and genuine engagement" },
    { id: "reference_previous", label: "Reference of Previous Call", description: "Continuity and personalization" },
    { id: "closing", label: "Closing", description: "Professional and complete call closure" }
  ]
};

// Default to exits use case
const SCORE_PARAMETERS = SCORE_PARAMETERS_BY_USE_CASE.exits;

// Helper to get parameters based on use case
const getScoreParameters = (useCase?: string) => {
  if (useCase && SCORE_PARAMETERS_BY_USE_CASE[useCase]) {
    return SCORE_PARAMETERS_BY_USE_CASE[useCase];
  }
  return SCORE_PARAMETERS;
};

// POST /api/v2/evaluations/[evaluationId]/reprocess - Reprocess evaluation from recording
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ evaluationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { evaluationId } = await params;

    // Get evaluation with recording
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      include: {
        candidate: true,
        scores: true,
        transcriptItems: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!evaluation) {
      return NextResponse.json({ error: "Evaluation not found" }, { status: 404 });
    }

    // Check if we have a recording or transcript to reprocess
    const hasRecording = evaluation.recordingUrl && evaluation.recordingUrl.length > 0;
    const hasTranscript = evaluation.transcriptItems.length > 0;

    if (!hasRecording && !hasTranscript) {
      return NextResponse.json({ 
        error: "No recording or transcript available for reprocessing",
        details: "This evaluation has no audio recording or transcript to analyze."
      }, { status: 400 });
    }

    let transcriptText = "";

    // Option 1: Use existing transcript if available
    if (hasTranscript) {
      transcriptText = evaluation.transcriptItems
        .map(item => `${item.role.toUpperCase()}: ${item.content}`)
        .join("\n\n");
      console.log(`[Reprocess] Using existing transcript (${evaluation.transcriptItems.length} items)`);
    }
    // Option 2: Transcribe from recording if no transcript
    else if (hasRecording) {
      console.log(`[Reprocess] Transcribing from recording: ${evaluation.recordingUrl}`);
      
      try {
        // Extract filename from URL (/api/v2/recordings/filename.webm)
        const filename = evaluation.recordingUrl!.split("/").pop();
        if (!filename) {
          throw new Error("Invalid recording URL");
        }

        // Read the recording file
        const recordingsDir = path.join(process.cwd(), "data", "recordings");
        const filePath = path.join(recordingsDir, filename);
        const audioBuffer = await readFile(filePath);

        // Convert to File object for OpenAI
        const audioFile = new File([audioBuffer], filename, { type: "audio/webm" });

        // Transcribe using Whisper
        const transcription = await openai.audio.transcriptions.create({
          file: audioFile,
          model: "whisper-1",
          language: "en",
          response_format: "text",
        });

        transcriptText = transcription;
        console.log(`[Reprocess] Transcription complete (${transcriptText.length} chars)`);

        // Save transcript items from transcription
        // For now, save as a single item (could be improved with speaker diarization)
        await prisma.transcriptItem.create({
          data: {
            evaluationId,
            role: "transcript",
            content: transcriptText,
            phase: "reprocessed",
          },
        });
      } catch (transcribeError) {
        console.error("[Reprocess] Transcription failed:", transcribeError);
        return NextResponse.json({ 
          error: "Failed to transcribe recording",
          details: String(transcribeError)
        }, { status: 500 });
      }
    }

    if (!transcriptText || transcriptText.trim().length < 50) {
      return NextResponse.json({ 
        error: "Insufficient content for scoring",
        details: "The transcript is too short to generate meaningful scores."
      }, { status: 400 });
    }

    // Use GPT-4 to analyze transcript and generate scores
    console.log(`[Reprocess] Analyzing transcript for scoring...`);

    // Get use case from candidate if available (stored in settings/metadata)
    const candidateUseCase = (evaluation.candidate as any).useCase || 'exits';
    const scoreParams = getScoreParameters(candidateUseCase);
    
    const useCaseLabels: Record<string, string> = {
      exits: "Exit Interviews",
      nhe: "New Hire Engagement (NHE)",
      ce: "Continuous Engagement (CE)"
    };
    
    const scoringPrompt = `You are an expert evaluator for Acengage HR services candidate assessments.

Analyze the following transcript from a candidate evaluation session for the ${useCaseLabels[candidateUseCase] || "Exit Interviews"} role.

CANDIDATE: ${evaluation.candidate.name}

TRANSCRIPT:
${transcriptText}

Score each parameter on a 1-5 scale:
- 1: Needs Significant Improvement
- 2: Below Expectations
- 3: Meets Expectations
- 4: Exceeds Expectations
- 5: Outstanding

For each parameter, provide:
1. A score (1-5)
2. A brief reason (5-15 words)

Parameters to score:
${scoreParams.map(p => `- ${p.id}: ${p.description}`).join("\n")}

Respond in this exact JSON format:
{
  "scores": [
    {"parameterId": "enthusiasm", "score": 4, "reason": "Good energy and genuine interest throughout the conversation"},
    {"parameterId": "listening", "score": 3, "reason": "Adequate listening but missed some key concerns"},
    ...
  ],
  "overallAssessment": "Brief 2-3 sentence assessment of the candidate"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert call center evaluation analyst. Always respond with valid JSON." },
        { role: "user", content: scoringPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error("No response from scoring model");
    }

    const scoringResult = JSON.parse(responseContent) as {
      scores: Array<{ parameterId: string; score: number; reason: string }>;
      overallAssessment: string;
    };

    console.log(`[Reprocess] Generated ${scoringResult.scores.length} scores`);

    // Save/update scores in database
    const savedScores = [];
    for (const scoreItem of scoringResult.scores) {
      // Validate score
      if (scoreItem.score < 1 || scoreItem.score > 5) continue;
      if (!scoreParams.find(p => p.id === scoreItem.parameterId)) continue;

      // Upsert score (update if exists, create if not)
      const savedScore = await prisma.score.upsert({
        where: {
          evaluationId_parameterId: {
            evaluationId,
            parameterId: scoreItem.parameterId,
          },
        },
        update: {
          score: scoreItem.score,
          notes: `[Reprocessed] ${scoreItem.reason}`,
        },
        create: {
          evaluationId,
          parameterId: scoreItem.parameterId,
          score: scoreItem.score,
          notes: `[Reprocessed] ${scoreItem.reason}`,
        },
      });
      savedScores.push(savedScore);
    }

    // Update evaluation to mark as reprocessed
    await prisma.evaluation.update({
      where: { id: evaluationId },
      data: {
        currentPhase: "completed",
      },
    });

    console.log(`[Reprocess] ✅ Saved ${savedScores.length} scores for evaluation ${evaluationId}`);

    return NextResponse.json({
      success: true,
      evaluationId,
      scoresGenerated: savedScores.length,
      scores: savedScores.map(s => ({
        parameterId: s.parameterId,
        score: s.score,
        notes: s.notes,
      })),
      overallAssessment: scoringResult.overallAssessment,
      source: hasTranscript ? "transcript" : "recording",
    });
  } catch (error) {
    console.error("[Reprocess] Error:", error);
    return NextResponse.json({ 
      error: "Failed to reprocess evaluation",
      details: String(error)
    }, { status: 500 });
  }
}

// GET /api/v2/evaluations/[evaluationId]/reprocess - Check if reprocessing is possible
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ evaluationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { evaluationId } = await params;

    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      include: {
        scores: true,
        transcriptItems: true,
      },
    });

    if (!evaluation) {
      return NextResponse.json({ error: "Evaluation not found" }, { status: 404 });
    }

    const hasRecording = evaluation.recordingUrl && evaluation.recordingUrl.length > 0;
    const hasTranscript = evaluation.transcriptItems.length > 0;
    const hasScores = evaluation.scores.length > 0;
    // Use default parameters for checking - could be improved to use candidate's use case
    const missingScores = SCORE_PARAMETERS.filter(
      p => !evaluation.scores.find(s => s.parameterId === p.id)
    );

    return NextResponse.json({
      evaluationId,
      canReprocess: hasRecording || hasTranscript,
      hasRecording,
      hasTranscript,
      hasScores,
      existingScoreCount: evaluation.scores.length,
      missingScores: missingScores.map(p => p.id),
      source: hasTranscript ? "transcript" : hasRecording ? "recording" : "none",
    });
  } catch (error) {
    console.error("[Reprocess Check] Error:", error);
    return NextResponse.json({ error: "Failed to check reprocess status" }, { status: 500 });
  }
}
