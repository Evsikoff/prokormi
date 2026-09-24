import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const ASSET_ROOT = '/models/telescope_final/';
const MODEL_FILES = [
  ['car', 'yellow-car.glb'],
  ['telescope', 'stargazer-telescope.glb'],
  ['clump', 'meadow-clump.glb'],
  ['tree', 'meadow-tree.glb'],
];
const UP = new THREE.Vector3(0, 1, 0);

function ease(value) {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function random(seed) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function mesh(geometry, material, name) {
  const object = new THREE.Mesh(geometry, material);
  object.name = name;
  object.castShadow = true;
  object.receiveShadow = true;
  return object;
}

function centeredModel(source, scale, name) {
  const root = source.clone(true);
  root.scale.set(...scale);
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  root.position.set(-center.x, -box.min.y, -center.z);
  root.traverse((part) => {
    if (!part.isMesh) return;
    part.castShadow = true;
    part.receiveShadow = true;
    for (const material of Array.isArray(part.material) ? part.material : [part.material]) {
      if (material?.map) material.map.colorSpace = THREE.SRGBColorSpace;
    }
  });
  const anchor = new THREE.Group();
  anchor.name = name;
  anchor.add(root);
  return { object: anchor, size: box.getSize(new THREE.Vector3()) };
}

function starPoints(count, seed, positionForStar, size, color) {
  const rng = random(seed);
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const point = positionForStar(rng, i);
    positions.set(point, i * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color, size, sizeAttenuation: true, transparent: true, opacity: 0.91,
    depthWrite: false, fog: false,
  });
  return new THREE.Points(geometry, material);
}

function glowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  const glow = context.createRadialGradient(32, 32, 2, 32, 32, 31);
  glow.addColorStop(0, 'rgba(255,255,255,1)');
  glow.addColorStop(0.25, 'rgba(255,255,255,.82)');
  glow.addColorStop(0.65, 'rgba(255,255,255,.24)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

function earthTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  const sea = context.createLinearGradient(0, 0, 0, canvas.height);
  sea.addColorStop(0, '#092e6d');
  sea.addColorStop(0.5, '#2577b0');
  sea.addColorStop(1, '#082b67');
  context.fillStyle = sea;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const rng = random(349);
  for (let i = 0; i < 13; i += 1) {
    const x = rng() * canvas.width;
    const y = 65 + rng() * 380;
    const radiusX = 27 + rng() * 108;
    const radiusY = 19 + rng() * 62;
    context.beginPath();
    for (let step = 0; step <= 18; step += 1) {
      const a = step / 18 * Math.PI * 2;
      const wobble = 0.76 + 0.21 * Math.sin(3 * a + i) + 0.12 * Math.cos(7 * a - i);
      const px = x + Math.cos(a) * radiusX * wobble;
      const py = y + Math.sin(a) * radiusY * wobble;
      if (step === 0) context.moveTo(px, py);
      else context.lineTo(px, py);
    }
    context.closePath();
    context.fillStyle = i % 3 === 0 ? '#95a884' : i % 3 === 1 ? '#3b846f' : '#648b64';
    context.fill();
    context.strokeStyle = 'rgba(193, 211, 164, .35)';
    context.lineWidth = 5;
    context.stroke();
  }
  context.fillStyle = 'rgba(236, 248, 255, .83)';
  context.fillRect(0, 0, 1024, 28);
  context.fillRect(0, 485, 1024, 27);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function skyTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  const gradient = context.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, '#0b1434');
  gradient.addColorStop(0.50, '#111936');
  gradient.addColorStop(0.80, '#343047');
  gradient.addColorStop(1, '#5d4c5b');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 16, 512);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function hill(color, distance, height, phase) {
  const width = 130;
  const bottom = -1.5;
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  const indices = [];
  const segments = 48;
  for (let i = 0; i <= segments; i += 1) {
    const x = (i / segments - 0.5) * width;
    const y = height + Math.sin(i * 0.35 + phase) * 1.2
      + Math.sin(i * 0.12 + phase * 1.7) * 1.6;
    vertices.push(x, bottom, -distance, x, y, -distance);
    if (i < segments) {
      const k = i * 2;
      indices.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return mesh(geometry, new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, fog: false }), `Hill${distance}`);
}

