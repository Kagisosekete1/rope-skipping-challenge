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

### Control and live-data update
The rope has shared grip anchors, closed hands on handles, depth motion and a
front/back sweep. Distinct background spectators walk on a marked ground path.
Jump always accepts a tap: an idle tap starts the die and a warm-up hop; only
legal, timed jumps score. Off-turn taps give feedback without controlling the
opponent. Live jump-energy indicators show cooldown, readiness and Freeze.
The die spins through changing pip faces, then settles on the server/engine roll.
Tools is compact and sits below Round, with immediate activation feedback.

Home labels cosmetic Coins separately from Online Points; rankings use the same
online wallet as the live points badge. Leaderboards refresh every 2.5 seconds.
Apply migration 006 for push room/wallet updates (polling also remains available).
Gender is selected at registration, can be changed in Profile, and is private
Auth metadata, including an explicit Prefer not to say option.

### Readable 2D art refinement (3.0.1)
Customization now uses real SVG artwork for hoodies, paired sneakers, styled hair,
faces/skin tones and handled ropes. Hair-style and crew/avatar selection also
show drawn previews. The character library has fuller fringes, lighter linework,
coloured irises and freckles. App-wide drop shadows, text shadows and glow are
removed. Dark text sits on light surfaces, form fonts are larger and item rows
scroll to keep the drawings usable on phones. The gameplay header measures its
actual height so long names do not overlap Round, Tools and feedback.

Home shows the player's gallery photo (or chosen crew avatar), and the Home
wordmark is the owner's requested exception to the shadow-free UI. Gameplay
uses a smaller dice dock/roll button and keeps Tools directly above the jump
counter on the left. Sunny's braids are drawn behind her shoulders and face.

### Roomier phone court and Rope Edition branding (3.1.0)
All three crew members use one scale and wider spacing. The upper rope sweep is
rendered behind the characters and clears their hair, including warm-up hops.
Clouds now belong to an uncached moving layer at lower sky heights, with original
animated propeller-plane and helicopter flybys. Victory hands are rounded fists.
The rope-framed original wordmark is shared by Home, Welcome, court signage,
PWA branding and Android launcher artwork. Native review frames include the
384×844 and 576×1280 phone proportions supplied in feedback.

A six requires six successful jumps, then grants a bonus roll on the same turn.
Apply `008_six_jumps_and_cast.sql` after 007 for the corrected online rule.
Normal/Hard BeatBot has improved
but fallible timing and can spend its own existing Shield/Boost once per match.
Solo rope speed increases modestly with level, with a safe minimum period.

### Body-aware rope and profile cast (3.2.0)
The rope is sampled in depth around the animated body and hair envelope, with
rear segments drawn behind the actual jumper and front segments ahead. Held
handles share the same wrist motion. Ground contact shadows anchor the cast.
Male profiles use the boy; female profiles use either girl. Online snapshots
include public avatars without exposing private gender metadata. Home loads the
same original wordmark as the launcher through a bundled, hashed asset.
Android builds produce an update-compatible test APK and an unsigned release
AAB. See ANDROID.md for production signing and Play Console requirements.

### Continuous rotation and mechanical BeatBot (3.2.1)
Holders raise their anchored hands so a continuous elliptical rope sweep clears
both feet and hair. Rear and front segments use depth order without snapping
the rope to a body envelope. BeatBot has metal piston legs, knee hubs and robot
feet, with no human sneakers. The helicopter now travels nose-first to the right.

### Articulated hands (3.2.2)
Rope holders use one shared wrist/handle pose for their bent sleeves, rotating
grip and rope endpoint. The foreground redraw uses that same hand artwork,
replacing the old static rectangular fist. Resting hands have compact rounded
fingers; victory uses small clenched fists and alternating bent-arm pumps.
