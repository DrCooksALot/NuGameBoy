// Seven memories. Each level = a set built from real things you would see there (build) + one mechanic from games.js (game + P).
// Everything static is baked into one mesh per level, so detail costs vertices, not draw calls.
import { THREE, scene, world } from './engine.js';
import { turf, island, tree, pine, lamp, house, stringLights, sky, lights, orb, ambient, makeChar, critter, sign, items, Batch } from './kit.js';
import { NOLA } from './nola.js';

const fog = (c, a, b) => { scene.fog = new THREE.Fog(c, a, b); };
const ring = (n, r, fn, off = 0) => { for (let i = 0; i < n; i++) { const a = off + i / n * Math.PI * 2; fn(Math.cos(a) * r, Math.sin(a) * r, a, i); } };
const PARTY = [0xffd27a, 0xff7ab6, 0x7ad7ff, 0x9bff9b];
const IRON = 0x24222c, WOOD = 0x8a5a36;

/* background people: wedding guests, spectators, a crowd on a balcony */
const SKINS = [0xe6b596, 0xd59a70, 0xb9794f, 0xf0c8a4, 0x9a6a48], HAIRS = [0x1a1412, 0x3a2a20, 0x6b3a24, 0xc8a050, 0x555060], TOPS = [0xe5484d, 0x3d8bd9, 0xf2efe6, 0xffd27a, 0x4fae6a, 0x8a5ad0, 0x2a2a33, 0xff9ab8];
function person(i, x, z, face = 0, y = 0, o = {}) {
  const c = makeChar({ skin: SKINS[i % 5], hair: HAIRS[(i * 3) % 5], top: TOPS[(i * 5) % 8], legs: [0x2a2a33, 0x3b4a8a, 0x6a5240][i % 3], style: ['short', 'long', 'bun', 'curly'][i % 4], ...o });
  c.g.position.set(x, y, z); c.face = face; c.anim(0, 0); c.sh.visible = y === 0; world.add(c.g); return c;
}
/* a white pop-up vendor canopy with a table of goods */
function tent(b, x, z, ry, goods = 0xe5484d) {
  const c = Math.cos(ry), s = Math.sin(ry);
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.cyl(x + (c * dx - s * dz) * 1.05 * -1 * -1, 0, z + (s * dx + c * dz) * 1.05, .04, 2, 0xd8d8de, 1, 5);
  b.box(x, 1.86, z, 2.3, .22, 2.3, 0xffffff, -ry); b.cyl(x, 2.08, z, 1.62, .7, 0xffffff, .001, 4);
  b.box(x + s * .5, 0, z + c * .5, 1.7, .74, .6, 0xb0763e, -ry); b.box(x + s * .5, .74, z + c * .5, 1.8, .05, .7, 0xf2e6c8, -ry);
  for (let i = -1; i <= 1; i++) b.box(x + s * .5 + c * i * .5, .79, z + c * .5 - s * i * .5, .28, .16, .28, [goods, 0xffd27a, 0x3d8bd9][i + 1], -ry);
}
function chair(b, x, z, ry, col = 0xffffff) { b.box(x, 0, z, .46, .46, .46, col, ry); b.box(x - Math.sin(ry) * .2, .46, z - Math.cos(ry) * .2, .46, .56, .07, col, ry); }
function roundTable(b, x, z) { b.cyl(x, 0, z, .09, .78, 0x6a5240, 1, 6); b.cyl(x, .78, z, 1.08, .07, 0xfff6e6, 1, 12); b.cyl(x, .5, z, 1.02, .28, 0xfff6e6, 1.04, 12);
  b.ball(x, 1.02, z, .17, 0xff9ab8); b.ball(x + .12, 1, z + .06, .12, 0xffffff); b.cyl(x, .85, z, .05, .1, 0x7ad7ff, 1, 6); b.dot(x + .34, .95, z, .05, 0xffe9a0, 1.25);
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + .6; chair(b, x + Math.cos(a) * 1.5, z + Math.sin(a) * 1.5, Math.atan2(-Math.cos(a), -Math.sin(a)), 0xf2e6d0); } }
/* a bare winter cherry tree wrapped in fairy lights */
function cherry(b, x, z, i) {
  b.cyl(x, 0, z, .17, 1.3, 0x5a4034, .75, 7);
  for (let k = 0; k < 5; k++) { const a = k * 1.26 + i; b.box(x + Math.cos(a) * .42, 1.15, z + Math.sin(a) * .42, .08, 1.5, .08, 0x5a4034, -a, 0, 0, -.62); }
  for (let k = 0; k < 16; k++) { const a = k * 2.4 + i, h = 1.5 + (k % 5) * .32, r = .5 + ((k * 7) % 6) * .16; b.dot(x + Math.cos(a) * r, h, z + Math.sin(a) * r, .06, k % 3 ? 0xffc4dc : 0xffffff, 1.25); }
}

