import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createGameConsoleWindow } from './game-console-window.js';

const ASSET_ROOT = '/models/game_console_final/';
const ROOM_ROOT = '/room/models/';
const UP = new THREE.Vector3(0, 1, 0);
const FLOOR_Y = 0;

const ASSETS = [
  { id: 'console', url: `${ASSET_ROOT}game-console.glb`, height: 0.43, required: true },
  { id: 'leftController', url: `${ASSET_ROOT}controller-left.glb`, height: 0.21, required: true },
  { id: 'rightController', url: `${ASSET_ROOT}controller-right.glb`, height: 0.21, required: true },
  { id: 'rug', url: `${ROOM_ROOT}paw-rug.glb`, footprint: 2.45, rotationX: -Math.PI / 2 },
  { id: 'stool', url: `${ROOM_ROOT}stool.glb`, footprint: 0.69 },
  { id: 'bed', url: `${ROOM_ROOT}nest-bed.glb`, footprint: 1.32 },
  { id: 'lamp', url: `${ROOM_ROOT}cloud-lamp.glb`, height: 0.55 },
  { id: 'bench', url: `${ROOM_ROOT}storage-bench.glb`, footprint: 1.32 },
  { id: 'climber', url: `${ROOM_ROOT}climbing-tower.glb`, height: 1.42 },
];

function mesh(geometry, material, position, name) {
  const object = new THREE.Mesh(geometry, material);
  object.name = name;
  object.position.fromArray(position);
  object.receiveShadow = true;
  return object;
}

function normalizedModel(object, config) {
  object.rotation.x = config.rotationX || 0;
  object.updateMatrixWorld(true);
  const raw = new THREE.Box3().setFromObject(object).getSize(new THREE.Vector3());
  const horizontal = Math.max(raw.x, raw.z, 0.001);
  const scale = config.height
    ? config.height / Math.max(raw.y, 0.001)
    : config.footprint / horizontal;
  object.scale.multiplyScalar(scale);
  object.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  object.position.set(-center.x, -box.min.y, -center.z);
  object.traverse((part) => {
    if (!part.isMesh) return;
    part.castShadow = config.id !== 'rug';
    part.receiveShadow = true;
    for (const material of Array.isArray(part.material) ? part.material : [part.material]) {
      if (material?.map) material.map.colorSpace = THREE.SRGBColorSpace;
    }
  });
  const wrapper = new THREE.Group();
  wrapper.name = `game-final-${config.id}`;
  wrapper.add(object);
  return { object: wrapper, size: box.getSize(new THREE.Vector3()) };
}

function makeSurfaceTexture(texture, repeatX, repeatY) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = 4;
  return texture;
}

function makeGameScreen() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 160;
  const context = canvas.getContext('2d');
  context.imageSmoothingEnabled = false;
  const fill = (color, x, y, width, height) => {
    context.fillStyle = color;
    context.fillRect(x, y, width, height);
  };
  const sky = context.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, '#237dca');
  sky.addColorStop(1, '#9ee6f2');
  fill(sky, 0, 0, 256, 160);
  fill('#fff8dc', 32, 26, 24, 6);
  fill('#fff8dc', 22, 32, 42, 7);
  fill('#fff8dc', 169, 18, 22, 6);
  fill('#fff8dc', 158, 24, 39, 7);
  context.fillStyle = '#738fc3';
  context.beginPath();
  context.moveTo(0, 105);
  context.lineTo(54, 45);
  context.lineTo(107, 105);
  context.lineTo(139, 65);
  context.lineTo(187, 105);
  context.fill();
  context.fillStyle = '#e7edfc';
  context.beginPath();
  context.moveTo(54, 45);
  context.lineTo(43, 59);
  context.lineTo(53, 56);
  context.lineTo(62, 63);
  context.lineTo(67, 60);
  context.fill();
  fill('#378b71', 0, 101, 256, 59);
  fill('#55ad61', 0, 116, 256, 44);
  context.fillStyle = '#ebd687';
  context.beginPath();
  context.moveTo(111, 160);
  context.lineTo(145, 160);
  context.lineTo(178, 110);
  context.lineTo(157, 110);
  context.fill();
  for (const x of [16, 37, 208, 231]) {
    fill('#344f45', x + 5, 102, 7, 36);
    fill('#1e7155', x, 87, 18, 28);
    fill('#31a365', x + 3, 79, 12, 27);
  }
  // A tiny, original castle and player sprite provide motion-game context.
  fill('#6b4c78', 117, 84, 49, 33);
  fill('#eee3d1', 123, 75, 37, 34);
  fill('#ba6175', 128, 70, 26, 11);
  fill('#ba6175', 133, 54, 15, 22);
  fill('#fff0d5', 139, 44, 4, 10);
  fill('#304a73', 139, 91, 8, 18);
  fill('#e95955', 87, 127, 9, 11);
  fill('#f6cfaa', 89, 122, 5, 6);
  fill('#26375b', 87, 138, 4, 8);
  fill('#26375b', 93, 138, 4, 8);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

