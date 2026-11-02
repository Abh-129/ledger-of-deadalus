import { Sparkles } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { sfx } from '../audio/sounds';
import { COL, LOOK, Prim } from '../experience/shared/look';
import { Partridge } from '../experience/shared/figures';
import { PolyHandle, Polyline } from '../experience/shared/lines';
import { smooth, useStepT } from '../experience/shared/rig';
import { useStore } from '../store';
import { Fresco, figure } from '../world/Fresco';
import { Hotspot } from '../world/interact';
import type { ChamberProps } from '../world/chambers';

// Athens workshop. Local frame: entry +Z, exit door at (0, -4). Everything on the bench is in bench space
// (origin on the bench top): the saw lies at the back, the compass circle is drawn in front of it.
const BENCH: [number, number, number] = [-1.8, 0.86, -0.5]; // off the thread line (x = 0) so the walk to the exit passes it at an angle
const R = 9, DX = 1.3 / (R - 1), ZF = -0.4, CC = [0, 0.15] as const, CR = 0.3, Y = 0.04;
const F = LOOK.fresco, WX = 3.77; // inner wall face is at 3.8 (walls are 0.4 thick, centred on +-4)

// fresco paint closures read the step through a module variable so the cheap `version` prop is the only repaint trigger
let paintStep = 0;
function pupil(g: CanvasRenderingContext2D, w: number, h: number) {
  const gy = h * 0.93; g.fillStyle = F.earth; g.fillRect(0, gy, w, h - gy); // ground strip
  g.fillStyle = F.earth; g.strokeStyle = F.line; g.lineWidth = 4; // low table between them
  g.fillRect(w * 0.27, h * 0.62, w * 0.14, h * 0.05); g.strokeRect(w * 0.27, h * 0.62, w * 0.14, h * 0.05);
  g.fillRect(w * 0.285, h * 0.67, w * 0.012, gy - h * 0.67); g.fillRect(w * 0.385, h * 0.67, w * 0.012, gy - h * 0.67);
  figure(g, { x: w * 0.15, y: gy, h: h * 0.82, facing: 1, pose: 'reach', fill: F.skin });
  const bx = w * 0.53, bh = h * 0.55, u = bh / 100;
  figure(g, { x: bx, y: gy, h: bh, facing: -1, pose: 'carry', fill: F.skinPale, small: true });
  const sx = bx - 17 * u, sy = gy - 62 * u; // the fish spine in the boy's hand
  g.strokeStyle = paintStep >= 1 ? COL.ochre : F.line; g.lineWidth = 5; g.beginPath(); g.moveTo(sx - 20 * u, sy); g.lineTo(sx + 6 * u, sy);
  for (let i = 0; i < 5; i++) { const x = sx - 18 * u + i * 5 * u; g.moveTo(x, sy - 6 * u); g.lineTo(x + 2 * u, sy); g.lineTo(x, sy + 6 * u); }
  g.stroke();
}
function citadel(g: CanvasRenderingContext2D, w: number, h: number) {
  g.fillStyle = F.blue; g.fillRect(0, h * 0.86, w, h * 0.14); // sea
  g.strokeStyle = F.line; g.lineWidth = 5; g.lineJoin = 'round';
  g.fillStyle = F.earth; g.beginPath(); g.moveTo(w * 0.1, h * 0.88); g.lineTo(w * 0.2, h * 0.55); g.lineTo(w * 0.27, h * 0.5); g.lineTo(w * 0.34, h * 0.42); g.lineTo(w * 0.62, h * 0.42); g.lineTo(w * 0.7, h * 0.52); g.lineTo(w * 0.8, h * 0.88); g.closePath(); g.fill(); g.stroke(); // the rock
  g.fillStyle = F.plaster; for (let i = 0; i < 5; i++) { g.fillRect(w * (0.37 + i * 0.045), h * 0.22, w * 0.025, h * 0.2); g.strokeRect(w * (0.37 + i * 0.045), h * 0.22, w * 0.025, h * 0.2); }
  g.fillStyle = F.blue; g.beginPath(); g.moveTo(w * 0.35, h * 0.22); g.lineTo(w * 0.5, h * 0.1); g.lineTo(w * 0.62, h * 0.22); g.closePath(); g.fill(); g.stroke(); // temple
  if (paintStep >= 3) figure(g, { x: w * 0.87, y: h * 0.58, h: h * 0.3, facing: -1, pose: 'fall', fill: COL.red }); // the cost
}
function grass(g: CanvasRenderingContext2D, w: number, h: number) {
  g.strokeStyle = F.line; g.lineWidth = 4; g.lineCap = 'round'; g.fillStyle = F.earth;
  const by = h * 0.62; g.beginPath(); g.ellipse(w * 0.5, by, w * 0.14, h * 0.17, -0.1, 0, 6.28); g.fill(); g.stroke(); // body
  g.beginPath(); g.arc(w * 0.66, by - h * 0.14, h * 0.07, 0, 6.28); g.fill(); g.stroke(); // head
  g.beginPath(); g.moveTo(w * 0.7, by - h * 0.15); g.lineTo(w * 0.75, by - h * 0.12); g.lineTo(w * 0.7, by - h * 0.12); g.stroke(); // beak
  g.beginPath(); g.moveTo(w * 0.47, by + h * 0.12); g.lineTo(w * 0.43, by + h * 0.28); g.moveTo(w * 0.54, by + h * 0.12); g.lineTo(w * 0.58, by + h * 0.28); g.stroke();
  g.fillStyle = F.line; g.beginPath(); g.arc(w * 0.675, by - h * 0.15, 3, 0, 6.28); g.fill();
  g.strokeStyle = F.green; g.lineWidth = 5; g.beginPath(); // grass band
  for (let x = 0; x < w; x += w / 60) { g.moveTo(x, h); g.quadraticCurveTo(x + 4, h * 0.88, x + (x % 7) - 3, h * 0.78); }
  g.stroke();
}

