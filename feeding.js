import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { bowlInterior, Kibble } from './kibble.js';
import { BOX, fitCamera, loadPackagingMaterials, roundedRect, screenRectOf } from './shop.js';

const FOV = 36;
const TOP_FACE = 2; // material slot of the +y face in THREE.BoxGeometry

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
const FONT = '"Arial Rounded MT Bold", "Trebuchet MS", system-ui, sans-serif';

// --- Packs -----------------------------------------------------------------

// The top of an open pack seen from above: a carton rim around the dark inside full of food.
function makeOpeningTexture(anisotropy) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = Math.round(canvas.width * (BOX.depth / BOX.width));
  const context = canvas.getContext('2d');
  const { width, height } = canvas;
  context.fillStyle = '#efe4d2';
  context.fillRect(0, 0, width, height);
  context.fillStyle = '#3a2413';
  context.fillRect(12, 12, width - 24, height - 24);
  const shades = ['#6f3f1f', '#8a5330', '#9c6334', '#b07640', '#5b3219'];
  for (let index = 0; index < 150; index += 1) {
    context.beginPath();
    context.ellipse(
      18 + Math.random() * (width - 36),
      18 + Math.random() * (height - 36),
      5 + Math.random() * 4,
      4 + Math.random() * 3,
      Math.random() * Math.PI,
      0,
      Math.PI * 2,
    );
    context.fillStyle = shades[index % shades.length];
    context.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  return texture;
}

// A pack of food: the box in its packaging, and for an open pack a torn-open top that shows the food
// inside, with two flaps standing up to the sides. Every pack owns its materials, so it can be tinted.
function createPack(materials, { open, scale = 1, openingTexture }) {
  const width = BOX.width * scale;
  const height = BOX.height * scale;
  const depth = BOX.depth * scale;
  const faces = materials.map((material) => material.clone());
  if (open) faces[TOP_FACE] = new THREE.MeshStandardMaterial({ map: openingTexture, roughness: 0.92, metalness: 0 });

  const group = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), faces);
  box.castShadow = true;
  box.receiveShadow = true;
  group.add(box);

  if (open) {
    const flapMaterial = materials[TOP_FACE].clone();
    flapMaterial.side = THREE.DoubleSide;
    const flapLength = width * 0.44;
    const flapGeometry = new THREE.PlaneGeometry(flapLength, depth);
    for (const side of [-1, 1]) {
      const hinge = new THREE.Group();
      hinge.position.set((side * width) / 2, height / 2, 0);
      hinge.rotation.z = -side * 2.2;
      const flap = new THREE.Mesh(flapGeometry, flapMaterial);
      flap.rotation.x = -Math.PI / 2;
      flap.position.x = (-side * flapLength) / 2;
      flap.castShadow = true;
      hinge.add(flap);
      group.add(hinge);
    }
  }

  group.userData.faces = faces;
  group.userData.size = { width, height, depth };
  return group;
}

function disposePack(group) {
  group.traverse((child) => {
    if (!child.isMesh) return;
    child.geometry.dispose();
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    // Textures belong to the shared packaging materials, only the clones are dropped.
    materials.forEach((material) => material.dispose());
  });
}

// --- Pantry shelf ----------------------------------------------------------

const PANTRY_SLOTS = 5;
const PANTRY_SLOT_GAP = 0.26;
const PANTRY = { post: 0.18, board: 0.14, plinth: 1.25, headroom: 0.75, top: 0.2, depth: 1.9 };
const PANTRY_RAIL = { height: 1.1, lip: 0.1, thickness: 0.08 };
const PANTRY_TAG = { width: 2.1, height: 0.98 };
const PANTRY_COLORS = {
  background: 0xcff4f2,
  wall: 0xbfe7e0,
  floor: 0xe3c9a0,
  wood: 0xd9a968,
  back: 0xfff4e0,
  board: 0xfffaf0,
  rail: 0x2dc4c2,
};
const PANTRY_CAMERA = { yaw: 6, pitch: 13 };
const SELECT_SECONDS = 0.28;
const SELECT_OFFSET = new THREE.Vector3(0, 0.35, 0.95);
const SELECT_GLOW = 0x3a2d00;

