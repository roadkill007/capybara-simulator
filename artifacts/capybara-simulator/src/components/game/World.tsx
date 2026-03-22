import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';

function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.18, 1.4, 8]} />
        <meshLambertMaterial color="#6B4226" />
      </mesh>
      <mesh position={[0, 1.9, 0]} castShadow>
        <coneGeometry args={[0.9, 1.6, 8]} />
        <meshLambertMaterial color="#2D6A2D" />
      </mesh>
      <mesh position={[0, 2.7, 0]} castShadow>
        <coneGeometry args={[0.65, 1.3, 8]} />
        <meshLambertMaterial color="#3A7A3A" />
      </mesh>
    </group>
  );
}

function Bush({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <sphereGeometry args={[0.45, 8, 8]} />
        <meshLambertMaterial color="#3D8C3D" />
      </mesh>
      <mesh position={[0.3, 0.1, 0.1]} castShadow>
        <sphereGeometry args={[0.32, 8, 8]} />
        <meshLambertMaterial color="#2E6B2E" />
      </mesh>
    </group>
  );
}

function Rock({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <mesh position={position} scale={scale} rotation={[0, Math.random() * Math.PI, 0]} castShadow>
      <dodecahedronGeometry args={[0.4, 0]} />
      <meshLambertMaterial color="#888888" />
    </mesh>
  );
}

function Flower({ position }: { position: [number, number, number] }) {
  const colors = ['#FF6B6B', '#FFD93D', '#FF8C94', '#C3F0CA'];
  const color = colors[Math.floor(Math.abs(position[0] * position[2]) * 7) % colors.length];
  return (
    <group position={position}>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 6]} />
        <meshLambertMaterial color="#4A7C4A" />
      </mesh>
      <mesh position={[0, 0.33, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshLambertMaterial color={color} />
      </mesh>
    </group>
  );
}

