import * as THREE from 'three';

// A shallow, self-contained window that can be hung on an uncut wall. The group
// is centred on the opening, faces +Z, and measures about 1.4 × 1.2 metres.
const WOOD = new THREE.MeshStandardMaterial({ color: 0xc9935c, roughness: 0.76 });
const WOOD_LIGHT = new THREE.MeshStandardMaterial({ color: 0xe3b67e, roughness: 0.72 });
const WOOD_EDGE = new THREE.MeshStandardMaterial({ color: 0xa76e42, roughness: 0.8 });
const FABRIC = new THREE.MeshStandardMaterial({ color: 0xa6c5af, roughness: 0.98, side: THREE.DoubleSide, vertexColors: true });
const FABRIC_BAND = new THREE.MeshStandardMaterial({ color: 0xb6ceb4, roughness: 1 });
const HANDLE = new THREE.MeshStandardMaterial({ color: 0xd9ae76, metalness: 0.12, roughness: 0.55 });

function addBox(parent, name, size, position, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function makeNightTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;

  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#101d46');
  sky.addColorStop(0.55, '#293e75');
  sky.addColorStop(1, '#586b91');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // A restrained glow behind the trees gives the picture depth even though the
  // whole view is a single plane just in front of the room wall.
  const horizon = ctx.createRadialGradient(260, 378, 5, 260, 378, 260);
  horizon.addColorStop(0, 'rgba(139,159,189,0.27)');
  horizon.addColorStop(1, 'rgba(139,159,189,0)');
  ctx.fillStyle = horizon;
  ctx.fillRect(0, 0, width, height);

  let seed = 1987;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 47; i += 1) {
    const x = 12 + random() * (width - 24);
    const y = 16 + random() * 235;
    const radius = i % 7 === 0 ? 1.9 : 0.65 + random() * 0.65;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = i % 7 === 0 ? 'rgba(255,241,202,0.94)' : 'rgba(241,245,255,0.65)';
    ctx.shadowColor = '#c9ddff';
    ctx.shadowBlur = radius * 5;
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  // Silhouettes are part of the view texture, so the window needs no wall cutout
  // or scenery beyond the room.
  const tree = (x, base, scale, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x - 4 * scale, base - 55 * scale, 8 * scale, 65 * scale);
    for (let i = 0; i < 10; i += 1) {
      const angle = i * 2.4;
      const px = x + Math.sin(angle) * (18 + (i % 3) * 6) * scale;
      const py = base - (58 + Math.cos(angle * 0.72) * 20 + (i % 2) * 13) * scale;
      ctx.beginPath();
      ctx.ellipse(px, py, (24 + i % 3 * 6) * scale, (18 + i % 2 * 8) * scale, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  tree(38, 410, 1.55, '#172f3d');
  tree(498, 410, 1.46, '#183244');
  tree(110, 425, 1.10, '#284453');
  tree(410, 425, 1.03, '#263f50');

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function curtainGeometry(side) {
  const columns = 18;
  const rows = 20;
  const positions = [];
  const colors = [];
  const indices = [];
  const color = new THREE.Color();

  for (let row = 0; row <= rows; row += 1) {
    const t = row / rows;
    const y = 0.56 - t * 1.07;
    // The inner edge opens into a graceful V at the tieback and falls outward
    // again below it. At the rod the fabric is gathered into tight pleats.
    const tie = Math.exp(-Math.pow((t - 0.59) / 0.20, 2));
    const inner = 0.27 + 0.24 * tie + 0.08 * t;
    const outer = 0.69 + 0.005 * Math.sin(t * Math.PI);
    for (let col = 0; col <= columns; col += 1) {
      const u = col / columns;
      const distance = inner + (outer - inner) * u;
      const pleat = Math.cos(u * Math.PI * 8);
      const x = side * (distance + 0.008 * pleat * (1 - tie));
      const z = 0.16 + 0.025 * pleat + 0.014 * Math.sin(t * 7 + u * 9);
      positions.push(x, y, z);
      const brightness = 0.82 + 0.16 * (pleat + 1) / 2 + 0.05 * (1 - t);
      color.setRGB(brightness, brightness, brightness);
      colors.push(color.r, color.g, color.b);
    }
  }
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const a = row * (columns + 1) + col;
      const b = a + columns + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Procedural final-scene window, about 1.4 m wide × 1.2 m tall × 0.2 m deep.
 * Its centre is the group's origin; its front faces +Z. Put it just ahead of
 * the back wall (for example at z = wallZ + 0.02) without cutting that wall.
 */
export function createGameConsoleWindow() {
  const group = new THREE.Group();
  group.name = 'GameConsoleNightWindow';

  // Solid backing hides the wall behind the glass even under a raking camera.
  addBox(group, 'NightWindowBacking', [1.14, 0.90, 0.012], [0, 0.005, 0.014], WOOD_EDGE);
  const sky = new THREE.Mesh(
    new THREE.PlaneGeometry(1.105, 0.865),
    new THREE.MeshBasicMaterial({ map: makeNightTexture(), toneMapped: false }),
  );
  sky.name = 'NightSkyAndTrees';
  sky.position.set(0, 0.007, 0.024);
  group.add(sky);

  // Recessed opening, two sashes, and a projecting sill.
  addBox(group, 'FrameLeft', [0.075, 0.99, 0.075], [-0.59, 0, 0.065], WOOD);
  addBox(group, 'FrameRight', [0.075, 0.99, 0.075], [0.59, 0, 0.065], WOOD);
  addBox(group, 'FrameTop', [1.25, 0.072, 0.075], [0, 0.49, 0.065], WOOD);
  addBox(group, 'FrameBottom', [1.25, 0.078, 0.09], [0, -0.49, 0.073], WOOD);
  addBox(group, 'SashCentre', [0.047, 0.91, 0.047], [0, 0, 0.109], WOOD_LIGHT);
  addBox(group, 'SashLeftBottom', [0.555, 0.026, 0.043], [-0.29, -0.43, 0.104], WOOD_LIGHT);
  addBox(group, 'SashRightBottom', [0.555, 0.026, 0.043], [0.29, -0.43, 0.104], WOOD_LIGHT);
  addBox(group, 'WindowSill', [1.32, 0.055, 0.19], [0, -0.535, 0.11], WOOD_LIGHT);

  for (const side of [-1, 1]) {
    const handle = new THREE.Mesh(new THREE.CapsuleGeometry(0.009, 0.052, 3, 6), HANDLE);
    handle.name = side < 0 ? 'LeftWindowHandle' : 'RightWindowHandle';
    handle.position.set(side * 0.037, -0.065, 0.14);
    group.add(handle);

    const curtain = new THREE.Mesh(curtainGeometry(side), FABRIC);
    curtain.name = side < 0 ? 'MintCurtainLeft' : 'MintCurtainRight';
    curtain.castShadow = false;
    curtain.receiveShadow = true;
    group.add(curtain);

    // Narrow tiebacks mark the gathered waist without stiffening the cloth.
    const tieback = addBox(
      group,
      side < 0 ? 'CurtainTieLeft' : 'CurtainTieRight',
      [0.15, 0.055, 0.036],
      [side * 0.595, -0.068, 0.202],
      FABRIC_BAND,
    );
    tieback.rotation.z = side * -0.16;
  }

  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.39, 10), WOOD_LIGHT);
  rod.name = 'CurtainRod';
  rod.rotation.z = Math.PI / 2;
  rod.position.set(0, 0.567, 0.165);
  group.add(rod);
  for (const side of [-1, 1]) {
    const finial = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 8), WOOD);
    finial.name = side < 0 ? 'RodFinialLeft' : 'RodFinialRight';
    finial.position.set(side * 0.71, 0.567, 0.165);
    group.add(finial);
  }

  // A small blue fill light subtly tints nearby furniture, without shadows.
  const nightGlow = new THREE.PointLight(0x849fe1, 0.24, 1.8, 2);
  nightGlow.name = 'WindowNightGlow';
  nightGlow.position.set(0, 0.08, 0.27);
  group.add(nightGlow);

  return group;
}
