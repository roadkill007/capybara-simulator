import { useGameStore } from '../../store/gameStore';

export function MainMenu() {
  const { phase, startGame, score, bestScore, totalPlays } = useGameStore();

  if (phase !== 'menu') return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #1a3a1a 0%, #2d5a1e 40%, #1a4a2e 70%, #0f2a18 100%)',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20 animate-pulse"
            style={{
              width: `${20 + Math.sin(i * 2.3) * 15}px`,
              height: `${20 + Math.sin(i * 2.3) * 15}px`,
              left: `${(i * 7 + 5) % 95}%`,
              top: `${(i * 11 + 3) % 90}%`,
              background: ['#4CAF50', '#8BC34A', '#FFD700', '#FF9800'][i % 4],
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${2 + Math.sin(i) * 1}s`,
            }}
          />
        ))}
      </div>

      <div className="relative text-center px-8 py-10 max-w-lg w-full mx-4">
        {/* Logo area */}
        <div className="mb-4">
          <div
            className="text-7xl mb-2"
            style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}
          >
            🦫
          </div>
          <h1
            className="text-5xl font-black text-white mb-1"
            style={{
              textShadow: '0 4px 20px rgba(0,0,0,0.8), 0 0 40px rgba(139,197,74,0.4)',
              letterSpacing: '-1px',
            }}
          >
            Capybara
          </h1>
          <h2
            className="text-3xl font-bold"
            style={{
              color: '#8BC34A',
              textShadow: '0 2px 12px rgba(139,197,74,0.6)',
              letterSpacing: '4px',
            }}
          >
            SIMULATOR 3D
          </h2>
          <p className="text-green-300/60 text-sm mt-2 italic">The most relaxing game ever made</p>
        </div>

        {/* Stats if returning player */}
        {totalPlays > 0 && (
          <div
            className="mb-5 px-4 py-3 rounded-2xl grid grid-cols-2 gap-2"
            style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(139,197,74,0.3)',
            }}
          >
            <div className="text-center">
              <div className="text-yellow-300 font-bold text-xl">{Math.floor(bestScore).toLocaleString()}</div>
              <div className="text-white/50 text-xs">Best Score</div>
            </div>
            <div className="text-center">
              <div className="text-green-300 font-bold text-xl">{totalPlays}</div>
              <div className="text-white/50 text-xs">Times Played</div>
            </div>
          </div>
        )}

        {/* Play button */}
        <button
          onClick={startGame}
          className="w-full py-4 rounded-2xl text-white font-black text-xl mb-3 transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #4CAF50, #8BC34A)',
            boxShadow: '0 6px 24px rgba(76,175,80,0.5), 0 2px 4px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          {totalPlays === 0 ? '🌿 Start Adventure' : '🌿 Play Again'}
        </button>

        {/* Features */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { icon: '🏊', label: 'Swim & Relax' },
            { icon: '🍉', label: 'Eat & Grow' },
            { icon: '🌙', label: 'Day & Night' },
          ].map(({ icon, label }) => (
            <div
              key={label}
              className="px-2 py-3 rounded-xl text-center"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div className="text-2xl mb-1">{icon}</div>
              <div className="text-white/70 text-xs">{label}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div
          className="px-4 py-3 rounded-xl text-left"
          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <div className="text-white/50 text-xs text-center mb-2 uppercase tracking-widest">Controls</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-white/70">
            <span>⬆️⬇️⬅️➡️ / WASD — Move</span>
            <span>Shift — Run</span>
            <span>Space — Celebrate 🎉</span>
            <span>E — Eat 🍉</span>
            <span>Z — Sleep 😴</span>
            <span>Walk into water — Swim 🏊</span>
          </div>
        </div>
      </div>
    </div>
  );
}
