import { FEEDING_MIN_GRAMS } from './room-state.js';

// Shared state predicates for every data-mart entity that names a `trigger`.
// Keeping the vocabulary in one place prevents messages, day gates and economic
// episodes from interpreting the same trigger differently.
export const GAME_TRIGGERS = {
  'The monster is full': (state) => !state.hungry,
  'A hungry monster and no food': (state) => state.hungry && state.foodGrams <= 0,
  'A hungry monster and enough food': (state) => state.hungry && state.suitableFoodGrams >= FEEDING_MIN_GRAMS,
};

export function hasGameTrigger(trigger) {
  return typeof GAME_TRIGGERS[trigger] === 'function';
}

export function isGameTriggerActive(trigger, state) {
  return Boolean(GAME_TRIGGERS[trigger]?.(state));
}
