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
import { GAME_TRIGGERS } from './game-triggers.js';

export const END_OF_DAY_OBJECT_TYPE = 'End-of-game-day trigger';
// Shown at the start of the day named in its `game_day`, steps in `queue` order.
export const NEW_DAY_TUTORIAL_OBJECT_TYPE = 'New day tutorial';
export const NEW_DAY_TUTORIAL_SEEN_EVENT = 'Просмотр туториала нового дня';
// The room plays this track through the day named in its `game_day`: the file is `audio`,
// looked up in `audio_folder` ('root' is the root of the repository).
export const DAY_MUSIC_OBJECT_TYPE = 'Music of the New Day';
// Development drops and the monster gets dirty at the start of days 3, 6, 9…
export const HARD_DAY_PERIOD = 3;

// Keys are the values of the data mart's `trigger` column; each check gets the room state.
// `hint` answers the moon icon while the day is not over yet.
export const END_OF_DAY_TRIGGERS = {
  'The monster is full': { check: GAME_TRIGGERS['The monster is full'], hint: 'Сначала покорми монстрика' },
};

const endOfDayRows = dataMartRows.filter((row) => row?.object_type === END_OF_DAY_OBJECT_TYPE);

endOfDayRows
  .filter((row) => !END_OF_DAY_TRIGGERS[row.trigger])
  .forEach((row) => console.warn(`Триггер конца дня ${row.id}: неизвестный триггер «${row.trigger}», он не сработает.`));

// The day can be finished once any of its end-of-day triggers has fired.
export function canFinishDay(state) {
  return state.day > 0 && endOfDayRows.some(
    (row) => Number(row.game_day) === state.day && END_OF_DAY_TRIGGERS[row.trigger]?.check(state),
  );
}

export function finishDayHint(state) {
  const row = endOfDayRows.find((item) => Number(item.game_day) === state.day && END_OF_DAY_TRIGGERS[item.trigger]);
  return row ? END_OF_DAY_TRIGGERS[row.trigger].hint : 'Этот день ещё не закончился';
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
    const after = clampStat(before - 1);
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
  lowerStat('mood', 'Каждый новый день настроение падает');
  if (hardDay) lowerStat('development', `Каждый ${HARD_DAY_PERIOD}-й день развитие падает`);
  // A new day makes the monster hungry again (see deriveRoomState); the log only needs the change.
  if (!state.hungry) changeState(HUNGER_STATE, 'Сытый', 'Голодный');
  if (hardDay && !state.dirty) changeState(HYGIENE_STATE, CLEAN, DIRTY);
  return records;
}

// The music row of the day, or null when the day keeps the usual room track.
export function dayMusic(day) {
  return dataMartRows.find(
    (row) => row?.object_type === DAY_MUSIC_OBJECT_TYPE && Number(row.game_day) === day && row.audio,
  ) ?? null;
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
