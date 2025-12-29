"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function V2LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Subtle pattern background */}
      <div className="fixed inset-0 opacity-40">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23cbd5e1' fill-opacity='0.3'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Logo and Title */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Image
              src="/pragyaa-logo.svg"
              alt="Pragyaa Logo"
              width={120}
              height={40}
              className="opacity-90"
            />
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-500 bg-clip-text text-transparent">
            VoiceAgent Evaluations
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            HR Services Evaluation Platform
          </p>
        </div>

        {/* Version Badge */}
        <div className="mb-12">
          <span className="px-4 py-2 bg-gradient-to-r from-violet-100 to-purple-100 border border-violet-300 rounded-full text-violet-700 text-sm font-medium shadow-sm">
            Version 2.0
          </span>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl w-full">
          {/* Evaluator Card */}
          <Link href="/v2/evaluator" className="group">
            <div className="relative overflow-hidden rounded-2xl bg-white shadow-lg border border-slate-200 p-6 transition-all duration-300 hover:shadow-xl hover:border-violet-300 hover:-translate-y-1 h-full">
              {/* Icon */}
              <div className="mb-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>

              {/* Content */}
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                I'm an Evaluator
              </h2>
              <p className="text-slate-500 mb-5 leading-relaxed text-sm">
                Manage candidates, configure evaluations, and create training use cases for continuous learners.
              </p>

              {/* Features */}
              <ul className="space-y-2 text-sm text-slate-600 mb-5">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-violet-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Batch management
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-violet-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Create training scenarios
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-violet-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Scoring dashboard
                </li>
              </ul>

              {/* CTA */}
              <div className="flex items-center text-violet-600 font-medium group-hover:text-violet-700 transition-colors text-sm">
                Open Dashboard
                <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Candidate Card */}
          <Link href="/v2/candidate" className="group">
            <div className="relative overflow-hidden rounded-2xl bg-white shadow-lg border border-slate-200 p-6 transition-all duration-300 hover:shadow-xl hover:border-emerald-300 hover:-translate-y-1 h-full">
              {/* Icon */}
              <div className="mb-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>

              {/* Content */}
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                I'm a Candidate
              </h2>
              <p className="text-slate-500 mb-5 leading-relaxed text-sm">
                Start your voice-based evaluation for HR services position. Enter your access code to begin.
              </p>

              {/* Features */}
              <ul className="space-y-2 text-sm text-slate-600 mb-5">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Personal interview questions
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Reading comprehension
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Simulation scenarios
                </li>
              </ul>

              {/* CTA */}
              <div className="flex items-center text-emerald-600 font-medium group-hover:text-emerald-700 transition-colors text-sm">
                Enter Access Code
                <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Continuous Learner Card */}
          <Link href="/v2/learner" className="group">
            <div className="relative overflow-hidden rounded-2xl bg-white shadow-lg border border-slate-200 p-6 transition-all duration-300 hover:shadow-xl hover:border-amber-300 hover:-translate-y-1 h-full">
              {/* Badge */}
              <div className="absolute top-3 right-3">
                <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                  Training
                </span>
              </div>

              {/* Icon */}
              <div className="mb-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>

              {/* Content */}
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                Continuous Learner
              </h2>
              <p className="text-slate-500 mb-5 leading-relaxed text-sm">
                Practice and improve your skills with mock sessions. Perfect for employees preparing for new campaigns.
              </p>

              {/* Features */}
              <ul className="space-y-2 text-sm text-slate-600 mb-5">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Practice mock sessions
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Train on new use cases
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Instant feedback & tips
                </li>
              </ul>

              {/* CTA */}
              <div className="flex items-center text-amber-600 font-medium group-hover:text-amber-700 transition-colors text-sm">
                Start Learning
                <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Footer Info */}
        <div className="mt-16 text-center">
          <p className="text-slate-400 text-sm">
            © 2025 Pragyaa.ai • HR Services Evaluation Platform
          </p>
        </div>
      </div>
    </div>
  );
}
