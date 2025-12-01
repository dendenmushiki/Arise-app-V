/**
 * Awakening Assessment Utilities
 * Calculates core attributes and rank from quiz responses
 */

/**
 * Quiz questions for the Awakening Assessment
 */
export const AWAKENING_QUESTIONS = [
  {
    id: 1,
    text: "How often do you exercise per week?",
    type: "select",
    options: [
      { value: 1, label: "Never or rarely", attribute: "stamina" },
      { value: 2, label: "1-2 times", attribute: "stamina" },
      { value: 3, label: "3-4 times", attribute: "stamina" },
      { value: 4, label: "5+ times", attribute: "stamina" },
    ],
  },
  {
    id: 2,
    text: "How many steps do you typically take per day?",
    type: "select",
    options: [
      { value: 1, label: "Less than 5,000", attribute: "agility" },
      { value: 2, label: "5,000 - 8,000", attribute: "agility" },
      { value: 3, label: "8,000 - 12,000", attribute: "agility" },
      { value: 4, label: "More than 12,000", attribute: "agility" },
    ],
  },
  {
    id: 3,
    text: "How many push-ups can you do in one set?",
    type: "select",
    options: [
      { value: 1, label: "0-5", attribute: "strength" },
      { value: 2, label: "6-15", attribute: "strength" },
      { value: 3, label: "16-30", attribute: "strength" },
      { value: 4, label: "30+", attribute: "strength" },
    ],
  },
  {
    id: 4,
    text: "How long can you hold a plank?",
    type: "select",
    options: [
      { value: 1, label: "Less than 30 seconds", attribute: "endurance" },
      { value: 2, label: "30 - 60 seconds", attribute: "endurance" },
      { value: 3, label: "60 - 120 seconds", attribute: "endurance" },
      { value: 4, label: "More than 2 minutes", attribute: "endurance" },
    ],
  },
  {
    id: 5,
    text: "How many hours of sleep do you get per night?",
    type: "select",
    options: [
      { value: 1, label: "Less than 5 hours", attribute: "intelligence" },
      { value: 2, label: "5 - 6 hours", attribute: "intelligence" },
      { value: 3, label: "6 - 7 hours", attribute: "intelligence" },
      { value: 4, label: "7+ hours", attribute: "intelligence" },
    ],
  },
  {
    id: 6,
    text: "How well do you recover after intense training?",
    type: "select",
    options: [
      { value: 1, label: "Very sore for days", attribute: "strength" },
      { value: 2, label: "Sore for 1-2 days", attribute: "strength" },
      { value: 3, label: "Minor soreness next day", attribute: "strength" },
      { value: 4, label: "Recovery within hours", attribute: "strength" },
    ],
  },
  {
    id: 7,
    text: "How would you describe your mental focus during workouts?",
    type: "select",
    options: [
      { value: 1, label: "Easily distracted", attribute: "intelligence" },
      { value: 2, label: "Somewhat focused", attribute: "intelligence" },
      { value: 3, label: "Very focused", attribute: "intelligence" },
      { value: 4, label: "Completely locked in", attribute: "intelligence" },
    ],
  },
  {
    id: 8,
    text: "How quickly can you change direction or react?",
    type: "select",
    options: [
      { value: 1, label: "Slow, sluggish movements", attribute: "agility" },
      { value: 2, label: "Average speed", attribute: "agility" },
      { value: 3, label: "Quick movements", attribute: "agility" },
      { value: 4, label: "Very fast and nimble", attribute: "agility" },
    ],
  },
  {
    id: 9,
    text: "How long can you sustain cardio activity?",
    type: "select",
    options: [
      { value: 1, label: "Less than 10 minutes", attribute: "stamina" },
      { value: 2, label: "10 - 20 minutes", attribute: "stamina" },
      { value: 3, label: "20 - 40 minutes", attribute: "stamina" },
      { value: 4, label: "40+ minutes", attribute: "stamina" },
    ],
  },
  {
    id: 10,
    text: "How would you rate your overall fitness level?",
    type: "select",
    options: [
      { value: 1, label: "Beginner / Out of shape", attribute: "endurance" },
      { value: 2, label: "Below average", attribute: "endurance" },
      { value: 3, label: "Average", attribute: "endurance" },
      { value: 4, label: "Above average / Fit", attribute: "endurance" },
    ],
  },
];

/**
 * Calculate core attributes from quiz responses
 * Returns an object with strength, agility, stamina, endurance, intelligence (1-10 scale)
 */
export function calculateCoreAttributes(answers) {
  const attributes = {
    strength: 0,
    agility: 0,
    stamina: 0,
    endurance: 0,
    intelligence: 0,
  };

  const attributeCounts = {
    strength: 0,
    agility: 0,
    stamina: 0,
    endurance: 0,
    intelligence: 0,
  };

  // Aggregate scores by attribute
  answers.forEach((answer) => {
    const question = AWAKENING_QUESTIONS.find((q) => q.id === answer.questionId);
    if (question) {
      const selectedOption = question.options.find(
        (opt) => opt.value === answer.selectedValue
      );
      if (selectedOption) {
        const attribute = selectedOption.attribute;
        attributes[attribute] += selectedOption.value;
        attributeCounts[attribute]++;
      }
    }
  });

  // Average the scores and scale to 1-10 (beginner-friendly: 2-6 range)
  const finalAttributes = {};
  for (const [key, value] of Object.entries(attributes)) {
    const count = attributeCounts[key] || 1;
    const average = Math.ceil((value / count) * 2); // Scale from 1-4 to 2-8 range, then ceil
    finalAttributes[key] = Math.min(Math.max(average, 1), 6); // Cap at 6 for beginners
  }

  return finalAttributes;
}

/**
 * Calculate rank from core attributes
 * Returns one of: D, C, B, A, S
 * New users max out at low B
 */
export function calculateRank(attributes) {
  const sum =
    attributes.strength +
    attributes.agility +
    attributes.stamina +
    attributes.endurance +
    attributes.intelligence;

  const average = sum / 5;

  // Rank scaling (new users max at B)
  if (average < 1.5) return "D";
  if (average < 2.5) return "D";
  if (average < 3.5) return "C";
  if (average < 4.5) return "C";
  if (average < 5.5) return "B"; // New user max
  if (average < 6.5) return "B";
  // A and S are unreachable for new users
  return "C"; // Fallback
}

/**
 * Get rank color and styling
 */
export function getRankStyle(rank) {
  const styles = {
    D: {
      color: "#8b7355",
      bgColor: "#3d3428",
      label: "D",
      name: "Novice",
    },
    C: {
      color: "#60a5fa",
      bgColor: "#1e3a8a",
      label: "C",
      name: "Apprentice",
    },
    B: {
      color: "#818cf8",
      bgColor: "#3730a3",
      label: "B",
      name: "Warrior",
    },
    A: {
      color: "#fbbf24",
      bgColor: "#78350f",
      label: "A",
      name: "Legend",
    },
    S: {
      color: "#ef4444",
      bgColor: "#7f1d1d",
      label: "S",
      name: "Mythic",
    },
  };
  return styles[rank] || styles.C;
}
