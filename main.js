import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MonsterRoom } from './room.js';
import { MonsterPark } from './park.js';
import { ShopShelf } from './shop.js';
import { FeedingScale, PantryShelf } from './feeding.js';
import {
  BUDGET_FACT_EVENT,
  BUDGET_PLAN_EVENT,
  clampStat,
  currentBudgetNumber,
  DAY_NUMBER_FIELD,
  daysUntilPayday,
  deriveRoomState,
  FEEDING_EVENT,
  FEEDING_FAILED_EVENT,
  FEEDING_MAX_GRAMS,
  FEEDING_MIN_GRAMS,
  FEEDING_START_EVENT,
  FOOD_CATEGORY,
  FOOD_PORTION_GRAMS,
  FOOD_PURCHASE_EVENT,
  INVENTORY_CHANGE_EVENT,
  INVENTORY_UNIT_GRAMS,
  inventoryAmount,
  inventoryUnit,
  isNewDayRecord,
  MONSTER_STAT_EVENT,
  MONSTER_STATE_EVENT,
  NEW_DAY_EVENT,
  pantryPacks,
  PAYDAY_PERIOD_DAYS,
  POCKET_SPENDING_EVENT,
  POCKET_TOPUP_EVENT,
  REQUIRED_ARTICLE,
  SAVINGS_TOPUP_EVENT,
  STAT_LABELS,
  STAT_MAX,
  STAT_MIN,
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
  isNewDayTutorialDue,
  NEW_DAY_TUTORIAL_SEEN_EVENT,
  newDayRecords,
  newDayTutorialSteps,
} from './game-day.js';
import {
  dueEconomicEpisodes,
  ECONOMIC_EPISODE_COMPLETED_EVENT,
  ECONOMIC_EPISODE_OPENED_EVENT,
  isEconomicEpisodeStarted,
  unknownEconomicEpisodeTriggers,
} from './economic-episodes.js';
import './styles.css';
import logoVideoUrl from './logo2.mp4?url';
import preintroVideoUrl from './preintro_final.mp4?url';
import introVideoUrl from './intro.mp4?url';
import briefingVideoUrl from './brif1.mp4?url';
import preroomVideoUrl from './preroom.mp4?url';
import storyMusicUrl from './Tiptoeing_Paws.mp3?url';
import roomMusicUrl from './Buttons_and_Bowls.mp3?url';
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
const finishScreen = $('#finish-screen');
const parkScreen = $('#park-screen');
const shopScreen = $('#shop-screen');
const feedingScreen = $('#feeding-screen');
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
const foodDailyCost = $('#food-daily-cost');
const noseCleanerCost = $('#nose-cleaner-cost');
const budgetRequiredInput = $('#budget-required');
const budgetFunInput = $('#budget-fun');
const budgetSavingsInput = $('#budget-savings');
const budgetRequiredValue = $('#budget-required-value');
const budgetFunValue = $('#budget-fun-value');
const budgetSavingsValue = $('#budget-savings-value');
const budgetRequiredDaily = $('#budget-required-daily');
const budgetFunDaily = $('#budget-fun-daily');
const budgetSavingsDaily = $('#budget-savings-daily');
const approveBudgetButton = $('#approve-budget');
const budgetTutorialAudio = $('#budget-tutorial-audio');
const budgetTutorialLayer = $('#budget-tutorial-layer');
const budgetTutorialProgress = $('#budget-tutorial-progress');
const budgetTutorialText = $('#budget-tutorial-text');
const budgetTutorialBack = $('#budget-tutorial-back');
const budgetTutorialNext = $('#budget-tutorial-next');
const budgetTutorialSkip = $('#budget-tutorial-skip');
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
const feedingTutorialAudio = $('#feeding-tutorial-audio');
const dayTutorialAudio = $('#day-tutorial-audio');
const parkVoiceAudio = $('#park-voice-audio');
const piggyTutorialAudio = $('#piggy-tutorial-audio');

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
let messageVoicePlaying = false;
let shopTutorialVoicePlaying = false;
let mentorVoicePlaying = false;
let feedingTutorialVoicePlaying = false;
let dayTutorialVoicePlaying = false;
let parkVoicePlaying = false;
let piggyTutorialVoicePlaying = false;
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
  finishScreen.hidden = screen !== finishScreen;
  parkScreen.hidden = screen !== parkScreen;
  shopScreen.hidden = screen !== shopScreen;
  feedingScreen.hidden = screen !== feedingScreen;
  closeMentor();
}

