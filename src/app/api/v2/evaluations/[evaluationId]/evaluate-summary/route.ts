import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST /api/v2/evaluations/[evaluationId]/evaluate-summary
// Evaluates a typed summary against the call transcript using AI
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ evaluationId: string }> }
) {
  try {
    const { evaluationId } = await params;
    const body = await request.json();
    const { summary, wordCount, wpm, timeSpent } = body;

    if (!summary || typeof summary !== "string") {
      return NextResponse.json({ error: "Summary is required" }, { status: 400 });
    }

    // Fetch the evaluation with transcript
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      include: {
        transcriptItems: {
          orderBy: { createdAt: "asc" },
        },
        candidate: {
          select: {
            name: true,
            selectedPassage: true,
            selectedScenario: true,
          },
        },
      },
    });

    if (!evaluation) {
      return NextResponse.json({ error: "Evaluation not found" }, { status: 404 });
    }

    // Build the transcript text from items
    const transcriptText = evaluation.transcriptItems
      .map((item) => `${item.role === "user" ? "Candidate" : "Eva (AI)"}: ${item.content}`)
      .join("\n");

    if (!transcriptText || transcriptText.length < 50) {
      console.log("[Evaluate Summary] Insufficient transcript, using basic scoring");
      // Fall back to basic scoring if no transcript
      return NextResponse.json({
        success: true,
        scores: calculateBasicScores(summary, wordCount, wpm),
        feedback: {
          overall: "Summary evaluation completed with basic metrics (no transcript available).",
          strengths: wordCount >= 50 ? ["Adequate length"] : [],
          improvements: wordCount < 50 ? ["Summary is too short"] : [],
        },
      });
    }

    // Use GPT-4 to evaluate the summary against the transcript
    const evaluationPrompt = `You are evaluating a call center candidate's typed summary against their actual call transcript.

## Call Transcript:
${transcriptText}

## Candidate's Typed Summary:
${summary}

## Evaluation Criteria:
Evaluate the summary on the following parameters (score 1-5 for each):

1. **Content Accuracy (summary_quality)**: Does the summary accurately capture the key points from the call?
   - 5: Excellent - Captures all key points, customer concerns, solutions, and next steps accurately
   - 4: Good - Captures most key points with minor omissions
   - 3: Acceptable - Captures main topic but misses important details
   - 2: Poor - Significant inaccuracies or missing key information
   - 1: Very Poor - Summary doesn't reflect the actual call content

2. **Professional Language (closure_quality)**: Is the summary written professionally as expected for call documentation?
   - 5: Excellent - Professional, clear, well-structured documentation
   - 4: Good - Professional with minor improvements needed
   - 3: Acceptable - Understandable but could be more professional
   - 2: Poor - Unprofessional language or structure
   - 1: Very Poor - Not suitable for professional documentation

3. **Completeness**: Does the summary include all required elements?
   - Customer's concern/inquiry
   - Discussion points/solutions offered
   - Next steps/follow-up actions
   - Overall outcome

Respond in JSON format:
{
  "summary_quality_score": <1-5>,
  "summary_quality_reason": "<brief justification>",
  "closure_quality_score": <1-5>,
  "closure_quality_reason": "<brief justification>",
  "completeness_score": <1-5>,
  "completeness_reason": "<brief justification>",
  "overall_feedback": "<1-2 sentence overall assessment>",
  "strengths": ["<strength1>", "<strength2>"],
  "improvements": ["<area1>", "<area2>"]
}`;

    console.log("[Evaluate Summary] Calling GPT-4 for evaluation...");
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert call center quality evaluator. Evaluate summaries accurately and fairly. Always respond in valid JSON format.",
        },
        {
          role: "user",
          content: evaluationPrompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const responseText = completion.choices[0]?.message?.content || "";
    console.log("[Evaluate Summary] GPT response received");

    // Parse the JSON response
    let aiEvaluation;
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiEvaluation = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("[Evaluate Summary] Failed to parse AI response:", parseError);
      // Fall back to basic scoring
      return NextResponse.json({
        success: true,
        scores: calculateBasicScores(summary, wordCount, wpm),
        feedback: {
          overall: "Summary evaluation completed with basic metrics.",
          strengths: [],
          improvements: [],
        },
      });
    }

    // Calculate typing speed score based on WPM
    let typingSpeedScore = 1;
    if (wpm >= 40) typingSpeedScore = 5;
    else if (wpm >= 30) typingSpeedScore = 4;
    else if (wpm >= 20) typingSpeedScore = 3;
    else if (wpm >= 10) typingSpeedScore = 2;

    // Typing accuracy - estimate based on completeness (no typo detection available)
    const typingAccuracyScore = Math.min(5, Math.max(1, aiEvaluation.completeness_score || 3));

    const scores = {
      typing_speed: {
        score: typingSpeedScore,
        reason: `${wpm} WPM`,
      },
      typing_accuracy: {
        score: typingAccuracyScore,
        reason: `Based on summary completeness: ${aiEvaluation.completeness_reason || "N/A"}`,
      },
      summary_quality: {
        score: aiEvaluation.summary_quality_score || 3,
        reason: aiEvaluation.summary_quality_reason || "AI evaluation",
      },
      closure_quality: {
        score: aiEvaluation.closure_quality_score || 3,
        reason: aiEvaluation.closure_quality_reason || "AI evaluation",
      },
    };

    // Save scores to database
    for (const [parameterId, scoreData] of Object.entries(scores)) {
      try {
        // Upsert: update if exists, create if not
        await prisma.evaluationScore.upsert({
          where: {
            evaluationId_parameterId: {
              evaluationId,
              parameterId,
            },
          },
          update: {
            score: scoreData.score,
            notes: scoreData.reason,
          },
          create: {
            evaluationId,
            parameterId,
            score: scoreData.score,
            notes: scoreData.reason,
          },
        });
        console.log(`[Evaluate Summary] Saved score: ${parameterId} = ${scoreData.score}`);
      } catch (scoreError) {
        console.error(`[Evaluate Summary] Failed to save score ${parameterId}:`, scoreError);
      }
    }

    return NextResponse.json({
      success: true,
      scores,
      feedback: {
        overall: aiEvaluation.overall_feedback || "Evaluation completed.",
        strengths: aiEvaluation.strengths || [],
        improvements: aiEvaluation.improvements || [],
      },
    });
  } catch (error: any) {
    console.error("[Evaluate Summary] Error:", error);
    return NextResponse.json(
      { error: "Failed to evaluate summary", details: error?.message },
      { status: 500 }
    );
  }
}

