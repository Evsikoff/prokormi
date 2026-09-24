import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// The ear-cleaning mini-game: monsters keep their bogeys in their ears, so the nose cleaner goes
// into an ear. The scene is the room itself: the monster stands still, the camera flies up to one
// ear, the player drags the tool into it, stirs the handle along a few figures and pulls it out.
// This module holds the 3D side and the figure maths; the flow and the DOM live in main.js.

// The nose cleaners the game knows, by the id of their data mart row. Each model is a standing
// stick in its own units: `length` is its height, `tip` the height of the point that goes into the
// ear (the middle of the scoop or the head), `tipUp` says whether that point is at the top
// (Норма, Козилетт) or at the bottom (iКовырялка stands on its tip). `catch` is where the bogey
// sticks to the tool when it comes out, `size` scales the tool against the Норма.
const TOOLS = {
  75: { url: '/images/store/kozilett_3D.glb', length: 0.3, tip: 0.258, tipUp: true, catch: [0, 0.258, 0.036], size: 0.45 },
  76: { url: '/images/store/norma_3D.glb', length: 0.3, tip: 0.272, tipUp: true, catch: [0, 0.268, 0.012], size: 1 },
  77: { url: '/images/store/ikoviryalka_3D.glb', length: 0.065, tip: 0.0015, tipUp: false, catch: [0, -0.0012, 0], size: 0.85 },
};
const DEFAULT_TOOL_ID = 76;
// The bogey on the tool, against the length of the model.
const CATCH_SIZE = 0.07;

// Sizes in the monster's own units (its ears are 0.73 apart), so they follow the monster's scale.
const TOOL_LENGTH = 0.42;
const INSERT_DEPTH = 0.035;
// While carried, the tool moves in a plane this far from the ear towards the camera, so the cheek
// never hides it; once it is over the opening it slides into it.
const CARRY_PLANE = 0.35;

// In the space of the ear bones the ear runs along +y to its tip at y ≈ 0.36 and its pink inner side
// looks along +x for Ear_L and along −x for Ear_R (the bones are mirrored); the inner floor lies at
// |x| ≈ 0.06. The ear opening sits on that floor close to the head.
export const CLEANING_EARS = [
  { id: 'right', bone: 'Ear_R', side: -1, label: 'Правое' },
  { id: 'left', bone: 'Ear_L', side: 1, label: 'Левое' },
];
const HOLE = { x: -0.057, y: 0.092, z: 0 };

// Where the camera stands for each shot, in monster units around the focus point.
const OVERVIEW_SHOT = { target: [0, 0.78, 0], offset: [0, 0.72, 3.5] };
const EAR_SHOT = { distance: 1.05, lift: 0.34, fromHead: -0.2, drop: 0.14 };
const FLIGHT_SECONDS = 1.5;

// The ear twitches on its own: a slow flap, a quicker tremble and now and then a flick.
const EAR_FLAP = { slow: 2.1, fast: 5.3, amount: 0.07, tremble: 0.025, flickEvery: 2.6, flick: 0.2 };

const SPRING = 16;

function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function damp(rate, delta) {
  return 1 - Math.exp(-rate * delta);
}

