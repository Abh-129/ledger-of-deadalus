import { Sparkles, SpotLight } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { sfx } from '../audio/sounds';
import { UI } from '../content/copy';
import { Person } from '../experience/shared/figures';
import { COL, GLOW, LOOK, Prim } from '../experience/shared/look';
import { smooth } from '../experience/shared/rig';
import { useStore } from '../store';
import { Fresco, figure, type Paint } from '../world/Fresco';
import { Hotspot } from '../world/interact';
import type { ChamberProps } from '../world/chambers';

const N = 12, K = 11, GAP = 0.09, TZ = -1.2; // feathers, the sealed segment Icarus presses, spacing, table z
const len = (i: number) => 0.3 + i * 0.06; // shortest to longest
const fx = (i: number) => (i - (N - 1) / 2) * GAP;
const SHOULDER = new THREE.Vector3(1.3, 1.04, -0.95), HOVER = new THREE.Vector3(fx(K), 1.25, -0.68), PRESS = new THREE.Vector3(fx(K), 0.94, -0.68);
const DIM = GLOW.clone().multiplyScalar(0.3), UP = new THREE.Vector3(0, 1, 0);
const BANDS: [number, string][] = [[2.2, LOOK.sky.day[0]], [6.2, LOOK.craft.color], [10.4, LOOK.fresco.plaster]]; // spray, the middle course, heat

// ponytail: a lid of day sky over the open roof, hidden once the run has moved on (World's night dome is behind it)
function SkyLid() {
  const geo = useMemo(() => {
    const g = new THREE.SphereGeometry(60, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), p = g.attributes.position, c: number[] = [];
    const [top, mid, low] = LOOK.sky.day.map((h) => new THREE.Color(h)), o = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const t = p.getY(i) / 60;
      o.copy(low).lerp(mid, smooth(0, 0.9, t)).lerp(top, smooth(0.9, 1, t)); c.push(o.r, o.g, o.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); return g;
  }, []);
  return <mesh geometry={geo} position={[0, 1.6, 0]} renderOrder={-5}><meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} /></mesh>;
}

