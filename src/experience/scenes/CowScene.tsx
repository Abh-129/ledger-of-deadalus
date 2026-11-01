import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import * as fx from '../../fx';
import { sfx } from '../../audio/sounds';
import { UI } from '../../content/copy';
import { useStore } from '../../store';
import { Bull, Minotaur } from '../shared/figures';
import { COL, GRAD, Prim, RED_GLOW, SkyDome } from '../shared/look';
import { smooth, useRig, useStepT, Wp } from '../shared/rig';

const WPS: Wp[] = [
  { p: [0, 2.0, 5.4], l: [0, 1.3, -1.5] },
  { p: [-1.7, 1.9, 3.8], l: [0, 1.5, -2] },
  { p: [0, 2.6, 4.6], l: [0, 2.15, -1.8] },
  { p: [2.8, 1.4, 9], l: [0, 0.9, 1] },
  { p: [0.6, 1.6, 9.5], l: [0, 1.2, 26] },
];
type V3 = [number, number, number];
// sub-assemblies: [part index, exploded offset]
const SUB: Record<string, [number, V3]> = {
  frame: [0, [0, 0, -1.8]], panL: [1, [-1.7, 0.3, 0]], panR: [1, [1.7, 0.3, 0]], panT: [1, [0, 1.1, 0]],
  w0: [2, [-1.3, -0.5, 0]], w1: [2, [1.3, -0.5, 0]], w2: [2, [-1.3, -0.5, 0]], w3: [2, [1.3, -0.5, 0]], hide: [3, [0, 1.35, 0]],
};
const FINAL = ['#8a5a34', '#a36d3f', '#3d3a36', '#efe6d2'].map((c) => new THREE.Color(c));
const BLUEPRINT = new THREE.Color(COL.ochre).multiplyScalar(1.6);

