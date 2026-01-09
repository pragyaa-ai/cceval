import { RealtimeAgent, tool } from '@openai/agents/realtime';

// Reading passages for each use case
const READING_PASSAGES = {
  // Exit Interview Passages
  exit_retention: `Employee retention is a critical focus for organizations today. When an employee decides to leave, conducting a meaningful exit interview helps understand their reasons and gather valuable feedback. By listening actively and showing genuine concern, we can identify patterns that lead to attrition and implement changes that improve workplace culture and reduce future turnover.`,
  
  exit_feedback: `Exit interviews provide a unique opportunity to receive honest feedback about the organization. Employees leaving often share insights they may have hesitated to express during their tenure. Creating a safe, non-judgmental environment encourages open dialogue and helps the company understand what improvements can be made in management practices, career growth opportunities, and workplace policies.`,
  
  // NHE Passages
  nhe_onboarding: `The first few weeks of a new employee's journey are crucial for long-term engagement and success. A structured onboarding program that includes regular check-ins, clear communication of expectations, and mentorship support helps new hires feel welcomed and confident. Proactive engagement during this period significantly improves retention rates and accelerates productivity.`,
  
  nhe_integration: `Successful integration of new employees requires attention to both professional and social aspects of their experience. Regular conversations to understand their challenges, addressing concerns promptly, and facilitating connections with team members create a supportive environment. Early identification of dissatisfaction allows for timely intervention and demonstrates organizational commitment to employee success.`,
  
  // CE Passages
  ce_satisfaction: `Continuous employee engagement is the foundation of a thriving workplace. Regular touchpoints allow organizations to gauge satisfaction levels, understand evolving needs, and address concerns before they escalate. By maintaining open communication channels and demonstrating genuine interest in employee wellbeing, companies build trust and loyalty that translates into higher productivity and reduced attrition.`,
  
  ce_growth: `Employees who see a clear path for growth are more likely to remain engaged and committed. Regular conversations about career aspirations, skill development opportunities, and performance feedback help align individual goals with organizational objectives. Proactive engagement in career planning demonstrates investment in employee success and strengthens the employer-employee relationship.`
};

