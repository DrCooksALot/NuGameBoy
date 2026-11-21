# NuGameBoy — graphics style and aesthetic

Read this before changing anything visual in `three-years/`. It records what was decided, what was rejected, and why.
The short version: **16-bit pixel people in a soft, rounded 3D toy world, with blue RPG windows. Cute first. Real places, real objects.**

The owner's answers so far are in the table near the end. The "Still open" list after it is what to ask next.

---

## 1. The look in one paragraph

A classic 16-bit RPG feeling, rebuilt in three.js as a small diorama you look down into. References named by the owner: *Secret of Mana* (sprites, windows, warmth), *Tunic* (the tilted toy-box view, clean rounded shapes), *Little Devil Inside* (small figures in a big readable scene), *The Legend of Zelda* (walk-around levels with things to find). The diorama view is the part the owner loves most: every level should read as a little model of a real place. Characters and background people are pixel-art sprites with a dark one-pixel outline, standing in a 3D world made of smooth, rounded, brightly coloured shapes on a checkerboard lawn. All UI is the blue gradient window with a white border from SNES-era RPGs. Nothing cinematic is layered on top: no letterbox, no vignette, no film grain, no bloom.

## 2. Hard rules

These came from direct feedback. Do not undo them without being asked.

| Rule | Why |
|---|---|
| **Cute over cinematic.** | The first version was moody low-poly with bloom and letterboxing. It was rejected as "trying to do too much". |
| **No post-processing at all.** Render straight to the canvas. | Bloom, float render targets and a custom shader pass blanked the screen on a real phone GPU. |
| **No white flashes.** Fades use the dark DOM overlay (`#fade`). | Explicit request. The camera-flash effect was removed for this. |
| **No shadow maps.** Characters get a soft blob shadow. | Removed as the likeliest remaining trigger for lost graphics contexts. |
| **No floating islands.** Ground runs to the horizon. | "I don't like the floating map, how it looks in space." |
| **Real objects, not abstract shapes.** A pickup is a croissant, a key, a lantern; an obstacle is a car or a barricade. | Coloured boxes and glowing balls were called out as "shapes that don't make sense". |
| **Levels are real places.** Build from what is actually there; use satellite views or sourced descriptions when available. | Lightscape was rebuilt twice to match Brooklyn Botanic Garden. |
| **No photographs in the game, ever.** Photos sent in chat are reference for how people and places look, nothing more. | Explicit, and the repo is public. |
| **Nothing between the camera and the player.** The camera looks north from the south, so tall things go north of where the player walks, never south. | Trees and a gate repeatedly hid the player. |

## 3. Characters (pixel sprites)

Drawn procedurally in `three-years/js/kit.js` (`drawFrame`, `atlas`, `makeChar`). No image files.

- **Canvas:** 24 × 30 pixels per frame, 7 frames in a strip: front idle, front step, back idle, back step, side idle, side step, cheer. Side frames face right and are mirrored for left.
- **In the world:** a `THREE.Sprite`, 1.44 × 1.8 units, nearest-neighbour filtering, `alphaTest` 0.5 (hard pixel edges, no blending), not affected by fog.
- **Outline:** every sprite gets a one-pixel `#2a1a2c` outline, added automatically around filled pixels.
- **Proportions:** chibi. The head is roughly half the height. Two-by-three pixel eyes with a one-pixel white highlight, a pink blush pixel pair, a one-pixel mouth.
- **Animation:** two-frame walk with a small bob. Idle breathes very slightly. Keep it this simple.
- **The two leads** (defaults in `three-years/config.js`):
  - **NUNU:** big curly pink hair in two tones (`0xff5fa8`, highlights `0xffa6cf`), small **red antlers** (`antlers: 0xe5352f`, drawn over hair and hats), light skin with a slight tan, a lilac dress with pale dots, a white collar with a red bow, red shoes.
  - **TEK:** short dark brown hair and beard, fair skin with freckles, dark top, blue jeans. **No blue hair.** It was tried and rejected outright.
  - The in-game names are NUNU and TEK. Do not use any other name for either lead in dialogue, titles or docs.
