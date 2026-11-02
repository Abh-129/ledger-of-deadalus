import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { sfx } from '../audio/sounds';
import { UI } from '../content/copy';
import { Bull, Person } from '../experience/shared/figures';
import { LOOK } from '../experience/shared/look';
import { smooth } from '../experience/shared/rig';
import { useStore } from '../store';
import type { ChamberProps } from '../world/chambers';
import { Hotspot } from '../world/interact';

type V3 = [number, number, number];
const F = LOOK.fresco, SC = 0.7, WR = 0.28, DIST = 1.4, X0 = -2.2, Z0 = -3.8, Y0 = 0.25 + 0.94 * SC;
const mat = (color: string) => new THREE.MeshStandardMaterial({ color, roughness: 0.88 });
const wood = mat(F.earth), tyre = mat(F.line), hide = mat(F.skinPale);

// The cow in cow-local metres (head +z). part: 0 FRAME, 1 PANELS, 2 WHEELS, 3 HIDE; off = where it hangs before it is fitted.
interface Piece { part: number; off: V3; g: THREE.BufferGeometry; m: THREE.Material; pos: V3; rot?: V3; sc?: V3; thr?: number; wheel?: boolean }
const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const ball = () => new THREE.SphereGeometry(1, 14, 10);
const cone = () => new THREE.ConeGeometry(1, 1, 6);
const HIDE_OFF: V3 = [0, 1.4, 0];
const PIECES: Piece[] = [
  ...[-0.75, -0.38, 0, 0.38, 0.75].map((z): Piece => ({ part: 0, off: [0, 1.3, 0], g: new THREE.TorusGeometry(0.52, 0.03, 6, 18, Math.PI), m: wood, pos: [0, 0, z] })),
  ...([[-0.5, 0], [0.5, 0], [0, 0.52]] as const).map(([x, y]): Piece => ({ part: 0, off: [0, 1.3, 0], g: box(0.05, 0.05, 1.9), m: wood, pos: [x, y, 0] })),
  { part: 1, off: [-1.6, 0.3, 0], g: box(0.04, 0.8, 1.7), m: wood, pos: [-0.56, 0.02, 0] },
  { part: 1, off: [1.6, 0.3, 0], g: box(0.04, 0.8, 1.7), m: wood, pos: [0.56, 0.02, 0] },
  { part: 1, off: [0, 1.1, 0], g: box(1.1, 0.04, 1.7), m: wood, pos: [0, 0.58, 0] },
  ...([[-0.62, 0.6], [0.62, 0.6], [-0.62, -0.6], [0.62, -0.6]] as const).map(([x, z]): Piece => ({
    part: 2, off: [x * 2.1, 0.2, 0], g: new THREE.CylinderGeometry(WR, WR, 0.1, 14).rotateZ(Math.PI / 2), m: tyre, pos: [x, -0.66, z], wheel: true,
  })),
  { part: 3, off: HIDE_OFF, g: ball(), m: hide, pos: [0, 0.04, 0], sc: [0.64, 0.62, 1.12], thr: 40 },
  { part: 3, off: HIDE_OFF, g: ball(), m: hide, pos: [0, 0.28, 1.05], sc: [0.32, 0.34, 0.4], thr: 40 },
  { part: 3, off: HIDE_OFF, g: ball(), m: hide, pos: [0, 0.2, 1.4], sc: [0.2, 0.2, 0.22], thr: 40 },
  ...[-1, 1].map((s): Piece => ({ part: 3, off: HIDE_OFF, g: cone(), m: hide, pos: [s * 0.26, 0.58, 1.0], rot: [0, 0, -s * 0.8], sc: [0.05, 0.2, 0.05] })),
  ...([[-0.3, 0.6], [0.3, 0.6], [-0.3, -0.6], [0.3, -0.6]] as const).map(([x, z]): Piece => ({ part: 3, off: HIDE_OFF, g: new THREE.CylinderGeometry(0.09, 0.08, 0.5, 6), m: hide, pos: [x, -0.36, z] })),
  { part: 3, off: HIDE_OFF, g: cone(), m: hide, pos: [0, 0.1, -1.2], rot: [-2.2, 0, 0], sc: [0.06, 0.4, 0.06] },
];
const EDGES = PIECES.map((p) => new THREE.EdgesGeometry(p.g, p.thr ?? 20));

const Plank = ({ a, p, m = wood, r }: { a: V3; p: V3; m?: THREE.Material; r?: V3 }) => <mesh position={p} rotation={r} material={m}><boxGeometry args={a} /></mesh>;

