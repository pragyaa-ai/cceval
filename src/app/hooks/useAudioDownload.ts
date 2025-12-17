import { useRef, useCallback } from "react";
import { convertWebMBlobToWav } from "../lib/audioUtils";

function useAudioDownload() {
  // Ref to store the MediaRecorder instance.
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  // Ref to collect all recorded Blob chunks.
  const recordedChunksRef = useRef<Blob[]>([]);
  // Ref to store the microphone stream for voice analysis (separate from recording stream)
  const micStreamRef = useRef<MediaStream | null>(null);
  // Ref to store AudioContext to prevent garbage collection
  const audioContextRef = useRef<AudioContext | null>(null);
  // Ref to store source nodes to prevent garbage collection
  const remoteSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  /**
   * Starts recording by combining the provided remote stream with
   * the microphone audio.
   * @param remoteStream - The remote MediaStream (e.g., from the audio element).
   */
  const startRecording = useCallback(async (remoteStream: MediaStream) => {
    let micStream: MediaStream;
    let micStreamForRecording: MediaStream;
    
    try {
      // Request microphone with noise suppression and echo cancellation
      micStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,      // Prevents audio feedback loops
          noiseSuppression: true,       // Reduces background noise
          autoGainControl: true,        // Normalizes volume levels
          sampleRate: 48000,            // High quality audio
          channelCount: 1               // Mono audio (reduces processing)
        }
      });
      
      // IMPORTANT: The ORIGINAL stream should be used for voice analysis (needs live audio data)
      // The CLONE is used for recording (connecting to AudioContext first can "consume" the data)
      // We clone for recording, and keep original for voice analysis
      micStreamForRecording = micStream.clone();
      micStreamRef.current = micStream; // Keep ORIGINAL for voice analysis
      
      console.log('🎤 Microphone stream captured with noise suppression enabled');
      console.log('🎤 Original stream ID (for voice analysis):', micStream.id, 'tracks:', micStream.getTracks().length);
      console.log('🎤 Cloned stream ID (for recording):', micStreamForRecording.id, 'tracks:', micStreamForRecording.getTracks().length);
      console.log('🎤 Original track details:', micStream.getTracks().map(t => ({
        kind: t.kind,
        enabled: t.enabled,
        readyState: t.readyState,
        muted: t.muted
      })));
    } catch (err) {
      console.error("Error getting microphone stream:", err);
      // Fallback to an empty MediaStream if microphone access fails.
      micStream = new MediaStream();
      micStreamForRecording = new MediaStream();
    }

    // Create an AudioContext to merge the streams.
    // IMPORTANT: Store in ref to prevent garbage collection
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    const destination = audioContext.createMediaStreamDestination();

    // Connect the remote audio stream.
    // IMPORTANT: Store source in ref to prevent garbage collection
    try {
      const remoteSource = audioContext.createMediaStreamSource(remoteStream);
      remoteSource.connect(destination);
      remoteSourceRef.current = remoteSource;
    } catch (err) {
      console.error("Error connecting remote stream to the audio context:", err);
    }

    // Connect the CLONED microphone audio stream to recorder
    // The original is kept for voice analysis which needs the live audio data
    // IMPORTANT: Store source in ref to prevent garbage collection
    try {
      const micSource = audioContext.createMediaStreamSource(micStreamForRecording);
      micSource.connect(destination);
      micSourceRef.current = micSource;
      console.log('🎤 Cloned mic stream connected to AudioContext for recording');
    } catch (err) {
      console.error("Error connecting microphone stream to the audio context:", err);
    }

    const options = { mimeType: "audio/webm" };
    try {
      const mediaRecorder = new MediaRecorder(destination.stream, options);
      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      // Start recording without a timeslice.
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
    } catch (err) {
      console.error("Error starting MediaRecorder with combined stream:", err);
    }
  }, []);

  /**
   * Stops the MediaRecorder, if active.
   */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      // Request any final data before stopping.
      mediaRecorderRef.current.requestData();
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    
    // Clean up audio nodes (disconnect before nulling)
    if (remoteSourceRef.current) {
      remoteSourceRef.current.disconnect();
      remoteSourceRef.current = null;
    }
    if (micSourceRef.current) {
      micSourceRef.current.disconnect();
      micSourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  /**
   * Initiates download of the recording after converting from WebM to WAV.
   * If the recorder is still active, we request its latest data before downloading.
   */
  const downloadRecording = useCallback(async () => {
    // If recording is still active, request the latest chunk.
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      // Request the current data.
      mediaRecorderRef.current.requestData();
      // Allow a short delay for ondataavailable to fire.
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (recordedChunksRef.current.length === 0) {
      console.warn("No recorded chunks found to download.");
      return;
    }
    
    // Combine the recorded chunks into a single WebM blob.
    const webmBlob = new Blob(recordedChunksRef.current, { type: "audio/webm" });

    try {
      // Convert the WebM blob into a WAV blob.
      const wavBlob = await convertWebMBlobToWav(webmBlob);
      const url = URL.createObjectURL(wavBlob);

      // Generate a formatted datetime string (replace characters not allowed in filenames).
      const now = new Date().toISOString().replace(/[:.]/g, "-");

      // Create an invisible anchor element and trigger the download.
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `realtime_agents_audio_${now}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Clean up the blob URL after a short delay.
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err) {
      console.error("Error converting recording to WAV:", err);
    }
  }, []);

  /**
   * Get the microphone stream for voice analysis
   */
  const getMicStream = useCallback(() => micStreamRef.current, []);

  /**
   * Get the recording as a Blob for upload (WebM format)
   * Returns null if no recording is available
   */
  const getRecordingBlob = useCallback(async (): Promise<Blob | null> => {
    // If recording is still active, request the latest chunk
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.requestData();
      // Allow a short delay for ondataavailable to fire
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    if (recordedChunksRef.current.length === 0) {
      console.warn("No recorded chunks available for upload.");
      return null;
    }

    // Combine the recorded chunks into a single WebM blob
    return new Blob(recordedChunksRef.current, { type: "audio/webm" });
  }, []);

  /**
   * Clear recorded chunks (call after successful upload)
   */
  const clearRecording = useCallback(() => {
    recordedChunksRef.current = [];
  }, []);

  return { startRecording, stopRecording, downloadRecording, getMicStream, getRecordingBlob, clearRecording };
}

export default useAudioDownload; 