export const LEVELS = [
  /* ───────────── 1 · LIGHTSCAPE — Brooklyn Botanic Garden ─────────────
     Laid out from satellite views. Lily Pool Terrace (two long pools, the round fountain between them, the Palm House
     alongside) is the start. A path west runs through the Winter Cathedral to Cherry Esplanade, with the Cranford Rose
     Garden beside it. North is up the screen. */
  { id: 'lightscape', tint: 0xc8ccf4, shot: [4, 2.9], prop: 'lantern', outfit: { her: { top: 0xc8a878, cap: 0xc8a878 }, him: { top: 0x1c1a1e, zip: 0x9a9aa4 } },   // what you wore: tan jacket and tan hat; leather jacket
    caption: 'taken by two strangers who also love Spirited Away', kicker: 'December 2023 · Brooklyn Botanic Garden', title: 'Lightscape', sub: 'a secret garden, lit in neon. one missing glove.',
    game: 'explore', icon: '✦', stars: [8, 16, 24],
    how: 'Take photos together at the glowing frames around the garden: stand in one and press A.\nThen ask couples (A) until one will take a picture of you both, and lead them to the fountain.\nMind the other visitors and the squirrels; dash (A) past them. There is a hot toddy cart. Somewhere there is a glove.',
    P: { col: [0xffd77e, 0xff9a62], bounds: [-22.5, 8.4, -33.4, 25.2], goal: { x: 4, z: 2.9 },
      // the photo quest: stand in the frame together and press A. pressing as the frame swells is a perfect shot
      photos: [{ x: 4, z: 22.9, name: 'the entrance' }, { x: 7.3, z: 7.2, name: 'the koi pond' }, { x: 7.3, z: -1.6, name: 'the Palm House' }, { x: -4.8, z: .65, name: 'the Winter Cathedral' },
        { x: -9, z: -16, name: 'Sea of Light' }, { x: -9, z: -30.2, name: 'the Supernova' }, { x: -18.8, z: -17.4, name: 'the rose garden' }, { x: -13.2, z: 4.8, name: 'the toddy cart' }],
      // other visitors walking the paths
      walkers: [{ a: [1, 12.6], b: [1, -10], speed: 1.7, look: { skin: 0xd59a70, hair: 0x1a1412, top: 0x4fae6a, legs: 0x2a2a33 } }, { a: [6.6, -9.6], b: [6.6, 11.6], speed: 2, look: { skin: 0xf0c8a4, hair: 0xc8a050, top: 0xe5484d, legs: 0x3b4a8a, style: 'long' } },
        { a: [5.2, 19.6], b: [5.2, 13.6], speed: 1.5, look: { skin: 0xb9794f, hair: 0x15100e, top: 0xffd27a, legs: 0x6a5240, style: 'bun' } }, { a: [2.8, 13.8], b: [2.8, 24.6], speed: 2.1, look: { skin: 0xe6b596, hair: 0x555060, top: 0x6a7ac8, legs: 0x2a2a33, cap: 0x2a2a33 } },
        { a: [-9.6, -1], b: [-9.6, -10], speed: 1.6, look: { skin: 0x9a6a48, hair: 0x1a1412, top: 0xf2efe6, legs: 0x2a2a33, style: 'curly' } }, { a: [-7.6, -12], b: [-7.6, -31], speed: 2.2, look: { skin: 0xe6b596, hair: 0x6b3a24, top: 0x8a5ad0, legs: 0x3b4a8a } },
        { a: [-10.6, -30.6], b: [-10.6, -12.4], speed: 1.8, look: { skin: 0xd59a70, hair: 0x3a2a20, top: 0xff9ab8, legs: 0x2a2a33, style: 'long' } }, { a: [-1.4, 1.5], b: [-12, 1.5], speed: 1.5, look: { skin: 0xf0c8a4, hair: 0x1a1412, top: 0x3d8bd9, legs: 0x6a5240, beard: 0x1a1412 } }],
      cart: { x: -13.2, z: 1.2, name: 'hot toddy cart', lines: ['one hot toddy. for warmth.', 'another one. still for warmth.', 'a third. you two are very warm now.', 'that is a lot of hot toddies. walk carefully.', 'at this point i should just give you the cart.'] },
      gloveAt: [[-20.6, -9.6], [-3.6, -22], [-15.4, 9], [-6.4, -9.4], [-17, 6.4]],
      gloveLines: [['NUNU', 'found it. your glove. i was absolutely not the one who lost it.'], ['TEK', 'you were absolutely the one who lost it.']],
      opening: [['TEK', 'wait. where is my other glove?'], ['NUNU', '...we should take some pictures. look. it is like falling down the rabbit hole.']],
      note: 'then find a couple to take yours', escortNote: 'lead them to the fountain between the ponds',
      hazAt: [[-9, -21, 2.8], [-12, 9, 2.6]], hazard: () => critter('squirrel'), hazPop: 'squirrel!', yesFrom: [0],   // it was the couple by the koi pond
      yesLines: (who) => [[who, 'a picture? of course. we were just watching the koi.'], ['NUNU', 'could you take it by the fountain, between the two ponds?'],
        [who, 'good choice. with all these lights on the water it looks like Spirited Away.'], ['TEK', 'the bathhouse at night. that is exactly what we said.'],
        [who, "just don't eat anything in here or you'll turn into pigs."], ['NUNU', 'too late. we already had the hot chocolate.'], [who, 'ha. okay, lead the way. we will follow you.']],
      couples: [
        { x: 7.75, z: -6.4, face: -1.57, name: 'couple by the koi pond', looks: [{ skin: 0xe6b596, hair: 0x3a2a20, top: 0x6a7ac8, legs: 0x2a2a33, style: 'long' }, { skin: 0xd59a70, hair: 0x1a1412, top: 0x4fae6a, legs: 0x3b4a8a, beard: 0x1a1412 }], no: [''] },
        { x: 4, z: -10.2, name: 'couple at the wall fountain', looks: [{ skin: 0xd59a70, hair: 0x1a1412, top: 0x3d8bd9, legs: 0x2a2a33, style: 'long' }, { skin: 0xe6b596, hair: 0x6b3a24, top: 0x4fae6a, legs: 0x3b4a8a }], no: ['sorry, we cannot feel our hands. december.', 'still frozen. try the people by the cherry trees.'] },
        { x: 1, z: -5.4, name: 'couple on the bench', looks: [{ skin: 0xf0c8a4, hair: 0xc8a050, top: 0xe5484d, legs: 0x2a2a33, style: 'bun' }, { skin: 0xb9794f, hair: 0x15100e, top: 0x8a5ad0, legs: 0x2a2a33, beard: 0x15100e }], no: ['one second, he is about to propose. ...never mind, he is tying his shoe.', 'he is still tying it.'] },
        { x: -9, z: 2.6, name: 'couple by the light tunnel', looks: [{ skin: 0xe6b596, hair: 0x3a2a20, top: 0xffd27a, legs: 0x3b4a8a, style: 'curly', hair2: 0x5a4030 }, { skin: 0x9a6a48, hair: 0x1a1412, top: 0xf2efe6, legs: 0x6a5240 }], no: ['we would, but our phone is at 1%. so is yours? oh no.', 'now it is at 0%.'] },
        { x: -9, z: -19, name: 'couple on the esplanade', looks: [{ skin: 0xb9794f, hair: 0x15100e, top: 0xff9ab8, legs: 0x2a2a33, style: 'long' }, { skin: 0xf0c8a4, hair: 0x555060, top: 0x2a2a33, legs: 0x3b4a8a, cap: 0x8a2a3a }], no: ['we are actually looking for someone to take OUR picture.', 'if you find someone, send them our way too.'] },
        { x: -11.6, z: -29, name: 'couple under the big star', looks: [{ skin: 0xf0c8a4, hair: 0x6b3a24, top: 0x4fae6a, legs: 0x6a5240, style: 'bun' }, { skin: 0xd59a70, hair: 0x3a2a20, top: 0xe5484d, legs: 0x2a2a33 }], no: ['sorry, we have been trying to find the exit since november.', 'is it this way? no? okay.'] },
        { x: -14.3, z: -12.4, name: 'couple by the pergola', looks: [{ skin: 0x9a6a48, hair: 0x1a1412, top: 0x7ad7ff, legs: 0x2a2a33, style: 'curly' }, { skin: 0xe6b596, hair: 0xc8a050, top: 0x8a5ad0, legs: 0x3b4a8a, beard: 0xa88040 }], no: ['we are mid-argument about whether roses count as lights. give us a minute.', 'they do not count. he is wrong.'] },
        { x: -18.8, z: -22.2, name: 'couple in the rose garden', looks: [{ skin: 0xe6b596, hair: 0x555060, top: 0xf2efe6, legs: 0x2a2a33, style: 'long' }, { skin: 0xb9794f, hair: 0x555060, top: 0x6a7ac8, legs: 0x6a5240 }], no: ['oh, we are terrible at phones. you would get our thumbs.', 'we tried. it was our thumbs.'] }] },
    build(b, c) {
      sky(0x05071c, 0x151d58, 0x111742, 800); lights(0x7684dc, 0x26483e, 1.45, 0xb4c0ff, 1.05, -4, 9, 5); fog(0x111742, 26, 82); orb(-40, 46, -90, 5, 0xdfe6ff, 1.2);
      turf(150, 150, 0x225a4a, -7, -10);
      const BRICK = 0xa8604e, STONE = 0xd8cab8, WATER = 0x161e52, PATH = 0x8f90a4, GLOBE = [0xff7ab6, 0x7ad7ff, 0xffd77e, 0x9bffb0], NEON = [0xff3fa4, 0x3fe0ff, 0xb46bff, 0x7dff6a, 0xffd23f, 0xff7a3f];
      /* Lily Pool Terrace */
      b.box(4, 0, 1, 9.6, .06, 24.8, BRICK);
      const pool = (z0, z1, round) => { const zc = (z0 + z1) / 2, len = z1 - z0; b.box(4, .06, zc, 4, .1, len + .8, STONE); b.box(4, .1, zc, 3.2, .08, len, WATER);
        if (round) { b.cyl(4, .06, z0, 2, .1, STONE, 1, 14); b.cyl(4, .1, z0, 1.6, .08, WATER, 1, 14); }
        for (let z = z0 + .6; z < z1; z += 1.25) { c.colliders.push({ x: 4, z, r: 1.75 }); for (const sx of [-1, 1]) b.dot(4 + sx * 1.9, .2, z, .05, 0xffe9b0, 1.25); }                    // you cannot walk on water; lights along the rim
        for (let k = 0; k < 9; k++) { const x = 4 + Math.sin(k * 2.3 + z0) * 1.2, z = z0 + .7 + (k + .5) * (len - 1) / 9; b.cyl(x, .18, z, .2, .02, 0x3f8a52, 1, 7); if (k % 2) b.ball(x + .3, .3, z + .2, .13, GLOBE[k % 4], 1.25); } };
      pool(-9, -2.2, true); pool(3.5, 10.4, false);
      const koi = items(12, 'koi', [0xff7a2a, 0xffffff, 0xffb347, 0xff5a3a]);                                           // the koi, circling under the lights
      c.amb.push({ update(dt, t) { for (let i = 0; i < 12; i++) { const south = i % 2, zc = south ? 6.95 : -5.6, a = t * (.35 + (i % 5) * .07) * (i % 3 ? 1 : -1) + i * 1.7, rx = .5 + (i % 4) * .28, rz = 1.2 + (i % 3) * .85;
        koi.set(i, 4 + Math.cos(a) * rx, .2, zc + Math.sin(a) * rz, 1.25, Math.atan2(-Math.sin(a) * rx, Math.cos(a) * rz) + (i % 3 ? 0 : Math.PI)); } koi.flush(); } });
      b.cyl(4, .02, .65, 2.7, .06, STONE, 1, 22); b.cyl(4, .08, .65, 1.6, .16, STONE, 1, 18); b.cyl(4, .2, .65, 1.35, .06, WATER, 1, 18);                                               // the round fountain between them
      b.cyl(4, .2, .65, .34, .5, 0xf2efe6, .8, 10); b.ball(4, .86, .65, .3, 0xf2efe6); for (let k = 0; k < 6; k++) b.dot(4 + Math.cos(k * 1.05) * .2, 1.1 + (k % 3) * .22, .65 + Math.sin(k * 1.05) * .2, .05, 0xdff4ff, 1.25);
      c.colliders.push({ x: 4, z: .65, r: 1.65 });
      b.box(4, 0, -11.7, 9.6, .3, 1.1, STONE); b.box(4, 0, -12.5, 9.6, .6, .8, STONE); b.box(4, .6, -13.2, 9.6, 1, .5, STONE); b.cyl(4, .3, -11.9, 1, .5, STONE, 1, 12); b.cyl(4, .78, -11.9, .8, .04, WATER, 1, 12);   // north steps and wall fountain
      for (const z of [-7, -4, 5.2, 8.4]) { b.box(.2, 0, z, .5, .44, 1.5, 0x6a4a30); b.box(-.05, .44, z, .1, .4, 1.5, 0x6a4a30); c.colliders.push({ x: .2, z, r: .7 }); }
      for (const z of [-10, -2.4, 3.6, 11.4]) for (const x of [-.4, 8.5]) { lamp(b, x, z, 0xffe9b0, 2.4); if (x < 0) c.colliders.push({ x, z, r: .2 }); }
      /* the Palm House, along the east side: glass walls, white ribs, the curved end facing the fountain */
      b.box(13.3, 0, 1, 6.2, 3.2, 23, 0xb8ddd8); b.box(13.3, 3.2, 1, 6.5, .2, 23.3, 0xeaf4f0); b.box(13.3, 3.4, 1, 4.4, .55, 22.6, 0xc8e8e2); b.box(13.3, 3.95, 1, 2.4, .45, 22.2, 0xd8f0ea);
      b.ball(10.6, 0, .65, 3.5, 0xc0e4de, 0, .98);
      for (let z = -10; z <= 12; z += 1.1) { b.box(10.17, 0, z, .07, 3.2, .09, 0xffffff); if (Math.abs(z - .65) > 3.4 && Math.round(z * 3) % 2) b.box(10.16, .4, z + .55, .04, 2.3, .8, 0xffe9b0, 0, 1.15); }
      for (let k = -4; k <= 4; k++) { const a = k * .34; b.box(10.6 - Math.cos(a) * 3.5, 0, .65 + Math.sin(a) * 3.5, .07, 2.9, .07, 0xffffff); b.dot(10.6 - Math.cos(a) * 3.45, 2.2, .65 + Math.sin(a) * 3.45, .07, 0xffe9b0, 1.2); }
      /* the path west through the Winter Cathedral, then north to the esplanade */
      b.box(-4.9, .02, .65, 8.4, .05, 2.3, PATH); b.box(-9, .02, -4.6, 2.3, .05, 12.6, PATH);
      for (let a = 0; a < 9; a++) { const x = -1.6 - a * .8; for (let k = 0; k <= 14; k++) { const t = k / 14 * Math.PI; b.dot(x, .1 + Math.sin(t) * 3.1, .65 + Math.cos(t) * 1.55, .07, NEON[a % 6], 1.25); } }
      /* Cherry Esplanade: a long lawn between double rows of cherry trees, Sea of Light across it, the Supernova at the far end */
      b.box(-9, .016, -21.6, 6.6, .03, 23.4, 0x2c6e56);
      [-13.7, -12.3, -5.7, -4.3].forEach((x, r) => { for (let i = 0; i < 7; i++) { const z = -11.2 - i * 3.4 - (r % 2) * 1.2; cherry(b, x, z, i + r * 3); c.colliders.push({ x, z, r: .35 }); } });
      for (let gx = -11.4; gx <= -6.6; gx += .8) for (let gz = -31.4; gz <= -11.4; gz += .95) { const j = Math.sin(gx * 12.9 + gz * 78.2) * .25; b.dot(gx + j, .16, gz - j, .045, [0x7ad7ff, 0x9bffe0, 0xb8c0ff, 0x7aa8ff][Math.abs(Math.round(gx * 3 + gz * 5)) % 4], 1.2); }
      b.cyl(-9, 0, -32.6, .07, 3.4, 0x3b3b4a, 1, 6); for (let k = 0; k < 8; k++) b.box(-9, 3.1, -32.6, .07, 2.8, .07, 0xfff0b0, k * .8, 1.25, k * 1.1, k * .7); b.ball(-9, 4.5, -32.6, .28, 0xffffff, 1.25); c.colliders.push({ x: -9, z: -32.6, r: .4 });
      /* Cranford Rose Garden: brick-edged beds in two columns with grass paths, and the white pergola at its south end */
      for (const x of [-22.1, -15.5]) b.box(x, .02, -21.6, .7, .05, 19.6, BRICK); b.box(-18.8, .02, -31.2, 7.3, .05, .7, BRICK); b.box(-18.8, .02, -12.2, 7.3, .05, 1.6, BRICK);
      for (const x of [-20.4, -17.2]) for (let i = 0; i < 5; i++) { const z = -29.4 + i * 3.7; b.box(x, .02, z, 2.4, .12, 2.9, 0x5a4034); c.colliders.push({ x, z: z - .7, r: 1.15 }, { x, z: z + .7, r: 1.15 });
        for (let k = 0; k < 6; k++) { const rx = x - .8 + (k % 3) * .8, rz = z - .75 + Math.floor(k / 3) * 1.5; b.ball(rx, .3, rz, .3, 0x2f7a4a, 0, .8); b.dot(rx + .1, .56, rz, .07, [0xff5a6a, 0xff9ab8, 0xffffff][(k + i) % 3], 1.2); } }
      for (let k = 0; k <= 5; k++) { const x = -21.6 + k * 1.12; for (const z of [-11.5, -12.9]) b.box(x, 0, z, .12, 2.5, .12, 0xf6f2e8); b.box(x, 2.5, -12.2, .12, .12, 2.2, 0xf6f2e8); b.dot(x, 2.36, -12.2, .07, 0xffe9a0, 1.25); b.dot(x + .56, 2.3, -11.5, .06, 0xffe9a0, 1.25); }
      for (const z of [-11.5, -12.9]) b.box(-18.8, 2.5, z, 6, .12, .12, 0xf6f2e8); c.colliders.push({ x: -21.6, z: -12.2, r: .5 }, { x: -16, z: -12.2, r: .5 });
      /* trees: some lit in colour inside the garden, a dark belt of them outside it */
      let n = 0; const neonTree = (x, z, s2, k) => { const col = NEON[k % 6]; b.cyl(x, .012, z, 1.5 * s2 * .6, .02, col, 1, 12, .5);
        for (let j = 0; j < 5; j++) b.dot(x + Math.cos(j * 1.3) * .2 * s2, .15 + j * .17 * s2, z + Math.sin(j * 1.3) * .2 * s2, .05, col, 1.25);
        for (let j = 0; j < 6; j++) { const a = j * 2.4, y = (1.1 + (j % 3) * .42) * s2, rr = (.82 - (j % 3) * .2) * s2; b.dot(x + Math.cos(a) * rr, y, z + Math.sin(a) * rr * .9 + .1, .07, j % 3 ? col : 0xffffff, 1.25); } };
      for (const [x, z, s2, col] of [[-3, -7, 1.8, 0x8a5ad8], [-20.4, -3.4, 1.6, 0x3d8ad8], [-6.4, 11.4, 1.6, 0xd85a9a], [-19.6, 12.4, 1.7, 0x3fa878], [-19.4, 3.6, 1.6, 0x8a5ad8], [-15.4, -5.4, 1.6, 0x3d8ad8], [-2.2, -17, 1.6, 0x3fa878], [-1.6, -27, 1.8, 0x8a5ad8]]) {
        tree(b, x, z, s2, col); neonTree(x, z, s2, n++); c.colliders.push({ x, z, r: .55 }); }
      let s = 3; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 26; i++) { const t = i / 26; (i % 3 ? tree : pine)(b, -26 - r() * 8, -38 + t * 56, 1.8 + r(), 0x1f5a48); (i % 3 ? pine : tree)(b, -25 + t * 40, -37.5 - r() * 8, 1.8 + r(), 0x1f5a48); }                               // nothing along the south edge: that is where the camera looks from
      for (const [x, z, r2] of [[-48, -80, 26], [-8, -92, 34], [40, -84, 28]]) b.ball(x, -8, z, r2, 0x1f4a58, 0, .5);
      c.amb.push(ambient({ n: 120, col: 0xffffff, size: .09, area: 14, h: 9, vy: -.7, drift: .3, add: false, opacity: .9 }));
      /* the entrance: you start outside the gate and walk in. piers, iron fence, the lit sign, a ticket booth */
      b.box(4, .02, 19.4, 4.4, .05, 12.6, PATH);
      for (const sx of [-1, 1]) { b.box(4 + sx * 2.7, 0, 21, .9, 3.4, .9, STONE); b.box(4 + sx * 2.7, 3.4, 21, 1.1, .2, 1.1, 0xf2efe6); b.ball(4 + sx * 2.7, 3.86, 21, .3, 0xffe9b0, 1.25); c.colliders.push({ x: 4 + sx * 2.7, z: 21, r: .6 });
        for (let k = 0; k < 16; k++) { const x = 4 + sx * (3.6 + k * .9); b.box(x, 0, 21, .07, 1.9, .07, 0x24222c); if (x > -23 && x < 9) c.colliders.push({ x, z: 21, r: .5 }); }
        b.box(4 + sx * 10.4, 1.8, 21, 14.4, .08, .08, 0x24222c); b.box(4 + sx * 10.4, .3, 21, 14.4, .08, .08, 0x24222c); }
      b.box(4, 3.5, 21, 5.4, .12, .2, 0x24222c); for (let k = 0; k <= 10; k++) { const t = k / 10 * Math.PI; b.dot(4 + Math.cos(t) * 2.5, 3.6 + Math.sin(t) * 1, 21.1, .07, 0xfff2c8, 1.25); }
      sign('LIGHTSCAPE', 4, 4.1, 21.14, 3.6, .7, { bg: '#1a1f5c', fg: '#ffe27a', border: '#ffe27a', glow: true });
      b.box(8, 0, 23.4, 1.8, 2.2, 1.6, 0x2f6a58); b.box(8, 2.2, 23.4, 2.2, .16, 2, 0xf2efe6); b.box(7.08, 1, 23.4, .06, .8, 1, 0xffe9b0, 0, 1.15); sign('TICKETS', 7.06, 2, 23.4, 1.4, .34, { bg: '#f2efe6', fg: '#1f5a35', border: '#1f5a35', ry: -Math.PI / 2 });
      for (const [x, z] of [[1.4, 17], [6.6, 17], [1.2, 23.6]]) { lamp(b, x, z, 0xffe9b0, 2.4); c.colliders.push({ x, z, r: .2 }); }
      for (const [x, z, s2, col] of [[-3, 18.2, 1.7, 0xd85a9a], [-8.4, 17.6, 1.9, 0x3d8ad8], [-14, 18.4, 1.8, 0x8a5ad8], [-19.4, 17.8, 1.9, 0x3fa878]]) { tree(b, x, z, s2, col); neonTree(x, z, s2, n++); c.colliders.push({ x, z, r: .55 }); }
      /* neon: every path is edged in a line of colour */
      const tube = (x, z, w, d, col) => b.box(x, .05, z, w, .07, d, col, 0, 1.2);
      tube(1.75, 16.2, .09, 6, NEON[0]); tube(6.25, 16.2, .09, 6, NEON[1]);                                   // in from the gate
      tube(-5, -.55, 8.2, .09, NEON[2]); tube(-5, 1.85, 8.2, .09, NEON[3]);                                   // through the light tunnel
      tube(-10.2, -5.8, .09, 9.6, NEON[1]); tube(-7.8, -5.8, .09, 9.6, NEON[0]);                              // north to the esplanade
      tube(-12.35, -21.6, .09, 23.4, NEON[0]); tube(-5.65, -21.6, .09, 23.4, NEON[2]);                        // down both sides of the lawn
      /* the wonderland part: glowing mushrooms and flowers taller than they should be, all through the grass */
      b.lo = true;
      const shroom = (x, z, s2, col) => { b.cyl(x, 0, z, .11 * s2, .62 * s2, 0xf2efe6, .7, 6, .75); b.ball(x, .6 * s2, z, .5 * s2, col, 1.15, .62);
        for (let j = 0; j < 3; j++) b.dot(x + Math.cos(j * 2.09 + x) * .3 * s2, (.82 - .02 * j) * s2, z + Math.sin(j * 2.09 + x) * .3 * s2, .07 * s2, 0xffffff, 1.25); c.colliders.push({ x, z, r: .22 * s2 }); };
      const bloom = (x, z, s2, col) => { b.cyl(x, 0, z, .05, 1.1 * s2, 0x3fa868, 1, 5, .7); for (let j = 0; j < 5; j++) b.dot(x + Math.cos(j * 1.257) * .24 * s2, 1.12 * s2, z + Math.sin(j * 1.257) * .24 * s2, .15 * s2, col, 1.15); b.dot(x, 1.2 * s2, z, .1 * s2, 0xffe27a, 1.25); c.colliders.push({ x, z, r: .15 }); };
      [[-2.4, 15.4, 1.5], [-5.6, 13.8, 1], [-10.8, 13.4, 1.7], [-16.4, 14.8, 1.2], [-21, 9, 1.6], [-17.4, -1.8, 1.1], [-6, -3.4, 1.4], [-11.9, -6.6, .9], [-3.4, -12.4, 1.6], [-1.6, -20.4, 1.2], [-3, -31, 1.7],
        [-11.4, 7.2, 1.3], [-4, 6.4, 1], [-7.6, 9.2, 1.6], [-14.6, 11.6, .9], [-2.6, 3.4, 1.2], [-21.2, -7, 1.3], [-6.2, -7.2, .8], [-15, 6.6, 1], [-1.8, 10.6, 1.4], [-9.4, 16.2, 1.1], [-20.2, 15.6, 1.4]]
        .forEach(([x, z, s2], i) => (i % 3 === 2 ? bloom : shroom)(x, z, s2, NEON[(i * 5 + 1) % 6]));
      b.lo = false;
      /* a signpost that is no help at all */
      b.cyl(-10.9, 0, -1.3, .06, 2.5, 0x3b3b4a, 1, 6); c.colliders.push({ x: -10.9, z: -1.3, r: .25 });
      sign('THIS WAY →', -10.9, 2.3, -1.24, 1.7, .34, { bg: '#1a0f3a', fg: '#ff7ad0', border: '#ff3fa4', glow: true });
      sign('← THAT WAY', -10.9, 1.86, -1.24, 1.7, .34, { bg: '#0f1f3a', fg: '#7af0ff', border: '#3fe0ff', glow: true });
      c.amb.push(ambient({ n: 70, col: 0xff7ad0, size: .11, area: 16, h: 4, vy: .25, drift: .5, add: false, opacity: .9 }), ambient({ n: 70, col: 0x7af0ff, size: .11, area: 16, h: 4, vy: .2, drift: .6, add: false, opacity: .9 }));
      /* the hot toddy cart */
      b.box(-13.2, .5, 0, 2, .9, 1.1, 0x9a3a2a); b.box(-13.2, 1.4, 0, 2.1, .08, 1.2, 0xd8b88a); for (const sx of [-1, 1]) { b.ball(-13.2 + sx * .8, .4, .58, .4, 0x2a2420, 0, 1); b.cyl(-13.2 + sx * .95, 1.4, -.45, .04, 1.3, 0x6a4a30, 1, 5); b.cyl(-13.2 + sx * .95, 1.4, .45, .04, 1.3, 0x6a4a30, 1, 5); }
      for (let k = -2; k <= 2; k++) b.box(-13.2 + k * .44, 2.7, 0, .44, .12, 1.5, k % 2 ? 0xe5484d : 0xfff6e6); b.cyl(-13.7, 1.48, 0, .22, .3, 0xc8ccd4, 1, 10); for (let k = 0; k < 4; k++) b.dot(-13.7 + Math.sin(k) * .1, 1.95 + k * .16, 0, .05, 0xffffff, 1.1);
      b.cyl(-12.8, 1.48, .1, .08, .16, 0xffe9b0, 1, 8); b.cyl(-12.55, 1.48, -.1, .08, .16, 0xffe9b0, 1, 8); sign('HOT TODDY', -13.2, 2.2, .78, 1.7, .36, { bg: '#2a1f18', fg: '#ffd27a', border: '#ffd27a', glow: true }); c.colliders.push({ x: -13.2, z: 0, r: 1.3 });
      person(7, -13.2, -1, 0, 0, { top: 0x2f6a58, cap: 0xe5484d });
      c.spawn = { x: 4, z: 24.3 };
    } },

  /* ───────────── 2 · THE HEIST — an indoor farm, after hours ─────────────
     Grow racks under purple light, gear on the floor, a van backed up to the loading bay, one guard with a flashlight. */
  { id: 'heist', shot: [6.4, 4.2], prop: 'tote', caption: 'we were never here', outfit: { her: { top: 0x1c1a1e, cap: 0x1c1a1e }, him: { top: 0x1c1a1e, cap: 0x1c1a1e } },
    kicker: 'date night · an indoor farm, after hours', title: 'The Heist', sub: 'the guard is in on it. he is also bad at it.',
    game: 'heist', icon: '$', stars: [1000, 2000, 3200],
    how: 'Fill plastic totes with gear and get them in the van before time runs out.\nA grab / put in a tote / set down · B throw (or dash, empty-handed)\nOne of you holds the tote, the other fills it. Big gear is worth the most: lean on it to push it. The guard is a friend. If he catches you, he says hi.',
    P: { time: 100, cap: 6, fine: 100, bounds: [-11.2, 12.2, -14.1, 7.4], van: [9.5, 13, .9, 5.1], vanDoor: [10.6, 3], door: { x: 9.25, z0: .6, z1: 5.4 },
      racks: [[-7.8, -6.2, -12, -3], [-2.3, -.7, -12, -3], [3.2, 4.8, -12, -3]],
      patrol: [[-9.6, -1.4], [-9.6, -13.1], [-4.25, -13.1], [-4.25, -1.6], [1.25, -1.6], [1.25, -13.1], [6.6, -13.1], [6.6, -1.4], [0, 4.6], [-8, 4.6]],
      guard: { fov: .6, range: 6.5, walk: 2.3, chase: 4.7, hi: ['i saw nothing', 'nice antlers', 'need a hand? no? ok', 'you missed a pump', 'shh. i am patrolling', 'is that my flashlight? keep it', 'tell no one. hi though'], look: { skin: 0xd59a70, hair: 0x1a1412, top: 0x3d5a9a, legs: 0x23252e, cap: 0x23252e, beard: 0x1a1412 } },
      itemSpots: [[-9.6, -11], [-9.6, -9], [-9.6, -7], [-9.6, -5], [-9.6, -3.4], [-4.25, -11], [-4.25, -9], [-4.25, -7], [-4.25, -5], [-4.25, -3.4], [1.25, -11], [1.25, -9], [1.25, -7], [1.25, -5], [1.25, -3.4],
        [6.6, -11], [6.6, -9], [6.6, -7], [6.6, -5], [6.6, -3.4], [-8, -13.3], [-1.6, -13.3], [3.4, -13.3], [-6, 1], [-3, 4.2], [0, 1.6], [-8.6, 5.6], [-1, 6]],
      items: [['light', 5], ['seeds', 2], ['ballast', 3], ['fan', 3], ['meter', 3], ['jug', 3], ['trim', 3], ['pump', 4]],
      bigs: [['dehu', 6.6, -13.2], ['tank', -10, -12.8]], totes: [[4.6, 1.6], [4.6, 3.2], [6.2, 1.6], [6.2, 3.2], [5.4, 5.2]],
      types: {
        tote:    { tote: true, label: 'tote', price: 0, vol: 0, w: 1, build(b) { b.box(0, 0, 0, .9, .08, .6, 0x3d6ad8); b.box(0, .08, .3, .9, .5, .06, 0x3d6ad8); b.box(0, .08, -.3, .9, .5, .06, 0x3d6ad8); b.box(.45, .08, 0, .06, .5, .66, 0x3d6ad8); b.box(-.45, .08, 0, .06, .5, .66, 0x3d6ad8); b.box(0, .54, .33, 1, .07, .08, 0xffd23a); b.box(0, .54, -.33, 1, .07, .08, 0xffd23a); } },
        light:   { label: 'LED grow light', price: 400, vol: 3, w: 2, build(b) { b.box(0, 0, 0, 1, .12, .55, 0x2a2a33); b.box(0, -.03, 0, .86, .04, .42, 0xd05aff, 0, 1.25); b.box(0, .12, 0, .1, .2, .1, 0x9aa0a8); } },
        seeds:   { label: 'seed vault', price: 500, vol: 1, w: 1, build(b) { b.box(0, 0, 0, .42, .34, .34, 0x2f6a45); b.box(0, .34, 0, .44, .06, .36, 0xffd77e); b.box(0, .12, .18, .1, .1, .03, 0xffd77e); } },
        ballast: { label: 'ballast', price: 250, vol: 2, w: 4, build(b) { b.box(0, 0, 0, .6, .28, .4, 0x55566a); for (let k = -2; k <= 2; k++) b.box(k * .11, .28, 0, .04, .1, .4, 0x9aa0a8); } },
        fan:     { label: 'clip fan', price: 120, vol: 2, w: 1.5, build(b) { b.cyl(0, 0, 0, .2, .06, 0x2a2a33, 1, 8); b.cyl(0, .06, 0, .04, .34, 0x2a2a33, 1, 5); b.ball(0, .56, 0, .26, 0xf2efe6, 0, 1); b.ball(0, .56, .1, .1, 0x3d8bd9); } },
        pump:    { label: 'water pump', price: 180, vol: 2, w: 2.5, build(b) { b.box(0, 0, 0, .5, .08, .34, 0x2a2a33); b.cyl(-.08, .08, 0, .17, .3, 0x3d8bd9, 1, 8); b.box(.2, .08, 0, .18, .2, .22, 0x9aa0a8); b.cyl(.2, .28, 0, .05, .14, 0x2a2a33, 1, 5); } },
        meter:   { label: 'pH meter', price: 90, vol: 1, w: .4, build(b) { b.box(0, 0, 0, .2, .42, .1, 0xffd23a); b.box(0, .22, .06, .14, .14, .02, 0x9bffb0, 0, 1.2); b.box(0, -.12, 0, .06, .14, .06, 0x9aa0a8); } },
        jug:     { label: 'nutrient jug', price: 60, vol: 2, w: 3, build(b) { b.cyl(0, 0, 0, .22, .44, 0xf2efe6, 1, 8); b.cyl(0, .44, 0, .08, .1, 0xe5484d, 1, 6); b.box(0, .14, .23, .26, .18, .02, 0x4fae6a); } },
        trim:    { label: 'trimmers', price: 40, vol: 1, w: .3, build(b) { b.box(.06, 0, 0, .05, .04, .4, 0xc8ccd4, .25); b.box(-.06, 0, 0, .05, .04, .4, 0xc8ccd4, -.25); b.ball(.1, .03, -.2, .07, 0xe5484d); b.ball(-.1, .03, -.2, .07, 0xe5484d); } },
        dehu:    { big: true, r: .8, label: 'dehumidifier', price: 1100, vol: 9, w: 7, build(b) { b.box(0, .1, 0, 1.1, 1.3, .8, 0xf2efe6); for (let k = 0; k < 5; k++) b.box(0, .5 + k * .15, .41, .8, .05, .02, 0x9aa0a8); b.box(0, 1.2, .41, .3, .12, .02, 0x9bffb0, 0, 1.2); for (const sx of [-1, 1]) b.ball(sx * .4, .12, .3, .12, 0x2a2a33); } },
        tank:    { big: true, r: .6, label: 'CO2 tank', price: 700, vol: 9, w: 4.5, build(b) { b.cyl(0, 0, 0, .34, 1.4, 0x4fae6a, 1, 10); b.ball(0, 1.4, 0, .34, 0x4fae6a, 0, .6); b.cyl(0, 1.56, 0, .1, .2, 0xc8ccd4, 1, 6); b.box(.14, 1.62, 0, .2, .08, .08, 0xe5484d); } },
      } },
    build(b, c) {
      sky(0x0b0c22, 0x1a1c44, 0x12142e, 200); lights(0xf4f2ff, 0x8a8a96, 2.5, 0xffffff, 1.7, -3, 10, 6); fog(0x2a2c44, 34, 80);          // dark outside, but the room itself is bright: grey floor, white walls
      const FLOOR = 0xa6a8b0, WALL = 0xeef0f4, STEEL = 0x9aa0a8, ORANGE = 0xf07a1a;
      b.box(0, -.3, -3.3, 21.4, .3, 22.6, FLOOR); b.box(22, -.32, -3.3, 24, .3, 40, 0x3a3c4a);                              // slab, and the lot outside
      for (let x = -9; x <= 9; x += 6) b.box(x, .001, -3.3, .06, .012, 22, 0x8e9098); b.box(0, .002, -2, 20.6, .014, .12, 0xffd23a);
      b.box(0, 0, -14.9, 22, 4.4, .5, WALL); b.box(-11.9, 0, -3.5, .5, 4.4, 23, WALL);                                       // back and west walls
      b.box(9.25, 0, -6.8, .5, 4.4, 14.6, WALL); b.box(9.25, 0, 6.6, .5, 4.4, 2, WALL); b.box(9.25, 3.3, 3, .5, 1.1, 5.2, WALL); b.box(9.25, 3.2, 3, .6, .14, 5.2, 0xffd23a);   // east wall with the loading bay
      for (let z = -14; z <= .2; z += .9) c.colliders.push({ x: 9.25, z, r: .5 }); for (let z = 5.9; z <= 7.6; z += .8) c.colliders.push({ x: 9.25, z, r: .5 });
      sign('LOADING', 9.0, 3.85, 3, 2.4, .5, { bg: '#1c1a24', fg: '#ffd23a', border: '#ffd23a', ry: -Math.PI / 2 }); sign('SECTOR 7 · PROPAGATION', 2.6, 3.4, -14.62, 6, .6, { bg: '#f2efe6', fg: '#2f6a45', border: '#2f6a45' });
      for (const r of c.P.racks) { const x = (r[0] + r[1]) / 2;                                                              // grow racks: two shelves of plants under LED bars
        for (let z = r[2] + .4; z <= r[3]; z += 1.05) c.colliders.push({ x, z, r: .95 });
        const apart = x > 3;                                                                                                  // the east rack is half taken apart
        for (const z of [r[2] + .15, (r[2] + r[3]) / 2, r[3] - .15]) for (const sx of [-1, 1]) b.box(x + sx * .72, 0, z, .1, 2.7, .1, ORANGE);
        for (const y of apart ? [.5] : [.5, 1.5]) for (const sx of [-1, 1]) b.box(x + sx * .72, y - .1, (r[2] + r[3]) / 2, .08, .14, 9, ORANGE);
        if (apart) { for (let k = 0; k < 4; k++) b.box(x - .3 + k * .2, 1.42 + (k % 2) * .1, (r[2] + r[3]) / 2 + .6, .09, .12, 8.2, ORANGE, 0, 0, 0, .05 * (k - 1.5)); b.box(x, 1.5, r[2] + .15, 1.5, .1, .1, ORANGE, .3); }   // loose beams laid across where the top shelf was
        for (const y of apart ? [.5] : [.5, 1.5]) { b.box(x, y, (r[2] + r[3]) / 2, 1.6, .08, 9, 0xf2efe6); for (let z = r[2] + .5; z < r[3]; z += .75) { b.ball(x - .35, y + .3, z, .26, y > 1 ? 0x4fae6a : 0x3f9a52, 0, .9); b.ball(x + .35, y + .28, z + .3, .24, 0x58b870, 0, .9); } }
        for (const sx of [-1, 1]) { b.box(x + sx * .45, 2.6, (r[2] + r[3]) / 2, .22, .08, 9, 0x2a2a33); b.box(x + sx * .45, 2.56, (r[2] + r[3]) / 2, .16, .04, 8.8, 0xe06aff, 0, 1.25); } b.box(x, .003, (r[2] + r[3]) / 2, 2.6, .012, 9.6, 0xa87ac8); }
      // dismantled shelving: beams stacked on the floor, uprights leaning on the walls
      for (const [x, z, n] of [[8.5, -7, 6], [-11.2, -6, 4]]) { for (let k = 0; k < n; k++) b.box(x + (k % 2) * .2 - .1, .02 + (k >> 1) * .15, z, .12, .13, 2.6, ORANGE, (x > 0 ? .05 : 0) * (k - 2)); c.colliders.push({ x, z: z - .9, r: .4 }, { x, z, r: .4 }, { x, z: z + .9, r: .4 }); }   // kept tight to the walls, out of every route
      for (let k = 0; k < 5; k++) b.box(-6.4 + k * .34, 0, -14.5, .1, 2.9, .1, ORANGE, 0, 0, -.16);                           // uprights against the back wall
      for (let k = 0; k < 3; k++) b.box(8.9, 0, -12.6 + k * .4, .1, 2.6, .1, ORANGE, 0, 0, 0, .12);
      // grow lights everywhere: hung along the back wall, and a stack waiting to be carried out
      for (let k = 0; k < 7; k++) { const x = -9.6 + k * 2.9; b.box(x, 2.5, -14.55, 1.6, .5, .08, 0x2a2a33); b.box(x, 2.5, -14.5, 1.44, .38, .04, [0xe06aff, 0xff7ad0, 0xb48aff][k % 3], 0, 1.25); }
      for (let k = 0; k < 4; k++) { b.box(-11.3, .04 + k * .16, 1.2, .6, .12, 1.1, 0x2a2a33, k * .12); b.box(-11.3, .16 + k * .16, 1.2, .46, .02, .9, 0xe06aff, k * .12, 1.2); }
      // pumps and hoses by the water barrels
      for (const [x, z] of [[-10.6, 2.4], [-9.5, 6.9]]) { b.box(x, 0, z, .6, .08, .4, 0x2a2a33); b.cyl(x - .1, .08, z, .2, .36, 0x3d8bd9, 1, 8); b.box(x + .24, .08, z, .2, .24, .26, STEEL); }
      b.box(-10.55, .03, 3, .07, .06, 1.2, 0x23252e); b.box(-10, .03, 6.3, .07, .06, 1.3, 0x23252e, .9); b.box(-10.2, .03, 2.4, 1, .06, .07, 0x4fae6a);
      sign('EVERYTHING MUST GO', -7, 3.4, -14.62, 4.4, .5, { bg: '#f07a1a', fg: '#ffffff', border: '#ffffff' });
      b.box(-8, 0, 2, 2.6, .9, 1, 0x6a5240); b.box(-8, .9, 2, 2.8, .08, 1.2, STEEL); b.box(-8.6, .98, 2, .5, .3, .4, 0x2a2a33); c.colliders.push({ x: -8.7, z: 2, r: .8 }, { x: -7.3, z: 2, r: .8 });   // workbench
      for (const z of [-1, 1.2]) { b.cyl(-10.5, 0, z + 4.6, .62, 1.3, 0x3d8bd9, 1, 12); b.cyl(-10.5, 1.3, z + 4.6, .64, .06, 0x2a2a33, 1, 12); c.colliders.push({ x: -10.5, z: z + 4.6, r: .7 }); }           // water barrels
      for (let k = 0; k < 4; k++) b.box(-11.6, 3.6, -12 + k * 5, .1, .1, .1, 0x2a2a33); b.box(-11.55, 3.3, 5.6, .14, .34, .5, 0x2a2a33); b.box(-11.46, 3.36, 5.6, .04, .1, .1, 0xff3a30, 0, 1.25);        // a camera, mostly for show
      // the van, backed up to the bay
      b.box(15.4, .5, 3, 4.6, 2.3, 2.5, 0xf2efe6); b.box(18.5, .5, 3, 1.7, 1.6, 2.4, 0xf2efe6); b.box(18.9, 1.3, 3, .9, .7, 2.2, 0x26304a); b.box(13.2, .56, 3, .3, 2.1, 2.2, 0x23252e);
      for (const sz of [-1, 1]) { b.box(12.9, .5, 3 + sz * 1.7, .1, 2.2, 1.2, 0xe4e0d6, sz * .9); for (const x of [14.2, 17.6]) b.ball(x, .45, 3 + sz * 1.25, .46, 0x18181e); }
      b.box(11.2, 0, 3, 3.6, .06, 4.2, 0xffd23a); b.box(11.2, .005, 3, 3.2, .062, 3.8, 0x55566a); sign('NO QUESTIONS\nMOVING CO.', 15.4, 1.9, 4.27, 3.4, 1.1, { bg: '#f2efe6', fg: '#3d5a9a', border: '#3d5a9a' });
      c.amb.push(ambient({ n: 50, col: 0xe8a8ff, size: .07, area: 10, h: 3, drift: .2 }));
      c.spawn = { x: 10.6, z: 3 };
    } },

  /* ───────────── 3 · METAH'S WEDDING — a garden ceremony in Portland ───────────── */
  { id: 'metah', tint: 0xd0ccf6, shot: [0, .4], prop: 'toast', caption: 'a slow dance by the lake',
    outfit: { him: { top: 0x2a2a33, legs: 0x2a2a33, tie: 0xc9b6e6 }, her: { top: 0xf2c9c2, dots: 0xd9628a } },
    kicker: 'August 24, 2024 · Portland, Oregon', title: "Metah's Wedding", sub: 'a white tent, a lake, a bathroom up a hill.',
    game: 'dance', icon: '❀', stars: [25, 50, 80],
    how: 'A slow dance on the lawn by the lake. You dance together: one of you leads a move, the other answers it on the next beat.\nWhen it is your lead, pick any move as the ring closes. When you follow, copy the move in the bubble as the ring closes.\n◀ ▶ step · ▼ dip · A when it says together',
    P: { time: 46, bpm: 112, moves: ['LEFT', 'RIGHT', 'DOWN', 'A'], at: [0, 1.4], cam: [0, 4.2, 11.6, 0, 2.5, 0], col: 0xff9ab8 },
    build(b, c) {
      sky(0x06071e, 0x1a1c58, 0x141640, 700); lights(0x8088dc, 0x2a4a3c, 1.5, 0xffd8b0, 1.15, -5, 10, 7); fog(0x141640, 34, 110); orb(-50, 44, -120, 6, 0xe8ecff, 1.2);
      turf(200, 200, 0x2c6a4c);                                                                                               // the big lawn: the reception is right here, next to the lake
      /* the lake, straight ahead, with the moon on it */
      b.box(0, .02, -52, 240, .04, 84, 0x223a8c); b.box(0, .03, -9.9, 240, .05, .9, 0x7a7460);
      for (let k = 0; k < 16; k++) b.box(-9 - k * 2.1 + Math.sin(k * 2.1) * 1.4, .05, -13 - k * 4.4, 1.6 - k * .05, .02, .16, 0xdfe6ff, 0, 1.1);
      for (const [x, z, r2] of [[40, -108, 26], [86, -100, 22], [-84, -104, 24], [0, -116, 20]]) b.ball(x, -8, z, r2, 0x14302e, 0, .45);      // the far shore
      /* one side: a giant hill */
      b.ball(-24, -4, -14, 19, 0x1f5242, 0, .85); b.ball(-40, -4, -30, 20, 0x1a4638, 0, .7);
      /* the other side: a small bathroom, up its own little hill, with steps and a light on */
      const HX = 9.6, HZ = -10.5, hillY = (x, z) => -2.2 + 4.5 * Math.sqrt(Math.max(0, 1 - ((x - HX) ** 2 + (z - HZ) ** 2) / 56.25));
      b.ball(HX, -2.2, HZ, 7.5, 0x2a6650, 0, .6);
      b.box(HX, 2.2, HZ, 2.6, 2, 2, 0xe8e0d0); b.box(HX, 4.2, HZ, 3, .22, 2.4, 0x6a5a50); b.box(HX - .5, 2.25, HZ + 1.01, .7, 1.5, .05, 0x5a4030); b.box(HX + .65, 3.2, HZ + 1.01, .5, .4, .05, 0xffe9b0, 0, 1.2);
      b.cyl(HX - 1.7, 2.1, HZ + 1.2, .05, 2, 0x3b3b4a, 1, 5); b.ball(HX - 1.7, 4.2, HZ + 1.2, .18, 0xffe9b0, 1.25);
      sign('RESTROOM', HX, 3.85, HZ + 1.03, 1.5, .3, { bg: '#f2efe6', fg: '#2a3a6a', border: '#2a3a6a' });
      for (let k = 0; k < 8; k++) { const t = k / 7, x = 7.6 + (HX - .5 - 7.6) * t, z = -4 + (HZ + 1.6 + 4) * t; b.box(x, Math.max(0, hillY(x, z)) - .1, z, .9, .16, .6, 0xb8ae9c, .6); }
      /* the small white tent on the shore, where the ceremony was */
      const TZ = -6;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cyl(sx * 3.3, 0, TZ + sz * 2.3, .09, 2.7, 0xffffff, 1, 6);
      b.cyl(0, 2.7, TZ, 4.9, 1.9, 0xffffff, .001, 4); b.ball(0, 4.65, TZ, .14, 0xffe9b0, 1.25);
      for (const sz of [-1, 1]) b.box(0, 2.42, TZ + sz * 2.3, 6.8, .34, .06, 0xf2efe6); for (const sx of [-1, 1]) b.box(sx * 3.3, 2.42, TZ, .06, .34, 4.7, 0xf2efe6);
      for (let k = 0; k <= 12; k++) b.dot(-3.3 + k * .55, 2.34, TZ + 2.36, .06, 0xffe9b0, 1.25);
      b.box(0, .01, TZ + 3.4, 1.6, .03, 6.6, 0xf6ecd8);                                                                          // the aisle runner, out of the tent and onto the lawn
      b.box(-1.1, 0, TZ - 1.7, .12, 2.1, .12, 0xffffff); b.box(1.1, 0, TZ - 1.7, .12, 2.1, .12, 0xffffff); b.box(0, 2.1, TZ - 1.7, 2.4, .14, .14, 0xffffff);   // a small arch at the back of it, the lake behind
      for (let i = 0; i < 7; i++) b.ball(-1.05 + i * .35, 2.26 + Math.sin(i * 1.3) * .1, TZ - 1.62, .2, [0xff9ab8, 0xffffff, 0xd9628a, 0x8fbf7a][i % 4]);
      person(3, 0, TZ - 1.2, 0, 0, { top: 0x2a2a33 });
      let n = 0; for (const sx of [-1, 1]) for (let r = 0; r < 2; r++) for (let k = 0; k < 2; k++) { const x = sx * (1.5 + k * .95), z = TZ + .9 - r * 1.1; chair(b, x, z, Math.PI); if ((n++ * 7) % 4) person(n, x, z + .05, Math.PI); }
      /* the reception: round tables on the lawn, lights strung from the tent out over them */
      [[-7.4, -2.2], [7.6, -2], [-10.4, 1.2]].forEach(([x, z], i) => { b.cyl(x, 0, z, .12, .72, 0x8a8a96, 1, 6); b.cyl(x, .72, z, 1, .07, 0xf6f2ea, 1, 12); b.cyl(x, .5, z, 1.02, .22, 0xe8e2d6, 1, 12); b.cyl(x, .79, z, .1, .2, 0xff9ab8, .7, 6); b.dot(x + .3, .9, z + .1, .06, 0xffe9b0, 1.25);
        person(20 + i * 3, x - .9, z - .7, .6); person(21 + i * 3, x + .95, z - .55, -.7); if (i % 2) person(22 + i * 3, x, z - 1.15, 0); });
      b.box(-5.6, 0, -4.6, 2.4, .8, .8, 0xf6f2ea); for (let k = 0; k < 5; k++) b.cyl(-6.5 + k * .45, .8, -4.6, .09, .24, [0xffd27a, 0xff9ab8, 0xc9b6e6][k % 3], .8, 6);   // the drinks table
      for (const sx of [-1, 1]) { b.cyl(sx * 10.5, 0, -1.2, .08, 4.2, 0xfff6e6, 1, 6); stringLights(b, sx * 3.3, TZ + 2.3, sx * 10.5, -1.2, 3.4, [0xffd27a, 0xffffff], 12, .8); }
      stringLights(b, -10.5, -1.2, 10.5, -1.2, 4.2, [0xffd27a, 0xffffff, 0xff9ab8], 22, 1.2);
      for (const [x, z, sc] of [[20.5, -6, 2], [24, -13, 2.4]]) tree(b, x, z, sc, 0x2c6a4c);
      c.amb.push(ambient({ n: 60, col: 0xffb3d1, size: .12, area: 11, h: 9, vy: -.7, add: false, opacity: .85 }));
    } },

  /* ───────────── 4 · ANTHONY & NICKA'S WEDDING — the reception ───────────── */
  { id: 'wedding', tint: 0xd0ccf6, shot: [0, 1.2], prop: 'toast', caption: 'we closed the dance floor', outfit: { him: { top: 0x2a2a33, tie: 0x8a2a3a, legs: 0xc2313a } }, kicker: 'September 7, 2024', title: "Anthony & Nicka's Wedding", sub: 'red pants. rain jacket. no regrets.',
    game: 'dance', icon: '♪', stars: [25, 50, 80],
    how: 'Own the dance floor, together. One of you leads a move, the other answers it on the next beat, and the lead swaps.\nYour lead: pick any move as the ring closes. Following: copy the move in the bubble as the ring closes.\n◀ ▶ step · ▲ spin · ▼ dip · A jump',
    P: { time: 48, bpm: 112, at: [0, -2.4], col: 0xffd77e },
    build(b, c) {
      sky(0x07061e, 0x221a5c, 0x181244, 700); lights(0x8c82dc, 0x2a4a3e, 1.55, 0xffcca8, 1.3, 3, 8, 6); fog(0x181244, 30, 96);
      island(b, 26, 0x2a6a50, { woods: 0x1a4a3a, hills: 0x181c50 });
      b.box(0, 0, -7, 9.6, .05, 19.6, 0x6a4a30);                                                                             // parquet dance floor
      for (let x = -3; x < 3; x++) for (let z = -10; z < 2; z++) b.box(x * 1.5 + .75, .05, z * 1.6 + .2, 1.46, .03, 1.56, (x + z) & 1 ? 0xc89a62 : 0xb5854f);
      for (const sx of [-1, 1]) for (const z of [-17.4, 3.6]) b.cyl(sx * 5.4, 0, z, .09, 4.2, 0xfff6e6, 1, 6);                 // tent poles and strings of lights overhead
      for (let k = 0; k < 6; k++) { const z = 3.6 - k * 4.2; for (let i = 0; i <= 14; i++) { const t = i / 14; b.dot(-5.4 + t * 10.8, 4.2 - Math.sin(t * Math.PI) * .9, z, .06, 0xffe9a0, 1.25); } }
      b.box(0, 0, -18.6, 3.4, 1, 1, 0x2a2a33); for (const sx of [-1, 1]) { b.box(sx * 2.6, 0, -18.6, 1, 2, .9, 0x1c1a24); b.cyl(sx * 2.6, 1.3, -18.14, .32, .04, 0x55555f, 1, 10); }                                  // DJ booth + speakers
      sign('A ♥ N', 0, 2.5, -18.9, 2.6, 1, { bg: '#2a1f5c', fg: '#ffd77e', border: '#ffd77e', glow: true });
      let n = 0; for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) { const x = sx * (7.6 + (i % 2) * 1.6), z = 1 - i * 4.6; roundTable(b, x, z); person(n++ + 2, x - sx * 1.2, z - .9, sx > 0 ? -1.2 : 1.2); person(n++ + 5, x + sx * .6, z + 1.2, sx > 0 ? -2 : 2); }
      b.box(-9, 0, -15, 2.4, .8, .8, 0xfff6e6); b.cyl(-9, .8, -15, .5, .3, 0xffffff, 1, 12); b.cyl(-9, 1.1, -15, .36, .26, 0xffffff, 1, 12); b.cyl(-9, 1.36, -15, .22, .22, 0xff9ab8, 1, 12);                    // the cake
      c.amb.push(ambient({ n: 50, col: 0xffe9a0, size: .1, area: 10, h: 6 }));
    } },

  /* ───────────── 5 · NEW ORLEANS — a TO DO list in the French Quarter (the whole level lives in nola.js) ───────────── */
  NOLA,

  /* ───────────── 6 · NOAH & CHLOE'S WEDDING — the reason for the trip: a courtyard in the Quarter, a brass band ───────────── */
  { id: 'noahchloe', tint: 0xd0ccf6, shot: [0, .6], prop: 'toast', caption: 'the reason we came', outfit: { him: { top: 0x2a2a33, tie: 0x4fae6a }, her: { top: 0x3fb8a8, dots: 0xfff2a8, collar: 0xffffff } },
    kicker: 'April 2025 · New Orleans', title: "Noah & Chloe's Wedding", sub: 'the whole reason we went. also the beignets.',
    game: 'dance', icon: '♫', stars: [25, 50, 80],
    how: 'A courtyard in the French Quarter and a brass band that will not slow down.\nYour lead: pick any move as the ring closes. Following: copy the move in the bubble as the ring closes.\n◀ ▶ step · ▲ spin · ▼ dip · A jump',
    P: { time: 48, bpm: 120, at: [0, -.6], col: 0xffd27a },
    build(b, c) {
      sky(0x07061e, 0x221a5c, 0x181244, 600); lights(0x8c82dc, 0x3a3a4a, 1.55, 0xffcca8, 1.3, 3, 8, 6); fog(0x181244, 30, 90);
      const BRICK = 0xa8604e, IRON = 0x24222c, CREAM = 0xf2e6c8;
      b.box(0, -.3, -4, 60, .3, 60, 0x55535e);
      b.box(0, 0, -3, 15, .05, 14, 0x9a5a48); for (let x = -7; x < 7; x++) for (let z = -9; z < 4; z++) if ((x + z) & 1) b.box(x + .5, .05, z + .5, .96, .02, .96, 0xb06a54);   // the brick courtyard
      /* the house at the back: stucco wall, tall shuttered doors, an iron gallery above with ferns and beads on the rail */
      b.box(0, 0, -11.4, 17, 7.4, 1.4, 0xe8b86a); b.box(0, 7.4, -11.4, 17.4, .3, 1.8, 0x6a4a40);
      for (let k = -2; k <= 2; k++) { const x = k * 3.2; b.box(x, 0, -10.66, 1.3, 2.7, .06, 0x2f6a58); b.box(x, 0, -10.63, .06, 2.7, .06, 0x1f4a3e); b.box(x, 3.9, -10.66, 1.3, 2.3, .06, 0x2f6a58); b.box(x, 3.95, -10.6, 1, 1.5, .04, 0xffe9b0, 0, 1.1); }
      b.box(0, 3.5, -10, 17, .14, 1.5, 0x3a3540); for (let k = 0; k <= 34; k++) b.box(-8.4 + k * .494, 3.64, -9.3, .05, .85, .05, IRON); b.box(0, 4.46, -9.3, 17, .07, .07, IRON);
      for (let k = -3; k <= 3; k++) { b.box(k * 2.7, 0, -9.3, .1, 3.5, .1, IRON); b.ball(k * 2.7 + 1.35, 3.95, -9.4, .34, 0x3f9a52, 0, .7); }
      for (let k = 0; k < 22; k++) b.dot(-8 + k * .76, 4.3 - Math.abs(Math.sin(k * 1.57)) * .3, -9.22, .07, [0xb04ad9, 0xffd27a, 0x4fae6a][k % 3], 1.2);
      sign('N ♥ C', 0, 5.9, -10.62, 2.6, .9, { bg: '#2a1f5c', fg: '#ffd77e', border: '#ffd77e', glow: true });
      /* side walls, a fountain, palms in pots, lights strung across */
      for (const sx of [-1, 1]) { b.box(sx * 8.2, 0, -4, .6, 3.4, 15, BRICK); for (let k = 0; k < 4; k++) b.ball(sx * 7.8, 3.2, -9 + k * 3.4, .7, 0x2f7a4a, 0, .7);
        b.cyl(sx * 6.6, 0, -8.2, .5, .7, 0xb86a4a, .8, 8); b.cyl(sx * 6.6, .7, -8.2, .1, 2.3, 0x8a7a5a, .8, 5); for (let k = 0; k < 5; k++) b.ball(sx * 6.6 + Math.cos(k * 1.257) * .5, 3.05, -8.2 + Math.sin(k * 1.257) * .5, .5, 0x3f9a52, 0, .35); }
      b.cyl(-5.2, 0, -6.6, 1.1, .5, 0xd8cab8, 1, 12); b.cyl(-5.2, .5, -6.6, .9, .04, 0x2a3a8a, 1, 12); b.cyl(-5.2, .5, -6.6, .16, .9, 0xd8cab8, .8, 8); b.ball(-5.2, 1.5, -6.6, .22, 0xd8cab8);
      for (let k = 0; k < 4; k++) { const z = 2.4 - k * 3.6; for (let i = 0; i <= 16; i++) { const t = i / 16; b.dot(-7.9 + t * 15.8, 4.4 - Math.sin(t * Math.PI) * 1, z, .06, i % 4 ? 0xffe9a0 : [0xb04ad9, 0x4fae6a][k % 2], 1.25); } }
      /* the brass band, on the right, and everyone else around the edge */
      b.box(5.4, 0, -7.6, 3.6, .25, 2, 0x3a3540); for (let k = 0; k < 4; k++) { person(30 + k, 4.1 + k * .85, -7.6, -.3, .25, { top: k % 2 ? 0xf2efe6 : 0x2a2a33, cap: 0x2a2a33 }); b.cyl(4.1 + k * .85, 1.05, -7.2, .13, .34, 0xffd23a, .5, 6, .4); }
      b.cyl(6.9, .25, -6.9, .45, .6, 0xe5484d, 1, 10); b.cyl(6.9, .85, -6.9, .46, .04, 0xf2efe6, 1, 10);
      let n = 0; for (const sx of [-1, 1]) for (let i = 0; i < 2; i++) { const x = sx * 6.2, z = 1.6 - i * 3.6; roundTable(b, x, z); person(n++ + 12, x - sx * 1, z - .9, sx > 0 ? -1.2 : 1.2); person(n++ + 15, x + sx * .3, z - 1.3, sx > 0 ? -.6 : .6); }
      for (const [x, z, f] of [[-3.4, -8.4, .3], [-2.2, -8.9, .1], [1.2, -8.8, -.1], [2.6, -8.3, -.3], [-6.6, -3.4, 1.2], [6.8, -3.2, -1.2]]) person(n++ + 20, x, z, f);
      b.box(-6.4, 0, -9.6, 2.2, .8, .8, 0xfff6e6); for (let k = 0; k < 6; k++) b.ball(-7.1 + k * .28, .92, -9.6, .11, 0xf2e6c8);                                                  // a table of beignets, obviously
      c.amb.push(ambient({ n: 50, col: 0xffe9a0, size: .1, area: 9, h: 6 }));
    } },

  /* ───────────── 7 · WAITING FOR GODOT — West 44th Street to the Hudson Theatre ───────────── */
  { id: 'godot', shot: [0, 0], prop: 'playbill', caption: 'nothing happens, twice. we loved it.', kicker: 'October 22, 2025 · Hudson Theatre', title: 'Waiting for Godot', sub: 'he never shows. we did, barely.',
    game: 'runner', icon: '★', stars: [30, 70, 110],
    how: 'Curtain is at 2:00 and West 44th is jammed.\n◀ ▶ change lane around the cabs · A jumps the barricades · grab the tickets',
    P: { time: 38, shape: 'ticket', col: 0xffd77e, obsCol: [0xffd23a, 0xffd23a, 0x2a2a33, 0xf2efe6], hitPop: 'taxi!', note: '', side: 'lamp', sideX: 4.5, sideScale: 1.15 },
    build(b, c) {
      sky(0x4a80d8, 0xbfe0ff, 0xbfe0ff); lights(0xdfeeff, 0x8a8a98, 1.9, 0xfff2d8, 2.0, 5, 10, 6); fog(0xcfe4f8, 46, 130);
      b.box(0, -.3, -52, 7.8, .3, 150, 0x55566a); for (const sx of [-1, 1]) { b.box(sx * 7.4, -.3, -52, 7, .46, 150, 0xb8b4c0); b.box(sx * 3.96, -.3, -52, .16, .48, 150, 0xd8d4e0); }                 // street, sidewalks, curbs
      const WALL = [0xc8a888, 0xb0866a, 0xd8ccb8, 0x9a8aa8, 0xc0b0a0, 0xa87060];
      for (let i = 0; i < 12; i++) for (const sx of [-1, 1]) { const z = 4 - i * 7.2, h = 9 + ((i * 31 + (sx > 0 ? 7 : 0)) % 9), col = WALL[(i + (sx > 0 ? 2 : 0)) % 6], x = sx * 9.2;
        b.box(x, 0, z, 6, h, 7, col); b.box(x, 0, z, 6.1, 2.6, 7.05, 0xe8e0d0); b.box(x, h, z, 6.3, .3, 7.2, 0xe8e0d0);
        for (let f = 0; f < Math.floor((h - 3) / 1.5); f++) for (let k = -2; k <= 2; k++) b.box(sx * 6.17, 3.1 + f * 1.5, z + k * 1.3, .05, .9, .7, 0x4a5a78);
        b.box(sx * 5.9, 2.4, z, .5, .3, 3.6, [0xe5484d, 0x1f7a45, 0x3d8bd9, 0xffb347][(i + (sx > 0 ? 1 : 0)) % 4]); b.box(sx * 6.16, .2, z, .05, 2, 1.4, 0x3a2a26); }                              // awnings + doors
      sign('W 44 St', -4.6, 3.4, -4, 1.7, .42, { bg: '#1f7a45' }); b.cyl(-4.6, .16, -4.02, .05, 3.5, 0x9aa0a8, 1, 5); sign('ONE WAY', 4.6, 2.9, -10, 1.5, .42, { bg: '#1c1a24' }); b.cyl(4.6, .16, -10.02, .05, 3, 0x9aa0a8, 1, 5);
      // the Hudson Theatre: tan brick over a limestone base, marquee hung on tie rods
      b.box(0, 0, -90, 15, 12, 6, 0xc8a878); b.box(0, 0, -89.9, 15.2, 3, 6, 0xe8e0d0); b.box(0, 12, -90, 15.6, .5, 6.4, 0xe8e0d0);
      for (let k = -2; k <= 2; k++) { b.box(k * 2.6, 5, -86.95, 1.3, 2.4, .08, 0x3a4a68); b.cyl(k * 2.6, 7.4, -86.99, .65, .08, 0x3a4a68, 1, 10); b.box(k * 2.6, 9.2, -86.95, 1.3, 1.5, .08, 0x3a4a68); }
      for (const k of [-1, 0, 1]) b.box(k * 2.4, .16, -86.95, 1.7, 2.5, .08, 0x5a2a20);
      b.box(0, 3.3, -85.4, 8.6, .7, 3.2, 0x2a2a33); for (let k = -9; k <= 9; k++) b.dot(k * .45, 3.24, -83.86, .07, 0xffe9a0, 1.25); for (const sx of [-1, 1]) b.box(sx * 3.9, 4, -86, .05, 3.3, .05, IRON, 0, 0, .75);
      sign('WAITING FOR GODOT', 0, 3.65, -83.78, 8.2, .56, { bg: '#fff6e0', fg: '#1c1a24', glow: true }); sign('HUDSON', 0, 4.75, -84.4, 4, .9, { bg: '#1c1a24', fg: '#ffe27a', border: '#ffe27a', glow: true });
    } },

  /* ───────────── 7 · NOVEMBER 19 — the old town from the first games, by the lake ───────────── */
  { id: 'birthday', shot: [0, -8.1], prop: 'cake', caption: 'my only one', kicker: 'November 19 · today', title: 'Happy Birthday', sub: 'one key for every year.',
    game: 'collect', R: 12, icon: '♥', stars: [1, 2, 3], finale: true,
    how: 'The old town again, a little less bleak.\nFind the three keys, then open the box on the dock.',
    P: { count: 3, shape: 'key', col: 0xffd77e, itemScale: 1.7, goal: { x: 0, z: -9.3 }, goalNote: 'three keys. go open the box. (A)',
      npcs: [
        { x: -4.5, z: 2.5, name: 'npc', look: { skin: 0xcfb98a, hair: 0x555060, top: 0xa09060, legs: 0x2a4a35 }, lines: ['you are dreaming. probably. happy birthday anyway.', 'five keys last time. three now. inflation, but backwards.', 'i used to be a person. now i am dialogue. she still looks great though.'] },
        { x: 5, z: -1.5, name: 'npc', look: { skin: 0xe0b890, hair: 0x7a4a2a, top: 0x6a7ac8, legs: 0x3b3030, style: 'bun' }, lines: ['he loves you more than pizza.', 'i am told you love pizza more. this is fine.', 'saw seven blue jays today. felt like a sign.'] },
        { x: -4.2, z: -6.2, name: 'npc', look: { skin: 0xb9794f, hair: 0x15100e, top: 0x4fae6a, legs: 0x2b2b3a }, lines: ['the dock used to lead nowhere. now there is a box on it.', 'time is not real. three years is, though.'] }] },
    build(b, c) {
      sky(0x5aa2e8, 0xffe8c8, 0xffe8c8); lights(0xdfeeff, 0x7a9a5a, 1.8, 0xfff0d0, 2.2, -4, 9, 5); fog(0xffe8d0, 40, 130); orb(30, 44, -100, 6, 0xfff0d0, 1.2);
      island(b, 12, 0x6fc25a, { edge: 'fence', woods: 0, hills: 0x5aa870 });
      b.box(0, .015, -52, 160, .02, 80, 0x4a78d0); b.box(0, .02, -12.3, 160, .03, .9, 0xe8d8a8);                                // the lake and its shore
      for (let i = 0; i < 9; i++) (i % 2 ? tree : pine)(b, (i < 5 ? -1 : 1) * (15 + (i % 5) * 3.4), 4 - (i % 5) * 4.2, 1.6 + (i % 3) * .5, 0x2f8a5c);
      b.box(0, .02, 0, 2, .03, 16, 0xe8d8b0); b.box(0, .021, 1, 16, .03, 2, 0xe8d8b0);                                          // crossing paths
      const hs = [[-6, -3.5, 0xf6e6c8], [6, -5, 0xc8e0f6], [-6.5, 5, 0xf6d0d8], [6.2, 5.2, 0xf6e6c8]];
      hs.forEach(([x, z, col], i) => { const ry = x < 0 ? .25 : -.25; house(b, x, z, 3.2, 2.4, 2.8, col, 0xd8584a, ry); b.cyl(x, 2.58, z, 2.5, 1.3, 0xe0685a, .001, 4);
        b.box(x + Math.sin(ry) * 1.42, 0, z + Math.cos(ry) * 1.42, .7, 1.3, .06, 0x7a4a2a, ry); b.box(x + .8, 2.9, z - .5, .44, 1.2, .44, 0xb86a5a);                    // door + chimney
        for (let k = -2; k <= 2; k++) { b.ball(x + k * .5 + Math.sin(ry) * 1.9, .14, z + Math.cos(ry) * 1.9, .15, 0x3f9a52); b.dot(x + k * .5 + Math.sin(ry) * 1.9, .34, z + Math.cos(ry) * 1.9, .07, PARTY[(k + i + 4) % 4], 1.2); }   // flower beds
        c.colliders.push({ x, z, r: 2.1 }); });
      ring(6, 10.4, (x, z, a, i) => { if (z < -3) return; (i % 2 ? tree : pine)(b, x, z, 1.2, 0x3f9a62); c.colliders.push({ x, z, r: .5 }); }, .5);
      for (const [x, z] of [[-1.6, 3], [1.6, -2.5], [-3.4, -7.4], [1.6, 6]]) { lamp(b, x, z); c.colliders.push({ x, z, r: .2 }); }
      b.box(0, .1, -11.4, 3, .16, 6, 0xb0763e); for (let k = 0; k < 7; k++) b.box(0, .262, -8.7 - k * .86, 3, .012, .05, 0x8a5a36); for (const x of [-1.4, 1.4]) for (const z of [-9, -11.4, -14]) b.cyl(x, -.6, z, .13, 1.2, 0x6a4a30, 1, 6);    // the dock
      b.box(0, .27, -10.6, 1.3, 1.1, 1.3, 0xff7ab6); b.box(0, .27, -10.6, 1.34, 1.12, .22, 0xffd77e); b.box(0, .27, -10.6, .22, 1.12, 1.34, 0xffd77e);                                                               // the present
      b.ball(-.2, 1.52, -10.6, .22, 0xffd77e); b.ball(.2, 1.52, -10.6, .22, 0xffd77e); c.colliders.push({ x: 0, z: -10.6, r: .95 });
      stringLights(b, -6, -3.5, 6, -5, 3.2, PARTY, 14, .9); stringLights(b, -6.5, 5, 6.2, 5.2, 3.2, PARTY, 14, .9);
      c.amb.push(ambient({ n: 90, col: 0xffe9a0, size: .12, area: 12, h: 5 }));
      c.spawn = { x: 0, z: 7.5 };
    } },
];

