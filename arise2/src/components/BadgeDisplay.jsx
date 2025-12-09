import React from 'react';
import { motion } from 'framer-motion';

// I-import ang badge data mula sa backend (normal na magmumula mula sa API o bundled data)
const BADGE_INFO = {
  first_steps: { icon: '👣', name: 'First Steps', description: 'Complete your first quest', category: 'Quest Milestone', categoryIcon: '⚔️' },
  quest_master: { icon: '⚔️', name: 'Quest Master', description: 'Complete 10 quests', category: 'Quest Milestone', categoryIcon: '⚔️' },
  legend_making: { icon: '⭐', name: 'Legend in Making', description: 'Complete 50 quests', category: 'Quest Milestone', categoryIcon: '⚔️' },
  rising_star: { icon: '✨', name: 'Rising Star', description: 'Reach level 5', category: 'Level Achievement', categoryIcon: '📈' },
  pinnacle: { icon: '👑', name: 'Pinnacle Warrior', description: 'Reach level 20', category: 'Level Achievement', categoryIcon: '📈' },
  rank_d: { icon: '🔰', name: 'Rank D', description: 'Achieved Rank D', category: 'Rank Progression', categoryIcon: '📊' },
  rank_c: { icon: '🥉', name: 'Rank C', description: 'Achieved Rank C', category: 'Rank Progression', categoryIcon: '📊' },
  rank_b: { icon: '🥈', name: 'Rank B', description: 'Achieved Rank B', category: 'Rank Progression', categoryIcon: '📊' },
  rank_a: { icon: '🥇', name: 'Rank A', description: 'Achieved Rank A', category: 'Rank Progression', categoryIcon: '📊' },
  rank_s: { icon: '💎', name: 'Rank S', description: 'Achieved Rank S - Legendary status', category: 'Rank Progression', categoryIcon: '📊' },
  week_warrior: { icon: '🔥', name: 'Week Warrior', description: 'Maintain a 7-day streak', category: 'Streak Reward', categoryIcon: '🎯' },
  month_marathon: { icon: '🌟', name: 'Month Marathon', description: 'Maintain a 30-day streak', category: 'Streak Reward', categoryIcon: '🎯' },
  strong_soul: { icon: '💪', name: 'Strong Soul', description: 'Strength stat reaches 20', category: 'Stat Achievement', categoryIcon: '💥' },
  swift_thinker: { icon: '⚡', name: 'Swift Thinker', description: 'Agility stat reaches 20', category: 'Stat Achievement', categoryIcon: '💥' },
  unstoppable: { icon: '🚀', name: 'Unstoppable', description: 'Stamina stat reaches 20', category: 'Stat Achievement', categoryIcon: '💥' },
  ironclad: { icon: '🛡️', name: 'Ironclad', description: 'Endurance stat reaches 20', category: 'Stat Achievement', categoryIcon: '💥' },
  sage: { icon: '🧠', name: 'Sage', description: 'Intelligence stat reaches 20', category: 'Stat Achievement', categoryIcon: '💥' },
};

export default function BadgeDisplay({ badges = [] }) {
  if (!badges || badges.length === 0) {
    return (
      <div className="text-gray-400 text-sm text-center py-4">
        No badges yet. Start questing to unlock achievements!
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-3 min-w-max">
        {badges.map((badgeId, idx) => {
          const badgeData = BADGE_INFO[badgeId];
          if (!badgeData) return null;

          return (
            <motion.div
              key={badgeId}
              className="flex-shrink-0 group relative"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.1 }}
            >
              {/* Badge Icon */}
              <div
                className="w-16 h-16 bg-gradient-to-br from-violet-600/40 to-violet-800/40 rounded-lg border-2 border-violet-500 flex items-center justify-center text-3xl cursor-pointer hover:border-violet-400 transition-all"
                title={badgeData.name}
                aria-label={badgeData.name}
              >
                {badgeData.icon}
              </div>

              {/* Hover Tooltip (CSS-driven for reliability) */}
              <div
                className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-[#0d0e26] border border-violet-500 rounded-lg p-3 whitespace-nowrap text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg"
              >
                <div className="font-bold">{badgeData.name}</div>
                <div className="text-gray-300 text-xs">{badgeData.description}</div>
                <div className="mt-1 pt-1 border-t border-violet-600/50 flex items-center gap-1">
                  <span>{badgeData.categoryIcon}</span>
                  <span className="text-violet-300 text-xs">{badgeData.category}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
