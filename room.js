import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { bowlInterior, Kibble } from './kibble.js';

const FLOOR_Y = 0;

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
    position: [-1.02, 0, -1.48],
    rotationY: 0,
    footprint: 1.18,
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
    position: [1.08, 0, 0.08],
    rotationY: 0,
    footprint: 0.52,
  },
  {
    id: 'bowl',
    url: '/room/models/feeding-bowl.glb',
    position: [-1.36, 0.015, 1.08],
    rotationY: 0,
    footprint: 0.56,
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
  },
];

const TASKS = [
  {
    id: 'bowl-check',
    target: [-0.98, 0.72],
    lookAt: [-1.36, 1.08],
    clip: 'restpose',
    fallback: 'restpose',
    duration: 3.8,
    walkingText: 'подходит к миске',
    actionText: 'проверяет пустую миску',
    weight: 1.2,
  },
  {
    id: 'nap',
    target: [-0.72, -0.7],
    lookAt: [-1.02, -1.48],
    clip: 'Groan_Holding_Stomach_in_Sleep',
    fallback: 'restpose',
    duration: 7.5,
    walkingText: 'идёт к своей лежанке',
    actionText: 'устраивается поудобнее',
    weight: 0.9,
  },
  {
    id: 'climb',
    target: [0.16, -0.82],
    lookAt: [0.15, -1.62],
    clip: 'Run_and_Jump',
    fallback: 'FunnyDancing_03',
    duration: 5.4,
    walkingText: 'спешит к лазалке',
    actionText: 'резвится на лазалке',
    weight: 1.05,
  },
  {
    id: 'draw',
    target: [0.92, 0.22],
    lookAt: [1.82, 0.18],
    clip: 'restpose',
    fallback: 'Thoughtful_Walk',
    duration: 6.6,
    walkingText: 'идёт к столику',
    actionText: 'придумывает новый рисунок',
    weight: 0.85,
  },
  {
    id: 'bench',
    target: [0.72, -0.9],
    lookAt: [1.08, -1.72],
    clip: 'Stand_Up5',
    fallback: 'restpose',
    duration: 5.8,
    walkingText: 'заглядывает в сундук',
    actionText: 'выбирает любимую игрушку',
    weight: 0.9,
  },
  {
    id: 'dance',
    target: [0.02, 0.28],
    lookAt: [0.02, 2.2],
    clip: 'FunnyDancing_03',
    fallback: 'FunnyDancing_02',
    duration: 5.8,
    walkingText: 'выходит на коврик',
    actionText: 'танцует на мягком коврике',
    weight: 1.15,
  },
];

// After a successful feeding the monster runs to the bowl and eats everything in it.
const MEAL_TASK = {
  id: 'meal',
  target: [-0.98, 0.72],
  lookAt: [-1.36, 1.08],
  clip: 'restpose',
  fallback: 'restpose',
  duration: 7,
  walkClip: 'Running',
  walkFallback: 'Walking',
  walkSpeed: 1.05,
  walkingText: 'бежит к миске',
  actionText: 'уплетает корм',
};
// The kibble in the room bowl has the same size relative to the bowl as on the kitchen scale.
const BOWL_KIBBLE_SIZE = 0.034;
const BOWL_KIBBLE_CAPACITY = 80;
const MEAL_LEAN = 0.16;
const MEAL_CHEW = { amplitude: 0.07, speed: 9 };

const WANDER_POINTS = [
  [-0.62, 0.35],
  [0.54, 0.72],
  [0.58, -0.48],
  [-0.45, -0.42],
  [0.02, 0.12],
];

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

export class MonsterRoom {
  constructor({ monster, mixer, animations, onStatus, onLoadProgress }) {
    this.monster = monster;
    this.mixer = mixer;
    this.animations = animations || [];
    this.onStatus = onStatus || (() => {});
    this.onLoadProgress = onLoadProgress || (() => {});
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xcff4f2);
    this.scene.fog = new THREE.Fog(0xcff4f2, 10, 20);
    this.camera = new THREE.PerspectiveCamera(46, 9 / 16, 0.1, 40);
    this.loader = new GLTFLoader();
    this.assets = new Map();
    this.active = false;
    this.ready = false;
    this.initializing = null;
    this.name = 'Монстрик';
    this.currentAction = null;
    this.currentTask = null;
    this.previousTaskId = null;
    this.phase = 'waiting';
    this.phaseTime = 0;
    this.phaseDuration = 0;
    this.target = new THREE.Vector3();
    this.resumeAfterWave = null;
    this.waveDuration = 2.8;
    this.savedTransform = null;
    this.walkSpeed = 0.48;
    this.tmpDirection = new THREE.Vector3();
    this.glowTime = 0;
    this.lampLight = null;
    this.bowlKibble = null;
    this.meal = null;
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