// A label on the shelf rail under a pack: whether the pack is open and, in big figures, how many grams
// are left. The name of the food is already on the pack itself.
function makePackTagTexture({ grams, open }, anisotropy) {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = Math.round(canvas.width * (PANTRY_TAG.height / PANTRY_TAG.width));
  const context = canvas.getContext('2d');
  const { width, height } = canvas;

  roundedRect(context, 6, 6, width - 12, height - 12, 34);
  context.fillStyle = '#ffffff';
  context.fill();
  context.lineWidth = 10;
  context.strokeStyle = '#137c78';
  context.stroke();

  const badge = open ? 'открыта' : 'новая';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = `900 64px ${FONT}`;
  const badgeWidth = context.measureText(badge).width + 60;
  roundedRect(context, (width - badgeWidth) / 2, 30, badgeWidth, 86, 43);
  context.fillStyle = open ? '#ff8a1f' : '#2dc4c2';
  context.fill();
  context.fillStyle = '#ffffff';
  context.fillText(badge, width / 2, 76);

  context.fillStyle = '#3a2a55';
  context.font = `900 150px ${FONT}`;
  context.fillText(`${grams} г`, width / 2, height * 0.7);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  return texture;
}

// The monster's own shelf at home: one board with up to five packs of suitable food, open packs first.
// The page draws the HUD; this class owns the 3D part and picking a pack.
export class PantryShelf {
  constructor({ anisotropy = 1, resolveImage } = {}) {
    this.anisotropy = anisotropy;
    this.resolveImage = resolveImage;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(PANTRY_COLORS.background);
    this.camera = new THREE.PerspectiveCamera(FOV, 9 / 16, 0.1, 120);
    this.materials = new Map();
    this.entries = [];
    this.bounds = new THREE.Box3();
    this.viewport = { width: 540, height: 960, insetTop: 0, insetBottom: 0 };
    this.selected = -1;
    this.active = false;
    this.showRun = 0;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.openingTexture = makeOpeningTexture(anisotropy);
    this.buildCabinet();
  }

  get slotWidth() {
    return BOX.width + PANTRY_SLOT_GAP;
  }

  // Packs stand from left to right starting at the first slot.
  slotX(index) {
    return (index - (PANTRY_SLOTS - 1) / 2) * this.slotWidth;
  }

