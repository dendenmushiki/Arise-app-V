import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Zap } from 'lucide-react';
import { WorkoutStartModal } from './WorkoutStartModal.jsx';
import api from '../api.js';

export default function WorkoutPreviewModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [cat, setCat] = useState(null);
  const [showStart, setShowStart] = useState(false);
  const [statNotif, setStatNotif] = useState(null);
  const [difficulty, setDifficulty] = useState('beginner');

  useEffect(() => {
    const handler = (e) => {
      setCat(e.detail);
      setDifficulty('beginner');
      setIsOpen(true);
    };
    window.addEventListener('openWorkoutPreview', handler);
    return () => window.removeEventListener('openWorkoutPreview', handler);
  }, []);

  const close = () => {
    setIsOpen(false);
    setCat(null);
  };

  if (!cat) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-70 z-40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
            />

            {/* Modal container */}
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <div className="w-full max-w-xl bg-dark-bg rounded-2xl shadow-2xl border border-neon-cyan overflow-hidden">
                
                {/* Image */}
                <div className="h-56 bg-black">
                  <img
                    src={cat.asset}
                    alt={cat.label}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Content */}
                <div className="p-6 text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-bold quest-title">{cat.label}</h3>
                      <p className="text-sm text-gray-400 mt-1">No equipment • Quick session</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={close}
                      className="text-gray-400 hover:text-red-500 transition"
                    >
                      <X size={24} strokeWidth={2.5} />
                    </motion.button>
                  </div>

                  <div className="mt-4 text-gray-300">
                    <div className="flex items-center justify-start gap-4">
                      <p className="font-semibold">Difficulty</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDifficulty('beginner')}
                          className={`px-3 py-1 rounded-full text-sm font-medium ${difficulty === 'beginner' ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-300'}`}
                        >
                          Beginner
                        </button>
                        <button
                          onClick={() => setDifficulty('intermediate')}
                          className={`px-3 py-1 rounded-full text-sm font-medium ${difficulty === 'intermediate' ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-300'}`}
                        >
                          Intermediate
                        </button>
                        <button
                          onClick={() => setDifficulty('hard')}
                          className={`px-3 py-1 rounded-full text-sm font-medium ${difficulty === 'hard' ? 'bg-violet-600 text-white' : 'bg-gray-800 text-gray-300'}`}
                        >
                          Hard
                        </button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="font-semibold mb-1">Exercises</p>
                      {cat?.workout && cat.workout[difficulty] ? (
                        <ul className="list-disc list-inside text-sm text-gray-200">
                          {cat.workout[difficulty].map((ex, i) => (
                            <li key={i} className="py-0.5">{ex}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-400">No exercise list available for this category.</p>
                      )}
                    </div>

                    <div className="mt-4">
                      <p className="font-semibold mb-1">Expected effect</p>
                      {cat?.workout && cat.workout.effects ? (
                        <ul className="list-disc list-inside text-sm text-gray-200">
                          {cat.workout.effects.map((ef, i) => (
                            <li key={i} className="py-0.5">{ef}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-400">Improved strength, endurance, and mobility.</p>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="mt-6 flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowStart(true)}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-glow-cyan transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <Play size={20} strokeWidth={2.5} />
                      Start Workout
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={close}
                      className="px-4 py-3 border border-gray-600 rounded-xl text-gray-400 hover:text-red-400 hover:border-red-400 transition-all duration-300"
                    >
                      Close
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Stat Point Notification Toast */}
      <AnimatePresence>
        {statNotif && (
          <motion.div
            className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 z-[60]"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
          >
            <Zap size={20} className="text-yellow-300" />
            <span className="font-semibold">{statNotif}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WorkoutStartModal Integration */}
      <WorkoutStartModal
        isOpen={showStart}
        onClose={() => setShowStart(false)}
        onComplete={async () => {
          setShowStart(false);
          setIsOpen(false);
          // Log challenge completion to the Recent list
          try {
            const res = await api.post("/workouts", {
              name: cat?.label || 'Challenge',
              sets: 0,
              reps: 0,
              duration: 0,
              type: 'challenge',
            });

            // Extract XP from response
            const raw = (res?.data?.workout || res?.data) || res;
            const gainedXpCandidate =
              raw?.xp_gained ||
              raw?.xpGained ||
              raw?.xp ||
              raw?.xpEarned ||
              raw?.xp_gain ||
              raw?.xpGain ||
              0;

            const hasXpFromServer = !!(
              raw?.xp_gained || raw?.xpGained || raw?.xp || raw?.xpEarned || raw?.xp_gain || raw?.xpGain
            );

            let finalXp = Number(gainedXpCandidate) || 0;
            if (!hasXpFromServer) {
              // Fallback: small XP reward for completing a challenge
              finalXp = Math.max(5, Math.round(Math.random() * 15));
            }

            window.dispatchEvent(new CustomEvent('activityLogged'));
            
            // Dispatch challenge completion event with XP
            window.dispatchEvent(new CustomEvent('challengeCompleted', {
              detail: {
                xp: finalXp,
                isFromServer: hasXpFromServer
              }
            }));
            
            // Show stat point earned notification
            setStatNotif('+1 Stat Point Earned!');
            setTimeout(() => setStatNotif(null), 3000);
          } catch (e) {
            console.error('Failed to log challenge activity:', e);
          }
        }}
        onCancel={() => setShowStart(false)}
        workoutId={cat?.key || ''}
        type="workout"
        title={`Start ${cat?.label || 'Workout'}`}
      />
    </>
  );
}
