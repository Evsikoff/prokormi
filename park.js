import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const ASSETS = {
  court: '/park/models/park-tennis-court-base.glb',
  net: '/park/models/park-tennis-net.glb',
  fence: '/park/models/park-tennis-fence-panel.glb',
  gate: '/park/models/park-tennis-gate.glb',
  board: '/park/models/park-event-board.glb',
  max: '/park/models/park-vendor-sports-max.glb',
  kiosk: '/park/models/park-icecream-kiosk.glb',
  shop: '/park/models/park-sports-shop.glb',
  lia: '/park/models/park-vendor-icecream-lia.glb',
  racket: '/park/models/tennis_racket.glb',
};

// The walk of the episode: the monster waits by the tennis court while the camera flies in over
// the park, then runs to the ice cream kiosk, where the player decides what to buy.
const MONSTER_HEIGHT = 2.05;
const HEAD_HEIGHT = 1.2;
// On the crossing, right at the corner of the court (the court model reaches z = −1.76).
const COURT_SPOT = new THREE.Vector3(1.9, 0, -0.95);
// In front of the kiosk window.
const KIOSK_SPOT = new THREE.Vector3(-4.35, 0, 0.95);
// In front of the event board, a step to the side of the poster so that both are in the shot.
const BOARD_SPOT = new THREE.Vector3(0.9, 0, 3.3);
const RUN_SPEED = 2.7;
const TURN_SPEED = 7;
const SHOTS = {
  // From the west along the crossing: the court behind the monster, the event board and the
  // sports shop out of the way.
  court: {
    position: new THREE.Vector3(-4.6, 3.6, 1.8),
    target: COURT_SPOT.clone().setY(HEAD_HEIGHT),
  },
  // From the south, over the bench: the kiosk right behind the monster, far enough
  // to leave room for the choice panel.
  kiosk: {
    position: new THREE.Vector3(-4.9, 5.2, 10.6),
    target: KIOSK_SPOT.clone().setY(HEAD_HEIGHT),
  },
  // From the south west, so the poster on the board and the monster beside it are both in view.
  board: {
    position: new THREE.Vector3(-2.1, 3.2, 8.8),
    target: new THREE.Vector3(0.1, 1.4, 3.05),
  },
};
// The routes the monster runs: the waypoints, the camera glide that goes with them and the shot
// the camera settles into at the end.
const RUNS = {
  kiosk: {
    waypoints: [KIOSK_SPOT],
    // The camera climbs and looks down on the crossing, so the event board south of it never
    // covers the monster, then settles into the kiosk shot.
    camera: [[-3.6, 7.5, 4.2], [-3.6, 9.2, 7.6]],
    shot: SHOTS.kiosk,
    status: 'бежит к лотку с мороженым',
    arrived: 'стоит у лотка с мороженым',
  },
  // Along the crossing and around the board, which stands in the middle of the path.
  board: {
    waypoints: [new THREE.Vector3(-2.6, 0, 3.9), BOARD_SPOT],
    camera: [[-4.6, 4.6, 7.2], [-3.2, 3.4, 7.8]],
    shot: SHOTS.board,
    status: 'бежит к доске с афишей',
    arrived: 'рассматривает афишу',
  },
};
// Bird's-eye flight: high over the far corner of the park, round its west side
// and down onto the crossing, ending in the court shot.
const FLIGHT = {
  seconds: 8,
  positions: [[-18, 25, -18], [-17, 19, 1], [-11, 12, 7], [-6.5, 6.5, 4], SHOTS.court.position],
  targets: [[0, 0, -2], [0.5, 0, -2], [1.5, 0.3, -1.5], [1.9, 0.9, -1.0], SHOTS.court.target],
};
// From the end of the handle to the top of the head, in park units (the monster is 2.05 tall).
const RACKET_LENGTH = 1.15;
// The paw holds the handle this far up from its end.
const RACKET_GRIP = 0.16;
// Where a held prop sits relative to the right paw, in the monster's own axes (z forward);
// `tilt` leans it away from the face so the monster stays visible.
const HELD_PROPS = {
  racket: { offset: [0, 0, 0.06], tilt: [0.2, 0, 0.5] },
  icecream: { offset: [0, -0.04, 0.08], tilt: [0.15, 0, 0.25] },
};

// Width to height of park-festival-lights-poster.png (1086 × 1448).
const POSTER_ASPECT = 1086 / 1448;
// The display panel of the event board in the board's own axes, the board being 3 tall:
// the middle of the panel, the poster height that fits between the frame bars
// and how far in front of the board's centre the panel face is.
const BOARD_PANEL = {
  model: { y: 1.535, height: .94, depth: .066 },
  fallback: { y: 1.65, height: 1.5, depth: .24 },
};

