import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { playerState } from './playerState';
import { fireBullet } from './Bullets';
import { mobileInput } from './mobileInput';
import { getWaterHeight } from './RealisticWater';

const SPEED = 5.5;
const RUN_SPEED = 10;
const SWIM_SPEED = 3.5;
const ROTATION_SPEED = 2.8;
const JUMP_FORCE = 7.0;
const GRAVITY = 20;

const keys: Record<string, boolean> = {};
const jumpPressed = { current: false };

function CapybaraBody({ action, isInWater, invincible, isGiant }: {
  action: string; isInWater: boolean; invincible: boolean; isGiant: boolean;
}) {
  const bodyRef = useRef<THREE.Group>(null!);
  const tailRef = useRef<THREE.Mesh>(null!);
  const legRefs = [useRef<THREE.Mesh>(null!), useRef<THREE.Mesh>(null!), useRef<THREE.Mesh>(null!)];
  const earRef = useRef<THREE.Mesh>(null!);
  const mouthRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
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
    } else if (action === 'jumping') {
      bodyRef.current.position.y = Math.abs(Math.sin(time * 6)) * 0.08;
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

    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = isGiant ? 0.25 + Math.sin(time * 3) * 0.1 : 0;
    }
  });

  const flash = invincible && Math.floor(Date.now() / 120) % 2 === 0;
  const bodyColor = isGiant ? (flash ? '#FFD700' : '#FF8C00') : (flash ? '#FF8888' : '#8B6914');
  const darkColor = isGiant ? '#CC6600' : (flash ? '#CC5555' : '#6B4F0F');
  const noseColor = '#5C3A1E';
  const eyeColor = isGiant ? '#FF4400' : '#111';

  return (
    <group ref={bodyRef}>
      {/* Giant glow aura */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.6, 16, 16]} />
        <meshBasicMaterial color={isGiant ? '#FF8C00' : '#ffffff'} transparent opacity={0} side={THREE.BackSide} />
      </mesh>

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
        {/* Snout */}
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
          <meshLambertMaterial color={eyeColor} />
        </mesh>
        <mesh position={[0.16, 0.1, 0.22]}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshLambertMaterial color={eyeColor} />
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
        {/* Giant crown */}
        {isGiant && (
          <group position={[0, 0.22, 0]}>
            {[-0.12, 0, 0.12].map((x, i) => (
              <mesh key={i} position={[x, i === 1 ? 0.1 : 0.06, 0]}>
                <coneGeometry args={[0.05, 0.14, 6]} />
                <meshLambertMaterial color="#FFD700" />
              </mesh>
            ))}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.38, 0.07, 0.12]} />
              <meshLambertMaterial color="#FFD700" />
            </mesh>
          </group>
        )}
      </group>

      {/* Legs */}
      {([[-0.28, -0.35, 0.22], [0.28, -0.35, 0.22], [-0.28, -0.35, -0.22], [0.28, -0.35, -0.22]] as [number,number,number][]).map(([x, y, z], i) => (
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
  const velocityY = useRef(0);
  const isOnGround = useRef(true);
  const { camera } = useThree();
  const shootCooldown = useRef(0);
  const actionCooldown = useRef(0);
  const jumpWasPressed = useRef(false);
  const gameTime = useRef(0);

  const {
    phase, setIsInWater, setCurrentAction, energy, collectFood, foodItems,
    addScore, setHappiness, happiness, isInWater, invincibleTimer,
    isGiant, potionItems, collectPotion, addJump,
  } = useGameStore();
  const [localAction, setLocalAction] = useState<string>('idle');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      keys[e.code] = e.type === 'keydown';
      if (e.code === 'Space' && e.type === 'keydown') jumpPressed.current = true;
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
    };
  }, []);

  useFrame((_, dt) => {
    if (phase !== 'playing' || !meshRef.current) return;

    gameTime.current += dt;
    actionCooldown.current = Math.max(0, actionCooldown.current - dt);
    shootCooldown.current = Math.max(0, shootCooldown.current - dt);

    const pos = posRef.current;
    const giant = isGiant;
    const giantSpeed = giant ? 1.6 : 1;

    // --- Rotation: keyboard OR mobile joystick ---
    const joyX = mobileInput.joystickX;
    const joyY = mobileInput.joystickY;
    const rotateKbd = (keys['KeyA'] || keys['ArrowLeft'] ? 1 : 0) - (keys['KeyD'] || keys['ArrowRight'] ? 0 : 0)
                    + (keys['KeyD'] || keys['ArrowRight'] ? -1 : 0);

    if (keys['KeyA'] || keys['ArrowLeft']) rotationRef.current += ROTATION_SPEED * dt;
    if (keys['KeyD'] || keys['ArrowRight']) rotationRef.current -= ROTATION_SPEED * dt;
    if (Math.abs(joyX) > 0.1) rotationRef.current -= joyX * ROTATION_SPEED * dt;

    const fwd = new THREE.Vector3(
      Math.sin(rotationRef.current),
      0,
      Math.cos(rotationRef.current)
    );

    const isRunning = (keys['ShiftLeft'] || keys['ShiftRight'] || mobileInput.run) && energy > 10;
    const inWater = pos.y < 0.15;
    const speed = (inWater ? SWIM_SPEED : isRunning ? RUN_SPEED : SPEED) * giantSpeed;

    // Movement: keyboard + mobile joystick
    const fwdKbd = (keys['KeyW'] || keys['ArrowUp'] ? 1 : 0) - (keys['KeyS'] || keys['ArrowDown'] ? 1 : 0);
    const fwdMobile = joyY;
    const fwdTotal = fwdKbd !== 0 ? fwdKbd : fwdMobile;

    if (fwdTotal > 0.1) pos.addScaledVector(fwd, speed * fwdTotal * dt);
    if (fwdTotal < -0.1) pos.addScaledVector(fwd, speed * fwdTotal * 0.6 * dt);

    // Clamp to world bounds
    pos.x = Math.max(-58, Math.min(58, pos.x));
    pos.z = Math.max(-58, Math.min(58, pos.z));

    // Jump + gravity
    const groundY = getGroundHeight(pos.x, pos.z);
    const wantJump = (jumpPressed.current || mobileInput.jump) && isOnGround.current && !inWater;
    if (wantJump) {
      velocityY.current = JUMP_FORCE;
      isOnGround.current = false;
      addJump();
    }
    jumpPressed.current = false;

    if (!inWater) {
      velocityY.current -= GRAVITY * dt;
      pos.y += velocityY.current * dt;
      if (pos.y <= groundY) {
        pos.y = groundY;
        velocityY.current = 0;
        isOnGround.current = true;
      } else {
        isOnGround.current = false;
      }
    } else {
      // Wave-following buoyancy (capybara-swim water physics)
      const waveY = getWaterHeight(pos.x, pos.z, gameTime.current);
      const waterSurface = waveY - 0.28; // capybara sits slightly submerged
      const targetY = Math.max(groundY, waterSurface);
      // Smooth buoyancy interpolation
      pos.y += (targetY - pos.y) * Math.min(1, dt * 8);
      velocityY.current = 0;
      isOnGround.current = true;
    }

    // Scale giant capybara
    const targetScale = giant ? 2.5 : 1;
    const curScale = meshRef.current.scale.x;
    const newScale = curScale + (targetScale - curScale) * Math.min(1, dt * 4);
    meshRef.current.scale.setScalar(newScale);

    meshRef.current.position.copy(pos);
    meshRef.current.rotation.y = rotationRef.current;

    playerState.position.copy(pos);
    playerState.rotation = rotationRef.current;
    playerState.facing.copy(fwd);

    setIsInWater(inWater);

    // Shooting
    const wantShoot = keys['KeyF'] || (keys['Space'] && !wantJump) || mobileInput.shoot;
    if (wantShoot && shootCooldown.current <= 0) {
      fireBullet();
      shootCooldown.current = 0.3;
    }

    // Action
    const isMoving = Math.abs(fwdTotal) > 0.1 || keys['KeyW'] || keys['ArrowUp'] || keys['KeyS'] || keys['ArrowDown'];
    let action: string = 'idle';
    if (!isOnGround.current && !inWater) {
      action = 'jumping';
    } else if (mobileInput.eat || (keys['KeyE'] && actionCooldown.current <= 0)) {
      action = 'eating';
      actionCooldown.current = 1;
    } else if (mobileInput.sleep || (keys['KeyZ'] && actionCooldown.current <= 0)) {
      action = 'sleeping';
      actionCooldown.current = 2;
    } else if (inWater) {
      action = 'swimming';
    } else if (isMoving) {
      action = isRunning ? 'running' : 'walking';
    }

    setLocalAction(action);
    setCurrentAction(action as any);

    // Food collection
    foodItems.filter(f => !f.collected).forEach(food => {
      const foodPos = new THREE.Vector3(...food.position);
      if (pos.distanceTo(foodPos) < (giant ? 3 : 1.2)) collectFood(food.id);
    });

    // Potion collection
    potionItems.filter(p => !p.collected).forEach(potion => {
      const pp = new THREE.Vector3(...potion.position);
      if (pos.distanceTo(pp) < (giant ? 4 : 1.5)) collectPotion(potion.id);
    });

    // Camera — pull back more for giant
    const camDist = giant ? 20 : 11;
    const camHeight = giant ? 9 : 5;
    const camOffset = new THREE.Vector3(0, camHeight, -camDist);
    camOffset.applyEuler(new THREE.Euler(0, rotationRef.current, 0));
    const targetCamPos = pos.clone().add(camOffset);
    camera.position.lerp(targetCamPos, 0.08);
    camera.lookAt(pos.clone().add(new THREE.Vector3(0, giant ? 2 : 0.8, 0)));
  });

  return (
    <group ref={meshRef}>
      <CapybaraBody action={localAction} isInWater={isInWater} invincible={invincibleTimer > 0} isGiant={isGiant} />
    </group>
  );
}

