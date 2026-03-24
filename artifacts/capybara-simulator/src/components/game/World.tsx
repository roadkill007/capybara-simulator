/**
 * World — complete PBR rebuild using Three.js best practices from threejs.org
 * - MeshStandardMaterial (physically-based) everywhere
 * - HemisphereLight for sky/ground gradient ambient
 * - DirectionalLight with PCFSoftShadowMap for soft shadows
 * - FogExp2 for realistic exponential fog falloff
 * - Per-biome PBR material tuning (roughness/metalness/emissive)
 */
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';

// ─── Shared materials (created once, reused) ─────────────────────────────────
const MAT = {
  bark:       new THREE.MeshStandardMaterial({ color: '#6B4226', roughness: 0.95, metalness: 0.02 }),
  barkDark:   new THREE.MeshStandardMaterial({ color: '#4E342E', roughness: 0.98, metalness: 0.01 }),
  foliage:    new THREE.MeshStandardMaterial({ color: '#2E7D32', roughness: 0.85, metalness: 0 }),
  foliageMid: new THREE.MeshStandardMaterial({ color: '#388E3C', roughness: 0.82, metalness: 0 }),
  foliageTop: new THREE.MeshStandardMaterial({ color: '#43A047', roughness: 0.80, metalness: 0 }),
  jungleLeaf: new THREE.MeshStandardMaterial({ color: '#1B5E20', roughness: 0.88, metalness: 0 }),
  savanna:    new THREE.MeshStandardMaterial({ color: '#558B2F', roughness: 0.80, metalness: 0 }),
  savannaTop: new THREE.MeshStandardMaterial({ color: '#689F38', roughness: 0.78, metalness: 0 }),
  savannaBark:new THREE.MeshStandardMaterial({ color: '#8D6E63', roughness: 0.92, metalness: 0.03 }),
  cactus:     new THREE.MeshStandardMaterial({ color: '#388E3C', roughness: 0.75, metalness: 0 }),
  cactusSpine:new THREE.MeshStandardMaterial({ color: '#8BC34A', roughness: 0.70, metalness: 0 }),
  rock1:      new THREE.MeshStandardMaterial({ color: '#78909C', roughness: 0.82, metalness: 0.12 }),
  rock2:      new THREE.MeshStandardMaterial({ color: '#90A4AE', roughness: 0.80, metalness: 0.10 }),
  rock3:      new THREE.MeshStandardMaterial({ color: '#B0BEC5', roughness: 0.78, metalness: 0.08 }),
  bush1:      new THREE.MeshStandardMaterial({ color: '#2E7D32', roughness: 0.88, metalness: 0 }),
  bush2:      new THREE.MeshStandardMaterial({ color: '#388E3C', roughness: 0.86, metalness: 0 }),
  bush3:      new THREE.MeshStandardMaterial({ color: '#1B5E20', roughness: 0.90, metalness: 0 }),
  palmBark:   new THREE.MeshStandardMaterial({ color: '#8B7355', roughness: 0.90, metalness: 0.02 }),
  palmLeaf:   new THREE.MeshStandardMaterial({ color: '#3A8C2A', roughness: 0.80, metalness: 0 }),
  flowerStem: new THREE.MeshStandardMaterial({ color: '#4A7C4A', roughness: 0.85, metalness: 0 }),
  gold:       new THREE.MeshStandardMaterial({ color: '#FFD700', roughness: 0.3, metalness: 0.9, emissive: '#AA7700', emissiveIntensity: 0.15 }),
};

// ─── Tree ────────────────────────────────────────────────────────────────────
function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.9, 0]} castShadow material={MAT.bark}>
        <cylinderGeometry args={[0.13, 0.22, 1.8, 7]} />
      </mesh>
      <mesh position={[0, 2.15, 0]} castShadow material={MAT.foliage}>
        <coneGeometry args={[1.05, 1.9, 8]} />
      </mesh>
      <mesh position={[0, 3.15, 0]} castShadow material={MAT.foliageMid}>
        <coneGeometry args={[0.75, 1.45, 8]} />
      </mesh>
      <mesh position={[0, 3.95, 0]} castShadow material={MAT.foliageTop}>
        <coneGeometry args={[0.48, 1.05, 8]} />
      </mesh>
    </group>
  );
}

