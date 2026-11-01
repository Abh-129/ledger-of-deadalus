import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import { useStore } from '../store';
import { COL } from './shared/look';
import Flight from './games/flight/Flight';

export default function Experience({ onFail }: { onFail: () => void }) {
  const { mode, settings, setSetting } = useStore();
  const high = settings.quality === 'high';
  return (
    <div id="stage">
      <Canvas
        flat dpr={high ? [1, 2] : 1} gl={{ antialias: false, powerPreference: 'high-performance' }}
        camera={{ fov: 60, near: 0.05, far: 900, position: [0, 2, 8] }}
        onCreated={({ gl }) => { gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); onFail(); }); }}
      >
        <PerformanceMonitor ms={3000} bounds={() => [40, 120]} onDecline={() => setSetting('quality', 'low')} />
        {/* ponytail: temporary until T2 mounts World; walk, title and balance show only the night background */}
        {mode === 'flight' ? <Flight /> : <color attach="background" args={[COL.night]} />}
        {high && (
          <EffectComposer multisampling={0}>
            <Bloom mipmapBlur luminanceThreshold={0.9} luminanceSmoothing={0.2} intensity={0.75} />
            <Vignette offset={0.3} darkness={0.7} />
            {settings.reducedMotion ? <></> : <Noise opacity={0.045} />}
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
