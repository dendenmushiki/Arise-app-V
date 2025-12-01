import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getRankStyle } from '../utils/awakening';
import StatCard from './StatCard';

const ATTRIBUTE_ICONS = {
  strength: '💪',
  agility: '⚡',
  stamina: '🔥',
  endurance: '❤️',
  intelligence: '🧠',
};

const ATTRIBUTE_LABELS = {
  strength: 'Strength',
  agility: 'Agility',
  stamina: 'Stamina',
  endurance: 'Endurance',
  intelligence: 'Intelligence',
};

export default function AwakeningResults({ attributes, rank, softcaps = {}, onContinue, isLoading }) {
  const [revealedAttributes, setRevealedAttributes] = useState([]);
  const [rankRevealed, setRankRevealed] = useState(false);
  const rankStyle = getRankStyle(rank);

  useEffect(() => {
    // Reveal attributes one by one
    const attributeKeys = Object.keys(attributes);
    attributeKeys.forEach((key, idx) => {
      setTimeout(() => {
        setRevealedAttributes((prev) => [...prev, key]);
      }, 300 + idx * 200);
    });

    // Reveal rank after all attributes
    setTimeout(() => {
      setRankRevealed(true);
    }, 300 + attributeKeys.length * 200 + 300);
  }, [attributes]);

  return (
    <div className="w-full max-w-3xl">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h2 className="text-4xl font-bold text-violet-400 mb-2">
          🌟 AWAKENING COMPLETE 🌟
        </h2>
        <p className="text-gray-400 text-lg">
          Your true potential has been revealed
        </p>
      </motion.div>

      {/* Core Attributes Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
        {Object.entries(attributes).map(([key, value]) => {
          const isRevealed = revealedAttributes.includes(key);
          const icon = ATTRIBUTE_ICONS[key];
          const label = ATTRIBUTE_LABELS[key];
          const cap = softcaps ? softcaps[`${key}Cap`] : undefined;

          return (
            <StatCard
              key={key}
              icon={icon}
              name={label}
              value={value}
              cap={cap}
            />
          );
        })}
      </div>

      {/* Rank Display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.3, rotateZ: -180 }}
        animate={
          rankRevealed
            ? { opacity: 1, scale: 1, rotateZ: 0 }
            : { opacity: 0, scale: 0.3, rotateZ: -180 }
        }
        transition={{ duration: 0.7, type: 'spring', stiffness: 50 }}
        className="text-center mb-12"
      >
        <p className="text-gray-400 text-lg mb-4">YOUR RANK</p>
        <motion.div
          className="w-32 h-32 mx-auto rounded-lg border-4 flex items-center justify-center shadow-2xl"
          style={{
            borderColor: rankStyle.color,
            backgroundColor: rankStyle.bgColor,
          }}
          animate={rankRevealed ? { 
            boxShadow: [
              `0 0 0px ${rankStyle.color}`,
              `0 0 30px ${rankStyle.color}`,
              `0 0 0px ${rankStyle.color}`,
            ] 
          } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="text-center">
            <motion.div
              className="text-8xl font-black mb-2"
              style={{ color: rankStyle.color }}
              animate={rankRevealed ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.8 }}
            >
              {rankStyle.label}
            </motion.div>
            <p className="text-sm font-bold" style={{ color: rankStyle.color }}>
              {rankStyle.name}
            </p>
          </div>
        </motion.div>
        <motion.p
          className="mt-4 text-gray-300 text-sm max-w-md mx-auto"
          initial={{ opacity: 0 }}
          animate={rankRevealed ? { opacity: 1 } : {}}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          Rise through the ranks. Earn A and S through dedication and quests.
        </motion.p>
      </motion.div>

      {/* Continue Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={rankRevealed ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        <motion.button
          onClick={onContinue}
          disabled={isLoading}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 text-white font-bold text-lg hover:from-violet-500 hover:to-violet-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isLoading ? 'Saving Your Awakening...' : 'Enter the World'}
        </motion.button>
      </motion.div>
    </div>
  );
}
