import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/gameStore';

// Stat tick runs at most 10× per second — HUD bars don't need 60fps updates
const TICK_INTERVAL = 0.1;

export function GameLoop() {
  const { tick, setTimeOfDay, phase } = useGameStore();
  const accumulator = useRef(0);
  const timeRef     = useRef(useGameStore.getState().timeOfDay);

  useFrame((_, dt) => {
    if (phase !== 'playing') return;

    // Advance day/night using a local ref — only write to store at tick intervals
    timeRef.current = (timeRef.current + dt / 60) % 24;

    accumulator.current += dt;
    if (accumulator.current >= TICK_INTERVAL) {
      const batch = accumulator.current;
      accumulator.current = 0;
      tick(batch);
      setTimeOfDay(timeRef.current);
    }
  });

  return null;
}
