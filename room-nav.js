import * as THREE from 'three';

// The floor of the room seen from above as a grid of small cells. The furniture is rasterised into
// it from its own triangles, so the monster walks around the real shapes of the models and never
// through them: whatever stands higher than a step and lower than the monster's head is in the way,
// anything lower is walked over (the rug, the climbing tower's base plate) and lifts the feet.

const CELL = 0.04;
// Lower than this the monster steps onto a surface instead of walking around it.
const STEP_HEIGHT = 0.09;
// Higher than this the monster walks under it (the ceiling lamp).
const HEAD_ROOM = 1.6;
// Distances to the nearest obstacle are only tracked this far.
const MAX_CLEARANCE = 0.8;
// Paths keep this much extra distance from the furniture when there is room for it.
const COMFORT = 0.12;

const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();
const tmpC = new THREE.Vector3();

class MinHeap {
  constructor() {
    this.items = [];
  }

  get size() {
    return this.items.length;
  }

  push(index, priority) {
    const items = this.items;
    items.push([index, priority]);
    let child = items.length - 1;
    while (child > 0) {
      const parent = (child - 1) >> 1;
      if (items[parent][1] <= items[child][1]) break;
      [items[parent], items[child]] = [items[child], items[parent]];
      child = parent;
    }
  }

  pop() {
    const items = this.items;
    const top = items[0];
    const last = items.pop();
    if (items.length) {
      items[0] = last;
      let parent = 0;
      for (;;) {
        const left = parent * 2 + 1;
        const right = left + 1;
        let smallest = parent;
        if (left < items.length && items[left][1] < items[smallest][1]) smallest = left;
        if (right < items.length && items[right][1] < items[smallest][1]) smallest = right;
        if (smallest === parent) break;
        [items[parent], items[smallest]] = [items[smallest], items[parent]];
        parent = smallest;
      }
    }
    return top[0];
  }
}

export class RoomNav {
  // The walkable rectangle: its edges count as walls, including the open side facing the camera,
  // so the monster stays in the picture.
  constructor({ minX, maxX, minZ, maxZ }) {
    this.cell = CELL;
    this.minX = minX;
    this.minZ = minZ;
    this.cols = Math.ceil((maxX - minX) / CELL);
    this.rows = Math.ceil((maxZ - minZ) / CELL);
    const count = this.cols * this.rows;
    this.ground = new Float32Array(count);
    this.blocked = new Uint8Array(count);
    this.clearance = new Float32Array(count);
    // Things that come and go (the father): discs { x, z, radius }, checked on top of the grid.
    this.dynamic = [];
    this.ready = false;
  }

  col(x) {
    return Math.floor((x - this.minX) / this.cell);
  }

  row(z) {
    return Math.floor((z - this.minZ) / this.cell);
  }

  inside(col, row) {
    return col >= 0 && row >= 0 && col < this.cols && row < this.rows;
  }

  centerX(col) {
    return this.minX + (col + 0.5) * this.cell;
  }

  centerZ(row) {
    return this.minZ + (row + 0.5) * this.cell;
  }

  // Every triangle of `object` either blocks the cells it covers or, when it is low enough to step
  // on, raises their floor. `walkable: false` blocks even the low parts (a bowl is not stepped in).
  addObject(object, { walkable = true } = {}) {
    object.updateMatrixWorld(true);
    object.traverse((child) => {
      if (!child.isMesh || child.isSkinnedMesh) return;
      const position = child.geometry.getAttribute('position');
      if (!position) return;
      const index = child.geometry.getIndex();
      const count = index ? index.count : position.count;
      for (let offset = 0; offset + 2 < count; offset += 3) {
        const ia = index ? index.getX(offset) : offset;
        const ib = index ? index.getX(offset + 1) : offset + 1;
        const ic = index ? index.getX(offset + 2) : offset + 2;
        tmpA.fromBufferAttribute(position, ia).applyMatrix4(child.matrixWorld);
        tmpB.fromBufferAttribute(position, ib).applyMatrix4(child.matrixWorld);
        tmpC.fromBufferAttribute(position, ic).applyMatrix4(child.matrixWorld);
        this.rasterize(tmpA, tmpB, tmpC, walkable);
      }
    });
    this.ready = false;
  }

