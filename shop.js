import * as THREE from 'three';

// Box proportions width × height × depth = 2 × 3 × 1, as the packaging textures are drawn.
export const BOX = { width: 2, height: 3, depth: 1 };
const ROWS_DEEP = 5; // boxes standing one behind another in every slot
const ROW_GAP = 0.05;
const SLOTS_PER_SHELF = 2;
const SLOT_GAP = 0.6;
const POST = 0.22;
const BOARD = 0.12;
const RAIL = { height: 0.62, lip: 0.1, thickness: 0.08 };
const HEADROOM = 0.5;
const PLINTH = 0.7;
const TOP = 0.2;
const SHELF_DEPTH = ROWS_DEEP * (BOX.depth + ROW_GAP) + 0.3;
const TAG = { width: 1.72, height: 0.54 };

const FOV = 36;
// The shelf is seen slightly from the right and from above, so the rows of boxes behind
// the front ones show their sides and tops.
const CAMERA_YAW = 15;
const CAMERA_PITCH = 7;
const FIT_MARGIN = 0.94;
const FLY_SECONDS = 0.75;
const RETURN_SECONDS = 0.5;
const MAX_ZOOM = 3;
const DIM_OPACITY = 0.62;
const TURN_PER_PIXEL = 0.011;

const COLORS = {
  background: 0xfff1d6,
  wall: 0xffe9c2,
  floor: 0xe8d6bd,
  frame: 0x7c46d8,
  back: 0xf5eeff,
  board: 0xffffff,
  rail: 0xff8a1f,
};

// Material slots of THREE.BoxGeometry: +x, -x, +y, -y, +z, -z.
const FACES = [
  'side_image_on_the_packaging',
  'side_image_on_the_packaging',
  'the_top_image_on_the_packaging',
  'the_top_image_on_the_packaging',
  'front_image_on_the_packaging',
  'image_on_the_back_of_the_packaging',
];

const easeOutCubic = (t) => 1 - (1 - t) ** 3;
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

function standardMaterial(color, roughness = 0.7) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
}

export function roundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

export function fitText(context, text, maxWidth) {
  if (context.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && context.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1);
  return `${cut}…`;
}

// The six packaging faces of a food item as box materials; a missing picture becomes plain carton.
export async function loadPackagingMaterials(item, { resolveImage, anisotropy = 1 }) {
  const loader = new THREE.TextureLoader();
  const cache = new Map();
  const load = (file) => {
    if (!file) return Promise.resolve(null);
    if (!cache.has(file)) {
      cache.set(file, loader.loadAsync(resolveImage(item.image_folder, file))
        .then((texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = anisotropy;
          return texture;
        })
        .catch((error) => {
          console.warn(`Текстура упаковки «${item.title}» не загрузилась: ${file}`, error);
          return null;
        }));
    }
    return cache.get(file);
  };
  const textures = await Promise.all(FACES.map((column) => load(item[column])));
  return textures.map((map) => (map
    ? new THREE.MeshStandardMaterial({ map, roughness: 0.62, metalness: 0 })
    : standardMaterial(0xd9cbe8)));
}

// Normalised device coordinates of a box's projected corners.
export function projectBounds(camera, bounds) {
  const rect = { left: Infinity, right: -Infinity, bottom: Infinity, top: -Infinity };
  const corner = new THREE.Vector3();
  for (let index = 0; index < 8; index += 1) {
    corner.set(
      index & 1 ? bounds.max.x : bounds.min.x,
      index & 2 ? bounds.max.y : bounds.min.y,
      index & 4 ? bounds.max.z : bounds.min.z,
    ).project(camera);
    rect.left = Math.min(rect.left, corner.x);
    rect.right = Math.max(rect.right, corner.x);
    rect.bottom = Math.min(rect.bottom, corner.y);
    rect.top = Math.max(rect.top, corner.y);
  }
  return rect;
}

// Page-pixel rectangle that a box of the scene covers on a canvas of the given size.
export function screenRectOf(camera, bounds, { width, height }) {
  if (!bounds || bounds.isEmpty()) return null;
  const rect = projectBounds(camera, bounds);
  return {
    left: ((rect.left + 1) / 2) * width,
    top: ((1 - rect.top) / 2) * height,
    width: ((rect.right - rect.left) / 2) * width,
    height: ((rect.top - rect.bottom) / 2) * height,
  };
}

function placeCamera(camera, target, towardsCamera, distance) {
  camera.position.copy(target).addScaledVector(towardsCamera, distance);
  camera.lookAt(target);
  camera.updateMatrixWorld();
  camera.updateProjectionMatrix();
}

