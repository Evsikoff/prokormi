import * as THREE from 'three';

// The room needs a few moves the monster's clips do not have: eating with the snout in the bowl,
// climbing, hopping onto furniture, sitting, rummaging in a drawer, drawing. They are built here
// from the monster's own skeleton as ordinary animation clips, so the shared mixer blends them with
// the imported ones.
//
// A pose is written in the monster's own frame: +x is its left, +y up, +z the way it faces. It turns
// bones about those axes, in degrees, starting from the T-pose (`restpose` clip). A turn is relative
// to the parent bone, the way a joint bends: bending the spine forward carries the arms with it.
// `sym` holds turns for the left side; the right side gets their mirror image.

const DEG = Math.PI / 180;
const AXES = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
};
const PREFIX = 'mixamorig';
const FEET = {
  left: ['LeftFoot', 'LeftToeBase', 'LeftToe_End'],
  right: ['RightFoot', 'RightToeBase', 'RightToe_End'],
};
const HIPS = 'Hips';
// The joints a lying body rests on.
const BODY_JOINTS = ['Hips', 'Spine1', 'Spine2', 'Neck', 'Head', 'LeftShoulder', 'RightShoulder', 'LeftUpLeg', 'RightUpLeg', 'LeftLeg', 'RightLeg', 'LeftFoot', 'RightFoot', 'LeftForeArm', 'RightForeArm'];

const tmpQuaternion = new THREE.Quaternion();

function mirrorTurns(turns) {
  return turns.map(([axis, degrees]) => [axis, axis === 'x' ? degrees : -degrees]);
}

// Concatenates pose specs: the turns of every bone are applied one after another.
export function mergePoses(...specs) {
  const result = { bones: {}, sym: {} };
  for (const spec of specs) {
    if (!spec) continue;
    for (const key of ['bones', 'sym']) {
      for (const [bone, turns] of Object.entries(spec[key] ?? {})) {
        result[key][bone] = [...(result[key][bone] ?? []), ...turns];
      }
    }
    if (spec.ground !== undefined) result.ground = spec.ground;
    if (spec.seat !== undefined) result.seat = spec.seat;
    if (spec.lift !== undefined) result.lift = spec.lift;
    if (spec.rest !== undefined) result.rest = spec.rest;
    if (spec.offset !== undefined) result.offset = spec.offset;
    if (spec.shift !== undefined) result.shift = spec.shift;
  }
  return result;
}

// Swaps the two sides of a spec: the left leg's turns go to the right leg, mirrored.
export function mirrorPose(spec) {
  const bones = {};
  for (const [bone, turns] of Object.entries(spec.bones ?? {})) {
    const swapped = bone.startsWith('Left') ? `Right${bone.slice(4)}` : bone.startsWith('Right') ? `Left${bone.slice(5)}` : bone;
    bones[swapped] = mirrorTurns(turns);
  }
  const sym = {};
  for (const [bone, turns] of Object.entries(spec.sym ?? {})) sym[bone] = turns;
  return { ...spec, bones, sym };
}

export class PoseKit {
  constructor(monster, animations, restPose) {
    this.monster = monster;
    this.animations = animations;
    this.bones = [];
    monster.traverse((object) => {
      if (object.isBone) this.bones.push(object);
    });
    this.byName = new Map(this.bones.map((bone) => [bone.name, bone]));
    this.hips = this.bone(HIPS);
    this.rest = new Map(restPose.map(([bone, position, quaternion]) => [bone.name, { position, quaternion }]));
    this.base = this.sample('restpose');
    this.referenceFeet = null;
  }

  bone(name) {
    return this.byName.get(`${PREFIX}${name}`) ?? this.byName.get(name) ?? null;
  }

  // Local rotations of every bone and the position of the hips, `clipName` at `time`.
  sample(clipName, time = 0) {
    const pose = {
      rotations: new Map(this.bones.map((bone) => [bone.name, (this.rest.get(bone.name)?.quaternion ?? bone.quaternion).clone()])),
      hips: (this.rest.get(this.hips.name)?.position ?? this.hips.position).clone(),
    };
    const clip = this.animations.find((item) => item.name === clipName);
    if (!clip) return pose;
    for (const track of clip.tracks) {
      const dot = track.name.lastIndexOf('.');
      const node = track.name.slice(0, dot);
      const property = track.name.slice(dot + 1);
      if (!pose.rotations.has(node)) continue;
      const value = track.createInterpolant().evaluate(Math.min(time, clip.duration));
      if (property === 'quaternion') pose.rotations.get(node).fromArray(value).normalize();
      else if (property === 'position' && node === this.hips.name) pose.hips.fromArray(value);
    }
    return pose;
  }

