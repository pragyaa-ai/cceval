import { RealtimeAgent, tool } from '@openai/agents/realtime';

// Reading passage options
const READING_PASSAGES = {
  safety_adas: `Safety has become a top priority in the Indian automobile market. Features like six airbags, advanced driver assistance systems, electronic stability control, and hill hold assist help drivers manage difficult road and traffic conditions. As customers compare multiple brands, explaining these safety features in simple, relatable terms plays an important role in building trust and supporting informed decision-making.`,
  
  ev_fast_charging: `Electric vehicle customers in India look for fast-charging capability, practical daily range, and battery longevity. With growing public charging infrastructure, modern EVs offer quick charge options that significantly reduce waiting time. Communicating these benefits clearly helps customers understand the convenience of adopting an electric vehicle for long commutes and everyday usage.`,
  
  connected_car: `Connected car technology is becoming essential in India, with drivers expecting features like remote lock–unlock, live vehicle tracking, geo-fencing, emergency alerts, and over-the-air updates. These features not only enhance safety but also improve convenience. When speaking to customers, it is important to describe how these technologies add value to their daily driving experience.`
};

// Call scenarios
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

// Empathy scenario
const EMPATHY_SCENARIO = {
  setup: `You are an angry customer whose service bill is unexpectedly high with no explanation.`,
  opening: `My service bill is too high! No one explained anything and I've been waiting forever.`
};

// Closure statement template
const CLOSURE_TEMPLATE = `Based on our discussion, you're interested in the right model with strong safety and technology features. I have arranged a follow-up call/test drive and will share all details on message. If there's anything else you need, please let me know. Thank you for your time today.`;

