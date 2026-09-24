import dataMartRows from './monster_data_mart_rows.json';
import {
  BUDGET_FACT_EVENT,
  BUDGET_PLAN_EVENT,
  deriveRoomState,
  FOOD_PORTION_GRAMS,
  FOOD_PURCHASE_EVENT,
  FUN_ARTICLE,
  GOAL_PURCHASE_EVENT,
  GOODS_PURCHASE_EVENT,
  POCKET_SPENDING_EVENT,
  POCKET_TOPUP_EVENT,
  REQUIRED_ARTICLE,
  SAVINGS_ARTICLE,
  SAVINGS_GOAL_DECISION_EVENT,
  SAVINGS_SPENDING_EVENT,
  SAVINGS_TOPUP_EVENT,
  SUITABLE_FOOD_IDS,
} from './room-state.js';

const eventType = (record) => record?.['Тип события'];
const amountOf = (value) => Number(value) || 0;

export function approvedBudgetCount(records) {
  return records.filter((record) => eventType(record) === BUDGET_PLAN_EVENT).length;
}

// The records of budget `number` (1 is the first approved one): from its plan up to the next plan.
function budgetPeriod(records, number) {
  const starts = [];
  records.forEach((record, index) => {
    if (eventType(record) === BUDGET_PLAN_EVENT) starts.push(index);
  });
  const start = starts[number - 1];
  if (start === undefined) return null;
  return { before: records.slice(0, start), during: records.slice(start, starts[number] ?? records.length) };
}

// The plan of budget `number` next to what really happened to its money. `fact` has the same
// articles: what was charged to the two spending ones and what the piggy bank kept of its share;
// `unspent` are the coins still in the pocket. Together they add up to the fund again, plus
// `income`: money nobody planned for (the father's thanks, a reward for an additional task).
// Such a top-up is the only one that names 'Источник средств'; a budget's own top-ups do not.
export function budgetReview(records, number) {
  const period = budgetPeriod(records, number);
  if (!period) return null;
  const value = period.during[0]['Значение'] ?? {};
  const articles = value['Статьи бюджета'] ?? {};
  const plan = {
    required: amountOf(articles[REQUIRED_ARTICLE]),
    fun: amountOf(articles[FUN_ARTICLE]),
    savings: amountOf(articles[SAVINGS_ARTICLE]),
  };

  const fact = { required: 0, fun: 0, savings: 0 };
  const food = { cost: 0, grams: 0, packs: 0 };
  const devices = [];
  const funPurchases = [];
  const income = [];
  const goalPurchases = [];
  let borrowed = 0;
  // Every purchase writes its spending, with what it was for, before it charges the article.
  let purpose = null;
  for (const record of period.during) {
    const type = eventType(record);
    if (type === POCKET_SPENDING_EVENT) purpose = record['Назначение'] ?? null;
    if (type === BUDGET_FACT_EVENT) {
      const change = amountOf(record['Изменение статьи']);
      if (record['Статья бюджета'] === REQUIRED_ARTICLE) fact.required += change;
      if (record['Статья бюджета'] === FUN_ARTICLE) {
        fact.fun += change;
        funPurchases.push({ purpose, cost: change });
      }
    }
    if (type === FOOD_PURCHASE_EVENT) {
      food.cost += amountOf(record['Стоимость']);
      food.grams += amountOf(record['Масса, г']);
      food.packs += amountOf(record['Количество пачек']);
    }
    if (type === GOODS_PURCHASE_EVENT) devices.push({ title: record['Товар'], cost: amountOf(record['Стоимость']) });
    // A big goal bought with the piggy bank spends what the savings article has put aside.
    if (type === SAVINGS_SPENDING_EVENT && record['Покупка цели']) {
      goalPurchases.push({ title: record['Название цели'] ?? null, cost: Math.abs(amountOf(record['Значение'])) });
    }
    // Money leaves the piggy bank for the pocket as a negative top-up.
    if (type === SAVINGS_TOPUP_EVENT && amountOf(record['Значение']) < 0) borrowed -= amountOf(record['Значение']);
    const incoming = amountOf(record['Значение']);
    if ((type === SAVINGS_TOPUP_EVENT || type === POCKET_TOPUP_EVENT) && incoming > 0 && record['Источник средств']) {
      income.push({
        source: record['Источник средств'],
        purpose: record['Назначение'] ?? null,
        amount: incoming,
        to: type === SAVINGS_TOPUP_EVENT ? 'Копилка' : 'Карман',
      });
    }
  }

  const start = deriveRoomState(period.before);
  const end = deriveRoomState([...period.before, ...period.during]);
  const goalsSpent = goalPurchases.reduce((sum, item) => sum + item.cost, 0);
  // The article counts what was put aside; a goal bought with it does not undo the saving.
  fact.savings = end.savings - start.savings + goalsSpent;
  return {
    number,
    fund: amountOf(value['Фонд к распределению']) || plan.required + plan.fun + plan.savings,
    source: value['Источник средств'] ?? null,
    plan,
    fact,
    spent: fact.required + fact.fun,
    unspent: end.pocket - start.pocket,
    food: { ...food, days: food.grams / FOOD_PORTION_GRAMS },
    devices,
    funPurchases,
    borrowed,
    goalPurchases,
    income,
    incomeTotal: income.reduce((sum, item) => sum + item.amount, 0),
    // What the budget screen asked for food, when the plan wrote it down (from the second budget on).
    foodPlan: value['Корм к покупке'] ? amountOf(value['Корм к покупке']['Стоимость']) : null,
  };
}

