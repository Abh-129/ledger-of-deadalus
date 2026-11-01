# Brief: The Labyrinth of Daedalus (CAMS 45 midterm, v2)
Date: Sun Nov 1 2026
Mode: product

Where we are:
- v1 exists in this repo (branch v1-backup, also master): Vite + React 18 + TS + three/R3F/drei/postprocessing + zustand. Six separate scroll scenes, a procedural 15x15 maze game, a flight game, a Ledger overlay, Final Balance. Builds and runs. The user was not satisfied: it read as a tech demo, not a crafted piece about the myth.
- Reusable from v1 (reuse, do not rewrite without reason): src/content/copy.ts (all approved captions, ledger entries), src/content/canon.ts, src/experience/shared/* (toon look kit, sea shader, figures, Polyline), src/audio/sounds.ts (synth audio, muted by default), src/experience/games/flight/physics.ts (tested flight model), overlay Ledger/FinalBalance styling, src/check.ts.

Who it is for: the CAMS 45 instructor, grading on a laptop in Chrome or Safari from a public link (or screenshots). Rubric: myth clearly and thoroughly conveyed 60, unique interpretation + visible 3h+ effort 36, write-up grammar 12, write-up format 12.

Problem: v1 conveyed the myth but did not feel like a crafted, beautiful place. It was six disconnected scenes and a generic maze.

Concept (locked direction, details are the planner's call):
One walkable, hand-laid first-person 3D Labyrinth. You walk it as a visitor following Ariadne's thread. The Labyrinth is built out of Daedalus's own inventions: each chamber holds one episode painted as a large Minoan fresco on its walls plus one hero object you interact with (look/click/E). Finishing a chamber writes its Ledger line (Solved in ochre, Cost in red) and the cost opens the way to the next chamber. Order: I Saw (Perdix) -> II Cow -> III Minotaur's chamber (empty, red light, no gore) -> IV Thread -> V Wings (tower room; short playable flight finale, reuse physics.ts) -> VI Partridge (Icaria beach at dawn) -> Final Balance. The space itself is the interpretation: Daedalus is trapped inside the consequences of what he built.

The one flow that must work: open link -> title -> walk the thread through all six chambers (5 to 10 minutes) -> fly -> partridge -> Final Balance. Every caption readable as real DOM text. A visible Skip/Continue at every interaction so nobody gets stuck.

Out of scope: procedural maze generation, accounts, backend, analytics, extra myths (Talos the bronze giant, Cocalus, death of Minos), gore, sexual content, light theme, copyrighted assets, modern translations quoted.

Success metric: the user says it "looks really, really nice to play on"; full run with no console errors in Chrome; 60 fps target on a laptop at High; every caption and source line from copy.ts appears; public static build ready to deploy.

Constraints:
- Canon is locked to src/content/copy.ts captions and the facts below; agents never invent myth content.
  Ovid Met. 8.131-259; Apollodorus Library 3.1.3-4, 3.15.8, Epitome 1.7-15. Perdix (Apollodorus: Talos), 12 years old, saw from a fish spine, compass; thrown from Athena's citadel; Athena turns him into a partridge that stays low. Minos kept Poseidon's bull; Pasiphae; hollow wooden cow on wheels covered in hide; Minotaur. Labyrinth like the Meander, Daedalus barely found the exit; 7 young men and 7 young women as tribute (never "every year"/"nine years"). Ariadne asked Daedalus; thread; Theseus kills Minotaur (offscreen); Minos imprisons Daedalus and Icarus in the Labyrinth. Wings: feathers shortest to longest, thread and wax; Icarus softens wax with his thumb; middle course "medio ut limite curras" (8.203); Samos left, Delos and Paros behind, Lebinthos and Calymne right; Icarus falls into the Icarian Sea; Daedalus reaches Sicily (Cocalus). Buries Icarus, island Icaria; curses his own skill (8.234); partridge in a ditch rejoices: Perdix. Do not say Daedalus invented the saw or compass.
- Palette tokens (src/styles/tokens.css): ochre = what was solved, red = what it cost; never use them for anything else. Fonts: Marcellus SC, EB Garamond, Caveat (ledger only), IBM Plex Mono.
- Stack fixed: the existing one. No new dependencies unless a reviewer agrees it removes more code than it adds. CC0 assets only, logged in CREDITS.md.
- Anti-slop: minimal code, no speculative abstractions, no config systems, no unused files. Each agent stays inside its assigned files.
- Parallel work: multiple builder lanes with disjoint file ownership; one shared-kit owner.

Riskiest assumption and how we test it: that a hand-laid first-person interior can look "really nice" with procedural/low-poly geometry and no baked lighting. Test: design directions first (one chamber rendered for real as a look test) before building all six.

Decisions made (with the answer): see plan/decisions.md (all round-1 recommendations accepted: "yes to all").

Open risks: deadline unknown (user did not give a date); fresco wall art quality (procedural canvas paintings vs CC0 images); Safari WebGL performance; time for a write-up revision.
