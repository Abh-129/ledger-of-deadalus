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
import { Fresco, figure, type Paint } from '../world/Fresco';
import { Hotspot } from '../world/interact';

type V3 = [number, number, number];
const F = LOOK.fresco, SC = 0.7, WR = 0.28, DIST = 1.4, X0 = -2.2, Z0 = -3.8, Y0 = 0.25 + 0.94 * SC;
const mat = (color: string) => new THREE.MeshStandardMaterial({ color, roughness: 0.88 });
const wood = mat(F.earth), tyre = mat(F.line), hide = mat(F.skinPale), curtainMat = mat(LOOK.stone.ceiling);

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

const ln = (g: CanvasRenderingContext2D, w = 3) => { g.strokeStyle = F.line; g.lineWidth = w; g.lineJoin = 'round'; g.stroke(); };
const bullPaint: Paint = (g, w, h) => {
  g.fillStyle = F.skinPale; g.fillRect(0, 0, w, h);
  const k = h / 100, by = h * 0.8, bx = w * 0.44;
  g.save(); g.translate(bx, by); g.scale(1.3, 1.3); g.translate(-bx, -by);
  g.fillStyle = F.plaster; g.beginPath(); // the white bull, rearing out of the sea, facing right
  g.moveTo(bx - 34 * k, by - 40 * k); g.bezierCurveTo(bx - 20 * k, by - 58 * k, bx + 8 * k, by - 56 * k, bx + 22 * k, by - 48 * k);
  g.bezierCurveTo(bx + 30 * k, by - 62 * k, bx + 44 * k, by - 58 * k, bx + 52 * k, by - 50 * k); g.lineTo(bx + 60 * k, by - 44 * k);
  g.lineTo(bx + 50 * k, by - 38 * k); g.bezierCurveTo(bx + 40 * k, by - 42 * k, bx + 30 * k, by - 28 * k, bx + 20 * k, by - 10 * k);
  g.lineTo(bx - 30 * k, by - 6 * k); g.bezierCurveTo(bx - 38 * k, by - 20 * k, bx - 40 * k, by - 30 * k, bx - 34 * k, by - 40 * k);
  g.fill(); ln(g, 3 * k);
  g.beginPath(); g.arc(bx + 44 * k, by - 62 * k, 9 * k, Math.PI * 1.1, Math.PI * 1.9); ln(g, 3 * k); // horn
  g.fillStyle = F.line; g.beginPath(); g.arc(bx + 50 * k, by - 50 * k, 1.2 * k, 0, 6.3); g.fill();
  g.beginPath(); g.moveTo(bx - 34 * k, by - 40 * k); g.quadraticCurveTo(bx - 50 * k, by - 40 * k, bx - 46 * k, by - 18 * k); ln(g, 2.5 * k); // tail
  g.restore();
  g.fillStyle = F.sea; g.beginPath(); g.moveTo(0, h); g.lineTo(0, by - 4 * k); // the lapis sea band, waves over the legs
  for (let x = 0; x <= w; x += 9 * k) g.quadraticCurveTo(x + 4.5 * k, by - 12 * k, x + 9 * k, by - 4 * k);
  g.lineTo(w, h); g.closePath(); g.fill(); ln(g, 2 * k);
  g.strokeStyle = F.blue; g.lineWidth = 2.4 * k;
  for (let r = 0; r < 2; r++) for (let x = (r % 2) * 7 * k; x < w; x += 14 * k) { g.beginPath(); g.arc(x, by + (7 + r * 7) * k, 5 * k, Math.PI, 0); g.stroke(); }
  g.fillStyle = F.earth; g.beginPath(); g.rect(w * 0.1, by - 22 * k, 20 * k, 20 * k); g.fill(); ln(g, 2.5 * k); // altar with horns of consecration
  for (const dx of [0, 14]) { g.beginPath(); g.moveTo(w * 0.1 + dx * k, by - 22 * k); g.lineTo(w * 0.1 + (dx + 3) * k, by - 31 * k); g.lineTo(w * 0.1 + (dx + 6) * k, by - 22 * k); g.fill(); ln(g, 2.5 * k); }
  const mx = w * 0.8, my = h * 0.94, mh = 78 * k;
  figure(g, { x: mx, y: my, h: mh, facing: -1, pose: 'reach', fill: F.skin }); // Minos leads
  g.fillStyle = F.earth; g.beginPath(); const hx = mx - 3 * mh / 100, hy = my - 87 * mh / 100; // crown
  g.moveTo(hx - 6 * k, hy); for (let i = 0; i < 4; i++) { g.lineTo(hx - 6 * k + i * 4 * k + 2 * k, hy - 9 * k); g.lineTo(hx - 6 * k + (i + 1) * 4 * k, hy); } g.closePath(); g.fill(); ln(g, 2 * k);
};
const queenPaint: Paint = (g, w, h) => {
  g.fillStyle = F.skinPale; g.fillRect(0, 0, w, h);
  const k = h / 100, x = w / 2, y = h * 0.95, qh = h * 0.8;
  g.strokeStyle = F.green; g.lineWidth = 3 * k; // lilies flank her
  for (const dx of [-0.34, 0.34]) { g.beginPath(); g.moveTo(w / 2 + dx * w, y); g.quadraticCurveTo(w / 2 + dx * w * 1.1, h * 0.5, w / 2 + dx * w * 0.9, h * 0.22); g.stroke(); g.fillStyle = F.plaster; g.beginPath(); g.ellipse(w / 2 + dx * w * 0.9, h * 0.2, 4 * k, 7 * k, 0, 0, 6.3); g.fill(); ln(g, 1.6 * k); }
  figure(g, { x, y, h: qh, facing: 1, pose: 'stand', fill: F.skin });
  const u = qh / 100; g.fillStyle = F.blue; g.beginPath(); // long flounced skirt over the legs
  g.moveTo(x - 7 * u, y - 50 * u); g.lineTo(x + 8 * u, y - 50 * u); g.lineTo(x + 16 * u, y - 2 * u); g.lineTo(x - 14 * u, y - 2 * u); g.closePath(); g.fill(); ln(g, 2 * k);
  g.fillStyle = F.plaster; for (const f of [14, 26, 38]) g.fillRect(x - (8 + f * 0.12) * u, y - (2 + f) * u, (16 + f * 0.24) * u, 2 * u);
};
const minotaurPaint: Paint = (g, w, h) => {
  g.fillStyle = F.skinPale; g.fillRect(0, 0, w, h);
  const c = LOOK.cost.color, k = h / 100, x = w / 2; // horned silhouette, no face, red only
  g.fillStyle = c; g.beginPath(); g.moveTo(x - 30 * k, h); g.lineTo(x - 24 * k, h * 0.55); g.quadraticCurveTo(x - 16 * k, h * 0.46, x - 8 * k, h * 0.42);
  g.lineTo(x - 10 * k, h * 0.2); g.quadraticCurveTo(x, h * 0.1, x + 10 * k, h * 0.2); g.lineTo(x + 8 * k, h * 0.42);
  g.quadraticCurveTo(x + 16 * k, h * 0.46, x + 24 * k, h * 0.55); g.lineTo(x + 30 * k, h); g.closePath(); g.fill();
  g.strokeStyle = c; g.lineWidth = 5 * k; g.lineCap = 'round';
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(x + s * 9 * k, h * 0.2); g.quadraticCurveTo(x + s * 30 * k, h * 0.22, x + s * 26 * k, h * 0.02); g.stroke(); }
};

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
      g.visible = s >= 2 || a > 0.01; // unfitted parts hang at their off positions from step 2
      g.position.set(p.pos[0] + p.off[0] * (1 - a), p.pos[1] + p.off[1] * (1 - a), p.pos[2] + p.off[2] * (1 - a));
      if (p.wheel) g.rotation.x = -(roll * DIST) / SC / WR;
    });
    cow.current?.position.set(X0 - roll * DIST, Y0, Z0);
    // ochre edges: fitted parts glow, peak as the cow rolls into the alcove, then the alcove dims
    edge.color.set(LOOK.craft.color).multiplyScalar(LOOK.craft.emissive * (0.6 + 0.5 * smooth(2.5, 3, t) - 0.55 * drop));
    if (curtain.current) { curtain.current.visible = drop > 0.01; curtain.current.scale.y = Math.max(drop, 0.001); curtain.current.position.y = 2.6 - 1.3 * drop; }
    if (red.current) red.current.intensity = LOOK.cost.intensity * smooth(3.1, 3.9, t);
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
      {step >= 1 && <Person pos={[1.7, 0, -3.2]} h={1.7} tunic={F.skinPale} band={F.blue} />}
      <Hotspot pos={[1.7, 1.45, -3.0]} enabled={on(1)} onUse={adv} radius={4.5} />
      {[0, 1, 2].map((i) => <Plank key={i} a={[0.1, 2.2, 0.35]} p={[4.6 - i * 0.2, 1.1, -4.8]} r={[0, 0, -0.12 - i * 0.03]} />)}

      {/* raised platform, the alcove at its west end, and the curtain that drops when the cow is inside */}
      <Plank a={[4, 0.25, 2.6]} p={[-3, 0.125, Z0]} />
      <Plank a={[0.1, 2.6, 2.4]} p={[-4.85, 1.55, Z0]} m={tyre} />
      <Plank a={[2.4, 2.6, 0.1]} p={[-3.65, 1.55, -5]} m={tyre} />{/* open toward +Z so the entry sees the cow inside */}
      <Plank a={[2.4, 0.1, 2.5]} p={[-3.65, 2.9, Z0]} m={tyre} />
      <mesh ref={curtain} position={[-2.45, 2.6, Z0]} visible={false} material={curtainMat}><boxGeometry args={[0.06, 2.6, 2.4]} /></mesh>
      <Hotspot pos={[-2.35, 1.3, Z0]} enabled={on(4)} onUse={adv} radius={4.5} />

      {/* frescoes: the bull of the sea and Minos (long west wall, above the alcove), the queen opposite, and the Minotaur on the exit wall at step 4 */}
      <Fresco paint={bullPaint} size={[10.4, 2.8]} pos={[-5.27, 4.4, 0]} rotY={Math.PI / 2} />
      {step >= 1 && <Fresco paint={queenPaint} size={[4, 3]} pos={[5.27, 3.4, 1.2]} rotY={-Math.PI / 2} />}
      {step >= 4 && <Fresco paint={minotaurPaint} size={[3.6, 2.2]} pos={[0, 4.4, -5.27]} />}

      {/* the hollow cow, built part by part on its wheels */}
      <group ref={cow} position={[X0, Y0, Z0]} rotation-y={-Math.PI / 2} scale={SC}>
        {PIECES.map((p, i) => (
          <group key={i} ref={(n) => { bits.current[i] = n; }} position={p.pos} rotation={p.rot} scale={p.sc} visible={false}>
            <mesh geometry={p.g} material={p.m} />
            <lineSegments geometry={EDGES[i]} material={edge} />
          </group>
        ))}
        <Hotspot key={fit} pos={[0, 0.3, 0]} enabled={on(2) && fit < 4} label={UI.parts[Math.min(fit, 3)]} onUse={fitNext} radius={4.5} />
        <Hotspot pos={[0, 0.3, 0]} enabled={on(3)} onUse={adv} radius={5} />
      </group>
    </>
  );
}
