import React, { useEffect, useRef, useState } from 'react';
import { useVoiceQualityAnalysis } from '../hooks/useVoiceAnalysis';
import { useVoiceAnalysis } from '../contexts/VoiceAnalysisContext';

interface CandidateInfo {
  name: string;
  date: string;
  time: string;
}

interface VoiceVisualizerProps {
  isRecording: boolean;
  sessionStatus: string;
  getMicStream?: () => MediaStream | null;
  candidateInfo?: CandidateInfo;
  onReportReady?: (getReport: () => any) => void;
  /** When true, the component is visually hidden but still functional */
  hidden?: boolean;
}

const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ 
  isRecording, 
  sessionStatus,
  getMicStream,
  candidateInfo,
  onReportReady,
  hidden = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { startAnalysis, stopAnalysis, currentMetrics, metricsHistory, isAnalyzing, setCollectingSamples, clearHistory } = useVoiceQualityAnalysis();
  const { isAnalysisActive } = useVoiceAnalysis(); // From context - controls when to collect samples
  const [hasConnectedStream, setHasConnectedStream] = useState(false);

  // Connect the mic stream for analysis when session is connected
  // Implements retry logic to handle race conditions with mic stream availability
  useEffect(() => {
    console.log('🎤 Mic stream connection useEffect triggered:', {
      sessionStatus,
      hasConnectedStream,
      getMicStreamAvailable: !!getMicStream
    });
    
    let retryTimer: NodeJS.Timeout | null = null;
    let attemptCount = 0;
    const maxAttempts = 60; // 30 seconds max (500ms * 60)
    
    const tryConnectMicStream = () => {
      if (!getMicStream) {
        console.log('⚠️ getMicStream function not available');
        return;
      }
      
      if (hasConnectedStream) {
        console.log('✅ Already connected to mic stream');
        return;
      }
      
      const micStream = getMicStream();
      
      if (micStream) {
        const tracks = micStream.getTracks();
        const audioTracks = tracks.filter(t => t.kind === 'audio');
        const activeTracks = audioTracks.filter(t => t.readyState === 'live' && t.enabled);
        
        console.log('🎤 Mic stream check:', {
          hasStream: !!micStream,
          active: micStream.active,
          totalTracks: tracks.length,
          audioTracks: audioTracks.length,
          activeTracks: activeTracks.length,
          trackDetails: tracks.map(t => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState, muted: t.muted }))
        });
        
        if (micStream.active && activeTracks.length > 0) {
          console.log('🎤✅ Connecting mic stream to voice analysis engine');
          startAnalysis(micStream);
          setHasConnectedStream(true);
          console.log('🎤✅ Voice analysis engine connected and ready');
          return;
        }
      }
      
      attemptCount++;
      if (attemptCount < maxAttempts) {
        if (attemptCount % 4 === 0) { // Log every 2 seconds
          console.log(`⏳ Waiting for mic stream... (attempt ${attemptCount}/${maxAttempts}, stream: ${micStream ? 'exists' : 'null'}, active: ${micStream?.active})`);
        }
        retryTimer = setTimeout(tryConnectMicStream, 500);
      } else {
        console.error('❌ Mic stream not available after 30 seconds. Voice analysis will not work.');
        console.error('❌ Final stream state:', micStream ? { active: micStream.active, tracks: micStream.getTracks().length } : 'null');
      }
    };
    
    if (sessionStatus === 'CONNECTED' && getMicStream && !hasConnectedStream) {
      // Start trying after initial 1 second delay to give time for mic stream to be captured
      console.log('🔄 Session connected, beginning mic stream connection attempts in 1s...');
      retryTimer = setTimeout(tryConnectMicStream, 1000);
    }
    
    if (sessionStatus === 'DISCONNECTED' && hasConnectedStream) {
      console.log('🛑 Session disconnected, stopping analysis (keeping data)');
      stopAnalysis();
      setHasConnectedStream(false);
      // Don't clear history - keep the data for final display
    }
    
    return () => {
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [sessionStatus, getMicStream, hasConnectedStream, startAnalysis, stopAnalysis]);

  // Control sample collection based on analysis phase
  useEffect(() => {
    if (isAnalysisActive) {
      console.log('📊 VOICE ANALYSIS ACTIVE | mic:', hasConnectedStream, '| analyser:', isAnalyzing, '| samples:', metricsHistory.length);
      
      if (!hasConnectedStream) {
        console.warn('⚠️ WARNING: Analysis active but mic NOT connected!');
      }
      if (!isAnalyzing) {
        console.warn('⚠️ WARNING: Analysis active but analyser NOT running!');
      }
      
      setCollectingSamples(true);
    } else {
      console.log('⏸️ VOICE ANALYSIS INACTIVE | samples:', metricsHistory.length);
      setCollectingSamples(false);
    }
  }, [isAnalysisActive, setCollectingSamples, hasConnectedStream, isAnalyzing, metricsHistory.length]);

  // Log when mic stream connection state changes
  useEffect(() => {
    console.log(`🎙️ Mic: ${hasConnectedStream ? 'CONNECTED' : 'NOT CONNECTED'} | active: ${isAnalysisActive} | analyzing: ${isAnalyzing}`);
  }, [hasConnectedStream, isAnalysisActive, isAnalyzing]);

  // Track if we've cleared history for this session to prevent multiple clears
  const hasInitializedSessionRef = useRef(false);
  const lastSessionStatusRef = useRef(sessionStatus);

  // Clear history ONLY on fresh session start (transition from non-connected to connected)
  useEffect(() => {
    const wasConnected = lastSessionStatusRef.current === 'CONNECTED';
    const isNowConnected = sessionStatus === 'CONNECTED';
    
    // Only clear on fresh connection (transition TO connected, not while already connected)
    if (isNowConnected && !wasConnected && !hasInitializedSessionRef.current) {
      console.log('🗑️ New session detected - clearing voice metrics history');
      clearHistory();
      hasInitializedSessionRef.current = true;
    }
    
    // Reset the flag when disconnected so next connection will clear
    if (sessionStatus === 'DISCONNECTED') {
      hasInitializedSessionRef.current = false;
    }
    
    lastSessionStatusRef.current = sessionStatus;
  }, [sessionStatus, clearHistory]);

  // Draw visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Setup canvas for high DPI displays (prevents blurriness)
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const draw = () => {
      const width = rect.width;
      const height = rect.height;

      // Clear canvas
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Title
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 16px system-ui, -apple-system';
      ctx.textAlign = 'center';
      ctx.fillText('Voice Quality Analysis', width / 2, 25);

      // Status indicator
      ctx.font = '12px system-ui, -apple-system';
      if (isAnalysisActive && metricsHistory.length > 0) {
        ctx.fillStyle = '#10b981';
        ctx.fillText(`🎤 ANALYZING PARAGRAPH - ${metricsHistory.length} samples`, width / 2, 45);
      } else if (isAnalysisActive) {
        ctx.fillStyle = '#3b82f6';
        ctx.fillText('👂 Waiting for candidate to speak...', width / 2, 45);
      } else if (metricsHistory.length > 0) {
        ctx.fillStyle = '#6b7280';
        ctx.fillText(`○ Analysis complete - ${metricsHistory.length} samples collected`, width / 2, 45);
      } else {
        ctx.fillStyle = '#6b7280';
        ctx.fillText('○ Waiting for paragraph reading phase...', width / 2, 45);
      }

      // Calculate average scores from history
      // Require minimum 5 samples before showing data to avoid initial spikes
      let avgScores = { clarity: 0, volume: 0, pitch: 0, pace: 0 };
      const MIN_SAMPLES_FOR_DISPLAY = 5;
      
      if (metricsHistory.length >= MIN_SAMPLES_FOR_DISPLAY) {
        const recentSamples = metricsHistory.slice(-50); // Last 50 samples
        avgScores = {
          clarity: recentSamples.reduce((sum, s) => sum + s.clarity, 0) / recentSamples.length,
          volume: recentSamples.reduce((sum, s) => sum + s.volume, 0) / recentSamples.length,
          pitch: recentSamples.reduce((sum, s) => sum + s.pitch, 0) / recentSamples.length,
          pace: recentSamples.reduce((sum, s) => sum + s.pace, 0) / recentSamples.length
        };
      }

      // Convert to 0-100 scale for display
      const displayScores = {
        clarity: Math.min(100, Math.max(0, avgScores.clarity)),
        volume: Math.min(100, Math.max(0, avgScores.volume)),
        tone: avgScores.pitch > 0 ? Math.min(100, Math.max(0, ((avgScores.pitch - 70) / 2.1))) : 0, // Normalize pitch 70-280Hz to 0-100 (covers male 85-180Hz & female 165-255Hz)
        pace: Math.min(100, Math.max(0, avgScores.pace))
      };

      // Metrics with bars
      const metrics = [
        { name: 'Clarity', score: displayScores.clarity, target: 85 },
        { name: 'Volume', score: displayScores.volume, target: 70 },
        { name: 'Tone', score: displayScores.tone, target: 80 },
        { name: 'Pace', score: displayScores.pace, target: 75 }
      ];

      const startY = 65;
      const itemHeight = 45;
      
      metrics.forEach((metric, index) => {
        const y = startY + index * itemHeight;
        
        // Metric name
        ctx.fillStyle = '#374151';
        ctx.font = 'bold 14px system-ui, -apple-system';
        ctx.textAlign = 'left';
        ctx.fillText(metric.name, 20, y + 20);

        // Bar setup
        const barX = 100;
        const barWidth = 150;
        const barHeight = 25;
        
        // Background bar
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(barX, y, barWidth, barHeight);
        
        // Average score bar - green (show if we have enough samples)
        if (metricsHistory.length >= MIN_SAMPLES_FOR_DISPLAY) {
          const scoreWidth = (metric.score / 100) * barWidth;
          ctx.fillStyle = '#10b981';
          ctx.fillRect(barX, y, scoreWidth, barHeight);
        }
        
        // Current value bar - blue overlay (only during active analysis with sufficient volume)
        if (isAnalysisActive && isAnalyzing && currentMetrics.volume > 8) {
          const currentScore = index === 0 ? currentMetrics.clarity :
                              index === 1 ? currentMetrics.volume :
                              index === 2 ? (currentMetrics.pitch > 0 ? Math.min(100, Math.max(0, (currentMetrics.pitch - 70) / 2.1)) : 0) :
                              currentMetrics.pace;
          const currentWidth = (Math.min(100, Math.max(0, currentScore)) / 100) * barWidth;
          ctx.fillStyle = '#3b82f6';
          ctx.globalAlpha = 0.5;
          ctx.fillRect(barX, y, currentWidth, barHeight);
          ctx.globalAlpha = 1.0;
        }
        
        // Target line - red
        const targetX = barX + (metric.target / 100) * barWidth;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(targetX, y - 3);
        ctx.lineTo(targetX, y + barHeight + 3);
        ctx.stroke();
        
        // Score text
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 12px system-ui, -apple-system';
        ctx.textAlign = 'left';
        
        if (metricsHistory.length >= MIN_SAMPLES_FOR_DISPLAY) {
          ctx.fillText(`${Math.round(metric.score)}%`, barX + barWidth + 10, y + 17);
        } else {
          ctx.fillStyle = '#6b7280';
          ctx.fillText('No data', barX + barWidth + 10, y + 17);
        }
      });

      // Legend at bottom
      const legendY = height - 35;
      ctx.font = '11px system-ui, -apple-system';
      ctx.textAlign = 'left';
      
      // Green box - show if we have enough data
      if (metricsHistory.length >= MIN_SAMPLES_FOR_DISPLAY) {
        ctx.fillStyle = '#10b981';
        ctx.fillRect(20, legendY, 15, 10);
        ctx.fillStyle = '#6b7280';
        ctx.fillText('Average', 40, legendY + 8);
      }
      
      // Blue box - only show during active analysis
      if (isAnalysisActive && isAnalyzing) {
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(90, legendY, 15, 10);
        ctx.fillStyle = '#6b7280';
        ctx.fillText('Current', 110, legendY + 8);
      }
      
      // Red line - always show
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const redLineX = (isAnalysisActive && isAnalyzing) ? 160 : 90;
      ctx.moveTo(redLineX, legendY + 5);
      ctx.lineTo(redLineX + 15, legendY + 5);
      ctx.stroke();
      ctx.fillStyle = '#6b7280';
      ctx.fillText('Target', redLineX + 20, legendY + 8);
    };

    draw();

    // Redraw on metrics update
    const interval = setInterval(draw, 100); // Update 10 times per second
    return () => clearInterval(interval);
  }, [currentMetrics, metricsHistory, isAnalyzing]);

  // State for showing detailed breakdown
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Calculate average scores and generate recommendations
  const getAnalysisBreakdown = () => {
    // Require minimum samples for meaningful analysis
    const MIN_SAMPLES = 5;
    if (metricsHistory.length < MIN_SAMPLES) {
      return null;
    }

    // Calculate averages
    const avgPitch = metricsHistory.reduce((sum, m) => sum + m.pitch, 0) / metricsHistory.length;
    const avgVolume = metricsHistory.reduce((sum, m) => sum + m.volume, 0) / metricsHistory.length;
    const avgClarity = metricsHistory.reduce((sum, m) => sum + m.clarity, 0) / metricsHistory.length;
    const avgPace = metricsHistory.reduce((sum, m) => sum + m.pace, 0) / metricsHistory.length;

    // Normalize scores to 0-100%
    const clarityScore = Math.min(100, Math.max(0, avgClarity));
    const volumeScore = Math.min(100, Math.max(0, avgVolume));
    // Tone score: Map pitch 70-280 Hz to 0-100% (covers full human speech range)
    // Male voice: 85-180 Hz, Female voice: 165-255 Hz
    // Formula: (pitch - 70) / 2.1 gives: 70Hz→0%, 175Hz→50%, 280Hz→100%
    const toneScore = avgPitch > 0 
      ? Math.min(100, Math.max(0, ((avgPitch - 70) / 2.1)))
      : 0;
    const paceScore = Math.min(100, Math.max(0, avgPace));

    // Calculate overall score (weighted average)
    const overallScore = Math.round(
      (clarityScore * 0.35) +  // Clarity is most important
      (volumeScore * 0.25) +   // Volume is important
      (paceScore * 0.25) +     // Pace is important
      (toneScore * 0.15)       // Tone is less critical
    );

    // Generate recommendations based on scores
    const recommendations = [];
    const strengths = [];

    if (clarityScore >= 80) strengths.push("Excellent voice clarity");
    else if (clarityScore < 60) recommendations.push("Work on articulation and pronunciation for clearer speech");

    if (volumeScore >= 60) strengths.push("Good vocal projection");
    else if (volumeScore < 50) recommendations.push("Speak louder and project voice more confidently");

    if (paceScore >= 40 && paceScore <= 70) strengths.push("Well-paced speech delivery");
    else if (paceScore < 30) recommendations.push("Increase speaking pace slightly for better engagement");
    else if (paceScore > 80) recommendations.push("Slow down slightly to ensure clarity");

    if (toneScore >= 30 && toneScore <= 70) strengths.push("Appropriate vocal tone");
    else if (toneScore < 20) recommendations.push("Consider varying pitch for more engaging delivery");

    // Overall assessment
    let assessment = "";
    let assessmentColor = "";
    if (overallScore >= 80) {
      assessment = "Excellent - Highly suitable for call center role";
      assessmentColor = "text-green-600";
    } else if (overallScore >= 65) {
      assessment = "Good - Suitable for call center role with minor improvements";
      assessmentColor = "text-blue-600";
    } else if (overallScore >= 50) {
      assessment = "Fair - Needs improvement in some areas";
      assessmentColor = "text-yellow-600";
    } else {
      assessment = "Needs Significant Improvement";
      assessmentColor = "text-red-600";
    }

    const report = {
      avgPitch: avgPitch.toFixed(1),
      avgVolume: avgVolume.toFixed(1),
      avgClarity: avgClarity.toFixed(1),
      avgPace: avgPace.toFixed(1),
      clarityScore: Math.round(clarityScore),
      volumeScore: Math.round(volumeScore),
      toneScore: Math.round(toneScore),
      paceScore: Math.round(paceScore),
      overallScore,
      assessment,
      assessmentColor,
      recommendations,
      strengths,
      sampleCount: metricsHistory.length,
      duration: ((metricsHistory.length * 200) / 1000).toFixed(1) // seconds
    };
    
    // Debug log for tone calculation
    console.log(`[VoiceVisualizer] 🎵 Tone calculation: avgPitch=${avgPitch.toFixed(1)}Hz → formula=(${avgPitch.toFixed(1)}-70)/2.1=${((avgPitch-70)/2.1).toFixed(1)} → toneScore=${Math.round(toneScore)}`);
    console.log('[VoiceVisualizer] Generated report:', report);
    return report;
  };

  const breakdown = getAnalysisBreakdown();

  // Expose the report function to parent components via callback
  useEffect(() => {
    if (onReportReady) {
      onReportReady(() => {
        const report = getAnalysisBreakdown();
        if (report) {
          console.log(`📊 Report generated: score=${report.overallScore}%, samples=${report.sampleCount}`);
        } else {
          console.error(`❌ Report failed: only ${metricsHistory.length} samples (need 5+)`);
        }
        return report;
      });
    }
  }, [onReportReady, metricsHistory.length, getAnalysisBreakdown]);

  // Function to download the voice quality report
  const downloadReport = () => {
    if (!breakdown) return;

    // Get the canvas as an image
    const canvas = canvasRef.current;
    const chartImage = canvas ? canvas.toDataURL('image/png') : '';

    // Get candidate info or use defaults
    const candidateName = candidateInfo?.name || 'Not Provided';
    const interviewDate = candidateInfo?.date 
      ? new Date(candidateInfo.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const interviewTime = candidateInfo?.time || new Date().toTimeString().split(' ')[0].substring(0, 5);

    // Get current date/time for report generation
    const now = new Date();
    const reportGeneratedDate = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const reportGeneratedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Create HTML report
    const reportHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Voice Quality Analysis Report - ${candidateName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      background: white;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #8b5cf6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #8b5cf6;
      margin: 0 0 10px 0;
      font-size: 32px;
    }
    .header p {
      color: #666;
      margin: 5px 0;
      font-size: 14px;
    }
    .candidate-info {
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
      text-align: left;
    }
    .candidate-info h3 {
      color: #374151;
      font-size: 16px;
      margin: 0 0 10px 0;
      font-weight: 600;
    }
    .candidate-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .candidate-info-item {
      font-size: 14px;
    }
    .candidate-info-item strong {
      color: #1f2937;
      display: inline-block;
      min-width: 120px;
    }
    .section {
      margin: 30px 0;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 20px;
      font-weight: bold;
      color: #374151;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    .overall-score {
      background: #f9fafb;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 20px 0;
    }
    .score-number {
      font-size: 48px;
      font-weight: bold;
      color: #111827;
      margin: 10px 0;
    }
    .score-label {
      font-size: 18px;
      color: #6b7280;
      margin-bottom: 10px;
    }
    .assessment {
      font-size: 16px;
      font-weight: 600;
      margin-top: 10px;
    }
    .assessment.excellent { color: #059669; }
    .assessment.good { color: #2563eb; }
    .assessment.fair { color: #d97706; }
    .assessment.poor { color: #dc2626; }
    .chart-container {
      text-align: center;
      margin: 20px 0;
      page-break-inside: avoid;
    }
    .chart-container img {
      max-width: 100%;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }
    .metric-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin: 20px 0;
    }
    .metric-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 15px;
    }
    .metric-card h4 {
      margin: 0 0 8px 0;
      color: #374151;
      font-size: 16px;
    }
    .metric-score {
      font-size: 24px;
      font-weight: bold;
      color: #10b981;
      margin: 5px 0;
    }
    .metric-details {
      font-size: 12px;
      color: #6b7280;
      margin: 8px 0;
    }
    .metric-description {
      font-size: 11px;
      color: #9ca3af;
      margin-top: 8px;
      line-height: 1.4;
    }
    .formula-box {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      padding: 15px;
      margin: 15px 0;
      font-size: 13px;
    }
    .formula-box .formula-title {
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 8px;
    }
    .formula-box .formula {
      color: #1e3a8a;
      font-family: 'Courier New', monospace;
      margin: 5px 0;
    }
    .strengths-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 15px;
      margin: 15px 0;
    }
    .strengths-box h4 {
      color: #166534;
      margin: 0 0 10px 0;
      font-size: 16px;
    }
    .strengths-box ul {
      margin: 0;
      padding-left: 20px;
    }
    .strengths-box li {
      color: #15803d;
      margin: 5px 0;
    }
    .recommendations-box {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 15px;
      margin: 15px 0;
    }
    .recommendations-box h4 {
      color: #92400e;
      margin: 0 0 10px 0;
      font-size: 16px;
    }
    .recommendations-box ul {
      margin: 0;
      padding-left: 20px;
    }
    .recommendations-box li {
      color: #b45309;
      margin: 5px 0;
    }
    .suitability-box {
      background: #f9fafb;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      padding: 15px;
      margin: 15px 0;
    }
    .suitability-box h4 {
      color: #374151;
      margin: 0 0 10px 0;
      font-size: 16px;
    }
    .suitability-item {
      margin: 8px 0;
      font-size: 14px;
    }
    .suitability-item strong {
      color: #1f2937;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Voice Quality Analysis Report</h1>
    <p><strong>Hansa Call Center Evaluation</strong></p>
    <p>Report Generated: ${reportGeneratedDate} at ${reportGeneratedTime}</p>
  </div>

  <div class="candidate-info">
    <h3>Candidate Information</h3>
    <div class="candidate-info-grid">
      <div class="candidate-info-item">
        <strong>Candidate Name:</strong> ${candidateName}
      </div>
      <div class="candidate-info-item">
        <strong>Interview Date:</strong> ${interviewDate}
      </div>
      <div class="candidate-info-item">
        <strong>Interview Time:</strong> ${interviewTime}
      </div>
      <div class="candidate-info-item">
        <strong>Analysis Duration:</strong> ${breakdown.duration}s
      </div>
    </div>
    <div style="margin-top: 10px; font-size: 12px; color: #6b7280;">
      Samples Collected: ${breakdown.sampleCount} • Sampling Rate: 200ms
    </div>
  </div>

  <div class="section">
    <div class="overall-score">
      <div class="score-label">Overall Voice Quality Score</div>
      <div class="score-number">${breakdown.overallScore}%</div>
      <div class="assessment ${breakdown.overallScore >= 80 ? 'excellent' : breakdown.overallScore >= 65 ? 'good' : breakdown.overallScore >= 50 ? 'fair' : 'poor'}">
        ${breakdown.assessment}
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Voice Quality Metrics Visualization</div>
    <div class="chart-container">
      <img src="${chartImage}" alt="Voice Quality Chart" />
    </div>
  </div>

  <div class="section">
    <div class="section-title">Detailed Metric Breakdown</div>
    <div class="metric-grid">
      <div class="metric-card">
        <h4>Clarity</h4>
        <div class="metric-score">${breakdown.clarityScore}%</div>
        <div class="metric-details">Raw Value: ${breakdown.avgClarity}</div>
        <div class="metric-details">Method: Spectral peak-to-average ratio</div>
        <div class="metric-description">
          Measures voice crispness by analyzing frequency distribution. Higher ratio indicates clearer, more articulate speech.
        </div>
      </div>
      
      <div class="metric-card">
        <h4>Volume</h4>
        <div class="metric-score">${breakdown.volumeScore}%</div>
        <div class="metric-details">Raw Value: ${breakdown.avgVolume}</div>
        <div class="metric-details">Method: RMS (Root Mean Square)</div>
        <div class="metric-description">
          Calculates average amplitude of audio signal. Includes noise gate filtering at threshold 3 to eliminate background noise.
        </div>
      </div>
      
      <div class="metric-card">
        <h4>Tone</h4>
        <div class="metric-score">${breakdown.toneScore}%</div>
        <div class="metric-details">Raw Value: ${breakdown.avgPitch} Hz</div>
        <div class="metric-details">Method: Autocorrelation pitch detection</div>
        <div class="metric-description">
          Detects fundamental frequency in 70-280 Hz range. Formula: (pitch - 70) / 2.1 normalized to 0-100%.
        </div>
      </div>
      
      <div class="metric-card">
        <h4>Pace</h4>
        <div class="metric-score">${breakdown.paceScore}%</div>
        <div class="metric-details">Raw Value: ${breakdown.avgPace}</div>
        <div class="metric-details">Method: Voice activity detection</div>
        <div class="metric-description">
          Measures speech rate by counting active audio samples above threshold. Higher percentage indicates faster speech delivery.
        </div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Score Calculation Methodology</div>
    <div class="formula-box">
      <div class="formula-title">Overall Score Formula (Weighted Average):</div>
      <div class="formula">(Clarity × 35%) + (Volume × 25%) + (Pace × 25%) + (Tone × 15%)</div>
      <div class="formula">
        = (${breakdown.clarityScore} × 0.35) + (${breakdown.volumeScore} × 0.25) + (${breakdown.paceScore} × 0.25) + (${breakdown.toneScore} × 0.15)
      </div>
      <div class="formula">= ${breakdown.overallScore}%</div>
      <div style="margin-top: 10px; font-size: 12px; color: #1e40af;">
        <strong>Weighting Rationale:</strong> Clarity is weighted highest (35%) as it's most critical for call center communication. 
        Volume and Pace are equally important (25% each) for customer engagement. Tone is less critical (15%) but contributes to overall professionalism.
      </div>
    </div>
  </div>

  ${breakdown.strengths.length > 0 ? `
  <div class="section">
    <div class="strengths-box">
      <h4>✓ Identified Strengths</h4>
      <ul>
        ${breakdown.strengths.map(s => `<li>${s}</li>`).join('')}
      </ul>
    </div>
  </div>
  ` : ''}

  ${breakdown.recommendations.length > 0 ? `
  <div class="section">
    <div class="recommendations-box">
      <h4>→ Recommendations for Improvement</h4>
      <ul>
        ${breakdown.recommendations.map(r => `<li>${r}</li>`).join('')}
      </ul>
    </div>
  </div>
  ` : ''}

  <div class="section">
    <div class="section-title">Call Center Agent Suitability Assessment</div>
    <div class="suitability-box">
      <div class="suitability-item">
        <strong>Voice Clarity:</strong> ${breakdown.clarityScore >= 70 ? '✓ Meets requirements' : '⚠ Needs improvement'}
      </div>
      <div class="suitability-item">
        <strong>Volume Projection:</strong> ${breakdown.volumeScore >= 50 ? '✓ Adequate' : '⚠ Too soft'}
      </div>
      <div class="suitability-item">
        <strong>Speaking Pace:</strong> ${breakdown.paceScore >= 30 && breakdown.paceScore <= 70 ? '✓ Appropriate' : '⚠ Adjust pace'}
      </div>
      <div class="suitability-item" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #d1d5db;">
        <strong>Overall Recommendation:</strong> 
        <span style="font-weight: bold; color: ${breakdown.overallScore >= 65 ? '#059669' : breakdown.overallScore >= 50 ? '#d97706' : '#dc2626'}">
          ${breakdown.overallScore >= 65 ? 'RECOMMENDED for Call Center Role' : breakdown.overallScore >= 50 ? 'CONDITIONAL - Training Recommended' : 'NOT RECOMMENDED - Significant Improvement Needed'}
        </span>
      </div>
    </div>
  </div>

  <div class="footer">
    <p><strong>Hansa Call Center Operations</strong></p>
    <p>Voice Quality Analysis powered by VoiceAgent 2.0</p>
    <p>This report is confidential and intended for recruitment purposes only.</p>
  </div>
</body>
</html>
    `;

    // Create a new window with the report
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(reportHTML);
      printWindow.document.close();
      
      // Wait for images to load, then trigger print dialog
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };
    }
  };

  // If hidden prop is true, render with visibility hidden but component still functional
  if (hidden) {
    return (
      <div 
        style={{ 
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0
        }}
        aria-hidden="true"
      >
        {/* Canvas still needs minimum size to work properly */}
        <canvas
          ref={canvasRef}
          style={{ width: '300px', height: '280px', display: 'block' }}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-gray-800 text-lg font-semibold">Voice Quality Analysis</h3>
        {breakdown && (
          <button
            onClick={downloadReport}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
            title="Download Analysis Report"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Report
          </button>
        )}
      </div>

      <canvas
        ref={canvasRef}
        className="w-full border border-gray-200 rounded bg-white"
        style={{ width: '100%', height: '280px', display: 'block' }}
      />
      <div className="mt-2 text-sm text-gray-600 flex justify-between">
        <span>
          {isAnalysisActive && isAnalyzing ? (
            currentMetrics.volume > 8 ? (
              <span className="text-green-500">● Analyzing paragraph reading</span>
            ) : (
              <span className="text-blue-500">● Listening for candidate...</span>
            )
          ) : metricsHistory.length > 0 ? (
            <span className="text-gray-700 font-medium">✓ Analysis complete</span>
          ) : (
            <span className="text-gray-500">○ Waiting for paragraph phase</span>
          )}
        </span>
        <span className="text-gray-400">
          {metricsHistory.length} samples
        </span>
      </div>

      {/* Detailed Breakdown Section */}
      {breakdown && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="w-full flex items-center justify-between text-left text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Detailed Analysis & Recommendations
            </span>
            <svg 
              className={`w-5 h-5 transition-transform ${showBreakdown ? 'transform rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showBreakdown && (
            <div className="mt-4 space-y-4 text-sm">
              {/* Overall Assessment */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-700">Overall Score:</span>
                  <span className="text-2xl font-bold text-gray-900">{breakdown.overallScore}%</span>
                </div>
                <p className={`font-medium ${breakdown.assessmentColor}`}>{breakdown.assessment}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Based on {breakdown.sampleCount} audio samples ({breakdown.duration}s of speech)
                </p>
              </div>

              {/* Calculation Methodology */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Calculation Breakdown
                </h4>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded border border-gray-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-700">Clarity</span>
                      <span className="font-bold text-green-600">{breakdown.clarityScore}%</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Raw: {breakdown.avgClarity} | Method: Spectral peak-to-average ratio
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Measures voice crispness by analyzing frequency distribution. Higher ratio = clearer voice.
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded border border-gray-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-700">Volume</span>
                      <span className="font-bold text-green-600">{breakdown.volumeScore}%</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Raw: {breakdown.avgVolume} | Method: RMS (Root Mean Square)
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Calculates average amplitude of audio signal. Noise gate at threshold 3 filters background noise.
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded border border-gray-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-700">Tone</span>
                      <span className="font-bold text-green-600">{breakdown.toneScore}%</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Raw: {breakdown.avgPitch} Hz | Method: Autocorrelation pitch detection
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Detects fundamental frequency (70-280 Hz range). Formula: (pitch - 70) / 2.1 normalized to 0-100%.
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded border border-gray-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-700">Pace</span>
                      <span className="font-bold text-green-600">{breakdown.paceScore}%</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Raw: {breakdown.avgPace} | Method: Voice activity detection
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Measures speech rate by counting active audio samples above threshold. Higher = faster speech.
                    </p>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="text-xs text-blue-800 font-medium">Overall Score Formula:</p>
                  <p className="text-xs text-blue-700 mt-1">
                    (Clarity × 35%) + (Volume × 25%) + (Pace × 25%) + (Tone × 15%)
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    = ({breakdown.clarityScore} × 0.35) + ({breakdown.volumeScore} × 0.25) + ({breakdown.paceScore} × 0.25) + ({breakdown.toneScore} × 0.15) = {breakdown.overallScore}%
                  </p>
                </div>
              </div>

              {/* Strengths */}
              {breakdown.strengths.length > 0 && (
                <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Strengths
                  </h4>
                  <ul className="space-y-1">
                    {breakdown.strengths.map((strength, idx) => (
                      <li key={idx} className="text-sm text-green-700 flex items-start">
                        <span className="mr-2">✓</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {breakdown.recommendations.length > 0 && (
                <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Recommendations for Improvement
                  </h4>
                  <ul className="space-y-1">
                    {breakdown.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-yellow-700 flex items-start">
                        <span className="mr-2">→</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Call Center Suitability */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold text-gray-700 mb-2">Call Center Agent Suitability</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>Voice Clarity:</strong> {breakdown.clarityScore >= 70 ? '✓ Meets requirements' : '⚠ Needs improvement'}</p>
                  <p><strong>Volume Projection:</strong> {breakdown.volumeScore >= 50 ? '✓ Adequate' : '⚠ Too soft'}</p>
                  <p><strong>Speaking Pace:</strong> {breakdown.paceScore >= 30 && breakdown.paceScore <= 70 ? '✓ Appropriate' : '⚠ Adjust pace'}</p>
                  <p><strong>Overall Recommendation:</strong> <span className={breakdown.assessmentColor}>{breakdown.overallScore >= 65 ? 'Recommended' : breakdown.overallScore >= 50 ? 'Conditional' : 'Not Recommended'}</span></p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceVisualizer;
