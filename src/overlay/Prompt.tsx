import { useEffect, useState } from 'react';
import { UI } from '../content/copy';
import { isTouch } from '../input';
import { useStore } from '../store';
import { follow, lock, player } from '../world/player';

/** Walk-mode HUD: reticle, hotspot label, controls hint, Follow the thread, Continue, and the resume overlay after Esc. */
export default function Prompt() {
  const mode = useStore((s) => s.mode), current = useStore((s) => s.current), focus = useStore((s) => s.focus), advance = useStore((s) => s.advance);
  const [hint, setHint] = useState(false), [paused, setPaused] = useState(player.paused);
  useEffect(() => {
    if (mode !== 'walk') return;
    setHint(true);
    const t = setTimeout(() => setHint(false), 20000);
    return () => clearTimeout(t);
  }, [mode]);
  useEffect(() => {
    const f = () => setPaused(player.paused);
    addEventListener('player-pause', f);
    return () => removeEventListener('player-pause', f);
  }, []);
  if (mode !== 'walk') return null;
  return (
    <>
      {paused && <button className="modal resume" autoFocus onClick={lock}><span>{UI.resume}</span></button>}
      <i className="reticle nopointer" />
      {hint && <p className="mono hint nopointer">{isTouch() ? UI.controlsTouch : UI.controls}</p>}
      {focus && !paused && <p className="mono focus nopointer">{focus} <b>{UI.useKey}</b></p>}
      <button className="btn ghost small follow" onClick={follow}>{UI.follow}</button>
      {current && <button className="btn continue" onClick={advance}>{UI.cont}</button>}
    </>
  );
}
