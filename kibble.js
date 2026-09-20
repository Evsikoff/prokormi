import * as THREE from 'three';

// Dry food: a handful of primitive shapes in different shades of brown, one gram per piece.
const SHADES = [0x5b3219, 0x6f3f1f, 0x7d4a25, 0x8a5330, 0x9c6334, 0xb07640];
const SHAPES = [
  () => new THREE.IcosahedronGeometry(0.5, 0).scale(1, 0.62, 0.85), // nugget
  () => new THREE.CylinderGeometry(0.5, 0.5, 0.42, 9), // disc
  () => new THREE.TorusGeometry(0.34, 0.17, 6, 10), // ring
  () => new THREE.DodecahedronGeometry(0.46, 0).scale(1, 0.7, 1.1), // chunk
];

// The feeding bowl model is a thick dish: its flat inner bottom lies at half the height and
// reaches 0.6 of the outer radius, measured from the vertices of feeding-bowl.glb.
const BOWL_INNER_RADIUS = 0.6;
const BOWL_INNER_BOTTOM = 0.5;

// World-space inside of a bowl model standing upright: centre of its inner bottom and radius.
export function bowlInterior(bowl) {
  const box = new THREE.Box3().setFromObject(bowl);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  return {
    center: new THREE.Vector3(center.x, box.min.y + size.y * BOWL_INNER_BOTTOM, center.z),
    radius: (Math.min(size.x, size.z) / 2) * BOWL_INNER_RADIUS,
  };
}

const tmpMatrix = new THREE.Matrix4();
const tmpScale = new THREE.Vector3();
const hiddenMatrix = new THREE.Matrix4().makeScale(0, 0, 0);

export class Kibble {
  constructor(capacity, size) {
    this.size = size;
    this.group = new THREE.Group();
    this.group.name = 'kibble';
    this.pieces = [];
    const material = new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0 });
    const color = new THREE.Color();
    this.meshes = SHAPES.map((makeGeometry) => {
      const mesh = new THREE.InstancedMesh(makeGeometry(), material, capacity);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.count = 0;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      // Every instance slot gets its shade once; a slot keeps it when the pile is cleared and refilled.
      for (let index = 0; index < capacity; index += 1) {
        mesh.setColorAt(index, color.setHex(SHADES[Math.floor(Math.random() * SHADES.length)]));
      }
      this.group.add(mesh);
      return mesh;
    });
  }

  get count() {
    return this.pieces.length;
  }

  // A new piece in the group's local space; null when every shape is full.
  add(position) {
    const free = this.meshes.filter((mesh) => mesh.count < mesh.instanceMatrix.count);
    if (!free.length) return null;
    const mesh = free[Math.floor(Math.random() * free.length)];
    const piece = {
      mesh,
      index: mesh.count,
      position: position.clone(),
      quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
      )),
      scale: this.size * (0.85 + Math.random() * 0.3),
    };
    mesh.count += 1;
    this.pieces.push(piece);
    this.place(piece);
    return piece;
  }

  place(piece, position = piece.position) {
    piece.position.copy(position);
    tmpMatrix.compose(piece.position, piece.quaternion, tmpScale.setScalar(piece.scale));
    piece.mesh.setMatrixAt(piece.index, tmpMatrix);
    piece.mesh.instanceMatrix.needsUpdate = true;
  }

  hide(piece) {
    piece.mesh.setMatrixAt(piece.index, hiddenMatrix);
    piece.mesh.instanceMatrix.needsUpdate = true;
  }

  clear() {
    this.pieces = [];
    for (const mesh of this.meshes) mesh.count = 0;
  }

  // Where the next piece lies on a mound in a round bowl, relative to the centre of its inner
  // bottom: the pile rises with every piece and is higher in the middle than at the rim.
  pileSpot(radius) {
    const perLayer = Math.max(1, (radius * radius * Math.PI) / (this.size * this.size * 1.1));
    const r = radius * Math.sqrt(Math.random()) * 0.94;
    const angle = Math.random() * Math.PI * 2;
    const rise = (this.count / perLayer) * this.size * 0.85 * (1.4 - 0.8 * (r / radius) ** 2);
    return new THREE.Vector3(Math.cos(angle) * r, this.size * 0.45 + rise, Math.sin(angle) * r);
  }
}
