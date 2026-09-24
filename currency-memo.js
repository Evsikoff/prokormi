// «Валютное мемо»: instead of two equal pictures, a pair is a currency (its sign and name)
// and the flag and name of the place where people pay with it.

// Flags are drawn here in a 30 × 20 box: emoji flags are not drawn on Windows.
const star = (cx, cy, r, fill, turn = -90) => {
  const points = [];
  for (let index = 0; index < 10; index += 1) {
    const radius = index % 2 ? r * 0.4 : r;
    const angle = ((turn + index * 36) * Math.PI) / 180;
    points.push(`${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`);
  }
  return `<polygon points="${points.join(' ')}" fill="${fill}"/>`;
};

const stripes = (colors, vertical = false) => colors.map((color, index) => {
  const size = (vertical ? 30 : 20) / colors.length;
  return vertical
    ? `<rect x="${index * size}" y="0" width="${size + 0.02}" height="20" fill="${color}"/>`
    : `<rect x="0" y="${index * size}" width="30" height="${size + 0.02}" fill="${color}"/>`;
}).join('');

const FLAGS = {
  russia: stripes(['#fff', '#0039a6', '#d52b1e']),
  eu: `<rect width="30" height="20" fill="#003399"/>${Array.from({ length: 12 }, (_, index) => {
    const angle = (index * 30 * Math.PI) / 180;
    return star(15 + 6 * Math.sin(angle), 10 - 6 * Math.cos(angle), 1.05, '#ffcc00');
  }).join('')}`,
  usa: `${Array.from({ length: 13 }, (_, index) => `<rect x="0" y="${(index * 20) / 13}" width="30" height="${20 / 13 + 0.02}" fill="${index % 2 ? '#fff' : '#b22234'}"/>`).join('')}
    <rect width="12" height="${(20 * 7) / 13}" fill="#3c3b6e"/>
    ${Array.from({ length: 25 }, (_, index) => `<circle cx="${1.3 + (index % 5) * 2.05 + (Math.floor(index / 5) % 2) * 1}" cy="${1.2 + Math.floor(index / 5) * 2.1}" r="0.5" fill="#fff"/>`).join('')}`,
  japan: '<rect width="30" height="20" fill="#fff"/><circle cx="15" cy="10" r="6" fill="#bc002d"/>',
  britain: `<rect width="30" height="20" fill="#012169"/>
    <path d="M0 0L30 20M30 0L0 20" stroke="#fff" stroke-width="4"/>
    <path d="M0 0L30 20M30 0L0 20" stroke="#c8102e" stroke-width="1.4"/>
    <path d="M15 0V20M0 10H30" stroke="#fff" stroke-width="6.5"/>
    <path d="M15 0V20M0 10H30" stroke="#c8102e" stroke-width="3.8"/>`,
  india: `${stripes(['#ff9933', '#fff', '#138808'])}
    <circle cx="15" cy="10" r="2.6" fill="none" stroke="#000080" stroke-width="0.5"/>
    ${Array.from({ length: 12 }, (_, index) => {
    const angle = (index * 15 * Math.PI) / 180;
    return `<path d="M${(15 - 2.6 * Math.cos(angle)).toFixed(2)} ${(10 - 2.6 * Math.sin(angle)).toFixed(2)}L${(15 + 2.6 * Math.cos(angle)).toFixed(2)} ${(10 + 2.6 * Math.sin(angle)).toFixed(2)}" stroke="#000080" stroke-width="0.25"/>`;
  }).join('')}`,
  switzerland: '<rect width="30" height="20" fill="#da291c"/><path d="M13.2 4.5h3.6v3.7h3.7v3.6h-3.7v3.7h-3.6v-3.7H9.5V8.2h3.7z" fill="#fff"/>',
  turkey: `<rect width="30" height="20" fill="#e30a17"/>
    <circle cx="11" cy="10" r="5" fill="#fff"/><circle cx="12.25" cy="10" r="4" fill="#e30a17"/>
    ${star(17.6, 10, 2.3, '#fff', 180)}`,
  brazil: `<rect width="30" height="20" fill="#009b3a"/>
    <path d="M15 2.2L27.4 10L15 17.8L2.6 10z" fill="#fedf00"/>
    <circle cx="15" cy="10" r="4.9" fill="#002776"/>
    <path d="M10.3 8.9Q15 7.8 19.8 11" fill="none" stroke="#fff" stroke-width="0.9"/>`,
  georgia: `<rect width="30" height="20" fill="#fff"/>
    <path d="M15 0V20M0 10H30" stroke="#ff0000" stroke-width="3"/>
    ${[[7.5, 5], [22.5, 5], [7.5, 15], [22.5, 15]].map(([x, y]) => `<path d="M${x} ${y - 2.3}V${y + 2.3}M${x - 2.3} ${y}H${x + 2.3}" stroke="#ff0000" stroke-width="1.3"/>`).join('')}`,
  kazakhstan: `<rect width="30" height="20" fill="#00afca"/>
    <path d="M1.4 1.5v17" stroke="#fec50c" stroke-width="1.2" stroke-dasharray="1.4 0.7"/>
    ${Array.from({ length: 16 }, (_, index) => {
    const angle = (index * 22.5 * Math.PI) / 180;
    return `<path d="M${(15 + 3.4 * Math.cos(angle)).toFixed(2)} ${(8 + 3.4 * Math.sin(angle)).toFixed(2)}L${(15 + 4.7 * Math.cos(angle)).toFixed(2)} ${(8 + 4.7 * Math.sin(angle)).toFixed(2)}" stroke="#fec50c" stroke-width="0.6"/>`;
  }).join('')}
    <circle cx="15" cy="8" r="2.8" fill="#fec50c"/>
    <path d="M8.5 13.2Q15 17.4 21.5 13.2Q15 15.3 8.5 13.2z" fill="#fec50c"/>`,
};

