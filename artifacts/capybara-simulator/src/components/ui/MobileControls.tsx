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

export function MobileControls() {
  const isMobile = useIsMobile();
  const joystickRef = useRef<JoystickState>({ active: false, startX: 0, startY: 0, dx: 0, dy: 0 });
  const knobRef = useRef<HTMLDivElement>(null);

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

  if (!isMobile) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none',
      zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start',
      padding: '0 24px 28px',
    }}>
      {/* Virtual joystick — left side only */}
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
    </div>
  );
}
