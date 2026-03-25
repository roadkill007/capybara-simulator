/**
 * Enemies — imperative ref pattern (zero React re-renders per frame).
 *
 * All AI position/state logic runs against a module-level mutable array.
 * Mesh positions are updated imperatively via refs in a single useFrame.
 * React state (aliveIds) only changes on spawn or death — infrequent events.
 */
import { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { playerState } from './playerState';

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

// Module-level store — mutated every frame, never causes React renders
const _enemies: EnemyData[] = [];

// Shared with Bullets for hit detection (same reference)
export const enemyList: EnemyData[] = _enemies;

interface EnemyRefs {
  group: THREE.Group;
  bodyMat: THREE.MeshStandardMaterial;
  healthFill: THREE.Mesh;
  healthFillMat: THREE.MeshStandardMaterial;
}

// Ref registry: filled imperatively by each ScaryCapybara on mount
const _refs = new Map<string, EnemyRefs>();

const ENEMY_SPEED      = 1.9;   // was 3.2 — less aggressive chasing
const ENEMY_CHASE_DIST = 11;   // was 18 — only chase when clearly nearby
const ENEMY_ATTACK_DIST = 1.5;
const ENEMY_DAMAGE     = 20;
const MAX_ENEMIES      = 6;
const SPAWN_INTERVAL   = 14;

// ─── ScaryCapybara — renders ONCE, never re-renders from prop changes ─────────
function ScaryCapybara({ id }: { id: string }) {
  const groupRef = useRef<THREE.Group>(null!);
  const healthFillRef = useRef<THREE.Mesh>(null!);

  // Materials created once per enemy — updated imperatively via .color.set()
  const bodyMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#6B1010', roughness: 0.85, metalness: 0.03,
  }), []);
  const healthFillMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#44FF44', emissive: '#22AA22', emissiveIntensity: 0.4,
    roughness: 0.4, metalness: 0.2,
  }), []);
  const darkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1A0303', roughness: 0.88, metalness: 0.01 }), []);
  const boneMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#E8E0D0', roughness: 0.55, metalness: 0.05 }), []);
  const bgHealthMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#222222', roughness: 0.8, metalness: 0.3 }), []);
  const eyeMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#FF0000', roughness: 0.05, metalness: 0.1,
    emissive: '#FF0000', emissiveIntensity: 1.2,
  }), []);

  // Register refs on mount so parent useFrame can move this mesh
  useEffect(() => {
    _refs.set(id, {
      group: groupRef.current,
      bodyMat,
      healthFill: healthFillRef.current,
      healthFillMat,
    });
    return () => { _refs.delete(id); };
  }, [id, bodyMat, healthFillMat]);

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh castShadow material={bodyMat}>
        <capsuleGeometry args={[0.38, 0.75, 4, 8]} />
      </mesh>

      {/* Spiky back spines */}
      {([-0.2, 0, 0.2] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 0.5, 0]} rotation={[0, 0, x * 0.3]} castShadow material={darkMat}>
          <coneGeometry args={[0.06, 0.35, 5]} />
        </mesh>
      ))}

      {/* Head */}
      <group position={[0, 0.28, 0.6]}>
        <mesh castShadow material={bodyMat}>
          <boxGeometry args={[0.52, 0.4, 0.5]} />
        </mesh>

        {/* Red eyes */}
        <mesh position={[-0.16, 0.1, 0.24]} material={eyeMat}>
          <sphereGeometry args={[0.07, 6, 6]} />
        </mesh>
        <mesh position={[0.16, 0.1, 0.24]} material={eyeMat}>
          <sphereGeometry args={[0.07, 6, 6]} />
        </mesh>

        {/* Angry brows */}
        <mesh position={[-0.14, 0.2, 0.24]} rotation={[0, 0, 0.4]} material={darkMat}>
          <boxGeometry args={[0.15, 0.04, 0.05]} />
        </mesh>
        <mesh position={[0.14, 0.2, 0.24]} rotation={[0, 0, -0.4]} material={darkMat}>
          <boxGeometry args={[0.15, 0.04, 0.05]} />
        </mesh>

        {/* Fangs */}
        <mesh position={[-0.08, -0.16, 0.26]} material={boneMat}>
          <coneGeometry args={[0.04, 0.12, 5]} />
        </mesh>
        <mesh position={[0.08, -0.16, 0.26]} material={boneMat}>
          <coneGeometry args={[0.04, 0.12, 5]} />
        </mesh>

        {/* Ears */}
        <mesh position={[-0.22, 0.26, -0.04]} rotation={[0, 0, -0.3]} castShadow material={darkMat}>
          <capsuleGeometry args={[0.08, 0.1, 3, 6]} />
        </mesh>
        <mesh position={[0.22, 0.26, -0.04]} rotation={[0, 0, 0.3]} castShadow material={darkMat}>
          <capsuleGeometry args={[0.08, 0.1, 3, 6]} />
        </mesh>
      </group>

      {/* Legs */}
      {([[-0.3, -0.38, 0.25], [0.3, -0.38, 0.25], [-0.3, -0.38, -0.25], [0.3, -0.38, -0.25]] as [number,number,number][]).map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} castShadow material={darkMat}>
          <capsuleGeometry args={[0.1, 0.24, 3, 6]} />
        </mesh>
      ))}

      {/* Health bar — bg */}
      <group position={[0, 1.2, 0]}>
        <mesh material={bgHealthMat}>
          <boxGeometry args={[0.8, 0.1, 0.05]} />
        </mesh>
        {/* Health fill — scale.x driven imperatively */}
        <mesh ref={healthFillRef} material={healthFillMat} position={[-0.4, 0, 0.01]} scale={[1, 1, 1]}>
          <boxGeometry args={[0.8, 0.08, 0.05]} />
        </mesh>
      </group>
    </group>
  );
}