function updateMusicFade() {
  const voicePlaying = tutorialVoicePlaying || briefingVoicePlaying || budgetTutorialVoicePlaying || messageVoicePlaying
    || shopTutorialVoicePlaying || mentorVoicePlaying || feedingTutorialVoicePlaying || dayTutorialVoicePlaying
    || parkVoicePlaying || piggyTutorialVoicePlaying;
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
  messageAudio.muted = muted;
  shopTutorialAudio.muted = muted;
  mentorAudio.muted = muted;
  feedingTutorialAudio.muted = muted;
  dayTutorialAudio.muted = muted;
  parkVoiceAudio.muted = muted;
  piggyTutorialAudio.muted = muted;
  updateBriefingVideoSubtitles();
  updatePreroomVideoSubtitles();
}

soundToggle.addEventListener('click', () => {
  const wasMuted = muted;
  muted = !muted;
  applyMuteState();
  if (wasMuted && !muted && !budgetTutorialLayer.classList.contains('is-hidden')) {
    playBudgetTutorialVoice(budgetTutorialSteps[budgetTutorialIndex]);
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
  } else if (wasMuted && !muted && shownParkLine) {
    playParkVoice(shownParkLine);
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
let roomReadyPromise = null;
let parkController = null;
let parkReadyPromise = null;
let parkRunId = 0;
let shopController = null;
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

function saveApprovedBudget(allocations, fundTotal) {
  const profileId = getUserProfileId();
  const budgetValue = {
    'Период в днях': 3,
    'Фонд к распределению': fundTotal,
    'Статьи бюджета': {
      [REQUIRED_ARTICLE]: allocations.required,
      'Веселье': allocations.fun,
      'Накопления на большую покупку': allocations.savings,
    },
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

roomStats.querySelectorAll('.room-stat-scale').forEach((scale) => {
  scale.replaceChildren(...Array.from({ length: STAT_MAX - STAT_MIN + 1 }, (_, index) => {
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
  const level = Math.max(STAT_MIN, Math.min(STAT_MAX, Math.round(value) || 0));
  const scale = stat.querySelector('.room-stat-scale');
  stat.querySelector('b').textContent = level > 0 ? `+${level}` : level < 0 ? `−${-level}` : '0';
  stat.dataset.trend = level > 0 ? 'up' : level < 0 ? 'down' : 'even';
  scale.setAttribute('aria-valuenow', String(level));
  [...scale.children].forEach((pip, index) => {
    const pipLevel = index + STAT_MIN;
    pip.classList.toggle('is-filled', pipLevel !== 0 && Math.sign(pipLevel) === Math.sign(level) && Math.abs(pipLevel) <= Math.abs(level));
  });
}

// `moodKey` names one of the manifest moods; by default the look follows hunger.
function applyMonsterLook(state, moodKey = state.hungry ? 'hungry' : 'neutral') {
  if (!manifest || !model) return;
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

  const mood = manifest.moods?.[moodKey];
  if (!mood) return;
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
  renderMessagesBadge(records);
  applyMonsterLook(state);
  if (roomController) roomController.name = state.name;
}

// The title of the data mart episode the park scene plays.
const PARK_EPISODE_TITLE = 'Прогулка в парке';
// An episode the player has left halfway invites them back instead of starting anew.
const ECONOMIC_EPISODE_RETURN_LABELS = {
  [PARK_EPISODE_TITLE]: 'Вернуться в парк',
};

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
  if (episode.title !== PARK_EPISODE_TITLE) {
    showRoomMessage(`Эпизод «${episode.title}» пока не подключён`);
    return;
  }
  recordEconomicEpisodeOpened(episode);
  enterPark(episode);
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
    if (store) enterShop(store);
    return;
  }
  if (action === 'feed') {
    startFeeding();
    return;
  }
  if (action === 'next') {
    const state = deriveRoomState(readProfileRecords(getUserProfileId()));
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
  const { day, savings } = deriveRoomState(readProfileRecords(profileId));
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
    && piggyTutorialLayer.classList.contains('is-hidden');
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
function startNextDay() {
  const profileId = getUserProfileId();
  const state = deriveRoomState(readProfileRecords(profileId));
  if (!isRoomInteractive() || !canFinishDay(state)) return;
  closeRoomAction();
  hideRoomMessage();
  startingNewDay = true;
  try {
    for (const record of newDayRecords(state, profileId)) appendProfileRecord(record);
  } finally {
    startingNewDay = false;
  }
  switchToDayMusic(state.day + 1);
  openRoomDay();
}

// The track of the day from the data mart, or the usual room track when the day has none.
function dayMusicSource(day) {
  const music = dayMusic(day);
  if (!music) return MUSIC_TRACKS.room;
  if (String(music.audio_folder ?? '').trim().toLowerCase() !== 'root') {
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

// A day in the room opens with its tutorial if the player has not seen it yet; messages come after it.
// A player who came home for the piggy bank gets its tutorial first, or the open piggy bank.
function openRoomDay() {
  if (maybeStartDayTutorial()) return;
  if (maybeStartPiggyTutorial()) return;
  openPendingSavingsTransfer();
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

// The mouth area of the face texture: its centre and half size, measured between the fangs
// (they stay painted) and below the eyes.
const MOUTH = { x: .5, y: .79, rx: .13, ry: .105 };
// How fast the mouth opens and closes while the monster speaks, and how fast the whole
// talking mouth appears and disappears.
const TALK_SPEED = 9.5;
const TALK_FADE = 9;
// The mouth is painted on the texture, so speaking is animated in the face shader.
const monsterTalk = { level: 0, fade: 0, phase: 0 };

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

function patchMaterial(material, furMask, overlay) {
  const uniforms = {
    petFurMask: { value: furMask },
    petHue: { value: 0 },
    petSaturation: { value: 1 },
    petValue: { value: 1 },
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
uniform sampler2D petOverlay;
uniform float petUseOverlay;
uniform float petTalk;
uniform float petTalkFade;
${HSV_GLSL}`)
      .replace('#include <map_fragment>', `#include <map_fragment>
{
  float fur = texture2D(petFurMask, vMapUv).r;
  diffuseColor.rgb = mix(diffuseColor.rgb, petAdjust(diffuseColor.rgb, petHue, petSaturation, petValue), fur);
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

function applyNeutralFace() {
  if (!manifest || !model) return;
  if (faceMaterial && faceOverlays.neutral) {
    faceMaterial.userData.pet.petOverlay.value = faceOverlays.neutral;
  }
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
  } else if (parkController?.active) {
    parkController.resize(width, height);
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
const FUN_ARTICLE = 'Веселье';
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

// Once the test has begun today, a player who comes back finds the monster at the kiosk.
function parkWalkStage(records, episode) {
  const tested = recordsOfToday(records, (record) => record['Тип события'] === EPISODE_EVENT
    && record['Содержание события'] === PARK_TEST_CONTENT
    && String(record['Идентификатор эпизода']) === String(episode.id));
  return tested ? 'kiosk' : 'court';
}

async function runParkWalk(episode, stage, runId) {
  const alive = () => runId === parkRunId && Boolean(parkController?.active);
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

function playParkVoice(line) {
  stopParkVoice();
  if (!line?.audio) return;

  parkVoiceAudio.src = publicAssetPath(line.audio_folder, line.audio, 'audio/park');
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

// Adds the changes to the monster's stats, one log record per stat that really moved
// (they stop at STAT_MIN…STAT_MAX), and returns what happened to each one.
function changeMonsterStats(changes, reason, extra = {}) {
  const profileId = getUserProfileId();
  const state = deriveRoomState(readProfileRecords(profileId));
  return Object.entries(changes).map(([key, requested]) => {
    const before = state.stats[key];
    const after = clampStat(before + requested);
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
  appendProfileRecord({
    'Тип события': ECONOMIC_EPISODE_COMPLETED_EVENT,
    'Профиль пользователя': profileId,
    'Идентификатор эпизода': episode.id,
    'Название эпизода': episode.title,
    'Результат': choice.title,
    'Правильное решение': choice.right,
    'Игровой день': state.day,
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

// --- The poster on the board: a new savings goal ---

// The monster's words by the board, and the goal the data mart opens on that game day.
const BOARD_LINE_TRIGGER = 'park-event-board';
const SAVINGS_GOAL_OBJECT_TYPE = 'Savings goal';
const SAVINGS_GOAL_EVENT = 'Появление крупной финансовой цели';

function savingsGoalOfDay(day) {
  const goals = dataMartRows.filter((row) => row?.object_type === SAVINGS_GOAL_OBJECT_TYPE);
  return goals.find((row) => Number(row.day_is_it_available) === day) ?? goals[0] ?? null;
}

const SAVINGS_GOAL_DECISION_EVENT = 'Решение по крупной финансовой цели';
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

function logSavingsGoalDecision(goal, episode, accepted) {
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
    'Игровой день': state.day,
  });
}

// The goal is written to the log once per profile, however often the park is visited.
function logSavingsGoal(goal, episode) {
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
    'Игровой день': deriveRoomState(records).day,
  });
  return true;
}

function showParkGoalToast(goal, accepted) {
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
  parkToasts.append(item);
  window.setTimeout(() => item.remove(), 5200);
}

// Still holding the racket, the monster runs to the event board and says out loud how it misses
// the crowd of monsters it grew up with in the shelter: the festival on the poster becomes the
// player's new big goal. False when the player has left the park meanwhile.
async function dreamOfTheFestival(episode, runId) {
  const alive = () => runId === parkRunId && Boolean(parkController?.active);
  if (!(await parkController.runTo('board')) || !alive()) return false;
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
  showParkGoalToast(goal, accepted);
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
async function enterRoom({ settleIn = false } = {}) {
  showOnlyScreen(finishScreen);
  closeRoomAction();
  closeRoomInbox();
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

    // On the very first arrival the icons stay deaf for a moment, so nothing gets tapped
    // by accident before the monster has anything to say.
    if (firstArrival) {
      setRoomActionsEnabled(false);
      await delay(ROOM_FIRST_ENTRY_PAUSE_SECONDS * 1000);
      setRoomActionsEnabled(true);
    }
    openRoomDay();
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
      const furMask = await loadTexture(settings.furMask, false);
      const overlay = material.name === 'Face' ? faceOverlays.neutral : null;
      patchMaterial(material, furMask, overlay);
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
      updateMonsterTalk(delta, parkVoicePlaying);
      mixer.update(delta);
      if (shopController?.active) {
        shopController.update(delta);
        shopController.render(renderer);
      } else if (pantryShelf?.active) {
        pantryShelf.update(delta);
        pantryShelf.render(renderer);
      } else if (feedingScale?.active) {
        feedingScale.update(delta);
        feedingScale.render(renderer);
      } else if (parkController?.active) {
        parkController.update(delta);
        parkController.render(renderer);
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

function renderBriefingStep() {
  const step = briefingSteps[briefingIndex];
  if (!step) return finishBriefing();

  const isFirst = briefingIndex === 0;
  const isLast = briefingIndex === briefingSteps.length - 1;
  briefingProgress.textContent = `ШАГ ${briefingIndex + 1} ИЗ ${briefingSteps.length}`;
  briefingText.textContent = String(step.text || '');
  briefingImage.src = publicAssetPath(step.image_folder, step.image, 'images');
  briefingImage.alt = `Иллюстрация к шагу ${briefingIndex + 1}`;
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
const mentorCloseButton = $('#mentor-close');
let mentorAfterClose = null;

function mentorReply(trigger, title) {
  const replies = dataMartRows.filter((row) => row?.object_type === MENTOR_OBJECT_TYPE && row.trigger === trigger);
  return replies.find((row) => row.title === title) ?? replies[0] ?? null;
}

function showMentor(trigger, { title = null, extra = '', closeLabel = '', afterClose = null } = {}) {
  const reply = mentorReply(trigger, title);
  if (!reply) console.warn(`В дата-марте нет реплики ментора «${trigger}» для «${title}».`);
  mentorText.textContent = reply?.text || MENTOR_FALLBACK_TEXT;
  mentorExtra.textContent = extra;
  mentorExtra.hidden = !extra;
  mentorCloseButton.innerHTML = closeLabel || 'Понятно <span aria-hidden="true">✓</span>';
  mentorAfterClose = afterClose;

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
  mentorLayer.hidden = true;
}

// The player pressed the button: the card closes and whatever waited for it happens.
function dismissMentor() {
  if (mentorLayer.hidden) return;
  const afterClose = mentorAfterClose;
  closeMentor();
  afterClose?.();
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

// Checked in data mart order: with several mistakes at once the mentor speaks about the first of them.
const BUDGET_MENTOR_RULES = [
  { trigger: 'budget-required-low', wrong: (plan) => plan.required < BUDGET_REQUIRED_MINIMUM },
  { trigger: 'budget-fun-low', wrong: (plan) => plan.fun <= BUDGET_MINIMUM_SHARE },
  { trigger: 'budget-savings-low', wrong: (plan) => plan.savings <= BUDGET_MINIMUM_SHARE },
];

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
  const steps = Array.isArray(dataMartRows)
    ? dataMartRows
      .filter((row) => row?.object_type === 'First budget tutorial')
      .sort((left, right) => Number(left.queue) - Number(right.queue))
    : [];
  budgetTutorialSteps = steps.length ? steps : fallbackBudgetTutorial;
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
  foodDailyCost.textContent = formatMoney(AVERAGE_FOOD_COST_PER_DAY);
  noseCleanerCost.textContent = formatMoney(AVERAGE_NOSE_CLEANER_COST);

  Object.entries(budgetInputs).forEach(([key, input]) => {
    input.max = String(Math.max(0, budgetFundTotal));
    input.value = String(budgetAllocations[key]);
    input.setAttribute('aria-valuetext', `${formatMoney(budgetAllocations[key])} на три дня`);
    budgetValueOutputs[key].value = formatMoney(budgetAllocations[key]);
    budgetDailyOutputs[key].textContent = `${formatMoney(budgetAllocations[key] / BUDGET_PERIOD_DAYS)}/день`;
  });

  approveBudgetButton.disabled = budgetApproved || budgetFundTotal <= 0 || remaining !== 0;
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
    .map((rule) => ({ trigger: rule.trigger, id: mentorReply(rule.trigger, BUDGET_MENTOR_TITLE)?.id ?? Infinity }))
    .sort((left, right) => left.id - right.id)[0].trigger;
}

function budgetDecisionExplanation(verdict, plan) {
  const food = AVERAGE_FOOD_COST_PER_DAY * BUDGET_PERIOD_DAYS;
  const written = `обязательные расходы — ${plan.required}, веселье — ${plan.fun}, накопления — ${plan.savings}`;
  if (!verdict) {
    return `Игрок распределил ${budgetFundTotal} монет: ${written}.`
      + ` Обязательные расходы закрыты полностью (корм на ${BUDGET_PERIOD_DAYS} дня — ${food} монет,`
      + ` прибор для козявок — ${AVERAGE_NOSE_CLEANER_COST}), и при этом осталось и на радости, и на накопления.`;
  }
  const reasons = {
    'budget-required-low': `На обязательные расходы выделено ${plan.required} монет вместо необходимых ${BUDGET_REQUIRED_MINIMUM}`
      + ` (корм на ${BUDGET_PERIOD_DAYS} дня — ${food}, прибор для козявок — ${AVERAGE_NOSE_CLEANER_COST}): монстрику не хватило бы еды.`,
    'budget-fun-low': `На веселье выделено ${plan.fun} монет. Умеренные траты на радость — часть здорового бюджета:`
      + ' моральное состояние монстрика так же важно, как сытость.',
    'budget-savings-low': `В накопления отложено ${plan.savings} монет. Без регулярных отчислений большая покупка не приблизится,`
      + ' а неожиданный расход будет нечем закрыть.',
  };
  return `Игрок попробовал утвердить бюджет: ${written}. ${reasons[verdict] ?? ''} Ментор не дал утвердить такой бюджет.`;
}

function logBudgetDecision(verdict, plan) {
  logDecision(!verdict, {
    episode: BUDGET_EPISODE_CONTENT,
    'Фонд к распределению': budgetFundTotal,
    'Статьи бюджета': {
      'Обязательные расходы': plan.required,
      'Веселье': plan.fun,
      'Накопления на большую покупку': plan.savings,
    },
    explanation: budgetDecisionExplanation(verdict, plan),
  });
}

function startBudgetFlow() {
  if (budgetFlowStarted) return;
  budgetFlowStarted = true;
  budgetApproved = false;
  finishBudgetTutorial();
  budgetFundTotal = FIRST_BUDGET_AMOUNT;
  budgetAllocations = { required: 0, fun: 0, savings: 0 };
  showOnlyScreen(budgetScreen);
  renderBudgetAllocation();
  loadBudgetTutorial();
  logEpisode(BUDGET_EPISODE_CONTENT);
  if (!budgetScreen.hidden) startBudgetTutorial();
}

approveBudgetButton.addEventListener('click', () => {
  const allocated = getAllocatedBudgetTotal();
  if (budgetApproved || budgetFundTotal <= 0 || allocated !== budgetFundTotal) return;

  const plan = { ...budgetAllocations };
  finishBudgetTutorial();

  // A learning game: a budget that would leave the monster hungry or joyless is not approved.
  const verdict = budgetMentorVerdict(plan);
  logBudgetDecision(verdict, plan);
  if (verdict) {
    showMentor(verdict, { title: BUDGET_MENTOR_TITLE, closeLabel: 'Исправлю <span aria-hidden="true">→</span>' });
    return;
  }

  budgetApproved = true;
  approveBudgetButton.disabled = true;
  saveApprovedBudget(plan, budgetFundTotal);
  showMentor('budget-approved', {
    title: BUDGET_MENTOR_TITLE,
    closeLabel: 'Забираю домой! <span aria-hidden="true">→</span>',
    afterClose: () => enterRoomAfterBudget(),
  });
});

window.addEventListener('resize', () => {
  if (!budgetTutorialLayer.classList.contains('is-hidden')) {
    positionBudgetTutorialFocus(budgetTutorialSteps[budgetTutorialIndex]?.screen_area);
  }
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
  const purchase = { item, quantity, total, portions, day };

  // A learning game: a choice that teaches the wrong lesson is stopped before any money moves.
  const verdict = shopMentorVerdict(item, quantity);
  if (verdict) {
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

  logShopDecision('approved', purchase);
  renderShopHud();
  closeShopInspection();
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

function shopDecisionExplanation(verdict, { item, quantity, total, portions }) {
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
  return `Игрок пытался купить ${attempt}. ${reasons[verdict] ?? ''} Ментор остановил покупку.`.replace('  ', ' ');
}

function logShopDecision(verdict, purchase) {
  const { item, quantity, total, day } = purchase;
  logDecision(verdict === 'approved', {
    episode: SHOP_EPISODE_CONTENT,
    'Магазин': activeShopStore?.title ?? null,
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
    const { day } = deriveRoomState(records);
    appendProfileRecord({
      'Тип события': SHOP_VISIT_EVENT,
      'Профиль пользователя': profileId,
      'Магазин': store.title,
      'Игровой день': day,
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
  appendProfileRecord({
    'Тип события': FEEDING_EVENT,
    'Профиль пользователя': profileId,
    'Насыпано, г': grams,
    'Корм': foods,
    'Игровой день': state.day,
  });
  for (const [itemId, taken] of feedingSession.taken) {
    if (taken <= 0) continue;
    appendProfileRecord({
      'Тип события': INVENTORY_CHANGE_EVENT,
      'Тип инвентаря': itemId,
      'Количество': -taken,
      'Единица измерения': INVENTORY_UNIT_GRAMS,
      'Профиль пользователя': profileId,
    });
  }
  if (state.hungry && !deriveRoomState(readProfileRecords(profileId)).hungry) {
    appendProfileRecord({
      'Тип события': MONSTER_STATE_EVENT,
      'Профиль пользователя': profileId,
      'Состояние': 'Сытость',
      'Было': 'Голодный',
      'Стало': 'Сытый',
      'Игровой день': state.day,
    });
  }
  renderScalePanelFromScale();
  showMentor('feeding-approved', {
    title: FEEDING_MENTOR_TITLE,
    extra: `В миске ${grams} г — как раз дневная порция`,
    closeLabel: FEEDING_MENTOR_CLOSE_LABELS['feeding-approved'],
    afterClose: () => leaveFeeding({ served: grams }),
  });
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
  if (params.get('screen') === 'feeding') {
    enterFeeding();
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
  if (params.get('screen') === 'budget') {
    finishName.textContent = 'Бублик';
    startBudgetFlow();
    return;
  }

  backgroundMusic.volume = 0;
  showStartGate();
}

boot();
