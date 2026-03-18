import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Settings,
  Mic2,
  Download,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';
import { MINIMAL_PAIRS, MinimalPair, GameState } from './types';
import { cn } from './lib/utils';
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { EchoRushCanvas } from './components/EchoRushCanvas';

// --- Utilities ---

/** Fisher-Yates shuffle (unbiased) */
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const DEFAULT_STATE: GameState = {
  currentMode: 'menu',
  progress: {},
  settings: {
    showLabels: true,
  },
};

function loadState(): GameState {
  try {
    const saved = localStorage.getItem('t-tail-state');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Basic shape validation
      if (parsed && typeof parsed === 'object' && typeof parsed.progress === 'object') {
        return { ...DEFAULT_STATE, ...parsed, settings: { ...DEFAULT_STATE.settings, ...parsed.settings } };
      }
    }
  } catch {
    // Corrupted localStorage — fall through to default
  }
  return DEFAULT_STATE;
}

// --- Components ---

const Card = ({
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

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={disabled}
      aria-label={`${word} card`}
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
            {isTarget && <span className="text-red-500 underline">t</span>}
          </span>
        )}
      </div>
      {isTarget && (
        <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-sm" aria-label="Target word with T ending">
          <span className="text-xs font-bold">T</span>
        </div>
      )}
    </motion.button>
  );
};

// --- Game Modes ---

