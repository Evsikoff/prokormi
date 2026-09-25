import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'vite';

// Vite resolves the JSON imports used by the game's state modules.
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
test.after(() => vite.close());
const { activityProgress } = await vite.ssrLoadModule('/progress-overview.js');
const {
  ADDITIONAL_TASK_COMPLETED_EVENT,
  DAY_NUMBER_FIELD,
  ECONOMIC_EPISODE_COMPLETED_EVENT,
  FEEDING_EVENT,
  NEW_DAY_EVENT,
} = await vite.ssrLoadModule('/room-state.js');

const rows = [
  { object_type: 'Economic episode', id: 1, title: 'Сегодня', game_day: 2, trigger: 'The monster is full' },
  { object_type: 'Economic episode', id: 1, title: 'Дубликат', game_day: 2, trigger: 'The monster is full' },
  { object_type: 'Economic episode', id: 2, title: 'Позже', game_day: 3, trigger: 'Start of the day' },
  { object_type: 'Economic episode', id: 3, title: 'Пройдено', game_day: 1, trigger: 'Start of the day' },
  { object_type: 'Additional task', id: 11, title: 'Уже открыто', day_is_it_available: 1, trigger: 'End of the economic episode id = 3' },
  { object_type: 'Additional task', id: 11, title: 'Дубликат', day_is_it_available: 1, trigger: 'End of the economic episode id = 3' },
  { object_type: 'Additional task', id: 12, title: 'Позже', day_is_it_available: 3, trigger: null },
];

const records = [
  { 'Тип события': NEW_DAY_EVENT, [DAY_NUMBER_FIELD]: 1 },
  { 'Тип события': NEW_DAY_EVENT, [DAY_NUMBER_FIELD]: 2 },
  { 'Тип события': ECONOMIC_EPISODE_COMPLETED_EVENT, 'Идентификатор эпизода': 3 },
];

test('counts distinct DataMart activities against the current day and trigger state', () => {
  assert.deepEqual(activityProgress(rows, records), {
    day: 2,
    // Plus five built-in episodes: the first budget and the food store are open by day 2.
    economicEpisodes: { total: 8, completed: 1, remaining: 7, availableNow: 2, future: 4 },
    additionalTasks: { total: 2, completed: 0, remaining: 2, availableNow: 1, future: 1 },
  });

  assert.deepEqual(activityProgress(rows, [...records, { 'Тип события': FEEDING_EVENT }]).economicEpisodes, {
    total: 8, completed: 1, remaining: 7, availableNow: 3, future: 4,
  });
});

test('completed task is counted once and no longer available', () => {
  const result = activityProgress(rows, [
    ...records,
    { 'Тип события': ADDITIONAL_TASK_COMPLETED_EVENT, 'Идентификатор задания': 11 },
  ]);
  assert.deepEqual(result.additionalTasks, {
    total: 2, completed: 1, remaining: 1, availableNow: 0, future: 1,
  });
});

test('an unfinished past episode is not presented as a future day', () => {
  const pastRows = [{ object_type: 'Economic episode', id: 19, title: 'Прошедший день', game_day: 1, trigger: 'Start of the day' }];
  assert.deepEqual(activityProgress(pastRows, records).economicEpisodes, {
    total: 6, completed: 0, remaining: 6, availableNow: 2, future: 3,
  });
});

test('the real data mart has eleven economic episodes, built-in ones counted by their records', async () => {
  const { default: dataMartRows } = await vite.ssrLoadModule('/monster_data_mart_rows.json');
  const { BUDGET_PLAN_EVENT, FOOD_PURCHASE_EVENT, GOODS_PURCHASE_EVENT } = await vite.ssrLoadModule('/room-state.js');
  const day = (number) => ({ 'Тип события': NEW_DAY_EVENT, [DAY_NUMBER_FIELD]: number });
  assert.equal(activityProgress(dataMartRows, []).economicEpisodes.total, 11);

  const played = [
    { 'Тип события': BUDGET_PLAN_EVENT }, day(1), { 'Тип события': FOOD_PURCHASE_EVENT }, day(2), day(3),
    // The spare cleaner bought in the repair episode does not finish the tech store.
    { 'Тип события': GOODS_PURCHASE_EVENT, 'Идентификатор эпизода': 352 },
  ];
  assert.equal(activityProgress(dataMartRows, played).economicEpisodes.completed, 2);
  assert.equal(activityProgress(dataMartRows, [...played, { 'Тип события': GOODS_PURCHASE_EVENT }, { 'Тип события': BUDGET_PLAN_EVENT }])
    .economicEpisodes.completed, 4);
});
