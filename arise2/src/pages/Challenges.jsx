import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import api, { setAuthToken } from '../api';
import { Dumbbell, Target, Heart, Zap, Sparkles, Flame } from 'lucide-react';
import WorkoutPreviewModal from '../components/WorkoutPreviewModal.jsx';

const CATEGORIES = [
  { key: 'fullbody', label: 'Full Body', asset: '/assets/fullbody.svg', icon: Dumbbell, duration: '25 min' },
  { key: 'abs', label: 'Abs', asset: '/assets/abs.svg', icon: Target, duration: '15 min' },
  { key: 'chest', label: 'Chest', asset: '/assets/chest.svg', icon: Heart, duration: '20 min' },
  { key: 'arms', label: 'Arms', asset: '/assets/arms.svg', icon: Zap, duration: '18 min' },
  { key: 'legs', label: 'Legs', asset: '/assets/legs.svg', icon: Sparkles, duration: '30 min' },
  { key: 'shoulders_back', label: 'Shoulders & Back', asset: '/assets/shoulders_back.svg', icon: Dumbbell, duration: '22 min' },
  { key: 'butt', label: 'Butt', asset: '/assets/butt.svg', icon: Target, duration: '20 min' },
  { key: 'stretching', label: 'Stretching', asset: '/assets/stretching.svg', icon: Heart, duration: '12 min' },
  { key: 'fatburn', label: 'Fat Burn', asset: '/assets/fatburn.svg', icon: Flame, duration: '35 min' },
];

export default function Challenges() {
  const setAuth = useStore((s) => s.setAuth);
  const token = useStore((s) => s.token);
  const navigate = useNavigate();

  const [showCompleteMsg, setShowCompleteMsg] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [xpFromServer, setXpFromServer] = useState(false);

  function logout() {
    setAuth(null, null);
    try {
      setAuthToken(null);
    } catch (err) {}
    navigate('/');
  }

  // Listen for challenge completion events from WorkoutPreviewModal
  React.useEffect(() => {
    const handleChallengeComplete = (e) => {
      const { xp, isFromServer } = e.detail || {};
      setXpGained(xp || 0);
      setXpFromServer(isFromServer || false);
      setShowCompleteMsg(true);
      setTimeout(() => setShowCompleteMsg(false), 5000);
    };
    window.addEventListener('challengeCompleted', handleChallengeComplete);
    return () => window.removeEventListener('challengeCompleted', handleChallengeComplete);
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0d1c] to-[#0a0b16] text-white p-6 animate-fade-in">
      {/* Header */}
      <motion.header
        className="w-full flex flex-col md:flex-row justify-between items-center mb-6 gap-4 max-w-[1200px] mx-auto"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1
          className="text-4xl font-bold text-white"
          whileHover={{ scale: 1.05 }}
        >
          CHALLENGES
        </motion.h1>

        <div className="flex items-center gap-4">
          <nav className="flex space-x-6">
            <motion.div whileHover={{ scale: 1.1 }}>
              <Link
                to="/workouts"
                className="text-violet-400 hover:text-violet-300 transition-colors duration-300 font-semibold"
              >
                WORKOUTS
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }}>
              <Link
                to="/chat"
                className="text-violet-400 hover:text-violet-300 transition-colors duration-300 font-semibold"
              >
                CHAT
              </Link>
            </motion.div>
          </nav>
        </div>
      </motion.header>

      <main className="max-w-4xl mx-auto">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ staggerChildren: 0.1 }}
        >
          <motion.h2
            className="text-2xl font-bold mb-6 text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Choose Your Challenge
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CATEGORIES.map((cat) => {
              const IconComponent = cat.icon;
              return (
                <motion.div
                  key={cat.key}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <button
                    type="button"
                    aria-label={`Choose ${cat.label} workout`}
                    onClick={() => window.dispatchEvent(new CustomEvent('openWorkoutPreview', { detail: cat }))}
                    className="group relative w-full bg-[#12141f] border-2 border-violet-700 hover:border-violet-500 rounded-2xl shadow-lg hover:shadow-2xl overflow-hidden transition-all duration-300 cursor-pointer"
                  >
                    {/* Background gradient effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                    {/* Icon section */}
                    <div className="relative h-40 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center border-b border-violet-700/30">
                      <motion.div
                        className="text-violet-400"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <IconComponent className="w-16 h-16" strokeWidth={1.5} />
                      </motion.div>
                    </div>

                    {/* Content */}
                    <div className="relative p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-left">
                          <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors">
                            {cat.label}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {cat.duration} • Beginner
                          </p>
                        </div>
                        <motion.div
                          className="text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          initial={{ x: -10 }}
                          whileHover={{ x: 0 }}
                        >
                          <Zap className="w-5 h-5" strokeWidth={2} />
                        </motion.div>
                      </div>
                      <p className="text-xs text-gray-500 mt-3">
                        Quick • No equipment
                      </p>
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        <footer className="mt-8 text-center text-xs text-gray-500">
          Built for quick at-home sessions — tap a card to preview or start.
        </footer>
      </main>

      <WorkoutPreviewModal />

      {/* Completion Message */}
      {showCompleteMsg && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="bg-gradient-to-br from-[#0b0d1c] to-[#0a0b16] border-2 border-violet-700 rounded-lg p-8 max-w-md w-full text-center"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ duration: 0.4, type: 'spring' }}
          >
            {/* Celebration emoji */}
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="text-6xl mb-4"
            >
              🎉
            </motion.div>

            {/* Main message */}
            <motion.h2
              className="quest-title text-3xl bg-gradient-to-r from-neon-cyan via-blue-400 to-violet-400 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              Challenge Complete!
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              className="text-violet-300 mt-4 text-lg font-semibold"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              Challenge finished successfully!
            </motion.p>

            {/* XP Gained */}
            {xpGained > 0 && (
              <motion.div
                className="mt-6 p-4 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-lg border border-yellow-500/30"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                <div className="text-sm text-yellow-300 mb-1">{xpFromServer ? 'Experience Gained' : 'Estimated Experience'}</div>
                <div className="text-3xl font-bold text-yellow-400">+{xpGained} XP</div>
              </motion.div>
            )}

            {/* Close button */}
            <div className="mt-6 flex justify-center">
              <motion.button
                onClick={() => setShowCompleteMsg(false)}
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-semibold"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Close
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
