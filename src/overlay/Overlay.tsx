import { useEffect, useRef, useState } from 'react';
import { ambient, setSound } from '../audio/sounds';
import { UI } from '../content/copy';
import { chapterCopy, useStore } from '../store';
import Captions from './Captions';
import ChapterRail from './ChapterRail';
import { FinalBalance, SourcesPage } from './FinalBalance';
import Hud from './Hud';
import Ledger from './Ledger';
import Settings from './Settings';

const BED: Record<string, string> = { title: 'sea', saw: 'wind', cow: 'workshop', labyrinth: 'drip', thread: 'drip', wings: 'wind', partridge: 'dawn', balance: 'dawn' };

function Title() {
  const { settings, setSetting, set, go, diving } = useStore();
  const letters = [...UI.title];
  const begin = () => { set({ diving: true }); setTimeout(() => go('saw'), 900); };
  return (
    <div className={'title-screen' + (diving ? ' diving' : '')}>
      <h1 aria-label={UI.title}>
        {letters.map((ch, i) => <span key={i} aria-hidden className={ch === ' ' ? 'sp' : ''} style={{ animationDelay: `${0.3 + i * 0.07}s` }}>{ch === ' ' ? ' ' : ch}</span>)}
      </h1>
      <p className="sub">{UI.subtitle}</p>
      <div className="row">
        <button className="btn" onClick={begin} autoFocus>{UI.begin}</button>
        <button className="btn ghost" aria-pressed={settings.sound} onClick={() => setSetting('sound', !settings.sound)}>{settings.sound ? UI.soundOff : UI.soundOn}</button>
        <button className="link" onClick={() => set({ showSources: true })}>{UI.sources}</button>
      </div>
    </div>
  );
}

function Continue() {
  const { chapter, beat, entryAt, advance } = useStore();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    if (beat !== 'entry') return;
    const t = setTimeout(() => setReady(true), Math.max(0, entryAt + 3600 - Date.now()));
    return () => clearTimeout(t);
  }, [beat, entryAt]);
  if (!chapterCopy(chapter) || beat === 'build') return null;
  if (beat === 'entry' && !ready) return null;
  return <button className={'btn continue' + (beat === 'entry' ? ' entry' : '')} onClick={advance}>{UI.cont}</button>;
}

function Assemble() {
  const { chapter, beat, step, assembly, set } = useStore();
  if (chapter !== 'cow' || beat !== 'commission' || step !== 2) return null;
  return (
    <div className="assemble mono">
      <label htmlFor="asm">{UI.assemble}{' · '}{UI.parts.join(' · ')}</label>
      <input id="asm" type="range" min={0} max={1} step={0.005} value={assembly} onChange={(e) => set({ assembly: +e.target.value })} />
    </div>
  );
}

export default function Overlay() {
  const s = useStore();
  const { chapter, settings, veil, showSources } = s;
  const wheel = useRef({ acc: 0, at: 0 });

  useEffect(() => { document.documentElement.classList.toggle('reduced', settings.reducedMotion); }, [settings.reducedMotion]);
  useEffect(() => { setSound(settings.sound); }, [settings.sound]);
  useEffect(() => { ambient(BED[chapter] ?? 'none'); }, [chapter]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const st = useStore.getState();
      if ((e.target instanceof HTMLInputElement && e.target.type !== 'checkbox') || e.target instanceof HTMLSelectElement) return;
      if (e.code === 'KeyL' && st.chapter !== 'title' && st.chapter !== 'balance') { useStore.setState({ ledgerOpen: !st.ledgerOpen }); return; }
      if (e.code === 'Escape') { useStore.setState({ showSources: false, showSettings: false }); return; }
      const cin = st.beat !== 'build' && chapterCopy(st.chapter) && !st.showSources;
      if (!cin) return;
      if (e.target instanceof HTMLButtonElement && (e.code === 'Space' || e.code === 'Enter')) return;
      if (e.code === 'Space' || e.code === 'ArrowDown' || e.code === 'Enter' || e.code === 'ArrowRight') st.advance();
      else if (e.code === 'ArrowUp' || e.code === 'ArrowLeft') st.retreat();
    };
    const wh = (e: WheelEvent) => {
      const st = useStore.getState();
      if (st.beat === 'build' || !chapterCopy(st.chapter) || st.showSources) return;
      const w = wheel.current, now = performance.now();
      if (now - w.at < 700) return;
      w.acc += e.deltaY;
      if (Math.abs(w.acc) > 40) { (w.acc > 0 ? st.advance : st.retreat)(); w.acc = 0; w.at = now; }
    };
    addEventListener('keydown', key); addEventListener('wheel', wh, { passive: true });
    return () => { removeEventListener('keydown', key); removeEventListener('wheel', wh); };
  }, []);

  const playing = chapter !== 'title' && chapter !== 'balance';
  return (
    <>
      <div id="ui">
        {chapter === 'title' && <Title />}
        {playing && <ChapterRail />}
        {playing && <Captions />}
        {playing && <Continue />}
        {playing && <Assemble />}
        {playing && <Ledger />}
        {playing && s.beat === 'commission' && s.step === 0 && chapter !== 'labyrinth' && chapter !== 'wings' && <div className="hint mono">{UI.scrollHint}</div>}
        <Hud />
        {chapter === 'balance' && <FinalBalance />}
        <Settings />
        {showSources && <SourcesPage />}
      </div>
      <div id="fx-black" /><div id="fx-flash" /><div id="veil" className={veil ? 'on' : ''} />
    </>
  );
}