export default function SawChamber({ step, state }: ChamberProps) {
  const t = useStepT();
  paintStep = step;
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
    edge.current?.set(tooth.map((q) => [q[0], Y + 0.012, ZF + q[1]]), smooth(0.55, 0.98, T)); // ochre teeth: the invention works
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

    // the partridge runs low along the right side toward the exit and stays on the ground, in view of the entry
    const p = smooth(3.3, 3.98, T);
    if (bird.current) {
      bird.current.visible = T > 3.3;
      bird.current.position.set(2.4 + Math.sin(p * 14) * 0.04, Math.abs(Math.sin(p * 20)) * 0.05, 1.4 - 4 * p);
    }
  });

  const cur = state === 'current';
  return (
    <>
      <pointLight ref={moon} position={[-1.4, 3.8, -0.6]} color={LOOK.moon.color} intensity={LOOK.moon.intensity} distance={LOOK.moon.distance} decay={2} />
      <pointLight ref={cost} position={[0.8, 3.4, -0.8]} color={LOOK.cost.color} intensity={0} distance={LOOK.cost.distance} decay={2} />

      {/* high window: where the moon comes in */}
      <mesh position={[-WX + 0.01, 3.7, -0.8]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[1.2, 0.8]} /><meshBasicMaterial color={LOOK.moon.color} toneMapped={false} />
      </mesh>

      {/* workbench, stool, a log waiting for the saw, an anvil */}
      <group position={[BENCH[0], 0, BENCH[2]]}>
        <Prim args={[2.4, 0.12, 1.4]} pos={[0, BENCH[1] - 0.06, 0]} color={COL.wood} />
        {[[-1.1, -0.6], [1.1, -0.6], [-1.1, 0.6], [1.1, 0.6]].map(([x, z], i) => <Prim key={i} args={[0.12, BENCH[1] - 0.12, 0.12]} pos={[x, (BENCH[1] - 0.12) / 2, z]} color={COL.wood} />)}
        <Prim args={[2.2, 0.08, 1.2]} pos={[0, 0.3, 0]} color={COL.wood} />
      </group>
      <Prim shape="cyl" args={[0.2, 0.24, 0.45, 10]} pos={[-0.9, 0.22, 0.9]} color={COL.wood} />
      <Prim shape="cyl" args={[0.18, 0.18, 1.4, 10]} pos={[3, 0.18, 2.4]} rot={[0, 0, Math.PI / 2]} color={COL.wood} />
      <Prim args={[0.5, 0.25, 0.3]} pos={[-2.9, 0.4, -2.9]} color={COL.dim} />
      <Prim args={[0.7, 0.4, 0.45]} pos={[-2.9, 0.2, -2.9]} color={LOOK.stone.wall} />
      {/* chisel and hammer on the bench */}
      <Prim shape="cyl" args={[0.02, 0.02, 0.4, 6]} pos={[BENCH[0] + 0.9, BENCH[1] + 0.03, BENCH[2] + 0.35]} rot={[0, 0, Math.PI / 2]} color={COL.dim} />
      <Prim args={[0.16, 0.06, 0.08]} pos={[BENCH[0] - 0.9, BENCH[1] + 0.05, BENCH[2] + 0.3]} color={COL.dim} />

      {/* hero: spine -> saw -> compass circle (bench space) */}
      <group position={[BENCH[0], BENCH[1] + 0.58, BENCH[2]]} rotation-x={0.8} scale={1.35}>
        <Prim args={[1.7, 0.04, 1.2]} pos={[0, -0.02, 0]} color={COL.wood} />
        <Polyline ref={saw} max={80} thick={0.022} glow={false} color={COL.limestone} />
        <Polyline ref={edge} max={40} thick={0.018} />
        <Polyline ref={legs} max={4} thick={0.035} glow={false} color={COL.dim} />
        <Polyline ref={circle} max={80} thick={0.02} />
        <mesh ref={blade} position={[0, Y - 0.02, ZF]}><boxGeometry args={[1, 0.03, 1]} /><meshToonMaterial color={COL.dim} /></mesh>
      </group>
      <Hotspot pos={[BENCH[0], BENCH[1] + 1.0, BENCH[2] - 0.2]} radius={4.2} enabled={cur && step <= 3} onUse={() => useStore.getState().advance()} />

      <Sparkles count={40} scale={[1.8, 2.6, 1.6]} position={[BENCH[0], 2.1, BENCH[2]]} size={3} speed={0.2} color={LOOK.moon.color} />

      <Fresco paint={pupil} size={[4.2, 2.2]} pos={[-WX, 2, 0.3]} rotY={Math.PI / 2} version={step >= 1 ? 1 : 0} />
      <Fresco paint={citadel} size={[3.6, 2.2]} pos={[WX, 2, -0.8]} rotY={-Math.PI / 2} version={step >= 3 ? 1 : 0} />
      {step >= 4 && <Fresco paint={grass} size={[2.8, 1.2]} pos={[0, 3.55, -WX]} border="meander" />}

      <Partridge ref={bird} rot={[0, Math.PI, 0]} scale={1.3} />
      <Hotspot pos={[2.4, 0.3, -2.6]} radius={5} enabled={cur && step === 4} onUse={() => useStore.getState().advance()} />
    </>
  );
}
