import { useEffect, useState } from 'react';
import { GAME, UI } from '../content/copy';
import { LOOK } from '../experience/shared/look';
import { live, useLive, useStore } from '../store';

const requestSkip = () => window.dispatchEvent(new Event('game-skip'));

export default function Hud() {
  const mode = useStore((s) => s.mode);
  const L = useLive();
  const inGame = mode === 'flight';
  const [veil, setVeil] = useState(true);
  useEffect(() => { if (!inGame) { setVeil(true); return; } const t = setTimeout(() => setVeil(false), 30); return () => clearTimeout(t); }, [inGame]);

  useEffect(() => {
    if (!inGame) return;
    const key = (e: KeyboardEvent) => { if (e.code === 'Escape' && live.get().gameState === 'playing') live.set({ gameState: 'paused' }); };
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  }, [inGame]);

  if (!inGame) return null;
  const modal = L.gameState === 'prompt' || L.gameState === 'paused';
  const prompt = GAME.flightPrompt;
  const controls = GAME.flightControls + ' · ESC PAUSE';

  return (
    <>
      <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 5, pointerEvents: 'none', background: LOOK.sky.day[2], opacity: veil ? 1 : 0, transition: veil ? 'none' : 'opacity 1s ease' }} />
      {modal && !L.done && (
        <div className="modal" role="dialog" aria-label={L.gameState === 'paused' ? UI.pause : prompt}>
          <h3>{L.gameState === 'paused' ? UI.pause : prompt}</h3>
          <p className="mono">{controls}</p>
          <button className="btn" autoFocus onClick={() => live.set({ gameState: 'playing' })}>{L.gameState === 'paused' ? UI.resume : 'Start'}</button>
          <button className="btn ghost small" onClick={() => { live.set({ gameState: 'playing' }); requestSkip(); }}>{UI.skip}</button>
        </div>
      )}
      {L.gameState === 'playing' && !L.done && <button className="btn ghost small skip" onClick={requestSkip}>{UI.skip}</button>}

      {(L.gameState === 'playing' || L.done) && (
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
          {L.done && <div><button className="btn" onClick={() => { const f = useStore.getState().flight; if (f) useStore.getState().endFlight(f); }}>{UI.cont}</button></div>}
        </div>
      )}
    </>
  );
}