  clonePose(pose) {
    return {
      rotations: new Map([...pose.rotations].map(([name, quaternion]) => [name, quaternion.clone()])),
      hips: pose.hips.clone(),
    };
  }

  // Rotation of the objects above the skeleton (the armature) in the monster's frame.
  aboveSkeleton(bone) {
    const quaternion = new THREE.Quaternion();
    const chain = [];
    for (let node = bone.parent; node && node !== this.monster; node = node.parent) chain.push(node);
    for (let index = chain.length - 1; index >= 0; index -= 1) quaternion.multiply(chain[index].quaternion);
    return quaternion;
  }

  // Orientation of every bone in the monster's frame for a pose.
  frames(pose) {
    const frames = new Map();
    for (const bone of this.bones) {
      const parent = bone.parent?.isBone ? frames.get(bone.parent.name) : this.aboveSkeleton(bone);
      frames.set(bone.name, parent.clone().multiply(pose.rotations.get(bone.name)));
    }
    return frames;
  }

  // A pose from a spec (see the top of the file), turned from `from` (the T-pose by default).
  pose(spec, from = this.base) {
    const pose = this.clonePose(from);
    const frames = this.frames(from);
    const turns = { ...(spec.bones ?? {}) };
    for (const [bone, list] of Object.entries(spec.sym ?? {})) {
      turns[`Left${bone}`] = [...(turns[`Left${bone}`] ?? []), ...list];
      turns[`Right${bone}`] = [...(turns[`Right${bone}`] ?? []), ...mirrorTurns(list)];
    }
    for (const [name, list] of Object.entries(turns)) {
      const bone = this.bone(name);
      if (!bone || !list.length) continue;
      const turn = new THREE.Quaternion();
      for (const [axis, degrees] of list) turn.premultiply(tmpQuaternion.setFromAxisAngle(AXES[axis], degrees * DEG));
      const parent = bone.parent?.isBone ? frames.get(bone.parent.name) : this.aboveSkeleton(bone);
      const local = parent.clone().invert().multiply(turn).multiply(parent).multiply(pose.rotations.get(bone.name));
      pose.rotations.set(bone.name, local.normalize());
    }
    this.place(pose, spec);
    return pose;
  }

  // Moves the hips so the pose stands where it should: `ground` keeps the soles on the floor under
  // the monster ('both' feet, or only the 'lower' one when a leg is lifted); `seat` puts the hip
  // joints that high over the monster's origin, as a share of their standing height; `rest` lays a
  // lying body down with its lowest joint that high (a share of the standing hip height, for the
  // flesh under it); `lift`, `shift` and `offset` ([x, y, z]) move the hips by shares of the
  // standing hip height.
  place(pose, spec) {
    const hipHeight = this.restHipHeight();
    if (spec.ground) {
      const reference = this.feetReference();
      const feet = this.measureFeet(pose);
      const chosen = spec.ground === 'lower'
        ? [feet.left.y <= feet.right.y ? feet.left : feet.right]
        : [feet.left, feet.right];
      const referenceChosen = spec.ground === 'lower'
        ? [feet.left.y <= feet.right.y ? reference.left : reference.right]
        : [reference.left, reference.right];
      const lowest = Math.min(...chosen.map((foot) => foot.y));
      const referenceLowest = Math.min(...referenceChosen.map((foot) => foot.y));
      const average = (list, key) => list.reduce((sum, foot) => sum + foot[key], 0) / list.length;
      pose.hips.y += referenceLowest - lowest;
      pose.hips.x += average(referenceChosen, 'x') - average(chosen, 'x');
      pose.hips.z += average(referenceChosen, 'z') - average(chosen, 'z');
    }
    if (spec.seat !== undefined) {
      const joints = this.measure(pose, ['LeftUpLeg', 'RightUpLeg']);
      const current = Math.min(...joints.map((point) => point.y));
      pose.hips.y += spec.seat * this.restJointHeight('LeftUpLeg') - current;
    }
    if (spec.rest !== undefined) {
      const joints = this.measure(pose, BODY_JOINTS);
      pose.hips.y += spec.rest * hipHeight - Math.min(...joints.map((point) => point.y));
    }
    if (spec.offset) {
      pose.hips.x += spec.offset[0] * hipHeight;
      pose.hips.y += spec.offset[1] * hipHeight;
      pose.hips.z += spec.offset[2] * hipHeight;
    }
    if (spec.lift) pose.hips.y += spec.lift * hipHeight;
    if (spec.shift) pose.hips.z += spec.shift * hipHeight;
  }

