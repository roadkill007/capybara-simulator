import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { RealisticPond } from './RealisticWater';
import { InstancedGrass } from './InstancedGrass';

function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.2, 1.6, 8]} />
        <meshLambertMaterial color="#6B4226" />
      </mesh>
      <mesh position={[0, 2.1, 0]} castShadow>
        <coneGeometry args={[1.0, 1.8, 8]} />
        <meshLambertMaterial color="#1E5E1E" />
      </mesh>
      <mesh position={[0, 3.1, 0]} castShadow>
        <coneGeometry args={[0.72, 1.4, 8]} />
        <meshLambertMaterial color="#2A7A2A" />
      </mesh>
      <mesh position={[0, 3.9, 0]} castShadow>
        <coneGeometry args={[0.45, 1.0, 8]} />
        <meshLambertMaterial color="#3A8C3A" />
      </mesh>
    </group>
  );
}

function PalmTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.5, 0]} rotation={[0.1, 0, 0.15]} castShadow>
        <cylinderGeometry args={[0.12, 0.18, 3, 8]} />
        <meshLambertMaterial color="#8B7355" />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map(i => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 1.2, 3.2, Math.sin(angle) * 1.2]}
            rotation={[0.5, angle, 0]}
            castShadow
          >
            <boxGeometry args={[0.1, 0.04, 1.6]} />
            <meshLambertMaterial color="#3A8C2A" />
          </mesh>
        );
      })}
    </group>
  );
}

function Bush({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshLambertMaterial color="#2E7D32" />
      </mesh>
      <mesh position={[0.35, 0.08, 0.1]} castShadow>
        <sphereGeometry args={[0.35, 8, 8]} />
        <meshLambertMaterial color="#388E3C" />
      </mesh>
      <mesh position={[-0.25, 0.05, 0.2]} castShadow>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshLambertMaterial color="#1B5E20" />
      </mesh>
    </group>
  );
}

function Rock({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const seed = Math.abs(position[0] * 7 + position[2] * 13);
  return (
    <mesh position={position} scale={scale} rotation={[seed * 0.5, seed * 0.8, seed * 0.3]} castShadow>
      <dodecahedronGeometry args={[0.4, 0]} />
      <meshLambertMaterial color={seed % 3 === 0 ? '#9E9E9E' : seed % 3 === 1 ? '#795548' : '#607D8B'} />
    </mesh>
  );
}

function Flower({ position }: { position: [number, number, number] }) {
  const colors = ['#FF6B6B', '#FFD93D', '#FF8C94', '#C3F0CA', '#FF69B4', '#87CEEB', '#FFA500'];
  const idx = Math.floor(Math.abs(position[0] * 13 + position[2] * 7)) % colors.length;
  return (
    <group position={position}>
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.35, 6]} />
        <meshLambertMaterial color="#4A7C4A" />
      </mesh>
      <mesh position={[0, 0.38, 0]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshLambertMaterial color={colors[idx]} />
      </mesh>
    </group>
  );
}

function GrassPatch({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2 + i * 0.3;
        const r = 0.1 + Math.random() * 0.4;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * r, 0.2, Math.sin(angle) * r]}
            rotation={[0, angle, (Math.random() - 0.5) * 0.3]}
          >
            <boxGeometry args={[0.04, 0.45 + Math.random() * 0.2, 0.04]} />
            <meshLambertMaterial color={['#4CAF50', '#388E3C', '#66BB6A', '#2E7D32'][i % 4]} />
          </mesh>
        );
      })}
    </group>
  );
}

