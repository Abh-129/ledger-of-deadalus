import { useEffect, useState } from 'react';
import { CHAPTERS, partridgeOpening } from '../content/copy';
import { chapterCopy, useStore } from '../store';

export default function Captions() {
  const { mode, current, step, flight, ledgerFresh } = useStore();
  const [src, setSrc] = useState<string | null>(null);
  // the source line shows for 4 s after a chamber completes
  useEffect(() => {
    if (!ledgerFresh) return setSrc(null);
    setSrc(CHAPTERS.find((c) => c.id === ledgerFresh)!.source);
    const t = setTimeout(() => setSrc(null), 4000);
    return () => clearTimeout(t);
  }, [ledgerFresh]);

  if (mode !== 'walk' || !current) return <div className={'captions' + (src ? '' : ' hidden')} aria-live="polite">{src && <div className="src mono">{src}</div>}</div>;
  const cp = chapterCopy(current);
  const i = Math.min(step, cp.captions.length - 1);
  let cap = cp.captions[i];
  if (cp.key === 'partridge' && i === 0) cap = { t: flight?.outcome === 'win' ? partridgeOpening.win : partridgeOpening.fell };
  return (
    <div className="captions" aria-live="polite">
      <p key={current + i} className={cap.latin ? 'latin' : ''}>
        {cap.latin ? <em lang="la">{cap.t}</em> : cap.t}
        {cap.gloss && <span className="gloss mono">{cap.gloss}</span>}
      </p>
    </div>
  );
}
