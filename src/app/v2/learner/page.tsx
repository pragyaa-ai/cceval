"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  USE_CASE_LABELS, 
  READING_PASSAGES, 
  CALL_SCENARIOS,
  SCORING_PARAMETERS_BY_USE_CASE,
  TYPING_TEST_CONFIG,
  TYPING_TEST_PROMPTS,
  UseCase 
} from "../contexts/V2EvaluationContext";

interface TrainingModule {
  id: string;
  useCase: UseCase;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: string;
  type?: "voice" | "typing"; // default is voice
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
  const [showTypingPractice, setShowTypingPractice] = useState(false);
  const [typingSummary, setTypingSummary] = useState("");
  const [typingStartTime, setTypingStartTime] = useState<Date | null>(null);
  const [typingTimeRemaining, setTypingTimeRemaining] = useState(TYPING_TEST_CONFIG.timeLimit);
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
    { id: "use_case_master", title: "Product Specialist", description: "Score 85%+ on all modules of one use case", icon: "🏅", points: 350, isUnlocked: false, progress: 1, target: 3 },
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

  // Training modules for call center context
  const trainingModules: TrainingModule[] = [
    // PV Sales Modules - Voice
    { id: "pv_basics", useCase: "pv_sales", title: "PV Sales Fundamentals", description: "Learn the basics of PV model range and customer approach", difficulty: "beginner", duration: "15 mins", completedSessions: 3, totalSessions: 5, lastScore: 78, pointsPerSession: 50, type: "voice" },
    { id: "pv_features", useCase: "pv_sales", title: "Feature Presentation", description: "Master presenting safety, comfort, and performance features", difficulty: "intermediate", duration: "20 mins", completedSessions: 2, totalSessions: 5, lastScore: 72, pointsPerSession: 75, type: "voice" },
    { id: "pv_objections", useCase: "pv_sales", title: "Handling Price Objections", description: "Advanced techniques for price negotiation and competitor comparison", difficulty: "advanced", duration: "25 mins", completedSessions: 0, totalSessions: 5, isNew: true, pointsPerSession: 100, type: "voice" },
    // PV Sales - Typing Test
    { id: "pv_summary", useCase: "pv_sales", title: "Call Summary Writing", description: "Practice documenting PV sales calls accurately and professionally", difficulty: "intermediate", duration: "10 mins", completedSessions: 1, totalSessions: 5, lastScore: 80, pointsPerSession: 60, type: "typing" },
    // EV Sales Modules - Voice
    { id: "ev_basics", useCase: "ev_sales", title: "EV Fundamentals", description: "Understanding EV technology, range, and charging basics", difficulty: "beginner", duration: "15 mins", completedSessions: 4, totalSessions: 5, lastScore: 85, pointsPerSession: 50, type: "voice" },
    { id: "ev_myths", useCase: "ev_sales", title: "EV Myth Busting", description: "Addressing common EV misconceptions and range anxiety", difficulty: "intermediate", duration: "20 mins", completedSessions: 1, totalSessions: 5, lastScore: 68, pointsPerSession: 75, type: "voice" },
    { id: "ev_tco", useCase: "ev_sales", title: "TCO & Value Selling", description: "Explaining total cost of ownership and long-term EV benefits", difficulty: "advanced", duration: "25 mins", completedSessions: 0, totalSessions: 5, isNew: true, pointsPerSession: 100, type: "voice" },
    // EV Sales - Typing Test
    { id: "ev_summary", useCase: "ev_sales", title: "EV Inquiry Documentation", description: "Practice documenting EV inquiries with technical details", difficulty: "intermediate", duration: "10 mins", completedSessions: 0, totalSessions: 5, isNew: true, pointsPerSession: 60, type: "typing" },
    // Service Support Modules - Voice
    { id: "service_basics", useCase: "service", title: "Service Booking Basics", description: "Efficient appointment scheduling and customer data capture", difficulty: "beginner", duration: "15 mins", completedSessions: 5, totalSessions: 5, lastScore: 92, pointsPerSession: 50, type: "voice" },
    { id: "service_complaints", useCase: "service", title: "Complaint Handling", description: "Managing dissatisfied customers and service issues", difficulty: "intermediate", duration: "20 mins", completedSessions: 3, totalSessions: 5, lastScore: 75, pointsPerSession: 75, type: "voice" },
    { id: "service_escalation", useCase: "service", title: "Escalation Management", description: "Handling warranty disputes and angry customer de-escalation", difficulty: "advanced", duration: "25 mins", completedSessions: 1, totalSessions: 5, lastScore: 65, pointsPerSession: 100, type: "voice" },
    // Service - Typing Test
    { id: "service_summary", useCase: "service", title: "Service Ticket Documentation", description: "Practice writing clear service tickets and complaint summaries", difficulty: "beginner", duration: "10 mins", completedSessions: 2, totalSessions: 5, lastScore: 88, pointsPerSession: 60, type: "typing" },
  ];

