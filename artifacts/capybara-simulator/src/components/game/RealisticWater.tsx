/**
 * Realistic Water — inspired by larvuz2/capybara-swim water-controls.js
 * Uses three/examples Water shader + MeshReflectorMaterial from drei
 * Exports getWaterHeight(x, z, time) for buoyancy physics
 */
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';

// ── Wave physics (ported from capybara-swim/water-physics.js) ───────────────
const WAVE_HEIGHT    = 0.14;
const WAVE_FREQUENCY = 0.55;
const WAVE_SPEED     = 0.9;
const WAVE_DIR       = new THREE.Vector2(0.7, 0.7).normalize();

export function getWaterHeight(x: number, z: number, time: number): number {
  const wx = WAVE_DIR.x;
  const wz = WAVE_DIR.y;

  // Primary Gerstner wave
  let h = Math.sin(
    (x * wx + z * wz) * WAVE_FREQUENCY + time * WAVE_SPEED
  ) * WAVE_HEIGHT;

  // Secondary (perpendicular, smaller)
  h += Math.sin(
    (x * -wz + z * wx) * WAVE_FREQUENCY * 1.5 + time * WAVE_SPEED * 0.8
  ) * WAVE_HEIGHT * 0.3;

  // Tertiary (diagonal, faster)
  h += Math.sin(
    (x * (wx + wz) + z * (wx - wz)) * WAVE_FREQUENCY * 2.1 + time * WAVE_SPEED * 1.3
  ) * WAVE_HEIGHT * 0.15;

  return h;
}

// ── Animated water surface mesh ──────────────────────────────────────────────
function WaterSurface({
  position,
  radius,
  isDark,
  shape = 'circle',
  sizeX = 1,
  sizeZ = 1,
}: {
  position: [number, number, number];
  radius: number;
  isDark: boolean;
  shape?: 'circle' | 'rect';
  sizeX?: number;
  sizeZ?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const timeRef = useRef(0);

  useFrame((_, dt) => {
    timeRef.current += dt;
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={position}
      receiveShadow
    >
      {shape === 'circle'
        ? <circleGeometry args={[radius, 48]} />
        : <planeGeometry args={[sizeX, sizeZ, 1, 1]} />
      }
      <MeshReflectorMaterial
        blur={[512, 128]}
        resolution={512}
        mixBlur={0.9}
        mixStrength={isDark ? 18 : 38}
        roughness={0.15}
        depthScale={1.1}
        minDepthThreshold={0.2}
        maxDepthThreshold={1.0}
        color={isDark ? '#001530' : '#003355'}
        metalness={0.6}
        mirror={0.5}
      />
    </mesh>
  );
}

// ── Wave ripple ring animation ───────────────────────────────────────────────
function RippleRings({ position, radius }: { position: [number, number, number]; radius: number }) {
  const ring1 = useRef<THREE.Mesh>(null!);
  const ring2 = useRef<THREE.Mesh>(null!);
  const ring3 = useRef<THREE.Mesh>(null!);

  useFrame(() => {
    const t = Date.now() * 0.001;
    if (ring1.current) {
      const s1 = 0.4 + ((t * 0.5) % 1.0) * 0.6;
      ring1.current.scale.setScalar(s1);
      (ring1.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.35 * (1 - s1));
    }
    if (ring2.current) {
      const s2 = 0.4 + ((t * 0.5 + 0.33) % 1.0) * 0.6;
      ring2.current.scale.setScalar(s2);
      (ring2.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.35 * (1 - s2));
    }
    if (ring3.current) {
      const s3 = 0.4 + ((t * 0.5 + 0.66) % 1.0) * 0.6;
      ring3.current.scale.setScalar(s3);
      (ring3.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.35 * (1 - s3));
    }
  });

  const y = position[1] + 0.02;
  return (
    <>
      {[ring1, ring2, ring3].map((ref, i) => (
        <mesh key={i} ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[position[0], y, position[2]]}>
          <ringGeometry args={[radius * 0.35, radius * 0.45, 32]} />
          <meshBasicMaterial color="#88CCFF" transparent opacity={0.2} />
        </mesh>
      ))}
    </>
  );
}

// ── Underwater floor + shore ─────────────────────────────────────────────────
function PondBed({ position, radius, isDark }: {
  position: [number, number, number];
  radius: number;
  isDark: boolean;
}) {
  return (
    <>
      {/* Deep floor */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[position[0], -0.65, position[2]]}>
        <circleGeometry args={[radius * 0.9, 32]} />
        <meshLambertMaterial color={isDark ? '#001428' : '#0A2A4A'} />
      </mesh>
      {/* Mid-depth */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[position[0], -0.35, position[2]]}>
        <circleGeometry args={[radius * 0.85, 32]} />
        <meshLambertMaterial color={isDark ? '#002040' : '#0D3358'} transparent opacity={0.7} />
      </mesh>
      {/* Shore gradient ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[position[0], 0.01, position[2]]}>
        <ringGeometry args={[radius * 0.85, radius * 1.1, 40]} />
        <meshBasicMaterial color={isDark ? '#1A3344' : '#2E6680'} transparent opacity={0.45} />
      </mesh>
      {/* Wet sand shore */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[position[0], -0.02, position[2]]}>
        <ringGeometry args={[radius * 0.95, radius * 1.18, 32]} />
        <meshLambertMaterial color={isDark ? '#3D3020' : '#8B7340'} />
      </mesh>
      {/* Underwater caustic dots */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const r = radius * 0.4 * Math.random() + radius * 0.1;
        return (
          <mesh
            key={i}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[
              position[0] + Math.cos(a) * r,
              -0.3,
              position[2] + Math.sin(a) * r,
            ]}
          >
            <circleGeometry args={[0.15 + Math.random() * 0.2, 8]} />
            <meshBasicMaterial color="#4499BB" transparent opacity={0.22} />
          </mesh>
        );
      })}
    </>
  );
}

// ── Lily pads ────────────────────────────────────────────────────────────────
function LilyPad({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame(() => {
    if (!meshRef.current) return;
    const t = Date.now() * 0.0008;
    meshRef.current.position.y = position[1] + Math.sin(t + position[0]) * 0.025;
  });
  return (
    <group>
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, Math.random() * Math.PI * 2]} position={position}>
        <circleGeometry args={[0.28, 12, 0, Math.PI * 1.85]} />
        <meshLambertMaterial color="#2E7D32" />
      </mesh>
      {/* Flower */}
      <mesh position={[position[0], position[1] + 0.06, position[2]]}>
        <sphereGeometry args={[0.07, 6, 6]} />
        <meshBasicMaterial color="#FFD54F" />
      </mesh>
    </group>
  );
}

// ── Main export: RealisticPond ───────────────────────────────────────────────
export function RealisticPond({
  position,
  radius,
  isDark,
}: {
  position: [number, number, number];
  radius: number;
  isDark: boolean;
}) {
  const lilyPositions = useMemo(() => {
    const p: [number, number, number][] = [];
    for (let i = 0; i < Math.floor(radius * 1.2); i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * radius * 0.7;
      p.push([
        position[0] + Math.cos(a) * r,
        position[1] + 0.03,
        position[2] + Math.sin(a) * r,
      ]);
    }
    return p;
  }, [position, radius]);

  return (
    <>
      <PondBed position={position} radius={radius} isDark={isDark} />
      <WaterSurface
        position={[position[0], position[1] - 0.05, position[2]]}
        radius={radius}
        isDark={isDark}
      />
      <RippleRings position={position} radius={radius} />
      {lilyPositions.map((p, i) => (
        <LilyPad key={i} position={p} />
      ))}
    </>
  );
}