// Lia serves from inside the kiosk, in its own axes (z towards the window): behind the counter,
// left of the soft-serve display, on the kiosk floor sunk a little so the counter (1.33 up)
// hides her below the waist; turned a little towards the spot where the monster buys.
const LIA_SPOT = { x: -.52, y: .4, z: 1.95, turn: .2 };
// The vendor model stands in an A-pose; her arms are brought this far (radians) towards her body
// so they stay clear of the tray and the display on the counter.
const LIA_ARMS_DOWN = .35;

function smootherstep(value) {
  const x = THREE.MathUtils.clamp(value, 0, 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

function shortestAngle(from, to) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

const COLORS = {
  grass: 0x8cd59a,
  darkGrass: 0x4f9b71,
  path: 0xffe3b1,
  pathEdge: 0xefbf82,
  teal: 0x20afaa,
  violet: 0x7156c8,
  yellow: 0xffcf58,
  pink: 0xff799d,
  wood: 0xa86c48,
  leaf: 0x58b779,
  leafLight: 0x8fd36e,
};

function material(color, roughness = 0.82) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.03 });
}

function addBox(parent, size, position, color, rotationY = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material(color));
  mesh.position.set(...position);
  mesh.rotation.y = rotationY;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addCylinder(parent, radiusTop, radiusBottom, height, position, color, segments = 20) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material(color));
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addSphere(parent, radius, position, color, scale = [1, 1, 1]) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 18, 12), material(color));
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

function markShadows(root) {
  root.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const item of materials) {
      if (item?.map) item.map.colorSpace = THREE.SRGBColorSpace;
    }
  });
}

function normalizeModel(root, { height = null, footprint = null } = {}) {
  markShadows(root);
  root.updateMatrixWorld(true);
  const initial = new THREE.Box3().setFromObject(root);
  const size = initial.getSize(new THREE.Vector3());
  const horizontal = Math.max(size.x, size.z, 0.001);
  const source = height ? Math.max(size.y, 0.001) : horizontal;
  const target = height ?? footprint ?? source;
  root.scale.multiplyScalar(target / source);
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  root.position.x -= center.x;
  root.position.z -= center.z;
  root.position.y -= box.min.y;
  return root;
}

function makeVendor({ shirt = COLORS.pink, apron = 0xfff0d1 } = {}) {
  const group = new THREE.Group();
  addCylinder(group, 0.38, 0.48, 0.88, [0, 1.03, 0], shirt, 16);
  addSphere(group, 0.31, [0, 1.72, 0], 0xf1ba87, [0.93, 1.05, 0.92]);
  addBox(group, [0.62, 0.58, 0.08], [0, 1.05, 0.42], apron);
  addCylinder(group, 0.11, 0.12, 0.7, [-0.46, 1.07, 0], 0xf1ba87, 12).rotation.z = -0.12;
  addCylinder(group, 0.11, 0.12, 0.7, [0.46, 1.07, 0], 0xf1ba87, 12).rotation.z = 0.12;
  addCylinder(group, 0.14, 0.14, 0.65, [-0.2, 0.35, 0], 0x525475, 12);
  addCylinder(group, 0.14, 0.14, 0.65, [0.2, 0.35, 0], 0x525475, 12);
  addCylinder(group, 0.36, 0.42, 0.18, [0, 2.02, 0], 0xfff2cf, 18);
  return group;
}

function makeIceCreamKiosk() {
  const group = new THREE.Group();
  addCylinder(group, 2.1, 2.1, 2.6, [0, 1.3, -0.15], COLORS.teal, 24);
  const opening = addBox(group, [3.1, 1.45, 0.25], [0, 1.35, 1.98], 0x194a59);
  opening.castShadow = false;
  addBox(group, [3.6, 0.3, 0.8], [0, 0.72, 2.05], 0xfff0d1);
  addCylinder(group, 2.42, 2.15, 0.52, [0, 2.83, -0.15], 0xfff0d1, 24);
  addCylinder(group, 1.02, 2.15, 0.82, [0, 3.45, -0.15], COLORS.pink, 24);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.8, 16), material(0xd89954));
  cone.position.set(0, 4.15, 0.25);
  cone.rotation.z = Math.PI;
  cone.castShadow = true;
  group.add(cone);
  addSphere(group, 0.34, [0, 4.67, 0.25], 0xffe3f0);
  addSphere(group, 0.29, [-0.24, 4.78, 0.25], 0xb5e7c5);
  addSphere(group, 0.29, [0.24, 4.8, 0.25], 0xffd269);
  return group;
}

