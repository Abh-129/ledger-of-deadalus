# Research: making the walkable Labyrinth look premium (G2)

Checked: Sun Nov 1 2026, 18:02 to 18:10 EST. Installed versions read from node_modules: three 0.170.0, drei 9.117.3, @react-three/postprocessing 2.16.3, postprocessing 6.39.6, n8ao 1.10.3.
Maturity labels: proven (widely used, documented, stable), emerging (works, fewer production uses), experimental.
Claim states: VERIFIED (primary source or installed source read this run), REPORTED (secondary only), NOT CHECKED.
FPS note: I did not run a benchmark. Costs below are relative tiers from the docs and from how each technique renders (extra passes, draw calls), not measured frame times, except where a doc gives a number.

## Recommended for this build (max 8)

1. **Light each chamber with hemisphere fill + one warm flickering point light, fake AO in vertex colours, no real-time shadows.** Proven, Safari-safe, near-free. Shadow maps are the biggest cost a walking camera adds; skip them.
2. **Warm exponential fog (`<fogExp2>`) matched to the background colour.** Proven, free, hides corridor ends and makes the space feel larger.
3. **One small post stack: N8AO at half resolution + Vignette + light Bloom, with `dpr={[1, 1.5]}` and drei `PerformanceMonitor` that turns AO off on decline.** Emerging (N8AO) and proven (rest). This is the single largest "premium" lift and the single largest cost; keep it optional per chamber.
4. **Paint the six frescoes ourselves on a `CanvasTexture`** (flat fills, black contour, Minoan palette, a plaster-crackle overlay), and multiply them over one CC0 plaster texture. Proven. Cleaner than Wikimedia images: no real fresco shows the Daedalus episodes, and canon is locked (see section 3).
5. **drei `<SpotLight volumetric>` for one or two light shafts** (tower room V, the Minotaur chamber III in red). Proven, cheap: it is one cone mesh, not a post pass. Leave `depthBuffer` off unless the cone visibly clips the floor.
6. **drei `<Sparkles>` for dust motes in light shafts.** Proven, one draw call.
7. **First-person controls: drei `PointerLockControls` with a `selector` (never bare document click) + WASD, plus a drag-to-look and click-a-hotspot-to-walk fallback that never needs pointer lock.** Proven API; the fallback is our own small code.
8. **Host on Netlify or Vercel from Git with the default `base: '/'`.** Proven; GitHub Pages works but needs `base: '/<repo>/'`.

## 1. Techniques (highest impact, lowest code)

