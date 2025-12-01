export const calculateSoftCap = (level) => {
  return Math.floor(10 * Math.pow(level, 1.2));
};

export const calculateRank = (totalStats) => {
  if (totalStats >= 501) return 'S';
  if (totalStats >= 251) return 'A';
  if (totalStats >= 121) return 'B';
  if (totalStats >= 51) return 'C';
  return 'D';
};

export const canIncreaseStat = (statValue, statCap) => {
  return statValue < statCap;
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

  const cap = calculateSoftCap(level);
  const softcaps = {
    strengthCap: cap,
    agilityCap: cap,
    staminaCap: cap,
    enduranceCap: cap,
    intelligenceCap: cap,
  };

  Object.keys(attrs).forEach((k) => {
    if (attrs[k] > softcaps[`${k}Cap`]) attrs[k] = softcaps[`${k}Cap`];
  });

  const totalStats = Object.values(attrs).reduce((a, b) => a + b, 0);

  let rank = calculateRank(totalStats);
  if (rank === 'B' || rank === 'A' || rank === 'S') {
    rank = totalStats >= 51 ? 'C' : 'D';
  }

  return { attributes: attrs, softcaps, totalStats, rank };
};

export const addXPAndCheckLevel = (currentXp, amount, currentLevel) => {
  let xp = (currentXp || 0) + (amount || 0);
  let level = currentLevel || 1;
  const levelUpThreshold = (lvl) => 50 * lvl;
  let leveled = false;
  while (xp >= levelUpThreshold(level)) {
    xp -= levelUpThreshold(level);
    level += 1;
    leveled = true;
  }
  return { xp, level, leveled };
};
