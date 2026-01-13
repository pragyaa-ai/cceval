import { RealtimeAgent, tool } from '@openai/agents/realtime';

/**
 * AceEval Agent - Evaluation Agent Template
 * 
 * This is a separate agent for AceEval evaluations.
 * Customize the reading passages, call scenarios, and evaluation flow
 * based on AceEval-specific requirements.
 */

// Reading passage options for AceEval (customize as needed)
const READING_PASSAGES = {
  professional_communication: `Effective professional communication is essential in today's business environment. Clear and concise messaging helps teams collaborate efficiently and ensures that important information reaches the right stakeholders. When communicating with clients or colleagues, it is important to maintain a professional tone while being approachable and solution-oriented.`,
  
  customer_service_excellence: `Customer service excellence requires a combination of empathy, product knowledge, and problem-solving skills. Understanding customer needs and addressing concerns promptly builds trust and loyalty. Representatives should actively listen, acknowledge concerns, and provide clear solutions while maintaining a positive attitude throughout the interaction.`,
  
  technical_support: `Technical support professionals play a crucial role in helping customers resolve complex issues. Effective troubleshooting involves asking the right questions, understanding the problem thoroughly, and guiding customers through solutions step by step. Clear explanations and patience are key to successful technical support interactions.`
};

// Call scenarios for AceEval (customize as needed)
const CALL_SCENARIOS = {
  beginner: {
    level: "Beginner",
    context: "General Inquiry",
    setup: `You are a customer with a simple inquiry. You want basic information and are easy to work with.`,
    opening: `Hi, I have a quick question about your services. Can you help me?`,
    responses: [
      { trigger: "help|assist|support", response: "Yes, I'd appreciate that." },
      { trigger: "information|details|more", response: "That sounds helpful, please continue." }
    ]
  },
  moderate: {
    level: "Moderate", 
    context: "Product Comparison",
    setup: `You are a customer comparing options and need convincing. You have some objections.`,
    opening: `I'm looking at different options and not sure which is best for my needs. What makes your solution different?`,
    responses: [
      { trigger: "benefit|advantage|feature", response: "Interesting. What about the pricing?" },
      { trigger: "price|cost|value", response: "I see. And what support do you offer?" },
      { trigger: "support|help|service", response: "Okay, that sounds reasonable." }
    ]
  },
  experienced: {
    level: "Experienced",
    context: "Complex Issue Resolution",
    setup: `You are a frustrated customer with a complex issue that hasn't been resolved.`,
    opening: `I've been dealing with this issue for a week now and no one seems to be able to help. This is really frustrating.`,
    responses: [
      { trigger: "understand|sorry|apologize", response: "I've heard apologies before. What are you actually going to do about it?" },
      { trigger: "solution|resolve|fix", response: "How long will that take?" },
      { trigger: "time|when|soon", response: "Fine, but I need this resolved properly this time." }
    ]
  }
};

// Empathy scenario for AceEval
const EMPATHY_SCENARIO = {
  setup: `You are an upset customer who has been transferred multiple times without resolution.`,
  opening: `This is the fourth person I've talked to today! Every time I explain my issue, I get transferred again. I'm done with this!`
};

// Closure statement template
const CLOSURE_TEMPLATE = `Based on our discussion, I've addressed your concerns about [issue]. I will [next steps] and follow up with you [timeline]. Is there anything else I can help you with today? Thank you for your time.`;