function Pond({ position, radius, isDark }: { position: [number, number, number]; radius: number; isDark: boolean }) {
  const waterRef = useRef<THREE.Mesh>(null!);
  useFrame(() => {
    if (waterRef.current) {
      const mat = waterRef.current.material as THREE.MeshPhongMaterial;
      mat.opacity = 0.72 + Math.sin(Date.now() * 0.001) * 0.04;
    }
  });
  return (
    <group position={position}>
      {/* Mud ring around pond edge */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]}>
        <ringGeometry args={[radius - 0.5, radius + 1.5, 32]} />
        <meshLambertMaterial color="#6B5A2A" />
      </mesh>
      {/* Solid blue pool floor so it looks blue through the water */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.58, 0]}>
        <circleGeometry args={[radius, 32]} />
        <meshLambertMaterial color={isDark ? '#0D2B6B' : '#1565C0'} />
      </mesh>
      {/* Sandy-blue sides of the pond */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}>
        <circleGeometry args={[radius, 32]} />
        <meshLambertMaterial color={isDark ? '#0D3A8C' : '#1976D2'} />
      </mesh>
      {/* Water surface — BLUE transparent with shimmer */}
      <mesh ref={waterRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <circleGeometry args={[radius, 32]} />
        <meshPhongMaterial
          color={isDark ? '#1565C0' : '#29B6F6'}
          transparent
          opacity={0.82}
          shininess={180}
        />
      </mesh>
      {/* Lily pads */}
      {Array.from({ length: Math.floor(radius) }).map((_, i) => {
        const a = (i / Math.floor(radius)) * Math.PI * 2;
        return (
          <mesh key={i} rotation={[-Math.PI / 2, 0, a]} position={[Math.cos(a) * (radius - 1.5), 0.02, Math.sin(a) * (radius - 1.5)]}>
            <circleGeometry args={[0.5, 8]} />
            <meshLambertMaterial color="#1B5E20" />
          </mesh>
        );
      })}
    </group>
  );
}

function FoodDisplay({ food }: { food: { id: string; type: string; position: [number, number, number]; collected: boolean } }) {
  const meshRef = useRef<THREE.Group>(null!);
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.02;
      meshRef.current.position.y = food.position[1] + Math.sin(Date.now() * 0.002) * 0.1 + 0.35;
    }
  });
  if (food.collected) return null;
  return (
    <group ref={meshRef} position={food.position}>
      {food.type === 'watermelon' && (
        <>
          <mesh castShadow>
            <sphereGeometry args={[0.32, 12, 8]} />
            <meshLambertMaterial color="#2E8B2E" />
          </mesh>
          <mesh scale={[0.85, 0.85, 0.85]}>
            <sphereGeometry args={[0.32, 12, 8]} />
            <meshLambertMaterial color="#FF3333" />
          </mesh>
          <mesh scale={[0.4, 0.4, 0.5]} position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.15, 6]} />
            <meshLambertMaterial color="#1B5E20" />
          </mesh>
        </>
      )}
      {food.type === 'grass' && (
        <group>
          {[-0.12, 0, 0.12].map((x, i) => (
            <mesh key={i} position={[x, 0.18, i * 0.05]} rotation={[0, 0, x * 0.5]}>
              <boxGeometry args={[0.06, 0.45, 0.06]} />
              <meshLambertMaterial color="#56BC56" />
            </mesh>
          ))}
        </group>
      )}
      {food.type === 'sugarcane' && (
        <group>
          {[-0.09, 0, 0.09].map((x, i) => (
            <group key={i} position={[x, 0, 0]}>
              <mesh position={[0, 0.4, 0]}>
                <cylinderGeometry args={[0.045, 0.055, 0.8, 8]} />
                <meshLambertMaterial color="#8BC34A" />
              </mesh>
              {[0.1, 0.3, 0.52].map((y, j) => (
                <mesh key={j} position={[0.07, y, 0]} rotation={[0, 0, 0.5]}>
                  <boxGeometry args={[0.14, 0.03, 0.04]} />
                  <meshLambertMaterial color="#AED581" />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      )}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.32, 0]}>
        <ringGeometry args={[0.38, 0.55, 16]} />
        <meshBasicMaterial color="#FFD700" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

// ── Biome-specific objects ──────────────────────────────────────────────────

function Cactus({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 1.8, 8]} />
        <meshLambertMaterial color="#4CAF50" />
      </mesh>
      <mesh castShadow position={[-0.4, 1.1, 0]} rotation={[0, 0, 0.6]}>
        <cylinderGeometry args={[0.1, 0.13, 0.7, 6]} />
        <meshLambertMaterial color="#4CAF50" />
      </mesh>
      <mesh castShadow position={[0.42, 0.95, 0]} rotation={[0, 0, -0.7]}>
        <cylinderGeometry args={[0.1, 0.13, 0.65, 6]} />
        <meshLambertMaterial color="#4CAF50" />
      </mesh>
      {[0, 0.4, 0.8, 1.3, 1.7].map((y, i) => (
        <mesh key={i} position={[0, y + 0.1, 0.2]}>
          <coneGeometry args={[0.04, 0.18, 4]} />
          <meshLambertMaterial color="#8BC34A" />
        </mesh>
      ))}
    </group>
  );
}

function AcaciaTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 1.5, 0]} rotation={[0, 0, 0.08]}>
        <cylinderGeometry args={[0.11, 0.18, 3.0, 6]} />
        <meshLambertMaterial color="#8D6E63" />
      </mesh>
      <mesh castShadow position={[0, 3.1, 0]}>
        <cylinderGeometry args={[2.2, 2.4, 0.35, 12]} />
        <meshLambertMaterial color="#558B2F" />
      </mesh>
      <mesh castShadow position={[0, 3.35, 0]}>
        <cylinderGeometry args={[1.4, 2.0, 0.25, 12]} />
        <meshLambertMaterial color="#689F38" />
      </mesh>
    </group>
  );
}

