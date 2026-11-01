import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import * as fx from '../../fx';
import { sfx } from '../../audio/sounds';
import { COL, GLOW, Prim, SkyDome } from '../shared/look';
import { Partridge, Person } from '../shared/figures';
import { Polyline, PolyHandle } from '../shared/lines';
import { smooth, useRig, useStepT, Wp } from '../shared/rig';

const R = 9, DX = 1.3 / (R - 1), Y = 0.25, ZF = -0.55;
const CC: [number, number] = [0, 0.35]; // circle centre (x,z)
const WPS: Wp[] = [
  { p: [0.5, 1.15, 3.4], l: [0, 0.35, -0.4] },
  { p: [0.1, 0.8, 0.7], l: [0, 0.22, -0.55] },
  { p: [0.2, 1.5, 1.3], l: [0, 0.2, 0.3] },
  { p: [-0.4, 1.5, 3.8], l: [-0.7, 0.8, 0] },
  { p: [1.0, 0.7, 0.2], l: [2.2, 0.2, -2.8] },
];

export default function SawScene() {
  const t = useStepT(); useRig(WPS, t);
  const saw = useRef<PolyHandle>(null), extras = useRef<PolyHandle>(null), legs = useRef<PolyHandle>(null), circle = useRef<PolyHandle>(null);
  const blade = useRef<THREE.Mesh>(null), man = useRef<THREE.Group>(null), shadow = useRef<THREE.Mesh>(null), bird = useRef<THREE.Group>(null), light = useRef<THREE.PointLight>(null);
  const windPlayed = useRef(false);

  const { fish, tooth, skull, tail, ring } = useMemo(() => {
    const fish: number[][] = [], tooth: number[][] = [];
    for (let i = 0; i < R; i++) {
      const x = -0.65 + i * DX, h = 0.05 + 0.25 * Math.sin(Math.PI * (i + 0.5) / R);
      fish.push([x, 0], [x + 0.06, h], [x, 0], [x + 0.06, -h], [x, 0]);
      tooth.push([x, 0], [x + DX * 0.5, 0.2], [x + DX, 0], [x + DX, 0], [x + DX, 0]);
    }
    fish.push([0.65, 0]); tooth.push([0.65, 0]);
    const skull = Array.from({ length: 11 }, (_, k) => [-0.75 + Math.cos((k / 10) * Math.PI * 2) * 0.1, Math.sin((k / 10) * Math.PI * 2) * 0.08]).concat([[-0.65, 0]]);
    const tail = [[0.65, 0], [0.86, 0.18], [0.78, 0], [0.86, -0.18], [0.65, 0]];
    const ring = Array.from({ length: 65 }, (_, k) => [Math.cos((k / 64) * Math.PI * 2), Math.sin((k / 64) * Math.PI * 2)]);
    return { fish, tooth, skull, tail, ring };
  }, []);

  useEffect(() => () => fx.black(0), []);
  useFrame(() => {
    const T = t.current;
    const m = smooth(0.2, 0.9, T);
    const pts = fish.map((f, i) => [f[0] + (tooth[i][0] - f[0]) * m, Y, ZF + f[1] + (tooth[i][1] - f[1]) * m]);
    saw.current?.set(pts);
    extras.current?.set([...skull, ...tail.slice(0)].map((q) => [q[0], Y, ZF + q[1]]), 1 - m);
    if (blade.current) { blade.current.scale.set(1.3, 1, 0.22 * m + 0.001); blade.current.position.z = ZF - 0.11 * m; blade.current.visible = m > 0.02; }
    if (light.current) light.current.intensity = 0.9 * m;

    const open = smooth(1.1, 1.4, T), arms = smooth(1.05, 1.45, T), cp = smooth(1.45, 1.92, T);
    const r = 0.35 * open, th = cp * Math.PI * 2;
    const A = [CC[0], 0.23, CC[1]], B = [CC[0] + Math.cos(th) * r, 0.23, CC[1] + Math.sin(th) * r];
    const hh = Math.sqrt(0.75 * 0.75 - (r / 2) ** 2);
    const H = [(A[0] + B[0]) / 2, 0.23 + hh, (A[2] + B[2]) / 2];
    // two iron arms swing together at the hinge: the crossbar between the tops shrinks to a point
    const k = 1 - arms;
    const ta = [H[0] - 0.7 * k, H[1] + 0.1 * k, H[2] + 0.9 * k], tb = [H[0] + 0.7 * k, H[1] + 0.1 * k, H[2] + 0.9 * k];
    legs.current?.set([A, ta, tb, B], smooth(1.05, 1.2, T));
    circle.current?.set(ring.map((q) => [CC[0] + q[0] * 0.35, 0.235, CC[1] + q[1] * 0.35]), cp);

    // the man's shadow falls over the circle; no violence is shown, we cut to black
    const sh = smooth(2.2, 2.9, T);
    if (man.current) man.current.position.set(-2.4 + 0.9 * sh, 0, CC[1]);
    if (shadow.current) { const L = sh * 2.6; shadow.current.scale.set(Math.max(L, 0.001), 1, 1); shadow.current.position.set(-1.5 + 0.9 * sh + L / 2, 0.215, CC[1]); }
    const black = smooth(2.7, 2.95, T) * (1 - smooth(3.3, 3.85, T));
    fx.black(black);
    if (T > 2.8 && !windPlayed.current) { windPlayed.current = true; sfx.wind(); } else if (T < 2.6) windPlayed.current = false;

    const p = smooth(3.4, 3.98, T);
    if (bird.current) {
      bird.current.position.set(2.2 + Math.sin(p * 6) * 0.15 * (1 - p), -2.4 + 2.45 * p + Math.sin(p * Math.PI) * 1.4, -5 + 2.2 * p);
      bird.current.userData.flap = p > 0 && p < 0.96 ? 1 : 0;
      bird.current.visible = T > 3.3;
    }
  });

  return (
    <>
      <color attach="background" args={[COL.night]} />
      <fogExp2 attach="fog" args={[COL.deepSea, 0.028]} />
      <ambientLight intensity={0.55} color="#7b97c9" />
      <directionalLight position={[-6, 9, 5]} intensity={1.3} color="#9db8ea" />
      <pointLight ref={light} position={[0, 0.8, ZF]} color={COL.ochre} intensity={0} distance={5} decay={2} />
      <SkyDome top={COL.night} mid="#14243a" bottom="#3a3552" />
      {/* the citadel ledge */}
      <Prim args={[12, 0.6, 12]} pos={[0, -0.3, 2]} color="#7d776a" />
      <Prim args={[2.2, 0.2, 2.2]} pos={[0, 0.1, -0.1]} color="#a9a291" />
      {[0, 1, 2].map((i) => <Prim key={i} shape="cyl" args={[0.7, 0.7, 0.5, 14]} pos={[-3.6 + i * 0.05, 0.25 + i * 0.52, -2.5]} rot={[0, i * 0.4, i === 2 ? 0.12 : 0]} color="#bdb6a4" />)}
      <Prim shape="cyl" args={[0.6, 0.6, 3.2, 14]} pos={[-5, 1.6, -2.8]} color="#bdb6a4" />
      <Prim shape="cyl" args={[0.6, 0.6, 3.2, 14]} pos={[4.6, 1.6, -3]} color="#bdb6a4" />
      <Prim args={[2.0, 0.4, 1.2]} pos={[-0.2, 3.5, -3]} color="#a9a291" />
      {/* grass where the partridge lands */}
      <Prim args={[1.8, 0.06, 1.1]} pos={[2.2, 0.03, -2.8]} color={COL.olive} />
      {[0, 1, 2, 3, 4, 5].map((i) => <Prim key={i} shape="cone" args={[0.04, 0.3, 4]} pos={[1.6 + i * 0.22, 0.2, -2.5 - (i % 3) * 0.2]} color="#8b9660" outline={false} />)}
      {/* Athens, far below in fog */}
      <CityLights />

      <Person pos={[0.1, 0, 1.5]} h={1.3} tunic={COL.limestone} band={COL.ochre} />
      <Person ref={man} pos={[-2.4, 0, CC[1]]} h={1.85} tunic={COL.ink} band={COL.dim} />

      {/* fish spine -> saw, then compass and circle */}
      <Polyline ref={saw} max={80} thick={0.022} />
      <Polyline ref={extras} max={40} thick={0.018} />
      <Polyline ref={legs} max={4} thick={0.035} glow={false} color="#9aa3ad" />
      <Polyline ref={circle} max={80} thick={0.02} />
      <mesh ref={blade} position={[0, Y - 0.02, ZF]}><boxGeometry args={[1, 0.03, 1]} /><meshToonMaterial color="#6b7480" /></mesh>
      <mesh ref={shadow} rotation-x={-Math.PI / 2} position={[0, 0.215, CC[1]]}><planeGeometry args={[1, 1.1]} /><meshBasicMaterial color="#000" transparent opacity={0.8} /></mesh>
      <Partridge ref={bird} pos={[2.2, -3, -5]} rot={[0, Math.PI, 0]} />
    </>
  );
}

function CityLights() {
  const ref = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const m = ref.current!, o = new THREE.Object3D();
    for (let i = 0; i < 90; i++) {
      o.position.set((Math.random() - 0.5) * 70, -13 + Math.random() * 3, -14 - Math.random() * 40);
      o.scale.setScalar(0.25 + Math.random() * 0.25); o.updateMatrix(); m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  }, []);
  return <instancedMesh ref={ref} args={[undefined, undefined, 90]}><sphereGeometry args={[1, 6, 4]} /><meshBasicMaterial color={GLOW} toneMapped={false} /></instancedMesh>;
}