| # | Technique | What to do | Cost tier | Safari | Maturity | Evidence |
|---|---|---|---|---|---|---|
| a | Fake GI | `hemisphereLight` (warm sky, dark ochre ground) + `ambientLight` low; one `pointLight` per chamber at a torch | free to cheap (no shadows) | safe | proven | three.js core lights; no source needed for behaviour beyond docs |
| b | Baked vertex AO | When building wall/floor geometry, write darker vertex colours at floor/wall seams and corners (`vertexColors` on the material). Hand-laid geometry makes this a few lines | free at runtime | safe | proven | standard technique; NOT CHECKED against a specific doc |
| c | Torch flicker | In `useFrame`, `light.intensity = base * (1 + 0.08*sin(t*9) + 0.05*sin(t*23.7))`, tiny position jitter; same on an emissive flame mesh | free | safe | proven | R3F `useFrame` (installed) |
| d | Fog | `<fogExp2 attach="fog" args={[color, 0.06]}>`, same colour as `<color attach="background">` | free | safe | proven | three core |
| e | N8AO (SSAO) | `<N8AO halfRes quality="performance" aoRadius={...}>` inside `EffectComposer` | moderate to high | works in WebGL2; debug mode needs a Chromium timer extension | emerging | n8ao README (installed): half-res is "generally 2x-4x" faster, depth-aware upsampling "around 1ms"; quality table: Performance = 8 AO samples, recommended for "Low-end iGPUs and laptops"; changing quality "forces a recompile", so set once. Export present at `@react-three/postprocessing/dist/effects/N8AO` |
| f | Colour grade | `Vignette`, `HueSaturation`/`BrightnessContrast`, optional `ToneMapping`, `Noise` at very low opacity for a fresco grain. All exist in the installed package (`dist/effects/*.js`) | cheap (merged into one pass by postprocessing) | safe | proven | installed file list |
| g | Volumetric shafts | drei `SpotLight volumetric` builds a `CylinderGeometry` cone with `SpotLightMaterial` (installed `core/SpotLight.js:36`); props `attenuation`, `anglePower`; optional `depthBuffer` from `useDepthBuffer()` adds a depth render | cheap (cheap-moderate with depthBuffer) | safe | proven | drei docs `docs/staging/spot-light.mdx` (master), installed source |
| h | Dust motes | drei `Sparkles` renders one `points` object with `depthWrite: false` (installed `core/Sparkles.js:104,129`); props `count`, `speed`, `size`, `noise` | cheap | safe | proven | drei `docs/staging/sparkles.mdx` |
| i | Soft shadows for a walking camera | **Skip.** `AccumulativeShadows` is "a planar, Y-up oriented shadow-catcher" (floor only, no walls) that is free only after it finishes accumulating; `ContactShadows` is also planar and "rather expensive" unless `frames={1}` for static objects; `SoftShadows` (PCSS) patches every material's shader (installed `core/softShadows.js:125` disposes and recompiles all scene materials) and still needs live shadow maps | high for live shadows; `ContactShadows frames={1}` under one static hero object is cheap and fine | safe | proven | drei docs accumulative-shadows.mdx, contact-shadows.mdx; installed source |
| j | Toon vs standard | v1 kit uses `meshToonMaterial` + inverted-hull outline (`src/experience/shared/look.tsx:35-42`). Toon ignores roughness and normal detail, so plaster reads flat. Suggest: walls/floor `meshStandardMaterial` (plaster map + fresco canvas, roughness ~0.9); keep toon + black outline for hero objects and figures, which echoes fresco contour lines. Test in the look-test chamber before committing | same cost | safe | proven (both); the mix is a design judgement, not verified | installed source |
| k | Procedural fresco | Draw each panel once on a 2048x1024 `<canvas>` (2D API: flat fills, 3 to 4 px black contour, palette red-ochre / yellow-ochre / Egyptian blue / off-white ground, a noise mask for flaking), wrap as `THREE.CanvasTexture`, set `colorSpace = SRGBColorSpace`, `anisotropy = gl.capabilities.getMaxAnisotropy()`, generate mipmaps | free at runtime, one-off at load | safe | proven | three core |
| l | Resolution control | v1 uses `<Canvas flat dpr={high ? [1, 2] : 1}>` (`src/experience/Experience.tsx:33`). Retina laptops at dpr 2 render 4x the pixels of dpr 1; cap at 1.5 when post is on. R3F docs show `PerformanceMonitor onDecline={() => setDpr(1)}` and `flipflops` + `onFallback` | biggest fps lever | safe | proven | R3F docs `docs/advanced/scaling-performance.mdx` lines 210-238 |

Caution on colour: v1's Canvas is `flat` (no tone mapping), which keeps the ochre and red tokens exact. Adding `ToneMapping` or Bloom will shift them; if used, re-check the two tokens on screen. VERIFIED that `flat` is set; the shift itself is NOT CHECKED here.

Draw calls: R3F docs say "no more than 1000 as the very maximum, and optimally a few hundred or less" and suggest instancing (scaling-performance.mdx line 122). Merge each chamber's static walls into one or two meshes, or instance repeated blocks.

## 2. CC0 sources (licence VERIFIED on the primary page this run)

