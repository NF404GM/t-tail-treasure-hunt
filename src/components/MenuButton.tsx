import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export const MenuButton = ({
  title,
  desc,
  icon,
  color,
  onClick,
}: {
  title: string;
  desc: string;
  icon: string;
  color: string;
  onClick: () => void;
}) => (
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
