import React from 'react';
import { motion } from 'framer-motion';

export default function StatCard({ icon: Icon, name, value }) {
  return (
    <motion.div
      className="bg-[#0d0e26] border-2 border-violet-600 rounded-lg p-6 text-center"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-4xl mb-2">{Icon}</div>
      <p className="text-gray-400 text-xs font-semibold mb-2 uppercase tracking-wide">{name}</p>
      <p className="text-3xl font-bold text-violet-400">{value}</p>
    </motion.div>
  );
}
