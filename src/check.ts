// Run with `npm run check`. Fails loudly if the store flow, the copy or the flight model break.
import { CHAPTERS } from './content/copy';
import { newFlight, step } from './experience/games/flight/physics';
import { live, ORDER, useStore } from './store';
import { BOXES, blocked, entryOf, ROOMS, roomAt, SPAWN, THREAD, V2 } from './world/layout';

const assert = (c: boolean, m: string) => { if (!c) throw new Error('FAIL: ' + m); };

// copy
assert(CHAPTERS.length === 6 && CHAPTERS.every((c, i) => c.key === ORDER[i]), 'six chapters in ORDER');
for (const c of CHAPTERS) c.captions.forEach((cap, i) => assert(cap.t.length > 0 || (c.key === 'partridge' && i === 0), `${c.key} caption ${i} non-empty`));

// store run
const st = () => useStore.getState();
st().begin();
assert(st().mode === 'walk', 'begin() enters walk');
for (const k of ORDER) {
  if (k === 'partridge') break;
  const cp = CHAPTERS.find((c) => c.key === k)!;
  st().enter(k);
  assert(st().current === k && st().step === 0, `enter(${k}) sets current`);
  for (let i = 0; i < cp.captions.length; i++) st().advance();
  if (k === 'wings') { assert(st().mode === 'flight', 'wings ends in flight'); break; }
  assert(st().written.includes(cp.id) && st().doors.includes(k) && st().current === null, `${k} writes its line and opens its door`);
}
st().endFlight({ outcome: 'win', maxAltitude: 0.5, glory: 0 });
assert(st().written.includes('V') && st().current === 'partridge' && st().mode === 'walk' && st().step === 0, 'endFlight writes V and lands on the beach');
const w = st().written.length;
st().enter('saw');
assert(st().current === 'partridge' && st().written.length === w, 'enter(saw) after it is written is a no-op');
live.reset();

// layout
const dist = (a: V2, b: V2) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const inBox = (p: V2, b: { min: V2; max: V2 }) => p[0] >= b.min[0] && p[0] <= b.max[0] && p[1] >= b.min[1] && p[1] <= b.max[1];
const hits = (a: V2, b: V2, bx: { min: V2; max: V2 }) => { // segment vs box, slab method
  let t0 = 0, t1 = 1;
  for (let i = 0; i < 2; i++) {
    const d = b[i] - a[i];
    if (Math.abs(d) < 1e-9) { if (a[i] < bx.min[i] || a[i] > bx.max[i]) return false; continue; }
    let u = (bx.min[i] - a[i]) / d, v = (bx.max[i] - a[i]) / d; if (u > v) [u, v] = [v, u];
    t0 = Math.max(t0, u); t1 = Math.min(t1, v); if (t0 > t1) return false;
  }
  return true;
};
assert(Object.keys(ROOMS).join() === ORDER.join(), 'rooms are in ORDER');
for (const k of ORDER) assert(roomAt(ROOMS[k].center) === k, `roomAt(center) is ${k}`);
assert(THREAD[0][0] === SPAWN.pos[0] && THREAD[0][1] === SPAWN.pos[1], 'THREAD starts at SPAWN');
let len = 0, reach = -1;
for (const k of ORDER.slice(0, 5)) { // thread passes each room centre saw..wings, in order
  let best = Infinity, at = 0, run = 0;
  for (let i = 0; i < THREAD.length - 1; i++) {
    const a = THREAD[i], b = THREAD[i + 1], l = dist(a, b), c = ROOMS[k].center;
    const t = Math.min(1, Math.max(0, ((c[0] - a[0]) * (b[0] - a[0]) + (c[1] - a[1]) * (b[1] - a[1])) / (l * l)));
    const d = dist(c, [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    if (d < best) { best = d; at = run + t * l; }
    run += l;
  }
  assert(best <= 0.5 && at > reach, `thread passes ${k} in order`); reach = at;
}
for (let i = 0; i < THREAD.length - 1; i++) {
  len += dist(THREAD[i], THREAD[i + 1]);
  for (const b of BOXES) if (!b.door) assert(!hits(THREAD[i], THREAD[i + 1], b), `thread segment ${i} crosses a wall`);
}
assert(len >= 70 && len <= 120, `thread length ${len.toFixed(1)} m in [70, 120]`);
const all = ORDER.slice();
for (let i = 0; i < THREAD.length - 1; i++) { // the whole thread is walkable with a 0.3 m body once every door is open
  const n = Math.ceil(dist(THREAD[i], THREAD[i + 1]) / 0.25);
  for (let j = 0; j <= n; j++) {
    const p: V2 = [THREAD[i][0] + (THREAD[i + 1][0] - THREAD[i][0]) * j / n, THREAD[i][1] + (THREAD[i + 1][1] - THREAD[i][1]) * j / n];
    assert(!blocked(p, 0.3, all), `thread blocked at ${p.map((x) => x.toFixed(2))}`);
  }
}
for (const k of ORDER) {
  const r = ROOMS[k]; if (k === 'partridge') { assert(r.exit === null, 'partridge has no exit'); continue; }
  const door = BOXES.find((b) => b.door === k && inBox(r.exit!, b));
  assert(!!door, `${k} exit is inside its door box`);
  assert(blocked(r.exit!, 0.3, []) && !blocked(r.exit!, 0.3, [k]), `${k} door blocks until opened`);
  const e = entryOf(k); assert(roomAt(e.pos) === k, `entryOf(${k}) is inside the room`);
}
assert(!blocked(SPAWN.pos, 0.3, []), 'SPAWN is free');

// flight model
const run = (flap: (f: ReturnType<typeof newFlight>) => boolean) => { const f = newFlight(); while (!f.outcome) step(f, flap(f), 1 / 60); return f; };
assert(run(() => false).outcome === 'sea', 'gliding forever ends in the sea');
assert(run(() => true).outcome === 'melt', 'climbing forever melts the wax');
assert(run((f) => f.alt < 0.5).outcome === 'win', 'holding the middle course reaches Sicily');
console.log('ok: store, copy and flight checks passed');
