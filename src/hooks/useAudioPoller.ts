import { useEffect, useRef } from 'react';
import type { AudioControls } from './useAudioAnalyzer';

/**
 * Polls the audio analyzer for jump events and fires a callback.
 * Extracts the duplicated 50ms setInterval pattern used across game modes.
 */
export function useAudioPoller(
  isListening: boolean,
  getAudioControls: () => AudioControls,
  onJump: () => void,
  enabled: boolean = true,
) {
  // Keep onJump stable via ref to avoid re-subscribing on every render
  const onJumpRef = useRef(onJump);
  onJumpRef.current = onJump;

  useEffect(() => {
    if (!isListening || !enabled) return;
    const interval = setInterval(() => {
      const { jump } = getAudioControls();
      if (jump) onJumpRef.current();
    }, 50);
    return () => clearInterval(interval);
  }, [isListening, getAudioControls, enabled]);
}