export const mahindraEvaluationAgent = new RealtimeAgent({
  name: 'Mahindra Evaluation Agent',
  voice: 'coral',
  handoffDescription:
    'Advanced AI interviewer for Mahindra Call Center candidate evaluations. Conducts comprehensive assessments including personal questions, reading tasks, call scenarios, and empathy challenges.',

  instructions: `
# MAHINDRA HCE EVALUATION AGENT - VERSION 2.0

## HIGH-LEVEL GOAL
You are an advanced AI interviewer and evaluator for Mahindra & Mahindra Call Center Operations candidates. You conduct a comprehensive voice-based evaluation covering personal questions, reading tasks, call simulations, empathy challenges, and closure quality assessment.

## IDENTITY & PERSONA
You are "Eva," VoiceAgent 2.0 - a sophisticated AI designed for:
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

1. Greet warmly: "Namaste! I am Eva, your AI evaluation agent for Mahindra Call Center. Welcome to your assessment session."
2. Collect candidate name: "Before we begin, may I kindly know your good name please?"
3. Capture name using capture_evaluation_data tool
4. Explain evaluation structure:
   - "Thank you, [Name]. Today's evaluation has five parts:"
   - "First, I'll ask some personal questions about your background and motivation"
   - "Second, you'll read a short passage about automobile features"
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
   "What do you know about Mahindra & Mahindra's PV or EV lineup?"
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

1. Introduce the task:
   "Excellent! Now let's move to the reading assessment. This helps us evaluate your clarity, pace, and tone."

2. Provide the passage (use context.selectedPassage or default to safety_adas):
   "I will first read the paragraph to demonstrate, then you will read it for evaluation."

3. **DEMONSTRATE** by reading the paragraph aloud clearly

4. **CRITICAL: Call start_voice_analysis tool** BEFORE asking candidate to read

5. Then say: "Now please read that same paragraph aloud. Take your time and speak naturally."

6. **REMAIN SILENT** while candidate reads - do not interrupt

7. After candidate finishes (wait for 2-3 seconds of silence):
   - **MANDATORY: Call stop_voice_analysis tool** to end metrics collection
   - **MANDATORY: Immediately call get_voice_analysis_report tool** to retrieve and save the analysis results
   - **YOU MUST call get_voice_analysis_report - the report will not be saved otherwise!**
   
8. Say: "Thank you. That gives me a good baseline of your voice qualities."

9. Use the voice analysis report to inform your assessment. Share brief feedback:
    - If overall score >= 80: "Your voice clarity and pace are excellent."
    - If overall score >= 60: "Good voice projection. Some minor areas for improvement."
    - If overall score < 60: "We noted some areas for voice clarity improvement, such as articulation and volume. You can work on projection and pace for better engagement."

10. Capture scores using the report data:
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

### PHASE 6: CLOSURE TASK & CONCLUSION
**Duration:** 1-2 minutes

**CRITICAL: Call advance_phase("empathy_scenario") FIRST** to signal you are starting the closure phase.

1. Exit role-play: "Okay, that concludes our scenario exercises."

2. Closure task: "For the final part, please deliver a professional closure statement as if ending a successful customer call. Summarize what was discussed, confirm next steps, and close professionally."

3. Evaluate their closure quality against this standard:
   "Based on our discussion, you're interested in the right model with strong safety and technology features. I have arranged a follow-up call/test drive and will share all details on message. If there's anything else you need, please let me know. Thank you for your time today."

4. Capture: closure_quality, process_accuracy

5. Conclude evaluation:
   "Thank you, [Name]. That completes your Mahindra Call Center evaluation. A human recruiter will review your assessment and contact you regarding next steps. Have a great day!"

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
2. **product_knowledge:** PV & EV awareness, accurate information
3. **empathy:** Quality of reassurance lines, emotional intelligence
4. **customer_understanding:** Ability to probe needs, active listening
5. **handling_pressure:** Composure in tough scenarios, no fumbling
6. **confidence:** Tone stability, self-assurance
7. **process_accuracy:** Lead capturing, summarizing, clear CTA
8. **closure_quality:** Professional, crisp, complete ending

---

## TOOL USAGE

### Data Capture
Use capture_evaluation_data tool throughout:
- After collecting candidate name: capture_evaluation_data("candidate_name", "[name]")
- After each phase section: capture relevant scores
- At conclusion: capture overall_score and summary

Example:
capture_evaluation_data("clarity_pace", "4", "Clear articulation throughout, good pacing")
capture_evaluation_data("product_knowledge", "3", "Basic awareness of Mahindra lineup")
capture_evaluation_data("empathy", "5", "Excellent empathetic responses during escalation")

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
      description: "Capture evaluation metrics and candidate information during assessment. Use this throughout the evaluation to record scores, observations, and candidate responses.",
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
          notes: {
            type: "string",
            description: "Optional notes or justification for the score"
          }
        },
        required: ["data_type", "value"],
        additionalProperties: false,
      },
      execute: async (input, details) => {
        const typedInput = input as { data_type: string; value: string; notes?: string };
        const context = details?.context as any;
        
        if (context?.captureDataPoint) {
          context.captureDataPoint(typedInput.data_type, typedInput.value, 'captured');
          console.log(`[Mahindra Evaluation] ${typedInput.data_type}: ${typedInput.value} ${typedInput.notes ? `(${typedInput.notes})` : ''}`);
          return { 
            success: true, 
            message: `Captured ${typedInput.data_type}: ${typedInput.value}`,
            data_type: typedInput.data_type,
            value: typedInput.value,
            notes: typedInput.notes
          };
        }
        
        console.log(`[Mahindra Evaluation - No Context] ${typedInput.data_type}: ${typedInput.value}`);
        return { 
          success: true, 
          message: `Logged ${typedInput.data_type}: ${typedInput.value} (context not available)` 
        };
      },
    }),
    
    tool({
      name: "get_reading_passage",
      description: "Retrieve a specific reading passage for the reading task phase",
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
          text: passage
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
        
        const phaseOrder = ["personal_questions", "reading_task", "call_scenario", "empathy_scenario", "closure_task", "completed"];
        const currentIndex = phaseOrder.indexOf(typedInput.completed_phase);
        const nextPhase = currentIndex < phaseOrder.length - 1 ? phaseOrder[currentIndex + 1] : "completed";
        
        if (context?.captureDataPoint) {
          context.captureDataPoint("phase_completed", typedInput.completed_phase, 'captured');
        }
        
        // Update phase in the UI
        if (context?.setCurrentPhase) {
          context.setCurrentPhase(nextPhase);
        }
        
        console.log(`[Phase Transition] ${typedInput.completed_phase} → ${nextPhase}`);
        
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
        
        console.log('[Voice Analysis Tool] 🎬 start_voice_analysis called');
        
        // CRITICAL: Set the phase to reading_task FIRST (this persists to DB)
        if (context?.setCurrentPhase) {
          try {
            await context.setCurrentPhase('reading_task');
            console.log('[Voice Analysis Tool] ✅ Phase set to reading_task (should be in DB now)');
          } catch (error) {
            console.error('[Voice Analysis Tool] ❌ Failed to set phase:', error);
          }
        } else {
          console.error('[Voice Analysis Tool] ❌ setCurrentPhase not available in context!');
        }
        
        // Then start voice analysis
        if (context?.startVoiceAnalysis) {
          context.startVoiceAnalysis();
          console.log('[Voice Analysis Tool] ✅ Voice metrics collection started');
          return { success: true, message: 'Voice analysis started - phase set to reading_task, metrics collection enabled' };
        }
        
        console.error('[Voice Analysis Tool] ❌ startVoiceAnalysis not available in context');
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
          console.log('[Voice Analysis] Stopped collecting voice metrics');
          return { success: true, message: 'Voice analysis stopped - metrics collection complete' };
        }
        
        console.warn('[Voice Analysis] stopVoiceAnalysis not available in context');
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
          console.log('[Voice Analysis] Report retrieval attempted');
          
          if (!report) {
            console.error('[Voice Analysis] Report is null - not enough voice samples collected');
            return {
              success: false,
              message: 'Insufficient voice samples collected. Need at least 5 samples (1 second of speech).',
              report: null
            };
          }
          
          console.log('[Voice Analysis] Report generated successfully:', {
            overallScore: report.overallScore,
            sampleCount: report.sampleCount,
            duration: report.duration
          });
          
          // Save to database if saveVoiceAnalysis function is available
          if (context?.saveVoiceAnalysis) {
            try {
              await context.saveVoiceAnalysis(report);
              console.log('[Voice Analysis] ✅ Report saved to database');
            } catch (error) {
              console.error('[Voice Analysis] ❌ Failed to save report:', error);
              return {
                success: false,
                message: `Failed to save report: ${error}`,
                report: null
              };
            }
          } else {
            console.warn('[Voice Analysis] ⚠️ saveVoiceAnalysis function not available in context');
          }
          
          return { 
            success: true, 
            report,
            message: `Voice analysis report generated with ${report.sampleCount} samples (${report.duration}s) - Overall score: ${report.overallScore}%`
          };
        }
        
        console.warn('[Voice Analysis] getVoiceAnalysisReport not available in context');
        return { 
          success: false, 
          message: 'Voice analysis report function not available in context',
          report: null
        };
      },
    }),
  ],

  handoffs: [], // Will be populated in index.ts if needed
});

export default mahindraEvaluationAgent;









