import { motion } from 'motion/react';
import type { MinimalPair } from '../../types';
import { Card } from '../Card';

export const TreasureMap = ({
  pairs,
  onSelect,
}: {
  pairs: MinimalPair[];
  onSelect: (pair: MinimalPair) => void;
}) => {
  return (
    <div className="p-6">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-black text-slate-800 mb-2">Treasure Map</h2>
        <p className="text-slate-600 text-lg">Click an island to practice your words and find the hidden gems!</p>
      </div>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {pairs.map((pair, idx) => (
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