function makeSportsShop() {
  const group = new THREE.Group();
  addBox(group, [4.8, 0.28, 3.4], [0, 0.14, 0], 0xb8dcce);
  addBox(group, [4.8, 3.25, 0.26], [0, 1.76, -1.55], 0x5c62ae);
  addBox(group, [0.25, 3.25, 3.2], [-2.28, 1.76, 0], 0x6f78c9);
  addBox(group, [0.25, 3.25, 3.2], [2.28, 1.76, 0], 0x6f78c9);
  addBox(group, [5.15, 0.42, 3.65], [0, 3.5, 0], COLORS.yellow);
  addBox(group, [4.4, 0.28, 0.8], [0, 1.02, 1.42], 0xfff0d1);
  addBox(group, [3.7, 0.58, 0.16], [0, 2.7, 1.61], COLORS.teal);
  const sign = document.createElement('canvas');
  sign.width = 512;
  sign.height = 96;
  const context = sign.getContext('2d');
  context.fillStyle = '#20afaa';
  context.fillRect(0, 0, sign.width, sign.height);
  context.fillStyle = '#fff8dc';
  context.font = '700 44px sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('СПОРТ', sign.width / 2, sign.height / 2 + 2);
  const signMaterial = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sign) });
  signMaterial.map.colorSpace = THREE.SRGBColorSpace;
  const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 0.65), signMaterial);
  signMesh.position.set(0, 2.7, 1.71);
  group.add(signMesh);
  for (const x of [-1.45, -0.48, 0.48, 1.45]) addSphere(group, 0.25, [x, 1.55, 1.52], x < 0 ? COLORS.pink : COLORS.yellow);
  return group;
}

function makeBoard() {
  const group = new THREE.Group();
  addBox(group, [2.9, 2.05, 0.22], [0, 1.65, 0], COLORS.wood);
  addBox(group, [2.55, 1.68, 0.18], [0, 1.65, 0.14], 0xf6ddae);
  addCylinder(group, 0.11, 0.13, 1.25, [-1.1, 0.55, 0], COLORS.wood, 12);
  addCylinder(group, 0.11, 0.13, 1.25, [1.1, 0.55, 0], COLORS.wood, 12);
  const roof = addBox(group, [3.35, 0.25, 0.72], [0, 2.83, 0], 0x714b48);
  roof.rotation.z = 0.03;
  return group;
}

function makeCourtBase() {
  const group = new THREE.Group();
  addBox(group, [10.8, 0.18, 5.8], [0, 0.09, 0], 0x3c9e8a);
  addBox(group, [10.2, 0.035, 0.06], [0, 0.2, 0], 0xf8f4dd);
  for (const z of [-2.55, 2.55]) addBox(group, [10.2, 0.035, 0.08], [0, 0.2, z], 0xf8f4dd);
  for (const x of [-4.8, 4.8]) addBox(group, [0.08, 0.035, 5.15], [x, 0.2, 0], 0xf8f4dd);
  return group;
}

function makeCourtNet() {
  const group = new THREE.Group();
  for (const x of [-2.85, 2.85]) addCylinder(group, 0.07, 0.07, 1.25, [x, 0.64, 0], 0xf4f1df, 10);
  const netMaterial = new THREE.MeshBasicMaterial({ color: 0xf7f4e9, wireframe: true, transparent: true, opacity: 0.75 });
  const net = new THREE.Mesh(new THREE.PlaneGeometry(5.7, 1.05, 18, 5), netMaterial);
  net.position.y = 0.67;
  group.add(net);
  return group;
}

function makeFencePanel() {
  const group = new THREE.Group();
  const frame = material(0xdce9df);
  for (const x of [-1.7, 1.7]) addCylinder(group, 0.045, 0.055, 2.3, [x, 1.15, 0], 0xdce9df, 8);
  for (const y of [0.08, 2.23]) addBox(group, [3.45, 0.08, 0.08], [0, y, 0], 0xdce9df);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(3.35, 2.08, 12, 8), new THREE.MeshBasicMaterial({ color: 0xa9c9b9, wireframe: true, transparent: true, opacity: 0.55 }));
  mesh.position.y = 1.15;
  group.add(mesh);
  group.userData.frameMaterial = frame;
  return group;
}

function makeGate() {
  const group = makeFencePanel();
  group.scale.x = 0.65;
  return group;
}

// The racket model lies diagonally in its box, the end of the handle in the lower left corner
// and the head in the upper right one: it is stood upright with the grip at the origin.
function uprightRacket(model) {
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const axis = new THREE.Vector2(box.max.x - box.min.x, box.max.y - box.min.y);
  model.position.x -= box.min.x;
  model.position.y -= box.min.y;
  model.position.z -= (box.min.z + box.max.z) / 2;
  const turn = new THREE.Group();
  turn.rotation.z = Math.atan2(axis.x, axis.y);
  turn.add(model);
  const pivot = new THREE.Group();
  pivot.add(turn);
  turn.position.y = -RACKET_GRIP * axis.length();
  pivot.scale.setScalar(RACKET_LENGTH / axis.length());
  return pivot;
}

