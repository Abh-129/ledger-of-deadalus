import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { Bloom, EffectComposer, N8AO, Noise, Vignette } from '@react-three/postprocessing';
import { useStore } from '../store';
import Flight from './games/flight/Flight';
import World from '../world/World';

export default function Experience({ onFail }: { onFail: () => void }) {
  const mode = useStore((s) => s.mode), settings = useStore((s) => s.settings), setSetting = useStore((s) => s.setSetting); // selectors: re-render only on these, not on every focus or step change
  const high = settings.quality === 'high';
  return (
    <div id="stage">
      <Canvas
        flat dpr={high ? [1, 1.25] : 1} gl={{ antialias: false, powerPreference: 'high-performance' }}
        camera={{ fov: 60, near: 0.05, far: 900, position: [0, 2, 8] }}
        onCreated={({ gl }) => { gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); onFail(); }); }}
      >
        <PerformanceMonitor ms={3000} bounds={() => [40, 120]} onDecline={() => setSetting('quality', 'low')} />
        {mode === 'flight' ? <Flight /> : <World />}
        {high && (
          <EffectComposer multisampling={0}>
            {mode === 'flight' ? <></> : <N8AO halfRes quality="performance" aoRadius={0.8} intensity={2} distanceFalloff={1} />}
            <Bloom mipmapBlur luminanceThreshold={0.9} luminanceSmoothing={0.2} intensity={0.75} />
            <Vignette offset={0.3} darkness={0.7} />
            {settings.reducedMotion ? <></> : <Noise opacity={0.045} />}
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