// A soft dark spot: the opening of the ear.
function holeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(32, 32, 2, 32, 32, 31);
  gradient.addColorStop(0, 'rgba(26, 6, 14, 1)');
  gradient.addColorStop(0.55, 'rgba(58, 14, 30, 0.92)');
  gradient.addColorStop(1, 'rgba(120, 40, 60, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// A lumpy wet green blob, built once and shared by every bogey.
function bogeyGeometry() {
  const geometry = new THREE.IcosahedronGeometry(1, 3);
  const position = geometry.attributes.position;
  const point = new THREE.Vector3();
  for (let index = 0; index < position.count; index += 1) {
    point.fromBufferAttribute(position, index);
    const bump = 1 + 0.16 * Math.sin(point.x * 5.1 + point.y * 2.3) * Math.cos(point.z * 4.4 - point.x * 1.7);
    point.multiplyScalar(bump);
    position.setXYZ(index, point.x, point.y * 0.8, point.z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

// --- Figures ---------------------------------------------------------------------------------

// Figures live in a square from −1 to 1 with y pointing down, like the screen, and are drawn from
// their first point to their last: a list of corners, or a curve sampled densely.
// `accusative` finishes the hint «Нарисуй …».
function curve(count, at) {
  return Array.from({ length: count + 1 }, (_, index) => at(index / count));
}

export const FIGURES = {
  circle: {
    name: 'Круг',
    accusative: 'круг',
    points: () => curve(96, (t) => {
      const angle = -Math.PI / 2 + t * Math.PI * 2;
      return [Math.cos(angle) * 0.85, Math.sin(angle) * 0.85];
    }),
  },
  zigzag: {
    name: 'Зигзаг',
    accusative: 'зигзаг',
    points: () => [[-0.9, -0.5], [-0.45, 0.5], [0, -0.5], [0.45, 0.5], [0.9, -0.5]],
  },
  spiral: {
    name: 'Спираль',
    accusative: 'спираль',
    points: () => curve(160, (t) => {
      const angle = -Math.PI / 2 + t * Math.PI * 2 * 2.25;
      const radius = 0.14 + 0.76 * t;
      return [Math.cos(angle) * radius, Math.sin(angle) * radius];
    }),
  },
  wave: {
    name: 'Волна',
    accusative: 'волну',
    points: () => curve(96, (t) => [-0.9 + 1.8 * t, -Math.sin(t * Math.PI * 3) * 0.5]),
  },
  eight: {
    name: 'Восьмёрка',
    accusative: 'восьмёрку',
    points: () => curve(160, (t) => {
      const angle = Math.PI / 2 + t * Math.PI * 2;
      return [Math.sin(angle * 2) * 0.55, -Math.sin(angle) * 0.88];
    }),
  },
  triangle: {
    name: 'Треугольник',
    accusative: 'треугольник',
    points: () => [[0, -0.85], [0.85, 0.65], [-0.85, 0.65], [0, -0.85]],
  },
};

// The first ear gets the figures the player already knows, the second one new ones.
export const EAR_FIGURES = [
  ['circle', 'zigzag', 'spiral'],
  ['wave', 'eight', 'triangle'],
];

// Follows the finger along a figure. Progress only moves forward, and only while the finger is
// close to the path a little ahead of what is already drawn, so the figure has to be traced in
// order — but the corridor is wide: this is a game for small children.
export class FigureTracer {
  constructor(key, { centerX, centerY, size }) {
    this.key = key;
    this.figure = FIGURES[key];
    const half = size / 2;
    const corners = this.figure.points().map(([x, y]) => [centerX + x * half, centerY + y * half]);
    this.points = [];
    // Evenly spaced points, so that the progress can be measured along the path.
    const step = Math.max(2, size / 90);
    corners.forEach((point, index) => {
      if (index === 0) {
        this.points.push(point);
        return;
      }
      const [fromX, fromY] = corners[index - 1];
      const length = Math.hypot(point[0] - fromX, point[1] - fromY);
      const pieces = Math.max(1, Math.ceil(length / step));
      for (let piece = 1; piece <= pieces; piece += 1) {
        const t = piece / pieces;
        this.points.push([fromX + (point[0] - fromX) * t, fromY + (point[1] - fromY) * t]);
      }
    });
    this.lengths = [0];
    for (let index = 1; index < this.points.length; index += 1) {
      const [x, y] = this.points[index];
      const [px, py] = this.points[index - 1];
      this.lengths.push(this.lengths[index - 1] + Math.hypot(x - px, y - py));
    }
    this.total = this.lengths[this.lengths.length - 1];
    this.tolerance = Math.max(30, size * 0.14);
    this.progress = 0;
    this.index = 0;
  }

  get done() {
    return this.progress >= this.total;
  }

  get ratio() {
    return this.total ? this.progress / this.total : 0;
  }

  // True when the finger has moved the progress on.
  feed(x, y) {
    if (this.done) return false;
    const ahead = this.progress + Math.max(this.total * 0.16, this.tolerance * 2.5);
    let best = -1;
    for (let index = this.index; index < this.points.length && this.lengths[index] <= ahead; index += 1) {
      const [px, py] = this.points[index];
      if (Math.hypot(px - x, py - y) <= this.tolerance) best = index;
    }
    if (best <= this.index) return false;
    this.index = best;
    this.progress = this.lengths[best];
    // The last stretch is forgiven: a finger that has reached the end has drawn the figure.
    if (this.total - this.progress <= this.tolerance * 0.6) {
      this.index = this.points.length - 1;
      this.progress = this.total;
    }
    return true;
  }

  // The point the drawing has reached and the direction the path goes on in.
  head() {
    const last = this.points.length - 1;
    const index = Math.min(this.index, last);
    const [fromX, fromY] = this.points[Math.min(index, last - 1)];
    const [toX, toY] = this.points[Math.min(index, last - 1) + 1];
    const [x, y] = this.points[index];
    return { x, y, angle: Math.atan2(toY - fromY, toX - fromX) };
  }

  // Points spread along the path, each with the direction of the path there: the arrows.
  arrows(count) {
    return Array.from({ length: count }, (_, arrow) => {
      const distance = ((arrow + 0.5) / count) * this.total;
      const index = Math.max(1, this.lengths.findIndex((length) => length >= distance));
      const [x, y] = this.points[index];
      const [px, py] = this.points[index - 1];
      return { x, y, angle: Math.atan2(y - py, x - px) };
    });
  }

  // Back to the same share of the path, e.g. after the figure was laid out anew for a new screen size.
  restore(ratio) {
    const distance = THREE.MathUtils.clamp(ratio, 0, 1) * this.total;
    this.index = Math.max(0, this.lengths.findIndex((length) => length >= distance));
    this.progress = this.lengths[this.index];
  }

  svgPath(upTo = this.points.length - 1) {
    return this.points.slice(0, upTo + 1)
      .map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`)
      .join(' ');
  }
}

// --- The scene ------------------------------------------------------------------------------

export class EarCleaning {
  constructor({ room }) {
    this.room = room;
    this.scene = room.scene;
    this.monster = room.monster;
    this.camera = new THREE.PerspectiveCamera(42, 9 / 16, 0.02, 40);
    this.active = false;
    this.width = 540;
    this.height = 960;
    this.time = 0;
    this.building = null;
    this.tool = null;
    this.toolMesh = null;
    this.scoopBogey = null;
    this.ears = [];
    this.earIndex = 0;
    // 'idle' — the tool is away; 'aim' — the player carries it to the ear; 'inserting'; 'trace' —
    // it is in the ear and the handle follows the finger; 'pull' — it is being pulled out; 'out'.
    this.mode = 'idle';
    this.flight = null;
    this.lookTarget = new THREE.Vector3();
    this.tip = new THREE.Vector3();
    this.tipInside = new THREE.Vector3();
    this.tipGoal = new THREE.Vector3();
    this.handleEnd = new THREE.Vector3();
    this.handleGoal = new THREE.Vector3();
    this.handleTarget = null;
    this.restDirection = new THREE.Vector3(0, -1, 0);
    // Which way the ear sticks out on the screen, 1 for the right: the tool waits on that side.
    this.outward = 1;
    this.insertion = null;
    this.pullAmount = 0;
    this.pullGoal = 0;
    this.stir = 0;
    this.lastHandle = new THREE.Vector3();
    this.swing = new THREE.Vector3();
    this.frame = { hole: new THREE.Vector3(), normal: new THREE.Vector3(), axis: new THREE.Vector3() };
    this.raycaster = new THREE.Raycaster();
    this.plane = new THREE.Plane();
    this.tmp = new THREE.Vector3();
    this.tmp2 = new THREE.Vector3();
    this.tmpQuat = new THREE.Quaternion();
    this.euler = new THREE.Euler();
  }

  build(renderer) {
    this.building ??= this.load(renderer);
    return this.building;
  }

  async load(renderer) {
    // The metal needs something to reflect, or it turns black in a room without an environment map.
    const pmrem = new THREE.PMREMGenerator(renderer);
    this.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    this.models = new Map();

    this.bogeyGeometry = bogeyGeometry();
    this.bogeyMaterial = new THREE.MeshStandardMaterial({
      color: 0x8fc93a,
      emissive: 0x1f3a05,
      roughness: 0.18,
      metalness: 0,
    });
    this.scoopBogey = this.makeBogeyCluster();
    this.scoopBogey.visible = false;

    this.tool = new THREE.Group();
    this.tool.name = 'nose-cleaner';
    this.tool.visible = false;
    this.holeMaterial = new THREE.MeshBasicMaterial({
      map: holeTexture(),
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
    });
    await this.useTool(DEFAULT_TOOL_ID);
  }

  // Puts the model of the device with this data mart id into the player's hand; a device the game
  // has no model for is shown as the Норма.
  async useTool(id) {
    const key = TOOLS[id] ? Number(id) : DEFAULT_TOOL_ID;
    const spec = TOOLS[key];
    let mesh = this.models.get(key);
    if (!mesh) {
      const gltf = await new GLTFLoader().loadAsync(spec.url);
      mesh = gltf.scene;
      mesh.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow = false;
        child.receiveShadow = false;
        child.material.envMap = this.environment;
        child.material.envMapIntensity = 1.15;
        child.material.needsUpdate = true;
      });
      // The handle points along +z of the holder and the tip is at its origin, so lookAt() at the
      // end of the handle turns the whole tool around the tip.
      mesh.rotation.x = spec.tipUp ? -Math.PI / 2 : Math.PI / 2;
      mesh.position.z = spec.tipUp ? spec.tip : -spec.tip;
      this.models.set(key, mesh);
    }
    this.toolMesh?.removeFromParent();
    this.toolSpec = spec;
    this.toolMesh = mesh;
    this.scoopBogey.position.fromArray(spec.catch);
    this.catchSize = CATCH_SIZE * spec.length;
    this.scoopBogey.scale.setScalar(this.catchSize);
    mesh.add(this.scoopBogey);
    this.tool.add(mesh);
  }

  makeBogeyCluster() {
    const cluster = new THREE.Group();
    [[0, 0, 0, 1], [0.9, 0.35, 0.25, 0.55], [-0.75, -0.45, 0.3, 0.45]].forEach(([x, y, z, size]) => {
      const blob = new THREE.Mesh(this.bogeyGeometry, this.bogeyMaterial);
      blob.position.set(x, y, z);
      blob.scale.setScalar(size);
      blob.rotation.set(x * 2, y * 3, z);
      cluster.add(blob);
    });
    return cluster;
  }

  // The world size of one monster unit: the room scales the monster to its height.
  get unit() {
    return this.monster.getWorldScale(this.tmp).x;
  }

  enter() {
    if (this.active || !this.tool) return;
    this.active = true;
    this.time = 0;
    this.mode = 'idle';
    this.flight = null;
    this.camera.position.copy(this.room.camera.position);
    this.camera.quaternion.copy(this.room.camera.quaternion);
    this.room.camera.getWorldDirection(this.tmp);
    this.lookTarget.copy(this.camera.position).addScaledVector(this.tmp, 6);
    this.camera.fov = this.room.camera.fov;
    this.camera.updateProjectionMatrix();

    this.scene.add(this.tool);
    this.tool.visible = false;
    this.scoopBogey.visible = false;
    this.ears = CLEANING_EARS.map((ear) => this.decorateEar(ear));
    this.resize(this.width, this.height);
  }

  exit() {
    if (!this.active) return;
    this.active = false;
    this.mode = 'idle';
    this.flight?.resolve(false);
    this.flight = null;
    this.insertion?.resolve(false);
    this.insertion = null;
    this.tool.removeFromParent();
    for (const ear of this.ears) {
      ear.decor.removeFromParent();
      ear.bone?.quaternion.copy(ear.base);
    }
    this.ears = [];
  }

  // An opening and a bunch of bogeys in the ear, parented to its bone so they move with it.
  decorateEar({ bone: boneName, side }) {
    const bone = this.monster.getObjectByName(boneName);
    const decor = new THREE.Group();
    decor.name = `ear-cleaning-${boneName}`;
    decor.position.set(HOLE.x * side, HOLE.y, HOLE.z);
    // +z of the decor looks out of the ear, along the inner side.
    decor.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(side, 0, 0));
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.036, 28), this.holeMaterial);
    hole.position.z = 0.004;
    hole.scale.set(0.8, 1.2, 1);
    decor.add(hole);
    const bogeys = this.makeBogeyCluster();
    bogeys.position.z = 0.012;
    bogeys.scale.setScalar(0.017);
    decor.add(bogeys);
    bone?.add(decor);
    return {
      bone,
      side,
      decor,
      bogeys,
      level: 1,
      shownLevel: 1,
      pop: 0,
      // The pose the animation gave the ear, and the twitched one written over it last frame.
      base: bone ? bone.quaternion.clone() : new THREE.Quaternion(),
      twitched: null,
    };
  }

  resize(width, height) {
    if (!width || !height) return;
    this.width = width;
    this.height = height;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  // --- Camera ---

  flyTo(position, target, seconds = FLIGHT_SECONDS) {
    this.flight?.resolve(false);
    return new Promise((resolve) => {
      this.flight = {
        fromPosition: this.camera.position.clone(),
        fromTarget: this.lookTarget.clone(),
        position: position.clone(),
        target: target.clone(),
        time: 0,
        seconds,
        resolve,
      };
    });
  }

  // The whole monster, a little from above, as it tells its joke.
  flyToOverview(seconds = FLIGHT_SECONDS) {
    const unit = this.unit;
    const target = new THREE.Vector3().fromArray(OVERVIEW_SHOT.target).multiplyScalar(unit);
    target.add(new THREE.Vector3(this.monster.position.x, 0, this.monster.position.z));
    const position = target.clone().add(new THREE.Vector3().fromArray(OVERVIEW_SHOT.offset).multiplyScalar(unit));
    return this.flyTo(position, target, seconds);
  }

  // Close to one ear, looking into its inner side, with room below it for the tool.
  flyToEar(index, seconds = FLIGHT_SECONDS) {
    this.earIndex = index;
    const shot = this.earShot(index);
    this.restDirection.copy(shot.rest);
    this.outward = shot.outward;
    return this.flyTo(shot.position, shot.target, seconds);
  }

  earShot(index) {
    const unit = this.unit;
    const { hole, normal, axis } = this.stillEarFrame(index);
    const up = new THREE.Vector3(0, 1, 0);
    const view = normal.clone()
      .addScaledVector(up, EAR_SHOT.lift)
      .addScaledVector(axis, EAR_SHOT.fromHead)
      .normalize();
    const target = hole.clone().addScaledVector(up, -EAR_SHOT.drop * unit);
    const position = target.clone().addScaledVector(view, EAR_SHOT.distance * unit);
    // The handle comes out of the ear towards the player and down, a little away from the head.
    const forward = target.clone().sub(position).normalize();
    const right = forward.clone().cross(up).normalize();
    const screenUp = right.clone().cross(forward);
    const outward = Math.sign(axis.dot(right)) || 1;
    const rest = forward.clone().multiplyScalar(-0.5)
      .addScaledVector(screenUp, -0.85)
      .addScaledVector(right, outward * 0.12)
      .normalize();
    return { position, target, rest, outward };
  }

  // The frame of the ear as the pose holds it, without the twitch: the camera must not twitch too.
  stillEarFrame(index) {
    const ear = this.ears[index];
    if (!ear?.bone) return this.earFrame(index);
    const twitched = ear.bone.quaternion.clone();
    ear.bone.quaternion.copy(ear.base);
    ear.bone.updateWorldMatrix(false, true);
    const frame = this.earFrame(index);
    ear.bone.quaternion.copy(twitched);
    ear.bone.updateWorldMatrix(false, true);
    return frame;
  }

  // The opening of the ear, the way its inner side looks and the way the ear points, in world space.
  earFrame(index, out = { hole: new THREE.Vector3(), normal: new THREE.Vector3(), axis: new THREE.Vector3() }) {
    const ear = this.ears[index];
    if (!ear?.bone) return out;
    ear.decor.getWorldPosition(out.hole);
    ear.bone.getWorldQuaternion(this.tmpQuat);
    out.normal.set(ear.side, 0, 0).applyQuaternion(this.tmpQuat).normalize();
    out.axis.set(0, 1, 0).applyQuaternion(this.tmpQuat).normalize();
    return out;
  }

  // --- The tool ---

  get toolLength() {
    return TOOL_LENGTH * (this.toolSpec?.size ?? 1) * this.unit;
  }

  // From the tip to the end of the handle.
  get handleLength() {
    const spec = this.toolSpec;
    const reach = spec.tipUp ? spec.tip : spec.length - spec.tip;
    return this.toolLength * (reach / spec.length);
  }

  // The tool appears at a spot on the screen, held the way it will go into the ear.
  showTool(x, y) {
    this.mode = 'aim';
    this.scoopBogey.visible = false;
    this.tool.visible = true;
    this.tool.scale.setScalar(this.toolLength / this.toolSpec.length);
    this.screenToWorld(x, y, this.carryPlanePoint(), this.tipGoal);
    this.tip.copy(this.tipGoal);
    this.pullAmount = 0;
    this.stir = 0;
  }

  hideTool() {
    this.mode = 'idle';
    this.tool.visible = false;
  }

  // Where the player carries the tool: the scoop follows the point on the screen.
  aimAt(x, y) {
    if (this.mode !== 'aim') return;
    this.screenToWorld(x, y, this.carryPlanePoint(), this.tipGoal);
  }

  carryPlanePoint() {
    const { hole } = this.earFrame(this.earIndex, this.frame);
    return hole.clone().lerp(this.camera.position, CARRY_PLANE);
  }

  // The scoop is carried close enough: it slides into the ear by itself. Resolves when it is in.
  insert() {
    if (this.mode !== 'aim') return Promise.resolve(false);
    this.mode = 'inserting';
    return new Promise((resolve) => {
      this.insertion = { time: 0, from: this.tip.clone(), resolve };
    });
  }

  // Screen point of the scoop and of the ear opening, and how far apart they are.
  tipScreen() {
    return this.project(this.tip);
  }

  holeScreen() {
    return this.project(this.earFrame(this.earIndex, this.frame).hole);
  }

  // Where the end of the handle rests while the tool is in the ear: the centre of the figures.
  handleRestScreen() {
    const { hole } = this.earFrame(this.earIndex, this.frame);
    const end = hole.clone().addScaledVector(this.restDirection, this.handleLength - INSERT_DEPTH * this.unit);
    return this.project(end);
  }

  // The finger drags the end of the handle; no point lets it spring back to rest.
  moveHandle(x = null, y = null) {
    if (this.mode !== 'trace') return;
    this.handleTarget = x == null ? null : { x, y };
  }

  // The figures are drawn: the tool waits to be pulled out.
  beginPull() {
    if (this.mode !== 'trace') return;
    this.mode = 'pull';
    this.pullAmount = 0;
    this.pullGoal = 0;
    this.handleTarget = null;
  }

  // 0 — in the ear, 1 — out. Anything in between follows the finger.
  setPull(amount) {
    if (this.mode !== 'pull') return;
    this.pullGoal = THREE.MathUtils.clamp(amount, 0, 1);
  }

  // Out it comes, with a bogey on the scoop. Resolves when the tool has moved away from the ear.
  pullOut() {
    this.mode = 'out';
    this.pullAmount = 1;
    this.scoopBogey.visible = true;
    this.scoopBogey.scale.setScalar(this.catchSize * 0.05);
    this.setBogeys(this.earIndex, 0);
    return new Promise((resolve) => {
      this.insertion = { time: 0, out: true, resolve };
    });
  }

  // How many bogeys are left in the ear, from 1 (all) to 0; they shrink with a little pop.
  setBogeys(index, level) {
    const ear = this.ears[index];
    if (!ear) return;
    ear.level = THREE.MathUtils.clamp(level, 0, 1);
    ear.pop = 1;
  }

  // Tutorial frames: the ear opening and the tool on the screen.
  screenRect(target) {
    if (target === 'ear') {
      const { x, y } = this.holeScreen();
      const size = Math.min(this.width, this.height) * 0.3;
      return { left: x - size / 2, top: y - size / 2, width: size, height: size };
    }
    if (target === 'tool' && this.tool.visible) {
      // Worked out from the tip, so it is right even before the tool has been drawn there once.
      const tip = this.project(this.tip);
      const end = this.project(this.tmp2.copy(this.tip).addScaledVector(this.restDirection, this.handleLength));
      const pad = 26;
      return {
        left: Math.min(tip.x, end.x) - pad,
        top: Math.min(tip.y, end.y) - pad,
        width: Math.abs(tip.x - end.x) + pad * 2,
        height: Math.abs(tip.y - end.y) + pad * 2,
      };
    }
    return null;
  }

  // --- Screen and world ---

  project(point) {
    const projected = this.tmp2.copy(point).project(this.camera);
    return { x: (projected.x + 1) / 2 * this.width, y: (1 - projected.y) / 2 * this.height };
  }

  // The point under (x, y) on the plane that faces the camera and passes through `through`.
  screenToWorld(x, y, through, out) {
    const ndc = new THREE.Vector2(x / this.width * 2 - 1, -(y / this.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    this.camera.getWorldDirection(this.tmp);
    this.plane.setFromNormalAndCoplanarPoint(this.tmp, through);
    if (!this.raycaster.ray.intersectPlane(this.plane, out)) out.copy(through);
    return out;
  }

  // --- Frame by frame ---

  update(delta) {
    if (!this.active) return;
    const dt = Math.min(delta, 0.05);
    this.time += dt;
    this.updateFlight(dt);
    this.camera.lookAt(this.lookTarget);
    this.camera.updateMatrixWorld();

    // The mixer has just posed the ears; the twitch goes on top of the pose, every frame anew.
    this.ears.forEach((ear, index) => this.twitchEar(ear, index, dt));
    this.monster.updateMatrixWorld(true);
    this.updateTool(dt);
  }

  updateFlight(dt) {
    const flight = this.flight;
    if (!flight) return;
    flight.time += dt;
    const t = easeInOut(Math.min(1, flight.time / flight.seconds));
    this.camera.position.lerpVectors(flight.fromPosition, flight.position, t);
    this.lookTarget.lerpVectors(flight.fromTarget, flight.target, t);
    if (t >= 1) {
      this.flight = null;
      flight.resolve(true);
    }
  }

  twitchEar(ear, index, dt) {
    if (!ear.bone) return;
    const time = this.time + index * 1.3;
    const focused = index === this.earIndex && this.mode !== 'idle';
    // The ear being cleaned twitches more, and more still while the handle is stirred in it.
    const amount = (focused ? 1 : 0.45) + (focused ? Math.min(1.5, this.stir) : 0);
    const flickPhase = (time % EAR_FLAP.flickEvery) / EAR_FLAP.flickEvery;
    const flick = flickPhase > 0.9 ? Math.sin((flickPhase - 0.9) / 0.1 * Math.PI) * EAR_FLAP.flick : 0;
    const flap = Math.sin(time * EAR_FLAP.slow) * EAR_FLAP.amount
      + Math.sin(time * EAR_FLAP.fast + 1) * EAR_FLAP.tremble
      + flick;
    this.euler.set(flap * amount, 0, flap * 0.35 * amount * ear.side);
    // The mixer writes a bone only when the animation changes it, so on a still pose the bone
    // keeps last frame's twitch: that one is thrown away, a newly animated pose becomes the base.
    if (!ear.twitched || !ear.bone.quaternion.equals(ear.twitched)) ear.base.copy(ear.bone.quaternion);
    ear.bone.quaternion.copy(ear.base).multiply(this.tmpQuat.setFromEuler(this.euler));
    ear.twitched ??= new THREE.Quaternion();
    ear.twitched.copy(ear.bone.quaternion);

    ear.pop = Math.max(0, ear.pop - dt * 3);
    ear.shownLevel += (ear.level - ear.shownLevel) * damp(6, dt);
    const bounce = 1 + Math.sin(ear.pop * Math.PI) * 0.35;
    const size = 0.017 * Math.max(0, ear.shownLevel) * bounce;
    ear.bogeys.visible = size > 0.0015;
    ear.bogeys.scale.setScalar(Math.max(size, 0.0001));
  }

  updateTool(dt) {
    if (!this.tool.visible) return;
    const unit = this.unit;
    const { hole } = this.earFrame(this.earIndex, this.frame);
    const tipInside = this.tipInside.copy(hole).addScaledVector(this.restDirection, -INSERT_DEPTH * unit);
    const holdLength = this.handleLength;

    if (this.mode === 'aim') {
      // The tool bobs a little in the hand while it waits.
      this.tip.lerp(this.tipGoal, damp(SPRING, dt));
      this.handleEnd.copy(this.tip).addScaledVector(this.restDirection, holdLength);
      this.handleEnd.y += Math.sin(this.time * 2.4) * 0.01 * unit;
    } else if (this.mode === 'inserting') {
      const insertion = this.insertion;
      insertion.time += dt;
      // First the scoop goes to the opening, then it slides in.
      const slide = Math.min(1, insertion.time / 0.32);
      const push = THREE.MathUtils.clamp((insertion.time - 0.32) / 0.28, 0, 1);
      const atHole = this.tmp2.copy(hole).addScaledVector(this.restDirection, 0.02 * unit);
      this.tip.lerpVectors(insertion.from, atHole, easeInOut(slide));
      if (push > 0) this.tip.lerpVectors(atHole, tipInside, easeInOut(push));
      this.handleEnd.copy(this.tip).addScaledVector(this.restDirection, holdLength);
      if (push >= 1) {
        this.mode = 'trace';
        this.handleTarget = null;
        this.insertion = null;
        insertion.resolve(true);
      }
    } else if (this.mode === 'trace') {
      this.tip.copy(tipInside);
      const rest = this.tmp2.copy(this.tip).addScaledVector(this.restDirection, holdLength);
      if (this.handleTarget) {
        this.screenToWorld(this.handleTarget.x, this.handleTarget.y, rest, this.handleGoal);
        // The handle is a lever: it may swing, but not lie down on the ear.
        const swing = this.swing.subVectors(this.handleGoal, this.tip).normalize();
        if (swing.angleTo(this.restDirection) > 0.7) swing.lerp(this.restDirection, 0.35).normalize();
        this.handleGoal.copy(this.tip).addScaledVector(swing, holdLength);
      } else {
        this.handleGoal.copy(rest);
      }
      this.lastHandle.copy(this.handleEnd);
      this.handleEnd.lerp(this.handleGoal, damp(SPRING, dt));
      const speed = this.lastHandle.distanceTo(this.handleEnd) / Math.max(dt, 0.001) / unit;
      this.stir += (Math.min(2, speed * 1.4) - this.stir) * damp(5, dt);
    } else if (this.mode === 'pull' || this.mode === 'out') {
      const out = this.mode === 'out';
      if (!out) this.pullAmount += (this.pullGoal - this.pullAmount) * damp(SPRING, dt);
      if (out) {
        const insertion = this.insertion;
        insertion.time += dt;
        const leave = easeInOut(Math.min(1, insertion.time / 0.9));
        this.pullAmount = 1 + leave * 1.6;
        const grow = Math.min(1, insertion.time / 0.25);
        this.scoopBogey.scale.setScalar(this.catchSize * (1 + Math.sin(grow * Math.PI) * 0.25) * Math.max(0.05, grow));
        if (insertion.time >= 1.1) {
          this.insertion = null;
          this.mode = 'shown';
          insertion.resolve(true);
        }
      }
      // A stubborn ear: the tool comes out a bit and wiggles as the player pulls.
      const wiggle = out ? 0 : Math.sin(this.time * 38) * 0.004 * unit * this.pullAmount;
      this.tip.copy(tipInside).addScaledVector(this.restDirection, (INSERT_DEPTH + 0.05 * this.pullAmount) * unit);
      this.tip.x += wiggle;
      this.handleEnd.copy(this.tip).addScaledVector(this.restDirection, holdLength);
      this.stir = out ? 0 : this.pullAmount;
    } else if (this.mode === 'shown') {
      // The tool with its catch hangs in front of the camera for a moment.
      this.handleEnd.copy(this.tip).addScaledVector(this.restDirection, holdLength);
    }

    this.tool.position.copy(this.tip);
    this.tool.lookAt(this.handleEnd);
  }

  render(renderer) {
    renderer.render(this.scene, this.camera);
  }
}
