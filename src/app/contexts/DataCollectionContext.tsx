"use client";

import React, { createContext, useContext, useState, FC, PropsWithChildren } from 'react';

export interface DataPoint {
  id: string;
  name: string;
  value: string | null;
  status: 'pending' | 'captured' | 'verified';
  timestamp?: Date;
}

interface DataCollectionContextValue {
  capturedData: DataPoint[];
  captureDataPoint: (dataId: string, value: string, status?: 'captured' | 'verified') => void;
  updateDataPoint: (dataId: string, updates: Partial<DataPoint>) => void;
  resetAllData: () => void;
  getCompletionPercentage: () => number;
  getCapturedCount: () => number;
  exportData: () => any;
}

const DataCollectionContext = createContext<DataCollectionContextValue | undefined>(undefined);

export const useDataCollection = () => {
  const context = useContext(DataCollectionContext);
  if (context === undefined) {
    throw new Error('useDataCollection must be used within a DataCollectionProvider');
  }
  return context;
};

export const DataCollectionProvider: FC<PropsWithChildren> = ({ children }) => {
  const [capturedData, setCapturedData] = useState<DataPoint[]>([
    // Candidate Information
    { id: 'candidate_name', name: 'Candidate Name', value: null, status: 'pending' },
    // Core Evaluation Metrics
    { id: 'clarity_articulation', name: 'Clarity & Articulation', value: null, status: 'pending' },
    { id: 'pace_rhythm', name: 'Pace & Rhythm', value: null, status: 'pending' },
    { id: 'tone_modulation', name: 'Tone & Pitch Modulation', value: null, status: 'pending' },
    { id: 'filler_usage', name: 'Filler Word Usage', value: null, status: 'pending' },
    { id: 'active_listening', name: 'Active Listening', value: null, status: 'pending' },
    { id: 'confidence_composure', name: 'Confidence & Composure', value: null, status: 'pending' },
    { id: 'empathy_professionalism', name: 'Empathy & Professionalism', value: null, status: 'pending' },
    { id: 'pressure_handling', name: 'Handling Pressure (Fumbling)', value: null, status: 'pending' },
    { id: 'deescalation_technique', name: 'De-escalation Technique', value: null, status: 'pending' },
    { id: 'solution_orientation', name: 'Solution Orientation', value: null, status: 'pending' },
    // Summary Metrics
    { id: 'overall_score', name: 'Overall Score', value: null, status: 'pending' },
    { id: 'key_strengths', name: 'Key Strengths', value: null, status: 'pending' },
    { id: 'improvement_areas', name: 'Areas for Improvement', value: null, status: 'pending' },
    // Process Tracking
    { id: 'evaluation_progress', name: 'Evaluation Progress', value: null, status: 'pending' },
    { id: 'next_steps', name: 'Next Steps', value: null, status: 'pending' },
  ]);

  const captureDataPoint = (dataId: string, value: string, status: 'captured' | 'verified' = 'captured') => {
    console.log(`[DataCollection] Capturing ${dataId}: ${value}`);
    setCapturedData(prev => prev.map(item => 
      item.id === dataId 
        ? { ...item, value, status, timestamp: new Date() }
        : item
    ));
  };

  const updateDataPoint = (dataId: string, updates: Partial<DataPoint>) => {
    setCapturedData(prev => prev.map(item => 
      item.id === dataId 
        ? { ...item, ...updates, timestamp: new Date() }
        : item
    ));
  };

  const resetAllData = () => {
    setCapturedData(prev => prev.map(item => ({
      ...item,
      value: null,
      status: 'pending' as const,
      timestamp: undefined
    })));
  };

  const getCompletionPercentage = () => {
    const capturedCount = capturedData.filter(item => item.status === 'captured' || item.status === 'verified').length;
    return Math.round((capturedCount / capturedData.length) * 100);
  };

  const getCapturedCount = () => {
    return capturedData.filter(item => item.status === 'captured' || item.status === 'verified').length;
  };

  const exportData = () => {
    return capturedData
      .filter(item => item.value)
      .reduce((acc, item) => {
        acc[item.name] = {
          value: item.value,
          timestamp: item.timestamp?.toISOString(),
          status: item.status
        };
        return acc;
      }, {} as any);
  };

  const value: DataCollectionContextValue = {
    capturedData,
    captureDataPoint,
    updateDataPoint,
    resetAllData,
    getCompletionPercentage,
    getCapturedCount,
    exportData,
  };

  return (
    <DataCollectionContext.Provider value={value}>
      {children}
    </DataCollectionContext.Provider>
  );
}; 