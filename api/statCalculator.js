const calculateSoftCap = (level) => {
  const maxStat = Math.floor(10 * Math.pow(level, 1.2));
  return maxStat;
};

const calculateRank = (totalStats) => {
  if (totalStats >= 501) return 'S';
  if (totalStats >= 251) return 'A';
  if (totalStats >= 121) return 'B';
  if (totalStats >= 51) return 'C';
  return 'D';
};

const canIncreaseStat = (statValue, statCap) => {
  return statValue < statCap;
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

  const cap = calculateSoftCap(level);
  const softcaps = {
    strengthCap: cap,
    agilityCap: cap,
    staminaCap: cap,
    enduranceCap: cap,
    intelligenceCap: cap,
  };

  // enforce soft cap
  Object.keys(attrs).forEach((k) => {
    if (attrs[k] > softcaps[`${k}Cap`]) attrs[k] = softcaps[`${k}Cap`];
  });

  const totalStats = Object.values(attrs).reduce((a, b) => a + b, 0);

  // New users must start D or C only
  let rank = calculateRank(totalStats);
  if (rank === 'B' || rank === 'A' || rank === 'S') {
    // if total would place higher, clamp to C at most
    rank = totalStats >= 51 ? 'C' : 'D';
  }

  return { attributes: attrs, softcaps, totalStats, rank };
};

// server-side helper that updates XP, checks level-up and adjusts soft caps, rank, and awards stat points
const handleAddXp = (db, userId, amount, callback) => {
  db.get(`SELECT xp, level, unspent_stat_points FROM users WHERE id = ?`, [userId], (err, userRow) => {
    if (err) return callback(err);
    if (!userRow) return callback(new Error('user not found'));

    let xp = (userRow.xp || 0) + (amount || 0);
    let level = userRow.level || 1;
    let statPointsAwarded = 0;

    const levelUpThreshold = (lvl) => 50 * lvl;

    let leveled = false;
    while (xp >= levelUpThreshold(level)) {
      xp -= levelUpThreshold(level);
      level += 1;
      statPointsAwarded += 3; // Award 3 stat points per level
      leveled = true;
    }

    const newStatPoints = (userRow.unspent_stat_points || 0) + statPointsAwarded;

    // Persist user xp, level, and stat points
    db.run(`UPDATE users SET xp = ?, level = ?, unspent_stat_points = ? WHERE id = ?`, [xp, level, newStatPoints, userId], (uerr) => {
      if (uerr) return callback(uerr);

      // Recalculate softcaps and update core_attributes
      const cap = calculateSoftCap(level);
      db.get(`SELECT * FROM core_attributes WHERE userId = ?`, [userId], (cErr, row) => {
        if (cErr) return callback(cErr);

        const updates = {
          strengthCap: cap,
          agilityCap: cap,
          staminaCap: cap,
          enduranceCap: cap,
          intelligenceCap: cap,
        };

        if (!row) {
          // create a record with zeros and caps
          db.run(
            `INSERT INTO core_attributes (userId, strength, agility, stamina, endurance, intelligence, rank, strengthCap, agilityCap, staminaCap, enduranceCap, intelligenceCap, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [userId, 0, 0, 0, 0, 0, 'D', cap, cap, cap, cap, cap],
            (iErr) => {
              if (iErr) return callback(iErr);
              return callback(null, { xp, level, leveled, statPointsAwarded });
            }
          );
        } else {
          // Ensure attributes do not exceed new caps
          const attrs = {
            strength: row.strength > cap ? cap : row.strength,
            agility: row.agility > cap ? cap : row.agility,
            stamina: row.stamina > cap ? cap : row.stamina,
            endurance: row.endurance > cap ? cap : row.endurance,
            intelligence: row.intelligence > cap ? cap : row.intelligence,
          };

          const totalStats = attrs.strength + attrs.agility + attrs.stamina + attrs.endurance + attrs.intelligence;
          const rank = calculateRank(totalStats);

          db.run(
            `UPDATE core_attributes SET strength = ?, agility = ?, stamina = ?, endurance = ?, intelligence = ?, rank = ?, strengthCap = ?, agilityCap = ?, staminaCap = ?, enduranceCap = ?, intelligenceCap = ?, updatedAt = CURRENT_TIMESTAMP WHERE userId = ?`,
            [attrs.strength, attrs.agility, attrs.stamina, attrs.endurance, attrs.intelligence, rank, cap, cap, cap, cap, cap, userId],
            (u2err) => {
              if (u2err) return callback(u2err);
              return callback(null, { xp, level, leveled, statPointsAwarded, rank, softcaps: updates });
            }
          );
        }
      });
    });
  });
};

module.exports = {
  calculateSoftCap,
  calculateRank,
  canIncreaseStat,
  calculateInitialStats,
  handleAddXp,
};
