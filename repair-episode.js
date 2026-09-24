import dataMartRows from './monster_data_mart_rows.json';
import {
  BUDGET_PLAN_EVENT,
  PAYDAY_PERIOD_DAYS,
  SAVINGS_TOPUP_EVENT,
} from './room-state.js';
import { CARTRIDGE_ITEM_ID, itemSpec, RIGHT_CLEANER_ID } from './tech-shop.js';
import { HARD_DAY_PERIOD } from './game-day.js';

// Episode 352 «Поломка удалителя козявок», day 9: the nose cleaner breaks right when the player wants
// to clean the monster. The warranty repair is free but takes three days, so a spare one has to be
// bought today. Which spare pays off depends on how long the game still goes on, and that depends on
// how fast the piggy bank fills up: first the forecast, then the arithmetic of the spare.
// This module holds the rules and the arithmetic; the screen lives in main.js.

export const REPAIR_EPISODE_TRIGGER = 'An attempt to clean the monster';
export const REPAIR_DAYS = 3;
// One cleaning out of five ends with a broken device.
export const BREAKDOWN_CHANCE = 0.2;
// Without a big goal of their own the player saves up this much.
export const DEFAULT_SAVINGS_TARGET = 1500;
// Every budget covers this many days (the father pays at the end of every third day).
export const BUDGET_DAYS = PAYDAY_PERIOD_DAYS;
// What a budget can honestly set aside: the father's 100 minus food for three days (3 × 13) and at
// least 11 for fun, below which the budget mentor refuses the plan.
export const BUDGET_AMOUNT = 100;
export const FOOD_PER_BUDGET = 39;
export const FUN_PER_BUDGET_MIN = 11;
export const PROMISE_MAX = BUDGET_AMOUNT - FOOD_PER_BUDGET - FUN_PER_BUDGET_MIN;

// What went wrong with each device, as the service centre writes it on the warranty card.
export const BREAKDOWNS = {
  75: 'Треснула головка, картридж не держится',
  76: 'Погнулся ковшик — козявки выскальзывают',
  77: 'Не заряжается, кнопка не светится',
};

const eventType = (record) => record?.['Тип события'];

// A number in [0, 1) that stays the same for the same seed (FNV-1a), so a reload cannot reroll the
// breakdown of the day.
export function seededChance(seed) {
  let hash = 0x811c9dc5;
  for (const char of String(seed)) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash / 2 ** 32;
}

// After the episode the arithmetic comes true: a cleaning ends with a broken device one time in five.
export function breaksToday(profileId, day) {
  return seededChance(`${profileId}:${day}:cleaner`) < BREAKDOWN_CHANCE;
}

const money = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

// Rounds to tenths: averages like 1.4 breakdowns are what the player works with.
export function tenths(value) {
  return Math.round(value * 10) / 10;
}

// The big goals the piggy bank is for; with none, the default sum.
export function savingsTarget(goals) {
  if (!goals.length) {
    return { goals: [], total: DEFAULT_SAVINGS_TARGET, isDefault: true };
  }
  return { goals, total: goals.reduce((sum, goal) => sum + goal.price, 0), isDefault: false };
}

// Everything that went into the piggy bank and out of it. Budget savings carry no source; the
// father's thanks and task rewards name one in 'Источник средств'. Coins moved to the pocket are
// negative top-ups (or the older 'Списание из копилки').
export function piggyHistory(records) {
  let planned = 0;
  let unplanned = 0;
  let withdrawn = 0;
  for (const record of records) {
    const type = eventType(record);
    const value = money(record?.['Значение']);
    if (type === SAVINGS_TOPUP_EVENT) {
      if (value < 0) withdrawn += -value;
      else if (record['Источник средств']) unplanned += value;
      else planned += value;
    } else if (type === 'Списание из копилки') {
      withdrawn += Math.abs(value);
    }
  }
  const budgets = Math.max(1, records.filter((record) => eventType(record) === BUDGET_PLAN_EVENT).length);
  const balance = planned + unplanned - withdrawn;
  return { planned, unplanned, withdrawn, balance, budgets, perBudget: tenths(balance / budgets) };
}

// How many budgets it takes to fill the piggy bank from `balance` to `target` at `perBudget` coins
// each, and the day the last of them starts: budget n + 1 is approved on the morning of day 3n + 1.
// `budgets` is Infinity when the piggy bank does not grow.
export function savingsForecast({ balance, target, perBudget, budgetsDone, day }) {
  const left = Math.max(0, target - balance);
  if (left === 0) return { left, budgets: 0, victoryDay: day, days: 0 };
  if (!(perBudget > 0)) return { left, budgets: Infinity, victoryDay: Infinity, days: Infinity };
  const budgets = Math.ceil(left / perBudget);
  const victoryDay = Math.max(day, BUDGET_DAYS * (budgetsDone + budgets - 1) + 1);
  return { left, budgets, victoryDay, days: victoryDay - day };
}

// The cleanings after today up to the day of victory: the monster gets dirty every third day.
export function cleaningsAhead(day, victoryDay) {
  if (!Number.isFinite(victoryDay)) return Infinity;
  return Math.max(0, Math.floor(victoryDay / HARD_DAY_PERIOD) - Math.floor(day / HARD_DAY_PERIOD));
}

