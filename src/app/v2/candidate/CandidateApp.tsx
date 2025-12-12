"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { READING_PASSAGES, CALL_SCENARIOS, PERSONAL_QUESTIONS } from "../contexts/V2EvaluationContext";
import type { EvaluationPhase } from "../contexts/V2EvaluationContext";

// Import contexts and hooks from v1 for voice agent integration
import { useTranscript, TranscriptProvider } from "@/app/contexts/TranscriptContext";
import { useEvent, EventProvider } from "@/app/contexts/EventContext";
import { useVoiceAnalysis, VoiceAnalysisProvider } from "@/app/contexts/VoiceAnalysisContext";
import { useVoiceQualityAnalysis } from "@/app/hooks/useVoiceAnalysis";
import { useRealtimeSession } from "@/app/hooks/useRealtimeSession";
import { useHandleSessionHistory } from "@/app/hooks/useHandleSessionHistory";
import useAudioDownload from "@/app/hooks/useAudioDownload";
import { mahindraEvaluationAgent } from "../agents/mahindraEvaluationAgent";
import VoiceVisualizer from "@/app/components/VoiceVisualizer";

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

// Wrapper component that provides contexts
export default function CandidateApp() {
  return (
    <TranscriptProvider>
      <EventProvider>
        <VoiceAnalysisProvider>
          <CandidateAppContent />
        </VoiceAnalysisProvider>
      </EventProvider>
    </TranscriptProvider>
  );
}

