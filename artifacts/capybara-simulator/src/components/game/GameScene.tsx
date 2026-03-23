import { Canvas } from '@react-three/fiber';
import { Suspense, useState } from 'react';
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

function NoWebGLFallback() {
  return (
    <div className="fixed inset-0 flex items-center justify-center text-center px-8"
      style={{ background: 'linear-gradient(135deg, #1a3a1a, #2d5a1e)' }}>
      <div>
        <div className="text-7xl mb-4">🦫</div>
        <h1 className="text-white text-2xl font-bold mb-3">Capybara Simulator 3D</h1>
        <p className="text-green-300 mb-2">Your browser doesn't support WebGL 3D graphics.</p>
        <p className="text-white/60 text-sm">Try opening this in Chrome, Firefox, or Safari on a device with GPU support.</p>
      </div>
    </div>
  );
}

export function GameScene() {
  const { phase, racePhase } = useGameStore();
  const [webglError, setWebglError] = useState(false);
  const racing = racePhase === 'countdown' || racePhase === 'racing';

  if (webglError) return <NoWebGLFallback />;

  return (
    <div className="fixed inset-0" style={{ touchAction: 'none' }}>
      <Canvas
        camera={{ position: [0, 6, -12], fov: 65, near: 0.3, far: 220 }}
        gl={{ antialias: false, powerPreference: 'high-performance', precision: 'mediump' }}
        dpr={[1, 1.5]}
        onCreated={({ gl }) => { if (!gl.getContext()) setWebglError(true); }}
        onError={() => setWebglError(true)}
      >
        <Suspense fallback={null}>
          <GameLoop />
          <SkyBox />
          <World />
          {phase === 'playing' && (
            <>
              {/* Hide the walking capybara during races — RaceTrack renders a kart instead */}
              {!racing && <Capybara />}
              <Enemies />
              <Bullets />
              <FriendCapybaras />
              <ParticleEffects />
              <RaceTrack />
            </>
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
