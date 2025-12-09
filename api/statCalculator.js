const ATTRIBUTE_HARD_CAP = 100;

// Rank ay base sa level di stats.
// Mga hanay:
// D: antas 1–25
// C: antas 26–45
// B: antas 46–65
// A: antas 66–85
// S: antas 86–100
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

// Tumatanggap ng object na {strength,agility,...} na may values 1-10 o array ng mga sumagot
const calculateInitialStats = (input, level = 1) => {
  // Kung ang input ay array, bawasan sa mga values ng attribute (simpleng mapping)
  let attrs = {};
  if (Array.isArray(input)) {
    // Inaasahang array ng numbers 1-5 na naka-map sa iba't ibang attributes: i-distribute pantay
    const avg = Math.round(input.reduce((a, b) => a + b, 0) / input.length);
    // I-map ang average sa hanay na 1-10
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
    // default na values
    attrs = { strength: 1, agility: 1, stamina: 1, endurance: 1, intelligence: 1 };
  }

  const totalStats = Object.values(attrs).reduce((a, b) => a + b, 0);

  // Tukuyin ang ranggo ayon sa antas (hindi base sa totalStats)
  const rank = calculateRank(level);

  return { attributes: attrs, totalStats, rank };
};

// server-side na tumutulong na nag-update ng XP, tumatanggap ng level-up at nagbibigay ng stat points
const handleAddXp = (db, userId, amount, callback) => {
  db.get(`SELECT xp, level, unspent_stat_points FROM users WHERE id = ?`, [userId], (err, userRow) => {
    if (err) return callback(err);
    if (!userRow) return callback(new Error('user not found'));

    let xp = (userRow.xp || 0) + (amount || 0);
    let level = userRow.level || 1;
    let statPointsAwarded = 0;

    // Linear na XP formula: requiredXP = 100 * level
    // Antas 1 ay nangangailangan ng 100 XP, Antas 2 ay nangangailangan ng 200 XP, atbp.
    const levelUpThreshold = (lvl) => 100 * lvl;

    let leveled = false;
    // Iproseso ang lahat ng level-ups: ibawas ang threshold para sa bawat antas at magbigay ng stat points base sa bagong antas
    // Ang XP ay nauumpisa sa susunod na level threshold (halimbawa, kung 150 XP sa antas 1 na may threshold 100,
    // ang antas ay nagiging 2 at ang xp ay nagiging 50 para sa antas 3 na may threshold na 200)
    while (xp >= levelUpThreshold(level)) {
      xp -= levelUpThreshold(level);
      level += 1;
      const pointsThisLevel = getPointsForLevel(level);
      statPointsAwarded += pointsThisLevel;
      leveled = true;
    }

    const newStatPoints = (userRow.unspent_stat_points || 0) + statPointsAwarded;

    // I-save ang user xp, antas, at stat points
    db.run(`UPDATE users SET xp = ?, level = ?, unspent_stat_points = ? WHERE id = ?`, [xp, level, newStatPoints, userId], (uerr) => {
      if (uerr) return callback(uerr);

      // I-recalculate ang ranggo at i-update ang core_attributes (walang soft caps)
      db.get(`SELECT * FROM core_attributes WHERE userId = ?`, [userId], (cErr, row) => {
        if (cErr) return callback(cErr);

        if (!row) {
          // lumikha ng record na may zeros at ranggo base sa (posibleng nag-update na) antas
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
          // Gamitin ang level-based rank kahit ano ang raw attribute totals
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
