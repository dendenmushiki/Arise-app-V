const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./arise.db', sqlite3.OPEN_READONLY, (err) => {
  if (err) return console.error('Failed to open DB:', err.message);
});

const sql = `SELECT u.id as userId, u.username, u.xp, u.level as userLevel, ca.* FROM users u LEFT JOIN core_attributes ca ON u.id = ca.userId ORDER BY u.id`;

db.all(sql, [], (err, rows) => {
  if (err) {
    console.error('Query error:', err.message);
    db.close();
    return;
  }

  if (!rows || rows.length === 0) {
    console.log('No users found');
    db.close();
    return;
  }

  rows.forEach(r => {
    console.log('---');
    console.log(`userId: ${r.userId} | username: ${r.username} | xp: ${r.xp} | level: ${r.userLevel}`);
    if (r.userId && r.id) {
      console.log(`core_attributes.id: ${r.id}`);
      console.log(`strength: ${r.strength}`);
      console.log(`agility: ${r.agility}`);
      console.log(`stamina: ${r.stamina}`);
      console.log(`endurance: ${r.endurance}`);
      console.log(`intelligence: ${r.intelligence}`);
      console.log(`strengthCap: ${r.strengthCap}`);
      console.log(`agilityCap: ${r.agilityCap}`);
      console.log(`staminaCap: ${r.staminaCap}`);
      console.log(`enduranceCap: ${r.enduranceCap}`);
      console.log(`intelligenceCap: ${r.intelligenceCap}`);
      console.log(`rank: ${r.rank}`);
    } else {
      console.log('No core_attributes row for this user');
    }
  });

  db.close();
});
