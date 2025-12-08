"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";

// Reading passage options
export const READING_PASSAGES = {
  safety_adas: {
    id: "safety_adas",
    title: "Safety & ADAS",
    wordCount: 63,
    text: "Safety has become a top priority in the Indian automobile market. Features like six airbags, advanced driver assistance systems, electronic stability control, and hill hold assist help drivers manage difficult road and traffic conditions. As customers compare multiple brands, explaining these safety features in simple, relatable terms plays an important role in building trust and supporting informed decision-making."
  },
  ev_fast_charging: {
    id: "ev_fast_charging",
    title: "EV Fast Charging",
    wordCount: 58,
    text: "Electric vehicle customers in India look for fast-charging capability, practical daily range, and battery longevity. With growing public charging infrastructure, modern EVs offer quick charge options that significantly reduce waiting time. Communicating these benefits clearly helps customers understand the convenience of adopting an electric vehicle for long commutes and everyday usage."
  },
  connected_car: {
    id: "connected_car",
    title: "Connected Car Technology",
    wordCount: 61,
    text: "Connected car technology is becoming essential in India, with drivers expecting features like remote lock–unlock, live vehicle tracking, geo-fencing, emergency alerts, and over-the-air updates. These features not only enhance safety but also improve convenience. When speaking to customers, it is important to describe how these technologies add value to their daily driving experience."
  }
};

// Call scenario levels
export const CALL_SCENARIOS = {
  beginner: {
    id: "beginner",
    level: "Beginner",
    title: "Basic Inquiry - Mahindra Bolero Neo (PV)",
    wordCount: 109,
    description: "Customer inquires about basic price and features of Bolero Neo"
  },
  moderate: {
    id: "moderate",
    level: "Moderate",
    title: "Comparison Scenario - Mahindra XUV700 (PV)",
    wordCount: 142,
    description: "Customer compares XUV700 with competitor, needs convincing"
  },
  experienced: {
    id: "experienced",
    level: "Experienced",
    title: "Tough EV Scenario - Mahindra XUV400 EV",
    wordCount: 167,
    description: "Frustrated customer with EV concerns about charging and range"
  }
};

// Personal questions
export const PERSONAL_QUESTIONS = [
  {
    id: "intro",
    question: "Please introduce yourself in a few sentences.",
    purpose: "Baseline clarity",
    maxDuration: "30-45 secs"
  },
  {
    id: "motivation",
    question: "Why do you want to work in the automotive customer experience domain?",
    purpose: "Intent & motivation"
  },
  {
    id: "challenge",
    question: "Describe a situation where you handled a challenging customer.",
    purpose: "Stress-handling"
  },
  {
    id: "domain",
    question: "What do you know about Mahindra & Mahindra's PV or EV lineup?",
    purpose: "Domain knowledge"
  },
  {
    id: "targets",
    question: "How comfortable are you with achieving lead generation targets and consistent calling?",
    purpose: "Role suitability"
  }
];

// Scoring parameters
export const SCORING_PARAMETERS = [
  { id: "clarity_pace", label: "Clarity & Pace", description: "Smooth flow, no hesitation" },
  { id: "product_knowledge", label: "Product Knowledge", description: "PV & EV awareness" },
  { id: "empathy", label: "Empathy", description: "Quality of reassurance lines" },
  { id: "customer_understanding", label: "Customer Understanding", description: "Ability to probe needs" },
  { id: "handling_pressure", label: "Handling Pressure", description: "Composure in tough scenarios" },
  { id: "confidence", label: "Confidence", description: "Tone stability" },
  { id: "process_accuracy", label: "Process Accuracy", description: "Lead capturing, summarizing, CTA" },
  { id: "closure_quality", label: "Closure Quality", description: "Professional, crisp, complete" }
];

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
const generateSessionId = () => `MHCE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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
const STORAGE_KEY = "mahindra_hce_evaluation_v2";

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
    const newCandidate: CandidateInfo = {
      ...candidate,
      id,
      accessCode: generateAccessCode(),
      status: "pending",
      createdAt: new Date().toISOString(),
      selectedPassage: candidate.selectedPassage || "safety_adas",
      selectedScenario: candidate.selectedScenario || "beginner",
    };
    
    setState(prev => ({
      ...prev,
      candidates: [...prev.candidates, newCandidate],
    }));
    
    return id;
  }, []);

  const addMultipleCandidates = useCallback((candidates: Array<{ name: string; email?: string; phone?: string }>): string[] => {
    const newCandidates: CandidateInfo[] = candidates.map(c => ({
      id: generateCandidateId(),
      name: c.name,
      email: c.email || "",
      phone: c.phone || "",
      accessCode: generateAccessCode(),
      status: "pending" as CandidateStatus,
      createdAt: new Date().toISOString(),
      selectedPassage: "safety_adas" as keyof typeof READING_PASSAGES,
      selectedScenario: "beginner" as keyof typeof CALL_SCENARIOS,
    }));
    
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
