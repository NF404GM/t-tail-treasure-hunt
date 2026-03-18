import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Settings, ChevronLeft } from 'lucide-react';
import type { GameState, MinimalPair, Session } from './types';
import { DEFAULT_CALIBRATION, getActivePairs } from './types';
import { MenuButton } from './components/MenuButton';
import { PracticeModal } from './components/modes/PracticeModal';
import { TreasureMap } from './components/modes/TreasureMap';
import { MatchQuest } from './components/modes/MatchQuest';
import { TailyChallenge } from './components/modes/TailyChallenge';
import { StoryIsland } from './components/modes/StoryIsland';
import { Dashboard } from './components/modes/Dashboard';
import { EchoRushCanvas } from './components/EchoRushCanvas';

const DEFAULT_STATE: GameState = {
  currentMode: 'menu',
  progress: {},
  settings: {
    showLabels: true,
    audioCalibration: { ...DEFAULT_CALIBRATION },
    activeCategories: [],
  },
  sessions: [],
};

function loadState(): GameState {
  try {
    const saved = localStorage.getItem('t-tail-state');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && typeof parsed.progress === 'object') {
        return {
          ...DEFAULT_STATE,
          ...parsed,
          settings: {
            ...DEFAULT_STATE.settings,
            ...parsed.settings,
            audioCalibration: { ...DEFAULT_CALIBRATION, ...parsed.settings?.audioCalibration },
            activeCategories: parsed.settings?.activeCategories ?? [],
          },
          sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
        };
      }
    }
  } catch {
    // Corrupted localStorage
  }
  return DEFAULT_STATE;
}

function saveState(state: GameState) {
  try {
    localStorage.setItem('t-tail-state', JSON.stringify(state));
  } catch {
    // localStorage quota exceeded or unavailable — silently ignore
  }
}

export default function App() {
  const [state, setState] = useState<GameState>(loadState);
  const [selectedPair, setSelectedPair] = useState<MinimalPair | null>(null);

  // Session tracking
  const sessionStart = useRef<number>(0);
  const sessionSuccesses = useRef<number>(0);
  const sessionPairs = useRef<Set<string>>(new Set());

  useEffect(() => {
    saveState(state);
  }, [state]);

  // Track session start/end on mode changes
  useEffect(() => {
    const mode = state.currentMode;
    if (mode !== 'menu' && mode !== 'dashboard') {
      sessionStart.current = Date.now();
      sessionSuccesses.current = 0;
      sessionPairs.current = new Set();
    }

    return () => {
      // Record session when leaving a game mode
      if (sessionStart.current > 0 && sessionSuccesses.current > 0) {
        const session: Session = {
          id: crypto.randomUUID(),
          timestamp: sessionStart.current,
          gameMode: mode,
          pairsWorked: [...sessionPairs.current],
          successes: sessionSuccesses.current,
          durationMs: Date.now() - sessionStart.current,
        };
        setState(prev => ({
          ...prev,
          sessions: [...prev.sessions, session].slice(-100), // Keep last 100 sessions
        }));
      }
      sessionStart.current = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentMode]);

  const handleBack = useCallback(() => {
    if (selectedPair) setSelectedPair(null);
    else setState(prev => ({ ...prev, currentMode: 'menu' }));
  }, [selectedPair]);

  const updateProgress = useCallback((pairId: string) => {
    sessionSuccesses.current += 1;
    sessionPairs.current.add(pairId);
    setState(prev => ({
      ...prev,
      progress: {
        ...prev.progress,
        [pairId]: Math.min((Number(prev.progress[pairId]) || 0) + 1, 5),
      },
    }));
  }, []);

  const totalGems = Object.values(state.progress).reduce((a: number, b: number) => a + (Number(b) || 0), 0);
  const activePairs = getActivePairs(state.settings.activeCategories);

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
              <TreasureMap pairs={activePairs} onSelect={(pair) => setSelectedPair(pair)} />
              {selectedPair && (
                <PracticeModal
                  pair={selectedPair}
                  showLabels={state.settings.showLabels}
                  calibration={state.settings.audioCalibration}
                  onClose={() => setSelectedPair(null)}
                  onSuccess={() => {
                    updateProgress(selectedPair.id);
                    setSelectedPair(null);
                    try { confetti(); } catch { /* ignore */ }
                  }}
                />
              )}
            </motion.div>
          )}

          {state.currentMode === 'match' && (
            <MatchQuest
              pairs={activePairs}
              onComplete={updateProgress}
              calibration={state.settings.audioCalibration}
            />
          )}

          {state.currentMode === 'challenge' && (
            <motion.div key="challenge" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <TailyChallenge
                pairs={activePairs}
                onComplete={updateProgress}
                calibration={state.settings.audioCalibration}
              />
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
              <EchoRushCanvas calibration={state.settings.audioCalibration} />
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
