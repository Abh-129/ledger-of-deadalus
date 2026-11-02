import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { SpotLight } from '@react-three/drei';
import * as THREE from 'three';
import { COL, LOOK, Prim, RED_GLOW } from '../experience/shared/look';
import { sfx } from '../audio/sounds';
import { Hotspot } from '../world/interact';
import { ROOMS } from '../world/layout';
import { Fresco, figure, friezeTexture, type Paint } from '../world/Fresco';
import { useStore } from '../store';
import type { ChamberProps } from '../world/chambers';

const [W, D] = ROOMS.labyrinth.size, H = ROOMS.labyrinth.height;
const PLINTH_Z = -1.2, IN = 0.23; // IN: fresco inset from the room centre line (walls are 0.4 thick, inner face at 0.2)
// Seven and seven: two rows on the plinth top (y = 0.75).
const FIGS = Array.from({ length: 14 }, (_, i) => ({ x: ((i % 7) - 3) * 0.3, z: PLINTH_Z + (i < 7 ? -0.18 : 0.18) }));
const OFF = new THREE.Color(COL.dim).multiplyScalar(0.35), ON = RED_GLOW;

// Two rows of seven walking toward the exit; red once the tribute is named (step >= 2).
const procession = (lit: boolean): Paint => (g, w, h) => {
  for (let r = 0; r < 2; r++) for (let i = 0; i < 7; i++)
    figure(g, { x: (i + 0.5) * w / 7, y: h * (r ? 0.97 : 0.48), h: h * 0.4, facing: 1, pose: i % 2 ? 'carry' : 'stand', fill: lit ? LOOK.cost.color : LOOK.fresco.skin });
};
// Exit wall: the figure with the ball of thread, ochre, only once Theseus has come (step >= 3).
const threadBearer: Paint = (g, w, h) => {
  const fh = h * 0.46, x = w * 0.5, y = h * 0.9;
  figure(g, { x, y, h: fh, facing: 1, pose: 'carry', fill: LOOK.fresco.skin });
  g.strokeStyle = COL.ochre; g.fillStyle = COL.ochre; g.lineWidth = fh * 0.02; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x + fh * 0.18, y - fh * 0.62); g.bezierCurveTo(x - fh * 0.3, y - fh * 0.3, x + fh * 0.3, y - fh * 0.05, x - fh * 0.7, y); g.stroke(); // the thread trails behind
  g.beginPath(); g.arc(x + fh * 0.2, y - fh * 0.62, fh * 0.1, 0, 6.28); g.fill(); g.strokeStyle = LOOK.fresco.line; g.lineWidth = fh * 0.014; g.stroke();
};