const F = LOOK.fresco, WALL = 2.78;
const ln = (g: CanvasRenderingContext2D, w: number) => { g.strokeStyle = F.line; g.lineWidth = w; g.lineJoin = 'round'; g.stroke(); };
const poly = (g: CanvasRenderingContext2D, pts: number[][], fill: string, w: number) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fillStyle = fill; g.fill(); ln(g, w); };
const waves = (g: CanvasRenderingContext2D, x0: number, x1: number, y0: number, y1: number, k: number) => {
  g.fillStyle = F.blue; g.fillRect(x0, y0, x1 - x0, y1 - y0);
  for (let y = y0 + 14 * k; y < y1; y += 22 * k) { g.beginPath(); for (let x = x0; x <= x1; x += 8 * k) g.lineTo(x, y + Math.sin(x / (14 * k) + y) * 4 * k); g.strokeStyle = F.plaster; g.lineWidth = 2 * k; g.stroke(); }
};
const ship = (g: CanvasRenderingContext2D, x: number, y: number, s: number, k: number) => {
  poly(g, [[x - 40 * s, y - 12 * s], [x + 44 * s, y - 14 * s], [x + 30 * s, y + 6 * s], [x - 28 * s, y + 6 * s]], F.earth, 2.5 * k);
  g.beginPath(); g.moveTo(x, y - 12 * s); g.lineTo(x, y - 62 * s); ln(g, 3 * k);
  poly(g, [[x + 3 * s, y - 60 * s], [x + 34 * s, y - 24 * s], [x + 3 * s, y - 24 * s]], F.plaster, 2.5 * k);
};
// the shore and the sea, Minos on the land: a crowned figure beside the water
const seaPaint: Paint = (g, w, h) => {
  const k = w / 1380, y = h * 0.62;
  waves(g, 0, w * 0.74, y, h, k); g.fillStyle = F.earth; g.fillRect(w * 0.74, y - 14 * k, w * 0.26, h - y + 14 * k);
  [[0.15, 0.8], [0.4, 1.1], [0.6, 0.7]].forEach(([a, s]) => ship(g, w * a, y + 40 * k * s, 1.3 * k * s * 1.4, k));
  figure(g, { x: w * 0.86, y: y + 16 * k, h: h * 0.55, facing: -1, pose: 'raise', fill: F.skin });
  poly(g, [[w * 0.83, y - h * 0.5], [w * 0.835, y - h * 0.6], [w * 0.85, y - h * 0.54], [w * 0.865, y - h * 0.62], [w * 0.88, y - h * 0.54], [w * 0.895, y - h * 0.6], [w * 0.9, y - h * 0.5]], COL.limestone, 2.5 * k);
};
const birdsPaint: Paint = (g, w, h) => {
  const k = w / 1380;
  for (let i = 0; i < 9; i++) { const x = w * (0.1 + i * 0.1), y = h * (0.45 + 0.2 * Math.sin(i * 2.3)), s = 26 * k * (1 + (i % 3) * 0.3); g.beginPath(); g.moveTo(x - s, y - s * 0.3); g.quadraticCurveTo(x - s * 0.4, y - s * 0.6, x, y); g.quadraticCurveTo(x + s * 0.4, y - s * 0.6, x + s, y - s * 0.3); ln(g, 3.5 * k); }
};
// a father and a small son with feathers; the son's hand is on the wax
const pairPaint: Paint = (g, w, h) => {
  const k = w / 870, y = h * 0.86;
  g.fillStyle = F.earth; g.fillRect(0, y, w, h - y);
  g.fillStyle = COL.limestone; g.fillRect(w * 0.38, y - 66 * k, w * 0.24, 10 * k); ln(g, 2.5 * k); // the table edge
  for (let i = 0; i < 7; i++) { poly(g, [[w * 0.4 + i * 22 * k, y - 66 * k], [w * 0.4 + i * 22 * k + 16 * k, y - 66 * k], [w * 0.4 + i * 22 * k + 8 * k, y - (96 + i * 6) * k]], F.plaster, 2 * k); }
  g.fillStyle = COL.ochre; g.beginPath(); g.ellipse(w * 0.55, y - 70 * k, 22 * k, 7 * k, 0, 0, 6.3); g.fill(); ln(g, 2 * k); // the wax
  figure(g, { x: w * 0.22, y, h: h * 0.7, facing: 1, pose: 'reach', fill: F.skin });
  figure(g, { x: w * 0.76, y, h: h * 0.4, facing: -1, pose: 'reach', fill: F.skinPale, small: true });
};
// the sun, the sea and the way between them: the path is the solved thing, in ochre
const pathPaint: Paint = (g, w, h) => {
  const k = w / 870, hz = h * 0.58;
  g.fillStyle = F.skinPale; g.beginPath(); g.arc(w / 2, hz - h * 0.26, h * 0.17, 0, 6.3); g.fill(); ln(g, 3 * k);
  for (let a = 0; a < 6.28; a += 0.45) { g.beginPath(); g.moveTo(w / 2 + Math.cos(a) * h * 0.2, hz - h * 0.26 + Math.sin(a) * h * 0.2); g.lineTo(w / 2 + Math.cos(a) * h * 0.27, hz - h * 0.26 + Math.sin(a) * h * 0.27); ln(g, 3 * k); }
  waves(g, 0, w, hz, h, k);
  poly(g, [[w * 0.47, hz], [w * 0.53, hz], [w * 0.66, h], [w * 0.34, h]], COL.ochre, 3 * k);
};

function Gull({ i }: { i: number }) {
  const g = useRef<THREE.Group>(null), l = useRef<THREE.Group>(null), r = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const rm = useStore.getState().settings.reducedMotion, a = i * 2.1 + (rm ? 0 : clock.elapsedTime * 0.3), f = rm ? 0 : Math.sin(clock.elapsedTime * (2 + i * 0.3)) * 0.35;
    g.current?.position.set(Math.cos(a) * 1.5, 9.5 + i * 1.3, TZ + Math.sin(a) * 1.5); if (g.current) g.current.rotation.y = -a;
    if (l.current && r.current) { l.current.rotation.z = 0.2 + f; r.current.rotation.z = -0.2 - f; }
  });
  const wing = <mesh position={[0.25, 0, 0]}><boxGeometry args={[0.5, 0.02, 0.14]} /><meshBasicMaterial color={LOOK.fresco.line} fog={false} /></mesh>;
  return <group ref={g}><group ref={l} scale-x={-1}>{wing}</group><group ref={r}>{wing}</group></group>;
}