export default function CowScene() {
  const t = useStepT(); useRig(WPS, t);
  const mats = useMemo(() => FINAL.map(() => new THREE.MeshToonMaterial({ gradientMap: GRAD, wireframe: true })), []);
  const refs = useRef<Record<string, THREE.Group | null>>({});
  const mino = useRef<THREE.Group>(null), cow = useRef<THREE.Group>(null), wheels = useRef<THREE.Group[]>([]), red = useRef<THREE.MeshBasicMaterial>(null);
  const [phase, setPhase] = useState(-1);
  const fired = useRef({ bellow: false, cry: false, slam: false });
  const phaseRef = useRef(-1);

  useEffect(() => () => fx.black(0), []);
  useFrame(({ clock }) => {
    const T = t.current, a = Math.max(useStore.getState().assembly, smooth(2.55, 2.95, T));
    const u = [smooth(0, 0.3, a), smooth(0.25, 0.55, a), smooth(0.5, 0.75, a), smooth(0.7, 1, a)];
    Object.entries(SUB).forEach(([k, [part, off]]) => {
      const g = refs.current[k]; if (!g) return;
      const e = 1 - u[part]; g.position.set(off[0] * e, off[1] * e, off[2] * e);
    });
    mats.forEach((m, i) => {
      m.wireframe = u[i] < 0.97;
      m.color.copy(BLUEPRINT).lerp(FINAL[i], u[i]);
      m.emissive.set(COL.ochre).multiplyScalar(0.7 * (1 - u[i]));
    });
    const ph = a <= 0.001 ? -1 : a >= 0.999 ? 4 : u[3] > 0 ? 3 : u[2] > 0 ? 2 : u[1] > 0 ? 1 : 0;
    if (ph !== phaseRef.current) { phaseRef.current = ph; setPhase(ph); }

    // roll out through the workshop door into the meadow
    const roll = smooth(2.9, 3.6, T), drop = smooth(2.85, 3.15, T);
    if (cow.current) {
      cow.current.visible = T > 0.8;
      cow.current.scale.setScalar(0.9 * smooth(0.8, 1.6, T));
      cow.current.rotation.y = 1.05 * (1 - drop) + Math.sin(clock.elapsedTime * 0.5) * 0.08 * (1 - drop); // three-quarter view while it is built
      cow.current.position.set(0, 1.95 + Math.sin(clock.elapsedTime * 1.2) * 0.04 * (1 - drop) - 1.37 * drop, -1.8 + roll * 17);
    }
    wheels.current.forEach((w) => w && (w.rotation.x = -(roll * 17) / 0.28));

    // the Minotaur is only ever a shadow and a sound
    const u4 = T - 3;
    const pulse = smooth(0.72, 0.82, u4) * (1 - smooth(0.88, 0.98, u4));
    fx.black(Math.max(0, smooth(0.35, 0.7, u4) * (0.93 - 0.5 * pulse)));
    if (mino.current) mino.current.visible = pulse > 0.02;
    if (red.current) red.current.opacity = pulse;
    if (u4 > 0.55 && !fired.current.bellow) { fired.current.bellow = true; sfx.bellow(); }
    if (u4 > 0.78 && !fired.current.cry) { fired.current.cry = true; sfx.cry(); }
    if (u4 < 0.1) fired.current = { bellow: false, cry: false, slam: false };
  });

  const sub = (k: string) => (n: THREE.Group | null) => { refs.current[k] = n; };
  const label = (i: number, p: V3) => phase >= i && phase < 4 && (
    <Html position={p} center><span className="mono" style={{ color: COL.ochre, background: 'rgba(10,18,28,.7)', padding: '2px 6px', whiteSpace: 'nowrap', opacity: phase === i ? 1 : 0.45 }}>{UI.parts[i]}</span></Html>
  );

  return (
    <>
      <color attach="background" args={[COL.night]} />
      <fogExp2 attach="fog" args={[COL.deepSea, 0.018]} />
      <ambientLight intensity={0.5} color="#6f8fc4" />
      <directionalLight position={[8, 14, 20]} intensity={0.9} color="#8fb0e8" />
      <pointLight position={[-1.6, 2.7, -2.2]} color={COL.ochre} intensity={26} distance={14} decay={1.6} />
      <SkyDome top={COL.night} mid="#0c1826" bottom="#17364d" />

      {/* workshop at Knossos */}
      <Prim args={[10.4, 0.2, 9.4]} pos={[0, -0.1, 0]} color="#4a4034" />
      <Prim args={[10.4, 5, 0.3]} pos={[0, 2.5, -4.4]} color="#1b3d57" />
      <Prim args={[0.3, 5, 9.4]} pos={[-5.1, 2.5, 0]} color="#1b3d57" />
      <Prim args={[0.3, 5, 9.4]} pos={[5.1, 2.5, 0]} color="#1b3d57" />
      <BullFresco />
      {[-1.6, 1.6].map((x) => <Prim key={x} args={[0.3, 3.4, 0.3]} pos={[x * 2.2, 1.7, 4.4]} color="#6b5a45" />)}
      <Prim args={[7.4, 0.3, 0.3]} pos={[0, 3.5, 4.4]} color="#6b5a45" />
      <Prim args={[3.6, 0.12, 1.4]} pos={[0, 0.9, -1.8]} color="#7a5a38" />
      {[[-1.6, -1.3], [1.6, -1.3], [-1.6, -2.3], [1.6, -2.3]].map(([x, z], i) => <Prim key={i} args={[0.12, 0.85, 0.12]} pos={[x, 0.42, z]} color="#5e4529" />)}
      <Prim args={[0.6, 0.04, 0.12]} pos={[-1.2, 0.98, -1.6]} rot={[0, 0.4, 0]} color="#9aa3ad" />
      <Prim args={[0.3, 0.05, 0.1]} pos={[1.2, 0.98, -2.0]} color="#7a5a38" />
      <Prim shape="cyl" args={[0.03, 0.03, 0.5, 6]} pos={[0.6, 0.99, -1.5]} rot={[0, 0, Math.PI / 2]} color="#9aa3ad" />
      <Prim args={[0.04, 1.2, 0.04]} pos={[-1.6, 3.6, -2.2]} color="#6b5a45" outline={false} />
      <Prim shape="sphere" args={[0.14, 12, 10]} pos={[-1.6, 2.95, -2.2]} glow />
      <Shavings />

      {/* the meadow beyond the door, and the bull Minos kept */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.03, 40]}><planeGeometry args={[220, 220]} /><meshToonMaterial color="#35422a" gradientMap={GRAD} /></mesh>
      <Bull pos={[3.5, 0, 27]} rot={[0, Math.PI + 0.3, 0]} scale={1.3} />
      <group ref={mino} position={[0, 0, 34]} visible={false}>
        <mesh position={[0, 4, -1]}><planeGeometry args={[40, 16]} /><meshBasicMaterial ref={red} color={RED_GLOW} transparent opacity={0} toneMapped={false} depthWrite={false} /></mesh>
        <Minotaur rot={[0, Math.PI, 0]} scale={1.6} />
      </group>

      {/* the cow: blueprint -> built */}
      <group ref={cow} position={[0, 1.95, -1.8]}>
        <group ref={sub('frame')}>
          {[-0.75, -0.38, 0, 0.38, 0.75].map((z) => <mesh key={z} position={[0, 0, z]} material={mats[0]}><torusGeometry args={[0.52, 0.03, 6, 18, Math.PI]} /></mesh>)}
          {[[-0.5, 0], [0.5, 0], [0, 0.52]].map(([x, y], i) => <mesh key={i} position={[x, y, 0]} material={mats[0]}><boxGeometry args={[0.05, 0.05, 1.9]} /></mesh>)}
        </group>
        <group ref={sub('panL')}><mesh position={[-0.56, 0.02, 0]} material={mats[1]}><boxGeometry args={[0.04, 0.8, 1.7]} /></mesh></group>
        <group ref={sub('panR')}><mesh position={[0.56, 0.02, 0]} material={mats[1]}><boxGeometry args={[0.04, 0.8, 1.7]} /></mesh></group>
        <group ref={sub('panT')}><mesh position={[0, 0.58, 0]} material={mats[1]}><boxGeometry args={[1.1, 0.04, 1.7]} /></mesh></group>
        {([[-0.62, 0.6], [0.62, 0.6], [-0.62, -0.6], [0.62, -0.6]] as const).map(([x, z], i) => (
          <group key={i} ref={sub('w' + i)}>
            <group position={[x, -0.66, z]} ref={(n) => { if (n) wheels.current[i] = n; }}>
              <mesh rotation={[0, 0, Math.PI / 2]} material={mats[2]}><cylinderGeometry args={[0.28, 0.28, 0.1, 14]} /></mesh>
              <mesh position={[0, 0.2, 0]} material={mats[2]}><boxGeometry args={[0.12, 0.06, 0.06]} /></mesh>
            </group>
          </group>
        ))}
        <group ref={sub('hide')}>
          <mesh position={[0, 0.04, 0]} scale={[0.64, 0.62, 1.12]} material={mats[3]}><sphereGeometry args={[1, 14, 10]} /></mesh>
          <mesh position={[0, 0.28, 1.05]} scale={[0.32, 0.34, 0.4]} material={mats[3]}><sphereGeometry args={[1, 12, 8]} /></mesh>
          <mesh position={[0, 0.2, 1.4]} scale={[0.2, 0.2, 0.22]} material={mats[3]}><sphereGeometry args={[1, 10, 8]} /></mesh>
          {[-1, 1].map((s) => <mesh key={s} position={[s * 0.26, 0.58, 1.0]} rotation={[0, 0, -s * 0.8]} scale={[0.05, 0.2, 0.05]} material={mats[3]}><coneGeometry args={[1, 1, 6]} /></mesh>)}
          {([[-0.3, 0.6], [0.3, 0.6], [-0.3, -0.6], [0.3, -0.6]] as const).map(([x, z], i) => <mesh key={i} position={[x, -0.36, z]} material={mats[3]}><cylinderGeometry args={[0.09, 0.08, 0.5, 6]} /></mesh>)}
          <mesh position={[0, 0.1, -1.2]} rotation={[-2.2, 0, 0]} scale={[0.06, 0.4, 0.06]} material={mats[3]}><coneGeometry args={[1, 1, 6]} /></mesh>
        </group>
        {label(0, [0.95, 0.6, 0])}{label(1, [-1.2, 0.7, 0.3])}{label(2, [1.15, -0.55, 0.7])}{label(3, [0, 1.5, 0])}
      </group>
    </>
  );
}