// A flat dark horned bust, painted once; never the whole creature.
function shadowTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 384;
  const g = c.getContext('2d')!; g.fillStyle = 'rgba(6,5,4,0.92)'; g.shadowColor = 'rgba(6,5,4,0.8)'; g.shadowBlur = 8;
  g.beginPath(); g.moveTo(0, 384); g.bezierCurveTo(10, 290, 50, 250, 100, 232); g.lineTo(156, 232); g.bezierCurveTo(206, 250, 246, 290, 256, 384); g.fill();
  for (const s of [1, -1]) {
    const X = (x: number) => 128 + s * (x - 128);
    g.beginPath(); g.moveTo(X(96), 112); g.quadraticCurveTo(X(14), 104, X(20), 12); g.quadraticCurveTo(X(52), 74, X(112), 84); g.fill(); // horn
    g.beginPath(); g.ellipse(X(76), 128, 24, 11, s * 0.5, 0, 6.28); g.fill(); // ear
  }
  g.beginPath(); g.ellipse(128, 150, 46, 62, 0, 0, 6.28); g.fill();
  g.beginPath(); g.ellipse(128, 206, 30, 40, 0, 0, 6.28); g.fill();
  g.fillRect(104, 190, 48, 60);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export default function MinotaurChamber({ step, state }: ChamberProps) {
  const cur = state === 'current';
  const shadow = useRef<THREE.Group>(null), litAt = useRef<number | null>(null), belled = useRef(false);
  const figs = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const target = useMemo(() => { const t = new THREE.Object3D(); t.position.set(0, 0.8, PLINTH_Z); return t; }, []);
  const shade = useMemo(shadowTexture, []);
  const bandH = useMemo(() => { const t = friezeTexture(); t.repeat.set((W - 0.4) / 2, 1); return t; }, []); // one image, two repeats
  const bandV = useMemo(() => { const t = bandH.clone(); t.repeat.set(H / 2, 1); t.needsUpdate = true; return t; }, [bandH]);
  const procLit = step >= 2;
  useEffect(() => () => { shade.dispose(); bandH.dispose(); bandV.dispose(); }, [shade, bandH, bandV]);
  useEffect(() => { if (cur && step === 0 && !belled.current) { belled.current = true; sfx.bellow(); } }, [cur, step]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (shadow.current) shadow.current.position.x = Math.sin(t * 0.12) * (W / 2 - 2.2);
    if (step < 2) litAt.current = null;
    else if (litAt.current === null) litAt.current = t; // hotspot and Continue both land here: the fourteen light over 2 s
    const k = litAt.current === null ? 0 : Math.min(1, (t - litAt.current) / 2);
    figs.current.forEach((m, i) => m?.color.lerpColors(OFF, ON, THREE.MathUtils.clamp(k * 14 - i, 0, 1)));
  });
  const sh = LOOK.cost.shaft, z0 = -D / 2 + IN, x0 = W / 2 - IN;
  const bands: [number, number, number, number][] = [ // x, z, rotY, y for the four walls' horizontal key bands
    [0, z0, 0, 0], [0, -z0, Math.PI, 0], [-x0, 0, Math.PI / 2, 0], [x0, 0, -Math.PI / 2, 0]];
  return (
    <group>
      <primitive object={target} />
      <SpotLight position={[-W / 2 + 1, 7.5, PLINTH_Z - 2]} target={target} color={LOOK.cost.color} {...sh} />
      <Prim shape="cyl" args={[0.5, 0.5, 1, 20]} scale={[2.4, 0.75, 1.1]} pos={[0, 0.375, PLINTH_Z]} color={COL.dim} outline={false} />
      {FIGS.map((f, i) => (
        <group key={i} position={[f.x, 0.75, f.z]}>
          <mesh position={[0, 0.07, 0]}><cylinderGeometry args={[0.035, 0.05, 0.14, 6]} /><meshBasicMaterial ref={(m) => (figs.current[i] = m)} color={OFF} toneMapped={false} /></mesh>
          <mesh position={[0, 0.17, 0]}><sphereGeometry args={[0.035, 8, 6]} /><meshBasicMaterial color={COL.dim} toneMapped={false} /></mesh>
        </group>
      ))}
      <group position={[0, 0.3, 0]} visible={step >= 3}>
        <Prim shape="sphere" args={[0.3, 14, 10]} glow />
      </group>
      {/* the meander key: two bands round all four walls, a column in each corner */}
      {bands.flatMap(([x, z, ry], w) => [3.9, H - 1.2].map((y) => (
        <mesh key={`${w}-${y}`} position={[x, y, z]} rotation-y={ry}><planeGeometry args={[W - 0.4, 0.5]} /><meshLambertMaterial map={bandH} /></mesh>
      )))}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => (
        <mesh key={`${sx}${sz}`} position={[sx * (x0 - 0.01), H / 2, sz * (D / 2 - 0.5)]} rotation={[0, -sx * Math.PI / 2, Math.PI / 2]}><planeGeometry args={[H, 0.5]} /><meshLambertMaterial map={bandV} /></mesh>
      ))}
      <Fresco paint={procession(procLit)} size={[8.4, 2.8]} pos={[-x0 + 0.01, 1.7, 0]} rotY={Math.PI / 2} border="meander" version={+procLit} />
      <Fresco paint={step >= 3 ? threadBearer : () => {}} size={[3.5, 5.2]} pos={[-3, 2.7, z0 + 0.01]} border="none" version={+(step >= 3)} />
      <Fresco paint={() => {}} size={[3.5, 5.2]} pos={[3, 2.7, z0 + 0.01]} border="none" />
      <group ref={shadow} position={[0, 0, z0 + 0.03]} visible={cur && step < 3}>
        <mesh position={[0, 3, 0]}><planeGeometry args={[2.6, 3.9]} /><meshBasicMaterial map={shade} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-2} toneMapped={false} /></mesh>
      </group>
      <Hotspot pos={[0, 1.1, PLINTH_Z]} enabled={cur} radius={4} onUse={() => useStore.getState().advance()} />
    </group>
  );
}
