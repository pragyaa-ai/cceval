# Voice Analysis Fixes - Reference Documentation

> **Last Updated:** December 16, 2025
> **Purpose:** Document all voice analysis related fixes to prevent circular debugging

---

## Current Working Architecture

### Key Files
| File | Purpose |
|------|---------|
| `src/app/contexts/VoiceAnalysisContext.tsx` | Simple context with `isAnalysisActive` state - controls WHEN to collect samples |
| `src/app/hooks/useVoiceAnalysis.ts` | Core analysis hook - handles audio processing, pitch/volume/clarity/pace calculation |
| `src/app/hooks/useAudioDownload.ts` | Mic stream management - **CLONES stream** for voice analysis |
| `src/app/components/VoiceVisualizer.tsx` | UI component - connects stream, displays metrics, generates reports |
| `src/app/v2/agents/mahindraEvaluationAgent.ts` | Agent instructions - controls evaluation flow |

### Data Flow
```
1. getUserMedia() → micStream (original)
2. micStream.clone() → micStreamForAnalysis (separate stream for voice analysis)
3. Original stream → AudioContext (for recording)
4. Cloned stream → VoiceVisualizer → useVoiceQualityAnalysis hook
5. Agent calls start_voice_analysis → isAnalysisActive = true → samples collected
6. Agent calls stop_voice_analysis → isAnalysisActive = false → collection stops
7. Agent calls get_voice_analysis_report → report generated from collected samples
```

---

## Known Issues & Fixes

### Issue 1: Audio Samples Not Collected (MediaStream Consumed)
**Symptom:** `volume=0.0`, no samples collected despite mic being active
**Root Cause:** Original `micStream` was connected to `AudioContext` for recording, which "consumes" the stream. The same stream passed to voice analysis had no data.
**Fix (commit `a7eecf3`):** Clone the mic stream in `useAudioDownload.ts`:
```javascript
const micStreamForAnalysis = micStream.clone();
micStreamRef.current = micStreamForAnalysis;
// Original stream → recording, cloned stream → voice analysis
```

### Issue 2: Tone Score Formula (Multiple Iterations)
**History:**
1. Original: `(pitch - 80) / 2.2` → 80-300Hz range - Male voices got 0%
2. First fix: `(pitch - 60) / 1.4` → 60-200Hz range - Female voices maxed at 100%
3. **Final fix:** `(pitch - 70) / 2.1` → 70-280Hz range - Covers full human speech

**Current formula in `VoiceVisualizer.tsx`:**
```javascript
// Maps 70-280Hz to 0-100% (covers male 85-180Hz & female 165-255Hz)
// 70Hz→0%, 100Hz→14%, 175Hz→50%, 236Hz→79%, 280Hz→100%
const toneScore = avgPitch > 0 
  ? Math.min(100, Math.max(0, ((avgPitch - 70) / 2.1)))
  : 0;
```

**Test results:**
- 74 Hz (low male) → 2%
- 100 Hz (male) → 14%
- 175 Hz (middle) → 50%
- 236 Hz (female) → 79%
- 280 Hz (high female) → 100%

### Issue 3: Agent Reads Paragraph Twice
**Symptom:** Agent demonstrates by reading the paragraph, then asks candidate to read the same paragraph
**Root Cause:** Agent instructions said "DEMONSTRATE by reading the paragraph aloud clearly"
**Fix (December 16, 2025):** Updated `mahindraEvaluationAgent.ts`:
- Removed "DEMONSTRATE" instruction
- Added: "⚠️ CRITICAL RULE: DO NOT READ THE PARAGRAPH YOURSELF"
- Agent now only presents the paragraph text and asks candidate to read

### Issue 4: Sample Collection Race Condition
**Symptom:** Samples collected briefly then cleared; `samples: 0` after having samples
**Root Cause:** `clearHistory` useEffect in `VoiceVisualizer.tsx` had `clearHistory` function as dependency. If function reference changed, history was cleared even while connected.
**Fix (December 16, 2025):** Added ref-based guards:
```javascript
const hasInitializedSessionRef = useRef(false);
const lastSessionStatusRef = useRef(sessionStatus);

// Only clear on TRANSITION to connected, not while already connected
useEffect(() => {
  const wasConnected = lastSessionStatusRef.current === 'CONNECTED';
  const isNowConnected = sessionStatus === 'CONNECTED';
  
  if (isNowConnected && !wasConnected && !hasInitializedSessionRef.current) {
    clearHistory();
    hasInitializedSessionRef.current = true;
  }
  
  if (sessionStatus === 'DISCONNECTED') {
    hasInitializedSessionRef.current = false;
  }
  
  lastSessionStatusRef.current = sessionStatus;
}, [sessionStatus, clearHistory]);
```

---

## Important Commits Reference

| Commit | Description | Files Changed |
|--------|-------------|---------------|
| `aa01cbc` | Revert to original working voice analysis | VoiceAnalysisContext, VoiceVisualizer, CandidateApp, Agent |
| `a7eecf3` | Clone mic stream for voice analysis | useAudioDownload.ts |
| `8b5cd2b` | Improve pitch detection thresholds | useVoiceAnalysis.ts |
| `fde9c2b` | Fix tone score formula (60-200Hz) | VoiceVisualizer.tsx |
| `0e78589` | Prevent agent reading paragraph twice | mahindraEvaluationAgent.ts |

---

## Debugging Checklist

When voice analysis isn't working, check these in order:

### 1. Is the mic stream being cloned?
Look for console logs:
```
🎤 Original stream ID: {xxx} tracks: 1
🎤 Cloned stream for analysis ID: {yyy} tracks: 1
```
**If missing:** Check `useAudioDownload.ts` has `micStream.clone()` call

### 2. Is the stream connected to the analyzer?
Look for:
```
🎤✅ Connecting mic stream to voice analysis engine
📊 hasConnectedStream: true
```
**If not connected:** Check `VoiceVisualizer` is receiving `getMicStream` prop

### 3. Is analysis active when candidate speaks?
Look for:
```
📊📊📊 Voice analysis phase ACTIVE - collecting samples NOW
🎯 collectingSamplesRef.current is now: true
```
**If not active:** Check agent called `start_voice_analysis` tool

### 4. Are samples being collected?
Look for:
```
🎵 Voice sample collected: #X (volume: XX, clarity: XX)
```
**If volume=0:** Stream might be consumed (Issue #1)

### 5. Is tone score calculated correctly?
Look for:
```
[VoiceVisualizer] 🎵 Tone calculation: avgPitch=XXHz → toneScore=XX
```
**If toneScore=0 with avgPitch>60:** Formula might be wrong (Issue #2)

---

## DO NOT CHANGE (Stable Components)

These have been tested and work correctly - avoid modifying:

1. **VoiceAnalysisContext.tsx** - Simple state context, reverted to original working version
2. **Stream cloning logic in useAudioDownload.ts** - Critical for audio sample collection
3. **calculatePitch function in useVoiceAnalysis.ts** - Autocorrelation algorithm works correctly

---

## Testing Voice Analysis

1. Start evaluation session
2. Complete personal questions phase
3. When reading task starts, check console for:
   - `start_voice_analysis TOOL CALLED`
   - `📊 Analysis active state changing to TRUE`
   - `🎵 Voice sample collected: #X` (should see many of these)
4. After candidate reads:
   - `stop_voice_analysis` tool called
   - `get_voice_analysis_report` tool called
   - Report shows `toneScore > 0` if `avgPitch > 60`
