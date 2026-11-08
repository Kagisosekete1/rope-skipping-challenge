# Character assets for the reference-level art pass

The procedural models keep the game playable without external character downloads. They cannot honestly be described as matching the highly sculpted faces, hair and fabric in the supplied references. To close that gap, these are the exact artist-made assets required. No asset has been purchased or claimed to exist.

## Three original characters

1. **Pink jumper**: stylized girl with warm medium-brown skin, large brown eyes, individually shaped lids/lashes/brows, friendly smile with teeth/tongue, a swept chestnut ponytail and pink tie, hoop earrings, pink zip hoodie with hood/pocket/drawstrings/seams, charcoal cropped leggings with pink side stripes, pink-and-white laced high-tops.
2. **Blue holder**: stylized boy with deeper brown skin, short sculpted curls and faded sides, expressive eyes/brows/smile, blue hoodie, dark shorts, white socks and blue-and-white trainers. A removable backward blue cap is optional for mode/customization variants.
3. **Yellow holder**: stylized girl with warm medium-brown skin, two chestnut braids, removable backward yellow cap, hoop earrings, yellow hoodie, dark cropped leggings and yellow/white trainers; optional simple wristwatch.

Use original designs matching the supplied proportions and palette. Do not use film characters or unlicensed downloads. Deliver `jumper.glb`, `holder-blue.glb` and `holder-yellow.glb`, with a clear redistribution/commercial-use license if a third-party artist supplies them.

## Rig and export contract

- GLB / glTF 2.0, +Y up, forward +Z, feet at ground origin, consistent scale. The runtime procedural characters are approximately 2.35 world units tall; document actual authored height for normalization.
- Shared humanoid bone layout: root, pelvis, spine/chest, neck/head, clavicles, upper/lower arms, wrists/hands/fingers, upper/lower legs, ankles/toes. Include `Grip_L` and `Grip_R` attachment nodes at the palms for rope handles.
- Ponytail needs 4–6 deform bones and each braid 3–4. Preserve cap and hairstyle as separately toggleable meshes. Provide elbow/knee poles and hand targets for arm IK in the authored rig.
- Facial morphs: `Blink_L`, `Blink_R`, `Smile`, `MouthOpen`, `BrowUp`, `BrowDown`, plus cheek/squint shapes if available. Eyes should be separate eyeballs with layered iris/pupil/cornea materials, not a face image pasted on a plane.
- Clips: `Idle` (2–3 s loop), `Jump` (0.76 s, anticipation/takeoff/air/landing, in place), `Hit` (0.7–1 s), `Victory` (2–3 s loop), `Swing` (1.9 s seamless loop with wrist markers), optionally `Walk` for entrances. No unrequested root translation. Include a neutral bind pose.
- Use the same proportions, skin, eyes, clothing and hair in gameplay, rewards, previews and customization. Do not supply separate inconsistent menu-only characters.

## Mobile budgets and materials

- Target 15–25k triangles per main character, with about 8–12k and 4–6k LOD variants. Aim for three material draws per character: skin/face, clothing/shoes atlas, opaque sculpted hair. Avoid layered transparent hair cards where possible.
- Base color, tangent-space normal and packed occlusion/roughness/metalness maps, normally 1024²; reserve 2048² for a demonstrably useful hero face atlas. Deliver source textures and KTX2-ready copies if compression is used.
- Separate material slots/masks for hoodie, stripes, shoes, hair and skin so existing customization colors can drive them. Include suitable garment normal detail and baked AO, while retaining live scene lighting.
- Keep each complete compressed character under roughly 5 MB where practical. Verify joint deformation, no intersecting eyes/teeth/hood, transparent-material sorting, no missing external texture URLs and correct shadow casting.

## Integration work after assets exist

The current runtime uses procedural joint groups; it does not yet contain a finished GLB replacement/retargeting pipeline. On delivery: load each model once with Drei `useGLTF`, clone skinned rigs with `SkeletonUtils.clone`, normalize scale, blend named clips through `useAnimations`, drive facial morphs, bind rope anchors to grip nodes, map cosmetic materials and test animation transitions on all screens. Retain the procedural version as an offline/error fallback. This integration and a visual/phone QA pass are required before claiming reference-level fidelity.
