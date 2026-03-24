import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { playerState } from './playerState';

export interface BulletHit {
  id: string;
  position: THREE.Vector3;
}

export interface EnemyData {
  id: string;
  position: THREE.Vector3;
  health: number;
  state: 'roam' | 'chase' | 'attack' | 'dead';
  dir: THREE.Vector3;
  stateTimer: number;
  roamAngle: number;
  hitFlash: number;
  deathTimer: number;
}

// Shared enemy list for bullet collision
export const enemyList: EnemyData[] = [];

const ENEMY_SPEED = 3.2;
const ENEMY_CHASE_DIST = 18;
const ENEMY_ATTACK_DIST = 1.5;
const ENEMY_DAMAGE = 20;
const MAX_ENEMIES = 8;
const SPAWN_INTERVAL = 12;

function ScaryCapybara({ enemy }: { enemy: EnemyData }) {
  const groupRef = useRef<THREE.Group>(null!);
  const t = useRef(Math.random() * 10);

  useFrame((_, dt) => {
    t.current += dt;
    if (!groupRef.current) return;

    if (enemy.state === 'dead') {
      // Sink into ground over 1.5s
      const progress = 1 - Math.max(0, enemy.deathTimer) / 1.5;
      const sinkY = enemy.position.y - progress * 1.4;
      groupRef.current.position.set(enemy.position.x, sinkY, enemy.position.z);
      groupRef.current.scale.setScalar(Math.max(0.01, 1 - progress * 0.7));
      groupRef.current.rotation.z = progress * 1.2;
      return;
    }

    groupRef.current.position.copy(enemy.position);
    groupRef.current.scale.setScalar(1);
    groupRef.current.rotation.z = 0;

    const toPlayer = playerState.position.clone().sub(enemy.position);
    toPlayer.y = 0;
    if (toPlayer.lengthSq() > 0.01) {
      const targetAngle = Math.atan2(toPlayer.x, toPlayer.z);
      groupRef.current.rotation.y = targetAngle;
    }

    if (enemy.state === 'chase') {
      groupRef.current.children[0]?.position.set(0, Math.sin(t.current * 6) * 0.05, 0);
    }
  });

  if (enemy.state === 'dead' && enemy.deathTimer <= 0) return null;

  const isChasing = enemy.state === 'chase' || enemy.state === 'attack';
  const flash = enemy.hitFlash > 0;
  const bodyColor = flash ? '#FF4444' : isChasing ? '#3D0808' : '#6B1010';
  const darkColor = '#1A0303';

  return (
    <group ref={groupRef} position={enemy.position.toArray() as [number, number, number]}>
      <group>
        {/* Body — PBR dark fur */}
        <mesh castShadow>
          <capsuleGeometry args={[0.38, 0.75, 8, 16]} />
          <meshStandardMaterial color={bodyColor} roughness={0.85} metalness={0.03}
            emissive={isChasing ? '#440000' : '#000000'} emissiveIntensity={isChasing ? 0.3 : 0} />
        </mesh>

        {/* Spiky back spines */}
        {[-0.2, 0, 0.2].map((x, i) => (
          <mesh key={i} position={[x, 0.5, 0]} rotation={[0, 0, x * 0.3]} castShadow>
            <coneGeometry args={[0.06, 0.35, 6]} />
            <meshStandardMaterial color="#0A0000" roughness={0.7} metalness={0.08} />
          </mesh>
        ))}

        {/* Head */}
        <group position={[0, 0.28, 0.6]}>
          <mesh castShadow>
            <boxGeometry args={[0.52, 0.4, 0.5]} />
            <meshStandardMaterial color={bodyColor} roughness={0.85} metalness={0.03}
              emissive={isChasing ? '#440000' : '#000000'} emissiveIntensity={isChasing ? 0.3 : 0} />
          </mesh>

          {/* Angry glowing eyes */}
          <mesh position={[-0.16, 0.1, 0.24]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial color="#FF0000" roughness={0.05} metalness={0.1} emissive="#FF0000" emissiveIntensity={1.2} />
          </mesh>
          <mesh position={[0.16, 0.1, 0.24]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial color="#FF0000" roughness={0.05} metalness={0.1} emissive="#FF0000" emissiveIntensity={1.2} />
          </mesh>

          {/* Angry brow */}
          <mesh position={[-0.14, 0.2, 0.24]} rotation={[0, 0, 0.4]}>
            <boxGeometry args={[0.15, 0.04, 0.05]} />
            <meshStandardMaterial color={darkColor} roughness={0.90} metalness={0.01} />
          </mesh>
          <mesh position={[0.14, 0.2, 0.24]} rotation={[0, 0, -0.4]}>
            <boxGeometry args={[0.15, 0.04, 0.05]} />
            <meshStandardMaterial color={darkColor} roughness={0.90} metalness={0.01} />
          </mesh>

          {/* Fangs — bone PBR */}
          <mesh position={[-0.08, -0.16, 0.26]}>
            <coneGeometry args={[0.04, 0.12, 6]} />
            <meshStandardMaterial color="#E8E0D0" roughness={0.55} metalness={0.05} />
          </mesh>
          <mesh position={[0.08, -0.16, 0.26]}>
            <coneGeometry args={[0.04, 0.12, 6]} />
            <meshStandardMaterial color="#E8E0D0" roughness={0.55} metalness={0.05} />
          </mesh>

          {/* Ears */}
          <mesh position={[-0.22, 0.26, -0.04]} rotation={[0, 0, -0.3]} castShadow>
            <capsuleGeometry args={[0.08, 0.1, 4, 8]} />
            <meshStandardMaterial color={darkColor} roughness={0.88} metalness={0.01} />
          </mesh>
          <mesh position={[0.22, 0.26, -0.04]} rotation={[0, 0, 0.3]} castShadow>
            <capsuleGeometry args={[0.08, 0.1, 4, 8]} />
            <meshStandardMaterial color={darkColor} roughness={0.88} metalness={0.01} />
          </mesh>
        </group>

        {/* Legs */}
        {[[-0.3, -0.38, 0.25], [0.3, -0.38, 0.25], [-0.3, -0.38, -0.25], [0.3, -0.38, -0.25]].map(([x, y, z], i) => (
          <mesh key={i} position={[x, y, z]} castShadow>
            <capsuleGeometry args={[0.1, 0.24, 4, 8]} />
            <meshStandardMaterial color={darkColor} roughness={0.88} metalness={0.01} />
          </mesh>
        ))}

        {/* Health bar */}
        <group position={[0, 1.2, 0]}>
          <mesh>
            <boxGeometry args={[0.8, 0.1, 0.05]} />
            <meshStandardMaterial color="#222222" roughness={0.8} metalness={0.3} />
          </mesh>
          <mesh position={[(enemy.health / 100 - 1) * 0.4, 0, 0.01]}>
            <boxGeometry args={[0.8 * (enemy.health / 100), 0.08, 0.05]} />
            <meshStandardMaterial
              color={enemy.health > 50 ? '#44FF44' : enemy.health > 25 ? '#FFAA00' : '#FF2222'}
              emissive={enemy.health > 50 ? '#22AA22' : enemy.health > 25 ? '#AA6600' : '#AA0000'}
              emissiveIntensity={0.4}
              roughness={0.4} metalness={0.2}
            />
          </mesh>
        </group>

        {/* Red aura when chasing */}
        {isChasing && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
            <ringGeometry args={[0.6, 0.9, 16]} />
            <meshStandardMaterial color="#FF0000" transparent opacity={0.3} roughness={0.2} metalness={0.3} emissive="#AA0000" emissiveIntensity={0.5} />
          </mesh>
        )}
      </group>
    </group>
  );
}

export function Enemies() {
  const [enemies, setEnemies] = useState<EnemyData[]>([]);
  const spawnTimer = useRef(SPAWN_INTERVAL);
  const { phase, damagePlayer, killEnemy } = useGameStore();

  // Keep enemyList in sync
  useEffect(() => {
    enemyList.length = 0;
    enemies.forEach(e => enemyList.push(e));
  }, [enemies]);

  useFrame((_, dt) => {
    if (phase !== 'playing') return;

    spawnTimer.current -= dt;
    if (spawnTimer.current <= 0 && enemies.filter(e => e.state !== 'dead').length < MAX_ENEMIES) {
      spawnTimer.current = SPAWN_INTERVAL;
      const angle = Math.random() * Math.PI * 2;
      const dist = 25 + Math.random() * 15;
      const spawnPos = new THREE.Vector3(
        playerState.position.x + Math.cos(angle) * dist,
        0.4,
        playerState.position.z + Math.sin(angle) * dist
      );
      spawnPos.x = Math.max(-55, Math.min(55, spawnPos.x));
      spawnPos.z = Math.max(-55, Math.min(55, spawnPos.z));

      const newEnemy: EnemyData = {
        id: String(Date.now() + Math.random()),
        position: spawnPos,
        health: 100,
        state: 'roam',
        dir: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize(),
        stateTimer: 3 + Math.random() * 4,
        roamAngle: Math.random() * Math.PI * 2,
        hitFlash: 0,
        deathTimer: 0,
      };

      setEnemies(prev => [...prev, newEnemy]);
    }

    setEnemies(prev => prev.map(enemy => {
      // Tick down death animation then mark for removal
      if (enemy.state === 'dead') {
        const updated = { ...enemy, deathTimer: enemy.deathTimer - dt };
        return updated;
      }

      const updated = { ...enemy };
      updated.stateTimer -= dt;
      updated.hitFlash = Math.max(0, updated.hitFlash - dt * 4);

      const toPlayer = playerState.position.clone().sub(enemy.position);
      toPlayer.y = 0;
      const distToPlayer = toPlayer.length();

      // State transitions
      if (distToPlayer < ENEMY_ATTACK_DIST) {
        updated.state = 'attack';
      } else if (distToPlayer < ENEMY_CHASE_DIST) {
        updated.state = 'chase';
      } else {
        updated.state = 'roam';
      }

      // Movement
      if (updated.state === 'attack') {
        // Deal damage
        if (updated.stateTimer <= 0) {
          damagePlayer(ENEMY_DAMAGE);
          updated.stateTimer = 1.5;
        }
      } else if (updated.state === 'chase') {
        const moveDir = toPlayer.normalize();
        updated.position = new THREE.Vector3(
          enemy.position.x + moveDir.x * ENEMY_SPEED * dt,
          enemy.position.y,
          enemy.position.z + moveDir.z * ENEMY_SPEED * dt
        );
      } else {
        // Roam
        if (updated.stateTimer <= 0) {
          updated.dir = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
          updated.stateTimer = 2 + Math.random() * 3;
        }
        updated.position = new THREE.Vector3(
          enemy.position.x + updated.dir.x * 1.5 * dt,
          enemy.position.y,
          enemy.position.z + updated.dir.z * 1.5 * dt
        );
        // Clamp
        updated.position.x = Math.max(-55, Math.min(55, updated.position.x));
        updated.position.z = Math.max(-55, Math.min(55, updated.position.z));
      }

      // Check bullet hits (poll enemyList for updates)
      const listEntry = enemyList.find(e => e.id === enemy.id);
      if (listEntry && listEntry.health !== enemy.health) {
        updated.health = listEntry.health;
        updated.hitFlash = 1;
        if (updated.health <= 0) {
          updated.state = 'dead';
          updated.deathTimer = 1.5;
          killEnemy();
        }
      }

      return updated;
    }).filter(e => !(e.state === 'dead' && e.deathTimer <= 0))); // remove after death animation
  });

  return (
    <>
      {enemies.map(enemy => (
        <ScaryCapybara key={enemy.id} enemy={enemy} />
      ))}
    </>
  );
}
