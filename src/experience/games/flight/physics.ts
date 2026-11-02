// Flight model from the spec (section 8.2), in normalised altitude units: 0 = sea, 1 = sun.
export const FLIGHT_SECONDS = 45;
const ZONES = { sea: 0.05, sprayTop: 0.25, midLo: 0.35, midHi: 0.65, heat: 0.75 };

export interface Flight {
  alt: number; vy: number; wax: number; spray: number; time: number; glory: number; maxAlt: number;
  melted: boolean; outcome: 'melt' | 'sea' | 'win' | null;
}
export const newFlight = (): Flight => ({ alt: 0.5, vy: 0, wax: 1, spray: 0, time: 0, glory: 0, maxAlt: 0.5, melted: false, outcome: null });

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
/** vy is positive downward (spec convention): thrust is -2.2, clamp [-0.75, +0.95]. `grace` seconds hold the player steady at launch. */
export function step(f: Flight, flap: boolean, dt: number, grace = 2.5) {
  if (f.outcome) return f;
  f.time += dt;
  const z = ZONES;
  if (f.alt <= z.sprayTop && f.alt > z.sea) f.spray = clamp(f.spray + lerp(0.8, 0.35, (f.alt - z.sea) / (z.sprayTop - z.sea)) * dt, 0, 1);
  else if (f.alt > z.sprayTop) f.spray = clamp(f.spray - 0.08 * dt, 0, 1);
  if (f.alt >= z.heat) {
    f.wax = clamp(f.wax - lerp(0.15, 0.7, (f.alt - z.heat) / (1 - z.heat)) * dt, 0, 1); // never regenerates
    if (f.wax <= 0) f.melted = true;
  }
  if (f.alt > z.midHi) f.glory += (f.alt - z.midHi) * 400 * dt;
  if (f.time < grace && !f.melted) { f.vy = 0; } else {
    const g = 0.8 + f.spray * 1.3, thrust = flap && !f.melted ? -2.2 : 0;
    f.vy = clamp(f.vy + (g + thrust) * dt, -0.75, 0.95);
    f.alt = clamp(f.alt - f.vy * dt, 0, 1.02);
  }
  f.maxAlt = Math.max(f.maxAlt, f.alt);
  if (f.alt <= z.sea) f.outcome = f.melted ? 'melt' : 'sea';
  else if (f.time >= FLIGHT_SECONDS && !f.melted) f.outcome = 'win';
  return f;
}
