"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";

// Use Case types for different call scenarios
export type UseCase = "pv_sales" | "ev_sales" | "service";

export const USE_CASE_LABELS: Record<UseCase, string> = {
  pv_sales: "PV Sales",
  ev_sales: "EV Sales",
  service: "Service Support",
};

// Reading passage options - now organized by use case
export const READING_PASSAGES = {
  // PV Sales Passages
  safety_adas: {
    id: "safety_adas",
    title: "Safety & ADAS Features",
    useCase: "pv_sales" as UseCase,
    wordCount: 63,
    text: "Safety has become a top priority in the Indian automobile market. Features like six airbags, advanced driver assistance systems, electronic stability control, and hill hold assist help drivers manage difficult road and traffic conditions. As customers compare multiple brands, explaining these safety features in simple, relatable terms plays an important role in building trust and supporting informed decision-making."
  },
  suv_performance: {
    id: "suv_performance",
    title: "SUV Performance & Capability",
    useCase: "pv_sales" as UseCase,
    wordCount: 65,
    text: "Indian customers increasingly prefer SUVs for their commanding road presence, spacious interiors, and superior ground clearance. Features like 4x4 capability, terrain response modes, and powerful diesel engines make them suitable for both city commutes and off-road adventures. Understanding these preferences helps in recommending the right variant that matches customer lifestyle and usage patterns."
  },
  // EV Sales Passages
  ev_fast_charging: {
    id: "ev_fast_charging",
    title: "EV Fast Charging",
    useCase: "ev_sales" as UseCase,
    wordCount: 58,
    text: "Electric vehicle customers in India look for fast-charging capability, practical daily range, and battery longevity. With growing public charging infrastructure, modern EVs offer quick charge options that significantly reduce waiting time. Communicating these benefits clearly helps customers understand the convenience of adopting an electric vehicle for long commutes and everyday usage."
  },
  ev_battery_tech: {
    id: "ev_battery_tech",
    title: "EV Battery Technology",
    useCase: "ev_sales" as UseCase,
    wordCount: 62,
    text: "Battery technology is the heart of every electric vehicle. Modern lithium-ion batteries offer excellent energy density, longer life cycles, and are backed by comprehensive warranties. Customers often have concerns about battery degradation and replacement costs. Addressing these concerns with accurate information about battery management systems and warranty coverage builds confidence in the EV purchase decision."
  },
  // Service Support Passages
  connected_car: {
    id: "connected_car",
    title: "Connected Car Technology",
    useCase: "service" as UseCase,
    wordCount: 61,
    text: "Connected car technology is becoming essential in India, with drivers expecting features like remote lock–unlock, live vehicle tracking, geo-fencing, emergency alerts, and over-the-air updates. These features not only enhance safety but also improve convenience. When speaking to customers, it is important to describe how these technologies add value to their daily driving experience."
  },
  service_packages: {
    id: "service_packages",
    title: "Service & Maintenance Packages",
    useCase: "service" as UseCase,
    wordCount: 64,
    text: "Regular maintenance is crucial for vehicle longevity and safety. Our service packages include periodic maintenance, roadside assistance, and extended warranty options. Customers benefit from transparent pricing, genuine parts, and certified technicians. When explaining service schedules, emphasize the importance of timely maintenance and how our packages provide peace of mind and cost savings over the vehicle ownership period."
  },
};

// Helper to get passages by use case
export const getReadingPassages = (useCase?: UseCase) => {
  if (!useCase) return Object.values(READING_PASSAGES);
  return Object.values(READING_PASSAGES).filter(p => p.useCase === useCase);
};

