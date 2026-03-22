import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';

export function SkyBox() {
  const { timeOfDay } = useGameStore();
  const meshRef = useRef<THREE.Mesh>(null!);
  const sunRef = useRef<THREE.Mesh>(null!);
  const moonRef = useRef<THREE.Mesh>(null!);

  // Sky color based on time
  const getSkyColor = () => {
    if (timeOfDay < 5) return '#0a0a1a';
    if (timeOfDay < 7) return '#ff7043';
    if (timeOfDay < 9) return '#ffcc80';
    if (timeOfDay < 17) return '#87CEEB';
    if (timeOfDay < 19) return '#ff8a65';
    if (timeOfDay < 21) return '#3949AB';
    return '#0a0a1a';
  };

  const skyColor = getSkyColor();
  const sunAngle = ((timeOfDay - 6) / 12) * Math.PI;
  const isDaytime = timeOfDay > 6 && timeOfDay < 20;

  return (
    <>
      {/* Sky sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[60, 16, 16]} />
        <meshBasicMaterial color={skyColor} side={THREE.BackSide} />
      </mesh>

      {/* Sun */}
      <mesh
        ref={sunRef}
        position={[
          Math.cos(sunAngle) * 40,
          Math.sin(sunAngle) * 40,
          -10
        ]}
      >
        <sphereGeometry args={[2.5, 12, 12]} />
        <meshBasicMaterial color={isDaytime ? '#FFF176' : '#FF8A65'} />
      </mesh>

      {/* Moon */}
      {!isDaytime && (
        <mesh
          ref={moonRef}
          position={[
            -Math.cos(sunAngle) * 35,
            -Math.sin(sunAngle) * 35 + 10,
            -8
          ]}
        >
          <sphereGeometry args={[1.8, 12, 12]} />
          <meshBasicMaterial color="#E8E8E8" />
        </mesh>
      )}

      {/* Stars at night */}
      {!isDaytime && Array.from({ length: 80 }).map((_, i) => {
        const phi = Math.acos(-1 + (2 * i) / 80);
        const theta = Math.sqrt(80 * Math.PI) * phi;
        return (
          <mesh
            key={i}
            position={[
              50 * Math.sin(phi) * Math.cos(theta),
              50 * Math.cos(phi),
              50 * Math.sin(phi) * Math.sin(theta),
            ]}
          >
            <sphereGeometry args={[0.15, 4, 4]} />
            <meshBasicMaterial color="white" />
          </mesh>
        );
      })}

      {/* Clouds */}
      {isDaytime && Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2 + timeOfDay * 0.001;
        return (
          <group key={i} position={[Math.cos(angle) * 30, 12 + Math.sin(i * 1.7) * 3, Math.sin(angle) * 30]}>
            {[-0.8, 0, 0.8].map((ox, j) => (
              <mesh key={j} position={[ox, Math.sin(j * 2) * 0.4, 0]}>
                <sphereGeometry args={[1.5 + j * 0.3, 8, 8]} />
                <meshBasicMaterial color="white" transparent opacity={0.85} />
              </mesh>
            ))}
          </group>
        );
      })}
    </>
  );
}
