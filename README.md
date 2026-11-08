# Rope Skipping Challenge - full project

A turn-based 3D rope-skipping arcade game (Three.js, plain JavaScript, no build step).
Roll the dice, then jump the rope that many times. First to 100% wins.

## Run it
Needs a local web server (service workers do not work from file://):

    cd rope-skipping-challenge
    python3 -m http.server 8080
    # open http://localhost:8080

Three.js and the GLTF loader are bundled locally in js/vendor, so startup does not depend on a CDN.
The service worker caches the game for offline play.

## Put it on the web / install on a phone
Upload this whole folder to Netlify Drop, Cloudflare Pages or GitHub Pages (HTTPS required).
Open the address on a phone: Android Chrome -> Settings -> "Install app on this phone";
iPhone Safari -> Share -> Add to Home Screen. See INSTALL.txt.

## Files
    index.html              screens (welcome, home, settings, ranks, profile, shop, HUD, overlays)
    css/style.css           all styling
    js/game.js              all game code (sections below, search for "/* =====")
    sw.js                   service worker (offline cache; bump V when you change files)
    manifest.webmanifest    PWA manifest
    icons/                  app icons (192, 512)
    reference/              the three character crops from your design, for image-to-3D tools
    _headers                Netlify / Cloudflare header rules

## js/game.js sections
    Sound                   Web Audio effects (jump, ok, bad, win)
    Kids crowd cheer        synthesized crowd (noise + claps + kid voices)
    Nursery-song music      Twinkle Twinkle, Mary Had a Little Lamb, Row Row Row Your Boat (music-box)
    Scene / stage           renderer, camera fit, lights, court, wall, buildings, trees
    Scenery polish          gradient sky, clouds, court lines, chain-link fence
    Ambient life            birds and walkers behind the kids
    Characters              person() builder + jumper and two rope holders
    Rope                    rope curve, hand attachment, arms
    Dice (CSS 3D)          pip dice, fair random (crypto)
    Match / game state      turns, jump timing, AI, scoring, finish, rewards
    Loop                    per-frame update and animation
    Online play             optional 2-phone mode (needs the Claude "room" feature; shows a message elsewhere)
    Power-ups               slow rope, shield, boost (1 each per match)
    Pause / Effects         pause overlay, sparkles, screen shake
    Shop                    outfits, ropes, hair colours (coins, saved in localStorage)
    GLB character import    load your own rigged .glb for each character
    Pages                   rankings (rank points + tiers), profile, shop, settings
    Welcome screen          logo screen and PLAY

## Game rules (tunable constants near "Match / game state")
- Jump window: airborne (height > 0.3) when the rope reaches the ground; jump lasts 0.52 s, cooldown 0.45 s.
- Rope period 1.5 s, speeds to 0.85 s as jumps land. +5% per jump, +5% for clearing the roll, +2% perfect.
- A miss ends the turn (landed jumps are kept, bonus lost). First to 100% wins.
- AI: Easy / Normal / Hard differ only in timing error and chance to skip; it never sees your dice.
- Rank points: win +30, loss -10 (not in 2-player). Tiers: Bronze 0, Silver 100, Gold 250, Platinum 500, Diamond 900.
- Coins: win 250, loss 80, 2-player 200; +50/20 XP; 200 XP per level; daily +100 coins; win-streak bonus.

## Using real 3D characters (GLB)
Settings -> Custom characters loads one .glb per character.
Needed per character: humanoid rig; clips named Idle, Jump, Hit (or Fall/Lose), Victory (or Win/Cheer) for the girl;
Idle and Swing (or Rope/Turn) for the rope holders; a bone with "Hand" in its name (right hand preferred);
feet at the origin, facing +Z, under about 5 MB and 30k triangles. Use the images in reference/ as input to an
image-to-3D tool (Higgsfield, Meshy, Tripo, Rodin), then rig and animate in Mixamo.

## Known gaps
- Characters are procedural shapes, not the Pixar-style models in the design images (needs GLB assets above).
- No global leaderboard (needs a server). Rankings are stored per device.
- No monetization or ads (needs ad/payment SDKs). Shop is cosmetics-only by design.
- Not yet screen-by-screen matched to the design images: Select Mode, Customize, Rewards, Shop layouts.
