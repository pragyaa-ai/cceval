"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  READING_PASSAGES, 
  CALL_SCENARIOS, 
  PERSONAL_QUESTIONS,
  TYPING_TEST_CONFIG,
  TYPING_TEST_PROMPTS,
  TYPING_TEST_SCORING,
  UseCase,
} from "../contexts/V2EvaluationContext";
import type { EvaluationPhase, TypingTestResult } from "../contexts/V2EvaluationContext";

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
  age: number | null;
  gender: string | null;
  nativeLanguage: string | null;
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

// Calibration guidance type from evaluator feedback
interface CalibrationGuidance {
  adjustment: number;
  guidance: string;
  totalFeedbacks: number;
  avgAdjustment: number;
  lastAnalyzedAt: string | null;
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
  const [calibrationGuidance, setCalibrationGuidance] = useState<Record<string, CalibrationGuidance>>({});
  
  // Typing Test State
  const [typingTestSummary, setTypingTestSummary] = useState("");
  const [typingTestStartTime, setTypingTestStartTime] = useState<Date | null>(null);
  const [typingTestTimeRemaining, setTypingTestTimeRemaining] = useState(TYPING_TEST_CONFIG.timeLimit);
  const [isTypingTestSubmitting, setIsTypingTestSubmitting] = useState(false);
  
  // Refs for typing test to avoid stale closures in timer
  const typingTestSummaryRef = useRef("");
  const typingTestStartTimeRef = useRef<Date | null>(null);
  const isTypingTestSubmittingRef = useRef(false);

  // Contexts
  const { transcriptItems, addTranscriptBreadcrumb } = useTranscript();
  const { logClientEvent } = useEvent();
  const { startAnalysis, stopAnalysis } = useVoiceAnalysis();
  
  // Voice quality analysis hook for getting metrics
  const voiceAnalysisRef = useRef<ReturnType<typeof useVoiceQualityAnalysis> | null>(null);
  
  // Ref to store evaluation ID to avoid stale closures
  const evaluationIdRef = useRef<string | undefined>(undefined);

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
  const { startRecording, stopRecording, getMicStream, getRecordingBlob, clearRecording } = useAudioDownload();

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

