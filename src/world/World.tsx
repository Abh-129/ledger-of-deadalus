import { memo, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { sfx } from '../audio/sounds';
import { LOOK, SkyDome } from '../experience/shared/look';
import { AT, chapterCopy, ORDER, useStore } from '../store';
import Thread from './Thread';
import { CHAMBERS } from './chambers';
import { Box, BOXES, COLUMNS, CORR_H, DOOR_H, DOOR_W, entryOf, FLOORS, GAPS, ROOMS, SPAWN, WALL_T } from './layout';

const SLAB = 2.4; // metres per floor texture tile (2 x 2 flagstones)
const LIFT = DOOR_H + 0.1;

// One stone material for every wall; the vertex colours below fake ambient occlusion at the floor and the ceiling.
const stone = new THREE.MeshStandardMaterial({ color: LOOK.stone.wall, roughness: 0.92, vertexColors: true });
const lintelMat = new THREE.MeshStandardMaterial({ color: LOOK.stone.wall, roughness: 0.92 });
const ceilMat = new THREE.MeshStandardMaterial({ color: LOOK.stone.ceiling, roughness: 0.95 });
const doorMat = new THREE.MeshStandardMaterial({ color: LOOK.fresco.blue, roughness: 0.8 });
const floorMat = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d')!;
  [[0, 0, 232], [128, 0, 246], [0, 128, 240], [128, 128, 224]].forEach(([x, y, v]) => { g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, y, 128, 128); });
  g.strokeStyle = 'rgb(120,120,120)'; g.lineWidth = 4; g.strokeRect(0, 0, 128, 128); g.strokeRect(128, 0, 128, 128); g.strokeRect(0, 128, 128, 128); g.strokeRect(128, 128, 128, 128);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return new THREE.MeshStandardMaterial({ color: LOOK.stone.floor, map: t, roughness: 0.9 });
})();

function wallGeo(b: Box) {
  const w = b.max[0] - b.min[0], d = b.max[1] - b.min[1], h = b.h ?? CORR_H;
  const g = new THREE.BoxGeometry(w, h, d, 1, 5, 1), pos = g.attributes.position;
  const rows = [0, 0.3, 1.1, h - 1.4, h - 0.4, h], shade = [0.4, 0.6, 0.95, 1, 0.95, 0.8], col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const k = Math.round((pos.getY(i) + h / 2) / (h / 5));
    pos.setY(i, rows[k] - h / 2); col.fill(shade[k], i * 3, i * 3 + 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

function slabGeo(f: (typeof FLOORS)[number], uv: boolean) {
  const g = new THREE.PlaneGeometry(f.max[0] - f.min[0], f.max[1] - f.min[1]).rotateX(uv ? -Math.PI / 2 : Math.PI / 2);
  g.translate((f.min[0] + f.max[0]) / 2, uv ? 0 : f.h, (f.min[1] + f.max[1]) / 2);
  if (uv) { const p = g.attributes.position, t = g.attributes.uv; for (let i = 0; i < p.count; i++) t.setXY(i, p.getX(i) / SLAB, p.getZ(i) / SLAB); }
  return g;
}

function Door({ box }: { box: Box }) {
  const key = box.door!;
  const open = useStore((s) => s.doors.includes(key));
  const body = useRef<THREE.Mesh>(null), seam = useRef<THREE.Mesh>(null);
  const lift = useRef(open ? LIFT : 0), was = useRef(open);
  const seamMat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(LOOK.cost.color).multiplyScalar(2), toneMapped: false, transparent: true, opacity: 0 }), []);
  const [w, d] = [box.max[0] - box.min[0], box.max[1] - box.min[1]];
  useEffect(() => { if (open && !was.current) sfx.gate(); was.current = open; }, [open]);
  useFrame((_, dt) => {
    const target = open ? LIFT : 0, fast = useStore.getState().settings.reducedMotion;
    lift.current = fast ? target : THREE.MathUtils.clamp(lift.current + Math.sign(target - lift.current) * dt * LIFT / 1.2, 0, LIFT);
    if (body.current) body.current.position.y = DOOR_H / 2 + lift.current;
    // red seam flash while the door travels: the cost of the chamber, paid
    if (seam.current) { const m = lift.current > 0 && lift.current < LIFT; seamMat.opacity = m ? 0.9 : 0; seam.current.position.y = lift.current; }
  });
  return (
    <group position={[(box.min[0] + box.max[0]) / 2, 0, (box.min[1] + box.max[1]) / 2]}>
      <mesh ref={body} material={doorMat}><boxGeometry args={[w, DOOR_H, d]} /></mesh>
      <mesh ref={seam} material={seamMat}><boxGeometry args={[w + 0.02, 0.05, d + 0.02]} /></mesh>
    </group>
  );
}

