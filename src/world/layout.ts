// Hand-laid plan of the Labyrinth. Pure data and maths (no three import) so check.ts runs it in node.
// World: x east, z south (north is -z). A room's yaw turns its local -Z (entry to exit) into world (-sin yaw, -cos yaw).
//
//   hall -> I saw (north) -> turn east -> II cow (east) -> the Meander (E, N, E, S, E)
//        -> III labyrinth (east) -> turn north -> IV thread -> V wings tower (north)       VI partridge: a beach 200 m east
import type { ChapterKey } from '../content/copy';

export type V2 = [number, number];
export interface Box { min: V2; max: V2; door?: ChapterKey; seal?: true; h?: number; post?: true } // h: wall height, default CORR_H; post: a column (collision only, World draws it)
interface Room {
  key: ChapterKey;
  center: V2; size: V2;        // size in the room's local frame: [width x, depth z]
  height: number;
  yaw: number;
  exit: V2 | null;
  outdoor?: boolean;
}
export const EYE = 1.6, DOOR_W = 1.8, WALL_T = 0.4;
export const DOOR_H = 2.7, CORR_H = 3.2, HALL_H = 5, CORR_W = 2.4;

const Q = Math.PI / 2;
const r3 = (n: number) => Math.round(n * 1000) / 1000;
const rot = (yaw: number, x: number, z: number): V2 => [r3(x * Math.cos(yaw) + z * Math.sin(yaw)), r3(-x * Math.sin(yaw) + z * Math.cos(yaw))];
/** Wall-line centre of a room's entry (side 1, local +Z) or exit (side -1). */
const edge = (r: Room, side: 1 | -1): V2 => { const o = rot(r.yaw, 0, side * r.size[1] / 2); return [r.center[0] + o[0], r.center[1] + o[1]]; };
const mk = (key: ChapterKey, center: V2, size: V2, height: number, yaw: number, outdoor?: boolean): Room => {
  const r: Room = { key, center, size, height, yaw, exit: null, outdoor };
  if (!outdoor) r.exit = edge(r, -1);
  return r;
};

export const ROOMS: Record<ChapterKey, Room> = {
  saw: mk('saw', [0, -8], [8, 8], 4.5, 0),
  cow: mk('cow', [15, -17], [11, 11], 6, -Q),
  labyrinth: mk('labyrinth', [38, -19], [10, 10], 8, -Q),
  thread: mk('thread', [47, -31], [7, 7], 4, 0),
  wings: mk('wings', [47, -41], [6, 6], 14, 0), // open to the sky
  partridge: mk('partridge', [250, -30], [36, 36], 12, -Q, true), // beach, radius 18
};

export const SPAWN = { pos: [0, 7] as V2, yaw: 0 };
const HALL: Rect = [-5, 0, 5, 9];
const HALL_EXIT: V2 = [0, 0];

// Corridor turn points, shared by the walls and the thread.
const C1: V2 = [0, -17];
const MEANDER: V2[] = [[24.5, -17], [24.5, -25], [30.5, -25], [30.5, -19]];
const C3: V2 = [47, -19];

export const THREAD: V2[] = [
  SPAWN.pos, ROOMS.saw.center, C1, ROOMS.cow.center, ...MEANDER,
  ROOMS.labyrinth.center, C3, ROOMS.thread.center, ROOMS.wings.center,
];

// Four pillars in the hall: a Minoan colonnade beside the thread.
export const COLUMNS: V2[] = [[-2.8, 2.5], [2.8, 2.5], [-2.8, 5.5], [2.8, 5.5]];
const COLUMN_R = 0.3;

// Everything below is generated from the hand-laid points above.
type Rect = [number, number, number, number]; // x0 z0 x1 z1
export const BOXES: Box[] = [];
export const GAPS: { pos: V2; axis: 'x' | 'z'; h: number }[] = []; // wall openings; World lays a lintel over each
export const FLOORS: { min: V2; max: V2; h: number; roof: boolean }[] = []; // floor and ceiling slabs

