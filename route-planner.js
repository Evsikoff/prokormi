// «Поездка на тренировку»: the player builds two routes over the public transport of the city,
// one for coach Max and one for themselves with the monster, to the same tennis court.
// Points and legs of the map are data mart rows of the episode (linked by `title`).

export const ROUTE_POINT_OBJECT_TYPE = 'Route map point';
export const ROUTE_LEG_OBJECT_TYPE = 'Route leg';
export const ROUTE_TUTORIAL_OBJECT_TYPE = 'Route planner tutorial';
export const TRAINER_LINE_OBJECT_TYPE = 'Trainer line';

// Both leave at 10:00; the court hour, already paid for, starts at 11:00.
export const DEPARTURE_MINUTES = 10 * 60;
export const TRAINING_START_MINUTES = 11 * 60;
// Max's waiting is billed per started block of minutes: a coin for every five.
export const WAITING_BLOCK_MINUTES = 5;
export const WAITING_BLOCK_PRICE = 1;

export const TRAVELLERS = {
  coach: { kind: 'coach', label: 'Макс', icon: '🏋️' },
  own: { kind: 'home', label: 'Мы', icon: '🏠' },
};

export const ROUTE_MODES = {
  bus: { icon: '🚌', label: 'Автобус' },
  tram: { icon: '🚋', label: 'Трамвай' },
  metro: { icon: '🚇', label: 'Метро' },
  taxi: { icon: '🚕', label: 'Такси' },
  walk: { icon: '🚶', label: 'Пешком' },
};

export function routeMap(rows, episode) {
  const own = (row) => row.title === episode?.title;
  const points = new Map((Array.isArray(rows) ? rows : [])
    .filter((row) => row?.object_type === ROUTE_POINT_OBJECT_TYPE && own(row) && row.screen_area?.key)
    .map((row) => [row.screen_area.key, {
      id: row.id,
      key: row.screen_area.key,
      kind: row.screen_area.kind,
      name: String(row.text || row.screen_area.key),
      icon: row.screen_area.icon || '📍',
      x: Number(row.screen_area.x) || 0,
      y: Number(row.screen_area.y) || 0,
      labelSide: row.screen_area.label || 'bottom',
    }]));
  const legs = (Array.isArray(rows) ? rows : [])
    .filter((row) => row?.object_type === ROUTE_LEG_OBJECT_TYPE && own(row)
      && points.has(row.screen_area?.from) && points.has(row.screen_area?.to))
    .sort((left, right) => (Number(left.queue) || 0) - (Number(right.queue) || 0) || Number(left.id) - Number(right.id))
    .map((row) => ({
      id: row.id,
      from: row.screen_area.from,
      to: row.screen_area.to,
      mode: ROUTE_MODES[row.screen_area.mode] ? row.screen_area.mode : 'bus',
      minutes: Number(row.screen_area.minutes) || 0,
      price: Number(row.price) || 0,
      name: String(row.text || ''),
      bend: Number(row.screen_area.bend) || 0,
      // Where along the leg its badge sits, so the badges of two legs side by side do not overlap.
      badge: Number(row.screen_area.badge) || 0.5,
    }));
  return { points, legs };
}

export function startPoint(map, traveller) {
  const kind = TRAVELLERS[traveller]?.kind;
  return [...map.points.values()].find((point) => point.kind === kind) ?? null;
}

// A route is a list of leg ids in travel order; each leg can be ridden either way.
function walk(map, traveller, route) {
  const start = startPoint(map, traveller);
  const nodes = start ? [start.key] : [];
  const legs = [];
  for (const id of route) {
    const leg = map.legs.find((item) => item.id === id);
    const at = nodes[nodes.length - 1];
    if (!leg || (leg.from !== at && leg.to !== at)) break;
    legs.push(leg);
    nodes.push(leg.from === at ? leg.to : leg.from);
  }
  return { nodes, legs };
}

// The legs the route can go on with: from its last point, never back to a point it has passed,
// never through the other traveller's start, and nothing after a court, where every route ends.
export function nextLegs(map, traveller, route) {
  const { nodes } = walk(map, traveller, route);
  const at = nodes[nodes.length - 1];
  if (!at || map.points.get(at)?.kind === 'court') return [];
  const visited = new Set(nodes);
  return map.legs.filter((leg) => {
    if (leg.from !== at && leg.to !== at) return false;
    const next = leg.from === at ? leg.to : leg.from;
    const kind = map.points.get(next)?.kind;
    return !visited.has(next) && (kind === 'stop' || kind === 'court');
  });
}