// Call scenario levels - organized by use case
export const CALL_SCENARIOS = {
  // PV Sales Scenarios
  pv_basic_inquiry: {
    id: "pv_basic_inquiry",
    level: "Beginner",
    title: "Basic Inquiry - Mahindra Bolero Neo",
    useCase: "pv_sales" as UseCase,
    wordCount: 109,
    description: "Customer inquires about basic price and features of Bolero Neo"
  },
  pv_comparison: {
    id: "pv_comparison",
    level: "Moderate",
    title: "Comparison Scenario - Mahindra XUV700",
    useCase: "pv_sales" as UseCase,
    wordCount: 142,
    description: "Customer compares XUV700 with competitor, needs convincing"
  },
  pv_negotiation: {
    id: "pv_negotiation",
    level: "Experienced",
    title: "Price Negotiation - Mahindra Thar",
    useCase: "pv_sales" as UseCase,
    wordCount: 156,
    description: "Customer is interested but negotiating hard on price and accessories"
  },
  // EV Sales Scenarios
  ev_curious: {
    id: "ev_curious",
    level: "Beginner",
    title: "First-time EV Inquiry - XUV400",
    useCase: "ev_sales" as UseCase,
    wordCount: 120,
    description: "Customer new to EVs, curious about basics of XUV400"
  },
  ev_range_anxiety: {
    id: "ev_range_anxiety",
    level: "Moderate",
    title: "Range Anxiety - XUV400 EV",
    useCase: "ev_sales" as UseCase,
    wordCount: 145,
    description: "Customer concerned about EV range and charging infrastructure"
  },
  ev_frustrated: {
    id: "ev_frustrated",
    level: "Experienced",
    title: "Tough EV Scenario - XUV400 EV",
    useCase: "ev_sales" as UseCase,
    wordCount: 167,
    description: "Frustrated customer with EV concerns about charging and range"
  },
  // Service Support Scenarios
  service_booking: {
    id: "service_booking",
    level: "Beginner",
    title: "Service Appointment Booking",
    useCase: "service" as UseCase,
    wordCount: 95,
    description: "Customer wants to book a routine service appointment"
  },
  service_complaint: {
    id: "service_complaint",
    level: "Moderate",
    title: "Service Quality Complaint",
    useCase: "service" as UseCase,
    wordCount: 138,
    description: "Customer unhappy with previous service experience"
  },
  service_escalation: {
    id: "service_escalation",
    level: "Experienced",
    title: "Warranty Dispute Escalation",
    useCase: "service" as UseCase,
    wordCount: 175,
    description: "Angry customer escalating a warranty claim rejection"
  },
  // Legacy scenarios for backward compatibility
  beginner: {
    id: "beginner",
    level: "Beginner",
    title: "Basic Inquiry - Mahindra Bolero Neo (PV)",
    useCase: "pv_sales" as UseCase,
    wordCount: 109,
    description: "Customer inquires about basic price and features of Bolero Neo"
  },
  moderate: {
    id: "moderate",
    level: "Moderate",
    title: "Comparison Scenario - Mahindra XUV700 (PV)",
    useCase: "pv_sales" as UseCase,
    wordCount: 142,
    description: "Customer compares XUV700 with competitor, needs convincing"
  },
  experienced: {
    id: "experienced",
    level: "Experienced",
    title: "Tough EV Scenario - Mahindra XUV400 EV",
    useCase: "ev_sales" as UseCase,
    wordCount: 167,
    description: "Frustrated customer with EV concerns about charging and range"
  },
};