function JungleTree({ position, height = 1 }: { position: [number, number, number]; height?: number }) {
  const h = 3.5 + height * 1.5;
  return (
    <group position={position}>
      <mesh castShadow position={[0, h * 0.45, 0]}>
        <cylinderGeometry args={[0.18, 0.28, h * 0.9, 7]} />
        <meshLambertMaterial color="#4E342E" />
      </mesh>
      <mesh castShadow position={[0, h * 0.9, 0]}>
        <coneGeometry args={[1.8, h * 0.6, 8]} />
        <meshLambertMaterial color="#1B5E20" />
      </mesh>
      <mesh castShadow position={[0, h * 0.75, 0]}>
        <coneGeometry args={[2.2, h * 0.45, 8]} />
        <meshLambertMaterial color="#2E7D32" />
      </mesh>
      {[0, 1, 2, 3].map(i => {
        const a = (i / 4) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.5, h * 0.55, Math.sin(a) * 1.5]} rotation={[0.5, a, 0]}>
            <boxGeometry args={[0.08, 0.04, 1.4]} />
            <meshLambertMaterial color="#388E3C" />
          </mesh>
        );
      })}
    </group>
  );
}

function Boulder({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 0.3, 0]}>
        <dodecahedronGeometry args={[0.7, 0]} />
        <meshLambertMaterial color="#78909C" />
      </mesh>
      <mesh castShadow position={[0.4, 0.15, 0.3]} rotation={[0.3, 0.8, 0]}>
        <dodecahedronGeometry args={[0.42, 0]} />
        <meshLambertMaterial color="#90A4AE" />
      </mesh>
      <mesh castShadow position={[-0.3, 0.12, -0.2]} rotation={[0.5, 1.2, 0]}>
        <dodecahedronGeometry args={[0.32, 0]} />
        <meshLambertMaterial color="#B0BEC5" />
      </mesh>
    </group>
  );
}

