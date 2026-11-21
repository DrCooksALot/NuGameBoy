# NuGameBoy

A handheld-style shell with cartridges. The main one is **Three Years** in `three-years/`: a birthday game of short levels, each a real memory, playable solo or with two phones.

## Before you change anything visual

Read `instructions.md`. It defines the graphics style and lists rules that came from direct feedback (no post-processing, no white flashes, no floating islands, real objects, no photographs, nothing between the camera and the player).

## How to run and test

- No build step. ES modules, so it must be served over http: `node server.js`, then open `/three-years/`.
- `?all` unlocks every level, `?level=N` jumps to one (0-based), `?safe` forces low-resolution mode, `?net=local` tests two player across two tabs.
- Test in a real browser before saying something works. Use touch input as well as keys: a menu bug that only affected taps went unnoticed because tests used the keyboard.
- `window.__ty` exposes game state for test scripts.

## Where things are

- `three-years/config.js`: names, character looks, the ending text. Personal content lives here and in `js/levels.js`.
- `three-years/js/levels.js`: the levels (set dressing and parameters).
- `three-years/js/games.js`: the game modes (`explore`, `heist`, `collect`, `catcher`, `runner`, `rhythm`).
- `three-years/js/nola.js`: the New Orleans level and its `errands` mode (hotel room, French Quarter, Hilton pitch, airboat races, steamboat), all in one file.
- `three-years/js/kit.js`: sprites, the `Batch` mesh builder, object models, signs.
- `three-years/js/engine.js`: renderer, input, audio and music, networking, UI.

## Working with the owner

- The repo is public. Never commit photographs of people, and keep personal details out of commit messages and pull request text.
- Merging to `main` publishes the game. Open a pull request and wait to be told to merge.
- Say plainly what was and was not tested. Nothing here has been verified on a real phone by an automated test.
