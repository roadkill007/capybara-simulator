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
}

let bulletId = 0;
const bullets: Bullet[] = [];

export function fireBullet() {
  const dir = playerState.facing.clone().normalize();
  const spawnPos = playerState.position.clone().add(new THREE.Vector3(0, 0.4, 0)).addScaledVector(dir, 0.8);
  bullets.push({
    id: bulletId++,
    position: spawnPos,
    velocity: dir.multiplyScalar(28),
    life: 2.0,
  });
}

export function Bullets() {
  const groupRefs = useRef<Map<number, THREE.Group>>(new Map());
  const { phase } = useGameStore();

  useFrame((_, dt) => {
    if (phase !== 'playing') {
      bullets.length = 0;
      return;
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.life -= dt;

      if (b.life <= 0) {
        bullets.splice(i, 1);
        continue;
      }

      b.position.addScaledVector(b.velocity, dt);
      // Apply gravity so bullets arc downward
      b.velocity.y -= 12 * dt;

      // Remove bullets that fall below ground
      if (b.position.y < -2) {
        bullets.splice(i, 1);
        continue;
      }

      // Hit detection vs enemies
      let hit = false;
      for (const enemy of enemyList) {
        if (enemy.state === 'dead') continue;
        const dist = b.position.distanceTo(enemy.position);
        if (dist < 1.2) {
          enemy.health = Math.max(0, enemy.health - 34);
          bullets.splice(i, 1);
          hit = true;
          break;
        }
      }
      if (hit) continue;

      // Update 3D group position via ref
      const grp = groupRefs.current.get(b.id);
      if (grp) grp.position.copy(b.position);
    }
  });

  return (
    <>
      {bullets.map(b => (
        <group
          key={b.id}
          ref={(grp) => {
            if (grp) groupRefs.current.set(b.id, grp);
            else groupRefs.current.delete(b.id);
          }}
          position={b.position.toArray() as [number, number, number]}
        >
          <mesh>
            <sphereGeometry args={[0.14, 6, 6]} />
            <meshBasicMaterial color="#FFD700" />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.22, 5, 5]} />
            <meshBasicMaterial color="#FF8C00" transparent opacity={0.35} />
          </mesh>
        </group>
      ))}
    </>
  );
}
