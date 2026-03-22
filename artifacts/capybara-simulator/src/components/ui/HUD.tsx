import { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';

function StatBar({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-lg w-6">{icon}</span>
      <div className="flex-1">
        <div className="flex justify-between text-xs text-white/80 mb-0.5">
          <span className="font-semibold">{label}</span>
          <span>{Math.round(value)}%</span>
        </div>
        <div className="h-2.5 bg-black/30 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${value}%`,
              background: `linear-gradient(90deg, ${color}CC, ${color})`,
              boxShadow: `0 0 8px ${color}88`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function ComboDisplay({ combo }: { combo: number }) {
  if (combo < 2) return null;
  return (
    <div
      className="text-center animate-bounce"
      style={{
        fontSize: '1.5rem',
        fontWeight: 900,
        textShadow: '0 0 20px #FFD700, 0 2px 4px #000',
        color: '#FFD700',
      }}
    >
      {combo}x COMBO! 🌟
    </div>
  );
}

export function HUD() {
  const { happiness, hunger, energy, score, timeOfDay, currentAction, friends, level, xp, combo, phase } = useGameStore();
  const notifRef = useRef<string[]>([]);
  const prevHappinessRef = useRef(happiness);

  const hour = Math.floor(timeOfDay);
  const minute = Math.floor((timeOfDay % 1) * 60);
  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const isDaytime = timeOfDay > 6 && timeOfDay < 20;

  const xpToNext = 500;
  const xpProgress = (xp % xpToNext) / xpToNext * 100;

  const actionEmoji = {
    idle: '😌',
    walking: '🚶',
    running: '🏃',
    swimming: '🏊',
    eating: '🍉',
    sleeping: '😴',
    happy: '🎉',
  }[currentAction] || '😌';

  if (phase !== 'playing') return null;

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Top left - Stats */}
      <div
        className="absolute top-4 left-4 p-3 rounded-2xl w-52"
        style={{
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.15)',
        }}
      >
        <StatBar label="Happiness" value={happiness} color="#FF69B4" icon="💖" />
        <StatBar label="Hunger" value={hunger} color="#FF8C00" icon="🍽️" />
        <StatBar label="Energy" value={energy} color="#00BFFF" icon="⚡" />
      </div>

      {/* Top center - Score & Level */}
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl text-center"
        style={{
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,215,0,0.3)',
          minWidth: '160px',
        }}
      >
        <div className="text-yellow-300 font-black text-2xl tracking-wide" style={{ textShadow: '0 0 12px #FFD700' }}>
          {Math.floor(score).toLocaleString()}
        </div>
        <div className="text-white/60 text-xs">SCORE</div>
        <div className="mt-1 flex items-center gap-1">
          <span className="text-purple-300 text-xs font-bold">LVL {level}</span>
          <div className="flex-1 h-1.5 bg-black/30 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${xpProgress}%`, background: 'linear-gradient(90deg, #9B59B6, #E91E8C)' }}
            />
          </div>
        </div>
      </div>

      {/* Top right - Time & friends */}
      <div
        className="absolute top-4 right-4 px-4 py-2 rounded-2xl text-right"
        style={{
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.15)',
        }}
      >
        <div className="text-white font-bold text-lg">
          {isDaytime ? '☀️' : '🌙'} {timeStr}
        </div>
        {friends.length > 0 && (
          <div className="text-pink-300 text-sm mt-1">
            {'🐾'.repeat(Math.min(friends.length, 5))} {friends.length} friend{friends.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Current action */}
      <div
        className="absolute bottom-24 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-sm font-semibold text-white"
        style={{
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {actionEmoji} {currentAction.charAt(0).toUpperCase() + currentAction.slice(1)}
      </div>

      {/* Combo */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2">
        <ComboDisplay combo={combo} />
      </div>

      {/* Controls hint at bottom */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl text-center"
        style={{
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div className="text-white/70 text-xs flex gap-4 flex-wrap justify-center">
          <span>⬆️⬇️⬅️➡️ Move</span>
          <span>Shift Run</span>
          <span>Space Celebrate</span>
          <span>E Eat</span>
          <span>Z Sleep</span>
        </div>
      </div>

      {/* Low stats warnings */}
      {hunger < 20 && (
        <div
          className="absolute bottom-36 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-orange-300 font-bold animate-pulse"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
        >
          🍽️ Hungry! Find food!
        </div>
      )}
      {energy < 20 && (
        <div
          className="absolute bottom-44 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-blue-300 font-bold animate-pulse"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
        >
          ⚡ Tired! Press Z to sleep!
        </div>
      )}
    </div>
  );
}
