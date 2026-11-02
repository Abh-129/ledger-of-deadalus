import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { LOOK } from '../experience/shared/look';
import { useStore } from '../store';

export type Paint = (g: CanvasRenderingContext2D, w: number, h: number) => void; // draws inside the border, plaster already laid

const F = LOOK.fresco;
// deterministic noise so a repaint never shimmers
function rng(seed: number) { return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296); }
const ink = (g: CanvasRenderingContext2D, w: number) => { g.strokeStyle = F.line; g.lineWidth = w; g.lineJoin = 'round'; g.lineCap = 'round'; };

function grain(g: CanvasRenderingContext2D, W: number, H: number, r: () => number) { // fine tiled speckle
  const n = document.createElement('canvas'); n.width = n.height = 256;
  const nc = n.getContext('2d')!, d = nc.createImageData(256, 256);
  for (let i = 0; i < d.data.length; i += 4) { const v = 150 + r() * 105; d.data.set([v, v * 0.96, v * 0.88, 46], i); }
  nc.putImageData(d, 0, 0); g.fillStyle = g.createPattern(n, 'repeat')!; g.fillRect(0, 0, W, H);
}

function plaster(g: CanvasRenderingContext2D, W: number, H: number) {
  const r = rng(7);
  g.fillStyle = F.plaster; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 26; i++) { // low-frequency blotches: damp patches and old lime wash
    const x = r() * W, y = r() * H, rad = (0.15 + r() * 0.3) * Math.max(W, H) * 0.5;
    const b = g.createRadialGradient(x, y, 0, x, y, rad);
    b.addColorStop(0, (i % 2 ? F.earth : F.blue) + '30'); b.addColorStop(1, '#00000000');
    g.fillStyle = b; g.fillRect(x - rad, y - rad, 2 * rad, 2 * rad);
  }
  grain(g, W, H, r);
  g.strokeStyle = F.line + '99'; g.lineWidth = Math.max(1, W / 1200); // hairline cracks
  for (let c = 0; c < 9; c++) {
    let x = r() * W, y = r() * H, a = r() * 6.28; g.beginPath(); g.moveTo(x, y);
    for (let s = 0; s < 14; s++) { a += (r() - 0.5) * 1.1; x += Math.cos(a) * W * 0.012; y += Math.sin(a) * W * 0.012; g.lineTo(x, y); }
    g.stroke();
  }
  g.fillStyle = F.earth + 'aa'; // edge loss: ragged flakes where the plaster has fallen
  for (let i = 0; i < 70; i++) {
    const t = r() * 2 * (W + H), e = t < W ? [t, 0] : t < W + H ? [W, t - W] : t < 2 * W + H ? [t - W - H, H] : [0, t - 2 * W - H];
    g.beginPath(); g.ellipse(e[0], e[1], 3 + r() * W * 0.012, 3 + r() * W * 0.008, r() * 3, 0, 6.28); g.fill();
  }
}

// lapis band on limestone: black rules, a running spiral or a Greek key between them
function border(g: CanvasRenderingContext2D, W: number, H: number, kind: 'meander' | 'spiral', b: number) {
  const o = b * 0.14, bw = b * 0.72, rule = Math.max(3.5, b * 0.07); // black contour 3 to 4 px
  const side = (x0: number, y0: number, x1: number, y1: number) => { // one side of the band, tiles of size bw
    const len = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(len / bw)), u = len / n;
    g.save(); g.translate(x0, y0); g.rotate(Math.atan2(y1 - y0, x1 - x0)); ink(g, rule * 1.5); g.strokeStyle = F.blue;
    for (let i = 0; i < n; i++) {
      const x = i * u, m = bw * 0.14, k = (bw - 2 * m) / 5;
      g.beginPath();
      if (kind === 'meander') { g.moveTo(x + m, bw - m); g.lineTo(x + m, m); g.lineTo(x + u - m, m); g.lineTo(x + u - m, bw - m - k); g.lineTo(x + m + 2 * k, bw - m - k); g.lineTo(x + m + 2 * k, m + 2 * k); g.lineTo(x + m + 3.5 * k, m + 2 * k); }
      else { const cx = x + u / 2, cy = bw / 2; for (let t = 0; t < 14; t += 0.3) { const rr = bw * 0.42 * (1 - t / 15); g.lineTo(cx + Math.cos(t) * rr, cy + Math.sin(t) * rr); } }
      g.stroke();
    }
    g.restore();
  };
  g.save(); g.beginPath(); g.rect(o, o, W - 2 * o, H - 2 * o); g.rect(o + bw, o + bw, W - 2 * (o + bw), H - 2 * (o + bw)); g.clip('evenodd');
  side(o, o, W - o, o); side(W - o, o, W - o, H - o); side(W - o, H - o, o, H - o); side(o, H - o, o, o); // each side rotated so the motif points inward
  g.restore();
  ink(g, rule * 3); g.strokeStyle = F.blue; g.strokeRect(o + rule * 1.5, o + rule * 1.5, W - 2 * o - rule * 3, H - 2 * o - rule * 3); ink(g, rule); g.strokeRect(o, o, W - 2 * o, H - 2 * o); g.strokeRect(o + bw, o + bw, W - 2 * (o + bw), H - 2 * (o + bw));
}

