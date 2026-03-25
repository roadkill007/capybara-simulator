/**
 * ProximityZones — detects when the player enters or leaves a mini-game trigger zone.
 * • Entering while 'none' → show prompt
 * • Leaving while 'prompt' → hide prompt
 * • Leaving while 'playing' → auto-end the game (gives credit)
 * • E key: enter prompt → start game; enter playing → end game
 */
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/gameStore';
import { playerState } from './playerState';
import { SOCCER_CX, SOCCER_CZ } from './SoccerGame';
import { RANGE_CX, RANGE_CZ } from './ShootingRange';

const SOCCER_R2   = 14 * 14;
const SHOOTING_R2 = 13 * 13;

export function ProximityZones() {
  const store = useGameStore();
  const wasInSoccer   = useRef(false);
  const wasInShooting = useRef(false);

  // E key: start or exit soccer / shooting
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'e' && e.key !== 'E') return;
      const { soccerPhase, shootingPhase, startSoccer, startShooting, endSoccer, endShooting } = useGameStore.getState();
      if (soccerPhase === 'prompt')   { startSoccer();   return; }
      if (soccerPhase === 'playing')  { endSoccer();     return; }
      if (shootingPhase === 'prompt') { startShooting(); return; }
      if (shootingPhase === 'playing'){ endShooting();   return; }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useFrame(() => {
    const {
      phase, soccerPhase, shootingPhase,
      setSoccerPrompt, setShootingPrompt,
      endSoccer, endShooting,
    } = useGameStore.getState();
    if (phase !== 'playing') return;

    const px = playerState.position.x;
    const pz = playerState.position.z;

    // ── Soccer zone ──────────────────────────────────────────────────────────
    const inSoccer = (px - SOCCER_CX) ** 2 + (pz - SOCCER_CZ) ** 2 < SOCCER_R2;

    if (inSoccer && !wasInSoccer.current && soccerPhase === 'none') {
      setSoccerPrompt(true);
    }
    if (!inSoccer && wasInSoccer.current) {
      if (soccerPhase === 'prompt') setSoccerPrompt(false);
      // Don't auto-end playing — player can roam freely; use E key to exit
    }
    wasInSoccer.current = inSoccer;

    // ── Shooting zone ────────────────────────────────────────────────────────
    const inShooting = (px - RANGE_CX) ** 2 + (pz - RANGE_CZ) ** 2 < SHOOTING_R2;

    if (inShooting && !wasInShooting.current && shootingPhase === 'none') {
      setShootingPrompt(true);
    }
    if (!inShooting && wasInShooting.current) {
      if (shootingPhase === 'prompt')  setShootingPrompt(false);
      if (shootingPhase === 'playing') endShooting(); // left range mid-game → score and end
    }
    wasInShooting.current = inShooting;
  });

  return null;
}
