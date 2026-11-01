import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import * as fx from '../../fx';
import { sfx } from '../../audio/sounds';
import { GAME } from '../../content/copy';
import { useStore } from '../../store';
import { MazeMesh } from '../games/labyrinth/MazeMesh';
import { buildMaze, C, cellCentre } from '../games/labyrinth/mazeGen';
import { Person } from '../shared/figures';
import { COL, SkyDome } from '../shared/look';
import { Polyline, PolyHandle } from '../shared/lines';
import { smooth, useRig, useStepT, Wp } from '../shared/rig';

const WPS: Wp[] = [
  { p: [30, 96, 58], l: [30, 0, 30] },
  { p: [30, 90, 52], l: [30, 0, 30] },
  { p: [30, 90, 52], l: [30, 0, 30] },
  { p: [30, 34, 44], l: [30, 0, 30] },
  { p: [30, 2.3, 34.5], l: [30, 1.3, 27] },
];

export default function ThreadScene() {
  const t = useStepT(); useRig(WPS, t);
  const seed = useStore((s) => s.mazeSeed), played = useStore((s) => s.maze), step = useStore((s) => s.step);
  const maze = useMemo(() => buildMaze(seed), [seed]);
  // the visitor's own path from Chapter III; if they skipped, the shortest way there and back
  const { pts, meters } = useMemo(() => {
    const cells = played && !played.skipped && played.playerPath.length ? played.playerPath : [...maze.solution, ...[...maze.solution].reverse()];
    const p = [[30, 0.6, 60], ...cells.map(([x, y]) => { const [cx, cz] = cellCentre(x, y); return [cx, 0.6, cz]; }), [30, 0.6, 60]];
    const m = played?.threadLengthMeters || (maze.solution.length - 1) * C;
    return { pts: p, meters: m };
  }, [maze, played]);

  const poly = useRef<PolyHandle>(null), grp = useRef<THREE.Group>(null), amb = useRef<THREE.AmbientLight>(null), sun = useRef<THREE.DirectionalLight>(null);
  const lamp = useRef<THREE.PointLight>(null), redL = useRef<THREE.PointLight>(null), prog = useRef(0), gate = useRef(false);
  const dur = Math.min(14, Math.max(6, pts.length * 0.06));

  useEffect(() => () => fx.black(0), []);
  useFrame((_, dt) => {
    const T = t.current;
    if (T > 0.6) prog.current = Math.min(1, prog.current + dt / dur);
    poly.current?.set(pts, prog.current);
    if (grp.current) grp.current.scale.y = Math.max(0.001, 1 - smooth(2.7, 3.2, T));
    const dark = smooth(2.8, 3.4, T);
    if (amb.current) amb.current.intensity = 1.25 - 1.07 * dark;
    if (sun.current) sun.current.intensity = 1.8 - 1.55 * dark;
    if (lamp.current) lamp.current.intensity = 30 * smooth(3.4, 4, T);
    const pulse = smooth(3.55, 3.7, T) * (1 - smooth(3.75, 3.98, T));
    if (redL.current) redL.current.intensity = 1200 * pulse;
    if (T > 3.55 && !gate.current) { gate.current = true; sfx.gate(); fx.flash(COL.red, 1400, 0.45); } else if (T < 3.2) gate.current = false;
  });

  return (
    <>
      <color attach="background" args={[COL.night]} />
      <fogExp2 attach="fog" args={[COL.deepSea, 0.004]} />
      <ambientLight ref={amb} intensity={1.25} color="#a6b8dc" />
      <directionalLight ref={sun} position={[20, 80, 30]} intensity={1.8} color="#e6ecff" />
      <pointLight ref={lamp} position={[30, 2.2, 28.5]} color={COL.ochre} intensity={0} distance={14} decay={2} />
      <pointLight ref={redL} position={[30, 3, 26]} color={COL.red} intensity={0} distance={30} decay={2} />
      <SkyDome />
      <MazeMesh maze={maze} floor="#b9ad8e" />
      <group ref={grp}><Polyline ref={poly} max={1400} thick={0.32} /></group>
      <Person pos={[29.3, 0, 27]} h={1.8} tunic={COL.limestone} band={COL.ochre} />
      <Person pos={[30.6, 0, 27.2]} h={1.35} tunic={COL.dim} band={COL.ochre} />
      {step >= 2 && step <= 3 && (
        <Html position={[30, 8, 8]} center>
          <div className="mono" style={{ color: COL.ochre, background: 'rgba(10,18,28,.8)', padding: '6px 12px', whiteSpace: 'nowrap' }}>{GAME.threadUsed}{' · '}{meters} M</div>
        </Html>
      )}
    </>
  );
}
