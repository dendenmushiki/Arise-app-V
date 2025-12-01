import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AWAKENING_QUESTIONS } from '../utils/awakening';

export default function AwakeningQuiz({ onComplete }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);

  const currentQuestion = AWAKENING_QUESTIONS[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / AWAKENING_QUESTIONS.length) * 100;

  const handleSelectAnswer = (selectedValue) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = {
      questionId: currentQuestion.id,
      selectedValue,
    };
    setAnswers(newAnswers);

    // Auto-advance to next question
    if (currentQuestionIndex < AWAKENING_QUESTIONS.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }, 300);
    } else {
      // Quiz complete
      setTimeout(() => {
        onComplete(newAnswers);
      }, 300);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSkip = () => {
    if (currentQuestionIndex < AWAKENING_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-violet-400">
            Question {currentQuestionIndex + 1} of {AWAKENING_QUESTIONS.length}
          </h3>
          <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
        </div>
        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-600 to-violet-400"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Question Container */}
      <motion.div
        key={currentQuestionIndex}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="bg-[#0d0e26] border border-violet-700 rounded-lg p-8 mb-8"
      >
        <h4 className="text-xl font-bold text-white mb-6">
          {currentQuestion.text}
        </h4>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, idx) => (
            <motion.button
              key={idx}
              onClick={() => handleSelectAnswer(option.value)}
              className={`w-full p-4 rounded-lg border-2 text-left font-medium transition-all ${
                answers[currentQuestionIndex]?.selectedValue === option.value
                  ? 'border-violet-500 bg-violet-500 bg-opacity-20 text-violet-300'
                  : 'border-gray-600 bg-gray-800 hover:border-violet-500 hover:bg-gray-700 text-gray-300'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {option.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Navigation Buttons */}
      <div className="flex gap-4 justify-between">
        <motion.button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="px-6 py-2 rounded-lg border border-gray-600 text-gray-300 font-medium hover:border-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          ← Previous
        </motion.button>

        <motion.button
          onClick={handleSkip}
          disabled={currentQuestionIndex === AWAKENING_QUESTIONS.length - 1}
          className="px-6 py-2 rounded-lg border border-gray-600 text-gray-300 font-medium hover:border-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Skip →
        </motion.button>

        {currentQuestionIndex === AWAKENING_QUESTIONS.length - 1 && (
          <motion.button
            onClick={() => onComplete(answers)}
            className="px-8 py-2 rounded-lg bg-violet-600 text-white font-bold hover:bg-violet-500 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Complete Quiz
          </motion.button>
        )}
      </div>
    </div>
  );
}
