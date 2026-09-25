import { additionalTaskList, additionalTasks } from './additional-tasks.js';
import { dueEconomicEpisodes, economicEpisodes } from './economic-episodes.js';
import { approvedBudgetCount } from './budget.js';
import {
  deriveRoomState,
  FOOD_PURCHASE_EVENT,
  GOODS_PURCHASE_EVENT,
  TOY_PURCHASE_EVENT,
} from './room-state.js';

const hasRecord = (records, test) => records.some((record) => record && test(record));

// Economic episodes the game plays without an 'Economic episode' row: the first budget, the shops
// and the first plan-and-fact review. `day` is the game day they open on; the budget comes before day 1.
const BUILT_IN_EPISODES = [
  { id: 'first-budget', day: 0, done: (records) => approvedBudgetCount(records) >= 1 },
  { id: 'food-store', store: 'Магазин продуктов', day: 1,
    done: (records) => hasRecord(records, (record) => record['Тип события'] === FOOD_PURCHASE_EVENT) },
  { id: 'tech-store', store: 'Магазин техники', day: 3,
    // The spare cleaner of the repair episode is a purchase of its own, marked with the episode id.
    done: (records) => hasRecord(records, (record) => (
      record['Тип события'] === GOODS_PURCHASE_EVENT && record['Идентификатор эпизода'] == null
    )) },
  // The review at the end of day 3 always leads into the second budget.
  { id: 'first-budget-review', day: 3, done: (records) => approvedBudgetCount(records) >= 2 },
  { id: 'toy-store', store: 'Магазин игрушек', day: 8,
    done: (records) => hasRecord(records, (record) => record['Тип события'] === TOY_PURCHASE_EVENT) },
];

// A store's opening day comes from its data mart row when the row is there.
function builtInEpisodes(rows) {
  const stores = new Map((Array.isArray(rows) ? rows : [])
    .filter((row) => row?.object_type === 'Store')
    .map((row) => [row.title, row]));
  return BUILT_IN_EPISODES.map((episode) => ({
    ...episode,
    day: Number(stores.get(episode.store)?.day_is_it_available ?? episode.day),
  }));
}

function builtInProgress(rows, records, day) {
  const episodes = builtInEpisodes(rows);
  const completed = episodes.filter((episode) => episode.done(records)).length;
  const open = episodes.filter((episode) => !episode.done(records));
  const availableNow = open.filter((episode) => episode.day <= day).length;
  return {
    total: episodes.length,
    completed,
    remaining: episodes.length - completed,
    availableNow,
    future: open.length - availableNow,
  };
}

function sumProgress(left, right) {
  return Object.fromEntries(Object.keys(left).map((key) => [key, left[key] + right[key]]));
}

function uniqueById(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (item?.id == null) return false;
    const id = String(item.id);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function categoryProgress(items, completedIds, availableIds, dayField, day) {
  const completed = items.filter((item) => completedIds.has(String(item.id))).length;
  const remaining = items.length - completed;
  const availableNow = items.filter((item) => (
    !completedIds.has(String(item.id)) && availableIds.has(String(item.id))
  )).length;
  const future = items.filter((item) => (
    !completedIds.has(String(item.id)) && Number(item[dayField]) > day
  )).length;

  return {
    total: items.length,
    completed,
    remaining,
    availableNow,
    future,
  };
}

// Counts DataMart activities by distinct id, plus the built-in economic episodes. A completed record wins even when an item's
// scheduled day or trigger would otherwise make it unavailable.
export function activityProgress(rows, records) {
  const safeRecords = Array.isArray(records) ? records : [];
  const state = deriveRoomState(safeRecords);
  const episodes = uniqueById(economicEpisodes(rows).filter((item) => String(item.title || '').trim()));
  const tasks = uniqueById(additionalTasks(rows));
  const dueIds = new Set(dueEconomicEpisodes(episodes, safeRecords).map((item) => String(item.id)));
  const availableTaskIds = new Set(additionalTaskList(tasks, safeRecords).available.map((item) => String(item.id)));

  return {
    day: state.day,
    economicEpisodes: sumProgress(
      categoryProgress(episodes, state.completedEconomicEpisodes, dueIds, 'game_day', state.day),
      builtInProgress(rows, safeRecords, state.day),
    ),
    additionalTasks: categoryProgress(tasks, state.completedAdditionalTasks, availableTaskIds, 'day_is_it_available', state.day),
  };
}
