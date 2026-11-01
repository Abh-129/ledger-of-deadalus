// 15x15 perfect maze via iterative recursive-backtracker. The centre 3x3 is one open chamber that the
// carve treats as a single node, so the maze stays perfect (exactly one route between any two regions).
export const N = 15, C = 4, WALL_H = 5, T = 0.5;
export const ENTRANCE: [number, number] = [7, 14];
export const CENTRE: [number, number] = [7, 7];
const NB = 1, EB = 2, SB = 4, WB = 8;
const DIRS: [number, number, number, number][] = [[0, -1, NB, SB], [1, 0, EB, WB], [0, 1, SB, NB], [-1, 0, WB, EB]];

export const idx = (x: number, y: number) => y * N + x;
export const inChamber = (x: number, y: number) => x >= 6 && x <= 8 && y >= 6 && y <= 8;
export const cellCentre = (x: number, y: number): [number, number] => [x * C + C / 2, y * C + C / 2];

export function mulberry32(a: number) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export interface Wall { x: number; z: number; sx: number; sz: number }
export interface Maze {
  seed: number; open: Uint8Array; walls: Wall[];
  next: Int16Array;          // per cell: neighbour one step closer to the centre (-1 for the chamber)
  solution: [number, number][]; // entrance -> centre cell, inclusive
}

export function buildMaze(seed: number): Maze {
  const rng = mulberry32(seed);
  const open = new Uint8Array(N * N);
  const chamber: number[] = [];
  for (let y = 6; y <= 8; y++) for (let x = 6; x <= 8; x++) {
    chamber.push(idx(x, y));
    if (x < 8) { open[idx(x, y)] |= EB; open[idx(x + 1, y)] |= WB; }
    if (y < 8) { open[idx(x, y)] |= SB; open[idx(x, y + 1)] |= NB; }
  }
  const seen = new Uint8Array(N * N);
  const mark = (i: number) => { if (inChamber(i % N, (i / N) | 0)) chamber.forEach((c) => (seen[c] = 1)); else seen[i] = 1; };
  const start = idx(...ENTRANCE); mark(start);
  const stack = [start];
  while (stack.length) {
    const c = stack[stack.length - 1], cx = c % N, cy = (c / N) | 0;
    const froms = inChamber(cx, cy) ? chamber : [c];
    const cands: [number, number, number, number][] = [];
    for (const f of froms) for (const [dx, dy, b, ob] of DIRS) {
      const nx = (f % N) + dx, ny = ((f / N) | 0) + dy;
      if (nx < 0 || ny < 0 || nx >= N || ny >= N || seen[idx(nx, ny)]) continue;
      cands.push([f, idx(nx, ny), b, ob]);
    }
    if (!cands.length) { stack.pop(); continue; }
    const [f, n, b, ob] = cands[(rng() * cands.length) | 0];
    open[f] |= b; open[n] |= ob; mark(n); stack.push(n);
  }
  open[idx(...ENTRANCE)] |= SB; // the door

  // BFS outward from the centre gives every cell its next step toward the middle
  const next = new Int16Array(N * N).fill(-1), dist = new Int16Array(N * N).fill(-1);
  const q = [idx(...CENTRE)]; dist[q[0]] = 0;
  for (let h = 0; h < q.length; h++) {
    const c = q[h], cx = c % N, cy = (c / N) | 0;
    for (const [dx, dy, b] of DIRS) {
      if (!(open[c] & b)) continue;
      const n = idx(cx + dx, cy + dy); if (cx + dx < 0 || cy + dy < 0 || cx + dx >= N || cy + dy >= N || dist[n] >= 0) continue;
      dist[n] = dist[c] + 1; next[n] = c; q.push(n);
    }
  }
  const solution: [number, number][] = [];
  for (let c = idx(...ENTRANCE); c !== -1; c = next[c]) { solution.push([c % N, (c / N) | 0]); if (inChamber(c % N, (c / N) | 0)) break; }

  const walls: Wall[] = [];
  for (let j = 0; j <= N; j++) for (let x = 0; x < N; x++) {
    const closed = j === 0 ? true : j === N ? x !== ENTRANCE[0] : !(open[idx(x, j - 1)] & SB);
    if (closed) walls.push({ x: x * C + C / 2, z: j * C, sx: C + T, sz: T });
  }
  for (let i = 0; i <= N; i++) for (let y = 0; y < N; y++) {
    const closed = i === 0 || i === N ? true : !(open[idx(i - 1, y)] & EB);
    if (closed) walls.push({ x: i * C, z: y * C + C / 2, sx: T, sz: C + T });
  }
  return { seed, open, walls, next, solution };
}

export const isOpen = (m: Maze, x: number, y: number, dir: 0 | 1 | 2 | 3) => !!(m.open[idx(x, y)] & DIRS[dir][2]);
