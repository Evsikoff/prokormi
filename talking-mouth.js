import * as THREE from 'three';

// The people of the game (the father, coach Max) have no jaw bone and no lip morphs: their mouths
// are only painted on the texture. While one of them speaks, the shader draws an open mouth over the
// painted one, the way the monster's is drawn: a dark oval between the lips that opens and closes.
//
// `place` is in the model's own coordinates before skinning (metres, raw GLB scale), so the mouth
// stays on the lips whatever the head does: centre between the lips (x, y), half width (rx), half
// height when fully open (ry), and how far forward the face must be for the mouth to be drawn (frontZ).
export function createTalkingMouth(place) {
  const uniforms = {
    talkMouthCenter: { value: new THREE.Vector2(place.x, place.y) },
    talkMouthSize: { value: new THREE.Vector2(place.rx, place.ry) },
    talkMouthFront: { value: place.frontZ },
    talkMouthOpen: { value: 0 },
    talkMouthFade: { value: 0 },
  };
  let phase = 0;
  let fade = 0;

  return {
    uniforms,

    paint(material) {
      if (!material || material.userData.talkingMouth) return;
      material.userData.talkingMouth = uniforms;
      material.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, uniforms);
        shader.vertexShader = shader.vertexShader
          .replace('#include <common>', `#include <common>
varying vec3 vTalkBind;`)
          .replace('#include <begin_vertex>', `#include <begin_vertex>
vTalkBind = position;`);
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <common>', `#include <common>
uniform vec2 talkMouthCenter;
uniform vec2 talkMouthSize;
uniform float talkMouthFront;
uniform float talkMouthOpen;
uniform float talkMouthFade;
varying vec3 vTalkBind;`)
          .replace('#include <map_fragment>', `#include <map_fragment>
if (talkMouthFade > 0.001 && vTalkBind.z > talkMouthFront) {
  // The lower lip drops, so the oval grows downwards from the line between the lips.
  float open = mix(0.18, 1.0, talkMouthOpen);
  vec2 mouth = vTalkBind.xy - talkMouthCenter;
  mouth.y += talkMouthSize.y * open * 0.45;
  mouth /= vec2(talkMouthSize.x, talkMouthSize.y * open);
  float mask = (1.0 - smoothstep(0.7, 1.0, length(mouth))) * talkMouthFade;
  // A light band of upper teeth shows once the mouth is open wide enough.
  float teeth = smoothstep(0.35, 0.6, mouth.y) * smoothstep(0.45, 0.75, talkMouthOpen);
  vec3 inside = mix(vec3(0.12, 0.025, 0.035), vec3(0.86, 0.82, 0.76), teeth);
  diffuseColor.rgb = mix(diffuseColor.rgb, inside, mask);
}`);
      };
      material.needsUpdate = true;
    },

    // Called every frame; the mouth fades in while `talking` and out when the line is over.
    update(delta, talking) {
      fade += ((talking ? 1 : 0) - fade) * Math.min(1, delta * 10);
      if (talking) phase += delta * 10.2;
      // Two waves out of step, so the mouth opens unevenly instead of ticking like a metronome.
      const open = Math.sin(phase) * 0.5 + 0.5;
      const stress = Math.sin(phase * 0.43 + 1.3) * 0.5 + 0.5;
      uniforms.talkMouthOpen.value = open * (0.45 + 0.55 * stress);
      uniforms.talkMouthFade.value = fade;
    },

    reset() {
      fade = 0;
      uniforms.talkMouthFade.value = 0;
    },
  };
}
