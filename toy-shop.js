import * as THREE from 'three';
import dataMartRows from './monster_data_mart_rows.json';

export const TOY_STORE_ID = 313;
export const TOY_STORE_TITLE = 'Магазин игрушек';
export const TOY_EPISODE = 'Выбор игрушки по возрасту, реальной пользе и цене под давлением рекламы и просьб монстрика.';
// The purchase record lives in room-state.js, which the day's end trigger reads.
export { TOY_PURCHASE_EVENT } from './room-state.js';
export const TOY_CAPSULE_EVENT = 'Покупка сюрприз-бокса';
export const TOY_TUTORIAL_EVENT = 'Просмотр туториала магазина игрушек';
export const TOY_STORE_ITEM_TYPE = 'Item from the toy store';

const toyRows = dataMartRows
  .filter((row) => row?.object_type === TOY_STORE_ITEM_TYPE && Number(row.store_id) === TOY_STORE_ID)
  .sort((left, right) => Number(left.id) - Number(right.id));
export const TOY_CAPSULE_ITEM = toyRows.find((row) => row.toy_key === 'capsule');
if (!TOY_CAPSULE_ITEM || toyRows.length !== 36) throw new Error(`В дата-марте должно быть 36 товаров магазина игрушек (найдено ${toyRows.length}, капсула: ${Boolean(TOY_CAPSULE_ITEM)}).`);

// Merchandising copy, art, prices, age marks and outcomes all come from the data mart.
// toy_key remains a stable UI key; martId is the numeric inventory/purchase identifier.
export const TOYS = toyRows.filter((row) => !row.is_capsule).map((row) => ({
  id: row.toy_key,
  martId: Number(row.id),
  title: row.title,
  zone: row.toy_zone,
  price: Number(row.price),
  oldPrice: row.old_price == null ? null : Number(row.old_price),
  age: row.age_mark,
  slogan: row.text,
  fact: row.fact_text,
  fine: row.fine_print,
  mood: Number(row.mood_change) || 0,
  development: Number(row.development_change) || 0,
  image: row.front_image_on_the_packaging,
  imageFolder: row.image_folder,
  availableFromDay: Number(row.day_is_it_available) || 1,
  unsuitable: row.unsuitable_reason || null,
  dirty: Boolean(row.dirty_on_play),
}));

export function isToyAvailable(toy, day) { return Boolean(toy) && day >= toy.availableFromDay; }
export function toysAvailableOnDay(day) { return TOYS.filter((toy) => isToyAvailable(toy, day)); }

export const CAPSULE_PRICE = Number(TOY_CAPSULE_ITEM.price);
export const MINI_MONSTERS = ['Теннисист', 'Художник', 'Соня', 'Путешественник', 'Музыкант', 'Изобретатель'];
export const MINI_MONSTER_IMAGES = {
  Теннисист: 'tennis.png', Художник: 'mini-artist.png', Соня: 'mini-sleeper.png',
  Путешественник: 'mini-traveler.png', Музыкант: 'mini-musician.png', Изобретатель: 'mini-inventor.png',
};

export function toyById(id) { return TOYS.find((toy) => toy.id === id) ?? null; }
export function toyCartTotal(ids) { return ids.reduce((sum, id) => sum + (toyById(id)?.price ?? 0), 0); }
export function toyVerdict(ids) {
  for (const id of ids) {
    const toy = toyById(id);
    if (toy?.unsuitable) return { kind: toy.unsuitable, toy };
  }
  return null;
}
export function nextMiniMonster(spins) {
  // The second capsule repeats the first. The result is stable across reloads because
  // every spin is logged, including spins made on an earlier visit.
  return spins < 2 ? MINI_MONSTERS[0] : MINI_MONSTERS[(spins * 3 + 2) % MINI_MONSTERS.length];
}

// Uses the very same model and mixer as the room, preserving the player's colour and condition.
export class ToyCompanion {
  constructor(monster, mixer, animations) {
    this.monster = monster;
    this.mixer = mixer;
    this.animations = animations ?? [];
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x9db2a4, 2.5));
    const sun = new THREE.DirectionalLight(0xffe8bd, 2.8);
    sun.position.set(2, 4, 4);
    this.scene.add(sun);
    this.camera = new THREE.PerspectiveCamera(32, 1, 0.1, 20);
    this.camera.position.set(0, 1.25, 3.05);
    this.camera.lookAt(0, 0.9, 0);
    this.active = false;
    this.time = 0;
  }
  enter() {
    if (this.active) return;
    this.saved = { parent: this.monster.parent, position: this.monster.position.clone(), quaternion: this.monster.quaternion.clone(), scale: this.monster.scale.clone() };
    this.monster.removeFromParent();
    this.scene.add(this.monster);
    this.monster.position.set(0, 0, 0);
    this.monster.quaternion.identity();
    this.monster.scale.copy(this.saved.scale);
    this.monster.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(this.monster);
    this.monster.scale.multiplyScalar(1.65 / Math.max(0.01, box.max.y - box.min.y));
    this.monster.updateMatrixWorld(true);
    this.monster.position.y -= new THREE.Box3().setFromObject(this.monster).min.y;
    this.active = true;
    this.play('Walking', 'Thoughtful_Walk');
  }
  play(primary, fallback = 'restpose') {
    if (!this.active) return;
    const clip = this.animations.find((item) => item.name === primary)
      ?? this.animations.find((item) => item.name === fallback)
      ?? this.animations[0];
    if (!clip) return;
    this.mixer.stopAllAction();
    this.mixer.clipAction(clip).reset().setLoop(THREE.LoopRepeat, Infinity).play();
  }
  resize(width, height) {
    if (!width || !height) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
  update(delta) {
    this.time += delta;
    this.monster.rotation.y = Math.sin(this.time * 0.7) * 0.12;
  }
  render(renderer) {
    renderer.setClearColor(0x000000, 0);
    renderer.render(this.scene, this.camera);
  }
  exit() {
    if (!this.active) return;
    this.active = false;
    this.mixer.stopAllAction();
    this.monster.removeFromParent();
    if (this.saved.parent) this.saved.parent.add(this.monster);
    this.monster.position.copy(this.saved.position);
    this.monster.quaternion.copy(this.saved.quaternion);
    this.monster.scale.copy(this.saved.scale);
  }
}