/** The shared meander band: one 2 m x 0.5 m tile, lapis key on limestone between black rules; wrap it horizontally. */
export function friezeTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const g = c.getContext('2d')!; plaster(g, 512, 128);
  for (const y of [8, 120]) { ink(g, 4); g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
  for (const y of [15, 113]) { ink(g, 4); g.strokeStyle = F.blue; g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
  for (let i = 0; i < 4; i++) {
    const x = i * 128; g.beginPath();
    g.moveTo(x + 14, 100); g.lineTo(x + 14, 28); g.lineTo(x + 114, 28); g.lineTo(x + 114, 84); g.lineTo(x + 50, 84); g.lineTo(x + 50, 56); g.lineTo(x + 84, 56);
    ink(g, 12); g.stroke(); ink(g, 6); g.strokeStyle = F.blue; g.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.wrapS = THREE.RepeatWrapping; return t;
}

export function Fresco(p: {
  paint: Paint; size: [number, number]; pos: [number, number, number]; rotY?: number;
  version?: number; border?: 'meander' | 'spiral' | 'none';
}) {
  const { paint, size, pos, rotY = 0, version = 0, border: kind = 'spiral' } = p;
  const quality = useStore((s) => s.settings.quality);
  const maxAniso = useThree((s) => s.gl.capabilities.getMaxAnisotropy());
  const pf = useRef(paint); pf.current = paint;
  const tex = useMemo(() => {
    const s = Math.min(F.pxPerM, (quality === 'low' ? 1024 : 2048) / Math.max(size[0], size[1]));
    const c = document.createElement('canvas'); c.width = Math.round(size[0] * s); c.height = Math.round(size[1] * s);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(4, maxAniso); return t;
  }, [size[0], size[1], quality, maxAniso]);
  useEffect(() => () => tex.dispose(), [tex]);
  useEffect(() => {
    const c = tex.image as HTMLCanvasElement, g = c.getContext('2d')!, W = c.width, H = c.height;
    g.clearRect(0, 0, W, H); plaster(g, W, H);
    const b = kind === 'none' ? 0 : Math.min(W, H) * 0.075;
    if (kind !== "none") border(g, W, H, kind, b);
    const m = b * 0.92; // just inside the inner rule
    g.save(); g.beginPath(); g.rect(m, m, W - 2 * m, H - 2 * m); g.clip(); g.translate(m, m);
    pf.current(g, W - 2 * m, H - 2 * m); g.restore();
    tex.needsUpdate = true;
  }, [tex, version, kind]);
  return (
    <mesh position={pos} rotation-y={rotY}>
      <planeGeometry args={size} />
      <meshLambertMaterial map={tex} />
    </mesh>
  );
}

type Pt = [number, number];
// outlined limb: smooth black stroke under a thinner skin stroke, curving through the joints
const limb = (g: CanvasRenderingContext2D, pts: Pt[], w: number, fill: string, u: number) => {
  g.beginPath(); g.moveTo(pts[0][0] * u, pts[0][1] * u);
  for (let i = 1; i < pts.length - 1; i++) g.quadraticCurveTo(pts[i][0] * u, pts[i][1] * u, (pts[i][0] + pts[i + 1][0]) * u / 2, (pts[i][1] + pts[i + 1][1]) * u / 2);
  g.lineTo(pts[pts.length - 1][0] * u, pts[pts.length - 1][1] * u);
  ink(g, w * u + 1.6 * u); g.stroke(); g.strokeStyle = fill; g.lineWidth = w * u; g.stroke();
};
// joints in units of h/100, feet at y=0, y up is negative; shoulder (0,-79), hip (0,-46)
const ARMS: Record<string, [Pt[], Pt[]]> = {
  stand: [[[0, -79], [3, -62], [6, -46]], [[0, -79], [-3, -62], [-5, -47]]],
  reach: [[[0, -79], [12, -78], [27, -80]], [[0, -79], [-5, -66], [-7, -52]]],
  carry: [[[0, -79], [5, -64], [18, -65]], [[0, -79], [3, -62], [16, -60]]],
  raise: [[[0, -79], [9, -90], [10, -109]], [[0, -79], [-5, -90], [-8, -107]]],
  fall: [[[0, -79], [-12, -88], [-24, -100]], [[0, -79], [-6, -94], [-14, -110]]],
  kneel: [[[0, -79], [8, -66], [20, -62]], [[0, -79], [-2, -64], [10, -56]]],
};
export function figure(g: CanvasRenderingContext2D, o: {
  x: number; y: number; h: number; facing: 1 | -1;
  pose: 'stand' | 'reach' | 'carry' | 'fall' | 'kneel' | 'raise'; fill: string; small?: boolean;
}) {
  const u = o.h / 100, lw = Math.max(1.5, o.h * 0.014);
  g.save(); g.translate(o.x, o.y); g.scale(o.facing, 1);
  if (o.pose === 'kneel') g.translate(0, 12 * u);
  if (o.pose === 'fall') { g.translate(0, -46 * u); g.rotate(-1.15); g.translate(0, 46 * u); }
  const legs: [Pt[], Pt[]] = o.pose === 'kneel'
    ? [[[0, -46], [12, -30], [11, -13]], [[0, -46], [-8, -18], [-24, -13]]]
    : o.pose === 'fall' ? [[[0, -46], [10, -26], [5, -2]], [[0, -46], [-8, -26], [-17, -7]]]
    : [[[0, -46], [3, -24], [3, -1]], [[0, -46], [-2, -24], [-6, -1]]];
  const [a1, a2] = ARMS[o.pose];
  limb(g, legs[1], 7.6, o.fill, u); limb(g, a2, 4.2, o.fill, u); // far limbs first
  limb(g, [[1, -82], [1.5, -87]], 3.4, o.fill, u); // neck
  g.beginPath(); // torso: broad shoulders, narrow waist
  g.moveTo(-5.5 * u, -80 * u); g.quadraticCurveTo(0.5 * u, -84 * u, 6 * u, -80 * u); g.bezierCurveTo(8 * u, -70 * u, 3 * u, -60 * u, 3.5 * u, -54 * u);
  g.lineTo(5 * u, -46 * u); g.lineTo(-5 * u, -46 * u); g.lineTo(-3.5 * u, -54 * u); g.bezierCurveTo(-3 * u, -62 * u, -7 * u, -70 * u, -5.5 * u, -80 * u); g.closePath();
  g.fillStyle = o.fill; g.fill(); ink(g, lw); g.stroke();
  limb(g, legs[0], 7.6, o.fill, u);
  g.beginPath(); g.moveTo(-4.8 * u, -53 * u); g.lineTo(5.6 * u, -53 * u); g.quadraticCurveTo(8 * u, -42 * u, 9.5 * u, -31 * u); g.lineTo(-8 * u, -31 * u); g.quadraticCurveTo(-5 * u, -42 * u, -4.8 * u, -53 * u); g.closePath();
  g.fillStyle = F.blue; g.fill(); ink(g, lw); g.stroke(); // kilt in lapis with a plaster hem
  g.fillStyle = F.plaster; g.fillRect(-7.6 * u, -34 * u, 16.6 * u, 1.8 * u);
  limb(g, a1, 4.2, o.fill, u);
  const hs = o.small ? 1.35 : 1, hx = 1.5 * u, hy = -91 * u; // head: small, long curls streaming back, almond eye
  for (const [dy, c] of [[0, 1], [3, -1], [-3, 1]]) { // three curled locks
    const p: Pt[] = [[-1.5, -94 + dy * 0.3], [-7 - dy * 0.4, -88 + dy], [-9, -78 + dy], [-6 * c - 2, -70 + dy]];
    limb(g, p, 2.2 * hs, F.line, u);
    g.beginPath(); g.arc((-6 * c - 2) * u, (-70 + dy) * u + 1.6 * u, 1.6 * u, 0, 6.28); ink(g, 1.2 * u * hs); g.stroke();
  }
  g.beginPath(); g.ellipse(hx, hy, 3.8 * u * hs, 4.8 * u * hs, 0, 0, 6.28); g.fillStyle = o.fill; g.fill(); ink(g, lw); g.stroke();
  g.beginPath(); g.moveTo(hx + 3.4 * u * hs, hy); g.lineTo(hx + 6 * u * hs, hy + 1.8 * u); g.lineTo(hx + 3.4 * u * hs, hy + 2.6 * u); g.fill(); g.stroke();
  g.beginPath(); g.arc(hx - 0.6 * u * hs, hy - 0.8 * u * hs, 4.2 * u * hs, Math.PI * 1.05, Math.PI * 1.9); ink(g, 3 * u * hs); g.stroke(); // hair cap
  const ex = hx + 1.8 * u * hs, ey = hy - 0.6 * u * hs; // almond eye
  g.beginPath(); g.moveTo(ex - 1.5 * u, ey); g.quadraticCurveTo(ex, ey - 1.7 * u, ex + 1.6 * u, ey - 0.2 * u); g.quadraticCurveTo(ex, ey + 1 * u, ex - 1.5 * u, ey);
  g.fillStyle = F.plaster; g.fill(); ink(g, Math.max(1, lw * 0.6)); g.stroke();
  g.fillStyle = F.line; g.beginPath(); g.arc(ex + 0.3 * u, ey - 0.3 * u, 0.6 * u, 0, 6.28); g.fill();
  g.restore();
}
