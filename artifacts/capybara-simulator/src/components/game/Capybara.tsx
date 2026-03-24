import { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useGameStore } from '../../store/gameStore';
import { playerState } from './playerState';
import { fireBullet } from './Bullets';
import { mobileInput } from './mobileInput';

const SPEED = 5.5;
const RUN_SPEED = 10;
const SWIM_SPEED = 3.5;
const ROTATION_SPEED = 2.8;
const JUMP_FORCE = 7.0;
const GRAVITY = 20;

const keys: Record<string, boolean> = {};
const jumpPressed = { current: false };

// Pond definitions (must match World.tsx pond positions)
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

// Preload GLB model
useGLTF.preload('/models/capybara_quadruped_walk.glb');

function CapybaraBody({ action, isInWater, invincible, isGiant }: {
  action: string; isInWater: boolean; invincible: boolean; isGiant: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const t = useRef(0);
  const prevAction = useRef('idle');

  // Walk GLB carries both the rigged mesh + walk animation clips
  const { scene: walkScene, animations } = useGLTF('/models/capybara_quadruped_walk.glb');

  // Clone scene once — gives us independent materials we can tint safely
  const walkClone = useMemo(() => {
    const clone = walkScene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = Array.isArray(mesh.material)
          ? mesh.material.map((m: THREE.Material) => m.clone())
          : (mesh.material as THREE.Material).clone();
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    return clone;
  }, [walkScene]);

  // Clip copies so mixer binds to walkClone's bones by name
  const clonedAnims = useMemo(() => animations.map((c) => c.clone()), [animations]);

  const { actions } = useAnimations(clonedAnims, groupRef);

  // Apply color tints based on game state
  const applyTint = (scene: THREE.Object3D, color: string | null) => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mat = (child as THREE.Mesh).material;
        const mats = Array.isArray(mat) ? mat : [mat];
        mats.forEach((m: THREE.Material) => {
          if ((m as THREE.MeshStandardMaterial).color) {
            (m as THREE.MeshStandardMaterial).color.set(color ?? '#8B7355');
          }
        });
      }
    });
  };

  // Sync animation based on action
  useEffect(() => {
    if (Object.keys(actions).length === 0) return;
    const walkKey = Object.keys(actions)[0];
    const anim = actions[walkKey];
    if (!anim) return;

    const isWalking = action === 'walking' || action === 'running';
    const wasWalking = prevAction.current === 'walking' || prevAction.current === 'running';

    if (isWalking) {
      if (!wasWalking) anim.reset();
      anim.play();
      anim.timeScale = action === 'running' ? 2.0 : 1.0;
    } else {
      // Show idle pose — advance walk animation very slowly for gentle sway
      anim.play();
      anim.timeScale = 0.08;
    }
    prevAction.current = action;
  }, [action, actions]);

  // Suppress root motion + animate game-state offsets
  useFrame((_, dt) => {
    t.current += dt;
    if (!groupRef.current) return;

    // Kill any root motion baked into the walk animation clip
    walkClone.position.set(0, 0, 0);

    // Glow pulse for giant mode
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = isGiant ? 0.22 + Math.sin(t.current * 3) * 0.08 : 0;
    }

    // Tint only on change (not every frame) to avoid traversal cost
    const flash = invincible && Math.floor(Date.now() / 120) % 2 === 0;
    const tintColor = isGiant
      ? (flash ? '#FFD700' : '#FF8C00')
      : (flash ? '#FF9999' : null);

    if (tintColor) {
      applyTint(walkClone, tintColor);
    }

    // Swimming offset — bob the entire group
    if (action === 'swimming') {
      groupRef.current.position.y = Math.sin(t.current * 2) * 0.06;
      groupRef.current.rotation.x = Math.sin(t.current * 2) * 0.04;
    } else if (action === 'sleeping') {
      groupRef.current.position.y = -0.08;
      groupRef.current.rotation.x = 0.25;
    } else if (action === 'happy') {
      groupRef.current.position.y = Math.abs(Math.sin(t.current * 5)) * 0.12;
      groupRef.current.rotation.x = 0;
    } else {
      groupRef.current.position.y = 0;
      groupRef.current.rotation.x = 0;
    }
  });

  // Giant crown material
  const crownMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#FFD700', roughness: 0.2, metalness: 0.9, emissive: '#AA6600', emissiveIntensity: 0.25 }),
    []
  );

  // Model scale: GLB is in Blender units (meters). Capybara real ~1.2m long,
  // game body ~1.2 units. Scale to fit nicely.
  const MODEL_SCALE = 0.5;

  return (
    <group ref={groupRef}>
      {/* Giant glow aura */}
      <mesh ref={glowRef} position={[0, 0.5, 0]}>
        <sphereGeometry args={[1.8, 16, 16]} />
        <meshBasicMaterial color={isGiant ? '#FF8C00' : '#ffffff'} transparent opacity={0} side={THREE.BackSide} />
      </mesh>

      {/* GLB walk scene (carries walk animation + rig) */}
      <primitive
        object={walkClone}
        scale={MODEL_SCALE}
        rotation={[0, Math.PI, 0]}
      />

      {/* Subtle water disturbance ring when swimming */}
      {isInWater && (
        <mesh position={[0, -0.14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.42, 0.52, 24]} />
          <meshStandardMaterial color="#A8D8F0" transparent opacity={0.18} roughness={0.05} metalness={0.1} />
        </mesh>
      )}

      {/* Giant crown */}
      {isGiant && (
        <group position={[0, 1.35, 0]}>
          {[-0.14, 0, 0.14].map((x, i) => (
            <mesh key={i} position={[x, i === 1 ? 0.12 : 0.07, 0]} material={crownMat}>
              <coneGeometry args={[0.055, 0.16, 6]} />
            </mesh>
          ))}
          <mesh position={[0, 0, 0]} material={crownMat}>
            <boxGeometry args={[0.42, 0.075, 0.14]} />
          </mesh>
        </group>
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
  const camZoom = useRef(1.0);

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

  // Scroll-to-zoom + pinch-to-zoom
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      camZoom.current = THREE.MathUtils.clamp(camZoom.current + e.deltaY * 0.002, 0.3, 2.5);
    };
    let prevPinchDist = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        prevPinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const d = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
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

    const fwd = new THREE.Vector3(
      Math.sin(rotationRef.current),
      0,
      Math.cos(rotationRef.current)
    );

    const isRunning = (keys['ShiftLeft'] || keys['ShiftRight'] || mobileInput.run) && energy > 10;
    const inWater = isInPond(pos.x, pos.z);
    const speed = (inWater ? SWIM_SPEED : isRunning ? RUN_SPEED : SPEED) * giantSpeed;

    const fwdKbd = (keys['KeyW'] || keys['ArrowUp'] ? 1 : 0) - (keys['KeyS'] || keys['ArrowDown'] ? 1 : 0);
    const fwdMobile = joyY;
    const fwdTotal = fwdKbd !== 0 ? fwdKbd : fwdMobile;

    if (fwdTotal > 0.1) pos.addScaledVector(fwd, speed * fwdTotal * dt);
    if (fwdTotal < -0.1) pos.addScaledVector(fwd, speed * fwdTotal * 0.6 * dt);

    pos.x = Math.max(-58, Math.min(58, pos.x));
    pos.z = Math.max(-58, Math.min(58, pos.z));

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
      const waterSurface = -0.18;
      pos.y += (waterSurface - pos.y) * Math.min(1, dt * 8);
      velocityY.current = 0;
      isOnGround.current = true;
    }

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

    const wantShoot = keys['KeyF'] || (keys['Space'] && !wantJump) || mobileInput.shoot;
    if (wantShoot && shootCooldown.current <= 0) {
      fireBullet();
      shootCooldown.current = 0.3;
    }

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

    foodItems.filter(f => !f.collected).forEach(food => {
      const foodPos = new THREE.Vector3(...food.position);
      if (pos.distanceTo(foodPos) < (giant ? 3 : 1.2)) collectFood(food.id);
    });

    potionItems.filter(p => !p.collected).forEach(potion => {
      const pp = new THREE.Vector3(...potion.position);
      if (pos.distanceTo(pp) < (giant ? 4 : 1.5)) collectPotion(potion.id);
    });

    const zoom = camZoom.current;
    const camDist = (giant ? 20 : 11) * zoom;
    const camHeight = (giant ? 9 : 5) * Math.max(0.5, zoom * 0.8 + 0.2);
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
  for (const [px, pz, pr] of PONDS) {
    const d = Math.sqrt((x - px) ** 2 + (z - pz) ** 2);
    if (d < pr) return -0.5;
  }
  return 0;
}
