import { Html, Sparkles } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { sfx } from '../../../audio/sounds';
import { GAME } from '../../../content/copy';
import { input } from '../../../input';
import { live, useStore } from '../../../store';
import { Person } from '../../shared/figures';
import { COL, GLOW, GRAD, LOOK, Prim, SkyDome } from '../../shared/look';
import { Sea } from '../../shared/sea';
import { smooth } from '../../shared/rig';
import { Flight as FlightState, FLIGHT_SECONDS, newFlight, step } from './physics';

const SPEED = 12, H = 40, FEATHERS = 8;
const [SKY_TOP, SKY_MID, SKY_BOT] = LOOK.sky.day;
const SUN = new THREE.Color(COL.limestone).multiplyScalar(2.2); // white daylight, not ochre: the sun is the danger
const mid = (a: number, b: number, t: number) => a + (b - a) * t;

interface Isl { id: keyof typeof GAME.islands; x: number; z: number; s: number; label: boolean }
const ISLANDS: Isl[] = [
  { id: 'delos', x: -44, z: -22, s: 0.8, label: true }, { id: 'paros', x: -78, z: -50, s: 1.1, label: true },
  { id: 'samos', x: -56, z: -190, s: 1.3, label: true },
  { id: 'lebinthos', x: 62, z: -300, s: 1, label: true }, { id: 'calymne', x: 88, z: -385, s: 1.2, label: true },
];
const SICILY_Z = -SPEED * FLIGHT_SECONDS - 110;

function Island({ x, z, s }: { x: number; z: number; s: number }) {
  return (
    <group position={[x, 0, z]} scale={s}>
      <Prim shape="sphere" args={[1, 12, 8]} scale={[16, 5, 11]} pos={[0, -0.5, 0]} color={COL.olive} />
      <Prim shape="cone" args={[5, 9, 8]} pos={[-2, 4.5, 0]} color="#7d8a58" />
      <Prim shape="sphere" args={[1, 10, 8]} scale={[6, 2.2, 5]} pos={[5, 2, 2]} color="#59633d" />
    </group>
  );
}

function Boat({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0.2, z]}>
      <Prim args={[6, 0.8, 2]} pos={[0, 0.3, 0]} color="#8a5a34" />
      <Prim shape="cone" args={[1.3, 2, 4]} pos={[3.5, 0.5, 0]} rot={[0, 0, -Math.PI / 2]} color="#8a5a34" />
      <Person pos={[0, 0.6, 0]} h={5.5} tunic={COL.limestone} lookUp={0.9} />
    </group>
  );
}

