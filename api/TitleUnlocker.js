// Title progression system based on achievements and stats

const TITLES = {
  'Newly Awakened': {
    condition: () => true, // default, always available
    description: 'Welcome to your journey',
  },
  'Dungeon Explorer': {
    condition: (user) => user.questsCompleted >= 10,
    description: 'Completed 10 quests',
  },
  'Consistency Legend': {
    condition: (user) => user.streak >= 7,
    description: 'Maintained a 7-day streak',
  },
  'Iron Warrior': {
    condition: (user, attrs) => attrs?.strength >= 20,
    description: 'Strength stat reached 20',
  },
  'Speedster': {
    condition: (user, attrs) => attrs?.agility >= 20,
    description: 'Agility stat reached 20',
  },
  'Endurance Master': {
    condition: (user, attrs) => attrs?.endurance >= 20,
    description: 'Endurance stat reached 20',
  },
  'Intellect Scholar': {
    condition: (user, attrs) => attrs?.intelligence >= 20,
    description: 'Intelligence stat reached 20',
  },
  'Aspiring Champion': {
    condition: (user) => user.level >= 10,
    description: 'Reached level 10',
  },
  'Monarch Candidate': {
    condition: (user) => user.rank === 'A',
    description: 'Achieved Rank A',
  },
  'Uncrowned King': {
    condition: (user) => user.rank === 'S',
    description: 'Achieved Rank S',
  },
};

const checkAndUnlockTitles = (user, attributes) => {
  const unlockedTitles = [];

  Object.entries(TITLES).forEach(([titleName, titleData]) => {
    if (titleData.condition(user, attributes)) {
      unlockedTitles.push(titleName);
    }
  });

  // Return highest tier title that user qualifies for
  // Priority order: S-tier, A-tier, B-tier, C-tier, default
  const priorityOrder = [
    'Uncrowned King',
    'Monarch Candidate',
    'Aspiring Champion',
    'Consistency Legend',
    'Dungeon Explorer',
    'Iron Warrior',
    'Speedster',
    'Endurance Master',
    'Intellect Scholar',
    'Newly Awakened',
  ];

  for (const title of priorityOrder) {
    if (unlockedTitles.includes(title)) {
      return title;
    }
  }

  return 'Newly Awakened';
};

module.exports = {
  TITLES,
  checkAndUnlockTitles,
};
