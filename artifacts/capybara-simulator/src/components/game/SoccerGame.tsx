/**
 * SoccerGame — 5v5 capybara soccer (1 player + 4 AI vs 4 AI)
 * Field at world position (-42, 0, 2), 30×20m.
 * Player pushes the ball by walking into it. AI capybaras chase and kick.
 */
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { playerState } from './playerState';

// ── Field constants ──────────────────────────────────────────────────────────
export const SOCCER_CX = -42;
export const SOCCER_CZ = 2;
const HW = 15;   // half-width (X axis)
const HD = 10;   // half-depth (Z axis)
const GOAL_HW = 3.5; // half goal width (Z)
const GOAL_DEPTH = 2;
const FIELD_L = SOCCER_CX - HW;  // left end  (-57)
const FIELD_R = SOCCER_CX + HW;  // right end (-27)
const FIELD_B = SOCCER_CZ - HD;  // back edge (-8)
const FIELD_F = SOCCER_CZ + HD;  // front edge (12)

// ── AI player data ───────────────────────────────────────────────────────────
interface AiPlayer {
  x: number; z: number;
  vx: number; vz: number;
  team: 'ally' | 'enemy'; // ally = same team as player, enemy = opposite
  id: number;
}

// ── Simplified capybara mesh for AI players ──────────────────────────────────
function AiCapybara({ pos, team }: { pos: [number, number, number]; team: 'ally' | 'enemy' }) {
  const bodyColor = team === 'ally' ? '#7CB87C' : '#B87C7C';
  const darkColor = team === 'ally' ? '#4A6B4A' : '#6B4A4A';
  const collarColor = team === 'ally' ? '#22CC44' : '#CC2244';
  return (
    <group position={pos}>
      <mesh castShadow>
        <capsuleGeometry args={[0.32, 0.6, 6, 12]} />
        <meshStandardMaterial color={bodyColor} roughness={0.85} metalness={0.02} />
      </mesh>
      <group position={[0, 0.22, 0.5]}>
        <mesh castShadow>
          <boxGeometry args={[0.44, 0.32, 0.42]} />
          <meshStandardMaterial color={bodyColor} roughness={0.85} metalness={0.02} />
        </mesh>
        <mesh position={[-0.14, 0.08, 0.2]}>
          <sphereGeometry args={[0.05, 6, 6]} />
          <meshStandardMaterial color={darkColor} roughness={0.05} metalness={0.1} />
        </mesh>
        <mesh position={[0.14, 0.08, 0.2]}>
          <sphereGeometry args={[0.05, 6, 6]} />
          <meshStandardMaterial color={darkColor} roughness={0.05} metalness={0.1} />
        </mesh>
      </group>
      <mesh position={[0, -0.28, 0]}>
        <torusGeometry args={[0.38, 0.06, 6, 16]} />
        <meshStandardMaterial color={collarColor} roughness={0.4} metalness={0.3} emissive={collarColor} emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

// ── Goal posts ────────────────────────────────────────────────────────────────
function GoalPosts({ x, flip }: { x: number; flip: boolean }) {
  const color = flip ? '#22CC44' : '#CC2244'; // ally goal = green, enemy goal = red
  const postMat = new THREE.MeshStandardMaterial({ color: 'white', roughness: 0.5, metalness: 0.4 });
  const netMat = new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
  const dir = flip ? 1 : -1;
  return (
    <group>
      {/* Left post */}
      <mesh position={[x, 1.5, SOCCER_CZ - GOAL_HW]} material={postMat}>
        <cylinderGeometry args={[0.1, 0.1, 3, 8]} />
      </mesh>
      {/* Right post */}
      <mesh position={[x, 1.5, SOCCER_CZ + GOAL_HW]} material={postMat}>
        <cylinderGeometry args={[0.1, 0.1, 3, 8]} />
      </mesh>
      {/* Crossbar */}
      <mesh position={[x, 3, SOCCER_CZ]} rotation={[Math.PI / 2, 0, 0]} material={postMat}>
        <cylinderGeometry args={[0.08, 0.08, GOAL_HW * 2, 8]} />
      </mesh>
      {/* Back bar */}
      <mesh position={[x + dir * GOAL_DEPTH, 1.5, SOCCER_CZ - GOAL_HW]} material={postMat}>
        <cylinderGeometry args={[0.07, 0.07, 3, 6]} />
      </mesh>
      <mesh position={[x + dir * GOAL_DEPTH, 1.5, SOCCER_CZ + GOAL_HW]} material={postMat}>
        <cylinderGeometry args={[0.07, 0.07, 3, 6]} />
      </mesh>
      {/* Net */}
      <mesh position={[x + dir * GOAL_DEPTH * 0.5, 1.5, SOCCER_CZ]} material={netMat}>
        <boxGeometry args={[GOAL_DEPTH, 3, GOAL_HW * 2]} />
      </mesh>
    </group>
  );
}

// ── Main SoccerGame component ─────────────────────────────────────────────────
export function SoccerGame() {
  const { soccerPhase, scoreSoccerGoal, tickSoccer, endSoccer } = useGameStore();

  // Ball physics (ref — no re-renders)
  const ball = useRef({ x: SOCCER_CX, z: SOCCER_CZ, vx: 0, vz: 0 });
  const ballMeshRef = useRef<THREE.Group>(null!);

  // AI players (ref — no re-renders)
  const aiPlayers = useRef<AiPlayer[]>([
    { x: SOCCER_CX - 8, z: SOCCER_CZ - 4, vx: 0, vz: 0, team: 'ally', id: 0 },
    { x: SOCCER_CX - 6, z: SOCCER_CZ + 4, vx: 0, vz: 0, team: 'ally', id: 1 },
    { x: SOCCER_CX + 8, z: SOCCER_CZ - 4, vx: 0, vz: 0, team: 'enemy', id: 2 },
    { x: SOCCER_CX + 6, z: SOCCER_CZ + 4, vx: 0, vz: 0, team: 'enemy', id: 3 },
  ]);
  const aiMeshRefs = [useRef<THREE.Group>(null!), useRef<THREE.Group>(null!), useRef<THREE.Group>(null!), useRef<THREE.Group>(null!)];

  const goalScored = useRef(false);
  const goalTimer = useRef(0); // pause after goal

  useFrame((_, dt) => {
    if (soccerPhase !== 'playing') return;
    tickSoccer(dt);

    // Goal pause
    if (goalTimer.current > 0) {
      goalTimer.current -= dt;
      if (goalTimer.current <= 0) {
        // Reset positions
        ball.current = { x: SOCCER_CX, z: SOCCER_CZ, vx: 1, vz: 0 };
        goalScored.current = false;
        aiPlayers.current = [
          { x: SOCCER_CX - 8, z: SOCCER_CZ - 4, vx: 0, vz: 0, team: 'ally', id: 0 },
          { x: SOCCER_CX - 6, z: SOCCER_CZ + 4, vx: 0, vz: 0, team: 'ally', id: 1 },
          { x: SOCCER_CX + 8, z: SOCCER_CZ - 4, vx: 0, vz: 0, team: 'enemy', id: 2 },
          { x: SOCCER_CX + 6, z: SOCCER_CZ + 4, vx: 0, vz: 0, team: 'enemy', id: 3 },
        ];
      }
      return;
    }

    const b = ball.current;
    const FRICTION = 0.975;
    const MAX_BALL_SPEED = 12;

    // Ball physics
    b.vx *= FRICTION;
    b.vz *= FRICTION;
    b.vx = Math.max(-MAX_BALL_SPEED, Math.min(MAX_BALL_SPEED, b.vx));
    b.vz = Math.max(-MAX_BALL_SPEED, Math.min(MAX_BALL_SPEED, b.vz));
    b.x += b.vx * dt;
    b.z += b.vz * dt;

    // Wall bounces (excluding goal openings)
    const inGoalZone = Math.abs(b.z - SOCCER_CZ) < GOAL_HW;
    if (b.x < FIELD_L) {
      if (inGoalZone) {
        // Goal for player (left goal)!
        if (!goalScored.current) {
          goalScored.current = true;
          scoreSoccerGoal('player');
          goalTimer.current = 2.5;
        }
      } else {
        b.x = FIELD_L + 0.3; b.vx *= -0.65;
      }
    }
    if (b.x > FIELD_R) {
      if (inGoalZone) {
        // Goal for AI (right goal)!
        if (!goalScored.current) {
          goalScored.current = true;
          scoreSoccerGoal('ai');
          goalTimer.current = 2.5;
        }
      } else {
        b.x = FIELD_R - 0.3; b.vx *= -0.65;
      }
    }
    if (b.z < FIELD_B) { b.z = FIELD_B + 0.3; b.vz *= -0.65; }
    if (b.z > FIELD_F) { b.z = FIELD_F - 0.3; b.vz *= -0.65; }

    // Player ↔ ball elastic collision — ball is solid and bounces the player back
    const px = playerState.position.x;
    const pz = playerState.position.z;
    const pdx = b.x - px, pdz = b.z - pz;
    const pdist = Math.sqrt(pdx * pdx + pdz * pdz);
    const COLLISION_RADIUS = 1.1; // ball(0.5) + player(0.6)
    if (pdist < COLLISION_RADIUS && pdist > 0.01) {
      const nx = pdx / pdist, nz = pdz / pdist;
      const overlap = COLLISION_RADIUS - pdist;
      // Push ball away
      const ballForce = 11 * overlap;
      b.vx += nx * ballForce;
      b.vz += nz * ballForce;
      // Push player back (they bounce off the ball)
      playerState.externalForce.x -= nx * overlap * 0.55;
      playerState.externalForce.z -= nz * overlap * 0.55;
    }

    // AI player logic
    aiPlayers.current.forEach((ai, i) => {
      const AI_SPEED = 3.8 + i * 0.2;
      const bdx = b.x - ai.x, bdz = b.z - ai.z;
      const bdist = Math.sqrt(bdx * bdx + bdz * bdz);

      // Target: ally → kick ball left (toward FIELD_L), enemy → kick ball right (toward FIELD_R)
      const targetX = ai.team === 'ally' ? FIELD_L : FIELD_R;

      // Chase ball or position based on distance
      let targetXPos: number, targetZPos: number;
      if (bdist < 6) {
        // Chase the ball
        targetXPos = b.x;
        targetZPos = b.z;
      } else {
        // Position between ball and own goal
        targetXPos = (b.x + ai.x) * 0.5;
        targetZPos = (b.z + SOCCER_CZ) * 0.5;
      }

      const dx = targetXPos - ai.x, dz = targetZPos - ai.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 0.5) {
        ai.vx = (dx / dist) * AI_SPEED;
        ai.vz = (dz / dist) * AI_SPEED;
      } else {
        ai.vx *= 0.8;
        ai.vz *= 0.8;
      }

      ai.x += ai.vx * dt;
      ai.z += ai.vz * dt;

      // Clamp to field
      ai.x = Math.max(FIELD_L + 0.5, Math.min(FIELD_R - 0.5, ai.x));
      ai.z = Math.max(FIELD_B + 0.5, Math.min(FIELD_F - 0.5, ai.z));

      // AI kicks ball when close
      if (bdist < 1.4) {
        const kickDir = { x: targetX - b.x, z: SOCCER_CZ - b.z };
        const klen = Math.sqrt(kickDir.x ** 2 + kickDir.z ** 2);
        if (klen > 0) {
          b.vx += (kickDir.x / klen) * 7;
          b.vz += (kickDir.z / klen) * 4 * (Math.random() - 0.3);
        }
      }

      // Update mesh
      if (aiMeshRefs[i]?.current) {
        aiMeshRefs[i].current.position.set(ai.x, 0, ai.z);
        if (bdist > 0.1) {
          aiMeshRefs[i].current.rotation.y = Math.atan2(bdx, bdz);
        }
      }
    });

    // Update ball mesh
    if (ballMeshRef.current) {
      ballMeshRef.current.position.set(b.x, 0.5, b.z);
      ballMeshRef.current.rotation.z += b.vx * dt * 1.5;
      ballMeshRef.current.rotation.x += b.vz * dt * 1.5;
    }
  });

  // Field material colours
  const fieldMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2E7D32', roughness: 0.92, metalness: 0 }), []);
  const stripeMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#388E3C', roughness: 0.90, metalness: 0 }), []);
  const lineMat = useMemo(() => new THREE.MeshStandardMaterial({ color: 'white', roughness: 0.8, metalness: 0 }), []);

  return (
    <group>
      {/* ── Field surface ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[SOCCER_CX, 0.005, SOCCER_CZ]} receiveShadow material={fieldMat}>
        <planeGeometry args={[HW * 2, HD * 2]} />
      </mesh>

      {/* Alternating grass stripes */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]}
          position={[SOCCER_CX - HW + (i * 2 + 1) * (HW / 3), 0.008, SOCCER_CZ]}
          receiveShadow material={stripeMat}>
          <planeGeometry args={[HW / 3, HD * 2]} />
        </mesh>
      ))}

      {/* Field border */}
      {[
        { pos: [SOCCER_CX, 0.012, FIELD_B], rot: [Math.PI / 2, 0, 0], w: HW * 2, h: 0.25 },
        { pos: [SOCCER_CX, 0.012, FIELD_F], rot: [Math.PI / 2, 0, 0], w: HW * 2, h: 0.25 },
        { pos: [FIELD_L, 0.012, SOCCER_CZ], rot: [Math.PI / 2, 0, Math.PI / 2], w: HD * 2, h: 0.25 },
        { pos: [FIELD_R, 0.012, SOCCER_CZ], rot: [Math.PI / 2, 0, Math.PI / 2], w: HD * 2, h: 0.25 },
      ].map(({ pos, rot, w, h }, i) => (
        <mesh key={i} position={pos as [number, number, number]} rotation={rot as [number, number, number]} material={lineMat}>
          <planeGeometry args={[w, h]} />
        </mesh>
      ))}

      {/* Center line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[SOCCER_CX, 0.012, SOCCER_CZ]} material={lineMat}>
        <planeGeometry args={[0.22, HD * 2]} />
      </mesh>
      {/* Center circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[SOCCER_CX, 0.013, SOCCER_CZ]} material={lineMat}>
        <ringGeometry args={[3.4, 3.65, 32]} />
      </mesh>
      {/* Center dot */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[SOCCER_CX, 0.014, SOCCER_CZ]} material={lineMat}>
        <circleGeometry args={[0.25, 12]} />
      </mesh>

      {/* Penalty boxes */}
      {[-1, 1].map((side) => {
        const bx = side === -1 ? FIELD_L : FIELD_R;
        const penW = 5, penH = HD * 0.8;
        return (
          <mesh key={side} rotation={[-Math.PI / 2, 0, 0]}
            position={[bx + side * penW * 0.5, 0.012, SOCCER_CZ]} material={lineMat}>
            <ringGeometry args={[penH - 0.1, penH, 4, 1, -Math.PI / 2, Math.PI / 2]} />
          </mesh>
        );
      })}

      {/* Goals */}
      <GoalPosts x={FIELD_L} flip={false} />
      <GoalPosts x={FIELD_R} flip={true} />

      {/* Spectator stands */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh castShadow position={[SOCCER_CX, 1.5, SOCCER_CZ + side * (HD + 3.5)]}>
            <boxGeometry args={[HW * 2, 3, 4]} />
            <meshStandardMaterial color={side === -1 ? '#1565C0' : '#B71C1C'} roughness={0.8} metalness={0.1} />
          </mesh>
          {/* Spectator dots (crowd) */}
          {Array.from({ length: 12 }).map((_, i) => (
            <mesh key={i} castShadow position={[SOCCER_CX - HW + i * (HW * 2 / 11), 2.8, SOCCER_CZ + side * (HD + 2.5)]}>
              <sphereGeometry args={[0.38, 6, 6]} />
              <meshStandardMaterial color={['#FFD700', '#FF4444', '#44FF44', '#4444FF', '#FF8800'][i % 5]} roughness={0.8} metalness={0} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Corner flags */}
      {[[FIELD_L, FIELD_B], [FIELD_L, FIELD_F], [FIELD_R, FIELD_B], [FIELD_R, FIELD_F]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh>
            <cylinderGeometry args={[0.04, 0.04, 1.8, 6]} />
            <meshStandardMaterial color="white" roughness={0.6} metalness={0.3} />
          </mesh>
          <mesh position={[0.25, 1.5, 0]}>
            <boxGeometry args={[0.5, 0.3, 0.04]} />
            <meshStandardMaterial color={i < 2 ? '#22CC44' : '#CC2244'} roughness={0.7} metalness={0} emissive={i < 2 ? '#118822' : '#881122'} emissiveIntensity={0.3} />
          </mesh>
        </group>
      ))}

      {/* Ball */}
      <group ref={ballMeshRef} position={[SOCCER_CX, 0.5, SOCCER_CZ]}>
        <mesh castShadow>
          <sphereGeometry args={[0.5, 14, 14]} />
          <meshStandardMaterial color="white" roughness={0.55} metalness={0.08} />
        </mesh>
        {/* Black pentagons (soccer pattern) */}
        {[
          [0, 0.5, 0], [0, -0.5, 0], [0.5, 0, 0], [-0.5, 0, 0], [0, 0, 0.5], [0, 0, -0.5]
        ].map(([x, y, z], i) => (
          <mesh key={i} position={[x * 0.48, y * 0.48, z * 0.48]}>
            <sphereGeometry args={[0.12, 5, 5]} />
            <meshStandardMaterial color="#111111" roughness={0.6} metalness={0} />
          </mesh>
        ))}
      </group>

      {/* AI players */}
      {aiPlayers.current.map((ai, i) => (
        <group key={ai.id} ref={aiMeshRefs[i]} position={[ai.x, 0, ai.z]}>
          <AiCapybara pos={[0, 0, 0]} team={ai.team} />
        </group>
      ))}

      {/* Field sign */}
      <group position={[SOCCER_CX, 0, FIELD_B - 3]}>
        <mesh castShadow position={[0, 2, 0]}>
          <boxGeometry args={[8, 2.5, 0.3]} />
          <meshStandardMaterial color="#1A237E" roughness={0.7} metalness={0.2} />
        </mesh>
        <mesh position={[0, 1.1, 0.2]}>
          <cylinderGeometry args={[0.12, 0.12, 2.2, 6]} />
          <meshStandardMaterial color="#888" roughness={0.6} metalness={0.5} />
        </mesh>
      </group>

      {/* Floodlights */}
      {[[FIELD_L - 2, FIELD_B - 2], [FIELD_R + 2, FIELD_B - 2], [FIELD_L - 2, FIELD_F + 2], [FIELD_R + 2, FIELD_F + 2]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.18, 0.22, 10, 7]} />
            <meshStandardMaterial color="#555" roughness={0.8} metalness={0.5} />
          </mesh>
          <mesh position={[0, 5.5, 0]}>
            <boxGeometry args={[2.5, 0.5, 1]} />
            <meshStandardMaterial color="#FFEE88" roughness={0.3} metalness={0.6} emissive="#FFEE00" emissiveIntensity={0.8} />
          </mesh>
          <pointLight position={[0, 5.5, 0]} intensity={1.2} distance={35} color="#FFFBE8" />
        </group>
      ))}
    </group>
  );
}