export default function WingsChamber({ step, state }: ChamberProps) {
  const store = useStore.getState;
  const tt = useRef(0), feathers = useRef<THREE.Group[]>([]), wax = useRef<THREE.Mesh[]>([]), bands = useRef<THREE.Mesh[]>([]);
  const wing = useRef<THREE.Group>(null), tie = useRef<THREE.Group>(null), boy = useRef<THREE.Group>(null), arm = useRef<THREE.Mesh>(null), thumb = useRef<THREE.Group>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const mats = useMemo(() => ({ wax: new THREE.MeshBasicMaterial({ color: GLOW, toneMapped: false }), dip: new THREE.MeshBasicMaterial({ color: GLOW.clone(), toneMapped: false }) }), []);
  const use = () => store().advance();
  const on = (n: number) => state === 'current' && step === n;

  useEffect(() => { if (state === 'current') { if (step === 1) sfx.pluck(); if (step === 3) sfx.wind(); } }, [state, step]);

  useFrame((_, dt) => {
    const goal = state === 'done' ? 4 : Math.max(step, 0), rm = store().settings.reducedMotion;
    const T = tt.current = rm ? goal : THREE.MathUtils.damp(tt.current, goal, 1.7, Math.min(dt, 0.1));
    feathers.current.forEach((g, i) => {
      const e = smooth(i * 0.04, 0.5 + i * 0.04, T);
      g.position.set(THREE.MathUtils.lerp(-0.95 + (i % 4) * 0.06, fx(i), e), Math.sin(e * Math.PI) * 0.35, THREE.MathUtils.lerp(-0.75 + (i % 3) * 0.05, 0, e));
      g.rotation.y = (1 - e) * (i % 2 ? 1.2 : -1.2);
    });
    tie.current?.scale.set(Math.max(0.001, smooth(0.6, 0.85, T)), 1, 1);
    const pressed = smooth(1.6, 1.95, T), p = pressed * (1 - smooth(3, 3.4, T)), seal = smooth(0.8, 1.1, T);
    wax.current.forEach((m, i) => { const d = i === K ? 0.55 : Math.abs(i - K) === 1 ? 0.2 : 0; m.scale.set(seal, Math.max(0.001, seal * (1 - d * pressed)), seal); });
    mats.dip.color.copy(GLOW).lerp(DIM, pressed);
    if (wing.current) wing.current.rotation.x = -0.5 * smooth(3.6, 4, T);
    if (boy.current) { const a = smooth(1.3, 1.9, T); boy.current.visible = a > 0; boy.current.position.set(THREE.MathUtils.lerp(2.7, 1.55, a), 0, TZ); }
    if (arm.current && thumb.current) {
      const a = smooth(1.7, 2.1, T), tip = thumb.current.position.copy(HOVER).lerp(PRESS, p), d = tip.clone().sub(SHOULDER);
      arm.current.visible = thumb.current.visible = a > 0 && T < 3.6;
      arm.current.position.copy(SHOULDER).addScaledVector(d, 0.5); arm.current.scale.set(1, d.length(), 1); arm.current.quaternion.setFromUnitVectors(UP, d.normalize());
    }
    bands.current.forEach((m, j) => { const o = 0.5 * smooth(2.6 + j * 0.2, 3.3 + j * 0.2, T); m.visible = o > 0.01; (m.material as THREE.MeshBasicMaterial).opacity = o; });
  });

  return (
    <>
      {state !== 'done' && <SkyLid />}
      <primitive object={target} position={[0, 0, TZ]} />
      <SpotLight position={[0, 13.8, TZ]} target={target} castShadow={false} color={LOOK.sun.color} intensity={LOOK.sun.intensity} angle={LOOK.sun.angle} penumbra={LOOK.sun.penumbra} distance={LOOK.sun.distance}
        radiusTop={1.4} radiusBottom={1.7} attenuation={LOOK.sun.attenuation} anglePower={LOOK.sun.anglePower} opacity={LOOK.sun.opacity} />
      <Sparkles count={70} scale={[2.8, 12, 2.8]} position={[0, 7, TZ]} size={4} speed={0.3} color={LOOK.fresco.plaster} />
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.012, TZ]}><circleGeometry args={[1.6, 32]} /><meshBasicMaterial color={LOOK.fresco.plaster} transparent opacity={0.16} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} /></mesh>
      {BANDS.map(([y, c], j) => (
        <mesh key={j} ref={(m) => { if (m) bands.current[j] = m; }} position={[0, y, TZ]} visible={false}>
          <cylinderGeometry args={[1.6, 1.6, 0.5, 28, 1, true]} />
          <meshBasicMaterial color={c} transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} fog={false} toneMapped={false} />
        </mesh>
      ))}
      {[0, 1, 2].map((i) => <Gull key={i} i={i} />)}

      <Fresco paint={seaPaint} size={[4.8, 2.2]} pos={[0, 1.7, -WALL]} border="meander" />
      <Fresco paint={birdsPaint} size={[4.8, 0.8]} pos={[0, 3.4, -WALL]} border="none" />
      {step >= 2 && <Fresco paint={pairPaint} size={[3.4, 2.2]} pos={[-WALL, 1.9, TZ + 0.5]} rotY={Math.PI / 2} />}
      {step >= 3 && <Fresco paint={pathPaint} size={[3.4, 2.4]} pos={[0, 5.1, -WALL]} />}
      <Prim args={[2, 0.06, 1.2]} pos={[0, 0.82, TZ]} color={LOOK.fresco.earth} />
      {[[-0.9, -0.5], [0.9, -0.5], [-0.9, 0.5], [0.9, 0.5]].map(([x, z], i) => <Prim key={i} args={[0.08, 0.8, 0.08]} pos={[x, 0.4, TZ + z]} color={LOOK.fresco.earth} />)}

      <group ref={wing} position={[0, 0.87, TZ + 0.55]}>
        {Array.from({ length: N }, (_, i) => (
          <group key={i} ref={(g) => { if (g) feathers.current[i] = g; }}>
            <Prim args={[0.08, 0.014, len(i)]} pos={[0, 0.01, -len(i) / 2]} color={COL.limestone} />
          </group>
        ))}
        <group ref={tie} position={[0, 0.03, -0.3]}><Prim args={[N * GAP, 0.012, 0.02]} color={LOOK.fresco.earth} outline={false} /></group>
        {Array.from({ length: N }, (_, i) => (
          <mesh key={i} ref={(m) => { if (m) wax.current[i] = m; }} position={[fx(i), 0.02, -0.02]} material={i === K ? mats.dip : mats.wax}><boxGeometry args={[GAP, 0.03, 0.07]} /></mesh>
        ))}
      </group>

      <group ref={boy} visible={false} rotation-y={-Math.PI / 2}><Person h={1.4} tunic={COL.limestone} band={COL.olive} /></group>
      <mesh ref={arm} visible={false}><cylinderGeometry args={[0.04, 0.045, 1, 6]} /><meshToonMaterial color={COL.skin} /></mesh>
      <group ref={thumb} visible={false}><Prim shape="sphere" args={[0.045, 10, 8]} color={COL.skin} /></group>

      <Hotspot pos={[0, 1.05, TZ]} radius={4} enabled={on(0)} onUse={use} />
      <Hotspot pos={[0, 1.0, TZ + 0.2]} radius={4} enabled={on(1)} onUse={use} />
      <Hotspot pos={[fx(K), 1.1, -0.68]} radius={4} enabled={on(2)} onUse={use} />
      <Hotspot pos={[0, 3, TZ]} radius={5} enabled={on(3)} onUse={use} />
      <Hotspot pos={[0, 1.35, TZ]} radius={4} label={UI.takeOff} enabled={on(4)} onUse={use} />
    </>
  );
}