| Source | Licence evidence (quote, page) | Use |
|---|---|---|
| Poly Haven | "Our assets are all licensed as CC0", credit not required (https://polyhaven.com/license, 200) | textures |
| ambientCG | "All ambientCG assets are provided under the Creative Commons CC0 1.0 Universal License" (https://docs.ambientcg.com/license/, 200) | textures |
| Kenney | "all game assets on the asset pages are public domain licensed (CC0)" (https://kenney.nl/support, 200); each kit page below shows "License Creative Commons CC0" | models |
| Quaternius | "All models are under the CC0 License" (https://quaternius.com/faq.html, 200) | models |
| Poly Pizza | Licence is per model, mix of CC0 and CC-BY (REPORTED, tier 3/4 only: gamefromscratch, itch credits). https://poly.pizza/faq returned 404. Check each model page; prefer Kenney/Quaternius | models, avoid unless checked |
| Freesound | Licences per sound (https://freesound.org/help/faq/, 200). CC0 filter URL: `https://freesound.org/search/?q=<terms>&f=license:%22Creative+Commons+0%22`. Download needs a free account (Vidyut does it) | audio |

Candidate assets (sizes from the Poly Haven files API / ambientCG API / Freesound pages, this run):

| Asset | Page | Licence | Size |
|---|---|---|---|
| Plastered Wall 02 (fresco ground) | https://polyhaven.com/a/plastered_wall_02 | CC0 | 1k JPG: diffuse 426 KB, normal 937 KB, ARM 535 KB |
| Worn Plaster Wall | https://polyhaven.com/a/worn_plaster_wall | CC0 | 1k: diffuse 732 KB, normal 664 KB, ARM 395 KB |
| Red Plaster Weathered (chamber III) | https://polyhaven.com/a/red_plaster_weathered | CC0 | 1k: diffuse 693 KB, normal 567 KB |
| Yellow Plaster 02 | https://polyhaven.com/a/yellow_plaster_02 | CC0 | 1k: diffuse 632 KB, normal 1119 KB |
| Large Sandstone Blocks 01 (walls/tower) | https://polyhaven.com/a/large_sandstone_blocks_01 | CC0 | 1k: diffuse 596 KB, normal 927 KB, ARM 190 KB |
| Monastery Stone Floor | https://polyhaven.com/a/monastery_stone_floor | CC0 | 1k: diffuse 748 KB, normal 1038 KB, ARM 630 KB |
| Painted Plaster 017 | https://ambientcg.com/view?id=PaintedPlaster017 | CC0 | 1K-JPG zip 4.6 MB (all maps) |
| Kenney Graveyard Kit (lanterns, stone props) | https://kenney.nl/assets/graveyard-kit | CC0 | 90 files; size NOT CHECKED |
| Kenney Castle Kit (walls, towers) | https://kenney.nl/assets/castle-kit | CC0 | 75 files; size NOT CHECKED |
| Kenney Mini Dungeon | https://kenney.nl/assets/mini-dungeon | CC0 | 30 files; size NOT CHECKED |
| Torch.wav (DanielVega) | https://freesound.org/people/DanielVega/sounds/479338/ | CC0 (page links publicdomain/zero/1.0) | 4.2 s, 1.4 MB WAV |
| Ocean Waves (Noted451), chamber VI | https://freesound.org/people/Noted451/sounds/531015/ | CC0 | 1:10, 11.9 MB WAV |
| torch ambience loop (LordStirling) | https://freesound.org/people/LordStirling/sounds/483692/ | CC0, but derived from FractalStudios 363092 (parent licence NOT CHECKED) | 13:35, 112.6 MB: too big, skip |

Advice: ship only the diffuse map of one plaster and one stone at 1k (about 1 to 1.5 MB total); a normal map is the next lift if fps allows. Convert audio to MP3 or AAC (Safari-safe) and trim to short loops; v1 synth audio (`src/audio/sounds.ts`) may already be enough. Hero objects are probably better built from primitives in the v1 toon kit than from Kenney models, so the style stays one hand. Log every used file in CREDITS.md.

## 3. Knossos fresco images on Wikimedia Commons

Licences read from the Commons API `extmetadata` (LicenseShortName) this run, HTTP 200.

| Fresco | File page | Licence | Original size |
|---|---|---|---|
| Dolphin Fresco (museum reproduction, Heraklion) | https://commons.wikimedia.org/wiki/File:Heraklion_%E2%80%94_Dolphin_fresco.jpg | CC0 (Gsimonov) | 4290x3018, 9.7 MB |
| Bull-Leaping (Heraklion museum) | https://commons.wikimedia.org/wiki/File:Bull_leaping_minoan_fresco_archmus_Heraklion_(cropped).jpg | CC0 (Jebulon) | 3686x1933, 8.1 MB |
| Bull-Leaping (alternate) | https://commons.wikimedia.org/wiki/File:Knossos_bull_leaping_fresco.jpg | Public domain (Gleb Simonov) | 7008x3776, 20 MB |
| Prince of the Lilies (on-site replica, Knossos) | https://commons.wikimedia.org/wiki/File:Knossos_%E2%80%94_Prince_of_the_Lilies.jpg | CC0 (Gsimonov) | 4101x6633, 23 MB |

Avoid: the many "Zde" and "ArchaiOptix" photos (CC BY-SA 4.0, share-alike) and Olaf Tausch (CC BY 3.0). Commons serves 2048 px thumbnails via `iiurlwidth=2048`, which is the size to use if any are used.

**Verdict: painting our own is cleaner.** Reasons: (1) none of these frescoes shows Perdix, the cow, the thread, the wings or the partridge, and the brief locks canon to copy.ts, so real images cannot carry the episodes; (2) a single procedural style across six chambers is the "visible effort" the rubric rewards; (3) no licence or credit risk; (4) about 0 KB of download versus 1 to 2 MB per photo. A real image could at most be an ambient frieze (for example bull-leaping near chamber II); that is the planner's call. Greek rules on reproducing antiquities images: NOT CHECKED (non-commercial classroom use).

## 4. First-person controls (Chrome and Safari)

Facts (VERIFIED):
- Pointer Lock support (caniuse data, `Fyrd/caniuse/features-json/pointerlock.json`): Chrome 22+, Firefox 14+, desktop Safari 10.1+; **iOS Safari: not supported** (latest entry 27.2 = "n").
- MDN `requestPointerLock`: needs transient activation (a user click); right after the user leaves lock with Esc (the default unlock gesture) a new request "will fail, even if a transient activation is available"; inside an iframe it needs the `allow-pointer-lock` sandbox token; call it before `requestFullscreen`. https://developer.mozilla.org/en-US/docs/Web/API/Element/requestPointerLock (raw source `mdn/content`).
- `unadjustedMovement` (raw mouse input): Chrome 88+ (not Linux), Safari 18.4+, Firefox 152+ (MDN browser-compat-data, `api/Element.json`). Promise return is non-standard and not universal, so do not `await` it without a guard.
- drei `PointerLockControls` (installed `core/PointerLockControls.js:61-63`): with no `selector` it locks on **any click on the document**, which would steal clicks on Skip/Continue buttons. Always pass `selector="#enter"` (a dedicated button). It wraps three-stdlib, which rotates by `movementX/Y * pointerSpeed` and clamps pitch with `min/maxPolarAngle`.
- Chrome `movementX` spikes of several hundred pixels under pointer lock (three.js issue #12757, closed as a browser bug, crbug 781182). REPORTED (tier 3, 2017 to 2023), current Chrome NOT CHECKED. Cheap guard: ignore events with `|movementX| > 150`.

Recommended pattern (small, proven parts):
1. Title screen button "Enter the Labyrinth" is the lock selector. Listen for `pointerlockchange` and `pointerlockerror`; on unlock show a "Click to resume" overlay with the Skip/Continue controls (this also absorbs the Esc cooldown).
2. Movement: WASD/arrows in `useFrame`, speed ~2.5 m/s, collision by clamping to a hand-laid list of floor rectangles (corridors and chambers), not physics.
3. Fallback when lock is unavailable or refused (iPad/iPhone, embedded iframe, user preference): drag-to-look on pointer events plus **click-to-walk**: raycast the floor or a hotspot, then lerp the camera along the thread polyline to that point. The same "walk to next chamber" button doubles as the brief's visible Skip.
4. Interaction: centre-screen raycast on E or click while locked; on the fallback, click the hero object directly.

## 5. Free static hosting for a Vite app

Primary source: Vite 5.4.10 guide `docs/guide/static-deploy.md` and `docs/guide/build.md` (raw GitHub, 200). Build output is `dist`; `npm run build` then `npm run preview` (serves dist on http://localhost:4173) to check before deploying.

- **Netlify (Git):** push to GitHub, import at https://app.netlify.com/start, build `npm run build`, publish `dist`. Every push to the production branch deploys; other branches get preview URLs. Netlify Drop (drag `dist` onto the page) works without an account, but unclaimed sites are deleted within about an hour (REPORTED from Netlify KB and changelog search results, not fetched), so claim it.
- **Vercel:** `vercel` CLI or Git import; Vite is auto-detected (Vite guide). Hobby plan terms for a class project NOT CHECKED.
- **GitHub Pages:** set `base: '/<REPO>/'` in `vite.config.ts` for `https://<user>.github.io/<REPO>/` (or `'/'` for a user site or custom domain); in repo Settings > Pages choose "GitHub Actions" and use the Vite sample workflow (checkout@v4, setup-node@v4, configure-pages@v4, upload-pages-artifact@v3 with `path: './dist'`, deploy-pages@v4).
- **Base path gotchas:** current `vite.config.ts` has no `base` (defaults to `'/'`), and `public/` is empty, so Netlify/Vercel need no change. If any code later builds asset URLs at runtime (textures, audio in `public/`), use `import.meta.env.BASE_URL + 'tex/plaster.jpg'`, written exactly like that, since Vite replaces it statically (build.md line 28). Hard-coded `'/tex/...'` breaks on GitHub Pages. Importing assets (`import url from './plaster.jpg'`) avoids the issue entirely.
- The app is a single page with no client routes, so no SPA rewrite rule is needed.

## What this means / what to do
- Planner: lock items 1 to 8 above into the look-test chamber first; measure fps there with post on and off on the target laptop before building six.
- Shared-kit owner: add a `paintFresco(ctx, scene)` helper, the flicker light, the vertex-AO helper and the fog/post presets to the shared kit; chambers only pass parameters.
- Vidyut: if real textures or audio are wanted, approve the specific downloads (about 1.5 MB textures, about 2 MB audio after conversion). Freesound downloads need his own account.

## Not checked
Real fps on a Mac or Windows laptop (no benchmark run); Kenney kit download sizes; Poly Pizza per-model licences; current Chrome pointer-lock spike behaviour; Safari 17/18 specific WebGL quirks with N8AO (none found in the N8AO README, no device test); Vercel Hobby terms; Greek antiquities image rules.

## Sources (all fetched Sun Nov 1 2026, 18:02 to 18:10 EST, HTTP 200 unless noted)
- Installed packages in `node_modules`: drei 9.117.3 (`core/PointerLockControls.js`, `core/SpotLight.js`, `core/Sparkles.js`, `core/softShadows.js`), n8ao 1.10.3 README, @react-three/postprocessing 2.16.3 `dist/effects`.
- drei docs: https://raw.githubusercontent.com/pmndrs/drei/master/docs/staging/accumulative-shadows.mdx, .../contact-shadows.mdx, .../spot-light.mdx, .../sparkles.mdx
- R3F performance: https://raw.githubusercontent.com/pmndrs/react-three-fiber/master/docs/advanced/scaling-performance.mdx
- MDN: https://raw.githubusercontent.com/mdn/content/main/files/en-us/web/api/element/requestpointerlock/index.md ; https://raw.githubusercontent.com/mdn/browser-compat-data/main/api/Element.json
- caniuse: https://raw.githubusercontent.com/Fyrd/caniuse/main/features-json/pointerlock.json
- three.js issue: https://github.com/mrdoob/three.js/issues/12757 (search result, not fetched)
- Vite: https://raw.githubusercontent.com/vitejs/vite/v5.4.10/docs/guide/static-deploy.md ; .../build.md
- Licences: https://polyhaven.com/license ; https://docs.ambientcg.com/license/ ; https://kenney.nl/support ; https://quaternius.com/faq.html ; https://freesound.org/help/faq/
- APIs: https://api.polyhaven.com/assets?t=textures , https://api.polyhaven.com/files/<id> ; https://ambientcg.com/api/v2/full_json?q=plaster ; Commons API https://commons.wikimedia.org/w/api.php (imageinfo extmetadata)
- Netlify Drop: https://www.netlify.com/knowledge-base/netlify-drop-vs-vercel-drop/ (search result, not fetched)

CHECKED_AT: Sun Nov 1 18:10 EST 2026
SUBJECT: ledger-of-daedalus (not a git repo at this path; no SHA)
CHECKED: brief.md, decisions.md, package.json, vite.config.ts, src/experience/Experience.tsx:33, src/experience/shared/look.tsx; node_modules sources above; URLs above
NOT CHECKED: see "Not checked"
UNRESOLVED: Poly Pizza licence per model (needs each model page); Netlify Drop claim window (needs Netlify docs fetch); real fps (needs a run on the target laptop)
