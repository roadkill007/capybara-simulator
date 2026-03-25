import * as THREE from 'three';

// Shared player state accessible by enemies, bullets, and physics interactions
export const playerState = {
  position: new THREE.Vector3(0, 0.4, 0),
  rotation: 0,
  facing: new THREE.Vector3(0, 0, 1),
  // External impulse written by ball collisions etc, consumed once per Capybara frame
  externalForce: new THREE.Vector3(),
};