function smooth01(value) {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function setWorldQuaternion(object, worldQuaternion) {
  const parentQuaternion = object.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
  object.quaternion.copy(parentQuaternion.multiply(worldQuaternion));
  object.updateMatrixWorld(true);
}

function aimJointAt(object, target) {
  const from = object.getWorldPosition(new THREE.Vector3());
  const direction = target.clone().sub(from).normalize();
  if (direction.lengthSq() < 0.5) return;
  setWorldQuaternion(object, new THREE.Quaternion().setFromUnitVectors(UP, direction));
}

// The imported pet already has a skeleton. This two-bone pose moves the actual
// paws to the controllers and bends the legs forward without changing the pet's
// custom fur, ears, horns, or materials.
function poseLimb(monster, upper, lower, end, targetLocal, poleLocal) {
  if (!upper || !lower || !end) return;
  monster.updateMatrixWorld(true);
  const start = upper.getWorldPosition(new THREE.Vector3());
  const elbowBefore = lower.getWorldPosition(new THREE.Vector3());
  const endBefore = end.getWorldPosition(new THREE.Vector3());
  const firstLength = start.distanceTo(elbowBefore);
  const secondLength = elbowBefore.distanceTo(endBefore);
  const target = monster.localToWorld(targetLocal.clone());
  const toward = target.clone().sub(start);
  const distance = Math.max(toward.length(), 0.0001);
  toward.divideScalar(distance);
  const reach = THREE.MathUtils.clamp(distance, Math.abs(firstLength - secondLength) + 0.0001, firstLength + secondLength - 0.0001);
  const along = (firstLength * firstLength - secondLength * secondLength + reach * reach) / (2 * reach);
  const sideways = Math.sqrt(Math.max(0, firstLength * firstLength - along * along));
  const pole = monster.localToWorld(poleLocal.clone()).sub(start);
  pole.addScaledVector(toward, -pole.dot(toward));
  if (pole.lengthSq() < 0.00001) pole.set(0, 0, 1);
  pole.normalize();
  const elbow = start.clone().addScaledVector(toward, along).addScaledVector(pole, sideways);
  const preservedEndRotation = end.getWorldQuaternion(new THREE.Quaternion());
  aimJointAt(upper, elbow);
  aimJointAt(lower, target);
  setWorldQuaternion(end, preservedEndRotation);
}

export class GameConsoleFinal {
  constructor(monster) {
    this.monster = monster;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#242338');
    this.scene.fog = new THREE.Fog('#242338', 8.5, 18);
    this.camera = new THREE.PerspectiveCamera(42, 9 / 16, 0.08, 40);
    this.camera.position.set(0, 2.0, 4.9);
    this.camera.lookAt(0, 1.26, 0);
    this.loader = new GLTFLoader();
    this.assets = new Map();
    this.ready = false;
    this.loadingPromise = null;
    this.active = false;
    this.disposed = false;
    this.savedMonster = null;
    this.savedBones = null;
    this.petMixer = null;
    this.petRestAction = null;
    this.phase = 'play';
    this.phaseTime = 0;
    this.time = 0;
    this.aspect = 9 / 16;
    this.lookAt = new THREE.Vector3(0, 1.26, 0);
    this.window = null;
    this.screenLight = null;
    this.lampLight = null;
    this.buildShell();
    this.buildLighting();
  }

  buildShell() {
    const wood = new THREE.MeshStandardMaterial({ color: '#94745f', roughness: 0.87 });
    const plaster = new THREE.MeshStandardMaterial({ color: '#a49b9d', roughness: 0.96 });
    const trim = new THREE.MeshStandardMaterial({ color: '#d7ab74', roughness: 0.75 });
    const floor = mesh(new THREE.BoxGeometry(5.6, 0.12, 8.4), wood, [0, -0.06, 1.8], 'EveningFloor');
    const backWall = mesh(new THREE.BoxGeometry(5.6, 3.3, 0.12), plaster, [0, 1.65, -1.92], 'EveningWall');
    this.scene.add(floor, backWall);
    this.floorMaterial = wood;
    this.wallMaterial = plaster;
    this.scene.add(mesh(new THREE.BoxGeometry(5.55, 0.095, 0.07), trim, [0, 0.10, -1.83], 'BackBaseboard'));
    for (const x of [-2.74, 2.74]) {
      this.scene.add(mesh(new THREE.BoxGeometry(0.09, 3.3, 5.8), plaster, [x, 1.65, 0.94], 'EveningSideWall'));
      this.scene.add(mesh(new THREE.BoxGeometry(0.08, 0.095, 5.8), trim, [x * 0.97, 0.10, 0.94], 'SideBaseboard'));
    }

    this.window = createGameConsoleWindow();
    this.window.position.set(0.87, 2.08, -1.85);
    this.scene.add(this.window);

    const starColors = ['#ebc189', '#c99c9a', '#dfbc89'];
    for (const [index, x, y, radius] of [
      [0, -1.24, 2.70, 0.09], [1, -0.91, 2.33, 0.06],
      [2, -0.34, 2.77, 0.075], [0, 1.91, 2.70, 0.05],
    ]) {
      const decoration = new THREE.Mesh(
        new THREE.CircleGeometry(radius, 5),
        new THREE.MeshBasicMaterial({ color: starColors[index] }),
      );
      decoration.rotation.z = Math.PI / 2 + index * 0.12;
      decoration.position.set(x, y, -1.852);
      this.scene.add(decoration);
    }
  }

  buildLighting() {
    this.scene.add(new THREE.HemisphereLight(0xd5ddff, 0x5d3d45, 0.85));
    const warm = new THREE.DirectionalLight(0xffdeb2, 0.75);
    warm.position.set(-2.0, 4.4, 3.5);
    warm.castShadow = true;
    warm.shadow.mapSize.set(1024, 1024);
    warm.shadow.camera.left = -3;
    warm.shadow.camera.right = 3;
    warm.shadow.camera.top = 4;
    warm.shadow.camera.bottom = -2;
    warm.shadow.camera.near = 0.5;
    warm.shadow.camera.far = 10;
    warm.shadow.bias = -0.0004;
    this.scene.add(warm);

    this.lampLight = new THREE.PointLight(0xffbd7c, 25, 5.4, 2);
    this.lampLight.position.set(-0.36, 2.78, -1.25);
    this.scene.add(this.lampLight);
    const windowFill = new THREE.DirectionalLight(0x819eda, 0.47);
    windowFill.position.set(2.5, 2.6, -1.3);
    this.scene.add(windowFill);
    this.screenLight = new THREE.PointLight(0x4eb8ff, 1.7, 2.0, 2);
    this.screenLight.position.set(0.62, 0.97, 0.76);
    this.scene.add(this.screenLight);
  }

  async load(onProgress = () => {}) {
    if (this.loadingPromise) return this.loadingPromise;
    this.loadingPromise = this.loadAssets(onProgress);
    return this.loadingPromise;
  }

  async loadAssets(onProgress) {
    let completed = 0;
    const total = ASSETS.length;
    const results = await Promise.all(ASSETS.map(async (config) => {
      try {
        const gltf = await this.loader.loadAsync(config.url);
        return { config, fitted: normalizedModel(gltf.scene, config) };
      } catch (error) {
        if (config.required) throw error;
        console.warn(`Предмет финальной комнаты не загрузился: ${config.url}`, error);
        return null;
      } finally {
        completed += 1;
        onProgress(completed, total);
      }
    }));
    for (const item of results) {
      if (!item) continue;
      this.assets.set(item.config.id, item.fitted);
      this.scene.add(item.fitted.object);
    }
    this.placeAssets();
    try {
      const loader = new THREE.TextureLoader();
      const [floor, wall] = await Promise.all([
        loader.loadAsync('/room/textures/floor-birch-planks-basecolor.png'),
        loader.loadAsync('/room/textures/wall-mint-plaster-basecolor.png'),
      ]);
      this.floorMaterial.map = makeSurfaceTexture(floor, 2.6, 4.4);
      this.floorMaterial.color.set('#bfa194');
      this.floorMaterial.needsUpdate = true;
      this.wallMaterial.map = makeSurfaceTexture(wall, 2.2, 1.7);
      this.wallMaterial.color.set('#c8abb2');
      this.wallMaterial.needsUpdate = true;
    } catch (error) {
      console.warn('Текстуры вечерней комнаты не загрузились; используются цвета.', error);
    }
    this.ready = true;
    return this;
  }

  placeAssets() {
    const put = (id, x, y, z, yaw = 0) => {
      const entry = this.assets.get(id);
      if (!entry) return;
      entry.object.position.set(x, y, z);
      entry.object.rotation.y = yaw;
    };
    put('rug', -0.04, FLOOR_Y + 0.012, 0.67);
    put('stool', 0.66, 0, 0.53);
    put('bed', -1.40, 0, -0.93, 0.12);
    put('bench', 1.45, 0, -1.05);
    put('climber', -1.89, 0, -1.47);
    put('lamp', -0.36, 2.67, -1.32);
    this.assets.get('lamp')?.object.traverse((part) => {
      if (!part.isMesh) return;
      for (const material of Array.isArray(part.material) ? part.material : [part.material]) {
        if (!material) continue;
        material.color?.set('#fff3e2');
        if (material.emissive) {
          material.emissive.set('#ffe2af');
          material.emissiveIntensity = 0.82;
        }
        material.needsUpdate = true;
      }
    });
    const stoolTop = this.assets.get('stool')?.size.y ?? 0.50;
    put('console', 0.66, stoolTop + 0.012, 0.47, -0.12);
    const console = this.assets.get('console')?.object;
    if (console) {
      // The supplied GLB has one baked mesh, not a separate Screen node. Its
      // display is the sloped front surface above the controls. This small
      // unlit plane sits inside that bezel and can be replaced independently.
      const display = new THREE.Mesh(
        new THREE.PlaneGeometry(0.234, 0.132),
        new THREE.MeshBasicMaterial({ map: makeGameScreen(), toneMapped: false, depthTest: false, depthWrite: false }),
      );
      display.name = 'GameConsoleLiveScreen';
      display.position.set(0, 0.313, -0.027);
      display.rotation.x = -0.18;
      display.renderOrder = 20;
      console.add(display);
    }
    put('leftController', 0, 0, 0);
    put('rightController', 0, 0, 0);
    this.screenLight.position.set(0.66, stoolTop + 0.36, 0.86);
  }

  enter() {
    if (!this.ready) throw new Error('Финальная сцена ещё не загружена');
    if (this.active) return;
    this.savedMonster = {
      parent: this.monster.parent,
      position: this.monster.position.clone(),
      quaternion: this.monster.quaternion.clone(),
      scale: this.monster.scale.clone(),
      rotationOrder: this.monster.rotation.order,
    };
    this.scene.add(this.monster);
    this.monster.position.set(-0.58, 0, 0.50);
    this.monster.quaternion.identity();
    this.monster.rotation.order = 'YXZ';
    this.monster.rotation.y = 0.10;
    this.monster.scale.copy(this.savedMonster.scale);
    this.monster.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(this.monster);
    this.monster.scale.multiplyScalar(1.50 / Math.max(0.01, bounds.getSize(new THREE.Vector3()).y));
    this.monster.updateMatrixWorld(true);
    const fitted = new THREE.Box3().setFromObject(this.monster);
    this.monster.position.y -= fitted.min.y - FLOOR_Y;
    this.actorY = this.monster.position.y;
    this.monster.traverse((part) => {
      if (part.isMesh) part.castShadow = true;
    });

    const names = [
      'Hips', 'Spine2', 'Head',
      'LeftArm', 'LeftForeArm', 'LeftHand', 'RightArm', 'RightForeArm', 'RightHand',
      'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'RightUpLeg', 'RightLeg', 'RightFoot',
    ];
    // GLTFLoader sanitizes the Mixamo colon in node names, while exported
    // source files and other runtimes can still retain it.
    this.bones = Object.fromEntries(names.map((name) => [
      name, this.monster.getObjectByName(`mixamorig${name}`)
        ?? this.monster.getObjectByName(`mixamorig:${name}`)
        ?? this.monster.getObjectByName(name),
    ]));
    this.savedBones = new Map();
    for (const bone of Object.values(this.bones)) {
      if (bone) this.savedBones.set(bone, { position: bone.position.clone(), quaternion: bone.quaternion.clone() });
    }
    const restClip = this.monster.userData.animations?.find((clip) => clip.name === 'restpose');
    if (restClip) {
      this.petMixer = new THREE.AnimationMixer(this.monster);
      this.petRestAction = this.petMixer.clipAction(restClip);
      this.petRestAction.setLoop(THREE.LoopRepeat, Infinity).play();
      this.petMixer.update(0);
    }
    this.restBoneQuaternions = {
      Head: this.bones.Head?.quaternion.clone(),
      Spine2: this.bones.Spine2?.quaternion.clone(),
    };
    this.restHipsY = this.bones.Hips?.position.y ?? 0.515;
    this.active = true;
    this.phase = 'play';
    this.phaseTime = 0;
    this.time = 0;
    this.update(0);
  }

  play() {
    this.phase = 'play';
    this.phaseTime = 0;
  }

  thanks() {
    if (this.phase === 'thanks') return;
    this.phase = 'thanks';
    this.phaseTime = 0;
  }

  poseMonster(thanksAmount) {
    const { Hips, Spine2, Head, LeftArm, LeftForeArm, LeftHand,
      RightArm, RightForeArm, RightHand, LeftUpLeg, LeftLeg, LeftFoot,
      RightUpLeg, RightLeg, RightFoot } = this.bones;
    if (Hips) Hips.position.y = this.restHipsY - 0.12;
    if (Spine2 && this.restBoneQuaternions?.Spine2) {
      Spine2.quaternion.copy(this.restBoneQuaternions.Spine2).multiply(
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.035 + thanksAmount * 0.05),
      );
    }
    if (Head) {
      Head.quaternion.copy(this.restBoneQuaternions?.Head ?? Head.quaternion).multiply(
        new THREE.Quaternion().setFromEuler(new THREE.Euler(
          0,
          THREE.MathUtils.lerp(0.23, 0, thanksAmount),
          THREE.MathUtils.lerp(-0.04, 0.075, thanksAmount),
          'YXZ',
        )),
      );
    }
    const excitement = (1 - thanksAmount) * Math.sin(this.time * 6.5) * 0.023;
    const leftHand = new THREE.Vector3(
      THREE.MathUtils.lerp(0.29, 0.08, thanksAmount),
      THREE.MathUtils.lerp(0.72 + excitement, 0.82, thanksAmount),
      THREE.MathUtils.lerp(0.38, 0.43, thanksAmount),
    );
    const rightHand = new THREE.Vector3(
      THREE.MathUtils.lerp(-0.29, -0.32, thanksAmount),
      THREE.MathUtils.lerp(0.72 - excitement, 0.58, thanksAmount),
      THREE.MathUtils.lerp(0.38, 0.32, thanksAmount),
    );
    poseLimb(this.monster, LeftArm, LeftForeArm, LeftHand, leftHand, new THREE.Vector3(0.62, 0.65, 0.12));
    poseLimb(this.monster, RightArm, RightForeArm, RightHand, rightHand, new THREE.Vector3(-0.62, 0.65, 0.12));
    poseLimb(this.monster, LeftUpLeg, LeftLeg, LeftFoot,
      new THREE.Vector3(0.33, 0.10, 0.28), new THREE.Vector3(0.42, 0.23, 0.48));
    poseLimb(this.monster, RightUpLeg, RightLeg, RightFoot,
      new THREE.Vector3(-0.33, 0.10, 0.28), new THREE.Vector3(-0.42, 0.23, 0.48));
  }

  poseControllers(thanksAmount) {
    const left = this.assets.get('leftController')?.object;
    const right = this.assets.get('rightController')?.object;
    if (!left || !right) return;
    // The character's anatomical RightHand is on the viewer's left.
    const heldLeft = this.bones.RightHand?.getWorldPosition(new THREE.Vector3())
      ?? new THREE.Vector3(-0.8, 0.7, 0.8);
    const heldRight = this.bones.LeftHand?.getWorldPosition(new THREE.Vector3())
      ?? new THREE.Vector3(-0.3, 0.7, 0.8);
    heldLeft.add(new THREE.Vector3(0, -0.08, 0.12));
    heldRight.add(new THREE.Vector3(0, -0.08, 0.12));
    const laid = smooth01(thanksAmount * 1.65);
    left.position.copy(heldLeft).lerp(new THREE.Vector3(-0.83, 0.05, 1.26), laid);
    right.position.copy(heldRight).lerp(new THREE.Vector3(-0.52, 0.05, 1.29), laid);
    const holdLeft = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.12, -0.18, -0.11));
    const holdRight = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.12, 0.16, 0.10));
    const floorLeft = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0.10, -0.22));
    const floorRight = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, -0.09, 0.19));
    left.quaternion.slerpQuaternions(holdLeft, floorLeft, laid);
    right.quaternion.slerpQuaternions(holdRight, floorRight, laid);
  }

  resize(width, height) {
    if (!width || !height) return;
    this.aspect = width / height;
    this.camera.aspect = this.aspect;
    this.camera.updateProjectionMatrix();
  }

  update(delta) {
    if (!this.active) return;
    const step = THREE.MathUtils.clamp(delta || 0, 0, 0.05);
    this.time += step;
    this.phaseTime += step;
    this.petMixer?.update(step);
    const thanksAmount = this.phase === 'thanks' ? smooth01(this.phaseTime / 1.35) : 0;
    this.monster.position.y = this.actorY + Math.sin(this.time * 2.5) * (1 - thanksAmount) * 0.007;
    this.monster.rotation.y = THREE.MathUtils.lerp(0.10, 0, thanksAmount);
    this.poseMonster(thanksAmount);
    this.monster.updateMatrixWorld(true);
    this.poseControllers(thanksAmount);
    this.screenLight.intensity = 1.52 + Math.sin(this.time * 3.3) * 0.16;
    this.lampLight.intensity = 25 + Math.sin(this.time * 1.15) * 0.7;

    const narrowMultiplier = Math.max(1, 0.55 / Math.max(0.35, this.aspect));
    const playCamera = new THREE.Vector3(0, 1.99, 4.90 * narrowMultiplier);
    const thanksCamera = new THREE.Vector3(-0.13, 1.66, 4.32 * narrowMultiplier);
    const focusPlay = new THREE.Vector3(0, 1.28, 0.02);
    const focusThanks = new THREE.Vector3(-0.20, 1.00, 0.41);
    const cameraTarget = playCamera.lerp(thanksCamera, thanksAmount);
    const focusTarget = focusPlay.lerp(focusThanks, thanksAmount);
    const easing = Math.min(1, step * 3.3);
    this.camera.position.lerp(cameraTarget, easing);
    this.lookAt.lerp(focusTarget, easing);
    this.camera.lookAt(this.lookAt);
  }

  exit() {
    if (this.savedMonster) {
      this.petMixer?.stopAllAction();
      this.petMixer?.uncacheRoot(this.monster);
      for (const [bone, saved] of this.savedBones ?? []) {
        bone.position.copy(saved.position);
        bone.quaternion.copy(saved.quaternion);
      }
      this.monster.removeFromParent();
      this.savedMonster.parent?.add(this.monster);
      this.monster.rotation.order = this.savedMonster.rotationOrder;
      this.monster.position.copy(this.savedMonster.position);
      this.monster.quaternion.copy(this.savedMonster.quaternion);
      this.monster.scale.copy(this.savedMonster.scale);
      this.savedMonster = null;
      this.savedBones = null;
      this.restBoneQuaternions = null;
      this.petMixer = null;
      this.petRestAction = null;
    }
    this.active = false;
    if (this.disposed) return;
    this.disposed = true;
    const geometries = new Set();
    const materials = new Set();
    const textures = new Set();
    // The player's pet and the window module's shared materials belong elsewhere.
    this.scene.traverse((object) => {
      let ancestor = object;
      while (ancestor) {
        if (ancestor === this.monster || ancestor === this.window) return;
        ancestor = ancestor.parent;
      }
      if (object.geometry) geometries.add(object.geometry);
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        if (!material) continue;
        materials.add(material);
        for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
      }
    });
    this.window?.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.name === 'NightSkyAndTrees') {
        materials.add(object.material);
        if (object.material.map) textures.add(object.material.map);
      }
    });
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
    for (const texture of textures) texture.dispose();
  }
}
