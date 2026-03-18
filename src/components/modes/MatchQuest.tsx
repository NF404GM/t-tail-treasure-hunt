import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Mic2 } from 'lucide-react';
import type { MinimalPair, MatchCard, AudioCalibration } from '../../types';
import { useAudioAnalyzer } from '../../hooks/useAudioAnalyzer';
import { useAudioPoller } from '../../hooks/useAudioPoller';
import { Card } from '../Card';

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const MATCH_TIMEOUT_MS = 15000; // 15 second timeout for pending matches

export const MatchQuest = ({
  pairs,
  onComplete,
  calibration,
}: {
  pairs: MinimalPair[];
  onComplete: (id: string) => void;
  calibration?: AudioCalibration;
}) => {
  const [cards, setCards] = useState<MatchCard[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matches, setMatches] = useState<string[]>([]);
  const [pendingMatch, setPendingMatch] = useState<{ first: number; second: number; pairId: string; targetWord: string } | null>(null);
  const { isListening, startListening, stopListening, getAudioControls } = useAudioAnalyzer(calibration);

  // Determine deck size: use up to 4 pairs from available set
  const deckSize = Math.min(pairs.length, 4);

  useEffect(() => {
    const shuffledPairs = shuffle(pairs).slice(0, deckSize);
    const deck = shuffle(
      shuffledPairs.flatMap(p => [
        { id: p.id + '-error', pairId: p.id, type: 'error' as const, pair: p, flipped: false, matched: false },
        { id: p.id + '-target', pairId: p.id, type: 'target' as const, pair: p, flipped: false, matched: false },
      ])
    );
    setCards(deck);
    return () => stopListening();
  }, [pairs, deckSize, stopListening]);

  // Timeout for pending matches - auto-dismiss after 15s
  useEffect(() => {
    if (!pendingMatch) return;
    const timeout = setTimeout(() => {
      stopListening();
      setCards(prev => prev.map((c, i) =>
        (i === pendingMatch.first || i === pendingMatch.second) ? { ...c, flipped: false } : c
      ));
      setFlipped([]);
      setPendingMatch(null);
    }, MATCH_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [pendingMatch, stopListening]);

  const handleFlip = (idx: number) => {
    if (flipped.length === 2 || cards[idx].flipped || cards[idx].matched || pendingMatch) return;

    setCards(prev => prev.map((c, i) => i === idx ? { ...c, flipped: true } : c));

    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      if (cards[first].pairId === cards[second].pairId) {
        setPendingMatch({
          first,
          second,
          pairId: cards[first].pairId,
          targetWord: cards[first].pair.targetWord,
        });
        startListening();
      } else {
        setTimeout(() => {
          setCards(prev => prev.map((c, i) => (i === first || i === second) ? { ...c, flipped: false } : c));
          setFlipped([]);
        }, 1000);
      }
    }
  };

  const handleJump = useCallback(() => {
    if (!pendingMatch) return;
    stopListening();
    setCards(prev => prev.map((c, i) => (i === pendingMatch.first || i === pendingMatch.second) ? { ...c, matched: true } : c));
    setFlipped([]);

    const newMatches = [...matches, pendingMatch.pairId];
    setMatches(newMatches);
    onComplete(pendingMatch.pairId);
    setPendingMatch(null);

    if (newMatches.length === deckSize) {
      try { confetti(); } catch { /* confetti may fail in some contexts */ }
    }
  }, [pendingMatch, matches, deckSize, onComplete, stopListening]);

  useAudioPoller(isListening, getAudioControls, handleJump, !!pendingMatch);

  return (
    <div className="p-6 text-center relative">
      <h2 className="text-3xl font-black text-slate-800 mb-2">Match Quest</h2>
      <p className="text-slate-600 text-lg mb-8">Flip the cards to find the matching words!</p>

      <AnimatePresence>
        {pendingMatch && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-1/2 -translate-x-1/2 z-10 bg-orange-500 text-white px-8 py-4 rounded-full font-bold flex items-center gap-3 shadow-xl border-4 border-orange-300"
          >
            <Mic2 className="animate-pulse" aria-hidden="true" />
            <span>Say <span className="text-yellow-300 text-xl uppercase tracking-widest">&quot;{pendingMatch.targetWord}&quot;</span> to claim the match!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-12">
        {cards.map((card, idx) => (
          <div key={card.id} className="h-48 w-full" style={{ perspective: '1000px' }}>
            <motion.div
              animate={{ rotateY: card.flipped || card.matched ? 180 : 0 }}
              transition={{ duration: 0.6, type: 'spring' }}
              className="relative h-full w-full"
              style={{ transformStyle: 'preserve-3d' }}
              onClick={() => handleFlip(idx)}
            >
              {/* Back */}
              <div
                className="absolute inset-0 flex items-center justify-center rounded-2xl border-4 border-slate-200 bg-slate-100 shadow-inner cursor-pointer hover:bg-slate-200 transition-colors"
                style={{ backfaceVisibility: 'hidden' }}
                role="button"
                aria-label="Flip card"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleFlip(idx); }}
              >
                <span className="text-4xl" aria-hidden="true">&#x2753;</span>
              </div>
              {/* Front */}
              <div
                className="absolute inset-0"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <Card
                  pair={card.pair}
                  type={card.type}
                  className="h-full w-full"
                  disabled
                />
              </div>
            </motion.div>
          </div>
        ))}
      </div>
      {matches.length === deckSize && (
        <div className="mt-8">
          <h3 className="text-2xl font-bold text-green-500">You found all the matches!</h3>
        </div>
      )}
    </div>
  );
};
