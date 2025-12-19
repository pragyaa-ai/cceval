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
  // Demographics for voice quality calibration
  age: number | null;
  gender: string | null; // male, female, other
  nativeLanguage: string | null;
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
  // Manager recommendation
  managerDecision?: string | null;
  managerComments?: string | null;
  managerName?: string | null;
  managerDesignation?: string | null;
  managerDecisionAt?: string | null;
  // HR decision
  hrDecision?: string | null;
  hrComments?: string | null;
  hrName?: string | null;
  hrDesignation?: string | null;
  hrDecisionAt?: string | null;
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
  candidates: Array<{ 
    name: string; 
    email?: string; 
    phone?: string; 
    age?: number;
    gender?: string;
    nativeLanguage?: string;
    selectedPassage?: string; 
    selectedScenario?: string;
  }>
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

// Calibration types
export interface CalibrationData {
  adjustment: number;
  guidance: string;
  totalFeedbacks: number;
  avgAdjustment: number;
  lastAnalyzedAt: string | null;
  // Computed fields for display
  adjustmentDirection?: "higher" | "lower" | "neutral";
  feedbackCount?: number;
}

export interface CalibrationHistoryItem {
  id: string;
  parameterId: string;
  previousAdjustment: number;
  newAdjustment: number;
  previousGuidance: string;
  newGuidance: string;
  feedbackCount: number;
  periodStart: string;
  periodEnd: string;
  analysisSummary: string;
  evaluators: string[]; // Evaluator names
  createdAt: string;
}

export interface FeedbackHistoryItem {
  id: string;
  feedbackType: string;
  parameterId: string;
  originalScore: number | null;
  adjustedScore: number | null;
  adjustment: number | null;
  comment: string;
  evaluator: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  candidate: {
    id: string;
    name: string;
    email: string | null;
  };
  sessionId: string;
  evaluationId: string;
  createdAt: string;
}

// Fetch calibration settings
export async function fetchCalibrations(): Promise<{
  calibrations: Record<string, CalibrationData>;
  parameters: string[];
}> {
  const response = await fetch("/api/v2/calibration");
  if (!response.ok) {
    throw new Error("Failed to fetch calibrations");
  }
  return response.json();
}

// Run calibration analysis (admin only)
export async function runCalibrationAnalysis(periodDays: number = 7): Promise<{
  success: boolean;
  periodStart: string;
  periodEnd: string;
  totalFeedbacksAnalyzed: number;
  results: Record<string, {
    feedbackCount: number;
    avgAdjustment: number;
    newGuidance: string;
    evaluators: string[];
  }>;
}> {
  const response = await fetch("/api/v2/calibration", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ periodDays }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to run calibration analysis");
  }
  return response.json();
}

// Fetch calibration history
export async function fetchCalibrationHistory(
  parameterId?: string,
  limit: number = 50
): Promise<{ history: CalibrationHistoryItem[]; total: number }> {
  const params = new URLSearchParams();
  if (parameterId) params.set("parameterId", parameterId);
  params.set("limit", limit.toString());

  const response = await fetch(`/api/v2/calibration/history?${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch calibration history");
  }
  return response.json();
}

// Fetch feedback history with filters
export async function fetchFeedbackHistory(filters?: {
  startDate?: string;
  endDate?: string;
  evaluatorId?: string;
  parameterId?: string;
  feedbackType?: string;
  limit?: number;
  page?: number;
}): Promise<{
  feedbacks: FeedbackHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  stats: {
    byEvaluator: Array<{
      evaluatorId: string;
      evaluatorName: string;
      feedbackCount: number;
    }>;
    byType: Array<{
      feedbackType: string;
      _count: { id: number };
      _avg: { originalScore: number | null; adjustedScore: number | null };
    }>;
  };
}> {
  const params = new URLSearchParams();
  if (filters?.startDate) params.set("startDate", filters.startDate);
  if (filters?.endDate) params.set("endDate", filters.endDate);
  if (filters?.evaluatorId) params.set("evaluatorId", filters.evaluatorId);
  if (filters?.parameterId) params.set("parameterId", filters.parameterId);
  if (filters?.feedbackType) params.set("feedbackType", filters.feedbackType);
  if (filters?.limit) params.set("limit", filters.limit.toString());
  if (filters?.page) params.set("page", filters.page.toString());

  const response = await fetch(`/api/v2/feedback?${params}`);
  if (!response.ok) {
    throw new Error("Failed to fetch feedback history");
  }
  return response.json();
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



