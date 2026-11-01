# Audit: senior review of plan/plan.md (G5)

Date: Sun Nov 1 2026, 18:13 to 18:30 EST. Reviewer: master-planner (senior review).
Read: decisions.md, brief.md, PRD.md, plan.md, research.md, board.md, progress.md, writeup/writeup.md; grepped src/audio/sounds.ts, src/content/copy.ts, src/overlay/*, src/experience/Experience.tsx, src/experience/shared/*, index.html. Nothing in src/ was edited.

## Verdict
Ship with changes. The plan is sound: one place, demo path first, a real look gate before six chambers, disjoint lane files, canon locked to copy.ts. It had two lane collisions, one missing sound that would force a chamber lane into an unowned file, four small overbuilt pieces, and three missing pieces (title framing, index.html title, write-up and screenshot hand off). All are fixed in plan.md below except the items under "Needs Abhinav".

## Top 5 risks (most severe first)

1. **Lane collision and dependency gap in Lane 0 (T2, T4, T5).** VERIFIED in plan.md: T2 and T4 were "in parallel after T1", but T2's World consumes `LOOK.stone` which T4 produced, and T4 step 4 mounted a sample in `src/chambers/SawChamber.tsx`, a stub T2 creates. T5 (global.css) could also run beside T3 (global.css). Likelihood high if run as written; impact: merge conflicts or a builder editing a file it does not own.
   Fix (applied): LOOK placeholders move into T1 (look.tsx added to T1 files); T4 depends on T2 and may touch the Saw stub only temporarily; T3 and T4 run in parallel (disjoint files); T5 depends on T3, T4 and Gate 2.

2. **Interfaces gap: `sfx.breath` does not exist.** VERIFIED: sounds.ts exports pluck, bellow, cry, slam, impact, wind, fall, gate, splash only, and no lane owns sounds.ts. T10 (Lane C) would have to edit an unowned file or stall. Fix (applied): T10 uses one low `sfx.bellow`; the Interfaces section now lists the exact sounds and beds that exist and says sounds.ts is not edited.

3. **Look risk: the walk between chambers is bare box stone.** The Meander passage was 30 to 40 m of 2.4 m box corridor in fog. That is the generic maze v1 was rejected for (decisions.md REJECTED), and it is most of what a screenshot of "the Labyrinth" shows. Also, no material was specified for walls, so lanes would default to v1's toon Prim, which research.md (j) says reads flat on plaster. Fix (applied): passage cut to 20 to 30 m with four turns (THREAD bound now 70 to 120 m, run time unchanged within 5 to 10 min); T5 lays one shared meander frieze band along every corridor; Global Constraints now fix walls as meshStandardMaterial with vertex AO and keep toon plus outline for hero props; T7 adds a token check that Bloom does not shift ochre and red (the Canvas is `flat`, VERIFIED Experience.tsx:33).

4. **Myth conveyance: two story facts live only in text that can be missed.** Theseus killing the Minotaur appears only in Ledger line IV's Solved text (VERIFIED copy.ts); the instructor may grade from screenshots, and no task produced a screenshot set with captions in frame. Fix (applied): Review Focus 6 requires every Ledger line to appear in view when written; T20 step 0 builds plan/shots/submission/ (title, six hero shots, Final Balance, each with caption or ledger text visible). The ochre hotspot glint also broke the colour rule (ochre means solved only); it is now off-white.

5. **Missing pieces around the edges.** (a) Title screen: no task set the title camera or created `#begin`, which T3's pointer lock selector requires (VERIFIED: no `id="begin"` in src; `#stage` exists). (b) index.html `<title>` is "The Ledger of Daedalus" (VERIFIED) and was in no task's files line, though the board asked for it. (c) The write-up's two [CONFIRM] marks have no owner task. (d) Deploy has no host chosen. Fix (applied for a to c): T3 step 4 frames the title and adds Begin `id="begin"`; T1 owns index.html and sets the title to match the write-up's "The Labyrinth of Daedalus"; T20 posts `@writer` to drop or reword [CONFIRM] based on what shipped. (d) is under Needs Abhinav.

## Cut list (applied)
- Click-to-walk in drag-look mode (T3): a second pathing system; Follow the thread and Continue already guarantee nobody gets stuck.
- React.lazy chamber registry and Suspense (Interfaces, T2): code splitting a tiny app adds pop in at doors and one more concept; plain imports.
- Two-stage PerformanceMonitor (N8AO off, then Low): extra state; keep v1's one-stage switch to Low, which already drops all post.
- Flight "rises out of the open tower roof" (T11): would rebuild tower geometry inside Flight; a 1 s fade through sky white carries the same beat.
- Duplicate Hud cleanup (T11 step 3 repeated T1 step 3): removed from T11.
- Thread chamber's extra ochre pulse on the door thread (T13): the World thread lighting up is the moment; one is enough.

Kept on purpose (not overbuilt): the Gate 3 look test, the 12 chamber tasks split build then fresco (lets lanes start during Gate 3), the map fresco drawn from layout.ts (T14, cheap and a strong interpretive beat), the wing tower's three light bands (shows "the middle course"), `?at=` and `?nolock`.

## Exact plan.md edits (all applied)
1. Global Constraints: PerformanceMonitor one stage; new Materials line (standard walls with vertex AO, toon props, `flat` kept, token check).
2. Global Constraints: run length 70 to 120 m.
3. Interfaces: Hotspot glint off-white; CHAMBERS plain components; list of sounds that exist, sounds.ts not edited.
4. Review Focus 6: Ledger line visible on write.
5. Lanes table: Lane 0 owns index.html; order T1, T2, then T3 and T4 in parallel, T5 after T3, T4, Gate 2.
6. T1: files add index.html and look.tsx; step 2 sets page title and adds LOOK placeholders; BED keeps last bed when current is null; Captions keeps the partridge opening rule.
7. T2: THREAD bound [70, 120]; passage 20 to 30 m, four turns; no Suspense; one-stage PerformanceMonitor.
8. T3: no click-to-walk; new step 4 title framing with Begin `id="begin"` and plan/shots/title.png.
9. T4: depends on T2; LOOK removed from its scope; Saw stub touched temporarily only.
10. T5: depends on T3, T4, Gate 2; owns World.tsx for the Meander frieze only; new frieze step.
11. T7: token check step 6.
12. T10: sfx.bellow instead of the missing sfx.breath.
13. T11: fade transition; Hud cleanup not repeated.
14. T13: no extra pulse.
15. T20: submission screenshot set; `@writer` hand off for [CONFIRM]; done when names host choice and "go".

## Needs Abhinav
- **Due date.** Still unknown (brief.md Open risks). If it is under about 24 hours, the cut order is: T18, T16, T14 frescoes first (keep T7, T9, T12 since the Saw, Cow and Minotaur frescoes carry the most myth), then N8AO. Please give the date and time.
- **Host for the public link.** Netlify or Vercel from Git with the default base, or GitHub Pages with `base: '/<repo>/'` (research.md section 5). Nothing deploys without your "go".
- **Ruling R1** (still open in progress.md): replace the en dashes in the six copy.ts source ranges with hyphens. Recommended yes; the standing no-dash rule applies to anything on screen.
- **Shadow map**: direction C's own notes (design/directions.html, Lighting) suggest one 1024 px moon shadow map per chamber. The plan keeps "no shadow maps" for fps and Safari. If you want the shadows, say so and Gate 3 measures them.

## Gate 2 applied (direction C, Moonlit Lapis, approved by Abhinav)
- Global Constraints: the "TBD" line now names C with its hex values from design/directions.html section C, plus A's plaster and B's outlines and meander bands, and a brightness floor.
- Light meaning changed to match C: ochre and red are the only warm things. The per-chamber "warm flickering point light on the craft object" is replaced by one steady cool moon key (new `LOOK.moon`); ochre appears only as emissive on the thread and on an invention at the step it works. `LOOK.craft` is now emissive only. Chamber steps T6, T7, T8, T9, T10, T13, T15, T17 reworded to remove lamps and warm light; the Wings daylight shaft is cool white.
- T5 is concrete: exact values for LOOK and tokens.css (including --red-glow #D4584A for Cost text on dark, red ink only on pale paper), Fresco plaster and border parameters, the meander frieze, and a measurable brightness floor (a wall 3 m away no darker than #1A2735; room II's far wall visible through fog; a fresco legible at 4 m; five sampled pixels per screenshot recorded on the board), checked at High and Low.
- Stale outside my files: PRD.md L2 ("warm light belongs to craft only") and L5 ("picked at Gate 2") now differ from the plan; the plan wins. @main may update PRD.md.

## Strengths to keep
One continuous place built from the myth's own logic; ledger colours that mean one thing; the Saw chamber as a real look test with fps measured post on and off; Continue at every step with visuals that depend only on `step`; node-run check.ts for layout and store; canon locked to copy.ts.

## The one change first
Move LOOK into T1 and serialise T2 then T3 and T4 in parallel. Every other lane builds against it.

## Questions a sharp mentor would ask
- "What does a grader see in 30 seconds if they never press a key?" The title shot: lit thread into the dark hall, the title and Begin. T3 step 4 now produces it; it should be judged at Gate 3 too.
- "What if Safari is slow?" Low quality drops all post and caps dpr at 1; drag look needs no pointer lock. Not measured yet (research.md Not checked).
- "Is 20 tasks too many for a midterm demo?" The count is high but each is small and parallel; the cuts above remove whole systems, not tasks. If the due date is tight, use the cut order above.