- **Outfits change per level** through the level's `outfit` field, never by editing the defaults. Examples in use: tan jacket and tan hat with a leather jacket (Lightscape), suit and floral dress (Metah's wedding), red trousers (Anthony & Nicka's), all black with beanies, antlers poking through (The Heist).
- **Everyone else** (guests, visitors, the guard, couples) uses the same sprite system with varied skin, hair and tops, so the whole cast matches.

## 4. The world (3D)

Built with the `Batch` helper in `kit.js`: every static piece of a level is merged into one mesh.

- **Shapes:** smooth and rounded. Spheres for tree canopies and bushes, cylinders and boxes for the rest. No flat-shaded faceting.
- **Material:** `MeshLambertMaterial` with vertex colours. Each piece gets a slight automatic tint variation so large surfaces are not flat.
- **Ground:** `turf()` gives the two-tone checkerboard lawn (1-unit tiles). Paths, paving and floors are thin boxes laid on top.
- **Lights and glow:** light sources are unlit bright shapes (`glow` argument, capped at 1.25 × so colours stay colours instead of clipping to white). Strings of fairy lights are tiny cubes from `Batch.dot()`.
- **Signs carry real lettering.** Use `sign()` (canvas text) for anything that would have words on it: gate names, exit signs, marquees, stall banners.
- **Sky:** a three-colour gradient dome, optional stars, one sun or moon disc. Distance fog matched to the horizon colour hides the edge of the ground.
- **Edges of a play area** are something physical: path lights, a rope line, a picket fence, a wall, an iron fence.
- **Beyond the play area:** a belt of trees and a few low hills, kept to the north and sides.

## 5. Colour

- **Saturated and warm**, in the SNES register. Daytime levels: blue sky into a cream horizon, greens around `0x6fc25a`.
- **Only three levels are at night:** Lightscape and the two weddings. Everything else, including the title screen and the finale, is daytime. Do not turn a level to night without being asked.
- **Night means properly dark, but readable.** Sky near `0x05071c` into `0x151d58`, hemisphere light about 1.5, sun (moon) about 1.1, fog matched to the horizon. The glowing things in the level (fairy lights, installations, lamps) should be what stands out. A first pass with light levels near 1.0 was called too dark; the original dusk-blue (`0x1c2470` sky, lights at 2.5) was called too bright.
- **Night levels set `tint`** on the level object (around `0xc8ccf4`), which cools the character sprites so they sit in the scene instead of glowing.
- **Accent set** used for party lights and UI highlights: gold `0xffd27a`, pink `0xff7ab6`, sky `0x7ad7ff`, mint `0x9bff9b`.
- **Recurring materials:** brick `0xa8604e`, stone `0xd8cab8`, wood `0x8a5a36`, iron `0x24222c`, steel `0x9aa0a8`.
- Tone mapping is ACES at exposure 1.15, applied by the renderer. That is the only "grade".

## 6. UI

All UI is HTML over the canvas, styled in `three-years/index.html`.

- **Windows:** vertical gradient `#3a52c8` → `#1a2470`, 2 px white border, 7 px radius, a 2 px dark outer ring `#14143a`, white text with a 1 px dark drop shadow.
- **Type:** bold `"Courier New"`, monospace. Headings in gold `#ffe27a`. Small labels in `#9fb4ff`.
- **Menus:** the selected row has a gold border and a `▸` marker. Every menu works by d-pad and A, and by tapping.
- **Level opening:** a small banner window with the date and place, the level name, and one dry line. No letterbox.
- **In-play prompts** sit as outlined text low on the screen ("A · photo at the Supernova").
- **Never require the phone keyboard.** Text entry is an on-screen pad.
- **The shell** around the screen is the periwinkle NuGameBoy body (`#4f50db`), a round thumb-stick, magenta A and B, tilted SELECT and START pills.

## 7. Camera

- Vertical field of view 54° when the screen is squarer than 1.2 : 1 (phones in portrait), otherwise 44°.
- Walk-around levels: the camera sits about 9 units up and 9 units south of the player, looking slightly down at them, and follows smoothly.
- Fixed-view levels (catch, rhythm, runner) use one static camera each; see each game's `cam()` in `games.js`.
- Level openings are a short push-in from higher and further back. No orbiting.

## 8. Tone and writing

- **Dry and deadpan, never sappy**, until the very end. NPC lines are short, lowercase, and slightly absurd ("one second, he is about to propose. ...never mind, he is tying his shoe.").
- **The ending is the one sincere moment** and is kept to a single line.
- Captions under polaroids are a few lowercase words.
- Real names and inside references live in `three-years/config.js` and `three-years/js/levels.js`, nowhere else.

## 9. Reward: the polaroid

Each level ends by posing the two leads in the scene with one prop from that level and taking an in-engine snapshot, shown as a slightly rotated polaroid with a short caption. It is always rendered from the game. It is the level's reward, so it should show the place clearly.

## 10. Performance budget

Measured with `renderer.info` during play. Stay inside these.

| | Target | Heaviest level today |
|---|---|---|
| Draw calls | under 50 | 46 |
| Triangles | under 75k | about 76k (Lightscape, at the limit: add nothing without removing something). New Orleans is a known exception at about 111k: it is five sets in one merged mesh. Do not add to it. |

- Static scenery: one merged mesh per level, plus one for unlit glow.
- Repeated moving things: pooled `InstancedMesh` via `items()`. Never one mesh per pickup for the whole level.
- Small props use the low-detail sphere; build them with `b.lo = true`.
- Phone pixel ratio is capped at 1.5. There is a low-resolution safe mode after a graphics loss.

## 11. Sound

Synthesized with Web Audio; no audio files except one. Each level has its own upbeat major-key chiptune (`three-years/js/songs.js`). The recorded track *Boatfriend* plays on the title screen and menus only. The ending plays "Happy Birthday to You".

## 12. Checklist for a new level

1. What is the real place? Find a satellite view, a venue description, or ask.
2. List the five to eight things someone who was there would recognise. Build those first.
3. What do the two of them wear there? Set `outfit`.
4. What are the pickups and hazards as real objects? Add models to `MODELS` in `kit.js`.
5. What has words on it? Use `sign()`.
6. What is the prop in the polaroid, and where do they stand (`shot`) so the place shows behind them?
7. Run it and check: nothing tall south of the walking area, draw calls and triangles inside budget, readable on a small screen.

---

## Answered by the owner

| Question | Answer |
|---|---|
| Reference games | *Secret of Mana*, *Tunic*, *Little Devil Inside*, *The Legend of Zelda*. |
| "How we usually do our cool 3D games" | An earlier 3D game with a diorama feel, probably deleted. The diorama view is the thing to keep building on. |
| The two leads | See section 3. Named NUNU and TEK. Nunu is the stylised one: pink hair, red antlers. |
| How dark is night | See section 5. Night only for Lightscape and the weddings. |
| Voice | The deadpan NPC tone is right. |

## Per-level mood (from the owner)

| Level | Mood |
|---|---|
| Lightscape | Neon lights covering the botanic garden. An Alice in Wonderland light show in a secret garden. Cool and fun. Built as: neon-edged paths, colour-lit trees, oversized glowing mushrooms and flowers, a rainbow light tunnel, drifting pink and cyan lights. |
| The Heist | Super goofy, not tense. The grow room is grey and white, with orange shelving being taken apart, lots of grow lights, and pumps. The guard is a friend: if he catches you he says something and looks away. No fine, no dropped gear, no stun. |
| Metah's Wedding | A small white tent next to a lake. A giant hill on one side. On the other side, a small bathroom up its own hill. The reception was on a big lawn right next to the lake. Built with the camera looking across the lawn at the tent, lake behind it, hill left, bathroom right. Night is assumed, not confirmed. |

## Still open

Ask about these one level at a time; do not guess in bulk.

1. **Per-level mood, one line each:** weather and the single thing that must be recognisable. Still to ask: Anthony & Nicka's Wedding, New Orleans, Waiting for Godot, Happy Birthday.
2. **Sprite detail:** keep 24 × 30, or go larger? More animation for the leads (sitting, hugging, dancing)?
3. **Type:** stay with Courier New, or bundle a real pixel font?
4. **Shell colour:** keep the periwinkle body?
5. **Off limits:** people, places, jokes or details that should never appear.
