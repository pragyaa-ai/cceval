import { useRef, useCallback, useState, useEffect } from 'react';

export interface VoiceQualityMetrics {
  pitch: number;        // Hz (80-300 typical for human voice)
  volume: number;       // dB-like scale (0-100)
  clarity: number;      // Frequency clarity score (0-100)
  pace: number;         // Speech rate indicator (0-100)
  timestamp: number;
}

export interface VoiceAnalysisHook {
  startAnalysis: (stream: MediaStream) => void;
  stopAnalysis: () => void;
  currentMetrics: VoiceQualityMetrics;
  metricsHistory: VoiceQualityMetrics[];
  isAnalyzing: boolean;
  setCollectingSamples: (collecting: boolean) => void;
  clearHistory: () => void;
}

/**
 * Hook to analyze voice quality from an audio stream in real-time
 * Measures: pitch, volume, clarity, and pace
 */
export function useVoiceQualityAnalysis(): VoiceAnalysisHook {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const collectingSamplesRef = useRef<boolean>(false);
  
  const [currentMetrics, setCurrentMetrics] = useState<VoiceQualityMetrics>({
    pitch: 0,
    volume: 0,
    clarity: 0,
    pace: 0,
    timestamp: Date.now()
  });
  
  const [metricsHistory, setMetricsHistory] = useState<VoiceQualityMetrics[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const setCollectingSamples = useCallback((collecting: boolean) => {
    const wasCollecting = collectingSamplesRef.current;
    console.log(`🎯 Sample collection: ${wasCollecting} -> ${collecting}`);
    collectingSamplesRef.current = collecting;
  }, []);

  const clearHistory = useCallback(() => {
    console.log('🗑️ Clearing voice metrics history');
    setMetricsHistory([]);
  }, []);

  const calculatePitch = useCallback((frequencyData: Uint8Array, sampleRate: number): number => {
    // Autocorrelation method for pitch detection
    const SIZE = frequencyData.length;
    const MAX_SAMPLES = Math.floor(SIZE / 2);
    let bestOffset = -1;
    let bestCorrelation = 0;
    let rms = 0;

    // Calculate RMS (root mean square) for volume threshold
    for (let i = 0; i < SIZE; i++) {
      const val = (frequencyData[i] - 128) / 128;
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);

    // Need sufficient volume to detect pitch (lowered threshold for better sensitivity)
    if (rms < 0.005) return 0;

    // Autocorrelation - search only in range corresponding to human voice (60-400Hz)
    // For 48kHz sample rate: offset 120 = 400Hz, offset 800 = 60Hz
    const minOffset = Math.floor(sampleRate / 400); // ~120 for 48kHz
    const maxOffset = Math.min(MAX_SAMPLES, Math.floor(sampleRate / 60)); // ~800 for 48kHz
    
    let foundPeak = false;
    let lastCorrelation = 1;
    
    for (let offset = minOffset; offset < maxOffset; offset++) {
      let correlation = 0;
      for (let i = 0; i < MAX_SAMPLES; i++) {
        correlation += Math.abs(((frequencyData[i] - 128) / 128) - ((frequencyData[i + offset] - 128) / 128));
      }
      correlation = 1 - (correlation / MAX_SAMPLES);
      
      // Lowered threshold from 0.9 to 0.5 - real speech rarely exceeds 0.8 correlation
      // Looking for local maximum (correlation > lastCorrelation means we're going up)
      if (correlation > 0.5 && correlation > bestCorrelation) {
        // Ensure we're at a peak (correlation started declining means we found the peak)
        if (foundPeak || offset === minOffset) {
          bestCorrelation = correlation;
          bestOffset = offset;
          foundPeak = true;
        }
      }
      
      // Detect when we start going up (entering a peak region)
      if (correlation > lastCorrelation && correlation > 0.4) {
        foundPeak = true;
      }
      
      lastCorrelation = correlation;
    }

    // Lowered minimum correlation threshold from 0.01 to allow weaker but valid detections
    if (bestOffset === -1 || bestCorrelation < 0.4) return 0;

    const fundamentalFreq = sampleRate / bestOffset;
    // Human voice range: 60-400 Hz (already constrained by search range, but double-check)
    return (fundamentalFreq >= 60 && fundamentalFreq <= 400) ? fundamentalFreq : 0;
  }, []);

  const calculateVolume = useCallback((timeData: Uint8Array): number => {
    let sum = 0;
    for (let i = 0; i < timeData.length; i++) {
      const amplitude = (timeData[i] - 128) / 128;
      sum += amplitude * amplitude;
    }
    const rms = Math.sqrt(sum / timeData.length);
    // Convert to 0-100 scale with noise gate
    const volume = rms * 500;
    // Noise gate: ignore very low volumes (background noise)
    return volume < 3 ? 0 : Math.min(100, volume);
  }, []);

  const calculateClarity = useCallback((frequencyData: Uint8Array): number => {
    // Measure spectral clarity by analyzing frequency distribution in speech range
    // Focus on frequencies relevant to human speech (roughly bins 2-100 for typical sample rates)
    const speechStart = 2;
    const speechEnd = Math.min(100, frequencyData.length);
    
    let totalEnergy = 0;
    let peakEnergy = 0;
    let energyVariance = 0;
    const energyValues: number[] = [];
    
    for (let i = speechStart; i < speechEnd; i++) {
      const energy = frequencyData[i];
      totalEnergy += energy;
      energyValues.push(energy);
      if (energy > peakEnergy) peakEnergy = energy;
    }
    
    const binCount = speechEnd - speechStart;
    if (totalEnergy === 0 || binCount === 0) return 0;
    
    const avgEnergy = totalEnergy / binCount;
    
    // Calculate variance for spectral spread
    for (const energy of energyValues) {
      energyVariance += Math.pow(energy - avgEnergy, 2);
    }
    energyVariance = Math.sqrt(energyVariance / binCount);
    
    // Clarity score based on:
    // 1. Peak-to-average ratio (higher = clearer, but capped)
    // 2. Low variance indicates focused speech
    const peakRatio = Math.min(5, peakEnergy / Math.max(1, avgEnergy)); // Cap at 5x
    const spreadFactor = Math.max(0.5, 1 - (energyVariance / 100)); // Less spread = better
    
    // Combine factors: base clarity from peak ratio, adjusted by spread
    const rawClarity = (peakRatio / 5) * 100 * spreadFactor;
    
    // Apply a curve to make scores more distributed (not always 100%)
    const curvedClarity = Math.pow(rawClarity / 100, 0.7) * 100;
    
    return Math.min(100, Math.max(0, curvedClarity));
  }, []);

  const calculatePace = useCallback((timeData: Uint8Array): number => {
    // Measure speech rate by detecting voice activity
    const threshold = 10;
    let voiceActivity = 0;
    
    for (let i = 0; i < timeData.length; i++) {
      if (Math.abs(timeData[i] - 128) > threshold) {
        voiceActivity++;
      }
    }
    
    const activityRatio = voiceActivity / timeData.length;
    return Math.min(100, activityRatio * 200);
  }, []);

  // Track frame count for periodic logging
  const frameCountRef = useRef(0);
  
  const analyze = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) {
      console.warn('⚠️ Analyser not available in analyze()');
      return;
    }

    const bufferLength = analyser.frequencyBinCount;
    const timeDataArray = new Uint8Array(bufferLength);
    const frequencyDataArray = new Uint8Array(bufferLength);
    let lastVolumeLogTime = 0;

    const processAudio = () => {
      if (!analyserRef.current || !audioContextRef.current) {
        console.log('⚠️ Analysis stopped - context or analyser no longer available');
        return;
      }

      frameCountRef.current++;
      analyser.getByteTimeDomainData(timeDataArray);
      analyser.getByteFrequencyData(frequencyDataArray);

      const volume = calculateVolume(timeDataArray);
      
      // Track last log time (silent - only log when collecting)
      const now = Date.now();
      
      // Only calculate other metrics if there's significant volume (raised threshold to ignore noise)
      if (volume > 8) {
        const pitch = calculatePitch(timeDataArray, audioContextRef.current.sampleRate);
        const clarity = calculateClarity(frequencyDataArray);
        const pace = calculatePace(timeDataArray);

        // Removed verbose pitch detection logging

        const metrics: VoiceQualityMetrics = {
          pitch,
          volume,
          clarity,
          pace,
          timestamp: Date.now()
        };

        setCurrentMetrics(metrics);

        // Add to history every 200ms if there's activity AND collection is enabled
        if (collectingSamplesRef.current) {
          setMetricsHistory(prev => {
            const lastEntry = prev[prev.length - 1];
            
            if (!lastEntry || now - lastEntry.timestamp > 200) {
              const newHistory = [...prev, metrics].slice(-100); // Keep last 100 samples
              // Log every 10 samples (reduced frequency)
              if (newHistory.length % 10 === 0 || newHistory.length === 1) {
                console.log(`🎵 Sample #${newHistory.length} collected`);
              }
              return newHistory;
            }
            return prev;
          });
        }
      }

      animationFrameRef.current = requestAnimationFrame(processAudio);
    };

    processAudio();
  }, [calculatePitch, calculateVolume, calculateClarity, calculatePace]);

  const startAnalysis = useCallback(async (stream: MediaStream) => {
    console.log('🎤 Starting voice analysis, stream active:', stream.active);
    
    // Verify stream is valid
    if (!stream.active) {
      console.error('❌ Stream not active!');
      return;
    }
    
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      console.error('❌ No audio tracks!');
      return;
    }
    
    const activeTrack = audioTracks[0];
    if (activeTrack.readyState !== 'live') {
      console.error('❌ Track not live:', activeTrack.readyState);
      return;
    }
    
    try {
      // Create audio context
      audioContextRef.current = new AudioContext();
      
      // Resume if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Create analyser
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;

      // Connect stream to analyser
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyser);

      analyserRef.current = analyser;
      setIsAnalyzing(true);

      // Start analysis loop
      analyze();

      console.log('✅ Voice analysis started successfully - now listening for audio');
    } catch (error) {
      console.error('❌ Error starting voice analysis:', error);
    }
  }, [analyze]);

  const stopAnalysis = useCallback(() => {
    console.log('🛑 Voice analysis stopped');
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setIsAnalyzing(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    startAnalysis,
    stopAnalysis,
    currentMetrics,
    metricsHistory,
    isAnalyzing,
    setCollectingSamples,
    clearHistory
  };
}


