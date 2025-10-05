'use client';

import React, { useState, useEffect } from 'react';
import { UserCircleIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/solid';

interface CandidateInfoFormProps {
  onInfoChange: (info: { name: string; date: string; time: string }) => void;
  initialInfo?: { name: string; date: string; time: string };
}

const CandidateInfoForm: React.FC<CandidateInfoFormProps> = ({ onInfoChange, initialInfo }) => {
  const [candidateName, setCandidateName] = useState(initialInfo?.name || '');
  const [interviewDate, setInterviewDate] = useState(initialInfo?.date || '');
  const [interviewTime, setInterviewTime] = useState(initialInfo?.time || '');

  // Auto-populate date and time on mount if not provided
  useEffect(() => {
    if (!initialInfo?.date) {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
      setInterviewDate(dateStr);
    }
    if (!initialInfo?.time) {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
      setInterviewTime(timeStr);
    }
  }, [initialInfo]);

  // Notify parent of changes
  useEffect(() => {
    onInfoChange({
      name: candidateName,
      date: interviewDate,
      time: interviewTime,
    });
  }, [candidateName, interviewDate, interviewTime, onInfoChange]);

  return (
    <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
      <h3 className="text-gray-800 text-md font-semibold mb-3 flex items-center">
        <UserCircleIcon className="h-5 w-5 mr-2 text-purple-600" />
        Candidate Information
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Candidate Name */}
        <div>
          <label htmlFor="candidateName" className="block text-sm font-medium text-gray-700 mb-1">
            Candidate Name
          </label>
          <div className="relative">
            <UserCircleIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              id="candidateName"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              placeholder="Enter candidate name"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Interview Date */}
        <div>
          <label htmlFor="interviewDate" className="block text-sm font-medium text-gray-700 mb-1">
            Interview Date
          </label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="date"
              id="interviewDate"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Interview Time */}
        <div>
          <label htmlFor="interviewTime" className="block text-sm font-medium text-gray-700 mb-1">
            Interview Time
          </label>
          <div className="relative">
            <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="time"
              id="interviewTime"
              value={interviewTime}
              onChange={(e) => setInterviewTime(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
      </div>

      {candidateName && (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
          ℹ️ Candidate info will be included in the evaluation report
        </div>
      )}
    </div>
  );
};

export default CandidateInfoForm;
