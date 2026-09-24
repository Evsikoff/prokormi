import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const ASSET_ROOT = '/models/festival_lights/';

function createGlowTexture() {
  const size = 64;
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
    const distance = Math.hypot((x + 0.5 - size / 2) / (size / 2), (y + 0.5 - size / 2) / (size / 2));
    const offset = (y * size + x) * 4;
    pixels[offset] = 255;
    pixels[offset + 1] = 255;
    pixels[offset + 2] = 255;
    pixels[offset + 3] = Math.round(255 * Math.pow(Math.max(0, 1 - distance), 2.2));
  }
  const texture = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat);
  texture.needsUpdate = true;
  return texture;
}

function makeGlowingPoints(positions, colors, size, texture, opacity = 1) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({
    map: texture,
    vertexColors: true,
    size,
    sizeAttenuation: true,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  }));
}

function randomSource() {
  let seed = 748291;
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function fitObject(object, maxSize) {
  object.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const scale = maxSize / Math.max(size.x, size.y, size.z, 0.01);
  object.scale.multiplyScalar(scale);
  object.updateMatrixWorld(true);
  const fitted = new THREE.Box3().setFromObject(object);
  object.position.sub(fitted.getCenter(new THREE.Vector3()));
  object.position.y += fitted.getSize(new THREE.Vector3()).y / 2;
  return object;
}

export class FestivalLights {
  constructor(monster) {
    this.monster = monster;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#111b36');
    this.scene.fog = new THREE.FogExp2('#26354b', 0.045);
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
    this.camera.position.set(0, 3.4, 9.8);
    this.camera.lookAt(0, 1.8, 0);
    this.scene.add(new THREE.HemisphereLight(0x9eafff, 0x382d40, 1.8));
    const warm = new THREE.PointLight(0xffc77d, 90, 12);
    warm.position.set(0, 3.5, -1.4);
    this.scene.add(warm);
    const faceLight = new THREE.PointLight(0xffd29a, 34, 8);
    faceLight.position.set(-1.5, 2.9, 3.2);
    this.scene.add(faceLight);
    const fill = new THREE.DirectionalLight(0xa5b8ff, 1.6);
    fill.position.set(4, 6, 5);
    this.scene.add(fill);
    this.glowTexture = createGlowTexture();
    this.addBackdrop();
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(18, 64),
      new THREE.MeshStandardMaterial({ color: '#203b3c', roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.04;
    this.scene.add(ground);
    this.addGarden();
    this.addLightStrings();
    this.addFireflies();
    this.guests = [];
    this.lanterns = [];
    this.phase = 'dance';
    this.time = 0;
    this.saved = null;
    this.platformTop = 0;
    this.disposed = false;
  }

  addBackdrop() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    const dusk = context.createLinearGradient(0, 0, 0, 512);
    dusk.addColorStop(0, '#101b3a');
    dusk.addColorStop(0.47, '#28385e');
    dusk.addColorStop(0.72, '#665376');
    dusk.addColorStop(1, '#9b6074');
    context.fillStyle = dusk;
    context.fillRect(0, 0, 512, 512);
    const horizon = context.createRadialGradient(256, 385, 5, 256, 385, 270);
    horizon.addColorStop(0, 'rgba(255,177,107,0.48)');
    horizon.addColorStop(1, 'rgba(255,177,107,0)');
    context.fillStyle = horizon;
    context.fillRect(0, 0, 512, 512);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const sky = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 24),
      new THREE.MeshBasicMaterial({ map: texture, fog: false, depthWrite: false }),
    );
    sky.position.set(0, 4.7, -11);
    sky.renderOrder = -10;
    this.scene.add(sky);

    const random = randomSource();
    const positions = [];
    const colors = [];
    const starColors = [new THREE.Color('#fff5dc'), new THREE.Color('#c9dcff'), new THREE.Color('#e9d3ff')];
    for (let i = 0; i < 100; i += 1) {
      positions.push((random() - 0.5) * 18, 3.1 + random() * 7.2, -10.7);
      const color = starColors[Math.floor(random() * starColors.length)];
      colors.push(color.r, color.g, color.b);
    }
    this.stars = makeGlowingPoints(positions, colors, 0.095, this.glowTexture, 0.8);
    this.scene.add(this.stars);
  }

  addGarden() {
    const random = randomSource();
    const trunkGeometry = new THREE.CylinderGeometry(0.13, 0.23, 1.65, 6);
    const crownGeometry = new THREE.SphereGeometry(1, 9, 7);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: '#25313b' });
    const crownMaterials = [
      new THREE.MeshLambertMaterial({ color: '#2b5052' }),
      new THREE.MeshLambertMaterial({ color: '#304d5b' }),
      new THREE.MeshLambertMaterial({ color: '#3c5562' }),
    ];
    for (let side of [-1, 1]) for (let i = 0; i < 6; i += 1) {
      const distance = 3.55 + i * 0.66 + random() * 0.25;
      const z = -4.2 - random() * 2.5;
      const height = 1.9 + random() * 1.4;
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.y = 0.8;
      tree.add(trunk);
      const crown = new THREE.Mesh(crownGeometry, crownMaterials[i % crownMaterials.length]);
      crown.scale.set(0.78 + random() * 0.35, height * 0.58, 0.72 + random() * 0.24);
      crown.position.y = height;
      tree.add(crown);
      tree.position.set(side * distance, 0, z);
      this.scene.add(tree);
    }
    for (const [x, z, height] of [
      [-3.1, -6.8, 1.9], [-2.35, -6.1, 1.45], [-1.45, -7.1, 1.7],
      [-0.35, -7.6, 1.2], [0.85, -7.2, 1.55], [1.9, -6.5, 1.35], [2.8, -7.1, 1.85],
    ]) {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.scale.setScalar(0.65);
      trunk.position.y = 0.53;
      tree.add(trunk);
      const crown = new THREE.Mesh(crownGeometry, crownMaterials[Math.floor(random() * crownMaterials.length)]);
      crown.scale.set(0.53, height * 0.47, 0.5);
      crown.position.y = height;
      tree.add(crown);
      tree.position.set(x, 0, z);
      this.scene.add(tree);
    }

    // A path and low garden beds keep the gap under the arch from becoming a flat strip of ground.
    const pathGeometry = new THREE.BufferGeometry();
    pathGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
      -1.35, -0.018, -2.55,
      1.35, -0.018, -2.55,
      0.67, -0.018, -8.7,
      -0.67, -0.018, -8.7,
    ], 3));
    pathGeometry.setIndex([0, 1, 2, 0, 2, 3]);
    pathGeometry.computeVertexNormals();
    this.scene.add(new THREE.Mesh(pathGeometry, new THREE.MeshStandardMaterial({
      color: '#615467', roughness: 1,
    })));
    const bushGeometry = new THREE.IcosahedronGeometry(1, 0);
    const bushMaterials = [
      new THREE.MeshLambertMaterial({ color: '#375b55' }),
      new THREE.MeshLambertMaterial({ color: '#3e5665' }),
      new THREE.MeshLambertMaterial({ color: '#4e5b67' }),
    ];
    for (let side of [-1, 1]) for (let i = 0; i < 8; i += 1) {
      const bush = new THREE.Mesh(bushGeometry, bushMaterials[i % bushMaterials.length]);
      const z = -3.2 - i * 0.73;
      const width = 1.6 + i * 0.19;
      const height = 0.45 + random() * 0.5;
      bush.position.set(side * (width + random() * 0.35), height * 0.48, z);
      bush.scale.set(0.54 + random() * 0.33, height, 0.47 + random() * 0.22);
      this.scene.add(bush);
    }
    const pathLightPositions = [];
    const pathLightColors = [];
    for (let side of [-1, 1]) for (let i = 0; i < 7; i += 1) {
      const z = -3.1 - i * 0.85;
      const x = side * (1.48 + i * 0.14);
      pathLightPositions.push(x, 1.2 - i * 0.025, z);
      const color = new THREE.Color(i % 3 === 0 ? '#ffbc84' : '#ffe0a2');
      pathLightColors.push(color.r, color.g, color.b);
    }
    this.scene.add(makeGlowingPoints(pathLightPositions, pathLightColors, 0.46, this.glowTexture, 0.95));

    const halo = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 9),
      new THREE.MeshBasicMaterial({
        map: this.glowTexture,
        color: '#ffb65e',
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    halo.rotation.x = -Math.PI / 2;
    halo.position.set(0, -0.025, 0);
    this.scene.add(halo);

    const edgePositions = [];
    const edgeColors = [];
    for (let i = 0; i <= 30; i += 1) {
      const angle = i * Math.PI / 30;
      edgePositions.push(Math.cos(angle) * 2.69, 0.27, Math.sin(angle) * 2.69);
      const color = new THREE.Color(i % 3 === 0 ? '#ffb4a8' : '#ffd98b');
      edgeColors.push(color.r, color.g, color.b);
    }
    this.scene.add(makeGlowingPoints(edgePositions, edgeColors, 0.22, this.glowTexture, 0.95));
  }

  addLightStrings() {
    const bulbPositions = [];
    const bulbColors = [];
    const wireMaterial = new THREE.LineBasicMaterial({ color: '#b19b88', transparent: true, opacity: 0.55, fog: false });
    for (const [z, height, width] of [[-4.9, 4.45, 6.7], [-7.2, 4.75, 7.8], [-6.5, 2.15, 3.35]]) {
      const points = [];
      for (let i = 0; i <= 24; i += 1) {
        const progress = i / 24;
        points.push(new THREE.Vector3(
          (progress - 0.5) * width * 2,
          height - Math.sin(progress * Math.PI) * 0.65,
          z,
        ));
      }
      this.scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), wireMaterial));
      for (let i = 1; i < 12; i += 1) {
        const progress = i / 12;
        bulbPositions.push((progress - 0.5) * width * 2, height - Math.sin(progress * Math.PI) * 0.65 - 0.12, z);
        const color = new THREE.Color(i % 4 === 0 ? '#ffad70' : '#ffcd79');
        bulbColors.push(color.r, color.g, color.b);
      }
    }
    this.stringLights = makeGlowingPoints(bulbPositions, bulbColors, 0.43, this.glowTexture, 0.95);
    this.scene.add(this.stringLights);
  }

  addFireflies() {
    const random = randomSource();
    const positions = [];
    const colors = [];
    this.fireflyPhases = [];
    for (let i = 0; i < 78; i += 1) {
      let x = (random() - 0.5) * 10;
      const z = -5 + random() * 8;
      if (z > 0 && Math.abs(x) < 1.4) x += x < 0 ? -1.5 : 1.5;
      positions.push(x, 0.5 + random() * 3.4, z);
      const color = new THREE.Color(i % 5 === 0 ? '#ffa5a6' : '#ffe2a0');
      colors.push(color.r, color.g, color.b);
      this.fireflyPhases.push(random() * Math.PI * 2);
    }
    this.fireflyBases = Float32Array.from(positions);
    this.fireflies = makeGlowingPoints(positions, colors, 0.14, this.glowTexture, 0.8);
    this.fireflies.frustumCulled = false;
    this.scene.add(this.fireflies);
  }

  addArchGlows() {
    const stars = [
      [-1.82, 2.6, 0.9],
      [-0.96, 3.25, 0.83],
      [0, 3.7, 0.88],
      [0.96, 3.25, 0.83],
      [1.82, 2.6, 0.9],
    ];
    for (const [x, y, size] of stars) {
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: this.glowTexture,
        color: '#ff9c42',
        transparent: true,
        opacity: 0.82,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
      }));
      glow.position.set(x, y, -1.05);
      glow.scale.set(size, size, 1);
      this.scene.add(glow);
    }
  }

  async load(onProgress) {
    const loader = new GLTFLoader();
    const specs = [
      ['dance-platform.glb', 5.6, [0, 0, 0]],
      ['lantern-arch.glb', 5.0, [0, 0, -1.8]],
      ['guest-cream.glb', 1.45, [-1.45, 0, -0.2]],
      ['guest-green.glb', 1.45, [1.45, 0, -0.2]],
      ['guest-orange.glb', 1.35, [0, 0, -1.35]],
      ['paper-lantern.glb', 0.58, [-3, 2.1, 0.8]],
      ['flower-planter.glb', 1.9, [-2.35, 0, 1.75]],
    ];
    let loadedCount = 0;
    const loaded = await Promise.all(specs.map(async ([file, size, position]) => {
      const gltf = await loader.loadAsync(`${ASSET_ROOT}${file}`);
      const object = fitObject(gltf.scene, size);
      object.position.add(new THREE.Vector3(...position));
      loadedCount += 1;
      if (typeof onProgress === 'function') onProgress(loadedCount, specs.length);
      return { file, object, clips: gltf.animations };
    }));
    const platform = loaded.find((item) => item.file === 'dance-platform.glb')?.object;
    if (platform) this.platformTop = new THREE.Box3().setFromObject(platform).max.y;
    const arch = loaded.find((item) => item.file === 'lantern-arch.glb')?.object;
    if (arch) {
      arch.traverse((part) => {
        if (!part.isMesh) return;
        for (const material of Array.isArray(part.material) ? part.material : [part.material]) {
          material.emissive.set('#ff9c45');
          material.emissiveMap = material.map;
          material.emissiveIntensity = 0.55;
          material.needsUpdate = true;
        }
      });
      this.addArchGlows();
    }
    for (const { file, object, clips } of loaded) {
      if (file.startsWith('guest-')) object.position.y = this.platformTop + 0.02;
      if (file === 'paper-lantern.glb') object.traverse((part) => {
        if (!part.isMesh) return;
        for (const material of Array.isArray(part.material) ? part.material : [part.material]) {
          material.color.set('#ffd19a');
          material.emissive.set('#ff9d47');
          material.emissiveMap = material.map;
          material.emissiveIntensity = 0.85;
          material.needsUpdate = true;
        }
      });
      this.scene.add(object);
      if (file.startsWith('guest-')) {
        const mixer = clips.length ? new THREE.AnimationMixer(object) : null;
        if (mixer) mixer.clipAction(clips.find((clip) => /danc/i.test(clip.name)) ?? clips[0]).play();
        this.guests.push({ object, mixer, base: object.position.clone() });
      }
    }
    const lantern = loaded.find((item) => item.file === 'paper-lantern.glb')?.object;
    if (lantern) {
      const positions = [[-3, 2.1, 0.8], [3, 2.3, 0.8], [-2.7, 2.7, -2.5], [2.7, 2.7, -2.5]];
      for (let i = 0; i < positions.length; i += 1) {
        const [x, y, z] = positions[i];
        const object = i === 0 ? lantern : lantern.clone();
        object.position.set(x, y, z);
        if (i !== 0) this.scene.add(object);
        const glow = new THREE.Sprite(new THREE.SpriteMaterial({
          map: this.glowTexture,
          color: '#ffba68',
          transparent: true,
          opacity: 0.45,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }));
        glow.scale.set(1.1, 1.1, 1);
        glow.position.set(x, y + 0.3, z);
        this.scene.add(glow);
        this.lanterns.push({ object, glow, baseY: y, phase: i * 1.7 });
      }
    }
    const planter = loaded.find((item) => item.file === 'flower-planter.glb')?.object;
    if (planter) {
      const copy = planter.clone();
      copy.position.x = 2.35;
      copy.rotation.y = Math.PI;
      this.scene.add(copy);
    }
  }

  enter() {
    this.saved = {
      parent: this.monster.parent,
      position: this.monster.position.clone(),
      quaternion: this.monster.quaternion.clone(),
      scale: this.monster.scale.clone(),
    };
    this.scene.add(this.monster);
    this.monster.position.set(0, 0, 0);
    this.monster.quaternion.identity();
    fitObject(this.monster, 1.65);
    this.monster.position.y += this.platformTop + 0.02;
    this.monster.position.x = 0;
    this.monster.position.z = 0.95;
    this.phase = 'dance';
    this.time = 0;
  }

  farewell() {
    this.phase = 'farewell';
    this.time = 0;
  }

  update(delta) {
    this.time += delta;
    const farewell = this.phase === 'farewell';
    const target = farewell ? new THREE.Vector3(0, 2.1, 4.7) : new THREE.Vector3(0, 3.4, 9.8);
    this.camera.position.lerp(target, Math.min(1, delta * 1.8));
    this.camera.lookAt(0, farewell ? 1.2 : 1.8, 0);
    for (let i = 0; i < this.guests.length; i += 1) {
      const guest = this.guests[i];
      guest.mixer?.update(delta);
      const fade = farewell ? Math.min(1, this.time / 1.35) : 0;
      const eased = 1 - (1 - fade) * (1 - fade);
      const departureX = [-4.8, 4.8, 3.9][i];
      guest.object.position.x = THREE.MathUtils.lerp(guest.base.x, departureX, eased);
      guest.object.position.z = guest.base.z - eased * 5.2;
      guest.object.position.y = guest.base.y + (farewell ? 0 : Math.abs(Math.sin(this.time * 3.6 + i * 2)) * 0.12);
      guest.object.visible = !farewell || fade < 1;
    }
    if (farewell) {
      this.monster.rotation.y += (0 - this.monster.rotation.y) * Math.min(1, delta * 3);
    } else {
      this.monster.rotation.y = Math.sin(this.time * 1.4) * 0.35;
    }
    for (const lantern of this.lanterns) {
      const drift = Math.sin(this.time * 1.35 + lantern.phase) * 0.045;
      lantern.object.position.y = lantern.baseY + drift;
      lantern.object.rotation.z = Math.sin(this.time * 0.9 + lantern.phase) * 0.035;
      lantern.glow.position.y = lantern.baseY + 0.3 + drift;
      lantern.glow.material.opacity = 0.39 + Math.sin(this.time * 2.2 + lantern.phase) * 0.06;
    }
    this.stars.material.opacity = 0.73 + Math.sin(this.time * 0.7) * 0.07;
    this.stringLights.material.opacity = 0.85 + Math.sin(this.time * 1.15) * 0.08;
    const positions = this.fireflies.geometry.attributes.position;
    for (let i = 0; i < this.fireflyPhases.length; i += 1) {
      const offset = i * 3;
      positions.array[offset] = this.fireflyBases[offset] + Math.sin(this.time * 0.7 + this.fireflyPhases[i]) * 0.09;
      positions.array[offset + 1] = this.fireflyBases[offset + 1] + Math.sin(this.time * 1.2 + this.fireflyPhases[i]) * 0.12;
    }
    positions.needsUpdate = true;
    this.fireflies.material.opacity = 0.74 + Math.sin(this.time * 1.8) * 0.1;
  }

  resize(width, height) {
    this.camera.aspect = Math.max(1, width) / Math.max(1, height);
    this.camera.updateProjectionMatrix();
  }

  exit() {
    if (this.saved) {
      this.monster.removeFromParent();
      this.saved.parent?.add(this.monster);
      this.monster.position.copy(this.saved.position);
      this.monster.quaternion.copy(this.saved.quaternion);
      this.monster.scale.copy(this.saved.scale);
      this.saved = null;
    }
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
