import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { playerState } from './playerState';
import { fireBullet } from './Bullets';
import { mobileInput } from './mobileInput';

const SPEED = 5.5;
const RUN_SPEED = 10;
const SWIM_SPEED = 3.5;
const ROTATION_SPEED = 1.8;    // was 2.8 — slower, more precise turns
const ROT_SMOOTH = 14;          // lerp factor for visual rotation — eliminates skipping
const JUMP_FORCE = 7.0;
const GRAVITY = 20;

const keys: Record<string, boolean> = {};
const jumpPressed = { current: false };

const PONDS: [number, number, number][] = [
  [12, -10, 9],
  [-20, 15, 7],
  [30, 25, 6],
];

function isInPond(x: number, z: number): boolean {
  for (const [px, pz, pr] of PONDS) {
    if ((x - px) * (x - px) + (z - pz) * (z - pz) < pr * pr) return true;
  }
  return false;
}

function CapybaraBody({ action, isInWater, invincible, isGiant }: {
  action: string; isInWater: boolean; invincible: boolean; isGiant: boolean;
}) {
  const bodyRef = useRef<THREE.Group>(null!);
  const tailRef = useRef<THREE.Mesh>(null!);
  const legRefs = [useRef<THREE.Mesh>(null!), useRef<THREE.Mesh>(null!), useRef<THREE.Mesh>(null!), useRef<THREE.Mesh>(null!)];
  const earRef = useRef<THREE.Mesh>(null!);
  const mouthRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const t = useRef(0);

  useFrame((_, dt) => {
    t.current += dt;
    const time = t.current;
    if (!bodyRef.current) return;

    if (action === 'walking' || action === 'running') {
      const sp = action === 'running' ? 8 : 4;
      bodyRef.current.position.y = Math.sin(time * sp) * 0.05;
      legRefs.forEach((leg, i) => {
        if (leg.current) leg.current.rotation.x = Math.sin(time * sp + i * Math.PI) * 0.45;
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
  const bodyColor = isGiant ? (flash ? '#FFD700' : '#FF8C00') : (flash ? '#FF9999' : '#8B6914');
  const darkColor = isGiant ? '#CC6600' : (flash ? '#CC4444' : '#6B4F0F');
  const noseColor = '#5C3A1E';
  const eyeColor  = isGiant ? '#FF4400' : '#111111';
  const bodyRough = isInWater ? 0.45 : 0.82;
  const crownMat = new THREE.MeshStandardMaterial({ color: '#FFD700', roughness: 0.25, metalness: 0.85, emissive: '#AA7700', emissiveIntensity: 0.2 });

  return (
    <group ref={bodyRef}>
      {/* Glow aura */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.6, 12, 12]} />
        <meshBasicMaterial color={isGiant ? '#FF8C00' : '#ffffff'} transparent opacity={0} side={THREE.BackSide} />
      </mesh>

      {/* Body */}
      <mesh castShadow>
        <capsuleGeometry args={[0.38, 0.75, 6, 12]} />
        <meshStandardMaterial color={bodyColor} roughness={bodyRough} metalness={0.02} />
      </mesh>

      {/* Head */}
      <group position={[0, 0.28, 0.62]}>
        <mesh castShadow>
          <boxGeometry args={[0.54, 0.42, 0.52]} />
          <meshStandardMaterial color={bodyColor} roughness={bodyRough} metalness={0.02} />
        </mesh>
        {/* Snout */}
        <mesh position={[0, -0.05, 0.24]} castShadow>
          <boxGeometry args={[0.38, 0.24, 0.12]} />
          <meshStandardMaterial color={darkColor} roughness={0.85} metalness={0.02} />
        </mesh>
        {/* Nostrils */}
        {([-0.09, 0.09] as number[]).map((x, i) => (
          <mesh key={i} position={[x, -0.04, 0.3]}>
            <sphereGeometry args={[0.04, 6, 6]} />
            <meshStandardMaterial color={noseColor} roughness={0.7} metalness={0.05} />
          </mesh>
        ))}
        {/* Eyes */}
        {([-0.17, 0.17] as number[]).map((x, i) => (
          <group key={i}>
            <mesh position={[x, 0.12, 0.24]}>
              <sphereGeometry args={[0.058, 7, 7]} />
              <meshStandardMaterial color={eyeColor} roughness={0.05} metalness={0.15} />
            </mesh>
            <mesh position={[x + (x > 0 ? 0.02 : -0.02), 0.135, 0.275]}>
              <sphereGeometry args={[0.018, 5, 5]} />
              <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
            </mesh>
          </group>
        ))}
        {/* Ears */}
        <mesh ref={earRef} position={[-0.22, 0.26, -0.06]} rotation={[0, 0, -0.3]} castShadow>
          <capsuleGeometry args={[0.075, 0.1, 4, 7]} />
          <meshStandardMaterial color={darkColor} roughness={0.88} metalness={0.01} />
        </mesh>
        <mesh position={[0.22, 0.26, -0.06]} rotation={[0, 0, 0.3]} castShadow>
          <capsuleGeometry args={[0.075, 0.1, 4, 7]} />
          <meshStandardMaterial color={darkColor} roughness={0.88} metalness={0.01} />
        </mesh>
        {/* Mouth */}
        <mesh ref={mouthRef} position={[0, -0.13, 0.27]}>
          <boxGeometry args={[0.16, 0.03, 0.05]} />
          <meshStandardMaterial color={noseColor} roughness={0.7} metalness={0.02} />
        </mesh>
        {/* Crown */}
        {isGiant && (
          <group position={[0, 0.24, 0]}>
            {([-0.13, 0, 0.13] as number[]).map((x, i) => (
              <mesh key={i} position={[x, i === 1 ? 0.11 : 0.07, 0]} material={crownMat}>
                <coneGeometry args={[0.055, 0.15, 6]} />
              </mesh>
            ))}
            <mesh material={crownMat}><boxGeometry args={[0.4, 0.075, 0.13]} /></mesh>
          </group>
        )}
      </group>

      {/* Legs */}
      {([[-0.3, -0.38, 0.26], [0.3, -0.38, 0.26], [-0.3, -0.38, -0.26], [0.3, -0.38, -0.26]] as [number,number,number][]).map(([x, y, z], i) => (
        <mesh key={i} ref={legRefs[i]} position={[x, y, z]} castShadow>
          <capsuleGeometry args={[0.095, 0.24, 4, 7]} />
          <meshStandardMaterial color={darkColor} roughness={0.88} metalness={0.01} />
        </mesh>
      ))}

      {/* Tail */}
      <mesh ref={tailRef} position={[0, 0.12, -0.62]} rotation={[0.3, 0, 0]} castShadow>
        <capsuleGeometry args={[0.055, 0.11, 4, 7]} />
        <meshStandardMaterial color={darkColor} roughness={0.88} metalness={0.01} />
      </mesh>

      {/* Water ripple */}
      {isInWater && (
        <mesh position={[0, -0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.44, 0.54, 20]} />
          <meshStandardMaterial color="#A8D8F0" transparent opacity={0.18} roughness={0.05} />
        </mesh>
      )}
    </group>
  );
}

export function Capybara() {
  const meshRef = useRef<THREE.Group>(null!);
  const rotationRef = useRef(0);       // input target angle (updated instantly)
  const displayRotRef = useRef(0);     // visual angle (lerped — no skipping)
  const posRef = useRef(new THREE.Vector3(0, 0.4, 0));
  const velocityY = useRef(0);
  const isOnGround = useRef(true);
  const { camera } = useThree();
  const shootCooldown = useRef(0);
  const actionCooldown = useRef(0);
  const camZoom = useRef(1.0);

  const {
    phase, setIsInWater, setCurrentAction, energy, collectFood, foodItems,
    isInWater, invincibleTimer, isGiant, potionItems, collectPotion, addJump,
  } = useGameStore();
  const [localAction, setLocalAction] = useState<string>('idle');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      keys[e.code] = e.type === 'keydown';
      if (e.code === 'Space' && e.type === 'keydown') jumpPressed.current = true;
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey); };
  }, []);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      camZoom.current = THREE.MathUtils.clamp(camZoom.current + e.deltaY * 0.002, 0.3, 2.5);
    };
    let prevPinchDist = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) prevPinchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        camZoom.current = THREE.MathUtils.clamp(camZoom.current - (d - prevPinchDist) * 0.005, 0.3, 2.5);
        prevPinchDist = d;
      }
    };
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  useFrame((_, dt) => {
    if (phase !== 'playing' || !meshRef.current) return;
    actionCooldown.current = Math.max(0, actionCooldown.current - dt);
    shootCooldown.current = Math.max(0, shootCooldown.current - dt);

    const pos = posRef.current;
    const giant = isGiant;
    const giantSpeed = giant ? 1.6 : 1;

    const joyX = mobileInput.joystickX;
    const joyY = mobileInput.joystickY;
    if (keys['KeyA'] || keys['ArrowLeft']) rotationRef.current += ROTATION_SPEED * dt;
    if (keys['KeyD'] || keys['ArrowRight']) rotationRef.current -= ROTATION_SPEED * dt;
    if (Math.abs(joyX) > 0.1) rotationRef.current -= joyX * ROTATION_SPEED * dt;

    const fwd = new THREE.Vector3(Math.sin(displayRotRef.current), 0, Math.cos(displayRotRef.current));
    const isRunning = (keys['ShiftLeft'] || keys['ShiftRight'] || mobileInput.run) && energy > 10;
    const inWater = isInPond(pos.x, pos.z);
    const speed = (inWater ? SWIM_SPEED : isRunning ? RUN_SPEED : SPEED) * giantSpeed;

    const fwdKbd = (keys['KeyW'] || keys['ArrowUp'] ? 1 : 0) - (keys['KeyS'] || keys['ArrowDown'] ? 1 : 0);
    const fwdTotal = fwdKbd !== 0 ? fwdKbd : joyY;
    if (fwdTotal > 0.1) pos.addScaledVector(fwd, speed * fwdTotal * dt);
    if (fwdTotal < -0.1) pos.addScaledVector(fwd, speed * fwdTotal * 0.6 * dt);
    pos.x = Math.max(-58, Math.min(58, pos.x));
    pos.z = Math.max(-58, Math.min(58, pos.z));

    const groundY = getGroundHeight(pos.x, pos.z);
    const wantJump = (jumpPressed.current || mobileInput.jump) && isOnGround.current && !inWater;
    if (wantJump) { velocityY.current = JUMP_FORCE; isOnGround.current = false; addJump(); }
    jumpPressed.current = false;

    if (!inWater) {
      velocityY.current -= GRAVITY * dt;
      pos.y += velocityY.current * dt;
      if (pos.y <= groundY) { pos.y = groundY; velocityY.current = 0; isOnGround.current = true; }
      else { isOnGround.current = false; }
    } else {
      pos.y += (-0.18 - pos.y) * Math.min(1, dt * 8);
      velocityY.current = 0;
      isOnGround.current = true;
    }

    const targetScale = giant ? 2.5 : 1;
    const newScale = meshRef.current.scale.x + (targetScale - meshRef.current.scale.x) * Math.min(1, dt * 4);
    meshRef.current.scale.setScalar(newScale);
    // Smooth the visual rotation — lerp toward input target to eliminate angle skipping
    const rotDiff = ((rotationRef.current - displayRotRef.current + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    displayRotRef.current += rotDiff * Math.min(1, dt * ROT_SMOOTH);

    meshRef.current.position.copy(pos);
    meshRef.current.rotation.y = displayRotRef.current;

    playerState.position.copy(pos);
    playerState.rotation = displayRotRef.current;
    playerState.facing.copy(fwd);
    setIsInWater(inWater);

    if ((keys['KeyF'] || mobileInput.shoot) && shootCooldown.current <= 0) {
      fireBullet(); shootCooldown.current = 0.3;
    }

    const isMoving = Math.abs(fwdTotal) > 0.1;
    let action = 'idle';
    if (!isOnGround.current && !inWater) action = 'jumping';
    else if (mobileInput.eat || (keys['KeyE'] && actionCooldown.current <= 0)) { action = 'eating'; actionCooldown.current = 1; }
    else if (mobileInput.sleep || (keys['KeyZ'] && actionCooldown.current <= 0)) { action = 'sleeping'; actionCooldown.current = 2; }
    else if (inWater) action = 'swimming';
    else if (isMoving) action = isRunning ? 'running' : 'walking';

    setLocalAction(action);
    setCurrentAction(action as any);

    foodItems.filter(f => !f.collected).forEach(food => {
      if (pos.distanceTo(new THREE.Vector3(...food.position)) < (giant ? 3 : 1.2)) collectFood(food.id);
    });
    potionItems.filter(p => !p.collected).forEach(potion => {
      if (pos.distanceTo(new THREE.Vector3(...potion.position)) < (giant ? 4 : 1.5)) collectPotion(potion.id);
    });

    const zoom = camZoom.current;
    const camDist = (giant ? 20 : 11) * zoom;
    const camHeight = (giant ? 9 : 5) * Math.max(0.5, zoom * 0.8 + 0.2);
    const camOffset = new THREE.Vector3(0, camHeight, -camDist);
    camOffset.applyEuler(new THREE.Euler(0, displayRotRef.current, 0));
    camera.position.lerp(pos.clone().add(camOffset), 0.08);
    camera.lookAt(pos.clone().add(new THREE.Vector3(0, giant ? 2 : 0.8, 0)));
  });

  return (
    <group ref={meshRef}>
      <CapybaraBody action={localAction} isInWater={isInWater} invincible={invincibleTimer > 0} isGiant={isGiant} />
    </group>
  );
}

export function getGroundHeight(x: number, z: number): number {
  for (const [px, pz, pr] of PONDS) {
    if (Math.sqrt((x - px) ** 2 + (z - pz) ** 2) < pr) return -0.5;
  }
  return 0;
}