  // Typing timer effect
  useEffect(() => {
    if (showTypingPractice && typingStartTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - typingStartTime.getTime()) / 1000);
        const remaining = Math.max(0, TYPING_TEST_CONFIG.timeLimit - elapsed);
        setTypingTimeRemaining(remaining);
        
        if (remaining === 0) {
          handleTypingSubmit();
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showTypingPractice, typingStartTime]);

  const handleLogin = () => {
    if (employeeId.trim() && learnerName.trim()) {
      setIsAuthenticated(true);
      // Load sample practice history
      setPracticeHistory([
        { date: "2025-01-08", module: "EV Fundamentals", score: 85, feedback: "Great explanation of charging options!", pointsEarned: 50 },
        { date: "2025-01-07", module: "Service Booking Basics", score: 92, feedback: "Excellent customer handling", pointsEarned: 50 },
        { date: "2025-01-06", module: "PV Sales Fundamentals", score: 78, feedback: "Good product knowledge, work on closing", pointsEarned: 50 },
        { date: "2025-01-05", module: "Call Summary Writing", score: 80, feedback: "Good structure, include more details", pointsEarned: 60 },
      ]);
    }
  };

  const handleStartTypingPractice = () => {
    setTypingStartTime(new Date());
    setTypingSummary("");
    setTypingTimeRemaining(TYPING_TEST_CONFIG.timeLimit);
    setShowTypingPractice(true);
  };