// ─── Palm ────────────────────────────────────────────────────────────────────
function PalmTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.5, 0]} rotation={[0.1, 0, 0.15]} castShadow material={MAT.palmBark}>
        <cylinderGeometry args={[0.12, 0.18, 3, 7]} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map(i => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 1.2, 3.2, Math.sin(angle) * 1.2]}
            rotation={[0.5, angle, 0]} castShadow material={MAT.palmLeaf}>
            <boxGeometry args={[0.1, 0.04, 1.6]} />
          </mesh>
        );
      })}
    </group>
  );
}

// ─── Bush ────────────────────────────────────────────────────────────────────
function Bush({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow material={MAT.bush1}><sphereGeometry args={[0.5, 9, 7]} /></mesh>
      <mesh position={[0.35, 0.08, 0.1]} castShadow material={MAT.bush2}><sphereGeometry args={[0.35, 8, 6]} /></mesh>
      <mesh position={[-0.25, 0.05, 0.2]} castShadow material={MAT.bush3}><sphereGeometry args={[0.3, 8, 6]} /></mesh>
    </group>
  );
}

// ─── Rock ────────────────────────────────────────────────────────────────────
function Rock({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const seed = Math.abs(position[0] * 7 + position[2] * 13);
  const mat = seed % 3 === 0 ? MAT.rock1 : seed % 3 === 1 ? MAT.rock2 : MAT.rock3;
  return (
    <mesh position={position} scale={scale} rotation={[seed * 0.5, seed * 0.8, seed * 0.3]} castShadow material={mat}>
      <dodecahedronGeometry args={[0.4, 0]} />
    </mesh>
  );
}

// ─── Flower ──────────────────────────────────────────────────────────────────
const FLOWER_COLORS = ['#FF6B6B', '#FFD93D', '#FF8C94', '#C3F0CA', '#FF69B4', '#87CEEB', '#FFA500'];
function Flower({ position }: { position: [number, number, number] }) {
  const idx = Math.floor(Math.abs(position[0] * 13 + position[2] * 7)) % FLOWER_COLORS.length;
  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: FLOWER_COLORS[idx], roughness: 0.6, metalness: 0,
    emissive: FLOWER_COLORS[idx], emissiveIntensity: 0.06,
  }), [idx]);
  return (
    <group position={position}>
      <mesh position={[0, 0.18, 0]} material={MAT.flowerStem}>
        <cylinderGeometry args={[0.02, 0.02, 0.35, 5]} />
      </mesh>
      <mesh position={[0, 0.38, 0]} castShadow material={mat}>
        <sphereGeometry args={[0.13, 7, 7]} />
      </mesh>
    </group>
  );
}

// ─── Grass blade cluster ──────────────────────────────────────────────────────
function GrassPatch({ position }: { position: [number, number, number] }) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#4CAF50', roughness: 0.9, metalness: 0, side: THREE.DoubleSide }), []);
  return (
    <group position={position}>
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const r = 0.12 + (i % 3) * 0.12;
        return (
          <mesh key={i} position={[Math.cos(angle) * r, 0.2, Math.sin(angle) * r]} rotation={[0, angle, (i % 2 === 0 ? 0.15 : -0.15)]} material={mat}>
            <boxGeometry args={[0.04, 0.44 + (i % 3) * 0.1, 0.04]} />
          </mesh>
        );
      })}
    </group>
  );
}

