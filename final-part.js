import dataMartRows from './monster_data_mart_rows.json';
import {
  BUDGET_PLAN_EVENT,
  deriveRoomState,
  FEEDING_MIN_GRAMS,
  FOOD_PORTION_GRAMS,
  GOAL_PURCHASE_EVENT,
  pantryPacks,
  STAT_MIN,
} from './room-state.js';
import { acceptedSavingsGoals, boughtSavingsGoalIds } from './budget.js';
import { additionalTaskList } from './additional-tasks.js';
import { dueEconomicEpisodes } from './economic-episodes.js';
import { DEFAULT_SAVINGS_TARGET } from './repair-episode.js';

// The final part of the game begins after day 9: the budget of days 3–9 is reviewed, a briefing
// explains the new rules, the fourth budget is made, and from then on the days run by themselves.
// The monster eats and gets cleaned automatically; the run stops at every key event, and the player
// saves up for the big goals. This module holds the rules; the screens live in main.js.

// The budget whose approval starts the final part: it is made right after the final briefing.
export const FINAL_PART_BUDGET = 4;
export const FINAL_PART_START_EVENT = 'Начало финальной части игры';
export const FINAL_PART_REASON = 'Начало финальной части игры';
export const FINAL_BRIEFING_OBJECT_TYPE = 'Final part briefing';
export const FINAL_BRIEFING_SEEN_EVENT = 'Просмотр брифинга финальной части';
// Every automatic stop of the run: 'Ключ' says which one, so the same stop does not come back.
export const FINAL_STOP_EVENT = 'Остановка пересчёта дней';
export const GOAL_OFFER_EVENT = 'Предложение купить крупную цель';
export const FINAL_VICTORY_EVENT = 'Полная победа';
export const FINAL_DEFEAT_EVENT = 'Поражение';
export const SAVINGS_GOAL_OBJECT_TYPE = 'Savings goal';
// One step above defeat: the run stops so the player can still save the monster.
export const DANGER_LEVEL = STAT_MIN + 1;
export const DEFEAT_LEVEL = STAT_MIN;

const eventType = (record) => record?.['Тип события'];

export function isFinalPart(records) {
  return records.some((record) => eventType(record) === FINAL_PART_START_EVENT);
}

export function finalBriefingSteps(rows = dataMartRows) {
  return rows
    .filter((row) => row?.object_type === FINAL_BRIEFING_OBJECT_TYPE)
    .sort((left, right) => Number(left.queue) - Number(right.queue));
}

// Every big goal of the game, chosen by the player or not.
export function savingsGoalRows(rows = dataMartRows) {
  return rows
    .filter((row) => row?.object_type === SAVINGS_GOAL_OBJECT_TYPE && Number(row.price) > 0)
    .sort((left, right) => Number(left.price) - Number(right.price) || Number(left.id) - Number(right.id));
}

export function unboughtGoals(records, rows = dataMartRows) {
  const bought = boughtSavingsGoalIds(records);
  return savingsGoalRows(rows).filter((goal) => !bought.has(String(goal.id)));
}

// The goal cards the player has already paid for, in purchase order. The catalogue supplies the
// artwork needed to replay a celebration; the event remains the source of truth for its title and
// price so an old save still works if a row in the data mart is later renamed or removed.
export function boughtSavingsGoals(records, rows = dataMartRows) {
  const catalogue = new Map(savingsGoalRows(rows).map((goal) => [String(goal.id), goal]));
  const bought = new Map();
  for (const record of records) {
    if (eventType(record) !== GOAL_PURCHASE_EVENT) continue;
    const id = record['Идентификатор цели'];
    if (id == null) continue;
    const key = String(id);
    const row = catalogue.get(key);
    // Re-inserting keeps a duplicate legacy purchase at its latest position without showing it
    // twice in the room.
    bought.delete(key);
    bought.set(key, {
      ...(row ?? {}),
      id: row?.id ?? id,
      title: record['Название цели'] || row?.title || 'Цель',
      price: Number(record['Стоимость'] ?? row?.price) || 0,
    });
  }
  return [...bought.values()];
}

// The goals the piggy bank can pay for right now.
export function affordableGoals(records, rows = dataMartRows) {
  const { savings } = deriveRoomState(records);
  return unboughtGoals(records, rows).filter((goal) => Number(goal.price) <= savings);
}

// What the goals bought so far have cost: they count towards the default sum like the coins that
// are still in the piggy bank.
export function goalsSpent(records) {
  return records
    .filter((record) => eventType(record) === GOAL_PURCHASE_EVENT)
    .reduce((sum, record) => sum + (Number(record['Стоимость']) || 0), 0);
}

// The default sum of the final part as it stands: the goals bought plus the piggy bank.
export function savedInTotal(records) {
  return goalsSpent(records) + deriveRoomState(records).savings;
}

