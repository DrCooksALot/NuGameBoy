// Seven memories. Each level = a diorama (build) + one mechanic from games.js (game + P).
import { THREE, scene, world } from './engine.js';
import { turf, island, tree, pine, lamp, house, stringLights, stall, sky, lights, orb, ambient, makeChar, critter, Batch } from './kit.js';

const fog = (c, a, b) => { scene.fog = new THREE.Fog(c, a, b); };
const ring = (n, r, fn, off = 0) => { for (let i = 0; i < n; i++) { const a = off + i / n * Math.PI * 2; fn(Math.cos(a) * r, Math.sin(a) * r, a, i); } };
const PARTY = [0xffd27a, 0xff7ab6, 0x7ad7ff, 0x9bff9b];

function npcMesh(look) { const c = makeChar(look); return c.g; }
function road(b, col, edge, w = 7.4) { b.box(0, -.3, -38, w, .3, 100, col); b.box(-w / 2 - .15, -.3, -38, .3, .36, 100, edge); b.box(w / 2 + .15, -.3, -38, .3, .36, 100, edge); }

export const LEVELS = [
  /* ───────────── 1 · LIGHTSCAPE ───────────── */
  { id: 'lightscape', shot: [-3.5, 6.2], prop: 'lantern', caption: 'the night the garden glowed', kicker: 'December 2023 · Brooklyn Botanic Garden', title: 'Lightscape', sub: 'the garden, lit up. so were we.',
    game: 'collect', R: 11, icon: '✦', stars: [25, 60, 100],
    how: 'Gather the lanterns. Clear them all and a new round lights up.\nThe blue wisps break your streak — dash (A) straight through them.',
    P: { count: 10, time: 60, waves: true, shape: 'ball', col: [0xff7ab6, 0xffd77e, 0xff9a62], hazards: 3, hazard: () => critter('wisp'), hazPop: 'wisp!', note: '' },
    build(b, c) {
      sky(0x1a2466, 0x5a66d0, 0x3a46a8, 500); lights(0xa8b4ff, 0x4a8a70, 2.6, 0xdfe4ff, 2.2, -4, 9, 5); fog(0x4650b8, 30, 90); orb(-40, 46, -90, 5, 0xdfe6ff, 1.6);
      island(b, 11, 0x3fa878, 0x8a6a4a);
      b.cyl(3.5, 0, -2.5, 2.6, .05, 0x3b7fd0, 1, 14, 1.3); c.colliders.push({ x: 3.5, z: -2.5, r: 2.5 });       // glowing pond
      ring(9, 9.2, (x, z, a, i) => { (i % 2 ? pine : tree)(b, x, z, 1.1 + (i % 3) * .2, 0x2f9a62); c.colliders.push({ x, z, r: .5 });
        b.ball(x * .98, 1.9, z * .98, .22, PARTY[i % 4], 3); b.ball(x * 1.02 + .5, 1.3, z * 1.02, .16, PARTY[(i + 1) % 4], 3); });
      for (let i = 0; i < 6; i++) { const z = 4.5 - i * 1.5, col = PARTY[i % 4];                                 // tunnel of light
        b.box(-4.6, 0, z, .1, 2.4, .1, col, 0, 2.6); b.box(-2.4, 0, z, .1, 2.4, .1, col, 0, 2.6); b.box(-3.5, 2.4, z, 2.3, .1, .1, col, 0, 2.6); }
      c.colliders.push({ x: -4.6, z: 1, r: .3 }, { x: -2.4, z: 1, r: .3 });
      ring(14, 5.5, (x, z, a, i) => b.cone(x, 0, z, .12, .5 + (i % 3) * .2, PARTY[i % 4], 5, 2.4), .3);           // light reeds
      b.box(-6, 0, -5, 1.6, .5, .5, 0x5a3a26, .5); c.colliders.push({ x: -6, z: -5, r: .8 });
      c.amb.push(ambient({ n: 110, col: 0xffe9a0, size: .13, area: 11, h: 5 }));
      c.spawn = { x: -3.5, z: 6.5 };
    } },

  /* ───────────── 2 · THE JITNEY ───────────── */
  { id: 'jitney', shot: [0, 0], prop: 'croissant', caption: 'the 5:41 out east', kicker: '2024 · Brooklyn ⇄ the East End', title: 'The Jitney Years', sub: 'two tickets. every time.',
    game: 'runner', icon: '➤', stars: [30, 70, 110],
    how: 'Get out east. Grab the croissants.\n◀ ▶ change lane · A jump the low ones',
    P: { time: 38, col: 0xffc65c, obsCol: [0xe5484d, 0x3d8bd9, 0xf2efe6], hitPop: 'traffic', note: '', postCol: 0xffd9a0 },
    build(b, c) {
      sky(0x2a1f5c, 0xff9a62, 0x40224a, 120); lights(0xffb38a, 0x4a3a5a, 2.0, 0xffc890, 2.2, -6, 5, -10); fog(0xd98a72, 28, 95); orb(0, 9, -150, 16, 0xffb060, 1.8);
      road(b, 0x6a6884, 0xf2e9d0);
      b.box(-30, -.45, -38, 53, .3, 100, 0x66b852); b.box(30, -.45, -38, 53, .3, 100, 0x66b852);
      for (let i = 0; i < 16; i++) { const z = -4 - i * 5.4, s = i % 2 ? 1 : -1; (i % 3 ? pine : tree)(b, s * (6 + (i * 7 % 5)), z, 1.3 + (i % 3) * .3, i % 2 ? 0x3f9a52 : 0x4aa85c); }
      for (let i = 0; i < 16; i++) { const x = -44 + i * 6, h = 5 + (i * 37 % 13); house(b, x, -92 + (i % 3) * 3, 4.6, h, 4, 0x7a5ab0, 0x4a3a88, 0, 0xffc978); } // the city you're leaving
      b.box(-5.6, 0, -16, .15, 3, .15, 0x3b3b4a); b.box(-5.6, 2.2, -16, 2.6, 1.2, .1, 0x2f7a4a); b.box(-5.6, 2.55, -15.94, 2, .16, .05, 0xffffff, 0, 1.6);   // exit sign
    } },

  /* ───────────── 3 · METAH'S WEDDING ───────────── */
  { id: 'metah', shot: [0, .4], prop: 'toast', caption: 'dressed up, glass up',
    outfit: { him: { top: 0x2a2a33, legs: 0x2a2a33, tie: 0xc9b6e6 }, her: { top: 0xf2c9c2, dots: 0xd9628a } },
    kicker: 'August 24, 2024 · Portland, Oregon', title: "Metah's Wedding", sub: 'a hectic week. one perfect afternoon.',
    game: 'catcher', icon: '❀', stars: [40, 80, 120],
    how: 'Petals are coming down over the garden.\nCatch them, and the bouquet for +3. It is Portland: dodge the rain.\nSTICK move · A dash',
    P: { time: 38, every: .55, width: 6, shape: 'heart', col: 0xff9ab8, gold: 0xffffff, badCol: 0x6f8fb0, bad: .2, badPop: 'portland rain', goldPop: 'bouquet! +3', note: '' },
    build(b, c) {
      sky(0x6fb2e8, 0xfff0d0, 0xa8c8a0); lights(0xdfeeff, 0x7a9a5a, 1.7, 0xfff2d0, 2.2, -5, 10, 7); fog(0xfff0d8, 30, 110); orb(-50, 44, -120, 10, 0xfff6c8, 2);
      b.box(0, -.4, 0, 40, .4, 16, 0x6fc25a); turf(40, 16, 0x6fc25a); b.box(0, 0, 1, 3, .03, 9, 0xf2e6d0);                                          // lawn + aisle
      b.cone(-26, 0, -90, 26, 30, 0x7f95b8, 6); b.cone(-26, 19, -90, 9.6, 11.2, 0xffffff, 6);                                // Mt. Hood
      for (let i = 0; i < 9; i++) { const x = -16 + i * 4; b.box(x, 0, -4.6, 3.9, 1.5 + (i % 2) * .3, 1.2, i % 2 ? 0x4f8f52 : 0x5a9a58);
        for (let k = 0; k < 5; k++) b.ball(x - 1.6 + k * .8, 1.3 + ((i + k) % 3) * .22, -3.95, .16, [0xff9ab8, 0xffffff, 0xffd27a, 0xd9628a][(i + k) % 4]); }
      b.box(-1.7, 0, -3.4, .2, 3.4, .2, 0xffffff); b.box(1.7, 0, -3.4, .2, 3.4, .2, 0xffffff); b.box(0, 3.4, -3.4, 3.9, .24, .24, 0xffffff);            // the arch
      for (let i = 0; i < 11; i++) b.ball(-1.75 + i * .35, 3.6 + Math.sin(i * 1.3) * .14, -3.3, .26, [0xff9ab8, 0xffffff, 0xd9628a, 0x8fbf7a][i % 4]);
      for (const s of [-1, 1]) for (let r = 0; r < 2; r++) for (let k = 0; k < 4; k++) { const x = s * (3 + k * 1.1), z = -1.6 - r * 1.2; b.box(x, 0, z, .5, .5, .5, 0xffffff); b.box(x, .5, z - .22, .5, .6, .06, 0xffffff); }
      for (const [x, z, sc] of [[-9, -7, 2], [9, -7.5, 2.3], [-14, -8, 1.8], [14, -7, 1.9], [0, -9, 2.4]]) tree(b, x, z, sc, 0x4f9a5a);
      stringLights(b, -9, -3.6, 9, -3.6, 4.4, [0xffd27a, 0xffffff], 18, 1);
      c.amb.push(ambient({ n: 70, col: 0xffb3d1, size: .12, area: 11, h: 9, vy: -.7, add: false, opacity: .85 }));
    } },

  /* ───────────── 4 · POW WOW ───────────── */
  { id: 'powwow', shot: [0, 6.6], prop: 'frybread', caption: 'crispy fry bread, last day', kicker: 'Labor Day 2024 · Shinnecock', title: 'Pow Wow', sub: 'the last day was the best day.',
    game: 'collect', R: 12, icon: '☀', stars: [20, 45, 75],
    how: 'Collect the fry bread, round after round.\nThe gulls want it too — dash (A) past them. A near her cousin to talk.',
    P: { count: 10, time: 60, waves: true, shape: 'coin', col: 0xffc65c, hazards: 3, hazard: () => critter('gull'), hazPop: 'gull!', hazSpeed: 1.2, note: '',
      npcs: [{ x: 3.4, z: 1.6, name: 'her cousin', look: { skin: 0xb9794f, hair: 0x15100e, top: 0xe5484d, legs: 0x2b2b3a, style: 'long' },
        lines: ['you came on the right day. the last day is the good one.', 'he said my dance looked like praising the sun. i am choosing to take that well.', 'get the fry bread while it is still crispy.'] }] },
    build(b, c) {
      sky(0x3f7fd0, 0xffd7a0, 0x7aa0c8); lights(0xcfe4ff, 0x6a5a3a, 1.5, 0xfff0c8, 2.0, 7, 10, 4); fog(0xf2d6a8, 26, 80); orb(60, 40, -120, 9, 0xfff0b0, 2);
      island(b, 12, 0x6fc25a, 0x8a6a4a);
      b.cyl(0, 0, 0, 4.2, .06, 0xd9c08a, 1, 20);                                                           // dance arena
      b.cyl(0, .06, 0, .7, .5, 0x8a4a2a, 1, 10); b.cyl(0, .56, 0, .72, .06, 0xf2e6c8, 1, 10); c.colliders.push({ x: 0, z: 0, r: .9 });   // the drum
      ring(12, 4.4, (x, z, a, i) => { b.cyl(x, 0, z, .07, 1.5, 0x6a4a2a, 1, 5); b.box(x, 1.5, z, .5, .04, .32, [0xe5484d, 0xffd27a, 0x2f9ad0, 0xf2efe6][i % 4], -a); });
      ring(8, 8.6, (x, z, a, i) => { stall(b, x, z, -a + Math.PI / 2, [0xe5484d, 0x2f9ad0, 0xffb347, 0x4fae6a][i % 4]); c.colliders.push({ x, z, r: 1.15 }); }, .4);
      ring(7, 11, (x, z, a, i) => pine(b, x, z, 1.2 + (i % 2) * .4), .1);
      stringLights(b, -6, -6, 6, -6, 2.6, [0xffd27a, 0xe5484d, 0x2f9ad0], 12, .6);
      c.amb.push(ambient({ n: 50, col: 0xfff3c0, size: .1, area: 12, h: 5, add: false, opacity: .6 }));
      c.spawn = { x: 0, z: 6.2 };
    } },

  /* ───────────── 4 · THE WEDDING ───────────── */
  { id: 'wedding', shot: [0, 1.2], prop: 'toast', caption: 'we closed the dance floor', outfit: { him: { top: 0x2a2a33, tie: 0x8a2a3a, legs: 0xc2313a } }, kicker: 'September 7, 2024', title: "Anthony & Nicka's Wedding", sub: 'red pants. rain jacket. no regrets.',
    game: 'rhythm', icon: '♪', stars: [80, 200, 320],
    how: 'Own the dance floor.\n◀ and ▶ on the stick, A in the middle — hit them on the line.',
    P: { time: 36, bpm: 112, bass: [110, 130.8, 146.8, 98] },
    build(b, c) {
      sky(0x231a66, 0x7a52c0, 0x4a3a98, 400); lights(0xc4b8ff, 0x5a8a6a, 2.5, 0xffd8b8, 2.2, 3, 8, 6); fog(0x5a48b0, 30, 90);
      island(b, 13, 0x4aa870, 0x8a6a4a);
      for (let x = -3; x < 3; x++) for (let z = -9; z < 2; z++) b.box(x * 1.5 + .75, 0, z * 1.6, 1.46, .06, 1.56, (x + z) & 1 ? 0x6a52c8 : 0x8a70e8);    // dance floor
      for (const x of [-2.25, -.75, .75, 2.25]) b.box(x, .06, -6.4, .05, .02, 17.6, 0xffffff, 0, .9);
      b.box(-2, 0, -17, .25, 4, .25, 0xf2efe6); b.box(2, 0, -17, .25, 4, .25, 0xf2efe6); b.box(0, 4, -17, 4.6, .3, .3, 0xf2efe6);                        // the arch
      for (let i = 0; i < 9; i++) b.ball(-2 + i * .5, 4.3 + Math.sin(i) * .15, -16.9, .3, [0xff7ab6, 0xf2efe6, 0xffb3d1][i % 3]);
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const x = s * (6.6 + (i % 2)), z = -1 - i * 4.6;                                              // tables
        b.cyl(x, 0, z, .1, .8, 0x3b3030, 1, 6); b.cyl(x, .8, z, 1.1, .08, 0xf2efe6, 1, 12); b.cyl(x, .88, z, .06, .26, 0xfff1c0, 1, 5, 3); }
      for (const s of [-1, 1]) { stringLights(b, s * 4.8, -16, s * 4.8, 3, 3.6, PARTY, 16, .8); for (const z of [-16, 3]) b.cyl(s * 4.8, 0, z, .07, 3.6, 0x3b3030, 1, 5); }
      b.ball(0, 6.2, -6, .7, 0xffffff, 1.6);                                                                // disco ball
      c.amb.push(ambient({ n: 90, col: 0xffd9f0, size: .12, area: 9, h: 7, vy: -.5 }));
    } },

  /* ───────────── 5 · NEW ORLEANS ───────────── */
  { id: 'nola', shot: [0, .4], prop: 'beignet', caption: 'powdered sugar in a thunderstorm', kicker: 'April 2025 · French Quarter', title: 'New Orleans', sub: 'a wedding, a steamboat, a thunderstorm.',
    game: 'catcher', icon: '⚜', stars: [40, 80, 120],
    how: 'Frenchmen Street in the rain.\nCatch beignets and beads. Dodge the timeshare pitch.\nSTICK move · A dash',
    P: { time: 40, every: .58, width: 6, shape: 'ball', col: 0xfff1d6, gold: 0xb04ad9, badCol: 0x8a8f9a, bad: .2, badPop: 'timeshare pitch!', goldPop: 'beads! +3', note: '' },
    build(b, c) {
      sky(0x2a2a78, 0x8a62b8, 0x4a4290); lights(0xc0b8ff, 0x6a6088, 2.6, 0xffd8a8, 2.2, -3, 8, 8); fog(0x5a4a98, 30, 90);
      b.box(0, -.4, 0, 26, .4, 9, 0x6a6690); b.box(0, 0, -3.4, 26, .16, 2.2, 0xa09cb8);
      const cols = [0xd98a5a, 0x5a9a8a, 0xe6c85a, 0xb85a6a, 0x6a7ac8];
      for (let i = 0; i < 5; i++) { const x = -10.4 + i * 5.2, h = 5.4 + (i % 2) * 1.2; house(b, x, -6.6, 5, h, 4, cols[i], 0x2a2433, 0, 0xffc978);
        b.box(x, 2.5, -4.3, 5, .1, .8, 0x1c1a24); for (let k = -4; k <= 4; k++) b.box(x + k * .58, 2.6, -3.95, .05, .7, .05, 0x1c1a24);          // iron balconies
        b.box(x, 3.3, -3.95, 5, .05, .05, 0x1c1a24); stringLights(b, x - 2.4, -3.9, x + 2.4, -3.9, 2.45, [0xb04ad9, 0x4fae6a, 0xffd27a], 8, .25);
        b.ball(x - 1.6, 2.9, -4.2, .35, 0x3f8a4f); b.ball(x + 1.5, 2.9, -4.2, .3, 0x4fae6a); }
      for (const x of [-7.8, -2.6, 2.6, 7.8]) lamp(b, x, -2.6, 0xffc978, 2.6);
      b.box(-9, 0, -2.9, 1.6, .9, .7, 0x2f7a4a); b.box(-9, .9, -2.9, 1.9, .12, 1, 0xf2efe6); b.box(-9, 1.6, -3.1, 1.5, .5, .06, 0xffd27a, 0, 1.8);     // beignet stand
      c.amb.push(ambient({ n: 260, col: 0xaec6ff, size: .07, area: 13, h: 11, vy: -15, drift: 0, add: false, opacity: .55 }));
      c.storm = true;
    } },

  /* ───────────── 6 · WAITING FOR GODOT ───────────── */
  { id: 'godot', shot: [0, 0], prop: 'playbill', caption: 'nothing happens, twice. we loved it.', kicker: 'October 22, 2025 · Hudson Theatre', title: 'Waiting for Godot', sub: 'he never shows. we did, barely.',
    game: 'runner', icon: '★', stars: [30, 70, 110],
    how: 'Curtain is at 2:00. Midtown is in the way.\n◀ ▶ change lane · A jump the low ones',
    P: { time: 38, col: 0xffd77e, shape: 'heart', obsCol: [0xffd23a, 0x8a8f9a, 0xff7ab6], hitPop: 'tourists', note: '', postCol: 0xff7ab6 },
    build(b, c) {
      sky(0x1f1f66, 0x8a52b8, 0x4a3a98, 200); lights(0xc8bcff, 0x6a5a90, 2.6, 0xffb8e0, 2.2, 4, 8, 6); fog(0x5a48a8, 34, 110);
      road(b, 0x5a5878, 0xffd23a);
      b.box(-9.6, -.3, -38, 11, .42, 100, 0xa09cb8); b.box(9.6, -.3, -38, 11, .42, 100, 0xa09cb8);
      for (let i = 0; i < 14; i++) for (const s of [-1, 1]) { const z = 2 - i * 6.6, h = 8 + ((i * 31 + (s > 0 ? 7 : 0)) % 11);
        house(b, s * 8.4, z, 5.4, h, 5.6, [0x6a58c0, 0x7a62d0, 0x5a4ab0][i % 3], 0x3a2f80, s > 0 ? -Math.PI / 2 : Math.PI / 2, [0xffc978, 0xff7ab6, 0x7ad7ff][i % 3]);
        b.box(s * 5.6, 2.6 + (i % 3), z, .12, 1.5 + (i % 2), 3.4, PARTY[(i + (s > 0 ? 1 : 0)) % 4], 0, 2.2); }                                   // neon marquees
      b.box(0, 0, -86, 9, 6.5, 2, 0x6a58c0); b.box(0, 6.5, -85, 10, 1.6, .6, 0xffd77e, 0, 2.4); b.box(0, 3.9, -84.9, 6, 2, .3, 0xffffff, 0, 1.6);   // the theatre
      c.amb.push(ambient({ n: 60, col: 0xffd9f0, size: .1, area: 8, h: 8, vy: -.3 }));
    } },

  /* ───────────── 7 · NOVEMBER 19 ───────────── */
  { id: 'birthday', shot: [0, -8.1], prop: 'cake', caption: 'my only one', kicker: 'November 19 · today', title: 'Happy Birthday', sub: 'one key for every year.',
    game: 'collect', R: 12, icon: '♥', stars: [1, 2, 3], finale: true,
    how: 'The old town again, a little less bleak.\nFind the three keys, then open the box on the dock.',
    P: { count: 3, shape: 'ring', col: 0xffd77e, goal: { x: 0, z: -9.3 }, goalNote: 'three keys. go open the box. (A)',
      npcs: [
        { x: -4.5, z: 2.5, name: 'npc', look: { skin: 0xcfb98a, hair: 0x555060, top: 0xa09060, legs: 0x2a4a35 }, lines: ['you are dreaming. probably. happy birthday anyway.', 'five keys last time. three now. inflation, but backwards.', 'i used to be a person. now i am dialogue. she still looks great though.'] },
        { x: 5, z: -1.5, name: 'npc', look: { skin: 0xe0b890, hair: 0x7a4a2a, top: 0x6a7ac8, legs: 0x3b3030, style: 'bun' }, lines: ['he loves you more than pizza.', 'i am told you love pizza more. this is fine.', 'saw seven blue jays today. felt like a sign.'] },
        { x: -4.2, z: -6.2, name: 'npc', look: { skin: 0xb9794f, hair: 0x15100e, top: 0x4fae6a, legs: 0x2b2b3a }, lines: ['the dock used to lead nowhere. now there is a box on it.', 'time is not real. three years is, though.'] }] },
    build(b, c) {
      sky(0x1c2470, 0x6a66d0, 0x3f48a8, 600); lights(0xb4bcff, 0x4a8a70, 2.6, 0xe4e0ff, 2.2, -4, 9, 5); fog(0x4a52b8, 30, 90); orb(40, 50, -100, 6, 0xfff0d0, 1.7);
      island(b, 12, 0x4aa870, 0x8a6a4a);
      b.box(0, 0, 0, 2, .04, 14, 0x6e6890); b.box(0, 0, 1, 15, .04, 2, 0x6e6890);                                    // crossing paths
      const hs = [[-6, -3.5, 0x8c5d8b], [6, -5, 0x5d6f9c], [-6.5, 5, 0x9c6a5d], [6.2, 5.2, 0x8c5d8b]];
      hs.forEach(([x, z, col], i) => { house(b, x, z, 3.2, 2.4, 2.8, col, 0x6a3f80, x < 0 ? .25 : -.25); b.cone(x, 2.58, z, 2.5, 1.3, 0x55306a, 4); c.colliders.push({ x, z, r: 2.1 }); });
      ring(8, 10.6, (x, z, a, i) => { if (Math.abs(x) < 2.4 && z < 0) return; (i % 2 ? tree : pine)(b, x, z, 1.2); c.colliders.push({ x, z, r: .5 }); }, .2);
      for (const [x, z] of [[-1.6, 3], [1.6, -2.5], [-3.4, -7.4], [1.6, 6]]) { lamp(b, x, z); c.colliders.push({ x, z, r: .2 }); }
      b.box(0, -.1, -10.4, 3, .2, 4.4, 0x7a5a3a); for (const x of [-1.4, 1.4]) for (const z of [-9, -12.2]) b.cyl(x, -1.4, z, .12, 1.6, 0x5a4228, 1, 5);   // the dock
      b.box(0, .1, -10.6, 1.3, 1.1, 1.3, 0xff7ab6); b.box(0, .1, -10.6, 1.34, 1.12, .22, 0xffd77e, 0, 1.5); b.box(0, .1, -10.6, .22, 1.12, 1.34, 0xffd77e, 0, 1.5);
      b.ball(-.2, 1.36, -10.6, .22, 0xffd77e, 1.8); b.ball(.2, 1.36, -10.6, .22, 0xffd77e, 1.8); c.colliders.push({ x: 0, z: -10.6, r: .95 });
      stringLights(b, -6, -3.5, 6, -5, 3.2, PARTY, 14, .9); stringLights(b, -6.5, 5, 6.2, 5.2, 3.2, PARTY, 14, .9);
      c.amb.push(ambient({ n: 120, col: 0xffe9a0, size: .13, area: 12, h: 5 }));
      c.spawn = { x: 0, z: 7.5 };
    } },
];