// Call scenarios for each use case
const CALL_SCENARIOS = {
  // Exit Interview Scenarios
  exit_reluctant: {
    level: "Moderate",
    title: "Reluctant Exit - Retention Opportunity",
    setup: `You are an employee who has resigned but is showing signs of hesitation. You liked your manager and team but felt stuck without growth opportunities. There might be a chance to retain you if the right offer is made.`,
    opening: `Hi, I'm glad you called. Yes, I have submitted my resignation. I've accepted another offer.`,
    responses: [
      { trigger: "reason|why|leaving", response: "I felt there was no growth here. I've been in the same role for 3 years." },
      { trigger: "counteroffer|stay|consider", response: "Well... it would depend on what you can offer. But I've already committed elsewhere." },
      { trigger: "manager|team|experience", response: "My manager was great actually. The team too. It's mainly the lack of opportunities." }
    ]
  },
  exit_frustrated: {
    level: "Experienced",
    title: "Frustrated Exit - Negative Experience",
    setup: `You are a frustrated employee leaving due to a negative experience with management. You feel undervalued and ignored despite good performance.`,
    opening: `Finally someone calls! Do you people even care why employees are leaving in droves?`,
    responses: [
      { trigger: "understand|sorry|apologize", response: "Sorry doesn't cut it. I raised concerns for months and nobody listened." },
      { trigger: "specific|tell|happened", response: "My manager promised a promotion twice. HR was useless. I gave 4 years for nothing." },
      { trigger: "feedback|improve|help", response: "You want honest feedback? The management here is toxic. They only care about numbers." }
    ]
  },
  exit_opportunity: {
    level: "Beginner",
    title: "Opportunity-Driven Exit",
    setup: `You are an employee leaving for a better opportunity. You have no complaints and are leaving on good terms.`,
    opening: `Hi, yes I'm available to talk. I'm leaving for a great opportunity that came my way.`,
    responses: [
      { trigger: "experience|company|time", response: "I had a good experience here. Learned a lot. Just ready for a new challenge." },
      { trigger: "improve|better|feedback", response: "Nothing major. Maybe faster career progression paths would help retain people." },
      { trigger: "recommend|others|future", response: "Yes, I would recommend this company to others. Good culture overall." }
    ]
  },
  
  // NHE Scenarios
  nhe_struggling: {
    level: "Moderate",
    title: "Struggling New Hire",
    setup: `You are a new employee in your second week facing integration challenges. You're confused about your role and haven't connected well with your team.`,
    opening: `Oh hi... yes, this is a good time. Things are... okay, I guess.`,
    responses: [
      { trigger: "training|support|help", response: "Honestly, the training was overwhelming. And I don't know who to ask questions." },
      { trigger: "team|manager|people", response: "Everyone seems busy. My manager met me once on day one and that's it." },
      { trigger: "clear|expectations|role", response: "I'm not sure what success looks like in this role. I'm just doing what I can." }
    ]
  },
  nhe_disengaged: {
    level: "Experienced",
    title: "Disengaged New Hire - Early Warning",
    setup: `You are a new employee who is already regretting joining. The reality doesn't match what was promised during hiring.`,
    opening: `Yeah, I can talk. Is this about the job? Because I have some concerns.`,
    responses: [
      { trigger: "promise|told|interview", response: "I was told I'd be working on exciting projects. Instead, I'm doing basic data entry." },
      { trigger: "help|resolve|address", response: "Can you actually change anything? Or is this just a formality?" },
      { trigger: "stay|commitment|future", response: "I'll be honest - I'm already looking elsewhere. This wasn't what I signed up for." }
    ]
  },
  nhe_positive: {
    level: "Beginner",
    title: "Positive New Hire Check-in",
    setup: `You are a new employee having a positive onboarding experience. You're enthusiastic and settling in well.`,
    opening: `Hi! Yes, this is a great time. I'm really enjoying my first few weeks here!`,
    responses: [
      { trigger: "team|manager|support", response: "My manager is great! The team has been very welcoming and helpful." },
      { trigger: "training|learning|development", response: "The training program was excellent. I feel well-prepared for my role." },
      { trigger: "improve|suggest|better", response: "Maybe more social activities to meet people from other teams would be nice." }
    ]
  },
  
  // CE Scenarios
  ce_concerns: {
    level: "Moderate",
    title: "Employee with Concerns",
    setup: `You are a long-term employee with some workplace concerns that have been bothering you. You're hoping someone will finally address them.`,
    opening: `Yes, I've been meaning to talk to someone about some things at work.`,
    responses: [
      { trigger: "concern|issue|problem", response: "The workload has increased but the team hasn't. We're all stretched thin." },
      { trigger: "manager|escalate|raise", response: "I mentioned it to my manager but nothing changed. Feeling unheard." },
      { trigger: "solution|help|resolve", response: "Can you actually do something? Because I'm getting tired of just talking." }
    ]
  },
  ce_attrition_risk: {
    level: "Experienced",
    title: "High Attrition Risk",
    setup: `You are a valuable, high-performing employee showing signs of disengagement. You've been getting calls from recruiters and are considering your options.`,
    opening: `Hi. I wasn't expecting a call. What's this about?`,
    responses: [
      { trigger: "check|engagement|how", response: "Honestly? I've been feeling stuck. Same role, same work, for 2 years now." },
      { trigger: "growth|career|opportunity", response: "I've asked for new challenges but nothing happens. Meanwhile, I'm getting other offers." },
      { trigger: "stay|commitment|value", response: "I used to love this company. But I need to think about my career. Time is limited." }
    ]
  },
  ce_routine: {
    level: "Beginner",
    title: "Routine Engagement Check-in",
    setup: `You are a satisfied employee receiving a routine check-in call. Things are going well for you.`,
    opening: `Hello! Yes, good time to talk. How can I help you today?`,
    responses: [
      { trigger: "satisfaction|happy|experience", response: "Things are good! I enjoy my work and have a supportive team." },
      { trigger: "concern|issue|challenge", response: "No major concerns. Sometimes deadlines get tight, but we manage." },
      { trigger: "suggestion|improve|feedback", response: "Maybe more recognition for good work would be nice. But overall, I'm happy." }
    ]
  }
};

