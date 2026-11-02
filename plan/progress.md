# Progress: The Labyrinth of Daedalus v2

Written by the main session after every gate, sprint and build run, so a compacted or new session resumes without redoing work. One line per task, newest state wins. SHAs come from `git rev-parse --short` (first and last commit of the task).

## Tasks
Status is one of: done, done_with_concerns, parked, needs_context, skipped, not started.
- T1: done 7d49144..eebe3d4 (Lane 0: store, copy keys, v1 deletions, check.ts)
- T2: done 8eccd52..446327e (Lane 0: layout, World, doors, thread, registry, stubs)
- T3: done; review FIX findings fixed in L0-FIX c83dd36 (Enter preventDefault, focus label)
- T4: done 446915b..16e4fb6 (Lane 0: Fresco kit, LOOK tokens)
- T5: done_with_concerns 62da298 (Low and room II far wall not measured; figure() refinement moved to T7 by ruling R4)
- T6: built by Abhinav in 887c85d, unreviewed (cloud session wave 1 reviews it) (Lane A: Saw build)
- T7: not started (Lane A: Saw frescoes and light; feeds Gate 3)
- T8: built by Abhinav in 887c85d, unreviewed (cloud session wave 1 reviews it) (Lane B: Cow build)
- T9: not started (Lane B: Cow frescoes and light)
- T10: built by Abhinav in 887c85d, unreviewed (cloud session wave 1 reviews it) (Lane C: Minotaur chamber build)
- T11: done 2093ef1 (review PASS) (Lane E: flight rework)
- T12: not started (Lane C: Minotaur chamber frescoes and light)
- T13: done; review fixes in b23fcaa
- T14: done b23fcaa (map fresco small, 2.2x3 m beside the exit door)
- T15: built by Abhinav in 887c85d, unreviewed (cloud session wave 1 reviews it) (Lane E: Wings build)
- T16: not started (Lane E: Wings frescoes and light)
- T17: built by Abhinav in 887c85d, unreviewed (cloud session wave 1 reviews it) (Lane F: Partridge build)
- T18: not started (Lane F: Partridge fresco and light)
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
