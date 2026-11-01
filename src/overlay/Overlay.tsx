import { useEffect } from 'react';
import { ambient, setSound } from '../audio/sounds';
import { UI } from '../content/copy';
import { useStore } from '../store';
import Captions from './Captions';
import { FinalBalance, SourcesPage } from './FinalBalance';
import Hud from './Hud';
import Ledger from './Ledger';
import Prompt from './Prompt';
import Settings from './Settings';

const BED: Record<string, string> = { title: 'sea', saw: 'wind', cow: 'workshop', labyrinth: 'drip', thread: 'drip', wings: 'wind', partridge: 'dawn', flight: 'wind', balance: 'dawn' };

function Title() {
  const { settings, setSetting, set, begin } = useStore();
  const letters = [...UI.title];
  return (
    <div className="title-screen">
      <h1 aria-label={UI.title}>
        {letters.map((ch, i) => <span key={i} aria-hidden className={ch === ' ' ? 'sp' : ''} style={{ animationDelay: `${0.3 + i * 0.07}s` }}>{ch === ' ' ? ' ' : ch}</span>)}
      </h1>
      <p className="sub">{UI.subtitle}</p>
      <div className="row">
        <button id="begin" className="btn" onClick={begin} autoFocus>{UI.begin}</button>
        <button className="btn ghost" aria-pressed={settings.sound} onClick={() => setSetting('sound', !settings.sound)}>{settings.sound ? UI.soundOff : UI.soundOn}</button>
        <button className="link" onClick={() => set({ showSources: true })}>{UI.sources}</button>
      </div>
    </div>
  );
}

export default function Overlay() {
  const { mode, current, settings, showSources } = useStore();
  // ponytail: the bed follows the chamber; between chambers (current null in walk) the last bed keeps playing
  const bed = mode === 'walk' ? current : mode;

  useEffect(() => { document.documentElement.classList.toggle('reduced', settings.reducedMotion); }, [settings.reducedMotion]);
  useEffect(() => { setSound(settings.sound); }, [settings.sound]);
  useEffect(() => { if (bed) ambient(BED[bed]); }, [bed]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const st = useStore.getState();
      if ((e.target instanceof HTMLInputElement && e.target.type !== 'checkbox') || e.target instanceof HTMLSelectElement) return;
      if (e.code === 'KeyL' && (st.mode === 'walk' || st.mode === 'flight')) { useStore.setState({ ledgerOpen: !st.ledgerOpen }); return; }
      if (e.code === 'Escape') { useStore.setState({ showSources: false, showSettings: false }); return; }
      if (st.mode !== 'walk' || !st.current || st.showSources) return;
      if (e.target instanceof HTMLButtonElement && (e.code === 'Space' || e.code === 'Enter')) return;
      if (e.code === 'Space' || e.code === 'Enter') st.advance();
    };
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  }, []);

  const playing = mode === 'walk' || mode === 'flight';
  return (
    <>
      <div id="ui">
        {mode === 'title' && <Title />}
        {playing && <Captions />}
        <Prompt />
        {playing && <Ledger />}
        <Hud />
        {mode === 'balance' && <FinalBalance />}
        <Settings />
        {showSources && <SourcesPage />}
      </div>
      <div id="fx-black" /><div id="fx-flash" />
    </>
  );
}