function setWorldQuaternion(object, worldQuaternion) {
  if (!object?.parent) return;
  const parentQuaternion = object.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
  object.quaternion.copy(parentQuaternion.multiply(worldQuaternion));
  object.updateMatrixWorld(true);
}

function aimJointAt(object, target) {
  const from = object.getWorldPosition(new THREE.Vector3());
  const direction = target.clone().sub(from);
  if (direction.lengthSq() < 0.0001) return;
  setWorldQuaternion(object, new THREE.Quaternion().setFromUnitVectors(UP, direction.normalize()));
}

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
  const reach = THREE.MathUtils.clamp(distance,
    Math.abs(firstLength - secondLength) + 0.0001, firstLength + secondLength - 0.0001);
  const along = (firstLength * firstLength - secondLength * secondLength + reach * reach) / (2 * reach);
  const sideways = Math.sqrt(Math.max(0, firstLength * firstLength - along * along));
  const pole = monster.localToWorld(poleLocal.clone()).sub(start);
  pole.addScaledVector(toward, -pole.dot(toward));
  if (pole.lengthSq() < 0.00001) pole.set(0, 0, 1);
  pole.normalize();
  const elbow = start.clone().addScaledVector(toward, along).addScaledVector(pole, sideways);
  const endRotation = end.getWorldQuaternion(new THREE.Quaternion());
  aimJointAt(upper, elbow);
  aimJointAt(lower, target);
  setWorldQuaternion(end, endRotation);
}

export class TelescopeFinal {
  constructor(monster) {
    this.monster = monster;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#090f26');
    this.camera = new THREE.PerspectiveCamera(43, 9 / 16, 0.08, 300);
    this.camera.position.set(0, 0, 37);
    this.camera.lookAt(0, 0, -24);
    this.aspect = 9 / 16;
    this.focus = new THREE.Vector3(0, 0, -24);
    this.space = new THREE.Group();
    this.space.name = 'TelescopeSpace';
    this.field = new THREE.Group();
    this.field.name = 'TelescopeField';
    this.field.visible = false;
    this.scene.add(this.space, this.field);
    this.assets = new Map();
    this.loader = new GLTFLoader();
    this.loadingPromise = null;
    this.ready = false;
    this.active = false;
    this.disposed = false;
    this.phase = 'space';
    this.phaseTime = 0;
    this.time = 0;
    this.savedMonster = null;
    this.savedBones = null;
    this.petMixer = null;
    this.buildSpace();
    this.buildField();
  }

  buildSpace() {
    const stars = starPoints(950, 444, (rng) => [
      (rng() - 0.5) * 125,
      (rng() - 0.5) * 85,
      -115 + rng() * 105,
    ], 0.29, '#eff4ff');
    stars.name = 'StarsInSpace';
    this.space.add(stars);
    this.spaceStars = stars;

    const planet = mesh(new THREE.SphereGeometry(7.8, 64, 40),
      new THREE.MeshStandardMaterial({ map: earthTexture(), roughness: 0.95,
        emissive: '#15345f', emissiveIntensity: 0.26 }), 'Earth');
    planet.position.set(0, 0, -25);
    planet.rotation.y = -0.38;
    this.space.add(planet);
    this.earth = planet;
    const atmosphere = mesh(new THREE.SphereGeometry(8.16, 48, 32),
      new THREE.MeshBasicMaterial({ color: '#6fbde9', transparent: true, opacity: 0.13,
        side: THREE.BackSide, depthWrite: false }), 'EarthAtmosphere');
    atmosphere.position.copy(planet.position);
    atmosphere.castShadow = false;
    this.space.add(atmosphere);
    this.space.add(new THREE.AmbientLight(0xb2d2ef, 0.85));
    const sun = new THREE.DirectionalLight(0xffffff, 2.35);
    sun.position.set(17, 15, 4);
    this.space.add(sun);
  }

