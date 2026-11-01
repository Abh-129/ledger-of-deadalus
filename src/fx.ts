// Direct-DOM screen effects so scenes can drive them every frame without React renders.
let lastKey = '';
function el(id: string) { return document.getElementById(id); }
export function black(v: number, color = '#0A121C') {
  const e = el('fx-black'); if (!e) return;
  const k = v.toFixed(3) + color; if (lastKey === k) return; lastKey = k;
  e.style.opacity = String(v); e.style.background = color;
}
export function flash(color: string, ms = 900, peak = 0.85) {
  const e = el('fx-flash'); if (!e) return;
  e.style.background = color;
  e.animate([{ opacity: 0 }, { opacity: peak, offset: 0.25 }, { opacity: 0 }], { duration: ms, easing: 'ease-out' });
}
