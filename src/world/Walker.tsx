import { useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { input } from '../input';
import { useStore } from '../store';
import { updateFocus, useFocused } from './interact';
import { blocked, EYE, roomAt } from './layout';
import { follow, lock, player, route } from './player';

const R = 0.3, WALK = 4.4, RUN = 6.5, PITCH = Math.PI / 3, LOOK_LOCKED = 0.0022, LOOK_DRAG = 0.004;
const vel = { x: 0, z: 0 };
let bob = 0, lastRoom: string | null = null, stuck = 0;

export default function Walker() {
  const camera = useThree((s) => s.camera), gl = useThree((s) => s.gl);

  useEffect(() => {
    const canvas = gl.domElement, mode = () => useStore.getState().mode;
    const noLock0 = !matchMedia('(pointer: fine)').matches || new URLSearchParams(location.search).has('nolock');
    let noLock = noLock0, wasLocked = false, pressed = false, downLocked = false, moved = 0;
    const locked = () => document.pointerLockElement === canvas;
    const look = (e: MouseEvent, k: number) => {
      if (Math.abs(e.movementX) > 150 || Math.abs(e.movementY) > 150) return; // Chrome sometimes reports huge deltas under lock
      player.yaw -= e.movementX * k; player.pitch = THREE.MathUtils.clamp(player.pitch - e.movementY * k, -PITCH, PITCH);
    };
    const onLock = () => {
      if (locked()) { wasLocked = true; noLock = noLock0; }
      player.paused = !locked() && wasLocked && mode() === 'walk';
      dispatchEvent(new Event('player-pause'));
    };
    const onError = () => { noLock = true; };
    const onMouse = (e: MouseEvent) => { if (locked()) look(e, LOOK_LOCKED); };
    const onKey = (e: KeyboardEvent) => {
      if (mode() !== 'walk' || player.paused || e.repeat || e.target instanceof HTMLSelectElement || e.target instanceof HTMLInputElement) return;
      if (e.code === 'KeyE') useFocused(); else if (e.code === 'KeyF') follow();
    };
    const onClick = (e: MouseEvent) => { // lock only from the Begin button or the canvas
      if (mode() === 'walk' && !noLock && !locked() && e.target instanceof Element && e.target.closest('#begin, #stage canvas')) lock();
    };
    const onDown = (e: PointerEvent) => {
      pressed = true; downLocked = locked(); moved = 0;
      if (!downLocked) try { canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    };
    const onMove = (e: PointerEvent) => { // drag look, only while not locked
      if (!pressed || locked() || mode() !== 'walk') return;
      look(e, LOOK_DRAG); moved += Math.abs(e.movementX) + Math.abs(e.movementY);
    };
    const onUp = () => { // a click is any press while locked, or a press that barely moved in drag mode
      if (pressed && !player.paused && mode() === 'walk' && (downLocked || (noLock && moved < 6))) useFocused();
      pressed = false;
    };
    const unlockOutsideWalk = useStore.subscribe((s) => { if (s.mode !== 'walk' && locked()) document.exitPointerLock(); });
    canvas.addEventListener('mousemove', onMouse);
    canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp); canvas.addEventListener('pointercancel', onUp);
    document.addEventListener('pointerlockchange', onLock); document.addEventListener('pointerlockerror', onError);
    addEventListener('click', onClick); addEventListener('keydown', onKey);
    return () => {
      unlockOutsideWalk();
      canvas.removeEventListener('mousemove', onMouse);
      canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp); canvas.removeEventListener('pointercancel', onUp);
      document.removeEventListener('pointerlockchange', onLock); document.removeEventListener('pointerlockerror', onError);
      removeEventListener('click', onClick); removeEventListener('keydown', onKey);
      if (locked()) document.exitPointerLock();
      player.paused = false; dispatchEvent(new Event('player-pause'));
    };
  }, [gl]);

  useFrame(({ clock }, dt0) => {
    const dt = Math.min(dt0, 0.05), st = useStore.getState(), rm = st.settings.reducedMotion, k = input.keys;
    camera.rotation.order = 'YXZ';
    if (st.mode === 'title') { if (!rm) player.yaw = 0.1 * Math.sin(clock.elapsedTime * 0.2); }
    else if (st.mode === 'walk' && !player.paused) {
      let f = +(k.has('KeyW') || k.has('ArrowUp')) - +(k.has('KeyS') || k.has('ArrowDown'));
      const r = +k.has('KeyD') - +k.has('KeyA'), turn = +k.has('ArrowLeft') - +k.has('ArrowRight');
      if (f || r || turn) { player.auto = false; route.length = 0; }
      player.yaw += turn * 1.8 * dt;
      if (player.auto && route.length) { // steer along the route
        const dx = route[0][0] - player.pos.x, dz = route[0][1] - player.pos.z;
        if (Math.hypot(dx, dz) < 0.4) { route.shift(); if (!route.length) player.auto = false; }
        else {
          const want = Math.atan2(-dx, -dz), diff = Math.atan2(Math.sin(want - player.yaw), Math.cos(want - player.yaw));
          player.yaw += rm ? diff : diff * (1 - Math.exp(-dt * 8)); player.pitch *= 1 - Math.min(1, dt * 3);
          f = Math.abs(diff) < 1.2 ? 1 : 0;
        }
      }
      const sp = k.has('ShiftLeft') || k.has('ShiftRight') ? RUN : WALK, s = Math.sin(player.yaw), c = Math.cos(player.yaw);
      const n = Math.hypot(f, r) || 1, a = rm ? 1 : 1 - Math.exp(-dt * 12); // ease the speed in and out
      vel.x += ((-s * f + c * r) / n * sp - vel.x) * a; vel.z += ((-c * f - s * r) / n * sp - vel.z) * a;
      const p = player.pos, x0 = p.x, z0 = p.z, sealed = st.written.includes('IV');
      if (!blocked([p.x + vel.x * dt, p.z], R, st.doors, sealed)) p.x += vel.x * dt; else vel.x = 0; // slide along walls, one axis at a time
      if (!blocked([p.x, p.z + vel.z * dt], R, st.doors, sealed)) p.z += vel.z * dt; else vel.z = 0;
      const speed = Math.hypot(vel.x, vel.z);
      if (player.auto) { stuck = Math.hypot(p.x - x0, p.z - z0) < 0.2 * sp * dt ? stuck + dt : 0; if (stuck > 0.5) { player.auto = false; route.length = 0; } } else stuck = 0;
      bob += speed * dt * 2.5;
      const room = roomAt([p.x, p.z]);
      if (room !== lastRoom) { lastRoom = room; if (room) st.enter(room); }
      p.y = EYE + (rm ? 0 : Math.sin(bob) * 0.03 * Math.min(1, speed / WALK));
    }
    camera.position.copy(player.pos); camera.rotation.set(player.pitch, player.yaw, 0);
    updateFocus(camera, st.mode === 'walk' && !player.paused);
  });
  return null;
}
