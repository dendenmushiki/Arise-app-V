const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb' }));

// tamang file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  },
});

const statCalc = require('./statCalculator');
const titleUnlocker = require('./TitleUnlocker');
const badgeSystem = require('./BadgeSystem');

const db = new sqlite3.Database('./arise.db', (err) => {
  if (err) console.error('Database connection error:', err.message);
  else console.log('Connected to arise.db');
});

// Lumikha ng mga talahanayan
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    passwordHash TEXT,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak INTEGER DEFAULT 0,
    avatar TEXT DEFAULT '/assets/avatars/default-avatar.svg',
    profileBorder TEXT DEFAULT 'rankD',
    title TEXT DEFAULT 'Newly Awakened',
    badges TEXT DEFAULT '[]',
    unspent_stat_points INTEGER DEFAULT 0,
    last_reset_date TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    name TEXT,
    sets INTEGER,
    reps INTEGER,
    duration INTEGER,
    loggedOnly INTEGER DEFAULT 0,
    type TEXT DEFAULT 'workout',
    date TEXT DEFAULT CURRENT_DATE,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    key TEXT,
    name TEXT,
    earnedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    senderId INTEGER,
    senderName TEXT,
    content TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS quests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    title TEXT,
    description TEXT,
    baseReps INTEGER DEFAULT 10,
    baseDuration INTEGER DEFAULT 20,
    questDate TEXT,
    completed INTEGER DEFAULT 0,
    completedAt TEXT,
    quote TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS unlocked_badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    badge_id TEXT,
    badge_name TEXT,
    unlocked_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id),
    UNIQUE(userId, badge_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS unlocked_borders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    border_id TEXT,
    border_name TEXT,
    unlocked_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id),
    UNIQUE(userId, border_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS core_attributes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER UNIQUE,
    strength INTEGER DEFAULT 0,
    agility INTEGER DEFAULT 0,
    stamina INTEGER DEFAULT 0,
    endurance INTEGER DEFAULT 0,
    intelligence INTEGER DEFAULT 0,
    rank TEXT DEFAULT 'D',
    strengthCap INTEGER DEFAULT 10,
    agilityCap INTEGER DEFAULT 10,
    staminaCap INTEGER DEFAULT 10,
    enduranceCap INTEGER DEFAULT 10,
    intelligenceCap INTEGER DEFAULT 10,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id)
  )`);

  // Tiyaking ang `loggedOnly` column ay umiiral sa mas lumang DBs (ligtas na check)
  db.all("PRAGMA table_info(workouts)", (perr, cols) => {
    if (!perr) {
      const hasLogged = cols && cols.find && cols.find((c) => c && c.name === 'loggedOnly');
      if (!hasLogged) {
        db.run(`ALTER TABLE workouts ADD COLUMN loggedOnly INTEGER DEFAULT 0`, (aerr) => {
          if (aerr && !/duplicate column/i.test(aerr.message)) console.error('Failed to add loggedOnly column:', aerr.message);
        });
      }
      const hasType = cols && cols.find && cols.find((c) => c && c.name === 'type');
      if (!hasType) {
        db.run(`ALTER TABLE workouts ADD COLUMN type TEXT DEFAULT 'workout'`, (aerr) => {
          if (aerr && !/duplicate column/i.test(aerr.message)) console.error('Failed to add type column:', aerr.message);
        });
      }
    }
  });

  // Tandaan: Ang soft cap columns ay hindi na ginagamit (tinanggal kapalit ng hard cap ng 100)
  // Ang umiiral na softcap columns sa DB ay naiwan na walang bago pero hindi na nare-reference

  // Tiyaking ang profile columns ay umiiral sa users (migration para sa umiiral na DBs)
  db.all("PRAGMA table_info(users)", (uErr, cols) => {
    if (!uErr && cols) {
      const profileColumns = [
        { name: 'avatar', type: 'TEXT DEFAULT \'/assets/avatars/default-avatar.svg\'' },
        { name: 'avatarType', type: 'TEXT DEFAULT \'preset\'' },
        { name: 'avatarUploadDate', type: 'TEXT' },
        { name: 'profileBorder', type: 'TEXT DEFAULT \'rankD\'' },
        { name: 'title', type: 'TEXT DEFAULT \'Newly Awakened\'' },
        { name: 'badges', type: 'TEXT DEFAULT \'[]\'' },
        { name: 'unspent_stat_points', type: 'INTEGER DEFAULT 0' },
        { name: 'last_reset_date', type: 'TEXT' },
      ];
      profileColumns.forEach(({ name, type }) => {
        const hasCol = cols.find((c) => c && c.name === name);
        if (!hasCol) {
          db.run(`ALTER TABLE users ADD COLUMN ${name} ${type}`, (altErr) => {
            if (altErr && !/duplicate column/i.test(altErr.message)) {
              console.error(`Failed to add ${name} column:`, altErr.message);
            }
          });
        }
      });
    }
  });

  // Tiyaking ang base stat columns ay umiiral sa core_attributes (migration para sa umiiral na DBs)
  db.all("PRAGMA table_info(core_attributes)", (caErr, cols) => {
    if (!caErr && cols) {
      const baseStatColumns = [
        { name: 'base_strength', type: 'INTEGER DEFAULT 0' },
        { name: 'base_agility', type: 'INTEGER DEFAULT 0' },
        { name: 'base_stamina', type: 'INTEGER DEFAULT 0' },
        { name: 'base_endurance', type: 'INTEGER DEFAULT 0' },
        { name: 'base_intelligence', type: 'INTEGER DEFAULT 0' },
      ];
      baseStatColumns.forEach(({ name, type }) => {
        const hasCol = cols.find((c) => c && c.name === name);
        if (!hasCol) {
          db.run(`ALTER TABLE core_attributes ADD COLUMN ${name} ${type}`, (altErr) => {
            if (altErr && !/duplicate column/i.test(altErr.message)) {
              console.error(`Failed to add ${name} column:`, altErr.message);
            }
          });
        }
      });
    }
  });
});

// Middleware
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "missing auth" });
  
  const token = auth.split(" ")[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: "invalid token" });
  }
}

// Auth
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: "missing fields" });
  }
  
  if (username.length < 4 || username.length > 20) {
    return res.status(400).json({ error: "Username must be 4-20 characters." });
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return res.status(400).json({ error: "Username can only have letters, numbers, and underscores." });
  }
  
  if (password.length < 8 || password.length > 20) {
    return res.status(400).json({ error: "Password must be 8-20 characters." });
  }
  
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
    return res.status(400).json({ error: "Password needs uppercase, lowercase, number, and special char." });
  }
  
  const hash = await bcrypt.hash(password, 10);
  db.run(
    `INSERT INTO users (username, passwordHash) VALUES (?, ?)`,
    [username, hash],
    function(err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      const user = { id: this.lastID, username };
      const token = jwt.sign(user, JWT_SECRET);
      res.json({ token, user });
    }
  );
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(400).json({ error: "invalid credentials" });
    
    const ok = await bcrypt.compare(password, row.passwordHash);
    if (!ok) return res.status(400).json({ error: "invalid credentials" });
    
    const user = { id: row.id, username: row.username, xp: row.xp, level: row.level };
    const token = jwt.sign(user, JWT_SECRET);
    res.json({ token, user });
  });
});

app.get("/api/profile", authMiddleware, (req, res) => {
  db.get(
    `SELECT u.id, u.username, u.xp, u.level, u.streak, u.avatar, u.profileBorder, u.title, u.badges, u.unspent_stat_points, u.last_reset_date, ca.rank FROM users u
     LEFT JOIN core_attributes ca ON u.id = ca.userId
     WHERE u.id = ?`,
    [req.user.id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      
      if (!row) return res.status(404).json({ error: 'user not found' });

      // I-parse ang badges array (na-store bilang JSON string sa DB)
      let badges = [];
      try {
        badges = row.badges ? JSON.parse(row.badges) : [];
      } catch (e) {
        badges = [];
      }

      // Kunin ang core attributes para sa badge/title unlocking logic
      db.get(`SELECT * FROM core_attributes WHERE userId = ?`, [req.user.id], (caErr, attrs) => {
        if (!caErr && attrs) {
          // Ihanda ang user stats object para sa badge checking
          const userStats = {
            level: row.level,
            xp: row.xp,
            streak: row.streak,
            rank: row.rank || 'D',
            questsCompleted: 0, // Will fetch from quests table
            strength: attrs.strength,
            agility: attrs.agility,
            stamina: attrs.stamina,
            endurance: attrs.endurance,
            intelligence: attrs.intelligence,
          };

          // Bilangan ang na-complete na quests
          db.get(
            `SELECT COUNT(*) as count FROM quests WHERE userId = ? AND completed = 1`,
            [req.user.id],
            (qErr, questRow) => {
              if (!qErr && questRow) {
                userStats.questsCompleted = questRow.count;
              }

              // Suriin para sa mga bagong badge unlocks
              const unlockedBadges = badgeSystem.checkAndUnlockBadges(userStats, attrs);
              const newBadges = unlockedBadges.filter((b) => !badges.includes(b));

              if (newBadges.length > 0) {
                badges = unlockedBadges;
                db.run(
                  `UPDATE users SET badges = ? WHERE id = ?`,
                  [JSON.stringify(badges), req.user.id],
                  () => {
                    // Badge update ay nagtagumpay, magpatuloy
                  }
                );
              }

              // Suriin para sa bagong title unlock
              const newTitle = titleUnlocker.checkAndUnlockTitles(userStats, attrs);
              if (newTitle !== row.title) {
                db.run(
                  `UPDATE users SET title = ? WHERE id = ?`,
                  [newTitle, req.user.id],
                  () => {
                    // Title update ay nagtagumpay
                  }
                );
              }

              // Ibalik ang profile data
              res.json({
                user: {
                  ...row,
                  badges: badges,
                  title: newTitle || row.title,
                  questsCompleted: userStats.questsCompleted,
                },
              });
            }
          );
        } else {
          res.json({ user: row });
        }
      });
    }
  );
});

// I-initialize ang Stats (Awakening Assessment)
app.post("/api/initialize-stats", authMiddleware, (req, res) => {
  const { userId, strength, agility, stamina, endurance, intelligence, rank, level, xp } = req.body;
  const uid = req.user.id;

  // Tiyaking ang user ay nag-initialize ng kanilang sariling stats
  if (userId !== uid) {
    return res.status(403).json({ error: "unauthorized" });
  }

  // Tumanggap ng partial inputs; i-coerce sa numbers kung saan present
  const inputAttrs = {
    strength: strength != null ? Number(strength) : undefined,
    agility: agility != null ? Number(agility) : undefined,
    stamina: stamina != null ? Number(stamina) : undefined,
    endurance: endurance != null ? Number(endurance) : undefined,
    intelligence: intelligence != null ? Number(intelligence) : undefined,
  };

  const userLevel = Math.max(1, Number(level) || 1);
  const userXp = Number(xp) || 0;

  // Kalkulahin ang initial stats at softcaps (ito ay mag-enforce ng level-based soft caps at mag-clamp ng new-user rank)
  const calc = statCalc.calculateInitialStats(inputAttrs, userLevel);
  const attrs = calc.attributes;
  const softcaps = calc.softcaps;
  const computedRank = calc.rank;

  // I-persist ang user's xp at level sa users table
  db.run(`UPDATE users SET xp = ?, level = ? WHERE id = ?`, [userXp, userLevel, uid], (uerr) => {
    if (uerr) return res.status(500).json({ error: uerr.message });

    // I-insert o i-update ang core_attributes na may enforced caps
    db.run(
      `INSERT INTO core_attributes (userId, strength, agility, stamina, endurance, intelligence, rank, base_strength, base_agility, base_stamina, base_endurance, base_intelligence, strengthCap, agilityCap, staminaCap, enduranceCap, intelligenceCap)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(userId) DO UPDATE SET
         strength = excluded.strength,
         agility = excluded.agility,
         stamina = excluded.stamina,
         endurance = excluded.endurance,
         intelligence = excluded.intelligence,
         rank = excluded.rank,
         base_strength = excluded.base_strength,
         base_agility = excluded.base_agility,
         base_stamina = excluded.base_stamina,
         base_endurance = excluded.base_endurance,
         base_intelligence = excluded.base_intelligence,
         strengthCap = excluded.strengthCap,
         agilityCap = excluded.agilityCap,
         staminaCap = excluded.staminaCap,
         enduranceCap = excluded.enduranceCap,
         intelligenceCap = excluded.intelligenceCap,
         updatedAt = CURRENT_TIMESTAMP`,
      [uid, attrs.strength, attrs.agility, attrs.stamina, attrs.endurance, attrs.intelligence, computedRank, attrs.strength, attrs.agility, attrs.stamina, attrs.endurance, attrs.intelligence, softcaps.strengthCap, softcaps.agilityCap, softcaps.staminaCap, softcaps.enduranceCap, softcaps.intelligenceCap],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
          message: "stats initialized",
          attributes: {
            userId: uid,
            ...attrs,
            rank: computedRank,
            softcaps,
            xp: userXp,
            level: userLevel,
          },
        });
      }
    );
  });
});

// Kunin ang User Core Attributes
app.get("/api/core-attributes", authMiddleware, (req, res) => {
  db.get(
    `SELECT * FROM core_attributes WHERE userId = ?`,
    [req.user.id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "attributes not found" });
      res.json({ attributes: row });
    }
  );
});

// Add XP to user and handle level ups
app.post('/api/add-xp', authMiddleware, (req, res) => {
  const uid = req.user.id;
  const { amount } = req.body;
  const addAmount = Number(amount || 0);
  if (!addAmount || addAmount <= 0) return res.status(400).json({ error: 'invalid amount' });

  statCalc.handleAddXp(db, uid, addAmount, (err, result) => {
    if (err) return res.status(500).json({ error: err.message || String(err) });
    res.json({ message: 'xp updated', xp: result.xp, level: result.level, leveled: result.leveled, rank: result.rank || null, softcaps: result.softcaps || null });
  });
});

// I-update ang User Avatar (Preset)
app.post('/api/update-avatar', authMiddleware, (req, res) => {
  const uid = req.user.id;
  const { avatarUrl } = req.body;

  if (!avatarUrl || typeof avatarUrl !== 'string') {
    return res.status(400).json({ error: 'invalid avatarUrl' });
  }

  db.run(
    `UPDATE users SET avatar = ?, avatarType = ?, avatarUploadDate = ? WHERE id = ?`,
    [avatarUrl, 'preset', null, uid],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      // Notify connected clients that a user updated their avatar
      try {
        io.emit('user_updated', { id: uid, avatar: avatarUrl });
      } catch (e) {
        console.error('Failed to emit user_updated:', e && e.message);
      }
      res.json({ message: 'avatar updated', avatar: avatarUrl, avatarType: 'preset' });
    }
  );
});

// Upload Custom Avatar Image
app.post('/api/upload-avatar', authMiddleware, upload.single('file'), (req, res) => {
  const uid = req.user.id;

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  if (req.file.size > 5 * 1024 * 1024) {
    return res.status(413).json({ error: 'File size exceeds 5MB limit' });
  }

  try {
    // Convert image to base64 data URL
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const uploadDate = new Date().toISOString();

    db.run(
      `UPDATE users SET avatar = ?, avatarType = ?, avatarUploadDate = ? WHERE id = ?`,
      [base64Image, 'custom', uploadDate, uid],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        // Emit avatar change so connected clients can update immediately
        try {
          io.emit('user_updated', { id: uid, avatar: base64Image });
        } catch (e) {
          console.error('Failed to emit user_updated:', e && e.message);
        }

        res.json({
          message: 'avatar uploaded successfully',
          avatar: base64Image,
          avatarType: 'custom',
          uploadDate: uploadDate,
        });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Failed to process image: ' + err.message });
  }
});

// Get Profile Data (including avatar, title, badges)
app.get('/api/profile-data', authMiddleware, (req, res) => {
  db.get(
    `SELECT avatar, profileBorder, title, badges FROM users WHERE id = ?`,
    [req.user.id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: 'user not found' });

      const badges = row.badges ? JSON.parse(row.badges) : [];
      res.json({
        profileData: {
          avatar: row.avatar,
          profileBorder: row.profileBorder,
          title: row.title,
          badges: badges,
        },
      });
    }
  );
});

// Update Profile Border (usually called automatically when rank changes)
app.post('/api/update-border', authMiddleware, (req, res) => {
  const uid = req.user.id;
  const { profileBorder } = req.body;

  if (!profileBorder || typeof profileBorder !== 'string') {
    return res.status(400).json({ error: 'invalid profileBorder' });
  }

  db.run(
    `UPDATE users SET profileBorder = ? WHERE id = ?`,
    [profileBorder, uid],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'border updated', profileBorder });
    }
  );
});

// Mga Workout
app.post("/api/workouts", authMiddleware, (req, res) => {
  const { name, sets = 0, reps = 0, duration = 0, loggedOnly = 0, type = 'workout', difficulty = 'beginner', intensity = 'normal' } = req.body;
  const uid = req.user.id;
  
  db.run(
    `INSERT INTO workouts (userId, name, sets, reps, duration, loggedOnly, type) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [uid, name, sets, reps, duration, loggedOnly ? 1 : 0, type],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      // Phase 1 & 2 XP Rebalancing:
      // Quests: 50 XP (fixed)
      // Challenges: scale by difficulty (beginner=20, intermediate=30, hard=40)
      // Manual workouts: 15 + (sets*2) + (reps*0.5) - rebalanced formula
      // Phase 2: Intensity bonus for timed workouts (normal=0, high=5, very-high=10)
      let xpGain;
      if (type === 'quest') {
        xpGain = 50;
      } else if (type === 'challenge') {
        const difficultyMap = { 'beginner': 20, 'intermediate': 30, 'hard': 40 };
        xpGain = difficultyMap[difficulty] || 20;
        // Phase 2: Apply intensity bonus to challenges too
        const intensityMap = { 'normal': 0, 'high': 5, 'very-high': 10 };
        xpGain += intensityMap[intensity] || 0;
      } else {
        xpGain = 15 + (sets * 2) + Math.floor(reps * 0.5);
        // Phase 2: Apply intensity bonus for timed workouts (duration > 0, no sets/reps)
        if (duration > 0 && sets === 0 && reps === 0) {
          xpGain = 5 + duration * 1; // Base formula: 5 + (duration * 1)
          const intensityMap = { 'normal': 0, 'high': 5, 'very-high': 10 };
          xpGain += intensityMap[intensity] || 0;
        }
      }
      // Gamitin ang server-side handler para mag-apply ng XP, harapin ang level-ups, magbigay ng stat points, at i-update ang soft caps
      statCalc.handleAddXp(db, uid, xpGain, (xpErr, result) => {
        if (xpErr) console.error('Failed to add workout XP:', xpErr.message);
      });

      // Magbigay ng 1 stat point para sa bawat 5 challenges na na-complete
      if (type === 'challenge') {
        db.get(
          `SELECT COUNT(*) as challenge_count FROM workouts WHERE userId = ? AND type = 'challenge'`,
          [uid],
          (countErr, row) => {
            if (countErr) {
              console.error('Failed to count challenges:', countErr.message);
              return;
            }
            // Magbigay ng 1 stat point kapag total challenges completed ay multiple ng 5
            const totalChallenges = (row?.challenge_count || 0) + 1; // +1 for the current challenge
            if (totalChallenges % 5 === 0) {
              db.run(`UPDATE users SET unspent_stat_points = unspent_stat_points + 1 WHERE id = ?`, [uid], (statErr) => {
                if (statErr) console.error('Failed to award challenge stat point:', statErr.message);
              });
            }
          }
        );
      }

      res.json({ id: this.lastID, name, sets, reps, duration, loggedOnly: loggedOnly ? 1 : 0, type });
    }
  );
});

