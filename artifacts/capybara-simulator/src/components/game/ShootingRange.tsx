/**
 * ShootingRange — 45-second target shooting mini-game.
 * Range at world position (2, 0, 50). Targets animate via mesh refs (no re-renders).
 * Hit detection: ray from player position × facing direction vs target cylinder.
 */
import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { playerState } from './playerState';

export const RANGE_CX = 2;
export const RANGE_CZ = 50;
const RANGE_HW = 10;
const RANGE_HD = 9;
const NUM_LANES = 5;
const TARGET_ROW_Z = RANGE_CZ + RANGE_HD - 2;

const LANE_COLORS = ['#FF1744', '#FF6D00', '#FFD600', '#00E676', '#2979FF'];

interface TargetState {
  laneX: number;
  active: boolean;
  hit: boolean;
  timer: number;
  cooldown: number;
  y: number;
}

function initTargets(): TargetState[] {
  return Array.from({ length: NUM_LANES }, (_, i) => ({
    laneX: RANGE_CX - RANGE_HW + (i + 0.5) * ((RANGE_HW * 2) / NUM_LANES),
    active: false,
    hit: false,
    timer: 0,
    cooldown: i * 0.9 + 0.5,
    y: -1.5,
  }));
}

export function ShootingRange() {
  const { shootingPhase, addShootingHit, tickShooting } = useGameStore();

  // Target logic state (not React state — updated via refs in useFrame)
  const targets = useRef<TargetState[]>(initTargets());

  // Refs for each target group (position.y updated per-frame)
  const targetGroupRefs = [
    useRef<THREE.Group>(null!), useRef<THREE.Group>(null!), useRef<THREE.Group>(null!),
    useRef<THREE.Group>(null!), useRef<THREE.Group>(null!),
  ];
  // Refs for each target material (color updated on hit)
  const targetMatRefs = [
    useRef<THREE.MeshStandardMaterial>(null!), useRef<THREE.MeshStandardMaterial>(null!),
    useRef<THREE.MeshStandardMaterial>(null!), useRef<THREE.MeshStandardMaterial>(null!),
    useRef<THREE.MeshStandardMaterial>(null!),
  ];
  const targetRingRefs = [
    useRef<THREE.Mesh>(null!), useRef<THREE.Mesh>(null!), useRef<THREE.Mesh>(null!),
    useRef<THREE.Mesh>(null!), useRef<THREE.Mesh>(null!),
  ];

  const shotFired = useRef(false);
  const keyDown = useRef(false);

  // Key listener for F key shot
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if ((e.key === 'f' || e.key === 'F') && !keyDown.current) {
        keyDown.current = true;
        shotFired.current = true;
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') keyDown.current = false;
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, []);

  useFrame((_, dt) => {
    const phase = useGameStore.getState().shootingPhase;

    if (phase !== 'playing') {
      if (phase === 'none' || phase === 'finished') {
        // Reset all targets below ground
        targets.current = initTargets();
        targets.current.forEach((_, i) => {
          if (targetGroupRefs[i].current) targetGroupRefs[i].current.position.y = -1.5;
          if (targetMatRefs[i].current) {
            targetMatRefs[i].current.color.set(LANE_COLORS[i]);
            targetMatRefs[i].current.emissiveIntensity = 0.45;
          }
          if (targetRingRefs[i].current) targetRingRefs[i].current.visible = true;
        });
      }
      return;
    }

    tickShooting(dt);
    const ts = targets.current;

    // Update each target lifecycle
    ts.forEach((t, i) => {
      if (t.hit) {
        // Hit target: animate drop
        t.y = Math.max(-1.5, t.y - dt * 4);
        if (targetGroupRefs[i].current) targetGroupRefs[i].current.position.y = t.y;
        if (t.y <= -1.4 && t.cooldown <= 0) {
          // Respawn
          t.hit = false;
          t.y = -1.5;
          t.cooldown = 1.5 + Math.random() * 2;
          if (targetMatRefs[i].current) {
            targetMatRefs[i].current.color.set(LANE_COLORS[i]);
            targetMatRefs[i].current.emissiveIntensity = 0.45;
          }
          if (targetRingRefs[i].current) targetRingRefs[i].current.visible = true;
        }
        if (t.cooldown > 0) t.cooldown -= dt;
        return;
      }

      if (!t.active) {
        t.cooldown -= dt;
        if (t.cooldown <= 0) {
          t.active = true;
          t.timer = 2.2 + Math.random() * 1.8;
        }
        return;
      }

      // Pop up
      if (t.y < 2.8) {
        t.y = Math.min(2.8, t.y + dt * 6);
        if (targetGroupRefs[i].current) targetGroupRefs[i].current.position.y = t.y;
      }

      // Timer countdown
      t.timer -= dt;
      if (t.timer <= 0) {
        // Miss — go back down
        t.active = false;
        t.cooldown = 1.0 + Math.random() * 1.5;
        t.y = -1.5;
        if (targetGroupRefs[i].current) targetGroupRefs[i].current.position.y = -1.5;
      }
    });

    // Shoot ray check
    if (shotFired.current) {
      shotFired.current = false;
      const origin = playerState.position.clone();
      origin.y += 0.8; // gun height
      const dir = new THREE.Vector3(Math.sin(playerState.rotation), 0, Math.cos(playerState.rotation)).normalize();
      const ray = new THREE.Ray(origin, dir);

      ts.forEach((t, i) => {
        if (!t.active || t.hit) return;
        const center = new THREE.Vector3(t.laneX, t.y, TARGET_ROW_Z);
        if (ray.distanceToPoint(center) < 1.25) {
          t.hit = true;
          t.active = false;
          t.cooldown = 0;
          addShootingHit();
          if (targetMatRefs[i].current) {
            targetMatRefs[i].current.color.set('#333333');
            targetMatRefs[i].current.emissiveIntensity = 0;
          }
          if (targetRingRefs[i].current) targetRingRefs[i].current.visible = false;
        }
      });
    }
  });

  const wallMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#37474F', roughness: 0.85, metalness: 0.15 }), []);
  const floorMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#546E7A', roughness: 0.90, metalness: 0.05 }), []);
  const roofMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#263238', roughness: 0.80, metalness: 0.2, side: THREE.DoubleSide }), []);
  const poleMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#90A4AE', roughness: 0.7, metalness: 0.5 }), []);
  const deskMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#795548', roughness: 0.88, metalness: 0.05 }), []);
  const signMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#B71C1C', roughness: 0.6, metalness: 0.2, emissive: '#5A0E0E', emissiveIntensity: 0.3 }), []);

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[RANGE_CX, 0.005, RANGE_CZ]} receiveShadow material={floorMat}>
        <planeGeometry args={[RANGE_HW * 2, RANGE_HD * 2]} />
      </mesh>

      {/* Lane stripes */}
      {Array.from({ length: NUM_LANES }).map((_, i) => {
        const lx = RANGE_CX - RANGE_HW + (i + 0.5) * ((RANGE_HW * 2) / NUM_LANES);
        return (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[lx, 0.008, RANGE_CZ]} receiveShadow>
            <planeGeometry args={[(RANGE_HW * 2) / NUM_LANES - 0.35, RANGE_HD * 2]} />
            <meshStandardMaterial color={LANE_COLORS[i]} roughness={0.92} metalness={0} transparent opacity={0.12} />
          </mesh>
        );
      })}

      {/* Lane dividers */}
      {Array.from({ length: NUM_LANES - 1 }).map((_, i) => {
        const lx = RANGE_CX - RANGE_HW + (i + 1) * ((RANGE_HW * 2) / NUM_LANES);
        return (
          <mesh key={i} position={[lx, 1.2, RANGE_CZ]} castShadow material={wallMat}>
            <boxGeometry args={[0.18, 2.4, RANGE_HD * 2]} />
          </mesh>
        );
      })}

      {/* Side walls */}
      <mesh position={[RANGE_CX - RANGE_HW, 3, RANGE_CZ]} castShadow material={wallMat}>
        <boxGeometry args={[0.4, 6, RANGE_HD * 2]} />
      </mesh>
      <mesh position={[RANGE_CX + RANGE_HW, 3, RANGE_CZ]} castShadow material={wallMat}>
        <boxGeometry args={[0.4, 6, RANGE_HD * 2]} />
      </mesh>

      {/* Back wall */}
      <mesh position={[RANGE_CX, 3, RANGE_CZ + RANGE_HD]} castShadow material={wallMat}>
        <boxGeometry args={[RANGE_HW * 2, 6, 0.5]} />
      </mesh>

      {/* Canopy / roof */}
      <mesh position={[RANGE_CX, 5.8, RANGE_CZ + RANGE_HD * 0.4]} castShadow receiveShadow material={roofMat}>
        <boxGeometry args={[RANGE_HW * 2, 0.22, RANGE_HD * 1.2]} />
      </mesh>

      {/* Shooter desk */}
      <mesh position={[RANGE_CX, 0.22, RANGE_CZ - RANGE_HD + 1.5]} castShadow material={deskMat}>
        <boxGeometry args={[RANGE_HW * 2 - 0.6, 0.42, 1.3]} />
      </mesh>

      {/* Overhead lights */}
      {Array.from({ length: NUM_LANES }).map((_, i) => {
        const lx = RANGE_CX - RANGE_HW + (i + 0.5) * ((RANGE_HW * 2) / NUM_LANES);
        return (
          <group key={i}>
            <mesh position={[lx, 5.5, RANGE_CZ + 1]}>
              <sphereGeometry args={[0.22, 8, 8]} />
              <meshStandardMaterial color="#FFEE88" emissive="#FFEE00" emissiveIntensity={1.8} roughness={0.3} metalness={0} />
            </mesh>
            <pointLight position={[lx, 5.1, RANGE_CZ]} intensity={0.9} distance={22} color="#FFF8E1" />
          </group>
        );
      })}

      {/* Entrance sign */}
      <group position={[RANGE_CX, 0, RANGE_CZ - RANGE_HD - 1.2]}>
        <mesh position={[-2, 1.1, 0]} castShadow material={poleMat}>
          <cylinderGeometry args={[0.12, 0.14, 2.2, 7]} />
        </mesh>
        <mesh position={[2, 1.1, 0]} castShadow material={poleMat}>
          <cylinderGeometry args={[0.12, 0.14, 2.2, 7]} />
        </mesh>
        <mesh position={[0, 2.5, 0]} castShadow material={signMat}>
          <boxGeometry args={[9.5, 1.8, 0.28]} />
        </mesh>
      </group>

      {/* ── Target poles + animated targets ── */}
      {Array.from({ length: NUM_LANES }).map((_, i) => {
        const lx = RANGE_CX - RANGE_HW + (i + 0.5) * ((RANGE_HW * 2) / NUM_LANES);
        return (
          <group key={i} position={[lx, 0, TARGET_ROW_Z]}>
            {/* Fixed pole */}
            <mesh castShadow material={poleMat} position={[0, 1.4, 0]}>
              <cylinderGeometry args={[0.07, 0.09, 2.8, 7]} />
            </mesh>

            {/* Animated target group — position.y updated in useFrame */}
            <group ref={targetGroupRefs[i]} position={[0, -1.5, 0]}>
              {/* Target disc */}
              <mesh castShadow position={[0, 0, 0]}>
                <cylinderGeometry args={[0.88, 0.88, 0.24, 16]} />
                <meshStandardMaterial
                  ref={targetMatRefs[i]}
                  color={LANE_COLORS[i]}
                  roughness={0.5}
                  metalness={0.25}
                  emissive={LANE_COLORS[i]}
                  emissiveIntensity={0.45}
                />
              </mesh>
              {/* Aim ring */}
              <mesh ref={targetRingRefs[i]} position={[0, 0.15, 0]}>
                <torusGeometry args={[0.5, 0.07, 6, 16]} />
                <meshStandardMaterial color="white" roughness={0.6} metalness={0} />
              </mesh>
            </group>
          </group>
        );
      })}
    </group>
  );
}
