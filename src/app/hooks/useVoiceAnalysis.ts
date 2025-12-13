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
    console.log(`🎯 Voice sample collection: ${collecting ? 'ENABLED' : 'DISABLED'}`);
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

    // Need sufficient volume to detect pitch
    if (rms < 0.01) return 0;

    // Autocorrelation
    let lastCorrelation = 1;
    for (let offset = 0; offset < MAX_SAMPLES; offset++) {
      let correlation = 0;
      for (let i = 0; i < MAX_SAMPLES; i++) {
        correlation += Math.abs(((frequencyData[i] - 128) / 128) - ((frequencyData[i + offset] - 128) / 128));
      }
      correlation = 1 - (correlation / MAX_SAMPLES);
      
      if (correlation > 0.9 && correlation > lastCorrelation) {
        const foundGoodCorrelation = correlation > bestCorrelation;
        if (foundGoodCorrelation) {
          bestCorrelation = correlation;
          bestOffset = offset;
        }
      }
      lastCorrelation = correlation;
    }

    if (bestOffset === -1 || bestCorrelation < 0.01) return 0;

    const fundamentalFreq = sampleRate / bestOffset;
    // Human voice range: 80-300 Hz
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

  const analyze = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const timeDataArray = new Uint8Array(bufferLength);
    const frequencyDataArray = new Uint8Array(bufferLength);

    const processAudio = () => {
      if (!analyserRef.current || !audioContextRef.current) return;

      analyser.getByteTimeDomainData(timeDataArray);
      analyser.getByteFrequencyData(frequencyDataArray);

      const volume = calculateVolume(timeDataArray);
      
      // Only calculate other metrics if there's significant volume (raised threshold to ignore noise)
      if (volume > 8) {
        const pitch = calculatePitch(timeDataArray, audioContextRef.current.sampleRate);
        const clarity = calculateClarity(frequencyDataArray);
        const pace = calculatePace(timeDataArray);

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
            const now = Date.now();
            const lastEntry = prev[prev.length - 1];
            
            if (!lastEntry || now - lastEntry.timestamp > 200) {
              const newHistory = [...prev, metrics].slice(-100); // Keep last 100 samples
              if (newHistory.length % 5 === 0 || newHistory.length === 1) { // Log every 5 samples
                console.log(`🎵 Voice sample collected: #${newHistory.length} (volume: ${metrics.volume.toFixed(1)}, clarity: ${metrics.clarity.toFixed(1)})`);
              }
              return newHistory;
            }
            return prev;
          });
        } else if (collectingSamplesRef.current === false && Math.random() < 0.01) {
          // Occasional log when not collecting (1% of frames)
          console.log('⏸️ Audio detected but sample collection disabled (waiting for reading phase)');
        }
      }

      animationFrameRef.current = requestAnimationFrame(processAudio);
    };

    processAudio();
  }, [calculatePitch, calculateVolume, calculateClarity, calculatePace]);

  const startAnalysis = useCallback((stream: MediaStream) => {
    console.log('🎤 Starting voice quality analysis...');
    
    try {
      // Create audio context
      audioContextRef.current = new AudioContext();
      
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
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

      console.log('✅ Voice analysis started successfully');
    } catch (error) {
      console.error('❌ Error starting voice analysis:', error);
    }
  }, [analyze]);

  const stopAnalysis = useCallback(() => {
    console.log('🛑 Stopping voice analysis...');
    
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
    
    console.log('✅ Voice analysis stopped');
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


