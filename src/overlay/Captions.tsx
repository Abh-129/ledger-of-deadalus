import { chapterCopy, useStore } from '../store';
import { partridgeOpening } from '../content/copy';

export default function Captions() {
  const { chapter, beat, step, flight } = useStore();
  const cp = chapterCopy(chapter);
  if (!cp || beat === 'build') return <div className="captions hidden" aria-live="polite" />;
  const i = Math.min(step, cp.captions.length - 1);
  let cap = cp.captions[i];
  if (cp.key === 'partridge' && i === 0) cap = { t: flight?.outcome === 'win' ? partridgeOpening.win : partridgeOpening.fell };
  return (
    <div className="captions" aria-live="polite">
      <p key={chapter + i} className={cap.latin ? 'latin' : ''}>
        {cap.latin ? <em lang="la">{cap.t}</em> : cap.t}
        {cap.gloss && <span className="gloss mono">{cap.gloss}</span>}
      </p>
      {beat === 'entry' && <div className="src mono">{cp.source}</div>}
    </div>
  );
}
