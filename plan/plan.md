# The Labyrinth of Daedalus v2 Plan

Mode: product
Brief: plan/brief.md
PRD: plan/PRD.md
Base branch: master (v1 also kept on v1-backup)
Build branch: build/daedalus-v2 (each lane works on its own branch or worktree cut from it, named lane-<x>-T<n>)
Test command: `npm run build && npm run check` (check bundles src/check.ts with esbuild and runs it in node)
Run command: `npm run dev`, then open http://localhost:5173/ ; jump to a chamber with `?at=<key>` (saw, cow, labyrinth, thread, wings, partridge, flight, balance); static page with `?static`
Progress: plan/progress.md (task ledger and rulings, written by the main session)
Research: plan/research.md (its 8 recommendations are folded in below, marked [research N])

## Goal
One hand-laid, first-person, walkable Labyrinth in which six fresco chambers tell the Daedalus myth in order, each chamber's cost opening the next door, ending in the flight and the Final Balance, in a 5 to 10 minute run that looks finished.

## Architecture
- One R3F Canvas (Experience.tsx). mode 'walk' renders `<World/>`; mode 'flight' renders the v1 `<Flight/>`; 'title' renders World behind the title overlay; 'balance' keeps World frozen behind FinalBalance.
- World = static layout data (src/world/layout.ts) turned into walls, floor, doors and the floor thread, plus six chamber components mounted at their room origins (only the current chamber and its two neighbours are mounted).
- Player.tsx is the only thing that moves the camera in walk mode: walking, look (drei PointerLockControls with a selector, plus a drag-to-look fallback), collision against layout boxes, hotspot focus, walk along the thread. It calls `store.enter(key)` when you cross into a room.
- All story state is in the zustand store (src/store.ts): which chamber is current, its caption step, written ledger lines, opened doors, mode. Chambers are pure functions of `step` plus at most local sub-step state.
- Captions, Ledger, FinalBalance, Sources, Settings, Prompt are DOM overlays (real text). Stack is unchanged: Vite 5, React 18, three 0.170, @react-three/fiber 8, drei 9, postprocessing 2, zustand 4 (all Proven).
- Nothing is mocked. All geometry and fresco paintings are procedural; all sound is the existing Web Audio synth.

