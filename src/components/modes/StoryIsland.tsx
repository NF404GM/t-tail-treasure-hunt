import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

const STORY_PANELS = [
  { required: 0, title: "Arrival", text: "Taily arrives on the island!", icon: "\u26F5" },
  { required: 5, title: "The Map", text: "Taily finds a mysterious map!", icon: "\uD83D\uDDFA\uFE0F" },
  { required: 10, title: "The Bridge", text: "Taily crosses the wobbly bridge!", icon: "\uD83C\uDF09" },
  { required: 15, title: "The Treasure", text: "Taily finds the T-Tail Treasure!", icon: "\uD83D\uDC8E" },
];

export const StoryIsland = ({ totalGems }: { totalGems: number }) => {
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
