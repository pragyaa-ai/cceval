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
          <ResultsTab batch={activeBatch} />
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
                      className="px-2 py-1 border border-slate-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className="px-2 py-1 border border-slate-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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

  const activeCandidates = batch.candidates.filter((c) => c.status === "in_progress");
  const activeCandidate = batch.candidates.find((c) => c.id === activeCandidateId);

  const handleAddScore = async (evaluationId: string, parameterId: string, score: number) => {
    try {
      await addScore(evaluationId, { parameterId, score });
      onRefresh();
    } catch (error) {
      console.error("Failed to add score:", error);
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
                <p className="font-medium text-slate-800">{candidate.name}</p>
                <p className="text-xs text-slate-500 mt-1">Code: {candidate.accessCode}</p>
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
                  <p className="text-slate-500">Session: {activeCandidate.evaluation.sessionId}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Current Phase</p>
                  <p className="text-lg font-medium text-violet-600 capitalize">
                    {activeCandidate.evaluation.currentPhase.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
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

// Results Tab
function ResultsTab({ batch }: { batch: BatchDetail }) {
  const completedCandidates = batch.candidates.filter((c) => c.status === "completed");

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
                      <button className="px-3 py-1 bg-slate-100 text-slate-700 rounded text-sm hover:bg-slate-200 transition-colors">
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