// Swings both upper arms of a Mixamo-rigged model towards its sides, about its forward axis.
function lowerArms(root, angle) {
  root.updateMatrixWorld(true);
  const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(root.getWorldQuaternion(new THREE.Quaternion()));
  for (const [name, side] of [['mixamorigLeftArm', -1], ['mixamorigRightArm', 1]]) {
    const bone = root.getObjectByName(name);
    if (!bone) continue;
    const axis = forward.clone().applyQuaternion(bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert());
    bone.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(axis, side * angle));
  }
}

function makeRacket() {
  const group = new THREE.Group();
  addCylinder(group, 0.025, 0.03, 0.34, [0, 0.17, 0], 0x4d3a6b, 10);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.022, 8, 28), material(COLORS.teal));
  rim.scale.set(0.82, 1.1, 1);
  rim.position.y = 0.55;
  group.add(rim);
  const strings = new THREE.Mesh(
    new THREE.CircleGeometry(0.18, 24),
    new THREE.MeshBasicMaterial({ color: 0xf7f4e9, wireframe: true, transparent: true, opacity: 0.7 }),
  );
  strings.scale.set(0.82, 1.1, 1);
  strings.position.y = 0.55;
  group.add(strings);
  return group;
}

// A cone with two scoops, like the one on the kiosk roof, small enough for a paw.
function makeIceCream() {
  const group = new THREE.Group();
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 14), material(0xd89954));
  cone.rotation.z = Math.PI;
  cone.position.y = 0.15;
  cone.castShadow = true;
  group.add(cone);
  addSphere(group, 0.1, [0, 0.32, 0], 0xffe3f0);
  addSphere(group, 0.085, [0.02, 0.44, 0.01], 0xb5e7c5);
  return group;
}

