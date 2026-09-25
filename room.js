import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { bowlInterior, Kibble } from './kibble.js';
import { createTalkingMouth } from './talking-mouth.js';
import { RoomNav } from './room-nav.js';
import { PoseKit, buildRoomClips, eatPose } from './room-poses.js';

const FLOOR_Y = 0;
// How tall the child's body stands in the room, without the mood props over its head; the baby and
// the teen are the manifest's age height times this.
const MONSTER_ROOM_HEIGHT = 0.96;
const FATHER_HEIGHT = 1.78;
// He stands just in front of the stool instead of intersecting it; positive Z is closer to camera.
const FATHER_SPOT = [1.05, 0, 0.72];
// The monster walks around him while he is in the room.
const FATHER_RADIUS = 0.3;
const FATHER_RACKET_LENGTH = 0.92;
const FATHER_RACKET_GRIP = 0.14;
// Point the racket away from his face while keeping the grip aligned with the raised right hand.
const FATHER_RACKET_TILT = new THREE.Euler(0.18, -0.08, 0.48);
// How fast he gestures while talking, by the mood of his line.
const FATHER_TALK_SPEED = { angry: 1.16, worried: 1.08, happy: 0.92, grateful: 0.9 };
// His mouth is only painted on the texture, so while he talks an open mouth is drawn over it
// (see talking-mouth.js): the place between his lips in the model's own coordinates.
const FATHER_MOUTH = { x: 0.0, y: 1.503, rx: 0.02, ry: 0.011, frontZ: 0.07 };

// `walkable: false` keeps the monster off even the low parts of a model.
const ASSETS = [
  {
    id: 'wardrobe',
    url: '/room/models/wardrobe.glb',
    position: [-1.78, 0, -0.62],
    rotationY: Math.PI / 2,
    height: 1.62,
  },
  {
    id: 'climber',
    url: '/room/models/climbing-tower.glb',
    position: [0.15, 0, -1.62],
    rotationY: 0,
    height: 1.58,
  },
  {
    id: 'bed',
    url: '/room/models/nest-bed.glb',
    // Big enough for the teen to curl up inside, pushed back to clear the wardrobe.
    position: [-1.02, 0, -1.6],
    rotationY: 0,
    footprint: 1.28,
    walkable: false,
  },
  {
    id: 'bench',
    url: '/room/models/storage-bench.glb',
    position: [1.08, 0, -1.72],
    rotationY: 0,
    footprint: 1.2,
  },
  {
    id: 'stool',
    url: '/room/models/stool.glb',
    // Close enough to the desk for the monster to draw from it.
    position: [1.15, 0, 0.08],
    rotationY: 0,
    footprint: 0.52,
  },
  {
    id: 'bowl',
    url: '/room/models/feeding-bowl.glb',
    position: [-1.36, 0.015, 1.08],
    rotationY: 0,
    footprint: 0.56,
    walkable: false,
  },
  {
    id: 'rug',
    url: '/room/models/paw-rug.glb',
    position: [0, 0.012, 0.22],
    rotationY: 0,
    footprint: 1.86,
    rotationX: -Math.PI / 2,
  },
  {
    id: 'lamp',
    url: '/room/models/cloud-lamp.glb',
    position: [0, 2.42, -0.12],
    rotationY: 0,
    height: 0.84,
    nav: false,
  },
];

// Where the monster may walk: inside the walls, and not so close to the camera that it leaves the
// picture.
const WALK_AREA = { minX: -2.6, maxX: 2.6, minZ: -2.36, maxZ: 1.72 };
// Random strolls stay in the middle of the room.
const STROLL_AREA = { minX: -1.3, maxX: 1.7, minZ: -0.85, maxZ: 1.35 };

// Surfaces of the furniture, measured on the models as they stand in the room.
// The nest, measured on the model at a footprint of 1.18 m, from its centre: the cushion inside, the
// spot on it without the roof overhead where the monster lands, where it lies down further in under
// the roof, and the front rim.
const BED_MEASURED = { footprint: 1.18, cushion: 0.3, insideZ: 0.36, sleepZ: 0.06, rimZ: 0.58 };
const BED_CONFIG = ASSETS.find((asset) => asset.id === 'bed');
const BED_SCALE = BED_CONFIG.footprint / BED_MEASURED.footprint;
const BED = {
  cushion: BED_MEASURED.cushion * BED_SCALE,
  inside: [BED_CONFIG.position[0], BED_CONFIG.position[2] + BED_MEASURED.insideZ * BED_SCALE],
  sleepZ: BED_CONFIG.position[2] + BED_MEASURED.sleepZ * BED_SCALE,
  rimZ: BED_CONFIG.position[2] + BED_MEASURED.rimZ * BED_SCALE,
  // Lying diagonally, head back in the nest and feet towards its mouth, a big monster fits too.
  sleepHeading: 0.42,
};
const CLIMBER = {
  // The ladder of shelves is climbed at this x, in front of their front edges.
  x: 0.19,
  frontZ: -1.23,
  // The top shelf: its height and the middle of it.
  top: 1.58,
  topSpot: [0.21, -1.53],
  // It climbs half turned to the camera, so one side of it shows.
  heading: Math.PI - 0.32,
};
const BENCH = { seat: 0.365, frontZ: -1.48, backZ: -1.84, x: 1.08 };
const STOOL = { seat: 0.4, radius: 0.26 };
const DESK = { position: [1.82, 0, 0.16], frontX: 1.51 };
// Bodies up to this tall stand on the stool to draw; taller ones sit on it.
const STAND_TO_DRAW_HEIGHT = 0.85;

const TASKS = [
  { id: 'bowl-check', weight: 1.0 },
  { id: 'nap', weight: 0.9 },
  { id: 'climb', weight: 1.05 },
  { id: 'draw', weight: 0.85 },
  { id: 'bench', weight: 0.75 },
  { id: 'toys', weight: 0.85 },
  { id: 'dance', weight: 1.1 },
];
export const ROOM_TASK_IDS = [...TASKS.map((task) => task.id), 'wander', 'meal'];

const MEAL_DURATION = 7;
// The kibble in the room bowl has the same size relative to the bowl as on the kitchen scale.
const BOWL_KIBBLE_SIZE = 0.034;
const BOWL_KIBBLE_CAPACITY = 80;
// The monster faces its bowl from this side (a unit vector from the bowl towards the monster): from
// the room, turned a little away from the camera so its face shows.
const EAT_SIDE = new THREE.Vector2(0.93, -0.36).normalize();
const CONDITION_TASK_ID = 'condition-mood';

const WALK_SPEED = 0.48;
const RUN_SPEED = 1.05;
const CLIMB_SPEED = 0.34;
// How fast the monster turns on the spot, radians per second.
const TURN_SPEED = 4.2;

function makeMaterial(color, roughness = 0.82) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
}

function setTexture(texture, repeatX, repeatY) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = 4;
  return texture;
}

function weightedTask(previousId) {
  const candidates = TASKS.filter((task) => task.id !== previousId);
  const total = candidates.reduce((sum, task) => sum + task.weight, 0);
  let pick = Math.random() * total;
  for (const task of candidates) {
    pick -= task.weight;
    if (pick <= 0) return task;
  }
  return candidates[candidates.length - 1];
}

function shortestAngle(from, to) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

