import dataMartRows from './monster_data_mart_rows.json';

// Every game day starts with this record; 'Порядковый номер дня' holds the number of the day.
export const NEW_DAY_EVENT = 'Начало нового дня';
export const DAY_NUMBER_FIELD = 'Порядковый номер дня';
// The first day of older profiles was written under this name and without a number.
const LEGACY_NEW_DAY_EVENT = 'Наступление нового дня';

export function isNewDayRecord(record) {
  const type = record?.['Тип события'];
  return type === NEW_DAY_EVENT || type === LEGACY_NEW_DAY_EVENT;
}
// A successful feeding: the right amount of food went into the bowl.
export const FEEDING_EVENT = 'Кормление';
export const FEEDING_START_EVENT = 'Начало кормления';
export const FEEDING_FAILED_EVENT = 'Неудачная попытка кормления';
export const MONSTER_STATE_EVENT = 'Изменение состояния монстра';
export const MONSTER_CREATED_EVENT = 'Создание монстра';
export const FOOD_PURCHASE_EVENT = 'Покупка еды';
export const POCKET_SPENDING_EVENT = 'Списание карманных денег';
export const POCKET_TOPUP_EVENT = 'Пополнение карманных денег';
export const BUDGET_PLAN_EVENT = 'Сохранение планового бюджета';
// Actual budget execution, one record per article change, for the analytics log.
export const BUDGET_FACT_EVENT = 'Учет фактического бюджета';
export const REQUIRED_ARTICLE = 'Обязательные расходы';
// What the player owns, by data mart id: 'Тип инвентаря' is the item id, 'Количество' the signed
// change in the item's own unit, named in 'Единица измерения'.
export const INVENTORY_CHANGE_EVENT = 'Изменение инвентаря пользователя';
export const INVENTORY_UNIT_GRAMS = 'г';
export const INVENTORY_UNIT_PIECES = 'шт';
export const FOOD_CATEGORY = 'Корм';

const FOOD_ITEM_IDS = new Set(dataMartRows.filter((row) => row?.category === FOOD_CATEGORY).map((row) => row.id));

// Balance events: the sign says whether the event adds or removes money,
// so the stored 'Значение' may be written either as 30 or as -30.
const POCKET_EVENTS = {
  [POCKET_TOPUP_EVENT]: 1,
  [POCKET_SPENDING_EVENT]: -1,
};
export const SAVINGS_TOPUP_EVENT = 'Пополнение копилки';
const SAVINGS_EVENTS = {
  [SAVINGS_TOPUP_EVENT]: 1,
  'Списание из копилки': -1,
};
// A feeding eats one portion of 100 g: that matches the ≈13 coins a day the budget screen
// quotes (Нормовет 5/2 costs 26 coins for 200 g).
export const FOOD_PORTION_GRAMS = 100;
// A feeding counts when the bowl holds the daily portion give or take a tenth.
export const FEEDING_MIN_GRAMS = 90;
export const FEEDING_MAX_GRAMS = 110;
// Only these foods meet both minimums of the briefing (5% tails, 2% juice): Нормовет 5/2 and Ориджин Резерв.
export const SUITABLE_FOOD_IDS = new Set([11, 12]);

// Goods with a weight are counted in grams, because that is how they are used up
// (a feeding eats FOOD_PORTION_GRAMS, not a pack); everything else is counted in pieces.
export function inventoryUnit(item) {
  return Number(item?.weight_in_grams) > 0 ? INVENTORY_UNIT_GRAMS : INVENTORY_UNIT_PIECES;
}

// How much of the item's unit the given number of packs holds.
export function inventoryAmount(item, packs) {
  return inventoryUnit(item) === INVENTORY_UNIT_GRAMS ? Number(item.weight_in_grams) * packs : packs;
}

export const STAT_MIN = -3;
export const STAT_MAX = 3;

// A stat changes only through this record: 'Изменение' is added to the stat named in 'Характеристика'.
export const MONSTER_STAT_EVENT = 'Изменение характеристики монстра';
export const STAT_LABELS = {
  health: 'Здоровье',
  mood: 'Настроение',
  development: 'Развитие',
};
// States logged with MONSTER_STATE_EVENT: 'Состояние' names one of them, 'Стало' holds the new value.
export const HUNGER_STATE = 'Сытость';
export const HYGIENE_STATE = 'Гигиена';
export const DIRTY = 'Грязный';
export const CLEAN = 'Чистый';

export function clampStat(value) {
  return Math.max(STAT_MIN, Math.min(STAT_MAX, value));
}

