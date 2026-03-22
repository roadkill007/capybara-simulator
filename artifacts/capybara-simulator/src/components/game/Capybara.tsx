import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';

const SPEED = 5;
const RUN_SPEED = 9;
const SWIM_SPEED = 3;
const ROTATION_SPEED = 3;

const keys: Record<string, boolean> = {};

function CapybaraBody({ action, isInWater }: { action: string; isInWater: boolean }) {
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
        if (leg.current) {
          leg.current.rotation.x = Math.sin(time * speed + i * Math.PI) * 0.4;
        }
      });
    } else if (action === 'swimming') {
      bodyRef.current.position.y = Math.sin(time * 2) * 0.05 - 0.2;
      bodyRef.current.rotation.x = Math.sin(time * 2) * 0.05;
    } else if (action === 'eating') {
      if (mouthRef.current) {
        mouthRef.current.scale.y = 1 + Math.sin(time * 8) * 0.3;
      }
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

  const bodyColor = '#8B6914';
  const darkColor = '#6B4F0F';
  const noseColor = '#5C3A1E';

  return (
    <group ref={bodyRef}>
      {/* Main body */}
      <mesh castShadow>
        <capsuleGeometry args={[0.35, 0.7, 8, 16]} />
        <meshLambertMaterial color={bodyColor} />
      </mesh>

      {/* Head */}
      <group position={[0, 0.25, 0.55]}>
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.38, 0.48]} />
          <meshLambertMaterial color={bodyColor} />
        </mesh>

        {/* Nose area */}
        <mesh position={[0, -0.04, 0.22]} castShadow>
          <boxGeometry args={[0.35, 0.22, 0.1]} />
          <meshLambertMaterial color={darkColor} />
        </mesh>

        {/* Nostrils */}
        <mesh position={[-0.08, -0.04, 0.27]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshLambertMaterial color={noseColor} />
        </mesh>
        <mesh position={[0.08, -0.04, 0.27]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshLambertMaterial color={noseColor} />
        </mesh>

        {/* Eyes */}
        <mesh position={[-0.16, 0.1, 0.22]}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshLambertMaterial color="#111" />
        </mesh>
        <mesh position={[0.16, 0.1, 0.22]}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshLambertMaterial color="#111" />
        </mesh>

        {/* Eye shine */}
        <mesh position={[-0.14, 0.12, 0.265]}>
          <sphereGeometry args={[0.018, 6, 6]} />
          <meshLambertMaterial color="white" />
        </mesh>
        <mesh position={[0.18, 0.12, 0.265]}>
          <sphereGeometry args={[0.018, 6, 6]} />
          <meshLambertMaterial color="white" />
        </mesh>

        {/* Ears */}
        <mesh ref={earRef} position={[-0.2, 0.24, -0.05]} rotation={[0, 0, -0.3]} castShadow>
          <capsuleGeometry args={[0.07, 0.09, 4, 8]} />
          <meshLambertMaterial color={darkColor} />
        </mesh>
        <mesh position={[0.2, 0.24, -0.05]} rotation={[0, 0, 0.3]} castShadow>
          <capsuleGeometry args={[0.07, 0.09, 4, 8]} />
          <meshLambertMaterial color={darkColor} />
        </mesh>

        {/* Mouth */}
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

      {/* Tail */}
      <mesh ref={tailRef} position={[0, 0.1, -0.55]} rotation={[0.3, 0, 0]} castShadow>
        <capsuleGeometry args={[0.05, 0.1, 4, 8]} />
        <meshLambertMaterial color={darkColor} />
      </mesh>

      {/* Water ripple when swimming */}
      {isInWater && (
        <mesh position={[0, -0.28, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.7, 16]} />
          <meshBasicMaterial color="#6ECFDF" transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

export function Capybara() {
  const meshRef = useRef<THREE.Group>(null!);
  const velocityRef = useRef(new THREE.Vector3());
  const rotationRef = useRef(0);
  const positionRef = useRef(new THREE.Vector3(0, 0.4, 0));
  const { camera } = useThree();

  const { phase, setIsInWater, setCurrentAction, currentAction, energy, collectFood, foodItems, addScore, setHappiness, happiness, isInWater } = useGameStore();

  const [localAction, setLocalAction] = useState<string>('idle');
  const actionCooldown = useRef(0);

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

    const pos = positionRef.current;
    const isRunning = keys['ShiftLeft'] || keys['ShiftRight'];
    const inWater = pos.y < 0.1;

    const speed = inWater ? SWIM_SPEED : isRunning && energy > 10 ? RUN_SPEED : SPEED;
    const moveDir = new THREE.Vector3();

    const moving =
      keys['KeyW'] || keys['ArrowUp'] ||
      keys['KeyS'] || keys['ArrowDown'] ||
      keys['KeyA'] || keys['ArrowLeft'] ||
      keys['KeyD'] || keys['ArrowRight'];

    if (keys['KeyW'] || keys['ArrowUp']) moveDir.z -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) moveDir.z += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) rotationRef.current += ROTATION_SPEED * dt;
    if (keys['KeyD'] || keys['ArrowRight']) rotationRef.current -= ROTATION_SPEED * dt;

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize().applyEuler(new THREE.Euler(0, rotationRef.current, 0));
      pos.addScaledVector(moveDir, speed * dt);
    }

    // Clamp to world bounds
    pos.x = Math.max(-28, Math.min(28, pos.x));
    pos.z = Math.max(-28, Math.min(28, pos.z));

    // Terrain height (simple)
    const groundY = getGroundHeight(pos.x, pos.z);
    pos.y = Math.max(groundY, pos.y - 9.8 * dt);
    if (pos.y <= groundY) pos.y = groundY;

    meshRef.current.position.copy(pos);
    meshRef.current.rotation.y = rotationRef.current;

    const newInWater = pos.y < 0.15;
    setIsInWater(newInWater);

    // Determine action
    let action: string = 'idle';
    if (keys['Space'] && actionCooldown.current <= 0) {
      action = 'happy';
      addScore(5);
      setHappiness(happiness + 2);
      actionCooldown.current = 0.5;
    } else if (keys['KeyE'] && actionCooldown.current <= 0) {
      action = 'eating';
      actionCooldown.current = 1;
    } else if (keys['KeyZ'] && actionCooldown.current <= 0) {
      action = 'sleeping';
      actionCooldown.current = 2;
    } else if (newInWater) {
      action = 'swimming';
    } else if (moving) {
      action = isRunning && energy > 10 ? 'running' : 'walking';
    } else {
      action = 'idle';
    }

    setLocalAction(action);
    setCurrentAction(action as any);

    // Food collection
    foodItems.filter(f => !f.collected).forEach(food => {
      const foodPos = new THREE.Vector3(...food.position);
      if (pos.distanceTo(foodPos) < 1.2) {
        collectFood(food.id);
      }
    });

    // Camera follow
    const camOffset = new THREE.Vector3(0, 4.5, 10);
    camOffset.applyEuler(new THREE.Euler(0, rotationRef.current, 0));
    const targetCamPos = pos.clone().add(camOffset);
    camera.position.lerp(targetCamPos, 0.08);
    camera.lookAt(pos.clone().add(new THREE.Vector3(0, 0.5, 0)));
  });

  return (
    <group ref={meshRef} position={[0, 0.4, 0]}>
      <CapybaraBody action={localAction} isInWater={isInWater} />
    </group>
  );
}

function getGroundHeight(x: number, z: number): number {
  // Pond area is lower
  const distFromPond = Math.sqrt((x - 8) ** 2 + (z + 8) ** 2);
  if (distFromPond < 6) return -0.5 + distFromPond * 0.05;

  // Hills
  const h = Math.sin(x * 0.3) * Math.cos(z * 0.3) * 0.4;
  return Math.max(-0.4, h);
}