  restHipHeight() {
    return this.restJointHeight(HIPS);
  }

  restJointHeight(name) {
    this.cachedRest ??= new Map();
    if (!this.cachedRest.has(name)) this.cachedRest.set(name, this.measure(this.base, [name])[0].y);
    return this.cachedRest.get(name);
  }

  // Bone scales change with age, so everything measured is forgotten when the monster grows.
  forget() {
    this.referenceFeet = null;
    this.cachedRest = null;
  }

  feetReference() {
    this.referenceFeet ??= this.measureFeet(this.base);
    return this.referenceFeet;
  }

  measureFeet(pose) {
    const points = this.measure(pose, [...FEET.left, ...FEET.right]);
    const foot = (list) => ({
      y: Math.min(...list.map((point) => point.y)),
      x: (list[0].x + list[1].x) / 2,
      z: (list[0].z + list[1].z) / 2,
    });
    return { left: foot(points.slice(0, 3)), right: foot(points.slice(3)) };
  }

  // Positions of bones (or of points given in a bone's own space) in the monster's frame, in the
  // model's units, for a pose. The skeleton is put back as it was afterwards.
  measure(pose, names, localPoints = []) {
    const saved = this.bones.map((bone) => [bone, bone.quaternion.clone(), bone.position.clone()]);
    const savedTransform = [this.monster.position.clone(), this.monster.quaternion.clone(), this.monster.scale.clone()];
    this.monster.position.set(0, 0, 0);
    this.monster.quaternion.identity();
    this.monster.scale.setScalar(1);
    for (const bone of this.bones) bone.quaternion.copy(pose.rotations.get(bone.name));
    this.hips.position.copy(pose.hips);
    this.monster.updateMatrixWorld(true);
    const result = names.map((name, index) => {
      const bone = this.bone(name);
      if (!bone) return new THREE.Vector3();
      const point = localPoints[index] ? localPoints[index].clone() : new THREE.Vector3();
      return bone.localToWorld(point);
    });
    for (const [bone, quaternion, position] of saved) {
      bone.quaternion.copy(quaternion);
      bone.position.copy(position);
    }
    this.monster.position.copy(savedTransform[0]);
    this.monster.quaternion.copy(savedTransform[1]);
    this.monster.scale.copy(savedTransform[2]);
    this.monster.updateMatrixWorld(true);
    return result;
  }

  // An animation clip through the given keys: [{ time, pose }]. The last key of a looping clip
  // should repeat the first.
  clip(name, keys) {
    const times = keys.map((key) => key.time);
    const tracks = this.bones.map((bone) => new THREE.QuaternionKeyframeTrack(
      `${bone.name}.quaternion`,
      times,
      keys.flatMap((key) => key.pose.rotations.get(bone.name).toArray()),
    ));
    tracks.push(new THREE.VectorKeyframeTrack(
      `${this.hips.name}.position`,
      times,
      keys.flatMap((key) => key.pose.hips.toArray()),
    ));
    return new THREE.AnimationClip(name, times[times.length - 1], tracks);
  }
}

// ---------------------------------------------------------------------------------------------
// The room's poses.

// Arms hanging by the sides, elbows a little bent.
const ARMS_DOWN = { sym: { Arm: [['z', -72], ['y', -8]], ForeArm: [['y', -18]] } };

// A squat of depth `amount` (0…1) with the feet flat on the floor and the back leaning forward.
function squat(amount, lean = 0.45) {
  const pitch = 30 * amount * lean;
  const hip = 75 * amount;
  const knee = 120 * amount;
  return {
    bones: { Hips: [['x', pitch]] },
    sym: { UpLeg: [['x', -(pitch + hip)]], Leg: [['x', knee]], Foot: [['x', hip - knee]] },
  };
}