function PotionDisplay({ potion }: { potion: { id: string; position: [number, number, number]; collected: boolean } }) {
  const meshRef = useRef<THREE.Group>(null!);
  const glowRef = useRef<THREE.PointLight>(null!);
  useFrame(() => {
    const t = Date.now() * 0.002;
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.025;
      meshRef.current.position.y = potion.position[1] + Math.sin(t) * 0.18 + 0.6;
    }
    if (glowRef.current) {
      glowRef.current.intensity = 0.6 + Math.sin(t * 2.5) * 0.3;
    }
  });
  if (potion.collected) return null;
  return (
    <group ref={meshRef} position={potion.position}>
      {/* Bottle */}
      <mesh castShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.18, 0.52, 10]} />
        <meshPhongMaterial color="#9C27B0" transparent opacity={0.85} shininess={180} />
      </mesh>
      {/* Neck */}
      <mesh castShadow position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.07, 0.11, 0.2, 8]} />
        <meshPhongMaterial color="#7B1FA2" transparent opacity={0.9} />
      </mesh>
      {/* Cork */}
      <mesh castShadow position={[0, 0.46, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshLambertMaterial color="#FFD700" />
      </mesh>
      {/* Inner liquid glow */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.09, 0.14, 0.45, 10]} />
        <meshBasicMaterial color="#E040FB" transparent opacity={0.4} />
      </mesh>
      {/* Point light for glow */}
      <pointLight ref={glowRef} color="#E040FB" intensity={0.8} distance={4} />
      {/* Ground halo */}
      <mesh position={[0, -0.55, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.7, 16]} />
        <meshBasicMaterial color="#9C27B0" transparent opacity={0.22} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function World() {
  const { timeOfDay, foodItems, potionItems } = useGameStore();
  const isDark = timeOfDay < 6 || timeOfDay > 20;

  const trees = useMemo(() => {
    const positions: [number, number, number][] = [];
    // Dense forest sections
    for (let i = 0; i < 80; i++) {
      const angle = (i / 80) * Math.PI * 2 * 3.7;
      const r = 15 + Math.sin(i * 2.1) * 25 + Math.random() * 10;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      // Avoid pond areas
      const nearPond1 = Math.sqrt((x - 12) ** 2 + (z + 10) ** 2) < 12;
      const nearPond2 = Math.sqrt((x + 20) ** 2 + (z - 15) ** 2) < 10;
      if (!nearPond1 && !nearPond2) positions.push([x, 0, z]);
    }
    return positions;
  }, []);

  const palms = useMemo(() => {
    const p: [number, number, number][] = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const r = 4 + Math.sin(i * 3) * 3;
      p.push([12 + Math.cos(a) * r, 0, -10 + Math.sin(a) * r]);
    }
    return p;
  }, []);

  const bushes = useMemo(() => {
    const b: [number, number, number][] = [];
    for (let i = 0; i < 40; i++) {
      b.push([(Math.random() - 0.5) * 100, 0, (Math.random() - 0.5) * 100]);
    }
    return b;
  }, []);

  const rocks = useMemo(() => {
    const r: [number, number, number][] = [];
    for (let i = 0; i < 30; i++) {
      r.push([(Math.random() - 0.5) * 100, 0.1, (Math.random() - 0.5) * 100]);
    }
    return r;
  }, []);

  const flowers = useMemo(() => {
    const f: [number, number, number][] = [];
    for (let i = 0; i < 120; i++) {
      f.push([(Math.random() - 0.5) * 110, 0.05, (Math.random() - 0.5) * 110]);
    }
    return f;
  }, []);

  const grassPatches = useMemo(() => {
    const g: [number, number, number][] = [];
    for (let i = 0; i < 60; i++) {
      g.push([(Math.random() - 0.5) * 100, 0, (Math.random() - 0.5) * 100]);
    }
    return g;
  }, []);

  // ── Biome-specific vegetation ──────────────────────────────────────────────
  const cacti = useMemo(() => {
    // SE desert zone: x>18, z>18
    const positions: [number, number, number][] = [];
    for (let i = 0; i < 22; i++) {
      const x = 20 + Math.random() * 36;
      const z = 20 + Math.random() * 36;
      positions.push([x, 0, z]);
    }
    return positions;
  }, []);

  const acacias = useMemo(() => {
    // SW savanna: x<-18, z>18
    const positions: [number, number, number][] = [];
    for (let i = 0; i < 18; i++) {
      const x = -20 - Math.random() * 34;
      const z = 20 + Math.random() * 34;
      positions.push([x, 0, z]);
    }
    return positions;
  }, []);

  const jungleTrees = useMemo(() => {
    // NW jungle: x<-18, z<-18
    const positions: { pos: [number, number, number]; h: number }[] = [];
    for (let i = 0; i < 26; i++) {
      const x = -20 - Math.random() * 34;
      const z = -20 - Math.random() * 34;
      positions.push({ pos: [x, 0, z], h: Math.random() });
    }
    return positions;
  }, []);

  const mountainBoulders = useMemo(() => {
    // NE mountain: x>18, z<-18
    const positions: { pos: [number, number, number]; s: number }[] = [];
    for (let i = 0; i < 30; i++) {
      const x = 20 + Math.random() * 34;
      const z = -20 - Math.random() * 34;
      positions.push({ pos: [x, Math.random() * 1.5, z], s: 0.6 + Math.random() * 1.4 });
    }
    return positions;
  }, []);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={isDark ? 0.12 : 0.45} color={isDark ? '#2233AA' : '#fffcf0'} />
      <directionalLight
        position={[Math.cos(((timeOfDay - 6) / 12) * Math.PI) * 30, Math.sin(((timeOfDay - 6) / 12) * Math.PI) * 30, 10]}
        intensity={isDark ? 0.08 : 1.4}
        color={timeOfDay < 8 || timeOfDay > 18 ? '#ff9966' : '#fffaf0'}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={200}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
      />
      {isDark && <pointLight position={[0, 8, 0]} intensity={0.4} color="#4466FF" distance={40} />}
      {/* Atmospheric distance fog — 3DNature haze system */}
      <fog attach="fog" args={[isDark ? '#060E22' : (timeOfDay < 8 || timeOfDay > 18 ? '#FF9966' : '#B8D4E8'), 55, 145]} />

      {/* Ground — large */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[140, 140, 60, 60]} />
        <meshLambertMaterial color={isDark ? '#1B3A1B' : '#4A7A30'} />
      </mesh>

      {/* Ground texture patches */}
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh
          key={i}
          receiveShadow
          rotation={[-Math.PI / 2, 0, i * 0.7]}
          position={[(i * 17 - 160) % 80, 0.005, (i * 23 - 100) % 80]}
        >
          <planeGeometry args={[8 + (i % 3) * 4, 6 + (i % 5) * 3]} />
          <meshLambertMaterial color={isDark ? '#264226' : '#5A8A3C'} />
        </mesh>
      ))}

      {/* ── Biome ground overlays ─────────────────────────────────────────── */}
      {/* NE Mountain — grey rocky */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[37, 0.01, -37]}>
        <planeGeometry args={[42, 42, 12, 12]} />
        <meshLambertMaterial color={isDark ? '#455A64' : '#607D8B'} />
      </mesh>
      {/* Rock outcrops in mountain zone */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0.3]} position={[32, 0.02, -30]}>
        <planeGeometry args={[14, 10]} />
        <meshLambertMaterial color={isDark ? '#546E7A' : '#78909C'} />
      </mesh>
      {/* NW Jungle — dark mossy green */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[-37, 0.01, -37]}>
        <planeGeometry args={[42, 42, 12, 12]} />
        <meshLambertMaterial color={isDark ? '#1A2E1A' : '#2E5E2E'} />
      </mesh>
      {/* SW Savanna — dry yellow grass */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[-37, 0.01, 37]}>
        <planeGeometry args={[42, 42, 12, 12]} />
        <meshLambertMaterial color={isDark ? '#6D5B2A' : '#C9A84C'} />
      </mesh>
      {/* Dry cracked ground detail */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0.7]} position={[-42, 0.02, 40]}>
        <planeGeometry args={[18, 12]} />
        <meshLambertMaterial color={isDark ? '#5D4B1F' : '#B8922A'} />
      </mesh>
      {/* SE Desert — sandy orange */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[37, 0.01, 37]}>
        <planeGeometry args={[42, 42, 12, 12]} />
        <meshLambertMaterial color={isDark ? '#6D5022' : '#D4A055'} />
      </mesh>
      {/* Sand dunes */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0.4]} position={[43, 0.02, 44]}>
        <planeGeometry args={[16, 10]} />
        <meshLambertMaterial color={isDark ? '#7A5B28' : '#E8B060'} />
      </mesh>

      {/* ── Instanced GPU grass (3DNature ecosystem) ────────────────────────── */}
      <InstancedGrass isDark={isDark} />

      {/* ── Realistic reflective ponds (capybara-swim Water shader) ─────────── */}
      <RealisticPond position={[12, 0, -10]} radius={9} isDark={isDark} />
      <RealisticPond position={[-20, 0, 15]} radius={7} isDark={isDark} />
      <RealisticPond position={[30, 0, 25]} radius={5} isDark={isDark} />

      {/* Trees */}
      {trees.map((pos, i) => (
        <Tree key={i} position={pos} scale={0.7 + Math.sin(i * 1.73) * 0.4} />
      ))}

      {/* Palm trees around ponds */}
      {palms.map((pos, i) => (
        <PalmTree key={i} position={pos} />
      ))}

      {/* Bushes */}
      {bushes.map((pos, i) => (
        <Bush key={i} position={pos} />
      ))}

      {/* Rocks */}
      {rocks.map((pos, i) => (
        <Rock key={i} position={pos} scale={0.6 + Math.abs(Math.sin(i)) * 0.6} />
      ))}

      {/* Flowers */}
      {flowers.map((pos, i) => (
        <Flower key={i} position={pos} />
      ))}

      {/* Grass patches */}
      {grassPatches.map((pos, i) => (
        <GrassPatch key={i} position={pos} />
      ))}

      {/* Food items */}
      {foodItems.map(food => (
        <FoodDisplay key={food.id} food={food} />
      ))}

      {/* ── Potions (giant power-ups) ──────────────────────────────────────── */}
      {potionItems && potionItems.map(potion => (
        <PotionDisplay key={potion.id} potion={potion} />
      ))}

      {/* ── Biome vegetation ───────────────────────────────────────────────── */}
      {/* Desert: cacti */}
      {cacti.map((pos, i) => (
        <Cactus key={`cactus-${i}`} position={pos} />
      ))}

      {/* Savanna: flat acacia trees */}
      {acacias.map((pos, i) => (
        <AcaciaTree key={`acacia-${i}`} position={pos} />
      ))}

      {/* Jungle: tall dense trees + hanging vines */}
      {jungleTrees.map(({ pos, h }, i) => (
        <JungleTree key={`jungle-${i}`} position={pos} height={h} />
      ))}

      {/* Mountain: clusters of boulders */}
      {mountainBoulders.map(({ pos, s }, i) => (
        <Boulder key={`boulder-${i}`} position={pos} scale={s} />
      ))}

      {/* Biome border: mountain cliff wall */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={`cliff-${i}`} castShadow position={[18 + i * 5.5, 1.0 + Math.sin(i * 1.3) * 0.5, -18]}>
          <boxGeometry args={[4.5 + Math.sin(i) * 1.5, 2.0 + Math.sin(i * 0.8) * 1.2, 1.2]} />
          <meshLambertMaterial color="#78909C" />
        </mesh>
      ))}

      {/* Savanna: dry riverbeds */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0.3]} position={[-30, 0.03, 30]}>
        <planeGeometry args={[3, 18]} />
        <meshLambertMaterial color="#A0856E" />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, -0.1]} position={[-42, 0.03, 38]}>
        <planeGeometry args={[2.5, 14]} />
        <meshLambertMaterial color="#9E7B5E" />
      </mesh>

      {/* Desert: dune mounds */}
      {[{x:38,z:38},{x:48,z:32},{x:42,z:50},{x:52,z:46}].map((d,i) => (
        <mesh key={`dune-${i}`} castShadow receiveShadow position={[d.x, 0.5 + i * 0.15, d.z]}>
          <sphereGeometry args={[3 + i * 0.5, 10, 6]} />
          <meshLambertMaterial color="#D4A055" />
        </mesh>
      ))}

      {/* Path from spawn */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 5]}>
        <planeGeometry args={[2, 30]} />
        <meshLambertMaterial color="#A0845C" />
      </mesh>

      {/* Night fireflies */}
      {isDark && Array.from({ length: 20 }).map((_, i) => {
        const a = (i / 20) * Math.PI * 2 * 2.3;
        const r = 10 + Math.sin(i * 1.7) * 8;
        return (
          <mesh key={i} position={[Math.cos(a) * r, 1.2 + Math.sin(i * 1.4) * 0.6, Math.sin(a) * r]}>
            <sphereGeometry args={[0.06, 4, 4]} />
            <meshBasicMaterial color="#EEEE22" />
          </mesh>
        );
      })}
    </>
  );
}
