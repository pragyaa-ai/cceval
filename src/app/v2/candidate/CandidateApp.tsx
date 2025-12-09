"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { READING_PASSAGES, CALL_SCENARIOS, PERSONAL_QUESTIONS } from "../contexts/V2EvaluationContext";
import type { EvaluationPhase } from "../contexts/V2EvaluationContext";

// Candidate info from database
interface CandidateInfo {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  accessCode: string;
  status: string;
  selectedPassage: string;
  selectedScenario: string;
  evaluation?: {
    id: string;
    sessionId: string;
    currentPhase: string;
    startTime: string | null;
  } | null;
}

// Phase display configuration
const PHASE_CONFIG: Record<EvaluationPhase, { title: string; description: string; icon: string }> = {
  not_started: {
    title: "Welcome",
    description: "Get ready for your evaluation",
    icon: "👋"
  },
  personal_questions: {
    title: "Personal Questions",
    description: "Tell us about yourself",
    icon: "💬"
  },
  reading_task: {
    title: "Reading Task",
    description: "Read the automobile feature passage",
    icon: "📖"
  },
  call_scenario: {
    title: "Call Scenario",
    description: "Handle a customer interaction",
    icon: "📞"
  },
  empathy_scenario: {
    title: "Empathy Challenge",
    description: "Handle a difficult situation",
    icon: "🤝"
  },
  closure_task: {
    title: "Closure Statement",
    description: "Conclude the conversation professionally",
    icon: "✅"
  },
  completed: {
    title: "Complete",
    description: "Evaluation finished",
    icon: "🎉"
  }
};