  rasterize(a, b, c, walkable) {
    const minY = Math.min(a.y, b.y, c.y);
    const maxY = Math.max(a.y, b.y, c.y);
    if (minY > HEAD_ROOM) return;
    const ground = walkable && maxY <= STEP_HEIGHT;
    const col0 = Math.max(0, this.col(Math.min(a.x, b.x, c.x)));
    const col1 = Math.min(this.cols - 1, this.col(Math.max(a.x, b.x, c.x)));
    const row0 = Math.max(0, this.row(Math.min(a.z, b.z, c.z)));
    const row1 = Math.min(this.rows - 1, this.row(Math.max(a.z, b.z, c.z)));
    if (col0 > col1 || row0 > row1) return;
    // A triangle smaller than a cell is marked where it lies; a bigger one where it covers a centre.
    const small = col0 === col1 || row0 === row1;
    const area = (b.x - a.x) * (c.z - a.z) - (c.x - a.x) * (b.z - a.z);
    for (let row = row0; row <= row1; row += 1) {
      const z = this.centerZ(row);
      for (let col = col0; col <= col1; col += 1) {
        const x = this.centerX(col);
        if (!small) {
          if (Math.abs(area) < 1e-9) continue;
          const u = ((b.x - x) * (c.z - z) - (c.x - x) * (b.z - z)) / area;
          const v = ((c.x - x) * (a.z - z) - (a.x - x) * (c.z - z)) / area;
          if (u < -0.02 || v < -0.02 || u + v > 1.02) continue;
        }
        const cell = row * this.cols + col;
        if (ground) this.ground[cell] = Math.max(this.ground[cell], maxY);
        else this.blocked[cell] = 1;
      }
    }
  }

