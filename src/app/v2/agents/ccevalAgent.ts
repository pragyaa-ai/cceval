import { RealtimeAgent, tool } from '@openai/agents/realtime';

// Reading passage options for CCEval
const READING_PASSAGES = {
  safety_adas: `Safety has become a top priority in the Indian automobile market. Features like six airbags, advanced driver assistance systems, electronic stability control, and hill hold assist help drivers manage difficult road and traffic conditions. As customers compare multiple brands, explaining these safety features in simple, relatable terms plays an important role in building trust and supporting informed decision-making.`,
  
  ev_fast_charging: `Electric vehicle customers in India look for fast-charging capability, practical daily range, and battery longevity. With growing public charging infrastructure, modern EVs offer quick charge options that significantly reduce waiting time. Communicating these benefits clearly helps customers understand the convenience of adopting an electric vehicle for long commutes and everyday usage.`,
  
  connected_car: `Connected car technology is becoming essential in India, with drivers expecting features like remote lock–unlock, live vehicle tracking, geo-fencing, emergency alerts, and over-the-air updates. These features not only enhance safety but also improve convenience. When speaking to customers, it is important to describe how these technologies add value to their daily driving experience.`
};

// Call scenarios for CCEval
const CALL_SCENARIOS = {
  beginner: {
    level: "Beginner",
    vehicle: "Mahindra Bolero Neo (PV)",
    setup: `You are a customer interested in the Mahindra Bolero Neo. You saw it online and want to know the basic price.`,
    opening: `Hi, I saw the Mahindra Bolero Neo online. Can you tell me the basic price?`,
    responses: [
      { trigger: "features|important|matter", response: "Mileage and space mainly." },
      { trigger: "whatsapp|call-back|follow", response: "Please arrange a call-back." }
    ]
  },
  moderate: {
    level: "Moderate", 
    vehicle: "Mahindra XUV700 (PV)",
    setup: `You are a customer comparing the XUV700 with Hyundai Alcazar. You need convincing.`,
    opening: `I'm comparing the XUV700 with Hyundai Alcazar. Why should I choose Mahindra?`,
    responses: [
      { trigger: "priority|important|looking", response: "Safety and features." },
      { trigger: "alcazar|mileage|fuel", response: "What about the Alcazar mileage?" },
      { trigger: "test drive|experience|try", response: "Yes, schedule it." }
    ]
  },
  experienced: {
    level: "Experienced",
    vehicle: "Mahindra XUV400 EV",
    setup: `You are a frustrated customer with concerns about EV charging and battery life.`,
    opening: `Your EV looks good, but I'm worried about charging time and battery life. I don't want to get stuck.`,
    responses: [
      { trigger: "understand|help|information", response: "Okay, tell me." },
      { trigger: "range|traffic|commute", response: "I've also heard the range drops in traffic." },
      { trigger: "test drive|experience|schedule", response: "Schedule it." }
    ]
  }
};

// Empathy scenario for CCEval
const EMPATHY_SCENARIO = {
  setup: `You are an angry customer whose service bill is unexpectedly high with no explanation.`,
  opening: `My service bill is too high! No one explained anything and I've been waiting forever.`
};

// Closure statement template
const CLOSURE_TEMPLATE = `Based on our discussion, you're interested in the right model with strong safety and technology features. I have arranged a follow-up call/test drive and will share all details on message. If there's anything else you need, please let me know. Thank you for your time today.`;

