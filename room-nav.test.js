import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { RoomNav } from './room-nav.js';

// A 4 × 4 m floor with a table-high box in the middle and a thin rug in one corner.
function room() {
  const nav = new RoomNav({ minX: -2, maxX: 2, minZ: -2, maxZ: 2 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(1, 0.7, 1));
  box.position.set(0, 0.35, 0);
  nav.addObject(box);
  const rug = new THREE.Mesh(new THREE.BoxGeometry(1, 0.05, 1));
  rug.position.set(-1.3, 0.025, 1.3);
  nav.addObject(rug);
  nav.build();
  return nav;
}

function minClearance(nav, path) {
  let lowest = Infinity;
  for (let index = 1; index < path.length; index += 1) {
    const [x0, z0] = path[index - 1];
    const [x1, z1] = path[index];
    for (let step = 0; step <= 40; step += 1) {
      const t = step / 40;
      lowest = Math.min(lowest, nav.clearanceAt(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t));
    }
  }
  return lowest;
}

test('the path goes around furniture with the monster’s radius to spare', () => {
  const nav = room();
  const path = nav.findPath([-1.4, 0], [1.4, 0], 0.25);
  assert.ok(path, 'a path exists');
  assert.deepEqual(path[0], [-1.4, 0]);
  const [lastX, lastZ] = path[path.length - 1];
  assert.ok(Math.hypot(lastX - 1.4, lastZ) < 0.05, 'it ends at the goal');
  assert.ok(path.length >= 3, 'it has to turn around the box');
  assert.ok(minClearance(nav, path) >= 0.25 * 0.9, 'no point of the path is inside the margin');
});

test('low surfaces are walked on and lift the feet, tall ones block', () => {
  const nav = room();
  assert.ok(Math.abs(nav.groundAt(-1.3, 1.3) - 0.05) < 0.005, 'the rug lifts the floor');
  assert.equal(nav.groundAt(1.3, 1.3), 0);
  assert.ok(nav.clearanceAt(-1.3, 1.3) > 0.2, 'the rug is not an obstacle');
  assert.equal(nav.clearanceAt(0, 0), 0, 'the box is');
});

test('a goal inside an obstacle is moved to the nearest free spot', () => {
  const nav = room();
  const path = nav.findPath([-1.4, -1.4], [0.1, 0.1], 0.2);
  const [x, z] = path[path.length - 1];
  assert.ok(nav.clearanceAt(x, z) >= 0.2);
  assert.ok(Math.hypot(x - 0.1, z - 0.1) < 0.9, 'the spot is next to the box');
});

test('a monster standing too close steps out first', () => {
  const nav = room();
  const path = nav.findPath([0.62, 0], [1.5, 1.5], 0.25);
  assert.deepEqual(path[0], [0.62, 0]);
  assert.ok(nav.clearanceAt(path[1][0], path[1][1]) >= 0.25);
});

test('a disc of the father blocks the way while he is in the room', () => {
  const nav = room();
  nav.dynamic = [{ x: 1.3, z: 0, radius: 0.3 }];
  const path = nav.findPath([1.3, -1.5], [1.3, 1.5], 0.2);
  assert.ok(minClearance(nav, path) >= 0.2 * 0.9);
  nav.dynamic = [];
  assert.equal(nav.findPath([1.3, -1.5], [1.3, 1.5], 0.2).length, 2, 'without him it is a straight line');
});

test('random strolls pick points with room around them', () => {
  const nav = room();
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const [x, z] = nav.randomFreePoint(0.25, { minX: -1.5, maxX: 1.5, minZ: -1.5, maxZ: 1.5 });
    assert.ok(nav.clearanceAt(x, z) >= 0.25);
    assert.ok(x >= -1.5 && x <= 1.5 && z >= -1.5 && z <= 1.5);
  }
});
