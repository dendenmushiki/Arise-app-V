import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Zap, Target, Shield, Brain, Info, RotateCcw } from 'lucide-react';
import api from '../api';

export default function CoreAttributes({ xp, level, userId, onMilestoneUnlock }) {
  const [coreAttributes, setCoreAttributes] = useState(null);
  const [rank, setRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unspentPoints, setUnspentPoints] = useState(0);
  const [allocating, setAllocating] = useState(null);
  const [resetCooldown, setResetCooldown] = useState(null);
  const [showReset, setShowReset] = useState(false);
  const [displayMode, setDisplayMode] = useState(() => {
    try {
      const saved = localStorage.getItem('coreAttributesDisplayMode');
      return saved === 'absolute' ? 'absolute' : 'percent';
    } catch (e) {
      return 'percent';
    }
  });

  useEffect(() => {
    // Refetch core attributes whenever xp or level changes so the UI stays in sync
    fetchAttributes();
  }, [xp, level]);

  useEffect(() => {
    // Listen for activity logged event (challenge completion) to refetch stat points
    const handler = () => fetchAttributes();
    window.addEventListener('activityLogged', handler);
    return () => window.removeEventListener('activityLogged', handler);
  }, []);

  async function fetchAttributes() {
    setLoading(true);
    try {
      const res = await api.get('/core-attributes');
      setCoreAttributes(res.data.attributes || null);
      setRank(res.data.attributes && res.data.attributes.rank ? res.data.attributes.rank : null);

      // Also fetch unspent points
      const profileRes = await api.get('/profile');
      setUnspentPoints(profileRes.data.user?.unspent_stat_points || 0);

      // Check reset cooldown
      if (profileRes.data.user?.last_reset_date) {
        const lastReset = new Date(profileRes.data.user.last_reset_date);
        const daysRemaining = Math.max(0, 7 - Math.floor((Date.now() - lastReset) / (1000 * 60 * 60 * 24)));
        if (daysRemaining > 0) {
          setResetCooldown(daysRemaining);
        } else {
          setResetCooldown(null);
        }
      }
    } catch (e) {
      console.log('No core attributes found, using defaults');
      setCoreAttributes(null);
      setRank(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    try {
      localStorage.setItem('coreAttributesDisplayMode', displayMode);
    } catch (e) {}
  }, [displayMode]);

  async function handleAllocate(attribute) {
    if (unspentPoints <= 0 || allocating) return;

    setAllocating(attribute);
    try {
      const res = await api.post('/stats/spend', { attribute, amount: 1 });
      setUnspentPoints(res.data.unspentPoints);

      // Refetch core attributes to show updated value
      const coreRes = await api.get('/core-attributes');
      setCoreAttributes(coreRes.data.attributes);

      // Show milestone unlock notification
      if (res.data.unlockedMilestone && onMilestoneUnlock) {
        onMilestoneUnlock({
          attribute,
          milestone: res.data.unlockedMilestone,
          badgeName: res.data.badgeName,
          borderName: res.data.borderName,
        });
      }
    } catch (e) {
      console.error('Failed to allocate stat:', e);
      alert(e.response?.data?.error || 'Failed to allocate stat point');
    } finally {
      setAllocating(null);
    }
  }

  async function handleReset() {
    if (!confirm('Reset all stats? All spent points will be returned.')) return;

    try {
      const res = await api.post('/stats/reset');
      alert(res.data.message);
      setUnspentPoints(res.data.returnedPoints);
      setResetCooldown(7);

      // Refetch core attributes
      const coreRes = await api.get('/core-attributes');
      setCoreAttributes(coreRes.data.attributes);
    } catch (e) {
      console.error('Failed to reset stats:', e);
      alert(e.response?.data?.error || 'Failed to reset stats');
    }
  }

  // Use awakening stats if available, otherwise derive defaults from level.
  // Scale default visual value by level * 10 so level 1 => 10%, level 5 => 50%, etc.
  const baseAttributes = coreAttributes ? undefined : Math.min((Number(level) || 1) * 10, 100);
  
  const attributes = [
    {
      name: 'Strength',
      icon: TrendingUp,
      color: 'from-red-500 to-red-400',
      key: 'strength',
    },
    {
      name: 'Agility',
      icon: Zap,
      color: 'from-yellow-500 to-yellow-400',
      key: 'agility',
    },
    {
      name: 'Stamina',
      icon: Target,
      color: 'from-green-500 to-green-400',
      key: 'stamina',
    },
    {
      name: 'Endurance',
      icon: Shield,
      color: 'from-blue-500 to-blue-400',
      key: 'endurance',
    },
    {
      name: 'Intelligence',
      icon: Brain,
      color: 'from-purple-500 to-purple-400',
      key: 'intelligence',
    },
  ];

  const getRankStyle = (rankLetter) => {
    const styles = {
      D: { color: '#8b7355', bgColor: '#3d3428', label: 'Novice' },
      C: { color: '#60a5fa', bgColor: '#1e3a8a', label: 'Apprentice' },
      B: { color: '#818cf8', bgColor: '#3730a3', label: 'Warrior' },
      A: { color: '#fbbf24', bgColor: '#78350f', label: 'Legend' },
      S: { color: '#ef4444', bgColor: '#7f1d1d', label: 'Mythic' },
    };
    return styles[rankLetter] || styles.C;
  };

  // Linear XP formula: requiredXP = 100 * level
  const xpToNext = 100 * (level || 1) - (xp || 0);

  return (
    <motion.section
      className="card p-6 mb-8 bg-[#0d0e26] border border-violet-700 rounded-lg shadow-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-6">
        <motion.h3
          className="text-2xl font-semibold text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          CORE ATTRIBUTES
        </motion.h3>

        <div className="flex items-center gap-4">
          {rank && (
            <motion.div
              className="px-4 py-2 rounded-lg border-2 font-bold text-lg"
              style={{ borderColor: getRankStyle(rank).color, color: getRankStyle(rank).color }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              Rank: {rank}
            </motion.div>
          )}

          <div className="flex items-center gap-2 bg-[#0b0c14] p-1 rounded">
                <div className="flex items-center text-xs text-gray-300 mr-2">
                  <Info size={14} className="text-gray-400 mr-1" />
                  <div className="text-gray-400">Bar shows {displayMode === 'percent' ? 'percent of hard cap (100)' : 'absolute stat'}</div>
                </div>
                <button
                  onClick={() => fetchAttributes()}
                  className="ml-2 px-2 py-1 rounded bg-[#0f1724] text-xs text-gray-300 hover:bg-violet-700"
                >
                  Refresh
                </button>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setDisplayMode('percent')}
                className={`px-2 py-1 rounded text-xs ${displayMode === 'percent' ? 'bg-violet-600 text-white' : 'text-gray-400'}`}
              >
                %
              </button>
              <button
                onClick={() => setDisplayMode('absolute')}
                className={`px-2 py-1 rounded text-xs ${displayMode === 'absolute' ? 'bg-violet-600 text-white' : 'text-gray-400'}`}
              >
                #
              </button>
            </div>
          </div>

          <motion.button
            onClick={() => setShowReset(!showReset)}
            className="px-4 py-2 rounded-lg bg-[#0a0c18] border border-violet-600/30 text-white text-sm hover:border-violet-500 transition-colors flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RotateCcw size={16} />
            Reset
          </motion.button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-[#0a0c18] border border-violet-600/30 rounded-xl">
          <div className="text-sm text-gray-400">Level</div>
          <div className="text-2xl font-bold">{level}</div>
        </div>

        <div className="p-4 bg-[#0a0c18] border border-violet-600/30 rounded-xl">
          <div className="text-sm text-gray-400">XP</div>
          <div className="text-2xl font-bold">{xp}</div>
          <div className="text-xs text-gray-400">{xpToNext > 0 ? `${xpToNext} XP to next level` : 'Ready to level up'}</div>
        </div>

        <div className="p-4 bg-[#0a0c18] border border-violet-600/30 rounded-xl">
          <div className="text-sm text-gray-400">Available Stat Points</div>
          <div className="text-3xl font-bold text-violet-400">{unspentPoints}</div>
        </div>
      </div>

      {/* Hard Cap Info Row */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-[#0a0c18] border border-violet-600/30 rounded-xl">
          <div className="text-sm text-gray-400">Hard Cap</div>
          <div className="text-sm text-gray-200 mt-2">
            <div className="text-xs">All attributes capped at 100</div>
          </div>
        </div>

        {/* Reset Cooldown Warning */}
        {resetCooldown && (
          <div className="p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-xl">
            <div className="text-sm text-yellow-300">⏳ Reset available in {resetCooldown} days</div>
          </div>
        )}

        {/* Reset Confirmation */}
        {showReset && (
          <motion.div
            className="p-4 bg-red-900/20 border border-red-600/30 rounded-xl"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-sm text-red-300 mb-3">
              Reset all stats to 0? All spent points will be returned.
            </div>
            <button
              onClick={handleReset}
              disabled={resetCooldown && resetCooldown > 0}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm transition-colors"
            >
              Confirm Reset
            </button>
          </motion.div>
        )}
      </div>

      {/* Attribute Allocation Grid */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-300 mb-4">Allocate Points</h4>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {attributes.map((attr, idx) => {
          const Icon = attr.icon;
          const key = attr.key;
          // determine actual value and cap
          let actualRaw = 0;
          let capRaw = 100;
          let displayPercent = 0;
          if (coreAttributes) {
            actualRaw = Number(coreAttributes[key] || 0);
            capRaw = 100; // Hard cap is 100
            displayPercent = (actualRaw / capRaw) * 100;
          } else {
            // fallback when no awakening/core attributes exist: use baseAttributes as percent
            displayPercent = Number(baseAttributes || 0);
            capRaw = 100;
            actualRaw = Math.round((displayPercent / 100) * capRaw);
          }
          displayPercent = Math.max(0, Math.min(100, displayPercent));
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
                            animate={{ width: `${displayMode === 'percent' ? displayPercent : Math.max(0, Math.min(100, (actualRaw / (capRaw || 1)) * 100))}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                          >
                            { (displayMode === 'percent' ? displayPercent : (capRaw > 0 ? (actualRaw / capRaw) * 100 : 0)) >= 2 && (
                              <span className="text-xs font-bold text-white drop-shadow-lg">
                                {displayMode === 'percent' ? `${Math.round(displayPercent)}%` : `${actualRaw}`}
                              </span>
                            )}
                          </motion.div>
                </div>
              </div>

              {/* Value Display */}
              <div className="text-center mb-3">
                <div className="text-sm font-bold text-white">
                  {actualRaw} <span className="text-gray-400 text-xs">/ {capRaw}</span>
                </div>
              </div>

              {/* Allocate Button */}
              <motion.button
                onClick={() => handleAllocate(attr.key)}
                disabled={unspentPoints <= 0 || allocating === attr.key}
                className={`w-full py-2 rounded-lg font-semibold text-sm transition-all ${
                  unspentPoints <= 0
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r ' + attr.color + ' text-white hover:shadow-lg'
                }`}
                whileHover={unspentPoints > 0 ? { scale: 1.05 } : {}}
                whileTap={unspentPoints > 0 ? { scale: 0.95 } : {}}
              >
                {allocating === attr.key ? 'Allocating...' : '+ Point'}
              </motion.button>
            </motion.div>
          );
        })}
      </div>
      </div>
    </motion.section>
  );
}