export default function Flight() {
  const { camera, scene } = useThree();
  const f = useRef<FlightState>(newFlight());
  const ic = useRef<THREE.Group>(null), dae = useRef<THREE.Group>(null), sun = useRef<THREE.Group>(null), sicily = useRef<THREE.Group>(null);
  const wing = useRef<THREE.InstancedMesh>(null), loose = useRef<THREE.InstancedMesh>(null), drips = useRef<THREE.InstancedMesh>(null);
  const [zone, setZone] = useState<'sea' | 'mid' | 'sun'>('mid');
  const [near, setNear] = useState(false);
  const s = useRef({
    ended: false, endAt: 0, camY: 20, camFrozen: false, peeled: 0, peelAt: 0, skipped: false, hudAt: 0, fov: 60, zone: 'mid', swell: false, msgUntil: 0,
    seen: { fish: false, plough: false, shep: false }, near: false, msgSubAt: 0, started: false,
    loose: Array.from({ length: FEATHERS * 2 }, () => ({ on: false, p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), w: new THREE.Vector3() })),
    drip: Array.from({ length: 14 }, () => ({ life: 0, p: new THREE.Vector3(), v: 0 })), dripAt: 0,
  });
  const tmp = useMemo(() => ({ root: new THREE.Object3D(), fe: new THREE.Object3D(), m: new THREE.Matrix4(), w: new THREE.Matrix4(), o: new THREE.Object3D(), q: new THREE.Vector3() }), []);

  useEffect(() => {
    const sk = () => { s.current.skipped = true; const x = f.current; x.alt = 0.82; x.wax = Math.min(x.wax, 0.25); };
    window.addEventListener('game-skip', sk);
    camera.rotation.order = 'YXZ';
    (scene.fog as THREE.FogExp2).density = 0.004;
    return () => { window.removeEventListener('game-skip', sk); sfx.swell(false); sfx.quiet(); (camera as THREE.PerspectiveCamera).fov = 60; (camera as THREE.PerspectiveCamera).updateProjectionMatrix(); };
  }, [camera, scene]);

  useFrame(({ clock }, rawDt) => {
    const S = s.current, F = f.current, dt = Math.min(rawDt, 0.05), time = clock.elapsedTime;
    const playing = live.get().gameState === 'playing' || S.skipped;
    const flap = S.skipped ? true : input.keys.has('Space') || input.keys.has('ArrowUp') || input.pointer;
    if (playing && !S.ended) {
      step(F, flap, dt, S.skipped ? 0 : 2.5);
      if (F.melted && S.peelAt === 0) { S.peelAt = time; sfx.fall(); S.camFrozen = true; }
    }
    const z = -SPEED * Math.min(F.time, FLIGHT_SECONDS + 4), y = F.alt * H;
    const winSink = F.outcome === 'win' ? smooth(0, 3, time - S.endAt) : 0;
    const yy = F.outcome === 'win' ? mid(y, 5, winSink) : y;

    // end of flight
    if (F.outcome && !S.ended) {
      S.ended = true; S.endAt = time;
      useStore.setState({ flight: { outcome: S.skipped ? 'skipped' : F.outcome, maxAltitude: F.maxAlt, glory: F.glory } });
      const key = F.outcome === 'win' ? 'win' : F.outcome === 'sea' ? 'sea' : 'melt';
      live.set({ msg: GAME.outcome[key], msgSub: '', done: key !== 'win', hot: false });
      if (key === 'win') S.msgSubAt = time + 3.2; else sfx.splash();
      sfx.swell(false);
    }
    if (S.msgSubAt && time > S.msgSubAt) { S.msgSubAt = 0; live.set({ msgSub: GAME.outcome.winAfter, done: true }); }
    if (S.msgUntil && time > S.msgUntil && !S.ended) { S.msgUntil = 0; live.set({ msg: '' }); }

    // figures look up as we pass them
    const say = (k: keyof typeof S.seen, text: string, zz: number) => { if (!S.seen[k] && z < zz && !S.ended) { S.seen[k] = true; live.set({ msg: text }); S.msgUntil = time + 4.5; } };
    say('plough', GAME.ploughman, -150); say('fish', GAME.fisherman, -250); say('shep', GAME.shepherd, -350);

    // Icarus, Daedalus, sun, Sicily
    const g = ic.current!;
    const bob = F.outcome ? 0 : Math.sin(time * 2) * 0.25;
    g.position.set(0, yy + bob, z); g.rotation.z = F.vy * -0.25; g.rotation.x = -F.vy * 0.25;
    dae.current!.position.set(-6, H * 0.5 + Math.sin(time * 1.4) * 0.5, z - 9);
    sun.current!.position.set(0, 66, z - 330); sun.current!.scale.setScalar(1 + F.alt * 0.5); // the sun swells as you climb
    if (sicily.current) sicily.current.position.set(0, -42 * (1 - smooth(37, 44, F.time)), SICILY_Z);

    // wings: instanced feathers, with a flap; on wax failure they peel off one by one
    const wm = wing.current!, lm = loose.current!;
    const th = flap && !F.melted ? Math.sin(time * 15) * 0.7 : F.melted ? 0.9 : Math.sin(time * 2) * 0.1;
    for (let side = 0; side < 2; side++) {
      const sg = side ? 1 : -1;
      tmp.root.position.set(sg * 0.3, 1.35, 0); tmp.root.rotation.set(0, 0, sg * (0.15 - th * 0.8)); tmp.root.updateMatrix();
      for (let k = 0; k < FEATHERS; k++) {
        const i = side * FEATHERS + k, len = 1.0 + k * 0.28, L = S.loose[i];
        tmp.fe.position.set(sg * len / 2, 0, -k * 0.05); tmp.fe.rotation.set(0, sg * -(k * 0.07 - 0.1), 0); tmp.fe.scale.set(len, 0.02, 0.14);
        tmp.fe.updateMatrix(); tmp.m.multiplyMatrices(tmp.root.matrix, tmp.fe.matrix);
        const peeled = F.melted && (FEATHERS * 2 - 1 - i) < S.peeled;
        if (peeled && !L.on) { // hand over to the loose pool in world space
          L.on = true; L.p.setFromMatrixPosition(tmp.m).applyMatrix4(g.matrixWorld); L.v.set((Math.random() - 0.5) * 5, 2 + Math.random() * 3, (Math.random() - 0.5) * 3); L.w.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
        }
        wm.setMatrixAt(i, peeled ? tmp.o.matrix.identity().scale(tmp.q.set(0, 0, 0)) : tmp.m);
      }
    }
    wm.instanceMatrix.needsUpdate = true;
    if (F.melted && time - S.peelAt > S.peeled * 0.16 && S.peeled < FEATHERS * 2) S.peeled++;
    S.loose.forEach((L, i) => {
      if (L.on) { L.v.y -= 9 * dt; L.p.addScaledVector(L.v, dt); L.v.multiplyScalar(1 - 0.5 * dt); L.r.x += L.w.x * dt; L.r.y += L.w.y * dt; L.r.z += L.w.z * dt; L.p.y = Math.max(L.p.y, 0.1); }
      tmp.o.position.copy(L.p); tmp.o.rotation.copy(L.r); tmp.o.scale.set(L.on ? 1.4 : 0, 0.03, 0.18); tmp.o.updateMatrix(); lm.setMatrixAt(i, tmp.o.matrix);
    });
    lm.instanceMatrix.needsUpdate = true;

    // wax drips from the wings in the heat
    if (F.alt > 0.75 && !F.melted && time > S.dripAt) {
      S.dripAt = time + 0.12; const d = S.drip.find((q) => q.life <= 0);
      if (d) { d.life = 1.2; d.v = 0; d.p.set((Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 1.8), yy + 1.2, z); }
    }
    S.drip.forEach((d, i) => {
      d.life -= dt; d.v += 9 * dt; d.p.y -= d.v * dt;
      tmp.o.position.copy(d.p); tmp.o.scale.setScalar(d.life > 0 ? 0.16 : 0); tmp.o.rotation.set(0, 0, 0); tmp.o.updateMatrix(); drips.current!.setMatrixAt(i, tmp.o.matrix);
    });
    drips.current!.instanceMatrix.needsUpdate = true;

    // temptation: above the middle course everything swells and widens
    const hot = F.alt > 0.65 && !F.melted;
    if (hot !== S.swell) { S.swell = hot; sfx.swell(hot); }
    if ((F.time > 33) !== S.near) { S.near = F.time > 33; setNear(S.near); }
    const zn = F.alt < 0.25 ? 'sea' : F.alt > 0.65 ? 'sun' : 'mid';
    if (zn !== S.zone) { S.zone = zn; setZone(zn); }
    const cam = camera as THREE.PerspectiveCamera;
    S.fov = THREE.MathUtils.damp(S.fov, hot ? 76 : 60, 2.5, dt); cam.fov = S.fov; cam.updateProjectionMatrix();
    if (!S.camFrozen) S.camY = THREE.MathUtils.damp(S.camY, yy * 0.6 + 5, 4, dt);
    cam.position.set(0, S.camY, z + 15); cam.lookAt(0, (S.camFrozen ? S.camY - 6 : yy * 0.75 + 2), z - 12);

    if (time > S.hudAt && !S.ended) {
      S.hudAt = time + 0.1;
      live.set({ wax: F.wax, spray: F.spray, progress: Math.min(1, F.time / FLIGHT_SECONDS), glory: F.glory, hot });
    }
  });

  return (
    <>
      <color attach="background" args={[SKY_MID]} />
      <fogExp2 attach="fog" args={[SKY_MID, 0.004]} />
      <ambientLight intensity={0.8} color={SKY_MID} />
      <directionalLight position={[10, 40, -40]} intensity={1.4} color={SKY_BOT} />
      <SkyDome top={SKY_TOP} mid={SKY_MID} bottom={SKY_BOT} stars={0} />
      <Sea amp={0.6} dens={0.004} fog={SKY_MID} deep={COL.lapis} mid="#3a72b8" line={SKY_MID} />
      <group ref={sun}>
        <mesh><sphereGeometry args={[46, 32, 20]} /><meshBasicMaterial color={SUN} toneMapped={false} fog={false} /></mesh>
        <mesh><sphereGeometry args={[74, 24, 16]} /><meshBasicMaterial color={SKY_BOT} transparent opacity={0.16} toneMapped={false} fog={false} depthWrite={false} /></mesh>
      </group>
      {/* the middle course: a faint dotted band in the sky */}
      <MiddleBand />
      {ISLANDS.map((i) => (
        <group key={i.id}><Island x={i.x} z={i.z} s={i.s} />
          {i.label && <Html position={[i.x, 14, i.z]} center><span className="mono" style={{ color: COL.limestone, textShadow: '0 1px 8px #000', whiteSpace: 'nowrap' }}>{GAME.islands[i.id]}</span></Html>}
        </group>
      ))}
      <group position={[-56, 4.5, -190]}><Person pos={[4, 0, 2]} h={7} tunic={COL.limestone} lookUp={0.9} /></group>
      <Boat x={34} z={-250} />
      <group position={[88, 4, -385]}><Person pos={[3, 0, 2]} h={7} tunic={COL.dim} lookUp={0.9} /></group>
      <group ref={sicily} position={[0, -42, SICILY_Z]}>
        <Prim shape="sphere" args={[1, 14, 10]} scale={[70, 15, 28]} pos={[0, 0, 0]} color={COL.olive} />
        <Prim shape="cone" args={[22, 30, 8]} pos={[20, 18, -4]} color="#7d8a58" />
        {near && <Html position={[0, 36, 0]} center><span className="mono" style={{ color: COL.limestone, textShadow: '0 1px 8px #000' }}>{GAME.islands.sicily}</span></Html>}
      </group>

      <group ref={dae}><Flier tunic={COL.dim} /></group>
      <group ref={ic}>
        <Flier tunic={COL.limestone} noWings />
        <instancedMesh ref={wing} args={[undefined, undefined, FEATHERS * 2]} frustumCulled={false}>
          <boxGeometry /><meshToonMaterial color={COL.limestone} gradientMap={GRAD} emissive={zone === 'sun' ? COL.ochre : '#000'} emissiveIntensity={0.25} />
        </instancedMesh>
        {zone === 'sea' && <Sparkles count={40} scale={[5, 1.5, 3]} position={[0, -0.3, 0]} size={5} speed={1.4} color="#cfe0ff" />}
        {zone === 'sun' && <Sparkles count={50} scale={[5, 3, 3]} position={[0, 1.2, 0]} size={6} speed={0.8} color={SKY_BOT} />}
      </group>
      <instancedMesh ref={loose} args={[undefined, undefined, FEATHERS * 2]} frustumCulled={false}><boxGeometry /><meshToonMaterial color={COL.limestone} gradientMap={GRAD} /></instancedMesh>
      <instancedMesh ref={drips} args={[undefined, undefined, 14]} frustumCulled={false}><sphereGeometry args={[1, 6, 4]} /><meshBasicMaterial color={GLOW} toneMapped={false} /></instancedMesh>
    </>
  );
}