  // Distance from every cell to the nearest blocked cell or edge of the grid.
  build() {
    const reach = Math.ceil(MAX_CLEARANCE / this.cell);
    const offsets = [];
    for (let dr = -reach; dr <= reach; dr += 1) {
      for (let dc = -reach; dc <= reach; dc += 1) {
        const distance = Math.hypot(dr, dc) * this.cell;
        if (distance <= MAX_CLEARANCE) offsets.push([dc, dr, Math.max(0, distance - this.cell * 0.5)]);
      }
    }
    offsets.sort((first, second) => first[2] - second[2]);
    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.cols; col += 1) {
        const cell = row * this.cols + col;
        if (this.blocked[cell]) {
          this.clearance[cell] = 0;
          continue;
        }
        let clearance = MAX_CLEARANCE;
        for (const [dc, dr, distance] of offsets) {
          const c = col + dc;
          const r = row + dr;
          if (!this.inside(c, r) || this.blocked[r * this.cols + c]) {
            clearance = distance;
            break;
          }
        }
        // The edge of the grid is a wall half a cell beyond the last centre.
        const edge = Math.min(col + 0.5, row + 0.5, this.cols - col - 0.5, this.rows - row - 0.5) * this.cell;
        this.clearance[cell] = Math.min(clearance, edge);
      }
    }
    this.ready = true;
  }

  // Height of the floor under a point: the rug, the base plate of the climbing tower, or zero.
  groundAt(x, z) {
    const col = this.col(x);
    const row = this.row(z);
    if (!this.inside(col, row)) return 0;
    // The highest neighbour: the soles rest on the fluff instead of sinking between two samples.
    let height = 0;
    for (let dr = -1; dr <= 1; dr += 1) {
      for (let dc = -1; dc <= 1; dc += 1) {
        if (this.inside(col + dc, row + dr)) height = Math.max(height, this.ground[(row + dr) * this.cols + col + dc]);
      }
    }
    return height;
  }

  clearanceAt(x, z) {
    const col = this.col(x);
    const row = this.row(z);
    if (!this.inside(col, row)) return 0;
    let clearance = this.clearance[row * this.cols + col];
    for (const disc of this.dynamic) clearance = Math.min(clearance, Math.hypot(x - disc.x, z - disc.z) - disc.radius);
    return clearance;
  }

  free(cell, radius) {
    const col = cell % this.cols;
    const row = (cell - col) / this.cols;
    if (this.blocked[cell] || this.clearance[cell] < radius) return false;
    if (!this.dynamic.length) return true;
    return this.clearanceAt(this.centerX(col), this.centerZ(row)) >= radius;
  }

  // The free cell nearest to a point, searched outwards ring by ring.
  nearestFree(x, z, radius) {
    const startCol = THREE.MathUtils.clamp(this.col(x), 0, this.cols - 1);
    const startRow = THREE.MathUtils.clamp(this.row(z), 0, this.rows - 1);
    const maxRing = Math.max(this.cols, this.rows);
    for (let ring = 0; ring < maxRing; ring += 1) {
      let best = null;
      let bestDistance = Infinity;
      for (let row = startRow - ring; row <= startRow + ring; row += 1) {
        for (let col = startCol - ring; col <= startCol + ring; col += 1) {
          if (Math.max(Math.abs(row - startRow), Math.abs(col - startCol)) !== ring) continue;
          if (!this.inside(col, row)) continue;
          const cell = row * this.cols + col;
          if (!this.free(cell, radius)) continue;
          const distance = Math.hypot(this.centerX(col) - x, this.centerZ(row) - z);
          if (distance < bestDistance) {
            bestDistance = distance;
            best = [this.centerX(col), this.centerZ(row)];
          }
        }
      }
      if (best) return best;
    }
    return null;
  }

  // Whether the monster of `radius` fits everywhere along the straight line between two points.
  lineFree(x0, z0, x1, z1, radius) {
    const length = Math.hypot(x1 - x0, z1 - z0);
    const steps = Math.max(1, Math.ceil(length / (this.cell * 0.5)));
    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps;
      if (this.clearanceAt(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t) < radius) return false;
    }
    return true;
  }

  // A smooth list of [x, z] points from `from` to `to` for a monster of `radius`, or null when the
  // goal cannot be reached. A start inside an obstacle's margin first steps out to the nearest free
  // cell; an occupied goal is replaced by the nearest free cell.
  findPath(from, to, radius) {
    if (!this.ready) this.build();
    const [fromX, fromZ] = from;
    let start = this.cellIndex(fromX, fromZ);
    const lead = [[fromX, fromZ]];
    if (start < 0 || !this.free(start, radius)) {
      const escape = this.nearestFree(fromX, fromZ, radius);
      if (!escape) return null;
      lead.push(escape);
      start = this.cellIndex(escape[0], escape[1]);
    }
    let [goalX, goalZ] = to;
    let goal = this.cellIndex(goalX, goalZ);
    if (goal < 0 || !this.free(goal, radius)) {
      const snapped = this.nearestFree(goalX, goalZ, radius);
      if (!snapped) return null;
      [goalX, goalZ] = snapped;
      goal = this.cellIndex(goalX, goalZ);
    }

    const cells = this.search(start, goal, radius);
    if (!cells) return null;
    const points = [...lead, ...cells.slice(1, -1).map((cell) => this.cellCenter(cell)), [goalX, goalZ]];
    return this.smooth(points, radius);
  }

  cellIndex(x, z) {
    const col = this.col(x);
    const row = this.row(z);
    return this.inside(col, row) ? row * this.cols + col : -1;
  }

  cellCenter(cell) {
    const col = cell % this.cols;
    return [this.centerX(col), this.centerZ((cell - col) / this.cols)];
  }

  search(start, goal, radius) {
    if (start === goal) return [start];
    const cols = this.cols;
    const cost = new Float32Array(this.cols * this.rows).fill(Infinity);
    const from = new Int32Array(this.cols * this.rows).fill(-1);
    const closed = new Uint8Array(this.cols * this.rows);
    const goalCol = goal % cols;
    const goalRow = (goal - goalCol) / cols;
    const heuristic = (cell) => {
      const col = cell % cols;
      const dc = Math.abs(col - goalCol);
      const dr = Math.abs((cell - col) / cols - goalRow);
      return (Math.max(dc, dr) + (Math.SQRT2 - 1) * Math.min(dc, dr)) * this.cell;
    };
    const heap = new MinHeap();
    cost[start] = 0;
    heap.push(start, heuristic(start));
    const neighbours = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]];
    while (heap.size) {
      const cell = heap.pop();
      if (cell === goal) break;
      if (closed[cell]) continue;
      closed[cell] = 1;
      const col = cell % cols;
      const row = (cell - col) / cols;
      for (const [dc, dr, length] of neighbours) {
        const c = col + dc;
        const r = row + dr;
        if (!this.inside(c, r)) continue;
        const next = r * cols + c;
        if (closed[next] || !this.free(next, radius)) continue;
        // Squeezing past furniture costs more than walking in the open.
        const tight = Math.max(0, (radius + COMFORT - this.clearance[next]) / COMFORT);
        const step = cost[cell] + length * this.cell * (1 + tight * 1.5);
        if (step >= cost[next]) continue;
        cost[next] = step;
        from[next] = cell;
        heap.push(next, step + heuristic(next));
      }
    }
    if (from[goal] < 0) return null;
    const cells = [goal];
    while (cells[cells.length - 1] !== start) cells.push(from[cells[cells.length - 1]]);
    return cells.reverse();
  }

  // Drops the points that can be skipped in a straight line, so the monster walks diagonally across
  // the room instead of along the grid.
  smooth(points, radius) {
    if (points.length <= 2) return points;
    const result = [points[0]];
    let anchor = 0;
    while (anchor < points.length - 1) {
      let next = points.length - 1;
      while (next > anchor + 1) {
        const [x0, z0] = points[anchor];
        const [x1, z1] = points[next];
        if (this.lineFree(x0, z0, x1, z1, radius * 0.96)) break;
        next -= 1;
      }
      result.push(points[next]);
      anchor = next;
    }
    return result;
  }

  // A random point with some room around it, inside the given rectangle.
  randomFreePoint(radius, { minX = -Infinity, maxX = Infinity, minZ = -Infinity, maxZ = Infinity } = {}) {
    if (!this.ready) this.build();
    for (let attempt = 0; attempt < 200; attempt += 1) {
      const x = THREE.MathUtils.lerp(Math.max(minX, this.minX), Math.min(maxX, this.minX + this.cols * this.cell), Math.random());
      const z = THREE.MathUtils.lerp(Math.max(minZ, this.minZ), Math.min(maxZ, this.minZ + this.rows * this.cell), Math.random());
      if (this.clearanceAt(x, z) >= radius + COMFORT) return [x, z];
    }
    return null;
  }

  // A picture of the grid for the debug view: blocked cells, the margin of the given radius and
  // the raised floor.
  debugTexture(radius) {
    const canvas = document.createElement('canvas');
    canvas.width = this.cols;
    canvas.height = this.rows;
    const context = canvas.getContext('2d');
    const image = context.createImageData(this.cols, this.rows);
    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.cols; col += 1) {
        const cell = row * this.cols + col;
        const pixel = cell * 4;
        const x = this.centerX(col);
        const z = this.centerZ(row);
        const clearance = this.clearanceAt(x, z);
        if (this.blocked[cell]) image.data.set([220, 40, 60, 200], pixel);
        else if (clearance < radius) image.data.set([255, 150, 60, 130], pixel);
        else if (this.ground[cell] > 0.005) image.data.set([60, 140, 255, 90], pixel);
        else image.data.set([0, 0, 0, 0], pixel);
      }
    }
    context.putImageData(image, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  get bounds() {
    return {
      minX: this.minX,
      minZ: this.minZ,
      maxX: this.minX + this.cols * this.cell,
      maxZ: this.minZ + this.rows * this.cell,
    };
  }
}
