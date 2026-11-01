import { BUILT_BY, SOURCES, TECH_CREDITS } from '../content/canon';
import { FINAL } from '../content/copy';
import { useStore } from '../store';
import { LedgerRows } from './Ledger';

export function FinalBalance() {
  const { reset, go, set } = useStore();
  return (
    <div className="final">
      <div className="spread">
        <section className="page" aria-label="Ledger entries">
          <h2 style={{ fontFamily: 'var(--serif-display)', fontWeight: 400, letterSpacing: '0.08em', margin: '0 0 8px' }}>The Ledger</h2>
          <LedgerRows fresh={null} />
        </section>
        <section className="page" aria-label="Final balance">
          <h2 style={{ fontFamily: 'var(--serif-display)', fontWeight: 400, letterSpacing: '0.08em', margin: 0 }}>Final Balance</h2>
          <div className="totals" role="table" aria-label="Totals">
            {FINAL.rows.map(([k, v]) => (
              <div key={k} role="row"><span>{k}</span><span className="leader" aria-hidden /><b>{v}</b></div>
            ))}
          </div>
          <p className="body">{FINAL.body}</p>
          <div className="actions">
            <button className="btn small" onClick={reset}>{FINAL.playAgain}</button>
            <button className="btn small" onClick={() => go('labyrinth')}>{FINAL.walk}</button>
            <button className="btn small" onClick={() => set({ showSources: true })}>Sources</button>
          </div>
        </section>
      </div>
    </div>
  );
}

export function SourcesPage() {
  const close = () => useStore.setState({ showSources: false });
  return (
    <div className="sources-page" role="dialog" aria-label="Sources and credits">
      <article>
        <h2>Sources &amp; Credits</h2>
        {SOURCES.map((s) => (
          <p key={s.who} style={{ margin: 0 }}><strong>{s.who}</strong>, <em>{s.work}</em>. {s.note}</p>
        ))}
        <p style={{ margin: 0 }}>{BUILT_BY}</p>
        <ul>{TECH_CREDITS.map((t) => <li key={t}>{t}</li>)}</ul>
        <div><button className="btn small" onClick={close} autoFocus>Close</button></div>
      </article>
    </div>
  );
}