// Head and back bent over something low in front: `amount` 0…1.
function stoop(amount, head = 0) {
  return {
    bones: {
      Spine: [['x', 14 * amount]],
      Spine1: [['x', 14 * amount]],
      Spine2: [['x', 10 * amount]],
      Neck: [['x', 14 * amount + head * 0.4]],
      Head: [['x', 14 * amount + head * 0.6]],
    },
  };
}

// Eating: squatting over the bowl, holding its rim, snout down. `bend` 0…1 sets how low the snout
// goes, `dip` pushes it into the food and `turn` looks for the last pieces.
export function eatPose(bend, { dip = 0, turn = 0 } = {}) {
  return mergePoses(
    squat(0.55 + 0.35 * bend, 0.9),
    stoop(0.5 + 0.9 * bend, 18 * dip),
    { bones: { Head: [['y', turn]], Neck: [['y', turn * 0.5]] } },
    { sym: { Arm: [['y', -72], ['x', 8 + 18 * bend]], ForeArm: [['y', -20], ['z', -10]], Hand: [['x', 20]] } },
    { ground: 'both' },
  );
}

// Sitting on something `seat` high: thighs level, shins hanging, hands on the knees.
export function sitPose({ swing = 0, lean = 6, arms = true } = {}) {
  return mergePoses(
    { bones: { Hips: [['x', -4]], Spine: [['x', lean * 0.5]], Spine1: [['x', lean * 0.5]], Head: [['x', 4]] } },
    { bones: { LeftUpLeg: [['x', -84]], RightUpLeg: [['x', -84]], LeftLeg: [['x', 78 + swing]], RightLeg: [['x', 78 - swing]] } },
    arms ? { sym: { Arm: [['z', -62], ['y', -32]], ForeArm: [['y', -30]] } } : null,
    { seat: 0.3 },
  );
}

// Asleep, curled up on the right side facing forward: knees to the tummy, hands under the cheek.
// `breath` 0…1 fills the tummy.
function sleepPose(breath = 0) {
  return mergePoses(
    {
      bones: {
        Hips: [['z', -78]],
        Spine: [['x', 12 + breath * 2]],
        Spine1: [['x', 10]],
        Spine2: [['x', 8 - breath * 2]],
        Neck: [['x', 10], ['z', 8]],
        Head: [['x', 6], ['z', 10]],
      },
    },
    { sym: { UpLeg: [['x', -104], ['z', -8]], Leg: [['x', 136]], Foot: [['x', 10]] } },
    { sym: { Arm: [['y', -62], ['z', -10], ['x', 20]], ForeArm: [['y', -110]] } },
    // Lying across the nest: the hips go to the side so the head rests in the middle.
    { rest: 0.3, offset: [-0.8, 0, 0] },
  );
}

// One of the two halves of a climbing step: the left hand reaches up for the next hold while the
// left foot pushes; the other half is its mirror image.
function climbHalf() {
  return {
    bones: {
      // The body sways towards the pushing leg: from behind that is what shows the climbing best.
      Hips: [['x', 6], ['z', -9]],
      Spine1: [['z', 6]],
      Spine2: [['x', -4], ['z', 5]],
      Neck: [['x', -12]],
      Head: [['x', -10], ['z', -4]],
      // A wide grip, so the hands show beside the big head from behind.
      LeftArm: [['z', 68], ['y', -28]],
      LeftForeArm: [['z', 14], ['y', -18]],
      LeftHand: [['y', -30]],
      RightArm: [['z', -6], ['y', 42]],
      RightForeArm: [['y', 62]],
      LeftUpLeg: [['x', -84], ['z', 10]],
      LeftLeg: [['x', 104]],
      LeftFoot: [['x', -20]],
      RightUpLeg: [['x', 4]],
      RightLeg: [['x', 16]],
      RightFoot: [['x', 30]],
    },
  };
}

