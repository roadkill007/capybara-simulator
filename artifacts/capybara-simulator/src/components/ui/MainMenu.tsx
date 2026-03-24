import { Fragment } from 'react';
import { useGameStore } from '../../store/gameStore';

const FEATURES = [
  { icon: '🏊', label: 'Swim', sub: 'Relax in ponds' },
  { icon: '🍉', label: 'Eat', sub: 'Heal & grow' },
  { icon: '💥', label: 'Shoot', sub: 'Blast enemies' },
  { icon: '🏎️', label: 'Race', sub: 'Beat rivals' },
  { icon: '🌿', label: 'Explore', sub: 'Open world' },
  { icon: '⚡', label: 'Giant', sub: 'Power up' },
];

const CONTROLS = [
  ['WASD / Arrows', 'Move'],
  ['Shift', 'Run'],
  ['Space / F', 'Shoot'],
  ['E', 'Eat 🍉'],
  ['Z', 'Sleep 😴'],
  ['Scroll', 'Zoom camera'],
];

export function MainMenu() {
  const { phase, startGame, score, bestScore, totalPlays, killCount, foodCollected } = useGameStore();

  if (phase !== 'menu' && phase !== 'dead') return null;

  const isDead = phase === 'dead';
  const hasStats = totalPlays > 0;

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: isDead
          ? 'linear-gradient(160deg, #0f0808 0%, #2a0a0a 50%, #1a0505 100%)'
          : 'linear-gradient(160deg, #071a0e 0%, #0d2e18 40%, #0a2215 70%, #061408 100%)',
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Animated background blobs */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {[
          { x: '10%', y: '15%', size: 280, color: isDead ? '#FF222220' : '#16A34A20', delay: '0s' },
          { x: '75%', y: '60%', size: 200, color: isDead ? '#CC000018' : '#22C55E18', delay: '1.5s' },
          { x: '50%', y: '85%', size: 160, color: isDead ? '#FF440015' : '#4ADE8015', delay: '0.8s' },
          { x: '85%', y: '10%', size: 120, color: isDead ? '#FF000012' : '#86EFAC12', delay: '2s' },
        ].map((blob, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: blob.x, top: blob.y,
            width: blob.size, height: blob.size,
            borderRadius: '50%',
            background: blob.color,
            filter: 'blur(60px)',
            animation: `blobPulse 4s ease-in-out infinite`,
            animationDelay: blob.delay,
            transform: 'translate(-50%, -50%)',
          }} />
        ))}
      </div>

      <style>{`
        @keyframes blobPulse {
          0%, 100% { opacity: 0.6; transform: translate(-50%,-50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%,-50%) scale(1.12); }
        }
        @keyframes floatUp {
          0% { opacity: 0; transform: translateY(24px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes capyBounce {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      {/* Main card */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 460,
        margin: '0 auto',
        padding: '32px 24px 28px',
        animation: 'floatUp 0.5s ease-out both',
      }}>

        {/* ── HEADER ── */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            fontSize: '5rem', lineHeight: 1,
            animation: 'capyBounce 2.4s ease-in-out infinite',
            display: 'inline-block',
            filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.6))',
          }}>
            {isDead ? '💀' : '🦫'}
          </div>

          <h1 style={{
            margin: '10px 0 2px',
            fontSize: 'clamp(2rem, 7vw, 2.8rem)',
            fontWeight: 900,
            letterSpacing: '-1px',
            color: 'white',
            textShadow: '0 4px 20px rgba(0,0,0,0.8)',
          }}>
            {isDead ? 'You Died!' : 'Capybara'}
          </h1>
          <div style={{
            fontSize: 'clamp(0.95rem, 3.5vw, 1.25rem)',
            fontWeight: 800,
            letterSpacing: '4px',
            textTransform: 'uppercase',
            background: isDead
              ? 'linear-gradient(90deg, #FF4444, #FF8800, #FF4444)'
              : 'linear-gradient(90deg, #4ADE80, #86EFAC, #22C55E, #86EFAC, #4ADE80)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'shimmer 3s linear infinite',
          }}>
            {isDead ? 'DEFEATED' : 'SIMULATOR 3D'}
          </div>
          {!isDead && (
            <p style={{ color: 'rgba(134,239,172,0.5)', fontSize: '0.8rem', marginTop: 4, fontStyle: 'italic' }}>
              The most addictive capybara game ever made
            </p>
          )}
        </div>

        {/* ── STATS (shown after first play) ── */}
        {hasStats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            marginBottom: 20,
            padding: '14px 12px',
            borderRadius: 16,
            background: 'rgba(255,255,255,0.04)',
            border: isDead ? '1px solid rgba(255,80,80,0.2)' : '1px solid rgba(74,222,128,0.2)',
          }}>
            {[
              { value: Math.floor(isDead ? score : bestScore).toLocaleString(), label: isDead ? 'Score' : 'Best', color: '#FDE047' },
              { value: killCount, label: 'Kills', color: '#F87171' },
              { value: foodCollected, label: 'Fed', color: '#86EFAC' },
            ].map(({ value, label, color }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ color, fontWeight: 900, fontSize: 'clamp(1.1rem, 4vw, 1.4rem)', lineHeight: 1 }}>{value}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── PLAY BUTTON ── */}
        <button
          onClick={startGame}
          style={{
            display: 'block',
            width: '100%',
            padding: '16px 0',
            borderRadius: 18,
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'white',
            fontWeight: 900,
            fontSize: 'clamp(1rem, 4vw, 1.2rem)',
            letterSpacing: 1,
            cursor: 'pointer',
            marginBottom: 16,
            background: isDead
              ? 'linear-gradient(135deg, #991B1B, #DC2626, #991B1B)'
              : 'linear-gradient(135deg, #15803D, #22C55E, #16A34A)',
            boxShadow: isDead
              ? '0 6px 32px rgba(220,38,38,0.45), inset 0 1px 0 rgba(255,255,255,0.1)'
              : '0 6px 32px rgba(34,197,94,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
            transition: 'transform 0.12s, box-shadow 0.12s',
          }}
          onMouseEnter={e => { (e.target as HTMLElement).style.transform = 'scale(1.02)'; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.transform = 'scale(1)'; }}
          onMouseDown={e => { (e.target as HTMLElement).style.transform = 'scale(0.97)'; }}
          onMouseUp={e => { (e.target as HTMLElement).style.transform = 'scale(1.02)'; }}
        >
          {isDead ? '🔄 Try Again' : totalPlays === 0 ? '🌿 Start Adventure' : '🌿 Play Again'}
        </button>

        {/* ── FEATURES grid (first menu only) ── */}
        {!isDead && (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
              marginBottom: 14,
            }}>
              {FEATURES.map(({ icon, label, sub }) => (
                <div key={label} style={{
                  textAlign: 'center',
                  padding: '10px 6px',
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <div style={{ fontSize: '1.6rem', marginBottom: 2 }}>{icon}</div>
                  <div style={{ color: 'white', fontWeight: 700, fontSize: '0.78rem' }}>{label}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>{sub}</div>
                </div>
              ))}
            </div>

            {/* Controls */}
            <div style={{
              padding: '12px 14px',
              borderRadius: 14,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}>
              <div style={{
                color: 'rgba(255,255,255,0.35)',
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                letterSpacing: 2,
                marginBottom: 8,
                textAlign: 'center',
              }}>Controls</div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: '4px 12px',
                alignItems: 'center',
              }}>
                {CONTROLS.map(([key, action]) => (
                  <Fragment key={key}>
                    <kbd style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 6,
                      padding: '2px 7px',
                      fontSize: '0.68rem',
                      fontFamily: 'monospace',
                      color: '#FDE047',
                      whiteSpace: 'nowrap',
                      justifySelf: 'start',
                    }}>{key}</kbd>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.72rem' }}>{action}</span>
                  </Fragment>
                ))}
              </div>
            </div>
          </>
        )}

        {/* High score badge */}
        {isDead && bestScore > 0 && score >= bestScore && (
          <div style={{
            marginTop: 14,
            textAlign: 'center',
            color: '#FDE047',
            fontWeight: 800,
            fontSize: '1rem',
            animation: 'blobPulse 1.2s ease-in-out infinite',
          }}>
            🏆 New High Score!
          </div>
        )}

        {/* Mobile note */}
        <p style={{
          textAlign: 'center',
          color: 'rgba(255,255,255,0.2)',
          fontSize: '0.65rem',
          marginTop: 16,
        }}>
          📱 Mobile: use joystick — pinch to zoom camera
        </p>
      </div>
    </div>
  );
}
