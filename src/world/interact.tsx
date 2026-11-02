import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { UI } from '../content/copy';
import { LOOK } from '../experience/shared/look';
import { useStore } from '../store';

interface Spot { obj: THREE.Object3D | null; use: () => void; enabled: boolean; label: string; radius: number }
const spots = new Set<Spot>();
let focused: Spot | null = null;
const v = new THREE.Vector3(), fwd = new THREE.Vector3(), COS30 = Math.cos(Math.PI / 6);

/** Called by Player each frame: the nearest enabled spot within its radius and 30 degrees of view centre. Writes store.focus only on change. */
export function updateFocus(cam: THREE.Camera, on: boolean) {
  let best: Spot | null = null, bd = Infinity;
  if (on) {
    cam.getWorldDirection(fwd);
    for (const h of spots) {
      if (!h.enabled || !h.obj) continue;
      h.obj.getWorldPosition(v).sub(cam.position);
      const d = v.length();
      if (d < h.radius && d < bd && v.dot(fwd) > COS30 * d) { best = h; bd = d; }
    }
  }
  const label = best ? best.label : null;
  if (best !== focused || label !== useStore.getState().focus) { focused = best; useStore.getState().set({ focus: label }); }
}
export const useFocused = () => focused?.use();

export function Hotspot({ pos, onUse, enabled = true, label = UI.use, radius = 2.4 }: {
  pos: [number, number, number]; onUse: () => void; enabled?: boolean; label?: string; radius?: number;
}) {
  const obj = useRef<THREE.Group>(null), glint = useRef<THREE.Mesh>(null);
  const spot = useRef<Spot>({ obj: null, use: onUse, enabled, label, radius }).current;
  Object.assign(spot, { use: onUse, enabled, label, radius });
  useEffect(() => { spot.obj = obj.current; spots.add(spot); return () => { spots.delete(spot); }; }, [spot]);
  useFrame(({ clock }) => {
    glint.current?.scale.setScalar(useStore.getState().settings.reducedMotion ? 1 : 1 + 0.25 * Math.sin(clock.elapsedTime * 3));
  });
  return (
    <group ref={obj} position={pos}>
      <mesh ref={glint} visible={enabled}><sphereGeometry args={[0.05, 12, 8]} /><meshBasicMaterial color={LOOK.fresco.plaster} /></mesh>
    </group>
  );
}
