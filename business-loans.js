import dataMartRows from './monster_data_mart_rows.json';

// The business loans episode: the bank's decision system is down and the player sits at the
// father's desk. Every application is one of four kinds, and each kind has its own right answer:
// an obviously failing idea is refused, a disputable one gets a first tranche (money only up to
// the stage where it becomes clear whether the idea works), a big corporation gets the whole sum
// at a rate a little above the key rate, a good small business gets the whole sum with a grace
// period and a rate that leaves it room to grow.
export const LOAN_APPLICATION_OBJECT_TYPE = 'Business loan application';
export const LOAN_TUTORIAL_OBJECT_TYPE = 'Business loan tutorial';

export const LOAN_FAIL = 'fail';
export const LOAN_RISKY = 'risky';
export const LOAN_CORPORATION = 'corporation';
export const LOAN_SMALL = 'small';

export const LOAN_REFUSE = 'refuse';
export const LOAN_TRANCHE = 'tranche';
export const LOAN_FULL = 'full';
export const LOAN_DECISION_LABELS = {
  [LOAN_REFUSE]: 'Отказ',
  [LOAN_TRANCHE]: 'Первый транш',
  [LOAN_FULL]: 'Вся сумма',
};

// The bank borrows at the key rate itself, so a loan at it or below only loses money.
export const KEY_RATE = 14;
// A corporation with big assets is welcome at any bank: above this it goes to a competitor.
export const CORPORATION_RATE_MAX = 18;
// A small business pays a bigger risk premium, but above this the interest eats its profit.
export const SMALL_RATE_MAX = 20;
export const RATE_MIN = 5;
export const RATE_MAX = 30;
export const GRACE_MONTHS = [0, 6, 12];

// Mentor replies, keyed by `trigger` with the episode title in the data mart.
export const LOAN_FAIL_FUNDED = 'loan-fail-funded';
export const LOAN_RISKY_REFUSED = 'loan-risky-refused';
export const LOAN_RISKY_FULL = 'loan-risky-full';
export const LOAN_TRANCHE_EARLY = 'loan-tranche-early';
export const LOAN_TRANCHE_LATE = 'loan-tranche-late';
export const LOAN_GOOD_REFUSED = 'loan-good-refused';
export const LOAN_TRANCHE_NEEDLESS = 'loan-tranche-needless';
export const LOAN_RATE_BELOW_KEY = 'loan-rate-below-key';
export const LOAN_CORPORATION_RATE_HIGH = 'loan-corp-rate-high';
export const LOAN_CORPORATION_GRACE = 'loan-corp-grace';
export const LOAN_SMALL_RATE_HIGH = 'loan-small-rate-high';
export const LOAN_SMALL_NO_GRACE = 'loan-small-no-grace';
// The first right decision of each kind: `loan-right-<kind>`.
export const loanRightTrigger = (kind) => `loan-right-${kind}`;

const byQueue = (left, right) => (Number(left.queue) || 0) - (Number(right.queue) || 0) || Number(left.id) - Number(right.id);

// The applications of the episode: the rows of its game day, in `queue` order.
export function loanApplications(episode, rows = dataMartRows) {
  return rows
    .filter((row) => row?.object_type === LOAN_APPLICATION_OBJECT_TYPE && Number(row.game_day) === Number(episode?.game_day))
    .sort(byQueue);
}

export function loanTutorial(episode, rows = dataMartRows) {
  return rows
    .filter((row) => row?.object_type === LOAN_TUTORIAL_OBJECT_TYPE && row.title === episode?.title)
    .sort(byQueue);
}

export function loanKind(application) {
  return application?.screen_area?.kind ?? LOAN_FAIL;
}

export function loanPlan(application) {
  return Array.isArray(application?.screen_area?.plan) ? application.screen_area.plan : [];
}

// How much the bank pays out: nothing on refusal, the first `stages` of the plan for a tranche.
export function loanAmount(application, { decision, stages = 0 }) {
  if (decision === LOAN_FULL) return Number(application?.price) || 0;
  if (decision !== LOAN_TRANCHE) return 0;
  return loanPlan(application).slice(0, stages).reduce((sum, stage) => sum + (Number(stage.amount) || 0), 0);
}

// Interest for one year: what the client pays, and what is left to the bank after its own
// money at the key rate. Negative `bank` is a loss.
export function yearlyInterest(amount, rate) {
  return {
    client: (amount * rate) / 100,
    bank: (amount * (rate - KEY_RATE)) / 100,
  };
}

// Null for a right decision, or the mentor trigger of the first mistake: the decision itself is
// checked before its terms, since the right terms of a wrong decision do not matter.
export function loanVerdict(application, { decision, stages = 0, rate = KEY_RATE, grace = 0 }) {
  const kind = loanKind(application);
  if (kind === LOAN_FAIL) return decision === LOAN_REFUSE ? null : { trigger: LOAN_FAIL_FUNDED };

  if (kind === LOAN_RISKY) {
    if (decision === LOAN_REFUSE) return { trigger: LOAN_RISKY_REFUSED };
    if (decision === LOAN_FULL) return { trigger: LOAN_RISKY_FULL };
    const checkpoint = Number(application.screen_area?.checkpoint) || 1;
    if (stages < checkpoint) return { trigger: LOAN_TRANCHE_EARLY };
    if (stages > checkpoint) return { trigger: LOAN_TRANCHE_LATE };
    return null;
  }

  if (decision === LOAN_REFUSE) return { trigger: LOAN_GOOD_REFUSED };
  if (decision === LOAN_TRANCHE) return { trigger: LOAN_TRANCHE_NEEDLESS };
  if (rate <= KEY_RATE) return { trigger: LOAN_RATE_BELOW_KEY };
  if (kind === LOAN_CORPORATION) {
    if (rate > CORPORATION_RATE_MAX) return { trigger: LOAN_CORPORATION_RATE_HIGH };
    if (grace > 0) return { trigger: LOAN_CORPORATION_GRACE };
    return null;
  }
  if (rate > SMALL_RATE_MAX) return { trigger: LOAN_SMALL_RATE_HIGH };
  if (grace <= 0) return { trigger: LOAN_SMALL_NO_GRACE };
  return null;
}
