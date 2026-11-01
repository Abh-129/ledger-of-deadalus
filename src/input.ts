export const input = {
  keys: new Set<string>(), pointer: false,
  moveX: 0, moveY: 0, // touch joystick, -1..1 (y>0 = forward)
  lookX: 0, lookY: 0, // accumulated look deltas in px, consumed by the game
};
addEventListener('keydown', (e) => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) && !(e.target instanceof HTMLButtonElement)) e.preventDefault();
  input.keys.add(e.code);
});
addEventListener('keyup', (e) => input.keys.delete(e.code));
addEventListener('blur', () => { input.keys.clear(); input.pointer = false; });
addEventListener('pointerdown', (e) => { if (e.target instanceof HTMLCanvasElement) input.pointer = true; });
addEventListener('pointerup', () => { input.pointer = false; });
export const isTouch = () => matchMedia('(pointer: coarse)').matches;
