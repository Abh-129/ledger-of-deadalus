// All sound is synthesized with Web Audio (no third-party files, no licences). Muted until the visitor opts in.
let ctx: AudioContext | null = null;
let master: GainNode;
let noise: AudioBuffer;
let on = false;
let bed: { stop: () => void } | null = null;
let current = 'none';
let breathGain: GainNode | null = null;
let swellGain: GainNode | null = null;

function ensure() {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noise.getChannelData(0); let l = 0;
    for (let i = 0; i < d.length; i++) { l = (l + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = l * 3.5; }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}
const ok = () => on && ctx;

function noiseSrc(loop = true) { const s = ctx!.createBufferSource(); s.buffer = noise; s.loop = loop; return s; }
function tone(f0: number, dur: number, type: OscillatorType, vol: number, f1 = f0, filt = 4000) {
  if (!ok()) return; const c = ctx!, t = c.currentTime;
  const o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  lp.frequency.value = filt; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(lp).connect(g).connect(master); o.start(t); o.stop(t + dur + 0.05);
}
function burst(dur: number, freq: number, vol: number, type: BiquadFilterType = 'lowpass') {
  if (!ok()) return; const c = ctx!, t = c.currentTime;
  const s = noiseSrc(false), f = c.createBiquadFilter(), g = c.createGain();
  f.type = type; f.frequency.value = freq; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(master); s.start(t, Math.random()); s.stop(t + dur);
}

const BEDS: Record<string, { f: number; type: BiquadFilterType; vol: number; lfo: number; blip?: () => void; every?: [number, number] }> = {
  wind: { f: 500, type: 'bandpass', vol: 0.5, lfo: 0.12 },
  workshop: { f: 400, type: 'lowpass', vol: 0.12, lfo: 0.05, blip: () => burst(0.05, 3200, 0.12, 'bandpass'), every: [500, 1600] },
  drip: { f: 220, type: 'lowpass', vol: 0.18, lfo: 0.08, blip: () => tone(1400, 0.25, 'sine', 0.05, 800), every: [1500, 4500] },
  sea: { f: 800, type: 'lowpass', vol: 0.5, lfo: 0.11 },
  dawn: { f: 1400, type: 'lowpass', vol: 0.08, lfo: 0.05, blip: () => { const f = 2400 + Math.random() * 1400; tone(f, 0.09, 'sine', 0.03, f * 1.25); }, every: [350, 1400] },
};

export function ambient(kind: string) {
  current = kind;
  if (!ok()) return;
  bed?.stop(); bed = null;
  const b = BEDS[kind]; if (!b) return;
  const c = ctx!;
  const s = noiseSrc(), f = c.createBiquadFilter(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
  f.type = b.type; f.frequency.value = b.f; g.gain.value = 0;
  g.gain.setTargetAtTime(b.vol, c.currentTime, 1.2);
  lfo.frequency.value = b.lfo; lg.gain.value = b.vol * 0.5; lfo.connect(lg).connect(g.gain);
  s.connect(f).connect(g).connect(master); s.start(); lfo.start();
  let timer = 0;
  if (b.blip && b.every) { const [a, z] = b.every; const loop = () => { b.blip!(); timer = window.setTimeout(loop, a + Math.random() * (z - a)); }; loop(); }
  bed = { stop: () => { clearTimeout(timer); g.gain.setTargetAtTime(0, c.currentTime, 0.3); setTimeout(() => { s.stop(); lfo.stop(); }, 1200); } };
}

export function setSound(v: boolean) {
  on = v;
  if (v) { ensure(); master.gain.setTargetAtTime(0.8, ctx!.currentTime, 0.05); ambient(current); }
  else if (ctx) { master.gain.setTargetAtTime(0, ctx.currentTime, 0.05); bed?.stop(); bed = null; }
}

const SCALE = [293.66, 329.63, 392, 440, 523.25];
export const sfx = {
  pluck: () => { const f = SCALE[(Math.random() * SCALE.length) | 0]; tone(f, 1.4, 'triangle', 0.22, f * 0.99, 2200); tone(f * 2, 0.6, 'sine', 0.05); },
  bellow: () => tone(95, 2, 'sawtooth', 0.18, 55, 380),
  cry: () => { tone(650, 0.7, 'sine', 0.1, 900); setTimeout(() => tone(140, 1.1, 'sawtooth', 0.16, 70, 500), 600); },
  slam: () => { burst(0.5, 260, 0.5); tone(70, 0.5, 'sine', 0.4, 35); },
  impact: () => { burst(0.9, 180, 0.7); tone(55, 0.9, 'sine', 0.5, 28); },
  wind: () => burst(2.2, 600, 0.35, 'bandpass'),
  fall: () => tone(620, 2.6, 'sine', 0.05, 160, 1400),
  gate: () => { burst(0.35, 900, 0.5, 'bandpass'); tone(80, 0.4, 'square', 0.15, 50, 300); },
  splash: () => burst(0.8, 1200, 0.3),
  breath(level: number) { // 0..1 proximity of the Minotaur
    if (!ok()) return;
    if (!breathGain) {
      const c = ctx!, s = noiseSrc(), f = c.createBiquadFilter(), g = c.createGain(), l = c.createOscillator(), lg = c.createGain();
      f.type = 'lowpass'; f.frequency.value = 500; g.gain.value = 0; l.frequency.value = 0.28; lg.gain.value = 0.5;
      l.connect(lg).connect(g.gain); s.connect(f).connect(g).connect(master); s.start(); l.start(); breathGain = g;
    }
    breathGain.gain.setTargetAtTime(level * 0.35, ctx!.currentTime, 0.3);
  },
  swell(v: boolean) {
    if (!ok()) return;
    if (!swellGain) {
      const c = ctx!; swellGain = c.createGain(); swellGain.gain.value = 0; swellGain.connect(master);
      [220, 277, 330, 440].forEach((f) => { const o = c.createOscillator(); o.frequency.value = f; o.type = 'sine'; o.connect(swellGain!); o.start(); });
    }
    swellGain.gain.setTargetAtTime(v ? 0.05 : 0, ctx!.currentTime, 0.4);
  },
  quiet() { const t = ctx?.currentTime ?? 0; breathGain?.gain.setTargetAtTime(0, t, 0.2); swellGain?.gain.setTargetAtTime(0, t, 0.2); },
};
