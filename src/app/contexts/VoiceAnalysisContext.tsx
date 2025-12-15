'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';

interface VoiceAnalysisContextType {
  isAnalysisActive: boolean;
  startAnalysis: () => void;
  stopAnalysis: () => void;
}

const VoiceAnalysisContext = createContext<VoiceAnalysisContextType | undefined>(undefined);

// Create a unique ID for each provider instance to track context sharing
let providerInstanceId = 0;

export function VoiceAnalysisProvider({ children }: { children: ReactNode }) {
  const instanceIdRef = useRef(++providerInstanceId);
  const [isAnalysisActive, setIsAnalysisActive] = useState(false);

  // Log provider mount
  useEffect(() => {
    console.log(`🏠 VoiceAnalysisProvider #${instanceIdRef.current} MOUNTED`);
    return () => {
      console.log(`🏠 VoiceAnalysisProvider #${instanceIdRef.current} UNMOUNTED`);
    };
  }, []);

  // Log whenever isAnalysisActive changes
  useEffect(() => {
    console.log(`🎯🎯🎯 VoiceAnalysisContext #${instanceIdRef.current}: isAnalysisActive changed to:`, isAnalysisActive);
  }, [isAnalysisActive]);

  const startAnalysis = useCallback(() => {
    console.log(`🎤🎤🎤 VOICE ANALYSIS STARTED - Provider #${instanceIdRef.current}`);
    console.log('📊 Analysis active state changing from', isAnalysisActive, 'to TRUE');
    setIsAnalysisActive(true);
    // Verify state change happened
    setTimeout(() => {
      console.log(`📊 [Verification] isAnalysisActive should now be true in provider #${instanceIdRef.current}`);
    }, 100);
  }, [isAnalysisActive]);

  const stopAnalysis = useCallback(() => {
    console.log(`🛑🛑🛑 VOICE ANALYSIS STOPPED - Provider #${instanceIdRef.current}`);
    console.log('📊 Analysis active state changing from', isAnalysisActive, 'to FALSE');
    setIsAnalysisActive(false);
  }, [isAnalysisActive]);

  return (
    <VoiceAnalysisContext.Provider value={{ isAnalysisActive, startAnalysis, stopAnalysis }}>
      {children}
    </VoiceAnalysisContext.Provider>
  );
}

export function useVoiceAnalysis() {
  const context = useContext(VoiceAnalysisContext);
  if (!context) {
    throw new Error('useVoiceAnalysis must be used within VoiceAnalysisProvider');
  }
  return context;
}

