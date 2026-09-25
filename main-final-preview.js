import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MonsterRoom } from './room.js';
import { MonsterPark } from './park.js';
import { FestivalLights } from './festival-lights.js';
import { GameConsoleFinal } from './game-console-final.js';
import { TelescopeFinal } from './telescope-final.js';
import { VictoryFinale } from './victory-finale.js';
import { ShopShelf } from './shop.js';
import { FeedingScale, PantryShelf } from './feeding.js';
import { CLEANING_EARS, EAR_FIGURES, EarCleaning, FigureTracer, FIGURES } from './ear-cleaning.js';
import {
  ADDITIONAL_TASK_TUTORIAL_SEEN_EVENT,
  BUDGET_FACT_EVENT,
  BUDGET_PLAN_EVENT,
  CLEAN,
  CLEANING_ATTEMPT_EVENT,
  clampStat,
  currentBudgetNumber,
  DAY_NUMBER_FIELD,
  daysUntilPayday,
  deriveRoomState,
  DEVICE_REPAIR_EVENT,
  DIRTY,
  FEEDING_EVENT,
  FEEDING_FAILED_EVENT,
  FEEDING_MAX_GRAMS,
  FEEDING_MIN_GRAMS,
  FEEDING_START_EVENT,
  FOOD_CATEGORY,
  FOOD_PORTION_GRAMS,
  FOOD_PURCHASE_EVENT,
  FUN_ARTICLE,
  GOAL_PURCHASE_EVENT,
  GOODS_PURCHASE_EVENT,
  HUNGER_STATE,
  HYGIENE_STATE,
  INVENTORY_CHANGE_EVENT,
  INVENTORY_UNIT_GRAMS,
  inventoryAmount,
  inventoryUnit,
  isNewDayRecord,
  MONSTER_STAT_EVENT,
  MONSTER_CREATED_EVENT,
  MONSTER_STATE_EVENT,
  NEW_DAY_EVENT,
  pantryPacks,
  PAYDAY_PERIOD_DAYS,
  POCKET_SPENDING_EVENT,
  POCKET_TOPUP_EVENT,
  INCOME_ARTICLE,
  REPAIR_RETURN_DAY_FIELD,
  REQUIRED_ARTICLE,
  SAVINGS_ARTICLE,
  SAVINGS_GOAL_DECISION_EVENT,
  SAVINGS_SPENDING_EVENT,
  SAVINGS_TOPUP_EVENT,
  STAT_LABELS,
  STAT_MAX,
  STAT_MIN,
  MOOD_SCALE_MAX,
} from './room-state.js';
import {
  dueMessages,
  MESSAGE_OBJECT_TYPE,
  MESSAGE_RECEIVED_EVENT,
  MESSAGE_TRIGGERS,
  MESSAGES_OPENED_EVENT,
  messageReceipts,
  messagesToReplayOnEntry,
} from './room-messages.js';
import {
  canFinishDay,
  dayMusic,
  finishDayHint,
  HARD_DAY_PERIOD,
  isNewDayTutorialDue,
  NEW_DAY_TUTORIAL_SEEN_EVENT,
  newDayRecords,
  newDayTutorialSteps,
} from './game-day.js';
import {
  CARTRIDGE_ITEM_ID,
  cleanerDevices,
  cleanerRefills,
  cleaningDevice,
  cleaningsByDay,
  cleaningUsesCartridge,
  deviceFacts,
  cleaningsLeft,
  inventoryChange,
  ownedCartridges,
  isCleanerDevice,
  isCleanerRefill,
  itemSpec,
  ownedDevice,
  ownershipCost,
  RIGHT_CLEANER_ID,
  techStoreItems,
} from './tech-shop.js';
import {
  BREAKDOWN_CHANCE,
  BREAKDOWNS,
  breakdownQuiz,
  breaksToday,
  cheapSpareQuiz,
  cleaningsAhead,
  expectedBreakdowns,
  FORECAST_LONG,
  forecastVerdict,
  piggyHistory,
  PROMISE_MAX,
  REPAIR_DAYS,
  REPAIR_EPISODE_TRIGGER,
  rightSpare,
  savingsForecast,
  savingsTarget,
  spareCost,
  spareVerdict,
} from './repair-episode.js';
import {
  dueEconomicEpisodes,
  ECONOMIC_EPISODE_COMPLETED_EVENT,
  ECONOMIC_EPISODE_OPENED_EVENT,
  isEconomicEpisodeCompleted,
  isEconomicEpisodeStarted,
  unknownEconomicEpisodeTriggers,
} from './economic-episodes.js';
import {
  acceptedSavingsGoals,
  approvedBudgetCount,
  budgetDiscrepancies,
  budgetReview,
  foodPurchaseNeed,
  savingsGoalsProgress,
} from './budget.js';
import {
  affordableGoals,
  autoFeedingPortion,
  boughtSavingsGoals,
  DEFEAT_LEVEL,
  FINAL_BRIEFING_SEEN_EVENT,
  FINAL_DEFEAT_EVENT,
  FINAL_PART_BUDGET,
  FINAL_PART_REASON,
  FINAL_PART_START_EVENT,
  FINAL_STOP_EVENT,
  FINAL_VICTORY_EVENT,
  finalBriefingSteps,
  finalOutcome,
  finalTarget,
  GOAL_OFFER_EVENT,
  goalsSpent,
  isFinalPart,
  isFullVictory,
  nextFinalStop,
  savingsGoalRows,
  statsAtOrBelow,
  unboughtGoals,
} from './final-part.js';
import {
  cardKey,
  emptyStage,
  incompleteStage,
  isTriggerCard,
  letterAmount,
  letterOfCreditCards,
  letterOfCreditCases,
  letterOfCreditTutorial,
  letterOfCreditVerdict,
  LLM_CARD_SOURCE,
  LOC_DECOY,
  LOC_LOGIC,
  LOC_MISSING,
  LOC_ORDER,
  LOC_SOLVED,
  LOGIC_AND,
  LOGIC_LABELS,
  LOGIC_OR,
} from './letter-of-credit.js';
import {
  CORPORATION_RATE_MAX,
  GRACE_MONTHS,
  KEY_RATE,
  LOAN_CORPORATION,
  LOAN_CORPORATION_GRACE,
  LOAN_CORPORATION_RATE_HIGH,
  LOAN_DECISION_LABELS,
  LOAN_FAIL_FUNDED,
  LOAN_FULL,
  LOAN_GOOD_REFUSED,
  LOAN_RATE_BELOW_KEY,
  LOAN_REFUSE,
  LOAN_RISKY_FULL,
  LOAN_RISKY_REFUSED,
  LOAN_SMALL_NO_GRACE,
  LOAN_SMALL_RATE_HIGH,
  LOAN_TRANCHE,
  LOAN_TRANCHE_EARLY,
  LOAN_TRANCHE_LATE,
  LOAN_TRANCHE_NEEDLESS,
  loanAmount,
  loanApplications,
  loanKind,
  loanPlan,
  loanRightTrigger,
  loanTutorial,
  loanVerdict,
  RATE_MAX,
  RATE_MIN,
  SMALL_RATE_MAX,
  yearlyInterest,
} from './business-loans.js';
import {
  ADDITIONAL_TASK_ABANDONED_EVENT,
  ADDITIONAL_TASK_COMPLETED_EVENT,
  ADDITIONAL_TASK_STARTED_EVENT,
  additionalTaskList,
  additionalTaskTutorialSteps,
  unknownAdditionalTaskTriggers,
} from './additional-tasks.js';
import { dealCurrencyMemo, flagSvg } from './currency-memo.js';
import { ASSET, LIABILITY, START_CAPITAL, dealPropertyDeck, twinInDeck } from './assets-liabilities.js';
import {
  DEPARTURE_MINUTES,
  formatClock,
  nextLegs,
  optimalPlan,
  planSummary,
  ROUTE_CRITICAL_VERDICTS,
  ROUTE_SUBOPTIMAL_RETRIES,
  ROUTE_SUBOPTIMAL_VERDICTS,
  ROUTE_MODES,
  ROUTE_TUTORIAL_OBJECT_TYPE,
  routeMap,
  routeSummary,
  routeVerdict,
  startPoint,
  TRAINER_LINE_OBJECT_TYPE,
  TRAINING_START_MINUTES,
  TRAVELLERS,
  WAITING_BLOCK_MINUTES,
  WAITING_BLOCK_PRICE,
} from './route-planner.js';
import { TrainerCall } from './trainer-call.js';
import {
  CAPSULE_PRICE,
  MINI_MONSTER_IMAGES,
  MINI_MONSTERS,
  nextMiniMonster,
  TOY_CAPSULE_ITEM,
  TOY_CAPSULE_EVENT,
  TOY_EPISODE,
  TOY_PURCHASE_EVENT,
  TOY_STORE_ID,
  TOY_STORE_TITLE,
  TOY_TUTORIAL_EVENT,
  ToyCompanion,
  isToyAvailable,
  toyById,
  toyCartTotal,
  toysAvailableOnDay,
  toyVerdict,
} from './toy-shop.js';
import './styles.css';
import logoVideoUrl from './logo2.mp4?url';
import preintroVideoUrl from './preintro_final.mp4?url';
import introVideoUrl from './intro.mp4?url';
import briefingVideoUrl from './brif1.mp4?url';
import preroomVideoUrl from './preroom.mp4?url';
import storyMusicUrl from './Tiptoeing_Paws.mp3?url';
import roomMusicUrl from './Buttons_and_Bowls.mp3?url';
import toyMusicUrl from './Moonbeam_Toyshop.wav?url';
import briefingDataUrl from './monster_data_mart_rows.json?url';
import dataMartRows from './monster_data_mart_rows.json';

const $ = (selector, root = document) => root.querySelector(selector);
const delay = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

const app = $('#app');
const introScreen = $('#intro-screen');
const creatorScreen = $('#creator-screen');
const briefingVideoScreen = $('#briefing-video-screen');
const preroomVideoScreen = $('#preroom-video-screen');
const briefingScreen = $('#briefing-screen');
const budgetScreen = $('#budget-screen');
const budgetReviewScreen = $('#budget-review-screen');
const tennisEstimateScreen = $('#tennis-estimate-screen');
const locScreen = $('#loc-screen');
const loansScreen = $('#loans-screen');
const repairScreen = $('#repair-screen');
const memoScreen = $('#memo-screen');
const assetsScreen = $('#assets-screen');
const finishScreen = $('#finish-screen');
const finalSceneScreen = $('#final-scene-screen');
const parkScreen = $('#park-screen');
const shopScreen = $('#shop-screen');
const techShopScreen = $('#tech-shop-screen');
const toyShopScreen = $('#toy-shop-screen');
const feedingScreen = $('#feeding-screen');
const cleaningScreen = $('#cleaning-screen');
const introVideo = $('#intro-video');
const teamCard = $('#team-card');
const introSubtitles = $('#intro-subtitles');
const startGate = $('#start-gate');
const startButton = $('#start-button');
const skipIntroButton = $('#skip-intro');
const backgroundMusic = $('#background-music');
const soundToggle = $('#sound-toggle');
const monsterStage = $('#monster-stage');
const finishMonsterStage = $('#finish-monster-stage');
const parkStage = $('#park-stage');
const parkStatus = $('#park-status');
const parkLoading = $('#park-loading');
const parkTitle = $('#park-title');
const parkBack = $('#park-back');
const parkHud = $('.park-hud');
const parkToasts = $('#park-toasts');
const parkSpeech = $('#park-speech');
const parkSpeechName = $('#park-speech-name');
const parkSpeechText = $('#park-speech-text');
const parkSpeechRepeat = $('#park-speech-repeat');
const parkSpeechNext = $('#park-speech-next');
const parkChoice = $('#park-choice');
const parkChoicePocket = $('#park-choice-pocket');
const parkChoiceSavings = $('#park-choice-savings');
const parkChoiceList = $('#park-choice-list');
const parkChoiceConfirm = $('#park-choice-confirm');
const parkGoal = $('#park-goal');
const parkGoalImage = $('#park-goal-image');
const parkGoalName = $('#park-goal-name');
const parkGoalText = $('#park-goal-text');
const parkGoalPrice = $('#park-goal-price');
const parkGoalSavings = $('#park-goal-savings');
const parkGoalAccept = $('#park-goal-accept');
const parkGoalDecline = $('#park-goal-decline');
const roomStatus = $('#room-status');
const roomLoading = $('#room-loading');
const modelLoading = $('#model-loading');
const colorOptions = $('#color-options');
const colorValue = $('#color-value');
const earsInput = $('#ears-input');
const hornsInput = $('#horns-input');
const earsValue = $('#ears-value');
const hornsValue = $('#horns-value');
const saveCharacterButton = $('#save-character');
const nameDialog = $('#name-dialog');
const nameForm = $('#name-form');
const monsterNameInput = $('#monster-name');
const nameCount = $('#name-count');
const nameError = $('#name-error');
const finishName = $('#finish-name');
const restartButton = $('#restart-button');
const briefingVideo = $('#briefing-video');
const preroomVideo = $('#preroom-video');
const preroomVideoSubtitles = $('#preroom-video-subtitles');
const skipPreroomVideoButton = $('#skip-preroom-video');
const briefingVideoSubtitles = $('#briefing-video-subtitles');
const skipBriefingVideoButton = $('#skip-briefing-video');
const briefingAudio = $('#briefing-audio');
const briefingImage = $('#briefing-image');
const briefingTextBox = $('#briefing-text-box');
const briefingText = $('#briefing-text');
const briefingProgress = $('#briefing-progress');
const briefingActions = $('#briefing-actions');
const briefingRepeat = $('#briefing-repeat');
const briefingBack = $('#briefing-back');
const briefingNext = $('#briefing-next');
const budgetTotal = $('#budget-total');
const budgetAllocated = $('#budget-allocated');
const budgetRemaining = $('#budget-remaining');
const budgetStatus = $('#budget-status');
const budgetRemainingCard = $('.budget-remaining-card');
const budgetEyebrow = $('#budget-eyebrow');
const budgetPeriodDays = $('#budget-period-days');
const budgetPocket = $('#budget-pocket');
const budgetPocketValue = $('#budget-pocket-value');
const budgetFoodHint = $('#budget-food-hint');
const budgetExtraHint = $('#budget-extra-hint');
const budgetRequiredInput = $('#budget-required');
const budgetFunInput = $('#budget-fun');
const budgetSavingsInput = $('#budget-savings');
const budgetRequiredValue = $('#budget-required-value');
const budgetFunValue = $('#budget-fun-value');
const budgetSavingsValue = $('#budget-savings-value');
const budgetRequiredDaily = $('#budget-required-daily');
const budgetFunDaily = $('#budget-fun-daily');
const budgetSavingsDaily = $('#budget-savings-daily');
const budgetCategories = $('#budget-categories');
const budgetGoals = $('#budget-goals');
const budgetGoalsPool = $('#budget-goals-pool');
const budgetGoalsList = $('#budget-goals-list');
const budgetGoalsAll = $('#budget-goals-all');
const budgetGoalsTotal = $('#budget-goals-total');
const budgetPromise = $('#budget-promise');
const budgetPromiseValue = $('#budget-promise-value');
const budgetPromiseState = $('#budget-promise-state');
const approveBudgetButton = $('#approve-budget');
const budgetTutorialAudio = $('#budget-tutorial-audio');
const estimateTutorialAudio = $('#estimate-tutorial-audio');
const locTutorialAudio = $('#loc-tutorial-audio');
const budgetTutorialLayer = $('#budget-tutorial-layer');
const budgetTutorialProgress = $('#budget-tutorial-progress');
const budgetTutorialText = $('#budget-tutorial-text');
const budgetTutorialBack = $('#budget-tutorial-back');
const budgetTutorialNext = $('#budget-tutorial-next');
const budgetTutorialSkip = $('#budget-tutorial-skip');
const estimateItems = $('#estimate-items');
const estimateSelectedCount = $('#estimate-selected-count');
const estimateTotal = $('#estimate-total');
const estimateFatherShare = $('#estimate-father-share');
const estimatePlayerShare = $('#estimate-player-share');
const estimateRecurring = $('#estimate-recurring');
const estimateRecurringTotal = $('#estimate-recurring-total');
const estimateShortage = $('#estimate-shortage');
const estimateSubmit = $('#estimate-submit');
const estimateTutorialLayer = $('#estimate-tutorial-layer');
const estimateTutorialFocus = $('#estimate-tutorial-focus');
const estimateTutorialProgress = $('#estimate-tutorial-progress');
const estimateTutorialText = $('#estimate-tutorial-text');
const estimateTutorialBack = $('#estimate-tutorial-back');
const estimateTutorialNext = $('#estimate-tutorial-next');
const estimateTutorialSkip = $('#estimate-tutorial-skip');
const fatherSpeech = $('#father-speech');
const fatherSpeechMood = $('#father-speech-mood');
const fatherSpeechText = $('#father-speech-text');
const fatherSpeechReward = $('#father-speech-reward');
const fatherSpeechNext = $('#father-speech-next');
const tutorialAudio = $('#tutorial-audio');
const tutorialLayer = $('#tutorial-layer');
const tutorialProgress = $('#tutorial-progress');
const tutorialText = $('#tutorial-text');
const tutorialBack = $('#tutorial-back');
const tutorialNext = $('#tutorial-next');
const tutorialSkip = $('#tutorial-skip');
const messageAudio = $('#message-audio');
const shopTutorialAudio = $('#shop-tutorial-audio');
const mentorAudio = $('#mentor-audio');
const toyMonsterAudio = $('#toy-monster-audio');
const feedingTutorialAudio = $('#feeding-tutorial-audio');
const dayTutorialAudio = $('#day-tutorial-audio');
const parkVoiceAudio = $('#park-voice-audio');
const fatherVoiceAudio = $('#father-voice-audio');
const piggyTutorialAudio = $('#piggy-tutorial-audio');
const cleaningVoiceAudio = $('#cleaning-voice-audio');
const cleaningTutorialAudio = $('#cleaning-tutorial-audio');
const taskTutorialAudio = $('#task-tutorial-audio');
const trainerVoiceAudio = $('#trainer-voice-audio');
const routeTutorialAudio = $('#route-tutorial-audio');
const assetsTutorialAudio = $('#assets-tutorial-audio');
const loansTutorialAudio = $('#loans-tutorial-audio');
const repairTutorialAudio = $('#repair-tutorial-audio');

const MEDIA = {
  logo: logoVideoUrl,
  preintro: preintroVideoUrl,
  intro: introVideoUrl,
  briefing: briefingVideoUrl,
  preroom: preroomVideoUrl,
  briefingData: briefingDataUrl,
};

const MUSIC_TRACKS = {
  story: storyMusicUrl,
  room: roomMusicUrl,
  toy: toyMusicUrl,
};
// Audio files in the root of the repository, bundled so that a data mart row with
// `audio_folder: 'root'` can name any of them: './Sunlight_on_the_Keys.mp3' → its URL.
const ROOT_AUDIO_URLS = import.meta.glob('./*.{mp3,wav,ogg,m4a}', { query: '?url', import: 'default', eager: true });

const MUSIC_VOLUME = 0.3;
const MUSIC_DUCKED_VOLUME = 0.08;
const MUSIC_FADE_SECONDS = 3;
let muted = false;
let isMainIntroPlaying = false;
let tutorialAudioPrimed = false;
let budgetTutorialAudioPrimed = false;
let tutorialVoicePlaying = false;
let briefingVoicePlaying = false;
let budgetTutorialVoicePlaying = false;
let estimateTutorialVoicePlaying = false;
let locTutorialVoicePlaying = false;
let messageVoicePlaying = false;
let shopTutorialVoicePlaying = false;
let mentorVoicePlaying = false;
let toyMonsterVoicePlaying = false;
let feedingTutorialVoicePlaying = false;
let dayTutorialVoicePlaying = false;
let parkVoicePlaying = false;
let fatherVoicePlaying = false;
let piggyTutorialVoicePlaying = false;
let cleaningVoicePlaying = false;
let cleaningTutorialVoicePlaying = false;
let taskTutorialVoicePlaying = false;
let trainerVoicePlaying = false;
let routeTutorialVoicePlaying = false;
let assetsTutorialVoicePlaying = false;
let loansTutorialVoicePlaying = false;
let repairTutorialVoicePlaying = false;
let isBriefingVideoPlaying = false;
let isPreroomVideoPlaying = false;
let musicSceneGain = 1;
let musicFadeRunId = 0;
let musicTrackRunId = 0;
let activeMusicSource = MUSIC_TRACKS.story;
let musicGesturePending = false;
let introRunId = 0;
let briefingRunId = 0;
let tutorialTimer = 0;

function setHidden(element, hidden) {
  element.classList.toggle('is-hidden', hidden);
}

function showOnlyScreen(screen) {
  introScreen.hidden = screen !== introScreen;
  creatorScreen.hidden = screen !== creatorScreen;
  briefingVideoScreen.hidden = screen !== briefingVideoScreen;
  preroomVideoScreen.hidden = screen !== preroomVideoScreen;
  briefingScreen.hidden = screen !== briefingScreen;
  budgetScreen.hidden = screen !== budgetScreen;
  budgetReviewScreen.hidden = screen !== budgetReviewScreen;
  finalSceneScreen.hidden = screen !== finalSceneScreen;
  tennisEstimateScreen.hidden = screen !== tennisEstimateScreen;
  locScreen.hidden = screen !== locScreen;
  loansScreen.hidden = screen !== loansScreen;
  repairScreen.hidden = screen !== repairScreen;
  memoScreen.hidden = screen !== memoScreen;
  assetsScreen.hidden = screen !== assetsScreen;
  routeScreen.hidden = screen !== routeScreen;
  finishScreen.hidden = screen !== finishScreen;
  parkScreen.hidden = screen !== parkScreen;
  shopScreen.hidden = screen !== shopScreen;
  techShopScreen.hidden = screen !== techShopScreen;
  toyShopScreen.hidden = screen !== toyShopScreen;
  feedingScreen.hidden = screen !== feedingScreen;
  cleaningScreen.hidden = screen !== cleaningScreen;
  closeMentor();
}

function updateMusicFade() {
  const voicePlaying = tutorialVoicePlaying || briefingVoicePlaying || budgetTutorialVoicePlaying || estimateTutorialVoicePlaying
    || locTutorialVoicePlaying || messageVoicePlaying
    || shopTutorialVoicePlaying || mentorVoicePlaying || toyMonsterVoicePlaying || feedingTutorialVoicePlaying || dayTutorialVoicePlaying
    || parkVoicePlaying || fatherVoicePlaying || piggyTutorialVoicePlaying || cleaningVoicePlaying || cleaningTutorialVoicePlaying
    || taskTutorialVoicePlaying || trainerVoicePlaying || routeTutorialVoicePlaying || assetsTutorialVoicePlaying
    || loansTutorialVoicePlaying || repairTutorialVoicePlaying
    || Boolean(festivalVoice && !festivalVoice.paused)
    || Boolean(gameConsoleVoice && !gameConsoleVoice.paused)
    || Boolean(telescopeVoice && !telescopeVoice.paused);
  const targetVolume = voicePlaying ? MUSIC_DUCKED_VOLUME : MUSIC_VOLUME;
  let trackFade = 1;

  if (Number.isFinite(backgroundMusic.duration) && backgroundMusic.duration > 0) {
    const fadeIn = Math.min(1, backgroundMusic.currentTime / MUSIC_FADE_SECONDS);
    const remaining = backgroundMusic.duration - backgroundMusic.currentTime;
    const fadeOut = Math.min(1, remaining / MUSIC_FADE_SECONDS);
    trackFade = Math.max(0, Math.min(fadeIn, fadeOut));
  }

  backgroundMusic.volume = targetVolume * musicSceneGain * trackFade;
}

function fadeBackgroundMusic(targetGain, duration = 900) {
  const runId = ++musicFadeRunId;
  const startGain = musicSceneGain;
  const safeTarget = Math.max(0, Math.min(1, targetGain));

  if (duration <= 0 || Math.abs(safeTarget - startGain) < 0.001) {
    musicSceneGain = safeTarget;
    updateMusicFade();
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const startedAt = performance.now();
    const tick = (now) => {
      if (runId !== musicFadeRunId) return resolve(false);
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = progress * progress * (3 - 2 * progress);
      musicSceneGain = startGain + (safeTarget - startGain) * eased;
      updateMusicFade();

      if (progress < 1) requestAnimationFrame(tick);
      else resolve(true);
    };
    requestAnimationFrame(tick);
  });
}

function resumeBackgroundMusicOnGesture() {
  if (musicGesturePending) return;
  musicGesturePending = true;

  const resume = () => {
    document.removeEventListener('pointerdown', resume, true);
    document.removeEventListener('keydown', resume, true);
    musicGesturePending = false;
    backgroundMusic.play().catch(() => {});
  };

  document.addEventListener('pointerdown', resume, { capture: true, once: true });
  document.addEventListener('keydown', resume, { capture: true, once: true });
}

// `track` is a key of MUSIC_TRACKS or the URL of any other track.
async function switchBackgroundTrack(track, { fadeOut = 900, fadeIn = 1400 } = {}) {
  const source = MUSIC_TRACKS[track] ?? track;
  if (!source) return false;

  if (activeMusicSource === source) {
    if (backgroundMusic.paused) backgroundMusic.play().catch(() => {});
    return true;
  }

  const runId = ++musicTrackRunId;
  const fadedOut = await fadeBackgroundMusic(0, fadeOut);
  if (!fadedOut || runId !== musicTrackRunId) return false;

  backgroundMusic.pause();
  backgroundMusic.src = source;
  backgroundMusic.load();
  backgroundMusic.currentTime = 0;
  activeMusicSource = source;
  musicSceneGain = 0;
  updateMusicFade();

  try {
    await backgroundMusic.play();
  } catch (error) {
    console.info('Новый музыкальный трек запустится после следующего касания.', error);
    resumeBackgroundMusicOnGesture();
  }

  if (runId !== musicTrackRunId) return false;
  return fadeBackgroundMusic(1, fadeIn);
}

backgroundMusic.addEventListener('timeupdate', updateMusicFade);
backgroundMusic.addEventListener('loadedmetadata', updateMusicFade);
backgroundMusic.addEventListener('ended', () => {
  backgroundMusic.currentTime = 0;
  updateMusicFade();
  backgroundMusic.play().catch(() => showStartGate());
});

function applyMuteState() {
  backgroundMusic.muted = muted;
  introVideo.muted = muted;
  briefingVideo.muted = muted;
  preroomVideo.muted = muted;
  soundToggle.setAttribute('aria-pressed', String(muted));
  soundToggle.setAttribute('aria-label', muted ? 'Включить звук' : 'Выключить звук');
  setHidden(introSubtitles, !(muted && isMainIntroPlaying));
  tutorialAudio.muted = muted;
  briefingAudio.muted = muted;
  budgetTutorialAudio.muted = muted;
  estimateTutorialAudio.muted = muted;
  locTutorialAudio.muted = muted;
  messageAudio.muted = muted;
  shopTutorialAudio.muted = muted;
  mentorAudio.muted = muted;
  toyMonsterAudio.muted = muted;
  feedingTutorialAudio.muted = muted;
  dayTutorialAudio.muted = muted;
  parkVoiceAudio.muted = muted;
  fatherVoiceAudio.muted = muted;
  piggyTutorialAudio.muted = muted;
  cleaningVoiceAudio.muted = muted;
  cleaningTutorialAudio.muted = muted;
  taskTutorialAudio.muted = muted;
  trainerVoiceAudio.muted = muted;
  routeTutorialAudio.muted = muted;
  assetsTutorialAudio.muted = muted;
  loansTutorialAudio.muted = muted;
  repairTutorialAudio.muted = muted;
  if (festivalVoice) festivalVoice.muted = muted;
  if (gameConsoleVoice) gameConsoleVoice.muted = muted;
  if (telescopeVoice) telescopeVoice.muted = muted;
  updateBriefingVideoSubtitles();
  updatePreroomVideoSubtitles();
}

soundToggle.addEventListener('click', () => {
  const wasMuted = muted;
  muted = !muted;
  applyMuteState();
  if (wasMuted && !muted && !budgetTutorialLayer.classList.contains('is-hidden')) {
    playBudgetTutorialVoice(budgetTutorialSteps[budgetTutorialIndex]);
  } else if (wasMuted && !muted && !estimateTutorialLayer.classList.contains('is-hidden')) {
    playTennisEstimateTutorialVoice(tennisEstimateTutorialSteps[tennisEstimateTutorialIndex]);
  } else if (wasMuted && !muted && !locTutorialLayer.classList.contains('is-hidden')) {
    playLocTutorialVoice(locTutorialSteps[locTutorialIndex]);
  } else if (wasMuted && !muted && !briefingScreen.hidden) {
    playBriefingVoice(briefingSteps[briefingIndex]);
  } else if (wasMuted && !muted && !tutorialLayer.classList.contains('is-hidden')) {
    playTutorialVoice(tutorialSteps[tutorialIndex]);
  } else if (wasMuted && !muted && shownRoomMessage) {
    playMessageVoice(shownRoomMessage);
  } else if (wasMuted && !muted && !shopTutorialLayer.classList.contains('is-hidden')) {
    playShopTutorialVoice(shopTutorialSteps[shopTutorialIndex]);
  } else if (wasMuted && !muted && !feedingTutorialLayer.classList.contains('is-hidden')) {
    playFeedingTutorialVoice(feedingTutorialSteps[feedingTutorialIndex]);
  } else if (wasMuted && !muted && !dayTutorialLayer.classList.contains('is-hidden')) {
    playDayTutorialVoice(dayTutorialSteps[dayTutorialIndex]);
  } else if (wasMuted && !muted && !piggyTutorialLayer.classList.contains('is-hidden')) {
    playPiggyTutorialVoice(piggyTutorialSteps[piggyTutorialIndex]);
  } else if (wasMuted && !muted && !taskTutorialLayer.classList.contains('is-hidden')) {
    playTaskTutorialVoice(taskTutorialSteps[taskTutorialIndex]);
  } else if (wasMuted && !muted && !routeTutorialLayer.classList.contains('is-hidden')) {
    playRouteTutorialVoice(routeTutorialSteps[routeTutorialIndex]);
  } else if (wasMuted && !muted && !assetsTutorialLayer.classList.contains('is-hidden')) {
    playAssetsTutorialVoice(assetsTutorialSteps[assetsTutorialIndex]);
  } else if (wasMuted && !muted && !repairTutorialLayer.classList.contains('is-hidden')) {
    playRepairTutorialVoice(repairTutorialSteps[repairTutorialIndex]);
  } else if (wasMuted && !muted && shownTrainerLine) {
    playTrainerVoice(shownTrainerLine);
  } else if (wasMuted && !muted && shownFatherLine) {
    playFatherVoice(shownFatherLine);
  } else if (wasMuted && !muted && shownParkLine) {
    playParkVoice(shownParkLine);
  } else if (wasMuted && !muted && !cleaningTutorialLayer.classList.contains('is-hidden')) {
    playCleaningTutorialVoice(cleaningTutorialSteps[cleaningTutorialIndex]);
  } else if (wasMuted && !muted && shownCleaningLine) {
    playCleaningVoice(shownCleaningLine);
  }
});

function showStartGate() {
  isMainIntroPlaying = false;
  applyMuteState();
  introVideo.pause();
  introVideo.removeAttribute('src');
  introVideo.load();
  introVideo.style.opacity = '0';
  teamCard.classList.remove('is-visible');
  setHidden(skipIntroButton, true);
  setHidden(startGate, false);
}

function cancelIntroSequence() {
  introRunId += 1;
  isMainIntroPlaying = false;
  applyMuteState();
  introVideo.pause();
  introVideo.dispatchEvent(new Event('sequencecancel'));
}

function waitForVideo(video) {
  return new Promise((resolve, reject) => {
    const cleanUp = () => {
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('error', onError);
      video.removeEventListener('sequencecancel', onCancel);
    };
    const onEnded = () => {
      cleanUp();
      resolve('ended');
    };
    const onError = () => {
      cleanUp();
      reject(video.error || new Error('Не удалось загрузить видео'));
    };
    const onCancel = () => {
      cleanUp();
      resolve('cancelled');
    };

    video.addEventListener('ended', onEnded, { once: true });
    video.addEventListener('error', onError, { once: true });
    video.addEventListener('sequencecancel', onCancel, { once: true });
  });
}

async function playIntroVideo(source, runId, fadeIn = true) {
  if (runId !== introRunId) return false;

  isMainIntroPlaying = source === MEDIA.intro;
  introVideo.style.transitionDuration = fadeIn ? '650ms' : '150ms';
  introVideo.style.opacity = '0';
  introVideo.src = source;
  introVideo.currentTime = 0;
  introVideo.load();
  applyMuteState();

  const finished = waitForVideo(introVideo);
  await introVideo.play();
  if (runId !== introRunId) return false;

  requestAnimationFrame(() => {
    introVideo.style.opacity = '1';
  });

  const result = await finished;
  if (result === 'cancelled' || runId !== introRunId) return false;

  introVideo.style.transitionDuration = '700ms';
  introVideo.style.opacity = '0';
  await delay(720);
  isMainIntroPlaying = false;
  applyMuteState();
  return runId === introRunId;
}

async function showTeamCard(runId) {
  if (runId !== introRunId) return false;
  teamCard.classList.add('is-visible');
  await delay(3200);
  if (runId !== introRunId) return false;
  teamCard.classList.remove('is-visible');
  await delay(950);
  return runId === introRunId;
}

async function runIntroSequence() {
  const runId = ++introRunId;
  showOnlyScreen(introScreen);
  setHidden(startGate, true);
  setHidden(skipIntroButton, false);
  teamCard.classList.remove('is-visible');
  introVideo.style.opacity = '0';
  isMainIntroPlaying = false;
  applyMuteState();

  try {
    if (!(await playIntroVideo(MEDIA.logo, runId, false))) return;
    if (!(await showTeamCard(runId))) return;
    if (hasStartedGameDay()) {
      enterRoomFromIntro();
      return;
    }
    if (!(await playIntroVideo(MEDIA.preintro, runId))) return;
    if (!(await playIntroVideo(MEDIA.intro, runId))) return;
    if (runId === introRunId) enterEditor();
  } catch (error) {
    console.warn('Вступление не удалось запустить:', error);
    if (runId === introRunId) showStartGate();
  }
}

async function startExperience() {
  setHidden(startGate, true);
  backgroundMusic.volume = 0;
  applyMuteState();
  primeTutorialAudio();
  primeBudgetTutorialAudio();
  try {
    await backgroundMusic.play();
  } catch (error) {
    console.info('Фоновая музыка запустится после следующего касания.', error);
  }
  runIntroSequence();
}

startButton.addEventListener('click', startExperience);
skipIntroButton.addEventListener('click', () => {
  if (hasStartedGameDay()) enterRoomFromIntro();
  else enterEditor();
});

// --- 3D monster ------------------------------------------------------------

const HSV_GLSL = `
vec3 petRgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + 1e-10)), d / (q.x + 1e-10), q.x);
}
vec3 petHsv2rgb(vec3 c) {
  vec3 p = abs(fract(c.xxx + vec3(1.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0);
  return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
}
vec3 petAdjust(vec3 color, float hueShift, float saturation, float value) {
  vec3 hsv = petRgb2hsv(max(color, 0.0));
  hsv.x = fract(hsv.x + hueShift);
  hsv.y = clamp(hsv.y * saturation, 0.0, 1.0);
  hsv.z *= value;
  return petHsv2rgb(hsv);
}`;

let manifest = null;
let renderer = null;
let scene = null;
let camera = null;
let editorScene = null;
let editorCamera = null;
let model = null;
let mixer = null;
let faceMaterial = null;
let petMaterials = [];
let faceOverlays = {};
let animationClock = null;
let roomController = null;
let toyCompanion = null;
let roomReadyPromise = null;
let parkController = null;
let parkReadyPromise = null;
let parkRunId = 0;
let shopController = null;
let earCleaning = null;
let monsterReadyPromise = null;
let profile = { fur: 0, ears: 2, horns: 2 };

const swatchColors = ['#53b9f3', '#ff72b2', '#9b62e8', '#ff8d3a', '#ffd548', '#9b633f'];
const lengthLabels = ['Самые короткие', 'Короткие', 'Обычные', 'Длинные', 'Самые длинные'];
const hornLabels = ['Самые маленькие', 'Маленькие', 'Обычные', 'Большие', 'Самые большие'];

// --- Player progress ------------------------------------------------------

const USER_PROFILE_STORAGE_KEY = 'prokormi-monstra:user-profile-id:v1';
const PROFILE_RECORDS_STORAGE_PREFIX = 'prokormi-monstra:progress:v1:';
const LEGACY_DISTRIBUTION_FUND_EVENT = 'Изменение фонда для распределения';

// Records the game no longer reads: the old distribution fund, and inventory changes counted
// in packs before the inventory moved to grams and pieces (those have no unit).
function isLegacyRecord(record) {
  const type = record?.['Тип события'];
  return type === LEGACY_DISTRIBUTION_FUND_EVENT
    || (type === INVENTORY_CHANGE_EVENT && !record['Единица измерения']);
}
let activeUserProfileId = '';
let volatileProfileRecords = [];

function generateUserProfileId() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();

  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);
  return [...randomBytes]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}

function getUserProfileId() {
  if (activeUserProfileId) return activeUserProfileId;

  try {
    activeUserProfileId = localStorage.getItem(USER_PROFILE_STORAGE_KEY) || generateUserProfileId();
    localStorage.setItem(USER_PROFILE_STORAGE_KEY, activeUserProfileId);
  } catch (error) {
    activeUserProfileId = generateUserProfileId();
    console.warn('Профиль будет храниться только до закрытия страницы.', error);
  }

  return activeUserProfileId;
}

function getProfileRecordsStorageKey(profileId) {
  return `${PROFILE_RECORDS_STORAGE_PREFIX}${profileId}`;
}

function readProfileRecords(profileId) {
  try {
    const savedRecords = localStorage.getItem(getProfileRecordsStorageKey(profileId));
    if (!savedRecords) return [];
    const records = JSON.parse(savedRecords);
    if (!Array.isArray(records)) return [];

    const currentRecords = records.filter((record) => !isLegacyRecord(record));
    if (currentRecords.length !== records.length) {
      localStorage.setItem(getProfileRecordsStorageKey(profileId), JSON.stringify(currentRecords));
    }
    return currentRecords;
  } catch (error) {
    console.warn('Не удалось прочитать сохранённый прогресс. Используется журнал текущего запуска.', error);
    return volatileProfileRecords.filter((record) => !isLegacyRecord(record));
  }
}

function removeLegacyRecords() {
  volatileProfileRecords = readProfileRecords(getUserProfileId());
}

function appendProfileRecord(record) {
  const profileId = getUserProfileId();
  const previousRecords = readProfileRecords(profileId);
  const currentRecords = [...previousRecords, record];
  volatileProfileRecords = currentRecords;

  try {
    localStorage.setItem(getProfileRecordsStorageKey(profileId), JSON.stringify(currentRecords));
  } catch (error) {
    console.warn('Не удалось записать прогресс в хранилище браузера.', error);
  }

  console.log('Событие добавлено в память браузера:', record);
  console.log('Ранее сохранённые события:', previousRecords);
  console.log('Текущий журнал событий:', currentRecords);
  if (!finishScreen.hidden) {
    renderRoomHud(currentRecords);
    deliverTriggeredMessages();
  }

  return currentRecords;
}

function getMonsterModelCharacteristics() {
  const fur = manifest?.profile?.fur?.[profile.fur];
  const earScale = manifest?.profile?.ears?.scales?.[profile.ears] ?? null;
  const hornSize = manifest?.profile?.horns?.sizes?.[profile.horns] ?? null;

  return {
    'Мех': {
      'Индекс варианта': profile.fur,
      'Идентификатор цвета': fur?.id ?? null,
      'Название цвета': fur?.label ?? colorValue.value ?? null,
      'Сдвиг оттенка': fur?.hueShift ?? null,
      'Насыщенность': fur?.saturation ?? null,
      'Яркость': fur?.value ?? null,
    },
    'Уши': {
      'Уровень': profile.ears,
      'Название': lengthLabels[profile.ears] || null,
      'Масштаб': earScale,
    },
    'Рога': {
      'Уровень': profile.horns,
      'Название': hornLabels[profile.horns] || null,
      'Размер морфинга': hornSize,
    },
  };
}

function saveMonsterCreation(name) {
  const profileId = getUserProfileId();
  return appendProfileRecord({
    'Тип события': 'Создание монстра',
    'Профиль пользователя': profileId,
    'Имя монстра': name,
    'Характеристики 3D модели монстра': getMonsterModelCharacteristics(),
  });
}

function saveApprovedBudget(allocations, fundTotal, source, extra = {}) {
  const profileId = getUserProfileId();
  const budgetValue = {
    'Период в днях': 3,
    'Фонд к распределению': fundTotal,
    'Источник средств': source,
    'Статьи бюджета': {
      [REQUIRED_ARTICLE]: allocations.required,
      [FUN_ARTICLE]: allocations.fun,
      [SAVINGS_ARTICLE]: allocations.savings,
    },
    ...extra,
  };

  appendProfileRecord({
    'Тип события': BUDGET_PLAN_EVENT,
    'Профиль пользователя': profileId,
    'Значение': budgetValue,
  });

  appendProfileRecord({
    'Тип события': POCKET_TOPUP_EVENT,
    'Профиль пользователя': profileId,
    'Значение': allocations.required + allocations.fun,
  });

  appendProfileRecord({
    'Тип события': SAVINGS_TOPUP_EVENT,
    'Профиль пользователя': profileId,
    'Значение': allocations.savings,
  });
}

// One change of the actual budget the player is living on right now. Spending charges the
// obligatory or the fun article; coins taken out of the piggy bank lower the savings article;
// money nobody planned for goes under INCOME_ARTICLE, with 'Зачислено' saying where it landed.
function appendBudgetFact(records, article, change, extra = {}) {
  appendProfileRecord({
    'Тип события': BUDGET_FACT_EVENT,
    'Профиль пользователя': getUserProfileId(),
    'Номер бюджета': currentBudgetNumber(records),
    'Статья бюджета': article,
    'Изменение статьи': change,
    ...extra,
  });
}

// Coins moved from the piggy bank into the pocket leave the savings article.
function appendSavingsWithdrawalFact(records, amount, extra = {}) {
  appendBudgetFact(records, SAVINGS_ARTICLE, -amount, { 'Зачислено': 'Карман', ...extra });
}

// A returning player: the game has already started at least one day.
function hasStartedGameDay() {
  return readProfileRecords(getUserProfileId()).some(isNewDayRecord);
}

function setRoomActionsEnabled(enabled) {
  for (const button of roomActionButtons) button.disabled = !enabled;
  roomEconomicEpisodeButton.disabled = !enabled;
}

function saveFirstRoomOpen() {
  if (hasStartedGameDay()) return;

  appendProfileRecord({
    'Тип события': NEW_DAY_EVENT,
    'Профиль пользователя': getUserProfileId(),
    [DAY_NUMBER_FIELD]: 1,
  });
}

// --- Room overlay ---------------------------------------------------------

const ROOM_ACTION_LABELS = {
  briefing: 'Повторить брифинг',
  shop: 'Магазин',
  tasks: 'Задания',
  feed: 'Кормление',
  clean: 'Чистка козявок',
  next: 'Следующий день',
  profiles: 'Профили',
  messages: 'Сообщения',
};
const ROOM_MESSAGE_SECONDS = 2.6;
// The player looks around the new room before the first message arrives.
const ROOM_FIRST_ENTRY_PAUSE_SECONDS = 1;

const roomDay = $('#room-day');
const roomPocket = $('#room-pocket');
const roomSavings = $('#room-savings');
const roomHunger = $('#room-hunger');
const roomHygiene = $('#room-hygiene');
const roomStats = $('#room-stats');
const roomBottomBar = $('#room-bottom-bar');
const roomActions = $('#room-actions');
const roomActionConfirm = $('#room-action-confirm');
const roomActionMessage = $('#room-action-message');
const roomActionButtons = [...document.querySelectorAll('[data-room-action]')];
const roomEconomicEpisodeButton = $('#room-economic-episode');
const roomNextDayButton = $('#room-next-day');
let replayingRoomBriefing = false;
let selectedRoomAction = null;
let activeEconomicEpisode = null;
let roomMessageTimer = 0;

roomStats.querySelectorAll('.room-stat').forEach((stat) => {
  const scale = stat.querySelector('.room-stat-scale');
  const maximum = stat.dataset.stat === 'mood' ? MOOD_SCALE_MAX : STAT_MAX;
  scale.replaceChildren(...Array.from({ length: maximum - STAT_MIN + 1 }, (_, index) => {
    const pip = document.createElement('i');
    if (index + STAT_MIN === 0) pip.className = 'is-zero';
    return pip;
  }));
});

function formatCoins(value) {
  return `${value.toLocaleString('ru-RU')} 🪙`;
}

function renderRoomStat(key, value) {
  const stat = roomStats.querySelector(`[data-stat="${key}"]`);
  if (!stat) return;
  const level = key === 'mood'
    ? Math.max(STAT_MIN, Math.round(value) || 0)
    : Math.max(STAT_MIN, Math.min(STAT_MAX, Math.round(value) || 0));
  const scale = stat.querySelector('.room-stat-scale');
  stat.querySelector('b').textContent = level > 0 ? `+${level}` : level < 0 ? `−${-level}` : '0';
  stat.dataset.trend = level > 0 ? 'up' : level < 0 ? 'down' : 'even';
  if (scale.getAttribute('role') === 'meter') scale.setAttribute('aria-valuenow', String(level));
  [...scale.children].forEach((pip, index) => {
    const pipLevel = index + STAT_MIN;
    pip.classList.toggle('is-filled', pipLevel !== 0 && Math.sign(pipLevel) === Math.sign(level) && Math.abs(pipLevel) <= Math.abs(level));
  });
}

// Illness takes priority over everyday needs and short-lived reactions: negative health must
// always be visible, even when the monster is also hungry, dirty or briefly cheered up.
function careMoodKey(state) {
  if (Number(state.stats?.health) < 0) return 'sick';
  if (state.dirty) return state.hungry ? 'dirty_hungry' : 'dirty';
  return state.hungry ? 'hungry' : 'neutral';
}

// `moodKey` names one of the manifest moods; by default the look follows hunger and hygiene.
// Mud stays on a dirty monster in any mood: it has to be washed off, it cannot be cheered away.
function applyMonsterLook(state, moodKey = careMoodKey(state)) {
  if (!manifest || !model) return;
  const resolvedMoodKey = Number(state.stats?.health) < 0 ? 'sick' : moodKey;
  const appearance = state.appearance;
  if (appearance) {
    profile = {
      fur: appearance['Мех']?.['Индекс варианта'] ?? profile.fur,
      ears: appearance['Уши']?.['Уровень'] ?? profile.ears,
      horns: appearance['Рога']?.['Уровень'] ?? profile.horns,
    };
  }
  applyProfile();
  applyNeutralFace();

  const mood = manifest.moods?.[resolvedMoodKey];
  if (!mood) return;
  setMonsterDirt(Math.max(mood.dirt ?? 0, state.dirty ? 1 : 0));
  if (faceMaterial && faceOverlays[mood.overlay]) {
    faceMaterial.userData.pet.petOverlay.value = faceOverlays[mood.overlay];
  }
  Object.entries(mood.morphTargets || {}).forEach(([name, value]) => setMorph(name, value));
  for (const propName of mood.props || []) {
    const prop = model.getObjectByName(propName);
    if (prop) prop.visible = true;
  }
  for (const material of petMaterials) {
    material.userData.pet.petSaturation.value *= mood.tint?.saturation ?? 1;
    material.userData.pet.petValue.value *= mood.tint?.value ?? 1;
  }
  return resolvedMoodKey;
}

function renderRoomHud(records = readProfileRecords(getUserProfileId())) {
  const state = deriveRoomState(records);
  roomDay.textContent = String(state.day);
  roomPocket.textContent = formatCoins(state.pocket);
  roomSavings.textContent = formatCoins(state.savings);
  finishName.textContent = state.name;
  roomHunger.textContent = state.hungry ? 'Голодный' : 'Сытый';
  roomHunger.classList.toggle('needs-care', state.hungry);
  roomHygiene.textContent = state.dirty ? 'Грязный' : 'Чистый';
  roomHygiene.classList.toggle('needs-care', state.dirty);
  Object.entries(state.stats).forEach(([key, value]) => renderRoomStat(key, value));
  const episode = dueEconomicEpisodes(dataMartRows, records)[0] ?? null;
  activeEconomicEpisode = episode;
  roomActions.hidden = Boolean(episode);
  roomEconomicEpisodeButton.hidden = !episode;
  roomEconomicEpisodeButton.textContent = episode ? economicEpisodeButtonLabel(episode, records) : '';
  if (episode) closeRoomAction();
  roomNextDayButton.hidden = Boolean(episode) || !canFinishDay(state);
  renderFinalBar(records);
  renderMessagesBadge(records);
  renderTasksBadge(records);
  const moodKey = applyMonsterLook(state);
  const mood = moodKey === 'sick' ? manifest?.moods?.sick : null;
  roomController?.setConditionMood(mood ? {
    clip: mood.clip,
    status: 'болеет и отдыхает',
  } : null);
  if (roomController) roomController.name = state.name;
}

// The title of the data mart episode the park scene plays.
const PARK_EPISODE_TITLE = 'Прогулка в парке';
const TENNIS_ESTIMATE_EPISODE_TITLE = 'Смета проверки гипотезы таланта питомца к теннису';
const TENNIS_ESTIMATE_EPISODE_ID = 119;
const LETTER_OF_CREDIT_EPISODE_TITLE = 'Аккредитивы';
const LETTER_OF_CREDIT_EPISODE_ID = 140;
const ROUTE_EPISODE_TITLE = 'Поездка на тренировку';
const ROUTE_EPISODE_ID = 204;
const BUSINESS_LOANS_EPISODE_TITLE = 'Кредиты для бизнеса';
const BUSINESS_LOANS_EPISODE_ID = 273;
const REPAIR_EPISODE_TITLE = 'Поломка удалителя козявок';
const REPAIR_EPISODE_ID = 352;
// True from the father's visit until the player is back in the room: room messages wait meanwhile.
let fatherEpisodeRunning = false;
// An episode the player has left halfway invites them back instead of starting anew.
const ECONOMIC_EPISODE_RETURN_LABELS = {
  [PARK_EPISODE_TITLE]: 'Вернуться в парк',
  [TENNIS_ESTIMATE_EPISODE_TITLE]: 'Вернуться к смете',
  [LETTER_OF_CREDIT_EPISODE_TITLE]: 'Вернуться к аккредитивам',
  [ROUTE_EPISODE_TITLE]: 'Вернуться к маршрутам',
  [BUSINESS_LOANS_EPISODE_TITLE]: 'Вернуться к заявкам',
  [REPAIR_EPISODE_TITLE]: 'Вернуться к поломке',
};
// Economic episodes that open with the father bursting into the room: after his last line the
// episode's own screen opens. `racket` keeps the tennis racket in his hand.
const FATHER_VISITS = {
  [TENNIS_ESTIMATE_EPISODE_ID]: { open: openTennisEstimate, finalLabel: 'Составить смету', racket: true },
  [LETTER_OF_CREDIT_EPISODE_ID]: { open: openLetterOfCredit, finalLabel: 'Выручить папу', racket: false },
  [BUSINESS_LOANS_EPISODE_ID]: { open: openBusinessLoans, finalLabel: 'Сесть за папин стол', racket: false },
};

function fatherVisit(episode) {
  return episode ? FATHER_VISITS[Number(episode.id)] ?? null : null;
}

function economicEpisodeButtonLabel(episode, records) {
  if (!isEconomicEpisodeStarted(records, episode)) return episode.title || '';
  return ECONOMIC_EPISODE_RETURN_LABELS[episode.title] ?? `Продолжить: ${episode.title}`;
}

function recordEconomicEpisodeOpened(episode) {
  const profileId = getUserProfileId();
  const records = readProfileRecords(profileId);
  const state = deriveRoomState(records);
  const alreadyRecorded = records.some((record) => (
    record?.['Тип события'] === ECONOMIC_EPISODE_OPENED_EVENT
    && String(record?.['Идентификатор эпизода']) === String(episode.id)
    && Number(record?.['Игровой день']) === state.day
  ));
  if (alreadyRecorded) return;
  appendProfileRecord({
    'Тип события': ECONOMIC_EPISODE_OPENED_EVENT,
    'Профиль пользователя': profileId,
    'Идентификатор эпизода': episode.id,
    'Название эпизода': episode.title,
    'Триггер': episode.trigger,
    'Игровой день': state.day,
  });
}

roomEconomicEpisodeButton.addEventListener('click', () => {
  const episode = activeEconomicEpisode;
  if (!episode) return;
  if (episode.title === PARK_EPISODE_TITLE) {
    recordEconomicEpisodeOpened(episode);
    enterPark(episode);
    return;
  }
  if (fatherVisit(episode)) {
    startFatherEpisode(episode, { repeatIntro: !isEconomicEpisodeStarted(readProfileRecords(getUserProfileId()), episode) });
    return;
  }
  if (isTrainerCallEpisode(episode)) {
    startTrainerCall(episode, { repeatIntro: !isEconomicEpisodeStarted(readProfileRecords(getUserProfileId()), episode) });
    return;
  }
  if (isRepairEpisode(episode)) {
    openRepairEpisode(episode);
    return;
  }
  if (episode.title !== PARK_EPISODE_TITLE) {
    showRoomMessage(`Эпизод «${episode.title}» пока не подключён`);
  }
});

// --- Финальная часть игры: дни идут сами -------------------------------------

// From day 10 on the monster eats and gets cleaned by itself and the days change by themselves.
// The player starts the run with ▶ and it goes on until something needs them (nextFinalStop in
// final-part.js); meanwhile the room only shows what the morning brought, without any voice.
// The goal of the final part is the big goals, bought from the piggy bank only.
const FINAL_DAY_PAUSE_MS = 1600;
const FINAL_MORNING_PAUSE_MS = 700;
const FINAL_TICKER_HIDE_MS = 5000;
const FINAL_TICKER_SIZE = 4;
const FINAL_EPISODE = { title: 'Финальная часть игры', id: null };
const FINAL_NEXT_GOALS_CHOSEN_EVENT = 'Выбор целей после покупки';
const FINAL_NEXT_GOALS_SOURCE = 'Финал: выбор целей после покупки';
const FESTIVAL_LIGHTS_GOAL_ID = '49';
const GAME_CONSOLE_GOAL_ID = '96';
const TELESCOPE_GOAL_ID = '349';
const TELESCOPE_CONCEPT_FOLDER = 'images/telescope_final/concept';
const STAT_TITLES = { health: 'Здоровье', mood: 'Настроение', development: 'Развитие' };
const STAT_DANGER_HINTS = {
  health: 'Здоровье падает, когда монстрик заканчивает день голодным или грязным: следи за кормом и ковырялкой.',
  mood: 'Настроение падает каждый день. Быстрее всего его поднимет новая игрушка из магазина игрушек.',
  development: 'Развитие падает каждый третий день. Помогут развивающие игрушки из магазина игрушек.',
};

const finalBar = $('#final-bar');
const finalGoalLabel = $('#final-goal-label');
const finalGoalName = $('#final-goal-name');
const finalGoalLeft = $('#final-goal-left');
const finalGoalFill = $('#final-goal-fill');
const finalGoalPanel = finalGoalFill.closest('.final-goal');
const finalPurchased = $('#final-purchased');
const finalPurchasedList = $('#final-purchased-list');
const finalBuyButton = $('#final-buy');
const finalBuyLabel = $('#final-buy-label');
const finalRunButton = $('#final-run');
const finalOver = $('#final-over');
const finalRetryButton = $('#final-retry');
const finalTicker = $('#final-ticker');
const finalStopSheet = $('#final-stop');
const finalStopIcon = $('#final-stop-icon');
const finalStopTitle = $('#final-stop-title');
const finalStopText = $('#final-stop-text');
const finalStopPrimary = $('#final-stop-primary');
const finalStopSecondary = $('#final-stop-secondary');
const finalBuySheet = $('#final-buy-goal');
const finalPickSheet = $('#final-pick');
const finalPickList = $('#final-pick-list');
const finalPickSavings = $('#final-pick-savings');
const finalPickClose = $('#final-pick-close');
const finalSceneKicker = $('#final-scene-kicker');
const finalSceneArt = $('#final-scene-art');
const finalSceneImage = $('#final-scene-image');
const finalSceneIcon = $('#final-scene-icon');
const finalSceneTitle = $('#final-scene-title');
const finalSceneText = $('#final-scene-text');
const finalSceneStub = $('#final-scene-stub');
const finalKeep = $('#final-keep');
const finalKeepList = $('#final-keep-list');
const finalKeepFinish = $('#final-keep-finish');
const finalSceneNext = $('#final-scene-next');
const finalSceneLoading = $('#final-scene-loading');
const finalLoadingStatus = $('#final-loading-status');
const finalLoadingProgress = $('#final-loading-progress');
const finalLoadingFill = $('#final-loading-fill');
const finalLoadingCount = $('#final-loading-count');
const finalGoalOffer = createGoalOffer('final-buy', 'images');
let finalRunning = false;
let finalRunId = 0;
let finalTickerTimer = 0;
let finalStopActions = { primary: null, secondary: null };
let finalSceneResolve = null;
let finalReplayRunning = false;

// True while the run or one of its cards has the room: messages wait meanwhile.
function isFinalPartBusy() {
  return finalRunning || finalReplayRunning || !finalStopSheet.hidden || !finalBuySheet.hidden || !finalPickSheet.hidden;
}

// The morning of day 10, right after the fourth budget: the final part begins, and every stat
// below zero starts it from zero.
function startFinalPart() {
  const profileId = getUserProfileId();
  const state = deriveRoomState(readProfileRecords(profileId));
  appendProfileRecord({
    'Тип события': FINAL_PART_START_EVENT,
    'Профиль пользователя': profileId,
    'Характеристики до сброса': Object.fromEntries(Object.entries(state.stats).map(([key, value]) => [STAT_LABELS[key], value])),
    'В копилке': state.savings,
    'Игровой день': state.day,
  });
  for (const [key, value] of Object.entries(state.stats)) {
    if (!(value < 0)) continue;
    appendProfileRecord({
      'Тип события': MONSTER_STAT_EVENT,
      'Профиль пользователя': profileId,
      'Характеристика': STAT_LABELS[key],
      'Изменение': -value,
      'Было': value,
      'Стало': 0,
      'Причина': FINAL_PART_REASON,
      'Игровой день': state.day,
    });
  }
}

// --- The panel under the icons ---

// «Праздник огней», «Праздник огней и ещё 1», or the default sum when no goal is chosen.
function finalGoalWords(target) {
  if (target.isDefault) return `${target.total} монет в копилке`;
  const [first, ...rest] = target.goals;
  return rest.length ? `${first.title} и ещё ${rest.length}` : first.title;
}

function finalGoalSceneKind(goal) {
  if (String(goal?.id) === FESTIVAL_LIGHTS_GOAL_ID) return 'festival-lights';
  if (String(goal?.id) === GAME_CONSOLE_GOAL_ID) return 'game-console';
  if (String(goal?.id) === TELESCOPE_GOAL_ID) return 'telescope';
  return null;
}

function renderFinalPurchased(records, outcome) {
  const goals = outcome
    ? []
    : boughtSavingsGoals(records).filter((goal) => finalGoalSceneKind(goal));
  finalPurchased.hidden = !goals.length;
  finalPurchasedList.replaceChildren(...goals.map((goal) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'final-purchased-button';
    button.dataset.goalId = String(goal.id);
    button.disabled = finalReplayRunning;
    button.setAttribute('aria-label', `Пересмотреть 3D-сцену цели «${goal.title}»`);
    const icon = document.createElement('span');
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '🎬';
    const name = document.createElement('span');
    name.textContent = goal.title;
    button.append(icon, name);
    button.addEventListener('click', () => replayFinalGoalScene(goal));
    return button;
  }));
}

function renderFinalBar(records = readProfileRecords(getUserProfileId())) {
  const final = isFinalPart(records);
  finalBar.hidden = !final;
  if (!final) {
    finalPurchased.hidden = true;
    finalPurchasedList.replaceChildren();
    return;
  }
  roomNextDayButton.hidden = true;
  const state = deriveRoomState(records);
  const outcome = finalOutcome(records);
  const target = finalTarget(records);
  renderFinalPurchased(records, outcome);
  finalGoalPanel.hidden = Boolean(outcome);
  finalGoalLabel.textContent = target.isDefault
    ? 'Цели не выбраны — копим'
    : `Копим на ${pluralRu(target.goals.length, 'цель', 'цели', 'целей')}`;
  finalGoalName.textContent = finalGoalWords(target);
  const left = Math.max(0, target.total - state.savings);
  finalGoalLeft.textContent = left > 0 ? `ещё ${formatCoins(left)}` : 'хватает ✓';
  finalGoalFill.style.width = `${Math.min(100, (Math.max(0, state.savings) / Math.max(1, target.total)) * 100)}%`;

  const affordable = outcome ? [] : affordableGoals(records);
  finalBuyButton.hidden = !affordable.length;
  finalBuyButton.disabled = finalReplayRunning;
  finalBuyLabel.textContent = affordable.length > 1 ? `Купить цель (${affordable.length})` : 'Купить цель';
  finalRunButton.hidden = Boolean(outcome);
  finalRunButton.disabled = finalReplayRunning;
  finalRunButton.classList.toggle('is-running', finalRunning);
  finalRunButton.innerHTML = finalRunning
    ? '<span aria-hidden="true">⏸</span> Пауза'
    : '<span aria-hidden="true">▶</span> Запустить дни';
  finalOver.hidden = !outcome;
  finalRetryButton.hidden = outcome !== 'defeat';
  finalOver.textContent = outcome === 'victory'
    ? '🏆 Победа! Игра пройдена'
    : outcome === 'defeat' ? '💔 Игра окончена: монстрик не выдержал' : '';
}

// --- What the morning brought: a short list over the icons, no voice ---

function showFinalTicker() {
  window.clearTimeout(finalTickerTimer);
  finalTicker.hidden = false;
}

function hideFinalTickerLater() {
  window.clearTimeout(finalTickerTimer);
  finalTickerTimer = window.setTimeout(() => { finalTicker.hidden = true; }, FINAL_TICKER_HIDE_MS);
}

function addFinalTick(icon, title, note = '', tone = '') {
  const item = document.createElement('li');
  item.className = `final-tick ${tone}`.trim();
  const mark = document.createElement('span');
  mark.className = 'final-tick-icon';
  mark.setAttribute('aria-hidden', 'true');
  mark.textContent = icon;
  const body = document.createElement('span');
  const heading = document.createElement('strong');
  heading.textContent = title;
  body.append(heading);
  if (note) {
    const small = document.createElement('small');
    small.textContent = note;
    body.append(small);
  }
  item.append(mark, body);
  finalTicker.append(item);
  while (finalTicker.children.length > FINAL_TICKER_SIZE) finalTicker.firstElementChild.remove();
  showFinalTicker();
}

function startFinalTickerDay(day) {
  finalTicker.replaceChildren();
  addFinalTick('🌅', `День ${day}`, '', 'is-day');
}

// --- The morning chores ---

// Breakfast from the pantry, one portion, as the pantry shelf would pour it.
function autoFeedMonster() {
  const profileId = getUserProfileId();
  const state = deriveRoomState(readProfileRecords(profileId));
  if (!state.hungry) return;
  const portion = autoFeedingPortion(state.inventory);
  if (!portion.enough) {
    addFinalTick('🍲', 'Нечем кормить', `подходящего корма в кладовке ${state.suitableFoodGrams} г`, 'is-alert');
    return;
  }
  writeFeedingRecords(portion.grams, portion.taken, { 'Автоматически': true });
  const after = deriveRoomState(readProfileRecords(profileId)).suitableFoodGrams;
  addFinalTick('🍲', 'Монстрик позавтракал', `корм: было ${state.suitableFoodGrams} г → стало ${after} г`);
}

// The ears, with whatever device the 🤧 icon would pick; the breakdowns of the repair episode
// happen here too, and then the spare does the job.
function autoCleanMonster() {
  const profileId = getUserProfileId();
  const records = readProfileRecords(profileId);
  const state = deriveRoomState(records);
  if (!state.dirty) return;
  let pick = cleaningDevice(state, techItems(), (device) => usedCleanings(records, device));
  if (!pick) {
    addFinalTick('🤧', 'Почистить нечем', 'нужна ковырялка из магазина техники', 'is-alert');
    return;
  }
  if (!pick.device) {
    addFinalTick('🤧', 'Ковырялка в ремонте', pick.repairUntil ? `вернётся к ${pick.repairUntil}-му дню` : '', 'is-alert');
    return;
  }
  let note = '';
  if (pick.left > 0) {
    const breakdown = breakCleanerIfDue(state, records, pick);
    if (breakdown) {
      note = `«${breakdown.device.title}» сломалась и в ремонте до ${breakdown.returnDay}-го дня — почистили запаской`;
      pick = breakdown.spare;
      if (!pick?.device) {
        addFinalTick('🔧', 'Ковырялка сломалась', `«${breakdown.device.title}» в ремонте до ${breakdown.returnDay}-го дня`, 'is-alert');
        return;
      }
    }
  }
  if (pick.left <= 0) {
    const refill = itemSpec(pick.device)?.refillId;
    addFinalTick('🤧', 'Почистить не получилось', refill
      ? `для «${pick.device.title}» нужны картриджи`
      : `у «${pick.device.title}» закончился ресурс`, 'is-alert');
    return;
  }
  const { left } = writeCleaningRecords(pick.device, { 'Автоматически': true });
  addFinalTick('✨', 'Монстрик чистый', note || `«${pick.device.title}»: осталось ${left} ${cleaningsWord(left)}`);
}

// --- The run ---

async function runFinalDays() {
  const records = readProfileRecords(getUserProfileId());
  if (finalRunning || finalReplayRunning || finishScreen.hidden || !isFinalPart(records) || finalOutcome(records)) return;
  const runId = ++finalRunId;
  finalRunning = true;
  closeRoomAction();
  hideRoomMessage();
  closeRoomInbox();
  closeTaskList();
  closeSavingsTransfer();
  setRoomActionsEnabled(false);
  renderFinalBar();
  const alive = () => runId === finalRunId && !finishScreen.hidden;
  startFinalTickerDay(deriveRoomState(records).day);
  let stop = null;
  try {
    while (alive()) {
      if (maybeFinishFinalGame()) return;
      autoFeedMonster();
      autoCleanMonster();
      stop = nextFinalStop(readProfileRecords(getUserProfileId()), { periodDays: BUDGET_PERIOD_DAYS });
      if (stop) break;
      await delay(FINAL_DAY_PAUSE_MS);
      if (!alive()) return;
      const day = writeNextDay();
      switchToDayMusic(day);
      startFinalTickerDay(day);
      await delay(FINAL_MORNING_PAUSE_MS);
    }
  } finally {
    if (runId === finalRunId) {
      finalRunning = false;
      setRoomActionsEnabled(true);
      renderFinalBar();
      hideFinalTickerLater();
    }
  }
  if (stop && alive()) showFinalStop(stop);
}

function pauseFinalDays() {
  if (!finalRunning) return;
  finalRunId += 1;
  finalRunning = false;
  setRoomActionsEnabled(true);
  renderFinalBar();
  hideFinalTickerLater();
}

finalRunButton.addEventListener('click', () => {
  if (finalRunning) {
    pauseFinalDays();
    deliverTriggeredMessages();
  } else {
    runFinalDays();
  }
});

// --- Why the run stopped ---

function foodStore() {
  const { day } = deriveRoomState(readProfileRecords(getUserProfileId()));
  return availableStores(day).find((store) => Number(store.id) !== TOY_STORE_ID && store.title !== TECH_STORE_TITLE) ?? null;
}

function toyStore() {
  const { day } = deriveRoomState(readProfileRecords(getUserProfileId()));
  return availableStores(day).find((store) => Number(store.id) === TOY_STORE_ID) ?? null;
}

const FINAL_RESUME = { label: 'Дальше <span aria-hidden="true">▶</span>', run: () => runFinalDays() };
const FINAL_PAUSE = { label: 'Понятно <span aria-hidden="true">✓</span>', run: () => deliverTriggeredMessages() };

function storeAction(label, store) {
  return store ? { label, run: () => openStore(store) } : FINAL_PAUSE;
}

// The card of a stop: what happened, what the player can do about it, and the way on.
function finalStopCard(stop, records) {
  const state = deriveRoomState(records);
  switch (stop.kind) {
    case 'food-out':
      return {
        icon: '🍲',
        title: 'Корм закончился',
        text: `Монстрику нечего есть: подходящего корма в кладовке ${stop.grams} г, а на завтрак нужно хотя бы ${FEEDING_MIN_GRAMS} г.`
          + ' Купи корм — монстрик позавтракает, как только дни пойдут дальше. Если день закончится голодным, завтра упадёт здоровье.',
        primary: storeAction('🛒 В магазин', foodStore()),
        secondary: { ...FINAL_RESUME, label: 'Без завтрака <span aria-hidden="true">▶</span>' },
      };
    case 'food-low':
      return {
        icon: '🥫',
        title: stop.grams > 0 ? 'Корм на исходе' : 'Корм закончился',
        text: stop.grams > 0
          ? `Монстрик позавтракал, и в кладовке осталось ${stop.grams} г. Завтра этого не хватит — купи корм заранее.`
          : 'Монстрик доел последнюю порцию, кладовка пуста. Купи корм заранее, чтобы завтра было чем позавтракать.',
        primary: storeAction('🛒 В магазин', foodStore()),
        secondary: FINAL_RESUME,
      };
    case 'danger':
      return {
        icon: '⚠️',
        title: `${STAT_TITLES[stop.stat]} упало до −2`,
        text: `Ещё шаг вниз — и поражение: ни одна характеристика не должна опуститься до −3. ${STAT_DANGER_HINTS[stop.stat]}`,
        primary: stop.stat === 'health' ? FINAL_PAUSE : storeAction('🧸 В магазин игрушек', toyStore()),
        secondary: { ...FINAL_RESUME, label: 'Рискнуть <span aria-hidden="true">▶</span>' },
      };
    case 'task':
      return {
        icon: '📋',
        title: 'Новое дополнительное задание',
        text: `«${stop.task.title}»${Number(stop.task.price) > 0 ? ` — за него дадут ${formatCoins(Number(stop.task.price))} в карман` : ''}.`
          + ' Выполнить его можно в любой день.',
        primary: { label: '📋 К заданиям', run: () => openTaskList() },
        secondary: FINAL_RESUME,
      };
    case 'episode':
      return {
        icon: '✦',
        title: stop.episode.title,
        text: 'Сегодня особенный день: сначала пройди этот эпизод, а потом запускай дни дальше.',
        primary: { label: 'Понятно <span aria-hidden="true">✓</span>', run: () => openRoomDay() },
        secondary: { ...FINAL_RESUME, label: 'Пропустить <span aria-hidden="true">▶</span>' },
      };
    case 'budget': {
      const first = state.day - BUDGET_PERIOD_DAYS + 1;
      return {
        icon: '📊',
        title: 'Пора подводить итоги бюджета',
        text: `Дни ${first}–${state.day} позади. Сравним план и факт, а потом папа даст деньги на следующие три дня.`,
        primary: {
          label: 'К итогам <span aria-hidden="true">→</span>',
          run: () => {
            const latest = readProfileRecords(getUserProfileId());
            const round = budgetRoundAfterDay(deriveRoomState(latest).day, latest);
            if (round) openBudgetReview(round);
          },
        },
        secondary: null,
      };
    }
    default:
      return null;
  }
}

function showFinalStop(stop) {
  if (stop.kind === 'victory') {
    declareFinalVictory();
    return;
  }
  if (stop.kind === 'goal') {
    offerFinalGoal(stop.goal);
    return;
  }
  const profileId = getUserProfileId();
  const records = readProfileRecords(profileId);
  const card = finalStopCard(stop, records);
  if (!card) return;
  const { day } = deriveRoomState(records);
  appendProfileRecord({
    'Тип события': FINAL_STOP_EVENT,
    'Профиль пользователя': profileId,
    'Ключ': stop.key ?? `${stop.kind}:${day}`,
    'Причина': card.title,
    'Игровой день': day,
  });
  finalStopIcon.textContent = card.icon;
  finalStopTitle.textContent = card.title;
  finalStopText.textContent = card.text;
  finalStopPrimary.innerHTML = card.primary.label;
  finalStopSecondary.hidden = !card.secondary;
  if (card.secondary) finalStopSecondary.innerHTML = card.secondary.label;
  finalStopActions = { primary: card.primary.run, secondary: card.secondary?.run ?? null };
  finalStopSheet.hidden = false;
  finalStopPrimary.focus({ preventScroll: true });
}

function closeFinalStop(which) {
  if (finalStopSheet.hidden) return;
  const action = finalStopActions[which];
  finalStopActions = { primary: null, secondary: null };
  finalStopSheet.hidden = true;
  action?.();
}

finalStopPrimary.addEventListener('click', () => closeFinalStop('primary'));
finalStopSecondary.addEventListener('click', () => closeFinalStop('secondary'));

// --- Buying a big goal: from the piggy bank only ---

// «Праздник огней», but Телескоп «Звездочёт» keeps its own quotes.
function goalName(goal) {
  const title = String(goal.title ?? '');
  return title.includes('«') ? title : `«${title}»`;
}

function logGoalOffer(goal, decision) {
  const profileId = getUserProfileId();
  const records = readProfileRecords(profileId);
  const state = deriveRoomState(records);
  appendProfileRecord({
    'Тип события': GOAL_OFFER_EVENT,
    'Профиль пользователя': profileId,
    'Идентификатор цели': goal.id,
    'Название цели': goal.title,
    'Стоимость': Number(goal.price) || 0,
    'В копилке': state.savings,
    'Цель была выбрана': acceptedSavingsGoals(records).some((item) => String(item.id) === String(goal.id)),
    'Решение': decision,
    'Игровой день': state.day,
  });
}

// The run has saved up for a goal for the first time, chosen or not: the player may buy it now,
// or later with the «Купить цель» button.
async function offerFinalGoal(goal) {
  const buy = await finalGoalOffer.ask(goal);
  if (buy === null) return;
  logGoalOffer(goal, buy ? 'Куплено' : 'Отложено');
  if (buy) {
    await buyFinalGoal(goal, 'Предложение при пересчёте дней');
    return;
  }
  renderFinalBar();
  runFinalDays();
}

function openFinalPick() {
  pauseFinalDays();
  const records = readProfileRecords(getUserProfileId());
  const goals = affordableGoals(records);
  if (!goals.length) return;
  finalPickSavings.textContent = formatCoins(deriveRoomState(records).savings);
  finalPickList.replaceChildren(...goals.map((goal) => {
    const item = document.createElement('li');
    const image = document.createElement('img');
    image.className = 'final-pick-image';
    image.alt = '';
    image.addEventListener('error', () => { image.hidden = true; });
    if (goal.image) image.src = publicAssetPath(goal.image_folder, goal.image, 'images');
    else image.hidden = true;
    const name = document.createElement('strong');
    name.textContent = goal.title;
    const buy = document.createElement('button');
    buy.type = 'button';
    buy.className = 'primary-button final-pick-buy';
    buy.textContent = `Купить за ${formatCoins(Number(goal.price) || 0)}`;
    buy.addEventListener('click', () => {
      finalPickSheet.hidden = true;
      buyFinalGoal(goal, 'Кнопка «Купить цель»');
    });
    item.append(image, name, buy);
    return item;
  }));
  finalPickSheet.hidden = false;
  finalPickList.querySelector('button')?.focus({ preventScroll: true });
}

finalBuyButton.addEventListener('click', openFinalPick);
finalPickClose.addEventListener('click', () => {
  finalPickSheet.hidden = true;
  deliverTriggeredMessages();
});

// The goal is paid for from the piggy bank: its coins leave the savings article, and the goal is
// bought for good. Then the celebration, and the choice of what to save up for next.
async function buyFinalGoal(goal, source) {
  const profileId = getUserProfileId();
  const records = readProfileRecords(profileId);
  const state = deriveRoomState(records);
  const price = Number(goal.price) || 0;
  if (price > state.savings) return;
  const wasChosen = acceptedSavingsGoals(records).some((item) => String(item.id) === String(goal.id));
  const purpose = `Покупка цели ${goalName(goal)}`;
  appendProfileRecord({
    'Тип события': SAVINGS_SPENDING_EVENT,
    'Профиль пользователя': profileId,
    'Значение': price,
    'Назначение': purpose,
    'Покупка цели': true,
    'Идентификатор цели': goal.id,
    'Название цели': goal.title,
    'Игровой день': state.day,
  });
  appendBudgetFact(records, SAVINGS_ARTICLE, -price, { 'Назначение': purpose, 'Покупка цели': true, 'Игровой день': state.day });
  appendProfileRecord({
    'Тип события': GOAL_PURCHASE_EVENT,
    'Профиль пользователя': profileId,
    'Идентификатор цели': goal.id,
    'Название цели': goal.title,
    'Стоимость': price,
    'Цель была выбрана': wasChosen,
    'Источник': source,
    'В копилке до покупки': state.savings,
    'В копилке после покупки': state.savings - price,
    'Игровой день': state.day,
  });
  await playPurchasedGoalScene(goal);
  if (maybeFinishFinalGame()) return;
  if (!(await chooseNextGoals())) return;
  enterRoom();
}

// After a purchase: which of the goals left the player saves up for now. Every answer is logged.
async function chooseNextGoals() {
  const records = readProfileRecords(getUserProfileId());
  const goals = unboughtGoals(records);
  if (!goals.length) return true;
  const chosen = new Set(acceptedSavingsGoals(records).map((goal) => String(goal.id)));
  finalKeepList.replaceChildren(...goals.map((goal) => {
    const item = document.createElement('li');
    const label = document.createElement('label');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.value = String(goal.id);
    box.checked = chosen.has(String(goal.id));
    const name = document.createElement('span');
    name.textContent = goal.title;
    const price = document.createElement('b');
    price.textContent = formatCoins(Number(goal.price) || 0);
    label.append(box, name, price);
    item.append(label);
    return item;
  }));
  const keepSaving = await showFinalScene({
    kicker: 'ЧТО ДАЛЬШЕ',
    icon: '🐷',
    title: 'Выбери следующую мечту',
    text: `В копилке ${formatCoins(deriveRoomState(records).savings)}. Можно копить на новую цель или закончить игру с победой.`,
    stub: '',
    keep: true,
    next: 'Копим дальше <span aria-hidden="true">🐷</span>',
  });
  if (!keepSaving) {
    for (const goal of goals) {
      logSavingsGoalDecision(goal, FINAL_EPISODE, false, { 'Источник': 'Финал: отказ от дальнейших накоплений' });
    }
    await declareFinalVictory({ stopSaving: true });
    return false;
  }
  const picked = new Set([...finalKeepList.querySelectorAll('input:checked')].map((box) => box.value));
  for (const goal of goals) {
    logSavingsGoalDecision(goal, FINAL_EPISODE, picked.has(String(goal.id)), { 'Источник': FINAL_NEXT_GOALS_SOURCE });
  }
  appendProfileRecord({
    'Тип события': FINAL_NEXT_GOALS_CHOSEN_EVENT,
    'Профиль пользователя': getUserProfileId(),
    'Идентификаторы целей': [...picked],
    'Игровой день': deriveRoomState(readProfileRecords(getUserProfileId())).day,
  });
  return true;
}

// A reload during the celebration must still lead to the next-goal choice. The purchase is
// already saved before the 3D scene starts; this one record marks when that choice is complete.
function hasPendingFinalGoalChoice(records) {
  if (!isFinalPart(records) || finalOutcome(records)) return false;
  const latestPurchase = records.findLastIndex((record) => record?.['Тип события'] === GOAL_PURCHASE_EVENT);
  if (latestPurchase < 0) return false;
  return !records.slice(latestPurchase + 1).some((record) =>
    record?.['Тип события'] === FINAL_NEXT_GOALS_CHOSEN_EVENT
    || (record?.['Тип события'] === SAVINGS_GOAL_DECISION_EVENT && record['Источник'] === FINAL_NEXT_GOALS_SOURCE));
}

// --- Final celebrations and ending screens ---

let festivalLights = null;
let festivalVoice = null;
let gameConsoleFinal = null;
let gameConsoleVoice = null;
let telescopeFinal = null;
let telescopeVoice = null;
let victoryFinale = null;

async function startFestivalLights() {
  finalSceneLoading.hidden = false;
  finalSceneLoading.querySelector('.final-loading-kicker').textContent = 'ПРАЗДНИК ОГНЕЙ';
  finalSceneLoading.querySelector('h2').textContent = 'Зажигаем огни…';
  finalLoadingStatus.textContent = 'Загружаем декорации…';
  finalLoadingProgress.setAttribute('aria-valuenow', '0');
  finalLoadingProgress.setAttribute('aria-valuemax', '7');
  finalLoadingProgress.setAttribute('aria-label', 'Подготовка праздничной сцены');
  finalLoadingFill.style.width = '0%';
  finalLoadingCount.textContent = 'Готово 0 из 7';
  // Give the loading screen a paint before building the scene on the main thread.
  await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
  let prepared = null;
  try {
    await monsterReadyPromise;
    if (!model || !renderer) throw new Error('Модель питомца не загружена');
    prepared = new FestivalLights(model);
    await prepared.load((loaded, total) => {
      finalLoadingProgress.setAttribute('aria-valuenow', String(loaded));
      finalLoadingProgress.setAttribute('aria-valuemax', String(total));
      finalLoadingFill.style.width = `${loaded / total * 100}%`;
      finalLoadingCount.textContent = `Готово ${loaded} из ${total}`;
      if (loaded === total) finalLoadingStatus.textContent = 'Готовим первый кадр…';
    });
    leaveRoom();
    prepared.enter();
    festivalLights = prepared;
    switchBackgroundTrack(ROOT_AUDIO_URLS['./Saturday_Morning_High_Score.mp3'])
      .catch((error) => console.warn('Не удалось включить музыку праздника:', error));
    return true;
  } catch (error) {
    prepared?.exit();
    festivalLights = null;
    console.error('Не удалось открыть сцену праздника:', error);
    return false;
  }
}

function restoreProfileRecords(records) {
  volatileProfileRecords = records;
  try {
    localStorage.setItem(getProfileRecordsStorageKey(getUserProfileId()), JSON.stringify(records));
  } catch (error) {
    console.warn('Не удалось сохранить повторный запуск финала.', error);
  }
}

function stopFestivalLights() {
  festivalVoice?.pause();
  festivalVoice = null;
  festivalLights?.exit();
  festivalLights = null;
  // The renderer belongs to the room again. Leaving its canvas in the celebration art makes
  // the compact next-goal card overflow when the festival layout is removed.
  if (renderer?.domElement.parentElement === finalSceneArt) finishMonsterStage.append(renderer.domElement);
  switchToDayMusic(Math.max(1, deriveRoomState(readProfileRecords(getUserProfileId())).day));
}

async function startGameConsoleFinal() {
  finalSceneLoading.hidden = false;
  finalSceneLoading.querySelector('.final-loading-kicker').textContent = 'ВЕЧЕР ДОМА';
  finalSceneLoading.querySelector('h2').textContent = 'Устраиваемся поудобнее…';
  finalLoadingStatus.textContent = 'Готовим комнату и приставку…';
  finalLoadingProgress.setAttribute('aria-valuenow', '0');
  finalLoadingProgress.setAttribute('aria-valuemax', '1');
  finalLoadingProgress.setAttribute('aria-label', 'Подготовка сцены с приставкой');
  finalLoadingFill.style.width = '0%';
  finalLoadingCount.textContent = 'Загружаем модели';
  await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
  let prepared = null;
  try {
    await monsterReadyPromise;
    if (!model || !renderer) throw new Error('Модель питомца не загружена');
    prepared = new GameConsoleFinal(model);
    await prepared.load();
    finalLoadingProgress.setAttribute('aria-valuenow', '1');
    finalLoadingFill.style.width = '100%';
    finalLoadingCount.textContent = 'Готово';
    finalLoadingStatus.textContent = 'Готовим первый кадр…';
    leaveRoom();
    mixer.stopAllAction();
    applyMonsterLook(deriveRoomState(readProfileRecords(getUserProfileId())), 'happy');
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    prepared.enter();
    gameConsoleFinal = prepared;
    return true;
  } catch (error) {
    prepared?.exit();
    gameConsoleFinal = null;
    finalSceneLoading.hidden = true;
    console.error('Не удалось открыть сцену с приставкой:', error);
    return false;
  }
}

function stopGameConsoleFinal() {
  gameConsoleVoice?.pause();
  gameConsoleVoice = null;
  gameConsoleFinal?.exit();
  gameConsoleFinal = null;
  if (renderer?.domElement.parentElement === finalSceneArt) finishMonsterStage.append(renderer.domElement);
  switchToDayMusic(Math.max(1, deriveRoomState(readProfileRecords(getUserProfileId())).day));
  updateMusicFade();
}

async function startTelescopeFinal() {
  finalSceneLoading.hidden = false;
  finalSceneLoading.querySelector('.final-loading-kicker').textContent = 'К ЗВЁЗДАМ';
  finalSceneLoading.querySelector('h2').textContent = 'Настраиваем телескоп…';
  finalLoadingStatus.textContent = 'Готовим автомобиль, поле и звёзды…';
  finalLoadingProgress.setAttribute('aria-valuenow', '0');
  finalLoadingProgress.setAttribute('aria-valuemax', '4');
  finalLoadingProgress.setAttribute('aria-label', 'Подготовка сцены с телескопом');
  finalLoadingFill.style.width = '0%';
  finalLoadingCount.textContent = 'Готово 0 из 4';
  await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
  let prepared = null;
  try {
    await monsterReadyPromise;
    if (!model || !renderer) throw new Error('Модель питомца не загружена');
    prepared = new TelescopeFinal(model);
    await prepared.prepare((loaded, total) => {
      finalLoadingProgress.setAttribute('aria-valuenow', String(loaded));
      finalLoadingProgress.setAttribute('aria-valuemax', String(total));
      finalLoadingFill.style.width = `${loaded / total * 100}%`;
      finalLoadingCount.textContent = `Готово ${loaded} из ${total}`;
      if (loaded === total) finalLoadingStatus.textContent = 'Готовим первый кадр…';
    });
    leaveRoom();
    mixer.stopAllAction();
    applyMonsterLook(deriveRoomState(readProfileRecords(getUserProfileId())), 'happy');
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    prepared.enter();
    telescopeFinal = prepared;
    return true;
  } catch (error) {
    prepared?.exit();
    telescopeFinal = null;
    finalSceneLoading.hidden = true;
    console.error('Не удалось открыть сцену с телескопом:', error);
    return false;
  }
}

function stopTelescopeFinal() {
  telescopeVoice?.pause();
  telescopeVoice = null;
  telescopeFinal?.exit();
  telescopeFinal = null;
  if (renderer?.domElement.parentElement === finalSceneArt) finishMonsterStage.append(renderer.domElement);
  switchToDayMusic(Math.max(1, deriveRoomState(readProfileRecords(getUserProfileId())).day));
  updateMusicFade();
}

// The celebration is deliberately separate from the purchase transaction. It is used once after
// payment and can later be replayed from the room without touching the piggy bank or the event log.
async function playPurchasedGoalScene(goal, { replay = false } = {}) {
  const state = deriveRoomState(readProfileRecords(getUserProfileId()));
  const next = replay
    ? 'В комнату <span aria-hidden="true">→</span>'
    : 'Дальше <span aria-hidden="true">→</span>';
  if (finalGoalSceneKind(goal) === 'festival-lights') {
    const ready = await startFestivalLights();
    if (!ready) {
      await showFinalScene({
        kicker: 'ПРАЗДНИК ОГНЕЙ',
        icon: '✨',
        title: 'Огни пока не зажглись',
        text: 'Праздничная сцена не загрузилась. Покупка сохранена — её можно будет посмотреть ещё раз из комнаты.',
        stub: '',
        next,
      });
      return;
    }
    try {
      await showFinalScene({
        kicker: 'ПРАЗДНИК ОГНЕЙ',
        icon: '✨',
        title: 'Танец среди огней',
        text: `${state.name} снова среди других монстров. Они танцуют вместе под тёплым светом фонариков.`,
        stub: '',
        next: 'Дальше <span aria-hidden="true">→</span>',
        festivalPhase: 'dance',
      });
      const thanks = dataMartRows.find((row) => row?.object_type === 'Monster line'
        && row.trigger === 'festival-lights-thanks');
      await showFinalScene({
        kicker: 'КОГДА ПРАЗДНИК ЗАКОНЧИЛСЯ',
        icon: '💛',
        title: `${state.name} говорит тебе спасибо`,
        text: thanks?.text ?? '',
        stub: '',
        next,
        festivalPhase: 'farewell',
      });
    } finally {
      stopFestivalLights();
    }
    return;
  }
  if (finalGoalSceneKind(goal) === 'game-console') {
    const ready = await startGameConsoleFinal();
    if (!ready) {
      await showFinalScene({
        kicker: 'ВЕЧЕР ДОМА',
        icon: '🎮',
        title: 'Игра пока не запустилась',
        text: 'Сцена с приставкой не загрузилась. Покупка сохранена — её можно будет посмотреть ещё раз из комнаты.',
        stub: '',
        next,
      });
      return;
    }
    try {
      await showFinalScene({
        kicker: 'ВЕЧЕР ДОМА',
        icon: '🎮',
        title: `${state.name} играет с тобой`,
        text: 'За окном темнеет. Монстрик увлечён игрой, а дома тепло и спокойно.',
        stub: '',
        next: 'Дальше <span aria-hidden="true">→</span>',
        gameConsolePhase: 'play',
      });
      const thanks = dataMartRows.find((row) => row?.object_type === 'Monster line'
        && row.trigger === 'game-console-thanks');
      await showFinalScene({
        kicker: 'ВРЕМЯ ВМЕСТЕ',
        icon: '💛',
        title: `${state.name} говорит тебе спасибо`,
        text: thanks?.text ?? '',
        stub: '',
        next,
        gameConsolePhase: 'thanks',
      });
    } finally {
      stopGameConsoleFinal();
    }
    return;
  }
  if (finalGoalSceneKind(goal) === 'telescope') {
    const ready = await startTelescopeFinal();
    const conceptNote = ready ? '' : 'Эскиз сцены — 3D-модели пока не загрузились';
    const thanks = dataMartRows.find((row) => row?.object_type === 'Monster line'
      && row.trigger === 'telescope-thanks');
    try {
      await showFinalScene({
        kicker: 'ГДЕ-ТО СРЕДИ ЗВЁЗД',
        image: ready ? '' : publicAssetPath(TELESCOPE_CONCEPT_FOLDER, 'scene-space.png', 'images'),
        icon: '✨',
        title: 'Путь к Земле',
        text: 'Камера пролетает сквозь звёзды и находит Землю.',
        stub: conceptNote,
        next: 'Дальше <span aria-hidden="true">→</span>',
        telescopePhase: 'space',
      });
      await showFinalScene({
        kicker: 'ВСЁ БЛИЖЕ К ЗЕМЛЕ',
        image: ready ? '' : publicAssetPath(TELESCOPE_CONCEPT_FOLDER, 'scene-descent.png', 'images'),
        icon: '🌍',
        title: 'Внизу загорается огонёк',
        text: 'Камера проходит сквозь облака к полю, где ждёт маленький жёлтый автомобиль.',
        stub: conceptNote,
        next: 'Дальше <span aria-hidden="true">→</span>',
        telescopePhase: 'descent',
      });
      await showFinalScene({
        kicker: 'ВЕЧЕР В ПОЛЕ',
        image: ready ? '' : publicAssetPath(TELESCOPE_CONCEPT_FOLDER, 'scene-observing-portrait.png', 'images'),
        icon: '🔭',
        title: `${state.name} смотрит на звёзды`,
        text: 'Монстрик стоит на пледе на крыше жёлтого автомобиля и заглядывает в телескоп. Услышав тебя, он отвлекается от наблюдения.',
        stub: conceptNote,
        next: 'Дальше <span aria-hidden="true">→</span>',
        telescopePhase: 'observing',
      });
      await showFinalScene({
        kicker: 'ПОД БЕСКРАЙНИМ НЕБОМ',
        image: ready ? '' : publicAssetPath(TELESCOPE_CONCEPT_FOLDER, 'scene-thanks.png', 'images'),
        icon: '💛',
        title: `${state.name} говорит тебе`,
        text: thanks?.text ?? 'Реплика пока не найдена в ДатаМарт.',
        stub: conceptNote,
        next,
        telescopePhase: 'thanks',
      });
    } finally {
      stopTelescopeFinal();
    }
    return;
  }
  await showFinalScene({
    kicker: 'МЕЧТА СБЫЛАСЬ',
    image: goal.image ? publicAssetPath(goal.image_folder, goal.image, 'images') : '',
    icon: '🎁',
    title: `${goalName(goal)} — ваш!`,
    text: `Поздравляем с победой! Ты откладывал монеты бюджет за бюджетом, и копилка оплатила мечту целиком: ${formatCoins(Number(goal.price) || 0)}.`,
    stub: 'Здесь будет красочная 3D-сцена: монстрик радуется покупке',
    next,
  });
}

async function replayFinalGoalScene(goal) {
  if (finalReplayRunning || !finalGoalSceneKind(goal)) return;
  const records = readProfileRecords(getUserProfileId());
  if (finalOutcome(records)
    || !boughtSavingsGoals(records).some((item) => String(item.id) === String(goal.id))) return;
  finalReplayRunning = true;
  pauseFinalDays();
  closeRoomAction();
  hideRoomMessage();
  setRoomActionsEnabled(false);
  renderFinalBar(records);
  try {
    await playPurchasedGoalScene(goal, { replay: true });
  } catch (error) {
    console.error('Не удалось повторить сцену купленной цели:', error);
  } finally {
    if (festivalLights) stopFestivalLights();
    if (gameConsoleFinal) stopGameConsoleFinal();
    if (telescopeFinal) stopTelescopeFinal();
    finalReplayRunning = false;
    setRoomActionsEnabled(true);
    await enterRoom();
    [...finalPurchasedList.querySelectorAll('.final-purchased-button')]
      .find((button) => button.dataset.goalId === String(goal.id))
      ?.focus({ preventScroll: true });
  }
}

async function revealPreparedFinalScene() {
  const prepared = festivalLights || gameConsoleFinal || telescopeFinal;
  try {
    if (prepared) {
      const width = finalSceneArt.clientWidth;
      const height = finalSceneArt.clientHeight;
      if (!width || !height) throw new Error('У финальной сцены нет размера');
      renderer.setSize(width, height, false);
      prepared.resize(width, height);
      await renderer.compileAsync(prepared.scene, prepared.camera);
      renderer.render(prepared.scene, prepared.camera);
    }
    // Keep the cover through one complete paint of the prepared canvas.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  } catch (error) {
    console.error('Не удалось нарисовать финальную сцену:', error);
    if (festivalLights) stopFestivalLights();
    if (gameConsoleFinal) stopGameConsoleFinal();
    if (telescopeFinal) stopTelescopeFinal();
    finalSceneScreen.classList.remove('is-festival');
    finalSceneScreen.classList.remove('is-game-console');
    finalSceneScreen.classList.remove('is-telescope-3d');
    finalSceneImage.hidden = true;
    finalSceneIcon.textContent = '🎬';
    finalSceneIcon.hidden = false;
    finalSceneText.textContent = 'Сцена не открылась. Покупка сохранена — её можно будет посмотреть ещё раз из комнаты.';
  } finally {
    finalSceneLoading.hidden = true;
    finalSceneScreen.classList.remove('is-preparing');
    finalSceneNext.disabled = false;
    finalSceneNext.focus({ preventScroll: true });
  }
}

function showFinalScene({ kicker, image = '', icon, title, text, stub, next, keep = false, festivalPhase = '', gameConsolePhase = '', telescopePhase = '' }) {
  pauseFinalDays();
  closeRoomAction();
  if (!festivalLights && !gameConsoleFinal && !telescopeFinal) leaveRoom();
  finalSceneKicker.textContent = kicker;
  finalSceneImage.hidden = !image;
  if (image) {
    finalSceneImage.src = image;
    finalSceneImage.alt = title;
  }
  finalSceneIcon.textContent = icon;
  finalSceneIcon.hidden = Boolean(image);
  finalSceneTitle.textContent = title;
  finalSceneText.textContent = text;
  finalSceneStub.textContent = stub;
  finalSceneStub.parentElement.hidden = !stub;
  finalKeep.hidden = !keep;
  finalKeepFinish.hidden = !keep;
  finalSceneScreen.classList.toggle('is-choice', keep);
  finalSceneScreen.classList.toggle('is-festival', Boolean(festivalPhase && festivalLights));
  finalSceneScreen.classList.toggle('is-game-console', Boolean(gameConsolePhase && gameConsoleFinal));
  finalSceneScreen.classList.toggle('is-telescope', Boolean(telescopePhase));
  finalSceneScreen.classList.toggle('is-telescope-3d', Boolean(telescopePhase && telescopeFinal));
  if (telescopePhase) finalSceneScreen.dataset.telescopePhase = telescopePhase;
  else delete finalSceneScreen.dataset.telescopePhase;
  const preparing = !finalSceneLoading.hidden;
  finalSceneScreen.classList.toggle('is-preparing', preparing);
  showOnlyScreen(finalSceneScreen);
  if (festivalPhase && festivalLights) {
    if (festivalPhase === 'farewell') festivalLights.farewell();
    if (festivalPhase === 'farewell') {
      mixer.stopAllAction();
      const greeting = model?.userData.animations?.find((clip) => clip.name === 'Big_Wave_Hello');
      if (greeting) {
        const action = mixer.clipAction(greeting);
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
        action.reset().fadeIn(0.4).play();
      }
      const line = dataMartRows.find((row) => row?.object_type === 'Monster line' && row.trigger === 'festival-lights-thanks');
      if (line?.audio) {
        festivalVoice = new Audio(publicAssetPath(line.audio_folder, line.audio, 'audio'));
        festivalVoice.muted = muted;
        festivalVoice.addEventListener('play', updateMusicFade);
        festivalVoice.addEventListener('pause', updateMusicFade);
        festivalVoice.addEventListener('ended', updateMusicFade);
        festivalVoice.play().catch((error) => console.info('Озвучка запустится после нажатия:', error));
      }
    } else playDance();
    attachRenderer(finalSceneArt);
  }
  if (gameConsolePhase && gameConsoleFinal) {
    if (gameConsolePhase === 'thanks') {
      gameConsoleFinal.thanks();
      const line = dataMartRows.find((row) => row?.object_type === 'Monster line'
        && row.trigger === 'game-console-thanks');
      if (line?.audio) {
        gameConsoleVoice = new Audio(publicAssetPath(line.audio_folder, line.audio, 'audio/game_console_final'));
        gameConsoleVoice.muted = muted;
        gameConsoleVoice.addEventListener('play', updateMusicFade);
        gameConsoleVoice.addEventListener('pause', updateMusicFade);
        gameConsoleVoice.addEventListener('ended', updateMusicFade);
        gameConsoleVoice.play().catch((error) => console.info('Озвучка запустится после нажатия:', error));
      }
    } else gameConsoleFinal.play();
    attachRenderer(finalSceneArt);
  }
  if (telescopePhase && telescopeFinal) {
    if (telescopePhase === 'descent') telescopeFinal.approach();
    else if (telescopePhase === 'observing') telescopeFinal.observe();
    else if (telescopePhase === 'thanks') telescopeFinal.thanks();
    attachRenderer(finalSceneArt);
  }
  if (telescopePhase === 'thanks') {
    const line = dataMartRows.find((row) => row?.object_type === 'Monster line'
      && row.trigger === 'telescope-thanks');
    if (line?.audio) {
      const voice = new Audio(publicAssetPath(line.audio_folder, line.audio, 'audio/telescope_final'));
      telescopeVoice = voice;
      voice.muted = muted;
      voice.addEventListener('play', updateMusicFade);
      voice.addEventListener('pause', updateMusicFade);
      voice.addEventListener('ended', updateMusicFade);
      voice.addEventListener('error', () => {
        if (telescopeVoice === voice) telescopeVoice = null;
        updateMusicFade();
      });
      voice.play().catch((error) => console.info('Озвучка запустится после нажатия:', error));
    }
  }
  finalSceneNext.innerHTML = next;
  finalSceneNext.disabled = preparing;
  const choice = new Promise((resolve) => { finalSceneResolve = resolve; });
  if (preparing) revealPreparedFinalScene();
  else finalSceneNext.focus({ preventScroll: true });
  return choice;
}

finalKeepFinish.addEventListener('click', () => {
  const resolve = finalSceneResolve;
  finalSceneResolve = null;
  resolve?.(false);
});

finalSceneImage.addEventListener('error', () => {
  if (!finalSceneImage.getAttribute('src')) return;
  finalSceneImage.hidden = true;
  finalSceneIcon.hidden = false;
});

finalSceneNext.addEventListener('click', () => {
  festivalVoice?.pause();
  gameConsoleVoice?.pause();
  telescopeVoice?.pause();
  const resolve = finalSceneResolve;
  finalSceneResolve = null;
  resolve?.(true);
});

const VICTORY_PORTRAIT_ZOOM = 1.55;

// The full victory is drawn in 2D by victory-finale.js; only its gold medal holds the live monster.
function startVictoryFinale(details) {
  victoryFinale?.stop();
  victoryFinale = new VictoryFinale({ screen: finalSceneScreen, art: finalSceneArt, isMuted: () => muted, ...details });
  if (renderer && model && !roomController?.active) {
    attachRenderer(victoryFinale.portrait);
    // The editor camera frames the whole figure; the medal wants it closer.
    editorCamera.zoom = VICTORY_PORTRAIT_ZOOM;
    editorCamera.updateProjectionMatrix();
    playDance();
  }
  victoryFinale.start();
}

function stopVictoryFinale() {
  victoryFinale?.stop();
  if (editorCamera) {
    editorCamera.zoom = 1;
    editorCamera.updateProjectionMatrix();
  }
  victoryFinale = null;
}

async function declareFinalVictory({ stopSaving = false } = {}) {
  const profileId = getUserProfileId();
  const records = readProfileRecords(profileId);
  const state = deriveRoomState(records);
  const left = new Set(unboughtGoals(records).map((goal) => goal.id));
  const bought = savingsGoalRows().filter((goal) => !left.has(goal.id));
  const allBought = !left.size;
  const target = finalTarget([]).total;
  const spent = goalsSpent(records);
  appendProfileRecord({
    'Тип события': FINAL_VICTORY_EVENT,
    'Профиль пользователя': profileId,
    'Условие': stopSaving ? 'Игрок завершил накопления после покупки цели'
      : allBought ? 'Куплены все цели' : `Куплено целей и лежит в копилке вместе ${target} монет`,
    'Куплены цели': bought.map((goal) => goal.title),
    'Потрачено на цели': spent,
    'В копилке': state.savings,
    'Накоплено всего': spent + state.savings,
    'Игровой день': state.day,
  });
  const scene = showFinalScene({
    kicker: stopSaving ? 'ИГРА ПРОЙДЕНА' : 'ФИНАЛ ИГРЫ',
    icon: '🏆',
    title: stopSaving ? 'Поздравляем с победой!' : 'Полная и безоговорочная победа!',
    text: stopSaving
      ? `Вы с ${state.name} исполнили мечту: ${bought.map(goalName).join(', ')}. Ты научился планировать деньги и сам решил, когда остановиться. Игра пройдена!`
      : allBought
      ? `Все мечты куплены: ${bought.map(goalName).join(', ')}. За ${state.day} ${daysWord(state.day)} ${state.name} получил всё, о чём мечтал, а ты научился планировать деньги!`
      : `${spent > 0 ? `Цели на ${formatCoins(spent)} куплены, и в копилке ещё ${formatCoins(state.savings)} — вместе ${formatCoins(spent + state.savings)}` : `В копилке ${formatCoins(state.savings)}`}:`
        + ` цель в ${target} монет достигнута за ${state.day} ${daysWord(state.day)}. Ты настоящий мастер бюджета!`,
    stub: '',
    next: 'В комнату <span aria-hidden="true">→</span>',
  });
  startVictoryFinale({
    name: state.name,
    total: spent + state.savings,
    day: state.day,
    stamps: [
      ...bought.map((goal) => ({
        title: goal.title,
        image: goal.image ? publicAssetPath(goal.image_folder, goal.image, 'images') : '',
      })),
      ...(state.savings > 0 ? [{ title: formatCoins(state.savings), icon: '🐷', mark: 'В КОПИЛКЕ' }] : []),
    ],
  });
  try {
    await scene;
  } finally {
    stopVictoryFinale();
  }
  enterRoom();
}

async function declareFinalDefeat(stats) {
  const profileId = getUserProfileId();
  const state = deriveRoomState(readProfileRecords(profileId));
  appendProfileRecord({
    'Тип события': FINAL_DEFEAT_EVENT,
    'Профиль пользователя': profileId,
    'Характеристики': stats.map((key) => STAT_LABELS[key]),
    'В копилке': state.savings,
    'Игровой день': state.day,
  });
  const names = stats.map((key) => STAT_TITLES[key]).join(' и ');
  await showFinalScene({
    kicker: 'ИГРА ОКОНЧЕНА',
    icon: '💔',
    title: 'Поражение',
    text: `${names} монстрика ${stats.length > 1 ? 'упали' : 'упало'} до −3 на ${state.day}-й день.`
      + ' Копить — это важно, но о питомце нельзя забывать ни на день.',
    stub: 'Здесь будет 3D-сцена поражения',
    next: 'Начать финал заново <span aria-hidden="true">↺</span>',
  });
  retryFinalPart();
}

function retryFinalPart() {
  const records = readProfileRecords(getUserProfileId());
  if (finalOutcome(records) !== 'defeat') return;
  const finalStart = records.findIndex((record) => record?.['Тип события'] === FINAL_PART_START_EVENT);
  if (finalStart < 0) return;
  restoreProfileRecords(records.slice(0, finalStart));
  startFinalPart();
  enterRoom();
}

finalRetryButton.addEventListener('click', retryFinalPart);

// The end of the game, whenever it comes: a stat at −3 is the defeat, every goal bought or the
// default sum saved is the full victory. Returns true when a final scene has taken over.
function maybeFinishFinalGame() {
  const records = readProfileRecords(getUserProfileId());
  if (!isFinalPart(records) || finalOutcome(records)) return false;
  const lost = statsAtOrBelow(deriveRoomState(records), DEFEAT_LEVEL);
  if (lost.length) {
    declareFinalDefeat(lost);
    return true;
  }
  if (isFullVictory(records)) {
    declareFinalVictory();
    return true;
  }
  return false;
}

// --- Tennis talent estimate -------------------------------------------------

const FATHER_LINE_OBJECT_TYPE = 'Father line';
const TENNIS_ESTIMATE_ITEM_OBJECT_TYPE = 'Tennis estimate item';
const TENNIS_ESTIMATE_TUTORIAL_OBJECT_TYPE = 'Tennis estimate tutorial';
const TENNIS_ESTIMATE_TUTORIAL_SEEN_EVENT = 'Просмотр туториала сметы';
const TENNIS_ESTIMATE_CONTENT = 'Проверка гипотезы таланта к теннису: сначала минимальная разовая смета, затем крупные вложения.';
const TENNIS_ESTIMATE_REQUIRED_KEYS = new Set(['diagnostic', 'court-hour', 'own-racket']);
// The monster is glad to be going to tennis: an approved estimate lifts its mood by one.
const TENNIS_ESTIMATE_MOOD_REASON = 'Монстрик рад, что пойдёт на теннис';
const TENNIS_ESTIMATE_FOCUS_PADDING = 6;

const FATHER_THANKS_TRIGGER = 'father-thanks';
const FATHER_THANKS_EVENT = 'Благодарность папы';
const FATHER_MOOD_LABELS = {
  angry: 'СЕРДИТСЯ',
  happy: 'ВООДУШЕВЛЁН',
  worried: 'ВСТРЕВОЖЕН',
  embarrassed: 'СМУЩЁН',
  grateful: 'БЛАГОДАРЕН',
};

let activeTennisEstimateEpisode = null;
// The father's visit on screen: { lines, finalLabel, finalIcon, racket, reward, done }.
let fatherScene = null;
let fatherLineIndex = 0;
let shownFatherLine = null;
let fatherSilentTalkTimer = 0;
let selectedTennisEstimateItems = new Set();
let tennisEstimateTutorialSteps = [];
let tennisEstimateTutorialIndex = 0;
let tennisEstimateApproved = false;
// How many coins the player lacked for their share at the last approved submit; 0 hides the note.
let tennisEstimateShortage = 0;

// What the father says when he bursts in; his thanks after the episode is a line of its own.
function fatherLines(episode) {
  return dataMartRows
    .filter((row) => row?.object_type === FATHER_LINE_OBJECT_TYPE && row.title === episode?.title
      && row.trigger !== FATHER_THANKS_TRIGGER)
    .sort((left, right) => Number(left.queue) - Number(right.queue));
}

function fatherThanksLine(episode) {
  return dataMartRows.find((row) => (
    row?.object_type === FATHER_LINE_OBJECT_TYPE && row.title === episode?.title && row.trigger === FATHER_THANKS_TRIGGER
  )) ?? null;
}

function fatherLineMood(line) {
  const mood = line?.screen_area?.mood;
  return FATHER_MOOD_LABELS[mood] ? mood : 'angry';
}

function tennisEstimateItems() {
  return dataMartRows
    .filter((row) => row?.object_type === TENNIS_ESTIMATE_ITEM_OBJECT_TYPE
      && Number(row.game_day) === Number(activeTennisEstimateEpisode?.game_day))
    .sort((left, right) => Number(left.queue) - Number(right.queue));
}

function selectedTennisItems() {
  return tennisEstimateItems().filter((item) => selectedTennisEstimateItems.has(String(item.id)));
}

function tennisEstimateAmounts(items = selectedTennisItems()) {
  const total = items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const father = Math.round(total * 0.9);
  return {
    total,
    father,
    player: total - father,
    recurring: items
      .filter((item) => item.screen_area?.billing === 'subscription')
      .reduce((sum, item) => sum + (Number(item.price) || 0), 0),
  };
}

function estimatePriceText(item) {
  const price = Number(item.price) || 0;
  const monthlyPrice = Number(item.screen_area?.monthly_price) || 0;
  if (item.screen_area?.billing === 'subscription' && monthlyPrice) return `${formatMoney(monthlyPrice)} / месяц`;
  return price ? formatMoney(price) : 'Бесплатно';
}

function estimateTermsText(item) {
  const area = item.screen_area || {};
  if (area.billing !== 'subscription') return String(item.text || 'Разовый расход');
  const months = Number(area.minimum_months) || 1;
  const autoRenew = area.auto_renew ? ' · автопродление' : '';
  return `Минимум ${months} ${pluralRu(months, 'месяц', 'месяца', 'месяцев')} · всего ${formatMoney(item.price)}${autoRenew}`;
}

function createTennisEstimateItem(item) {
  const area = item.screen_area || {};
  const selected = selectedTennisEstimateItems.has(String(item.id));
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'estimate-item';
  button.setAttribute('aria-pressed', String(selected));
  button.setAttribute('aria-label', `${item.title}, ${estimatePriceText(item)}`);

  const badges = document.createElement('span');
  badges.className = 'estimate-item-badges';
  const badge = document.createElement('span');
  badge.className = 'estimate-item-badge';
  badge.textContent = area.badge || item.category || 'ПРЕДЛОЖЕНИЕ';
  badges.append(badge);
  if (area.billing === 'subscription') {
    const recurringBadge = document.createElement('span');
    recurringBadge.className = 'estimate-item-badge is-recurring';
    recurringBadge.textContent = 'ПЛАТЁЖ КАЖДЫЙ МЕСЯЦ';
    badges.append(recurringBadge);
  }

  const title = document.createElement('span');
  title.className = 'estimate-item-title';
  const icon = document.createElement('span');
  icon.className = 'estimate-item-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = area.icon || '🎾';
  const titleText = document.createElement('span');
  titleText.textContent = item.title;
  title.append(icon, titleText);

  const marketing = document.createElement('span');
  marketing.className = 'estimate-item-copy';
  marketing.textContent = area.marketing || item.text || '';

  const price = document.createElement('span');
  price.className = 'estimate-item-price';
  if (Number(item.old_price) > Number(item.price)) {
    const oldPrice = document.createElement('s');
    oldPrice.className = 'estimate-item-old-price';
    oldPrice.textContent = formatMoney(item.old_price);
    price.append(oldPrice);
  }
  const currentPrice = document.createElement('b');
  currentPrice.textContent = estimatePriceText(item);
  price.append(currentPrice);

  const terms = document.createElement('span');
  terms.className = `estimate-item-terms${area.billing === 'subscription' ? ' is-recurring' : ''}`;
  terms.textContent = estimateTermsText(item);
  button.append(badges, title, marketing, price, terms);
  button.addEventListener('click', () => {
    if (tennisEstimateApproved) return;
    const id = String(item.id);
    if (selectedTennisEstimateItems.has(id)) selectedTennisEstimateItems.delete(id);
    else selectedTennisEstimateItems.add(id);
    tennisEstimateShortage = 0;
    renderTennisEstimate();
  });
  return button;
}

function renderTennisEstimate() {
  const items = tennisEstimateItems();
  const selected = selectedTennisItems();
  const amounts = tennisEstimateAmounts(selected);
  estimateItems.replaceChildren(...items.map(createTennisEstimateItem));
  estimateSelectedCount.textContent = `Выбрано: ${selected.length}`;
  estimateTotal.textContent = formatMoney(amounts.total);
  estimateFatherShare.textContent = formatMoney(amounts.father);
  estimatePlayerShare.textContent = formatMoney(amounts.player);
  estimateRecurring.hidden = amounts.recurring <= 0;
  estimateRecurringTotal.textContent = formatMoney(amounts.recurring);
  estimateShortage.hidden = tennisEstimateShortage <= 0;
  estimateShortage.textContent = `Не хватает ${formatMoney(tennisEstimateShortage)} на твою долю — даже вместе с копилкой`;
  estimateSubmit.disabled = tennisEstimateApproved || selected.length === 0;
}

// The player pays their share like any purchase, from the pocket; what the pocket lacks comes
// from the piggy bank, as the room transfer would move it. null when even both together fall short.
function tennisEstimateSavingsPart(share, { pocket, savings }) {
  const missing = Math.max(0, share - Math.max(0, pocket));
  return missing <= Math.max(0, savings) ? missing : null;
}

function tennisEstimateVerdict(items) {
  const keys = new Set(items.map((item) => item.screen_area?.key));
  if ([...TENNIS_ESTIMATE_REQUIRED_KEYS].some((key) => !keys.has(key))) return 'estimate-missing-test';
  if (items.some((item) => item.screen_area?.billing === 'subscription')) return 'estimate-recurring-early';
  if (items.some((item) => !TENNIS_ESTIMATE_REQUIRED_KEYS.has(item.screen_area?.key))) return 'estimate-premature-extras';
  return null;
}

function estimateDecisionExplanation(verdict) {
  if (verdict === 'estimate-missing-test') return 'В смете нет полного минимального набора для пробного занятия.';
  if (verdict === 'estimate-recurring-early') return 'В смету включены постоянные обязательства до проверки гипотезы.';
  if (verdict === 'estimate-premature-extras') return 'В смету включены покупки, которые не нужны для первой проверки.';
  return 'Выбран полный минимальный набор разовых расходов без преждевременных обязательств.';
}

function logTennisEstimateAttempt(verdict, items, amounts) {
  const state = deriveRoomState(readProfileRecords(getUserProfileId()));
  logDecision(!verdict, {
    episode: TENNIS_ESTIMATE_CONTENT,
    'Название эпизода': activeTennisEstimateEpisode.title,
    'Идентификатор эпизода': activeTennisEstimateEpisode.id,
    'Пункты сметы': items.map((item) => ({
      'Идентификатор': item.id,
      'Название': item.title,
      'Стоимость': Number(item.price) || 0,
      'Тип платежа': item.screen_area?.billing === 'subscription' ? 'Постоянный' : 'Разовый',
    })),
    'Размер сметы': amounts.total,
    'Доля отца': amounts.father,
    'Списание с игрока': verdict ? 0 : amounts.player,
    'Постоянные обязательства': amounts.recurring,
    'Смета утверждена': !verdict,
    'Решение отменено ментором': Boolean(verdict),
    'Игровой день': state.day,
    explanation: estimateDecisionExplanation(verdict),
  });
}

// The player's 10% leaves the pocket the way a park purchase does, charged to the fun article,
// and the monster's mood goes up. Returns how many of those coins came from the piggy bank and
// what happened to the mood (null when the estimate had been approved already).
function completeTennisEstimate(items, amounts) {
  const episode = activeTennisEstimateEpisode;
  const profileId = getUserProfileId();
  const records = readProfileRecords(profileId);
  const state = deriveRoomState(records);
  const { day } = state;
  if (isEconomicEpisodeCompleted(records, episode)) return { fromSavings: 0, mood: null };

  const purpose = `${episode.title}: 10% утверждённой сметы`;
  const fromSavings = tennisEstimateSavingsPart(amounts.player, state) ?? 0;
  if (fromSavings > 0) {
    logEpisode(SAVINGS_TRANSFER_EPISODE, { 'Игровой день': day });
    appendProfileRecord({
      'Тип события': POCKET_TOPUP_EVENT,
      'Профиль пользователя': profileId,
      'Значение': fromSavings,
      'Назначение': purpose,
      'Игровой день': day,
    });
    appendProfileRecord({
      'Тип события': SAVINGS_TOPUP_EVENT,
      'Профиль пользователя': profileId,
      'Значение': -fromSavings,
      'Назначение': purpose,
      'Игровой день': day,
    });
    appendSavingsWithdrawalFact(records, fromSavings, { 'Назначение': purpose, 'Игровой день': day });
  }
  if (amounts.player > 0) {
    appendProfileRecord({
      'Тип события': POCKET_SPENDING_EVENT,
      'Профиль пользователя': profileId,
      'Значение': amounts.player,
      'Назначение': purpose,
      'Идентификатор эпизода': episode.id,
      'Игровой день': day,
    });
    // The analytics mirror of the spending, as in the shop and the park.
    appendProfileRecord({
      'Тип события': POCKET_TOPUP_EVENT,
      'Профиль пользователя': profileId,
      'Значение': -amounts.player,
      'Назначение': purpose,
      'Идентификатор эпизода': episode.id,
      'Игровой день': day,
    });
    appendProfileRecord({
      'Тип события': BUDGET_FACT_EVENT,
      'Профиль пользователя': profileId,
      'Номер бюджета': currentBudgetNumber(records),
      'Статья бюджета': FUN_ARTICLE,
      'Изменение статьи': amounts.player,
      'Игровой день': day,
    });
  }
  appendProfileRecord({
    'Тип события': ECONOMIC_EPISODE_COMPLETED_EVENT,
    'Профиль пользователя': profileId,
    'Идентификатор эпизода': episode.id,
    'Название эпизода': episode.title,
    'Результат': items.map((item) => item.title).join(', '),
    'Размер сметы': amounts.total,
    'Доля отца': amounts.father,
    'Оплачено игроком': amounts.player,
    'Взято из копилки': fromSavings,
    'Правильное решение': true,
    'Игровой день': day,
  });
  const [mood] = changeMonsterStats({ mood: 1 }, TENNIS_ESTIMATE_MOOD_REASON, { 'Идентификатор эпизода': episode.id });
  return { fromSavings, mood };
}

function submitTennisEstimate() {
  if (!activeTennisEstimateEpisode || tennisEstimateApproved) return;
  const items = selectedTennisItems();
  if (!items.length) return;
  const amounts = tennisEstimateAmounts(items);
  const verdict = tennisEstimateVerdict(items);
  // A right estimate the player cannot pay for is not a decision yet: nothing is logged.
  const wallet = deriveRoomState(readProfileRecords(getUserProfileId()));
  if (!verdict && tennisEstimateSavingsPart(amounts.player, wallet) === null) {
    tennisEstimateShortage = amounts.player - Math.max(0, wallet.pocket) - Math.max(0, wallet.savings);
    renderTennisEstimate();
    return;
  }
  logTennisEstimateAttempt(verdict, items, amounts);
  if (verdict) {
    showMentor(verdict, {
      title: activeTennisEstimateEpisode.title,
      extra: `Смета: ${formatMoney(amounts.total)} · списаний по абонементам: ${formatMoney(amounts.recurring)}`,
      closeLabel: 'Переделать смету <span aria-hidden="true">↺</span>',
      afterClose: () => estimateSubmit.focus({ preventScroll: true }),
    });
    return;
  }

  tennisEstimateApproved = true;
  renderTennisEstimate();
  finishTennisEstimateTutorial();
  const { fromSavings, mood } = completeTennisEstimate(items, amounts);
  const savingsNote = fromSavings > 0 ? `, из них ${formatMoney(fromSavings)} — из копилки` : '';
  let moodNote = '';
  if (mood) {
    moodNote = mood.after !== mood.before
      ? ` · настроение монстрика ${formatStat(mood.after - mood.before)}`
      : ' · настроение монстрика и так на максимуме';
  }
  showMentor('estimate-approved', {
    title: activeTennisEstimateEpisode.title,
    extra: `Папа оплатит ${formatMoney(amounts.father)} · с твоего счёта списано ${formatMoney(amounts.player)}${savingsNote}${moodNote}`,
    closeLabel: 'Вернуться в комнату <span aria-hidden="true">→</span>',
    afterClose: () => {
      fatherEpisodeRunning = false;
      activeTennisEstimateEpisode = null;
      selectedTennisEstimateItems.clear();
      enterRoom();
    },
  });
}

function estimateTutorialWasSeen() {
  const episodeId = String(activeTennisEstimateEpisode?.id ?? '');
  return readProfileRecords(getUserProfileId()).some((record) => (
    record?.['Тип события'] === TENNIS_ESTIMATE_TUTORIAL_SEEN_EVENT
    && String(record?.['Идентификатор эпизода']) === episodeId
  ));
}

function estimateTutorialTarget() {
  const targetName = tennisEstimateTutorialSteps[tennisEstimateTutorialIndex]?.screen_area?.target;
  if (!targetName) return null;
  return tennisEstimateScreen.querySelector(`[data-estimate-target="${CSS.escape(String(targetName))}"]`);
}

function positionTennisEstimateTutorialFocus() {
  const target = estimateTutorialTarget();
  estimateTutorialFocus.hidden = !target;
  if (!target) return;
  const layerRect = estimateTutorialLayer.getBoundingClientRect();
  const rect = target.getBoundingClientRect();
  const radius = Number.parseFloat(getComputedStyle(target).borderTopLeftRadius) || 12;
  estimateTutorialFocus.style.left = `${rect.left - layerRect.left - TENNIS_ESTIMATE_FOCUS_PADDING}px`;
  estimateTutorialFocus.style.top = `${rect.top - layerRect.top - TENNIS_ESTIMATE_FOCUS_PADDING}px`;
  estimateTutorialFocus.style.width = `${rect.width + TENNIS_ESTIMATE_FOCUS_PADDING * 2}px`;
  estimateTutorialFocus.style.height = `${rect.height + TENNIS_ESTIMATE_FOCUS_PADDING * 2}px`;
  estimateTutorialFocus.style.borderRadius = `${radius + TENNIS_ESTIMATE_FOCUS_PADDING}px`;
}

function stopTennisEstimateTutorialVoice() {
  estimateTutorialAudio.pause();
  estimateTutorialAudio.removeAttribute('src');
  estimateTutorialAudio.load();
  estimateTutorialVoicePlaying = false;
  updateMusicFade();
}

function playTennisEstimateTutorialVoice(step) {
  stopTennisEstimateTutorialVoice();
  if (!step?.audio) return;
  estimateTutorialAudio.src = publicAssetPath(step.audio_folder, step.audio, 'audio/tennis_estimate_tutorial');
  estimateTutorialAudio.volume = 1;
  estimateTutorialAudio.muted = muted;
  estimateTutorialAudio.play()
    .then(() => {
      estimateTutorialVoicePlaying = true;
      updateMusicFade();
    })
    .catch((error) => {
      estimateTutorialVoicePlaying = false;
      updateMusicFade();
      console.info(`Озвучка шага ${step.queue ?? tennisEstimateTutorialIndex + 1} туториала сметы пока недоступна.`, error);
    });
}

estimateTutorialAudio.addEventListener('ended', () => {
  estimateTutorialVoicePlaying = false;
  updateMusicFade();
});

estimateTutorialAudio.addEventListener('error', () => {
  if (!estimateTutorialAudio.getAttribute('src')) return;
  estimateTutorialVoicePlaying = false;
  updateMusicFade();
  console.warn('Не удалось загрузить озвучку туториала сметы:', estimateTutorialAudio.currentSrc);
});

function renderTennisEstimateTutorialStep() {
  const step = tennisEstimateTutorialSteps[tennisEstimateTutorialIndex];
  if (!step) return finishTennisEstimateTutorial();
  const last = tennisEstimateTutorialIndex === tennisEstimateTutorialSteps.length - 1;
  estimateTutorialLayer.dataset.placement = step.screen_area?.message_placement || 'bottom';
  estimateTutorialProgress.textContent = `ШАГ ${tennisEstimateTutorialIndex + 1} ИЗ ${tennisEstimateTutorialSteps.length}`;
  estimateTutorialText.textContent = String(step.text || '');
  estimateTutorialBack.disabled = tennisEstimateTutorialIndex === 0;
  estimateTutorialNext.innerHTML = last
    ? 'Понятно! <span aria-hidden="true">✓</span>'
    : 'Дальше <span aria-hidden="true">→</span>';
  estimateTutorialTarget()?.scrollIntoView({ block: 'nearest' });
  requestAnimationFrame(positionTennisEstimateTutorialFocus);
  playTennisEstimateTutorialVoice(step);
}

function startTennisEstimateTutorial() {
  if (!tennisEstimateTutorialSteps.length || estimateTutorialWasSeen()) return false;
  tennisEstimateTutorialIndex = 0;
  setHidden(estimateTutorialLayer, false);
  renderTennisEstimateTutorialStep();
  estimateTutorialNext.focus({ preventScroll: true });
  return true;
}

function finishTennisEstimateTutorial({ skipped = false } = {}) {
  if (estimateTutorialLayer.classList.contains('is-hidden')) return;
  stopTennisEstimateTutorialVoice();
  if (!estimateTutorialWasSeen() && activeTennisEstimateEpisode) {
    appendProfileRecord({
      'Тип события': TENNIS_ESTIMATE_TUTORIAL_SEEN_EVENT,
      'Профиль пользователя': getUserProfileId(),
      'Идентификатор эпизода': activeTennisEstimateEpisode.id,
      'Игровой день': deriveRoomState(readProfileRecords(getUserProfileId())).day,
      'Пропущен': skipped,
    });
  }
  setHidden(estimateTutorialLayer, true);
  estimateTutorialFocus.hidden = true;
}

function stopFatherVoice() {
  window.clearTimeout(fatherSilentTalkTimer);
  fatherSilentTalkTimer = 0;
  fatherVoiceAudio.pause();
  fatherVoiceAudio.removeAttribute('src');
  fatherVoiceAudio.load();
  fatherVoicePlaying = false;
  roomController?.setFatherTalking(false);
  updateMusicFade();
}

// Until the recorded file is placed in the DataMart folder, the preview still shows the same
// talking cue for approximately as long as the written line would take to say.
function startFatherSilentTalk(line) {
  if (!line || shownFatherLine !== line) return;
  window.clearTimeout(fatherSilentTalkTimer);
  roomController?.setFatherTalking(true);
  const duration = Math.max(2400, Math.min(12000, String(line.text || '').length * 52));
  fatherSilentTalkTimer = window.setTimeout(() => {
    fatherSilentTalkTimer = 0;
    if (shownFatherLine === line) roomController?.setFatherTalking(false);
  }, duration);
}

async function playFatherVoice(line) {
  stopFatherVoice();
  if (!line?.audio) {
    startFatherSilentTalk(line);
    return;
  }

  const url = publicAssetPath(line.audio_folder, line.audio, 'audio/father');
  const source = (await warmUpVoice(url)) ?? url;
  if (shownFatherLine !== line) return;
  fatherVoiceAudio.src = source;
  fatherVoiceAudio.volume = 1;
  fatherVoiceAudio.muted = muted;
  fatherVoiceAudio.play()
    .then(() => {
      fatherVoicePlaying = true;
      roomController?.setFatherTalking(true);
      updateMusicFade();
    })
    .catch((error) => {
      fatherVoicePlaying = false;
      updateMusicFade();
      startFatherSilentTalk(line);
      console.info(`Озвучка реплики папы ${line.id} пока недоступна.`, error);
    });
}

fatherVoiceAudio.addEventListener('ended', () => {
  fatherVoicePlaying = false;
  roomController?.setFatherTalking(false);
  updateMusicFade();
});

fatherVoiceAudio.addEventListener('error', () => {
  if (!fatherVoiceAudio.getAttribute('src')) return;
  fatherVoicePlaying = false;
  roomController?.setFatherTalking(false);
  updateMusicFade();
  if (shownFatherLine) startFatherSilentTalk(shownFatherLine);
  console.warn('Не удалось загрузить озвучку реплики папы:', fatherVoiceAudio.currentSrc);
});

function openTennisEstimate(episode) {
  activeTennisEstimateEpisode = episode;
  fatherEpisodeRunning = true;
  tennisEstimateApproved = false;
  tennisEstimateShortage = 0;
  selectedTennisEstimateItems = new Set();
  tennisEstimateTutorialSteps = dataMartRows
    .filter((row) => row?.object_type === TENNIS_ESTIMATE_TUTORIAL_OBJECT_TYPE && row.title === episode.title)
    .sort((left, right) => Number(left.queue) - Number(right.queue));
  dismissFather();
  leaveRoom();
  // The father scene disabled the room controls. They stay ready for the return after approval.
  setRoomActionsEnabled(true);
  showOnlyScreen(tennisEstimateScreen);
  renderTennisEstimate();
  if (!startTennisEstimateTutorial()) estimateItems.querySelector('button')?.focus({ preventScroll: true });
}

// Hides the father and his card at once, e.g. when his episode's own screen takes over.
function dismissFather() {
  fatherScene = null;
  shownFatherLine = null;
  stopFatherVoice();
  fatherSpeech.hidden = true;
  fatherSpeechReward.hidden = true;
  finishScreen.classList.remove('has-father');
  roomController?.hideFather();
}

function renderFatherLine() {
  const scene = fatherScene;
  const line = scene?.lines[fatherLineIndex];
  if (!line) {
    fatherScene = null;
    finishScreen.classList.remove('has-father');
    scene?.done();
    return;
  }
  stopFatherVoice();
  shownFatherLine = line;
  const mood = fatherLineMood(line);
  const last = fatherLineIndex === scene.lines.length - 1;
  fatherSpeech.dataset.mood = mood;
  fatherSpeechMood.textContent = FATHER_MOOD_LABELS[mood];
  fatherSpeechText.textContent = String(line.text || '');
  fatherSpeechReward.textContent = last ? scene.reward || '' : '';
  fatherSpeechReward.hidden = !fatherSpeechReward.textContent;
  fatherSpeechNext.innerHTML = last
    ? `${scene.finalLabel} <span aria-hidden="true">${scene.finalIcon || '→'}</span>`
    : 'Дальше <span aria-hidden="true">→</span>';
  fatherSpeech.hidden = false;
  roomController?.setFatherMood(mood);
  playFatherVoice(line);
  fatherSpeechNext.focus({ preventScroll: true });
}

// The father comes into the room and says his lines one by one; `done` runs after the last one.
async function playFatherScene(scene) {
  closeRoomAction();
  closeRoomInbox();
  closeSavingsTransfer();
  hideRoomMessage();
  setRoomActionsEnabled(false);
  finishScreen.classList.add('has-father');
  roomController?.hold('Mood_neutral', { fallback: 'restpose', spot: [-0.72, 0.35] });
  scene.lines.forEach((line) => {
    if (line.audio) warmUpVoice(publicAssetPath(line.audio_folder, line.audio, 'audio/father'));
  });
  fatherScene = scene;
  try {
    const fatherShown = await roomController?.showFather(fatherLineMood(scene.lines[0]), { racket: scene.racket });
    if (fatherShown) roomController.focusFather();
  } catch (error) {
    console.warn('Не удалось показать модель папы, диалог продолжается без неё.', error);
  }
  if (fatherScene !== scene || finishScreen.hidden) return;
  fatherLineIndex = 0;
  renderFatherLine();
}

function fatherVisitScene(episode) {
  const visit = fatherVisit(episode);
  return {
    lines: fatherLines(episode),
    finalLabel: visit.finalLabel,
    racket: visit.racket,
    done: () => visit.open(episode),
  };
}

async function startFatherEpisode(episode, { repeatIntro = true } = {}) {
  const visit = fatherVisit(episode);
  if (fatherEpisodeRunning || !visit) return;
  const records = readProfileRecords(getUserProfileId());
  const stillDue = dueEconomicEpisodes(dataMartRows, records)
    .some((item) => String(item.id) === String(episode.id));
  if (!stillDue) return;

  fatherEpisodeRunning = true;
  recordEconomicEpisodeOpened(episode);
  if (!repeatIntro) {
    visit.open(episode);
    return;
  }
  await playFatherScene(fatherVisitScene(episode));
}

// The father bursts in and coach Max calls on his own; the other episodes wait for the big button.
function maybeStartAutomaticEconomicEpisode() {
  if (!isRoomInteractive() || fatherEpisodeRunning || routeEpisodeRunning) return false;
  const records = readProfileRecords(getUserProfileId());
  const episode = dueEconomicEpisodes(dataMartRows, records).find((item) => fatherVisit(item) || isTrainerCallEpisode(item));
  if (!episode || isEconomicEpisodeStarted(records, episode)) return false;
  if (isTrainerCallEpisode(episode)) void startTrainerCall(episode);
  else void startFatherEpisode(episode);
  return true;
}

// A finished episode whose father has a thank-you line he has not said yet, with the reward its
// completion record paid into the piggy bank or the pocket.
function dueFatherThanks(records) {
  const thanked = new Set(records
    .filter((record) => record?.['Тип события'] === FATHER_THANKS_EVENT)
    .map((record) => String(record['Идентификатор эпизода'])));
  for (const record of records) {
    if (record?.['Тип события'] !== ECONOMIC_EPISODE_COMPLETED_EVENT) continue;
    const id = String(record['Идентификатор эпизода']);
    if (thanked.has(id)) continue;
    const episode = dataMartRows.find((row) => row?.object_type === 'Economic episode' && String(row.id) === id);
    const line = fatherThanksLine(episode);
    if (!line) continue;
    const pocket = Number(record['Награда в карман']) || 0;
    const savings = Number(record['Награда в копилку']) || 0;
    const reward = pocket > 0 ? `+${formatMoney(pocket)} в карман` : savings > 0 ? `+${formatMoney(savings)} в копилку` : '';
    return { episode, line, reward };
  }
  return null;
}

// The father comes back to say thank you once the episode is over, even after a reload.
function maybeStartFatherThanks() {
  if (!isRoomInteractive()) return false;
  const thanks = dueFatherThanks(readProfileRecords(getUserProfileId()));
  if (!thanks) return false;
  fatherEpisodeRunning = true;
  void playFatherScene({
    lines: [thanks.line],
    finalLabel: 'Обращайся!',
    finalIcon: '✓',
    racket: fatherVisit(thanks.episode)?.racket ?? false,
    reward: thanks.reward,
    done: () => finishFatherThanks(thanks.episode),
  });
  return true;
}

function finishFatherThanks(episode) {
  const profileId = getUserProfileId();
  appendProfileRecord({
    'Тип события': FATHER_THANKS_EVENT,
    'Профиль пользователя': profileId,
    'Идентификатор эпизода': episode.id,
    'Название эпизода': episode.title,
    'Игровой день': deriveRoomState(readProfileRecords(profileId)).day,
  });
  dismissFather();
  roomController?.release();
  setRoomActionsEnabled(true);
  fatherEpisodeRunning = false;
  renderRoomHud();
  openRoomDay();
}

fatherSpeechNext.addEventListener('click', async () => {
  const scene = fatherScene;
  if (!scene) return;
  if (fatherLineIndex >= scene.lines.length - 1) {
    fatherSpeechNext.disabled = true;
    shownFatherLine = null;
    stopFatherVoice();
    fatherSpeech.hidden = true;
    roomController?.setFatherMood('idle');
    roomController?.restoreCamera();
    await delay(700);
    fatherSpeechNext.disabled = false;
    if (fatherScene !== scene || finishScreen.hidden) return;
    fatherScene = null;
    finishScreen.classList.remove('has-father');
    scene.done();
    return;
  }
  fatherLineIndex += 1;
  renderFatherLine();
});

estimateSubmit.addEventListener('click', submitTennisEstimate);
estimateTutorialNext.addEventListener('click', () => {
  if (tennisEstimateTutorialIndex >= tennisEstimateTutorialSteps.length - 1) return finishTennisEstimateTutorial();
  tennisEstimateTutorialIndex += 1;
  renderTennisEstimateTutorialStep();
});
estimateTutorialBack.addEventListener('click', () => {
  if (tennisEstimateTutorialIndex === 0) return;
  tennisEstimateTutorialIndex -= 1;
  renderTennisEstimateTutorialStep();
});
estimateTutorialSkip.addEventListener('click', () => finishTennisEstimateTutorial({ skipped: true }));
window.addEventListener('resize', () => {
  if (!estimateTutorialLayer.classList.contains('is-hidden')) positionTennisEstimateTutorialFocus();
});

// --- Letters of credit --------------------------------------------------------

const LETTER_OF_CREDIT_CONTENT = 'Составление аккредитивов: банк платит по проверяемым триггерам, этап за этапом, с верными связками «И» и «ИЛИ».';
// The father's thanks, paid into the piggy bank when the last client gets a right letter.
const LETTER_OF_CREDIT_REWARD = 50;
const LOC_INTRO_SEEN_EVENT = 'Просмотр объяснения аккредитива';
const LOC_TUTORIAL_SEEN_EVENT = 'Просмотр туториала аккредитивов';
const LOC_MAX_STAGES = 5;
const LOC_FOCUS_PADDING = 6;
// The bottom panel shows the client's request or one kind of cards.
const LOC_CASE_TAB = 'case';
const LOC_TRIGGER_TAB = 'trigger';
const LOC_TRANSACTION_TAB = 'transaction';
// The tutorial opens the tab its step talks about.
const LOC_TUTORIAL_TABS = { case: LOC_CASE_TAB, palette: LOC_TRIGGER_TAB };
const LOC_MISTAKES = {
  [LOC_DECOY]: {
    label: 'Лишние карточки',
    explanation: 'В аккредитив попали карточки, которых нет в договорённости клиента.',
  },
  [LOC_MISSING]: {
    label: 'Не хватает карточек',
    explanation: 'В аккредитиве не хватает условий или платежей из договорённости клиента.',
  },
  [LOC_ORDER]: {
    label: 'Неверные этапы',
    explanation: 'Нужные карточки разложены не по тем этапам, или этапы идут не в том порядке.',
  },
  [LOC_LOGIC]: {
    label: 'Неверная связка триггеров',
    explanation: 'Триггеры в группе связаны не той логикой: «И» вместо «ИЛИ» или наоборот.',
  },
};
const LOC_RIGHT_EXPLANATION = 'Аккредитив совпадает с договорённостью клиента: этапы, связки триггеров и платежи на своих местах.';

const locProgress = $('#loc-progress');
const locCaseIcon = $('#loc-case-icon');
const locCaseNumber = $('#loc-case-number');
const locCaseTitle = $('#loc-case-title');
const locCaseText = $('#loc-case-text');
const locDeposit = $('#loc-deposit');
const locAllocated = $('#loc-allocated');
const locBuilder = $('#loc-builder');
const locStagesList = $('#loc-stages');
const locAddStage = $('#loc-add-stage');
const locTabCase = $('#loc-tab-case');
const locCaseCopy = $('#loc-case-copy');
const locTabTriggers = $('#loc-tab-triggers');
const locTabTransactions = $('#loc-tab-transactions');
const locTabTriggersCount = $('#loc-tab-triggers-count');
const locTabTransactionsCount = $('#loc-tab-transactions-count');
const locCardsList = $('#loc-cards');
const locStatus = $('#loc-status');
const locSubmit = $('#loc-submit');
const locTutorialLayer = $('#loc-tutorial-layer');
const locTutorialFocus = $('#loc-tutorial-focus');
const locTutorialProgress = $('#loc-tutorial-progress');
const locTutorialText = $('#loc-tutorial-text');
const locTutorialBack = $('#loc-tutorial-back');
const locTutorialNext = $('#loc-tutorial-next');
const locTutorialSkip = $('#loc-tutorial-skip');

let activeLocEpisode = null;
let locCases = [];
let locCaseIndex = 0;
let locCards = [];
// The letter being built: stages of card keys, see emptyStage() in letter-of-credit.js.
let locStages = [emptyStage()];
// Cards the player taps go into this stage.
let locActiveStage = 0;
let locTab = LOC_CASE_TAB;
// The current client's letter is signed: the builder is locked until the next client.
let locSigned = false;
let locTutorialSteps = [];
let locTutorialIndex = 0;

function locEpisodeRecords(records, type) {
  return records.filter((record) => (
    record?.['Тип события'] === type && String(record['Идентификатор эпизода']) === String(activeLocEpisode?.id)
  ));
}

// A client is served once a right letter for them has been logged.
function solvedLocCaseIds(records) {
  return new Set(locEpisodeRecords(records, RIGHT_DECISION_EVENT).map((record) => String(record['Идентификатор кейса'])));
}

function locDecisions(records, caseId = null) {
  return [...locEpisodeRecords(records, RIGHT_DECISION_EVENT), ...locEpisodeRecords(records, WRONG_DECISION_EVENT)]
    .filter((record) => caseId === null || String(record['Идентификатор кейса']) === String(caseId));
}

function locCard(key) {
  return locCards.find((card) => cardKey(card) === key) ?? null;
}

function locCardTitle(key) {
  return locCard(key)?.title ?? key;
}

function openLetterOfCredit(episode) {
  activeLocEpisode = episode;
  fatherEpisodeRunning = true;
  dismissFather();
  leaveRoom();
  // The father scene disabled the room controls. They stay ready for the way back.
  setRoomActionsEnabled(true);
  locCases = letterOfCreditCases(episode);
  locTutorialSteps = letterOfCreditTutorial(episode);
  if (!locCases.length) {
    console.warn(`В дата-марте нет клиентов для эпизода «${episode.title}».`);
    returnFromLetterOfCredit();
    return;
  }

  const solved = solvedLocCaseIds(readProfileRecords(getUserProfileId()));
  const next = locCases.findIndex((item) => !solved.has(String(item.id)));
  // Every client is served already, e.g. a reload right after the last letter was signed.
  if (next < 0) {
    completeLetterOfCredit();
    returnFromLetterOfCredit();
    return;
  }

  showOnlyScreen(locScreen);
  startLocCase(next);
  if (locIntroWasSeen()) afterLocIntro();
  else showLocIntro();
}

function startLocCase(index) {
  locCaseIndex = index;
  const caseRow = locCases[index];
  locCards = letterOfCreditCards(caseRow);
  locStages = [emptyStage()];
  locActiveStage = 0;
  // A new client starts with their request on screen.
  locTab = LOC_CASE_TAB;
  locSigned = false;
  // The client is logged once, when their request first reaches the player; a reload does not repeat it.
  const records = readProfileRecords(getUserProfileId());
  const presented = locEpisodeRecords(records, EPISODE_EVENT)
    .some((record) => String(record['Идентификатор кейса']) === String(caseRow.id));
  if (!presented) {
    logEpisode(LETTER_OF_CREDIT_CONTENT, {
      'Название эпизода': activeLocEpisode.title,
      'Идентификатор эпизода': activeLocEpisode.id,
      'Кейс': caseRow.title,
      'Номер кейса': index + 1,
      'Идентификатор кейса': caseRow.id,
      'Игровой день': deriveRoomState(records).day,
    });
  }
  renderLetterOfCredit();
  locBuilder.scrollTop = 0;
}

function renderLetterOfCredit() {
  const caseRow = locCases[locCaseIndex];
  if (!caseRow) return;
  locProgress.replaceChildren(...locCases.map((item, index) => {
    const dot = document.createElement('li');
    const done = index < locCaseIndex || (index === locCaseIndex && locSigned);
    dot.className = done ? 'is-done' : index === locCaseIndex ? 'is-current' : '';
    dot.textContent = done ? '✓' : String(index + 1);
    dot.setAttribute('aria-label', `${item.title}: ${done ? 'готово' : index === locCaseIndex ? 'сейчас' : 'ждёт'}`);
    return dot;
  }));

  const area = caseRow.screen_area || {};
  locCaseIcon.textContent = area.icon || '🏦';
  locCaseNumber.textContent = area.client || `Клиент ${locCaseIndex + 1}`;
  locCaseTitle.textContent = caseRow.title;
  locCaseText.textContent = String(caseRow.text || '');
  const deposit = Number(caseRow.price) || 0;
  const allocated = letterAmount(locStages, locCards);
  locDeposit.textContent = formatMoney(deposit);
  locAllocated.textContent = formatMoney(allocated);
  locAllocated.dataset.balance = allocated > deposit ? 'over' : allocated === deposit ? 'even' : 'under';

  renderLocStages();
  renderLocPalette();

  const incomplete = incompleteStage(locStages);
  locStatus.classList.toggle('is-warning', !locSigned && incomplete < 0 && allocated > deposit);
  if (locSigned) {
    locStatus.textContent = 'Аккредитив подписан';
  } else if (incomplete >= 0) {
    const missing = locStages[incomplete].triggers.length ? 'транзакцию' : 'триггер';
    locStatus.textContent = `Этап ${incomplete + 1}: добавь ${missing}`;
  } else if (allocated > deposit) {
    locStatus.textContent = `Платежей на ${formatMoney(allocated)}, а в банке только ${formatMoney(deposit)}`;
  } else {
    locStatus.textContent = 'Все этапы заполнены — можно подписывать';
  }
  locSubmit.disabled = locSigned || incomplete >= 0;
}

function renderLocStages() {
  const nodes = [];
  locStages.forEach((stage, index) => {
    if (index > 0) {
      const link = document.createElement('p');
      link.className = 'loc-stage-link';
      link.textContent = 'затем';
      nodes.push(link);
    }
    nodes.push(createLocStage(stage, index));
  });
  locStagesList.replaceChildren(...nodes);
  locAddStage.disabled = locSigned || locStages.length >= LOC_MAX_STAGES;
}

function createLocStage(stage, index) {
  const active = index === locActiveStage && !locSigned;
  const section = document.createElement('section');
  section.className = `loc-stage${active ? ' is-active' : ''}`;
  section.setAttribute('aria-label', `Этап ${index + 1}`);
  if (index === 0) section.dataset.locTarget = 'stage';
  section.addEventListener('click', () => selectLocStage(index));

  const head = document.createElement('header');
  head.className = 'loc-stage-head';
  const select = document.createElement('button');
  select.type = 'button';
  select.className = 'loc-stage-select';
  select.setAttribute('aria-pressed', String(active));
  select.disabled = locSigned;
  const title = document.createElement('b');
  title.textContent = `ЭТАП ${index + 1}`;
  const state = document.createElement('small');
  state.textContent = active ? 'карточки попадут сюда' : 'нажми, чтобы заполнять';
  select.append(title, state);
  head.append(select);
  if (index > 0 && !locSigned) {
    const up = document.createElement('button');
    up.type = 'button';
    up.className = 'loc-stage-tool';
    up.setAttribute('aria-label', `Поднять этап ${index + 1} выше`);
    up.textContent = '↑';
    up.addEventListener('click', (event) => {
      event.stopPropagation();
      moveLocStageUp(index);
    });
    head.append(up);
  }
  if (locStages.length > 1 && !locSigned) {
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'loc-stage-tool';
    remove.setAttribute('aria-label', `Удалить этап ${index + 1}`);
    remove.textContent = '✕';
    remove.addEventListener('click', (event) => {
      event.stopPropagation();
      removeLocStage(index);
    });
    head.append(remove);
  }

  const flow = document.createElement('span');
  flow.className = 'loc-flow';
  flow.setAttribute('aria-hidden', 'true');
  flow.textContent = '↓';
  section.append(head, createLocGroup(stage, index, true), flow, createLocGroup(stage, index, false));
  return section;
}

function createLocGroup(stage, index, triggers) {
  const keys = triggers ? stage.triggers : stage.transactions;
  const group = document.createElement('div');
  group.className = `loc-group ${triggers ? 'is-trigger' : 'is-transaction'}`;

  const head = document.createElement('div');
  head.className = 'loc-group-head';
  const label = document.createElement('b');
  label.textContent = triggers ? 'ЕСЛИ' : 'ТОГДА';
  const hint = document.createElement('small');
  hint.textContent = triggers ? 'триггеры' : 'транзакции · выполняются все';
  head.append(label, hint);
  if (triggers) head.append(createLocLogicSwitch(stage, index));

  const list = document.createElement('div');
  list.className = 'loc-chips';
  if (!keys.length) {
    const empty = document.createElement('p');
    empty.className = 'loc-empty';
    empty.textContent = triggers ? 'Добавь триггер из карточек внизу' : 'Добавь транзакцию из карточек внизу';
    list.append(empty);
  }
  keys.forEach((key, position) => {
    if (position > 0) {
      const joint = document.createElement('span');
      joint.className = 'loc-joint';
      joint.textContent = triggers ? LOGIC_LABELS[stage.logic] : LOGIC_LABELS[LOGIC_AND];
      list.append(joint);
    }
    const card = locCard(key);
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'loc-chip';
    chip.disabled = locSigned;
    chip.setAttribute('aria-label', `Убрать «${locCardTitle(key)}» из этапа ${index + 1}`);
    const icon = document.createElement('span');
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = card?.screen_area?.icon || (triggers ? '⚡' : '🪙');
    const text = document.createElement('span');
    text.textContent = locCardTitle(key);
    const remove = document.createElement('span');
    remove.className = 'loc-chip-remove';
    remove.setAttribute('aria-hidden', 'true');
    remove.textContent = '✕';
    chip.append(icon, text, remove);
    chip.addEventListener('click', () => removeLocCard(key));
    list.append(chip);
  });
  group.append(head, list);
  return group;
}

function createLocLogicSwitch(stage, index) {
  const wrap = document.createElement('div');
  wrap.className = `loc-logic${stage.triggers.length < 2 ? ' is-idle' : ''}`;
  wrap.setAttribute('role', 'group');
  wrap.setAttribute('aria-label', `Связка триггеров этапа ${index + 1}`);
  if (index === 0) wrap.dataset.locTarget = 'logic';
  for (const logic of [LOGIC_AND, LOGIC_OR]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = LOGIC_LABELS[logic];
    button.setAttribute('aria-pressed', String(stage.logic === logic));
    button.disabled = locSigned;
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      if (locSigned) return;
      locStages[index].logic = logic;
      locActiveStage = index;
      renderLetterOfCredit();
    });
    wrap.append(button);
  }
  return wrap;
}

function renderLocPalette() {
  const placed = new Map();
  locStages.forEach((stage, index) => {
    [...stage.triggers, ...stage.transactions].forEach((key) => placed.set(key, index));
  });
  const triggers = locCards.filter(isTriggerCard);
  const transactions = locCards.filter((card) => !isTriggerCard(card));
  const free = (cards) => cards.filter((card) => !placed.has(cardKey(card))).length;
  locTabCase.setAttribute('aria-selected', String(locTab === LOC_CASE_TAB));
  locTabTriggers.setAttribute('aria-selected', String(locTab === LOC_TRIGGER_TAB));
  locTabTransactions.setAttribute('aria-selected', String(locTab === LOC_TRANSACTION_TAB));
  locTabTriggersCount.textContent = String(free(triggers));
  locTabTransactionsCount.textContent = String(free(transactions));
  locCaseCopy.hidden = locTab !== LOC_CASE_TAB;
  locCardsList.hidden = locTab === LOC_CASE_TAB;
  locCardsList.dataset.kind = locTab;
  const shown = locTab === LOC_TRIGGER_TAB ? triggers : locTab === LOC_TRANSACTION_TAB ? transactions : [];
  locCardsList.replaceChildren(...shown.map((card) => createLocPaletteCard(card, placed.get(cardKey(card)))));
}

function createLocPaletteCard(card, stageIndex) {
  const used = stageIndex !== undefined;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `loc-card ${isTriggerCard(card) ? 'is-trigger' : 'is-transaction'}`;
  button.setAttribute('aria-pressed', String(used));
  button.disabled = locSigned;
  button.setAttribute('aria-label', used
    ? `${card.title}, в этапе ${stageIndex + 1}. Нажми, чтобы убрать`
    : `${card.title}. Добавить в этап ${locActiveStage + 1}`);

  const icon = document.createElement('span');
  icon.className = 'loc-card-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = card.screen_area?.icon || (isTriggerCard(card) ? '⚡' : '🪙');
  const text = document.createElement('span');
  text.className = 'loc-card-text';
  text.textContent = card.title;
  button.append(icon, text);
  const tags = document.createElement('span');
  tags.className = 'loc-card-tags';
  if (card.screen_area?.source === LLM_CARD_SOURCE) {
    const llm = document.createElement('span');
    llm.className = 'loc-card-tag is-llm';
    llm.textContent = '🤖 черновик LLM';
    tags.append(llm);
  }
  if (used) {
    const place = document.createElement('span');
    place.className = 'loc-card-tag is-placed';
    place.textContent = `в этапе ${stageIndex + 1}`;
    tags.append(place);
  }
  if (tags.childElementCount) button.append(tags);
  button.addEventListener('click', () => toggleLocCard(card));
  return button;
}

function removeLocCard(key) {
  if (locSigned) return;
  for (const stage of locStages) {
    stage.triggers = stage.triggers.filter((item) => item !== key);
    stage.transactions = stage.transactions.filter((item) => item !== key);
  }
  renderLetterOfCredit();
}

// A free card goes into the active stage; a card already in the letter goes back to the table.
function toggleLocCard(card) {
  if (locSigned) return;
  const key = cardKey(card);
  if (locStages.some((stage) => stage.triggers.includes(key) || stage.transactions.includes(key))) {
    removeLocCard(key);
    return;
  }
  locStages[locActiveStage][isTriggerCard(card) ? 'triggers' : 'transactions'].push(key);
  renderLetterOfCredit();
  scrollLocStageIntoView(locActiveStage);
}

function selectLocStage(index) {
  if (locSigned || locActiveStage === index) return;
  locActiveStage = index;
  renderLetterOfCredit();
}

function removeLocStage(index) {
  if (locSigned || locStages.length < 2) return;
  // The stage's cards simply go back to the table.
  locStages.splice(index, 1);
  if (locActiveStage > index || (locActiveStage === index && index > 0)) locActiveStage -= 1;
  locActiveStage = Math.min(locActiveStage, locStages.length - 1);
  renderLetterOfCredit();
}

// Swaps the stage with the one above it; the stage being filled stays the same stage.
function moveLocStageUp(index) {
  if (locSigned || index < 1) return;
  [locStages[index - 1], locStages[index]] = [locStages[index], locStages[index - 1]];
  if (locActiveStage === index) locActiveStage -= 1;
  else if (locActiveStage === index - 1) locActiveStage += 1;
  renderLetterOfCredit();
  scrollLocStageIntoView(index - 1);
}

// Keeps the stage the player is filling in sight, scrolling only the builder itself.
function scrollLocStageIntoView(index) {
  const stage = locStagesList.querySelectorAll('.loc-stage')[index];
  if (!stage) return;
  // The builder is the stages' offset parent, so offsets are already in its scroll coordinates.
  const top = stage.offsetTop;
  const bottom = top + stage.offsetHeight;
  if (bottom > locBuilder.scrollTop + locBuilder.clientHeight) {
    locBuilder.scrollTo({ top: Math.min(top, bottom - locBuilder.clientHeight), behavior: 'smooth' });
  } else if (top < locBuilder.scrollTop) {
    locBuilder.scrollTo({ top, behavior: 'smooth' });
  }
}

function setLocTab(tab) {
  if (locTab === tab) return;
  locTab = tab;
  renderLocPalette();
  (locTab === LOC_CASE_TAB ? locCaseCopy : locCardsList).scrollTop = 0;
}

function locVerdictExtra(verdict) {
  const titles = (verdict.keys ?? []).map(locCardTitle);
  if (verdict.trigger === LOC_DECOY) return `Лишнее: «${titles.join('», «')}»`;
  if (verdict.trigger === LOC_MISSING) return `Не хватает карточек: ${titles.length}`;
  if (verdict.trigger === LOC_ORDER) return `Проверь этап ${verdict.stage + 1}`;
  if (verdict.trigger === LOC_LOGIC) return `Проверь связку триггеров в этапе ${verdict.stage + 1}`;
  return '';
}

function logLetterOfCreditAttempt(caseRow, verdict) {
  const records = readProfileRecords(getUserProfileId());
  const mistake = verdict ? LOC_MISTAKES[verdict.trigger] : null;
  logDecision(!verdict, {
    episode: LETTER_OF_CREDIT_CONTENT,
    'Название эпизода': activeLocEpisode.title,
    'Идентификатор эпизода': activeLocEpisode.id,
    'Кейс': caseRow.title,
    'Номер кейса': locCaseIndex + 1,
    'Идентификатор кейса': caseRow.id,
    'Попытка': locDecisions(records, caseRow.id).length + 1,
    'Аккредитив': locStages.map((stage, index) => ({
      'Этап': index + 1,
      'Триггеры': stage.triggers.map(locCardTitle),
      'Связка триггеров': LOGIC_LABELS[stage.logic],
      'Транзакции': stage.transactions.map(locCardTitle),
    })),
    'Сумма в банке': Number(caseRow.price) || 0,
    'Сумма транзакций': letterAmount(locStages, locCards),
    'Кейс решён': !verdict,
    ...(mistake ? { 'Ошибка': mistake.label } : {}),
    ...(verdict?.keys ? { 'Карточки ошибки': verdict.keys.map(locCardTitle) } : {}),
    ...(verdict && Number.isFinite(verdict.stage) ? { 'Этап ошибки': verdict.stage + 1 } : {}),
    'Игровой день': deriveRoomState(records).day,
    explanation: mistake?.explanation ?? LOC_RIGHT_EXPLANATION,
  });
}

// The last client is served: the father's reward goes into the piggy bank together with the
// completion record, so a reload can neither lose it nor pay it twice. He says thank you in the room.
function completeLetterOfCredit() {
  const episode = activeLocEpisode;
  const profileId = getUserProfileId();
  const records = readProfileRecords(profileId);
  if (!episode || isEconomicEpisodeCompleted(records, episode)) return;
  const { day } = deriveRoomState(records);
  appendProfileRecord({
    'Тип события': SAVINGS_TOPUP_EVENT,
    'Профиль пользователя': profileId,
    'Значение': LETTER_OF_CREDIT_REWARD,
    'Назначение': `${episode.title}: благодарность папы`,
    'Источник средств': 'Папа',
    'Идентификатор эпизода': episode.id,
    'Игровой день': day,
  });
  appendBudgetFact(records, INCOME_ARTICLE, LETTER_OF_CREDIT_REWARD, {
    'Зачислено': 'Копилка',
    'Источник средств': 'Папа',
    'Назначение': `${episode.title}: благодарность папы`,
    'Идентификатор эпизода': episode.id,
    'Игровой день': day,
  });
  appendProfileRecord({
    'Тип события': ECONOMIC_EPISODE_COMPLETED_EVENT,
    'Профиль пользователя': profileId,
    'Идентификатор эпизода': episode.id,
    'Название эпизода': episode.title,
    'Результат': `Составлены аккредитивы: ${locCases.map((item) => item.title).join(', ')}`,
    'Решено кейсов': locCases.length,
    'Ошибочных попыток': locEpisodeRecords(records, WRONG_DECISION_EVENT).length,
    'Награда в копилку': LETTER_OF_CREDIT_REWARD,
    'Правильное решение': true,
    'Игровой день': day,
  });
}

function returnFromLetterOfCredit() {
  finishLocTutorial();
  fatherEpisodeRunning = false;
  activeLocEpisode = null;
  enterRoom();
}

function submitLetterOfCredit() {
  if (!activeLocEpisode || locSigned || incompleteStage(locStages) >= 0) return;
  const caseRow = locCases[locCaseIndex];
  const verdict = letterOfCreditVerdict(caseRow, locStages);
  logLetterOfCreditAttempt(caseRow, verdict);
  if (verdict) {
    showMentor(verdict.trigger, {
      title: caseRow.title,
      extra: locVerdictExtra(verdict),
      closeLabel: 'Переделать <span aria-hidden="true">↺</span>',
      afterClose: () => locSubmit.focus({ preventScroll: true }),
    });
    return;
  }

  locSigned = true;
  finishLocTutorial();
  const last = locCaseIndex >= locCases.length - 1;
  if (last) completeLetterOfCredit();
  renderLetterOfCredit();
  const count = locCases.length;
  showMentor(LOC_SOLVED, {
    title: caseRow.title,
    extra: last
      ? `Все ${count} ${pluralRu(count, 'аккредитив подписан', 'аккредитива подписаны', 'аккредитивов подписаны')}`
      : `Клиент ${locCaseIndex + 1} из ${count} получил аккредитив`,
    closeLabel: last
      ? 'Вернуться в комнату <span aria-hidden="true">→</span>'
      : 'Следующий клиент <span aria-hidden="true">→</span>',
    afterClose: last ? returnFromLetterOfCredit : () => {
      startLocCase(locCaseIndex + 1);
      locTabTriggers.focus({ preventScroll: true });
    },
  });
}

function locIntroWasSeen() {
  return locEpisodeRecords(readProfileRecords(getUserProfileId()), LOC_INTRO_SEEN_EVENT).length > 0;
}

// The mentor explains what a letter of credit is before the tutorial shows the screen.
function showLocIntro() {
  const title = activeLocEpisode.title;
  showMentor('loc-intro-what', {
    title,
    closeLabel: 'Дальше <span aria-hidden="true">→</span>',
    afterClose: () => showMentor('loc-intro-how', {
      title,
      closeLabel: 'Понятно <span aria-hidden="true">✓</span>',
      afterClose: () => {
        if (!activeLocEpisode) return;
        appendProfileRecord({
          'Тип события': LOC_INTRO_SEEN_EVENT,
          'Профиль пользователя': getUserProfileId(),
          'Идентификатор эпизода': activeLocEpisode.id,
          'Название эпизода': activeLocEpisode.title,
          'Игровой день': deriveRoomState(readProfileRecords(getUserProfileId())).day,
        });
        afterLocIntro();
      },
    }),
  });
}

function afterLocIntro() {
  if (!startLocTutorial()) locTabTriggers.focus({ preventScroll: true });
}

function locTutorialWasSeen() {
  return locEpisodeRecords(readProfileRecords(getUserProfileId()), LOC_TUTORIAL_SEEN_EVENT).length > 0;
}

function locTutorialTarget() {
  const targetName = locTutorialSteps[locTutorialIndex]?.screen_area?.target;
  if (!targetName) return null;
  return locScreen.querySelector(`[data-loc-target~="${CSS.escape(String(targetName))}"]`);
}

function positionLocTutorialFocus() {
  const target = locTutorialTarget();
  locTutorialFocus.hidden = !target;
  if (!target) return;
  const layerRect = locTutorialLayer.getBoundingClientRect();
  const rect = target.getBoundingClientRect();
  const radius = Number.parseFloat(getComputedStyle(target).borderTopLeftRadius) || 12;
  locTutorialFocus.style.left = `${rect.left - layerRect.left - LOC_FOCUS_PADDING}px`;
  locTutorialFocus.style.top = `${rect.top - layerRect.top - LOC_FOCUS_PADDING}px`;
  locTutorialFocus.style.width = `${rect.width + LOC_FOCUS_PADDING * 2}px`;
  locTutorialFocus.style.height = `${rect.height + LOC_FOCUS_PADDING * 2}px`;
  locTutorialFocus.style.borderRadius = `${radius + LOC_FOCUS_PADDING}px`;
}

function stopLocTutorialVoice() {
  locTutorialAudio.pause();
  locTutorialAudio.removeAttribute('src');
  locTutorialAudio.load();
  locTutorialVoicePlaying = false;
  updateMusicFade();
}

function playLocTutorialVoice(step) {
  stopLocTutorialVoice();
  if (!step?.audio) return;
  locTutorialAudio.src = publicAssetPath(step.audio_folder, step.audio, 'audio/loc_tutorial');
  locTutorialAudio.volume = 1;
  locTutorialAudio.muted = muted;
  locTutorialAudio.play()
    .then(() => {
      locTutorialVoicePlaying = true;
      updateMusicFade();
    })
    .catch((error) => {
      locTutorialVoicePlaying = false;
      updateMusicFade();
      console.info(`Озвучка шага ${step.queue ?? locTutorialIndex + 1} туториала аккредитивов пока недоступна.`, error);
    });
}

locTutorialAudio.addEventListener('ended', () => {
  locTutorialVoicePlaying = false;
  updateMusicFade();
});

locTutorialAudio.addEventListener('error', () => {
  if (!locTutorialAudio.getAttribute('src')) return;
  locTutorialVoicePlaying = false;
  updateMusicFade();
  console.warn('Не удалось загрузить озвучку туториала аккредитивов:', locTutorialAudio.currentSrc);
});

function renderLocTutorialStep() {
  const step = locTutorialSteps[locTutorialIndex];
  if (!step) return finishLocTutorial();
  const last = locTutorialIndex === locTutorialSteps.length - 1;
  locTutorialLayer.dataset.placement = step.screen_area?.message_placement || 'bottom';
  locTutorialProgress.textContent = `ШАГ ${locTutorialIndex + 1} ИЗ ${locTutorialSteps.length}`;
  locTutorialText.textContent = String(step.text || '');
  locTutorialBack.disabled = locTutorialIndex === 0;
  locTutorialNext.innerHTML = last
    ? 'Понятно! <span aria-hidden="true">✓</span>'
    : 'Дальше <span aria-hidden="true">→</span>';
  const tab = LOC_TUTORIAL_TABS[step.screen_area?.target];
  if (tab) setLocTab(tab);
  locTutorialTarget()?.scrollIntoView({ block: 'nearest' });
  requestAnimationFrame(positionLocTutorialFocus);
  playLocTutorialVoice(step);
}

function startLocTutorial() {
  if (!locTutorialSteps.length || locTutorialWasSeen()) return false;
  locTutorialIndex = 0;
  setHidden(locTutorialLayer, false);
  renderLocTutorialStep();
  locTutorialNext.focus({ preventScroll: true });
  return true;
}

function finishLocTutorial({ skipped = false } = {}) {
  if (locTutorialLayer.classList.contains('is-hidden')) return;
  stopLocTutorialVoice();
  if (!locTutorialWasSeen() && activeLocEpisode) {
    appendProfileRecord({
      'Тип события': LOC_TUTORIAL_SEEN_EVENT,
      'Профиль пользователя': getUserProfileId(),
      'Идентификатор эпизода': activeLocEpisode.id,
      'Игровой день': deriveRoomState(readProfileRecords(getUserProfileId())).day,
      'Пропущен': skipped,
    });
  }
  setHidden(locTutorialLayer, true);
  locTutorialFocus.hidden = true;
  // The player starts by reading the request the tutorial has shown.
  setLocTab(LOC_CASE_TAB);
  locTabTriggers.focus({ preventScroll: true });
}

locTabCase.addEventListener('click', () => setLocTab(LOC_CASE_TAB));
locTabTriggers.addEventListener('click', () => setLocTab(LOC_TRIGGER_TAB));
locTabTransactions.addEventListener('click', () => setLocTab(LOC_TRANSACTION_TAB));
locAddStage.addEventListener('click', () => {
  if (locSigned || locStages.length >= LOC_MAX_STAGES) return;
  locStages.push(emptyStage());
  locActiveStage = locStages.length - 1;
  // A new stage starts with its triggers.
  locTab = LOC_TRIGGER_TAB;
  renderLetterOfCredit();
  scrollLocStageIntoView(locActiveStage);
});
locSubmit.addEventListener('click', submitLetterOfCredit);
locTutorialNext.addEventListener('click', () => {
  if (locTutorialIndex >= locTutorialSteps.length - 1) return finishLocTutorial();
  locTutorialIndex += 1;
  renderLocTutorialStep();
});
locTutorialBack.addEventListener('click', () => {
  if (locTutorialIndex === 0) return;
  locTutorialIndex -= 1;
  renderLocTutorialStep();
});
locTutorialSkip.addEventListener('click', () => finishLocTutorial({ skipped: true }));
window.addEventListener('resize', () => {
  if (!locTutorialLayer.classList.contains('is-hidden')) positionLocTutorialFocus();
});

// --- Business loans -------------------------------------------------------------

const BUSINESS_LOANS_CONTENT = 'Кредиты для бизнеса: провальной идее — отказ, спорной — первый транш, надёжным клиентам — вся сумма под ставку выше ключевой.';
// The father's thanks, paid into the pocket when the last application is decided right.
const BUSINESS_LOANS_REWARD = 60;
const LOANS_INTRO_SEEN_EVENT = 'Просмотр объяснения кредитов для бизнеса';
const LOANS_TUTORIAL_SEEN_EVENT = 'Просмотр туториала кредитов для бизнеса';
const LOANS_FOCUS_PADDING = 6;
const LOAN_MISTAKES = {
  [LOAN_FAIL_FUNDED]: {
    label: 'Деньги провальной идее',
    explanation: 'Провальная идея не вернёт деньги: ей нужен отказ, даже без пробного транша.',
  },
  [LOAN_RISKY_REFUSED]: {
    label: 'Отказ спорной идее',
    explanation: 'Спорную идею стоит проверить первым траншем, а не отказывать сразу.',
  },
  [LOAN_RISKY_FULL]: {
    label: 'Вся сумма спорной идее',
    explanation: 'Спорной идее — только первый транш: банк не рискует всей суммой, пока идея не проверена.',
  },
  [LOAN_TRANCHE_EARLY]: {
    label: 'Транш меньше нужного',
    explanation: 'Транш кончается раньше этапа, на котором становится понятно, работает ли идея.',
  },
  [LOAN_TRANCHE_LATE]: {
    label: 'Транш больше нужного',
    explanation: 'Транш оплачивает рост бизнеса ещё до проверки идеи.',
  },
  [LOAN_GOOD_REFUSED]: {
    label: 'Отказ надёжному клиенту',
    explanation: 'Надёжному клиенту с хорошим делом банк выдаёт кредит: на процентах он и зарабатывает.',
  },
  [LOAN_TRANCHE_NEEDLESS]: {
    label: 'Транш надёжному клиенту',
    explanation: 'Надёжное понятное дело не нужно проверять траншем: ему нужна вся сумма.',
  },
  [LOAN_RATE_BELOW_KEY]: {
    label: 'Ставка не выше ключевой',
    explanation: `Банк сам берёт деньги по ключевой ставке ${KEY_RATE}%: кредит под столько же или дешевле убыточен.`,
  },
  [LOAN_CORPORATION_RATE_HIGH]: {
    label: 'Высокая ставка для корпорации',
    explanation: `Корпорация с большими активами уйдёт в банк, где ставка не больше ${CORPORATION_RATE_MAX}%.`,
  },
  [LOAN_CORPORATION_GRACE]: {
    label: 'Отсрочка корпорации',
    explanation: 'У корпорации уже есть выручка: отсрочка ей не нужна.',
  },
  [LOAN_SMALL_RATE_HIGH]: {
    label: 'Высокая ставка для малого бизнеса',
    explanation: `Ставка выше ${SMALL_RATE_MAX}% съедает прибыль малого бизнеса.`,
  },
  [LOAN_SMALL_NO_GRACE]: {
    label: 'Нет отсрочки малому бизнесу',
    explanation: 'Новому малому бизнесу нужна отсрочка первого платежа, пока он не начал зарабатывать.',
  },
};
const LOAN_RIGHT_EXPLANATION = 'Решение совпадает с принципами банка: вид заявки определён верно, условия подходят клиенту и банку.';

const loansProgress = $('#loans-progress');
const loansCounter = $('#loans-counter');
const loansMemoOpen = $('#loans-memo-open');
const loansApplication = $('#loans-application');
const loansIcon = $('#loans-icon');
const loansApplicant = $('#loans-applicant');
const loansIdea = $('#loans-idea');
const loansTag = $('#loans-tag');
const loansText = $('#loans-text');
const loansFacts = $('#loans-facts');
const loansPrice = $('#loans-price');
const loansTerm = $('#loans-term');
const loansPlanHint = $('#loans-plan-hint');
const loansPlanList = $('#loans-plan-list');
const loansDecisionButtons = [...document.querySelectorAll('.loans-decision-option')];
const loansTerms = $('#loans-terms');
const loansKeyRate = $('#loans-key-rate');
const loansRate = $('#loans-rate');
const loansRateDown = $('#loans-rate-down');
const loansRateUp = $('#loans-rate-up');
const loansGrace = $('#loans-grace');
const loansIncome = $('#loans-income');
const loansStatus = $('#loans-status');
const loansSubmit = $('#loans-submit');
const loansMemo = $('#loans-memo');
const loansMemoClose = $('#loans-memo-close');
const loansVerdict = $('#loans-verdict');
const loansVerdictSummary = $('#loans-verdict-summary');
const loansVerdictText = $('#loans-verdict-text');
const loansVerdictNext = $('#loans-verdict-next');
const loansTutorialLayer = $('#loans-tutorial-layer');
const loansTutorialFocus = $('#loans-tutorial-focus');
const loansTutorialProgress = $('#loans-tutorial-progress');
const loansTutorialText = $('#loans-tutorial-text');
const loansTutorialBack = $('#loans-tutorial-back');
const loansTutorialNext = $('#loans-tutorial-next');
const loansTutorialSkip = $('#loans-tutorial-skip');

let activeLoansEpisode = null;
let loanApplicationList = [];
let loanIndex = 0;
// The decision being prepared: refuse / tranche / full, how many plan stages the tranche pays for,
// and the terms of the whole sum.
let loanDecision = null;
let loanStages = 0;
let loanRate = KEY_RATE;
let loanGrace = 0;
// The current application is decided right: the controls are locked until the next one.
let loanSigned = false;
let loanTutorialSteps = [];
let loanTutorialIndex = 0;

function loansEpisodeRecords(records, type) {
  return records.filter((record) => (
    record?.['Тип события'] === type && String(record['Идентификатор эпизода']) === String(activeLoansEpisode?.id)
  ));
}

// An application is done once a right decision on it has been logged.
function decidedLoanIds(records) {
  return new Set(loansEpisodeRecords(records, RIGHT_DECISION_EVENT).map((record) => String(record['Идентификатор заявки'])));
}

function loanDecisions(records, applicationId) {
  return [...loansEpisodeRecords(records, RIGHT_DECISION_EVENT), ...loansEpisodeRecords(records, WRONG_DECISION_EVENT)]
    .filter((record) => String(record['Идентификатор заявки']) === String(applicationId));
}

function currentLoanApplication() {
  return loanApplicationList[loanIndex] ?? null;
}

function currentLoanChoice() {
  return { decision: loanDecision, stages: loanStages, rate: loanRate, grace: loanGrace };
}

// Yearly interest can be fractional, e.g. 1% of 150 coins.
function formatLoanCoins(value) {
  return formatCoins(Math.round(value * 10) / 10);
}

function formatLoanTerm(years) {
  return `${years} ${pluralRu(years, 'год', 'года', 'лет')}`;
}

function formatGrace(months) {
  return months > 0 ? `${months} мес.` : 'нет';
}

function openBusinessLoans(episode) {
  activeLoansEpisode = episode;
  fatherEpisodeRunning = true;
  dismissFather();
  leaveRoom();
  // The father scene disabled the room controls. They stay ready for the way back.
  setRoomActionsEnabled(true);
  loanApplicationList = loanApplications(episode);
  loanTutorialSteps = loanTutorial(episode);
  if (!loanApplicationList.length) {
    console.warn(`В дата-марте нет заявок для эпизода «${episode.title}».`);
    returnFromBusinessLoans();
    return;
  }

  const decided = decidedLoanIds(readProfileRecords(getUserProfileId()));
  const next = loanApplicationList.findIndex((item) => !decided.has(String(item.id)));
  // Every application is decided already, e.g. a reload right after the last one.
  if (next < 0) {
    completeBusinessLoans();
    returnFromBusinessLoans();
    return;
  }

  loansMemo.hidden = true;
  loansVerdict.hidden = true;
  showOnlyScreen(loansScreen);
  startLoanApplication(next);
  if (loansIntroWasSeen()) afterLoansIntro();
  else showLoansIntro();
}

function startLoanApplication(index) {
  loanIndex = index;
  loanDecision = null;
  loanStages = 0;
  loanRate = KEY_RATE;
  loanGrace = 0;
  loanSigned = false;
  const application = currentLoanApplication();
  // The application is logged once, when it first reaches the player; a reload does not repeat it.
  const records = readProfileRecords(getUserProfileId());
  const presented = loansEpisodeRecords(records, EPISODE_EVENT)
    .some((record) => String(record['Идентификатор заявки']) === String(application.id));
  if (!presented) {
    logEpisode(BUSINESS_LOANS_CONTENT, {
      'Название эпизода': activeLoansEpisode.title,
      'Идентификатор эпизода': activeLoansEpisode.id,
      'Заявка': application.title,
      'Заявитель': application.screen_area?.applicant ?? '',
      'Номер заявки': index + 1,
      'Идентификатор заявки': application.id,
      'Запрошенная сумма': Number(application.price) || 0,
      'Игровой день': deriveRoomState(records).day,
    });
  }
  renderBusinessLoans();
  loansApplication.scrollTop = 0;
}

function renderBusinessLoans() {
  const application = currentLoanApplication();
  if (!application) return;
  const area = application.screen_area || {};
  loansProgress.replaceChildren(...loanApplicationList.map((item, index) => {
    const dot = document.createElement('li');
    const done = index < loanIndex || (index === loanIndex && loanSigned);
    dot.className = done ? 'is-done' : index === loanIndex ? 'is-current' : '';
    dot.textContent = done ? '✓' : String(index + 1);
    dot.setAttribute('aria-label', `${item.title}: ${done ? 'рассмотрена' : index === loanIndex ? 'сейчас' : 'ждёт'}`);
    return dot;
  }));
  loansCounter.textContent = `Заявка ${loanIndex + 1} из ${loanApplicationList.length}`;

  loansIcon.textContent = area.icon || '💼';
  loansApplicant.textContent = area.applicant || '';
  loansIdea.textContent = application.title;
  const corporation = loanKind(application) === LOAN_CORPORATION;
  loansTag.textContent = corporation ? 'Корпорация' : 'Малый бизнес';
  loansTag.classList.toggle('is-corporation', corporation);
  loansText.textContent = String(application.text || '');
  loansFacts.replaceChildren(...(area.facts ?? []).map((fact) => {
    const item = document.createElement('li');
    item.textContent = fact;
    return item;
  }));
  loansPrice.textContent = formatCoins(Number(application.price) || 0);
  loansTerm.textContent = formatLoanTerm(Number(area.term) || 1);

  renderLoanPlan(application);
  renderLoanDecision();
  renderLoanTerms(application);
  renderLoanStatus(application);
}

function renderLoanPlan(application) {
  const plan = loanPlan(application);
  const tranche = loanDecision === LOAN_TRANCHE;
  loansPlanHint.textContent = tranche ? 'нажми, до какого этапа даёшь деньги' : '';
  loansPlanList.classList.toggle('is-choosing', tranche && !loanSigned);
  const nodes = [];
  plan.forEach((stage, index) => {
    const funded = loanDecision === LOAN_FULL || (tranche && index < loanStages);
    const row = document.createElement('li');
    row.className = `loans-plan-stage${funded ? ' is-funded' : ''}`;
    const button = document.createElement('button');
    button.type = 'button';
    button.disabled = loanSigned;
    button.setAttribute('aria-pressed', String(tranche && index === loanStages - 1));
    button.setAttribute('aria-label', `Этап ${index + 1}: ${stage.title}, ${formatCoins(stage.amount)}. Первый транш до этого этапа`);
    const number = document.createElement('span');
    number.className = 'loans-plan-number';
    number.setAttribute('aria-hidden', 'true');
    number.textContent = funded ? '✓' : String(index + 1);
    const title = document.createElement('span');
    title.className = 'loans-plan-title';
    title.textContent = stage.title;
    const amount = document.createElement('b');
    amount.className = 'loans-plan-amount';
    amount.textContent = formatCoins(stage.amount);
    button.append(number, title, amount);
    button.addEventListener('click', () => chooseLoanStages(index + 1));
    row.append(button);
    nodes.push(row);
    // The cut of the tranche: everything below waits until the idea is proven.
    if (tranche && loanStages === index + 1 && index < plan.length - 1) {
      const cut = document.createElement('li');
      cut.className = 'loans-plan-cut';
      cut.textContent = '✂ дальше — только если идея сработает';
      nodes.push(cut);
    }
  });
  loansPlanList.replaceChildren(...nodes);
}

function renderLoanDecision() {
  for (const button of loansDecisionButtons) {
    button.setAttribute('aria-checked', String(button.dataset.decision === loanDecision));
    button.disabled = loanSigned;
  }
}

function renderLoanTerms(application) {
  const active = loanDecision === LOAN_FULL && !loanSigned;
  loansTerms.classList.toggle('is-idle', loanDecision !== LOAN_FULL);
  loansKeyRate.textContent = `${KEY_RATE}%`;
  loansRate.textContent = `${loanRate}%`;
  loansRate.dataset.level = loanRate <= KEY_RATE ? 'loss' : 'profit';
  loansRateDown.disabled = !active || loanRate <= RATE_MIN;
  loansRateUp.disabled = !active || loanRate >= RATE_MAX;
  loansGrace.replaceChildren(...GRACE_MONTHS.map((months) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-checked', String(loanGrace === months));
    button.disabled = !active;
    button.textContent = months > 0 ? `${months} мес.` : 'Нет';
    button.addEventListener('click', () => {
      if (loanDecision !== LOAN_FULL || loanSigned) return;
      loanGrace = months;
      renderBusinessLoans();
    });
    return button;
  }));

  if (loanDecision !== LOAN_FULL) {
    loansIncome.textContent = 'Ставка и отсрочка нужны, только если выдаёшь всю сумму';
    loansIncome.dataset.level = 'idle';
    return;
  }
  const { client, bank } = yearlyInterest(Number(application.price) || 0, loanRate);
  const bankText = bank > 0
    ? `банк заработает ${formatLoanCoins(bank)}`
    : bank < 0 ? `банк потеряет ${formatLoanCoins(-bank)}` : 'банк не заработает ничего';
  loansIncome.textContent = `Проценты в год: ${formatLoanCoins(client)} · ${bankText}`;
  loansIncome.dataset.level = bank > 0 ? 'profit' : 'loss';
}

function renderLoanStatus(application) {
  const price = Number(application.price) || 0;
  let text = 'Выбери решение по заявке';
  if (loanSigned) text = 'Решение подписано';
  else if (loanDecision === LOAN_REFUSE) text = 'Клиент получит вежливый отказ';
  else if (loanDecision === LOAN_TRANCHE && !loanStages) text = 'Нажми в плане на этап, до которого даёшь деньги';
  else if (loanDecision === LOAN_TRANCHE) {
    text = `Первый транш: ${formatCoins(loanAmount(application, currentLoanChoice()))} из ${formatCoins(price)}`;
  } else if (loanDecision === LOAN_FULL) {
    text = `Выдаём ${formatCoins(price)} под ${loanRate}%, отсрочка: ${formatGrace(loanGrace)}`;
  }
  loansStatus.textContent = text;
  loansSubmit.disabled = loanSigned || !loanDecision || (loanDecision === LOAN_TRANCHE && !loanStages);
}

function setLoanDecision(decision) {
  if (loanSigned || !activeLoansEpisode) return;
  loanDecision = decision;
  if (decision !== LOAN_TRANCHE) loanStages = 0;
  renderBusinessLoans();
  // The next thing to do sits in the plan (tranche) or in the terms (whole sum).
  if (decision === LOAN_TRANCHE) loansPlanList.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

// A stage of the plan is tapped: the tranche pays for it and every stage above it.
function chooseLoanStages(count) {
  if (loanSigned || !activeLoansEpisode) return;
  loanDecision = LOAN_TRANCHE;
  loanStages = count;
  renderBusinessLoans();
}

function changeLoanRate(step) {
  if (loanSigned || loanDecision !== LOAN_FULL) return;
  loanRate = Math.min(RATE_MAX, Math.max(RATE_MIN, loanRate + step));
  renderBusinessLoans();
}

function loanDecisionSummary(application) {
  if (loanDecision === LOAN_REFUSE) return 'Отказ';
  const amount = loanAmount(application, currentLoanChoice());
  if (loanDecision === LOAN_TRANCHE) return `Первый транш: ${formatCoins(amount)} из ${formatCoins(Number(application.price) || 0)}`;
  return `${formatCoins(amount)} под ${loanRate}% · отсрочка: ${formatGrace(loanGrace)}`;
}

function loanVerdictExtra(application, verdict) {
  const area = application.screen_area || {};
  const amount = loanAmount(application, currentLoanChoice());
  const price = Number(application.price) || 0;
  if (verdict.trigger === LOAN_RATE_BELOW_KEY) return `Ставка ${loanRate}% · ключевая ${KEY_RATE}%`;
  if (verdict.trigger === LOAN_CORPORATION_RATE_HIGH) return `Ставка ${loanRate}% — для корпорации не больше ${CORPORATION_RATE_MAX}%`;
  if (verdict.trigger === LOAN_SMALL_RATE_HIGH) return `Ставка ${loanRate}% — для малого бизнеса не больше ${SMALL_RATE_MAX}%`;
  if (verdict.trigger === LOAN_TRANCHE_EARLY || verdict.trigger === LOAN_TRANCHE_LATE) {
    return `Транш: ${formatCoins(amount)} из ${formatCoins(price)}`;
  }
  return `${area.icon || '💼'} ${application.title}`;
}

function logBusinessLoanAttempt(application, verdict) {
  const records = readProfileRecords(getUserProfileId());
  const mistake = verdict ? LOAN_MISTAKES[verdict.trigger] : null;
  const full = loanDecision === LOAN_FULL;
  logDecision(!verdict, {
    episode: BUSINESS_LOANS_CONTENT,
    'Название эпизода': activeLoansEpisode.title,
    'Идентификатор эпизода': activeLoansEpisode.id,
    'Заявка': application.title,
    'Заявитель': application.screen_area?.applicant ?? '',
    'Номер заявки': loanIndex + 1,
    'Идентификатор заявки': application.id,
    'Вид заявки': loanKind(application),
    'Попытка': loanDecisions(records, application.id).length + 1,
    'Решение': LOAN_DECISION_LABELS[loanDecision],
    'Запрошенная сумма': Number(application.price) || 0,
    'Сумма выдачи': loanAmount(application, currentLoanChoice()),
    ...(loanDecision === LOAN_TRANCHE ? { 'Этапов в транше': loanStages } : {}),
    ...(full ? { 'Ставка, %': loanRate, 'Ключевая ставка, %': KEY_RATE, 'Отсрочка, мес.': loanGrace } : {}),
    'Заявка решена': !verdict,
    ...(mistake ? { 'Ошибка': mistake.label } : {}),
    'Игровой день': deriveRoomState(records).day,
    explanation: mistake?.explanation ?? LOAN_RIGHT_EXPLANATION,
  });
}

// The last application is decided: the father's reward goes into the pocket together with the
// completion record, so a reload can neither lose it nor pay it twice. He says thank you in the room.
function completeBusinessLoans() {
  const episode = activeLoansEpisode;
  const profileId = getUserProfileId();
  const records = readProfileRecords(profileId);
  if (!episode || isEconomicEpisodeCompleted(records, episode)) return;
  const { day } = deriveRoomState(records);
  appendProfileRecord({
    'Тип события': POCKET_TOPUP_EVENT,
    'Профиль пользователя': profileId,
    'Значение': BUSINESS_LOANS_REWARD,
    'Назначение': `${episode.title}: благодарность папы`,
    'Источник средств': 'Папа',
    'Идентификатор эпизода': episode.id,
    'Игровой день': day,
  });
  appendBudgetFact(records, INCOME_ARTICLE, BUSINESS_LOANS_REWARD, {
    'Зачислено': 'Карман',
    'Источник средств': 'Папа',
    'Назначение': `${episode.title}: благодарность папы`,
    'Идентификатор эпизода': episode.id,
    'Игровой день': day,
  });
  appendProfileRecord({
    'Тип события': ECONOMIC_EPISODE_COMPLETED_EVENT,
    'Профиль пользователя': profileId,
    'Идентификатор эпизода': episode.id,
    'Название эпизода': episode.title,
    'Результат': `Рассмотрены заявки: ${loanApplicationList.map((item) => item.title).join(', ')}`,
    'Рассмотрено заявок': loanApplicationList.length,
    'Ошибочных попыток': loansEpisodeRecords(records, WRONG_DECISION_EVENT).length,
    'Награда в карман': BUSINESS_LOANS_REWARD,
    'Правильное решение': true,
    'Игровой день': day,
  });
}

function returnFromBusinessLoans() {
  finishLoansTutorial();
  loansMemo.hidden = true;
  loansVerdict.hidden = true;
  fatherEpisodeRunning = false;
  activeLoansEpisode = null;
  enterRoom();
}

function submitBusinessLoan() {
  const application = currentLoanApplication();
  if (!activeLoansEpisode || !application || loansSubmit.disabled) return;
  const verdict = loanVerdict(application, currentLoanChoice());
  // The mentor praises the first right decision of each kind; later ones get the short card.
  const kind = loanKind(application);
  const kindDecidedBefore = loansEpisodeRecords(readProfileRecords(getUserProfileId()), RIGHT_DECISION_EVENT)
    .some((record) => record['Вид заявки'] === kind);
  logBusinessLoanAttempt(application, verdict);
  if (verdict) {
    showMentor(verdict.trigger, {
      title: activeLoansEpisode.title,
      extra: loanVerdictExtra(application, verdict),
      closeLabel: 'Переделать <span aria-hidden="true">↺</span>',
      afterClose: () => loansSubmit.focus({ preventScroll: true }),
    });
    return;
  }

  loanSigned = true;
  finishLoansTutorial();
  const summary = loanDecisionSummary(application);
  const reason = String(application.screen_area?.reason || '');
  const last = loanIndex >= loanApplicationList.length - 1;
  renderBusinessLoans();
  if (last) {
    const mistakes = loansEpisodeRecords(readProfileRecords(getUserProfileId()), WRONG_DECISION_EVENT).length;
    completeBusinessLoans();
    const count = loanApplicationList.length;
    showMentor(mistakes ? 'loan-done' : 'loan-perfect', {
      title: activeLoansEpisode.title,
      extra: `${pluralRu(count, 'Рассмотрена', 'Рассмотрены', 'Рассмотрено')} ${count} ${pluralRu(count, 'заявка', 'заявки', 'заявок')}`
        + (mistakes ? ` · переделок: ${mistakes}` : ' · без единой ошибки'),
      closeLabel: 'Вернуться в комнату <span aria-hidden="true">→</span>',
      afterClose: returnFromBusinessLoans,
    });
    return;
  }
  if (!kindDecidedBefore) {
    showMentor(loanRightTrigger(kind), {
      title: activeLoansEpisode.title,
      extra: `${summary.replace(/\.$/, '')}. ${reason}`,
      closeLabel: 'Следующая заявка <span aria-hidden="true">→</span>',
      afterClose: nextLoanApplication,
    });
    return;
  }
  loansVerdictSummary.textContent = summary;
  loansVerdictText.textContent = reason;
  loansVerdict.hidden = false;
  loansVerdictNext.focus({ preventScroll: true });
}

function nextLoanApplication() {
  if (!activeLoansEpisode || !loanSigned) return;
  loansVerdict.hidden = true;
  startLoanApplication(loanIndex + 1);
  loansDecisionButtons[0]?.focus({ preventScroll: true });
}

function loansIntroWasSeen() {
  return loansEpisodeRecords(readProfileRecords(getUserProfileId()), LOANS_INTRO_SEEN_EVENT).length > 0;
}

// The mentor explains what a business loan is and the four kinds of applications, then the
// tutorial shows the screen.
function showLoansIntro() {
  const title = activeLoansEpisode.title;
  showMentor('loan-intro-what', {
    title,
    closeLabel: 'Дальше <span aria-hidden="true">→</span>',
    afterClose: () => showMentor('loan-intro-how', {
      title,
      closeLabel: 'Понятно <span aria-hidden="true">✓</span>',
      afterClose: () => {
        if (!activeLoansEpisode) return;
        appendProfileRecord({
          'Тип события': LOANS_INTRO_SEEN_EVENT,
          'Профиль пользователя': getUserProfileId(),
          'Идентификатор эпизода': activeLoansEpisode.id,
          'Название эпизода': activeLoansEpisode.title,
          'Игровой день': deriveRoomState(readProfileRecords(getUserProfileId())).day,
        });
        afterLoansIntro();
      },
    }),
  });
}

function afterLoansIntro() {
  if (!startLoansTutorial()) loansDecisionButtons[0]?.focus({ preventScroll: true });
}

// --- Business loans tutorial ---

function loansTutorialWasSeen() {
  return loansEpisodeRecords(readProfileRecords(getUserProfileId()), LOANS_TUTORIAL_SEEN_EVENT).length > 0;
}

function loansTutorialTarget() {
  const target = loanTutorialSteps[loanTutorialIndex]?.screen_area?.target;
  return target ? loansScreen.querySelector(`[data-loans-target="${CSS.escape(String(target))}"]`) : null;
}

function positionLoansTutorialFocus() {
  const target = loansTutorialTarget();
  loansTutorialFocus.hidden = !target;
  if (!target) return;
  const layerRect = loansTutorialLayer.getBoundingClientRect();
  // The plan sits inside the scrolling application: only its visible part is outlined.
  const box = target.getBoundingClientRect();
  const clip = loansApplication.contains(target) && target !== loansApplication ? loansApplication.getBoundingClientRect() : null;
  const top = clip ? Math.max(box.top, clip.top) : box.top;
  const bottom = clip ? Math.min(box.bottom, clip.bottom) : box.bottom;
  const radius = Number.parseFloat(getComputedStyle(target).borderTopLeftRadius) || 12;
  loansTutorialFocus.style.left = `${box.left - layerRect.left - LOANS_FOCUS_PADDING}px`;
  loansTutorialFocus.style.top = `${top - layerRect.top - LOANS_FOCUS_PADDING}px`;
  loansTutorialFocus.style.width = `${box.width + LOANS_FOCUS_PADDING * 2}px`;
  loansTutorialFocus.style.height = `${Math.max(0, bottom - top) + LOANS_FOCUS_PADDING * 2}px`;
  loansTutorialFocus.style.borderRadius = `${radius + LOANS_FOCUS_PADDING}px`;
}

function stopLoansTutorialVoice() {
  loansTutorialAudio.pause();
  loansTutorialAudio.removeAttribute('src');
  loansTutorialAudio.load();
  loansTutorialVoicePlaying = false;
  updateMusicFade();
}

function playLoansTutorialVoice(step) {
  stopLoansTutorialVoice();
  if (!step?.audio) return;
  loansTutorialAudio.src = publicAssetPath(step.audio_folder, step.audio, 'audio/loan_tutorial');
  loansTutorialAudio.volume = 1;
  loansTutorialAudio.muted = muted;
  loansTutorialAudio.play()
    .then(() => {
      loansTutorialVoicePlaying = true;
      updateMusicFade();
    })
    .catch((error) => {
      loansTutorialVoicePlaying = false;
      updateMusicFade();
      console.info(`Озвучка шага ${step.queue ?? loanTutorialIndex + 1} туториала кредитов пока недоступна.`, error);
    });
}

loansTutorialAudio.addEventListener('ended', () => {
  loansTutorialVoicePlaying = false;
  updateMusicFade();
});

loansTutorialAudio.addEventListener('error', () => {
  if (!loansTutorialAudio.getAttribute('src')) return;
  loansTutorialVoicePlaying = false;
  updateMusicFade();
  console.warn('Не удалось загрузить озвучку туториала кредитов:', loansTutorialAudio.currentSrc);
});

function renderLoansTutorialStep() {
  const step = loanTutorialSteps[loanTutorialIndex];
  if (!step) return finishLoansTutorial();
  const last = loanTutorialIndex === loanTutorialSteps.length - 1;
  loansTutorialLayer.dataset.placement = step.screen_area?.message_placement || 'bottom';
  loansTutorialProgress.textContent = `ШАГ ${loanTutorialIndex + 1} ИЗ ${loanTutorialSteps.length}`;
  loansTutorialText.textContent = String(step.text || '');
  loansTutorialBack.disabled = loanTutorialIndex === 0;
  loansTutorialNext.innerHTML = last
    ? 'Понятно! <span aria-hidden="true">✓</span>'
    : 'Дальше <span aria-hidden="true">→</span>';
  loansTutorialTarget()?.scrollIntoView({ block: 'nearest' });
  requestAnimationFrame(positionLoansTutorialFocus);
  playLoansTutorialVoice(step);
}

function startLoansTutorial() {
  if (!loanTutorialSteps.length || loansTutorialWasSeen()) return false;
  loanTutorialIndex = 0;
  setHidden(loansTutorialLayer, false);
  renderLoansTutorialStep();
  loansTutorialNext.focus({ preventScroll: true });
  return true;
}

function finishLoansTutorial({ skipped = false } = {}) {
  if (loansTutorialLayer.classList.contains('is-hidden')) return;
  stopLoansTutorialVoice();
  if (!loansTutorialWasSeen() && activeLoansEpisode) {
    appendProfileRecord({
      'Тип события': LOANS_TUTORIAL_SEEN_EVENT,
      'Профиль пользователя': getUserProfileId(),
      'Идентификатор эпизода': activeLoansEpisode.id,
      'Игровой день': deriveRoomState(readProfileRecords(getUserProfileId())).day,
      'Пропущен': skipped,
    });
  }
  setHidden(loansTutorialLayer, true);
  loansTutorialFocus.hidden = true;
  // The player starts by reading the application the tutorial has shown.
  loansApplication.scrollTop = 0;
  loansDecisionButtons[0]?.focus({ preventScroll: true });
}

for (const button of loansDecisionButtons) {
  button.addEventListener('click', () => setLoanDecision(button.dataset.decision));
}
loansRateDown.addEventListener('click', () => changeLoanRate(-1));
loansRateUp.addEventListener('click', () => changeLoanRate(1));
loansSubmit.addEventListener('click', submitBusinessLoan);
loansVerdictNext.addEventListener('click', nextLoanApplication);
loansMemoOpen.addEventListener('click', () => {
  loansMemo.hidden = false;
  loansMemoClose.focus({ preventScroll: true });
});
loansMemoClose.addEventListener('click', () => {
  loansMemo.hidden = true;
  loansMemoOpen.focus({ preventScroll: true });
});
loansTutorialNext.addEventListener('click', () => {
  if (loanTutorialIndex >= loanTutorialSteps.length - 1) return finishLoansTutorial();
  loanTutorialIndex += 1;
  renderLoansTutorialStep();
});
loansTutorialBack.addEventListener('click', () => {
  if (loanTutorialIndex === 0) return;
  loanTutorialIndex -= 1;
  renderLoansTutorialStep();
});
loansTutorialSkip.addEventListener('click', () => finishLoansTutorial({ skipped: true }));
loansApplication.addEventListener('scroll', () => {
  if (!loansTutorialLayer.classList.contains('is-hidden')) positionLoansTutorialFocus();
});
window.addEventListener('resize', () => {
  if (!loansTutorialLayer.classList.contains('is-hidden')) positionLoansTutorialFocus();
});

function hideRoomMessage() {
  window.clearTimeout(roomMessageTimer);
  roomActionMessage.hidden = true;
}

function showRoomMessage(text) {
  hideRoomMessage();
  roomActionMessage.textContent = text;
  roomActionMessage.hidden = false;
  roomMessageTimer = window.setTimeout(hideRoomMessage, ROOM_MESSAGE_SECONDS * 1000);
}

function closeRoomAction() {
  selectedRoomAction = null;
  roomActionConfirm.hidden = true;
  roomActionButtons.forEach((button) => button.setAttribute('aria-expanded', 'false'));
}

// Centres the hint above its icon, keeping it inside the bar; the arrow follows the icon.
function positionRoomActionConfirm(button) {
  const barRect = roomBottomBar.getBoundingClientRect();
  const buttonRect = button.getBoundingClientRect();
  const center = buttonRect.left + buttonRect.width / 2 - barRect.left;
  const width = roomActionConfirm.offsetWidth;
  const left = Math.max(0, Math.min(barRect.width - width, center - width / 2));
  roomActionConfirm.style.left = `${left}px`;
  roomActionConfirm.style.setProperty('--arrow-x', `${center - left}px`);
}

function openRoomAction(button) {
  closeRoomAction();
  hideRoomMessage();
  void roomActionConfirm.offsetWidth; // restart the pop-in animation when switching icons
  selectedRoomAction = button.dataset.roomAction;
  const { day } = deriveRoomState(readProfileRecords(getUserProfileId()));
  const entries = selectedRoomAction === 'shop'
    ? availableStores(day).map((store) => ({ title: store.title, storeId: store.id }))
    : [{ title: ROOM_ACTION_LABELS[selectedRoomAction] }];
  roomActionConfirm.replaceChildren(...entries.map(({ title, storeId }) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'room-action-confirm-item';
    if (storeId != null) item.dataset.storeId = String(storeId);
    const label = document.createElement('span');
    label.textContent = title;
    const arrow = document.createElement('span');
    arrow.className = 'room-action-confirm-go';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '›';
    item.append(label, arrow);
    return item;
  }));
  if (!entries.length) {
    closeRoomAction();
    return;
  }
  button.setAttribute('aria-expanded', 'true');
  roomActionConfirm.hidden = false;
  positionRoomActionConfirm(button);
}

function availableStores(day) {
  return dataMartRows
    .filter((row) => row.object_type === 'Store' && row.day_is_it_available != null && row.day_is_it_available <= day);
}

async function replayBriefingFromRoom() {
  // In the final part the question mark repeats the rules of the final part.
  if (isFinalPart(readProfileRecords(getUserProfileId())) && finalBriefingSteps().length) {
    replayingRoomBriefing = true;
    leaveRoom();
    showFinalBriefingSteps();
    return;
  }
  try {
    briefingSteps = await loadBriefingSteps();
    if (!briefingSteps.length) throw new Error('Пустой брифинг');
    replayingRoomBriefing = true;
    leaveRoom();
    showBriefingSteps();
  } catch (error) {
    console.warn('Не удалось повторить брифинг:', error);
    showRoomMessage('Не получилось открыть брифинг. Попробуй ещё раз.');
  }
}

roomActionButtons.forEach((button) => button.addEventListener('click', () => {
  // The tasks icon opens its list straight away: the list itself names every task.
  if (button.dataset.roomAction === 'tasks') {
    openTaskList();
    return;
  }
  if (selectedRoomAction === button.dataset.roomAction) {
    closeRoomAction();
    return;
  }
  openRoomAction(button);
}));

roomActionConfirm.addEventListener('click', (event) => {
  const item = event.target.closest('.room-action-confirm-item');
  if (!item) return;
  const action = selectedRoomAction;
  if (!action) return;
  closeRoomAction();
  if (action === 'briefing') {
    replayBriefingFromRoom();
    return;
  }
  if (action === 'messages') {
    openRoomInbox();
    return;
  }
  if (action === 'shop') {
    const store = dataMartRows.find((row) => row.object_type === 'Store' && String(row.id) === item.dataset.storeId);
    if (store) openStore(store);
    return;
  }
  if (action === 'feed') {
    startFeeding();
    return;
  }
  if (action === 'clean') {
    startCleaning();
    return;
  }
  if (action === 'next') {
    const records = readProfileRecords(getUserProfileId());
    const state = deriveRoomState(records);
    // In the final part the days run by themselves: the moon starts them like the ▶ button.
    if (isFinalPart(records)) {
      if (finalOutcome(records)) showRoomMessage('Игра окончена — дни больше не идут');
      else runFinalDays();
      return;
    }
    if (canFinishDay(state)) startNextDay();
    else showRoomMessage(finishDayHint(state));
    return;
  }
  // The remaining actions are placeholders for now.
  showRoomMessage(`«${item.firstElementChild.textContent}» скоро появится`);
});

finishMonsterStage.addEventListener('pointerdown', () => {
  closeRoomAction();
  hideRoomMessage();
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || finishScreen.hidden || !selectedRoomAction) return;
  const button = roomActionButtons.find((item) => item.dataset.roomAction === selectedRoomAction);
  closeRoomAction();
  button?.focus();
});

window.addEventListener('resize', () => {
  const button = roomActionButtons.find((item) => item.dataset.roomAction === selectedRoomAction);
  if (button) positionRoomActionConfirm(button);
});

window.addEventListener('storage', (event) => {
  if (!finishScreen.hidden && (event.key === null || event.key === getProfileRecordsStorageKey(getUserProfileId()))) renderRoomHud();
});

// --- Поломка удалителя козявок (эпизод 352, день 9) ----------------------------------

// The player taps 🤧 on the ninth day and the nose cleaner turns out broken. The warranty repair is
// free but takes three days, and the monster is dirty today, so a spare has to be bought. Which one
// pays off depends on how long the game still goes on, so first the game works out when the piggy
// bank reaches the player's goals (the player may promise to save more), then the player works out
// with the mentor what each spare costs by that day, buys one and cleans the monster with it.
// The arithmetic lives in repair-episode.js.
const REPAIR_CONTENT = 'Поломка удалителя козявок: ремонт по гарантии бесплатный, но длится 3 дня, а чистить монстрика нужно сегодня.'
  + ' Прогноз срока накоплений решает, какая запаска выгоднее: дешёвая на картриджах или вторая надёжная.';
const REPAIR_FORECAST_EVENT = 'Прогноз срока накопления';
const REPAIR_TUTORIAL_OBJECT_TYPE = 'Repair episode tutorial';
const REPAIR_TUTORIAL_SEEN_EVENT = 'Просмотр туториала эпизода с поломкой';
// The `title` of the tutorial rows each stage opens.
const REPAIR_TUTORIALS = { forecast: 'Прогноз', spare: 'Запаска' };
const REPAIR_STAGES = ['broken', 'forecast', 'spare'];
const REPAIR_STAGE_HEADERS = {
  broken: ['СЕРВИСНЫЙ ЦЕНТР', 'Ковырялка сломалась'],
  forecast: ['СКОЛЬКО ЕЩЁ КОПИТЬ', 'Когда победа?'],
  spare: ['ЗАПАСНАЯ КОВЫРЯЛКА', 'Какую запаску взять'],
};
const REPAIR_NEXT_LABELS = {
  broken: 'Сдать в ремонт <span aria-hidden="true">🔧</span>',
  forecast: 'Дальше: выбираем запаску <span aria-hidden="true">→</span>',
  spare: 'Купить и почистить <span aria-hidden="true">🤧</span>',
};
// Drawn pictures of the devices with a transparent background, by data mart id.
const REPAIR_SPRITES = {
  75: 'kozilett_sprie.png',
  76: 'norma_sprite.png',
  77: 'ikoviryalka_sprite.png',
};
const REPAIR_FOCUS_PADDING = 6;

const repairEyebrow = $('#repair-eyebrow');
const repairTitle = $('#repair-title');
const repairProgress = $('#repair-progress');
const repairLeave = $('#repair-leave');
const repairBodies = [...repairScreen.querySelectorAll('.repair-body')];
const repairDeviceImage = $('#repair-device-image');
const repairDeviceName = $('#repair-device-name');
const repairDeviceProblem = $('#repair-device-problem');
const repairWarrantyList = $('#repair-warranty-list');
const repairGoals = $('#repair-goals');
const repairGoalsNote = $('#repair-goals-note');
const repairHistory = $('#repair-history');
const repairHistoryNote = $('#repair-history-note');
const repairPromiseModes = [...repairScreen.querySelectorAll('.repair-promise-mode')];
const repairPromiseRow = $('.repair-promise-row');
const repairPromiseDown = $('#repair-promise-down');
const repairPromiseUp = $('#repair-promise-up');
const repairPromiseValue = $('#repair-promise-value');
const repairPromiseRange = $('#repair-promise-range');
const repairForecastLine = $('#repair-forecast-line');
const repairVictoryDay = $('#repair-victory-day');
const repairVictoryDays = $('#repair-victory-days');
const repairRiskHorizon = $('#repair-risk-horizon');
const repairCalcSteps = $('#repair-calc-steps');
const repairSpares = $('#repair-spares');
const repairStatus = $('#repair-status');
const repairNext = $('#repair-next');
const repairTutorialLayer = $('#repair-tutorial-layer');
const repairTutorialFocus = $('#repair-tutorial-focus');
const repairTutorialProgress = $('#repair-tutorial-progress');
const repairTutorialText = $('#repair-tutorial-text');
const repairTutorialBack = $('#repair-tutorial-back');
const repairTutorialNext = $('#repair-tutorial-next');
const repairTutorialSkip = $('#repair-tutorial-skip');

let activeRepairEpisode = null;
let repairStage = 'broken';
// The device that broke; it goes to the service centre.
let repairBrokenDevice = null;
// How the player goes on saving: 'history' — as before, 'promise' — `repairPromise` coins a budget.
let repairPromiseMode = 'history';
let repairPromise = 0;
// The forecast the player took into the choice of the spare.
let repairPlan = null;
// The answers of the calculation the player got right, by question.
let repairAnswers = {};
let repairSpareId = null;
let repairTutorialSteps = [];
let repairTutorialIndex = 0;
let repairTutorialTitle = null;

function isRepairEpisode(episode) {
  return Number(episode?.id) === REPAIR_EPISODE_ID;
}

function repairEpisodeRecords(records, type) {
  return records.filter((record) => (
    record?.['Тип события'] === type && String(record['Идентификатор эпизода']) === String(activeRepairEpisode?.id)
  ));
}

function repairSprite(device) {
  const file = REPAIR_SPRITES[device?.id];
  return file ? publicAssetPath('public/images/store', file) : publicAssetPath(device?.image_folder, device?.image, 'images/store');
}

// Fractions are read the Russian way: «1,4 поломки», like the genitive of one.
function pluralValue(value, one, few, many) {
  return Number.isInteger(value) ? pluralRu(value, one, few, many) : few;
}

function formatNumber(value) {
  return Number(value).toLocaleString('ru-RU');
}

function daysWord(count) {
  return pluralRu(count, 'день', 'дня', 'дней');
}

function breakdownsWord(value) {
  return pluralValue(value, 'поломка', 'поломки', 'поломок');
}

function budgetsWord(count) {
  return pluralRu(count, 'бюджет', 'бюджета', 'бюджетов');
}

function openRepairEpisode(episode) {
  const profileId = getUserProfileId();
  const records = readProfileRecords(profileId);
  const state = deriveRoomState(records);
  if (isEconomicEpisodeCompleted(records, episode)) {
    enterRoom();
    return;
  }
  activeRepairEpisode = episode;
  recordEconomicEpisodeOpened(episode);
  closeRoomAction();
  hideRoomMessage();
  closeRoomInbox();
  closeSavingsTransfer();
  leaveRoom();

  const items = techItems();
  const handedIn = repairEpisodeRecords(records, DEVICE_REPAIR_EVENT).at(-1) ?? null;
  repairBrokenDevice = handedIn
    ? items.find((item) => String(item.id) === String(handedIn['Прибор'])) ?? null
    : cleaningDevice(state, items, (device) => usedCleanings(records, device))?.device ?? null;
  const planRecord = repairEpisodeRecords(records, REPAIR_FORECAST_EVENT).at(-1) ?? null;
  repairPlan = planRecord ? repairPlanFromRecord(planRecord) : null;
  repairPromiseMode = 'history';
  repairPromise = defaultRepairPromise(piggyHistory(records));
  repairAnswers = {};
  repairSpareId = null;
  if (!repairEpisodeRecords(records, EPISODE_EVENT).length) {
    logEpisode(REPAIR_CONTENT, {
      'Название эпизода': episode.title,
      'Идентификатор эпизода': episode.id,
      'Сломанный прибор': repairBrokenDevice?.title ?? null,
      'Игровой день': state.day,
    });
  }
  showOnlyScreen(repairScreen);
  showRepairStage(repairPlan ? 'spare' : handedIn ? 'forecast' : 'broken');
}

function returnFromRepair() {
  finishRepairTutorial();
  closeMentor();
  activeRepairEpisode = null;
  enterRoom();
}

function showRepairStage(stage) {
  repairStage = stage;
  repairScreen.dataset.stage = stage;
  const index = REPAIR_STAGES.indexOf(stage);
  for (const body of repairBodies) body.hidden = body.dataset.stage !== stage;
  [...repairProgress.children].forEach((item, itemIndex) => {
    item.className = itemIndex < index ? 'is-done' : itemIndex === index ? 'is-current' : '';
  });
  const [eyebrow, title] = REPAIR_STAGE_HEADERS[stage];
  repairEyebrow.textContent = eyebrow;
  repairTitle.textContent = title;
  repairNext.innerHTML = REPAIR_NEXT_LABELS[stage];
  renderRepair();
  repairBodies.find((body) => !body.hidden)?.scrollTo?.(0, 0);
  if (REPAIR_TUTORIALS[stage]) maybeStartRepairTutorial(REPAIR_TUTORIALS[stage]);
}

function renderRepair() {
  if (repairStage === 'broken') renderRepairBroken();
  if (repairStage === 'forecast') renderRepairForecast();
  if (repairStage === 'spare') renderRepairSpare();
}

// --- 1. The breakdown ---

function repairReturnDay(day) {
  return day + REPAIR_DAYS;
}

function renderRepairBroken() {
  const records = readProfileRecords(getUserProfileId());
  const { day } = deriveRoomState(records);
  const device = repairBrokenDevice;
  repairDeviceImage.src = repairSprite(device);
  repairDeviceImage.alt = device?.title ?? '';
  repairDeviceName.textContent = device?.title ?? 'Ковырялка';
  repairDeviceProblem.textContent = BREAKDOWNS[device?.id] ?? 'Не работает';
  const bought = records.find((record) => record?.['Тип события'] === GOODS_PURCHASE_EVENT
    && String(record['Идентификатор товара']) === String(device?.id));
  const used = device ? usedCleanings(records, device) : 0;
  const rows = [
    ['Прибор', device?.title ?? '—'],
    ['Куплен', bought?.['Игровой день'] ? `на ${bought['Игровой день']}-й день` : 'в магазине техники'],
    ['Сделано чисток', String(used)],
    ['Ремонт', 'бесплатно, по гарантии'],
    ['Срок ремонта', `${REPAIR_DAYS} ${daysWord(REPAIR_DAYS)} — вернётся на ${repairReturnDay(day)}-й день`],
  ];
  repairWarrantyList.replaceChildren(...rows.flatMap(([term, value]) => {
    const dt = document.createElement('dt');
    dt.textContent = term;
    const dd = document.createElement('dd');
    dd.textContent = value;
    return [dt, dd];
  }));
  repairStatus.textContent = 'Сдай ковырялку в ремонт — это бесплатно';
  repairNext.disabled = false;
}

function handInRepairDevice() {
  const episode = activeRepairEpisode;
  if (!episode) return;
  const profileId = getUserProfileId();
  const records = readProfileRecords(profileId);
  const { day } = deriveRoomState(records);
  const device = repairBrokenDevice;
  if (!repairEpisodeRecords(records, DEVICE_REPAIR_EVENT).length) {
    appendProfileRecord({
      'Тип события': DEVICE_REPAIR_EVENT,
      'Профиль пользователя': profileId,
      'Прибор': device?.id ?? null,
      'Название прибора': device?.title ?? null,
      'Неисправность': BREAKDOWNS[device?.id] ?? null,
      'Ремонт': 'Гарантийный',
      'Стоимость ремонта': 0,
      [REPAIR_RETURN_DAY_FIELD]: repairReturnDay(day),
      'Идентификатор эпизода': episode.id,
      'Игровой день': day,
    });
  }
  showMentor('repair-intro', {
    title: episode.title,
    extra: `«${device?.title ?? 'Ковырялка'}» вернётся на ${repairReturnDay(day)}-й день`,
    closeLabel: 'Считаем <span aria-hidden="true">→</span>',
    afterClose: () => {
      if (activeRepairEpisode) showRepairStage('forecast');
    },
  });
}

// --- 2. The forecast ---

// A promise worth making saves a little more than the player has been saving so far.
function defaultRepairPromise(history) {
  return Math.min(PROMISE_MAX, Math.max(5, Math.ceil((history.perBudget + 1) / 5) * 5));
}

function currentRepairForecast() {
  const records = readProfileRecords(getUserProfileId());
  const state = deriveRoomState(records);
  const history = piggyHistory(records);
  const target = savingsTarget(acceptedSavingsGoals(records));
  const promise = repairPromiseMode === 'promise' ? repairPromise : null;
  const perBudget = promise ?? history.perBudget;
  const forecast = savingsForecast({
    balance: state.savings,
    target: target.total,
    perBudget,
    budgetsDone: history.budgets,
    day: state.day,
  });
  const cleanings = cleaningsAhead(state.day, forecast.victoryDay);
  return { day: state.day, savings: state.savings, history, target, promise, perBudget, forecast, cleanings };
}

function repairRow(label, value, className = '') {
  const item = document.createElement('li');
  if (className) item.className = className;
  const name = document.createElement('span');
  name.textContent = label;
  const amount = document.createElement('b');
  amount.textContent = value;
  item.append(name, amount);
  return item;
}

function signedCoins(value) {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${formatCoins(Math.abs(value))}`;
}

function renderRepairForecast() {
  const plan = currentRepairForecast();
  const { history, target, forecast } = plan;

  repairGoals.replaceChildren(...(target.isDefault
    ? [repairRow('Своей цели нет — копим на победу', formatCoins(target.total), 'is-default')]
    : [
      ...target.goals.map((goal) => repairRow(goal.title, formatCoins(goal.price))),
      ...(target.goals.length > 1 ? [repairRow('Всего', formatCoins(target.total), 'is-total')] : []),
    ]));
  repairGoalsNote.textContent = target.isDefault ? 'цели не выбраны' : `${target.goals.length} ${pluralRu(target.goals.length, 'цель', 'цели', 'целей')}`;

  repairHistoryNote.textContent = `за ${history.budgets} ${budgetsWord(history.budgets)}`;
  repairHistory.replaceChildren(
    repairRow('Отложено из бюджетов', signedCoins(history.planned)),
    ...(history.unplanned ? [repairRow('Подарки и награды', signedCoins(history.unplanned))] : []),
    ...(history.withdrawn ? [repairRow('Взято из копилки', signedCoins(-history.withdrawn), 'is-minus')] : []),
    repairRow('Сейчас в копилке', formatCoins(plan.savings), 'is-total'),
    repairRow('В среднем за бюджет (3 дня)', signedCoins(history.perBudget), 'is-average'),
  );

  const promising = repairPromiseMode === 'promise';
  for (const button of repairPromiseModes) {
    button.setAttribute('aria-checked', String(button.dataset.promiseMode === repairPromiseMode));
  }
  repairPromiseRow.classList.toggle('is-idle', !promising);
  repairPromiseRange.disabled = !promising;
  repairPromiseDown.disabled = !promising || repairPromise <= 0;
  repairPromiseUp.disabled = !promising || repairPromise >= 100;
  // Before a promise is made, the scale shows how much the player has been saving so far.
  const shown = promising ? repairPromise : Math.max(0, Math.min(100, Math.round(history.perBudget)));
  repairPromiseRange.value = String(shown);
  repairPromiseRange.style.setProperty('--fill', `${shown}%`);
  repairPromiseRange.style.setProperty('--honest', `${PROMISE_MAX}%`);
  repairPromiseValue.textContent = formatCoins(shown);
  repairPromiseValue.dataset.level = promising && repairPromise > PROMISE_MAX ? 'loss' : 'profit';

  const per = formatCoins(plan.perBudget);
  if (forecast.left === 0) {
    repairForecastLine.textContent = 'Копилка уже набрана — победа хоть сегодня!';
  } else if (!Number.isFinite(forecast.budgets)) {
    repairForecastLine.textContent = `Осталось накопить ${formatCoins(forecast.left)}, а копилка не растёт — так победы не будет`;
  } else {
    repairForecastLine.textContent = `Осталось накопить ${formatCoins(forecast.left)}: по ${per} — это ещё ${forecast.budgets} ${budgetsWord(forecast.budgets)}`;
  }
  const reachable = Number.isFinite(forecast.victoryDay);
  repairVictoryDay.textContent = reachable ? `на ${forecast.victoryDay}-й день` : 'не видно';
  repairVictoryDays.textContent = reachable
    ? (forecast.days ? `ещё ${forecast.days} ${daysWord(forecast.days)} · ${plan.cleanings} ${cleaningsWord(plan.cleanings)}` : 'уже сегодня')
    : 'копилка не растёт';
  repairScreen.querySelector('.repair-forecast-card').dataset.level = reachable ? 'ok' : 'loss';
  repairStatus.textContent = promising
    ? `Обещание: ${formatCoins(repairPromise)} из каждого бюджета`
    : 'Прогноз по тому, как ты копил до сих пор';
  repairNext.disabled = false;
}

function setRepairPromiseMode(mode) {
  if (repairStage !== 'forecast') return;
  repairPromiseMode = mode;
  renderRepairForecast();
}

function changeRepairPromise(value) {
  if (repairStage !== 'forecast' || repairPromiseMode !== 'promise') return;
  repairPromise = Math.max(0, Math.min(100, Math.round(value)));
  renderRepairForecast();
}

function repairForecastExtra(plan) {
  const { forecast } = plan;
  if (!Number.isFinite(forecast.victoryDay)) return `В копилке ${formatCoins(plan.savings)} · цель ${formatCoins(plan.target.total)}`;
  const promise = plan.promise !== null ? `По ${formatCoins(plan.promise)} за бюджет` : `Как раньше: по ${formatCoins(plan.perBudget)} за бюджет`;
  return `${promise} · победа на ${forecast.victoryDay}-й день · до неё ${plan.cleanings} ${cleaningsWord(plan.cleanings)}`;
}

function logRepairForecast(plan, verdict, accepted) {
  logDecision(accepted, {
    episode: REPAIR_CONTENT,
    'Название эпизода': activeRepairEpisode.title,
    'Идентификатор эпизода': activeRepairEpisode.id,
    'Шаг': 'Прогноз срока накопления',
    'Обещание в бюджет': plan.promise,
    'В среднем за бюджет раньше': plan.history.perBudget,
    'День победы': Number.isFinite(plan.forecast.victoryDay) ? plan.forecast.victoryDay : null,
    'Реплика ментора': verdict.trigger,
    'Игровой день': plan.day,
    explanation: {
      'repair-forecast-never': 'Копилка не растёт: без обещания откладывать победы не будет.',
      'repair-promise-unrealistic': `Обещание больше ${PROMISE_MAX}: из бюджета в 100 монет столько не отложить, ведь нужны корм и веселье.`,
      'repair-promise-lower': 'Обещание не больше, чем игрок откладывал раньше: оно не ускоряет победу.',
      'repair-forecast-long': 'Прогноз по прежнему темпу длиннее двух месяцев, игрок оставил его без обещания.',
      'repair-forecast-history': 'Прогноз по прежнему темпу накоплений принят.',
      'repair-forecast-promise': 'Игрок пообещал откладывать больше, прогноз пересчитан по обещанию.',
    }[verdict.trigger] ?? '',
  });
}

function submitRepairForecast() {
  const episode = activeRepairEpisode;
  if (!episode) return;
  const plan = currentRepairForecast();
  const verdict = forecastVerdict({ promise: plan.promise, history: plan.history, forecast: plan.forecast });
  if (verdict.blocking) {
    logRepairForecast(plan, verdict, false);
    showMentor(verdict.trigger, {
      title: episode.title,
      extra: repairForecastExtra(plan),
      closeLabel: 'Исправить <span aria-hidden="true">↺</span>',
      afterClose: () => {
        if (verdict.trigger === 'repair-forecast-never') setRepairPromiseMode('promise');
      },
    });
    return;
  }
  if (verdict.trigger === FORECAST_LONG) {
    showMentor(verdict.trigger, {
      title: episode.title,
      extra: repairForecastExtra(plan),
      closeLabel: 'Пообещаю больше <span aria-hidden="true">🤞</span>',
      afterClose: () => setRepairPromiseMode('promise'),
      alternativeLabel: 'Оставить как есть',
      afterAlternative: () => acceptRepairForecast(plan, verdict, { quiet: true }),
    });
    return;
  }
  acceptRepairForecast(plan, verdict);
}

function acceptRepairForecast(plan, verdict, { quiet = false } = {}) {
  const episode = activeRepairEpisode;
  if (!episode) return;
  const { forecast, history, target } = plan;
  appendProfileRecord({
    'Тип события': REPAIR_FORECAST_EVENT,
    'Профиль пользователя': getUserProfileId(),
    'Идентификатор эпизода': episode.id,
    'Цели': target.isDefault ? null : target.goals.map((goal) => goal.title).join(', '),
    'Цель по умолчанию': target.isDefault,
    'Сумма целей': target.total,
    'В копилке': plan.savings,
    'Отложено из бюджетов': history.planned,
    'Внеплановые доходы': history.unplanned,
    'Взято из копилки': history.withdrawn,
    'Бюджетов': history.budgets,
    'В среднем за бюджет': history.perBudget,
    'Обещание в бюджет': plan.promise,
    'Осталось накопить': forecast.left,
    'Бюджетов до победы': forecast.budgets,
    'День победы': forecast.victoryDay,
    'Дней до победы': forecast.days,
    'Чисток до победы': plan.cleanings,
    'Игровой день': plan.day,
  });
  logRepairForecast(plan, verdict, true);
  repairPlan = { ...plan };
  const next = () => {
    if (activeRepairEpisode) showRepairStage('spare');
  };
  if (quiet) {
    next();
    return;
  }
  showMentor(verdict.trigger, {
    title: episode.title,
    extra: repairForecastExtra(plan),
    closeLabel: 'К запаске <span aria-hidden="true">→</span>',
    afterClose: next,
  });
}

// A reload after the forecast brings the player straight back to the spare.
function repairPlanFromRecord(record) {
  const cleanings = Number(record['Чисток до победы']) || 0;
  return {
    day: Number(record['Игровой день']) || 0,
    promise: record['Обещание в бюджет'] ?? null,
    perBudget: record['Обещание в бюджет'] ?? record['В среднем за бюджет'],
    forecast: {
      victoryDay: Number(record['День победы']),
      days: Number(record['Дней до победы']),
      budgets: Number(record['Бюджетов до победы']),
      left: Number(record['Осталось накопить']),
    },
    cleanings,
  };
}

// --- 3. The spare ---

function repairCleaningDays(day, count) {
  const first = (Math.floor(day / HARD_DAY_PERIOD) + 1) * HARD_DAY_PERIOD;
  return Array.from({ length: Math.min(3, count) }, (_, index) => first + index * HARD_DAY_PERIOD);
}

function repairCheapDevice() {
  return cleanerDevices(techItems()).find((device) => itemSpec(device)?.refillId) ?? null;
}

// The calculation as a list of questions; each opens once the one before it is answered right.
function repairQuestions() {
  const cleanings = repairPlan?.cleanings ?? 0;
  const breakdowns = expectedBreakdowns(cleanings);
  const cheap = repairCheapDevice();
  const cartridge = techItems().find((item) => item.id === CARTRIDGE_ITEM_ID);
  const cartridgePrice = Number(cartridge?.price) || 0;
  const percent = Math.round(BREAKDOWN_CHANCE * 100);
  return [
    {
      key: 'breakdowns',
      question: `Сколько раз в среднем сломается основная ковырялка за ${cleanings} ${cleaningsWord(cleanings)}, если ломается ${percent}% чисток?`,
      hint: `${percent}% — это ${percent} из 100, то есть 1 из 5`,
      options: cleanings > 0 ? breakdownQuiz(cleanings) : null,
      answer: breakdowns,
      unit: (value) => `${formatNumber(value)} ${breakdownsWord(value)}`,
      solved: cleanings > 0
        ? `${cleanings} × ${percent}% = ${formatNumber(breakdowns)} ${breakdownsWord(breakdowns)} в среднем`
        : 'Чисток до победы больше не будет — и поломок тоже',
    },
    {
      key: 'cost',
      question: `Во что обойдётся «${cheap?.title ?? 'дешёвая запаска'}» к победе?`,
      hint: `Прибор ${formatCoins(Number(cheap?.price) || 0)} с картриджем на сегодня + картридж ${formatCoins(cartridgePrice)} на каждую поломку`,
      options: cheap ? cheapSpareQuiz(cheap, breakdowns, cleanings) : null,
      answer: cheap ? spareCost(cheap, breakdowns) : 0,
      unit: (value) => formatCoins(value),
      solved: cheap
        ? `${formatCoins(Number(cheap.price) || 0)} + ${formatNumber(breakdowns)} × ${formatCoins(cartridgePrice)} = ${formatCoins(spareCost(cheap, breakdowns))}`
        : '',
    },
  ];
}

function repairCalcDone() {
  return repairQuestions().every((question) => !question.options || repairAnswers[question.key] !== undefined);
}

function renderRepairSpare() {
  const plan = repairPlan;
  if (!plan) return;
  const records = readProfileRecords(getUserProfileId());
  const state = deriveRoomState(records);
  const cleanings = plan.cleanings;
  const days = repairCleaningDays(state.day, cleanings);
  repairRiskHorizon.textContent = cleanings > 0
    ? `До победы (${plan.forecast.victoryDay}-й день) ещё ${cleanings} ${cleaningsWord(cleanings)}: дни ${days.join(', ')}${cleanings > days.length ? '…' : ''}`
    : 'До победы чисток больше не будет: запаска нужна только на сегодня';

  const questions = repairQuestions();
  let open = true;
  const steps = [];
  for (const [index, question] of questions.entries()) {
    if (!open) break;
    const answered = !question.options || repairAnswers[question.key] !== undefined;
    const step = document.createElement('li');
    step.className = `repair-calc-step${answered ? ' is-solved' : ''}`;
    const number = document.createElement('span');
    number.className = 'repair-calc-number';
    number.setAttribute('aria-hidden', 'true');
    number.textContent = answered ? '✓' : String(index + 1);
    const body = document.createElement('div');
    body.className = 'repair-calc-body';
    const text = document.createElement('p');
    text.className = 'repair-calc-question';
    text.textContent = question.question;
    body.append(text);
    if (answered) {
      const result = document.createElement('p');
      result.className = 'repair-calc-result';
      result.textContent = question.solved;
      body.append(result);
    } else {
      const hint = document.createElement('small');
      hint.className = 'repair-calc-hint';
      hint.textContent = question.hint;
      const options = document.createElement('div');
      options.className = 'repair-calc-options';
      options.append(...question.options.map((option) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = question.unit(option.value);
        button.addEventListener('click', () => answerRepairQuestion(question, option));
        return button;
      }));
      body.append(hint, options);
      open = false;
    }
    step.append(number, body);
    steps.push(step);
  }
  const done = repairCalcDone();
  if (done) {
    const items = techItems();
    const reliable = items.find((item) => item.id === RIGHT_CLEANER_ID);
    const premium = cleanerDevices(items).find((device) => device.id !== RIGHT_CLEANER_ID && !itemSpec(device)?.refillId);
    const step = document.createElement('li');
    step.className = 'repair-calc-step is-solved is-info';
    const number = document.createElement('span');
    number.className = 'repair-calc-number';
    number.setAttribute('aria-hidden', 'true');
    number.textContent = '3';
    const body = document.createElement('div');
    body.className = 'repair-calc-body';
    const text = document.createElement('p');
    text.className = 'repair-calc-question';
    text.textContent = 'А приборы без картриджей стоят столько, сколько на ценнике:';
    const result = document.createElement('p');
    result.className = 'repair-calc-result';
    result.textContent = [
      reliable ? `«${reliable.title}» — ${formatCoins(Number(reliable.price) || 0)}, её ${itemSpec(reliable)?.cleanings ?? 0} чисток хватит` : '',
      premium ? `«${premium.title}» — ${formatCoins(Number(premium.price) || 0)} за то же самое` : '',
    ].filter(Boolean).join('; ');
    body.append(text, result);
    step.append(number, body);
    steps.push(step);
  }
  repairCalcSteps.replaceChildren(...steps);
  renderRepairSpares(state, done);
}

function renderRepairSpares(state, done) {
  const breakdowns = expectedBreakdowns(repairPlan?.cleanings ?? 0);
  const devices = cleanerDevices(techItems());
  repairSpares.classList.toggle('is-locked', !done);
  repairSpares.replaceChildren(...devices.map((device) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'repair-spare';
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-checked', String(repairSpareId === device.id));
    button.disabled = !done;
    const image = document.createElement('img');
    image.src = repairSprite(device);
    image.alt = '';
    const title = document.createElement('strong');
    title.textContent = device.title;
    const today = document.createElement('span');
    today.className = 'repair-spare-price';
    today.textContent = `сегодня ${formatCoins(Number(device.price) || 0)}`;
    const total = document.createElement('span');
    total.className = 'repair-spare-total';
    total.textContent = done ? `к победе ≈ ${formatCoins(spareCost(device, breakdowns))}` : 'к победе: посчитай';
    button.append(image, title, today, total);
    button.addEventListener('click', () => {
      repairSpareId = device.id;
      renderRepairSpares(deriveRoomState(readProfileRecords(getUserProfileId())), repairCalcDone());
    });
    return button;
  }));

  const choice = devices.find((device) => device.id === repairSpareId) ?? null;
  const price = Number(choice?.price) || 0;
  const pocket = Math.max(0, state.pocket);
  const savings = Math.max(0, state.savings);
  let text = `В кармане ${formatCoins(pocket)} · в копилке ${formatCoins(savings)}`;
  if (!done) text = 'Сначала посчитай вместе с ментором';
  else if (!choice) text = `Выбери запаску · ${text}`;
  else if (price > pocket + savings) text = `На «${choice.title}» не хватает даже с копилкой`;
  else if (price > pocket) text = `Не хватит ${formatCoins(price - pocket)} — доберём из копилки`;
  repairStatus.textContent = text;
  repairNext.disabled = !done || !choice || price > pocket + savings;
}

function answerRepairQuestion(question, option) {
  const episode = activeRepairEpisode;
  if (!episode) return;
  const { day } = deriveRoomState(readProfileRecords(getUserProfileId()));
  logDecision(option.right, {
    episode: REPAIR_CONTENT,
    'Название эпизода': episode.title,
    'Идентификатор эпизода': episode.id,
    'Шаг': 'Расчёт запаски',
    'Вопрос': question.question,
    'Ответ': option.value,
    'Верный ответ': question.answer,
    'Игровой день': day,
    explanation: option.right ? question.solved : `Игрок ответил ${option.value} вместо ${question.answer}.`,
  });
  if (!option.right) {
    showMentor(option.slip, {
      title: episode.title,
      extra: `Твой ответ: ${question.unit(option.value)} · подсказка: ${question.hint}`,
      closeLabel: 'Посчитать ещё раз <span aria-hidden="true">↺</span>',
    });
    return;
  }
  repairAnswers[question.key] = option.value;
  renderRepairSpare();
  if (repairCalcDone()) repairSpares.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function repairSpareExtra(choice, right, breakdowns) {
  const cost = (device) => formatCoins(spareCost(device, breakdowns));
  const cheap = repairCheapDevice();
  const reliable = techItems().find((item) => item.id === RIGHT_CLEANER_ID);
  const parts = [cheap, reliable].filter(Boolean).map((device) => `«${device.title}» ≈ ${cost(device)}`);
  if (choice.id !== cheap?.id && choice.id !== reliable?.id) parts.push(`«${choice.title}» = ${cost(choice)}`);
  return `К победе: ${parts.join(' · ')}`;
}

function submitRepairSpare() {
  const episode = activeRepairEpisode;
  if (!episode || !repairPlan || !repairCalcDone()) return;
  const records = readProfileRecords(getUserProfileId());
  const state = deriveRoomState(records);
  const devices = cleanerDevices(techItems());
  const choice = devices.find((device) => device.id === repairSpareId);
  if (!choice) return;
  const breakdowns = expectedBreakdowns(repairPlan.cleanings);
  const right = rightSpare(devices, breakdowns, Math.max(0, state.pocket) + Math.max(0, state.savings));
  const verdict = spareVerdict(choice, right);
  logDecision(verdict.right, {
    episode: REPAIR_CONTENT,
    'Название эпизода': episode.title,
    'Идентификатор эпизода': episode.id,
    'Шаг': 'Выбор запаски',
    'Запаска': choice.title,
    'Идентификатор товара': choice.id,
    'Цена': Number(choice.price) || 0,
    'Стоимость к победе': spareCost(choice, breakdowns),
    'Выгодная запаска': right?.title ?? null,
    'Чисток до победы': repairPlan.cleanings,
    'Поломок в среднем': breakdowns,
    'Игровой день': state.day,
    explanation: verdict.right
      ? `Выбрана запаска, которая в среднем дешевле всего обойдётся к победе: ${formatCoins(spareCost(choice, breakdowns))}.`
      : `«${choice.title}» к победе обойдётся в ${formatCoins(spareCost(choice, breakdowns))}, а «${right?.title}» — в ${formatCoins(spareCost(right, breakdowns))}. Ментор отменил покупку.`,
  });
  if (!verdict.right) {
    showMentor(verdict.trigger, {
      title: episode.title,
      extra: repairSpareExtra(choice, right, breakdowns),
      closeLabel: 'Выбрать другую <span aria-hidden="true">↺</span>',
    });
    return;
  }
  const fromSavings = buyRepairSpare(choice, breakdowns);
  const savingsNote = fromSavings > 0 ? ` · из копилки ${formatCoins(fromSavings)}` : '';
  showMentor(verdict.trigger, {
    title: episode.title,
    extra: `Куплено: «${choice.title}» за ${formatCoins(Number(choice.price) || 0)}${savingsNote}`,
    closeLabel: 'Чистить козявки <span aria-hidden="true">🤧</span>',
    afterClose: () => startRepairCleaning(choice),
  });
}

// The spare is bought like any device in the technique store; what the pocket lacks comes from the
// piggy bank first. The completion record goes with the money, so a reload cannot buy it twice.
// Returns how many coins came from the piggy bank.
function buyRepairSpare(device, breakdowns) {
  const episode = activeRepairEpisode;
  const profileId = getUserProfileId();
  const records = readProfileRecords(profileId);
  const state = deriveRoomState(records);
  const { day } = state;
  if (isEconomicEpisodeCompleted(records, episode)) return 0;
  const total = Number(device.price) || 0;
  const purpose = `Запасная ковырялка «${device.title}»`;
  const fromSavings = tennisEstimateSavingsPart(total, state) ?? 0;
  if (fromSavings > 0) {
    logEpisode(SAVINGS_TRANSFER_EPISODE, { 'Игровой день': day });
    appendProfileRecord({
      'Тип события': POCKET_TOPUP_EVENT,
      'Профиль пользователя': profileId,
      'Значение': fromSavings,
      'Назначение': `${purpose}: не хватило карманных денег`,
      'Игровой день': day,
    });
    appendProfileRecord({
      'Тип события': SAVINGS_TOPUP_EVENT,
      'Профиль пользователя': profileId,
      'Значение': -fromSavings,
      'Назначение': `${purpose}: не хватило карманных денег`,
      'Игровой день': day,
    });
    appendSavingsWithdrawalFact(records, fromSavings, { 'Назначение': purpose, 'Игровой день': day });
  }
  appendProfileRecord({
    'Тип события': POCKET_SPENDING_EVENT,
    'Профиль пользователя': profileId,
    'Значение': total,
    'Назначение': `Покупка «${device.title}» × 1`,
    'Идентификатор эпизода': episode.id,
    'Игровой день': day,
  });
  appendProfileRecord({
    'Тип события': GOODS_PURCHASE_EVENT,
    'Профиль пользователя': profileId,
    'Магазин': TECH_STORE_TITLE,
    'Товар': device.title,
    'Идентификатор товара': device.id,
    'Категория': device.category,
    'Количество': 1,
    'Цена': total,
    'Стоимость': total,
    'Назначение': 'Запасная ковырялка, пока основная в ремонте',
    'Идентификатор эпизода': episode.id,
    'Игровой день': day,
  });
  const change = inventoryChange(device, 1);
  appendProfileRecord({
    'Тип события': INVENTORY_CHANGE_EVENT,
    'Тип инвентаря': change.id,
    'Количество': change.amount,
    'Единица измерения': inventoryUnit(device),
    'Профиль пользователя': profileId,
  });
  appendProfileRecord({
    'Тип события': POCKET_TOPUP_EVENT,
    'Профиль пользователя': profileId,
    'Значение': -total,
    'Назначение': `Покупка «${device.title}» × 1`,
    'Идентификатор эпизода': episode.id,
    'Игровой день': day,
  });
  appendBudgetFact(records, REQUIRED_ARTICLE, total, {
    'Назначение': purpose,
    'Идентификатор эпизода': episode.id,
    'Игровой день': day,
  });
  appendProfileRecord({
    'Тип события': ECONOMIC_EPISODE_COMPLETED_EVENT,
    'Профиль пользователя': profileId,
    'Идентификатор эпизода': episode.id,
    'Название эпизода': episode.title,
    'Результат': `В ремонте: «${repairBrokenDevice?.title ?? '—'}». Куплена запаска «${device.title}»`,
    'Сломанный прибор': repairBrokenDevice?.title ?? null,
    'Запасной прибор': device.title,
    'Стоимость запаски': total,
    'Из копилки': fromSavings,
    'Обещание в бюджет': repairPlan?.promise ?? null,
    'День победы': repairPlan?.forecast.victoryDay ?? null,
    'Чисток до победы': repairPlan?.cleanings ?? null,
    'Поломок в среднем': breakdowns,
    'Ошибочных попыток': repairEpisodeRecords(records, WRONG_DECISION_EVENT).length,
    'Правильное решение': true,
    'Игровой день': day,
  });
  return fromSavings;
}

// --- Поломки после эпизода: каждая пятая чистка ---

// From the day after episode 352 the device the player picks up breaks in one cleaning out of five,
// as the mentor's arithmetic assumed. It only happens while another piece can take over, so the
// player is never left without a cleaner; a spare Козилетт may still need a cartridge from the shop.
// The roll is seeded by profile and day, so a reload cannot change it. Returns true when the device
// broke and the mentor has taken over.
function maybeBreakCleaner(state, records, pick) {
  const breakdown = breakCleanerIfDue(state, records, pick);
  if (!breakdown) return false;
  const { device, returnDay, spare } = breakdown;
  const broken = `«${device.title}» в ремонте до ${returnDay}-го дня`;
  if (spare?.device && spare.left > 0) {
    showMentor('repair-breakdown-spare', {
      title: REPAIR_EPISODE_TITLE,
      extra: `${broken} · чистим запасной «${spare.device.title}»`,
      closeLabel: 'Чистить запаской <span aria-hidden="true">🤧</span>',
      afterClose: () => enterCleaning(spare.device),
    });
  } else {
    showMentor('repair-breakdown-no-cartridge', {
      title: REPAIR_EPISODE_TITLE,
      extra: `${broken} · для «${spare?.device?.title ?? 'запаски'}» нет картриджей`,
      closeLabel: 'Понятно <span aria-hidden="true">✓</span>',
    });
  }
  return true;
}

// The breakdown itself, shared with the automatic cleaning of the final part: when today's roll
// says so, the picked device goes to the service centre. Returns the broken device, the day it
// comes back and the spare that takes over (see cleaningDevice), or null when nothing broke.
function breakCleanerIfDue(state, records, pick) {
  const profileId = getUserProfileId();
  const episodeDone = records.find((record) => record?.['Тип события'] === ECONOMIC_EPISODE_COMPLETED_EVENT
    && Number(record['Идентификатор эпизода']) === REPAIR_EPISODE_ID);
  if (!episodeDone || !(Number(episodeDone['Игровой день']) < state.day)) return null;
  const brokeToday = records.some((record) => record?.['Тип события'] === DEVICE_REPAIR_EVENT
    && Number(record['Игровой день']) === state.day);
  if (brokeToday) return null;
  const available = cleanerDevices(techItems()).reduce((sum, device) => (
    sum + Math.max(0, (state.inventory.get(device.id) ?? 0) - (state.devicesInRepair.get(device.id)?.count ?? 0))
  ), 0);
  if (available < 2 || !breaksToday(profileId, state.day)) return null;

  const device = pick.device;
  const returnDay = repairReturnDay(state.day);
  appendProfileRecord({
    'Тип события': DEVICE_REPAIR_EVENT,
    'Профиль пользователя': profileId,
    'Прибор': device.id,
    'Название прибора': device.title,
    'Неисправность': BREAKDOWNS[device.id] ?? null,
    'Причина': 'Поломка при чистке',
    'Ремонт': 'Гарантийный',
    'Стоимость ремонта': 0,
    [REPAIR_RETURN_DAY_FIELD]: returnDay,
    'Игровой день': state.day,
  });
  const after = readProfileRecords(profileId);
  const spare = cleaningDevice(deriveRoomState(after), techItems(), (item) => usedCleanings(after, item));
  return { device, returnDay, spare };
}

// Straight from the purchase into the ear cleaning, with the new spare in hand.
function startRepairCleaning(device) {
  finishRepairTutorial();
  activeRepairEpisode = null;
  enterCleaning(device);
}

function submitRepairStage() {
  if (!activeRepairEpisode || repairNext.disabled) return;
  if (repairStage === 'broken') handInRepairDevice();
  else if (repairStage === 'forecast') submitRepairForecast();
  else if (repairStage === 'spare') submitRepairSpare();
}

repairNext.addEventListener('click', submitRepairStage);
repairLeave.addEventListener('click', returnFromRepair);
for (const button of repairPromiseModes) {
  button.addEventListener('click', () => setRepairPromiseMode(button.dataset.promiseMode));
}
repairPromiseDown.addEventListener('click', () => changeRepairPromise(repairPromise - 1));
repairPromiseUp.addEventListener('click', () => changeRepairPromise(repairPromise + 1));
repairPromiseRange.addEventListener('input', () => changeRepairPromise(Number(repairPromiseRange.value)));

// --- Туториал эпизода с поломкой ---

function repairTutorialRows(title) {
  return dataMartRows
    .filter((row) => row?.object_type === REPAIR_TUTORIAL_OBJECT_TYPE && row.title === title)
    .sort((left, right) => (Number(left.queue) || 0) - (Number(right.queue) || 0));
}

function repairTutorialWasSeen(title) {
  return readProfileRecords(getUserProfileId()).some((record) => (
    record?.['Тип события'] === REPAIR_TUTORIAL_SEEN_EVENT && record['Туториал'] === title
  ));
}

function maybeStartRepairTutorial(title) {
  const steps = repairTutorialRows(title);
  if (!steps.length || repairTutorialWasSeen(title)) return false;
  repairTutorialSteps = steps;
  repairTutorialTitle = title;
  repairTutorialIndex = 0;
  repairScreen.classList.add('is-touring');
  setHidden(repairTutorialLayer, false);
  renderRepairTutorialStep();
  repairTutorialNext.focus({ preventScroll: true });
  return true;
}

function repairTutorialTarget() {
  const target = repairTutorialSteps[repairTutorialIndex]?.screen_area?.target;
  return target ? repairScreen.querySelector(`[data-repair-target="${CSS.escape(String(target))}"]`) : null;
}

function positionRepairTutorialFocus() {
  const target = repairTutorialTarget();
  repairTutorialFocus.hidden = !target || target.offsetParent === null;
  if (repairTutorialFocus.hidden) return;
  const layerRect = repairTutorialLayer.getBoundingClientRect();
  // Cards sit inside the scrolling body: only their visible part is outlined.
  const box = target.getBoundingClientRect();
  const body = target.closest('.repair-body');
  const clip = body && body !== target ? body.getBoundingClientRect() : null;
  const top = clip ? Math.max(box.top, clip.top) : box.top;
  const bottom = clip ? Math.min(box.bottom, clip.bottom) : box.bottom;
  const radius = Number.parseFloat(getComputedStyle(target).borderTopLeftRadius) || 12;
  repairTutorialFocus.style.left = `${box.left - layerRect.left - REPAIR_FOCUS_PADDING}px`;
  repairTutorialFocus.style.top = `${top - layerRect.top - REPAIR_FOCUS_PADDING}px`;
  repairTutorialFocus.style.width = `${box.width + REPAIR_FOCUS_PADDING * 2}px`;
  repairTutorialFocus.style.height = `${Math.max(0, bottom - top) + REPAIR_FOCUS_PADDING * 2}px`;
  repairTutorialFocus.style.borderRadius = `${radius + REPAIR_FOCUS_PADDING}px`;
}

// The card goes where the data mart row says, unless it would cover the very thing it talks about:
// then it moves to the other edge of the screen.
function placeRepairTutorialCard(preferred) {
  repairTutorialTarget()?.scrollIntoView({ block: 'nearest' });
  const target = repairTutorialTarget();
  const card = repairTutorialLayer.querySelector('.tutorial-card');
  const overlap = (placement) => {
    repairTutorialLayer.dataset.placement = placement;
    if (!target || target.offsetParent === null) return 0;
    const box = target.getBoundingClientRect();
    // Offsets, not the rect: the card pops in with a scale animation.
    const top = repairTutorialLayer.getBoundingClientRect().top + card.offsetTop;
    const bottom = top + card.offsetHeight;
    return Math.max(0, Math.min(box.bottom, bottom) - Math.max(box.top, top) + REPAIR_FOCUS_PADDING);
  };
  const other = preferred === 'top' ? 'bottom' : 'top';
  const first = overlap(preferred);
  if (first > 0 && overlap(other) >= first) repairTutorialLayer.dataset.placement = preferred;
  // On a short screen neither edge may be free: the body scrolls the target away from the card.
  const placement = repairTutorialLayer.dataset.placement;
  if (target && overlap(placement) > 0) {
    target.scrollIntoView({ block: placement === 'top' ? 'end' : 'start' });
    overlap(placement);
  }
}

function stopRepairTutorialVoice() {
  repairTutorialAudio.pause();
  repairTutorialAudio.removeAttribute('src');
  repairTutorialAudio.load();
  repairTutorialVoicePlaying = false;
  updateMusicFade();
}

function playRepairTutorialVoice(step) {
  stopRepairTutorialVoice();
  if (!step?.audio) return;
  repairTutorialAudio.src = publicAssetPath(step.audio_folder, step.audio, 'audio/repair_tutorial');
  repairTutorialAudio.volume = 1;
  repairTutorialAudio.muted = muted;
  repairTutorialAudio.play()
    .then(() => {
      repairTutorialVoicePlaying = true;
      updateMusicFade();
    })
    .catch((error) => {
      repairTutorialVoicePlaying = false;
      updateMusicFade();
      console.info(`Озвучка шага ${step.queue ?? repairTutorialIndex + 1} туториала поломки пока недоступна.`, error);
    });
}

repairTutorialAudio.addEventListener('ended', () => {
  repairTutorialVoicePlaying = false;
  updateMusicFade();
});

repairTutorialAudio.addEventListener('error', () => {
  if (!repairTutorialAudio.getAttribute('src')) return;
  repairTutorialVoicePlaying = false;
  updateMusicFade();
  console.warn('Не удалось загрузить озвучку туториала поломки:', repairTutorialAudio.currentSrc);
});

function renderRepairTutorialStep() {
  const step = repairTutorialSteps[repairTutorialIndex];
  if (!step) return finishRepairTutorial();
  const last = repairTutorialIndex === repairTutorialSteps.length - 1;
  repairTutorialProgress.textContent = `ШАГ ${repairTutorialIndex + 1} ИЗ ${repairTutorialSteps.length}`;
  repairTutorialText.textContent = String(step.text || '');
  repairTutorialBack.disabled = repairTutorialIndex === 0;
  repairTutorialNext.innerHTML = last
    ? 'Понятно! <span aria-hidden="true">✓</span>'
    : 'Дальше <span aria-hidden="true">→</span>';
  // Placed once the text is in: the height of the card depends on it.
  placeRepairTutorialCard(step.screen_area?.message_placement || 'bottom');
  requestAnimationFrame(positionRepairTutorialFocus);
  playRepairTutorialVoice(step);
}

function finishRepairTutorial({ skipped = false } = {}) {
  if (repairTutorialLayer.classList.contains('is-hidden')) return;
  stopRepairTutorialVoice();
  if (repairTutorialTitle && !repairTutorialWasSeen(repairTutorialTitle)) {
    appendProfileRecord({
      'Тип события': REPAIR_TUTORIAL_SEEN_EVENT,
      'Профиль пользователя': getUserProfileId(),
      'Идентификатор эпизода': activeRepairEpisode?.id ?? REPAIR_EPISODE_ID,
      'Туториал': repairTutorialTitle,
      'Игровой день': deriveRoomState(readProfileRecords(getUserProfileId())).day,
      'Пропущен': skipped,
    });
  }
  setHidden(repairTutorialLayer, true);
  repairScreen.classList.remove('is-touring');
  repairTutorialFocus.hidden = true;
  repairBodies.find((body) => !body.hidden)?.scrollTo?.(0, 0);
  repairNext.focus({ preventScroll: true });
}

repairTutorialNext.addEventListener('click', () => {
  if (repairTutorialIndex >= repairTutorialSteps.length - 1) return finishRepairTutorial();
  repairTutorialIndex += 1;
  renderRepairTutorialStep();
});
repairTutorialBack.addEventListener('click', () => {
  if (repairTutorialIndex === 0) return;
  repairTutorialIndex -= 1;
  renderRepairTutorialStep();
});
repairTutorialSkip.addEventListener('click', () => finishRepairTutorial({ skipped: true }));
for (const body of repairBodies) {
  body.addEventListener('scroll', () => {
    if (!repairTutorialLayer.classList.contains('is-hidden')) positionRepairTutorialFocus();
  });
}
window.addEventListener('resize', () => {
  if (!repairTutorialLayer.classList.contains('is-hidden')) positionRepairTutorialFocus();
});

// --- Piggy bank ---------------------------------------------------------------

const SAVINGS_TRANSFER_EPISODE = 'Перекладывание накоплений на счет для текущих расходов';
const roomWallet = $('#room-wallet');
const roomTransferLayer = $('#room-transfer-layer');
const roomTransferClose = $('#room-transfer-close');
const roomTransferSavings = $('#room-transfer-savings');
const roomTransferSavingsNow = $('#room-transfer-savings-now');
const roomTransferPocket = $('#room-transfer-pocket');
const roomTransferPocketNow = $('#room-transfer-pocket-now');
const roomTransferMinus = $('#room-transfer-minus');
const roomTransferValue = $('#room-transfer-value');
const roomTransferPlus = $('#room-transfer-plus');
const roomTransferRange = $('#room-transfer-range');
const roomTransferEmpty = $('#room-transfer-empty');
const roomTransferSubmit = $('#room-transfer-submit');
// Balances at the moment the card opened; the card shows what they become after the move.
let transferBalances = { pocket: 0, savings: 0 };

function transferAmount() {
  return Math.max(0, Math.min(transferBalances.savings, Math.round(Number(roomTransferRange.value)) || 0));
}

function renderSavingsTransfer() {
  const { pocket, savings } = transferBalances;
  const amount = transferAmount();
  roomTransferSavings.textContent = formatCoins(savings - amount);
  roomTransferPocket.textContent = formatCoins(pocket + amount);
  roomTransferSavingsNow.textContent = `сейчас ${formatCoins(savings)}`;
  roomTransferPocketNow.textContent = `сейчас ${formatCoins(pocket)}`;
  roomTransferValue.textContent = formatCoins(amount);
  roomTransferMinus.disabled = amount <= 0;
  roomTransferPlus.disabled = amount >= savings;
  roomTransferRange.disabled = savings <= 0;
  roomTransferEmpty.hidden = savings > 0;
  roomTransferSubmit.disabled = amount <= 0;
  roomTransferSubmit.textContent = amount > 0 ? `Переложить ${formatCoins(amount)}` : 'Выбери сумму';
}

function setTransferAmount(amount) {
  roomTransferRange.value = String(Math.max(0, Math.min(transferBalances.savings, amount)));
  renderSavingsTransfer();
}

// `amount` presets the slider, e.g. to the coins the player was short of in the park.
function openSavingsTransfer({ amount = 0 } = {}) {
  closeRoomAction();
  hideRoomMessage();
  closeRoomInbox();
  const { pocket, savings } = deriveRoomState(readProfileRecords(getUserProfileId()));
  transferBalances = { pocket, savings: Math.max(0, savings) };
  roomTransferRange.max = String(transferBalances.savings);
  roomTransferRange.value = String(Math.max(0, Math.min(transferBalances.savings, Math.round(amount) || 0)));
  renderSavingsTransfer();
  roomTransferLayer.hidden = false;
  (transferBalances.savings > 0 ? roomTransferRange : roomTransferClose).focus({ preventScroll: true });
}

function closeSavingsTransfer() {
  roomTransferLayer.hidden = true;
}

// The analytics log gets three records: the episode, the coins arriving in the pocket,
// and the same coins leaving the piggy bank as a negative top-up.
function transferSavingsToPocket() {
  const amount = transferAmount();
  const profileId = getUserProfileId();
  const records = readProfileRecords(profileId);
  const { day, savings } = deriveRoomState(records);
  if (amount <= 0 || amount > savings) {
    renderSavingsTransfer();
    return;
  }

  closeSavingsTransfer();
  logEpisode(SAVINGS_TRANSFER_EPISODE, { 'Игровой день': day });
  appendProfileRecord({
    'Тип события': POCKET_TOPUP_EVENT,
    'Профиль пользователя': profileId,
    'Значение': amount,
    'Игровой день': day,
  });
  appendProfileRecord({
    'Тип события': SAVINGS_TOPUP_EVENT,
    'Профиль пользователя': profileId,
    'Значение': -amount,
    'Игровой день': day,
  });
  appendSavingsWithdrawalFact(records, amount, { 'Назначение': 'Перекладывание накоплений в карман', 'Игровой день': day });
  showRoomMessage(`${formatCoins(amount)} теперь в кармане`);
  roomWallet.focus({ preventScroll: true });
}

roomWallet.addEventListener('click', () => openSavingsTransfer());
roomWallet.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  openSavingsTransfer();
});
roomTransferRange.addEventListener('input', renderSavingsTransfer);
roomTransferMinus.addEventListener('click', () => setTransferAmount(transferAmount() - 1));
roomTransferPlus.addEventListener('click', () => setTransferAmount(transferAmount() + 1));
roomTransferSubmit.addEventListener('click', transferSavingsToPocket);
roomTransferClose.addEventListener('click', () => {
  closeSavingsTransfer();
  roomWallet.focus({ preventScroll: true });
});
roomTransferLayer.addEventListener('click', (event) => {
  if (event.target === roomTransferLayer) closeSavingsTransfer();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !finishScreen.hidden && !roomTransferLayer.hidden
    && piggyTutorialLayer.classList.contains('is-hidden')) closeSavingsTransfer();
});

// --- Room messages --------------------------------------------------------

const MESSAGE_FOCUS_PADDING = 6;
const MESSAGE_BAR_GAP = 10;

// Keeps the bottom of the message card just above the bar with the action icons.
function positionRoomMessageCard() {
  const screenRect = finishScreen.getBoundingClientRect();
  const barTop = roomBottomBar.getBoundingClientRect().top;
  const bottom = Math.max(0, screenRect.bottom - barTop) + MESSAGE_BAR_GAP;
  roomMessageLayer.style.setProperty('--room-message-bottom', `${bottom}px`);
}

const dataMartMessages = (Array.isArray(dataMartRows) ? dataMartRows : [])
  .filter((row) => row?.object_type === MESSAGE_OBJECT_TYPE)
  .sort((left, right) => (Number(left.queue) || 0) - (Number(right.queue) || 0) || Number(left.id) - Number(right.id));

dataMartMessages
  .filter((message) => !MESSAGE_TRIGGERS[message.trigger])
  .forEach((message) => console.warn(`Сообщение ${message.id}: неизвестный триггер «${message.trigger}», оно не будет отправляться.`));

const roomMessageLayer = $('#room-message-layer');
const roomMessageFocus = $('#room-message-focus');
const roomMessageTextBox = $('#room-message-text-box');
const roomMessageText = $('#room-message-text');
const roomMessageRepeat = $('#room-message-repeat');
const roomMessageClose = $('#room-message-close');
const roomInboxLayer = $('#room-inbox-layer');
const roomInboxList = $('#room-inbox-list');
const roomInboxEmpty = $('#room-inbox-empty');
const roomInboxClose = $('#room-inbox-close');
const roomMessagesButton = $('[data-room-action="messages"]');
const roomMessagesBadge = $('#room-messages-badge');
let shownRoomMessage = null;
let pendingRoomMessages = [];
let reopenInboxAfterMessage = false;
let deliveringRoomMessages = false;
const messageReplayCheckedProfiles = new Set();

function replayMessagesOnEntry() {
  if (!isRoomInteractive()) return;
  const profileId = getUserProfileId();
  if (messageReplayCheckedProfiles.has(profileId)) return;
  messageReplayCheckedProfiles.add(profileId);
  for (const receipt of messagesToReplayOnEntry(readProfileRecords(profileId))) {
    const message = findReceiptMessage(receipt);
    if (message) playRoomMessage(message);
  }
}

function renderMessagesBadge(records) {
  const unread = messageReceipts(records).filter((receipt) => receipt.unread).length;
  roomMessagesBadge.hidden = unread === 0;
  roomMessagesBadge.textContent = unread > 9 ? '9+' : String(unread);
  roomMessagesButton.setAttribute('aria-label', unread ? `Сообщения, новых: ${unread}` : 'Сообщения');
}

function findReceiptMessage(receipt) {
  return dataMartMessages.find((message) => String(message.id) === String(receipt.messageId))
    ?? dataMartMessages.find((message) => message.trigger === receipt.trigger);
}

// While a new day is being written or its tutorial is open, messages wait.
function isRoomInteractive() {
  return !finishScreen.hidden && Boolean(roomController?.active) && roomLoading.classList.contains('is-hidden')
    && !startingNewDay && dayTutorialLayer.classList.contains('is-hidden')
    && piggyTutorialLayer.classList.contains('is-hidden') && taskTutorialLayer.classList.contains('is-hidden')
    && !fatherEpisodeRunning && !routeEpisodeRunning && !isFinalPartBusy();
}

// Records every due message first, then shows it right away only on the first receipt
// for its trigger; repeated receipts just raise the counter on the "Messages" icon.
function deliverTriggeredMessages() {
  if (deliveringRoomMessages || !isRoomInteractive()) return;
  deliveringRoomMessages = true;
  try {
    const profileId = getUserProfileId();
    const records = readProfileRecords(profileId);
    const { day } = deriveRoomState(records);
    for (const message of dueMessages(dataMartMessages, records)) {
      const updatedRecords = appendProfileRecord({
        'Тип события': MESSAGE_RECEIVED_EVENT,
        'Профиль пользователя': profileId,
        'Триггер': message.trigger,
        'Идентификатор сообщения': message.id,
        'Игровой день': day,
        'Время получения': new Date().toISOString(),
      });
      const [latestReceipt] = messageReceipts(updatedRecords);
      if (latestReceipt?.first) playRoomMessage(message);
    }
  } finally {
    deliveringRoomMessages = false;
  }
}

function findRoomTarget(name) {
  if (!name) return null;
  const key = CSS.escape(String(name));
  return finishScreen.querySelector(`[data-room-target="${key}"], [data-room-action="${key}"]`);
}

function positionRoomMessageFocus() {
  const target = findRoomTarget(shownRoomMessage?.screen_area?.target);
  roomMessageFocus.hidden = !target;
  roomMessageLayer.classList.toggle('has-focus', Boolean(target));
  if (!target) return;

  const layerRect = roomMessageLayer.getBoundingClientRect();
  const rect = target.getBoundingClientRect();
  const radius = Number.parseFloat(getComputedStyle(target).borderTopLeftRadius) || 12;
  roomMessageFocus.style.left = `${rect.left - layerRect.left - MESSAGE_FOCUS_PADDING}px`;
  roomMessageFocus.style.top = `${rect.top - layerRect.top - MESSAGE_FOCUS_PADDING}px`;
  roomMessageFocus.style.width = `${rect.width + MESSAGE_FOCUS_PADDING * 2}px`;
  roomMessageFocus.style.height = `${rect.height + MESSAGE_FOCUS_PADDING * 2}px`;
  roomMessageFocus.style.borderRadius = `${radius + MESSAGE_FOCUS_PADDING}px`;
}

// The card is capped in height; the font shrinks until the whole text fits. Scrolling is
// only a last resort for a text too long even at the smallest size.
function fitRoomMessageText() {
  if (roomMessageLayer.hidden) return;
  const overflows = () => roomMessageTextBox.scrollHeight > roomMessageTextBox.clientHeight + 1;
  const appHeight = app.getBoundingClientRect().height;
  let size = Math.min(22, Math.max(15, appHeight * 0.026));

  roomMessageTextBox.classList.remove('is-scrollable');
  roomMessageText.style.fontSize = `${size}px`;
  while (size > 10 && overflows()) {
    size -= 0.5;
    roomMessageText.style.fontSize = `${size}px`;
  }
  roomMessageTextBox.classList.toggle('is-scrollable', overflows());
}

function stopMessageVoice() {
  messageAudio.pause();
  messageAudio.removeAttribute('src');
  messageAudio.load();
  messageVoicePlaying = false;
  updateMusicFade();
}

function playMessageVoice(message) {
  stopMessageVoice();
  if (!message?.audio) return;

  messageAudio.src = publicAssetPath(message.audio_folder, message.audio, 'audio/messages');
  messageAudio.volume = 1;
  messageAudio.muted = muted;
  messageAudio.play()
    .then(() => {
      messageVoicePlaying = true;
      updateMusicFade();
    })
    .catch((error) => {
      messageVoicePlaying = false;
      updateMusicFade();
      console.info(`Озвучка сообщения ${message.id} пока недоступна.`, error);
    });
}

messageAudio.addEventListener('ended', () => {
  messageVoicePlaying = false;
  updateMusicFade();
});

messageAudio.addEventListener('error', () => {
  if (!messageAudio.getAttribute('src')) return;
  messageVoicePlaying = false;
  updateMusicFade();
  console.warn('Не удалось загрузить озвучку сообщения:', messageAudio.currentSrc);
});

function playRoomMessage(message) {
  if (shownRoomMessage) {
    pendingRoomMessages.push(message);
    return;
  }
  closeRoomAction();
  hideRoomMessage();
  shownRoomMessage = message;
  roomMessageLayer.dataset.placement = message.screen_area?.message_placement || 'center';
  roomMessageText.textContent = String(message.text || '');
  roomMessageLayer.hidden = false;
  positionRoomMessageCard();
  positionRoomMessageFocus();
  fitRoomMessageText();
  playMessageVoice(message);
  roomMessageClose.focus({ preventScroll: true });
}

function closeRoomMessagePlayback() {
  if (!shownRoomMessage) return;
  stopMessageVoice();
  shownRoomMessage = null;
  roomMessageLayer.hidden = true;

  const next = pendingRoomMessages.shift();
  if (next) {
    playRoomMessage(next);
    return;
  }
  if (reopenInboxAfterMessage) {
    reopenInboxAfterMessage = false;
    openRoomInbox();
  }
}

function renderInboxItem(receipt, message) {
  const item = document.createElement('li');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'room-inbox-item';
  button.classList.toggle('is-unread', receipt.unread);

  const meta = document.createElement('span');
  meta.className = 'room-inbox-meta';
  meta.textContent = Number.isFinite(receipt.day) ? `День ${receipt.day}` : 'Сообщение';
  if (receipt.unread) {
    const badge = document.createElement('b');
    badge.textContent = 'новое';
    meta.append(badge);
  }

  const text = document.createElement('span');
  text.className = 'room-inbox-text';
  text.textContent = String(message.text || '');

  const play = document.createElement('span');
  play.className = 'room-inbox-play';
  play.setAttribute('aria-hidden', 'true');
  play.textContent = '▶';

  button.append(meta, text, play);
  button.addEventListener('click', () => {
    closeRoomInbox();
    reopenInboxAfterMessage = true;
    playRoomMessage(message);
  });
  item.append(button);
  return item;
}

function openRoomInbox() {
  closeRoomAction();
  hideRoomMessage();
  const profileId = getUserProfileId();
  const receipts = messageReceipts(readProfileRecords(profileId))
    .map((receipt) => [receipt, findReceiptMessage(receipt)])
    .filter(([, message]) => message);

  roomInboxList.replaceChildren(...receipts.map(([receipt, message]) => renderInboxItem(receipt, message)));
  roomInboxEmpty.hidden = receipts.length > 0;
  roomInboxLayer.hidden = false;
  roomInboxList.scrollTop = 0;
  roomInboxClose.focus({ preventScroll: true });

  if (receipts.some(([receipt]) => receipt.unread)) {
    appendProfileRecord({ 'Тип события': MESSAGES_OPENED_EVENT, 'Профиль пользователя': profileId });
  }
}

function closeRoomInbox() {
  roomInboxLayer.hidden = true;
}

roomMessageRepeat.addEventListener('click', () => playMessageVoice(shownRoomMessage));
roomMessageClose.addEventListener('click', closeRoomMessagePlayback);
// The control a message points at stays usable: pressing it closes the message and presses the control.
roomMessageLayer.addEventListener('click', (event) => {
  if (roomMessageFocus.hidden || event.target.closest('.room-message-card')) return;
  const focus = roomMessageFocus.getBoundingClientRect();
  if (event.clientX < focus.left || event.clientX > focus.right || event.clientY < focus.top || event.clientY > focus.bottom) return;
  const target = findRoomTarget(shownRoomMessage?.screen_area?.target);
  closeRoomMessagePlayback();
  if (target && !shownRoomMessage) target.click();
});
roomInboxClose.addEventListener('click', () => {
  closeRoomInbox();
  roomMessagesButton.focus({ preventScroll: true });
});
roomInboxLayer.addEventListener('click', (event) => {
  if (event.target === roomInboxLayer) closeRoomInbox();
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || finishScreen.hidden) return;
  if (shownRoomMessage) closeRoomMessagePlayback();
  else if (!roomInboxLayer.hidden) closeRoomInbox();
});

window.addEventListener('resize', () => {
  if (!shownRoomMessage) return;
  positionRoomMessageCard();
  positionRoomMessageFocus();
  fitRoomMessageText();
});

// --- Game days --------------------------------------------------------------

const DAY_TUTORIAL_FOCUS_PADDING = 6;
const dayTutorialLayer = $('#day-tutorial-layer');
const dayTutorialFocus = $('#day-tutorial-focus');
const dayTutorialProgress = $('#day-tutorial-progress');
const dayTutorialText = $('#day-tutorial-text');
const dayTutorialBack = $('#day-tutorial-back');
const dayTutorialNext = $('#day-tutorial-next');
const dayTutorialSkip = $('#day-tutorial-skip');
let startingNewDay = false;
let dayTutorialSteps = [];
let dayTutorialIndex = 0;
let dayTutorialDay = 0;

// The green button under the icons, and the moon icon: the day ends, the next one starts with
// its record and every stat and state change it brings, and then the day's tutorial opens.
// The last day of a budget ends differently: first its review and the next budget, and the
// next day starts only when that budget is approved.
function startNextDay() {
  const records = readProfileRecords(getUserProfileId());
  const state = deriveRoomState(records);
  if (!isRoomInteractive() || !canFinishDay(state)) return;
  closeRoomAction();
  hideRoomMessage();
  const nextRound = budgetRoundAfterDay(state.day, records);
  if (nextRound) {
    openBudgetReview(nextRound);
    return;
  }
  const day = writeNextDay();
  switchToDayMusic(day);
  openRoomDay();
}

// Writes the records that start the next day and returns its number.
function writeNextDay() {
  const profileId = getUserProfileId();
  const state = deriveRoomState(readProfileRecords(profileId));
  startingNewDay = true;
  try {
    for (const record of newDayRecords(state, profileId)) appendProfileRecord(record);
  } finally {
    startingNewDay = false;
  }
  return state.day + 1;
}

// The track of the day from the data mart, or the usual room track when the day has none.
function dayMusicSource(day) {
  const music = dayMusic(day);
  if (!music) return MUSIC_TRACKS.room;
  // Every day track so far sits in the repository root, so an empty folder means the root too.
  const folder = String(music.audio_folder ?? '').trim().toLowerCase();
  if (folder && folder !== 'root') {
    return publicAssetPath(music.audio_folder, music.audio, 'audio/music');
  }
  const source = ROOT_AUDIO_URLS[`./${String(music.audio).trim()}`];
  if (source) return source;
  console.warn(`Музыка дня ${day}: в корне репозитория нет файла «${music.audio}», играет обычная музыка комнаты.`);
  return MUSIC_TRACKS.room;
}

// Fades from the current track into the day's one; nothing happens when it is already playing.
function switchToDayMusic(day) {
  switchBackgroundTrack(dayMusicSource(day)).catch((error) => {
    console.warn('Не удалось переключить музыку дня:', error);
  });
}

// A day opens with its tutorial, then an automatic start-of-day economic episode, and only then
// ordinary messages. A player who came home for the piggy bank gets its tutorial before the card.
function openRoomDay() {
  if (maybeFinishFinalGame()) return;
  if (maybeStartDayTutorial()) return;
  if (maybeStartFatherThanks()) return;
  if (maybeStartAutomaticEconomicEpisode()) return;
  if (maybeStartPiggyTutorial()) return;
  openPendingSavingsTransfer();
  if (maybeStartTaskTutorial()) return;
  replayMessagesOnEntry();
  deliverTriggeredMessages();
}

roomNextDayButton.addEventListener('click', startNextDay);

function stopDayTutorialVoice() {
  dayTutorialAudio.pause();
  dayTutorialAudio.removeAttribute('src');
  dayTutorialAudio.load();
  dayTutorialVoicePlaying = false;
  updateMusicFade();
}

function playDayTutorialVoice(step) {
  stopDayTutorialVoice();
  if (!step?.audio) return;

  dayTutorialAudio.src = publicAssetPath(step.audio_folder, step.audio, 'audio/new_day_tutorial');
  dayTutorialAudio.volume = 1;
  dayTutorialAudio.muted = muted;
  dayTutorialAudio.play()
    .then(() => {
      dayTutorialVoicePlaying = true;
      updateMusicFade();
    })
    .catch((error) => {
      dayTutorialVoicePlaying = false;
      updateMusicFade();
      console.info(`Озвучка шага ${step.queue ?? dayTutorialIndex + 1} туториала нового дня пока недоступна.`, error);
    });
}

dayTutorialAudio.addEventListener('ended', () => {
  dayTutorialVoicePlaying = false;
  updateMusicFade();
});

dayTutorialAudio.addEventListener('error', () => {
  if (!dayTutorialAudio.getAttribute('src')) return;
  dayTutorialVoicePlaying = false;
  updateMusicFade();
  console.warn('Не удалось загрузить озвучку туториала нового дня:', dayTutorialAudio.currentSrc);
});

function positionDayTutorialFocus() {
  const target = findRoomTarget(dayTutorialSteps[dayTutorialIndex]?.screen_area?.target);
  dayTutorialFocus.hidden = !target;
  if (!target) return;
  const layerRect = dayTutorialLayer.getBoundingClientRect();
  const rect = target.getBoundingClientRect();
  const radius = Number.parseFloat(getComputedStyle(target).borderTopLeftRadius) || 12;
  dayTutorialFocus.style.left = `${rect.left - layerRect.left - DAY_TUTORIAL_FOCUS_PADDING}px`;
  dayTutorialFocus.style.top = `${rect.top - layerRect.top - DAY_TUTORIAL_FOCUS_PADDING}px`;
  dayTutorialFocus.style.width = `${rect.width + DAY_TUTORIAL_FOCUS_PADDING * 2}px`;
  dayTutorialFocus.style.height = `${rect.height + DAY_TUTORIAL_FOCUS_PADDING * 2}px`;
  dayTutorialFocus.style.borderRadius = `${radius + DAY_TUTORIAL_FOCUS_PADDING}px`;
}

function renderDayTutorialStep() {
  const step = dayTutorialSteps[dayTutorialIndex];
  if (!step) return finishDayTutorial();

  const last = dayTutorialIndex === dayTutorialSteps.length - 1;
  dayTutorialLayer.dataset.placement = step.screen_area?.message_placement || 'bottom';
  dayTutorialProgress.textContent = `ШАГ ${dayTutorialIndex + 1} ИЗ ${dayTutorialSteps.length}`;
  dayTutorialText.textContent = String(step.text || '');
  dayTutorialBack.disabled = dayTutorialIndex === 0;
  dayTutorialNext.innerHTML = last
    ? 'Понятно! <span aria-hidden="true">✓</span>'
    : 'Дальше <span aria-hidden="true">→</span>';
  positionDayTutorialFocus();
  playDayTutorialVoice(step);
}

function maybeStartDayTutorial() {
  const records = readProfileRecords(getUserProfileId());
  const { day } = deriveRoomState(records);
  if (!isRoomInteractive() || !isNewDayTutorialDue(records, day)) return false;
  closeRoomAction();
  hideRoomMessage();
  closeRoomInbox();
  dayTutorialSteps = newDayTutorialSteps(day);
  dayTutorialIndex = 0;
  dayTutorialDay = day;
  setHidden(dayTutorialLayer, false);
  renderDayTutorialStep();
  dayTutorialNext.focus({ preventScroll: true });
  return true;
}

// Closing the tutorial, read through or skipped, marks it seen for its day and lets the messages in.
// The record goes in while the layer is still open, so that the messages arrive only through
// openRoomDay: replayed ones first, then new ones, and none of them twice.
function finishDayTutorial({ skipped = false } = {}) {
  if (dayTutorialLayer.classList.contains('is-hidden')) return;
  stopDayTutorialVoice();
  appendProfileRecord({
    'Тип события': NEW_DAY_TUTORIAL_SEEN_EVENT,
    'Профиль пользователя': getUserProfileId(),
    'Игровой день': dayTutorialDay,
    'Пропущен': skipped,
  });
  setHidden(dayTutorialLayer, true);
  dayTutorialFocus.hidden = true;
  openRoomDay();
}

dayTutorialNext.addEventListener('click', () => {
  if (dayTutorialIndex >= dayTutorialSteps.length - 1) return finishDayTutorial();
  dayTutorialIndex += 1;
  renderDayTutorialStep();
});

dayTutorialBack.addEventListener('click', () => {
  if (dayTutorialIndex === 0) return;
  dayTutorialIndex -= 1;
  renderDayTutorialStep();
});

dayTutorialSkip.addEventListener('click', () => finishDayTutorial({ skipped: true }));

window.addEventListener('resize', () => {
  if (!dayTutorialLayer.classList.contains('is-hidden')) positionDayTutorialFocus();
});

// --- Piggy bank tutorial -------------------------------------------------------

// Steps are data mart rows; a step whose target lives in the piggy bank card opens the card itself.
const PIGGY_TUTORIAL_OBJECT_TYPE = 'Piggy bank tutorial';
const PIGGY_TUTORIAL_SEEN_EVENT = 'Просмотр туториала копилки';
const PIGGY_TUTORIAL_FOCUS_PADDING = 6;
const piggyTutorialLayer = $('#piggy-tutorial-layer');
const piggyTutorialFocus = $('#piggy-tutorial-focus');
const piggyTutorialProgress = $('#piggy-tutorial-progress');
const piggyTutorialText = $('#piggy-tutorial-text');
const piggyTutorialBack = $('#piggy-tutorial-back');
const piggyTutorialNext = $('#piggy-tutorial-next');
const piggyTutorialSkip = $('#piggy-tutorial-skip');
const piggyTutorialSteps = dataMartRows
  .filter((row) => row?.object_type === PIGGY_TUTORIAL_OBJECT_TYPE)
  .sort((left, right) => Number(left.queue) - Number(right.queue));
let piggyTutorialIndex = 0;
// Coins the player was short of when they went home for the piggy bank; null when they came for anything else.
let pendingSavingsShortage = null;

function stopPiggyTutorialVoice() {
  piggyTutorialAudio.pause();
  piggyTutorialAudio.removeAttribute('src');
  piggyTutorialAudio.load();
  piggyTutorialVoicePlaying = false;
  updateMusicFade();
}

function playPiggyTutorialVoice(step) {
  stopPiggyTutorialVoice();
  if (!step?.audio) return;

  piggyTutorialAudio.src = publicAssetPath(step.audio_folder, step.audio, 'audio/piggy_bank_tutorial');
  piggyTutorialAudio.volume = 1;
  piggyTutorialAudio.muted = muted;
  piggyTutorialAudio.play()
    .then(() => {
      piggyTutorialVoicePlaying = true;
      updateMusicFade();
    })
    .catch((error) => {
      piggyTutorialVoicePlaying = false;
      updateMusicFade();
      console.info(`Озвучка шага ${step.queue ?? piggyTutorialIndex + 1} туториала копилки пока недоступна.`, error);
    });
}

piggyTutorialAudio.addEventListener('ended', () => {
  piggyTutorialVoicePlaying = false;
  updateMusicFade();
});

piggyTutorialAudio.addEventListener('error', () => {
  if (!piggyTutorialAudio.getAttribute('src')) return;
  piggyTutorialVoicePlaying = false;
  updateMusicFade();
  console.warn('Не удалось загрузить озвучку туториала копилки:', piggyTutorialAudio.currentSrc);
});

function positionPiggyTutorialFocus() {
  const target = findRoomTarget(piggyTutorialSteps[piggyTutorialIndex]?.screen_area?.target);
  piggyTutorialFocus.hidden = !target;
  if (!target) return;
  const layerRect = piggyTutorialLayer.getBoundingClientRect();
  const rect = target.getBoundingClientRect();
  const radius = Number.parseFloat(getComputedStyle(target).borderTopLeftRadius) || 12;
  piggyTutorialFocus.style.left = `${rect.left - layerRect.left - PIGGY_TUTORIAL_FOCUS_PADDING}px`;
  piggyTutorialFocus.style.top = `${rect.top - layerRect.top - PIGGY_TUTORIAL_FOCUS_PADDING}px`;
  piggyTutorialFocus.style.width = `${rect.width + PIGGY_TUTORIAL_FOCUS_PADDING * 2}px`;
  piggyTutorialFocus.style.height = `${rect.height + PIGGY_TUTORIAL_FOCUS_PADDING * 2}px`;
  piggyTutorialFocus.style.borderRadius = `${radius + PIGGY_TUTORIAL_FOCUS_PADDING}px`;
}

function renderPiggyTutorialStep() {
  const step = piggyTutorialSteps[piggyTutorialIndex];
  if (!step) return finishPiggyTutorial();

  // The piggy bank card is open exactly while the step talks about something inside it.
  const target = findRoomTarget(step.screen_area?.target);
  const insideCard = Boolean(target && roomTransferLayer.contains(target));
  if (insideCard && roomTransferLayer.hidden) openSavingsTransfer({ amount: pendingSavingsShortage ?? 0 });
  if (!insideCard && !roomTransferLayer.hidden) closeSavingsTransfer();

  const last = piggyTutorialIndex === piggyTutorialSteps.length - 1;
  piggyTutorialLayer.dataset.placement = step.screen_area?.message_placement || 'bottom';
  piggyTutorialProgress.textContent = `ШАГ ${piggyTutorialIndex + 1} ИЗ ${piggyTutorialSteps.length}`;
  piggyTutorialText.textContent = String(step.text || '');
  piggyTutorialBack.disabled = piggyTutorialIndex === 0;
  piggyTutorialNext.innerHTML = last
    ? 'Понятно! <span aria-hidden="true">✓</span>'
    : 'Дальше <span aria-hidden="true">→</span>';
  positionPiggyTutorialFocus();
  playPiggyTutorialVoice(step);
}

// Shown once per profile, the first time the player comes home to take coins from the piggy bank.
function maybeStartPiggyTutorial() {
  if (pendingSavingsShortage === null || !piggyTutorialSteps.length || !isRoomInteractive()) return false;
  const records = readProfileRecords(getUserProfileId());
  if (records.some((record) => record?.['Тип события'] === PIGGY_TUTORIAL_SEEN_EVENT)) return false;
  closeRoomAction();
  hideRoomMessage();
  closeRoomInbox();
  piggyTutorialIndex = 0;
  setHidden(piggyTutorialLayer, false);
  renderPiggyTutorialStep();
  piggyTutorialNext.focus({ preventScroll: true });
  return true;
}

// The player came for the coins, so the piggy bank opens with the missing sum already set.
function openPendingSavingsTransfer() {
  if (pendingSavingsShortage === null) return;
  const amount = pendingSavingsShortage;
  pendingSavingsShortage = null;
  if (roomTransferLayer.hidden) openSavingsTransfer({ amount });
}

function finishPiggyTutorial({ skipped = false } = {}) {
  if (piggyTutorialLayer.classList.contains('is-hidden')) return;
  stopPiggyTutorialVoice();
  appendProfileRecord({
    'Тип события': PIGGY_TUTORIAL_SEEN_EVENT,
    'Профиль пользователя': getUserProfileId(),
    'Игровой день': deriveRoomState(readProfileRecords(getUserProfileId())).day,
    'Пропущен': skipped,
  });
  setHidden(piggyTutorialLayer, true);
  piggyTutorialFocus.hidden = true;
  openRoomDay();
}

piggyTutorialNext.addEventListener('click', () => {
  if (piggyTutorialIndex >= piggyTutorialSteps.length - 1) return finishPiggyTutorial();
  piggyTutorialIndex += 1;
  renderPiggyTutorialStep();
});

piggyTutorialBack.addEventListener('click', () => {
  if (piggyTutorialIndex === 0) return;
  piggyTutorialIndex -= 1;
  renderPiggyTutorialStep();
});

piggyTutorialSkip.addEventListener('click', () => finishPiggyTutorial({ skipped: true }));

// The piggy bank card pops in with a scale animation; the ring is placed again once it has settled.
roomTransferLayer.addEventListener('animationend', () => {
  if (!piggyTutorialLayer.classList.contains('is-hidden')) positionPiggyTutorialFocus();
});

window.addEventListener('resize', () => {
  if (!piggyTutorialLayer.classList.contains('is-hidden')) positionPiggyTutorialFocus();
});

// --- Additional tasks -----------------------------------------------------------

// The game behind each additional task, by the task's data mart `title`.
const ADDITIONAL_TASK_GAMES = {
  'Валютное мемо': openCurrencyMemo,
  'Активы и пассивы': openAssetsSort,
};
const roomTasksButton = $('[data-room-action="tasks"]');
const roomTasksBadge = $('#room-tasks-badge');
const roomTasksLayer = $('#room-tasks-layer');
const roomTasksList = $('#room-tasks-list');
const roomTasksEmpty = $('#room-tasks-empty');
const roomTasksClose = $('#room-tasks-close');

// The number next to the icon counts the tasks that can be played now.
function renderTasksBadge(records) {
  const { available } = additionalTaskList(dataMartRows, records);
  roomTasksBadge.hidden = available.length === 0;
  roomTasksBadge.textContent = available.length > 9 ? '9+' : String(available.length);
  roomTasksButton.setAttribute('aria-label', available.length ? `Задания, доступно: ${available.length}` : 'Задания');
}

function renderTaskItem(task, done) {
  const item = document.createElement('li');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `room-inbox-item room-task-item${done ? ' is-done' : ''}`;
  button.dataset.taskId = String(task.id);
  button.disabled = done;

  const price = Number(task.price) || 0;
  const meta = document.createElement('span');
  meta.className = 'room-inbox-meta';
  const reward = document.createElement('b');
  reward.textContent = done ? '✓ Выполнено' : `+${formatCoins(price)} в карман`;
  meta.append(reward);
  const title = document.createElement('strong');
  title.className = 'room-task-title';
  title.textContent = task.title;
  const text = document.createElement('span');
  text.className = 'room-inbox-text room-task-text';
  text.textContent = String(task.text || '');
  const go = document.createElement('span');
  go.className = 'room-inbox-play room-task-go';
  go.setAttribute('aria-hidden', 'true');
  go.textContent = done ? '✓' : '▶';
  button.append(meta, title, text, go);
  button.setAttribute('aria-label', `${task.title}. ${done ? 'Выполнено' : `Награда ${price} монет`}. ${text.textContent}`);
  item.append(button);
  return item;
}

// Tasks that can be played now come first; the done ones go below and cannot be chosen.
function openTaskList() {
  closeRoomAction();
  hideRoomMessage();
  closeRoomInbox();
  const { available, done } = additionalTaskList(dataMartRows, readProfileRecords(getUserProfileId()));
  roomTasksList.replaceChildren(
    ...available.map((task) => renderTaskItem(task, false)),
    ...done.map((task) => renderTaskItem(task, true)),
  );
  roomTasksEmpty.hidden = available.length + done.length > 0;
  roomTasksLayer.hidden = false;
  roomTasksList.scrollTop = 0;
  roomTasksClose.focus({ preventScroll: true });
}

function closeTaskList() {
  roomTasksLayer.hidden = true;
}

roomTasksList.addEventListener('click', (event) => {
  const button = event.target.closest('.room-task-item');
  if (!button || button.disabled || !taskTutorialLayer.classList.contains('is-hidden')) return;
  const task = additionalTaskList(dataMartRows, readProfileRecords(getUserProfileId())).available
    .find((item) => String(item.id) === button.dataset.taskId);
  closeTaskList();
  if (task) startAdditionalTask(task);
});
roomTasksClose.addEventListener('click', () => {
  closeTaskList();
  roomTasksButton.focus({ preventScroll: true });
});
roomTasksLayer.addEventListener('click', (event) => {
  if (event.target === roomTasksLayer && taskTutorialLayer.classList.contains('is-hidden')) closeTaskList();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !finishScreen.hidden && !roomTasksLayer.hidden
    && taskTutorialLayer.classList.contains('is-hidden')) closeTaskList();
});

function startAdditionalTask(task) {
  const game = ADDITIONAL_TASK_GAMES[task.title];
  if (!game) {
    showRoomMessage(`«${task.title}» скоро появится`);
    return;
  }
  appendProfileRecord({
    'Тип события': ADDITIONAL_TASK_STARTED_EVENT,
    'Профиль пользователя': getUserProfileId(),
    'Идентификатор задания': task.id,
    'Название задания': task.title,
    'Игровой день': deriveRoomState(readProfileRecords(getUserProfileId())).day,
  });
  game(task);
}

// The reward goes into the pocket together with the record that closes the task for good,
// so a reload can neither lose nor repeat it. Returns the reward, 0 when the task was done before.
function completeAdditionalTask(task, result) {
  const profileId = getUserProfileId();
  const records = readProfileRecords(profileId);
  const state = deriveRoomState(records);
  if (state.completedAdditionalTasks.has(String(task.id))) return 0;
  const reward = Number(task.price) || 0;
  if (reward > 0) {
    appendProfileRecord({
      'Тип события': POCKET_TOPUP_EVENT,
      'Профиль пользователя': profileId,
      'Значение': reward,
      'Назначение': `Дополнительное задание «${task.title}»`,
      'Источник средств': 'Дополнительное задание',
      'Идентификатор задания': task.id,
      'Игровой день': state.day,
    });
    appendBudgetFact(records, INCOME_ARTICLE, reward, {
      'Зачислено': 'Карман',
      'Источник средств': 'Дополнительное задание',
      'Назначение': `Дополнительное задание «${task.title}»`,
      'Идентификатор задания': task.id,
      'Игровой день': state.day,
    });
  }
  appendProfileRecord({
    'Тип события': ADDITIONAL_TASK_COMPLETED_EVENT,
    'Профиль пользователя': profileId,
    'Идентификатор задания': task.id,
    'Название задания': task.title,
    ...result,
    'Награда в карман': reward,
    'Игровой день': state.day,
  });
  return reward;
}

// --- Additional tasks tutorial ---------------------------------------------------

// Shown once per profile, as soon as the first additional task is available. A step whose target
// lives in the task list opens the list itself.
const TASK_TUTORIAL_FOCUS_PADDING = 6;
const taskTutorialLayer = $('#task-tutorial-layer');
const taskTutorialFocus = $('#task-tutorial-focus');
const taskTutorialProgress = $('#task-tutorial-progress');
const taskTutorialText = $('#task-tutorial-text');
const taskTutorialBack = $('#task-tutorial-back');
const taskTutorialNext = $('#task-tutorial-next');
const taskTutorialSkip = $('#task-tutorial-skip');
const taskTutorialSteps = additionalTaskTutorialSteps(dataMartRows);
let taskTutorialIndex = 0;

function stopTaskTutorialVoice() {
  taskTutorialAudio.pause();
  taskTutorialAudio.removeAttribute('src');
  taskTutorialAudio.load();
  taskTutorialVoicePlaying = false;
  updateMusicFade();
}

function playTaskTutorialVoice(step) {
  stopTaskTutorialVoice();
  if (!step?.audio) return;

  taskTutorialAudio.src = publicAssetPath(step.audio_folder, step.audio, 'audio/additional_task_tutorial');
  taskTutorialAudio.volume = 1;
  taskTutorialAudio.muted = muted;
  taskTutorialAudio.play()
    .then(() => {
      taskTutorialVoicePlaying = true;
      updateMusicFade();
    })
    .catch((error) => {
      taskTutorialVoicePlaying = false;
      updateMusicFade();
      console.info(`Озвучка шага ${step.queue ?? taskTutorialIndex + 1} туториала дополнительных заданий пока недоступна.`, error);
    });
}

taskTutorialAudio.addEventListener('ended', () => {
  taskTutorialVoicePlaying = false;
  updateMusicFade();
});

taskTutorialAudio.addEventListener('error', () => {
  if (!taskTutorialAudio.getAttribute('src')) return;
  taskTutorialVoicePlaying = false;
  updateMusicFade();
  console.warn('Не удалось загрузить озвучку туториала дополнительных заданий:', taskTutorialAudio.currentSrc);
});

function positionTaskTutorialFocus() {
  const target = findRoomTarget(taskTutorialSteps[taskTutorialIndex]?.screen_area?.target);
  taskTutorialFocus.hidden = !target;
  if (!target) return;
  const layerRect = taskTutorialLayer.getBoundingClientRect();
  const rect = target.getBoundingClientRect();
  const radius = Number.parseFloat(getComputedStyle(target).borderTopLeftRadius) || 12;
  taskTutorialFocus.style.left = `${rect.left - layerRect.left - TASK_TUTORIAL_FOCUS_PADDING}px`;
  taskTutorialFocus.style.top = `${rect.top - layerRect.top - TASK_TUTORIAL_FOCUS_PADDING}px`;
  taskTutorialFocus.style.width = `${rect.width + TASK_TUTORIAL_FOCUS_PADDING * 2}px`;
  taskTutorialFocus.style.height = `${rect.height + TASK_TUTORIAL_FOCUS_PADDING * 2}px`;
  taskTutorialFocus.style.borderRadius = `${radius + TASK_TUTORIAL_FOCUS_PADDING}px`;
}

function renderTaskTutorialStep() {
  const step = taskTutorialSteps[taskTutorialIndex];
  if (!step) return finishTaskTutorial();

  // The task list is open exactly while the step talks about something inside it.
  const target = findRoomTarget(step.screen_area?.target);
  const insideList = Boolean(target && roomTasksLayer.contains(target));
  if (insideList && roomTasksLayer.hidden) openTaskList();
  if (!insideList && !roomTasksLayer.hidden) closeTaskList();

  const last = taskTutorialIndex === taskTutorialSteps.length - 1;
  taskTutorialLayer.dataset.placement = step.screen_area?.message_placement || 'bottom';
  taskTutorialProgress.textContent = `ШАГ ${taskTutorialIndex + 1} ИЗ ${taskTutorialSteps.length}`;
  taskTutorialText.textContent = String(step.text || '');
  taskTutorialBack.disabled = taskTutorialIndex === 0;
  taskTutorialNext.innerHTML = last
    ? 'Понятно! <span aria-hidden="true">✓</span>'
    : 'Дальше <span aria-hidden="true">→</span>';
  positionTaskTutorialFocus();
  playTaskTutorialVoice(step);
}

function maybeStartTaskTutorial() {
  if (!taskTutorialSteps.length || !isRoomInteractive()) return false;
  const records = readProfileRecords(getUserProfileId());
  if (deriveRoomState(records).additionalTaskTutorialSeen) return false;
  if (!additionalTaskList(dataMartRows, records).available.length) return false;
  closeRoomAction();
  hideRoomMessage();
  closeRoomInbox();
  closeSavingsTransfer();
  taskTutorialIndex = 0;
  setHidden(taskTutorialLayer, false);
  renderTaskTutorialStep();
  taskTutorialNext.focus({ preventScroll: true });
  return true;
}

// The record also ends day 5 (its end-of-day row waits for it), so the green button shows up right after.
function finishTaskTutorial({ skipped = false } = {}) {
  if (taskTutorialLayer.classList.contains('is-hidden')) return;
  stopTaskTutorialVoice();
  appendProfileRecord({
    'Тип события': ADDITIONAL_TASK_TUTORIAL_SEEN_EVENT,
    'Профиль пользователя': getUserProfileId(),
    'Игровой день': deriveRoomState(readProfileRecords(getUserProfileId())).day,
    'Пропущен': skipped,
  });
  setHidden(taskTutorialLayer, true);
  taskTutorialFocus.hidden = true;
  closeTaskList();
  renderRoomHud();
  openRoomDay();
}

taskTutorialNext.addEventListener('click', () => {
  if (taskTutorialIndex >= taskTutorialSteps.length - 1) return finishTaskTutorial();
  taskTutorialIndex += 1;
  renderTaskTutorialStep();
});

taskTutorialBack.addEventListener('click', () => {
  if (taskTutorialIndex === 0) return;
  taskTutorialIndex -= 1;
  renderTaskTutorialStep();
});

taskTutorialSkip.addEventListener('click', () => finishTaskTutorial({ skipped: true }));

// The list pops in with a scale animation; the ring is placed again once it has settled.
roomTasksLayer.addEventListener('animationend', () => {
  if (!taskTutorialLayer.classList.contains('is-hidden')) positionTaskTutorialFocus();
});

window.addEventListener('resize', () => {
  if (!taskTutorialLayer.classList.contains('is-hidden')) positionTaskTutorialFocus();
});

// --- Currency memo ---------------------------------------------------------------

// A wrong pair stays open this long before it turns back; a tap on another card turns it at once.
const MEMO_MISMATCH_MS = 1100;
const memoTitle = $('#memo-title');
const memoBoard = $('#memo-board');
const memoPairs = $('#memo-pairs');
const memoMoves = $('#memo-moves');
const memoExit = $('#memo-exit');
const memoWin = $('#memo-win');
const memoWinText = $('#memo-win-text');
const memoWinReward = $('#memo-win-reward');
const memoWinClose = $('#memo-win-close');
let memoTask = null;
let memoCards = [];
let memoOpen = [];
let memoMoveCount = 0;
let memoMistakes = 0;
let memoCloseTimer = 0;

function memoCardFace(card) {
  const face = document.createElement('span');
  face.className = `memo-card-face memo-card-${card.kind}`;
  const picture = document.createElement('span');
  const name = document.createElement('span');
  name.className = 'memo-card-name';
  if (card.kind === 'currency') {
    picture.className = 'memo-card-sign';
    picture.textContent = card.sign;
    name.textContent = card.currency;
  } else {
    picture.className = 'memo-card-flag';
    picture.innerHTML = flagSvg(card.flag);
    name.textContent = card.place;
  }
  // Longer words than this no longer fit the narrowest card at the usual size.
  name.classList.toggle('is-long', name.textContent.split(/\s+/).some((word) => word.length > 11));
  face.append(picture, name);
  return face;
}

function memoCardLabel(card, index) {
  if (!card.open && !card.matched) return `Карточка ${index + 1}, закрыта`;
  const name = card.kind === 'currency' ? `валюта ${card.currency}, знак ${card.sign}` : `флаг: ${card.place}`;
  return `Карточка ${index + 1}: ${name}${card.matched ? ', пара найдена' : ''}`;
}

function renderMemoCard(index) {
  const card = memoCards[index];
  const button = memoBoard.children[index]?.firstElementChild;
  if (!card || !button) return;
  button.classList.toggle('is-open', card.open || card.matched);
  button.classList.toggle('is-matched', card.matched);
  button.classList.toggle('is-wrong', card.wrong);
  button.setAttribute('aria-label', memoCardLabel(card, index));
}

function renderMemoScore() {
  const found = memoCards.filter((card) => card.matched).length / 2;
  memoPairs.textContent = `${found} из ${memoCards.length / 2}`;
  memoMoves.textContent = String(memoMoveCount);
}

function openCurrencyMemo(task) {
  memoTask = task;
  closeTaskList();
  leaveRoom();
  window.clearTimeout(memoCloseTimer);
  memoCloseTimer = 0;
  memoCards = dealCurrencyMemo().map((card) => ({ ...card, open: false, matched: false, wrong: false }));
  memoOpen = [];
  memoMoveCount = 0;
  memoMistakes = 0;
  memoTitle.textContent = task.title;
  memoWin.hidden = true;
  memoBoard.replaceChildren(...memoCards.map((card, index) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'memo-card';
    button.dataset.index = String(index);
    const inner = document.createElement('span');
    inner.className = 'memo-card-inner';
    const back = document.createElement('span');
    back.className = 'memo-card-back';
    back.setAttribute('aria-hidden', 'true');
    back.textContent = '🪙';
    inner.append(back, memoCardFace(card));
    button.append(inner);
    item.append(button);
    return item;
  }));
  memoCards.forEach((_, index) => renderMemoCard(index));
  renderMemoScore();
  showOnlyScreen(memoScreen);
}

// Turns a wrong pair back face down.
function closeWrongMemoPair() {
  window.clearTimeout(memoCloseTimer);
  memoCloseTimer = 0;
  for (const index of memoOpen) {
    Object.assign(memoCards[index], { open: false, wrong: false });
    renderMemoCard(index);
  }
  memoOpen = [];
}

// A pair is a currency and the place where it is paid with; every two open cards make one move.
function flipMemoCard(index) {
  const card = memoCards[index];
  if (!card || card.matched || !memoWin.hidden) return;
  if (memoCloseTimer) closeWrongMemoPair();
  if (card.open) return;
  card.open = true;
  memoOpen.push(index);
  renderMemoCard(index);
  if (memoOpen.length < 2) return;

  memoMoveCount += 1;
  const [first, second] = memoOpen.map((item) => memoCards[item]);
  if (first.pair === second.pair) {
    for (const item of memoOpen) {
      memoCards[item].matched = true;
      renderMemoCard(item);
    }
    memoOpen = [];
    renderMemoScore();
    if (memoCards.every((item) => item.matched)) finishCurrencyMemo();
    return;
  }
  memoMistakes += 1;
  for (const item of memoOpen) {
    memoCards[item].wrong = true;
    renderMemoCard(item);
  }
  renderMemoScore();
  memoCloseTimer = window.setTimeout(closeWrongMemoPair, MEMO_MISMATCH_MS);
}

function finishCurrencyMemo() {
  const pairs = memoCards.length / 2;
  const reward = completeAdditionalTask(memoTask, {
    'Найдено пар': pairs,
    'Ходов': memoMoveCount,
    'Ошибочных ходов': memoMistakes,
  });
  memoWinText.textContent = `${pairs} ${pluralRu(pairs, 'пара', 'пары', 'пар')} за ${memoMoveCount} ${pluralRu(memoMoveCount, 'ход', 'хода', 'ходов')}`
    + (memoMistakes ? `, промахов: ${memoMistakes}` : ' — без единого промаха!');
  memoWinReward.hidden = reward <= 0;
  memoWinReward.textContent = `+${formatCoins(reward)} в карман`;
  memoWin.hidden = false;
  memoWinClose.focus({ preventScroll: true });
}

function returnFromCurrencyMemo() {
  window.clearTimeout(memoCloseTimer);
  memoCloseTimer = 0;
  memoTask = null;
  enterRoom();
}

memoBoard.addEventListener('click', (event) => {
  const button = event.target.closest('.memo-card');
  if (button) flipMemoCard(Number(button.dataset.index));
});
memoWinClose.addEventListener('click', returnFromCurrencyMemo);
// Leaving halfway keeps the task open: next time the board is dealt anew.
memoExit.addEventListener('click', () => {
  if (memoTask && memoWin.hidden) {
    appendProfileRecord({
      'Тип события': ADDITIONAL_TASK_ABANDONED_EVENT,
      'Профиль пользователя': getUserProfileId(),
      'Идентификатор задания': memoTask.id,
      'Название задания': memoTask.title,
      'Найдено пар': memoCards.filter((card) => card.matched).length / 2,
      'Ходов': memoMoveCount,
      'Игровой день': deriveRoomState(readProfileRecords(getUserProfileId())).day,
    });
  }
  returnFromCurrencyMemo();
});

// --- Assets and liabilities ------------------------------------------------------

// The card has to travel this far (px, or this share of its width if smaller) to land in a bin.
const ASSETS_DROP_DISTANCE = 90;
const ASSETS_DROP_SHARE = 0.3;
const ASSETS_KIND_NAMES = { [ASSET]: 'актив', [LIABILITY]: 'пассив' };
// Steps of the screen tutorial, linked to the task by `title`; shown once per profile, on the first game.
const ASSETS_TUTORIAL_OBJECT_TYPE = 'Assets and liabilities tutorial';
const ASSETS_TUTORIAL_SEEN_EVENT = 'Просмотр туториала дополнительного задания';
const ASSETS_INTRO_SEEN_EVENT = 'Просмотр вступления ментора к дополнительному заданию';
const ASSETS_FOCUS_PADDING = 6;
// The mentor comments on the first mistake of each kind (`assets-wrong-<why>`) and on the first pair
// like a kettle and five kettles; a pause first lets the card show its colour.
const ASSETS_TWINS_TRIGGER = 'assets-twins';
const ASSETS_MENTOR_DELAY_MS = 450;
const assetsTitle = $('#assets-title');
const assetsSorted = $('#assets-sorted');
const assetsCapitalLabel = $('#assets-capital');
const assetsCard = $('#assets-card');
const assetsCardIcon = $('#assets-card-icon');
const assetsCardName = $('#assets-card-name');
const assetsCardNote = $('#assets-card-note');
const assetsDelta = $('#assets-delta');
const assetsFeedback = $('#assets-feedback');
const assetsFeedbackTitle = $('#assets-feedback-title');
const assetsFeedbackText = $('#assets-feedback-text');
const assetsFeedbackNext = $('#assets-feedback-next');
const assetsBins = {
  [ASSET]: $('#assets-bin-asset'),
  [LIABILITY]: $('#assets-bin-liability'),
};
const assetsBinItems = {
  [ASSET]: $('#assets-bin-asset-items'),
  [LIABILITY]: $('#assets-bin-liability-items'),
};
const assetsRules = $('#assets-rules');
const assetsRulesOpen = $('#assets-rules-open');
const assetsRulesClose = $('#assets-rules-close');
const assetsExit = $('#assets-exit');
const assetsWin = $('#assets-win');
const assetsWinText = $('#assets-win-text');
const assetsWinReward = $('#assets-win-reward');
const assetsWinClose = $('#assets-win-close');
const assetsTutorialLayer = $('#assets-tutorial-layer');
const assetsTutorialFocus = $('#assets-tutorial-focus');
const assetsTutorialProgress = $('#assets-tutorial-progress');
const assetsTutorialText = $('#assets-tutorial-text');
const assetsTutorialBack = $('#assets-tutorial-back');
const assetsTutorialNext = $('#assets-tutorial-next');
const assetsTutorialSkip = $('#assets-tutorial-skip');
let assetsTutorialSteps = [];
let assetsTutorialIndex = 0;
let assetsTask = null;
// Things still to sort; a wrongly sorted one goes back to the end.
let assetsDeck = [];
let assetsTotal = 0;
let assetsSortedCount = 0;
let assetsAnswers = 0;
let assetsMistakes = 0;
let assetsCapital = START_CAPITAL;
let assetsMistakeNames = new Set();
// Things already in the right bins, to notice a pair like a kettle and five kettles.
let assetsSortedItems = [];
// Mentor triggers already heard in this game: each comment is made once.
let assetsMentorShown = new Set();
let assetsMentorTimer = 0;
// True while the verdict on the last card is shown.
let assetsAnswered = false;
let assetsDrag = null;

function assetsPlaying() {
  return Boolean(assetsTask) && !assetsAnswered && assetsRules.hidden && assetsWin.hidden
    && assetsTutorialLayer.classList.contains('is-hidden') && mentorLayer.hidden;
}

function renderAssetsScore() {
  assetsSorted.textContent = `${assetsSortedCount} из ${assetsTotal}`;
  assetsCapitalLabel.textContent = formatCoins(assetsCapital);
}

function renderAssetsCard() {
  const item = assetsDeck[0];
  if (!item) return;
  assetsCardIcon.textContent = item.icon;
  if (item.count) {
    const count = document.createElement('span');
    count.className = 'assets-card-count';
    count.textContent = `×${item.count}`;
    assetsCardIcon.append(count);
  }
  assetsCardName.textContent = item.name;
  assetsCardNote.textContent = item.note;
  assetsCard.style.transform = '';
  assetsCard.classList.remove('is-right', 'is-wrong', 'is-dragging', 'is-leaving');
  assetsCard.classList.remove('is-entering');
  void assetsCard.offsetWidth;
  assetsCard.classList.add('is-entering');
  assetsCard.setAttribute('aria-label', `${item.name}. ${item.note}`);
}

function showAssetsDelta(amount) {
  assetsDelta.classList.remove('is-up', 'is-down');
  void assetsDelta.offsetWidth;
  assetsDelta.textContent = `${amount >= 0 ? '+' : '−'}${formatCoins(Math.abs(amount))}`;
  assetsDelta.classList.add(amount >= 0 ? 'is-up' : 'is-down');
}

function setAssetsBinsEnabled(enabled) {
  for (const bin of Object.values(assetsBins)) bin.disabled = !enabled;
}

function openAssetsSort(task) {
  assetsTask = task;
  closeTaskList();
  leaveRoom();
  assetsDeck = dealPropertyDeck();
  assetsTotal = assetsDeck.length;
  assetsSortedCount = 0;
  assetsAnswers = 0;
  assetsMistakes = 0;
  assetsCapital = START_CAPITAL;
  assetsMistakeNames = new Set();
  assetsSortedItems = [];
  assetsMentorShown = new Set();
  window.clearTimeout(assetsMentorTimer);
  assetsMentorTimer = 0;
  assetsAnswered = false;
  assetsDrag = null;
  assetsTutorialSteps = dataMartRows
    .filter((row) => row?.object_type === ASSETS_TUTORIAL_OBJECT_TYPE && row.title === task.title)
    .sort((left, right) => Number(left.queue) - Number(right.queue));
  assetsTitle.textContent = task.title;
  assetsFeedback.hidden = true;
  assetsWin.hidden = true;
  assetsDelta.classList.remove('is-up', 'is-down');
  for (const items of Object.values(assetsBinItems)) items.replaceChildren();
  setAssetsBinsEnabled(true);
  renderAssetsScore();
  renderAssetsCard();
  showOnlyScreen(assetsScreen);
  // The first game opens with the screen tutorial and the mentor's introduction; later ones with
  // the rules, since the difference between the two bins is the whole point of the task.
  if (!startAssetsTutorial()) afterAssetsTutorial();
}

function showAssetsRules({ start = false } = {}) {
  assetsRulesClose.innerHTML = start
    ? 'Начать <span aria-hidden="true">→</span>'
    : 'Понятно <span aria-hidden="true">✓</span>';
  assetsRules.hidden = false;
  assetsRulesClose.focus({ preventScroll: true });
}

function assetsTaskRecordSeen(event) {
  return readProfileRecords(getUserProfileId()).some((record) => record['Тип события'] === event
    && String(record['Идентификатор задания']) === String(assetsTask?.id));
}

function appendAssetsTaskRecord(event, fields = {}) {
  appendProfileRecord({
    'Тип события': event,
    'Профиль пользователя': getUserProfileId(),
    'Идентификатор задания': assetsTask.id,
    'Название задания': assetsTask.title,
    ...fields,
    'Игровой день': deriveRoomState(readProfileRecords(getUserProfileId())).day,
  });
}

function focusAssetsBins() {
  assetsBins[ASSET].focus({ preventScroll: true });
}

// The mentor explains what assets and liabilities are, then the sorting begins.
function afterAssetsTutorial() {
  if (!assetsTask) return;
  if (assetsTaskRecordSeen(ASSETS_INTRO_SEEN_EVENT)) {
    showAssetsRules({ start: true });
    return;
  }
  const title = assetsTask.title;
  showMentor('assets-intro-what', {
    title,
    closeLabel: 'Дальше <span aria-hidden="true">→</span>',
    afterClose: () => showMentor('assets-intro-how', {
      title,
      closeLabel: 'Понятно, разбираю <span aria-hidden="true">✓</span>',
      afterClose: () => {
        if (!assetsTask) return;
        appendAssetsTaskRecord(ASSETS_INTRO_SEEN_EVENT);
        focusAssetsBins();
      },
    }),
  });
}

// --- Assets and liabilities tutorial ---

function assetsTutorialTarget() {
  const target = assetsTutorialSteps[assetsTutorialIndex]?.screen_area?.target;
  return target ? assetsScreen.querySelector(`[data-assets-target="${CSS.escape(String(target))}"]`) : null;
}

function positionAssetsTutorialFocus() {
  const target = assetsTutorialTarget();
  assetsTutorialFocus.hidden = !target;
  if (!target) return;
  const layerRect = assetsTutorialLayer.getBoundingClientRect();
  const rect = target.getBoundingClientRect();
  const radius = Number.parseFloat(getComputedStyle(target).borderTopLeftRadius) || 12;
  assetsTutorialFocus.style.left = `${rect.left - layerRect.left - ASSETS_FOCUS_PADDING}px`;
  assetsTutorialFocus.style.top = `${rect.top - layerRect.top - ASSETS_FOCUS_PADDING}px`;
  assetsTutorialFocus.style.width = `${rect.width + ASSETS_FOCUS_PADDING * 2}px`;
  assetsTutorialFocus.style.height = `${rect.height + ASSETS_FOCUS_PADDING * 2}px`;
  assetsTutorialFocus.style.borderRadius = `${radius + ASSETS_FOCUS_PADDING}px`;
}

function stopAssetsTutorialVoice() {
  assetsTutorialAudio.pause();
  assetsTutorialAudio.removeAttribute('src');
  assetsTutorialAudio.load();
  assetsTutorialVoicePlaying = false;
  updateMusicFade();
}

function playAssetsTutorialVoice(step) {
  stopAssetsTutorialVoice();
  if (!step?.audio) return;
  assetsTutorialAudio.src = publicAssetPath(step.audio_folder, step.audio, 'audio/assets_tutorial');
  assetsTutorialAudio.volume = 1;
  assetsTutorialAudio.muted = muted;
  assetsTutorialAudio.play()
    .then(() => {
      assetsTutorialVoicePlaying = true;
      updateMusicFade();
    })
    .catch((error) => {
      assetsTutorialVoicePlaying = false;
      updateMusicFade();
      console.info(`Озвучка шага ${step.queue ?? assetsTutorialIndex + 1} туториала «Активов и пассивов» пока недоступна.`, error);
    });
}

assetsTutorialAudio.addEventListener('ended', () => {
  assetsTutorialVoicePlaying = false;
  updateMusicFade();
});

assetsTutorialAudio.addEventListener('error', () => {
  if (!assetsTutorialAudio.getAttribute('src')) return;
  assetsTutorialVoicePlaying = false;
  updateMusicFade();
  console.warn('Не удалось загрузить озвучку туториала «Активов и пассивов»:', assetsTutorialAudio.currentSrc);
});

function renderAssetsTutorialStep() {
  const step = assetsTutorialSteps[assetsTutorialIndex];
  if (!step) return finishAssetsTutorial();
  const last = assetsTutorialIndex === assetsTutorialSteps.length - 1;
  assetsTutorialLayer.dataset.placement = step.screen_area?.message_placement || 'bottom';
  assetsTutorialProgress.textContent = `ШАГ ${assetsTutorialIndex + 1} ИЗ ${assetsTutorialSteps.length}`;
  assetsTutorialText.textContent = String(step.text || '');
  assetsTutorialBack.disabled = assetsTutorialIndex === 0;
  assetsTutorialNext.innerHTML = last
    ? 'Понятно! <span aria-hidden="true">✓</span>'
    : 'Дальше <span aria-hidden="true">→</span>';
  requestAnimationFrame(positionAssetsTutorialFocus);
  playAssetsTutorialVoice(step);
}

function startAssetsTutorial() {
  if (!assetsTutorialSteps.length || assetsTaskRecordSeen(ASSETS_TUTORIAL_SEEN_EVENT)) return false;
  assetsTutorialIndex = 0;
  setHidden(assetsTutorialLayer, false);
  renderAssetsTutorialStep();
  assetsTutorialNext.focus({ preventScroll: true });
  return true;
}

function finishAssetsTutorial({ skipped = false } = {}) {
  if (assetsTutorialLayer.classList.contains('is-hidden')) return false;
  stopAssetsTutorialVoice();
  if (assetsTask && !assetsTaskRecordSeen(ASSETS_TUTORIAL_SEEN_EVENT)) {
    appendAssetsTaskRecord(ASSETS_TUTORIAL_SEEN_EVENT, { 'Пропущен': skipped });
  }
  setHidden(assetsTutorialLayer, true);
  assetsTutorialFocus.hidden = true;
  return true;
}

assetsTutorialNext.addEventListener('click', () => {
  if (assetsTutorialIndex >= assetsTutorialSteps.length - 1) {
    if (finishAssetsTutorial()) afterAssetsTutorial();
    return;
  }
  assetsTutorialIndex += 1;
  renderAssetsTutorialStep();
});
assetsTutorialBack.addEventListener('click', () => {
  if (assetsTutorialIndex === 0) return;
  assetsTutorialIndex -= 1;
  renderAssetsTutorialStep();
});
assetsTutorialSkip.addEventListener('click', () => {
  if (finishAssetsTutorial({ skipped: true })) afterAssetsTutorial();
});
window.addEventListener('resize', () => {
  if (!assetsTutorialLayer.classList.contains('is-hidden')) positionAssetsTutorialFocus();
});

// --- Assets and liabilities: sorting ---

// A right choice adds the thing's coins to the virtual capital and puts it into its bin;
// a wrong one takes the coins away and sends the thing to the end of the pile.
function sortAssetsCard(choice) {
  if (!assetsPlaying()) return;
  const item = assetsDeck.shift();
  if (!item) return;
  assetsAnswers += 1;
  const right = item.kind === choice;
  const kindName = ASSETS_KIND_NAMES[item.kind];
  if (right) {
    assetsSortedCount += 1;
    assetsCapital += item.coins;
    const chip = document.createElement('span');
    chip.textContent = item.count ? `${item.icon}×${item.count}` : item.icon;
    chip.title = item.name;
    assetsBinItems[item.kind].append(chip);
    assetsSortedItems.push(item);
  } else {
    assetsMistakes += 1;
    assetsCapital -= item.coins;
    assetsMistakeNames.add(item.name);
    assetsDeck.push(item);
  }
  assetsAnswered = true;
  setAssetsBinsEnabled(false);
  assetsCard.style.transform = '';
  assetsCard.classList.remove('is-entering', 'is-dragging');
  assetsCard.classList.toggle('is-right', right);
  assetsCard.classList.toggle('is-wrong', !right);
  showAssetsDelta(right ? item.coins : -item.coins);
  renderAssetsScore();

  const reason = right ? item.reason : `${item.reason} Эта вещь вернётся в конец стопки.`;
  const nextLabel = assetsDeck.length
    ? 'Дальше <span aria-hidden="true">→</span>'
    : 'Готово <span aria-hidden="true">✓</span>';
  // A mistake of a new kind, or the second thing of a pair, gets the mentor's comment instead of the
  // short verdict; the thing's own explanation goes under it.
  let trigger = right ? null : `assets-wrong-${item.why}`;
  if (right && twinInDeck(item, assetsSortedItems)) trigger = ASSETS_TWINS_TRIGGER;
  if (trigger && !assetsMentorShown.has(trigger)) {
    assetsMentorShown.add(trigger);
    const title = assetsTask.title;
    assetsMentorTimer = window.setTimeout(() => {
      assetsMentorTimer = 0;
      if (!assetsTask) return;
      showMentor(trigger, {
        title,
        extra: `${item.icon} ${item.name}: ${reason}`,
        closeLabel: nextLabel,
        afterClose: nextAssetsCard,
      });
    }, ASSETS_MENTOR_DELAY_MS);
    return;
  }

  assetsFeedback.classList.toggle('is-right', right);
  assetsFeedback.classList.toggle('is-wrong', !right);
  assetsFeedbackTitle.textContent = right ? `Верно, это ${kindName}!` : `Не совсем: это ${kindName}`;
  assetsFeedbackText.textContent = reason;
  assetsFeedbackNext.innerHTML = nextLabel;
  assetsFeedback.hidden = false;
  assetsFeedbackNext.focus({ preventScroll: true });
}

function nextAssetsCard() {
  if (!assetsAnswered || !assetsTask) return;
  assetsAnswered = false;
  assetsFeedback.hidden = true;
  if (!assetsDeck.length) {
    finishAssetsSort();
    return;
  }
  setAssetsBinsEnabled(true);
  renderAssetsCard();
}

function finishAssetsSort() {
  const reward = completeAdditionalTask(assetsTask, {
    'Разобрано вещей': assetsTotal,
    'Ходов': assetsAnswers,
    'Ошибочных ходов': assetsMistakes,
    'Виртуальный капитал': assetsCapital,
    'Вещи с ошибками': [...assetsMistakeNames].join(', '),
    'Реплики ментора': [...assetsMentorShown].join(', '),
  });
  assetsCard.classList.add('is-leaving');
  showMentor(assetsMistakes ? 'assets-done' : 'assets-perfect', {
    title: assetsTask.title,
    closeLabel: 'Дальше <span aria-hidden="true">→</span>',
    afterClose: () => showAssetsWin(reward),
  });
}

function showAssetsWin(reward) {
  if (!assetsTask) return;
  assetsWinText.textContent = `${assetsTotal} ${pluralRu(assetsTotal, 'вещь', 'вещи', 'вещей')} разложено. Капитал: ${formatCoins(assetsCapital)}`
    + (assetsMistakes ? `. Ошибок: ${assetsMistakes}` : ' — без единой ошибки!');
  assetsWinReward.hidden = reward <= 0;
  assetsWinReward.textContent = `+${formatCoins(reward)} в карман`;
  assetsWin.hidden = false;
  assetsWinClose.focus({ preventScroll: true });
}

function returnFromAssetsSort() {
  window.clearTimeout(assetsMentorTimer);
  assetsMentorTimer = 0;
  closeMentor();
  if (!assetsTutorialLayer.classList.contains('is-hidden')) {
    stopAssetsTutorialVoice();
    setHidden(assetsTutorialLayer, true);
  }
  assetsTask = null;
  assetsDrag = null;
  enterRoom();
}

// Dragging the card towards a bin lights the bin up; letting go past the threshold sorts it there.
function assetsDragChoice(dx) {
  const distance = Math.min(ASSETS_DROP_DISTANCE, assetsCard.offsetWidth * ASSETS_DROP_SHARE);
  if (Math.abs(dx) < distance) return null;
  return dx < 0 ? ASSET : LIABILITY;
}

function highlightAssetsBin(choice) {
  for (const [kind, bin] of Object.entries(assetsBins)) bin.classList.toggle('is-target', kind === choice);
}

assetsCard.addEventListener('pointerdown', (event) => {
  if (!assetsPlaying() || event.button > 0) return;
  assetsDrag = { id: event.pointerId, x: event.clientX, y: event.clientY, dx: 0 };
  assetsCard.setPointerCapture(event.pointerId);
  assetsCard.classList.remove('is-entering');
  assetsCard.classList.add('is-dragging');
});
assetsCard.addEventListener('pointermove', (event) => {
  if (!assetsDrag || event.pointerId !== assetsDrag.id) return;
  assetsDrag.dx = event.clientX - assetsDrag.x;
  const dy = Math.max(-40, Math.min(80, event.clientY - assetsDrag.y));
  assetsCard.style.transform = `translate(${assetsDrag.dx}px, ${dy}px) rotate(${assetsDrag.dx / 18}deg)`;
  highlightAssetsBin(assetsDragChoice(assetsDrag.dx));
});
function endAssetsDrag(event) {
  if (!assetsDrag || event.pointerId !== assetsDrag.id) return;
  const choice = event.type === 'pointerup' ? assetsDragChoice(assetsDrag.dx) : null;
  assetsDrag = null;
  highlightAssetsBin(null);
  assetsCard.classList.remove('is-dragging');
  assetsCard.style.transform = '';
  if (choice) sortAssetsCard(choice);
}
assetsCard.addEventListener('pointerup', endAssetsDrag);
assetsCard.addEventListener('pointercancel', endAssetsDrag);

for (const [kind, bin] of Object.entries(assetsBins)) bin.addEventListener('click', () => sortAssetsCard(kind));
assetsFeedbackNext.addEventListener('click', nextAssetsCard);
assetsRulesOpen.addEventListener('click', () => {
  if (!assetsWin.hidden) return;
  showAssetsRules();
});
assetsRulesClose.addEventListener('click', () => {
  assetsRules.hidden = true;
  if (assetsAnswered) assetsFeedbackNext.focus({ preventScroll: true });
  else focusAssetsBins();
});
// Arrows sort into the bin on their side.
document.addEventListener('keydown', (event) => {
  if (assetsScreen.hidden || !assetsPlaying()) return;
  if (event.key === 'ArrowLeft') sortAssetsCard(ASSET);
  if (event.key === 'ArrowRight') sortAssetsCard(LIABILITY);
});
assetsWinClose.addEventListener('click', returnFromAssetsSort);
// Leaving halfway keeps the task open: next time a new pile is dealt.
assetsExit.addEventListener('click', () => {
  if (assetsTask && assetsWin.hidden) {
    appendProfileRecord({
      'Тип события': ADDITIONAL_TASK_ABANDONED_EVENT,
      'Профиль пользователя': getUserProfileId(),
      'Идентификатор задания': assetsTask.id,
      'Название задания': assetsTask.title,
      'Разобрано вещей': assetsSortedCount,
      'Ходов': assetsAnswers,
      'Виртуальный капитал': assetsCapital,
      'Игровой день': deriveRoomState(readProfileRecords(getUserProfileId())).day,
    });
  }
  returnFromAssetsSort();
});

// --- Coach Max's video call ---------------------------------------------------------

// «Поездка на тренировку» opens with coach Max calling on video once the monster is clean and fed
// on day 6; after his last line the route planner opens.
const TRAINER_MOOD_LABELS = {
  cheerful: 'ВЕСЕЛИТСЯ',
  guilty: 'ИЗВИНЯЕТСЯ',
  businesslike: 'ДЕЛОВИТ',
  puzzled: 'НЕДОУМЕВАЕТ',
};
const trainerCallLayer = $('#trainer-call-layer');
const trainerCallWindow = $('#trainer-call');
const trainerCallVideo = $('#trainer-call-video');
const trainerCallBackdrop = $('#trainer-call-backdrop');
const trainerCallTimer = $('#trainer-call-timer');
const trainerCallSpeech = $('#trainer-call-speech');
const trainerCallMood = $('#trainer-call-mood');
const trainerCallText = $('#trainer-call-text');
const trainerCallNext = $('#trainer-call-next');
const trainerCallAnswer = $('#trainer-call-answer');
const trainerCall = new TrainerCall(trainerCallVideo);
// True from the call until the player is back in the room: room messages wait meanwhile.
let routeEpisodeRunning = false;
let trainerCallEpisode = null;
let trainerCallLines = [];
let trainerLineIndex = 0;
let shownTrainerLine = null;
let trainerSilentTalkTimer = 0;
let trainerCallClock = 0;

function isTrainerCallEpisode(episode) {
  return Number(episode?.id) === ROUTE_EPISODE_ID;
}

function trainerLines(episode) {
  return dataMartRows
    .filter((row) => row?.object_type === TRAINER_LINE_OBJECT_TYPE && row.title === episode?.title)
    .sort((left, right) => Number(left.queue) - Number(right.queue));
}

function trainerLineMood(line) {
  const mood = line?.screen_area?.mood;
  return TRAINER_MOOD_LABELS[mood] ? mood : 'cheerful';
}

// The picture may have loaded before this script ran, so its state is checked right away as well.
const showTrainerCallBackdrop = () => { trainerCallBackdrop.hidden = !(trainerCallBackdrop.naturalWidth > 0); };
trainerCallBackdrop.addEventListener('load', showTrainerCallBackdrop);
trainerCallBackdrop.addEventListener('error', showTrainerCallBackdrop);
if (trainerCallBackdrop.complete) showTrainerCallBackdrop();

async function startTrainerCall(episode, { repeatIntro = true } = {}) {
  if (routeEpisodeRunning || !isTrainerCallEpisode(episode)) return;
  const stillDue = dueEconomicEpisodes(dataMartRows, readProfileRecords(getUserProfileId()))
    .some((item) => String(item.id) === String(episode.id));
  if (!stillDue) return;
  routeEpisodeRunning = true;
  recordEconomicEpisodeOpened(episode);
  if (!repeatIntro) {
    openRoutePlanner(episode);
    return;
  }
  showTrainerCall(episode);
}

// The phone rings over the room; the call starts when the player answers.
function showTrainerCall(episode) {
  closeRoomAction();
  closeRoomInbox();
  closeTaskList();
  closeSavingsTransfer();
  hideRoomMessage();
  setRoomActionsEnabled(false);
  trainerCallEpisode = episode;
  trainerCallLines = trainerLines(episode);
  trainerLineIndex = 0;
  trainerCallLines.forEach((line) => {
    if (line.audio) warmUpVoice(publicAssetPath(line.audio_folder, line.audio, 'audio/trainer'));
  });
  trainerCall.load().catch((error) => console.warn('Не удалось загрузить модель тренера:', error));
  trainerCallWindow.dataset.state = 'ringing';
  trainerCallTimer.textContent = 'видеозвонок';
  trainerCallSpeech.hidden = true;
  trainerCallAnswer.hidden = false;
  trainerCallLayer.hidden = false;
  trainerCallAnswer.focus({ preventScroll: true });
}

async function answerTrainerCall() {
  if (!trainerCallEpisode || trainerCallWindow.dataset.state !== 'ringing') return;
  trainerCallWindow.dataset.state = 'talking';
  trainerCallAnswer.hidden = true;
  const started = Date.now();
  window.clearInterval(trainerCallClock);
  const tick = () => {
    const seconds = Math.floor((Date.now() - started) / 1000);
    trainerCallTimer.textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  };
  tick();
  trainerCallClock = window.setInterval(tick, 1000);
  try {
    await trainerCall.load();
    trainerCall.start();
  } catch (error) {
    console.warn('Звонок идёт без модели тренера.', error);
  }
  if (!trainerCallEpisode) return;
  renderTrainerLine();
}

function renderTrainerLine() {
  const line = trainerCallLines[trainerLineIndex];
  if (!line) {
    finishTrainerCall();
    return;
  }
  stopTrainerVoice();
  shownTrainerLine = line;
  const mood = trainerLineMood(line);
  const last = trainerLineIndex === trainerCallLines.length - 1;
  trainerCallSpeech.dataset.mood = mood;
  trainerCallMood.textContent = TRAINER_MOOD_LABELS[mood];
  trainerCallText.textContent = String(line.text || '');
  trainerCallNext.innerHTML = last
    ? 'Построить маршруты <span aria-hidden="true">🗺️</span>'
    : 'Дальше <span aria-hidden="true">→</span>';
  trainerCallSpeech.hidden = false;
  trainerCall.setMood(mood);
  playTrainerVoice(line);
  trainerCallNext.focus({ preventScroll: true });
}

function closeTrainerCall() {
  stopTrainerVoice();
  shownTrainerLine = null;
  window.clearInterval(trainerCallClock);
  trainerCall.stop();
  trainerCallLayer.hidden = true;
}

function finishTrainerCall() {
  const episode = trainerCallEpisode;
  trainerCallEpisode = null;
  closeTrainerCall();
  if (episode) openRoutePlanner(episode);
}

function stopTrainerVoice() {
  window.clearTimeout(trainerSilentTalkTimer);
  trainerSilentTalkTimer = 0;
  trainerVoiceAudio.pause();
  trainerVoiceAudio.removeAttribute('src');
  trainerVoiceAudio.load();
  trainerVoicePlaying = false;
  trainerCall.setTalking(false);
  updateMusicFade();
}

// Until the recorded file is in place, his mouth moves for about as long as the line would take to say.
function startTrainerSilentTalk(line) {
  if (!line || shownTrainerLine !== line) return;
  window.clearTimeout(trainerSilentTalkTimer);
  trainerCall.setTalking(true);
  const duration = Math.max(2400, Math.min(12000, String(line.text || '').length * 52));
  trainerSilentTalkTimer = window.setTimeout(() => {
    trainerSilentTalkTimer = 0;
    if (shownTrainerLine === line) trainerCall.setTalking(false);
  }, duration);
}

async function playTrainerVoice(line) {
  stopTrainerVoice();
  if (!line?.audio) {
    startTrainerSilentTalk(line);
    return;
  }
  const url = publicAssetPath(line.audio_folder, line.audio, 'audio/trainer');
  const source = (await warmUpVoice(url)) ?? url;
  if (shownTrainerLine !== line) return;
  trainerVoiceAudio.src = source;
  trainerVoiceAudio.volume = 1;
  trainerVoiceAudio.muted = muted;
  trainerVoiceAudio.play()
    .then(() => {
      trainerVoicePlaying = true;
      trainerCall.setTalking(true);
      updateMusicFade();
    })
    .catch((error) => {
      trainerVoicePlaying = false;
      updateMusicFade();
      startTrainerSilentTalk(line);
      console.info(`Озвучка реплики тренера ${line.id} пока недоступна.`, error);
    });
}

trainerVoiceAudio.addEventListener('ended', () => {
  trainerVoicePlaying = false;
  trainerCall.setTalking(false);
  updateMusicFade();
});

trainerVoiceAudio.addEventListener('error', () => {
  if (!trainerVoiceAudio.getAttribute('src')) return;
  trainerVoicePlaying = false;
  updateMusicFade();
  if (shownTrainerLine) startTrainerSilentTalk(shownTrainerLine);
  console.warn('Не удалось загрузить озвучку реплики тренера:', trainerVoiceAudio.currentSrc);
});

trainerCallAnswer.addEventListener('click', answerTrainerCall);
trainerCallNext.addEventListener('click', () => {
  if (!trainerCallEpisode) return;
  trainerLineIndex += 1;
  renderTrainerLine();
});

// --- Route planner ------------------------------------------------------------------

const ROUTE_CONTENT = 'Подбор оптимального решения: маршруты тренера и игрока до одного корта, успеть к 11:00 с минимальными расходами на проезд и ожидание.';
const ROUTE_TUTORIAL_SEEN_EVENT = 'Просмотр туториала маршрутов';
const ROUTE_INTRO_SEEN_EVENT = 'Просмотр вступления ментора к маршрутам';
const ROUTE_TRAINING_MOOD_REASON = 'Монстрик сходил на тренировку по теннису';
const ROUTE_TRAINING_MOOD = 2;
const ROUTE_FOCUS_PADDING = 6;
const ROUTE_EXPLANATIONS = {
  'route-courts': 'Маршруты тренера и игрока ведут к разным кортам.',
  'route-late': 'Кто-то приезжает позже начала оплаченной тренировки.',
  'route-money': 'На план не хватает денег даже вместе с копилкой.',
  'route-taxi': 'План выполним, но в нём дорогое такси вместо общественного транспорта.',
  'route-waiting': 'План выполним, но тренер приезжает раньше и игрок платит за его ожидание.',
  'route-overpay': 'План выполним, но существует более дешёвый вариант.',
  'route-optimal': 'Выбран самый дешёвый план, при котором оба успевают к началу тренировки.',
};
const routeScreen = $('#route-screen');
const routeWhoButtons = [...routeScreen.querySelectorAll('.route-who-button')];
const routeWhoStatus = { coach: $('#route-who-coach-status'), own: $('#route-who-own-status') };
const routeMapBox = $('#route-map');
const routeMapImage = $('#route-map-image');
const routeMapSvg = $('#route-map-svg');
const routeHint = $('#route-hint');
const routeUndo = $('#route-undo');
const routeReset = $('#route-reset');
const routeSummaryLegs = { coach: $('#route-summary-coach-legs'), own: $('#route-summary-own-legs') };
const routeSummaryNumbers = { coach: $('#route-summary-coach-numbers'), own: $('#route-summary-own-numbers') };
const routeSummaryWait = $('#route-summary-wait');
const routeTotal = $('#route-total');
const routeSubmit = $('#route-submit');
const routeTutorialLayer = $('#route-tutorial-layer');
const routeTutorialFocus = $('#route-tutorial-focus');
const routeTutorialProgress = $('#route-tutorial-progress');
const routeTutorialText = $('#route-tutorial-text');
const routeTutorialBack = $('#route-tutorial-back');
const routeTutorialNext = $('#route-tutorial-next');
const routeTutorialSkip = $('#route-tutorial-skip');
let routeEpisode = null;
let routeMapData = null;
let routeOptimum = null;
let routeRoutes = { coach: [], own: [] };
let routeTraveller = 'coach';
let routeApproved = false;
let routeTutorialSteps = [];
let routeTutorialIndex = 0;

// The hidden <img> only finds out whether the drawn map is in place; the map itself is drawn inside
// the SVG, in the same 360 × 440 box as the points, so its streets stay under the lines.
// The picture may have loaded before this script ran, so its state is checked right away as well.
const markRouteMapImage = () => routeMapBox.classList.toggle('has-image', routeMapImage.naturalWidth > 0);
routeMapImage.addEventListener('load', markRouteMapImage);
routeMapImage.addEventListener('error', markRouteMapImage);
if (routeMapImage.complete) markRouteMapImage();

function routeEpisodeRecords(records, type) {
  return records.filter((record) => (
    record?.['Тип события'] === type && String(record['Идентификатор эпизода']) === String(routeEpisode?.id)
  ));
}

function openRoutePlanner(episode) {
  routeEpisode = episode;
  routeEpisodeRunning = true;
  closeTrainerCall();
  leaveRoom();
  // The call disabled the room controls. They stay ready for the way back.
  setRoomActionsEnabled(true);
  routeMapData = routeMap(dataMartRows, episode);
  routeOptimum = optimalPlan(routeMapData);
  if (!routeMapData.legs.length || !routeOptimum) {
    console.warn(`В дата-марте нет карты маршрутов для эпизода «${episode.title}».`);
    returnFromRoutePlanner();
    return;
  }
  routeRoutes = { coach: [], own: [] };
  routeTraveller = 'coach';
  routeApproved = false;
  routeTutorialSteps = dataMartRows
    .filter((row) => row?.object_type === ROUTE_TUTORIAL_OBJECT_TYPE && row.title === episode.title)
    .sort((left, right) => Number(left.queue) - Number(right.queue));
  const records = readProfileRecords(getUserProfileId());
  const logged = routeEpisodeRecords(records, EPISODE_EVENT).some((record) => record['Содержание события'] === ROUTE_CONTENT);
  if (!logged) {
    logEpisode(ROUTE_CONTENT, {
      'Название эпизода': episode.title,
      'Идентификатор эпизода': episode.id,
      'Выезд': formatClock(DEPARTURE_MINUTES),
      'Начало тренировки': formatClock(TRAINING_START_MINUTES),
      'Плата за ожидание': `${WAITING_BLOCK_PRICE} за каждые ${WAITING_BLOCK_MINUTES} мин`,
      'Самый выгодный план': routeOptimum.total,
      'Игровой день': deriveRoomState(records).day,
    });
  }
  showOnlyScreen(routeScreen);
  buildRouteMap();
  resetRouteView();
  renderRoutePlanner();
  if (!startRouteTutorial()) afterRouteTutorial();
}

function returnFromRoutePlanner() {
  finishRouteTutorial();
  routeEpisodeRunning = false;
  routeEpisode = null;
  enterRoom();
}

// A leg is a gentle curve from one point to the other; `bend` pushes it aside so two legs between
// the same points (a walk and a taxi) do not lie on top of each other.
function routeLegGeometry(leg) {
  const from = routeMapData.points.get(leg.from);
  const to = routeMapData.points.get(leg.to);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const cx = (from.x + to.x) / 2 - (dy / length) * leg.bend;
  const cy = (from.y + to.y) / 2 + (dx / length) * leg.bend;
  const t = leg.badge;
  const along = (a, c, b) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;
  return {
    path: `M${from.x} ${from.y} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${to.x} ${to.y}`,
    badge: { x: along(from.x, cx, to.x), y: along(from.y, cy, to.y) },
  };
}

function svgElement(name, attributes = {}, parent = null) {
  const element = document.createElementNS(SVG_NS, name);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
  parent?.append(element);
  return element;
}

function buildRouteMap() {
  routeMapSvg.replaceChildren();
  svgElement('image', {
    href: routeMapImage.getAttribute('src'),
    x: 0,
    y: 0,
    width: 360,
    height: 440,
    preserveAspectRatio: 'xMidYMid slice',
    class: 'route-map-picture',
    'aria-hidden': 'true',
  }, routeMapSvg);
  // A hand-drawn town under the lines: a river, a park and blocks of houses. A drawn map image,
  // once it is in public/images/route, replaces it.
  const decor = svgElement('g', { class: 'route-map-decor', 'aria-hidden': 'true' }, routeMapSvg);
  svgElement('rect', { x: 0, y: 0, width: 360, height: 440, class: 'route-decor-ground' }, decor);
  svgElement('path', { d: 'M20 150 Q70 110 110 150 Q140 185 120 215 L20 215 Z', class: 'route-decor-park' }, decor);
  [[210, 24, 60, 26], [228, 92, 46, 34], [24, 250, 60, 44], [110, 300, 50, 36], [230, 380, 70, 36], [40, 40, 70, 20], [110, 176, 40, 26]]
    .forEach(([x, y, width, height]) => svgElement('rect', { x, y, width, height, rx: 6, class: 'route-decor-block' }, decor));
  svgElement('path', { d: 'M360 214 Q300 238 250 262 Q200 290 238 330 Q268 364 250 440', class: 'route-decor-river' }, decor);

  const legs = svgElement('g', { class: 'route-legs' }, routeMapSvg);
  for (const leg of routeMapData.legs) {
    const { path, badge: at } = routeLegGeometry(leg);
    const group = svgElement('g', { class: 'route-leg', 'data-leg-id': leg.id, 'data-mode': leg.mode }, legs);
    svgElement('path', { d: path, class: 'route-leg-glow route-leg-glow-coach' }, group);
    svgElement('path', { d: path, class: 'route-leg-glow route-leg-glow-own' }, group);
    svgElement('path', { d: path, class: 'route-leg-line' }, group);
    svgElement('path', { d: path, class: 'route-leg-hit' }, group);
    const mode = ROUTE_MODES[leg.mode];
    const label = `${mode.icon}${leg.minutes}′ ${leg.price}🪙`;
    const width = 12 + label.length * 5.1;
    const badge = svgElement('g', { class: 'route-leg-badge', transform: `translate(${at.x.toFixed(1)} ${at.y.toFixed(1)})` }, group);
    svgElement('rect', { x: -width / 2, y: -9, width, height: 18, rx: 9 }, badge);
    svgElement('text', { x: 0, y: 4, 'text-anchor': 'middle' }, badge).textContent = label;
    const title = svgElement('title', {}, group);
    title.textContent = `${leg.name || mode.label}: ${leg.minutes} мин, ${formatMoney(leg.price)}`;
  }

  const points = svgElement('g', { class: 'route-points' }, routeMapSvg);
  for (const point of routeMapData.points.values()) {
    const group = svgElement('g', { class: `route-point is-${point.kind}`, 'data-point': point.key, transform: `translate(${point.x} ${point.y})` }, points);
    svgElement('circle', { r: point.kind === 'stop' ? 11 : 15 }, group);
    svgElement('text', { class: 'route-point-icon', y: point.kind === 'stop' ? 4 : 5, 'text-anchor': 'middle' }, group).textContent = point.icon;
    const side = point.labelSide;
    const anchor = side === 'left' ? 'end' : side === 'right' ? 'start' : 'middle';
    const offset = point.kind === 'stop' ? 15 : 19;
    const labelX = side === 'left' ? -offset : side === 'right' ? offset : 0;
    const labelY = side === 'bottom' ? offset + 8 : side === 'top' ? -offset + 1 : 4;
    const label = svgElement('text', { class: 'route-point-label', x: labelX, y: labelY, 'text-anchor': anchor }, group);
    label.textContent = point.name;
  }

  const markers = svgElement('g', { class: 'route-markers', 'aria-hidden': 'true' }, routeMapSvg);
  for (const traveller of Object.keys(TRAVELLERS)) {
    const marker = svgElement('g', { class: 'route-marker', 'data-traveller': traveller }, markers);
    svgElement('circle', { r: 10 }, marker);
    svgElement('text', { y: 4, 'text-anchor': 'middle' }, marker).textContent = traveller === 'own' ? '🐾' : '🧢';
  }
}

function currentRoutePlan() {
  return planSummary(routeMapData, routeRoutes.coach, routeRoutes.own);
}

function routeSummaryText(summary) {
  if (!summary.legs.length) return 'маршрут не построен';
  const arrival = summary.court ? ` · на корте ${formatClock(summary.arrival)}` : '';
  return `${summary.minutes} мин · ${formatMoney(summary.price)}${arrival}`;
}

function renderRoutePlanner() {
  if (!routeMapData) return;
  const plan = currentRoutePlan();
  const available = new Set(routeApproved ? [] : nextLegs(routeMapData, routeTraveller, routeRoutes[routeTraveller]).map((leg) => leg.id));
  const inRoute = { coach: new Set(routeRoutes.coach), own: new Set(routeRoutes.own) };
  routeMapSvg.querySelectorAll('.route-leg').forEach((group) => {
    const id = Number(group.dataset.legId);
    group.classList.toggle('is-available', available.has(id));
    group.classList.toggle('in-coach', inRoute.coach.has(id));
    group.classList.toggle('in-own', inRoute.own.has(id));
    group.classList.toggle('is-active-route', inRoute[routeTraveller].has(id));
  });
  routeMapSvg.classList.toggle('is-building', !routeApproved);
  routeMapSvg.dataset.traveller = routeTraveller;

  for (const traveller of Object.keys(TRAVELLERS)) {
    const summary = plan[traveller];
    const end = summary.end ?? startPoint(routeMapData, traveller);
    const marker = routeMapSvg.querySelector(`.route-marker[data-traveller="${traveller}"]`);
    // Two markers on one court sit side by side.
    const shift = plan.sameCourt ? (traveller === 'coach' ? -13 : 13) : 0;
    marker?.setAttribute('transform', `translate(${end.x + shift} ${end.y - 21})`);
    marker?.classList.toggle('is-active', traveller === routeTraveller);
    const button = routeWhoButtons.find((item) => item.dataset.traveller === traveller);
    button.setAttribute('aria-selected', String(traveller === routeTraveller));
    routeWhoStatus[traveller].textContent = summary.court
      ? `${summary.court.name} · ${formatClock(summary.arrival)}`
      : summary.legs.length ? `в пути: ${summary.end.name}` : 'не построен';
    routeSummaryLegs[traveller].textContent = summary.legs.length
      ? summary.legs.map((leg) => ROUTE_MODES[leg.mode].icon).join(' → ')
      : '—';
    routeSummaryNumbers[traveller].textContent = routeSummaryText(summary);
    routeSummaryNumbers[traveller].classList.toggle('is-late', summary.late > 0);
  }

  if (plan.complete && !plan.sameCourt) {
    routeSummaryWait.textContent = 'Маршруты ведут к разным кортам!';
    routeSummaryWait.dataset.state = 'warning';
  } else if (plan.complete && plan.waitMinutes > 0) {
    routeSummaryWait.textContent = `Макс ждёт вас ${plan.waitMinutes} мин: +${formatMoney(plan.waitPrice)}`;
    routeSummaryWait.dataset.state = 'fee';
  } else if (plan.complete) {
    routeSummaryWait.textContent = 'Макс не ждёт — за ожидание платить не нужно';
    routeSummaryWait.dataset.state = 'ok';
  } else {
    routeSummaryWait.textContent = `Ожидание Макса: ${formatMoney(WAITING_BLOCK_PRICE)} за каждые ${WAITING_BLOCK_MINUTES} мин`;
    routeSummaryWait.dataset.state = '';
  }
  routeTotal.textContent = formatMoney(plan.total);
  routeUndo.disabled = routeApproved || !routeRoutes[routeTraveller].length;
  routeReset.disabled = routeApproved || !routeRoutes[routeTraveller].length;
  routeSubmit.disabled = routeApproved || !plan.complete;
  routeSubmit.textContent = routeApproved ? 'План утверждён' : plan.complete ? 'Утвердить план' : 'Построй оба маршрута';
  if (!routeHint.dataset.pinned) routeHint.textContent = routeDefaultHint(plan);
}

function routeDefaultHint(plan) {
  const summary = plan[routeTraveller];
  const who = routeTraveller === 'coach' ? 'Макса' : 'ваш';
  if (summary.court) return `Маршрут ${who} готов: ${summary.court.name}, в ${formatClock(summary.arrival)}`;
  const at = summary.end ?? startPoint(routeMapData, routeTraveller);
  return `Строим маршрут ${who}: выбери светящийся участок от «${at.name}»`;
}

let routeHintTimer = 0;
function showRouteHint(text) {
  window.clearTimeout(routeHintTimer);
  routeHint.textContent = text;
  routeHint.dataset.pinned = '1';
  routeHintTimer = window.setTimeout(() => {
    delete routeHint.dataset.pinned;
    renderRoutePlanner();
  }, 2600);
}

function selectRouteTraveller(traveller) {
  if (!TRAVELLERS[traveller]) return;
  routeTraveller = traveller;
  delete routeHint.dataset.pinned;
  renderRoutePlanner();
}

function tapRouteLeg(id) {
  if (routeApproved) return;
  const route = routeRoutes[routeTraveller];
  if (route[route.length - 1] === id) {
    route.pop();
    delete routeHint.dataset.pinned;
    renderRoutePlanner();
    return;
  }
  if (!nextLegs(routeMapData, routeTraveller, route).some((leg) => leg.id === id)) {
    const summary = routeSummary(routeMapData, routeTraveller, route);
    if (route.includes(id)) showRouteHint('Этот участок уже в маршруте. Убрать последний — «Шаг назад»');
    else if (summary.court) showRouteHint(`Маршрут уже дошёл до корта. Чтобы изменить, нажми «Шаг назад»`);
    else showRouteHint(`Этот участок не продолжает маршрут от «${(summary.end ?? startPoint(routeMapData, routeTraveller)).name}»`);
    return;
  }
  route.push(id);
  delete routeHint.dataset.pinned;
  // Once one route reaches a court, the other one is next if it is still empty.
  const other = routeTraveller === 'coach' ? 'own' : 'coach';
  if (routeSummary(routeMapData, routeTraveller, route).court && !routeRoutes[other].length) {
    routeTraveller = other;
  }
  renderRoutePlanner();
}

routeWhoButtons.forEach((button) => button.addEventListener('click', () => selectRouteTraveller(button.dataset.traveller)));
routeUndo.addEventListener('click', () => {
  if (routeApproved) return;
  routeRoutes[routeTraveller].pop();
  delete routeHint.dataset.pinned;
  renderRoutePlanner();
});
routeReset.addEventListener('click', () => {
  if (routeApproved) return;
  routeRoutes[routeTraveller] = [];
  delete routeHint.dataset.pinned;
  renderRoutePlanner();
});
routeSubmit.addEventListener('click', submitRoutePlan);

function routeLegNames(summary) {
  return summary.legs.map((leg) => `${ROUTE_MODES[leg.mode].label}: ${leg.name} (${leg.minutes} мин, ${leg.price})`);
}

function routePlanDetails(plan) {
  return {
    'Корт тренера': plan.coach.court?.name ?? null,
    'Наш корт': plan.own.court?.name ?? null,
    'Маршрут тренера': routeLegNames(plan.coach),
    'Наш маршрут': routeLegNames(plan.own),
    'Проезд тренера': plan.coach.price,
    'Наш проезд': plan.own.price,
    'Прибытие тренера': formatClock(plan.coach.arrival),
    'Наше прибытие': formatClock(plan.own.arrival),
    'Опоздание, мин': plan.late,
    'Ожидание тренера, мин': plan.waitMinutes,
    'Плата за ожидание': plan.waitPrice,
    'Итого': plan.total,
    'Самый выгодный план': routeOptimum.total,
  };
}

function routeCostsLine(plan) {
  return `Проезд Макса ${formatMoney(plan.coach.price)} · ваш ${formatMoney(plan.own.price)} · ожидание ${formatMoney(plan.waitPrice)} · итого ${formatMoney(plan.total)}`;
}

function submitRoutePlan() {
  if (!routeEpisode || routeApproved) return;
  const plan = currentRoutePlan();
  if (!plan.complete) return;
  const records = readProfileRecords(getUserProfileId());
  const wallet = deriveRoomState(records);
  const verdict = routeVerdict(plan, routeOptimum, wallet);
  const critical = ROUTE_CRITICAL_VERDICTS.has(verdict);
  // Workable but pricier plans the mentor has already sent back.
  const retries = routeEpisodeRecords(records, WRONG_DECISION_EVENT)
    .filter((record) => ROUTE_SUBOPTIMAL_VERDICTS.has(record['Оценка ментора'])).length;
  const retry = ROUTE_SUBOPTIMAL_VERDICTS.has(verdict) && retries < ROUTE_SUBOPTIMAL_RETRIES;
  const blocked = critical || retry;
  logDecision(!blocked, {
    episode: ROUTE_CONTENT,
    'Название эпизода': routeEpisode.title,
    'Идентификатор эпизода': routeEpisode.id,
    ...routePlanDetails(plan),
    'Оценка ментора': verdict,
    'Оптимальное решение': verdict === 'route-optimal',
    'Решение отменено ментором': blocked,
    'Возвратов неоптимального плана': retries + (retry ? 1 : 0),
    'Игровой день': wallet.day,
    explanation: ROUTE_EXPLANATIONS[verdict],
  });
  finishRouteTutorial();
  if (retry) {
    showMentor(`${verdict}-retry`, {
      title: routeEpisode.title,
      extra: routeCostsLine(plan),
      closeLabel: 'Поискать дешевле <span aria-hidden="true">↺</span>',
      afterClose: () => routeSubmit.focus({ preventScroll: true }),
    });
    return;
  }
  if (critical) {
    let extra = routeCostsLine(plan);
    if (verdict === 'route-late') extra = `Макс на корте в ${formatClock(plan.coach.arrival)}, вы — в ${formatClock(plan.own.arrival)}, а тренировка в ${formatClock(TRAINING_START_MINUTES)}`;
    if (verdict === 'route-courts') extra = `Макс едет на ${plan.coach.court.name}, вы — на ${plan.own.court.name}`;
    showMentor(verdict, {
      title: routeEpisode.title,
      extra,
      closeLabel: 'Переделать план <span aria-hidden="true">↺</span>',
      afterClose: () => routeSubmit.focus({ preventScroll: true }),
    });
    return;
  }

  routeApproved = true;
  const { fromSavings, mood } = completeRouteEpisode(plan, verdict);
  renderRoutePlanner();
  const savingsNote = fromSavings > 0 ? `, из них ${formatMoney(fromSavings)} — из копилки` : '';
  const bestNote = verdict === 'route-optimal' ? '' : ` · самый выгодный план стоил бы ${formatMoney(routeOptimum.total)}`;
  showMentor(verdict, {
    title: routeEpisode.title,
    extra: `${routeCostsLine(plan)}${savingsNote}${bestNote}`,
    closeLabel: 'На тренировку! <span aria-hidden="true">🎾</span>',
    afterClose: () => showRouteTraining(plan, mood),
  });
}

// Coins leave the pocket one purpose at a time, each written as a spending, its analytics mirror
// and a change of the fun article; whatever the pocket lacks is first moved from the piggy bank.
function completeRouteEpisode(plan, verdict) {
  const episode = routeEpisode;
  const profileId = getUserProfileId();
  const records = readProfileRecords(profileId);
  const state = deriveRoomState(records);
  const { day } = state;
  if (isEconomicEpisodeCompleted(records, episode)) return { fromSavings: 0, mood: null };

  const fromSavings = tennisEstimateSavingsPart(plan.total, state) ?? 0;
  if (fromSavings > 0) {
    const purpose = `${episode.title}: не хватило карманных денег`;
    logEpisode(SAVINGS_TRANSFER_EPISODE, { 'Игровой день': day });
    appendProfileRecord({
      'Тип события': POCKET_TOPUP_EVENT,
      'Профиль пользователя': profileId,
      'Значение': fromSavings,
      'Назначение': purpose,
      'Игровой день': day,
    });
    appendProfileRecord({
      'Тип события': SAVINGS_TOPUP_EVENT,
      'Профиль пользователя': profileId,
      'Значение': -fromSavings,
      'Назначение': purpose,
      'Игровой день': day,
    });
    appendSavingsWithdrawalFact(records, fromSavings, { 'Назначение': purpose, 'Игровой день': day });
  }
  const budgetNumber = currentBudgetNumber(records);
  const payments = [
    [plan.coach.price, `${episode.title}: проезд тренера`],
    [plan.own.price, `${episode.title}: наш проезд`],
    [plan.waitPrice, `${episode.title}: ожидание тренера ${plan.waitMinutes} мин`],
  ];
  for (const [amount, purpose] of payments) {
    if (amount <= 0) continue;
    appendProfileRecord({
      'Тип события': POCKET_SPENDING_EVENT,
      'Профиль пользователя': profileId,
      'Значение': amount,
      'Назначение': purpose,
      'Идентификатор эпизода': episode.id,
      'Игровой день': day,
    });
    // The analytics mirror of the spending, as in the shop and the park.
    appendProfileRecord({
      'Тип события': POCKET_TOPUP_EVENT,
      'Профиль пользователя': profileId,
      'Значение': -amount,
      'Назначение': purpose,
      'Идентификатор эпизода': episode.id,
      'Игровой день': day,
    });
    appendProfileRecord({
      'Тип события': BUDGET_FACT_EVENT,
      'Профиль пользователя': profileId,
      'Номер бюджета': budgetNumber,
      'Статья бюджета': FUN_ARTICLE,
      'Изменение статьи': amount,
      'Назначение': purpose,
      'Игровой день': day,
    });
  }
  appendProfileRecord({
    'Тип события': ECONOMIC_EPISODE_COMPLETED_EVENT,
    'Профиль пользователя': profileId,
    'Идентификатор эпизода': episode.id,
    'Название эпизода': episode.title,
    'Результат': `${plan.own.court.name}: Макс в ${formatClock(plan.coach.arrival)}, мы в ${formatClock(plan.own.arrival)}, итого ${plan.total}`,
    ...routePlanDetails(plan),
    'Оценка ментора': verdict,
    'Оптимальное решение': verdict === 'route-optimal',
    'Оплачено игроком': plan.total,
    'Взято из копилки': fromSavings,
    'Правильное решение': true,
    'Игровой день': day,
  });
  const [mood] = changeMonsterStats({ mood: ROUTE_TRAINING_MOOD }, ROUTE_TRAINING_MOOD_REASON, { 'Идентификатор эпизода': episode.id });
  return { fromSavings, mood };
}

// The training itself is a short card: when everyone arrived, the hour on the court, the mood.
function showRouteTraining(plan, mood) {
  const moodNote = !mood ? ''
    : mood.after !== mood.before ? `Настроение монстрика ${formatStat(mood.after - mood.before)}`
      : 'Настроение монстрика и так на максимуме';
  routeTrainingText.textContent = `${plan.own.court.name}: Макс приехал в ${formatClock(plan.coach.arrival)}, вы — в ${formatClock(plan.own.arrival)}. `
    + `С ${formatClock(TRAINING_START_MINUTES)} до ${formatClock(TRAINING_START_MINUTES + 60)} монстрик гонял мячи и ни разу не зевнул!`;
  routeTrainingMood.textContent = moodNote;
  routeTrainingMood.hidden = !moodNote;
  routeTraining.hidden = false;
  routeTrainingClose.focus({ preventScroll: true });
}

const routeTraining = $('#route-training');
const routeTrainingText = $('#route-training-text');
const routeTrainingMood = $('#route-training-mood');
const routeTrainingClose = $('#route-training-close');
routeTrainingClose.addEventListener('click', () => {
  routeTraining.hidden = true;
  returnFromRoutePlanner();
});

// --- Route map zoom -------------------------------------------------------------------

// The map is zoomed by narrowing the SVG view box: a tap on the map (not on a leg) zooms in there,
// the buttons zoom by a step, fingers pinch and drag, the mouse wheel zooms under the pointer.
const ROUTE_MAP_BOX = { x: 0, y: 0, width: 360, height: 440 };
const ROUTE_ZOOM_MAX = 3;
const ROUTE_ZOOM_STEP = 1.6;
// A tap zooms in this much at once, and the next tap at the deepest zoom shows the whole map again.
const ROUTE_TAP_ZOOM = 2;
const ROUTE_ZOOM_MS = 220;
// A finger that travels further than this is dragging the map, not tapping it.
const ROUTE_DRAG_PX = 6;
const routeZoomIn = $('#route-zoom-in');
const routeZoomOut = $('#route-zoom-out');
const routeZoomReset = $('#route-zoom-reset');
let routeView = { ...ROUTE_MAP_BOX };
let routeZoomAnimation = 0;
const routePointers = new Map();
let routeGesture = null;
let routeMapDragged = false;

function routeZoom() {
  return ROUTE_MAP_BOX.width / routeView.width;
}

// A view of the given zoom around the given map point, kept inside the map.
function clampedRouteView(zoom, centerX, centerY) {
  const level = Math.max(1, Math.min(ROUTE_ZOOM_MAX, zoom));
  const width = ROUTE_MAP_BOX.width / level;
  const height = ROUTE_MAP_BOX.height / level;
  return {
    x: Math.max(0, Math.min(ROUTE_MAP_BOX.width - width, centerX - width / 2)),
    y: Math.max(0, Math.min(ROUTE_MAP_BOX.height - height, centerY - height / 2)),
    width,
    height,
  };
}

function applyRouteView() {
  routeMapSvg.setAttribute('viewBox', `${routeView.x.toFixed(2)} ${routeView.y.toFixed(2)} ${routeView.width.toFixed(2)} ${routeView.height.toFixed(2)}`);
  const zoom = routeZoom();
  routeZoomIn.disabled = zoom >= ROUTE_ZOOM_MAX - 0.01;
  routeZoomOut.disabled = zoom <= 1.01;
  routeZoomReset.disabled = zoom <= 1.01;
  routeMapBox.classList.toggle('is-zoomed', zoom > 1.01);
}

function setRouteView(target, { animate = false } = {}) {
  cancelAnimationFrame(routeZoomAnimation);
  if (!animate) {
    routeView = target;
    applyRouteView();
    return;
  }
  const from = { ...routeView };
  const started = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - started) / ROUTE_ZOOM_MS);
    const ease = 1 - (1 - t) ** 3;
    routeView = Object.fromEntries(Object.keys(from).map((key) => [key, from[key] + (target[key] - from[key]) * ease]));
    applyRouteView();
    if (t < 1) routeZoomAnimation = requestAnimationFrame(step);
  };
  routeZoomAnimation = requestAnimationFrame(step);
}

// Zooms to `zoom` keeping the map point under (clientX, clientY) where it is on the screen.
function zoomRouteMapAt(zoom, clientX, clientY, options) {
  const point = routeMapPoint(clientX, clientY);
  const level = Math.max(1, Math.min(ROUTE_ZOOM_MAX, zoom));
  const width = ROUTE_MAP_BOX.width / level;
  const height = ROUTE_MAP_BOX.height / level;
  // The point keeps its share of the view: what was a third from the left stays a third from the left.
  const shareX = (point.x - routeView.x) / routeView.width;
  const shareY = (point.y - routeView.y) / routeView.height;
  setRouteView(clampedRouteView(level, point.x - shareX * width + width / 2, point.y - shareY * height + height / 2), options);
}

function zoomRouteMapByStep(factor) {
  setRouteView(clampedRouteView(routeZoom() * factor, routeView.x + routeView.width / 2, routeView.y + routeView.height / 2), { animate: true });
}

function resetRouteView() {
  cancelAnimationFrame(routeZoomAnimation);
  routeView = { ...ROUTE_MAP_BOX };
  applyRouteView();
}

function routeMapPoint(clientX, clientY) {
  const matrix = routeMapSvg.getScreenCTM();
  if (!matrix) return { x: routeView.x + routeView.width / 2, y: routeView.y + routeView.height / 2 };
  const point = new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse());
  return { x: point.x, y: point.y };
}

// A tap on the map zooms in there; at the deepest zoom it shows the whole map again.
function tapRouteMap(event) {
  if (routeZoom() >= ROUTE_ZOOM_MAX - 0.01) {
    setRouteView({ ...ROUTE_MAP_BOX }, { animate: true });
    return;
  }
  const point = routeMapPoint(event.clientX, event.clientY);
  setRouteView(clampedRouteView(routeZoom() * ROUTE_TAP_ZOOM, point.x, point.y), { animate: true });
}

routeMapSvg.addEventListener('pointerdown', (event) => {
  routePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (routePointers.size === 1) {
    routeMapDragged = false;
    routeGesture = { kind: 'pan', startX: event.clientX, startY: event.clientY, view: { ...routeView } };
  } else if (routePointers.size === 2) {
    const [a, b] = [...routePointers.values()];
    routeMapDragged = true;
    routeGesture = {
      kind: 'pinch',
      distance: Math.hypot(a.x - b.x, a.y - b.y) || 1,
      zoom: routeZoom(),
    };
  }
});

routeMapSvg.addEventListener('pointermove', (event) => {
  if (!routePointers.has(event.pointerId) || !routeGesture) return;
  routePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (routeGesture.kind === 'pinch' && routePointers.size >= 2) {
    const [a, b] = [...routePointers.values()];
    const distance = Math.hypot(a.x - b.x, a.y - b.y) || 1;
    zoomRouteMapAt(routeGesture.zoom * (distance / routeGesture.distance), (a.x + b.x) / 2, (a.y + b.y) / 2);
    return;
  }
  if (routeGesture.kind !== 'pan') return;
  const dx = event.clientX - routeGesture.startX;
  const dy = event.clientY - routeGesture.startY;
  if (!routeMapDragged && Math.hypot(dx, dy) < ROUTE_DRAG_PX) return;
  routeMapDragged = true;
  if (routeZoom() <= 1.01) return;
  // Screen pixels to map units: the whole view box fits the rendered map.
  const rect = routeMapSvg.getBoundingClientRect();
  const scale = Math.max(routeGesture.view.width / rect.width, routeGesture.view.height / rect.height);
  const { view } = routeGesture;
  setRouteView(clampedRouteView(ROUTE_MAP_BOX.width / view.width, view.x + view.width / 2 - dx * scale, view.y + view.height / 2 - dy * scale));
});

function endRoutePointer(event) {
  routePointers.delete(event.pointerId);
  if (routePointers.size === 1 && routeGesture?.kind === 'pinch') {
    // One finger stays after a pinch: it goes on dragging from where it is.
    const [rest] = [...routePointers.values()];
    routeGesture = { kind: 'pan', startX: rest.x, startY: rest.y, view: { ...routeView } };
  }
  if (!routePointers.size) routeGesture = null;
}

routeMapSvg.addEventListener('pointerup', endRoutePointer);
routeMapSvg.addEventListener('pointercancel', endRoutePointer);
routeMapSvg.addEventListener('wheel', (event) => {
  event.preventDefault();
  zoomRouteMapAt(routeZoom() * (event.deltaY < 0 ? 1.15 : 1 / 1.15), event.clientX, event.clientY);
}, { passive: false });

// A tap on a leg adds it to the route; a tap anywhere else on the map zooms. A drag is neither.
routeMapSvg.addEventListener('click', (event) => {
  if (routeMapDragged) {
    routeMapDragged = false;
    return;
  }
  const group = event.target.closest('.route-leg');
  if (group) tapRouteLeg(Number(group.dataset.legId));
  else tapRouteMap(event);
});
routeZoomIn.addEventListener('click', () => zoomRouteMapByStep(ROUTE_ZOOM_STEP));
routeZoomOut.addEventListener('click', () => zoomRouteMapByStep(1 / ROUTE_ZOOM_STEP));
routeZoomReset.addEventListener('click', () => setRouteView({ ...ROUTE_MAP_BOX }, { animate: true }));

// --- Route planner tutorial and the mentor's introduction ----------------------------

function routeTutorialWasSeen() {
  return routeEpisodeRecords(readProfileRecords(getUserProfileId()), ROUTE_TUTORIAL_SEEN_EVENT).length > 0;
}

function routeIntroWasSeen() {
  return routeEpisodeRecords(readProfileRecords(getUserProfileId()), ROUTE_INTRO_SEEN_EVENT).length > 0;
}

function routeTutorialTarget() {
  const target = routeTutorialSteps[routeTutorialIndex]?.screen_area?.target;
  return target ? routeScreen.querySelector(`[data-route-target="${CSS.escape(String(target))}"]`) : null;
}

function positionRouteTutorialFocus() {
  const target = routeTutorialTarget();
  routeTutorialFocus.hidden = !target;
  if (!target) return;
  const layerRect = routeTutorialLayer.getBoundingClientRect();
  const rect = target.getBoundingClientRect();
  const radius = Number.parseFloat(getComputedStyle(target).borderTopLeftRadius) || 12;
  routeTutorialFocus.style.left = `${rect.left - layerRect.left - ROUTE_FOCUS_PADDING}px`;
  routeTutorialFocus.style.top = `${rect.top - layerRect.top - ROUTE_FOCUS_PADDING}px`;
  routeTutorialFocus.style.width = `${rect.width + ROUTE_FOCUS_PADDING * 2}px`;
  routeTutorialFocus.style.height = `${rect.height + ROUTE_FOCUS_PADDING * 2}px`;
  routeTutorialFocus.style.borderRadius = `${radius + ROUTE_FOCUS_PADDING}px`;
}

function stopRouteTutorialVoice() {
  routeTutorialAudio.pause();
  routeTutorialAudio.removeAttribute('src');
  routeTutorialAudio.load();
  routeTutorialVoicePlaying = false;
  updateMusicFade();
}

function playRouteTutorialVoice(step) {
  stopRouteTutorialVoice();
  if (!step?.audio) return;
  routeTutorialAudio.src = publicAssetPath(step.audio_folder, step.audio, 'audio/route_tutorial');
  routeTutorialAudio.volume = 1;
  routeTutorialAudio.muted = muted;
  routeTutorialAudio.play()
    .then(() => {
      routeTutorialVoicePlaying = true;
      updateMusicFade();
    })
    .catch((error) => {
      routeTutorialVoicePlaying = false;
      updateMusicFade();
      console.info(`Озвучка шага ${step.queue ?? routeTutorialIndex + 1} туториала маршрутов пока недоступна.`, error);
    });
}

routeTutorialAudio.addEventListener('ended', () => {
  routeTutorialVoicePlaying = false;
  updateMusicFade();
});

routeTutorialAudio.addEventListener('error', () => {
  if (!routeTutorialAudio.getAttribute('src')) return;
  routeTutorialVoicePlaying = false;
  updateMusicFade();
  console.warn('Не удалось загрузить озвучку туториала маршрутов:', routeTutorialAudio.currentSrc);
});

function renderRouteTutorialStep() {
  const step = routeTutorialSteps[routeTutorialIndex];
  if (!step) return finishRouteTutorial();
  const last = routeTutorialIndex === routeTutorialSteps.length - 1;
  routeTutorialLayer.dataset.placement = step.screen_area?.message_placement || 'bottom';
  routeTutorialProgress.textContent = `ШАГ ${routeTutorialIndex + 1} ИЗ ${routeTutorialSteps.length}`;
  routeTutorialText.textContent = String(step.text || '');
  routeTutorialBack.disabled = routeTutorialIndex === 0;
  routeTutorialNext.innerHTML = last
    ? 'Понятно! <span aria-hidden="true">✓</span>'
    : 'Дальше <span aria-hidden="true">→</span>';
  requestAnimationFrame(positionRouteTutorialFocus);
  playRouteTutorialVoice(step);
}

function startRouteTutorial() {
  if (!routeTutorialSteps.length || routeTutorialWasSeen()) return false;
  routeTutorialIndex = 0;
  setHidden(routeTutorialLayer, false);
  renderRouteTutorialStep();
  routeTutorialNext.focus({ preventScroll: true });
  return true;
}

// Closing the tutorial, read through or skipped, lets the mentor explain the idea of the episode.
function finishRouteTutorial({ skipped = false } = {}) {
  if (routeTutorialLayer.classList.contains('is-hidden')) return false;
  stopRouteTutorialVoice();
  if (!routeTutorialWasSeen() && routeEpisode) {
    appendProfileRecord({
      'Тип события': ROUTE_TUTORIAL_SEEN_EVENT,
      'Профиль пользователя': getUserProfileId(),
      'Идентификатор эпизода': routeEpisode.id,
      'Игровой день': deriveRoomState(readProfileRecords(getUserProfileId())).day,
      'Пропущен': skipped,
    });
  }
  setHidden(routeTutorialLayer, true);
  routeTutorialFocus.hidden = true;
  return true;
}

function afterRouteTutorial() {
  if (!routeIntroWasSeen()) showRouteIntro();
}

// The mentor explains what an optimal decision is and how to find one without formulas.
function showRouteIntro() {
  const title = routeEpisode.title;
  showMentor('route-intro-what', {
    title,
    closeLabel: 'Дальше <span aria-hidden="true">→</span>',
    afterClose: () => showMentor('route-intro-how', {
      title,
      closeLabel: 'Понятно, строю <span aria-hidden="true">✓</span>',
      afterClose: () => {
        if (!routeEpisode) return;
        appendProfileRecord({
          'Тип события': ROUTE_INTRO_SEEN_EVENT,
          'Профиль пользователя': getUserProfileId(),
          'Идентификатор эпизода': routeEpisode.id,
          'Название эпизода': routeEpisode.title,
          'Игровой день': deriveRoomState(readProfileRecords(getUserProfileId())).day,
        });
      },
    }),
  });
}

routeTutorialNext.addEventListener('click', () => {
  if (routeTutorialIndex >= routeTutorialSteps.length - 1) {
    if (finishRouteTutorial()) afterRouteTutorial();
    return;
  }
  routeTutorialIndex += 1;
  renderRouteTutorialStep();
});
routeTutorialBack.addEventListener('click', () => {
  if (routeTutorialIndex === 0) return;
  routeTutorialIndex -= 1;
  renderRouteTutorialStep();
});
routeTutorialSkip.addEventListener('click', () => {
  if (finishRouteTutorial({ skipped: true })) afterRouteTutorial();
});
window.addEventListener('resize', () => {
  if (!routeTutorialLayer.classList.contains('is-hidden')) positionRouteTutorialFocus();
});

// The mouth area of the face texture: its centre and half size, measured between the fangs
// (they stay painted) and below the eyes.
const MOUTH = { x: .5, y: .79, rx: .13, ry: .105 };
// How fast the mouth opens and closes while the monster speaks, and how fast the whole
// talking mouth appears and disappears.
const TALK_SPEED = 9.5;
const TALK_FADE = 9;
// The mouth is painted on the texture, so speaking is animated in the face shader.
const monsterTalk = { level: 0, fade: 0, phase: 0 };

// Flies circle the head of a dirty monster. Each child of the Flies prop is a fly facing +Z; it flies
// round the prop's vertical axis at its own height, with its own speed and direction, and bobs.
const FLY_ORBITS = [
  { speed: 1.9, bob: .045, wobble: 3.1 },
  { speed: -1.4, bob: .06, wobble: 2.3 },
  { speed: 2.4, bob: .035, wobble: 3.7 },
];
const FLY_WING_MATERIAL = 'Fly Wing';
const FLY_WING_BEAT = 55;
let monsterFlies = null;
let monsterFliesTime = 0;

function updateMonsterFlies(delta) {
  const group = model?.getObjectByName('Flies');
  if (!group?.visible) return;
  monsterFlies ??= group.children.map((fly) => {
    const wings = [];
    fly.traverse((part) => { if (part.material?.name === FLY_WING_MATERIAL) wings.push(part); });
    return {
      fly,
      wings,
      radius: Math.hypot(fly.position.x, fly.position.z),
      angle: Math.atan2(fly.position.z, fly.position.x),
      height: fly.position.y,
    };
  });
  monsterFliesTime += delta;
  const time = monsterFliesTime;
  monsterFlies.forEach(({ fly, wings, radius, angle, height }, index) => {
    const orbit = FLY_ORBITS[index % FLY_ORBITS.length];
    const turn = angle + orbit.speed * time;
    // The circle breathes in and out a little, so the path wobbles like a real fly's.
    const reach = radius * (1 + .12 * Math.sin(time * orbit.wobble * 1.7 + index));
    fly.position.set(Math.cos(turn) * reach, height + orbit.bob * Math.sin(time * orbit.wobble + index * 2), Math.sin(turn) * reach);
    // Nose along the circle: its tangent, in the direction the fly goes round.
    const direction = Math.sign(orbit.speed);
    fly.rotation.set(0, Math.atan2(-Math.sin(turn) * direction, Math.cos(turn) * direction), 0);
    const beat = .35 + .65 * Math.abs(Math.sin(time * FLY_WING_BEAT + index));
    wings.forEach((wing) => { wing.scale.y = beat; });
  });
}

function updateMonsterTalk(delta, talking) {
  const uniforms = faceMaterial?.userData.pet;
  if (!uniforms) return;
  if (!talking && monsterTalk.fade < .001) return;
  monsterTalk.fade += ((talking ? 1 : 0) - monsterTalk.fade) * Math.min(1, delta * TALK_FADE);
  if (talking) {
    // Two waves out of step, so the mouth opens unevenly instead of ticking like a metronome.
    monsterTalk.phase += delta * TALK_SPEED;
    const open = Math.sin(monsterTalk.phase) * .5 + .5;
    const stress = Math.sin(monsterTalk.phase * .41 + 1.7) * .5 + .5;
    monsterTalk.level = .12 + .88 * open * (.4 + .6 * stress);
  } else {
    monsterTalk.level += (0 - monsterTalk.level) * Math.min(1, delta * TALK_FADE);
  }
  uniforms.petTalk.value = monsterTalk.level;
  uniforms.petTalkFade.value = monsterTalk.fade;
}

function patchMaterial(material, furMask, overlay, dirtMap) {
  const uniforms = {
    petFurMask: { value: furMask },
    petHue: { value: 0 },
    petSaturation: { value: 1 },
    petValue: { value: 1 },
    petDirtMap: { value: dirtMap },
    petDirt: { value: 0 },
    petOverlay: { value: overlay },
    petUseOverlay: { value: overlay ? 1 : 0 },
    petTalk: { value: 0 },
    petTalkFade: { value: 0 },
  };

  material.userData.pet = uniforms;
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
uniform sampler2D petFurMask;
uniform float petHue;
uniform float petSaturation;
uniform float petValue;
uniform sampler2D petDirtMap;
uniform float petDirt;
uniform sampler2D petOverlay;
uniform float petUseOverlay;
uniform float petTalk;
uniform float petTalkFade;
${HSV_GLSL}`)
      .replace('#include <map_fragment>', `#include <map_fragment>
{
  float fur = texture2D(petFurMask, vMapUv).r;
  diffuseColor.rgb = mix(diffuseColor.rgb, petAdjust(diffuseColor.rgb, petHue, petSaturation, petValue), fur);
  // Mud lies on the fur whatever its colour, and under the painted eyes and mouth.
  if (petDirt > 0.001) {
    vec4 petDirtColor = texture2D(petDirtMap, vMapUv);
    diffuseColor.rgb = mix(diffuseColor.rgb, petDirtColor.rgb, petDirtColor.a * petDirt);
  }
  if (petUseOverlay > 0.5) {
    vec4 petOverlayColor = texture2D(petOverlay, vMapUv);
    // While the monster speaks the painted mouth fades away between the fangs and an open
    // mouth is drawn in its place, as wide as petTalk.
    vec2 petMouthUv = (vMapUv - vec2(${MOUTH.x}, ${MOUTH.y})) / vec2(${MOUTH.rx}, ${MOUTH.ry});
    float petMouthPatch = 1.0 - smoothstep(0.82, 1.0, length(petMouthUv));
    petOverlayColor.a *= 1.0 - petMouthPatch * petTalkFade;
    diffuseColor.rgb = mix(diffuseColor.rgb, petOverlayColor.rgb, petOverlayColor.a);
    if (petTalkFade > 0.001) {
      float petOpen = mix(0.14, 1.0, petTalk);
      vec2 petLipUv = vec2(petMouthUv.x / 0.82, (petMouthUv.y + 0.34 - 0.34 * petOpen) / (0.62 * petOpen));
      float petMouthMask = (1.0 - smoothstep(0.88, 1.02, length(petLipUv))) * petTalkFade;
      float petTongue = 1.0 - smoothstep(0.6, 1.0, length(vec2(petLipUv.x / 0.72, (petLipUv.y - 0.62) / 0.66)));
      vec3 petMouthColor = mix(vec3(0.075, 0.011, 0.023), vec3(0.79, 0.18, 0.23), petTongue);
      diffuseColor.rgb = mix(diffuseColor.rgb, petMouthColor, petMouthMask);
    }
  }
}`);
  };
  material.needsUpdate = true;
}

function setMorph(name, value) {
  if (!model) return;
  model.traverse((object) => {
    if (!object.morphTargetDictionary || !(name in object.morphTargetDictionary)) return;
    object.morphTargetInfluences[object.morphTargetDictionary[name]] = value;
  });
}

function applyProfile() {
  if (!manifest || !model) return;

  const fur = manifest.profile.fur[profile.fur] || manifest.profile.fur[0];
  for (const material of petMaterials) {
    material.userData.pet.petHue.value = fur.hueShift / 360;
    material.userData.pet.petSaturation.value = fur.saturation;
    material.userData.pet.petValue.value = fur.value;
  }

  const earScale = manifest.profile.ears.scales[profile.ears] ?? 1;
  for (const boneName of manifest.profile.ears.bones) {
    model.getObjectByName(boneName)?.scale.setScalar(earScale);
  }

  const hornSize = manifest.profile.horns.sizes[profile.horns] ?? 0;
  setMorph(manifest.profile.horns.big, Math.max(hornSize, 0));
  setMorph(manifest.profile.horns.small, Math.max(-hornSize, 0));
}

function setMonsterDirt(amount) {
  for (const material of petMaterials) material.userData.pet.petDirt.value = amount;
}

function applyNeutralFace() {
  if (!manifest || !model) return;
  if (faceMaterial && faceOverlays.neutral) {
    faceMaterial.userData.pet.petOverlay.value = faceOverlays.neutral;
  }
  setMonsterDirt(0);
  setMorph('Belly_Thin', 0);
  for (const propName of manifest.props) {
    const prop = model.getObjectByName(propName);
    if (prop) prop.visible = false;
  }
}

function playDance() {
  if (!mixer || !manifest) return;
  const preferred = ['FunnyDancing_02', 'FunnyDancing_03'];
  const clipName = preferred.find((name) => manifest.clips.includes(name));
  const clip = THREE.AnimationClip.findByName(mixer.getRoot().animations || [], clipName);
  const fallbackClip = model?.userData.animations?.find((item) => item.name === clipName);
  const danceClip = clip || fallbackClip;
  if (!danceClip) return;

  mixer.stopAllAction();
  const action = mixer.clipAction(danceClip);
  action.setLoop(THREE.LoopRepeat, Infinity);
  action.reset().fadeIn(0.25).play();
}

function buildColorControls() {
  colorOptions.replaceChildren();
  manifest.profile.fur.forEach((fur, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'color-swatch';
    button.style.setProperty('--swatch', swatchColors[index] || '#7c3aed');
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-label', fur.label);
    button.setAttribute('aria-checked', String(index === profile.fur));
    button.title = fur.label;
    button.addEventListener('click', () => {
      profile.fur = index;
      syncControls();
      applyProfile();
    });
    colorOptions.append(button);
  });
}

function syncControls() {
  earsInput.value = String(profile.ears);
  hornsInput.value = String(profile.horns);
  earsValue.value = lengthLabels[profile.ears] || 'Обычные';
  hornsValue.value = hornLabels[profile.horns] || 'Обычные';

  if (manifest) {
    colorValue.value = manifest.profile.fur[profile.fur]?.label || 'Голубой';
    [...colorOptions.children].forEach((button, index) => {
      button.setAttribute('aria-checked', String(index === profile.fur));
    });
  }
}

earsInput.addEventListener('input', () => {
  profile.ears = Number(earsInput.value);
  syncControls();
  applyProfile();
});

hornsInput.addEventListener('input', () => {
  profile.horns = Number(hornsInput.value);
  syncControls();
  applyProfile();
});

async function loadTexture(path, colorTexture) {
  const texture = await new THREE.TextureLoader().loadAsync(`/model/${path}`);
  texture.flipY = false;
  texture.colorSpace = colorTexture ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  return texture;
}

function resizeRendererToParent() {
  if (!renderer || !camera || !renderer.domElement.parentElement) return;
  const parent = renderer.domElement.parentElement;
  const width = Math.floor(parent.clientWidth);
  const height = Math.floor(parent.clientHeight);
  if (width <= 0 || height <= 0) return;

  const canvas = renderer.domElement;
  const pixelRatio = renderer.getPixelRatio();
  const expectedWidth = Math.floor(width * pixelRatio);
  const expectedHeight = Math.floor(height * pixelRatio);
  if (canvas.width === expectedWidth && canvas.height === expectedHeight) return;

  renderer.setSize(width, height, false);
  if (shopController?.active) {
    resizeShopStage();
  } else if (pantryShelf?.active || feedingScale?.active) {
    resizeFeedingStage();
  } else if (earCleaning?.active) {
    resizeCleaningStage();
  } else if (parkController?.active) {
    parkController.resize(width, height);
  } else if (toyCompanion?.active) {
    toyCompanion.resize(width, height);
  } else if (roomController?.active) {
    roomController.resize(width, height);
  } else {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}

function attachRenderer(parent) {
  if (!renderer) return;
  parent.append(renderer.domElement);
  resizeRendererToParent();
}

function leaveRoom() {
  if (!roomController?.active) return;
  roomController.exit();
  scene = editorScene;
  camera = editorCamera;
  renderer.shadowMap.enabled = false;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

function leavePark() {
  parkRunId += 1;
  resetParkOverlay();
  if (!parkController?.active) return;
  parkController.exit();
  scene = editorScene;
  camera = editorCamera;
  renderer.shadowMap.enabled = false;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

async function enterPark(episode) {
  const records = readProfileRecords(getUserProfileId());
  const isStillDue = dueEconomicEpisodes(dataMartRows, records)
    .some((item) => String(item.id) === String(episode?.id));
  if (!isStillDue || episode?.title !== PARK_EPISODE_TITLE) return;

  const runId = ++parkRunId;
  closeRoomAction();
  closeRoomInbox();
  closeSavingsTransfer();
  hideRoomMessage();
  leaveRoom();
  showOnlyScreen(parkScreen);
  resetParkOverlay();
  parkTitle.textContent = episode.title;
  // The words of the walk are fetched while the park is still being built and the camera flies
  // over it, so the monster is heard the moment its line appears.
  monsterLines(episode).forEach((line) => warmUpVoice(publicAssetPath(line.audio_folder, line.audio, 'audio/park')));
  parkLoading.innerHTML = '<span class="loading-eye" aria-hidden="true"></span><span>Готовим парк к прогулке…</span>';
  parkLoading.classList.remove('is-hidden');

  try {
    await monsterReadyPromise;
    if (runId !== parkRunId) return;
    if (!renderer || !model || !mixer) throw new Error('3D-сцена недоступна');
    if (!parkController) {
      parkController = new MonsterPark({
        monster: model,
        mixer,
        animations: model.userData.animations,
        onStatus: (text) => { parkStatus.textContent = text; },
        onLoadProgress: (text) => {
          const label = parkLoading.querySelector('span:last-child');
          if (label) label.textContent = text;
        },
      });
    }
    parkReadyPromise ??= parkController.initialize();
    await parkReadyPromise;
    if (runId !== parkRunId) return;
    scene = parkController.scene;
    camera = parkController.camera;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    attachRenderer(parkStage);
    const state = deriveRoomState(readProfileRecords(getUserProfileId()));
    const stage = parkWalkStage(readProfileRecords(getUserProfileId()), episode);
    parkController.enter(state.name, { stage });
    applyMonsterLook(state);
    parkController.resize(parkStage.clientWidth, parkStage.clientHeight);
    parkLoading.classList.add('is-hidden');
    runParkWalk(episode, stage, runId);
  } catch (error) {
    console.error('Не удалось собрать парк:', error);
    parkLoading.innerHTML = '<span class="loading-eye" aria-hidden="true"></span><span>Парк пока не открылся.<br>Попробуй ещё раз!</span>';
  }
}

parkBack.addEventListener('click', () => {
  leavePark();
  enterRoom();
});

// --- Park walk ----------------------------------------------------------------

// The test the walk puts the player to: fun money versus a required purchase coming soon.
const PARK_TEST_CONTENT = 'Испытание в парке. Проверка на исключение лишних трат, при наличии в ближайшем будущем обязательных расходов';
const PARK_MOOD_REASON = 'Прогулка в парке: монстрику нравятся парк, солнышко и мячик';
const PARK_HOME_FOR_SAVINGS_EVENT = 'Возвращение домой за деньгами из копилки';
// The monster's own words: data mart rows with the episode's title, spoken in `queue` order.
const MONSTER_LINE_OBJECT_TYPE = 'Monster line';
const STAT_ICONS = { health: '❤️', mood: '😊', development: '🧠' };
const STAT_GENITIVE = { health: 'здоровью', mood: 'настроению', development: 'развитию' };
// The racket is the right choice: it pleases the monster and helps it develop for a long time,
// and it still leaves money for the nose cleaner that the briefing named as a must. The mentor
// cancels every other choice, so only the racket ever reaches its `reaction`.
const PARK_CHOICES = [
  {
    id: 'nothing',
    icon: '🙅',
    title: 'Ничего не покупать',
    purchase: null,
    price: 0,
    stats: {},
    right: false,
    trigger: 'park-nothing',
    reaction: { clip: 'Mood_sad', look: 'sad', prop: null, status: 'грустно вздыхает' },
    explanation: 'Игрок решил ничего не покупать. Ментор отменил решение и предложил выбрать заново: монстрик остался бы без радости, а моральное состояние питомца так же важно, как материальное, и небольшая трата на веселье не мешала обязательным расходам.',
  },
  {
    id: 'icecream',
    icon: '🍦',
    title: 'Купить мороженое',
    purchase: 'мороженое',
    price: 23,
    stats: { mood: 2 },
    right: false,
    trigger: 'park-icecream',
    reaction: { clip: 'FunnyDancing_02', look: 'happy', prop: 'icecream', status: 'уплетает мороженое' },
    explanation: 'Игрок выбрал мороженое за 23 монеты (настроение +2). Ментор отменил покупку и предложил выбрать заново: обязательные расходы не пострадали бы, но радость кратковременная, а за те же деньги ракетка дала бы долгий эффект — и настроение, и развитие.',
  },
  {
    id: 'icecream-ride',
    icon: '🎡',
    title: 'Купить мороженое и посетить аттракцион',
    purchase: 'мороженое и аттракцион',
    price: 48,
    stats: { mood: 4 },
    right: false,
    trigger: 'park-icecream-ride',
    reaction: { clip: 'FunnyDancing_03', look: 'happy', prop: 'icecream', status: 'пляшет от восторга' },
    explanation: 'Игрок выбрал мороженое и аттракцион за 48 монет (настроение +4). Ментор отменил покупку и предложил выбрать заново: кратковременное удовольствие за крупную сумму, когда скоро обязательная покупка удалителя козявок, — недальновидная трата.',
  },
  {
    id: 'racket',
    icon: '🎾',
    title: 'Купить теннисную ракетку',
    purchase: 'теннисная ракетка',
    price: 23,
    stats: { mood: 1, development: 2 },
    right: true,
    trigger: 'park-racket',
    reaction: { clip: 'Greetings', look: 'happy', prop: 'racket', status: 'машет новой ракеткой' },
    explanation: 'Игрок купил теннисную ракетку за 23 монеты: настроение +1, развитие +2. Долгосрочный положительный эффект, и покупка не мешает купить обязательный удалитель козявок.',
  },
];
const PARK_REACTION_SECONDS = 3;
// Room for the tail of the speech bubble and a little air above the panels.
const PARK_PANEL_GAP = 26;
let shownParkLine = null;
let parkSpeechResolve = null;
let parkChoiceState = null;

function monsterLines(episode) {
  return dataMartRows
    .filter((row) => row?.object_type === MONSTER_LINE_OBJECT_TYPE && row.title === episode.title)
    .sort((left, right) => Number(left.queue) - Number(right.queue));
}

function recordsOfToday(records, predicate) {
  const { day } = deriveRoomState(records);
  return records.some((record) => Number(record?.['Игровой день']) === day && predicate(record));
}

// The right choice the player made at the kiosk today, or null while they are still choosing.
function parkChoiceRecord(records, episode) {
  const { day } = deriveRoomState(records);
  return records.find((record) => Number(record?.['Игровой день']) === day
    && record['Тип события'] === RIGHT_DECISION_EVENT
    && record['Эпизод'] === PARK_TEST_CONTENT
    && String(record['Идентификатор эпизода']) === String(episode.id)) ?? null;
}

// Once the test has begun today, a player who comes back finds the monster at the kiosk; once it
// is paid for, only the poster by the board is left, and the walk starts right there.
function parkWalkStage(records, episode) {
  const tested = recordsOfToday(records, (record) => record['Тип события'] === EPISODE_EVENT
    && record['Содержание события'] === PARK_TEST_CONTENT
    && String(record['Идентификатор эпизода']) === String(episode.id));
  if (!tested) return 'court';
  return parkChoiceRecord(records, episode) ? 'board' : 'kiosk';
}

async function runParkWalk(episode, stage, runId) {
  const alive = () => runId === parkRunId && Boolean(parkController?.active);
  // The racket is already bought: the monster stands by the poster and waits for the answer,
  // without which the episode is not over and the day cannot end.
  if (stage === 'board') {
    parkBack.hidden = true;
    if (!(await dreamOfTheFestival(episode, runId, { alreadyThere: true })) || !alive()) return;
    completeParkEpisode(episode);
    // The walk is over: the answer stays on the screen and the player goes home when ready.
    parkBack.hidden = false;
    return;
  }
  if (stage === 'court') {
    const [courtLine, kioskLine] = monsterLines(episode);
    if (!(await parkController.flyIn()) || !alive()) return;
    parkController.wave();
    if (!(await sayParkLine(courtLine)) || !alive()) return;
    const cheered = grantParkMood(episode);
    if (cheered) await parkController.react('FunnyDancing_02', 2.4, { status: 'пританцовывает от радости' });
    if (!alive() || !(await parkController.runTo('kiosk')) || !alive()) return;
    if (!(await sayParkLine(kioskLine)) || !alive()) return;
  }
  openParkChoice(episode);
}

// --- The monster speaks ---

function stopParkVoice() {
  parkVoiceAudio.pause();
  parkVoiceAudio.removeAttribute('src');
  parkVoiceAudio.load();
  parkVoicePlaying = false;
  updateMusicFade();
}

async function playParkVoice(line) {
  stopParkVoice();
  if (!line?.audio) return;

  const url = publicAssetPath(line.audio_folder, line.audio, 'audio/park');
  // Normally the warm-up is long over; when it is not, waiting for the download it has already
  // started is still quicker than asking for the same file a second time.
  const source = (await warmUpVoice(url)) ?? url;
  // The player may have moved on to the next line while the file was on its way.
  if (shownParkLine !== line) return;
  parkVoiceAudio.src = source;
  parkVoiceAudio.volume = 1;
  parkVoiceAudio.muted = muted;
  parkVoiceAudio.play()
    .then(() => {
      parkVoicePlaying = true;
      updateMusicFade();
    })
    .catch((error) => {
      parkVoicePlaying = false;
      updateMusicFade();
      console.info(`Озвучка реплики монстра ${line.id} пока недоступна.`, error);
    });
}

parkVoiceAudio.addEventListener('ended', () => {
  parkVoicePlaying = false;
  updateMusicFade();
});

parkVoiceAudio.addEventListener('error', () => {
  if (!parkVoiceAudio.getAttribute('src')) return;
  parkVoicePlaying = false;
  updateMusicFade();
  console.warn('Не удалось загрузить озвучку реплики монстра:', parkVoiceAudio.currentSrc);
});

// The words stay on screen and in the voice until the player taps «Дальше»; true then, false when
// the player has left the park. A missing row is simply skipped.
function sayParkLine(line) {
  if (!line) return Promise.resolve(true);
  finishParkLine(false);
  shownParkLine = line;
  parkSpeechName.textContent = deriveRoomState(readProfileRecords(getUserProfileId())).name;
  parkSpeechText.textContent = String(line.text || '');
  parkSpeech.hidden = false;
  updateParkInsets();
  playParkVoice(line);
  parkSpeechNext.focus({ preventScroll: true });
  return new Promise((resolve) => { parkSpeechResolve = resolve; });
}

function finishParkLine(result) {
  const resolve = parkSpeechResolve;
  parkSpeechResolve = null;
  shownParkLine = null;
  stopParkVoice();
  parkSpeech.hidden = true;
  updateParkInsets();
  resolve?.(result);
}

parkSpeechNext.addEventListener('click', () => finishParkLine(true));
parkSpeechRepeat.addEventListener('click', () => playParkVoice(shownParkLine));

// --- Stats ---

// Adds the changes to the monster's stats, one log record per stat that really moved.
// Health and development are bounded; mood keeps earned points above the visual scale.
function changeMonsterStats(changes, reason, extra = {}) {
  const profileId = getUserProfileId();
  const state = deriveRoomState(readProfileRecords(profileId));
  return Object.entries(changes).map(([key, requested]) => {
    const before = state.stats[key];
    const after = clampStat(before + requested, key);
    if (after !== before) {
      appendProfileRecord({
        'Тип события': MONSTER_STAT_EVENT,
        'Профиль пользователя': profileId,
        'Характеристика': STAT_LABELS[key],
        'Изменение': after - before,
        'Было': before,
        'Стало': after,
        'Причина': reason,
        'Игровой день': state.day,
        ...extra,
      });
    }
    return { key, requested, before, after };
  });
}

function formatStat(value) {
  return value > 0 ? `+${value}` : value < 0 ? `−${-value}` : '0';
}

function showParkStatToast({ key, requested, before, after }) {
  const item = document.createElement('li');
  item.className = 'park-toast';
  const icon = document.createElement('span');
  icon.className = 'park-toast-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = STAT_ICONS[key] ?? '⭐';
  const body = document.createElement('span');
  const title = document.createElement('strong');
  const note = document.createElement('small');
  if (after !== before) {
    const change = document.createElement('b');
    change.textContent = formatStat(after - before);
    title.append(`${STAT_LABELS[key]} `, change);
    // The scale stops at STAT_MAX, so a bigger gift is cut down to what fits.
    note.textContent = `было ${formatStat(before)} → стало ${formatStat(after)}`
      + (after - before !== requested ? ', это максимум' : '');
  } else {
    title.textContent = `${STAT_LABELS[key]} на максимуме`;
    note.textContent = `выше ${formatStat(after)} не бывает`;
  }
  body.append(title, note);
  item.append(icon, body);
  parkToasts.append(item);
  window.setTimeout(() => item.remove(), 3800);
}

// The walk itself cheers the monster up once a day: +1 to the mood, and the player is told so.
function grantParkMood(episode) {
  const records = readProfileRecords(getUserProfileId());
  const granted = recordsOfToday(records, (record) => record['Тип события'] === MONSTER_STAT_EVENT
    && record['Причина'] === PARK_MOOD_REASON);
  if (granted) return false;
  changeMonsterStats({ mood: 1 }, PARK_MOOD_REASON, { 'Идентификатор эпизода': episode.id })
    .forEach(showParkStatToast);
  applyMonsterLook(deriveRoomState(readProfileRecords(getUserProfileId())), 'happy');
  return true;
}

// --- The choice at the kiosk ---

// The picture keeps the monster between the title card and whatever panel is open at the bottom.
function updateParkInsets() {
  if (!parkController?.active) return;
  const panel = [parkChoice, parkGoal, parkSpeech].find((element) => !element.hidden);
  if (!panel) {
    parkController.setInsets(0, 0);
    return;
  }
  // Layout offsets, not client rects: the panels pop in with a transform that would skew the measure.
  const top = parkHud.offsetTop + parkHud.offsetHeight;
  const bottom = parkScreen.clientHeight - panel.offsetTop + PARK_PANEL_GAP;
  parkController.setInsets(top, bottom);
}

function openParkChoice(episode) {
  const profileId = getUserProfileId();
  const records = readProfileRecords(profileId);
  const { day } = deriveRoomState(records);
  if (parkWalkStage(records, episode) !== 'kiosk') {
    logEpisode(PARK_TEST_CONTENT, {
      'Название эпизода': episode.title,
      'Идентификатор эпизода': episode.id,
      'Игровой день': day,
    });
  }
  parkChoiceState = { episode, selected: null };
  renderParkChoice();
  parkChoice.hidden = false;
  parkController?.faceCamera();
  parkController?.setStatus('ждёт, что ты решишь');
  updateParkInsets();
}

function closeParkChoice() {
  parkChoiceState = null;
  parkChoice.hidden = true;
  updateParkInsets();
}

function renderParkChoice() {
  if (!parkChoiceState) return;
  const { pocket, savings } = deriveRoomState(readProfileRecords(getUserProfileId()));
  parkChoicePocket.textContent = formatCoins(pocket);
  parkChoiceSavings.textContent = formatCoins(Math.max(0, savings));

  parkChoiceList.replaceChildren(...PARK_CHOICES.map((choice) => {
    const shortage = choice.price - pocket;
    const affordable = shortage <= 0;
    const item = document.createElement('li');
    item.className = 'park-choice-item';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'park-option';
    button.dataset.choice = choice.id;
    button.disabled = !affordable;
    button.setAttribute('aria-pressed', String(parkChoiceState.selected === choice.id));
    const icon = document.createElement('span');
    icon.className = 'park-option-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = choice.icon;
    const body = document.createElement('span');
    body.className = 'park-option-body';
    const title = document.createElement('span');
    title.className = 'park-option-title';
    title.textContent = choice.title;
    body.append(title);
    const effects = Object.entries(choice.stats);
    if (effects.length) {
      const chips = document.createElement('span');
      chips.className = 'park-option-effects';
      chips.append(...effects.map(([key, value]) => {
        const chip = document.createElement('span');
        chip.textContent = `${STAT_ICONS[key]} ${formatStat(value)} к ${STAT_GENITIVE[key]}`;
        return chip;
      }));
      body.append(chips);
    }
    const price = document.createElement('span');
    price.className = 'park-option-price';
    price.textContent = formatCoins(choice.price);
    button.append(icon, body, price);
    item.append(button);

    // Short of pocket money: either the piggy bank covers the rest, or the option is out of reach.
    if (!affordable && Math.max(0, savings) >= shortage) {
      const home = document.createElement('button');
      home.type = 'button';
      home.className = 'park-option-home';
      home.dataset.homeFor = choice.id;
      const homeIcon = document.createElement('span');
      homeIcon.setAttribute('aria-hidden', 'true');
      homeIcon.textContent = '🏠';
      const homeText = document.createElement('span');
      homeText.textContent = 'Вернуться домой, чтобы взять деньги из копилки';
      const missing = document.createElement('small');
      missing.textContent = `не хватает ${formatCoins(shortage)}`;
      home.append(homeIcon, homeText, missing);
      item.append(home);
    } else if (!affordable) {
      const note = document.createElement('p');
      note.className = 'park-option-note';
      note.textContent = `Не хватает ${formatCoins(shortage)} — даже вместе с копилкой`;
      item.append(note);
    }
    return item;
  }));

  const selected = PARK_CHOICES.find((choice) => choice.id === parkChoiceState.selected);
  parkChoiceConfirm.disabled = !selected;
  if (!selected) parkChoiceConfirm.textContent = 'Выбери вариант';
  else if (selected.price > 0) parkChoiceConfirm.textContent = `Купить за ${formatCoins(selected.price)}`;
  else parkChoiceConfirm.textContent = 'Ничего не покупать';
}

parkChoiceList.addEventListener('click', (event) => {
  if (!parkChoiceState) return;
  const home = event.target.closest('.park-option-home');
  if (home) {
    goHomeForSavings(PARK_CHOICES.find((choice) => choice.id === home.dataset.homeFor));
    return;
  }
  const option = event.target.closest('.park-option');
  if (!option || option.disabled) return;
  parkChoiceState.selected = option.dataset.choice;
  renderParkChoice();
  updateParkInsets();
});

parkChoiceConfirm.addEventListener('click', () => {
  const choice = PARK_CHOICES.find((item) => item.id === parkChoiceState?.selected);
  if (choice) decideParkChoice(choice);
});

// The player goes for the piggy bank; the room opens it with the missing coins already set
// (after its tutorial the first time), and the walk waits at the kiosk.
function goHomeForSavings(choice) {
  if (!choice || !parkChoiceState) return;
  const profileId = getUserProfileId();
  const { day, pocket } = deriveRoomState(readProfileRecords(profileId));
  const shortage = Math.max(0, choice.price - pocket);
  appendProfileRecord({
    'Тип события': PARK_HOME_FOR_SAVINGS_EVENT,
    'Профиль пользователя': profileId,
    'Идентификатор эпизода': parkChoiceState.episode.id,
    'Название эпизода': parkChoiceState.episode.title,
    'Вариант': choice.title,
    'Стоимость': choice.price,
    'Не хватает': shortage,
    'Игровой день': day,
  });
  pendingSavingsShortage = shortage;
  leavePark();
  enterRoom();
}

// A learning game, as in the shop: a wrong choice is stopped before any money moves. The mentor
// explains it and the player chooses again; only the right one spends, changes the stats
// and finishes the episode.
function decideParkChoice(choice) {
  const { episode } = parkChoiceState;
  const profileId = getUserProfileId();
  const records = readProfileRecords(profileId);
  const state = deriveRoomState(records);
  if (choice.price > state.pocket) {
    renderParkChoice();
    return;
  }
  const decision = {
    episode: PARK_TEST_CONTENT,
    'Название эпизода': episode.title,
    'Идентификатор эпизода': episode.id,
    'Выбор': choice.title,
    'Стоимость': choice.price,
    'Карманные деньги до': state.pocket,
    'В копилке': state.savings,
    'Игровой день': state.day,
  };
  closeParkChoice();

  if (!choice.right) {
    logDecision(false, {
      ...decision,
      'Изменение карманных денег': 0,
      'Карманные деньги после': state.pocket,
      'Решение отменено ментором': true,
      explanation: choice.explanation,
    });
    showMentor(choice.trigger, {
      title: PARK_EPISODE_TITLE,
      closeLabel: 'Выбрать заново <span aria-hidden="true">↺</span>',
      afterClose: () => {
        if (parkController?.active) openParkChoice(episode);
      },
    });
    return;
  }
  parkBack.hidden = true;

  const purpose = `${episode.title}: ${choice.purchase}`;
  if (choice.price > 0) {
    appendProfileRecord({
      'Тип события': POCKET_SPENDING_EVENT,
      'Профиль пользователя': profileId,
      'Значение': choice.price,
      'Назначение': purpose,
      'Игровой день': state.day,
    });
    // The analytics mirror of the spending and its charge to the fun article, as in the shop.
    appendProfileRecord({
      'Тип события': POCKET_TOPUP_EVENT,
      'Профиль пользователя': profileId,
      'Значение': -choice.price,
      'Назначение': purpose,
      'Игровой день': state.day,
    });
    appendProfileRecord({
      'Тип события': BUDGET_FACT_EVENT,
      'Профиль пользователя': profileId,
      'Номер бюджета': currentBudgetNumber(records),
      'Статья бюджета': FUN_ARTICLE,
      'Изменение статьи': choice.price,
      'Игровой день': state.day,
    });
  }
  const statChanges = changeMonsterStats(
    choice.stats,
    `${episode.title}: ${choice.purchase ?? 'ничего не куплено'}`,
    { 'Идентификатор эпизода': episode.id },
  );
  logDecision(true, {
    ...decision,
    'Изменение карманных денег': -choice.price,
    'Карманные деньги после': state.pocket - choice.price,
    explanation: choice.explanation,
  });

  const moneyNote = choice.price > 0
    ? `Потрачено ${formatCoins(choice.price)} · в кармане осталось ${formatCoins(state.pocket - choice.price)}`
    : `Монеты остались в кармане: ${formatCoins(state.pocket)}`;
  playParkReaction(choice, statChanges, moneyNote, episode);
}

async function playParkReaction(choice, statChanges, moneyNote, episode) {
  const runId = parkRunId;
  const { reaction } = choice;
  statChanges.forEach(showParkStatToast);
  applyMonsterLook(deriveRoomState(readProfileRecords(getUserProfileId())), reaction.look);
  parkController.holdProp(reaction.prop);
  const reacted = await parkController.react(reaction.clip, PARK_REACTION_SECONDS, { status: reaction.status });
  if (!reacted || runId !== parkRunId) return;
  // Still holding the new racket, the monster runs to the poster and asks for the festival.
  if (!(await dreamOfTheFestival(episode, runId))) return;
  completeParkEpisode(episode);
  showMentor(choice.trigger, {
    title: PARK_EPISODE_TITLE,
    extra: moneyNote,
    closeLabel: 'Домой <span aria-hidden="true">→</span>',
    afterClose: () => {
      leavePark();
      enterRoom();
    },
  });
}

// The walk ends with the answer about the poster, not with the purchase at the kiosk: until this
// record is written the episode stays on the main screen, and the day waits for it (row 70).
function completeParkEpisode(episode) {
  const profileId = getUserProfileId();
  const records = readProfileRecords(profileId);
  if (isEconomicEpisodeCompleted(records, episode)) return;
  const choice = parkChoiceRecord(records, episode);
  appendProfileRecord({
    'Тип события': ECONOMIC_EPISODE_COMPLETED_EVENT,
    'Профиль пользователя': profileId,
    'Идентификатор эпизода': episode.id,
    'Название эпизода': episode.title,
    'Результат': choice?.['Выбор'] ?? '',
    // Only the right choice gets this far: the mentor sends a wrong one back to the kiosk.
    'Правильное решение': true,
    'Игровой день': deriveRoomState(records).day,
  });
}

// --- The poster on the board: a new savings goal ---

// The monster's words by the board, and the goal the data mart opens on that game day.
const BOARD_LINE_TRIGGER = 'park-event-board';
const SAVINGS_GOAL_OBJECT_TYPE = 'Savings goal';
const SAVINGS_GOAL_EVENT = 'Появление крупной финансовой цели';
const SHOP_GOAL_SOURCE = 'Рекомендация магазина после покупки';

function savingsGoalOfDay(day) {
  const goals = dataMartRows.filter((row) => row?.object_type === SAVINGS_GOAL_OBJECT_TYPE);
  return goals.find((row) => Number(row.day_is_it_available) === day) ?? goals[0] ?? null;
}

// The goal of exactly this game day, or none: unlike the park, the shop must not fall back to
// a goal that belongs to another day.
function savingsGoalForDay(day) {
  return dataMartRows.find(
    (row) => row?.object_type === SAVINGS_GOAL_OBJECT_TYPE && Number(row.day_is_it_available) === day,
  ) ?? null;
}

let parkGoalResolve = null;

// Offers the goal and waits for the player: true when accepted, false when put off,
// null when the player has left the park meanwhile.
function askAboutGoal(goal) {
  const { savings } = deriveRoomState(readProfileRecords(getUserProfileId()));
  parkGoalName.textContent = goal.title || 'Новая цель';
  parkGoalText.textContent = goal.text || '';
  parkGoalText.hidden = !goal.text;
  parkGoalPrice.textContent = formatCoins(Number(goal.price) || 0);
  parkGoalSavings.textContent = formatCoins(Math.max(0, savings));
  parkGoalImage.hidden = !goal.image;
  if (goal.image) {
    parkGoalImage.src = publicAssetPath(goal.image_folder, goal.image, 'images');
    parkGoalImage.alt = `Афиша «${goal.title}»`;
  }
  parkGoal.hidden = false;
  parkController?.faceCamera();
  parkController?.setStatus('ждёт, что ты решишь');
  updateParkInsets();
  parkGoalAccept.focus({ preventScroll: true });
  return new Promise((resolve) => { parkGoalResolve = resolve; });
}

function closeParkGoal(result) {
  const resolve = parkGoalResolve;
  parkGoalResolve = null;
  parkGoal.hidden = true;
  updateParkInsets();
  resolve?.(result);
}

parkGoalAccept.addEventListener('click', () => closeParkGoal(true));
parkGoalDecline.addEventListener('click', () => closeParkGoal(false));

function logSavingsGoalDecision(goal, episode, accepted, extra = {}) {
  const profileId = getUserProfileId();
  const state = deriveRoomState(readProfileRecords(profileId));
  appendProfileRecord({
    'Тип события': SAVINGS_GOAL_DECISION_EVENT,
    'Профиль пользователя': profileId,
    'Идентификатор цели': goal.id,
    'Название цели': goal.title,
    'Стоимость': Number(goal.price) || 0,
    'Решение': accepted ? 'Цель принята' : 'Цель отклонена',
    'Цель принята': accepted,
    'В копилке': state.savings,
    'Название эпизода': episode.title,
    'Идентификатор эпизода': episode.id,
    ...extra,
    'Игровой день': state.day,
  });
}

// The goal is written to the log once per profile, however often the park is visited.
function logSavingsGoal(goal, episode, extra = {}) {
  const profileId = getUserProfileId();
  const records = readProfileRecords(profileId);
  const known = records.some((record) => record?.['Тип события'] === SAVINGS_GOAL_EVENT
    && String(record['Идентификатор цели']) === String(goal.id));
  if (known) return false;
  appendProfileRecord({
    'Тип события': SAVINGS_GOAL_EVENT,
    'Профиль пользователя': profileId,
    'Идентификатор цели': goal.id,
    'Название цели': goal.title,
    'Описание цели': goal.text ?? '',
    'Стоимость': Number(goal.price) || 0,
    'Название эпизода': episode.title,
    'Идентификатор эпизода': episode.id,
    ...extra,
    'Игровой день': deriveRoomState(records).day,
  });
  return true;
}

function showGoalToast(goal, accepted, list = parkToasts) {
  const item = document.createElement('li');
  item.className = 'park-toast';
  const icon = document.createElement('span');
  icon.className = 'park-toast-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = accepted ? '🎯' : '💤';
  const body = document.createElement('span');
  const title = document.createElement('strong');
  title.textContent = accepted ? `Новая цель: «${goal.title}»` : `Цель отложена: «${goal.title}»`;
  const note = document.createElement('small');
  note.textContent = accepted
    ? `${formatCoins(Number(goal.price) || 0)} — на это копят в копилке`
    : 'к ней можно вернуться позже';
  body.append(title, note);
  item.append(icon, body);
  list.append(item);
  window.setTimeout(() => item.remove(), 5200);
}

// --- Допродажа: магазин рекомендует крупную цель, на которую копят ---

// Shops share the recommendation card and differ only in its markup (#<prefix>-goal-…).
// ask(goal) resolves true when accepted, false when put off, null when the shop was left meanwhile.
function createGoalOffer(prefix, defaultImageFolder) {
  const part = (name) => $(`#${prefix}-goal${name}`);
  const sheet = part('');
  const image = part('-image');
  let resolveOffer = null;
  // A picture that has not been drawn yet must not show up as a broken image.
  image.addEventListener('error', () => { image.hidden = true; });

  function close(result) {
    const resolve = resolveOffer;
    resolveOffer = null;
    sheet.hidden = true;
    resolve?.(result);
  }
  part('-accept').addEventListener('click', () => close(true));
  part('-decline').addEventListener('click', () => close(false));

  function ask(goal) {
    const { savings } = deriveRoomState(readProfileRecords(getUserProfileId()));
    part('-name').textContent = goal.title || 'Новая цель';
    part('-text').textContent = goal.text || '';
    part('-text').hidden = !goal.text;
    part('-price').textContent = formatCoins(Number(goal.price) || 0);
    part('-savings').textContent = formatCoins(Math.max(0, savings));
    image.hidden = !goal.image;
    if (goal.image) {
      image.src = publicAssetPath(goal.image_folder, goal.image, defaultImageFolder);
      image.alt = goal.title || '';
    }
    sheet.hidden = false;
    part('-accept').focus({ preventScroll: true });
    return new Promise((resolve) => { resolveOffer = resolve; });
  }

  return { ask, close };
}

// The ordinary cross-sell of a shop, turned into a lesson: right after a successful purchase the
// shop recommends something far too expensive to buy today. It is not sold on the spot — it is
// offered as a goal to save up for, once per profile, and both answers go into the log.
async function offerShopGoal(goal, offer, source, toasts) {
  const state = deriveRoomState(readProfileRecords(getUserProfileId()));
  if (!goal || state.decidedSavingsGoals.has(String(goal.id))) return;

  const where = { 'Источник': SHOP_GOAL_SOURCE };
  logSavingsGoal(goal, source, where);
  const accepted = await offer.ask(goal);
  if (accepted === null) return;
  logSavingsGoalDecision(goal, source, accepted, where);
  showGoalToast(goal, accepted, toasts);
}

// Still holding the racket, the monster runs to the event board and says out loud how it misses
// the crowd of monsters it grew up with in the shelter: the festival on the poster becomes the
// player's new big goal. False when the player has left the park meanwhile.
async function dreamOfTheFestival(episode, runId, { alreadyThere = false } = {}) {
  const alive = () => runId === parkRunId && Boolean(parkController?.active);
  if (!alreadyThere && (!(await parkController.runTo('board')) || !alive())) return false;
  const line = monsterLines(episode).find((row) => row.trigger === BOARD_LINE_TRIGGER);
  if (!(await sayParkLine(line)) || !alive()) return false;
  const goal = savingsGoalOfDay(deriveRoomState(readProfileRecords(getUserProfileId())).day);
  if (!goal) {
    console.warn('В дата-марте нет крупной финансовой цели для этого игрового дня.');
    return true;
  }
  logSavingsGoal(goal, episode);
  // The player decides whether this becomes their goal; both answers go into the log.
  const accepted = await askAboutGoal(goal);
  if (accepted === null || !alive()) return false;
  logSavingsGoalDecision(goal, episode, accepted);
  showGoalToast(goal, accepted);
  return true;
}

// Clears the speech, the choice and the toasts, so the next visit starts clean.
function resetParkOverlay() {
  finishParkLine(false);
  closeParkGoal(null);
  parkChoiceState = null;
  parkChoice.hidden = true;
  parkToasts.replaceChildren();
  parkBack.hidden = false;
}

window.addEventListener('resize', () => {
  if (parkController?.active) updateParkInsets();
});

// `settleIn`: the player has just come home from the budget, so the room gets its quiet second
// even when this profile has already lived through a day.
async function enterRoom({ settleIn = false, skipDayOpening = false } = {}) {
  showOnlyScreen(finishScreen);
  closeRoomAction();
  closeRoomInbox();
  closeTaskList();
  closeSavingsTransfer();
  hideRoomMessage();
  renderRoomHud();
  attachRenderer(finishMonsterStage);
  roomLoading.classList.remove('is-hidden');
  // The room plays the music of the current day; the first arrival is about to start day 1.
  switchToDayMusic(Math.max(1, deriveRoomState(readProfileRecords(getUserProfileId())).day));

  try {
    await monsterReadyPromise;
    if (!roomController) throw new Error('3D-модель монстра не загрузилась');
    if (!roomReadyPromise) roomReadyPromise = roomController.initialize();
    await roomReadyPromise;
    scene = roomController.scene;
    camera = roomController.camera;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    attachRenderer(finishMonsterStage);
    roomController.enter(finishName.textContent.trim());
    const firstArrival = settleIn || !hasStartedGameDay();
    saveFirstRoomOpen();
    renderRoomHud();
    roomController.resize(finishMonsterStage.clientWidth, finishMonsterStage.clientHeight);
    roomLoading.classList.add('is-hidden');

    const records = readProfileRecords(getUserProfileId());
    if (hasPendingFinalGoalChoice(records)) {
      if (maybeFinishFinalGame()) return;
      if (unboughtGoals(records).length) {
        chooseNextGoals().then((keepSaving) => { if (keepSaving) enterRoom(); });
        return;
      }
    }

    // On the very first arrival the icons stay deaf for a moment, so nothing gets tapped
    // by accident before the monster has anything to say.
    if (firstArrival) {
      setRoomActionsEnabled(false);
      await delay(ROOM_FIRST_ENTRY_PAUSE_SECONDS * 1000);
      setRoomActionsEnabled(true);
    }
    if (!skipDayOpening) openRoomDay();
  } catch (error) {
    setRoomActionsEnabled(true);
    console.error('Не удалось собрать комнату:', error);
    roomLoading.innerHTML = '<span class="loading-eye" aria-hidden="true"></span><span>Комната пока не собралась.<br>Обнови страницу!</span>';
  }
}

async function initializeMonster() {
  try {
    manifest = await fetch('/model/pet-manifest.json').then((response) => {
      if (!response.ok) throw new Error(`Манифест модели: ${response.status}`);
      return response.json();
    });
    profile = { ...manifest.profile.default };
    buildColorControls();
    syncControls();

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;

    editorScene = new THREE.Scene();
    editorCamera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    editorCamera.position.set(1.35, 1.42, 5.8);
    editorCamera.lookAt(0, 1.03, 0);
    scene = editorScene;
    camera = editorCamera;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x7770a0, 2.0));
    const keyLight = new THREE.DirectionalLight(0xfff1df, 2.4);
    keyLight.position.set(-3, 5, 4);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x9ddcff, 1.35);
    rimLight.position.set(4, 2, -3);
    scene.add(rimLight);

    const gltf = await new GLTFLoader().loadAsync('/model/monster.glb');
    model = gltf.scene;
    model.userData.animations = gltf.animations;
    scene.add(model);

    const overlayEntries = Object.entries(manifest.materials.Face.overlays);
    const overlayTextures = await Promise.all(
      overlayEntries.map(async ([name, path]) => [name, await loadTexture(path, true)]),
    );
    faceOverlays = Object.fromEntries(overlayTextures);

    const uniqueMaterials = new Map();
    model.traverse((object) => {
      if (!object.isMesh) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if (manifest.materials[material.name]) uniqueMaterials.set(material.uuid, material);
      }
    });

    petMaterials = [...uniqueMaterials.values()];
    for (const material of petMaterials) {
      const settings = manifest.materials[material.name];
      const [furMask, dirtMap] = await Promise.all([loadTexture(settings.furMask, false), loadTexture(settings.dirt, true)]);
      const overlay = material.name === 'Face' ? faceOverlays.neutral : null;
      patchMaterial(material, furMask, overlay, dirtMap);
      if (material.name === 'Face') faceMaterial = material;
    }

    mixer = new THREE.AnimationMixer(model);
    animationClock = new THREE.Clock();
    roomController = new MonsterRoom({
      monster: model,
      mixer,
      animations: gltf.animations,
      onStatus: (text) => { roomStatus.textContent = text; },
      onLoadProgress: (text) => {
        const label = roomLoading.querySelector('span:last-child');
        if (label) label.textContent = text;
      },
    });
    applyProfile();
    applyNeutralFace();
    playDance();
    attachRenderer(monsterStage);
    setHidden(modelLoading, true);

    renderer.setAnimationLoop(() => {
      resizeRendererToParent();
      const delta = Math.min(animationClock.getDelta(), 0.05);
      roomController?.update(delta);
      updateMonsterTalk(delta, parkVoicePlaying || toyMonsterVoicePlaying || isCleaningMonsterTalking()
        || Boolean(festivalLights && festivalVoice && !festivalVoice.paused && !festivalVoice.ended)
        || Boolean(gameConsoleFinal && gameConsoleVoice && !gameConsoleVoice.paused && !gameConsoleVoice.ended)
        || Boolean(telescopeFinal && telescopeVoice && !telescopeVoice.paused && !telescopeVoice.ended));
      updateMonsterFlies(delta);
      if (!gameConsoleFinal && !telescopeFinal && (!festivalLights || finalSceneLoading.hidden)) mixer.update(delta);
      if (toyCompanion?.active) {
        toyCompanion.update(delta);
        toyCompanion.render(renderer);
      } else if (shopController?.active) {
        shopController.update(delta);
        shopController.render(renderer);
      } else if (pantryShelf?.active) {
        pantryShelf.update(delta);
        pantryShelf.render(renderer);
      } else if (feedingScale?.active) {
        feedingScale.update(delta);
        feedingScale.render(renderer);
      } else if (earCleaning?.active) {
        earCleaning.update(delta);
        updateCleaningOverlay();
        earCleaning.render(renderer);
      } else if (parkController?.active) {
        parkController.update(delta);
        parkController.render(renderer);
      } else if (festivalLights) {
        if (finalSceneLoading.hidden) {
          festivalLights.update(delta);
          festivalLights.resize(finalSceneArt.clientWidth, finalSceneArt.clientHeight);
          renderer.render(festivalLights.scene, festivalLights.camera);
        }
      } else if (gameConsoleFinal) {
        if (finalSceneLoading.hidden) {
          gameConsoleFinal.update(delta);
          gameConsoleFinal.resize(finalSceneArt.clientWidth, finalSceneArt.clientHeight);
          renderer.render(gameConsoleFinal.scene, gameConsoleFinal.camera);
        }
      } else if (telescopeFinal) {
        if (finalSceneLoading.hidden) {
          telescopeFinal.update(delta);
          telescopeFinal.resize(finalSceneArt.clientWidth, finalSceneArt.clientHeight);
          renderer.render(telescopeFinal.scene, telescopeFinal.camera);
        }
      } else {
        renderer.render(scene, camera);
      }
    });
  } catch (error) {
    console.error('Не удалось загрузить 3D-модель:', error);
    modelLoading.innerHTML = '<span class="loading-eye" aria-hidden="true"></span><span>Монстрик пока прячется.<br>Обнови страницу!</span>';
  }
}

// --- Tutorial --------------------------------------------------------------

const fallbackTutorial = [
  { target: 'monster', text: 'Это твой новый монстрик. Он уже готов танцевать!', audio: null, placement: 'bottom' },
  { target: 'color', text: 'Выбери для него любимый цвет.', audio: null, placement: 'top' },
  { target: 'ears', text: 'Измени длину ушек с помощью ползунка.', audio: null, placement: 'top' },
  { target: 'horns', text: 'А теперь выбери размер рожек.', audio: null, placement: 'top' },
  { target: 'save', text: 'Нажми «Готово!», когда закончишь.', audio: null, placement: 'top' },
];

let tutorialSteps = fallbackTutorial;
let tutorialIndex = 0;
let tutorialFocusRing = null;

async function loadTutorial() {
  try {
    const response = await fetch(`/tutorial/tutorial.json?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(String(response.status));
    const data = await response.json();
    if (Array.isArray(data.steps) && data.steps.length) tutorialSteps = data.steps;
  } catch (error) {
    console.info('Используются встроенные тексты туториала.', error);
  }
}

function stopTutorialVoice() {
  tutorialAudio.pause();
  tutorialAudio.removeAttribute('src');
  tutorialAudio.load();
  tutorialVoicePlaying = false;
  updateMusicFade();
}

function primeTutorialAudio() {
  if (tutorialAudioPrimed) return;
  const firstAudio = tutorialSteps.find((step) => step.audio)?.audio;
  if (!firstAudio) return;

  tutorialAudioPrimed = true;
  tutorialAudio.src = `/tutorial/${encodeURIComponent(firstAudio)}`;
  tutorialAudio.volume = 0;
  tutorialAudio.muted = false;
  const playAttempt = tutorialAudio.play();
  if (!playAttempt) return;

  playAttempt
    .then(() => {
      tutorialAudio.pause();
      tutorialAudio.currentTime = 0;
      tutorialAudio.volume = 1;
      tutorialAudio.muted = muted;
    })
    .catch((error) => {
      tutorialAudioPrimed = false;
      tutorialAudio.volume = 1;
      tutorialAudio.muted = muted;
      console.info('Озвучка будет разблокирована при нажатии кнопки туториала.', error);
    });
}

function positionTutorialFocus(targetName) {
  const target = document.querySelector(`[data-tutorial-target="${targetName}"]`);
  if (!target) {
    tutorialFocusRing?.remove();
    tutorialFocusRing = null;
    return;
  }

  if (!tutorialFocusRing) {
    tutorialFocusRing = document.createElement('div');
    tutorialFocusRing.className = 'tutorial-focus-ring';
    tutorialLayer.prepend(tutorialFocusRing);
  }

  const appRect = app.getBoundingClientRect();
  const rect = target.getBoundingClientRect();
  const padding = targetName === 'monster' ? 8 : 6;
  tutorialFocusRing.style.left = `${rect.left - appRect.left - padding}px`;
  tutorialFocusRing.style.top = `${rect.top - appRect.top - padding}px`;
  tutorialFocusRing.style.width = `${rect.width + padding * 2}px`;
  tutorialFocusRing.style.height = `${rect.height + padding * 2}px`;
  tutorialFocusRing.style.borderRadius = targetName === 'monster' ? '22px' : '19px';
}

function playTutorialVoice(step) {
  stopTutorialVoice();
  if (!step.audio) return;

  tutorialAudio.src = `/tutorial/${encodeURIComponent(step.audio)}`;
  tutorialAudio.preload = 'auto';
  tutorialAudio.volume = 1;
  tutorialAudio.muted = muted;
  tutorialAudio.currentTime = 0;
  tutorialAudio.play()
    .then(() => {
      tutorialVoicePlaying = true;
      updateMusicFade();
    })
    .catch((error) => {
      tutorialVoicePlaying = false;
      updateMusicFade();
      console.info(`Озвучка шага «${step.id || step.target}» пока недоступна.`, error);
    });
}

tutorialAudio.addEventListener('ended', () => {
  tutorialVoicePlaying = false;
  updateMusicFade();
});

tutorialAudio.addEventListener('error', () => {
  tutorialVoicePlaying = false;
  updateMusicFade();
  console.warn('Не удалось загрузить файл озвучки туториала:', tutorialAudio.currentSrc);
});

function renderTutorialStep() {
  const step = tutorialSteps[tutorialIndex];
  if (!step) return finishTutorial();

  tutorialLayer.dataset.placement = step.placement || 'bottom';
  tutorialProgress.textContent = `ШАГ ${tutorialIndex + 1} ИЗ ${tutorialSteps.length}`;
  tutorialText.textContent = step.text;
  tutorialBack.disabled = tutorialIndex === 0;
  tutorialNext.innerHTML = tutorialIndex === tutorialSteps.length - 1
    ? 'Понятно! <span aria-hidden="true">✓</span>'
    : 'Дальше <span aria-hidden="true">→</span>';
  positionTutorialFocus(step.target);
  playTutorialVoice(step);
}

function startTutorial() {
  window.clearTimeout(tutorialTimer);
  if (!nameDialog.classList.contains('is-hidden')) return;
  tutorialIndex = 0;
  setHidden(tutorialLayer, false);
  renderTutorialStep();
}

function finishTutorial() {
  window.clearTimeout(tutorialTimer);
  stopTutorialVoice();
  setHidden(tutorialLayer, true);
  tutorialFocusRing?.remove();
  tutorialFocusRing = null;
}

tutorialNext.addEventListener('click', () => {
  if (tutorialIndex >= tutorialSteps.length - 1) return finishTutorial();
  tutorialIndex += 1;
  renderTutorialStep();
});

tutorialBack.addEventListener('click', () => {
  if (tutorialIndex === 0) return;
  tutorialIndex -= 1;
  renderTutorialStep();
});

tutorialSkip.addEventListener('click', finishTutorial);
window.addEventListener('resize', () => {
  if (!tutorialLayer.classList.contains('is-hidden')) {
    positionTutorialFocus(tutorialSteps[tutorialIndex]?.target);
  }
  if (!briefingScreen.hidden) requestAnimationFrame(fitBriefingText);
});

// --- Pet care briefing ----------------------------------------------------

let briefingSteps = [];
let briefingIndex = 0;

function publicAssetPath(folder, file, fallbackFolder) {
  const rawFolder = String(folder || fallbackFolder)
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\.?\//, '')
    .replace(/^public\/?/i, '')
    .replace(/^\/+|\/+$/g, '') || fallbackFolder;
  const encodedFile = String(file || '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
  return `${import.meta.env.BASE_URL}${rawFolder}/${encodedFile}`;
}

// A voice asked for only at the moment it is spoken arrives over the network while the words are
// already on the screen. A warm-up downloads the file in advance and keeps it as a blob, so the
// line then starts at once. The promise never rejects: a failed warm-up simply falls back to the
// address, and the audio element loads it the usual way.
const warmedVoices = new Map();

function warmUpVoice(url) {
  if (!url) return Promise.resolve(null);
  if (!warmedVoices.has(url)) {
    warmedVoices.set(url, fetch(url)
      .then((response) => (response.ok ? response.blob() : Promise.reject(new Error(`HTTP ${response.status}`))))
      .then((blob) => URL.createObjectURL(blob))
      .catch((error) => {
        console.info(`Озвучку «${url}» не удалось загрузить заранее.`, error);
        return null;
      }));
  }
  return warmedVoices.get(url);
}

const briefingVideoSubtitleCues = [
  {
    start: 0,
    end: 8.8,
    text: 'Очень хочу верить, что сегодня передаю чудика в надёжные и заботливые руки.',
  },
  {
    start: 8.8,
    end: 19,
    text: 'Ведь по-настоящему ответственный владелец определяет заботу не стоимостью вещей, а пониманием истинных потребностей своего любимца.',
  },
  {
    start: 19,
    end: Number.POSITIVE_INFINITY,
    text: 'Давай вместе определим, что потребуется приобрести для комфорта твоего нового друга.',
  },
];

function updateBriefingVideoSubtitles() {
  const cue = briefingVideoSubtitleCues.find((item) => (
    briefingVideo.currentTime >= item.start && briefingVideo.currentTime < item.end
  ));
  const shouldShow = muted && isBriefingVideoPlaying && !briefingVideoScreen.hidden && Boolean(cue);

  if (cue && briefingVideoSubtitles.textContent !== cue.text) {
    briefingVideoSubtitles.textContent = cue.text;
  }
  setHidden(briefingVideoSubtitles, !shouldShow);
}

briefingVideo.addEventListener('timeupdate', updateBriefingVideoSubtitles);
briefingVideo.addEventListener('seeked', updateBriefingVideoSubtitles);

skipBriefingVideoButton.addEventListener('click', () => {
  if (!isBriefingVideoPlaying) return;
  briefingVideo.pause();
  briefingVideo.dispatchEvent(new Event('sequencecancel'));
});

// The clip that takes the monster home. Its caption stands in for the voice over when the sound is off.
function updatePreroomVideoSubtitles() {
  setHidden(preroomVideoSubtitles, !(muted && isPreroomVideoPlaying && !preroomVideoScreen.hidden));
}

skipPreroomVideoButton.addEventListener('click', () => {
  if (!isPreroomVideoPlaying) return;
  preroomVideo.pause();
  preroomVideo.dispatchEvent(new Event('sequencecancel'));
});

async function playPreroomVideo() {
  showOnlyScreen(preroomVideoScreen);
  preroomVideo.style.opacity = '0';
  setHidden(skipPreroomVideoButton, false);
  preroomVideo.src = MEDIA.preroom;
  preroomVideo.currentTime = 0;
  preroomVideo.load();
  applyMuteState();

  const finished = waitForVideo(preroomVideo);
  await preroomVideo.play();
  isPreroomVideoPlaying = true;
  updatePreroomVideoSubtitles();
  requestAnimationFrame(() => {
    preroomVideo.style.opacity = '1';
  });

  await finished;
  isPreroomVideoPlaying = false;
  setHidden(skipPreroomVideoButton, true);
  updatePreroomVideoSubtitles();
}

async function enterRoomAfterBudget() {
  try {
    await playPreroomVideo();
  } catch (error) {
    console.warn('Ролик дороги домой не удалось воспроизвести:', error);
  }
  isPreroomVideoPlaying = false;
  setHidden(skipPreroomVideoButton, true);
  await enterRoom({ settleIn: true });
}

async function loadBriefingSteps() {
  const response = await fetch(MEDIA.briefingData, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Не удалось загрузить данные инструктажа (${response.status})`);
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error('Данные инструктажа должны быть массивом');

  return rows
    .filter((row) => row?.object_type === 'Briefing step on pet care')
    .sort((left, right) => {
      const leftQueue = Number.parseFloat(left.queue);
      const rightQueue = Number.parseFloat(right.queue);
      const safeLeft = Number.isFinite(leftQueue) ? leftQueue : Number.POSITIVE_INFINITY;
      const safeRight = Number.isFinite(rightQueue) ? rightQueue : Number.POSITIVE_INFINITY;
      return safeLeft - safeRight || String(left.id ?? '').localeCompare(String(right.id ?? ''), 'ru', { numeric: true });
    });
}

function stopBriefingVoice() {
  briefingAudio.pause();
  briefingAudio.removeAttribute('src');
  briefingAudio.load();
  briefingVoicePlaying = false;
  updateMusicFade();
}

function playBriefingVoice(step) {
  stopBriefingVoice();
  if (!step?.audio) return;

  briefingAudio.src = publicAssetPath(step.audio_folder, step.audio, 'audio');
  briefingAudio.preload = 'auto';
  briefingAudio.volume = 1;
  briefingAudio.muted = muted;
  briefingAudio.currentTime = 0;
  briefingAudio.play()
    .then(() => {
      briefingVoicePlaying = true;
      updateMusicFade();
    })
    .catch((error) => {
      briefingVoicePlaying = false;
      updateMusicFade();
      console.info(`Озвучка шага ${step.queue ?? briefingIndex + 1} пока недоступна.`, error);
    });
}

briefingAudio.addEventListener('ended', () => {
  briefingVoicePlaying = false;
  updateMusicFade();
});

briefingAudio.addEventListener('error', () => {
  briefingVoicePlaying = false;
  updateMusicFade();
  console.warn('Не удалось загрузить озвучку инструктажа:', briefingAudio.currentSrc);
});

function fitBriefingText() {
  if (briefingScreen.hidden || !briefingText.textContent) return;

  const boxStyle = getComputedStyle(briefingTextBox);
  const availableHeight = briefingTextBox.clientHeight
    - Number.parseFloat(boxStyle.paddingTop)
    - Number.parseFloat(boxStyle.paddingBottom);
  const availableWidth = briefingTextBox.clientWidth
    - Number.parseFloat(boxStyle.paddingLeft)
    - Number.parseFloat(boxStyle.paddingRight);
  const appHeight = app.getBoundingClientRect().height;
  const maximum = Math.min(22, Math.max(16, appHeight * 0.022));
  let size = maximum;

  briefingText.style.lineHeight = '1.28';
  briefingText.style.fontSize = `${size}px`;
  while (size > 11 && (briefingText.scrollHeight > availableHeight + 1 || briefingText.scrollWidth > availableWidth + 1)) {
    size -= 0.5;
    briefingText.style.fontSize = `${size}px`;
  }

  if (briefingText.scrollHeight > availableHeight + 1) {
    briefingText.style.lineHeight = '1.12';
    while (size > 9 && briefingText.scrollHeight > availableHeight + 1) {
      size -= 0.5;
      briefingText.style.fontSize = `${size}px`;
    }
  }
}

// The briefing of the final part runs on the same screen, under its own heading.
const FINAL_BRIEFING_IMAGE_ALTS = [
  'Монстрик складывает монеты в копилку ради большой цели',
  'Монеты переходят из бюджета в копилку',
  'Характеристики монстрика начинают финал с чистого листа',
  'Монстрик ест и чистится автоматически',
  'Дни сменяются до важного события',
  'Игрушки помогают поддерживать настроение монстрика',
];
const briefingEyebrow = briefingScreen.querySelector('.eyebrow');
const briefingImageFrame = briefingImage.closest('.briefing-image-frame');
const BRIEFING_EYEBROW = briefingEyebrow.textContent;
let finalBriefingRunning = false;

briefingImage.addEventListener('load', () => briefingImageFrame.classList.remove('is-placeholder'));
briefingImage.addEventListener('error', () => {
  if (!briefingImage.getAttribute('src')) return;
  briefingImageFrame.dataset.placeholder = 'Иллюстрация недоступна';
  briefingImageFrame.classList.add('is-placeholder');
});

function showFinalBriefingSteps() {
  briefingSteps = finalBriefingSteps();
  finalBriefingRunning = true;
  briefingEyebrow.textContent = 'ФИНАЛ ИГРЫ';
  showBriefingSteps();
}

// After the review of the third budget: the rules of the final part, then the fourth budget.
function startFinalBriefing() {
  if (!finalBriefingSteps().length) {
    startBudgetFlow(FINAL_PART_BUDGET);
    return;
  }
  showFinalBriefingSteps();
}

function renderBriefingStep() {
  const step = briefingSteps[briefingIndex];
  if (!step) return finishBriefing();
  briefingImageFrame.classList.remove('is-placeholder');
  briefingImageFrame.dataset.placeholder = '';

  const isFirst = briefingIndex === 0;
  const isLast = briefingIndex === briefingSteps.length - 1;
  briefingProgress.textContent = `ШАГ ${briefingIndex + 1} ИЗ ${briefingSteps.length}`;
  briefingText.textContent = String(step.text || '');
  briefingImage.src = publicAssetPath(step.image_folder, step.image, 'images');
  briefingImage.alt = finalBriefingRunning
    ? FINAL_BRIEFING_IMAGE_ALTS[briefingIndex] ?? `Иллюстрация к шагу ${briefingIndex + 1}`
    : `Иллюстрация к шагу ${briefingIndex + 1}`;
  briefingBack.hidden = isFirst;
  briefingNext.innerHTML = isLast
    ? '<span>Завершить</span><span aria-hidden="true">✓</span>'
    : '<span>Продолжить</span><span aria-hidden="true">→</span>';
  briefingActions.dataset.count = String(isFirst ? 2 : 3);

  requestAnimationFrame(() => requestAnimationFrame(fitBriefingText));
  playBriefingVoice(step);
}

function showBriefingSteps() {
  briefingIndex = 0;
  showOnlyScreen(briefingScreen);
  renderBriefingStep();
}

function finishBriefing() {
  stopBriefingVoice();
  if (finalBriefingRunning) {
    finalBriefingRunning = false;
    briefingEyebrow.textContent = BRIEFING_EYEBROW;
    briefingImageFrame.classList.remove('is-placeholder');
    const records = readProfileRecords(getUserProfileId());
    appendProfileRecord({
      'Тип события': FINAL_BRIEFING_SEEN_EVENT,
      'Профиль пользователя': getUserProfileId(),
      'Повтор из комнаты': replayingRoomBriefing,
      'Игровой день': deriveRoomState(records).day,
    });
    if (replayingRoomBriefing) {
      replayingRoomBriefing = false;
      enterRoom();
      return;
    }
    startBudgetFlow(FINAL_PART_BUDGET);
    return;
  }
  if (replayingRoomBriefing) {
    replayingRoomBriefing = false;
    enterRoom();
    return;
  }
  startBudgetFlow();
}

async function playBriefingVideo(runId) {
  if (runId !== briefingRunId) return false;
  showOnlyScreen(briefingVideoScreen);
  briefingVideo.style.opacity = '0';
  setHidden(skipBriefingVideoButton, false);
  briefingVideo.src = MEDIA.briefing;
  briefingVideo.currentTime = 0;
  briefingVideo.load();
  applyMuteState();

  const finished = waitForVideo(briefingVideo);
  await briefingVideo.play();
  if (runId !== briefingRunId) return false;
  isBriefingVideoPlaying = true;
  updateBriefingVideoSubtitles();
  requestAnimationFrame(() => {
    briefingVideo.style.opacity = '1';
  });

  const result = await finished;
  isBriefingVideoPlaying = false;
  setHidden(skipBriefingVideoButton, true);
  updateBriefingVideoSubtitles();
  return result === 'ended' && runId === briefingRunId;
}

async function startBriefingFlow() {
  const runId = ++briefingRunId;
  stopTutorialVoice();
  stopBriefingVoice();
  briefingVideo.src = MEDIA.briefing;
  briefingVideo.load();

  await fadeBackgroundMusic(0, 1000);
  if (runId !== briefingRunId) return;

  try {
    await playBriefingVideo(runId);
  } catch (error) {
    console.warn('Вводный ролик инструктажа не удалось воспроизвести:', error);
  }
  isBriefingVideoPlaying = false;
  setHidden(skipBriefingVideoButton, true);
  updateBriefingVideoSubtitles();
  if (runId !== briefingRunId) return;

  briefingVideo.style.opacity = '0';
  await Promise.all([delay(680), fadeBackgroundMusic(1, 1300)]);
  if (runId !== briefingRunId) return;

  try {
    briefingSteps = await loadBriefingSteps();
  } catch (error) {
    console.error('Не удалось открыть инструктаж:', error);
    briefingSteps = [];
  }

  if (runId !== briefingRunId) return;
  if (!briefingSteps.length) return finishBriefing();
  showBriefingSteps();
}

briefingRepeat.addEventListener('click', () => {
  playBriefingVoice(briefingSteps[briefingIndex]);
});

briefingBack.addEventListener('click', () => {
  if (briefingIndex === 0) return;
  briefingIndex -= 1;
  renderBriefingStep();
});

briefingNext.addEventListener('click', () => {
  if (briefingIndex >= briefingSteps.length - 1) return finishBriefing();
  briefingIndex += 1;
  renderBriefingStep();
});

// --- Mentor ---------------------------------------------------------------

// A mentor reply is a data mart row: `trigger` says what happened, `title` which episode or item
// it belongs to, `text` are the words, `image`/`audio` the portrait and the voice over.
const MENTOR_OBJECT_TYPE = 'Mentor reply';
const MENTOR_FALLBACK_TEXT = 'Давай подумаем ещё раз — так делать не стоит.';
const EPISODE_EVENT = 'Экономический эпизод';
const RIGHT_DECISION_EVENT = 'Правильное решение финансового эпизода';
const WRONG_DECISION_EVENT = 'Ошибочное решение финансового эпизода';

const mentorLayer = $('#mentor-layer');
const mentorPortrait = $('.mentor-portrait');
const mentorImage = $('#mentor-image');
const mentorText = $('#mentor-text');
const mentorExtra = $('#mentor-extra');
const mentorAlternativeButton = $('#mentor-alternative');
const mentorCloseButton = $('#mentor-close');
let mentorAfterClose = null;
let mentorAfterAlternative = null;

function mentorReply(trigger, title) {
  const replies = dataMartRows.filter((row) => row?.object_type === MENTOR_OBJECT_TYPE && row.trigger === trigger);
  return replies.find((row) => row.title === title) ?? replies[0] ?? null;
}

function showMentor(trigger, {
  title = null,
  text = null,
  extra = '',
  closeLabel = '',
  afterClose = null,
  alternativeLabel = '',
  afterAlternative = null,
} = {}) {
  const reply = mentorReply(trigger, title);
  if (!reply && !text) console.warn(`В дата-марте нет реплики ментора «${trigger}» для «${title}».`);
  mentorText.textContent = text || reply?.text || MENTOR_FALLBACK_TEXT;
  mentorExtra.textContent = extra;
  mentorExtra.hidden = !extra;
  mentorAlternativeButton.innerHTML = alternativeLabel;
  mentorAlternativeButton.hidden = !alternativeLabel;
  mentorCloseButton.innerHTML = closeLabel || 'Понятно <span aria-hidden="true">✓</span>';
  mentorAfterClose = afterClose;
  mentorAfterAlternative = afterAlternative;

  // The portrait is drawn art; until its file is in place the placeholder monster head stays.
  mentorPortrait.classList.remove('has-image');
  mentorImage.hidden = true;
  if (reply?.image) mentorImage.src = publicAssetPath(reply.image_folder, reply.image, 'images/mentor');
  mentorLayer.hidden = false;
  mentorCloseButton.focus({ preventScroll: true });
  playMentorVoice(reply);
}

// Hides the card without running what the player agreed to, e.g. when the screen changes.
function closeMentor() {
  if (mentorLayer.hidden) return;
  stopMentorVoice();
  mentorAfterClose = null;
  mentorAfterAlternative = null;
  mentorAlternativeButton.hidden = true;
  mentorLayer.hidden = true;
}

// The player pressed the button: the card closes and whatever waited for it happens.
function dismissMentor() {
  if (mentorLayer.hidden) return;
  const afterClose = mentorAfterClose;
  closeMentor();
  afterClose?.();
}

// A second explicit choice is used when the player may disagree with the mentor.
function chooseMentorAlternative() {
  if (mentorLayer.hidden || mentorAlternativeButton.hidden) return;
  const afterAlternative = mentorAfterAlternative;
  closeMentor();
  afterAlternative?.();
}

mentorImage.addEventListener('load', () => {
  mentorImage.hidden = false;
  mentorPortrait.classList.add('has-image');
});

mentorImage.addEventListener('error', () => {
  if (!mentorImage.getAttribute('src')) return;
  mentorImage.hidden = true;
  mentorPortrait.classList.remove('has-image');
  console.info('Портрет ментора пока не загружен:', mentorImage.currentSrc);
});

mentorCloseButton.addEventListener('click', dismissMentor);
mentorAlternativeButton.addEventListener('click', chooseMentorAlternative);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !mentorLayer.hidden) dismissMentor();
});

function stopMentorVoice() {
  mentorAudio.pause();
  mentorAudio.removeAttribute('src');
  mentorAudio.load();
  mentorVoicePlaying = false;
  updateMusicFade();
}

function playMentorVoice(reply) {
  stopMentorVoice();
  if (!reply?.audio) return;

  mentorAudio.src = publicAssetPath(reply.audio_folder, reply.audio, 'audio/mentor');
  mentorAudio.volume = 1;
  mentorAudio.muted = muted;
  mentorAudio.play()
    .then(() => {
      mentorVoicePlaying = true;
      updateMusicFade();
    })
    .catch((error) => {
      mentorVoicePlaying = false;
      updateMusicFade();
      console.info(`Озвучка реплики ментора «${reply.trigger}» пока недоступна.`, error);
    });
}

mentorAudio.addEventListener('ended', () => {
  mentorVoicePlaying = false;
  updateMusicFade();
});

mentorAudio.addEventListener('error', () => {
  if (!mentorAudio.getAttribute('src')) return;
  mentorVoicePlaying = false;
  updateMusicFade();
  console.warn('Не удалось загрузить озвучку ментора:', mentorAudio.currentSrc);
});

// The progress log doubles as a learning record, so every episode and decision is written down.
function logEpisode(content, extra = {}) {
  appendProfileRecord({
    'Тип события': EPISODE_EVENT,
    'Содержание события': content,
    'Профиль пользователя': getUserProfileId(),
    ...extra,
  });
}

function logDecision(right, { episode, explanation, ...extra }) {
  appendProfileRecord({
    'Тип события': right ? RIGHT_DECISION_EVENT : WRONG_DECISION_EVENT,
    'Профиль пользователя': getUserProfileId(),
    'Эпизод': episode,
    ...extra,
    'Пояснение': explanation,
  });
}

// --- Three-day budget -----------------------------------------------------

const FIRST_BUDGET_AMOUNT = 100;
const BUDGET_EPISODE_CONTENT = 'Первое составление бюджета. Важно учесть обязательные расходы.';
const BUDGET_MENTOR_TITLE = 'Первый бюджет';
// Everything the three days really demand: food for every day plus the nose cleaner.
const BUDGET_MINIMUM_SHARE = 10; // fun and savings each need more than this
const BUDGET_PERIOD_DAYS = 3;
const AVERAGE_FOOD_COST_PER_DAY = 13;
const AVERAGE_NOSE_CLEANER_COST = 25;
const fallbackBudgetTutorial = [
  {
    queue: 1,
    text: 'Мэрия начислила тебе дотацию за то, что ты взял питомца из приюта. Распредели полученные средства и позаботься о монстрике!',
    audio: '',
    screen_area: { target: 'budget-summary', message_placement: 'bottom' },
  },
  {
    queue: 2,
    text: 'Ты составляешь план на три дня. Для ориентира рядом с обязательными расходами указана средняя стоимость корма для монстрика в день.',
    audio: '',
    screen_area: { target: 'budget-period', message_placement: 'bottom' },
  },
  {
    queue: 3,
    text: 'Передвигай ползунки, чтобы разделить фонд между обязательными расходами, весельем и накоплениями на большую покупку.',
    audio: '',
    screen_area: { target: 'budget-categories', message_placement: 'top' },
  },
  {
    queue: 4,
    text: 'Следи за остатком. Когда распределишь всю сумму без остатка, кнопка «Утвердить бюджет» станет доступна.',
    audio: '',
    screen_area: { target: 'budget-submit', message_placement: 'top' },
  },
];

const BUDGET_REQUIRED_MINIMUM = AVERAGE_FOOD_COST_PER_DAY * BUDGET_PERIOD_DAYS + AVERAGE_NOSE_CLEANER_COST;

// Every budget covers BUDGET_PERIOD_DAYS game days. The first one is the city's grant; the second
// is the father's money for days 4–6, handed over when day 3 is over and its budget reviewed; the
// third is his money for days 7–9, and by then the player plans alone: no tutorial, no mentor.
const BUDGET_ROUNDS = {
  1: {
    number: 1,
    amount: FIRST_BUDGET_AMOUNT,
    source: 'Городская дотация',
    eyebrow: 'ГОРОДСКАЯ ДОТАЦИЯ',
    mentorTitle: BUDGET_MENTOR_TITLE,
    episode: BUDGET_EPISODE_CONTENT,
    tutorial: 'First budget tutorial',
    approvedLabel: 'Забираю домой! <span aria-hidden="true">→</span>',
  },
  2: {
    number: 2,
    amount: 100,
    source: 'Папа',
    eyebrow: 'ДЕНЬГИ ОТ ПАПЫ',
    mentorTitle: 'Второй бюджет',
    episode: 'Второе составление бюджета. Корм закладывается в бюджет целыми пачками: эффект неделимости блага.',
    tutorial: 'Second budget tutorial',
    approvedLabel: 'В четвёртый день! <span aria-hidden="true">→</span>',
  },
  3: {
    number: 3,
    amount: 100,
    source: 'Папа',
    eyebrow: 'ДЕНЬГИ ОТ ПАПЫ',
    mentorTitle: null,
    episode: 'Третье составление бюджета. Игрок планирует сам, без туториала и без проверки ментора.',
    tutorial: null,
    mentor: false,
  },
};

// Checked in data mart order: with several mistakes at once the mentor speaks about the first of them.
const BUDGET_MENTOR_RULES = [
  { trigger: 'budget-required-low', wrong: (plan) => plan.required < budgetNeeds.minimum },
  { trigger: 'budget-fun-low', wrong: (plan) => plan.fun <= BUDGET_MINIMUM_SHARE },
  { trigger: 'budget-savings-low', wrong: (plan) => plan.savings <= BUDGET_MINIMUM_SHARE },
];

// From the fourth budget on the father keeps paying every three days and the player plans alone, as
// in the third one: the savings forecast of episode 352 counts on exactly that.
function budgetRoundConfig(number) {
  if (BUDGET_ROUNDS[number]) return BUDGET_ROUNDS[number];
  if (number <= 3) return null;
  return {
    ...BUDGET_ROUNDS[3],
    number,
    episode: `Составление бюджета № ${number}. Игрок планирует сам, без туториала и без проверки ментора.`,
  };
}

let budgetRound = BUDGET_ROUNDS[1];
// What the obligatory article has to cover in this round, see budgetRequirements.
let budgetNeeds = { minimum: BUDGET_REQUIRED_MINIMUM, food: null };
// The piggy bank before this budget, the big goals the player has accepted by now and what they
// promised to put into the piggy bank from every budget (episode 352), if anything.
let budgetSavingsGoals = { savings: 0, goals: [], promise: null };
let budgetFundTotal = 0;
let budgetAllocations = { required: 0, fun: 0, savings: 0 };
let budgetFlowStarted = false;
let budgetApproved = false;
let budgetTutorialSteps = fallbackBudgetTutorial;
let budgetTutorialIndex = 0;
let budgetTutorialFocusRing = null;

const budgetInputs = {
  required: budgetRequiredInput,
  fun: budgetFunInput,
  savings: budgetSavingsInput,
};

const budgetValueOutputs = {
  required: budgetRequiredValue,
  fun: budgetFunValue,
  savings: budgetSavingsValue,
};

const budgetDailyOutputs = {
  required: budgetRequiredDaily,
  fun: budgetFunDaily,
  savings: budgetSavingsDaily,
};

function loadBudgetTutorial() {
  if (!budgetRound.tutorial) {
    budgetTutorialSteps = [];
    return;
  }
  const steps = Array.isArray(dataMartRows)
    ? dataMartRows
      .filter((row) => row?.object_type === budgetRound.tutorial)
      .sort((left, right) => Number(left.queue) - Number(right.queue))
    : [];
  budgetTutorialSteps = steps.length || budgetRound.number > 1 ? steps : fallbackBudgetTutorial;
}

function primeBudgetTutorialAudio() {
  if (budgetTutorialAudioPrimed || muted) return;

  const firstVoicedStep = budgetTutorialSteps.find((step) => step?.audio);
  if (!firstVoicedStep) return;

  budgetTutorialAudioPrimed = true;
  budgetTutorialAudio.src = publicAssetPath(
    firstVoicedStep.audio_folder,
    firstVoicedStep.audio,
    'audio/budget_tutorial',
  );
  budgetTutorialAudio.preload = 'auto';
  budgetTutorialAudio.volume = 0;
  budgetTutorialAudio.muted = false;
  budgetTutorialAudio.currentTime = 0;

  const playback = budgetTutorialAudio.play();
  if (!playback) return;
  playback
    .then(() => {
      budgetTutorialAudio.pause();
      budgetTutorialAudio.currentTime = 0;
      budgetTutorialAudio.volume = 1;
      budgetTutorialAudio.muted = muted;
    })
    .catch(() => {
      budgetTutorialAudioPrimed = false;
      budgetTutorialAudio.volume = 1;
      budgetTutorialAudio.muted = muted;
    });
}

function stopBudgetTutorialVoice() {
  budgetTutorialAudio.pause();
  budgetTutorialAudio.removeAttribute('src');
  budgetTutorialAudio.load();
  budgetTutorialVoicePlaying = false;
  updateMusicFade();
}

function playBudgetTutorialVoice(step) {
  stopBudgetTutorialVoice();
  if (!step?.audio) return;

  budgetTutorialAudio.src = publicAssetPath(step.audio_folder, step.audio, 'audio/budget_tutorial');
  budgetTutorialAudio.preload = 'auto';
  budgetTutorialAudio.volume = 1;
  budgetTutorialAudio.muted = muted;
  budgetTutorialAudio.currentTime = 0;
  budgetTutorialAudio.play()
    .then(() => {
      budgetTutorialVoicePlaying = true;
      updateMusicFade();
    })
    .catch((error) => {
      budgetTutorialVoicePlaying = false;
      updateMusicFade();
      console.info(`Озвучка бюджетного шага ${step.queue ?? budgetTutorialIndex + 1} пока недоступна.`, error);
    });
}

budgetTutorialAudio.addEventListener('ended', () => {
  budgetTutorialVoicePlaying = false;
  updateMusicFade();
});

budgetTutorialAudio.addEventListener('error', () => {
  budgetTutorialVoicePlaying = false;
  updateMusicFade();
  console.warn('Не удалось загрузить озвучку бюджетного туториала:', budgetTutorialAudio.currentSrc);
});

function positionBudgetTutorialFocus(screenArea) {
  const targetName = screenArea?.target;
  const target = targetName
    ? document.querySelector(`[data-budget-tutorial-target="${targetName}"]`)
    : null;

  if (!target) {
    budgetTutorialFocusRing?.remove();
    budgetTutorialFocusRing = null;
    return;
  }

  if (!budgetTutorialFocusRing) {
    budgetTutorialFocusRing = document.createElement('div');
    budgetTutorialFocusRing.className = 'tutorial-focus-ring';
    budgetTutorialLayer.prepend(budgetTutorialFocusRing);
  }

  const appRect = app.getBoundingClientRect();
  const rect = target.getBoundingClientRect();
  const padding = 6;
  budgetTutorialFocusRing.style.left = `${rect.left - appRect.left - padding}px`;
  budgetTutorialFocusRing.style.top = `${rect.top - appRect.top - padding}px`;
  budgetTutorialFocusRing.style.width = `${rect.width + padding * 2}px`;
  budgetTutorialFocusRing.style.height = `${rect.height + padding * 2}px`;
  budgetTutorialFocusRing.style.borderRadius = '24px';
}

function renderBudgetTutorialStep() {
  const step = budgetTutorialSteps[budgetTutorialIndex];
  if (!step) return finishBudgetTutorial();

  const area = step.screen_area || {};
  budgetTutorialLayer.dataset.placement = area.message_placement || 'bottom';
  budgetTutorialProgress.textContent = `ШАГ ${budgetTutorialIndex + 1} ИЗ ${budgetTutorialSteps.length}`;
  budgetTutorialText.textContent = String(step.text || '');
  budgetTutorialBack.disabled = budgetTutorialIndex === 0;
  budgetTutorialNext.innerHTML = budgetTutorialIndex === budgetTutorialSteps.length - 1
    ? 'Понятно! <span aria-hidden="true">✓</span>'
    : 'Дальше <span aria-hidden="true">→</span>';
  positionBudgetTutorialFocus(area);
  playBudgetTutorialVoice(step);
}

function startBudgetTutorial() {
  budgetTutorialIndex = 0;
  setHidden(budgetTutorialLayer, false);
  renderBudgetTutorialStep();
}

function finishBudgetTutorial() {
  stopBudgetTutorialVoice();
  setHidden(budgetTutorialLayer, true);
  budgetTutorialFocusRing?.remove();
  budgetTutorialFocusRing = null;
}

budgetTutorialNext.addEventListener('click', () => {
  if (budgetTutorialIndex >= budgetTutorialSteps.length - 1) return finishBudgetTutorial();
  budgetTutorialIndex += 1;
  renderBudgetTutorialStep();
});

budgetTutorialBack.addEventListener('click', () => {
  if (budgetTutorialIndex === 0) return;
  budgetTutorialIndex -= 1;
  renderBudgetTutorialStep();
});

budgetTutorialSkip.addEventListener('click', finishBudgetTutorial);

function formatMoney(value) {
  return `${Math.max(0, Math.round(value))} 🪙`;
}

function getAllocatedBudgetTotal() {
  return Object.values(budgetAllocations).reduce((sum, value) => sum + value, 0);
}

function renderBudgetAllocation() {
  const allocated = getAllocatedBudgetTotal();
  const remaining = Math.max(0, budgetFundTotal - allocated);
  budgetTotal.textContent = formatMoney(budgetFundTotal);
  budgetAllocated.textContent = `Распределено ${formatMoney(allocated)}`;
  budgetRemaining.textContent = formatMoney(remaining);
  budgetStatus.textContent = remaining === 0 ? 'Всё распределено!' : `Ещё ${formatMoney(remaining)}`;
  budgetRemainingCard.classList.toggle('is-complete', remaining === 0 && budgetFundTotal > 0);

  Object.entries(budgetInputs).forEach(([key, input]) => {
    input.max = String(Math.max(0, budgetFundTotal));
    input.value = String(budgetAllocations[key]);
    input.setAttribute('aria-valuetext', `${formatMoney(budgetAllocations[key])} на три дня`);
    budgetValueOutputs[key].value = formatMoney(budgetAllocations[key]);
    budgetDailyOutputs[key].textContent = `${formatMoney(budgetAllocations[key] / BUDGET_PERIOD_DAYS)}/день`;
  });

  approveBudgetButton.disabled = budgetApproved || budgetFundTotal <= 0 || remaining !== 0;
  renderBudgetGoals();
}

// The accepted goals are measured against the piggy bank as it will be once this budget is approved,
// so the savings slider shows at once how much closer they get.
function budgetGoalsProgress() {
  const pool = budgetSavingsGoals.savings + budgetAllocations.savings;
  return { pool, ...savingsGoalsProgress(budgetSavingsGoals.goals, pool) };
}

function goalLeftText(left) {
  return left > 0 ? `ещё ${formatMoney(left)}` : 'накоплено ✓';
}

function renderBudgetGoals() {
  const { goals, promise } = budgetSavingsGoals;
  budgetGoals.hidden = !goals.length;
  budgetCategories.classList.toggle('has-goals', goals.length > 0 || promise !== null);
  renderBudgetPromise();
  if (!goals.length) return;

  const progress = budgetGoalsProgress();
  budgetGoalsPool.textContent = formatMoney(progress.pool);
  budgetGoalsList.replaceChildren(...progress.goals.map((goal) => {
    const item = document.createElement('li');
    const name = document.createElement('span');
    name.className = 'budget-goal-name';
    name.textContent = goal.title;
    const price = document.createElement('span');
    price.className = 'budget-goal-price';
    price.textContent = formatMoney(goal.price);
    const left = document.createElement('b');
    left.className = 'budget-goal-left';
    left.textContent = goalLeftText(goal.left);
    item.append(name, price, left);
    return item;
  }));
  // With a single goal the sum for all of them would only repeat its own line.
  budgetGoalsAll.hidden = goals.length < 2;
  budgetGoalsTotal.textContent = goalLeftText(progress.left);
}

// The promise is only a reminder: the savings slider may stay below it, nothing stops the plan.
function renderBudgetPromise() {
  const { promise } = budgetSavingsGoals;
  budgetPromise.hidden = promise === null;
  if (promise === null) return;
  const kept = budgetAllocations.savings >= promise;
  budgetPromiseValue.textContent = formatMoney(promise);
  budgetPromise.classList.toggle('is-kept', kept);
  budgetPromiseState.textContent = kept ? 'выполнено ✓' : `ещё ${formatMoney(promise - budgetAllocations.savings)}`;
}

// The latest promise made in episode 352, or null when the player chose to save as before.
function savingsPromise(records) {
  const forecast = records.filter((record) => record?.['Тип события'] === REPAIR_FORECAST_EVENT).at(-1);
  const promise = Number(forecast?.['Обещание в бюджет']);
  return forecast?.['Обещание в бюджет'] != null && Number.isFinite(promise) ? promise : null;
}

// The goals as they stood when the budget was approved, for its plan record.
function budgetGoalsRecord() {
  const { promise } = budgetSavingsGoals;
  const promiseRecord = promise === null ? {} : {
    'Обещание в бюджет': promise,
    'Обещание выполнено': budgetAllocations.savings >= promise,
  };
  if (!budgetSavingsGoals.goals.length) return promiseRecord;
  const progress = budgetGoalsProgress();
  return {
    'Цели накоплений': progress.goals.map((goal) => ({
      'Идентификатор цели': goal.id,
      'Название цели': goal.title,
      'Стоимость': goal.price,
      'Осталось накопить': goal.left,
    })),
    'В копилке после бюджета': progress.pool,
    'Осталось накопить на все цели': progress.left,
    ...promiseRecord,
  };
}

Object.entries(budgetInputs).forEach(([key, input]) => {
  input.addEventListener('input', () => {
    const otherTotal = getAllocatedBudgetTotal() - budgetAllocations[key];
    const maximum = Math.max(0, budgetFundTotal - otherTotal);
    const requested = Math.round(Number(input.value));
    budgetAllocations[key] = Math.max(0, Math.min(maximum, Number.isFinite(requested) ? requested : 0));
    renderBudgetAllocation();
  });
});

function budgetMentorVerdict(plan) {
  const mistakes = BUDGET_MENTOR_RULES.filter((rule) => rule.wrong(plan));
  if (!mistakes.length) return null;
  return mistakes
    .map((rule) => ({ trigger: rule.trigger, id: mentorReply(rule.trigger, budgetRound.mentorTitle)?.id ?? Infinity }))
    .sort((left, right) => left.id - right.id)[0].trigger;
}

// What the obligatory article has to cover. The first budget goes by the average price of a day
// of food plus the nose cleaner. By the second one the player has learnt that food is sold in whole
// packs only, so the minimum is the packs still missing for the period; the cleaner is already home.
function budgetRequirements(round) {
  if (round.number === 1) return { minimum: BUDGET_REQUIRED_MINIMUM, food: null };
  const { suitableFoodGrams } = deriveRoomState(readProfileRecords(getUserProfileId()));
  const food = foodPurchaseNeed(suitableFoodGrams, BUDGET_PERIOD_DAYS);
  return { minimum: food.cost, food };
}

// «докупить 1 пачку», «2 пачки», «5 пачек».
function packsToBuy(count) {
  return `${count} ${pluralRu(count, 'пачку', 'пачки', 'пачек')}`;
}

// The obligatory expenses of the round in words, for the log.
function budgetRequiredWords() {
  const { food } = budgetNeeds;
  if (!food) {
    return `корм на ${BUDGET_PERIOD_DAYS} дня — ${AVERAGE_FOOD_COST_PER_DAY * BUDGET_PERIOD_DAYS} монет,`
      + ` прибор для козявок — ${AVERAGE_NOSE_CLEANER_COST}`;
  }
  return `корм продаётся только целыми пачками: на ${BUDGET_PERIOD_DAYS} дня нужно ${food.needGrams} г,`
    + ` в кладовке ${food.stockGrams} г, докупить ${packsToBuy(food.packs)} по ${food.pack?.weight_in_grams} г`
    + ` — ${food.cost} ${pluralRu(food.cost, 'монета', 'монеты', 'монет')}; прибор для козявок уже есть`;
}

function budgetDecisionExplanation(verdict, plan) {
  const written = `обязательные расходы — ${plan.required}, веселье — ${plan.fun}, накопления — ${plan.savings}`;
  if (!verdict) {
    return `Игрок распределил ${budgetFundTotal} монет: ${written}.`
      + ` Обязательные расходы закрыты полностью (${budgetRequiredWords()}), и при этом осталось и на радости, и на накопления.`;
  }
  const reasons = {
    'budget-required-low': `На обязательные расходы выделено ${plan.required} монет вместо необходимых ${budgetNeeds.minimum}`
      + ` (${budgetRequiredWords()}): монстрику не хватило бы еды.`,
    'budget-fun-low': `На веселье выделено ${plan.fun} монет. Умеренные траты на радость — часть здорового бюджета:`
      + ' моральное состояние монстрика так же важно, как сытость.',
    'budget-savings-low': `В накопления отложено ${plan.savings} монет. Без регулярных отчислений большая покупка не приблизится,`
      + ' а неожиданный расход будет нечем закрыть.',
  };
  const outcome = budgetRound.mentor === false
    ? 'Ментора в этом бюджете нет: бюджет утверждён как есть, игрок узнает о последствиях на итогах периода.'
    : 'Ментор предложил исправить такой бюджет.';
  return `Игрок ${budgetRound.mentor === false ? 'утвердил' : 'попробовал утвердить'} бюджет: ${written}. ${reasons[verdict] ?? ''} ${outcome}`;
}

function logBudgetDecision(verdict, plan) {
  logDecision(!verdict, {
    episode: budgetRound.episode,
    'Номер бюджета': budgetRound.number,
    ...(budgetRound.mentor === false ? { 'Ментор не участвовал': true } : {}),
    'Источник средств': budgetRound.source,
    'Фонд к распределению': budgetFundTotal,
    'Статьи бюджета': {
      [REQUIRED_ARTICLE]: plan.required,
      [FUN_ARTICLE]: plan.fun,
      [SAVINGS_ARTICLE]: plan.savings,
    },
    explanation: budgetDecisionExplanation(verdict, plan),
  });
}

// Where the money comes from, which days it is for, and the hints next to the obligatory article.
function renderBudgetRound() {
  const firstDay = (budgetRound.number - 1) * BUDGET_PERIOD_DAYS + 1;
  budgetEyebrow.textContent = budgetRound.eyebrow;
  budgetPeriodDays.textContent = `С ${firstDay}-го по ${firstDay + BUDGET_PERIOD_DAYS - 1}-й день`;
  budgetPeriodDays.hidden = budgetRound.number === 1;
  renderBudgetPocket();
  const { food } = budgetNeeds;
  if (!food) {
    budgetFoodHint.innerHTML = `Корм: ≈ <strong>${formatMoney(AVERAGE_FOOD_COST_PER_DAY)}</strong> в день`;
    budgetExtraHint.innerHTML = `Прибор от козявок: ≈ <strong>${formatMoney(AVERAGE_NOSE_CLEANER_COST)}</strong> разово`;
    return;
  }
  budgetFoodHint.innerHTML = `Корм: пачка ${food.pack?.weight_in_grams ?? 0} г — <strong>${formatMoney(food.pack?.price ?? 0)}</strong>`;
  budgetExtraHint.innerHTML = `Нужно <strong>${food.needGrams} г</strong> · в кладовке <strong>${food.stockGrams} г</strong>`;
}

// The goals the budget screen reminds of. In the final part a player without goals of their own
// saves up the default sum, and the screen says so.
function budgetGoalsOfRound(records, number) {
  const goals = acceptedSavingsGoals(records);
  if (goals.length || number < FINAL_PART_BUDGET) return goals;
  const target = finalTarget(records);
  return [{ id: null, title: 'Цели не выбраны', price: target.total }];
}

// From day 10 on the budget screen also says what is still in the pocket: coins left over from
// the last budget stay there, on top of the new fund.
const BUDGET_POCKET_FROM_DAY = 10;

function renderBudgetPocket() {
  const { day, pocket } = deriveRoomState(readProfileRecords(getUserProfileId()));
  budgetPocket.hidden = day < BUDGET_POCKET_FROM_DAY;
  budgetPocketValue.textContent = formatCoins(Math.max(0, pocket));
}

// `number` names the round in BUDGET_ROUNDS: 1 after the briefing, 2 once the first budget is reviewed.
function startBudgetFlow(number = 1) {
  if (budgetFlowStarted && budgetRound.number === number) return;
  budgetFlowStarted = true;
  budgetRound = budgetRoundConfig(number);
  budgetNeeds = budgetRequirements(budgetRound);
  const records = readProfileRecords(getUserProfileId());
  budgetSavingsGoals = {
    savings: deriveRoomState(records).savings,
    goals: budgetGoalsOfRound(records, number),
    promise: savingsPromise(records),
  };
  budgetApproved = false;
  finishBudgetTutorial();
  budgetFundTotal = budgetRound.amount;
  budgetAllocations = { required: 0, fun: 0, savings: 0 };
  showOnlyScreen(budgetScreen);
  renderBudgetRound();
  renderBudgetAllocation();
  loadBudgetTutorial();
  logEpisode(budgetRound.episode, { 'Номер бюджета': number, 'Источник средств': budgetRound.source });
  if (!budgetScreen.hidden && budgetTutorialSteps.length) startBudgetTutorial();
}

function approveCurrentBudget(plan, mentorVerdict = null) {
  if (budgetApproved) return;
  budgetApproved = true;
  approveBudgetButton.disabled = true;
  const { food } = budgetNeeds;
  saveApprovedBudget(plan, budgetFundTotal, budgetRound.source, {
    // What the screen said the food of the period would cost, for the review of this budget.
    ...(food ? {
      'Корм к покупке': {
        'Нужно граммов': food.needGrams,
        'В кладовке граммов': food.stockGrams,
        'Пачек': food.packs,
        'Стоимость': food.cost,
      },
    } : {}),
    ...budgetGoalsRecord(),
    ...(mentorVerdict ? {
      'Утверждено вопреки совету ментора': true,
      'Возражение ментора': mentorVerdict,
    } : {}),
  });

  // A later budget is the money for the days ahead, so the next day starts together with it:
  // a reload can then neither hand the money out twice nor bring back the finished day.
  const firstBudget = budgetRound.number === 1;
  if (!firstBudget) writeNextDay();
  // The fourth budget opens the final part of the game on the morning of day 10.
  if (budgetRound.number === FINAL_PART_BUDGET && !isFinalPart(readProfileRecords(getUserProfileId()))) startFinalPart();

  // A budget the player plans alone goes straight to the new day.
  if (budgetRound.mentor === false) {
    enterRoom();
    return;
  }

  // The player has already confirmed the exceptional second-budget choice in the warning itself.
  if (mentorVerdict) {
    if (firstBudget) enterRoomAfterBudget();
    else enterRoom();
    return;
  }

  showMentor('budget-approved', {
    title: budgetRound.mentorTitle,
    closeLabel: budgetRound.approvedLabel,
    afterClose: () => (firstBudget ? enterRoomAfterBudget() : enterRoom()),
  });
}

approveBudgetButton.addEventListener('click', () => {
  const allocated = getAllocatedBudgetTotal();
  if (budgetApproved || budgetFundTotal <= 0 || allocated !== budgetFundTotal) return;

  const plan = { ...budgetAllocations };
  finishBudgetTutorial();

  // A learning game: a budget that would leave the monster hungry or joyless is not approved.
  // A budget planned alone is still weighed for the log, but nothing stops it.
  const verdict = budgetMentorVerdict(plan);
  logBudgetDecision(verdict, plan);
  if (budgetRound.mentor === false) {
    approveCurrentBudget(plan);
    return;
  }
  if (verdict) {
    const { food } = budgetNeeds;
    showMentor(verdict, {
      title: budgetRound.mentorTitle,
      extra: verdict === 'budget-required-low' && food
        ? `Докупить ${packsToBuy(food.packs)} по ${food.pack?.weight_in_grams} г — ${formatMoney(food.cost)}`
        : '',
      closeLabel: 'Исправить бюджет <span aria-hidden="true">→</span>',
      alternativeLabel: budgetRound.number === 2 ? 'Утвердить свой вариант' : '',
      afterAlternative: budgetRound.number === 2 ? () => approveCurrentBudget(plan, verdict) : null,
    });
    return;
  }

  approveCurrentBudget(plan);
});

window.addEventListener('resize', () => {
  if (!budgetTutorialLayer.classList.contains('is-hidden')) {
    positionBudgetTutorialFocus(budgetTutorialSteps[budgetTutorialIndex]?.screen_area);
  }
});

// --- Budget review -----------------------------------------------------------

// When the last day of a budget is over, its plan is laid next to what really happened, and only
// then the next budget is made. Keyed by the number of the budget under review.
const BUDGET_REVIEWS = {
  1: {
    mentorTitle: 'Итоги первого бюджета',
    content: 'Сравнение планового и фактического бюджета. Эффект неделимости блага: подходящий корм продаётся'
      + ' только целыми пачками по 200 г, поэтому корм на три дня не укладывается в плановые 13 монет в день.',
    // The guide figures the first budget screen gave for its two obligatory purchases.
    foodPlan: AVERAGE_FOOD_COST_PER_DAY * BUDGET_PERIOD_DAYS,
    devicePlan: AVERAGE_NOSE_CLEANER_COST,
    mentorSteps: firstReviewMentorSteps,
    explanation: firstReviewExplanation,
  },
  // Food is planned by the packs the second budget screen asked for; the cleaner was already home.
  2: {
    mentorTitle: 'Итоги второго бюджета',
    content: 'Сравнение планового и фактического бюджета за дни 4–6: внеплановые доходы (благодарность папы,'
      + ' награды за дополнительные задания), перерасход и недорасход по статьям, заимствования из копилки.',
    foodPlan: null,
    devicePlan: 0,
    mentorSteps: discrepancyMentorSteps,
    explanation: discrepancyReviewExplanation,
  },
};
// From the third budget on the player plans alone, so the review is theirs alone too: the same
// plan and fact, and no mentor after it. The review of the third budget leads to the briefing of
// the final part; later ones go straight to the next budget.
function budgetReviewConfig(number) {
  if (BUDGET_REVIEWS[number]) return BUDGET_REVIEWS[number];
  if (number < 3) return null;
  return {
    mentorTitle: null,
    mentor: false,
    content: `Сравнение планового и фактического бюджета № ${number} (дни ${(number - 1) * BUDGET_PERIOD_DAYS + 1}–`
      + `${number * BUDGET_PERIOD_DAYS}): игрок подводит итоги сам, без ментора.`,
    foodPlan: null,
    devicePlan: 0,
    mentorSteps: () => [],
    explanation: discrepancyReviewExplanation,
  };
}

const BUDGET_REVIEW_ARTICLES = [
  { key: 'required', title: REQUIRED_ARTICLE, icon: '🍲', className: 'budget-category-required' },
  { key: 'fun', title: FUN_ARTICLE, icon: '🎈', className: 'budget-category-fun' },
  { key: 'savings', title: SAVINGS_ARTICLE, icon: '🐷', className: 'budget-category-savings' },
];
const REVIEW_ARTICLE_TITLES = { required: REQUIRED_ARTICLE, fun: FUN_ARTICLE };
const budgetReviewEyebrow = $('#budget-review-eyebrow');
const budgetReviewFund = $('#budget-review-fund');
const budgetReviewSource = $('#budget-review-source');
const budgetReviewSpent = $('#budget-review-spent');
const budgetReviewLeft = $('#budget-review-left');
const budgetReviewArticles = $('#budget-review-articles');
const budgetReviewMentorButton = $('#budget-review-mentor');
let activeBudgetReview = null;

// The round that begins when `day` is over: only the last day of an approved budget leads to one.
function budgetRoundAfterDay(day, records) {
  const approved = approvedBudgetCount(records);
  if (!approved || day !== approved * BUDGET_PERIOD_DAYS) return null;
  return budgetRoundConfig(approved + 1);
}

function openBudgetReview(round) {
  const records = readProfileRecords(getUserProfileId());
  const review = budgetReview(records, round.number - 1);
  const reviewConfig = budgetReviewConfig(round.number - 1);
  if (!review || !reviewConfig) {
    startBudgetFlow(round.number);
    return;
  }
  // A plan older than the 'Корм к покупке' field falls back to its whole obligatory article.
  const config = { ...reviewConfig, foodPlan: reviewConfig.foodPlan ?? review.foodPlan ?? review.plan.required };
  const { hungry, day } = deriveRoomState(records);
  closeRoomInbox();
  closeSavingsTransfer();
  activeBudgetReview = { review, config, round, hungry, day, findings: budgetDiscrepancies(review, { hungry }) };
  showOnlyScreen(budgetReviewScreen);
  renderBudgetReview(activeBudgetReview);
  budgetReviewMentorButton.firstElementChild.textContent = config.mentor === false ? 'Дальше' : 'Что скажет ментор?';
  logBudgetReview(activeBudgetReview);
  budgetReviewMentorButton.focus({ preventScroll: true });
}

function reviewElement(tag, className, text = '') {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

// «Корм: план 39 🪙 → факт 52 🪙 · 2 пачки по 200 г — еды на 4 дня».
function reviewFoodNote({ food }, config) {
  const note = `Корм: план ${formatMoney(config.foodPlan)} → факт ${formatMoney(food.cost)}`;
  if (!food.packs) return note;
  const days = Math.floor(food.days);
  return `${note} · ${food.packs} ${pluralRu(food.packs, 'пачка', 'пачки', 'пачек')} по ${Math.round(food.grams / food.packs)} г`
    + ` — еды на ${days} ${pluralRu(days, 'день', 'дня', 'дней')}`;
}

// «Аккредитивы: благодарность папы +50 🪙 в копилку».
function reviewIncomeText({ source, purpose, amount, to }) {
  return `${purpose ?? source}: +${formatMoney(amount)} ${to === 'Копилка' ? 'в копилку' : 'в карман'}`;
}

// «Веселье: план 12 🪙 → факт 8 🪙».
function reviewArticleChangeText({ key, plan, fact }) {
  return `${REVIEW_ARTICLE_TITLES[key]}: план ${formatMoney(plan)} → факт ${formatMoney(fact)}`;
}

// Spending above the plan and savings below it are the surprises; the badge says which way it went.
function reviewDiff(key, plan, fact) {
  const change = fact - plan;
  if (change === 0) return { text: 'по плану', tone: 'is-even' };
  const worse = key === 'savings' ? change < 0 : change > 0;
  return { text: `${change > 0 ? '+' : '−'}${formatMoney(Math.abs(change))}`, tone: worse ? 'is-worse' : 'is-better' };
}

function reviewNotes(key, review, config) {
  if (key === 'required') {
    const deviceCost = review.devices.reduce((sum, device) => sum + device.cost, 0);
    const notes = [{ icon: '🥫', text: reviewFoodNote(review, config), key: true }];
    // From the second budget on the cleaner is already home, so it is mentioned only if bought again.
    if (config.devicePlan > 0 || deviceCost > 0) {
      notes.push({ icon: '🧹', text: `Прибор от козявок: план ${formatMoney(config.devicePlan)} → факт ${formatMoney(deviceCost)}` });
    }
    return notes;
  }
  if (key === 'fun') {
    if (!review.funPurchases.length) return [{ icon: '🎈', text: 'На веселье ничего не потрачено' }];
    // The first budget could not know about the racket; later fun spending is what the article was for.
    return review.funPurchases.map(({ purpose, cost }) => ({
      icon: '🎁',
      text: `${purpose ?? 'Покупка'} — ${formatMoney(cost)}${review.number === 1 ? ', вне плана' : ''}`,
      key: true,
    }));
  }
  const notes = review.income.map((item) => ({
    icon: item.to === 'Копилка' ? '🎁' : '🧩',
    text: `Вне плана — ${reviewIncomeText(item)}`,
    key: true,
  }));
  for (const goal of review.goalPurchases ?? []) {
    notes.push({ icon: '🏆', text: `Куплена цель ${goalName(goal)} — ${formatMoney(goal.cost)} из копилки`, key: true });
  }
  if (review.borrowed > 0) notes.push({ icon: '👛', text: `Переложено из копилки в карман: ${formatMoney(review.borrowed)}` });
  if (review.unspent > 0) notes.push({ icon: '🪙', text: `Не потрачено, лежит в кармане: ${formatMoney(review.unspent)}` });
  if (!notes.length) notes.push({ icon: '🐷', text: 'Копилку не трогали' });
  return notes;
}

function reviewArticleCard(article, review, config) {
  const plan = review.plan[article.key];
  const fact = review.fact[article.key];
  const card = reviewElement('article', `budget-category ${article.className} review-article`);

  const heading = reviewElement('div', 'budget-category-heading');
  const icon = reviewElement('span', 'budget-category-icon', article.icon);
  icon.setAttribute('aria-hidden', 'true');
  const title = reviewElement('div');
  title.append(reviewElement('h2', '', article.title));
  const diff = reviewDiff(article.key, plan, fact);
  heading.append(icon, title, reviewElement('b', `review-diff ${diff.tone}`, diff.text));

  // Unplanned income can push a fact past the fund, so the bars are scaled to both together.
  const scale = Math.max(1, review.fund + review.incomeTotal);
  const bars = reviewElement('div', 'review-bars');
  for (const [label, value, tone] of [['План', plan, 'is-plan'], ['Факт', fact, 'is-fact']]) {
    const track = reviewElement('span', `review-bar ${tone}`);
    const fill = reviewElement('i');
    fill.style.width = `${Math.min(100, Math.max(0, (value / scale) * 100))}%`;
    track.append(fill);
    bars.append(reviewElement('span', 'review-bar-label', label), track, reviewElement('b', 'review-bar-value', formatMoney(value)));
  }

  const notes = reviewElement('ul', 'review-notes');
  for (const note of reviewNotes(article.key, review, config)) {
    const item = reviewElement('li', note.key ? 'is-key' : '');
    const noteIcon = reviewElement('span', '', note.icon);
    noteIcon.setAttribute('aria-hidden', 'true');
    item.append(noteIcon, reviewElement('span', '', note.text));
    notes.append(item);
  }

  card.append(heading, bars, notes);
  return card;
}

function renderBudgetReview({ review, config }) {
  const firstDay = (review.number - 1) * BUDGET_PERIOD_DAYS + 1;
  const source = review.source ?? budgetRoundConfig(review.number)?.source ?? '';
  budgetReviewEyebrow.textContent = `ИТОГИ ДНЕЙ ${firstDay}–${firstDay + BUDGET_PERIOD_DAYS - 1}`;
  budgetReviewFund.textContent = formatMoney(review.fund);
  budgetReviewSource.textContent = review.incomeTotal > 0
    ? `${source} · вне плана +${formatMoney(review.incomeTotal)}`
    : source;
  budgetReviewSpent.textContent = formatMoney(review.spent);
  budgetReviewLeft.textContent = `Осталось ${formatMoney(review.fund + review.incomeTotal - review.spent)}`;
  budgetReviewArticles.replaceChildren(
    ...BUDGET_REVIEW_ARTICLES.map((article) => reviewArticleCard(article, review, config)),
  );
}

// The plan and the fact in words, shared by every review's explanation.
function reviewPlanAndFactWords(review) {
  const { plan, fact } = review;
  return [
    `План на ${review.fund} ${coinsWord(review.fund)}: обязательные расходы — ${plan.required}, веселье — ${plan.fun}, накопления — ${plan.savings}.`,
    `Факт: обязательные расходы — ${fact.required}, веселье — ${fact.fun}, в копилке осталось ${fact.savings},`
      + ` в кармане не потрачено ${review.unspent}.`,
    ...(review.goalPurchases ?? []).map((goal) => `Из копилки куплена цель ${goalName(goal)} за ${goal.cost} ${coinsWord(goal.cost)}.`),
  ];
}

function firstReviewExplanation({ review, config, hungry }) {
  const { food } = review;
  const bought = `за ${food.cost} ${coinsWord(food.cost)} куплено ${food.grams} г корма`
    + ` (${food.packs} ${pluralRu(food.packs, 'пачка', 'пачки', 'пачек')})`;
  const foodPart = food.cost > config.foodPlan
    ? `По плану корм стоил бы ${config.foodPlan} ${coinsWord(config.foodPlan)} (${AVERAGE_FOOD_COST_PER_DAY} в день), а ${bought}:`
      + ` подходящий корм продаётся только целыми пачками, поэтому еды на ${BUDGET_PERIOD_DAYS} дня пришлось купить`
      + ` на ${Math.floor(food.days)} — это эффект неделимости блага.`
    : `По плану корм стоил бы ${config.foodPlan} ${coinsWord(config.foodPlan)}, а ${bought}: на все ${BUDGET_PERIOD_DAYS} дня этого не хватило,`
      + ' а докупить корм можно только целой пачкой — это эффект неделимости блага.';
  const purchases = review.funPurchases
    .map(({ purpose, cost }) => `${purpose ?? 'покупка'} за ${cost} ${coinsWord(cost)}`)
    .join(', ');
  return [
    ...reviewPlanAndFactWords(review),
    foodPart,
    purchases ? `Незапланированная покупка на веселье (${purchases}) — неожиданная, но полезная трата.` : '',
    review.borrowed > 0 ? `Из копилки в карман переложено монет: ${review.borrowed}.` : '',
    hungry ? 'Последний день периода монстрик закончил голодным — ментор сделал замечание.' : '',
  ].filter(Boolean).join(' ');
}

// Why an article parted from its plan, as far as the records can tell.
function reviewArticleCause(article, review, config) {
  const { food } = review;
  if (article.key === 'required') {
    if (article.change > 0) {
      return food.cost > config.foodPlan
        ? `корма куплено больше, чем нужно на период: ${food.packs} ${pluralRu(food.packs, 'пачка', 'пачки', 'пачек')}`
          + ` за ${food.cost} при плане ${config.foodPlan}`
        : 'обязательных покупок оказалось больше, чем заложено в план';
    }
    return food.cost < config.foodPlan
      ? `корма понадобилось меньше, чем заложено (${food.cost} вместо ${config.foodPlan})`
      : 'в план по обязательным расходам был заложен запас сверх нужного корма';
  }
  const purchases = review.funPurchases
    .map(({ purpose, cost }) => `${purpose ?? 'покупка'} — ${cost}`)
    .join(', ');
  if (article.change > 0) return `развлечения обошлись дороже, чем заложено: ${purchases}`;
  return purchases ? `развлечений вышло меньше, чем заложено: ${purchases}` : 'на веселье ничего не потрачено';
}

// A finding of budgetDiscrepancies in words, for the log.
function reviewFindingWords(finding, review, config) {
  switch (finding.kind) {
    case 'income':
      return `Внеплановые доходы на ${finding.total} ${coinsWord(finding.total)}: `
        + finding.income.map((item) => `${item.purpose ?? item.source} — ${item.amount} (${item.to.toLowerCase()})`).join(', ')
        + '. В плане их не было, поэтому копилка или карман больше плана.';
    case 'overspent':
    case 'underspent':
      return `${finding.kind === 'overspent' ? 'Перерасход' : 'Недорасход'}: `
        + finding.articles
          .map((article) => `${REVIEW_ARTICLE_TITLES[article.key]} — план ${article.plan}, факт ${article.fact}`
            + ` (${reviewArticleCause(article, review, config)})`)
          .join('; ')
        + (finding.kind === 'underspent' && finding.unspent > 0 ? `; в кармане осталось ${finding.unspent}.` : '.');
    case 'borrowed':
      return `Из копилки в карман переложено ${finding.amount} ${coinsWord(finding.amount)}: в кармане не хватило на траты периода.`;
    case 'on-plan':
      return 'Обязательные расходы и веселье совпали с планом.';
    case 'hungry':
      return 'Последний день периода монстрик закончил голодным.';
    default:
      return '';
  }
}

function discrepancyReviewExplanation({ review, config, findings }) {
  return [
    ...reviewPlanAndFactWords(review),
    ...findings.map((finding) => reviewFindingWords(finding, review, config)),
  ].filter(Boolean).join(' ');
}

// The mentor cards of the first review: the indivisible food, then a word about a hungry monster.
function firstReviewMentorSteps({ review, config, hungry }) {
  // More food than planned: the packs made the player buy for a day ahead. Less: one pack ran out.
  const trigger = review.food.cost > config.foodPlan ? 'budget-review-indivisible' : 'budget-review-food-short';
  return [
    { trigger, extra: reviewFoodNote(review, config) },
    ...(hungry ? [{ trigger: 'budget-review-hungry', closeLabel: 'Больше так не буду <span aria-hidden="true">→</span>' }] : []),
  ];
}

// From the second review on the mentor goes through every discrepancy of the budget, and then says
// that the next budget is the player's own.
const DISCREPANCY_MENTOR_TRIGGERS = {
  income: 'budget-review-income',
  overspent: 'budget-review-overspent',
  underspent: 'budget-review-underspent',
  borrowed: 'budget-review-borrowed',
  'on-plan': 'budget-review-on-plan',
  hungry: 'budget-review-hungry',
};

function discrepancyMentorExtra(finding) {
  switch (finding.kind) {
    case 'income':
      return finding.income.map(reviewIncomeText).join(' · ');
    case 'overspent':
      return finding.articles.map(reviewArticleChangeText).join(' · ');
    case 'underspent':
      return [
        ...finding.articles.map(reviewArticleChangeText),
        ...(finding.unspent > 0 ? [`в кармане осталось ${formatMoney(finding.unspent)}`] : []),
      ].join(' · ');
    case 'borrowed':
      return `Из копилки в карман: ${formatMoney(finding.amount)}`;
    default:
      return '';
  }
}

function discrepancyMentorSteps({ findings }) {
  return [
    ...findings.map((finding) => ({
      trigger: DISCREPANCY_MENTOR_TRIGGERS[finding.kind],
      extra: discrepancyMentorExtra(finding),
      ...(finding.kind === 'hungry' ? { closeLabel: 'Больше так не буду <span aria-hidden="true">→</span>' } : {}),
    })),
    { trigger: 'budget-review-alone', closeLabel: 'Составить третий бюджет <span aria-hidden="true">→</span>' },
  ];
}

// The comparison is the lesson of a financial episode; it is written down once per budget.
function logBudgetReview(current) {
  const { review, config, hungry, day, findings } = current;
  const logged = readProfileRecords(getUserProfileId()).some((record) => (
    record?.['Тип события'] === EPISODE_EVENT
    && record['Содержание события'] === config.content
    && Number(record['Номер бюджета']) === review.number
  ));
  if (logged) return;
  const { plan, fact, food } = review;
  logEpisode(config.content, {
    'Номер бюджета': review.number,
    'Игровой день': day,
    'Плановый бюджет': {
      [REQUIRED_ARTICLE]: plan.required,
      [FUN_ARTICLE]: plan.fun,
      [SAVINGS_ARTICLE]: plan.savings,
    },
    'Фактический бюджет': {
      [REQUIRED_ARTICLE]: fact.required,
      [FUN_ARTICLE]: fact.fun,
      [SAVINGS_ARTICLE]: fact.savings,
      'Не потрачено': review.unspent,
    },
    'Отклонение от плана': {
      [REQUIRED_ARTICLE]: fact.required - plan.required,
      [FUN_ARTICLE]: fact.fun - plan.fun,
      [SAVINGS_ARTICLE]: fact.savings - plan.savings,
    },
    'Корм': {
      'План': config.foodPlan,
      'Факт': food.cost,
      'Куплено пачек': food.packs,
      'Куплено граммов': food.grams,
      'Хватает на дней': food.days,
    },
    'Прибор от козявок': {
      'План': config.devicePlan,
      'Факт': review.devices.reduce((sum, device) => sum + device.cost, 0),
    },
    'Покупки на веселье': review.funPurchases.map(({ purpose, cost }) => ({ 'Назначение': purpose, 'Стоимость': cost })),
    'Внеплановые доходы': review.income.map((item) => ({
      'Источник средств': item.source,
      'Назначение': item.purpose,
      'Сумма': item.amount,
      'Зачислено': item.to,
    })),
    'Внеплановые доходы, всего': review.incomeTotal,
    'Переложено из копилки в карман': review.borrowed,
    'Куплены цели': (review.goalPurchases ?? []).map((goal) => ({ 'Название цели': goal.title, 'Стоимость': goal.cost })),
    'Монстрик голодный в конце периода': hungry,
    'Расхождения': findings.map((finding) => ({
      'Вид': finding.kind,
      'Описание': reviewFindingWords(finding, review, config),
    })),
    'Реплики ментора': config.mentorSteps(current).map((step) => step.trigger),
    'Пояснение': config.explanation(current),
  });
}

// The mentor sums the review up card by card, and then the next budget opens.
function showReviewMentorSteps(steps, title, done) {
  const [step, ...rest] = steps;
  if (!step) {
    done();
    return;
  }
  showMentor(step.trigger, {
    title,
    extra: step.extra ?? '',
    closeLabel: step.closeLabel ?? (rest.length
      ? 'Дальше <span aria-hidden="true">→</span>'
      : 'Составить новый бюджет <span aria-hidden="true">→</span>'),
    afterClose: () => showReviewMentorSteps(rest, title, done),
  });
}

budgetReviewMentorButton.addEventListener('click', () => {
  if (!activeBudgetReview) return;
  const { config, round } = activeBudgetReview;
  // The budget that opens the final part is preceded by the briefing about its rules.
  const next = () => (round.number === FINAL_PART_BUDGET ? startFinalBriefing() : startBudgetFlow(round.number));
  showReviewMentorSteps(config.mentorSteps(activeBudgetReview), config.mentorTitle, next);
});

// --- Shop -----------------------------------------------------------------

const SHOP_TUTORIAL_OBJECT_TYPE = 'Store tutorial';
const SHOP_VISIT_EVENT = 'Посещение магазина';
const SHOP_TAP_TOLERANCE = 8;
const SHOP_FOCUS_PADDING = 6;
const SHOP_MAX_QUANTITY = 10;
const SHOP_EPISODE_CONTENT = 'Выбор правильного товара, основываясь только на качественные характеристики и придерживаясь принципа минимальной достаточности.';

// The teaching rules of this episode: only Нормовет 5/2 meets both minimums (5% tails, 2% juice)
// and costs the least per 100 g, and even it makes sense only in the amount needed right now.
const SHOP_MENTOR_CLOSE_LABELS = {
  approved: 'Спасибо! <span aria-hidden="true">✓</span>',
  'too-many': 'Возьму меньше <span aria-hidden="true">→</span>',
  'low-quality': 'Выберу другой <span aria-hidden="true">→</span>',
  'overpaying': 'Выберу другой <span aria-hidden="true">→</span>',
  'unclear-quality': 'Выберу другой <span aria-hidden="true">→</span>',
};
const SHOP_MENTOR_RULES = {
  'Нормовет 5/2': { maxQuantity: 2, tooMany: 'too-many' },
  'Шеликс': { refuse: 'low-quality' },
  'Ориджин Резерв': { refuse: 'overpaying' },
  '67': { refuse: 'unclear-quality' },
};

const shopStage = $('#shop-stage');
const shopHud = $('.shop-hud');
const shopDay = $('#shop-day');
const shopPocket = $('#shop-pocket');
const shopRation = $('#shop-ration');
const shopRationValue = $('#shop-ration-value');
const shopPayday = $('#shop-payday');
const shopPaydayDays = $('#shop-payday-days');
const shopLoading = $('#shop-loading');
const shopBottomBar = $('#shop-bottom-bar');
const shopBrowseBar = $('#shop-browse-bar');
const shopInspectBar = $('#shop-inspect-bar');
const shopBackButton = $('#shop-back');
const shopInspectClose = $('#shop-inspect-close');
const shopInspectHint = $('#shop-inspect-hint');
const shopPurchaseTitle = $('#shop-purchase-title');
const shopPurchasePrice = $('#shop-purchase-price');
const shopQuantity = $('#shop-quantity');
const shopQuantityMinus = $('#shop-quantity-minus');
const shopQuantityPlus = $('#shop-quantity-plus');
const shopBuyButton = $('#shop-buy');
const shopPurchaseNote = $('#shop-purchase-note');
const shopSavingsOffer = $('#shop-savings-offer');
const shopGoHomeButton = $('#shop-go-home');
const shopTutorialLayer = $('#shop-tutorial-layer');
const shopTutorialFocus = $('#shop-tutorial-focus');
const shopTutorialProgress = $('#shop-tutorial-progress');
const shopTutorialText = $('#shop-tutorial-text');
const shopTutorialBack = $('#shop-tutorial-back');
const shopTutorialNext = $('#shop-tutorial-next');
const shopTutorialSkip = $('#shop-tutorial-skip');
const shopLoadingMarkup = shopLoading.innerHTML;
const shopPointers = new Map();
let shopGesture = null;
let shopRunId = 0;
let activeShopStore = null;
let shopPurchase = null;
// A shop the player has already bought something in, on an earlier visit, leaves them alone:
// the mentor has taught its lesson there, so later visits are complete freedom.
let shopFreeVisit = false;
const shopToasts = $('#shop-toasts');
const MENTOR_ABSENT_NOTE = 'Повторный поход в магазин: ментор не вмешивался, покупка состоялась.';

// Whether an earlier visit to the store ended with a purchase. Old food purchases may lack the
// store's name; there has only ever been one food shop, so they count for it.
function hasBoughtInStoreBefore(records, purchaseEvent, storeTitle, { unnamedCounts = false } = {}) {
  return records.some((record) => record?.['Тип события'] === purchaseEvent && (
    record['Магазин'] === storeTitle || (unnamedCounts && !record['Магазин'])
  ));
}

// A purchase made without the mentor is confirmed by a short toast instead of his card.
function showPurchaseToast(list, { item, quantity, total }) {
  const toast = document.createElement('li');
  toast.className = 'park-toast';
  const icon = document.createElement('span');
  icon.className = 'park-toast-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '🛍️';
  const body = document.createElement('span');
  const title = document.createElement('strong');
  title.textContent = `Куплено: «${item.title}»${quantity > 1 ? ` × ${quantity}` : ''}`;
  const note = document.createElement('small');
  const { pocket } = deriveRoomState(readProfileRecords(getUserProfileId()));
  note.textContent = `−${formatCoins(total)} · в кармане ${formatCoins(pocket)}`;
  body.append(title, note);
  toast.append(icon, body);
  list.append(toast);
  window.setTimeout(() => toast.remove(), 3600);
}
let shopShelfInsets = null;
let shopTutorialSteps = [];
let shopTutorialIndex = 0;

function pluralRu(count, one, few, many) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

function renderShopHud(records = readProfileRecords(getUserProfileId())) {
  const { day, pocket } = deriveRoomState(records);
  const daysLeft = daysUntilPayday(day);
  shopDay.textContent = String(day);
  shopPocket.textContent = formatCoins(pocket);
  shopRationValue.textContent = `${FOOD_PORTION_GRAMS} г`;
  shopRation.title = `Монстрик съедает ${FOOD_PORTION_GRAMS} г корма в день`;
  shopPayday.textContent = daysLeft === 1
    ? 'сегодня в конце дня'
    : `через ${daysLeft} ${pluralRu(daysLeft, 'день', 'дня', 'дней')}`;

  // One cell per day of the current pay period; the last one is the payday.
  const periodStart = day - (PAYDAY_PERIOD_DAYS - daysLeft);
  shopPaydayDays.replaceChildren(...Array.from({ length: PAYDAY_PERIOD_DAYS }, (_, index) => {
    const cell = document.createElement('li');
    const cellDay = periodStart + index;
    cell.textContent = index === PAYDAY_PERIOD_DAYS - 1 ? '🪙' : String(cellDay);
    cell.classList.toggle('is-past', cellDay < day);
    cell.classList.toggle('is-today', cellDay === day);
    cell.classList.toggle('is-payday', index === PAYDAY_PERIOD_DAYS - 1);
    return cell;
  }));
}

function shopItems() {
  return dataMartRows.filter((row) => row?.category === FOOD_CATEGORY);
}

// Page pixels covered by the HUD on top and by whatever the bottom bar shows right now.
function measureShopInsets() {
  const screenRect = shopScreen.getBoundingClientRect();
  const lowest = [shopBottomBar, shopInspectHint]
    .filter((element) => !element.hidden)
    .reduce((top, element) => Math.min(top, element.getBoundingClientRect().top), Infinity);
  return {
    top: shopHud.getBoundingClientRect().bottom - screenRect.top + 10,
    bottom: screenRect.bottom - lowest + 10,
  };
}

function resizeShopStage() {
  if (!shopController || shopScreen.hidden) return;
  const insets = measureShopInsets();
  // The shelf keeps the insets of the short browsing bar, so it does not jump while a box is inspected.
  if (!shopBrowseBar.hidden || !shopShelfInsets) shopShelfInsets = insets;
  shopController.resize(shopStage.clientWidth, shopStage.clientHeight, shopShelfInsets.top, shopShelfInsets.bottom);
  if (!shopInspectBar.hidden) shopController.setInspectInsets(insets.top, insets.bottom);
  if (!shopTutorialLayer.classList.contains('is-hidden')) {
    positionShopTutorialFocus(shopTutorialSteps[shopTutorialIndex]?.screen_area?.target);
  }
}

function setShopInspecting(item) {
  const inspecting = Boolean(item);
  shopBrowseBar.hidden = inspecting;
  shopInspectBar.hidden = !inspecting;
  shopInspectHint.hidden = !inspecting;
  shopStage.classList.toggle('is-inspecting', inspecting);
  shopPurchase = inspecting ? { item, quantity: 1 } : null;
  if (inspecting) renderShopPurchase();
}

function shopItemPrice(item) {
  const price = Number(item?.price);
  return item?.price != null && Number.isFinite(price) && price >= 0 ? price : null;
}

function renderShopPurchase() {
  if (!shopPurchase) return;
  const { item, quantity } = shopPurchase;
  const price = shopItemPrice(item);
  const { pocket, savings } = deriveRoomState(readProfileRecords(getUserProfileId()));
  const total = (price ?? 0) * quantity;
  const shortage = total - pocket;

  shopPurchaseTitle.textContent = item.title || 'Товар';
  shopPurchasePrice.textContent = price === null
    ? 'Цена не указана'
    : `${formatCoins(price)} за пачку${item.weight_in_grams ? ` · ${item.weight_in_grams} г` : ''}`;
  shopQuantity.value = String(quantity);
  shopQuantityMinus.disabled = quantity <= 1;
  shopQuantityPlus.disabled = quantity >= SHOP_MAX_QUANTITY;
  shopBuyButton.textContent = price === null ? 'Купить' : `Купить за ${formatCoins(total)}`;
  shopBuyButton.disabled = price === null || shortage > 0;
  shopPurchaseNote.classList.toggle('is-short', price !== null && shortage > 0);
  if (price === null) shopPurchaseNote.textContent = 'Этот товар пока нельзя купить';
  else if (shortage > 0) shopPurchaseNote.textContent = `Не хватает ${formatCoins(shortage)} · в копилке ${formatCoins(savings)}`;
  else shopPurchaseNote.textContent = `После покупки в кармане останется ${formatCoins(pocket - total)}`;
  shopSavingsOffer.hidden = !(price !== null && shortage > 0 && savings >= shortage);

  // The panel height changes with the offer, so the inspected box moves to stay above it.
  const insets = measureShopInsets();
  shopController?.setInspectInsets(insets.top, insets.bottom);
}

function changeShopQuantity(step) {
  if (!shopPurchase) return;
  shopPurchase.quantity = Math.max(1, Math.min(SHOP_MAX_QUANTITY, shopPurchase.quantity + step));
  renderShopPurchase();
}

function buyShopItem() {
  if (!shopPurchase) return;
  const { item, quantity } = shopPurchase;
  const price = shopItemPrice(item);
  const profileId = getUserProfileId();
  const records = readProfileRecords(profileId);
  const { day, pocket } = deriveRoomState(records);
  const total = (price ?? 0) * quantity;
  if (price === null || total > pocket) {
    renderShopPurchase();
    return;
  }

  const grams = Number(item.weight_in_grams) > 0 ? Number(item.weight_in_grams) * quantity : null;
  const portions = grams ? grams / FOOD_PORTION_GRAMS : quantity;
  const purchase = { item, quantity, total, portions, day, free: shopFreeVisit };

  // A learning game: a choice that teaches the wrong lesson is stopped before any money moves.
  // On a free visit the choice is still weighed for the log, but nothing stops it.
  const verdict = shopMentorVerdict(item, quantity);
  if (verdict && !purchase.free) {
    logShopDecision(verdict, purchase);
    showMentor(verdict, { title: item.title, closeLabel: SHOP_MENTOR_CLOSE_LABELS[verdict] });
    return;
  }

  appendProfileRecord({
    'Тип события': POCKET_SPENDING_EVENT,
    'Профиль пользователя': profileId,
    'Значение': total,
    'Назначение': `Покупка «${item.title}» × ${quantity}`,
    'Игровой день': day,
  });
  appendProfileRecord({
    'Тип события': FOOD_PURCHASE_EVENT,
    'Профиль пользователя': profileId,
    'Магазин': activeShopStore?.title ?? null,
    'Товар': item.title,
    'Идентификатор товара': item.id,
    'Категория': item.category,
    'Количество пачек': quantity,
    'Цена пачки': price,
    'Стоимость': total,
    'Масса, г': grams,
    'Игровой день': day,
  });
  // The food stock lives here, in grams: a feeding will take out a portion, not a pack.
  appendProfileRecord({
    'Тип события': INVENTORY_CHANGE_EVENT,
    'Тип инвентаря': item.id,
    'Количество': inventoryAmount(item, quantity),
    'Единица измерения': inventoryUnit(item),
    'Профиль пользователя': profileId,
  });
  // The analytics log wants every pocket money movement as a signed top-up, and every spending
  // charged to an article of the budget the player is living on right now.
  appendProfileRecord({
    'Тип события': POCKET_TOPUP_EVENT,
    'Профиль пользователя': profileId,
    'Значение': -total,
    'Назначение': `Покупка «${item.title}» × ${quantity}`,
    'Игровой день': day,
  });
  appendProfileRecord({
    'Тип события': BUDGET_FACT_EVENT,
    'Профиль пользователя': profileId,
    'Номер бюджета': currentBudgetNumber(records),
    'Статья бюджета': REQUIRED_ARTICLE,
    'Изменение статьи': total,
    'Игровой день': day,
  });

  logShopDecision(verdict ?? 'approved', purchase);
  renderShopHud();
  closeShopInspection();
  if (purchase.free) {
    showPurchaseToast(shopToasts, purchase);
    return;
  }
  showMentor('approved', {
    title: item.title,
    extra: `Куплено: «${item.title}» × ${quantity} за ${formatCoins(total)}`,
    closeLabel: SHOP_MENTOR_CLOSE_LABELS.approved,
  });
}

// null when the purchase is fine, otherwise the key of the mentor's objection.
function shopMentorVerdict(item, quantity) {
  const rule = SHOP_MENTOR_RULES[item?.title];
  if (!rule) return null;
  if (rule.refuse) return rule.refuse;
  return rule.maxQuantity && quantity > rule.maxQuantity ? rule.tooMany : null;
}

function shopDecisionExplanation(verdict, { item, quantity, total, portions, free = false }) {
  const attempt = `«${item.title}», ${quantity} ${pluralRu(quantity, 'пачка', 'пачки', 'пачек')}`
    + ` за ${total} ${pluralRu(total, 'монету', 'монеты', 'монет')}`;
  if (verdict === 'approved') {
    return `Игрок купил ${attempt}. Это единственный корм, который выполняет оба минимальных требования (не меньше 5% мышиных хвостиков и 2% колбасного сока) и стоит дешевле всех в пересчёте на 100 г. Взято ровно столько, сколько нужно сейчас: запас на ${portions} ${pluralRu(portions, 'день', 'дня', 'дней')}, остальные деньги остались свободными.`;
  }
  const reasons = {
    'too-many': `Корм выбран правильный, но запас сразу на ${portions} ${pluralRu(portions, 'день', 'дня', 'дней')} замораживает деньги в пачках на полке: если раньше понадобится что-то другое, свободных монет не останется.`,
    'low-quality': 'В составе только 0,5% колбасного сока при минимуме 2%, корм не подходит по качеству, и низкая цена этого не компенсирует.',
    'overpaying': 'Корм подходит, но в нём 10% хвостиков и 4% сока вместо нужных 5% и 2%. По правилам игрового мира излишек ничего не даёт, то есть это переплата вместо принципа минимальной достаточности.',
    'unclear-quality': 'На упаковке нет долей мышиных хвостиков и колбасного сока, только рекламные обещания. Проверить, подходит ли корм, невозможно, поэтому платить за него нельзя.',
  };
  if (free) return `Игрок купил ${attempt}. ${reasons[verdict] ?? ''} ${MENTOR_ABSENT_NOTE}`.replace('  ', ' ');
  return `Игрок пытался купить ${attempt}. ${reasons[verdict] ?? ''} Ментор остановил покупку.`.replace('  ', ' ');
}

function logShopDecision(verdict, purchase) {
  const { item, quantity, total, day } = purchase;
  logDecision(verdict === 'approved', {
    episode: SHOP_EPISODE_CONTENT,
    'Магазин': activeShopStore?.title ?? null,
    ...(purchase.free ? { 'Ментор не участвовал': true } : {}),
    'Товар': item.title,
    'Идентификатор товара': item.id,
    'Количество пачек': quantity,
    'Стоимость': total,
    'Игровой день': day,
    explanation: shopDecisionExplanation(verdict, purchase),
  });
}

async function enterShop(store) {
  const runId = ++shopRunId;
  closeRoomAction();
  hideRoomMessage();
  closeRoomInbox();
  finishShopTutorial();
  showOnlyScreen(shopScreen);
  shopScreen.setAttribute('aria-label', store.title || 'Магазин');
  activeShopStore = store;
  shopFreeVisit = false;
  shopToasts.replaceChildren();
  setShopInspecting(null);
  renderShopHud();
  shopLoading.innerHTML = shopLoadingMarkup;
  shopLoading.classList.remove('is-hidden');

  try {
    await monsterReadyPromise;
    if (!renderer) throw new Error('3D-сцена недоступна');
    if (!shopController) {
      shopController = new ShopShelf({
        anisotropy: renderer.capabilities.getMaxAnisotropy(),
        resolveImage: (folder, file) => publicAssetPath(folder, file, 'images/store'),
        onInspectChange: setShopInspecting,
      });
    }
    await shopController.build(shopItems());
    if (runId !== shopRunId) return;

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    shopController.active = true;
    attachRenderer(shopStage);
    resizeShopStage();
    shopLoading.classList.add('is-hidden');

    const profileId = getUserProfileId();
    const records = readProfileRecords(profileId);
    const firstVisit = !records.some(
      (record) => record?.['Тип события'] === SHOP_VISIT_EVENT && record['Магазин'] === store.title,
    );
    shopFreeVisit = hasBoughtInStoreBefore(records, FOOD_PURCHASE_EVENT, store.title, { unnamedCounts: true });
    const { day } = deriveRoomState(records);
    appendProfileRecord({
      'Тип события': SHOP_VISIT_EVENT,
      'Профиль пользователя': profileId,
      'Магазин': store.title,
      'Игровой день': day,
      ...(shopFreeVisit ? { 'Без ментора': true } : {}),
    });
    logEpisode(SHOP_EPISODE_CONTENT, { 'Магазин': store.title, 'Игровой день': day });
    if (firstVisit) startShopTutorial(store);
  } catch (error) {
    console.error('Не удалось открыть магазин:', error);
    if (runId !== shopRunId) return;
    shopLoading.innerHTML = '<span class="loading-eye" aria-hidden="true"></span><span>Магазин пока закрыт.<br>Обнови страницу!</span>';
  }
}

function leaveShop() {
  shopRunId += 1;
  finishShopTutorial();
  shopPointers.clear();
  shopGesture = null;
  if (shopController) {
    shopController.reset();
    shopController.active = false;
  }
  enterRoom();
}

function closeShopInspection() {
  shopController?.close();
  setShopInspecting(null);
}

function shopPointerPosition(event) {
  const rect = shopStage.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function shopPinchDistance() {
  const [first, second] = [...shopPointers.values()];
  return first && second ? Math.hypot(first.x - second.x, first.y - second.y) : 0;
}

shopStage.addEventListener('pointerdown', (event) => {
  if (!shopController?.active) return;
  shopStage.setPointerCapture?.(event.pointerId);
  shopPointers.set(event.pointerId, { x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY });
  shopGesture = shopPointers.size === 1
    ? { moved: false, pinch: 0 }
    : { moved: true, pinch: shopPinchDistance() };
});

shopStage.addEventListener('pointermove', (event) => {
  const pointer = shopPointers.get(event.pointerId);
  if (!pointer || !shopGesture || !shopController?.active) return;
  const dx = event.clientX - pointer.x;
  const dy = event.clientY - pointer.y;
  pointer.x = event.clientX;
  pointer.y = event.clientY;

  if (shopPointers.size >= 2) {
    const distance = shopPinchDistance();
    if (shopGesture.pinch > 0 && distance > 0) shopController.zoomBy(distance / shopGesture.pinch);
    shopGesture.pinch = distance;
    return;
  }
  if (Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY) > SHOP_TAP_TOLERANCE) {
    shopGesture.moved = true;
  }
  if (shopGesture.moved) shopController.rotate(dx, dy);
});

function endShopPointer(event) {
  if (!shopPointers.delete(event.pointerId)) return;
  const gesture = shopGesture;
  if (shopPointers.size > 0) {
    gesture.pinch = 0;
    return;
  }
  shopGesture = null;
  if (event.type !== 'pointerup' || !gesture || gesture.moved || !shopController?.active) return;

  const { x, y } = shopPointerPosition(event);
  if (shopController.inspection) {
    if (!shopController.hitsInspectedBox(x, y)) closeShopInspection();
    return;
  }
  shopController.inspect(shopController.pick(x, y));
}

shopStage.addEventListener('pointerup', endShopPointer);
shopStage.addEventListener('pointercancel', endShopPointer);

shopStage.addEventListener('wheel', (event) => {
  if (!shopController?.inspection) return;
  event.preventDefault();
  shopController.zoomBy(Math.exp(-event.deltaY * 0.0015));
}, { passive: false });

shopBackButton.addEventListener('click', leaveShop);
shopInspectClose.addEventListener('click', closeShopInspection);
shopQuantityMinus.addEventListener('click', () => changeShopQuantity(-1));
shopQuantityPlus.addEventListener('click', () => changeShopQuantity(1));
shopBuyButton.addEventListener('click', buyShopItem);
shopGoHomeButton.addEventListener('click', leaveShop);

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || shopScreen.hidden || !mentorLayer.hidden) return;
  if (shopController?.inspection) closeShopInspection();
});

function stopShopTutorialVoice() {
  shopTutorialAudio.pause();
  shopTutorialAudio.removeAttribute('src');
  shopTutorialAudio.load();
  shopTutorialVoicePlaying = false;
  updateMusicFade();
}

function playShopTutorialVoice(step) {
  stopShopTutorialVoice();
  if (!step?.audio) return;

  shopTutorialAudio.src = publicAssetPath(step.audio_folder, step.audio, 'audio/store_tutorial');
  shopTutorialAudio.volume = 1;
  shopTutorialAudio.muted = muted;
  shopTutorialAudio.play()
    .then(() => {
      shopTutorialVoicePlaying = true;
      updateMusicFade();
    })
    .catch((error) => {
      shopTutorialVoicePlaying = false;
      updateMusicFade();
      console.info(`Озвучка шага ${step.queue ?? shopTutorialIndex + 1} туториала магазина пока недоступна.`, error);
    });
}

shopTutorialAudio.addEventListener('ended', () => {
  shopTutorialVoicePlaying = false;
  updateMusicFade();
});

shopTutorialAudio.addEventListener('error', () => {
  if (!shopTutorialAudio.getAttribute('src')) return;
  shopTutorialVoicePlaying = false;
  updateMusicFade();
  console.warn('Не удалось загрузить озвучку туториала магазина:', shopTutorialAudio.currentSrc);
});

// Tutorial targets are HUD elements with data-shop-target or 3D objects the shelf can locate.
function shopTargetRect(target) {
  if (!target) return null;
  const element = shopScreen.querySelector(`[data-shop-target="${CSS.escape(String(target))}"]`);
  if (!element) return shopController?.screenRect(target) ?? null;
  const screenRect = shopScreen.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  return { left: rect.left - screenRect.left, top: rect.top - screenRect.top, width: rect.width, height: rect.height };
}

function positionShopTutorialFocus(target) {
  const rect = shopTargetRect(target);
  shopTutorialFocus.hidden = !rect;
  if (!rect) return;
  shopTutorialFocus.style.left = `${rect.left - SHOP_FOCUS_PADDING}px`;
  shopTutorialFocus.style.top = `${rect.top - SHOP_FOCUS_PADDING}px`;
  shopTutorialFocus.style.width = `${rect.width + SHOP_FOCUS_PADDING * 2}px`;
  shopTutorialFocus.style.height = `${rect.height + SHOP_FOCUS_PADDING * 2}px`;
}

function renderShopTutorialStep() {
  const step = shopTutorialSteps[shopTutorialIndex];
  if (!step) return finishShopTutorial();

  const area = step.screen_area || {};
  const last = shopTutorialIndex === shopTutorialSteps.length - 1;
  shopTutorialLayer.dataset.placement = area.message_placement || 'bottom';
  shopTutorialProgress.textContent = `ШАГ ${shopTutorialIndex + 1} ИЗ ${shopTutorialSteps.length}`;
  shopTutorialText.textContent = String(step.text || '');
  shopTutorialBack.disabled = shopTutorialIndex === 0;
  shopTutorialNext.innerHTML = last
    ? 'Понятно! <span aria-hidden="true">✓</span>'
    : 'Дальше <span aria-hidden="true">→</span>';
  positionShopTutorialFocus(area.target);
  playShopTutorialVoice(step);
}

function startShopTutorial(store) {
  shopTutorialSteps = dataMartRows
    .filter((row) => row?.object_type === SHOP_TUTORIAL_OBJECT_TYPE && row.title === store.title)
    .sort((left, right) => Number(left.queue) - Number(right.queue));
  if (!shopTutorialSteps.length) return;
  shopTutorialIndex = 0;
  setHidden(shopTutorialLayer, false);
  renderShopTutorialStep();
}

function finishShopTutorial() {
  stopShopTutorialVoice();
  setHidden(shopTutorialLayer, true);
  shopTutorialFocus.hidden = true;
}

shopTutorialNext.addEventListener('click', () => {
  if (shopTutorialIndex >= shopTutorialSteps.length - 1) return finishShopTutorial();
  shopTutorialIndex += 1;
  renderShopTutorialStep();
});

shopTutorialBack.addEventListener('click', () => {
  if (shopTutorialIndex === 0) return;
  shopTutorialIndex -= 1;
  renderShopTutorialStep();
});

shopTutorialSkip.addEventListener('click', finishShopTutorial);

// --- Магазин техники: интернет-витрина третьего дня -------------------------

const TECH_STORE_TITLE = 'Магазин техники';
const TECH_SHOP_EPISODE_CONTENT = 'Покупка прибора для ухода за монстриком: выбор по стоимости владения, а не по цене на ценнике.';
const TECH_COMPARE_EVENT = 'Сравнение товаров';
const TECH_APPROVED = 'cleaner-approved';
const TECH_MAX_QUANTITY = 5;
const TECH_FOCUS_PADDING = 6;
// Ownership is compared over the days the monster gets dirty on: 3, 6, 9 and 12.
const TECH_COMPARE_DAYS = [1, 2, 3, 4].map((step) => step * HARD_DAY_PERIOD);
// The horizon the mentor argues from: the third cleaning, where the cheap device overtakes.
const TECH_ARGUMENT_DAY = TECH_COMPARE_DAYS[2];

// The devices the mentor stops and the reply that explains why; the right one is not listed.
const TECH_MENTOR_RULES = {
  75: 'cleaner-cheap',
  77: 'cleaner-overpriced',
};
const TECH_MENTOR_CLOSE_LABELS = {
  [TECH_APPROVED]: 'Спасибо! <span aria-hidden="true">✓</span>',
  'cleaner-cheap': 'Посчитаю ещё раз <span aria-hidden="true">→</span>',
  'cleaner-overpriced': 'Выберу другой <span aria-hidden="true">→</span>',
  'cleaner-refill-first': 'Понял <span aria-hidden="true">→</span>',
  'cleaner-already': 'Не буду <span aria-hidden="true">→</span>',
};

const techShopDay = $('#tech-shop-day');
const techShopPocket = $('#tech-shop-pocket');
const techShopSavings = $('#tech-shop-savings');
const techShopPayday = $('#tech-shop-payday');
const techShopCatalog = $('#tech-shop-catalog');
const techShopBackButton = $('#tech-shop-back');
const techShopCompareButton = $('#tech-shop-compare');
const techProductPanel = $('#tech-shop-product');
const techProductClose = $('#tech-product-close');
const techProductImage = $('#tech-product-image');
const techProductTitle = $('#tech-product-title');
const techProductPrice = $('#tech-product-price');
const techProductText = $('#tech-product-text');
const techProductSpecs = $('#tech-product-specs');
const techProductAlso = $('#tech-product-also');
const techProductAlsoList = $('#tech-product-also-list');
const techQuantityGroup = $('#tech-quantity-group');
const techQuantityMinus = $('#tech-quantity-minus');
const techQuantityPlus = $('#tech-quantity-plus');
const techQuantity = $('#tech-quantity');
const techBuyButton = $('#tech-buy');
const techProductNote = $('#tech-product-note');
const techSavingsOffer = $('#tech-savings-offer');
const techGoHomeButton = $('#tech-go-home');
const techTaskOffer = $('#tech-task-offer');
const techCompareSheet = $('#tech-compare-sheet');
const techCompareCloseButton = $('#tech-compare-close');
const techCompareTable = $('#tech-compare-table');
const techCompareHint = $('#tech-compare-hint');
const techGoalOffer = createGoalOffer('tech', 'images/store');
const techToasts = $('#tech-toasts');
const techTutorialLayer = $('#tech-tutorial-layer');
const techTutorialFocus = $('#tech-tutorial-focus');
const techTutorialProgress = $('#tech-tutorial-progress');
const techTutorialText = $('#tech-tutorial-text');
const techTutorialBack = $('#tech-tutorial-back');
const techTutorialNext = $('#tech-tutorial-next');
const techTutorialSkip = $('#tech-tutorial-skip');

let techShopStore = null;
let techPurchase = null;
// See shopFreeVisit: after a purchase on an earlier visit the mentor no longer steps in here.
let techFreeVisit = false;
let techTutorialSteps = [];
let techTutorialIndex = 0;

// Every store row opens on the screen it is sold from: food on a 3D shelf, technique in a catalogue.
function openStore(store) {
  if (Number(store?.id) === TOY_STORE_ID) enterToyShop(store);
  else if (store?.title === TECH_STORE_TITLE) enterTechShop(store);
  else enterShop(store);
}

function techItems() {
  return techStoreItems(dataMartRows);
}

function techItemPrice(item) {
  const price = Number(item?.price);
  return item?.price != null && Number.isFinite(price) && price >= 0 ? price : null;
}

function techItemImage(item) {
  const file = item?.front_image_on_the_packaging || item?.image;
  return file ? publicAssetPath(item.image_folder, file, 'images/store') : null;
}

// Во всех фразах эпизода число стоит в винительном падеже: «за 21 монету», «на 1 монету дороже».
function coinsWord(count) {
  return pluralRu(count, 'монету', 'монеты', 'монет');
}

function cleaningsWord(count) {
  return pluralRu(count, 'чистка', 'чистки', 'чисток');
}

// «хватает на одну чистку», «рассчитан на двадцать чисток»
function cleaningsFor(count) {
  return pluralRu(count, 'чистку', 'чистки', 'чисток');
}

// «20 монет», with the crossed-out old price and the size of the cut next to it when there is one.
function renderTechPrice(target, item) {
  const price = techItemPrice(item) ?? 0;
  const oldPrice = Number(item?.old_price) || null;
  const discounted = Boolean(oldPrice && oldPrice > price);
  const now = document.createElement('span');
  now.className = 'tech-price-now';
  now.textContent = formatCoins(price);
  const parts = [now];
  if (discounted) {
    const was = document.createElement('span');
    was.className = 'tech-price-old';
    was.textContent = formatCoins(oldPrice);
    const cut = document.createElement('span');
    cut.className = 'tech-price-cut';
    cut.textContent = `−${oldPrice - price}`;
    parts.push(was, cut);
  }
  target.replaceChildren(...parts);
  return discounted;
}

function renderTechHud(records = readProfileRecords(getUserProfileId())) {
  const { day, pocket, savings } = deriveRoomState(records);
  const daysLeft = daysUntilPayday(day);
  techShopDay.textContent = String(day);
  techShopPocket.textContent = formatCoins(pocket);
  techShopSavings.textContent = formatCoins(Math.max(0, savings));
  techShopPayday.textContent = daysLeft === 1
    ? 'сегодня в конце дня'
    : `через ${daysLeft} ${pluralRu(daysLeft, 'день', 'дня', 'дней')}`;
}

// The headline of the ad is the first line of the data mart text, so the card can tease with it.
function techTeaser(item) {
  return String(item?.text || '')
    .split(/\r?\n/)
    .map((line) => line.replace(/<\/?sub>/gi, '').trim())
    .find((line) => line.length > 0) ?? '';
}

function renderTechCatalog() {
  const items = techItems();
  let discountMarked = false;
  techShopCatalog.replaceChildren(...items.map((item, index) => {
    const card = document.createElement('li');
    card.className = 'tech-card';
    if (index === 0) card.dataset.techTarget = 'tech-card';

    const photo = document.createElement('div');
    photo.className = 'tech-card-photo';
    const source = techItemImage(item);
    if (source) {
      const image = document.createElement('img');
      image.src = source;
      image.alt = '';
      image.loading = 'lazy';
      photo.append(image);
    }

    const body = document.createElement('div');
    body.className = 'tech-card-body';
    const title = document.createElement('h2');
    title.className = 'tech-card-title';
    title.textContent = item.title || '';
    const teaser = document.createElement('p');
    teaser.className = 'tech-card-teaser';
    teaser.textContent = techTeaser(item);
    const price = document.createElement('p');
    price.className = 'tech-price';
    const hasDiscount = renderTechPrice(price, item);
    // The tutorial points at the first price that carries a discount.
    if (hasDiscount && !discountMarked) {
      price.dataset.techTarget = 'tech-discount';
      discountMarked = true;
    }
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'tech-card-open';
    open.dataset.itemId = String(item.id);
    open.textContent = 'Подробнее ›';
    if (index === 0) open.dataset.techTarget = 'tech-details';

    body.append(title, teaser, price, open);
    card.append(photo, body);
    return card;
  }));
}

// The ad copy of the data mart, paragraph by paragraph; a line wrapped in <sub> is the fine print
// the seller hopes nobody reads, so it keeps its own quiet style.
function renderTechAdCopy(item) {
  const paragraphs = String(item?.text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const paragraph = document.createElement('p');
      if (/<sub>/i.test(line)) paragraph.className = 'tech-fineprint';
      paragraph.textContent = line.replace(/<\/?sub>/gi, '').trim();
      return paragraph;
    });
  techProductText.replaceChildren(...paragraphs);
}

function techSpecRow(term, value, warning = false) {
  const dt = document.createElement('dt');
  dt.textContent = term;
  const dd = document.createElement('dd');
  dd.textContent = value;
  if (warning) dd.classList.add('is-warning');
  return [dt, dd];
}

// What the marketing does not say out loud: the resource of the device and what it keeps costing.
function renderTechSpecs(item) {
  const items = techItems();
  const refills = cleanerRefills(items);
  const spec = itemSpec(item);
  const rows = [];

  if (spec?.kind === 'device') {
    const facts = deviceFacts(item, refills, TECH_COMPARE_DAYS);
    rows.push(...techSpecRow('Хватает на', `${facts.cleanings} ${cleaningsFor(facts.cleanings)}`, facts.cleanings <= 1));
    rows.push(...techSpecRow(
      'Нужны расходники',
      facts.refill ? `да: ${facts.refill.title}, ${formatCoins(facts.refillPrice)}` : 'нет, докупать нечего',
      Boolean(facts.refill),
    ));
    if (facts.cleaningPrice) {
      const [min, max] = facts.cleaningPrice.map((value) => Math.round(value * 10) / 10);
      rows.push(...techSpecRow('Одна чистка обходится в', min === max ? formatCoins(min) : `${min}–${max} 🪙`));
    }
  } else if (spec?.kind === 'refill') {
    const device = items.find((row) => row.id === spec.deviceId);
    const cartridges = Number(spec.cartridges) || 1;
    rows.push(...techSpecRow('Подходит к', device?.title || '—'));
    rows.push(...techSpecRow('В упаковке', `${cartridges} ${pluralRu(cartridges, 'картридж', 'картриджа', 'картриджей')}`));
    rows.push(...techSpecRow('Хватает на', `${cartridges} ${cleaningsFor(cartridges)}`));
    const each = Math.round(((techItemPrice(item) ?? 0) / cartridges) * 10) / 10;
    rows.push(...techSpecRow('Одна чистка обходится в', formatCoins(each)));
  }

  techProductSpecs.replaceChildren(...rows);
}

// The shop's own cross-sell: a device offers its refills, a refill offers the device it fits.
function renderTechAlsoBought(item) {
  const items = techItems();
  const spec = itemSpec(item);
  const related = spec?.kind === 'device'
    ? items.filter((row) => itemSpec(row)?.deviceId === item.id)
    : items.filter((row) => row.id === spec?.deviceId);

  techProductAlso.hidden = related.length === 0;
  techProductAlsoList.replaceChildren(...related.map((row) => {
    const entry = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tech-also-item';
    button.dataset.itemId = String(row.id);
    const source = techItemImage(row);
    if (source) {
      const image = document.createElement('img');
      image.src = source;
      image.alt = '';
      image.loading = 'lazy';
      button.append(image);
    } else {
      button.append(document.createElement('span'));
    }
    const name = document.createElement('span');
    name.textContent = row.title || '';
    const price = document.createElement('b');
    price.textContent = formatCoins(techItemPrice(row) ?? 0);
    button.append(name, price);
    entry.append(button);
    return entry;
  }));
}

function renderTechPurchase() {
  if (!techPurchase) return;
  const { item, quantity } = techPurchase;
  const price = techItemPrice(item);
  const { pocket, savings } = deriveRoomState(readProfileRecords(getUserProfileId()));
  const total = (price ?? 0) * quantity;
  const shortage = total - pocket;
  const piggy = Math.max(0, savings);

  // A device is bought one at a time; refills are the only thing worth counting.
  const countable = isCleanerRefill(item);
  techQuantityGroup.hidden = !countable;
  techQuantity.value = String(quantity);
  techQuantityMinus.disabled = quantity <= 1;
  techQuantityPlus.disabled = quantity >= TECH_MAX_QUANTITY;

  techBuyButton.textContent = price === null ? 'Купить' : `Купить за ${formatCoins(total)}`;
  techBuyButton.disabled = price === null || shortage > 0;
  techProductNote.classList.toggle('is-short', price !== null && shortage > 0);
  if (price === null) techProductNote.textContent = 'Этот товар пока нельзя купить';
  else if (shortage > 0) techProductNote.textContent = `Не хватает ${formatCoins(shortage)} · в копилке ${formatCoins(piggy)}`;
  else techProductNote.textContent = `После покупки в кармане останется ${formatCoins(pocket - total)}`;

  // Two answers to «не хватает»: сходить за копилкой или заработать на дополнительном задании.
  techSavingsOffer.hidden = !(price !== null && shortage > 0 && piggy >= shortage);
  techTaskOffer.hidden = !(price !== null && shortage > 0 && piggy < shortage);
}

function renderTechProduct() {
  if (!techPurchase) return;
  const { item } = techPurchase;
  const source = techItemImage(item);
  techProductImage.hidden = !source;
  if (source) techProductImage.src = source;
  techProductImage.alt = item.title || '';
  techProductTitle.textContent = item.title || '';
  renderTechPrice(techProductPrice, item);
  renderTechAdCopy(item);
  renderTechSpecs(item);
  renderTechAlsoBought(item);
  renderTechPurchase();
}

function openTechProduct(item) {
  if (!item) return;
  techPurchase = { item, quantity: 1 };
  techProductPanel.hidden = false;
  renderTechProduct();
  techProductPanel.querySelector('.tech-product-scroll').scrollTop = 0;
  techProductClose.focus({ preventScroll: true });
}

function closeTechProduct() {
  techPurchase = null;
  techProductPanel.hidden = true;
}

function changeTechQuantity(step) {
  if (!techPurchase) return;
  techPurchase.quantity = Math.max(1, Math.min(TECH_MAX_QUANTITY, techPurchase.quantity + step));
  renderTechPurchase();
}

// null when the purchase is fine, otherwise the key of the mentor's objection.
function techMentorVerdict(item, state) {
  const spec = itemSpec(item);
  const owned = ownedDevice(state.inventory, techItems());
  if (spec?.kind === 'device') {
    if (owned) return 'cleaner-already';
    return TECH_MENTOR_RULES[item.id] ?? null;
  }
  // A cartridge is useless without the device it clicks into.
  if (spec?.kind === 'refill') return (state.inventory.get(spec.deviceId) ?? 0) > 0 ? null : 'cleaner-refill-first';
  return null;
}

function techDecisionExplanation(verdict, { item, quantity, total, state, free = false }) {
  const items = techItems();
  const refills = cleanerRefills(items);
  const right = items.find((row) => row.id === RIGHT_CLEANER_ID) ?? null;
  const rightCost = right ? ownershipCost(right, refills, cleaningsByDay(TECH_ARGUMENT_DAY)) : null;
  const cleanings = cleaningsByDay(TECH_ARGUMENT_DAY);
  const spec = itemSpec(item);
  const resource = spec?.cleanings ?? 0;
  const attempt = `«${item.title}»${quantity > 1 ? ` × ${quantity}` : ''} за ${total} ${coinsWord(total)}`;

  if (verdict === TECH_APPROVED) {
    if (spec?.kind === 'refill') {
      const device = items.find((row) => row.id === spec.deviceId);
      return `Игрок купил ${attempt} к прибору «${device?.title ?? ''}», который у него уже есть.`
        + ' Расходник куплен под имеющийся прибор, а не наугад.';
    }
    const own = ownershipCost(item, refills, cleanings);
    const rival = items.find((row) => isCleanerDevice(row) && row.id !== item.id && itemSpec(row)?.refillId);
    const rivalCost = rival ? ownershipCost(rival, refills, cleanings) : null;
    const discount = Number(item.old_price) || null;
    return `Игрок купил ${attempt}${discount ? ` (по скидке с ${discount})` : ''}.`
      + ` Прибор рассчитан на ${resource} ${cleaningsFor(resource)} и не требует расходников.`
      + ` К ${TECH_ARGUMENT_DAY}-му дню, когда монстрик испачкается в третий раз, владение обойдётся`
      + ` в ${own} ${coinsWord(own)}${rival && rivalCost !== null ? ` против ${rivalCost} у прибора «${rival.title}»` : ''}.`
      + ' Выбор сделан по стоимости владения, а не по цене на ценнике.';
  }

  let reason = '';
  if (verdict === 'cleaner-cheap') {
    const refill = refills.find((row) => row.id === spec?.refillId) ?? null;
    const refillPrice = refill ? techItemPrice(refill) ?? 0 : 0;
    const own = ownershipCost(item, refills, cleanings);
    const gap = right ? (techItemPrice(right) ?? 0) - (techItemPrice(item) ?? 0) : 0;
    reason = `Сегодня это дешевле${right ? `, чем «${right.title}», на ${gap} ${coinsWord(gap)}` : ''},`
      + ` но прибора хватает на ${resource} ${cleaningsFor(resource)}`
      + `${refill ? `, а каждый следующий картридж стоит ${refillPrice} ${coinsWord(refillPrice)}` : ''}:`
      + ` к ${TECH_ARGUMENT_DAY}-му дню (${cleanings} ${cleaningsWord(cleanings)}) владение обойдётся`
      + ` в ${own} ${coinsWord(own)}${rightCost !== null ? ` против ${rightCost} у прибора «${right.title}»` : ''}.`;
  } else if (verdict === 'cleaner-overpriced') {
    const overpay = right ? (techItemPrice(item) ?? 0) - (techItemPrice(right) ?? 0) : 0;
    reason = `По характеристикам прибор такой же, как${right ? ` «${right.title}»` : ' более дешёвый'}`
      + ` (${resource} ${cleaningsWord(resource)}, без расходников), но стоит на ${overpay} ${coinsWord(overpay)} дороже:`
      + ' это переплата за корпус и название, а не за пользу.';
  } else if (verdict === 'cleaner-refill-first') {
    const device = items.find((row) => row.id === spec?.deviceId);
    reason = `Картридж подходит только к «${device?.title ?? 'прибору'}», а такого прибора у игрока нет:`
      + ' монеты ушли бы, а монстрик остался бы грязным.';
  } else if (verdict === 'cleaner-already') {
    const owned = ownedDevice(state.inventory, items);
    reason = `У игрока уже есть «${owned?.title ?? 'прибор для козявок'}»:`
      + ' второй такой же ничего не добавляет, а монеты нужны на корм и на большую цель.';
  }

  if (free) return `Игрок купил ${attempt}. ${reason} ${MENTOR_ABSENT_NOTE}`;
  return `Игрок пытался купить ${attempt}. ${reason} Ментор отменил покупку.`;
}

function logTechDecision(verdict, purchase) {
  const { item, quantity, total, day } = purchase;
  logDecision(verdict === TECH_APPROVED, {
    episode: TECH_SHOP_EPISODE_CONTENT,
    'Магазин': techShopStore?.title ?? TECH_STORE_TITLE,
    ...(purchase.free ? { 'Ментор не участвовал': true } : {}),
    'Товар': item.title,
    'Идентификатор товара': item.id,
    'Количество': quantity,
    'Цена': techItemPrice(item),
    'Стоимость': total,
    'Игровой день': day,
    explanation: techDecisionExplanation(verdict, purchase),
  });
}

function buyTechItem() {
  if (!techPurchase) return;
  const { item, quantity } = techPurchase;
  const price = techItemPrice(item);
  const profileId = getUserProfileId();
  const records = readProfileRecords(profileId);
  const state = deriveRoomState(records);
  const total = (price ?? 0) * quantity;
  if (price === null || total > state.pocket) {
    renderTechPurchase();
    return;
  }

  const purchase = { item, quantity, total, day: state.day, state, free: techFreeVisit };

  // A learning game: a choice that teaches the wrong lesson is stopped before any money moves.
  // On a free visit the choice is still weighed for the log, but nothing stops it.
  const verdict = techMentorVerdict(item, state);
  if (verdict && !purchase.free) {
    logTechDecision(verdict, purchase);
    showMentor(verdict, { title: TECH_STORE_TITLE, closeLabel: TECH_MENTOR_CLOSE_LABELS[verdict] });
    return;
  }

  appendProfileRecord({
    'Тип события': POCKET_SPENDING_EVENT,
    'Профиль пользователя': profileId,
    'Значение': total,
    'Назначение': `Покупка «${item.title}» × ${quantity}`,
    'Игровой день': state.day,
  });
  appendProfileRecord({
    'Тип события': GOODS_PURCHASE_EVENT,
    'Профиль пользователя': profileId,
    'Магазин': techShopStore?.title ?? TECH_STORE_TITLE,
    'Товар': item.title,
    'Идентификатор товара': item.id,
    'Категория': item.category,
    'Количество': quantity,
    'Цена': price,
    'Старая цена': Number(item.old_price) || null,
    'Стоимость': total,
    'Игровой день': state.day,
  });
  // Stock is counted in the unit the thing is used up in, so a three-pack lands as three cartridges.
  const change = inventoryChange(item, quantity);
  appendProfileRecord({
    'Тип события': INVENTORY_CHANGE_EVENT,
    'Тип инвентаря': change.id,
    'Количество': change.amount,
    'Единица измерения': inventoryUnit(item),
    'Профиль пользователя': profileId,
  });
  // The analytics log wants every movement of pocket money as a signed top-up, and a device for the
  // monster's care is an obligatory expense of the budget the player is living on right now.
  appendProfileRecord({
    'Тип события': POCKET_TOPUP_EVENT,
    'Профиль пользователя': profileId,
    'Значение': -total,
    'Назначение': `Покупка «${item.title}» × ${quantity}`,
    'Игровой день': state.day,
  });
  appendProfileRecord({
    'Тип события': BUDGET_FACT_EVENT,
    'Профиль пользователя': profileId,
    'Номер бюджета': currentBudgetNumber(records),
    'Статья бюджета': REQUIRED_ARTICLE,
    'Изменение статьи': total,
    'Игровой день': state.day,
  });

  logTechDecision(verdict ?? TECH_APPROVED, purchase);
  renderTechHud();
  renderTechCatalog();
  closeTechProduct();
  if (purchase.free) {
    showPurchaseToast(techToasts, purchase);
    offerTechGoal();
    return;
  }
  showMentor(TECH_APPROVED, {
    title: TECH_STORE_TITLE,
    extra: `Куплено: «${item.title}» × ${quantity} за ${formatCoins(total)}`,
    closeLabel: TECH_MENTOR_CLOSE_LABELS[TECH_APPROVED],
    afterClose: offerTechGoal,
  });
}

// The coins are at home in the piggy bank: the room opens it with the missing sum already set,
// and its tutorial comes first if the player has never taken anything out of it.
function goHomeForTechSavings() {
  if (!techPurchase) return;
  const { item, quantity } = techPurchase;
  const profileId = getUserProfileId();
  const { day, pocket } = deriveRoomState(readProfileRecords(profileId));
  const total = (techItemPrice(item) ?? 0) * quantity;
  const shortage = Math.max(0, total - pocket);
  appendProfileRecord({
    'Тип события': PARK_HOME_FOR_SAVINGS_EVENT,
    'Профиль пользователя': profileId,
    'Магазин': techShopStore?.title ?? TECH_STORE_TITLE,
    'Товар': item.title,
    'Стоимость': total,
    'Не хватает': shortage,
    'Игровой день': day,
  });
  pendingSavingsShortage = shortage;
  leaveTechShop();
}

// --- Допродажа: магазин рекомендует крупную покупку ---

function offerTechGoal() {
  const { day } = deriveRoomState(readProfileRecords(getUserProfileId()));
  const source = { id: techShopStore?.id ?? null, title: techShopStore?.title ?? TECH_STORE_TITLE };
  return offerShopGoal(savingsGoalForDay(day), techGoalOffer, source, techToasts);
}

// --- Сравнение товаров: таблица появляется только по кнопке ---

function renderTechCompare() {
  const items = techItems();
  const refills = cleanerRefills(items);
  const facts = cleanerDevices(items).map((device) => deviceFacts(device, refills, TECH_COMPARE_DAYS));

  const head = document.createElement('thead');
  const headRow = document.createElement('tr');
  headRow.append(document.createElement('th'));
  for (const fact of facts) {
    const cell = document.createElement('th');
    cell.scope = 'col';
    cell.textContent = fact.item.title || '';
    headRow.append(cell);
  }
  head.append(headRow);

  const body = document.createElement('tbody');
  const cell = (text, className = '') => {
    const element = document.createElement('td');
    element.textContent = text;
    if (className) element.className = className;
    return element;
  };
  const addRow = (label, cells, total = false) => {
    const row = document.createElement('tr');
    if (total) row.classList.add('is-total');
    const term = document.createElement('th');
    term.scope = 'row';
    term.textContent = label;
    row.append(term, ...cells);
    body.append(row);
  };

  addRow('Цена сейчас', facts.map((fact) => cell(
    fact.oldPrice && fact.oldPrice > fact.price ? `${fact.price} (было ${fact.oldPrice})` : String(fact.price),
  )));
  addRow('Хватает на', facts.map((fact) => cell(
    `${fact.cleanings} ${cleaningsFor(fact.cleanings)}`,
    fact.cleanings <= 1 ? 'is-warning' : '',
  )));
  addRow('Расходники', facts.map((fact) => cell(
    fact.refill ? `картридж ${fact.refillPrice} 🪙` : 'не нужны',
    fact.refill ? 'is-warning' : '',
  )));
  addRow('Одна чистка', facts.map((fact) => {
    if (!fact.cleaningPrice) return cell('—');
    const [min, max] = fact.cleaningPrice.map((value) => Math.round(value * 10) / 10);
    return cell(min === max ? `${min} 🪙` : `${min}–${max} 🪙`);
  }));

  // The whole point of the table: what each device will have cost by the dirty days ahead.
  TECH_COMPARE_DAYS.forEach((day, index) => {
    const totals = facts.map((fact) => fact.totals[index]?.cost ?? null);
    const known = totals.filter((value) => value !== null);
    const best = known.length ? Math.min(...known) : null;
    const cleanings = cleaningsByDay(day);
    addRow(
      `К ${day}-му дню (${cleanings} ${cleaningsWord(cleanings)})`,
      totals.map((value) => cell(value === null ? '—' : `${value} 🪙`, value !== null && value === best ? 'is-best' : '')),
      true,
    );
  });

  techCompareTable.replaceChildren(head, body);
  techCompareHint.textContent = `Монстрик пачкается каждый ${HARD_DAY_PERIOD}-й день, поэтому к ${TECH_ARGUMENT_DAY}-му дню`
    + ` чисток будет уже ${cleaningsByDay(TECH_ARGUMENT_DAY)}, а дальше — больше. Зелёным отмечено самое дешёвое владение.`;
}

function openTechCompare() {
  renderTechCompare();
  techCompareSheet.hidden = false;
  techCompareCloseButton.focus({ preventScroll: true });
  // Whether the player compared before deciding is itself a result worth keeping.
  appendProfileRecord({
    'Тип события': TECH_COMPARE_EVENT,
    'Профиль пользователя': getUserProfileId(),
    'Магазин': techShopStore?.title ?? TECH_STORE_TITLE,
    'Игровой день': deriveRoomState(readProfileRecords(getUserProfileId())).day,
  });
}

function closeTechCompare() {
  techCompareSheet.hidden = true;
}

// --- Вход и выход ---

function enterTechShop(store) {
  closeRoomAction();
  hideRoomMessage();
  closeRoomInbox();
  finishTechTutorial();
  closeTechProduct();
  closeTechCompare();
  techGoalOffer.close(null);
  techToasts.replaceChildren();
  techShopStore = store ?? null;
  showOnlyScreen(techShopScreen);
  techShopScreen.setAttribute('aria-label', store?.title || TECH_STORE_TITLE);
  renderTechHud();
  renderTechCatalog();

  const profileId = getUserProfileId();
  const records = readProfileRecords(profileId);
  const storeTitle = store?.title ?? TECH_STORE_TITLE;
  const firstVisit = !records.some(
    (record) => record?.['Тип события'] === SHOP_VISIT_EVENT && record['Магазин'] === storeTitle,
  );
  techFreeVisit = hasBoughtInStoreBefore(records, GOODS_PURCHASE_EVENT, storeTitle);
  const { day } = deriveRoomState(records);
  appendProfileRecord({
    'Тип события': SHOP_VISIT_EVENT,
    'Профиль пользователя': profileId,
    'Магазин': storeTitle,
    'Игровой день': day,
    ...(techFreeVisit ? { 'Без ментора': true } : {}),
  });
  logEpisode(TECH_SHOP_EPISODE_CONTENT, { 'Магазин': storeTitle, 'Игровой день': day });
  if (firstVisit) startTechTutorial(store);
}

function leaveTechShop() {
  finishTechTutorial();
  closeTechProduct();
  closeTechCompare();
  techGoalOffer.close(null);
  techToasts.replaceChildren();
  enterRoom();
}

techShopCatalog.addEventListener('click', (event) => {
  const open = event.target.closest('.tech-card-open');
  if (!open) return;
  openTechProduct(techItems().find((item) => String(item.id) === open.dataset.itemId));
});

techProductAlsoList.addEventListener('click', (event) => {
  const entry = event.target.closest('.tech-also-item');
  if (!entry) return;
  openTechProduct(techItems().find((item) => String(item.id) === entry.dataset.itemId));
});

techProductClose.addEventListener('click', closeTechProduct);
techQuantityMinus.addEventListener('click', () => changeTechQuantity(-1));
techQuantityPlus.addEventListener('click', () => changeTechQuantity(1));
techBuyButton.addEventListener('click', buyTechItem);
techGoHomeButton.addEventListener('click', goHomeForTechSavings);
techShopBackButton.addEventListener('click', leaveTechShop);
techShopCompareButton.addEventListener('click', openTechCompare);
techCompareCloseButton.addEventListener('click', closeTechCompare);
techCompareSheet.addEventListener('click', (event) => {
  if (event.target === techCompareSheet) closeTechCompare();
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || techShopScreen.hidden || !mentorLayer.hidden) return;
  if (!techCompareSheet.hidden) closeTechCompare();
  else if (!techProductPanel.hidden) closeTechProduct();
});

// --- Туториал магазина техники ---

function techTargetRect(target) {
  if (!target) return null;
  const element = techShopScreen.querySelector(`[data-tech-target="${CSS.escape(String(target))}"]`);
  if (!element) return null;
  const screenRect = techShopScreen.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  return { left: rect.left - screenRect.left, top: rect.top - screenRect.top, width: rect.width, height: rect.height };
}

function positionTechTutorialFocus(target) {
  const rect = techTargetRect(target);
  techTutorialFocus.hidden = !rect;
  if (!rect) return;
  techTutorialFocus.style.left = `${rect.left - TECH_FOCUS_PADDING}px`;
  techTutorialFocus.style.top = `${rect.top - TECH_FOCUS_PADDING}px`;
  techTutorialFocus.style.width = `${rect.width + TECH_FOCUS_PADDING * 2}px`;
  techTutorialFocus.style.height = `${rect.height + TECH_FOCUS_PADDING * 2}px`;
}

function renderTechTutorialStep() {
  const step = techTutorialSteps[techTutorialIndex];
  if (!step) return finishTechTutorial();

  const area = step.screen_area || {};
  const last = techTutorialIndex === techTutorialSteps.length - 1;
  techTutorialLayer.dataset.placement = area.message_placement || 'bottom';
  techTutorialProgress.textContent = `ШАГ ${techTutorialIndex + 1} ИЗ ${techTutorialSteps.length}`;
  techTutorialText.textContent = String(step.text || '');
  techTutorialBack.disabled = techTutorialIndex === 0;
  techTutorialNext.innerHTML = last
    ? 'Понятно! <span aria-hidden="true">✓</span>'
    : 'Дальше <span aria-hidden="true">→</span>';
  positionTechTutorialFocus(area.target);
  playShopTutorialVoice(step);
}

function startTechTutorial(store) {
  techTutorialSteps = dataMartRows
    .filter((row) => row?.object_type === SHOP_TUTORIAL_OBJECT_TYPE && row.title === (store?.title ?? TECH_STORE_TITLE))
    .sort((left, right) => Number(left.queue) - Number(right.queue));
  if (!techTutorialSteps.length) return;
  techTutorialIndex = 0;
  setHidden(techTutorialLayer, false);
  renderTechTutorialStep();
}

function finishTechTutorial() {
  stopShopTutorialVoice();
  setHidden(techTutorialLayer, true);
  techTutorialFocus.hidden = true;
}

techTutorialNext.addEventListener('click', () => {
  if (techTutorialIndex >= techTutorialSteps.length - 1) return finishTechTutorial();
  techTutorialIndex += 1;
  renderTechTutorialStep();
});

techTutorialBack.addEventListener('click', () => {
  if (techTutorialIndex === 0) return;
  techTutorialIndex -= 1;
  renderTechTutorialStep();
});

techTutorialSkip.addEventListener('click', finishTechTutorial);

window.addEventListener('resize', () => {
  if (!techTutorialLayer.classList.contains('is-hidden')) {
    positionTechTutorialFocus(techTutorialSteps[techTutorialIndex]?.screen_area?.target);
  }
});

// --- Toy shop ---------------------------------------------------------------

const toyAisle = $('#toy-aisle');
const toyCartItems = $('#toy-cart-items');
const toyCartTotalLabel = $('#toy-cart-total');
const toySpeech = $('#toy-speech');
const toyTagSheet = $('#toy-tag-sheet');
const toyTag = $('#toy-tag');
const toyCapsuleSheet = $('#toy-capsule-sheet');
const toyCheckoutSheet = $('#toy-checkout-sheet');
const toyCheckoutBelt = $('#toy-checkout-belt');
const toyCheckoutNote = $('#toy-checkout-note');
const toyPlaySheet = $('#toy-play-sheet');
const toyTutorialLayer = $('#toy-tutorial-layer');
const toyTutorialFocus = $('#toy-tutorial-focus');
const toyGoalOffer = createGoalOffer('toy', 'images/toy-shop');
const toyToasts = $('#toy-toasts');
let toyTutorialSteps = [];
const TOY_STOP_NAMES = ['Вход', 'Умные игрушки', 'Двор и возраст', 'Коллекции', 'Хит сезона', 'Открытия', 'Активные игры', 'Творчество', 'Мастерская', 'Музыка', 'Исследования', 'Сказки'];
const toyMentorText = (trigger) => mentorReply(trigger, TOY_STORE_TITLE)?.text ?? MENTOR_FALLBACK_TEXT;
const toyMonsterLine = (trigger) => dataMartRows.find((row) => row?.object_type === MONSTER_LINE_OBJECT_TYPE
  && row.title === TOY_STORE_TITLE && row.trigger === trigger) ?? null;
let toyCart = new Set();
let toySelected = null;
let toyFreeVisit = false;
let toyTutorialIndex = 0;
let toyTutorialActive = false;
let toySpinCountThisVisit = 0;
let toyDuplicateThisVisit = false;
let toyLossReviewed = false;
let toySpeechTimer = null;
let toyRequestedStop = 0;
let toyCapsuleAnimationToken = 0;

const toyImage = (toy) => publicAssetPath(toy.imageFolder, toy.image, 'images/toy-shop');
const TOY_SOUND_URLS = {
  coin: '/audio/toy_shop/coin.wav', crank: '/audio/toy_shop/crank.wav', drop: '/audio/toy_shop/drop.wav',
  open: '/audio/toy_shop/open.wav', duplicate: '/audio/toy_shop/duplicate.wav', beep: '/audio/toy_shop/beep.wav',
  belt: '/audio/toy_shop/belt.wav', robot: '/audio/toy_shop/robot_jingle.wav',
};
function playToySound(name) {
  if (muted || !TOY_SOUND_URLS[name]) return;
  const sound = new Audio(TOY_SOUND_URLS[name]);
  sound.volume = 0.5;
  sound.play().catch(() => {});
}
function stopToyMonsterVoice() {
  toyMonsterAudio.pause();
  toyMonsterAudio.removeAttribute('src');
  toyMonsterAudio.load();
  toyMonsterVoicePlaying = false;
  updateMusicFade();
}
function playToyMonsterVoice(line) {
  stopToyMonsterVoice();
  if (!line?.audio) return;
  toyMonsterAudio.src = publicAssetPath(line.audio_folder, line.audio, 'audio/toy_monster');
  toyMonsterAudio.volume = 1;
  toyMonsterAudio.muted = muted;
  toyMonsterAudio.play().then(() => {
    toyMonsterVoicePlaying = true;
    updateMusicFade();
  }).catch(() => {
    toyMonsterVoicePlaying = false;
    updateMusicFade();
  });
}
toyMonsterAudio.addEventListener('ended', () => { toyMonsterVoicePlaying = false; updateMusicFade(); });
toyMonsterAudio.addEventListener('error', () => { toyMonsterVoicePlaying = false; updateMusicFade(); });
const toyRecords = () => readProfileRecords(getUserProfileId());
const toyCurrentState = () => deriveRoomState(toyRecords());

function renderToyHud() {
  const { day, pocket, stats } = toyCurrentState();
  $('#toy-shop-day').textContent = String(day);
  $('#toy-shop-pocket').textContent = formatCoins(pocket);
  $('#toy-shop-mood').textContent = String(stats.mood);
  $('#toy-shop-development').textContent = String(stats.development);
  renderToyEffects();
}

// From day 10 on, when the monster's stats decide the game, every toy says what it would do to them:
// the change of the stats as the purchase would write it (development stops at its maximum) and
// whether the monster gets dirty.
const TOY_EFFECT_FROM_DAY = 10;
const TOY_EFFECT_STATS = [['mood', '😊', 'Настроение'], ['development', '🧠', 'Развитие']];

function toyEffect(toy, state) {
  const stats = TOY_EFFECT_STATS.map(([key, icon, label]) => {
    const before = state.stats[key];
    const after = clampStat(before + (Number(toy[key]) || 0), key);
    return { key, icon, label, wanted: Number(toy[key]) || 0, change: after - before, before, after };
  });
  return { stats, dirty: toy.dirty && !state.dirty };
}

const signed = (value) => `${value > 0 ? '+' : value < 0 ? '−' : '±'}${Math.abs(value)}`;
const statValue = (value) => (value < 0 ? `−${-value}` : String(value));

// «😊+5 🧠+1» for the shelf.
function toyEffectShort(effect) {
  const parts = effect.stats
    .filter((stat) => stat.wanted !== 0 || stat.change !== 0)
    .map((stat) => `${stat.icon}${stat.change === 0 ? (stat.wanted > 0 ? 'макс' : 'мин') : signed(stat.change)}`);
  if (effect.dirty) parts.push('🫧 грязь');
  return parts.length ? parts.join(' ') : 'без эффекта';
}

// «Настроение +5 (0 → 5) · Развитие ±0: уже максимум» for the tag and the checkout.
function toyEffectLong(effect) {
  const parts = effect.stats
    .filter((stat) => stat.wanted !== 0 || stat.change !== 0)
    .map((stat) => (stat.change === 0
      ? `${stat.icon} ${stat.label} ±0: уже ${stat.wanted > 0 ? 'максимум' : 'минимум'}`
      : `${stat.icon} ${stat.label} ${signed(stat.change)} (${statValue(stat.before)} → ${statValue(stat.after)})`));
  if (effect.dirty) parts.push('🫧 монстрик испачкается');
  return parts.length ? parts.join(' · ') : 'на монстрика не повлияет';
}

function renderToyEffects() {
  const state = toyCurrentState();
  const show = state.day >= TOY_EFFECT_FROM_DAY;
  toyShopScreen.querySelectorAll('.toy-product').forEach((button) => {
    const toy = toyById(button.dataset.toyId);
    let badge = button.querySelector('.toy-product-effect');
    if (!show || !toy) {
      badge?.remove();
      return;
    }
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'toy-product-effect';
      button.append(badge);
    }
    badge.textContent = toyEffectShort(toyEffect(toy, state));
  });
  const slime = toyById('slime');
  $('#toy-slime-effect').hidden = !show || !slime;
  if (show && slime) $('#toy-slime-effect').textContent = `Эффект: ${toyEffectLong(toyEffect(slime, state))}`;
}

function renderToyCart() {
  const items = [...toyCart].map(toyById).filter(Boolean);
  if (items.length) {
    toyCartItems.replaceChildren(...items.map((toy) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'toy-cart-chip';
      chip.dataset.removeToy = toy.id;
      chip.setAttribute('aria-label', `Вынуть из тележки: ${toy.title}`);
      chip.textContent = toy.title;
      return chip;
    }));
  } else toyCartItems.textContent = 'Пока пуста';
  toyCartTotalLabel.textContent = formatCoins(toyCartTotal([...toyCart]));
  toyShopScreen.querySelectorAll('.toy-product').forEach((button) => button.classList.toggle('is-in-cart', toyCart.has(button.dataset.toyId)));
}

function renderToyProducts() {
  const day = toyCurrentState().day;
  toyShopScreen.querySelectorAll('.toy-stop[data-unlocks-day]').forEach((stop) => {
    stop.hidden = day < Number(stop.dataset.unlocksDay);
  });
  const stopCount = toyShopScreen.querySelectorAll('.toy-stop:not([hidden])').length;
  toyAisle.querySelector('.toy-aisle-track').style.width = `${stopCount * 100}%`;
  toyAisle.style.setProperty('--toy-stop-width', `${100 / stopCount}%`);
  const availableToys = toysAvailableOnDay(day);
  toyShopScreen.querySelectorAll('[data-zone]').forEach((zone) => {
    const items = availableToys.filter((toy) => toy.zone === zone.dataset.zone);
    zone.replaceChildren(...items.map((toy) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'toy-product';
      button.dataset.toyId = toy.id;
      button.setAttribute('aria-label', `${toy.title}, ${toy.age}, ${toy.price} монет. Рассмотреть бирку`);
      const img = document.createElement('img');
      img.src = toyImage(toy);
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      const name = document.createElement('strong');
      name.textContent = toy.title;
      const detail = document.createElement('small');
      detail.innerHTML = `<span class="toy-product-age">${toy.age}</span> ${toy.price} 🪙`;
      button.append(img, name, detail);
      return button;
    }));
  });
  const robot = toyById('robot');
  if (robot) {
    $('.toy-ad-price del').textContent = String(robot.oldPrice ?? robot.price);
    $('.toy-ad-price b').textContent = formatCoins(robot.price);
  }
  $('#toy-machine img').src = publicAssetPath(TOY_CAPSULE_ITEM.image_folder, TOY_CAPSULE_ITEM.image, 'images/toy-shop');
  $('#toy-machine span').textContent = `Мини-монстры • ${formatCoins(CAPSULE_PRICE)}`;
  $('#toy-capsule-spin').textContent = `Бросить ${formatCoins(CAPSULE_PRICE)} и повернуть`;
  renderToyCart();
}

function toyStopIndex() {
  return Math.max(0, Math.min(toyShopScreen.querySelectorAll('.toy-stop:not([hidden])').length - 1, Math.round(toyAisle.scrollLeft / Math.max(1, toyAisle.clientWidth))));
}
function goToyStop(index, smooth = true) {
  const stop = Math.max(0, Math.min(toyShopScreen.querySelectorAll('.toy-stop:not([hidden])').length - 1, index));
  toyRequestedStop = stop;
  toyAisle.scrollTo({ left: stop * toyAisle.clientWidth, behavior: smooth ? 'smooth' : 'instant' });
  $('#toy-location').textContent = TOY_STOP_NAMES[stop];
  if (stop === 4 && !toyTutorialActive) {
    sayToyMonster('toy-robot', 'plead');
    playToySound('robot');
  }
}
function sayToyMonster(trigger, mood = 'idle') {
  const line = toyMonsterLine(trigger);
  if (!line) return;
  toySpeech.textContent = line.text;
  toySpeech.hidden = false;
  playToyMonsterVoice(line);
  window.clearTimeout(toySpeechTimer);
  toySpeechTimer = window.setTimeout(() => { toySpeech.hidden = true; toyCompanion?.play('Walking', 'Thoughtful_Walk'); }, 3600);
  const clips = { plead: ['Begging', 'Talk_Passionately'], happy: ['FunnyDancing_02', 'FunnyDancing_03'], sad: ['Groan_Holding_Stomach_in_Sleep', 'restpose'] };
  if (clips[mood]) toyCompanion?.play(...clips[mood]);
}

async function enterToyShop(store) {
  if (Number(store?.id) !== TOY_STORE_ID) return;
  closeRoomAction();
  closeRoomInbox();
  closeSavingsTransfer();
  hideRoomMessage();
  leaveRoom();
  showOnlyScreen(toyShopScreen);
  toyCart = new Set();
  toySpinCountThisVisit = 0;
  toyDuplicateThisVisit = false;
  toyLossReviewed = false;
  toyCapsuleAnimationToken += 1;
  toyTagSheet.hidden = true;
  toyCapsuleSheet.hidden = true;
  toyCheckoutSheet.hidden = true;
  toyPlaySheet.hidden = true;
  toyGoalOffer.close(null);
  toyToasts.replaceChildren();
  toySpeech.hidden = true;
  stopToyMonsterVoice();
  renderToyProducts();
  renderToyHud();
  goToyStop(0, false);
  switchBackgroundTrack(MUSIC_TRACKS.toy).catch((error) => console.info('Музыка магазина игрушек недоступна.', error));

  const records = toyRecords();
  const firstVisit = !records.some((record) => record?.['Тип события'] === SHOP_VISIT_EVENT && record['Магазин'] === TOY_STORE_TITLE);
  toyFreeVisit = hasBoughtInStoreBefore(records, TOY_PURCHASE_EVENT, TOY_STORE_TITLE);
  const { day } = deriveRoomState(records);
  appendProfileRecord({ 'Тип события': SHOP_VISIT_EVENT, 'Профиль пользователя': getUserProfileId(), 'Магазин': TOY_STORE_TITLE, 'Идентификатор магазина': TOY_STORE_ID, 'Игровой день': day, ...(toyFreeVisit ? { 'Без ментора': true } : {}) });
  logEpisode(TOY_EPISODE, { 'Магазин': TOY_STORE_TITLE, 'Идентификатор магазина': TOY_STORE_ID, 'Игровой день': day });

  try {
    await monsterReadyPromise;
    if (toyShopScreen.hidden || !model || !mixer || !renderer) return;
    toyCompanion ??= new ToyCompanion(model, mixer, roomController?.animations);
    toyCompanion.enter();
    scene = toyCompanion.scene;
    camera = toyCompanion.camera;
    renderer.shadowMap.enabled = false;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    attachRenderer($('#toy-companion'));
    toyCompanion.resize($('#toy-companion').clientWidth, $('#toy-companion').clientHeight);
    if (firstVisit) startToyTutorial();
  } catch (error) {
    console.warn('Не удалось показать монстрика в магазине игрушек:', error);
    if (firstVisit) startToyTutorial();
  }
}

function leaveToyShop() {
  finishToyTutorial();
  stopToyMonsterVoice();
  toyCapsuleAnimationToken += 1;
  window.clearTimeout(toySpeechTimer);
  toySpeech.hidden = true;
  toyCompanion?.exit();
  scene = editorScene;
  camera = editorCamera;
  toyTagSheet.hidden = true;
  toyCapsuleSheet.hidden = true;
  toyCheckoutSheet.hidden = true;
  toyPlaySheet.hidden = true;
  toyGoalOffer.close(null);
  toyToasts.replaceChildren();
  enterRoom();
}

function openToyTag(toy) {
  if (!toy) return;
  toySelected = toy;
  $('#toy-tag-image').src = toyImage(toy);
  $('#toy-tag-title').textContent = toy.title;
  $('#toy-tag-age').textContent = `Возраст: ${toy.age}`;
  $('#toy-tag-price').textContent = formatCoins(toy.price);
  $('#toy-tag-slogan').textContent = toy.slogan;
  $('#toy-tag-fact').textContent = toy.fact;
  $('#toy-tag-fine').textContent = toy.fine;
  const state = toyCurrentState();
  $('#toy-tag-effect').hidden = state.day < TOY_EFFECT_FROM_DAY;
  $('#toy-tag-effect').textContent = `Если купить: ${toyEffectLong(toyEffect(toy, state))}`;
  toyTag.classList.remove('is-flipped');
  $('#toy-tag-cart').textContent = toyCart.has(toy.id) ? 'Из тележки' : 'В тележку';
  toyTagSheet.hidden = false;
  toyTag.focus({ preventScroll: true });
}
function closeToyTag() { toyTagSheet.hidden = true; toySelected = null; }
toyShopScreen.querySelectorAll('[data-zone]').forEach((zone) => zone.addEventListener('click', (event) => {
  const button = event.target.closest('.toy-product');
  if (button) openToyTag(toyById(button.dataset.toyId));
}));
toyTag.addEventListener('click', () => toyTag.classList.toggle('is-flipped'));
$('#toy-tag-close').addEventListener('click', closeToyTag);
$('#toy-tag-return').addEventListener('click', closeToyTag);
$('#toy-tag-cart').addEventListener('click', () => {
  if (!toySelected) return;
  if (toyCart.has(toySelected.id)) toyCart.delete(toySelected.id);
  else toyCart.add(toySelected.id);
  renderToyCart();
  closeToyTag();
});
toyCartItems.addEventListener('click', (event) => {
  const chip = event.target.closest('[data-remove-toy]');
  if (!chip) return;
  toyCart.delete(chip.dataset.removeToy);
  renderToyCart();
});

function renderToyCheckout() {
  const items = [...toyCart].map(toyById).filter(Boolean);
  toyCheckoutBelt.replaceChildren(...items.map((toy) => {
    const item = document.createElement('div');
    item.className = 'toy-belt-item';
    item.dataset.toyId = toy.id;
    const image = document.createElement('img');
    image.src = toyImage(toy);
    image.alt = '';
    const name = document.createElement('strong');
    name.textContent = `${toy.title} • ${formatCoins(toy.price)}`;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'toy-belt-remove';
    remove.dataset.removeToy = toy.id;
    remove.setAttribute('aria-label', `Вернуть на полку: ${toy.title}`);
    remove.textContent = 'Вернуть';
    item.append(image, name, remove);
    return item;
  }));
  if (!items.length) {
    const empty = document.createElement('p');
    empty.className = 'toy-checkout-empty';
    empty.textContent = 'На ленте пока нет игрушек. Можно вернуться в проход.';
    toyCheckoutBelt.append(empty);
  }
  const slime = toyById('slime');
  $('.toy-checkout-slime strong').textContent = `${slime.title} — ${formatCoins(slime.price)}`;
  // The speech bubble stays under the checkout sheet, so the plea is also printed next to the slime.
  const slimeLine = toyMonsterLine('toy-slime');
  if (slimeLine) $('#toy-slime-line').textContent = `Монстрик: «${slimeLine.text}»`;
  $('#toy-slime-choice').textContent = toyCart.has('slime') ? 'Вернуть лизуна' : 'Взять лизуна';
  $('#toy-checkout-total').textContent = formatCoins(toyCartTotal([...toyCart]));
  $('#toy-checkout-loss').hidden = toySpinCountThisVisit === 0 || toyLossReviewed;
  $('#toy-checkout-loss').textContent = toyDuplicateThisVisit
    ? `Автомат уже забрал ${formatCoins(toySpinCountThisVisit * CAPSULE_PRICE)}. Среди капсул был дубль.`
    : `Автомат уже забрал ${formatCoins(toySpinCountThisVisit * CAPSULE_PRICE)}. Это отдельная трата.`;
  toyCheckoutNote.textContent = '';
}
function openToyCheckout() {
  closeToyTag();
  toyCapsuleSheet.hidden = true;
  renderToyCheckout();
  toyCheckoutSheet.hidden = false;
  playToySound('belt');
  sayToyMonster('toy-slime', 'plead');
  $('#toy-pay').focus({ preventScroll: true });
}
toyCheckoutBelt.addEventListener('click', (event) => {
  const button = event.target.closest('[data-remove-toy]');
  if (!button) return;
  toyCart.delete(button.dataset.removeToy);
  renderToyCart();
  renderToyCheckout();
});
$('#toy-slime-choice').addEventListener('click', () => {
  if (toyCart.has('slime')) toyCart.delete('slime');
  else toyCart.add('slime');
  renderToyCart();
  renderToyCheckout();
});
$('#toy-checkout-open').addEventListener('click', openToyCheckout);
$('#toy-checkout-close').addEventListener('click', () => { toyCheckoutSheet.hidden = true; });

function logToyPurchaseRecords(items, total, records, state) {
  const profileId = getUserProfileId();
  appendProfileRecord({ 'Тип события': POCKET_SPENDING_EVENT, 'Профиль пользователя': profileId, 'Значение': total, 'Назначение': 'Игрушки из Монстроландии', 'Игровой день': state.day });
  for (const toy of items) {
    appendProfileRecord({ 'Тип события': TOY_PURCHASE_EVENT, 'Профиль пользователя': profileId, 'Магазин': TOY_STORE_TITLE, 'Идентификатор магазина': TOY_STORE_ID, 'Товар': toy.title, 'Идентификатор товара': toy.martId, 'Количество': 1, 'Цена': toy.price, 'Стоимость': toy.price, 'Игровой день': state.day });
    appendProfileRecord({ 'Тип события': INVENTORY_CHANGE_EVENT, 'Профиль пользователя': profileId, 'Тип инвентаря': toy.martId, 'Количество': 1, 'Единица измерения': 'шт', 'Игровой день': state.day });
  }
  appendProfileRecord({ 'Тип события': POCKET_TOPUP_EVENT, 'Профиль пользователя': profileId, 'Значение': -total, 'Назначение': 'Игрушки из Монстроландии', 'Игровой день': state.day });
  appendProfileRecord({ 'Тип события': BUDGET_FACT_EVENT, 'Профиль пользователя': profileId, 'Номер бюджета': currentBudgetNumber(records), 'Статья бюджета': FUN_ARTICLE, 'Изменение статьи': total, 'Игровой день': state.day });
  for (const key of ['mood', 'development']) {
    const change = items.reduce((sum, toy) => sum + (Number(toy[key]) || 0), 0);
    const after = clampStat(state.stats[key] + change, key);
    if (after === state.stats[key]) continue;
    appendProfileRecord({ 'Тип события': MONSTER_STAT_EVENT, 'Профиль пользователя': profileId, 'Характеристика': STAT_LABELS[key], 'Изменение': after - state.stats[key], 'Было': state.stats[key], 'Стало': after, 'Причина': 'Игра с купленными игрушками', 'Игровой день': state.day });
  }
  if (items.some((toy) => toy.dirty) && !state.dirty) {
    appendProfileRecord({ 'Тип события': MONSTER_STATE_EVENT, 'Профиль пользователя': profileId, 'Состояние': HYGIENE_STATE, 'Было': CLEAN, 'Стало': DIRTY, 'Причина': 'Игра с лизуном', 'Игровой день': state.day });
  }
}

function showToyPlay(items, before) {
  const after = toyCurrentState();
  const mood = after.stats.mood - before.stats.mood;
  const development = after.stats.development - before.stats.development;
  const reaction = items.some((toy) => toy.id === 'puzzle') ? 'toy-sad'
    : items.some((toy) => ['rattle', 'tennis', 'robot'].includes(toy.id)) ? 'toy-bored' : 'toy-happy';
  const line = toyMonsterLine(reaction);
  $('#toy-play-pictures').replaceChildren(...items.slice(0, 2).map((toy) => {
    const image = document.createElement('img');
    image.src = toyImage(toy);
    image.alt = toy.title;
    return image;
  }));
  const playText = items.some((toy) => toy.dirty)
    ? 'Монстрик играет, смеётся… и весь в лизуне. Теперь он грязный.'
    : `Монстрик играет с ${items.map((toy) => `«${toy.title}»`).join(' и ')}.`;
  $('#toy-play-text').textContent = `${playText} ${line ? `Монстрик: «${line.text}»` : ''}`.trim();
  $('#toy-play-stats').textContent = `🙂 Настроение ${mood >= 0 ? '+' : ''}${mood} → ${after.stats.mood}   🧠 Развитие ${development >= 0 ? '+' : ''}${development} → ${after.stats.development}`;
  toyPlaySheet.hidden = false;
  if (toyCompanion?.active) attachRenderer($('#toy-play-monster'));
  toyCompanion?.play(reaction === 'toy-sad' ? 'Groan_Holding_Stomach_in_Sleep' : reaction === 'toy-bored' ? 'Thoughtful_Walk' : 'FunnyDancing_02', 'restpose');
  playToyMonsterVoice(line);
}

function payForToys() {
  const ids = [...toyCart];
  const items = ids.map(toyById).filter(Boolean);
  const records = toyRecords();
  const state = deriveRoomState(records);
  const total = toyCartTotal(ids);
  if (items.length !== ids.length || items.some((toy) => !isToyAvailable(toy, state.day))) {
    toyCheckoutNote.textContent = 'Эти игрушки пока недоступны. Вернись в проход и обнови выбор.';
    return;
  }
  if (!items.length) {
    if (toySpinCountThisVisit > 0 && !toyLossReviewed) {
      toyLossReviewed = true;
      toyCheckoutSheet.hidden = true;
      showMentor(toyDuplicateThisVisit ? 'toy-capsule-duplicate' : 'toy-capsule', { title: TOY_STORE_TITLE });
    } else toyCheckoutNote.textContent = 'Выбери игрушку или вернись в проход.';
    return;
  }
  if (total > state.pocket) {
    logDecision(false, { episode: TOY_EPISODE, 'Магазин': TOY_STORE_TITLE, 'Игровой день': state.day, 'Стоимость': total, 'Причина': 'insufficient', explanation: toyMentorText('toy-insufficient') });
    if (!toyFreeVisit) showMentor('toy-insufficient', { title: TOY_STORE_TITLE, afterClose: () => $('#toy-pay').focus({ preventScroll: true }) });
    else toyCheckoutNote.textContent = `Не хватает ${formatCoins(total - state.pocket)}. Верни что-то на полку.`;
    return;
  }
  const verdict = toyVerdict(ids);
  if (verdict) {
    const trigger = `toy-${verdict.kind}`;
    logDecision(false, { episode: TOY_EPISODE, 'Магазин': TOY_STORE_TITLE, 'Игровой день': state.day, 'Товар': verdict.toy?.title, 'Стоимость': total, 'Причина': verdict.kind, explanation: `${toyMentorText(trigger)} ${toyFreeVisit ? 'Повторный визит: ментор не отменил покупку.' : 'Ментор остановил покупку до оплаты.'}` });
    if (!toyFreeVisit) { showMentor(trigger, { title: TOY_STORE_TITLE, afterClose: () => $('#toy-pay').focus({ preventScroll: true }) }); return; }
  }
  logToyPurchaseRecords(items, total, records, state);
  playToySound('beep');
  logDecision(!verdict, { episode: TOY_EPISODE, 'Магазин': TOY_STORE_TITLE, 'Игровой день': state.day, 'Товары': items.map((toy) => toy.title), 'Стоимость': total, explanation: verdict ? 'Покупка состоялась при повторном посещении без остановки ментора.' : 'Возраст, реальная польза и стоимость проверены до оплаты.' });
  toyCart.clear();
  renderToyCart();
  renderToyHud();
  toyCheckoutSheet.hidden = true;
  const capsuleDue = toySpinCountThisVisit > 0 && !toyLossReviewed;
  const showCapsuleOrPlay = () => capsuleDue
    ? showMentor(toyDuplicateThisVisit ? 'toy-capsule-duplicate' : 'toy-capsule', { title: TOY_STORE_TITLE, afterClose: () => showToyPlay(items, state) })
    : showToyPlay(items, state);
  toyLossReviewed = true;
  if (toyFreeVisit) showCapsuleOrPlay();
  else showMentor('toy-approved', { title: TOY_STORE_TITLE, extra: `Куплено за ${formatCoins(total)}`, afterClose: showCapsuleOrPlay });
  toyFreeVisit = true;
}
$('#toy-pay').addEventListener('click', payForToys);
$('#toy-play-close').addEventListener('click', () => {
  stopToyMonsterVoice();
  toyPlaySheet.hidden = true;
  if (toyCompanion?.active) attachRenderer($('#toy-companion'));
  toyCompanion?.play('Walking', 'Thoughtful_Walk');
  // The play screen follows only a successful purchase: once the monster has played, the shop
  // recommends the big goal, like the tech shop's console.
  offerToyGoal();
});

// The goal belongs to the day the toy shop opens, so it is offered on a later day too
// if the first purchase is made then.
function offerToyGoal() {
  const store = dataMartRows.find((row) => row?.object_type === 'Store' && Number(row.id) === TOY_STORE_ID);
  const goal = savingsGoalForDay(Number(store?.day_is_it_available));
  return offerShopGoal(goal, toyGoalOffer, { id: TOY_STORE_ID, title: TOY_STORE_TITLE }, toyToasts);
}

function openToyCapsule() {
  toyCapsuleAnimationToken += 1;
  $('#toy-capsule-image').src = publicAssetPath(TOY_CAPSULE_ITEM.image_folder, TOY_CAPSULE_ITEM.front_image_on_the_packaging, 'images/toy-shop');
  $('#toy-capsule-image').alt = 'Закрытая капсула с игрушкой';
  $('#toy-capsule-result').textContent = 'Фигурки серии: теннисист, художник, Соня и другие.';
  const owned = new Set(toyRecords().filter((record) => record?.['Тип события'] === TOY_CAPSULE_EVENT).map((record) => record['Фигурка']));
  $('#toy-collection-lineup').replaceChildren(...MINI_MONSTERS.map((name) => {
    const figure = document.createElement('span');
    figure.title = `${name}${owned.has(name) ? ' — есть' : ' — ещё нет'}`;
    figure.className = owned.has(name) ? 'is-owned' : '';
    const image = document.createElement('img');
    image.src = `/images/toy-shop/${MINI_MONSTER_IMAGES[name]}`;
    image.alt = name;
    figure.append(image);
    return figure;
  }));
  $('#toy-capsule-spin').disabled = false;
  $('#toy-crank').classList.remove('is-spinning');
  toyCapsuleSheet.hidden = false;
}
function spinToyCapsule() {
  if ($('#toy-capsule-spin').disabled) return;
  const records = toyRecords();
  const state = deriveRoomState(records);
  if (state.pocket < CAPSULE_PRICE) { $('#toy-capsule-result').textContent = 'Не хватает монет для автомата.'; return; }
  const spins = records.filter((record) => record?.['Тип события'] === TOY_CAPSULE_EVENT).length;
  const figure = nextMiniMonster(spins);
  const duplicate = records.some((record) => record?.['Тип события'] === TOY_CAPSULE_EVENT && record['Фигурка'] === figure)
    || records.some((record) => record?.['Тип события'] === TOY_PURCHASE_EVENT
      && ['tennis', toyById('tennis').martId].includes(record['Идентификатор товара']) && figure === MINI_MONSTERS[0]);
  const profileId = getUserProfileId();
  appendProfileRecord({ 'Тип события': POCKET_SPENDING_EVENT, 'Профиль пользователя': profileId, 'Значение': CAPSULE_PRICE, 'Назначение': 'Автомат сюрприз-боксов', 'Игровой день': state.day });
  appendProfileRecord({ 'Тип события': TOY_CAPSULE_EVENT, 'Профиль пользователя': profileId, 'Магазин': TOY_STORE_TITLE, 'Идентификатор магазина': TOY_STORE_ID, 'Идентификатор товара': TOY_CAPSULE_ITEM.id, 'Фигурка': figure, 'Дубль': duplicate, 'Стоимость': CAPSULE_PRICE, 'Игровой день': state.day });
  appendProfileRecord({ 'Тип события': INVENTORY_CHANGE_EVENT, 'Профиль пользователя': profileId, 'Тип инвентаря': `mini:${figure}`, 'Количество': 1, 'Единица измерения': 'шт', 'Игровой день': state.day });
  appendProfileRecord({ 'Тип события': POCKET_TOPUP_EVENT, 'Профиль пользователя': profileId, 'Значение': -CAPSULE_PRICE, 'Назначение': 'Автомат сюрприз-боксов', 'Игровой день': state.day });
  appendProfileRecord({ 'Тип события': BUDGET_FACT_EVENT, 'Профиль пользователя': profileId, 'Номер бюджета': currentBudgetNumber(records), 'Статья бюджета': FUN_ARTICLE, 'Изменение статьи': CAPSULE_PRICE, 'Игровой день': state.day });
  logDecision(false, { episode: TOY_EPISODE, 'Магазин': TOY_STORE_TITLE, 'Игровой день': state.day, 'Товар': TOY_CAPSULE_ITEM.title, 'Идентификатор товара': TOY_CAPSULE_ITEM.id, 'Фигурка': figure, 'Дубль': duplicate, 'Стоимость': CAPSULE_PRICE, explanation: duplicate ? 'Монеты списаны сразу, выпала уже имеющаяся фигурка; ментор не отменяет покупку.' : 'Монеты списаны сразу, результат сюрприз-бокса заранее неизвестен; ментор не отменяет покупку.' });
  toySpinCountThisVisit += 1;
  toyDuplicateThisVisit ||= duplicate;
  const animationToken = ++toyCapsuleAnimationToken;
  const duringReveal = (delay, callback) => window.setTimeout(() => {
    if (animationToken === toyCapsuleAnimationToken && !toyCapsuleSheet.hidden) callback();
  }, delay);
  $('#toy-capsule-spin').disabled = true;
  $('#toy-capsule-result').textContent = 'Капсула катится… открываем!';
  $('#toy-capsule-image').src = publicAssetPath(TOY_CAPSULE_ITEM.image_folder, TOY_CAPSULE_ITEM.front_image_on_the_packaging, 'images/toy-shop');
  $('#toy-capsule-image').alt = 'Закрытая капсула с игрушкой';
  $('#toy-crank').classList.remove('is-spinning');
  void $('#toy-crank').offsetWidth;
  $('#toy-crank').classList.add('is-spinning');
  playToySound('coin');
  duringReveal(110, () => playToySound('crank'));
  duringReveal(450, () => playToySound('drop'));
  duringReveal(650, () => {
    $('#toy-capsule-image').src = '/images/toy-shop/capsule-open.png';
    $('#toy-capsule-image').alt = 'Открытая капсула';
    playToySound('open');
  });
  duringReveal(1050, () => {
    // The speech bubble stays under the capsule sheet, so the monster's line goes into the result.
    const duplicateLine = duplicate ? toyMonsterLine('toy-duplicate') : null;
    $('#toy-capsule-result').textContent = duplicate
      ? `Выпал ${figure} — дубль. ${CAPSULE_PRICE} монет уже не вернуть.${duplicateLine ? ` Монстрик: «${duplicateLine.text}»` : ''}`
      : `Выпал ${figure}! Монеты уже потрачены.`;
    $('#toy-capsule-image').src = `/images/toy-shop/${MINI_MONSTER_IMAGES[figure]}`;
    $('#toy-capsule-image').alt = `Фигурка ${figure}`;
    $('#toy-capsule-spin').disabled = false;
    if (duplicate) { playToySound('duplicate'); sayToyMonster('toy-duplicate', 'sad'); }
  });
  $('#toy-collection-lineup').querySelectorAll('span')[MINI_MONSTERS.indexOf(figure)]?.classList.add('is-owned');
  renderToyHud();
}
$('#toy-machine').addEventListener('click', openToyCapsule);
$('#toy-capsule-close').addEventListener('click', () => { toyCapsuleAnimationToken += 1; toyCapsuleSheet.hidden = true; });
$('#toy-capsule-spin').addEventListener('click', spinToyCapsule);
$('#toy-shop-back').addEventListener('click', leaveToyShop);
$('#toy-left').addEventListener('click', () => goToyStop(toyRequestedStop - 1));
$('#toy-right').addEventListener('click', () => goToyStop(toyRequestedStop + 1));
toyAisle.addEventListener('scroll', () => { $('#toy-location').textContent = TOY_STOP_NAMES[toyStopIndex()]; }, { passive: true });
toyAisle.addEventListener('scrollend', () => { toyRequestedStop = toyStopIndex(); });
toyAisle.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); goToyStop(toyRequestedStop + (event.key === 'ArrowRight' ? 1 : -1)); }
});

function positionToyTutorialFocus() {
  const step = toyTutorialSteps[toyTutorialIndex];
  const targetName = step?.screen_area?.target;
  const target = targetName ? toyShopScreen.querySelector(`[data-toy-target="${CSS.escape(String(targetName))}"]`) : null;
  toyTutorialFocus.hidden = !target;
  if (!target) return;
  const outer = toyShopScreen.getBoundingClientRect();
  const rect = target.getBoundingClientRect();
  toyTutorialFocus.style.left = `${rect.left - outer.left - 5}px`;
  toyTutorialFocus.style.top = `${rect.top - outer.top - 5}px`;
  toyTutorialFocus.style.width = `${rect.width + 10}px`;
  toyTutorialFocus.style.height = `${rect.height + 10}px`;
}
function renderToyTutorialStep() {
  const step = toyTutorialSteps[toyTutorialIndex];
  if (!step) return finishToyTutorial();
  const area = step.screen_area ?? {};
  goToyStop(Number(area.stop) || 0, false);
  toyTutorialLayer.dataset.placement = area.message_placement || 'bottom';
  $('#toy-tutorial-progress').textContent = `ШАГ ${toyTutorialIndex + 1} ИЗ ${toyTutorialSteps.length}`;
  $('#toy-tutorial-text').textContent = step.text;
  $('#toy-tutorial-back').disabled = toyTutorialIndex === 0;
  $('#toy-tutorial-next').innerHTML = toyTutorialIndex === toyTutorialSteps.length - 1 ? 'Понятно! <span aria-hidden="true">✓</span>' : 'Дальше <span aria-hidden="true">→</span>';
  requestAnimationFrame(positionToyTutorialFocus);
  playShopTutorialVoice(step);
}
function startToyTutorial() {
  toyTutorialSteps = dataMartRows
    .filter((row) => row?.object_type === SHOP_TUTORIAL_OBJECT_TYPE && row.title === TOY_STORE_TITLE)
    .sort((left, right) => Number(left.queue) - Number(right.queue));
  if (!toyTutorialSteps.length) return;
  toyTutorialIndex = 0;
  toyTutorialActive = true;
  setHidden(toyTutorialLayer, false);
  renderToyTutorialStep();
  $('#toy-tutorial-next').focus({ preventScroll: true });
}
function finishToyTutorial(skipped = false) {
  if (!toyTutorialActive) return;
  stopShopTutorialVoice();
  toyTutorialActive = false;
  setHidden(toyTutorialLayer, true);
  toyTutorialFocus.hidden = true;
  appendProfileRecord({ 'Тип события': TOY_TUTORIAL_EVENT, 'Профиль пользователя': getUserProfileId(), 'Магазин': TOY_STORE_TITLE, 'Игровой день': toyCurrentState().day, 'Пропущен': skipped });
  goToyStop(0, false);
}
$('#toy-tutorial-next').addEventListener('click', () => {
  if (toyTutorialIndex === toyTutorialSteps.length - 1) finishToyTutorial();
  else { toyTutorialIndex += 1; renderToyTutorialStep(); }
});
$('#toy-tutorial-back').addEventListener('click', () => { if (toyTutorialIndex > 0) { toyTutorialIndex -= 1; renderToyTutorialStep(); } });
$('#toy-tutorial-skip').addEventListener('click', () => finishToyTutorial(true));
window.addEventListener('resize', () => { if (toyTutorialActive) positionToyTutorialFocus(); });
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || toyShopScreen.hidden || !mentorLayer.hidden || toyTutorialActive) return;
  if (!toyTagSheet.hidden) closeToyTag();
  else if (!toyCapsuleSheet.hidden) toyCapsuleSheet.hidden = true;
  else if (!toyCheckoutSheet.hidden) toyCheckoutSheet.hidden = true;
  else if (!toyPlaySheet.hidden) toyPlaySheet.hidden = true;
});

// --- Feeding ----------------------------------------------------------------

const FEEDING_TUTORIAL_OBJECT_TYPE = 'Feeding tutorial';
const PANTRY_TUTORIAL_TITLE = 'Полка с кормом';
const SCALE_TUTORIAL_TITLE = 'Весы';
const FEEDING_MENTOR_TITLE = 'Кормление';
const FEEDING_TAP_TOLERANCE = 8;
const FEEDING_FOCUS_PADDING = 6;
const PANTRY_MAX_PACKS = 5;
// The gauge under the reading runs from an empty bowl to this weight, with the goal marked on it.
const SCALE_GAUGE_MAX_GRAMS = 150;
const PANTRY_HINT = 'Нажми на пачку, из которой насыплешь корм';
const FEEDING_MENTOR_CLOSE_LABELS = {
  'feeding-approved': 'К монстрику! <span aria-hidden="true">✓</span>',
  'feeding-too-little': 'Насыплю заново <span aria-hidden="true">→</span>',
  'feeding-too-much': 'Насыплю заново <span aria-hidden="true">→</span>',
};
// Errors are data mart rows too: the answer to an action the player cannot do right now, shown on
// the spot like a message but never sent on their own and never kept in the inbox.
const ERROR_OBJECT_TYPE = 'Error';
const NO_FOOD_FOR_FEEDING_TRIGGER = 'Feeding without suitable food';
const MONSTER_ALREADY_FED_TRIGGER = 'Feeding a fed monster';
const CLEAN_MONSTER_TRIGGER = 'Cleaning a clean monster';
const NO_CLEANER_TRIGGER = 'Cleaning without a cleaner';
// What is shown if the data mart has lost an error row.
const ERROR_FALLBACKS = {
  [NO_FOOD_FOR_FEEDING_TRIGGER]: {
    text: `Чтобы покормить монстрика, нужно хотя бы ${FEEDING_MIN_GRAMS} граммов подходящего корма. Сходи в магазин продуктов!`,
    screen_area: { target: 'shop', message_placement: 'center' },
  },
  [MONSTER_ALREADY_FED_TRIGGER]: {
    text: 'Монстрик уже сыт. Покорми его завтра!',
    screen_area: { target: 'hunger', message_placement: 'center' },
  },
  [CLEAN_MONSTER_TRIGGER]: {
    text: 'Монстрик и так чистый. Почистим, когда он испачкается!',
    screen_area: { target: 'hygiene', message_placement: 'center' },
  },
  [NO_CLEANER_TRIGGER]: {
    text: 'Чистить нечем: сначала купи прибор для козявок в «Магазине техники».',
    screen_area: { target: 'shop', message_placement: 'center' },
  },
};

const feedingStage = $('#feeding-stage');
const feedingHud = $('.feeding-hud');
const feedingDay = $('#feeding-day');
const feedingStock = $('#feeding-stock');
const feedingGoal = $('#feeding-goal');
const feedingLoading = $('#feeding-loading');
const feedingBottomBar = $('#feeding-bottom-bar');
const pantryBrowseBar = $('#pantry-browse-bar');
const pantryHint = $('#pantry-hint');
const pantryBackButton = $('#pantry-back');
const pantryChoice = $('#pantry-choice');
const pantryChoiceTitle = $('#pantry-choice-title');
const pantryChoiceNote = $('#pantry-choice-note');
const pantryCancelButton = $('#pantry-cancel');
const pantryTakeButton = $('#pantry-take');
const scalePanel = $('#scale-panel');
const scaleReading = $('#scale-reading');
const scalePackNote = $('#scale-pack-note');
const scaleToShelfButton = $('#scale-to-shelf');
const scaleGaugeGoal = $('#scale-gauge-goal');
const scaleGaugeFill = $('#scale-gauge-fill');
const scaleHint = $('#scale-hint');
const scaleDoneButton = $('#scale-done');
const feedingTutorialLayer = $('#feeding-tutorial-layer');
const feedingTutorialFocus = $('#feeding-tutorial-focus');
const feedingTutorialProgress = $('#feeding-tutorial-progress');
const feedingTutorialText = $('#feeding-tutorial-text');
const feedingTutorialBack = $('#feeding-tutorial-back');
const feedingTutorialNext = $('#feeding-tutorial-next');
const feedingTutorialSkip = $('#feeding-tutorial-skip');
const feedingLoadingMarkup = feedingLoading.innerHTML;
let pantryShelf = null;
let feedingScale = null;
let feedingRunId = 0;
// The feeding in progress: suitable food at the start, grams poured out of every item so far,
// the pack standing at the scale, and which tutorials were already shown.
let feedingSession = null;
let feedingPointer = null;
let pantryInsets = null;
let feedingTutorialSteps = [];
let feedingTutorialIndex = 0;

feedingGoal.textContent = `${FEEDING_MIN_GRAMS}–${FEEDING_MAX_GRAMS}`;
scaleGaugeGoal.style.left = `${(FEEDING_MIN_GRAMS / SCALE_GAUGE_MAX_GRAMS) * 100}%`;
scaleGaugeGoal.style.width = `${((FEEDING_MAX_GRAMS - FEEDING_MIN_GRAMS) / SCALE_GAUGE_MAX_GRAMS) * 100}%`;

function showRoomError(trigger) {
  const error = dataMartRows.find((row) => row?.object_type === ERROR_OBJECT_TYPE && row.trigger === trigger);
  if (!error) console.warn(`В дата-марте нет ошибки «${trigger}».`);
  playRoomMessage(error ?? { id: null, trigger, ...ERROR_FALLBACKS[trigger] });
}

// The feed icon. A monster fed today needs nothing; without enough suitable food an error sends
// the player to the shop; otherwise the pantry shelf opens.
function startFeeding() {
  const profileId = getUserProfileId();
  const state = deriveRoomState(readProfileRecords(profileId));
  if (!state.hungry) {
    showRoomError(MONSTER_ALREADY_FED_TRIGGER);
    return;
  }

  const enough = state.suitableFoodGrams >= FEEDING_MIN_GRAMS;
  appendProfileRecord({
    'Тип события': FEEDING_START_EVENT,
    'Профиль пользователя': profileId,
    'Подходящий корм, г': state.suitableFoodGrams,
    'Корма достаточно': enough,
    'Игровой день': state.day,
  });
  if (!enough) {
    showRoomError(NO_FOOD_FOR_FEEDING_TRIGGER);
    return;
  }
  enterFeeding();
}

async function enterFeeding() {
  const runId = ++feedingRunId;
  closeRoomAction();
  hideRoomMessage();
  closeRoomInbox();
  finishFeedingTutorial();
  showOnlyScreen(feedingScreen);
  const records = readProfileRecords(getUserProfileId());
  feedingSession = {
    stock: deriveRoomState(records).suitableFoodGrams,
    taken: new Map(),
    pack: null,
    tutorials: new Set(),
    firstFeeding: !records.some((record) => record?.['Тип события'] === FEEDING_EVENT),
  };
  setFeedingMode('pantry');
  renderFeedingHud();
  feedingLoading.innerHTML = feedingLoadingMarkup;
  feedingLoading.classList.remove('is-hidden');

  try {
    await monsterReadyPromise;
    if (!renderer) throw new Error('3D-сцена недоступна');
    const options = {
      anisotropy: renderer.capabilities.getMaxAnisotropy(),
      resolveImage: (folder, file) => publicAssetPath(folder, file, 'images/store'),
    };
    pantryShelf ??= new PantryShelf(options);
    feedingScale ??= new FeedingScale({
      ...options,
      onPour: takeFromPack,
      onChange: renderScalePanel,
      onPackEmpty: renderScalePanelFromScale,
    });
    await feedingScale.build();
    if (runId !== feedingRunId) return;

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    attachRenderer(feedingStage);
    await showPantry();
    if (runId !== feedingRunId) return;
    feedingLoading.classList.add('is-hidden');
  } catch (error) {
    console.error('Не удалось открыть кормление:', error);
    if (runId !== feedingRunId) return;
    feedingLoading.innerHTML = '<span class="loading-eye" aria-hidden="true"></span><span>Полка с кормом не открылась.<br>Обнови страницу!</span>';
  }
}

// Leaving without a successful feeding puts everything poured back into the packs: nothing is written off.
function leaveFeeding({ served = 0 } = {}) {
  feedingRunId += 1;
  finishFeedingTutorial();
  feedingPointer = null;
  feedingSession = null;
  if (pantryShelf) {
    pantryShelf.select(-1);
    pantryShelf.active = false;
  }
  if (feedingScale) {
    feedingScale.setHolding(false);
    feedingScale.emptyBowl();
    feedingScale.active = false;
  }
  enterRoom().then(() => {
    if (served) roomController?.serveFood(served);
  });
}

function setFeedingMode(mode) {
  feedingScreen.dataset.mode = mode;
  feedingPointer = null;
  if (pantryShelf) pantryShelf.active = mode === 'pantry';
  if (feedingScale) {
    feedingScale.setHolding(false);
    feedingScale.active = mode === 'scale';
  }
  pantryBrowseBar.hidden = mode !== 'pantry';
  pantryChoice.hidden = true;
  scalePanel.hidden = mode !== 'scale';
  feedingStage.setAttribute('aria-label', mode === 'scale'
    ? 'Миска на весах и пачка корма. Нажми на пачку и держи, чтобы насыпать корм'
    : 'Полка с кормом. Нажми на пачку, чтобы выбрать её');
}

function takenGrams() {
  let total = 0;
  for (const grams of feedingSession?.taken.values() ?? []) total += grams;
  return total;
}

function currentPantryPacks() {
  const { inventory } = deriveRoomState(readProfileRecords(getUserProfileId()));
  return pantryPacks(inventory, feedingSession?.taken);
}

function renderFeedingStock() {
  feedingStock.textContent = `${Math.max(0, (feedingSession?.stock ?? 0) - takenGrams())} г`;
}

function renderFeedingHud() {
  feedingDay.textContent = String(deriveRoomState(readProfileRecords(getUserProfileId())).day);
  renderFeedingStock();
}

async function showPantry(hint = PANTRY_HINT) {
  setFeedingMode('pantry');
  const packs = currentPantryPacks().slice(0, PANTRY_MAX_PACKS);
  pantryHint.textContent = packs.length ? hint : 'Подходящего корма не осталось. Сходи в магазин!';
  await pantryShelf.show(packs);
  renderFeedingHud();
  selectPantryPack(-1);
  maybeStartFeedingTutorial(PANTRY_TUTORIAL_TITLE);
}

function selectPantryPack(index) {
  if (!pantryShelf) return;
  pantryShelf.select(index);
  const entry = pantryShelf.entries[pantryShelf.selected];
  pantryBrowseBar.hidden = Boolean(entry);
  pantryChoice.hidden = !entry;
  if (entry) {
    const { item, grams, open } = entry.pack;
    pantryChoiceTitle.textContent = item.title;
    pantryChoiceNote.textContent = open ? `Открытая пачка · осталось ${grams} г` : `Новая пачка · ${grams} г`;
  }
  resizeFeedingStage();
}

async function takeSelectedPack() {
  const entry = pantryShelf?.entries[pantryShelf.selected];
  if (!entry || !feedingSession) return;
  const runId = feedingRunId;
  feedingSession.pack = { ...entry.pack };
  setFeedingMode('scale');
  await feedingScale.setPack(entry.pack);
  if (runId !== feedingRunId) return;
  resizeFeedingStage();
  maybeStartFeedingTutorial(SCALE_TUTORIAL_TITLE);
}

// Every gram that leaves the pack is counted against its item, to be written off after a good feeding.
function takeFromPack(grams) {
  const item = feedingSession?.pack?.item;
  if (!item) return;
  feedingSession.taken.set(item.id, (feedingSession.taken.get(item.id) ?? 0) + grams);
}

function renderScalePanelFromScale() {
  if (feedingScale) renderScalePanel(feedingScale);
}

function renderScalePanel({ bowlGrams, packGrams, settled }) {
  if (!feedingSession?.pack) return;
  const inGoal = bowlGrams >= FEEDING_MIN_GRAMS && bowlGrams <= FEEDING_MAX_GRAMS;
  const leftElsewhere = feedingSession.stock - takenGrams() - packGrams;
  scaleReading.textContent = `В миске ${bowlGrams} г`;
  scalePackNote.textContent = packGrams > 0
    ? `${feedingSession.pack.item.title} · в пачке ${packGrams} г`
    : `${feedingSession.pack.item.title} · пачка пустая`;
  scaleGaugeFill.style.width = `${Math.min(100, (bowlGrams / SCALE_GAUGE_MAX_GRAMS) * 100)}%`;
  scaleGaugeFill.classList.toggle('is-goal', inGoal);
  scaleGaugeFill.classList.toggle('is-over', bowlGrams > FEEDING_MAX_GRAMS);
  scaleDoneButton.disabled = !settled || bowlGrams <= 0 || Boolean(feedingSession.fed);
  scaleToShelfButton.disabled = !settled;
  scaleToShelfButton.classList.toggle('needs-attention',
    settled && packGrams <= 0 && leftElsewhere > 0 && bowlGrams < FEEDING_MIN_GRAMS);

  if (packGrams <= 0 && leftElsewhere > 0) scaleHint.textContent = 'Пачка кончилась. Если корма мало, возьми следующую на полке';
  else if (packGrams <= 0) scaleHint.textContent = 'Корм закончился. Нажми «Готово»';
  else if (!settled) scaleHint.textContent = 'Отпусти, когда корма будет достаточно';
  else if (bowlGrams > 0) scaleHint.textContent = 'Хватит? Нажми «Готово». Мало — подсыпь ещё';
  else scaleHint.textContent = 'Нажми на пачку и держи';
  renderFeedingStock();
}

// "Готово": the portion is judged once the pack is back and nothing is falling any more.
function finishPouring() {
  if (!feedingSession?.pack || feedingSession.fed || !feedingScale?.settled) return;
  const grams = feedingScale.bowlGrams;
  if (grams <= 0) return;

  const profileId = getUserProfileId();
  const state = deriveRoomState(readProfileRecords(profileId));
  const foods = [...feedingSession.taken.keys()]
    .map((id) => dataMartRows.find((row) => row.id === id)?.title)
    .filter(Boolean)
    .join(', ');
  const verdict = grams < FEEDING_MIN_GRAMS ? 'feeding-too-little'
    : grams > FEEDING_MAX_GRAMS ? 'feeding-too-much'
      : 'feeding-approved';

  if (verdict !== 'feeding-approved') {
    appendProfileRecord({
      'Тип события': FEEDING_FAILED_EVENT,
      'Профиль пользователя': profileId,
      'Насыпано, г': grams,
      'Причина': verdict === 'feeding-too-little' ? 'Корма меньше нормы' : 'Корма больше нормы',
      'Корм': foods,
      'Игровой день': state.day,
    });
    showMentor(verdict, {
      title: FEEDING_MENTOR_TITLE,
      extra: `На весах ${grams} г, а нужно от ${FEEDING_MIN_GRAMS} до ${FEEDING_MAX_GRAMS} г`,
      closeLabel: FEEDING_MENTOR_CLOSE_LABELS[verdict],
      afterClose: retryPouring,
    });
    return;
  }

  feedingSession.fed = true;
  writeFeedingRecords(grams, feedingSession.taken);
  renderScalePanelFromScale();
  showMentor('feeding-approved', {
    title: FEEDING_MENTOR_TITLE,
    extra: `В миске ${grams} г — как раз дневная порция`,
    closeLabel: FEEDING_MENTOR_CLOSE_LABELS['feeding-approved'],
    afterClose: () => leaveFeeding({ served: grams }),
  });
}

// A successful feeding: the portion, the food it took out of the pantry (`taken`: item id → grams)
// and, when the monster was hungry, the fed monster. The final part of the game feeds this way too.
function writeFeedingRecords(grams, taken, extra = {}) {
  const profileId = getUserProfileId();
  const state = deriveRoomState(readProfileRecords(profileId));
  const foods = [...taken.keys()]
    .map((id) => dataMartRows.find((row) => row.id === id)?.title)
    .filter(Boolean)
    .join(', ');
  appendProfileRecord({
    'Тип события': FEEDING_EVENT,
    'Профиль пользователя': profileId,
    'Насыпано, г': grams,
    'Корм': foods,
    ...extra,
    'Игровой день': state.day,
  });
  for (const [itemId, amount] of taken) {
    if (amount <= 0) continue;
    appendProfileRecord({
      'Тип события': INVENTORY_CHANGE_EVENT,
      'Тип инвентаря': itemId,
      'Количество': -amount,
      'Единица измерения': INVENTORY_UNIT_GRAMS,
      'Профиль пользователя': profileId,
    });
  }
  if (state.hungry && !deriveRoomState(readProfileRecords(profileId)).hungry) {
    appendProfileRecord({
      'Тип события': MONSTER_STATE_EVENT,
      'Профиль пользователя': profileId,
      'Состояние': HUNGER_STATE,
      'Было': 'Голодный',
      'Стало': 'Сытый',
      'Игровой день': state.day,
    });
  }
}

// After a failed portion the food goes back into the packs and the pack chosen first returns to the scale.
async function retryPouring() {
  if (!feedingSession?.pack) return;
  feedingSession.taken.clear();
  feedingScale.emptyBowl();
  await feedingScale.setPack(feedingSession.pack);
  renderFeedingHud();
}

// Page pixels covered by the HUD on top and by the bottom bar.
function measureFeedingInsets() {
  const screenRect = feedingScreen.getBoundingClientRect();
  const barTop = [...feedingBottomBar.children]
    .filter((element) => !element.hidden)
    .reduce((top, element) => Math.min(top, element.getBoundingClientRect().top), screenRect.bottom);
  return {
    top: feedingHud.getBoundingClientRect().bottom - screenRect.top + 10,
    bottom: screenRect.bottom - barTop + 10,
  };
}

function resizeFeedingStage() {
  if (feedingScreen.hidden) return;
  const insets = measureFeedingInsets();
  const width = feedingStage.clientWidth;
  const height = feedingStage.clientHeight;
  // The shelf keeps the insets of the short browsing bar, so it does not jump when a pack is chosen.
  if (!pantryBrowseBar.hidden || !pantryInsets) pantryInsets = insets;
  pantryShelf?.resize(width, height, pantryInsets.top, pantryInsets.bottom);
  feedingScale?.resize(width, height, insets.top, insets.bottom);
  if (!feedingTutorialLayer.classList.contains('is-hidden')) {
    positionFeedingTutorialFocus(feedingTutorialSteps[feedingTutorialIndex]?.screen_area?.target);
  }
}

function feedingPointerPosition(event) {
  const rect = feedingStage.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

feedingStage.addEventListener('pointerdown', (event) => {
  if (!feedingSession || feedingPointer || !mentorLayer.hidden) return;
  if (feedingScale?.active) {
    const { x, y } = feedingPointerPosition(event);
    if (!feedingScale.hitsPack(x, y)) return;
    feedingPointer = { id: event.pointerId, pouring: true };
    feedingScale.setHolding(true);
    // The finger may slide off the pack while pouring; the release still has to reach the stage.
    try {
      feedingStage.setPointerCapture(event.pointerId);
    } catch {
      // Nothing to capture for a pointer that is already gone.
    }
    return;
  }
  if (pantryShelf?.active) {
    feedingPointer = { id: event.pointerId, startX: event.clientX, startY: event.clientY, moved: false };
  }
});

feedingStage.addEventListener('pointermove', (event) => {
  if (feedingPointer?.id !== event.pointerId || feedingPointer.pouring) return;
  if (Math.hypot(event.clientX - feedingPointer.startX, event.clientY - feedingPointer.startY) > FEEDING_TAP_TOLERANCE) {
    feedingPointer.moved = true;
  }
});

function endFeedingPointer(event) {
  if (feedingPointer?.id !== event.pointerId) return;
  const pointer = feedingPointer;
  feedingPointer = null;
  if (pointer.pouring) {
    feedingScale?.setHolding(false);
    return;
  }
  if (event.type !== 'pointerup' || pointer.moved || !pantryShelf?.active) return;
  const { x, y } = feedingPointerPosition(event);
  const index = pantryShelf.pick(x, y);
  // Tapping the chosen pack again, or the empty shelf, takes the choice back.
  selectPantryPack(index === pantryShelf.selected ? -1 : index);
}

feedingStage.addEventListener('pointerup', endFeedingPointer);
feedingStage.addEventListener('pointercancel', endFeedingPointer);
// A long press must not open the browser's context menu over the pack.
feedingStage.addEventListener('contextmenu', (event) => event.preventDefault());

pantryBackButton.addEventListener('click', () => leaveFeeding());
pantryCancelButton.addEventListener('click', () => selectPantryPack(-1));
pantryTakeButton.addEventListener('click', takeSelectedPack);
scaleToShelfButton.addEventListener('click', () => {
  if (feedingScale?.settled) showPantry('Выбери пачку. Корм, который уже в миске, там и останется');
});
scaleDoneButton.addEventListener('click', finishPouring);

// The space bar pours too, for players without a touch screen or a mouse.
function isFeedingKeyFree(event) {
  return !feedingScreen.hidden && mentorLayer.hidden && feedingTutorialLayer.classList.contains('is-hidden')
    && !event.target.closest?.('button, input');
}

document.addEventListener('keydown', (event) => {
  if (!isFeedingKeyFree(event)) return;
  if (event.key === 'Escape' && pantryShelf?.active && pantryShelf.selected >= 0) selectPantryPack(-1);
  if (event.code === 'Space' && feedingScale?.active) {
    event.preventDefault();
    feedingScale.setHolding(true);
  }
});

document.addEventListener('keyup', (event) => {
  if (event.code === 'Space' && feedingScale?.active) feedingScale.setHolding(false);
});

function stopFeedingTutorialVoice() {
  feedingTutorialAudio.pause();
  feedingTutorialAudio.removeAttribute('src');
  feedingTutorialAudio.load();
  feedingTutorialVoicePlaying = false;
  updateMusicFade();
}

function playFeedingTutorialVoice(step) {
  stopFeedingTutorialVoice();
  if (!step?.audio) return;

  feedingTutorialAudio.src = publicAssetPath(step.audio_folder, step.audio, 'audio/feeding_tutorial');
  feedingTutorialAudio.volume = 1;
  feedingTutorialAudio.muted = muted;
  feedingTutorialAudio.play()
    .then(() => {
      feedingTutorialVoicePlaying = true;
      updateMusicFade();
    })
    .catch((error) => {
      feedingTutorialVoicePlaying = false;
      updateMusicFade();
      console.info(`Озвучка шага ${step.queue ?? feedingTutorialIndex + 1} туториала кормления пока недоступна.`, error);
    });
}

feedingTutorialAudio.addEventListener('ended', () => {
  feedingTutorialVoicePlaying = false;
  updateMusicFade();
});

feedingTutorialAudio.addEventListener('error', () => {
  if (!feedingTutorialAudio.getAttribute('src')) return;
  feedingTutorialVoicePlaying = false;
  updateMusicFade();
  console.warn('Не удалось загрузить озвучку туториала кормления:', feedingTutorialAudio.currentSrc);
});

// Tutorial targets are HUD elements with data-feeding-target or 3D objects of the scene on screen.
function feedingTargetRect(target) {
  if (!target) return null;
  const element = feedingScreen.querySelector(`[data-feeding-target="${CSS.escape(String(target))}"]`);
  if (!element) {
    const scene = feedingScale?.active ? feedingScale : pantryShelf;
    return scene?.screenRect(target) ?? null;
  }
  const screenRect = feedingScreen.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  return { left: rect.left - screenRect.left, top: rect.top - screenRect.top, width: rect.width, height: rect.height };
}

function positionFeedingTutorialFocus(target) {
  const rect = feedingTargetRect(target);
  feedingTutorialFocus.hidden = !rect;
  if (!rect) return;
  feedingTutorialFocus.style.left = `${rect.left - FEEDING_FOCUS_PADDING}px`;
  feedingTutorialFocus.style.top = `${rect.top - FEEDING_FOCUS_PADDING}px`;
  feedingTutorialFocus.style.width = `${rect.width + FEEDING_FOCUS_PADDING * 2}px`;
  feedingTutorialFocus.style.height = `${rect.height + FEEDING_FOCUS_PADDING * 2}px`;
}

function renderFeedingTutorialStep() {
  const step = feedingTutorialSteps[feedingTutorialIndex];
  if (!step) return finishFeedingTutorial();

  const area = step.screen_area || {};
  const last = feedingTutorialIndex === feedingTutorialSteps.length - 1;
  feedingTutorialLayer.dataset.placement = area.message_placement || 'bottom';
  feedingTutorialProgress.textContent = `ШАГ ${feedingTutorialIndex + 1} ИЗ ${feedingTutorialSteps.length}`;
  feedingTutorialText.textContent = String(step.text || '');
  feedingTutorialBack.disabled = feedingTutorialIndex === 0;
  feedingTutorialNext.innerHTML = last
    ? 'Понятно! <span aria-hidden="true">✓</span>'
    : 'Дальше <span aria-hidden="true">→</span>';
  positionFeedingTutorialFocus(area.target);
  playFeedingTutorialVoice(step);
}

// Until the first successful feeding, each of the two screens explains itself once per feeding.
function maybeStartFeedingTutorial(title) {
  if (!feedingSession?.firstFeeding || feedingSession.tutorials.has(title)) return;
  feedingSession.tutorials.add(title);
  feedingTutorialSteps = dataMartRows
    .filter((row) => row?.object_type === FEEDING_TUTORIAL_OBJECT_TYPE && row.title === title)
    .sort((left, right) => Number(left.queue) - Number(right.queue));
  if (!feedingTutorialSteps.length) return;
  feedingTutorialIndex = 0;
  setHidden(feedingTutorialLayer, false);
  renderFeedingTutorialStep();
}

function finishFeedingTutorial() {
  stopFeedingTutorialVoice();
  setHidden(feedingTutorialLayer, true);
  feedingTutorialFocus.hidden = true;
}

feedingTutorialNext.addEventListener('click', () => {
  if (feedingTutorialIndex >= feedingTutorialSteps.length - 1) return finishFeedingTutorial();
  feedingTutorialIndex += 1;
  renderFeedingTutorialStep();
});

feedingTutorialBack.addEventListener('click', () => {
  if (feedingTutorialIndex === 0) return;
  feedingTutorialIndex -= 1;
  renderFeedingTutorialStep();
});

feedingTutorialSkip.addEventListener('click', finishFeedingTutorial);

// --- Чистка козявок: мини-игра с ковырялкой -----------------------------------

// Monsters keep their bogeys in their ears. The 🤧 icon opens the game once the monster is dirty and
// the player owns a nose cleaner. It is played in the room itself: the monster stands still, the
// camera flies up to an ear, the tool goes in, the handle is stirred along three figures and the
// tool comes out with its catch; then the same with the other ear. The 3D side is ear-cleaning.js.
const CLEANING_TITLE = 'Чистка козявок';
const CLEANING_START_EVENT = 'Начало чистки козявок';
const CLEANING_EAR_EVENT = 'Чистка уха';
const CLEANING_EVENT = 'Чистка козявок';
const CLEANING_TUTORIAL_OBJECT_TYPE = 'Cleaning tutorial';
// The `title` of the tutorial rows each stage of the first cleaning opens.
const CLEANING_TUTORIALS = { aim: 'Прицел', trace: 'Фигуры', pull: 'Вытаскиваем', secondEar: 'Второе ухо' };
const CLEANING_MUSIC = './Silly_Tails_and_Tussles.mp3';
const CLEANING_EAR_TITLES = ['Первое ухо', 'Второе ухо'];
const CLEANING_FOCUS_PADDING = 6;
// A finger covers what is under it, so on a touch screen the scoop is carried a little above it.
const CLEANING_TOUCH_LIFT = 46;
// How far the finger pulls, in pixels, before the tool comes out of the ear.
const CLEANING_PULL_DISTANCE = 110;
// Without a recorded voice the monster still moves its mouth, this long per letter of its line.
const CLEANING_TALK_SECONDS_PER_CHAR = 0.055;
const SVG_NS = 'http://www.w3.org/2000/svg';

const cleaningStage = $('#cleaning-stage');
const cleaningTarget = $('#cleaning-target');
const cleaningFigure = $('#cleaning-figure');
const cleaningFigureGuide = $('#cleaning-figure-guide');
const cleaningFigureDone = $('#cleaning-figure-done');
const cleaningFigureArrows = $('#cleaning-figure-arrows');
const cleaningFigureStart = $('#cleaning-figure-start');
const cleaningFigureEnd = $('#cleaning-figure-end');
const cleaningFigureHead = $('#cleaning-figure-head');
const cleaningHud = $('.cleaning-hud');
const cleaningTitle = $('#cleaning-title');
const cleaningSteps = $('#cleaning-steps');
const cleaningBack = $('#cleaning-back');
const cleaningStatus = $('#cleaning-status');
const cleaningToasts = $('#cleaning-toasts');
const cleaningHint = $('#cleaning-hint');
const cleaningSpeech = $('#cleaning-speech');
const cleaningSpeechName = $('#cleaning-speech-name');
const cleaningSpeechText = $('#cleaning-speech-text');
const cleaningSpeechRepeat = $('#cleaning-speech-repeat');
const cleaningSpeechNext = $('#cleaning-speech-next');
const cleaningTutorialLayer = $('#cleaning-tutorial-layer');
const cleaningTutorialFocus = $('#cleaning-tutorial-focus');
const cleaningTutorialProgress = $('#cleaning-tutorial-progress');
const cleaningTutorialText = $('#cleaning-tutorial-text');
const cleaningTutorialBack = $('#cleaning-tutorial-back');
const cleaningTutorialNext = $('#cleaning-tutorial-next');
const cleaningTutorialSkip = $('#cleaning-tutorial-skip');
const cleaningLoading = $('#cleaning-loading');
const cleaningLoadingMarkup = cleaningLoading.innerHTML;

let cleaningRunId = 0;
// The cleaning in progress: the device it is done with, whether it is the player's first cleaning
// (only then the tutorials open) and which tutorials have been shown.
let cleaningSession = null;
// What the game waits for from the player: { mode: 'aim' | 'trace' | 'pull', resolve }.
let cleaningPhase = null;
let cleaningTracer = null;
// From the centre of the figure to the resting end of the handle, when the figure had to move
// to fit the screen: the handle moves the way the finger moves around the figure.
let cleaningFigureOffset = { x: 0, y: 0 };
let cleaningPointer = null;
let shownCleaningLine = null;
let cleaningSpeechResolve = null;
let cleaningTalkUntil = 0;
let cleaningTutorialSteps = [];
let cleaningTutorialIndex = 0;

function cleaningLine(trigger) {
  return dataMartRows.find((row) => row?.object_type === MONSTER_LINE_OBJECT_TYPE
    && row.title === CLEANING_TITLE && row.trigger === trigger) ?? null;
}

function usedCleanings(records, device) {
  return records.filter((record) => record?.['Тип события'] === CLEANING_EVENT
    && String(record['Прибор']) === String(device?.id)).length;
}

// The 🤧 icon. A clean monster needs nothing; every other tap is an attempt to clean it, and on the
// day of episode 352 the attempt ends at the service centre. Without a nose cleaner an error sends
// the player to the technique store; a cleaner away for repair or with its resource used up says
// so; otherwise the game begins.
function startCleaning() {
  const profileId = getUserProfileId();
  let records = readProfileRecords(profileId);
  const state = deriveRoomState(records);
  if (!state.dirty) {
    showRoomError(CLEAN_MONSTER_TRIGGER);
    return;
  }
  const pick = cleaningDevice(state, techItems(), (device) => usedCleanings(records, device));
  if (!pick) {
    showRoomError(NO_CLEANER_TRIGGER);
    return;
  }
  appendProfileRecord({
    'Тип события': CLEANING_ATTEMPT_EVENT,
    'Профиль пользователя': profileId,
    'Прибор': pick.device?.id ?? null,
    'Игровой день': state.day,
  });
  records = readProfileRecords(profileId);
  const episode = dueEconomicEpisodes(dataMartRows, records).find(isRepairEpisode);
  if (episode && pick.device) {
    openRepairEpisode(episode);
    return;
  }
  if (!pick.device) {
    showRoomMessage(pick.repairUntil ? `Ковырялка в ремонте до ${pick.repairUntil}-го дня` : 'Ковырялка в ремонте');
    return;
  }
  if (pick.left > 0 && maybeBreakCleaner(state, records, pick)) return;
  if (pick.left <= 0) {
    const refill = itemSpec(pick.device)?.refillId;
    showRoomMessage(refill ? `Для «${pick.device.title}» закончились картриджи` : `У «${pick.device.title}» закончился ресурс чисток`);
    return;
  }
  enterCleaning(pick.device);
}

async function enterCleaning(device) {
  const runId = ++cleaningRunId;
  closeRoomAction();
  hideRoomMessage();
  closeRoomInbox();
  closeSavingsTransfer();
  finishCleaningTutorial();
  showOnlyScreen(cleaningScreen);
  resetCleaningOverlay();
  cleaningLoading.innerHTML = cleaningLoadingMarkup;
  cleaningLoading.classList.remove('is-hidden');
  switchBackgroundTrack(ROOT_AUDIO_URLS[CLEANING_MUSIC] ?? MUSIC_TRACKS.room).catch((error) => {
    console.warn('Не удалось включить музыку чистки козявок:', error);
  });

  const profileId = getUserProfileId();
  const records = readProfileRecords(profileId);
  const state = deriveRoomState(records);
  cleaningSession = {
    device,
    firstCleaning: !records.some((record) => record?.['Тип события'] === CLEANING_EVENT),
    tutorials: new Set(),
  };
  ['cleaning-joke', 'cleaning-thanks'].map(cleaningLine).forEach((line) => {
    if (line?.audio) warmUpVoice(publicAssetPath(line.audio_folder, line.audio, 'audio/cleaning'));
  });
  appendProfileRecord({
    'Тип события': CLEANING_START_EVENT,
    'Профиль пользователя': profileId,
    'Прибор': device?.id ?? null,
    'Название прибора': device?.title ?? null,
    'Игровой день': state.day,
  });

  try {
    await monsterReadyPromise;
    if (!renderer || !roomController) throw new Error('3D-сцена недоступна');
    roomReadyPromise ??= roomController.initialize();
    await roomReadyPromise;
    earCleaning ??= new EarCleaning({ room: roomController });
    await earCleaning.build(renderer);
    await earCleaning.useTool(device?.id);
    if (runId !== cleaningRunId) return;
    // Opened straight from the address bar, the game finds the room not entered yet.
    if (!roomController.active) roomController.enter(state.name);
    applyMonsterLook(state);
    roomController.hold();
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    earCleaning.enter();
    attachRenderer(cleaningStage);
    resizeCleaningStage();
    cleaningLoading.classList.add('is-hidden');
    runCleaning(runId);
  } catch (error) {
    console.error('Не удалось начать чистку козявок:', error);
    if (runId !== cleaningRunId) return;
    cleaningLoading.innerHTML = '<span class="loading-eye" aria-hidden="true"></span><span>Ковырялка куда-то подевалась.<br>Обнови страницу!</span>';
  }
}

// Leaving halfway writes nothing more: the monster simply stays dirty.
function leaveCleaning() {
  cleaningRunId += 1;
  finishCleaningTutorial();
  finishCleaningLine(false);
  resolveCleaningPhase(false);
  resetCleaningOverlay();
  cleaningSession = null;
  earCleaning?.exit();
  roomController?.release();
  enterRoom();
}

cleaningBack.addEventListener('click', leaveCleaning);

function resetCleaningOverlay() {
  cleaningPhase = null;
  cleaningPointer = null;
  cleaningTracer = null;
  setCleaningMode('idle');
  renderCleaningFigure();
  renderCleaningSteps(null);
  setCleaningHint('');
  cleaningTitle.textContent = CLEANING_TITLE;
  cleaningSpeech.hidden = true;
  cleaningToasts.replaceChildren();
}

async function runCleaning(runId) {
  const alive = () => runId === cleaningRunId && Boolean(earCleaning?.active);
  cleaningTitle.textContent = 'Козявки в ушах?';
  if (!(await earCleaning.flyToOverview()) || !alive()) return;
  if (!(await sayCleaningLine(cleaningLine('cleaning-joke'))) || !alive()) return;
  for (let index = 0; index < CLEANING_EARS.length; index += 1) {
    if (!(await cleanEar(index, alive)) || !alive()) return;
  }
  await finishCleaning(alive);
}

async function cleanEar(index, alive) {
  const figures = EAR_FIGURES[index] ?? EAR_FIGURES[0];
  cleaningTitle.textContent = CLEANING_EAR_TITLES[index] ?? 'Ухо';
  renderCleaningSteps(figures, 0);
  setCleaningHint('');
  if (!(await earCleaning.flyToEar(index)) || !alive()) return false;
  if (!(await aimCleaningTool(index)) || !alive()) return false;
  for (let step = 0; step < figures.length; step += 1) {
    renderCleaningSteps(figures, step);
    if (!(await traceCleaningFigure(figures[step], step)) || !alive()) return false;
    earCleaning.setBogeys(index, 1 - (step + 1) / figures.length);
    renderCleaningSteps(figures, step + 1);
    // The finished figure shines for a moment before the next one.
    await delay(550);
    if (!alive()) return false;
  }
  if (!(await pullCleaningTool()) || !alive()) return false;

  appendProfileRecord({
    'Тип события': CLEANING_EAR_EVENT,
    'Профиль пользователя': getUserProfileId(),
    'Ухо': CLEANING_EARS[index].label,
    'Фигуры': figures.map((key) => FIGURES[key].name).join(', '),
    'Игровой день': deriveRoomState(readProfileRecords(getUserProfileId())).day,
  });
  showCleaningToast('🟢', 'Козявка поймана!', index < CLEANING_EARS.length - 1 ? 'Теперь второе ухо' : 'Оба уха чистые');
  await delay(1200);
  if (!alive()) return false;
  earCleaning.hideTool();
  return true;
}

// Both ears are clean: the monster is clean again, and the device has done one more cleaning.
async function finishCleaning(alive) {
  const profileId = getUserProfileId();
  const device = cleaningSession?.device ?? null;
  const { left, cartridges, pieces } = writeCleaningRecords(device);

  setCleaningMode('done');
  cleaningTitle.textContent = 'Уши чистые!';
  renderCleaningSteps(null);
  setCleaningHint('');
  earCleaning.hideTool();
  applyMonsterLook(deriveRoomState(readProfileRecords(profileId)), 'happy');
  if (!(await earCleaning.flyToOverview()) || !alive()) return;
  roomController.holdPose('FunnyDancing_02');
  const total = (itemSpec(device)?.cleanings ?? 0) * pieces;
  const resourceNote = !device ? ''
    : itemSpec(device)?.refillId ? `«${device.title}»: картриджей осталось ${cartridges}`
      : total ? `«${device.title}»: ресурс ${left} из ${total} ${cleaningsWord(total)}` : '';
  showCleaningToast('✨', 'Монстрик чистый!', resourceNote);
  const thanks = cleaningLine('cleaning-thanks');
  if (!(await sayCleaningLine(thanks, { nextLabel: 'В комнату <span aria-hidden="true">✓</span>' })) || !alive()) return;
  leaveCleaning();
}

// The records of a finished cleaning with `device`: a cartridge from stock when the device needs
// one, the cleaning itself and a clean monster. The final part of the game cleans this way too.
function writeCleaningRecords(device, extra = {}) {
  const profileId = getUserProfileId();
  const records = readProfileRecords(profileId);
  const state = deriveRoomState(records);
  const used = device ? usedCleanings(records, device) : 0;
  const pieces = device ? state.inventory.get(device.id) ?? 1 : 1;
  // Once a device on consumables has used up its own cartridge, every cleaning takes one from stock.
  const cartridgeUsed = Boolean(device) && cleaningUsesCartridge(device, used, pieces) && ownedCartridges(state.inventory) > 0;
  const cartridges = ownedCartridges(state.inventory) - (cartridgeUsed ? 1 : 0);
  const left = device ? cleaningsLeft(device, used + 1, { pieces, cartridges }) : null;
  if (cartridgeUsed) {
    appendProfileRecord({
      'Тип события': INVENTORY_CHANGE_EVENT,
      'Тип инвентаря': CARTRIDGE_ITEM_ID,
      'Количество': -1,
      'Единица измерения': 'шт',
      'Назначение': `Чистка козявок: картридж для «${device.title}»`,
      'Профиль пользователя': profileId,
      'Игровой день': state.day,
    });
  }
  appendProfileRecord({
    'Тип события': CLEANING_EVENT,
    'Профиль пользователя': profileId,
    'Прибор': device?.id ?? null,
    'Название прибора': device?.title ?? null,
    'Осталось чисток': left,
    ...(cartridgeUsed ? { 'Израсходован картридж': true } : {}),
    ...extra,
    'Игровой день': state.day,
  });
  if (state.dirty) {
    appendProfileRecord({
      'Тип события': MONSTER_STATE_EVENT,
      'Профиль пользователя': profileId,
      'Состояние': HYGIENE_STATE,
      'Было': DIRTY,
      'Стало': CLEAN,
      'Игровой день': state.day,
    });
  }
  return { left, cartridges, pieces };
}

// --- The three things the player does with the tool ---

function waitForCleaningPhase(mode) {
  resolveCleaningPhase(false);
  return new Promise((resolve) => { cleaningPhase = { mode, resolve }; });
}

function resolveCleaningPhase(result) {
  const phase = cleaningPhase;
  cleaningPhase = null;
  phase?.resolve(result);
}

function setCleaningMode(mode) {
  cleaningScreen.dataset.mode = mode;
  cleaningTarget.hidden = mode !== 'aim';
  cleaningStatus.textContent = {
    aim: 'Отнеси ковырялку к уху',
    trace: 'Води ручкой ковырялки по фигуре',
    pull: 'Вытащи ковырялку из уха',
    done: 'Уши чистые',
  }[mode] ?? '';
}

function setCleaningHint(text) {
  cleaningHint.textContent = text;
  cleaningHint.hidden = !text;
}

// 1. Carry the tool to the ear: it waits below the ear, on the side away from the head.
function aimCleaningTool(index) {
  setCleaningMode('aim');
  const width = cleaningStage.clientWidth;
  const height = cleaningStage.clientHeight;
  earCleaning.showTool(width / 2 + earCleaning.outward * width * 0.14, height * 0.7);
  setCleaningHint('Отнеси ковырялку к уху — в жёлтый кружок');
  maybeStartCleaningTutorial(index === 0 ? CLEANING_TUTORIALS.aim : CLEANING_TUTORIALS.secondEar);
  return waitForCleaningPhase('aim');
}

function cleaningCaptureRadius() {
  return Math.max(44, Math.min(cleaningStage.clientWidth, cleaningStage.clientHeight) * 0.17);
}

function insertCleaningTool() {
  const phase = cleaningPhase;
  cleaningPointer = null;
  cleaningTarget.hidden = true;
  setCleaningHint('Есть! Ковырялка в ухе');
  earCleaning.insert().then((inserted) => {
    if (cleaningPhase === phase) resolveCleaningPhase(inserted);
  });
}

// 2. Stir the handle along a figure.
function traceCleaningFigure(key, step) {
  setCleaningMode('trace');
  setCleaningHint(`Нарисуй ${FIGURES[key].accusative}: от зелёной точки по стрелкам`);
  layoutCleaningFigure(key);
  if (step === 0) maybeStartCleaningTutorial(CLEANING_TUTORIALS.trace);
  return waitForCleaningPhase('trace');
}

// The figure is centred on the resting end of the handle, as far as the screen allows.
function layoutCleaningFigure(key = cleaningTracer?.key) {
  if (!key || !earCleaning?.active) return;
  const width = cleaningStage.clientWidth;
  const height = cleaningStage.clientHeight;
  const top = cleaningHud.getBoundingClientRect().bottom - cleaningScreen.getBoundingClientRect().top + 12;
  const bottom = Math.max(78, height * 0.1);
  const size = Math.min(width * 0.64, (height - top - bottom) * 0.6);
  const half = size / 2 + 16;
  const rest = earCleaning.handleRestScreen();
  const centerX = Math.min(Math.max(rest.x, half), width - half);
  const centerY = Math.min(Math.max(rest.y, top + half), height - bottom - half);
  const ratio = cleaningTracer?.key === key ? cleaningTracer.ratio : 0;
  cleaningTracer = new FigureTracer(key, { centerX, centerY, size });
  if (ratio) cleaningTracer.restore(ratio);
  cleaningFigureOffset = { x: rest.x - centerX, y: rest.y - centerY };
  cleaningFigure.classList.remove('is-done');
  renderCleaningFigureArrows();
  renderCleaningFigure();
}

function completeCleaningFigure() {
  // The finger has to be lifted before the next figure: it starts at its own green dot.
  cleaningPointer = null;
  cleaningFigure.classList.add('is-done');
  earCleaning.moveHandle();
  resolveCleaningPhase(true);
}

// 3. Pull the tool out.
function pullCleaningTool() {
  setCleaningMode('pull');
  cleaningTracer = null;
  renderCleaningFigure();
  earCleaning.beginPull();
  setCleaningHint('Потяни ковырялку из уха в любую сторону');
  maybeStartCleaningTutorial(CLEANING_TUTORIALS.pull);
  return waitForCleaningPhase('pull');
}

function pullOutCleaningTool() {
  const phase = cleaningPhase;
  cleaningPointer = null;
  setCleaningHint('');
  earCleaning.pullOut().then((out) => {
    if (cleaningPhase === phase) resolveCleaningPhase(out);
  });
}

// Every frame, after the 3D scene has moved: the target ring follows the twitching ear, and the
// tool slides in by itself once it is carried close enough.
function updateCleaningOverlay() {
  if (cleaningPhase?.mode !== 'aim' || !earCleaning) return;
  const hole = earCleaning.holeScreen();
  const radius = cleaningCaptureRadius();
  cleaningTarget.style.setProperty('--size', `${Math.round(radius * 1.3)}px`);
  cleaningTarget.style.transform = `translate(${hole.x}px, ${hole.y}px)`;
  if (earCleaning.mode !== 'aim' || !cleaningTutorialLayer.classList.contains('is-hidden')) return;
  const tip = earCleaning.tipScreen();
  if (Math.hypot(tip.x - hole.x, tip.y - hole.y) <= radius) insertCleaningTool();
}

function cleaningPointerPosition(event) {
  const rect = cleaningStage.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function moveCleaningPointer({ x, y }) {
  const mode = cleaningPhase?.mode;
  if (mode === 'aim') {
    earCleaning.aimAt(x, y - (cleaningPointer.touch ? CLEANING_TOUCH_LIFT : 0));
  } else if (mode === 'trace' && cleaningTracer) {
    earCleaning.moveHandle(x + cleaningFigureOffset.x, y + cleaningFigureOffset.y);
    if (!cleaningTracer.feed(x, y)) return;
    renderCleaningFigure();
    if (cleaningTracer.done) completeCleaningFigure();
  } else if (mode === 'pull' && earCleaning.mode === 'pull') {
    const pulled = Math.hypot(x - cleaningPointer.startX, y - cleaningPointer.startY) / CLEANING_PULL_DISTANCE;
    earCleaning.setPull(pulled);
    if (pulled >= 1) pullOutCleaningTool();
  }
}

cleaningStage.addEventListener('pointerdown', (event) => {
  if (!cleaningPhase || cleaningPointer || !earCleaning?.active) return;
  const point = cleaningPointerPosition(event);
  cleaningPointer = { id: event.pointerId, startX: point.x, startY: point.y, touch: event.pointerType === 'touch' };
  // The finger may leave the stage while it draws; the release still has to come back here.
  try {
    cleaningStage.setPointerCapture(event.pointerId);
  } catch {
    // Nothing to capture for a pointer that is already gone.
  }
  moveCleaningPointer(point);
});

cleaningStage.addEventListener('pointermove', (event) => {
  if (cleaningPointer?.id !== event.pointerId) return;
  moveCleaningPointer(cleaningPointerPosition(event));
});

function endCleaningPointer(event) {
  if (cleaningPointer?.id !== event.pointerId) return;
  cleaningPointer = null;
  if (cleaningPhase?.mode === 'trace') earCleaning?.moveHandle();
  if (cleaningPhase?.mode === 'pull') earCleaning?.setPull(0);
}

cleaningStage.addEventListener('pointerup', endCleaningPointer);
cleaningStage.addEventListener('pointercancel', endCleaningPointer);
cleaningStage.addEventListener('contextmenu', (event) => event.preventDefault());

function resizeCleaningStage() {
  if (cleaningScreen.hidden || !earCleaning?.active) return;
  earCleaning.resize(cleaningStage.clientWidth, cleaningStage.clientHeight);
  if (cleaningTracer) layoutCleaningFigure();
  if (!cleaningTutorialLayer.classList.contains('is-hidden')) {
    positionCleaningTutorialFocus(cleaningTutorialSteps[cleaningTutorialIndex]?.screen_area?.target);
  }
}

// --- What is drawn over the scene ---

function figurePath(points) {
  return points.map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(3)} ${y.toFixed(3)}`).join(' ');
}

// The small picture of a figure in the list of the ear's figures.
function figureGlyph(key) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '-1.2 -1.2 2.4 2.4');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', figurePath(FIGURES[key].points()));
  svg.append(path);
  return svg;
}

function renderCleaningSteps(figures, current = 0) {
  cleaningSteps.hidden = !figures?.length;
  cleaningSteps.replaceChildren(...(figures ?? []).map((key, index) => {
    const item = document.createElement('li');
    item.className = 'cleaning-step';
    item.classList.toggle('is-done', index < current);
    item.classList.toggle('is-current', index === current);
    item.title = FIGURES[key].name;
    item.setAttribute('aria-label', `${FIGURES[key].name}${index < current ? ', готово' : ''}`);
    item.append(figureGlyph(key));
    return item;
  }));
}

function renderCleaningFigure() {
  const tracer = cleaningTracer;
  // An <svg> has no `hidden` property of its own, only the attribute.
  cleaningFigure.toggleAttribute('hidden', !tracer);
  if (!tracer) return;
  cleaningFigureGuide.setAttribute('d', tracer.svgPath());
  cleaningFigureDone.setAttribute('d', tracer.index > 0 ? tracer.svgPath(tracer.index) : '');
  const [startX, startY] = tracer.points[0];
  const [endX, endY] = tracer.points[tracer.points.length - 1];
  cleaningFigureStart.setAttribute('cx', startX.toFixed(1));
  cleaningFigureStart.setAttribute('cy', startY.toFixed(1));
  cleaningFigureStart.classList.toggle('is-waiting', tracer.index === 0);
  cleaningFigureEnd.setAttribute('cx', endX.toFixed(1));
  cleaningFigureEnd.setAttribute('cy', endY.toFixed(1));
  const head = tracer.head();
  cleaningFigureHead.setAttribute('cx', head.x.toFixed(1));
  cleaningFigureHead.setAttribute('cy', head.y.toFixed(1));
  cleaningFigureHead.style.display = tracer.index > 0 ? '' : 'none';
}

// Little arrows along the path show which way to go.
function renderCleaningFigureArrows() {
  const tracer = cleaningTracer;
  if (!tracer) return;
  const count = Math.max(3, Math.round(tracer.total / 80));
  cleaningFigureArrows.replaceChildren(...tracer.arrows(count).map(({ x, y, angle }) => {
    const arrow = document.createElementNS(SVG_NS, 'path');
    arrow.setAttribute('d', 'M -6 -7 L 7 0 L -6 7 Z');
    arrow.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(angle * 180 / Math.PI).toFixed(1)})`);
    return arrow;
  }));
}

function showCleaningToast(icon, titleText, noteText = '') {
  const item = document.createElement('li');
  item.className = 'park-toast';
  const badge = document.createElement('span');
  badge.className = 'park-toast-icon';
  badge.setAttribute('aria-hidden', 'true');
  badge.textContent = icon;
  const body = document.createElement('span');
  const title = document.createElement('strong');
  title.textContent = titleText;
  body.append(title);
  if (noteText) {
    const note = document.createElement('small');
    note.textContent = noteText;
    body.append(note);
  }
  item.append(badge, body);
  cleaningToasts.append(item);
  window.setTimeout(() => item.remove(), 3800);
}

// --- The monster speaks ---

function isCleaningMonsterTalking() {
  return cleaningVoicePlaying || performance.now() < cleaningTalkUntil;
}

// With no voice to follow, the mouth moves for about as long as the line takes to say.
function talkWithoutVoice(line) {
  const seconds = String(line?.text || '').length * CLEANING_TALK_SECONDS_PER_CHAR;
  cleaningTalkUntil = performance.now() + Math.min(7, Math.max(1.5, seconds)) * 1000;
}

function stopCleaningVoice() {
  cleaningVoiceAudio.pause();
  cleaningVoiceAudio.removeAttribute('src');
  cleaningVoiceAudio.load();
  cleaningVoicePlaying = false;
  cleaningTalkUntil = 0;
  updateMusicFade();
}

async function playCleaningVoice(line) {
  stopCleaningVoice();
  if (!line) return;
  if (!line.audio) {
    talkWithoutVoice(line);
    return;
  }
  const url = publicAssetPath(line.audio_folder, line.audio, 'audio/cleaning');
  const source = (await warmUpVoice(url)) ?? url;
  // The player may have moved on while the file was on its way.
  if (shownCleaningLine !== line) return;
  cleaningVoiceAudio.src = source;
  cleaningVoiceAudio.volume = 1;
  cleaningVoiceAudio.muted = muted;
  cleaningVoiceAudio.play()
    .then(() => {
      cleaningVoicePlaying = true;
      updateMusicFade();
    })
    .catch((error) => {
      cleaningVoicePlaying = false;
      updateMusicFade();
      if (shownCleaningLine === line) talkWithoutVoice(line);
      console.info(`Озвучка реплики монстра ${line.id} пока недоступна.`, error);
    });
}

cleaningVoiceAudio.addEventListener('ended', () => {
  cleaningVoicePlaying = false;
  updateMusicFade();
});

cleaningVoiceAudio.addEventListener('error', () => {
  if (!cleaningVoiceAudio.getAttribute('src')) return;
  cleaningVoicePlaying = false;
  updateMusicFade();
  if (shownCleaningLine) talkWithoutVoice(shownCleaningLine);
  console.warn('Не удалось загрузить озвучку реплики монстра:', cleaningVoiceAudio.currentSrc);
});

// The words stay until the player taps the button: true then, false when the game was left.
function sayCleaningLine(line, { nextLabel = 'Дальше <span aria-hidden="true">→</span>' } = {}) {
  if (!line) return Promise.resolve(true);
  finishCleaningLine(false);
  shownCleaningLine = line;
  cleaningSpeechName.textContent = deriveRoomState(readProfileRecords(getUserProfileId())).name;
  cleaningSpeechText.textContent = String(line.text || '');
  cleaningSpeechNext.innerHTML = nextLabel;
  cleaningSpeech.hidden = false;
  playCleaningVoice(line);
  cleaningSpeechNext.focus({ preventScroll: true });
  return new Promise((resolve) => { cleaningSpeechResolve = resolve; });
}

function finishCleaningLine(result) {
  const resolve = cleaningSpeechResolve;
  cleaningSpeechResolve = null;
  shownCleaningLine = null;
  stopCleaningVoice();
  cleaningSpeech.hidden = true;
  resolve?.(result);
}

cleaningSpeechNext.addEventListener('click', () => finishCleaningLine(true));
cleaningSpeechRepeat.addEventListener('click', () => playCleaningVoice(shownCleaningLine));

// --- Tutorial of the first cleaning ---

function stopCleaningTutorialVoice() {
  cleaningTutorialAudio.pause();
  cleaningTutorialAudio.removeAttribute('src');
  cleaningTutorialAudio.load();
  cleaningTutorialVoicePlaying = false;
  updateMusicFade();
}

function playCleaningTutorialVoice(step) {
  stopCleaningTutorialVoice();
  if (!step?.audio) return;

  cleaningTutorialAudio.src = publicAssetPath(step.audio_folder, step.audio, 'audio/cleaning_tutorial');
  cleaningTutorialAudio.volume = 1;
  cleaningTutorialAudio.muted = muted;
  cleaningTutorialAudio.play()
    .then(() => {
      cleaningTutorialVoicePlaying = true;
      updateMusicFade();
    })
    .catch((error) => {
      cleaningTutorialVoicePlaying = false;
      updateMusicFade();
      console.info(`Озвучка шага ${step.queue ?? cleaningTutorialIndex + 1} туториала чистки пока недоступна.`, error);
    });
}

cleaningTutorialAudio.addEventListener('ended', () => {
  cleaningTutorialVoicePlaying = false;
  updateMusicFade();
});

cleaningTutorialAudio.addEventListener('error', () => {
  if (!cleaningTutorialAudio.getAttribute('src')) return;
  cleaningTutorialVoicePlaying = false;
  updateMusicFade();
  console.warn('Не удалось загрузить озвучку туториала чистки:', cleaningTutorialAudio.currentSrc);
});

// Targets are HUD elements with data-cleaning-target, the figure, or the ear and the tool in 3D.
function cleaningTargetRect(target) {
  if (!target) return null;
  const screenRect = cleaningScreen.getBoundingClientRect();
  const element = cleaningScreen.querySelector(`[data-cleaning-target="${CSS.escape(String(target))}"]`);
  if (element && !element.hidden) {
    const rect = element.getBoundingClientRect();
    return { left: rect.left - screenRect.left, top: rect.top - screenRect.top, width: rect.width, height: rect.height };
  }
  if (target === 'figure') {
    if (cleaningFigure.hasAttribute('hidden')) return null;
    const box = cleaningFigureGuide.getBBox();
    const pad = 22;
    return { left: box.x - pad, top: box.y - pad, width: box.width + pad * 2, height: box.height + pad * 2 };
  }
  return earCleaning?.screenRect(target) ?? null;
}

function positionCleaningTutorialFocus(target) {
  const rect = cleaningTargetRect(target);
  cleaningTutorialFocus.hidden = !rect;
  if (!rect) return;
  cleaningTutorialFocus.style.left = `${rect.left - CLEANING_FOCUS_PADDING}px`;
  cleaningTutorialFocus.style.top = `${rect.top - CLEANING_FOCUS_PADDING}px`;
  cleaningTutorialFocus.style.width = `${rect.width + CLEANING_FOCUS_PADDING * 2}px`;
  cleaningTutorialFocus.style.height = `${rect.height + CLEANING_FOCUS_PADDING * 2}px`;
}

function renderCleaningTutorialStep() {
  const step = cleaningTutorialSteps[cleaningTutorialIndex];
  if (!step) return finishCleaningTutorial();

  const area = step.screen_area || {};
  const last = cleaningTutorialIndex === cleaningTutorialSteps.length - 1;
  cleaningTutorialLayer.dataset.placement = area.message_placement || 'bottom';
  cleaningTutorialProgress.textContent = `ШАГ ${cleaningTutorialIndex + 1} ИЗ ${cleaningTutorialSteps.length}`;
  cleaningTutorialText.textContent = String(step.text || '');
  cleaningTutorialBack.disabled = cleaningTutorialIndex === 0;
  cleaningTutorialNext.innerHTML = last
    ? 'Понятно! <span aria-hidden="true">✓</span>'
    : 'Дальше <span aria-hidden="true">→</span>';
  positionCleaningTutorialFocus(area.target);
  playCleaningTutorialVoice(step);
}

// Until the first cleaning is finished, every stage of the game explains itself once per cleaning.
function maybeStartCleaningTutorial(title) {
  if (!cleaningSession?.firstCleaning || cleaningSession.tutorials.has(title)) return;
  cleaningSession.tutorials.add(title);
  cleaningTutorialSteps = dataMartRows
    .filter((row) => row?.object_type === CLEANING_TUTORIAL_OBJECT_TYPE && row.title === title)
    .sort((left, right) => Number(left.queue) - Number(right.queue));
  if (!cleaningTutorialSteps.length) return;
  cleaningTutorialIndex = 0;
  cleaningPointer = null;
  setHidden(cleaningTutorialLayer, false);
  renderCleaningTutorialStep();
  cleaningTutorialNext.focus({ preventScroll: true });
}

function finishCleaningTutorial() {
  stopCleaningTutorialVoice();
  setHidden(cleaningTutorialLayer, true);
  cleaningTutorialFocus.hidden = true;
}

cleaningTutorialNext.addEventListener('click', () => {
  if (cleaningTutorialIndex >= cleaningTutorialSteps.length - 1) return finishCleaningTutorial();
  cleaningTutorialIndex += 1;
  renderCleaningTutorialStep();
});

cleaningTutorialBack.addEventListener('click', () => {
  if (cleaningTutorialIndex === 0) return;
  cleaningTutorialIndex -= 1;
  renderCleaningTutorialStep();
});

cleaningTutorialSkip.addEventListener('click', finishCleaningTutorial);

// --- Flow after the intro --------------------------------------------------

function enterRoomFromIntro() {
  cancelIntroSequence();
  setHidden(skipIntroButton, true);
  enterRoom();
}

function enterEditor() {
  cancelIntroSequence();
  leaveRoom();
  showOnlyScreen(creatorScreen);
  nameDialog.classList.add('is-hidden');
  attachRenderer(monsterStage);
  setHidden(skipIntroButton, true);
  tutorialTimer = window.setTimeout(startTutorial, 700);
}

saveCharacterButton.addEventListener('click', () => {
  finishTutorial();
  nameDialog.classList.remove('is-hidden');
  monsterNameInput.focus({ preventScroll: true });
});

monsterNameInput.addEventListener('input', () => {
  nameCount.textContent = `${monsterNameInput.value.length}/12`;
  monsterNameInput.classList.remove('is-invalid');
  nameError.textContent = '';
});

nameForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = monsterNameInput.value.trim().replace(/\s+/g, ' ');
  if (!name) {
    monsterNameInput.classList.add('is-invalid');
    nameError.textContent = 'Сначала придумай имя';
    monsterNameInput.focus();
    return;
  }

  primeBudgetTutorialAudio();
  finishName.textContent = name;
  saveMonsterCreation(name);
  nameDialog.classList.add('is-hidden');
  startBriefingFlow();
});

function resetCharacter() {
  if (manifest) profile = { ...manifest.profile.default };
  else profile = { fur: 0, ears: 2, horns: 2 };
  syncControls();
  applyProfile();
  applyNeutralFace();
  playDance();
  monsterNameInput.value = '';
  nameCount.textContent = '0/12';
  nameError.textContent = '';
  monsterNameInput.classList.remove('is-invalid');
}

finishMonsterStage.addEventListener('pointerdown', () => {
  roomController?.wave();
});

finishMonsterStage.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  roomController?.wave();
});

restartButton.addEventListener('click', async () => {
  briefingRunId += 1;
  briefingVideo.pause();
  briefingVideo.dispatchEvent(new Event('sequencecancel'));
  stopBriefingVoice();
  finishBudgetTutorial();
  budgetFlowStarted = false;
  budgetApproved = false;
  budgetAllocations = { required: 0, fun: 0, savings: 0 };
  switchBackgroundTrack('story', { fadeOut: 650, fadeIn: 1100 }).catch(() => {});
  finishTutorial();
  leaveRoom();
  resetCharacter();
  attachRenderer(monsterStage);
  runIntroSequence();
});

async function boot() {
  removeLegacyRecords();
  unknownEconomicEpisodeTriggers(dataMartRows).forEach((episode) => {
    console.warn(`Неизвестный триггер экономического эпизода: «${episode.trigger}» (id ${episode.id}).`);
  });
  unknownAdditionalTaskTriggers(dataMartRows).forEach((task) => {
    console.warn(`Неизвестный триггер дополнительного задания: «${task.trigger}» (id ${task.id}), оно не откроется.`);
  });
  loadBudgetTutorial();
  await loadTutorial();
  monsterReadyPromise = initializeMonster();
  applyMuteState();

  const params = new URLSearchParams(window.location.search);
  if (params.get('screen') === 'editor') {
    enterEditor();
    return;
  }
  if (params.get('screen') === 'finish') {
    finishName.textContent = 'Бублик';
    enterRoom();
    return;
  }
  if (params.get('screen') === 'estimate') {
    const episode = dataMartRows.find((row) => String(row.id) === String(TENNIS_ESTIMATE_EPISODE_ID));
    if (episode) {
      openTennisEstimate(episode);
      return;
    }
  }
  // Straight into the letters of credit, whatever the day; records are written as usual.
  if (params.get('screen') === 'loc') {
    const episode = dataMartRows.find((row) => String(row.id) === String(LETTER_OF_CREDIT_EPISODE_ID));
    if (episode) {
      openLetterOfCredit(episode);
      return;
    }
  }
  if (params.get('screen') === 'loans') {
    const episode = dataMartRows.find((row) => String(row.id) === String(BUSINESS_LOANS_EPISODE_ID));
    if (episode) {
      openBusinessLoans(episode);
      return;
    }
  }
  // The father's visit of an episode: ?screen=father&episode=140 (the tennis estimate by default).
  if (params.get('screen') === 'father') {
    const episodeId = params.get('episode') ?? TENNIS_ESTIMATE_EPISODE_ID;
    const episode = dataMartRows.find((row) => String(row.id) === String(episodeId));
    if (fatherVisit(episode)) {
      finishName.textContent = 'Бублик';
      fatherEpisodeRunning = true;
      await enterRoom();
      await playFatherScene(fatherVisitScene(episode));
      return;
    }
  }
  if (params.get('screen') === 'shop') {
    const store = dataMartRows.find((row) => row.object_type === 'Store');
    if (store) {
      enterShop(store);
      return;
    }
  }
  // Straight into the park walk, when the profile has it due today.
  if (params.get('screen') === 'park') {
    const episode = dueEconomicEpisodes(dataMartRows, readProfileRecords(getUserProfileId()))
      .find((item) => item.title === PARK_EPISODE_TITLE);
    if (episode) {
      recordEconomicEpisodeOpened(episode);
      enterPark(episode);
      return;
    }
  }
  if (params.get('screen') === 'tech') {
    const store = dataMartRows.find((row) => row.object_type === 'Store' && row.title === TECH_STORE_TITLE);
    if (store) {
      enterTechShop(store);
      return;
    }
  }
  if (params.get('screen') === 'toy') {
    const store = dataMartRows.find((row) => Number(row.id) === TOY_STORE_ID);
    if (store) {
      await enterToyShop(store);
      return;
    }
  }
  // Straight into the route planner, whatever the day; records are written as usual.
  if (params.get('screen') === 'route') {
    const episode = dataMartRows.find((row) => String(row.id) === String(ROUTE_EPISODE_ID));
    if (episode) {
      openRoutePlanner(episode);
      return;
    }
  }
  // Coach Max's call over the room, then the route planner: ?screen=call.
  if (params.get('screen') === 'call') {
    const episode = dataMartRows.find((row) => String(row.id) === String(ROUTE_EPISODE_ID));
    if (episode) {
      finishName.textContent = 'Бублик';
      routeEpisodeRunning = true;
      await enterRoom();
      showTrainerCall(episode);
      return;
    }
  }
  // Straight into an additional task's game, whatever the day; records are written as usual.
  const TASK_SCREENS = { memo: openCurrencyMemo, assets: openAssetsSort };
  if (TASK_SCREENS[params.get('screen')]) {
    const game = TASK_SCREENS[params.get('screen')];
    const task = dataMartRows.find((row) => row.object_type === 'Additional task' && ADDITIONAL_TASK_GAMES[row.title] === game);
    if (task) {
      finishName.textContent = 'Бублик';
      startAdditionalTask(task);
      return;
    }
  }
  // Straight into the broken nose cleaner of day 9, whatever the day; records are written as usual.
  if (params.get('screen') === 'repair') {
    const episode = dataMartRows.find((row) => String(row.id) === String(REPAIR_EPISODE_ID));
    if (episode) {
      finishName.textContent = 'Бублик';
      openRepairEpisode(episode);
      return;
    }
  }
  if (params.get('screen') === 'feeding') {
    enterFeeding();
    return;
  }
  // Straight into the ear cleaning, whatever the monster's state; records are written as usual.
  if (params.get('screen') === 'cleaning') {
    const records = readProfileRecords(getUserProfileId());
    const pick = cleaningDevice(deriveRoomState(records), techItems(), (device) => usedCleanings(records, device));
    enterCleaning(pick?.device ?? null);
    return;
  }
  if (params.get('screen') === 'briefing') {
    finishName.textContent = 'Бублик';
    try {
      briefingSteps = await loadBriefingSteps();
      if (briefingSteps.length) showBriefingSteps();
      else finishBriefing();
    } catch (error) {
      console.error('Не удалось открыть экран инструктажа:', error);
      finishBriefing();
    }
    return;
  }
  // The briefing of the final part, then the fourth budget: ?screen=final.
  if (params.get('screen') === 'final') {
    finishName.textContent = 'Бублик';
    startFinalBriefing();
    return;
  }
  if (params.get('screen') === 'budget') {
    finishName.textContent = 'Бублик';
    startBudgetFlow();
    return;
  }
  // Straight into the review of a budget whose last day is today, fed or not; records are written as usual.
  if (params.get('screen') === 'review') {
    const records = readProfileRecords(getUserProfileId());
    const round = budgetRoundAfterDay(deriveRoomState(records).day, records);
    if (round) {
      openBudgetReview(round);
      return;
    }
  }

  backgroundMusic.volume = 0;
  showStartGate();
}

boot().then(async () => {
  const params = new URLSearchParams(location.search);
  const consolePreview = params.get('goal') === GAME_CONSOLE_GOAL_ID;
  const telescopePreview = params.get('goal') === TELESCOPE_GOAL_ID;
  const consolePurchasePreview = consolePreview && params.get('stage') === 'buy';
  const playerMonster = consolePurchasePreview
    ? readProfileRecords(getUserProfileId()).findLast((record) => record?.['Тип события'] === MONSTER_CREATED_EVENT)
    : null;
  activeUserProfileId = consolePurchasePreview
    ? 'qa-console-purchase'
    : consolePreview ? 'qa-console-final'
      : telescopePreview ? 'qa-telescope-final' : 'qa-final-pending';
  const profileId = getUserProfileId();
  const previewGoalId = telescopePreview ? TELESCOPE_GOAL_ID
    : consolePreview ? GAME_CONSOLE_GOAL_ID : FESTIVAL_LIGHTS_GOAL_ID;
  const previewGoal = dataMartRows.find((row) => row?.object_type === 'Savings goal'
    && String(row.id) === previewGoalId);
  if (consolePurchasePreview && previewGoal) {
    restoreProfileRecords([
      ...(playerMonster ? [{ ...playerMonster, 'Профиль пользователя': profileId }] : []),
      { 'Тип события': NEW_DAY_EVENT, 'Профиль пользователя': profileId, [DAY_NUMBER_FIELD]: 10 },
      { 'Тип события': FEEDING_EVENT, 'Профиль пользователя': profileId, 'Игровой день': 10 },
      { 'Тип события': FINAL_PART_START_EVENT, 'Профиль пользователя': profileId, 'Игровой день': 10 },
      {
        'Тип события': SAVINGS_GOAL_DECISION_EVENT,
        'Профиль пользователя': profileId,
        'Идентификатор цели': previewGoal.id,
        'Название цели': previewGoal.title,
        'Стоимость': Number(previewGoal.price) || 500,
        'Цель принята': true,
        'Игровой день': 10,
      },
      {
        'Тип события': SAVINGS_TOPUP_EVENT,
        'Профиль пользователя': profileId,
        'Значение': Number(previewGoal.price) || 500,
        'Игровой день': 10,
      },
    ]);
    await monsterReadyPromise;
    await enterRoom({ skipDayOpening: true });
    await offerFinalGoal(previewGoal);
    return;
  }
  if (!readProfileRecords(profileId).length) {
    appendProfileRecord({
      'Тип события': FINAL_PART_START_EVENT,
      'Профиль пользователя': profileId,
      'Игровой день': 10,
    });
    appendProfileRecord({
      'Тип события': GOAL_PURCHASE_EVENT,
      'Профиль пользователя': profileId,
      'Идентификатор цели': previewGoal?.id ?? 49,
      'Название цели': previewGoal?.title ?? 'Праздник огней',
      'Стоимость': Number(previewGoal?.price) || 300,
      'Игровой день': 10,
    });
  }
  finishName.textContent = 'Бублик';
  await monsterReadyPromise;
  if (finalOutcome(readProfileRecords(profileId))) {
    await enterRoom();
    return;
  }
  if (new URLSearchParams(location.search).has('recover')) {
    await enterRoom();
    return;
  }
  if ((consolePreview || telescopePreview) && previewGoal) {
    await playPurchasedGoalScene(previewGoal, { replay: true });
    if (await chooseNextGoals()) await enterRoom();
    return;
  }
  if (await startFestivalLights()) {
    try {
      await showFinalScene({
        kicker: 'ПРАЗДНИК ОГНЕЙ',
        icon: '✨',
        title: 'Танец среди огней',
        text: 'Бублик снова среди других монстров.',
        stub: '',
        next: 'Дальше →',
        festivalPhase: 'dance',
      });
      await showFinalScene({
        kicker: 'КОГДА ПРАЗДНИК ЗАКОНЧИЛСЯ',
        icon: '💛',
        title: 'Бублик говорит тебе спасибо',
        text: 'Спасибо за праздник!',
        stub: '',
        next: 'Дальше →',
        festivalPhase: 'farewell',
      });
    } finally {
      stopFestivalLights();
    }
  } else {
    await showFinalScene({
      kicker: 'ПРАЗДНИК ОГНЕЙ',
      icon: '✨',
      title: 'Огни пока не зажглись',
      text: 'Праздничная сцена не загрузилась. Покупка сохранена — её можно будет посмотреть ещё раз из комнаты.',
      stub: '',
      next: 'Дальше →',
    });
  }
  if (await chooseNextGoals()) await enterRoom();
}).catch(console.error);
