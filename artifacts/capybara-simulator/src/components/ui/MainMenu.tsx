import { useGameStore } from '../../store/gameStore';

export function MainMenu() {
  const { phase, startGame, score, bestScore, totalPlays, killCount, foodCollected } = useGameStore();

  if (phase !== 'menu' && phase !== 'dead') return null;

  const isDead = phase === 'dead';

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        background: isDead
          ? 'linear-gradient(135deg, #1a0a0a 0%, #3d0f0f 50%, #1a0808 100%)'
          : 'linear-gradient(135deg, #1a3a1a 0%, #2d5a1e 40%, #1a4a2e 70%, #0f2a18 100%)',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-15 animate-pulse"
            style={{
              width: `${20 + Math.sin(i * 2.3) * 15}px`,
              height: `${20 + Math.sin(i * 2.3) * 15}px`,
              left: `${(i * 7 + 5) % 95}%`,
              top: `${(i * 11 + 3) % 90}%`,
              background: isDead
                ? ['#FF4444', '#CC0000', '#FF8800'][i % 3]
                : ['#4CAF50', '#8BC34A', '#FFD700', '#FF9800'][i % 4],
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative text-center px-8 py-10 max-w-md w-full mx-4">
        {/* Header */}
        <div className="mb-5">
          <div className="text-6xl mb-2" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}>
            {isDead ? '💀' : '🦫'}
          </div>
          <h1 className="text-4xl font-black text-white mb-1" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.8)', letterSpacing: '-1px' }}>
            {isDead ? 'You Died!' : 'Capybara'}
          </h1>
          <h2 className="text-2xl font-bold" style={{ color: isDead ? '#FF4444' : '#8BC34A', letterSpacing: '3px' }}>
            {isDead ? 'DEFEATED BY ENEMIES' : 'SIMULATOR 3D'}
          </h2>
          {!isDead && <p className="text-green-300/60 text-sm mt-1 italic">The most addictive capybara game ever made</p>}
        </div>

        {/* Stats panel */}
        {(totalPlays > 0) && (
          <div
            className="mb-5 px-4 py-3 rounded-2xl grid grid-cols-3 gap-2"
            style={{ background: 'rgba(0,0,0,0.45)', border: `1px solid ${isDead ? 'rgba(255,50,50,0.3)' : 'rgba(139,197,74,0.3)'}` }}
          >
            <div className="text-center">
              <div className="text-yellow-300 font-bold text-lg">{Math.floor(isDead ? score : bestScore).toLocaleString()}</div>
              <div className="text-white/50 text-xs">{isDead ? 'Score' : 'Best Score'}</div>
            </div>
            <div className="text-center">
              <div className="text-red-400 font-bold text-lg">{killCount}</div>
              <div className="text-white/50 text-xs">Kills</div>
            </div>
            <div className="text-center">
              <div className="text-green-300 font-bold text-lg">{foodCollected}</div>
              <div className="text-white/50 text-xs">Food Eaten</div>
            </div>
          </div>
        )}

        {/* Play button */}
        <button
          onClick={startGame}
          className="w-full py-4 rounded-2xl text-white font-black text-xl mb-3 transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: isDead
              ? 'linear-gradient(135deg, #CC2222, #FF4444)'
              : 'linear-gradient(135deg, #4CAF50, #8BC34A)',
            boxShadow: isDead
              ? '0 6px 24px rgba(204,34,34,0.5),0 2px 4px rgba(0,0,0,0.3)'
              : '0 6px 24px rgba(76,175,80,0.5),0 2px 4px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          {isDead ? '🔄 Try Again' : totalPlays === 0 ? '🌿 Start Adventure' : '🌿 Play Again'}
        </button>

        {/* Features (only on main menu) */}
        {!isDead && (
          <>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { icon: '🏊', label: 'Swim & Relax' },
                { icon: '🍉', label: 'Eat & Heal' },
                { icon: '💥', label: 'Shoot Enemies' },
              ].map(({ icon, label }) => (
                <div key={label} className="px-2 py-3 rounded-xl text-center" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="text-2xl mb-1">{icon}</div>
                  <div className="text-white/70 text-xs">{label}</div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="text-white/50 text-xs text-center mb-2 uppercase tracking-widest">Controls</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-white/70">
                <span>WASD / ⬆️⬇️⬅️➡️ — Move</span>
                <span>Shift — Run</span>
                <span>Space / F — 💥 Shoot</span>
                <span>E — Eat 🍉</span>
                <span>Z — Sleep 😴</span>
                <span>Walk into water — Swim</span>
              </div>
            </div>
          </>
        )}

        {isDead && bestScore > 0 && score >= bestScore && (
          <div className="mt-3 text-yellow-300 font-bold animate-pulse">🏆 New High Score!</div>
        )}
      </div>
    </div>
  );
}
