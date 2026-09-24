// «Активы и пассивы»: the player sorts things one by one. An asset brings benefit or pleasure;
// a liability only takes money to own. Junk is a liability too, since keeping it costs money,
// and so is an asset bought in an unreasonable number, like five kettles.

export const ASSET = 'asset';
export const LIABILITY = 'liability';

// Why a thing is an asset: it is useful, or it only brings joy (the one players tend to miss).
export const ASSET_REASONS = {
  benefit: 'Польза',
  pleasure: 'Удовольствие',
};

// Why a thing is a liability; each dealt deck gets some of every kind.
export const LIABILITY_REASONS = {
  excess: 'Слишком много',
  junk: 'Хлам',
  idle: 'Только тратит деньги',
};

export const START_CAPITAL = 100;

// `coins` is how much the choice moves the virtual capital: up when right, down when wrong.
// `twin` names the asset that the same thing is when there is just one of it.
export const PROPERTY_ITEMS = [
  { key: 'bike', icon: '🚲', name: 'Велосипед', note: 'Катаешься на нём по выходным, а в хорошую погоду ездишь в школу.', kind: ASSET, why: 'benefit', coins: 10,
    reason: 'Велосипед приносит и пользу, и удовольствие — это актив.' },
  { key: 'racket', icon: '🎾', name: 'Теннисная ракетка', note: 'Одна-единственная — та, с которой ходишь на тренировки.', kind: ASSET, why: 'benefit', coins: 8,
    reason: 'Без ракетки нет тренировок: она нужна и радует — актив.' },
  { key: 'kettle', icon: '🫖', name: 'Чайник', note: 'Каждое утро в нём кипятят воду для чая.', kind: ASSET, why: 'benefit', coins: 6,
    reason: 'Одним чайником пользуются каждый день — это актив.' },
  { key: 'jacket', icon: '🧥', name: 'Тёплая куртка', note: 'По размеру, в ней ходишь всю зиму.', kind: ASSET, why: 'benefit', coins: 9,
    reason: 'Куртка греет всю зиму — польза очевидна, актив.' },
  { key: 'guitar', icon: '🎸', name: 'Гитара', note: 'Учишься играть и занимаешься каждый вечер.', kind: ASSET, why: 'benefit', coins: 9,
    reason: 'На гитаре играют каждый день: и польза, и удовольствие — актив.' },
  { key: 'books', icon: '📚', name: 'Книги с приключениями', note: 'Перечитываешь любимые и даёшь почитать друзьям.', kind: ASSET, why: 'benefit', coins: 6,
    reason: 'Книги читают и перечитывают — они приносят пользу и удовольствие, это актив.' },
  { key: 'bear', icon: '🧸', name: 'Любимый плюшевый мишка', note: 'Старенький, но с ним уютно засыпать.', kind: ASSET, why: 'pleasure', coins: 5,
    reason: 'Денег мишка не приносит, но дарит радость. Удовольствие тоже считается — это актив.' },
  { key: 'boardgame', icon: '🎲', name: 'Настольная игра', note: 'По пятницам вся семья играет в неё вечером.', kind: ASSET, why: 'pleasure', coins: 6,
    reason: 'Игра собирает семью каждую неделю — это удовольствие, значит актив.' },
  { key: 'bowl', icon: '🥣', name: 'Миска монстрика', note: 'Из неё монстрик ест каждый день.', kind: ASSET, why: 'benefit', coins: 5,
    reason: 'Без миски монстрика не накормить — нужная вещь, актив.' },
  { key: 'plant', icon: '🪴', name: 'Комнатный цветок', note: 'Стоит на подоконнике и радует глаз, а поливать его почти ничего не стоит.', kind: ASSET, why: 'pleasure', coins: 5,
    reason: 'Цветок радует каждый день — удовольствие делает его активом.' },
  { key: 'sneakers', icon: '👟', name: 'Кроссовки', note: 'По размеру, в них бегаешь на физкультуре.', kind: ASSET, why: 'benefit', coins: 7,
    reason: 'В кроссовках бегают на физкультуре — это нужная вещь, актив.' },
  { key: 'lamp', icon: '💡', name: 'Настольная лампа', note: 'Без неё вечером не сделать уроки.', kind: ASSET, why: 'benefit', coins: 5,
    reason: 'Лампа помогает делать уроки каждый вечер — актив.' },

  { key: 'kettles', twin: 'kettle', icon: '🫖', count: 5, name: 'Пять чайников', note: 'Кипятят воду в одном, остальные четыре занимают целую полку.', kind: LIABILITY, why: 'excess', coins: 8,
    reason: 'Один чайник — актив, но пять — это слишком: четыре лишних только занимают место. Вещь в неразумном количестве становится пассивом.' },
  { key: 'rackets', twin: 'racket', icon: '🎾', count: 6, name: 'Шесть одинаковых ракеток', note: 'Играешь одной, остальные пылятся в шкафу.', kind: LIABILITY, why: 'excess', coins: 10,
    reason: 'Играть можно только одной ракеткой. Пять лишних — пассив: деньги потрачены, а пользы нет.' },
  { key: 'jackets', twin: 'jacket', icon: '🧥', count: 7, name: 'Семь зимних курток', note: 'Носишь одну, остальные висят в шкафу.', kind: LIABILITY, why: 'excess', coins: 10,
    reason: 'Зимой нужна одна тёплая куртка. Семь курток — это лишнее количество, значит пассив.' },
  { key: 'bikes', twin: 'bike', icon: '🚲', count: 3, name: 'Три велосипеда', note: 'Катаешься на одном, а два стоят на балконе.', kind: LIABILITY, why: 'excess', coins: 12,
    reason: 'Кататься можно только на одном велосипеде. Лишние два занимают балкон — пассив.' },
  { key: 'umbrellas', icon: '☂️', count: 9, name: 'Девять зонтов', note: 'Каждый купили в дождь, когда забыли свой дома.', kind: LIABILITY, why: 'excess', coins: 8,
    reason: 'Зонт нужен один, а девять — это деньги, потраченные из-за забывчивости. Лишнее количество — пассив.' },

  { key: 'toys', icon: '📦', name: 'Коробки со сломанными игрушками', note: 'Третий год стоят в кладовке.', kind: LIABILITY, why: 'junk', coins: 7,
    reason: 'Это хлам: играть в него нельзя, а место в кладовке тоже стоит денег. Пассив.' },
  { key: 'oldsneakers', twin: 'sneakers', icon: '👟', name: 'Кроссовки, из которых ты вырос', note: 'Малы на два размера и лежат под кроватью.', kind: LIABILITY, why: 'junk', coins: 5,
    reason: 'Надеть их уже нельзя — это хлам, а хранить хлам тоже платно. Пассив. Лучше отдать тем, кому они впору.' },
  { key: 'brokenbike', twin: 'bike', icon: '🚲', name: 'Сломанный велосипед', note: 'Без колеса, стоит на балконе уже два года.', kind: LIABILITY, why: 'junk', coins: 8,
    reason: 'На нём не покатаешься, а балкон занят. Хлам — пассив.' },
  { key: 'tv', icon: '📺', name: 'Старый телевизор', note: 'Не включается, но стоит в кладовке «на всякий случай».', kind: LIABILITY, why: 'junk', coins: 7,
    reason: '«На всякий случай» — любимое оправдание хлама. Пользы нет, место занято — пассив.' },
  { key: 'chargers', icon: '🔌', name: 'Коробка старых зарядок', note: 'От телефонов, которых давно нет.', kind: LIABILITY, why: 'junk', coins: 5,
    reason: 'Зарядки не подходят ни к одному телефону — это хлам, пассив.' },
  { key: 'printer', icon: '🖨️', name: 'Сломанный принтер', note: 'Не печатает, но выкинуть жалко.', kind: LIABILITY, why: 'junk', coins: 6,
    reason: 'Жалость — не польза. Сломанный принтер — хлам, а значит пассив.' },

  { key: 'car', icon: '🚗', name: 'Машина в гараже', note: 'Никто на ней не ездит, а за гараж и страховку платят каждый месяц.', kind: LIABILITY, why: 'idle', coins: 15,
    reason: 'Машина, на которой не ездят, только забирает деньги на гараж и страховку. Пассив.' },
  { key: 'dacha', icon: '🏚️', name: 'Заброшенная дача', note: 'Туда никто не ездит, а налог и охрану оплачивать надо.', kind: LIABILITY, why: 'idle', coins: 14,
    reason: 'Дача никого не радует и не кормит, но каждый год требует денег. Пассив.' },
  { key: 'aquarium', icon: '🐠', name: 'Пустой аквариум', note: 'Рыбок давно нет, а лампа и фильтр работают круглые сутки.', kind: LIABILITY, why: 'idle', coins: 9,
    reason: 'Без рыбок аквариум никого не радует, зато тратит электричество. Пассив.' },
  { key: 'treadmill', icon: '🏃', name: 'Беговая дорожка', note: 'Стоит в углу, на ней сушат одежду.', kind: LIABILITY, why: 'idle', coins: 11,
    reason: 'На дорожке не бегают — она только занимает полкомнаты. Пассив.' },
  { key: 'dustyguitar', twin: 'guitar', icon: '🎸', name: 'Гитара на шкафу', note: 'Купили, чтобы научиться, но так ни разу и не сыграли.', kind: LIABILITY, why: 'idle', coins: 8,
    reason: 'Та же гитара, но на ней не играют: ни пользы, ни удовольствия — пассив. Важна не вещь, а то, как ей пользуются.' },
];

