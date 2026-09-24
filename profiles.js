import { DAY_NUMBER_FIELD, isNewDayRecord, MONSTER_CREATED_EVENT } from './room-state.js';
import { ECONOMIC_EPISODE_COMPLETED_EVENT, ECONOMIC_EPISODE_OPENED_EVENT } from './economic-episodes.js';

export const PROFILE_FIELD = 'Профиль пользователя';
const EVENT_FIELD = 'Тип события';
const DAY_FIELD = 'Игровой день';
const MODEL_FIELD = 'Характеристики 3D модели монстра';

// The mentor's episodes and the player's decisions in them (see logEpisode and logDecision).
export const EPISODE_EVENT = 'Экономический эпизод';
export const RIGHT_DECISION_EVENT = 'Правильное решение финансового эпизода';
export const WRONG_DECISION_EVENT = 'Ошибочное решение финансового эпизода';

// How an economic event starts and how it can end: what the parents' filter keeps.
const ECONOMIC_LOG_TONES = new Map([
  [EPISODE_EVENT, 'start'],
  [ECONOMIC_EPISODE_OPENED_EVENT, 'start'],
  [RIGHT_DECISION_EVENT, 'right'],
  [WRONG_DECISION_EVENT, 'wrong'],
  [ECONOMIC_EPISODE_COMPLETED_EVENT, 'done'],
]);

export function isEconomicLogRecord(record) {
  return ECONOMIC_LOG_TONES.has(record?.[EVENT_FIELD]);
}

// Every profile the browser memory knows a monster for: the creation records with distinct
// profile ids. A profile that created its monster more than once is named after the last one.
export function profilesFromLogs(logs) {
  const profiles = new Map();
  for (const records of logs) {
    for (const record of Array.isArray(records) ? records : []) {
      if (record?.[EVENT_FIELD] !== MONSTER_CREATED_EVENT || !record[PROFILE_FIELD]) continue;
      const id = String(record[PROFILE_FIELD]);
      profiles.set(id, {
        id,
        name: String(record['Имя монстра'] || '').trim() || 'Монстрик',
        furIndex: Number(record[MODEL_FIELD]?.['Мех']?.['Индекс варианта']),
      });
    }
  }
  return [...profiles.values()];
}

// --- The log for parents ---------------------------------------------------------------

// Ids and triggers only matter to the game; the profile and the day are shown around the entry.
function isTechnicalField(key) {
  return key === EVENT_FIELD || key === PROFILE_FIELD || key === DAY_FIELD
    || key === 'Триггер' || key.startsWith('Идентификатор');
}

// The 3D model settings read as the parent saw them in the editor.
function modelSummary(model) {
  return {
    'Цвет меха': model?.['Мех']?.['Название цвета'] ?? null,
    'Уши': model?.['Уши']?.['Название'] ?? null,
    'Рога': model?.['Рога']?.['Название'] ?? null,
  };
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'да' : 'нет';
  if (typeof value === 'number') return value.toLocaleString('ru-RU');
  return String(value);
}

// A field as a label and either a text or nested fields.
function logField(label, value) {
  if (Array.isArray(value)) {
    if (value.every((item) => item === null || typeof item !== 'object')) {
      return { label, text: value.length ? value.map(formatValue).join(', ') : '—' };
    }
    return { label, fields: value.map((item, index) => logField(String(index + 1), item)) };
  }
  if (value && typeof value === 'object') {
    return { label, fields: logFields(value) };
  }
  return { label, text: formatValue(value) };
}

function logFields(record) {
  return Object.entries(record)
    .filter(([key]) => !isTechnicalField(key))
    .map(([key, value]) => (key === MODEL_FIELD ? logField('Внешность', modelSummary(value)) : logField(key, value)));
}

const LOG_ICONS = [
  [/^Создание монстра$/, '🐣'],
  [/^Просмотр/, '👀'],
  [/нового дня/, '🌅'],
  [/Победа|победа/, '🏆'],
  [/Поражение/, '😿'],
  [/кормлен|Кормлен|еды/, '🍲'],
  [/козявок|уха|прибора/, '🤧'],
  [/копилк/, '🐷'],
  [/карманн/, '👛'],
  [/бюджет/, '📊'],
  [/Покупка|магазин|товаров/, '🛍️'],
  [/сообщени/, '💬'],
  [/задани/, '📋'],
  [/монстра$/, '💜'],
  [/цел/, '🎯'],
];
const TONE_ICONS = { start: '🚩', right: '✅', wrong: '❌', done: '🏁' };

function logIcon(type, tone) {
  if (tone) return TONE_ICONS[tone];
  return LOG_ICONS.find(([pattern]) => pattern.test(type))?.[1] ?? '📝';
}

// The records of a profile for parents, in the order they happened, grouped by game day.
// Day 0 holds everything before the first day: the monster, the briefing, the first budget.
export function parentLogDays(records, { economicOnly = false } = {}) {
  const days = [];
  let day = 0;
  for (const record of Array.isArray(records) ? records : []) {
    if (!record || typeof record !== 'object') continue;
    if (isNewDayRecord(record)) day = Number(record[DAY_NUMBER_FIELD]) || day + 1;
    if (economicOnly && !isEconomicLogRecord(record)) continue;
    const type = String(record[EVENT_FIELD] || 'Запись без типа');
    const tone = ECONOMIC_LOG_TONES.get(type) ?? null;
    const entryDay = Number(record[DAY_FIELD]) || day;
    const entry = { type, tone, icon: logIcon(type, tone), fields: logFields(record) };
    const last = days.at(-1);
    if (last?.day === entryDay) last.entries.push(entry);
    else days.push({ day: entryDay, entries: [entry] });
  }
  return days;
}
