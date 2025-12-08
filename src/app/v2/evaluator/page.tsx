"use client";

import React, { Suspense } from "react";
import { LanguageProvider } from "@/app/contexts/LanguageContext";
import { TranscriptProvider } from "@/app/contexts/TranscriptContext";
import { EventProvider } from "@/app/contexts/EventContext";
import EvaluatorDashboard from "./EvaluatorDashboard";

export default function EvaluatorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading Dashboard...</div>
      </div>
    }>
      <LanguageProvider>
        <TranscriptProvider>
          <EventProvider>
            <EvaluatorDashboard />
          </EventProvider>
        </TranscriptProvider>
      </LanguageProvider>
    </Suspense>
  );
}

