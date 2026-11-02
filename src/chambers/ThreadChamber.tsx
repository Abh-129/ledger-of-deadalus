import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COL, LOOK, Prim } from '../experience/shared/look';
import { ROOMS, THREAD } from '../world/layout';
import { Fresco, figure, type Paint } from '../world/Fresco';
import { Hotspot } from '../world/interact';
import { sfx } from '../audio/sounds';
import { useStore } from '../store';
import type { ChamberProps } from '../world/chambers';

// Chamber IV: one stool, one ball of ochre thread. It is let out to the entry door (step 1),
// then the door falls shut and the key light turns red (steps 3 and 4).
// The stool stands toward the exit so the thread runs back past the player to the entry post.
const BALL: [number, number, number] = [1.2, 0.6, -2.0];
const POST: [number, number, number] = [-1.0, 0.6, 3.0]; // clear of the slammed panel (z 3.13 to 3.27)
const PANEL_UP = 3.4; // metres above the shut position; hidden behind the ceiling
const SEGS = 48, RADIAL = 5;

const F = LOOK.fresco;
const ln = (g: CanvasRenderingContext2D, w: number) => { g.strokeStyle = F.line; g.lineWidth = w; g.stroke(); };
const crown = (g: CanvasRenderingContext2D, x: number, y: number, k: number) => {
  g.fillStyle = F.earth; g.beginPath(); g.moveTo(x - 6 * k, y);
  for (let i = 0; i < 4; i++) { g.lineTo(x - 6 * k + i * 3 * k + 1.5 * k, y - 8 * k); g.lineTo(x - 6 * k + (i + 1) * 3 * k, y); }
  g.closePath(); g.fill(); ln(g, 2 * k);
};

// A young woman (left, skirt) and an older craftsman (right, bearded); the ball of thread passes between their hands.
const pairPaint: Paint = (g, w, h) => {
  const k = h / 100, y = h * 0.93, fh = h * 0.78;
  g.fillStyle = F.earth; g.fillRect(0, y, w, h - y);
  figure(g, { x: w * 0.3, y, h: fh, facing: 1, pose: 'reach', fill: F.skinPale });
  g.fillStyle = F.blue; g.beginPath(); g.moveTo(w * 0.3 - 7 * k, y - 40 * k); g.lineTo(w * 0.3 + 8 * k, y - 40 * k); g.lineTo(w * 0.3 + 15 * k, y - 2 * k); g.lineTo(w * 0.3 - 13 * k, y - 2 * k); g.closePath(); g.fill(); ln(g, 2 * k);
  figure(g, { x: w * 0.7, y, h: fh * 0.92, facing: -1, pose: 'reach', fill: F.skin });
  g.fillStyle = F.line; g.beginPath(); g.ellipse(w * 0.7 - 4 * k, y - fh * 0.92 * 0.82, 3 * k, 5 * k, 0, 0, 6.3); g.fill(); // beard
  g.strokeStyle = F.line; g.lineWidth = 2 * k; g.beginPath(); g.moveTo(w * 0.36, y - fh * 0.62); g.quadraticCurveTo(w * 0.5, y - fh * 0.5, w * 0.64, y - fh * 0.62); g.stroke(); // the thread between hands
  g.fillStyle = F.plaster; g.beginPath(); g.arc(w * 0.5, y - fh * 0.54, 6 * k, 0, 6.3); g.fill(); ln(g, 2 * k);
};

// The plan you walked: every room from layout.ts and the THREAD polyline, mapped to the canvas.
const keys = ['saw', 'cow', 'labyrinth', 'thread', 'wings'] as const;
const rect = (k: typeof keys[number]) => { const r = ROOMS[k], q = Math.abs(Math.sin(r.yaw)) > 0.5, [a, b] = q ? [r.size[1], r.size[0]] : r.size; return [r.center[0] - a / 2, r.center[1] - b / 2, a, b]; };
const mapPaint: Paint = (g, w, h) => {
  const xs = [...THREAD.map((p) => p[0]), ...keys.flatMap((k) => [rect(k)[0], rect(k)[0] + rect(k)[2]])];
  const zs = [...THREAD.map((p) => p[1]), ...keys.flatMap((k) => [rect(k)[1], rect(k)[1] + rect(k)[3]])];
  const x0 = Math.min(...xs), z0 = Math.min(...zs), pad = 0.1 * w, s = Math.min((w - 2 * pad) / (Math.max(...xs) - x0), (h - 2 * pad) / (Math.max(...zs) - z0));
  const X = (x: number) => pad + (x - x0) * s, Z = (z: number) => pad + (z - z0) * s;
  g.fillStyle = F.earth; g.strokeStyle = F.line; g.lineWidth = 2.5; g.lineJoin = 'round';
  for (const k of keys) { const [x, z, a, b] = rect(k); g.fillRect(X(x), Z(z), a * s, b * s); g.strokeRect(X(x), Z(z), a * s, b * s); }
  g.strokeStyle = COL.ochre; g.lineWidth = 5; g.beginPath(); THREAD.forEach((p, i) => (i ? g.lineTo(X(p[0]), Z(p[1])) : g.moveTo(X(p[0]), Z(p[1])))); g.stroke();
  g.fillStyle = COL.ochre; g.beginPath(); g.arc(X(THREAD[0][0]), Z(THREAD[0][1]), 6, 0, 6.3); g.fill();
};

