import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';

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
      {/* Mud ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]}>
        <ringGeometry args={[radius - 0.5, radius + 1.5, 32]} />
        <meshLambertMaterial color="#6B5A2A" />
      </mesh>
      {/* Water — BLUE transparent */}
      <mesh ref={waterRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <circleGeometry args={[radius, 32]} />
        <meshPhongMaterial
          color={isDark ? '#1565C0' : '#1E88E5'}
          transparent
          opacity={0.75}
          shininess={120}
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

export function World() {
  const { timeOfDay, foodItems } = useGameStore();
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
      <fog attach="fog" args={[isDark ? '#0A1A3A' : '#AACCAA', 50, 130]} />

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

      {/* Three ponds — BLUE transparent */}
      <Pond position={[12, 0, -10]} radius={9} isDark={isDark} />
      <Pond position={[-20, 0, 15]} radius={7} isDark={isDark} />
      <Pond position={[30, 0, 25]} radius={5} isDark={isDark} />

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
