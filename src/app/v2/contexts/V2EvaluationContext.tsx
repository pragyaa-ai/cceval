"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";

// Use case types for Acengage
export type UseCase = "exits" | "nhe" | "ce";

export const USE_CASE_LABELS: Record<UseCase, string> = {
  exits: "Exit Interviews",
  nhe: "New Hire Engagement (NHE)",
  ce: "Continuous Engagement (CE)"
};

// Reading passage options - HR focused for Acengage
export const READING_PASSAGES = {
  // Exit Interview Passages
  exit_retention: {
    id: "exit_retention",
    title: "Employee Retention & Exit Process",
    useCase: "exits" as UseCase,
    wordCount: 65,
    text: "Employee retention is a critical focus for organizations today. When an employee decides to leave, conducting a meaningful exit interview helps understand their reasons and gather valuable feedback. By listening actively and showing genuine concern, we can identify patterns that lead to attrition and implement changes that improve workplace culture and reduce future turnover."
  },
  exit_feedback: {
    id: "exit_feedback",
    title: "Constructive Exit Feedback",
    useCase: "exits" as UseCase,
    wordCount: 62,
    text: "Exit interviews provide a unique opportunity to receive honest feedback about the organization. Employees leaving often share insights they may have hesitated to express during their tenure. Creating a safe, non-judgmental environment encourages open dialogue and helps the company understand what improvements can be made in management practices, career growth opportunities, and workplace policies."
  },
  
  // New Hire Engagement Passages
  nhe_onboarding: {
    id: "nhe_onboarding",
    title: "New Employee Onboarding Experience",
    useCase: "nhe" as UseCase,
    wordCount: 64,
    text: "The first few weeks of a new employee's journey are crucial for long-term engagement and success. A structured onboarding program that includes regular check-ins, clear communication of expectations, and mentorship support helps new hires feel welcomed and confident. Proactive engagement during this period significantly improves retention rates and accelerates productivity."
  },
  nhe_integration: {
    id: "nhe_integration",
    title: "Team Integration & Support",
    useCase: "nhe" as UseCase,
    wordCount: 61,
    text: "Successful integration of new employees requires attention to both professional and social aspects of their experience. Regular conversations to understand their challenges, addressing concerns promptly, and facilitating connections with team members create a supportive environment. Early identification of dissatisfaction allows for timely intervention and demonstrates organizational commitment to employee success."
  },
  
  // Continuous Engagement Passages
  ce_satisfaction: {
    id: "ce_satisfaction",
    title: "Employee Satisfaction & Engagement",
    useCase: "ce" as UseCase,
    wordCount: 66,
    text: "Continuous employee engagement is the foundation of a thriving workplace. Regular touchpoints allow organizations to gauge satisfaction levels, understand evolving needs, and address concerns before they escalate. By maintaining open communication channels and demonstrating genuine interest in employee wellbeing, companies build trust and loyalty that translates into higher productivity and reduced attrition."
  },
  ce_growth: {
    id: "ce_growth",
    title: "Career Development & Growth",
    useCase: "ce" as UseCase,
    wordCount: 63,
    text: "Employees who see a clear path for growth are more likely to remain engaged and committed. Regular conversations about career aspirations, skill development opportunities, and performance feedback help align individual goals with organizational objectives. Proactive engagement in career planning demonstrates investment in employee success and strengthens the employer-employee relationship."
  }
};

