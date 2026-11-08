# Rope Skipping Challenge — 3D rebuild

A playable browser game built with React 19, Three.js, React Three Fiber, Drei and GSAP. The welcome scene, characters, playground, rope, dice, product previews and mode previews use actual 3D meshes. No reference image is used as a character, game background or gameplay substitute.

## Run

Requires Node.js 22.12+ (Node 24 is also supported).

```sh
npm ci
npm run dev
```

Open the local address printed by Vite. For another device on the same network, use the host computer's LAN IP and Vite's port. For an installable phone version, serve the production build over HTTPS.

```sh
npm test
npm run test:scene
npm run test:ui
npm run build
npm run preview
```

Deploy the `dist/` directory to a static host. All runtime scripts and fonts are bundled locally. Production includes a generated service worker and app manifest for installation and offline loading after the first successful visit. Use `npm run build` whenever changing the source. GitHub source storage does not itself deploy the game.

## Play

Welcome → Play → Home → Let's Play → Select Mode → Play.

- Solo: compete against the computer at Easy, Normal or Hard.
- Two players: take turns on the same device.
- Roll the pip die. Clear that many jumps to earn a 5% bonus.
- Tap JUMP just before the rope reaches the feet, when the needle enters green.
- Every successful jump gives 5%; a perfect gives another 2%.
- A miss ends the turn; first to 100% wins.
- Desktop: Space rolls/jumps; Escape pauses. On mobile use the on-screen controls.
- The match pauses when the tab is hidden.

Completed solo wins award 250 coins and 50 XP; losses 80 coins and 20 XP. A two-player match awards 200 coins. Rewards are issued once per completed match. Progress, purchases, character looks and settings save on the current browser/device. Player names and crew avatars can also sync through Supabase accounts.

## Screens

Welcome features an extruded 3D logo, animated skipping and a gold Play button. Home links to mode selection, customization and My Profile. Select Mode includes live 3D character/robot previews. Gameplay has a pip-only 3D die, timing meter, progress bars, jump feedback, turn handling and pause/quit. Customization changes the crew's outfits, hair colors/styles, skin tones, shoes and rope. Match Rewards shows the earned coins, XP and best streak. The Shop displays 3D items, charges earned coins, unlocks items and equips owned ropes. Settings controls sound, the five-track Rope Rush playlist at 40% volume, and rendering quality, explains the rules, shows statistics, installs the app and offers a confirmed progress reset.

No online multiplayer, global leaderboard, real-money purchase or ad service is implied by these local game modes.

## 3D implementation

- `src/Character.jsx`: shared procedural character system, rounded lathed torso, joint hierarchies for shoulders/elbows/hips/knees, detailed eyes with highlights and blinking, brows, mouth/teeth, ears/earrings, curved hair strands/curls/braids, hoodie seams/pockets/drawstrings, trainers and laces. All screens use this same source.
- `src/Scene.jsx`: PBR materials, soft directional shadows, contact-shadow pass on higher quality, locally rendered studio environment, sky, court, procedural graffiti texture, fence, trees and buildings. 3D dice have six pip faces and GSAP rotation.
- `src/rope.js`: driven position-based rope simulation with inertia, gravity, length constraints, hand anchors and ground constraints. The holders drive its swing. Gameplay evaluates a predictable crossing phase so physics jitter cannot cause unfair misses; this is not a general rigid-body contact solver.
- `src/game.js`: rendering-independent match state machine.
- `src/App.jsx`: screen flow, live 3D item previews through shared Drei Views, local economy and controls.
- `src/styles.css`: responsive glossy interface and neon-bordered panels.

Auto quality caps pixel density and disables the contact-shadow pass on devices reporting four or fewer logical cores; Battery saver forces this tier. Main shadows are 1024 or 2048 according to quality. These are conservative settings, not measured phone FPS guarantees.

## Art quality and validation

The seven supplied images guide the pink ponytail girl, blue curly-haired boy, yellow cap/braids girl, gold rope, pink court, saturated playground and blue/gold interface. The implementation is original procedural 3D, not an exact reproduction of the illustrations. Sculpted silhouette transitions, garment folds and film-quality facial deformation still need artist-made assets to approach the reference fidelity. See `ART-ASSETS.md` for precise requirements.

Automated checks cover dice range, jump arc/cooldown, perfect scoring and bonuses, miss handling, pause, turn changes, rounds, winning, a complete AI match, save fallback and rope stability/anchors/ground/pause. Six additional scene-graph tests mount all three characters and hairstyle variants, advance their joint animations, verify finite mesh transforms and check world-space rope grip anchors using React Three Fiber’s mock renderer; the dice test checks 21 pips and no text geometry. The added scene checks keep rope holders grounded and align the welcome jump with the rope crossing. A DOM integration regression test traverses Welcome, Home, mode selection, a scored jump, pause/quit, shop purchase, customization, settings and rewards after React removes the splash. Its GPU layer is mocked; these are not GPU-rendered screenshots. A production build is also required before release.

This rebuild has not yet received visual browser QA or physical-phone performance measurement: this session did not expose the managed shared-browser control tool. Do not interpret a passing production build or rules tests as visual acceptance. Verify Welcome first, then every screen at 390×844, 768×1024 and 1440×900, plus touch input, full matches, shop/save/reload, audio, installation and offline reload on real devices.

## Licensing

Three.js attribution is in `public/licenses/THREE.txt`; bundled Helvetiker font attribution is in `public/fonts/LICENSE.txt`; Nunito uses the SIL Open Font License in `public/fonts/OFL-nunito.txt`. Dependency licenses remain with their packages. Original supplied reference crops are kept in `reference/` for art direction only; they are not loaded by the game.

## 2.0.1 repair

The splash now leaves the tree through React state rather than direct DOM removal, which invalidated React's next-screen insertion anchor and could unmount the UI. Rope holders no longer inherit the jumper's airborne motion. A shared phase is evaluated before character poses and the rope solver, and the welcome jump is centered on the underfoot crossing. The loop now sweeps from court level to 3.35 world units, above the grounded jumper's head. Wind-up moves continuously around the jumper, and turn changes preserve the current rope angle. The service worker prefers fresh HTML for online navigation while retaining an offline fallback.

## 2.1 — profiles, Rope Rush and BeatBot

- Home → the player name / My Profile opens the profile screen. Players can save a guest name/avatar or create an email/password account, confirm the email, sign in, save their account profile and sign out. Supabase setup and the complete eleven-table schema are in [`supabase/README.md`](supabase/README.md). Names/avatars sync now; gameplay progress and currency remain local until trusted match validation is integrated.
- The five supplied MP3s replace the synthesized background melody. They stream in order, cycle back to the first song, pause when hidden, and resume after a user gesture. Music volume is 40%, with a Web Audio gain path for mobile browsers that ignore the HTML media volume setting. Music starts enabled once on upgrading to this playlist; later user on/off choices are preserved. Songs are not precached during app installation, so the initial game cache does not download the entire soundtrack.
- BeatBot is an original, articulated 3D computer competitor. Computer turns, computer victories and the mode preview use the same robot model. The player's crew characters remain human-player characters.
- Additional tests cover real React name editing/profile navigation, mocked email signup/sign-in/profile-save/sign-out, playlist order/volume/pause, robot turn selection, and the SQL's policies/transactions in embedded PostgreSQL. No real signup email is sent by the test suite.
