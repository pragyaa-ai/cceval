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
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">
            Mahindra HCE Evaluation
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Human Communication Excellence Assessment Platform
          </p>
          <p className="text-sm text-slate-400 mt-2">
            Powered by VoiceAgent 2.0
          </p>
        </div>

        {/* Version Badge */}
        <div className="mb-12">
          <span className="px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-300 rounded-full text-amber-700 text-sm font-medium shadow-sm">
            Version 2.0 • Automotive Edition
          </span>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full">
          {/* Candidate Card */}
          <Link href="/v2/candidate" className="group">
            <div className="relative overflow-hidden rounded-2xl bg-white shadow-lg border border-slate-200 p-8 transition-all duration-300 hover:shadow-xl hover:border-emerald-300 hover:-translate-y-1">
              {/* Icon */}
              <div className="mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>

              {/* Content */}
              <h2 className="text-2xl font-bold text-slate-800 mb-3">
                I'm a Candidate
              </h2>
              <p className="text-slate-500 mb-6 leading-relaxed">
                Start your voice-based evaluation for Mahindra call center position. Enter your access code to begin your personalized assessment.
              </p>

              {/* Features */}
              <ul className="space-y-2 text-sm text-slate-600 mb-6">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Personal interview questions
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Automobile feature reading task
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Mahindra PV & EV call scenarios
                </li>
              </ul>

              {/* CTA */}
              <div className="flex items-center text-emerald-600 font-medium group-hover:text-emerald-700 transition-colors">
                Enter Access Code
                <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Evaluator Card */}
          <Link href="/v2/evaluator" className="group">
            <div className="relative overflow-hidden rounded-2xl bg-white shadow-lg border border-slate-200 p-8 transition-all duration-300 hover:shadow-xl hover:border-violet-300 hover:-translate-y-1">
              {/* Icon */}
              <div className="mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>

              {/* Content */}
              <h2 className="text-2xl font-bold text-slate-800 mb-3">
                I'm an Evaluator
              </h2>
              <p className="text-slate-500 mb-6 leading-relaxed">
                Manage candidates, configure evaluations, and monitor assessment results. Create batches of candidates with unique access codes.
              </p>

              {/* Features */}
              <ul className="space-y-2 text-sm text-slate-600 mb-6">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-violet-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Batch candidate management
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-violet-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Auto-generated access codes
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-violet-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Comprehensive scoring dashboard
                </li>
              </ul>

              {/* CTA */}
              <div className="flex items-center text-violet-600 font-medium group-hover:text-violet-700 transition-colors">
                Open Dashboard
                <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Footer Info */}
        <div className="mt-16 text-center">
          <p className="text-slate-400 text-sm">
            Mahindra & Mahindra • PV & EV Customer Experience Evaluation
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-400">
            <span>Bolero Neo</span>
            <span>•</span>
            <span>XUV700</span>
            <span>•</span>
            <span>XUV400 EV</span>
          </div>
        </div>

        {/* Link to v1 */}
        <div className="mt-8">
          <Link 
            href="/" 
            className="text-slate-400 hover:text-slate-600 text-sm underline underline-offset-4 transition-colors"
          >
            ← Back to v1.0 (Legacy)
          </Link>
        </div>
      </div>
    </div>
  );
}