  buildField() {
    const dome = mesh(new THREE.SphereGeometry(110, 32, 20),
      new THREE.MeshBasicMaterial({ map: skyTexture(), side: THREE.BackSide,
        depthWrite: false, fog: false }), 'EveningSky');
    dome.castShadow = false;
    dome.receiveShadow = false;
    this.field.add(dome);
    const stars = starPoints(610, 1457, (rng) => {
      const theta = rng() * Math.PI * 2;
      const height = 9 + rng() * 69;
      const radius = Math.sqrt(Math.max(1, 80 * 80 - height * height));
      return [Math.cos(theta) * radius, height, Math.sin(theta) * radius];
    }, 0.50, '#e3ecff');
    stars.name = 'FieldStars';
    this.field.add(stars);
    this.fieldStars = stars;

    const ground = mesh(new THREE.CircleGeometry(95, 80),
      new THREE.MeshStandardMaterial({ color: '#273f39', roughness: 1 }), 'NightMeadow');
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.035;
    ground.castShadow = false;
    this.field.add(ground);
    this.field.add(hill('#374257', 56, 1.25, 0.1));
    this.field.add(hill('#24394a', 41, 0.72, 2.7));

    const moon = mesh(new THREE.SphereGeometry(1.7, 32, 24),
      new THREE.MeshBasicMaterial({ color: '#fff1cd', fog: false }), 'Moon');
    moon.position.set(-24, 26, -51);
    moon.castShadow = false;
    this.field.add(moon);
    const moonHalo = mesh(new THREE.SphereGeometry(2.28, 32, 24),
      new THREE.MeshBasicMaterial({ color: '#d1d9f9', transparent: true,
        opacity: 0.12, side: THREE.BackSide, depthWrite: false, fog: false }), 'MoonHalo');
    moonHalo.position.copy(moon.position);
    moonHalo.castShadow = false;
    this.field.add(moonHalo);

    // Soft, temporary cloud volumes make the jump from the planet-sized view
    // into the local meadow feel like a descent through the atmosphere.
    const cloudBank = new THREE.Group();
    cloudBank.name = 'DescentCloudBank';
    const cloudGeometry = new THREE.SphereGeometry(1, 18, 12);
    const cloudMaterial = new THREE.MeshBasicMaterial({
      color: '#e4e5f2', transparent: true, opacity: 0.28,
      depthWrite: false, fog: false,
    });
    const puffs = [
      [-4.8, 13.1, 16.8, 3.4, 0.80, 1.7],
      [-1.6, 13.5, 17.4, 3.8, 1.05, 1.7],
      [1.8, 13.0, 16.5, 3.7, 0.92, 1.8],
      [5.3, 13.2, 16.9, 3.3, 0.78, 1.6],
      [-3.2, 10.0, 12.8, 2.7, 0.72, 1.4],
      [0.7, 10.5, 13.1, 3.3, 0.95, 1.5],
      [4.4, 10.1, 12.4, 2.8, 0.71, 1.4],
    ];
    for (const [x, y, z, sx, sy, sz] of puffs) {
      const puff = mesh(cloudGeometry, cloudMaterial, 'ProceduralCloud');
      puff.position.set(x, y, z);
      puff.scale.set(sx, sy, sz);
      puff.castShadow = false;
      cloudBank.add(puff);
    }
    cloudBank.visible = false;
    this.field.add(cloudBank);
    this.cloudBank = cloudBank;
    this.cloudMaterial = cloudMaterial;

    this.field.add(new THREE.HemisphereLight(0xa6bfff, 0x253c33, 2.0));
    const moonLight = new THREE.DirectionalLight(0xbcc7ff, 1.8);
    moonLight.position.set(-9, 15, -14);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.set(1024, 1024);
    moonLight.shadow.camera.left = -11;
    moonLight.shadow.camera.right = 11;
    moonLight.shadow.camera.top = 11;
    moonLight.shadow.camera.bottom = -11;
    moonLight.shadow.camera.near = 1;
    moonLight.shadow.camera.far = 47;
    moonLight.shadow.bias = -0.0004;
    this.field.add(moonLight);
    const warm = new THREE.PointLight(0xffc078, 29, 10, 2);
    warm.position.set(0.15, 2.4, 2.55);
    this.field.add(warm);
    const face = new THREE.PointLight(0xa2c4ff, 15, 8, 2);
    face.position.set(3.1, 3.6, 4.6);
    this.field.add(face);

    const fireflies = starPoints(42, 677, (rng) => [
      (rng() - 0.5) * 15,
      0.35 + rng() * 1.75,
      (rng() - 0.5) * 13,
    ], 0.075, '#ffdc91');
    fireflies.name = 'Fireflies';
    fireflies.material.map = glowTexture();
    fireflies.material.alphaTest = 0.02;
    this.field.add(fireflies);
    this.fireflies = fireflies;
  }

