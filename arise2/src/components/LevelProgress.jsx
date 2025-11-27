import React from 'react';
import { motion } from 'framer-motion';

export default function LevelProgress({ progress = 0, level = 1 }) {
  const pct = Math.min(1, Math.max(0, progress));

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between mb-2 text-sm text-white">
        <div className="description-text">Level {level}</div>
        <div className="xp-text text-violet-400 animate-pulse">{Math.round(pct * 100)}%</div>
      </div>

      <div className="h-6 rounded-full bg-[#12141f] overflow-hidden border-2 border-violet-700 shadow-inner-glow animate-border-pulse">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-violet-500 via-violet-400 to-violet-500 shadow-glow-hover animate-glow"
        />
      </div>

      <div className="text-xs description-text mt-1 text-center text-white">XP Progress</div>
    </div>
  );
}
