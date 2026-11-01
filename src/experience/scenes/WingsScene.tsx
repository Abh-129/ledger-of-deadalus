import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { useStore } from '../../store';
import Flight from '../games/flight/Flight';
import { COL, GRAD, Prim, SkyDome } from '../shared/look';
import { Polyline, PolyHandle } from '../shared/lines';
import { Sea } from '../shared/sea';
import { smooth, useRig, useStepT, Wp } from '../shared/rig';

const N = 12;
const WAX = new THREE.Color(COL.ochre).multiplyScalar(0.95);
const WPS: Wp[] = [
  { p: [0, 2.3, 2.6], l: [0, 2.3, -8] },
  { p: [0.2, 2.0, 0.9], l: [0, 1.0, -1.3] },
  { p: [1.0, 1.5, 0.4], l: [0.2, 1.05, -1.2] },
  { p: [0, 1.9, 0.9], l: [0, 1.6, -1.3] },
  { p: [0, 1.7, 1.3], l: [0, 1.9, -2.2] },
];

export default function WingsScene() {
  const beat = useStore((s) => s.beat);
  return beat === 'commission' ? <Tower /> : <Flight />;
}

function Tower() {
  const t = useStepT(); useRig(WPS, t);
  const feathers = useRef<THREE.Group[]>([]), wing = useRef<THREE.Group>(null), thread = useRef<PolyHandle>(null);
  const wax = useRef<THREE.Mesh>(null), hand = useRef<THREE.Group>(null), thumb = useRef<THREE.Mesh>(null);
  const lens = Array.from({ length: N }, (_, i) => 0.35 + i * 0.075); // shortest to longest

  useFrame(() => {
    const T = t.current;
    feathers.current.forEach((g, i) => {
      const e = smooth(0.5 + i * 0.03, 0.85 + i * 0.03, T);
      const px = (i - (N - 1) / 2) * 0.125;
      const pile = [1.5 + (i % 4) * 0.1, 0.1 + Math.floor(i / 4) * 0.02, 0.2 - (i % 3) * 0.1];
      g.position.set(pile[0] + (px - pile[0]) * e, pile[1] + Math.sin(e * Math.PI) * 0.5 * (1 - 0) + 0.0, pile[2] * (1 - e));
      const curve = smooth(1.0, 1.45, T);
      g.rotation.set(curve * (0.1 + 0.55 * (i / (N - 1))), (1 - e) * (i % 2 ? 1.2 : -1.2), (1 - e) * 0.4);
    });
    thread.current?.set([[-0.78, 0.02, -0.3], [0.78, 0.02, -0.3]], smooth(0.95, 1.15, T));
    if (wax.current) { const w = smooth(1.05, 1.3, T), p = smooth(2.0, 2.3, T); wax.current.scale.set(Math.max(0.001, w), 1 - 0.45 * p, 1 + 0.4 * p); }
    if (wing.current) { wing.current.position.y = 0.95 + 0.55 * smooth(2.6, 3.1, T); wing.current.rotation.x = -0.75 * smooth(2.6, 3.2, T); }
    if (hand.current) {
      const a = smooth(1.55, 1.95, T);
      hand.current.position.set(THREE.MathUtils.lerp(1.8, 0.5, a), THREE.MathUtils.lerp(1.7, 1.12, a), THREE.MathUtils.lerp(-0.3, -1.18, a));
      hand.current.visible = T > 1.5 && T < 3.1;
    }
    if (thumb.current) thumb.current.position.y = -0.05 - 0.035 * smooth(1.95, 2.3, T);
  });

  return (
    <>
      <color attach="background" args={[COL.night]} />
      <fogExp2 attach="fog" args={[COL.deepSea, 0.01]} />
      <ambientLight intensity={0.5} color="#6f8fc4" />
      <directionalLight position={[2, 6, -6]} intensity={0.7} color="#9db8ea" />
      <pointLight position={[-1.5, 2.3, -0.8]} color={COL.ochre} intensity={26} distance={10} decay={1.7} />
      <SkyDome top={COL.night} mid="#0d1a28" bottom="#17364d" sun={new THREE.Color(0.8, 0.85, 0.95)} sunDir={[-0.35, 0.45, -1]} sunSize={0.9975} />
      <Sea amp={0.5} y={-30} dens={0.006} />
      {/* a high tower room of the Labyrinth complex */}
      <Prim args={[9, 0.2, 9]} pos={[0, -0.1, 0]} color="#5b5446" />
      <Prim args={[0.3, 6, 9]} pos={[-4.4, 3, 0]} color="#1b3d57" />
      <Prim args={[0.3, 6, 9]} pos={[4.4, 3, 0]} color="#1b3d57" />
      <Prim args={[9, 1.6, 0.3]} pos={[0, 0.8, -4.2]} color="#1b3d57" />
      <Prim args={[9, 2.4, 0.3]} pos={[0, 4.8, -4.2]} color="#1b3d57" />
      <Prim args={[2.8, 2, 0.3]} pos={[-3.0, 2.6, -4.2]} color="#1b3d57" />
      <Prim args={[2.8, 2, 0.3]} pos={[3.0, 2.6, -4.2]} color="#1b3d57" />
      <Prim args={[2.4, 0.1, 1.3]} pos={[0, 0.85, -1.2]} color="#7a5a38" />
      {[[-1.1, -0.7], [1.1, -0.7], [-1.1, -1.7], [1.1, -1.7]].map(([x, z], i) => <Prim key={i} args={[0.1, 0.8, 0.1]} pos={[x, 0.4, z]} color="#5e4529" />)}
      <Prim args={[0.04, 1.2, 0.04]} pos={[-1.5, 3.0, -0.8]} color="#6b5a45" outline={false} />
      <Prim shape="sphere" args={[0.13, 12, 10]} pos={[-1.5, 2.35, -0.8]} glow />

      <group ref={wing} position={[0, 0.95, -1.2]}>
        {lens.map((L, i) => (
          <group key={i} ref={(n) => { if (n) feathers.current[i] = n; }}>
            <mesh position={[0, 0.01, -L / 2]} scale={[0.11, 0.016, L]}><boxGeometry /><meshToonMaterial color={COL.limestone} gradientMap={GRAD} /></mesh>
          </group>
        ))}
        <Polyline ref={thread} max={4} thick={0.02} />
        <mesh ref={wax} position={[0, 0.02, 0.01]}><boxGeometry args={[1.62, 0.035, 0.13]} /><meshBasicMaterial color={WAX} toneMapped={false} /></mesh>
      </group>
      <group ref={hand} position={[1.8, 1.7, -0.3]}>
        <Prim args={[0.12, 0.05, 0.16]} color={COL.skin} />
        <mesh ref={thumb} position={[0, -0.05, 0]}><cylinderGeometry args={[0.022, 0.026, 0.1, 8]} /><meshToonMaterial color={COL.skin} gradientMap={GRAD} /></mesh>
      </group>
    </>
  );
}
