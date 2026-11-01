import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { useStore } from '../../store';
import { COL, GLOW, Prim, SkyDome } from '../shared/look';
import { Sea } from '../shared/sea';

const LAMP = new THREE.Vector3(-6, 8, -150);

export default function TitleScene() {
  const diving = useStore((s) => s.diving);
  const d = useRef(0);
  const p = useRef(new THREE.Vector3()), l = useRef(new THREE.Vector3());
  useFrame(({ camera, clock }, dt) => {
    d.current = diving ? Math.min(1, d.current + dt / 1.3) : 0;
    const e = d.current * d.current * (3 - 2 * d.current);
    const s = clock.elapsedTime * 0.06;
    p.current.set(Math.sin(s) * 10, 34 - e * 26, 70 - e * 150).lerp(new THREE.Vector3(LAMP.x + 2, 14, -112), 0);
    camera.position.copy(p.current);
    l.current.set(0, 4 + e * 4, -150).lerp(LAMP, e);
    camera.lookAt(l.current);
  });
  return (
    <>
      <color attach="background" args={[COL.night]} />
      <fogExp2 attach="fog" args={[COL.deepSea, 0.0055]} />
      <ambientLight intensity={0.45} color="#6f8fc4" />
      <directionalLight position={[-30, 40, 10]} intensity={1.1} color="#8fb0e8" />
      <SkyDome top={COL.night} mid="#0d1a28" bottom="#17364d" />
      <Sea amp={0.5} dens={0.0055} />
      {/* Crete: a dark olive silhouette on the horizon with one lit window */}
      <group position={[0, 0, -150]}>
        <Prim shape="sphere" args={[1, 14, 10]} scale={[46, 12, 14]} pos={[0, 0, 0]} color="#2c3522" outline={false} />
        <Prim shape="sphere" args={[1, 14, 10]} scale={[20, 17, 9]} pos={[14, 0, -2]} color="#252d1c" outline={false} />
        <Prim shape="sphere" args={[1, 14, 10]} scale={[16, 9, 8]} pos={[-30, -1, 1]} color="#2c3522" outline={false} />
        <Prim shape="box" args={[1.4, 1, 1.4]} pos={[-6, 8.2, 14]} color={COL.ochre} glow />
        <pointLight position={[-6, 9, 16]} color={COL.ochre} intensity={900} distance={60} decay={2} />
      </group>
    </>
  );
}
