import { useState, useRef, useCallback, useEffect } from 'react';
import type { AudioCalibration } from '../types';
import { DEFAULT_CALIBRATION } from '../types';

export interface AudioControls {
  jump: boolean;
  shield: boolean;
  boost: boolean;
  volume: number;
}

/**
 * Maps a sensitivity value (1-10) to a threshold multiplier.
 * Higher sensitivity = lower thresholds = easier to trigger.
 */
function sensitivityToMultiplier(sensitivity: number): number {
  // sensitivity 1 → multiplier 1.8 (harder)
  // sensitivity 5 → multiplier 1.0 (default)
  // sensitivity 10 → multiplier 0.3 (easier)
  return 1.0 + (5 - sensitivity) * 0.16;
}

export function useAudioAnalyzer(calibration?: AudioCalibration) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isStartingRef = useRef(false);

  // Initialize volume history with -1 to indicate "no data" state
  const volumeHistory = useRef<number[]>(Array(10).fill(-1));
  const lastJumpTime = useRef<number>(0);

  const calibrationRef = useRef<AudioCalibration>(calibration ?? DEFAULT_CALIBRATION);
  useEffect(() => {
    calibrationRef.current = calibration ?? DEFAULT_CALIBRATION;
  }, [calibration]);

  const stopListening = useCallback(() => {
    // Disconnect source node to prevent memory leak
    if (sourceRef.current) {
      try { sourceRef.current.disconnect(); } catch { /* already disconnected */ }
      sourceRef.current = null;
    }

    // Stop all media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Close AudioContext
    const ctx = audioContextRef.current;
    if (ctx && ctx.state !== 'closed') {
      ctx.close().catch(() => { /* already closing */ });
    }
    audioContextRef.current = null;
    analyserRef.current = null;
    dataArrayRef.current = null;

    // Reset volume history
    volumeHistory.current = Array(10).fill(-1);

    isStartingRef.current = false;
    setIsListening(false);
  }, []);

  const startListening = useCallback(async () => {
    // Prevent race condition: don't start if already starting or listening
    if (isStartingRef.current || isListening) return;
    isStartingRef.current = true;

    try {
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Create AudioContext with Safari/webkit fallback
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();

      // CRITICAL: Resume AudioContext for Safari/iOS (suspended by default until user gesture)
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512; // Increased from 256 for better frequency resolution
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

      isStartingRef.current = false;
      setIsListening(true);
    } catch (err) {
      isStartingRef.current = false;
      const message = err instanceof DOMException && err.name === 'NotAllowedError'
        ? 'Microphone permission denied. Please allow microphone access to play.'
        : 'Could not access microphone. Please check your device settings.';
      setError(message);
      console.error('Error accessing microphone:', err);

      // Clean up partial resources on error
      stopListening();
    }
  }, [isListening, stopListening]);

  const getAudioControls = useCallback((): AudioControls => {
    const ctx = audioContextRef.current;
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;

    // Verify AudioContext is still running
    if (!analyser || !dataArray || !ctx || ctx.state !== 'running') {
      return { jump: false, shield: false, boost: false, volume: 0 };
    }

    analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const volume = sum / dataArray.length;

    volumeHistory.current.push(volume);
    volumeHistory.current.shift();

    // Only use valid (non-sentinel) values for averaging
    const validHistory = volumeHistory.current.filter(v => v >= 0);
    if (validHistory.length < 3) {
      // Not enough data yet — skip detection to avoid false positives
      return { jump: false, shield: false, boost: false, volume };
    }

    const avgVolume = validHistory.reduce((a, b) => a + b, 0) / validHistory.length;
    const oldestValid = validHistory[0];
    const volumeDelta = volume - oldestValid;

    // Frequency analysis for plosive detection
    const sampleRate = ctx.sampleRate;
    const binSize = (sampleRate / 2) / analyser.frequencyBinCount;
    const startBin = Math.floor(4000 / binSize);
    const endBin = Math.floor(8000 / binSize);

    let highFreqSum = 0;
    let highFreqCount = 0;
    for (let i = startBin; i <= endBin && i < dataArray.length; i++) {
      highFreqSum += dataArray[i];
      highFreqCount++;
    }
    const highFreqEnergy = highFreqCount > 0 ? highFreqSum / highFreqCount : 0;

    const cal = calibrationRef.current;
    const jumpMul = sensitivityToMultiplier(cal.jumpSensitivity);
    const shieldMul = sensitivityToMultiplier(cal.shieldSensitivity);
    const boostMul = sensitivityToMultiplier(cal.boostSensitivity);

    const now = Date.now();
    let jump = false;

    // JUMP: Sharp attack + high frequency + minimum volume
    const isSharpAttack = (volume - avgVolume) > (6 * jumpMul) || volumeDelta > (8 * jumpMul);
    const isLoudEnough = volume > (8 * jumpMul);
    const hasHighFreq = highFreqEnergy > (8 * jumpMul) && highFreqEnergy > volume * 0.3;
    const isNotSustained = avgVolume < (35 * jumpMul);

    if (isSharpAttack && isLoudEnough && hasHighFreq && isNotSustained) {
      if (now - lastJumpTime.current > 500) {
        jump = true;
        lastJumpTime.current = now;
      }
    }

    // BOOST: Sustained very loud volume
    const boost = avgVolume > (45 * boostMul);

    // SHIELD: Sustained moderate volume, not a sharp attack
    const shieldMin = 15 * shieldMul;
    const shieldMax = 45 * boostMul;
    const shield = avgVolume > shieldMin && avgVolume <= shieldMax && !jump;

    return { jump, shield, boost, volume: avgVolume };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopListening();
  }, [stopListening]);

  return { isListening, error, startListening, stopListening, getAudioControls };
}
