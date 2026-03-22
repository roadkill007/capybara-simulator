import * as THREE from 'three';

// Shared player state accessible by enemies and bullets
export const playerState = {
  position: new THREE.Vector3(0, 0.4, 0),
  rotation: 0,
  facing: new THREE.Vector3(0, 0, 1),
};
