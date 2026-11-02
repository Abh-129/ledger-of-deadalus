# The Labyrinth of Daedalus

A first-person walk through the Labyrinth that tells the myth of Daedalus as a ledger of problems solved and problems created. CAMS 45 midterm creative project.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run check    # maze, flight and story-state self-check
npm run build    # typecheck + production build into dist/
```

## Controls

- Move: WASD or arrow keys. Shift to run.
- Look: drag or mouse look.
- Use: E or click.
- Continue: Enter or the Continue button.
- F: Follow the thread (auto-walk to the next place).

## URL options

- `?at=<key>` jumps into the run with every earlier chamber written: `saw`, `cow`, `labyrinth`, `thread`, `wings`, `partridge`, `flight`, `balance`.
- `?static` shows the no-WebGL text version of the whole myth.
- `?nolock` skips pointer lock (drag to look).

## Sources

- Ovid, Metamorphoses 8.131-259
- Apollodorus, Library 3.1.3-4 and 3.15.8; Epitome 1.7-15

See CREDITS.md for code, fonts and asset notes.

## Deploy

The build is static: publish `dist/`. Netlify and Vercel work with the default base. GitHub Pages serves from a sub-path, so set `base` in `vite.config.ts` to the repository name before building.
