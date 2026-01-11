"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

export interface TypingTestResult {
  // Typing metrics
  wpm: number; // Words per minute
  accuracy: number; // Percentage of correct characters
  totalCharacters: number;
  correctCharacters: number;
  errorCount: number;
  timeSpentSeconds: number;
  
  // Content
  typedText: string;
  promptText?: string;
  
  // Content quality (for AI evaluation)
  contentScore?: number;
  contentFeedback?: string;
}

export interface TypingTestProps {
  mode: "summary" | "practice" | "dictation";
  prompt?: string; // For dictation mode - text to type
  scenario?: string; // Context about the call for summary mode
  minWords?: number; // Minimum words required
  maxTime?: number; // Maximum time in seconds (0 = unlimited)
  onComplete: (result: TypingTestResult) => void;
  onCancel?: () => void;
}

export default function TypingTest({
  mode,
  prompt,
  scenario,
  minWords = 50,
  maxTime = 300, // 5 minutes default
  onComplete,
  onCancel,
}: TypingTestProps) {
  const [typedText, setTypedText] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate metrics
  const wordCount = typedText.trim().split(/\s+/).filter(w => w).length;
  const characterCount = typedText.length;
  
  // For dictation mode - calculate accuracy
  const calculateAccuracy = useCallback(() => {
    if (mode !== "dictation" || !prompt) return 100;
    
    let correct = 0;
    const maxLen = Math.max(typedText.length, prompt.length);
    
    for (let i = 0; i < typedText.length; i++) {
      if (typedText[i] === prompt[i]) {
        correct++;
      }
    }
    
    return maxLen > 0 ? Math.round((correct / maxLen) * 100) : 100;
  }, [mode, prompt, typedText]);

  // Calculate WPM
  const calculateWPM = useCallback(() => {
    if (elapsedTime === 0) return 0;
    const minutes = elapsedTime / 60;
    return Math.round(wordCount / minutes);
  }, [wordCount, elapsedTime]);

  // Timer effect
  useEffect(() => {
    if (!isStarted || isCompleted) {
      return;
    }
    
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => {
        const newTime = prev + 1;
        if (maxTime > 0 && newTime >= maxTime) {
          // Don't call handleComplete here to avoid state update during render
          // Instead, let the completion be triggered by maxTime check below
        }
        return newTime;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isStarted, isCompleted, maxTime]);

  // Auto-complete when time runs out (separate effect to avoid issues)
  useEffect(() => {
    if (isStarted && !isCompleted && maxTime > 0 && elapsedTime >= maxTime) {
      handleComplete();
    }
  }, [isStarted, isCompleted, maxTime, elapsedTime, handleComplete]);

  // Start typing
  const handleStart = () => {
    setIsStarted(true);
    setStartTime(Date.now());
    textareaRef.current?.focus();
  };

  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    
    // For dictation mode, track errors
    if (mode === "dictation" && prompt) {
      let errors = 0;
      for (let i = 0; i < newText.length; i++) {
        if (newText[i] !== prompt[i]) {
          errors++;
        }
      }
      setErrorCount(errors);
    }
    
    setTypedText(newText);
  };

  // Complete the test
  const handleComplete = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setIsCompleted(true);
    
    const accuracy = calculateAccuracy();
    const wpm = calculateWPM();
    
    const result: TypingTestResult = {
      wpm,
      accuracy,
      totalCharacters: mode === "dictation" && prompt ? prompt.length : characterCount,
      correctCharacters: mode === "dictation" && prompt ? Math.round((accuracy / 100) * prompt.length) : characterCount,
      errorCount,
      timeSpentSeconds: elapsedTime,
      typedText,
      promptText: prompt,
    };
    
    onComplete(result);
  }, [calculateAccuracy, calculateWPM, characterCount, elapsedTime, errorCount, mode, onComplete, prompt, typedText]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render dictation text with highlighting
  const renderDictationPrompt = () => {
    if (!prompt) return null;
    
    return (
      <div className="font-mono text-lg leading-relaxed p-4 bg-slate-50 rounded-xl border border-slate-200 mb-4">
        {prompt.split('').map((char, index) => {
          let className = "text-slate-400"; // Not yet typed
          
          if (index < typedText.length) {
            if (typedText[index] === char) {
              className = "text-emerald-600"; // Correct
            } else {
              className = "text-red-500 bg-red-100"; // Incorrect
            }
          } else if (index === typedText.length) {
            className = "text-slate-800 bg-violet-200"; // Current position
          }
          
          return (
            <span key={index} className={className}>
              {char === ' ' ? '\u00A0' : char}
            </span>
          );
        })}
      </div>
    );
  };

  // Instructions based on mode
  const getInstructions = () => {
    switch (mode) {
      case "summary":
        return "Type a summary of the call you just completed. Include key points discussed, customer concerns, and any commitments made.";
      case "dictation":
        return "Type the text shown above as accurately and quickly as possible.";
      case "practice":
        return "Practice typing by entering the text below. Focus on both speed and accuracy.";
      default:
        return "";
    }
  };

  // Pre-start screen
  if (!isStarted) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/20">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            {mode === "summary" ? "Call Summary" : mode === "dictation" ? "Typing Test" : "Typing Practice"}
          </h2>
          <p className="text-slate-500">{getInstructions()}</p>
        </div>

        {scenario && (
          <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
            <h3 className="font-medium text-amber-800 mb-2">📞 Call Context</h3>
            <p className="text-amber-700 text-sm">{scenario}</p>
          </div>
        )}

        {mode === "dictation" && prompt && (
          <div className="mb-6">
            <h3 className="font-medium text-slate-700 mb-2">Text to Type:</h3>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-sm text-slate-600">
              {prompt}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center p-4 bg-slate-50 rounded-xl">
            <div className="text-2xl font-bold text-violet-600">{minWords}+</div>
            <div className="text-sm text-slate-500">Min Words</div>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-xl">
            <div className="text-2xl font-bold text-amber-600">{formatTime(maxTime)}</div>
            <div className="text-sm text-slate-500">Time Limit</div>
          </div>
          <div className="text-center p-4 bg-slate-50 rounded-xl">
            <div className="text-2xl font-bold text-emerald-600">⌨️</div>
            <div className="text-sm text-slate-500">Ready</div>
          </div>
        </div>

        <div className="flex gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleStart}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:from-violet-600 hover:to-purple-700 transition-all shadow-lg shadow-violet-500/20"
          >
            Start Typing
          </button>
        </div>
      </div>
    );
  }

  // Typing screen
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800">
          {mode === "summary" ? "Type Your Call Summary" : "Typing Test"}
        </h2>
        <div className="flex items-center gap-4">
          {/* Timer */}
          <div className={`px-3 py-1.5 rounded-lg font-mono font-bold ${
            maxTime > 0 && elapsedTime > maxTime * 0.8 ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-600"
          }`}>
            ⏱️ {formatTime(elapsedTime)} {maxTime > 0 && `/ ${formatTime(maxTime)}`}
          </div>
        </div>
      </div>

      {/* Live stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="p-3 bg-slate-50 rounded-lg text-center">
          <div className="text-xl font-bold text-slate-800">{wordCount}</div>
          <div className="text-xs text-slate-500">Words</div>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg text-center">
          <div className="text-xl font-bold text-violet-600">{calculateWPM()}</div>
          <div className="text-xs text-slate-500">WPM</div>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg text-center">
          <div className="text-xl font-bold text-emerald-600">{calculateAccuracy()}%</div>
          <div className="text-xs text-slate-500">Accuracy</div>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg text-center">
          <div className="text-xl font-bold text-amber-600">{characterCount}</div>
          <div className="text-xs text-slate-500">Characters</div>
        </div>
      </div>

      {/* Dictation prompt */}
      {mode === "dictation" && renderDictationPrompt()}

      {/* Scenario reminder for summary mode */}
      {mode === "summary" && scenario && (
        <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-sm text-amber-700"><strong>Call Context:</strong> {scenario}</p>
        </div>
      )}

      {/* Typing area */}
      <textarea
        ref={textareaRef}
        value={typedText}
        onChange={handleTextChange}
        placeholder={mode === "summary" 
          ? "Start typing your call summary here... Include key discussion points, customer concerns, solutions offered, and next steps."
          : "Start typing..."
        }
        className="w-full h-48 p-4 border border-slate-200 rounded-xl text-slate-800 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        autoFocus
        disabled={isCompleted}
      />

      {/* Word count progress */}
      {mode === "summary" && (
        <div className="mt-2 mb-4">
          <div className="flex items-center justify-between text-sm text-slate-500 mb-1">
            <span>Progress</span>
            <span>{wordCount} / {minWords} words minimum</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                wordCount >= minWords ? "bg-emerald-500" : "bg-violet-500"
              }`}
              style={{ width: `${Math.min((wordCount / minWords) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 mt-4">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleComplete}
          disabled={mode === "summary" && wordCount < minWords}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mode === "summary" && wordCount < minWords 
            ? `Need ${minWords - wordCount} more words`
            : "Submit"
          }
        </button>
      </div>
    </div>
  );
}