// 12 things: 6 assets and 6 liabilities, two of every kind of liability.
export const DECK_ASSETS = 6;
export const DECK_LIABILITIES_PER_KIND = 2;

function shuffle(items, random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

// A new deck. One liability always comes with its twin asset (a kettle and five kettles),
// so the player sees that the same thing can be either, depending on how it is owned.
export function dealPropertyDeck(random = Math.random) {
  const liabilities = Object.keys(LIABILITY_REASONS).flatMap((why) => shuffle(
    PROPERTY_ITEMS.filter((item) => item.kind === LIABILITY && item.why === why),
    random,
  ).slice(0, DECK_LIABILITIES_PER_KIND));
  const twins = new Set(liabilities.map((item) => item.twin).filter(Boolean));
  const twin = shuffle([...twins], random)[0];
  const assets = [
    ...PROPERTY_ITEMS.filter((item) => item.key === twin),
    ...shuffle(PROPERTY_ITEMS.filter((item) => item.kind === ASSET && item.key !== twin), random),
  ].slice(0, DECK_ASSETS);
  return shuffle([...assets, ...liabilities], random);
}

// The other thing of a pair like a kettle and five kettles, if the deck has it.
export function twinInDeck(item, deck) {
  return deck.find((other) => other !== item && (other.key === item.twin || other.twin === item.key)) ?? null;
}