function CandidateAppContent() {
  // State
  const [accessCode, setAccessCode] = useState("");
  const [accessError, setAccessError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authenticatedCandidate, setAuthenticatedCandidate] = useState<CandidateInfo | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<EvaluationPhase>("not_started");
  const [sessionStatus, setSessionStatus] = useState<"DISCONNECTED" | "CONNECTING" | "CONNECTED">("DISCONNECTED");

  // Contexts
  const { transcriptItems, addTranscriptBreadcrumb } = useTranscript();
  const { logClientEvent } = useEvent();
  const { startAnalysis, stopAnalysis, isAnalysisActive } = useVoiceAnalysis();
  
  // Voice quality analysis hook for getting metrics
  const voiceAnalysisRef = useRef<ReturnType<typeof useVoiceQualityAnalysis> | null>(null);

  // Audio element ref for SDK
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const sdkAudioElement = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const el = document.createElement('audio');
    el.autoplay = true;
    el.style.display = 'none';
    document.body.appendChild(el);
    return el;
  }, []);

  useEffect(() => {
    if (sdkAudioElement && !audioElementRef.current) {
      audioElementRef.current = sdkAudioElement;
    }
  }, [sdkAudioElement]);

  // Recording hook
  const { startRecording, stopRecording, getMicStream } = useAudioDownload();

  // Realtime session
  const {
    connect,
    disconnect,
    sendEvent,
    mute,
    interrupt,
  } = useRealtimeSession({
    onConnectionChange: (status) => {
      setSessionStatus(status);
    },
    onAgentHandoff: (agentName: string) => {
      console.log("[v2] Agent handoff to:", agentName);
    },
  });

  // Session history handler
  useHandleSessionHistory();

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      if (sessionStatus === "CONNECTED" && authenticatedCandidate) {
        setSessionDuration((prev) => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionStatus, authenticatedCandidate]);

  // Callbacks for agent tools
  const handleStartVoiceAnalysis = useCallback(() => {
    console.log("[v2] Agent triggered: Starting voice analysis for reading task");
    startAnalysis();
    setCurrentPhase("reading_task");
  }, [startAnalysis]);

  const handleStopVoiceAnalysis = useCallback(() => {
    console.log("[v2] Agent triggered: Stopping voice analysis");
    stopAnalysis();
  }, [stopAnalysis]);

  const handleSetCurrentPhase = useCallback((phase: EvaluationPhase) => {
    console.log("[v2] Agent triggered: Setting phase to", phase);
    setCurrentPhase(phase);
  }, []);

  // Function to get voice analysis report - will be populated by VoiceVisualizer
  const getVoiceAnalysisReportRef = useRef<(() => any) | null>(null);

  // Start recording when connected
  useEffect(() => {
    if (sessionStatus === "CONNECTED" && audioElementRef.current?.srcObject) {
      const remoteStream = audioElementRef.current.srcObject as MediaStream;
      startRecording(remoteStream);
    }
    return () => {
      if (sessionStatus === "DISCONNECTED") {
        stopRecording();
      }
    };
  }, [sessionStatus]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Access code validation
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
    } catch (error) {
      console.error("Error validating access code:", error);
      setAccessError("Failed to validate access code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch ephemeral key for realtime connection
  const fetchEphemeralKey = async (): Promise<string | null> => {
    try {
      const response = await fetch("/api/session");
      const data = await response.json();
      if (!data.client_secret?.value) {
        console.error("No ephemeral key provided");
        return null;
      }
      return data.client_secret.value;
    } catch (err) {
      console.error("Error fetching ephemeral key:", err);
      return null;
    }
  };

  // Start evaluation - connect to VoiceAgent
  const handleStartEvaluation = async () => {
    if (!authenticatedCandidate) return;

    // Create evaluation in database
    try {
      const evalResponse = await fetch("/api/v2/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: authenticatedCandidate.id }),
      });

      if (evalResponse.ok) {
        const evaluation = await evalResponse.json();
        setAuthenticatedCandidate({
          ...authenticatedCandidate,
          evaluation,
        });
      }
    } catch (error) {
      console.error("Error creating evaluation:", error);
    }

    // Connect to VoiceAgent
    setSessionStatus("CONNECTING");
    try {
      const ephemeralKey = await fetchEphemeralKey();
      if (!ephemeralKey) {
        setSessionStatus("DISCONNECTED");
        return;
      }

      // Get selected passage and scenario
      const passage = authenticatedCandidate.selectedPassage
        ? READING_PASSAGES[authenticatedCandidate.selectedPassage as keyof typeof READING_PASSAGES]
        : READING_PASSAGES.safety_adas;
      const scenario = authenticatedCandidate.selectedScenario
        ? CALL_SCENARIOS[authenticatedCandidate.selectedScenario as keyof typeof CALL_SCENARIOS]
        : CALL_SCENARIOS.beginner;

      await connect({
        getEphemeralKey: async () => ephemeralKey,
        initialAgents: [mahindraEvaluationAgent],
        audioElement: sdkAudioElement,
        extraContext: {
          addTranscriptBreadcrumb,
          candidateName: authenticatedCandidate.name,
          candidateEmail: authenticatedCandidate.email,
          selectedPassage: authenticatedCandidate.selectedPassage,
          selectedScenario: authenticatedCandidate.selectedScenario,
          passageText: passage?.text,
          scenarioLevel: scenario?.level,
          customParagraph: passage?.text,
          // Voice analysis controls for agent tools
          startVoiceAnalysis: handleStartVoiceAnalysis,
          stopVoiceAnalysis: handleStopVoiceAnalysis,
          setCurrentPhase: handleSetCurrentPhase,
          getVoiceAnalysisReport: () => {
            if (getVoiceAnalysisReportRef.current) {
              return getVoiceAnalysisReportRef.current();
            }
            return null;
          },
        },
      });

      setCurrentPhase("personal_questions");
    } catch (err) {
      console.error("Error connecting to VoiceAgent:", err);
      setSessionStatus("DISCONNECTED");
    }
  };

  // Disconnect and complete evaluation
  const handleDisconnect = async () => {
    disconnect();
    stopAnalysis();
    setCurrentPhase("completed");

    // Update candidate status to completed in database
    if (authenticatedCandidate) {
      try {
        await fetch(`/api/v2/candidates/${authenticatedCandidate.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "completed" }),
        });

        // Also end the evaluation session if exists
        if (authenticatedCandidate.evaluation?.id) {
          await fetch(`/api/v2/evaluations/${authenticatedCandidate.evaluation.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              currentPhase: "completed",
              endTime: new Date().toISOString(),
            }),
          });
        }
      } catch (error) {
        console.error("Error updating evaluation status:", error);
      }
    }
  };

  // If not authenticated, show access code screen
  if (!authenticatedCandidate) {
    return (
      <AccessCodeScreen
        accessCode={accessCode}
        setAccessCode={setAccessCode}
        error={accessError}
        isLoading={isLoading}
        onSubmit={handleAccessCodeSubmit}
      />
    );
  }

  // Main evaluation interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b border-slate-700">
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
            <div className="h-6 w-px bg-slate-600" />
            <span className="text-emerald-400 font-medium text-sm">Candidate Evaluation</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-sm text-slate-400">
              <span className="font-medium text-white">{authenticatedCandidate.name}</span>
            </div>

            {sessionStatus === "CONNECTED" && (
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-mono">{formatDuration(sessionDuration)}</span>
              </div>
            )}

            {/* Connection status */}
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  sessionStatus === "CONNECTED"
                    ? "bg-emerald-500 animate-pulse"
                    : sessionStatus === "CONNECTING"
                    ? "bg-amber-500 animate-pulse"
                    : "bg-slate-500"
                }`}
              />
              <span className="text-xs text-slate-400">
                {sessionStatus === "CONNECTED" ? "Live" : sessionStatus === "CONNECTING" ? "Connecting..." : "Offline"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-20 pb-8 min-h-screen">
        {sessionStatus === "DISCONNECTED" && currentPhase === "not_started" ? (
          <WelcomeScreen
            candidate={authenticatedCandidate}
            onStart={handleStartEvaluation}
          />
        ) : currentPhase === "completed" ? (
          <CompletedScreen candidateName={authenticatedCandidate.name} />
        ) : (
          <EvaluationInterface
            candidate={authenticatedCandidate}
            sessionStatus={sessionStatus}
            currentPhase={currentPhase}
            transcriptItems={transcriptItems}
            getMicStream={getMicStream}
            onDisconnect={handleDisconnect}
            onReportReady={(getReport) => {
              getVoiceAnalysisReportRef.current = getReport;
            }}
          />
        )}
      </main>
    </div>
  );
}

// Access Code Screen
function AccessCodeScreen({
  accessCode,
  setAccessCode,
  error,
  isLoading,
  onSubmit,
}: {
  accessCode: string;
  setAccessCode: (code: string) => void;
  error: string;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/v2" className="inline-block mb-6">
            <Image src="/pragyaa-logo.svg" alt="Pragyaa" width={100} height={35} className="opacity-90" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Candidate Portal</h1>
          <p className="text-slate-500">Enter your access code to begin your evaluation</p>
        </div>

        <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Access Code</label>
            <input
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              placeholder="Enter 4-digit code"
              maxLength={4}
              className="w-full px-4 py-4 text-center text-3xl font-mono tracking-widest text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              autoFocus
              disabled={isLoading}
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
            disabled={accessCode.length !== 4 || isLoading}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/20"
          >
            {isLoading ? "Validating..." : "Continue"}
          </button>
        </form>

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

// Welcome Screen
function WelcomeScreen({ candidate, onStart }: { candidate: CandidateInfo; onStart: () => void }) {
  const passage = candidate.selectedPassage
    ? READING_PASSAGES[candidate.selectedPassage as keyof typeof READING_PASSAGES]
    : null;
  const scenario = candidate.selectedScenario
    ? CALL_SCENARIOS[candidate.selectedScenario as keyof typeof CALL_SCENARIOS]
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-6 shadow-lg shadow-emerald-500/20">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-4">Welcome, {candidate.name}!</h1>
        <p className="text-slate-500 text-lg">Voice-Based Call Center Evaluation</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          What to Expect
        </h2>
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-3 bg-slate-50 rounded-lg">
            <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">1</span>
            <div>
              <p className="font-medium text-slate-800">Introduction</p>
              <p className="text-sm text-slate-500">AI Eva will introduce herself and explain the process</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-3 bg-slate-50 rounded-lg">
            <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">2</span>
            <div>
              <p className="font-medium text-slate-800">Personal Questions</p>
              <p className="text-sm text-slate-500">Answer 3-5 questions about yourself and motivation</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-3 bg-slate-50 rounded-lg">
            <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">3</span>
            <div>
              <p className="font-medium text-slate-800">Voice Quality Assessment</p>
              <p className="text-sm text-slate-500">Read a passage aloud to assess clarity, pace, and tone</p>
            </div>
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-400">Estimated duration: 10-15 minutes</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
        <p className="text-amber-700 text-sm flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>
            <strong>Important:</strong> Please use a quiet environment with good microphone access. Speak clearly and naturally.
          </span>
        </p>
      </div>

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

// Evaluation Interface - Shows transcript and voice visualizer
function EvaluationInterface({
  candidate,
  sessionStatus,
  currentPhase,
  transcriptItems,
  getMicStream,
  onDisconnect,
  onReportReady,
}: {
  candidate: CandidateInfo;
  sessionStatus: string;
  currentPhase: EvaluationPhase;
  transcriptItems: any[];
  getMicStream: () => MediaStream | null;
  onDisconnect: () => void;
  onReportReady?: (getReport: () => any) => void;
}) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-12 gap-6">
        {/* Left side - Transcript */}
        <div className="col-span-7">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden h-[calc(100vh-180px)]">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-medium text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Live Conversation
              </h3>
              <span className="text-xs text-slate-500">AI Eva</span>
            </div>

            <div className="p-4 h-[calc(100%-60px)] overflow-y-auto space-y-4">
              {transcriptItems.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-500">
                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto mb-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    <p>Waiting for conversation to begin...</p>
                    <p className="text-sm mt-2">Eva will introduce herself shortly</p>
                  </div>
                </div>
              ) : (
                transcriptItems.map((item, index) => (
                  <div
                    key={item.itemId || index}
                    className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        item.role === "user"
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-700 text-slate-100"
                      }`}
                    >
                      <p className="text-sm font-medium mb-1 opacity-70">
                        {item.role === "user" ? "You" : "Eva"}
                      </p>
                      <p>{item.displayText || item.title || "..."}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right side - Phase Progress and Controls */}
        <div className="col-span-5 space-y-6">
          {/* Hidden Voice Visualizer for data collection only */}
          <div className="hidden">
            <VoiceVisualizer 
              isRecording={sessionStatus === "CONNECTED"} 
              sessionStatus={sessionStatus} 
              getMicStream={getMicStream}
              onReportReady={onReportReady}
            />
          </div>

          {/* Evaluation Progress */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl p-6">
            <h3 className="font-medium text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Evaluation Progress
            </h3>
            <PhaseProgressIndicator currentPhase={currentPhase} />
          </div>

          {/* Current Phase Info */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl p-6">
            <h3 className="font-medium text-white mb-4">Current Task</h3>
            <div className="flex items-center gap-4">
              <span className="text-4xl">
                {currentPhase === "personal_questions" && "💬"}
                {currentPhase === "reading_task" && "📖"}
                {currentPhase === "call_scenario" && "📞"}
                {currentPhase === "empathy_scenario" && "🤝"}
                {currentPhase === "closure_task" && "✅"}
                {currentPhase === "not_started" && "⏳"}
                {currentPhase === "completed" && "🎉"}
              </span>
              <div>
                <p className="font-medium text-white text-lg capitalize">
                  {currentPhase === "not_started" ? "Getting Ready" : 
                   currentPhase === "completed" ? "Completed" :
                   currentPhase.replace(/_/g, " ")}
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  {currentPhase === "personal_questions" && "Answer questions about yourself and experience"}
                  {currentPhase === "reading_task" && "Read the paragraph aloud for voice analysis"}
                  {currentPhase === "call_scenario" && "Handle a simulated customer call"}
                  {currentPhase === "empathy_scenario" && "Handle an upset customer scenario"}
                  {currentPhase === "closure_task" && "Deliver a professional call closing"}
                  {currentPhase === "not_started" && "Waiting to begin..."}
                  {currentPhase === "completed" && "Your evaluation is complete!"}
                </p>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-4">
            <p className="text-sm text-slate-400 flex items-start gap-2">
              <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                <strong className="text-amber-400">Tip:</strong> Speak clearly and naturally. Take your time to think before responding.
              </span>
            </p>
          </div>

          {/* End Session Button */}
          <button
            onClick={onDisconnect}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            End Evaluation
          </button>
        </div>
      </div>
    </div>
  );
}

