import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import api, { setAuthToken } from '../api';
import { Dumbbell, Target, Heart, Zap, Sparkles, Flame } from 'lucide-react';
import WorkoutPreviewModal from '../components/WorkoutPreviewModal.jsx';

const CATEGORIES = [
  { key: 'fullbody', label: 'Full Body', asset: '/assets/fullbody.svg', icon: Dumbbell, duration: '25 min', wkKey: 'Fullbody' },
  { key: 'abs', label: 'Abs', asset: '/assets/abs.svg', icon: Target, duration: '15 min', wkKey: 'Abs' },
  { key: 'chest', label: 'Chest', asset: '/assets/chest.svg', icon: Heart, duration: '20 min', wkKey: 'Chest' },
  { key: 'arms', label: 'Arms', asset: '/assets/arms.svg', icon: Zap, duration: '18 min', wkKey: 'Arms' },
  { key: 'legs', label: 'Legs', asset: '/assets/legs.svg', icon: Sparkles, duration: '30 min', wkKey: 'Legs' },
  { key: 'shoulders_back', label: 'Shoulders & Back', asset: '/assets/shoulders_back.svg', icon: Dumbbell, duration: '22 min', wkKey: 'ShoulderBack' },
  { key: 'butt', label: 'Butt', asset: '/assets/butt.svg', icon: Target, duration: '20 min', wkKey: 'Butt' },
  { key: 'stretching', label: 'Stretching', asset: '/assets/stretching.svg', icon: Heart, duration: '12 min', wkKey: 'Stretching' },
  { key: 'fatburn', label: 'Fat Burn', asset: '/assets/fatburn.svg', icon: Flame, duration: '35 min', wkKey: 'FatBurn' },
];

// Workout dataset (static)
const workoutData = {
  Fullbody: {
    beginner: ["Jumping Jacks (30s)", "Squats (12)", "Knee Push-ups (10)", "Glute bridge (12)", "Plank (20s)"],
    intermediate: ["Burpees (10)", "Push-ups (12)", "Lunges (12/leg)", "Mountain Climbers (30s)", "Plank (40s)"],
    hard: ["Burpee Push-ups (12)", "Jump Squats (15)", "Decline Push-ups (12)", "Bulgarian Split Squat (12/leg)", "Plank Leg Lift (1 min)"],
    effects: ["Improves cardiovascular endurance", "Enhances total-body strength", "Burns high calories", "Boosts metabolism"]
  },
  Abs: {
    beginner: ["Crunches (12)", "Toe reaches (10)", "Heel touches (20)", "Plank (20s)"],
    intermediate: ["Leg raises (12)", "Russian twists (30s)", "Bicycle crunches (20)", "Plank (45s)"],
    hard: ["Hanging leg raises (12)", "V-ups (15)", "Hard Russian Twists (1 min)", "Plank (1 min+)"] ,
    effects: ["Strengthens core", "Improves posture", "Reduces lower back strain"]
  },
  Legs: {
    beginner: ["Squats (15)", "Glute bridges (15)", "Calf raises (20)", "Side leg raises (15/side)"],
    intermediate: ["Reverse lunges (12/leg)", "Wall sit (40s)", "Sumo squats (15)", "Hip thrusts (15)"],
    hard: ["Jump lunges (12/leg)", "Pistol squat progression (6/leg)", "Box jumps (15)", "Single-leg RDL (12/leg)"],
    effects: ["Builds strength", "Improves balance", "Enhances leg endurance"]
  },
  Chest: {
    beginner: ["Knee push-ups (12)", "Wall push-ups (15)", "Chest squeeze hold (30s)"],
    intermediate: ["Push-ups (15)", "Incline push-ups (15)", "Wide push-ups (12)"],
    hard: ["Decline push-ups (15)", "Diamond push-ups (12)", "Clap push-ups (8–10)"],
    effects: ["Strengthens chest/triceps/shoulders", "Improves pushing strength"]
  },
  Back: {
    beginner: ["Superman hold (20s)", "Reverse snow angels (12)", "Bird dogs (12/side)"],
    intermediate: ["Superman reps (15)", "W-raises (15)", "Hip hinge (20)"],
    hard: ["Arch-ups (20)", "Hard supermans (1 min)", "Towel rows (no equipment alt)"],
    effects: ["Strengthens back muscles", "Improves posture", "Reduces back pain"]
  },
  Arms: {
    beginner: ["Arm circles (20s)", "Bicep curls (12)", "Tricep dips (10)"],
    intermediate: ["Bicep curls (15)", "Tricep kickbacks (12/arm)", "Pike push-ups (10)"],
    hard: ["Pseudo planche leans (20s)", "Diamond push-ups (12)", "Archer push-ups (8/side)"],
    effects: ["Builds arm strength", "Improves muscle tone", "Enhances upper body power"]
  },
  ShoulderBack: {
    beginner: ["Shoulder rolls (15s)", "Band pull-aparts (12)", "Wall angels (12)"],
    intermediate: ["Reverse fly (12)", "Pike push-ups (12)", "Scapular push-ups (10)"],
    hard: ["Handstand hold (20s)", "Pseudo planche push-ups (8)", "Decline reverse fly (12)"],
    effects: ["Strengthens shoulders", "Improves posture", "Enhances upper back"]
  },
  Butt: {
    beginner: ["Glute bridges (15)", "Fire hydrants (12/side)", "Donkey kicks (12/leg)"],
    intermediate: ["Bulgarian split squats (12/leg)", "Single-leg glute bridge (12/leg)", "Hip thrusts (15)"],
    hard: ["Jump squats (15)", "Pistol squats (6/leg)", "Single-leg deadlifts (12/leg)"],
    effects: ["Builds glute strength", "Improves hip stability", "Enhances lower body tone"]
  },
  Stretching: {
    beginner: ["Cat-cow stretch (10 reps)", "Child's pose (30s)", "Hamstring stretch (30s/leg)"],
    intermediate: ["Deep lunge stretch (45s/leg)", "Pigeon pose (45s/side)", "Spinal twist (30s/side)"],
    hard: ["Full splits progression (1 min)", "Scorpion stretch (30s/side)", "Deep back bend (45s)"],
    effects: ["Increases flexibility", "Reduces muscle tension", "Improves recovery"]
  },
  FatBurn: {
    beginner: ["Jump rope (30s)", "High knees (30s)", "Marching (45s)"],
    intermediate: ["Burpees (10)", "Jump squats (15)", "Mountain climbers (30s)", "Jumping jacks (30s)"],
    hard: ["Burpee box jumps (10)", "Speed mountain climbers (45s)", "Jump rope double unders (20s)", "Fast burpees (12)"],
    effects: ["Burns maximum calories", "Boosts metabolism", "Improves cardiovascular fitness"]
  }
};

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
                    onClick={() => window.dispatchEvent(new CustomEvent('openWorkoutPreview', { detail: { ...cat, workout: workoutData[cat.wkKey] || null } }))}
                    className="group relative w-full bg-[#12141f] border-2 border-violet-700 hover:border-violet-500 rounded-2xl shadow-lg hover:shadow-2xl overflow-hidden transition-all duration-300 cursor-pointer"
                  >
                    {/* Background gradient effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                    {/* Icon section */}
                    <div className="relative h-40 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center border-b border-violet-700/30 rounded-2xl mt-3">
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
