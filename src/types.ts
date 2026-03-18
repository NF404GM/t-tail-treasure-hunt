export type MinimalPair = {
  id: string;
  errorWord: string;
  targetWord: string;
  color: string;
  emoji: string;
  errorImagePrompt: string;
  targetImagePrompt: string;
};

export const MINIMAL_PAIRS: MinimalPair[] = [
  {
    id: 'bee-beet',
    errorWord: 'Bee',
    targetWord: 'Beet',
    color: '#FACC15', // Yellow
    emoji: '🐝',
    errorImagePrompt: 'Black monoline line-art of a simple bumblebee, no shading, white background, square format.',
    targetImagePrompt: 'Black monoline line-art of a simple beet root with leaves, no shading, white background, square format, with a small letter t next to it.',
  },
  {
    id: 'boo-boot',
    errorWord: 'Boo',
    targetWord: 'Boot',
    color: '#A855F7', // Purple
    emoji: '👻',
    errorImagePrompt: 'Black monoline line-art of a simple friendly ghost saying boo, no shading, white background, square format.',
    targetImagePrompt: 'Black monoline line-art of a simple winter boot, no shading, white background, square format, with a small letter t next to it.',
  },
  {
    id: 'bow-boat',
    errorWord: 'Bow',
    targetWord: 'Boat',
    color: '#14B8A6', // Teal
    emoji: '🎀',
    errorImagePrompt: 'Black monoline line-art of a simple ribbon bow, no shading, white background, square format.',
    targetImagePrompt: 'Black monoline line-art of a simple sailboat, no shading, white background, square format, with a small letter t next to it.',
  },
  {
    id: 'bye-bite',
    errorWord: 'Bye',
    targetWord: 'Bite',
    color: '#EF4444', // Red
    emoji: '👋',
    errorImagePrompt: 'Black monoline line-art of a simple hand waving goodbye, no shading, white background, square format.',
    targetImagePrompt: 'Black monoline line-art of a simple apple with a bite taken out, no shading, white background, square format, with a small letter t next to it.',
  },
];

export type GameState = {
  currentMode: 'menu' | 'map' | 'match' | 'challenge' | 'story' | 'dashboard' | 'echorush';
  progress: {
    [key: string]: number; // pairId: score
  };
  settings: {
    showLabels: boolean;
  };
};