  prepare(onProgress = () => {}) {
    if (this.loadingPromise) return this.loadingPromise;
    this.loadingPromise = Promise.all(MODEL_FILES.map(async ([id, file]) => {
      try {
        const gltf = await this.loader.loadAsync(`${ASSET_ROOT}${file}`);
        return [id, gltf.scene];
      } finally {
        this.loadedCount = (this.loadedCount ?? 0) + 1;
        onProgress(this.loadedCount, MODEL_FILES.length);
      }
    })).then((loaded) => {
      for (const [id, source] of loaded) this.assets.set(id, source);
      this.placeAssets();
      this.ready = true;
      return this;
    });
    return this.loadingPromise;
  }

  placeAssets() {
    const car = centeredModel(this.assets.get('car'), [16, 12, 16], 'YellowCar');
    car.object.rotation.y = Math.PI / 2;
    this.field.add(car.object);
    this.car = car.object;
    this.roofY = car.size.y;

    const telescope = centeredModel(this.assets.get('telescope'), [0.95, 0.95, 0.95], 'StargazerTelescope');
    telescope.object.position.set(0.44, this.roofY + 0.04, -0.03);
    // The imported tube is baked into its tripod. Turn the whole model toward
    // the monster so the eyepiece faces it.
    telescope.object.rotation.y = Math.PI - 0.12;
    this.field.add(telescope.object);
    this.telescope = telescope.object;

    const rng = random(951);
    for (let i = 0; i < 39; i += 1) {
      const angle = rng() * Math.PI * 2;
      const distance = 2.5 + rng() * 23;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      if (Math.abs(x) < 1.6 && Math.abs(z) < 2.1) continue;
      const clump = centeredModel(this.assets.get('clump'), [0.50, 0.57, 0.50], `MeadowClump${i}`);
      clump.object.position.set(x, 0, z);
      clump.object.rotation.y = rng() * Math.PI * 2;
      clump.object.scale.setScalar(0.75 + rng() * 0.65);
      this.field.add(clump.object);
    }
    for (const [index, point] of [[-7.4, -10.4], [9.6, -16.0], [-17.5, -26.0]].entries()) {
      const tree = centeredModel(this.assets.get('tree'), [0.53, 0.56, 0.53], `MeadowTree${index}`);
      tree.object.position.set(point[0], 0, point[1]);
      tree.object.rotation.y = index * 1.3;
      this.field.add(tree.object);
    }
  }

