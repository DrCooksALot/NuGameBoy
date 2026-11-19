# Three Years — a NuGameBoy cartridge

Seven short 3D levels, one per memory, playable solo or with two phones.

| # | Level | Memory | Game |
|---|-------|--------|------|
| 1 | Lightscape | Brooklyn Botanic Garden, Dec 2023 | collect in rounds, dodge wisps |
| 2 | The Jitney Years | Brooklyn ⇄ the East End | 3-lane runner |
| 3 | Metah's Wedding | Portland, Aug 24, 2024 | catch petals, dodge rain |
| 4 | Pow Wow | Shinnecock, Labor Day 2024 | collect in rounds, dodge gulls |
| 5 | Anthony & Nicka's Wedding | Sep 7, 2024 | rhythm |
| 6 | New Orleans | French Quarter, Apr 2025 | catch |
| 7 | Waiting for Godot | Hudson Theatre, Oct 22, 2025 | 3-lane runner |
| 8 | Happy Birthday | Nov 19 | find 3 keys, open the box |

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

- `js/engine.js` renderer, post-processing, input, audio, net, UI
- `js/kit.js` low-poly kit (static geometry is merged into 2 draw calls per level)
- `js/games.js` the four mechanics · `js/levels.js` the seven dioramas · `js/main.js` flow
- `vendor/` three.js r182 and PeerJS, vendored so nothing loads from a CDN
