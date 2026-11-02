# Progress: The Labyrinth of Daedalus v2

Written by the main session after every gate, sprint and build run, so a compacted or new session resumes without redoing work. One line per task, newest state wins. SHAs come from `git rev-parse --short` (first and last commit of the task).

## Tasks
Status is one of: done, done_with_concerns, parked, needs_context, skipped, not started.
- T1: done 7d49144..eebe3d4 (Lane 0: store, copy keys, v1 deletions, check.ts)
- T2: done 8eccd52..446327e (Lane 0: layout, World, doors, thread, registry, stubs)
- T3: done; review FIX findings fixed in L0-FIX c83dd36 (Enter preventDefault, focus label)
- T4: done 446915b..16e4fb6 (Lane 0: Fresco kit, LOOK tokens)
- T5: done_with_concerns 62da298 (Low and room II far wall not measured; figure() refinement moved to T7 by ruling R4)
- T6: done; review fixes in 4bfeb32
- T7: done_with_concerns 4bfeb32 (fps not measurable headless; plaster grey-blue under moon)
- T8: done; review fixes in dd610ba
- T9: done dd610ba..74d847c (bull fresco redone twice; reads as a horned spotted bull)
- T10: done; review fixes in 81f1eac
- T11: done 2093ef1 (review PASS) (Lane E: flight rework)
- T12: done 81f1eac..3712eac (red shaft faint, LOOK.cost.shaft intensity for T19)
- T13: done; review fixes in b23fcaa
- T14: done b23fcaa (map fresco small, 2.2x3 m beside the exit door)
- T15: done; review fixes in 2ad5aa5
- T16: done 2ad5aa5 (sun-path fresco high; check on a real GPU in T19)
- T17: done; review fixes in fa01d57
- T18: done_with_concerns fa01d57 (sun x2 and Sea fog hardcoded; caption contrast on pale sand -> T19)
- T19: not started (Lane Z: integration, full run, perf, fallback, leftovers)
- T20: not started (Lane Z: release build, credits, claims)

## Rulings
Every decision made during the build that the plan did not settle, by Abhinav or by the main session. Mark who decided.
- Ruling R1 (open, needs Abhinav): replace the en dashes in the six copy.ts `source` citation ranges (for example the range in "Metamorphoses 8.236 to 259") with hyphens, as CREDITS.md already does, and the em dash empty-cell marker in Ledger.tsx with a middle dot | standing no-dash rule vs. "keep copy.ts text" | if wrong: citations look slightly different; no myth text changes
- Ruling R2 (open, needs Abhinav at Gate 3): allow one CC0 Poly Haven plaster and one stone diffuse map at 1k (research.md section 2) only if procedural plaster looks flat | download needs explicit approval | if wrong: about 1.5 MB more load and a CREDITS line
- Ruling R3: UI.title becomes "THE LABYRINTH OF DAEDALUS" to match the write-up (by main session, Sun Nov 1 2026)

## Gates
- gate1: "yes to all" (Sun Nov 1 17:51:35 EST 2026)
- gate2 (design direction): "Yes, approve C" (Sun Nov 1 18:17 EST 2026)
- gate3: "I give you permission to build." (Sun Nov 1 18:23 EST 2026); Mon Nov 2: Abhinav said "Go ahead with the work that was written on the plan", so the look test shots go to him for sign off but do not block lanes B to F
- Ruling R4 (main, Nov 2): Lane 0 is idle, so the T7 builder may also edit figure() in src/world/Fresco.tsx (proportions only: taller Minoan figure, curved limbs, almond eye, curls, thinner outline, per the 18:47 board note) before the other fresco lanes start.