const rectOf = (r: Room): Rect => {
  const q = Math.abs(Math.sin(r.yaw)) > 0.5, [w, d] = q ? [r.size[1], r.size[0]] : r.size;
  return [r.center[0] - w / 2, r.center[1] - d / 2, r.center[0] + w / 2, r.center[1] + d / 2];
};

/** Four walls around a rect, with a DOOR_W gap at each point in `gaps` (a gap with `door` gets a closed door box). */
function roomWalls(rc: Rect, gaps: { p: V2; door?: ChapterKey; seal?: true }[], h: number) {
  const [x0, z0, x1, z1] = rc, T = WALL_T / 2, g = DOOR_W / 2;
  const edges: { ax: 'x' | 'z'; line: number; a: number; b: number }[] = [
    { ax: 'x', line: z0, a: x0, b: x1 }, { ax: 'x', line: z1, a: x0, b: x1 },
    { ax: 'z', line: x0, a: z0, b: z1 }, { ax: 'z', line: x1, a: z0, b: z1 },
  ];
  const slab = (ax: 'x' | 'z', line: number, a: number, b: number): Pick<Box, 'min' | 'max'> =>
    ax === 'x' ? { min: [a, line - T], max: [b, line + T] } : { min: [line - T, a], max: [line + T, b] };
  for (const e of edges) {
    const i = e.ax === 'x' ? 0 : 1;
    const cuts = gaps.filter(({ p }) => Math.abs(p[1 - i] - e.line) < 1e-6).sort((p, q) => p.p[i] - q.p[i]);
    let from = e.a - T;
    for (const c of cuts) {
      BOXES.push({ ...slab(e.ax, e.line, from, c.p[i] - g), h });
      if (c.door) BOXES.push({ ...slab(e.ax, e.line, c.p[i] - g, c.p[i] + g), door: c.door, h: DOOR_H });
      if (c.seal) BOXES.push({ ...slab(e.ax, e.line, c.p[i] - g, c.p[i] + g), seal: true, h: DOOR_H }); // invisible: blocks only once sealed
      GAPS.push({ pos: c.p, axis: e.ax, h });
      from = c.p[i] + g;
    }
    BOXES.push({ ...slab(e.ax, e.line, from, e.b + T), h });
  }
}

/** A corridor of width w along axis-aligned points: side walls (outer corners closed, inner corners meeting) and floor slabs. */
function corridor(pts: V2[], w = CORR_W) {
  const T = WALL_T / 2, n = pts.length - 1;
  const dir = (i: number): V2 => { const dx = pts[i + 1][0] - pts[i][0], dz = pts[i + 1][1] - pts[i][1], l = Math.hypot(dx, dz); return [dx / l, dz / l]; };
  const cross = (i: number) => dir(i - 1)[0] * dir(i)[1] - dir(i - 1)[1] * dir(i)[0]; // turn at vertex i
  for (let i = 0; i < n; i++) {
    const a = pts[i], d = dir(i), len = Math.hypot(pts[i + 1][0] - a[0], pts[i + 1][1] - a[1]), perp: V2 = [-d[1], d[0]];
    for (const s of [1, -1]) {
      const t0 = i === 0 ? 0 : s * cross(i) > 0 ? w / 2 : -(w / 2 + T);
      const t1 = i === n - 1 ? len : s * cross(i + 1) > 0 ? len - w / 2 : len + w / 2 + T;
      const p = (t: number): V2 => [a[0] + perp[0] * s * w / 2 + d[0] * t, a[1] + perp[1] * s * w / 2 + d[1] * t];
      const [p0, p1] = [p(t0), p(t1)], alongX = Math.abs(d[0]) > 0.5;
      BOXES.push({
        min: [Math.min(p0[0], p1[0]) - (alongX ? 0 : T), Math.min(p0[1], p1[1]) - (alongX ? T : 0)],
        max: [Math.max(p0[0], p1[0]) + (alongX ? 0 : T), Math.max(p0[1], p1[1]) + (alongX ? T : 0)], h: CORR_H,
      });
    }
    const e0 = i > 0 ? w / 2 : 0, e1 = i < n - 1 ? w / 2 : 0, p0: V2 = [a[0] - d[0] * e0, a[1] - d[1] * e0], p1: V2 = [a[0] + d[0] * (len + e1), a[1] + d[1] * (len + e1)];
    FLOORS.push({
      min: [Math.min(p0[0], p1[0]) - Math.abs(perp[0]) * w / 2, Math.min(p0[1], p1[1]) - Math.abs(perp[1]) * w / 2],
      max: [Math.max(p0[0], p1[0]) + Math.abs(perp[0]) * w / 2, Math.max(p0[1], p1[1]) + Math.abs(perp[1]) * w / 2], h: CORR_H, roof: true,
    });
  }
}

