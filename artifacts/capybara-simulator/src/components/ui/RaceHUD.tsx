import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';

const ORDINALS = ['', '1st', '2nd', '3rd', '4th'];
const MEDALS   = ['', '🥇', '🥈', '🥉', '💀'];
const PLACE_COLORS = ['', '#FFD700', '#C0C0C0', '#CD7F32', '#FF4444'];
const POINTS_TABLE = [500, 300, 150, 50];

function CountdownOverlay({ value }: { value: number }) {
  const label = value > 0 ? String(Math.ceil(value)) : 'GO!';
  const isGo  = value <= 0;
  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center',
      justifyContent: 'center', pointerEvents: 'none', zIndex: 200,
    }}>
      <div style={{
        fontSize: isGo ? '8rem' : '10rem',
        fontWeight: 900,
        fontFamily: 'Impact, system-ui, sans-serif',
        color: isGo ? '#44FF44' : '#FFD700',
        textShadow: isGo
          ? '0 0 40px #44FF44, 0 4px 8px #000'
          : '0 0 40px #FFD700, 0 4px 8px #000',
        animation: 'pulse 0.5s ease-out',
      }}>
        {label}
      </div>
    </div>
  );
}

export function RaceHUD() {
  const { racePhase, racePosition, racePointsEarned, dismissRace, startRace } = useGameStore();

  // Live countdown mirror (the actual logic is in RaceTrack, this just reads it)
  const [countdown, setCountdown] = useState(3);
  const cdRef = useRef(3.0);
  const timerRef = useRef(0);
  const [raceTime, setRaceTime] = useState(0);
  const lastTs = useRef(0);

  useEffect(() => {
    if (racePhase === 'countdown') {
      cdRef.current = 3.0;
      setCountdown(3);
    }
    if (racePhase === 'racing') {
      timerRef.current = 0;
      setRaceTime(0);
      lastTs.current = performance.now();
    }
  }, [racePhase]);

  useEffect(() => {
    let raf: number;
    const loop = (ts: number) => {
      const dt = (ts - (lastTs.current || ts)) / 1000;
      lastTs.current = ts;
      if (racePhase === 'countdown') {
        cdRef.current = Math.max(0, cdRef.current - dt);
        setCountdown(cdRef.current);
      }
      if (racePhase === 'racing') {
        timerRef.current += dt;
        setRaceTime(timerRef.current);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [racePhase]);

  // Dismiss on Enter after finish
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Enter' && racePhase === 'finished') dismissRace();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [racePhase, dismissRace]);

  if (racePhase === 'none') return null;

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}.${String(Math.floor((s % 1) * 10))}`;

  return (
    <>
      <style>{`@keyframes pulse { 0%{transform:scale(1.3)} 100%{transform:scale(1)} }
      @keyframes slideUp { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }`}</style>

      {/* ── ENTER PROMPT ── */}
      {racePhase === 'prompt' && (
        <div style={{
          position: 'fixed', bottom: 180, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)',
          border: '2px solid #FFD700', borderRadius: 20, padding: '18px 36px',
          textAlign: 'center', pointerEvents: 'none', zIndex: 200,
          animation: 'slideUp 0.3s ease-out',
        }}>
          <div style={{ fontSize: '2rem' }}>🏁</div>
          <div style={{ color: '#FFD700', fontWeight: 900, fontSize: '1.3rem', letterSpacing: 2 }}>RACE ZONE</div>
          <div style={{ color: 'white', fontWeight: 700, marginTop: 6 }}>Press <kbd style={{
            background: '#333', border: '1px solid #666', borderRadius: 6, padding: '2px 10px',
            fontFamily: 'monospace', color: '#FFD700',
          }}>ENTER</kbd> to race!</div>
          <div style={{ color: '#aaa', fontSize: '0.78rem', marginTop: 4 }}>
            🥇 1st = 500pts  🥈 2nd = 300pts  🥉 3rd = 150pts
          </div>
        </div>
      )}

      {/* ── COUNTDOWN ── */}
      {racePhase === 'countdown' && <CountdownOverlay value={countdown} />}

      {/* ── RACING HUD ── */}
      {racePhase === 'racing' && (
        <>
          {/* Race banner */}
          <div style={{
            position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)',
            border: '2px solid #FF4500', borderRadius: 16, padding: '8px 28px',
            display: 'flex', gap: 24, alignItems: 'center', pointerEvents: 'none', zIndex: 200,
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#FF4500', fontSize: '0.65rem', fontWeight: 700, letterSpacing: 2 }}>🏎 RACE</div>
              <div style={{ color: 'white', fontWeight: 900, fontSize: '1.4rem' }}>⏱ {fmtTime(raceTime)}</div>
            </div>
          </div>

          {/* Position badge */}
          <div style={{
            position: 'fixed', top: 100, right: 18,
            background: 'rgba(0,0,0,0.8)', borderRadius: 16,
            border: `3px solid ${PLACE_COLORS[racePosition] || '#888'}`,
            padding: '10px 18px', textAlign: 'center',
            pointerEvents: 'none', zIndex: 200,
          }}>
            <div style={{ color: '#aaa', fontSize: '0.65rem', fontWeight: 700, letterSpacing: 2 }}>POSITION</div>
            <div style={{
              color: PLACE_COLORS[racePosition] || '#fff',
              fontSize: '2.8rem', fontWeight: 900, lineHeight: 1,
              textShadow: `0 0 14px ${PLACE_COLORS[racePosition] || '#888'}`,
            }}>
              {ORDINALS[racePosition]}
            </div>
          </div>

          {/* Controls reminder */}
          <div style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.6)', borderRadius: 14, padding: '8px 22px',
            color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem', pointerEvents: 'none', zIndex: 200,
          }}>
            ⬆️ Accelerate &nbsp;|&nbsp; ⬇️ Brake &nbsp;|&nbsp; ⬅️➡️ Steer
          </div>
        </>
      )}

      {/* ── FINISH SCREEN ── */}
      {racePhase === 'finished' && (
        <div style={{
          position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(16px)', zIndex: 300, pointerEvents: 'all',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(20,20,40,0.98), rgba(40,20,10,0.98))',
            border: `3px solid ${PLACE_COLORS[racePosition] || '#888'}`,
            borderRadius: 28, padding: '44px 60px', textAlign: 'center',
            boxShadow: `0 0 60px ${PLACE_COLORS[racePosition] || '#888'}88`,
            animation: 'slideUp 0.5s ease-out',
            minWidth: 340,
          }}>
            <div style={{ fontSize: '4rem', marginBottom: 8 }}>{MEDALS[racePosition]}</div>
            <div style={{
              color: PLACE_COLORS[racePosition] || '#fff',
              fontSize: '3rem', fontWeight: 900, fontFamily: 'Impact, sans-serif',
              textShadow: `0 0 20px ${PLACE_COLORS[racePosition] || '#888'}`,
            }}>
              {ORDINALS[racePosition]} PLACE
            </div>

            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', marginTop: 4 }}>
              Time: {fmtTime(raceTime)}
            </div>

            <div style={{
              margin: '24px 0 20px',
              background: 'rgba(255,255,255,0.07)', borderRadius: 16, padding: '16px 24px',
            }}>
              <div style={{ color: '#FFD700', fontSize: '0.8rem', fontWeight: 700, letterSpacing: 3, marginBottom: 6 }}>
                POINTS EARNED
              </div>
              <div style={{
                color: '#FFD700', fontSize: '3.5rem', fontWeight: 900,
                textShadow: '0 0 20px #FFD700',
              }}>
                +{racePointsEarned}
              </div>
            </div>

            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', marginBottom: 20 }}>
              {racePosition === 1
                ? '🎉 Incredible! You dominated the race!'
                : racePosition === 2
                ? '💪 So close! You almost had it!'
                : racePosition === 3
                ? '😅 Not bad — you placed on the podium!'
                : '😬 Train harder and try again!'}
            </div>

            <button
              onClick={dismissRace}
              style={{
                background: 'linear-gradient(135deg, #FF8C00, #FF4500)',
                border: 'none', borderRadius: 14, padding: '14px 42px',
                color: 'white', fontWeight: 900, fontSize: '1.1rem', cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(255,140,0,0.5)',
                letterSpacing: 1,
              }}
            >
              🌍 Back to World
            </button>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginTop: 10 }}>
              or press Enter
            </div>
          </div>
        </div>
      )}
    </>
  );
}
