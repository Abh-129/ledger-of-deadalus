import { BUILT_BY, SOURCES } from '../content/canon';
import { CHAPTERS, FINAL, UI, partridgeOpening } from '../content/copy';

/** No-WebGL version: every caption, source line and ledger entry, in order, so the whole myth is still conveyed. */
export default function StaticFallback() {
  return (
    <div className="fallback">
      <main>
        <h1>{UI.title}</h1>
        <p><em>{UI.subtitle}</em></p>
        <p className="mono" style={{ color: 'var(--dim)' }}>{UI.noWebgl}</p>
        {CHAPTERS.map((c) => (
          <section key={c.id} style={{ display: 'grid', gap: 16 }}>
            <h2>{c.id}. {c.name}</h2>
            {c.captions.map((cap, i) => (
              <p key={i} style={cap.latin ? { fontStyle: 'italic' } : undefined}>
                {c.key === 'partridge' && i === 0 ? `${partridgeOpening.fell} / ${partridgeOpening.win}` : cap.t}
                {cap.gloss && <span className="mono" style={{ color: 'var(--dim)' }}> {cap.gloss}</span>}
              </p>
            ))}
            <div className="e">
              <span className="s">{UI.solvedHead}: {c.solved}{c.solvedNote ? ` (${c.solvedNote})` : ''}</span>
              <span className="c">{UI.costHead}: {c.cost}</span>
            </div>
            <p className="mono" style={{ color: 'var(--dim)' }}>{c.source}</p>
          </section>
        ))}
        <section style={{ display: 'grid', gap: 16 }}>
          <h2>Final Balance</h2>
          <div className="mono" style={{ display: 'grid', gap: 6 }}>{FINAL.rows.map(([k, v]) => <div key={k}>{k} .......... {v}</div>)}</div>
          <p><em>{FINAL.body}</em></p>
          <h2>Sources</h2>
          {SOURCES.map((s) => <p key={s.who}><strong>{s.who}</strong>, <em>{s.work}</em>. {s.note}</p>)}
          <p>{BUILT_BY}</p>
        </section>
      </main>
    </div>
  );
}