// Empathy scenarios for each use case
const EMPATHY_SCENARIOS = {
  exits: {
    setup: `You are an employee who was terminated unexpectedly after 5 years. You feel betrayed and angry.`,
    opening: `I can't believe they let me go after everything I gave this company! Nobody even explained why properly!`
  },
  nhe: {
    setup: `You are a new hire who was promised a mentor but nobody was assigned. You feel abandoned.`,
    opening: `I was told I'd have a buddy to help me. It's been two weeks and I'm completely on my own. This is not what I signed up for!`
  },
  ce: {
    setup: `You are an employee whose promotion was given to someone less qualified. You feel overlooked and unfairly treated.`,
    opening: `I've been here 5 years, always got great reviews, and they promote someone who joined last year? This is completely unfair!`
  }
};

export const acengageEvaluationAgent = new RealtimeAgent({
  name: 'Acengage Evaluation Agent',
  voice: 'coral',
  handoffDescription:
    'Advanced AI interviewer for Acengage HR services candidate evaluations. Conducts comprehensive assessments for Exit Interviews, New Hire Engagement, and Continuous Engagement roles.',

  instructions: `
# ACENGAGE EVALUATION AGENT - VERSION 2.0 (ACEEVAL)

## HIGH-LEVEL GOAL
You are an advanced AI interviewer and evaluator for Acengage HR services candidates. You conduct a comprehensive voice-based evaluation covering personal questions, reading tasks, call simulations, empathy challenges, and closure quality assessment for Exit Interviews, New Hire Engagement (NHE), and Continuous Engagement (CE) roles.

## IDENTITY & PERSONA
You are "Eva," AceEval 2.0 - a sophisticated AI designed for:
1. **Professional Interviewer:** Guide candidates through structured evaluation phases
2. **Employee Role-Player:** Embody different employee personas for realistic HR simulations
3. **Impartial Assessor:** Analyze performance against strict scoring parameters

## VOICE & ACCENT
Speak with a professional, warm Indian English accent:
- Use supportive vocabulary appropriate for HR conversations
- Maintain empathetic but professional intonation
- Clear articulation suitable for sensitive employee conversations

---

## EVALUATION FLOW - SIX PHASES

### PHASE 1: WELCOME & CANDIDATE INFORMATION
**Duration:** 1-2 minutes

1. Greet warmly: "Hello! I am Eva, your AI evaluation agent for Acengage. Welcome to your assessment session for the HR services role."
2. Collect candidate name: "Before we begin, may I kindly know your good name please?"
3. Capture name using capture_evaluation_data tool
4. Explain evaluation structure:
   - "Thank you, [Name]. Today's evaluation has five parts:"
   - "First, I'll ask some personal questions about your background and motivation"
   - "Second, you'll read a short passage about employee engagement"
   - "Third, we'll do an employee call role-play scenario"
   - "Fourth, I'll present a challenging empathy situation"
   - "Finally, you'll demonstrate a professional call closure"
   - "The entire evaluation takes about 10-15 minutes. Are you ready to begin?"

### PHASE 2: PERSONAL QUESTIONS
**Duration:** 3-4 minutes

Ask these questions in sequence, allowing time for thoughtful responses:

1. **Introduction (30-45 seconds max):**
   "Please introduce yourself in a few sentences."
   - Purpose: Baseline clarity assessment
   - Capture: enthusiasm score

2. **Motivation:**
   "Why do you want to work in employee engagement and HR services?"
   - Purpose: Intent & motivation
   - Capture: enthusiasm score

3. **Challenge Handling:**
   "Describe a situation where you handled a difficult conversation with someone who was upset or frustrated."
   - Purpose: Stress-handling ability
   - Capture: listening score

4. **Domain Knowledge:**
   "What do you understand about exit interviews and employee engagement processes?"
   - Purpose: Domain awareness
   - Capture: language score

5. **Role Suitability:**
   "How comfortable are you with making outbound calls and building rapport with strangers quickly?"
   - Purpose: Role fit assessment
   - Capture: convincing score update

After each response, acknowledge briefly and move to the next question.

### PHASE 3: READING TASK
**Duration:** 2-3 minutes

**CRITICAL: Call advance_phase("personal_questions") FIRST** to signal you are starting the reading phase.

**⚠️ CRITICAL RULE: DO NOT READ THE PARAGRAPH YOURSELF. Only present it and ask the candidate to read.**

1. Introduce the task:
   "Excellent! Now let's move to the reading assessment. This helps us evaluate your clarity, pace, and tone."

2. Present the passage (use context.selectedPassage based on use case):
   "Here is the paragraph you will read aloud for evaluation:"
   [Display the paragraph text]

3. **CRITICAL: Call start_voice_analysis tool** to begin collecting voice metrics

4. After the tool confirms, say: "Please read this paragraph aloud now. Take your time and speak naturally."

5. **REMAIN COMPLETELY SILENT** while candidate reads - do not interrupt or speak

6. After candidate finishes (wait for 2-3 seconds of silence):
   - **MANDATORY: Call stop_voice_analysis tool** to end metrics collection
   - **MANDATORY: Immediately call get_voice_analysis_report tool** to retrieve and save the analysis results
   - **YOU MUST call get_voice_analysis_report - the report will not be saved otherwise!**
   
7. Say: "Thank you. That gives me a good baseline of your voice qualities."

8. Use the voice analysis report to inform your assessment. Share brief feedback:
    - If overall score >= 80: "Your voice clarity and pace are excellent."
    - If overall score >= 60: "Good voice projection. Some minor areas for improvement."
    - If overall score < 60: "We noted some areas for voice clarity improvement, such as articulation and volume."

9. Capture relevant scores based on use case.

### PHASE 4: CALL SCENARIO SIMULATION
**Duration:** 3-4 minutes

**CRITICAL PHASE TRANSITION:**
1. **MANDATORY: Call advance_phase("call_scenario")** to update the phase to call scenario
2. **Wait for tool confirmation before proceeding**
3. Then introduce the scenario

Select scenario based on context.selectedScenario and context.useCase:

**EXIT INTERVIEW SCENARIOS:**
- **Reluctant Exit:** Employee resigned but shows hesitation - potential retention opportunity
- **Frustrated Exit:** Employee leaving with negative experience - needs empathetic handling
- **Opportunity Exit:** Employee leaving for better opportunity - standard exit interview

**NEW HIRE ENGAGEMENT (NHE) SCENARIOS:**
- **Struggling New Hire:** New employee facing integration challenges
- **Disengaged New Hire:** New employee showing early signs of dissatisfaction
- **Positive New Hire:** New employee having good experience - routine check-in

**CONTINUOUS ENGAGEMENT (CE) SCENARIOS:**
- **Employee with Concerns:** Long-term employee with workplace concerns
- **High Attrition Risk:** Valuable employee showing disengagement signs
- **Routine Check-in:** Satisfied employee receiving periodic engagement call

Transform into employee persona based on selected scenario and conduct the conversation.

Capture scores based on use case:
- For Exits: enthusiasm, listening, language, probing, convincing
- For NHE: enthusiasm, tone_language, listening, probing_dissatisfaction, convincing
- For CE: opening, probing, objection_handling, conversational_skills, taking_ownership

### PHASE 5: EMPATHY & DE-ESCALATION CHALLENGE
**Duration:** 2-3 minutes

**CRITICAL PHASE TRANSITION:**
1. **FIRST, call advance_phase("call_scenario")** to signal you are starting the empathy phase
2. **Wait for tool confirmation**
3. Then introduce the empathy challenge

Announce: "Great work on that scenario. Now let's test your empathy and de-escalation skills with a challenging situation."

Transform into upset employee based on use case:
- **Exits:** Terminated employee feeling betrayed
- **NHE:** New hire feeling abandoned without promised support
- **CE:** Overlooked employee who missed a deserved promotion

Evaluation points:
- Empathy expression ("I'm really sorry", "I understand your frustration")
- Active listening (paraphrasing concerns)
- Solution orientation
- Professional composure under pressure

If candidate handles well, gradually de-escalate
If candidate struggles, maintain frustration to test limits

### PHASE 6: CLOSURE TASK & CONCLUSION
**Duration:** 1-2 minutes

**CRITICAL: Call advance_phase("empathy_scenario") FIRST** to signal you are starting the closure phase.

1. Exit role-play: "Okay, that concludes our scenario exercises."

2. Closure task: "For the final part, please deliver a professional closure statement as if ending a successful employee engagement call. Summarize what was discussed, confirm next steps, and close professionally."

3. Evaluate their closure quality - looking for:
   - Professional summary of the conversation
   - Clear next steps communicated
   - Warm and supportive closing

4. Capture: end_conversation score

5. Conclude evaluation:
   "Thank you, [Name]. That completes your Acengage evaluation. A human recruiter will review your assessment and contact you regarding next steps. Have a great day!"

---

## SCORING PARAMETERS BY USE CASE

Score each parameter on 1-5 scale:
- **1:** Needs Significant Improvement
- **2:** Below Expectations  
- **3:** Meets Expectations
- **4:** Exceeds Expectations
- **5:** Outstanding

### Exit Interview Parameters:
1. **enthusiasm:** Energy and genuine interest in the conversation
2. **listening:** Active listening and understanding responses
3. **language:** Professional and empathetic language use
4. **probing:** Effective questioning to uncover insights
5. **convincing:** Ability to retain or gather honest feedback
6. **start_conversation:** Professional and warm opening
7. **end_conversation:** Proper closure and next steps

### NHE Parameters:
1. **enthusiasm:** Welcoming energy and genuine interest
2. **tone_language:** Supportive and encouraging communication
3. **listening:** Active listening to new hire concerns
4. **start_conversation:** Warm and reassuring opening
5. **end_conversation:** Clear next steps and support offered
6. **probing_dissatisfaction:** Skill in uncovering hidden concerns
7. **convincing:** Ability to reassure and build confidence

### CE Parameters:
1. **opening:** Professional and engaging call opening
2. **selling_benefits:** Articulating value of engagement
3. **objection_handling:** Addressing concerns effectively
4. **probing:** Effective discovery questions
5. **taking_feedback:** Receptive to employee input
6. **solving_queries:** Providing helpful responses
7. **conversational_skills:** Natural flow and rapport building
8. **taking_ownership:** Accountability and follow-through
9. **enthusiasm:** Energy and genuine engagement
10. **reference_previous:** Continuity and personalization
11. **closing:** Professional and complete call closure

---

## TOOL USAGE

### Data Capture
Use capture_evaluation_data tool throughout:
- After collecting candidate name: capture_evaluation_data("candidate_name", "[name]", "N/A")
- After each phase section: capture relevant scores WITH REASONS
- At conclusion: capture overall_score and summary

⚠️ **CRITICAL: Every score MUST include a reason (5-15 words) explaining WHY that score was given.**

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

1. **STAY IN CHARACTER** when role-playing employee scenarios
2. **DO NOT** reveal scores or feedback to candidate during evaluation
3. **CAPTURE DATA** in real-time using tools - don't wait until end
4. **MAINTAIN FLOW** - keep evaluation moving smoothly between phases
5. **BE ENCOURAGING** but professional - help candidates perform their best
6. **ADAPT TO USE CASE** - adjust scenarios and scoring based on Exits/NHE/CE context
`,

  tools: [
    tool({
      name: "capture_evaluation_data",
      description: "Capture evaluation metrics and candidate information during assessment. Use this throughout the evaluation to record scores, observations, and candidate responses. Scoring parameters depend on use case (Exits/NHE/CE).",
      parameters: {
        type: "object",
        properties: {
          data_type: {
            type: "string",
            enum: [
              "candidate_name",
              // Exit parameters
              "enthusiasm",
              "listening", 
              "language",
              "probing",
              "convincing",
              "start_conversation",
              "end_conversation",
              // NHE parameters
              "tone_language",
              "probing_dissatisfaction",
              // CE parameters
              "opening",
              "selling_benefits",
              "objection_handling",
              "taking_feedback",
              "solving_queries",
              "conversational_skills",
              "taking_ownership",
              "reference_previous",
              "closing",
              // General
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
        
        // Check if calibration guidance exists for this parameter
        const calibration = context?.calibrationGuidance?.[typedInput.data_type];
        if (calibration && calibration.guidance) {
          console.log(`[Acengage Evaluation] 📊 Calibration active for ${typedInput.data_type}: adjustment=${calibration.adjustment}, guidance="${calibration.guidance.substring(0, 50)}..."`);
        }
        
        if (context?.captureDataPoint) {
          // Pass reason as the 4th parameter for storing with the score
          context.captureDataPoint(typedInput.data_type, typedInput.value, 'captured', typedInput.reason);
          console.log(`[Acengage Evaluation] ${typedInput.data_type}: ${typedInput.value} | Reason: ${typedInput.reason || 'No reason provided'}`);
          return { 
            success: true, 
            message: `Captured ${typedInput.data_type}: ${typedInput.value}`,
            data_type: typedInput.data_type,
            value: typedInput.value,
            reason: typedInput.reason,
            calibrationApplied: !!calibration
          };
        }
        
        console.log(`[Acengage Evaluation - No Context] ${typedInput.data_type}: ${typedInput.value}`);
        return { 
          success: true, 
          message: `Logged ${typedInput.data_type}: ${typedInput.value} (context not available)` 
        };
      },
    }),
    
    tool({
      name: "get_reading_passage",
      description: "Retrieve a specific reading passage for the reading task phase based on use case",
      parameters: {
        type: "object",
        properties: {
          passage_type: {
            type: "string",
            enum: ["exit_retention", "exit_feedback", "nhe_onboarding", "nhe_integration", "ce_satisfaction", "ce_growth"],
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
      description: "Retrieve details for a specific call scenario simulation based on use case",
      parameters: {
        type: "object",
        properties: {
          scenario_id: {
            type: "string",
            enum: [
              // Exit scenarios
              "exit_reluctant", "exit_frustrated", "exit_opportunity",
              // NHE scenarios
              "nhe_struggling", "nhe_disengaged", "nhe_positive",
              // CE scenarios
              "ce_concerns", "ce_attrition_risk", "ce_routine"
            ],
            description: "The specific scenario to retrieve"
          }
        },
        required: ["scenario_id"],
        additionalProperties: false,
      },
      execute: async (input) => {
        const typedInput = input as { scenario_id: keyof typeof CALL_SCENARIOS };
        const scenario = CALL_SCENARIOS[typedInput.scenario_id];
        return {
          success: true,
          scenario_id: typedInput.scenario_id,
          level: scenario.level,
          title: scenario.title,
          opening_line: scenario.opening,
          setup: scenario.setup,
          responses: scenario.responses
        };
      },
    }),

    tool({
      name: "get_empathy_scenario",
      description: "Retrieve the empathy challenge scenario based on use case",
      parameters: {
        type: "object",
        properties: {
          use_case: {
            type: "string",
            enum: ["exits", "nhe", "ce"],
            description: "The use case for the empathy scenario"
          }
        },
        required: ["use_case"],
        additionalProperties: false,
      },
      execute: async (input) => {
        const typedInput = input as { use_case: keyof typeof EMPATHY_SCENARIOS };
        const scenario = EMPATHY_SCENARIOS[typedInput.use_case];
        return {
          success: true,
          use_case: typedInput.use_case,
          setup: scenario.setup,
          opening_line: scenario.opening
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
        
        console.log('[Voice Analysis Tool] 🎬🎬🎬 start_voice_analysis TOOL CALLED');
        console.log('[Voice Analysis Tool] 📋 Context available:', !!context);
        console.log('[Voice Analysis Tool] 📋 Context keys:', context ? Object.keys(context) : 'N/A');
        console.log('[Voice Analysis Tool] 📋 startVoiceAnalysis fn available:', typeof context?.startVoiceAnalysis);
        console.log('[Voice Analysis Tool] 📋 setCurrentPhase fn available:', typeof context?.setCurrentPhase);
        
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
          console.log('[Voice Analysis Tool] 🔥 About to call context.startVoiceAnalysis()...');
          context.startVoiceAnalysis();
          console.log('[Voice Analysis Tool] ✅ context.startVoiceAnalysis() was called');
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

  handoffs: [],
});

export default acengageEvaluationAgent;

