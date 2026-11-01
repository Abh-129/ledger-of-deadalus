import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import * as fx from '../../fx';
import { sfx } from '../../audio/sounds';
import { GAME } from '../../content/copy';
import { input } from '../../input';
import { live, useStore } from '../../store';
import { Minotaur } from '../shared/figures';
import { COL, RED_GLOW, SkyDome } from '../shared/look';
import { Polyline, PolyHandle } from '../shared/lines';
import { smooth, useRig, useStepT, Wp } from '../shared/rig';
import { MazeMesh } from '../games/labyrinth/MazeMesh';
import { buildMaze, C, CENTRE, cellCentre, ENTRANCE, idx, inChamber, Maze, N } from '../games/labyrinth/mazeGen';

const OVERHEAD: Wp[] = [
  { p: [30, 100, 78], l: [30, 0, 30] },
  { p: [62, 62, 74], l: [30, 0, 30] },
  { p: [0, 48, 62], l: [30, 0, 26] },
  { p: [30, 1.9, 67], l: [30, 1.7, 40] },
];
const DOOR: [number, number] = [30, 60];
const R = 0.4, SPEED = 4, SPRINT = 6, AUTO = 20; // skip walks faster than the spec's 3x: the shortest route is ~550 m
type Phase = 'explore' | 'encounter' | 'return' | 'done';

export default function LabyrinthScene() {
  const beat = useStore((s) => s.beat);
  const seed = useStore((s) => s.mazeSeed);
  const maze = useMemo(() => buildMaze(seed), [seed]);
  return beat === 'commission' ? <Overhead maze={maze} /> : <Game maze={maze} />;
}

function Overhead({ maze }: { maze: Maze }) {
  const t = useStepT(); useRig(OVERHEAD, t);
  const scene = useThree((s) => s.scene);
  useFrame(() => { (scene.fog as THREE.FogExp2).density = 0.006 + 0.04 * smooth(2.4, 3, t.current); });
  return (
    <>
      <color attach="background" args={[COL.night]} />
      <fogExp2 attach="fog" args={[COL.deepSea, 0.006]} />
      <ambientLight intensity={0.9} color="#8fa8d6" />
      <directionalLight position={[-30, 60, 40]} intensity={1.6} color="#9db8ea" />
      <SkyDome />
      <MazeMesh maze={maze} />
    </>
  );
}

