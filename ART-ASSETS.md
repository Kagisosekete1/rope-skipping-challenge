# Original Cartoon Edition artwork

All active characters, scenery, dice, item previews and logos are original 2D code artwork. No rigged GLB models, Three.js meshes or external cartoon characters are required.

`src/cartoon-art.js` is the reusable drawing library. Poppy is the expressive pink ponytail jumper, Ziggy is the curly-haired blue crew member, Sunny wears the yellow cap and braids, and BeatBot is the cheerful teal-and-gold robot. Existing outfit, hair, shoe, skin-tone and hairstyle customization still applies.

Characters use articulated drawing parts rather than baked sprites. Animation includes blinking, hair sway, walking cycles, anticipation, jump deformation, win dancing, miss expressions, shield/freeze overlays, landing dust and jump lines. Scenery layers include drifting cloud cels, crooked buildings, trees, mural wall, chain-link fence, birds, spectators and a court with inked linework.

`npm run test:scene` checks all pip faces, character states and cosmetic palette rendering. `node scripts/render-cartoon.mjs` renders review sheets under `/workspace/work/cartoon-review/`. `node scripts/cartoon-icons.mjs` regenerates the coordinated app icons.

The visual direction uses broad animation conventions: bold outlines, saturated cel colours, expressive proportions and playful seaside scenery. It does not reproduce copyrighted characters, locations or logos from a television show.