const R = ROOMS;
roomWalls(HALL, [{ p: HALL_EXIT }], HALL_H);
FLOORS.push({ min: [HALL[0], HALL[1]], max: [HALL[2], HALL[3]], h: HALL_H, roof: true });
for (const k of ['saw', 'cow', 'labyrinth', 'thread', 'wings'] as const) {
  roomWalls(rectOf(R[k]), [{ p: edge(R[k], 1), seal: k === 'thread' || undefined }, { p: R[k].exit!, door: k }], R[k].height);
  const rc = rectOf(R[k]);
  FLOORS.push({ min: [rc[0], rc[1]], max: [rc[2], rc[3]], h: R[k].height, roof: k !== 'wings' });
}
corridor([HALL_EXIT, edge(R.saw, 1)]);
corridor([R.saw.exit!, C1, edge(R.cow, 1)]);
corridor([R.cow.exit!, ...MEANDER, edge(R.labyrinth, 1)]);
corridor([R.labyrinth.exit!, C3, edge(R.thread, 1)]);
corridor([R.thread.exit!, edge(R.wings, 1)]);
for (const [x, z] of COLUMNS) BOXES.push({ min: [x - COLUMN_R, z - COLUMN_R], max: [x + COLUMN_R, z + COLUMN_R], post: true });

export function roomAt(p: V2): ChapterKey | null {
  for (const r of Object.values(ROOMS)) {
    if (r.outdoor) { if (Math.hypot(p[0] - r.center[0], p[1] - r.center[1]) <= r.size[0] / 2) return r.key; continue; }
    const [x0, z0, x1, z1] = rectOf(r);
    if (p[0] >= x0 && p[0] <= x1 && p[1] >= z0 && p[1] <= z1) return r.key;
  }
  return null;
}

/** True if a body of radius r at p touches a wall, a closed door, a column, or the edge of the beach. */
export function blocked(p: V2, r: number, open: ChapterKey[], sealed = false): boolean {
  for (const b of BOXES) {
    if (b.seal && !sealed) continue; // the thread room's entry, shut behind you once IV is written
    if (b.door && open.includes(b.door)) continue;
    const dx = p[0] - Math.min(Math.max(p[0], b.min[0]), b.max[0]), dz = p[1] - Math.min(Math.max(p[1], b.min[1]), b.max[1]);
    if (dx * dx + dz * dz < r * r) return true;
  }
  const beach = ROOMS.partridge;
  return p[0] > 100 && Math.hypot(p[0] - beach.center[0], p[1] - beach.center[1]) > beach.size[0] / 2 - r;
}

export function threadIndexNear(p: V2): number {
  let best = 0, bd = Infinity;
  THREAD.forEach((t, i) => { const d = Math.hypot(t[0] - p[0], t[1] - p[1]); if (d < bd) { bd = d; best = i; } });
  return best;
}

export function entryOf(k: ChapterKey): { pos: V2; yaw: number } {
  const r = ROOMS[k], o = rot(r.yaw, 0, r.size[1] / 2 - 1);
  return { pos: [r.center[0] + o[0], r.center[1] + o[1]], yaw: r.yaw };
}

export const BEACH_SPAWN = entryOf('partridge');