export default function CandidateApp() {
  const [accessCode, setAccessCode] = useState("");
  const [accessError, setAccessError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authenticatedCandidate, setAuthenticatedCandidate] = useState<CandidateInfo | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<EvaluationPhase>("not_started");

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      if (authenticatedCandidate?.evaluation?.startTime) {
        const start = new Date(authenticatedCandidate.evaluation.startTime).getTime();
        const now = Date.now();
        setSessionDuration(Math.floor((now - start) / 1000));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [authenticatedCandidate?.evaluation?.startTime]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAccessCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccessError("");
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/v2/candidates?accessCode=${accessCode.trim()}`);
      const data = await response.json();
      
      if (!response.ok) {
        setAccessError(data.error || "Invalid access code. Please check and try again.");
        return;
      }
      
      if (data.status === "completed") {
        setAccessError("This evaluation has already been completed.");
        return;
      }
      
      setAuthenticatedCandidate(data);
      if (data.evaluation) {
        setCurrentPhase(data.evaluation.currentPhase as EvaluationPhase);
      }
    } catch (error) {
      console.error("Error validating access code:", error);
      setAccessError("Failed to validate access code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartEvaluation = async () => {
    if (!authenticatedCandidate) return;
    
    try {
      const response = await fetch("/api/v2/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: authenticatedCandidate.id }),
      });
      
      if (response.ok) {
        const evaluation = await response.json();
        setAuthenticatedCandidate({
          ...authenticatedCandidate,
          evaluation,
        });
        setCurrentPhase("personal_questions");
        setIsConnected(true);
      }
    } catch (error) {
      console.error("Error starting evaluation:", error);
    }
  };

  // Demo: Auto-advance phases for testing (remove in production)
  const advancePhase = async () => {
    if (!authenticatedCandidate?.evaluation) return;
    const phases: EvaluationPhase[] = ["personal_questions", "reading_task", "call_scenario", "empathy_scenario", "closure_task", "completed"];
    const currentIndex = phases.indexOf(currentPhase);
    if (currentIndex < phases.length - 1) {
      const nextPhase = phases[currentIndex + 1];
      try {
        await fetch(`/api/v2/evaluations/${authenticatedCandidate.evaluation.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPhase: nextPhase }),
        });
        setCurrentPhase(nextPhase);
      } catch (error) {
        console.error("Error advancing phase:", error);
      }
    }
  };

  const phaseIndex = ["not_started", "personal_questions", "reading_task", "call_scenario", "empathy_scenario", "closure_task", "completed"].indexOf(currentPhase);
  const totalPhases = 6;
  const progress = currentPhase === "completed" ? 100 : Math.round((phaseIndex / totalPhases) * 100);

  // If not authenticated, show access code screen
  if (!authenticatedCandidate) {
    return <AccessCodeScreen 
      accessCode={accessCode}
      setAccessCode={setAccessCode}
      error={accessError}
      onSubmit={handleAccessCodeSubmit}
    />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/v2" className="flex items-center gap-2">
              <Image
                src="/pragyaa-logo.svg"
                alt="Pragyaa"
                width={80}
                height={30}
                className="opacity-90"
              />
            </Link>
            <div className="h-6 w-px bg-slate-300" />
            <span className="text-emerald-600 font-medium text-sm">Candidate Portal</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-sm text-slate-600">
              Welcome, <span className="font-medium text-slate-800">{authenticatedCandidate.name}</span>
            </div>
            
            {activeEvaluation?.startTime && (
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-mono">{formatDuration(sessionDuration)}</span>
              </div>
            )}
            
            {/* Connection status */}
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
              <span className="text-xs text-slate-500">
                {isConnected ? "Connected" : "Offline"}
              </span>
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        {currentPhase !== "not_started" && (
          <div className="h-1 bg-slate-200">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="pt-20 pb-32 min-h-screen">
        {currentPhase === "not_started" ? (
          <WelcomeScreen 
            candidate={authenticatedCandidate}
            onStart={handleStartEvaluation}
          />
        ) : currentPhase === "completed" ? (
          <CompletedScreen candidateName={authenticatedCandidate.name} />
        ) : (
          <EvaluationScreen 
            phase={currentPhase}
            candidate={authenticatedCandidate}
            onAdvancePhase={advancePhase}
            isConnected={isConnected}
          />
        )}
      </main>

      {/* Footer with phase indicator */}
      {currentPhase !== "not_started" && currentPhase !== "completed" && (
        <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 shadow-lg">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <PhaseIndicator currentPhase={currentPhase} />
          </div>
        </footer>
      )}
    </div>
  );
}

// Access Code Screen
function AccessCodeScreen({ 
  accessCode, 
  setAccessCode, 
  error, 
  onSubmit 
}: { 
  accessCode: string;
  setAccessCode: (code: string) => void;
  error: string;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/v2" className="inline-block mb-6">
            <Image
              src="/pragyaa-logo.svg"
              alt="Pragyaa"
              width={100}
              height={35}
              className="opacity-90"
            />
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            Candidate Portal
          </h1>
          <p className="text-slate-500">
            Enter your access code to begin your evaluation
          </p>
        </div>

        {/* Access Code Form */}
        <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Access Code
            </label>
            <input
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              placeholder="Enter 4-digit code"
              maxLength={4}
              className="w-full px-4 py-4 text-center text-3xl font-mono tracking-widest text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={accessCode.length !== 4}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/20"
          >
            Continue
          </button>
        </form>

        {/* Help text */}
        <p className="text-center text-sm text-slate-400 mt-6">
          Don't have an access code? Contact your evaluator.
        </p>

        <div className="text-center mt-4">
          <Link href="/v2" className="text-sm text-slate-500 hover:text-slate-700 underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

// Welcome Screen Component
function WelcomeScreen({ 
  candidate,
  onStart 
}: { 
  candidate: CandidateInfo;
  onStart: () => void;
}) {
  const passage = candidate.selectedPassage ? READING_PASSAGES[candidate.selectedPassage] : null;
  const scenario = candidate.selectedScenario ? CALL_SCENARIOS[candidate.selectedScenario] : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Welcome header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-6 shadow-lg shadow-emerald-500/20">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-4">
          Welcome, {candidate.name}!
        </h1>
        <p className="text-slate-500 text-lg">
          Mahindra Call Center Communication Assessment
        </p>
      </div>

      {/* Your Assessment Info */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Your Assessment Configuration
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-slate-50 rounded-lg p-3">
            <span className="text-slate-500">Reading Topic</span>
            <p className="font-medium text-slate-800">{passage?.title || "Safety & ADAS"}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <span className="text-slate-500">Scenario Level</span>
            <p className="font-medium text-slate-800">{scenario?.level || "Beginner"}</p>
          </div>
        </div>
      </div>

      {/* Evaluation overview */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">What to Expect</h3>
        <div className="space-y-3">
          {[
            { icon: "💬", title: "Personal Questions", desc: "Brief introduction and motivation" },
            { icon: "📖", title: "Reading Task", desc: "Read an automobile feature passage" },
            { icon: "📞", title: "Call Scenarios", desc: "Handle customer interactions" },
            { icon: "🤝", title: "Empathy Challenge", desc: "Manage a difficult situation" },
            { icon: "✅", title: "Closure", desc: "Professional call closure" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 text-slate-600">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <span className="font-medium text-slate-800">{item.title}</span>
                <span className="text-slate-500 text-sm ml-2">— {item.desc}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-slate-400">
          Estimated duration: 10-15 minutes
        </p>
      </div>

      {/* Start button */}
      <button
        onClick={onStart}
        className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
      >
        <span>Begin Evaluation</span>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </button>
    </div>
  );
}

// Evaluation Screen - Main interaction area
function EvaluationScreen({ 
  phase, 
  candidate,
  onAdvancePhase,
  isConnected
}: { 
  phase: EvaluationPhase;
  candidate: CandidateInfo;
  onAdvancePhase: () => void;
  isConnected: boolean;
}) {
  const config = PHASE_CONFIG[phase];
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Phase header */}
      <div className="text-center mb-8">
        <span className="text-5xl mb-4 block">{config.icon}</span>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">{config.title}</h1>
        <p className="text-slate-500">{config.description}</p>
      </div>

      {/* Main interaction card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
        {/* Voice visualization area */}
        <div className="p-8 border-b border-slate-100 bg-slate-50">
          <VoiceVisualization isActive={isConnected} />
        </div>

        {/* Instructions panel */}
        <div className="p-6">
          <PhaseInstructions phase={phase} candidate={candidate} />
        </div>
      </div>

      {/* Navigation hint */}
      <div className="mt-6 text-center">
        <p className="text-slate-400 text-sm">
          The AI agent will guide you through each step. Just speak naturally.
        </p>
        
        {/* Demo button - remove in production */}
        <button 
          onClick={onAdvancePhase}
          className="mt-4 px-4 py-2 bg-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-300 transition-colors"
        >
          [Demo] Next Phase →
        </button>
      </div>
    </div>
  );
}

// Voice visualization component
function VoiceVisualization({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex flex-col items-center">
      {/* Animated rings */}
      <div className="relative w-32 h-32 flex items-center justify-center">
        {isActive && (
          <>
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" style={{ animationDuration: "2s" }} />
            <div className="absolute inset-4 rounded-full bg-emerald-500/30 animate-ping" style={{ animationDuration: "1.5s", animationDelay: "0.2s" }} />
          </>
        )}
        <div className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
          isActive ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30" : "bg-slate-200"
        }`}>
          <svg className={`w-10 h-10 ${isActive ? "text-white" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <p className={`font-medium ${isActive ? "text-emerald-600" : "text-slate-400"}`}>
          {isActive ? "Listening..." : "Waiting to connect"}
        </p>
        <p className="text-slate-400 text-sm mt-1">
          {isActive ? "Speak clearly into your microphone" : "Click Begin to start"}
        </p>
      </div>
    </div>
  );
}

// Phase-specific instructions
function PhaseInstructions({ phase, candidate }: { phase: EvaluationPhase; candidate: CandidateInfo }) {
  const passage = candidate.selectedPassage ? READING_PASSAGES[candidate.selectedPassage] : READING_PASSAGES.safety_adas;
  const scenario = candidate.selectedScenario ? CALL_SCENARIOS[candidate.selectedScenario] : CALL_SCENARIOS.beginner;

  const instructions: Record<EvaluationPhase, React.ReactNode> = {
    not_started: null,
    personal_questions: (
      <div className="space-y-4">
        <h3 className="text-slate-800 font-medium">Personal Interview Questions</h3>
        <p className="text-slate-500 text-sm">
          The AI interviewer will ask you questions to assess your communication skills, 
          motivation, and automotive awareness. Answer each question naturally and confidently.
        </p>
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <p className="text-emerald-600 text-sm font-medium mb-2">Sample Questions:</p>
          <ul className="space-y-2 text-slate-600 text-sm">
            {PERSONAL_QUESTIONS.slice(0, 3).map((q, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-emerald-500">•</span>
                {q.question}
              </li>
            ))}
          </ul>
        </div>
      </div>
    ),
    reading_task: (
      <div className="space-y-4">
        <h3 className="text-slate-800 font-medium">Reading Task: {passage.title}</h3>
        <p className="text-slate-500 text-sm">
          You will read a passage about {passage.title.toLowerCase()}. The agent will 
          demonstrate how to read it, then you'll read it aloud for evaluation.
        </p>
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <p className="text-emerald-600 text-sm font-medium mb-2">Your Passage ({passage.wordCount} words):</p>
          <p className="text-slate-600 text-sm italic">"{passage.text}"</p>
        </div>
      </div>
    ),
    call_scenario: (
      <div className="space-y-4">
        <h3 className="text-slate-800 font-medium">Call Scenario: {scenario.title}</h3>
        <p className="text-slate-500 text-sm">
          {scenario.description}. Handle the customer inquiry professionally and demonstrate your product knowledge.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-amber-700 text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <strong>Level:</strong> {scenario.level}
          </p>
        </div>
      </div>
    ),
    empathy_scenario: (
      <div className="space-y-4">
        <h3 className="text-slate-800 font-medium">Empathy & De-escalation Challenge</h3>
        <p className="text-slate-500 text-sm">
          Handle a frustrated customer dealing with a service bill issue. 
          Demonstrate empathy, active listening, and problem-solving skills.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-amber-700 text-sm">
            <strong>Tip:</strong> Stay calm, acknowledge the customer's feelings, and focus on finding a resolution.
          </p>
        </div>
      </div>
    ),
    closure_task: (
      <div className="space-y-4">
        <h3 className="text-slate-800 font-medium">Professional Closure</h3>
        <p className="text-slate-500 text-sm">
          Conclude the customer interaction with a professional closure statement. 
          Summarize the discussion, confirm next steps, and leave a positive impression.
        </p>
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-slate-500 text-sm italic">
          "Based on our discussion, you're interested in the right model with strong safety and technology features. 
          I have arranged a follow-up call/test drive and will share all details on message..."
        </div>
      </div>
    ),
    completed: null,
  };

  return instructions[phase];
}

// Phase indicator component
function PhaseIndicator({ currentPhase }: { currentPhase: EvaluationPhase }) {
  const phases: { key: EvaluationPhase; label: string }[] = [
    { key: "personal_questions", label: "Questions" },
    { key: "reading_task", label: "Reading" },
    { key: "call_scenario", label: "Scenario" },
    { key: "empathy_scenario", label: "Empathy" },
    { key: "closure_task", label: "Closure" },
  ];

  const currentIndex = phases.findIndex(p => p.key === currentPhase);

  return (
    <div className="flex items-center justify-center gap-2">
      {phases.map((phase, index) => {
        const isActive = phase.key === currentPhase;
        const isCompleted = index < currentIndex;
        
        return (
          <React.Fragment key={phase.key}>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
              isActive 
                ? "bg-emerald-100 text-emerald-700 border border-emerald-300" 
                : isCompleted
                ? "bg-slate-100 text-slate-500"
                : "text-slate-400"
            }`}>
              {isCompleted && (
                <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              {phase.label}
            </div>
            {index < phases.length - 1 && (
              <div className={`w-8 h-px ${index < currentIndex ? "bg-emerald-300" : "bg-slate-200"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Completed screen
function CompletedScreen({ candidateName }: { candidateName: string }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 mb-8 shadow-lg shadow-emerald-500/20">
        <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <h1 className="text-3xl font-bold text-slate-800 mb-4">
        Evaluation Complete!
      </h1>
      <p className="text-slate-500 text-lg mb-8">
        Thank you, {candidateName}! Your Mahindra Call Center evaluation is complete. 
        Our team will review your assessment and get back to you soon.
      </p>
      
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8 text-left">
        <h3 className="text-slate-800 font-medium mb-4">What's Next?</h3>
        <ul className="space-y-3 text-slate-600">
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm shrink-0">1</span>
            <span>Your evaluation recording is being processed</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm shrink-0">2</span>
            <span>Our team will review your performance scores</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm shrink-0">3</span>
            <span>You'll receive feedback within 2-3 business days</span>
          </li>
        </ul>
      </div>
      
      <Link 
        href="/v2"
        className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        Return Home
      </Link>
    </div>
  );
}
