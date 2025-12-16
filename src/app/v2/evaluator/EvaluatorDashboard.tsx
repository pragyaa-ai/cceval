"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { SCORING_PARAMETERS, READING_PASSAGES, CALL_SCENARIOS } from "../contexts/V2EvaluationContext";
import {
  useBatches,
  useBatch,
  createBatch,
  updateBatch,
  addCandidates,
  updateCandidate,
  deleteCandidate,
  regenerateAccessCode,
  addScore,
  fetchEvaluatorFeedback,
  addEvaluatorFeedback,
  deleteEvaluatorFeedback,
  BatchSummary,
  BatchDetail,
  CandidateData,
  EvaluationData,
  VoiceAnalysisReport,
  EvaluatorFeedbackData,
} from "../hooks/useApi";

type TabType = "batches" | "candidates" | "evaluation" | "results" | "settings";

export default function EvaluatorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("batches");
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/v2/login");
    }
  }, [status, router]);

  // Batches hook
  const { batches, loading: batchesLoading, loadBatches } = useBatches();
  const { batch: activeBatch, loading: batchLoading, loadBatch } = useBatch(activeBatchId);

  // Load batches on mount
  useEffect(() => {
    if (session) {
      loadBatches();
    }
  }, [session, loadBatches]);

  // Load active batch when selected
  useEffect(() => {
    if (activeBatchId) {
      loadBatch();
    }
  }, [activeBatchId, loadBatch]);

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600 text-xl">Loading...</div>
      </div>
    );
  }

  const totalCandidates = activeBatch?.candidates.length || 0;
  const completedCount = activeBatch?.candidates.filter((c) => c.status === "completed").length || 0;
  const inProgressCount = activeBatch?.candidates.filter((c) => c.status === "in_progress").length || 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
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
              <span className="text-violet-600 font-medium text-sm">Evaluator Dashboard</span>
            </div>

            <div className="flex items-center gap-4">
              {/* Current Batch Info */}
              {activeBatch && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-slate-500">Batch:</span>
                  <span className="font-medium text-slate-700">{activeBatch.name}</span>
                  <div className="flex items-center gap-4 pl-4 border-l border-slate-200">
                    <div className="text-center">
                      <p className="text-lg font-bold text-slate-800">{totalCandidates}</p>
                      <p className="text-xs text-slate-500">Total</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-emerald-600">{completedCount}</p>
                      <p className="text-xs text-slate-500">Done</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-amber-600">{inProgressCount}</p>
                      <p className="text-xs text-slate-500">Active</p>
                    </div>
                  </div>
                </div>
              )}

              {/* User Menu */}
              <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                {session.user?.image && (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div className="text-sm">
                  <p className="font-medium text-slate-700">{session.user?.name}</p>
                  <button
                    onClick={() => signOut({ callbackUrl: "/v2/login" })}
                    className="text-xs text-slate-500 hover:text-red-600"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tab navigation */}
        <div className="flex items-center gap-1 mb-6 bg-white rounded-xl p-1 shadow-sm border border-slate-200 w-fit">
          {[
            { id: "batches" as TabType, label: "Batch History", icon: "📅" },
            { id: "candidates" as TabType, label: "Candidates", icon: "👥", disabled: !activeBatch },
            { id: "evaluation" as TabType, label: "Live Evaluation", icon: "🎙️", disabled: !activeBatch },
            { id: "results" as TabType, label: "Results", icon: "📊", disabled: !activeBatch },
            { id: "settings" as TabType, label: "Settings", icon: "⚙️", disabled: !activeBatch },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              disabled={tab.disabled}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-violet-500 text-white shadow-sm"
                  : tab.disabled
                  ? "text-slate-300 cursor-not-allowed"
                  : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "batches" && (
          <BatchHistoryTab
            batches={batches}
            loading={batchesLoading}
            onRefresh={loadBatches}
            onSelectBatch={(id) => {
              setActiveBatchId(id);
              setActiveTab("candidates");
            }}
            currentUser={session.user}
          />
        )}
        {activeTab === "candidates" && activeBatch && (
          <CandidatesTab
            batch={activeBatch}
            loading={batchLoading}
            onRefresh={loadBatch}
          />
        )}
        {activeTab === "evaluation" && activeBatch && (
          <EvaluationTab batch={activeBatch} onRefresh={loadBatch} />
        )}
        {activeTab === "results" && activeBatch && (
          <ResultsTab batch={activeBatch} onRefresh={loadBatch} />
        )}
        {activeTab === "settings" && activeBatch && (
          <SettingsTab
            batch={activeBatch}
            onRefresh={loadBatch}
            onBatchDeleted={() => {
              setActiveBatchId(null);
              setActiveTab("batches");
              loadBatches();
            }}
          />
        )}
      </div>
    </div>
  );
}

