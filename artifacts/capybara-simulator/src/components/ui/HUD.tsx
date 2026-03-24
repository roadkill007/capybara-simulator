import { Fragment } from 'react';
import { useGameStore } from '../../store/gameStore';

function StatBar({ label, value, color, icon, flash }: { label: string; value: number; color: string; icon: string; flash?: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-base w-5">{icon}</span>
      <div className="flex-1">
        <div className="flex justify-between text-xs text-white/80 mb-0.5">
          <span className="font-semibold">{label}</span>
          <span>{Math.round(value)}%</span>
        </div>
        <div className="h-2.5 bg-black/30 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{
              width: `${value}%`,
              background: flash && value < 30
                ? `repeating-linear-gradient(90deg, ${color}, ${color} 4px, #FF0000 4px, #FF0000 8px)`
                : `linear-gradient(90deg, ${color}CC, ${color})`,
              boxShadow: `0 0 6px ${color}88`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function QuestTracker() {
  const { quests } = useGameStore();
  const active = quests.filter(q => !q.completed).slice(0, 2);
  const completed = quests.filter(q => q.completed);
  return (
    <div className="absolute top-4 right-4 w-52"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,215,0,0.25)', borderRadius: '16px', padding: '10px 12px' }}>
      <div className="text-yellow-300 text-xs font-bold uppercase tracking-widest mb-2">📋 Quests</div>
      {active.map(q => (
        <div key={q.id} className="mb-2">
          <div className="text-white text-xs font-semibold">{q.title}</div>
          <div className="text-white/50 text-xs mb-1">{q.description}</div>
          <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (q.progress / q.goal) * 100)}%`, background: 'linear-gradient(90deg, #FFD700CC, #FFD700)' }} />
          </div>
          <div className="text-white/50 text-xs text-right">{Math.floor(q.progress)}/{q.goal}</div>
        </div>
      ))}
      {completed.length > 0 && <div className="text-green-400 text-xs">✅ {completed.length} completed</div>}
    </div>
  );
}

// ── Soccer result screen ──────────────────────────────────────────────────────
function SoccerResult() {
  const { soccerPlayerScore, soccerAiScore, dismissSoccer } = useGameStore();
  const won = soccerPlayerScore > soccerAiScore;
  const draw = soccerPlayerScore === soccerAiScore;
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="text-center px-10 py-8 rounded-3xl" style={{ background: 'rgba(10,30,10,0.95)', border: '2px solid rgba(34,200,68,0.4)', maxWidth: 380 }}>
        <div className="text-5xl mb-2">{won ? '🏆' : draw ? '🤝' : '😿'}</div>
        <div className="text-white font-black text-2xl mb-1">{won ? 'You Won!' : draw ? "It's a Draw!" : 'Better luck next time!'}</div>
        <div className="text-green-300 text-lg mb-4">⚽ Final Score</div>
        <div className="flex justify-center items-center gap-6 mb-6">
          <div className="text-center">
            <div className="text-green-400 font-black text-5xl">{soccerPlayerScore}</div>
            <div className="text-white/50 text-sm mt-1">Your Team</div>
          </div>
          <div className="text-white/40 text-3xl font-bold">–</div>
          <div className="text-center">
            <div className="text-red-400 font-black text-5xl">{soccerAiScore}</div>
            <div className="text-white/50 text-sm mt-1">AI Team</div>
          </div>
        </div>
        {won && <div className="text-yellow-300 text-sm mb-4">+400 points bonus!</div>}
        {draw && <div className="text-blue-300 text-sm mb-4">+150 points!</div>}
        {!won && !draw && <div className="text-orange-300 text-sm mb-4">+50 points for playing!</div>}
        <button onClick={dismissSoccer}
          className="px-8 py-3 rounded-2xl font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #22CC44, #1A8832)', border: '1px solid rgba(255,255,255,0.2)' }}>
          Continue Adventure 🐾
        </button>
      </div>
    </div>
  );
}

// ── Shooting result screen ────────────────────────────────────────────────────
function ShootingResult() {
  const { shootingScore, dismissShooting } = useGameStore();
  const grade = shootingScore >= 20 ? 'S' : shootingScore >= 15 ? 'A' : shootingScore >= 10 ? 'B' : shootingScore >= 5 ? 'C' : 'D';
  const gradeColor = grade === 'S' ? '#FFD700' : grade === 'A' ? '#44FF44' : grade === 'B' ? '#44AAFF' : grade === 'C' ? '#FF8800' : '#888';
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="text-center px-10 py-8 rounded-3xl" style={{ background: 'rgba(20,5,5,0.95)', border: '2px solid rgba(200,30,30,0.4)', maxWidth: 360 }}>
        <div className="text-5xl mb-2">🎯</div>
        <div className="text-white font-black text-2xl mb-1">Range Complete!</div>
        <div className="text-red-300 text-lg mb-4">Targets hit</div>
        <div className="font-black text-7xl mb-2" style={{ color: gradeColor, textShadow: `0 0 20px ${gradeColor}` }}>{shootingScore}</div>
        <div className="text-xl font-black mb-1" style={{ color: gradeColor }}>Grade: {grade}</div>
        <div className="text-white/50 text-sm mb-4">+{shootingScore * 150} points earned!</div>
        <button onClick={dismissShooting}
          className="px-8 py-3 rounded-2xl font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #CC2244, #881122)', border: '1px solid rgba(255,255,255,0.2)' }}>
          Back to World 🐾
        </button>
      </div>
    </div>
  );
}

// ── Main HUD ──────────────────────────────────────────────────────────────────
export function HUD() {
  const {
    happiness, hunger, energy, health, score, timeOfDay, currentAction,
    friends, level, xp, combo, phase, killCount, invincibleTimer,
    soccerPhase, soccerPlayerScore, soccerAiScore, soccerTimeLeft,
    shootingPhase, shootingScore, shootingTimeLeft,
  } = useGameStore();

  const hour = Math.floor(timeOfDay);
  const minute = Math.floor((timeOfDay % 1) * 60);
  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const isDaytime = timeOfDay > 6 && timeOfDay < 20;

  const xpToNext = 500;
  const xpProgress = (xp % xpToNext) / xpToNext * 100;

  const actionEmoji: Record<string, string> = {
    idle: '😌', walking: '🚶', running: '🏃', swimming: '🏊',
    eating: '🍉', sleeping: '😴', happy: '🎉', shooting: '💥',
  };

  if (phase !== 'playing') return null;

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── Soccer result ── */}
      {soccerPhase === 'finished' && (
        <div className="pointer-events-auto"><SoccerResult /></div>
      )}

      {/* ── Shooting result ── */}
      {shootingPhase === 'finished' && (
        <div className="pointer-events-auto"><ShootingResult /></div>
      )}

      {/* ── Soccer active HUD ── */}
      {soccerPhase === 'playing' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 rounded-2xl"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', border: '2px solid rgba(34,200,68,0.5)' }}>
          <div className="text-center">
            <div className="text-green-400 font-black text-3xl leading-none">{soccerPlayerScore}</div>
            <div className="text-white/40 text-xs uppercase tracking-wide">You</div>
          </div>
          <div className="text-white/60 text-sm font-bold">⚽</div>
          <div className="text-center">
            <div className="text-red-400 font-black text-3xl leading-none">{soccerAiScore}</div>
            <div className="text-white/40 text-xs uppercase tracking-wide">AI</div>
          </div>
          <div className="ml-3 text-center">
            <div className="text-yellow-300 font-bold text-lg leading-none">{Math.ceil(soccerTimeLeft)}s</div>
            <div className="text-white/40 text-xs">time</div>
          </div>
        </div>
      )}

      {/* ── Shooting active HUD ── */}
      {shootingPhase === 'playing' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 rounded-2xl"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', border: '2px solid rgba(200,30,30,0.5)' }}>
          <div className="text-3xl">🎯</div>
          <div className="text-center">
            <div className="text-red-400 font-black text-3xl leading-none">{shootingScore}</div>
            <div className="text-white/40 text-xs uppercase">Hits</div>
          </div>
          <div className="ml-3 text-center">
            <div className="text-yellow-300 font-bold text-xl leading-none">{Math.ceil(shootingTimeLeft)}s</div>
            <div className="text-white/40 text-xs">left</div>
          </div>
          <div className="text-white/50 text-xs ml-1">Press F<br/>to shoot</div>
        </div>
      )}

      {/* Only show main HUD when no mini-game is active */}
      {soccerPhase !== 'playing' && shootingPhase !== 'playing' && (
        <>
          {/* Top-left — Stats */}
          <div className="absolute top-4 left-4 p-3 rounded-2xl w-52"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <StatBar label="Health" value={health} color="#FF2244" icon="❤️" flash />
            <StatBar label="Happiness" value={happiness} color="#FF69B4" icon="💖" />
            <StatBar label="Hunger" value={hunger} color="#FF8C00" icon="🍽️" />
            <StatBar label="Energy" value={energy} color="#00BFFF" icon="⚡" />
          </div>

          {/* Top-center — Score & Level */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl text-center"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,215,0,0.3)', minWidth: '170px' }}>
            <div className="text-yellow-300 font-black text-2xl tracking-wide" style={{ textShadow: '0 0 12px #FFD700' }}>
              {Math.floor(score).toLocaleString()}
            </div>
            <div className="text-white/50 text-xs">SCORE</div>
            <div className="mt-1 flex items-center gap-1">
              <span className="text-purple-300 text-xs font-bold">LVL {level}</span>
              <div className="flex-1 h-1.5 bg-black/30 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${xpProgress}%`, background: 'linear-gradient(90deg,#9B59B6,#E91E8C)' }} />
              </div>
            </div>
            <div className="text-red-400 text-xs mt-1">💀 {killCount} killed</div>
          </div>

          {/* Top-right — Quests */}
          <QuestTracker />

          {/* Mid-right — Time */}
          <div className="absolute top-44 right-4 px-3 py-1.5 rounded-xl text-right"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
            <div className="text-white font-bold text-base">{isDaytime ? '☀️' : '🌙'} {timeStr}</div>
            {friends.length > 0 && <div className="text-pink-300 text-xs">🐾 {friends.length} friends</div>}
          </div>
        </>
      )}

      {/* Combo */}
      {combo >= 2 && (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 animate-bounce"
          style={{ fontSize: '1.6rem', fontWeight: 900, textShadow: '0 0 20px #FFD700,0 2px 4px #000', color: '#FFD700' }}>
          {combo}x COMBO! 🌟
        </div>
      )}

      {/* Current action */}
      {soccerPhase !== 'playing' && shootingPhase !== 'playing' && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-sm font-semibold text-white"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
          {actionEmoji[currentAction] || '😌'} {currentAction.charAt(0).toUpperCase() + currentAction.slice(1)}
        </div>
      )}

      {/* Damage flash */}
      {invincibleTimer > 1 && (
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(255,0,0,0.15)', border: '4px solid rgba(255,0,0,0.4)' }} />
      )}

      {/* ── Mini-game prompts ── */}
      {soccerPhase === 'prompt' && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 px-6 py-4 rounded-2xl text-center pointer-events-auto"
          style={{ background: 'rgba(0,30,0,0.92)', backdropFilter: 'blur(12px)', border: '2px solid rgba(34,200,68,0.6)' }}>
          <div className="text-3xl mb-1">⚽</div>
          <div className="text-green-300 font-black text-lg">Soccer Field!</div>
          <div className="text-white/70 text-sm mb-2">5v5 · 90 seconds · Score goals!</div>
          <div className="text-yellow-300 text-sm font-bold">Press <kbd className="px-2 py-0.5 rounded bg-white/10 font-mono">E</kbd> to play</div>
        </div>
      )}

      {shootingPhase === 'prompt' && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 px-6 py-4 rounded-2xl text-center pointer-events-auto"
          style={{ background: 'rgba(30,0,0,0.92)', backdropFilter: 'blur(12px)', border: '2px solid rgba(200,30,30,0.6)' }}>
          <div className="text-3xl mb-1">🎯</div>
          <div className="text-red-300 font-black text-lg">Shooting Range!</div>
          <div className="text-white/70 text-sm mb-2">Shoot targets · 45 seconds · High score!</div>
          <div className="text-yellow-300 text-sm font-bold">Press <kbd className="px-2 py-0.5 rounded bg-white/10 font-mono">E</kbd> to play</div>
        </div>
      )}

      {/* Controls bar */}
      {soccerPhase === 'none' && shootingPhase === 'none' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl text-center"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="text-white/60 text-xs flex gap-3 flex-wrap justify-center">
            <span>⬆️⬇️⬅️➡️ Move</span>
            <span>Shift Run</span>
            <span>Space Jump</span>
            <span>F 💥 Shoot</span>
            <span>E 🍉 Eat</span>
            <span>Z 😴 Sleep</span>
            <span className="text-yellow-400">🏁 Race: NE</span>
            <span className="text-green-400">⚽ Soccer: W</span>
            <span className="text-red-400">🎯 Range: S</span>
          </div>
        </div>
      )}

      {/* Warnings */}
      {health < 25 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-400 font-black text-2xl animate-pulse" style={{ textShadow: '0 0 20px red' }}>
          ❤️ CRITICAL HEALTH!
        </div>
      )}
      {hunger < 20 && (
        <div className="absolute bottom-36 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-orange-300 font-bold animate-pulse" style={{ background: 'rgba(0,0,0,0.6)' }}>
          🍽️ Hungry! Find food!
        </div>
      )}
    </div>
  );
}