export const aceevalAgent = new RealtimeAgent({
  name: 'AceEval Agent',
  voice: 'coral',
  handoffDescription:
    'AceEval - AI interviewer for professional evaluation assessments. Conducts comprehensive assessments including personal questions, reading tasks, call scenarios, and empathy challenges.',

  instructions: `
# ACEEVAL EVALUATION AGENT

## HIGH-LEVEL GOAL
You are an advanced AI interviewer and evaluator for professional evaluation assessments. You conduct a comprehensive voice-based evaluation covering personal questions, reading tasks, call simulations, empathy challenges, and closure quality assessment.

## IDENTITY & PERSONA
You are "Eva," VoiceAgent - a sophisticated AI designed for:
1. **Professional Interviewer:** Guide candidates through structured evaluation phases
2. **Customer Role-Player:** Embody different customer personas for realistic simulations
3. **Impartial Assessor:** Analyze performance against strict scoring parameters

## VOICE & ACCENT
Speak with a professional, clear English accent:
- Maintain warm but professional intonation
- Clear articulation suitable for professional assessments
- Adapt to the candidate's communication style

---

## EVALUATION FLOW - SIX PHASES

### PHASE 1: WELCOME & CANDIDATE INFORMATION
**Duration:** 1-2 minutes

1. Greet warmly: "Hello! I am Eva, your AI evaluation agent. Welcome to your assessment session."
2. Collect candidate name: "Before we begin, may I know your name please?"
3. Capture name using capture_evaluation_data tool
4. Explain evaluation structure:
   - "Thank you, [Name]. Today's evaluation has five parts:"
   - "First, I'll ask some personal questions about your background and motivation"
   - "Second, you'll read a passage that will appear on your screen aloud for voice analysis"
   - "Third, we'll do a customer call role-play scenario"
   - "Fourth, I'll present a challenging empathy situation"
   - "Finally, you'll demonstrate a professional call closure"
   - "The entire evaluation takes about 10-15 minutes. Are you ready to begin?"

### PHASE 2: PERSONAL QUESTIONS
**Duration:** 3-4 minutes

Ask these questions in sequence, allowing time for thoughtful responses:

1. **Introduction (30-45 seconds max):**
   "Please introduce yourself in a few sentences."
   - Purpose: Baseline clarity assessment
   - Capture: clarity_pace score

2. **Motivation:**
   "Why are you interested in this role?"
   - Purpose: Intent & motivation
   - Capture: confidence score

3. **Challenge Handling:**
   "Describe a situation where you handled a challenging customer or difficult situation."
   - Purpose: Stress-handling ability
   - Capture: handling_pressure score

4. **Domain Knowledge:**
   "What relevant experience or knowledge do you bring to this role?"
   - Purpose: Product/domain awareness
   - Capture: product_knowledge score

5. **Role Suitability:**
   "How do you handle working under pressure or meeting targets?"
   - Purpose: Role fit assessment
   - Capture: confidence score update

After each response, acknowledge briefly and move to the next question.

### PHASE 3: READING TASK
**Duration:** 2-3 minutes

**CRITICAL: Call advance_phase("personal_questions") FIRST** to signal you are starting the reading phase.

**⚠️ CRITICAL RULE: DO NOT READ OR SPEAK THE PARAGRAPH TEXT. The paragraph is displayed on the candidate's screen.**

1. Introduce the task:
   "Excellent! Now let's move to the reading assessment. This helps us evaluate your clarity, pace, and tone."

2. **CRITICAL: Call start_voice_analysis tool** to begin collecting voice metrics

3. Direct the candidate to the on-screen passage (DO NOT read or speak the paragraph text yourself):
   "Please look at the right side of your screen where the reading passage is displayed. When you're ready, please read that paragraph aloud clearly and naturally."

4. **REMAIN COMPLETELY SILENT** while candidate reads - do not interrupt or speak

5. After candidate finishes (wait for 2-3 seconds of silence):
   - **MANDATORY: Call stop_voice_analysis tool** to end metrics collection
   - **MANDATORY: Immediately call get_voice_analysis_report tool** to retrieve and save the analysis results
   - **YOU MUST call get_voice_analysis_report - the report will not be saved otherwise!**
   
6. Say: "Thank you. That gives me a good baseline of your voice qualities."

7. Use the voice analysis report to inform your assessment. Share brief feedback:
    - If overall score >= 80: "Your voice clarity and pace are excellent."
    - If overall score >= 60: "Good voice projection. Some minor areas for improvement."
    - If overall score < 60: "We noted some areas for voice clarity improvement."

8. Capture scores using the report data:
    - clarity_pace (based on report clarity and pace scores)
    - confidence

### PHASE 4: CALL SCENARIO SIMULATION
**Duration:** 3-4 minutes

**CRITICAL PHASE TRANSITION:**
1. **MANDATORY: Call advance_phase("call_scenario")** to update the phase to call scenario
2. **Wait for tool confirmation before proceeding**
3. Then introduce the scenario

Select scenario based on context.selectedScenario or use progressive difficulty.

Announce: "Now let's move forward to the next phase: the call scenario simulation. We'll now enter a customer interaction."

Transform into customer persona based on the assigned scenario level and respond naturally.

Capture throughout:
- product_knowledge
- customer_understanding
- empathy
- process_accuracy

### PHASE 5: EMPATHY & DE-ESCALATION CHALLENGE
**Duration:** 2-3 minutes

**CRITICAL PHASE TRANSITION:**
1. **FIRST, call advance_phase("call_scenario")** to signal you are starting the empathy phase
2. **Wait for tool confirmation**
3. Then introduce the empathy challenge

Announce: "Great work on that scenario. Now let's test your empathy and de-escalation skills with a challenging situation."

Transform into upset customer and evaluate:
- Empathy expression
- Active listening (paraphrasing concerns)
- Solution orientation
- Professional composure under pressure

Capture:
- empathy
- handling_pressure
- customer_understanding

### PHASE 6: CLOSURE TASK & CONCLUSION
**Duration:** 1-2 minutes

**CRITICAL: Call advance_phase("empathy_scenario") FIRST** to signal you are starting the closure phase.

1. Exit role-play: "Okay, that concludes our scenario exercises."

2. Closure task: "For the final part, please deliver a professional closure statement as if ending a successful customer call. Summarize what was discussed, confirm next steps, and close professionally."

3. Capture: closure_quality, process_accuracy

4. Conclude evaluation:
   "Thank you, [Name]. That completes your evaluation. A human reviewer will assess your results and contact you regarding next steps. Have a great day!"

---

## SCORING PARAMETERS

Score each parameter on 1-5 scale:
- **1:** Needs Significant Improvement
- **2:** Below Expectations  
- **3:** Meets Expectations
- **4:** Exceeds Expectations
- **5:** Outstanding

### Parameters to Score:

1. **clarity_pace:** Smooth flow, no hesitation, clear articulation
2. **product_knowledge:** Domain awareness, accurate information
3. **empathy:** Quality of reassurance lines, emotional intelligence
4. **customer_understanding:** Ability to probe needs, active listening
5. **handling_pressure:** Composure in tough scenarios, no fumbling
6. **confidence:** Tone stability, self-assurance
7. **process_accuracy:** Issue resolution, summarizing, clear CTA
8. **closure_quality:** Professional, crisp, complete ending

### CALIBRATION GUIDANCE (from evaluator feedback)

When scoring, check context.calibrationGuidance for specific parameter adjustments based on human evaluator feedback.

---

## TOOL USAGE

### Data Capture
Use capture_evaluation_data tool throughout:
- After collecting candidate name: capture_evaluation_data("candidate_name", "[name]", "N/A")
- After each phase section: capture relevant scores WITH REASONS
- At conclusion: capture overall_score and summary

⚠️ **CRITICAL: Every score MUST include a reason (5-15 words) explaining WHY that score was given.**

### Phase Management
Use advance_phase tool when completing each phase.

### Voice Analysis (CRITICAL for Reading Task)
1. Call start_voice_analysis() BEFORE asking candidate to read
2. Wait silently while candidate reads
3. Call stop_voice_analysis() AFTER candidate finishes reading
4. Call get_voice_analysis_report() to get metrics and recommendations

---

## IMPORTANT RULES

1. **STAY IN CHARACTER** when role-playing customer scenarios
2. **DO NOT** reveal scores or feedback to candidate during evaluation
3. **CAPTURE DATA** in real-time using tools - don't wait until end
4. **MAINTAIN FLOW** - keep evaluation moving smoothly between phases
5. **BE ENCOURAGING** but professional - help candidates perform their best
6. **ADAPT DIFFICULTY** based on scenario selection from context
`,

  tools: [
    tool({
      name: "capture_evaluation_data",
      description: "Capture evaluation metrics and candidate information during assessment.",
      parameters: {
        type: "object",
        properties: {
          data_type: {
            type: "string",
            enum: [
              "candidate_name",
              "clarity_pace",
              "product_knowledge", 
              "empathy",
              "customer_understanding",
              "handling_pressure",
              "confidence",
              "process_accuracy",
              "closure_quality",
              "overall_score",
              "key_strengths",
              "improvement_areas",
              "phase_completed"
            ],
            description: "The type of data being captured"
          },
          value: {
            type: "string",
            description: "The score (1-5) or text value being recorded"
          },
          reason: {
            type: "string",
            description: "REQUIRED for scores: A brief 5-15 word justification explaining why this score was given."
          }
        },
        required: ["data_type", "value", "reason"],
        additionalProperties: false,
      },
      execute: async (input, details) => {
        const typedInput = input as { data_type: string; value: string; reason?: string };
        const context = details?.context as any;
        
        const calibration = context?.calibrationGuidance?.[typedInput.data_type];
        if (calibration && calibration.guidance) {
          console.log(`[AceEval] 📊 Calibration active for ${typedInput.data_type}`);
        }
        
        if (context?.captureDataPoint) {
          context.captureDataPoint(typedInput.data_type, typedInput.value, 'captured', typedInput.reason);
          console.log(`[AceEval] ${typedInput.data_type}: ${typedInput.value} | Reason: ${typedInput.reason || 'No reason provided'}`);
          return { 
            success: true, 
            message: `Captured ${typedInput.data_type}: ${typedInput.value}`,
            data_type: typedInput.data_type,
            value: typedInput.value,
            reason: typedInput.reason,
            calibrationApplied: !!calibration
          };
        }
        
        console.log(`[AceEval - No Context] ${typedInput.data_type}: ${typedInput.value}`);
        return { 
          success: true, 
          message: `Logged ${typedInput.data_type}: ${typedInput.value} (context not available)` 
        };
      },
    }),
    
    tool({
      name: "get_reading_passage",
      description: "Retrieve passage metadata for internal reference only. DO NOT read or speak the passage text aloud.",
      parameters: {
        type: "object",
        properties: {
          passage_type: {
            type: "string",
            enum: ["professional_communication", "customer_service_excellence", "technical_support"],
            description: "The type of reading passage to retrieve"
          }
        },
        required: ["passage_type"],
        additionalProperties: false,
      },
      execute: async (input) => {
        const typedInput = input as { passage_type: keyof typeof READING_PASSAGES };
        const passage = READING_PASSAGES[typedInput.passage_type];
        return {
          success: true,
          passage_type: typedInput.passage_type,
          text: passage,
          note: "This passage is displayed on the candidate's screen. DO NOT read it aloud."
        };
      },
    }),

    tool({
      name: "get_call_scenario",
      description: "Retrieve details for a specific call scenario simulation",
      parameters: {
        type: "object",
        properties: {
          scenario_level: {
            type: "string",
            enum: ["beginner", "moderate", "experienced"],
            description: "The difficulty level of the scenario"
          }
        },
        required: ["scenario_level"],
        additionalProperties: false,
      },
      execute: async (input) => {
        const typedInput = input as { scenario_level: keyof typeof CALL_SCENARIOS };
        const scenario = CALL_SCENARIOS[typedInput.scenario_level];
        return {
          success: true,
          level: scenario.level,
          context: scenario.context,
          opening_line: scenario.opening,
          setup: scenario.setup
        };
      },
    }),

    tool({
      name: "advance_phase",
      description: "Signal that the current evaluation phase is complete and advance to the next",
      parameters: {
        type: "object",
        properties: {
          completed_phase: {
            type: "string",
            enum: ["personal_questions", "reading_task", "call_scenario", "empathy_scenario", "closure_task"],
            description: "The phase that was just completed"
          },
          phase_notes: {
            type: "string",
            description: "Summary notes for the completed phase"
          }
        },
        required: ["completed_phase"],
        additionalProperties: false,
      },
      execute: async (input, details) => {
        const typedInput = input as { completed_phase: string; phase_notes?: string };
        const context = details?.context as any;
        
        const phaseOrder = ["personal_questions", "reading_task", "call_scenario", "empathy_scenario", "typing_test", "closure_task", "completed"];
        const currentIndex = phaseOrder.indexOf(typedInput.completed_phase);
        const nextPhase = currentIndex < phaseOrder.length - 1 ? phaseOrder[currentIndex + 1] : "completed";
        
        if (context?.captureDataPoint) {
          context.captureDataPoint("phase_completed", typedInput.completed_phase, 'captured');
        }
        
        if (context?.setCurrentPhase) {
          context.setCurrentPhase(nextPhase);
        }
        
        console.log(`[AceEval Phase Transition] ${typedInput.completed_phase} → ${nextPhase}`);
        
        return {
          success: true,
          completed_phase: typedInput.completed_phase,
          next_phase: nextPhase,
          notes: typedInput.phase_notes
        };
      },
    }),

    tool({
      name: "start_voice_analysis",
      description: "Start collecting voice quality metrics. Call this BEFORE asking the candidate to read the paragraph aloud.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false,
      },
      execute: async (_input, details) => {
        const context = details?.context as any;
        
        console.log('[AceEval Voice Analysis] 🎬 start_voice_analysis TOOL CALLED');
        
        if (context?.setCurrentPhase) {
          try {
            await context.setCurrentPhase('reading_task');
            console.log('[AceEval Voice Analysis] ✅ Phase set to reading_task');
          } catch (error) {
            console.error('[AceEval Voice Analysis] ❌ Failed to set phase:', error);
          }
        }
        
        if (context?.startVoiceAnalysis) {
          context.startVoiceAnalysis();
          console.log('[AceEval Voice Analysis] ✅ Voice analysis started');
          return { success: true, message: 'Voice analysis started' };
        }
        
        console.error('[AceEval Voice Analysis] ❌ startVoiceAnalysis not available in context');
        return { success: false, message: 'Voice analysis context not available' };
      },
    }),

    tool({
      name: "stop_voice_analysis",
      description: "Stop collecting voice quality metrics. Call this AFTER the candidate finishes reading.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false,
      },
      execute: async (_input, details) => {
        const context = details?.context as any;
        
        if (context?.stopVoiceAnalysis) {
          context.stopVoiceAnalysis();
          console.log('[AceEval Voice Analysis] Stopped collecting voice metrics');
          return { success: true, message: 'Voice analysis stopped' };
        }
        
        return { success: false, message: 'Voice analysis context not available' };
      },
    }),

    tool({
      name: "get_voice_analysis_report",
      description: "Get the voice quality analysis report after the candidate has finished reading.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false,
      },
      execute: async (_input, details) => {
        const context = details?.context as any;
        
        if (context?.getVoiceAnalysisReport) {
          const report = context.getVoiceAnalysisReport();
          
          if (!report) {
            return {
              success: false,
              message: 'Insufficient voice samples collected.',
              report: null
            };
          }
          
          if (context?.saveVoiceAnalysis) {
            try {
              await context.saveVoiceAnalysis(report);
              console.log('[AceEval Voice Analysis] ✅ Report saved');
            } catch (error) {
              console.error('[AceEval Voice Analysis] ❌ Failed to save report:', error);
            }
          }
          
          return { 
            success: true, 
            report,
            message: `Voice analysis report generated - Overall score: ${report.overallScore}%`
          };
        }
        
        return { 
          success: false, 
          message: 'Voice analysis report function not available',
          report: null
        };
      },
    }),
  ],

  handoffs: [],
});

export default aceevalAgent;
