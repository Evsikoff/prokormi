// Russian wording of the data mart triggers, for the jury panel. The game itself keeps matching the
// English keys; a `trigger_ru` cell in the data mart, when present, wins over this dictionary.

const TRIGGERS_RU = {
  // Game state (game-triggers.js)
  'Start of the day': 'Начало игрового дня',
  'The monster is full': 'Монстрик сыт',
  'A pure monster': 'Монстрик чистый',
  'The monster is clean and well-fed': 'Монстрик чистый и сытый',
  'End of the additional tasks tutorial': 'Пройден туториал дополнительных заданий',
  'The beginning of the seventh day': 'Начался седьмой день',
  'An attempt to clean the monster': 'Попытка почистить монстрика',
  'A successful purchase at the toy store': 'Успешная покупка в магазине игрушек',
  'A hungry monster and no food': 'Монстрик голоден, а корма нет',
  'A hungry monster and enough food': 'Монстрик голоден, а корма хватает',
  'A dirty monster and a cleaner': 'Монстрик грязный, а прибор для козявок есть',
  'A cleaner is back from repair': 'Прибор для козявок вернулся из ремонта',

  // Room errors
  'Feeding without suitable food': 'Кормление без подходящего корма',
  'Feeding a fed monster': 'Кормление сытого монстрика',
  'Cleaning a clean monster': 'Чистка чистого монстрика',
  'Cleaning without a cleaner': 'Чистка без прибора для козявок',

  // Food store
  approved: 'Куплен правильный корм',
  'too-many': 'Правильный корм, но больше двух пачек',
  'low-quality': 'Корм с плохим составом',
  overpaying: 'Переплата за слишком хороший корм',
  'unclear-quality': 'Корм без указанного состава',

  // First budget
  'budget-required-low': 'Мало на обязательные расходы',
  'budget-fun-low': 'Мало на веселье',
  'budget-savings-low': 'Мало в копилку',
  'budget-approved': 'Бюджет утверждён',

  // Feeding
  'feeding-approved': 'Насыпано в норму',
  'feeding-too-little': 'Насыпано слишком мало',
  'feeding-too-much': 'Насыпано слишком много',

  // Park walk
  'park-tennis-court': 'Монстрик у теннисного корта',
  'park-icecream-kiosk': 'Монстрик у киоска с мороженым',
  'park-event-board': 'Монстрик у афиши',
  'park-nothing': 'В парке ничего не куплено',
  'park-icecream': 'Куплено только мороженое',
  'park-icecream-ride': 'Куплены мороженое и аттракцион',
  'park-racket': 'Куплена ракетка',

  // Tech store
  'cleaner-approved': 'Куплен выгодный прибор для козявок',
  'cleaner-cheap': 'Куплен дешёвый прибор с дорогими картриджами',
  'cleaner-overpriced': 'Переплата за такой же прибор',
  'cleaner-refill-first': 'Картридж без прибора',
  'cleaner-already': 'Второй прибор, когда первый уже есть',

  // Ear cleaning
  'cleaning-joke': 'Начало чистки ушей',
  'cleaning-thanks': 'Уши почищены',

  // Budget reviews
  'budget-review-indivisible': 'Итоги: корм продаётся целыми пачками',
  'budget-review-food-short': 'Итоги: корма не хватило',
  'budget-review-hungry': 'Итоги: день закончен с голодным монстриком',
  'budget-review-income': 'Итоги: доходов больше плана',
  'budget-review-overspent': 'Итоги: траты больше плана',
  'budget-review-underspent': 'Итоги: траты меньше плана',
  'budget-review-borrowed': 'Итоги: брались монеты из копилки',
  'budget-review-on-plan': 'Итоги: траты точно по плану',
  'budget-review-alone': 'Итоги: дальше без ментора',

  // Father
  'father-angry': 'Папа сердится',
  'father-offer': 'Папа предлагает',
  'father-alarmed': 'Папа встревожен',
  'father-request': 'Папа просит о помощи',
  'father-thanks': 'Папа благодарит',

  // Tennis estimate
  'estimate-missing-test': 'В смете нет пробного занятия или корта',
  'estimate-recurring-early': 'Абонементы и подписки раньше проверки',
  'estimate-premature-extras': 'Дорогие покупки раньше проверки',
  'estimate-approved': 'Смета утверждена',

  // Letters of credit
  'loc-intro-what': 'Что такое аккредитив',
  'loc-intro-how': 'Как собирать аккредитив',
  'loc-decoy': 'В аккредитиве лишнее условие',
  'loc-missing': 'В аккредитиве не хватает условия',
  'loc-order': 'Этапы аккредитива в неверном порядке',
  'loc-logic': 'Неверная связка «И» / «ИЛИ»',
  'loc-solved': 'Аккредитив собран верно',

  // Route planner
  'route-intro-what': 'Что такое оптимальное решение',
  'route-intro-how': 'Как искать оптимальный маршрут',
  'route-courts': 'Тренер и игрок едут на разные корты',
  'route-late': 'Кто-то опаздывает к одиннадцати',
  'route-money': 'На маршрут не хватает монет',
  'route-taxi': 'План с лишним такси',
  'route-waiting': 'Тренер ждёт за счёт игрока',
  'route-overpay': 'Есть план дешевле',
  'route-optimal': 'Оптимальный маршрут',
  'route-taxi-retry': 'Повторная попытка: лишнее такси',
  'route-waiting-retry': 'Повторная попытка: тренер ждёт',
  'route-overpay-retry': 'Повторная попытка: есть план дешевле',

  // Assets and liabilities
  'assets-intro-what': 'Что такое активы и пассивы',
  'assets-intro-how': 'Подсказки про хлам и радость',
  'assets-wrong-excess': 'Лишние копии вещи отнесены к активам',
  'assets-wrong-junk': 'Хлам отнесён к активам',
  'assets-wrong-idle': 'Неиспользуемая дорогая вещь отнесена к активам',
  'assets-wrong-benefit': 'Полезная вещь отнесена к пассивам',
  'assets-wrong-pleasure': 'Вещь для радости отнесена к пассивам',
  'assets-twins': 'Одна вещь и в активах, и в пассивах',
  'assets-perfect': 'Всё разложено без ошибок',
  'assets-done': 'Всё разложено, ошибки исправлены',

  // Business loans
  'loan-intro-what': 'Что такое кредит',
  'loan-intro-how': 'Четыре вида заявок',
  'loan-fail-funded': 'Деньги выданы провальной идее',
  'loan-risky-refused': 'Отказ спорной идее',
  'loan-risky-full': 'Спорной идее выдана вся сумма',
  'loan-tranche-early': 'Транш слишком маленький',
  'loan-tranche-late': 'Транш слишком большой',
  'loan-good-refused': 'Отказ надёжному заёмщику',
  'loan-tranche-needless': 'Транш надёжному заёмщику',
  'loan-rate-below-key': 'Ставка не выше ключевой',
  'loan-corp-rate-high': 'Слишком высокая ставка для корпорации',
  'loan-corp-grace': 'Ненужная отсрочка корпорации',
  'loan-small-rate-high': 'Слишком высокая ставка для малого бизнеса',
  'loan-small-no-grace': 'Малому бизнесу не дана отсрочка',
  'loan-right-fail': 'Верный отказ провальной идее',
  'loan-right-risky': 'Верный первый транш спорной идее',
  'loan-right-corporation': 'Верные условия для корпорации',
  'loan-right-small': 'Верные условия для малого бизнеса',
  'loan-perfect': 'Все заявки без ошибок',
  'loan-done': 'Все заявки разобраны, ошибки исправлены',

  // Toy store
  'toy-age-rattle': 'Игрушка для малышей',
  'toy-age-puzzle': 'Игрушка для старшего возраста',
  'toy-collection': 'Покупка ради коллекции',
  'toy-advertising': 'Покупка из-за рекламы',
  'toy-impulse': 'Импульсивная покупка у кассы',
  'toy-prediction': 'Прогноз не сходится с биркой',
  'toy-insufficient': 'Не хватает монет на покупки',
  'toy-approved': 'Удачная покупка игрушек',
  'toy-capsule': 'Куплена капсула-сюрприз',
  'toy-capsule-duplicate': 'В капсуле выпал дубль',
  'toy-robot': 'Монстрик просит робота',
  'toy-slime': 'Монстрик просит лизуна',
  'toy-duplicate': 'Монстрику попался дубль',
  'toy-happy': 'Монстрик рад игрушке',
  'toy-bored': 'Монстрику скучно с игрушкой',
  'toy-sad': 'У монстрика не получается играть',

  // Broken nose cleaner
  'repair-intro': 'Прибор сломался, но он на гарантии',
  'repair-forecast-never': 'Прогноз: копилка не растёт',
  'repair-promise-unrealistic': 'Невыполнимое обещание',
  'repair-promise-lower': 'Обещание не больше прежнего',
  'repair-forecast-long': 'Прогноз: до победы очень долго',
  'repair-forecast-history': 'Прогноз по прежнему темпу',
  'repair-forecast-promise': 'Прогноз с обещанием',
  'repair-quiz-breakdowns-inverse': 'Посчитаны чистки без поломок',
  'repair-quiz-breakdowns-percent': '20% приняты за 20 поломок',
  'repair-quiz-breakdowns-every': 'Поломка посчитана в каждой чистке',
  'repair-quiz-cost-device-only': 'Посчитан только прибор',
  'repair-quiz-cost-cartridges-only': 'Посчитаны только картриджи',
  'repair-quiz-cost-every-cleaning': 'Запаска посчитана на каждую чистку',
  'repair-spare-cheap': 'Дешёвая запаска, когда чисток много',
  'repair-spare-overkill': 'Надёжная запаска, когда чисток мало',
  'repair-spare-overpriced': 'Переплата за такую же запаску',
  'repair-spare-right-cheap': 'Верно: дешёвая запаска',
  'repair-spare-right-reliable': 'Верно: надёжная запаска',
  'repair-breakdown-spare': 'Новая поломка, выручила запаска',
  'repair-breakdown-no-cartridge': 'Новая поломка, а картриджей нет',

  // Savings goals bought
  'festival-lights-thanks': 'Монстрик на Празднике огней',
  'game-console-thanks': 'Монстрик с игровой приставкой',
  'telescope-thanks': 'Монстрик с телескопом',
};

// Triggers that name a data mart row: the Russian wording names that row too.
const TRIGGER_PATTERNS_RU = [
  {
    pattern: /^End of the economic episode id = (\d+)$/,
    build: (row) => `Завершён экономический эпизод${row ? ` «${row.title}»` : ''}`,
  },
  {
    pattern: /^Acceptance or rejection of a Savings goal with id = (\d+)$/,
    build: (row) => `Принята или отложена цель накоплений${row ? ` «${row.title}»` : ''}`,
  },
];

// The Russian wording of a row's trigger; the English key when nobody has translated it yet.
export function triggerRu(row, rows = []) {
  const trigger = String(row?.trigger ?? '').trim();
  if (!trigger) return '';
  if (row.trigger_ru) return String(row.trigger_ru);
  if (TRIGGERS_RU[trigger]) return TRIGGERS_RU[trigger];
  for (const { pattern, build } of TRIGGER_PATTERNS_RU) {
    const match = pattern.exec(trigger);
    if (match) return build(rows.find((item) => String(item.id) === match[1]));
  }
  return trigger;
}
