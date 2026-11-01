import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { COL, GLOW, GRAD } from './look';

export interface PolyHandle { set: (pts: number[][], progress?: number) => void }

/** A thick polyline drawn as instanced boxes. Cheap to rewrite every frame (thread, compass, replay). */
export const Polyline = forwardRef<PolyHandle, { max: number; thick?: number; glow?: boolean; color?: string }>(
  ({ max, thick = 0.025, glow = true, color = COL.limestone }, ref) => {
    const mesh = useRef<THREE.InstancedMesh>(null);
    const t = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), p: new THREE.Vector3(), s: new THREE.Vector3(), d: new THREE.Vector3(), x: new THREE.Vector3(1, 0, 0), b: new THREE.Vector3() }), []);
    useLayoutEffect(() => { if (mesh.current) mesh.current.count = 0; }, []);
    useImperativeHandle(ref, () => ({
      set(pts, progress = 1) {
        const m = mesh.current; if (!m) return;
        let total = 0; const lens: number[] = [];
        for (let i = 0; i < pts.length - 1; i++) { const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1], pts[i + 1][2] - pts[i][2]); lens.push(l); total += l; }
        let remain = total * Math.min(1, Math.max(0, progress)), n = 0;
        for (let i = 0; i < lens.length && remain > 0 && n < max; i++) {
          const len = lens[i]; if (len < 1e-4) continue;
          const use = Math.min(len, remain); remain -= use;
          t.d.set(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1], pts[i + 1][2] - pts[i][2]).divideScalar(len);
          t.p.set(pts[i][0], pts[i][1], pts[i][2]).addScaledVector(t.d, use / 2);
          t.q.setFromUnitVectors(t.x, t.d); t.s.set(use + thick, thick, thick);
          m.setMatrixAt(n++, t.m.compose(t.p, t.q, t.s));
        }
        m.count = n; m.instanceMatrix.needsUpdate = true;
      },
    }), [max, thick, t]);
    return (
      <instancedMesh ref={mesh} args={[undefined, undefined, max]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        {glow ? <meshBasicMaterial color={GLOW} toneMapped={false} /> : <meshToonMaterial color={color} gradientMap={GRAD} />}
      </instancedMesh>
    );
  });
Polyline.displayName = 'Polyline';