// ─── Cactus ──────────────────────────────────────────────────────────────────
function Cactus({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.9, 0]} material={MAT.cactus}>
        <cylinderGeometry args={[0.18, 0.22, 1.8, 8]} />
      </mesh>
      <mesh castShadow position={[-0.4, 1.1, 0]} rotation={[0, 0, 0.6]} material={MAT.cactus}>
        <cylinderGeometry args={[0.1, 0.13, 0.7, 6]} />
      </mesh>
      <mesh castShadow position={[0.42, 0.95, 0]} rotation={[0, 0, -0.7]} material={MAT.cactus}>
        <cylinderGeometry args={[0.1, 0.13, 0.65, 6]} />
      </mesh>
      {[0, 0.4, 0.8, 1.3, 1.7].map((y, i) => (
        <mesh key={i} position={[0, y + 0.1, 0.2]} material={MAT.cactusSpine}>
          <coneGeometry args={[0.04, 0.16, 4]} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Acacia (savanna) ─────────────────────────────────────────────────────────
function AcaciaTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 1.5, 0]} rotation={[0, 0, 0.08]} material={MAT.savannaBark}>
        <cylinderGeometry args={[0.11, 0.18, 3.0, 6]} />
      </mesh>
      <mesh castShadow position={[0, 3.1, 0]} material={MAT.savanna}>
        <cylinderGeometry args={[2.2, 2.4, 0.35, 12]} />
      </mesh>
      <mesh castShadow position={[0, 3.35, 0]} material={MAT.savannaTop}>
        <cylinderGeometry args={[1.4, 2.0, 0.25, 12]} />
      </mesh>
    </group>
  );
}

// ─── Jungle tree ─────────────────────────────────────────────────────────────
function JungleTree({ position, height = 1 }: { position: [number, number, number]; height?: number }) {
  const h = 3.5 + height * 1.5;
  return (
    <group position={position}>
      <mesh castShadow position={[0, h * 0.45, 0]} material={MAT.barkDark}>
        <cylinderGeometry args={[0.18, 0.28, h * 0.9, 7]} />
      </mesh>
      <mesh castShadow position={[0, h * 0.9, 0]} material={MAT.jungleLeaf}>
        <coneGeometry args={[1.8, h * 0.6, 8]} />
      </mesh>
      <mesh castShadow position={[0, h * 0.75, 0]} material={MAT.foliageMid}>
        <coneGeometry args={[2.2, h * 0.45, 8]} />
      </mesh>
      {[0, 1, 2, 3].map(i => {
        const a = (i / 4) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.5, h * 0.55, Math.sin(a) * 1.5]} rotation={[0.5, a, 0]} material={MAT.savanna}>
            <boxGeometry args={[0.08, 0.04, 1.4]} />
          </mesh>
        );
      })}
    </group>
  );
}

// ─── Boulder cluster ─────────────────────────────────────────────────────────
function Boulder({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 0.3, 0]} material={MAT.rock1}>
        <dodecahedronGeometry args={[0.7, 0]} />
      </mesh>
      <mesh castShadow position={[0.4, 0.15, 0.3]} rotation={[0.3, 0.8, 0]} material={MAT.rock2}>
        <dodecahedronGeometry args={[0.42, 0]} />
      </mesh>
      <mesh castShadow position={[-0.3, 0.12, -0.2]} rotation={[0.5, 1.2, 0]} material={MAT.rock3}>
        <dodecahedronGeometry args={[0.32, 0]} />
      </mesh>
    </group>
  );
}

// ─── Pond — PBR water ────────────────────────────────────────────────────────
function Pond({ position, radius, isDark }: { position: [number, number, number]; radius: number; isDark: boolean }) {
  const waterRef = useRef<THREE.Mesh>(null!);
  const waterMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: isDark ? '#1040A0' : '#1E88E5',
    roughness: 0.04,
    metalness: 0.18,
    transparent: true,
    opacity: 0.88,
    envMapIntensity: 1.2,
  }), [isDark]);

  const mudMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: isDark ? '#3E2B12' : '#6B5A2A', roughness: 0.95, metalness: 0,
  }), [isDark]);

  const floorMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: isDark ? '#0A1E5C' : '#1448A0', roughness: 0.5, metalness: 0.05,
  }), [isDark]);

  const lillyMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#1B5E20', roughness: 0.9, metalness: 0,
  }), []);

  useFrame(({ clock }) => {
    if (waterRef.current) {
      const mat = waterRef.current.material as THREE.MeshStandardMaterial;
      mat.roughness = 0.04 + Math.sin(clock.elapsedTime * 0.7) * 0.02;
      mat.opacity = 0.85 + Math.sin(clock.elapsedTime * 0.5) * 0.04;
    }
  });

  return (
    <group position={position}>
      {/* Mud shore ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow material={mudMat}>
        <ringGeometry args={[radius - 0.3, radius + 1.8, 36]} />
      </mesh>
      {/* Pond floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.55, 0]} material={floorMat}>
        <circleGeometry args={[radius, 36]} />
      </mesh>
      {/* Water surface */}
      <mesh ref={waterRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} material={waterMat}>
        <circleGeometry args={[radius, 40]} />
      </mesh>
      {/* Lily pads */}
      {Array.from({ length: Math.floor(radius * 1.2) }).map((_, i) => {
        const a = (i / Math.floor(radius * 1.2)) * Math.PI * 2;
        const r = (radius - 1.6) * (0.5 + (i % 3) * 0.25);
        return (
          <mesh key={i} rotation={[-Math.PI / 2, 0, a]} position={[Math.cos(a) * r, 0.01, Math.sin(a) * r]} material={lillyMat}>
            <circleGeometry args={[0.48, 8]} />
          </mesh>
        );
      })}
    </group>
  );
}