// Minos by the exit, in red: the cost the thread did not pay.
const minosPaint: Paint = (g, w, h) => {
  const k = h / 100, y = h * 0.93, fh = h * 0.8;
  g.fillStyle = F.earth; g.fillRect(0, y, w, h - y);
  figure(g, { x: w / 2, y, h: fh, facing: -1, pose: 'stand', fill: COL.red });
  crown(g, w / 2 - 3 * fh / 100, y - 0.88 * fh, k);
};

export default function ThreadChamber({ step, state }: ChamberProps) {
  const advance = () => useStore.getState().advance();
  const cur = state === 'current';
  const zd = ROOMS.thread.size[1] / 2 - 0.3;
  const curve = useMemo(() => new THREE.CatmullRomCurve3(
    [BALL, [1.0, 0.03, -1.4], [0.5, 0.03, 0.1], [-0.2, 0.03, 1.7], [-0.85, 0.4, 2.7], [POST[0], 1.0, POST[2]]].map((p) => new THREE.Vector3(...p))), []);
  const tube = useRef<THREE.TubeGeometry>(null), ball = useRef<THREE.Group>(null), panel = useRef<THREE.Group>(null), light = useRef<THREE.PointLight>(null), redKey = useRef<THREE.PointLight>(null), kick = useRef(0);
  const k = useRef({ thread: step >= 1 ? 1 : 0, red: step >= 3 ? 1 : 0, shut: step >= 4 ? 1 : 0 }).current;

  useFrame((_, dt) => {
    const rm = useStore.getState().settings.reducedMotion, d = Math.min(dt, 0.1);
    const go = (key: 'thread' | 'red' | 'shut', to: number, lam: number) => { k[key] = rm ? to : THREE.MathUtils.damp(k[key], to, lam, d); };
    go('thread', step >= 1 ? 1 : 0, 1.2); go('red', step >= 3 ? 1 : 0, 1.5); go('shut', step >= 4 ? 1 : 0, 9);
    if (tube.current) tube.current.setDrawRange(0, Math.floor(k.thread * SEGS * RADIAL * 2) * 3);
    ball.current?.scale.setScalar(1 - 0.35 * k.thread);
    if (panel.current) { panel.current.position.y = 1.4 + PANEL_UP * (1 - k.shut); panel.current.visible = k.shut > 0.02; }
    kick.current = Math.max(0, kick.current - d * 2.5);
    // red adds to the moon key, never replaces it, so the room stays above the brightness floor
    if (light.current) light.current.intensity = state === 'ahead' ? 0 : LOOK.moon.intensity;
    if (redKey.current) redKey.current.intensity = state === 'ahead' ? 0 : LOOK.cost.intensity * (1.6 * k.red + 3 * kick.current);
  });

  // the slam lands as the panel arrives, not as the caption does
  useEffect(() => {
    if (!cur || step !== 4) return;
    const t = setTimeout(() => { sfx.slam(); kick.current = 1; }, 250); // the red flash is the forward cue for a slam behind the player
    return () => clearTimeout(t);
  }, [cur, step]);

  return (
    <group>
      <pointLight ref={light} position={[0.6, 2.8, 0.2]} color={LOOK.moon.color} intensity={LOOK.moon.intensity} distance={LOOK.moon.distance} />
      <pointLight ref={redKey} position={[0, 2.6, -1]} color={LOOK.cost.color} intensity={0} distance={LOOK.cost.distance} />
      <Fresco paint={pairPaint} size={[3.4, 2.2]} pos={[3.28, 2.2, -0.4]} rotY={-Math.PI / 2} />
      {step >= 2 && <Fresco paint={mapPaint} size={[2.2, 3]} pos={[-2.12, 2, -3.28]} />}
      {step >= 3 && <Fresco paint={minosPaint} size={[2.2, 3]} pos={[2.12, 2, -3.28]} version={step} />}
      <Prim shape="cyl" args={[0.26, 0.2, 0.42, 10]} color={COL.wood} pos={[BALL[0], 0.21, BALL[2]]} />
      <group ref={ball} position={BALL}><Prim shape="sphere" args={[0.17, 16, 12]} glow /></group>
      <mesh visible={step >= 1}>
        <tubeGeometry ref={tube} args={[curve, SEGS, 0.014, RADIAL]} />
        <meshBasicMaterial color={COL.ochre} toneMapped={false} />
      </mesh>
      <Prim args={[0.14, 1.2, 0.14]} color={COL.wood} pos={POST} />
      <group ref={panel} position={[0, 1.4 + PANEL_UP, zd]} visible={false}>
        <Prim args={[2.1, 2.8, 0.14]} color={LOOK.stone.wall} />
      </group>
      <Hotspot pos={[BALL[0], 0.85, BALL[2]]} enabled={cur && (step === 0 || step === 2 || step === 3)} onUse={advance} />
      <Hotspot pos={[POST[0], 1.0, POST[2]]} enabled={cur && step === 1} onUse={advance} />
      <Hotspot pos={[0, 1.5, zd - 0.1]} enabled={cur && step === 4} onUse={advance} />
    </group>
  );
}
