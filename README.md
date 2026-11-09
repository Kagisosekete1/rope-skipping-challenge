# Rope Skipping Challenge — Cartoon Edition 3.0

A complete 2D presentation for the existing playable game. React 19 and GSAP drive the UI; Canvas 2D draws original articulated cartoon characters and layered scenery; SVG draws pip dice and shop items. The old Three.js renderer and dependencies have been removed. No character or artwork from an existing television show is used.

## Run and verify

Node 22.12+ (or Node 24):

```sh
npm ci
npm run dev
npm test
npm run test:scene
npm run test:ui
npm run build
```

The production build is `dist/`. `.openai/hosting.json` binds the existing hosted Site. Source is also saved to GitHub. A generated service worker caches the shell; music streams separately. Accounts and online play require internet.

## Art and animation

- `src/cartoon-art.js`: shared original character drawing, skin/outfit/hair/shoe palettes, ponytail/bun/puffs and braids, large expressive eyes, blinks, smiles, miss reactions, BeatBot, rubber-hose limbs, walking, win dance, squash/stretch and the rope curve.
- `src/CartoonScene.jsx`: one animation loop, engine clock integration, background caching, independent cloud/walker/bird layers, jump motion lines, landing dust and reward confetti. Background palettes change as levels increase, with no designed final level.
- `src/cartoon.css`: cohesive ink borders, flat cel colours, paper panels, chunky buttons, cartoon progress bars and all screen styling. `styles.css` retains the established responsive layout rules.
- `CartoonPreview`, `CartoonItem`, `CartoonDie`: reusable crew/mode/item artwork and a permanently visible dot-only die in its own control dock.
- `scripts/cartoon-icons.mjs`: generates matching PWA/Android launcher artwork.
- `scripts/render-cartoon.mjs`: native Canvas artwork review sheets (not browser screenshots).

Static scenery is cached instead of rebuilt every frame. Preview canvases redraw only when selections change. Device pixel ratio is capped at 1.7 (1 in Battery saver); the runtime contains no WebGL or sprite-atlas download requirement. The renderer follows requestAnimationFrame and targets smooth play, but 60 FPS on every phone is not guaranteed or physically verified.

## Preserved gameplay and account features

Welcome, Home, Select Mode, Gameplay, Customization, Match Rewards, Shop, Profile, Leaderboard, Online Lobby and Settings remain available. The rules are unchanged: roll 1–6 pips, tap just before the rope reaches the feet, earn 5% per jump plus 2% for perfect timing and 5% for clearing a roll. A miss ends the turn; first to 100% wins. Solo difficulty and same-device two-player play remain. Space rolls/jumps; Escape pauses.

Block, Shield, Slow, Boost and paid Freeze remain in the compact Tools drawer. Cloud online points, invitation stakes, escrow, payouts and server scoring are unchanged. Guest practice points are separate from trusted online points. Card purchases are **Coming soon**; no payments are collected.

Every victory advances a level. Existing local storage (`rsc_v2`, guest and per-account caches), owned cosmetics, settings and progress are preserved. Signed-in cloud progress uses `practice_progress`; this redesign needs **no new database migration**. The applied migrations through `005_progress_and_deletion.sql` remain valid. Settings includes About, FAQ, Privacy, Terms, account deletion and installation/sharing.

The five supplied Rope Rush tracks still play at 40% effective gain. A human victory pauses the playlist and plays the supplied cheer immediately when sound effects are enabled.

## Verification limits

Automated tests cover game rules, cloud authorization and points escrow, progress restoration, email/profile flows, gallery processing, pip counts, 2D artwork rendering, rope timing and navigation. Native Canvas artwork was rendered and inspected. Browser/physical-phone layout and live two-device play were not available in this execution environment. The Android download is a debug-signed test APK, not a store release. See `ANDROID.md`, `ONLINE.md` and `supabase/README.md`.
