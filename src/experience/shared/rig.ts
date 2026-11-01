import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useStore } from '../../store';

export type Wp = { p: [number, number, number]; l: [number, number, number] };
const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2); // power2.inOut
export const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** Smoothed chapter step (float). Scenes key their hero moments off this. */
export function useStepT() {
  const t = useRef(0);
  useFrame((_, dt) => {
    const s = useStore.getState();
    t.current = s.settings.reducedMotion ? s.step : THREE.MathUtils.damp(t.current, s.step, 1.7, Math.min(dt, 0.1));
  });
  return t;
}

/** Camera flies between waypoints as t moves between integers. */
export function useRig(wps: Wp[], t: React.MutableRefObject<number>) {
  const camera = useThree((s) => s.camera);
  const v = useMemo(() => ({ p: new THREE.Vector3(), l: new THREE.Vector3(), a: new THREE.Vector3(), b: new THREE.Vector3() }), []);
  useFrame(() => {
    const f = Math.min(Math.max(t.current, 0), wps.length - 1);
    const i = Math.min(Math.floor(f), wps.length - 2), u = ease(f - i);
    const A = wps[i], B = wps[i + 1];
    v.p.set(...A.p).lerp(v.a.set(...B.p), u); v.l.set(...A.l).lerp(v.b.set(...B.l), u);
    camera.position.copy(v.p); camera.lookAt(v.l);
  });
}
