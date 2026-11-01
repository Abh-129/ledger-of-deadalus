import { create } from 'zustand';
import { CHAPTERS, ChapterCopy, Roman } from './content/copy';

export type Chapter = 'title' | 'saw' | 'cow' | 'labyrinth' | 'thread' | 'wings' | 'partridge' | 'balance';
export const ORDER: Chapter[] = ['title', 'saw', 'cow', 'labyrinth', 'thread', 'wings', 'partridge', 'balance'];
export type Beat = 'commission' | 'build' | 'entry';
export type Outcome = 'melt' | 'sea' | 'win' | 'skipped';

export interface Settings { sound: boolean; quality: 'high' | 'low'; reducedMotion: boolean; unlockAll: boolean; showControls: boolean; assist: boolean }
export interface MazeResult { seed: number; playerPath: [number, number][]; threadLengthMeters: number; skipped: boolean }
export interface FlightResult { outcome: Outcome; maxAltitude: number; glory: number }

export const chapterCopy = (ch: Chapter): ChapterCopy | undefined => CHAPTERS.find((c) => c.key === ch);
const KEY = 'ledger-of-daedalus.v1';
const defaults: Settings = {
  sound: false, quality: 'high', showControls: true, assist: true, unlockAll: false,
  reducedMotion: typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
};

function load(): { settings: Settings; unlocked: Chapter[]; written: Roman[] } {
  try {
    const o = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { settings: { ...defaults, ...o.settings, sound: false }, unlocked: o.unlocked ?? ['title', 'saw'], written: o.written ?? [] };
  } catch { return { settings: defaults, unlocked: ['title', 'saw'], written: [] }; }
}
const saved = load();
const newSeed = () => (Math.random() * 2 ** 31) | 0;

interface State {
  chapter: Chapter; beat: Beat; step: number; busy: boolean; veil: boolean; diving: boolean;
  unlocked: Chapter[]; written: Roman[]; ledgerOpen: boolean; ledgerFresh: Roman | null; entryAt: number;
  mazeSeed: number; maze: MazeResult | null; flight: FlightResult | null; assembly: number;
  settings: Settings; showSources: boolean; showSettings: boolean;
  go: (c: Chapter) => void; advance: () => void; retreat: () => void; toEntry: () => void;
  setSetting: <K extends keyof Settings>(k: K, v: Settings[K]) => void;
  set: (p: Partial<State>) => void; reset: () => void;
}

export const useStore = create<State>((set, get) => ({
  chapter: 'title', beat: 'commission', step: 0, busy: false, veil: false, diving: false,
  unlocked: saved.unlocked, written: saved.written, ledgerOpen: false, ledgerFresh: null, entryAt: 0,
  mazeSeed: newSeed(), maze: null, flight: null, assembly: 0,
  settings: saved.settings, showSources: false, showSettings: false,
  set: (p) => set(p),
  go: (c) => {
    if (get().busy) return;
    const ms = get().settings.reducedMotion ? 150 : 600;
    set({ busy: true, veil: true });
    setTimeout(() => {
      const u = get().unlocked;
      set({
        chapter: c, beat: 'commission', step: 0, assembly: 0, diving: false, ledgerOpen: false, ledgerFresh: null,
        unlocked: u.includes(c) ? u : [...u, c],
        ...(c === 'labyrinth' ? { mazeSeed: newSeed() } : {}),
      });
      live.reset();
      setTimeout(() => set({ veil: false, busy: false }), 60);
    }, ms);
  },
  advance: () => {
    const s = get(); const cp = chapterCopy(s.chapter);
    if (s.busy || !cp) return;
    if (s.beat === 'commission') {
      if (s.step < cp.captions.length - 1) set({ step: s.step + 1 });
      else if (cp.game) { set({ beat: 'build' }); live.set({ gameState: 'prompt' }); }
      else s.toEntry();
    } else if (s.beat === 'entry') {
      if (Date.now() - s.entryAt < 3600) return;
      const next = ORDER[ORDER.indexOf(s.chapter) + 1];
      set({ ledgerOpen: false, ledgerFresh: null });
      s.go(next);
    }
  },
  retreat: () => { const s = get(); if (s.beat === 'commission' && s.step > 0 && !s.busy) set({ step: s.step - 1 }); },
  toEntry: () => {
    const s = get(); const cp = chapterCopy(s.chapter); if (!cp) return;
    const next = ORDER[ORDER.indexOf(s.chapter) + 1];
    set({
      beat: 'entry', ledgerOpen: true, ledgerFresh: cp.id, entryAt: Date.now(),
      written: s.written.includes(cp.id) ? s.written : [...s.written, cp.id],
      unlocked: s.unlocked.includes(next) ? s.unlocked : [...s.unlocked, next],
    });
    live.set({ gameState: 'idle', msg: '', msgSub: '' });
  },
  setSetting: (k, v) => set((s) => ({ settings: { ...s.settings, [k]: v } })),
  reset: () => { set({ written: [], maze: null, flight: null, unlocked: ['title', 'saw'], ledgerOpen: false, ledgerFresh: null }); get().go('title'); },
}));

useStore.subscribe((s) => {
  try { localStorage.setItem(KEY, JSON.stringify({ settings: s.settings, unlocked: s.unlocked, written: s.written })); } catch { /* storage blocked */ }
});

// Fast-changing game readouts live here so gameplay does not re-render the whole overlay.
interface Live {
  gameState: 'idle' | 'prompt' | 'playing' | 'paused';
  thread: number; wax: number; spray: number; progress: number; glory: number; hot: boolean;
  msg: string; msgSub: string; done: boolean;
}
const liveInit: Live = { gameState: 'idle', thread: 0, wax: 1, spray: 0, progress: 0, glory: 0, hot: false, msg: '', msgSub: '', done: false };
export const useLive = create<Live>(() => liveInit);
export const live = {
  set: (p: Partial<Live>) => useLive.setState(p),
  get: () => useLive.getState(),
  reset: () => useLive.setState(liveInit),
};
