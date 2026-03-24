import { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { playerState } from './playerState';

// ─── Track geometry constants ────────────────────────────────────────────────
const CX = 10, CZ = -38;        // oval centre in world space
const RX = 30, RZ = 18;         // semi-axes — bigger oval (1.6× longer track)
const ROAD_W = 12;               // track width in units
const SEGMENTS = 80;
const START_T = 0;               // t parameter at start/finish line
const START_POS = new THREE.Vector3(CX + RX, 0, CZ); // [40, 0, -38]

// ─── Helpers ─────────────────────────────────────────────────────────────────
function trackPos(t: number, y = 0.15): THREE.Vector3 {
  return new THREE.Vector3(CX + Math.cos(t) * RX, y, CZ + Math.sin(t) * RZ);
}

function trackFacing(t: number): number {
  return Math.atan2(-RX * Math.sin(t), RZ * Math.cos(t));
}

function trackLateral(t: number): THREE.Vector3 {
  return new THREE.Vector3(-RZ * Math.cos(t), 0, -RX * Math.sin(t)).normalize();
}

function racerWorldPos(t: number, laneOffset: number): THREE.Vector3 {
  const base = trackPos(t, 0.3);
  if (laneOffset === 0) return base;
  return base.addScaledVector(trackLateral(t), laneOffset);
}

// ─── Kart mesh ───────────────────────────────────────────────────────────────
function Kart({ position, facing, color, label }: {
  position: THREE.Vector3; facing: number; color: string; label: string;
}) {
  const grp = useRef<THREE.Group>(null!);
  useFrame(() => {
    if (!grp.current) return;
    grp.current.position.copy(position);
    grp.current.rotation.y = facing;
  });
  return (
    <group ref={grp}>
      {/* Chassis */}
      <mesh castShadow position={[0, 0.22, 0]}>
        <boxGeometry args={[0.9, 0.28, 1.55]} />
        <meshStandardMaterial roughness={0.8} metalness={0.05} color={color} />
      </mesh>
      {/* Cockpit bump */}
      <mesh castShadow position={[0, 0.44, 0.1]}>
        <boxGeometry args={[0.58, 0.22, 0.7]} />
        <meshStandardMaterial roughness={0.8} metalness={0.05} color={color} />
      </mesh>
      {/* Rider head */}
      <mesh castShadow position={[0, 0.7, 0.1]}>
        <boxGeometry args={[0.38, 0.28, 0.32]} />
        <meshStandardMaterial roughness={0.8} metalness={0.05} color="#8B6914" />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.1, 0.75, 0.27]}><sphereGeometry args={[0.05, 6, 6]} /><meshStandardMaterial roughness={0.8} metalness={0.05} color="#111" /></mesh>
      <mesh position={[0.1, 0.75, 0.27]}><sphereGeometry args={[0.05, 6, 6]} /><meshStandardMaterial roughness={0.8} metalness={0.05} color="#111" /></mesh>
      {/* Wheels */}
      {([[-0.5, 0.15, 0.5], [0.5, 0.15, 0.5], [-0.5, 0.15, -0.5], [0.5, 0.15, -0.5]] as [number,number,number][]).map(([x,y,z], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.18, 12]} />
          <meshStandardMaterial roughness={0.8} metalness={0.05} color="#222" />
        </mesh>
      ))}
      {/* Name label above */}
      <mesh position={[0, 1.2, 0]} rotation={[0, 0, 0]}>
        <planeGeometry args={[1.0, 0.28]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

// ─── Static track world object ────────────────────────────────────────────────
function TrackWorld({ isDark }: { isDark: boolean }) {
  const roadColor = isDark ? '#1a1a1a' : '#2b2b2b';
  const barrierR = '#CC2222';
  const barrierW = '#EEEEEE';

  const segments = useMemo(() => {
    const out = [];
    const circ = 2 * Math.PI * Math.sqrt((RX * RX + RZ * RZ) / 2);
    const segLen = (circ / SEGMENTS) * 1.12;
    for (let i = 0; i < SEGMENTS; i++) {
      const t = (i / SEGMENTS) * Math.PI * 2;
      const pos = trackPos(t);
      const facing = trackFacing(t);
      const isStart = i < 3;
      out.push({ t, pos, facing, segLen, isStart });
    }
    return out;
  }, []);

  return (
    <group>
      {/* ── Road tiles ── */}
      {segments.map(({ pos, facing, segLen, isStart }, i) => (
        <group key={i}>
          {/* Base asphalt */}
          <mesh position={[pos.x, 0.04, pos.z]} rotation={[0, facing, 0]} receiveShadow>
            <boxGeometry args={[ROAD_W, 0.08, segLen]} />
            <meshStandardMaterial roughness={0.8} metalness={0.05} color={isStart ? (i % 2 === 0 ? '#111' : '#eee') : (i % 6 < 3 ? roadColor : '#242424')} />
          </mesh>
          {/* Center white dash */}
          {i % 4 === 0 && (
            <mesh position={[pos.x, 0.1, pos.z]} rotation={[0, facing, 0]}>
              <boxGeometry args={[0.12, 0.02, segLen * 0.55]} />
              <meshBasicMaterial color="white" />
            </mesh>
          )}
        </group>
      ))}

      {/* ── Barriers ── */}
      {segments.map(({ t, pos }, i) => {
        const lat = trackLateral(t);
        const inner = pos.clone().addScaledVector(lat, ROAD_W / 2 + 0.3);
        const outer = pos.clone().addScaledVector(lat, -(ROAD_W / 2 + 0.3));
        const bColor = i % 2 === 0 ? barrierR : barrierW;
        return (
          <group key={i}>
            <mesh position={[inner.x, 0.3, inner.z]} castShadow>
              <cylinderGeometry args={[0.15, 0.15, 0.55, 6]} />
              <meshStandardMaterial roughness={0.8} metalness={0.05} color={bColor} />
            </mesh>
            <mesh position={[outer.x, 0.3, outer.z]} castShadow>
              <cylinderGeometry args={[0.15, 0.15, 0.55, 6]} />
              <meshStandardMaterial roughness={0.8} metalness={0.05} color={bColor} />
            </mesh>
          </group>
        );
      })}

      {/* ── Start/Finish arch ── */}
      <group position={[CX + RX + 0.5, 0, CZ]}>
        {/* Left pillar */}
        <mesh position={[-ROAD_W / 2 - 0.4, 2, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.35, 4, 8]} />
          <meshStandardMaterial roughness={0.8} metalness={0.05} color="#FFD700" />
        </mesh>
        {/* Right pillar */}
        <mesh position={[ROAD_W / 2 + 0.4, 2, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.35, 4, 8]} />
          <meshStandardMaterial roughness={0.8} metalness={0.05} color="#FFD700" />
        </mesh>
        {/* Crossbar */}
        <mesh position={[0, 4.2, 0]} castShadow>
          <boxGeometry args={[ROAD_W + 2.2, 0.5, 0.5]} />
          <meshStandardMaterial roughness={0.8} metalness={0.05} color="#FFD700" />
        </mesh>
        {/* Chequered banner */}
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={i} position={[-3.5 + i, 3.7, 0]} castShadow>
            <boxGeometry args={[1, 0.55, 0.08]} />
            <meshStandardMaterial roughness={0.8} metalness={0.05} color={i % 2 === 0 ? '#000' : '#fff'} />
          </mesh>
        ))}
      </group>

      {/* ── Entry sign pointing from open world ── */}
      <group position={[CX + RX + 4.5, 0, CZ + 6]}>
        <mesh position={[0, 3, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.18, 6, 8]} />
          <meshStandardMaterial roughness={0.8} metalness={0.05} color="#8B6914" />
        </mesh>
        <mesh position={[0, 6.4, 0]} castShadow>
          <boxGeometry args={[4.2, 1.4, 0.2]} />
          <meshStandardMaterial roughness={0.8} metalness={0.05} color="#FF4500" />
        </mesh>
        <mesh position={[0, 5.6, 0]}>
          <boxGeometry args={[4.2, 0.3, 0.15]} />
          <meshStandardMaterial roughness={0.8} metalness={0.05} color="#222" />
        </mesh>
      </group>

      {/* ── Grandstands (inside oval to stay within world bounds) ── */}
      {[
        [CX, -4, CZ, '#4444BB'],
        [CX - 10, -4, CZ + 5, '#BB4444'],
        [CX + 10, -4, CZ + 5, '#44BB44'],
      ].map(([x, _y, z, color], i) => (
        <group key={i} position={[x as number, 0, z as number]}>
          {/* Bleachers base */}
          <mesh position={[0, 1, 0]} castShadow>
            <boxGeometry args={[7, 2, 4]} />
            <meshStandardMaterial roughness={0.8} metalness={0.05} color={color as string} />
          </mesh>
          {/* Upper tier */}
          <mesh position={[0, 2.8, -0.8]} castShadow>
            <boxGeometry args={[7, 1.4, 2.4]} />
            <meshStandardMaterial roughness={0.8} metalness={0.05} color={color as string} />
          </mesh>
          {/* Roof */}
          <mesh position={[0, 3.8, -0.4]} rotation={[0.18, 0, 0]} castShadow>
            <boxGeometry args={[7.4, 0.2, 3.5]} />
            <meshStandardMaterial roughness={0.8} metalness={0.05} color="#ccc" />
          </mesh>
        </group>
      ))}

      {/* ── Pit lane area ── */}
      <mesh position={[CX + RX + 2.5, 0.04, CZ + 6]} receiveShadow>
        <boxGeometry args={[5, 0.06, 12]} />
        <meshStandardMaterial roughness={0.8} metalness={0.05} color="#444" />
      </mesh>
      <mesh position={[CX + RX + 5, 1.5, CZ + 6]} castShadow>
        <boxGeometry args={[0.2, 3, 12]} />
        <meshStandardMaterial roughness={0.8} metalness={0.05} color="#888" />
      </mesh>
      <mesh position={[CX + RX + 5.1, 3, CZ + 6]} rotation={[0, 0, 0.2]} castShadow>
        <boxGeometry args={[5, 0.15, 12.5]} />
        <meshStandardMaterial roughness={0.8} metalness={0.05} color="#666" />
      </mesh>
    </group>
  );
}

