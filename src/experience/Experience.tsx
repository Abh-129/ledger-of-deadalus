import { Canvas } from '@react-three/fiber';
import { Html, PerformanceMonitor } from '@react-three/drei';
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import { lazy, Suspense, useEffect, useState } from 'react';
import { UI } from '../content/copy';
import { Chapter, useStore } from '../store';
import { COL } from './shared/look';

const scenes: Record<Chapter, React.LazyExoticComponent<() => JSX.Element | null>> = {
  title: lazy(() => import('./scenes/TitleScene')),
  saw: lazy(() => import('./scenes/SawScene')),
  cow: lazy(() => import('./scenes/CowScene')),
  labyrinth: lazy(() => import('./scenes/LabyrinthScene')),
  thread: lazy(() => import('./scenes/ThreadScene')),
  wings: lazy(() => import('./scenes/WingsScene')),
  partridge: lazy(() => import('./scenes/PartridgeScene')),
  balance: lazy(() => import('./scenes/TitleScene')),
};

function Loading() {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI((x) => (x + 1) % UI.loading.length), 900); return () => clearInterval(t); }, []);
  return <Html center><div className="mono" style={{ color: COL.dim, whiteSpace: 'nowrap' }}>{UI.loading[i]}</div></Html>;
}

export default function Experience({ onFail }: { onFail: () => void }) {
  const { chapter, settings, setSetting } = useStore();
  const Scene = scenes[chapter];
  const high = settings.quality === 'high';
  return (
    <div id="stage">
      <Canvas
        flat dpr={high ? [1, 2] : 1} gl={{ antialias: false, powerPreference: 'high-performance' }}
        camera={{ fov: 60, near: 0.05, far: 900, position: [0, 2, 8] }}
        onCreated={({ gl }) => { gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); onFail(); }); }}
      >
        <PerformanceMonitor ms={3000} bounds={() => [40, 120]} onDecline={() => setSetting('quality', 'low')} />
        <Suspense fallback={<Loading />}><Scene key={chapter} /></Suspense>
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