export const ccevalAgent = new RealtimeAgent({
  name: 'CCEval v2.1.0 Agent',
  voice: 'coral',
  handoffDescription:
    'CCEval v2.1.0 - AI interviewer for Call Center candidate evaluations. Conducts comprehensive assessments including personal questions, reading tasks, call scenarios, and empathy challenges.',

  instructions: `
# CCEVAL v2.1.0 EVALUATION AGENT

## HIGH-LEVEL GOAL
You are an advanced AI interviewer and evaluator for Call Center Operations candidates. You conduct a comprehensive voice-based evaluation covering personal questions, reading tasks, call simulations, empathy challenges, and closure quality assessment.

## IDENTITY & PERSONA
You are "Eva," VoiceAgent 2.1.0 - a sophisticated AI designed for:
1. **Professional Interviewer:** Guide candidates through structured evaluation phases
2. **Customer Role-Player:** Embody different customer personas for realistic simulations
3. **Impartial Assessor:** Analyze performance against strict scoring parameters

## VOICE & ACCENT
Speak with a professional North Indian English accent:
- Use Indian English vocabulary ("kindly", "good name", "do the needful")
- Maintain warm but professional intonation
- Clear articulation suitable for call center environment

---

## EVALUATION FLOW - SIX PHASES

### PHASE 1: WELCOME & CANDIDATE INFORMATION
**Duration:** 1-2 minutes

1. Greet warmly: "Namaste! I am Eva, your AI evaluation agent for Call Center Assessment. Welcome to your assessment session."
2. Collect candidate name: "Before we begin, may I kindly know your good name please?"
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
   "Why do you want to work in the automotive customer experience domain?"
   - Purpose: Intent & motivation
   - Capture: confidence score

3. **Challenge Handling:**
   "Describe a situation where you handled a challenging customer."
   - Purpose: Stress-handling ability
   - Capture: handling_pressure score

4. **Domain Knowledge:**
   "What do you know about the company's product lineup?"
   - Purpose: Product awareness
   - Capture: product_knowledge score

5. **Role Suitability:**
   "How comfortable are you with achieving lead generation targets and consistent calling?"
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
    - If overall score < 60: "We noted some areas for voice clarity improvement, such as articulation and volume. You can work on projection and pace for better engagement."

8. Capture scores using the report data:
    - clarity_pace (based on report clarity and pace scores)
    - confidence

### PHASE 4: CALL SCENARIO SIMULATION
**Duration:** 3-4 minutes

**CRITICAL PHASE TRANSITION:**
1. **MANDATORY: Call advance_phase("call_scenario")** to update the phase to call scenario
2. **Wait for tool confirmation before proceeding**
3. Then introduce the scenario

Select scenario based on context.selectedScenario or use progressive difficulty:

**BEGINNER - Bolero Neo Inquiry:**
Announce: "Now let's move forward to the next phase: the call scenario simulation. We'll now enter a customer interaction."

Transform into customer persona:
"Hi, I saw the Mahindra Bolero Neo online. Can you tell me the basic price?"

Expected agent behaviors:
- Acknowledge inquiry professionally
- Ask probing questions about priorities
- Provide relevant information
- Offer follow-up options

**MODERATE - XUV700 Comparison:**
"I'm comparing the XUV700 with Hyundai Alcazar. Why should I choose Mahindra?"

Expected behaviors:
- Handle competitive comparison diplomatically
- Highlight Mahindra advantages (5-star safety, ADAS, etc.)
- Address follow-up questions about mileage
- Arrange test drive

**EXPERIENCED - XUV400 EV Concerns:**
(Frustrated tone): "Your EV looks good, but I'm worried about charging time and battery life. I don't want to get stuck."

Expected behaviors:
- Acknowledge concerns with empathy
- Provide accurate EV information
- Address range anxiety
- Convert concern to confidence

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

Transform into angry customer:
"My service bill is too high! No one explained anything and I've been waiting forever."

Evaluation points:
- Empathy expression ("I'm really sorry", "I understand your frustration")
- Active listening (paraphrasing concerns)
- Solution orientation
- Professional composure under pressure

If candidate handles well, gradually de-escalate
If candidate struggles, maintain frustration to test limits

Capture:
- empathy
- handling_pressure
- customer_understanding

### PHASE 6: TYPING TEST (CALL SUMMARY) & CONCLUSION
**Duration:** 5 minutes for typing test

**CRITICAL: Call advance_phase("empathy_scenario") FIRST** to signal you are starting the typing test phase.

1. Exit role-play: "Okay, that concludes our scenario exercises."

2. Transition to typing test: "For the final part of your evaluation, you will now complete a written call summary. Please look at your screen where a typing test will appear. You'll have 5 minutes to type a professional summary of the customer interaction we just had. Include the key discussion points, customer concerns, solutions offered, and next steps."

3. **CRITICAL: DO NOT ask the candidate to speak anything after this point. The typing test on screen serves as the closure assessment.**

4. After announcing the typing test, simply say: "Please complete the typing test on your screen. Once you submit your summary, your evaluation will be complete. A human recruiter will review your assessment and contact you regarding next steps. Good luck, and thank you for your time today!"

5. **STOP SPEAKING** - Wait for the candidate to complete the typing test on screen. The system will automatically mark the evaluation as complete once they submit.

**NOTE:** The closure_quality and process_accuracy scores will be assessed based on the WRITTEN summary the candidate types, not a spoken response.

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
2. **product_knowledge:** Product awareness, accurate information
3. **empathy:** Quality of reassurance lines, emotional intelligence
4. **customer_understanding:** Ability to probe needs, active listening
5. **handling_pressure:** Composure in tough scenarios, no fumbling
6. **confidence:** Tone stability, self-assurance
7. **process_accuracy:** Lead capturing, summarizing, clear CTA
8. **closure_quality:** Professional, crisp, complete ending

### CALIBRATION GUIDANCE (from evaluator feedback)

When scoring, check context.calibrationGuidance for specific parameter adjustments based on human evaluator feedback. This helps align AI scoring with human expectations.

If calibration guidance is provided for a parameter:
- Read the guidance before scoring
- Consider the adjustment direction (evaluators rate higher/lower)
- Apply the insight to your scoring decision
- Still use your own judgment - calibration is guidance, not override

---

## TOOL USAGE

### Data Capture
Use capture_evaluation_data tool throughout:
- After collecting candidate name: capture_evaluation_data("candidate_name", "[name]", "N/A")
- After each phase section: capture relevant scores WITH REASONS
- At conclusion: capture overall_score and summary

⚠️ **CRITICAL: Every score MUST include a reason (5-15 words) explaining WHY that score was given.**

Example calls with REQUIRED reasons:
capture_evaluation_data("clarity_pace", "4", "Clear articulation, good pace but slight hesitation on technical terms")
capture_evaluation_data("product_knowledge", "3", "Basic awareness of product lineup, unclear on EV specifications")
capture_evaluation_data("empathy", "5", "Excellent reassurance, acknowledged frustration, offered genuine solutions")
capture_evaluation_data("handling_pressure", "2", "Showed nervousness, fumbled under escalation scenario")
capture_evaluation_data("confidence", "4", "Steady tone throughout, self-assured responses")

### Phase Management
Use advance_phase tool when completing each phase:
- advance_phase("personal_questions") - after completing personal questions
- advance_phase("reading_task") - after completing reading assessment
- etc.

### Voice Analysis (CRITICAL for Reading Task)
1. Call start_voice_analysis() BEFORE asking candidate to read
2. Wait silently while candidate reads
3. Call stop_voice_analysis() AFTER candidate finishes reading
4. Call get_voice_analysis_report() to get metrics and recommendations
5. Use the report to provide feedback and capture scores

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
      description: "Capture evaluation metrics and candidate information during assessment. Use this throughout the evaluation to record scores, observations, and candidate responses. Before scoring, check context.calibrationGuidance[parameter] for any calibration adjustments based on evaluator feedback.",
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
            description: "REQUIRED for scores: A brief 5-15 word justification explaining why this score was given. Example: 'Clear articulation with good pace, slight hesitation on technical terms'"
          }
        },
        required: ["data_type", "value", "reason"],
        additionalProperties: false,
      },
      execute: async (input, details) => {
        const typedInput = input as { data_type: string; value: string; reason?: string };
        const context = details?.context as any;
        
        // Check if calibration guidance exists for this parameter
        const calibration = context?.calibrationGuidance?.[typedInput.data_type];
        if (calibration && calibration.guidance) {
          console.log(`[CCEval v2.1.0] 📊 Calibration active for ${typedInput.data_type}: adjustment=${calibration.adjustment}, guidance="${calibration.guidance.substring(0, 50)}..."`);
        }
        
        if (context?.captureDataPoint) {
          // Pass reason as the 4th parameter for storing with the score
          context.captureDataPoint(typedInput.data_type, typedInput.value, 'captured', typedInput.reason);
          console.log(`[CCEval v2.1.0] ${typedInput.data_type}: ${typedInput.value} | Reason: ${typedInput.reason || 'No reason provided'}`);
          return { 
            success: true, 
            message: `Captured ${typedInput.data_type}: ${typedInput.value}`,
            data_type: typedInput.data_type,
            value: typedInput.value,
            reason: typedInput.reason,
            calibrationApplied: !!calibration
          };
        }
        
        console.log(`[CCEval v2.1.0 - No Context] ${typedInput.data_type}: ${typedInput.value}`);
        return { 
          success: true, 
          message: `Logged ${typedInput.data_type}: ${typedInput.value} (context not available)` 
        };
      },
    }),
    
    tool({
      name: "get_reading_passage",
      description: "Retrieve passage metadata for internal reference only. IMPORTANT: The reading passage is displayed visually on the candidate's screen - DO NOT read or speak the passage text aloud. Only use this tool if you need to verify which passage was assigned.",
      parameters: {
        type: "object",
        properties: {
          passage_type: {
            type: "string",
            enum: ["safety_adas", "ev_fast_charging", "connected_car"],
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
          vehicle: scenario.vehicle,
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
        
        // Note: typing_test serves as the closure - no separate spoken closure needed
        const phaseOrder = ["personal_questions", "reading_task", "call_scenario", "empathy_scenario", "typing_test", "completed"];
        const currentIndex = phaseOrder.indexOf(typedInput.completed_phase);
        const nextPhase = currentIndex < phaseOrder.length - 1 ? phaseOrder[currentIndex + 1] : "completed";
        
        if (context?.captureDataPoint) {
          context.captureDataPoint("phase_completed", typedInput.completed_phase, 'captured');
        }
        
        // Update phase in the UI
        if (context?.setCurrentPhase) {
          context.setCurrentPhase(nextPhase);
        }
        
        console.log(`[CCEval v2.1.0 Phase Transition] ${typedInput.completed_phase} → ${nextPhase}`);
        
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
      description: "Start collecting voice quality metrics. Call this BEFORE asking the candidate to read the paragraph aloud. This begins the voice analysis phase and automatically sets the current phase to 'reading_task'.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
        additionalProperties: false,
      },
      execute: async (_input, details) => {
        const context = details?.context as any;
        
        console.log('[CCEval v2.1.0 Voice Analysis] 🎬🎬🎬 start_voice_analysis TOOL CALLED');
        console.log('[CCEval v2.1.0 Voice Analysis] 📋 Context available:', !!context);
        console.log('[CCEval v2.1.0 Voice Analysis] 📋 Context keys:', context ? Object.keys(context) : 'N/A');
        console.log('[CCEval v2.1.0 Voice Analysis] 📋 startVoiceAnalysis fn available:', typeof context?.startVoiceAnalysis);
        console.log('[CCEval v2.1.0 Voice Analysis] 📋 setCurrentPhase fn available:', typeof context?.setCurrentPhase);
        
        // CRITICAL: Set the phase to reading_task FIRST (this persists to DB)
        if (context?.setCurrentPhase) {
          try {
            await context.setCurrentPhase('reading_task');
            console.log('[CCEval v2.1.0 Voice Analysis] ✅ Phase set to reading_task (should be in DB now)');
          } catch (error) {
            console.error('[CCEval v2.1.0 Voice Analysis] ❌ Failed to set phase:', error);
          }
        } else {
          console.error('[CCEval v2.1.0 Voice Analysis] ❌ setCurrentPhase not available in context!');
        }
        
        // Then start voice analysis
        if (context?.startVoiceAnalysis) {
          console.log('[CCEval v2.1.0 Voice Analysis] 🔥 About to call context.startVoiceAnalysis()...');
          context.startVoiceAnalysis();
          console.log('[CCEval v2.1.0 Voice Analysis] ✅ context.startVoiceAnalysis() was called');
          return { success: true, message: 'Voice analysis started - phase set to reading_task, metrics collection enabled' };
        }
        
        console.error('[CCEval v2.1.0 Voice Analysis] ❌ startVoiceAnalysis not available in context');
        return { success: false, message: 'Voice analysis context not available' };
      },
    }),

    tool({
      name: "stop_voice_analysis",
      description: "Stop collecting voice quality metrics. Call this AFTER the candidate finishes reading the paragraph. This ends the voice analysis phase and prepares the report.",
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
          console.log('[CCEval v2.1.0 Voice Analysis] Stopped collecting voice metrics');
          return { success: true, message: 'Voice analysis stopped - metrics collection complete' };
        }
        
        console.warn('[CCEval v2.1.0 Voice Analysis] stopVoiceAnalysis not available in context');
        return { success: false, message: 'Voice analysis context not available' };
      },
    }),

    tool({
      name: "get_voice_analysis_report",
      description: "Get the voice quality analysis report after the candidate has finished reading. Call this AFTER stop_voice_analysis to get the metrics and recommendations.",
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
          console.log('[CCEval v2.1.0 Voice Analysis] Report retrieval attempted');
          
          if (!report) {
            console.error('[CCEval v2.1.0 Voice Analysis] Report is null - not enough voice samples collected');
            return {
              success: false,
              message: 'Insufficient voice samples collected. Need at least 5 samples (1 second of speech).',
              report: null
            };
          }
          
          console.log('[CCEval v2.1.0 Voice Analysis] Report generated successfully:', {
            overallScore: report.overallScore,
            sampleCount: report.sampleCount,
            duration: report.duration
          });
          
          // Save to database if saveVoiceAnalysis function is available
          if (context?.saveVoiceAnalysis) {
            try {
              await context.saveVoiceAnalysis(report);
              console.log('[CCEval v2.1.0 Voice Analysis] ✅ Report saved to database');
            } catch (error) {
              console.error('[CCEval v2.1.0 Voice Analysis] ❌ Failed to save report:', error);
              return {
                success: false,
                message: `Failed to save report: ${error}`,
                report: null
              };
            }
          } else {
            console.warn('[CCEval v2.1.0 Voice Analysis] ⚠️ saveVoiceAnalysis function not available in context');
          }
          
          return { 
            success: true, 
            report,
            message: `Voice analysis report generated with ${report.sampleCount} samples (${report.duration}s) - Overall score: ${report.overallScore}%`
          };
        }
        
        console.warn('[CCEval v2.1.0 Voice Analysis] getVoiceAnalysisReport not available in context');
        return { 
          success: false, 
          message: 'Voice analysis report function not available in context',
          report: null
        };
      },
    }),
  ],

  handoffs: [], // Will be populated if needed
});

export default ccevalAgent;
