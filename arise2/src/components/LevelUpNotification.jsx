import React from 'react';
import { motion } from 'framer-motion';

export default function LevelUpNotification({ level }) {
  if (!level) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="p-4 rounded-lg bg-gradient-to-r from-green-600 to-green-400 text-white font-bold text-center mb-4"
    >
      LEVEL UP! You are now level {level}.
    </motion.div>
  );
}