// Money arrives at the end of every PAYDAY_PERIOD_DAYS-th game day (days 3, 6, 9…).
export const PAYDAY_PERIOD_DAYS = 3;

// 1 on a payday itself: the money comes at the end of today.
export function daysUntilPayday(day) {
  if (day < 1) return PAYDAY_PERIOD_DAYS;
  return PAYDAY_PERIOD_DAYS - ((day - 1) % PAYDAY_PERIOD_DAYS);
}

function eventAmount(record, signs) {
  const sign = signs[record?.['Тип события']];
  const value = Number(record?.['Значение']);
  if (!sign || !Number.isFinite(value)) return 0;
  // A purchase also writes an analytics mirror: a pocket top-up with a negative value. The spending
  // record next to it already moved the money, so the mirror must not move it a second time.
  // The piggy bank has no mirrors: a negative top-up is how money leaves it for the pocket.
  if (sign > 0 && value < 0) return record['Тип события'] === SAVINGS_TOPUP_EVENT ? value : 0;
  return sign * Math.abs(value);
}

// Budgets are numbered in the order the player approves them; spending is charged to the last one.
export function currentBudgetNumber(records) {
  return Math.max(1, records.filter((record) => record?.['Тип события'] === BUDGET_PLAN_EVENT).length);
}

// The packs of suitable food the player has, worked out from what is left of every item: a remainder
// short of a whole pack is the one open pack, the rest are still sealed. Open packs come first.
// `taken` holds grams already poured out of each item by the feeding in progress.
export function pantryPacks(inventory, taken = new Map()) {
  const open = [];
  const sealed = [];
  for (const item of dataMartRows) {
    const weight = Number(item?.weight_in_grams);
    if (!SUITABLE_FOOD_IDS.has(item?.id) || !(weight > 0)) continue;
    const grams = Math.max(0, (inventory.get(item.id) ?? 0) - (taken.get(item.id) ?? 0));
    const whole = Math.floor(grams / weight);
    const rest = grams - whole * weight;
    if (rest > 0) open.push({ item, grams: rest, open: true });
    for (let pack = 0; pack < whole; pack += 1) sealed.push({ item, grams: weight, open: false });
  }
  return [...open, ...sealed];
}

export function deriveRoomState(records) {
  let day = 0;
  let lastFedDay = null;
  let pocket = 0;
  let savings = 0;
  let monster = null;
  let hygiene = CLEAN;
  const stats = { health: 0, mood: 0, development: 0 };
  const statKeys = new Map(Object.entries(STAT_LABELS).map(([key, label]) => [label, key]));
  // Data mart item id → amount in the item's unit.
  const inventory = new Map();

  for (const record of records) {
    const type = record?.['Тип события'];
    if (isNewDayRecord(record)) day = Number(record[DAY_NUMBER_FIELD]) || day + 1;
    if (type === FEEDING_EVENT) lastFedDay = day;
    if (type === MONSTER_CREATED_EVENT) monster = record;
    if (type === MONSTER_STAT_EVENT) {
      const key = statKeys.get(record['Характеристика']);
      const change = Number(record['Изменение']);
      if (key && Number.isFinite(change)) stats[key] = clampStat(stats[key] + change);
    }
    if (type === MONSTER_STATE_EVENT && record['Состояние'] === HYGIENE_STATE) hygiene = record['Стало'];
    if (type === INVENTORY_CHANGE_EVENT) {
      const id = record['Тип инвентаря'];
      const amount = Number(record['Количество']);
      if (Number.isFinite(amount)) inventory.set(id, (inventory.get(id) ?? 0) + amount);
    }
    pocket += eventAmount(record, POCKET_EVENTS);
    savings += eventAmount(record, SAVINGS_EVENTS);
  }

  let foodGrams = 0;
  let suitableFoodGrams = 0;
  for (const [id, amount] of inventory) {
    if (FOOD_ITEM_IDS.has(id)) foodGrams += amount;
    if (SUITABLE_FOOD_IDS.has(id)) suitableFoodGrams += amount;
  }

  return {
    day,
    pocket,
    savings,
    inventory,
    foodGrams: Math.max(0, foodGrams),
    suitableFoodGrams: Math.max(0, suitableFoodGrams),
    // Fed means fed on the current game day; a new day makes the monster hungry again.
    hungry: day > 0 && lastFedDay !== day,
    // The monster gets dirty at the start of every third day and stays dirty until it is washed.
    dirty: hygiene === DIRTY,
    name: monster?.['Имя монстра'] || 'Монстрик',
    appearance: monster?.['Характеристики 3D модели монстра'] ?? null,
    stats,
  };
}