  enter() {
    if (!this.ready) throw new Error('Модели сцены с телескопом ещё не загружены');
    if (this.active) return;
    this.savedMonster = {
      parent: this.monster.parent,
      position: this.monster.position.clone(),
      quaternion: this.monster.quaternion.clone(),
      scale: this.monster.scale.clone(),
      rotationOrder: this.monster.rotation.order,
    };
    this.field.add(this.monster);
    this.monster.position.set(-0.42, 0, 0.06);
    this.monster.quaternion.identity();
    this.monster.rotation.order = 'YXZ';
    this.monster.rotation.y = 0.12;
    this.monster.scale.copy(this.savedMonster.scale);
    this.monster.updateMatrixWorld(true);
    const originalHeight = new THREE.Box3().setFromObject(this.monster).getSize(new THREE.Vector3()).y;
    this.monster.scale.multiplyScalar(1.32 / Math.max(originalHeight, 0.01));
    this.monster.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(this.monster);
    // The top of the baked blanket sits slightly below the car's tallest point.
    this.monster.position.y += this.roofY - 0.035 - box.min.y;
    this.actorY = this.monster.position.y;
    this.monster.traverse((part) => { if (part.isMesh) part.castShadow = true; });

    const names = ['Hips', 'Spine2', 'Head', 'LeftArm', 'LeftForeArm', 'LeftHand',
      'RightArm', 'RightForeArm', 'RightHand', 'LeftUpLeg', 'LeftLeg', 'LeftFoot',
      'RightUpLeg', 'RightLeg', 'RightFoot'];
    this.bones = Object.fromEntries(names.map((name) => [name,
      this.monster.getObjectByName(`mixamorig${name}`)
      ?? this.monster.getObjectByName(`mixamorig:${name}`)
      ?? this.monster.getObjectByName(name),
    ]));
    this.savedBones = new Map();
    for (const bone of Object.values(this.bones)) {
      if (bone) this.savedBones.set(bone, { position: bone.position.clone(), quaternion: bone.quaternion.clone() });
    }
    const rest = this.monster.userData.animations?.find((clip) => clip.name === 'restpose');
    if (rest) {
      this.petMixer = new THREE.AnimationMixer(this.monster);
      this.petMixer.clipAction(rest).setLoop(THREE.LoopRepeat, Infinity).play();
      this.petMixer.update(0);
    }
    this.restHead = this.bones.Head?.quaternion.clone();
    this.restSpine = this.bones.Spine2?.quaternion.clone();
    this.restHipsY = this.bones.Hips?.position.y ?? 0.51;
    this.space.visible = true;
    this.field.visible = false;
    this.cloudBank.visible = false;
    this.active = true;
    this.phase = 'space';
    this.phaseTime = 0;
    this.time = 0;
    this.camera.position.set(0, 0, 37);
    this.focus.set(0, 0, -25);
    this.camera.lookAt(this.focus);
    this.update(0);
  }

  approach() {
    if (!this.active) return;
    this.phase = 'approach';
    this.phaseTime = 0;
    this.spaceStartZ = this.camera.position.z;
  }

  observe() {
    if (!this.active) return;
    this.phase = 'observe';
    this.phaseTime = 0;
    // Passing through the cloud layer joins two deliberately different scales.
    // The approach ends with Earth filling the frame; the next beat starts high
    // above the actual field, then descends in one continuous 3D camera move.
    this.space.visible = false;
    this.field.visible = true;
    this.cloudBank.visible = true;
    this.camera.position.set(1.0, 18.5, 23);
    this.focus.set(0, 0, -0.5);
    this.camera.lookAt(this.focus);
  }

  thanks() {
    if (!this.active || this.phase === 'thanks') return;
    this.phase = 'thanks';
    this.phaseTime = 0;
    this.cloudBank.visible = false;
    this.thanksStart = this.camera.position.clone();
    this.thanksFocusStart = this.focus.clone();
  }