    let loaded = 0;
    await Promise.all(ASSETS.map(async (config) => {
      const object = await this.loadAsset(config);
      this.assets.set(config.id, object);
      loaded += 1;
      this.onLoadProgress(`Расставляем мебель: ${loaded} из ${ASSETS.length}`);
    }));
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

    for (const [index, color] of [0xff5e75, 0xffd44b, 0x6d6bf2].entries()) {
      const pencil = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.34, 10), makeMaterial(color, 0.45));
      pencil.rotation.z = Math.PI / 2;
      pencil.position.set(-0.04, 0.84, -0.22 + index * 0.2);
      pencil.castShadow = true;
      desk.add(pencil);
    }

    const paper = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.012, 0.44), makeMaterial(0xfffbef, 0.9));
    paper.position.set(-0.05, 0.825, 0.22);
    paper.rotation.y = -0.14;
    desk.add(paper);

    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), coral);
    knob.position.set(-0.135, 0.63, 0);
    desk.add(knob);

    desk.position.set(1.82, 0, 0.16);
    this.scene.add(desk);
    this.assets.set('desk', desk);
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
    // Heading first, then the lean: the monster bends towards the bowl whichever way it faces.
    this.monster.rotation.order = 'YXZ';
    this.monster.scale.copy(this.savedTransform.scale);
    this.monster.updateMatrixWorld(true);
    const originalBounds = new THREE.Box3().setFromObject(this.monster);
    const originalSize = originalBounds.getSize(new THREE.Vector3());
    const scaleFactor = 1.24 / Math.max(originalSize.y, 0.01);
    this.monster.scale.multiplyScalar(scaleFactor);
    this.monster.updateMatrixWorld(true);
    const fittedBounds = new THREE.Box3().setFromObject(this.monster);
    this.monster.position.y -= fittedBounds.min.y - FLOOR_Y;
    this.monster.traverse((child) => {
      if (child.isMesh) child.castShadow = true;
    });
    this.active = true;
    this.resize(540, 960);
    this.pickNextTask(true);
  }

  exit() {
    if (!this.active) return;
    this.active = false;
    this.currentTask = null;
    this.resumeAfterWave = null;
    this.phase = 'waiting';
    // A meal left unwatched is finished off-screen.
    this.endMeal();
    this.mixer.stopAllAction();
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
    this.camera.position.set(0, 2.98, distance - 0.25);
    this.camera.lookAt(0, 0.78, -0.08);
    this.camera.updateProjectionMatrix();
  }

  getClip(primary, fallback) {
    return this.animations.find((clip) => clip.name === primary)
      || this.animations.find((clip) => clip.name === fallback)
      || this.animations[0];
  }

  playClip(primary, { fallback = 'restpose', loop = true, repetitions = Infinity } = {}) {
    const clip = this.getClip(primary, fallback);
    if (!clip) return 2.4;
    const next = this.mixer.clipAction(clip);
    next.reset();
    next.enabled = true;
    next.setEffectiveWeight(1);
    next.setEffectiveTimeScale(1);
    next.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? repetitions : 1);
    next.clampWhenFinished = !loop;
    next.play();
    if (this.currentAction && this.currentAction !== next) {
      this.currentAction.crossFadeTo(next, 0.28, false);
    }
    this.currentAction = next;
    return clip.duration || 2.4;
  }

  setStatus(text) {
    this.onStatus(`${this.name} ${text}`);
  }

  pickNextTask(initial = false) {
    if (!this.active) return;
    const shouldWander = !initial && Math.random() < 0.24;
    if (shouldWander) {
      const point = WANDER_POINTS[Math.floor(Math.random() * WANDER_POINTS.length)];
      this.currentTask = {
        id: 'wander',
        target: point,
        lookAt: [0, 2.2],
        clip: 'restpose',
        fallback: 'restpose',
        duration: 2.2 + Math.random() * 1.8,
        walkingText: 'гуляет по комнате',
        actionText: 'осматривается вокруг',
      };
    } else {
      this.currentTask = weightedTask(this.previousTaskId);
      this.previousTaskId = this.currentTask.id;
    }
    this.walkTo(this.currentTask);
  }

  walkTo(task) {
    this.currentTask = task;
    this.target.set(task.target[0], FLOOR_Y, task.target[1]);
    this.phase = 'walking';
    this.phaseTime = 0;
    this.playClip(task.walkClip || 'Walking', { fallback: task.walkFallback || 'Thoughtful_Walk' });
    this.setStatus(task.walkingText);
  }

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
    this.resumeAfterWave = null;
    this.walkTo(MEAL_TASK);
  }

  // Pieces disappear from the top of the pile while the monster eats.
  chew(dt) {
    const kibble = this.bowlKibble;
    if (!this.meal || !kibble) return;
    this.meal.eaten = Math.min(kibble.count, this.meal.eaten + (kibble.count / MEAL_TASK.duration) * dt);
    const hidden = Math.floor(this.meal.eaten);
    for (let index = kibble.count - 1; index >= kibble.count - hidden; index -= 1) kibble.hide(kibble.pieces[index]);
    this.monster.rotation.x = MEAL_LEAN + Math.sin(this.phaseTime * MEAL_CHEW.speed) * MEAL_CHEW.amplitude;
  }

  endMeal() {
    this.monster.rotation.x = 0;
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

  beginAction(task = this.currentTask, remaining = null) {
    if (!task) return this.pickNextTask();
    this.currentTask = task;
    this.phase = 'acting';
    this.phaseTime = 0;
    this.phaseDuration = remaining ?? task.duration;
    const lookX = task.lookAt?.[0] ?? 0;
    const lookZ = task.lookAt?.[1] ?? 2.2;
    const angle = Math.atan2(lookX - this.monster.position.x, lookZ - this.monster.position.z);
    this.monster.rotation.y += shortestAngle(this.monster.rotation.y, angle);
    this.playClip(task.clip, { fallback: task.fallback, loop: true });
    this.setStatus(task.actionText);
  }

  wave() {
    if (!this.active || this.phase === 'waving') return false;
    this.resumeAfterWave = {
      task: this.currentTask,
      phase: this.phase,
      remaining: Math.max(0.8, this.phaseDuration - this.phaseTime),
    };
    this.phase = 'waving';
    this.phaseTime = 0;
    this.monster.rotation.x = 0;
    this.waveDuration = this.playClip('Big_Wave_Hello', { fallback: 'Greetings', loop: false }) + 0.18;
    const faceCamera = Math.atan2(
      this.camera.position.x - this.monster.position.x,
      this.camera.position.z - this.monster.position.z,
    );
    this.monster.rotation.y += shortestAngle(this.monster.rotation.y, faceCamera);
    this.setStatus('машет тебе!');
    return true;
  }

  resumeTask() {
    const resume = this.resumeAfterWave;
    this.resumeAfterWave = null;
    if (!resume?.task) return this.pickNextTask();
    this.currentTask = resume.task;
    if (resume.phase === 'walking') {
      this.walkTo(resume.task);
      return;
    }
    this.beginAction(resume.task, resume.remaining);
  }

  update(delta) {
    if (!this.active) return;
    const dt = Math.min(delta, 0.05);
    this.phaseTime += dt;
    this.glowTime += dt;
    if (this.lampLight) this.lampLight.intensity = 1.72 + Math.sin(this.glowTime * 1.35) * 0.12;

    if (this.phase === 'waving') {
      if (this.phaseTime >= this.waveDuration) this.resumeTask();
      return;
    }

    if (this.phase === 'walking') {
      this.tmpDirection.subVectors(this.target, this.monster.position);
      this.tmpDirection.y = 0;
      const distance = this.tmpDirection.length();
      if (distance < 0.055) {
        this.monster.position.x = this.target.x;
        this.monster.position.z = this.target.z;
        this.beginAction();
        return;
      }
      this.tmpDirection.normalize();
      const move = Math.min(distance, (this.currentTask?.walkSpeed ?? this.walkSpeed) * dt);
      this.monster.position.addScaledVector(this.tmpDirection, move);
      const desiredAngle = Math.atan2(this.tmpDirection.x, this.tmpDirection.z);
      this.monster.rotation.y += shortestAngle(this.monster.rotation.y, desiredAngle) * Math.min(1, dt * 7);
      return;
    }

    if (this.phase === 'acting') {
      const eating = this.currentTask?.id === MEAL_TASK.id;
      if (eating) this.chew(dt);
      if (this.phaseTime >= this.phaseDuration) {
        if (eating) this.endMeal();
        this.pickNextTask();
      }
    }
  }
}
