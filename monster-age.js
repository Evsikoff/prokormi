import * as THREE from 'three';

// Growing up. The model as built is the child; the baby and the teen are the same model with
// other body proportions (manifest `ages`, made by build_moods.py), so every mood look works at
// every age. The age layer owns the bone scales it names and the armature's height, never the
// ears or the clips.
export const MONSTER_AGES = ['baby', 'child', 'teen'];

// The editor shows the baby; days 1–8 are the baby, 9–20 the child, 21 on the teen.
export const EDITOR_MONSTER_AGE = 'baby';

export function monsterAgeForDay(day) {
  const number = Number(day) || 0;
  if (number >= 21) return 'teen';
  if (number >= 9) return 'child';
  return 'baby';
}

export function monsterAgeStage(ages, ageKey) {
  return ages?.stages?.[ageKey] ?? ages?.stages?.child ?? null;
}

// Scales the bones of `ageKey` and keeps the feet on the floor. Horns and belly shape keys are
// the caller's: they mix with the player's profile and the mood.
export function applyMonsterAge(model, ages, ageKey) {
  const stage = monsterAgeStage(ages, ageKey);
  if (!model || !stage) return null;
  const touched = new Set(Object.values(ages.stages).flatMap((item) => Object.keys(item.bones ?? {})));
  for (const boneName of touched) {
    const bone = model.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(boneName));
    bone?.scale.setScalar(stage.bones?.[boneName] ?? 1);
  }
  // Legs of another length lift or sink the feet: the thigh scales the whole leg, the foot bone
  // the part below the ankle. The armature moves by the difference so the soles stay at zero.
  const armature = model.getObjectByName(ages.armature);
  if (armature) {
    const leg = stage.bones?.[ages.legBone] ?? 1;
    const foot = stage.bones?.[ages.footBone] ?? 1;
    const hip = ages.hipHeight ?? 0;
    const ankle = ages.ankleHeight ?? 0;
    armature.position.y = (hip - ankle) * leg + ankle * leg * foot - hip;
  }
  // Scenes fit the monster by its bounds, and a skinned mesh caches them from the old proportions.
  model.traverse((object) => {
    if (object.isSkinnedMesh) object.boundingBox = null;
  });
  return stage;
}
