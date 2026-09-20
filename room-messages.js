import { deriveRoomState } from './room-state.js';
import { GAME_TRIGGERS } from './game-triggers.js';

export const MESSAGE_OBJECT_TYPE = 'Message';
export const MESSAGE_RECEIVED_EVENT = 'Получение сообщения';
export const MESSAGES_OPENED_EVENT = 'Просмотр сообщений';

// Keys are the values of the data mart's `trigger` column; each check gets the room state.
export const MESSAGE_TRIGGERS = {
  'A hungry monster and no food': GAME_TRIGGERS['A hungry monster and no food'],
  // Suitable food is only Нормовет 5/2 and Ориджин Резерв.
  'A hungry monster and enough food': GAME_TRIGGERS['A hungry monster and enough food'],
};

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
    .filter((receipt) => receipt.first && receipt.day === state.day && MESSAGE_TRIGGERS[receipt.trigger]?.(state))
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
    if (!check || due.has(message.trigger) || receivedToday.has(message.trigger)) continue;
    if (check(state)) due.set(message.trigger, message);
  }
  return [...due.values()];
}
