import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, Minus, X, Play, Clock, AlertCircle } from "lucide-react";

const STORAGE_KEY = "activeWorkoutSession";
const MIN_DURATION_MS = 30 * 60 * 1000; // 30 minutes minimum

export const WorkoutStartModal = ({
  isOpen,
  onClose,
  onComplete,
  onCancel,
  workoutId,
  type,
  title = type === "quest" ? "Start Daily Quest" : "Start Workout",
  // initialDuration: minutes (number or numeric string). Only used to prefill when opening.
  initialDuration = null,
}) => {
  const [timeInput, setTimeInput] = useState("30"); 
  const [isStarted, setIsStarted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [remainingMs, setRemainingMs] = useState(0);
  const [error, setError] = useState("");
  const [intensity, setIntensity] = useState("normal"); // Phase 2: Track workout intensity (normal/high/very-high)
  const timerRef = useRef(null);
  const sessionRef = useRef(null);

  useEffect(() => {
    checkForUnfinishedSession();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Update timeInput when modal opens and initialDuration changes, but only for workout type and if not started
  useEffect(() => {
    if (isOpen && type === "workout" && !isStarted && initialDuration != null) {
      const mins = Number(initialDuration);
      if (!isNaN(mins) && mins > 0) {
        setTimeInput(String(mins));
      }
    }
  }, [isOpen, initialDuration, type, isStarted]);

  const formatTimeDisplay = (ms) => {
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hours > 0) return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const parseTimeInput = (input) => {
    const trimmed = input.trim();
    if (trimmed.includes(":")) {
      const parts = trimmed.split(":").map((p) => parseInt(p, 10));
      if (parts.length === 2) return (parts[0] * 60 + parts[1]) * 1000;
      if (parts.length === 3) return (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000;
    }
    const minutes = parseInt(trimmed, 10);
    if (isNaN(minutes) || minutes <= 0) return null;
    return minutes * 60 * 1000;
  };

  const checkForUnfinishedSession = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const session = JSON.parse(stored);
        if (session.isActive) invalidateSession(session);
      }
    } catch (e) {
      console.error("Error checking localStorage:", e);
    }
  };

  const invalidateSession = (session) => {
    session.isActive = false;
    session.endTime = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    if (onCancel) onCancel(session);
  };

  const saveSessionToStorage = (session) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    sessionRef.current = session;
  };

  const clearSessionFromStorage = () => {
    localStorage.removeItem(STORAGE_KEY);
    sessionRef.current = null;
  };

  const handleStart = () => {
    setError("");
    const durationMs = parseTimeInput(timeInput);
    if (!durationMs || durationMs <= 0) return setError("Invalid time format. Use minutes or hh:mm:ss. Minimum is 30 minutes.");
    if (durationMs < MIN_DURATION_MS) return setError("Minimum duration is 30 minutes.");
    if (durationMs > 12 * 3600 * 1000) return setError("Maximum duration is 12 hours.");

    const session = {
      id: `${type}-${workoutId}-${Date.now()}`,
      type,
      startTime: Date.now(),
      estimatedDuration: durationMs,
      isActive: true,
    };

    saveSessionToStorage(session);
    setRemainingMs(durationMs);
    setIsStarted(true);
    startCountdown(session, durationMs);
  };

  const startCountdown = (session, durationMs) => {
    let timeLeft = durationMs;
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      timeLeft -= 1000;
      setRemainingMs(Math.max(0, timeLeft));
      saveSessionToStorage({ ...session, estimatedDuration: Math.max(0, timeLeft) });
      if (timeLeft <= 0) {
        clearInterval(timerRef.current);
        handleTimerComplete(session);
      }
    }, 1000);
  };

  const handleTimerComplete = (session) => {
    session.isActive = false;
    session.endTime = Date.now();
    session.intensity = intensity; // Phase 2: Include intensity in session data
    saveSessionToStorage(session);
    onComplete(session);
    setTimeout(() => resetModal(), 500);
  };

  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const session = sessionRef.current;
    if (session) {
      session.isActive = false;
      session.endTime = Date.now();
      invalidateSession(session);
    }
    resetModal();
  };

  const handleClose = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    resetModal();
    onClose();
  };

  const resetModal = () => {
    setIsStarted(false);
    setIsMinimized(false);
    setTimeInput("30");
    setRemainingMs(0);
    setError("");
    setIntensity("normal");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {!isMinimized && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={!isStarted ? handleClose : undefined}
              className="fixed inset-0 bg-black bg-opacity-70 z-40 backdrop-blur-sm"
            />
          )}

          {isMinimized && isStarted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-4 right-4 z-50"
            >
              <div className="card p-4 rounded-lg shadow-xl border border-neon-cyan bg-gradient-to-br from-card-bg to-card-bg/80 min-w-fit">
                <div className="flex items-center gap-4">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="flex-shrink-0"
                  >
                    <div className="w-3 h-3 rounded-full bg-neon-cyan shadow-lg shadow-neon-cyan" />
                  </motion.div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg xp-text">
                      {formatTimeDisplay(remainingMs)}
                    </span>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {type === "quest" ? "Quest" : "Workout"}
                    </span>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsMinimized(false)}
                    className="flex-shrink-0 px-3 py-1 rounded-lg bg-neon-cyan/20 border border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-card-bg transition-all duration-300 text-xs font-bold flex items-center gap-1"
                  >
                    <ChevronUp size={16} />
                    RESTORE
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {!isMinimized && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="card w-full max-w-md p-8 rounded-lg shadow-2xl border border-neon-cyan">
                <div className="flex justify-between items-center mb-6">
                  <motion.h2 className="quest-title text-2xl">{title}</motion.h2>
                  <div className="flex gap-2">
                    {isStarted && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsMinimized(true)}
                      title="Minimize to continue using the app"
                      className="text-2xl text-soft-gray hover:text-neon-cyan transition cursor-pointer"
                    >
                      <Minus size={24} strokeWidth={2} />
                    </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={!isStarted ? handleClose : undefined}
                      disabled={isStarted && !isMinimized}
                      className={`${isStarted && !isMinimized ? "text-gray-600 cursor-not-allowed" : "text-soft-gray hover:text-red-500 transition cursor-pointer"}`}
                    >
                      <X size={24} strokeWidth={2.5} />
                    </motion.button>
                  </div>
                </div>

                {!isStarted ? (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <p className="description-text mb-4">
                      How long do you estimate this {type} will take?
                    </p>
                    <div className="mb-6">
                      <label className="block text-sm text-gray-300 mb-2">Time (minutes or hh:mm:ss) — minimum 30 minutes</label>
                      <motion.input
                        type="text"
                        value={timeInput}
                        onChange={(e) => {
                        setTimeInput(e.target.value);
                        setError("");
                        }}
                        onKeyPress={(e) => e.key === "Enter" && handleStart()}
                        placeholder="30 or 1:30 or 1:30:45"
                        className="w-full p-3 rounded-xl bg-[#12141f] border border-neon-cyan focus:border-glow-cyan outline-none transition-all duration-300 text-white text-center text-lg font-semibold placeholder:text-gray-400"
                        whileFocus={{ scale: 1.02 }}
                        disabled={isStarted}
                      />

                      <p className="text-xs text-gray-400 mt-1">Examples: 30, 1:30, 1:30:45</p>
                    </div>
                      {error && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-red-400 text-sm mb-4 flex items-center gap-2"
                        >
                          <AlertCircle size={18} />
                          {error}
                        </motion.p>
                      )}                    <div className="flex gap-3">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleStart}
                          className="flex-1 px-4 py-3 rounded-xl font-bold bg-gradient-to-r from-green-600 to-green-500 hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                        >
                          <Play size={20} strokeWidth={2.5} />
                          START
                        </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleClose}
                        className="flex-1 px-4 py-3 rounded-xl font-bold border border-soft-gray text-soft-gray hover:text-red-400 hover:border-red-400 transition-all duration-300"
                      >
                        CLOSE
                      </motion.button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <p className="description-text text-center mb-6">{type === "quest" ? "Quest" : "Workout"} in progress...</p>

                    {/* Neon Pulse Timer */}
                    <motion.div className="mb-8 relative flex justify-center items-center">
                      <motion.div
                        className="absolute rounded-full border border-neon-cyan w-40 h-40"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <div className="relative z-10 p-6 bg-gradient-to-br from-neon-cyan/20 to-purple-600/20 rounded-full border border-neon-cyan flex flex-col items-center justify-center w-40 h-40">
                        <div className="text-xs text-gray-300 mb-2">REMAINING TIME</div>
                        <div className="text-5xl font-bold xp-text font-mono">{formatTimeDisplay(remainingMs)}</div>
                      </div>
                    </motion.div>

                    <p className="description-text text-center text-sm mb-6 flex items-center justify-center gap-2">
                      <Clock size={18} />
                      Keep the app open until the timer completes
                    </p>

                    {/* Phase 2: Intensity Selector */}
                    <div className="mb-6 p-4 rounded-xl bg-gray-800/50 border border-gray-700">
                      <p className="text-xs text-gray-400 mb-3 font-semibold">INTENSITY LEVEL</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setIntensity('normal')}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                            intensity === 'normal'
                              ? 'bg-blue-600 text-white shadow-lg'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          NORMAL
                        </button>
                        <button
                          onClick={() => setIntensity('high')}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                            intensity === 'high'
                              ? 'bg-orange-600 text-white shadow-lg'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          HIGH
                        </button>
                        <button
                          onClick={() => setIntensity('very-high')}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                            intensity === 'very-high'
                              ? 'bg-red-600 text-white shadow-lg'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          VERY HIGH
                        </button>
                      </div>
                      <div className="mt-2 text-xs text-gray-400">
                        Bonus: <span className="text-green-400 font-bold">
                          {intensity === 'normal' ? '+0' : intensity === 'high' ? '+5' : '+10'}
                        </span> XP
                      </div>
                    </div>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCancel}
                        className="w-full px-4 py-3 rounded-xl font-bold border border-red-500 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        <X size={20} />
                        CANCEL {type === "quest" ? "QUEST" : "WORKOUT"}
                      </motion.button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};

export default WorkoutStartModal;