// The suitable food that costs the least per gram. It is sold in whole packs only.
export function cheapestSuitablePack(rows = dataMartRows) {
  const perGram = (row) => Number(row.price) / Number(row.weight_in_grams);
  return rows
    .filter((row) => SUITABLE_FOOD_IDS.has(row?.id) && Number(row.price) > 0 && Number(row.weight_in_grams) > 0)
    .sort((left, right) => perGram(left) - perGram(right))[0] ?? null;
}

// What `days` of feeding cost when `stockGrams` of suitable food are already at home
// and the rest can only be bought in whole packs.
export function foodPurchaseNeed(stockGrams, days) {
  const pack = cheapestSuitablePack();
  const needGrams = days * FOOD_PORTION_GRAMS;
  const stock = Math.max(0, Math.round(stockGrams));
  const missingGrams = Math.max(0, needGrams - stock);
  const packs = pack ? Math.ceil(missingGrams / Number(pack.weight_in_grams)) : 0;
  return { pack, needGrams, stockGrams: stock, missingGrams, packs, cost: packs * Number(pack?.price ?? 0) };
}

// Data mart ids (as strings) of the big goals the player has already bought.
export function boughtSavingsGoalIds(records) {
  return new Set(records
    .filter((record) => eventType(record) === GOAL_PURCHASE_EVENT)
    .map((record) => String(record['Идентификатор цели'])));
}

// The big goals the player has agreed to save up for, in the order they were accepted.
// Only the latest answer about a goal counts. Title and price are the ones the player agreed to.
// A goal already bought is no longer saved up for.
export function acceptedSavingsGoals(records, rows = dataMartRows) {
  const goals = new Map();
  const bought = boughtSavingsGoalIds(records);
  for (const record of records) {
    if (eventType(record) !== SAVINGS_GOAL_DECISION_EVENT) continue;
    const key = String(record['Идентификатор цели']);
    goals.delete(key);
    if (record['Цель принята'] !== true || bought.has(key)) continue;
    const row = rows.find((item) => String(item?.id) === key);
    goals.set(key, {
      id: record['Идентификатор цели'],
      title: record['Название цели'] || row?.title || 'Цель',
      price: amountOf(record['Стоимость'] ?? row?.price),
    });
  }
  return [...goals.values()];
}

// How far a piggy bank holding `pool` coins is from each goal and from all of them together.
// The goals share the one piggy bank, so each of them is measured against all of it.
export function savingsGoalsProgress(goals, pool) {
  const total = goals.reduce((sum, goal) => sum + goal.price, 0);
  return {
    goals: goals.map((goal) => ({ ...goal, left: Math.max(0, goal.price - pool) })),
    total,
    left: Math.max(0, total - pool),
  };
}

// Where the fact of a budget parted from its plan, in the order the mentor goes through them.
// Spending is compared on the two spending articles; the piggy bank differs from its plan only by
// the unplanned income and by the coins taken out of it, so those two are findings of their own.
// Food a hungry monster never got is no saving, so the obligatory article is not called underspent then.
export function budgetDiscrepancies(review, { hungry = false } = {}) {
  const articles = ['required', 'fun'].map((key) => ({
    key,
    plan: review.plan[key],
    fact: review.fact[key],
    change: review.fact[key] - review.plan[key],
  }));
  const over = articles.filter((article) => article.change > 0);
  const under = articles.filter((article) => article.change < 0 && !(hungry && article.key === 'required'));
  const findings = [];
  if (review.incomeTotal > 0) findings.push({ kind: 'income', income: review.income, total: review.incomeTotal });
  if (over.length) findings.push({ kind: 'overspent', articles: over });
  if (under.length) findings.push({ kind: 'underspent', articles: under, unspent: review.unspent });
  if (review.borrowed > 0) findings.push({ kind: 'borrowed', amount: review.borrowed });
  if (!over.length && articles.every((article) => article.change === 0)) findings.push({ kind: 'on-plan' });
  if (hungry) findings.push({ kind: 'hungry' });
  return findings;
}