export function getGroundHeight(x: number, z: number): number {
  // Ponds
  const ponds = [[12, -10, 9], [-20, 15, 7], [30, 25, 6]] as [number, number, number][];
  for (const [px, pz, pr] of ponds) {
    const d = Math.sqrt((x - px) ** 2 + (z - pz) ** 2);
    if (d < pr) return -0.6 + d * 0.06;
  }

  // Biome-based terrain
  const nx = x / 58;
  const nz = z / 58;

  // Mountain biome (NE: x>15, z<-15) — higher terrain
  if (x > 15 && z < -15) {
    const mh = Math.sin(x * 0.2) * Math.cos(z * 0.2) * 2.5 + Math.sin(x * 0.5) * 1.2;
    return Math.max(0, mh);
  }

  // Savanna biome (SW: x<-15, z>15) — gentle rolling
  if (x < -15 && z > 15) {
    const sh = Math.sin(x * 0.12) * Math.cos(z * 0.12) * 0.8;
    return Math.max(-0.2, sh);
  }

  // Desert biome (SE: x>20, z>20) — mostly flat with dunes
  if (x > 20 && z > 20) {
    const dh = Math.sin(x * 0.25 + 1.3) * 0.5 + Math.cos(z * 0.3) * 0.4;
    return Math.max(-0.1, dh);
  }

  // Jungle biome (NW: x<-15, z<-15) — uneven
  if (x < -15 && z < -15) {
    const jh = Math.sin(x * 0.18) * Math.cos(z * 0.18) * 1.0 + Math.sin((x + z) * 0.1) * 0.5;
    return Math.max(-0.1, jh);
  }

  // Central meadow — gentle hills
  const h = Math.sin(x * 0.15) * Math.cos(z * 0.15) * 0.6 + Math.sin(x * 0.3 + 1) * Math.cos(z * 0.25 + 2) * 0.3;
  return Math.max(-0.5, h);
}
