import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mic2, Sparkles } from 'lucide-react';
import type { MinimalPair, AudioCalibration } from '../../types';
import { useAudioAnalyzer } from '../../hooks/useAudioAnalyzer';
import { useAudioPoller } from '../../hooks/useAudioPoller';
import { Card } from '../Card';

export const PracticeModal = ({
  pair,
  onClose,
  onSuccess,
  showLabels,
  calibration,
}: {
  pair: MinimalPair;
  onClose: () => void;
  onSuccess: () => void;
  showLabels: boolean;
  calibration?: AudioCalibration;
}) => {
  const { isListening, error: micError, startListening, stopListening, getAudioControls } = useAudioAnalyzer(calibration);
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    startListening();
    return () => stopListening();
  }, [startListening, stopListening]);

  useAudioPoller(isListening, getAudioControls, () => {
    if (!detected) {
      setDetected(true);
      setTimeout(() => onSuccess(), 1000);
    }
  }, !detected);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm" role="dialog" aria-label={`Practice ${pair.targetWord}`}>
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl"
      >
        <div className="mb-6 flex justify-between items-center">
          <h3 className="text-2xl font-black uppercase">{pair.targetWord} Island</h3>
          <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-600 text-xl p-1">
            &#x2715;
          </button>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <Card pair={pair} type="error" showLabel={showLabels} />
          <Card pair={pair} type="target" showLabel={showLabels} />
        </div>

        <div className="mt-8 flex flex-col items-center justify-center h-20">
          {micError && (
            <p className="text-red-500 font-bold text-sm mb-2">{micError}</p>
          )}
          {!detected ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3 w-full"
            >
              <div className="flex items-center gap-2 text-orange-500 font-bold uppercase tracking-widest">
                <Mic2 size={24} className="animate-pulse" aria-hidden="true" /> Say &quot;{pair.targetWord}&quot; loudly!
              </div>
              <div className="w-64 h-3 bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-label="Listening indicator">
                <motion.div
                  className="h-full bg-orange-500"
                  animate={{ width: isListening ? ['0%', '100%'] : '0%' }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="text-2xl font-black text-green-500 uppercase tracking-widest flex items-center gap-2"
            >
              <Sparkles aria-hidden="true" /> GOT THE T-TAIL!
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