// ─── Race gameplay ─────────────────────────────────────────────────────────────
const PLAYER_BASE_SPEED = 0.28;  // scaled for bigger oval
const AI_CONFIGS = [
  { color: '#FF3333', label: 'RED', lane: 2.2,  baseSpeed: 0.24 },
  { color: '#3366FF', label: 'BLU', lane: -2.2, baseSpeed: 0.27 },
  { color: '#22BB44', label: 'GRN', lane: 4.4,  baseSpeed: 0.25 },
];
const POINTS = [500, 300, 150, 50];
const MEDAL = ['🥇', '🥈', '🥉', '💀'];

const raceKeys: Record<string, boolean> = {};

function RaceGameplay() {
  const { camera } = useThree();
  const { racePhase, beginRacing, finishRace, setRacePosition } = useGameStore();

  const playerT = useRef(0);
  const playerLane = useRef(0);
  const playerSpeed = useRef(PLAYER_BASE_SPEED);
  const countdown = useRef(3.0);
  const raceTimer = useRef(0);
  const finished = useRef(false);
  const aiTs = useRef(AI_CONFIGS.map(() => 0));
  const aiSpeeds = useRef(AI_CONFIGS.map(a => a.baseSpeed + (Math.random() - 0.5) * 0.04));
  const finishOrder = useRef<number[]>([]);

  // Track racer positions for rendering
  const [renderTick, setRenderTick] = useState(0);
  const playerPos = useRef(racerWorldPos(0, 0));
  const playerFacing = useRef(0);
  const aiPositions = useRef(AI_CONFIGS.map((a, i) => racerWorldPos(0, a.lane)));
  const aiRotations = useRef(AI_CONFIGS.map(() => 0));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { raceKeys[e.code] = e.type === 'keydown'; };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
    };
  }, []);

  // Reset on race start
  useEffect(() => {
    if (racePhase === 'countdown') {
      playerT.current = START_T;
      playerLane.current = 0;
      playerSpeed.current = PLAYER_BASE_SPEED;
      countdown.current = 3.0;
      raceTimer.current = 0;
      finished.current = false;
      finishOrder.current = [];
      aiTs.current = AI_CONFIGS.map(() => START_T);
      aiSpeeds.current = AI_CONFIGS.map(a => a.baseSpeed + (Math.random() - 0.5) * 0.04);
    }
  }, [racePhase]);

  useFrame((_, dt) => {
    if (racePhase !== 'countdown' && racePhase !== 'racing') return;
    if (finished.current) return;

    // ─ Countdown phase ─
    if (racePhase === 'countdown') {
      countdown.current -= dt;
      if (countdown.current <= 0) {
        beginRacing();
      }
      // Position all racers at start staggered
      playerPos.current.copy(racerWorldPos(START_T, 0));
      playerFacing.current = trackFacing(START_T);
      aiPositions.current = AI_CONFIGS.map((a, i) => racerWorldPos(START_T - i * 0.05, a.lane));
      setRenderTick(r => r + 1);
    }

    if (racePhase !== 'racing') return;
    raceTimer.current += dt;

    // ─ Player movement ─
    const accel = raceKeys['KeyW'] || raceKeys['ArrowUp'] ? 0.06 : raceKeys['KeyS'] || raceKeys['ArrowDown'] ? -0.08 : -0.01;
    playerSpeed.current = THREE.MathUtils.clamp(
      playerSpeed.current + accel * dt * 60,
      0.12, 0.62
    );
    if (raceKeys['KeyA'] || raceKeys['ArrowLeft']) playerLane.current = Math.max(-4.4, playerLane.current - 4 * dt);
    if (raceKeys['KeyD'] || raceKeys['ArrowRight']) playerLane.current = Math.min(4.4, playerLane.current + 4 * dt);

    playerT.current += playerSpeed.current * dt;

    // ─ AI movement (with rubber-banding) ─
    const playerProgress = playerT.current;
    aiTs.current = aiTs.current.map((t, i) => {
      const gap = playerProgress - t;
      const rubber = gap > 0.3 ? 0.04 : gap < -0.3 ? -0.02 : 0;
      return t + (aiSpeeds.current[i] + rubber) * dt;
    });

    // ─ Position updates ─
    playerPos.current.copy(racerWorldPos(playerT.current, playerLane.current));
    playerFacing.current = trackFacing(playerT.current);
    aiTs.current.forEach((t, i) => {
      aiPositions.current[i].copy(racerWorldPos(t, AI_CONFIGS[i].lane));
      aiRotations.current[i] = trackFacing(t);
    });

    // ─ Finish detection (one full lap = 2π) ─
    const LAP = Math.PI * 2;
    aiTs.current.forEach((t, i) => {
      if (t >= LAP && !finishOrder.current.includes(-(i + 1))) {
        finishOrder.current.push(-(i + 1));
      }
    });
    if (playerT.current >= LAP && !finished.current) {
      finished.current = true;
      const aiAhead = aiTs.current.filter(t => t > playerT.current).length;
      finishRace(aiAhead + 1);
    }

    // ─ Live position tracking ─
    const aiAhead = aiTs.current.filter(t => t > playerT.current).length;
    setRacePosition(aiAhead + 1);

    // ─ Camera: behind-the-kart racing view ─
    const facing = playerFacing.current;
    const camOffset = new THREE.Vector3(
      -Math.sin(facing) * 10,
      4.5,
      -Math.cos(facing) * 10
    );
    const lookAt = playerPos.current.clone().add(
      new THREE.Vector3(Math.sin(facing) * 6, 0.8, Math.cos(facing) * 6)
    );
    camera.position.lerp(playerPos.current.clone().add(camOffset), 0.12);
    camera.lookAt(lookAt);

    setRenderTick(r => r + 1);
  });

  if (racePhase !== 'countdown' && racePhase !== 'racing') return null;

  return (
    <>
      {/* Player kart */}
      <Kart
        position={playerPos.current}
        facing={playerFacing.current}
        color="#FF8C00"
        label="YOU"
      />
      {/* AI karts */}
      {AI_CONFIGS.map((ai, i) => (
        <Kart
          key={i}
          position={aiPositions.current[i]}
          facing={aiRotations.current[i]}
          color={ai.color}
          label={ai.label}
        />
      ))}
    </>
  );
}

// ─── Proximity trigger ────────────────────────────────────────────────────────
function ProximityTrigger() {
  const { phase, racePhase, setRacePrompt, startRace } = useGameStore();
  const wasNear = useRef(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Enter' && racePhase === 'prompt') startRace();
    };
    const onClick = () => {
      if (racePhase === 'prompt') startRace();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onClick);
    };
  }, [racePhase, startRace]);

  useFrame(() => {
    if (phase !== 'playing') return;
    if (racePhase !== 'none' && racePhase !== 'prompt') return;
    const dist = playerState.position.distanceTo(START_POS);
    const near = dist < 7;
    if (near !== wasNear.current) {
      wasNear.current = near;
      setRacePrompt(near);
    }
  });

  return null;
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function RaceTrack() {
  const { phase, timeOfDay } = useGameStore();
  const isDark = timeOfDay < 6 || timeOfDay > 20;

  if (phase !== 'playing') return null;

  return (
    <>
      <TrackWorld isDark={isDark} />
      <ProximityTrigger />
      <RaceGameplay />
    </>
  );
}
