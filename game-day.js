import dataMartRows from './monster_data_mart_rows.json';
import {
  clampStat,
  CLEAN,
  DAY_NUMBER_FIELD,
  DIRTY,
  HUNGER_STATE,
  HYGIENE_STATE,
  MONSTER_STAT_EVENT,
  MONSTER_STATE_EVENT,
  NEW_DAY_EVENT,
  STAT_LABELS,
} from './room-state.js';
import { hasGameTrigger, isGameTriggerActive } from './game-triggers.js';

export const END_OF_DAY_OBJECT_TYPE = 'End-of-game-day trigger';
// Shown at the start of the day named in its `game_day`, steps in `queue` order.
export const NEW_DAY_TUTORIAL_OBJECT_TYPE = 'New day tutorial';
export const NEW_DAY_TUTORIAL_SEEN_EVENT = 'Просмотр туториала нового дня';
// The room plays this track through the day named in its `game_day`: the file is `audio`,
// looked up in `audio_folder` ('root' is the root of the repository).
export const DAY_MUSIC_OBJECT_TYPE = 'Music of the New Day';
// Development drops and the monster gets dirty at the start of days 3, 6, 9…
export const HARD_DAY_PERIOD = 3;

// What the moon icon answers while the day is not over yet, looked up by the `trigger` of the
// day's row: a plain trigger by its name, a trigger that names a data mart row by its pattern.
const END_OF_DAY_HINTS = [
  ['The monster is full', 'Сначала покорми монстрика'],
  ['A pure monster', 'Сначала почисти монстрику уши от козявок'],
  [
    /^Acceptance or rejection of a Savings goal with id = \d+$/,
    'Сходи с монстриком в парк и реши, копите ли вы на мероприятие',
  ],
  [/^End of the economic episode id = \d+$/, 'Сначала закончи сегодняшний экономический эпизод'],
  ['End of the additional tasks tutorial', 'Сначала закончи сегодняшний экономический эпизод'],
  ['A successful purchase at the toy store', 'Сначала купи монстрику игрушку в магазине игрушек'],
];
const DAY_IS_NOT_OVER_HINT = 'Этот день ещё не закончился';

function endOfDayHint(trigger) {
  const hint = END_OF_DAY_HINTS.find(([key]) => (typeof key === 'string' ? key === trigger : key.test(trigger)));
  return hint?.[1] ?? DAY_IS_NOT_OVER_HINT;
}

const endOfDayRows = dataMartRows.filter((row) => row?.object_type === END_OF_DAY_OBJECT_TYPE);

endOfDayRows
  .filter((row) => !hasGameTrigger(row.trigger))
  .forEach((row) => console.warn(`Триггер конца дня ${row.id}: неизвестный триггер «${row.trigger}», он не сработает.`));

// The day can be finished once any of its end-of-day triggers has fired.
export function canFinishDay(state) {
  return state.day > 0 && endOfDayRows.some(
    (row) => Number(row.game_day) === state.day && isGameTriggerActive(row.trigger, state),
  );
}

export function finishDayHint(state) {
  const row = endOfDayRows.find((item) => Number(item.game_day) === state.day && hasGameTrigger(item.trigger));
  return row ? endOfDayHint(row.trigger) : DAY_IS_NOT_OVER_HINT;
}

// The records that start the day after `state.day`, in the order they are written:
// the new day itself, then every stat and state it changes.
export function newDayRecords(state, profileId) {
  const day = state.day + 1;
  const hardDay = day % HARD_DAY_PERIOD === 0;
  const records = [{ 'Тип события': NEW_DAY_EVENT, 'Профиль пользователя': profileId, [DAY_NUMBER_FIELD]: day }];
  const stats = { ...state.stats };

  const lowerStat = (key, reason) => {
    const before = stats[key];
    const after = clampStat(before - 1, key);
    if (after === before) return;
    stats[key] = after;
    records.push({
      'Тип события': MONSTER_STAT_EVENT,
      'Профиль пользователя': profileId,
      'Характеристика': STAT_LABELS[key],
      'Изменение': after - before,
      'Было': before,
      'Стало': after,
      'Причина': reason,
      'Игровой день': day,
    });
  };
  const changeState = (name, before, after) => records.push({
    'Тип события': MONSTER_STATE_EVENT,
    'Профиль пользователя': profileId,
    'Состояние': name,
    'Было': before,
    'Стало': after,
    'Игровой день': day,
  });

  if (state.hungry) lowerStat('health', 'Прошлый день монстрик закончил голодным');
  if (state.dirty) lowerStat('health', 'Прошлый день монстрик закончил грязным');
  lowerStat('mood', 'Каждый новый день настроение падает');
  if (hardDay) lowerStat('development', `Каждый ${HARD_DAY_PERIOD}-й день развитие падает`);
  // A new day makes the monster hungry again (see deriveRoomState); the log only needs the change.
  if (!state.hungry) changeState(HUNGER_STATE, 'Сытый', 'Голодный');
  if (hardDay && !state.dirty) changeState(HYGIENE_STATE, CLEAN, DIRTY);
  return records;
}

// The music row of the day, or null when the day keeps the usual room track. A row with
// `game_day` belongs to that day only; a row with `day_is_it_available` instead plays on every
// day from that one on (the room loops it), unless the day has its own row. Of several such rows
// the one that starts latest wins.
export function dayMusic(day) {
  const tracks = dataMartRows.filter((row) => row?.object_type === DAY_MUSIC_OBJECT_TYPE && row.audio);
  const own = tracks.find((row) => Number(row.game_day) === day);
  if (own) return own;
  return tracks
    .filter((row) => row.game_day == null && Number(row.day_is_it_available) <= day)
    .sort((left, right) => Number(right.day_is_it_available) - Number(left.day_is_it_available))[0] ?? null;
}

export function newDayTutorialSteps(day) {
  return dataMartRows
    .filter((row) => row?.object_type === NEW_DAY_TUTORIAL_OBJECT_TYPE && Number(row.game_day) === day)
    .sort((left, right) => Number(left.queue) - Number(right.queue));
}

// The tutorial of the current day is due until the player has closed it once.
export function isNewDayTutorialDue(records, day) {
  return newDayTutorialSteps(day).length > 0 && !records.some(
    (record) => record?.['Тип события'] === NEW_DAY_TUTORIAL_SEEN_EVENT && record['Игровой день'] === day,
  );
}
