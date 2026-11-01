import { useFrame } from '@react-three/fiber';
import { forwardRef, useRef } from 'react';
import * as THREE from 'three';
import { COL, Prim } from './look';

type V3 = [number, number, number];
interface FigProps { pos?: V3; rot?: V3; h?: number; tunic?: string; band?: string; lookUp?: number; children?: React.ReactNode }

/** Fresco-style figure kit: tapered tunic, round head, stick limbs. Height h in metres. */
export const Person = forwardRef<THREE.Group, FigProps>(({ pos, rot, h = 1.75, tunic = COL.ink, band = COL.ochre, lookUp = 0, children }, ref) => {
  const k = h / 1.75;
  return (
    <group ref={ref} position={pos} rotation={rot} scale={k}>
      <Prim shape="cyl" args={[0.3, 0.2, 0.8, 10]} pos={[0, 0.95, 0]} color={tunic} />
      <Prim shape="cyl" args={[0.31, 0.31, 0.07, 10]} pos={[0, 0.62, 0]} color={band} outline={false} />
      <Prim shape="cyl" args={[0.07, 0.08, 0.55, 8]} pos={[-0.1, 0.27, 0]} color={COL.skin} />
      <Prim shape="cyl" args={[0.07, 0.08, 0.55, 8]} pos={[0.1, 0.27, 0]} color={COL.skin} />
      <Prim shape="cyl" args={[0.05, 0.05, 0.6, 6]} pos={[-0.3, 1.0, 0]} rot={[0, 0, 0.18]} color={COL.skin} />
      <Prim shape="cyl" args={[0.05, 0.05, 0.6, 6]} pos={[0.3, 1.0, 0]} rot={[0, 0, -0.18]} color={COL.skin} />
      <group position={[0, 1.55, 0]} rotation={[-lookUp, 0, 0]}>
        <Prim shape="sphere" args={[0.15, 12, 10]} color={COL.skin} />
        <Prim shape="sphere" args={[0.16, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} pos={[0, 0.03, -0.01]} color={COL.ink} outline={false} />
      </group>
      {children}
    </group>
  );
});
Person.displayName = 'Person';

/** Set group.userData.flap (0..1) from a scene to beat the wings. */
export const Partridge = forwardRef<THREE.Group, { pos?: V3; rot?: V3; scale?: number }>(({ pos, rot, scale = 1 }, ref) => {
  const wl = useRef<THREE.Group>(null), wr = useRef<THREE.Group>(null), self = useRef<THREE.Group | null>(null);
  useFrame(({ clock }) => {
    const g = (ref && typeof ref === 'object' ? ref.current : self.current) ?? self.current;
    const f = (g?.userData.flap as number) ?? 0;
    const a = f > 0 ? Math.sin(clock.elapsedTime * 38) * 0.9 * f : 0;
    if (wl.current) wl.current.rotation.z = 0.25 + a;
    if (wr.current) wr.current.rotation.z = -0.25 - a;
  });
  return (
    <group ref={(n) => { self.current = n; if (typeof ref === 'function') ref(n); else if (ref) (ref as React.MutableRefObject<THREE.Group | null>).current = n; }} position={pos} rotation={rot} scale={scale}>
      <Prim shape="sphere" args={[0.5, 12, 10]} scale={[0.34, 0.3, 0.5]} pos={[0, 0.22, 0]} color="#8a6a45" />
      <Prim shape="sphere" args={[0.5, 10, 8]} scale={[0.26, 0.2, 0.34]} pos={[0, 0.14, 0.05]} color={COL.limestone} outline={false} />
      <Prim shape="sphere" args={[0.5, 10, 8]} scale={[0.17, 0.17, 0.17]} pos={[0, 0.4, 0.26]} color="#a88458" />
      <Prim shape="cone" args={[0.5, 1, 6]} scale={[0.05, 0.1, 0.05]} pos={[0, 0.39, 0.38]} rot={[Math.PI / 2, 0, 0]} color={COL.red} outline={false} />
      <Prim shape="cone" args={[0.5, 1, 6]} scale={[0.14, 0.26, 0.05]} pos={[0, 0.25, -0.34]} rot={[-1.9, 0, 0]} color="#6a4e30" />
      <group ref={wl} position={[-0.15, 0.3, 0]}><Prim shape="sphere" args={[0.5, 8, 6]} scale={[0.34, 0.04, 0.3]} pos={[-0.15, 0, 0]} color="#6a4e30" /></group>
      <group ref={wr} position={[0.15, 0.3, 0]}><Prim shape="sphere" args={[0.5, 8, 6]} scale={[0.34, 0.04, 0.3]} pos={[0.15, 0, 0]} color="#6a4e30" /></group>
    </group>
  );
});
Partridge.displayName = 'Partridge';

export function Bull({ pos, rot, scale = 1, color = COL.limestone }: { pos?: V3; rot?: V3; scale?: number; color?: string }) {
  return (
    <group position={pos} rotation={rot} scale={scale}>
      <Prim shape="sphere" args={[0.5, 12, 10]} scale={[0.9, 0.85, 1.7]} pos={[0, 1.0, 0]} color={color} />
      <Prim shape="sphere" args={[0.5, 12, 10]} scale={[0.75, 0.8, 0.8]} pos={[0, 1.15, 0.85]} color={color} />
      <Prim shape="sphere" args={[0.5, 10, 8]} scale={[0.6, 0.6, 0.8]} pos={[0, 0.95, 1.4]} color={color} />
      <Prim shape="cone" args={[0.5, 1, 6]} scale={[0.07, 0.5, 0.07]} pos={[-0.32, 1.35, 1.35]} rot={[0, 0, 0.9]} color={COL.limestone} />
      <Prim shape="cone" args={[0.5, 1, 6]} scale={[0.07, 0.5, 0.07]} pos={[0.32, 1.35, 1.35]} rot={[0, 0, -0.9]} color={COL.limestone} />
      {[[-0.3, 0.6], [0.3, 0.6], [-0.3, -0.6], [0.3, -0.6]].map(([x, z], i) => <Prim key={i} shape="cyl" args={[0.09, 0.07, 0.8, 6]} pos={[x, 0.4, z]} color={color} />)}
    </group>
  );
}

/** Horned, broad-shouldered silhouette. Never lit, never detailed: shadow and sound only. */
export function Minotaur({ pos, rot, scale = 1 }: { pos?: V3; rot?: V3; scale?: number }) {
  const c = COL.ink;
  return (
    <group position={pos} rotation={rot} scale={scale}>
      <Prim shape="cyl" args={[0.75, 0.45, 1.6, 8]} pos={[0, 1.7, 0]} color={c} outline={false} />
      <Prim shape="cyl" args={[0.38, 0.3, 1.1, 8]} pos={[-0.3, 0.55, 0]} color={c} outline={false} />
      <Prim shape="cyl" args={[0.38, 0.3, 1.1, 8]} pos={[0.3, 0.55, 0]} color={c} outline={false} />
      <Prim shape="cyl" args={[0.22, 0.2, 1.5, 6]} pos={[-1.0, 1.7, 0.15]} rot={[0.3, 0, 0.25]} color={c} outline={false} />
      <Prim shape="cyl" args={[0.22, 0.2, 1.5, 6]} pos={[1.0, 1.7, 0.15]} rot={[0.3, 0, -0.25]} color={c} outline={false} />
      <Prim shape="sphere" args={[0.5, 10, 8]} scale={[0.9, 0.95, 1.1]} pos={[0, 2.85, 0.1]} color={c} outline={false} />
      <Prim shape="cone" args={[0.5, 1, 6]} scale={[0.14, 0.9, 0.14]} pos={[-0.62, 3.25, 0.1]} rot={[0, 0, 0.9]} color={c} outline={false} />
      <Prim shape="cone" args={[0.5, 1, 6]} scale={[0.14, 0.9, 0.14]} pos={[0.62, 3.25, 0.1]} rot={[0, 0, -0.9]} color={c} outline={false} />
    </group>
  );
}
