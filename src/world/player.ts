import * as THREE from 'three';
import { AT, ORDER, useStore } from '../store';
import { BEACH_SPAWN, EYE, entryOf, ROOMS, SPAWN, threadIndexNear, THREAD, V2 } from './layout';

const start = AT && AT !== 'flight' && AT !== 'balance' ? entryOf(AT) : SPAWN;

// Plain state, written by Player.tsx every frame, never reactive. `paused`: pointer lock was lost (Esc), so the resume overlay is up.
export const player = { pos: new THREE.Vector3(start.pos[0], EYE, start.pos[1]), yaw: start.yaw, pitch: 0, auto: false, paused: false, teleport };
/** Waypoints the auto walk is heading for, nearest first. */
export const route: V2[] = [];

function teleport(p: V2, yaw: number) {
  player.pos.set(p[0], EYE, p[1]); player.yaw = yaw; player.pitch = 0; player.auto = false; route.length = 0;
}

// The store never knows about the camera: the player follows it.
useStore.subscribe((s, p) => {
  if (p.mode === 'flight' && s.mode === 'walk') teleport(BEACH_SPAWN.pos, BEACH_SPAWN.yaw);
  else if (p.written.length && !s.written.length) teleport(SPAWN.pos, SPAWN.yaw);
});

/** Pointer lock on the canvas only. Must run inside a user gesture. */
export function lock() {
  const c = document.querySelector<HTMLCanvasElement>('#stage canvas');
  try { (c?.requestPointerLock() as Promise<void> | undefined)?.catch(() => {}); } catch { /* refused: drag look still works */ }
}

/** Walk the thread to the current chamber's centre, or to its exit once the door is open (the next chamber if none is current). */
export function follow() {
  const s = useStore.getState(), k = s.current ?? ORDER[s.doors.length];
  if (!k || s.mode !== 'walk') return;
  const room = ROOMS[k], goal = s.doors.includes(k) && room.exit ? room.exit : room.center, here: V2 = [player.pos.x, player.pos.z];
  route.length = 0;
  if (k !== 'partridge') { // the beach has no thread
    let a = threadIndexNear(here);
    const b = threadIndexNear(room.center), d = Math.sign(b - a);
    // skip the nearest vertex if we are already past it
    if (d && (here[0] - THREAD[a][0]) * (THREAD[a + d][0] - THREAD[a][0]) + (here[1] - THREAD[a][1]) * (THREAD[a + d][1] - THREAD[a][1]) > 0) a += d;
    for (; d && (b - a) * d >= 0; a += d) route.push(THREAD[a]);
  }
  route.push(goal);
  player.auto = true;
}