  poseMonster(thanksAmount) {
    const { Hips, Spine2, Head, LeftArm, LeftForeArm, LeftHand,
      RightArm, RightForeArm, RightHand, LeftUpLeg, LeftLeg, LeftFoot,
      RightUpLeg, RightLeg, RightFoot } = this.bones;
    if (Hips) Hips.position.y = this.restHipsY;
    if (Spine2 && this.restSpine) {
      Spine2.quaternion.copy(this.restSpine).multiply(
        new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.11, thanksAmount * 0.10, 0, 'YXZ')),
      );
    }
    if (Head && this.restHead) {
      // Always start from the imported rest pose; additive turns caused a
      // previous scene's head to spin continuously like a propeller.
      Head.quaternion.copy(this.restHead).multiply(
        new THREE.Quaternion().setFromEuler(new THREE.Euler(
          THREE.MathUtils.lerp(-0.05, 0.045, thanksAmount),
          THREE.MathUtils.lerp(0.52, 0.07, thanksAmount),
          THREE.MathUtils.lerp(-0.03, 0.02, thanksAmount),
          'YXZ',
        )),
      );
    }
    poseLimb(this.monster, LeftArm, LeftForeArm, LeftHand,
      new THREE.Vector3(THREE.MathUtils.lerp(0.39, 0.24, thanksAmount),
        THREE.MathUtils.lerp(0.72, 0.56, thanksAmount), 0.28),
      new THREE.Vector3(0.62, 0.53, 0.15));
    poseLimb(this.monster, RightArm, RightForeArm, RightHand,
      new THREE.Vector3(-0.25, 0.48, 0.35), new THREE.Vector3(-0.55, 0.47, 0.2));
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
    this.earth.rotation.y += step * 0.025;
    this.spaceStars.material.opacity = 0.83 + Math.sin(this.time * 1.6) * 0.07;
    this.fieldStars.material.opacity = 0.78 + Math.sin(this.time * 0.8) * 0.08;
    this.fireflies.material.opacity = 0.64 + Math.sin(this.time * 2.6) * 0.23;
    if (this.phase === 'observe') {
      this.cloudMaterial.opacity = 0.28 * (1 - ease((this.phaseTime - 0.8) / 3));
      this.cloudBank.visible = this.cloudMaterial.opacity > 0.005;
    }

    const narrow = Math.max(1, 0.60 / Math.max(0.34, this.aspect));
    if (this.phase === 'space') {
      this.camera.position.z = 37 - ease(this.phaseTime / 9) * 14;
      this.focus.set(0, 0, -25);
    } else if (this.phase === 'approach') {
      const amount = ease(this.phaseTime / 4.5);
      this.camera.position.z = THREE.MathUtils.lerp(this.spaceStartZ, -10.2, amount);
      this.focus.set(0, 0, -25);
    } else if (this.phase === 'observe') {
      const amount = ease(this.phaseTime / 5.6);
      this.camera.position.set(
        THREE.MathUtils.lerp(1.0, 3.15, amount),
        THREE.MathUtils.lerp(18.5, 2.85, amount),
        THREE.MathUtils.lerp(23, 7.55 * narrow, amount),
      );
      this.focus.set(0, THREE.MathUtils.lerp(0.0, 1.65, amount), -0.15);
    } else if (this.phase === 'thanks') {
      const amount = ease(this.phaseTime / 2.3);
      const target = new THREE.Vector3(0.85, 2.64, 4.20 * narrow);
      const targetFocus = new THREE.Vector3(-0.06, 2.19, 0.08);
      this.camera.position.copy(this.thanksStart).lerp(target, amount);
      this.focus.copy(this.thanksFocusStart).lerp(targetFocus, amount);
    }
    this.camera.lookAt(this.focus);

    if (this.field.visible) {
      const thanksAmount = this.phase === 'thanks' ? ease(this.phaseTime / 1.8) : 0;
      this.monster.position.y = this.actorY + Math.sin(this.time * 1.3) * 0.004;
      this.monster.rotation.y = THREE.MathUtils.lerp(0.12, 0.20, thanksAmount);
      this.poseMonster(thanksAmount);
      this.monster.updateMatrixWorld(true);
    }
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
      this.petMixer = null;
    }
    this.active = false;
    if (this.disposed) return;
    this.disposed = true;
    const geometries = new Set();
    const materials = new Set();
    const textures = new Set();
    this.scene.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        if (!material) continue;
        materials.add(material);
        for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
      }
    });
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
    for (const texture of textures) texture.dispose();
  }
}
