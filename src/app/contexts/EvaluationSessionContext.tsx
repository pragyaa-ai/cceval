'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CandidateInfo {
  name: string;
  date: string;
  time: string;
}

interface EvaluationSessionContextType {
  candidateInfo: CandidateInfo;
  setCandidateInfo: (info: CandidateInfo) => void;
  customParagraph: string;
  setCustomParagraph: (paragraph: string) => void;
}

const DEFAULT_PARAGRAPH = `Good customer service is the foundation of any successful business. It requires clear communication, active listening, and genuine empathy for customer concerns. When customers call with problems, they expect prompt, professional assistance. A skilled call center agent can turn a frustrated customer into a loyal advocate by demonstrating patience, understanding, and solution-focused thinking.`;

const EvaluationSessionContext = createContext<EvaluationSessionContextType | undefined>(undefined);

export const EvaluationSessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [candidateInfo, setCandidateInfo] = useState<CandidateInfo>({
    name: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].substring(0, 5),
  });

  const [customParagraph, setCustomParagraph] = useState<string>(DEFAULT_PARAGRAPH);

  return (
    <EvaluationSessionContext.Provider
      value={{
        candidateInfo,
        setCandidateInfo,
        customParagraph,
        setCustomParagraph,
      }}
    >
      {children}
    </EvaluationSessionContext.Provider>
  );
};

export const useEvaluationSession = () => {
  const context = useContext(EvaluationSessionContext);
  if (context === undefined) {
    throw new Error('useEvaluationSession must be used within an EvaluationSessionProvider');
  }
  return context;
};
