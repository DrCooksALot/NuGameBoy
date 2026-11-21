// Eight memories. Each level = a set built from real things you would see there (build) + one mechanic from games.js (game + P).
// Everything static is baked into one mesh per level, so detail costs vertices, not draw calls.
import { THREE, scene, world } from './engine.js';
import { turf, island, tree, pine, lamp, house, stringLights, sky, lights, orb, ambient, makeChar, critter, sign, Batch } from './kit.js';

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
  { id: 'lightscape', shot: [4, 2.9], prop: 'lantern', caption: 'taken by two strangers who also love Spirited Away', kicker: 'December 2023 · Brooklyn Botanic Garden', title: 'Lightscape', sub: 'find someone to take our picture.',
    game: 'explore', icon: '✦', stars: [8, 18, 28],
    how: 'You are at the lily pools and you want a picture together.\nWalk the garden and ask couples (A). When one says yes, lead them back to the fountain between the pools.\nLanterns are points. Squirrels break your streak; dash (A) past them.',
    P: { count: 16, shape: 'lantern', col: [0xffd77e, 0xff9a62], bounds: [-22.5, 8.4, -33.4, 12.6], goal: { x: 4, z: 2.9 },
      note: 'ask a couple to take your picture (A)', escortNote: 'lead them to the fountain between the pools',
      hazAt: [[-9, -21, 2.8], [-13, 4, 3], [-18.8, -21.5, 1.1]], hazard: () => critter('squirrel'), hazPop: 'squirrel!', yesFrom: [2, 3, 4, 5, 6],
      yesLines: (who) => [[who, 'a picture? of course. where do you want it?'], ['AHANU', 'by the fountain, between the two pools.'],
        [who, 'good choice. with all these lights on the water it looks like Spirited Away.'], ['TEK', 'the bathhouse at night. that is exactly what we said.'],
        [who, "just don't eat anything in here or you'll turn into pigs."], ['AHANU', 'too late. we already had the hot chocolate.'], [who, 'ha. okay, lead the way. we will follow you.']],
      couples: [
        { x: 4, z: -10.2, name: 'couple at the wall fountain', looks: [{ skin: 0xd59a70, hair: 0x1a1412, top: 0x3d8bd9, legs: 0x2a2a33, style: 'long' }, { skin: 0xe6b596, hair: 0x6b3a24, top: 0x4fae6a, legs: 0x3b4a8a }], no: ['sorry, we cannot feel our hands. december.', 'still frozen. try the people by the cherry trees.'] },
        { x: 1, z: -5.4, name: 'couple on the bench', looks: [{ skin: 0xf0c8a4, hair: 0xc8a050, top: 0xe5484d, legs: 0x2a2a33, style: 'bun' }, { skin: 0xb9794f, hair: 0x15100e, top: 0x8a5ad0, legs: 0x2a2a33, beard: 0x15100e }], no: ['one second, he is about to propose. ...never mind, he is tying his shoe.', 'he is still tying it.'] },
        { x: -9, z: 2.6, name: 'couple by the light tunnel', looks: [{ skin: 0xe6b596, hair: 0x3a2a20, top: 0xffd27a, legs: 0x3b4a8a, style: 'curly', hair2: 0x5a4030 }, { skin: 0x9a6a48, hair: 0x1a1412, top: 0xf2efe6, legs: 0x6a5240 }], no: ['we would, but our phone is at 1%. so is yours? oh no.', 'now it is at 0%.'] },
        { x: -9, z: -19, name: 'couple on the esplanade', looks: [{ skin: 0xb9794f, hair: 0x15100e, top: 0xff9ab8, legs: 0x2a2a33, style: 'long' }, { skin: 0xf0c8a4, hair: 0x555060, top: 0x2a2a33, legs: 0x3b4a8a, cap: 0x8a2a3a }], no: ['we are actually looking for someone to take OUR picture.', 'if you find someone, send them our way too.'] },
        { x: -8, z: -30.4, name: 'couple under the big star', looks: [{ skin: 0xf0c8a4, hair: 0x6b3a24, top: 0x4fae6a, legs: 0x6a5240, style: 'bun' }, { skin: 0xd59a70, hair: 0x3a2a20, top: 0xe5484d, legs: 0x2a2a33 }], no: ['sorry, we have been trying to find the exit since november.', 'is it this way? no? okay.'] },
        { x: -18.8, z: -13.6, name: 'couple under the pergola', looks: [{ skin: 0x9a6a48, hair: 0x1a1412, top: 0x7ad7ff, legs: 0x2a2a33, style: 'curly' }, { skin: 0xe6b596, hair: 0xc8a050, top: 0x8a5ad0, legs: 0x3b4a8a, beard: 0xa88040 }], no: ['we are mid-argument about whether roses count as lights. give us a minute.', 'they do not count. he is wrong.'] },
        { x: -18.8, z: -22.2, name: 'couple in the rose garden', looks: [{ skin: 0xe6b596, hair: 0x555060, top: 0xf2efe6, legs: 0x2a2a33, style: 'long' }, { skin: 0xb9794f, hair: 0x555060, top: 0x6a7ac8, legs: 0x6a5240 }], no: ['oh, we are terrible at phones. you would get our thumbs.', 'we tried. it was our thumbs.'] }] },
    build(b, c) {
      sky(0x0b1040, 0x2c3690, 0x283080, 600); lights(0x8f9cf0, 0x3a6a5a, 2.1, 0xcfd8ff, 1.6, -4, 9, 5); fog(0x283080, 30, 88); orb(-40, 46, -90, 5, 0xdfe6ff, 1.2);
      turf(150, 150, 0x2c7458, -7, -10);
      const BRICK = 0xa8604e, STONE = 0xd8cab8, WATER = 0x161e52, PATH = 0x8f90a4, GLOBE = [0xff7ab6, 0x7ad7ff, 0xffd77e, 0x9bffb0];
      /* Lily Pool Terrace */
      b.box(4, 0, 1, 9.6, .06, 24.8, BRICK);
      const pool = (z0, z1, round) => { const zc = (z0 + z1) / 2, len = z1 - z0; b.box(4, .06, zc, 4, .1, len + .8, STONE); b.box(4, .1, zc, 3.2, .08, len, WATER);
        if (round) { b.cyl(4, .06, z0, 2, .1, STONE, 1, 14); b.cyl(4, .1, z0, 1.6, .08, WATER, 1, 14); }
        for (let z = z0 + .6; z < z1; z += 1.25) { c.colliders.push({ x: 4, z, r: 1.75 }); for (const sx of [-1, 1]) b.dot(4 + sx * 1.9, .2, z, .05, 0xffe9b0, 1.25); }                    // you cannot walk on water; lights along the rim
        for (let k = 0; k < 9; k++) { const x = 4 + Math.sin(k * 2.3 + z0) * 1.2, z = z0 + .7 + (k + .5) * (len - 1) / 9; b.cyl(x, .18, z, .2, .02, 0x3f8a52, 1, 7); if (k % 2) b.ball(x + .3, .3, z + .2, .13, GLOBE[k % 4], 1.25); } };
      pool(-9, -2.2, true); pool(3.5, 10.4, false);
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
      for (let a = 0; a < 9; a++) { const x = -1.6 - a * .8; for (let k = 0; k <= 14; k++) { const t = k / 14 * Math.PI; b.dot(x, .1 + Math.sin(t) * 3.1, .65 + Math.cos(t) * 1.55, .06, 0xfff2c8, 1.25); } }
      /* Cherry Esplanade: a long lawn between double rows of cherry trees, Sea of Light across it, the Supernova at the far end */
      b.box(-9, .016, -21.6, 6.6, .03, 23.4, 0x3a8a66);
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
      for (const [x, z, s2, col] of [[-3, -7, 1.8, 0x8a5ad8], [-3.4, 6.4, 1.6, 0x3d8ad8], [-8, 8.6, 1.9, 0xd85a9a], [-14, 8, 2.1, 0x3fa878], [-18, 2, 1.9, 0x8a5ad8], [-13, -4, 1.7, 0x3d8ad8], [-19, 9.5, 1.8, 0xd85a9a], [-2.2, -17, 1.6, 0x3fa878], [-1.6, -27, 1.8, 0x8a5ad8]]) {
        tree(b, x, z, s2, col); b.dot(x + .6, .14, z + .5, .1, 0xffffff, 1.2); c.colliders.push({ x, z, r: .55 }); }
      let s = 3; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 26; i++) { const t = i / 26; (i % 3 ? tree : pine)(b, -26 - r() * 8, -38 + t * 56, 1.8 + r(), 0x1f5a48); (i % 3 ? pine : tree)(b, -25 + t * 40, -37.5 - r() * 8, 1.8 + r(), 0x1f5a48); }                               // nothing along the south edge: that is where the camera looks from
      for (const [x, z, r2] of [[-48, -80, 26], [-8, -92, 34], [40, -84, 28]]) b.ball(x, -8, z, r2, 0x1f4a58, 0, .5);
      c.amb.push(ambient({ n: 120, col: 0xffffff, size: .09, area: 14, h: 9, vy: -.7, drift: .3, add: false, opacity: .9 }));
      c.spawn = { x: 1.2, z: 11.4 };
    } },

  /* ───────────── 2 · THE JITNEY — eastbound on the Long Island Expressway ───────────── */
  { id: 'jitney', shot: [0, 0], prop: 'croissant', caption: 'the 5:41 out east', kicker: '2024 · Brooklyn ⇄ the East End', title: 'The Jitney Years', sub: 'two tickets. every time.',
    game: 'runner', icon: '➤', stars: [30, 70, 110],
    how: 'The L.I.E. at rush hour, chasing the Jitney.\n◀ ▶ change lane around the cars · A jumps the barricades · grab the croissants',
    P: { time: 38, shape: 'croissant', col: 0xffc65c, obsCol: [0xe5484d, 0x3d8bd9, 0xf2efe6, 0x9aa0a8], hitPop: 'traffic', note: '', side: 'pine', sideX: 7.4, sideScale: 1.7 },
    build(b, c) {
      sky(0x3a3f98, 0xf2a070, 0xf2a070, 120); lights(0xffd0b0, 0x6a8a5a, 2.1, 0xffd8b0, 2.2, -6, 6, 8); fog(0xeaa888, 44, 130); orb(-24, 9, -170, 13, 0xfff0d0, 1.15);
      turf(200, 240, 0x6fb858, 0, -70);
      b.box(0, -.3, -52, 11.4, .3, 150, 0x8a8a96); b.box(0, -.28, -52, 7.4, .3, 150, 0x5c5d70);                              // shoulders + three lanes
      for (const sx of [-1, 1]) { b.box(sx * 3.78, .021, -52, .12, .012, 150, 0xf4f0e0); b.box(sx * 5.95, .32, -52, .07, .22, 150, 0xc8ccd4); for (let z = 8; z > -124; z -= 3.2) b.box(sx * 5.95, 0, z, .1, .5, .1, 0x9aa0a8); }   // edge lines + guardrails
      let s = 5; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 44; i++) { const sx = i % 2 ? 1 : -1; (i % 5 ? pine : tree)(b, sx * (9.5 + r() * 26), 6 - i * 2.9 + r() * 2, 1.4 + r() * 1.3, i % 3 ? 0x2f8a52 : 0x3f9a52); }                                 // pine barrens
      for (const sx of [-1, 1]) b.cyl(sx * 6.3, 0, -26, .14, 5.6, 0x9aa0a8, 1, 6); b.box(0, 5.5, -26, 12.8, .22, .22, 0x9aa0a8); b.box(0, 3.3, -26, 12.8, .12, .12, 0x9aa0a8);                                       // sign gantry
      sign('EXIT 70\nManorville', 2.5, 4.4, -25.86, 4.4, 2, { bg: '#1f7a45' }); sign('495 EAST\nRiverhead', -2.6, 4.4, -25.86, 4, 2, { bg: '#1f7a45' });
      // the Jitney, always just ahead
      b.box(0, .5, -82, 2.6, 2.7, 9.5, 0x2f7a4a); b.box(0, 1.2, -82, 2.64, .5, 9.54, 0xf2efe6); b.box(0, 2.05, -82, 2.66, .8, 8.8, 0x26304a); b.box(0, 3.2, -82, 2.4, .16, 9.2, 0xf2efe6);
      for (const sx of [-1, 1]) for (const z of [-79, -85]) b.ball(sx * 1.2, .5, z, .5, 0x18181e); b.box(-.95, 1, -77.22, .4, .22, .05, 0xff3a30); b.box(.95, 1, -77.22, .4, .22, .05, 0xff3a30);
      sign('JITNEY', 0, 2.75, -77.2, 2, .5, { bg: '#f2efe6', fg: '#1f5a35', border: '#1f5a35' });
      b.box(8.2, 0, -8, .12, 2.4, .12, 0x9aa0a8); sign('SPEED\nLIMIT\n55', 8.2, 2.3, -7.9, 1.1, 1.4, { bg: '#ffffff', fg: '#1c1a24' });
    } },

  /* ───────────── 3 · METAH'S WEDDING — a garden ceremony in Portland ───────────── */
  { id: 'metah', shot: [0, .4], prop: 'toast', caption: 'dressed up, glass up',
    outfit: { him: { top: 0x2a2a33, legs: 0x2a2a33, tie: 0xc9b6e6 }, her: { top: 0xf2c9c2, dots: 0xd9628a } },
    kicker: 'August 24, 2024 · Portland, Oregon', title: "Metah's Wedding", sub: 'a hectic week. one perfect afternoon.',
    game: 'catcher', icon: '❀', stars: [40, 80, 120],
    how: 'Petals are coming down over the aisle.\nCatch them, and the bouquet for +3. Dodge the bees.\nSTICK move · A dash',
    P: { time: 38, every: .55, width: 6, shapes: ['petal', 'bouquet', 'bee'], col: 0xff9ab8, gold: 0xffffff, badCol: 0xffd23a, bad: .2, badPop: 'bee!', goldPop: 'bouquet! +3', note: '' },
    build(b, c) {
      sky(0x6fb2e8, 0xfff0d0, 0xfff0d0); lights(0xdfeeff, 0x7a9a5a, 1.7, 0xfff2d0, 2.2, -5, 10, 7); fog(0xfff0d8, 40, 140); orb(-50, 44, -120, 9, 0xfff6c8, 1.2);
      turf(200, 200, 0x6fc25a); b.box(0, 0, 1, 3, .03, 11, 0xf6ecd8);                                                         // lawn + aisle runner
      b.cone(-30, 0, -110, 30, 34, 0x8fa4c4, 8); b.cone(-30, 21.5, -110, 11, 12.6, 0xffffff, 8);                              // Mt. Hood
      for (const [x, z, r2] of [[30, -90, 26], [70, -80, 22], [-80, -84, 24]]) b.ball(x, -8, z, r2, 0x4f9a5a, 0, .5);
      for (let i = 0; i < 11; i++) { const x = -20 + i * 4; b.box(x, 0, -4.8, 3.9, 1.5 + (i % 2) * .3, 1.2, i % 2 ? 0x4f8f52 : 0x5a9a58);                                      // flowering hedge
        for (let k = 0; k < 5; k++) b.ball(x - 1.6 + k * .8, 1.35 + ((i + k) % 3) * .2, -4.15, .16, [0xff9ab8, 0xffffff, 0xffd27a, 0xd9628a][(i + k) % 4]); }
      b.box(-1.7, 0, -3.4, .2, 3.4, .2, 0xffffff); b.box(1.7, 0, -3.4, .2, 3.4, .2, 0xffffff); b.box(0, 3.4, -3.4, 3.9, .24, .24, 0xffffff);                                    // the arch
      for (let i = 0; i < 11; i++) b.ball(-1.75 + i * .35, 3.6 + Math.sin(i * 1.3) * .14, -3.3, .26, [0xff9ab8, 0xffffff, 0xd9628a, 0x8fbf7a][i % 4]);
      for (const sx of [-1, 1]) { b.ball(sx * 1.7, .3, -3.2, .34, 0xff9ab8); b.ball(sx * 1.9, .5, -3.3, .24, 0xffffff); }
      let n = 0; for (const sx of [-1, 1]) for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) { const x = sx * (2.6 + k * 1.05), z = -1.4 - r * 1.15; chair(b, x, z, Math.PI); if ((n++ * 7) % 3) person(n, x, z + .05, Math.PI); }   // guests, facing the arch
      for (const [x, z, sc] of [[-10, -7.5, 2.2], [10, -8, 2.5], [-16, -9, 2], [16, -8, 2.1], [0, -10, 2.6], [-24, -7, 2.3], [24, -9, 2]]) tree(b, x, z, sc, 0x4f9a5a);
      for (const sx of [-1, 1]) b.cyl(sx * 9.5, 0, -3.8, .08, 4.5, 0xfff6e6, 1, 6); stringLights(b, -9.5, -3.8, 9.5, -3.8, 4.5, [0xffd27a, 0xffffff], 20, 1);
      c.amb.push(ambient({ n: 60, col: 0xffb3d1, size: .12, area: 11, h: 9, vy: -.7, add: false, opacity: .85 }));
    } },

  /* ───────────── 4 · POW WOW — the powwow grounds at Shinnecock ───────────── */
  { id: 'powwow', shot: [0, 6.6], prop: 'frybread', caption: 'crispy fry bread, last day', kicker: 'Labor Day 2024 · Shinnecock', title: 'Pow Wow', sub: 'the last day was the best day.',
    game: 'collect', R: 12, icon: '☀', stars: [25, 60, 100],
    how: 'Walk the vendor row and collect the fry bread, round after round.\nThe gulls want it too — dash (A) past them. A near her cousin to talk.',
    P: { count: 10, time: 60, waves: true, shape: 'frybread', col: 0xffc65c, hazards: 3, hazard: () => critter('gull'), hazPop: 'gull!', hazSpeed: 1.2, note: '',
      npcs: [{ x: 2.6, z: 6.4, name: 'her cousin', look: { skin: 0xb9794f, hair: 0x15100e, top: 0xe5484d, legs: 0x2b2b3a, style: 'long' },
        lines: ['you came on the right day. the last day is the good one.', 'he said my dance looked like praising the sun. i am choosing to take that well.', 'get the fry bread while it is still crispy.'] }] },
    build(b, c) {
      sky(0x4a90e0, 0xcfe8ff, 0xcfe8ff); lights(0xdfeeff, 0x7a9a5a, 1.7, 0xfff2d0, 2.2, 7, 10, 4); fog(0xd8ecff, 44, 140); orb(60, 50, -120, 8, 0xfff6c8, 1.2);
      island(b, 12, 0x74c45e, { edge: 'rope', woods: 0x3f9a52, hills: 0x5aa870 });
      b.cyl(0, 0, 0, 4.5, .035, 0x9ad878, 1, 26);                                                                           // the dance arena: a mown circle inside an arbor
      ring(14, 4.7, (x, z, a, i) => { if (Math.abs(a - Math.PI / 2) < .3) return; b.cyl(x, 0, z, .07, 2, WOOD, 1, 6); b.box(x, 2, z, .08, .08, 2.2, WOOD, -a); b.box(x, 1.62, z, .34, .26, .03, [0xe5484d, 0xffd27a, 0xffffff, 0x2a2a33][i % 4], -a + Math.PI / 2); });
      for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.cyl(dx * 1, 0, dz * 1, .05, 2.2, WOOD, 1, 5); b.box(0, 2.2, 0, 2.4, .1, 2.4, 0xe8d8b0);               // drum under its canopy
      b.cyl(0, .12, 0, .62, .44, 0x9a4a2a, 1, 12); b.cyl(0, .56, 0, .64, .05, 0xf2e6c8, 1, 12); for (let i = 0; i < 4; i++) b.cyl(Math.cos(i * 1.57 + .8) * 1.05, 0, Math.sin(i * 1.57 + .8) * 1.05, .16, .4, 0x6a5240, 1, 7); c.colliders.push({ x: 0, z: 0, r: 1.35 });
      b.box(0, 0, -9.6, 5, .5, 2.2, 0xb0763e); b.box(0, .5, -10.6, 5, 2.6, .14, 0xe8d8b0); for (const sx of [-1, 1]) { b.cyl(sx * 2.4, .5, -8.7, .06, 2.6, WOOD, 1, 5); b.box(sx * 3, 0, -8.9, .7, 1.3, .6, 0x2a2a33); } b.box(0, 3.1, -9.6, 5.4, .14, 2.5, 0xffffff);   // MC stage
      sign('SHINNECOCK\nPOWWOW', 0, 2, -10.5, 3.6, 1.3, { bg: '#f2e6c8', fg: '#8a2a1f', border: '#8a2a1f' }); c.colliders.push({ x: 0, z: -9.7, r: 2.7 });
      for (const sx of [-1, 1]) { for (let k = 0; k < 3; k++) b.box(sx * (8.2 + k * .6), 0, -3.4, .6, .35 + k * .35, 4.4, 0xc8ccd4); c.colliders.push({ x: sx * 8.8, z: -3.4, r: 1.9 }, { x: sx * 8.8, z: -5, r: 1.2 }, { x: sx * 8.8, z: -1.8, r: 1.2 });     // bleachers + spectators
        for (let k = 0; k < 4; k++) person(k + (sx > 0 ? 4 : 9), sx * (8.5 + (k % 2) * .6), -4.9 + k, sx > 0 ? -1.57 : 1.57, .35 + (k % 2) * .35); }
      const spots = [[-9.8, 1.4], [-8.4, 5.2], [9.8, 1.4], [8.4, 5.2], [-5.8, -8.2], [5.8, -8.2]];                                                                      // vendor row, kept to the sides so it never hides you
      spots.forEach(([x, z], i) => { tent(b, x, z, Math.atan2(-x, -z), [0xe5484d, 0x3d8bd9, 0xffb347, 0x4fae6a, 0x8a5ad0, 0xff9ab8][i]); c.colliders.push({ x, z, r: 1.45 }); });
      sign('FRY BREAD', -5.8, 1.62, -7.02, 1.9, .42, { bg: '#ffd27a', fg: '#8a2a1f', border: '#8a2a1f' });
      for (const sx of [-1, 1]) { b.cyl(sx * 1.6, 0, 5.2, .05, 4.4, 0xd8d8de, 1, 6); b.box(sx * 1.6 + .5, 3.6, 5.2, 1, .66, .04, sx > 0 ? 0xe5484d : 0xffd27a); b.box(sx * 1.6 + .5, 3.82, 5.2, 1, .22, .05, 0xffffff); c.colliders.push({ x: sx * 1.6, z: 5.2, r: .15 }); }   // flags at the entrance
      c.amb.push(ambient({ n: 40, col: 0xfff3c0, size: .1, area: 12, h: 5, add: false, opacity: .5 }));
      c.spawn = { x: 0, z: 7.2 };
    } },

  /* ───────────── 5 · ANTHONY & NICKA'S WEDDING — the reception ───────────── */
  { id: 'wedding', shot: [0, 1.2], prop: 'toast', caption: 'we closed the dance floor', outfit: { him: { top: 0x2a2a33, tie: 0x8a2a3a, legs: 0xc2313a } }, kicker: 'September 7, 2024', title: "Anthony & Nicka's Wedding", sub: 'red pants. rain jacket. no regrets.',
    game: 'rhythm', icon: '♪', stars: [80, 200, 320],
    how: 'Own the dance floor.\n◀ and ▶ on the stick, A in the middle — hit each one as it reaches the line.',
    P: { time: 36, bpm: 112 },
    build(b, c) {
      sky(0x231a66, 0x7a52c0, 0x4a3a98, 400); lights(0xc4b8ff, 0x5a8a6a, 2.5, 0xffd8b8, 2.2, 3, 8, 6); fog(0x5a48b0, 34, 110);
      island(b, 26, 0x4aa870, { woods: 0x2f8a5c, hills: 0x3a5a98 });
      b.box(0, 0, -7, 9.6, .05, 19.6, 0x6a4a30);                                                                             // parquet dance floor
      for (let x = -3; x < 3; x++) for (let z = -10; z < 2; z++) b.box(x * 1.5 + .75, .05, z * 1.6 + .2, 1.46, .03, 1.56, (x + z) & 1 ? 0xc89a62 : 0xb5854f);
      for (const x of [-2.25, -.75, .75, 2.25]) b.box(x, .081, -7, .05, .01, 18.6, 0xfff6e0);
      for (const sx of [-1, 1]) for (const z of [-17.4, 3.6]) b.cyl(sx * 5.4, 0, z, .09, 4.2, 0xfff6e6, 1, 6);                 // tent poles and strings of lights overhead
      for (let k = 0; k < 6; k++) { const z = 3.6 - k * 4.2; for (let i = 0; i <= 14; i++) { const t = i / 14; b.dot(-5.4 + t * 10.8, 4.2 - Math.sin(t * Math.PI) * .9, z, .06, 0xffe9a0, 1.25); } }
      b.box(0, 0, -18.6, 3.4, 1, 1, 0x2a2a33); for (const sx of [-1, 1]) { b.box(sx * 2.6, 0, -18.6, 1, 2, .9, 0x1c1a24); b.cyl(sx * 2.6, 1.3, -18.14, .32, .04, 0x55555f, 1, 10); }                                  // DJ booth + speakers
      sign('A ♥ N', 0, 2.5, -18.9, 2.6, 1, { bg: '#2a1f5c', fg: '#ffd77e', border: '#ffd77e', glow: true });
      let n = 0; for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) { const x = sx * (7.6 + (i % 2) * 1.6), z = 1 - i * 4.6; roundTable(b, x, z); person(n++ + 2, x - sx * 1.2, z - .9, sx > 0 ? -1.2 : 1.2); person(n++ + 5, x + sx * .6, z + 1.2, sx > 0 ? -2 : 2); }
      b.box(-9, 0, -15, 2.4, .8, .8, 0xfff6e6); b.cyl(-9, .8, -15, .5, .3, 0xffffff, 1, 12); b.cyl(-9, 1.1, -15, .36, .26, 0xffffff, 1, 12); b.cyl(-9, 1.36, -15, .22, .22, 0xff9ab8, 1, 12);                    // the cake
      c.amb.push(ambient({ n: 50, col: 0xffe9a0, size: .1, area: 10, h: 6 }));
    } },

  /* ───────────── 6 · NEW ORLEANS — Frenchmen Street in a thunderstorm ───────────── */
  { id: 'nola', shot: [0, .4], prop: 'beignet', caption: 'powdered sugar in a thunderstorm', kicker: 'April 2025 · French Quarter', title: 'New Orleans', sub: 'a wedding, a steamboat, a thunderstorm.',
    game: 'catcher', icon: '⚜', stars: [40, 80, 120],
    how: 'Frenchmen Street after the wedding. They are throwing from the gallery.\nCatch beignets and beads. Dodge the raindrops.\nSTICK move · A dash',
    P: { time: 40, every: .58, width: 6, shapes: ['beignet', 'beads', 'drop'], col: 0xfff1d6, gold: 0xb04ad9, badCol: 0x7ab8f0, bad: .2, badPop: 'soaked!', goldPop: 'beads! +3', note: '' },
    build(b, c) {
      sky(0x2a2a78, 0x8a62b8, 0x4a4290); lights(0xc0b8ff, 0x6a6088, 2.6, 0xffd8a8, 2.2, -3, 8, 8); fog(0x5a4a98, 34, 100);
      b.box(0, -.4, 4, 80, .4, 30, 0x5a5870); b.box(0, 0, -3.5, 80, .2, 2.6, 0xa8a4b8); b.box(0, 0, -2.16, 80, .2, .1, 0xd8d4e0);                                          // wet street, sidewalk, curb
      for (const [x, z, r2] of [[-3, 1.6, 1.1], [4.5, 2.6, .8], [-7.5, 3.2, .6]]) b.cyl(x, .005, z, r2, .012, 0x7a80a8, 1, 12);                                             // puddles
      const cols = [0xe89a78, 0xf2d27a, 0x9ac0cc, 0xd98a9a, 0xb8d0a0];
      for (let i = -2; i <= 2; i++) { const x = i * 8.3, col = cols[i + 2], H = 8;
        b.box(x, 0, -7.6, 8.1, H, 5, col); b.box(x, H, -7.6, 8.4, .34, 5.3, 0xf2efe6); b.box(x, H + .34, -7.6, 8.1, .5, 5, col);
        for (let f = 0; f < 3; f++) for (let k = -1; k <= 1; k++) { const wx = x + k * 2.5, wy = .2 + f * 2.6;                                                              // tall doors with shutters on every floor
          b.box(wx, wy, -5.06, .9, 2, .06, f ? 0xffd9a0 : 0x3a2a26, 0, f && (i + k + f) % 3 ? 1.15 : 0); b.box(wx - .68, wy, -5.04, .4, 2, .08, 0x2f6a58); b.box(wx + .68, wy, -5.04, .4, 2, .08, 0x2f6a58); }
        for (const gy of [2.7, 5.3]) { b.box(x, gy, -4.2, 8.1, .12, 1.7, 0x3a3540); b.box(x, gy + .86, -3.38, 8.1, .06, .06, IRON);                                             // cast-iron galleries
          for (let k = -9; k <= 9; k++) b.box(x + k * .44, gy + .12, -3.38, .04, .74, .04, IRON); for (let k = -3; k <= 3; k += 2) b.ball(x + k * 1.2, gy - .32, -3.5, .3, 0x3f9a52, 0, .8); }
        for (const px of [-3.9, -1.3, 1.3, 3.9]) b.cyl(x + px, .2, -3.38, .05, 6.1, IRON, 1, 6); }
      sign('THE MAISON', 0, 2.25, -3.3, 3.6, .6, { bg: '#1c1a24', fg: '#ffd27a', border: '#ffd27a', glow: true });
      sign('LIVE JAZZ', -8.3, 2.25, -3.3, 2.6, .6, { bg: '#7a1f3a', fg: '#ffe9a0', border: '#ffe9a0', glow: true }); sign('BEIGNETS', 8.3, 2.25, -3.3, 2.6, .6, { bg: '#1f5a45', fg: '#ffffff', glow: true });
      for (const x of [-12.4, -4.15, 4.15, 12.4]) { b.cyl(x, .2, -2.6, .06, 2.6, IRON, 1, 6); b.box(x, 2.8, -2.6, .26, .36, .26, 0xffd9a0, 0, 1.25); b.cone(x, 3.16, -2.6, .2, .16, IRON, 4); }                           // gas lamps
      for (let k = 0; k < 5; k++) person(k + 3, -3.2 + k * 1.6, -3.75, 0, 2.82, k === 2 ? { top: 0xb04ad9 } : {});                                                           // the party on the gallery
      c.amb.push(ambient({ n: 260, col: 0xaec6ff, size: .07, area: 13, h: 11, vy: -15, drift: 0, add: false, opacity: .55 }));
      c.storm = true;
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

  /* ───────────── 8 · NOVEMBER 19 — the old town from the first games, by the lake ───────────── */
  { id: 'birthday', shot: [0, -8.1], prop: 'cake', caption: 'my only one', kicker: 'November 19 · today', title: 'Happy Birthday', sub: 'one key for every year.',
    game: 'collect', R: 12, icon: '♥', stars: [1, 2, 3], finale: true,
    how: 'The old town again, a little less bleak.\nFind the three keys, then open the box on the dock.',
    P: { count: 3, shape: 'key', col: 0xffd77e, itemScale: 1.7, goal: { x: 0, z: -9.3 }, goalNote: 'three keys. go open the box. (A)',
      npcs: [
        { x: -4.5, z: 2.5, name: 'npc', look: { skin: 0xcfb98a, hair: 0x555060, top: 0xa09060, legs: 0x2a4a35 }, lines: ['you are dreaming. probably. happy birthday anyway.', 'five keys last time. three now. inflation, but backwards.', 'i used to be a person. now i am dialogue. she still looks great though.'] },
        { x: 5, z: -1.5, name: 'npc', look: { skin: 0xe0b890, hair: 0x7a4a2a, top: 0x6a7ac8, legs: 0x3b3030, style: 'bun' }, lines: ['he loves you more than pizza.', 'i am told you love pizza more. this is fine.', 'saw seven blue jays today. felt like a sign.'] },
        { x: -4.2, z: -6.2, name: 'npc', look: { skin: 0xb9794f, hair: 0x15100e, top: 0x4fae6a, legs: 0x2b2b3a }, lines: ['the dock used to lead nowhere. now there is a box on it.', 'time is not real. three years is, though.'] }] },
    build(b, c) {
      sky(0x1c2470, 0x6a66d0, 0x3f48a8, 600); lights(0xb4bcff, 0x4a8a70, 2.6, 0xe4e0ff, 2.2, -4, 9, 5); fog(0x4a52b8, 34, 110); orb(30, 44, -100, 6, 0xfff0d0, 1.2);
      island(b, 12, 0x58b870, { edge: 'fence', woods: 0, hills: 0x3a5a98 });
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

/* the title screen: a little house on a hill at night */
export function titleScene(look1, look2) {
  sky(0x1c2470, 0x6a66d0, 0x3f48a8, 700); lights(0xb4bcff, 0x4a8a70, 2.6, 0xffe0c0, 2.2, 4, 8, 6); fog(0x4a52b8, 30, 95); orb(-26, 22, -60, 5, 0xfff0d0, 1.2);
  const b = new Batch();
  island(b, 7, 0x4aa870, { woods: 0, hills: 0 });
  ring(22, 24, (x, z, a, i) => (i % 3 ? pine : tree)(b, x * (1 + (i % 4) * .14), z * (1 + (i % 4) * .14), 1.8 + (i % 3) * .6, 0x2f8a5c));
  ring(7, 70, (x, z) => b.ball(x, -8, z, 26, 0x3a5a98, 0, .5), .4);
  house(b, -1.8, -1.6, 3, 2.3, 2.6, 0xf6e6c8, 0xd8584a, .3); b.cyl(-1.8, 2.48, -1.6, 2.4, 1.3, 0xe0685a, .001, 4); b.box(-1.8 + Math.sin(.3) * 1.32, 0, -1.6 + Math.cos(.3) * 1.32, .7, 1.3, .06, 0x7a4a2a, .3); b.box(-1, 2.8, -2.1, .44, 1.2, .44, 0xb86a5a);
  tree(b, 3.2, -1.4, 1.5); pine(b, -4.2, 1.2, 1.2); pine(b, 4.2, 2.2, .9); lamp(b, 1.2, 1.8);
  stringLights(b, -1.8, -.2, 3.2, -1.4, 2.7, PARTY, 12, .7);
  b.box(.65, 0, 2.7, 1.7, .4, .5, WOOD); b.box(.65, .4, 2.5, 1.7, .5, .08, WOOD);                                               // their bench
  for (let i = 0; i < 12; i++) { const a = i * 2.1, r = 2.6 + (i % 4); b.dot(Math.cos(a) * r, .2, Math.sin(a) * r + 1, .07, PARTY[i % 4], 1.2); }
  b.build();
  const a = makeChar(look1), t = makeChar(look2); a.g.position.set(.25, 0, 3.3); t.g.position.set(1.05, 0, 3.3); a.face = .3; t.face = -.3; world.add(a.g, t.g);
  return { chars: [a, t], amb: ambient({ n: 80, col: 0xffe9a0, size: .12, area: 7, h: 5 }) };
}
