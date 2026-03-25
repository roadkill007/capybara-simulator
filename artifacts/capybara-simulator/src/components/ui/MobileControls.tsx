import { useRef, useCallback, useEffect, useState } from 'react';
import { mobileInput } from '../game/mobileInput';

// ── Mobile detection ─────────────────────────────────────────────────────────
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

// ── Action button — each button independently captures its pointer ────────────
interface ActionBtnProps {
  label: string;
  color: string;
  size?: number;
  onPress: () => void;
  onRelease: () => void;
  style?: React.CSSProperties;
}

function ActionBtn({ label, color, size = 58, onPress, onRelease, style }: ActionBtnProps) {
  const [pressed, setPressed] = useState(false);
  const divRef = useRef<HTMLDivElement>(null);

  const handleDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    divRef.current?.setPointerCapture(e.pointerId);
    setPressed(true);
    onPress();
  }, [onPress]);

  const handleUp = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPressed(false);
    onRelease();
  }, [onRelease]);

  return (
    <div
      ref={divRef}
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
      style={{
        width: size, height: size, borderRadius: '50%',
        background: pressed
          ? `radial-gradient(circle, ${color}EE 60%, ${color}99)`
          : `radial-gradient(circle, ${color}99 60%, ${color}55)`,
        border: `2.5px solid ${pressed ? color + 'FF' : color + 'AA'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        touchAction: 'none', pointerEvents: 'all',
        userSelect: 'none', WebkitUserSelect: 'none',
        boxShadow: pressed
          ? `0 0 14px ${color}88, inset 0 2px 4px rgba(0,0,0,0.4)`
          : `0 4px 12px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.15)`,
        transform: pressed ? 'scale(0.92)' : 'scale(1)',
        transition: 'transform 0.07s, box-shadow 0.07s, background 0.07s',
        flexShrink: 0,
        ...style,
      }}
    >
      <span style={{
        color: 'white',
        fontSize: size < 52 ? 10 : 12,
        fontWeight: 700,
        textAlign: 'center',
        lineHeight: 1.1,
        textShadow: '0 1px 3px rgba(0,0,0,0.8)',
        letterSpacing: 0.3,
        pointerEvents: 'none',
      }}>
        {label}
      </span>
    </div>
  );
}

// ── Enter / mini-game button (pill shape) ─────────────────────────────────────
function EnterBtn() {
  const [pressed, setPressed] = useState(false);
  const divRef = useRef<HTMLDivElement>(null);

  const fire = useCallback(() => {
    // Simulate Enter & E key press for mini-game prompts
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', key: 'Enter', bubbles: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e', code: 'KeyE', bubbles: true }));
    setTimeout(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Enter', key: 'Enter', bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'e', code: 'KeyE', bubbles: true }));
    }, 100);
  }, []);

  return (
    <div
      ref={divRef}
      onPointerDown={(e) => {
        e.preventDefault();
        divRef.current?.setPointerCapture(e.pointerId);
        setPressed(true);
        fire();
      }}
      onPointerUp={(e) => { e.preventDefault(); setPressed(false); }}
      onPointerCancel={() => setPressed(false)}
      style={{
        height: 36, borderRadius: 18,
        padding: '0 18px',
        background: pressed ? 'rgba(255,220,50,0.85)' : 'rgba(255,200,0,0.6)',
        border: '2px solid rgba(255,220,50,0.9)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        touchAction: 'none', pointerEvents: 'all',
        userSelect: 'none', WebkitUserSelect: 'none',
        boxShadow: pressed ? '0 0 12px rgba(255,220,0,0.6)' : '0 3px 10px rgba(0,0,0,0.4)',
        transform: pressed ? 'scale(0.93)' : 'scale(1)',
        transition: 'all 0.07s',
      }}
    >
      <span style={{
        color: '#1a1000', fontSize: 11, fontWeight: 800,
        letterSpacing: 0.5, textTransform: 'uppercase', pointerEvents: 'none',
      }}>
        ENTER / E
      </span>
    </div>
  );
}

// ── Virtual joystick ──────────────────────────────────────────────────────────
function Joystick() {
  const joystickRef = useRef({ active: false, startX: 0, startY: 0, ptId: -1 });
  const knobRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLDivElement>(null);

  const onDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    baseRef.current?.setPointerCapture(e.pointerId);
    joystickRef.current = { active: true, startX: e.clientX, startY: e.clientY, ptId: e.pointerId };
  }, []);

  const onMove = useCallback((e: React.PointerEvent) => {
    if (!joystickRef.current.active || e.pointerId !== joystickRef.current.ptId) return;
    e.preventDefault();
    const dx = e.clientX - joystickRef.current.startX;
    const dy = e.clientY - joystickRef.current.startY;
    const maxR = 48;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clamped = Math.min(dist, maxR);
    const angle = Math.atan2(dy, dx);
    const cx = Math.cos(angle) * clamped;
    const cy = Math.sin(angle) * clamped;
    mobileInput.joystickX = cx / maxR;
    mobileInput.joystickY = -cy / maxR;
    if (knobRef.current) {
      knobRef.current.style.transform = `translate(calc(-50% + ${cx}px), calc(-50% + ${cy}px))`;
    }
  }, []);

  const onUp = useCallback(() => {
    joystickRef.current.active = false;
    mobileInput.joystickX = 0;
    mobileInput.joystickY = 0;
    if (knobRef.current) {
      knobRef.current.style.transform = 'translate(-50%, -50%)';
    }
  }, []);

  return (
    <div
      ref={baseRef}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      style={{
        width: 120, height: 120, borderRadius: '50%',
        background: 'rgba(255,255,255,0.10)',
        border: '2.5px solid rgba(255,255,255,0.32)',
        position: 'relative', pointerEvents: 'all', touchAction: 'none',
        boxShadow: '0 4px 24px rgba(0,0,0,0.45)',
        flexShrink: 0,
      }}
    >
      {/* Directional guides */}
      {['▲', '▼', '◀', '▶'].map((arr, i) => (
        <span key={i} style={{
          position: 'absolute',
          top: i === 0 ? 6 : i === 1 ? 'auto' : '50%',
          bottom: i === 1 ? 6 : 'auto',
          left: i === 2 ? 6 : i === 3 ? 'auto' : '50%',
          right: i === 3 ? 6 : 'auto',
          transform: (i === 0 || i === 1) ? 'translateX(-50%)' : 'translateY(-50%)',
          fontSize: 9, color: 'rgba(255,255,255,0.45)', pointerEvents: 'none',
        }}>{arr}</span>
      ))}
      <div
        ref={knobRef}
        style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 50, height: 50, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.75) 60%, rgba(255,255,255,0.35))',
          border: '2.5px solid rgba(255,255,255,0.85)',
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function MobileControls() {
  const isMobile = useIsMobile();
  if (!isMobile) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      pointerEvents: 'none',
      zIndex: 100,
    }}>
      {/* ── Left: joystick ── */}
      <div style={{
        position: 'absolute', bottom: 28, left: 24,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      }}>
        <Joystick />
        {/* Enter / E pill below joystick */}
        <EnterBtn />
      </div>

      {/* ── Right: action buttons ── */}
      <div style={{
        position: 'absolute', bottom: 24, right: 20,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      }}>
        {/* Top row: Run + Shoot */}
        <div style={{ display: 'flex', gap: 10 }}>
          <ActionBtn
            label={'RUN\n⇧'}
            color="#FF8C00"
            size={52}
            onPress={() => { mobileInput.run = true; }}
            onRelease={() => { mobileInput.run = false; }}
          />
          <ActionBtn
            label={'SHOOT\nF'}
            color="#FF3030"
            size={52}
            onPress={() => { mobileInput.shoot = true; }}
            onRelease={() => { mobileInput.shoot = false; }}
          />
        </div>

        {/* Bottom row: Eat + Sleep + Jump */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <ActionBtn
              label={'EAT\nE'}
              color="#44CC44"
              size={48}
              onPress={() => { mobileInput.eat = true; }}
              onRelease={() => { mobileInput.eat = false; }}
            />
            <ActionBtn
              label={'SLEEP\nZ'}
              color="#8855CC"
              size={48}
              onPress={() => { mobileInput.sleep = true; }}
              onRelease={() => { mobileInput.sleep = false; }}
            />
          </div>
          {/* Jump — big, dominant button */}
          <ActionBtn
            label={'JUMP\n␣'}
            color="#2196F3"
            size={78}
            onPress={() => { mobileInput.jump = true; }}
            onRelease={() => { mobileInput.jump = false; }}
          />
        </div>
      </div>
    </div>
  );
}