// The heading that faces from one point of the floor to another (0 faces +Z, the camera).
function headingTo(fromX, fromZ, toX, toZ) {
  return Math.atan2(toX - fromX, toZ - fromZ);
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

// The racket asset lies diagonally in its box. Stand it on the end of its handle and make that
// point the pivot, so it can follow the father's right hand without modifying his skeleton.
function uprightFatherRacket(model) {
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const axis = new THREE.Vector2(box.max.x - box.min.x, box.max.y - box.min.y);
  const length = Math.max(0.001, axis.length());
  model.position.x -= box.min.x;
  model.position.y -= box.min.y;
  model.position.z -= (box.min.z + box.max.z) / 2;
  const turn = new THREE.Group();
  turn.rotation.z = Math.atan2(axis.x, axis.y);
  turn.add(model);
  const pivot = new THREE.Group();
  pivot.add(turn);
  turn.position.y = -FATHER_RACKET_GRIP * length;
  pivot.scale.setScalar(FATHER_RACKET_LENGTH / length);
  return pivot;
}

// A picture on a canvas, for the sleepy Z and the toy ball.
function canvasTexture(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Z letters rising from the sleeping monster's head.
class SleepyZ {
  constructor(scene) {
    const texture = canvasTexture(128, 128, (context) => {
      context.font = '900 104px "Trebuchet MS", system-ui, sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.lineWidth = 14;
      context.strokeStyle = '#ffffff';
      context.strokeText('Z', 64, 68);
      context.fillStyle = '#7a5be0';
      context.fillText('Z', 64, 68);
    });
    this.sprites = [0, 1, 2].map(() => {
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
      sprite.visible = false;
      sprite.renderOrder = 5;
      scene.add(sprite);
      return sprite;
    });
    this.time = 0;
    this.active = false;
  }

  update(dt, anchor, size) {
    this.time += dt;
    this.sprites.forEach((sprite, index) => {
      if (!this.active) {
        sprite.visible = false;
        return;
      }
      const t = (this.time / 2.6 + index / 3) % 1;
      sprite.visible = true;
      sprite.position.set(anchor.x + t * 0.22 * size, anchor.y + t * 0.5 * size, anchor.z + t * 0.05);
      sprite.scale.setScalar((0.07 + t * 0.12) * size);
      sprite.material.opacity = Math.min(1, t * 5) * (1 - t);
    });
  }
}

export class MonsterRoom {
  constructor({ monster, mixer, animations, onStatus, onLoadProgress }) {
    this.monster = monster;
    this.mixer = mixer;
    this.ageHeight = 1;
    // The monster arrives in its rest pose; the room measures it in that pose, whatever clip is on.
    this.restPose = [];
    monster.traverse((object) => {
      if (object.isBone) this.restPose.push([object, object.position.clone(), object.quaternion.clone()]);
    });
    this.animations = animations || [];
    this.poseKit = new PoseKit(monster, this.animations, this.restPose);
    this.roomClips = null;
    this.onStatus = onStatus || (() => {});
    this.onLoadProgress = onLoadProgress || (() => {});
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xcff4f2);
    this.scene.fog = new THREE.Fog(0xcff4f2, 10, 20);
    this.camera = new THREE.PerspectiveCamera(46, 9 / 16, 0.1, 40);
    this.cameraHomePosition = new THREE.Vector3();
    this.cameraHomeLookAt = new THREE.Vector3(0, 0.78, -0.08);
    this.cameraTargetPosition = new THREE.Vector3();
    this.cameraTargetLookAt = this.cameraHomeLookAt.clone();
    this.cameraLookAt = this.cameraHomeLookAt.clone();
    this.cameraMode = 'home';
    this.loader = new GLTFLoader();
    this.assets = new Map();
    this.nav = new RoomNav(WALK_AREA);
    this.active = false;
    this.ready = false;
    this.initializing = null;
    this.name = 'Монстрик';
    this.currentAction = null;
    this.conditionMood = null;
    this.previousTaskId = null;
    // 'waiting' | 'script' (doing the steps of a task) | 'waving' | 'held'.
    this.phase = 'waiting';
    this.script = null;
    this.step = null;
    this.pending = null;
    // Where the monster is when it is not on the floor, and how it gets down from there.
    this.stance = null;
    this.resumeAfterWave = null;
    this.waveDuration = 2.8;
    this.phaseTime = 0;
    this.savedTransform = null;
    // Height of the monster's origin over the surface it stands on, and that surface.
    this.footOffset = 0;
    this.support = 0;
    this.body = { height: 1, radius: 0.25, front: 0.28, back: 0.2 };
    this.snout = new THREE.Vector3();
    this.eatBend = 0.7;
    this.chewing = false;
    this.glowTime = 0;
    this.lampLight = null;
    this.bowlKibble = null;
    this.meal = null;
    this.paper = null;
    this.toy = null;
    this.sleepyZ = new SleepyZ(this.scene);
    this.debug = null;
    this.fatherLoading = null;
    this.fatherGroup = null;
    this.fatherMixer = null;
    this.fatherAnimations = [];
    this.fatherAction = null;
    this.fatherMouth = createTalkingMouth(FATHER_MOUTH);
    this.fatherTalking = false;
    this.fatherHand = null;
    this.fatherRacket = null;
    this.fatherRacketQuaternion = new THREE.Quaternion();
    this.fatherRacketOffset = new THREE.Vector3();
    this.tmpVector = new THREE.Vector3();
    this.tmpVector2 = new THREE.Vector3();
    // A short turn on the spot at the start of an action or a wave, instead of a snap.
    this.turnTween = null;
  }

  initialize() {
    if (this.initializing) return this.initializing;
    this.initializing = this.build();
    return this.initializing;
  }

  async build() {
    this.onLoadProgress('Готовим стены и мягкий пол…');
    await this.buildShell();
    this.buildLighting();
    this.buildDesk();
    this.buildDecor();
    this.buildToy();

    let loaded = 0;
    await Promise.all(ASSETS.map(async (config) => {
      const object = await this.loadAsset(config);
      this.assets.set(config.id, object);
      loaded += 1;
      this.onLoadProgress(`Расставляем мебель: ${loaded} из ${ASSETS.length}`);
    }));
    for (const config of ASSETS) {
      if (config.nav !== false) this.nav.addObject(this.assets.get(config.id), { walkable: config.walkable !== false });
    }
    this.nav.addObject(this.assets.get('desk'));
    this.nav.build();
    this.ready = true;
    this.onLoadProgress('Комната готова');
    return this;
  }

  async buildShell() {
    const textureLoader = new THREE.TextureLoader();
    const [floorTexture, wallTexture, ceilingTexture] = await Promise.all([
      textureLoader.loadAsync('/room/textures/floor-birch-planks-basecolor.png'),
      textureLoader.loadAsync('/room/textures/wall-mint-plaster-basecolor.png'),
      textureLoader.loadAsync('/room/textures/ceiling-warm-cream-plaster-basecolor.png'),
    ]);
    setTexture(floorTexture, 2.8, 4.8);
    setTexture(wallTexture, 2.4, 1.65);
    setTexture(ceilingTexture, 2.4, 2.1);

    const floorMaterial = new THREE.MeshStandardMaterial({ map: floorTexture, roughness: 0.76 });
    const wallMaterial = new THREE.MeshStandardMaterial({ map: wallTexture, roughness: 0.9 });
    const ceilingMaterial = new THREE.MeshStandardMaterial({ map: ceilingTexture, roughness: 0.94 });

    const floor = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.12, 9.8), floorMaterial);
    floor.position.set(0, -0.06, 2.42);
    floor.receiveShadow = true;
    this.scene.add(floor);

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(5.6, 3.2, 0.12), wallMaterial);
    backWall.position.set(0, 1.6, -2.48);
    backWall.receiveShadow = true;
    this.scene.add(backWall);

    for (const x of [-2.74, 2.74]) {
      const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.2, 4.8), wallMaterial);
      sideWall.position.set(x, 1.6, -0.08);
      sideWall.receiveShadow = true;
      this.scene.add(sideWall);
    }

    const ceiling = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.08, 4.8), ceilingMaterial);
    ceiling.position.set(0, 3.2, -0.08);
    ceiling.receiveShadow = true;
    this.scene.add(ceiling);

    const baseboardMaterial = makeMaterial(0xf5ca72, 0.72);
    const backBaseboard = new THREE.Mesh(new THREE.BoxGeometry(5.45, 0.11, 0.08), baseboardMaterial);
    backBaseboard.position.set(0, 0.11, -2.4);
    this.scene.add(backBaseboard);
    for (const x of [-2.65, 2.65]) {
      const sideBaseboard = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.11, 4.62), baseboardMaterial);
      sideBaseboard.position.set(x, 0.11, -0.03);
      this.scene.add(sideBaseboard);
    }
  }

  buildLighting() {
    this.scene.add(new THREE.HemisphereLight(0xfff8e8, 0x6c83a5, 2.25));

    const daylight = new THREE.DirectionalLight(0xfff4db, 3.1);
    daylight.position.set(-4.2, 6.2, 5.5);
    daylight.castShadow = true;
    daylight.shadow.mapSize.set(1024, 1024);
    daylight.shadow.camera.left = -4;
    daylight.shadow.camera.right = 4;
    daylight.shadow.camera.top = 4;
    daylight.shadow.camera.bottom = -4;
    daylight.shadow.camera.near = 1;
    daylight.shadow.camera.far = 16;
    daylight.shadow.bias = -0.0003;
    this.scene.add(daylight);

    this.lampLight = new THREE.PointLight(0xffd27a, 1.75, 7, 1.7);
    this.lampLight.position.set(0, 2.43, -0.08);
    this.scene.add(this.lampLight);

    const fill = new THREE.DirectionalLight(0xb6f4ff, 1.0);
    fill.position.set(4.5, 2.8, 3.5);
    this.scene.add(fill);
  }

  buildDesk() {
    const desk = new THREE.Group();
    desk.name = 'creative-desk';
    const wood = makeMaterial(0xf3c574, 0.72);
    const aqua = makeMaterial(0x49cfc5, 0.58);
    const coral = makeMaterial(0xff7b72, 0.62);

    const top = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.1, 1.14), wood);
    top.position.set(0, 0.76, 0);
    top.castShadow = true;
    top.receiveShadow = true;
    desk.add(top);

    for (const z of [-0.46, 0.46]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 0.72, 16), wood);
      leg.position.set(-0.2, 0.36, z);
      leg.castShadow = true;
      desk.add(leg);
    }

    const drawer = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.24, 0.86), aqua);
    drawer.position.set(0.17, 0.62, 0);
    drawer.castShadow = true;
    desk.add(drawer);

    // The pencils lie aside, out of the way of the drawing hand.
    for (const [index, color] of [0xff5e75, 0xffd44b, 0x6d6bf2].entries()) {
      const pencil = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.34, 10), makeMaterial(color, 0.45));
      pencil.rotation.z = Math.PI / 2;
      pencil.position.set(0.02, 0.83, 0.3 + index * 0.075);
      pencil.castShadow = true;
      desk.add(pencil);
    }

    // The sheet lies at the front edge, where the monster on the stool reaches it; what it draws
    // appears on it stroke by stroke.
    this.paper = { canvas: document.createElement('canvas'), strokes: 0, pen: null, color: 0 };
    this.paper.canvas.width = 256;
    this.paper.canvas.height = 320;
    this.paper.texture = new THREE.CanvasTexture(this.paper.canvas);
    this.paper.texture.colorSpace = THREE.SRGBColorSpace;
    this.clearPaper();
    const paperMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, map: this.paper.texture, roughness: 0.9 });
    const sheetSides = makeMaterial(0xfffbef, 0.9);
    const paper = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.012, 0.44), [sheetSides, sheetSides, paperMaterial, sheetSides, sheetSides, sheetSides]);
    paper.position.set(-0.13, 0.816, -0.06);
    paper.rotation.y = Math.PI / 2 - 0.12;
    desk.add(paper);

    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), coral);
    knob.position.set(-0.135, 0.63, 0);
    desk.add(knob);

    desk.position.fromArray(DESK.position);
    this.scene.add(desk);
    this.assets.set('desk', desk);
  }

  clearPaper() {
    const context = this.paper.canvas.getContext('2d');
    context.fillStyle = '#fffbef';
    context.fillRect(0, 0, this.paper.canvas.width, this.paper.canvas.height);
    this.paper.strokes = 0;
    this.paper.pen = null;
    this.paper.texture.needsUpdate = true;
  }

  // One more short stroke of the monster's drawing, in one of the pencils' colours.
  drawStroke() {
    const paper = this.paper;
    const { width, height } = paper.canvas;
    const context = paper.canvas.getContext('2d');
    const colors = ['#ff5e75', '#ffb300', '#6d6bf2', '#2dc4a4'];
    if (!paper.pen || Math.random() < 0.12) {
      paper.pen = { x: width * (0.2 + Math.random() * 0.6), y: height * (0.2 + Math.random() * 0.6), angle: Math.random() * Math.PI * 2 };
      paper.color = (paper.color + 1) % colors.length;
    }
    const pen = paper.pen;
    context.strokeStyle = colors[paper.color];
    context.lineWidth = 7;
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(pen.x, pen.y);
    pen.angle += (Math.random() - 0.35) * 1.4;
    pen.x = THREE.MathUtils.clamp(pen.x + Math.cos(pen.angle) * 16, 20, width - 20);
    pen.y = THREE.MathUtils.clamp(pen.y + Math.sin(pen.angle) * 16, 20, height - 20);
    context.lineTo(pen.x, pen.y);
    context.stroke();
    paper.strokes += 1;
    paper.texture.needsUpdate = true;
  }

  buildDecor() {
    const colors = [0xffce4f, 0xff7a70, 0x68d7cb, 0x9a6de0];
    const positions = [
      [-1.0, 2.55, -2.405],
      [-0.72, 2.28, -2.405],
      [0.83, 2.5, -2.405],
      [1.15, 2.2, -2.405],
    ];
    positions.forEach(([x, y, z], index) => {
      const star = new THREE.Mesh(new THREE.CircleGeometry(index % 2 ? 0.09 : 0.13, 5), makeMaterial(colors[index], 0.55));
      star.position.set(x, y, z);
      star.rotation.z = index * 0.35;
      this.scene.add(star);
    });

    const bunting = new THREE.Group();
    for (let index = 0; index < 7; index += 1) {
      const flag = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 3), makeMaterial(colors[index % colors.length], 0.6));
      flag.position.set(-0.72 + index * 0.24, 0, 0);
      flag.rotation.z = Math.PI;
      bunting.add(flag);
    }
    bunting.position.set(-0.72, 2.88, -2.39);
    this.scene.add(bunting);
  }

  // The ball the monster finds in the bench's drawers.
  buildToy() {
    const texture = canvasTexture(128, 64, (context, width, height) => {
      const stripes = ['#ff6f61', '#ffd24a', '#49cfc5', '#8f50e8'];
      stripes.forEach((color, index) => {
        context.fillStyle = color;
        context.fillRect((index * width) / stripes.length, 0, width / stripes.length + 1, height);
      });
    });
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(1, 24, 16),
      new THREE.MeshStandardMaterial({ map: texture, roughness: 0.45 }),
    );
    ball.castShadow = true;
    ball.visible = false;
    ball.name = 'room-toy-ball';
    this.scene.add(ball);
    this.toy = { mesh: ball, mode: 'hidden', spin: 0 };
  }

  async loadAsset(config) {
    const gltf = await this.loader.loadAsync(config.url);
    const source = gltf.scene;
    source.rotation.x = config.rotationX || 0;
    source.updateMatrixWorld(true);
    const firstBox = new THREE.Box3().setFromObject(source);
    const firstSize = firstBox.getSize(new THREE.Vector3());
    const horizontal = Math.max(firstSize.x, firstSize.z) || 1;
    const scalar = config.height ? config.height / (firstSize.y || 1) : config.footprint / horizontal;
    source.scale.multiplyScalar(scalar);
    source.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(source);
    const center = box.getCenter(new THREE.Vector3());
    source.position.x -= center.x;
    source.position.z -= center.z;
    source.position.y -= box.min.y;
    source.updateMatrixWorld(true);
    source.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = config.id !== 'rug';
      child.receiveShadow = true;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        if (material?.map) material.map.colorSpace = THREE.SRGBColorSpace;
        if (material) material.roughness = Math.max(material.roughness ?? 0.6, 0.42);
      }
    });

    const wrapper = new THREE.Group();
    wrapper.name = `room-${config.id}`;
    wrapper.position.fromArray(config.position);
    wrapper.rotation.y = config.rotationY || 0;
    wrapper.add(source);
    this.scene.add(wrapper);
    return wrapper;
  }

  initializeFather() {
    if (this.fatherLoading) return this.fatherLoading;
    this.fatherLoading = this.loadFather();
    return this.fatherLoading;
  }

  async loadFather() {
    const [fatherGltf, racketGltf] = await Promise.all([
      this.loader.loadAsync('/room/models/phather.glb'),
      this.loader.loadAsync('/park/models/tennis_racket.glb'),
    ]);
    const father = fatherGltf.scene;
    father.updateMatrixWorld(true);
    const firstBox = new THREE.Box3().setFromObject(father);
    father.scale.multiplyScalar(FATHER_HEIGHT / Math.max(0.001, firstBox.max.y - firstBox.min.y));
    father.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(father);
    const center = box.getCenter(new THREE.Vector3());
    father.position.set(-center.x, -box.min.y, -center.z);
    father.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        if (material?.map) material.map.colorSpace = THREE.SRGBColorSpace;
      }
    });

    this.fatherGroup = new THREE.Group();
    this.fatherGroup.name = 'room-father';
    this.fatherGroup.position.fromArray(FATHER_SPOT);
    this.fatherGroup.rotation.y = -0.08;
    this.fatherGroup.visible = false;
    this.fatherGroup.add(father);
    this.scene.add(this.fatherGroup);
    this.fatherAnimations = fatherGltf.animations || [];
    this.fatherMixer = new THREE.AnimationMixer(father);
    father.traverse((child) => {
      if (child.isSkinnedMesh) this.fatherMouth.paint(child.material);
    });
    this.fatherHand = father.getObjectByName('mixamorigRightHand');

    const racketModel = racketGltf.scene;
    racketModel.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        if (material?.map) material.map.colorSpace = THREE.SRGBColorSpace;
      }
    });
    this.fatherRacket = uprightFatherRacket(racketModel);
    this.fatherRacket.name = 'father-tennis-racket';
    this.fatherRacket.visible = false;
    this.scene.add(this.fatherRacket);
    return this.fatherGroup;
  }

  playFatherMood(mood = 'angry') {
    if (!this.fatherMixer) return;
    const preferred = mood === 'idle' ? ['Idle_4', 'restpose'] : ['Talk_Passionately', 'Idle_4'];
    const clip = preferred.map((name) => this.fatherAnimations.find((item) => item.name === name)).find(Boolean)
      || this.fatherAnimations[0];
    if (!clip) return;
    const next = this.fatherMixer.clipAction(clip);
    next.reset();
    next.enabled = true;
    next.setEffectiveWeight(1);
    next.setEffectiveTimeScale(FATHER_TALK_SPEED[mood] ?? 1);
    next.setLoop(THREE.LoopRepeat, Infinity);
    next.play();
    if (this.fatherAction && this.fatherAction !== next) this.fatherAction.crossFadeTo(next, 0.24, false);
    this.fatherAction = next;
  }

  // `racket`: he comes in with the tennis racket from the park; other visits leave it out.
  async showFather(mood = 'angry', { racket = true } = {}) {
    if (!this.active) return false;
    await this.initializeFather();
    if (!this.active || !this.fatherGroup) return false;
    this.fatherGroup.visible = true;
    this.nav.dynamic = [{ x: FATHER_SPOT[0], z: FATHER_SPOT[2], radius: FATHER_RADIUS }];
    if (this.fatherRacket) this.fatherRacket.visible = racket;
    this.playFatherMood(mood);
    this.updateFatherRacket();
    return true;
  }

  setFatherMood(mood) {
    if (!this.fatherGroup?.visible) return;
    this.playFatherMood(mood);
  }

  setFatherTalking(talking) {
    this.fatherTalking = Boolean(talking && this.fatherGroup?.visible);
  }

  updateFatherTalk(delta) {
    this.fatherMouth.update(delta, this.fatherTalking);
  }

  hideFather() {
    this.setFatherTalking(false);
    this.fatherMouth.reset();
    this.fatherMixer?.stopAllAction();
    this.fatherAction = null;
    if (this.fatherGroup) this.fatherGroup.visible = false;
    if (this.fatherRacket) this.fatherRacket.visible = false;
    this.nav.dynamic = [];
    this.restoreCamera();
  }

  focusFather() {
    this.cameraMode = 'father';
    // Head and shoulders, the way a dialogue is shot: close enough to see his mouth move, with his
    // face between the dimmed HUD and the speech card. With the racket in his hand the shot opens
    // up to his waist and to his right, so the racket the story is about stays in view.
    if (this.fatherRacket?.visible) {
      this.cameraTargetPosition.set(0.66, 1.68, 2.85);
      this.cameraTargetLookAt.set(0.86, 1.2, 0.7);
    } else {
      this.cameraTargetPosition.set(0.9, 1.62, 2.1);
      this.cameraTargetLookAt.set(1.0, 1.36, 0.75);
    }
  }

  restoreCamera({ snap = false } = {}) {
    this.cameraMode = 'home';
    this.cameraTargetPosition.copy(this.cameraHomePosition);
    this.cameraTargetLookAt.copy(this.cameraHomeLookAt);
    if (!snap) return;
    this.camera.position.copy(this.cameraTargetPosition);
    this.cameraLookAt.copy(this.cameraTargetLookAt);
    this.camera.lookAt(this.cameraLookAt);
  }

  updateCamera(delta) {
    const blend = 1 - Math.exp(-Math.min(delta, 0.05) * 5.2);
    this.camera.position.lerp(this.cameraTargetPosition, blend);
    this.cameraLookAt.lerp(this.cameraTargetLookAt, blend);
    this.camera.lookAt(this.cameraLookAt);
  }

  updateFatherRacket() {
    if (!this.fatherRacket?.visible || !this.fatherHand || !this.fatherGroup) return;
    this.fatherHand.getWorldPosition(this.fatherRacket.position);
    // Keep the prop a little in front of the animated body so it never disappears into his torso.
    this.fatherRacketOffset.set(0.02, -0.03, 0.14).applyQuaternion(this.fatherGroup.quaternion);
    this.fatherRacket.position.add(this.fatherRacketOffset);
    this.fatherRacketQuaternion.setFromEuler(FATHER_RACKET_TILT);
    this.fatherRacket.quaternion.copy(this.fatherGroup.quaternion).multiply(this.fatherRacketQuaternion);
  }

  enter(name = 'Монстрик') {
    if (!this.ready || this.active) return;
    this.name = name || 'Монстрик';
    this.savedTransform = {
      parent: this.monster.parent,
      position: this.monster.position.clone(),
      quaternion: this.monster.quaternion.clone(),
      scale: this.monster.scale.clone(),
    };
    this.monster.removeFromParent();
    this.scene.add(this.monster);
    this.monster.position.set(0, 0, 0.35);
    this.monster.quaternion.identity();
    // The heading is the Y angle: with Y first it survives the quaternion being copied back and forth
    // (fitting and measuring poses) instead of turning into a flip about X and Z.
    this.monster.rotation.order = 'YXZ';
    this.fitMonster();
    this.monster.traverse((child) => {
      if (child.isMesh) child.castShadow = true;
    });
    this.active = true;
    this.resize(540, 960);
    // The mixer is shared with the editor, whose dance would otherwise blend into every room clip.
    this.mixer.stopAllAction();
    this.currentAction = null;
    this.setSupport(null, { snap: true });
    this.pickNextTask(true);
  }

  // The monster grows up on a new day while standing in the room.
  setAgeHeight(height) {
    if (this.ageHeight === height) return;
    this.ageHeight = height;
    if (!this.active) return;
    this.fitMonster();
    if (this.phase === 'held') {
      this.setSupport(null, { snap: true });
      return;
    }
    // Every spot of a task depends on the monster's size: a grown monster starts afresh on the floor.
    this.abortScript();
    this.placeOnFloor(this.monster.position.x, this.monster.position.z);
    this.pickNextTask(true);
  }

  // Scales the monster to its height in the room and measures what the tasks need to know about its
  // body. The mood props over its head are left out: they are hidden most of the time, and the flies
  // circling a dirty monster would make its size wobble.
  fitMonster() {
    const quaternion = this.monster.quaternion.clone();
    this.monster.quaternion.identity();
    this.monster.scale.copy(this.savedTransform.scale);
    this.monster.position.y = 0;
    const pose = this.restPose.map(([bone]) => [bone.position.clone(), bone.quaternion.clone()]);
    this.restPose.forEach(([bone, position, rest]) => {
      bone.position.copy(position);
      bone.quaternion.copy(rest);
    });
    const measure = () => {
      this.monster.updateMatrixWorld(true);
      const box = new THREE.Box3();
      this.monster.traverse((object) => {
        if (!object.isSkinnedMesh) return;
        object.boundingBox = null;
        box.union(new THREE.Box3().setFromObject(object));
      });
      return box;
    };
    const size = measure().getSize(new THREE.Vector3());
    this.monster.scale.multiplyScalar(MONSTER_ROOM_HEIGHT * this.ageHeight / Math.max(size.y, 0.01));
    this.monster.position.y -= measure().min.y - FLOOR_Y;
    this.footOffset = this.monster.position.y;

    const box = measure();
    const root = this.monster.position;
    this.body = {
      height: box.max.y - box.min.y,
      front: box.max.z - root.z,
      back: root.z - box.min.z,
    };
    // The monster keeps this far from the furniture when it walks: its belly and tail stick out
    // further than its sides once the arms are down.
    this.body.radius = Math.max(this.body.front, this.body.back) * 0.88;
    this.measureSnout();

    this.restPose.forEach(([bone], index) => {
      bone.position.copy(pose[index][0]);
      bone.quaternion.copy(pose[index][1]);
    });
    this.monster.quaternion.copy(quaternion);
    this.monster.updateMatrixWorld(true);
    this.poseKit.forget();
    this.dropRoomClips();
  }

  // The tip of the snout, as a point of the head bone: the frontmost point of the face in the rest
  // pose. It is what goes into the bowl.
  measureSnout() {
    const head = this.poseKit.bone('Head');
    let face = null;
    this.monster.traverse((object) => {
      if (object.isSkinnedMesh && object.material?.name === 'Face') face = object;
    });
    if (!head || !face) return;
    const point = new THREE.Vector3();
    const best = new THREE.Vector3(0, 0, -Infinity);
    const position = face.geometry.getAttribute('position');
    for (let index = 0; index < position.count; index += 1) {
      face.getVertexPosition(index, point);
      face.localToWorld(point);
      if (point.z > best.z) best.copy(point);
    }
    this.snout.copy(head.worldToLocal(best));
  }

  exit() {
    if (!this.active) return;
    this.active = false;
    this.abortScript();
    this.resumeAfterWave = null;
    this.phase = 'waiting';
    // A meal left unwatched is finished off-screen.
    this.endMeal();
    this.hideFather();
    this.mixer.stopAllAction();
    this.currentAction = null;
    this.monster.removeFromParent();
    this.monster.rotation.order = 'XYZ';
    if (this.savedTransform?.parent) this.savedTransform.parent.add(this.monster);
    if (this.savedTransform) {
      this.monster.position.copy(this.savedTransform.position);
      this.monster.quaternion.copy(this.savedTransform.quaternion);
      this.monster.scale.copy(this.savedTransform.scale);
    }
  }

  resize(width, height) {
    if (!width || !height) return;
    const aspect = width / height;
    this.camera.aspect = aspect;
    const halfFov = THREE.MathUtils.degToRad(this.camera.fov * 0.5);
    const distance = Math.max(7.7, 1.95 / (Math.tan(halfFov) * Math.max(aspect, 0.45)));
    this.cameraHomePosition.set(0, 2.98, distance - 0.25);
    if (this.cameraMode === 'father') {
      this.focusFather();
    } else {
      this.cameraTargetPosition.copy(this.cameraHomePosition);
      this.cameraTargetLookAt.copy(this.cameraHomeLookAt);
      this.camera.position.copy(this.cameraHomePosition);
      this.cameraLookAt.copy(this.cameraHomeLookAt);
      this.camera.lookAt(this.cameraLookAt);
    }
    this.camera.updateProjectionMatrix();
  }

  // --- Clips ---------------------------------------------------------------------------------

  // The room's own clips are built for the monster's proportions, so they are made again when it
  // grows up.
  dropRoomClips() {
    if (!this.roomClips) return;
    for (const clip of Object.values(this.roomClips)) {
      const action = this.mixer.existingAction(clip);
      if (action === this.currentAction) this.currentAction = null;
      action?.stop();
      this.mixer.uncacheClip(clip);
    }
    this.roomClips = null;
  }

  ensureRoomClips() {
    if (this.roomClips) return this.roomClips;
    this.eatBend = this.findEatBend();
    this.roomClips = buildRoomClips(this.poseKit, { eatBend: this.eatBend });
    return this.roomClips;
  }

  // How far the monster bends to get its snout down to the food in the bowl.
  findEatBend() {
    const bowl = this.assets.get('bowl');
    if (!bowl) return 0.7;
    const target = bowlInterior(bowl).center.y + BOWL_KIBBLE_SIZE;
    let low = 0;
    let high = 1.3;
    for (let iteration = 0; iteration < 14; iteration += 1) {
      const middle = (low + high) / 2;
      if (this.snoutAt(eatPose(middle, { dip: 0.5 })).y > target) low = middle;
      else high = middle;
    }
    return (low + high) / 2;
  }

  // The snout in a pose, relative to the monster's origin in metres: x to its left, y up (from the
  // floor under it), z ahead.
  snoutAt(spec) {
    const [point] = this.poseKit.measure(this.poseKit.pose(spec), ['Head'], [this.snout]);
    const scale = this.monster.scale.x;
    return new THREE.Vector3(point.x * scale, point.y * scale + this.footOffset, point.z * scale);
  }

  // A clip by name; names starting with '@' are the room's own clips.
  getClip(primary, fallback) {
    const find = (name) => {
      if (!name) return null;
      if (name.startsWith('@')) return this.ensureRoomClips()[name.slice(1)] ?? null;
      return this.animations.find((clip) => clip.name === name) ?? null;
    };
    return find(primary) || find(fallback) || this.animations[0];
  }

  playClip(primary, { fallback = '@idle', loop = true, repetitions = Infinity, fade = 0.28, timeScale = 1 } = {}) {
    const clip = this.getClip(primary, fallback);
    if (!clip) return 2.4;
    const next = this.mixer.clipAction(clip);
    next.reset();
    next.enabled = true;
    next.setEffectiveWeight(1);
    next.setEffectiveTimeScale(timeScale);
    next.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? repetitions : 1);
    next.clampWhenFinished = !loop;
    next.play();
    if (this.currentAction && this.currentAction !== next) {
      this.currentAction.crossFadeTo(next, fade, false);
    }
    this.currentAction = next;
    return clip.duration || 2.4;
  }

  // --- Where the monster stands ----------------------------------------------------------------

  // `height` null: the floor under the monster (the rug lifts it); a number: a fixed surface.
  setSupport(height, { snap = false } = {}) {
    this.support = height;
    if (snap) this.monster.position.y = this.footOffset + this.surfaceHeight();
  }

  surfaceHeight() {
    if (this.support !== null) return this.support;
    return this.nav.groundAt(this.monster.position.x, this.monster.position.z);
  }

  followSurface(dt) {
    const target = this.footOffset + this.surfaceHeight();
    this.monster.position.y += (target - this.monster.position.y) * Math.min(1, dt * 14);
  }

  // Puts the monster on the floor at the free spot nearest to a point.
  placeOnFloor(x, z) {
    const spot = this.nav.nearestFree(x, z, this.body.radius) ?? [x, z];
    this.monster.position.x = spot[0];
    this.monster.position.z = spot[1];
    this.stance = null;
    this.setSupport(null, { snap: true });
  }

  cameraHeading() {
    return headingTo(this.monster.position.x, this.monster.position.z, this.camera.position.x, this.camera.position.z);
  }

  turnTowards(heading) {
    const from = this.monster.rotation.y;
    const delta = shortestAngle(from, heading);
    this.turnTween = Math.abs(delta) < 0.02 ? null : { from, delta, time: 0, duration: 0.2 + Math.abs(delta) * 0.12 };
  }

  updateTurn(dt) {
    const tween = this.turnTween;
    if (!tween) return;
    tween.time += dt;
    const t = Math.min(1, tween.time / tween.duration);
    this.monster.rotation.y = tween.from + tween.delta * smoothstep(t);
    if (t >= 1) this.turnTween = null;
  }

  // --- Tasks as lists of steps -------------------------------------------------------------------
  //
  // walk  { to: [x, z], run, exact }       walks there around the furniture (`exact`: the last bit
  //                                        straight to the spot even inside the furniture's margin)
  // turn  { heading }                       turns on the spot
  // move  { to: [x, y, z], duration, clip, arc, heading, window, stance }
  //                                        moves the monster through the air (hops, climbing):
  //                                        `window` is the part of the clip when it is off the
  //                                        ground; y null lands on the floor
  // act   { clip, duration, heading, text, update, interrupt, fade, timeScale, loop }
  // call  { run }                           does something at once
  //
  // `interrupt` says what a tap on the monster does during a step: 'wave' (default for the floor
  // and steady spots), 'busy' (it ignores it, e.g. in the air) or 'sleep' (it sleeps on).

  setStatus(text) {
    this.onStatus(`${this.name} ${text}`);
  }

  pickNextTask(initial = false) {
    if (!this.active) return;
    // Food left in the bowl comes first.
    if (this.meal) {
      this.runSteps('meal', this.bowlSteps({ eating: true }));
      return;
    }
    if (this.conditionMood) {
      this.showConditionMood();
      return;
    }
    const shouldStroll = !initial && Math.random() < 0.24;
    const task = shouldStroll ? { id: 'wander' } : weightedTask(this.previousTaskId);
    if (!shouldStroll) this.previousTaskId = task.id;
    this.startTask(task.id);
  }

  // Starts a task by id (the preview page forces tasks this way).
  startTask(id) {
    if (!this.active || this.phase === 'held') return;
    const builders = {
      'bowl-check': () => this.bowlSteps({ eating: false }),
      nap: () => this.napSteps(),
      climb: () => this.climbSteps(),
      draw: () => this.drawSteps(),
      bench: () => this.benchSteps(),
      toys: () => this.toySteps(),
      dance: () => this.danceSteps(),
      wander: () => this.wanderSteps(),
      meal: () => {
        this.serveFood(100);
        return null;
      },
    };
    const steps = builders[id]?.();
    if (steps) this.runSteps(id, steps);
  }

  // Switches to new steps. Up on the furniture the monster first gets down; in the middle of a hop
  // it lands first.
  runSteps(id, steps, { getDown = true } = {}) {
    if (this.step?.kind === 'move' && this.phase === 'script') {
      this.pending = { id, steps, getDown };
      return;
    }
    const down = getDown && this.stance ? this.stance.exit() : [];
    this.resumeAfterWave = null;
    this.script = { id, steps: [...down, ...steps], index: -1 };
    this.phase = 'script';
    this.nextStep();
  }

  abortScript() {
    this.script = null;
    this.step = null;
    this.pending = null;
    this.chewing = false;
    this.sleepyZ.active = false;
    this.hideToy();
  }

  nextStep() {
    if (!this.active || !this.script) return;
    this.step = null;
    if (this.pending) {
      const { id, steps, getDown } = this.pending;
      this.pending = null;
      this.runSteps(id, steps, { getDown });
      return;
    }
    this.script.index += 1;
    const definition = this.script.steps[this.script.index];
    if (!definition) {
      this.script = null;
      this.step = null;
      this.pickNextTask();
      return;
    }
    this.beginStep(definition);
  }

  beginStep(definition, remaining = null) {
    const step = { ...definition, time: 0 };
    this.step = step;
    this.phase = 'script';
    this.phaseTime = 0;
    this.turnTween = null;
    const position = this.monster.position;
    if (step.kind === 'call') {
      step.run();
      this.nextStep();
      return;
    }
    if (step.kind === 'walk') {
      const path = this.nav.findPath([position.x, position.z], step.to, this.body.radius) ?? [[position.x, position.z], step.to];
      if (step.exact) {
        const last = path[path.length - 1];
        if (Math.hypot(last[0] - step.to[0], last[1] - step.to[1]) > 0.01) path.push(step.to);
      }
      step.path = path;
      step.waypoint = 1;
      this.setSupport(null);
      this.stance = null;
      this.playClip(step.run ? 'Running' : 'Walking', { fallback: step.run ? 'Walking' : 'Thoughtful_Walk' });
      if (step.text) this.setStatus(step.text);
      this.updateDebugPath(path);
      return;
    }
    if (step.kind === 'turn') {
      step.from = this.monster.rotation.y;
      step.delta = shortestAngle(step.from, step.heading);
      step.duration = Math.max(0.25, Math.abs(step.delta) / TURN_SPEED);
      if (step.clip !== null) this.playClip(step.clip ?? '@idle', { fade: 0.2 });
      if (step.text) this.setStatus(step.text);
      return;
    }
    if (step.kind === 'move') {
      step.start = position.clone();
      step.startSurface = this.surfaceHeight();
      step.fromHeading = this.monster.rotation.y;
      const clipDuration = this.playClip(step.clip ?? '@hop', { loop: step.loop ?? false, fade: step.fade ?? 0.18, timeScale: 1 });
      if (!step.loop && this.currentAction) this.currentAction.setEffectiveTimeScale(clipDuration / step.duration);
      if (step.loop && step.cycle && this.currentAction) this.currentAction.setEffectiveTimeScale(clipDuration / step.cycle);
      step.window ??= this.currentAction?.getClip().userData?.takeoff !== undefined
        ? [this.currentAction.getClip().userData.takeoff, this.currentAction.getClip().userData.landing]
        : [0, 1];
      this.support = null;
      if (step.text) this.setStatus(step.text);
      return;
    }
    if (step.kind === 'act') {
      step.duration = remaining ?? step.duration;
      if (step.heading !== undefined) this.turnTowards(typeof step.heading === 'function' ? step.heading() : step.heading);
      this.playClip(step.clip, { fallback: step.fallback ?? '@idle', loop: step.loop ?? true, fade: step.fade ?? 0.28, timeScale: step.timeScale ?? 1 });
      if (step.text) this.setStatus(step.text);
      step.begin?.();
    }
  }

  updateStep(dt) {
    const step = this.step;
    if (!step) return;
    step.time += dt;
    const position = this.monster.position;

    if (step.kind === 'walk') {
      const speed = step.run ? RUN_SPEED : WALK_SPEED;
      let budget = speed * dt;
      while (budget > 0 && step.waypoint < step.path.length) {
        const [x, z] = step.path[step.waypoint];
        const dx = x - position.x;
        const dz = z - position.z;
        const distance = Math.hypot(dx, dz);
        if (distance <= budget) {
          position.x = x;
          position.z = z;
          budget -= distance;
          step.waypoint += 1;
          continue;
        }
        position.x += (dx / distance) * budget;
        position.z += (dz / distance) * budget;
        budget = 0;
        const desired = Math.atan2(dx, dz);
        this.monster.rotation.y += shortestAngle(this.monster.rotation.y, desired) * Math.min(1, dt * 8);
      }
      this.followSurface(dt);
      if (step.waypoint >= step.path.length) {
        this.updateDebugPath(null);
        this.nextStep();
      }
      return;
    }

    if (step.kind === 'turn') {
      const t = Math.min(1, step.time / step.duration);
      this.monster.rotation.y = step.from + step.delta * smoothstep(t);
      this.followSurface(dt);
      if (t >= 1) this.nextStep();
      return;
    }

    if (step.kind === 'move') {
      const t = Math.min(1, step.time / step.duration);
      const [from, to] = step.window;
      const u = THREE.MathUtils.clamp((t - from) / Math.max(0.001, to - from), 0, 1);
      const eased = step.linear ? u : smoothstep(u);
      const [x, y, z] = step.to;
      position.x = THREE.MathUtils.lerp(step.start.x, x, eased);
      position.z = THREE.MathUtils.lerp(step.start.z, z, eased);
      const endSurface = y ?? this.nav.groundAt(x, z);
      const surface = THREE.MathUtils.lerp(step.startSurface, endSurface, eased) + (step.arc ?? 0) * 4 * u * (1 - u);
      position.y = this.footOffset + surface;
      if (step.heading !== undefined) {
        this.monster.rotation.y = step.fromHeading + shortestAngle(step.fromHeading, step.heading) * smoothstep(t);
      }
      if (t >= 1) {
        this.support = y;
        if (step.stance !== undefined) this.stance = step.stance;
        this.nextStep();
      }
      return;
    }

    if (step.kind === 'act') {
      this.followSurface(dt);
      step.update?.(dt, step.time);
      if (step.time >= step.duration) {
        step.end?.();
        this.nextStep();
      }
    }
  }

  // --- The tasks ---------------------------------------------------------------------------------

  wanderSteps() {
    const point = this.nav.randomFreePoint(this.body.radius, STROLL_AREA) ?? [0, 0.35];
    return [
      { kind: 'walk', to: point, text: 'гуляет по комнате' },
      { kind: 'act', clip: '@idle', duration: 2.4 + Math.random() * 2, heading: () => this.cameraHeading(), text: 'осматривается вокруг' },
    ];
  }

  danceSteps() {
    const spot = [(Math.random() - 0.5) * 0.5, 0.22 + (Math.random() - 0.5) * 0.3];
    return [
      { kind: 'walk', to: spot, text: 'выходит на коврик' },
      { kind: 'act', clip: Math.random() < 0.5 ? 'FunnyDancing_03' : 'FunnyDancing_02', fallback: 'FunnyDancing_03', duration: 5.8, heading: () => this.cameraHeading(), text: 'танцует на мягком коврике' },
    ];
  }

  // The spot in front of the bowl from which the snout reaches the food, and the heading there.
  eatSpot() {
    this.ensureRoomClips();
    const center = bowlInterior(this.assets.get('bowl')).center;
    const reach = this.snoutAt(eatPose(this.eatBend, { dip: 0.5 }));
    const heading = Math.atan2(-EAT_SIDE.x, -EAT_SIDE.y);
    const distance = Math.hypot(reach.z, reach.x) - 0.02;
    return {
      heading,
      spot: [center.x + EAT_SIDE.x * distance, center.z + EAT_SIDE.y * distance],
      // Where it can walk to before the last step to the bowl.
      approach: [center.x + EAT_SIDE.x * (distance + 0.3), center.z + EAT_SIDE.y * (distance + 0.3)],
    };
  }

  bowlSteps({ eating }) {
    const { spot, approach, heading } = this.eatSpot();
    const steps = [
      { kind: 'walk', to: approach, run: eating, text: eating ? 'бежит к миске' : 'подходит к миске' },
      { kind: 'walk', to: spot, exact: true, run: false },
      { kind: 'turn', heading, clip: null },
    ];
    if (eating) {
      steps.push(
        {
          kind: 'act',
          clip: '@eat',
          duration: MEAL_DURATION,
          fade: 0.35,
          text: 'уплетает корм',
          begin: () => { this.chewing = true; },
          update: (dt) => this.chew(dt),
          end: () => {
            this.chewing = false;
            this.endMeal();
          },
        },
        { kind: 'act', clip: 'Mood_happy', fallback: '@idle', duration: 1.6, fade: 0.4, text: 'наелся и облизывается' },
      );
    } else {
      steps.push(
        { kind: 'act', clip: '@sniff', duration: 3.2, fade: 0.35, text: 'проверяет пустую миску' },
        { kind: 'act', clip: 'Mood_hungry', fallback: '@idle', duration: 1.4, fade: 0.4, heading: () => this.cameraHeading(), text: 'вздыхает над пустой миской' },
      );
    }
    return steps;
  }

  // Into the nest: a hop over its rim onto the cushion with a turn in the air, then lying down with
  // the head on the pillows under the roof.
  napSteps() {
    const [x, z] = BED.inside;
    const front = [x, BED.rimZ + this.body.radius + 0.06];
    const out = () => [
      { kind: 'move', to: [x, BED.cushion, z], duration: 1.1, clip: '@idle', loop: true, fade: 0.9, linear: true, heading: 0, text: 'потягивается' },
      { kind: 'move', to: [front[0], null, front[1]], duration: 1.1, arc: 0.24, heading: 0, stance: null, text: 'выпрыгивает из кроватки' },
    ];
    return [
      { kind: 'walk', to: front, text: 'идёт к своей кроватке' },
      { kind: 'turn', heading: Math.PI, clip: null },
      { kind: 'move', to: [x, BED.cushion, z], duration: 1.15, arc: 0.3, heading: 0, stance: { name: 'bed', exit: out }, text: 'забирается в кроватку' },
      { kind: 'move', to: [x, BED.cushion, BED.sleepZ], duration: 1.2, clip: '@sleep', loop: true, fade: 1.0, linear: true, heading: BED.sleepHeading, text: 'устраивается поудобнее' },
      {
        kind: 'act',
        clip: '@sleep',
        duration: 9,
        fade: 0.9,
        heading: BED.sleepHeading,
        interrupt: 'sleep',
        text: 'сладко спит в кроватке',
        begin: () => { this.sleepyZ.active = true; },
        end: () => { this.sleepyZ.active = false; },
      },
      ...out(),
    ];
  }

  // Up the ladder of shelves to the top of the climbing tower, a wave from up there and a jump down.
  climbSteps() {
    const front = CLIMBER.frontZ + this.body.front + 0.05;
    const [topX, topZ] = CLIMBER.topSpot;
    const landing = this.nav.nearestFree(CLIMBER.x, front + 0.35, this.body.radius) ?? [CLIMBER.x, front + 0.35];
    const jumpDown = () => [
      { kind: 'move', to: [landing[0], null, landing[1]], duration: 1.35, arc: 0.28, heading: 0, stance: null, text: 'спрыгивает с лазалки' },
      { kind: 'act', clip: 'Mood_happy', fallback: '@idle', duration: 1.2, heading: () => this.cameraHeading(), text: 'доволен прыжком' },
    ];
    // Hanging on the ladder it lets go and drops back down.
    const letGo = () => [
      { kind: 'move', to: [CLIMBER.x, null, front], duration: 0.9, arc: 0, clip: '@hop', stance: null, text: 'спрыгивает с лазалки' },
    ];
    const climbTime = CLIMBER.top / CLIMB_SPEED;
    return [
      { kind: 'walk', to: [CLIMBER.x, front], text: 'спешит к лазалке' },
      { kind: 'turn', heading: CLIMBER.heading, clip: null },
      { kind: 'move', to: [CLIMBER.x, CLIMBER.top, front], duration: climbTime, clip: '@climb', loop: true, cycle: 0.9, linear: true, fade: 0.25, stance: { name: 'ladder', exit: letGo }, text: 'лезет по лесенке' },
      { kind: 'move', to: [topX, CLIMBER.top, topZ], duration: 1.0, arc: 0.12, stance: { name: 'climber-top', exit: jumpDown }, text: 'забирается на самый верх' },
      { kind: 'turn', heading: 0, clip: '@idle' },
      { kind: 'act', clip: 'Big_Wave_Hello', fallback: 'Greetings', loop: false, duration: 5.2, heading: () => this.cameraHeading(), text: 'машет с верхушки лазалки' },
      { kind: 'act', clip: '@idle', duration: 1.4, text: 'смотрит на комнату сверху' },
      { kind: 'turn', heading: 0, clip: null },
      ...jumpDown(),
    ];
  }

  // Up onto the stool by the desk to draw: the small monster stands on it, a bigger one sits.
  drawSteps() {
    const stool = this.assets.get('stool').position;
    const seated = this.body.height > STAND_TO_DRAW_HEIGHT;
    // Close to the desk, but the belly stays clear of its edge.
    const x = Math.min(stool.x, DESK.frontX - this.body.front * (seated ? 0.95 : 0.85) - 0.02);
    const side = [stool.x - STOOL.radius - this.body.radius - 0.05, stool.z];
    const down = () => [
      { kind: 'turn', heading: -Math.PI / 2, clip: '@idle' },
      { kind: 'move', to: [side[0], null, side[1]], duration: 1.0, arc: 0.18, heading: -Math.PI / 2, stance: null, text: 'спрыгивает с табурета' },
    ];
    return [
      { kind: 'walk', to: side, text: 'идёт к столику' },
      { kind: 'turn', heading: Math.PI / 2, clip: null },
      { kind: 'move', to: [x, STOOL.seat, stool.z], duration: 1.0, arc: 0.18, heading: Math.PI / 2, stance: { name: 'stool', exit: down }, text: 'забирается на табурет' },
      {
        kind: 'act',
        clip: seated ? '@drawSeated' : '@draw',
        duration: 6.6,
        fade: 0.4,
        heading: Math.PI / 2,
        text: 'рисует новую картинку',
        begin: () => {
          this.clearPaper();
          this.strokeTimer = 0;
        },
        update: (dt) => {
          this.strokeTimer += dt;
          while (this.strokeTimer > 0.09) {
            this.strokeTimer -= 0.09;
            this.drawStroke();
          }
        },
      },
      { kind: 'act', clip: 'Mood_happy', fallback: '@idle', duration: 1.6, heading: Math.PI / 2, text: 'любуется своим рисунком' },
      ...down(),
    ];
  }

  // A hop onto the bench with a turn in the air, then sitting and swinging the legs.
  benchSteps() {
    const front = [BENCH.x, BENCH.frontZ + this.body.radius + 0.1];
    const seatZ = Math.min(BENCH.backZ + this.body.back + 0.04, BENCH.frontZ - 0.05);
    const down = () => [
      { kind: 'move', to: [front[0], null, front[1]], duration: 1.0, arc: 0.2, heading: 0, stance: null, text: 'спрыгивает со скамейки' },
    ];
    return [
      { kind: 'walk', to: front, text: 'идёт к скамейке' },
      { kind: 'turn', heading: Math.PI, clip: null },
      { kind: 'move', to: [BENCH.x, BENCH.seat, seatZ], duration: 1.15, arc: 0.22, heading: 0, stance: { name: 'bench', exit: down }, text: 'запрыгивает на скамейку' },
      { kind: 'act', clip: '@sit', duration: 6.5, fade: 0.45, heading: 0, text: 'болтает ногами на скамейке' },
      ...down(),
    ];
  }

  // Rummaging in the bench's drawers for the ball, playing with it and putting it back.
  toySteps() {
    const x = BENCH.x + (Math.random() < 0.5 ? -0.3 : 0.3);
    const spot = [x, BENCH.frontZ + this.body.front * 0.75 + 0.08];
    return [
      { kind: 'walk', to: spot, exact: true, text: 'заглядывает в ящик под скамейкой' },
      { kind: 'turn', heading: Math.PI, clip: null },
      { kind: 'act', clip: '@rummage', duration: 3, fade: 0.35, heading: Math.PI, text: 'ищет любимую игрушку' },
      { kind: 'call', run: () => this.showToy() },
      { kind: 'turn', heading: 0, clip: '@idle' },
      {
        kind: 'act',
        clip: '@toss',
        duration: 4.2,
        heading: () => this.cameraHeading(),
        text: 'подбрасывает мячик',
        begin: () => { this.toy.mode = 'toss'; },
        end: () => { this.toy.mode = 'hands'; },
      },
      { kind: 'turn', heading: Math.PI, clip: '@idle' },
      { kind: 'act', clip: '@rummage', duration: 1.6, fade: 0.35, heading: Math.PI, text: 'убирает мячик на место', begin: () => this.hideToy() },
    ];
  }

  showToy() {
    this.toy.mode = 'hands';
    this.toy.mesh.visible = true;
    this.toy.mesh.scale.setScalar(0.07 * (this.body.height / 0.77));
  }

  hideToy() {
    if (!this.toy) return;
    this.toy.mode = 'hidden';
    this.toy.mesh.visible = false;
  }

  // The ball sits between the hands, or flies up over the head and back while it is tossed.
  updateToy(dt) {
    const toy = this.toy;
    if (!toy || toy.mode === 'hidden') return;
    const left = this.poseKit.bone('LeftHand');
    const right = this.poseKit.bone('RightHand');
    if (!left || !right) return;
    const hands = left.getWorldPosition(this.tmpVector).add(right.getWorldPosition(this.tmpVector2)).multiplyScalar(0.5);
    hands.y += toy.mesh.scale.x * 0.6;
    if (toy.mode === 'toss' && this.currentAction) {
      const clip = this.currentAction.getClip();
      const share = (this.currentAction.time % clip.duration) / clip.duration;
      const { release, catch: caught } = clip.userData ?? {};
      if (release !== undefined && share > release && share < caught) {
        const u = (share - release) / (caught - release);
        hands.y += 4 * u * (1 - u) * this.body.height * 0.55;
      }
    }
    toy.spin += dt * 5;
    toy.mesh.position.copy(hands);
    toy.mesh.rotation.set(toy.spin * 0.7, toy.spin, 0);
  }

  // --- Food ------------------------------------------------------------------------------------

  // Fills the bowl with `grams` of kibble; the monster drops whatever it was doing and comes to eat.
  serveFood(grams) {
    const bowl = this.assets.get('bowl');
    if (!this.active || !bowl) return;
    this.endMeal();
    const interior = bowlInterior(bowl);
    this.bowlKibble = new Kibble(BOWL_KIBBLE_CAPACITY, BOWL_KIBBLE_SIZE);
    this.bowlKibble.group.position.copy(interior.center);
    for (let piece = 0; piece < grams; piece += 1) {
      if (!this.bowlKibble.add(this.bowlKibble.pileSpot(interior.radius))) break;
    }
    this.scene.add(this.bowlKibble.group);
    this.meal = { eaten: 0 };
    if (this.phase === 'held') return;
    if (this.phase === 'waving') {
      this.resumeAfterWave = { meal: true };
      return;
    }
    this.hideToy();
    this.runSteps('meal', this.bowlSteps({ eating: true }));
  }

  // Pieces disappear from the top of the pile while the monster eats.
  chew(dt) {
    const kibble = this.bowlKibble;
    if (!this.meal || !kibble) return;
    this.meal.eaten = Math.min(kibble.count, this.meal.eaten + (kibble.count / MEAL_DURATION) * dt);
    const hidden = Math.floor(this.meal.eaten);
    for (let index = kibble.count - 1; index >= kibble.count - hidden; index -= 1) kibble.hide(kibble.pieces[index]);
  }

  endMeal() {
    this.chewing = false;
    this.meal = null;
    if (!this.bowlKibble) return;
    this.scene.remove(this.bowlKibble.group);
    this.bowlKibble.group.traverse((child) => {
      if (!child.isMesh) return;
      child.geometry.dispose();
      child.material.dispose();
    });
    this.bowlKibble = null;
  }

  // --- Condition, holding and waving -------------------------------------------------------------

  conditionSteps() {
    return [{
      kind: 'act',
      clip: this.conditionMood.clip,
      fallback: '@idle',
      duration: Infinity,
      heading: () => this.cameraHeading(),
      text: this.conditionMood.status,
    }];
  }

  showConditionMood() {
    if (!this.active || !this.conditionMood) return;
    this.endMeal();
    this.hideToy();
    this.runSteps(CONDITION_TASK_ID, this.conditionSteps());
  }

  // A condition mood is the monster's persistent state in the room. Activities may interrupt it,
  // but as soon as they finish the condition becomes visible again.
  setConditionMood(mood = null) {
    const next = mood?.clip ? { clip: mood.clip, status: mood.status || 'отдыхает' } : null;
    const unchanged = this.conditionMood?.clip === next?.clip
      && this.conditionMood?.status === next?.status;
    if (unchanged) return;
    this.conditionMood = next;
    if (!this.active) return;

    if (!next) {
      if (this.resumeAfterWave?.id === CONDITION_TASK_ID) this.resumeAfterWave = null;
      if (this.script?.id === CONDITION_TASK_ID && this.phase !== 'held') this.pickNextTask(true);
      return;
    }
    if (this.phase === 'held') return;
    if (this.phase === 'waving') {
      this.resumeAfterWave = { condition: true };
      return;
    }
    if (this.script?.id === 'meal') return;
    this.showConditionMood();
  }

  // The ear cleaning: the monster drops whatever it was doing and stands still on the rug, facing
  // the player, in the given pose until release(). A meal in progress is finished off-screen.
  hold(clip = 'Mood_neutral', { fallback = 'restpose', spot = [0, 0.35] } = {}) {
    if (!this.active) return;
    this.endMeal();
    this.abortScript();
    this.resumeAfterWave = null;
    this.phase = 'held';
    this.phaseTime = 0;
    this.monster.position.x = spot[0];
    this.monster.position.z = spot[1];
    this.monster.rotation.x = 0;
    this.monster.rotation.y = 0;
    this.turnTween = null;
    this.stance = null;
    this.setSupport(null, { snap: true });
    this.updateDebugPath(null);
    // Nothing else may keep playing underneath, or the held head would sway and the ears with it.
    this.mixer.stopAllAction();
    this.currentAction = null;
    this.playClip(clip, { fallback });
    this.setStatus('стоит смирно и ждёт');
  }

  // Another pose while held, e.g. a happy dance once the ears are clean.
  holdPose(clip, { fallback = 'restpose', loop = true } = {}) {
    if (!this.active || this.phase !== 'held') return 0;
    return this.playClip(clip, { fallback, loop });
  }

  release() {
    if (!this.active || this.phase !== 'held') return;
    this.phase = 'waiting';
    this.pickNextTask();
  }

  // A tap on the monster: it turns to the player and waves, then goes on with what it was doing.
  // Asleep it sleeps on, and in the air it has no hand free.
  wave() {
    if (!this.active || this.phase === 'waving' || this.phase === 'held') return false;
    const interrupt = this.step?.interrupt ?? (this.step?.kind === 'move' ? 'busy' : 'wave');
    if (interrupt === 'sleep') {
      this.setStatus('сладко спит. Тсс!');
      return false;
    }
    if (interrupt === 'busy') return false;
    const step = this.step;
    this.resumeAfterWave = {
      id: this.script?.id,
      script: this.script,
      step: step ? { kind: step.kind } : null,
      remaining: step?.kind === 'act' ? Math.max(0.8, step.duration - step.time) : null,
    };
    this.phase = 'waving';
    this.phaseTime = 0;
    this.chewing = false;
    this.waveDuration = this.playClip('Big_Wave_Hello', { fallback: 'Greetings', loop: false }) + 0.18;
    this.turnTowards(this.cameraHeading());
    this.setStatus('машет тебе!');
    return true;
  }

  resumeTask() {
    const resume = this.resumeAfterWave;
    this.resumeAfterWave = null;
    this.phase = 'waiting';
    if (resume?.meal || (this.meal && resume?.id !== 'meal')) {
      this.pickNextTask();
      return;
    }
    if (resume?.condition) {
      this.showConditionMood();
      return;
    }
    if (!resume?.script || !resume.step) {
      this.pickNextTask();
      return;
    }
    this.script = resume.script;
    this.beginStep(resume.script.steps[resume.script.index], resume.remaining);
  }

  // --- Frame -------------------------------------------------------------------------------------

  update(delta) {
    if (!this.active) return;
    const dt = Math.min(delta, 0.05);
    this.fatherMixer?.update(dt);
    this.updateFatherTalk(dt);
    this.updateFatherRacket();
    this.updateCamera(dt);
    this.phaseTime += dt;
    this.glowTime += dt;
    if (this.lampLight) this.lampLight.intensity = 1.72 + Math.sin(this.glowTime * 1.35) * 0.12;
    this.updateToy(dt);
    this.updateSleepyZ(dt);
    if (this.phase === 'held') return;
    this.updateTurn(dt);

    if (this.phase === 'waving') {
      this.followSurface(dt);
      if (this.phaseTime >= this.waveDuration) this.resumeTask();
      return;
    }
    if (this.phase === 'script') this.updateStep(dt);
  }

  updateSleepyZ(dt) {
    const head = this.poseKit.bone('Head');
    if (!head) return;
    head.getWorldPosition(this.tmpVector);
    this.tmpVector.y += this.body.height * 0.25;
    this.sleepyZ.update(dt, this.tmpVector, this.body.height / 0.77);
  }

  // --- Debug view for room-preview.html ---------------------------------------------------------

  toggleDebug() {
    if (this.debug) {
      this.scene.remove(this.debug.group);
      this.debug.group.traverse((child) => {
        child.geometry?.dispose();
        child.material?.map?.dispose();
        child.material?.dispose();
      });
      this.debug = null;
      return false;
    }
    const group = new THREE.Group();
    const { minX, maxX, minZ, maxZ } = this.nav.bounds;
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(maxX - minX, maxZ - minZ),
      new THREE.MeshBasicMaterial({ map: this.nav.debugTexture(this.body.radius), transparent: true, depthWrite: false }),
    );
    // Row 0 of the texture is the back of the room, where the plane's top edge lies.
    plane.rotation.x = -Math.PI / 2;
    plane.position.set((minX + maxX) / 2, 0.075, (minZ + maxZ) / 2);
    plane.renderOrder = 3;
    group.add(plane);
    const line = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x1b1bff, depthTest: false }));
    line.renderOrder = 4;
    group.add(line);
    this.scene.add(group);
    this.debug = { group, line };
    return true;
  }

  updateDebugPath(path) {
    if (!this.debug) return;
    const points = (path ?? []).map(([x, z]) => new THREE.Vector3(x, 0.09, z));
    this.debug.line.geometry.dispose();
    this.debug.line.geometry = new THREE.BufferGeometry().setFromPoints(points);
  }
}
