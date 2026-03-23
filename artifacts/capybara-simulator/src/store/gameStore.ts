import { create } from 'zustand';

export type GamePhase = 'menu' | 'playing' | 'dead';
export type RacePhase = 'none' | 'prompt' | 'countdown' | 'racing' | 'finished';
export type CapybaraAction = 'idle' | 'walking' | 'running' | 'swimming' | 'eating' | 'sleeping' | 'happy' | 'shooting' | 'jumping';

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

export interface PotionItem {
  id: string;
  position: [number, number, number];
  collected: boolean;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  goal: number;
  progress: number;
  completed: boolean;
  type: 'food' | 'kill' | 'swim' | 'explore' | 'score' | 'jump';
  reward: number;
}

interface GameState {
  phase: GamePhase;
  happiness: number;
  hunger: number;
  energy: number;
  health: number;
  score: number;
  timeOfDay: number;
  isInWater: boolean;
  currentAction: CapybaraAction;
  friends: Friend[];
  foodItems: FoodItem[];
  potionItems: PotionItem[];
  combo: number;
  level: number;
  xp: number;
  totalPlays: number;
  bestScore: number;
  killCount: number;
  foodCollected: number;
  swimTime: number;
  jumpCount: number;
  quests: Quest[];
  invincibleTimer: number;
  isGiant: boolean;
  giantTimer: number;
  racePhase: RacePhase;
  raceCountdown: number;
  racePosition: number;
  raceFinishTime: number | null;
  racePointsEarned: number;

  setPhase: (phase: GamePhase) => void;
  setHappiness: (v: number) => void;
  setHunger: (v: number) => void;
  setEnergy: (v: number) => void;
  setHealth: (v: number) => void;
  damagePlayer: (amount: number) => void;
  addScore: (v: number) => void;
  setTimeOfDay: (v: number) => void;
  setIsInWater: (v: boolean) => void;
  setCurrentAction: (action: CapybaraAction) => void;
  addFriend: (friend: Friend) => void;
  removeFriend: (id: string) => void;
  collectFood: (id: string) => void;
  collectPotion: (id: string) => void;
  incrementCombo: () => void;
  resetCombo: () => void;
  killEnemy: () => void;
  addJump: () => void;
  startRace: () => void;
  beginRacing: () => void;
  setRacePrompt: (show: boolean) => void;
  setRacePosition: (pos: number) => void;
  finishRace: (position: number) => void;
  dismissRace: () => void;
  startGame: () => void;
  endGame: () => void;
  tick: (dt: number) => void;
}

const INITIAL_FOOD: FoodItem[] = [
  { id: 'f1',  type: 'watermelon', position: [5, 0.3, 5],     collected: false },
  { id: 'f2',  type: 'watermelon', position: [-8, 0.3, 3],    collected: false },
  { id: 'f3',  type: 'watermelon', position: [20, 0.3, 15],   collected: false },
  { id: 'f4',  type: 'watermelon', position: [-15, 0.3, 20],  collected: false },
  { id: 'f5',  type: 'watermelon', position: [30, 0.3, -10],  collected: false },
  { id: 'f6',  type: 'watermelon', position: [-35, 0.3, -25], collected: false },
  { id: 'f7',  type: 'watermelon', position: [40, 0.3, 30],   collected: false },
  { id: 'f8',  type: 'grass',      position: [3, 0.1, -7],    collected: false },
  { id: 'f9',  type: 'grass',      position: [-4, 0.1, 8],    collected: false },
  { id: 'f10', type: 'grass',      position: [-20, 0.1, -5],  collected: false },
  { id: 'f11', type: 'grass',      position: [12, 0.1, 25],   collected: false },
  { id: 'f12', type: 'grass',      position: [35, 0.1, 5],    collected: false },
  { id: 'f13', type: 'grass',      position: [-40, 0.1, 10],  collected: false },
  { id: 'f14', type: 'sugarcane',  position: [10, 0.3, -5],   collected: false },
  { id: 'f15', type: 'sugarcane',  position: [-10, 0.3, -8],  collected: false },
  { id: 'f16', type: 'sugarcane',  position: [0, 0.3, 35],    collected: false },
  { id: 'f17', type: 'sugarcane',  position: [-30, 0.3, 15],  collected: false },
  { id: 'f18', type: 'sugarcane',  position: [45, 0.3, -15],  collected: false },
  { id: 'f19', type: 'watermelon', position: [0, 0.3, 15],    collected: false },
  { id: 'f20', type: 'grass',      position: [22, 0.1, -30],  collected: false },
];

const INITIAL_POTIONS: PotionItem[] = [
  { id: 'p1', position: [15, 0.5, -20], collected: false },
  { id: 'p2', position: [-25, 0.5, 30], collected: false },
  { id: 'p3', position: [40, 0.5, 10],  collected: false },
  { id: 'p4', position: [-10, 0.5, -35],collected: false },
  { id: 'p5', position: [0, 0.5, -50],  collected: false },
];

