// Run with `npm run check`. Fails loudly if the store flow, the copy or the flight model break.
import { CHAPTERS } from './content/copy';
import { newFlight, step } from './experience/games/flight/physics';
import { live, ORDER, useStore } from './store';

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

// flight model
const run = (flap: (f: ReturnType<typeof newFlight>) => boolean) => { const f = newFlight(); while (!f.outcome) step(f, flap(f), 1 / 60); return f; };
assert(run(() => false).outcome === 'sea', 'gliding forever ends in the sea');
assert(run(() => true).outcome === 'melt', 'climbing forever melts the wax');
assert(run((f) => f.alt < 0.5).outcome === 'win', 'holding the middle course reaches Sicily');
console.log('ok: store, copy and flight checks passed');