// Everything that never changes: walls, floors, ceilings, lintels, doors, hall columns, beach.
const Static = memo(function Static() {
  const walls = useMemo(() => BOXES.filter((b) => !b.door && !b.post).map((b) => ({ b, g: wallGeo(b) })), []);
  const slabs = useMemo(() => FLOORS.map((f) => ({ f, floor: slabGeo(f, true), ceil: f.roof ? slabGeo(f, false) : null })), []);
  const beach = ROOMS.partridge;
  return (
    <>
      {walls.map(({ b, g }, i) => (
        <mesh key={i} geometry={g} material={stone} position={[(b.min[0] + b.max[0]) / 2, (b.h ?? CORR_H) / 2, (b.min[1] + b.max[1]) / 2]} />
      ))}
      {slabs.map(({ f, floor, ceil }, i) => (
        <group key={i}>
          <mesh geometry={floor} material={floorMat} />
          {ceil && <mesh geometry={ceil} material={ceilMat} />}
        </group>
      ))}
      {GAPS.map((g, i) => (
        <mesh key={i} material={lintelMat} position={[g.pos[0], (DOOR_H + g.h) / 2, g.pos[1]]}>
          <boxGeometry args={g.axis === 'x' ? [DOOR_W, g.h - DOOR_H, WALL_T] : [WALL_T, g.h - DOOR_H, DOOR_W]} />
        </mesh>
      ))}
      {BOXES.filter((b) => b.door).map((b) => <Door key={b.door} box={b} />)}
      {COLUMNS.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 2.35, 0]}><cylinderGeometry args={[0.3, 0.2, 4.1, 14]} /><meshStandardMaterial color={LOOK.fresco.blue} roughness={0.8} /></mesh>
          <mesh position={[0, 4.5, 0]}><cylinderGeometry args={[0.4, 0.3, 0.2, 14]} /><meshStandardMaterial color={LOOK.fresco.plaster} roughness={0.9} /></mesh>
          <mesh position={[0, 0.15, 0]}><cylinderGeometry args={[0.3, 0.3, 0.3, 14]} /><meshStandardMaterial color={LOOK.fresco.plaster} roughness={0.9} /></mesh>
        </group>
      ))}
      <mesh rotation-x={-Math.PI / 2} position={[beach.center[0], -0.01, beach.center[1]]}>
        <circleGeometry args={[beach.size[0] / 2 + 6, 48]} /><meshStandardMaterial color={LOOK.fresco.earth} roughness={1} />
      </mesh>
    </>
  );
});

// Cool moonlight in the hall and corridors (chambers bring their own key light).
const LAMPS: [number, number, number][] = [[0, 3.8, 4.5], [4.5, 2.6, -17], [24.5, 2.6, -21], [30.5, 2.6, -22], [47, 2.6, -23]];

// ponytail: temporary until T3's Player.tsx owns the camera; it just stands at the spawn (or at ?at=).
function TempCamera() {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    const at = AT && AT !== 'flight' && AT !== 'balance' ? entryOf(AT) : SPAWN;
    camera.position.set(at.pos[0], 1.6, at.pos[1]); camera.rotation.set(0, at.yaw, 0);
  }, [camera]);
  return null;
}

export default function World() {
  const current = useStore((s) => s.current), step = useStore((s) => s.step);
  const written = useStore((s) => s.written), opened = useStore((s) => s.doors.length);
  // Mount the current chamber and its two neighbours. Between rooms, "current" is the next room to enter.
  const at = current ? ORDER.indexOf(current) : Math.min(opened, ORDER.length - 1);
  const mounted = ORDER.slice(Math.max(0, at - 1), at + 2);
  const sky = at === ORDER.length - 1 ? LOOK.sky.dawn : null;
  return (
    <>
      <color attach="background" args={[LOOK.stone.fog]} />
      <fogExp2 attach="fog" args={[LOOK.stone.fog, LOOK.stone.fogDensity]} />
      <SkyDome top={sky?.[0]} mid={sky?.[1]} bottom={sky?.[2]} stars={sky ? 0.2 : 1} />
      <hemisphereLight args={[LOOK.stone.hemiSky, LOOK.stone.hemiGround, LOOK.stone.ambient]} />
      <ambientLight intensity={LOOK.stone.minAmbient} color={LOOK.stone.hemiSky} />
      {LAMPS.map((p, i) => <pointLight key={i} position={p} color={LOOK.moon.color} intensity={LOOK.moon.intensity} distance={LOOK.moon.distance} />)}
      <Static />
      <Thread />
      {mounted.map((k) => {
        const r = ROOMS[k], C = CHAMBERS[k];
        const state = current === k ? 'current' : written.includes(chapterCopy(k).id) ? 'done' : 'ahead';
        return (
          <group key={k} position={[r.center[0], 0, r.center[1]]} rotation-y={r.yaw}>
            <C state={state} step={state === 'current' ? step : state === 'done' ? chapterCopy(k).captions.length - 1 : -1} />
          </group>
        );
      })}
      <TempCamera />
    </>
  );
}
