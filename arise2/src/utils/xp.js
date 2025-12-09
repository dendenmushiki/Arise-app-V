export function calculateWorkoutXP({ exercisesCount = 1, workoutDurationMin = 30, streakDays = 0 }) {
  const base = 20;
  const perExercise = exercisesCount * 5;
  const durationXP = Math.floor(workoutDurationMin / 10) * 3;
  const streakMultiplier = 1 + Math.min(streakDays, 7) * 0.05;
  const xp = Math.round((base + perExercise + durationXP) * streakMultiplier);
  return xp;
}

export function xpToLevel(xpRemainder = 0, level = 1) {
  let computedLevel = level;
  let computedXp = xpRemainder;
  
  // Kung legacy mode (isang numero lamang ang ipinasa, tratuhin bilang cumulative), mag-compute ng level mula sa total
  if (typeof xpRemainder === 'number' && level === 1 && xpRemainder > 100) {
    // Legacy: i-simulate ang cumulative XP -> level conversion
    computedLevel = 1;
    let tempXp = xpRemainder;
    while (tempXp >= 100 * computedLevel) {
      tempXp -= 100 * computedLevel;
      computedLevel++;
    }
    computedXp = tempXp;
  }
  
  const requiredForCurrent = 100 * computedLevel;
  const requiredForNext = 100 * (computedLevel + 1);
  const progress = Math.max(0, Math.min(1, computedXp / requiredForCurrent));
  
  return {
    level: computedLevel,
    xpForCurrentLevel: computedXp,
    xpForNext: requiredForNext,
    progress: progress,
  };
}
