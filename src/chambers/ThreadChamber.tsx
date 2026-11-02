import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COL, LOOK, Prim } from '../experience/shared/look';
import { ROOMS } from '../world/layout';
import { Hotspot } from '../world/interact';
import { sfx } from '../audio/sounds';
import { useStore } from '../store';
import type { ChamberProps } from '../world/chambers';

// Chamber IV: one stool, one ball of ochre thread. It is let out to the entry door (step 1),
// then the door falls shut and the key light turns red (steps 3 and 4).
const BALL: [number, number, number] = [1.2, 0.6, -0.6];
const POST: [number, number, number] = [-1.0, 0.6, 3.2];
const PANEL_UP = 3.4; // metres above the shut position; hidden behind the ceiling
const SEGS = 48, RADIAL = 5;

export default function ThreadChamber({ step, state }: ChamberProps) {
  const advance = () => useStore.getState().advance();
  const cur = state === 'current';
  const zd = ROOMS.thread.size[1] / 2 - 0.3;
  const curve = useMemo(() => new THREE.CatmullRomCurve3(
    [BALL, [1.0, 0.03, 0.2], [0.2, 0.03, 1.5], [-0.5, 0.03, 2.5], [-0.95, 0.5, 3.1], [POST[0], 1.0, POST[2]]].map((p) => new THREE.Vector3(...p))), []);
  const tube = useRef<THREE.TubeGeometry>(null), ball = useRef<THREE.Group>(null), panel = useRef<THREE.Group>(null), light = useRef<THREE.PointLight>(null);
  const k = useRef({ thread: step >= 1 ? 1 : 0, red: step >= 3 ? 1 : 0, shut: step >= 4 ? 1 : 0 }).current;

  useFrame((_, dt) => {
    const rm = useStore.getState().settings.reducedMotion, d = Math.min(dt, 0.1);
    const go = (key: 'thread' | 'red' | 'shut', to: number, lam: number) => { k[key] = rm ? to : THREE.MathUtils.damp(k[key], to, lam, d); };
    go('thread', step >= 1 ? 1 : 0, 1.2); go('red', step >= 3 ? 1 : 0, 1.5); go('shut', step >= 4 ? 1 : 0, 9);
    if (tube.current) tube.current.setDrawRange(0, Math.floor(k.thread * SEGS * RADIAL * 2) * 3);
    ball.current?.scale.setScalar(1 - 0.35 * k.thread);
    if (panel.current) { panel.current.position.y = 1.4 + PANEL_UP * (1 - k.shut); panel.current.visible = k.shut > 0.02; }
    if (light.current) {
      light.current.color.set(LOOK.moon.color).lerp(new THREE.Color(LOOK.cost.color), k.red);
      light.current.intensity = state === 'ahead' ? 0 : THREE.MathUtils.lerp(LOOK.moon.intensity, LOOK.cost.intensity, k.red);
    }
  });

  // the slam lands as the panel arrives, not as the caption does
  useEffect(() => {
    if (!cur || step !== 4) return;
    const t = setTimeout(sfx.slam, 250);
    return () => clearTimeout(t);
  }, [cur, step]);

  return (
    <group>
      <pointLight ref={light} position={[0.6, 2.8, 0.2]} color={LOOK.moon.color} intensity={LOOK.moon.intensity} distance={LOOK.moon.distance} />
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
