const ATTRIBUTE_HARD_CAP = 100;

// Rank is determined by player level instead of total stats.
// Ranges:
// D: level 1–25
// C: level 26–45
// B: level 46–65
// A: level 66–85
// S: level 86–100
const calculateRank = (level) => {
  const lvl = Math.max(1, Math.min(100, Number(level) || 1));
  if (lvl >= 86) return 'S';
  if (lvl >= 66) return 'A';
  if (lvl >= 46) return 'B';
  if (lvl >= 26) return 'C';
  return 'D';
};

const canIncreaseStat = (statValue) => {
  return statValue < ATTRIBUTE_HARD_CAP;
};

const getPointsForLevel = (level) => {
  if (level >= 1 && level <= 20) return 2;
  if (level >= 21 && level <= 50) return 4;
  if (level >= 51 && level <= 100) return 6;
  return 0;
};

// Accepts either an object {strength,agility,...} with values in 1-10 or an answers array
const calculateInitialStats = (input, level = 1) => {
  // If input is an array, reduce to attribute values (simple mapping)
  let attrs = {};
  if (Array.isArray(input)) {
    // Expect array of numbers 1-5 mapping to different attributes: distribute evenly
    const avg = Math.round(input.reduce((a, b) => a + b, 0) / input.length);
    // Map average into 1-10 range
    const base = Math.max(1, Math.min(10, Math.round((avg / 5) * 9) + 1));
    attrs = {
      strength: base,
      agility: base,
      stamina: base,
      endurance: base,
      intelligence: base,
    };
  } else if (typeof input === 'object' && input !== null) {
    attrs = {
      strength: Math.max(1, Math.min(10, Math.round(input.strength || input.str || 1))),
      agility: Math.max(1, Math.min(10, Math.round(input.agility || input.agi || 1))),
      stamina: Math.max(1, Math.min(10, Math.round(input.stamina || input.sta || 1))),
      endurance: Math.max(1, Math.min(10, Math.round(input.endurance || input.end || 1))),
      intelligence: Math.max(1, Math.min(10, Math.round(input.intelligence || input.int || 1))),
    };
  } else {
    // fallback
    attrs = { strength: 1, agility: 1, stamina: 1, endurance: 1, intelligence: 1 };
  }

  const totalStats = Object.values(attrs).reduce((a, b) => a + b, 0);

  // Determine rank by level (not by totalStats)
  const rank = calculateRank(level);

  return { attributes: attrs, totalStats, rank };
};

// server-side helper that updates XP, checks level-up and awards stat points
const handleAddXp = (db, userId, amount, callback) => {
  db.get(`SELECT xp, level, unspent_stat_points FROM users WHERE id = ?`, [userId], (err, userRow) => {
    if (err) return callback(err);
    if (!userRow) return callback(new Error('user not found'));

    let xp = (userRow.xp || 0) + (amount || 0);
    let level = userRow.level || 1;
    let statPointsAwarded = 0;

    // Linear XP formula: requiredXP = 100 * level
    // Level 1 requires 100 XP, Level 2 requires 200 XP, etc.
    const levelUpThreshold = (lvl) => 100 * lvl;

    let leveled = false;
    // Process all level-ups: subtract threshold for each level and award stat points based on new level
    // XP carries over to next level threshold (e.g., if 150 XP at level 1 with threshold 100,
    // level becomes 2 and xp becomes 50 for level 3 threshold of 200)
    while (xp >= levelUpThreshold(level)) {
      xp -= levelUpThreshold(level);
      level += 1;
      const pointsThisLevel = getPointsForLevel(level);
      statPointsAwarded += pointsThisLevel;
      leveled = true;
    }

    const newStatPoints = (userRow.unspent_stat_points || 0) + statPointsAwarded;

    // Persist user xp, level, and stat points
    db.run(`UPDATE users SET xp = ?, level = ?, unspent_stat_points = ? WHERE id = ?`, [xp, level, newStatPoints, userId], (uerr) => {
      if (uerr) return callback(uerr);

      // Recalculate rank and update core_attributes (no soft caps)
      db.get(`SELECT * FROM core_attributes WHERE userId = ?`, [userId], (cErr, row) => {
        if (cErr) return callback(cErr);

        if (!row) {
          // create a record with zeros and rank based on the (possibly updated) level
          const rankForLevel = calculateRank(level);
          db.run(
            `INSERT INTO core_attributes (userId, strength, agility, stamina, endurance, intelligence, rank, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [userId, 0, 0, 0, 0, 0, rankForLevel],
            (iErr) => {
              if (iErr) return callback(iErr);
              return callback(null, { xp, level, leveled, statPointsAwarded, rank: rankForLevel });
            }
          );
        } else {
          // Use level-based rank regardless of raw attribute totals
          const rankForLevel = calculateRank(level);

          db.run(
            `UPDATE core_attributes SET rank = ?, updatedAt = CURRENT_TIMESTAMP WHERE userId = ?`,
            [rankForLevel, userId],
            (u2err) => {
              if (u2err) return callback(u2err);
              return callback(null, { xp, level, leveled, statPointsAwarded, rank: rankForLevel });
            }
          );
        }
      });
    });
  });
};

module.exports = {
  ATTRIBUTE_HARD_CAP,
  calculateRank,
  canIncreaseStat,
  getPointsForLevel,
  calculateInitialStats,
  handleAddXp,
};
