import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../api.js";
import { useStore } from "../store.js";
import { Link } from "react-router-dom";
import { WorkoutStartModal } from "../components/WorkoutStartModal.jsx";
import { AlertCircle, Play } from "lucide-react";

export default function Workout() {
  const user = useStore((s) => s.user);
  const token = useStore((s) => s.token);
  const setAuth = useStore((s) => s.setAuth);

  const [name, setName] = useState("");
  const [sets, setSets] = useState(0);
  const [reps, setReps] = useState(0);
  const [duration, setDuration] = useState(0);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const [showStartModal, setShowStartModal] = useState(false);
  const [workoutInProgress, setWorkoutInProgress] = useState(false);
  const [currentWorkoutName, setCurrentWorkoutName] = useState("");

  function Toast({ message, type = "success" }) {
    const bgColor = type === "success" ? "bg-gradient-to-r from-violet-500 to-violet-400" : "bg-red-600";
    return (
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`fixed top-4 right-4 p-4 rounded-lg text-white shadow-glow-lg z-50 ${bgColor} font-semibold`}
      >
        {message}
      </motion.div>
    );
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/workouts");
        const workouts = (res.data.workouts || []).map((w) => ({
          ...w,
          loggedOnly: w.loggedOnly === 1 || w.loggedOnly === true,
          type: w.type || 'workout',
        }));
        setWorkouts(workouts);
      } catch (e) {
        console.error("Failed to fetch workouts:", e);
        setError("Failed to load workouts");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const handleActivityLogged = async () => {
      try {
        const res = await api.get("/workouts");
        const workouts = (res.data.workouts || []).map((w) => ({
          ...w,
          loggedOnly: w.loggedOnly === 1 || w.loggedOnly === true,
          type: w.type || 'workout',
        }));
        setWorkouts(workouts);
      } catch (e) {
        console.error('Failed to refresh workouts after activity logged', e);
      }
    };
    window.addEventListener('activityLogged', handleActivityLogged);
    return () => window.removeEventListener('activityLogged', handleActivityLogged);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setToast(null);

    if (!name.trim()) {
      setError("Please enter a workout name");
      return;
    }

    setCurrentWorkoutName(name);
    await logWorkoutToBackend(true);
  }

  async function handleModalComplete(sessionData) {
    setShowStartModal(false);
    await logWorkoutToBackend(false);
  }

  function handleModalCancel(sessionData) {
    setWorkoutInProgress(false);
    setShowStartModal(false);
    setToast({ message: "Workout cancelled - not logged", type: "error" });
  }

  async function logWorkoutToBackend(loggedOnly = false) {
    try {
      const res = await api.post("/workouts", {
        name,
        sets: Number(sets),
        reps: Number(reps),
        duration: Number(duration),
        loggedOnly: loggedOnly ? 1 : 0,
      });

      const raw = (res?.data?.workout || res?.data) || res;
      const nowIso = new Date().toISOString();
      // prefer server-provided loggedOnly when present, otherwise fall back to caller
      const serverLogged = raw && (raw.loggedOnly === 1 || raw.loggedOnly === true || raw.loggedOnly === "1");
      const newWorkout = {
        id: raw?.id || `local-${Date.now()}`,
        name: raw?.name ?? name,
        sets: raw?.sets ?? Number(sets),
        reps: raw?.reps ?? Number(reps),
        duration: raw?.duration ?? Number(duration),
        createdAt: raw?.createdAt ?? raw?.created_at ?? nowIso,
        ...raw,
        loggedOnly: !!serverLogged,
        type: raw?.type || 'workout',
      };

      setWorkouts((w) => [newWorkout, ...w]);
      setToast({ message: loggedOnly ? "🏷️ Workout logged (manual)" : "🎉 Workout logged successfully!", type: "success" });
      setName("");
      setSets(0);
      setReps(0);
      setDuration(0);
      setWorkoutInProgress(false);

      try {
        const profileRes = await api.get("/profile");
        setAuth(token, profileRes.data.user);
      } catch (e) {
        console.error("Could not refresh profile:", e);
      }

      setTimeout(() => setToast(null), 3000);
    } catch (e) {
      console.error(e);
      const errMsg = e?.response?.data?.error || "Failed to log workout";
      setError(errMsg);
      setToast({ message: errMsg, type: "error" });
      setWorkoutInProgress(false);
    }
  }

  const handleStartWorkout = () => {
    if (!name.trim()) {
      setError("Please enter a workout name first");
      return;
    }
    setCurrentWorkoutName(name);
    setWorkoutInProgress(true);
    setShowStartModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0b0d1c] to-[#0a0b16] text-white flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0d1c] to-[#0a0b16] text-white p-6 animate-fade-in">
      <motion.header
        className="w-full flex flex-col md:flex-row justify-between items-center mb-6 gap-4 max-w-[1200px] mx-auto"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1 className="quest-title text-4xl" whileHover={{ scale: 1.05 }}>
          WORKOUTS
        </motion.h1>
        <nav className="flex space-x-6">
          <motion.div whileHover={{ scale: 1.1 }}>
            <Link to="/home" className="text-violet-400 hover:text-violet-300 transition-colors duration-300 font-semibold">
              DASHBOARD
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.1 }}>
            <Link to="/chat" className="text-violet-400 hover:text-violet-300 transition-colors duration-300 font-semibold">
              CHAT
            </Link>
          </motion.div>
        </nav>
      </motion.header>
    <div className="md:ml-[12vw] md:mr-[12vw]">
      <motion.section
        className="card p-6 mb-8 bg-[#12141f] border border-violet-700 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <motion.h2
          className="quest-title text-2xl mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          LOG A WORKOUT
        </motion.h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            placeholder="Workout name (e.g., Morning Run, Chest Day)"
            className="w-full p-3 rounded-xl bg-[#12141f] border border-violet-700 focus:border-violet-500 focus:shadow-glow transition-all duration-300 text-white"
            required
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            disabled={workoutInProgress}
          />
          <motion.div
            className="grid grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <input
              type="number"
              value={sets}
              onChange={(e) => setSets(e.target.value)}
              placeholder="Sets"
              className="p-3 rounded-lg bg-[#12141f] border border-violet-700 focus:border-violet-500 focus:shadow-glow text-white transition-all duration-300"
              disabled={workoutInProgress}
            />
            <input
              type="number"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder="Reps"
              className="p-3 rounded-lg bg-[#12141f] border border-violet-700 focus:border-violet-500 focus:shadow-glow text-white transition-all duration-300"
              disabled={workoutInProgress}
            />
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Duration (min)"
              className="p-3 rounded-lg bg-[#12141f] border border-violet-700 focus:border-violet-500 focus:shadow-glow text-white transition-all duration-300"
              disabled={workoutInProgress}
            />
          </motion.div>
          {error && (
            <motion.p className="text-red-400 text-sm flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <AlertCircle size={18} />
              {error}
            </motion.p>
          )}
          <motion.div className="flex gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
            <motion.button
              type="button"
              onClick={handleStartWorkout}
              disabled={workoutInProgress || !name.trim()}
              className="flex-1 px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-violet-500 to-violet-400 hover:shadow-glow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Play size={20} strokeWidth={2.5} />
              START WORKOUT
            </motion.button>
            <motion.button
              type="submit"
              disabled={workoutInProgress}
              className="flex-1 px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-neon-cyan to-cyan-400 hover:shadow-glow-cyan transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              LOG WORKOUT
            </motion.button>
          </motion.div>
        </form>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
        <motion.h3 className="quest-title text-2xl mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          RECENT WORKOUTS
        </motion.h3>
        <div className="space-y-4">
          {workouts.length === 0 && (
            <motion.p className="description-text text-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
              No workouts logged yet. Start one above!
            </motion.p>
          )}
          {workouts.map((w, index) => (
            <motion.div
              key={w.id}
              className="card p-4 flex justify-between items-start bg-[#12141f] border border-violet-700 shadow-lg animate-slide-up"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div>
                <strong className="text-lg">{w.name}</strong>
                <div className="description-text text-sm mt-1">
                  Sets: <span className="xp-text">{w.sets}</span> | Reps: <span className="xp-text">{w.reps}</span> | Duration: <span className="xp-text">{w.duration}m</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-xs description-text">
                  {(() => {
                    try {
                      if (!w?.createdAt) return "—";
                      const d = new Date(w.createdAt);
                      if (isNaN(d.getTime())) return String(w.createdAt);
                      return d.toLocaleDateString();
                    } catch (err) {
                      return String(w.createdAt || "—");
                    }
                  })()}
                </div>
                <div className="flex gap-2">
                  <span className="inline-block px-2 py-1 text-xs rounded font-semibold text-white" style={{ background: w.type === 'quest' ? '#7c3aed' : w.type === 'challenge' ? '#0891b2' : '#6366f1' }}>
                    {(w.type || 'workout').toUpperCase()}
                  </span>
                  {!!w.loggedOnly && (
                    <span className="inline-block px-2 py-1 text-xs rounded bg-yellow-700 text-yellow-100 font-semibold">LOGGED</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </div>
      <WorkoutStartModal
        isOpen={showStartModal}
        onClose={() => {
          setShowStartModal(false);
          setWorkoutInProgress(false);
        }}
        onComplete={handleModalComplete}
        onCancel={handleModalCancel}
        workoutId={`${user?.id}-${Date.now()}`}
        type="workout"
        title={`Start ${currentWorkoutName || "Workout"}`}
      />

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
