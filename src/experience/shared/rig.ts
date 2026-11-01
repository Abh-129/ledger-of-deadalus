import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { useStore } from '../../store';

export const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** Smoothed chapter step (float). Chambers key their hero moments off this. */
export function useStepT() {
  const t = useRef(0);
  useFrame((_, dt) => {
    const s = useStore.getState();
    t.current = s.settings.reducedMotion ? s.step : THREE.MathUtils.damp(t.current, s.step, 1.7, Math.min(dt, 0.1));
  });
  return t;
}