// Helper to get scenarios by use case
export const getCallScenarios = (useCase?: UseCase) => {
  if (!useCase) return Object.values(CALL_SCENARIOS);
  return Object.values(CALL_SCENARIOS).filter(s => s.useCase === useCase);
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

// Scoring parameters - generic list (backward compatible)
export const SCORING_PARAMETERS = [
  { id: "clarity_pace", label: "Clarity & Pace", description: "Smooth flow, no hesitation" },
  { id: "product_knowledge", label: "Product Knowledge", description: "PV & EV awareness" },
  { id: "empathy", label: "Empathy", description: "Quality of reassurance lines" },
  { id: "customer_understanding", label: "Customer Understanding", description: "Ability to probe needs" },
  { id: "handling_pressure", label: "Handling Pressure", description: "Composure in tough scenarios" },
  { id: "confidence", label: "Confidence", description: "Tone stability" },
  { id: "process_accuracy", label: "Process Accuracy", description: "Lead capturing, summarizing, CTA" },
  { id: "closure_quality", label: "Closure Quality", description: "Professional, crisp, complete" },
  // Typing test parameters
  { id: "typing_speed", label: "Typing Speed", description: "Words per minute (WPM)" },
  { id: "typing_accuracy", label: "Typing Accuracy", description: "Character accuracy percentage" },
  { id: "summary_quality", label: "Summary Quality", description: "Completeness and clarity of call summary" },
];

// Scoring parameters by use case
export const SCORING_PARAMETERS_BY_USE_CASE: Record<UseCase, Array<{ id: string; label: string; description: string }>> = {
  pv_sales: [
    { id: "clarity_pace", label: "Clarity & Pace", description: "Smooth flow, no hesitation" },
    { id: "product_knowledge", label: "Product Knowledge", description: "PV model & feature awareness" },
    { id: "customer_understanding", label: "Customer Understanding", description: "Ability to probe needs and preferences" },
    { id: "comparison_handling", label: "Comparison Handling", description: "Addressing competitor comparisons effectively" },
    { id: "objection_handling", label: "Objection Handling", description: "Responding to price/feature objections" },
    { id: "confidence", label: "Confidence", description: "Tone stability and conviction" },
    { id: "lead_capture", label: "Lead Capture", description: "Collecting customer details and follow-up" },
    { id: "closure_quality", label: "Closure Quality", description: "Professional, crisp, complete call ending" }
  ],
  ev_sales: [
    { id: "clarity_pace", label: "Clarity & Pace", description: "Smooth flow, no hesitation" },
    { id: "ev_knowledge", label: "EV Knowledge", description: "Battery, charging, range awareness" },
    { id: "customer_understanding", label: "Customer Understanding", description: "Understanding EV adoption concerns" },
    { id: "myth_busting", label: "Myth Busting", description: "Addressing EV misconceptions effectively" },
    { id: "range_confidence", label: "Range Confidence", description: "Explaining range and charging solutions" },
    { id: "empathy", label: "Empathy", description: "Understanding customer anxiety about EV transition" },
    { id: "tco_explanation", label: "TCO Explanation", description: "Explaining total cost of ownership benefits" },
    { id: "closure_quality", label: "Closure Quality", description: "Professional, crisp, complete call ending" }
  ],
  service: [
    { id: "clarity_pace", label: "Clarity & Pace", description: "Smooth flow, no hesitation" },
    { id: "service_knowledge", label: "Service Knowledge", description: "Service packages and warranty awareness" },
    { id: "empathy", label: "Empathy", description: "Understanding customer frustration" },
    { id: "problem_resolution", label: "Problem Resolution", description: "Offering effective solutions" },
    { id: "handling_pressure", label: "Handling Pressure", description: "Composure with angry customers" },
    { id: "process_accuracy", label: "Process Accuracy", description: "Booking, escalation, follow-up process" },
    { id: "de_escalation", label: "De-escalation", description: "Calming upset customers effectively" },
    { id: "closure_quality", label: "Closure Quality", description: "Professional, crisp, complete call ending" }
  ],
};

// Helper to get scoring parameters by use case
export const getScoringParameters = (useCase?: UseCase) => {
  if (!useCase) return SCORING_PARAMETERS;
  return SCORING_PARAMETERS_BY_USE_CASE[useCase] || SCORING_PARAMETERS;
};

// Typing dictation prompts for practice (used in Continuous Learner portal)
export const TYPING_DICTATION_PROMPTS = {
  pv_sales: [
    {
      id: "pv_intro",
      title: "Vehicle Introduction",
      text: "Thank you for your interest in Mahindra vehicles. I would be happy to assist you with information about our latest models. Could you please share what type of vehicle you are looking for and your primary requirements?",
      wordCount: 40,
    },
    {
      id: "pv_features",
      title: "Feature Explanation",
      text: "The Mahindra XUV700 comes with advanced safety features including six airbags, electronic stability control, and ADAS level two autonomous driving capabilities. The vehicle also offers a panoramic sunroof, ventilated seats, and a twelve-speaker sound system.",
      wordCount: 45,
    },
  ],
  ev_sales: [
    {
      id: "ev_range",
      title: "EV Range Explanation",
      text: "The XUV400 electric vehicle offers a certified range of four hundred fifty-six kilometers on a single charge. With our fast charging network, you can charge from zero to eighty percent in just fifty minutes. Home charging overnight will give you a full charge by morning.",
      wordCount: 50,
    },
    {
      id: "ev_benefits",
      title: "EV Benefits",
      text: "Switching to an electric vehicle provides significant cost savings on fuel and maintenance. The total cost of ownership over five years is approximately thirty percent lower compared to equivalent petrol vehicles. Additionally, you contribute to reducing carbon emissions.",
      wordCount: 45,
    },
  ],
  service: [
    {
      id: "service_booking",
      title: "Service Appointment",
      text: "I have scheduled your vehicle service appointment for tomorrow at ten AM. Please bring your vehicle registration documents and the service booklet. The estimated service time is three hours. We will provide you with a complimentary vehicle wash after the service.",
      wordCount: 45,
    },
    {
      id: "service_complaint",
      title: "Complaint Acknowledgment",
      text: "I sincerely apologize for the inconvenience you experienced with our service center. I have noted your concerns regarding the delayed delivery and the additional charges. I will escalate this matter to our service manager and ensure you receive a callback within twenty-four hours.",
      wordCount: 50,
    },
  ],
};

// Helper to get typing dictation prompts by use case
export const getTypingDictationPrompts = (useCase?: UseCase) => {
  if (!useCase) return Object.values(TYPING_DICTATION_PROMPTS).flat();
  return TYPING_DICTATION_PROMPTS[useCase] || [];
};

// Evaluation phases
export type EvaluationPhase = 
  | "not_started"
  | "personal_questions"
  | "reading_task"
  | "call_scenario"
  | "empathy_scenario"
  | "typing_test"
  | "closure_task"
  | "completed";

// Typing Test Configuration
export const TYPING_TEST_CONFIG = {
  minWords: 50,
  maxWords: 200,
  timeLimit: 300, // 5 minutes in seconds
  instructions: "Please type a summary of the call you just completed. Include key points discussed, customer concerns, and any follow-up actions needed.",
};

// Typing Test Prompts by Use Case
export const TYPING_TEST_PROMPTS: Record<UseCase, { title: string; prompt: string; hints: string[] }> = {
  pv_sales: {
    title: "Call Summary - Sales Inquiry",
    prompt: "Summarize the customer interaction you just completed. Include: customer name (if provided), vehicle of interest, key features discussed, objections raised, and next steps agreed upon.",
    hints: [
      "Customer's primary interest and budget range",
      "Features that resonated with the customer",
      "Concerns or objections raised",
      "Competitor comparisons mentioned",
      "Follow-up action items",
    ],
  },
  ev_sales: {
    title: "Call Summary - EV Inquiry",
    prompt: "Summarize the EV inquiry call. Include: customer's EV awareness level, range/charging concerns addressed, benefits explained, and conversion potential assessment.",
    hints: [
      "Customer's current vehicle and EV familiarity",
      "Range anxiety concerns and how addressed",
      "Charging infrastructure questions",
      "TCO benefits explained",
      "Test drive or follow-up scheduled",
    ],
  },
  service: {
    title: "Call Summary - Service Request",
    prompt: "Document the service call details. Include: issue reported, troubleshooting steps taken, resolution provided or escalation needed, and customer satisfaction level.",
    hints: [
      "Nature of complaint or request",
      "Vehicle details and service history",
      "Resolution provided or escalation path",
      "Customer sentiment at call end",
      "Any compensation or goodwill offered",
    ],
  },
};

// Typing Test Scoring Parameters
export const TYPING_TEST_SCORING = [
  { id: "content_accuracy", label: "Content Accuracy", description: "Key points from the call captured correctly", weight: 0.25 },
  { id: "completeness", label: "Completeness", description: "All required information included", weight: 0.25 },
  { id: "clarity", label: "Clarity & Structure", description: "Well-organized and easy to understand", weight: 0.20 },
  { id: "grammar", label: "Grammar & Spelling", description: "Proper grammar and minimal typos", weight: 0.15 },
  { id: "professionalism", label: "Professional Tone", description: "Appropriate business language used", weight: 0.15 },
];

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

export interface TypingTestResult {
  summary: string;
  wordCount: number;
  timeSpent: number; // in seconds
  startedAt: string;
  completedAt: string;
  scores?: Array<{ parameterId: string; score: number; feedback?: string }>;
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
  typingTestResult?: TypingTestResult;
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
    const useCase = candidate.useCase || "pv_sales";
    const newCandidate: CandidateInfo = {
      ...candidate,
      id,
      accessCode: generateAccessCode(),
      status: "pending",
      createdAt: new Date().toISOString(),
      useCase,
      selectedPassage: candidate.selectedPassage || "safety_adas",
      selectedScenario: candidate.selectedScenario || "beginner",
    };
    
    setState(prev => ({
      ...prev,
      candidates: [...prev.candidates, newCandidate],
    }));
    
    return id;
  }, []);

  const addMultipleCandidates = useCallback((candidates: Array<{ name: string; email?: string; phone?: string; useCase?: UseCase }>): string[] => {
    const newCandidates: CandidateInfo[] = candidates.map(c => ({
      id: generateCandidateId(),
      name: c.name,
      email: c.email || "",
      phone: c.phone || "",
      accessCode: generateAccessCode(),
      status: "pending" as CandidateStatus,
      createdAt: new Date().toISOString(),
      useCase: c.useCase || "pv_sales" as UseCase,
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