  buildCabinet() {
    const innerWidth = PANTRY_SLOTS * this.slotWidth;
    const height = PANTRY.plinth + BOX.height + PANTRY.headroom;
    const add = (geometry, color, x, y, z, roughness = 0.7) => {
      const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 }));
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      return mesh;
    };

    const floor = add(new THREE.PlaneGeometry(60, 60), PANTRY_COLORS.floor, 0, 0, 0, 0.9);
    floor.rotation.x = -Math.PI / 2;
    floor.castShadow = false;
    const wall = add(new THREE.PlaneGeometry(60, 40), PANTRY_COLORS.wall, 0, 20, -PANTRY.depth - 0.6, 0.95);
    wall.castShadow = false;

    for (const side of [-1, 1]) {
      add(new THREE.BoxGeometry(PANTRY.post, height + PANTRY.top, PANTRY.depth + PANTRY_RAIL.thickness), PANTRY_COLORS.wood,
        side * (innerWidth / 2 + PANTRY.post / 2), (height + PANTRY.top) / 2, (PANTRY_RAIL.thickness - PANTRY.depth) / 2, 0.6);
    }
    add(new THREE.BoxGeometry(innerWidth + PANTRY.post * 2, height + PANTRY.top, 0.1), PANTRY_COLORS.back,
      0, (height + PANTRY.top) / 2, -PANTRY.depth - 0.05, 0.9);
    add(new THREE.BoxGeometry(innerWidth + PANTRY.post * 2 + 0.16, PANTRY.top, PANTRY.depth + 0.3), PANTRY_COLORS.wood,
      0, height + PANTRY.top / 2, -PANTRY.depth / 2 + 0.1, 0.6);
    add(new THREE.BoxGeometry(innerWidth, PANTRY.plinth - PANTRY.board, PANTRY_RAIL.thickness), PANTRY_COLORS.wood,
      0, (PANTRY.plinth - PANTRY.board) / 2, PANTRY_RAIL.thickness / 2, 0.6);
    add(new THREE.BoxGeometry(innerWidth, PANTRY.board, PANTRY.depth), PANTRY_COLORS.board,
      0, PANTRY.plinth - PANTRY.board / 2, -PANTRY.depth / 2, 0.6);
    add(new THREE.BoxGeometry(innerWidth, PANTRY_RAIL.height, PANTRY_RAIL.thickness), PANTRY_COLORS.rail,
      0, PANTRY.plinth + PANTRY_RAIL.lip - PANTRY_RAIL.height / 2, PANTRY_RAIL.thickness / 2, 0.5);

    this.scene.add(new THREE.HemisphereLight(0xfff8ee, 0x7f9fa8, 2.1));
    const key = new THREE.DirectionalLight(0xfff3df, 2.3);
    key.position.set(-4, height + 6, 12);
    key.target.position.set(0, height / 2, -PANTRY.depth / 2);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    const reach = Math.max(innerWidth, height) * 0.75;
    Object.assign(key.shadow.camera, { left: -reach, right: reach, top: reach, bottom: -reach, near: 1, far: 50 });
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    this.scene.add(key, key.target);
    const fill = new THREE.DirectionalLight(0xdcf2ff, 0.8);
    fill.position.set(6, height * 0.4, 8);
    this.scene.add(fill);

    this.bounds.set(
      new THREE.Vector3(-innerWidth / 2 - PANTRY.post, 0, -PANTRY.depth),
      new THREE.Vector3(innerWidth / 2 + PANTRY.post, height + PANTRY.top, PANTRY_RAIL.thickness),
    );
  }

  materialsFor(item) {
    if (!this.materials.has(item.id)) {
      this.materials.set(item.id, loadPackagingMaterials(item, { resolveImage: this.resolveImage, anisotropy: this.anisotropy }));
    }
    return this.materials.get(item.id);
  }

  // packs: [{ item, grams, open }], at most PANTRY_SLOTS of them, in shelf order.
  async show(packs) {
    const run = ++this.showRun;
    const materials = await Promise.all(packs.map(({ item }) => this.materialsFor(item)));
    if (run !== this.showRun) return;
    this.clearPacks();
    packs.slice(0, PANTRY_SLOTS).forEach((pack, index) => {
      const group = createPack(materials[index], { open: pack.open, openingTexture: this.openingTexture });
      const home = new THREE.Vector3(this.slotX(index), PANTRY.plinth + BOX.height / 2, -0.16 - BOX.depth / 2);
      group.position.copy(home);

      const tag = new THREE.Mesh(
        new THREE.PlaneGeometry(PANTRY_TAG.width, PANTRY_TAG.height),
        new THREE.MeshBasicMaterial({ map: makePackTagTexture(pack, this.anisotropy), toneMapped: false }),
      );
      tag.position.set(this.slotX(index), PANTRY.plinth + PANTRY_RAIL.lip - PANTRY_RAIL.height / 2, PANTRY_RAIL.thickness + 0.005);
      group.traverse((child) => { child.userData.packIndex = index; });
      tag.userData.packIndex = index;
      this.scene.add(group, tag);
      this.entries.push({ pack, group, tag, home, lift: 0 });
    });
    this.select(-1);
  }

  clearPacks() {
    for (const { group, tag } of this.entries) {
      this.scene.remove(group, tag);
      disposePack(group);
      tag.geometry.dispose();
      tag.material.map.dispose();
      tag.material.dispose();
    }
    this.entries = [];
    this.selected = -1;
  }

  // x, y: page pixels relative to the canvas. Returns the index of the pack under the pointer, or -1.
  pick(x, y) {
    this.scene.updateMatrixWorld();
    this.pointer.set((x / this.viewport.width) * 2 - 1, -(y / this.viewport.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const objects = this.entries.flatMap(({ group, tag }) => [group, tag]);
    return this.raycaster.intersectObjects(objects, true)[0]?.object.userData.packIndex ?? -1;
  }

  select(index) {
    this.selected = this.entries[index] ? index : -1;
    this.entries.forEach(({ group }, entryIndex) => {
      for (const material of group.userData.faces) material.emissive.setHex(entryIndex === this.selected ? SELECT_GLOW : 0x000000);
    });
  }

  update(delta) {
    if (!this.active) return;
    this.entries.forEach((entry, index) => {
      const target = index === this.selected ? 1 : 0;
      const step = Math.min(delta, 0.05) / SELECT_SECONDS;
      entry.lift = target > entry.lift ? Math.min(target, entry.lift + step) : Math.max(target, entry.lift - step);
      const eased = easeInOutCubic(entry.lift);
      entry.group.position.copy(entry.home).addScaledVector(SELECT_OFFSET, eased);
      entry.group.rotation.y = eased * -0.18;
    });
  }

  render(renderer) {
    renderer.render(this.scene, this.camera);
  }

  resize(width, height, insetTop = 0, insetBottom = 0) {
    if (!width || !height) return;
    this.viewport = { width, height, insetTop, insetBottom };
    fitCamera(this.camera, this.bounds, { width, height, insetTop, insetBottom, ...PANTRY_CAMERA });
  }

  // Page-pixel rectangle of a tutorial target that exists only in 3D.
  screenRect(target) {
    const first = this.entries[0];
    let bounds = null;
    if (target === 'pantry-shelf') bounds = this.bounds;
    else if (target === 'pantry-box' && first) bounds = new THREE.Box3().setFromObject(first.group);
    else if (target === 'pantry-tag' && first) bounds = new THREE.Box3().setFromObject(first.tag);
    return screenRectOf(this.camera, bounds, this.viewport);
  }
}

// --- Bowl on the kitchen scale ----------------------------------------------

// Metres. The scale stands left of centre, the pack rests on the counter to its right.
const SCALE = { x: -0.09, z: 0.03, width: 0.3, height: 0.05, depth: 0.36 };
const PLATFORM = { z: -0.03, radius: 0.12, height: 0.012 };
const PLATFORM_TOP = SCALE.height + PLATFORM.height;
const BOWL_FOOTPRINT = 0.22;
const PACK_SCALE = 0.2 / BOX.height; // a pack 20 cm tall
const PACK_REST = new THREE.Vector3(0.215, (BOX.height * PACK_SCALE) / 2, -0.01);
// Held over the bowl: at any tilt that pours, the opening is above the middle of the bowl.
const PACK_POUR = new THREE.Vector3(0.012, 0.3, PLATFORM.z);
const LIFT_SECONDS = 0.45;
const LOWER_SECONDS = 0.35;
const TILT_SPEED = 80; // degrees per second while the pack is held
const TILT_BACK_SPEED = 170;
const MAX_TILT = 125;
const POUR_START_TILT = 62; // food starts falling out past this angle
const POUR_RATE = { min: 6, max: 26 }; // grams per second, from POUR_START_TILT to MAX_TILT
const KIBBLE_SIZE = 0.0135;
const KIBBLE_CAPACITY = 160; // pieces of every shape, one gram each
const GRAVITY = 9.8;
const FEEDING_CAMERA = { yaw: -6, pitch: 24 };
const FEEDING_COLORS = {
  background: 0xcff4f2,
  wall: 0xbfe7e0,
  counter: 0xe9c795,
  counterEdge: 0xd9a968,
  scale: 0xfbf8ff,
  platform: 0xdfe6ee,
  bezel: 0x2b2440,
};

function drawDisplay(context, grams) {
  const { width, height } = context.canvas;
  context.fillStyle = '#2b2440';
  context.fillRect(0, 0, width, height);
  roundedRect(context, 10, 10, width - 20, height - 20, 12);
  context.fillStyle = '#bfe8cf';
  context.fill();
  context.fillStyle = '#16324a';
  context.textBaseline = 'middle';
  context.textAlign = 'right';
  context.font = 'bold 66px "Courier New", ui-monospace, monospace';
  context.fillText(String(Math.round(grams)), width - 62, height / 2 + 3);
  context.font = `900 34px ${FONT}`;
  context.fillText('г', width - 24, height / 2 + 12);
}

// A kitchen scale with the feeding bowl on it and the chosen pack beside them. Holding the pack lifts
// it, then tilts it over the bowl; past POUR_START_TILT kibble falls out, and the scale counts every
// piece that lands in the bowl.
export class FeedingScale {
  constructor({ anisotropy = 1, resolveImage, onPour, onChange, onPackEmpty } = {}) {
    this.anisotropy = anisotropy;
    this.resolveImage = resolveImage;
    this.onPour = onPour || (() => {});
    this.onChange = onChange || (() => {});
    this.onPackEmpty = onPackEmpty || (() => {});
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(FEEDING_COLORS.background);
    this.camera = new THREE.PerspectiveCamera(FOV, 9 / 16, 0.01, 20);
    this.materials = new Map();
    this.bounds = new THREE.Box3(
      new THREE.Vector3(-0.26, 0, -0.17),
      new THREE.Vector3(0.3, 0.4, SCALE.z + SCALE.depth / 2),
    );
    this.viewport = { width: 540, height: 960, insetTop: 0, insetBottom: 0 };
    this.active = false;
    this.building = null;
    this.pack = null;
    this.packGrams = 0;
    this.bowlGrams = 0;
    this.holding = false;
    this.lift = 0;
    this.tilt = 0;
    this.pourCarry = 0;
    this.emptyNotified = false;
    this.flights = [];
    this.settled = true;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.openingTexture = makeOpeningTexture(anisotropy);
  }

  build() {
    if (!this.building) this.building = this.buildScene();
    return this.building;
  }

  async buildScene() {
    this.buildKitchen();
    this.buildScale();
    this.buildLights();
    await this.loadBowl();
    this.kibble = new Kibble(KIBBLE_CAPACITY, KIBBLE_SIZE);
    this.kibble.group.position.copy(this.bowl.center);
    this.scene.add(this.kibble.group);
    this.resize(this.viewport.width, this.viewport.height, this.viewport.insetTop, this.viewport.insetBottom);
    return this;
  }

  buildKitchen() {
    const counter = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.05, 0.9),
      new THREE.MeshStandardMaterial({ color: FEEDING_COLORS.counter, roughness: 0.75 }),
    );
    counter.position.set(0, -0.025, 0.05);
    counter.receiveShadow = true;
    this.scene.add(counter);

    const edge = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.05, 0.03),
      new THREE.MeshStandardMaterial({ color: FEEDING_COLORS.counterEdge, roughness: 0.7 }),
    );
    edge.position.set(0, -0.025, 0.515);
    this.scene.add(edge);

    const wall = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 3),
      new THREE.MeshStandardMaterial({ color: FEEDING_COLORS.wall, roughness: 0.95 }),
    );
    wall.position.set(0, 1.4, -0.4);
    wall.receiveShadow = true;
    this.scene.add(wall);
  }

  buildScale() {
    const group = new THREE.Group();
    group.name = 'kitchen-scale';
    const base = new THREE.Mesh(
      new RoundedBoxGeometry(SCALE.width, SCALE.height, SCALE.depth, 4, 0.016),
      new THREE.MeshStandardMaterial({ color: FEEDING_COLORS.scale, roughness: 0.45 }),
    );
    base.position.set(SCALE.x, SCALE.height / 2, SCALE.z);
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(SCALE.width - 0.02, 0.008, 0.004),
      new THREE.MeshStandardMaterial({ color: 0x8f50e8, roughness: 0.5 }),
    );
    stripe.position.set(SCALE.x, SCALE.height * 0.45, SCALE.z + SCALE.depth / 2 + 0.001);
    group.add(stripe);

    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(PLATFORM.radius, PLATFORM.radius, PLATFORM.height, 48),
      new THREE.MeshStandardMaterial({ color: FEEDING_COLORS.platform, roughness: 0.3, metalness: 0.35 }),
    );
    platform.position.set(SCALE.x, SCALE.height + PLATFORM.height / 2, PLATFORM.z);
    platform.castShadow = true;
    platform.receiveShadow = true;
    group.add(platform);

    // The display sits on the front of the top, tilted towards the player.
    const displayZ = SCALE.z + SCALE.depth / 2 - 0.035;
    const housing = new THREE.Mesh(
      new RoundedBoxGeometry(0.17, 0.018, 0.05, 3, 0.006),
      new THREE.MeshStandardMaterial({ color: FEEDING_COLORS.bezel, roughness: 0.5 }),
    );
    housing.position.set(SCALE.x, SCALE.height + 0.006, displayZ);
    group.add(housing);

    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 96;
    this.displayContext = canvas.getContext('2d');
    this.displayTexture = new THREE.CanvasTexture(canvas);
    this.displayTexture.colorSpace = THREE.SRGBColorSpace;
    this.displayTexture.anisotropy = this.anisotropy;
    drawDisplay(this.displayContext, 0);
    const display = new THREE.Mesh(
      new THREE.PlaneGeometry(0.15, 0.045),
      new THREE.MeshBasicMaterial({ map: this.displayTexture, toneMapped: false }),
    );
    display.rotation.x = -Math.PI / 2 + 0.5;
    display.position.set(SCALE.x, SCALE.height + 0.0165, displayZ);
    group.add(display);

    for (const [side, color] of [[-1, 0xff8a1f], [1, 0x2dc4c2]]) {
      const button = new THREE.Mesh(
        new THREE.CylinderGeometry(0.011, 0.011, 0.008, 20),
        new THREE.MeshStandardMaterial({ color, roughness: 0.4 }),
      );
      button.position.set(SCALE.x + side * 0.115, SCALE.height + 0.003, displayZ);
      group.add(button);
    }

    this.scaleGroup = group;
    this.scene.add(group);
  }

  buildLights() {
    this.scene.add(new THREE.HemisphereLight(0xfff8ee, 0x7f9fa8, 2.0));
    const key = new THREE.DirectionalLight(0xfff3df, 2.6);
    key.position.set(-0.7, 1.5, 1.1);
    key.target.position.set(0, 0.08, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -0.5, right: 0.5, top: 0.5, bottom: -0.5, near: 0.1, far: 4 });
    key.shadow.bias = -0.0005;
    key.shadow.normalBias = 0.01;
    this.scene.add(key, key.target);
    const fill = new THREE.DirectionalLight(0xdcf2ff, 0.9);
    fill.position.set(1, 0.6, 1);
    this.scene.add(fill);
  }

  // The same bowl model as in the room, scaled to a real bowl and set on the platform.
  async loadBowl() {
    const gltf = await new GLTFLoader().loadAsync('/room/models/feeding-bowl.glb');
    const source = gltf.scene;
    const size = new THREE.Box3().setFromObject(source).getSize(new THREE.Vector3());
    source.scale.multiplyScalar(BOWL_FOOTPRINT / (Math.max(size.x, size.z) || 1));
    source.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(source);
    const center = box.getCenter(new THREE.Vector3());
    source.position.set(-center.x, -box.min.y, -center.z);
    source.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
      if (child.material?.map) child.material.map.colorSpace = THREE.SRGBColorSpace;
    });

    const bowl = new THREE.Group();
    bowl.name = 'feeding-bowl';
    bowl.position.set(SCALE.x, PLATFORM_TOP, PLATFORM.z);
    bowl.add(source);
    this.scene.add(bowl);
    bowl.updateMatrixWorld(true);
    this.bowlObject = bowl;
    this.bowl = bowlInterior(bowl);
  }

  materialsFor(item) {
    if (!this.materials.has(item.id)) {
      this.materials.set(item.id, loadPackagingMaterials(item, { resolveImage: this.resolveImage, anisotropy: this.anisotropy }));
    }
    return this.materials.get(item.id);
  }

  // Puts the chosen pack on the counter; what is already in the bowl stays there.
  async setPack({ item, grams }) {
    const materials = await this.materialsFor(item);
    if (this.pack) {
      this.scene.remove(this.pack);
      disposePack(this.pack);
    }
    // At the scale the pack is always open: the player is about to pour from it.
    this.pack = createPack(materials, { open: true, scale: PACK_SCALE, openingTexture: this.openingTexture });
    this.pack.name = 'feeding-pack';
    this.pack.position.copy(PACK_REST);
    this.scene.add(this.pack);
    this.packGrams = grams;
    this.holding = false;
    this.lift = 0;
    this.tilt = 0;
    this.pourCarry = 0;
    this.emptyNotified = false;
    this.notify();
  }

  setHolding(holding) {
    this.holding = Boolean(holding && this.pack);
  }

  // The failed portion goes back: an empty bowl and a scale showing zero.
  emptyBowl() {
    this.kibble?.clear();
    this.flights = [];
    this.bowlGrams = 0;
    this.notify();
  }

  hitsPack(x, y) {
    if (!this.pack) return false;
    this.scene.updateMatrixWorld();
    this.pointer.set((x / this.viewport.width) * 2 - 1, -(y / this.viewport.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    return this.raycaster.intersectObject(this.pack, true).length > 0;
  }

  notify() {
    this.settled = !this.holding && this.tilt < POUR_START_TILT && this.flights.length === 0;
    if (this.displayContext) {
      drawDisplay(this.displayContext, this.bowlGrams);
      this.displayTexture.needsUpdate = true;
    }
    this.onChange({ bowlGrams: this.bowlGrams, packGrams: this.packGrams, settled: this.settled });
  }

  update(delta) {
    if (!this.active || !this.pack) return;
    const dt = Math.min(delta, 0.05);
    if (this.holding) {
      if (this.lift < 1) this.lift = Math.min(1, this.lift + dt / LIFT_SECONDS);
      else this.tilt = Math.min(MAX_TILT, this.tilt + TILT_SPEED * dt);
    } else if (this.tilt > 0) {
      this.tilt = Math.max(0, this.tilt - TILT_BACK_SPEED * dt);
    } else if (this.lift > 0) {
      this.lift = Math.max(0, this.lift - dt / LOWER_SECONDS);
    }

    this.pack.position.lerpVectors(PACK_REST, PACK_POUR, easeInOutCubic(this.lift));
    this.pack.rotation.z = THREE.MathUtils.degToRad(this.tilt);
    this.pack.updateMatrixWorld(true);

    const landed = this.fly(dt);
    const poured = this.pour(dt);
    const settled = !this.holding && this.tilt < POUR_START_TILT && this.flights.length === 0;
    if (landed || poured || settled !== this.settled) this.notify();
  }

  // Food leaves the open top at a rate that grows with the tilt, until the pack is empty.
  pour(dt) {
    if (this.tilt < POUR_START_TILT || this.packGrams <= 0) return false;
    const share = (this.tilt - POUR_START_TILT) / (MAX_TILT - POUR_START_TILT);
    this.pourCarry += dt * THREE.MathUtils.lerp(POUR_RATE.min, POUR_RATE.max, share);
    let poured = false;
    while (this.pourCarry >= 1 && this.packGrams > 0) {
      this.pourCarry -= 1;
      if (!this.spawnKibble()) break;
      poured = true;
    }
    if (this.packGrams <= 0 && !this.emptyNotified) {
      this.emptyNotified = true;
      this.onPackEmpty();
    }
    return poured;
  }

  spawnKibble() {
    const { width, height, depth } = this.pack.userData.size;
    const opening = new THREE.Vector3((Math.random() - 0.5) * width * 0.5, height / 2, (Math.random() - 0.5) * depth * 0.6);
    const from = this.pack.localToWorld(opening).sub(this.bowl.center);
    const to = this.kibble.pileSpot(this.bowl.radius);
    const piece = this.kibble.add(from);
    if (!piece) return false;
    this.packGrams -= 1;
    this.onPour(1);
    this.flights.push({
      piece,
      from,
      to,
      time: 0,
      duration: Math.max(0.12, Math.sqrt((2 * Math.max(0.01, from.y - to.y)) / GRAVITY)),
      spin: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random() * 0.4, Math.random() * 0.4, Math.random() * 0.4)),
    });
    return true;
  }

  // Falling pieces speed up like in free fall and stop on the pile; each one landed is a gram on the scale.
  fly(dt) {
    let landed = 0;
    const position = new THREE.Vector3();
    this.flights = this.flights.filter((flight) => {
      flight.time += dt;
      const progress = Math.min(1, flight.time / flight.duration);
      position.set(
        THREE.MathUtils.lerp(flight.from.x, flight.to.x, progress),
        flight.from.y + (flight.to.y - flight.from.y) * progress * progress,
        THREE.MathUtils.lerp(flight.from.z, flight.to.z, progress),
      );
      if (progress < 1) flight.piece.quaternion.multiply(flight.spin);
      this.kibble.place(flight.piece, position);
      if (progress < 1) return true;
      landed += 1;
      return false;
    });
    this.bowlGrams += landed;
    return landed > 0;
  }

  render(renderer) {
    renderer.render(this.scene, this.camera);
  }

  resize(width, height, insetTop = 0, insetBottom = 0) {
    if (!width || !height) return;
    this.viewport = { width, height, insetTop, insetBottom };
    fitCamera(this.camera, this.bounds, { width, height, insetTop, insetBottom, ...FEEDING_CAMERA });
  }

  // Page-pixel rectangle of a tutorial target that exists only in 3D.
  screenRect(target) {
    let bounds = null;
    if (target === 'feeding-scale' && this.scaleGroup) bounds = new THREE.Box3().setFromObject(this.scaleGroup);
    else if (target === 'feeding-bowl' && this.bowlObject) bounds = new THREE.Box3().setFromObject(this.bowlObject);
    else if (target === 'feeding-pack' && this.pack) bounds = new THREE.Box3().setFromObject(this.pack);
    return screenRectOf(this.camera, bounds, this.viewport);
  }
}