function FoodDisplay({ food }: { food: { id: string; type: string; position: [number, number, number]; collected: boolean } }) {
  const meshRef = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += dt;
      meshRef.current.position.y = food.position[1] + Math.sin(Date.now() * 0.002) * 0.1 + 0.3;
    }
  });

  if (food.collected) return null;

  return (
    <group ref={meshRef} position={food.position}>
      {food.type === 'watermelon' && (
        <>
          <mesh castShadow>
            <sphereGeometry args={[0.3, 12, 8]} />
            <meshLambertMaterial color="#2D8B2D" />
          </mesh>
          <mesh scale={[0.85, 0.85, 0.85]}>
            <sphereGeometry args={[0.3, 12, 8]} />
            <meshLambertMaterial color="#FF4444" />
          </mesh>
          <mesh scale={[0.4, 0.4, 0.5]} position={[0, 0.28, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.15, 6]} />
            <meshLambertMaterial color="#2D6B2D" />
          </mesh>
        </>
      )}
      {food.type === 'grass' && (
        <group>
          {[-0.1, 0, 0.1].map((x, i) => (
            <mesh key={i} position={[x, 0.15, i * 0.05]} rotation={[0, 0, (x * 0.5)]}>
              <boxGeometry args={[0.05, 0.4, 0.05]} />
              <meshLambertMaterial color="#5CB85C" />
            </mesh>
          ))}
        </group>
      )}
      {food.type === 'sugarcane' && (
        <group>
          {[-0.08, 0, 0.08].map((x, i) => (
            <group key={i} position={[x, 0, 0]}>
              <mesh position={[0, 0.35, 0]}>
                <cylinderGeometry args={[0.04, 0.05, 0.7, 8]} />
                <meshLambertMaterial color="#8BC34A" />
              </mesh>
              {[0.1, 0.25, 0.45].map((y, j) => (
                <mesh key={j} position={[0.06, y, 0]} rotation={[0, 0, 0.5]}>
                  <boxGeometry args={[0.12, 0.03, 0.04]} />
                  <meshLambertMaterial color="#A5D96A" />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      )}
      {/* Glow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}>
        <ringGeometry args={[0.35, 0.5, 16]} />
        <meshBasicMaterial color="#FFD700" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

export function World() {
  const { timeOfDay, foodItems } = useGameStore();
  const waterRef = useRef<THREE.Mesh>(null!);

  useFrame((_, dt) => {
    if (waterRef.current) {
      (waterRef.current.material as THREE.MeshPhongMaterial).opacity =
        0.6 + Math.sin(Date.now() * 0.001) * 0.05;
    }
  });

  const sunAngle = ((timeOfDay - 6) / 12) * Math.PI;
  const isDark = timeOfDay < 6 || timeOfDay > 20;

  const trees = useMemo(() => [
    [-15, 0, -15], [-12, 0, 5], [18, 0, -10], [20, 0, 12], [-20, 0, 8],
    [5, 0, -20], [-5, 0, 18], [12, 0, -18], [-18, 0, -5], [0, 0, 22],
    [22, 0, 0], [-22, 0, 15], [15, 0, 20], [-8, 0, -20], [8, 0, 20],
  ] as [number, number, number][], []);

  const bushes = useMemo(() => [
    [-6, 0, -8], [6, 0, 8], [-3, 0, 12], [14, 0, 5], [-14, 0, -8],
    [3, 0, -14], [-9, 0, 9], [9, 0, -9], [16, 0, -16], [-16, 0, 16],
  ] as [number, number, number][], []);

  const rocks = useMemo(() => [
    [4, 0, 4], [-5, 0, 7], [10, 0, 2], [-2, 0, -9], [7, 0, -3],
    [-12, 0, 3], [3, 0, 11], [-7, 0, -4], [14, 0, -7], [-3, 0, 15],
  ] as [number, number, number][], []);

  const flowers = useMemo(() => {
    const fl: [number, number, number][] = [];
    for (let i = 0; i < 60; i++) {
      const x = (Math.random() - 0.5) * 40;
      const z = (Math.random() - 0.5) * 40;
      const dist = Math.sqrt((x - 8) ** 2 + (z + 8) ** 2);
      if (dist > 6) fl.push([x, 0.05, z]);
    }
    return fl;
  }, []);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={isDark ? 0.15 : 0.4} color={isDark ? '#334466' : '#fffcf0'} />
      <directionalLight
        position={[Math.cos(sunAngle) * 20, Math.sin(sunAngle) * 20, 5]}
        intensity={isDark ? 0.1 : 1.2}
        color={timeOfDay < 8 || timeOfDay > 18 ? '#ff9966' : '#fffaf0'}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={100}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      {isDark && <pointLight position={[0, 5, 0]} intensity={0.3} color="#6688ff" distance={20} />}

      {/* Fog */}
      <fog attach="fog" args={[isDark ? '#112244' : '#d4e8d4', 30, 80]} />

      {/* Ground */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[80, 80, 40, 40]} />
        <meshLambertMaterial color={isDark ? '#2C4A2C' : '#5A8A3C'} />
      </mesh>

      {/* Pond */}
      <mesh
        ref={waterRef}
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[8, -0.1, -8]}
      >
        <circleGeometry args={[6, 32]} />
        <meshPhongMaterial
          color={isDark ? '#1A3A5C' : '#1E8FD4'}
          transparent
          opacity={0.75}
          shininess={100}
        />
      </mesh>

      {/* Pond ring (mud) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[8, -0.12, -8]}>
        <ringGeometry args={[5.8, 7.2, 32]} />
        <meshLambertMaterial color="#6B5A2A" />
      </mesh>

      {/* Trees */}
      {trees.map((pos, i) => (
        <Tree key={i} position={pos} scale={0.8 + Math.sin(i * 1.7) * 0.3} />
      ))}

      {/* Bushes */}
      {bushes.map((pos, i) => (
        <Bush key={i} position={pos} />
      ))}

      {/* Rocks */}
      {rocks.map((pos, i) => (
        <Rock key={i} position={pos} scale={0.7 + Math.sin(i) * 0.4} />
      ))}

      {/* Flowers */}
      {flowers.map((pos, i) => (
        <Flower key={i} position={pos} />
      ))}

      {/* Food Items */}
      {foodItems.map(food => (
        <FoodDisplay key={food.id} food={food} />
      ))}

      {/* Fireflies at night */}
      {isDark && Array.from({ length: 15 }).map((_, i) => {
        const angle = (i / 15) * Math.PI * 2;
        const r = 8 + Math.sin(i * 2.3) * 4;
        return (
          <mesh key={i} position={[Math.cos(angle) * r, 1 + Math.sin(i * 1.7) * 0.5, Math.sin(angle) * r]}>
            <sphereGeometry args={[0.05, 4, 4]} />
            <meshBasicMaterial color="#FFFF44" />
          </mesh>
        );
      })}

      {/* Lily pads in pond */}
      {[0, 1, 2, 3].map(i => {
        const angle = (i / 4) * Math.PI * 2;
        return (
          <mesh key={i} rotation={[-Math.PI / 2, 0, angle]} position={[8 + Math.cos(angle) * 3.5, 0.01, -8 + Math.sin(angle) * 3.5]}>
            <circleGeometry args={[0.45, 8]} />
            <meshLambertMaterial color="#2E7D32" />
          </mesh>
        );
      })}

      {/* Path */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[1.5, 20]} />
        <meshLambertMaterial color="#A0845C" />
      </mesh>
    </>
  );
}