  // Sync transcript to database for evaluator view
  // Track synced content by itemId -> content to detect updates
  const syncedContentRef = useRef<Map<string, string>>(new Map());
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Debounce sync to allow messages to complete (wait 1.5s after last change)
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    syncTimeoutRef.current = setTimeout(async () => {
      const evalId = evaluationIdRef.current;
      if (!evalId) {
        return;
      }
      
      // Filter for meaningful completed messages to sync to database
      const itemsToSync = transcriptItems.filter(item => {
        // Must be user or assistant message
        if (item.role !== "user" && item.role !== "assistant") return false;
        // Must have actual content
        if (!item.title || item.title.trim() === "") return false;
        // Skip transcription placeholders
        if (item.title.includes("[Transcribing")) return false;
        
        // Minimum length requirements for complete messages:
        // - User messages: at least 10 chars (short responses like "Yes" are ok if intentional)
        // - Assistant messages: at least 40 chars (ensures full sentence, not partial stream)
        const minLength = item.role === "user" ? 10 : 40;
        if (item.title.length < minLength) return false;
        
        // Check if already synced with same content (avoid duplicates)
        const previousContent = syncedContentRef.current.get(item.itemId);
        if (previousContent === item.title) return false;
        
        // If content changed significantly (grew by 20+ chars), allow re-sync (update)
        if (previousContent && item.title.length < previousContent.length + 20) return false;
        
        return true;
      });
      
      for (const item of itemsToSync) {
        try {
          const previousContent = syncedContentRef.current.get(item.itemId);
          const method = previousContent ? "PUT" : "POST"; // Update if exists, create if new
          
          await fetch(`/api/v2/evaluations/${evalId}/transcript`, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              itemId: item.itemId, // Include for upsert
              role: item.role,
              content: item.title,
              phase: currentPhase,
            }),
          });
          syncedContentRef.current.set(item.itemId, item.title || "");
        } catch (error) {
          console.error("Failed to sync transcript item:", error);
        }
      }
    }, 1500); // Wait 1.5 seconds after last update before syncing
    
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [transcriptItems, currentPhase]);

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
    console.log("[v2] 🎤🎤🎤 handleStartVoiceAnalysis CALLED - Starting voice analysis for reading task");
    console.log("[v2] Current evaluation ID from ref:", evaluationIdRef.current);
    console.log("[v2] startAnalysis function type:", typeof startAnalysis);
    console.log("[v2] About to call startAnalysis() from VoiceAnalysisContext...");
    try {
      startAnalysis();
      console.log("[v2] ✅ startAnalysis() called successfully - Voice analysis context should now be activated");
    } catch (error) {
      console.error("[v2] ❌ Error calling startAnalysis():", error);
    }
  }, [startAnalysis]); // Only depend on startAnalysis

  const handleStopVoiceAnalysis = useCallback(() => {
    console.log("[v2] 🛑 handleStopVoiceAnalysis called - Stopping voice analysis");
    stopAnalysis();
    console.log("[v2] ✅ Voice analysis context deactivated");
  }, [stopAnalysis]);

  const handleSetCurrentPhase = useCallback(async (phase: EvaluationPhase) => {
    console.log("[v2] 🔄 handleSetCurrentPhase called with phase:", phase);
    console.log("[v2] Evaluation ID from ref:", evaluationIdRef.current);
    
    // Update local state first
    setCurrentPhase(phase);
    console.log("[v2] ✅ Local state updated to:", phase);
    
    // Persist phase to database for evaluator view
    const evalId = evaluationIdRef.current;
    if (!evalId) {
      console.error("[v2] ❌ Cannot sync phase - no evaluation ID in ref");
      return;
    }
    
    try {
      const response = await fetch(`/api/v2/evaluations/${evalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPhase: phase }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      const updated = await response.json();
      console.log("[v2] ✅ Phase synced to database successfully:", phase);
      console.log("[v2] Updated evaluation:", updated);
    } catch (error) {
      console.error("[v2] ❌ Failed to sync phase to database:", error);
    }
  }, []); // No dependencies - use ref

  // Function to get voice analysis report - will be populated by VoiceVisualizer
  const getVoiceAnalysisReportRef = useRef<(() => any) | null>(null);

  // Save voice analysis report to database
  const handleSaveVoiceAnalysis = useCallback(async (report: any) => {
    console.log("[v2] 💾 handleSaveVoiceAnalysis called");
    console.log("[v2] Evaluation ID from ref:", evaluationIdRef.current);
    
    const evalId = evaluationIdRef.current;
    if (!evalId) {
      console.error("[v2] ❌ Cannot save voice analysis - no evaluation ID in ref!");
      return;
    }
    
    if (!report) {
      console.error("[v2] ❌ Cannot save voice analysis - report is null!");
      return;
    }
    
    console.log("[v2] 📤 Sending voice analysis report to database...");
    console.log("[v2] 📊 Report summary:", {
      overallScore: report.overallScore,
      sampleCount: report.sampleCount,
      duration: report.duration,
      clarityScore: report.clarityScore,
      volumeScore: report.volumeScore,
      toneScore: report.toneScore,
      paceScore: report.paceScore,
      strengthsCount: report.strengths?.length || 0,
      recommendationsCount: report.recommendations?.length || 0
    });
    
    try {
      // Create a clean report object with only serializable data
      const cleanReport = {
        overallScore: report.overallScore || 0,
        clarityScore: report.clarityScore || 0,
        volumeScore: report.volumeScore || 0,
        toneScore: report.toneScore || 0,
        paceScore: report.paceScore || 0,
        avgPitch: report.avgPitch || "0",
        avgVolume: report.avgVolume || "0",
        avgClarity: report.avgClarity || "0",
        avgPace: report.avgPace || "0",
        sampleCount: report.sampleCount || 0,
        duration: report.duration || "0",
        assessment: report.assessment || "",
        strengths: Array.isArray(report.strengths) ? report.strengths : [],
        recommendations: Array.isArray(report.recommendations) ? report.recommendations : [],
      };
      
      // Stringify once and verify it's valid
      const jsonString = JSON.stringify(cleanReport);
      console.log("[v2] 📝 Serialized voice analysis data, length:", jsonString.length);
      
      const response = await fetch(`/api/v2/evaluations/${evalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceAnalysisData: jsonString }),
      });
      
      if (!response.ok) {
        let errorDetails;
        try {
          errorDetails = await response.json();
        } catch {
          errorDetails = await response.text();
        }
        console.error("[v2] ❌ Server error response:", response.status, errorDetails);
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorDetails)}`);
      }
      
      const updated = await response.json();
      console.log("[v2] ✅ Voice analysis saved to database successfully!");
      console.log("[v2] 📊 Saved evaluation has voiceAnalysisData:", !!updated.voiceAnalysisData);
    } catch (error) {
      console.error("[v2] ❌ Failed to save voice analysis:", error);
      // Don't throw - let the agent continue even if save fails
    }
  }, []); // No dependencies - use ref

  // Score parameter IDs that should be saved to the database
  const SCORE_PARAMETERS = [
    "clarity_pace", "product_knowledge", "empathy", "customer_understanding",
    "handling_pressure", "confidence", "process_accuracy", "closure_quality"
  ];

  // Capture evaluation data point (scores) and save to database
  const handleCaptureDataPoint = useCallback(async (dataType: string, value: string, _status: string, reason?: string) => {
    const evalId = evaluationIdRef.current;
    
    if (!evalId) {
      console.error('[v2] ❌ Cannot save data point - no evaluation ID in ref');
      return;
    }
    
    // Check if this is a score parameter
    if (SCORE_PARAMETERS.includes(dataType)) {
      const numericScore = parseInt(value, 10);
      if (numericScore >= 1 && numericScore <= 5) {
        try {
          const response = await fetch(`/api/v2/evaluations/${evalId}/scores`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              parameterId: dataType,
              score: numericScore,
              notes: reason || undefined, // Include reason/notes with the score
            }),
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
          }
          
          // Score saved successfully
        } catch (error) {
          console.error(`[v2] ❌ Failed to save score ${dataType}:`, error);
        }
      } else {
        console.warn(`[v2] ⚠️ Invalid score value: ${value} (must be 1-5)`);
      }
    } else {
      console.log(`[v2] 📝 Data captured (not a score parameter): ${dataType} = ${value}`);
    }
  }, []); // No dependencies - use ref

  // Start recording when connected - poll for audio stream availability
  // This fixes a race condition where srcObject might not be set when sessionStatus changes
  const hasStartedRecordingRef = useRef(false);
  
  useEffect(() => {
    let checkInterval: NodeJS.Timeout | null = null;
    let timeout: NodeJS.Timeout | null = null;

    if (sessionStatus === "CONNECTED" && !hasStartedRecordingRef.current) {
      console.log('[v2] 🎙️ Session connected, waiting for audio stream...');
      
      // Poll for audio stream availability
      checkInterval = setInterval(() => {
        if (audioElementRef.current?.srcObject && !hasStartedRecordingRef.current) {
          const remoteStream = audioElementRef.current.srcObject as MediaStream;
          console.log('[v2] ✅ Audio stream ready, starting recording');
          startRecording(remoteStream);
          hasStartedRecordingRef.current = true;
          if (checkInterval) clearInterval(checkInterval);
          if (timeout) clearTimeout(timeout);
        }
      }, 100);

      // Stop polling after 15 seconds
      timeout = setTimeout(() => {
        if (checkInterval) clearInterval(checkInterval);
        if (!hasStartedRecordingRef.current) {
          console.error('[v2] ❌ Audio stream not available after 15 seconds');
        }
      }, 15000);
    }

    if (sessionStatus === "DISCONNECTED") {
      hasStartedRecordingRef.current = false;
      stopRecording();
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (timeout) clearTimeout(timeout);
    };
  }, [sessionStatus, startRecording, stopRecording]);

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

  // Fetch calibration guidance for AI scoring adjustments
  const fetchCalibrationGuidance = async (): Promise<Record<string, CalibrationGuidance>> => {
    try {
      const response = await fetch("/api/v2/calibration");
      if (response.ok) {
        const data = await response.json();
        console.log("[v2] 📊 Calibration guidance loaded:", Object.keys(data.calibrations).length, "parameters");
        return data.calibrations || {};
      }
    } catch (error) {
      console.error("[v2] ⚠️ Failed to fetch calibration guidance:", error);
    }
    return {};
  };

  // Start evaluation - connect to VoiceAgent
  const handleStartEvaluation = async () => {
    if (!authenticatedCandidate) return;

    // Fetch calibration guidance for AI scoring (based on evaluator feedback)
    const calibration = await fetchCalibrationGuidance();
    setCalibrationGuidance(calibration);

    // Create evaluation in database FIRST and get the evaluation object
    let evaluationId: string | undefined;
    try {
      console.log("[v2] 🔨 Creating evaluation for candidate:", authenticatedCandidate.id);
      const evalResponse = await fetch("/api/v2/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: authenticatedCandidate.id }),
      });

      if (evalResponse.ok) {
        const evaluation = await evalResponse.json();
        evaluationId = evaluation.id;

        // Store in ref for immediate access (no waiting for state update)
        evaluationIdRef.current = evaluationId;

        console.log("[v2] ✅ Evaluation created with ID:", evaluationId);
        console.log("[v2] ✅ Evaluation ID stored in ref for handlers");

        // Update state with evaluation
        const updatedCandidate = {
          ...authenticatedCandidate,
          evaluation,
        };
        setAuthenticatedCandidate(updatedCandidate);
      } else {
        console.error("[v2] ❌ Failed to create evaluation:", await evalResponse.text());
      }
    } catch (error) {
      console.error("[v2] ❌ Error creating evaluation:", error);
    }

    if (!evaluationId) {
      console.error("[v2] ❌ Cannot start evaluation - no evaluation ID created");
      return;
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

      console.log("[v2] 🚀 Connecting to agent with evaluation ID:", evaluationId);

      await connect({
        getEphemeralKey: async () => ephemeralKey,
        initialAgents: [mahindraEvaluationAgent],
        audioElement: sdkAudioElement,
        extraContext: {
          addTranscriptBreadcrumb,
          candidateName: authenticatedCandidate.name,
          candidateEmail: authenticatedCandidate.email,
          // Candidate demographics for voice quality calibration
          candidateAge: authenticatedCandidate.age,
          candidateGender: authenticatedCandidate.gender, // male, female, other - affects expected pitch range
          candidateNativeLanguage: authenticatedCandidate.nativeLanguage,
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
          saveVoiceAnalysis: handleSaveVoiceAnalysis,
          // Score capture for saving to database
          captureDataPoint: handleCaptureDataPoint,
          // Calibration guidance from evaluator feedback (for AI scoring adjustments)
          calibrationGuidance: calibration,
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
    
    // Stop the recording and wait for all data to be collected
    console.log('[v2] 📼 Stopping recording...');
    await stopRecording();
    console.log('[v2] 📼 Recording stopped, getting blob...');

    // Update candidate status to completed in database
    if (authenticatedCandidate) {
      try {
        // Upload the recording first
        let recordingUrl: string | null = null;
        const evalId = authenticatedCandidate.evaluation?.id;
        
        if (evalId) {
          console.log('[v2] 📼 Uploading session recording...');
          const recordingBlob = await getRecordingBlob();
          
          if (recordingBlob && recordingBlob.size > 0) {
            const formData = new FormData();
            formData.append('audio', recordingBlob, `recording-${evalId}.webm`);
            formData.append('evaluationId', evalId);
            
            try {
              const uploadResponse = await fetch('/api/v2/recordings', {
                method: 'POST',
                body: formData,
              });
              
              if (uploadResponse.ok) {
                const uploadResult = await uploadResponse.json();
                recordingUrl = uploadResult.recordingUrl;
                console.log('[v2] ✅ Recording uploaded:', recordingUrl);
                clearRecording(); // Clear the recording chunks after successful upload
              } else {
                console.error('[v2] ❌ Failed to upload recording:', await uploadResponse.text());
              }
            } catch (uploadError) {
              console.error('[v2] ❌ Error uploading recording:', uploadError);
            }
          } else {
            console.warn('[v2] ⚠️ No recording data available to upload');
          }
        }

        await fetch(`/api/v2/candidates/${authenticatedCandidate.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "completed" }),
        });

        // Also end the evaluation session if exists
        if (evalId) {
          await fetch(`/api/v2/evaluations/${evalId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              currentPhase: "completed",
              endTime: new Date().toISOString(),
              ...(recordingUrl && { recordingUrl }), // Include recording URL if available
            }),
          });
        }
      } catch (error) {
        console.error("Error updating evaluation status:", error);
      }
    }
  };

  // Keep typing test refs in sync with state (MUST be before any early returns)
  useEffect(() => {
    typingTestSummaryRef.current = typingTestSummary;
    typingTestStartTimeRef.current = typingTestStartTime;
    isTypingTestSubmittingRef.current = isTypingTestSubmitting;
  }, [typingTestSummary, typingTestStartTime, isTypingTestSubmitting]);

  // Typing Test Timer Effect (MUST be before any early returns)
  useEffect(() => {
    if (currentPhase !== "typing_test" || !typingTestStartTime) {
      return;
    }
    
    const timer = setInterval(() => {
      const startTime = typingTestStartTimeRef.current;
      if (!startTime) return;
      
      const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
      const remaining = Math.max(0, TYPING_TEST_CONFIG.timeLimit - elapsed);
      setTypingTestTimeRemaining(remaining);
      
      // Auto-submit when time runs out
      if (remaining === 0) {
        // Use ref values to avoid stale closures
        if (isTypingTestSubmittingRef.current) return;
        isTypingTestSubmittingRef.current = true;
        setIsTypingTestSubmitting(true);
        
        const summary = typingTestSummaryRef.current;
        const evalId = evaluationIdRef.current;
        const timeSpent = startTime 
          ? Math.floor((Date.now() - startTime.getTime()) / 1000)
          : 0;
        
        const typingResult: TypingTestResult = {
          summary,
          wordCount: summary.split(/\s+/).filter(w => w).length,
          timeSpent,
          startedAt: startTime?.toISOString() || new Date().toISOString(),
          completedAt: new Date().toISOString(),
        };
        
        // Save to database
        if (evalId) {
          fetch(`/api/v2/evaluations/${evalId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ typingTestResult: JSON.stringify(typingResult) }),
          }).then(() => {
            console.log("[v2] ✅ Typing test saved successfully");
          }).catch((error) => {
            console.error("[v2] ❌ Failed to save typing test:", error);
          });
        }
        
        // Move to next phase
        setCurrentPhase("closure_task");
        setIsTypingTestSubmitting(false);
        isTypingTestSubmittingRef.current = false;
        
        clearInterval(timer);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [currentPhase, typingTestStartTime]);

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

  // Start Typing Test
  const handleStartTypingTest = () => {
    const startTime = new Date();
    setTypingTestStartTime(startTime);
    typingTestStartTimeRef.current = startTime;
    setTypingTestSummary("");
    typingTestSummaryRef.current = "";
    setTypingTestTimeRemaining(TYPING_TEST_CONFIG.timeLimit);
  };

  // Submit Typing Test (manual submission)
  const handleTypingTestSubmit = async () => {
    if (isTypingTestSubmittingRef.current) return;
    isTypingTestSubmittingRef.current = true;
    setIsTypingTestSubmitting(true);
    
    const summary = typingTestSummaryRef.current;
    const startTime = typingTestStartTimeRef.current;
    const evalId = evaluationIdRef.current;
    const timeSpent = startTime 
      ? Math.floor((Date.now() - startTime.getTime()) / 1000)
      : 0;
    
    const typingResult: TypingTestResult = {
      summary,
      wordCount: summary.split(/\s+/).filter(w => w).length,
      timeSpent,
      startedAt: startTime?.toISOString() || new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };
    
    // Save to database
    if (evalId) {
      try {
        await fetch(`/api/v2/evaluations/${evalId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ typingTestResult: JSON.stringify(typingResult) }),
        });
        console.log("[v2] ✅ Typing test saved successfully");
      } catch (error) {
        console.error("[v2] ❌ Failed to save typing test:", error);
      }
    }
    
    // Move to next phase
    setCurrentPhase("closure_task");
    setIsTypingTestSubmitting(false);
    isTypingTestSubmittingRef.current = false;
  };

  // Get use case for typing test prompts
  const candidateUseCase = (authenticatedCandidate as CandidateInfo & { useCase?: UseCase })?.useCase || "pv_sales";
  const typingPrompt = TYPING_TEST_PROMPTS[candidateUseCase] || TYPING_TEST_PROMPTS.pv_sales;

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
        ) : sessionStatus === "DISCONNECTED" && currentPhase === "completed" ? (
          <CompletedScreen candidateName={authenticatedCandidate.name} />
        ) : currentPhase === "typing_test" ? (
          <TypingTestScreen
            prompt={typingPrompt}
            summary={typingTestSummary}
            onSummaryChange={setTypingTestSummary}
            timeRemaining={typingTestTimeRemaining}
            onStart={handleStartTypingTest}
            onSubmit={handleTypingTestSubmit}
            isStarted={!!typingTestStartTime}
            isSubmitting={isTypingTestSubmitting}
            minWords={TYPING_TEST_CONFIG.minWords}
            maxWords={TYPING_TEST_CONFIG.maxWords}
          />
        ) : (
          <EvaluationInterface
            candidate={authenticatedCandidate}
            sessionStatus={sessionStatus}
            currentPhase={currentPhase}
            getMicStream={getMicStream}
            onReportReady={(getReport) => {
              getVoiceAnalysisReportRef.current = getReport;
            }}
            transcriptItems={transcriptItems}
            onDisconnect={handleDisconnect}
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

// Reading Task Panel - Displays the passage for candidate to read aloud
function ReadingTaskPanel({ 
  passage 
}: { 
  passage: { id: string; title: string; useCase: string; wordCount: number; text: string } | null 
}) {
  if (!passage) return null;

  return (
    <div className="bg-gradient-to-br from-violet-900/50 to-purple-900/50 rounded-2xl border border-violet-500/30 shadow-xl p-6 mb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
          <span className="text-2xl">📖</span>
        </div>
        <div>
          <h3 className="font-bold text-white text-lg">Reading Task</h3>
          <p className="text-violet-300 text-sm">{passage.title}</p>
        </div>
      </div>

      {/* Instruction */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2 mb-4">
        <p className="text-amber-300 text-sm flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
          <span><strong>Please read the following paragraph aloud</strong> when prompted by Eva</span>
        </p>
      </div>

      {/* Passage Text */}
      <div className="bg-slate-900/50 rounded-xl border border-slate-600/50 p-5">
        <p className="text-white text-lg leading-relaxed font-medium">
          {passage.text}
        </p>
      </div>

      {/* Word Count */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-slate-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>{passage.wordCount} words</span>
        </div>
        <div className="flex items-center gap-2 text-emerald-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Read clearly & naturally</span>
        </div>
      </div>
    </div>
  );
}

// Evaluation Interface - Shows transcript and voice visualizer
function EvaluationInterface({
  candidate,
  sessionStatus,
  currentPhase,
  transcriptItems,
  onDisconnect,
  getMicStream,
  onReportReady,
}: {
  candidate: CandidateInfo;
  sessionStatus: string;
  currentPhase: EvaluationPhase;
  transcriptItems: any[];
  onDisconnect: () => void;
  getMicStream: () => MediaStream | null;
  onReportReady: (getReport: () => any) => void;
}) {
  // Get the reading passage for this candidate
  const selectedPassage = candidate.selectedPassage
    ? READING_PASSAGES[candidate.selectedPassage as keyof typeof READING_PASSAGES]
    : READING_PASSAGES.safety_adas;
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Voice Quality Analysis - Hidden from candidate view but still functional */}
      <VoiceVisualizer 
        isRecording={sessionStatus === "CONNECTED"} 
        sessionStatus={sessionStatus} 
        getMicStream={getMicStream}
        onReportReady={onReportReady}
        hidden={true}
      />
      
      <div className="grid grid-cols-12 gap-6">
        {/* Left side - Transcript */}
        <div className="col-span-7">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden h-[calc(100vh-180px)]">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-medium text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Evaluation Q&A
              </h3>
              <span className="text-xs text-slate-500">Completed responses only</span>
            </div>

            <div className="p-4 h-[calc(100%-60px)] overflow-y-auto space-y-4">
              {/* Filter to only show completed Q&A messages - not partial transcriptions */}
              {(() => {
                // Filter for meaningful messages: have content, not partial transcripts
                const completedItems = transcriptItems.filter(item => {
                  // Must have actual content
                  if (!item.title || item.title.trim() === "") return false;
                  // Skip transcription placeholders
                  if (item.title.includes("[Transcribing")) return false;
                  // Only include user and assistant messages (not breadcrumbs)
                  if (item.type !== "MESSAGE") return false;
                  if (item.role !== "user" && item.role !== "assistant") return false;
                  
                  // Minimum length requirements for complete messages:
                  // - User messages: at least 10 chars
                  // - Assistant messages: at least 40 chars (ensures full sentence, not partial stream)
                  const minLength = item.role === "user" ? 10 : 40;
                  if (item.title.length < minLength) return false;
                  
                  return true;
                });
                
                if (completedItems.length === 0) {
                  return (
                    <div className="flex items-center justify-center h-full text-slate-500">
                      <div className="text-center">
                        <svg className="w-12 h-12 mx-auto mb-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                        <p>Waiting for conversation to begin...</p>
                        <p className="text-sm mt-2">Eva will introduce herself shortly</p>
                      </div>
                    </div>
                  );
                }
                
                return completedItems.map((item, index) => (
                  <div
                    key={item.itemId || index}
                    className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        item.role === "user"
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-700 text-slate-100"
                      }`}
                    >
                      <p className="text-xs font-medium mb-2 opacity-70 flex items-center gap-2">
                        {item.role === "user" ? (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Your Response
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Eva (AI Evaluator)
                          </>
                        )}
                      </p>
                      <p className="text-sm leading-relaxed">{item.displayText || item.title}</p>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>

        {/* Right side - Phase Progress and Controls */}
        <div className="col-span-5 space-y-6">
          {/* Reading Task Panel - Shows passage text when in reading phase */}
          {currentPhase === "reading_task" && (
            <ReadingTaskPanel passage={selectedPassage} />
          )}

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

          {/* Current Phase Info - Hide during reading task since we show the passage panel */}
          {currentPhase !== "reading_task" && (
            <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl p-6">
              <h3 className="font-medium text-white mb-4">Current Task</h3>
              <div className="flex items-center gap-4">
                <span className="text-4xl">
                  {currentPhase === "personal_questions" && "💬"}
                  {currentPhase === "call_scenario" && "📞"}
                  {currentPhase === "empathy_scenario" && "🤝"}
                  {currentPhase === "typing_test" && "⌨️"}
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
                    {currentPhase === "call_scenario" && "Handle a simulated customer call"}
                    {currentPhase === "empathy_scenario" && "Handle an upset customer scenario"}
                    {currentPhase === "typing_test" && "Type a summary of the call"}
                    {currentPhase === "closure_task" && "Deliver a professional call closing"}
                    {currentPhase === "not_started" && "Waiting to begin..."}
                    {currentPhase === "completed" && "Your evaluation is complete!"}
                  </p>
                </div>
              </div>
            </div>
          )}

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

// Typing Test Screen Component
function TypingTestScreen({
  prompt,
  summary,
  onSummaryChange,
  timeRemaining,
  onStart,
  onSubmit,
  isStarted,
  isSubmitting,
  minWords,
  maxWords,
}: {
  prompt: { title: string; prompt: string; hints: string[] };
  summary: string;
  onSummaryChange: (value: string) => void;
  timeRemaining: number;
  onStart: () => void;
  onSubmit: () => void;
  isStarted: boolean;
  isSubmitting: boolean;
  minWords: number;
  maxWords: number;
}) {
  const wordCount = summary.split(/\s+/).filter(w => w).length;
  const isValidLength = wordCount >= minWords && wordCount <= maxWords;
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 bg-gradient-to-r from-violet-900/50 to-purple-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-4xl">⌨️</span>
              <div>
                <h2 className="text-xl font-bold text-white">{prompt.title}</h2>
                <p className="text-slate-400 text-sm mt-1">Type a summary of the call you just completed</p>
              </div>
            </div>
            {isStarted && (
              <div className={`px-4 py-2 rounded-xl font-mono text-xl ${
                timeRemaining < 60 ? "bg-red-900/50 text-red-400" : 
                timeRemaining < 120 ? "bg-amber-900/50 text-amber-400" : 
                "bg-slate-700 text-white"
              }`}>
                {formatTime(timeRemaining)}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {!isStarted ? (
            // Instructions before starting
            <div className="space-y-6">
              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
                <h3 className="font-medium text-white mb-3">Instructions</h3>
                <p className="text-slate-300 mb-4">{prompt.prompt}</p>
                <div className="space-y-2">
                  <p className="text-sm text-slate-400 font-medium">Include the following in your summary:</p>
                  <ul className="space-y-2">
                    {prompt.hints.map((hint, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                        <svg className="w-4 h-4 text-violet-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {hint}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-amber-900/20 rounded-xl p-4 border border-amber-700/50">
                <p className="text-amber-400 text-sm flex items-start gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>
                    <strong>Time Limit:</strong> You will have 5 minutes to complete this task. 
                    Your summary should be between {minWords}-{maxWords} words.
                  </span>
                </p>
              </div>

              <button
                onClick={onStart}
                className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold rounded-xl hover:from-violet-600 hover:to-purple-700 transition-all shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2"
              >
                <span>Start Typing Test</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          ) : (
            // Typing area
            <div className="space-y-4">
              <div className="relative">
                <textarea
                  value={summary}
                  onChange={(e) => onSummaryChange(e.target.value)}
                  placeholder="Start typing your call summary here..."
                  rows={12}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                  autoFocus
                />
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <span className={`text-sm ${
                    wordCount < minWords ? "text-amber-400" :
                    wordCount > maxWords ? "text-red-400" :
                    "text-emerald-400"
                  }`}>
                    {wordCount} words
                  </span>
                  <span className="text-slate-500 text-sm">
                    ({minWords}-{maxWords} required)
                  </span>
                </div>
              </div>

              {/* Word count feedback */}
              {wordCount > 0 && (
                <div className={`p-3 rounded-lg text-sm ${
                  wordCount < minWords ? "bg-amber-900/30 text-amber-400 border border-amber-700/50" :
                  wordCount > maxWords ? "bg-red-900/30 text-red-400 border border-red-700/50" :
                  "bg-emerald-900/30 text-emerald-400 border border-emerald-700/50"
                }`}>
                  {wordCount < minWords && `Please write at least ${minWords - wordCount} more words.`}
                  {wordCount > maxWords && `Please reduce your summary by ${wordCount - maxWords} words.`}
                  {isValidLength && "✓ Word count is within the required range."}
                </div>
              )}

              {/* Hints reminder */}
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                <p className="text-xs text-slate-400 font-medium mb-2">Remember to include:</p>
                <div className="flex flex-wrap gap-2">
                  {prompt.hints.map((hint, idx) => (
                    <span key={idx} className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-full">
                      {hint}
                    </span>
                  ))}
                </div>
              </div>

              {/* Submit button */}
              <button
                onClick={onSubmit}
                disabled={!isValidLength || isSubmitting}
                className={`w-full py-4 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  isValidLength && !isSubmitting
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/20"
                    : "bg-slate-700 text-slate-400 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Summary</span>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          )}
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
    { id: "typing_test", label: "Call Summary", icon: "⌨️", description: "Type call summary" },
    { id: "closure_task", label: "Closure", icon: "🎯", description: "Professional closing" },
  ];

  const phaseOrder = ["not_started", "personal_questions", "reading_task", "call_scenario", "empathy_scenario", "typing_test", "closure_task", "completed"];
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