export function routeSummary(map, traveller, route) {
  const { nodes, legs } = walk(map, traveller, route);
  const end = map.points.get(nodes[nodes.length - 1]) ?? null;
  const minutes = legs.reduce((sum, leg) => sum + leg.minutes, 0);
  return {
    traveller,
    legs,
    nodes,
    end,
    court: end?.kind === 'court' ? end : null,
    minutes,
    price: legs.reduce((sum, leg) => sum + leg.price, 0),
    arrival: DEPARTURE_MINUTES + minutes,
    late: Math.max(0, DEPARTURE_MINUTES + minutes - TRAINING_START_MINUTES),
    taxi: legs.some((leg) => leg.mode === 'taxi'),
  };
}

export function waitingFee(minutes) {
  return Math.ceil(Math.max(0, minutes) / WAITING_BLOCK_MINUTES) * WAITING_BLOCK_PRICE;
}

// Both routes and what they cost together. Max waits from his arrival until ours, and we pay for it.
export function planSummary(map, coachRoute, ownRoute) {
  const coach = routeSummary(map, 'coach', coachRoute);
  const own = routeSummary(map, 'own', ownRoute);
  const complete = Boolean(coach.court && own.court);
  const sameCourt = complete && coach.court.key === own.court.key;
  const waitMinutes = sameCourt ? Math.max(0, own.arrival - coach.arrival) : 0;
  const waitPrice = waitingFee(waitMinutes);
  return {
    coach,
    own,
    complete,
    sameCourt,
    waitMinutes,
    waitPrice,
    total: coach.price + own.price + waitPrice,
    late: Math.max(coach.late, own.late),
  };
}

function allRoutes(map, traveller) {
  const found = [];
  const extend = (route) => {
    const summary = routeSummary(map, traveller, route);
    if (summary.court) {
      found.push(route);
      return;
    }
    for (const leg of nextLegs(map, traveller, route)) extend([...route, leg.id]);
  };
  extend([]);
  return found;
}

// The cheapest plan that brings both to one court by 11:00, found by trying every pair of routes:
// the map is small, so the plain search the mentor recommends is also what the game does.
export function optimalPlan(map) {
  let best = null;
  const coachRoutes = allRoutes(map, 'coach');
  const ownRoutes = allRoutes(map, 'own');
  for (const coach of coachRoutes) {
    for (const own of ownRoutes) {
      const plan = planSummary(map, coach, own);
      if (!plan.sameCourt || plan.late > 0) continue;
      if (!best || plan.total < best.total) best = plan;
    }
  }
  return best;
}

// Critical mistakes block the plan and send the player back to the map; the rest are comments on
// a plan that is accepted. Every verdict is the `trigger` of a mentor reply.
export const ROUTE_CRITICAL_VERDICTS = new Set(['route-courts', 'route-late', 'route-money']);
// A plan that works but is not the cheapest goes back for another try too, but only this many
// times: after that the mentor accepts it with a comment. Its reply for a retry is `<verdict>-retry`.
export const ROUTE_SUBOPTIMAL_VERDICTS = new Set(['route-taxi', 'route-waiting', 'route-overpay']);
export const ROUTE_SUBOPTIMAL_RETRIES = 3;

export function routeVerdict(plan, optimum, wallet) {
  if (!plan.sameCourt) return 'route-courts';
  if (plan.late > 0) return 'route-late';
  if (plan.total > Math.max(0, wallet.pocket) + Math.max(0, wallet.savings)) return 'route-money';
  if (optimum && plan.total <= optimum.total) return 'route-optimal';
  if (plan.coach.taxi || plan.own.taxi) return 'route-taxi';
  if (plan.waitPrice > 0) return 'route-waiting';
  return 'route-overpay';
}

export function formatClock(minutes) {
  const hours = Math.floor(minutes / 60);
  return `${hours}:${String(minutes % 60).padStart(2, '0')}`;
}
