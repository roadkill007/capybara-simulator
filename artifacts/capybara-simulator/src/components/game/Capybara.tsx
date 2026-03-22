import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { playerState } from './playerState';
import { fireBullet } from './Bullets';

const SPEED = 5.5;
const RUN_SPEED = 10;
const SWIM_SPEED = 3.5;
const ROTATION_SPEED = 2.8;

const keys: Record<string, boolean> = {};

function CapybaraBody({ action, isInWater, invincible }: { action: string; isInWater: boolean; invincible: boolean }) {
  const bodyRef = useRef<THREE.Group>(null!);
  const tailRef = useRef<THREE.Mesh>(null!);
  const legRefs = [useRef<THREE.Mesh>(null!), useRef<THREE.Mesh>(null!), useRef<THREE.Mesh>(null!)];
  const earRef = useRef<THREE.Mesh>(null!);
  const mouthRef = useRef<THREE.Mesh>(null!);
  const t = useRef(0);

  useFrame((_, dt) => {
    t.current += dt;
    const time = t.current;
    if (!bodyRef.current) return;

    if (action === 'walking' || action === 'running') {
      const speed = action === 'running' ? 8 : 4;
      bodyRef.current.position.y = Math.sin(time * speed) * 0.05;
      legRefs.forEach((leg, i) => {
        if (leg.current) leg.current.rotation.x = Math.sin(time * speed + i * Math.PI) * 0.4;
      });
    } else if (action === 'swimming') {
      bodyRef.current.position.y = Math.sin(time * 2) * 0.05 - 0.2;
      bodyRef.current.rotation.x = Math.sin(time * 2) * 0.05;
    } else if (action === 'eating') {
      if (mouthRef.current) mouthRef.current.scale.y = 1 + Math.sin(time * 8) * 0.3;
    } else if (action === 'sleeping') {
      bodyRef.current.position.y = -0.1;
      bodyRef.current.rotation.x = 0.3;
    } else if (action === 'happy') {
      bodyRef.current.position.y = Math.abs(Math.sin(time * 5)) * 0.15;
      if (tailRef.current) tailRef.current.rotation.z = Math.sin(time * 10) * 0.5;
    } else {
      bodyRef.current.position.y = Math.sin(time * 1.5) * 0.02;
      if (earRef.current) earRef.current.rotation.z = Math.sin(time * 2) * 0.1;
    }
  });

  const flash = invincible && Math.floor(Date.now() / 120) % 2 === 0;
  const bodyColor = flash ? '#FF8888' : '#8B6914';
  const darkColor = flash ? '#CC5555' : '#6B4F0F';
  const noseColor = '#5C3A1E';

  return (
    <group ref={bodyRef}>
      <mesh castShadow>
        <capsuleGeometry args={[0.35, 0.7, 8, 16]} />
        <meshLambertMaterial color={bodyColor} />
      </mesh>

      {/* Head — faces local +Z (forward) */}
      <group position={[0, 0.25, 0.55]}>
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.38, 0.48]} />
          <meshLambertMaterial color={bodyColor} />
        </mesh>
        <mesh position={[0, -0.04, 0.22]} castShadow>
          <boxGeometry args={[0.35, 0.22, 0.1]} />
          <meshLambertMaterial color={darkColor} />
        </mesh>
        <mesh position={[-0.08, -0.04, 0.27]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshLambertMaterial color={noseColor} />
        </mesh>
        <mesh position={[0.08, -0.04, 0.27]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshLambertMaterial color={noseColor} />
        </mesh>
        <mesh position={[-0.16, 0.1, 0.22]}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshLambertMaterial color="#111" />
        </mesh>
        <mesh position={[0.16, 0.1, 0.22]}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshLambertMaterial color="#111" />
        </mesh>
        <mesh position={[-0.14, 0.12, 0.265]}>
          <sphereGeometry args={[0.018, 6, 6]} />
          <meshLambertMaterial color="white" />
        </mesh>
        <mesh position={[0.18, 0.12, 0.265]}>
          <sphereGeometry args={[0.018, 6, 6]} />
          <meshLambertMaterial color="white" />
        </mesh>
        <mesh ref={earRef} position={[-0.2, 0.24, -0.05]} rotation={[0, 0, -0.3]} castShadow>
          <capsuleGeometry args={[0.07, 0.09, 4, 8]} />
          <meshLambertMaterial color={darkColor} />
        </mesh>
        <mesh position={[0.2, 0.24, -0.05]} rotation={[0, 0, 0.3]} castShadow>
          <capsuleGeometry args={[0.07, 0.09, 4, 8]} />
          <meshLambertMaterial color={darkColor} />
        </mesh>
        <mesh ref={mouthRef} position={[0, -0.12, 0.25]}>
          <boxGeometry args={[0.15, 0.03, 0.05]} />
          <meshLambertMaterial color={noseColor} />
        </mesh>
      </group>

      {/* Legs */}
      {[[-0.28, -0.35, 0.22], [0.28, -0.35, 0.22], [-0.28, -0.35, -0.22], [0.28, -0.35, -0.22]].map(([x, y, z], i) => (
        <mesh key={i} ref={legRefs[Math.min(i, 2)]} position={[x, y, z]} castShadow>
          <capsuleGeometry args={[0.09, 0.22, 4, 8]} />
          <meshLambertMaterial color={darkColor} />
        </mesh>
      ))}

      <mesh ref={tailRef} position={[0, 0.1, -0.55]} rotation={[0.3, 0, 0]} castShadow>
        <capsuleGeometry args={[0.05, 0.1, 4, 8]} />
        <meshLambertMaterial color={darkColor} />
      </mesh>

      {isInWater && (
        <mesh position={[0, -0.28, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.7, 16]} />
          <meshBasicMaterial color="#4FA8E8" transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

export function Capybara() {
  const meshRef = useRef<THREE.Group>(null!);
  const rotationRef = useRef(0);
  const posRef = useRef(new THREE.Vector3(0, 0.4, 0));
  const { camera } = useThree();
  const shootCooldown = useRef(0);
  const actionCooldown = useRef(0);

  const { phase, setIsInWater, setCurrentAction, energy, collectFood, foodItems, addScore, setHappiness, happiness, isInWater, invincibleTimer } = useGameStore();
  const [localAction, setLocalAction] = useState<string>('idle');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { keys[e.code] = e.type === 'keydown'; };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
    };
  }, []);

  useFrame((_, dt) => {
    if (phase !== 'playing' || !meshRef.current) return;

    actionCooldown.current = Math.max(0, actionCooldown.current - dt);
    shootCooldown.current = Math.max(0, shootCooldown.current - dt);

    const pos = posRef.current;
    const isRunning = keys['ShiftLeft'] || keys['ShiftRight'];
    const inWater = pos.y < 0.15;

    const speed = inWater ? SWIM_SPEED : isRunning && energy > 10 ? RUN_SPEED : SPEED;

    // Rotation
    if (keys['KeyA'] || keys['ArrowLeft']) rotationRef.current += ROTATION_SPEED * dt;
    if (keys['KeyD'] || keys['ArrowRight']) rotationRef.current -= ROTATION_SPEED * dt;

    // Forward vector = local +Z rotated by Y rotation
    // At rotation=0, facing = (0,0,1). W moves forward (into the screen toward +Z)
    const fwd = new THREE.Vector3(
      Math.sin(rotationRef.current),
      0,
      Math.cos(rotationRef.current)
    );

    const moving = keys['KeyW'] || keys['ArrowUp'] || keys['KeyS'] || keys['ArrowDown'];

    if (keys['KeyW'] || keys['ArrowUp']) {
      pos.addScaledVector(fwd, speed * dt);
    }
    if (keys['KeyS'] || keys['ArrowDown']) {
      pos.addScaledVector(fwd, -speed * dt * 0.6);
    }

    // Clamp to bigger world
    pos.x = Math.max(-58, Math.min(58, pos.x));
    pos.z = Math.max(-58, Math.min(58, pos.z));

    // Ground
    const groundY = getGroundHeight(pos.x, pos.z);
    pos.y = Math.max(groundY, pos.y - 9.8 * dt);
    if (pos.y <= groundY) pos.y = groundY;

    meshRef.current.position.copy(pos);
    meshRef.current.rotation.y = rotationRef.current;

    // Update shared player state
    playerState.position.copy(pos);
    playerState.rotation = rotationRef.current;
    playerState.facing.copy(fwd);

    setIsInWater(inWater);

    // Shooting — F key or mouse click
    if ((keys['KeyF'] || keys['Space']) && shootCooldown.current <= 0) {
      fireBullet();
      shootCooldown.current = 0.3;
    }

    // Other actions
    let action: string = 'idle';
    if (keys['KeyF'] && shootCooldown.current > 0.25) {
      action = 'happy'; // reuse happy anim for shooting
    } else if (keys['KeyE'] && actionCooldown.current <= 0) {
      action = 'eating';
      actionCooldown.current = 1;
    } else if (keys['KeyZ'] && actionCooldown.current <= 0) {
      action = 'sleeping';
      actionCooldown.current = 2;
    } else if (inWater) {
      action = 'swimming';
    } else if (moving) {
      action = isRunning && energy > 10 ? 'running' : 'walking';
    }

    setLocalAction(action);
    setCurrentAction(action as any);

    // Food collection
    foodItems.filter(f => !f.collected).forEach(food => {
      const foodPos = new THREE.Vector3(...food.position);
      if (pos.distanceTo(foodPos) < 1.2) collectFood(food.id);
    });

    // Camera behind capybara — offset in -Z local (behind the head)
    const camOffset = new THREE.Vector3(0, 5, -11);
    camOffset.applyEuler(new THREE.Euler(0, rotationRef.current, 0));
    const targetCamPos = pos.clone().add(camOffset);
    camera.position.lerp(targetCamPos, 0.08);
    camera.lookAt(pos.clone().add(new THREE.Vector3(0, 0.8, 0)));
  });

  return (
    <group ref={meshRef}>
      <CapybaraBody action={localAction} isInWater={isInWater} invincible={invincibleTimer > 0} />
    </group>
  );
}

export function getGroundHeight(x: number, z: number): number {
  // Multiple ponds
  const ponds = [[12, -10, 9], [-20, 15, 7], [30, 25, 6]] as [number, number, number][];
  for (const [px, pz, pr] of ponds) {
    const d = Math.sqrt((x - px) ** 2 + (z - pz) ** 2);
    if (d < pr) return -0.6 + d * 0.06;
  }
  // Gentle hills
  const h = Math.sin(x * 0.15) * Math.cos(z * 0.15) * 0.6 + Math.sin(x * 0.3 + 1) * Math.cos(z * 0.25 + 2) * 0.3;
  return Math.max(-0.5, h);
}
