import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { sfx } from '../audio/sounds';
import { COL, LOOK, Prim } from '../experience/shared/look';
import { Partridge } from '../experience/shared/figures';
import { PolyHandle, Polyline } from '../experience/shared/lines';
import { smooth, useStepT } from '../experience/shared/rig';
import { useStore } from '../store';
import { Hotspot } from '../world/interact';
import type { ChamberProps } from '../world/chambers';

// Athens workshop. Local frame: entry +Z, exit door at (0, -4). Everything on the bench is in bench space
// (origin on the bench top): the saw lies at the back, the compass circle is drawn in front of it.
const BENCH: [number, number, number] = [0, 0.86, -0.5];
const R = 9, DX = 1.3 / (R - 1), ZF = -0.4, CC = [0, 0.15] as const, CR = 0.3, Y = 0.04;
const IRON = '#aab4c0';

export default function SawChamber({ step, state }: ChamberProps) {
  const t = useStepT();
  const saw = useRef<PolyHandle>(null), edge = useRef<PolyHandle>(null), legs = useRef<PolyHandle>(null), circle = useRef<PolyHandle>(null);
  const blade = useRef<THREE.Mesh>(null), bird = useRef<THREE.Group>(null);
  const moon = useRef<THREE.PointLight>(null), cost = useRef<THREE.PointLight>(null);

  // fish spine (ribs either side of a spine) and the saw teeth it becomes, same vertex count so it can morph
  const { fish, tooth, ring } = useMemo(() => {
    const fish: number[][] = [], tooth: number[][] = [];
    for (let i = 0; i < R; i++) {
      const x = -0.65 + i * DX, h = 0.05 + 0.25 * Math.sin(Math.PI * (i + 0.5) / R);
      fish.push([x, 0], [x + 0.06, h], [x, 0], [x + 0.06, -h], [x, 0]);
      tooth.push([x, 0], [x + DX * 0.5, 0.2], [x + DX, 0], [x + DX, 0], [x + DX, 0]);
    }
    fish.push([0.65, 0]); tooth.push([0.65, 0]);
    const ring = Array.from({ length: 65 }, (_, k) => [Math.cos((k / 64) * Math.PI * 2), Math.sin((k / 64) * Math.PI * 2)]);
    return { fish, tooth, ring };
  }, []);

  const prev = useRef(step);
  useEffect(() => {
    if (state === 'current' && step > prev.current) { if (step === 1 || step === 2) sfx.pluck(); if (step === 3) sfx.slam(); }
    prev.current = step;
  }, [step, state]);

  useFrame(() => {
    // only the current chamber is animated by the store's smoothed step; the others show their final or first pose
    const T = state === 'current' ? t.current : step;
    const m = smooth(0.2, 0.9, T); // spine -> saw
    saw.current?.set(fish.map((f, i) => [f[0] + (tooth[i][0] - f[0]) * m, Y, ZF + f[1] + (tooth[i][1] - f[1]) * m]));
    edge.current?.set(tooth.map((q) => [q[0], Y + 0.012, ZF + q[1]]), smooth(0.8, 1.15, T)); // ochre teeth: the invention works
    if (blade.current) { blade.current.scale.set(1.3, 1, 0.22 * m + 0.001); blade.current.position.z = ZF - 0.11 * m; blade.current.visible = m > 0.02; }

    // compass: two iron arms swing together at the hinge, the free tip sweeps the ochre circle
    const open = smooth(1.1, 1.4, T), arms = smooth(1.05, 1.45, T), cp = smooth(1.45, 1.92, T);
    const r = CR * open, th = cp * Math.PI * 2, k = 1 - arms;
    const A = [CC[0], Y, CC[1]], B = [CC[0] + Math.cos(th) * r, Y, CC[1] + Math.sin(th) * r];
    const hh = Math.sqrt(0.7 * 0.7 - (r / 2) ** 2);
    const H = [(A[0] + B[0]) / 2, Y + hh, (A[2] + B[2]) / 2];
    legs.current?.set([A, [H[0] - 0.6 * k, H[1] + 0.1 * k, H[2] + 0.8 * k], [H[0] + 0.6 * k, H[1] + 0.1 * k, H[2] + 0.8 * k], B], smooth(1.05, 1.2, T));
    circle.current?.set(ring.map((q) => [CC[0] + q[0] * CR, Y + 0.005, CC[1] + q[1] * CR]), cp);

    // the cost: the moon key drops, red rises from the citadel side. Both lights stay mounted, only intensity moves.
    const c = smooth(2.2, 2.9, T);
    if (moon.current) moon.current.intensity = LOOK.moon.intensity * (1 - 0.7 * c);
    if (cost.current) cost.current.intensity = LOOK.cost.intensity * c;

    // the partridge runs low across the floor to the exit wall and stays on the ground
    const p = smooth(3.3, 3.98, T);
    if (bird.current) {
      bird.current.visible = T > 3.3;
      bird.current.position.set(1.4 - 1.1 * p + Math.sin(p * 14) * 0.04, Math.abs(Math.sin(p * 20)) * 0.05, 1 - 3.4 * p);
    }
  });

  const cur = state === 'current';
  return (
    <>
      <pointLight ref={moon} position={[-2.4, 3.8, -1.2]} color={LOOK.moon.color} intensity={LOOK.moon.intensity} distance={LOOK.moon.distance} decay={2} />
      <pointLight ref={cost} position={[3.2, 2.6, -0.5]} color={LOOK.cost.color} intensity={0} distance={LOOK.cost.distance} decay={2} />

      {/* high window: where the moon comes in */}
      <mesh position={[-3.96, 3.7, -1.2]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[1.2, 0.8]} /><meshBasicMaterial color={new THREE.Color(LOOK.moon.color).multiplyScalar(1.8)} toneMapped={false} />
      </mesh>

      {/* workbench, stool, a log waiting for the saw, an anvil */}
      <group position={[BENCH[0], 0, BENCH[2]]}>
        <Prim args={[2.4, 0.12, 1.4]} pos={[0, BENCH[1] - 0.06, 0]} color={COL.wood} />
        {[[-1.1, -0.6], [1.1, -0.6], [-1.1, 0.6], [1.1, 0.6]].map(([x, z], i) => <Prim key={i} args={[0.12, BENCH[1] - 0.12, 0.12]} pos={[x, (BENCH[1] - 0.12) / 2, z]} color={COL.wood} />)}
        <Prim args={[2.2, 0.08, 1.2]} pos={[0, 0.3, 0]} color={COL.wood} />
      </group>
      <Prim shape="cyl" args={[0.2, 0.24, 0.45, 10]} pos={[-1.7, 0.22, 0.6]} color={COL.wood} />
      <Prim shape="cyl" args={[0.18, 0.18, 1.4, 10]} pos={[2.2, 0.18, -1.8]} rot={[0, 0, Math.PI / 2]} color="#a07a52" />
      <Prim args={[0.5, 0.25, 0.3]} pos={[-2.4, 0.4, -2.4]} color="#4a525c" />
      <Prim args={[0.7, 0.4, 0.45]} pos={[-2.4, 0.2, -2.4]} color="#3a424c" />
      {/* chisel and hammer on the bench */}
      <Prim shape="cyl" args={[0.02, 0.02, 0.4, 6]} pos={[BENCH[0] + 0.9, BENCH[1] + 0.03, BENCH[2] + 0.35]} rot={[0, 0, Math.PI / 2]} color={IRON} />
      <Prim args={[0.16, 0.06, 0.08]} pos={[BENCH[0] - 0.9, BENCH[1] + 0.05, BENCH[2] + 0.3]} color="#6b7480" />

      {/* hero: spine -> saw -> compass circle (bench space) */}
      <group position={[BENCH[0], BENCH[1] + 0.58, BENCH[2]]} rotation-x={0.8} scale={1.35}>
        <Prim args={[1.7, 0.04, 1.2]} pos={[0, -0.02, 0]} color="#5a3d24" />
        <Polyline ref={saw} max={80} thick={0.022} glow={false} color={COL.limestone} />
        <Polyline ref={edge} max={40} thick={0.018} />
        <Polyline ref={legs} max={4} thick={0.035} glow={false} color={IRON} />
        <Polyline ref={circle} max={80} thick={0.02} />
        <mesh ref={blade} position={[0, Y - 0.02, ZF]}><boxGeometry args={[1, 0.03, 1]} /><meshToonMaterial color="#6b7480" /></mesh>
      </group>
      <Hotspot pos={[BENCH[0], BENCH[1] + 1.0, BENCH[2] - 0.2]} radius={4.2} enabled={cur && step <= 3} onUse={() => useStore.getState().advance()} />

      <Partridge ref={bird} rot={[0, Math.PI, 0]} scale={1.3} />
      <Hotspot pos={[0.3, 0.3, -2.4]} radius={5} enabled={cur && step === 4} onUse={() => useStore.getState().advance()} />
    </>
  );
}