function Flier({ tunic, noWings }: { tunic: string; noWings?: boolean }) {
  return (
    <group>
      <group rotation={[-0.3, 0, 0]}><Person tunic={tunic} h={1.75} /></group>
      {!noWings && (
        <>
          <Prim args={[2.6, 0.04, 0.9]} pos={[-1.6, 1.4, 0]} rot={[0, 0, 0.15]} color={COL.limestone} />
          <Prim args={[2.6, 0.04, 0.9]} pos={[1.6, 1.4, 0]} rot={[0, 0, -0.15]} color={COL.limestone} />
        </>
      )}
    </group>
  );
}

function MiddleBand() {
  const ref = useRef<THREE.Group>(null);
  const { camera } = useThree();
  useFrame(() => ref.current?.position.set(0, 0, camera.position.z - 40));
  return (
    <group ref={ref}>
      {[0.35, 0.65].map((a) => (
        <points key={a} position={[0, a * H, 0]}>
          <bufferGeometry><bufferAttribute attach="attributes-position" args={[new Float32Array(Array.from({ length: 60 }, (_, i) => [(i - 30) * 3.2, 0, -(i % 7) * 12]).flat()), 3]} /></bufferGeometry>
          <pointsMaterial color={COL.limestone} size={0.7} transparent opacity={0.35} fog={false} />
        </points>
      ))}
    </group>
  );
}
