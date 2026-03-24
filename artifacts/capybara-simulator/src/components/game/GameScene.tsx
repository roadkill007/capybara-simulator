import { Canvas } from '@react-three/fiber';
import { Suspense, useState } from 'react';
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

function NoWebGLFallback() {
  return (
    <div className="fixed inset-0 flex items-center justify-center text-center px-8"
      style={{ background: 'linear-gradient(135deg, #071a0e, #0d2e18)' }}>
      <div>
        <div className="text-7xl mb-4">🦫</div>
        <h1 className="text-white text-2xl font-bold mb-3">Capybara Simulator 3D</h1>
        <p className="text-green-300 mb-2">Your browser doesn't support WebGL 3D graphics.</p>
        <p className="text-white/60 text-sm">Try Chrome, Firefox, or Safari on a device with GPU support.</p>
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
        shadows={{ type: THREE.PCFSoftShadowMap }}
        camera={{ position: [0, 6, -12], fov: 60, near: 0.3, far: 220 }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
        dpr={[1, 2]}
        onCreated={({ gl }) => { if (!gl.getContext()) setWebglError(true); }}
        onError={() => setWebglError(true)}
      >
        <Suspense fallback={null}>
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

          {/* Post-processing — Three.js best practice for cinematic quality */}
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
        </Suspense>
      </Canvas>
    </div>
  );
}
