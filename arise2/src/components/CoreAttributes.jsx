import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Zap, Target, Shield, Brain } from 'lucide-react';

export default function CoreAttributes({ xp, level }) {
  // Calculate attributes based on level (0-100 max at level 100)
  // Each level adds 1 point, capped at 100
  const baseAttributes = Math.min(level, 100);
  
  const attributes = [
    {
      name: 'Strength',
      icon: TrendingUp,
      color: 'from-red-500 to-red-400',
      value: baseAttributes,
    },
    {
      name: 'Agility',
      icon: Zap,
      color: 'from-yellow-500 to-yellow-400',
      value: baseAttributes,
    },
    {
      name: 'Stamina',
      icon: Target,
      color: 'from-green-500 to-green-400',
      value: baseAttributes,
    },
    {
      name: 'Endurance',
      icon: Shield,
      color: 'from-blue-500 to-blue-400',
      value: baseAttributes,
    },
    {
      name: 'Intelligence',
      icon: Brain,
      color: 'from-purple-500 to-purple-400',
      value: baseAttributes,
    },
  ];

  return (
    <motion.section
      className="card p-6 mb-8 bg-[#0d0e26] border border-violet-700 rounded-lg shadow-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.5 }}
    >
      <motion.h3
        className="text-2xl mb-6 text-center font-semibold text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        CORE ATTRIBUTES
      </motion.h3>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {attributes.map((attr, idx) => {
          const Icon = attr.icon;
          return (
            <motion.div
              key={idx}
              className="p-4 bg-[#0a0c18] border border-violet-600/30 rounded-xl"
              whileHover={{ scale: 1.05 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + idx * 0.1 }}
            >
              {/* Icon */}
              <div className="flex items-center justify-center mb-3">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${attr.color} bg-opacity-20`}>
                  <Icon className={`text-white`} size={24} strokeWidth={2.5} />
                </div>
              </div>

              {/* Name */}
              <div className="text-center mb-3">
                <div className="text-sm font-semibold text-white">{attr.name}</div>
              </div>

              {/* Progress Bar */}
              <div className="mb-2">
                <div className="h-6 rounded-xl bg-[#12141f] overflow-hidden border border-violet-700/40 shadow-inner">
                  <motion.div
                    className={`h-full bg-gradient-to-r ${attr.color} shadow-lg flex items-center justify-center`}
                    initial={{ width: '0%' }}
                    animate={{ width: `${attr.value}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  >
                    {attr.value >= 15 && (
                      <span className="text-xs font-bold text-white drop-shadow-lg">
                        {attr.value}
                      </span>
                    )}
                  </motion.div>
                </div>
              </div>

              {/* Value Display */}
              <div className="text-center">
                <div className="text-sm font-bold text-white">
                  {attr.value} <span className="text-gray-400 text-xs">/ 100</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