const INITIAL_QUESTS: Quest[] = [
  { id: 'q1', title: 'Snack Time',      description: 'Collect 5 food items',       goal: 5,    progress: 0, completed: false, type: 'food',  reward: 200 },
  { id: 'q2', title: 'Capy Hunter',     description: 'Defeat 3 enemy capybaras',   goal: 3,    progress: 0, completed: false, type: 'kill',  reward: 300 },
  { id: 'q3', title: 'Water Lover',     description: 'Swim for 10 seconds',        goal: 10,   progress: 0, completed: false, type: 'swim',  reward: 150 },
  { id: 'q4', title: 'High Scorer',     description: 'Reach a score of 1000',      goal: 1000, progress: 0, completed: false, type: 'score', reward: 500 },
  { id: 'q5', title: 'Jump King',       description: 'Jump 10 times',              goal: 10,   progress: 0, completed: false, type: 'jump',  reward: 250 },
];

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'menu',
  happiness: 80,
  hunger: 60,
  energy: 100,
  health: 100,
  score: 0,
  timeOfDay: 10,
  isInWater: false,
  currentAction: 'idle',
  friends: [],
  foodItems: INITIAL_FOOD,
  potionItems: INITIAL_POTIONS,
  combo: 0,
  level: 1,
  xp: 0,
  totalPlays: 0,
  bestScore: 0,
  killCount: 0,
  foodCollected: 0,
  swimTime: 0,
  jumpCount: 0,
  quests: INITIAL_QUESTS,
  invincibleTimer: 0,
  isGiant: false,
  giantTimer: 0,
  racePhase: 'none',
  raceCountdown: 3,
  racePosition: 1,
  raceFinishTime: null,
  racePointsEarned: 0,

  setPhase: (phase) => set({ phase }),
  setHappiness: (v) => set({ happiness: Math.max(0, Math.min(100, v)) }),
  setHunger: (v) => set({ hunger: Math.max(0, Math.min(100, v)) }),
  setEnergy: (v) => set({ energy: Math.max(0, Math.min(100, v)) }),
  setHealth: (v) => set({ health: Math.max(0, Math.min(100, v)) }),

  damagePlayer: (amount) => {
    const { health, invincibleTimer, isGiant } = get();
    if (invincibleTimer > 0 || isGiant) return;
    const newHealth = Math.max(0, health - amount);
    if (newHealth <= 0) {
      set({ health: 0, phase: 'dead' });
    } else {
      set({ health: newHealth, invincibleTimer: 1.5 });
    }
  },

  addScore: (v) => {
    const { score, combo, xp, quests } = get();
    const multiplied = v * (1 + combo * 0.5);
    const newScore = score + multiplied;
    const newXp = xp + multiplied;
    const newLevel = Math.floor(newXp / 500) + 1;
    const newQuests = quests.map(q => {
      if (q.type === 'score' && !q.completed) {
        const newProgress = Math.min(newScore, q.goal);
        return { ...q, progress: newProgress, completed: newProgress >= q.goal };
      }
      return q;
    });
    set({ score: newScore, xp: newXp, level: newLevel, quests: newQuests });
  },

  setTimeOfDay: (v) => set({ timeOfDay: v % 24 }),
  setIsInWater: (v) => set({ isInWater: v }),
  setCurrentAction: (action) => set({ currentAction: action }),
  addFriend: (friend) => set((s) => ({ friends: [...s.friends, friend] })),
  removeFriend: (id) => set((s) => ({ friends: s.friends.filter((f) => f.id !== id) })),

  collectFood: (id) => {
    const { foodItems } = get();
    const food = foodItems.find((f) => f.id === id);
    if (!food || food.collected) return;
    set((s) => ({
      foodItems: s.foodItems.map((f) => f.id === id ? { ...f, collected: true } : f),
    }));
    const { addScore, setHunger, setHappiness, setHealth, hunger, happiness, health, incrementCombo, foodCollected, quests } = get();
    const bonus = food.type === 'watermelon' ? 50 : food.type === 'sugarcane' ? 35 : 20;
    const healthBonus = food.type === 'watermelon' ? 15 : food.type === 'sugarcane' ? 10 : 5;
    addScore(bonus);
    setHunger(hunger + (food.type === 'watermelon' ? 20 : 15));
    setHappiness(happiness + 10);
    setHealth(health + healthBonus);
    incrementCombo();
    const newFoodCount = foodCollected + 1;
    const newQuests = quests.map(q => {
      if (q.type === 'food' && !q.completed) {
        const newProgress = Math.min(newFoodCount, q.goal);
        return { ...q, progress: newProgress, completed: newProgress >= q.goal };
      }
      return q;
    });
    set({ foodCollected: newFoodCount, quests: newQuests });
  },

  collectPotion: (id) => {
    const { potionItems } = get();
    const potion = potionItems.find(p => p.id === id);
    if (!potion || potion.collected) return;
    set((s) => ({
      potionItems: s.potionItems.map(p => p.id === id ? { ...p, collected: true } : p),
      isGiant: true,
      giantTimer: 20,
      invincibleTimer: 20,
      happiness: Math.min(100, s.happiness + 30),
    }));
    get().addScore(300);
  },

  incrementCombo: () => set((s) => ({ combo: s.combo + 1 })),
  resetCombo: () => set({ combo: 0 }),

  killEnemy: () => {
    const { killCount, quests, addScore } = get();
    addScore(150);
    const newKillCount = killCount + 1;
    const newQuests = quests.map(q => {
      if (q.type === 'kill' && !q.completed) {
        const newProgress = Math.min(newKillCount, q.goal);
        return { ...q, progress: newProgress, completed: newProgress >= q.goal };
      }
      return q;
    });
    set({ killCount: newKillCount, quests: newQuests });
  },

  addJump: () => {
    const { jumpCount, quests, addScore } = get();
    addScore(10);
    const newJumpCount = jumpCount + 1;
    const newQuests = quests.map(q => {
      if (q.type === 'jump' && !q.completed) {
        const newProgress = Math.min(newJumpCount, q.goal);
        return { ...q, progress: newProgress, completed: newProgress >= q.goal };
      }
      return q;
    });
    set({ jumpCount: newJumpCount, quests: newQuests });
  },

  setRacePrompt: (show) => set({ racePhase: show ? 'prompt' : 'none' }),
  setRacePosition: (pos) => set({ racePosition: pos }),

  // startRace: prompt → countdown. beginRacing: countdown → racing.
  startRace: () => set({ racePhase: 'countdown', raceCountdown: 3, racePosition: 1, raceFinishTime: null, racePointsEarned: 0 }),
  beginRacing: () => set({ racePhase: 'racing' }),

  finishRace: (position) => {
    const POINTS_TABLE = [500, 300, 150, 50];
    const pts = POINTS_TABLE[Math.min(position - 1, 3)];
    get().addScore(pts);
    set({ racePhase: 'finished', racePosition: position, racePointsEarned: pts, raceFinishTime: Date.now() });
  },

  dismissRace: () => set({ racePhase: 'none' }),

  startGame: () => set({
    phase: 'playing',
    happiness: 80,
    hunger: 60,
    energy: 100,
    health: 100,
    score: 0,
    timeOfDay: 10,
    isInWater: false,
    currentAction: 'idle',
    friends: [],
    foodItems: INITIAL_FOOD.map(f => ({ ...f, collected: false })),
    potionItems: INITIAL_POTIONS.map(p => ({ ...p, collected: false })),
    combo: 0,
    level: 1,
    xp: 0,
    killCount: 0,
    foodCollected: 0,
    swimTime: 0,
    jumpCount: 0,
    quests: INITIAL_QUESTS.map(q => ({ ...q, progress: 0, completed: false })),
    invincibleTimer: 0,
    isGiant: false,
    giantTimer: 0,
    racePhase: 'none',
    raceCountdown: 3,
    racePosition: 1,
    raceFinishTime: null,
    racePointsEarned: 0,
    totalPlays: get().totalPlays + 1,
  }),

  endGame: () => {
    const { score, bestScore } = get();
    set({ bestScore: Math.max(score, bestScore) });
  },

  tick: (dt) => {
    const { phase, isInWater, currentAction, hunger, energy, happiness, score, bestScore, invincibleTimer, swimTime, quests, isGiant, giantTimer } = get();
    if (phase !== 'playing') return;

    const hungerDecay = currentAction === 'running' ? 0.015 : 0.005;
    const energyDecay = currentAction === 'sleeping' ? -0.1 : currentAction === 'running' ? 0.02 : 0.005;
    const happinessBonus = isInWater ? 0.02 : currentAction === 'sleeping' ? 0.01 : -0.003;

    const newHunger = Math.max(0, hunger - hungerDecay * dt * 60);
    const newEnergy = Math.max(0, Math.min(100, energy - energyDecay * dt * 60));
    const newHappiness = Math.max(0, Math.min(100, happiness + happinessBonus * dt * 60));
    const passiveScore = (newHappiness / 100) * 0.5 * dt * 60;
    const newInvincible = Math.max(0, invincibleTimer - dt);

    const newSwimTime = isInWater ? swimTime + dt : swimTime;
    const newQuests = quests.map(q => {
      if (q.type === 'swim' && !q.completed && isInWater) {
        const newProgress = Math.min(newSwimTime, q.goal);
        return { ...q, progress: newProgress, completed: newProgress >= q.goal };
      }
      return q;
    });

    const newGiantTimer = Math.max(0, giantTimer - dt);
    const newIsGiant = newGiantTimer > 0;

    set({
      hunger: newHunger,
      energy: newEnergy,
      happiness: newHappiness,
      score: score + passiveScore,
      bestScore: Math.max(score + passiveScore, bestScore),
      invincibleTimer: newInvincible,
      swimTime: newSwimTime,
      quests: newQuests,
      giantTimer: newGiantTimer,
      isGiant: newIsGiant,
    });

    const { foodItems } = get();
    const allCollected = foodItems.every(f => f.collected);
    if (allCollected) {
      set({ foodItems: INITIAL_FOOD.map(f => ({ ...f, collected: false })) });
    }
  },
}));
