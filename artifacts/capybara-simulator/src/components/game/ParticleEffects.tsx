import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';

interface Particle {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

let particleId = 0;

export function ParticleEffects() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const { currentAction, isInWater, happiness } = useGameStore();
  const prevActionRef = useRef<string>('');
  const timerRef = useRef(0);

  useFrame((_, dt) => {
    timerRef.current += dt;

    // Update existing particles
    setParticles(prev => {
      const updated = prev.map(p => ({
        ...p,
        life: p.life - dt,
        position: p.position.clone().addScaledVector(p.velocity, dt),
      })).filter(p => p.life > 0);

      // Add new particles based on action
      const newParticles: Particle[] = [];

      if (currentAction === 'happy' && Math.random() < 0.3) {
        for (let i = 0; i < 3; i++) {
          newParticles.push({
            id: particleId++,
            position: new THREE.Vector3(
              (Math.random() - 0.5) * 2,
              1 + Math.random(),
              (Math.random() - 0.5) * 2,
            ),
            velocity: new THREE.Vector3(
              (Math.random() - 0.5) * 3,
              2 + Math.random() * 2,
              (Math.random() - 0.5) * 3,
            ),
            life: 1 + Math.random() * 0.5,
            maxLife: 1.5,
            color: ['#FFD700', '#FF69B4', '#00CED1', '#FF6347'][Math.floor(Math.random() * 4)],
            size: 0.08 + Math.random() * 0.08,
          });
        }
      }

      if (isInWater && Math.random() < 0.15) {
        newParticles.push({
          id: particleId++,
          position: new THREE.Vector3((Math.random() - 0.5) * 1.5, 0.1, (Math.random() - 0.5) * 1.5),
          velocity: new THREE.Vector3((Math.random() - 0.5) * 0.5, 0.5 + Math.random(), (Math.random() - 0.5) * 0.5),
          life: 0.8,
          maxLife: 0.8,
          color: '#6ECFDF',
          size: 0.06,
        });
      }

      if (currentAction === 'eating' && Math.random() < 0.1) {
        newParticles.push({
          id: particleId++,
          position: new THREE.Vector3((Math.random() - 0.5) * 0.5, 0.8, 0.6),
          velocity: new THREE.Vector3((Math.random() - 0.5) * 1, 1 + Math.random(), (Math.random() - 0.5)),
          life: 0.5,
          maxLife: 0.5,
          color: '#FF4444',
          size: 0.05,
        });
      }

      return [...updated, ...newParticles].slice(-80);
    });

    prevActionRef.current = currentAction;
  });

  return (
    <>
      {particles.map(p => (
        <mesh key={p.id} position={p.position}>
          <sphereGeometry args={[p.size * (p.life / p.maxLife), 4, 4]} />
          <meshBasicMaterial
            color={p.color}
            transparent
            opacity={Math.min(1, p.life / p.maxLife * 2)}
          />
        </mesh>
      ))}
    </>
  );
}
