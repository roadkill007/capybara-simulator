import { Canvas } from '@react-three/fiber';
import { Suspense, useState, Component, type ReactNode } from 'react';
import * as THREE from 'three';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { World } from './World';
import { Capybara } from './Capybara';
import { SkyBox } from './SkyBox';
import { FriendCapybaras } from './FriendCapybaras';
import { ParticleEffects } from './ParticleEffects';
import { GameLoop } from './GameLoop';
import { Enemies } from './Enemies';
import { Bullets } from './Bullets';
import { RaceTrack } from './RaceTrack';
import { useGameStore } from '../../store/gameStore';

// ── Pre-flight WebGL check ────────────────────────────────────────────────────
// Test WebGL support via a throw-away canvas *before* Three.js tries to create
// its own renderer, so the Vite error overlay never fires.
function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('webgl2') ?? canvas.getContext('webgl') ?? canvas.getContext('experimental-webgl');
    if (!ctx) return false;
    // Make sure the context is valid and not lost
    const gl = ctx as WebGLRenderingContext;
    return !gl.isContextLost();
  } catch {
    return false;
  }
}

// ── No-WebGL fallback UI ───────────────────────────────────────────────────────
function NoWebGLFallback() {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center text-center px-8"
      style={{ background: 'linear-gradient(135deg, #071a0e, #0d2e18)' }}
    >
      <div>
        <div className="text-7xl mb-4">🦫</div>
        <h1 className="text-white text-2xl font-bold mb-3">Capybara Simulator 3D</h1>
        <p className="text-green-300 mb-2">3D graphics aren't available on this device or browser.</p>
        <p className="text-white/60 text-sm">
          Try Chrome or Firefox on a desktop with a GPU — your capybara awaits!
        </p>
      </div>
    </div>
  );
}

// ── React error boundary — catches Three.js / R3F runtime errors silently ────
interface EBState { crashed: boolean; }
class SceneErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { crashed: false };

  static getDerivedStateFromError() {
    return { crashed: true };
  }

  componentDidCatch(err: Error) {
    // Log to console without re-throwing (keeps Vite overlay silent)
    console.warn('[Capybara] 3D scene error caught:', err.message);
  }

  render() {
    if (this.state.crashed) return <NoWebGLFallback />;
    return this.props.children;
  }
}

// ── 3D scene contents ─────────────────────────────────────────────────────────
function SceneContents() {
  const { phase, racePhase } = useGameStore();
  const racing = racePhase === 'countdown' || racePhase === 'racing';

  return (
    <>
      <GameLoop />
      <SkyBox />
      <World />
      {phase === 'playing' && (
        <>
          {!racing && <Capybara />}
          <Enemies />
          <Bullets />
          <FriendCapybaras />
          <ParticleEffects />
          <RaceTrack />
        </>
      )}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.75}
          luminanceSmoothing={0.4}
          intensity={0.55}
          blendFunction={BlendFunction.ADD}
        />
        <Vignette
          offset={0.25}
          darkness={0.45}
          blendFunction={BlendFunction.NORMAL}
        />
      </EffectComposer>
    </>
  );
}

// ── Main GameScene export ──────────────────────────────────────────────────────
export function GameScene() {
  const [webglAvailable] = useState(() => supportsWebGL());

  if (!webglAvailable) return <NoWebGLFallback />;

  return (
    <SceneErrorBoundary>
      <div className="fixed inset-0" style={{ touchAction: 'none' }}>
        <Canvas
          shadows={{ type: THREE.PCFSoftShadowMap }}
          camera={{ position: [0, 6, -12], fov: 60, near: 0.3, far: 220 }}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.15,
            failIfMajorPerformanceCaveat: false,
          }}
          dpr={[1, 2]}
        >
          <Suspense fallback={null}>
            <SceneContents />
          </Suspense>
        </Canvas>
      </div>
    </SceneErrorBoundary>
  );
}
