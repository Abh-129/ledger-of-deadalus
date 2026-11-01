import { CHAPTERS } from '../content/copy';
import { ORDER, useStore } from '../store';

export default function ChapterRail() {
  const { chapter, unlocked, settings, go } = useStore();
  return (
    <nav className="rail" aria-label="Chapters">
      {CHAPTERS.map((c) => {
        const open = settings.unlockAll || unlocked.includes(c.key);
        const cur = chapter === c.key;
        const done = ORDER.indexOf(chapter) > ORDER.indexOf(c.key);
        return (
          <button key={c.id} disabled={!open} className={cur ? 'cur' : ''} aria-current={cur ? 'step' : undefined}
            style={done && !cur ? { color: 'var(--limestone)' } : undefined}
            onClick={(e) => { e.currentTarget.blur(); if (!cur) go(c.key); }} aria-label={`Chapter ${c.id}, ${c.name}${open ? '' : ', locked'}`}>
            {c.id}<span className="tip">{c.name}</span>
          </button>
        );
      })}
    </nav>
  );
}
