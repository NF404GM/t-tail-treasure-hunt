import { motion } from 'motion/react';
import type { MinimalPair } from '../types';
import { cn } from '../lib/utils';

export const Card = ({
  pair,
  type,
  onClick,
  disabled = false,
  showLabel = true,
  className,
}: {
  pair: MinimalPair;
  type: 'error' | 'target';
  onClick?: () => void;
  disabled?: boolean;
  showLabel?: boolean;
  className?: string;
}) => {
  const isTarget = type === 'target';
  const word = isTarget ? pair.targetWord : pair.errorWord;

  // Determine the highlighted letter based on category
  const highlightLetter = pair.category === 'final-d' ? 'd' : 't';

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={disabled}
      aria-label={`${word} card${isTarget ? ' - target word' : ''}`}
      className={cn(
        "relative aspect-square w-full rounded-2xl border-4 bg-white p-4 shadow-lg transition-all",
        className
      )}
      style={{ borderColor: pair.color }}
    >
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <span className="text-6xl" aria-hidden="true">{pair.emoji}</span>
        {showLabel && (
          <span className="text-2xl font-bold uppercase tracking-widest text-slate-800">
            {word}
            {isTarget && <span className="text-red-500 underline">{highlightLetter}</span>}
          </span>
        )}
      </div>
      {isTarget && (
        <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-sm" aria-label={`Target word with ${highlightLetter.toUpperCase()} ending`}>
          <span className="text-xs font-bold">{highlightLetter.toUpperCase()}</span>
        </div>
      )}
    </motion.button>
  );
};