// Call scenario levels - HR focused for Acengage
export const CALL_SCENARIOS = {
  // Exit Interview Scenarios
  exit_reluctant: {
    id: "exit_reluctant",
    level: "Moderate",
    title: "Reluctant Exit - Retention Opportunity",
    useCase: "exits" as UseCase,
    wordCount: 120,
    description: "Employee has resigned but shows signs of hesitation, potential retention opportunity"
  },
  exit_frustrated: {
    id: "exit_frustrated",
    level: "Experienced",
    title: "Frustrated Exit - Negative Experience",
    useCase: "exits" as UseCase,
    wordCount: 145,
    description: "Employee leaving due to negative experiences, needs empathetic handling"
  },
  exit_opportunity: {
    id: "exit_opportunity",
    level: "Beginner",
    title: "Opportunity-Driven Exit",
    useCase: "exits" as UseCase,
    wordCount: 100,
    description: "Employee leaving for better opportunity, standard exit interview"
  },
  
  // NHE Scenarios
  nhe_struggling: {
    id: "nhe_struggling",
    level: "Moderate",
    title: "Struggling New Hire",
    useCase: "nhe" as UseCase,
    wordCount: 125,
    description: "New employee facing integration challenges, needs support"
  },
  nhe_disengaged: {
    id: "nhe_disengaged",
    level: "Experienced",
    title: "Disengaged New Hire - Early Warning",
    useCase: "nhe" as UseCase,
    wordCount: 140,
    description: "New employee showing early signs of dissatisfaction"
  },
  nhe_positive: {
    id: "nhe_positive",
    level: "Beginner",
    title: "Positive New Hire Check-in",
    useCase: "nhe" as UseCase,
    wordCount: 95,
    description: "Standard engagement call with new hire doing well"
  },
  
  // CE Scenarios
  ce_concerns: {
    id: "ce_concerns",
    level: "Moderate",
    title: "Employee with Concerns",
    useCase: "ce" as UseCase,
    wordCount: 130,
    description: "Long-term employee with workplace concerns needing resolution"
  },
  ce_attrition_risk: {
    id: "ce_attrition_risk",
    level: "Experienced",
    title: "High Attrition Risk",
    useCase: "ce" as UseCase,
    wordCount: 150,
    description: "Valuable employee showing signs of disengagement, flight risk"
  },
  ce_routine: {
    id: "ce_routine",
    level: "Beginner",
    title: "Routine Engagement Check-in",
    useCase: "ce" as UseCase,
    wordCount: 90,
    description: "Standard periodic engagement call with satisfied employee"
  }
};

// Personal questions - HR focused
export const PERSONAL_QUESTIONS = [
  {
    id: "intro",
    question: "Please introduce yourself in a few sentences.",
    purpose: "Baseline clarity",
    maxDuration: "30-45 secs"
  },
  {
    id: "motivation",
    question: "Why do you want to work in employee engagement and HR services?",
    purpose: "Intent & motivation"
  },
  {
    id: "challenge",
    question: "Describe a situation where you handled a difficult conversation with someone who was upset or frustrated.",
    purpose: "Stress-handling"
  },
  {
    id: "domain",
    question: "What do you understand about exit interviews and employee engagement processes?",
    purpose: "Domain knowledge"
  },
  {
    id: "targets",
    question: "How comfortable are you with making outbound calls and building rapport with strangers quickly?",
    purpose: "Role suitability"
  }
];

// Scoring parameters by use case
export const SCORING_PARAMETERS_BY_USE_CASE: Record<UseCase, Array<{ id: string; label: string; description: string }>> = {
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

// Default scoring parameters (used when no use case selected)
export const SCORING_PARAMETERS = SCORING_PARAMETERS_BY_USE_CASE.exits;

// Helper function to get scoring parameters by use case
export const getScoringParameters = (useCase: UseCase) => {
  return SCORING_PARAMETERS_BY_USE_CASE[useCase] || SCORING_PARAMETERS;
};

// Helper function to get reading passages by use case
export const getReadingPassages = (useCase: UseCase) => {
  return Object.values(READING_PASSAGES).filter(p => p.useCase === useCase);
};

// Helper function to get call scenarios by use case
export const getCallScenarios = (useCase: UseCase) => {
  return Object.values(CALL_SCENARIOS).filter(s => s.useCase === useCase);
};

// Evaluation phases
export type EvaluationPhase = 
  | "not_started"
  | "personal_questions"
  | "reading_task"
  | "call_scenario"
  | "empathy_scenario"
  | "closure_task"
  | "completed";

export type CandidateStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface CandidateInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  accessCode: string;
  status: CandidateStatus;
  createdAt: string;
  // Evaluation settings per candidate
  useCase: UseCase;
  selectedPassage: keyof typeof READING_PASSAGES | null;
  selectedScenario: keyof typeof CALL_SCENARIOS | null;
}

export interface ScoreEntry {
  parameterId: string;
  score: number; // 1-5
  notes: string;
  timestamp: string;
}

export interface PhaseResult {
  phase: EvaluationPhase;
  completedAt: string;
  duration: number; // seconds
  scores: ScoreEntry[];
  notes: string;
}

export interface TranscriptEntry {
  id: string;
  role: "candidate" | "agent" | "system";
  content: string;
  timestamp: string;
  phase: EvaluationPhase;
}

export interface CandidateEvaluation {
  candidateId: string;
  sessionId: string;
  currentPhase: EvaluationPhase;
  startTime: string | null;
  endTime: string | null;
  phaseResults: PhaseResult[];
  scores: ScoreEntry[];
  transcript: TranscriptEntry[];
  recordingUrl: string | null;
  recordingDuration: number;
}