function BullFresco() {
  const c = COL.lapis, z = -4.2;
  return (
    <group position={[0, 0, z]}>
      {[[0, 4.1, 5.6, 0.1], [0, 0.9, 5.6, 0.1]].map(([x, y, w, h], i) => <Prim key={i} args={[w, h, 0.05]} pos={[x, y, 0]} color={COL.ochre} outline={false} />)}
      {[-2.8, 2.8].map((x) => <Prim key={x} args={[0.1, 3.2, 0.05]} pos={[x, 2.5, 0]} color={COL.ochre} outline={false} />)}
      <Prim args={[2.0, 0.8, 0.06]} pos={[-0.3, 2.4, 0.03]} color={c} outline={false} />
      <Prim args={[0.7, 0.6, 0.06]} pos={[1.0, 2.7, 0.03]} rot={[0, 0, -0.3]} color={c} outline={false} />
      <Prim shape="cone" args={[0.1, 0.5, 5]} pos={[1.3, 3.15, 0.03]} rot={[0, 0, 0.9]} color={c} outline={false} />
      {[-1.1, -0.7, 0.3, 0.6].map((x, i) => <Prim key={i} args={[0.14, 0.9, 0.06]} pos={[x, 1.7, 0.03]} rot={[0, 0, i % 2 ? 0.15 : -0.15]} color={c} outline={false} />)}
    </group>
  );
}

function Shavings() {
  const ref = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const o = new THREE.Object3D();
    for (let i = 0; i < 40; i++) {
      o.position.set((Math.random() - 0.5) * 7, 0.015, -3 + Math.random() * 4); o.rotation.set(0, Math.random() * 3, 0);
      o.scale.set(0.2 + Math.random() * 0.3, 1, 0.08); o.updateMatrix(); ref.current!.setMatrixAt(i, o.matrix);
    }
    ref.current!.instanceMatrix.needsUpdate = true;
  }, []);
  return <instancedMesh ref={ref} args={[undefined, undefined, 40]}><boxGeometry args={[1, 0.02, 1]} /><meshToonMaterial color="#c9b88f" gradientMap={GRAD} /></instancedMesh>;
}

