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

// after the art: paint has lost a little pigment, and the same grain sits over everything
function weather(g: CanvasRenderingContext2D, W: number, H: number) {
  const r = rng(31);
  g.fillStyle = F.plaster + '8c';
  for (let i = 0; i < 160; i++) { g.beginPath(); g.ellipse(r() * W, r() * H, 1 + r() * W * 0.006, 1 + r() * W * 0.004, r() * 3, 0, 6.28); g.fill(); }
  grain(g, W, H, r);
}

function plaster(g: CanvasRenderingContext2D, W: number, H: number) {
  const r = rng(7);
  g.fillStyle = F.plaster; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 26; i++) { // low-frequency blotches: damp patches and old lime wash
    const x = r() * W, y = r() * H, rad = (0.15 + r() * 0.3) * Math.max(W, H) * 0.5;
    const b = g.createRadialGradient(x, y, 0, x, y, rad);
    b.addColorStop(0, (i % 2 ? F.earth : F.blue) + '30'); b.addColorStop(1, '#00000000');
    g.fillStyle = b; g.fillRect(0, 0, W, H);
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
  const o = b * 0.14, bw = b * 0.72, rule = Math.max(2, b * 0.06);
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
    const m = b ? b * 0.86 + b * 0.06 : 0; // just inside the inner rule
    g.save(); g.beginPath(); g.rect(m, m, W - 2 * m, H - 2 * m); g.clip(); g.translate(m, m);
    pf.current(g, W - 2 * m, H - 2 * m); g.restore(); weather(g, W, H);
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
// outlined limb: black stroke under a thinner skin stroke
const limb = (g: CanvasRenderingContext2D, pts: Pt[], w: number, fill: string, u: number) => {
  g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x * u, y * u) : g.moveTo(x * u, y * u)));
  ink(g, w * u + 2.2 * u); g.stroke(); g.strokeStyle = fill; g.lineWidth = w * u; g.stroke();
};
// joints in units of h/100, feet at y=0, y up is negative; shoulder (0,-70), hip (0,-38)
const ARMS: Record<string, [Pt[], Pt[]]> = {
  stand: [[[0, -70], [3, -56], [8, -44]], [[0, -70], [-4, -56], [-6, -44]]],
  reach: [[[0, -70], [12, -70], [26, -72]], [[0, -70], [-6, -60], [-8, -48]]],
  carry: [[[0, -70], [5, -56], [17, -58]], [[0, -70], [2, -54], [15, -54]]],
  raise: [[[0, -70], [9, -82], [10, -100]], [[0, -70], [-5, -82], [-8, -98]]],
  fall: [[[0, -70], [-12, -80], [-24, -92]], [[0, -70], [-6, -86], [-14, -102]]],
  kneel: [[[0, -66], [8, -54], [20, -50]], [[0, -66], [-2, -52], [10, -44]]],
};
export function figure(g: CanvasRenderingContext2D, o: {
  x: number; y: number; h: number; facing: 1 | -1;
  pose: 'stand' | 'reach' | 'carry' | 'fall' | 'kneel' | 'raise'; fill: string; small?: boolean;
}) {
  const u = o.h / 100, lw = Math.max(2, o.h * 0.022);
  g.save(); g.translate(o.x, o.y); g.scale(o.facing, 1);
  if (o.pose === 'fall') { g.translate(0, -38 * u); g.rotate(-1.15); g.translate(0, 38 * u); }
  const legs: [Pt[], Pt[]] = o.pose === 'kneel'
    ? [[[0, -38], [11, -20], [12, -1]], [[0, -38], [-8, -5], [-24, -2]]]
    : o.pose === 'fall' ? [[[0, -38], [10, -20], [4, -2]], [[0, -38], [-8, -20], [-16, -6]]]
    : [[[0, -38], [3, -20], [4, -1]], [[0, -38], [-3, -20], [-7, -1]]];
  const [a1, a2] = ARMS[o.pose];
  limb(g, legs[1], 8, o.fill, u); limb(g, a2, 5.5, o.fill, u); // far limbs first
  g.beginPath(); // torso: broad chest, wasp waist
  g.moveTo(-6 * u, -72 * u); g.bezierCurveTo(8 * u, -78 * u, 12 * u, -66 * u, 6 * u, -52 * u);
  g.lineTo(5 * u, -49 * u); g.lineTo(-5 * u, -49 * u); g.lineTo(-6 * u, -62 * u); g.closePath();
  g.fillStyle = o.fill; g.fill(); ink(g, lw); g.stroke();
  limb(g, legs[0], 8, o.fill, u);
  g.beginPath(); g.moveTo(-6 * u, -50 * u); g.lineTo(7 * u, -50 * u); g.quadraticCurveTo(9 * u, -40 * u, 12 * u, -27 * u); g.lineTo(-10 * u, -27 * u); g.quadraticCurveTo(-6 * u, -40 * u, -6 * u, -50 * u); g.closePath();
  g.fillStyle = F.blue; g.fill(); ink(g, lw); g.stroke(); // kilt in lapis with a plaster hem
  g.fillStyle = F.plaster; g.fillRect(-9.5 * u, -31 * u, 21 * u, 2.2 * u);
  limb(g, a1, 5.5, o.fill, u);
  const hs = o.small ? 1.35 : 1, hx = 3 * u, hy = -80 * u; // head: long hair streaming back, nose, eye
  limb(g, [[-1, -80], [-8, -76], [-12, -64]], 4.5 * hs, F.line, u);
  g.beginPath(); g.ellipse(hx, hy, 5.2 * u * hs, 6.6 * u * hs, 0, 0, 6.28); g.fillStyle = o.fill; g.fill(); ink(g, lw); g.stroke();
  g.beginPath(); g.moveTo(hx + 4 * u * hs, hy); g.lineTo(hx + 8 * u * hs, hy + 2.5 * u); g.lineTo(hx + 4 * u * hs, hy + 3.5 * u); g.fill(); g.stroke();
  g.beginPath(); g.arc(hx - 1 * u * hs, hy - 1 * u * hs, 6 * u * hs, Math.PI * 1.05, Math.PI * 1.85); g.lineWidth = 4.5 * u * hs; g.strokeStyle = F.line; g.stroke(); // hair cap
  g.fillStyle = F.line; g.beginPath(); g.arc(hx + 2.2 * u * hs, hy - 1.2 * u, 0.9 * u, 0, 6.28); g.fill();
  g.restore();
}
