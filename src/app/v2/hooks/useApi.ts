"use client";

import { useState, useCallback } from "react";

// Types for API responses
export interface BatchSummary {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  totalCandidates: number;
  completedCandidates: number;
  inProgressCandidates: number;
  pendingCandidates: number;
}

export interface CandidateData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  accessCode: string;
  status: string;
  selectedPassage: string;
  selectedScenario: string;
  createdAt: string;
  evaluation?: EvaluationData | null;
}

export interface VoiceAnalysisReport {
  clarityScore: number;
  volumeScore: number;
  toneScore: number;
  paceScore: number;
  overallScore: number;
  assessment: string;
  strengths: string[];
  recommendations: string[];
  sampleCount: number;
  duration: string;
  // Raw average values
  avgClarity?: string;
  avgVolume?: string;
  avgPitch?: string;
  avgPace?: string;
}

export interface EvaluationData {
  id: string;
  sessionId: string;
  candidateId: string;
  currentPhase: string;
  startTime: string | null;
  endTime: string | null;
  recordingUrl: string | null;
  recordingDuration: number;
  voiceAnalysisData: string | null; // JSON string of VoiceAnalysisReport
  scores: ScoreData[];
  scorer?: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
}

export interface ScoreData {
  id: string;
  parameterId: string;
  score: number;
  notes: string;
}

export interface EvaluatorFeedbackData {
  id: string;
  feedbackType: "score" | "voice_quality";
  scoreId: string | null;
  voiceMetric: string | null; // "clarity" | "volume" | "tone" | "pace" | "overall"
  originalScore: number | null;
  adjustedScore: number | null;
  comment: string;
  sessionDate: string;
  createdAt: string;
  evaluator: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  score?: ScoreData | null;
}

export interface BatchDetail extends BatchSummary {
  candidates: CandidateData[];
}

// API functions
export async function fetchBatches(filters?: { date?: string; status?: string }): Promise<BatchSummary[]> {
  const params = new URLSearchParams();
  if (filters?.date) params.append("date", filters.date);
  if (filters?.status) params.append("status", filters.status);
  
  const response = await fetch(`/api/v2/batches?${params.toString()}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch batches");
  }
  return response.json();
}

export async function fetchBatch(batchId: string): Promise<BatchDetail> {
  const response = await fetch(`/api/v2/batches/${batchId}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch batch");
  }
  return response.json();
}

export async function createBatch(name: string): Promise<BatchSummary> {
  const response = await fetch("/api/v2/batches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create batch");
  }
  return response.json();
}

export async function updateBatch(batchId: string, data: { name?: string; status?: string }): Promise<BatchSummary> {
  const response = await fetch(`/api/v2/batches/${batchId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update batch");
  }
  return response.json();
}

export async function deleteBatch(batchId: string): Promise<void> {
  const response = await fetch(`/api/v2/batches/${batchId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete batch");
  }
}

export async function addCandidates(
  batchId: string,
  candidates: Array<{ name: string; email?: string; phone?: string; selectedPassage?: string; selectedScenario?: string }>
): Promise<CandidateData[]> {
  const response = await fetch("/api/v2/candidates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ batchId, candidates }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to add candidates");
  }
  return response.json();
}

export async function updateCandidate(
  candidateId: string,
  data: Partial<CandidateData>
): Promise<CandidateData> {
  const response = await fetch(`/api/v2/candidates/${candidateId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update candidate");
  }
  return response.json();
}

export async function deleteCandidate(candidateId: string): Promise<void> {
  const response = await fetch(`/api/v2/candidates/${candidateId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete candidate");
  }
}

export async function regenerateAccessCode(candidateId: string): Promise<string> {
  const response = await fetch(`/api/v2/candidates/${candidateId}/regenerate-code`, {
    method: "POST",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to regenerate access code");
  }
  const data = await response.json();
  return data.accessCode;
}

export async function addScore(
  evaluationId: string,
  data: { parameterId: string; score: number; notes?: string }
): Promise<ScoreData> {
  const response = await fetch(`/api/v2/evaluations/${evaluationId}/scores`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to add score");
  }
  return response.json();
}

export async function endEvaluation(evaluationId: string): Promise<EvaluationData> {
  const response = await fetch(`/api/v2/evaluations/${evaluationId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endSession: true }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to end evaluation");
  }
  return response.json();
}

// Evaluator Feedback API functions
export async function fetchEvaluatorFeedback(evaluationId: string): Promise<EvaluatorFeedbackData[]> {
  const response = await fetch(`/api/v2/evaluations/${evaluationId}/feedback`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch feedback");
  }
  return response.json();
}

export async function addEvaluatorFeedback(
  evaluationId: string,
  data: {
    feedbackType: "score" | "voice_quality";
    parameterId?: string;      // For score feedback - the parameter ID
    scoreId?: string;          // Alternative: direct score ID
    voiceMetric?: string;      // For voice_quality: "clarity" | "volume" | "tone" | "pace" | "overall"
    originalScore?: number;
    adjustedScore?: number;
    comment: string;
  }
): Promise<EvaluatorFeedbackData> {
  const response = await fetch(`/api/v2/evaluations/${evaluationId}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to add feedback");
  }
  return response.json();
}

export async function deleteEvaluatorFeedback(
  evaluationId: string,
  feedbackId: string
): Promise<void> {
  const response = await fetch(
    `/api/v2/evaluations/${evaluationId}/feedback?feedbackId=${feedbackId}`,
    { method: "DELETE" }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete feedback");
  }
}

// Custom hook for batches with loading state
export function useBatches() {
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBatches = useCallback(async (filters?: { date?: string; status?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBatches(filters);
      setBatches(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load batches");
    } finally {
      setLoading(false);
    }
  }, []);

  return { batches, loading, error, loadBatches, setBatches };
}

// Custom hook for a single batch
export function useBatch(batchId: string | null) {
  const [batch, setBatch] = useState<BatchDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBatch = useCallback(async () => {
    if (!batchId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBatch(batchId);
      setBatch(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load batch");
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  return { batch, loading, error, loadBatch, setBatch };
}



