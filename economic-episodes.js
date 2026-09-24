import { deriveRoomState, ECONOMIC_EPISODE_COMPLETED_EVENT } from './room-state.js';
import { hasGameTrigger, isGameTriggerActive } from './game-triggers.js';

export { ECONOMIC_EPISODE_COMPLETED_EVENT };
export const ECONOMIC_EPISODE_OBJECT_TYPE = 'Economic episode';
export const ECONOMIC_EPISODE_OPENED_EVENT = 'Открытие экономического эпизода';

export function economicEpisodes(rows) {
  return (Array.isArray(rows) ? rows : [])
    .filter((row) => row?.object_type === ECONOMIC_EPISODE_OBJECT_TYPE)
    .sort((left, right) => (Number(left.queue) || 0) - (Number(right.queue) || 0) || Number(left.id) - Number(right.id));
}

export function unknownEconomicEpisodeTriggers(rows) {
  return economicEpisodes(rows).filter((episode) => !hasGameTrigger(episode.trigger));
}

function episodeRecord(records, type, episode, day = null) {
  return records.some((record) => (
    record?.['Тип события'] === type
    && String(record['Идентификатор эпизода']) === String(episode.id)
    && (day === null || Number(record['Игровой день']) === day)
  ));
}

export function isEconomicEpisodeCompleted(records, episode) {
  return episodeRecord(records, ECONOMIC_EPISODE_COMPLETED_EVENT, episode);
}

// Opened today and not decided yet: the player has left it halfway and can come back.
export function isEconomicEpisodeStarted(records, episode) {
  return episodeRecord(records, ECONOMIC_EPISODE_OPENED_EVENT, episode, deriveRoomState(records).day);
}

// An episode is due only on its exact game day, only while its named trigger
// is true and until its decision is made. The UI deliberately chooses the first due
// row so the main screen still has one unambiguous large action even if the table
// accidentally contains several.
export function dueEconomicEpisodes(rows, records) {
  const state = deriveRoomState(records);
  if (state.day < 1) return [];

  return economicEpisodes(rows).filter((episode) => (
    Number(episode.game_day) === state.day
    && String(episode.title || '').trim()
    && isGameTriggerActive(episode.trigger, state)
    && !isEconomicEpisodeCompleted(records, episode)
  ));
}
