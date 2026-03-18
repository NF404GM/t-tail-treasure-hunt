import { useState, useRef, useCallback, useEffect } from 'react';

export interface AudioControls {
  jump: boolean;
  shield: boolean;
  boost: boolean;
  volume: number;
}

export function useAudioAnalyzer() {
  const [isListening, setIsListening] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  const volumeHistory = useRef<number[]>(Array(10).fill(0));
  const lastJumpTime = useRef<number>(0);

  const [error, setError] = useState<string | null>(null);

  const startListening = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioContextRef.current = ctx;
      analyserRef.current = ctx.createAnalyser();
      analyserRef.current.fftSize = 256;

      sourceRef.current = ctx.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);

      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
      setIsListening(true);
    } catch (err) {
      const message = err instanceof DOMException && err.name === 'NotAllowedError'
        ? 'Microphone permission denied. Please allow microphone access to play.'
        : 'Could not access microphone. Please check your device settings.';
      setError(message);
      console.error('Error accessing microphone:', err);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.mediaStream.getTracks().forEach(track => track.stop());
      sourceRef.current = null;
    }
    const ctx = audioContextRef.current;
    if (ctx && ctx.state !== 'closed') {
      ctx.close().catch(() => { /* already closing */ });
    }
    audioContextRef.current = null;
    analyserRef.current = null;
    dataArrayRef.current = null;
    setIsListening(false);
  }, []);

  const getAudioControls = useCallback((): AudioControls => {
    if (!analyserRef.current || !dataArrayRef.current || !audioContextRef.current) {
      return { jump: false, shield: false, boost: false, volume: 0 };
    }
    
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    
    let sum = 0;
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      sum += dataArrayRef.current[i];
    }
    const volume = sum / dataArrayRef.current.length;
    
    volumeHistory.current.push(volume);
    volumeHistory.current.shift();
    
    const avgVolume = volumeHistory.current.reduce((a, b) => a + b, 0) / volumeHistory.current.length;
    const oldestVolume = volumeHistory.current[0];
    const volumeDelta = volume - oldestVolume;
    
    const sampleRate = audioContextRef.current.sampleRate;
    const binSize = (sampleRate / 2) / analyserRef.current.frequencyBinCount;
    const startBin = Math.floor(4000 / binSize);
    const endBin = Math.floor(8000 / binSize);
    
    let highFreqSum = 0;
    let highFreqCount = 0;
    for (let i = startBin; i <= endBin && i < dataArrayRef.current.length; i++) {
      highFreqSum += dataArrayRef.current[i];
      highFreqCount++;
    }
    const highFreqEnergy = highFreqCount > 0 ? highFreqSum / highFreqCount : 0;
    
    const now = Date.now();
    let jump = false;
    
    // JUMP: Sharp attack + high frequency + minimum volume
    // 1. isSharpAttack: Current volume is significantly higher than the recent average.
    // 2. isLoudEnough: Minimum volume threshold to ignore background noise.
    // 3. hasHighFreq: Plosives like "T!" have significant high-frequency energy compared to vowels like "Ahhh".
    // 4. isNotSustained: Prevents jumps if the user is already yelling (boosting).
    const isSharpAttack = (volume - avgVolume) > 6 || volumeDelta > 8;
    const isLoudEnough = volume > 8;
    const hasHighFreq = highFreqEnergy > 8 && highFreqEnergy > volume * 0.3;
    const isNotSustained = avgVolume < 35;
    
    if (isSharpAttack && isLoudEnough && hasHighFreq && isNotSustained) {
      if (now - lastJumpTime.current > 500) { // 500ms cooldown to prevent accidental double jumps
        jump = true;
        lastJumpTime.current = now;
      }
    }
    
    // BOOST: Sustained very loud volume
    const boost = avgVolume > 45;
    
    // SHIELD: Sustained moderate volume, not a sharp attack
    const shield = avgVolume > 15 && avgVolume <= 45 && !jump;

    return { jump, shield, boost, volume: avgVolume };
  }, []);

  return { isListening, error, startListening, stopListening, getAudioControls };
}