app.get("/api/workouts", authMiddleware, (req, res) => {
  db.all(
    `SELECT * FROM workouts WHERE userId = ? ORDER BY createdAt DESC LIMIT 200`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ workouts: rows });
    }
  );
});

// Mga Achievement
app.get("/api/achievements", authMiddleware, (req, res) => {
  db.all(
    `SELECT * FROM achievements WHERE userId = ? ORDER BY earnedAt DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ achievements: rows });
    }
  );
});

// Mga Mensahe
app.get("/api/messages", (req, res) => {
  db.all(
    `SELECT * FROM messages ORDER BY createdAt DESC LIMIT 100`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ messages: rows.reverse() });
    }
  );
});

// Users list - used by chat to render avatars and names
app.get('/api/users', (req, res) => {
  db.all(
    `SELECT id, username, avatar FROM users ORDER BY username COLLATE NOCASE`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ users: rows });
    }
  );
});

// Stat System Endpoints
// Allocate a stat point to an attribute
app.post('/api/stats/spend', authMiddleware, (req, res) => {
  const uid = req.user.id;
  const { attribute, amount } = req.body;

  if (!attribute || !['strength', 'agility', 'stamina', 'endurance', 'intelligence'].includes(attribute)) {
    return res.status(400).json({ error: 'invalid attribute' });
  }

  const spendAmount = Number(amount) || 1;

  db.get(`SELECT unspent_stat_points FROM users WHERE id = ?`, [uid], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'user not found' });

    const availablePoints = Number(user.unspent_stat_points || 0);
    if (availablePoints < spendAmount) {
      return res.status(400).json({ error: 'not enough stat points' });
    }

    db.get(`SELECT * FROM core_attributes WHERE userId = ?`, [uid], (caErr, attrs) => {
      if (caErr) return res.status(500).json({ error: caErr.message });
      // Kung ang core attributes row ay missing (user ay hindi pa nag-initialize ng awakening), lumikha ng default row
      if (!attrs) {
        const defaultCaps = { strengthCap: 10, agilityCap: 10, staminaCap: 10, enduranceCap: 10, intelligenceCap: 10 };
        const insertQuery = `INSERT INTO core_attributes (userId, strength, agility, stamina, endurance, intelligence, strengthCap, agilityCap, staminaCap, enduranceCap, intelligenceCap, rank)
                 VALUES (?, 0, 0, 0, 0, 0, ?, ?, ?, ?, ?, ?)`;
        const initialRank = statCalc.calculateRank((user && user.level) || 1);
        db.run(insertQuery, [uid, defaultCaps.strengthCap, defaultCaps.agilityCap, defaultCaps.staminaCap, defaultCaps.enduranceCap, defaultCaps.intelligenceCap, initialRank], function (insErr) {
          if (insErr) return res.status(500).json({ error: insErr.message });
          // bumuo ng attrs object para magpatuloy ang flow
          attrs = Object.assign({ userId: uid, strength: 0, agility: 0, stamina: 0, endurance: 0, intelligence: 0 }, defaultCaps, { rank: 'D' });

          // magpatuloy para i-update ang attribute at gumastos ng points sa ibaba
          const newValue = (Number(attrs[attribute]) || 0) + spendAmount;
          
          // Ipataw ang hard cap ng 100
          if (newValue > statCalc.ATTRIBUTE_HARD_CAP) {
            return res.status(400).json({ error: `attribute ${attribute} cannot exceed ${statCalc.ATTRIBUTE_HARD_CAP}` });
          }
          
          const newUnspent = availablePoints - spendAmount;

          const milestones = [10, 20, 30, 40, 50];
          const currentMilestone = Math.floor((Number(attrs[attribute]) || 0) / 10) * 10;
          const newMilestone = Math.floor(newValue / 10) * 10;
          const unlockedMilestone = newMilestone > currentMilestone ? newMilestone : null;

          const updateQuery = `UPDATE core_attributes SET ${attribute} = ? WHERE userId = ?`;
          db.run(updateQuery, [newValue, uid], (updateErr) => {
            if (updateErr) return res.status(500).json({ error: updateErr.message });

            db.run(`UPDATE users SET unspent_stat_points = ? WHERE id = ?`, [newUnspent, uid], (deductErr) => {
              if (deductErr) return res.status(500).json({ error: deductErr.message });

              // I-recalculate ang rank base sa total stats
              db.get(`SELECT strength, agility, stamina, endurance, intelligence FROM core_attributes WHERE userId = ?`, [uid], (rankErr, updatedAttrs) => {
                if (!rankErr && updatedAttrs) {
                  // Ang rank ay level-based na ngayon; gamitin ang user's level kaysa sa attribute totals
                  const newRank = statCalc.calculateRank((user && user.level) || 1);
                  db.run(`UPDATE core_attributes SET rank = ? WHERE userId = ?`, [newRank, uid], (rankUpdateErr) => {
                    if (rankUpdateErr) console.error('Rank update error:', rankUpdateErr.message);
                  });
                }
              });

              if (unlockedMilestone) {
                const badgeId = `${attribute}_${unlockedMilestone}`;
                const badgeName = `${attribute.charAt(0).toUpperCase() + attribute.slice(1)} Master (${unlockedMilestone})`;
                const borderId = `border_${attribute}_${unlockedMilestone}`;
                const borderName = `${attribute.charAt(0).toUpperCase() + attribute.slice(1)} Border ${unlockedMilestone}`;

                db.run(
                  `INSERT OR IGNORE INTO unlocked_badges (userId, badge_id, badge_name) VALUES (?, ?, ?)`,
                  [uid, badgeId, badgeName],
                  (badgeErr) => {
                    if (badgeErr) console.error('Badge unlock error:', badgeErr.message);
                  }
                );

                db.run(
                  `INSERT OR IGNORE INTO unlocked_borders (userId, border_id, border_name) VALUES (?, ?, ?)`,
                  [uid, borderId, borderName],
                  (borderErr) => {
                    if (borderErr) console.error('Border unlock error:', borderErr.message);
                  }
                );

                // i-emit ang socket event kung available
                try {
                  io && io.to(`user_${uid}`).emit('stat_milestone', { userId: uid, attribute, milestone: unlockedMilestone, badge_name: badgeName, border_name: borderName });
                } catch (emitErr) {}
              }

              // tumugon na may updated values
              return res.json({ attribute, newValue, unspentPoints: newUnspent, unlockedMilestone: unlockedMilestone || null, badgeName: unlockedMilestone ? `${attribute.charAt(0).toUpperCase() + attribute.slice(1)} Master (${unlockedMilestone})` : null, borderName: unlockedMilestone ? `${attribute.charAt(0).toUpperCase() + attribute.slice(1)} Border ${unlockedMilestone}` : null });
            });
          });
        });
        return;
      }

      // Update attribute and spend points
      const newValue = (Number(attrs[attribute]) || 0) + spendAmount;
      
      // Enforce hard cap of 100
      if (newValue > statCalc.ATTRIBUTE_HARD_CAP) {
        return res.status(400).json({ error: `attribute ${attribute} cannot exceed ${statCalc.ATTRIBUTE_HARD_CAP}` });
      }
      
      const newUnspent = availablePoints - spendAmount;

      // Suriin kung kami ay tumama sa anumang milestone thresholds (10, 20, 30, etc.)
      const milestones = [10, 20, 30, 40, 50];
      const currentMilestone = Math.floor((Number(attrs[attribute]) || 0) / 10) * 10;
      const newMilestone = Math.floor(newValue / 10) * 10;
      const unlockedMilestone = newMilestone > currentMilestone ? newMilestone : null;

      // I-update ang core_attributes
      const updateFields = [attribute, newValue, uid];
      const updateQuery = `UPDATE core_attributes SET ${attribute} = ? WHERE userId = ?`;

      db.run(updateQuery, [newValue, uid], (updateErr) => {
        if (updateErr) return res.status(500).json({ error: updateErr.message });

        // I-deduct ang stat points mula sa user
        db.run(`UPDATE users SET unspent_stat_points = ? WHERE id = ?`, [newUnspent, uid], (deductErr) => {
          if (deductErr) return res.status(500).json({ error: deductErr.message });

          // I-recalculate ang rank base sa total stats
          db.get(`SELECT strength, agility, stamina, endurance, intelligence FROM core_attributes WHERE userId = ?`, [uid], (rankErr, updatedAttrs) => {
            if (!rankErr && updatedAttrs) {
              // Ang rank ay level-based na ngayon; gamitin ang user's level kaysa sa attribute totals
              const newRank = statCalc.calculateRank((user && user.level) || 1);
              db.run(`UPDATE core_attributes SET rank = ? WHERE userId = ?`, [newRank, uid], (rankUpdateErr) => {
                if (rankUpdateErr) console.error('Rank update error:', rankUpdateErr.message);
              });
            }
          });

          // Harapin ang milestone unlocks
          if (unlockedMilestone) {
            const badgeId = `${attribute}_${unlockedMilestone}`;
            const badgeName = `${attribute.charAt(0).toUpperCase() + attribute.slice(1)} Master (${unlockedMilestone})`;
            const borderId = `border_${attribute}_${unlockedMilestone}`;
            const borderName = `${attribute.charAt(0).toUpperCase() + attribute.slice(1)} Border ${unlockedMilestone}`;

            // Subukan na unlock ang badge
            db.run(
              `INSERT OR IGNORE INTO unlocked_badges (userId, badge_id, badge_name) VALUES (?, ?, ?)`,
              [uid, badgeId, badgeName],
              (badgeErr) => {
                if (badgeErr) console.error('Badge unlock error:', badgeErr.message);
              }
            );

            // Subukan na unlock ang border
            db.run(
              `INSERT OR IGNORE INTO unlocked_borders (userId, border_id, border_name) VALUES (?, ?, ?)`,
              [uid, borderId, borderName],
              (borderErr) => {
                if (borderErr) console.error('Border unlock error:', borderErr.message);
              }
            );

            // I-emit ang milestone event sa chat clients
            try {
              io.emit('stat_milestone', { userId: uid, attribute, milestone: unlockedMilestone, badgeName, borderName });
            } catch (e) {
              console.error('Failed to emit stat_milestone:', e.message);
            }
          }

          res.json({
            message: 'stat point spent',
            attribute,
            newValue,
            unspentPoints: newUnspent,
            unlockedMilestone,
          });
        });
      });
    });
  });
});

// Reset stats (7-day cooldown)
app.post('/api/stats/reset', authMiddleware, (req, res) => {
  const uid = req.user.id;

  db.get(`SELECT unspent_stat_points, last_reset_date FROM users WHERE id = ?`, [uid], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'user not found' });

    const lastReset = user.last_reset_date ? new Date(user.last_reset_date) : null;
    const now = new Date();
    const daysSinceReset = lastReset ? Math.floor((now - lastReset) / (1000 * 60 * 60 * 24)) : 9999;

    if (daysSinceReset < 7) {
      const daysRemaining = 7 - daysSinceReset;
      return res.status(400).json({ error: `reset on cooldown. try again in ${daysRemaining} days.` });
    }

    // Get current attributes and base stats
    db.get(`SELECT strength, agility, stamina, endurance, intelligence, base_strength, base_agility, base_stamina, base_endurance, base_intelligence FROM core_attributes WHERE userId = ?`, [uid], (caErr, attrs) => {
      if (caErr) return res.status(500).json({ error: caErr.message });

      // Handle legacy users: if base stats are all 0, set them to current stats (first reset migration)
      const baseStrength = Number(attrs?.base_strength || 0);
      const baseAgility = Number(attrs?.base_agility || 0);
      const baseStamina = Number(attrs?.base_stamina || 0);
      const baseEndurance = Number(attrs?.base_endurance || 0);
      const baseIntelligence = Number(attrs?.base_intelligence || 0);
      
      const baseTotalIsZero = baseStrength === 0 && baseAgility === 0 && baseStamina === 0 && baseEndurance === 0 && baseIntelligence === 0;
      
      // If base stats are all zero but current stats are not, this is a legacy user - use current as base
      const currentStrength = Number(attrs?.strength || 0);
      const currentAgility = Number(attrs?.agility || 0);
      const currentStamina = Number(attrs?.stamina || 0);
      const currentEndurance = Number(attrs?.endurance || 0);
      const currentIntelligence = Number(attrs?.intelligence || 0);
      
      const currentTotalIsZero = currentStrength === 0 && currentAgility === 0 && currentStamina === 0 && currentEndurance === 0 && currentIntelligence === 0;
      
      let finalBaseStrength = baseStrength;
      let finalBaseAgility = baseAgility;
      let finalBaseStamina = baseStamina;
      let finalBaseEndurance = baseEndurance;
      let finalBaseIntelligence = baseIntelligence;
      
      // For legacy users (base all 0, current not all 0), treat current as base
      if (baseTotalIsZero && !currentTotalIsZero) {
        finalBaseStrength = currentStrength;
        finalBaseAgility = currentAgility;
        finalBaseStamina = currentStamina;
        finalBaseEndurance = currentEndurance;
        finalBaseIntelligence = currentIntelligence;
      }

      // Calculate total spent (current - base)
      const currentTotal = currentStrength + currentAgility + currentStamina + currentEndurance + currentIntelligence;
      const baseTotal = finalBaseStrength + finalBaseAgility + finalBaseStamina + finalBaseEndurance + finalBaseIntelligence;
      const totalSpent = currentTotal - baseTotal;
      const returnedPoints = (user.unspent_stat_points || 0) + totalSpent;

      // Reset all attributes to base stats, and ensure base stats are set for legacy users
      db.run(
        `UPDATE core_attributes SET strength = ?, agility = ?, stamina = ?, endurance = ?, intelligence = ?, base_strength = ?, base_agility = ?, base_stamina = ?, base_endurance = ?, base_intelligence = ? WHERE userId = ?`,
        [finalBaseStrength, finalBaseAgility, finalBaseStamina, finalBaseEndurance, finalBaseIntelligence, finalBaseStrength, finalBaseAgility, finalBaseStamina, finalBaseEndurance, finalBaseIntelligence, uid],
        (resetErr) => {
          if (resetErr) return res.status(500).json({ error: resetErr.message });

          // I-update ang user: ibalik ang points at i-set ang cooldown date
          db.run(
            `UPDATE users SET unspent_stat_points = ?, last_reset_date = ? WHERE id = ?`,
            [returnedPoints, now.toISOString(), uid],
            (updateErr) => {
              if (updateErr) return res.status(500).json({ error: updateErr.message });

              res.json({
                message: 'stats reset successfully',
                returnedPoints,
                nextResetDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              });
            }
          );
        }
      );
    });
  });
});

// Mga Quest
// Quest pool: kasama ang optional `instructions` at `media` metadata (hindi i-persist sa DB),
// ang frontend ay gagamitin ang mga fields na ito kapag present para ipakita ang GIFs/videos at i-clear ang exercise steps.
const QUEST_POOL = [
  {
    title: "Morning Run",
    description: "Start your day with a 20-minute light run.",
    baseReps: 5,
    baseDuration: 20,
    quote: "A mile a day keeps the fatigue away.",
    instructions: "Warm up 3-5 minutes. Run at an easy conversational pace for the duration. Cool down and stretch after.",
    mediaType: "gif",
    mediaUrl: "https://media.giphy.com/media/l0MYEqEzwMWFCg8rm/giphy.gif",
  },
  {
    title: "Strength Training",
    description: "A focused strength session to build muscle and power.",
    baseReps: 15,
    baseDuration: 30,
    quote: "Strength comes from overcoming what you thought you couldn't.",
    instructions: "Perform 3 sets of compound movements (squats, push-ups, rows). Rest 60-90s between sets.",
    mediaType: "video",
    mediaUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
  },
  {
    title: "Cardio Blast",
    description: "Short, intense cardio session to increase heart rate.",
    baseReps: 20,
    baseDuration: 25,
    quote: "You can't win if you don't try.",
    instructions: "Alternate 1 minute hard effort with 1 minute easy recovery. Repeat until duration completes.",
    mediaType: "gif",
    mediaUrl: "https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif",
  },
  {
    title: "Flexibility & Stretch",
    description: "Improve your range of motion with guided stretches.",
    baseReps: 10,
    baseDuration: 15,
    quote: "Flexibility is the foundation of fitness.",
    instructions: "Hold each major muscle group stretch for 30-45s. Focus on breath and control.",
    mediaType: "gif",
    mediaUrl: "https://media.giphy.com/media/3o6Zt6ML6BklcajjsA/giphy.gif",
  },
  {
    title: "HIIT Workout",
    description: "High intensity intervals to build conditioning.",
    baseReps: 30,
    baseDuration: 20,
    quote: "The pain today is the strength tomorrow.",
    instructions: "20s all-out effort followed by 40s rest. Repeat intervals and scale intensity as needed.",
    mediaType: "gif",
    mediaUrl: "https://media.giphy.com/media/xT0GqssRweIhlz209i/giphy.gif",
  },
];

app.get("/api/quests/today/:userId", authMiddleware, (req, res) => {
  const uid = parseInt(req.params.userId);
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const weekday = now.getDay(); // 0 = Sun, 6 = Sat

  // Kung Saturday, ibalik ang rest day (huwag lumikha ng quest)
  if (weekday === 6) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return res.json({ quest: null, nextUnlock: tomorrow.getTime(), restDay: true });
  }

  db.get(
    `SELECT q.*, u.level, u.xp FROM quests q 
     JOIN users u ON q.userId = u.id 
     WHERE q.userId = ? AND q.questDate = ?`,
    [uid, today],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });

      if (!row) {
        // Deterministic rotation base sa day index at user id para masiguro ang iba't ibang quest araw-araw.
        const dayIndex = Math.floor(new Date(today).getTime() / 86400000);
        const poolIndex = (dayIndex + uid) % QUEST_POOL.length;
        const poolQuest = QUEST_POOL[poolIndex];

        db.run(
          `INSERT INTO quests (userId, title, description, baseReps, baseDuration, questDate, quote) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [uid, poolQuest.title, poolQuest.description, poolQuest.baseReps, poolQuest.baseDuration, today, poolQuest.quote],
          function(err2) {
            if (err2) return res.status(500).json({ error: err2.message });

            db.get(
              `SELECT q.*, u.level, u.xp FROM quests q 
               JOIN users u ON q.userId = u.id 
               WHERE q.id = ?`,
              [this.lastID],
              (err3, newRow) => {
                if (err3) return res.status(500).json({ error: err3.message });

                const tomorrow = new Date(now);
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(0, 0, 0, 0);

                // Mag-attach ng non-persistent metadata (instructions, media) sa response.
                const responseQuest = Object.assign({}, newRow, {
                  instructions: poolQuest.instructions,
                  mediaType: poolQuest.mediaType,
                  mediaUrl: poolQuest.mediaUrl,
                  completedToday: false, // New quest, not completed yet
                });

                res.json({ quest: responseQuest, nextUnlock: tomorrow.getTime() });
              }
            );
          }
        );
      } else {
        // Tiyaking ang response ay may kasamang metadata sa pamamagitan ng pag-compute ng today's pool index.
        const dayIndex = Math.floor(new Date(today).getTime() / 86400000);
        const poolIndex = (dayIndex + uid) % QUEST_POOL.length;
        const poolQuest = QUEST_POOL[poolIndex];

        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const responseQuest = Object.assign({}, row, {
          instructions: poolQuest.instructions,
          mediaType: poolQuest.mediaType,
          mediaUrl: poolQuest.mediaUrl,
          completedToday: row?.completed === 1 || row?.completed === true, // Check if already completed
        });

        res.json({ quest: responseQuest, nextUnlock: tomorrow.getTime() });
      }
    }
  );
});