// ─── Food display ─────────────────────────────────────────────────────────────
function FoodDisplay({ food }: { food: { id: string; type: string; position: [number, number, number]; collected: boolean } }) {
  const meshRef = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.02;
      meshRef.current.position.y = food.position[1] + Math.sin(clock.elapsedTime * 2) * 0.1 + 0.35;
    }
  });
  if (food.collected) return null;

  const skinMat = new THREE.MeshStandardMaterial({ color: '#2E8B2E', roughness: 0.8, metalness: 0 });
  const fleshMat = new THREE.MeshStandardMaterial({ color: '#FF3333', roughness: 0.75, metalness: 0 });
  const stemMat  = new THREE.MeshStandardMaterial({ color: '#1B5E20', roughness: 0.88, metalness: 0 });
  const grassMat = new THREE.MeshStandardMaterial({ color: '#56BC56', roughness: 0.9, metalness: 0, side: THREE.DoubleSide });
  const caneMat  = new THREE.MeshStandardMaterial({ color: '#8BC34A', roughness: 0.85, metalness: 0 });
  const haloMat  = new THREE.MeshStandardMaterial({ color: '#FFD700', roughness: 0.3, metalness: 0.6, transparent: true, opacity: 0.35, emissive: '#AA8800', emissiveIntensity: 0.3 });

  return (
    <group ref={meshRef} position={food.position}>
      {food.type === 'watermelon' && (
        <>
          <mesh castShadow material={skinMat}><sphereGeometry args={[0.32, 12, 8]} /></mesh>
          <mesh scale={[0.85, 0.85, 0.85]} material={fleshMat}><sphereGeometry args={[0.32, 12, 8]} /></mesh>
          <mesh scale={[0.4, 0.4, 0.5]} position={[0, 0.3, 0]} material={stemMat}>
            <cylinderGeometry args={[0.05, 0.05, 0.15, 6]} />
          </mesh>
        </>
      )}
      {food.type === 'grass' && (
        <group>
          {[-0.12, 0, 0.12].map((x, i) => (
            <mesh key={i} position={[x, 0.18, i * 0.05]} rotation={[0, 0, x * 0.5]} material={grassMat}>
              <boxGeometry args={[0.06, 0.45, 0.06]} />
            </mesh>
          ))}
        </group>
      )}
      {food.type === 'sugarcane' && (
        <group>
          {[-0.09, 0, 0.09].map((x, i) => (
            <group key={i} position={[x, 0, 0]}>
              <mesh position={[0, 0.4, 0]} material={caneMat}>
                <cylinderGeometry args={[0.045, 0.055, 0.8, 7]} />
              </mesh>
            </group>
          ))}
        </group>
      )}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.32, 0]} material={haloMat}>
        <ringGeometry args={[0.38, 0.55, 16]} />
      </mesh>
    </group>
  );
}

