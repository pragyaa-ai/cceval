import React, { useState, useEffect } from 'react';
import {
  UserCircleIcon,
  ClipboardDocumentListIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  ClockIcon,
  CheckCircleIcon,
  BuildingStorefrontIcon,
  PhoneIcon,
  MapPinIcon,
  EnvelopeIcon,
  IdentificationIcon,
  CalendarIcon,
  UserIcon,
  HomeIcon,
  GlobeAltIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/solid';
import { useDataCollection } from '../contexts/DataCollectionContext';
import { useSalesData } from '../contexts/SalesDataContext';
import { useConsultationData } from '../contexts/ConsultationDataContext';
import { useEvaluationSession } from '../contexts/EvaluationSessionContext';
import VoiceVisualizer from './VoiceVisualizer';
import CandidateInfoForm from './CandidateInfoForm';
import CustomParagraphInput from './CustomParagraphInput';

const AgentVisualizer = ({ 
  isExpanded, 
  currentAgentName,
  sessionStatus,
  getMicStream
}: { 
  isExpanded: boolean;
  currentAgentName?: string;
  sessionStatus?: string;
  getMicStream?: () => MediaStream | null;
}) => {
  const { 
    capturedData, 
    getCompletionPercentage, 
    getCapturedCount, 
    exportData,
    captureDataPoint // For demo purposes
  } = useDataCollection();
  
  const {
    salesData,
    getSalesDataProgress,
    exportSalesData,
    downloadSalesData
  } = useSalesData();
  const {
    consultationData,
    getConsultationProgress,
    exportConsultationData,
    downloadConsultationData
  } = useConsultationData();

  const {
    candidateInfo,
    setCandidateInfo,
    customParagraph,
    setCustomParagraph
  } = useEvaluationSession();

  // Determine which agent we're showing data for
  const isSpotlightAgent = currentAgentName === 'spotlight';
  const isCarDealerAgent = currentAgentName === 'carDealer';
  const isEvaluationAgent = currentAgentName === 'Evaluation Agent';
  const dataToShow = isSpotlightAgent ? salesData : isCarDealerAgent ? consultationData : capturedData;
  const completionPercentage = isSpotlightAgent 
    ? getSalesDataProgress().percentage 
    : isCarDealerAgent 
    ? getConsultationProgress().percentage
    : getCompletionPercentage();
  const capturedCount = isSpotlightAgent 
    ? getSalesDataProgress().completed 
    : isCarDealerAgent
    ? getConsultationProgress().completed
    : getCapturedCount();

  // Call duration tracking
  const [callDuration, setCallDuration] = useState('0:00');
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    if (sessionStatus === 'CONNECTED' && !startTime) {
      setStartTime(new Date());
    } else if (sessionStatus === 'DISCONNECTED') {
      setStartTime(null);
      setCallDuration('0:00');
    }
  }, [sessionStatus, startTime]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (startTime && sessionStatus === 'CONNECTED') {
      interval = setInterval(() => {
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        const minutes = Math.floor(diffInSeconds / 60);
        const seconds = diffInSeconds % 60;
        setCallDuration(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [startTime, sessionStatus]);

  if (!isExpanded) {
    return null;
  }

  // Download collected data as JSON
  const downloadData = () => {
    if (isSpotlightAgent) {
      downloadSalesData('json');
    } else if (isCarDealerAgent) {
      downloadConsultationData('json');
    } else {
      const collectedData = exportData();
      const dataStr = JSON.stringify(collectedData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hansa-call-center-evaluation-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // Icon mapping for data points
  const getDataPointIcon = (dataId: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      // Hansa Call Center evaluation data icons (Evaluation Agent)
      'candidate_name': UserCircleIcon,
      'clarity_articulation': ChatBubbleLeftRightIcon,
      'pace_rhythm': ClockIcon,
      'tone_modulation': UserIcon,
      'filler_usage': ClipboardDocumentListIcon,
      'active_listening': UserCircleIcon,
      'confidence_composure': CheckCircleIcon,
      'empathy_professionalism': UserIcon,
      'pressure_handling': WrenchScrewdriverIcon,
      'deescalation_technique': ChatBubbleLeftRightIcon,
      'solution_orientation': CheckCircleIcon,
      'overall_score': IdentificationIcon,
      'key_strengths': CheckCircleIcon,
      'improvement_areas': ClipboardDocumentListIcon,
      'evaluation_progress': CheckCircleIcon,
      'next_steps': MapPinIcon,
      // Sales data icons (spotlight agent)
      'full_name': UserCircleIcon,
      'car_model': TruckIcon,
      'email_id': EnvelopeIcon,
      // Consultation data icons (car dealer agent)
      'budget_range': CreditCardIcon,
      'timeline': CalendarIcon,
      'usage_type': TruckIcon,
      'financing_preference': BuildingOfficeIcon,
      'test_drive_interest': MapPinIcon,
      'preferred_features': WrenchScrewdriverIcon,
      'contact_preference': PhoneIcon,
    };
    return iconMap[dataId] || ClipboardDocumentListIcon;
  };

  // Dynamic agent data based on current agent
  const currentAgent = isSpotlightAgent ? {
    name: 'Spotlight',
    description: 'Collecting automotive sales lead data.',
    status: 'Active',
  } : isCarDealerAgent ? {
    name: 'Car Dealer',
    description: 'Specialized automotive consultation and sales.',
    status: 'Active',
  } : {
    name: 'Evaluation Agent',
    description: 'Eva - AI interviewer for Hansa Call Center Operations.',
    status: 'Active',
  };

  // Dynamic handoff agents based on current agent
  const handoffAgents = isSpotlightAgent ? [
    { name: 'Car Dealer' },
    { name: 'Human Agent' },
  ] : isCarDealerAgent ? [
    { name: 'Authentication' },
    { name: 'Returns' },
    { name: 'Sales' },
    { name: 'Spotlight' },
    { name: 'Human Agent' },
  ] : isEvaluationAgent ? [
    { name: 'Voice Quality Assessment Agent' },
    { name: 'Human Agent' },
  ] : [
    { name: 'Returns' },
    { name: 'Sales' },
    { name: 'Human Agent' },
  ];

  const totalDataPoints = isSpotlightAgent ? 3 : isCarDealerAgent ? consultationData.length : capturedData.length;
  const metrics = isCarDealerAgent ? [
    { 
      name: 'Consultation Progress', 
      value: `${capturedCount}/${totalDataPoints} (${completionPercentage}%)`, 
      icon: ClipboardDocumentListIcon 
    },
    { name: 'Call Duration', value: callDuration, icon: ClockIcon },
  ] : [
    { 
      name: 'Data Completion', 
      value: `${capturedCount}/${totalDataPoints} (${completionPercentage}%)`, 
      icon: ClipboardDocumentListIcon 
    },
    { name: 'Call Duration', value: callDuration, icon: ClockIcon },
  ];

  return (
    <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-500 text-white p-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">
            {isSpotlightAgent ? 'Sales Data Center' : 
             isCarDealerAgent ? 'Consultation Center' : 
             'Hansa Call Center Evaluation'}
          </h2>
          <p className="text-sm text-purple-200">
            {isSpotlightAgent ? 'Live Sales Lead Collection' : 
             isCarDealerAgent ? 'Live Automotive Consultation' : 
             'Live Candidate Assessment Session'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-sm font-medium">
            {isSpotlightAgent ? 'COLLECTING' : 
             isCarDealerAgent ? 'CONSULTING' : 
             'INTERVIEWING'}
          </span>
        </div>
      </div>

      <div className="p-4 overflow-y-auto space-y-6">
        {/* Candidate Info Form - Show for Evaluation Agent only */}
        {!isSpotlightAgent && !isCarDealerAgent && (
          <CandidateInfoForm 
            onInfoChange={setCandidateInfo}
            initialInfo={candidateInfo}
          />
        )}

        {/* Custom Paragraph Input - Show for Evaluation Agent only */}
        {!isSpotlightAgent && !isCarDealerAgent && (
          <CustomParagraphInput 
            onParagraphChange={setCustomParagraph}
            initialParagraph={customParagraph}
          />
        )}

        {/* Voice Visualizer - Show for Evaluation Agent (always visible once session starts) */}
        {!isSpotlightAgent && !isCarDealerAgent && (
          <VoiceVisualizer 
            isRecording={sessionStatus === 'CONNECTED'} 
            sessionStatus={sessionStatus || 'DISCONNECTED'}
            getMicStream={getMicStream}
            candidateInfo={candidateInfo}
          />
        )}

        {/* Current Agent */}
        <div className="bg-blue-500 text-white p-4 rounded-lg shadow-lg flex items-center justify-between">
          <div className="flex items-center">
            <UserCircleIcon className="h-10 w-10 mr-4" />
            <div>
              <h3 className="text-lg font-bold">{currentAgent.name}</h3>
              <p className="text-sm text-blue-100">{currentAgent.description}</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-blue-200">STATUS</p>
            <p className="font-bold text-md">{currentAgent.status}</p>
          </div>
        </div>

        {/* Data Collection Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-md font-semibold text-gray-700 flex items-center">
              <ClipboardDocumentListIcon className="h-5 w-5 mr-2 text-gray-500" />
              {isSpotlightAgent ? 'Sales Data Collection' : 
               isCarDealerAgent ? 'Consultation Progress' : 
               'Candidate Evaluation Metrics'}
            </h3>
            <button
              onClick={downloadData}
              disabled={isCarDealerAgent ? false : capturedCount === 0}
              className="flex items-center text-sm bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
              {isCarDealerAgent ? 'Download Summary' : `Download (${capturedCount})`}
            </button>
          </div>
          
          {/* Progress Bar - show for all data collection agents */}
          <div className="bg-gray-200 rounded-full h-2 mb-3">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          
          <div className="bg-white rounded-lg p-3 space-y-2 shadow-sm max-h-64 overflow-y-auto">
            {/* Data Collection Display for all agents */}
            {dataToShow.map((dataPoint) => {
              const IconComponent = getDataPointIcon(dataPoint.id);
              const displayName = (dataPoint as any).label || (dataPoint as any).name;
              
              return (
                <div key={dataPoint.id} className="flex items-center justify-between text-gray-600 border-b border-gray-100 pb-2 last:border-b-0">
                  <div className="flex items-center">
                    <IconComponent className="h-5 w-5 mr-3 text-blue-500" />
                    <span className="text-sm font-medium">{displayName}</span>
                  </div>
                  <div className="flex items-center">
                    {dataPoint.value ? (
                      <span className="text-xs text-gray-500 mr-2 max-w-24 truncate">{dataPoint.value}</span>
                    ) : null}
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      dataPoint.status === 'verified' || dataPoint.status === 'captured' 
                        ? 'bg-green-100 text-green-800' 
                        : dataPoint.status === 'not_available'
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {dataPoint.status === 'verified' ? 'Verified' : 
                       dataPoint.status === 'captured' ? 'Captured' :
                       dataPoint.status === 'not_available' ? 'N/A' : 'Pending'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Agent Network */}
        <div>
          <h3 className="text-md font-semibold text-gray-700 mb-2 flex items-center">
            <ShareIcon className="h-5 w-5 mr-2 text-gray-500" />
            Agent Network
          </h3>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <p className="text-sm text-gray-500 mb-2">Can handoff to:</p>
            <div className="flex flex-wrap gap-2">
              {handoffAgents.map((agent) => (
                <span key={agent.name} className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm font-medium">
                  {agent.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Live Metrics */}
        <div>
          <h3 className="text-md font-semibold text-gray-700 mb-2 flex items-center">
            <ClockIcon className="h-5 w-5 mr-2 text-gray-500" />
            Session Metrics
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {metrics.map((metric) => (
              <div key={metric.name} className="bg-white rounded-lg p-3 shadow-sm flex items-center">
                <metric.icon className="h-6 w-6 mr-3 text-green-500" />
                <div>
                  <p className="text-sm text-gray-500">{metric.name}</p>
                  <p className="font-bold text-lg text-gray-800">{metric.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Demo Buttons for Testing */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-700 mb-2 font-medium">
            {isSpotlightAgent ? 'Demo: Simulate Sales Data' : 
             isCarDealerAgent ? 'Demo: Simulate Consultation Data' : 
             'Demo: Simulate Call Center Evaluation'}
          </p>
          <div className="flex flex-wrap gap-2">
            {!isSpotlightAgent && !isCarDealerAgent && (
              <>
                <button
                  onClick={() => captureDataPoint('candidate_name', 'John Smith')}
                  className="text-xs bg-green-500 text-white px-2 py-1 rounded"
                >
                  Candidate Name
                </button>
                <button
                  onClick={() => captureDataPoint('clarity_articulation', '4')}
                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                >
                  Clarity (4)
                </button>
                <button
                  onClick={() => captureDataPoint('confidence_composure', '3')}
                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                >
                  Confidence (3)
                </button>
                <button
                  onClick={() => captureDataPoint('empathy_professionalism', '5')}
                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                >
                  Empathy (5)
                </button>
                <button
                  onClick={() => captureDataPoint('deescalation_technique', '2')}
                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                >
                  De-escalation (2)
                </button>
                <button
                  onClick={() => captureDataPoint('overall_score', '3.4')}
                  className="text-xs bg-purple-500 text-white px-2 py-1 rounded"
                >
                  Overall (3.4)
                </button>
              </>
            )}
            {isSpotlightAgent && (
              <>
                <button
                  onClick={() => captureDataPoint('store_id', 'SI-123456')}
                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                >
                  Store ID
                </button>
                <button
                  onClick={() => captureDataPoint('address_line_1', '123 Main Street, Shop No. 5')}
                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                >
                  Address Line 1
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentVisualizer; 