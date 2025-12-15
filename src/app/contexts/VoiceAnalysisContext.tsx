'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface VoiceAnalysisContextType {
  isAnalysisActive: boolean;
  startAnalysis: () => void;
  stopAnalysis: () => void;
}

const VoiceAnalysisContext = createContext<VoiceAnalysisContextType | undefined>(undefined);

export function VoiceAnalysisProvider({ children }: { children: ReactNode }) {
  const [isAnalysisActive, setIsAnalysisActive] = useState(false);

  const startAnalysis = useCallback(() => {
    console.log('🎤🎤🎤 VOICE ANALYSIS STARTED - Candidate is now reading the paragraph');
    console.log('📊 Analysis active state changing to TRUE');
    setIsAnalysisActive(true);
  }, []);

  const stopAnalysis = useCallback(() => {
    console.log('🛑🛑🛑 VOICE ANALYSIS STOPPED - Paragraph reading phase completed');
    console.log('📊 Analysis active state changing to FALSE');
    setIsAnalysisActive(false);
  }, []);

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