// Rummaging in a low drawer: bent forward, one hand deep inside, the other on the edge.
function rummageHalf() {
  return mergePoses(
    squat(0.35, 0.8),
    stoop(1.1, 10),
    {
      bones: {
        LeftArm: [['y', -80], ['x', 40]],
        LeftForeArm: [['y', -6]],
        RightArm: [['y', 70], ['x', 12], ['z', -10]],
        RightForeArm: [['y', 40]],
      },
    },
    { ground: 'both' },
  );
}

// Drawing at a desk in front: the right hand draws, the left one holds the sheet.
function drawPose(stroke, { seated = false, reach = 0 } = {}) {
  return mergePoses(
    seated ? sitPose({ lean: 14, arms: false }) : {},
    stoop(seated ? 0.6 + reach * 0.4 : 0.35, seated ? 16 : 10),
    {
      bones: {
        RightArm: [['y', 64 + stroke * 12], ['x', 18 + reach * 20 - stroke * 6]],
        RightForeArm: [['y', 30 - stroke * 14]],
        RightHand: [['x', 25]],
        LeftArm: [['y', -58], ['x', 30 + reach * 16]],
        LeftForeArm: [['y', -28]],
      },
    },
    seated ? {} : { ground: 'both' },
  );
}

// Holding something up with both hands over the head.
function cheerPose(height) {
  return mergePoses(
    { sym: { Arm: [['z', 20 + 55 * height], ['y', -30 * (1 - height)]], ForeArm: [['z', 20 * (1 - height)], ['y', -25]] } },
    { bones: { Neck: [['x', -10 * height]], Head: [['x', -12 * height]] } },
    { ground: 'both' },
  );
}

