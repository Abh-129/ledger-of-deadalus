import { useEffect, useRef } from 'react';
import { GAME, UI } from '../content/copy';
import { input, isTouch } from '../input';
import { live, useLive, useStore } from '../store';

let lockFailed = false;
export const requestSkip = () => window.dispatchEvent(new Event('game-skip'));

function start() {
  const ch = useStore.getState().chapter;
  if (ch === 'labyrinth' && !isTouch()) {
    try { (document.querySelector('canvas')?.requestPointerLock() as unknown as Promise<void> | undefined)?.catch?.(() => { lockFailed = true; }); }
    catch { lockFailed = true; }
  }
  live.set({ gameState: 'playing' });
}

function Stick() {
  const knob = useRef<HTMLElement>(null);
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    let dx = (e.clientX - r.left - r.width / 2) / (r.width / 2), dy = (e.clientY - r.top - r.height / 2) / (r.height / 2);
    const m = Math.hypot(dx, dy); if (m > 1) { dx /= m; dy /= m; }
    input.moveX = dx; input.moveY = -dy;
    if (knob.current) knob.current.style.transform = `translate(${dx * 40}px, ${dy * 40}px)`;
  };
  const end = () => { input.moveX = input.moveY = 0; if (knob.current) knob.current.style.transform = ''; };
  return <div className="stick" onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); move(e); }} onPointerMove={(e) => e.buttons && move(e)} onPointerUp={end} onPointerCancel={end}><i ref={knob} /></div>;
}
function LookZone() {
  const last = useRef<[number, number] | null>(null);
  return <div className="lookzone"
    onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); last.current = [e.clientX, e.clientY]; }}
    onPointerMove={(e) => { if (!last.current) return; input.lookX += e.clientX - last.current[0]; input.lookY += e.clientY - last.current[1]; last.current = [e.clientX, e.clientY]; }}
    onPointerUp={() => { last.current = null; }} onPointerCancel={() => { last.current = null; }} />;
}

export default function Hud() {
  const { chapter, beat, settings } = useStore();
  const L = useLive();
  const inGame = beat === 'build' && (chapter === 'labyrinth' || chapter === 'wings');

  useEffect(() => {
    if (!inGame) return;
    const lock = () => { if (!document.pointerLockElement && chapter === 'labyrinth' && !lockFailed && live.get().gameState === 'playing') live.set({ gameState: 'paused' }); };
    const err = () => { lockFailed = true; };
    const key = (e: KeyboardEvent) => { if (e.code === 'Escape' && chapter === 'wings' && live.get().gameState === 'playing') live.set({ gameState: 'paused' }); };
    document.addEventListener('pointerlockchange', lock); document.addEventListener('pointerlockerror', err); addEventListener('keydown', key);
    return () => { document.removeEventListener('pointerlockchange', lock); document.removeEventListener('pointerlockerror', err); removeEventListener('keydown', key); };
  }, [inGame, chapter]);

  if (!inGame) return null;
  const lab = chapter === 'labyrinth';
  const touch = isTouch();
  const modal = L.gameState === 'prompt' || L.gameState === 'paused';
  const prompt = lab ? (touch ? GAME.labyrinthPromptTouch : GAME.labyrinthPrompt) : GAME.flightPrompt;
  const controls = lab ? 'WASD / ARROWS MOVE · MOUSE LOOK · SHIFT SPRINT · ESC PAUSE' : GAME.flightControls + ' · ESC PAUSE';

  return (
    <>
      {modal && !L.done && (
        <div className="modal" role="dialog" aria-label={L.gameState === 'paused' ? UI.pause : prompt}>
          <h3>{L.gameState === 'paused' ? UI.pause : prompt}</h3>
          {settings.showControls && <p className="mono">{controls}</p>}
          <button className="btn" autoFocus onClick={start}>{L.gameState === 'paused' ? UI.resume : (lab ? (touch ? 'Tap' : 'Click') : 'Start')}</button>
          <button className="btn ghost small" onClick={() => { live.set({ gameState: 'playing' }); requestSkip(); }}>{UI.skip}</button>
          <button className="btn ghost small" onClick={() => { live.reset(); useStore.setState({ beat: 'commission', step: 0 }); }}>{UI.back}</button>
        </div>
      )}
      {L.gameState === 'playing' && !L.done && <button className="btn ghost small skip" onClick={requestSkip}>{UI.skip}</button>}

      {lab && L.gameState === 'playing' && (
        <>
          <div className="hud"><div className="mono">{GAME.threadLabel}{' · '}{L.thread} M</div></div>
          {touch && !L.msg && <><Stick /><LookZone /></>}
        </>
      )}
      {!lab && (L.gameState === 'playing' || L.done) && (
        <>
          <div className="hud">
            <div className="gauge wax mono">{GAME.wax}<div className="bar"><i style={{ width: `${L.wax * 100}%` }} /></div></div>
            <div className="dist mono">{GAME.distance}<div className="bar gauge"><i style={{ width: `${L.progress * 100}%`, background: 'var(--limestone)' }} /></div></div>
            <div className="gauge spray mono">{GAME.spray}<div className="bar"><i style={{ width: `${L.spray * 100}%` }} /></div></div>
          </div>
          {L.hot && <div className="glory mono">{GAME.glory}{' · '}{Math.floor(L.glory)}</div>}
        </>
      )}
      {L.msg && (
        <div className="banner" role="status">
          {L.msg}
          {L.msgSub && <em>{L.msgSub}</em>}
          {L.done && !lab && <div><button className="btn" onClick={() => useStore.getState().toEntry()}>{UI.cont}</button></div>}
        </div>
      )}
    </>
  );
}