// Phase Progress Indicator Component
function PhaseProgressIndicator({ currentPhase }: { currentPhase: EvaluationPhase }) {
  const phases = [
    { id: "personal_questions", label: "Introduction", icon: "💬", description: "Personal questions" },
    { id: "reading_task", label: "Reading", icon: "📖", description: "Paragraph reading" },
    { id: "call_scenario", label: "Call Scenario", icon: "📞", description: "Customer simulation" },
    { id: "empathy_scenario", label: "Empathy", icon: "🤝", description: "Difficult customer" },
    { id: "closure_task", label: "Closure", icon: "✅", description: "Professional closing" },
  ];

  const phaseOrder = ["not_started", "personal_questions", "reading_task", "call_scenario", "empathy_scenario", "closure_task", "completed"];
  const currentIndex = phaseOrder.indexOf(currentPhase);

  const getPhaseStatus = (phaseId: string): "completed" | "current" | "pending" => {
    const phaseIndex = phaseOrder.indexOf(phaseId);
    if (phaseIndex < currentIndex) return "completed";
    if (phaseIndex === currentIndex) return "current";
    return "pending";
  };

  return (
    <div className="space-y-3">
      {phases.map((phase, index) => {
        const status = getPhaseStatus(phase.id);
        
        return (
          <div key={phase.id} className="flex items-center gap-3">
            {/* Status indicator */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              status === "completed" ? "bg-emerald-500 text-white" :
              status === "current" ? "bg-violet-500 text-white ring-4 ring-violet-500/30" :
              "bg-slate-700 text-slate-400"
            }`}>
              {status === "completed" ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-sm">{index + 1}</span>
              )}
            </div>
            
            {/* Phase info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">{phase.icon}</span>
                <span className={`font-medium ${
                  status === "completed" ? "text-emerald-400" :
                  status === "current" ? "text-white" :
                  "text-slate-500"
                }`}>
                  {phase.label}
                </span>
                {status === "current" && (
                  <span className="px-2 py-0.5 bg-violet-500/20 text-violet-300 text-xs rounded-full">
                    In Progress
                  </span>
                )}
              </div>
              <p className={`text-xs mt-0.5 ${
                status === "current" ? "text-slate-400" : "text-slate-500"
              }`}>
                {phase.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Completed Screen
function CompletedScreen({ candidateName }: { candidateName: string }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 mb-8 shadow-lg shadow-emerald-500/20">
        <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-3xl font-bold text-slate-800 mb-4">Evaluation Complete!</h1>
      <p className="text-slate-500 text-lg mb-8">
        Thank you, {candidateName}! Your evaluation has been recorded. Our team will review your assessment and contact you regarding next steps.
      </p>

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
