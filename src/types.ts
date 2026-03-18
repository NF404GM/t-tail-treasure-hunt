// --- Speech Target Categories ---

export type SpeechTarget = 'final-t' | 'initial-t' | 'final-d';

export const SPEECH_TARGET_LABELS: Record<SpeechTarget, string> = {
  'final-t': 'Final /t/',
  'initial-t': 'Initial /t/',
  'final-d': 'Final /d/',
};

export type MinimalPair = {
  id: string;
  errorWord: string;
  targetWord: string;
  color: string;
  emoji: string;
  errorImagePrompt: string;
  targetImagePrompt: string;
  category: SpeechTarget;
};

export const MINIMAL_PAIRS: MinimalPair[] = [
  // ========== Final /t/ ==========
  {
    id: 'bee-beet',
    errorWord: 'Bee',
    targetWord: 'Beet',
    color: '#FACC15',
    emoji: '\uD83D\uDC1D',
    category: 'final-t',
    errorImagePrompt: 'Black monoline line-art of a simple bumblebee, no shading, white background, square format.',
    targetImagePrompt: 'Black monoline line-art of a simple beet root with leaves, no shading, white background, square format, with a small letter t next to it.',
  },
  {
    id: 'boo-boot',
    errorWord: 'Boo',
    targetWord: 'Boot',
    color: '#A855F7',
    emoji: '\uD83D\uDC7B',
    category: 'final-t',
    errorImagePrompt: 'Black monoline line-art of a simple friendly ghost saying boo, no shading, white background, square format.',
    targetImagePrompt: 'Black monoline line-art of a simple winter boot, no shading, white background, square format, with a small letter t next to it.',
  },
  {
    id: 'bow-boat',
    errorWord: 'Bow',
    targetWord: 'Boat',
    color: '#14B8A6',
    emoji: '\uD83C\uDF80',
    category: 'final-t',
    errorImagePrompt: 'Black monoline line-art of a simple ribbon bow, no shading, white background, square format.',
    targetImagePrompt: 'Black monoline line-art of a simple sailboat, no shading, white background, square format, with a small letter t next to it.',
  },
  {
    id: 'bye-bite',
    errorWord: 'Bye',
    targetWord: 'Bite',
    color: '#EF4444',
    emoji: '\uD83D\uDC4B',
    category: 'final-t',
    errorImagePrompt: 'Black monoline line-art of a simple hand waving goodbye, no shading, white background, square format.',
    targetImagePrompt: 'Black monoline line-art of a simple apple with a bite taken out, no shading, white background, square format, with a small letter t next to it.',
  },
  {
    id: 'pea-peat',
    errorWord: 'Pea',
    targetWord: 'Peat',
    color: '#22C55E',
    emoji: '\uD83C\uDF31',
    category: 'final-t',
    errorImagePrompt: 'Black monoline line-art of a simple pea pod with peas, no shading, white background, square format.',
    targetImagePrompt: 'Black monoline line-art of a simple pile of peat soil, no shading, white background, square format, with a small letter t next to it.',
  },
  {
    id: 'ray-rate',
    errorWord: 'Ray',
    targetWord: 'Rate',
    color: '#F97316',
    emoji: '\u2600\uFE0F',
    category: 'final-t',
    errorImagePrompt: 'Black monoline line-art of a simple sun with rays, no shading, white background, square format.',
    targetImagePrompt: 'Black monoline line-art of a simple star rating with 5 stars, no shading, white background, square format, with a small letter t next to it.',
  },
  {
    id: 'rye-right',
    errorWord: 'Rye',
    targetWord: 'Right',
    color: '#D97706',
    emoji: '\uD83C\uDF3E',
    category: 'final-t',
    errorImagePrompt: 'Black monoline line-art of stalks of rye grain, no shading, white background, square format.',
    targetImagePrompt: 'Black monoline line-art of a right-pointing arrow with a checkmark, no shading, white background, square format, with a small letter t next to it.',
  },
  {
    id: 'caw-caught',
    errorWord: 'Caw',
    targetWord: 'Caught',
    color: '#3B82F6',
    emoji: '\uD83D\uDC26',
    category: 'final-t',
    errorImagePrompt: 'Black monoline line-art of a simple crow cawing, no shading, white background, square format.',
    targetImagePrompt: 'Black monoline line-art of a simple baseball glove catching a ball, no shading, white background, square format, with a small letter t next to it.',
  },

  // ========== Initial /t/ ==========
  {
    id: 'all-tall',
    errorWord: 'All',
    targetWord: 'Tall',
    color: '#6366F1',
    emoji: '\uD83D\uDCCF',
    category: 'initial-t',
    errorImagePrompt: 'Black monoline line-art of the word ALL in big letters, no shading, white background, square format.',
    targetImagePrompt: 'Black monoline line-art of a very tall giraffe, no shading, white background, square format, with a small letter t next to it.',
  },
  {
    id: 'eye-tie',
    errorWord: 'Eye',
    targetWord: 'Tie',
    color: '#EC4899',
    emoji: '\uD83D\uDC54',
    category: 'initial-t',
    errorImagePrompt: 'Black monoline line-art of a simple eye, no shading, white background, square format.',
    targetImagePrompt: 'Black monoline line-art of a simple necktie, no shading, white background, square format, with a small letter t next to it.',
  },
  {
    id: 'in-tin',
    errorWord: 'In',
    targetWord: 'Tin',
    color: '#94A3B8',
    emoji: '\uD83E\uDD6B',
    category: 'initial-t',
    errorImagePrompt: 'Black monoline line-art of an arrow pointing inward through a door, no shading, white background, square format.',
    targetImagePrompt: 'Black monoline line-art of a simple tin can, no shading, white background, square format, with a small letter t next to it.',
  },
  {
    id: 'ape-tape',
    errorWord: 'Ape',
    targetWord: 'Tape',
    color: '#A21CAF',
    emoji: '\uD83D\uDCFC',
    category: 'initial-t',
    errorImagePrompt: 'Black monoline line-art of a simple friendly ape, no shading, white background, square format.',
    targetImagePrompt: 'Black monoline line-art of a roll of tape, no shading, white background, square format, with a small letter t next to it.',
  },

  // ========== Final /d/ ==========
  {
    id: 'bee-bead',
    errorWord: 'Bee',
    targetWord: 'Bead',
    color: '#06B6D4',
    emoji: '\uD83D\uDCFF',
    category: 'final-d',
    errorImagePrompt: 'Black monoline line-art of a simple bumblebee, no shading, white background, square format.',
    targetImagePrompt: 'Black monoline line-art of a simple string of beads, no shading, white background, square format, with a small letter d next to it.',
  },
  {
    id: 'bow-bowed',
    errorWord: 'Bow',
    targetWord: 'Bowed',
    color: '#8B5CF6',
    emoji: '\uD83C\uDFBB',
    category: 'final-d',
    errorImagePrompt: 'Black monoline line-art of a simple ribbon bow, no shading, white background, square format.',
    targetImagePrompt: 'Black monoline line-art of a person bowing politely, no shading, white background, square format, with a small letter d next to it.',
  },
  {
    id: 'ray-raid',
    errorWord: 'Ray',
    targetWord: 'Raid',
    color: '#DC2626',
    emoji: '\u2694\uFE0F',
    category: 'final-d',
    errorImagePrompt: 'Black monoline line-art of a simple sun with rays, no shading, white background, square format.',
    targetImagePrompt: 'Black monoline line-art of a simple shield and sword, no shading, white background, square format, with a small letter d next to it.',
  },
  {
    id: 'rye-ride',
    errorWord: 'Rye',
    targetWord: 'Ride',
    color: '#059669',
    emoji: '\uD83C\uDFC7',
    category: 'final-d',
    errorImagePrompt: 'Black monoline line-art of stalks of rye grain, no shading, white background, square format.',
    targetImagePrompt: 'Black monoline line-art of a child riding a horse, no shading, white background, square format, with a small letter d next to it.',
  },
];