// Typing Test Results Display Component
export function TypingTestResults({ result, onContinue }: { result: TypingTestResult; onContinue?: () => void }) {
  const getWPMRating = (wpm: number) => {
    if (wpm >= 60) return { label: "Excellent", color: "text-emerald-600", bg: "bg-emerald-100" };
    if (wpm >= 40) return { label: "Good", color: "text-blue-600", bg: "bg-blue-100" };
    if (wpm >= 25) return { label: "Average", color: "text-amber-600", bg: "bg-amber-100" };
    return { label: "Needs Practice", color: "text-red-600", bg: "bg-red-100" };
  };

  const getAccuracyRating = (accuracy: number) => {
    if (accuracy >= 98) return { label: "Perfect", color: "text-emerald-600", bg: "bg-emerald-100" };
    if (accuracy >= 95) return { label: "Excellent", color: "text-blue-600", bg: "bg-blue-100" };
    if (accuracy >= 90) return { label: "Good", color: "text-amber-600", bg: "bg-amber-100" };
    return { label: "Needs Improvement", color: "text-red-600", bg: "bg-red-100" };
  };

  const wpmRating = getWPMRating(result.wpm);
  const accuracyRating = getAccuracyRating(result.accuracy);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Typing Test Complete!</h2>
        <p className="text-slate-500">Here's how you did</p>
      </div>

      {/* Main metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-6 bg-slate-50 rounded-xl text-center">
          <div className="text-4xl font-bold text-violet-600 mb-1">{result.wpm}</div>
          <div className="text-sm text-slate-500 mb-2">Words Per Minute</div>
          <span className={`px-3 py-1 ${wpmRating.bg} ${wpmRating.color} text-sm font-medium rounded-full`}>
            {wpmRating.label}
          </span>
        </div>
        <div className="p-6 bg-slate-50 rounded-xl text-center">
          <div className="text-4xl font-bold text-emerald-600 mb-1">{result.accuracy}%</div>
          <div className="text-sm text-slate-500 mb-2">Accuracy</div>
          <span className={`px-3 py-1 ${accuracyRating.bg} ${accuracyRating.color} text-sm font-medium rounded-full`}>
            {accuracyRating.label}
          </span>
        </div>
      </div>

      {/* Additional stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-4 bg-slate-50 rounded-lg text-center">
          <div className="text-xl font-bold text-slate-700">{result.totalCharacters}</div>
          <div className="text-xs text-slate-500">Total Characters</div>
        </div>
        <div className="p-4 bg-slate-50 rounded-lg text-center">
          <div className="text-xl font-bold text-slate-700">{result.errorCount}</div>
          <div className="text-xs text-slate-500">Errors</div>
        </div>
        <div className="p-4 bg-slate-50 rounded-lg text-center">
          <div className="text-xl font-bold text-slate-700">
            {Math.floor(result.timeSpentSeconds / 60)}:{(result.timeSpentSeconds % 60).toString().padStart(2, '0')}
          </div>
          <div className="text-xs text-slate-500">Time Spent</div>
        </div>
      </div>

      {/* Content feedback if available */}
      {result.contentFeedback && (
        <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <h3 className="font-medium text-blue-800 mb-2">📝 Content Feedback</h3>
          <p className="text-blue-700 text-sm">{result.contentFeedback}</p>
          {result.contentScore !== undefined && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-blue-600">Content Score:</span>
              <span className="font-bold text-blue-800">{result.contentScore}/5</span>
            </div>
          )}
        </div>
      )}

      {/* Typed text preview */}
      <div className="mb-6">
        <h3 className="font-medium text-slate-700 mb-2">Your Response:</h3>
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-600 max-h-32 overflow-y-auto">
          {result.typedText || <span className="text-slate-400 italic">No text entered</span>}
        </div>
      </div>

      {onContinue && (
        <button
          onClick={onContinue}
          className="w-full px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:from-violet-600 hover:to-purple-700 transition-all shadow-lg shadow-violet-500/20"
        >
          Continue
        </button>
      )}
    </div>
  );
}
