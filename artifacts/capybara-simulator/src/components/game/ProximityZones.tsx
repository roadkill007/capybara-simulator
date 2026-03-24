/**
 * ProximityZones — detects when the player enters a mini-game trigger zone
 * and updates the store prompt state. Also handles the E key to start games.
 */
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/gameStore';
import { playerState } from './playerState';
import { SOCCER_CX, SOCCER_CZ } from './SoccerGame';
import { RANGE_CX, RANGE_CZ } from './ShootingRange';

const SOCCER_R2 = 14 * 14;    // trigger radius² for soccer
const SHOOTING_R2 = 13 * 13;  // trigger radius² for shooting range

export function ProximityZones() {
  const store = useGameStore();
  const wasInSoccer = useRef(false);
  const wasInShooting = useRef(false);

  // E key handler to start mini-games
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'e' && e.key !== 'E') return;
      const { soccerPhase, shootingPhase, startSoccer, startShooting } = useGameStore.getState();
      if (soccerPhase === 'prompt') { startSoccer(); return; }
      if (shootingPhase === 'prompt') { startShooting(); return; }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useFrame(() => {
    const { phase, soccerPhase, shootingPhase, setSoccerPrompt, setShootingPrompt } = useGameStore.getState();
    if (phase !== 'playing') return;

    const px = playerState.position.x;
    const pz = playerState.position.z;

    // Soccer zone
    const inSoccer = (px - SOCCER_CX) ** 2 + (pz - SOCCER_CZ) ** 2 < SOCCER_R2;
    if (inSoccer && !wasInSoccer.current && soccerPhase === 'none') {
      setSoccerPrompt(true);
    }
    if (!inSoccer && wasInSoccer.current && soccerPhase === 'prompt') {
      setSoccerPrompt(false);
    }
    wasInSoccer.current = inSoccer;

    // Shooting range zone
    const inShooting = (px - RANGE_CX) ** 2 + (pz - RANGE_CZ) ** 2 < SHOOTING_R2;
    if (inShooting && !wasInShooting.current && shootingPhase === 'none') {
      setShootingPrompt(true);
    }
    if (!inShooting && wasInShooting.current && shootingPhase === 'prompt') {
      setShootingPrompt(false);
    }
    wasInShooting.current = inShooting;
  });

  return null;
}
