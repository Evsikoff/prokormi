import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createTalkingMouth } from './talking-mouth.js';

// Coach Max on a video call: his own little scene in the call window, drawn by a renderer of its
// own, because the room keeps running behind the call.
const MAX_URL = '/park/models/park-vendor-sports-max.glb';
const MAX_HEIGHT = 1.8;
// Between his lips, in the model's own coordinates before skinning (raw GLB scale, 1.7 m tall):
// under the nose (its tip is at y ≈ 1.49), as wide as the painted smile; the visor is at y ≈ 1.62.
const MAX_MOUTH = { x: 0.0, y: 1.459, rx: 0.028, ry: 0.013, frontZ: 0.04 };
// Idle clips of the model by the mood of his line: he has no talking clip, so the livelier idles
// stand in for gestures.
const MOOD_CLIPS = {
  cheerful: ['Idle_7', 'Idle_3'],
  guilty: ['Idle_4', 'Idle_3'],
  businesslike: ['Idle_3', 'Idle_4'],
  puzzled: ['Idle_6', 'Idle_3'],
};

export class TrainerCall {
  constructor(container) {
    this.container = container;
    this.loader = new GLTFLoader();
    this.loading = null;
    this.renderer = null;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(24, 3 / 4, 0.05, 20);
    this.clock = new THREE.Clock();
    this.mouth = createTalkingMouth(MAX_MOUTH);
    this.talking = false;
    this.mixer = null;
    this.clips = [];
    this.action = null;
    this.model = null;
    this.frame = 0;
    this.running = false;
    // The video shrinks when his speech card appears under it.
    this.resizeObserver = new ResizeObserver(() => this.resize());

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7aa8, 2.1));
    const key = new THREE.DirectionalLight(0xfff1df, 2.2);
    key.position.set(1.2, 2.6, 2.4);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xb9d4ff, 1.1);
    rim.position.set(-2, 2.2, -1.5);
    this.scene.add(rim);
  }

  load() {
    if (!this.loading) this.loading = this.loadModel();
    return this.loading;
  }

  async loadModel() {
    const gltf = await this.loader.loadAsync(MAX_URL);
    const model = gltf.scene;
    model.updateMatrixWorld(true);
    const firstBox = new THREE.Box3().setFromObject(model);
    model.scale.multiplyScalar(MAX_HEIGHT / Math.max(0.001, firstBox.max.y - firstBox.min.y));
    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.set(-center.x, -box.min.y, -center.z);
    model.traverse((child) => {
      if (!child.isMesh) return;
      child.frustumCulled = false;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        if (material?.map) material.map.colorSpace = THREE.SRGBColorSpace;
      }
      if (child.isSkinnedMesh) this.mouth.paint(child.material);
    });
    this.scene.add(model);
    this.model = model;
    this.clips = gltf.animations || [];
    this.mixer = new THREE.AnimationMixer(model);
    this.setMood('cheerful');
    // Head and shoulders, the way a video call is framed; his idles sway the head by 11 cm at most.
    this.camera.position.set(0, 1.54, 1.45);
    this.camera.lookAt(0, 1.52, 0);
    return model;
  }

  setMood(mood) {
    if (!this.mixer) return;
    const clip = (MOOD_CLIPS[mood] ?? MOOD_CLIPS.cheerful)
      .map((name) => this.clips.find((item) => item.name === name)).find(Boolean) ?? this.clips[0];
    if (!clip) return;
    const next = this.mixer.clipAction(clip);
    if (next === this.action) return;
    next.reset();
    next.setLoop(THREE.LoopRepeat, Infinity);
    next.play();
    if (this.action) this.action.crossFadeTo(next, 0.35, false);
    this.action = next;
  }

  setTalking(talking) {
    this.talking = Boolean(talking);
  }

  start() {
    if (this.running) return;
    if (!this.renderer) {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.toneMapping = THREE.NeutralToneMapping;
      this.renderer.setClearColor(0x000000, 0);
      this.renderer.domElement.className = 'trainer-call-canvas';
    }
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.append(this.renderer.domElement);
    this.running = true;
    this.clock.getDelta();
    this.resize();
    this.resizeObserver.observe(this.container);
    const tick = () => {
      if (!this.running) return;
      this.frame = requestAnimationFrame(tick);
      this.render();
    };
    tick();
  }

  resize() {
    if (!this.renderer) return;
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  render() {
    const delta = Math.min(this.clock.getDelta(), 0.05);
    this.mixer?.update(delta);
    this.mouth.update(delta, this.talking);
    this.renderer.render(this.scene, this.camera);
  }

  stop() {
    this.running = false;
    this.resizeObserver.disconnect();
    cancelAnimationFrame(this.frame);
    this.talking = false;
    this.mouth.reset();
    this.renderer?.domElement.remove();
  }
}
