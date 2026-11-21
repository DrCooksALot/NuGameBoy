# Three Years — a NuGameBoy cartridge

Seven short 3D levels, one per memory, playable solo or with two phones.

| # | Level | Memory | Game |
|---|-------|--------|------|
| 1 | Lightscape | Brooklyn Botanic Garden, Dec 2023 | take photos together at the sights, dodge visitors and squirrels, find a couple to take your picture |
| 2 | The Jitney Years | Brooklyn ⇄ the East End | 3-lane runner |
| 3 | Metah's Wedding | Portland, Aug 24, 2024 | catch petals, dodge rain |
| 4 | Pow Wow | Shinnecock, Labor Day 2024 | collect in rounds, dodge gulls |
| 5 | Anthony & Nicka's Wedding | Sep 7, 2024 | rhythm |
| 6 | New Orleans | French Quarter, Apr 2025 | write a TO DO list in the hotel room, then cross it off around the Quarter: weed, food and gifts from any of several shops, and three adventures from the man in the life vest at the dock, in order: the Hilton timeshare pitch (pick the funniest reply), the Airboat Alligator Race (a three-course cup with laps and a choice of three boats), and a sunset cruise on the steamboat that ends whenever you like |
| 7 | Waiting for Godot | Hudson Theatre, Oct 22, 2025 | 3-lane runner |
| 8 | Happy Birthday | Nov 19 | find 3 keys, open the box |

New Orleans scores differently: you start with $300, everything you buy, every reply in the pitch, your place in the race and the things you do on the boat are worth points, a dollar in a street performer's case is worth 2, and the game holds back enough cash to finish the list. B opens a map of the shops.

Scoring: every good pickup in a row builds a streak, every 5 raises the multiplier (max ×4), getting hit resets it. Stars and best scores are saved per level.
Each level ends with a polaroid: the two characters are posed in the diorama with a prop and the game takes the picture. No photographs are used anywhere.

## Run it

It is plain static files with no build step, but it uses ES modules, so it must be served over http(s) — opening the file directly will not work.
Any static host works (GitHub Pages, Netlify drop, `npx serve` from the repo root). The page is `three-years/index.html`.

## Personalize it (`config.js`)

- Names, character colours and hair for both of you.
- The ending text (`birthday`): heading and one paragraph per screen.
- Level text (titles, NPC lines, star thresholds, difficulty) lives in `js/levels.js`.

## Controls

Thumb-stick (also a d-pad for menus), **A** action / confirm, **B** back, **START** pause, **SELECT** mute. Tapping the screen counts as A on any card. Keyboard: arrows/WASD, Space/Enter = A, Esc = B.

## Two player

TWO PLAYER → HOST gives a 4-letter room code and a share link; the other phone joins. Scores add together. Needs internet on both phones (WebRTC via PeerJS).
Dev: add `?net=local` to test with two tabs in one browser, `?all` to unlock every level, `?level=N` to jump straight in.

## Code map

- `js/engine.js` renderer, input, sound effects, music sequencer, net, UI
- `js/songs.js` one chiptune per level (generated from a seed and rhythm motifs) plus the ending tune
- `js/kit.js` low-poly kit (static geometry is merged into 2 draw calls per level)
- `js/games.js` the four mechanics · `js/levels.js` the seven dioramas · `js/main.js` flow
- `js/nola.js` New Orleans, level and mechanic together: the street grid, the shops and their stock (`SHOPS`), the list (`LIST`), the adventures and prices are plain data at the top of the file. The timeshare pitch is the `PITCH` list: add a round or a reply by adding a line. The race courses are `COURSES` (length, laps, bends, gators, pace) and the boats are `BOATS` (top speed, steering, acceleration)
- `vendor/` three.js r182 and PeerJS, vendored so nothing loads from a CDN

Levels sit on a ground that runs to the horizon (no floating islands) and are dressed with things from the real place: the Winter Cathedral, Sea of Light and Supernova at Brooklyn Botanic Garden; an L.I.E. exit gantry; the Hudson Theatre marquee. Static scenery is baked into one mesh per level and pickups/obstacles are pooled instanced models, which keeps every level under about 50 draw calls and 45k triangles.

Rendering goes straight to the canvas with no post-processing or float render targets, to stay safe on phone GPUs. All music and sound is synthesized with Web Audio; there are no audio files.