  const handleTypingSubmit = () => {
    const wordCount = typingSummary.split(/\s+/).filter(w => w).length;
    const timeSpent = typingStartTime 
      ? Math.floor((Date.now() - typingStartTime.getTime()) / 1000)
      : 0;
    
    // Calculate a mock score based on word count and time
    let score = 0;
    if (wordCount >= TYPING_TEST_CONFIG.minWords && wordCount <= TYPING_TEST_CONFIG.maxWords) {
      score = Math.min(100, 70 + Math.floor(Math.random() * 25)); // Random score between 70-95
    } else if (wordCount > 0) {
      score = Math.min(70, 40 + Math.floor((wordCount / TYPING_TEST_CONFIG.minWords) * 30));
    }
    
    // Add to practice history
    const newEntry = {
      date: new Date().toISOString().split('T')[0],
      module: selectedModule?.title || "Typing Practice",
      score,
      feedback: score >= 80 ? "Well-structured summary with good detail!" : 
                score >= 60 ? "Good effort, try to include more specific details." :
                "Keep practicing to improve your documentation skills.",
      pointsEarned: selectedModule?.pointsPerSession || 60,
    };
    
    setPracticeHistory(prev => [newEntry, ...prev]);
    setTotalPoints(prev => prev + newEntry.pointsEarned);
    
    // Reset state
    setShowTypingPractice(false);
    setSelectedModule(null);
    setTypingSummary("");
    setTypingStartTime(null);
    
    alert(`🎉 Practice completed!\n\nScore: ${score}%\nPoints earned: +${newEntry.pointsEarned}`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRedeemReward = (rewardId: string) => {
    const reward = rewards.find(r => r.id === rewardId);
    if (reward && totalPoints >= reward.pointsCost && !reward.isRedeemed) {
      setTotalPoints(prev => prev - reward.pointsCost);
      setRewards(prev => prev.map(r => 
        r.id === rewardId ? { ...r, isRedeemed: true } : r
      ));
      alert(`🎉 Successfully redeemed: ${reward.title}! HR will be notified.`);
    }
  };

  const getFilteredModules = () => {
    if (!selectedUseCase) return trainingModules;
    return trainingModules.filter(m => m.useCase === selectedUseCase);
  };

  const getProgressPercentage = () => {
    const totalSessions = trainingModules.reduce((sum, m) => sum + m.totalSessions, 0);
    const completedSessions = trainingModules.reduce((sum, m) => sum + m.completedSessions, 0);
    return Math.round((completedSessions / totalSessions) * 100);
  };

  const getLevelName = (level: number): string => {
    const levels = ["Novice", "Learner", "Associate", "Specialist", "Expert", "Master", "Champion", "Legend"];
    return levels[Math.min(level - 1, levels.length - 1)];
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="fixed inset-0 opacity-40">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23cbd5e1' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="text-center mb-8">
              <Image
                src="/pragyaa-logo.svg"
                alt="Pragyaa Logo"
                width={120}
                height={40}
                className="mx-auto mb-4 opacity-90"
              />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-500 bg-clip-text text-transparent">
                Continuous Learning Portal
              </h1>
              <p className="text-slate-500 mt-2">Practice and improve your call handling skills</p>
            </div>

            {/* Login Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Employee ID</label>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="Enter your employee ID"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Your Name</label>
                  <input
                    type="text"
                    value={learnerName}
                    onChange={(e) => setLearnerName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                  />
                </div>
                <button
                  onClick={handleLogin}
                  disabled={!employeeId.trim() || !learnerName.trim()}
                  className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:from-violet-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20"
                >
                  Start Learning
                </button>
              </div>
            </div>

            {/* Back Link */}
            <div className="text-center mt-6">
              <Link href="/v2" className="text-slate-500 hover:text-slate-700 text-sm">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Learning Portal
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
              <span className="text-violet-600 font-medium text-sm">Continuous Learning</span>
            </div>

            <div className="flex items-center gap-4">
              {/* Points Display */}
              <button 
                onClick={() => setShowRewardsModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-100 to-yellow-100 border border-amber-300 rounded-full hover:from-amber-200 hover:to-yellow-200 transition-colors"
              >
                <span className="text-lg">🪙</span>
                <span className="font-bold text-amber-700">{totalPoints.toLocaleString()}</span>
                <span className="text-amber-600 text-sm">pts</span>
              </button>

              {/* Streak Display */}
              <div className="flex items-center gap-1 px-3 py-1.5 bg-orange-100 border border-orange-300 rounded-full">
                <span className="text-lg">🔥</span>
                <span className="font-bold text-orange-700">{weeklyStreak}</span>
                <span className="text-orange-600 text-sm">day streak</span>
              </div>

              {/* User Info */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-slate-700">{learnerName}</div>
                  <div className="text-xs text-slate-500">Level {currentLevel} • {getLevelName(currentLevel)}</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-medium">
                  {learnerName.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Level Progress Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 text-sm">Current Level</span>
              <span className="text-2xl">🎖️</span>
            </div>
            <div className="text-2xl font-bold text-slate-800 mb-1">Level {currentLevel}</div>
            <div className="text-sm text-violet-600 font-medium mb-2">{getLevelName(currentLevel)}</div>
            <div className="w-full bg-slate-200 rounded-full h-2 mb-1">
              <div 
                className="bg-gradient-to-r from-violet-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${((3000 - pointsToNextLevel) / 3000) * 100}%` }}
              />
            </div>
            <div className="text-xs text-slate-500">{pointsToNextLevel} pts to Level {currentLevel + 1}</div>
          </div>

          {/* Overall Progress Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 text-sm">Overall Progress</span>
              <span className="text-2xl">📊</span>
            </div>
            <div className="text-2xl font-bold text-slate-800 mb-1">{getProgressPercentage()}%</div>
            <div className="text-sm text-slate-500 mb-2">Modules completed</div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>

          {/* Achievements Card */}
          <button 
            onClick={() => setShowAchievementsModal(true)}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-left hover:border-violet-300 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 text-sm">Achievements</span>
              <span className="text-2xl">🏆</span>
            </div>
            <div className="text-2xl font-bold text-slate-800 mb-1">
              {achievements.filter(a => a.isUnlocked).length}/{achievements.length}
            </div>
            <div className="text-sm text-slate-500 mb-2">Badges earned</div>
            <div className="flex gap-1">
              {achievements.filter(a => a.isUnlocked).slice(0, 5).map(a => (
                <span key={a.id} className="text-lg">{a.icon}</span>
              ))}
              {achievements.filter(a => a.isUnlocked).length > 5 && (
                <span className="text-xs text-slate-400">+{achievements.filter(a => a.isUnlocked).length - 5}</span>
              )}
            </div>
          </button>

          {/* Practice Sessions Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 text-sm">This Week</span>
              <span className="text-2xl">📈</span>
            </div>
            <div className="text-2xl font-bold text-slate-800 mb-1">23</div>
            <div className="text-sm text-slate-500 mb-2">Practice sessions</div>
            <div className="text-xs text-emerald-600 font-medium">↑ 15% from last week</div>
          </div>
        </div>

        {/* Use Case Filter */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-medium text-slate-600">Filter by Use Case:</span>
            <button
              onClick={() => setSelectedUseCase(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedUseCase === null
                  ? "bg-violet-500 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Modules
            </button>
            {(Object.keys(USE_CASE_LABELS) as UseCase[]).map((uc) => (
              <button
                key={uc}
                onClick={() => setSelectedUseCase(uc)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedUseCase === uc
                    ? "bg-violet-500 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {USE_CASE_LABELS[uc]}
              </button>
            ))}
          </div>
        </div>

        {/* Training Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {getFilteredModules().map((module) => (
            <div
              key={module.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all hover:border-violet-300"
            >
              {/* Module Header */}
              <div className={`p-4 ${
                module.useCase === "pv_sales" ? "bg-gradient-to-r from-blue-50 to-indigo-50" :
                module.useCase === "ev_sales" ? "bg-gradient-to-r from-emerald-50 to-teal-50" :
                "bg-gradient-to-r from-amber-50 to-orange-50"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      module.difficulty === "beginner" ? "bg-green-100 text-green-700" :
                      module.difficulty === "intermediate" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {module.difficulty.charAt(0).toUpperCase() + module.difficulty.slice(1)}
                    </span>
                    {module.type === "typing" && (
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full flex items-center gap-1">
                        ⌨️ Typing
                      </span>
                    )}
                  </div>
                  {module.isNew && (
                    <span className="px-2 py-1 bg-violet-100 text-violet-700 text-xs font-medium rounded-full">
                      NEW
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-slate-800">{module.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{module.description}</p>
              </div>

              {/* Module Body */}
              <div className="p-4">
                <div className="flex items-center justify-between text-sm text-slate-500 mb-3">
                  <span>{USE_CASE_LABELS[module.useCase]}</span>
                  <span>{module.duration}</span>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>{module.completedSessions}/{module.totalSessions} sessions</span>
                    {module.lastScore && <span>Last: {module.lastScore}%</span>}
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        module.completedSessions === module.totalSessions
                          ? "bg-emerald-500"
                          : "bg-violet-500"
                      }`}
                      style={{ width: `${(module.completedSessions / module.totalSessions) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Points & Action */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-amber-600 font-medium">
                    🪙 +{module.pointsPerSession} pts/session
                  </span>
                  <button
                    onClick={() => setSelectedModule(module)}
                    className="px-4 py-2 bg-violet-500 text-white text-sm font-medium rounded-lg hover:bg-violet-600 transition-colors"
                  >
                    {module.completedSessions === module.totalSessions ? "Review" : "Practice"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Practice History */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Recent Practice Sessions</h2>
          <div className="space-y-3">
            {practiceHistory.map((session, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    session.score >= 80 ? "bg-emerald-100 text-emerald-600" :
                    session.score >= 60 ? "bg-amber-100 text-amber-600" :
                    "bg-red-100 text-red-600"
                  }`}>
                    {session.score >= 80 ? "🌟" : session.score >= 60 ? "👍" : "💪"}
                  </div>
                  <div>
                    <div className="font-medium text-slate-800">{session.module}</div>
                    <div className="text-sm text-slate-500">{session.date}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${
                    session.score >= 80 ? "text-emerald-600" :
                    session.score >= 60 ? "text-amber-600" :
                    "text-red-600"
                  }`}>
                    {session.score}%
                  </div>
                  <div className="text-sm text-amber-600">+{session.pointsEarned} pts</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rewards Modal */}
      {showRewardsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-amber-50 to-yellow-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Rewards Store</h2>
                  <p className="text-slate-500 text-sm">Redeem your points for exciting rewards</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-full">
                  <span className="text-lg">🪙</span>
                  <span className="font-bold text-amber-700">{totalPoints.toLocaleString()}</span>
                  <span className="text-amber-600 text-sm">available</span>
                </div>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rewards.map((reward) => (
                  <div
                    key={reward.id}
                    className={`p-4 rounded-xl border ${
                      reward.isRedeemed
                        ? "bg-slate-50 border-slate-200 opacity-60"
                        : totalPoints >= reward.pointsCost
                        ? "bg-white border-slate-200 hover:border-amber-300"
                        : "bg-slate-50 border-slate-200 opacity-75"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{reward.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-800">{reward.title}</h3>
                        <p className="text-sm text-slate-500">{reward.description}</p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-amber-600 font-bold">🪙 {reward.pointsCost}</span>
                          <button
                            onClick={() => handleRedeemReward(reward.id)}
                            disabled={reward.isRedeemed || totalPoints < reward.pointsCost}
                            className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                              reward.isRedeemed
                                ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                                : totalPoints >= reward.pointsCost
                                ? "bg-amber-500 text-white hover:bg-amber-600"
                                : "bg-slate-200 text-slate-500 cursor-not-allowed"
                            }`}
                          >
                            {reward.isRedeemed ? "Redeemed" : "Redeem"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowRewardsModal(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Achievements Modal */}
      {showAchievementsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-violet-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Achievements</h2>
                  <p className="text-slate-500 text-sm">Your badges and milestones</p>
                </div>
                <div className="text-2xl">🏆</div>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-xl border ${
                      achievement.isUnlocked
                        ? "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`text-3xl ${!achievement.isUnlocked && "grayscale opacity-50"}`}>
                        {achievement.icon}
                      </span>
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-800">{achievement.title}</h3>
                        <p className="text-sm text-slate-500">{achievement.description}</p>
                        {achievement.isUnlocked ? (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-emerald-600 font-medium">✓ Unlocked</span>
                            <span className="text-xs text-slate-400">{achievement.unlockedAt}</span>
                          </div>
                        ) : achievement.progress !== undefined && achievement.target !== undefined ? (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                              <span>Progress</span>
                              <span>{achievement.progress}/{achievement.target}</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5">
                              <div
                                className="bg-violet-500 h-1.5 rounded-full transition-all"
                                style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                              />
                            </div>
                          </div>
                        ) : null}
                        <div className="mt-2 text-xs text-amber-600 font-medium">
                          +{achievement.points} pts
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowAchievementsModal(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Typing Practice Modal */}
      {showTypingPractice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-violet-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">⌨️</span>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Typing Practice</h2>
                    <p className="text-slate-500 text-sm">Write a call summary based on the scenario</p>
                  </div>
                </div>
                {typingStartTime && (
                  <div className={`px-4 py-2 rounded-xl font-mono text-xl ${
                    typingTimeRemaining < 60 ? "bg-red-100 text-red-600" : 
                    typingTimeRemaining < 120 ? "bg-amber-100 text-amber-600" : 
                    "bg-slate-100 text-slate-700"
                  }`}>
                    {Math.floor(typingTimeRemaining / 60)}:{(typingTimeRemaining % 60).toString().padStart(2, '0')}
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {!typingStartTime ? (
                // Instructions before starting
                <div className="space-y-6">
                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                    <h3 className="font-medium text-slate-800 mb-3">Instructions</h3>
                    <p className="text-slate-600 mb-4">{TYPING_TEST_CONFIG.instructions}</p>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="text-center p-3 bg-white rounded-lg border border-slate-200">
                        <div className="text-xl font-bold text-violet-600">{TYPING_TEST_CONFIG.minWords}+</div>
                        <div className="text-xs text-slate-500">Min Words</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border border-slate-200">
                        <div className="text-xl font-bold text-amber-600">{Math.floor(TYPING_TEST_CONFIG.timeLimit / 60)} min</div>
                        <div className="text-xs text-slate-500">Time Limit</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border border-slate-200">
                        <div className="text-xl font-bold text-emerald-600">60</div>
                        <div className="text-xs text-slate-500">Points</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowTypingPractice(false)}
                      className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleStartTypingPractice}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-violet-500/20"
                    >
                      Start Typing
                    </button>
                  </div>
                </div>
              ) : (
                // Typing area
                <div className="space-y-4">
                  {/* Live stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 rounded-lg text-center">
                      <div className="text-xl font-bold text-slate-800">{typingSummary.split(/\s+/).filter(w => w).length}</div>
                      <div className="text-xs text-slate-500">Words</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg text-center">
                      <div className="text-xl font-bold text-violet-600">
                        {typingStartTime && typingSummary.split(/\s+/).filter(w => w).length > 0
                          ? Math.round((typingSummary.split(/\s+/).filter(w => w).length / ((Date.now() - typingStartTime.getTime()) / 60000)) || 0)
                          : 0}
                      </div>
                      <div className="text-xs text-slate-500">WPM</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg text-center">
                      <div className="text-xl font-bold text-emerald-600">{typingSummary.length}</div>
                      <div className="text-xs text-slate-500">Characters</div>
                    </div>
                  </div>

                  {/* Textarea */}
                  <textarea
                    value={typingSummary}
                    onChange={(e) => setTypingSummary(e.target.value)}
                    placeholder="Start typing your call summary here... Include key discussion points, customer concerns, solutions offered, and next steps."
                    className="w-full h-64 p-4 border border-slate-200 rounded-xl text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
                    autoFocus
                  />

                  {/* Progress bar */}
                  <div>
                    <div className="flex items-center justify-between text-sm text-slate-500 mb-1">
                      <span>Word count progress</span>
                      <span>{typingSummary.split(/\s+/).filter(w => w).length} / {TYPING_TEST_CONFIG.minWords} minimum</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          typingSummary.split(/\s+/).filter(w => w).length >= TYPING_TEST_CONFIG.minWords
                            ? "bg-emerald-500"
                            : "bg-violet-500"
                        }`}
                        style={{ width: `${Math.min((typingSummary.split(/\s+/).filter(w => w).length / TYPING_TEST_CONFIG.minWords) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Submit button */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowTypingPractice(false);
                        setTypingStartTime(null);
                        setTypingSummary("");
                      }}
                      className="px-4 py-2 text-slate-600 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleTypingSubmit}
                      disabled={typingSummary.split(/\s+/).filter(w => w).length < TYPING_TEST_CONFIG.minWords}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
                    >
                      {typingSummary.split(/\s+/).filter(w => w).length < TYPING_TEST_CONFIG.minWords
                        ? `Need ${TYPING_TEST_CONFIG.minWords - typingSummary.split(/\s+/).filter(w => w).length} more words`
                        : "Submit Summary"
                      }
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Module Detail Modal */}
      {selectedModule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full">
            <div className={`p-6 rounded-t-2xl ${
              selectedModule.useCase === "pv_sales" ? "bg-gradient-to-r from-blue-50 to-indigo-50" :
              selectedModule.useCase === "ev_sales" ? "bg-gradient-to-r from-emerald-50 to-teal-50" :
              "bg-gradient-to-r from-amber-50 to-orange-50"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    selectedModule.difficulty === "beginner" ? "bg-green-100 text-green-700" :
                    selectedModule.difficulty === "intermediate" ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {selectedModule.difficulty.charAt(0).toUpperCase() + selectedModule.difficulty.slice(1)}
                  </span>
                  {selectedModule.type === "typing" && (
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full flex items-center gap-1">
                      ⌨️ Typing
                    </span>
                  )}
                </div>
                <span className="text-sm text-slate-500">{selectedModule.duration}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-800">{selectedModule.title}</h2>
              <p className="text-slate-600 mt-2">{selectedModule.description}</p>
            </div>
            <div className="p-6">
              {selectedModule.type === "typing" ? (
                // Typing module details
                <>
                  <div className="mb-6">
                    <h3 className="font-medium text-slate-800 mb-3">What you'll practice:</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-sm text-slate-600">
                        <svg className="w-4 h-4 text-violet-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Typing speed (WPM)
                      </li>
                      <li className="flex items-center gap-2 text-sm text-slate-600">
                        <svg className="w-4 h-4 text-violet-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Typing accuracy
                      </li>
                      <li className="flex items-center gap-2 text-sm text-slate-600">
                        <svg className="w-4 h-4 text-violet-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Content completeness
                      </li>
                      <li className="flex items-center gap-2 text-sm text-slate-600">
                        <svg className="w-4 h-4 text-violet-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Professional tone
                      </li>
                    </ul>
                  </div>
                  <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <h4 className="font-medium text-slate-700 mb-2">{TYPING_TEST_PROMPTS[selectedModule.useCase]?.title || "Call Summary"}</h4>
                    <p className="text-sm text-slate-600">{TYPING_TEST_PROMPTS[selectedModule.useCase]?.prompt || "Type a summary of the call scenario."}</p>
                    <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                      <span>⏱️ {TYPING_TEST_CONFIG.timeLimit / 60} min time limit</span>
                      <span>📝 {TYPING_TEST_CONFIG.minWords}-{TYPING_TEST_CONFIG.maxWords} words</span>
                    </div>
                  </div>
                </>
              ) : (
                // Voice module details
                <div className="mb-6">
                  <h3 className="font-medium text-slate-800 mb-3">What you'll practice:</h3>
                  <ul className="space-y-2">
                    {SCORING_PARAMETERS_BY_USE_CASE[selectedModule.useCase].slice(0, 4).map((param) => (
                      <li key={param.id} className="flex items-center gap-2 text-sm text-slate-600">
                        <svg className="w-4 h-4 text-violet-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {param.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl mb-6">
                <span className="text-slate-700">Points per session:</span>
                <span className="font-bold text-amber-600">🪙 +{selectedModule.pointsPerSession}</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedModule(null)}
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedModule.type === "typing") {
                      setShowTypingPractice(true);
                    } else {
                      alert("Voice practice mode would start here!");
                    }
                    setSelectedModule(null);
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:from-violet-600 hover:to-purple-700 transition-all shadow-lg shadow-violet-500/20"
                >
                  {selectedModule.type === "typing" ? "Start Typing Practice" : "Start Voice Practice"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
