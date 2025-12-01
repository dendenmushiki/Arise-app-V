import React, { useEffect, useState, useRef } from "react";
import api from "../api.js";
import { useStore } from "../store.js";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import LevelProgress from "../components/LevelProgress.jsx";
import { xpToLevel } from "../utils/xp.js";
import { Clock, Play, X, Lightbulb, Edit } from 'lucide-react';
import { WorkoutStartModal } from "../components/WorkoutStartModal.jsx";

function formatTime(ms) {
  if (ms <= 0) return "0s";
  const total = Math.floor(ms / 1000);
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) return `${hours}h ${mins}m ${String(secs).padStart(2, "0")}s`;
  if (mins > 0) return `${mins}m ${String(secs).padStart(2, "0")}s`;
  return `${secs}s`;
}

function Toast({ message, type = "success" }) {
  const bgColor = type === "success" ? "bg-green-600" : "bg-red-600";
  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`fixed top-4 right-4 p-4 rounded-lg text-white ${bgColor} shadow-lg z-50`}
    >
      {message}
    </motion.div>
  );
}

export default function Quest() {
  const user = useStore((s) => s.user);
  const token = useStore((s) => s.token);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quest, setQuest] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", baseReps: 0, baseDuration: 0 });
  const [countdownMs, setCountdownMs] = useState(0);
  const timerRef = useRef(null);
  const [completeMsg, setCompleteMsg] = useState("");
  const [toast, setToast] = useState(null);
  const [isOpen, setIsOpen] = useState(true);
  const [isRestDay, setIsRestDay] = useState(false);

  const [showStartModal, setShowStartModal] = useState(false);
  const [questInProgress, setQuestInProgress] = useState(false);

  useEffect(() => {
    if (!token || !user) navigate("/");
  }, [token, user, navigate]);

  useEffect(() => {
    fetchQuest();
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (toast) {
      const timeout = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timeout);
    }
  }, [toast]);

  async function fetchQuest() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/quests/today/${user.id}`);
      if (res.data?.restDay) {
        setQuest(null);
        setIsRestDay(true);
        const nextUnlock = res.data.nextUnlock || getTomorrowMidnight();
        startCountdown(nextUnlock);
      } else {
        const q = res.data.quest || res.data;
        setIsRestDay(false);
        setQuest(q);
        setForm({
          title: q?.title || "",
          description: q?.description || "",
          baseReps: q?.baseReps ?? 0,
          baseDuration: q?.baseDuration ?? 0,
        });
        const nextUnlock = res.data.nextUnlock || q?.nextUnlock || getTomorrowMidnight();
        startCountdown(nextUnlock);
      }
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || "Failed to load quest");
    } finally {
      setLoading(false);
    }
  }

  function getTomorrowMidnight() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0).getTime();
  }

  function startCountdown(nextUnlockTs) {
    clearInterval(timerRef.current);
    const update = () => {
      const ms = nextUnlockTs - Date.now();
      setCountdownMs(ms);
      if (ms <= 0) fetchQuest();
    };
    update();
    timerRef.current = setInterval(update, 1000);
  }

  function scaledValue(value, level) {
    const mult = 1 + Math.max(0, level - 1) * 0.1;
    return Math.round(value * mult);
  }

  async function handleUpdate(e) {
    e.preventDefault();
    setError("");
    try {
      await api.put(`/quests/update/${user.id}`, {
        questId: quest.id,
        title: form.title,
        description: form.description,
        baseReps: Number(form.baseReps),
        baseDuration: Number(form.baseDuration),
      });
      setEditing(false);
      setToast({ message: "Quest updated!", type: "success" });
      await fetchQuest();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || "Failed to update quest");
      setToast({ message: "Error updating quest", type: "error" });
    }
  }

  function playSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {}
  }

  const handleOpenStartModal = () => {
    setShowStartModal(true);
    setQuestInProgress(true);
  };

  const handleModalComplete = async (sessionData) => {
    console.log("Quest timer finished, completing quest:", sessionData);
    setShowStartModal(false);
    setQuestInProgress(false);
    await handleCompleteQuest();
  };

  const handleModalCancel = () => {
    setQuestInProgress(false);
    setShowStartModal(false);
    setToast({ message: "Quest cancelled", type: "error" });
  };

  async function handleCompleteQuest() {
    setError("");
    try {
      playSound();
      const res = await api.post(`/quests/complete/${user.id}`, { questId: quest.id });
      setCompleteMsg(res.data.message || "Quest complete!");
      setToast({ message: "🎉 Quest completed!", type: "success" });
      try {
        const profileRes = await api.get("/profile");
        useStore.getState().setAuth(token, profileRes.data.user);
      } catch (e) {
        console.error("Could not refresh profile", e);
      }
      // Log quest completion to the Recent list
      try {
        await api.post("/workouts", {
          name: quest.title,
          sets: 0,
          reps: quest.baseReps,
          duration: quest.baseDuration,
          type: 'quest',
        });
        window.dispatchEvent(new CustomEvent('activityLogged'));
      } catch (e) {
        console.error('Failed to log quest activity:', e);
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || "Failed to complete quest");
      setToast({ message: "Error completing quest", type: "error" });
    }
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-navy to-dark-bg text-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-neon-cyan border-t-transparent rounded-full"
        />
      </div>
    );

  if (error) return <div className="min-h-screen p-6 bg-gradient-to-br from-dark-navy to-dark-bg text-white"><p className="text-red-400">{error}</p></div>;
  if (!quest && !isRestDay) return <div className="min-h-screen p-6 bg-gradient-to-br from-dark-navy to-dark-bg text-white">No quest found.</div>;

  const xp = quest?.xp ?? user?.xp ?? 0;
  const levelInfo = xpToLevel(xp);
  const level = levelInfo.level;
  const progress = levelInfo.progress;

  const scaledReps = scaledValue(quest?.baseReps ?? 10, level);
  const scaledDuration = scaledValue(quest?.baseDuration ?? 20, level);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-navy to-dark-bg text-white p-6 animate-fade-in">
      <div className="max-w-3xl mx-auto">
        <motion.header
          className="w-full flex flex-col md:flex-row justify-between items-center mb-6 gap-4 max-w-[1200px] mx-auto"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.h1 className="quest-title text-4xl" whileHover={{ scale: 1.05 }}>QUESTS</motion.h1>
          <nav className="flex space-x-6">
            <motion.div whileHover={{ scale: 1.1 }}>
              <Link to="/home" className="text-neon-cyan hover:text-cyan-400 transition-colors duration-300 font-semibold">DASHBOARD</Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }}>
              <Link to="/workouts" className="text-neon-cyan hover:text-cyan-400 transition-colors duration-300 font-semibold">WORKOUTS</Link>
            </motion.div>
          </nav>
        </motion.header>

        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="w-full mb-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
          >
            📋 Open Daily Quest
          </motion.button>
        )}

        <motion.div
          initial={false}
          animate={{ opacity: isOpen ? 1 : 0, height: isOpen ? "auto" : 0 }}
          transition={{ duration: 0.4 }}
          style={{ overflow: "hidden" }}
        >
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="card p-6 mb-6 bg-card-bg border border-neon-cyan rounded-lg shadow-lg animate-fade-in"
            >
              {isRestDay ? (
                <div className="text-center py-8">
                  <motion.h2 className="quest-title text-2xl mb-4">Rest Day</motion.h2>
                  <p className="description-text mb-4">Take time to recover — stretching, hydration, and light movement.</p>
                  <div className="mb-4">
                    <div className="text-sm description-text mb-2">Next quest in</div>
                    <div className="text-xl font-mono xp-text">{formatTime(countdownMs)}</div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 rounded-lg font-semibold bg-gray-800 hover:bg-gray-700 transition"
                  >
                    Close
                  </motion.button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div>
                    <motion.h2 className="quest-title text-2xl mb-2">{quest.title}</motion.h2>
                    {quest.mediaUrl && (
                      <div className="mb-4 w-full max-h-64 overflow-hidden rounded bg-black">
                        {quest.mediaType === "video" ? (
                          <video src={quest.mediaUrl} controls className="w-full h-auto rounded bg-black" preload="metadata" />
                        ) : (
                          <img src={quest.mediaUrl} alt={quest.title + " guide"} className="w-full h-auto rounded object-cover" />
                        )}
                      </div>
                    )}
                    <p className="description-text mb-4">{quest.description}</p>
                    <div className="mb-4 p-4 bg-gray-800 rounded border border-gray-700">
                      <div className="font-semibold mb-2">Instructions</div>
                      <div className="text-sm text-gray-300 mb-2">{quest.instructions || `Perform the exercise for ${scaledDuration} minutes following good form.`}</div>
                      <div className="text-xs text-gray-400">Expected effect: {`Improved ${quest.title.toLowerCase()} + small XP reward.`}</div>
                    </div>

                    <motion.div className="mb-4 flex gap-3 flex-wrap">
                      <motion.div className="card px-3 py-2" whileHover={{ scale: 1.05 }}>💪 Reps: <span className="xp-text">{scaledReps}</span></motion.div>
                      <motion.div className="card px-3 py-2 flex items-center gap-2" whileHover={{ scale: 1.05 }}>
                        <Clock size={18} />
                        Duration: <span className="xp-text">{scaledDuration}m</span>
                      </motion.div>
                      <motion.div className="card px-3 py-2 text-yellow-300 font-semibold animate-pulse flex items-center gap-2">
                        <Clock size={18} className="animate-spin" />
                        {formatTime(countdownMs)}
                      </motion.div>
                    </motion.div>

                    <LevelProgress level={level} progress={progress} />

                    {!completeMsg && (
                      <motion.div className="flex gap-3 flex-wrap mt-3">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleOpenStartModal}
                          disabled={questInProgress || !quest}
                          className="px-4 py-2 rounded font-semibold hover:shadow-glow-cyan transition-all duration-300 animate-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <Play size={18} strokeWidth={2} />
                          START QUEST
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setEditing((s) => !s)}
                          className="px-4 py-2 rounded font-semibold hover:shadow-glow-cyan transition-all duration-300 animate-glow flex items-center gap-2"
                        >
                          {editing ? (
                            <>
                              <X size={18} strokeWidth={2} />
                              CANCEL
                            </>
                          ) : (
                            <>
                              <Edit size={18} strokeWidth={2} />
                              EDIT
                            </>
                          )}
                        </motion.button>
                      </motion.div>
                    )}

                    {completeMsg && (
                      <motion.div
                        className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <motion.div
                          className="relative w-80 p-8 bg-gradient-to-br from-[#0d0e26] to-[#0a0b16] border-2 border-neon-cyan rounded-2xl shadow-2xl"
                          initial={{ opacity: 0, scale: 0.5, y: 50 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
                        >
                          {/* Animated border glow */}
                          <motion.div
                            className="absolute inset-0 rounded-2xl pointer-events-none"
                            animate={{ boxShadow: ["0 0 20px rgba(34,211,238,0.3)", "0 0 40px rgba(34,211,238,0.6)", "0 0 20px rgba(34,211,238,0.3)"] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />

                          {/* Content */}
                          <div className="relative text-center space-y-6">
                            {/* Celebration animation */}
                            <motion.div
                              animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
                              transition={{ duration: 0.8, repeat: Infinity }}
                              className="text-6xl"
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
                              Quest Complete!
                            </motion.h2>

                            {/* Completion text */}
                            <motion.p
                              className="text-lg font-semibold text-neon-cyan"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3, duration: 0.5 }}
                            >
                              {completeMsg}
                            </motion.p>

                            {/* Animated particles effect */}
                            <div className="relative h-12 flex items-center justify-center">
                              {[...Array(5)].map((_, i) => (
                                <motion.div
                                  key={i}
                                  className="absolute w-2 h-2 bg-neon-cyan rounded-full"
                                  animate={{
                                    x: [0, Math.cos((i / 5) * Math.PI * 2) * 60],
                                    y: [0, Math.sin((i / 5) * Math.PI * 2) * 60],
                                    opacity: [1, 0],
                                  }}
                                  transition={{
                                    duration: 1.5,
                                    delay: i * 0.1,
                                    repeat: Infinity,
                                  }}
                                />
                              ))}
                            </div>

                            {/* Confirm Button */}
                            <motion.button
                              onClick={() => navigate("/home")}
                              className="mt-4 px-8 py-3 rounded-xl font-bold text-lg bg-gradient-to-r from-neon-cyan to-blue-400 text-white hover:shadow-glow-cyan transition-all duration-300 animate-glow"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4, duration: 0.5 }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              BACK TO DASHBOARD
                            </motion.button>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </div>

                  {editing && (
                    <motion.form onSubmit={handleUpdate} className="mt-4 bg-card-bg p-4 rounded border border-neon-cyan">
                      <label className="block text-sm text-gray-300 mb-2">Title</label>
                      <input
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        className="w-full p-2 rounded-lg bg-gray-700 mb-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                      <label className="block text-sm text-gray-300 mb-2">Description</label>
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        className="w-full p-2 rounded-lg bg-gray-700 mb-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-sm text-gray-300 mb-1">Reps</label>
                          <input type="number" value={form.baseReps} onChange={(e) => setForm({ ...form, baseReps: e.target.value })} className="w-full p-2 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-300 mb-1">Duration (min)</label>
                          <input type="number" value={form.baseDuration} onChange={(e) => setForm({ ...form, baseDuration: e.target.value })} className="w-full p-2 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} type="submit" className="px-3 py-1 rounded-lg font-semibold hover:shadow-glow-cyan transition-all duration-300 animate-glow">SAVE</motion.button>
                      </div>
                    </motion.form>
                  )}

                  <motion.div className="mt-4 description-text text-sm italic flex items-center gap-2">
                    <Lightbulb size={18} className="flex-shrink-0" />
                    <span className="xp-text">{quest?.quote || "Keep grinding!"}</span>
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>

      <WorkoutStartModal
        isOpen={showStartModal}
        onClose={() => { setShowStartModal(false); setQuestInProgress(false); }}
        onComplete={handleModalComplete}
        onCancel={handleModalCancel}
        workoutId={quest?.id || ""}
        type="quest"
        title={`Start ${quest?.title || "Quest"}`}
      />

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