// ─── Enemies — AI logic runs in useFrame, zero per-frame React re-renders ─────
export function Enemies() {
  const [aliveIds, setAliveIds] = useState<string[]>([]);
  const spawnTimer      = useRef(SPAWN_INTERVAL);
  const pendingDamage   = useRef(0);
  const pendingKills    = useRef(0);
  const walkPhase       = useRef(0);

  const { phase, damagePlayer, killEnemy, soccerPhase, shootingPhase, racePhase } = useGameStore();

  const removeId = useCallback((id: string) => {
    setAliveIds(prev => prev.filter(i => i !== id));
  }, []);

  useFrame((_, dt) => {
    if (phase !== 'playing') return;

    walkPhase.current += dt;
    pendingDamage.current = 0;
    pendingKills.current  = 0;

    // ── Spawn ───────────────────────────────────────────────────────────────
    spawnTimer.current -= dt;
    const liveCount = _enemies.filter(e => e.state !== 'dead').length;
    if (spawnTimer.current <= 0 && liveCount < MAX_ENEMIES) {
      spawnTimer.current = SPAWN_INTERVAL;
      const angle = Math.random() * Math.PI * 2;
      const dist  = 25 + Math.random() * 15;
      const spawnPos = new THREE.Vector3(
        Math.max(-55, Math.min(55, playerState.position.x + Math.cos(angle) * dist)),
        0.4,
        Math.max(-55, Math.min(55, playerState.position.z + Math.sin(angle) * dist))
      );
      const id = String(Date.now() + Math.random());
      _enemies.push({
        id, position: spawnPos, health: 100, state: 'roam',
        dir: new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize(),
        stateTimer: 3 + Math.random() * 4, roamAngle: Math.random() * Math.PI * 2,
        hitFlash: 0, deathTimer: 0,
      });
      setAliveIds(prev => [...prev, id]);
    }

    // ── AI logic + imperative mesh updates ───────────────────────────────────
    const inMiniGame =
      soccerPhase === 'playing' || shootingPhase === 'playing' ||
      racePhase === 'countdown' || racePhase === 'racing';

    const toRemove: string[] = [];

    for (let i = 0; i < _enemies.length; i++) {
      const e = _enemies[i];
      const refs = _refs.get(e.id);

      // ── Dead: sink and despawn ──────────────────────────────────────────
      if (e.state === 'dead') {
        e.deathTimer -= dt;
        if (e.deathTimer <= 0) {
          toRemove.push(e.id);
          continue;
        }
        if (refs) {
          const progress = 1 - Math.max(0, e.deathTimer) / 1.5;
          refs.group.position.set(e.position.x, e.position.y - progress * 1.4, e.position.z);
          refs.group.scale.setScalar(Math.max(0.01, 1 - progress * 0.7));
          refs.group.rotation.z = progress * 1.2;
        }
        continue;
      }

      // ── Alive: tick timers ─────────────────────────────────────────────
      e.stateTimer -= dt;
      e.hitFlash    = Math.max(0, e.hitFlash - dt * 4);

      const toPlayer    = playerState.position.clone().sub(e.position);
      toPlayer.y        = 0;
      const distSq      = toPlayer.lengthSq();

      // State machine
      if (!inMiniGame && distSq < ENEMY_ATTACK_DIST * ENEMY_ATTACK_DIST) {
        e.state = 'attack';
      } else if (!inMiniGame && distSq < ENEMY_CHASE_DIST * ENEMY_CHASE_DIST) {
        e.state = 'chase';
      } else if (e.state === 'chase' || e.state === 'attack') {
        e.state = 'roam';
      }

      // Movement
      if (e.state === 'attack') {
        if (e.stateTimer <= 0) {
          pendingDamage.current += ENEMY_DAMAGE;
          e.stateTimer = 1.5;
        }
      } else if (e.state === 'chase') {
        const moveDir = toPlayer.normalize();
        e.position.x += moveDir.x * ENEMY_SPEED * dt;
        e.position.z += moveDir.z * ENEMY_SPEED * dt;
      } else {
        if (e.stateTimer <= 0) {
          e.dir.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
          e.stateTimer = 2 + Math.random() * 3;
        }
        e.position.x = Math.max(-55, Math.min(55, e.position.x + e.dir.x * 1.5 * dt));
        e.position.z = Math.max(-55, Math.min(55, e.position.z + e.dir.z * 1.5 * dt));
      }

      // Bullet hit check (health mutated by Bullets directly on enemyList)
      if (e.health <= 0) {
        e.state     = 'dead';
        e.deathTimer = 1.5;
        pendingKills.current += 1;
      }

      // ── Imperative mesh update ──────────────────────────────────────────
      if (refs) {
        const isChasing = e.state === 'chase' || e.state === 'attack';
        const flash     = e.hitFlash > 0.5;

        refs.group.position.copy(e.position);
        refs.group.scale.setScalar(1);
        refs.group.rotation.z = 0;

        // Face player
        if (distSq > 0.01) {
          refs.group.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);
        }

        // Walk bob
        if (e.state === 'chase') {
          refs.group.position.y = e.position.y + Math.sin(walkPhase.current * 6) * 0.05;
        }

        // Body color: hit flash → chase red → roam dark
        if (flash) {
          refs.bodyMat.color.setHex(0xFF4444);
          refs.bodyMat.emissiveIntensity = 0;
        } else if (isChasing) {
          refs.bodyMat.color.setHex(0x3D0808);
          refs.bodyMat.emissiveIntensity = 0.3;
        } else {
          refs.bodyMat.color.setHex(0x6B1010);
          refs.bodyMat.emissiveIntensity = 0;
        }

        // Health bar fill — pivot is at left edge, scale X = health %
        const hp = Math.max(0, e.health) / 100;
        refs.healthFill.scale.x = hp;
        if (e.health > 50)      refs.healthFillMat.color.setHex(0x44FF44);
        else if (e.health > 25) refs.healthFillMat.color.setHex(0xFFAA00);
        else                    refs.healthFillMat.color.setHex(0xFF2222);
      }
    }

    // Remove dead enemies from the module array
    for (const id of toRemove) {
      const idx = _enemies.findIndex(e => e.id === id);
      if (idx !== -1) _enemies.splice(idx, 1);
      removeId(id);
    }

    // Apply damage/kills outside any updater (no setState-during-render)
    if (pendingDamage.current > 0) damagePlayer(pendingDamage.current);
    for (let k = 0; k < pendingKills.current; k++) killEnemy();
  });

  return (
    <>
      {aliveIds.map(id => <ScaryCapybara key={id} id={id} />)}
    </>
  );
}
