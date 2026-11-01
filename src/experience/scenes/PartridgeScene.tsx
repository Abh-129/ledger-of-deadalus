import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import * as fx from '../../fx';
import { COL, GRAD, Prim, SkyDome } from '../shared/look';
import { Partridge, Person } from '../shared/figures';
import { Sea } from '../shared/sea';
import { smooth, useRig, useStepT, Wp } from '../shared/rig';

const WPS: Wp[] = [
  { p: [0, 1.6, 7], l: [0, 0.4, -6] },
  { p: [-2.5, 1.5, 4.2], l: [0, 0.6, 0] },
  { p: [-1.2, 1.1, 3.2], l: [0, 0.8, 0] },
  { p: [3.2, 1.0, 2.8], l: [0.6, 0.3, -1.6] },
  { p: [4.4, 2.2, 7], l: [0.2, 0.5, -1.6] },
];

export default function PartridgeScene() {
  const t = useStepT(); useRig(WPS, t);
  const bird = useRef<THREE.Group>(null), man = useRef<THREE.Group>(null), feathers = useRef<THREE.Group>(null);
  useEffect(() => () => fx.black(0), []);
  useFrame(({ clock }) => {
    const T = t.current, time = clock.elapsedTime;
    if (bird.current) bird.current.userData.flap = T > 2.6 ? 1 : 0; // beats its wings and sings for joy
    if (man.current) man.current.rotation.x = 0.35 + 0.25 * smooth(1.5, 2.2, T); // he bows over the grave
    feathers.current?.children.forEach((c, i) => { c.position.y = 0.05 + Math.sin(time * 1.1 + i) * 0.03; c.rotation.y += 0.002; });
  });
  return (
    <>
      <color attach="background" args={['#2a4258']} />
      <fogExp2 attach="fog" args={['#3a5a73', 0.02]} />
      <ambientLight intensity={0.85} color="#a9bfd8" />
      <directionalLight position={[-10, 6, -12]} intensity={1.5} color="#f2d7ab" />
      <SkyDome top="#14263a" mid="#3a5f7d" bottom="#d8c3a0" stars={0.15} sun={new THREE.Color(1.4, 1.1, 0.7)} sunDir={[-0.3, 0.06, -1]} sunSize={0.9985} />
      <Sea amp={0.12} deep="#1a3b55" mid="#4a7ea8" line="#cfdceb" fog="#3a5a73" dens={0.02} />
      {/* a small beach on Icaria at dawn */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 4]}><circleGeometry args={[9, 28]} /><meshToonMaterial color="#c9b88f" gradientMap={GRAD} /></mesh>
      <mesh rotation-x={-Math.PI / 2} position={[2, 0.05, 6]}><circleGeometry args={[7, 24]} /><meshToonMaterial color={COL.olive} gradientMap={GRAD} /></mesh>
      <Prim shape="sphere" args={[1, 10, 6]} scale={[0.9, 0.28, 0.5]} pos={[0, 0.1, -0.2]} color="#8a7a5a" />
      <Person ref={man} pos={[-0.5, 0, 0.7]} rot={[0.35, 0.9, 0]} h={1.5} tunic={COL.dim} band={COL.ochre} />
      <group ref={feathers}>
        {Array.from({ length: 9 }, (_, i) => (
          <mesh key={i} position={[-5 + i * 1.2, 0.05, -4.5 - (i % 3) * 1.5]} rotation={[0, i, 0]} scale={[0.5, 0.02, 0.12]}><boxGeometry /><meshToonMaterial color={COL.limestone} gradientMap={GRAD} /></mesh>
        ))}
      </group>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => <Prim key={i} shape="cone" args={[0.04, 0.4, 4]} pos={[1.8 + i * 0.28, 0.25, -1.3 - (i % 3) * 0.25]} color="#8b9660" outline={false} />)}
      <Partridge ref={bird} pos={[1.5, 0.05, -1.4]} rot={[0, -0.6, 0]} scale={2.1} />
    </>
  );
}
