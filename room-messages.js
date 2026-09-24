import { deriveRoomState } from './room-state.js';
import { GAME_TRIGGERS } from './game-triggers.js';
import { ownedDevice, techStoreItems } from './tech-shop.js';
import { isFinalPart } from './final-part.js';

export const MESSAGE_OBJECT_TYPE = 'Message';
export const MESSAGE_RECEIVED_EVENT = 'Получение сообщения';
export const MESSAGES_OPENED_EVENT = 'Просмотр сообщений';

// Keys are the values of the data mart's `trigger` column; each check gets the room state.
export const MESSAGE_TRIGGERS = {
  'A hungry monster and no food': GAME_TRIGGERS['A hungry monster and no food'],
  // Suitable food is only Нормовет 5/2 and Ориджин Резерв.
  'A hungry monster and enough food': GAME_TRIGGERS['A hungry monster and enough food'],
  // Lives here and not in GAME_TRIGGERS: tech-shop.js imports game-day.js, which checks the
  // trigger vocabulary while it loads, so game-triggers.js cannot import tech-shop.js back.
  'A dirty monster and a cleaner': (state) => state.dirty && Boolean(ownedDevice(state.inventory, techStoreItems())),
  // The morning a nose cleaner comes back from the warranty repair of episode 352.
  'A cleaner is back from repair': (state) => state.devicesBackToday.length > 0,
};

// In the final part the monster eats and gets cleaned by itself, and an empty pantry stops the run
// with a card of its own, so these reminders would only get in the way.
const FINAL_PART_SILENT_TRIGGERS = new Set([
  'A hungry monster and no food',
  'A hungry monster and enough food',
  'A dirty monster and a cleaner',
]);

function isSilenced(trigger, records) {
  return FINAL_PART_SILENT_TRIGGERS.has(trigger) && isFinalPart(records);
}

const eventType = (record) => record?.['Тип события'];

// Received messages, newest first. `first` marks the first receipt for its trigger
// (it was shown right away); later receipts stay unread until the inbox is opened.
export function messageReceipts(records) {
  const receiptsPerTrigger = new Map();
  let openedIndex = -1;
  const receipts = [];

  records.forEach((record, index) => {
    if (eventType(record) === MESSAGES_OPENED_EVENT) openedIndex = index;
    if (eventType(record) !== MESSAGE_RECEIVED_EVENT) return;
    const trigger = record['Триггер'];
    const count = (receiptsPerTrigger.get(trigger) ?? 0) + 1;
    receiptsPerTrigger.set(trigger, count);
    receipts.push({
      index,
      trigger,
      messageId: record['Идентификатор сообщения'],
      day: record['Игровой день'],
      first: count === 1,
    });
  });

  return receipts
    .map((receipt) => ({ ...receipt, unread: !receipt.first && receipt.index > openedIndex }))
    .reverse();
}

// First receipts were displayed immediately. Replay them on a new visit only while the game day
// of that first display is still current and the trigger still fires, oldest first: a message
// about an empty food cupboard has nothing to remind about once the food is bought.
export function messagesToReplayOnEntry(records) {
  const state = deriveRoomState(records);
  if (state.day < 1) return [];
  return messageReceipts(records)
    .filter((receipt) => receipt.first && receipt.day === state.day && MESSAGE_TRIGGERS[receipt.trigger]?.(state)
      && !isSilenced(receipt.trigger, records))
    .reverse();
}

// Messages whose trigger fires now; a trigger sends at most one message per game day.
export function dueMessages(messages, records) {
  const state = deriveRoomState(records);
  if (state.day < 1) return [];

  const receivedToday = new Set(records
    .filter((record) => eventType(record) === MESSAGE_RECEIVED_EVENT && record['Игровой день'] === state.day)
    .map((record) => record['Триггер']));
  const due = new Map();
  for (const message of messages) {
    const check = MESSAGE_TRIGGERS[message.trigger];
    if (!check || due.has(message.trigger) || receivedToday.has(message.trigger) || isSilenced(message.trigger, records)) continue;
    if (check(state)) due.set(message.trigger, message);
  }
  return [...due.values()];
}
