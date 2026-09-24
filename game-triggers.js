import { FEEDING_MIN_GRAMS } from './room-state.js';

// Shared state predicates for every data-mart entity that names a `trigger`.
// Keeping the vocabulary in one place prevents messages, day gates and economic
// episodes from interpreting the same trigger differently.
export const GAME_TRIGGERS = {
  // Economic episodes with an exact `game_day` use this to open as soon as that day begins.
  'Start of the day': (state) => state.day > 0,
  'The monster is full': (state) => !state.hungry,
  // Clean again: on day 3 the monster starts dirty, so this waits for the ear cleaning.
  'A pure monster': (state) => !state.dirty,
  // Day 6 starts hungry and dirty (a hard day), so coach Max calls once both are sorted out.
  'The monster is clean and well-fed': (state) => !state.dirty && !state.hungry,
  // Day 5 ends once the player has been told about additional tasks; the task itself is optional.
  'End of the additional tasks tutorial': (state) => state.additionalTaskTutorialSeen,
  // The third budget runs from day 7 on, and day 7 opens its own additional task.
  'The beginning of the seventh day': (state) => state.day >= 7,
  // Day 9: the nose cleaner breaks the moment the player taps 🤧 on a dirty monster (episode 352).
  'An attempt to clean the monster': (state) => state.cleaningAttemptedToday,
  // Day 8 ends once the player has paid for toys at the checkout of the toy store.
  'A successful purchase at the toy store': (state) => state.toyStorePurchased,
  'A hungry monster and no food': (state) => state.hungry && state.foodGrams <= 0,
  'A hungry monster and enough food': (state) => state.hungry && state.suitableFoodGrams >= FEEDING_MIN_GRAMS,
};

// Triggers that name the data mart row they watch, so one pattern serves every row of its kind:
// «Acceptance or rejection of a Savings goal with id = 49» waits for the answer about goal 49.
const GAME_TRIGGER_PATTERNS = [
  {
    pattern: /^Acceptance or rejection of a Savings goal with id = (\d+)$/,
    build: (id) => (state) => state.decidedSavingsGoals.has(id),
  },
  {
    pattern: /^End of the economic episode id = (\d+)$/,
    build: (id) => (state) => state.completedEconomicEpisodes.has(id),
  },
];

// The predicate of the trigger, or null when the data mart names one this build does not know.
export function gameTrigger(trigger) {
  if (typeof GAME_TRIGGERS[trigger] === 'function') return GAME_TRIGGERS[trigger];
  for (const { pattern, build } of GAME_TRIGGER_PATTERNS) {
    const match = pattern.exec(String(trigger ?? ''));
    if (match) return build(match[1]);
  }
  return null;
}

export function hasGameTrigger(trigger) {
  return Boolean(gameTrigger(trigger));
}

export function isGameTriggerActive(trigger, state) {
  return Boolean(gameTrigger(trigger)?.(state));
}