const PracticeModal = ({
  pair,
  onClose,
  onSuccess,
  showLabels,
}: {
  pair: MinimalPair;
  onClose: () => void;
  onSuccess: () => void;
  showLabels: boolean;
}) => {
  const { isListening, error: micError, startListening, stopListening, getAudioControls } = useAudioAnalyzer();
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    startListening();
    return () => stopListening();
  }, [startListening, stopListening]);

  useEffect(() => {
    if (!isListening || detected) return;
    const interval = setInterval(() => {
      const { jump } = getAudioControls();
      if (jump) {
        setDetected(true);
        setTimeout(() => {
          onSuccess();
        }, 1000);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [isListening, getAudioControls, detected, onSuccess]);

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

const TreasureMap = ({ onSelect }: { onSelect: (pair: MinimalPair) => void }) => {
  return (
    <div className="p-6">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-black text-slate-800 mb-2">Treasure Map</h2>
        <p className="text-slate-600 text-lg">Click an island to practice your words and find the hidden gems!</p>
      </div>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {MINIMAL_PAIRS.map((pair, idx) => (
          <motion.div
            key={pair.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="relative">
              <div className="absolute -left-4 -top-4 h-8 w-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold z-10">
                {idx + 1}
              </div>
              <Card
                pair={pair}
                type="target"
                onClick={() => onSelect(pair)}
                className="w-40"
              />
            </div>
            <span className="font-bold text-slate-600">{pair.targetWord} Island</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

interface MatchCard {
  id: string;
  pairId: string;
  type: 'error' | 'target';
  pair: MinimalPair;
  flipped: boolean;
  matched: boolean;
}

const MatchQuest = ({ onComplete }: { onComplete: (id: string) => void }) => {
  const [cards, setCards] = useState<MatchCard[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matches, setMatches] = useState<string[]>([]);
  const [pendingMatch, setPendingMatch] = useState<{ first: number; second: number; pairId: string; targetWord: string } | null>(null);
  const { isListening, startListening, stopListening, getAudioControls } = useAudioAnalyzer();

  useEffect(() => {
    const shuffledPairs = shuffle(MINIMAL_PAIRS).slice(0, 4);
    const deck = shuffle(
      shuffledPairs.flatMap(p => [
        { id: p.id + '-error', pairId: p.id, type: 'error' as const, pair: p, flipped: false, matched: false },
        { id: p.id + '-target', pairId: p.id, type: 'target' as const, pair: p, flipped: false, matched: false },
      ])
    );
    setCards(deck);
    return () => stopListening();
  }, [stopListening]);

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

  useEffect(() => {
    if (!pendingMatch || !isListening) return;
    const interval = setInterval(() => {
      const { jump } = getAudioControls();
      if (jump) {
        stopListening();
        setCards(prev => prev.map((c, i) => (i === pendingMatch.first || i === pendingMatch.second) ? { ...c, matched: true } : c));
        setFlipped([]);

        const newMatches = [...matches, pendingMatch.pairId];
        setMatches(newMatches);
        onComplete(pendingMatch.pairId);
        setPendingMatch(null);

        if (newMatches.length === 4) {
          confetti();
        }
      }
    }, 50);
    return () => clearInterval(interval);
  }, [pendingMatch, isListening, getAudioControls, matches, onComplete, stopListening]);

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
          <div key={card.id} className="perspective-1000 h-48 w-full">
            <motion.div
              animate={{ rotateY: card.flipped || card.matched ? 180 : 0 }}
              transition={{ duration: 0.6, type: 'spring' }}
              className="relative h-full w-full preserve-3d"
              onClick={() => handleFlip(idx)}
            >
              {/* Back */}
              <div className="absolute inset-0 backface-hidden flex items-center justify-center rounded-2xl border-4 border-slate-200 bg-slate-100 shadow-inner cursor-pointer hover:bg-slate-200 transition-colors" role="button" aria-label="Flip card" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleFlip(idx); }}>
                <span className="text-4xl" aria-hidden="true">&#x2753;</span>
              </div>
              {/* Front */}
              <div className="absolute inset-0 backface-hidden rotate-y-180">
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
      {matches.length === 4 && (
        <div className="mt-8">
          <h3 className="text-2xl font-bold text-green-500">You found all the matches!</h3>
        </div>
      )}
    </div>
  );
};

const TailyChallenge = ({ onComplete }: { onComplete: (id: string) => void }) => {
  const { isListening, error: micError, startListening, stopListening, getAudioControls } = useAudioAnalyzer();
  const [progress, setProgress] = useState(0);
  const [targetPair, setTargetPair] = useState(MINIMAL_PAIRS[0]);
  const [fedCount, setFedCount] = useState(0);
  const [isEating, setIsEating] = useState(false);

  useEffect(() => {
    return () => stopListening();
  }, [stopListening]);

  useEffect(() => {
    if (!isListening) return;
    const interval = setInterval(() => {
      const { jump } = getAudioControls();
      if (jump) {
        setIsEating(true);
        setProgress(p => {
          const next = p + 34;
          if (next >= 100) {
            confetti();
            onComplete(targetPair.id);
            setFedCount(c => c + 1);
            setTargetPair(MINIMAL_PAIRS[Math.floor(Math.random() * MINIMAL_PAIRS.length)]);
            return 0;
          }
          return next;
        });
        setTimeout(() => setIsEating(false), 500);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [isListening, getAudioControls, onComplete, targetPair]);

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

const STORY_PANELS = [
  { required: 0, title: "Arrival", text: "Taily arrives on the island!", icon: "\u26F5" },
  { required: 5, title: "The Map", text: "Taily finds a mysterious map!", icon: "\uD83D\uDDFA\uFE0F" },
  { required: 10, title: "The Bridge", text: "Taily crosses the wobbly bridge!", icon: "\uD83C\uDF09" },
  { required: 15, title: "The Treasure", text: "Taily finds the T-Tail Treasure!", icon: "\uD83D\uDC8E" },
];

const StoryIsland = ({ totalGems }: { totalGems: number }) => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-black text-teal-600 uppercase tracking-tighter mb-2">Story Island</h2>
        <p className="text-slate-600 text-lg">Earn gems in other games to unlock Taily&apos;s adventure!</p>
        <div className="mt-4 inline-flex items-center gap-2 bg-teal-100 text-teal-800 px-6 py-2 rounded-full font-bold text-xl">
          <span aria-hidden="true">&#x1F48E;</span> You have {totalGems} Gems
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {STORY_PANELS.map((panel, idx) => {
          const unlocked = totalGems >= panel.required;
          return (
            <motion.div
              key={panel.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "p-8 rounded-3xl border-4 transition-all flex flex-col items-center justify-center min-h-[250px]",
                unlocked ? "bg-white border-teal-400 shadow-xl" : "bg-slate-100 border-slate-200 opacity-60 grayscale"
              )}
            >
              <div className="text-7xl mb-6" aria-hidden="true">{unlocked ? panel.icon : "\uD83D\uDD12"}</div>
              <h3 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tight">
                {unlocked ? panel.title : `Unlocks at ${panel.required} Gems`}
              </h3>
              {unlocked && <p className="text-center text-slate-600 font-medium text-lg">{panel.text}</p>}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const Dashboard = ({ state, setState }: { state: GameState; setState: React.Dispatch<React.SetStateAction<GameState>> }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const exportPDF = async () => {
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.addImage(imgData, 'PNG', 10, 10, 190, 0);
    pdf.save('T-Tail-Cards.pdf');
  };

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-slate-800">Therapist Dashboard</h2>
        <button
          onClick={exportPDF}
          className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-white hover:bg-slate-700"
        >
          <Download size={18} aria-hidden="true" /> PRINT CARDS
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><span aria-hidden="true">&#x2699;&#xFE0F;</span> Settings</h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-medium text-slate-600">Show Word Labels</span>
              <input
                type="checkbox"
                checked={state.settings.showLabels}
                onChange={(e) => setState(prev => ({ ...prev, settings: { ...prev.settings, showLabels: e.target.checked } }))}
                className="h-6 w-6 rounded border-slate-300 text-slate-800 focus:ring-slate-800"
              />
            </label>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><span aria-hidden="true">&#x1F4C8;</span> Progress</h3>
          <div className="space-y-2">
            {MINIMAL_PAIRS.map(pair => (
              <div key={pair.id} className="flex items-center justify-between">
                <span className="text-slate-600">{pair.targetWord}</span>
                <div className="flex gap-1" aria-label={`${state.progress[pair.id] || 0} out of 5 stars`}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <span key={star} className={cn("text-xl", star <= (state.progress[pair.id] || 0) ? "grayscale-0" : "grayscale opacity-20")} aria-hidden="true">&#x2B50;</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hidden Print Area */}
      <div className="hidden">
        <div ref={printRef} className="p-8 bg-white grid grid-cols-2 gap-8 w-[210mm]">
          {MINIMAL_PAIRS.flatMap(pair => [
            <Card key={`${pair.id}-error`} pair={pair} type="error" className="h-64 border-black" />,
            <Card key={`${pair.id}-target`} pair={pair} type="target" className="h-64 border-black" />,
          ])}
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [state, setState] = useState<GameState>(loadState);
  const [selectedPair, setSelectedPair] = useState<MinimalPair | null>(null);

  useEffect(() => {
    localStorage.setItem('t-tail-state', JSON.stringify(state));
  }, [state]);

  const handleBack = useCallback(() => {
    if (selectedPair) setSelectedPair(null);
    else setState(prev => ({ ...prev, currentMode: 'menu' }));
  }, [selectedPair]);

  const updateProgress = useCallback((pairId: string) => {
    setState(prev => ({
      ...prev,
      progress: {
        ...prev.progress,
        [pairId]: Math.min((Number(prev.progress[pairId]) || 0) + 1, 5),
      },
    }));
  }, []);

  const totalGems = Object.values(state.progress).reduce((a: number, b) => a + (Number(b) || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-orange-200">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between bg-white/80 px-6 py-4 backdrop-blur-md border-b border-slate-100">
        <div className="flex items-center gap-3">
          {state.currentMode !== 'menu' && (
            <button
              onClick={handleBack}
              aria-label="Go back"
              className="rounded-full p-2 hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft size={24} aria-hidden="true" />
            </button>
          )}
          <h1 className="text-2xl font-black tracking-tighter text-slate-800 uppercase">
            T-Tail <span className="text-orange-500">Treasure</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-orange-700 font-bold">
            <span aria-hidden="true">&#x1F48E;</span> {totalGems}
          </div>
          <button
            onClick={() => setState(prev => ({ ...prev, currentMode: 'dashboard' }))}
            aria-label="Open settings"
            className="rounded-full p-2 hover:bg-slate-100"
          >
            <Settings size={24} aria-hidden="true" />
          </button>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl">
        <AnimatePresence mode="wait">
          {state.currentMode === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6"
            >
              <MenuButton title="Treasure Map" desc="Practice your T-tails" icon="\uD83D\uDDFA\uFE0F" color="bg-yellow-400" onClick={() => setState(prev => ({ ...prev, currentMode: 'map' }))} />
              <MenuButton title="Match Quest" desc="Memory matching fun" icon="\uD83E\uDDE9" color="bg-purple-400" onClick={() => setState(prev => ({ ...prev, currentMode: 'match' }))} />
              <MenuButton title="Taily's Challenge" desc="Talk to the fox" icon="\uD83E\uDD8A" color="bg-orange-400" onClick={() => setState(prev => ({ ...prev, currentMode: 'challenge' }))} />
              <MenuButton title="Story Island" desc="Watch Taily's adventure" icon="\uD83C\uDFAC" color="bg-teal-400" onClick={() => setState(prev => ({ ...prev, currentMode: 'story' }))} />
              <MenuButton title="EchoRush" desc="3D Voice Runner" icon="\uD83D\uDE80" color="bg-cyan-400" onClick={() => setState(prev => ({ ...prev, currentMode: 'echorush' }))} />
            </motion.div>
          )}

          {state.currentMode === 'map' && (
            <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <TreasureMap onSelect={(pair) => setSelectedPair(pair)} />
              {selectedPair && (
                <PracticeModal
                  pair={selectedPair}
                  showLabels={state.settings.showLabels}
                  onClose={() => setSelectedPair(null)}
                  onSuccess={() => {
                    updateProgress(selectedPair.id);
                    setSelectedPair(null);
                    confetti();
                  }}
                />
              )}
            </motion.div>
          )}

          {state.currentMode === 'match' && (
            <MatchQuest onComplete={updateProgress} />
          )}

          {state.currentMode === 'challenge' && (
            <motion.div key="challenge" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <TailyChallenge onComplete={updateProgress} />
            </motion.div>
          )}

          {state.currentMode === 'story' && (
            <motion.div key="story" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <StoryIsland totalGems={totalGems} />
            </motion.div>
          )}

          {state.currentMode === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Dashboard state={state} setState={setState} />
            </motion.div>
          )}

          {state.currentMode === 'echorush' && (
            <motion.div key="echorush" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6">
              <EchoRushCanvas />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Mascot */}
      <div className="fixed bottom-4 right-4 z-40">
        <motion.button
          whileHover={{ y: -10 }}
          aria-label="Talk to Taily"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg border-2 border-orange-400 cursor-pointer"
          onClick={() => setState(prev => ({ ...prev, currentMode: 'challenge' }))}
        >
          <span className="text-3xl" aria-hidden="true">&#x1F98A;</span>
        </motion.button>
      </div>
    </div>
  );
}

const MenuButton = ({ title, desc, icon, color, onClick }: { title: string; desc: string; icon: string; color: string; onClick: () => void }) => (
  <motion.button
    whileHover={{ scale: 1.02, y: -4 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={cn(
      "flex flex-col items-center gap-4 rounded-[2rem] p-8 text-center shadow-xl transition-all",
      color
    )}
  >
    <span className="text-7xl drop-shadow-md" aria-hidden="true">{icon}</span>
    <div>
      <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">{title}</h2>
      <p className="text-slate-800/60 font-medium">{desc}</p>
    </div>
  </motion.button>
);