// ─── Potion display ───────────────────────────────────────────────────────────
function PotionDisplay({ potion }: { potion: { id: string; position: [number, number, number]; collected: boolean } }) {
  const meshRef = useRef<THREE.Group>(null!);
  const glowRef = useRef<THREE.PointLight>(null!);
  const bottleMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#9C27B0', roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.85,
    emissive: '#5B0080', emissiveIntensity: 0.4,
  }), []);
  const liquidMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#E040FB', roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.5,
    emissive: '#AA00CC', emissiveIntensity: 0.6,
  }), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.025;
      meshRef.current.position.y = potion.position[1] + Math.sin(t * 1.2) * 0.18 + 0.6;
    }
    if (glowRef.current) glowRef.current.intensity = 0.6 + Math.sin(t * 2.5) * 0.3;
  });

  if (potion.collected) return null;
  return (
    <group ref={meshRef} position={potion.position}>
      <mesh castShadow position={[0, 0, 0]} material={bottleMat}>
        <cylinderGeometry args={[0.12, 0.18, 0.52, 10]} />
      </mesh>
      <mesh castShadow position={[0, 0.32, 0]} material={bottleMat}>
        <cylinderGeometry args={[0.07, 0.11, 0.2, 8]} />
      </mesh>
      <mesh castShadow position={[0, 0.46, 0]} material={MAT.gold}>
        <sphereGeometry args={[0.08, 8, 8]} />
      </mesh>
      <mesh position={[0, 0, 0]} material={liquidMat}>
        <cylinderGeometry args={[0.09, 0.14, 0.45, 10]} />
      </mesh>
      <pointLight ref={glowRef} color="#E040FB" intensity={0.8} distance={4} />
      <mesh position={[0, -0.55, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.7, 16]} />
        <meshStandardMaterial color="#9C27B0" transparent opacity={0.2} roughness={0.5} metalness={0.3} emissive="#5B0080" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

// ─── Deterministic world placement ────────────────────────────────────────────
function createRng(seed: number) {
  let s = seed >>> 0;
  return (): number => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const WORLD_EXCLUDES = [
  { cx: 12,  cz: -10, r: 13 },
  { cx: -20, cz: 15,  r: 10 },
  { cx: 30,  cz: 25,  r: 9  },
  { cx: 0,   cz: 0,   r: 9  },
  { cx: 10,  cz: -38, r: 36 },
  { cx: -42, cz: 2,   r: 22 },
  { cx: 2,   cz: 50,  r: 18 },
];

function spreadPlace(
  rng: () => number,
  count: number,
  minDist: number,
  xMin: number, xMax: number,
  zMin: number, zMax: number,
  extra: { cx: number; cz: number; r: number }[] = []
): [number, number, number][] {
  const placed: [number, number, number][] = [];
  const ex = [...WORLD_EXCLUDES, ...extra];
  let tries = 0;
  while (placed.length < count && tries++ < count * 60) {
    const x = xMin + rng() * (xMax - xMin);
    const z = zMin + rng() * (zMax - zMin);
    if (ex.some(e => (x - e.cx) ** 2 + (z - e.cz) ** 2 < e.r ** 2)) continue;
    if (placed.some(([px, , pz]) => (x - px) ** 2 + (z - pz) ** 2 < minDist ** 2)) continue;
    placed.push([x, 0, z]);
  }
  return placed;
}

// ─── Main World component ─────────────────────────────────────────────────────
export function World() {
  const { timeOfDay, foodItems, potionItems } = useGameStore();
  const isDark = timeOfDay < 6 || timeOfDay > 20;
  const isSunrise = timeOfDay >= 5.5 && timeOfDay < 8;
  const isSunset  = timeOfDay >= 17 && timeOfDay <= 20.5;
  const isGolden  = isSunrise || isSunset;

  // Dynamic lighting derived from time of day
  const sunAngle = ((timeOfDay - 6) / 12) * Math.PI;
  const sunX = Math.cos(sunAngle) * 80;
  const sunY = Math.max(2, Math.sin(sunAngle) * 80);
  const sunZ = 20;

  const sunColor   = isDark ? '#2233AA' : isGolden ? '#FF9966' : '#FFF8E1';
  const sunInt     = isDark ? 0.05 : isGolden ? 1.0 : 1.5;
  const skyColor   = isDark ? '#0D1B3E' : isGolden ? '#FF7040' : '#87CEEB';
  const groundAmbient = isDark ? '#0A1205' : isGolden ? '#704030' : '#3A5A20';
  const hemInt     = isDark ? 0.25 : isGolden ? 1.0 : 1.8;
  const fogColor   = isDark ? '#060E22' : isGolden ? '#FF8866' : '#A8CADC';
  const fogDensity = 0.007;

  // Ground material changes with time
  const groundColor = isDark ? '#1B3A1B' : '#4A7A30';

  // Static position arrays — deterministic seeded placement (no random clustering)
  const trees = useMemo(() => {
    const rng = createRng(1001);
    return spreadPlace(rng, 70, 7, -65, 65, -65, 65);
  }, []);

  const palms = useMemo(() => {
    // Palms ring each pond
    const p: [number, number, number][] = [];
    [[12, -10, 9], [-20, 15, 7], [30, 25, 6]].forEach(([cx, cz, r]) => {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        p.push([cx + Math.cos(a) * (r + 2), 0, cz + Math.sin(a) * (r + 2)]);
      }
    });
    return p;
  }, []);

  const bushes = useMemo(() => {
    const rng = createRng(1003);
    return spreadPlace(rng, 45, 4, -60, 60, -60, 60);
  }, []);

  const rocks = useMemo(() => {
    const rng = createRng(1004);
    return spreadPlace(rng, 30, 3.5, -60, 60, -60, 60).map(([x, , z]) => [x, 0.1, z] as [number, number, number]);
  }, []);

  const flowers = useMemo(() => {
    const rng = createRng(1005);
    return spreadPlace(rng, 90, 2, -62, 62, -62, 62);
  }, []);

  const grassPatches = useMemo(() => {
    const rng = createRng(1006);
    return spreadPlace(rng, 50, 3, -60, 60, -60, 60);
  }, []);

  const cacti = useMemo(() => {
    const rng = createRng(1007);
    return spreadPlace(rng, 22, 5, 20, 58, 20, 58);
  }, []);

  const acacias = useMemo(() => {
    const rng = createRng(1008);
    return spreadPlace(rng, 18, 6, -58, -20, 20, 58);
  }, []);

  const jungleTrees = useMemo(() => {
    const rng = createRng(1009);
    const rng2 = createRng(1009 + 99);
    return spreadPlace(rng, 26, 5, -58, -20, -58, -20).map(pos => ({ pos, h: rng2() }));
  }, []);

  const mountainBoulders = useMemo(() => {
    const rng = createRng(1010);
    const rng2 = createRng(1010 + 77);
    const rng3 = createRng(1010 + 55);
    return spreadPlace(rng, 30, 4, 20, 58, -58, -20).map(([x, , z]) => ({
      pos: [x, rng2() * 1.2, z] as [number, number, number],
      s: 0.6 + rng3() * 1.4,
    }));
  }, []);

  return (
    <>
      {/* ── Lighting — Three.js HemisphereLight + DirectionalLight (threejs.org pattern) ── */}
      <hemisphereLight
        args={[skyColor as THREE.ColorRepresentation, groundAmbient as THREE.ColorRepresentation, hemInt]}
      />
      <directionalLight
        position={[sunX, sunY, sunZ]}
        intensity={sunInt}
        color={sunColor}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={220}
        shadow-camera-left={-70}
        shadow-camera-right={70}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
        shadow-bias={-0.0003}
      />
      {isDark && <pointLight position={[0, 10, 0]} intensity={0.6} color="#3355BB" distance={60} decay={2} />}
      {/* Rim light for the capybara silhouette */}
      <directionalLight position={[-30, 20, -30]} intensity={isDark ? 0.08 : 0.22} color={isGolden ? '#FF6633' : '#AACCFF'} />

      {/* ── Fog — FogExp2 for realistic exponential falloff (threejs.org pattern) ── */}
      <fogExp2 attach="fog" args={[fogColor, fogDensity]} />

      {/* ── Ground ── */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[150, 150]} />
        <meshStandardMaterial color={groundColor} roughness={0.92} metalness={0.02} />
      </mesh>

      {/* Ground variation patches — natural colour variation */}
      {Array.from({ length: 24 }).map((_, i) => (
        <mesh key={i} receiveShadow rotation={[-Math.PI / 2, 0, i * 0.5]}
          position={[(i * 17 - 160) % 80, 0.003, (i * 23 - 100) % 80]}>
          <planeGeometry args={[9 + (i % 3) * 5, 7 + (i % 5) * 3]} />
          <meshStandardMaterial
            color={isDark ? '#264226' : '#558A3C'}
            roughness={0.90} metalness={0.01}
            transparent opacity={0.7}
          />
        </mesh>
      ))}

      {/* ── Biome ground overlays (PBR per-biome materials) ── */}
      {/* NE Mountain — grey granite */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[37, 0.008, -37]}>
        <planeGeometry args={[44, 44]} />
        <meshStandardMaterial color={isDark ? '#37474F' : '#546E7A'} roughness={0.88} metalness={0.15} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0.3]} position={[32, 0.01, -30]}>
        <planeGeometry args={[14, 10]} />
        <meshStandardMaterial color={isDark ? '#455A64' : '#607D8B'} roughness={0.85} metalness={0.18} />
      </mesh>

      {/* NW Jungle — dark mossy ground */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[-37, 0.008, -37]}>
        <planeGeometry args={[44, 44]} />
        <meshStandardMaterial color={isDark ? '#1A2E1A' : '#2E5E2E'} roughness={0.95} metalness={0} />
      </mesh>

      {/* SW Savanna — warm golden dry grass */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[-37, 0.008, 37]}>
        <planeGeometry args={[44, 44]} />
        <meshStandardMaterial color={isDark ? '#6D5B2A' : '#C9A84C'} roughness={0.90} metalness={0.02} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0.7]} position={[-42, 0.01, 40]}>
        <planeGeometry args={[18, 12]} />
        <meshStandardMaterial color={isDark ? '#5D4B1F' : '#B8922A'} roughness={0.92} metalness={0.01} />
      </mesh>

      {/* SE Desert — sandy orange */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[37, 0.008, 37]}>
        <planeGeometry args={[44, 44]} />
        <meshStandardMaterial color={isDark ? '#6D5022' : '#D4A055'} roughness={0.88} metalness={0.02} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0.4]} position={[43, 0.01, 44]}>
        <planeGeometry args={[16, 10]} />
        <meshStandardMaterial color={isDark ? '#7A5B28' : '#E8B060'} roughness={0.90} metalness={0.01} />
      </mesh>

      {/* ── Ponds ── */}
      <Pond position={[12, 0, -10]} radius={9} isDark={isDark} />
      <Pond position={[-20, 0, 15]} radius={7} isDark={isDark} />
      <Pond position={[30, 0, 25]} radius={5} isDark={isDark} />

      {/* ── Vegetation ── */}
      {trees.map((pos, i) => <Tree key={i} position={pos} scale={0.7 + Math.sin(i * 1.73) * 0.4} />)}
      {palms.map((pos, i) => <PalmTree key={i} position={pos} />)}
      {bushes.map((pos, i) => <Bush key={i} position={pos} />)}
      {rocks.map((pos, i) => <Rock key={i} position={pos} scale={0.6 + Math.abs(Math.sin(i)) * 0.6} />)}
      {flowers.map((pos, i) => <Flower key={i} position={pos} />)}
      {grassPatches.map((pos, i) => <GrassPatch key={i} position={pos} />)}

      {/* ── Biome vegetation ── */}
      {cacti.map((pos, i)     => <Cactus     key={`c-${i}`} position={pos} />)}
      {acacias.map((pos, i)   => <AcaciaTree key={`a-${i}`} position={pos} />)}
      {jungleTrees.map(({ pos, h }, i) => <JungleTree key={`j-${i}`} position={pos} height={h} />)}
      {mountainBoulders.map(({ pos, s }, i) => <Boulder key={`b-${i}`} position={pos} scale={s} />)}

      {/* Mountain cliff wall */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={`cliff-${i}`} castShadow position={[18 + i * 5.5, 1.0 + Math.sin(i * 1.3) * 0.5, -18]}>
          <boxGeometry args={[4.5 + Math.sin(i) * 1.5, 2.0 + Math.sin(i * 0.8) * 1.2, 1.2]} />
          <meshStandardMaterial color={isDark ? '#455A64' : '#607D8B'} roughness={0.88} metalness={0.12} />
        </mesh>
      ))}

      {/* Savanna dry riverbeds */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0.3]} position={[-30, 0.02, 30]}>
        <planeGeometry args={[3, 18]} />
        <meshStandardMaterial color="#A0856E" roughness={0.94} metalness={0} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, -0.1]} position={[-42, 0.02, 38]}>
        <planeGeometry args={[2.5, 14]} />
        <meshStandardMaterial color="#9E7B5E" roughness={0.94} metalness={0} />
      </mesh>

      {/* Desert dune mounds */}
      {[{x:38,z:38},{x:48,z:32},{x:42,z:50},{x:52,z:46}].map((d,i) => (
        <mesh key={`dune-${i}`} castShadow receiveShadow position={[d.x, 0.5 + i * 0.15, d.z]}>
          <sphereGeometry args={[3 + i * 0.5, 10, 6]} />
          <meshStandardMaterial color={isDark ? '#8A6E30' : '#D4A055'} roughness={0.90} metalness={0.02} />
        </mesh>
      ))}

      {/* World path from spawn */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 5]} receiveShadow>
        <planeGeometry args={[2, 30]} />
        <meshStandardMaterial color={isDark ? '#6B4F30' : '#A0845C'} roughness={0.92} metalness={0.02} />
      </mesh>

      {/* Night fireflies — emissive point sprites */}
      {isDark && Array.from({ length: 20 }).map((_, i) => {
        const a = (i / 20) * Math.PI * 2 * 2.3;
        const r = 10 + Math.sin(i * 1.7) * 8;
        return (
          <mesh key={i} position={[Math.cos(a) * r, 1.2 + Math.sin(i * 1.4) * 0.6, Math.sin(a) * r]}>
            <sphereGeometry args={[0.07, 4, 4]} />
            <meshStandardMaterial color="#EEEE22" emissive="#CCCC00" emissiveIntensity={1.5} roughness={0.3} metalness={0} />
          </mesh>
        );
      })}

      {/* ── Mini-game trigger zone markers ── */}
      {/* Soccer zone — green pulsing rings + sign */}
      <group position={[-42, 0, -8]}>
        {/* Ground ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[9.5, 10.5, 40]} />
          <meshStandardMaterial color="#22CC44" roughness={0.8} metalness={0} emissive="#118822" emissiveIntensity={0.6} transparent opacity={0.7} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[5.5, 6.5, 32]} />
          <meshStandardMaterial color="#44FF66" roughness={0.8} metalness={0} emissive="#22AA44" emissiveIntensity={0.5} transparent opacity={0.5} />
        </mesh>
        {/* Sign post */}
        <mesh position={[0, 2, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.12, 4, 7]} />
          <meshStandardMaterial color="#8B7355" roughness={0.9} metalness={0.02} />
        </mesh>
        <mesh position={[0, 4.5, 0]} castShadow>
          <boxGeometry args={[3.5, 1.2, 0.25]} />
          <meshStandardMaterial color="#1B5E20" roughness={0.7} metalness={0.1} emissive="#0A3010" emissiveIntensity={0.2} />
        </mesh>
        <pointLight position={[0, 3, 0]} intensity={0.5} distance={12} color="#33FF66" />
      </group>

      {/* Shooting range zone — red pulsing rings + sign */}
      <group position={[2, 0, 38]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[9.5, 10.5, 40]} />
          <meshStandardMaterial color="#CC2244" roughness={0.8} metalness={0} emissive="#881122" emissiveIntensity={0.6} transparent opacity={0.7} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[5.5, 6.5, 32]} />
          <meshStandardMaterial color="#FF4466" roughness={0.8} metalness={0} emissive="#AA2233" emissiveIntensity={0.5} transparent opacity={0.5} />
        </mesh>
        {/* Sign post */}
        <mesh position={[0, 2, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.12, 4, 7]} />
          <meshStandardMaterial color="#8B7355" roughness={0.9} metalness={0.02} />
        </mesh>
        <mesh position={[0, 4.5, 0]} castShadow>
          <boxGeometry args={[3.5, 1.2, 0.25]} />
          <meshStandardMaterial color="#B71C1C" roughness={0.7} metalness={0.1} emissive="#5A0E0E" emissiveIntensity={0.2} />
        </mesh>
        <pointLight position={[0, 3, 0]} intensity={0.5} distance={12} color="#FF3355" />
      </group>

      {/* ── Food & Potions ── */}
      {foodItems.map(food => <FoodDisplay key={food.id} food={food} />)}
      {potionItems && potionItems.map(potion => <PotionDisplay key={potion.id} potion={potion} />)}
    </>
  );
}