export const CURRENCY_PAIRS = [
  { key: 'rub', sign: '₽', currency: 'Российский рубль', place: 'Россия', flag: 'russia' },
  { key: 'eur', sign: '€', currency: 'Евро', place: 'Европейский союз', flag: 'eu' },
  { key: 'usd', sign: '$', currency: 'Доллар США', place: 'США', flag: 'usa' },
  { key: 'jpy', sign: '¥', currency: 'Японская иена', place: 'Япония', flag: 'japan' },
  { key: 'gbp', sign: '£', currency: 'Фунт стерлингов', place: 'Великобритания', flag: 'britain' },
  { key: 'inr', sign: '₹', currency: 'Индийская рупия', place: 'Индия', flag: 'india' },
  { key: 'chf', sign: 'Fr', currency: 'Швейцарский франк', place: 'Швейцария', flag: 'switzerland' },
  { key: 'try', sign: '₺', currency: 'Турецкая лира', place: 'Турция', flag: 'turkey' },
  { key: 'brl', sign: 'R$', currency: 'Бразильский реал', place: 'Бразилия', flag: 'brazil' },
  { key: 'gel', sign: '₾', currency: 'Грузинский лари', place: 'Грузия', flag: 'georgia' },
  { key: 'kzt', sign: '₸', currency: 'Казахстанский тенге', place: 'Казахстан', flag: 'kazakhstan' },
];

// 8 pairs make a 4 × 4 board, which still fits a phone held upright.
export const MEMO_PAIR_COUNT = 8;

export function flagSvg(flag) {
  return `<svg viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" preserveAspectRatio="xMidYMid slice">${FLAGS[flag] ?? ''}</svg>`;
}

function shuffle(items, random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

// A new board: MEMO_PAIR_COUNT random pairs, every pair as a currency card and a place card, shuffled.
export function dealCurrencyMemo(random = Math.random) {
  const pairs = shuffle(CURRENCY_PAIRS, random).slice(0, MEMO_PAIR_COUNT);
  return shuffle(pairs.flatMap((pair) => [
    { pair: pair.key, kind: 'currency', ...pair },
    { pair: pair.key, kind: 'place', ...pair },
  ]), random);
}
