/**
 * SkyBox — atmospheric sky inspired by 3DNature's sky/atmosphere rendering
 * Uses @react-three/drei Sky for proper Rayleigh/Mie scattering simulation
 */
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';

// ── Cloud component with realistic shapes ─────────────────────────────────────
function Cloud({ position, scale }: { position: [number, number, number]; scale: number }) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((_, dt) => {
    if (groupRef.current) {
      groupRef.current.position.x += dt * 0.8;
      if (groupRef.current.position.x > 70) groupRef.current.position.x = -70;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Main puff */}
      <mesh>
        <sphereGeometry args={[2.8, 10, 8]} />
        <meshBasicMaterial color="white" transparent opacity={0.88} />
      </mesh>
      {/* Side puffs */}
      {[[-2.5, -0.5, 0], [2.5, -0.6, 0], [-1.2, -1.1, 0.8], [1.4, -1.0, -0.7]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[1.6 + i * 0.18, 8, 6]} />
          <meshBasicMaterial color="white" transparent opacity={0.82} />
        </mesh>
      ))}
      {/* Flat base shadow */}
      <mesh position={[0, -1.6, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.6, 1]}>
        <circleGeometry args={[3.2, 12]} />
        <meshBasicMaterial color="#BFCFDF" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

// ── Stars using instanced mesh ────────────────────────────────────────────────
function Stars() {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const STAR_COUNT = 200;

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const positions = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      const phi   = Math.acos(-1 + (2 * i) / STAR_COUNT);
      const theta = Math.sqrt(STAR_COUNT * Math.PI) * phi;
      arr.push([
        55 * Math.sin(phi) * Math.cos(theta),
        Math.abs(55 * Math.cos(phi)) + 5,
        55 * Math.sin(phi) * Math.sin(theta),
      ]);
    }
    return arr;
  }, []);

  useFrame(() => {
    if (!meshRef.current) return;
    positions.forEach(([x, y, z], i) => {
      dummy.position.set(x, y, z);
      const s = 0.08 + Math.sin(Date.now() * 0.003 + i * 0.7) * 0.04;
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, STAR_COUNT]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color="white" />
    </instancedMesh>
  );
}

// ── Aurora borealis (night only) ──────────────────────────────────────────────
function Aurora() {
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame(() => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.12 + Math.sin(Date.now() * 0.0008) * 0.06;
    }
  });
  return (
    <mesh ref={meshRef} position={[0, 28, -40]} rotation={[0.2, 0, 0]}>
      <planeGeometry args={[120, 18, 12, 4]} />
      <meshBasicMaterial color="#00FF88" transparent opacity={0.15} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ── Main SkyBox ───────────────────────────────────────────────────────────────
export function SkyBox() {
  const { timeOfDay } = useGameStore();

  // Sun elevation: rises from 0° (dawn 6am) to 90° (noon) to 0° (dusk 6pm)
  const elevation = useMemo(() => {
    const t = timeOfDay;
    if (t < 6)  return -15;
    if (t < 12) return (t - 6) / 6 * 85;
    if (t < 18) return 85 - (t - 12) / 6 * 85;
    return -15;
  }, [timeOfDay]);

  const azimuth = 0.18;
  const isDaytime = timeOfDay > 5.5 && timeOfDay < 20.5;
  const isDark = timeOfDay < 6 || timeOfDay > 20;

  // Rayleigh (blue sky intensity) — lower at sunrise/sunset
  const rayleigh = useMemo(() => {
    if (timeOfDay < 6 || timeOfDay > 20) return 0.1;
    if (timeOfDay < 8 || timeOfDay > 18) return 1.2;
    return 2.8;
  }, [timeOfDay]);

  // Turbidity (haze) — more at sunrise/sunset for orange glow
  const turbidity = useMemo(() => {
    if (timeOfDay < 6 || timeOfDay > 20) return 0.1;
    if (timeOfDay < 8 || timeOfDay > 18) return 18;
    return 8;
  }, [timeOfDay]);

  const sunPosition = useMemo((): [number, number, number] => {
    const elRad = (elevation * Math.PI) / 180;
    const azRad = azimuth * Math.PI * 2;
    return [
      Math.cos(elRad) * Math.sin(azRad) * 100,
      Math.sin(elRad) * 100,
      Math.cos(elRad) * Math.cos(azRad) * 100,
    ];
  }, [elevation]);

  const cloudPositions = useMemo((): Array<{ pos: [number, number, number]; scale: number }> => [
    { pos: [-30, 14, -20], scale: 1.0 },
    { pos: [20, 16, -35],  scale: 1.3 },
    { pos: [-10, 12, 30],  scale: 0.8 },
    { pos: [40, 18, 10],   scale: 1.1 },
    { pos: [-50, 15, 5],   scale: 0.9 },
    { pos: [10, 13, -50],  scale: 1.4 },
  ], []);

  return (
    <>
      {/* Atmospheric sky using Rayleigh/Mie scattering (drei Sky) */}
      {isDaytime && (
        <Sky
          sunPosition={sunPosition}
          turbidity={turbidity}
          rayleigh={rayleigh}
          mieCoefficient={0.005}
          mieDirectionalG={0.85}
          inclination={0}
          azimuth={azimuth}
        />
      )}

      {/* Night sky — dark sphere when no sky shader */}
      {isDark && (
        <mesh>
          <sphereGeometry args={[65, 16, 16]} />
          <meshBasicMaterial color="#03060F" side={THREE.BackSide} />
        </mesh>
      )}

      {/* Stars at night */}
      {isDark && <Stars />}

      {/* Moon */}
      {isDark && (
        <group position={[
          -Math.cos(((timeOfDay - 6) / 12) * Math.PI) * 38,
          Math.abs(Math.sin(((timeOfDay - 6) / 12) * Math.PI)) * 38 + 5,
          -10,
        ]}>
          <mesh>
            <sphereGeometry args={[2.2, 14, 14]} />
            <meshBasicMaterial color="#E8E8D0" />
          </mesh>
          {/* Moon glow halo */}
          <mesh>
            <sphereGeometry args={[3.2, 12, 12]} />
            <meshBasicMaterial color="#AAAACC" transparent opacity={0.1} side={THREE.BackSide} />
          </mesh>
        </group>
      )}

      {/* Aurora at night (rare atmospheric wonder) */}
      {isDark && <Aurora />}

      {/* Clouds (daytime) */}
      {isDaytime && cloudPositions.map(({ pos, scale }, i) => (
        <Cloud key={i} position={pos} scale={scale} />
      ))}

      {/* Horizon haze band (3DNature atmospheric haze) */}
      {isDaytime && (
        <mesh position={[0, 2, 0]}>
          <cylinderGeometry args={[58, 58, 6, 32, 1, true]} />
          <meshBasicMaterial
            color={timeOfDay < 8 || timeOfDay > 18 ? '#FF9966' : '#CCDDEE'}
            transparent
            opacity={timeOfDay < 8 || timeOfDay > 18 ? 0.25 : 0.08}
            side={THREE.BackSide}
          />
        </mesh>
      )}
    </>
  );
}
