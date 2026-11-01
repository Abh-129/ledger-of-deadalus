# PRD: The Labyrinth of Daedalus (v2)

Date: Sun Nov 1 2026
Brief: plan/brief.md. Decisions: plan/decisions.md. Plan: plan/plan.md.

## Problem
v1 conveyed the myth but read as a tech demo: six disconnected scroll scenes and a generic procedural maze. The CAMS 45 instructor grades on a laptop from a public link (or screenshots). The rubric rewards the myth clearly and thoroughly conveyed (60) and a unique interpretation with visible effort (36). v2 must feel like one crafted place, not a set of mini games.

## Interpretation (locked)
The story is the father's ledger: every invention works, every one costs. The Labyrinth is built out of Daedalus's own inventions, and you walk it the way he is trapped in it, inside the consequences of what he built. Perdix and Icarus are the paired falls.

## User and context
- Primary: the instructor, Chrome or Safari on a laptop, mouse and keyboard, one sitting of 5 to 10 minutes, possibly with sound off.
- Secondary: classmates on a phone (must not break; touch is best effort).

## The one flow that must work
Open link, title screen, Begin, walk Ariadne's thread through chambers I to V, climb the tower, fly, land on Icaria for VI, Final Balance. No dead ends: at every step a visible Continue button and a "Follow the thread" auto walk.

## Chambers (order fixed; text only from src/content/copy.ts)
| # | copy key | Chamber | Hero object | Cost that opens the next door |
|---|---|---|---|---|
| I | saw | Athens workshop | fish spine that becomes the saw, then the compass drawing a circle | Perdix |
| II | cow | Cretan palace workshop | the hollow wooden cow on wheels, assembled in four parts (UI.parts) | The Minotaur |
| III | labyrinth | The Minotaur's chamber, reached through the Meander passage | plinth of fourteen clay figures, seven and seven; a horned shadow never seen in full | Fourteen Athenians |
| IV | thread | Ariadne's room | the ball of thread; the whole floor thread behind you lights up ("That was your path.") | Daedalus and Icarus imprisoned |
| V | wings | The tower, open to the sky | the wing frame: feathers laid shortest to longest, wax sealed, Icarus's thumbprint; then Take off | Icarus (written after the flight) |
| VI | partridge | Icaria beach at dawn | the grave; the partridge in the ditch | The account is closed |

Each chamber: one or two large fresco walls, one hero object, its captions in order, its Ledger line (Solved in ochre, Cost in red) written when its last caption is passed.

## Requirements
Functional
- R1 One continuous, hand-laid first-person interior (not procedural). Walk with WASD or arrows, look with the mouse (pointer lock, scoped so overlay buttons always work) or by dragging where lock is unavailable (Safari refusal, iOS), use with E or click. Title is UI.title, "THE LABYRINTH OF DAEDALUS".
- R2 Entering a chamber starts its captions; each hero interaction advances one caption; Continue (button or Enter) advances the same way, so the hero visuals depend only on the caption step.
- R3 Passing the last caption writes the Ledger line and opens the exit door. Wings instead launches the flight; the flight result writes V and lands you on Icaria.
- R4 Ariadne's thread is drawn on the floor from the entrance through every chamber to the tower. "Follow the thread" walks you to the next stop.
- R5 Flight reuses src/experience/games/flight/physics.ts unchanged; its three outcomes stay as in copy.ts.
- R6 Final Balance and the Sources page work as in v1. Play again restarts at the entrance.
- R7 Without WebGL, or with ?static, the static page shows every caption, source and ledger line.

Look
- L1 Fewer, larger, finished moments (decisions.md). Each chamber has one hero moment that a screenshot can carry.
- L2 Warm light belongs to craft only (Daedalus's inventions and the thread). Red light appears only when a cost lands. Stone is cool.
- L3 Ochre means solved and red means cost, in UI, light and fresco paint alike. Frescoes use their own earth palette for everything else.
- L4 Frescoes are procedural canvas paintings in the Minoan manner: flat profile figures, banded borders, no words painted on walls.
- L5 Design direction: picked by Abhinav at Gate 2 from master-designer's three; applied only as token values.

Quality
- Q1 Full run with zero console errors in current Chrome; Safari spot check.
- Q2 60 fps target on a laptop at High; Low quality setting and automatic downgrade kept from v1.
- Q3 Every caption and source line appears as real DOM text. Reduced motion respected. Sound muted by default.

## Non-goals
Procedural maze generation, accounts, backend, analytics, saving progress across reloads, extra myths (Talos the bronze giant, Cocalus, death of Minos), gore, sexual content, light theme, copyrighted assets, quoted modern translations, new dependencies.

## Success metrics
- Abhinav says it "looks really, really nice to play on" at the look gate and at the end.
- A cold run from title to Final Balance takes 5 to 10 minutes using only Continue and Follow the thread.
- npm run build and npm run check pass; zero console errors on the full run.

## Risks
- Look quality of procedural interiors without baked light (test: Saw chamber is built first as the look test, Gate 3).
- Fresco painting quality from canvas code (mitigation: shared Fresco kit with plaster, borders and figure helper, so six lanes do not each invent one).
- Safari WebGL performance (mitigation: mount only the current and neighbouring chambers; Low quality path).
- Deadline unknown; the plan front-loads the demo path so a partial run still ships.