// Every breakdown of the main device sends it away for exactly one cleaning, so each one is a
// cleaning the spare has to do.
export function expectedBreakdowns(cleanings) {
  return tenths(cleanings * BREAKDOWN_CHANCE);
}

const price = (item) => money(item?.price);

// What a spare costs by the day of victory, on average: today's cleaning comes with the device
// (Козилетт ships with one cartridge), and every breakdown later on costs one more cartridge.
// A device without consumables costs its price and nothing more.
export function spareCost(device, breakdowns, items = dataMartRows) {
  const spec = itemSpec(device);
  if (!spec?.refillId) return price(device);
  const cartridge = items.find((item) => item?.id === CARTRIDGE_ITEM_ID);
  return tenths(price(device) + breakdowns * price(cartridge));
}

// The spare the mentor would buy: the cheapest one on average among those the player can pay for.
// iКовырялка does what the Норма does for twice the money, so it never counts as right.
export function rightSpare(devices, breakdowns, budget, items = dataMartRows) {
  const options = devices
    .filter((device) => itemSpec(device)?.kind === 'device' && device.id !== 77)
    .map((device) => ({ device, cost: spareCost(device, breakdowns, items) }))
    .sort((left, right) => left.cost - right.cost || price(left.device) - price(right.device));
  return (options.find((option) => price(option.device) <= budget) ?? options[0])?.device ?? null;
}

export const SPARE_OVERPRICED = 'repair-spare-overpriced';
export const SPARE_CHEAP = 'repair-spare-cheap';
export const SPARE_OVERKILL = 'repair-spare-overkill';
export const SPARE_RIGHT_CHEAP = 'repair-spare-right-cheap';
export const SPARE_RIGHT_RELIABLE = 'repair-spare-right-reliable';

// The mentor's verdict on the chosen spare: null trigger means the choice is right.
export function spareVerdict(choice, right) {
  if (!choice) return null;
  if (choice.id === right?.id) {
    return { right: true, trigger: itemSpec(choice)?.refillId ? SPARE_RIGHT_CHEAP : SPARE_RIGHT_RELIABLE };
  }
  if (choice.id === 77) return { right: false, trigger: SPARE_OVERPRICED };
  return { right: false, trigger: itemSpec(choice)?.refillId ? SPARE_CHEAP : SPARE_OVERKILL };
}

export const PROMISE_NONE = 'repair-forecast-never';
export const PROMISE_UNREALISTIC = 'repair-promise-unrealistic';
export const PROMISE_LOWER = 'repair-promise-lower';
export const FORECAST_LONG = 'repair-forecast-long';
export const FORECAST_HISTORY = 'repair-forecast-history';
export const FORECAST_PROMISE = 'repair-forecast-promise';
// A forecast longer than this many days gets a word from the mentor.
export const LONG_FORECAST_DAYS = 60;

// What the mentor says about the forecast the player takes into the next step. `blocking` ones send
// the player back; the long one only suggests promising more.
export function forecastVerdict({ promise, history, forecast }) {
  if (promise === null) {
    if (!Number.isFinite(forecast.budgets)) return { trigger: PROMISE_NONE, blocking: true };
    if (forecast.days > LONG_FORECAST_DAYS) return { trigger: FORECAST_LONG, blocking: false };
    return { trigger: FORECAST_HISTORY, blocking: false, accepted: true };
  }
  if (promise > PROMISE_MAX) return { trigger: PROMISE_UNREALISTIC, blocking: true };
  if (promise <= history.perBudget) return { trigger: PROMISE_LOWER, blocking: true };
  return { trigger: FORECAST_PROMISE, blocking: false, accepted: true };
}

// Three answers for a question of the calculation: the right one and two typical slips, each with
// a distinct value. `slips` are [value, why] pairs tried in order.
export function quizOptions(right, slips) {
  const options = [{ value: tenths(right), right: true }];
  for (const [value, slip] of slips) {
    const rounded = tenths(value);
    if (options.length >= 3) break;
    if (!Number.isFinite(rounded) || rounded < 0 || options.some((option) => option.value === rounded)) continue;
    options.push({ value: rounded, right: false, slip });
  }
  // A fixed order that does not always put the right answer first.
  return options.sort((left, right) => left.value - right.value);
}

// Question 1: how many times the main device breaks over the cleanings ahead.
export function breakdownQuiz(cleanings) {
  const right = expectedBreakdowns(cleanings);
  return quizOptions(right, [
    [cleanings - right, 'repair-quiz-breakdowns-inverse'],
    [20, 'repair-quiz-breakdowns-percent'],
    [cleanings, 'repair-quiz-breakdowns-every'],
    [right * 2, 'repair-quiz-breakdowns-every'],
  ]);
}

// Question 2: what the cheap spare costs by the day of victory.
export function cheapSpareQuiz(device, breakdowns, cleanings, items = dataMartRows) {
  const cartridge = price(items.find((item) => item?.id === CARTRIDGE_ITEM_ID));
  const right = spareCost(device, breakdowns, items);
  return quizOptions(right, [
    [price(device), 'repair-quiz-cost-device-only'],
    [breakdowns * cartridge, 'repair-quiz-cost-cartridges-only'],
    [price(device) + cleanings * cartridge, 'repair-quiz-cost-every-cleaning'],
    [price(device) + (breakdowns + 1) * cartridge, 'repair-quiz-cost-device-only'],
  ]);
}

export const RELIABLE_SPARE_ID = RIGHT_CLEANER_ID;
