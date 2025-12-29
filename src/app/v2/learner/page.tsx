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
  pointsPerSession: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  target?: number;
}

interface Reward {
  id: string;
  title: string;
  description: string;
  icon: string;
  pointsCost: number;
  category: "time_off" | "recognition" | "learning" | "wellness";
  isRedeemed: boolean;
}

export default function ContinuousLearnerPage() {
  const [learnerName, setLearnerName] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [employeeId, setEmployeeId] = useState("");
  const [selectedUseCase, setSelectedUseCase] = useState<UseCase | null>(null);
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);
  const [showPracticeMode, setShowPracticeMode] = useState(false);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [practiceHistory, setPracticeHistory] = useState<Array<{
    date: string;
    module: string;
    score: number;
    feedback: string;
    pointsEarned: number;
  }>>([]);

  // Gamification State
  const [totalPoints, setTotalPoints] = useState(2450);
  const [currentLevel, setCurrentLevel] = useState(5);
  const [pointsToNextLevel, setPointsToNextLevel] = useState(550);
  const [weeklyStreak, setWeeklyStreak] = useState(7);

  // Achievements
  const [achievements, setAchievements] = useState<Achievement[]>([
    { id: "first_session", title: "First Steps", description: "Complete your first practice session", icon: "🎯", points: 50, isUnlocked: true, unlockedAt: "2025-12-20" },
    { id: "perfect_score", title: "Perfect Score", description: "Score 100% on any session", icon: "💯", points: 200, isUnlocked: false, progress: 92, target: 100 },
    { id: "streak_7", title: "Week Warrior", description: "Maintain a 7-day practice streak", icon: "🔥", points: 150, isUnlocked: true, unlockedAt: "2025-12-28" },
    { id: "streak_30", title: "Monthly Master", description: "Maintain a 30-day practice streak", icon: "🏆", points: 500, isUnlocked: false, progress: 7, target: 30 },
    { id: "all_beginner", title: "Foundation Builder", description: "Complete all beginner modules", icon: "🧱", points: 300, isUnlocked: true, unlockedAt: "2025-12-25" },
    { id: "all_intermediate", title: "Rising Star", description: "Complete all intermediate modules", icon: "⭐", points: 500, isUnlocked: false, progress: 2, target: 3 },
    { id: "all_advanced", title: "Expert Level", description: "Complete all advanced modules", icon: "🎖️", points: 750, isUnlocked: false, progress: 0, target: 3 },
    { id: "sessions_10", title: "Dedicated Learner", description: "Complete 10 practice sessions", icon: "📚", points: 100, isUnlocked: true, unlockedAt: "2025-12-22" },
    { id: "sessions_50", title: "Practice Pro", description: "Complete 50 practice sessions", icon: "🎓", points: 400, isUnlocked: false, progress: 23, target: 50 },
    { id: "sessions_100", title: "Century Club", description: "Complete 100 practice sessions", icon: "💎", points: 1000, isUnlocked: false, progress: 23, target: 100 },
    { id: "use_case_master", title: "Use Case Specialist", description: "Score 85%+ on all modules of one use case", icon: "🏅", points: 350, isUnlocked: false, progress: 1, target: 3 },
    { id: "helping_hand", title: "Team Player", description: "Share tips with 5 colleagues", icon: "🤝", points: 200, isUnlocked: false, progress: 2, target: 5 },
  ]);

  // Rewards Catalog
  const [rewards, setRewards] = useState<Reward[]>([
    { id: "coffee", title: "Coffee Voucher", description: "₹200 coffee shop voucher", icon: "☕", pointsCost: 500, category: "wellness", isRedeemed: false },
    { id: "half_day", title: "Half Day Off", description: "Take a half day off (with manager approval)", icon: "🌴", pointsCost: 2000, category: "time_off", isRedeemed: false },
    { id: "lunch", title: "Team Lunch", description: "₹500 towards team lunch", icon: "🍽️", pointsCost: 750, category: "wellness", isRedeemed: false },
    { id: "certificate", title: "Digital Certificate", description: "Personalized achievement certificate", icon: "📜", pointsCost: 300, category: "recognition", isRedeemed: false },
    { id: "shoutout", title: "Company Shoutout", description: "Recognition in company newsletter", icon: "📣", pointsCost: 1000, category: "recognition", isRedeemed: false },
    { id: "course", title: "Online Course", description: "Access to premium learning course", icon: "🎓", pointsCost: 1500, category: "learning", isRedeemed: false },
    { id: "book", title: "Book of Choice", description: "Any book up to ₹500", icon: "📖", pointsCost: 600, category: "learning", isRedeemed: false },
    { id: "wellness", title: "Wellness Session", description: "1-hour wellness/meditation session", icon: "🧘", pointsCost: 800, category: "wellness", isRedeemed: false },
    { id: "movie", title: "Movie Tickets", description: "2 movie tickets", icon: "🎬", pointsCost: 700, category: "wellness", isRedeemed: false },
    { id: "mentoring", title: "1:1 Mentoring", description: "30-min session with senior leader", icon: "👨‍🏫", pointsCost: 1200, category: "learning", isRedeemed: false },
  ]);

  const getLevelName = (level: number) => {
    const levels = ["Novice", "Apprentice", "Practitioner", "Specialist", "Expert", "Master", "Grandmaster", "Legend"];
    return levels[Math.min(level - 1, levels.length - 1)];
  };

  const getLevelColor = (level: number) => {
    if (level >= 7) return "from-yellow-400 to-amber-500";
    if (level >= 5) return "from-violet-500 to-purple-600";
    if (level >= 3) return "from-blue-500 to-indigo-600";
    return "from-slate-400 to-slate-500";
  };

  const handleRedeemReward = (rewardId: string) => {
    const reward = rewards.find(r => r.id === rewardId);
    if (reward && totalPoints >= reward.pointsCost && !reward.isRedeemed) {
      setTotalPoints(prev => prev - reward.pointsCost);
      setRewards(prev => prev.map(r => r.id === rewardId ? { ...r, isRedeemed: true } : r));
      alert(`🎉 Congratulations! You've redeemed "${reward.title}"! HR will be notified.`);
    }
  };

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
      pointsPerSession: 50,
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
      pointsPerSession: 75,
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
      pointsPerSession: 100,
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
      pointsPerSession: 50,
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
      pointsPerSession: 75,
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
      pointsPerSession: 100,
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
      pointsPerSession: 50,
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
      pointsPerSession: 75,
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
      pointsPerSession: 100,
      isNew: true,
    },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (learnerName && employeeId) {
      setIsAuthenticated(true);
      // Simulate loading practice history
      setPracticeHistory([
        { date: "2025-12-28", module: "Exit Interview Fundamentals", score: 78, feedback: "Good probing skills, work on closure", pointsEarned: 50 },
        { date: "2025-12-27", module: "New Hire Welcome Calls", score: 85, feedback: "Excellent enthusiasm and language", pointsEarned: 65 },
        { date: "2025-12-26", module: "Routine Engagement Check-ins", score: 92, feedback: "Outstanding performance", pointsEarned: 75 },
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
        {/* Gamification Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-2xl p-6 mb-8 text-white shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Level & Points */}
            <div className="flex items-center gap-6">
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${getLevelColor(currentLevel)} flex items-center justify-center shadow-lg`}>
                <span className="text-3xl font-bold">{currentLevel}</span>
              </div>
              <div>
                <p className="text-amber-100 text-sm">Current Level</p>
                <p className="text-2xl font-bold">{getLevelName(currentLevel)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-32 h-2 bg-white/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white rounded-full"
                      style={{ width: `${((3000 - pointsToNextLevel) / 3000) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-amber-100">{pointsToNextLevel} pts to next</span>
                </div>
              </div>
            </div>

            {/* Total Points */}
            <div className="text-center">
              <p className="text-amber-100 text-sm">Total Points</p>
              <p className="text-4xl font-bold flex items-center gap-2">
                <span>🪙</span> {totalPoints.toLocaleString()}
              </p>
            </div>

            {/* Streak */}
            <div className="text-center">
              <p className="text-amber-100 text-sm">Practice Streak</p>
              <p className="text-4xl font-bold flex items-center gap-2">
                <span>🔥</span> {weeklyStreak} days
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowAchievementsModal(true)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
              >
                <span>🏆</span> Achievements
                <span className="px-2 py-0.5 bg-white/30 rounded-full text-xs">
                  {achievements.filter(a => a.isUnlocked).length}/{achievements.length}
                </span>
              </button>
              <button
                onClick={() => setShowRewardsModal(true)}
                className="px-4 py-2 bg-white text-amber-600 rounded-xl text-sm font-medium hover:bg-amber-50 transition-colors flex items-center gap-2"
              >
                <span>🎁</span> Redeem Rewards
              </button>
            </div>
          </div>
        </div>

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
            <p className="text-slate-500 text-sm mb-1">Achievements Unlocked</p>
            <p className="text-3xl font-bold text-violet-600">
              {achievements.filter(a => a.isUnlocked).length} 🏆
            </p>
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
                      <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full flex items-center gap-1">
                        🪙 {module.pointsPerSession} pts/session
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
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${getScoreColor(session.score)}`}>
                          {session.score}%
                        </span>
                        <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
                          +{session.pointsEarned}
                        </span>
                      </div>
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

      {/* Achievements Modal */}
      {showAchievementsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">🏆 Achievements</h2>
                  <p className="text-violet-200 mt-1">
                    {achievements.filter(a => a.isUnlocked).length} of {achievements.length} unlocked
                  </p>
                </div>
                <button
                  onClick={() => setShowAchievementsModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid gap-3">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      achievement.isUnlocked
                        ? "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300"
                        : "bg-slate-50 border-slate-200 opacity-75"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <span className={`text-4xl ${!achievement.isUnlocked && "grayscale opacity-50"}`}>
                        {achievement.icon}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-slate-800">{achievement.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            achievement.isUnlocked 
                              ? "bg-amber-100 text-amber-700" 
                              : "bg-slate-100 text-slate-600"
                          }`}>
                            🪙 {achievement.points} pts
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">{achievement.description}</p>
                        {achievement.isUnlocked ? (
                          <p className="text-xs text-emerald-600 mt-2">✓ Unlocked on {achievement.unlockedAt}</p>
                        ) : achievement.progress !== undefined && achievement.target !== undefined && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                              <span>Progress</span>
                              <span>{achievement.progress}/{achievement.target}</span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-violet-500 rounded-full"
                                style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rewards Modal */}
      {showRewardsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">🎁 Rewards Store</h2>
                  <p className="text-amber-100 mt-1">
                    You have <span className="font-bold text-white">🪙 {totalPoints.toLocaleString()}</span> points to spend
                  </p>
                </div>
                <button
                  onClick={() => setShowRewardsModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[65vh]">
              {/* Categories */}
              <div className="grid md:grid-cols-2 gap-4">
                {rewards.map((reward) => (
                  <div
                    key={reward.id}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      reward.isRedeemed
                        ? "bg-slate-100 border-slate-200 opacity-60"
                        : totalPoints >= reward.pointsCost
                        ? "bg-white border-amber-300 hover:border-amber-400 hover:shadow-md"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-4xl">{reward.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-slate-800">{reward.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            reward.isRedeemed
                              ? "bg-slate-200 text-slate-500"
                              : totalPoints >= reward.pointsCost
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-600"
                          }`}>
                            🪙 {reward.pointsCost}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mb-3">{reward.description}</p>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            reward.category === "time_off" ? "bg-blue-100 text-blue-700" :
                            reward.category === "recognition" ? "bg-purple-100 text-purple-700" :
                            reward.category === "learning" ? "bg-emerald-100 text-emerald-700" :
                            "bg-pink-100 text-pink-700"
                          }`}>
                            {reward.category === "time_off" ? "🌴 Time Off" :
                             reward.category === "recognition" ? "⭐ Recognition" :
                             reward.category === "learning" ? "📚 Learning" : "💆 Wellness"}
                          </span>
                          {reward.isRedeemed ? (
                            <span className="text-xs text-slate-500">✓ Redeemed</span>
                          ) : (
                            <button
                              onClick={() => handleRedeemReward(reward.id)}
                              disabled={totalPoints < reward.pointsCost}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                totalPoints >= reward.pointsCost
                                  ? "bg-amber-500 text-white hover:bg-amber-600"
                                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
                              }`}
                            >
                              {totalPoints >= reward.pointsCost ? "Redeem" : "Need more points"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* How to earn more points */}
              <div className="mt-6 p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-200">
                <h4 className="font-bold text-slate-800 mb-2">💡 How to Earn More Points</h4>
                <div className="grid md:grid-cols-3 gap-3 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📚</span>
                    <span>Complete practice sessions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">💯</span>
                    <span>Score 85%+ for bonus points</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔥</span>
                    <span>Maintain daily streaks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏆</span>
                    <span>Unlock achievements</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⭐</span>
                    <span>Complete all modules</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎯</span>
                    <span>Master advanced scenarios</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