app.put("/api/quests/update/:userId", authMiddleware, (req, res) => {
  const uid = parseInt(req.params.userId);
  const { questId, title, description, baseReps, baseDuration } = req.body;
  
  db.run(
    `UPDATE quests SET title = ?, description = ?, baseReps = ?, baseDuration = ? 
     WHERE id = ? AND userId = ?`,
    [title, description, baseReps, baseDuration, questId, uid],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: "quest not found" });
      res.json({ message: "quest updated" });
    }
  );
});

app.post("/api/quests/complete/:userId", authMiddleware, (req, res) => {
  const uid = parseInt(req.params.userId);
  const { questId } = req.body;
  
  db.run(
    `UPDATE quests SET completed = 1, completedAt = CURRENT_TIMESTAMP 
     WHERE id = ? AND userId = ?`,
    [questId, uid],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: "quest not found" });
      
      // Gamitin ang statCalc handler para mag-apply ng XP at suriin ang level up
      statCalc.handleAddXp(db, uid, 50, (xpErr, result) => {
        if (xpErr) console.error('Failed to apply quest XP:', xpErr);
        // ibalik ang success anuman ang internal xp application
        res.json({ message: "quest completed! +50 xp", xpResult: result || null });
      });
    }
  );
});

// Socket.io Chat
io.on("connection", (socket) => {
  socket.on("send_message", (data) => {
    db.run(
      `INSERT INTO messages (senderId, senderName, content) VALUES (?, ?, ?)`,
      [data.senderId || null, data.senderName || "anon", data.content],
      function(err) {
        if (err) return console.error(err);
        const msg = {
          id: this.lastID,
          senderId: data.senderId,
          senderName: data.senderName,
          content: data.content,
          createdAt: new Date().toISOString()
        };
        io.emit("new_message", msg);
      }
    );
  });

  socket.on("disconnect", () => {
    // user ay nag-disconnect
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
