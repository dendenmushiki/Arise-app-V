import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Zap, Target, Shield, Brain, RotateCcw } from 'lucide-react';
import api from '../api';

export default function StatAllocationPanel({ userId, onMilestoneUnlock }) {
  const [unspentPoints, setUnspentPoints] = useState(0);
  const [coreAttributes, setCoreAttributes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState(null);
  const [resetCooldown, setResetCooldown] = useState(null);
  const [showReset, setShowReset] = useState(false);

  const attributes = [
    { name: 'Strength', key: 'strength', icon: TrendingUp, color: 'from-red-500 to-red-400' },
    { name: 'Agility', key: 'agility', icon: Zap, color: 'from-yellow-500 to-yellow-400' },
    { name: 'Stamina', key: 'stamina', icon: Target, color: 'from-green-500 to-green-400' },
    { name: 'Endurance', key: 'endurance', icon: Shield, color: 'from-blue-500 to-blue-400' },
    { name: 'Intelligence', key: 'intelligence', icon: Brain, color: 'from-purple-500 to-purple-400' },
  ];

  useEffect(() => {
    fetchStatData();
  }, [userId]);

  async function fetchStatData() {
    try {
      const profileRes = await api.get('/profile');
      setUnspentPoints(profileRes.data.user?.unspent_stat_points || 0);

      const coreRes = await api.get('/core-attributes');
      setCoreAttributes(coreRes.data.attributes);

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
      console.error('Failed to fetch stat data:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAllocate(attribute) {
    if (unspentPoints <= 0 || allocating) return;

    // Client-side validation: check if this would exceed the hard cap of 100
    const currentValue = Number(coreAttributes?.[attribute] || 0);
    if (currentValue >= 100) {
      alert(`${attribute} is already at maximum (100)`);
      return;
    }

    setAllocating(attribute);
    try {
      const res = await api.post('/api/stats/spend', { attribute, amount: 1 });
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
      const res = await api.post('/api/stats/reset');
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

  if (loading) {
    return (
      <div className="text-center text-gray-400">
        Loading stat system...
      </div>
    );
  }

  return (
    <motion.section
      className="card p-6 mb-8 bg-[#0d0e26] border border-violet-700 rounded-lg shadow-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-6">
        <motion.h3 className="text-2xl font-semibold text-white">
          STAT ALLOCATION
        </motion.h3>
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

      {/* Unspent Points Display */}
      <div className="mb-6 p-4 bg-[#0a0c18] border border-violet-600/30 rounded-xl">
        <div className="text-sm text-gray-400">Available Stat Points</div>
        <div className="text-4xl font-bold text-violet-400">{unspentPoints}</div>
      </div>

      {/* Reset Cooldown Warning */}
      {resetCooldown && (
        <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-xl">
          <div className="text-sm text-yellow-300">Reset available in {resetCooldown} days</div>
        </div>
      )}

      {/* Reset Confirmation */}
      {showReset && (
        <motion.div
          className="mb-6 p-4 bg-red-900/20 border border-red-600/30 rounded-xl"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-sm text-red-300 mb-3">
            Reset all stats to base awakening values? All spent points will be returned to your pool.
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

      {/* Attribute Allocation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {attributes.map((attr, idx) => {
          const Icon = attr.icon;
          const value = Number(coreAttributes?.[attr.key] || 0);
          const isMaxed = unspentPoints === 0;
          const isAtCap = value >= 100;

          return (
            <motion.div
              key={idx}
              className="p-4 bg-[#0a0c18] border border-violet-600/30 rounded-xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + idx * 0.1 }}
            >
              {/* Icon */}
              <div className="flex items-center justify-center mb-3">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${attr.color} bg-opacity-20`}>
                  <Icon className="text-white" size={24} strokeWidth={2.5} />
                </div>
              </div>

              {/* Name */}
              <div className="text-center mb-3">
                <div className="text-sm font-semibold text-white">{attr.name}</div>
              </div>

              {/* Current Value */}
              <div className="text-center mb-3">
                <div className="text-2xl font-bold text-violet-400">{value}/100</div>
              </div>

              {/* Allocate Button */}
              <motion.button
                onClick={() => handleAllocate(attr.key)}
                disabled={isMaxed || allocating === attr.key || isAtCap}
                className={`w-full py-2 rounded-lg font-semibold text-sm transition-all ${
                  isMaxed || isAtCap
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r ' + attr.color + ' text-white hover:shadow-lg'
                }`}
                whileHover={!isMaxed && !isAtCap ? { scale: 1.05 } : {}}
                whileTap={!isMaxed && !isAtCap ? { scale: 0.95 } : {}}
              >
                {allocating === attr.key ? 'Allocating...' : isAtCap ? 'Maxed' : '+ Point'}
              </motion.button>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
