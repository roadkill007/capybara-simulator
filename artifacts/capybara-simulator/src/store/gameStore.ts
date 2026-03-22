import { create } from 'zustand';

export type GamePhase = 'menu' | 'playing' | 'paused';
export type CapybaraAction = 'idle' | 'walking' | 'running' | 'swimming' | 'eating' | 'sleeping' | 'happy';

export interface Friend {
  id: string;
  position: [number, number, number];
  action: CapybaraAction;
}

export interface FoodItem {
  id: string;
  type: 'watermelon' | 'grass' | 'sugarcane';
  position: [number, number, number];
  collected: boolean;
}

interface GameState {
  phase: GamePhase;
  happiness: number;
  hunger: number;
  energy: number;
  score: number;
  timeOfDay: number; // 0-24
  isInWater: boolean;
  currentAction: CapybaraAction;
  friends: Friend[];
  foodItems: FoodItem[];
  combo: number;
  level: number;
  xp: number;
  totalPlays: number;
  bestScore: number;
  
  setPhase: (phase: GamePhase) => void;
  setHappiness: (v: number) => void;
  setHunger: (v: number) => void;
  setEnergy: (v: number) => void;
  addScore: (v: number) => void;
  setTimeOfDay: (v: number) => void;
  setIsInWater: (v: boolean) => void;
  setCurrentAction: (action: CapybaraAction) => void;
  addFriend: (friend: Friend) => void;
  removeFriend: (id: string) => void;
  collectFood: (id: string) => void;
  incrementCombo: () => void;
  resetCombo: () => void;
  startGame: () => void;
  endGame: () => void;
  tick: (dt: number) => void;
}

const INITIAL_FOOD: FoodItem[] = [
  { id: 'f1', type: 'watermelon', position: [5, 0.3, 5], collected: false },
  { id: 'f2', type: 'watermelon', position: [-8, 0.3, 3], collected: false },
  { id: 'f3', type: 'grass', position: [3, 0.1, -7], collected: false },
  { id: 'f4', type: 'grass', position: [-4, 0.1, 8], collected: false },
  { id: 'f5', type: 'sugarcane', position: [10, 0.3, -5], collected: false },
  { id: 'f6', type: 'sugarcane', position: [-10, 0.3, -8], collected: false },
  { id: 'f7', type: 'watermelon', position: [0, 0.3, 15], collected: false },
  { id: 'f8', type: 'grass', position: [15, 0.1, 0], collected: false },
];

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'menu',
  happiness: 80,
  hunger: 60,
  energy: 100,
  score: 0,
  timeOfDay: 10,
  isInWater: false,
  currentAction: 'idle',
  friends: [],
  foodItems: INITIAL_FOOD,
  combo: 0,
  level: 1,
  xp: 0,
  totalPlays: 0,
  bestScore: 0,

  setPhase: (phase) => set({ phase }),
  setHappiness: (v) => set({ happiness: Math.max(0, Math.min(100, v)) }),
  setHunger: (v) => set({ hunger: Math.max(0, Math.min(100, v)) }),
  setEnergy: (v) => set({ energy: Math.max(0, Math.min(100, v)) }),
  addScore: (v) => {
    const { score, combo, xp, level } = get();
    const multiplied = v * (1 + combo * 0.5);
    const newScore = score + multiplied;
    const newXp = xp + multiplied;
    const newLevel = Math.floor(newXp / 500) + 1;
    set({ score: newScore, xp: newXp, level: newLevel });
  },
  setTimeOfDay: (v) => set({ timeOfDay: v % 24 }),
  setIsInWater: (v) => set({ isInWater: v }),
  setCurrentAction: (action) => set({ currentAction: action }),
  addFriend: (friend) => set((s) => ({ friends: [...s.friends, friend] })),
  removeFriend: (id) => set((s) => ({ friends: s.friends.filter((f) => f.id !== id) })),
  collectFood: (id) => {
    set((s) => ({
      foodItems: s.foodItems.map((f) => f.id === id ? { ...f, collected: true } : f),
    }));
    const food = get().foodItems.find((f) => f.id === id);
    if (food) {
      const { addScore, setHunger, setHappiness, hunger, happiness, incrementCombo } = get();
      const bonus = food.type === 'watermelon' ? 50 : food.type === 'sugarcane' ? 35 : 20;
      addScore(bonus);
      setHunger(hunger + (food.type === 'watermelon' ? 20 : 15));
      setHappiness(happiness + 10);
      incrementCombo();
    }
  },
  incrementCombo: () => set((s) => ({ combo: s.combo + 1 })),
  resetCombo: () => set({ combo: 0 }),
  startGame: () => set({
    phase: 'playing',
    happiness: 80,
    hunger: 60,
    energy: 100,
    score: 0,
    timeOfDay: 10,
    isInWater: false,
    currentAction: 'idle',
    friends: [],
    foodItems: INITIAL_FOOD.map(f => ({ ...f, collected: false })),
    combo: 0,
    level: 1,
    xp: 0,
    totalPlays: get().totalPlays + 1,
  }),
  endGame: () => {
    const { score, bestScore } = get();
    set({ phase: 'menu', bestScore: Math.max(score, bestScore) });
  },
  tick: (dt) => {
    const { phase, isInWater, currentAction, hunger, energy, happiness, score, bestScore } = get();
    if (phase !== 'playing') return;

    // Needs decay over time
    const hungerDecay = currentAction === 'running' ? 0.015 : 0.005;
    const energyDecay = currentAction === 'sleeping' ? -0.1 : currentAction === 'running' ? 0.02 : 0.005;
    const happinessBonus = isInWater ? 0.02 : currentAction === 'sleeping' ? 0.01 : -0.003;

    const newHunger = Math.max(0, hunger - hungerDecay * dt * 60);
    const newEnergy = Math.max(0, Math.min(100, energy - energyDecay * dt * 60));
    const newHappiness = Math.max(0, Math.min(100, happiness + happinessBonus * dt * 60));

    // Passive score from happiness
    const passiveScore = (newHappiness / 100) * 0.5 * dt * 60;

    set({
      hunger: newHunger,
      energy: newEnergy,
      happiness: newHappiness,
      score: score + passiveScore,
      bestScore: Math.max(score + passiveScore, bestScore),
    });

    // Respawn food
    const { foodItems } = get();
    const allCollected = foodItems.every(f => f.collected);
    if (allCollected) {
      set({ foodItems: INITIAL_FOOD.map(f => ({ ...f, collected: false })) });
    }
  },
}));
