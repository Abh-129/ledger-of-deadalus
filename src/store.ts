import { create } from 'zustand';
import { CHAPTERS, ChapterCopy, ChapterKey, Roman } from './content/copy';

export type Mode = 'title' | 'walk' | 'flight' | 'balance';
export const ORDER: ChapterKey[] = ['saw', 'cow', 'labyrinth', 'thread', 'wings', 'partridge'];

export interface Settings { sound: boolean; quality: 'high' | 'low'; reducedMotion: boolean }
export interface FlightResult { outcome: 'melt' | 'sea' | 'win' | 'skipped'; maxAltitude: number; glory: number }

export const chapterCopy = (k: ChapterKey): ChapterCopy => CHAPTERS.find((c) => c.key === k)!;
const KEY = 'ledger-of-daedalus.v2';
const defaults: Settings = {
  sound: false, quality: 'high',
  reducedMotion: typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
};

function load(): Settings {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}').settings, sound: false }; } catch { return defaults; }
}

// Fast-changing game readouts live here so gameplay does not re-render the whole overlay.
interface Live {
  gameState: 'idle' | 'prompt' | 'playing' | 'paused';
  wax: number; spray: number; progress: number; glory: number; hot: boolean;
  msg: string; msgSub: string; done: boolean;
}
const liveInit: Live = { gameState: 'idle', wax: 1, spray: 0, progress: 0, glory: 0, hot: false, msg: '', msgSub: '', done: false };
export const useLive = create<Live>(() => liveInit);
export const live = {
  set: (p: Partial<Live>) => useLive.setState(p),
  get: () => useLive.getState(),
  reset: () => useLive.setState(liveInit),
};

// ?at=<key> jumps into the run: every earlier chamber is written and its door open. Player.tsx reads AT to spawn at entryOf(AT).
export type At = ChapterKey | 'flight' | 'balance';
const atRaw = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('at') : null;
export const AT: At | null = atRaw === 'flight' || atRaw === 'balance' || ORDER.includes(atRaw as ChapterKey) ? (atRaw as At) : null;
if (AT === 'flight') live.set({ gameState: 'prompt' });
const before: ChapterKey[] = AT === 'balance' ? ORDER : AT === 'flight' ? ORDER.slice(0, 4) : AT ? ORDER.slice(0, ORDER.indexOf(AT)) : [];
const romans = (ks: ChapterKey[]) => ks.map((k) => chapterCopy(k).id);

interface State {
  mode: Mode;
  current: ChapterKey | null;   // chamber whose captions are showing
  step: number;                 // caption index in CHAPTERS[current].captions
  written: Roman[];             // ledger lines written, in order
  doors: ChapterKey[];          // chambers whose exit door is open
  focus: string | null;         // label of the hotspot in view, set by Player
  flight: FlightResult | null;
  ledgerOpen: boolean; ledgerFresh: Roman | null;
  settings: Settings; showSources: boolean; showSettings: boolean;
  begin: () => void; enter: (k: ChapterKey) => void; advance: () => void; retreat: () => void; complete: () => void;
  endFlight: (r: FlightResult) => void; reset: () => void;
  setSetting: <K extends keyof Settings>(k: K, v: Settings[K]) => void;
  set: (p: Partial<State>) => void;
}

const fresh = {
  current: null, step: 0, written: [] as Roman[], doors: [] as ChapterKey[], focus: null, flight: null, ledgerOpen: false, ledgerFresh: null,
};
let balanceTimer: ReturnType<typeof setTimeout> | undefined;

export const useStore = create<State>((set, get) => ({
  ...fresh,
  mode: AT === 'flight' ? 'flight' : AT === 'balance' ? 'balance' : AT ? 'walk' : 'title',
  written: romans(before), doors: before,
  settings: load(), showSources: false, showSettings: false,
  set: (p) => set(p),
  begin: () => { live.reset(); set({ mode: 'walk' }); },
  enter: (k) => {
    const s = get();
    if (s.current === k || s.written.includes(chapterCopy(k).id)) return;
    set({ current: k, step: 0, ledgerOpen: false, ledgerFresh: null });
  },
  advance: () => {
    const s = get();
    if (s.mode !== 'walk' || !s.current) return;
    if (s.step < chapterCopy(s.current).captions.length - 1) set({ step: s.step + 1 });
    else s.complete();
  },
  retreat: () => { const s = get(); if (s.mode === 'walk' && s.current && s.step > 0) set({ step: s.step - 1 }); },
  complete: () => {
    const s = get(); const k = s.current; if (!k) return;
    if (k === 'wings') { live.reset(); live.set({ gameState: 'prompt' }); set({ mode: 'flight', current: null, step: 0 }); return; }
    const id = chapterCopy(k).id;
    set({ written: s.written.includes(id) ? s.written : [...s.written, id], doors: [...s.doors, k], current: null, step: 0, ledgerOpen: true, ledgerFresh: id });
    if (k === 'partridge') balanceTimer = setTimeout(() => set({ mode: 'balance' }), s.settings.reducedMotion ? 1000 : 4000);
  },
  endFlight: (r) => {
    const s = get();
    live.reset();
    set({ mode: 'walk', flight: r, current: 'partridge', step: 0, written: s.written.includes('V') ? s.written : [...s.written, 'V'], ledgerOpen: true, ledgerFresh: 'V' });
  },
  reset: () => { clearTimeout(balanceTimer); live.reset(); set({ ...fresh, mode: 'walk' }); },
  setSetting: (k, v) => set((s) => ({ settings: { ...s.settings, [k]: v } })),
}));

useStore.subscribe((s) => {
  try { localStorage.setItem(KEY, JSON.stringify({ settings: s.settings })); } catch { /* storage blocked */ }
});