export interface V2EvaluationState {
  // Batch/Session info
  batchId: string;
  batchName: string;
  createdAt: string;
  
  // Candidates list
  candidates: CandidateInfo[];
  
  // Active candidate (for evaluation view)
  activeCandidateId: string | null;
  
  // Evaluations map (candidateId -> evaluation data)
  evaluations: Record<string, CandidateEvaluation>;
  
  // Connection status
  isConnected: boolean;
  isRecording: boolean;
}

// Generate a unique 4-digit access code
const generateAccessCode = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

const generateBatchId = () => `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
const generateCandidateId = () => `CAND-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
const generateSessionId = () => `ACEE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface V2EvaluationContextType {
  state: V2EvaluationState;
  
  // Batch management
  setBatchName: (name: string) => void;
  
  // Candidate management
  addCandidate: (candidate: Omit<CandidateInfo, "id" | "accessCode" | "status" | "createdAt">) => string;
  addMultipleCandidates: (candidates: Array<{ name: string; email?: string; phone?: string }>) => string[];
  updateCandidate: (id: string, updates: Partial<CandidateInfo>) => void;
  removeCandidate: (id: string) => void;
  getCandidateByAccessCode: (code: string) => CandidateInfo | null;
  regenerateAccessCode: (candidateId: string) => string;
  
  // Active candidate
  setActiveCandidate: (candidateId: string | null) => void;
  getActiveCandidate: () => CandidateInfo | null;
  getActiveEvaluation: () => CandidateEvaluation | null;
  
  // Evaluation management
  startEvaluation: (candidateId: string) => void;
  endEvaluation: (candidateId: string) => void;
  setCurrentPhase: (candidateId: string, phase: EvaluationPhase) => void;
  
  // Scoring
  addScore: (candidateId: string, score: ScoreEntry) => void;
  updateScore: (candidateId: string, parameterId: string, score: number, notes?: string) => void;
  
  // Transcript
  addTranscriptEntry: (candidateId: string, entry: Omit<TranscriptEntry, "id" | "timestamp">) => void;
  
  // Recording
  setRecordingUrl: (candidateId: string, url: string) => void;
  setRecordingDuration: (candidateId: string, duration: number) => void;
  
  // Connection
  setIsConnected: (connected: boolean) => void;
  setIsRecording: (recording: boolean) => void;
  
  // Export
  exportEvaluation: (candidateId: string) => object;
  exportAllEvaluations: () => object;
  getOverallScore: (candidateId: string) => number;
  
  // Reset
  resetBatch: () => void;
}

// Helper to format date consistently (avoids hydration mismatch between server/client locales)
const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const createInitialState = (): V2EvaluationState => ({
  batchId: generateBatchId(),
  batchName: `Evaluation Batch - ${formatDate(new Date())}`,
  createdAt: new Date().toISOString(),
  candidates: [],
  activeCandidateId: null,
  evaluations: {},
  isConnected: false,
  isRecording: false,
});

const V2EvaluationContext = createContext<V2EvaluationContextType | undefined>(undefined);

// Local storage key
const STORAGE_KEY = "acengage_evaluation_v2";

export const V2EvaluationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<V2EvaluationState>(createInitialState);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setState(parsed);
        } catch (e) {
          console.error("Failed to load saved state:", e);
        }
      }
    }
  }, []);

  // Save to localStorage on state change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const setBatchName = useCallback((name: string) => {
    setState(prev => ({ ...prev, batchName: name }));
  }, []);

  const addCandidate = useCallback((candidate: Omit<CandidateInfo, "id" | "accessCode" | "status" | "createdAt">): string => {
    const id = generateCandidateId();
    const useCase = candidate.useCase || "exits";
    const defaultPassages = getReadingPassages(useCase);
    const defaultScenarios = getCallScenarios(useCase);
    
    const newCandidate: CandidateInfo = {
      ...candidate,
      id,
      accessCode: generateAccessCode(),
      status: "pending",
      createdAt: new Date().toISOString(),
      useCase,
      selectedPassage: candidate.selectedPassage || (defaultPassages[0]?.id as keyof typeof READING_PASSAGES) || null,
      selectedScenario: candidate.selectedScenario || (defaultScenarios[0]?.id as keyof typeof CALL_SCENARIOS) || null,
    };
    
    setState(prev => ({
      ...prev,
      candidates: [...prev.candidates, newCandidate],
    }));
    
    return id;
  }, []);

  const addMultipleCandidates = useCallback((candidates: Array<{ name: string; email?: string; phone?: string; useCase?: UseCase }>): string[] => {
    const newCandidates: CandidateInfo[] = candidates.map(c => {
      const useCase = c.useCase || "exits";
      const defaultPassages = getReadingPassages(useCase);
      const defaultScenarios = getCallScenarios(useCase);
      
      return {
        id: generateCandidateId(),
        name: c.name,
        email: c.email || "",
        phone: c.phone || "",
        accessCode: generateAccessCode(),
        status: "pending" as CandidateStatus,
        createdAt: new Date().toISOString(),
        useCase,
        selectedPassage: (defaultPassages[0]?.id as keyof typeof READING_PASSAGES) || null,
        selectedScenario: (defaultScenarios[0]?.id as keyof typeof CALL_SCENARIOS) || null,
      };
    });
    
    setState(prev => ({
      ...prev,
      candidates: [...prev.candidates, ...newCandidates],
    }));
    
    return newCandidates.map(c => c.id);
  }, []);

  const updateCandidate = useCallback((id: string, updates: Partial<CandidateInfo>) => {
    setState(prev => ({
      ...prev,
      candidates: prev.candidates.map(c => 
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  }, []);

  const removeCandidate = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      candidates: prev.candidates.filter(c => c.id !== id),
      evaluations: Object.fromEntries(
        Object.entries(prev.evaluations).filter(([key]) => key !== id)
      ),
    }));
  }, []);

  const getCandidateByAccessCode = useCallback((code: string): CandidateInfo | null => {
    return state.candidates.find(c => c.accessCode === code) || null;
  }, [state.candidates]);

  const regenerateAccessCode = useCallback((candidateId: string): string => {
    const newCode = generateAccessCode();
    setState(prev => ({
      ...prev,
      candidates: prev.candidates.map(c =>
        c.id === candidateId ? { ...c, accessCode: newCode } : c
      ),
    }));
    return newCode;
  }, []);

  const setActiveCandidate = useCallback((candidateId: string | null) => {
    setState(prev => ({ ...prev, activeCandidateId: candidateId }));
  }, []);

  const getActiveCandidate = useCallback((): CandidateInfo | null => {
    if (!state.activeCandidateId) return null;
    return state.candidates.find(c => c.id === state.activeCandidateId) || null;
  }, [state.activeCandidateId, state.candidates]);

  const getActiveEvaluation = useCallback((): CandidateEvaluation | null => {
    if (!state.activeCandidateId) return null;
    return state.evaluations[state.activeCandidateId] || null;
  }, [state.activeCandidateId, state.evaluations]);

  const startEvaluation = useCallback((candidateId: string) => {
    const evaluation: CandidateEvaluation = {
      candidateId,
      sessionId: generateSessionId(),
      currentPhase: "personal_questions",
      startTime: new Date().toISOString(),
      endTime: null,
      phaseResults: [],
      scores: [],
      transcript: [],
      recordingUrl: null,
      recordingDuration: 0,
    };
    
    setState(prev => ({
      ...prev,
      evaluations: { ...prev.evaluations, [candidateId]: evaluation },
      candidates: prev.candidates.map(c =>
        c.id === candidateId ? { ...c, status: "in_progress" as CandidateStatus } : c
      ),
    }));
  }, []);

  const endEvaluation = useCallback((candidateId: string) => {
    setState(prev => ({
      ...prev,
      evaluations: {
        ...prev.evaluations,
        [candidateId]: {
          ...prev.evaluations[candidateId],
          endTime: new Date().toISOString(),
          currentPhase: "completed",
        },
      },
      candidates: prev.candidates.map(c =>
        c.id === candidateId ? { ...c, status: "completed" as CandidateStatus } : c
      ),
    }));
  }, []);

  const setCurrentPhase = useCallback((candidateId: string, phase: EvaluationPhase) => {
    setState(prev => ({
      ...prev,
      evaluations: {
        ...prev.evaluations,
        [candidateId]: {
          ...prev.evaluations[candidateId],
          currentPhase: phase,
        },
      },
    }));
  }, []);

  const addScore = useCallback((candidateId: string, score: ScoreEntry) => {
    setState(prev => {
      const evaluation = prev.evaluations[candidateId];
      if (!evaluation) return prev;
      
      return {
        ...prev,
        evaluations: {
          ...prev.evaluations,
          [candidateId]: {
            ...evaluation,
            scores: [...evaluation.scores.filter(s => s.parameterId !== score.parameterId), score],
          },
        },
      };
    });
  }, []);

  const updateScore = useCallback((candidateId: string, parameterId: string, score: number, notes?: string) => {
    setState(prev => {
      const evaluation = prev.evaluations[candidateId];
      if (!evaluation) return prev;
      
      return {
        ...prev,
        evaluations: {
          ...prev.evaluations,
          [candidateId]: {
            ...evaluation,
            scores: evaluation.scores.map(s =>
              s.parameterId === parameterId
                ? { ...s, score, notes: notes ?? s.notes, timestamp: new Date().toISOString() }
                : s
            ),
          },
        },
      };
    });
  }, []);

  const addTranscriptEntry = useCallback((candidateId: string, entry: Omit<TranscriptEntry, "id" | "timestamp">) => {
    const newEntry: TranscriptEntry = {
      ...entry,
      id: `tr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    
    setState(prev => {
      const evaluation = prev.evaluations[candidateId];
      if (!evaluation) return prev;
      
      return {
        ...prev,
        evaluations: {
          ...prev.evaluations,
          [candidateId]: {
            ...evaluation,
            transcript: [...evaluation.transcript, newEntry],
          },
        },
      };
    });
  }, []);

  const setRecordingUrl = useCallback((candidateId: string, url: string) => {
    setState(prev => {
      const evaluation = prev.evaluations[candidateId];
      if (!evaluation) return prev;
      
      return {
        ...prev,
        evaluations: {
          ...prev.evaluations,
          [candidateId]: { ...evaluation, recordingUrl: url },
        },
      };
    });
  }, []);

  const setRecordingDuration = useCallback((candidateId: string, duration: number) => {
    setState(prev => {
      const evaluation = prev.evaluations[candidateId];
      if (!evaluation) return prev;
      
      return {
        ...prev,
        evaluations: {
          ...prev.evaluations,
          [candidateId]: { ...evaluation, recordingDuration: duration },
        },
      };
    });
  }, []);

  const setIsConnected = useCallback((connected: boolean) => {
    setState(prev => ({ ...prev, isConnected: connected }));
  }, []);

  const setIsRecording = useCallback((recording: boolean) => {
    setState(prev => ({ ...prev, isRecording: recording }));
  }, []);

  const getOverallScore = useCallback((candidateId: string): number => {
    const evaluation = state.evaluations[candidateId];
    if (!evaluation || evaluation.scores.length === 0) return 0;
    const total = evaluation.scores.reduce((sum, s) => sum + s.score, 0);
    return Math.round((total / evaluation.scores.length) * 10) / 10;
  }, [state.evaluations]);

  const exportEvaluation = useCallback((candidateId: string) => {
    const candidate = state.candidates.find(c => c.id === candidateId);
    const evaluation = state.evaluations[candidateId];
    
    return {
      candidate,
      evaluation,
      overallScore: getOverallScore(candidateId),
      exportedAt: new Date().toISOString(),
    };
  }, [state.candidates, state.evaluations, getOverallScore]);

  const exportAllEvaluations = useCallback(() => {
    return {
      batchId: state.batchId,
      batchName: state.batchName,
      createdAt: state.createdAt,
      candidates: state.candidates.map(c => ({
        ...c,
        evaluation: state.evaluations[c.id],
        overallScore: getOverallScore(c.id),
      })),
      exportedAt: new Date().toISOString(),
    };
  }, [state, getOverallScore]);

  const resetBatch = useCallback(() => {
    setState(createInitialState());
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return (
    <V2EvaluationContext.Provider
      value={{
        state,
        setBatchName,
        addCandidate,
        addMultipleCandidates,
        updateCandidate,
        removeCandidate,
        getCandidateByAccessCode,
        regenerateAccessCode,
        setActiveCandidate,
        getActiveCandidate,
        getActiveEvaluation,
        startEvaluation,
        endEvaluation,
        setCurrentPhase,
        addScore,
        updateScore,
        addTranscriptEntry,
        setRecordingUrl,
        setRecordingDuration,
        setIsConnected,
        setIsRecording,
        exportEvaluation,
        exportAllEvaluations,
        getOverallScore,
        resetBatch,
      }}
    >
      {children}
    </V2EvaluationContext.Provider>
  );
};

export const useV2Evaluation = () => {
  const context = useContext(V2EvaluationContext);
  if (context === undefined) {
    throw new Error("useV2Evaluation must be used within a V2EvaluationProvider");
  }
  return context;
};
