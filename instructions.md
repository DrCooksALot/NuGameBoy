# NuGameBoy — graphics style and aesthetic

Read this before changing anything visual in `three-years/`. It records what was decided, what was rejected, and why.
The short version: **16-bit pixel people in a soft, rounded 3D toy world, with blue RPG windows. Cute first. Real places, real objects.**

Sections marked **TEK to fill in** are open questions only the owner can answer. Until they are filled, follow the defaults given.

---

## 1. The look in one paragraph

A classic 16-bit RPG feeling (the reference named was *Secret of Mana*), rebuilt in three.js. Characters and background people are pixel-art sprites with a dark one-pixel outline, standing in a 3D world made of smooth, rounded, brightly coloured shapes on a checkerboard lawn. All UI is the blue gradient window with a white border from SNES-era RPGs. Nothing cinematic is layered on top: no letterbox, no vignette, no film grain, no bloom.

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
  - **Ahanu:** big curly auburn hair in two tones (`0x6b3a24`, highlights `0x9a5a30`), warm tan skin, burgundy dress shape by default.
  - **TEK:** short dark hair, dark beard, dark top, blue jeans.
- **Outfits change per level** through the level's `outfit` field, never by editing the defaults. Examples in use: tan jacket and tan hat with a leather jacket (Lightscape), suit and floral dress (Metah's wedding), red trousers (Anthony & Nicka's), all black with beanies (The Heist).
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
- **Night levels are dusk-blue, not black.** Sky around `0x1c2470` into `0x6a66d0`. If you cannot read the scene on a phone outdoors, it is too dark.
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
| Triangles | under 75k | about 70k (Lightscape) |

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

## TEK to fill in

Answering these would remove most of the guessing. Replace each line with your answer.

1. **Reference games.** *Secret of Mana* is the only one named. List two or three more, and say what to take from each (colour, sprites, UI, camera).
   - _answer:_
2. **"How we usually do our cool 3D games."** This was said once and never found in the repos. Name the project or attach a screenshot.
   - _answer:_
3. **The two leads, exactly.** Hair length and colour, skin tone, usual clothes, anything always worn (glasses, hat, jewellery). Current values are read off a handful of photos.
   - Ahanu: _answer_
   - TEK: _answer_
4. **Colour likes and dislikes.** Any colour that should lead the palette, and any to avoid. Lightscape was called too teal and too bright for a December night; how dark is right?
   - _answer:_
5. **Sprite detail.** Keep 24 × 30, or go larger for more expression (faces, clothing detail)? Should the leads get more animation: four-direction walk, sitting, hugging, dancing?
   - _answer:_
6. **Camera.** Is the current tilted view right, or would a flatter top-down view (closer to Mana) be better for walk-around levels?
   - _answer:_
7. **Type.** Stay with Courier New, or use a real pixel font? A bundled font file would be added to `three-years/vendor/`.
   - _answer:_
8. **Shell colour.** Keep the periwinkle body, or match a real handheld you own?
   - _answer:_
9. **Per-level mood, one line each.** Time of day, weather, and the single thing that must be recognisable.
   - Lightscape: _answer_
   - The Heist: _answer_
   - Metah's Wedding: _answer_
   - Anthony & Nicka's Wedding: _answer_
   - New Orleans: _answer_
   - Waiting for Godot: _answer_
   - Happy Birthday: _answer_
10. **Things that are off limits.** People, places, jokes or details that should never appear.
    - _answer:_
11. **Voice.** Is the deadpan NPC tone right for her, or should it be warmer? Paste two or three lines in the voice you want.
    - _answer:_
