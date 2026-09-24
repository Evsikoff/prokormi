// The jury panel: every data mart object grouped by its type, and a sandbox profile in which
// the jury can play any economic episode or additional task without touching a player's log.
import {
  CLEANING_ATTEMPT_EVENT,
  DAY_NUMBER_FIELD,
  DIRTY,
  FEEDING_EVENT,
  HYGIENE_STATE,
  INVENTORY_CHANGE_EVENT,
  MONSTER_CREATED_EVENT,
  MONSTER_STATE_EVENT,
  NEW_DAY_EVENT,
  POCKET_TOPUP_EVENT,
  SAVINGS_TOPUP_EVENT,
  ADDITIONAL_TASK_TUTORIAL_SEEN_EVENT,
} from './room-state.js';
import { NEW_DAY_TUTORIAL_SEEN_EVENT } from './game-day.js';
import { RIGHT_CLEANER_ID } from './tech-shop.js';

export const JURY_PROFILE_ID = 'jury-sandbox';

export const JURY_EPISODE_TYPE = 'Economic episode';
export const JURY_TASK_TYPE = 'Additional task';
// Lines somebody says aloud: the panel plays their voice.
export const JURY_VOICE_TYPES = new Set(['Mentor reply', 'Monster line', 'Father line', 'Trainer line']);

// Economic episodes and additional tasks first (the user's order), then the voices, then what the
// episodes are built from, then the texts of the room, then the tutorials in the order the game
// shows them. A type missing here goes to the end, so a new data mart type still shows up.
const TYPE_ORDER = [
  JURY_EPISODE_TYPE,
  JURY_TASK_TYPE,
  'Mentor reply',
  'Monster line',
  'Father line',
  'Trainer line',
  'Savings goal',
  'Store',
  'Item from the basic store',
  'Item from the technique store',
  'Item from the toy store',
  'Tennis estimate item',
  'Letter of credit case',
  'Letter of credit card',
  'Route map point',
  'Route leg',
  'Business loan application',
  'Message',
  'Error',
  'End-of-game-day trigger',
  'Music of the New Day',
  'Briefing step on pet care',
  'First budget tutorial',
  'Store tutorial',
  'Feeding tutorial',
  'New day tutorial',
  'Piggy bank tutorial',
  'Cleaning tutorial',
  'Second budget tutorial',
  'Tennis estimate tutorial',
  'Letter of credit tutorial',
  'Additional task tutorial',
  'Route planner tutorial',
  'Assets and liabilities tutorial',
  'Business loan tutorial',
  'Repair episode tutorial',
  'Final part briefing',
];

function byQueueAndId(left, right) {
  return (Number(left.queue) || 0) - (Number(right.queue) || 0) || Number(left.id) - Number(right.id);
}

function byDayThenQueue(left, right) {
  return (juryRowDay(left) ?? 0) - (juryRowDay(right) ?? 0) || byQueueAndId(left, right);
}

export function juryRowDay(row) {
  const day = row?.game_day ?? row?.day_is_it_available;
  return day == null ? null : Number(day);
}

// [{ type, title, rows }] in the panel order; rows of a type go by game day, then queue and id.
export function juryGroups(rows) {
  const groups = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    const type = row?.object_type || '(без типа)';
    if (!groups.has(type)) groups.set(type, { type, title: '', rows: [] });
    const group = groups.get(type);
    group.rows.push(row);
    if (!group.title && row.object_type_ru) group.title = String(row.object_type_ru);
  }
  const rank = (type) => {
    const index = TYPE_ORDER.indexOf(type);
    return index === -1 ? TYPE_ORDER.length : index;
  };
  return [...groups.values()]
    .map((group) => ({ ...group, title: group.title || group.type, rows: group.rows.sort(byDayThenQueue) }))
    .sort((left, right) => rank(left.type) - rank(right.type)
      || Math.min(...left.rows.map((row) => Number(row.id))) - Math.min(...right.rows.map((row) => Number(row.id))));
}

// 'episode' | 'task' | 'voice' | null: what the Play button next to the row does.
export function juryPlayKind(row) {
  if (row?.object_type === JURY_EPISODE_TYPE) return 'episode';
  if (row?.object_type === JURY_TASK_TYPE) return 'task';
  if (JURY_VOICE_TYPES.has(row?.object_type)) return 'voice';
  return null;
}

// The sandbox log that makes the row playable: the player's monster, the row's game day with its
// tutorial already seen, some coins, and whatever the episode's trigger waits for.
export function jurySandboxRecords(row, monster) {
  const profile = { 'Профиль пользователя': JURY_PROFILE_ID };
  const day = Math.max(1, juryRowDay(row) ?? 1);
  const records = [];
  if (monster) records.push({ ...monster, ...profile });
  records.push(
    { 'Тип события': NEW_DAY_EVENT, ...profile, [DAY_NUMBER_FIELD]: day },
    { 'Тип события': NEW_DAY_TUTORIAL_SEEN_EVENT, ...profile, 'Игровой день': day },
    { 'Тип события': ADDITIONAL_TASK_TUTORIAL_SEEN_EVENT, ...profile, 'Игровой день': day },
    { 'Тип события': POCKET_TOPUP_EVENT, ...profile, 'Значение': 100, 'Назначение': 'Монеты песочницы жюри', 'Игровой день': day },
    { 'Тип события': SAVINGS_TOPUP_EVENT, ...profile, 'Значение': 100, 'Игровой день': day },
  );
  if (row?.trigger === 'An attempt to clean the monster') {
    // The nose cleaner breaks on the first tap of 🤧: the monster is dirty and has one to tap with.
    records.push(
      { 'Тип события': INVENTORY_CHANGE_EVENT, ...profile, 'Тип инвентаря': RIGHT_CLEANER_ID, 'Количество': 1, 'Единица измерения': 'шт' },
      { 'Тип события': FEEDING_EVENT, ...profile, 'Насыпано, г': 100, 'Корм': '', 'Игровой день': day },
      { 'Тип события': MONSTER_STATE_EVENT, ...profile, 'Состояние': HYGIENE_STATE, 'Было': 'Чистый', 'Стало': DIRTY, 'Игровой день': day },
      { 'Тип события': CLEANING_ATTEMPT_EVENT, ...profile, 'Прибор': RIGHT_CLEANER_ID, 'Игровой день': day },
    );
  } else {
    // Fed and clean satisfy every other trigger of an episode.
    records.push({ 'Тип события': FEEDING_EVENT, ...profile, 'Насыпано, г': 100, 'Корм': '', 'Игровой день': day });
  }
  return records;
}

export function isMonsterCreatedRecord(record) {
  return record?.['Тип события'] === MONSTER_CREATED_EVENT;
}
