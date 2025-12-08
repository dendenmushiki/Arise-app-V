export const ATTRIBUTE_HARD_CAP = 100;

export const calculateRank = (totalStats) => {
  if (totalStats >= 501) return 'S';
  if (totalStats >= 251) return 'A';
  if (totalStats >= 121) return 'B';
  if (totalStats >= 51) return 'C';
  return 'D';
};

export const canIncreaseStat = (statValue) => {
  return statValue < ATTRIBUTE_HARD_CAP;
};

export const getPointsForLevel = (level) => {
  if (level >= 1 && level <= 20) return 2;
  if (level >= 21 && level <= 50) return 4;
  if (level >= 51 && level <= 100) return 6;
  return 0;
};

export const calculateInitialStats = (input, level = 1) => {
  let attrs = {};
  if (Array.isArray(input)) {
    const avg = Math.round(input.reduce((a, b) => a + b, 0) / input.length);
    const base = Math.max(1, Math.min(10, Math.round((avg / 5) * 9) + 1));
    attrs = { strength: base, agility: base, stamina: base, endurance: base, intelligence: base };
  } else if (typeof input === 'object' && input !== null) {
    attrs = {
      strength: Math.max(1, Math.min(10, Math.round(input.strength || input.str || 1))),
      agility: Math.max(1, Math.min(10, Math.round(input.agility || input.agi || 1))),
      stamina: Math.max(1, Math.min(10, Math.round(input.stamina || input.sta || 1))),
      endurance: Math.max(1, Math.min(10, Math.round(input.endurance || input.end || 1))),
      intelligence: Math.max(1, Math.min(10, Math.round(input.intelligence || input.int || 1))),
    };
  } else {
    attrs = { strength: 1, agility: 1, stamina: 1, endurance: 1, intelligence: 1 };
  }

  const totalStats = Object.values(attrs).reduce((a, b) => a + b, 0);

  let rank = calculateRank(totalStats);
  if (rank === 'B' || rank === 'A' || rank === 'S') {
    rank = totalStats >= 51 ? 'C' : 'D';
  }

  return { attributes: attrs, totalStats, rank };
};

export const addXPAndCheckLevel = (currentXp, amount, currentLevel) => {
  let xp = (currentXp || 0) + (amount || 0);
  let level = currentLevel || 1;
  // Linear XP formula: requiredXP = 100 * level
  const levelUpThreshold = (lvl) => 100 * lvl;
  let leveled = false;
  // Process all level-ups and carry over remainder XP to next threshold
  while (xp >= levelUpThreshold(level)) {
    xp -= levelUpThreshold(level);
    level += 1;
    leveled = true;
  }
  return { xp, level, leveled };
};
