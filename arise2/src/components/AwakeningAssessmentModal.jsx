import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AwakeningQuiz from './AwakeningQuiz';
import AwakeningResults from './AwakeningResults';
import { calculateInitialStats } from '../utils/statCalculator';
import { calculateCoreAttributes } from '../utils/awakening';

export default function AwakeningAssessmentModal({
  isOpen,
  userId,
  onComplete,
}) {
  const [stage, setStage] = useState('quiz'); // 'quiz' or 'results'
  const [attributes, setAttributes] = useState(null);
  const [rank, setRank] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleQuizComplete = (answers) => {
    const coreAttrs = calculateCoreAttributes(answers);
    const calc = calculateInitialStats(coreAttrs, 1);
    setAttributes(calc.attributes);
    setRank(calc.rank);
    setStage('results');
  };

  const handleResultsComplete = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Import api from the configured axios instance
      const { default: api } = await import('../api.js');
      const response = await api.post('/initialize-stats', {
        userId,
        strength: attributes.strength,
        agility: attributes.agility,
        stamina: attributes.stamina,
        endurance: attributes.endurance,
        intelligence: attributes.intelligence,
        rank,
        level: 1,
        xp: 0,
      });
      // Success - close modal and pass stats to parent callback
      onComplete(response.data.attributes);
    } catch (err) {
      console.error('Error saving stats:', err);
      setError(err.response?.data?.error || err.message || 'Failed to save your awakening. Please try again.');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="bg-gradient-to-br from-[#0b0d1c] to-[#0a0b16] border-2 border-violet-700 rounded-lg p-8 max-h-[90vh] overflow-y-auto shadow-2xl"
        initial={{ scale: 0.85, opacity: 0, y: -20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: -20 }}
        transition={{ duration: 0.45, type: 'spring', stiffness: 120 }}
      >
        {/* Modal Header with entrance animation */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <h3 className="text-2xl font-bold text-violet-300">Awakening Assessment</h3>
          <motion.div
            className="mx-auto mt-2 h-1 bg-gradient-to-r from-violet-600 to-violet-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: '6rem' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </motion.div>
        <AnimatePresence mode="wait">
          {stage === 'quiz' && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <AwakeningQuiz onComplete={handleQuizComplete} />
            </motion.div>
          )}

          {stage === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AwakeningResults
                attributes={attributes}
                rank={rank}
                onContinue={handleResultsComplete}
                isLoading={isLoading}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div
            className="mt-6 p-4 bg-red-900 border border-red-600 rounded-lg text-red-200"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
