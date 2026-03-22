import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/gameStore';

export function GameLoop() {
  const { tick, setTimeOfDay, timeOfDay, phase } = useGameStore();

  useFrame((_, dt) => {
    if (phase !== 'playing') return;
    tick(dt);
    // Advance time: 1 real second = 1 game minute
    setTimeOfDay(timeOfDay + dt / 60);
  });

  return null;
}
