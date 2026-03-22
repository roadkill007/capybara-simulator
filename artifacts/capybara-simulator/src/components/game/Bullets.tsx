import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { playerState } from './playerState';
import { enemyList } from './Enemies';

interface Bullet {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  trail: THREE.Vector3[];
}

let bulletId = 0;
const bullets: Bullet[] = [];

// Exposed for Capybara to call
export function fireBullet() {
  const dir = playerState.facing.clone().normalize();
  const spawnPos = playerState.position.clone().add(new THREE.Vector3(0, 0.4, 0)).addScaledVector(dir, 0.8);
  bullets.push({
    id: bulletId++,
    position: spawnPos,
    velocity: dir.multiplyScalar(28),
    life: 2.5,
    trail: [],
  });
}

export function Bullets() {
  const meshRefs = useRef<Map<number, THREE.Mesh>>(new Map());
  const { phase } = useGameStore();
  const frameCount = useRef(0);

  useFrame((scene, dt) => {
    if (phase !== 'playing') return;
    frameCount.current++;

    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.life -= dt;

      if (b.life <= 0) {
        bullets.splice(i, 1);
        continue;
      }

      b.position.addScaledVector(b.velocity, dt);

      // Hit detection vs enemies
      let hit = false;
      for (const enemy of enemyList) {
        if (enemy.state === 'dead') continue;
        const dist = b.position.distanceTo(enemy.position);
        if (dist < 1.2) {
          enemy.health = Math.max(0, enemy.health - 34); // 3 shots to kill
          bullets.splice(i, 1);
          hit = true;
          break;
        }
      }

      if (!hit) {
        const mesh = meshRefs.current.get(b.id);
        if (mesh) {
          mesh.position.copy(b.position);
        }
      }
    }

    // Force update
    scene.invalidate?.();
  });

  return (
    <>
      {bullets.map(b => (
        <group key={b.id}>
          <mesh
            ref={(mesh) => {
              if (mesh) meshRefs.current.set(b.id, mesh);
              else meshRefs.current.delete(b.id);
            }}
            position={b.position.toArray() as [number, number, number]}
          >
            <sphereGeometry args={[0.14, 8, 8]} />
            <meshBasicMaterial color="#FFD700" />
          </mesh>
          {/* Glow */}
          <mesh position={b.position.toArray() as [number, number, number]}>
            <sphereGeometry args={[0.22, 6, 6]} />
            <meshBasicMaterial color="#FF8C00" transparent opacity={0.4} />
          </mesh>
        </group>
      ))}
    </>
  );
}
