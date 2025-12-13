"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  BatchSummary,
  BatchDetail,
  CandidateData,
  EvaluationData,
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
  const [newCandidate, setNewCandidate] = useState({ name: "", email: "", phone: "" });
  const [adding, setAdding] = useState(false);

  const handleAddSingle = async () => {
    if (!newCandidate.name.trim()) return;
    setAdding(true);
    try {
      await addCandidates(batch.id, [newCandidate]);
      setNewCandidate({ name: "", email: "", phone: "" });
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
              <p className="text-xs text-slate-500 mb-2">Format: Name, Email, Phone (one per line)</p>
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
                </div>
                <div className="flex items-center gap-4">
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
              {/* Live Transcript */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="font-medium text-slate-800 flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    Live Transcript
                  </h3>
                  <span className="text-xs text-slate-500">{transcript.length} messages</span>
                </div>
                <div className="h-80 overflow-y-auto p-4 space-y-3 bg-slate-50">
                  {isLoadingTranscript && transcript.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">Loading transcript...</p>
                  ) : transcript.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">Waiting for conversation...</p>
                  ) : (
                    transcript.map((item, index) => (
                      <div
                        key={index}
                        className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                            item.role === "user"
                              ? "bg-violet-100 text-violet-900"
                              : "bg-white border border-slate-200 text-slate-700"
                          }`}
                        >
                          <p className="text-xs font-medium mb-1 opacity-60">
                            {item.role === "user" ? "Candidate" : "Eva"}
                          </p>
                          <p>{item.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Voice Quality Analysis */}
              <VoiceAnalysisPanel 
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

// Voice Analysis Panel Component
function VoiceAnalysisPanel({ 
  evaluation, 
  isLive = false 
}: { 
  evaluation: EvaluationData; 
  isLive?: boolean;
}) {
  // State for live animation
  const [liveMetrics, setLiveMetrics] = useState({ clarity: 60, volume: 55, tone: 50, pace: 65 });

  // Animate live metrics
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setLiveMetrics({
        clarity: Math.max(30, Math.min(90, 60 + Math.random() * 40 - 20)),
        volume: Math.max(30, Math.min(90, 55 + Math.random() * 40 - 20)),
        tone: Math.max(30, Math.min(90, 50 + Math.random() * 40 - 20)),
        pace: Math.max(30, Math.min(90, 65 + Math.random() * 40 - 20)),
      });
    }, 500);
    return () => clearInterval(interval);
  }, [isLive]);

  // Parse voice analysis data if available
  const voiceData = evaluation.voiceAnalysisData 
    ? (() => {
        try {
          console.log('[VoiceAnalysisPanel] Raw voiceAnalysisData:', evaluation.voiceAnalysisData);
          const parsed = JSON.parse(evaluation.voiceAnalysisData);
          console.log('[VoiceAnalysisPanel] ✅ Successfully parsed voiceData:', {
            hasData: !!parsed,
            overallScore: parsed?.overallScore,
            sampleCount: parsed?.sampleCount,
            hasStrengths: Array.isArray(parsed?.strengths) && parsed.strengths.length > 0,
            hasRecommendations: Array.isArray(parsed?.recommendations) && parsed.recommendations.length > 0
          });
          return parsed;
        } catch (error) {
          console.error('[VoiceAnalysisPanel] ❌ Failed to parse voiceAnalysisData:', error);
          return null;
        }
      })()
    : (console.log('[VoiceAnalysisPanel] ⚠️ No voiceAnalysisData available in evaluation'), null);
  
  console.log('[VoiceAnalysisPanel] Display state:', {
    isLive,
    hasVoiceData: !!voiceData,
    currentPhase: evaluation.currentPhase,
    evaluationId: evaluation.id
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200">
        <h3 className="font-medium text-slate-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          {isLive ? "Voice Analysis (Live)" : "Voice Quality Analysis"}
        </h3>
      </div>
      <div className="p-4">
        {isLive ? (
          // Live analysis in progress - animated bars
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Analyzing voice quality...
            </div>
            
            {/* Live waveform visualization */}
            <div className="h-16 bg-slate-50 rounded-lg flex items-center justify-center gap-0.5 overflow-hidden">
              {Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-gradient-to-t from-violet-400 to-violet-600 rounded-full transition-all duration-150"
                  style={{
                    height: `${20 + Math.random() * 60}%`,
                    animationDelay: `${i * 50}ms`
                  }}
                />
              ))}
            </div>

            <div className="space-y-3">
              {[
                { name: "Clarity", value: liveMetrics.clarity },
                { name: "Volume", value: liveMetrics.volume },
                { name: "Tone", value: liveMetrics.tone },
                { name: "Pace", value: liveMetrics.pace }
              ].map((metric) => (
                <div key={metric.name} className="flex items-center gap-3">
                  <span className="text-sm text-slate-600 w-16">{metric.name}</span>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-violet-400 to-violet-600 rounded-full transition-all duration-300"
                      style={{ width: `${metric.value}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-8">{Math.round(metric.value)}%</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-4">
              Voice metrics are being collected during paragraph reading.
            </p>
          </div>
        ) : voiceData ? (
          // Show completed voice analysis
          <div className="space-y-4">
            {/* Overall Score */}
            <div className="text-center p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl">
              <p className="text-sm text-slate-500">Overall Voice Score</p>
              <p className={`text-4xl font-bold ${
                voiceData.overallScore >= 80 ? "text-emerald-600" :
                voiceData.overallScore >= 60 ? "text-amber-600" :
                "text-red-600"
              }`}>
                {voiceData.overallScore}%
              </p>
              <p className={`text-sm mt-1 ${
                voiceData.overallScore >= 80 ? "text-emerald-600" :
                voiceData.overallScore >= 60 ? "text-amber-600" :
                "text-red-600"
              }`}>
                {voiceData.assessment || (
                  voiceData.overallScore >= 80 ? "Excellent" :
                  voiceData.overallScore >= 60 ? "Good" :
                  "Needs Improvement"
                )}
              </p>
            </div>

            {/* Metrics */}
            <div className="space-y-3">
              {[
                { name: "Clarity", score: voiceData.clarityScore, target: 85 },
                { name: "Volume", score: voiceData.volumeScore, target: 70 },
                { name: "Tone", score: voiceData.toneScore, target: 80 },
                { name: "Pace", score: voiceData.paceScore, target: 75 },
              ].map((metric) => (
                <div key={metric.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-600">{metric.name}</span>
                    <span className="text-sm font-medium text-slate-800">{Math.round(metric.score || 0)}%</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden relative">
                    <div 
                      className={`h-full rounded-full ${
                        (metric.score || 0) >= metric.target ? "bg-emerald-500" :
                        (metric.score || 0) >= metric.target * 0.7 ? "bg-amber-500" :
                        "bg-red-500"
                      }`}
                      style={{ width: `${Math.min(100, metric.score || 0)}%` }}
                    />
                    {/* Target line */}
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-red-400"
                      style={{ left: `${metric.target}%` }}
                      title={`Target: ${metric.target}%`}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Strengths */}
            {voiceData.strengths && voiceData.strengths.length > 0 && (
              <div className="bg-emerald-50 rounded-lg p-3">
                <p className="text-xs font-medium text-emerald-800 mb-2">✓ Strengths</p>
                <ul className="text-xs text-emerald-700 space-y-1">
                  {voiceData.strengths.map((s: string, i: number) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {voiceData.recommendations && voiceData.recommendations.length > 0 && (
              <div className="bg-amber-50 rounded-lg p-3">
                <p className="text-xs font-medium text-amber-800 mb-2">→ Recommendations</p>
                <ul className="text-xs text-amber-700 space-y-1">
                  {voiceData.recommendations.map((r: string, i: number) => (
                    <li key={i}>• {r}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sample info */}
            {voiceData.sampleCount && (
              <p className="text-xs text-slate-400 text-center">
                Based on {voiceData.sampleCount} samples ({voiceData.duration || "N/A"}s of speech)
              </p>
            )}
          </div>
        ) : (
          // No data yet
          <div className="text-center py-8 text-slate-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <p className="text-sm">Voice analysis will be available after Reading Task</p>
          </div>
        )}
      </div>
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
        />
      )}
    </div>
  );
}

// Candidate Details Modal Component
function CandidateDetailsModal({ 
  candidate, 
  onClose 
}: { 
  candidate: CandidateData; 
  onClose: () => void;
}) {
  const getOverallScore = (): number => {
    if (!candidate.evaluation || candidate.evaluation.scores.length === 0) return 0;
    const total = candidate.evaluation.scores.reduce((sum, s) => sum + s.score, 0);
    return Math.round((total / candidate.evaluation.scores.length) * 10) / 10;
  };

  const overallScore = getOverallScore();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{candidate.name}</h2>
            <p className="text-slate-500 text-sm">{candidate.email || "No email provided"}</p>
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

        <div className="p-6 space-y-6">
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
                {overallScore === 0 && (
                  <p className="text-xs text-violet-300 mt-2">
                    {candidate.evaluation?.scores.length || 0} parameters scored
                  </p>
                )}
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

          {/* Detailed Scores */}
          <div>
            <h3 className="font-medium text-slate-800 mb-4">Detailed Scores</h3>
            <div className="grid grid-cols-2 gap-4">
              {SCORING_PARAMETERS.map((param) => {
                const scoreEntry = candidate.evaluation?.scores.find((s) => s.parameterId === param.id);
                const score = scoreEntry?.score || 0;
                
                return (
                  <div key={param.id} className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">{param.label}</span>
                      <span className={`text-lg font-bold ${
                        score >= 4 ? "text-emerald-600" : 
                        score >= 3 ? "text-amber-600" : 
                        score > 0 ? "text-red-600" : "text-slate-400"
                      }`}>
                        {score || "—"}/5
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{param.description}</p>
                    {/* Score bar */}
                    <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          score >= 4 ? "bg-emerald-500" : 
                          score >= 3 ? "bg-amber-500" : 
                          score > 0 ? "bg-red-500" : "bg-slate-300"
                        }`}
                        style={{ width: `${(score / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Voice Quality Analysis */}
          {candidate.evaluation && (
            <VoiceAnalysisPanel evaluation={candidate.evaluation} />
          )}

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
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
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
