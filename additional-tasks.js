import { ADDITIONAL_TASK_COMPLETED_EVENT, deriveRoomState } from './room-state.js';
import { hasGameTrigger, isGameTriggerActive } from './game-triggers.js';

export { ADDITIONAL_TASK_COMPLETED_EVENT };
export const ADDITIONAL_TASK_OBJECT_TYPE = 'Additional task';
export const ADDITIONAL_TASK_STARTED_EVENT = 'Начало дополнительного задания';
export const ADDITIONAL_TASK_ABANDONED_EVENT = 'Прерывание дополнительного задания';
// Steps of the tutorial about additional tasks, shown once, when the first task becomes available.
export const ADDITIONAL_TASK_TUTORIAL_OBJECT_TYPE = 'Additional task tutorial';

export function additionalTasks(rows) {
  return (Array.isArray(rows) ? rows : [])
    .filter((row) => row?.object_type === ADDITIONAL_TASK_OBJECT_TYPE && String(row.title || '').trim())
    .sort((left, right) => (Number(left.queue) || 0) - (Number(right.queue) || 0) || Number(left.id) - Number(right.id));
}

export function unknownAdditionalTaskTriggers(rows) {
  return additionalTasks(rows).filter((task) => task.trigger && !hasGameTrigger(task.trigger));
}

// A task opens from the day in its `day_is_it_available`, once its `trigger` has fired, and then
// stays open until it is done; a task without a trigger opens with its day.
function isOpen(task, state) {
  return state.day > 0
    && state.day >= (Number(task.day_is_it_available) || 1)
    && (!task.trigger || isGameTriggerActive(task.trigger, state));
}

// Tasks for the list: the ones the player can play now, then the done ones, which cannot be replayed.
export function additionalTaskList(rows, records) {
  const state = deriveRoomState(records);
  const tasks = additionalTasks(rows);
  const done = tasks.filter((task) => state.completedAdditionalTasks.has(String(task.id)));
  const available = tasks.filter((task) => !state.completedAdditionalTasks.has(String(task.id)) && isOpen(task, state));
  return { available, done };
}

export function additionalTaskTutorialSteps(rows) {
  return (Array.isArray(rows) ? rows : [])
    .filter((row) => row?.object_type === ADDITIONAL_TASK_TUTORIAL_OBJECT_TYPE)
    .sort((left, right) => Number(left.queue) - Number(right.queue));
}