// Builds every room clip for the monster's current proportions. `options.eatBend` is how far the
// monster bends to reach its bowl (the room works it out for the age).
export function buildRoomClips(kit, { eatBend = 0.7 } = {}) {
  // Arms hang down unless the pose says what they do.
  const at = (spec, from) => {
    const ownArms = spec.sym?.Arm || spec.bones?.LeftArm || spec.bones?.RightArm;
    return kit.pose(mergePoses(ownArms ? null : ARMS_DOWN, spec), from);
  };
  const clips = {};

  // Standing still, breathing and looking about.
  const neutral = kit.sample('Mood_neutral');
  const breathe = (amount, look = 0, tilt = 0) => kit.pose({
    bones: { Spine: [['x', amount]], Spine2: [['x', -amount * 0.6]], Neck: [['y', look * 0.4]], Head: [['y', look * 0.6], ['z', tilt]] },
  }, neutral);
  clips.idle = kit.clip('Room_Idle', [
    { time: 0, pose: breathe(0) },
    { time: 0.9, pose: breathe(1.6, 0) },
    { time: 1.6, pose: breathe(0, 26, 4) },
    { time: 2.5, pose: breathe(1.6, 24, 4) },
    { time: 3.2, pose: breathe(0, 0) },
    { time: 4.0, pose: breathe(1.6, -24, -5) },
    { time: 4.9, pose: breathe(0, -22, -5) },
    { time: 5.6, pose: breathe(1.2, 0) },
    { time: 6.4, pose: breathe(0) },
  ]);

  // Eating: the snout goes into the food, comes up a little to chew, goes back in.
  const eat = (dip, turn = 0) => kit.pose(eatPose(eatBend, { dip, turn }));
  clips.eat = kit.clip('Room_Eat', [
    { time: 0, pose: eat(0.2) },
    { time: 0.22, pose: eat(1) },
    { time: 0.45, pose: eat(0.9, 6) },
    { time: 0.7, pose: eat(0.1, 3) },
    { time: 0.95, pose: eat(1, -5) },
    { time: 1.2, pose: eat(0.9, -8) },
    { time: 1.45, pose: eat(0.2) },
  ]);
  // Sniffing an empty bowl: nose down, looking left and right for a forgotten piece.
  clips.sniff = kit.clip('Room_Sniff', [
    { time: 0, pose: eat(0.4, 0) },
    { time: 0.7, pose: eat(0.6, 22) },
    { time: 1.3, pose: eat(0.3, 20) },
    { time: 2.0, pose: eat(0.6, -22) },
    { time: 2.6, pose: eat(0.3, -20) },
    { time: 3.2, pose: eat(0.4, 0) },
  ]);

  // Sleeping curled up, breathing slowly.
  clips.sleep = kit.clip('Room_Sleep', [
    { time: 0, pose: kit.pose(sleepPose(0)) },
    { time: 1.6, pose: kit.pose(sleepPose(1)) },
    { time: 3.4, pose: kit.pose(sleepPose(0)) },
  ]);

  // Climbing: hands and feet take turns; the room lifts the monster in time with them.
  const climbLeft = kit.pose(climbHalf());
  const climbRight = kit.pose(mirrorPose(climbHalf()));
  clips.climb = kit.clip('Room_Climb', [
    { time: 0, pose: climbLeft },
    { time: 0.45, pose: climbRight },
    { time: 0.9, pose: climbLeft },
  ]);
  clips.hang = kit.clip('Room_Hang', [
    { time: 0, pose: climbLeft },
    { time: 1, pose: climbLeft },
  ]);

  // A hop up onto something or down from it: crouch, push off, tuck in the air, land.
  const crouch = at(mergePoses(squat(0.55, 1.2), stoop(0.4), { sym: { Arm: [['z', -60], ['y', 35]] } }, { ground: 'both' }));
  const push = at(mergePoses({ sym: { Arm: [['z', 75], ['y', -25]], Foot: [['x', 30]] } }, { lift: 0.1 }));
  const tuck = at(mergePoses({ sym: { UpLeg: [['x', -70]], Leg: [['x', 95]], Arm: [['y', -65], ['x', -15]] } }, { lift: 0.25 }));
  const land = at(mergePoses(squat(0.6, 1.1), stoop(0.3), { sym: { Arm: [['z', -30], ['y', -45]] } }, { ground: 'both' }));
  const stand = at({ ground: 'both' });
  clips.hop = kit.clip('Room_Hop', [
    { time: 0, pose: stand },
    { time: 0.22, pose: crouch },
    { time: 0.34, pose: push },
    { time: 0.5, pose: tuck },
    { time: 0.68, pose: push },
    { time: 0.8, pose: land },
    { time: 1.05, pose: stand },
  ]);
  // Where the hop leaves the ground and lands, as shares of the clip.
  clips.hop.userData = { takeoff: 0.34 / 1.05, landing: 0.8 / 1.05 };

  // Sitting with the legs swinging.
  clips.sit = kit.clip('Room_Sit', [
    { time: 0, pose: at(sitPose({ swing: 0 })) },
    { time: 0.6, pose: at(sitPose({ swing: 18 })) },
    { time: 1.2, pose: at(sitPose({ swing: 0 })) },
    { time: 1.8, pose: at(sitPose({ swing: -18 })) },
    { time: 2.4, pose: at(sitPose({ swing: 0 })) },
  ]);

  // Rummaging in a drawer: the hands take turns inside.
  const rummageLeft = kit.pose(rummageHalf());
  const rummageRight = kit.pose(mirrorPose(rummageHalf()));
  clips.rummage = kit.clip('Room_Rummage', [
    { time: 0, pose: rummageLeft },
    { time: 0.5, pose: rummageRight },
    { time: 1.0, pose: rummageLeft },
  ]);

  // Tossing a toy up and catching it.
  clips.toss = kit.clip('Room_Toss', [
    { time: 0, pose: at(cheerPose(0.15)) },
    { time: 0.25, pose: at(mergePoses(cheerPose(0.05), squat(0.25), { ground: 'both' })) },
    { time: 0.45, pose: at(cheerPose(1)) },
    { time: 0.95, pose: at(cheerPose(0.9)) },
    { time: 1.2, pose: at(cheerPose(0.15)) },
    { time: 1.4, pose: at(cheerPose(0.15)) },
  ]);
  clips.toss.userData = { release: 0.45 / 1.4, catch: 1.2 / 1.4 };

  // Drawing, standing (on the stool) or sitting.
  for (const seated of [false, true]) {
    const key = seated ? 'drawSeated' : 'draw';
    const strokes = [0, 1, -0.6, 0.8, -1, 0.3, 0];
    clips[key] = kit.clip(seated ? 'Room_Draw_Seated' : 'Room_Draw', strokes.map((stroke, index) => ({
      time: index * 0.32,
      pose: at(drawPose(stroke, { seated, reach: seated ? 0.4 : 0.2 })),
    })));
  }
  return clips;
}