// What the player is saving up for: the goals they have accepted and not bought yet, or, without
// any, what the piggy bank still has to hold for the default sum once the goals bought are counted.
export function finalTarget(records) {
  const goals = acceptedSavingsGoals(records);
  if (!goals.length) {
    return { goals: [], total: Math.max(0, DEFAULT_SAVINGS_TARGET - goalsSpent(records)), isDefault: true };
  }
  return { goals, total: goals.reduce((sum, goal) => sum + goal.price, 0), isDefault: false };
}

// Full victory: every big goal is bought, or the goals bought and the piggy bank together make the
// default sum.
export function isFullVictory(records, rows = dataMartRows) {
  const goals = savingsGoalRows(rows);
  if (goals.length && !unboughtGoals(records, rows).length) return true;
  return savedInTotal(records) >= DEFAULT_SAVINGS_TARGET;
}

export function finalOutcome(records) {
  const last = records.filter((record) => [FINAL_VICTORY_EVENT, FINAL_DEFEAT_EVENT].includes(eventType(record))).at(-1);
  if (!last) return null;
  return eventType(last) === FINAL_VICTORY_EVENT ? 'victory' : 'defeat';
}

// The stats that have fallen to `level` or below, in the order of the HUD.
export function statsAtOrBelow(state, level) {
  return ['health', 'mood', 'development'].filter((key) => Number(state.stats[key]) <= level);
}

// What the automatic feeding pours: one portion of suitable food, open packs first, as the pantry
// shelf would offer them. `grams` is less than a portion when little is left, and the feeding
// only counts from FEEDING_MIN_GRAMS on.
export function autoFeedingPortion(inventory) {
  const taken = new Map();
  let grams = 0;
  for (const pack of pantryPacks(inventory)) {
    if (grams >= FOOD_PORTION_GRAMS) break;
    const take = Math.min(pack.grams, FOOD_PORTION_GRAMS - grams);
    taken.set(pack.item.id, (taken.get(pack.item.id) ?? 0) + take);
    grams += take;
  }
  return { taken, grams, enough: grams >= FEEDING_MIN_GRAMS };
}

function stopKeys(records) {
  return new Set(records.filter((record) => eventType(record) === FINAL_STOP_EVENT).map((record) => record['Ключ']));
}

function offeredGoalIds(records) {
  return new Set(records.filter((record) => eventType(record) === GOAL_OFFER_EVENT)
    .map((record) => String(record['Идентификатор цели'])));
}

// Whether the last day of the current budget is over: then the plan meets the fact and a new
// budget is made before the next day.
export function isBudgetDayOver(records, periodDays) {
  const { day } = deriveRoomState(records);
  const approved = records.filter((record) => eventType(record) === BUDGET_PLAN_EVENT).length;
  return approved > 0 && day === approved * periodDays;
}

// The first reason for the run to stop today, or null. Checked after the morning chores, in the
// order of importance; a stop that the player has seen once (its key is in the log) does not come
// back, except the ones that cannot be skipped: the victory and the end of a budget.
//   { kind: 'victory' }
//   { kind: 'goal', goal }                   the piggy bank can pay for a goal for the first time
//   { kind: 'food-out', key, grams }         nothing to feed the monster with this morning
//   { kind: 'danger', key, stat, value }     a stat has fallen to −2
//   { kind: 'food-low', key, grams }         the monster has eaten, but tomorrow there is not enough
//   { kind: 'task', key, task }              an additional task has opened
//   { kind: 'episode', key, episode }        an economic episode is due today
//   { kind: 'budget' }                       the budget's last day is over
export function nextFinalStop(records, { periodDays, rows = dataMartRows }) {
  const state = deriveRoomState(records);
  const seen = stopKeys(records);
  const day = state.day;
  const fresh = (stop) => (seen.has(stop.key) ? null : stop);

  if (isFullVictory(records, rows)) return { kind: 'victory' };

  const offered = offeredGoalIds(records);
  const goal = affordableGoals(records, rows).find((item) => !offered.has(String(item.id)));
  if (goal) return { kind: 'goal', goal };

  if (state.hungry) {
    const stop = fresh({ kind: 'food-out', key: `food-out:${day}`, grams: state.suitableFoodGrams });
    if (stop) return stop;
  }

  for (const stat of statsAtOrBelow(state, DANGER_LEVEL)) {
    const stop = fresh({ kind: 'danger', key: `danger:${stat}:${day}`, stat, value: state.stats[stat] });
    if (stop) return stop;
  }

  if (!state.hungry && state.suitableFoodGrams < FEEDING_MIN_GRAMS) {
    const stop = fresh({ kind: 'food-low', key: `food-low:${day}`, grams: state.suitableFoodGrams });
    if (stop) return stop;
  }

  for (const task of additionalTaskList(rows, records).available) {
    const stop = fresh({ kind: 'task', key: `task:${task.id}`, task });
    if (stop) return stop;
  }

  for (const episode of dueEconomicEpisodes(rows, records)) {
    const stop = fresh({ kind: 'episode', key: `episode:${episode.id}:${day}`, episode });
    if (stop) return stop;
  }

  if (isBudgetDayOver(records, periodDays)) return { kind: 'budget' };
  return null;
}
