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

// Scoring parameters
const SCORE_PARAMETERS = [
  { id: "clarity_pace", label: "Clarity & Pace", description: "Smooth flow, no hesitation, clear articulation" },
  { id: "product_knowledge", label: "Product Knowledge", description: "PV & EV awareness, accurate information" },
  { id: "empathy", label: "Empathy", description: "Quality of reassurance lines, emotional intelligence" },
  { id: "customer_understanding", label: "Customer Understanding", description: "Ability to probe needs, active listening" },
  { id: "handling_pressure", label: "Handling Pressure", description: "Composure in tough scenarios, no fumbling" },
  { id: "confidence", label: "Confidence", description: "Tone stability, self-assurance" },
];

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

    const scoringPrompt = `You are an expert evaluator for Mahindra Call Center candidate assessments.

Analyze the following transcript from a candidate evaluation session and provide scores for each parameter.

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
${SCORE_PARAMETERS.map(p => `- ${p.id}: ${p.description}`).join("\n")}

Respond in this exact JSON format:
{
  "scores": [
    {"parameterId": "clarity_pace", "score": 3, "reason": "Clear articulation but occasional hesitation on technical terms"},
    {"parameterId": "product_knowledge", "score": 4, "reason": "Good awareness of Mahindra lineup, mentioned key features"},
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
      if (!SCORE_PARAMETERS.find(p => p.id === scoreItem.parameterId)) continue;

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
