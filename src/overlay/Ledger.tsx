import { useEffect } from 'react';
import { CHAPTERS, UI } from '../content/copy';
import { useStore } from '../store';
import { sfx } from '../audio/sounds';

export function LedgerRows({ fresh }: { fresh: string | null }) {
  const written = useStore((s) => s.written);
  return (
    <div className="ltable" role="table" aria-label="The Ledger">
      <div className="head" />
      <div className="head s" role="columnheader">{UI.solvedHead}</div>
      <div className="head c" role="columnheader">{UI.costHead}</div>
      {CHAPTERS.map((c) => {
        const has = written.includes(c.id);
        const isNew = fresh === c.id;
        return (
          <div key={c.id} style={{ display: 'contents' }} role="row">
            <div className="num">{c.id}</div>
            <div className={'cell s' + (has ? '' : ' empty')} role="cell">
              {has ? (
                <>
                  <span className={isNew ? 'write' : ''} style={isNew ? { animationDelay: '0.3s' } : undefined}>{c.solved}</span>
                  {c.solvedNote && <small>{c.solvedNote}</small>}
                </>
              ) : '—'}
            </div>
            <div className={'cell c' + (has ? '' : ' empty')} role="cell">
              {has ? <span className={isNew ? 'write' : ''} style={isNew ? { animationDelay: '2.3s' } : undefined}>{c.cost}</span> : '—'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Ledger() {
  const { ledgerOpen, ledgerFresh, written } = useStore();
  const toggle = () => useStore.setState((s) => ({ ledgerOpen: !s.ledgerOpen }));

  useEffect(() => {
    if (!ledgerFresh) return;
    const a = setTimeout(sfx.pluck, 300), b = setTimeout(sfx.pluck, 2300);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [ledgerFresh]);

  return (
    <>
      {ledgerOpen && (
        <aside className="ledger" aria-label="The Ledger">
          <h2>The Ledger</h2>
          <LedgerRows fresh={ledgerFresh} />
        </aside>
      )}
      <button className="book" onClick={toggle} aria-expanded={ledgerOpen} aria-label={`Ledger, ${written.length} of 6 entries written. Press L to toggle.`}>
        <span className="glyph" aria-hidden>{'Δ'}</span>
        <span className="ribbon mono">{['0', 'I', 'II', 'III', 'IV', 'V', 'VI'][written.length]} / VI</span>
      </button>
    </>
  );
}
