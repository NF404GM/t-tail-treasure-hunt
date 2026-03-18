import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Mic2 } from 'lucide-react';
import type { MinimalPair, AudioCalibration } from '../../types';
import { useAudioAnalyzer } from '../../hooks/useAudioAnalyzer';
import { useAudioPoller } from '../../hooks/useAudioPoller';
import { Card } from '../Card';

export const TailyChallenge = ({
  pairs,
  onComplete,
  calibration,
}: {
  pairs: MinimalPair[];
  onComplete: (id: string) => void;
  calibration?: AudioCalibration;
}) => {
  const { isListening, error: micError, startListening, stopListening, getAudioControls } = useAudioAnalyzer(calibration);
  const [progress, setProgress] = useState(0);
  const [targetPair, setTargetPair] = useState(pairs[0]);
  const [fedCount, setFedCount] = useState(0);
  const [isEating, setIsEating] = useState(false);

  useEffect(() => {
    return () => stopListening();
  }, [stopListening]);

  useAudioPoller(isListening, getAudioControls, () => {
    setIsEating(true);
    setProgress(p => {
      const next = p + 34;
      if (next >= 100) {
        try { confetti(); } catch { /* ignore */ }
        onComplete(targetPair.id);
        setFedCount(c => c + 1);
        setTargetPair(pairs[Math.floor(Math.random() * pairs.length)]);
        return 0;
      }
      return next;
    });
    setTimeout(() => setIsEating(false), 500);
  });

  return (
    <div className="flex flex-col items-center gap-8 p-8 max-w-2xl mx-auto">
      <div className="text-center">
        <h2 className="text-4xl font-black text-orange-600 uppercase tracking-tighter mb-2">Feed Taily!</h2>
        <p className="text-slate-500 text-lg">Say the word with a sharp &quot;T!&quot; to feed Taily the Fox.</p>
      </div>

      <div className="flex items-center gap-8 w-full justify-center">
        <div className="relative h-48 w-48 rounded-full bg-orange-100 flex items-center justify-center border-8 border-orange-400 shadow-xl overflow-hidden" aria-label="Taily the Fox">
          <motion.span
            animate={isEating ? { scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] } : (isListening ? { y: [0, -5, 0] } : {})}
            transition={isEating ? { duration: 0.3 } : { repeat: Infinity, duration: 2 }}
            className="text-8xl"
            aria-hidden="true"
          >
            {isEating ? '\uD83E\uDD8A\uD83C\uDF4E' : '\uD83E\uDD8A'}
          </motion.span>
          {isListening && !isEating && (
            <motion.div
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute inset-0 bg-orange-400/20"
            />
          )}
        </div>

        <div className="flex flex-col items-center gap-2" aria-hidden="true">
          <span className="text-4xl font-bold text-slate-400">&#x2190;</span>
          <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Feed</span>
        </div>

        <Card pair={targetPair} type="target" className="w-48 h-48 pointer-events-none" />
      </div>

      {micError && (
        <p className="text-red-500 font-bold text-sm">{micError}</p>
      )}

      {!isListening ? (
        <button
          onClick={startListening}
          className="flex items-center gap-2 rounded-full bg-orange-500 px-8 py-4 text-2xl font-bold text-white shadow-lg hover:bg-orange-600 transition-colors"
        >
          <Mic2 className="fill-current" size={28} aria-hidden="true" /> START MICROPHONE
        </button>
      ) : (
        <div className="w-full max-w-md space-y-4">
          <div className="flex justify-between text-sm font-bold text-slate-500 uppercase">
            <span className="flex items-center gap-2"><Mic2 size={16} className="animate-pulse text-orange-500" aria-hidden="true" /> Listening for &quot;T!&quot;</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-8 w-full bg-slate-200 rounded-full overflow-hidden border-4 border-slate-100 shadow-inner relative" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <motion.div
              className="h-full bg-orange-500"
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', bounce: 0.5 }}
            />
          </div>
          <p className="text-center text-orange-600 font-bold text-xl">
            Words Fed: {fedCount}
          </p>
        </div>
      )}
    </div>
  );
};