// --- Audio Calibration ---

export interface AudioCalibration {
  /** Jump detection sensitivity (1=hard to trigger, 10=easy to trigger) */
  jumpSensitivity: number;
  /** Shield activation threshold (1=needs loud hum, 10=soft hum works) */
  shieldSensitivity: number;
  /** Boost activation threshold (1=needs very loud, 10=moderate loud works) */
  boostSensitivity: number;
}

export const DEFAULT_CALIBRATION: AudioCalibration = {
  jumpSensitivity: 5,
  shieldSensitivity: 5,
  boostSensitivity: 5,
};

// --- Session History ---

export interface Session {
  id: string;
  timestamp: number;
  gameMode: string;
  pairsWorked: string[];
  successes: number;
  durationMs: number;
}

// --- Game State ---

export type GameMode = 'menu' | 'map' | 'match' | 'challenge' | 'story' | 'dashboard' | 'echorush';

export type GameState = {
  currentMode: GameMode;
  progress: {
    [key: string]: number; // pairId: score (0-5)
  };
  settings: {
    showLabels: boolean;
    audioCalibration: AudioCalibration;
    activeCategories: SpeechTarget[];
  };
  sessions: Session[];
};

// --- Match Card ---

export interface MatchCard {
  id: string;
  pairId: string;
  type: 'error' | 'target';
  pair: MinimalPair;
  flipped: boolean;
  matched: boolean;
}

// --- EchoRush Types ---

export type ObstacleType = 'hurdle' | 'wall';

export interface Obstacle {
  type: ObstacleType;
  x: number;
  z: number;
  active: boolean;
}

export interface EchoRushParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
}

export interface EchoRushState {
  status: 'idle' | 'playing' | 'gameover';
  score: number;
  speed: number;
  multiplier: number;
  isShielded: boolean;
  isBoosting: boolean;
  obstacles: Obstacle[];
  particles: EchoRushParticle[];
}

export interface HudState {
  shield: boolean;
  boost: boolean;
  multiplier: number;
}

// --- Utilities ---

export function getActivePairs(categories: SpeechTarget[]): MinimalPair[] {
  if (categories.length === 0) return MINIMAL_PAIRS;
  return MINIMAL_PAIRS.filter(p => categories.includes(p.category));
}
