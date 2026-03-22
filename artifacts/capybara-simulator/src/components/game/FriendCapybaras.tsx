import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';

function FriendCapybara({ position, id }: { position: [number, number, number]; id: string }) {
  const groupRef = useRef<THREE.Group>(null!);
  const dirRef = useRef(new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize());
  const timeRef = useRef(Math.random() * 10);
  const actionTimeRef = useRef(0);
  const currentActionRef = useRef<'idle' | 'walk' | 'eat'>('idle');

  useFrame((_, dt) => {
    timeRef.current += dt;
    actionTimeRef.current -= dt;

    if (actionTimeRef.current <= 0) {
      const r = Math.random();
      if (r < 0.3) { currentActionRef.current = 'walk'; actionTimeRef.current = 2 + Math.random() * 3; }
      else if (r < 0.5) { currentActionRef.current = 'eat'; actionTimeRef.current = 1 + Math.random() * 2; }
      else { currentActionRef.current = 'idle'; actionTimeRef.current = 1 + Math.random() * 2; }
    }

    if (!groupRef.current) return;

    if (currentActionRef.current === 'walk') {
      const speed = 1.5;
      const pos = groupRef.current.position;
      pos.addScaledVector(dirRef.current, speed * dt);

      // Bounce off edges
      if (Math.abs(pos.x) > 20 || Math.abs(pos.z) > 20) {
        dirRef.current.negate();
      }

      // Random direction changes
      if (Math.random() < 0.01) {
        dirRef.current.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
      }

      groupRef.current.rotation.y = Math.atan2(dirRef.current.x, dirRef.current.z);
      groupRef.current.position.y = Math.sin(timeRef.current * 4) * 0.04;
    }
  });

  const colors = ['#8B6914', '#7A5C12', '#9B7920', '#6B4F0F'];
  const bodyColor = colors[parseInt(id) % colors.length] || '#8B6914';

  return (
    <group ref={groupRef} position={position}>
      {/* Simplified friend capybara */}
      <mesh castShadow>
        <capsuleGeometry args={[0.28, 0.55, 6, 12]} />
        <meshLambertMaterial color={bodyColor} />
      </mesh>
      <group position={[0, 0.2, 0.45]}>
        <mesh castShadow>
          <boxGeometry args={[0.42, 0.3, 0.38]} />
          <meshLambertMaterial color={bodyColor} />
        </mesh>
        <mesh position={[-0.13, 0.08, 0.18]}>
          <sphereGeometry args={[0.045, 6, 6]} />
          <meshLambertMaterial color="#111" />
        </mesh>
        <mesh position={[0.13, 0.08, 0.18]}>
          <sphereGeometry args={[0.045, 6, 6]} />
          <meshLambertMaterial color="#111" />
        </mesh>
        <mesh position={[-0.16, 0.2, -0.04]} rotation={[0, 0, -0.3]}>
          <capsuleGeometry args={[0.055, 0.07, 4, 6]} />
          <meshLambertMaterial color="#6B4F0F" />
        </mesh>
        <mesh position={[0.16, 0.2, -0.04]} rotation={[0, 0, 0.3]}>
          <capsuleGeometry args={[0.055, 0.07, 4, 6]} />
          <meshLambertMaterial color="#6B4F0F" />
        </mesh>
      </group>
      {/* Cute name tag */}
      <mesh position={[0, 0.85, 0]} rotation={[0, 0, 0]}>
        <planeGeometry args={[0.6, 0.22]} />
        <meshBasicMaterial color="#FFD700" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

export function FriendCapybaras() {
  const { friends, happiness, addFriend, phase } = useGameStore();

  const spawnTimerRef = useRef(0);

  useFrame((_, dt) => {
    if (phase !== 'playing') return;
    spawnTimerRef.current += dt;

    // Spawn friends based on happiness
    if (spawnTimerRef.current > 15 && friends.length < 5 && happiness > 60) {
      spawnTimerRef.current = 0;
      const angle = Math.random() * Math.PI * 2;
      const dist = 8 + Math.random() * 8;
      addFriend({
        id: String(Date.now()),
        position: [Math.cos(angle) * dist, 0.3, Math.sin(angle) * dist],
        action: 'idle',
      });
    }
  });

  return (
    <>
      {friends.map(friend => (
        <FriendCapybara key={friend.id} position={friend.position} id={friend.id} />
      ))}
    </>
  );
}
