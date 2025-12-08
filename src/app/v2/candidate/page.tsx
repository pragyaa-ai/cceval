"use client";

import React, { Suspense } from "react";
import { LanguageProvider } from "@/app/contexts/LanguageContext";
import { TranscriptProvider } from "@/app/contexts/TranscriptContext";
import { EventProvider } from "@/app/contexts/EventContext";
import CandidateApp from "./CandidateApp";

export default function CandidatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      <LanguageProvider>
        <TranscriptProvider>
          <EventProvider>
            <CandidateApp />
          </EventProvider>
        </TranscriptProvider>
      </LanguageProvider>
    </Suspense>
  );
}

