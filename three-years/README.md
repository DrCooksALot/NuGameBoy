# Three Years — a NuGameBoy cartridge

Seven short 3D levels, one per memory, playable solo or with two phones.

| # | Level | Memory | Mechanic |
|---|-------|--------|----------|
| 1 | Lightscape | Brooklyn Botanic Garden, Dec 2023 | collect |
| 2 | The Jitney Years | Brooklyn ⇄ the East End | 3-lane runner |
| 3 | Pow Wow | Shinnecock, Labor Day 2024 | collect + talk |
| 4 | Anthony & Nicka's Wedding | Sep 7, 2024 | rhythm |
| 5 | New Orleans | French Quarter, Apr 2025 | catch |
| 6 | Waiting for Godot | Hudson Theatre, Oct 22, 2025 | 3-lane runner |
| 7 | Happy Birthday | Nov 19 | find 3 keys, open the present |

## Run it

It is plain static files with no build step, but it uses ES modules, so it must be served over http(s) — opening the file directly will not work.
Any static host works (GitHub Pages, Netlify drop, `npx serve` from the repo root). The page is `three-years/index.html`.

## Personalize it (`config.js`)

- Names, character colours and hair for both of you.
- The birthday message, and an optional gift reveal (`giftImage` / `giftText`) shown after the last level.
- Real photos: drop `photos/<level id>.jpg` (`lightscape`, `jitney`, `powwow`, `wedding`, `nola`, `godot`) and it replaces the in-game snapshot on that level's polaroid.
- Level text (titles, captions, NPC lines, difficulty) lives in `js/levels.js`.

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