/* the title-screen diorama */
export function titleScene(look1, look2) {
  sky(0x1c2470, 0x6a66d0, 0x3f48a8, 700); lights(0xb4bcff, 0x4a8a70, 2.6, 0xffe0c0, 2.2, 4, 8, 6); fog(0x4a52b8, 34, 100); orb(-26, 22, -60, 5, 0xfff0d0, 1.7);
  const b = new Batch();
  island(b, 6, 0x4aa870, 0x8a6a4a);
  house(b, -1.8, -1.6, 3, 2.3, 2.6, 0x8c5d8b, 0x6a3f80, .3); b.cone(-1.8, 2.48, -1.6, 2.4, 1.3, 0x55306a, 4);
  tree(b, 3.2, -1.4, 1.5); pine(b, -4.2, 1.2, 1.2); pine(b, 4.2, 2.2, .9); lamp(b, 1.2, 1.8);
  stringLights(b, -1.8, -.2, 3.2, -1.4, 2.7, PARTY, 12, .7);
  b.box(.6, 0, 2.6, 1.6, .45, .5, 0x5a3a26);
  for (let i = 0; i < 3; i++) { const a = i * 2.1; b.cyl(Math.cos(a) * 11, -3 - i, Math.sin(a) * 11 - 6, 1.4 - i * .3, .3, 0x2f6a4a, 1, 9); b.cyl(Math.cos(a) * 11, -4.2 - i, Math.sin(a) * 11 - 6, .3, 1.2, 0x8a6a4a, 4, 7); }
  b.build();
  const a = makeChar(look1), t = makeChar(look2); a.g.position.set(.25, 0, 3.3); t.g.position.set(1.05, 0, 3.3); a.face = .3; t.face = -.3; world.add(a.g, t.g);
  return { chars: [a, t], amb: ambient({ n: 90, col: 0xffe9a0, size: .12, area: 7, h: 5 }) };
}
export { npcMesh };
