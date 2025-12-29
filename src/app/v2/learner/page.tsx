"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  USE_CASE_LABELS, 
  READING_PASSAGES, 
  CALL_SCENARIOS,
  SCORING_PARAMETERS_BY_USE_CASE,
  UseCase 
} from "../contexts/V2EvaluationContext";

interface TrainingModule {
  id: string;
  useCase: UseCase;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: string;
  completedSessions: number;
  totalSessions: number;
  lastScore?: number;
  isNew?: boolean;
}

export default function ContinuousLearnerPage() {
  const [learnerName, setLearnerName] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [selectedUseCase, setSelectedUseCase] = useState<UseCase | null>(null);
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);
  const [showPracticeMode, setShowPracticeMode] = useState(false);
  const [practiceHistory, setPracticeHistory] = useState<Array<{
    date: string;
    module: string;
    score: number;
    feedback: string;
  }>>([]);

  // Sample training modules
  const trainingModules: TrainingModule[] = [
    // Exit Interview Modules
    {
      id: "exit_basics",
      useCase: "exits",
      title: "Exit Interview Fundamentals",
      description: "Learn the basics of conducting effective exit interviews with departing employees.",
      difficulty: "beginner",
      duration: "15 min",
      completedSessions: 3,
      totalSessions: 5,
      lastScore: 78,
    },
    {
      id: "exit_retention",
      useCase: "exits",
      title: "Retention Conversation Mastery",
      description: "Practice handling employees who might be open to staying with the right intervention.",
      difficulty: "intermediate",
      duration: "20 min",
      completedSessions: 1,
      totalSessions: 5,
      lastScore: 65,
    },
    {
      id: "exit_difficult",
      useCase: "exits",
      title: "Handling Difficult Exit Conversations",
      description: "Advanced scenarios with frustrated or upset departing employees.",
      difficulty: "advanced",
      duration: "25 min",
      completedSessions: 0,
      totalSessions: 5,
    },
    // NHE Modules
    {
      id: "nhe_welcome",
      useCase: "nhe",
      title: "New Hire Welcome Calls",
      description: "Master the art of making new employees feel welcomed and supported.",
      difficulty: "beginner",
      duration: "15 min",
      completedSessions: 4,
      totalSessions: 5,
      lastScore: 85,
    },
    {
      id: "nhe_concerns",
      useCase: "nhe",
      title: "Addressing New Hire Concerns",
      description: "Handle common concerns and questions from new employees during onboarding.",
      difficulty: "intermediate",
      duration: "20 min",
      completedSessions: 2,
      totalSessions: 5,
      lastScore: 72,
    },
    {
      id: "nhe_struggling",
      useCase: "nhe",
      title: "Supporting Struggling New Hires",
      description: "Identify and help new employees who are facing challenges in their role.",
      difficulty: "advanced",
      duration: "25 min",
      completedSessions: 0,
      totalSessions: 5,
      isNew: true,
    },
    // CE Modules
    {
      id: "ce_routine",
      useCase: "ce",
      title: "Routine Engagement Check-ins",
      description: "Conduct effective regular engagement calls with existing employees.",
      difficulty: "beginner",
      duration: "15 min",
      completedSessions: 5,
      totalSessions: 5,
      lastScore: 92,
    },
    {
      id: "ce_concerns",
      useCase: "ce",
      title: "Addressing Employee Concerns",
      description: "Handle workplace concerns and feedback professionally.",
      difficulty: "intermediate",
      duration: "20 min",
      completedSessions: 3,
      totalSessions: 5,
      lastScore: 80,
    },
    {
      id: "ce_attrition",
      useCase: "ce",
      title: "Managing Attrition Risk",
      description: "Identify and address employees who may be considering leaving.",
      difficulty: "advanced",
      duration: "25 min",
      completedSessions: 1,
      totalSessions: 5,
      lastScore: 68,
      isNew: true,
    },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (learnerName && employeeId) {
      setIsAuthenticated(true);
      // Simulate loading practice history
      setPracticeHistory([
        { date: "2025-12-28", module: "Exit Interview Fundamentals", score: 78, feedback: "Good probing skills, work on closure" },
        { date: "2025-12-27", module: "New Hire Welcome Calls", score: 85, feedback: "Excellent enthusiasm and language" },
        { date: "2025-12-26", module: "Routine Engagement Check-ins", score: 92, feedback: "Outstanding performance" },
      ]);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-emerald-100 text-emerald-700";
      case "intermediate": return "bg-amber-100 text-amber-700";
      case "advanced": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const getProgressColor = (completed: number, total: number) => {
    const percent = (completed / total) * 100;
    if (percent >= 80) return "bg-emerald-500";
    if (percent >= 50) return "bg-amber-500";
    return "bg-slate-300";
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };

  const filteredModules = selectedUseCase 
    ? trainingModules.filter(m => m.useCase === selectedUseCase)
    : trainingModules;

  // Not authenticated - show login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/v2" className="inline-block">
              <Image
                src="/pragyaa-logo.svg"
                alt="Pragyaa Logo"
                width={100}
                height={35}
                className="mx-auto mb-4 opacity-80"
              />
            </Link>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
              Continuous Learner
            </h1>
            <p className="text-slate-500 mt-2">Practice and improve with EVA</p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={learnerName}
                  onChange={(e) => setLearnerName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Employee ID
                </label>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="Enter your employee ID"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/25"
              >
                Start Learning
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <Link
                href="/v2"
                className="flex items-center justify-center gap-2 text-slate-500 hover:text-slate-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Practice mode
  if (showPracticeMode && selectedModule) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => { setShowPracticeMode(false); setSelectedModule(null); }}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Modules
            </button>
            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
              Practice Mode
            </span>
          </div>

          {/* Module Header */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 ${getDifficultyColor(selectedModule.difficulty)}`}>
                  {selectedModule.difficulty.charAt(0).toUpperCase() + selectedModule.difficulty.slice(1)}
                </span>
                <h1 className="text-2xl font-bold text-slate-800">{selectedModule.title}</h1>
                <p className="text-slate-500 mt-2">{selectedModule.description}</p>
              </div>
              <span className="text-3xl">
                {selectedModule.useCase === "exits" ? "👋" : selectedModule.useCase === "nhe" ? "🎉" : "💬"}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-slate-800">{selectedModule.duration}</p>
                <p className="text-sm text-slate-500">Duration</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-slate-800">{selectedModule.completedSessions}/{selectedModule.totalSessions}</p>
                <p className="text-sm text-slate-500">Sessions</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className={`text-2xl font-bold ${selectedModule.lastScore ? getScoreColor(selectedModule.lastScore) : 'text-slate-400'}`}>
                  {selectedModule.lastScore ? `${selectedModule.lastScore}%` : '—'}
                </p>
                <p className="text-sm text-slate-500">Best Score</p>
              </div>
            </div>
          </div>

          {/* Practice Options */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Reading Passage Practice */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <span className="text-white text-xl">📖</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Reading Practice</h3>
                  <p className="text-sm text-slate-500">Practice voice clarity and pace</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Read passages aloud to improve your articulation, pace, and tone for professional conversations.
              </p>
              <button className="w-full py-2.5 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors">
                Start Reading Practice
              </button>
            </div>

            {/* Role-Play Practice */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <span className="text-white text-xl">🎭</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Role-Play Simulation</h3>
                  <p className="text-sm text-slate-500">Practice real scenarios with EVA</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Engage in realistic conversations with EVA acting as an employee. Get instant feedback on your performance.
              </p>
              <button className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 transition-colors">
                Start Role-Play
              </button>
            </div>
          </div>

          {/* Scoring Criteria Info */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 mb-4">Evaluation Criteria for {USE_CASE_LABELS[selectedModule.useCase]}</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {SCORING_PARAMETERS_BY_USE_CASE[selectedModule.useCase].map((param) => (
                <div key={param.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <span className="text-amber-500 mt-0.5">📊</span>
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{param.label}</p>
                    <p className="text-xs text-slate-500">{param.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/v2">
                <Image
                  src="/pragyaa-logo.svg"
                  alt="Pragyaa Logo"
                  width={90}
                  height={30}
                  className="opacity-80"
                />
              </Link>
              <div className="h-8 w-px bg-slate-200" />
              <div>
                <h1 className="text-xl font-bold text-slate-800">Continuous Learner</h1>
                <p className="text-sm text-slate-500">Practice & Improve with EVA</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium text-slate-800">{learnerName}</p>
                <p className="text-sm text-slate-500">ID: {employeeId}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold">
                {learnerName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-slate-500 text-sm mb-1">Total Practice Sessions</p>
            <p className="text-3xl font-bold text-slate-800">23</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-slate-500 text-sm mb-1">Average Score</p>
            <p className="text-3xl font-bold text-emerald-600">82%</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-slate-500 text-sm mb-1">Modules Completed</p>
            <p className="text-3xl font-bold text-slate-800">5/9</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-slate-500 text-sm mb-1">Practice Streak</p>
            <p className="text-3xl font-bold text-amber-600">🔥 7 days</p>
          </div>
        </div>

        {/* Use Case Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedUseCase(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !selectedUseCase
                ? "bg-amber-500 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
            }`}
          >
            All Use Cases
          </button>
          {(Object.keys(USE_CASE_LABELS) as UseCase[]).map((useCase) => (
            <button
              key={useCase}
              onClick={() => setSelectedUseCase(useCase)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedUseCase === useCase
                  ? "bg-amber-500 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
              }`}
            >
              {USE_CASE_LABELS[useCase]}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Training Modules */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-slate-800">Training Modules</h2>
            
            <div className="space-y-3">
              {filteredModules.map((module) => (
                <div
                  key={module.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => { setSelectedModule(module); setShowPracticeMode(true); }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">
                        {module.useCase === "exits" ? "👋" : module.useCase === "nhe" ? "🎉" : "💬"}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-800">{module.title}</h3>
                          {module.isNew && (
                            <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs rounded-full font-medium">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500">{module.description}</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(module.difficulty)}`}>
                        {module.difficulty.charAt(0).toUpperCase() + module.difficulty.slice(1)}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {module.duration}
                      </span>
                      <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full">
                        {USE_CASE_LABELS[module.useCase]}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Progress */}
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${getProgressColor(module.completedSessions, module.totalSessions)}`}
                            style={{ width: `${(module.completedSessions / module.totalSessions) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">
                          {module.completedSessions}/{module.totalSessions}
                        </span>
                      </div>

                      {/* Score */}
                      {module.lastScore && (
                        <span className={`font-bold ${getScoreColor(module.lastScore)}`}>
                          {module.lastScore}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Practice */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-800 mb-4">Recent Practice</h3>
              <div className="space-y-3">
                {practiceHistory.map((session, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-slate-800 text-sm">{session.module}</p>
                      <span className={`font-bold text-sm ${getScoreColor(session.score)}`}>
                        {session.score}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{session.feedback}</p>
                    <p className="text-xs text-slate-400 mt-1">{session.date}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-5">
              <h3 className="font-bold text-slate-800 mb-3">💡 Practice Tips</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  Practice daily for 15-20 minutes
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  Focus on one use case at a time
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  Review feedback after each session
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  Work on your weakest metrics first
                </li>
              </ul>
            </div>

            {/* Quick Start */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-800 mb-3">🚀 Quick Start</h3>
              <button 
                onClick={() => {
                  const randomModule = trainingModules[Math.floor(Math.random() * trainingModules.length)];
                  setSelectedModule(randomModule);
                  setShowPracticeMode(true);
                }}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl hover:from-amber-600 hover:to-orange-600 transition-colors"
              >
                Random Practice Session
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