/* the title screen: a little house on a hill */
export function titleScene(look1, look2) {
  sky(0x5aa2e8, 0xffe8c8, 0xffe8c8); lights(0xdfeeff, 0x7a9a5a, 1.8, 0xfff0d0, 2.2, 4, 8, 6); fog(0xffe8d0, 36, 110); orb(-26, 22, -60, 5, 0xfff0d0, 1.2);
  const b = new Batch();
  island(b, 7, 0x6fc25a, { woods: 0, hills: 0 });
  ring(22, 24, (x, z, a, i) => (i % 3 ? pine : tree)(b, x * (1 + (i % 4) * .14), z * (1 + (i % 4) * .14), 1.8 + (i % 3) * .6, 0x2f8a5c));
  ring(7, 70, (x, z) => b.ball(x, -8, z, 26, 0x5aa870, 0, .5), .4);
  house(b, -1.8, -1.6, 3, 2.3, 2.6, 0xf6e6c8, 0xd8584a, .3); b.cyl(-1.8, 2.48, -1.6, 2.4, 1.3, 0xe0685a, .001, 4); b.box(-1.8 + Math.sin(.3) * 1.32, 0, -1.6 + Math.cos(.3) * 1.32, .7, 1.3, .06, 0x7a4a2a, .3); b.box(-1, 2.8, -2.1, .44, 1.2, .44, 0xb86a5a);
  tree(b, 3.2, -1.4, 1.5); pine(b, -4.2, 1.2, 1.2); pine(b, 4.2, 2.2, .9); lamp(b, 1.2, 1.8);
  stringLights(b, -1.8, -.2, 3.2, -1.4, 2.7, PARTY, 12, .7);
  b.box(.65, 0, 2.7, 1.7, .4, .5, WOOD); b.box(.65, .4, 2.5, 1.7, .5, .08, WOOD);                                               // their bench
  for (let i = 0; i < 12; i++) { const a = i * 2.1, r = 2.6 + (i % 4); b.dot(Math.cos(a) * r, .2, Math.sin(a) * r + 1, .07, PARTY[i % 4], 1.2); }
  b.build();
  const a = makeChar(look1), t = makeChar(look2); a.g.position.set(.25, 0, 3.3); t.g.position.set(1.05, 0, 3.3); a.face = .3; t.face = -.3; world.add(a.g, t.g);
  return { chars: [a, t], amb: ambient({ n: 80, col: 0xffe9a0, size: .12, area: 7, h: 5 }) };
}
