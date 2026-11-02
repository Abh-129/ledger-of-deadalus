import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { sfx } from '../audio/sounds';
import { COL, GLOW, GRAD, LOOK, Prim } from '../experience/shared/look';
import { Partridge, Person } from '../experience/shared/figures';
import { Sea } from '../experience/shared/sea';
import { Hotspot } from '../world/interact';
import { useStore } from '../store';
import type { ChamberProps } from '../world/chambers';

// Chamber VI: a dawn beach on Icaria. Local -Z faces the sea and the rising sun; the player spawns at z=+17.
// ponytail: step -> animated values via one damped object; no per-step components.
const SEA_Y = 0.1, SAND_Y = 0.15;
const FEATHERS = Array.from({ length: 14 }, (_, i) => [-6 + i * 0.9 + (i % 3) * 0.3, -1.5 - ((i * 7) % 6) * 1.2, i * 1.7] as const);
const GRASS = Array.from({ length: 14 }, (_, i) => [5 + (i % 7) * 0.45 - 1.4, ((i * 5) % 4) * 0.2 - 1.2 + (i > 6 ? 1.5 : 0)] as const);
const STONES = Array.from({ length: 10 }, (_, i) => [(i - 4.5) * 0.19, ((i * 3) % 4) * 0.08 - 0.12, 0.05 + (i % 3) * 0.04] as const);
const use = () => useStore.getState().advance();