// Points the camera at `bounds` from the direction given by yaw and pitch (degrees) and fits the
// box into the band of the canvas left free by the HUD: insetTop / insetBottom are page pixels.
export function fitCamera(camera, bounds, { width, height, insetTop = 0, insetBottom = 0, yaw = 0, pitch = 0 }) {
  const aspect = width / height;
  const band = Math.max(1, height - insetTop - insetBottom);
  const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  camera.aspect = aspect;
  camera.clearViewOffset();

  let offsetX = 0;
  let offsetY = -(insetTop - insetBottom) / 2;
  if (!bounds.isEmpty()) {
    const yawRadians = THREE.MathUtils.degToRad(yaw);
    const pitchRadians = THREE.MathUtils.degToRad(pitch);
    const towardsCamera = new THREE.Vector3(
      Math.sin(yawRadians) * Math.cos(pitchRadians),
      Math.sin(pitchRadians),
      Math.cos(yawRadians) * Math.cos(pitchRadians),
    );
    const size = bounds.getSize(new THREE.Vector3());
    const target = bounds.getCenter(new THREE.Vector3());
    let distance = Math.max((size.y * height) / (2 * tan * band), size.x / (2 * tan * aspect));

    // Perspective makes the fit non-linear, so a few rounds settle the distance.
    for (let round = 0; round < 5; round += 1) {
      placeCamera(camera, target, towardsCamera, distance);
      const rect = projectBounds(camera, bounds);
      distance *= Math.max(
        ((rect.right - rect.left) / 2) / FIT_MARGIN,
        ((rect.top - rect.bottom) / 2) * (height / band) / FIT_MARGIN,
      );
    }
    placeCamera(camera, target, towardsCamera, distance);
    const rect = projectBounds(camera, bounds);
    offsetX = ((rect.left + rect.right) / 4) * width;
    offsetY = ((1 - (rect.top + rect.bottom) / 2) / 2) * height - (insetTop + band / 2);
  }

  camera.setViewOffset(width, height, offsetX, offsetY, width, height);
  camera.updateProjectionMatrix();
}

// A white shelf label: the product name above, the price with a drawn coin below
// (a coin emoji is not guaranteed to exist in every system font a canvas can use).
function makePriceTagTexture(title, price, anisotropy) {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = Math.round(canvas.width * (TAG.height / TAG.width));
  const context = canvas.getContext('2d');
  const font = '"Arial Rounded MT Bold", "Trebuchet MS", system-ui, sans-serif';
  const { width, height } = canvas;

  roundedRect(context, 6, 6, width - 12, height - 12, 26);
  context.fillStyle = '#ffffff';
  context.fill();
  context.lineWidth = 8;
  context.strokeStyle = '#5b21b6';
  context.stroke();

  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#4b3a63';
  context.font = `800 46px ${font}`;
  context.fillText(fitText(context, String(title || ''), width - 60), width / 2, height * 0.3);

  const priceText = Number.isFinite(Number(price)) && price !== null ? String(price) : '—';
  context.font = `900 92px ${font}`;
  const priceWidth = context.measureText(priceText).width;
  const coinRadius = 32;
  const gap = 16;
  const left = (width - priceWidth - gap - coinRadius * 2) / 2;
  const baseline = height * 0.7;
  context.textAlign = 'left';
  context.fillStyle = '#5b21b6';
  context.fillText(priceText, left, baseline);

  const coinX = left + priceWidth + gap + coinRadius;
  context.beginPath();
  context.arc(coinX, baseline, coinRadius, 0, Math.PI * 2);
  context.fillStyle = '#ffc62e';
  context.fill();
  context.lineWidth = 7;
  context.strokeStyle = '#e08a00';
  context.stroke();
  context.beginPath();
  context.arc(coinX, baseline, coinRadius * 0.52, 0, Math.PI * 2);
  context.lineWidth = 5;
  context.strokeStyle = '#f2a500';
  context.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  return texture;
}

