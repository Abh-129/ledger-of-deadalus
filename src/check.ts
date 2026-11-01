// Run with `npm run check`. Fails loudly if maze generation or the flight model break.
import { buildMaze, idx, inChamber, N, ENTRANCE } from './experience/games/labyrinth/mazeGen';
import { newFlight, step } from './experience/games/flight/physics';

const assert = (c: boolean, m: string) => { if (!c) throw new Error('FAIL: ' + m); };

for (const seed of [1, 7, 42, 1234567, 99999999]) {
  const m = buildMaze(seed);
  let passages = 0;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (x < N - 1 && m.open[idx(x, y)] & 2 && !(inChamber(x, y) && inChamber(x + 1, y))) passages++;
    if (y < N - 1 && m.open[idx(x, y)] & 4 && !(inChamber(x, y) && inChamber(x, y + 1))) passages++;
  }
  assert(passages === 225 - 9, `seed ${seed}: perfect maze over 217 regions needs 216 passages, got ${passages}`);
  const seen = new Set<number>([idx(...ENTRANCE)]); const q = [idx(...ENTRANCE)];
  for (let h = 0; h < q.length; h++) {
    const c = q[h], x = c % N, y = (c / N) | 0;
    for (const [dx, dy, b] of [[0, -1, 1], [1, 0, 2], [0, 1, 4], [-1, 0, 8]]) {
      const nx = x + dx, ny = y + dy;
      if (m.open[c] & b && nx >= 0 && ny >= 0 && nx < N && ny < N && !seen.has(idx(nx, ny))) { seen.add(idx(nx, ny)); q.push(idx(nx, ny)); }
    }
  }
  assert(seen.size === 225, `seed ${seed}: every cell reachable, got ${seen.size}`);
  const s = m.solution;
  assert(s[0][0] === 7 && s[0][1] === 14 && inChamber(...s[s.length - 1]), `seed ${seed}: solution runs door to chamber`);
}

const run = (flap: (f: ReturnType<typeof newFlight>) => boolean) => { const f = newFlight(); while (!f.outcome) step(f, flap(f), 1 / 60); return f; };
assert(run(() => false).outcome === 'sea', 'gliding forever ends in the sea');
assert(run(() => true).outcome === 'melt', 'climbing forever melts the wax');
assert(run((f) => f.alt < 0.5).outcome === 'win', 'holding the middle course reaches Sicily');
console.log('ok: maze and flight checks passed');
