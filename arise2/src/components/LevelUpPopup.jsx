import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function LevelUpPopup({ level, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center 
        bg-black bg-opacity-60 backdrop-blur-sm"
      >
        {/* 🔥 Aura Burst Behind Popup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 0.6, scale: 1.4 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute w-72 h-72 rounded-full 
          bg-gradient-to-r from-indigo-600/40 via-purple-500/40 to-cyan-400/40 
          blur-3xl"
        />

        {/* MAIN POPUP */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ type: "spring", stiffness: 140, damping: 12 }}
          className="relative p-8 max-w-md w-full text-center
          bg-[#0a0a14] border border-indigo-500/40 rounded-2xl
          shadow-[0_0_25px_rgba(138,43,226,0.55)]"
        >
          {/* Sparkling Icon */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="text-6xl mb-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"
          >
            ✦
          </motion.div>

          {/* LEVEL UP TITLE */}
          <motion.h2
            animate={{
              scale: [1, 1.15, 1],
              textShadow: [
                "0 0 6px rgba(93,100,255,0.9)",
                "0 0 12px rgba(93,100,255,1)",
                "0 0 6px rgba(93,100,255,0.9)",
              ],
            }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="text-4xl font-bold 
            bg-gradient-to-r from-indigo-300 via-purple-300 to-cyan-300 
            bg-clip-text text-transparent tracking-widest"
          >
            LEVEL UP!
          </motion.h2>

          {/* LEVEL NUMBER */}
          <div className="text-3xl mt-2 font-extrabold 
          text-indigo-300 drop-shadow-[0_0_6px_rgba(93,100,255,0.9)]">
            Level {level}
          </div>

          {/* SUB MESSAGE */}
          <div className="mt-1 text-sm text-gray-300 opacity-80">
            You have ascended to a new rank.
          </div>

          {/* XP FLASH BAR */}
          <motion.div
            animate={{
              boxShadow: [
                "0 0 10px 2px rgba(0,162,255,0.7)",
                "0 0 20px 4px rgba(0,162,255,0)",
                "0 0 10px 2px rgba(0,162,255,0.7)",
              ],
            }}
            transition={{ duration: 1.6, repeat: Infinity }}
            className="mt-5 w-full h-2 rounded-full 
            bg-gradient-to-r from-blue-400 to-cyan-300"
          />

          {/* Hologram Shine */}
          <motion.div
            initial={{ x: "-150%" }}
            animate={{ x: "150%" }}
            transition={{ duration: 1.8, repeat: Infinity }}
            className="absolute top-0 left-0 w-full h-full 
            bg-gradient-to-r from-transparent via-white/10 to-transparent
            blur-md"
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