// A shop shelf with 3D food boxes. The page draws its own HUD on top; this class only
// owns the 3D part: layout, picking a box, and the inspection of one box in front of the shelf.
export class ShopShelf {
  constructor({ anisotropy = 1, resolveImage, onInspectChange } = {}) {
    this.anisotropy = anisotropy;
    this.resolveImage = resolveImage;
    this.onInspectChange = onInspectChange || (() => {});
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COLORS.background);
    this.camera = new THREE.PerspectiveCamera(FOV, 9 / 16, 0.1, 120);
    this.inspectScene = new THREE.Scene();
    this.dimScene = new THREE.Scene();
    this.products = [];
    this.pickable = [];
    this.bounds = new THREE.Box3();
    this.building = null;
    this.active = false;
    this.inspection = null;
    this.dim = 0;
    this.viewport = { width: 540, height: 960, insetTop: 0, insetBottom: 0 };
    this.inspectDistance = 8;
    this.inspectInsets = null;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.buildInspectScene();
  }

  // Loads the packaging textures once; later calls reuse the same promise.
  build(items) {
    if (!this.building) this.building = this.buildShelf(items);
    return this.building;
  }

  async buildShelf(items) {
    const materials = await Promise.all(items.map((item) => this.loadBoxMaterials(item)));
    const columns = Math.max(1, Math.min(SLOTS_PER_SHELF, items.length));
    const tiers = Math.max(1, Math.ceil(items.length / columns));
    const innerWidth = columns * (BOX.width + SLOT_GAP);
    const tierHeight = BOARD + BOX.height + HEADROOM;
    const height = PLINTH + tiers * tierHeight;

    this.buildRoom();
    this.buildFrame(innerWidth, height, tiers, tierHeight);
    this.buildLights(innerWidth, height);

    const geometry = new THREE.BoxGeometry(BOX.width, BOX.height, BOX.depth);
    items.forEach((item, index) => {
      const row = Math.floor(index / columns);
      const column = index % columns;
      const itemsInRow = Math.min(columns, items.length - row * columns);
      const x = (column - (itemsInRow - 1) / 2) * (BOX.width + SLOT_GAP);
      const boardTop = PLINTH + (tiers - 1 - row) * tierHeight;
      this.addProduct(item, materials[index], geometry, x, boardTop);
    });

    this.bounds.set(
      new THREE.Vector3(-innerWidth / 2 - POST, 0, -SHELF_DEPTH),
      new THREE.Vector3(innerWidth / 2 + POST, height + TOP, RAIL.thickness),
    );
    this.resize(this.viewport.width, this.viewport.height, this.viewport.insetTop, this.viewport.insetBottom);
    return this;
  }

  loadBoxMaterials(item) {
    return loadPackagingMaterials(item, { resolveImage: this.resolveImage, anisotropy: this.anisotropy });
  }

  buildRoom() {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), standardMaterial(COLORS.floor, 0.9));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const wall = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), standardMaterial(COLORS.wall, 0.95));
    wall.position.set(0, 20, -SHELF_DEPTH - 0.6);
    wall.receiveShadow = true;
    this.scene.add(wall);
  }

  buildFrame(innerWidth, height, tiers, tierHeight) {
    const frame = standardMaterial(COLORS.frame, 0.55);
    const board = standardMaterial(COLORS.board, 0.6);
    const rail = standardMaterial(COLORS.rail, 0.5);
    const add = (geometry, material, x, y, z) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      return mesh;
    };

    const fullWidth = innerWidth + POST * 2;
    for (const side of [-1, 1]) {
      add(new THREE.BoxGeometry(POST, height + TOP, SHELF_DEPTH + RAIL.thickness), frame,
        side * (innerWidth / 2 + POST / 2), (height + TOP) / 2, (RAIL.thickness - SHELF_DEPTH) / 2);
    }
    add(new THREE.BoxGeometry(fullWidth, height + TOP, 0.1), standardMaterial(COLORS.back, 0.9),
      0, (height + TOP) / 2, -SHELF_DEPTH - 0.05);
    add(new THREE.BoxGeometry(fullWidth + 0.16, TOP, SHELF_DEPTH + 0.3), frame,
      0, height + TOP / 2, -SHELF_DEPTH / 2 + 0.1);
    add(new THREE.BoxGeometry(innerWidth, PLINTH - BOARD, RAIL.thickness), frame,
      0, (PLINTH - BOARD) / 2, RAIL.thickness / 2);

    for (let tier = 0; tier < tiers; tier += 1) {
      const top = PLINTH + tier * tierHeight;
      add(new THREE.BoxGeometry(innerWidth, BOARD, SHELF_DEPTH), board, 0, top - BOARD / 2, -SHELF_DEPTH / 2);
      add(new THREE.BoxGeometry(innerWidth, RAIL.height, RAIL.thickness), rail,
        0, top + RAIL.lip - RAIL.height / 2, RAIL.thickness / 2);
    }
  }

  buildLights(innerWidth, height) {
    this.scene.add(new THREE.HemisphereLight(0xfff8ee, 0x8d7fb0, 2.1));

    const key = new THREE.DirectionalLight(0xfff3df, 2.4);
    key.position.set(-4, height + 6, 12);
    key.target.position.set(0, height / 2, -SHELF_DEPTH / 2);
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
  }

  addProduct(item, materials, geometry, x, boardTop) {
    const product = { item, boxes: [], tag: null };
    for (let depth = 0; depth < ROWS_DEEP; depth += 1) {
      const box = new THREE.Mesh(geometry, materials);
      // Small irregularities make the rows look like real stock rather than one stretched box.
      const jitter = depth === 0 ? 0 : 1;
      box.position.set(
        x + (Math.random() - 0.5) * 0.08 * jitter,
        boardTop + BOX.height / 2,
        -0.12 - BOX.depth / 2 - depth * (BOX.depth + ROW_GAP),
      );
      box.rotation.y = (Math.random() - 0.5) * 0.07 * jitter;
      box.castShadow = true;
      box.receiveShadow = true;
      box.userData.product = product;
      product.boxes.push(box);
      this.pickable.push(box);
      this.scene.add(box);
    }

    const tag = new THREE.Mesh(
      new THREE.PlaneGeometry(TAG.width, TAG.height),
      new THREE.MeshBasicMaterial({ map: makePriceTagTexture(item.title, item.price, this.anisotropy), toneMapped: false }),
    );
    tag.position.set(x, boardTop + RAIL.lip - RAIL.height / 2, RAIL.thickness + 0.005);
    tag.userData.product = product;
    product.tag = tag;
    this.pickable.push(tag);
    this.scene.add(tag);
    this.products.push(product);
  }

  buildInspectScene() {
    this.inspectScene.add(new THREE.HemisphereLight(0xffffff, 0x9b8fc0, 2.3));
    const key = new THREE.DirectionalLight(0xfff6e8, 1.6);
    key.position.set(-3, 5, 8);
    this.inspectScene.add(key);

    // A full-screen quad in clip space: dims the shelf behind the box being inspected.
    this.dimMaterial = new THREE.ShaderMaterial({
      uniforms: { opacity: { value: 0 } },
      vertexShader: 'void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: 'uniform float opacity; void main() { gl_FragColor = vec4(0.133, 0.094, 0.227, opacity); }',
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.dimMaterial);
    quad.frustumCulled = false;
    this.dimScene.add(quad);
  }

  // insetTop / insetBottom: page pixels covered by the HUD, the shelf is centred in the rest.
  resize(width, height, insetTop = 0, insetBottom = 0) {
    if (!width || !height) return;
    this.viewport = { width, height, insetTop, insetBottom };
    fitCamera(this.camera, this.bounds, { width, height, insetTop, insetBottom, yaw: CAMERA_YAW, pitch: CAMERA_PITCH });
    this.updateInspectDistance();
  }

  // The inspected box has its own free band: the purchase panel under it is taller than the shelf's bottom bar.
  setInspectInsets(insetTop, insetBottom) {
    this.inspectInsets = { insetTop, insetBottom };
    this.updateInspectDistance();
  }

  inspectBand() {
    const { height } = this.viewport;
    const { insetTop, insetBottom } = this.inspectInsets ?? this.viewport;
    return { top: insetTop, height: Math.max(1, height - insetTop - insetBottom) };
  }

  updateInspectDistance() {
    const { width, height } = this.viewport;
    const tan = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const diameter = Math.hypot(BOX.width, BOX.height, BOX.depth);
    this.inspectDistance = Math.max(
      (diameter * height) / (2 * tan * this.inspectBand().height * 0.95),
      diameter / (2 * tan * (width / height) * 0.98),
    );
  }

  // The inspected box floats in the middle of the free band between the HUD and the purchase panel.
  inspectTarget(zoom) {
    const { height } = this.viewport;
    const band = this.inspectBand();
    const middleY = band.top + band.height / 2;
    const direction = new THREE.Vector3(0, -(middleY / height) * 2 + 1, 0.5)
      .unproject(this.camera)
      .sub(this.camera.position)
      .normalize();
    return this.camera.position.clone().addScaledVector(direction, this.inspectDistance / zoom);
  }

  // x, y: page pixels relative to the canvas. Returns the product under the pointer.
  pick(x, y, objects = this.pickable) {
    this.pointer.set((x / this.viewport.width) * 2 - 1, -(y / this.viewport.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    return this.raycaster.intersectObjects(objects, false)[0]?.object.userData.product ?? null;
  }

  hitsInspectedBox(x, y) {
    return Boolean(this.inspection && this.pick(x, y, [this.inspection.box]));
  }

  inspect(product) {
    if (this.inspection || !product) return false;
    const box = product.boxes[0];
    this.inspection = {
      product,
      box,
      phase: 'flying',
      time: 0,
      zoom: 1,
      home: { position: box.position.clone(), quaternion: box.quaternion.clone() },
      from: { position: box.position.clone(), quaternion: box.quaternion.clone() },
    };
    this.inspectScene.add(box);
    this.onInspectChange(product.item);
    return true;
  }

  close() {
    const inspection = this.inspection;
    if (!inspection || inspection.phase === 'returning') return;
    inspection.phase = 'returning';
    inspection.time = 0;
    inspection.from = { position: inspection.box.position.clone(), quaternion: inspection.box.quaternion.clone() };
    inspection.dimFrom = this.dim;
  }

  // Immediately puts the box back, e.g. when the player leaves the shop.
  reset() {
    const inspection = this.inspection;
    if (!inspection) return;
    inspection.box.position.copy(inspection.home.position);
    inspection.box.quaternion.copy(inspection.home.quaternion);
    this.scene.add(inspection.box);
    this.inspection = null;
    this.dim = 0;
    this.onInspectChange(null);
  }

  rotate(dx, dy) {
    if (this.inspection?.phase !== 'inspecting') return;
    const turn = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    turn.setFromAxisAngle(up, dx * TURN_PER_PIXEL);
    this.inspection.box.quaternion.premultiply(turn);
    turn.setFromAxisAngle(right, dy * TURN_PER_PIXEL);
    this.inspection.box.quaternion.premultiply(turn);
  }

  zoomBy(factor) {
    if (!this.inspection || this.inspection.phase === 'returning') return;
    this.inspection.zoom = THREE.MathUtils.clamp(this.inspection.zoom * factor, 1, MAX_ZOOM);
  }

  update(delta) {
    const inspection = this.inspection;
    if (!this.active || !inspection) return;
    const { box } = inspection;
    inspection.time += delta;

    if (inspection.phase === 'flying') {
      const progress = Math.min(1, inspection.time / FLY_SECONDS);
      const eased = easeOutCubic(progress);
      box.position.lerpVectors(inspection.from.position, this.inspectTarget(inspection.zoom), eased);
      box.position.y += Math.sin(progress * Math.PI) * 0.8;
      // One full turn on the way out; the box ends facing the player.
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);
      box.quaternion.slerpQuaternions(inspection.from.quaternion, this.camera.quaternion, eased)
        .premultiply(new THREE.Quaternion().setFromAxisAngle(up, eased * Math.PI * 2));
      this.dim = eased;
      if (progress >= 1) {
        inspection.phase = 'inspecting';
        box.quaternion.copy(this.camera.quaternion);
      }
      return;
    }

    if (inspection.phase === 'inspecting') {
      box.position.lerp(this.inspectTarget(inspection.zoom), 1 - Math.exp(-delta * 14));
      return;
    }

    const progress = Math.min(1, inspection.time / RETURN_SECONDS);
    const eased = easeInOutCubic(progress);
    box.position.lerpVectors(inspection.from.position, inspection.home.position, eased);
    box.quaternion.slerpQuaternions(inspection.from.quaternion, inspection.home.quaternion, eased);
    this.dim = inspection.dimFrom * (1 - eased);
    if (progress >= 1) this.reset();
  }

  render(renderer) {
    renderer.render(this.scene, this.camera);
    if (!this.inspection) return;
    const autoClear = renderer.autoClear;
    renderer.autoClear = false;
    this.dimMaterial.uniforms.opacity.value = DIM_OPACITY * this.dim;
    renderer.render(this.dimScene, this.camera);
    renderer.clearDepth();
    renderer.render(this.inspectScene, this.camera);
    renderer.autoClear = autoClear;
  }

  // Page-pixel rectangle of a tutorial target that exists only in 3D.
  screenRect(target) {
    const first = this.products[0];
    let bounds = null;
    if (target === 'shop-shelf') bounds = this.bounds;
    else if (target === 'shop-box' && first) bounds = new THREE.Box3().setFromObject(first.boxes[0]);
    else if (target === 'shop-price' && first) bounds = new THREE.Box3().setFromObject(first.tag);
    return screenRectOf(this.camera, bounds, this.viewport);
  }
}