export default function CowChamber({ step, state }: ChamberProps) {
  const adv = () => useStore.getState().advance();
  const [fit, setFit] = useState(0); // parts fitted so far at step 2
  useEffect(() => { if (step < 2) setFit(0); }, [step]);
  const s = state === 'ahead' ? 0 : step;
  const built = s > 2 ? 4 : s === 2 ? fit : 0; // any step > 2 forces the cow fully built

  const edge = useMemo(() => new THREE.LineBasicMaterial({ toneMapped: false }), []);
  const T = useRef(s), amt = useRef<number[]>([0, 1, 2, 3].map((i) => (i < built ? 1 : 0)));
  const cow = useRef<THREE.Group>(null), curtain = useRef<THREE.Mesh>(null), red = useRef<THREE.PointLight>(null);
  const bits = useRef<(THREE.Group | null)[]>([]);
  useFrame((_, dt) => {
    const fast = useStore.getState().settings.reducedMotion ? 100 : 0, d = THREE.MathUtils.damp;
    T.current = d(T.current, s, fast || 1.7, dt);
    const t = T.current, roll = smooth(2.05, 2.95, t), drop = smooth(3.05, 3.95, t);
    amt.current = amt.current.map((a, i) => d(a, i < built ? 1 : 0, fast || 3, dt));
    PIECES.forEach((p, i) => {
      const g = bits.current[i], a = amt.current[p.part];
      if (!g) return;
      g.visible = a > 0.01;
      g.position.set(p.pos[0] + p.off[0] * (1 - a), p.pos[1] + p.off[1] * (1 - a), p.pos[2] + p.off[2] * (1 - a));
      if (p.wheel) g.rotation.x = -(roll * DIST) / SC / WR;
    });
    cow.current?.position.set(X0 - roll * DIST, Y0, Z0);
    // ochre edges: fitted parts glow, peak as the cow rolls into the alcove, then the alcove dims
    edge.color.set(LOOK.craft.color).multiplyScalar(LOOK.craft.emissive * (0.6 + 0.5 * smooth(2.5, 3, t) - 0.55 * drop));
    if (curtain.current) { curtain.current.visible = drop > 0.01; curtain.current.scale.y = Math.max(drop, 0.001); curtain.current.position.y = 2.6 - 1.3 * drop; }
    if (red.current) red.current.intensity = LOOK.cost.intensity * smooth(3.1, 3.9, t) * (state === 'current' ? 1 : 0.35);
  });
  useEffect(() => { if (state === 'current' && step === 4) sfx.bellow(); }, [state, step]);

  const on = (n: number) => state === 'current' && step === n;
  const fitNext = () => { sfx.pluck(); if (fit === 3) { setFit(4); adv(); } else setFit(fit + 1); };

  return (
    <>
      <pointLight position={[-2.5, 4.6, -2]} color={LOOK.moon.color} intensity={LOOK.moon.intensity} distance={LOOK.moon.distance} />
      <pointLight ref={red} position={[0, 2.8, -4.9]} color={LOOK.cost.color} intensity={0} distance={LOOK.cost.distance} />

      {/* the side pen and the bull Minos kept */}
      {[[2.3, -0.4], [5, -0.4], [2.3, 2.8], [5, 2.8]].map(([x, z], i) => <Plank key={i} a={[0.12, 1.3, 0.12]} p={[x, 0.65, z]} />)}
      {[0.5, 1.0].map((y) => (
        <group key={y}>
          <Plank a={[0.07, 0.1, 3.2]} p={[2.3, y, 1.2]} /><Plank a={[2.7, 0.1, 0.07]} p={[3.65, y, -0.4]} /><Plank a={[2.7, 0.1, 0.07]} p={[3.65, y, 2.8]} />
        </group>
      ))}
      <Bull pos={[3.8, 0, 1.2]} rot={[0, -Math.PI / 4, 0]} color={F.skinPale} />
      <Hotspot pos={[3.8, 1.5, 1.2]} enabled={on(0)} onUse={adv} radius={4.5} />

      {/* the bench, the craftsman's tools and timber */}
      <Plank a={[2.4, 0.08, 0.9]} p={[1.7, 0.9, -2.5]} />
      {[[0.7, -2.2], [2.7, -2.2], [0.7, -2.8], [2.7, -2.8]].map(([x, z], i) => <Plank key={i} a={[0.1, 0.9, 0.1]} p={[x, 0.45, z]} />)}
      <Plank a={[0.6, 0.04, 0.12]} p={[1.1, 0.96, -2.4]} m={tyre} r={[0, 0.4, 0]} />
      <Plank a={[0.3, 0.05, 0.1]} p={[2.3, 0.96, -2.6]} />
      <Person pos={[1.7, 0, -3.2]} h={1.7} tunic={F.skinPale} band={F.blue} />
      <Hotspot pos={[1.7, 1.45, -3.0]} enabled={on(1)} onUse={adv} radius={4.5} />
      {[0, 1, 2].map((i) => <Plank key={i} a={[0.1, 2.2, 0.35]} p={[4.6 - i * 0.2, 1.1, -4.8]} r={[0, 0, -0.12 - i * 0.03]} />)}

      {/* raised platform, the alcove at its west end, and the curtain that drops when the cow is inside */}
      <Plank a={[4, 0.25, 2.6]} p={[-3, 0.125, Z0]} />
      <Plank a={[0.1, 2.6, 2.4]} p={[-4.85, 1.55, Z0]} m={tyre} />
      {[-5, -2.6].map((z) => <Plank key={z} a={[2.4, 2.6, 0.1]} p={[-3.65, 1.55, z]} m={tyre} />)}
      <Plank a={[2.4, 0.1, 2.5]} p={[-3.65, 2.9, Z0]} m={tyre} />
      <mesh ref={curtain} position={[-2.45, 2.6, Z0]} visible={false} material={mat(LOOK.stone.ceiling)}><boxGeometry args={[0.06, 2.6, 2.4]} /></mesh>
      <Hotspot pos={[-2.35, 1.3, Z0]} enabled={on(4)} onUse={adv} radius={4.5} />

      {/* the hollow cow, built part by part on its wheels */}
      <group ref={cow} position={[X0, Y0, Z0]} rotation-y={-Math.PI / 2} scale={SC}>
        {PIECES.map((p, i) => (
          <group key={i} ref={(n) => { bits.current[i] = n; }} position={p.pos} rotation={p.rot} scale={p.sc} visible={false}>
            <mesh geometry={p.g} material={p.m} />
            <lineSegments geometry={EDGES[i]} material={edge} />
          </group>
        ))}
        <Hotspot pos={[0, 0.3, 0]} enabled={on(2) && fit < 4} label={UI.parts[Math.min(fit, 3)]} onUse={fitNext} radius={4.5} />
        <Hotspot pos={[0, 0.3, 0]} enabled={on(3)} onUse={adv} radius={5} />
      </group>
    </>
  );
}