function Game({ maze }: { maze: Maze }) {
  const { camera, scene } = useThree();
  const thread = useRef<PolyHandle>(null), torch = useRef<THREE.PointLight>(null), amb = useRef<THREE.AmbientLight>(null), moon = useRef<THREE.DirectionalLight>(null);
  const mino = useRef<THREE.Group>(null), redLight = useRef<THREE.PointLight>(null), stain = useRef<THREE.Mesh>(null), shimmer = useRef<THREE.Mesh>(null);
  const g = useRef({
    x: 30, z: 66, yaw: 0, pitch: 0, phase: 'explore' as Phase, cell: -2, path: [idx(...ENTRANCE)], visited: [] as [number, number][],
    maxThread: 0, elapsed: 0, auto: false, skipped: false, enc: 0, fired: 0, day: 0, msgUntil: 0, breathAt: 0, doneAt: 0, stored: false,
  });
  const dayCol = useMemo(() => ({ bg: new THREE.Color(COL.night), fog: new THREE.Color(COL.deepSea), day: new THREE.Color('#d9c9a0') }), []);

  useEffect(() => {
    const mm = (e: MouseEvent) => { if (document.pointerLockElement) { input.lookX += e.movementX; input.lookY += e.movementY; } };
    const sk = () => { g.current.auto = true; g.current.skipped = true; };
    document.addEventListener('mousemove', mm); window.addEventListener('game-skip', sk);
    (scene.fog as THREE.FogExp2).density = 0.14;
    return () => { document.removeEventListener('mousemove', mm); window.removeEventListener('game-skip', sk); sfx.quiet(); fx.black(0); document.exitPointerLock?.(); };
  }, [scene]);

  const hits = (px: number, pz: number) => {
    for (const w of maze.walls) if (px > w.x - w.sx / 2 - R && px < w.x + w.sx / 2 + R && pz > w.z - w.sz / 2 - R && pz < w.z + w.sz / 2 + R) return true;
    return false;
  };

  useFrame(({ clock }, rawDt) => {
    const s = g.current, dt = Math.min(rawDt, 0.05), time = clock.elapsedTime;
    const playing = live.get().gameState === 'playing';
    const settings = useStore.getState().settings;

    if (playing && s.phase !== 'done') {
      s.elapsed += dt;
      const moving = s.phase === 'explore' || s.phase === 'return';
      if (moving && !s.auto) {
        const k = input.keys;
        s.yaw -= input.lookX * 0.0022; s.pitch = Math.max(-1.2, Math.min(1.2, s.pitch - input.lookY * 0.0022)); input.lookX = input.lookY = 0;
        if (k.has('ArrowLeft')) s.yaw += 1.9 * dt; if (k.has('ArrowRight')) s.yaw -= 1.9 * dt;
        const fwd = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0) + input.moveY;
        const str = (k.has('KeyD') ? 1 : 0) - (k.has('KeyA') ? 1 : 0) + input.moveX;
        let vx = -Math.sin(s.yaw) * fwd + Math.cos(s.yaw) * str, vz = -Math.cos(s.yaw) * fwd - Math.sin(s.yaw) * str;
        const m = Math.hypot(vx, vz);
        if (m > 0.001) {
          const sp = (k.has('ShiftLeft') || k.has('ShiftRight') ? SPRINT : SPEED) * Math.min(1, m) * dt;
          vx = (vx / m) * sp; vz = (vz / m) * sp;
          if (!hits(s.x + vx, s.z)) s.x += vx;
          if (!hits(s.x, s.z + vz)) s.z += vz;
        }
        s.x = Math.min(63, Math.max(-3, s.x)); s.z = Math.min(72, Math.max(-3, s.z));
      } else if (moving && s.auto) {
        // skip: auto-walk the solution at 3x speed
        const c = s.cell;
        let tx = 30, tz = 58;
        if (s.phase === 'explore') {
          if (c >= 0) { const n = maze.next[c]; if (n >= 0) [tx, tz] = cellCentre(n % N, (n / N) | 0); }
        } else if (s.path.length >= 2) {
          const prev = s.path[s.path.length - 2];
          [tx, tz] = cellCentre(prev % N, (prev / N) | 0);
          if (inChamber(s.cell % N, (s.cell / N) | 0)) { // leave the chamber through the cell that has the real opening onto `prev`
            const px = prev % N, py = (prev / N) | 0;
            for (let y = 6; y <= 8; y++) for (let x = 6; x <= 8; x++) {
              const i = idx(x, y);
              const toPrev = (x === px && y - 1 === py && maze.open[i] & 1) || (x + 1 === px && y === py && maze.open[i] & 2) || (x === px && y + 1 === py && maze.open[i] & 4) || (x - 1 === px && y === py && maze.open[i] & 8);
              if (toPrev && s.cell !== i) [tx, tz] = cellCentre(x, y);
            }
          }
        } else [tx, tz] = [30, 62];
        const dx = tx - s.x, dz = tz - s.z, d = Math.hypot(dx, dz);
        if (d > 0.05) { const sp = Math.min(d, AUTO * dt); s.x += (dx / d) * sp; s.z += (dz / d) * sp; }
        const want = Math.atan2(-dx, -dz); let dy = want - s.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
        if (d > 0.3) s.yaw += dy * Math.min(1, 6 * dt);
        s.pitch *= 0.9;
      }

      // cell tracking drives the thread: stepping back into the previous cell winds it up, otherwise it lets out
      const cx = Math.floor(s.x / C), cy = Math.floor(s.z / C);
      const cell = cy >= N || cy < 0 || cx < 0 || cx >= N ? -1 : idx(cx, cy);
      if (cell !== s.cell) {
        s.cell = cell;
        if (cell >= 0) {
          s.visited.push([cx, cy]);
          const key = inChamber(cx, cy) ? idx(...CENTRE) : cell, p = s.path;
          if (key !== p[p.length - 1]) { if (p.length >= 2 && key === p[p.length - 2]) p.pop(); else p.push(key); }
          const m = (p.length - 1) * C;
          if (m !== live.get().thread) live.set({ thread: m });
          s.maxThread = Math.max(s.maxThread, m);
          if (s.phase === 'explore' && inChamber(cx, cy)) { s.phase = 'encounter'; s.enc = 0; s.fired = 0; }
        }
      }
      if (s.phase === 'return' && s.z > 60.8) {
        s.phase = 'done'; s.doneAt = time; document.exitPointerLock?.();
        fx.flash('#fff3d0', 2200, 1); sfx.swell(true);
        live.set({ msg: '' });
      }
    }

    // the Minotaur encounter: silhouette against red light, flash to black, impact, silence. Never any gore.
    if (s.phase === 'encounter' && playing) {
      s.enc += dt;
      const e = s.enc, M = mino.current!;
      const fwdx = -Math.sin(s.yaw), fwdz = -Math.cos(s.yaw);
      if (e < 2.3) {
        if (s.fired < 1) { s.fired = 1; M.position.set(s.x + fwdx * 7, 0, s.z + fwdz * 7); M.rotation.y = s.yaw; sfx.breath(1); }
        M.visible = true; M.scale.set(1.4, 1.4 * smooth(0, 1.6, e), 1.4);
        if (torch.current) torch.current.intensity = 14 * (1 + 3 * smooth(0, 0.6, e));
        if (redLight.current) { redLight.current.position.set(s.x + fwdx * 10, 4, s.z + fwdz * 10); redLight.current.intensity = 900 * smooth(0, 1.2, e); }
      } else if (e < 3.7) {
        if (s.fired < 2) { s.fired = 2; sfx.impact(); sfx.breath(0); M.visible = false; if (redLight.current) redLight.current.intensity = 0; stain.current!.visible = true; }
        fx.black(1);
      } else {
        if (s.fired < 3) { s.fired = 3; live.set({ msg: GAME.minotaurDead }); s.msgUntil = time + 6; }
        fx.black(1 - smooth(3.7, 4.7, e));
        if (e > 4.7) { s.phase = 'return'; fx.black(0); }
      }
    }
    if (s.msgUntil && time > s.msgUntil) { s.msgUntil = 0; live.set({ msg: '' }); }

    // breathing grows louder near the centre, from halfway in
    if (playing && s.phase === 'explore' && time > s.breathAt) {
      s.breathAt = time + 0.3;
      const d = Math.hypot(s.x - 30, s.z - 30);
      sfx.breath(Math.max(0, Math.min(1, 1 - (d - 5) / 22)) * (d < 28 ? 1 : 0.15));
    }

    // camera, torch, daylight
    const bob = playing && !s.auto && (input.keys.size || input.moveY) && s.phase !== 'encounter' ? Math.sin(time * 9) * 0.035 : 0;
    camera.position.set(s.x, 1.7 + bob, s.z); camera.rotation.set(s.pitch, s.yaw, 0, 'YXZ');
    if (torch.current) {
      torch.current.position.set(s.x, 2.1, s.z);
      if (s.phase !== 'encounter') torch.current.intensity = 18 * (1 + 0.1 * Math.sin(time * 13) + 0.06 * Math.sin(time * 31));
    }
    if (s.phase === 'done') s.day = Math.min(1, s.day + dt * 0.6);
    const fog = scene.fog as THREE.FogExp2;
    fog.color.copy(dayCol.fog).lerp(dayCol.day, s.day); (scene.background as THREE.Color).copy(dayCol.bg).lerp(dayCol.day, s.day);
    fog.density = 0.14 - 0.11 * s.day;
    if (amb.current) amb.current.intensity = 0.22 + 1.4 * s.day;
    if (moon.current) moon.current.intensity = 0.35 + 1.6 * s.day;
    if (s.phase === 'done' && !s.stored && time - s.doneAt > 2.4) {
      s.stored = true;
      useStore.setState({ maze: { seed: maze.seed, playerPath: s.visited.length ? s.visited : maze.solution, threadLengthMeters: s.maxThread, skipped: s.skipped } });
      useStore.getState().toEntry();
    }

    // the thread: never fogged, always visible
    const pts: number[][] = [[DOOR[0], 0.4, DOOR[1]]];
    for (const c of s.path) { const [px, pz] = cellCentre(c % N, (c / N) | 0); pts.push([px, 0.4, pz]); }
    pts.push([s.x, 0.4, s.z]);
    thread.current?.set(pts);

    // assistance after 90 s: shimmer on the right way at junctions
    const sh = shimmer.current;
    if (sh) {
      const help = settings.assist && s.elapsed > 90 && s.phase === 'explore' && s.cell >= 0;
      const o = s.cell >= 0 ? maze.open[s.cell] : 0, n = s.cell >= 0 ? maze.next[s.cell] : -1;
      sh.visible = !!help && n >= 0 && ((o & 1) + ((o >> 1) & 1) + ((o >> 2) & 1) + ((o >> 3) & 1)) >= 3;
      if (sh.visible) { const [px, pz] = cellCentre(n % N, (n / N) | 0); sh.position.set(px, 0.03, pz); (sh.material as THREE.MeshBasicMaterial).opacity = 0.18 + 0.12 * Math.sin(time * 4); }
    }
  });

  return (
    <>
      <color attach="background" args={[COL.night]} />
      <fogExp2 attach="fog" args={[COL.deepSea, 0.14]} />
      <ambientLight ref={amb} intensity={0.22} color="#6f8fc4" />
      <directionalLight ref={moon} position={[-20, 50, 30]} intensity={0.35} color="#8fb0e8" />
      <pointLight ref={torch} color={COL.ochre} intensity={18} distance={13} decay={2} />
      <pointLight ref={redLight} color={COL.red} intensity={0} distance={30} decay={2} />
      <SkyDome />
      <MazeMesh maze={maze} />
      <Polyline ref={thread} max={400} thick={0.07} />
      <mesh ref={shimmer} rotation-x={-Math.PI / 2} visible={false}><planeGeometry args={[C - 0.6, C - 0.6]} /><meshBasicMaterial color={COL.ochre} transparent opacity={0.2} fog={false} depthWrite={false} /></mesh>
      <mesh ref={stain} rotation-x={-Math.PI / 2} position={[30, 0.04, 30]} visible={false}><circleGeometry args={[3.2, 24]} /><meshBasicMaterial color={RED_GLOW} transparent opacity={0.5} toneMapped={false} /></mesh>
      <group ref={mino} visible={false}>
        <Minotaur scale={1} />
        <mesh position={[0, 4, -2.5]}><planeGeometry args={[16, 12]} /><meshBasicMaterial color={RED_GLOW} toneMapped={false} fog={false} side={THREE.DoubleSide} /></mesh>
      </group>
    </>
  );
}
