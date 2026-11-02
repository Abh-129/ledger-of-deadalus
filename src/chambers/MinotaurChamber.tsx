import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { SpotLight } from '@react-three/drei';
import * as THREE from 'three';
import { COL, LOOK, Prim } from '../experience/shared/look';
import { Minotaur } from '../experience/shared/figures';
import { sfx } from '../audio/sounds';
import { Hotspot } from '../world/interact';
import { ROOMS } from '../world/layout';
import { useStore } from '../store';
import type { ChamberProps } from '../world/chambers';

const [W, D] = ROOMS.labyrinth.size;
const PLINTH_Z = -1.2;
// Seven and seven: two rows on the plinth top (y = 0.75).
const FIGS = Array.from({ length: 14 }, (_, i) => ({ x: ((i % 7) - 3) * 0.3, z: PLINTH_Z + (i < 7 ? -0.18 : 0.18) }));
const OFF = new THREE.Color(COL.dim).multiplyScalar(0.35), ON = new THREE.Color(LOOK.cost.color).multiplyScalar(2.4);

export default function MinotaurChamber({ step, state }: ChamberProps) {
  const cur = state === 'current';
  const shadow = useRef<THREE.Group>(null), litAt = useRef<number | null>(null);
  const figs = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const target = useMemo(() => { const t = new THREE.Object3D(); t.position.set(0, 0.8, PLINTH_Z); return t; }, []);
  useEffect(() => { if (cur && step === 0) sfx.bellow(); }, [cur, step]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (shadow.current) shadow.current.position.x = Math.sin(t * 0.12) * (W / 2 - 2.2);
    if (step >= 3 && litAt.current === null) litAt.current = t; // hotspot and Continue both land here: the fourteen light over 2 s
    const k = litAt.current === null ? 0 : Math.min(1, (t - litAt.current) / 2);
    figs.current.forEach((m, i) => m?.color.lerpColors(OFF, ON, THREE.MathUtils.clamp(k * 14 - i, 0, 1)));
  });
  return (
    <group>
      <primitive object={target} />
      <SpotLight position={[-W / 2 + 1, 7.5, PLINTH_Z - 2]} target={target} color={LOOK.cost.color} intensity={80} distance={16} angle={0.5} penumbra={0.6} attenuation={9} anglePower={5} opacity={0.5} />
      <pointLight position={[0, 3.5, -D / 2 + 1.8]} color={LOOK.cost.color} intensity={70} distance={9} />{/* washes the far wall so the shadow reads */}
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
      <group ref={shadow} position={[0, 0, -D / 2 + 0.35]} visible={cur && step < 3}>
        <group scale={[1.3, 1.3, 0.01]}><Minotaur /></group>
      </group>
      <Hotspot pos={[0, 1.1, PLINTH_Z]} enabled={cur} radius={4} onUse={() => useStore.getState().advance()} />
    </group>
  );
}
