import { useRef, useCallback, useEffect, useState } from 'react';
import { mobileInput } from '../game/mobileInput';

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth <= 900 || navigator.maxTouchPoints > 0);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return mobile;
}

interface JoystickState {
  active: boolean;
  startX: number;
  startY: number;
  dx: number;
  dy: number;
}

const BTN_CONFIGS = [
  { key: 'jump',  label: '⬆\nJump',   color: '#4CAF50' },
  { key: 'shoot', label: '🔫\nShoot',  color: '#F44336' },
  { key: 'run',   label: '💨\nRun',    color: '#FF9800' },
  { key: 'eat',   label: '🍉\nEat',    color: '#9C27B0' },
  { key: 'sleep', label: '😴\nSleep',  color: '#2196F3' },
];

export function MobileControls() {
  const isMobile = useIsMobile();
  const joystickRef = useRef<JoystickState>({ active: false, startX: 0, startY: 0, dx: 0, dy: 0 });
  const knobRef = useRef<HTMLDivElement>(null);
  const [pressed, setPressed] = useState<Record<string, boolean>>({});

  const onJoystickStart = useCallback((e: React.TouchEvent | React.PointerEvent) => {
    e.preventDefault();
    const touch = 'touches' in e ? e.touches[0] : e;
    joystickRef.current = { active: true, startX: touch.clientX, startY: touch.clientY, dx: 0, dy: 0 };
  }, []);

  const onJoystickMove = useCallback((e: React.TouchEvent | React.PointerEvent) => {
    if (!joystickRef.current.active) return;
    e.preventDefault();
    const touch = 'touches' in e ? e.touches[0] : e;
    const dx = touch.clientX - joystickRef.current.startX;
    const dy = touch.clientY - joystickRef.current.startY;
    const maxR = 48;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clamped = Math.min(dist, maxR);
    const angle = Math.atan2(dy, dx);
    const cx = Math.cos(angle) * clamped;
    const cy = Math.sin(angle) * clamped;
    joystickRef.current.dx = cx;
    joystickRef.current.dy = cy;
    mobileInput.joystickX = cx / maxR;
    mobileInput.joystickY = -cy / maxR;
    if (knobRef.current) {
      knobRef.current.style.transform = `translate(calc(-50% + ${cx}px), calc(-50% + ${cy}px))`;
    }
  }, []);

  const onJoystickEnd = useCallback(() => {
    joystickRef.current.active = false;
    joystickRef.current.dx = 0;
    joystickRef.current.dy = 0;
    mobileInput.joystickX = 0;
    mobileInput.joystickY = 0;
    if (knobRef.current) {
      knobRef.current.style.transform = 'translate(-50%, -50%)';
    }
  }, []);

  const onBtnDown = useCallback((key: string) => {
    (mobileInput as any)[key] = true;
    setPressed(p => ({ ...p, [key]: true }));
    if (key === 'jump') {
      setTimeout(() => {
        (mobileInput as any)[key] = false;
        setPressed(p => ({ ...p, [key]: false }));
      }, 120);
    }
  }, []);

  const onBtnUp = useCallback((key: string) => {
    if (key !== 'jump') {
      (mobileInput as any)[key] = false;
      setPressed(p => ({ ...p, [key]: false }));
    }
  }, []);

  if (!isMobile) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none',
      zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      padding: '0 24px 28px',
    }}>
      {/* Left: Virtual joystick */}
      <div
        style={{
          width: 120, height: 120, borderRadius: '50%',
          background: 'rgba(255,255,255,0.12)',
          border: '2px solid rgba(255,255,255,0.35)',
          position: 'relative', pointerEvents: 'all', touchAction: 'none',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}
        onPointerDown={onJoystickStart}
        onPointerMove={onJoystickMove}
        onPointerUp={onJoystickEnd}
        onPointerLeave={onJoystickEnd}
      >
        <div
          ref={knobRef}
          style={{
            position: 'absolute', top: '50%', left: '50%',
            width: 48, height: 48, borderRadius: '50%',
            background: 'rgba(255,255,255,0.55)',
            border: '2px solid rgba(255,255,255,0.8)',
            transform: 'translate(-50%, -50%)',
            transition: joystickRef.current.active ? 'none' : 'transform 0.15s ease',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Right: Action buttons grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, pointerEvents: 'all' }}>
        {BTN_CONFIGS.map(({ key, label, color }) => (
          <button
            key={key}
            onPointerDown={() => onBtnDown(key)}
            onPointerUp={() => onBtnUp(key)}
            onPointerLeave={() => onBtnUp(key)}
            style={{
              width: 68, height: 68, borderRadius: 16,
              background: pressed[key]
                ? color
                : `${color}88`,
              border: `2px solid ${color}`,
              color: 'white',
              fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
              cursor: 'pointer', touchAction: 'none',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              boxShadow: pressed[key] ? `0 0 14px ${color}` : '0 2px 8px rgba(0,0,0,0.4)',
              transform: pressed[key] ? 'scale(0.93)' : 'scale(1)',
              transition: 'transform 0.08s, background 0.1s, box-shadow 0.1s',
              lineHeight: 1.3, whiteSpace: 'pre',
              userSelect: 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