// Batch History Tab
function BatchHistoryTab({
  batches,
  loading,
  onRefresh,
  onSelectBatch,
  currentUser,
}: {
  batches: BatchSummary[];
  loading: boolean;
  onRefresh: (filters?: { date?: string; status?: string }) => void;
  onSelectBatch: (id: string) => void;
  currentUser: { id: string; name?: string | null; email?: string | null };
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBatchName, setNewBatchName] = useState("");
  const [creating, setCreating] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const handleCreateBatch = async () => {
    if (!newBatchName.trim()) return;
    setCreating(true);
    try {
      const batch = await createBatch(newBatchName);
      setNewBatchName("");
      setShowCreateForm(false);
      onSelectBatch(batch.id);
    } catch (error) {
      console.error("Failed to create batch:", error);
      alert("Failed to create batch");
    } finally {
      setCreating(false);
    }
  };

  const handleFilter = () => {
    onRefresh({ date: filterDate || undefined, status: filterStatus || undefined });
  };

  const clearFilters = () => {
    setFilterDate("");
    setFilterStatus("");
    onRefresh();
  };

  // Group batches by date
  const batchesByDate = batches.reduce((acc, batch) => {
    const date = new Date(batch.createdAt).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(batch);
    return acc;
  }, {} as Record<string, BatchSummary[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Batch History</h2>
          <p className="text-slate-500 text-sm mt-1">View and manage all evaluation batches</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-violet-500 text-white rounded-lg font-medium hover:bg-violet-600 transition-colors shadow-sm flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Batch
        </button>
      </div>

      {/* Create Batch Form */}
      {showCreateForm && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-medium text-slate-800 mb-4">Create New Batch</h3>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Batch name (e.g., Morning Session - Dec 5)"
              value={newBatchName}
              onChange={(e) => setNewBatchName(e.target.value)}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button
              onClick={handleCreateBatch}
              disabled={!newBatchName.trim() || creating}
              className="px-6 py-2 bg-violet-500 text-white rounded-lg font-medium hover:bg-violet-600 disabled:opacity-50 transition-colors"
            >
              {creating ? "Creating..." : "Create"}
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Date:</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <button
            onClick={handleFilter}
            className="px-4 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 transition-colors"
          >
            Apply Filter
          </button>
          {(filterDate || filterStatus) && (
            <button
              onClick={clearFilters}
              className="px-4 py-1.5 text-slate-500 text-sm hover:text-slate-700"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => onRefresh()}
            className="ml-auto px-4 py-1.5 text-violet-600 text-sm hover:text-violet-700 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Batches List */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <p className="text-slate-500">Loading batches...</p>
        </div>
      ) : batches.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-lg font-medium text-slate-800 mb-2">No batches found</h3>
          <p className="text-slate-500">Create a new batch to get started</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(batchesByDate).map(([date, dateBatches]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {date}
              </h3>
              <div className="grid gap-4">
                {dateBatches.map((batch) => (
                  <div
                    key={batch.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => onSelectBatch(batch.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-800 text-lg">{batch.name}</h4>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Created by {batch.creator.name || batch.creator.email}
                          </span>
                          <span>
                            {new Date(batch.createdAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        {/* Stats */}
                        <div className="flex items-center gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold text-slate-800">{batch.totalCandidates}</p>
                            <p className="text-xs text-slate-500">Total</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-emerald-600">{batch.completedCandidates}</p>
                            <p className="text-xs text-slate-500">Done</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-amber-600">{batch.inProgressCandidates}</p>
                            <p className="text-xs text-slate-500">Active</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-slate-400">{batch.pendingCandidates}</p>
                            <p className="text-xs text-slate-500">Pending</p>
                          </div>
                        </div>
                        {/* Status Badge */}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            batch.status === "active"
                              ? "bg-emerald-100 text-emerald-700"
                              : batch.status === "completed"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
                        </span>
                        {/* Arrow */}
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Candidates Tab
function CandidatesTab({
  batch,
  loading,
  onRefresh,
}: {
  batch: BatchDetail;
  loading: boolean;
  onRefresh: () => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [bulkInput, setBulkInput] = useState("");
  const [newCandidate, setNewCandidate] = useState({ 
    name: "", 
    email: "", 
    phone: "",
    age: "",
    gender: "",
    nativeLanguage: "Hindi"
  });
  const [adding, setAdding] = useState(false);

  const handleAddSingle = async () => {
    if (!newCandidate.name.trim()) return;
    setAdding(true);
    try {
      await addCandidates(batch.id, [{
        ...newCandidate,
        age: newCandidate.age ? parseInt(newCandidate.age) : undefined,
      }]);
      setNewCandidate({ name: "", email: "", phone: "", age: "", gender: "", nativeLanguage: "Hindi" });
      setShowAddForm(false);
      onRefresh();
    } catch (error) {
      console.error("Failed to add candidate:", error);
      alert("Failed to add candidate");
    } finally {
      setAdding(false);
    }
  };

  const handleBulkAdd = async () => {
    const lines = bulkInput.split("\n").filter((line) => line.trim());
    const candidates = lines
      .map((line) => {
        const parts = line.split(",").map((p) => p.trim());
        return {
          name: parts[0] || "",
          email: parts[1] || "",
          phone: parts[2] || "",
          age: parts[3] ? parseInt(parts[3]) : undefined,
          gender: parts[4] || "",
          nativeLanguage: parts[5] || "Hindi",
        };
      })
      .filter((c) => c.name);

    if (candidates.length === 0) return;

    setAdding(true);
    try {
      await addCandidates(batch.id, candidates);
      setBulkInput("");
      setShowAddForm(false);
      onRefresh();
    } catch (error) {
      console.error("Failed to add candidates:", error);
      alert("Failed to add candidates");
    } finally {
      setAdding(false);
    }
  };

  const handleUpdateCandidate = async (candidateId: string, data: Partial<CandidateData>) => {
    try {
      await updateCandidate(candidateId, data);
      onRefresh();
    } catch (error) {
      console.error("Failed to update candidate:", error);
    }
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    if (!confirm("Are you sure you want to remove this candidate?")) return;
    try {
      await deleteCandidate(candidateId);
      onRefresh();
    } catch (error) {
      console.error("Failed to delete candidate:", error);
      alert("Failed to delete candidate");
    }
  };

  const handleRegenerateCode = async (candidateId: string) => {
    try {
      await regenerateAccessCode(candidateId);
      onRefresh();
    } catch (error) {
      console.error("Failed to regenerate code:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-slate-100 text-slate-600",
      in_progress: "bg-amber-100 text-amber-700",
      completed: "bg-emerald-100 text-emerald-700",
      cancelled: "bg-red-100 text-red-700",
    };
    const labels: Record<string, string> = {
      pending: "Pending",
      in_progress: "In Progress",
      completed: "Completed",
      cancelled: "Cancelled",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
        <p className="text-slate-500">Loading candidates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Candidate Management</h2>
          <p className="text-slate-500 text-sm mt-1">
            Add candidates and configure their evaluations for {batch.name}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-violet-500 text-white rounded-lg font-medium hover:bg-violet-600 transition-colors shadow-sm flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Candidates
        </button>
      </div>

      {/* Add Candidates Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex gap-8">
            {/* Single Add */}
            <div className="flex-1">
              <h3 className="font-medium text-slate-800 mb-4">Add Single Candidate</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={newCandidate.name}
                  onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    value={newCandidate.email}
                    onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <input
                    type="tel"
                    placeholder="Phone (optional)"
                    value={newCandidate.phone}
                    onChange={(e) => setNewCandidate({ ...newCandidate, phone: e.target.value })}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                {/* Demographics for voice quality calibration */}
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="number"
                    placeholder="Age"
                    min="18"
                    max="70"
                    value={newCandidate.age}
                    onChange={(e) => setNewCandidate({ ...newCandidate, age: e.target.value })}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <select
                    value={newCandidate.gender}
                    onChange={(e) => setNewCandidate({ ...newCandidate, gender: e.target.value })}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="">Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  <select
                    value={newCandidate.nativeLanguage}
                    onChange={(e) => setNewCandidate({ ...newCandidate, nativeLanguage: e.target.value })}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="Hindi">Hindi</option>
                    <option value="English">English</option>
                    <option value="Marathi">Marathi</option>
                    <option value="Tamil">Tamil</option>
                    <option value="Telugu">Telugu</option>
                    <option value="Kannada">Kannada</option>
                    <option value="Bengali">Bengali</option>
                    <option value="Gujarati">Gujarati</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <p className="text-xs text-slate-500">Demographics help calibrate voice quality analysis expectations</p>
                <button
                  onClick={handleAddSingle}
                  disabled={!newCandidate.name.trim() || adding}
                  className="w-full py-2 bg-violet-500 text-white rounded-lg font-medium hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {adding ? "Adding..." : "Add Candidate"}
                </button>
              </div>
            </div>

            <div className="w-px bg-slate-200" />

            {/* Bulk Add */}
            <div className="flex-1">
              <h3 className="font-medium text-slate-800 mb-4">Bulk Add (CSV Format)</h3>
              <p className="text-xs text-slate-500 mb-2">Format: Name, Email, Phone, Age, Gender, Language (one per line)</p>
              <textarea
                placeholder="John Doe, john@email.com, +91 98765 43210&#10;Jane Smith, jane@email.com&#10;Mike Wilson"
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono text-sm"
              />
              <button
                onClick={handleBulkAdd}
                disabled={!bulkInput.trim() || adding}
                className="w-full py-2 mt-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {adding ? "Adding..." : "Add All Candidates"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Candidates Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Candidate</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Access Code</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Reading Passage</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Scenario</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Status</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {batch.candidates.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                  <svg
                    className="w-12 h-12 mx-auto mb-4 text-slate-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <p className="font-medium">No candidates yet</p>
                  <p className="text-sm">Add candidates using the button above</p>
                </td>
              </tr>
            ) : (
              batch.candidates.map((candidate) => (
                <tr key={candidate.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-800">{candidate.name}</p>
                      {candidate.email && <p className="text-sm text-slate-500">{candidate.email}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <code className="px-3 py-1 bg-violet-100 text-violet-700 rounded-lg font-mono text-lg font-bold">
                        {candidate.accessCode}
                      </code>
                      <button
                        onClick={() => handleRegenerateCode(candidate.id)}
                        className="p-1 text-slate-400 hover:text-violet-600 transition-colors"
                        title="Regenerate code"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={candidate.selectedPassage || "safety_adas"}
                      onChange={(e) =>
                        handleUpdateCandidate(candidate.id, { selectedPassage: e.target.value })
                      }
                      disabled={candidate.status !== "pending"}
                      className="px-2 py-1 border border-slate-300 rounded text-sm text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {Object.entries(READING_PASSAGES).map(([key, passage]) => (
                        <option key={key} value={key}>
                          {passage.title}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={candidate.selectedScenario || "beginner"}
                      onChange={(e) =>
                        handleUpdateCandidate(candidate.id, { selectedScenario: e.target.value })
                      }
                      disabled={candidate.status !== "pending"}
                      className="px-2 py-1 border border-slate-300 rounded text-sm text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {Object.entries(CALL_SCENARIOS).map(([key, scenario]) => (
                        <option key={key} value={key}>
                          {scenario.level}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(candidate.status)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigator.clipboard.writeText(candidate.accessCode)}
                        className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                        title="Copy access code"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                      {candidate.status === "pending" && (
                        <button
                          onClick={() => handleDeleteCandidate(candidate.id)}
                          className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                          title="Remove candidate"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Quick Actions */}
      {batch.candidates.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h3 className="font-medium text-slate-800 mb-3">Quick Actions</h3>
          <div className="flex gap-3">
            <button
              onClick={() => {
                const csv = batch.candidates.map((c) => `${c.name},${c.accessCode},${c.email},${c.phone}`).join("\n");
                navigator.clipboard.writeText(`Name,Access Code,Email,Phone\n${csv}`);
              }}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 transition-colors"
            >
              Copy All Access Codes
            </button>
            <button
              onClick={() => {
                const data = batch.candidates.map((c) => ({
                  name: c.name,
                  accessCode: c.accessCode,
                  email: c.email,
                  phone: c.phone,
                  status: c.status,
                  passage: c.selectedPassage,
                  scenario: c.selectedScenario,
                }));
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `candidates-${batch.name}-${new Date().toISOString().split("T")[0]}.json`;
                a.click();
              }}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 transition-colors"
            >
              Export to JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Live Evaluation Tab
function EvaluationTab({ batch, onRefresh }: { batch: BatchDetail; onRefresh: () => void }) {
  const [activeCandidateId, setActiveCandidateId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<Array<{ role: string; content: string; timestamp: string }>>([]);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);
  const [endingSession, setEndingSession] = useState(false);

  const activeCandidates = batch.candidates.filter((c) => c.status === "in_progress");
  const activeCandidate = batch.candidates.find((c) => c.id === activeCandidateId);

  // Fetch transcript for active candidate
  useEffect(() => {
    if (activeCandidate?.evaluation?.id) {
      const fetchTranscript = async () => {
        setIsLoadingTranscript(true);
        try {
          const response = await fetch(`/api/v2/evaluations/${activeCandidate.evaluation!.id}/transcript`);
          if (response.ok) {
            const data = await response.json();
            // API returns array directly, not wrapped in { transcript: [] }
            setTranscript(Array.isArray(data) ? data : []);
          }
        } catch (error) {
          console.error("Failed to fetch transcript:", error);
        } finally {
          setIsLoadingTranscript(false);
        }
      };
      fetchTranscript();
      
      // Poll for transcript updates every 3 seconds
      const interval = setInterval(fetchTranscript, 3000);
      return () => clearInterval(interval);
    }
  }, [activeCandidate?.evaluation?.id]);

  // Poll for batch updates
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('[EvaluationTab] Polling for updates...');
      onRefresh();
    }, 5000);
    return () => clearInterval(interval);
  }, [onRefresh]);

  const handleAddScore = async (evaluationId: string, parameterId: string, score: number) => {
    try {
      await addScore(evaluationId, { parameterId, score });
      onRefresh();
    } catch (error) {
      console.error("Failed to add score:", error);
    }
  };

  const handleEndSession = async (candidateId: string) => {
    if (!confirm("Are you sure you want to end this evaluation session?")) return;
    
    setEndingSession(true);
    try {
      // Update candidate status to completed
      await updateCandidate(candidateId, { status: "completed" });
      
      // Update evaluation end time
      const candidate = batch.candidates.find((c) => c.id === candidateId);
      if (candidate?.evaluation?.id) {
        await fetch(`/api/v2/evaluations/${candidate.evaluation.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            currentPhase: "completed",
            endTime: new Date().toISOString(),
          }),
        });
      }
      
      setActiveCandidateId(null);
      onRefresh();
    } catch (error) {
      console.error("Failed to end session:", error);
      alert("Failed to end session");
    } finally {
      setEndingSession(false);
    }
  };

  const getOverallScore = (candidate: CandidateData): number => {
    if (!candidate.evaluation || candidate.evaluation.scores.length === 0) return 0;
    const total = candidate.evaluation.scores.reduce((sum, s) => sum + s.score, 0);
    return Math.round((total / candidate.evaluation.scores.length) * 10) / 10;
  };

  if (activeCandidates.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
        <svg className="w-16 h-16 mx-auto mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </svg>
        <h3 className="text-lg font-medium text-slate-800 mb-2">No Active Evaluations</h3>
        <p className="text-slate-500">
          Candidates will appear here when they start their evaluations using their access codes.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Active Candidates List */}
      <div className="col-span-3">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-medium text-slate-800">Active Sessions</h3>
            <p className="text-xs text-slate-500 mt-1">{activeCandidates.length} in progress</p>
          </div>
          <div className="divide-y divide-slate-100">
            {activeCandidates.map((candidate) => (
              <button
                key={candidate.id}
                onClick={() => setActiveCandidateId(candidate.id)}
                className={`w-full p-4 text-left hover:bg-slate-50 transition-colors ${
                  activeCandidateId === candidate.id ? "bg-violet-50 border-l-4 border-violet-500" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">{candidate.name}</p>
                    <p className="text-xs text-slate-500 mt-1">Code: {candidate.accessCode}</p>
                  </div>
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" title="Live"></span>
                </div>
                {candidate.evaluation && (
                  <p className="text-xs text-violet-600 mt-2 capitalize">
                    {candidate.evaluation.currentPhase.replace(/_/g, " ")}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Evaluation Details */}
      <div className="col-span-9">
        {activeCandidate && activeCandidate.evaluation ? (
          <div className="space-y-6">
            {/* Candidate Header */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{activeCandidate.name}</h2>
                  <p className="text-slate-500 text-sm">Session: {activeCandidate.evaluation.sessionId}</p>
                  {/* Candidate Demographics if available */}
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    {activeCandidate.age && <span>Age: {activeCandidate.age}</span>}
                    {activeCandidate.gender && <span className="capitalize">Gender: {activeCandidate.gender}</span>}
                    {activeCandidate.nativeLanguage && <span>Language: {activeCandidate.nativeLanguage}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {/* Audio Recording Access */}
                  {activeCandidate.evaluation.recordingUrl && (
                    <div className="flex items-center gap-2">
                      <audio 
                        controls 
                        src={activeCandidate.evaluation.recordingUrl}
                        className="h-8"
                      />
                      <a
                        href={activeCandidate.evaluation.recordingUrl}
                        download={`${activeCandidate.name.replace(/\s+/g, '_')}_recording.webm`}
                        className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                        title="Download Recording"
                      >
                        <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </a>
                    </div>
                  )}
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Current Phase</p>
                    <p className="text-lg font-medium text-violet-600 capitalize flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                      {activeCandidate.evaluation.currentPhase.replace(/_/g, " ")}
                    </p>
                  </div>
                  <button
                    onClick={() => handleEndSession(activeCandidate.id)}
                    disabled={endingSession}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {endingSession ? "Ending..." : "End Session"}
                  </button>
                </div>
              </div>
            </div>

            {/* Two Column Layout: Transcript + Scoring */}
            <div className="grid grid-cols-2 gap-6">
              {/* Evaluation Q&A */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="font-medium text-slate-800 flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    Evaluation Q&A
                  </h3>
                  <span className="text-xs text-slate-500">Completed responses only</span>
                </div>
                <div className="h-80 overflow-y-auto p-4 space-y-4 bg-slate-50">
                  {(() => {
                    // Filter for meaningful completed messages (same as candidate UI)
                    const completedItems = transcript.filter(item => {
                      if (!item.content || item.content.trim() === "") return false;
                      if (item.content.includes("[Transcribing")) return false;
                      
                      // Minimum length requirements for complete messages:
                      // - User messages: at least 10 chars
                      // - Assistant messages: at least 40 chars (ensures full sentence, not partial stream)
                      const minLength = item.role === "user" ? 10 : 40;
                      if (item.content.length < minLength) return false;
                      
                      return true;
                    });

                    if (isLoadingTranscript && completedItems.length === 0) {
                      return <p className="text-slate-500 text-center py-4">Loading transcript...</p>;
                    }
                    if (completedItems.length === 0) {
                      return <p className="text-slate-500 text-center py-4">Waiting for conversation...</p>;
                    }

                    return completedItems.map((item, index) => (
                      <div
                        key={index}
                        className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-xl px-4 py-3 ${
                            item.role === "user"
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-700 text-white"
                          }`}
                        >
                          <p className="text-xs font-medium mb-1.5 opacity-80 flex items-center gap-1">
                            {item.role === "user" ? (
                              <span>👤 Candidate Response</span>
                            ) : (
                              <span>🤖 Eva (AI Evaluator)</span>
                            )}
                          </p>
                          <p className="leading-relaxed">{item.content}</p>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Voice Quality Analysis */}
              <VoiceAnalysisDisplay 
                evaluation={activeCandidate.evaluation}
                isLive={activeCandidate.evaluation.currentPhase === "reading_task"}
              />
            </div>

            {/* Scoring Grid */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-slate-800">Live Scoring</h3>
                <div className="text-right">
                  <span className="text-sm text-slate-500">Overall Score</span>
                  <span className="ml-2 text-2xl font-bold text-violet-600">
                    {getOverallScore(activeCandidate) || "—"}
                  </span>
                  <span className="text-slate-400">/5</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                {SCORING_PARAMETERS.map((param) => {
                  const score = activeCandidate.evaluation?.scores.find((s) => s.parameterId === param.id);
                  return (
                    <div key={param.id} className="bg-slate-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-slate-700">{param.label}</p>
                      <p className="text-xs text-slate-500 mb-3">{param.description}</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            onClick={() =>
                              activeCandidate.evaluation &&
                              handleAddScore(activeCandidate.evaluation.id, param.id, n)
                            }
                            className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                              score?.score === n
                                ? "bg-violet-500 text-white"
                                : "bg-white border border-slate-300 text-slate-600 hover:border-violet-500"
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
            <p className="text-slate-500">Select an active session from the left to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Canvas-based Voice Visualizer for Evaluator - Matches Candidate UI exactly
// This component replicates the VoiceVisualizer component from the candidate UI
// Note: Evaluator cannot access candidate's microphone, so during 'analyzing' phase
// it shows a static "listening" state. Real-time metrics are only visible on candidate's screen.
function EvaluatorVoiceVisualizer({ 
  voiceData,
  status, // 'waiting' | 'analyzing' | 'complete'
  sampleCount = 0,
}: { 
  voiceData?: VoiceAnalysisReport | null;
  status: 'waiting' | 'analyzing' | 'complete';
  sampleCount?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Canvas drawing - matches VoiceVisualizer style
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Setup canvas for high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const draw = () => {
      const width = rect.width;
      const height = rect.height;

      // Clear canvas
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Title
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 16px system-ui, -apple-system';
      ctx.textAlign = 'center';
      ctx.fillText('Voice Quality Analysis', width / 2, 25);

      // Status indicator based on state
      ctx.font = '12px system-ui, -apple-system';
      if (status === 'analyzing') {
        ctx.fillStyle = '#3b82f6';
        ctx.fillText('👂 Listening to candidate reading...', width / 2, 45);
      } else if (status === 'complete' && voiceData) {
        ctx.fillStyle = '#6b7280';
        ctx.fillText(`○ Analysis complete - ${voiceData.sampleCount || sampleCount} samples collected`, width / 2, 45);
      } else {
        ctx.fillStyle = '#6b7280';
        ctx.fillText('○ Waiting for paragraph reading phase...', width / 2, 45);
      }

      // Get scores - use voice data if available, otherwise show empty state
      const displayScores = voiceData ? {
        clarity: voiceData.clarityScore || 0,
        volume: voiceData.volumeScore || 0,
        tone: voiceData.toneScore || 0,
        pace: voiceData.paceScore || 0,
      } : { clarity: 0, volume: 0, tone: 0, pace: 0 };

      const hasData = status === 'complete' && voiceData;

      // Metrics with bars - same structure as VoiceVisualizer
      const metrics = [
        { name: 'Clarity', score: displayScores.clarity, target: 85 },
        { name: 'Volume', score: displayScores.volume, target: 70 },
        { name: 'Tone', score: displayScores.tone, target: 80 },
        { name: 'Pace', score: displayScores.pace, target: 75 }
      ];

      const startY = 65;
      const itemHeight = 45;

      metrics.forEach((metric, index) => {
        const y = startY + index * itemHeight;

        // Metric name
        ctx.fillStyle = '#374151';
        ctx.font = 'bold 14px system-ui, -apple-system';
        ctx.textAlign = 'left';
        ctx.fillText(metric.name, 20, y + 20);

        // Bar setup
        const barX = 100;
        const barWidth = 150;
        const barHeight = 25;

        // Background bar
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(barX, y, barWidth, barHeight);

        // Score bar - green (only show if we have completed data)
        if (hasData) {
          const scoreWidth = (metric.score / 100) * barWidth;
          ctx.fillStyle = '#10b981';
          ctx.fillRect(barX, y, scoreWidth, barHeight);
        }
        // Note: During 'analyzing' phase, evaluator shows empty bars since it 
        // can't access candidate's microphone for real-time metrics

        // Target line - red
        const targetX = barX + (metric.target / 100) * barWidth;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(targetX, y - 3);
        ctx.lineTo(targetX, y + barHeight + 3);
        ctx.stroke();

        // Score text
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 12px system-ui, -apple-system';
        ctx.textAlign = 'left';
        if (hasData) {
          ctx.fillText(`${Math.round(metric.score)}%`, barX + barWidth + 10, y + 17);
        } else if (status === 'analyzing') {
          ctx.fillStyle = '#3b82f6';
          ctx.fillText('Analyzing...', barX + barWidth + 10, y + 17);
        } else {
          ctx.fillStyle = '#6b7280';
          ctx.fillText('No data', barX + barWidth + 10, y + 17);
        }
      });

      // Legend at bottom
      const legendY = height - 35;
      ctx.font = '11px system-ui, -apple-system';
      ctx.textAlign = 'left';

      // Green box - Average (show only if we have data)
      if (hasData) {
        ctx.fillStyle = '#10b981';
        ctx.fillRect(20, legendY, 15, 10);
        ctx.fillStyle = '#6b7280';
        ctx.fillText('Average', 40, legendY + 8);
      }

      // Red line - Target (always show)
      const redLineX = hasData ? 90 : 20;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(redLineX, legendY + 5);
      ctx.lineTo(redLineX + 15, legendY + 5);
      ctx.stroke();
      ctx.fillStyle = '#6b7280';
      ctx.fillText('Target', redLineX + 20, legendY + 8);

      // Show note during analyzing that real-time view is on candidate screen
      if (status === 'analyzing') {
        ctx.fillStyle = '#9ca3af';
        ctx.font = '10px system-ui, -apple-system';
        ctx.textAlign = 'center';
        ctx.fillText('Real-time analysis visible on candidate screen', width / 2, height - 10);
      }
    };

    draw();
  }, [status, voiceData, sampleCount]);

  // Download report function - matches VoiceVisualizer
  const downloadReport = () => {
    if (!voiceData) return;
    
    const canvas = canvasRef.current;
    const chartImage = canvas ? canvas.toDataURL('image/png') : '';
    const now = new Date();
    
    const reportHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Voice Quality Analysis Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; border-bottom: 3px solid #8b5cf6; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #8b5cf6; margin: 0 0 10px 0; font-size: 32px; }
    .overall-score { background: #f9fafb; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
    .score-number { font-size: 48px; font-weight: bold; color: ${voiceData.overallScore >= 80 ? '#059669' : voiceData.overallScore >= 60 ? '#d97706' : '#dc2626'}; }
    .chart-container { text-align: center; margin: 20px 0; }
    .chart-container img { max-width: 100%; border: 1px solid #e5e7eb; border-radius: 8px; }
    .metric-card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 10px 0; }
    .strengths-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; margin: 15px 0; }
    .recommendations-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 15px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Voice Quality Analysis Report</h1>
    <p>Generated: ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}</p>
  </div>
  <div class="overall-score">
    <p>Overall Score</p>
    <div class="score-number">${voiceData.overallScore}%</div>
    <p>${voiceData.assessment || ''}</p>
  </div>
  <div class="chart-container"><img src="${chartImage}" alt="Voice Quality Chart" /></div>
  <div class="metric-card"><strong>Clarity:</strong> ${voiceData.clarityScore}% (Raw: ${voiceData.avgClarity || 'N/A'})</div>
  <div class="metric-card"><strong>Volume:</strong> ${voiceData.volumeScore}% (Raw: ${voiceData.avgVolume || 'N/A'})</div>
  <div class="metric-card"><strong>Tone:</strong> ${voiceData.toneScore}% (Raw: ${voiceData.avgPitch || 'N/A'} Hz)</div>
  <div class="metric-card"><strong>Pace:</strong> ${voiceData.paceScore}% (Raw: ${voiceData.avgPace || 'N/A'})</div>
  ${voiceData.strengths?.length ? `<div class="strengths-box"><h4>Strengths</h4><ul>${voiceData.strengths.map(s => `<li>${s}</li>`).join('')}</ul></div>` : ''}
  ${voiceData.recommendations?.length ? `<div class="recommendations-box"><h4>Recommendations</h4><ul>${voiceData.recommendations.map(r => `<li>${r}</li>`).join('')}</ul></div>` : ''}
  <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:40px;">Analysis based on ${voiceData.sampleCount} samples • ${voiceData.duration}s of speech</p>
</body>
</html>`;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(reportHTML);
      printWindow.document.close();
      printWindow.onload = () => setTimeout(() => printWindow.print(), 250);
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      {/* Header with Download Button - matches VoiceVisualizer */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-gray-800 text-lg font-semibold">Voice Quality Analysis</h3>
        {voiceData && (
          <button
            onClick={downloadReport}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Download Analysis Report"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Report
          </button>
        )}
      </div>

      {/* Canvas Visualization */}
      <canvas
        ref={canvasRef}
        className="w-full border border-gray-200 rounded bg-white"
        style={{ width: '100%', height: '280px', display: 'block' }}
      />

      {/* Status Footer - matches VoiceVisualizer */}
      <div className="mt-2 text-sm text-gray-600 flex justify-between">
        <span>
          {status === 'analyzing' ? (
            <span className="text-green-500">● Analyzing paragraph reading</span>
          ) : status === 'complete' && voiceData ? (
            <span className="text-gray-700 font-medium">✓ Analysis complete</span>
          ) : (
            <span className="text-gray-500">○ Waiting for paragraph phase</span>
          )}
        </span>
        <span className="text-gray-400">
          {voiceData?.sampleCount || sampleCount || 0} samples
        </span>
      </div>

      {/* Detailed Breakdown Section - matches VoiceVisualizer exactly */}
      {voiceData && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="w-full flex items-center justify-between text-left text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Detailed Analysis & Recommendations
            </span>
            <svg 
              className={`w-5 h-5 transition-transform ${showBreakdown ? 'transform rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showBreakdown && (
            <div className="mt-4 space-y-4 text-sm">
              {/* Overall Assessment */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-700">Overall Score:</span>
                  <span className="text-2xl font-bold text-gray-900">{voiceData.overallScore}%</span>
                </div>
                <p className={`font-medium ${
                  voiceData.overallScore >= 80 ? 'text-green-600' :
                  voiceData.overallScore >= 65 ? 'text-blue-600' :
                  voiceData.overallScore >= 50 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>{voiceData.assessment}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Based on {voiceData.sampleCount} audio samples ({voiceData.duration}s of speech)
                </p>
              </div>

              {/* Calculation Breakdown */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Calculation Breakdown
                </h4>
                <div className="space-y-3">
                  {[
                    { name: 'Clarity', score: voiceData.clarityScore, raw: voiceData.avgClarity, method: 'Spectral peak-to-average ratio' },
                    { name: 'Volume', score: voiceData.volumeScore, raw: voiceData.avgVolume, method: 'RMS (Root Mean Square)' },
                    { name: 'Tone', score: voiceData.toneScore, raw: `${voiceData.avgPitch} Hz`, method: 'Autocorrelation pitch detection' },
                    { name: 'Pace', score: voiceData.paceScore, raw: voiceData.avgPace, method: 'Voice activity detection' },
                  ].map((metric) => (
                    <div key={metric.name} className="bg-white p-3 rounded border border-gray-100">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-gray-700">{metric.name}</span>
                        <span className="font-bold text-green-600">{metric.score}%</span>
                      </div>
                      <p className="text-xs text-gray-600">Raw: {metric.raw} | Method: {metric.method}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="text-xs text-blue-800 font-medium">Overall Score Formula:</p>
                  <p className="text-xs text-blue-700 mt-1">
                    (Clarity × 35%) + (Volume × 25%) + (Pace × 25%) + (Tone × 15%)
                  </p>
                </div>
              </div>

              {/* Strengths */}
              {voiceData.strengths && voiceData.strengths.length > 0 && (
                <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Strengths
                  </h4>
                  <ul className="space-y-1">
                    {voiceData.strengths.map((strength: string, idx: number) => (
                      <li key={idx} className="text-sm text-green-700 flex items-start">
                        <span className="mr-2">✓</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {voiceData.recommendations && voiceData.recommendations.length > 0 && (
                <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Recommendations for Improvement
                  </h4>
                  <ul className="space-y-1">
                    {voiceData.recommendations.map((rec: string, idx: number) => (
                      <li key={idx} className="text-sm text-yellow-700 flex items-start">
                        <span className="mr-2">→</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Call Center Suitability */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold text-gray-700 mb-2">Call Center Agent Suitability</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>Voice Clarity:</strong> {(voiceData.clarityScore || 0) >= 70 ? '✓ Meets requirements' : '⚠ Needs improvement'}</p>
                  <p><strong>Volume Projection:</strong> {(voiceData.volumeScore || 0) >= 50 ? '✓ Adequate' : '⚠ Too soft'}</p>
                  <p><strong>Speaking Pace:</strong> {(voiceData.paceScore || 0) >= 30 && (voiceData.paceScore || 0) <= 70 ? '✓ Appropriate' : '⚠ Adjust pace'}</p>
                  <p><strong>Overall Recommendation:</strong> <span className={
                    voiceData.overallScore >= 65 ? 'text-green-600 font-medium' :
                    voiceData.overallScore >= 50 ? 'text-yellow-600 font-medium' :
                    'text-red-600 font-medium'
                  }>{voiceData.overallScore >= 65 ? 'Recommended' : voiceData.overallScore >= 50 ? 'Conditional' : 'Not Recommended'}</span></p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Voice Analysis Display Component - Uses EvaluatorVoiceVisualizer to match Candidate UI exactly
function VoiceAnalysisDisplay({ 
  evaluation, 
  isLive = false 
}: { 
  evaluation: EvaluationData; 
  isLive?: boolean;
}) {
  // Parse voice analysis data with robust error handling
  const voiceData: VoiceAnalysisReport | null = evaluation.voiceAnalysisData 
    ? (() => {
        try {
          // Handle potential double-stringified JSON
          let parsed: unknown = evaluation.voiceAnalysisData;
          if (typeof parsed === 'string') {
            parsed = JSON.parse(parsed);
            // Check if it was double-stringified
            if (typeof parsed === 'string') {
              parsed = JSON.parse(parsed);
            }
          }
          // Validate that parsed data has expected structure
          if (parsed && typeof parsed === 'object' && 'overallScore' in parsed) {
            console.log('[VoiceAnalysisDisplay] Parsed voice data:', parsed);
            return parsed as VoiceAnalysisReport;
          }
          return null;
        } catch (error) {
          console.error('[VoiceAnalysisDisplay] Failed to parse:', error, 'Raw data:', evaluation.voiceAnalysisData);
          return null;
        }
      })()
    : null;

  // Determine the current display state
  const isReadingPhase = evaluation.currentPhase === 'reading_task';
  const hasVoiceData = voiceData !== null && typeof voiceData.overallScore === 'number';

  // Determine visualization status - matches candidate UI VoiceVisualizer behavior
  const getStatus = (): 'waiting' | 'analyzing' | 'complete' => {
    if (hasVoiceData) return 'complete';
    if (isLive && isReadingPhase) return 'analyzing';
    return 'waiting';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      {/* Header with Live indicator */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-slate-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          Voice Quality Analysis
        </h3>
        {isLive && isReadingPhase && !hasVoiceData && (
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full animate-pulse">
            🔴 Live
          </span>
        )}
      </div>

      {/* Use the unified EvaluatorVoiceVisualizer component - matches Candidate UI exactly */}
      <EvaluatorVoiceVisualizer 
        voiceData={voiceData}
        status={getStatus()}
        sampleCount={voiceData?.sampleCount || 0}
      />
    </div>
  );
}

// Results Tab
function ResultsTab({ batch, onRefresh }: { batch: BatchDetail; onRefresh: () => void }) {
  const completedCandidates = batch.candidates.filter((c) => c.status === "completed");
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateData | null>(null);
  
  // Poll for updates every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      onRefresh();
    }, 5000);
    return () => clearInterval(interval);
  }, [onRefresh]);
  
  // Update selected candidate when batch data changes
  useEffect(() => {
    if (selectedCandidate) {
      const updated = batch.candidates.find(c => c.id === selectedCandidate.id);
      if (updated) {
        setSelectedCandidate(updated);
      }
    }
  }, [batch.candidates, selectedCandidate?.id]);

  const getOverallScore = (candidate: CandidateData): number => {
    if (!candidate.evaluation || candidate.evaluation.scores.length === 0) return 0;
    const total = candidate.evaluation.scores.reduce((sum, s) => sum + s.score, 0);
    return Math.round((total / candidate.evaluation.scores.length) * 10) / 10;
  };

  const exportResults = () => {
    const data = {
      batchId: batch.id,
      batchName: batch.name,
      createdAt: batch.createdAt,
      creator: batch.creator,
      candidates: completedCandidates.map((c) => ({
        ...c,
        overallScore: getOverallScore(c),
      })),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evaluation-results-${batch.name}-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Evaluation Results</h2>
          <p className="text-slate-500 text-sm mt-1">{completedCandidates.length} completed evaluations</p>
        </div>
        <button
          onClick={exportResults}
          className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors"
        >
          Export All Results
        </button>
      </div>

      {completedCandidates.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <p className="text-slate-500">No completed evaluations yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Candidate</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Configuration</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Scored By</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-slate-600">Overall Score</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {completedCandidates.map((candidate) => {
                const overallScore = getOverallScore(candidate);

                return (
                  <tr key={candidate.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{candidate.name}</p>
                      <p className="text-sm text-slate-500">{candidate.email || "No email"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-600">
                        {READING_PASSAGES[candidate.selectedPassage as keyof typeof READING_PASSAGES]?.title ||
                          candidate.selectedPassage}
                      </p>
                      <p className="text-sm text-slate-500">
                        {CALL_SCENARIOS[candidate.selectedScenario as keyof typeof CALL_SCENARIOS]?.level ||
                          candidate.selectedScenario}{" "}
                        Level
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-slate-600">
                        {candidate.evaluation?.scorer?.name || candidate.evaluation?.scorer?.email || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-2xl font-bold ${
                          overallScore >= 4
                            ? "text-emerald-600"
                            : overallScore >= 3
                            ? "text-amber-600"
                            : "text-red-600"
                        }`}
                      >
                        {overallScore || "—"}
                      </span>
                      <span className="text-slate-400">/5</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => setSelectedCandidate(candidate)}
                        className="px-3 py-1 bg-slate-100 text-slate-700 rounded text-sm hover:bg-slate-200 transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Candidate Details Modal */}
      {selectedCandidate && (
        <CandidateDetailsModal 
          candidate={selectedCandidate} 
          onClose={() => setSelectedCandidate(null)}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}

// Candidate Details Modal Component with Evaluator Feedback
function CandidateDetailsModal({ 
  candidate, 
  onClose,
  onRefresh,
}: { 
  candidate: CandidateData; 
  onClose: () => void;
  onRefresh?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "scores" | "voice" | "transcript" | "feedback">("overview");
  const [transcript, setTranscript] = useState<Array<{role: string; content: string; phase: string}>>([]);
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [feedbacks, setFeedbacks] = useState<EvaluatorFeedbackData[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackTarget, setFeedbackTarget] = useState<{
    type: "score" | "voice_quality";
    parameterId?: string;
    parameterLabel?: string;
    voiceMetric?: string;
    currentScore?: number;
  } | null>(null);

  // Load feedback when modal opens or tab changes to feedback
  useEffect(() => {
    if (candidate.evaluation?.id && (activeTab === "feedback" || activeTab === "scores" || activeTab === "voice")) {
      loadFeedback();
    }
  }, [candidate.evaluation?.id, activeTab]);

  // Load transcript when transcript tab is selected
  useEffect(() => {
    if (candidate.evaluation?.id && activeTab === "transcript") {
      loadTranscript();
    }
  }, [candidate.evaluation?.id, activeTab]);

  const loadTranscript = async () => {
    if (!candidate.evaluation?.id) return;
    setLoadingTranscript(true);
    try {
      const response = await fetch(`/api/v2/evaluations/${candidate.evaluation.id}/transcript`);
      if (response.ok) {
        const data = await response.json();
        setTranscript(data);
      }
    } catch (error) {
      console.error("Failed to load transcript:", error);
    } finally {
      setLoadingTranscript(false);
    }
  };

  const loadFeedback = async () => {
    if (!candidate.evaluation?.id) return;
    setLoadingFeedback(true);
    try {
      const data = await fetchEvaluatorFeedback(candidate.evaluation.id);
      setFeedbacks(data);
    } catch (error) {
      console.error("Failed to load feedback:", error);
    } finally {
      setLoadingFeedback(false);
    }
  };

  const getOverallScore = (): number => {
    if (!candidate.evaluation || candidate.evaluation.scores.length === 0) return 0;
    const total = candidate.evaluation.scores.reduce((sum, s) => sum + s.score, 0);
    return Math.round((total / candidate.evaluation.scores.length) * 10) / 10;
  };

  const overallScore = getOverallScore();

  // Get feedback for a specific parameter or metric
  const getFeedbackForItem = (type: "score" | "voice_quality", id: string) => {
    return feedbacks.filter(f => 
      f.feedbackType === type && 
      (type === "score" ? f.score?.parameterId === id : f.voiceMetric === id)
    );
  };

  const handleOpenFeedbackForm = (target: typeof feedbackTarget) => {
    setFeedbackTarget(target);
    setShowFeedbackForm(true);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{candidate.name}</h2>
            <p className="text-slate-500 text-sm">{candidate.email || "No email provided"}</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Tab Navigation */}
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
              {[
                { id: "overview" as const, label: "Overview", icon: "📋" },
                { id: "scores" as const, label: "Scores", icon: "📊" },
                { id: "voice" as const, label: "Voice", icon: "🎙️" },
                { id: "transcript" as const, label: "Transcript", icon: "📝" },
                { id: "feedback" as const, label: "Feedback", icon: "💬" },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id 
                      ? "bg-white text-violet-600 shadow-sm" 
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  <span className="mr-1">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Overall Score */}
              <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-violet-200 text-sm">Overall Score</p>
                    <p className="text-4xl font-bold mt-1">{overallScore > 0 ? `${overallScore}/5` : "No scores yet"}</p>
                    <p className="text-violet-200 text-sm mt-2">
                      {overallScore >= 4 ? "Excellent Performance" : 
                       overallScore >= 3 ? "Good Performance" : 
                       overallScore >= 2 ? "Needs Improvement" : 
                       overallScore > 0 ? "Below Expectations" : "Waiting for evaluation scores"}
                    </p>
                  </div>
                  <div className="text-6xl opacity-20">📊</div>
                </div>
              </div>

              {/* Configuration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm text-slate-500">Reading Passage</p>
                  <p className="font-medium text-slate-800 mt-1">
                    {READING_PASSAGES[candidate.selectedPassage as keyof typeof READING_PASSAGES]?.title || candidate.selectedPassage}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm text-slate-500">Call Scenario</p>
                  <p className="font-medium text-slate-800 mt-1">
                    {CALL_SCENARIOS[candidate.selectedScenario as keyof typeof CALL_SCENARIOS]?.level || candidate.selectedScenario} Level
                  </p>
                </div>
              </div>

              {/* Session Info */}
              {candidate.evaluation && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <h3 className="font-medium text-slate-800 mb-3">Session Information</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Session ID</p>
                      <p className="font-mono text-slate-700 mt-1">{candidate.evaluation.sessionId}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Start Time</p>
                      <p className="text-slate-700 mt-1">
                        {candidate.evaluation.startTime 
                          ? new Date(candidate.evaluation.startTime).toLocaleString() 
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">End Time</p>
                      <p className="text-slate-700 mt-1">
                        {candidate.evaluation.endTime 
                          ? new Date(candidate.evaluation.endTime).toLocaleString() 
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Audio Recording */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  Session Recording
                </h3>
                {candidate.evaluation?.recordingUrl ? (
                  <>
                    <div className="flex items-center gap-4">
                      <audio 
                        controls 
                        src={candidate.evaluation.recordingUrl}
                        className="flex-1 h-10"
                      />
                      <a
                        href={candidate.evaluation.recordingUrl}
                        download={`${candidate.name.replace(/\s+/g, '_')}_${candidate.evaluation.sessionId}.webm`}
                        className="px-3 py-2 bg-violet-100 text-violet-700 rounded-lg text-sm font-medium hover:bg-violet-200 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </a>
                    </div>
                    {candidate.evaluation.recordingDuration > 0 && (
                      <p className="text-xs text-slate-500 mt-2">
                        Duration: {Math.floor(candidate.evaluation.recordingDuration / 60)}:{(candidate.evaluation.recordingDuration % 60).toString().padStart(2, '0')}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <svg className="w-10 h-10 mx-auto text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    <p className="text-slate-500 text-sm">Recording not available</p>
                    <p className="text-slate-400 text-xs mt-1">Audio recording was not saved for this session</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "scores" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-slate-800">Detailed Scores - Review & Provide Feedback</h3>
                <p className="text-sm text-slate-500">Click on any score to provide feedback</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {SCORING_PARAMETERS.map((param) => {
                  const scoreEntry = candidate.evaluation?.scores.find((s) => s.parameterId === param.id);
                  const score = scoreEntry?.score || 0;
                  const scoreReason = scoreEntry?.notes || "";
                  const itemFeedbacks = getFeedbackForItem("score", param.id);
                  const hasFeedback = itemFeedbacks.length > 0;
                  
                  return (
                    <div 
                      key={param.id} 
                      className={`rounded-lg p-4 border-2 transition-all cursor-pointer hover:shadow-md ${
                        hasFeedback 
                          ? "bg-amber-50 border-amber-300" 
                          : "bg-slate-50 border-transparent hover:border-violet-200"
                      }`}
                      onClick={() => handleOpenFeedbackForm({
                        type: "score",
                        parameterId: param.id,
                        parameterLabel: param.label,
                        currentScore: score,
                      })}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">{param.label}</span>
                        <div className="flex items-center gap-2">
                          {hasFeedback && (
                            <span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-xs rounded-full">
                              {itemFeedbacks.length} feedback
                            </span>
                          )}
                          <span className={`text-lg font-bold ${
                            score >= 4 ? "text-emerald-600" : 
                            score >= 3 ? "text-amber-600" : 
                            score > 0 ? "text-red-600" : "text-slate-400"
                          }`}>
                            {score || "—"}/5
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">{param.description}</p>
                      
                      {/* AI Agent's Reason for Score */}
                      {scoreReason && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-2 mb-2">
                          <p className="text-xs text-blue-800 flex items-start gap-1.5">
                            <span className="text-blue-500 mt-0.5">🤖</span>
                            <span><strong>AI Reason:</strong> {scoreReason}</span>
                          </p>
                        </div>
                      )}
                      
                      {/* Score bar */}
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            score >= 4 ? "bg-emerald-500" : 
                            score >= 3 ? "bg-amber-500" : 
                            score > 0 ? "bg-red-500" : "bg-slate-300"
                          }`}
                          style={{ width: `${(score / 5) * 100}%` }}
                        />
                      </div>
                      {/* Show latest feedback preview */}
                      {hasFeedback && (
                        <div className="mt-3 pt-3 border-t border-amber-200">
                          <p className="text-xs text-amber-700 font-medium">Evaluator feedback:</p>
                          <p className="text-xs text-amber-600 mt-1 line-clamp-2">{itemFeedbacks[0].comment}</p>
                          {itemFeedbacks[0].adjustedScore && (
                            <p className="text-xs text-amber-800 mt-1">
                              Adjusted: {itemFeedbacks[0].originalScore} → {itemFeedbacks[0].adjustedScore}
                            </p>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-violet-500 mt-2 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Click to add feedback
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "voice" && candidate.evaluation && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-slate-800">Voice Quality Analysis - Review & Provide Feedback</h3>
                <p className="text-sm text-slate-500">Click on any metric to provide feedback</p>
              </div>
              
              {/* Voice Analysis Display with Feedback */}
              <VoiceAnalysisWithFeedback 
                evaluation={candidate.evaluation}
                feedbacks={feedbacks}
                onAddFeedback={handleOpenFeedbackForm}
              />
            </div>
          )}

          {activeTab === "transcript" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-slate-800">Full Conversation Transcript</h3>
                <button 
                  onClick={loadTranscript}
                  className="text-sm text-violet-600 hover:text-violet-700 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>

              {loadingTranscript ? (
                <div className="text-center py-8 text-slate-500">Loading transcript...</div>
              ) : transcript.length === 0 ? (
                <div className="bg-slate-50 rounded-xl p-8 text-center">
                  <svg className="w-12 h-12 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <p className="text-slate-600 font-medium">No transcript available</p>
                  <p className="text-slate-500 text-sm mt-1">
                    Transcript will appear here after the evaluation is completed
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {transcript.map((item, index) => (
                    <div
                      key={index}
                      className={`flex ${item.role === "user" || item.role === "candidate" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-4 py-3 ${
                          item.role === "user" || item.role === "candidate"
                            ? "bg-violet-100 text-violet-900"
                            : "bg-white border border-slate-200 text-slate-700"
                        }`}
                      >
                        <p className="text-xs font-medium mb-1 flex items-center gap-2">
                          {item.role === "user" || item.role === "candidate" ? (
                            <span className="text-violet-600">👤 Candidate Response</span>
                          ) : (
                            <span className="text-emerald-600">🤖 Eva (AI Evaluator)</span>
                          )}
                          <span className="text-slate-400 text-xs">• {item.phase?.replace(/_/g, " ")}</span>
                        </p>
                        <p className="text-sm leading-relaxed">{item.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "feedback" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-slate-800">Feedback History</h3>
                <button 
                  onClick={loadFeedback}
                  className="text-sm text-violet-600 hover:text-violet-700 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>

              {loadingFeedback ? (
                <div className="text-center py-8 text-slate-500">Loading feedback...</div>
              ) : feedbacks.length === 0 ? (
                <div className="bg-slate-50 rounded-xl p-8 text-center">
                  <svg className="w-12 h-12 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <p className="text-slate-600 font-medium">No feedback yet</p>
                  <p className="text-slate-500 text-sm mt-1">
                    Use the Scores or Voice tabs to review and add feedback
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {feedbacks.map((feedback) => (
                    <FeedbackHistoryItem 
                      key={feedback.id} 
                      feedback={feedback}
                      onDelete={async () => {
                        if (!candidate.evaluation?.id) return;
                        if (!confirm("Delete this feedback?")) return;
                        try {
                          await deleteEvaluatorFeedback(candidate.evaluation.id, feedback.id);
                          await loadFeedback();
                          onRefresh?.();
                        } catch (error) {
                          console.error("Failed to delete feedback:", error);
                          alert("Failed to delete feedback");
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex justify-end gap-3 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              const data = {
                candidate: {
                  name: candidate.name,
                  email: candidate.email,
                  phone: candidate.phone,
                },
                configuration: {
                  passage: candidate.selectedPassage,
                  scenario: candidate.selectedScenario,
                },
                evaluation: candidate.evaluation,
                feedbacks: feedbacks,
                overallScore: getOverallScore(),
                exportedAt: new Date().toISOString(),
              };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `evaluation-${candidate.name}-${new Date().toISOString().split("T")[0]}.json`;
              a.click();
            }}
            className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors"
          >
            Export Details
          </button>
        </div>

        {/* Feedback Form Modal */}
        {showFeedbackForm && feedbackTarget && candidate.evaluation && (
          <FeedbackFormModal
            evaluationId={candidate.evaluation.id}
            target={feedbackTarget}
            onClose={() => {
              setShowFeedbackForm(false);
              setFeedbackTarget(null);
            }}
            onSubmit={async () => {
              await loadFeedback();
              onRefresh?.();
              setShowFeedbackForm(false);
              setFeedbackTarget(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

// Feedback Form Modal Component
function FeedbackFormModal({
  evaluationId,
  target,
  onClose,
  onSubmit,
}: {
  evaluationId: string;
  target: {
    type: "score" | "voice_quality";
    parameterId?: string;
    parameterLabel?: string;
    voiceMetric?: string;
    currentScore?: number;
  };
  onClose: () => void;
  onSubmit: () => void;
}) {
  const [comment, setComment] = useState("");
  const [adjustedScore, setAdjustedScore] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim()) {
      alert("Please enter a comment");
      return;
    }

    setSubmitting(true);
    try {
      await addEvaluatorFeedback(evaluationId, {
        feedbackType: target.type,
        parameterId: target.parameterId,
        voiceMetric: target.voiceMetric,
        originalScore: target.currentScore,
        adjustedScore: adjustedScore ?? undefined,
        comment: comment.trim(),
      });
      onSubmit();
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      alert("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-800">Add Evaluator Feedback</h3>
          <p className="text-slate-500 text-sm mt-1">
            {target.type === "score" 
              ? `Reviewing: ${target.parameterLabel}` 
              : `Reviewing: ${target.voiceMetric?.charAt(0).toUpperCase()}${target.voiceMetric?.slice(1)} Quality`}
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Current Score */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Current AI Score</span>
              <span className="text-lg font-bold text-slate-800">
                {target.currentScore ?? "—"}
                {target.type === "score" ? "/5" : "%"}
              </span>
            </div>
          </div>

          {/* Adjusted Score */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Adjusted Score (optional)
            </label>
            {target.type === "score" ? (
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setAdjustedScore(adjustedScore === n ? null : n)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      adjustedScore === n
                        ? "bg-violet-500 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={adjustedScore ?? target.currentScore ?? 50}
                  onChange={(e) => setAdjustedScore(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-lg font-bold text-slate-800 w-16 text-right">
                  {adjustedScore ?? target.currentScore ?? 50}%
                </span>
              </div>
            )}
            {adjustedScore !== null && (
              <button 
                onClick={() => setAdjustedScore(null)}
                className="text-xs text-slate-500 hover:text-slate-700 mt-2"
              >
                Clear adjustment
              </button>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Feedback Comment <span className="text-red-500">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Explain your feedback or reason for adjusting the score..."
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            />
          </div>

          <p className="text-xs text-slate-500">
            💡 Your feedback will be saved and used to improve future AI evaluations
          </p>
        </div>

        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !comment.trim()}
            className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Submitting..." : "Submit Feedback"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Feedback History Item Component
function FeedbackHistoryItem({
  feedback,
  onDelete,
}: {
  feedback: EvaluatorFeedbackData;
  onDelete: () => void;
}) {
  const getTargetLabel = () => {
    if (feedback.feedbackType === "score" && feedback.score) {
      const param = SCORING_PARAMETERS.find(p => p.id === feedback.score?.parameterId);
      return param?.label || feedback.score.parameterId;
    }
    if (feedback.feedbackType === "voice_quality" && feedback.voiceMetric) {
      return `${feedback.voiceMetric.charAt(0).toUpperCase()}${feedback.voiceMetric.slice(1)} Quality`;
    }
    return "Unknown";
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {/* Evaluator Avatar */}
          <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
            {feedback.evaluator.image ? (
              <img 
                src={feedback.evaluator.image} 
                alt={feedback.evaluator.name || ""} 
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <span className="text-violet-600 font-medium">
                {(feedback.evaluator.name || feedback.evaluator.email || "?").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-slate-800">
                {feedback.evaluator.name || feedback.evaluator.email}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500">
                {new Date(feedback.sessionDate).toLocaleString()}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                feedback.feedbackType === "score" 
                  ? "bg-blue-100 text-blue-700" 
                  : "bg-purple-100 text-purple-700"
              }`}>
                {feedback.feedbackType === "score" ? "Score" : "Voice"}
              </span>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">
                {getTargetLabel()}
              </span>
            </div>
            
            <p className="text-slate-700 mt-2">{feedback.comment}</p>
            
            {(feedback.originalScore !== null || feedback.adjustedScore !== null) && (
              <div className="flex items-center gap-4 mt-3 text-sm">
                {feedback.originalScore !== null && (
                  <span className="text-slate-500">
                    Original: <strong className="text-slate-700">
                      {feedback.originalScore}{feedback.feedbackType === "voice_quality" ? "%" : "/5"}
                    </strong>
                  </span>
                )}
                {feedback.adjustedScore !== null && (
                  <span className="text-emerald-600">
                    → Adjusted: <strong>
                      {feedback.adjustedScore}{feedback.feedbackType === "voice_quality" ? "%" : "/5"}
                    </strong>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onDelete}
          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
          title="Delete feedback"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Voice Analysis with Feedback Component
function VoiceAnalysisWithFeedback({
  evaluation,
  feedbacks,
  onAddFeedback,
}: {
  evaluation: EvaluationData;
  feedbacks: EvaluatorFeedbackData[];
  onAddFeedback: (target: {
    type: "score" | "voice_quality";
    voiceMetric?: string;
    currentScore?: number;
  }) => void;
}) {
  // Parse voice analysis data
  const voiceData: VoiceAnalysisReport | null = evaluation.voiceAnalysisData 
    ? (() => {
        try {
          let parsed: unknown = evaluation.voiceAnalysisData;
          if (typeof parsed === 'string') {
            parsed = JSON.parse(parsed);
            if (typeof parsed === 'string') {
              parsed = JSON.parse(parsed);
            }
          }
          if (parsed && typeof parsed === 'object' && 'overallScore' in parsed) {
            return parsed as VoiceAnalysisReport;
          }
          return null;
        } catch {
          return null;
        }
      })()
    : null;

  if (!voiceData) {
    return (
      <div className="bg-slate-50 rounded-xl p-8 text-center">
        <p className="text-slate-500">No voice analysis data available</p>
      </div>
    );
  }

  const metrics = [
    { id: "clarity", label: "Clarity", score: voiceData.clarityScore, target: 85 },
    { id: "volume", label: "Volume", score: voiceData.volumeScore, target: 70 },
    { id: "tone", label: "Tone", score: voiceData.toneScore, target: 80 },
    { id: "pace", label: "Pace", score: voiceData.paceScore, target: 75 },
    { id: "overall", label: "Overall", score: voiceData.overallScore, target: 75 },
  ];

  const getFeedbackForMetric = (metricId: string) => {
    return feedbacks.filter(f => f.feedbackType === "voice_quality" && f.voiceMetric === metricId);
  };

  return (
    <div className="space-y-4">
      {/* Overall Score Card */}
      <div 
        className={`rounded-xl p-6 cursor-pointer hover:shadow-md transition-all ${
          getFeedbackForMetric("overall").length > 0 
            ? "bg-amber-50 border-2 border-amber-300" 
            : "bg-gradient-to-r from-emerald-500 to-teal-600"
        }`}
        onClick={() => onAddFeedback({
          type: "voice_quality",
          voiceMetric: "overall",
          currentScore: voiceData.overallScore,
        })}
      >
        <div className="flex items-center justify-between">
          <div className={getFeedbackForMetric("overall").length > 0 ? "text-amber-900" : "text-white"}>
            <p className={`text-sm ${getFeedbackForMetric("overall").length > 0 ? "text-amber-700" : "opacity-80"}`}>
              Overall Voice Quality Score
            </p>
            <p className="text-4xl font-bold mt-1">{voiceData.overallScore}%</p>
            <p className={`text-sm mt-2 ${getFeedbackForMetric("overall").length > 0 ? "text-amber-700" : "opacity-80"}`}>
              {voiceData.assessment}
            </p>
          </div>
          <div className={`text-6xl ${getFeedbackForMetric("overall").length > 0 ? "opacity-30" : "opacity-20"}`}>🎙️</div>
        </div>
        {getFeedbackForMetric("overall").length > 0 && (
          <div className="mt-3 pt-3 border-t border-amber-300">
            <p className="text-xs text-amber-700 font-medium">Has {getFeedbackForMetric("overall").length} feedback</p>
          </div>
        )}
        <p className={`text-xs mt-2 flex items-center gap-1 ${getFeedbackForMetric("overall").length > 0 ? "text-amber-600" : "text-white/60"}`}>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Click to add feedback
        </p>
      </div>

      {/* Individual Metrics */}
      <div className="grid grid-cols-2 gap-4">
        {metrics.filter(m => m.id !== "overall").map((metric) => {
          const metricFeedbacks = getFeedbackForMetric(metric.id);
          const hasFeedback = metricFeedbacks.length > 0;

          return (
            <div
              key={metric.id}
              className={`rounded-lg p-4 cursor-pointer hover:shadow-md transition-all border-2 ${
                hasFeedback 
                  ? "bg-amber-50 border-amber-300" 
                  : "bg-slate-50 border-transparent hover:border-violet-200"
              }`}
              onClick={() => onAddFeedback({
                type: "voice_quality",
                voiceMetric: metric.id,
                currentScore: metric.score,
              })}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">{metric.label}</span>
                <div className="flex items-center gap-2">
                  {hasFeedback && (
                    <span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-xs rounded-full">
                      {metricFeedbacks.length} feedback
                    </span>
                  )}
                  <span className={`text-lg font-bold ${
                    metric.score >= metric.target ? "text-emerald-600" : "text-amber-600"
                  }`}>
                    {metric.score}%
                  </span>
                </div>
              </div>
              
              {/* Progress bar with target */}
              <div className="relative h-3 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${metric.score >= metric.target ? "bg-emerald-500" : "bg-amber-500"}`}
                  style={{ width: `${metric.score}%` }}
                />
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500"
                  style={{ left: `${metric.target}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Target: {metric.target}%</p>

              {hasFeedback && (
                <div className="mt-3 pt-3 border-t border-amber-200">
                  <p className="text-xs text-amber-700 font-medium">Latest:</p>
                  <p className="text-xs text-amber-600 mt-1 line-clamp-2">{metricFeedbacks[0].comment}</p>
                </div>
              )}
              
              <p className="text-xs text-violet-500 mt-2 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Click to add feedback
              </p>
            </div>
          );
        })}
      </div>

      {/* Strengths & Recommendations */}
      {(voiceData.strengths?.length > 0 || voiceData.recommendations?.length > 0) && (
        <div className="grid grid-cols-2 gap-4">
          {voiceData.strengths?.length > 0 && (
            <div className="border border-green-200 bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Strengths
              </h4>
              <ul className="space-y-1">
                {voiceData.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                    <span>✓</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {voiceData.recommendations?.length > 0 && (
            <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Recommendations for Improvement
              </h4>
              <ul className="space-y-1">
                {voiceData.recommendations.map((r, i) => (
                  <li key={i} className="text-sm text-yellow-700 flex items-start gap-2">
                    <span>→</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Calculation Breakdown */}
      <div className="border border-slate-200 rounded-lg p-4 bg-white">
        <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Calculation Breakdown
        </h4>
        <div className="space-y-3">
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-700">Clarity</span>
              <span className="text-emerald-600 font-bold">{voiceData.clarityScore}%</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Raw: {voiceData.avgClarity} | Method: Spectral peak-to-average ratio
            </p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-700">Volume</span>
              <span className="text-emerald-600 font-bold">{voiceData.volumeScore}%</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Raw: {voiceData.avgVolume} | Method: RMS (Root Mean Square)
            </p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-700">Tone</span>
              <span className="text-emerald-600 font-bold">{voiceData.toneScore}%</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Raw: {voiceData.avgPitch} Hz | Method: Autocorrelation pitch detection
            </p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-700">Pace</span>
              <span className="text-emerald-600 font-bold">{voiceData.paceScore}%</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Raw: {voiceData.avgPace} | Method: Voice activity detection
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
            <strong>Overall Score Formula:</strong><br/>
            (Clarity × 35%) + (Volume × 25%) + (Pace × 25%) + (Tone × 15%)
          </div>
        </div>
      </div>

      {/* Call Center Suitability */}
      <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
        <h4 className="font-medium text-slate-700 mb-3">Call Center Agent Suitability</h4>
        <div className="space-y-2 text-sm">
          <p className="flex items-center gap-2">
            <strong className="text-slate-600">Voice Clarity:</strong>
            <span className={voiceData.clarityScore >= 70 ? "text-emerald-600" : "text-amber-600"}>
              {voiceData.clarityScore >= 70 ? '✓ Meets requirements' : '⚠ Needs improvement'}
            </span>
          </p>
          <p className="flex items-center gap-2">
            <strong className="text-slate-600">Volume Projection:</strong>
            <span className={voiceData.volumeScore >= 50 ? "text-emerald-600" : "text-amber-600"}>
              {voiceData.volumeScore >= 50 ? '✓ Adequate' : '⚠ Too soft'}
            </span>
          </p>
          <p className="flex items-center gap-2">
            <strong className="text-slate-600">Speaking Pace:</strong>
            <span className={(voiceData.paceScore >= 30 && voiceData.paceScore <= 70) ? "text-emerald-600" : "text-amber-600"}>
              {(voiceData.paceScore >= 30 && voiceData.paceScore <= 70) ? '✓ Appropriate' : '⚠ Adjust pace'}
            </span>
          </p>
          <div className="pt-2 mt-2 border-t border-slate-200">
            <p className="flex items-center gap-2">
              <strong className="text-slate-700">Overall Recommendation:</strong>
              <span className={`font-bold ${
                voiceData.overallScore >= 65 ? "text-emerald-600" : 
                voiceData.overallScore >= 50 ? "text-amber-600" : "text-red-600"
              }`}>
                {voiceData.overallScore >= 65 ? 'Recommended' : 
                 voiceData.overallScore >= 50 ? 'Conditional - Training Recommended' : 
                 'Not Recommended'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Settings Tab
function SettingsTab({
  batch,
  onRefresh,
  onBatchDeleted,
}: {
  batch: BatchDetail;
  onRefresh: () => void;
  onBatchDeleted: () => void;
}) {
  const [batchNameInput, setBatchNameInput] = useState(batch.name);
  const [saving, setSaving] = useState(false);

  const handleSaveName = async () => {
    setSaving(true);
    try {
      await updateBatch(batch.id, { name: batchNameInput });
      onRefresh();
    } catch (error) {
      console.error("Failed to update batch:", error);
      alert("Failed to update batch name");
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm("Are you sure you want to archive this batch?")) return;
    try {
      await updateBatch(batch.id, { status: "archived" });
      onRefresh();
    } catch (error) {
      console.error("Failed to archive batch:", error);
      alert("Failed to archive batch");
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-medium text-slate-800 mb-4">Batch Settings</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-600 mb-2">Batch Name</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={batchNameInput}
                onChange={(e) => setBatchNameInput(e.target.value)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <button
                onClick={handleSaveName}
                disabled={saving || batchNameInput === batch.name}
                className="px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-2">Batch ID</label>
            <p className="font-mono text-sm text-slate-500 bg-slate-50 px-3 py-2 rounded">{batch.id}</p>
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-2">Created By</label>
            <p className="text-slate-700">{batch.creator.name || batch.creator.email}</p>
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-2">Created</label>
            <p className="text-slate-700">{new Date(batch.createdAt).toLocaleString()}</p>
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-2">Status</label>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                batch.status === "active"
                  ? "bg-emerald-100 text-emerald-700"
                  : batch.status === "completed"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
        <h3 className="font-medium text-amber-800 mb-2">Archive Batch</h3>
        <p className="text-sm text-amber-600 mb-4">
          Archive this batch when all evaluations are complete. Archived batches are read-only.
        </p>
        <button
          onClick={handleArchive}
          disabled={batch.status === "archived"}
          className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
        >
          {batch.status === "archived" ? "Already Archived" : "Archive Batch"}
        </button>
      </div>
    </div>
  );
}