export class MonsterPark {
  constructor({ monster, mixer, animations, onStatus, onLoadProgress } = {}) {
    this.monster = monster;
    this.mixer = mixer;
    this.animations = animations || [];
    this.onStatus = onStatus || (() => {});
    this.onLoadProgress = onLoadProgress || (() => {});
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xbce9f5);
    this.scene.fog = new THREE.Fog(0xbce9f5, 52, 96);
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
    this.loader = new GLTFLoader();
    this.active = false;
    this.ready = false;
    this.elapsed = 0;
    this.monsterHome = null;
    this.lanterns = [];
    this.name = 'Монстрик';
    this.size = { width: 0, height: 0 };
    // What the camera looks from and at; flights and the run move these, update() applies them.
    this.view = { position: new THREE.Vector3(), target: new THREE.Vector3() };
    // Screen space taken by the HUD and the panels; the picture is shifted to stay between them.
    this.insets = { top: 0, bottom: 0 };
    this.appliedInsets = { top: 0, bottom: 0 };
    this.flight = null;
    this.run = null;
    this.turn = null;
    this.timers = [];
    this.currentAction = null;
    this.props = {};
    this.heldProp = null;
    this.hand = null;
    this.tmpVector = new THREE.Vector3();
    this.tmpQuaternion = new THREE.Quaternion();
  }

  async initialize() {
    if (this.ready) return;
    this.onLoadProgress('Высаживаем деревья…');
    this.buildEnvironment();
    this.onLoadProgress('Расставляем места для прогулки…');
    await this.buildLandmarks();
    this.ready = true;
  }

  buildEnvironment() {
    this.scene.add(new THREE.HemisphereLight(0xfff5dc, 0x437a69, 2.5));
    const sun = new THREE.DirectionalLight(0xfff1d2, 3.3);
    sun.position.set(-10, 22, 13);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -24;
    sun.shadow.camera.right = 24;
    sun.shadow.camera.top = 24;
    sun.shadow.camera.bottom = -24;
    this.scene.add(sun);

    const ground = new THREE.Mesh(new THREE.CircleGeometry(20, 64), material(COLORS.grass));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const path = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 29), material(COLORS.path));
    path.rotation.x = -Math.PI / 2;
    path.position.set(-0.5, 0.025, -1);
    path.receiveShadow = true;
    this.scene.add(path);
    const crossing = new THREE.Mesh(new THREE.PlaneGeometry(15, 3.2), material(COLORS.path));
    crossing.rotation.x = -Math.PI / 2;
    crossing.position.set(0, 0.03, 0.5);
    crossing.receiveShadow = true;
    this.scene.add(crossing);

    for (const [x, z, scale] of [[-8,-8,1.05],[-8,5,.92],[-6.8,10,.82],[8,9,1],[8.5,-3,.9],[0,-12,1.1],[-9.2,-1,.86]]) {
      this.addTree(x, z, scale);
    }
    // The second bench stands on the east edge of the main path, facing across it,
    // out of the way of the sports shop entrance.
    for (const [x, z, rotation] of [[-4.6,5.8,-.2],[1.25,7.4,-Math.PI/2],[-6,-8,.05]]) this.addBench(x, z, rotation);
    for (const [x, z] of [[-3.25,8],[2.2,5],[-3.25,5.2],[2.2,-2.5],[-3.25,-7.5]]) this.addLantern(x, z);
  }

  addTree(x, z, scale) {
    const group = new THREE.Group();
    addCylinder(group, 0.32, 0.48, 2.5, [0, 1.25, 0], COLORS.wood, 12);
    addSphere(group, 1.55, [0, 3.05, 0], COLORS.leaf, [1, .9, 1]);
    addSphere(group, 1.0, [-.8, 3.3, .2], COLORS.leafLight, [1, .86, 1]);
    addSphere(group, .9, [.9, 3.15, -.15], COLORS.leafLight, [1, .9, 1]);
    group.position.set(x, 0, z);
    group.scale.setScalar(scale);
    this.scene.add(group);
  }

  addBench(x, z, rotation) {
    const group = new THREE.Group();
    addBox(group, [2.4, .18, .72], [0, .72, 0], COLORS.wood);
    addBox(group, [2.4, .85, .16], [0, 1.15, -.3], 0x875a47);
    for (const px of [-.9,.9]) addBox(group, [.16,.7,.16], [px,.35,0], 0x4c6561);
    group.position.set(x, 0, z);
    group.rotation.y = rotation;
    this.scene.add(group);
  }

  addLantern(x, z) {
    const group = new THREE.Group();
    addCylinder(group, .08, .1, 2.7, [0,1.35,0], 0x4d6667, 10);
    addSphere(group, .22, [0,2.68,0], COLORS.yellow);
    const light = new THREE.PointLight(0xffcf7a, 0.65, 5.5, 2);
    light.position.set(0, 2.65, 0);
    group.add(light);
    group.position.set(x, 0, z);
    this.scene.add(group);
    this.lanterns.push(light);
  }

  async loadOrFallback(url, options, fallback) {
    try {
      const gltf = await this.loader.loadAsync(url);
      return normalizeModel(gltf.scene, options);
    } catch (error) {
      console.info(`Для ${url} используется составной макет.`, error);
      const model = fallback();
      model.userData.fallback = true;
      return model;
    }
  }

  async buildLandmarks() {
    const jobs = [
      [ASSETS.court, { footprint: 10.8 }, makeCourtBase],
      [ASSETS.net, { footprint: 5.8 }, makeCourtNet],
      [ASSETS.fence, { footprint: 3.4 }, makeFencePanel],
      [ASSETS.gate, { height: 2.3 }, makeGate],
      [ASSETS.board, { height: 3.0 }, makeBoard],
      [ASSETS.max, { height: 1.8 }, () => makeVendor({ shirt: COLORS.violet })],
      [ASSETS.kiosk, { height: 5.0 }, makeIceCreamKiosk],
      [ASSETS.shop, { footprint: 5.2 }, makeSportsShop],
      [ASSETS.lia, { height: 1.75 }, () => makeVendor({ shirt: COLORS.pink })],
      [ASSETS.racket, {}, makeRacket],
    ];
    let loaded = 0;
    const parts = await Promise.all(jobs.map(async ([url, options, fallback]) => {
      const result = await this.loadOrFallback(url, options, fallback);
      loaded += 1;
      this.onLoadProgress(`Расставляем объекты: ${loaded} из ${jobs.length}`);
      return result;
    }));
    const [court, net, fence, gate, board, max, kiosk, shop, lia, racket] = parts;
    this.props.racket = this.makeHeldProp(racket.userData.fallback ? racket : uprightRacket(racket));
    this.props.icecream = this.makeHeldProp(makeIceCream());

    const courtGroup = new THREE.Group();
    courtGroup.add(court);
    net.position.y = .08;
    courtGroup.add(net);
    for (const [x,z,ry] of [[-3.4,-3.05,0],[0,-3.05,0],[3.4,-3.05,0],[-3.4,3.05,Math.PI],[0,3.05,Math.PI],[3.4,3.05,Math.PI],[-5.45,-1.7,Math.PI/2],[-5.45,1.7,Math.PI/2],[5.45,-1.7,-Math.PI/2]]) {
      const panel = fence.clone(true);
      panel.position.set(x, .08, z);
      panel.rotation.y = ry;
      courtGroup.add(panel);
    }
    gate.position.set(5.45, .08, 1.7);
    gate.rotation.y = -Math.PI / 2;
    courtGroup.add(gate);
    courtGroup.position.set(4.3, 0, -5.8);
    courtGroup.rotation.y = -.05;
    courtGroup.scale.setScalar(.72);
    this.scene.add(courtGroup);

    kiosk.position.set(-4.8, 0, -2.7);
    kiosk.rotation.y = .16;
    this.scene.add(kiosk);
    lia.position.set(LIA_SPOT.x, LIA_SPOT.y, LIA_SPOT.z).applyAxisAngle(new THREE.Vector3(0, 1, 0), kiosk.rotation.y).add(kiosk.position);
    lia.rotation.y = kiosk.rotation.y + LIA_SPOT.turn;
    lowerArms(lia, LIA_ARMS_DOWN);
    this.scene.add(lia);

    shop.position.set(4.9, 0, 3.7);
    shop.rotation.y = -.14;
    this.scene.add(shop);
    max.position.set(2.8, 0, 4.8);
    max.rotation.y = -.25;
    this.scene.add(max);

    board.position.set(-.5, 0, 2.05);
    board.rotation.y = -.03;
    this.scene.add(board);
    this.addPoster(board);
  }

  // The poster keeps its own upright proportions and lies flat on the board's panel,
  // between the frame bars, turned with the board.
  addPoster(board) {
    const texture = new THREE.TextureLoader().load('/park/textures/park-festival-lights-poster.png');
    texture.colorSpace = THREE.SRGBColorSpace;
    const panel = board.userData.fallback ? BOARD_PANEL.fallback : BOARD_PANEL.model;
    const poster = new THREE.Mesh(
      new THREE.PlaneGeometry(panel.height * POSTER_ASPECT, panel.height),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide }),
    );
    poster.position.set(
      board.position.x + Math.sin(board.rotation.y) * panel.depth,
      panel.y,
      board.position.z + Math.cos(board.rotation.y) * panel.depth,
    );
    poster.rotation.y = board.rotation.y;
    this.scene.add(poster);
  }

  // A held prop is scaled once here and later follows the hand in update().
  makeHeldProp(object) {
    const group = new THREE.Group();
    group.add(object);
    group.visible = false;
    this.scene.add(group);
    return group;
  }

  // `stage` is where the walk starts: 'court' for the whole walk with the flight,
  // 'kiosk' to come back straight to the decision.
  enter(name = 'Монстрик', { stage = 'court' } = {}) {
    if (this.active) return;
    this.active = true;
    this.name = name;
    this.monsterHome = {
      parent: this.monster.parent,
      position: this.monster.position.clone(),
      quaternion: this.monster.quaternion.clone(),
      scale: this.monster.scale.clone(),
    };
    this.scene.add(this.monster);
    this.monster.position.set(0, 0, 0);
    this.monster.rotation.set(0, 0, 0);
    this.monster.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(this.monster);
    const height = Math.max(.001, box.max.y - box.min.y);
    this.monster.scale.multiplyScalar(MONSTER_HEIGHT / height);
    this.monster.updateMatrixWorld(true);
    const grounded = new THREE.Box3().setFromObject(this.monster);
    this.monster.position.y -= grounded.min.y;
    this.hand = this.monster.getObjectByName('mixamorigRightHand');

    const atKiosk = stage === 'kiosk';
    const spot = atKiosk ? KIOSK_SPOT : COURT_SPOT;
    const shot = atKiosk ? SHOTS.kiosk : SHOTS.court;
    this.monster.position.x = spot.x;
    this.monster.position.z = spot.z;
    this.monster.rotation.y = Math.atan2(shot.position.x - spot.x, shot.position.z - spot.z);
    if (atKiosk) {
      this.view.position.copy(shot.position);
      this.view.target.copy(shot.target);
    } else {
      this.view.position.fromArray(FLIGHT.positions[0]);
      this.view.target.fromArray(FLIGHT.targets[0]);
    }
    this.insets = { top: 0, bottom: 0 };
    this.appliedInsets = { top: 0, bottom: 0 };
    this.holdProp(null);
    this.playClip('restpose');
    this.setStatus(atKiosk ? 'ждёт тебя у лотка с мороженым' : 'пришёл на прогулку в парк');
    this.applyView();
  }

  setStatus(text) {
    this.onStatus(`${this.name} ${text}`);
  }

  getClip(primary, fallback) {
    return this.animations.find((clip) => clip.name === primary)
      || this.animations.find((clip) => clip.name === fallback)
      || this.animations.find((clip) => clip.name === 'restpose')
      || this.animations[0];
  }

  // Cross-fades into the clip and returns its length in seconds.
  playClip(primary, { fallback = 'restpose', loop = true } = {}) {
    const clip = this.getClip(primary, fallback);
    if (!clip || !this.mixer) return 0;
    const next = this.mixer.clipAction(clip);
    next.reset();
    next.enabled = true;
    next.setEffectiveWeight(1);
    next.setEffectiveTimeScale(1);
    next.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
    next.clampWhenFinished = !loop;
    next.play();
    if (this.currentAction && this.currentAction !== next) this.currentAction.crossFadeTo(next, .28, false);
    this.currentAction = next;
    return clip.duration || 0;
  }

  // Resolves after `seconds` of scene time, so a throttled render loop slows the walk down
  // instead of letting the story run ahead of the picture. Leaving the park resolves it with false.
  wait(seconds) {
    if (!this.active) return Promise.resolve(false);
    return new Promise((resolve) => this.timers.push({ left: seconds, resolve }));
  }

  // The bird's-eye flight over the park that ends in front of the monster by the court.
  flyIn() {
    if (!this.active) return Promise.resolve(false);
    const toCurve = (points) => new THREE.CatmullRomCurve3(
      points.map((point) => (point.isVector3 ? point.clone() : new THREE.Vector3(...point))),
      false,
      'centripetal',
    );
    return new Promise((resolve) => {
      this.flight = { positions: toCurve(FLIGHT.positions), targets: toCurve(FLIGHT.targets), time: 0, resolve };
    });
  }

  // Waves to the player and turns back to standing.
  async wave() {
    this.faceCamera();
    const seconds = this.playClip('Big_Wave_Hello', { fallback: 'Greetings', loop: false });
    this.setStatus('машет тебе!');
    const waited = await this.wait(Math.max(.6, seconds - .15));
    if (waited) this.playClip('restpose');
    return waited;
  }

  // A clip for a while, facing the player: joy, a dance, disappointment.
  async react(clip, seconds, { fallback = 'restpose', status = '' } = {}) {
    this.faceCamera();
    this.playClip(clip, { fallback, loop: true });
    if (status) this.setStatus(status);
    const waited = await this.wait(seconds);
    if (waited) this.playClip('restpose');
    return waited;
  }

  // `name` is one of the routes in RUNS: the monster runs it while the camera glides along.
  runTo(name) {
    if (!this.active) return Promise.resolve(false);
    const route = RUNS[name];
    if (!route) return Promise.resolve(false);
    const points = [this.monster.position.clone().setY(0), ...route.waypoints.map((point) => point.clone())];
    let length = 0;
    for (let index = 1; index < points.length; index += 1) length += points[index].distanceTo(points[index - 1]);
    const camera = new THREE.CatmullRomCurve3(
      [this.view.position, ...route.camera.map((point) => new THREE.Vector3(...point)), route.shot.position]
        .map((point) => point.clone()),
      false,
      'centripetal',
    );
    this.playClip('Running', { fallback: 'Walking' });
    this.setStatus(route.status);
    return new Promise((resolve) => {
      this.run = { points, index: 1, travelled: 0, length: Math.max(length, .001), camera, route, resolve };
    });
  }

  // 'racket', 'icecream' or null: what the monster holds in its right paw.
  holdProp(name) {
    for (const [key, prop] of Object.entries(this.props)) prop.visible = key === name;
    this.heldProp = name && this.props[name] ? name : null;
    if (this.heldProp) this.updateHeldProp();
  }

  faceCamera(position = this.view.position) {
    const angle = Math.atan2(position.x - this.monster.position.x, position.z - this.monster.position.z);
    this.turn = { angle };
  }

  setInsets(top, bottom) {
    this.insets = { top: Math.max(0, top || 0), bottom: Math.max(0, bottom || 0) };
  }

  exit() {
    if (!this.active) return;
    this.active = false;
    this.flight?.resolve(false);
    this.run?.resolve(false);
    this.timers.forEach((timer) => timer.resolve(false));
    this.flight = null;
    this.run = null;
    this.turn = null;
    this.timers = [];
    this.holdProp(null);
    this.currentAction = null;
    this.mixer?.stopAllAction();
    this.camera.clearViewOffset();
    if (this.monsterHome?.parent) this.monsterHome.parent.add(this.monster);
    if (this.monsterHome) {
      this.monster.position.copy(this.monsterHome.position);
      this.monster.quaternion.copy(this.monsterHome.quaternion);
      this.monster.scale.copy(this.monsterHome.scale);
    }
    this.monsterHome = null;
  }

  resize(width, height) {
    if (!width || !height) return;
    this.size = { width, height };
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.applyView();
  }

  updateFlight(dt) {
    const flight = this.flight;
    if (!flight) return;
    flight.time += dt;
    const progress = flight.time / FLIGHT.seconds;
    if (progress < 1) {
      // getPointAt() can step past the last point when rounding lands just above 1, so the very
      // end is not sampled: the last frame is set straight to the court shot below.
      const eased = Math.min(smootherstep(progress), .9999);
      flight.positions.getPointAt(eased, this.view.position);
      flight.targets.getPointAt(eased, this.view.target);
      return;
    }
    this.view.position.copy(SHOTS.court.position);
    this.view.target.copy(SHOTS.court.target);
    this.flight = null;
    flight.resolve(true);
  }

  // The monster runs along the waypoints; the camera glides from the court shot to the kiosk
  // shot in step with it.
  updateRun(dt) {
    const run = this.run;
    if (!run) return;
    let step = RUN_SPEED * dt;
    while (step > 0 && run.index < run.points.length) {
      const target = run.points[run.index];
      this.tmpVector.subVectors(target, this.monster.position).setY(0);
      const distance = this.tmpVector.length();
      if (distance <= step) {
        this.monster.position.x = target.x;
        this.monster.position.z = target.z;
        run.travelled += distance;
        step -= distance;
        run.index += 1;
        continue;
      }
      this.tmpVector.normalize();
      this.monster.position.addScaledVector(this.tmpVector, step);
      run.travelled += step;
      const angle = Math.atan2(this.tmpVector.x, this.tmpVector.z);
      this.monster.rotation.y += shortestAngle(this.monster.rotation.y, angle) * Math.min(1, dt * TURN_SPEED);
      step = 0;
    }

    const progress = Math.min(1, run.travelled / run.length);
    run.camera.getPointAt(Math.min(smootherstep(progress), .9999), this.view.position);
    this.tmpVector.copy(this.monster.position).setY(HEAD_HEIGHT);
    this.view.target.lerpVectors(this.tmpVector, run.route.shot.target, THREE.MathUtils.smoothstep(progress, .7, 1));

    if (run.index < run.points.length) return;
    this.run = null;
    this.view.position.copy(run.route.shot.position);
    this.view.target.copy(run.route.shot.target);
    this.playClip('restpose');
    this.faceCamera(run.route.shot.position);
    this.setStatus(run.route.arrived);
    run.resolve(true);
  }

  updateTimers(dt) {
    if (!this.timers.length) return;
    const due = [];
    this.timers = this.timers.filter((timer) => {
      timer.left -= dt;
      if (timer.left > 0) return true;
      due.push(timer);
      return false;
    });
    due.forEach((timer) => timer.resolve(true));
  }

  updateHeldProp() {
    const prop = this.props[this.heldProp];
    if (!prop || !this.hand) return;
    const settings = HELD_PROPS[this.heldProp];
    this.hand.getWorldPosition(prop.position);
    this.tmpVector.fromArray(settings.offset).applyQuaternion(this.monster.quaternion);
    prop.position.add(this.tmpVector);
    this.tmpQuaternion.setFromEuler(new THREE.Euler(...settings.tilt));
    prop.quaternion.copy(this.monster.quaternion).multiply(this.tmpQuaternion);
  }

  // The panels cover the bottom of the screen, so the picture is shifted up to keep
  // the monster in the middle of what is still visible.
  applyView() {
    const { width, height } = this.size;
    const shift = (this.appliedInsets.bottom - this.appliedInsets.top) / 2;
    if (width && height && Math.abs(shift) > .5) this.camera.setViewOffset(width, height, 0, shift, width, height);
    else this.camera.clearViewOffset();
    this.camera.position.copy(this.view.position);
    this.camera.lookAt(this.view.target);
  }

  update(delta) {
    if (!this.active) return;
    const dt = Math.min(delta, .05);
    this.elapsed += dt;
    this.lanterns.forEach((light, index) => {
      light.intensity = .58 + Math.sin(this.elapsed * 1.4 + index) * .07;
    });
    this.updateFlight(dt);
    this.updateRun(dt);
    if (this.turn) {
      const left = shortestAngle(this.monster.rotation.y, this.turn.angle);
      this.monster.rotation.y += left * Math.min(1, dt * TURN_SPEED);
      if (Math.abs(left) < .01) this.turn = null;
    }
    const ease = Math.min(1, dt * 6);
    this.appliedInsets.top += (this.insets.top - this.appliedInsets.top) * ease;
    this.appliedInsets.bottom += (this.insets.bottom - this.appliedInsets.bottom) * ease;
    this.applyView();
    this.updateTimers(dt);
  }

  render(renderer) {
    // The hand follows the animation mixer, which has already run for this frame.
    this.monster.updateMatrixWorld(true);
    if (this.heldProp) this.updateHeldProp();
    renderer.render(this.scene, this.camera);
  }
}