export default function PartridgeChamber({ step, state }: ChamberProps) {
  const cur = state === 'current';
  const feathers = useRef<THREE.Group>(null), mound = useRef<THREE.Group>(null), stones = useRef<THREE.Group>(null);
  const man = useRef<THREE.Group>(null), pop = useRef<THREE.Group>(null), bow = useRef<THREE.Group>(null), bird = useRef<THREE.Group>(null);
  const sun = useRef<THREE.Mesh>(null), key = useRef<THREE.DirectionalLight>(null);
  const a = useRef({ bird: 0, walk: 0, mound: 0, stones: 0, bow: 0, dawn: 0 }).current;
  const glow = useMemo(() => new THREE.MeshBasicMaterial({ color: GLOW.clone(), toneMapped: false }), []);
  const dim = useMemo(() => new THREE.Color(COL.dim), []);

  useEffect(() => {
    if (!cur) return;
    if (step === 2) sfx.impact(); else if (step === 3) sfx.pluck(); else if (step === 4) sfx.swell(true);
  }, [cur, step]);
  useEffect(() => () => sfx.quiet(), []);

  useFrame(({ clock }, dt) => {
    const fast = useStore.getState().settings.reducedMotion, s = Math.max(step, 0), k = Math.min(dt, 0.1), T = clock.elapsedTime;
    const go = (key: keyof typeof a, to: number, rate: number) => { a[key] = fast ? to : THREE.MathUtils.damp(a[key], to, rate, k); };
    go('bird', s >= 3 ? 1 : 0, 1.5); go('walk', s >= 1 ? 1 : 0, 0.7); go('mound', s >= 1 ? 1 : 0, 0.8); go('stones', s >= 2 ? 1 : 0, 0.9);
    go('bow', s >= 2 ? 1 : s >= 1 ? 0.5 : 0, 1.2); go('dawn', s / 4, 0.5);
    feathers.current?.children.forEach((c, i) => { c.position.y = SEA_Y + 0.12 + Math.sin(T * 1.1 + i) * 0.04; c.rotation.y += 0.002; });
    if (mound.current) mound.current.scale.set(1, 0.05 + 0.95 * a.mound, 1);
    stones.current?.children.forEach((c, i) => {
      const t = THREE.MathUtils.clamp(a.stones * 1.6 - i * 0.06, 0, 1);
      c.visible = t > 0.01; c.position.y = STONES[i][1] + 0.3 + (1 - t * t) * 1.6;
    });
    if (man.current) man.current.position.z = THREE.MathUtils.lerp(0.6, 6.1, a.walk);
    if (man.current) man.current.rotation.y = Math.PI * a.walk;
    if (bow.current) bow.current.rotation.x = 0.1 + 0.55 * a.bow;
    pop.current?.scale.setScalar(0.001 + a.bird);
    if (bird.current) bird.current.userData.flap = s >= 3 ? 1 : 0; // beats its wings, never rises
    glow.color.copy(GLOW).lerp(dim, THREE.MathUtils.smoothstep(a.stones, 0.1, 0.9));
    if (sun.current) sun.current.position.y = 2 + a.dawn * 20;
    if (key.current) key.current.intensity = 1 + a.dawn * 2.2;
  });

  if (state === 'ahead') return <></>; // World mounts neighbours early; keep the dawn fog out of the wings tower
  return (
    <>
      <color attach="background" args={[LOOK.sky.dawn[1]]} />
      <fogExp2 attach="fog" args={[LOOK.sky.dawn[1], 0.012]} />
      <directionalLight ref={key} position={[0, 6, -40]} color={LOOK.fresco.plaster} intensity={0.6} />
      <hemisphereLight args={[LOOK.sky.dawn[2], LOOK.fresco.earth, 1.3]} />
      <mesh ref={sun} position={[0, 2, -150]} frustumCulled={false}>
        <sphereGeometry args={[5, 16, 12]} /><meshBasicMaterial color={new THREE.Color(LOOK.fresco.plaster).multiplyScalar(2)} toneMapped={false} fog={false} />
      </mesh>
      <Sea y={SEA_Y} amp={0.06} deep={LOOK.fresco.sea} mid={LOOK.fresco.blue} line={LOOK.fresco.plaster} fog={LOOK.sky.dawn[1]} dens={0.012} />
      {/* the shore */}
      <mesh rotation-x={-Math.PI / 2} position={[0, SAND_Y, 10]} scale={[1.15, 1, 1]}>
        <circleGeometry args={[10.5, 36]} /><meshToonMaterial color={LOOK.fresco.skinPale} gradientMap={GRAD} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, SAND_Y + 0.005, 10]} scale={[1.15, 1, 1]}>
        <ringGeometry args={[9, 10.5, 36]} /><meshToonMaterial color={LOOK.fresco.earth} gradientMap={GRAD} />
      </mesh>
      <group ref={feathers}>
        {FEATHERS.map(([x, z, r], i) => (
          <mesh key={i} position={[x, SEA_Y, z]} rotation={[0, r, 0]} scale={[1.1, 0.03, 0.28]}>
            <boxGeometry /><meshToonMaterial color={LOOK.fresco.plaster} gradientMap={GRAD} />
          </mesh>
        ))}
      </group>
      <group position-y={SAND_Y}>
        {/* the grave */}
        <group ref={mound} position={[0, 0, 5]}>
          <Prim shape="sphere" args={[1, 16, 8]} scale={[1.1, 0.3, 0.55]} color={LOOK.fresco.earth} />
          <group ref={stones}>
            {STONES.map(([x, , z], i) => <Prim key={i} shape="sphere" args={[1, 7, 5]} scale={[0.13, 0.07, 0.1]} pos={[x, 0, z - 0.05]} color={LOOK.fresco.plaster} />)}
          </group>
        </group>
        {/* Daedalus: at the water's edge, then bowed over the grave */}
        <group ref={man} position={[0, 0, 0.6]}>
          <group ref={bow}><Person h={1.7} tunic={COL.dim} band={COL.dim} /></group>
        </group>
        {/* his tools: ochre while they work, grey once the account is closed */}
        <group position={[-2.6, 0, 7.4]}>
          <Prim shape="box" args={[0.9, 0.02, 0.12]} pos={[0, 0.03, 0]} rot={[0, 0.3, 0]} color={COL.dim}>
            <mesh position={[0, 0.03, 0.07]} scale={[0.9, 0.025, 0.025]} material={glow}><boxGeometry /></mesh>
          </Prim>
          <group position={[0.2, 0.03, 0.55]} rotation={[0, -0.4, 0]}>
            <Prim shape="box" args={[0.04, 0.02, 0.6]} pos={[-0.1, 0, 0]} rot={[0, 0.17, 0]} color={COL.dim} />
            <Prim shape="box" args={[0.04, 0.02, 0.6]} pos={[0.1, 0, 0]} rot={[0, -0.17, 0]} color={COL.dim} />
            <mesh position={[0, 0.02, 0.3]} rotation-x={-Math.PI / 2} material={glow}><torusGeometry args={[0.07, 0.015, 6, 20]} /></mesh>
          </group>
        </group>
        {/* the ditch, and Perdix in it */}
        <mesh rotation-x={-Math.PI / 2} position={[6.5, 0.012, 3.8]} scale={[1.5, 0.8, 1]}>
          <circleGeometry args={[1, 24]} /><meshToonMaterial color={COL.ink} gradientMap={GRAD} />
        </mesh>
        {GRASS.map(([x, z], i) => <Prim key={i} shape="cone" args={[0.04, 0.5, 4]} pos={[x + 1.2, 0.25, z + 3.8]} rot={[0, 0, (i % 3 - 1) * 0.15]} color={LOOK.fresco.green} outline={false} />)}
        <group ref={pop} position={[6.5, -0.02, 3.8]}><Partridge ref={bird} rot={[0, -2.2, 0]} scale={2.2} /></group>
      </group>
      <Hotspot pos={[0, 0.5, -5]} radius={7} enabled={cur && step === 0} onUse={use} />
      <Hotspot pos={[0, 0.7, 5]} radius={4} enabled={cur && step === 1} onUse={use} />
      <Hotspot pos={[-2.4, 0.4, 7.6]} radius={4} enabled={cur && step === 2} onUse={use} />
      <Hotspot pos={[6.5, 0.7, 3.8]} radius={5} enabled={cur && step >= 3} onUse={use} />
    </>
  );
}
