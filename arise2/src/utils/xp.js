export function calculateWorkoutXP({ exercisesCount = 1, workoutDurationMin = 30, streakDays = 0 }) {
  const base = 20;
  const perExercise = exercisesCount * 5;
  const durationXP = Math.floor(workoutDurationMin / 10) * 3;
  const streakMultiplier = 1 + Math.min(streakDays, 7) * 0.05;
  const xp = Math.round((base + perExercise + durationXP) * streakMultiplier);
  return xp;
}

export function xpToLevel(currentXP = 0) {
  const base = 100;
  let level = 1;
  while (currentXP >= base * Math.pow(level, 1.5)) {
    level++;
  }
  const xpForCurrentLevel = Math.floor(base * Math.pow(level - 1, 1.5));
  const xpForNext = Math.floor(base * Math.pow(level, 1.5));
  return {
    level,
    xpForCurrentLevel,
    xpForNext,
    progress: xpForNext > xpForCurrentLevel ? (currentXP - xpForCurrentLevel) / (xpForNext - xpForCurrentLevel) : 0,
  };
}