// Basic scoring when AI evaluation is not available
function calculateBasicScores(summary: string, wordCount: number, wpm: number) {
  // Typing Speed: Based on WPM
  let typingSpeedScore = 1;
  if (wpm >= 40) typingSpeedScore = 5;
  else if (wpm >= 30) typingSpeedScore = 4;
  else if (wpm >= 20) typingSpeedScore = 3;
  else if (wpm >= 10) typingSpeedScore = 2;

  // Summary Quality: Based on word count
  let summaryQualityScore = 1;
  if (wordCount >= 150) summaryQualityScore = 5;
  else if (wordCount >= 100) summaryQualityScore = 4;
  else if (wordCount >= 50) summaryQualityScore = 3;
  else if (wordCount >= 30) summaryQualityScore = 2;

  // Typing Accuracy: Default to 3-4
  const typingAccuracyScore = wordCount >= 50 ? 4 : 3;

  // Closure Quality: Same as summary quality
  const closureQualityScore = summaryQualityScore;

  return {
    typing_speed: { score: typingSpeedScore, reason: `${wpm} WPM` },
    typing_accuracy: { score: typingAccuracyScore, reason: `${summary.length} characters typed` },
    summary_quality: { score: summaryQualityScore, reason: `${wordCount} words in summary` },
    closure_quality: { score: closureQualityScore, reason: `Written closure: ${wordCount} words` },
  };
}
