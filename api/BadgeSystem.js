// Badge system for achievements

const BADGES = {
  'First Steps': {
    id: 'first_steps',
    icon: '👣',
    description: 'Complete your first quest',
    category: 'Quest Milestone',
    categoryIcon: '⚔️',
    condition: (user) => user.questsCompleted >= 1,
  },
  'Quest Master': {
    id: 'quest_master',
    icon: '⚔️',
    description: 'Complete 10 quests',
    category: 'Quest Milestone',
    categoryIcon: '⚔️',
    condition: (user) => user.questsCompleted >= 10,
  },
  'Legend in Making': {
    id: 'legend_making',
    icon: '⭐',
    description: 'Complete 50 quests',
    category: 'Quest Milestone',
    categoryIcon: '⚔️',
    condition: (user) => user.questsCompleted >= 50,
  },
  'Rising Star': {
    id: 'rising_star',
    icon: '✨',
    description: 'Reach level 5',
    category: 'Level Achievement',
    categoryIcon: '📈',
    condition: (user) => user.level >= 5,
  },
  'Pinnacle Warrior': {
    id: 'pinnacle',
    icon: '👑',
    description: 'Reach level 20',
    category: 'Level Achievement',
    categoryIcon: '📈',
    condition: (user) => user.level >= 20,
  },
  'Rank D': {
    id: 'rank_d',
    icon: '🔰',
    description: 'Achieved Rank D',
    category: 'Rank Progression',
    categoryIcon: '📊',
    condition: (user) => ['D', 'C', 'B', 'A', 'S'].includes(user.rank),
  },
  'Rank C': {
    id: 'rank_c',
    icon: '🥉',
    description: 'Achieved Rank C',
    category: 'Rank Progression',
    categoryIcon: '📊',
    condition: (user) => ['C', 'B', 'A', 'S'].includes(user.rank),
  },
  'Rank B': {
    id: 'rank_b',
    icon: '🥈',
    description: 'Achieved Rank B',
    category: 'Rank Progression',
    categoryIcon: '📊',
    condition: (user) => ['B', 'A', 'S'].includes(user.rank),
  },
  'Rank A': {
    id: 'rank_a',
    icon: '🥇',
    description: 'Achieved Rank A',
    category: 'Rank Progression',
    categoryIcon: '📊',
    condition: (user) => ['A', 'S'].includes(user.rank),
  },
  'Rank S': {
    id: 'rank_s',
    icon: '💎',
    description: 'Achieved Rank S - Legendary status',
    category: 'Rank Progression',
    categoryIcon: '📊',
    condition: (user) => user.rank === 'S',
  },
  'Week Warrior': {
    id: 'week_warrior',
    icon: '🔥',
    description: 'Maintain a 7-day streak',
    category: 'Streak Reward',
    categoryIcon: '🎯',
    condition: (user) => user.streak >= 7,
  },
  'Month Marathon': {
    id: 'month_marathon',
    icon: '🌟',
    description: 'Maintain a 30-day streak',
    category: 'Streak Reward',
    categoryIcon: '🎯',
    condition: (user) => user.streak >= 30,
  },
  'Strong Soul': {
    id: 'strong_soul',
    icon: '💪',
    description: 'Strength stat reaches 20',
    category: 'Stat Achievement',
    categoryIcon: '💥',
    condition: (user, attrs) => attrs?.strength >= 20,
  },
  'Swift Thinker': {
    id: 'swift_thinker',
    icon: '⚡',
    description: 'Agility stat reaches 20',
    category: 'Stat Achievement',
    categoryIcon: '💥',
    condition: (user, attrs) => attrs?.agility >= 20,
  },
  'Unstoppable': {
    id: 'unstoppable',
    icon: '🚀',
    description: 'Stamina stat reaches 20',
    category: 'Stat Achievement',
    categoryIcon: '💥',
    condition: (user, attrs) => attrs?.stamina >= 20,
  },
  'Ironclad': {
    id: 'ironclad',
    icon: '🛡️',
    description: 'Endurance stat reaches 20',
    category: 'Stat Achievement',
    categoryIcon: '💥',
    condition: (user, attrs) => attrs?.endurance >= 20,
  },
  'Sage': {
    id: 'sage',
    icon: '🧠',
    description: 'Intelligence stat reaches 20',
    category: 'Stat Achievement',
    categoryIcon: '💥',
    condition: (user, attrs) => attrs?.intelligence >= 20,
  },
};

const checkAndUnlockBadges = (user, attributes) => {
  const badgeIds = [];

  Object.entries(BADGES).forEach(([badgeName, badgeData]) => {
    if (badgeData.condition(user, attributes)) {
      badgeIds.push(badgeData.id);
    }
  });

  return badgeIds;
};

const getBadgeData = (badgeId) => {
  for (const [name, data] of Object.entries(BADGES)) {
    if (data.id === badgeId) {
      return { name, ...data };
    }
  }
  return null;
};

module.exports = {
  BADGES,
  checkAndUnlockBadges,
  getBadgeData,
};