## Global Constraints
- Design direction: TBD at Gate 2. Every colour, light intensity, fog and fresco palette value lives in the `LOOK` object in src/experience/shared/look.tsx and in src/styles/tokens.css. Chamber files never hardcode colours or light values; they reference `LOOK.*` and `COL.*`. Applying the chosen direction (T5) changes values only.
- Colour meaning: ochre (`--ochre`, `COL.ochre`, `LOOK.craft`) = what was solved; red (`--minoan-red`, `COL.red`, `LOOK.cost`) = what it cost. Never used for anything else, in UI, light or fresco paint. Fresco backgrounds, skin, sea and borders use `LOOK.fresco.*` earth tones that are visibly distinct from the two tokens.
- Light meaning: warm light only on craft (Daedalus's inventions, the thread). Red light only from the moment a cost lands. Everything else is cool stone light from `LOOK.stone`.
- Myth text: only what is in src/content/copy.ts. No new myth facts, names, numbers or quotes. No words painted inside frescoes. Theseus kills the Minotaur offscreen; no gore; the Minotaur is never shown in full (shadow and fresco silhouette only).
- Anti overengineering: no new dependencies; no abstraction with a single user; no config systems, plugin registries, event buses or generic state machines; no files beyond those listed per task; delete what v2 no longer uses (list under T1 and T19); prefer the smallest diff; target under 250 lines per chamber file.
- Lane discipline: a task may create or edit only the files in its `files:` line. Lanes A to F never edit Lane 0 files or each other's. If a lane needs a contract change, it stops and posts `@lane-0` on plan/board.md; the main session decides in plan/rulings.md.
- Chambers are authored in local coordinates: origin at the room centre on the floor, -Z points from the entry door toward the exit door, +Y up, metres. The World places and rotates them.
- Every interaction has a skip: the Continue button (and Enter) is always visible while a chamber is current, and does exactly what the hero hotspot does. Chamber visuals for step n must look complete even if the player only pressed Continue.
- Lighting recipe for every chamber [research 1, 2, 5, 6]: hemisphere fill (LOOK.stone) + exactly one warm flickering point light on the craft object (LOOK.craft) + `<fogExp2>` matched to the background colour (LOOK.stone.fog, LOOK.stone.fogDensity); fake ambient occlusion by darkening wall vertex colours near floor and corners (World, T2); no real-time shadows, no shadow maps, no reflections. drei `<SpotLight volumetric>` only in V (daylight shaft) and III (red shaft), depthBuffer off unless the cone visibly clips. drei `<Sparkles>` dust only inside those shafts and over the Saw bench.
- Post stack [research 3]: N8AO at half resolution (`halfRes`) + light Bloom + Vignette (Noise kept as in v1, off with reduced motion); `dpr={[1, 1.5]}` at High, 1 at Low; drei PerformanceMonitor turns N8AO off first on decline, then switches to Low. N8AO is Emerging; it is the first thing cut if the look test fps check fails.
- Performance: 60 fps target at High on a laptop; at most about 250 draw calls in any chamber view; fresco canvases at most 2048 px on the long side (1024 at Low).
- Run length: total thread length 90 to 140 m; walk speed 2.2 m/s (Shift 3.5); about 5 captions per chamber; 45 s flight. Expected run 6 to 8 minutes.
- Copy rules for any new UI string: no em dashes or en dashes, no exclamation marks, sentence case.
- Persistence: settings only (sound, quality, reducedMotion). A reload starts a fresh run.
- Accessibility: every caption, source line, ledger line and prompt is DOM text; focus visible on buttons; reduced motion removes head bob and camera easing; sound starts muted.
- Frescoes are painted by us on CanvasTexture [research 4]: flat fills, black contour, plaster crackle; never Wikimedia images (no real fresco shows these episodes). Assets: none by default. research.md section 2 lists CC0 Poly Haven plasters (Plastered Wall 02, Red Plaster Weathered); at most one plaster and one stone diffuse map at 1k (about 1 to 1.5 MB) may be added only if Gate 3 shows procedural plaster is too flat AND Abhinav approves that exact download (ruling R2); each file gets a CREDITS.md line.

## Off-limits
- package.json dependencies and package-lock.json (no installs).
- The myth text in src/content/copy.ts (CHAPTERS captions, source, solved, cost; partridgeOpening; GAME.outcome, GAME.fisherman/ploughman/shepherd, GAME.islands, GAME.minotaurDead; FINAL). Only Lane 0 edits copy.ts, and only the UI keys listed in T1.
- src/experience/games/flight/physics.ts (tested; unchanged).
- Branches master and v1-backup; no push, merge or deploy without Abhinav's "push" or "go".
- dist/ (build output), node_modules/.
- Any file not in the task's files line.

## Interfaces
These are fixed by Lane 0 (T1 to T4). Lanes A to F build against them blind.

```ts
// src/content/copy.ts (existing types, unchanged)
export type Roman = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';
export type ChapterKey = 'saw' | 'cow' | 'labyrinth' | 'thread' | 'wings' | 'partridge';
// New UI keys added in T1 (UI strings, not myth text):
// UI.use = 'Look closer', UI.useKey = 'E or click', UI.follow = 'Follow the thread',
// UI.controls = 'WASD or arrows to walk. Drag to look. E or click to use.',
// UI.controlsTouch = 'Drag to look. Tap Follow the thread to walk.', UI.takeOff = 'Take off',
// UI.resume = 'Click to resume'; and UI.title changes to 'THE LABYRINTH OF DAEDALUS' (the write-up uses that title)

// src/store.ts
export type Mode = 'title' | 'walk' | 'flight' | 'balance';
export const ORDER: ChapterKey[]; // ['saw','cow','labyrinth','thread','wings','partridge']
export interface Settings { sound: boolean; quality: 'high' | 'low'; reducedMotion: boolean }
export interface FlightResult { outcome: 'melt' | 'sea' | 'win' | 'skipped'; maxAltitude: number; glory: number }
interface State {
  mode: Mode;
  current: ChapterKey | null;   // chamber whose captions are showing
  step: number;                  // caption index in CHAPTERS[current].captions
  written: Roman[];              // ledger lines written, in order
  doors: ChapterKey[];           // chambers whose exit door is open
  focus: string | null;          // label of the hotspot in view, set by Player
  flight: FlightResult | null;
  ledgerOpen: boolean; ledgerFresh: Roman | null;
  settings: Settings; showSources: boolean; showSettings: boolean;
  begin(): void;                 // title -> walk at SPAWN
  enter(k: ChapterKey): void;    // no-op if k is written or already current; else current=k, step=0
  advance(): void;               // step+1, or complete() after the last caption
  retreat(): void;               // step-1, floor 0
  complete(): void;              // wings: mode='flight'. others: write ledger line, open door (doors += current), current=null.
                                 // partridge: also mode='balance' after 4000 ms (1000 with reducedMotion)
  endFlight(r: FlightResult): void; // writes V, flight=r, mode='walk', current='partridge', step=0, player.teleport(BEACH_SPAWN)
  reset(): void;                 // fresh run: everything cleared, mode='walk' at SPAWN
  setSetting<K extends keyof Settings>(k: K, v: Settings[K]): void;
  set(p: Partial<State>): void;
}
export const useStore: UseBoundStore<StoreApi<State>>;
export const chapterCopy: (k: ChapterKey) => ChapterCopy;
export const live: { set(p: Partial<Live>): void; get(): Live; reset(): void }; // flight HUD only:
// interface Live { gameState: 'idle'|'prompt'|'playing'|'paused'; wax: number; spray: number; progress: number; glory: number; hot: boolean; msg: string; msgSub: string; done: boolean }
// ?at=<key> on load: marks every earlier chamber written and its door open, spawns at that room's entry (flight and balance jump to those modes).

// src/world/layout.ts (pure data and maths, no three import, runs in node for check.ts)
export type V2 = [number, number];                 // world x, z in metres
export interface Box { min: V2; max: V2; door?: ChapterKey } // wall or closed door (blocks until doors includes key)
export interface Room {
  key: ChapterKey;
  center: V2; size: V2;        // size in the room's local frame: [width x, depth z]
  height: number;              // ceiling height; wings is open to the sky
  yaw: number;                 // local -Z (entry to exit) in world, radians
  exit: V2 | null;             // world point of the exit door centre (null for partridge)
  outdoor?: boolean;           // partridge beach: no walls, bounded by an invisible radius
}
export const ROOMS: Record<ChapterKey, Room>;
export const THREAD: V2[];     // floor polyline: SPAWN -> each room centre saw..wings, via corridor turns
export const SPAWN: { pos: V2; yaw: number };
export const BEACH_SPAWN: { pos: V2; yaw: number };
export const BOXES: Box[];     // all walls and doors, axis aligned
export const EYE = 1.6, DOOR_W = 1.8, WALL_T = 0.4;
export function roomAt(p: V2): ChapterKey | null;
export function blocked(p: V2, r: number, open: ChapterKey[]): boolean;
export function threadIndexNear(p: V2): number; // nearest THREAD vertex index (auto walk)
export function entryOf(k: ChapterKey): { pos: V2; yaw: number }; // 1 m inside the entry wall, facing local -Z (used by ?at=)

// src/world/player.ts state object, written by Player.tsx every frame, read by anyone, never reactive
export const player: { pos: THREE.Vector3; yaw: number; pitch: number; auto: boolean; teleport(p: V2, yaw: number): void };

// src/world/interact.tsx
export function Hotspot(p: {
  pos: [number, number, number];  // chamber-local position of the thing to look at
  onUse: () => void;              // usually () => useStore.getState().advance()
  enabled?: boolean;              // default true; typically state==='current' && step===n
  label?: string;                 // default UI.use; must be a copy.ts string
  radius?: number;                // metres, default 2.4; focus also needs the target within 30 degrees of view centre
}): JSX.Element;                   // renders an empty object3D (world position read each frame) plus a small ochre glint while enabled

// src/world/Fresco.tsx
export type Paint = (g: CanvasRenderingContext2D, w: number, h: number) => void; // draws inside the border, plaster already laid
export function Fresco(p: {
  paint: Paint; size: [number, number];          // metres, width x height
  pos: [number, number, number]; rotY?: number;  // chamber-local; plane faces +Z before rotY
  version?: number;                              // repaint when this changes (e.g. pass step)
  border?: 'meander' | 'spiral' | 'none';        // default 'spiral'
}): JSX.Element;                                  // lambert plane, canvas texture, sized by LOOK.fresco.pxPerM
export function figure(g: CanvasRenderingContext2D, o: {
  x: number; y: number; h: number;               // canvas px, y = feet
  facing: 1 | -1; pose: 'stand' | 'reach' | 'carry' | 'fall' | 'kneel' | 'raise';
  fill: string; small?: boolean;                 // small = a child
}): void;                                         // flat Minoan profile figure

// src/world/chambers.ts (registry, one lazy import per chamber)
export interface ChamberProps { step: number; state: 'ahead' | 'current' | 'done' }
// step: store.step while current; last caption index when done; -1 when ahead
export const CHAMBERS: Record<ChapterKey, React.LazyExoticComponent<(p: ChamberProps) => JSX.Element>>;
// Each chamber file: `export default function SawChamber({ step, state }: ChamberProps) { ... }`

// src/experience/shared/look.tsx additions (values are placeholders until T5)
export const LOOK: {
  stone: { wall: string; floor: string; ceiling: string; ambient: number; hemiSky: string; hemiGround: string; fog: string; fogDensity: number };
  craft: { color: string; intensity: number; distance: number };   // warm, craft only
  cost: { color: string; intensity: number; distance: number };    // red, cost only
  sky: { day: [string, string, string]; dawn: [string, string, string] }; // SkyDome top, mid, bottom
  fresco: { plaster: string; line: string; blue: string; earth: string; skin: string; skinPale: string; green: string; sea: string; pxPerM: number };
};
```

Existing kit the lanes reuse as is: `Prim`, `COL`, `GLOW`, `RED_GLOW`, `SkyDome` (look.tsx), `Person`, `Partridge`, `Bull` (figures.tsx), `Polyline` (lines.tsx), `Sea` (sea.tsx), `sfx.*` and `ambient()` (sounds.ts), `smooth()` and `useStepT()` (rig.ts). Lanes may read v1 scenes for geometry ideas with `git show v1-backup:src/experience/scenes/SawScene.tsx` (and so on); they never restore those files.

## Claims we will make
Writer and judge read this list. Only built claims are said in the present tense.
- C1 | planned | "You walk one continuous, hand-built Labyrinth in first person, through six chambers in the order of the myth." | proof: check.ts layout asserts (T2) + browser check B-RUN (T19)
- C2 | planned | "Every caption, source and ledger line on screen comes from the two ancient sources, Ovid and Apollodorus, paraphrased." | proof: check.ts copy asserts (T1) + B-RUN DOM check (T19)
- C3 | planned | "Ariadne's thread on the floor leads you from chamber to chamber." | proof: check.ts THREAD passes every room centre in ORDER without crossing a wall (T2)
- C4 | planned | "Each chamber's cost is written into the Ledger, and writing it opens the next door." | proof: check.ts store run (T1) + B-DOOR (T3)
- C5 | planned | "The flight is playable: too low and the spray takes you, too high and the wax melts." | proof: existing check.ts flight asserts (kept in T1) + B-FLIGHT (T11)
- C6 | planned | "Nobody gets stuck: every step has Continue, and Follow the thread walks you to the next stop." | proof: B-RUN with only Continue and F (T19)
- C7 | planned | "All geometry and all fresco paintings are drawn in code; all sound is synthesized in the browser." | proof: public/ contains no model or audio files and no images other than R2 plaster maps; CREDITS.md (T20). If R2 adds textures, say "apart from one public-domain plaster texture".
- C8 | planned | "It runs without 3D too, as a readable page." | proof: B-STATIC (T19)
- C9 | planned | "Runs at 60 fps on a laptop." | proof: B-PERF measured in T19; say it only with the measured number and machine

## Review Focus
1. Pressing Continue repeatedly through a chamber without touching the hero object: the hero visual must still reach its final state and the door must open.
2. Walking backwards into a finished chamber: no captions restart, no ledger line is written twice.
3. Pressing Space or Enter while a button has focus: one advance, not two (v1 guarded this; keep it).
4. Pointer lock: the lock selector is only the canvas and the Begin button, never the whole document, so clicks on Continue, Skip, Follow the thread, Ledger and Settings always work; Esc unlocks and shows Click to resume with Continue still visible; Safari and iOS work with drag look and no lock.
5. Low quality and reduced motion: no postprocessing, no head bob, auto walk still works, frame time stays under 16 ms on the tower.

## Lanes and file ownership
| Lane | Tasks | Owns (may create or edit) | Runs |
|---|---|---|---|
| 0 Foundation | T1, T2, T3, T4, T5 | src/store.ts, src/check.ts, src/content/copy.ts (UI keys only), src/App.tsx, src/experience/Experience.tsx, src/experience/shared/look.tsx, src/experience/shared/rig.ts, src/styles/tokens.css, src/styles/global.css, src/world/*, src/overlay/Overlay.tsx, src/overlay/Captions.tsx, src/overlay/Prompt.tsx, src/overlay/Settings.tsx, src/overlay/Ledger.tsx, src/overlay/FinalBalance.tsx, src/input.ts | first; T2 and T4 in parallel after T1; T5 after Gate 2 |
| A Saw | T6, T7 | src/chambers/SawChamber.tsx, plan/shots/saw-*.png | after T2 to T4; look test |
| B Cow | T8, T9 | src/chambers/CowChamber.tsx, plan/shots/cow-*.png | parallel |
| C Minotaur | T10, T12 | src/chambers/MinotaurChamber.tsx, plan/shots/labyrinth-*.png | parallel |
| D Thread | T13, T14 | src/chambers/ThreadChamber.tsx, plan/shots/thread-*.png | parallel |
| E Wings | T11, T15, T16 | src/chambers/WingsChamber.tsx, src/experience/games/flight/Flight.tsx, src/overlay/Hud.tsx, plan/shots/wings-*.png | parallel |
| F Partridge | T17, T18 | src/chambers/PartridgeChamber.tsx, plan/shots/partridge-*.png | parallel |
| Z Integration | T19, T20 | any file, small fixes only, each named in its report; CREDITS.md, README.md | last |

Gates: Gate 2 = Abhinav picks a design direction (feeds T5). Gate 3 = look test: Abhinav approves the Saw chamber screenshots and fps numbers (post on and off) from T7 before the second task of lanes B to F (T9, T12, T14, T16, T18) starts. The first task of each lane may run during Gate 3.

Named browser checks (run with `npm run dev`; a lane saves screenshots to its own plan/shots/ names; console must show zero errors and zero warnings from our code):
- B-CHAMBER(<key>): open `?at=<key>`, walk in, complete the chamber once with hotspots only and once (reload) with Continue only; both end with the ledger line written and the exit door open; screenshot each step.
- B-DOOR: at `?at=saw`, walk into the closed exit door; you cannot pass; after the last caption it opens and you can.
- B-FLIGHT: `?at=wings`, take off, hold the middle course to Sicily; reload, climb until the wax melts; reload, glide into the sea; each outcome lands on Icaria with the right partridge opening line.
- B-RUN: cold load, Begin, complete the whole run using only Continue and F (Follow the thread); time it (5 to 10 min); every caption and source string from copy.ts was in the DOM at some point (T19 adds a temporary dev-only check, removed before T20).
- B-STATIC: `?static` shows all six chapters, sources, ledger lines and Final Balance text.
- B-PERF: Chrome performance overlay on each chamber and the flight at High; record median fps and the machine.

## Tasks
Each task is one builder session (30 to 90 minutes). Demo path first. 20 tasks.

### T1: Store, copy keys, v1 deletions, check.ts (Lane 0)
depends_on: []
files: src/store.ts, src/check.ts, src/content/copy.ts, src/App.tsx, src/experience/Experience.tsx, src/overlay/Overlay.tsx, src/overlay/Captions.tsx, src/overlay/Settings.tsx, src/overlay/Ledger.tsx, src/overlay/FinalBalance.tsx, src/overlay/Hud.tsx, src/experience/games/flight/Flight.tsx, src/experience/shared/rig.ts, src/styles/global.css; delete src/experience/scenes/ (all 7 files), src/experience/games/labyrinth/ (mazeGen.ts, MazeMesh.tsx), src/overlay/ChapterRail.tsx
interfaces: produces the store API, ORDER, Mode, FlightResult, live, the new UI keys and `?at=`
failing test first: src/check.ts "store run": begin(); for each key in ORDER except wings and partridge, enter(k), call advance() captions.length times, assert written gains that Roman and doors includes k; enter('wings') and advance through, assert mode==='flight'; endFlight({outcome:'win',...}) assert written includes 'V' and current==='partridge'; enter('saw') again is a no-op. Also "copy": every CHAPTERS caption non-empty except partridge[0]; six chapters in ORDER. Flight asserts kept; maze asserts removed.
steps:
1. Rewrite store.ts to the Interfaces section (keep v1's load/save of settings, guarded for node: no top level `location`, `localStorage` or `matchMedia` access outside try or typeof checks).
2. copy.ts: add the seven UI keys and set UI.title to 'THE LABYRINTH OF DAEDALUS'; delete only UI keys v2 no longer uses: UI.scrollHint, UI.back, GAME.labyrinthPrompt, GAME.labyrinthPromptTouch, GAME.threadLabel, GAME.threadUsed, SETTINGS_LABELS.unlockAll, SETTINGS_LABELS.showControls, SETTINGS_LABELS.assist. Keep every myth string (unused ones such as GAME.minotaurDead stay). Only if ruling R1 in progress.md says yes: replace the en dashes in the six `source` citation ranges with hyphens (as CREDITS.md already does) and the em dash empty-cell marker in Ledger.tsx with a middle dot.
3. Delete the v1 files listed above and the maze parts of check.ts; strip useRig and Wp from rig.ts (keep smooth, useStepT); remove ChapterRail, Assemble, wheel scroll and scrollHint from Overlay; key the ambient BED map by `current` (and 'sea' for title, 'wind' for flight, 'dawn' for balance); remove unlockAll, assist, showControls from Settings; remove the labyrinth half of Hud.tsx (keep the flight HUD); Flight.tsx calls `endFlight` instead of setting flight and toEntry; FinalBalance "walk again" calls reset(); Experience.tsx renders nothing but a dark background in walk mode until T2 (temporary, one line); delete .rail CSS.
4. Captions.tsx reads current and step; shows nothing when current is null; shows the source line for 4 s after complete.
done when: `npm run build && npm run check` pass; `grep -r "mazeGen\|LabyrinthScene\|ChapterRail\|toEntry" src` is empty; app loads to the title with zero console errors.
approved installs: none

### T2: Layout, World, walls, doors, thread, chamber registry and stubs (Lane 0)
depends_on: [T1]
files: src/world/layout.ts, src/world/World.tsx, src/world/Thread.tsx, src/world/chambers.ts, src/chambers/SawChamber.tsx, src/chambers/CowChamber.tsx, src/chambers/MinotaurChamber.tsx, src/chambers/ThreadChamber.tsx, src/chambers/WingsChamber.tsx, src/chambers/PartridgeChamber.tsx, src/experience/Experience.tsx, src/check.ts
interfaces: produces layout.ts, ChamberProps, CHAMBERS, the six stub files (each stub: one Fresco-sized limestone plane plus `null` hero; handed to its lane after this task)
failing test first: src/check.ts "layout": rooms are in ORDER; roomAt(center)===key for every room; THREAD[0] equals SPAWN.pos; THREAD passes within 0.5 m of each room centre saw..wings in order; no THREAD segment crosses a Box except door boxes; total THREAD length in [90, 140]; every non-partridge room has an exit inside a door Box; blocked(SPAWN.pos, 0.3, [])===false.
steps:
1. Hand-lay the plan: entrance hall (SPAWN) -> I saw 8x8 m, h 4.5 -> short corridor -> II cow 11x11, h 6 -> the Meander passage (four to six right-angle turns, 2.4 m wide, 30 to 40 m; this is "the Labyrinth" you walk) -> III labyrinth 10x10, h 8 -> IV thread 7x7, h 4 -> V wings 6x6 tower, h 14, open roof. VI partridge is a separate outdoor area 200 m east, radius 18 m. All axis aligned.
2. World.tsx: one box mesh per BOXES entry sharing one stone material (merge only if B-PERF demands it) (stone colours from LOOK.stone), floor and ceilings, a door per room exit that lifts into the ceiling over 1.2 s when doors includes its key (red seam flash from LOOK.cost, sfx.gate), hemisphere plus ambient light from LOOK.stone, fog. Mount CHAMBERS for the current room index and its neighbours inside `<group position={[cx,0,cz]} rotation-y={yaw}>` with Suspense.
3. Thread.tsx: Polyline along THREAD at y 0.02, ochre (LOOK.craft) up to the furthest reached room, dim beyond; when current==='thread' and step>=2, the walked part brightens to GLOW for the rest of the run.
4. Experience.tsx: walk and title modes render World; flight renders Flight; balance renders World. Post stack and dpr per Global Constraints (N8AO halfRes, Bloom, Vignette; PerformanceMonitor disables N8AO before switching to Low).
done when: test command passes; `?at=cow` shows the walls, the stub planes and the thread with zero console errors (camera fixed at the room entry until T3).
approved installs: none

### T3: Player controller, hotspots, prompt, auto walk (Lane 0)
depends_on: [T2]
files: src/world/Player.tsx, src/world/player.ts, src/world/interact.tsx, src/world/World.tsx, src/overlay/Prompt.tsx, src/overlay/Overlay.tsx, src/input.ts, src/styles/global.css
interfaces: produces player, Hotspot, the focus field use, Prompt overlay
failing test first: B-DOOR fails before this task (no movement). Add to check.ts: blocked() is true at a closed door centre and false once its key is in open.
steps:
1. player.ts: the plain state object. Player.tsx [research 7]: drei `<PointerLockControls selector="#begin, #stage canvas">` (never bare document) on fine pointers; on `pointerlockchange` to unlocked, show UI.resume in Prompt; on `pointerlockerror`, touch, or coarse pointer, use drag look instead (pointer events on the canvas; a press shorter than 6 px of movement is a click). WASD and arrows, Shift to run, pitch clamped to plus or minus 60 degrees, circle collision radius 0.3 against `blocked` with axis sliding, gentle head bob unless reducedMotion, calls enter(roomAt(pos)) on change.
2. interact.tsx: Hotspot registers in a module-level Set; Player picks the nearest enabled one within radius and 30 degrees of view centre each frame, writes store.focus only when it changes; E, Enter or click (centre of screen while locked) calls onUse once. In drag-look mode, clicking a hotspot that is out of range walks you along the thread to it (click-to-walk), then focuses it.
3. Auto walk: F key or the Follow the thread button walks along THREAD from threadIndexNear to the current chamber's centre, or to its exit once its door is open; stops at a closed door or on any move key.
4. Prompt.tsx: shows focus label and UI.useKey; UI.controls (UI.controlsTouch on coarse pointers) for the first 20 s of walking; the Follow the thread button; Continue button whenever current is set (Overlay's Continue moves here; Enter advances unless a button has focus).
done when: test command passes; B-DOOR passes on the stubs; walking all rooms by keyboard and by F works, both with pointer lock and with `?nolock` forcing drag look (one line in Player, kept for Safari testing); clicking Continue while locked works; zero console errors.
approved installs: none

### T4: Fresco kit and LOOK tokens (Lane 0)
depends_on: [T1]
files: src/world/Fresco.tsx, src/experience/shared/look.tsx, src/styles/tokens.css
interfaces: produces Fresco, Paint, figure, LOOK
failing test first: none in node (canvas needs a browser); the check is the screenshot in step 4.
steps:
1. LOOK in look.tsx with placeholder values from v1 COL (stone cool and dim, craft = COL.ochre, cost = COL.red, fresco earth palette distinct from both tokens).
2. Fresco.tsx: canvas at size x LOOK.fresco.pxPerM (cap 2048, 1024 at Low); lays plaster (base colour, low-frequency blotches, a few hairline cracks, slight edge loss), paints the border band, calls paint inside, CanvasTexture with sRGB colour space and anisotropy 4, meshLambertMaterial; repaints only when version changes; disposes the texture on unmount.
3. figure(): one flat profile figure in the Minoan manner (narrow waist, long hair, kilt or robe, arm poses for the six poses), about 40 lines.
4. Verify by temporarily mounting one Fresco with three figure() calls in the saw stub, screenshot to plan/shots/fresco-sample.png, then revert the stub before committing (the stub belongs to Lane A).
done when: `npm run build` passes; plan/shots/fresco-sample.png shows plaster, border and three figures in different poses legibly at 1280x720.
approved installs: none

### T5: Apply the chosen design direction (Lane 0)
depends_on: [T4, Gate 2]
files: src/experience/shared/look.tsx (LOOK and COL values only), src/styles/tokens.css, src/styles/global.css (overlay type and colour only), src/world/Fresco.tsx (plaster and border parameters only)
interfaces: consumes the direction master-designer delivered and Abhinav picked; produces final token values
failing test first: none; check is the before and after screenshots.
steps:
1. Map the direction's palette, light temperatures, fog, fonts already in the stack and overlay styling onto LOOK and tokens. Ochre and red keep their meanings; if the direction shifts their hue, both CSS and COL change together.
2. Screenshot `?at=saw` and `?at=labyrinth` before and after to plan/shots/t5-*.png.
done when: build passes; screenshots posted on the board for Gate 3 context; no chamber file changed.
approved installs: none

### T6: Chamber I Saw, build (Lane A, look test part 1)
depends_on: [T2, T3, T4]
files: src/chambers/SawChamber.tsx, plan/shots/saw-*.png
interfaces: consumes ChamberProps, Hotspot, Fresco, figure, LOOK, Prim, Partridge, sfx
failing test first: B-CHAMBER(saw) fails on the stub (no hero, no hotspots).
steps:
1. Room dressing: Athens workshop. Workbench with tools at the room centre, one hanging lamp over it (the only warm light, LOOK.craft), cool stone elsewhere.
2. Hero object by step. 0: a fish spine lies on the bench (hotspot). 1: the spine's ribs become iron teeth, a saw (morph over 1.2 s, sfx.pluck). 2: two iron arms join and sweep a glowing ochre circle on the bench. 3: the lamp drops to a glow; red light (LOOK.cost) rises from the citadel fresco; sfx.slam. 4: a Partridge runs low across the floor toward the exit and stays on the ground.
3. Hotspots: one per step 0 to 3 on the bench, step 4 on the partridge; each `enabled={state==='current' && step===n}`, onUse = advance.
done when: build passes; B-CHAMBER(saw) passes both ways; screenshots saw-0.png to saw-4.png.
approved installs: none

### T7: Chamber I Saw, frescoes and light (Lane A, look test part 2, feeds Gate 3)
depends_on: [T6, T5]
files: src/chambers/SawChamber.tsx, plan/shots/saw-*.png
failing test first: Gate 3 screenshots do not exist yet.
steps:
1. Left wall fresco "the pupil": Daedalus and a smaller boy at a bench, the boy holding a fish spine (the spine in ochre once step >= 1).
2. Right wall fresco "the citadel": the rock of Athena's citadel with a temple; at step >= 3 a small falling figure painted in red appears beside it (version = step).
3. Exit wall fresco, above the door: a partridge low over a grass band, revealed at step 4.
4. Tune light falloff so the frescoes read at 1280x720 and the bench lamp (the one flickering warm point light) is the brightest thing until step 3; Sparkles dust over the bench.
5. Look-test fps check [research]: in Chrome at High, record median fps in the Saw chamber with post on and with post off (Settings quality Low), on the target laptop.
done when: build passes; saw-hero.png (the moment of step 2, compass circle and the pupil fresco in frame) and saw-cost.png (step 3) at 1280x720; both fps numbers posted on the board with `@main Gate 3 look test ready`. If post-on fps is under 55, Gate 3 also decides whether N8AO stays.
approved installs: none

### T8: Chamber II Cow, build (Lane B)
depends_on: [T2, T3, T4]
files: src/chambers/CowChamber.tsx, plan/shots/cow-*.png
failing test first: B-CHAMBER(cow) fails on the stub.
steps:
1. Room: Cretan palace workshop, tall, a raised platform at the far end. Warm light only on the cow's build area.
2. Hero by step. 0: a Bull (figures.tsx, LOOK.fresco palette pale) stands in a side pen, lit cool. 1: pale robed figure at the bench (Person). 2: the hollow wooden cow assembles on wheels in four parts, FRAME, PANELS, WHEELS, HIDE (UI.parts as the four hotspot labels; local sub-step state; any step > 2 forces fully built). 3: the cow rolls on its wheels behind a curtain or into an alcove, warm light at its peak, then the alcove dims. 4: red light from the exit wall; sfx.bellow.
3. Step 2's caption advances only after the fourth part, or on Continue.
done when: build passes; B-CHAMBER(cow) both ways; cow-0..4.png.
approved installs: none

### T9: Chamber II Cow, frescoes and light (Lane B)
depends_on: [T8, T5, Gate 3]
files: src/chambers/CowChamber.tsx, plan/shots/cow-*.png
steps:
1. Long wall fresco: a white bull rising from a blue sea band, a crowned figure (Minos) leading it away from an altar (steps 0 onward).
2. Opposite wall: the queen in profile (step >= 1).
3. Exit wall: at step 4, a horned silhouette in red, the Minotaur as fresco only.
done when: build passes; cow-hero.png (the cow assembled under warm light with the bull fresco in frame); Gate 3 look matched.
approved installs: none

### T10: Chamber III Minotaur's chamber, build (Lane C)
depends_on: [T2, T3, T4]
files: src/chambers/MinotaurChamber.tsx, plan/shots/labyrinth-*.png
failing test first: B-CHAMBER(labyrinth) fails on the stub.
steps:
1. Room: tall, empty, no warm light at all (the one chamber without the warm point light). Red light (LOOK.cost) only: one drei SpotLight volumetric red shaft from high on one side, plus the hemisphere fill. Bones, blood and the monster itself are never shown.
2. A horned shadow (a flat dark silhouette quad) slides slowly across the far wall at steps 0 to 2 with sfx.breath rising; it is gone at step 3.
3. Hero: a stone plinth with fourteen small clay figures, seven and seven. 2: on use they light red one by one over 2 s. 3: a ball of thread lies at the chamber centre in ochre (Theseus has come); the shadow stops.
done when: build passes; B-CHAMBER(labyrinth) both ways; labyrinth-0..3.png.
approved installs: none

### T11: Flight rework for v2 (Lane E)
depends_on: [T1]
files: src/experience/games/flight/Flight.tsx, src/overlay/Hud.tsx
interfaces: consumes live, endFlight, physics.ts (unchanged)
failing test first: B-FLIGHT fails (T1 only made it compile).
steps:
1. Start from the tower: first second of the flight rises out of the open tower roof, then the v1 flight. Keep GAME strings, islands, outcomes.
2. When the outcome message is done, Continue calls endFlight(result); skip in Hud still works and yields 'skipped'.
3. Hud.tsx is flight only; remove anything labyrinth.
done when: build and check pass; B-FLIGHT passes all three outcomes plus skip.
approved installs: none

### T12: Chamber III, frescoes and light (Lane C)
depends_on: [T10, T5, Gate 3]
files: src/chambers/MinotaurChamber.tsx, plan/shots/labyrinth-*.png
steps:
1. All four walls carry one continuous meander key band, floor to ceiling in parts, in LOOK.fresco.line on plaster (step 0 and 1: the prison like the river Meander).
2. Side wall: a procession of fourteen figures, seven and seven, painted in red at step >= 2.
3. Exit wall: a figure holding a ball of thread, the thread in ochre, at step >= 3.
done when: build passes; labyrinth-hero.png (red light, the meander walls, the horned shadow) matches the Gate 3 look.
approved installs: none

### T13: Chamber IV Thread, build (Lane D)
depends_on: [T2, T3, T4]
files: src/chambers/ThreadChamber.tsx, plan/shots/thread-*.png
failing test first: B-CHAMBER(thread) fails on the stub.
steps:
1. Room: small and quiet, a stool with a ball of thread under a soft warm light (the thread is craft).
2. By step. 0: ball on the stool (hotspot). 1: the ball unwinds toward the entry door and the thread end ties to the door post. 2: "That was your path": World's Thread brightens (T2 handles it); the chamber adds a slow ochre pulse travelling back along the door thread. 3: cool light turns red. 4: the entry door slams with sfx.slam (a chamber-local panel drops over the entry; it does not touch World doors); the exit to the tower opens on complete.
done when: build passes; B-CHAMBER(thread) both ways; thread-0..4.png.
approved installs: none

### T14: Chamber IV, frescoes and light (Lane D)
depends_on: [T13, T5, Gate 3]
files: src/chambers/ThreadChamber.tsx, plan/shots/thread-*.png
steps:
1. Wall fresco: a young woman and an older craftsman in profile, a ball of thread passing between their hands.
2. Large fresco: a plan of the Labyrinth drawn from layout.ts (ROOMS rectangles and the THREAD polyline mapped to the canvas), the thread line in ochre, revealed at step >= 2; this is the real map you walked.
3. At step >= 3 a crowned figure (Minos) in red on the exit side.
done when: build passes; thread-hero.png (step 2: the map fresco and the glowing floor thread in one frame).
approved installs: none

### T15: Chamber V Wings, build (Lane E)
depends_on: [T2, T3, T4, T11]
files: src/chambers/WingsChamber.tsx, plan/shots/wings-*.png
failing test first: B-CHAMBER(wings) fails on the stub (it must end in mode flight, not an open door).
steps:
1. Tower room, 14 m tall, open to a SkyDome day sky (LOOK.sky.day); one drei SpotLight volumetric daylight shaft from above with Sparkles dust inside it; warm light only on the wax and the wings.
2. Hero by step. 0: a long table under the open roof, a few gulls high above. 1: feathers lay out on the table shortest to longest (staggered animation), tied and sealed; the wax glows ochre. 2: a small Person (Icarus) at the table end presses a thumb into the wax; the glow dips at that spot. 3: three horizontal light bands in the tower shaft: cool blue spray low, white heat high, ochre middle. 4: hotspot labelled UI.takeOff; its use calls advance, which sets mode flight.
done when: build passes; B-CHAMBER(wings) both ways ends in the flight; wings-0..4.png.
approved installs: none

### T16: Chamber V, frescoes and light (Lane E)
depends_on: [T15, T5, Gate 3]
files: src/chambers/WingsChamber.tsx, plan/shots/wings-*.png
steps:
1. Fresco ring around the lower tower: ships on a blue sea and a crowned figure on the shore (step 0, Minos rules land and sea), birds in a band above.
2. Fresco: a father and a small son with feathers, the son's hand on the wax (step >= 2).
3. Fresco above: sun, sea and a path between them, the path in ochre (step >= 3).
done when: build passes; wings-hero.png (step 1: feathers on the table, the sky above, frescoes in frame).
approved installs: none

### T17: Chamber VI Partridge, build (Lane F)
depends_on: [T2, T3, T4]
files: src/chambers/PartridgeChamber.tsx, plan/shots/partridge-*.png
failing test first: B-CHAMBER(partridge) fails on the stub (it must end in mode balance).
steps:
1. Outdoor beach at dawn: Sea (sea.tsx), SkyDome dawn (LOOK.sky.dawn), sand, a ditch with grass, no walls.
2. By step. 0: feathers float on the waves (the opening line comes from Captions using flight.outcome). 1: a grave mound with a hotspot; on use, stones settle on it. 2: Daedalus's tools (a saw and a compass on the sand, Prim) lose their warm glow. 3: in the ditch, a Partridge beats its wings (wing flutter, it never rises). 4: the partridge stays low as the light comes up.
done when: build passes; B-CHAMBER(partridge) both ways ends in Final Balance; partridge-0..4.png.
approved installs: none

### T18: Chamber VI, fresco and light (Lane F)
depends_on: [T17, T5, Gate 3]
files: src/chambers/PartridgeChamber.tsx, plan/shots/partridge-*.png
steps:
1. A single standing painted slab by the grave (the only fresco outdoors): a father carrying a son's body (pose carry), revealed at step >= 1; at step >= 2 the same father with arms raised (pose raise).
2. Dawn light tuned so the slab reads from the spawn point.
done when: build passes; partridge-hero.png (step 3: partridge in the ditch, grave and slab in frame).
approved installs: none

### T19: Integration, full run, perf, fallback, leftovers (Lane Z)
depends_on: [T3, T7, T9, T11, T12, T14, T16, T18]
files: any, small fixes only, each named in the report
failing test first: B-RUN, B-STATIC and B-PERF as defined above.
steps:
1. B-RUN cold; fix seams (thread brightness steps, door timing, captions overlap with Prompt, ambient bed per room via Overlay's BED map keyed by current).
2. B-PERF; if a chamber is under 50 fps at High, cut draw calls in that chamber first (merge Prims), then lower fresco size.
3. B-STATIC; StaticFallback still lists every chapter.
4. Delete anything unused: run `npx tsc --noEmit` plus a grep for each export in src/ with no importer; remove dead CSS classes; remove the temporary B-RUN DOM check.
done when: test command passes; B-RUN within 5 to 10 min with zero console errors; B-PERF numbers recorded on the board; B-STATIC passes.
approved installs: none

### T20: Release build, credits, claims (Lane Z)
depends_on: [T19]
files: CREDITS.md, README.md, plan/plan.md (Claims states only)
steps:
1. `npm run build`; `npm run preview`; B-RUN once more on the preview build in Chrome and a Safari spot check if available.
2. CREDITS.md and README.md updated to v2 (how to play, sources, tech credits); confirm public/ has no third-party files except any approved under R2. Hosting [research 8]: vite.config.ts keeps the default base '/', which suits Netlify or Vercel from Git; GitHub Pages would need base '/<repo>/' (Abhinav picks the host; nothing is deployed in this plan).
3. Move each claim C1 to C9 to built only if its proof passed; C9 only with the measured number.
done when: dist/ builds; claims states updated; nothing deployed (deploy waits for Abhinav's "go").
approved installs: none
