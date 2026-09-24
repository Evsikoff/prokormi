import dataMartRows from './monster_data_mart_rows.json';

// The letter of credit episode: the player stands in for the bank clerk and builds each client's
// letter of credit from ready-made cards. A letter is a chain of stages; every stage is a group of
// triggers (joined by И or ИЛИ) followed by a group of transactions (always all of them, И).
export const LOC_CASE_OBJECT_TYPE = 'Letter of credit case';
export const LOC_CARD_OBJECT_TYPE = 'Letter of credit card';
export const LOC_TUTORIAL_OBJECT_TYPE = 'Letter of credit tutorial';
export const TRIGGER_CATEGORY = 'Триггер';
export const TRANSACTION_CATEGORY = 'Транзакция';
export const LOGIC_AND = 'and';
export const LOGIC_OR = 'or';
export const LOGIC_LABELS = { [LOGIC_AND]: 'И', [LOGIC_OR]: 'ИЛИ' };
// A card the bank's LLM drafted before it broke: some of them are right, some are nonsense.
export const LLM_CARD_SOURCE = 'llm';

// Mentor replies by mistake, keyed by `trigger` and the case `title` in the data mart. With several
// mistakes the mentor names the first one of this list: wrong cards hide every other problem.
export const LOC_DECOY = 'loc-decoy';
export const LOC_MISSING = 'loc-missing';
export const LOC_ORDER = 'loc-order';
export const LOC_LOGIC = 'loc-logic';
export const LOC_SOLVED = 'loc-solved';

const byQueue = (left, right) => (Number(left.queue) || 0) - (Number(right.queue) || 0) || Number(left.id) - Number(right.id);

// The clients of the episode: the case rows of its game day, in `queue` order.
export function letterOfCreditCases(episode, rows = dataMartRows) {
  return rows
    .filter((row) => row?.object_type === LOC_CASE_OBJECT_TYPE && Number(row.game_day) === Number(episode?.game_day))
    .sort(byQueue);
}

// The cards on the table for one case; each card names its case in `screen_area.case_id`.
export function letterOfCreditCards(caseRow, rows = dataMartRows) {
  return rows
    .filter((row) => row?.object_type === LOC_CARD_OBJECT_TYPE && String(row.screen_area?.case_id) === String(caseRow?.id))
    .sort(byQueue);
}

export function letterOfCreditTutorial(episode, rows = dataMartRows) {
  return rows
    .filter((row) => row?.object_type === LOC_TUTORIAL_OBJECT_TYPE && row.title === episode?.title)
    .sort(byQueue);
}

export function isTriggerCard(card) {
  return card?.category === TRIGGER_CATEGORY;
}

export function cardKey(card) {
  return String(card?.screen_area?.key ?? card?.id);
}

// A stage holds the keys of its cards in the order the player added them.
export function emptyStage() {
  return { triggers: [], logic: LOGIC_AND, transactions: [] };
}

// The first stage that still lacks a trigger or a transaction, or -1 when every stage is whole.
export function incompleteStage(stages) {
  return stages.findIndex((stage) => !stage.triggers.length || !stage.transactions.length);
}

// How much of the client's deposit the transactions of the letter pay out.
export function letterAmount(stages, cards) {
  const prices = new Map(cards.map((card) => [cardKey(card), Number(card.price) || 0]));
  return stages.reduce((sum, stage) => sum + stage.transactions.reduce((part, key) => part + (prices.get(key) ?? 0), 0), 0);
}

const sameKeys = (left, right) => left.length === right.length && left.every((key) => right.includes(key));

// Compares the player's stages with the solution of the case, `screen_area.stages`. Returns null
// for a right letter, or the mentor trigger with what it concerns: the cards (`keys`) or the
// zero-based `stage`. The logic of a group with a single trigger does not matter.
export function letterOfCreditVerdict(caseRow, stages) {
  const solution = Array.isArray(caseRow?.screen_area?.stages) ? caseRow.screen_area.stages : [];
  const needed = new Set(solution.flatMap((stage) => [...stage.triggers, ...stage.transactions]));
  const used = stages.flatMap((stage) => [...stage.triggers, ...stage.transactions]);

  const extra = used.filter((key) => !needed.has(key));
  if (extra.length) return { trigger: LOC_DECOY, keys: extra };
  const missing = [...needed].filter((key) => !used.includes(key));
  if (missing.length) return { trigger: LOC_MISSING, keys: missing };

  // Every right card is in, and nothing else: what is left to go wrong is where they stand.
  const count = Math.max(stages.length, solution.length);
  for (let index = 0; index < count; index += 1) {
    const mine = stages[index];
    const right = solution[index];
    if (!mine || !right || !sameKeys(mine.triggers, right.triggers) || !sameKeys(mine.transactions, right.transactions)) {
      return { trigger: LOC_ORDER, stage: Math.min(index, stages.length - 1) };
    }
  }

  const logicStage = solution.findIndex((right, index) => (
    right.triggers.length > 1 && stages[index].logic !== (right.logic ?? LOGIC_AND)
  ));
  if (logicStage >= 0) return { trigger: LOC_LOGIC, stage: logicStage };
  return null;
}
